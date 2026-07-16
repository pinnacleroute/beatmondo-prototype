import { authService, readAuthState, writeAuthState } from "../auth/authService.js";
import { readContractState, writeContractState } from "../contracts/contractService.js";
import { readPaymentState, calculateLicencePaymentReadiness } from "../payments/paymentService.js";
import { readQuoteState, writeQuoteState } from "../quotes/quoteService.js";
import { DEFAULT_LICENCE_STATE, LICENCE_STORAGE_KEY, SELECTED_LICENCE_KEY } from "./licenceData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const can = (user, permission) => user?.permissions?.includes("*") || user?.permissions?.includes(permission);

function normalize(value) {
  const base = clone(DEFAULT_LICENCE_STATE);
  if (!value || !Array.isArray(value.licences)) return base;
  const merge = (current = [], defaults = []) => [
    ...current,
    ...defaults.filter((item) => !current.some((existing) => existing.id === item.id)),
  ];
  return {
    ...base,
    ...value,
    licences: merge(value.licences, base.licences),
    deliveryAuthorizations: merge(value.deliveryAuthorizations, base.deliveryAuthorizations),
    licenceDocuments: merge(value.licenceDocuments, base.licenceDocuments),
    amendmentRequests: merge(value.amendmentRequests, base.amendmentRequests),
    renewalRequests: value.renewalRequests || [],
    readinessCalculations: value.readinessCalculations || [],
    conflicts: value.conflicts || [],
    activity: value.activity || [],
    notifications: value.notifications || [],
    analyticsEvents: value.analyticsEvents || [],
  };
}

export function readLicenceState() {
  let parsed = null;
  try { parsed = JSON.parse(localStorage.getItem(LICENCE_STORAGE_KEY)); } catch { parsed = null; }
  const state = normalize(parsed);
  if (!parsed) localStorage.setItem(LICENCE_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function writeLicenceState(state) {
  const next = normalize(state);
  localStorage.setItem(LICENCE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function mutate(fn) {
  const state = readLicenceState();
  const result = fn(state);
  writeLicenceState(state);
  return result;
}

function requirePermission(user, permission) {
  if (!can(user, permission)) throw new Error("You do not have permission to perform this licence action.");
}

function addActivity(state, user, licence, action, description, visibility = "Internal") {
  state.activity.unshift({ id: uid("licence-event"), userId: user?.id, actor: user?.name || "Licence service", licenceId: licence?.id, licenceReference: licence?.reference, buyerId: licence?.buyerId, project: licence?.project, action, description, visibility, createdAt: now() });
}

function notify(buyerId, title, body, action = "buyer-licences") {
  if (!buyerId) return;
  const auth = readAuthState();
  auth.messages.unshift({ id: uid("licence-message"), userId: buyerId, type: "licence", title, body, createdAt: now(), read: false, action });
  writeAuthState(auth);
}

export function calculateLicenceExpiry(effectiveDate, term = "12 months") {
  if (!effectiveDate) return null;
  const months = Number.parseInt(term, 10) || 12;
  const expiry = new Date(effectiveDate);
  expiry.setUTCMonth(expiry.getUTCMonth() + months);
  expiry.setUTCDate(expiry.getUTCDate() - 1);
  expiry.setUTCHours(23, 59, 59, 999);
  return expiry.toISOString();
}

export function checkDuplicateLicence(candidate, licences = readLicenceState().licences) {
  return licences.filter((licence) =>
    licence.id !== candidate.id &&
    !["Cancelled", "Archived", "Superseded", "Terminated", "Revoked"].includes(licence.status) &&
    licence.contractId === candidate.contractId &&
    licence.trackIds?.some((id) => candidate.trackIds?.includes(id)),
  );
}

export function checkLicenceConflicts(candidate, licences = readLicenceState().licences) {
  return licences.filter((licence) => {
    if (licence.id === candidate.id || !["Active", "Active with Conditions", "Expiring Soon", "Amended", "Renewed"].includes(licence.status)) return false;
    const sameTrack = licence.trackIds?.some((id) => candidate.trackIds?.includes(id));
    const exclusive = [licence.exclusivity, candidate.exclusivity].includes("Exclusive");
    const overlap = (!licence.expiryDate || !candidate.effectiveDate || new Date(licence.expiryDate) >= new Date(candidate.effectiveDate));
    return sameTrack && exclusive && overlap;
  });
}

export function calculateLicenceCompleteness(licence) {
  const fields = ["buyerId", "projectId", "contractId", "quoteId", "trackIds", "territory", "media", "usage", "term", "effectiveDate", "fee", "rightsSnapshot", "assetsApproved", "credits"];
  const missing = fields.filter((field) => licence?.[field] == null || licence[field] === "" || (Array.isArray(licence[field]) && !licence[field].length));
  return { complete: missing.length === 0, percentage: Math.round(((fields.length - missing.length) / fields.length) * 100), missing };
}

export function calculateLicenceGenerationReadiness(contract, candidate = null) {
  if (!contract) return { ready: false, status: "Awaiting Contract", blockers: ["An executed contract is required"], checks: [] };
  const payment = calculateLicencePaymentReadiness(contract);
  const checks = [
    { label: "Accepted quote version locked", pass: Boolean(contract.quoteId && contract.quoteReference) },
    { label: "Contract fully executed", pass: Boolean(contract.dependencies?.fullSignature && contract.dependencies?.countersignature) },
    { label: "Rights approval complete", pass: Boolean(contract.dependencies?.rightsApproval) },
    { label: "Buyer verification current", pass: Boolean(contract.dependencies?.buyerVerification) },
    { label: "Paid membership/access active", pass: Boolean(contract.dependencies?.membership) },
    { label: "Licence payment complete", pass: payment.ready },
    { label: "Approved assets defined", pass: Boolean(contract.assets?.length) },
  ];
  const blockers = checks.filter((check) => !check.pass).map((check) => check.label).concat(payment.blockers || []);
  if (candidate) {
    const completeness = calculateLicenceCompleteness(candidate);
    if (!completeness.complete) blockers.push(`Missing licence fields: ${completeness.missing.join(", ")}`);
    if (checkDuplicateLicence(candidate).length) blockers.push("A current licence already covers this contract and track");
    if (checkLicenceConflicts(candidate).length) blockers.push("A conflicting active exclusive licence requires review");
  }
  let status = "Ready to Generate";
  if (!contract.dependencies?.fullSignature || !contract.dependencies?.countersignature) status = "Awaiting Signature";
  else if (!contract.dependencies?.rightsApproval) status = "Awaiting Rights Approval";
  else if (!payment.ready) status = "Awaiting Payment";
  else if (blockers.length) status = "Readiness Incomplete";
  return { ready: blockers.length === 0, status, blockers: [...new Set(blockers)], checks, payment };
}

export function calculateDeliveryAuthorizationReadiness(licence) {
  const active = ["Active", "Amended", "Renewed", "Expiring Soon"].includes(licence?.status);
  const blockers = [];
  if (!licence?.reference || !licence?.documentAssetId) blockers.push("Issued licence document required");
  if (!active) blockers.push("Licence must be active");
  if (!licence?.assetsApproved?.length) blockers.push("No assets are approved for delivery");
  if (licence?.assetReadiness?.some((asset) => !asset.deliveryReady)) blockers.push("An approved asset is not delivery-ready");
  return { ready: blockers.length === 0, blockers, status: blockers.length ? "Not Authorized" : "Ready" };
}

function contractToDraft(contract, quote) {
  const media = quote?.usage?.media || quote?.media || ["Online Video"];
  const term = quote?.usage?.term || quote?.term || "12 months";
  const effectiveDate = contract.effectiveDate || now();
  return {
    id: uid("licence-draft"), reference: null, licenceType: "Combined synchronization and master-use licence", status: "Draft", version: 1,
    quoteId: contract.quoteId, quoteReference: contract.quoteReference, quoteVersion: quote?.version || 1,
    contractId: contract.id, contractReference: contract.reference, contractVersion: contract.version || 1,
    paymentObligationIds: [], invoiceIds: [], paymentIds: [], buyerId: contract.buyerId || quote?.buyerId || "user-olivia", buyer: contract.buyer || quote?.buyer || "Olivia Bennett",
    organizationId: contract.organizationId || quote?.organizationId || "org-northstar", organization: contract.organization || quote?.organization || "Northstar Pictures",
    projectId: contract.projectId, project: contract.project, trackIds: quote?.trackIds || [quote?.trackId || 1], trackTitle: quote?.trackTitle || "Golden Hours", artist: quote?.artist || "Lennox",
    rightsRecordIds: quote?.rightsRecordIds || ["rights-1"], rightsVersions: [1], rightsSnapshot: { eligibility: "Eligible", territory: quote?.usage?.territory || quote?.territory || "Worldwide", restrictions: quote?.restrictions || ["No sublicensing", "No standalone audio distribution"], verificationState: "Rights Verified" },
    effectiveDate, expiryDate: calculateLicenceExpiry(effectiveDate, term), issuedAt: null, issuedBy: null,
    territory: quote?.usage?.territory || quote?.territory || "Worldwide", media, usage: quote?.usage?.description || "One synchronized use in the approved project and campaign edits.", term, exclusivity: quote?.usage?.exclusivity || "Non-exclusive",
    fee: contract.fees?.licenceFee || quote?.total || 0, currency: contract.fees?.currency || "USD", paymentTerms: quote?.paymentTerms || "Paid in full", paymentState: contract.paymentStatus,
    assetsApproved: [...(contract.assets || [])], assetReadiness: (contract.assets || []).map((type) => ({ type, contractApproved: true, rightsApproved: true, technicallyAvailable: true, deliveryReady: true })),
    restrictions: quote?.restrictions || ["No sublicensing", "No standalone audio distribution"], credits: `“${quote?.trackTitle || "Golden Hours"}” performed by ${quote?.artist || "Lennox"}\nLicensed courtesy of beatmondo`,
    approvals: ["Licensing", "Rights", "Finance"].map((type) => ({ id: uid("licence-approval"), type, status: "Pending", approver: null, note: "", date: null })), thirdPartyApprovals: [], deliveryAuthorizationId: null, documentAssetId: null,
    previousVersionId: null, supersededBy: null, amendmentIds: [], renewalId: null, internalNotes: [], buyerMessages: [], metadata: { owner: "Jordan Lee", renewable: true, conditional: false, futureUseAllowed: false, newDistributionAllowed: false, assetDownloadAllowed: false }, createdAt: now(), updatedAt: now(),
  };
}

function syncSources(licence, status) {
  const contracts = readContractState();
  const contract = contracts.contracts.find((item) => item.id === licence.contractId);
  if (contract) { contract.licenceGeneration = status; contract.deliveryStatus = licence.deliveryAuthorizationId ? "Authorized by issued licence" : "Not authorized — licence required"; contract.updatedAt = now(); writeContractState(contracts); }
  const quotes = readQuoteState();
  const quote = quotes.quotes.find((item) => item.id === licence.quoteId);
  if (quote) { quote.futureWorkflow = { ...(quote.futureWorkflow || {}), licenceStatus: status, licenceId: licence.id }; quote.updatedAt = now(); writeQuoteState(quotes); }
}

export const licenceService = {
  getState: readLicenceState,
  reset() { localStorage.removeItem(LICENCE_STORAGE_KEY); localStorage.removeItem(SELECTED_LICENCE_KEY); return readLicenceState(); },
  select(id) { localStorage.setItem(SELECTED_LICENCE_KEY, id); },
  selected() { return localStorage.getItem(SELECTED_LICENCE_KEY); },
  getLicence(id) { return readLicenceState().licences.find((licence) => licence.id === id) || null; },
  getBuyerLicences(user = authService.getCurrentUser()) { return readLicenceState().licences.filter((licence) => licence.buyerId === user?.id || licence.organizationId === user?.organizationId); },
  getEligibleTransactions() {
    const state = readLicenceState();
    return readContractState().contracts.filter((contract) => ["Fully Signed", "Countersigned", "Effective", "Completed"].includes(contract.status)).map((contract) => ({ contract, readiness: calculateLicenceGenerationReadiness(contract), existing: state.licences.filter((licence) => licence.contractId === contract.id) }));
  },
  createDraft(contractId, user = authService.getCurrentUser()) {
    requirePermission(user, "licences.create");
    return mutate((state) => {
      const contract = readContractState().contracts.find((item) => item.id === contractId);
      const quote = readQuoteState().quotes.find((item) => item.id === contract?.quoteId);
      const readiness = calculateLicenceGenerationReadiness(contract);
      if (!readiness.ready) throw new Error(readiness.blockers.join(". "));
      if (state.licences.some((licence) => licence.contractId === contractId && !["Cancelled", "Archived", "Superseded"].includes(licence.status))) throw new Error("A licence record already exists for this contract.");
      const draft = contractToDraft(contract, quote);
      state.licences.unshift(draft); addActivity(state, user, draft, "Draft created", "Immutable quote, contract, rights, and payment versions were copied into a licence draft.");
      localStorage.setItem(SELECTED_LICENCE_KEY, draft.id); syncSources(draft, "Draft"); return draft;
    });
  },
  requestApproval(id, user = authService.getCurrentUser()) {
    requirePermission(user, "licences.request_approval");
    return mutate((state) => { const licence = state.licences.find((item) => item.id === id); const readiness = calculateLicenceGenerationReadiness(readContractState().contracts.find((item) => item.id === licence.contractId), licence); if (!readiness.ready) throw new Error(readiness.blockers.join(". ")); licence.status = "Ready to Generate"; licence.updatedAt = now(); addActivity(state, user, licence, "Approval requested", "Licence draft sent to licensing, rights, and finance approval."); return licence; });
  },
  decideApproval(id, type, decision, note = "", user = authService.getCurrentUser()) {
    requirePermission(user, type === "Rights" ? "licences.approve_rights" : type === "Finance" ? "licences.approve_finance" : "licences.approve_licensing");
    return mutate((state) => { const licence = state.licences.find((item) => item.id === id); const approval = licence.approvals.find((item) => item.type === type); approval.status = decision; approval.approver = user.name; approval.note = note; approval.date = now(); licence.updatedAt = now(); addActivity(state, user, licence, `${type} ${decision.toLowerCase()}`, note || `${type} review recorded.`); return licence; });
  },
  generateDocument(id, user = authService.getCurrentUser()) {
    requirePermission(user, "licences.generate");
    return mutate((state) => { const licence = state.licences.find((item) => item.id === id); const readiness = calculateLicenceGenerationReadiness(readContractState().contracts.find((item) => item.id === licence.contractId), licence); if (!readiness.ready) throw new Error(readiness.blockers.join(". ")); if (licence.approvals.some((approval) => approval.status !== "Approved")) throw new Error("All licensing, rights, and finance approvals are required."); const document = { id: uid("licence-document"), licenceId: id, licenceVersion: licence.version, documentVersion: state.licenceDocuments.filter((item) => item.licenceId === id).length + 1, generatedAt: now(), generatedBy: user.name, sourceContractVersion: licence.contractVersion, sourceRightsVersions: licence.rightsVersions, current: true, assetId: uid("asset-licence"), hashPlaceholder: uid("demo-sha256") }; state.licenceDocuments.filter((item) => item.licenceId === id).forEach((item) => { item.current = false; }); state.licenceDocuments.unshift(document); licence.documentAssetId = document.assetId; licence.status = "Generated"; licence.updatedAt = now(); addActivity(state, user, licence, "Document generated", "A versioned commercial licence document was generated from locked source versions."); return document; });
  },
  issue(id, user = authService.getCurrentUser()) {
    requirePermission(user, "licences.issue");
    return mutate((state) => { const licence = state.licences.find((item) => item.id === id); if (!licence.documentAssetId || licence.approvals.some((approval) => approval.status !== "Approved")) throw new Error("Generate an approved licence document before issuance."); const date = new Date(licence.effectiveDate); licence.reference = `BM-LIC-${new Date().getUTCFullYear()}-${String(++state.lastNumbers.licence).padStart(4, "0")}`; licence.issuedAt = now(); licence.issuedBy = user.name; licence.status = date > new Date() ? "Generated — Future Effective Date" : "Active"; licence.metadata.futureUseAllowed = licence.status === "Active"; licence.metadata.newDistributionAllowed = licence.status === "Active"; const delivery = calculateDeliveryAuthorizationReadiness(licence); if (delivery.ready) { const authorization = { id: uid("delivery-auth"), licenceId: id, buyerId: licence.buyerId, organizationId: licence.organizationId, projectId: licence.projectId, trackId: licence.trackIds[0], status: "Ready", allowedAssetTypes: licence.assetsApproved, assetIds: [], maxDownloads: 5, expiresAt: null, requiresAdditionalApproval: false, restrictions: licence.restrictions, createdAt: now(), createdBy: user.name }; state.deliveryAuthorizations.unshift(authorization); licence.deliveryAuthorizationId = authorization.id; licence.metadata.assetDownloadAllowed = true; } addActivity(state, user, licence, "Licence issued", `${licence.reference} was issued; delivery remains governed by its separate authorization.`); notify(licence.buyerId, "Licence issued", `${licence.reference} is available in your licensing workspace.`, "buyer-licence"); syncSources(licence, licence.status); return licence; });
  },
  requestAmendment(id, details, user = authService.getCurrentUser()) { requirePermission(user, "licences.request_amendment_own"); return mutate((state) => { const licence = state.licences.find((item) => item.id === id); if (licence.buyerId !== user.id && licence.organizationId !== user.organizationId) throw new Error("This licence is outside your organization."); const request = { id: uid("amendment-request"), licenceId: id, buyerId: user.id, requestedChange: details.requestedChange, reason: details.reason, desiredEffectiveDate: details.desiredEffectiveDate, additionalAssets: details.additionalAssets || [], status: "Review Required", createdAt: now() }; state.amendmentRequests.unshift(request); addActivity(state, user, licence, "Amendment requested", "Buyer requested a change; the issued licence remains unchanged.", "Buyer"); notify(user.id, "Amendment request received", "Licensing will review scope, rights, quote, contract, and payment impacts."); return request; }); },
  requestRenewal(id, reason, user = authService.getCurrentUser()) { requirePermission(user, "licences.request_renewal_own"); return mutate((state) => { const licence = state.licences.find((item) => item.id === id); if (licence.buyerId !== user.id && licence.organizationId !== user.organizationId) throw new Error("This licence is outside your organization."); const request = { id: uid("renewal-request"), licenceId: id, buyerId: user.id, reason, status: "New quote required", createdAt: now() }; state.renewalRequests.unshift(request); addActivity(state, user, licence, "Renewal requested", "Renewal requires current eligibility, rights review, a new quote, contract, and payment.", "Buyer"); return request; }); },
  changeLegalStatus(id, status, reason, user = authService.getCurrentUser()) { requirePermission(user, "licences.manage_status"); return mutate((state) => { const licence = state.licences.find((item) => item.id === id); licence.status = status; licence.metadata.futureUseAllowed = false; licence.metadata.newDistributionAllowed = false; licence.metadata.assetDownloadAllowed = false; const auth = state.deliveryAuthorizations.find((item) => item.id === licence.deliveryAuthorizationId); if (auth) { auth.status = "Revoked"; auth.revokedAt = now(); auth.revocationReason = reason; } addActivity(state, user, licence, status, reason); notify(licence.buyerId, `Licence ${status.toLowerCase()}`, reason, "buyer-licence"); return licence; }); },
  analytics() { const licences = readLicenceState().licences; const count = (statuses) => licences.filter((item) => statuses.includes(item.status)).length; const active = count(["Active", "Amended", "Renewed", "Expiring Soon"]); return { total: licences.length, active, pending: count(["Draft", "Readiness Incomplete", "Awaiting Payment", "Awaiting Rights Approval", "Ready to Generate", "Generated"]), expiring: count(["Expiring Soon"]), inactive: count(["Expired", "Suspended", "Terminated", "Revoked"]), value: licences.filter((item) => item.reference).reduce((sum, item) => sum + (item.fee || 0), 0) }; },
};
