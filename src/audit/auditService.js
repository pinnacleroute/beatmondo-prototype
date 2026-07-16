import { authService, readAuthState } from "../auth/authService.js";
import { expiringAccessService } from "../expiring-access/expiringAccessService.js";
import {
  AUDIT_STORAGE_KEY,
  DEFAULT_AUDIT_STATE,
  SELECTED_AUDIT_KEY,
} from "./auditData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const can = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);

const sensitiveKey =
  /password|passcode|mfa|otp|cvc|cvv|cardnumber|accountnumber|routingnumber|secret|token|signatureimage|taxid|storage(reference|key)|processor(raw|token)/i;
const safePaymentKey = /last4|cardbrand|amount|currency|paymentreference/i;

export function redactAuditValue(value, path = "", redactedFields = []) {
  if (Array.isArray(value))
    return value.map((item, index) =>
      redactAuditValue(item, `${path}[${index}]`, redactedFields),
    );
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const fieldPath = path ? `${path}.${key}` : key;
      if (sensitiveKey.test(key) && !safePaymentKey.test(key)) {
        redactedFields.push(fieldPath);
        return [key, "Redacted"];
      }
      return [key, redactAuditValue(item, fieldPath, redactedFields)];
    }),
  );
}

function parse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalize(value) {
  const base = clone(DEFAULT_AUDIT_STATE);
  if (!value || !Array.isArray(value.events)) return base;
  return {
    ...base,
    ...value,
    events: value.events,
    sourceEventKeys: value.sourceEventKeys || [],
    reviews: value.reviews || [],
    exports: value.exports || [],
    exportFiles: value.exportFiles || [],
    retentionPolicies: value.retentionPolicies || base.retentionPolicies,
    legalHolds: value.legalHolds || [],
    archiveActions: value.archiveActions || [],
    fallbackQueue: value.fallbackQueue || [],
    notifications: value.notifications || [],
    activity: value.activity || [],
  };
}

export function writeAuditState(value) {
  const next = normalize(value);
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(next));
  return next;
}

const sourceConfigs = [
  ["beatmondo-auth-demo-v1", "Authentication", ["securityEvents"]],
  ["beatmondo-buyer-verification-v1", "Buyer Verification", ["activity"]],
  ["beatmondo-membership-billing-v1", "Membership Billing", ["activity"]],
  ["beatmondo-rights-database-v1", "Rights Database", ["activity"]],
  ["beatmondo-search-infrastructure-v1", "Search Infrastructure", ["activity"]],
  ["beatmondo-track-ingestion-v1", "Track Ingestion", ["activity"]],
  [
    "beatmondo-file-storage-streaming-v1",
    "File Storage and Streaming",
    ["activity", "accessLogs"],
  ],
  ["beatmondo-watermarked-previews-v1", "Watermarked Previews", ["activity"]],
  ["beatmondo-quote-calculation-v1", "Quote Calculation", ["activity"]],
  [
    "beatmondo-contracts-esignature-v1",
    "Contracts and E-Signature",
    ["activity"],
  ],
  ["beatmondo-licensing-payments-v1", "Payments", ["activity"]],
  ["beatmondo-licence-generation-v1", "Licence Generation", ["activity"]],
  ["beatmondo-secure-delivery-v1", "Secure Delivery", ["activity"]],
  ["beatmondo-expiring-access-v1", "Temporary Access", ["activity"]],
];

function findActivity(value, keys) {
  const found = [];
  const visit = (item, depth = 0) => {
    if (!item || typeof item !== "object" || depth > 3) return;
    Object.entries(item).forEach(([key, child]) => {
      if (keys.includes(key) && Array.isArray(child)) found.push(...child);
      else if (Array.isArray(child))
        child.forEach((entry) => visit(entry, depth + 1));
    });
  };
  visit(value);
  return found;
}

function actorFor(userId, actorName, organizationId) {
  const user = readAuthState().users.find((item) => item.id === userId);
  return {
    actorType:
      user?.userType === "internal"
        ? "Internal User"
        : user?.userType === "artist"
          ? "Artist"
          : user
            ? "Buyer"
            : "Automated Process",
    userId: userId || null,
    displayName: user?.name || actorName || "Beatmondo Demo Automation",
    role: user?.roleLabel || null,
    organizationId: user?.organizationId || organizationId || null,
    organizationName: user?.organization || null,
    systemName: user ? null : "Beatmondo Demo Automation",
    impersonatedBy: null,
    authenticationMethod: null,
  };
}

function buildEvent(state, input) {
  const redactedFields = [];
  const safe = redactAuditValue(input, "", redactedFields);
  const user = input.user?.user || input.user || null;
  state.sequence += 1;
  return {
    id: uid("audit"),
    reference: `BM-AUD-${new Date().getUTCFullYear()}-${String(state.sequence).padStart(6, "0")}`,
    occurredAt: safe.occurredAt || safe.timestamp || now(),
    recordedAt: now(),
    module: safe.module || "System",
    category: safe.category || "Administration",
    eventType: safe.eventType || safe.action || "Activity recorded",
    action: safe.action || safe.eventType || "Activity recorded",
    result: safe.result || safe.status || "Success",
    severity: safe.severity || "Informational",
    actor:
      safe.actor || actorFor(user?.id, safe.actorName, safe.organizationId),
    subject: safe.subject || {
      entityType: safe.entityType || safe.resourceType || "System Record",
      entityId: safe.entityId || safe.resourceId || safe.id || null,
      reference: safe.subjectReference || safe.reference || null,
      displayName:
        safe.subjectName || safe.resource || safe.action || "Recorded activity",
    },
    organizationId: safe.organizationId || user?.organizationId || null,
    projectId: safe.projectId || null,
    parentEventId: safe.parentEventId || null,
    correlationId: safe.correlationId || uid("BM-CORR"),
    sessionId: safe.sessionId || null,
    requestId: safe.requestId || uid("request"),
    source: safe.source || "Prototype service",
    description: safe.description || "A prototype workflow event was recorded.",
    reason: safe.reason || null,
    before: safe.before || null,
    after: safe.after || null,
    changes: safe.changes || [],
    metadata: {
      ...(safe.metadata || {}),
      integrityHashPlaceholder: uid("demo-integrity"),
    },
    visibility: safe.visibility || "Internal",
    confidentiality: safe.confidentiality || "Standard",
    redactedFields: [
      ...new Set([...(safe.redactedFields || []), ...redactedFields]),
    ],
    reviewStatus:
      safe.reviewStatus ||
      (["High", "Critical"].includes(safe.severity)
        ? "Not Reviewed"
        : "Reviewed"),
    reviewedBy: safe.reviewedBy || null,
    reviewedAt: safe.reviewedAt || null,
    assignedTo: safe.assignedTo || null,
    retentionClass: safe.retentionClass || "Standard",
    retentionStatus: safe.retentionStatus || "Active",
    legalHoldId: safe.legalHoldId || null,
    environment: "Prototype",
    immutable: true,
    archivedAt: null,
  };
}

function syncExistingActivity(state) {
  let changed = false;
  sourceConfigs.forEach(([storageKey, module, activityKeys]) => {
    const source = parse(localStorage.getItem(storageKey));
    if (!source) return;
    findActivity(source, activityKeys).forEach((item, index) => {
      const sourceId =
        item.id || `${item.timestamp || item.createdAt || "event"}-${index}`;
      const sourceKey = `${storageKey}:${sourceId}`;
      if (state.sourceEventKeys.includes(sourceKey)) return;
      const category =
        module === "Authentication"
          ? "Authentication"
          : module === "Temporary Access"
            ? "Temporary Access"
            : module.replace(
                / Database| Calculation| Generation| Infrastructure| and Streaming| and E-Signature/,
                "",
              );
      const event = buildEvent(state, {
        ...item,
        module,
        category,
        action: item.action || item.type || item.event || "Activity recorded",
        result: String(item.result || item.status || "Success").replace(
          /^success$/i,
          "Success",
        ),
        actorName: item.actor || item.createdBy,
        entityId: item.resourceId || item.accessId || item.userId || sourceId,
        subjectName: item.resource || item.reference || item.description,
        description:
          item.description ||
          `${module} activity imported from the existing prototype module.`,
        metadata: { sourceEventKey: sourceKey, imported: true },
        visibility: item.visibility || "Internal",
        user: item.userId
          ? { id: item.userId, organizationId: item.organizationId }
          : null,
      });
      state.events.unshift(event);
      state.sourceEventKeys.push(sourceKey);
      changed = true;
    });
  });
  return changed;
}

export function readAuditState() {
  const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
  const state = normalize(raw ? parse(raw) : null);
  const changed = syncExistingActivity(state);
  if (!raw || !parse(raw) || changed) writeAuditState(state);
  return state;
}

function mutate(fn) {
  const state = readAuditState();
  const result = fn(state);
  writeAuditState(state);
  return result;
}

export function canViewAuditEvent(event, user = authService.getCurrentUser()) {
  if (!user) return event.visibility === "Public Activity";
  if (can(user, "*")) return true;
  const own =
    event.actor?.userId === user.id ||
    event.organizationId === user.organizationId;
  if (event.visibility === "Public Activity") return true;
  if (
    ["Buyer Visible", "Artist Visible", "Organization Visible"].includes(
      event.visibility,
    )
  )
    return own;
  if (!can(user, "audit.view") && !can(user, "audit.view_internal"))
    return false;
  return {
    "Finance Restricted": "audit.view_finance",
    "Rights Restricted": "audit.view_rights",
    "Legal Restricted": "audit.view_legal",
    "Security Restricted": "audit.view_security",
    "Super Admin Only": "*",
  }[event.visibility]
    ? can(
        user,
        {
          "Finance Restricted": "audit.view_finance",
          "Rights Restricted": "audit.view_rights",
          "Legal Restricted": "audit.view_legal",
          "Security Restricted": "audit.view_security",
          "Super Admin Only": "*",
        }[event.visibility],
      )
    : true;
}

function matches(event, filters) {
  const search = String(filters.search || "").toLowerCase();
  if (
    search &&
    ![
      event.reference,
      event.action,
      event.description,
      event.actor?.displayName,
      event.subject?.displayName,
      event.correlationId,
    ].some((item) =>
      String(item || "")
        .toLowerCase()
        .includes(search),
    )
  )
    return false;
  return (
    [
      "module",
      "category",
      "result",
      "severity",
      "visibility",
      "confidentiality",
      "reviewStatus",
      "correlationId",
      "organizationId",
    ].every(
      (key) =>
        !filters[key] || filters[key] === "All" || event[key] === filters[key],
    ) &&
    (!filters.actorId || event.actor?.userId === filters.actorId) &&
    (!filters.securityOnly ||
      event.category === "Security" ||
      ["Denied", "Blocked"].includes(event.result) ||
      ["High", "Critical"].includes(event.severity))
  );
}

export const auditService = {
  read: readAuditState,
  canView: canViewAuditEvent,
  record(input) {
    try {
      return mutate((state) => {
        if (state.health.eventPersistence !== "Operational") {
          const redactedFields = [];
          state.fallbackQueue.unshift({
            id: uid("fallback"),
            queuedAt: now(),
            payload: redactAuditValue(input, "", redactedFields),
            redactedFields,
            status: "Queued",
          });
          return {
            ok: false,
            queued: true,
            warning:
              "Audit persistence is degraded; the redacted event was queued.",
          };
        }
        const event = buildEvent(state, input);
        state.events.unshift(event);
        return { ok: true, event };
      });
    } catch {
      return {
        ok: false,
        queued: false,
        warning:
          "The workflow completed, but audit evidence could not be persisted.",
      };
    }
  },
  query(filters = {}, user = authService.getCurrentUser()) {
    const visible = readAuditState()
      .events.filter((event) => canViewAuditEvent(event, user))
      .filter((event) => matches(event, filters))
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    const pageSize = Number(filters.pageSize || 25);
    const page = Number(filters.page || 1);
    return {
      events: visible.slice((page - 1) * pageSize, page * pageSize),
      all: visible,
      total: visible.length,
      page,
      pageSize,
    };
  },
  getEvent(id, user = authService.getCurrentUser()) {
    const event = readAuditState().events.find(
      (item) => item.id === id || item.reference === id,
    );
    return event && canViewAuditEvent(event, user) ? event : null;
  },
  selectEvent(id) {
    localStorage.setItem(SELECTED_AUDIT_KEY, id);
  },
  getSelectedEvent(user) {
    return this.getEvent(localStorage.getItem(SELECTED_AUDIT_KEY), user);
  },
  correlation(id, user) {
    return this.query({ correlationId: id, pageSize: 200 }, user).all;
  },
  review(id, status, note, user = authService.getCurrentUser()) {
    if (!can(user, "audit.review"))
      throw new Error("You do not have permission to review audit events.");
    return mutate((state) => {
      const event = state.events.find((item) => item.id === id);
      if (!event) throw new Error("Audit event not found.");
      event.reviewStatus = status;
      event.reviewedBy = user.name;
      event.reviewedAt = now();
      state.reviews.unshift({
        id: uid("review"),
        eventId: id,
        status,
        note: note || "Review state updated.",
        userId: user.id,
        reviewer: user.name,
        createdAt: now(),
      });
      return event;
    });
  },
  assign(id, userId, user = authService.getCurrentUser()) {
    if (!can(user, "audit.assign"))
      throw new Error("You do not have permission to assign reviews.");
    return mutate((state) => {
      const event = state.events.find((item) => item.id === id);
      event.assignedTo = userId;
      event.reviewStatus = "In Review";
      return event;
    });
  },
  requestExport(filters, format, user = authService.getCurrentUser()) {
    if (!can(user, "audit.export"))
      throw new Error("You do not have permission to export audit evidence.");
    return mutate((state) => {
      const result = this.query({ ...filters, pageSize: 10000 }, user);
      const restricted = result.all.some((item) =>
        /Restricted|Highly Confidential/.test(
          `${item.visibility} ${item.confidentiality}`,
        ),
      );
      const exportRecord = {
        id: uid("audit-export"),
        reference: `BM-AEX-${new Date().getUTCFullYear()}-${String(state.exports.length + 1).padStart(4, "0")}`,
        format,
        filters,
        eventIds: result.all.map((item) => item.id),
        recordCount: result.total,
        restricted,
        status:
          restricted && !can(user, "audit.export_restricted")
            ? "Approval Required"
            : "Approved",
        requestedBy: user.name,
        requestedById: user.id,
        createdAt: now(),
        approvedAt:
          restricted && !can(user, "audit.export_restricted") ? null : now(),
        generatedAt: null,
        expiresAt: null,
        temporaryUrl: null,
      };
      state.exports.unshift(exportRecord);
      return exportRecord;
    });
  },
  approveExport(id, user = authService.getCurrentUser()) {
    if (!can(user, "audit.export_restricted"))
      throw new Error("Restricted export approval is required.");
    return mutate((state) => {
      const item = state.exports.find((entry) => entry.id === id);
      item.status = "Approved";
      item.approvedAt = now();
      item.approvedBy = user.name;
      return item;
    });
  },
  generateExport(id, user = authService.getCurrentUser()) {
    const prepared = mutate((state) => {
      const item = state.exports.find((entry) => entry.id === id);
      if (!item || item.status !== "Approved")
        throw new Error("This export must be approved before generation.");
      item.status = "Generating";
      return clone(item);
    });
    const temporary = expiringAccessService.generateExpiringAccess(
      {
        resourceType: "Audit export",
        resourceLabel: `${prepared.reference}.${prepared.format.toLowerCase()}`,
        resourceId: prepared.id,
        action: "DOWNLOAD",
      },
      user,
      {
        action: "DOWNLOAD",
        durationMinutes: 15,
        maxUses: 1,
        permission: "temporary_document.generate",
        requiredPermissions: ["audit.export"],
      },
    );
    return mutate((state) => {
      const item = state.exports.find((entry) => entry.id === id);
      item.status = "Ready";
      item.generatedAt = now();
      item.expiresAt = temporary.expiresAt;
      item.temporaryUrl = temporary.temporaryUrl;
      item.accessId = temporary.accessId;
      return item;
    });
  },
  applyLegalHold(
    ids,
    reason,
    caseReference,
    user = authService.getCurrentUser(),
  ) {
    if (!can(user, "audit.manage_retention"))
      throw new Error("Retention administration permission is required.");
    return mutate((state) => {
      const hold = {
        id: uid("legal-hold"),
        reference: `BM-HOLD-${String(state.legalHolds.length + 1).padStart(4, "0")}`,
        eventIds: ids,
        reason,
        caseReference,
        status: "Active",
        createdAt: now(),
        createdBy: user.name,
      };
      state.legalHolds.unshift(hold);
      state.events
        .filter((item) => ids.includes(item.id))
        .forEach((item) => {
          item.legalHoldId = hold.id;
          item.retentionStatus = "Legal Hold";
        });
      return hold;
    });
  },
  releaseLegalHold(id, reason, user = authService.getCurrentUser()) {
    if (!can(user, "audit.manage_retention"))
      throw new Error("Retention administration permission is required.");
    return mutate((state) => {
      const hold = state.legalHolds.find((item) => item.id === id);
      if (!hold) throw new Error("Legal hold not found.");
      hold.status = "Released";
      hold.releasedAt = now();
      hold.releasedBy = user.name;
      hold.releaseReason = reason || "Retention review completed.";
      state.events
        .filter((item) => item.legalHoldId === id)
        .forEach((item) => {
          item.legalHoldId = null;
          item.retentionStatus = "Active";
        });
      return hold;
    });
  },
  archiveEligible(user = authService.getCurrentUser()) {
    if (!can(user, "audit.manage_retention"))
      throw new Error("Retention administration permission is required.");
    return mutate((state) => {
      const eligible = state.events.filter(
        (item) =>
          !item.legalHoldId &&
          !item.archivedAt &&
          ["Informational", "Low"].includes(item.severity) &&
          ![
            "Payment",
            "Contract",
            "Signature",
            "Licence",
            "Rights",
            "Security",
          ].includes(item.category),
      );
      eligible.forEach((item) => {
        item.archivedAt = now();
        item.retentionStatus = "Archived";
      });
      state.archiveActions.unshift({
        id: uid("archive"),
        count: eligible.length,
        createdAt: now(),
        createdBy: user.name,
      });
      return eligible.length;
    });
  },
  restoreArchived(user = authService.getCurrentUser()) {
    if (!can(user, "audit.manage_retention"))
      throw new Error("Retention administration permission is required.");
    return mutate((state) => {
      const archived = state.events.filter((item) => item.archivedAt);
      archived.forEach((item) => {
        item.archivedAt = null;
        item.retentionStatus = "Active";
      });
      return archived.length;
    });
  },
  setHealth(service, status, user = authService.getCurrentUser()) {
    if (!can(user, "audit.manage_health"))
      throw new Error("Audit health administration permission is required.");
    return mutate((state) => {
      state.health[service] = status;
      return state.health;
    });
  },
  retryFallback(user = authService.getCurrentUser()) {
    if (!can(user, "audit.manage_health"))
      throw new Error("Audit health administration permission is required.");
    return mutate((state) => {
      if (state.health.eventPersistence !== "Operational")
        throw new Error("Restore event persistence before retrying the queue.");
      const queued = [...state.fallbackQueue];
      queued.forEach((item) =>
        state.events.unshift(
          buildEvent(state, {
            ...item.payload,
            metadata: {
              ...(item.payload.metadata || {}),
              recoveredFromFallback: true,
            },
          }),
        ),
      );
      state.fallbackQueue = [];
      return queued.length;
    });
  },
  analytics(user = authService.getCurrentUser()) {
    const events = this.query({ pageSize: 10000 }, user).all;
    const count = (key) =>
      events.reduce(
        (map, item) => ({ ...map, [item[key]]: (map[item[key]] || 0) + 1 }),
        {},
      );
    return {
      total: events.length,
      modules: count("module"),
      results: count("result"),
      severities: count("severity"),
      pendingReview: events.filter((item) =>
        ["Not Reviewed", "In Review", "Escalated"].includes(item.reviewStatus),
      ).length,
      security: events.filter(
        (item) =>
          item.category === "Security" ||
          ["Denied", "Blocked"].includes(item.result),
      ).length,
      overrides: events.filter((item) => item.metadata?.overrideUsed).length,
    };
  },
  reset() {
    localStorage.setItem(
      AUDIT_STORAGE_KEY,
      JSON.stringify(clone(DEFAULT_AUDIT_STATE)),
    );
    localStorage.removeItem(SELECTED_AUDIT_KEY);
    return readAuditState();
  },
};

export const recordAuditEvent = (input) => auditService.record(input);
