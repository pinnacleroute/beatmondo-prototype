import { authService, readAuthState } from "../auth/authService.js";
import { recordAuditEvent } from "../audit/auditService.js";
import {
  DEFAULT_PERMISSIONS_STATE,
  PERMISSIONS_STORAGE_KEY,
  SELECTED_ACCESS_USER_KEY,
  SELECTED_PERMISSION_KEY,
  SELECTED_ROLE_KEY,
} from "./permissionData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const parse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const canLegacy = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);
const legacyAliases = {
  "access.dashboard.view": ["users.manage", "audit.view", "email.view"],
  "access.users.view": ["users.manage", "buyers.view"],
  "access.roles.view": ["users.manage"],
  "access.permissions.view": ["users.manage"],
  "access.roles.create": ["users.manage"],
  "access.roles.edit": ["users.manage"],
  "access.roles.assign": ["users.manage"],
  "verification.applications.view": ["buyers.view"],
  "verification.applications.review": ["buyers.verify"],
  "memberships.records.view": ["memberships.view"],
  "rights.records.view": ["rights.view"],
  "rights.records.edit": ["rights.edit", "rights.manage"],
  "rights.documents.view": [
    "rights.manage_documents",
    "storage.view_documents",
  ],
  "catalog.tracks.view": ["catalog.view"],
  "catalog.tracks.edit": ["catalog.manage", "tracks.edit"],
  "catalog.tracks.publish": ["tracks.publish"],
  "ingestion.submissions.view": ["ingestion.view"],
  "storage.assets.view": ["storage.view"],
  "storage.masters.view": ["storage.view_masters"],
  "previews.records.generate": ["previews.generate"],
  "quotes.calculations.create": ["quotes.create"],
  "quotes.calculations.view_internal": ["quotes.view"],
  "quotes.pricing.override": ["quotes.manage_pricing"],
  "contracts.records.create": ["contracts.create"],
  "contracts.records.edit": ["contracts.edit"],
  "contracts.records.approve": [
    "contracts.approve_legal",
    "contracts.approve_licensing",
  ],
  "payments.transactions.view": ["payments.view"],
  "payments.transactions.process": ["payments.process"],
  "payments.reconciliation.manage": ["payments.reconcile"],
  "payments.refunds.approve": ["payments.approve_refund"],
  "licences.records.create": ["licences.create"],
  "licences.records.issue": ["licences.issue"],
  "deliveries.packages.create": ["deliveries.create"],
  "deliveries.packages.activate": ["deliveries.activate"],
  "temporary_access.records.revoke": ["expiring_access.revoke"],
  "audit.events.view": ["audit.view"],
  "audit.events.review": ["audit.review"],
  "audit.exports.create": ["audit.export"],
  "email.queue.manage": ["email.process_queue"],
  "email.templates.manage": ["email.manage_templates"],
  "email.triggers.manage": ["email.manage_triggers"],
};

function normalize(value) {
  const base = clone(DEFAULT_PERMISSIONS_STATE);
  if (!value || !Array.isArray(value.roles)) return base;
  const basePermissionKeys = new Set(
    base.permissionRegistry.map((item) => item.key),
  );
  const permissionRegistry = [
    ...base.permissionRegistry,
    ...(value.permissionRegistry || []).filter(
      (item) => !basePermissionKeys.has(item.key),
    ),
  ];
  const baseRoles = new Map(base.roles.map((item) => [item.id, item]));
  const roles = (value.roles || []).map((item) => {
    const current = baseRoles.get(item.id);
    if (!current || !item.systemRole) return item;
    return {
      ...item,
      permissionKeys: [
        ...new Set([...item.permissionKeys, ...current.permissionKeys]),
      ],
    };
  });
  base.roles.forEach((item) => {
    if (!roles.some((role) => role.id === item.id)) roles.push(item);
  });
  return {
    ...base,
    ...value,
    permissionRegistry,
    roles,
    roleVersions: value.roleVersions || [],
    assignments: value.assignments || [],
    directGrants: value.directGrants || [],
    explicitDenials: value.explicitDenials || [],
    temporaryElevations: value.temporaryElevations || [],
    approvalAuthorities: value.approvalAuthorities || [],
    accessRequests: value.accessRequests || [],
    delegations: value.delegations || [],
    impersonations: value.impersonations || [],
    accessReviews: value.accessReviews || [],
    conflicts: value.conflicts || [],
    systemAccounts: value.systemAccounts || base.systemAccounts,
    cache: value.cache || {},
    decisionLog: value.decisionLog || [],
    notifications: value.notifications || [],
  };
}
export function writePermissionsState(state) {
  const next = normalize(state);
  localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent("beatmondo-permissions-changed", {
      detail: { version: next.cacheVersion },
    }),
  );
  return next;
}
export function readPermissionsState() {
  const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
  const state = normalize(raw ? parse(raw) : null);
  if (!raw || !parse(raw)) writePermissionsState(state);
  expireTemporaryAccess(state);
  return state;
}
function mutate(fn) {
  const state = readPermissionsState();
  const result = fn(state);
  state.cache = {};
  state.cacheVersion += 1;
  writePermissionsState(state);
  return result;
}
function activeAt(item) {
  const time = Date.now();
  return (
    (!item.validFrom || new Date(item.validFrom).getTime() <= time) &&
    (!item.expiresAt || new Date(item.expiresAt).getTime() > time)
  );
}
function expireTemporaryAccess(state) {
  let changed = false;
  state.temporaryElevations.forEach((item) => {
    if (
      ["Active", "Scheduled"].includes(item.status) &&
      item.expiresAt &&
      new Date(item.expiresAt) <= new Date()
    ) {
      item.status = "Expired";
      changed = true;
    }
  });
  if (changed) {
    state.cache = {};
    state.cacheVersion += 1;
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(state));
  }
}
function audit(action, user, subject, description, severity = "High") {
  recordAuditEvent({
    module: "Admin Permissions",
    category: "Authorization",
    action,
    result: "Success",
    severity,
    user,
    entityType: subject.type || "Access Record",
    entityId: subject.id,
    subjectName: subject.reference || subject.name || action,
    description,
    visibility: severity === "Critical" ? "Security Restricted" : "Internal",
    confidentiality: severity === "Critical" ? "Restricted" : "Confidential",
    metadata: { authorizationChange: true },
  });
}
function notify(userId, title, body, action = "admin/access") {
  if (!userId) return;
  authService.addDemoMessage(userId, "permissions", title, body, action);
}

export function resolveRolePermissions(
  roleId,
  state = readPermissionsState(),
  trail = [],
) {
  if (trail.includes(roleId))
    throw new Error("Circular role inheritance is not allowed.");
  const role = state.roles.find((item) => item.id === roleId);
  if (!role || role.status !== "Active") return [];
  const inherited = role.inheritedRoleIds.flatMap((id) =>
    resolveRolePermissions(id, state, [...trail, roleId]),
  );
  return [...new Set([...inherited, ...role.permissionKeys])];
}
function scopeMatches(scope, resource = {}, user = null) {
  if (!scope || scope.type === "Global") return true;
  if (scope.type === "Self")
    return !resource.userId || resource.userId === user?.id;
  const mapping = {
    Organization: resource.organizationId,
    Artist: resource.artistId || resource.organizationId,
    Track: resource.trackId,
    Project: resource.projectId,
    Catalog: resource.catalogId,
    Territory: resource.territory,
    Record: resource.resourceId,
  };
  const candidate = mapping[scope.type];
  return !candidate || scope.ids.includes(candidate);
}

export function buildAuthorizationContext(userId, options = {}) {
  const state = readPermissionsState();
  const auth = readAuthState();
  const user = auth.users.find((item) => item.id === userId) || null;
  if (!user)
    return {
      user: null,
      activeRoles: [],
      directPermissions: [],
      explicitDenials: [],
      temporaryGrants: [],
      approvalLimits: {},
      impersonation: null,
      session: null,
      environment: "Prototype",
      version: state.cacheVersion,
    };
  const activeAssignments = state.assignments.filter(
    (item) =>
      item.userId === userId && item.status === "Active" && activeAt(item),
  );
  const activeRoles = activeAssignments
    .map((assignment) => ({
      assignment,
      role: state.roles.find((role) => role.id === assignment.roleId),
    }))
    .filter((item) => item.role?.status === "Active");
  const directPermissions = state.directGrants.filter(
    (item) =>
      item.userId === userId && item.status === "Active" && activeAt(item),
  );
  const explicitDenials = state.explicitDenials.filter(
    (item) =>
      item.userId === userId && item.status === "Active" && activeAt(item),
  );
  const temporaryGrants = state.temporaryElevations.filter(
    (item) =>
      item.userId === userId && item.status === "Active" && activeAt(item),
  );
  const rolePermissions = activeRoles.flatMap(({ role }) =>
    resolveRolePermissions(role.id, state),
  );
  const approvalLimits = activeRoles.reduce(
    (all, { role }) => ({ ...all, ...role.approvalLimits }),
    {},
  );
  state.approvalAuthorities
    .filter((item) => item.userId === userId && item.active && activeAt(item))
    .forEach((item) => {
      approvalLimits[item.approvalType] = item.maximumAmount;
    });
  temporaryGrants
    .filter((item) => item.requestedLimit)
    .forEach((item) => {
      if (item.permissionKey.includes("quote"))
        approvalLimits.Quote = Math.max(
          approvalLimits.Quote || 0,
          item.requestedLimit,
        );
    });
  return {
    user,
    activeRoles,
    activeAssignments,
    rolePermissions: [...new Set(rolePermissions)],
    directPermissions,
    explicitDenials,
    temporaryGrants,
    organizationMemberships: [user.organizationId],
    approvalLimits,
    impersonation:
      state.impersonations.find(
        (item) =>
          item.administratorId === userId &&
          item.status === "Active" &&
          activeAt(item),
      ) || null,
    session: authService.getCurrentSession(),
    environment: "Prototype",
    version: state.cacheVersion,
    options,
  };
}

export function canPerform(permissionKey, context, resource = {}) {
  const decision = {
    allowed: false,
    permissionKey,
    reason: "Permission is not granted.",
    code: "PERMISSION_NOT_GRANTED",
    source: null,
    matchedRole: null,
    matchedGrant: null,
    matchedScope: null,
    explicitDenial: false,
    requiresApproval: false,
    thresholdExceeded: false,
    separationOfDutiesBlocked: false,
    expiresAt: null,
  };
  if (!context?.user)
    return {
      ...decision,
      code: "AUTHENTICATION_REQUIRED",
      reason: "Sign in to continue.",
    };
  if (context.user.accountStatus !== "active")
    return {
      ...decision,
      code: "ACCOUNT_INACTIVE",
      reason: "The account is not active.",
    };
  const denial = context.explicitDenials.find(
    (item) =>
      item.permissionKey === permissionKey &&
      scopeMatches(item.scope, resource, context.user),
  );
  if (denial)
    return {
      ...decision,
      code: "EXPLICITLY_DENIED",
      reason: denial.reason,
      explicitDenial: true,
      matchedGrant: denial,
      matchedScope: denial.scope,
      expiresAt: denial.expiresAt,
    };
  if (
    context.impersonation &&
    [
      "quotes.respond",
      "signatures.sign",
      "payments.process",
      "downloads.complete",
      "buyers.verify",
    ].some((key) => permissionKey.includes(key))
  )
    return {
      ...decision,
      code: "IMPERSONATION_NOT_ALLOWED",
      reason:
        "This legally significant action is disabled during buyer impersonation.",
    };
  const direct = context.directPermissions.find(
    (item) =>
      item.permissionKey === permissionKey &&
      scopeMatches(item.scope, resource, context.user),
  );
  if (direct)
    return {
      ...decision,
      allowed: true,
      code: null,
      reason: "Allowed through a direct permission grant.",
      source: "Direct Grant",
      matchedGrant: direct,
      matchedScope: direct.scope,
      expiresAt: direct.expiresAt,
    };
  const temporary = context.temporaryGrants.find(
    (item) =>
      item.permissionKey === permissionKey &&
      scopeMatches(item.scope, resource, context.user),
  );
  if (temporary)
    return {
      ...decision,
      allowed: true,
      code: null,
      reason: "Allowed through an active temporary elevation.",
      source: "Temporary Elevation",
      matchedGrant: temporary,
      matchedScope: temporary.scope,
      expiresAt: temporary.expiresAt,
    };
  const roleMatch = context.activeRoles.find(
    ({ role, assignment }) =>
      resolveRolePermissions(role.id).includes(permissionKey) &&
      scopeMatches(assignment.scope, resource, context.user),
  );
  if (roleMatch)
    return {
      ...decision,
      allowed: true,
      code: null,
      reason: `Allowed through ${roleMatch.role.name}.`,
      source: "Role",
      matchedRole: roleMatch.role,
      matchedScope: roleMatch.assignment.scope,
    };
  if (
    canLegacy(context.user, permissionKey) ||
    (legacyAliases[permissionKey] || []).some((key) =>
      canLegacy(context.user, key),
    )
  )
    return {
      ...decision,
      allowed: true,
      code: null,
      reason: "Allowed through a compatible existing module permission.",
      source: "Legacy Compatibility",
    };
  return decision;
}

export function checkApprovalAuthority(context, request) {
  const maximumAllowed =
    context.approvalLimits[request.approvalType] ??
    context.approvalLimits.All ??
    0;
  const requestedValue = Number(
    request.amount ?? request.value ?? request.durationDays ?? 0,
  );
  const selfApproval =
    request.requestedBy && request.requestedBy === context.user?.id;
  const withinLimit = requestedValue <= maximumAllowed;
  return {
    allowed: withinLimit && !selfApproval,
    withinLimit,
    maximumAllowed,
    requestedValue,
    secondaryApprovalRequired:
      !withinLimit || selfApproval || request.riskLevel === "Critical",
    eligibleApprovers: ["user-preston", "user-security"].filter(
      (id) => id !== context.user?.id,
    ),
    reason: selfApproval
      ? "Separation of duties blocks self-approval."
      : withinLimit
        ? "Within active approval authority."
        : `Requested value exceeds the ${maximumAllowed} limit.`,
  };
}
export function checkSeparationOfDuties(action = {}) {
  const blocked =
    !!action.requestedBy &&
    action.requestedBy === action.approverId &&
    [
      "Quote",
      "Refund",
      "Role Assignment",
      "Restricted Audit Export",
      "Impersonation",
      "Rights Exception",
    ].includes(action.type);
  return {
    allowed: !blocked,
    blocked,
    code: blocked ? "SEPARATION_OF_DUTIES" : null,
    reason: blocked
      ? "The requester cannot be the sole approver for this sensitive action."
      : "No separation-of-duties conflict detected.",
  };
}
export function detectRoleConflicts(
  roleIds,
  grants = [],
  state = readPermissionsState(),
) {
  const permissions = [
    ...new Set(
      roleIds
        .flatMap((id) => resolveRolePermissions(id, state))
        .concat(grants.map((item) => item.permissionKey)),
    ),
  ];
  const findings = [];
  state.permissionRegistry.forEach((permission) =>
    permission.incompatiblePermissions
      .filter((key) => permissions.includes(key))
      .forEach((key) => {
        if (
          !findings.some(
            (item) =>
              item.permissions.includes(permission.key) &&
              item.permissions.includes(key),
          )
        )
          findings.push({
            conflict: true,
            severity: "Critical",
            permissions: [permission.key, key],
            recommendation: "Separate request and final approval authority.",
            blocked: true,
          });
      }),
  );
  return findings;
}
export function canViewField(fieldPermissionKey, context, resource) {
  return canPerform(fieldPermissionKey, context, resource);
}
export function applyFieldLevelRedaction(
  record,
  fieldPolicies,
  context,
  resource = {},
) {
  const next = clone(record);
  Object.entries(fieldPolicies).forEach(([field, permission]) => {
    if (!canPerform(permission, context, resource).allowed && field in next)
      next[field] = "Restricted — not available for your role";
  });
  return next;
}
export function createAuthorizationError(decision) {
  const error = new Error(decision.reason);
  error.name = "AuthorizationError";
  error.code = decision.code;
  error.permissionKey = decision.permissionKey;
  error.reason = decision.reason;
  error.requestAccessAllowed = ![
    "EXPLICITLY_DENIED",
    "ACCOUNT_INACTIVE",
  ].includes(decision.code);
  error.requestAccessRoute = "admin/access/requests";
  return error;
}

const routePolicies = [
  {
    prefix: "admin/privacy/incidents",
    permission: "privacy.incidents.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/legal-holds",
    permission: "privacy.legal_holds.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/vendors",
    permission: "privacy.vendors.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/assessments",
    permission: "privacy.assessments.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/exports",
    permission: "privacy.requests.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/inventory",
    permission: "privacy.inventory.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/purposes",
    permission: "privacy.purposes.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/notices",
    permission: "privacy.notices.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/consents",
    permission: "privacy.consents.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/retention",
    permission: "privacy.retention.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/requests",
    permission: "privacy.requests.view",
    internal: true,
  },
  {
    prefix: "admin/privacy/request",
    permission: "privacy.requests.view",
    internal: true,
  },
  {
    prefix: "admin/privacy",
    permission: "privacy.dashboard.view",
    internal: true,
  },
  {
    prefix: "settings/privacy",
    permission: "privacy.notices.view",
    internal: false,
  },
  {
    prefix: "privacy/request",
    permission: "privacy.requests.create",
    internal: false,
  },
  {
    prefix: "admin/analytics/security",
    permission: "analytics.security.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/permissions",
    permission: "analytics.permissions.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/finance",
    permission: "analytics.finance.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/rights",
    permission: "analytics.rights.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/operations",
    permission: "analytics.operations.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/commercial",
    permission: "analytics.commercial.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/catalog",
    permission: "analytics.catalog.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/search",
    permission: "analytics.search.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/buyers",
    permission: "analytics.buyers.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/artists",
    permission: "analytics.artists.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/email",
    permission: "analytics.email.view",
    internal: true,
  },
  {
    prefix: "admin/analytics/executive",
    permission: "analytics.executive.view",
    internal: true,
  },
  {
    prefix: "admin/analytics",
    permission: "access.dashboard.view",
    internal: true,
  },
  {
    prefix: "admin/reports/builder",
    permission: "reports.create",
    internal: true,
  },
  {
    prefix: "admin/reports/scheduled",
    permission: "reports.schedule",
    internal: true,
  },
  {
    prefix: "admin/reports/exports",
    permission: "reports.view",
    internal: true,
  },
  { prefix: "admin/reports", permission: "reports.view", internal: true },
  {
    prefix: "buyer/analytics",
    permission: "analytics.buyers.view",
    internal: false,
  },
  {
    prefix: "artist/analytics",
    permission: "analytics.artists.view",
    internal: false,
  },
  {
    prefix: "admin/access",
    permission: "access.dashboard.view",
    internal: true,
  },
  { prefix: "admin/email", permission: "email.queue.manage", internal: true },
  { prefix: "admin-audit", permission: "audit.events.view", internal: true },
  {
    prefix: "admin-payments",
    permission: "payments.transactions.view",
    internal: true,
  },
  { prefix: "admin-rights", permission: "rights.records.view", internal: true },
];
export function canAccessRoute(route, context) {
  const policy = routePolicies.find((item) => route.startsWith(item.prefix));
  if (!policy)
    return {
      allowed: true,
      path: route,
      requiredPermission: null,
      fallbackRoute: "access-denied",
      sensitivity: "Standard",
    };
  if (policy.internal && context.user?.userType !== "internal")
    return {
      allowed: false,
      code: "PERMISSION_NOT_GRANTED",
      reason: "Internal administrative access is required.",
      path: route,
      requiredPermission: policy.permission,
      fallbackRoute: "access-denied",
    };
  return {
    ...canPerform(policy.permission, context, {}),
    path: route,
    requiredPermission: policy.permission,
    fallbackRoute: "access-denied",
    sensitivity: "Restricted",
  };
}

function requirePermission(user, key, resource = {}) {
  const context = buildAuthorizationContext(user?.id);
  const decision = canPerform(key, context, resource);
  if (!decision.allowed) {
    mutate((state) => {
      state.decisionLog.unshift({
        id: uid("decision"),
        userId: user?.id,
        permissionKey: key,
        decision: "Denied",
        code: decision.code,
        reason: decision.reason,
        resource,
        createdAt: now(),
      });
      state.decisionLog = state.decisionLog.slice(0, 200);
    });
    throw createAuthorizationError(decision);
  }
  return context;
}

export const authorizationService = {
  getState: readPermissionsState,
  getPermissions() {
    return readPermissionsState().permissionRegistry;
  },
  getPermission(id) {
    return (
      readPermissionsState().permissionRegistry.find(
        (item) => item.id === id || item.key === id,
      ) || null
    );
  },
  getRoles() {
    return readPermissionsState().roles;
  },
  getRole(id) {
    return (
      readPermissionsState().roles.find(
        (item) => item.id === id || item.key === id,
      ) || null
    );
  },
  resolveRolePermissions,
  buildContext: buildAuthorizationContext,
  canPerform,
  canAccessRoute,
  canViewField,
  redact: applyFieldLevelRedaction,
  checkApprovalAuthority,
  checkSeparationOfDuties,
  detectRoleConflicts,
  selectUser(id) {
    localStorage.setItem(SELECTED_ACCESS_USER_KEY, id);
  },
  getSelectedUser() {
    return (
      readAuthState().users.find(
        (item) => item.id === localStorage.getItem(SELECTED_ACCESS_USER_KEY),
      ) || null
    );
  },
  selectRole(id) {
    localStorage.setItem(SELECTED_ROLE_KEY, id);
  },
  getSelectedRole() {
    return this.getRole(localStorage.getItem(SELECTED_ROLE_KEY));
  },
  selectPermission(id) {
    localStorage.setItem(SELECTED_PERMISSION_KEY, id);
  },
  getSelectedPermission() {
    return this.getPermission(localStorage.getItem(SELECTED_PERMISSION_KEY));
  },
  calculateEffectivePermissions(userId, resource = {}) {
    const context = buildAuthorizationContext(userId);
    const registry = readPermissionsState().permissionRegistry;
    const decisions = registry.map((permission) =>
      canPerform(permission.key, context, resource),
    );
    return {
      context,
      allowed: decisions.filter((item) => item.allowed),
      denied: decisions.filter((item) => !item.allowed),
      decisions,
    };
  },
  createRole(payload, user = authService.getCurrentUser()) {
    requirePermission(user, "access.roles.create");
    return mutate((state) => {
      if (payload.inheritedRoleIds?.some((id) => id === payload.id))
        throw new Error("A role cannot inherit itself.");
      const conflicts = detectRoleConflicts(
        payload.inheritedRoleIds || [],
        (payload.permissionKeys || []).map((permissionKey) => ({
          permissionKey,
        })),
        state,
      );
      const critical = (payload.permissionKeys || []).some(
        (key) =>
          state.permissionRegistry.find((item) => item.key === key)
            ?.riskLevel === "Critical",
      );
      const role = {
        id: uid("role-custom"),
        key: `custom_${String(payload.name).toLowerCase().replace(/\W+/g, "_")}`,
        name: payload.name,
        description: payload.description,
        type: "Custom",
        status: critical ? "Draft" : "Active",
        permissionKeys: payload.permissionKeys || [],
        inheritedRoleIds: payload.inheritedRoleIds || [],
        defaultScopes: payload.defaultScopes || [
          { type: "Record", ids: [], includeChildren: false },
        ],
        approvalLimits: payload.approvalLimits || {},
        systemRole: false,
        assignableByRoleIds: ["role-super-admin"],
        requiresApprovalToAssign: critical,
        version: 1,
        createdAt: now(),
        createdBy: user.name,
        updatedAt: now(),
        updatedBy: user.name,
        conflicts,
      };
      state.roles.unshift(role);
      audit(
        "Role created",
        user,
        role,
        `${role.name} created with ${role.permissionKeys.length} direct permissions.`,
        critical ? "Critical" : "High",
      );
      return role;
    });
  },
  createRoleVersion(id, changes, reason, user = authService.getCurrentUser()) {
    requirePermission(user, "access.roles.edit");
    return mutate((state) => {
      const role = state.roles.find((item) => item.id === id);
      if (!role) throw new Error("Role not found.");
      const inheritance = changes.inheritedRoleIds || role.inheritedRoleIds;
      inheritance.forEach((inherited) =>
        resolveRolePermissions(inherited, state, [role.id]),
      );
      state.roleVersions.unshift({
        id: uid("role-version"),
        roleId: id,
        version: role.version,
        snapshot: clone(role),
        reason,
        createdAt: now(),
        createdBy: user.name,
      });
      Object.assign(role, clone(changes), {
        version: role.version + 1,
        updatedAt: now(),
        updatedBy: user.name,
      });
      audit(
        "Role edited",
        user,
        role,
        `${role.name} advanced to version ${role.version}: ${reason}`,
      );
      return role;
    });
  },
  assignRole(payload, user = authService.getCurrentUser()) {
    requirePermission(user, "access.roles.assign");
    return mutate((state) => {
      const target = readAuthState().users.find(
        (item) => item.id === payload.userId,
      );
      const role = state.roles.find(
        (item) => item.id === payload.roleId && item.status === "Active",
      );
      if (!target || !role) throw new Error("Select an active user and role.");
      if (target.userType !== "internal" && role.type === "Internal")
        throw new Error("External users cannot receive internal roles.");
      const conflicts = detectRoleConflicts(
        state.assignments
          .filter(
            (item) => item.userId === target.id && item.status === "Active",
          )
          .map((item) => item.roleId)
          .concat(role.id),
        [],
        state,
      );
      const critical =
        role.requiresApprovalToAssign || conflicts.some((item) => item.blocked);
      const assignment = {
        id: uid("assignment"),
        userId: target.id,
        roleId: role.id,
        roleVersion: role.version,
        status: critical ? "Pending Approval" : "Active",
        scopeIds: payload.scope?.ids || [],
        scope: payload.scope || role.defaultScopes[0],
        organizationId: payload.organizationId || target.organizationId,
        assignedBy: user.id,
        assignedAt: now(),
        approvedBy: critical ? null : user.id,
        approvedAt: critical ? null : now(),
        validFrom: payload.validFrom || now(),
        expiresAt: payload.expiresAt || null,
        reason: payload.reason,
        temporary: !!payload.expiresAt,
        metadata: { conflicts },
      };
      state.assignments.unshift(assignment);
      notify(
        target.id,
        critical ? "Role assignment pending approval" : "Role assigned",
        `${role.name} ${critical ? "requires secondary approval" : "is active"}.`,
        "admin/access",
      );
      audit(
        "Role assigned",
        user,
        { ...assignment, reference: role.name },
        `${role.name} assigned to ${target.name} with status ${assignment.status}.`,
        critical ? "Critical" : "High",
      );
      return assignment;
    });
  },
  approveRoleAssignment(id, user = authService.getCurrentUser()) {
    requirePermission(user, "access.roles.assign");
    return mutate((state) => {
      const item = state.assignments.find((entry) => entry.id === id);
      if (!item || item.status !== "Pending Approval")
        throw new Error("Pending assignment not found.");
      if (item.assignedBy === user.id)
        throw new Error(
          "Separation of duties blocks self-approval of critical role assignments.",
        );
      item.status = "Active";
      item.approvedBy = user.id;
      item.approvedAt = now();
      audit(
        "Critical role assignment approved",
        user,
        item,
        "Secondary approval completed.",
        "Critical",
      );
      return item;
    });
  },
  revokeAssignment(id, reason, user = authService.getCurrentUser()) {
    requirePermission(user, "access.roles.assign");
    return mutate((state) => {
      const item = state.assignments.find((entry) => entry.id === id);
      item.status = "Revoked";
      item.revokedAt = now();
      item.revokedBy = user.id;
      item.revocationReason = reason;
      notify(
        item.userId,
        "Role access revoked",
        "An administrative role assignment was revoked. Contact your manager if unexpected.",
      );
      audit("Role revoked", user, item, reason, "Critical");
      return item;
    });
  },
  createGrant(payload, effect = "Allow", user = authService.getCurrentUser()) {
    requirePermission(
      user,
      effect === "Deny" ? "access.denials.create" : "access.grants.create",
    );
    return mutate((state) => {
      const collection =
        effect === "Deny" ? state.explicitDenials : state.directGrants;
      const grant = {
        id: uid(effect === "Deny" ? "denial" : "grant"),
        userId: payload.userId,
        permissionKey: payload.permissionKey,
        effect,
        scope: payload.scope,
        status: "Active",
        validFrom: payload.validFrom || now(),
        expiresAt: payload.expiresAt || null,
        reason: payload.reason,
        requestedBy: user.id,
        approvedBy: user.id,
        createdAt: now(),
      };
      collection.unshift(grant);
      notify(
        payload.userId,
        effect === "Deny" ? "Permission restricted" : "Permission granted",
        `${payload.permissionKey} was ${effect === "Deny" ? "restricted" : "granted"} with scoped access.`,
      );
      audit(
        effect === "Deny" ? "Explicit denial created" : "Direct grant created",
        user,
        grant,
        payload.reason,
        effect === "Deny" ? "Critical" : "High",
      );
      return grant;
    });
  },
  requestPermission(payload, user = authService.getCurrentUser()) {
    return mutate((state) => {
      const permission = state.permissionRegistry.find(
        (item) => item.key === payload.permissionKey,
      );
      const request = {
        id: uid("access-request"),
        reference: `BM-ACCESS-${new Date().getUTCFullYear()}-${String(++state.requestSequence).padStart(4, "0")}`,
        requesterId: payload.requesterId || user.id,
        permissionKey: payload.permissionKey,
        roleId: payload.roleId || null,
        scope: payload.scope,
        reason: payload.reason,
        risk: permission?.riskLevel || "Moderate",
        durationHours: payload.durationHours || 24,
        urgency: payload.urgency || "Normal",
        approverId: payload.approverId || "user-preston",
        status: "Under Review",
        conflicts: detectRoleConflicts(
          [],
          payload.permissionKey
            ? [{ permissionKey: payload.permissionKey }]
            : [],
          state,
        ),
        submittedAt: now(),
      };
      state.accessRequests.unshift(request);
      notify(
        request.requesterId,
        "Permission request submitted",
        `${request.reference} is under review.`,
      );
      audit(
        "Permission request submitted",
        user,
        request,
        payload.reason,
        request.risk,
      );
      return request;
    });
  },
  decideRequest(id, decision, reason, user = authService.getCurrentUser()) {
    requirePermission(user, "access.requests.review");
    return mutate((state) => {
      const request = state.accessRequests.find((item) => item.id === id);
      if (!request || !["Submitted", "Under Review"].includes(request.status))
        throw new Error("Reviewable request not found.");
      if (request.requesterId === user.id && request.risk === "Critical")
        throw new Error("Critical access cannot be self-approved.");
      request.status = decision;
      request.decisionReason = reason;
      request.decidedAt = now();
      request.decidedBy = user.id;
      if (decision === "Approved" && request.permissionKey)
        state.temporaryElevations.unshift({
          id: uid("elevation"),
          reference: `BM-ELEV-${new Date().getUTCFullYear()}-${String(++state.elevationSequence).padStart(4, "0")}`,
          userId: request.requesterId,
          permissionKey: request.permissionKey,
          roleId: request.roleId,
          scope: request.scope,
          status: "Active",
          validFrom: now(),
          expiresAt: new Date(
            Date.now() + request.durationHours * 3600000,
          ).toISOString(),
          reason: request.reason,
          requesterId: request.requesterId,
          approverId: user.id,
          ticket: request.reference,
          emergency: false,
        });
      if (decision === "Approved" && request.roleId) {
        const role = state.roles.find((item) => item.id === request.roleId);
        state.assignments.unshift({
          id: uid("assignment"),
          userId: request.requesterId,
          roleId: request.roleId,
          roleVersion: role?.version || 1,
          status: "Active",
          scopeIds: request.scope.ids,
          scope: request.scope,
          organizationId: "org-beatmondo",
          assignedBy: request.requesterId,
          assignedAt: request.submittedAt,
          approvedBy: user.id,
          approvedAt: now(),
          validFrom: now(),
          expiresAt: new Date(
            Date.now() + request.durationHours * 3600000,
          ).toISOString(),
          reason: request.reason,
          temporary: true,
          metadata: { sourceRequestId: request.id, secondaryApproval: true },
        });
      }
      notify(
        request.requesterId,
        `Permission request ${decision.toLowerCase()}`,
        `${request.reference}: ${reason}`,
      );
      audit(
        `Permission request ${decision.toLowerCase()}`,
        user,
        request,
        reason,
        request.risk,
      );
      return request;
    });
  },
  requestElevation(payload, user = authService.getCurrentUser()) {
    const maximum = payload.emergency ? 1 : 168;
    if (payload.durationHours > maximum)
      throw new Error(`Maximum duration is ${maximum} hours.`);
    return mutate((state) => {
      const item = {
        id: uid("elevation"),
        reference: `BM-ELEV-${new Date().getUTCFullYear()}-${String(++state.elevationSequence).padStart(4, "0")}`,
        userId: payload.userId || user.id,
        permissionKey: payload.permissionKey,
        roleId: payload.roleId || null,
        scope: payload.scope,
        status: payload.emergency ? "Active" : "Pending Approval",
        validFrom: payload.emergency ? now() : null,
        expiresAt: payload.emergency
          ? new Date(Date.now() + payload.durationHours * 3600000).toISOString()
          : null,
        reason: payload.reason,
        requesterId: user.id,
        approverId: payload.emergency ? user.id : null,
        ticket: payload.ticket,
        emergency: !!payload.emergency,
        postAccessReview: payload.emergency ? "Required" : null,
      };
      state.temporaryElevations.unshift(item);
      notify(
        item.userId,
        payload.emergency
          ? "Emergency access activated"
          : "Temporary access requested",
        `${item.reference} is ${item.status.toLowerCase()}.`,
      );
      audit(
        payload.emergency
          ? "Emergency access activated"
          : "Temporary elevation requested",
        user,
        item,
        payload.reason,
        payload.emergency ? "Critical" : "High",
      );
      return item;
    });
  },
  approveElevation(id, user = authService.getCurrentUser()) {
    requirePermission(user, "access.temporary.manage");
    return mutate((state) => {
      const item = state.temporaryElevations.find((entry) => entry.id === id);
      if (!item || item.status !== "Pending Approval")
        throw new Error("Pending elevation not found.");
      if (item.requesterId === user.id)
        throw new Error("Temporary elevation requires a different approver.");
      item.status = "Active";
      item.approverId = user.id;
      item.validFrom = now();
      item.expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
      audit(
        "Temporary elevation approved",
        user,
        item,
        "Scoped temporary permission activated.",
      );
      return item;
    });
  },
  createDelegation(payload, user = authService.getCurrentUser()) {
    return mutate((state) => {
      const context = buildAuthorizationContext(payload.delegatorId || user.id);
      const originalLimit = context.approvalLimits[payload.approvalType] || 0;
      if (payload.limit > originalLimit)
        throw new Error("Delegation cannot exceed the delegator's authority.");
      if (
        ["Role Assignment", "Emergency Access"].includes(payload.approvalType)
      )
        throw new Error("This approval type cannot be delegated.");
      const item = {
        id: uid("delegation"),
        reference: `BM-DELGT-${new Date().getUTCFullYear()}-${String(state.delegations.length + 1).padStart(4, "0")}`,
        delegatorId: payload.delegatorId || user.id,
        delegateId: payload.delegateId,
        approvalType: payload.approvalType,
        scope: payload.scope,
        limit: payload.limit,
        start: payload.start || now(),
        end: payload.end,
        reason: payload.reason,
        furtherDelegationAllowed: false,
        status:
          new Date(payload.start || now()) <= new Date()
            ? "Active"
            : "Scheduled",
      };
      state.delegations.unshift(item);
      audit("Approval delegation created", user, item, payload.reason);
      return item;
    });
  },
  requestImpersonation(payload, user = authService.getCurrentUser()) {
    requirePermission(user, "access.impersonation.request");
    const target = readAuthState().users.find(
      (item) => item.id === payload.targetUserId,
    );
    if (!target || target.userType === "internal")
      throw new Error(
        "Routine impersonation is limited to external buyer or artist support.",
      );
    return mutate((state) => {
      const item = {
        id: uid("impersonation"),
        reference: `BM-IMP-${new Date().getUTCFullYear()}-${String(state.impersonations.length + 1).padStart(4, "0")}`,
        administratorId: user.id,
        targetUserId: target.id,
        reason: payload.reason,
        scope: "View-only support",
        status: "Pending Approval",
        requestedAt: now(),
        approvedBy: null,
        approvedAt: null,
        startedAt: null,
        expiresAt: null,
        endedAt: null,
        sessionId: null,
        actionsPerformed: [],
      };
      state.impersonations.unshift(item);
      audit("Impersonation requested", user, item, payload.reason, "Critical");
      return item;
    });
  },
  approveImpersonation(id, user = authService.getCurrentUser()) {
    requirePermission(user, "access.impersonation.approve");
    return mutate((state) => {
      const item = state.impersonations.find((entry) => entry.id === id);
      if (!item || item.status !== "Pending Approval")
        throw new Error("Pending impersonation request not found.");
      if (item.administratorId === user.id)
        throw new Error("Impersonation requester cannot self-approve.");
      item.status = "Approved";
      item.approvedBy = user.id;
      item.approvedAt = now();
      audit(
        "Impersonation approved",
        user,
        item,
        "View-only support impersonation approved.",
        "Critical",
      );
      return item;
    });
  },
  startImpersonation(id, user = authService.getCurrentUser()) {
    requirePermission(user, "access.impersonation.start");
    return mutate((state) => {
      const item = state.impersonations.find((entry) => entry.id === id);
      if (
        !item ||
        item.status !== "Approved" ||
        item.administratorId !== user.id
      )
        throw new Error("Approved impersonation is not available.");
      item.status = "Active";
      item.startedAt = now();
      item.expiresAt = new Date(Date.now() + 30 * 60000).toISOString();
      item.sessionId = uid("impersonation-session");
      audit("Impersonation started", user, item, item.reason, "Critical");
      return item;
    });
  },
  endImpersonation(id, user = authService.getCurrentUser()) {
    return mutate((state) => {
      const item = state.impersonations.find(
        (entry) => entry.id === id && entry.status === "Active",
      );
      if (!item || item.administratorId !== user.id)
        throw new Error("Active impersonation session not found.");
      item.status = "Ended";
      item.endedAt = now();
      audit(
        "Impersonation ended",
        user,
        item,
        "Administrator ended the support session.",
        "Critical",
      );
      return item;
    });
  },
  decideReview(id, decision, comment, user = authService.getCurrentUser()) {
    requirePermission(user, "access.reviews.manage");
    return mutate((state) => {
      const review = state.accessReviews.find((item) => item.id === id);
      if (!review) throw new Error("Access review not found.");
      if (
        [
          "Keep Critical Access",
          "Extend Temporary Access",
          "Needs Investigation",
        ].includes(decision) &&
        !comment?.trim()
      )
        throw new Error("A reviewer comment is required.");
      review.findings.push(`${decision}: ${comment || "No change required"}`);
      review.status =
        decision === "Complete Review" ? "Completed" : "Awaiting Review";
      if (review.status === "Completed") review.completedAt = now();
      audit(
        "Access review decision recorded",
        user,
        review,
        `${decision}: ${comment || "No comment"}`,
      );
      return review;
    });
  },
  resolveConflict(id, status, reason, user = authService.getCurrentUser()) {
    requirePermission(user, "access.conflicts.manage");
    return mutate((state) => {
      const item = state.conflicts.find((entry) => entry.id === id);
      item.status = status;
      item.resolution = reason;
      item.resolvedAt = now();
      item.resolvedBy = user.id;
      audit("Access conflict mitigated", user, item, reason, "Critical");
      return item;
    });
  },
  rebuildContext(userId, user = authService.getCurrentUser()) {
    requirePermission(user, "access.dashboard.view");
    return mutate((state) => {
      delete state.cache[userId];
      return buildAuthorizationContext(userId);
    });
  },
  getAnalytics(user = authService.getCurrentUser()) {
    const state = readPermissionsState();
    requirePermission(user, "access.dashboard.view");
    const auth = readAuthState();
    const internal = auth.users.filter((item) => item.userType === "internal");
    return {
      internalUsers: internal.length,
      activeRoles: state.roles.filter((item) => item.status === "Active")
        .length,
      customRoles: state.roles.filter((item) => item.type === "Custom").length,
      pendingRequests: state.accessRequests.filter((item) =>
        ["Submitted", "Under Review"].includes(item.status),
      ).length,
      temporary: state.temporaryElevations.filter(
        (item) => item.status === "Active",
      ).length,
      expiringSoon: state.temporaryElevations.filter(
        (item) =>
          item.status === "Active" &&
          new Date(item.expiresAt) - Date.now() < 7 * 86400000,
      ).length,
      denials: state.explicitDenials.filter((item) => item.status === "Active")
        .length,
      conflicts: state.conflicts.filter((item) => item.status === "Open")
        .length,
      impersonations: state.impersonations.filter(
        (item) => item.status === "Active",
      ).length,
      overdueReviews: state.accessReviews.filter(
        (item) => item.status === "Overdue",
      ).length,
      dormant: internal.filter(
        (item) =>
          item.lastLoginAt &&
          Date.now() - new Date(item.lastLoginAt) > 60 * 86400000,
      ).length,
      decisionsDenied: state.decisionLog.filter(
        (item) => item.decision === "Denied",
      ).length,
    };
  },
  reset() {
    localStorage.setItem(
      PERMISSIONS_STORAGE_KEY,
      JSON.stringify(clone(DEFAULT_PERMISSIONS_STATE)),
    );
    localStorage.removeItem(SELECTED_ACCESS_USER_KEY);
    localStorage.removeItem(SELECTED_ROLE_KEY);
    localStorage.removeItem(SELECTED_PERMISSION_KEY);
    return readPermissionsState();
  },
};
export const resetAdminPermissionsDemoData = () => authorizationService.reset();
