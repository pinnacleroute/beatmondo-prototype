import {
  authService,
  readAuthState,
  writeAuthState,
} from "../auth/authService.js";
import { readLicenceState } from "../licences/licenceService.js";
import { readStorageState } from "../storage/storageService.js";
import { buyerVerificationService } from "../verification/buyerVerificationService.js";
import { membershipService } from "../membership/membershipService.js";
import {
  canDownloadDeliveryAsset,
  secureDeliveryService,
} from "../delivery/secureDeliveryService.js";
import {
  ACCESS_STATUSES,
  ACTIVE_TOKEN_SESSION_PREFIX,
  DEFAULT_EXPIRING_ACCESS_STATE,
  EXPIRING_ACCESS_STORAGE_KEY,
  SELECTED_ACCESS_KEY,
} from "./expiringAccessData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const can = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);
const randomToken = () =>
  `bm_url_demo_${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 6)}`;
export function mockHashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `demo-sha256-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
function parse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
function merge(current = [], defaults = []) {
  return [
    ...current,
    ...defaults.filter(
      (item) => !current.some((existing) => existing.id === item.id),
    ),
  ];
}
function normalize(value) {
  const base = clone(DEFAULT_EXPIRING_ACCESS_STATE);
  if (!value || !Array.isArray(value.records)) return base;
  return {
    ...base,
    ...value,
    policies: merge(value.policies, base.policies),
    policyVersions: value.policyVersions || [],
    records: merge(value.records, base.records),
    attempts: merge(value.attempts, base.attempts),
    refreshRecords: value.refreshRecords || [],
    extensionRequests: value.extensionRequests || [],
    revocations: value.revocations || [],
    securityReviews: merge(value.securityReviews, base.securityReviews),
    sessionExchanges: value.sessionExchanges || [],
    uploadUses: value.uploadUses || [],
    activity: value.activity || [],
    notifications: value.notifications || [],
    analyticsEvents: value.analyticsEvents || [],
    generationWindows: value.generationWindows || {},
  };
}

export function readExpiringAccessState() {
  const raw = localStorage.getItem(EXPIRING_ACCESS_STORAGE_KEY);
  const state = normalize(raw ? parse(raw) : null);
  if (!raw || !parse(raw))
    localStorage.setItem(EXPIRING_ACCESS_STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function writeExpiringAccessState(state) {
  const next = normalize(state);
  localStorage.setItem(EXPIRING_ACCESS_STORAGE_KEY, JSON.stringify(next));
  return next;
}
function mutate(fn) {
  const state = readExpiringAccessState();
  try {
    const result = fn(state);
    writeExpiringAccessState(state);
    return result;
  } catch (error) {
    writeExpiringAccessState(state);
    throw error;
  }
}
function requirePermission(user, permission) {
  if (!can(user, permission))
    throw new Error(
      "You do not have permission to perform this temporary-access action.",
    );
}
function logActivity(
  state,
  user,
  record,
  action,
  result,
  reasonCode = null,
  description = "",
) {
  const event = {
    id: uid("access-event"),
    actor: user?.name || "Temporary access service",
    userId: user?.id || null,
    organizationId:
      user?.organizationId || record?.generatedForOrganizationId || null,
    resource: record?.resourceLabel || "Protected resource",
    resourceType: record?.resourceType,
    actionScope: record?.action,
    relatedDeliveryId: record?.relatedDeliveryId,
    relatedLicenceId: record?.relatedLicenceId,
    accessId: record?.id,
    reference: record?.reference,
    timestamp: now(),
    action,
    result,
    reasonCode,
    approximateDevice: "Current browser · Simulated",
    description,
    visibility: "Internal",
  };
  state.activity.unshift(event);
  return event;
}
function notify(userId, title, body, action = "buyer-deliveries") {
  if (!userId) return;
  const auth = readAuthState();
  auth.messages.unshift({
    id: uid("temporary-access-message"),
    userId,
    type: "temporary-access",
    title,
    body,
    createdAt: now(),
    read: false,
    action,
  });
  writeAuthState(auth);
}
function safeMessage(code) {
  return (
    {
      TOKEN_NOT_FOUND:
        "This temporary access is invalid or no longer available.",
      TOKEN_EXPIRED: "This temporary access has expired.",
      TOKEN_REVOKED: "This temporary access has been revoked.",
      TOKEN_CONSUMED: "This single-use access has already been used.",
      TOKEN_SUSPENDED:
        "Temporary access is unavailable. Please contact beatmondo support.",
      TOKEN_NOT_YET_ACTIVE: "This temporary access is not active yet.",
      USER_MISMATCH:
        "This temporary access is not available for the current account.",
      ORGANIZATION_MISMATCH:
        "This temporary access is not available for the current workspace.",
      SESSION_MISMATCH:
        "Open this access from the session where it was generated.",
      DEVICE_MISMATCH: "Generate a new temporary access from this device.",
      PERMISSION_REQUIRED:
        "Your account does not have access to this resource.",
      ENTITLEMENT_REQUIRED: "An active delivery entitlement is required.",
      BUYER_VERIFICATION_REQUIRED: "Current buyer verification is required.",
      MEMBERSHIP_REQUIRED: "Current workspace access is required.",
      LICENCE_INACTIVE:
        "The related licence does not currently permit this action.",
      DELIVERY_INACTIVE: "The related delivery is not currently available.",
      PAYMENT_INCOMPLETE: "Required licensing payment is incomplete.",
      RIGHTS_RESTRICTED:
        "This resource is unavailable while rights conditions are reviewed.",
      ASSET_UNAVAILABLE: "This protected resource is not currently available.",
      ACTION_NOT_ALLOWED: "This temporary access does not permit that action.",
      USE_LIMIT_REACHED: "This temporary access has reached its use limit.",
      SECURITY_REVIEW_REQUIRED:
        "Temporary access is unavailable. Please contact beatmondo support.",
    }[code] || "This temporary access could not be authorized."
  );
}
function findLicence(id) {
  return readLicenceState().licences.find((item) => item.id === id) || null;
}
function isBuyerResource(record) {
  return [
    "VIP preview",
    "Professional preview",
    "Buyer-specific preview",
    "Secure delivery asset",
    "Secure delivery stems",
    "Licence document",
    "Signed contract",
    "Financial document",
  ].includes(record.resourceType);
}
function userVerification(userId) {
  try {
    return buyerVerificationService.getByUser(userId);
  } catch {
    return null;
  }
}
function userMembership(userId) {
  try {
    return membershipService.getCurrentMembership(userId);
  } catch {
    return null;
  }
}

export function resolveExpiringAccessPolicy(
  resource,
  userContext = {},
  relatedContext = {},
) {
  const state = readExpiringAccessState();
  const policies = state.policies.filter((item) => item.active);
  const requested =
    relatedContext.policyId &&
    policies.find((item) => item.id === relatedContext.policyId);
  if (requested)
    return { policy: requested, source: "Resource-specific override" };
  const delivery = relatedContext.delivery;
  const deliveryPolicy =
    delivery?.temporaryAccessPolicyId &&
    policies.find((item) => item.id === delivery.temporaryAccessPolicyId);
  if (deliveryPolicy)
    return { policy: deliveryPolicy, source: "Delivery-specific policy" };
  const licence = relatedContext.licence;
  const licencePolicy =
    licence?.metadata?.temporaryAccessPolicyId &&
    policies.find(
      (item) => item.id === licence.metadata.temporaryAccessPolicyId,
    );
  if (licencePolicy)
    return { policy: licencePolicy, source: "Licence-specific policy" };
  const orgPolicy =
    relatedContext.organizationPolicyId &&
    policies.find((item) => item.id === relatedContext.organizationPolicyId);
  if (orgPolicy)
    return { policy: orgPolicy, source: "Organization-specific policy" };
  const tier = userContext?.membershipTier || userContext?.user?.membershipTier;
  if (
    resource.resourceType?.includes("preview") &&
    tier === "VIP Sync Access"
  ) {
    const vip = policies.find((item) => item.id === "policy-vip-preview");
    if (vip) return { policy: vip, source: "Access-tier policy" };
  }
  const type =
    resource.resourceType === "Secure delivery stems"
      ? "Secure delivery stems"
      : resource.resourceType;
  const fallback =
    policies.find(
      (item) =>
        item.resourceType === type &&
        item.action === (resource.action || relatedContext.action),
    ) ||
    policies.find(
      (item) => item.action === (resource.action || relatedContext.action),
    );
  return { policy: fallback, source: "Resource-type default" };
}

export function checkExistingExpiringAccess(
  context,
  records = readExpiringAccessState().records,
) {
  return records.filter(
    (item) =>
      item.status === "Active" &&
      item.resourceId === context.resourceId &&
      item.action === context.action &&
      item.generatedForUserId === (context.userId || null) &&
      item.generatedForOrganizationId === (context.organizationId || null) &&
      item.policyId === context.policyId,
  );
}
export function canTransitionExpiringAccessStatus(current, next) {
  return Boolean(
    ACCESS_STATUSES[current]?.next.includes(next) || next === "Archived",
  );
}

function recordAttempt(
  state,
  record,
  user,
  result,
  reasonCode,
  requestContext = {},
) {
  const attempt = {
    id: uid("access-attempt"),
    accessId: record?.id || null,
    reference: record?.reference || null,
    userId: user?.id || null,
    organizationId: user?.organizationId || null,
    resourceType: record?.resourceType || "Unknown",
    action: requestContext.action || record?.action || null,
    timestamp: now(),
    result,
    reasonCode,
    safeMessage: safeMessage(reasonCode),
    approximateDevice:
      requestContext.deviceBinding || "Current browser · Simulated",
    approximateRegion: requestContext.region || "Region unavailable",
    visibility: "Internal",
  };
  state.attempts.unshift(attempt);
  if (record) record.lastValidatedAt = now();
  logActivity(
    state,
    user,
    record,
    result === "Granted" ? "Access validated" : "Access denied",
    result,
    reasonCode,
    attempt.safeMessage,
  );
  return attempt;
}

function validateRecord(record, user, requestContext = {}) {
  const deny = (code) => ({
    valid: false,
    accessRecord: record ? clone(record) : null,
    reason: safeMessage(code),
    code,
    action: record?.action || null,
    resource: record
      ? { type: record.resourceType, label: record.resourceLabel }
      : null,
    usesRemaining: record ? Math.max(0, record.maxUses - record.useCount) : 0,
    expiresAt: record?.expiresAt || null,
    refreshAllowed: Boolean(
      record &&
      ACCESS_STATUSES[record.status]?.refresh &&
      record.refreshPolicy?.allowed,
    ),
  });
  if (!record) return deny("TOKEN_NOT_FOUND");
  if (record.status === "Revoked") return deny("TOKEN_REVOKED");
  if (record.status === "Consumed") return deny("TOKEN_CONSUMED");
  if (record.status === "Suspended")
    return deny(
      record.metadata?.securityReviewRequired
        ? "SECURITY_REVIEW_REQUIRED"
        : "TOKEN_SUSPENDED",
    );
  if (!["Active", "Used"].includes(record.status))
    return deny(
      record.status === "Expired" ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
    );
  if (new Date(record.validFrom).getTime() > Date.now())
    return deny("TOKEN_NOT_YET_ACTIVE");
  if (new Date(record.expiresAt).getTime() <= Date.now())
    return deny("TOKEN_EXPIRED");
  if (record.useCount >= record.maxUses) return deny("USE_LIMIT_REACHED");
  if (
    requestContext.action &&
    !record.allowedMethods.includes(requestContext.action)
  )
    return deny("ACTION_NOT_ALLOWED");
  if (record.generatedForUserId && record.generatedForUserId !== user?.id)
    return deny("USER_MISMATCH");
  if (
    record.generatedForOrganizationId &&
    record.generatedForOrganizationId !== user?.organizationId
  )
    return deny("ORGANIZATION_MISMATCH");
  if (
    record.generatedForSessionId &&
    requestContext.sessionId &&
    record.generatedForSessionId !== requestContext.sessionId
  )
    return deny("SESSION_MISMATCH");
  if (
    record.deviceBinding !== "None" &&
    requestContext.deviceBinding &&
    record.deviceBinding !== requestContext.deviceBinding
  )
    return deny("DEVICE_MISMATCH");
  if (record.requiredPermissions.some((permission) => !can(user, permission)))
    return deny("PERMISSION_REQUIRED");
  if (
    record.resourceType === "Rights document" &&
    user?.userType !== "internal"
  )
    return deny("PERMISSION_REQUIRED");
  if (isBuyerResource(record) && user?.userType === "buyer") {
    const verification = userVerification(user.id);
    if (
      verification &&
      !["Approved", "Approved with Restrictions", "Reinstated"].includes(
        verification.status,
      )
    )
      return deny("BUYER_VERIFICATION_REQUIRED");
    const membership = userMembership(user.id);
    if (membership && !["Active", "Complimentary"].includes(membership.status))
      return deny("MEMBERSHIP_REQUIRED");
  }
  if (record.relatedLicenceId) {
    const licence = findLicence(record.relatedLicenceId);
    if (
      licence &&
      ![
        "Active",
        "Active with Conditions",
        "Amended",
        "Renewed",
        "Expiring Soon",
      ].includes(licence.status) &&
      !["Licence document", "Signed contract", "Financial document"].includes(
        record.resourceType,
      )
    )
      return deny("LICENCE_INACTIVE");
  }
  if (record.relatedDeliveryId) {
    const delivery = secureDeliveryService.getDelivery(
      record.relatedDeliveryId,
    );
    if (
      !delivery ||
      ![
        "Active",
        "Partially Downloaded",
        "Completed",
        "Expiring Soon",
        "Replacement Ready",
      ].includes(delivery.status)
    )
      return deny("DELIVERY_INACTIVE");
    if (record.action === "DOWNLOAD") {
      const asset = delivery.assetEntries.find(
        (item) => item.id === record.resourceId,
      );
      const access = canDownloadDeliveryAsset(asset, user, delivery);
      if (!access.allowed)
        return deny(
          access.code === "DOWNLOAD_LIMIT_REACHED"
            ? "USE_LIMIT_REACHED"
            : access.code === "PACKAGE_EXPIRED"
              ? "DELIVERY_INACTIVE"
              : "ENTITLEMENT_REQUIRED",
        );
    }
  }
  if (record.relatedAssetId) {
    const asset = readStorageState().assets.find(
      (item) => item.id === record.relatedAssetId,
    );
    if (
      asset &&
      (!asset.current ||
        !["Ready", "Ready with Warning"].includes(asset.status))
    )
      return deny("ASSET_UNAVAILABLE");
  }
  return {
    valid: true,
    accessRecord: clone(record),
    reason: "Temporary access is valid for the requested action.",
    code: "AUTHORIZED",
    action: record.action,
    resource: { type: record.resourceType, label: record.resourceLabel },
    usesRemaining: Math.max(0, record.maxUses - record.useCount),
    expiresAt: record.expiresAt,
    refreshAllowed: Boolean(record.refreshPolicy?.allowed),
  };
}

export const expiringAccessService = {
  getState: readExpiringAccessState,
  resetExpiringUrlsDemoData() {
    localStorage.removeItem(EXPIRING_ACCESS_STORAGE_KEY);
    localStorage.removeItem(SELECTED_ACCESS_KEY);
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(ACTIVE_TOKEN_SESSION_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
    return readExpiringAccessState();
  },
  select(id) {
    localStorage.setItem(SELECTED_ACCESS_KEY, id);
  },
  selected() {
    return localStorage.getItem(SELECTED_ACCESS_KEY);
  },
  getAccessRecords() {
    return readExpiringAccessState().records;
  },
  getAccessRecord(id) {
    return (
      readExpiringAccessState().records.find((item) => item.id === id) || null
    );
  },
  getAccessPolicies() {
    return readExpiringAccessState().policies;
  },
  generateExpiringAccess(
    resource,
    userContext = authService.getCurrentUser(),
    accessOptions = {},
  ) {
    const user = userContext?.user || userContext;
    const subjectUser = accessOptions.subjectUser || user;
    if (
      user &&
      !can(
        user,
        accessOptions.permission ||
          {
            STREAM: "temporary_stream.generate",
            DOWNLOAD: "temporary_download.generate",
            VIEW: "temporary_document.generate",
            UPLOAD: "temporary_upload.generate",
            SIGN: "expiring_access.generate",
          }[accessOptions.action || resource.action],
      ) &&
      !can(user, "expiring_access.generate_own")
    )
      throw new Error("Your account cannot generate this temporary access.");
    if (
      resource.resourceType === "Rights document" &&
      user?.userType !== "internal"
    )
      throw new Error(
        "Rights documents are available only to authorized internal users.",
      );
    if (
      resource.relatedDeliveryId &&
      (accessOptions.action || resource.action) === "DOWNLOAD"
    ) {
      const delivery = secureDeliveryService.getDelivery(
        resource.relatedDeliveryId,
      );
      const asset = delivery?.assetEntries.find(
        (item) => item.id === resource.resourceId,
      );
      const access = canDownloadDeliveryAsset(asset, subjectUser, delivery);
      if (!access.allowed) throw new Error(access.reason);
    }
    return mutate((state) => {
      const key =
        subjectUser?.id || accessOptions.anonymousSessionId || "anonymous";
      const windowStart =
        Date.now() - state.settings.generationWindowMinutes * 60000;
      const recent = (state.generationWindows[key] || []).filter(
        (time) => time > windowStart,
      );
      if (
        recent.length >= state.settings.generationLimit &&
        !can(user, "expiring_access.override")
      ) {
        const review = {
          id: uid("security-review"),
          accessId: null,
          status: "Open",
          severity: "High",
          reason: "Temporary-access generation rate exceeded",
          indicators: [
            `${recent.length + 1} requests within ${state.settings.generationWindowMinutes} minutes`,
          ],
          buyerMessage:
            "Temporary access is unavailable. Please contact beatmondo support.",
          internalNotes: "Review session generation activity.",
          createdAt: now(),
          createdBy: "Security simulation",
          resolvedAt: null,
          resolvedBy: null,
        };
        state.securityReviews.unshift(review);
        throw new Error(
          "Temporary access is unavailable. Please contact beatmondo support.",
        );
      }
      state.generationWindows[key] = [...recent, Date.now()];
      const action = accessOptions.action || resource.action;
      const { policy, source } = resolveExpiringAccessPolicy(
        { ...resource, action },
        subjectUser,
        { ...accessOptions, action },
      );
      if (!policy)
        throw new Error(
          "No active temporary-access policy is available for this resource.",
        );
      const duration = Math.max(
        policy.minimumDurationMinutes,
        Math.min(
          accessOptions.durationMinutes || policy.defaultDurationMinutes,
          policy.maximumDurationMinutes,
        ),
      );
      if (
        (accessOptions.durationMinutes || duration) >
          policy.requiresApprovalAboveMinutes &&
        !can(user, "expiring_access.override")
      )
        throw new Error(
          "This duration requires approval under the current access policy.",
        );
      const existing = checkExistingExpiringAccess(
        {
          resourceId: resource.resourceId,
          action,
          userId: subjectUser?.id || null,
          organizationId:
            accessOptions.organizationId || subjectUser?.organizationId || null,
          policyId: policy.id,
        },
        state.records,
      );
      existing.forEach((item) => {
        item.status = "Superseded";
        item.metadata.supersededAt = now();
      });
      const token = randomToken();
      const hash = mockHashToken(token);
      const record = {
        id: uid("access"),
        reference: `BM-URL-${new Date().getUTCFullYear()}-${String(++state.lastNumbers.access).padStart(4, "0")}`,
        resourceType: resource.resourceType,
        resourceLabel: resource.resourceLabel,
        resourceId: resource.resourceId,
        relatedAssetId: resource.relatedAssetId || null,
        relatedPreviewId: resource.relatedPreviewId || null,
        relatedDeliveryId: resource.relatedDeliveryId || null,
        relatedLicenceId: resource.relatedLicenceId || null,
        relatedContractId: resource.relatedContractId || null,
        relatedInvoiceId: resource.relatedInvoiceId || null,
        action,
        status: "Active",
        tokenHashPlaceholder: hash,
        tokenDisplaySuffix: token.slice(-6),
        generatedForUserId: accessOptions.userId ?? subjectUser?.id ?? null,
        generatedForOrganizationId:
          accessOptions.organizationId ?? subjectUser?.organizationId ?? null,
        generatedForSessionId: accessOptions.sessionId || null,
        anonymousSessionId: accessOptions.anonymousSessionId || null,
        requiredPermissions: accessOptions.requiredPermissions || [],
        requiredEntitlements: accessOptions.requiredEntitlements || [],
        allowedMethods: accessOptions.allowedMethods || [action],
        maxUses: accessOptions.maxUses || policy.maxUses,
        useCount: 0,
        validFrom: now(),
        expiresAt: new Date(Date.now() + duration * 60000).toISOString(),
        firstUsedAt: null,
        lastUsedAt: null,
        consumedAt: null,
        revokedAt: null,
        revocationReason: null,
        deviceBinding: accessOptions.deviceBinding || policy.deviceBinding,
        approximateRegionRestriction: accessOptions.regionRestriction || "None",
        refreshPolicy: {
          allowed: policy.refreshAllowed,
          supersedeOld: true,
          requiresCurrentEntitlement: true,
        },
        policyId: policy.id,
        policyVersion: policy.version,
        metadata: {
          resourceHidden: true,
          refreshAvailable: policy.refreshAllowed,
          securityReviewRequired: false,
          consumptionPolicy:
            accessOptions.consumptionPolicy ||
            (action === "DOWNLOAD"
              ? "Completed download"
              : "Successful exchange"),
          policyDecisionSource: source,
          extensionAllowed: policy.extensionAllowed,
          fileRules: accessOptions.fileRules || null,
        },
        createdAt: now(),
        createdBy: user?.name || "Anonymous preview service",
        lastValidatedAt: null,
      };
      state.records.unshift(record);
      sessionStorage.setItem(`${ACTIVE_TOKEN_SESSION_PREFIX}${hash}`, token);
      logActivity(
        state,
        user,
        record,
        "URL generated",
        "Success",
        null,
        `Temporary ${action.toLowerCase()} access created under ${policy.name}; only a hash placeholder is persisted.`,
      );
      notify(
        record.generatedForUserId,
        "Temporary access available",
        `${record.resourceLabel} is ready for a limited time.`,
        accessOptions.notificationAction || "buyer-deliveries",
      );
      localStorage.setItem(SELECTED_ACCESS_KEY, record.id);
      return {
        accessId: record.id,
        reference: record.reference,
        temporaryUrl: `#access/${token}`,
        token,
        action,
        validFrom: record.validFrom,
        expiresAt: record.expiresAt,
        maxUses: record.maxUses,
        status: record.status,
        policy: { id: policy.id, name: policy.name, source },
      };
    });
  },
  validateExpiringAccess(token, requestContext = {}) {
    const user = requestContext.user || authService.getCurrentUser();
    return mutate((state) => {
      const record = state.records.find(
        (item) => item.tokenHashPlaceholder === mockHashToken(token),
      );
      const result = validateRecord(record, user, requestContext);
      recordAttempt(
        state,
        record,
        user,
        result.valid ? "Granted" : "Denied",
        result.code,
        requestContext,
      );
      if (
        record &&
        !result.valid &&
        result.code === "TOKEN_EXPIRED" &&
        ["Active", "Used"].includes(record.status)
      )
        record.status = "Expired";
      return result;
    });
  },
  exchangeExpiringAccess(token, requestContext = {}) {
    const user = requestContext.user || authService.getCurrentUser();
    const result = this.validateExpiringAccess(token, requestContext);
    if (!result.valid) throw new Error(result.reason);
    return mutate((state) => {
      const record = state.records.find(
        (item) => item.id === result.accessRecord.id,
      );
      let session = null;
      if (record.action === "DOWNLOAD")
        session = secureDeliveryService.createDownloadSession(
          record.relatedDeliveryId,
          record.resourceId,
          user,
        );
      else if (record.action === "STREAM")
        session = {
          id: uid("preview-session"),
          status: "Authorized",
          expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
          resourceLabel: record.resourceLabel,
        };
      else if (record.action === "VIEW")
        session = {
          id: uid("document-view-session"),
          status: "Authorized",
          expiresAt: record.expiresAt,
          resourceLabel: record.resourceLabel,
          allowedMethods: record.allowedMethods,
        };
      else if (record.action === "UPLOAD")
        session = {
          id: uid("upload-session"),
          status: "Authorized",
          expiresAt: record.expiresAt,
          fileRules: record.metadata.fileRules,
        };
      else if (record.action === "SIGN")
        session = {
          id: uid("signature-page-session"),
          status: "Authorized",
          expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
          signerUserId: record.generatedForUserId,
        };
      record.useCount += 1;
      record.firstUsedAt ||= now();
      record.lastUsedAt = now();
      record.status = record.useCount >= record.maxUses ? "Consumed" : "Used";
      if (record.status === "Consumed") record.consumedAt = now();
      const exchange = {
        id: uid("access-exchange"),
        accessId: record.id,
        sessionId: session.id,
        action: record.action,
        userId: user?.id || null,
        organizationId: user?.organizationId || null,
        status: "Authorized",
        createdAt: now(),
        expiresAt: session.expiresAt,
      };
      state.sessionExchanges.unshift(exchange);
      logActivity(
        state,
        user,
        record,
        "Session created",
        "Success",
        null,
        `Temporary URL exchanged into a scoped ${record.action.toLowerCase()} session.`,
      );
      return { record: clone(record), session, exchange };
    });
  },
  completeTemporaryUpload(accessId, file, user = authService.getCurrentUser()) {
    requirePermission(user, "temporary_upload.generate");
    return mutate((state) => {
      const record = state.records.find((item) => item.id === accessId);
      if (record.action !== "UPLOAD")
        throw new Error("This access is not an upload link.");
      const formats = record.metadata.fileRules?.acceptedFormats ||
        record.metadata.acceptedFormats || ["WAV", "AIFF"];
      const extension = file.name.split(".").pop().toUpperCase();
      if (!formats.includes(extension))
        throw new Error(`Accepted formats: ${formats.join(", ")}.`);
      const max =
        record.metadata.fileRules?.maximumSizeBytes ||
        record.metadata.maximumSizeBytes ||
        500000000;
      if (file.sizeBytes > max)
        throw new Error("The simulated file exceeds the maximum upload size.");
      const use = {
        id: uid("upload-use"),
        accessId,
        userId: user.id,
        workflowId:
          record.metadata.workflowId || record.metadata.fileRules?.workflowId,
        safeFileLabel: file.safeFileLabel || `Replacement ${extension} asset`,
        sizeBytes: file.sizeBytes,
        status: "Completed",
        createdAt: now(),
      };
      state.uploadUses.unshift(use);
      record.status = "Consumed";
      record.useCount = record.maxUses;
      record.consumedAt = now();
      logActivity(
        state,
        user,
        record,
        "Upload completed",
        "Success",
        null,
        "A simulated upload record was registered without exposing a storage location.",
      );
      notify(
        user.id,
        "Temporary upload completed",
        `${use.safeFileLabel} was registered for review.`,
        "artist-submission-detail",
      );
      return use;
    });
  },
  refreshExpiringAccess(id, user = authService.getCurrentUser()) {
    requirePermission(user, "expiring_access.refresh");
    const old = this.getAccessRecord(id);
    if (!old) throw new Error("Temporary access record not found.");
    if (
      !old.refreshPolicy?.allowed ||
      ["Revoked", "Suspended", "Access Denied"].includes(old.status)
    )
      throw new Error("This temporary access cannot be refreshed.");
    const subjectUser = old.generatedForUserId
      ? readAuthState().users.find((item) => item.id === old.generatedForUserId)
      : user;
    const generated = this.generateExpiringAccess(
      {
        resourceType: old.resourceType,
        resourceLabel: old.resourceLabel,
        resourceId: old.resourceId,
        relatedAssetId: old.relatedAssetId,
        relatedPreviewId: old.relatedPreviewId,
        relatedDeliveryId: old.relatedDeliveryId,
        relatedLicenceId: old.relatedLicenceId,
        relatedContractId: old.relatedContractId,
        relatedInvoiceId: old.relatedInvoiceId,
        action: old.action,
      },
      user,
      {
        action: old.action,
        userId: old.generatedForUserId,
        organizationId: old.generatedForOrganizationId,
        sessionId: old.generatedForSessionId,
        requiredPermissions: old.requiredPermissions,
        requiredEntitlements: old.requiredEntitlements,
        allowedMethods: old.allowedMethods,
        maxUses: old.maxUses,
        policyId: old.policyId,
        deviceBinding: old.deviceBinding,
        subjectUser,
      },
    );
    mutate((state) => {
      const previous = state.records.find((item) => item.id === id);
      previous.status = "Superseded";
      state.refreshRecords.unshift({
        id: uid("refresh"),
        previousAccessId: id,
        newAccessId: generated.accessId,
        createdAt: now(),
        createdBy: user.name,
      });
      logActivity(
        state,
        user,
        previous,
        "URL refreshed",
        "Success",
        null,
        `A new token was generated as ${generated.reference}; prior history remains preserved.`,
      );
    });
    return generated;
  },
  extendExpiringAccess(
    id,
    requestedMinutes,
    reason,
    user = authService.getCurrentUser(),
  ) {
    requirePermission(user, "expiring_access.extend");
    return mutate((state) => {
      const record = state.records.find((item) => item.id === id);
      const policy = state.policies.find((item) => item.id === record.policyId);
      if (!policy.extensionAllowed)
        throw new Error(
          "This access policy requires a new token instead of extension.",
        );
      if (
        requestedMinutes > policy.requiresApprovalAboveMinutes &&
        !can(user, "expiring_access.override")
      ) {
        const request = {
          id: uid("access-extension"),
          accessId: id,
          requestedMinutes,
          reason,
          status: "Pending Approval",
          requestedBy: user.id,
          createdAt: now(),
        };
        state.extensionRequests.unshift(request);
        return request;
      }
      record.expiresAt = new Date(
        Date.now() +
          Math.min(requestedMinutes, policy.maximumDurationMinutes) * 60000,
      ).toISOString();
      logActivity(state, user, record, "URL extended", "Success", null, reason);
      return record;
    });
  },
  revokeExpiringAccess(id, reason, user = authService.getCurrentUser()) {
    requirePermission(user, "expiring_access.revoke");
    return mutate((state) => {
      const record = state.records.find((item) => item.id === id);
      if (!["Active", "Used", "Suspended"].includes(record.status))
        throw new Error("Only current temporary access may be revoked.");
      record.status = "Revoked";
      record.revokedAt = now();
      record.revocationReason = reason;
      state.revocations.unshift({
        id: uid("revocation"),
        accessId: id,
        scope: "Individual",
        reason,
        createdAt: now(),
        createdBy: user.name,
      });
      const exchanges = state.sessionExchanges.filter(
        (item) => item.accessId === id && item.status === "Authorized",
      );
      exchanges.forEach((item) => {
        item.status = "Revoked";
        item.revokedAt = now();
      });
      logActivity(
        state,
        user,
        record,
        "URL revoked",
        "Success",
        "TOKEN_REVOKED",
        reason,
      );
      notify(
        record.generatedForUserId,
        "Temporary access revoked",
        "This temporary access is no longer available.",
        "buyer-deliveries",
      );
      return record;
    });
  },
  revokeAccessByScope(
    scope,
    value,
    reason,
    user = authService.getCurrentUser(),
  ) {
    requirePermission(user, "expiring_access.bulk_revoke");
    return mutate((state) => {
      const field = {
        Delivery: "relatedDeliveryId",
        Licence: "relatedLicenceId",
        Organization: "generatedForOrganizationId",
        User: "generatedForUserId",
        Resource: "resourceId",
      }[scope];
      if (!field) throw new Error("Choose a valid revocation scope.");
      const affected = state.records.filter(
        (item) =>
          item[field] === value &&
          ["Active", "Used", "Suspended"].includes(item.status),
      );
      affected.forEach((record) => {
        record.status = "Revoked";
        record.revokedAt = now();
        record.revocationReason = reason;
        logActivity(
          state,
          user,
          record,
          "Bulk revocation",
          "Success",
          "TOKEN_REVOKED",
          reason,
        );
      });
      state.revocations.unshift({
        id: uid("revocation-bulk"),
        scope,
        value,
        affectedAccessIds: affected.map((item) => item.id),
        reason,
        createdAt: now(),
        createdBy: user.name,
      });
      return affected;
    });
  },
  updatePolicy(id, changes, reason, user = authService.getCurrentUser()) {
    requirePermission(user, "expiring_access.manage_policies");
    return mutate((state) => {
      const policy = state.policies.find((item) => item.id === id);
      const before = clone(policy);
      state.policyVersions.unshift({
        id: uid("policy-version"),
        policyId: id,
        version: policy.version,
        snapshot: before,
        changedAt: now(),
        changedBy: user.name,
        changeReason: reason,
      });
      Object.assign(policy, changes, {
        version: policy.version + 1,
        previousVersionId: state.policyVersions[0].id,
      });
      state.activity.unshift({
        id: uid("access-event"),
        actor: user.name,
        action: "Policy changed",
        resource: policy.name,
        timestamp: now(),
        result: "Success",
        description: reason,
        visibility: "Internal",
      });
      return policy;
    });
  },
  resolveSecurityReview(
    id,
    decision,
    note,
    user = authService.getCurrentUser(),
  ) {
    requirePermission(user, "expiring_access.resolve_security");
    return mutate((state) => {
      const review = state.securityReviews.find((item) => item.id === id);
      review.status = "Resolved";
      review.resolution = decision;
      review.resolutionNote = note;
      review.resolvedAt = now();
      review.resolvedBy = user.name;
      const record = state.records.find((item) => item.id === review.accessId);
      if (record) record.status = decision === "Restore" ? "Active" : "Revoked";
      logActivity(
        state,
        user,
        record,
        "Security review resolved",
        "Success",
        null,
        note,
      );
      return review;
    });
  },
  getExpiringAccessAnalytics() {
    const state = readExpiringAccessState();
    const count = (status) =>
      state.records.filter((item) => item.status === status).length;
    const granted = state.attempts.filter(
      (item) => item.result === "Granted",
    ).length;
    const denied = state.attempts.filter(
      (item) => item.result === "Denied",
    ).length;
    const averageLifetime = Math.round(
      state.records.reduce(
        (sum, item) =>
          sum +
          Math.max(0, new Date(item.expiresAt) - new Date(item.validFrom)) /
            60000,
        0,
      ) / Math.max(1, state.records.length),
    );
    return {
      total: state.records.length,
      active: count("Active") + count("Used"),
      expired: count("Expired"),
      revoked: count("Revoked"),
      consumed: count("Consumed"),
      suspended: count("Suspended"),
      granted,
      denied,
      successRate:
        granted + denied
          ? Math.round((granted / (granted + denied)) * 100)
          : 100,
      averageLifetime,
      unused: state.records.filter(
        (item) =>
          item.useCount === 0 &&
          ["Expired", "Revoked", "Superseded"].includes(item.status),
      ).length,
      refreshes: state.refreshRecords.length,
      securityReviews: state.securityReviews.filter(
        (item) => item.status === "Open",
      ).length,
      byType: Object.fromEntries(
        [...new Set(state.records.map((item) => item.resourceType))].map(
          (type) => [
            type,
            state.records.filter((item) => item.resourceType === type).length,
          ],
        ),
      ),
    };
  },
};
