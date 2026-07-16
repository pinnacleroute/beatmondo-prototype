import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  ChartBar,
  CheckCircle,
  Clock,
  DownloadSimple,
  FileText,
  Funnel,
  GearSix,
  Plus,
  ShieldCheck,
  Sliders,
  TrendDown,
  TrendUp,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  buildAuthorizationContext,
  canPerform,
} from "../permissions/authorizationService.js";
import { analyticsService, resolveDateRange } from "./analyticsService.js";
import "./analytics.css";

export const ANALYTICS_VIEWS = new Set([
  "admin/analytics",
  "admin/analytics/executive",
  "admin/analytics/commercial",
  "admin/analytics/catalog",
  "admin/analytics/search",
  "admin/analytics/buyers",
  "admin/analytics/artists",
  "admin/analytics/rights",
  "admin/analytics/finance",
  "admin/analytics/operations",
  "admin/analytics/security",
  "admin/analytics/email",
  "admin/analytics/permissions",
  "admin/reports",
  "admin/reports/builder",
  "admin/reports/scheduled",
  "admin/reports/exports",
  "buyer/analytics",
  "artist/analytics",
]);

const dashboardDefinitions = {
  executive: {
    label: "Executive",
    permission: "analytics.executive.view",
    kicker: "Senior internal overview",
    title: "Executive performance",
    description:
      "Commercial, catalog, financial, delivery, and operational signals without treating forecasts as realized revenue.",
    metrics: [
      "catalog.total_tracks",
      "catalog.readiness_rate",
      "buyers.active_organizations",
      "buyers.active_projects",
      "commercial.quotes_sent",
      "commercial.quote_acceptance_rate",
      "commercial.contracted_value",
      "finance.collected_value",
      "finance.outstanding_value",
      "licences.active",
      "delivery.completed",
      "rights.blocked_opportunities",
      "commercial.average_cycle",
      "licences.expiring",
      "operations.overdue",
      "executive.weighted_pipeline",
    ],
  },
  commercial: {
    label: "Commercial",
    permission: "analytics.commercial.view",
    kicker: "Current licensing pipeline",
    title: "Commercial performance",
    description:
      "Requests, quote decisions, contracts, licences, and simulated weighted pipeline values.",
    metrics: [
      "commercial.requests",
      "commercial.quotes_sent",
      "commercial.quotes_accepted",
      "commercial.quote_acceptance_rate",
      "commercial.average_quote",
      "commercial.contracted_value",
      "contracts.completion_rate",
      "licences.conversion_rate",
      "licences.expiring",
      "commercial.average_cycle",
    ],
  },
  catalog: {
    label: "Catalog",
    permission: "analytics.catalog.view",
    kicker: "Supply and demand intelligence",
    title: "Catalog readiness & demand",
    description:
      "Readiness, protected-preview engagement, asset supply, and a clearly labelled prototype demand score.",
    metrics: [
      "catalog.total_tracks",
      "catalog.ready_tracks",
      "catalog.readiness_rate",
      "catalog.new_tracks",
      "catalog.demand_score",
      "preview.starts",
      "preview.unique_listeners",
      "preview.completion_rate",
    ],
  },
  search: {
    label: "Search",
    permission: "analytics.search.view",
    kicker: "Discovery intelligence",
    title: "Search demand",
    description:
      "Query volume, searcher activity, zero-result opportunities, and result engagement.",
    metrics: [
      "search.searches",
      "search.unique_searchers",
      "search.zero_result_rate",
      "search.click_rate",
      "preview.starts",
      "catalog.demand_score",
    ],
  },
  buyers: {
    label: "Buyers",
    permission: "analytics.buyers.view",
    kicker: "Buyer-safe activity signals",
    title: "Buyer engagement",
    description:
      "Organization-scoped project and licensing activity. Engagement is an operational indicator, not an automated decision.",
    metrics: [
      "buyers.active_organizations",
      "buyers.active_projects",
      "buyers.engagement_score",
      "commercial.requests",
      "commercial.quotes_sent",
      "commercial.quotes_accepted",
      "licences.active",
      "delivery.completed",
    ],
  },
  artists: {
    label: "Artists",
    permission: "analytics.artists.view",
    kicker: "Catalog performance",
    title: "Artist performance",
    description:
      "Track demand and engagement with confidential buyer identities and negotiations excluded from artist-facing scope.",
    metrics: [
      "catalog.total_tracks",
      "catalog.ready_tracks",
      "preview.starts",
      "preview.completion_rate",
      "catalog.demand_score",
      "commercial.requests",
      "licences.issued",
    ],
  },
  rights: {
    label: "Rights",
    permission: "analytics.rights.view",
    kicker: "Rights health and opportunity",
    title: "Rights intelligence",
    description:
      "Verification health, blockers, review workload, and estimated opportunity value affected—not realized loss.",
    metrics: [
      "rights.verified_tracks",
      "rights.blocked_opportunities",
      "rights.affected_value",
      "catalog.readiness_rate",
      "operations.overdue",
    ],
  },
  finance: {
    label: "Finance",
    permission: "analytics.finance.view",
    kicker: "Protected financial reporting",
    title: "Licensing & membership finance",
    description:
      "Licensing and membership measures remain separate; failed payments never count as collected value.",
    metrics: [
      "finance.invoiced_value",
      "finance.collected_value",
      "finance.refunded_value",
      "finance.net_collected",
      "finance.outstanding_value",
      "finance.payment_success_rate",
      "membership.active_subscriptions",
      "membership.recurring_revenue",
    ],
  },
  operations: {
    label: "Operations",
    permission: "analytics.operations.view",
    kicker: "Cross-functional queue health",
    title: "Operations & SLA",
    description:
      "Prototype service targets, queue age, overdue workload, and bottlenecks across the licensing lifecycle.",
    metrics: [
      "verification.queue",
      "operations.overdue",
      "delivery.completed",
      "delivery.completion_rate",
      "permissions.temporary_elevations",
    ],
  },
  security: {
    label: "Security",
    permission: "analytics.security.view",
    kicker: "Restricted security summary",
    title: "Security analytics",
    description:
      "Restricted denial, privileged-access, temporary-access, and critical-event signals.",
    metrics: [
      "security.critical_events",
      "security.access_denials",
      "permissions.temporary_elevations",
      "permissions.open_conflicts",
    ],
  },
  email: {
    label: "Email",
    permission: "analytics.email.view",
    kicker: "Notification simulation outcomes",
    title: "Email analytics",
    description:
      "Queue, delivery, failure, and retry outcomes remain clearly labelled as prototype simulations.",
    metrics: ["email.delivered", "email.failure_rate"],
  },
  permissions: {
    label: "Permissions",
    permission: "analytics.permissions.view",
    kicker: "Privileged access governance",
    title: "Permissions analytics",
    description:
      "Role assignments, direct grants, explicit denials, conflicts, temporary access, and overdue reviews.",
    metrics: [
      "permissions.temporary_elevations",
      "permissions.open_conflicts",
      "security.access_denials",
      "security.critical_events",
    ],
  },
};

const routeToDashboard = {
  "admin/analytics": "executive",
  "admin/analytics/executive": "executive",
  "admin/analytics/commercial": "commercial",
  "admin/analytics/catalog": "catalog",
  "admin/analytics/search": "search",
  "admin/analytics/buyers": "buyers",
  "admin/analytics/artists": "artists",
  "admin/analytics/rights": "rights",
  "admin/analytics/finance": "finance",
  "admin/analytics/operations": "operations",
  "admin/analytics/security": "security",
  "admin/analytics/email": "email",
  "admin/analytics/permissions": "permissions",
  "buyer/analytics": "buyers",
  "artist/analytics": "artists",
};

const dateOptions = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "This month",
  "Previous month",
  "This quarter",
  "Previous quarter",
  "This year",
  "Previous year",
  "All time",
];
const comparisonOptions = [
  "Previous equivalent period",
  "Previous month",
  "Previous quarter",
  "Previous year",
  "No comparison",
];

function QualityBadge({ metric }) {
  return (
    <span
      className={`an-quality is-${String(metric.dataQuality).toLowerCase().replaceAll(" ", "-")}`}
    >
      {metric.simulated ? "Simulated · " : ""}
      {metric.dataQuality}
    </span>
  );
}

function MetricCard({ metric, onOpen }) {
  const TrendIcon = metric.direction === "Down" ? TrendDown : TrendUp;
  return (
    <button
      type="button"
      className={`an-metric ${metric.restricted ? "is-restricted" : ""}`}
      onClick={() => !metric.restricted && onOpen(metric)}
      disabled={metric.restricted}
    >
      <span>{metric.name || metric.key}</span>
      <strong>{metric.formattedValue}</strong>
      <small>
        <TrendIcon aria-hidden="true" />{" "}
        {metric.percentageChange === null
          ? "Comparison unavailable"
          : `${Math.abs(metric.percentageChange)}% ${metric.direction.toLowerCase()} vs comparison`}
      </small>
      <QualityBadge metric={metric} />
    </button>
  );
}

function TrendChart({ metrics }) {
  const data = metrics
    .filter((item) => !item.restricted && typeof item.value === "number")
    .slice(0, 6);
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <article
      className="an-panel an-chart"
      aria-labelledby="analytics-chart-title"
    >
      <header>
        <div>
          <span>Accessible comparison</span>
          <h2 id="analytics-chart-title">Current metric scale</h2>
        </div>
        <ChartBar />
      </header>
      <div
        className="an-bars"
        role="img"
        aria-label={data
          .map((item) => `${item.name}: ${item.formattedValue}`)
          .join("; ")}
      >
        {data.map((item) => (
          <div key={item.key}>
            <span
              title={item.formattedValue}
              style={{ height: `${Math.max(10, (item.value / max) * 100)}%` }}
            />
            <small>{item.name}</small>
          </div>
        ))}
      </div>
      <details>
        <summary>View chart data table</summary>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current</th>
              <th>Previous</th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.key}>
                <td>{item.name}</td>
                <td>{item.formattedValue}</td>
                <td>{item.previousValue ?? "Unavailable"}</td>
                <td>{item.direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </article>
  );
}

function AnalyticsHeader({
  definition,
  filters,
  setFilters,
  navigate,
  external,
}) {
  const range = resolveDateRange(filters.dateRange);
  return (
    <>
      <header className="an-hero">
        <div>
          <span>{definition.kicker}</span>
          <h1>{definition.title}</h1>
          <p>{definition.description}</p>
        </div>
        {!external && (
          <button
            type="button"
            className="an-primary"
            onClick={() => navigate("admin/reports")}
          >
            <FileText /> Report library
          </button>
        )}
      </header>
      <section className="an-filterbar" aria-label="Analytics filters">
        <label>
          Date range
          <select
            value={filters.dateRange}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                dateRange: event.target.value,
              }))
            }
          >
            {dateOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Compare with
          <select
            value={filters.comparison}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                comparison: event.target.value,
              }))
            }
          >
            {comparisonOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Currency
          <select
            value={filters.currency}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                currency: event.target.value,
              }))
            }
          >
            {["USD", "GBP", "EUR", "AUD", "All currencies"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div>
          <span>Reporting period</span>
          <strong>{range.label}</strong>
        </div>
      </section>
    </>
  );
}

function Drilldown({ metric, onClose, context, filters }) {
  const domain = metric.key.startsWith("finance")
    ? "Financial"
    : metric.key.startsWith("rights")
      ? "Rights"
      : metric.key.startsWith("security")
        ? "Security"
        : metric.key.startsWith("catalog")
          ? "Catalog"
          : metric.key.startsWith("commercial")
            ? "Quotes"
            : metric.key.startsWith("licences")
              ? "Licences"
              : metric.key.startsWith("delivery")
                ? "Deliveries"
                : "Operations";
  const rows = analyticsService
    .getVisibleAnalyticsDataset(domain, context, filters)
    .slice(0, 12);
  return (
    <div
      className="an-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="an-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metric-drilldown-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>Permission-aware drill-down</span>
            <h2 id="metric-drilldown-title">{metric.name}</h2>
            <p>
              {metric.formattedValue} · {rows.length} visible sample records
            </p>
          </div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        {rows.length ? (
          <div className="an-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Status</th>
                  <th>Scope</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id || index}>
                    <td>
                      {row.reference ||
                        row.track ||
                        row.name ||
                        row.queue ||
                        row.id}
                    </td>
                    <td>{row.status || row.readiness || "Active"}</td>
                    <td>
                      {row.organization ||
                        row.organizationId ||
                        row.artist ||
                        "Visible scope"}
                    </td>
                    <td>
                      {row.total || row.amount || row.value || row.count || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="an-empty">
            <ShieldCheck />
            <h3>No records in scope</h3>
            <p>
              The aggregate was rebuilt from the current visible dataset; no
              record rows are available for this period.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function FunnelView({ filters, context }) {
  const stages = analyticsService.getLicensingFunnel(filters, context);
  return (
    <article className="an-panel">
      <header>
        <div>
          <span>Associated workflow</span>
          <h2>Licensing funnel</h2>
          <p>
            Attribution is limited to shared users, organizations, projects, or
            correlation identifiers.
          </p>
        </div>
        <Funnel />
      </header>
      <ol className="an-funnel">
        {stages.map((item, index) => (
          <li
            key={item.stage}
            style={{
              "--funnel-width": `${Math.max(34, item.firstConversion)}%`,
            }}
          >
            <div>
              <strong>
                {index + 1}. {item.stage}
              </strong>
              <span>{item.count} records</span>
            </div>
            <small>
              {item.priorConversion}% from prior · {item.dropOff} drop-off ·{" "}
              {item.averageDaysToNext} days to next
            </small>
          </li>
        ))}
      </ol>
    </article>
  );
}

function PipelineView({ filters, context }) {
  const rows = analyticsService.getCommercialPipeline(filters, context);
  const total = rows.reduce((value, item) => value + item.value, 0);
  const weighted = rows.reduce((value, item) => value + item.weightedValue, 0);
  return (
    <article className="an-panel">
      <header>
        <div>
          <span>Current pipeline</span>
          <h2>Commercial pipeline</h2>
          <p>
            Weighted pipeline is a simulated forecast based on configured stage
            probabilities.
          </p>
        </div>
        <strong>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(weighted)}{" "}
          weighted
        </strong>
      </header>
      <div className="an-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Stage</th>
              <th>Opportunities</th>
              <th>Unweighted value</th>
              <th>Probability</th>
              <th>Weighted value</th>
              <th>Average age</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.stage}</strong>
                </td>
                <td>{item.count}</td>
                <td>${item.value.toLocaleString()}</td>
                <td>{item.probability}%</td>
                <td>${item.weightedValue.toLocaleString()}</td>
                <td>{item.averageAgeDays} days</td>
                <td>{item.overdue}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <td>{rows.reduce((value, item) => value + item.count, 0)}</td>
              <td>${total.toLocaleString()}</td>
              <td>—</td>
              <td>${weighted.toLocaleString()}</td>
              <td colSpan="2">Prototype forecast</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </article>
  );
}

function TrackPerformance({ filters, context, artistOnly = false }) {
  const rows = analyticsService
    .getTrackPerformance(filters, context)
    .filter((item) => !artistOnly || item.artist === "The SMYRK");
  return (
    <article className="an-panel">
      <header>
        <div>
          <span>Prototype scoring model</span>
          <h2>Track performance</h2>
          <p>
            Search impressions 1/25; views 1/10; preview starts 1/5; completions
            2; saves 3; projects 5; requests 10; accepted quote 25; licence 40.
            Normalized to 100.
          </p>
        </div>
        <TrendUp />
      </header>
      <div className="an-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Track</th>
              <th>Readiness</th>
              <th>Impressions</th>
              <th>Previews</th>
              <th>Completion</th>
              <th>Saves</th>
              <th>Projects</th>
              <th>Requests</th>
              <th>Licences</th>
              <th>Demand</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.trackId}>
                <td>
                  <strong>{item.track}</strong>
                  <small>{item.artist}</small>
                </td>
                <td>{item.readiness}</td>
                <td>{item.impressions}</td>
                <td>{item.previewStarts}</td>
                <td>{item.completionRate}%</td>
                <td>{item.saves}</td>
                <td>{item.projectAdditions}</td>
                <td>{item.requests}</td>
                <td>{item.licences}</td>
                <td>
                  <strong>{item.demandScore}/100</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ZeroResults({ user }) {
  const rows = analyticsService.getZeroResultTerms(user);
  return (
    <article className="an-panel">
      <header>
        <div>
          <span>Catalog opportunity</span>
          <h2>Zero-result searches</h2>
          <p>Recommendations are derived from prototype search behavior.</p>
        </div>
        <WarningCircle />
      </header>
      <div className="an-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Query</th>
              <th>Searches</th>
              <th>Tier</th>
              <th>Filters</th>
              <th>Opportunity</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.query}>
                <td>
                  <strong>{item.query}</strong>
                  <small>Last: {item.lastSearched}</small>
                </td>
                <td>{item.searchCount}</td>
                <td>{item.buyerTier}</td>
                <td>{item.filters}</td>
                <td>{item.opportunity}</td>
                <td>{item.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function OperationsTable({ context, filters }) {
  const rows = analyticsService.getOperationsAnalytics(filters, context);
  return (
    <article className="an-panel">
      <header>
        <div>
          <span>Beatmondo prototype targets</span>
          <h2>Queue and SLA health</h2>
          <p>
            Operational workload indicator, not a formal performance assessment.
          </p>
        </div>
        <Clock />
      </header>
      <div className="an-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Queue</th>
              <th>Open</th>
              <th>Overdue</th>
              <th>Average age</th>
              <th>Oldest</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.queue}</strong>
                  <small>{item.owners.join(", ")}</small>
                </td>
                <td>{item.open}</td>
                <td>{item.overdue}</td>
                <td>{item.averageAgeHours}h</td>
                <td>{item.oldestItemHours}h</td>
                <td>{item.target}</td>
                <td>
                  <span
                    className={`an-status is-${item.status.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function BuyerSafeActivity() {
  const rows = [
    ["Active projects", "1", "In progress"],
    ["Quotes awaiting action", "2", "Buyer review"],
    ["Contracts awaiting signature", "1", "Action required"],
    ["Outstanding licensing invoices", "1", "Payment due"],
    ["Active licences", "2", "Authorized use"],
    ["Delivery packages", "1", "Secure access active"],
  ];
  return (
    <article className="an-panel">
      <header>
        <div>
          <span>Organization-safe workflow</span>
          <h2>Northstar licensing activity</h2>
          <p>
            Only authorized organization records are shown; internal scores,
            probabilities, owners, and other buyers are excluded.
          </p>
        </div>
        <ShieldCheck />
      </header>
      <div className="an-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Records</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([workflow, count, state]) => (
              <tr key={workflow}>
                <td>
                  <strong>{workflow}</strong>
                </td>
                <td>{count}</td>
                <td>{state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function DomainRecords({ type, context, filters }) {
  const domain = {
    finance: "Financial",
    rights: "Rights",
    security: "Security",
    email: "Email",
    permissions: "Permissions",
  }[type];
  const rows = analyticsService
    .getVisibleAnalyticsDataset(domain, context, filters)
    .slice(0, 10);
  const labels = {
    finance: [
      "Visible financial records",
      "Transaction values and reconciliation detail remain finance-restricted.",
    ],
    rights: [
      "Rights health records",
      "Evidence-party identities and internal ownership notes remain field-restricted.",
    ],
    security: [
      "Restricted security events",
      "User, device, impersonation, and investigation context remains security-restricted.",
    ],
    email: [
      "Notification outcomes",
      "Delivery and engagement behavior is a browser simulation.",
    ],
    permissions: [
      "Privileged access records",
      "Assignments, elevations, conflicts, and review records are security-sensitive.",
    ],
  }[type];
  return (
    <article className="an-panel">
      <header>
        <div>
          <span>Visible source records</span>
          <h2>{labels[0]}</h2>
          <p>{labels[1]}</p>
        </div>
        <ShieldCheck />
      </header>
      {rows.length ? (
        <div className="an-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Record</th>
                <th>Status</th>
                <th>Category</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item.id || index}>
                  <td>
                    <strong>
                      {item.reference ||
                        item.subjectName ||
                        item.name ||
                        item.id}
                    </strong>
                  </td>
                  <td>
                    {item.status || item.result || item.severity || "Active"}
                  </td>
                  <td>{item.category || item.type || item.module || domain}</td>
                  <td>
                    {item.updatedAt || item.createdAt || item.timestamp
                      ? new Date(
                          item.updatedAt || item.createdAt || item.timestamp,
                        ).toLocaleDateString()
                      : "Current"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="an-empty">
          <ShieldCheck />
          <h3>No records in scope</h3>
          <p>
            No visible {domain.toLowerCase()} records fall inside this reporting
            period.
          </p>
        </div>
      )}
    </article>
  );
}

function DashboardPage({ type, navigate, showToast }) {
  const { user } = useAuth();
  const context = useMemo(() => buildAuthorizationContext(user.id), [user.id]);
  const definition = dashboardDefinitions[type];
  const external = user.userType !== "internal";
  const [filters, setFilters] = useState({
    dateRange: "Last 30 days",
    comparison: "Previous equivalent period",
    currency: "USD",
    organizationId:
      external && user.role !== "artist" ? user.organizationId : undefined,
  });
  const [drilldown, setDrilldown] = useState(null);
  const [revision, setRevision] = useState(0);
  const metrics = useMemo(
    () =>
      analyticsService.getDashboardMetrics(definition.metrics, filters, user),
    [definition, filters, user, revision],
  );
  useEffect(() => {
    const handler = () => setRevision((value) => value + 1);
    window.addEventListener("beatmondo-analytics-changed", handler);
    return () =>
      window.removeEventListener("beatmondo-analytics-changed", handler);
  }, []);
  const availableDashboards = Object.entries(dashboardDefinitions).filter(
    ([, item]) => canPerform(item.permission, context).allowed,
  );
  return (
    <section className="an-page">
      {!external && (
        <nav className="an-tabs" aria-label="Analytics dashboards">
          {availableDashboards.map(([key, item]) => (
            <button
              type="button"
              key={key}
              className={key === type ? "active" : ""}
              onClick={() => navigate(`admin/analytics/${key}`)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
      <AnalyticsHeader
        definition={definition}
        filters={filters}
        setFilters={setFilters}
        navigate={navigate}
        external={external}
      />
      <div className="an-notice">
        <ShieldCheck />
        <div>
          <strong>
            {external
              ? "Scoped analytics"
              : "Permission-aware analytics simulation"}
          </strong>
          <span>
            {external
              ? "Only your authorized organization or artist records contribute to these totals."
              : "Visible datasets are filtered before aggregation. Browser persistence is not production financial or regulatory reporting."}
          </span>
        </div>
      </div>
      {filters.currency === "All currencies" && (
        <div className="an-notice is-warning">
          <WarningCircle />
          <div>
            <strong>Consolidated prototype currency</strong>
            <span>
              Converted using fixed prototype rates. Not live foreign-exchange
              data. Rate version BM-FX-PROTOTYPE-2026.07.
            </span>
          </div>
        </div>
      )}
      <div className="an-metric-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} onOpen={setDrilldown} />
        ))}
      </div>
      <div className="an-dashboard-grid">
        <TrendChart metrics={metrics} />
        {type === "commercial" || type === "executive" ? (
          <FunnelView filters={filters} context={context} />
        ) : type === "operations" ? (
          <OperationsTable filters={filters} context={context} />
        ) : type === "buyers" ? (
          <BuyerSafeActivity />
        ) : ["finance", "rights", "security", "email", "permissions"].includes(
            type,
          ) ? (
          <DomainRecords type={type} context={context} filters={filters} />
        ) : (
          <TrackPerformance
            filters={filters}
            context={context}
            artistOnly={type === "artists"}
          />
        )}
      </div>
      {(type === "commercial" || type === "executive") && (
        <PipelineView filters={filters} context={context} />
      )}
      {type === "catalog" && (
        <TrackPerformance filters={filters} context={context} />
      )}
      {type === "search" && <ZeroResults user={user} />}
      {type === "operations" && (
        <OperationsTable filters={filters} context={context} />
      )}
      {type === "finance" && (
        <article className="an-panel an-finance-note">
          <h2>Revenue treatment</h2>
          <div>
            <span>Quoted Value</span>
            <span>Contracted Value</span>
            <span>Invoiced Value</span>
            <span>Collected Value</span>
            <span>Refunded Value</span>
            <span>Net Collected Value</span>
            <span>Outstanding Value</span>
            <span>Weighted Pipeline Value · Simulated</span>
          </div>
          <p>
            Membership recurring revenue simulation remains separate from
            collected licensing value.
          </p>
        </article>
      )}
      {type === "buyers" && (
        <p className="an-disclaimer">
          Operational engagement indicator. It must not be used for high-stakes
          automated decisions.
        </p>
      )}
      {drilldown && (
        <Drilldown
          metric={drilldown}
          onClose={() => setDrilldown(null)}
          context={context}
          filters={filters}
        />
      )}
    </section>
  );
}

function ReportLibrary({ navigate, showToast }) {
  const { user } = useAuth();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const reports = analyticsService
    .getReports(user)
    .filter(
      (item) =>
        (category === "All" || item.category === category) &&
        `${item.name} ${item.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  const categories = [
    "All",
    ...new Set(analyticsService.getReports(user).map((item) => item.category)),
  ];
  const run = async (report) => {
    try {
      const result = await analyticsService.runReport(
        report.id,
        { dateRange: "Last 30 days", currency: "USD" },
        user,
      );
      setActive(result);
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="an-page">
      <header className="an-hero">
        <div>
          <span>Controlled reporting workspace</span>
          <h1>Report library</h1>
          <p>
            Predefined and saved reports remain permission-, scope-, and
            field-aware.
          </p>
        </div>
        <button
          type="button"
          className="an-primary"
          onClick={() => navigate("admin/reports/builder")}
        >
          <Plus /> Build report
        </button>
      </header>
      <nav className="an-report-nav">
        <button onClick={() => navigate("admin/analytics")}>Dashboards</button>
        <button className="active">Library</button>
        <button onClick={() => navigate("admin/reports/scheduled")}>
          Scheduled
        </button>
        <button onClick={() => navigate("admin/reports/exports")}>
          Exports & governance
        </button>
      </nav>
      <section className="an-filterbar">
        <label>
          Search reports
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Report name"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div>
          <span>Visible reports</span>
          <strong>{reports.length}</strong>
        </div>
      </section>
      <div className="an-report-grid">
        {reports.map((report) => (
          <article key={report.id}>
            <span>
              {report.category} · v{report.version}
            </span>
            <h2>{report.name}</h2>
            <p>{report.description}</p>
            <div>
              <small>{report.confidentiality}</small>
              <small>{report.metrics.length} metrics</small>
            </div>
            <button type="button" onClick={() => run(report)}>
              Run report <ArrowRight />
            </button>
          </article>
        ))}
      </div>
      {!reports.length && (
        <div className="an-empty">
          <FileText />
          <h2>No reports in scope</h2>
          <p>
            Try another category, or request access to a restricted reporting
            domain.
          </p>
        </div>
      )}
      {active && (
        <ReportPreview
          result={active}
          close={() => setActive(null)}
          user={user}
          showToast={showToast}
        />
      )}
    </section>
  );
}

function ReportPreview({ result, close, user, showToast }) {
  const exportReport = async (format) => {
    try {
      const item = await analyticsService.requestReportExport(
        result.report.id,
        format,
        result.filters,
        user,
      );
      showToast(`${item.reference}: ${item.status}.`);
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <div className="an-modal-backdrop" onMouseDown={close}>
      <section
        className="an-modal is-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-preview-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>
              Generated {new Date(result.generatedAt).toLocaleString()}
            </span>
            <h2 id="report-preview-title">{result.report.name}</h2>
            <p>
              {result.report.confidentiality} · report version{" "}
              {result.report.version}
            </p>
          </div>
          <button onClick={close}>Close</button>
        </header>
        <div className="an-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current</th>
                <th>Previous</th>
                <th>Change</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.metric}>
                  <td>{row.metric}</td>
                  <td>
                    <strong>{row.value}</strong>
                  </td>
                  <td>{row.previous ?? "Unavailable"}</td>
                  <td>
                    {row.change === null ? "Unavailable" : `${row.change}%`}
                  </td>
                  <td>{row.dataQuality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer>
          <button onClick={() => exportReport("CSV")}>
            <DownloadSimple /> CSV
          </button>
          <button onClick={() => exportReport("JSON")}>
            <DownloadSimple /> JSON
          </button>
          <button onClick={() => exportReport("PDF-style print")}>
            <DownloadSimple /> Print report
          </button>
        </footer>
      </section>
    </div>
  );
}

function ReportBuilder({ navigate, showToast }) {
  const { user } = useAuth();
  const definitions = analyticsService.getMetricDefinitions(user);
  const domains = [...new Set(definitions.map((item) => item.category))];
  const [form, setForm] = useState({
    name: "",
    domain: domains[0] || "Catalog",
    metrics: [],
    dimensions: ["Date"],
    chartType: "Bar chart",
    dateRange: "Last 30 days",
    comparison: "Previous equivalent period",
    visibility: "Personal",
  });
  const available = definitions.filter((item) => item.category === form.domain);
  const toggleMetric = (key) =>
    setForm((current) => ({
      ...current,
      metrics: current.metrics.includes(key)
        ? current.metrics.filter((item) => item !== key)
        : [...current.metrics, key],
    }));
  const save = async () => {
    try {
      const report = await analyticsService.createCustomReport(
        {
          ...form,
          filters: { dateRange: form.dateRange, comparison: form.comparison },
        },
        user,
      );
      showToast(`${report.name} saved.`);
      navigate("admin/reports");
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="an-page">
      <header className="an-hero">
        <div>
          <span>Controlled report builder</span>
          <h1>Build a report</h1>
          <p>
            Select approved metrics and dimensions—no raw queries, arbitrary
            code, or unsafe expressions.
          </p>
        </div>
        <button onClick={() => navigate("admin/reports")}>Cancel</button>
      </header>
      <div className="an-builder">
        <section>
          <span>1 · Definition</span>
          <h2>Report identity</h2>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Monthly catalog demand"
            />
          </label>
          <label>
            Data domain
            <select
              value={form.domain}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  domain: event.target.value,
                  metrics: [],
                }))
              }
            >
              {domains.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Visibility
            <select
              value={form.visibility}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  visibility: event.target.value,
                }))
              }
            >
              <option>Personal</option>
              <option>Shared internal</option>
            </select>
          </label>
        </section>
        <section>
          <span>2 · Metrics</span>
          <h2>Visible metric registry</h2>
          <div className="an-check-list">
            {available.map((item) => (
              <label key={item.key}>
                <input
                  type="checkbox"
                  checked={form.metrics.includes(item.key)}
                  onChange={() => toggleMetric(item.key)}
                />
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.format} · {item.dataQuality}
                    {item.simulated ? " · Simulated" : ""}
                  </small>
                </span>
              </label>
            ))}
          </div>
          {!available.length && <p>No authorized metrics in this domain.</p>}
        </section>
        <section>
          <span>3 · Presentation</span>
          <h2>Range and chart</h2>
          <label>
            Date range
            <select
              value={form.dateRange}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dateRange: event.target.value,
                }))
              }
            >
              {dateOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Comparison
            <select
              value={form.comparison}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  comparison: event.target.value,
                }))
              }
            >
              {comparisonOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Chart type
            <select
              value={form.chartType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  chartType: event.target.value,
                }))
              }
            >
              {[
                "Line chart",
                "Bar chart",
                "Stacked bar chart",
                "Area chart",
                "Donut chart",
                "Funnel",
                "KPI cards",
                "Table",
                "Heatmap simulation",
                "Cohort-style table",
                "Timeline",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </section>
        <aside>
          <span>Preview</span>
          <h2>{form.name || "Untitled report"}</h2>
          <p>
            {form.domain} · {form.metrics.length} metrics · {form.chartType}
          </p>
          <div className="an-preview-bars">
            {form.metrics.slice(0, 5).map((key, index) => (
              <i key={key} style={{ width: `${92 - index * 12}%` }} />
            ))}
          </div>
          <button
            className="an-primary"
            type="button"
            onClick={save}
            disabled={!form.name || !form.metrics.length}
          >
            <CheckCircle /> Save report
          </button>
        </aside>
      </div>
    </section>
  );
}

function ScheduledReports({ navigate, showToast }) {
  const { user } = useAuth();
  const [state, setState] = useState(analyticsService.getState());
  const reports = analyticsService.getReports(user);
  const [form, setForm] = useState({
    reportId: reports[0]?.id || "",
    recipients: user.email,
    frequency: "Monthly",
    format: "CSV",
  });
  const schedule = async () => {
    try {
      await analyticsService.scheduleReport(form, user);
      setState(analyticsService.getState());
      showToast("Scheduled report simulation created.");
    } catch (error) {
      showToast(error.message);
    }
  };
  const run = async () => {
    try {
      const count = await analyticsService.runScheduledReportsNow(user);
      setState(analyticsService.getState());
      showToast(`${count} scheduled reports simulated.`);
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="an-page">
      <header className="an-hero">
        <div>
          <span>Prototype scheduling</span>
          <h1>Scheduled reports</h1>
          <p>
            No background worker runs automatically. Use the demo action to
            simulate delivery.
          </p>
        </div>
        <button className="an-primary" onClick={run}>
          <Clock /> Run scheduled reports now
        </button>
      </header>
      <nav className="an-report-nav">
        <button onClick={() => navigate("admin/reports")}>Library</button>
        <button className="active">Scheduled</button>
        <button onClick={() => navigate("admin/reports/exports")}>
          Exports
        </button>
      </nav>
      <div className="an-dashboard-grid">
        <article className="an-panel">
          <h2>Create schedule</h2>
          <div className="an-form-grid">
            <label>
              Report
              <select
                value={form.reportId}
                onChange={(event) =>
                  setForm({ ...form, reportId: event.target.value })
                }
              >
                {reports.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Recipients
              <input
                value={form.recipients}
                onChange={(event) =>
                  setForm({ ...form, recipients: event.target.value })
                }
              />
            </label>
            <label>
              Frequency
              <select
                value={form.frequency}
                onChange={(event) =>
                  setForm({ ...form, frequency: event.target.value })
                }
              >
                {["Daily", "Weekly", "Monthly", "Quarterly"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Format
              <select
                value={form.format}
                onChange={(event) =>
                  setForm({ ...form, format: event.target.value })
                }
              >
                <option>CSV</option>
                <option>JSON</option>
                <option>PDF-style print</option>
              </select>
            </label>
          </div>
          <button className="an-primary" onClick={schedule}>
            Create schedule
          </button>
        </article>
        <article className="an-panel">
          <h2>Delivery rules</h2>
          <ul>
            <li>Restricted reports remain internal.</li>
            <li>Finance and security recipients are role-validated.</li>
            <li>Links expire after the configured period.</li>
            <li>Email delivery is simulated and audited.</li>
          </ul>
        </article>
      </div>
      <div className="an-table-wrap an-panel">
        <table>
          <thead>
            <tr>
              <th>Report</th>
              <th>Recipients</th>
              <th>Frequency</th>
              <th>Next run</th>
              <th>Format</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {state.schedules.map((item) => (
              <tr key={item.id}>
                <td>
                  {reports.find((report) => report.id === item.reportId)
                    ?.name || item.reportId}
                </td>
                <td>{item.recipients.join(", ")}</td>
                <td>{item.frequency}</td>
                <td>{new Date(item.nextRun).toLocaleString()}</td>
                <td>{item.format}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExportsGovernance({ navigate, showToast }) {
  const { user } = useAuth();
  const [state, setState] = useState(analyticsService.getState());
  const context = buildAuthorizationContext(user.id);
  const canSnapshot = canPerform("reports.create_snapshot", context).allowed;
  const canAlerts = canPerform("reports.manage_alerts", context).allowed;
  const canApproveExports = canPerform(
    "reports.export_restricted",
    context,
  ).allowed;
  const reports = analyticsService.getReports(user);
  const snapshot = () => {
    try {
      analyticsService.createAnalyticsSnapshot(
        reports[0]?.id,
        { dateRange: "Last 30 days" },
        user,
      );
      setState(analyticsService.getState());
      showToast("Immutable prototype snapshot created.");
    } catch (error) {
      showToast(error.message);
    }
  };
  const evaluate = () => {
    try {
      const triggered = analyticsService.evaluateAnalyticsAlerts({}, user);
      setState(analyticsService.getState());
      showToast(
        `${triggered.length} new alerts triggered; cooldowns respected.`,
      );
    } catch (error) {
      showToast(error.message);
    }
  };
  const rebuild = () => {
    analyticsService.rebuildCache(user);
    setState(analyticsService.getState());
    showToast("Analytics cache rebuilt.");
  };
  const reset = () => {
    analyticsService.resetAnalyticsReportingDemoData();
    setState(analyticsService.getState());
    showToast("Analytics and reporting demo data reset.");
  };
  const approve = (id) => {
    try {
      analyticsService.approveReportExport(id, user);
      setState(analyticsService.getState());
      showToast("Restricted export approved with expiring access.");
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="an-page">
      <header className="an-hero">
        <div>
          <span>Export safety & governance</span>
          <h1>Reporting records</h1>
          <p>
            Restricted exports, expiring access, immutable prototype snapshots,
            alerts, annotations, and cache status.
          </p>
        </div>
        <button onClick={rebuild}>
          <GearSix /> Rebuild cache
        </button>
      </header>
      <nav className="an-report-nav">
        <button onClick={() => navigate("admin/reports")}>Library</button>
        <button onClick={() => navigate("admin/reports/scheduled")}>
          Scheduled
        </button>
        <button className="active">Exports & governance</button>
      </nav>
      <div className="an-action-row">
        {canSnapshot && (
          <button className="an-primary" onClick={snapshot}>
            <FileText /> Create snapshot
          </button>
        )}
        {canAlerts && (
          <button onClick={evaluate}>
            <Bell /> Evaluate alerts now
          </button>
        )}
        <button onClick={reset}>
          <Sliders /> Reset analytics demo
        </button>
      </div>
      <div className="an-dashboard-grid">
        <article className="an-panel">
          <header>
            <div>
              <span>Expiring report access</span>
              <h2>Export history</h2>
            </div>
            <DownloadSimple />
          </header>
          {state.exports.map((item) => (
            <div className="an-record" key={item.id}>
              <div>
                <strong>{item.reference}</strong>
                <span>
                  {item.format} · {item.rowCount} rows · {item.confidentiality}
                </span>
              </div>
              <div>
                <span className="an-status">{item.status}</span>
                <small>
                  Expires {new Date(item.expiresAt).toLocaleDateString()}
                </small>
                {canApproveExports &&
                  item.status === "Approval Required" &&
                  item.requestedBy !== user.id && (
                    <button type="button" onClick={() => approve(item.id)}>
                      Approve
                    </button>
                  )}
              </div>
            </div>
          ))}
        </article>
        <article className="an-panel">
          <header>
            <div>
              <span>Immutable prototype records</span>
              <h2>Snapshots</h2>
            </div>
            <FileText />
          </header>
          {state.snapshots.map((item) => (
            <div className="an-record" key={item.id}>
              <div>
                <strong>{item.reference}</strong>
                <span>Report version {item.reportVersion} · Simulated</span>
              </div>
              <small>{new Date(item.generatedAt).toLocaleString()}</small>
            </div>
          ))}
        </article>
      </div>
      <div className="an-dashboard-grid">
        <article className="an-panel">
          <header>
            <div>
              <span>Threshold monitoring</span>
              <h2>Analytics alerts</h2>
            </div>
            <Bell />
          </header>
          {state.alerts.map((item) => (
            <div className="an-record" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.condition} {item.threshold} · {item.cooldownHours}h
                  cooldown
                </span>
              </div>
              <span className={`an-status is-${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
          ))}
        </article>
        <article className="an-panel">
          <header>
            <div>
              <span>Trend context</span>
              <h2>Report annotations</h2>
            </div>
            <FileText />
          </header>
          {state.annotations.map((item) => (
            <div className="an-record" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.note}</span>
              </div>
              <small>{item.date}</small>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

export function AnalyticsReportingModule({ view, navigate, showToast }) {
  const { user } = useAuth();
  if (view === "admin/reports")
    return <ReportLibrary navigate={navigate} showToast={showToast} />;
  if (view === "admin/reports/builder")
    return <ReportBuilder navigate={navigate} showToast={showToast} />;
  if (view === "admin/reports/scheduled")
    return <ScheduledReports navigate={navigate} showToast={showToast} />;
  if (view === "admin/reports/exports")
    return <ExportsGovernance navigate={navigate} showToast={showToast} />;
  let dashboard = routeToDashboard[view] || "executive";
  if (view === "admin/analytics") {
    const context = user ? buildAuthorizationContext(user.id) : null;
    dashboard =
      Object.entries(dashboardDefinitions).find(
        ([, item]) => context && canPerform(item.permission, context).allowed,
      )?.[0] || "executive";
  }
  return (
    <DashboardPage type={dashboard} navigate={navigate} showToast={showToast} />
  );
}

export function renderAnalyticsView(view, props) {
  return <AnalyticsReportingModule view={view} {...props} />;
}
