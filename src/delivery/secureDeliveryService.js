import { authService, readAuthState, writeAuthState } from "../auth/authService.js";
import { readLicenceState, writeLicenceState } from "../licences/licenceService.js";
import { readContractState } from "../contracts/contractService.js";
import { readPaymentState } from "../payments/paymentService.js";
import { buyerVerificationService } from "../verification/buyerVerificationService.js";
import { membershipService } from "../membership/membershipService.js";
import { readStorageState } from "../storage/storageService.js";
import { DEFAULT_SECURE_DELIVERY_STATE, DELIVERY_STATUSES, SECURE_DELIVERY_STORAGE_KEY, SELECTED_DELIVERY_KEY } from "./secureDeliveryData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const can = (user, permission) => user?.permissions?.includes("*") || user?.permissions?.includes(permission);
const activeLicenceStatuses = ["Active", "Active with Conditions", "Amended", "Renewed", "Expiring Soon"];
const activePackageStatuses = ["Active", "Partially Downloaded", "Completed", "Expiring Soon", "Replacement Ready"];

function parse(value) { try { return JSON.parse(value); } catch { return null; } }
function merge(current = [], defaults = []) { return [...current, ...defaults.filter((item) => !current.some((existing) => existing.id === item.id))]; }
function normalize(value) {
  const base = clone(DEFAULT_SECURE_DELIVERY_STATE);
  if (!value || !Array.isArray(value.packages)) return base;
  const packageDefaults = new Map(base.packages.map((item) => [item.id, item]));
  const packages = merge(value.packages, base.packages).map((item) => {
    const fallback = packageDefaults.get(item.id) || {};
    const released = activePackageStatuses.includes(item.status);
    return {
      ...fallback,
      ...item,
      access: { ...(fallback.access || {}), ...(item.access || {}) },
      recipient: item.recipient || fallback.recipient || {
        userId: item.buyerId,
        name: item.buyer,
        email: "Approved account email",
      },
      watermarkIdentifier:
        item.watermarkIdentifier || fallback.watermarkIdentifier ||
        `BM-${item.licenceReference || item.licenceId}-${item.buyerId}`,
      linkVersion: item.linkVersion || fallback.linkVersion || 1,
      termsAcceptance: item.termsAcceptance || fallback.termsAcceptance || {
        status: released ? "Accepted" : "Pending",
        version: "Delivery Terms v1.0",
        acceptedAt: released ? item.activatedAt : null,
        acceptedBy: released ? item.buyer : null,
      },
      deliveryConfirmation: item.deliveryConfirmation ||
        fallback.deliveryConfirmation || { status: "Pending", confirmedAt: null },
    };
  });
  const sessionDefaults = new Map(base.sessions.map((item) => [item.id, item]));
  const sessions = merge(value.sessions, base.sessions).map((item) => ({
    ...(sessionDefaults.get(item.id) || {}),
    ...item,
  }));
  return {
    ...base, ...value,
    authorizations: merge(value.authorizations, base.authorizations), packages, packageVersions: merge(value.packageVersions, base.packageVersions), manifests: merge(value.manifests, base.manifests),
    entitlements: merge(value.entitlements, base.entitlements), sessions, extensionRequests: merge(value.extensionRequests, base.extensionRequests), replacementRecords: merge(value.replacementRecords, base.replacementRecords),
    suspensions: value.suspensions || [], revocations: value.revocations || [], activity: value.activity || [], notifications: value.notifications || [], analyticsEvents: value.analyticsEvents || [],
  };
}

export function readSecureDeliveryState() {
  const raw = localStorage.getItem(SECURE_DELIVERY_STORAGE_KEY);
  const state = normalize(raw ? parse(raw) : null);
  if (!raw || !parse(raw)) localStorage.setItem(SECURE_DELIVERY_STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function writeSecureDeliveryState(state) { const next = normalize(state); localStorage.setItem(SECURE_DELIVERY_STORAGE_KEY, JSON.stringify(next)); return next; }
function mutate(fn) { const state = readSecureDeliveryState(); const result = fn(state); writeSecureDeliveryState(state); return result; }
function requirePermission(user, permission) { if (!can(user, permission)) throw new Error("You do not have permission to perform this secure-delivery action."); }

function activity(state, user, delivery, action, description, options = {}) {
  const event = { id: uid("delivery-event"), actor: user?.name || "Secure delivery service", userId: user?.id || null, buyer: delivery?.buyer, organization: delivery?.organization, project: delivery?.project, licence: delivery?.licenceReference, delivery: delivery?.reference, asset: options.asset || null, timestamp: now(), action, description, before: options.before || null, after: options.after || null, source: "Secure Delivery", visibility: options.visibility || "Internal" };
  state.activity.unshift(event); return event;
}
function notify(userId, title, body, action = "buyer-deliveries") {
  if (!userId) return;
  const auth = readAuthState();
  auth.messages.unshift({ id: uid("delivery-message"), userId, type: "secure-delivery", title, body, createdAt: now(), read: false, action });
  writeAuthState(auth);
}

export function canTransitionDeliveryStatus(current, next) { return Boolean(DELIVERY_STATUSES[current]?.next.includes(next) || next === "Archived"); }

export function checkDuplicateDeliveryPackage(context, packages = readSecureDeliveryState().packages) {
  return packages.filter((item) => item.id !== context.id && item.authorizationId === context.authorizationId && item.licenceId === context.licenceId && !["Cancelled", "Archived", "Superseded", "Revoked"].includes(item.status));
}

function findLicence(id) { return readLicenceState().licences.find((item) => item.id === id) || null; }
function findContract(id) { return readContractState().contracts.find((item) => item.id === id) || null; }
function findAuthorization(id) { return readSecureDeliveryState().authorizations.find((item) => item.id === id) || null; }
function userVerification(userId) { try { return buyerVerificationService.getByUser(userId); } catch { return null; } }
function userMembership(userId) { try { return membershipService.getCurrentMembership(userId); } catch { return null; } }

export function calculateSecureDeliveryReadiness(context) {
  const delivery = context?.delivery || context;
  const authorization = context?.authorization || findAuthorization(delivery?.authorizationId);
  const licence = context?.licence || findLicence(delivery?.licenceId);
  const contract = context?.contract || findContract(licence?.contractId);
  const verification = context?.verification || userVerification(delivery?.buyerId);
  const membership = context?.membership || userMembership(delivery?.buyerId);
  const paymentState = readPaymentState();
  const relatedInvoices = paymentState.invoices.filter((item) => item.contractId === licence?.contractId && !["Cancelled", "Void"].includes(item.status));
  const paymentComplete = delivery?.paymentState === "Paid in Full" || (relatedInvoices.length > 0 && relatedInvoices.every((item) => item.balanceDue === 0));
  const storageAssets = readStorageState().assets;
  const requiredAssets = (delivery?.assetEntries || []).filter((entry) => entry.required);
  const pendingAssets = requiredAssets.filter((entry) => {
    const stored = storageAssets.find((asset) => asset.id === entry.assetId);
    return !["Ready", "Ready with Warning", "Downloaded", "Download Limit Reached"].includes(entry.status) || Boolean(stored && (!["Ready", "Ready with Warning"].includes(stored.status) || stored.current === false || stored.version !== entry.assetVersion));
  });
  const warnings = (delivery?.assetEntries || []).filter((entry) => entry.sizeBytes > 2_000_000_000).map((entry) => `${entry.displayName} is larger than 2 GB`);
  const rightsCleared = Boolean(
    licence &&
    ["Eligible", "Cleared"].includes(licence.rightsSnapshot?.eligibility) &&
    ["Rights Verified", "Verified", "Cleared"].includes(licence.rightsSnapshot?.verificationState),
  );
  const dependencies = {
    licence: licence && activeLicenceStatuses.includes(licence.status) && licence.issuedAt && licence.documentAssetId ? "Complete" : "Blocked",
    contract: contract && ["Fully Signed", "Countersigned", "Effective", "Completed"].includes(contract.status) ? "Complete" : "Blocked",
    payment: paymentComplete ? "Complete" : "Blocked",
    rights: rightsCleared && delivery?.status !== "Suspended" ? "Complete" : "Blocked",
    buyerVerification: verification && ["Approved", "Approved with Restrictions", "Reinstated"].includes(verification.status) ? "Complete" : "Blocked",
    membership: membership ? (["Active", "Complimentary"].includes(membership.status) ? "Complete" : "Blocked") : delivery?.buyerId?.startsWith("buyer-") ? "Not Applicable" : "Warning",
    authorization: authorization?.status === "Approved" ? "Complete" : ["Revoked", "Suspended", "Payment Blocked"].includes(authorization?.status) ? "Blocked" : "Incomplete",
    assets: pendingAssets.length ? "Incomplete" : "Complete",
    expiry: delivery?.expiresAt ? "Complete" : "Incomplete",
    downloadLimits: delivery?.access?.maxDownloadsPerAsset > 0 && delivery?.access?.maxTotalDownloads > 0 ? "Complete" : "Incomplete",
    namedAccess: delivery?.access?.organizationWide || delivery?.access?.namedUserIds?.length ? "Complete" : "Incomplete",
    adminApproval: delivery?.approvals?.length > 0 && delivery.approvals.every((item) => item.status === "Approved") ? "Complete" : "Blocked",
    downloadTerms: delivery?.termsAcceptance?.status === "Accepted" ? "Complete" : "Blocked",
  };
  const labels = { licence: "Active issued licence", contract: "Executed contract link", payment: "Required licensing payment", rights: "Rights delivery conditions", buyerVerification: "Buyer verification", membership: "Membership delivery access", authorization: "Current delivery authorization", assets: "Required asset readiness", expiry: "Package expiry", downloadLimits: "Download limits", namedAccess: "Named user or organization access", adminApproval: "All required admin approvals", downloadTerms: "Buyer acceptance of download terms" };
  const blockers = Object.entries(dependencies).filter(([, status]) => ["Blocked", "Incomplete"].includes(status)).map(([key]) => labels[key]);
  pendingAssets.forEach((entry) => blockers.push(`${entry.displayName} is not ready`));
  const completeCount = Object.values(dependencies).filter((value) => ["Complete", "Not Applicable"].includes(value)).length;
  const percentage = Math.round((completeCount / Object.keys(dependencies).length) * 100);
  let status = blockers.length ? (pendingAssets.length ? "Pending Asset Preparation" : "Readiness Incomplete") : "Ready to Activate";
  if (delivery?.status === "Suspended") status = "Suspended";
  if (delivery?.status === "Revoked") status = "Revoked";
  return { ready: blockers.length === 0, percentage, status, blockers: [...new Set(blockers)], warnings, dependencies, licence, contract, authorization };
}

export function canDownloadDeliveryAsset(assetEntry, userContext, deliveryContext) {
  const state = readSecureDeliveryState();
  const delivery = deliveryContext?.delivery || deliveryContext;
  const user = userContext?.user || userContext;
  const entitlement = state.entitlements.find((item) => item.deliveryPackageId === delivery?.id && item.assetEntryId === assetEntry?.id && (item.userId === user?.id || item.organizationId === user?.organizationId));
  const authorization = state.authorizations.find((item) => item.id === delivery?.authorizationId);
  const licence = findLicence(delivery?.licenceId);
  const remaining = entitlement ? Math.max(0, entitlement.downloadLimit - entitlement.downloadCount) : Math.max(0, (assetEntry?.downloadLimit || 0) - (assetEntry?.downloadCount || 0));
  const deny = (code, reason, requiresApproval = false) => ({ allowed: false, reason, code, downloadsRemaining: remaining, expiresAt: delivery?.expiresAt, requiresApproval });
  if (!delivery || !assetEntry) return deny("DELIVERY_MISSING", "Delivery asset is unavailable.");
  if (delivery.buyerId !== user?.id && delivery.organizationId !== user?.organizationId && !can(user, "deliveries.view")) return deny("ORGANIZATION_MISMATCH", "This delivery belongs to another organization.");
  if (!DELIVERY_STATUSES[delivery.status]?.download) return deny("PACKAGE_UNAVAILABLE", delivery.status === "Suspended" ? "Delivery access is temporarily unavailable while licensing conditions are reviewed." : `This package is ${delivery.status.toLowerCase()}.`);
  const readiness = calculateSecureDeliveryReadiness(delivery);
  if (!readiness.ready) return deny("RELEASE_CONDITIONS_INCOMPLETE", `Protected assets remain locked: ${readiness.blockers.join(", ")}.`, true);
  if (authorization?.status !== "Approved") return deny("AUTHORIZATION_INVALID", "The delivery authorization is not active.");
  if (licence && !activeLicenceStatuses.includes(licence.status)) return deny("LICENCE_INVALID", "The linked licence is not active.");
  if (!authorization?.approvedAssetIds.includes(assetEntry.assetId) || !authorization?.approvedAssetTypes.includes(assetEntry.assetType)) return deny("ASSET_NOT_APPROVED", "This asset is not included in the exact delivery authorization.");
  if (!["Ready", "Ready with Warning", "Downloaded"].includes(assetEntry.status)) return deny("ASSET_NOT_READY", `This asset is ${assetEntry.status.toLowerCase()}.`);
  const storedAsset = readStorageState().assets.find((item) => item.id === assetEntry.assetId);
  if (storedAsset && (!["Ready", "Ready with Warning"].includes(storedAsset.status) || storedAsset.current === false || storedAsset.version !== assetEntry.assetVersion)) return deny("STORAGE_VERSION_INVALID", "The locked storage asset version is no longer delivery-ready.", true);
  if (new Date(delivery.expiresAt).getTime() <= Date.now()) return deny("PACKAGE_EXPIRED", "This secure-delivery access has expired.", true);
  if (!entitlement) return deny("ENTITLEMENT_MISSING", "No download entitlement exists for this user.", true);
  if (["Revoked", "Suspended", "Expired", "Cancelled"].includes(entitlement.status)) return deny("ENTITLEMENT_INACTIVE", `The entitlement is ${entitlement.status.toLowerCase()}.`);
  if (remaining <= 0) return deny("DOWNLOAD_LIMIT_REACHED", "The download limit has been reached.", true);
  return { allowed: true, reason: "Authorized for one short-lived simulated download session.", code: "AUTHORIZED", downloadsRemaining: remaining, expiresAt: delivery.expiresAt, requiresApproval: false };
}

function makeManifest(state, delivery, user) {
  const manifest = { id: uid("manifest"), packageId: delivery.id, reference: `BM-MAN-${new Date().getUTCFullYear()}-${String(++state.lastNumbers.manifest).padStart(4, "0")}`, version: delivery.version, deliveryReference: delivery.reference, licenceReference: delivery.licenceReference, buyer: delivery.buyer, organization: delivery.organization, project: delivery.project, track: delivery.trackTitle, artist: delivery.artist, assets: delivery.assetEntries.map((item) => ({ displayName: item.displayName, assetType: item.assetType, version: item.assetVersion, sizeBytes: item.sizeBytes, checksumPlaceholder: item.checksumPlaceholder })), expiresAt: delivery.expiresAt, downloadLimits: { perAsset: delivery.access.maxDownloadsPerAsset, total: delivery.access.maxTotalDownloads }, restrictions: delivery.restrictions, generatedAt: now(), generatedBy: user.name, current: true };
  state.manifests.filter((item) => item.packageId === delivery.id).forEach((item) => { item.current = false; }); state.manifests.unshift(manifest); delivery.manifest = { id: manifest.id, reference: manifest.reference, version: manifest.version, generatedAt: manifest.generatedAt, generatedBy: user.name, current: true }; return manifest;
}

function syncLicence(delivery, deliveryStatus) {
  const state = readLicenceState();
  const licence = state.licences.find((item) => item.id === delivery.licenceId);
  if (licence) { licence.deliveryAuthorizationId = delivery.authorizationId; licence.metadata = { ...(licence.metadata || {}), deliveryPackageId: delivery.id, deliveryPackageReference: delivery.reference, deliveryStatus }; licence.updatedAt = now(); writeLicenceState(state); }
}

function createEntitlements(state, delivery) {
  delivery.assetEntries.forEach((asset) => delivery.access.namedUserIds.forEach((userId) => {
    if (state.entitlements.some((item) => item.deliveryPackageId === delivery.id && item.assetEntryId === asset.id && item.userId === userId)) return;
    state.entitlements.push({ id: uid("entitlement"), deliveryPackageId: delivery.id, assetEntryId: asset.id, userId, organizationId: delivery.organizationId, status: "Active", downloadLimit: asset.downloadLimit || delivery.access.maxDownloadsPerAsset, downloadCount: asset.downloadCount || 0, validFrom: delivery.validFrom, expiresAt: delivery.expiresAt, lastAccessedAt: null, revokedAt: null, revocationReason: null, metadata: { createdFromPackageVersion: delivery.version } });
  }));
}

export const secureDeliveryService = {
  getState: readSecureDeliveryState,
  resetSecureDeliveryDemoData() { localStorage.removeItem(SECURE_DELIVERY_STORAGE_KEY); localStorage.removeItem(SELECTED_DELIVERY_KEY); return readSecureDeliveryState(); },
  select(id) { localStorage.setItem(SELECTED_DELIVERY_KEY, id); }, selected() { return localStorage.getItem(SELECTED_DELIVERY_KEY); },
  getDelivery(id) { return readSecureDeliveryState().packages.find((item) => item.id === id) || null; },
  getBuyerDeliveries(user = authService.getCurrentUser()) { return readSecureDeliveryState().packages.filter((item) => item.buyerId === user?.id || item.organizationId === user?.organizationId); },
  getDeliveryQueue() { return readSecureDeliveryState().packages; },
  getEligibleAuthorizations() { const state = readSecureDeliveryState(); return state.authorizations.map((authorization) => ({ authorization, licence: findLicence(authorization.licenceId), packages: state.packages.filter((item) => item.authorizationId === authorization.id) })); },
  createDeliveryPackage(values, user = authService.getCurrentUser()) {
    requirePermission(user, "deliveries.create");
    return mutate((state) => {
      const authorization = state.authorizations.find((item) => item.id === values.authorizationId); if (!authorization) throw new Error("Delivery authorization was not found.");
      if (authorization.status !== "Approved") throw new Error("Only an approved delivery authorization can create a package.");
      const licence = findLicence(authorization.licenceId); if (!licence || !activeLicenceStatuses.includes(licence.status)) throw new Error("An active issued licence is required.");
      const selectedAssetIds = values.assetIds || authorization.approvedAssetIds; if (selectedAssetIds.some((id) => !authorization.approvedAssetIds.includes(id))) throw new Error("An unapproved asset cannot be added to this package.");
      const duplicateContext = { authorizationId: authorization.id, licenceId: authorization.licenceId };
      if (checkDuplicateDeliveryPackage(duplicateContext, state.packages).length && !values.overrideReason) throw new Error("An active or pending package already exists. Enter a controlled override reason.");
      const deliveryId = uid("delivery-package-draft");
      const approvedPairs = selectedAssetIds.map((assetId, index) => ({ assetId, type: authorization.approvedAssetTypes[index] || "Approved asset" }));
      const documentPairs = approvedPairs.filter((item) => /document|cue-sheet/i.test(item.type));
      const assetEntries = approvedPairs.filter((item) => !/document|cue-sheet/i.test(item.type)).map(({ assetId, type }) => ({ id: uid("delivery-entry"), deliveryPackageId: deliveryId, assetId, assetVersion: 1, assetType: type, displayName: type, fileName: `${type.toLowerCase().replaceAll(" ", "-")}-locked-v1.${type.includes("Stems") ? "zip" : "wav"}`, sizeBytes: type.includes("Stems") ? 682000000 : 86400000, checksumPlaceholder: `demo-sha256-${assetId}-v1`, status: "Ready", required: true, downloadLimit: values.maxDownloadsPerAsset || 3, downloadCount: 0, firstDownloadedAt: null, lastDownloadedAt: null, expiresAt: values.expiresAt, replacedBy: null, notes: [], format: type.includes("Stems") ? "ZIP" : "WAV", approvalDate: now() }));
      const documentEntries = [...(values.documentEntries || []), ...documentPairs.map(({ assetId, type }) => ({ id: uid("delivery-document"), type, displayName: type, assetId, version: 1 }))];
      const delivery = { id: deliveryId, reference: null, authorizationId: authorization.id, licenceId: licence.id, licenceReference: licence.reference, licenceVersion: licence.version, buyerId: authorization.buyerId, buyer: licence.buyer, organizationId: authorization.organizationId, organization: licence.organization, projectId: authorization.projectId, project: licence.project, trackId: authorization.trackId, trackTitle: licence.trackTitle, artist: licence.artist, version: 1, status: "Draft", packageType: values.packageType || "Secure download package", assetEntries, documentEntries, deliveryNotes: { buyer: values.buyerNote || "Your approved delivery package is being prepared.", internal: values.internalNote || values.overrideReason || "" }, manifest: null, validFrom: values.validFrom || now(), expiresAt: values.expiresAt, activatedAt: null, completedAt: null, supersededBy: null, previousVersionId: null, changeSummary: values.overrideReason ? `Controlled duplicate override: ${values.overrideReason}` : null, recipient: values.recipient || { userId: authorization.buyerId, name: licence.buyer, email: "Approved account email" }, watermarkIdentifier: values.watermarkIdentifier || `BM-${licence.reference}-${authorization.buyerId}`, linkVersion: 1, linkRegeneratedAt: null, termsAcceptance: { status: "Pending", version: "Delivery Terms v1.0", acceptedAt: null, acceptedBy: null }, deliveryConfirmation: { status: "Pending", confirmedAt: null }, access: { namedUserIds: values.namedUserIds?.length ? values.namedUserIds : authorization.namedUserIds, organizationWide: Boolean(values.organizationWide), organizationAdminUserId: authorization.buyerId, maxActiveSessions: values.maxActiveSessions || 2, maxDevices: values.maxDevices || 3, maxDownloadsPerAsset: values.maxDownloadsPerAsset || authorization.maxDownloadsPerAsset, maxTotalDownloads: values.maxTotalDownloads || authorization.maxTotalDownloads, territoryRestrictions: authorization.territoryRestrictions || [], additionalApprovalRequired: Boolean(authorization.additionalApprovalRequired) }, approvals: ["Licensing", "Media", "Rights", "Finance"].map((type) => ({ id: uid("delivery-approval"), type, status: "Pending", approver: null, note: "", date: null })), restrictions: authorization.restrictions || [], owner: user.name, createdAt: now(), createdBy: user.name, updatedAt: now(), paymentState: licence.paymentState || "Pending" };
      state.packages.unshift(delivery); activity(state, user, delivery, "Package draft created", "A secure-delivery draft was created with exact authorization, licence, asset, and access versions.", { after: { assetIds: selectedAssetIds } }); localStorage.setItem(SELECTED_DELIVERY_KEY, delivery.id); return delivery;
    });
  },
  requestApproval(id, user = authService.getCurrentUser()) { requirePermission(user, "deliveries.edit"); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); const readiness = calculateSecureDeliveryReadiness(delivery); delivery.status = readiness.status === "Pending Asset Preparation" ? readiness.status : "Pending Approval"; delivery.updatedAt = now(); activity(state, user, delivery, "Approval requested", readiness.ready ? "Package submitted for internal delivery approval." : `Approval requested with blockers: ${readiness.blockers.join(", ")}.`); return delivery; }); },
  approve(id, type, user = authService.getCurrentUser()) { requirePermission(user, type === "Media" ? "deliveries.manage_assets" : type === "Rights" ? "deliveries.suspend" : type === "Finance" ? "deliveries.confirm_payment" : "deliveries.approve"); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); const approval = delivery.approvals.find((item) => item.type === type); approval.status = "Approved"; approval.approver = user.name; approval.date = now(); approval.note = "Approved against the current package snapshot."; if (delivery.approvals.every((item) => item.status === "Approved") && calculateSecureDeliveryReadiness(delivery).ready) delivery.status = "Ready to Activate"; activity(state, user, delivery, `${type} approval recorded`, "Delivery approval recorded without changing locked asset versions."); return delivery; }); },
  generateDeliveryManifest(id, user = authService.getCurrentUser()) { requirePermission(user, "manifests.generate"); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); const manifest = makeManifest(state, delivery, user); activity(state, user, delivery, "Manifest generated", `${manifest.reference} records buyer-safe package metadata and locked versions.`); return manifest; }); },
  activateDelivery(id, user = authService.getCurrentUser()) { requirePermission(user, "deliveries.activate"); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); const readiness = calculateSecureDeliveryReadiness(delivery); if (!readiness.ready) throw new Error(readiness.blockers.join(". ")); if (delivery.approvals.some((item) => item.status !== "Approved")) throw new Error("All required internal approvals are required before activation."); if (!delivery.manifest) makeManifest(state, delivery, user); if (!delivery.reference) delivery.reference = `BM-DEL-${new Date().getUTCFullYear()}-${String(++state.lastNumbers.delivery).padStart(4, "0")}`; delivery.status = "Active"; delivery.activatedAt = now(); delivery.validFrom = now(); delivery.assetEntries.forEach((item) => { item.approvalDate = now(); item.expiresAt = delivery.expiresAt; }); createEntitlements(state, delivery); syncLicence(delivery, "Active"); activity(state, user, delivery, "Package activated", "Asset versions were locked, buyer entitlements were created, and no raw storage URL was exposed."); notify(delivery.buyerId, "Secure delivery ready", `${delivery.reference} is ready in your project delivery room.`, "buyer-delivery"); return delivery; }); },
  createDownloadSession(deliveryId, assetEntryId, user = authService.getCurrentUser()) {
    requirePermission(user, "downloads.create_session");
    return mutate((state) => { const delivery = state.packages.find((item) => item.id === deliveryId); const asset = delivery?.assetEntries.find((item) => item.id === assetEntryId); const access = canDownloadDeliveryAsset(asset, user, delivery); if (!access.allowed) { activity(state, user, delivery, "Download denied", access.reason, { asset: asset?.displayName, visibility: "Organization" }); throw new Error(access.reason); } const session = { id: uid("download-session"), deliveryPackageId: deliveryId, assetEntryId, userId: user.id, organizationId: user.organizationId, token: `bm_download_${Math.random().toString(16).slice(2, 10)}`, status: "Authorized", createdAt: now(), startedAt: null, completedAt: null, failedAt: null, expiresAt: new Date(Date.now() + state.settings.tokenMinutes * 60000).toISOString(), bytesTransferred: 0, failureCode: null, device: "Current browser · Simulated", ipAddress: "198.51.100.24 · simulated", approximateLocation: "Approximate region unavailable" }; state.sessions.unshift(session); activity(state, user, delivery, "Download session created", "A short-lived, single-asset simulated token was created.", { asset: asset.displayName, visibility: "Organization" }); return { ...session, tokenLabel: "Short-lived simulated token" }; });
  },
  completeDownloadSession(sessionId, user = authService.getCurrentUser()) { requirePermission(user, "downloads.complete"); return mutate((state) => { const session = state.sessions.find((item) => item.id === sessionId); const delivery = state.packages.find((item) => item.id === session.deliveryPackageId); const asset = delivery.assetEntries.find((item) => item.id === session.assetEntryId); if (["Revoked", "Expired"].includes(session.status) || new Date(session.expiresAt) <= new Date()) throw new Error("This download session is no longer valid."); const freshAccess = canDownloadDeliveryAsset(asset, user, delivery); if (!freshAccess.allowed) { session.status = "Failed"; session.failedAt = now(); session.failureCode = freshAccess.code; activity(state, user, delivery, "Download failed", freshAccess.reason, { asset: asset.displayName, visibility: "Organization" }); throw new Error(freshAccess.reason); } session.status = "Completed"; session.startedAt ||= now(); session.completedAt = now(); session.bytesTransferred = asset.sizeBytes; asset.downloadCount += 1; asset.firstDownloadedAt ||= now(); asset.lastDownloadedAt = now(); if (asset.downloadCount >= asset.downloadLimit) asset.status = "Download Limit Reached"; else asset.status = "Downloaded"; const entitlement = state.entitlements.find((item) => item.deliveryPackageId === delivery.id && item.assetEntryId === asset.id && (item.userId === user.id || item.organizationId === user.organizationId)); entitlement.downloadCount += 1; entitlement.lastAccessedAt = now(); entitlement.status = entitlement.downloadCount >= entitlement.downloadLimit ? "Download Limit Reached" : "Partially Used"; const required = delivery.assetEntries.filter((item) => item.required); delivery.status = required.every((item) => item.downloadCount > 0) ? "Completed" : "Partially Downloaded"; if (delivery.status === "Completed") delivery.deliveryConfirmation = { status: "Confirmed", confirmedAt: now(), confirmedBy: user.name, method: "Required assets downloaded" }; if (delivery.assetEntries.every((item) => item.downloadCount >= item.downloadLimit)) delivery.status = "Download Limit Reached"; activity(state, user, delivery, "Download completed", "The simulated transfer completed and one entitlement use was recorded.", { asset: asset.displayName, before: { downloadCount: asset.downloadCount - 1 }, after: { downloadCount: asset.downloadCount }, visibility: "Organization" }); if (asset.assetType.toLowerCase().includes("stem")) notify("user-noah", "Sensitive stems downloaded", `${user.name} completed a simulated stems download for ${delivery.reference}.`, "admin-delivery-detail"); return { session, asset, entitlement, delivery }; }); },
  acceptDownloadTerms(id, user = authService.getCurrentUser()) { return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); if (!delivery || (delivery.buyerId !== user?.id && delivery.organizationId !== user?.organizationId)) throw new Error("These delivery terms are outside your organization."); delivery.termsAcceptance = { status: "Accepted", version: "Delivery Terms v1.0", acceptedAt: now(), acceptedBy: user.name }; activity(state, user, delivery, "Download terms accepted", "The buyer accepted the current simulated delivery terms for this exact package version.", { visibility: "Organization" }); return delivery.termsAcceptance; }); },
  extendDeliveryExpiry(id, expiresAt, user = authService.getCurrentUser()) { requirePermission(user, "deliveries.manage_expiry"); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); const before = delivery.expiresAt; delivery.expiresAt = expiresAt; delivery.assetEntries.forEach((item) => { item.expiresAt = expiresAt; }); state.entitlements.filter((item) => item.deliveryPackageId === id).forEach((item) => { item.expiresAt = expiresAt; }); delivery.updatedAt = now(); activity(state, user, delivery, "Expiry extended", "The package expiry was extended without restoring any inactive entitlement.", { before: { expiresAt: before }, after: { expiresAt } }); return delivery; }); },
  regenerateDeliveryLink(id, user = authService.getCurrentUser()) { requirePermission(user, "deliveries.manage_expiry"); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); delivery.linkVersion = (delivery.linkVersion || 1) + 1; delivery.linkRegeneratedAt = now(); state.sessions.filter((item) => item.deliveryPackageId === id && !["Completed", "Failed", "Revoked"].includes(item.status)).forEach((item) => { item.status = "Revoked"; }); activity(state, user, delivery, "Delivery link regenerated", `Link version ${delivery.linkVersion} created; outstanding sessions were revoked and no reusable URL was stored.`); return delivery; }); },
  failDownloadSession(sessionId, code = "NETWORK_INTERRUPTED", user = authService.getCurrentUser()) { requirePermission(user, "downloads.complete"); return mutate((state) => { const session = state.sessions.find((item) => item.id === sessionId); const delivery = state.packages.find((item) => item.id === session.deliveryPackageId); const asset = delivery.assetEntries.find((item) => item.id === session.assetEntryId); session.status = "Failed"; session.failedAt = now(); session.failureCode = code; session.bytesTransferred = Math.round(asset.sizeBytes * 0.18); activity(state, user, delivery, "Download failed", "The simulated transfer was interrupted. No download count was consumed.", { asset: asset.displayName, visibility: "Organization" }); return session; }); },
  retryDownload(sessionId, user = authService.getCurrentUser()) { requirePermission(user, "downloads.retry"); const failed = readSecureDeliveryState().sessions.find((item) => item.id === sessionId); if (!failed || failed.status !== "Failed") throw new Error("Only a failed download may be retried."); return this.createDownloadSession(failed.deliveryPackageId, failed.assetEntryId, user); },
  requestDeliveryExtension(id, values, user = authService.getCurrentUser()) { requirePermission(user, "deliveries.request_extension_own"); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); if (delivery.buyerId !== user.id && delivery.organizationId !== user.organizationId) throw new Error("This delivery is outside your organization."); const request = { id: uid("delivery-extension"), deliveryPackageId: id, buyerId: user.id, organizationId: user.organizationId, requestType: values.requestType, reason: values.reason, requiredDate: values.requiredDate || null, namedUser: values.namedUser || null, assetEntryId: values.assetEntryId || null, message: values.message || "", status: "Pending Review", createdAt: now() }; state.extensionRequests.unshift(request); activity(state, user, delivery, "Extension requested", `${values.requestType}: ${values.reason}`, { visibility: "Organization" }); notify("user-jordan", "Delivery access request", `${user.name} requested ${values.requestType.toLowerCase()} for ${delivery.reference || delivery.project}.`, "admin-delivery-access"); return request; }); },
  decideExtension(requestId, decision, values = {}, user = authService.getCurrentUser()) { requirePermission(user, "deliveries.manage_expiry"); return mutate((state) => { const request = state.extensionRequests.find((item) => item.id === requestId); const delivery = state.packages.find((item) => item.id === request.deliveryPackageId); request.status = decision; request.decidedAt = now(); request.decidedBy = user.name; request.decisionReason = values.reason; if (decision === "Approved") { if (values.expiresAt) { delivery.expiresAt = values.expiresAt; delivery.assetEntries.forEach((item) => { item.expiresAt = values.expiresAt; }); state.entitlements.filter((item) => item.deliveryPackageId === delivery.id).forEach((item) => { item.expiresAt = values.expiresAt; if (item.status === "Expired") item.status = "Active"; }); } if (values.extraDownloads) { delivery.assetEntries.forEach((item) => { item.downloadLimit += Number(values.extraDownloads); }); state.entitlements.filter((item) => item.deliveryPackageId === delivery.id).forEach((item) => { item.downloadLimit += Number(values.extraDownloads); if (item.status === "Download Limit Reached") item.status = "Partially Used"; }); } if (["Expired", "Download Limit Reached"].includes(delivery.status)) delivery.status = "Active"; } activity(state, user, delivery, `Extension ${decision.toLowerCase()}`, values.reason || "Delivery-access request reviewed."); notify(request.buyerId, `Delivery request ${decision.toLowerCase()}`, values.buyerMessage || `Your ${request.requestType.toLowerCase()} request was ${decision.toLowerCase()}.`, "buyer-delivery"); return request; }); },
  createReplacementPackage(id, assetEntryId, replacement, user = authService.getCurrentUser()) { requirePermission(user, "deliveries.replace_assets"); return mutate((state) => { const original = state.packages.find((item) => item.id === id); const oldAsset = original.assetEntries.find((item) => item.id === assetEntryId); const replacementId = uid("delivery-package-replacement"); const newVersion = original.version + 1; const replacementAsset = { ...clone(oldAsset), id: uid("delivery-entry-replacement"), deliveryPackageId: replacementId, assetId: replacement.assetId, assetVersion: replacement.assetVersion, displayName: replacement.displayName || `${oldAsset.displayName} V${replacement.assetVersion}`, fileName: replacement.fileName, checksumPlaceholder: `demo-sha256-${replacement.assetId}-v${replacement.assetVersion}`, status: "Ready", downloadCount: 0, downloadLimit: 2, firstDownloadedAt: null, lastDownloadedAt: null, replacedBy: null, notes: [replacement.reason] }; const pkg = { ...clone(original), id: replacementId, reference: `${original.reference || "BM-DEL-DRAFT"}-V${newVersion}`, version: newVersion, status: "Replacement Ready", packageType: "Replacement delivery", assetEntries: [replacementAsset], previousVersionId: original.id, supersededBy: null, changeSummary: replacement.reason, manifest: null, validFrom: now(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), activatedAt: now(), completedAt: null, createdAt: now(), createdBy: user.name, updatedAt: now() }; oldAsset.replacedBy = replacementAsset.id; oldAsset.status = "Replaced"; original.supersededBy = pkg.id; original.status = "Superseded"; state.packages.unshift(pkg); state.replacementRecords.unshift({ id: uid("replacement"), packageId: original.id, replacementPackageId: pkg.id, assetEntryId: oldAsset.id, replacementAssetEntryId: replacementAsset.id, reason: replacement.reason, status: "Replacement Ready", createdAt: now(), createdBy: user.name }); createEntitlements(state, pkg); makeManifest(state, pkg, user); activity(state, user, pkg, "Replacement package created", "A new immutable package version was created; original download history remains preserved.", { asset: replacementAsset.displayName }); notify(pkg.buyerId, "Replacement asset ready", `${replacementAsset.displayName} is available in ${pkg.reference}.`, "buyer-delivery"); localStorage.setItem(SELECTED_DELIVERY_KEY, pkg.id); return pkg; }); },
  changeStatus(id, status, reason, user = authService.getCurrentUser()) { const permission = status === "Suspended" ? "deliveries.suspend" : status === "Active" ? "deliveries.restore" : status === "Revoked" ? "deliveries.revoke" : "deliveries.edit"; requirePermission(user, permission); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); if (!canTransitionDeliveryStatus(delivery.status, status) && !(delivery.status === "Expired" && status === "Active")) throw new Error(`Cannot transition ${delivery.status} to ${status}.`); if (status === "Active") { const readiness = calculateSecureDeliveryReadiness({ ...delivery, status: "Active" }); if (!readiness.ready) throw new Error(`Restore blocked: ${readiness.blockers.join(". ")}`); } const before = delivery.status; delivery.status = status; delivery.updatedAt = now(); state.entitlements.filter((item) => item.deliveryPackageId === id).forEach((item) => { item.status = status === "Active" ? (item.downloadCount ? "Partially Used" : "Active") : status; if (["Revoked", "Suspended"].includes(status)) { item.revokedAt = now(); item.revocationReason = reason; } }); state.sessions.filter((item) => item.deliveryPackageId === id && !["Completed", "Failed"].includes(item.status)).forEach((item) => { item.status = status === "Suspended" ? "Revoked" : status; }); if (status === "Suspended") state.suspensions.unshift({ id: uid("suspension"), packageId: id, reason, status: "Active", createdAt: now(), createdBy: user.name }); if (status === "Revoked") state.revocations.unshift({ id: uid("revocation"), packageId: id, reason, createdAt: now(), createdBy: user.name }); syncLicence(delivery, status); activity(state, user, delivery, `Package ${status.toLowerCase()}`, reason, { before: { status: before }, after: { status } }); notify(delivery.buyerId, `Delivery ${status.toLowerCase()}`, status === "Suspended" ? "Delivery access is temporarily unavailable while licensing conditions are reviewed." : reason, "buyer-delivery"); return delivery; }); },
  expireDelivery(id, user = authService.getCurrentUser()) { requirePermission(user, "deliveries.manage_expiry"); return mutate((state) => { const delivery = state.packages.find((item) => item.id === id); delivery.status = "Expired"; delivery.expiresAt = now(); state.entitlements.filter((item) => item.deliveryPackageId === id).forEach((item) => { item.status = "Expired"; item.expiresAt = now(); }); state.sessions.filter((item) => item.deliveryPackageId === id && !["Completed", "Failed"].includes(item.status)).forEach((item) => { item.status = "Expired"; }); activity(state, user, delivery, "Package expired", "New sessions were disabled; completed delivery history and manifest were preserved."); notify(delivery.buyerId, "Delivery access expired", `${delivery.reference} has expired. You may request an extension.`, "buyer-delivery"); return delivery; }); },
  getDeliveryAnalytics() { const state = readSecureDeliveryState(); const sessions = state.sessions; const completed = sessions.filter((item) => item.status === "Completed").length; const failed = sessions.filter((item) => item.status === "Failed").length; const assets = state.packages.flatMap((item) => item.assetEntries); const count = (statuses) => state.packages.filter((item) => statuses.includes(item.status)).length; return { packages: state.packages.length, active: count(activePackageStatuses), pending: count(["Draft", "Readiness Incomplete", "Pending Approval", "Pending Asset Preparation", "Ready to Activate"]), expiring: count(["Expiring Soon"]), expired: count(["Expired"]), suspended: count(["Suspended"]), revoked: count(["Revoked"]), replacements: state.replacementRecords.length, assets: assets.length, downloads: completed, failures: failed, successRate: completed + failed ? Math.round(completed / (completed + failed) * 100) : 100, extensions: state.extensionRequests.length, masters: assets.filter((item) => item.assetType.toLowerCase().includes("master")).length, instrumentals: assets.filter((item) => item.assetType.toLowerCase().includes("instrumental")).length, stems: assets.filter((item) => item.assetType.toLowerCase().includes("stem")).length }; },
};
