import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Copy,
  FileText,
  Funnel,
  LinkSimple,
  LockKey,
  ShieldCheck,
  TrendUp,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import { ACCESS_STATUSES } from "./expiringAccessData.js";
import { expiringAccessService } from "./expiringAccessService.js";
import { SectionSubnav } from "../ui/SectionSubnav.jsx";
import "./expiringAccess.css";

export const EXPIRING_ACCESS_VIEWS = new Set([
  "access",
  "admin-expiring-access",
  "admin-expiring-access-detail",
  "admin-expiring-access-policies",
  "admin-expiring-access-security",
  "admin-expiring-access-analytics",
]);
const can = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);

function ExpiringAccessAdminNav({ navigate, active }) {
  const items = [
    { view: "admin-expiring-access", label: "Records" },
    { view: "admin-expiring-access-policies", label: "Policies" },
    { view: "admin-expiring-access-security", label: "Security" },
    { view: "admin-expiring-access-analytics", label: "Analytics" },
  ];
  return (
    <SectionSubnav
      ariaLabel="Expiring access sections"
      navigate={navigate}
      active={active}
      items={items}
      backTo={
        active !== "admin-expiring-access"
          ? {
              view: "admin-expiring-access",
              label: "Back to expiring access dashboard",
            }
          : null
      }
    />
  );
}
const date = (value, time = true) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        ...(time ? { timeStyle: "short" } : {}),
      }).format(new Date(value))
    : "—";
const Status = ({ value }) => (
  <span
    className={`ea-status ea-${String(value).toLowerCase().replaceAll(" ", "-")}`}
  >
    {value}
  </span>
);
const Notice = () => (
  <div className="ea-notice">
    <ShieldCheck />
    <span>
      <strong>Simulated temporary access.</strong> Tokens, hashing, device
      checks, URL exchange, signed access, and protected transfer are
      browser-based demonstrations—not production security or real signed URLs.
    </span>
  </div>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="ea-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="ea-actions">{actions}</div>}
  </header>
);
function selectAccess(id, navigate) {
  expiringAccessService.select(id);
  navigate("admin-expiring-access-detail");
}
const remaining = (record) => Math.max(0, record.maxUses - record.useCount);

function Metrics({ data }) {
  return (
    <div className="ea-metrics">
      <article>
        <span>Access records</span>
        <strong>{data.total}</strong>
      </article>
      <article>
        <span>Active</span>
        <strong>{data.active}</strong>
      </article>
      <article>
        <span>Expired</span>
        <strong>{data.expired}</strong>
      </article>
      <article>
        <span>Revoked</span>
        <strong>{data.revoked}</strong>
      </article>
      <article>
        <span>Consumed</span>
        <strong>{data.consumed}</strong>
      </article>
      <article>
        <span>Security reviews</span>
        <strong>{data.securityReviews}</strong>
      </article>
    </div>
  );
}

function Dashboard({ navigate }) {
  const state = expiringAccessService.getState();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const records = useMemo(
    () =>
      state.records.filter(
        (record) =>
          (status === "All" || record.status === status) &&
          (type === "All" || record.resourceType === type) &&
          [
            record.reference,
            record.resourceLabel,
            record.resourceType,
            record.action,
            record.generatedForUserId,
            record.generatedForOrganizationId,
            record.relatedDeliveryId,
            record.relatedLicenceId,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [state, query, status, type],
  );
  return (
    <section className="ea-page">
      <ExpiringAccessAdminNav
        navigate={navigate}
        active="admin-expiring-access"
      />
      <Header
        eyebrow="Temporary resource authorization"
        title="Expiring access"
        text="Generate, validate, exchange, expire, refresh, revoke, and audit scope-limited access without exposing permanent private locations or reusable secret-bearing URLs."
      />
      <Notice />
      <Metrics data={expiringAccessService.getExpiringAccessAnalytics()} />
      <div className="ea-toolbar">
        <label>
          <Funnel />
          <input
            aria-label="Search temporary access"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Reference, resource, user, organization, delivery or licence"
          />
        </label>
        <select
          aria-label="Filter access status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option>All</option>
          {[...new Set(state.records.map((item) => item.status))].map(
            (item) => (
              <option key={item}>{item}</option>
            ),
          )}
        </select>
        <select
          aria-label="Filter resource type"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option>All</option>
          {[...new Set(state.records.map((item) => item.resourceType))].map(
            (item) => (
              <option key={item}>{item}</option>
            ),
          )}
        </select>
      </div>
      <div className="ea-table-wrap">
        <table className="ea-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Protected resource</th>
              <th>Scope</th>
              <th>Action</th>
              <th>Status</th>
              <th>Uses</th>
              <th>Expires</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <strong>{record.reference}</strong>
                  <span>token …{record.tokenDisplaySuffix}</span>
                </td>
                <td>
                  <strong>{record.resourceLabel}</strong>
                  <span>{record.resourceType}</span>
                </td>
                <td>
                  <strong>
                    {record.generatedForUserId || "Session-scoped"}
                  </strong>
                  <span>
                    {record.generatedForOrganizationId ||
                      record.anonymousSessionId ||
                      "No organization binding"}
                  </span>
                </td>
                <td>{record.action}</td>
                <td>
                  <Status value={record.status} />
                </td>
                <td>
                  {record.useCount} / {record.maxUses}
                </td>
                <td>{date(record.expiresAt)}</td>
                <td>
                  <button
                    className="text-action"
                    onClick={() => selectAccess(record.id, navigate)}
                  >
                    Inspect <ArrowRight />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Countdown({ expiresAt }) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)),
  );
  useEffect(() => {
    const timer = window.setInterval(
      () =>
        setSeconds(
          Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)),
        ),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  const minutes = Math.floor(seconds / 60);
  return (
    <span
      className="ea-countdown"
      aria-label={`${minutes} minutes and ${seconds % 60} seconds remaining`}
    >
      <Clock /> {minutes}:{String(seconds % 60).padStart(2, "0")} remaining
    </span>
  );
}

function Detail({ navigate, showToast }) {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const refresh = () => setTick((value) => value + 1);
  const state = expiringAccessService.getState();
  const record =
    expiringAccessService.getAccessRecord(expiringAccessService.selected()) ||
    state.records[0];
  const attempts = state.attempts.filter((item) => item.accessId === record.id);
  const exchanges = state.sessionExchanges.filter(
    (item) => item.accessId === record.id,
  );
  const doAction = (fn, message) => {
    try {
      fn();
      showToast(message);
      refresh();
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="ea-page">
      <Header
        eyebrow="Temporary-access record"
        title={record.reference}
        text={`${record.resourceLabel} · ${record.action}`}
        actions={
          <button
            className="outline"
            onClick={() => navigate("admin-expiring-access")}
          >
            <ArrowLeft /> Dashboard
          </button>
        }
      />
      <Notice />
      <div className="ea-summary">
        <div>
          <span>Status</span>
          <Status value={record.status} />
        </div>
        <div>
          <span>Action</span>
          <strong>{record.action}</strong>
        </div>
        <div>
          <span>Uses remaining</span>
          <strong>
            {remaining(record)} of {record.maxUses}
          </strong>
        </div>
        <div>
          <span>Expires</span>
          <strong>{date(record.expiresAt)}</strong>
        </div>
        <div>
          <span>Policy</span>
          <strong>
            {record.policyId} · v{record.policyVersion}
          </strong>
        </div>
      </div>
      <div className="ea-grid">
        <section className="ea-card">
          <h2>Resource and scope</h2>
          <dl className="ea-definition">
            <div>
              <dt>Resource type</dt>
              <dd>{record.resourceType}</dd>
            </div>
            <div>
              <dt>Safe label</dt>
              <dd>{record.resourceLabel}</dd>
            </div>
            <div>
              <dt>User binding</dt>
              <dd>{record.generatedForUserId || "Anonymous/session access"}</dd>
            </div>
            <div>
              <dt>Organization</dt>
              <dd>
                {record.generatedForOrganizationId || "Not organization-bound"}
              </dd>
            </div>
            <div>
              <dt>Session binding</dt>
              <dd>
                {record.generatedForSessionId ||
                  record.anonymousSessionId ||
                  "Not session-bound"}
              </dd>
            </div>
            <div>
              <dt>Device binding</dt>
              <dd>{record.deviceBinding}</dd>
            </div>
            <div>
              <dt>Region simulation</dt>
              <dd>{record.approximateRegionRestriction}</dd>
            </div>
          </dl>
        </section>
        <section className="ea-card">
          <h2>Token safety</h2>
          <div className="ea-token-safe">
            <LockKey />
            <div>
              <strong>Stored representation only</strong>
              <span>Hash placeholder: {record.tokenHashPlaceholder}</span>
              <span>Visible suffix: …{record.tokenDisplaySuffix}</span>
            </div>
          </div>
          <p>
            No full token, permanent asset URL, private storage reference, buyer
            email, or rights-party data appears in this history view.
          </p>
          <dl className="ea-definition">
            <div>
              <dt>Valid from</dt>
              <dd>{date(record.validFrom)}</dd>
            </div>
            <div>
              <dt>First use</dt>
              <dd>{date(record.firstUsedAt)}</dd>
            </div>
            <div>
              <dt>Last validation</dt>
              <dd>{date(record.lastValidatedAt)}</dd>
            </div>
            <div>
              <dt>Consumption</dt>
              <dd>{record.metadata.consumptionPolicy}</dd>
            </div>
          </dl>
        </section>
      </div>
      <section className="ea-card">
        <h2>Allowed methods and dependencies</h2>
        <div className="ea-scope-tags">
          {record.allowedMethods.map((item) => (
            <span key={item}>{item}</span>
          ))}
          {record.requiredPermissions.map((item) => (
            <span key={item}>Permission: {item}</span>
          ))}
          {record.requiredEntitlements.map((item) => (
            <span key={item}>Entitlement: {item}</span>
          ))}
        </div>
      </section>
      <section className="ea-actions-bar">
        <div>
          <strong>Controlled actions</strong>
          <span>
            Refresh creates a new token and preserves history. Revocation also
            invalidates active exchanges.
          </span>
        </div>
        {ACCESS_STATUSES[record.status]?.refresh &&
          can(user, "expiring_access.refresh") && (
            <button
              className="outline"
              onClick={() =>
                doAction(
                  () =>
                    expiringAccessService.refreshExpiringAccess(
                      record.id,
                      user,
                    ),
                  "New temporary access generated; the old record was superseded.",
                )
              }
            >
              Refresh access
            </button>
          )}
        {ACCESS_STATUSES[record.status]?.extension &&
          can(user, "expiring_access.extend") && (
            <button
              className="outline"
              onClick={() =>
                doAction(
                  () =>
                    expiringAccessService.extendExpiringAccess(
                      record.id,
                      15,
                      "Operational extension",
                      user,
                    ),
                  "Access extension recorded.",
                )
              }
            >
              Extend 15 minutes
            </button>
          )}
        {["Active", "Used", "Suspended"].includes(record.status) &&
          can(user, "expiring_access.revoke") && (
            <button
              className="danger"
              onClick={() =>
                doAction(
                  () =>
                    expiringAccessService.revokeExpiringAccess(
                      record.id,
                      "Manual access-control review",
                      user,
                    ),
                  "Temporary access revoked.",
                )
              }
            >
              Revoke
            </button>
          )}
      </section>
      <div className="ea-grid">
        <section className="ea-card">
          <h2>Validation attempts</h2>
          <div className="ea-list">
            {attempts.map((attempt) => (
              <article key={attempt.id}>
                <span>
                  <strong>{attempt.result}</strong>
                  {attempt.reasonCode}
                </span>
                <span>
                  {date(attempt.timestamp)}
                  <small>{attempt.approximateDevice}</small>
                </span>
              </article>
            ))}
          </div>
          {!attempts.length && (
            <p className="muted">No validation attempts recorded.</p>
          )}
        </section>
        <section className="ea-card">
          <h2>Session exchanges</h2>
          <div className="ea-list">
            {exchanges.map((exchange) => (
              <article key={exchange.id}>
                <span>
                  <strong>{exchange.action} session</strong>
                  {exchange.sessionId}
                </span>
                <span>
                  {exchange.status}
                  <small>{date(exchange.createdAt)}</small>
                </span>
              </article>
            ))}
          </div>
          {!exchanges.length && (
            <p className="muted">No protected session has been created.</p>
          )}
        </section>
      </div>
    </section>
  );
}

function Policies({ navigate, showToast }) {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const policies = expiringAccessService.getAccessPolicies();
  return (
    <section className="ea-page">
      <ExpiringAccessAdminNav
        navigate={navigate}
        active="admin-expiring-access-policies"
      />
      <Header
        eyebrow="Versioned policy hierarchy"
        title="Temporary-access policies"
        text="Resource overrides resolve before delivery, licence, organization, access-tier, and resource-type defaults. Existing records retain their generation-time policy version."
      />
      <Notice />
      <div className="ea-policy-list">
        {policies.map((policy) => (
          <article key={policy.id}>
            <header>
              <div>
                <span>
                  {policy.resourceType} · {policy.action}
                </span>
                <h2>{policy.name}</h2>
              </div>
              <Status value={policy.active ? "Active" : "Disabled"} />
            </header>
            <div>
              <span>
                <small>Default</small>
                {policy.defaultDurationMinutes} min
              </span>
              <span>
                <small>Allowed range</small>
                {policy.minimumDurationMinutes}–{policy.maximumDurationMinutes}{" "}
                min
              </span>
              <span>
                <small>Maximum uses</small>
                {policy.maxUses}
              </span>
              <span>
                <small>Binding</small>
                {policy.deviceBinding}
              </span>
              <span>
                <small>Version</small>v{policy.version}
              </span>
            </div>
            {can(user, "expiring_access.manage_policies") && (
              <button
                className="text-action"
                onClick={() => {
                  try {
                    expiringAccessService.updatePolicy(
                      policy.id,
                      { refreshAllowed: !policy.refreshAllowed },
                      "Policy refresh setting updated during prototype review.",
                      user,
                    );
                    showToast(
                      "Policy version created and future-record behavior updated.",
                    );
                    setTick((value) => value + 1);
                  } catch (error) {
                    showToast(error.message);
                  }
                }}
              >
                Toggle refresh for future records <ArrowRight />
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Security({ navigate, showToast }) {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const state = expiringAccessService.getState();
  const open = state.securityReviews.filter((item) => item.status === "Open");
  return (
    <section className="ea-page">
      <ExpiringAccessAdminNav
        navigate={navigate}
        active="admin-expiring-access-security"
      />
      <Header
        eyebrow="Rate and anomaly controls"
        title="Access security review"
        text="Review repeated generation, mismatch, sharing, region, and high-value-resource indicators without claiming production fraud detection."
      />
      <Notice />
      <div className="ea-security-grid">
        <section className="ea-card">
          <h2>Generation controls</h2>
          <dl className="ea-definition">
            <div>
              <dt>Window</dt>
              <dd>{state.settings.generationWindowMinutes} minutes</dd>
            </div>
            <div>
              <dt>Standard limit</dt>
              <dd>{state.settings.generationLimit} requests</dd>
            </div>
            <div>
              <dt>Review threshold</dt>
              <dd>{state.settings.securityReviewThreshold} requests</dd>
            </div>
          </dl>
          <p>
            Thresholds create a simulated review; they do not represent
            production rate limiting or fraud protection.
          </p>
        </section>
        <section className="ea-card">
          <h2>Bulk revocation</h2>
          <p>
            Revoke all current links for the active VIP delivery while
            preserving validation attempts and historical records.
          </p>
          <button
            className="danger"
            disabled={!can(user, "expiring_access.bulk_revoke")}
            onClick={() => {
              try {
                const affected = expiringAccessService.revokeAccessByScope(
                  "Delivery",
                  "delivery-package-16",
                  "Delivery-wide security review",
                  user,
                );
                showToast(
                  `${affected.length} temporary access record(s) revoked.`,
                );
                setTick((value) => value + 1);
              } catch (error) {
                showToast(error.message);
              }
            }}
          >
            Bulk revoke delivery access
          </button>
        </section>
      </div>
      <div className="ea-review-list">
        {open.map((review) => (
          <article key={review.id}>
            <div>
              <span>{review.severity} review</span>
              <h2>{review.reason}</h2>
              <ul>
                {review.indicators.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>{review.internalNotes}</p>
            </div>
            <div>
              <Status value={review.status} />
              {can(user, "expiring_access.resolve_security") && (
                <>
                  <button
                    className="outline"
                    onClick={() => {
                      expiringAccessService.resolveSecurityReview(
                        review.id,
                        "Keep Revoked",
                        "Access remains unavailable pending offline verification.",
                        user,
                      );
                      showToast(
                        "Security review resolved with access revoked.",
                      );
                      setTick((value) => value + 1);
                    }}
                  >
                    Keep revoked
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      expiringAccessService.resolveSecurityReview(
                        review.id,
                        "Restore",
                        "Current entitlement and account reviewed.",
                        user,
                      );
                      showToast(
                        "Security review resolved and access restored.",
                      );
                      setTick((value) => value + 1);
                    }}
                  >
                    Restore access
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {!open.length && (
        <div className="ea-empty">
          <CheckCircle />
          <h2>No open security reviews</h2>
          <p>The simulated review queue is clear.</p>
        </div>
      )}
    </section>
  );
}

function Analytics({ navigate }) {
  const data = expiringAccessService.getExpiringAccessAnalytics();
  return (
    <section className="ea-page">
      <ExpiringAccessAdminNav
        navigate={navigate}
        active="admin-expiring-access-analytics"
      />
      <Header
        eyebrow="Temporary-access intelligence"
        title="Expiring-access analytics"
        text="Mock operational metrics across generation, validation, denial, expiry, revocation, consumption, refresh, and resource type."
      />
      <Notice />
      <Metrics data={data} />
      <div className="ea-grid">
        <section className="ea-card">
          <h2>Validation outcomes</h2>
          <div className="ea-big-stat">
            <strong>{data.successRate}%</strong>
            <span>Access success rate</span>
          </div>
          <dl className="ea-definition">
            <div>
              <dt>Granted</dt>
              <dd>{data.granted}</dd>
            </div>
            <div>
              <dt>Denied</dt>
              <dd>{data.denied}</dd>
            </div>
            <div>
              <dt>Unused historical URLs</dt>
              <dd>{data.unused}</dd>
            </div>
            <div>
              <dt>Average lifetime</dt>
              <dd>{data.averageLifetime} minutes</dd>
            </div>
            <div>
              <dt>Refreshes</dt>
              <dd>{data.refreshes}</dd>
            </div>
          </dl>
        </section>
        <section className="ea-card">
          <h2>Records by resource type</h2>
          <div className="ea-chart">
            {Object.entries(data.byType).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <div>
                  <i
                    style={{
                      width: `${Math.max(3, (value / Math.max(1, data.total)) * 100)}%`,
                    }}
                  />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function AccessPage({ navigate, showToast }) {
  const { user } = useAuth();
  const readToken = () =>
    window.location.hash.startsWith("#access/")
      ? window.location.hash.slice(8)
      : "";
  const [token, setToken] = useState(readToken);
  const [result, setResult] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    const syncToken = () => setToken(readToken());
    window.addEventListener("hashchange", syncToken);
    return () => window.removeEventListener("hashchange", syncToken);
  }, []);
  useEffect(() => {
    setBusy(true);
    setResult(null);
    setExchange(null);
    const timer = window.setTimeout(() => {
      setResult(
        expiringAccessService.validateExpiringAccess(token, {
          user,
          action: undefined,
          deviceBinding: "Current browser session",
        }),
      );
      setBusy(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [token, user]);
  if (busy)
    return (
      <main className="ea-access-page">
        <div className="ea-validation">
          <span className="ea-spinner" />
          <h1>Validating temporary access</h1>
          <p>
            Checking scope, expiry, account, entitlement, and protected-resource
            state.
          </p>
        </div>
      </main>
    );
  if (!result?.valid)
    return (
      <main className="ea-access-page">
        <div
          className={`ea-access-state ea-state-${result?.code?.toLowerCase()}`}
        >
          <WarningCircle />
          <span>
            {result?.code === "TOKEN_EXPIRED"
              ? "Access expired"
              : result?.code === "TOKEN_REVOKED"
                ? "Access revoked"
                : result?.code === "TOKEN_CONSUMED"
                  ? "Access already used"
                  : "Access unavailable"}
          </span>
          <h1>
            {result?.reason ||
              "This temporary access is invalid or no longer available."}
          </h1>
          <p>
            The protected resource, intended user, and private ownership details
            have not been disclosed.
          </p>
          {result?.refreshAllowed && user && (
            <button
              className="outline"
              onClick={() => navigate("buyer-deliveries")}
            >
              Return to your workspace
            </button>
          )}
          <button
            className="text-action"
            onClick={() => navigate(user ? "home" : "login")}
          >
            Return safely
          </button>
        </div>
      </main>
    );
  const perform = () => {
    try {
      const next = expiringAccessService.exchangeExpiringAccess(token, {
        user,
        action: result.action,
        deviceBinding: "Current browser session",
      });
      setExchange(next);
      showToast("Temporary URL exchanged into a scoped protected session.");
    } catch (error) {
      showToast(error.message);
      setResult(
        expiringAccessService.validateExpiringAccess(token, {
          user,
          action: result.action,
          deviceBinding: "Current browser session",
        }),
      );
    }
  };
  return (
    <main className="ea-access-page">
      <section className="ea-protected-viewer">
        <header>
          <strong>beatmondo</strong>
          <span>Temporary protected access</span>
        </header>
        <div className="ea-protected-title">
          <LockKey />
          <span>{result.action} access</span>
          <h1>{result.resource.label}</h1>
          <p>{result.resource.type}</p>
        </div>
        <div className="ea-access-facts">
          <span>
            <small>Expires</small>
            {date(result.expiresAt)}
          </span>
          <span>
            <small>Uses remaining</small>
            {exchange ? remaining(exchange.record) : result.usesRemaining}
          </span>
          <span>
            <small>Action scope</small>
            {result.action}
          </span>
        </div>
        <Countdown expiresAt={result.expiresAt} />
        {exchange ? (
          <div className="ea-exchange-success" role="status">
            <CheckCircle />
            <div>
              <strong>{exchange.session.status} session created</strong>
              <span>
                {exchange.session.id} · expires{" "}
                {date(exchange.session.expiresAt)}
              </span>
              <p>
                The temporary URL and protected session remain separate. No
                private storage location was exposed.
              </p>
            </div>
          </div>
        ) : (
          <button className="primary full" onClick={perform}>
            {result.action === "DOWNLOAD"
              ? "Authorize one download session"
              : result.action === "STREAM"
                ? "Start protected preview session"
                : result.action === "UPLOAD"
                  ? "Open temporary upload session"
                  : result.action === "SIGN"
                    ? "Open signing session"
                    : "Open protected document"}
          </button>
        )}
        <button
          className="text-action"
          onClick={() => navigate(user ? "home" : "login")}
        >
          Close protected access
        </button>
      </section>
    </main>
  );
}

export function renderExpiringAccessView(view, props) {
  if (view === "access") return <AccessPage {...props} />;
  if (view === "admin-expiring-access") return <Dashboard {...props} />;
  if (view === "admin-expiring-access-detail") return <Detail {...props} />;
  if (view === "admin-expiring-access-policies") return <Policies {...props} />;
  if (view === "admin-expiring-access-security") return <Security {...props} />;
  if (view === "admin-expiring-access-analytics")
    return <Analytics {...props} />;
  return null;
}
