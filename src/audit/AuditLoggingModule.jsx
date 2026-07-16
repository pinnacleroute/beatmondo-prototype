import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Archive,
  CheckCircle,
  Clock,
  DownloadSimple,
  FileText,
  Fingerprint,
  Funnel,
  LinkSimple,
  LockKey,
  ShieldCheck,
  TrendUp,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  AUDIT_RESULTS,
  AUDIT_SEVERITIES,
  AUDIT_VISIBILITIES,
} from "./auditData.js";
import { auditService } from "./auditService.js";
import "./audit.css";

export const AUDIT_VIEWS = new Set([
  "admin-audit",
  "admin-audit-event",
  "admin-audit-security",
  "admin-audit-exports",
  "admin-audit-settings",
  "admin-audit-analytics",
]);

const can = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const titleCase = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Status = ({ value }) => (
  <span
    className={`au-status au-${String(value).toLowerCase().replaceAll(" ", "-")}`}
  >
    {value}
  </span>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="au-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="au-actions">{actions}</div>}
  </header>
);
const Notice = () => (
  <div className="au-notice">
    <Fingerprint />
    <span>
      <strong>Prototype evidence, not a compliance ledger.</strong> Events are
      append-only in the normal UI, redacted before persistence, and marked with
      simulated integrity indicators. Browser storage is not tamper-proof,
      certified, or legally immutable.
    </span>
  </div>
);
const Metric = ({ label, value, tone }) => (
  <article className={tone ? `au-metric ${tone}` : "au-metric"}>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

function AuditNav({ navigate, active }) {
  return (
    <nav className="au-subnav" aria-label="Audit logging sections">
      {[
        ["admin-audit", "Evidence ledger"],
        ["admin-audit-security", "Security review"],
        ["admin-audit-exports", "Exports"],
        ["admin-audit-settings", "Retention & health"],
        ["admin-audit-analytics", "Analytics"],
      ].map(([view, label]) => (
        <button
          key={view}
          className={active === view ? "active" : ""}
          onClick={() => navigate(view)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function EventTable({
  events,
  navigate,
  empty = "No visible audit events match these filters.",
}) {
  const inspect = (event) => {
    auditService.selectEvent(event.id);
    navigate("admin-audit-event");
  };
  return (
    <div className="au-table-wrap">
      <table className="au-table">
        <thead>
          <tr>
            <th>Evidence</th>
            <th>Event</th>
            <th>Actor / subject</th>
            <th>Result</th>
            <th>Visibility</th>
            <th>Review</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <strong>{event.reference}</strong>
                <span>{date(event.occurredAt)}</span>
              </td>
              <td>
                <strong>{event.action}</strong>
                <span>
                  {event.module} · {event.category}
                </span>
              </td>
              <td>
                <strong>{event.actor?.displayName}</strong>
                <span>
                  {event.subject?.displayName || event.subject?.entityType}
                </span>
              </td>
              <td>
                <Status value={event.result} />
                <span>{event.severity}</span>
              </td>
              <td>
                <span className="au-visibility">{event.visibility}</span>
                <span>{event.confidentiality}</span>
              </td>
              <td>
                <Status value={event.reviewStatus} />
              </td>
              <td>
                <button className="text-action" onClick={() => inspect(event)}>
                  Inspect <ArrowRight />
                </button>
              </td>
            </tr>
          ))}
          {!events.length && (
            <tr>
              <td colSpan="7" className="au-empty">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard({ navigate }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    module: "All",
    result: "All",
    severity: "All",
    visibility: "All",
    reviewStatus: "All",
    pageSize: 25,
  });
  const result = useMemo(
    () => auditService.query(filters, user),
    [filters, user],
  );
  const analytics = auditService.analytics(user);
  const modules = [
    ...new Set(
      auditService
        .query({ pageSize: 10000 }, user)
        .all.map((item) => item.module),
    ),
  ].sort();
  const set = (key) => (event) =>
    setFilters((value) => ({ ...value, [key]: event.target.value }));
  return (
    <section className="au-page">
      <Header
        eyebrow="Centralized evidence layer"
        title="Audit logging"
        text="Search permission-filtered evidence across authentication, rights, licensing, protected media, delivery, financial, and administrative workflows."
      />
      <Notice />
      <AuditNav navigate={navigate} active="admin-audit" />
      <div className="au-metrics">
        <Metric label="Visible events" value={analytics.total} />
        <Metric
          label="Pending review"
          value={analytics.pendingReview}
          tone="warning"
        />
        <Metric
          label="Security signals"
          value={analytics.security}
          tone="danger"
        />
        <Metric label="Manual overrides" value={analytics.overrides} />
      </div>
      <div className="au-toolbar">
        <label>
          <Funnel />
          <input
            aria-label="Search audit events"
            placeholder="Reference, action, actor, subject or correlation"
            value={filters.search}
            onChange={set("search")}
          />
        </label>
        <select
          aria-label="Filter by module"
          value={filters.module}
          onChange={set("module")}
        >
          <option>All</option>
          {modules.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter by result"
          value={filters.result}
          onChange={set("result")}
        >
          <option>All</option>
          {AUDIT_RESULTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter by severity"
          value={filters.severity}
          onChange={set("severity")}
        >
          <option>All</option>
          {AUDIT_SEVERITIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter by visibility"
          value={filters.visibility}
          onChange={set("visibility")}
        >
          <option>All</option>
          {AUDIT_VISIBILITIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter by review"
          value={filters.reviewStatus}
          onChange={set("reviewStatus")}
        >
          <option>All</option>
          <option>Not Reviewed</option>
          <option>In Review</option>
          <option>Escalated</option>
          <option>Reviewed</option>
          <option>Resolved</option>
        </select>
      </div>
      <div className="au-count">
        Showing {result.events.length} of {result.total} events available to{" "}
        {user?.roleLabel || "this account"}. Hidden restricted records are not
        included in counts or exports.
      </div>
      <EventTable events={result.events} navigate={navigate} />
    </section>
  );
}

function EventDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [note, setNote] = useState("");
  const event = useMemo(
    () => auditService.getSelectedEvent(user),
    [user, refresh],
  );
  if (!event)
    return (
      <section className="au-page">
        <Header
          eyebrow="Audit evidence"
          title="Event unavailable"
          text="This record does not exist or its visibility exceeds the current account permissions."
          actions={
            <button
              className="btn secondary"
              onClick={() => navigate("admin-audit")}
            >
              <ArrowLeft /> Back to audit
            </button>
          }
        />
      </section>
    );
  const correlation = auditService.correlation(event.correlationId, user);
  const review = (status) => {
    try {
      auditService.review(event.id, status, note, user);
      setNote("");
      setRefresh((value) => value + 1);
      showToast?.(`Audit event marked ${status.toLowerCase()}.`);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="au-page">
      <Header
        eyebrow={event.reference}
        title={event.action}
        text={event.description}
        actions={
          <button
            className="btn secondary"
            onClick={() => navigate("admin-audit")}
          >
            <ArrowLeft /> Evidence ledger
          </button>
        }
      />
      <Notice />
      <div className="au-detail-grid">
        <article className="au-card au-summary">
          <div>
            <span>Result</span>
            <Status value={event.result} />
          </div>
          <div>
            <span>Severity</span>
            <strong>{event.severity}</strong>
          </div>
          <div>
            <span>Occurred</span>
            <strong>{date(event.occurredAt)}</strong>
          </div>
          <div>
            <span>Review</span>
            <Status value={event.reviewStatus} />
          </div>
        </article>
        <article className="au-card">
          <h2>Actor</h2>
          <dl>
            <dt>Name</dt>
            <dd>{event.actor?.displayName}</dd>
            <dt>Type / role</dt>
            <dd>
              {event.actor?.actorType} · {event.actor?.role || "—"}
            </dd>
            <dt>Organization</dt>
            <dd>
              {event.actor?.organizationName || event.organizationId || "—"}
            </dd>
            <dt>Authentication</dt>
            <dd>{event.actor?.authenticationMethod || "Not recorded"}</dd>
          </dl>
        </article>
        <article className="au-card">
          <h2>Subject</h2>
          <dl>
            <dt>Entity</dt>
            <dd>{event.subject?.entityType}</dd>
            <dt>Name</dt>
            <dd>{event.subject?.displayName}</dd>
            <dt>Identifier</dt>
            <dd>{event.subject?.entityId || "—"}</dd>
            <dt>Reference</dt>
            <dd>{event.subject?.reference || "—"}</dd>
          </dl>
        </article>
        <article className="au-card">
          <h2>Evidence context</h2>
          <dl>
            <dt>Module / category</dt>
            <dd>
              {event.module} · {event.category}
            </dd>
            <dt>Correlation</dt>
            <dd>{event.correlationId}</dd>
            <dt>Request / session</dt>
            <dd>
              {event.requestId}
              {event.sessionId ? ` · ${event.sessionId}` : ""}
            </dd>
            <dt>Source</dt>
            <dd>{event.source}</dd>
          </dl>
        </article>
        <article className="au-card">
          <h2>Governance</h2>
          <dl>
            <dt>Visibility</dt>
            <dd>{event.visibility}</dd>
            <dt>Confidentiality</dt>
            <dd>{event.confidentiality}</dd>
            <dt>Retention</dt>
            <dd>
              {event.retentionClass} · {event.retentionStatus}
            </dd>
            <dt>Integrity</dt>
            <dd>
              <ShieldCheck /> Immutable in normal UI ·{" "}
              {event.metadata?.integrityHashPlaceholder}
            </dd>
          </dl>
        </article>
      </div>
      {(event.before || event.after) && (
        <article className="au-card au-changes">
          <h2>Before and after</h2>
          <div>
            <pre>{JSON.stringify(event.before, null, 2)}</pre>
            <ArrowRight />
            <pre>{JSON.stringify(event.after, null, 2)}</pre>
          </div>
        </article>
      )}
      {!!event.redactedFields?.length && (
        <div className="au-redaction">
          <LockKey /> Redacted before persistence:{" "}
          {event.redactedFields.join(", ")}
        </div>
      )}
      {can(user, "audit.review") && (
        <article className="au-card au-review">
          <h2>Review workflow</h2>
          <textarea
            aria-label="Audit review note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a concise review note"
          />
          <div className="au-actions">
            <button
              className="btn secondary"
              onClick={() => review("In Review")}
            >
              Start review
            </button>
            <button
              className="btn secondary"
              onClick={() => review("Escalated")}
            >
              Escalate
            </button>
            <button className="btn primary" onClick={() => review("Resolved")}>
              Resolve
            </button>
          </div>
        </article>
      )}
      <article className="au-card">
        <h2>Correlated workflow ({correlation.length})</h2>
        <div className="au-timeline">
          {correlation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                auditService.selectEvent(item.id);
                setRefresh((value) => value + 1);
              }}
            >
              <span>{date(item.occurredAt)}</span>
              <strong>{item.action}</strong>
              <small>
                {item.module} · {item.result}
              </small>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

function SecurityReview({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const result = useMemo(
    () => auditService.query({ securityOnly: true, pageSize: 200 }, user),
    [user, refresh],
  );
  const open = result.all.filter(
    (item) => !["Reviewed", "Resolved"].includes(item.reviewStatus),
  );
  const resolveOldest = () => {
    const event = open.at(-1);
    if (!event) return;
    try {
      auditService.review(
        event.id,
        "Resolved",
        "Resolved from the centralized security review queue.",
        user,
      );
      setRefresh((value) => value + 1);
      showToast?.("Security evidence resolved.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="au-page">
      <Header
        eyebrow="Restricted operational queue"
        title="Security review"
        text="Prioritize failed, denied, blocked, high-severity, and critical evidence without exposing restricted payloads to unauthorized roles."
        actions={
          open.length ? (
            <button className="btn primary" onClick={resolveOldest}>
              Resolve oldest
            </button>
          ) : null
        }
      />
      <Notice />
      <AuditNav navigate={navigate} active="admin-audit-security" />
      <div className="au-metrics">
        <Metric label="Visible security signals" value={result.total} />
        <Metric label="Open reviews" value={open.length} tone="warning" />
        <Metric
          label="Critical"
          value={
            result.all.filter((item) => item.severity === "Critical").length
          }
          tone="danger"
        />
        <Metric
          label="Denied / blocked"
          value={
            result.all.filter((item) =>
              ["Denied", "Blocked"].includes(item.result),
            ).length
          }
        />
      </div>
      <EventTable
        events={result.all}
        navigate={navigate}
        empty="No security signals are visible to this role."
      />
    </section>
  );
}

function Exports({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [format, setFormat] = useState("CSV");
  const state = useMemo(() => auditService.read(), [refresh]);
  const request = () => {
    try {
      const item = auditService.requestExport(
        { pageSize: 10000 },
        format,
        user,
      );
      setRefresh((v) => v + 1);
      showToast?.(`${item.reference} ${item.status.toLowerCase()}.`);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const action = (item) => {
    try {
      if (item.status === "Approval Required")
        auditService.approveExport(item.id, user);
      else auditService.generateExport(item.id, user);
      setRefresh((v) => v + 1);
      showToast?.("Audit export updated.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="au-page">
      <Header
        eyebrow="Permission-filtered evidence"
        title="Audit exports"
        text="Exports contain only records visible to the requester, require explicit approval for restricted evidence, and are delivered through short-lived single-use access."
      />
      <Notice />
      <AuditNav navigate={navigate} active="admin-audit-exports" />
      <article className="au-card au-export-create">
        <div>
          <FileText />
          <div>
            <h2>Create evidence export</h2>
            <p>
              The current role's visibility rules are applied before the export
              request is counted or generated.
            </p>
          </div>
        </div>
        <select
          aria-label="Export format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option>CSV</option>
          <option>JSON</option>
          <option>PDF</option>
        </select>
        <button className="btn primary" onClick={request}>
          <DownloadSimple /> Request export
        </button>
      </article>
      <div className="au-table-wrap">
        <table className="au-table">
          <thead>
            <tr>
              <th>Export</th>
              <th>Scope</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Temporary access</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.exports.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.reference}</strong>
                  <span>{item.format}</span>
                </td>
                <td>
                  <strong>{item.recordCount} visible events</strong>
                  <span>
                    {item.restricted
                      ? "Contains restricted evidence"
                      : "Standard evidence"}
                  </span>
                </td>
                <td>
                  <Status value={item.status} />
                </td>
                <td>
                  <strong>{item.requestedBy}</strong>
                  <span>{date(item.createdAt)}</span>
                </td>
                <td>
                  {item.temporaryUrl ? (
                    <a className="text-action" href={item.temporaryUrl}>
                      Open temporary access <LinkSimple />
                    </a>
                  ) : (
                    <span>Generated only after approval</span>
                  )}
                </td>
                <td>
                  {["Approval Required", "Approved"].includes(item.status) && (
                    <button
                      className="text-action"
                      onClick={() => action(item)}
                    >
                      {item.status === "Approval Required"
                        ? "Approve"
                        : "Generate"}{" "}
                      <ArrowRight />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!state.exports.length && (
              <tr>
                <td colSpan="6" className="au-empty">
                  No audit exports have been requested.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Settings({ navigate, showToast }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [holdEvent, setHoldEvent] = useState("");
  const [caseReference, setCaseReference] = useState("");
  const state = useMemo(() => auditService.read(), [refresh]);
  const health = (key, value) => {
    try {
      auditService.setHealth(key, value, user);
      setRefresh((v) => v + 1);
      showToast?.(`Audit ${titleCase(key)} marked ${value.toLowerCase()}.`);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const archive = () => {
    try {
      const count = auditService.archiveEligible(user);
      setRefresh((v) => v + 1);
      showToast?.(
        `${count} eligible events archived; protected evidence was preserved.`,
      );
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const restore = () => {
    try {
      const count = auditService.restoreArchived(user);
      setRefresh((v) => v + 1);
      showToast?.(`${count} archived events restored.`);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const hold = () => {
    try {
      const event = state.events.find(
        (item) =>
          item.reference === holdEvent.trim() || item.id === holdEvent.trim(),
      );
      if (!event) throw new Error("Enter a valid audit event reference.");
      if (!caseReference.trim())
        throw new Error("Enter a case or matter reference.");
      auditService.applyLegalHold(
        [event.id],
        "Evidence preserved for active review.",
        caseReference.trim(),
        user,
      );
      setHoldEvent("");
      setCaseReference("");
      setRefresh((v) => v + 1);
      showToast?.("Legal hold applied.");
    } catch (error) {
      showToast?.(error.message);
    }
  };
  const retry = () => {
    try {
      const count = auditService.retryFallback(user);
      setRefresh((v) => v + 1);
      showToast?.(`${count} queued events recovered.`);
    } catch (error) {
      showToast?.(error.message);
    }
  };
  return (
    <section className="au-page">
      <Header
        eyebrow="Lifecycle governance"
        title="Retention, legal hold & health"
        text="Model retention classes, cleanup protection, legal holds, archive eligibility, operational health, and graceful audit-persistence fallback."
      />
      <Notice />
      <AuditNav navigate={navigate} active="admin-audit-settings" />
      <div className="au-section-heading">
        <div>
          <h2>Retention policies</h2>
          <p>
            Durations are configurable prototype placeholders, not legal advice.
          </p>
        </div>
        <div className="au-actions">
          <button className="btn secondary" onClick={restore}>
            Restore archived
          </button>
          <button className="btn secondary" onClick={archive}>
            <Archive /> Archive eligible
          </button>
        </div>
      </div>
      <div className="au-policy-grid">
        {state.retentionPolicies.map((item) => (
          <article className="au-card" key={item.id}>
            <span>{item.duration}</span>
            <h2>{item.name}</h2>
            <p>{item.behavior}</p>
            <Status value={item.active ? "Active" : "Disabled"} />
          </article>
        ))}
      </div>
      <article className="au-card au-hold">
        <div>
          <LockKey />
          <div>
            <h2>Apply legal hold</h2>
            <p>
              Use an exact event reference. Held evidence is excluded from
              archive and cleanup.
            </p>
          </div>
        </div>
        <input
          aria-label="Audit event reference for legal hold"
          value={holdEvent}
          onChange={(e) => setHoldEvent(e.target.value)}
          placeholder="BM-AUD-2026-000001"
        />
        <input
          aria-label="Legal matter reference"
          value={caseReference}
          onChange={(e) => setCaseReference(e.target.value)}
          placeholder="Case or matter reference"
        />
        <button className="btn primary" onClick={hold}>
          Apply hold
        </button>
      </article>
      {!!state.legalHolds.length && (
        <div className="au-table-wrap">
          <table className="au-table">
            <thead>
              <tr>
                <th>Hold</th>
                <th>Matter</th>
                <th>Evidence</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.legalHolds.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.reference}</strong>
                    <span>{date(item.createdAt)}</span>
                  </td>
                  <td>{item.caseReference}</td>
                  <td>{item.eventIds.length} event(s)</td>
                  <td>
                    <Status value={item.status} />
                  </td>
                  <td>
                    {item.status === "Active" && (
                      <button
                        className="text-action"
                        onClick={() => {
                          try {
                            auditService.releaseLegalHold(
                              item.id,
                              "Authorized prototype release.",
                              user,
                            );
                            setRefresh((v) => v + 1);
                            showToast?.("Legal hold released.");
                          } catch (error) {
                            showToast?.(error.message);
                          }
                        }}
                      >
                        Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="au-section-heading">
        <div>
          <h2>Audit subsystem health</h2>
          <p>
            Workflow actions continue when audit persistence is degraded;
            sensitive fields are still redacted before fallback queuing.
          </p>
        </div>
        {state.fallbackQueue.length > 0 && (
          <button className="btn primary" onClick={retry}>
            Retry {state.fallbackQueue.length} queued
          </button>
        )}
      </div>
      <div className="au-health-grid">
        {Object.entries(state.health).map(([key, value]) => (
          <article className="au-card" key={key}>
            <div>
              <CheckCircle />
              <div>
                <strong>{titleCase(key)}</strong>
                <span>{value}</span>
              </div>
            </div>
            {can(user, "audit.manage_health") && (
              <select
                aria-label={`Set ${titleCase(key)} health`}
                value={value}
                onChange={(e) => health(key, e.target.value)}
              >
                <option>Operational</option>
                <option>Degraded</option>
                <option>Unavailable</option>
              </select>
            )}
          </article>
        ))}
      </div>
      <div className="au-governance-grid">
        <article className="au-card">
          <h2>Legal holds</h2>
          <strong>
            {state.legalHolds.filter((item) => item.status === "Active").length}{" "}
            active
          </strong>
          <p>Held evidence is excluded from cleanup and archive operations.</p>
        </article>
        <article className="au-card">
          <h2>Archived evidence</h2>
          <strong>
            {state.events.filter((item) => item.archivedAt).length} events
          </strong>
          <p>
            Archive status preserves the immutable event payload and integrity
            marker.
          </p>
        </article>
        <article className="au-card">
          <h2>Fallback queue</h2>
          <strong>{state.fallbackQueue.length} events</strong>
          <p>
            Queued payloads are redacted and recoverable when persistence
            returns.
          </p>
        </article>
      </div>
    </section>
  );
}

function Analytics({ navigate }) {
  const { user } = useAuth();
  const data = auditService.analytics(user);
  const max = Math.max(1, ...Object.values(data.modules));
  return (
    <section className="au-page">
      <Header
        eyebrow="Visibility-aware signals"
        title="Audit analytics"
        text="Operational counts are computed after the current role's visibility policy, so hidden evidence cannot leak through aggregate totals."
      />
      <Notice />
      <AuditNav navigate={navigate} active="admin-audit-analytics" />
      <div className="au-metrics">
        <Metric label="Visible evidence" value={data.total} />
        <Metric
          label="Pending review"
          value={data.pendingReview}
          tone="warning"
        />
        <Metric label="Security signals" value={data.security} tone="danger" />
        <Metric label="Overrides" value={data.overrides} />
      </div>
      <div className="au-analytics-grid">
        <article className="au-card">
          <h2>Evidence by module</h2>
          <div className="au-bars">
            {Object.entries(data.modules)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div>
                    <i style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                  <strong>{value}</strong>
                </div>
              ))}
          </div>
        </article>
        <article className="au-card">
          <h2>Results</h2>
          <div className="au-result-list">
            {Object.entries(data.results)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value]) => (
                <div key={label}>
                  <Status value={label} />
                  <strong>{value}</strong>
                </div>
              ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export function AuditTimeline({ subjectId, navigate }) {
  const { user } = useAuth();
  const events = auditService
    .query({ pageSize: 10000 }, user)
    .all.filter((item) => item.subject?.entityId === subjectId);
  if (!events.length) return null;
  return (
    <section className="au-context">
      <h2>Audit timeline</h2>
      {events.map((event) => (
        <button
          key={event.id}
          onClick={() => {
            auditService.selectEvent(event.id);
            navigate("admin-audit-event");
          }}
        >
          <Clock />
          <span>
            <strong>{event.action}</strong>
            <small>
              {date(event.occurredAt)} · {event.result}
            </small>
          </span>
          <ArrowRight />
        </button>
      ))}
    </section>
  );
}

export function renderAuditView(view, props) {
  if (view === "admin-audit") return <Dashboard {...props} />;
  if (view === "admin-audit-event") return <EventDetail {...props} />;
  if (view === "admin-audit-security") return <SecurityReview {...props} />;
  if (view === "admin-audit-exports") return <Exports {...props} />;
  if (view === "admin-audit-settings") return <Settings {...props} />;
  if (view === "admin-audit-analytics") return <Analytics {...props} />;
  return null;
}
