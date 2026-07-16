import {
  authService,
  readAuthState,
  writeAuthState,
} from "../auth/authService.js";
import { buyerVerificationService } from "../verification/buyerVerificationService.js";
import { rightsService } from "../rights/rightsService.js";
import { searchService } from "../search/searchService.js";
import { storageService } from "../storage/storageService.js";
import { watermarkedPreviewService } from "../previews/watermarkedPreviewService.js";
import { quoteService } from "../quotes/quoteService.js";
import { contractService } from "../contracts/contractService.js";
import { paymentService } from "../payments/paymentService.js";
import { licenceService } from "../licences/licenceService.js";
import { secureDeliveryService } from "../delivery/secureDeliveryService.js";
import { emailService } from "../email/emailService.js";
import { recordAuditEvent } from "../audit/auditService.js";
import { analyticsService } from "../analytics/analyticsService.js";
import {
  buildAuthorizationContext,
  canPerform,
} from "../permissions/authorizationService.js";
import {
  DEFAULT_PRIVACY_STATE,
  PRIVACY_CODE,
  PRIVACY_STORAGE_KEY,
  SELECTED_PRIVACY_REQUEST_KEY,
} from "./privacyData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const wait = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms));
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const safe = (value) => (Array.isArray(value) ? value : []);
const currentUser = () => authService.getCurrentUser();

function normalize(value) {
  const base = clone(DEFAULT_PRIVACY_STATE);
  if (!value || !Array.isArray(value.classifications)) return base;
  return {
    ...base,
    ...value,
    classifications: value.classifications || base.classifications,
    dataInventory: value.dataInventory || base.dataInventory,
    processingPurposes: value.processingPurposes || base.processingPurposes,
    privacyNotices: value.privacyNotices || base.privacyNotices,
    noticeVersions: value.noticeVersions || [],
    acknowledgments: value.acknowledgments || [],
    consents: value.consents || [],
    requests: value.requests || [],
    identityVerifications: value.identityVerifications || [],
    discoveryResults: value.discoveryResults || {},
    exports: value.exports || [],
    correctionDecisions: value.correctionDecisions || [],
    deletionPlans: value.deletionPlans || [],
    restrictions: value.restrictions || [],
    retentionRules: value.retentionRules || base.retentionRules,
    retentionReviews: value.retentionReviews || [],
    legalHolds: value.legalHolds || [],
    vendors: value.vendors || [],
    incidents: value.incidents || [],
    assessments: value.assessments || [],
    cookiePreferences: value.cookiePreferences || [],
    privacyNotifications: value.privacyNotifications || [],
    privacyReports: value.privacyReports || base.privacyReports,
    activity: value.activity || [],
  };
}
export function readPrivacyState() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY));
  } catch {
    parsed = null;
  }
  const state = normalize(parsed);
  if (!parsed) localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function writePrivacyState(state) {
  const next = normalize(state);
  localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("beatmondo-privacy-changed"));
  return next;
}
function mutate(callback) {
  const state = readPrivacyState();
  const result = callback(state);
  state.version += 1;
  writePrivacyState(state);
  analyticsService.invalidateAnalyticsByEvent({
    type: "privacy.changed",
    occurredAt: now(),
  });
  return result;
}
function context(user = currentUser()) {
  return user
    ? buildAuthorizationContext(user.id)
    : buildAuthorizationContext(null);
}
function requirePermission(permission, user = currentUser(), resource = {}) {
  const decision = canPerform(permission, context(user), resource);
  if (!decision.allowed) {
    const error = new Error(
      decision.reason || "Privacy permission is required.",
    );
    error.name = "PrivacyAuthorizationError";
    error.code = decision.code;
    error.permissionKey = permission;
    throw error;
  }
  return true;
}
function internal(user) {
  return user?.userType === "internal";
}
function canAccessSubject(user, subjectUserId) {
  if (internal(user))
    return canPerform("privacy.requests.view", context(user)).allowed;
  return user?.id === subjectUserId;
}
function audit(action, user, subject, description, severity = "High") {
  recordAuditEvent({
    module: "Compliance & Data Privacy",
    category: "Privacy",
    action,
    result: "Success",
    severity,
    user,
    entityType: subject.type || "Privacy Record",
    entityId: subject.id,
    subjectName: subject.reference || subject.name || action,
    description,
    visibility: severity === "Critical" ? "Legal Restricted" : "Internal",
    confidentiality: severity === "Critical" ? "Restricted" : "Confidential",
    metadata: { privacyGovernance: true },
  });
}
function notify(userId, title, body, action = "settings/privacy") {
  if (userId)
    authService.addDemoMessage(userId, "privacy", title, body, action);
}
function dueDate(type) {
  const days =
    type === "Marketing Opt-Out"
      ? 0
      : ["Restriction Request", "Privacy Complaint"].includes(type)
        ? 14
        : 30;
  return new Date(Date.now() + days * 86400000).toISOString();
}

function sourceCounts(subjectId) {
  const user = readAuthState().users.find((item) => item.id === subjectId);
  const org = user?.organizationId;
  const includes = (item) =>
    item.userId === subjectId ||
    item.buyerId === subjectId ||
    item.subjectUserId === subjectId ||
    item.organizationId === org;
  const sources = [
    [
      "Account",
      "User account",
      user ? [user] : [],
      ["Identity", "Contact", "Account"],
      "Confidential",
      "Correct or anonymize",
      "User account review",
    ],
    [
      "Buyer Verification",
      "Verification application",
      safe(buyerVerificationService.getState().applications).filter(includes),
      ["Identity", "Buyer Verification", "Uploaded Document"],
      "Highly Confidential",
      "Retain pending review",
      "Buyer verification rule",
    ],
    [
      "Rights",
      "Rights record",
      safe(rightsService.getState().records).filter(
        (item) => item.artistId === org || item.userId === subjectId,
      ),
      ["Rights and Ownership", "Contributor"],
      "Highly Confidential",
      "Retain ownership history",
      "Rights-history retention",
    ],
    [
      "Quotes",
      "Quote",
      safe(quoteService.getState().quotes).filter(includes),
      ["Project", "Contractual"],
      "Confidential",
      "Retain commercial history",
      "Contractual retention",
    ],
    [
      "Contracts",
      "Contract",
      safe(contractService.getState().contracts).filter(includes),
      ["Contractual", "Identity"],
      "Highly Confidential",
      "Retain versions",
      "Contractual retention",
    ],
    [
      "Payments",
      "Invoice and transaction",
      [
        ...safe(paymentService.getState().invoices),
        ...safe(paymentService.getState().transactions),
      ].filter(includes),
      ["Financial", "Payment"],
      "Restricted",
      "Retain redacted financial history",
      "Seven-year placeholder",
    ],
    [
      "Licences",
      "Licence",
      safe(licenceService.getState().licences).filter(includes),
      ["Licence", "Contractual"],
      "Highly Confidential",
      "Retain original parties",
      "Contractual retention",
    ],
    [
      "Deliveries",
      "Delivery package",
      safe(secureDeliveryService.getState().packages).filter(includes),
      ["Delivery", "Usage and Activity"],
      "Confidential",
      "Retain safe access history",
      "Security history",
    ],
    [
      "Search",
      "Search activity",
      safe(searchService.getState().analytics).filter(includes),
      ["Search", "Usage and Activity"],
      "Confidential",
      "Delete or anonymize",
      "12-month operational",
    ],
    [
      "Previews",
      "Preview activity",
      safe(watermarkedPreviewService.getState().analyticsEvents).filter(
        includes,
      ),
      ["Preview", "Usage and Activity"],
      "Confidential",
      "Delete or anonymize",
      "12-month operational",
    ],
    [
      "Storage",
      "Playback and file access",
      safe(storageService.getState().accessLogs).filter(includes),
      ["Device and Session", "Usage and Activity"],
      "Restricted",
      "Retain redacted history",
      "Security history",
    ],
    [
      "Communication",
      "Email notification",
      safe(emailService.read().messages).filter(includes),
      ["Communication", "Marketing Preference"],
      "Confidential",
      "Archive operational log",
      "24-month operational",
    ],
  ];
  return sources.map(
    ([
      module,
      entityType,
      records,
      dataCategories,
      sensitivity,
      deletionBehavior,
      retentionRule,
    ]) => ({
      module,
      entityType,
      recordCount: records.length,
      dataCategories,
      sensitivity,
      exportableCount: records.length,
      correctableCount: ["Account", "Buyer Verification", "Rights"].includes(
        module,
      )
        ? records.length
        : 0,
      deletionBehavior,
      retentionRule,
      legalHold: readPrivacyState().legalHolds.some(
        (hold) =>
          ["Active", "Under Review"].includes(hold.status) &&
          (hold.subjectUserIds.includes(subjectId) ||
            hold.organizationIds.includes(org)),
      ),
      requiresReviewer: [
        "Buyer Verification",
        "Rights",
        "Contracts",
        "Payments",
        "Licences",
      ].includes(module),
    }),
  );
}

export function discoverSubjectData(
  subjectId,
  scope = "All personal data",
  authorizationContext = context(),
) {
  const user = authorizationContext.user;
  if (!canAccessSubject(user, subjectId))
    throw new Error("You cannot discover another user’s data.");
  const results = sourceCounts(subjectId);
  if (internal(user))
    mutate((state) => {
      state.discoveryResults[subjectId] = {
        subjectId,
        scope,
        results,
        generatedAt: now(),
        generatedBy: user.id,
      };
      return true;
    });
  audit(
    "Data discovery run",
    user,
    { id: subjectId, reference: subjectId },
    `Privacy-safe discovery returned ${results.reduce((n, item) => n + item.recordCount, 0)} visible records.`,
  );
  return results;
}

export function calculateDeletionEligibility(
  subjectId,
  authorizationContext = context(),
) {
  const user = authorizationContext.user;
  if (!canAccessSubject(user, subjectId))
    throw new Error("You cannot assess another user’s deletion eligibility.");
  const subject = readAuthState().users.find((item) => item.id === subjectId);
  const org = subject?.organizationId;
  const contracts = safe(contractService.getState().contracts)
    .filter((item) => item.buyerId === subjectId || item.organizationId === org)
    .filter(
      (item) => !["Archived", "Cancelled", "Terminated"].includes(item.status),
    );
  const licences = safe(licenceService.getState().licences)
    .filter((item) => item.buyerId === subjectId || item.organizationId === org)
    .filter((item) =>
      [
        "Active",
        "Active with Conditions",
        "Expiring Soon",
        "Renewed",
        "Amended",
      ].includes(item.status),
    );
  const invoices = safe(paymentService.getState().invoices).filter(
    (item) =>
      (item.buyerId === subjectId || item.organizationId === org) &&
      Number(item.balanceDue) > 0,
  );
  const rights = safe(rightsService.getState().records).filter(
    (item) => item.userId === subjectId || item.artistId === org,
  );
  const holds = readPrivacyState().legalHolds.filter(
    (item) =>
      ["Active", "Under Review"].includes(item.status) &&
      (item.subjectUserIds.includes(subjectId) ||
        item.organizationIds.includes(org)),
  );
  const blockers = [
    ...(contracts.length ? ["Active contract"] : []),
    ...(licences.length ? ["Active licence"] : []),
    ...(invoices.length ? ["Outstanding invoice"] : []),
    ...(rights.length ? ["Rights ownership record"] : []),
    ...(holds.length ? ["Legal hold"] : []),
    "Audit-retention requirement",
  ];
  return {
    fullyDeletable: blockers.length === 0,
    deletableCategories: [
      "Marketing Preference",
      "Optional profile fields",
      "Saved searches",
    ],
    anonymizableCategories: ["Search", "Preview", "Analytics", "Support"],
    retainedCategories: [
      "Contractual",
      "Financial",
      "Payment",
      "Licence",
      "Rights and Ownership",
      "Audit",
      "Security",
    ],
    blockers,
    legalHold: holds.length > 0,
    activeContracts: contracts.map((item) => item.reference || item.id),
    activeLicences: licences.map((item) => item.reference || item.id),
    outstandingPayments: invoices.map((item) => item.reference || item.id),
    disputes: rights
      .filter((item) => String(item.status).includes("Dispute"))
      .map((item) => item.id),
  };
}

export function evaluateRetention(record, currentDate = new Date()) {
  const state = readPrivacyState();
  const hold = state.legalHolds.some(
    (item) =>
      ["Active", "Under Review"].includes(item.status) &&
      (item.subjectUserIds.includes(record.subjectUserId) ||
        item.entityScopes.includes(record.id)),
  );
  if (hold) return "Legal Hold";
  const rule = state.retentionRules.find(
    (item) => item.id === record.retentionRuleId,
  );
  if (!rule) return "Review Required";
  if (!record.eligibleDate) return "Not Yet Eligible";
  if (new Date(record.eligibleDate) > currentDate) return "Not Yet Eligible";
  return rule.actionAtExpiry;
}

export const privacyService = {
  getState: readPrivacyState,
  getDataClassifications(user = currentUser()) {
    if (internal(user)) requirePermission("privacy.inventory.view", user);
    return clone(readPrivacyState().classifications);
  },
  getDataInventory(user = currentUser()) {
    requirePermission("privacy.inventory.view", user);
    return clone(readPrivacyState().dataInventory);
  },
  getProcessingPurposes(user = currentUser()) {
    return clone(
      readPrivacyState().processingPurposes.filter(
        (item) => internal(user) || item.status === "Active",
      ),
    );
  },
  getPrivacyNotices(user = currentUser()) {
    return clone(
      readPrivacyState().privacyNotices.filter(
        (item) => internal(user) || item.status === "Active",
      ),
    );
  },
  acknowledgePrivacyNotice(noticeId, user = currentUser()) {
    const notice = this.getPrivacyNotices(user).find(
      (item) => item.id === noticeId,
    );
    if (!notice || notice.status !== "Active")
      throw new Error("Only an active notice may be acknowledged.");
    return mutate((state) => {
      const item = {
        id: uid("ack"),
        userId: user.id,
        organizationId: user.organizationId,
        noticeId: notice.id,
        noticeVersion: notice.version,
        acknowledgmentType: "Acknowledged",
        acknowledgedAt: now(),
        declinedAt: null,
        source: "Privacy settings",
        sessionId: authService.getCurrentSession()?.id || null,
        required: notice.requiredAcknowledgment,
        metadata: { prototype: true },
      };
      state.acknowledgments.unshift(item);
      audit(
        "Notice acknowledged",
        user,
        item,
        `${notice.name} v${notice.version} acknowledged.`,
      );
      notify(
        user.id,
        "Privacy notice acknowledged",
        `${notice.name} v${notice.version} was recorded.`,
      );
      return item;
    });
  },
  getUserConsents(userId, user = currentUser()) {
    if (user.id !== userId && !internal(user))
      throw new Error("You cannot view another user’s consent history.");
    if (internal(user)) requirePermission("privacy.consents.view", user);
    return clone(
      readPrivacyState().consents.filter((item) => item.userId === userId),
    );
  },
  setConsent(purposeId, enabled, user = currentUser()) {
    const purpose = readPrivacyState().processingPurposes.find(
      (item) => item.id === purposeId,
    );
    if (!purpose?.consentRequired)
      throw new Error(
        "Essential or contractual processing cannot be changed as optional consent.",
      );
    return mutate((state) => {
      state.consents
        .filter(
          (item) =>
            item.userId === user.id &&
            item.purposeId === purposeId &&
            item.status === "Granted",
        )
        .forEach((item) => {
          item.status = "Superseded";
        });
      const item = {
        id: uid("consent"),
        userId: user.id,
        organizationId: user.organizationId,
        purposeId,
        consentType: purpose.name,
        status: enabled ? "Granted" : "Withdrawn",
        noticeId: "notice-6",
        noticeVersion: 1,
        grantedAt: enabled ? now() : null,
        withdrawnAt: enabled ? null : now(),
        expiresAt: null,
        source: "Privacy settings",
        evidence: { method: "Explicit toggle", prototype: true },
        metadata: { essential: false },
      };
      state.consents.unshift(item);
      const cookie = state.cookiePreferences.find(
        (pref) => pref.userId === user.id,
      ) || {
        userId: user.id,
        essential: true,
        functional: true,
        analytics: false,
        personalization: false,
        marketing: false,
        noticeVersion: 1,
        source: "Privacy settings",
      };
      if (purposeId === "purpose-marketing-communication")
        cookie.marketing = enabled;
      if (purposeId === "purpose-operational-analytics")
        cookie.analytics = enabled;
      cookie.updatedAt = now();
      if (!state.cookiePreferences.includes(cookie))
        state.cookiePreferences.push(cookie);
      try {
        if (purposeId === "purpose-marketing-communication")
          emailService.updatePreferences(
            user.id,
            { marketingEnabled: enabled },
            user,
          );
      } catch {}
      audit(
        enabled ? "Consent granted" : "Consent withdrawn",
        user,
        item,
        `${purpose.name} ${enabled ? "granted" : "withdrawn"}.`,
      );
      notify(
        user.id,
        "Consent preference changed",
        `${purpose.name} is now ${enabled ? "enabled" : "disabled"}. Required transactional processing remains active.`,
      );
      return item;
    });
  },
  getCookiePreferences(user = currentUser()) {
    return clone(
      readPrivacyState().cookiePreferences.find(
        (item) => item.userId === user.id,
      ) || {
        userId: user.id,
        essential: true,
        functional: false,
        analytics: false,
        personalization: false,
        marketing: false,
        noticeVersion: 1,
        source: "Default — optional preferences off",
      },
    );
  },
  updateCookiePreferences(changes, user = currentUser()) {
    return mutate((state) => {
      let item = state.cookiePreferences.find(
        (pref) => pref.userId === user.id,
      );
      if (!item) {
        item = {
          userId: user.id,
          essential: true,
          functional: false,
          analytics: false,
          personalization: false,
          marketing: false,
          noticeVersion: 1,
          source: "Privacy settings",
        };
        state.cookiePreferences.push(item);
      }
      Object.assign(item, changes, { essential: true, updatedAt: now() });
      audit(
        "Cookie preferences changed",
        user,
        { id: user.id, reference: user.name },
        "Optional privacy preferences updated; essential remains enabled.",
      );
      return clone(item);
    });
  },
  getRequests(user = currentUser()) {
    const requests = readPrivacyState().requests;
    if (internal(user)) {
      requirePermission("privacy.requests.view", user);
      return clone(requests);
    }
    return clone(
      requests.filter(
        (item) =>
          item.requesterUserId === user.id ||
          item.subjectUserId === user.id ||
          (user.role === "vip_buyer" &&
            item.requesterOrganizationId === user.organizationId),
      ),
    );
  },
  getRequest(id, user = currentUser()) {
    const item = this.getRequests(user).find(
      (entry) => entry.id === id || entry.reference === id,
    );
    return item || null;
  },
  selectRequest(id) {
    localStorage.setItem(SELECTED_PRIVACY_REQUEST_KEY, id);
  },
  getSelectedRequest(user = currentUser()) {
    return this.getRequest(
      localStorage.getItem(SELECTED_PRIVACY_REQUEST_KEY),
      user,
    );
  },
  async createPrivacyRequest(payload, user = currentUser()) {
    await wait();
    requirePermission("privacy.requests.create", user);
    if (
      !payload.requestType ||
      String(payload.requestedDetails || "").trim().length < 8
    )
      throw new Error("Select a request type and provide a clear description.");
    return mutate((state) => {
      state.lastNumbers.request += 1;
      const highRisk = [
        "Data Export",
        "Deletion Request",
        "Account Closure",
        "Correction Request",
      ].includes(payload.requestType);
      const item = {
        id: uid("privacy-request"),
        reference: `BM-PRIV-2026-${String(state.lastNumbers.request).padStart(4, "0")}`,
        requestType: payload.requestType,
        requesterUserId: user.id,
        requesterOrganizationId: payload.organizationWide
          ? user.organizationId
          : null,
        subjectUserId: user.id,
        status: highRisk ? "Identity Verification Required" : "Submitted",
        priority: "Normal",
        submittedAt: now(),
        dueAt: dueDate(payload.requestType),
        identityVerificationStatus: highRisk ? "Required" : "Not Required",
        scope: payload.scope || ["Personal data"],
        requestedDetails: payload.requestedDetails,
        relatedEntityIds: [],
        assignedTo: "Privacy Administrator",
        reviewers: [],
        blockers: highRisk ? ["Identity verification required"] : [],
        decisions: [],
        exportId: null,
        deletionPlanId: null,
        resolutionSummary: null,
        completedAt: null,
        closedAt: null,
        metadata: { prototypeTarget: true },
      };
      state.requests.unshift(item);
      audit(
        "Data request submitted",
        user,
        item,
        `${item.reference} submitted.`,
      );
      notify(
        "user-privacy",
        "New privacy request",
        `${item.reference} requires review.`,
        "admin/privacy/requests",
      );
      notify(
        user.id,
        "Privacy request submitted",
        `${item.reference} was received.`,
      );
      return item;
    });
  },
  async verifyPrivacyRequestIdentity(requestId, code, user = currentUser()) {
    await wait();
    const item = this.getRequest(requestId, user);
    if (!item) throw new Error("Request not found.");
    if (code !== PRIVACY_CODE) {
      mutate((state) =>
        state.identityVerifications.unshift({
          id: uid("privacy-verification"),
          requestId,
          userId: user.id,
          status: "Failed",
          verifiedAt: null,
          attemptedAt: now(),
        }),
      );
      throw new Error("The privacy verification code is incorrect.");
    }
    return mutate((state) => {
      const target = state.requests.find((entry) => entry.id === item.id);
      target.identityVerificationStatus = "Verified";
      target.status = "Under Review";
      target.blockers = target.blockers.filter(
        (blocker) => blocker !== "Identity verification required",
      );
      const verification = {
        id: uid("privacy-verification"),
        requestId: item.id,
        userId: user.id,
        status: "Verified",
        verifiedAt: now(),
        attemptedAt: now(),
      };
      state.identityVerifications.unshift(verification);
      audit(
        "Identity verified",
        user,
        item,
        `${item.reference} identity challenge completed.`,
        "Critical",
      );
      notify(
        user.id,
        "Identity verification completed",
        `${item.reference} is now under review.`,
      );
      return target;
    });
  },
  discoverSubjectData,
  generatePrivacyExport(requestId, format = "JSON", user = currentUser()) {
    requirePermission("privacy.exports.generate", user);
    return mutate((state) => {
      const request = state.requests.find((item) => item.id === requestId);
      if (!request) throw new Error("Privacy request not found.");
      if (request.identityVerificationStatus !== "Verified")
        throw new Error(
          "Identity verification is required before export generation.",
        );
      const discovery = sourceCounts(request.subjectUserId);
      state.lastNumbers.export += 1;
      const item = {
        id: uid("privacy-export"),
        reference: `BM-PRIV-EXP-2026-${String(state.lastNumbers.export).padStart(4, "0")}`,
        requestId: request.id,
        subjectUserId: request.subjectUserId,
        organizationId: request.requesterOrganizationId,
        format,
        status: "Review Required",
        dataCategories: [
          ...new Set(discovery.flatMap((row) => row.dataCategories)),
        ],
        includedModules: discovery
          .filter((row) => row.exportableCount)
          .map((row) => row.module),
        excludedModules: [
          "Security investigations",
          "Internal legal advice",
          "Audit internals",
        ],
        redactions: [
          "Other users’ personal data",
          "Payment credentials",
          "Raw signatures",
          "Internal pricing logic",
          "Rights evidence belonging to another party",
          "Full temporary tokens",
          "Private storage paths",
          "Approval comments",
        ],
        recordCount: discovery.reduce((n, row) => n + row.exportableCount, 0),
        generatedAt: now(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        fileAssetId: null,
        downloadedAt: null,
        revokedAt: null,
        accessReference: null,
        preparedBy: user.id,
        approvedBy: null,
        manifest: {
          requestReference: request.reference,
          subject: request.subjectUserId,
          prototypeDisclaimer:
            "Browser-persisted export simulation; not a production data package.",
        },
      };
      state.exports.unshift(item);
      request.exportId = item.id;
      request.status = "Ready for Approval";
      audit(
        "Export generated",
        user,
        item,
        `${item.reference} prepared with redactions and requires approval.`,
        "Critical",
      );
      notify(
        "user-legal",
        "Privacy export approval required",
        `${item.reference} requires independent approval.`,
        "admin/privacy/exports",
      );
      return item;
    });
  },
  approvePrivacyExport(id, user = currentUser()) {
    requirePermission("privacy.exports.approve", user);
    return mutate((state) => {
      const item = state.exports.find((entry) => entry.id === id);
      if (!item || item.status !== "Review Required")
        throw new Error("Pending privacy export not found.");
      if (item.preparedBy === user.id)
        throw new Error(
          "Export preparers cannot approve their own restricted export.",
        );
      item.status = "Ready";
      item.approvedBy = user.id;
      item.fileAssetId = uid("privacy-export-asset");
      item.accessReference = uid("BM-URL-PRIV");
      const request = state.requests.find(
        (entry) => entry.id === item.requestId,
      );
      if (request) request.status = "Approved";
      notify(
        item.subjectUserId,
        "Data export ready",
        `${item.reference} is available through an expiring protected link.`,
      );
      audit(
        "Export approved",
        user,
        item,
        `${item.reference} independently approved.`,
        "Critical",
      );
      return item;
    });
  },
  calculateDeletionEligibility,
  createDeletionPlan(requestId, user = currentUser()) {
    requirePermission("privacy.deletion.plan", user);
    return mutate((state) => {
      const request = state.requests.find((item) => item.id === requestId);
      if (!request) throw new Error("Request not found.");
      if (request.identityVerificationStatus !== "Verified")
        throw new Error(
          "Identity verification is required before deletion planning.",
        );
      const eligibility = calculateDeletionEligibility(
        request.subjectUserId,
        context(user),
      );
      const item = {
        id: uid("deletion-plan"),
        requestId: request.id,
        subjectUserId: request.subjectUserId,
        actions: [
          ...eligibility.deletableCategories.map(
            (category) => `Delete ${category}`,
          ),
          ...eligibility.anonymizableCategories.map(
            (category) => `Anonymize ${category}`,
          ),
        ],
        retainedRecords: eligibility.retainedCategories,
        anonymizedRecords: eligibility.anonymizableCategories,
        deletedRecords: eligibility.deletableCategories,
        detachedRecords: [],
        accountAction: "Deactivate only after independent approval",
        scheduledAt: null,
        approvalStatus: eligibility.fullyDeletable
          ? "Ready for Approval"
          : "Partial Approval Required",
        createdBy: user.id,
        approvedBy: null,
        executedAt: null,
        rollbackAllowed: false,
        notes: eligibility.blockers.join("; "),
      };
      state.deletionPlans.unshift(item);
      request.deletionPlanId = item.id;
      request.status = "Ready for Approval";
      audit(
        "Deletion plan created",
        user,
        item,
        `${request.reference} deletion plan prepared; retained records preserved.`,
        "Critical",
      );
      return item;
    });
  },
  approveDeletionPlan(id, user = currentUser()) {
    requirePermission("privacy.deletion.approve", user);
    return mutate((state) => {
      const item = state.deletionPlans.find((entry) => entry.id === id);
      if (!item) throw new Error("Deletion plan not found.");
      if (item.createdBy === user.id)
        throw new Error("Deletion-plan creators cannot be the sole approver.");
      item.approvalStatus = "Approved";
      item.approvedBy = user.id;
      audit(
        "Deletion approved",
        user,
        item,
        "Deletion/anonymization plan independently approved.",
        "Critical",
      );
      return item;
    });
  },
  executeDeletionPlan(id, user = currentUser()) {
    requirePermission("privacy.deletion.execute", user);
    return mutate((state) => {
      const item = state.deletionPlans.find((entry) => entry.id === id);
      if (!item || item.approvalStatus !== "Approved")
        throw new Error("An independently approved deletion plan is required.");
      const eligibility = calculateDeletionEligibility(
        item.subjectUserId,
        context(user),
      );
      if (eligibility.legalHold)
        throw new Error("Legal hold blocks deletion and anonymization.");
      item.executedAt = now();
      item.accountAction = "Account deactivated; retained records preserved";
      const auth = readAuthState();
      const subject = auth.users.find(
        (entry) => entry.id === item.subjectUserId,
      );
      if (subject) {
        subject.accountStatus = "deactivated";
        subject.phone = "";
        subject.bio = "";
        subject.notificationPreferences = {
          security: true,
          licensing: true,
          editorial: false,
        };
      }
      writeAuthState(auth);
      audit(
        "Anonymization executed",
        user,
        item,
        "Approved nonessential fields removed; contractual, financial, rights, security, and audit records retained.",
        "Critical",
      );
      return item;
    });
  },
  applyProcessingRestriction(payload, user = currentUser()) {
    requirePermission("privacy.requests.review", user);
    return mutate((state) => {
      const item = {
        id: uid("restriction"),
        subjectUserId: payload.subjectUserId,
        organizationId: payload.organizationId || null,
        categories: payload.categories,
        reason: payload.reason,
        status: "Active",
        validFrom: now(),
        expiresAt: payload.expiresAt || null,
        imposedBy: user.name,
        approvedBy: user.id,
        exceptions: [
          "Contractual processing",
          "Payment processing",
          "Security logging",
          "Rights and legal records",
        ],
        metadata: { prototype: true },
      };
      state.restrictions.unshift(item);
      audit(
        "Processing restriction applied",
        user,
        item,
        `Optional processing restricted for ${payload.subjectUserId}.`,
      );
      return item;
    });
  },
  evaluateRetention,
  runRetentionReview(user = currentUser()) {
    requirePermission("privacy.retention.execute", user);
    return mutate((state) => {
      state.retentionReviews.forEach((item) => {
        item.evaluation = evaluateRetention(
          { ...item, subjectUserId: item.subjectUserId || null },
          new Date(),
        );
        item.lastReviewedAt = now();
      });
      audit(
        "Retention action evaluated",
        user,
        { id: "retention-run", reference: "Retention review" },
        `${state.retentionReviews.length} records evaluated; no raw data automatically deleted.`,
      );
      return state.retentionReviews;
    });
  },
  createLegalHold(payload, user = currentUser()) {
    requirePermission("privacy.legal_holds.manage", user);
    return mutate((state) => {
      state.lastNumbers.hold += 1;
      const item = {
        id: uid("legal-hold"),
        reference: `BM-HOLD-2026-${String(state.lastNumbers.hold).padStart(4, "0")}`,
        name: payload.name,
        reason: payload.reason,
        status: "Pending Approval",
        relatedCaseReference: payload.caseReference,
        subjectUserIds: payload.subjectUserIds || [],
        organizationIds: payload.organizationIds || [],
        entityScopes: payload.entityScopes || [],
        dataCategories: payload.dataCategories || [],
        createdAt: now(),
        createdBy: user.id,
        approvedBy: null,
        reviewDate: payload.reviewDate,
        releasedAt: null,
        releaseReason: null,
      };
      state.legalHolds.unshift(item);
      audit(
        "Legal hold created",
        user,
        item,
        `${item.reference} created pending approval.`,
        "Critical",
      );
      return item;
    });
  },
  releaseLegalHold(id, reason, user = currentUser()) {
    requirePermission("privacy.legal_holds.manage", user);
    return mutate((state) => {
      const item = state.legalHolds.find((entry) => entry.id === id);
      if (!item || !["Active", "Under Review"].includes(item.status))
        throw new Error("Active legal hold not found.");
      if (item.createdBy === user.id)
        throw new Error(
          "Legal-hold creators cannot release their own hold alone.",
        );
      item.status = "Released";
      item.releasedAt = now();
      item.releaseReason = reason;
      audit(
        "Legal hold released",
        user,
        item,
        `${item.reference} released after independent review.`,
        "Critical",
      );
      return item;
    });
  },
  getPrivacyVendors(user = currentUser()) {
    requirePermission("privacy.vendors.view", user);
    return clone(readPrivacyState().vendors);
  },
  reviewPrivacyVendor(id, payload, user = currentUser()) {
    requirePermission("privacy.vendors.manage", user);
    return mutate((state) => {
      const item = state.vendors.find((entry) => entry.id === id);
      if (!item) throw new Error("Vendor record not found.");
      item.privacyReviewStatus = payload.reviewStatus;
      item.status = payload.status || item.status;
      item.reviewedBy = user.id;
      item.reviewedAt = now();
      audit(
        "Vendor reviewed",
        user,
        item,
        `${item.name} privacy due diligence simulation updated.`,
      );
      return item;
    });
  },
  getIncidents(user = currentUser()) {
    requirePermission("privacy.incidents.view", user);
    return clone(readPrivacyState().incidents);
  },
  containPrivacyIncident(id, actions, user = currentUser()) {
    requirePermission("privacy.incidents.manage", user);
    return mutate((state) => {
      const item = state.incidents.find((entry) => entry.id === id);
      if (!item) throw new Error("Incident not found.");
      item.status = "Contained";
      item.containmentActions = [...item.containmentActions, ...actions];
      item.containedBy = user.id;
      item.containedAt = now();
      audit(
        "Incident contained",
        user,
        item,
        `${item.reference} contained with ${actions.length} actions.`,
        "Critical",
      );
      return item;
    });
  },
  resolvePrivacyIncident(id, summary, user = currentUser()) {
    requirePermission("privacy.incidents.resolve", user);
    return mutate((state) => {
      const item = state.incidents.find((entry) => entry.id === id);
      if (!item) throw new Error("Incident not found.");
      if (
        item.owner === user.name &&
        ["High", "Critical"].includes(item.severity)
      )
        throw new Error(
          "A high-severity incident owner cannot be the sole closer.",
        );
      item.status = "Resolved";
      item.resolvedAt = now();
      item.postIncidentReview = summary;
      audit(
        "Privacy incident resolved",
        user,
        item,
        `${item.reference} resolved after independent review.`,
        "Critical",
      );
      return item;
    });
  },
  getPrivacyAnalytics(user = currentUser()) {
    requirePermission("privacy.analytics.view", user);
    const state = readPrivacyState();
    return {
      openRequests: state.requests.filter(
        (item) => !["Completed", "Closed", "Cancelled"].includes(item.status),
      ).length,
      approachingDue: state.requests.filter(
        (item) =>
          new Date(item.dueAt) - Date.now() < 7 * 86400000 && !item.completedAt,
      ).length,
      completed: state.requests.filter((item) => item.status === "Completed")
        .length,
      deletions: state.requests.filter(
        (item) =>
          item.requestType.includes("Deletion") ||
          item.requestType === "Account Closure",
      ).length,
      exports: state.requests.filter(
        (item) =>
          item.requestType.includes("Export") ||
          item.requestType === "Access Request",
      ).length,
      restrictions: state.restrictions.filter((item) =>
        ["Active", "Partially Active"].includes(item.status),
      ).length,
      legalHolds: state.legalHolds.filter((item) =>
        ["Active", "Under Review"].includes(item.status),
      ).length,
      retentionDue: state.retentionReviews.filter(
        (item) => item.status === "Review Due",
      ).length,
      openIncidents: state.incidents.filter(
        (item) =>
          !["Resolved", "Closed", "False Positive"].includes(item.status),
      ).length,
      highRiskAssessments: state.assessments.filter((item) =>
        ["High", "Critical"].includes(item.residualRisk),
      ).length,
      vendorsDue: state.vendors.filter(
        (item) => item.privacyReviewStatus === "Due",
      ).length,
      withdrawnConsents: state.consents.filter(
        (item) => item.status === "Withdrawn",
      ).length,
      exportsReady: state.exports.filter(
        (item) => item.status === "Ready" && !item.downloadedAt,
      ).length,
    };
  },
  resetCompliancePrivacyDemoData() {
    localStorage.removeItem(PRIVACY_STORAGE_KEY);
    localStorage.removeItem(SELECTED_PRIVACY_REQUEST_KEY);
    return readPrivacyState();
  },
};

export const dataClassificationService = {
  getDataClassifications: (...args) =>
    privacyService.getDataClassifications(...args),
};
export const dataInventoryService = {
  getDataInventory: (...args) => privacyService.getDataInventory(...args),
};
export const processingPurposeService = {
  getProcessingPurposes: (...args) =>
    privacyService.getProcessingPurposes(...args),
};
export const privacyNoticeService = {
  getPrivacyNotices: (...args) => privacyService.getPrivacyNotices(...args),
  acknowledgePrivacyNotice: (...args) =>
    privacyService.acknowledgePrivacyNotice(...args),
};
export const consentService = {
  getUserConsents: (...args) => privacyService.getUserConsents(...args),
  grantConsent: (purpose, user) =>
    privacyService.setConsent(purpose, true, user),
  withdrawConsent: (purpose, user) =>
    privacyService.setConsent(purpose, false, user),
};
export const privacyRequestService = {
  createPrivacyRequest: (...args) =>
    privacyService.createPrivacyRequest(...args),
  getPrivacyRequest: (...args) => privacyService.getRequest(...args),
};
export const privacyIdentityService = {
  verifyPrivacyRequestIdentity: (...args) =>
    privacyService.verifyPrivacyRequestIdentity(...args),
};
export const dataDiscoveryService = { discoverSubjectData };
export const privacyExportService = {
  generatePrivacyExport: (...args) =>
    privacyService.generatePrivacyExport(...args),
  approvePrivacyExport: (...args) =>
    privacyService.approvePrivacyExport(...args),
};
export const deletionService = {
  calculateDeletionEligibility,
  createDeletionPlan: (...args) => privacyService.createDeletionPlan(...args),
  approveDeletionPlan: (...args) => privacyService.approveDeletionPlan(...args),
  executeDeletionPlan: (...args) => privacyService.executeDeletionPlan(...args),
};
export const processingRestrictionService = {
  applyProcessingRestriction: (...args) =>
    privacyService.applyProcessingRestriction(...args),
};
export const retentionService = {
  evaluateRetention,
  runRetentionReview: (...args) => privacyService.runRetentionReview(...args),
};
export const legalHoldService = {
  createLegalHold: (...args) => privacyService.createLegalHold(...args),
  releaseLegalHold: (...args) => privacyService.releaseLegalHold(...args),
};
export const privacyVendorService = {
  getPrivacyVendors: (...args) => privacyService.getPrivacyVendors(...args),
  reviewPrivacyVendor: (...args) => privacyService.reviewPrivacyVendor(...args),
};
export const privacyIncidentService = {
  getPrivacyIncidents: (...args) => privacyService.getIncidents(...args),
  containPrivacyIncident: (...args) =>
    privacyService.containPrivacyIncident(...args),
  resolvePrivacyIncident: (...args) =>
    privacyService.resolvePrivacyIncident(...args),
};
export const privacyAnalyticsService = {
  getPrivacyAnalytics: (...args) => privacyService.getPrivacyAnalytics(...args),
};
export const resetCompliancePrivacyDemoData = () =>
  privacyService.resetCompliancePrivacyDemoData();
