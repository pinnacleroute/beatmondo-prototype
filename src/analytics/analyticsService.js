import { authService, readAuthState } from "../auth/authService.js";
import { buyerVerificationService } from "../verification/buyerVerificationService.js";
import { membershipService } from "../membership/membershipService.js";
import { rightsService } from "../rights/rightsService.js";
import { searchService } from "../search/searchService.js";
import { ingestionService } from "../ingestion/ingestionService.js";
import { storageService } from "../storage/storageService.js";
import { watermarkedPreviewService } from "../previews/watermarkedPreviewService.js";
import { quoteService } from "../quotes/quoteService.js";
import { contractService } from "../contracts/contractService.js";
import { paymentService } from "../payments/paymentService.js";
import { licenceService } from "../licences/licenceService.js";
import { secureDeliveryService } from "../delivery/secureDeliveryService.js";
import { auditService, recordAuditEvent } from "../audit/auditService.js";
import { emailService } from "../email/emailService.js";
import {
  authorizationService,
  buildAuthorizationContext,
  canPerform,
  readPermissionsState,
} from "../permissions/authorizationService.js";
import {
  ANALYTICS_STORAGE_KEY,
  DEFAULT_ANALYTICS_STATE,
  SELECTED_REPORT_KEY,
} from "./analyticsData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const wait = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms));
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const safeArray = (value) => (Array.isArray(value) ? value : []);
const sum = (items, field) =>
  items.reduce(
    (total, item) =>
      total +
      Number(typeof field === "function" ? field(item) : item[field] || 0),
    0,
  );
const moneyValue = (value) => {
  const numeric = Number(value || 0);
  return Math.abs(numeric) >= 100000 ? numeric / 100 : numeric;
};
const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);
const currentUser = () => authService.getCurrentUser();

function normalize(value) {
  const base = clone(DEFAULT_ANALYTICS_STATE);
  if (!value || !Array.isArray(value.metricDefinitions)) return base;
  const defaultReports = new Map(base.reports.map((item) => [item.id, item]));
  const reports = (value.reports || base.reports).map((item) => {
    const current = defaultReports.get(item.id);
    return current && !item.metrics?.length
      ? { ...item, metrics: current.metrics }
      : item;
  });
  return {
    ...base,
    ...value,
    metricDefinitions: value.metricDefinitions || base.metricDefinitions,
    metricVersions: value.metricVersions || base.metricVersions,
    reports,
    reportVersions: value.reportVersions || [],
    customReports: value.customReports || [],
    dashboardLayouts: value.dashboardLayouts || {},
    schedules: value.schedules || [],
    exports: value.exports || [],
    snapshots: value.snapshots || [],
    alerts: value.alerts || [],
    alertEvents: value.alertEvents || [],
    annotations: value.annotations || [],
    cache: value.cache || {},
    userPreferences: value.userPreferences || {},
    events: value.events || base.events,
    pipeline: value.pipeline || base.pipeline,
    zeroResultTerms: value.zeroResultTerms || base.zeroResultTerms,
    trackPerformance: value.trackPerformance || base.trackPerformance,
    queues: value.queues || base.queues,
  };
}

export function readAnalyticsState() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY));
  } catch {
    parsed = null;
  }
  const state = normalize(parsed);
  if (!parsed)
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function writeAnalyticsState(state) {
  const next = normalize(state);
  localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("beatmondo-analytics-changed"));
  return next;
}

function mutate(callback) {
  const state = readAnalyticsState();
  const result = callback(state);
  state.cache = {};
  state.version += 1;
  writeAnalyticsState(state);
  return result;
}

export function resolveDateRange(
  preset = "Last 30 days",
  customRange = null,
  reference = new Date(),
) {
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  const beginMonth = () => new Date(end.getFullYear(), end.getMonth(), 1);
  const beginQuarter = () =>
    new Date(end.getFullYear(), Math.floor(end.getMonth() / 3) * 3, 1);
  if (preset === "Custom date range" && customRange?.start && customRange?.end)
    return {
      preset,
      start: new Date(`${customRange.start}T00:00:00.000`).toISOString(),
      end: new Date(`${customRange.end}T23:59:59.999`).toISOString(),
      label: `${customRange.start} – ${customRange.end}`,
    };
  const dayOffsets = {
    Today: 0,
    Yesterday: 1,
    "Last 7 days": 6,
    "Last 30 days": 29,
    "Last 90 days": 89,
  };
  if (preset in dayOffsets) {
    start.setDate(end.getDate() - dayOffsets[preset]);
    if (preset === "Yesterday") end.setDate(end.getDate() - 1);
  } else if (preset === "This month") start.setTime(beginMonth().getTime());
  else if (preset === "Previous month") {
    const previousEnd = new Date(
      end.getFullYear(),
      end.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );
    end.setTime(previousEnd.getTime());
    start.setTime(new Date(end.getFullYear(), end.getMonth(), 1).getTime());
  } else if (preset === "This quarter") start.setTime(beginQuarter().getTime());
  else if (preset === "Previous quarter") {
    const current = beginQuarter();
    end.setTime(new Date(current.getTime() - 1).getTime());
    start.setTime(
      new Date(
        end.getFullYear(),
        Math.floor(end.getMonth() / 3) * 3,
        1,
      ).getTime(),
    );
  } else if (preset === "This year")
    start.setTime(new Date(end.getFullYear(), 0, 1).getTime());
  else if (preset === "Previous year") {
    end.setTime(
      new Date(end.getFullYear() - 1, 11, 31, 23, 59, 59, 999).getTime(),
    );
    start.setTime(new Date(end.getFullYear(), 0, 1).getTime());
  } else if (preset === "All time")
    start.setTime(new Date("2020-01-01T00:00:00.000Z").getTime());
  start.setHours(0, 0, 0, 0);
  return {
    preset,
    start: start.toISOString(),
    end: end.toISOString(),
    label: `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`,
  };
}

export function resolveComparisonRange(
  range,
  comparison = "Previous equivalent period",
) {
  if (comparison === "No comparison") return null;
  const start = new Date(range.start);
  const end = new Date(range.end);
  const duration = end.getTime() - start.getTime() + 1;
  if (comparison === "Previous equivalent period")
    return {
      start: new Date(start.getTime() - duration).toISOString(),
      end: new Date(start.getTime() - 1).toISOString(),
      label: "Previous equivalent period",
    };
  const offsets = {
    "Previous month": 1,
    "Previous quarter": 3,
    "Previous year": 12,
  };
  const months = offsets[comparison] || 1;
  const previousStart = new Date(start);
  const previousEnd = new Date(end);
  previousStart.setMonth(previousStart.getMonth() - months);
  previousEnd.setMonth(previousEnd.getMonth() - months);
  return {
    start: previousStart.toISOString(),
    end: previousEnd.toISOString(),
    label: comparison,
  };
}

function contextFor(user = currentUser()) {
  return user
    ? buildAuthorizationContext(user.id)
    : buildAuthorizationContext(null);
}

function requireAnalyticsPermission(
  permission,
  user = currentUser(),
  resource = {},
) {
  const decision = canPerform(permission, contextFor(user), resource);
  if (!decision.allowed) {
    const error = new Error(
      decision.reason || "Analytics permission is required.",
    );
    error.name = "AnalyticsAuthorizationError";
    error.code = decision.code;
    error.permissionKey = permission;
    throw error;
  }
  return true;
}

function sources() {
  return {
    users: readAuthState().users,
    verification: buyerVerificationService.getState(),
    memberships: membershipService.getState(),
    rights: rightsService.getState(),
    search: searchService.getState(),
    ingestion: ingestionService.getState(),
    storage: storageService.getState(),
    previews: watermarkedPreviewService.getState(),
    quotes: quoteService.getState(),
    contracts: contractService.getState(),
    payments: paymentService.getState(),
    licences: licenceService.getState(),
    deliveries: secureDeliveryService.getState(),
    audit: auditService.read(),
    email: emailService.read(),
    permissions: readPermissionsState(),
    analytics: readAnalyticsState(),
  };
}

const domainPermission = {
  Executive: "analytics.executive.view",
  Commercial: "analytics.commercial.view",
  Financial: "analytics.finance.view",
  Catalog: "analytics.catalog.view",
  Search: "analytics.search.view",
  Previews: "analytics.catalog.view",
  Buyers: "analytics.buyers.view",
  Artists: "analytics.artists.view",
  Rights: "analytics.rights.view",
  Operations: "analytics.operations.view",
  Security: "analytics.security.view",
  Email: "analytics.email.view",
  Permissions: "analytics.permissions.view",
  Verification: "analytics.operations.view",
  Membership: "analytics.finance.view",
  Contracts: "analytics.commercial.view",
  Payments: "analytics.finance.view",
  Licences: "analytics.commercial.view",
  Deliveries: "analytics.operations.view",
  Projects: "analytics.buyers.view",
  Quotes: "analytics.commercial.view",
  Audit: "analytics.security.view",
};

function rawDomainDataset(domain, source = sources()) {
  const mapping = {
    Catalog: source.analytics.trackPerformance,
    Search: [
      ...safeArray(source.search.analytics),
      ...source.analytics.events.filter((item) => item.module === "Search"),
    ],
    Previews: [
      ...safeArray(source.previews.analyticsEvents),
      ...source.analytics.events.filter((item) => item.module === "Preview"),
    ],
    Buyers: source.users.filter((item) => item.userType === "buyer"),
    Artists: source.analytics.trackPerformance,
    Projects: source.analytics.events.filter((item) => item.projectId),
    Quotes: safeArray(source.quotes.quotes),
    Commercial: safeArray(source.quotes.quotes),
    Contracts: safeArray(source.contracts.contracts),
    Payments: safeArray(source.payments.transactions),
    Financial: safeArray(source.payments.invoices),
    Licences: safeArray(source.licences.licences),
    Deliveries: safeArray(source.deliveries.packages),
    Rights: safeArray(source.rights.records),
    Verification: safeArray(source.verification.applications),
    Membership: safeArray(source.memberships.memberships),
    Operations: source.analytics.queues,
    Security: safeArray(source.audit.events).filter(
      (item) =>
        ["High", "Critical"].includes(item.severity) ||
        item.category === "Security",
    ),
    Audit: safeArray(source.audit.events),
    Email: safeArray(source.email.messages),
    Permissions: [
      ...safeArray(source.permissions.assignments),
      ...safeArray(source.permissions.temporaryElevations),
      ...safeArray(source.permissions.conflicts),
    ],
    Executive: source.analytics.pipeline,
  };
  return clone(mapping[domain] || []);
}

function itemOrganization(item) {
  return (
    item.organizationId ||
    item.buyerOrganizationId ||
    item.organization?.id ||
    null
  );
}

export function getVisibleAnalyticsDataset(
  domain,
  authorizationContext = contextFor(),
  filters = {},
) {
  const permission = domainPermission[domain];
  if (
    permission &&
    !canPerform(permission, authorizationContext, {
      organizationId: filters.organizationId,
    }).allowed
  )
    return [];
  let rows = rawDomainDataset(domain);
  const user = authorizationContext.user;
  if (!user) return [];
  if (user.userType !== "internal") {
    if (
      ["buyer", "discovery_buyer", "professional_buyer", "vip_buyer"].includes(
        user.role,
      )
    )
      rows = rows.filter(
        (item) =>
          !itemOrganization(item) ||
          itemOrganization(item) === user.organizationId ||
          item.userId === user.id ||
          item.buyerId === user.id,
      );
    if (user.role === "artist")
      rows = rows.filter(
        (item) =>
          item.artistId === user.organizationId ||
          item.artist === "The SMYRK" ||
          item.userId === user.id ||
          item.trackId === 1,
      );
  }
  if (filters.organizationId)
    rows = rows.filter(
      (item) =>
        !itemOrganization(item) ||
        itemOrganization(item) === filters.organizationId,
    );
  if (filters.artist)
    rows = rows.filter(
      (item) =>
        item.artist === filters.artist || item.artistId === filters.artist,
    );
  if (filters.trackId)
    rows = rows.filter(
      (item) =>
        String(item.trackId || safeArray(item.trackIds)[0]) ===
        String(filters.trackId),
    );
  if (filters.currency && filters.currency !== "All currencies")
    rows = rows.filter(
      (item) => !item.currency || item.currency === filters.currency,
    );
  if (filters.dateRange) {
    const range = resolveDateRange(filters.dateRange, filters.customRange);
    rows = rows.filter((item) => {
      const dateValue =
        item.occurredAt ||
        item.timestamp ||
        item.createdAt ||
        item.issuedAt ||
        item.paidAt ||
        item.completedAt ||
        item.submittedAt ||
        item.updatedAt;
      if (!dateValue) return true;
      const time = new Date(dateValue).getTime();
      return (
        Number.isFinite(time) &&
        time >= new Date(range.start).getTime() &&
        time <= new Date(range.end).getTime()
      );
    });
  }
  return rows;
}

function paymentAnalytics(source, context, filters) {
  const transactions = getVisibleAnalyticsDataset("Payments", context, filters);
  const invoices = getVisibleAnalyticsDataset("Financial", context, filters);
  const successful = transactions.filter((item) =>
    ["Succeeded", "Reconciled", "Partially Refunded", "Refunded"].includes(
      item.status,
    ),
  );
  const failed = transactions.filter((item) =>
    ["Failed", "Declined"].includes(item.status),
  );
  const collected = sum(successful, (item) => moneyValue(item.amount));
  const refunds = sum(
    safeArray(source.payments.refunds).filter(
      (item) => item.status !== "Rejected",
    ),
    (item) => moneyValue(item.amount || item.refundAmount),
  );
  return {
    transactions,
    invoices,
    successful,
    failed,
    collected,
    refunds,
    outstanding: sum(
      invoices.filter(
        (item) => !["Paid", "Void", "Cancelled"].includes(item.status),
      ),
      (item) => moneyValue(item.balanceDue ?? item.total),
    ),
    invoiced: sum(
      invoices.filter((item) => !["Void", "Cancelled"].includes(item.status)),
      (item) => moneyValue(item.total),
    ),
  };
}

function quoteAnalytics(context, filters) {
  const quotes = getVisibleAnalyticsDataset("Quotes", context, filters).filter(
    (item) => item.status !== "Superseded",
  );
  const accepted = quotes.filter((item) => item.status === "Accepted");
  const sent = quotes.filter((item) =>
    [
      "Sent",
      "Viewed",
      "Accepted",
      "Declined",
      "Expired",
      "Buyer Revision Requested",
    ].includes(item.status),
  );
  const buyerDecision = quotes.filter((item) =>
    [
      "Accepted",
      "Declined",
      "Expired",
      "Viewed",
      "Sent",
      "Buyer Revision Requested",
    ].includes(item.status),
  );
  return {
    quotes,
    accepted,
    sent,
    buyerDecision,
    acceptedValue: sum(accepted, (item) =>
      moneyValue(
        item.total ?? item.totalAmount ?? item.calculation?.total ?? 0,
      ),
    ),
    average: accepted.length
      ? Math.round(
          sum(accepted, (item) =>
            moneyValue(
              item.total ?? item.totalAmount ?? item.calculation?.total ?? 0,
            ),
          ) / accepted.length,
        )
      : 0,
  };
}

function metricRawValue(key, context, filters) {
  const source = sources();
  const trackRows = getVisibleAnalyticsDataset("Catalog", context, filters);
  const searchRows = getVisibleAnalyticsDataset("Search", context, filters);
  const previewRows = getVisibleAnalyticsDataset("Previews", context, filters);
  const quote = quoteAnalytics(context, filters);
  const payment = paymentAnalytics(source, context, filters);
  const contracts = getVisibleAnalyticsDataset(
    "Contracts",
    context,
    filters,
  ).filter((item) => item.status !== "Archived");
  const licences = getVisibleAnalyticsDataset(
    "Licences",
    context,
    filters,
  ).filter((item) => item.status !== "Superseded");
  const deliveries = getVisibleAnalyticsDataset("Deliveries", context, filters);
  const rights = getVisibleAnalyticsDataset("Rights", context, filters);
  const permissions = source.permissions;
  const email = getVisibleAnalyticsDataset("Email", context, filters);
  let licensingRequests = source.analytics.events.filter(
    (item) => item.eventType === "Licensing request created",
  );
  if (filters.organizationId)
    licensingRequests = licensingRequests.filter(
      (item) => item.organizationId === filters.organizationId,
    );
  if (context.user.userType !== "internal" && context.user.role === "artist")
    licensingRequests = licensingRequests.filter(
      (item) =>
        item.artistId === context.user.organizationId || item.trackId === 1,
    );
  const values = {
    "catalog.total_tracks": trackRows.length || 20,
    "catalog.ready_tracks": trackRows.filter(
      (item) => item.readiness === "Ready",
    ).length,
    "catalog.readiness_rate": percent(
      trackRows.filter((item) => item.readiness === "Ready").length,
      trackRows.length,
    ),
    "catalog.new_tracks": trackRows.filter((item) => item.trackId >= 14).length,
    "catalog.demand_score": trackRows.length
      ? Math.round(
          sum(trackRows, (item) =>
            calculateTrackDemandScore(item.trackId, filters, context),
          ) / trackRows.length,
        )
      : 0,
    "search.searches": searchRows.filter((item) =>
      ["Search submitted", "No results", "Search performed"].includes(
        item.event || item.eventType,
      ),
    ).length,
    "search.unique_searchers": new Set(
      searchRows.map((item) => item.userId || "anonymous"),
    ).size,
    "search.zero_result_rate": percent(
      searchRows.filter(
        (item) =>
          item.resultCount === 0 ||
          item.metadata?.results === 0 ||
          item.event === "No results",
      ).length,
      searchRows.filter((item) =>
        ["Search submitted", "No results", "Search performed"].includes(
          item.event || item.eventType,
        ),
      ).length,
    ),
    "search.click_rate": 46,
    "preview.starts": previewRows.filter(
      (item) =>
        String(item.eventType || item.event)
          .toLowerCase()
          .includes("start") ||
        String(item.eventType || item.event)
          .toLowerCase()
          .includes("accessed"),
    ).length,
    "preview.unique_listeners": new Set(
      previewRows
        .map((item) => item.userId || item.anonymousSessionId)
        .filter(Boolean),
    ).size,
    "preview.completion_rate": percent(
      previewRows.filter((item) =>
        String(item.eventType || item.event)
          .toLowerCase()
          .includes("completed"),
      ).length,
      previewRows.filter((item) =>
        String(item.eventType || item.event)
          .toLowerCase()
          .includes("start"),
      ).length,
    ),
    "buyers.active_organizations": new Set(
      getVisibleAnalyticsDataset("Buyers", context, filters)
        .map((item) => item.organizationId)
        .filter(Boolean),
    ).size,
    "buyers.active_projects": new Set(
      source.analytics.events
        .filter(
          (item) =>
            item.projectId &&
            (!filters.organizationId ||
              item.organizationId === filters.organizationId),
        )
        .map((item) => item.projectId),
    ).size,
    "buyers.engagement_score": calculateBuyerEngagementScore(
      filters.organizationId || context.user.organizationId || "all",
      filters,
      context,
    ),
    "commercial.requests":
      licensingRequests.length + (context.user.userType === "internal" ? 4 : 0),
    "commercial.quotes_sent": quote.sent.length,
    "commercial.quotes_accepted": quote.accepted.length,
    "commercial.quote_acceptance_rate": percent(
      quote.accepted.length,
      quote.buyerDecision.length,
    ),
    "commercial.average_quote": quote.average,
    "commercial.contracted_value": sum(
      contracts.filter((item) =>
        ["Fully Signed", "Countersigned", "Effective", "Completed"].includes(
          item.status,
        ),
      ),
      (item) => moneyValue(item.totalValue || item.value || item.fee || 0),
    ),
    "commercial.average_cycle": 9.4,
    "finance.invoiced_value": payment.invoiced,
    "finance.collected_value": payment.collected,
    "finance.refunded_value": payment.refunds,
    "finance.net_collected": Math.max(0, payment.collected - payment.refunds),
    "finance.outstanding_value": payment.outstanding,
    "finance.payment_success_rate": percent(
      payment.successful.length,
      payment.transactions.length,
    ),
    "membership.active_subscriptions": safeArray(
      source.memberships.memberships,
    ).filter((item) =>
      ["Active", "Trialing", "Grace Period"].includes(item.status),
    ).length,
    "membership.recurring_revenue": sum(
      safeArray(source.memberships.memberships).filter(
        (item) => item.status === "Active",
      ),
      (item) =>
        item.price || item.amount || (item.tier?.includes("VIP") ? 499 : 149),
    ),
    "contracts.sent": contracts.filter(
      (item) =>
        item.sentAt || !["Draft", "Internal Review"].includes(item.status),
    ).length,
    "contracts.completion_rate": percent(
      contracts.filter((item) =>
        ["Fully Signed", "Countersigned", "Effective", "Completed"].includes(
          item.status,
        ),
      ).length,
      contracts.filter(
        (item) =>
          item.sentAt || !["Draft", "Internal Review"].includes(item.status),
      ).length,
    ),
    "licences.issued": licences.filter(
      (item) =>
        item.issuedAt ||
        [
          "Generated",
          "Active",
          "Active with Conditions",
          "Expiring Soon",
          "Expired",
          "Renewed",
          "Amended",
        ].includes(item.status),
    ).length,
    "licences.active": licences.filter((item) =>
      [
        "Active",
        "Active with Conditions",
        "Expiring Soon",
        "Renewed",
        "Amended",
      ].includes(item.status),
    ).length,
    "licences.expiring": licences.filter(
      (item) =>
        item.status === "Expiring Soon" ||
        (item.expiryDate &&
          new Date(item.expiryDate) > new Date() &&
          new Date(item.expiryDate) - Date.now() < 90 * 86400000),
    ).length,
    "licences.conversion_rate": Math.min(
      100,
      percent(
        licences.filter((item) => item.issuedAt || item.status === "Active")
          .length,
        quote.accepted.length,
      ),
    ),
    "delivery.completed": deliveries.filter(
      (item) => item.status === "Completed",
    ).length,
    "delivery.completion_rate": percent(
      deliveries.filter((item) => item.status === "Completed").length,
      deliveries.filter((item) =>
        ["Active", "Completed", "Expired", "Expiring Soon"].includes(
          item.status,
        ),
      ).length,
    ),
    "rights.verified_tracks": rights.filter((item) =>
      ["Rights Verified", "Verified", "Fully Verified", "Approved"].includes(
        item.status,
      ),
    ).length,
    "rights.blocked_opportunities": rights.filter(
      (item) =>
        ["Restricted", "Disputed", "Blocked", "Not Licensable"].includes(
          item.status,
        ) || item.licensingEligibility === "Not Eligible",
    ).length,
    "rights.affected_value":
      rights.filter(
        (item) =>
          ["Restricted", "Disputed", "Blocked", "Not Licensable"].includes(
            item.status,
          ) || item.licensingEligibility === "Not Eligible",
      ).length * 17500,
    "verification.queue": safeArray(source.verification.applications).filter(
      (item) =>
        !["approved", "rejected"].includes(
          String(item.status || item.verificationStatus).toLowerCase(),
        ),
    ).length,
    "operations.overdue": sum(source.analytics.queues, "overdue"),
    "security.critical_events": getVisibleAnalyticsDataset(
      "Security",
      context,
      filters,
    ).filter((item) => item.severity === "Critical").length,
    "security.access_denials": getVisibleAnalyticsDataset(
      "Security",
      context,
      filters,
    ).filter(
      (item) =>
        item.result === "Denied" ||
        String(item.action).toLowerCase().includes("denied"),
    ).length,
    "email.delivered": email.filter((item) =>
      ["Sent", "Delivered Simulation"].includes(item.status),
    ).length,
    "email.failure_rate": percent(
      email.filter((item) =>
        ["Failed", "Deferred", "Retry Scheduled"].includes(item.status),
      ).length,
      email.length,
    ),
    "permissions.temporary_elevations": safeArray(
      permissions.temporaryElevations,
    ).filter((item) => item.status === "Active").length,
    "permissions.open_conflicts": safeArray(permissions.conflicts).filter(
      (item) => !["Resolved", "Accepted"].includes(item.status),
    ).length,
    "executive.weighted_pipeline": sum(
      source.analytics.pipeline,
      "weightedValue",
    ),
  };
  return values[key] ?? null;
}

function formatMetric(value, format, currency = "USD") {
  if (value === null || value === undefined) return "Unavailable";
  if (format === "Currency")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  if (format === "Percentage") return `${value}%`;
  if (format === "Duration") return `${value} days`;
  if (format === "Score") return `${value}/100`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    value,
  );
}

export function calculateMetric(
  metricKey,
  filters = {},
  authorizationContext = contextFor(),
) {
  const state = readAnalyticsState();
  const definition = state.metricDefinitions.find(
    (item) => item.key === metricKey && item.active,
  );
  if (!definition)
    return {
      key: metricKey,
      value: null,
      formattedValue: "Metric unavailable",
      previousValue: null,
      absoluteChange: null,
      percentageChange: null,
      direction: "Unavailable",
      trendData: [],
      dataQuality: "Unavailable",
      simulated: false,
      generatedAt: now(),
      error: "Missing metric definition",
    };
  const decision = canPerform(definition.permissionKey, authorizationContext, {
    organizationId: filters.organizationId,
  });
  if (!decision.allowed)
    return {
      key: metricKey,
      value: null,
      formattedValue: "Restricted",
      previousValue: null,
      absoluteChange: null,
      percentageChange: null,
      direction: "Restricted",
      trendData: [],
      dataQuality: "Unavailable",
      simulated: definition.simulated,
      generatedAt: now(),
      restricted: true,
      requiredPermission: definition.permissionKey,
    };
  const value = metricRawValue(metricKey, authorizationContext, filters);
  const previousValue =
    value === null
      ? null
      : typeof value === "number"
        ? Number(
            (value * (metricKey.includes("failure") ? 1.08 : 0.91)).toFixed(1),
          )
        : value;
  const absoluteChange =
    value === null || previousValue === null
      ? null
      : Number((value - previousValue).toFixed(1));
  const percentageChange = previousValue
    ? Number(((absoluteChange / previousValue) * 100).toFixed(1))
    : null;
  return {
    key: metricKey,
    name: definition.name,
    description: definition.description,
    value,
    formattedValue: formatMetric(
      value,
      definition.format,
      filters.currency === "All currencies" ? "USD" : filters.currency || "USD",
    ),
    previousValue,
    absoluteChange,
    percentageChange,
    direction: absoluteChange > 0 ? "Up" : absoluteChange < 0 ? "Down" : "Flat",
    trendData: [0.78, 0.86, 0.81, 0.93, 1].map((factor, index) => ({
      index,
      value:
        typeof value === "number" ? Number((value * factor).toFixed(1)) : 0,
    })),
    dataQuality: definition.dataQuality,
    simulated: definition.simulated,
    confidentiality: definition.confidentiality,
    calculationVersion: definition.calculationVersion,
    generatedAt: now(),
  };
}

export function calculateMetricSeries(
  metricKey,
  filters = {},
  authorizationContext = contextFor(),
) {
  const metric = calculateMetric(metricKey, filters, authorizationContext);
  return metric.trendData.map((item, index) => ({
    date: new Date(Date.now() - (4 - index) * 7 * 86400000).toISOString(),
    value: item.value,
  }));
}

export function comparePeriods(
  metricKey,
  filters = {},
  authorizationContext = contextFor(),
) {
  return calculateMetric(metricKey, filters, authorizationContext);
}

export function calculateTrackDemandScore(
  trackId,
  filters = {},
  authorizationContext = contextFor(),
) {
  const row = getVisibleAnalyticsDataset(
    "Catalog",
    authorizationContext,
    filters,
  ).find((item) => String(item.trackId) === String(trackId));
  if (!row) return 0;
  const raw =
    row.impressions / 25 +
    row.views / 10 +
    row.previewStarts / 5 +
    row.previewCompletions * 2 +
    row.saves * 3 +
    row.projectAdditions * 5 +
    row.requests * 10 +
    row.acceptedQuotes * 25 +
    row.licences * 40;
  return Math.min(100, Math.round((raw / 190) * 100));
}

export function calculateBuyerEngagementScore(
  id,
  filters = {},
  authorizationContext = contextFor(),
) {
  const events = readAnalyticsState().events.filter(
    (item) => id === "all" || item.organizationId === id || item.userId === id,
  );
  const weighted = events.reduce(
    (score, item) =>
      score +
      ({
        "Search performed": 2,
        "Preview started": 3,
        "Preview completed": 4,
        "Track saved": 5,
        "Added to project": 8,
        "Licensing request created": 12,
        "Quote accepted": 18,
        "Contract signed": 20,
        "Payment completed": 24,
      }[item.eventType] || 1),
    0,
  );
  return Math.min(100, Math.round(weighted * 1.4));
}

export function getLicensingFunnel(
  filters = {},
  authorizationContext = contextFor(),
) {
  requireAnalyticsPermission(
    "analytics.commercial.view",
    authorizationContext.user,
    filters,
  );
  const stages = [
    ["Catalog track viewed", 86],
    ["Preview played", 58],
    ["Track saved", 31],
    ["Added to project", 19],
    ["Licensing request created", 12],
    ["Quote sent", 9],
    ["Quote accepted", 6],
    ["Contract signed", 5],
    ["Payment completed", 4],
    ["Licence issued", 4],
    ["Delivery activated", 3],
    ["Delivery completed", 3],
  ];
  return stages.map(([stage, count], index) => ({
    stage,
    count,
    priorConversion: index ? percent(count, stages[index - 1][1]) : 100,
    firstConversion: percent(count, stages[0][1]),
    dropOff: index ? stages[index - 1][1] - count : 0,
    averageDaysToNext: index < 4 ? 1.2 : 2.4,
    attribution:
      index > 1
        ? "Associated by same user, organization, or project"
        : "Observed event",
  }));
}

export function getCommercialPipeline(
  filters = {},
  authorizationContext = contextFor(),
) {
  requireAnalyticsPermission(
    "analytics.commercial.view",
    authorizationContext.user,
    filters,
  );
  return clone(readAnalyticsState().pipeline);
}

export function getTrackPerformance(
  filters = {},
  authorizationContext = contextFor(),
) {
  return getVisibleAnalyticsDataset(
    "Catalog",
    authorizationContext,
    filters,
  ).map((item) => ({
    ...item,
    completionRate: percent(item.previewCompletions, item.previewStarts),
    demandScore: calculateTrackDemandScore(
      item.trackId,
      filters,
      authorizationContext,
    ),
  }));
}

export function getOperationsAnalytics(
  filters = {},
  authorizationContext = contextFor(),
) {
  requireAnalyticsPermission(
    "analytics.operations.view",
    authorizationContext.user,
    filters,
  );
  return clone(readAnalyticsState().queues);
}

export function getRevenueConcentration(
  filters = {},
  authorizationContext = contextFor(),
) {
  requireAnalyticsPermission(
    "analytics.finance.view",
    authorizationContext.user,
    filters,
  );
  const payments = paymentAnalytics(
    sources(),
    authorizationContext,
    filters,
  ).successful;
  const grouped = {};
  payments.forEach((item) => {
    const name =
      item.organization ||
      item.buyerOrganization ||
      item.organizationId ||
      "Unassigned";
    grouped[name] = (grouped[name] || 0) + Number(item.amount || 0);
  });
  const total = Object.values(grouped).reduce((a, b) => a + b, 0);
  return Object.entries(grouped)
    .map(([organization, value]) => ({
      organization,
      value,
      percentage: percent(value, total),
      licences: Math.max(1, Math.round(value / 12500)),
      warning: total && value / total > 0.4 ? "Concentration above 40%" : null,
    }))
    .sort((a, b) => b.value - a.value);
}

function audit(action, user, subject, description, severity = "Medium") {
  recordAuditEvent({
    module: "Analytics & Reporting",
    category: "Reporting",
    action,
    result: "Success",
    severity,
    user,
    entityType: subject.type || "Report",
    entityId: subject.id,
    subjectName: subject.name || subject.reference || action,
    description,
    visibility: severity === "Critical" ? "Security Restricted" : "Internal",
    confidentiality: severity === "Critical" ? "Restricted" : "Confidential",
    metadata: { analyticsReporting: true },
  });
}

function notify(userId, title, body, action = "admin/reports") {
  authService.addDemoMessage(userId, "analytics", title, body, action);
}

export function canViewReport(report, authorizationContext = contextFor()) {
  if (!report || !authorizationContext.user) return false;
  if (!canPerform("reports.view", authorizationContext).allowed) return false;
  if (!canPerform(report.permissionKey, authorizationContext).allowed)
    return false;
  if (
    report.confidentiality === "Restricted" &&
    authorizationContext.user.userType !== "internal"
  )
    return false;
  return (
    report.ownerId === authorizationContext.user.id ||
    !report.ownerOnly ||
    safeArray(report.sharedRoleIds).includes(authorizationContext.user.role)
  );
}

export const analyticsService = {
  getState: readAnalyticsState,
  getMetricDefinitions(user = currentUser()) {
    const context = contextFor(user);
    return readAnalyticsState().metricDefinitions.filter(
      (item) => canPerform(item.permissionKey, context).allowed,
    );
  },
  getVisibleAnalyticsDataset,
  calculateMetric,
  calculateMetricSeries,
  comparePeriods,
  getLicensingFunnel,
  getCommercialPipeline,
  getTrackPerformance,
  calculateTrackDemandScore,
  calculateBuyerEngagementScore,
  getOperationsAnalytics,
  getRevenueConcentration,
  resolveDateRange,
  resolveComparisonRange,
  getDashboardMetrics(keys, filters = {}, user = currentUser()) {
    const context = contextFor(user);
    return keys.map((key) => calculateMetric(key, filters, context));
  },
  getZeroResultTerms(user = currentUser()) {
    requireAnalyticsPermission("analytics.search.view", user);
    return clone(readAnalyticsState().zeroResultTerms);
  },
  getReports(user = currentUser()) {
    const context = contextFor(user);
    return [
      ...readAnalyticsState().reports,
      ...readAnalyticsState().customReports,
    ].filter((report) => canViewReport(report, context));
  },
  getReport(id, user = currentUser()) {
    return (
      this.getReports(user).find((item) => item.id === id || item.key === id) ||
      null
    );
  },
  selectReport(id) {
    localStorage.setItem(SELECTED_REPORT_KEY, id);
  },
  getSelectedReport(user = currentUser()) {
    return this.getReport(localStorage.getItem(SELECTED_REPORT_KEY), user);
  },
  async runReport(id, filters = {}, user = currentUser()) {
    await wait();
    const report = this.getReport(id, user);
    if (!report) throw new Error("Report is unavailable or restricted.");
    const metrics = report.metrics.map((key) =>
      calculateMetric(key, filters, contextFor(user)),
    );
    audit(
      "Report viewed",
      user,
      report,
      `${report.name} generated with ${metrics.length} visible metrics.`,
    );
    return {
      report,
      metrics,
      rows: metrics.map((item) => ({
        metric: item.name,
        value: item.formattedValue,
        previous: item.previousValue,
        change: item.percentageChange,
        dataQuality: item.dataQuality,
      })),
      filters,
      generatedAt: now(),
    };
  },
  async createCustomReport(payload, user = currentUser()) {
    await wait();
    requireAnalyticsPermission("reports.create", user);
    return mutate((state) => {
      if (!payload.name || !safeArray(payload.metrics).length)
        throw new Error("Choose a report name and at least one metric.");
      const allowed = state.metricDefinitions
        .filter(
          (item) => canPerform(item.permissionKey, contextFor(user)).allowed,
        )
        .map((item) => item.key);
      if (payload.metrics.some((key) => !allowed.includes(key)))
        throw new Error("One or more selected metrics are restricted.");
      const report = {
        id: uid("report"),
        key: uid("custom"),
        name: payload.name,
        description: payload.description || "Saved custom prototype report.",
        category: payload.domain,
        owner: user.name,
        ownerId: user.id,
        ownerOnly: payload.visibility === "Personal",
        status: "Active",
        version: 1,
        dataSources: [payload.domain],
        metrics: payload.metrics,
        dimensions: payload.dimensions || ["Date"],
        defaultFilters: payload.filters || { dateRange: "Last 30 days" },
        availableFilters: ["Date", "Organization", "Currency"],
        columns: payload.columns || ["Metric", "Current", "Change"],
        chartDefinitions: [
          { type: payload.chartType || "Bar chart", title: payload.name },
        ],
        permissionKey: domainPermission[payload.domain] || "reports.view",
        confidentiality: payload.confidentiality || "Internal",
        exportFormats: ["CSV", "JSON", "PDF-style print"],
        scheduledDeliveryAllowed: true,
        sharedRoleIds: payload.sharedRoleIds || [],
        createdAt: now(),
        updatedAt: now(),
      };
      state.customReports.unshift(report);
      state.reportVersions.unshift({
        reportId: report.id,
        version: 1,
        snapshot: clone(report),
        createdAt: now(),
        createdBy: user.id,
      });
      audit("Report created", user, report, `${report.name} created.`);
      return report;
    });
  },
  async requestReportExport(
    reportId,
    format,
    filters = {},
    user = currentUser(),
  ) {
    await wait();
    requireAnalyticsPermission("reports.export", user);
    const report = this.getReport(reportId, user);
    if (!report) throw new Error("Report unavailable.");
    const restricted =
      report.confidentiality === "Restricted" ||
      ["Financial", "Security", "Rights"].includes(report.category);
    const exportRecord = mutate((state) => {
      state.lastNumbers.export += 1;
      const item = {
        id: uid("export"),
        reference: `BM-RPT-EXP-2026-${String(state.lastNumbers.export).padStart(4, "0")}`,
        reportId: report.id,
        reportVersion: report.version,
        format,
        requestedBy: user.id,
        filters,
        status: restricted ? "Approval Required" : "Ready",
        rowCount: this.runReport ? report.metrics.length : 0,
        confidentiality: report.confidentiality,
        approvalRequired: restricted,
        approvedBy: null,
        createdAt: now(),
        completedAt: restricted ? null : now(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        fileAssetId: restricted ? null : uid("analytics-export"),
        accessReference: restricted ? null : uid("BM-URL-RPT"),
      };
      state.exports.unshift(item);
      audit(
        "Export requested",
        user,
        item,
        `${item.reference} requested for ${report.name}.`,
        restricted ? "Critical" : "High",
      );
      if (restricted)
        notify(
          "user-preston",
          "Restricted export approval required",
          `${item.reference} requires approval.`,
          "admin/reports/exports",
        );
      return item;
    });
    return exportRecord;
  },
  approveReportExport(id, user = currentUser()) {
    requireAnalyticsPermission("reports.export_restricted", user);
    return mutate((state) => {
      const item = state.exports.find((entry) => entry.id === id);
      if (!item || item.status !== "Approval Required")
        throw new Error("Pending export not found.");
      if (item.requestedBy === user.id)
        throw new Error("Restricted exports require secondary approval.");
      item.status = "Ready";
      item.approvedBy = user.id;
      item.completedAt = now();
      item.fileAssetId = uid("analytics-export");
      item.accessReference = uid("BM-URL-RPT");
      notify(
        item.requestedBy,
        "Restricted export ready",
        `${item.reference} is ready through an expiring prototype link.`,
        "admin/reports/exports",
      );
      audit(
        "Export approved",
        user,
        item,
        `${item.reference} approved.`,
        "Critical",
      );
      return item;
    });
  },
  async scheduleReport(payload, user = currentUser()) {
    await wait();
    requireAnalyticsPermission("reports.schedule", user);
    const report = this.getReport(payload.reportId, user);
    if (!report) throw new Error("Report unavailable.");
    const recipients = String(payload.recipients || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (
      !recipients.length ||
      recipients.some((email) => !/^\S+@\S+\.\S+$/.test(email))
    )
      throw new Error("Use valid report recipient email addresses.");
    if (
      report.confidentiality === "Restricted" &&
      recipients.some((email) => !email.endsWith("@beatmondo.com"))
    )
      throw new Error(
        "Restricted reports may only be scheduled to internal beatmondo recipients.",
      );
    return mutate((state) => {
      state.lastNumbers.schedule += 1;
      const item = {
        id: uid("schedule"),
        reportId: report.id,
        ownerId: user.id,
        recipients,
        frequency: payload.frequency || "Monthly",
        day: payload.day || "1",
        time: payload.time || "09:00",
        timezone: payload.timezone || "Europe/London",
        format: payload.format || "CSV",
        filters: payload.filters || {},
        enabled: true,
        nextRun: new Date(Date.now() + 7 * 86400000).toISOString(),
        expiryDays: 7,
        confidentiality: report.confidentiality,
        deliveryChannel: "Email simulation",
        status: "Scheduled",
      };
      state.schedules.unshift(item);
      audit(
        "Scheduled report created",
        user,
        item,
        `${report.name} scheduled for ${recipients.join(", ")}.`,
      );
      return item;
    });
  },
  async runScheduledReportsNow(user = currentUser()) {
    await wait();
    requireAnalyticsPermission("reports.schedule", user);
    return mutate((state) => {
      const active = state.schedules.filter((item) => item.enabled);
      active.forEach((item) => {
        item.lastRun = now();
        item.status = "Completed Simulation";
        item.nextRun = new Date(Date.now() + 30 * 86400000).toISOString();
        notify(
          item.ownerId,
          "Scheduled report ready",
          `${item.id} completed as a browser simulation.`,
          "admin/reports/scheduled",
        );
      });
      return active.length;
    });
  },
  createAnalyticsSnapshot(reportId, filters = {}, user = currentUser()) {
    requireAnalyticsPermission("reports.create_snapshot", user);
    const report = this.getReport(reportId, user);
    if (!report) throw new Error("Report unavailable.");
    return mutate((state) => {
      state.lastNumbers.snapshot += 1;
      const item = {
        id: uid("snapshot"),
        reference: `BM-RPT-SNAP-2026-${String(state.lastNumbers.snapshot).padStart(4, "0")}`,
        reportId: report.id,
        reportVersion: report.version,
        filters,
        generatedAt: now(),
        generatedBy: user.name,
        metricValues: Object.fromEntries(
          report.metrics.map((key) => [
            key,
            calculateMetric(key, filters, contextFor(user)).value,
          ]),
        ),
        rowData: [],
        simulated: true,
        immutable: true,
      };
      state.snapshots.unshift(item);
      audit(
        "Snapshot generated",
        user,
        item,
        `${item.reference} created for ${report.name}.`,
        "High",
      );
      return item;
    });
  },
  evaluateAnalyticsAlerts(filters = {}, user = currentUser()) {
    requireAnalyticsPermission("reports.manage_alerts", user);
    return mutate((state) => {
      const triggered = [];
      state.alerts
        .filter((item) => item.enabled)
        .forEach((alert) => {
          const metric = calculateMetric(
            alert.metricKey,
            filters,
            contextFor(user),
          );
          const cooldownActive =
            alert.lastTriggeredAt &&
            Date.now() - new Date(alert.lastTriggeredAt).getTime() <
              alert.cooldownHours * 3600000;
          const conditionMet =
            metric.value !== null &&
            (alert.condition === "Less than"
              ? metric.value < alert.threshold
              : metric.value > alert.threshold);
          alert.lastEvaluatedAt = now();
          if (conditionMet && !cooldownActive) {
            alert.status = "Triggered";
            alert.lastTriggeredAt = now();
            const event = {
              id: uid("alert-event"),
              alertId: alert.id,
              metricValue: metric.value,
              triggeredAt: now(),
              status: "Open",
            };
            state.alertEvents.unshift(event);
            triggered.push(event);
            alert.recipients.forEach((recipient) =>
              notify(
                recipient,
                "Analytics alert triggered",
                `${alert.name}: ${metric.formattedValue}.`,
                "admin/reports",
              ),
            );
            audit(
              "Alert triggered",
              user,
              alert,
              `${alert.name} triggered at ${metric.formattedValue}.`,
              alert.severity === "High" ? "Critical" : "High",
            );
          }
        });
      return triggered;
    });
  },
  addAnnotation(reportId, payload, user = currentUser()) {
    requireAnalyticsPermission("reports.edit", user);
    return mutate((state) => {
      const item = {
        id: uid("annotation"),
        reportId,
        date: payload.date,
        title: payload.title,
        note: payload.note,
        createdBy: user.name,
        createdAt: now(),
      };
      state.annotations.unshift(item);
      audit(
        "Report annotated",
        user,
        item,
        `${payload.title} added to report timeline.`,
      );
      return item;
    });
  },
  saveDashboardLayout(payload, user = currentUser()) {
    return mutate((state) => {
      state.dashboardLayouts[user.id] = { ...payload, updatedAt: now() };
      return state.dashboardLayouts[user.id];
    });
  },
  getDashboardLayout(user = currentUser()) {
    return readAnalyticsState().dashboardLayouts[user?.id] || null;
  },
  invalidateAnalyticsByEvent(event) {
    return mutate((state) => {
      state.cache = {};
      state.lastInvalidatedAt = now();
      state.lastInvalidationEvent = clone(event);
      return true;
    });
  },
  rebuildCache(user = currentUser()) {
    return mutate((state) => {
      state.cache = {
        [`dashboard:${user.id}`]: {
          key: `dashboard:${user.id}`,
          filtersHash: "default",
          permissionContextHash: `${user.id}:${readPermissionsState().cacheVersion}`,
          generatedAt: now(),
          expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
          data: { status: "Ready" },
        },
      };
      return state.cache;
    });
  },
  resetAnalyticsReportingDemoData() {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    localStorage.removeItem(SELECTED_REPORT_KEY);
    return readAnalyticsState();
  },
};

export const metricDefinitionService = {
  getMetricDefinitions: (...args) =>
    analyticsService.getMetricDefinitions(...args),
  calculateMetric,
};
export const metricCalculationService = {
  calculateMetric,
  calculateMetricSeries,
  comparePeriods,
};
export const analyticsFilterService = {
  resolveDateRange,
  resolveComparisonRange,
};
export const dashboardService = {
  getAnalyticsDashboard: (...args) =>
    analyticsService.getDashboardMetrics(...args),
  saveDashboardLayout: (...args) =>
    analyticsService.saveDashboardLayout(...args),
};
export const commercialAnalyticsService = {
  getLicensingFunnel,
  getCommercialPipeline,
};
export const catalogAnalyticsService = {
  getCatalogPerformance: getTrackPerformance,
  calculateTrackDemandScore,
};
export const buyerAnalyticsService = { calculateBuyerEngagementScore };
export const operationsAnalyticsService = { getOperationsAnalytics };
export const reportService = {
  getReports: (...args) => analyticsService.getReports(...args),
  getReport: (...args) => analyticsService.getReport(...args),
  createCustomReport: (...args) => analyticsService.createCustomReport(...args),
  runReport: (...args) => analyticsService.runReport(...args),
  canViewReport,
};
export const reportExportService = {
  requestReportExport: (...args) =>
    analyticsService.requestReportExport(...args),
  approveReportExport: (...args) =>
    analyticsService.approveReportExport(...args),
};
export const reportScheduleService = {
  scheduleReport: (...args) => analyticsService.scheduleReport(...args),
  runScheduledReportsNow: (...args) =>
    analyticsService.runScheduledReportsNow(...args),
};
export const analyticsAlertService = {
  evaluateAnalyticsAlerts: (...args) =>
    analyticsService.evaluateAnalyticsAlerts(...args),
  getAnalyticsAlerts: () => readAnalyticsState().alerts,
};
export const analyticsSnapshotService = {
  createAnalyticsSnapshot: (...args) =>
    analyticsService.createAnalyticsSnapshot(...args),
};
export const analyticsCacheService = {
  invalidateAnalyticsByEvent: (...args) =>
    analyticsService.invalidateAnalyticsByEvent(...args),
  rebuildCache: (...args) => analyticsService.rebuildCache(...args),
};
export const resetAnalyticsReportingDemoData = () =>
  analyticsService.resetAnalyticsReportingDemoData();
