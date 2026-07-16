import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Certificate,
  CheckCircle,
  Clock,
  FileText,
  Funnel,
  Plus,
  Printer,
  ShieldCheck,
  TrendUp,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatPaymentMoney } from "../payments/paymentService.js";
import {
  calculateDeliveryAuthorizationReadiness,
  calculateLicenceCompleteness,
  calculateLicenceGenerationReadiness,
  licenceService,
} from "./licenceService.js";
import { expiringAccessService } from "../expiring-access/expiringAccessService.js";
import "./licences.css";

export const LICENCE_VIEWS = new Set([
  "admin-licences",
  "admin-licence-new",
  "admin-licence-detail",
  "admin-licence-expiring",
  "admin-licence-amendments",
  "admin-licence-renewals",
  "admin-licence-analytics",
  "buyer-licences",
  "buyer-licence",
  "licence-print",
]);
const can = (user, permission) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(permission);
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";
const Status = ({ value }) => (
  <span
    className={`lc-status lc-${String(value).toLowerCase().replaceAll(" ", "-").replaceAll("—", "-")}`}
  >
    {value || "Not issued"}
  </span>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="lc-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="lc-actions">{actions}</div>}
  </header>
);
const Notice = () => (
  <div className="lc-notice">
    <ShieldCheck />
    <span>
      <strong>Simulated licence workflow.</strong> Documents, approvals,
      signatures, delivery authorizations, and legal states shown here are
      prototype records—not certified legal instruments or production delivery
      permissions.
    </span>
  </div>
);
function selectLicence(id, navigate, target = "admin-licence-detail") {
  licenceService.select(id);
  navigate(target);
}

function Metrics({ analytics }) {
  return (
    <div className="lc-metrics">
      <article>
        <span>Total records</span>
        <strong>{analytics.total}</strong>
      </article>
      <article>
        <span>Active licences</span>
        <strong>{analytics.active}</strong>
      </article>
      <article>
        <span>Pending controls</span>
        <strong>{analytics.pending}</strong>
      </article>
      <article>
        <span>Expiring soon</span>
        <strong>{analytics.expiring}</strong>
      </article>
      <article>
        <span>Issued value</span>
        <strong>{formatPaymentMoney(analytics.value)}</strong>
      </article>
    </div>
  );
}

function AdminDashboard({ navigate }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const state = licenceService.getState();
  const licences = useMemo(
    () =>
      state.licences.filter(
        (licence) =>
          (status === "All" || licence.status === status) &&
          [
            licence.reference,
            licence.buyer,
            licence.organization,
            licence.project,
            licence.trackTitle,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [state, query, status],
  );
  return (
    <section className="lc-page">
      <Header
        eyebrow="Commercial operations"
        title="Licence generation"
        text="Generate, approve, issue, monitor, amend, renew, and control sync licences without collapsing them into quotes, contracts, payments, or delivery packages."
        actions={
          <button
            className="primary"
            onClick={() => navigate("admin-licence-new")}
          >
            <Plus /> Generate licence
          </button>
        }
      />
      <Notice />
      <Metrics analytics={licenceService.analytics()} />
      <div className="lc-quick">
        <button onClick={() => navigate("admin-licence-expiring")}>
          Expiring licences <ArrowRight />
        </button>
        <button onClick={() => navigate("admin-licence-amendments")}>
          Amendment queue <ArrowRight />
        </button>
        <button onClick={() => navigate("admin-licence-renewals")}>
          Renewal queue <ArrowRight />
        </button>
        <button onClick={() => navigate("admin-licence-analytics")}>
          Analytics <ArrowRight />
        </button>
      </div>
      <div className="lc-toolbar">
        <label>
          <Funnel />{" "}
          <input
            aria-label="Search licences"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference, buyer, project, track"
          />
        </label>
        <select
          aria-label="Filter licence status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All</option>
          {[...new Set(state.licences.map((item) => item.status))].map(
            (item) => (
              <option key={item}>{item}</option>
            ),
          )}
        </select>
      </div>
      <div className="lc-table-wrap">
        <table className="lc-table">
          <thead>
            <tr>
              <th>Licence</th>
              <th>Buyer / project</th>
              <th>Track</th>
              <th>Status</th>
              <th>Term</th>
              <th>Value</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {licences.map((licence) => (
              <tr key={licence.id}>
                <td>
                  <strong>{licence.reference || "Draft record"}</strong>
                  <span>{licence.contractReference}</span>
                </td>
                <td>
                  <strong>{licence.organization}</strong>
                  <span>{licence.project}</span>
                </td>
                <td>
                  <strong>{licence.trackTitle}</strong>
                  <span>{licence.artist}</span>
                </td>
                <td>
                  <Status value={licence.status} />
                </td>
                <td>
                  <strong>{date(licence.effectiveDate)}</strong>
                  <span>to {date(licence.expiryDate)}</span>
                </td>
                <td>{formatPaymentMoney(licence.fee)}</td>
                <td>
                  <button
                    className="text-action"
                    onClick={() => selectLicence(licence.id, navigate)}
                  >
                    Review <ArrowRight />
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

function Readiness({ result }) {
  return (
    <section className={`lc-readiness ${result.ready ? "ready" : "blocked"}`}>
      <div>
        <strong>{result.ready ? "Ready to generate" : result.status}</strong>
        <span>
          {result.ready
            ? "All source controls passed."
            : `${result.blockers.length} blocking requirement${result.blockers.length === 1 ? "" : "s"}.`}
        </span>
      </div>
      <ul>
        {result.checks.map((check) => (
          <li key={check.label}>
            {check.pass ? <CheckCircle /> : <XCircle />} {check.label}
          </li>
        ))}
      </ul>
      {result.blockers.length > 0 && <p>{result.blockers.join(" · ")}</p>}
    </section>
  );
}

function NewLicence({ navigate, showToast }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState("contract-26");
  const candidates = licenceService.getEligibleTransactions();
  const current =
    candidates.find((item) => item.contract.id === selected) || candidates[0];
  const create = () => {
    try {
      const draft = licenceService.createDraft(current.contract.id, user);
      showToast("Licence draft created from locked source versions.");
      selectLicence(draft.id, navigate);
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="lc-page">
      <Header
        eyebrow="Controlled generation"
        title="Create a licence record"
        text="Start only from an accepted quote, fully executed contract, approved rights, verified buyer access, and completed licensing payment."
        actions={
          <button
            className="outline"
            onClick={() => navigate("admin-licences")}
          >
            <ArrowLeft /> Dashboard
          </button>
        }
      />
      <Notice />
      <div className="lc-stepper">
        {[
          "Transaction",
          "Source versions",
          "Terms",
          "Assets",
          "Readiness",
          "Approvals",
          "Document",
          "Issue",
        ].map((step, index) => (
          <span className={index === 0 ? "active" : ""} key={step}>
            {index + 1}. {step}
          </span>
        ))}
      </div>
      <div className="lc-grid">
        <section className="lc-card">
          <h2>Eligible transactions</h2>
          <p className="muted">
            Select a contract to inspect current generation controls.
          </p>
          <div className="lc-choice-list">
            {candidates.map(({ contract, readiness, existing }) => (
              <button
                key={contract.id}
                className={selected === contract.id ? "selected" : ""}
                onClick={() => setSelected(contract.id)}
              >
                <span>
                  <strong>{contract.reference}</strong>
                  <small>
                    {contract.project} ·{" "}
                    {formatPaymentMoney(contract.fees?.licenceFee)}
                  </small>
                </span>
                <Status
                  value={existing.length ? "Existing record" : readiness.status}
                />
              </button>
            ))}
          </div>
        </section>
        {current && (
          <section className="lc-card">
            <h2>Source snapshot</h2>
            <dl className="lc-definition">
              <div>
                <dt>Quote</dt>
                <dd>{current.contract.quoteReference} · v1</dd>
              </div>
              <div>
                <dt>Contract</dt>
                <dd>
                  {current.contract.reference} · v
                  {current.contract.version || 1}
                </dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{current.contract.paymentStatus}</dd>
              </div>
              <div>
                <dt>Assets</dt>
                <dd>{current.contract.assets?.join(", ")}</dd>
              </div>
            </dl>
            <Readiness
              result={calculateLicenceGenerationReadiness(current.contract)}
            />
            <button
              className="primary full"
              disabled={!current.readiness.ready || current.existing.length > 0}
              onClick={create}
            >
              Create controlled draft <ArrowRight />
            </button>
          </section>
        )}
      </div>
    </section>
  );
}

function ApprovalPanel({ licence, user, showToast, refresh }) {
  const decide = (type) => {
    try {
      licenceService.decideApproval(
        licence.id,
        type,
        "Approved",
        "Reviewed against locked source versions.",
        user,
      );
      showToast(`${type} approval recorded.`);
      refresh();
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="lc-card">
      <h2>Required approvals</h2>
      <div className="lc-approvals">
        {licence.approvals.map((approval) => (
          <article key={approval.id}>
            <div>
              <strong>{approval.type}</strong>
              <Status value={approval.status} />
            </div>
            <span>{approval.approver || "Awaiting assigned reviewer"}</span>
            {approval.status !== "Approved" &&
              can(
                user,
                approval.type === "Rights"
                  ? "licences.approve_rights"
                  : approval.type === "Finance"
                    ? "licences.approve_finance"
                    : "licences.approve_licensing",
              ) && (
                <button
                  className="outline small"
                  onClick={() => decide(approval.type)}
                >
                  Approve
                </button>
              )}
          </article>
        ))}
      </div>
    </section>
  );
}

function LicenceDetail({ navigate, showToast, buyer = false }) {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const refresh = () => setTick((value) => value + 1);
  const id = licenceService.selected();
  const licence =
    licenceService.getLicence(id) ||
    (buyer
      ? licenceService.getBuyerLicences(user)[0]
      : licenceService.getState().licences[0]);
  if (
    !licence ||
    (buyer &&
      licence.buyerId !== user.id &&
      licence.organizationId !== user.organizationId)
  )
    return (
      <section className="lc-page">
        <Header
          eyebrow="Licensing workspace"
          title="Licence unavailable"
          text="This licence is not available to your organization."
        />
      </section>
    );
  const contract = licenceService
    .getEligibleTransactions()
    .find((item) => item.contract.id === licence.contractId)?.contract;
  const readiness = contract
    ? calculateLicenceGenerationReadiness(
        contract,
        licence.status === "Draft" ? licence : null,
      )
    : null;
  const delivery = calculateDeliveryAuthorizationReadiness(licence);
  const doAction = (fn, success) => {
    try {
      fn();
      showToast(success);
      refresh();
    } catch (error) {
      showToast(error.message);
    }
  };
  const requestAmendment = () =>
    doAction(
      () =>
        licenceService.requestAmendment(
          licence.id,
          {
            requestedChange: "Extend territory and add paid social",
            reason: "Campaign scope expansion",
            desiredEffectiveDate: "2026-09-01",
          },
          user,
        ),
      "Amendment request submitted; the current licence is unchanged.",
    );
  const requestRenewal = () =>
    doAction(
      () =>
        licenceService.requestRenewal(
          licence.id,
          "Continue the approved campaign beyond the current term",
          user,
        ),
      "Renewal request submitted for new eligibility and commercial review.",
    );
  const openDocument = () => {
    try {
      const generated = expiringAccessService.generateExpiringAccess(
        {
          resourceType: "Licence document",
          resourceLabel: `${licence.reference} licence document`,
          resourceId: licence.documentAssetId,
          relatedAssetId: licence.documentAssetId,
          relatedLicenceId: licence.id,
          action: "VIEW",
        },
        user,
        {
          action: "VIEW",
          userId: buyer ? user.id : null,
          organizationId: licence.organizationId,
          allowedMethods: ["VIEW", "DOWNLOAD"],
          maxUses: 5,
        },
      );
      window.location.hash = `access/${generated.token}`;
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className={`lc-page ${buyer ? "lc-buyer" : ""}`}>
      <Header
        eyebrow={buyer ? "My licensing workspace" : "Licence control record"}
        title={licence.reference || `${licence.project} draft`}
        text={`${licence.organization} · ${licence.trackTitle} by ${licence.artist}`}
        actions={
          <>
            <button
              className="outline"
              onClick={() =>
                navigate(buyer ? "buyer-licences" : "admin-licences")
              }
            >
              <ArrowLeft /> Back
            </button>
            {licence.documentAssetId && (
              <button className="outline" onClick={openDocument}>
                <Printer /> Open document
              </button>
            )}
          </>
        }
      />
      <Notice />
      <div className="lc-summary">
        <div>
          <span>Status</span>
          <Status value={licence.status} />
        </div>
        <div>
          <span>Effective</span>
          <strong>{date(licence.effectiveDate)}</strong>
        </div>
        <div>
          <span>Expires</span>
          <strong>{date(licence.expiryDate)}</strong>
        </div>
        <div>
          <span>Licence fee</span>
          <strong>{formatPaymentMoney(licence.fee)}</strong>
        </div>
        <div>
          <span>Delivery authorization</span>
          <strong>
            {licence.deliveryAuthorizationId ? delivery.status : "Not created"}
          </strong>
        </div>
      </div>
      {!buyer && readiness && <Readiness result={readiness} />}
      <div className="lc-grid">
        <section className="lc-card">
          <h2>Licensed scope</h2>
          <dl className="lc-definition">
            <div>
              <dt>Project</dt>
              <dd>{licence.project}</dd>
            </div>
            <div>
              <dt>Usage</dt>
              <dd>{licence.usage}</dd>
            </div>
            <div>
              <dt>Media</dt>
              <dd>{licence.media.join(", ")}</dd>
            </div>
            <div>
              <dt>Territory</dt>
              <dd>{licence.territory}</dd>
            </div>
            <div>
              <dt>Term</dt>
              <dd>{licence.term}</dd>
            </div>
            <div>
              <dt>Exclusivity</dt>
              <dd>{licence.exclusivity}</dd>
            </div>
            <div>
              <dt>Credit</dt>
              <dd className="pre">{licence.credits}</dd>
            </div>
          </dl>
        </section>
        <section className="lc-card">
          <h2>Rights, restrictions & assets</h2>
          <p className="lc-rights">
            <ShieldCheck /> {licence.rightsSnapshot?.verificationState} ·
            version {licence.rightsVersions?.join(", ")}
          </p>
          <h3>Restrictions</h3>
          <ul>
            {licence.restrictions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Approved asset types</h3>
          <div className="lc-tags">
            {licence.assetsApproved.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div
            className={`lc-delivery ${delivery.ready ? "ready" : "blocked"}`}
          >
            <strong>
              {licence.deliveryAuthorizationId
                ? "Separate delivery authorization"
                : "Delivery not authorized"}
            </strong>
            <span>
              {licence.deliveryAuthorizationId
                ? "An issued licence exists; delivery remains limited to its own asset types, limits, and expiry."
                : delivery.blockers.join(" · ")}
            </span>
          </div>
        </section>
      </div>
      {!buyer && (
        <ApprovalPanel
          licence={licence}
          user={user}
          showToast={showToast}
          refresh={refresh}
        />
      )}
      {!buyer && (
        <section className="lc-actions-bar">
          <div>
            <strong>Controlled actions</strong>
            <span>Each action is permission-checked and recorded.</span>
          </div>
          {licence.status === "Draft" && (
            <button
              className="outline"
              onClick={() =>
                doAction(
                  () => licenceService.requestApproval(licence.id, user),
                  "Licence submitted for approval.",
                )
              }
            >
              Request approvals
            </button>
          )}
          {["Ready to Generate", "Draft"].includes(licence.status) && (
            <button
              className="outline"
              disabled={licence.approvals.some(
                (item) => item.status !== "Approved",
              )}
              onClick={() =>
                doAction(
                  () => licenceService.generateDocument(licence.id, user),
                  "Versioned licence document generated.",
                )
              }
            >
              Generate document
            </button>
          )}
          {licence.status === "Generated" && (
            <button
              className="primary"
              onClick={() =>
                doAction(
                  () => licenceService.issue(licence.id, user),
                  "Licence issued and delivery policy evaluated.",
                )
              }
            >
              Issue licence
            </button>
          )}
          {["Active", "Amended", "Renewed"].includes(licence.status) &&
            can(user, "licences.manage_status") && (
              <button
                className="danger"
                onClick={() =>
                  doAction(
                    () =>
                      licenceService.changeLegalStatus(
                        licence.id,
                        "Suspended",
                        "Internal compliance review required",
                        user,
                      ),
                    "Licence suspended and delivery authorization revoked.",
                  )
                }
              >
                Suspend
              </button>
            )}
        </section>
      )}
      {buyer && (
        <section className="lc-actions-bar">
          <div>
            <strong>Need a change?</strong>
            <span>
              Requests do not alter this issued licence. New scope may require
              rights, quote, contract, and payment review.
            </span>
          </div>
          <button className="outline" onClick={requestAmendment}>
            Request amendment
          </button>
          <button className="outline" onClick={requestRenewal}>
            Request renewal
          </button>
        </section>
      )}
      {!buyer && licence.internalNotes?.length > 0 && (
        <section className="lc-card">
          <h2>Internal notes</h2>
          {licence.internalNotes.map((note, index) => (
            <p key={index}>{note}</p>
          ))}
        </section>
      )}
    </section>
  );
}

function BuyerDashboard({ navigate }) {
  const { user } = useAuth();
  const [status, setStatus] = useState("All");
  const licences = licenceService
    .getBuyerLicences(user)
    .filter((item) => status === "All" || item.status === status);
  return (
    <section className="lc-page lc-buyer">
      <Header
        eyebrow="Secure licensing workspace"
        title="My licences"
        text="Review issued scope, expiry, protected documents, and separate delivery authorization status for your organization."
      />
      <Notice />
      <div className="lc-toolbar">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter my licences"
        >
          <option>All</option>
          {[...new Set(licences.map((item) => item.status))].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="lc-buyer-list">
        {licences.map((licence) => (
          <article key={licence.id}>
            <div className="lc-buyer-card-head">
              <div>
                <span>{licence.reference || "Licence in preparation"}</span>
                <h2>{licence.project}</h2>
                <p>
                  {licence.trackTitle} · {licence.artist}
                </p>
              </div>
              <Status value={licence.status} />
            </div>
            <div className="lc-buyer-scope">
              <span>
                <small>Territory</small>
                {licence.territory}
              </span>
              <span>
                <small>Term</small>
                {date(licence.effectiveDate)} – {date(licence.expiryDate)}
              </span>
              <span>
                <small>Delivery</small>
                {licence.deliveryAuthorizationId
                  ? "Authorization on record"
                  : "Not authorized"}
              </span>
            </div>
            <button
              className="text-action"
              onClick={() =>
                selectLicence(licence.id, navigate, "buyer-licence")
              }
            >
              Open licence <ArrowRight />
            </button>
          </article>
        ))}
      </div>
      {!licences.length && (
        <div className="lc-empty">
          <Certificate />
          <h2>No licences in this workspace</h2>
          <p>Issued records for your organization will appear here.</p>
        </div>
      )}
    </section>
  );
}

function QueuePage({ navigate, type }) {
  const state = licenceService.getState();
  const config =
    type === "expiring"
      ? {
          eyebrow: "Lifecycle monitoring",
          title: "Expiring licences",
          items: state.licences.filter(
            (item) => item.status === "Expiring Soon",
          ),
          label: "Expiry",
        }
      : type === "amendments"
        ? {
            eyebrow: "Scope change control",
            title: "Amendment requests",
            items: state.amendmentRequests,
            label: "Requested",
          }
        : {
            eyebrow: "Term continuity",
            title: "Renewal requests",
            items: state.renewalRequests,
            label: "Requested",
          };
  return (
    <section className="lc-page">
      <Header
        eyebrow={config.eyebrow}
        title={config.title}
        text="Every change is evaluated against current rights, buyer eligibility, commercial terms, payment, and document versioning."
        actions={
          <button
            className="outline"
            onClick={() => navigate("admin-licences")}
          >
            <ArrowLeft /> Dashboard
          </button>
        }
      />
      <Notice />
      <div className="lc-queue">
        {config.items.map((item) => {
          const licence = item.trackTitle
            ? item
            : state.licences.find((record) => record.id === item.licenceId);
          return (
            <article key={item.id}>
              <div>
                <span>{licence?.reference}</span>
                <h2>{licence?.project}</h2>
                <p>
                  {item.requestedChange ||
                    item.reason ||
                    `${config.label}: ${date(licence?.expiryDate)}`}
                </p>
              </div>
              <Status value={item.status || licence?.status} />
            </article>
          );
        })}
      </div>
      {!config.items.length && (
        <div className="lc-empty">
          <Clock />
          <h2>No open items</h2>
          <p>This queue is currently clear.</p>
        </div>
      )}
    </section>
  );
}

function Analytics({ navigate }) {
  const data = licenceService.analytics();
  return (
    <section className="lc-page">
      <Header
        eyebrow="Commercial intelligence"
        title="Licence analytics"
        text="Operational prototype metrics across generation, issuance, lifecycle, and issued commercial value."
        actions={
          <button
            className="outline"
            onClick={() => navigate("admin-licences")}
          >
            <ArrowLeft /> Dashboard
          </button>
        }
      />
      <Notice />
      <Metrics analytics={data} />
      <div className="lc-chart">
        <h2>Lifecycle distribution</h2>
        {[
          ["Active", data.active],
          ["Pending controls", data.pending],
          ["Expiring", data.expiring],
          ["Inactive", data.inactive],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <div>
              <i
                style={{
                  width: `${Math.max(4, (value / Math.max(1, data.total)) * 100)}%`,
                }}
              />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function PrintLicence({ navigate }) {
  const licence = licenceService.getLicence(licenceService.selected());
  if (!licence) return null;
  return (
    <section className="lc-print-shell">
      <div className="lc-print-actions">
        <button className="outline" onClick={() => navigate("buyer-licence")}>
          <ArrowLeft /> Back
        </button>
        <button className="primary" onClick={() => window.print()}>
          <Printer /> Print
        </button>
      </div>
      <article className="lc-document">
        <header>
          <strong>beatmondo</strong>
          <span>SYNC & MASTER-USE LICENCE</span>
        </header>
        <div className="lc-document-title">
          <span>{licence.reference}</span>
          <h1>Music Licence</h1>
          <p>
            Version {licence.version} · issued {date(licence.issuedAt)}
          </p>
        </div>
        <section>
          <h2>Parties and project</h2>
          <p>
            This licence records the approved synchronization and master-use
            scope between beatmondo’s represented rights workflow and{" "}
            <strong>{licence.organization}</strong> for{" "}
            <strong>{licence.project}</strong>.
          </p>
        </section>
        <section>
          <h2>Licensed recording</h2>
          <dl>
            <div>
              <dt>Track</dt>
              <dd>{licence.trackTitle}</dd>
            </div>
            <div>
              <dt>Artist</dt>
              <dd>{licence.artist}</dd>
            </div>
            <div>
              <dt>Approved use</dt>
              <dd>{licence.usage}</dd>
            </div>
          </dl>
        </section>
        <section>
          <h2>Commercial scope</h2>
          <dl>
            <div>
              <dt>Media</dt>
              <dd>{licence.media.join(", ")}</dd>
            </div>
            <div>
              <dt>Territory</dt>
              <dd>{licence.territory}</dd>
            </div>
            <div>
              <dt>Term</dt>
              <dd>
                {date(licence.effectiveDate)} to {date(licence.expiryDate)}
              </dd>
            </div>
            <div>
              <dt>Exclusivity</dt>
              <dd>{licence.exclusivity}</dd>
            </div>
            <div>
              <dt>Fee</dt>
              <dd>{formatPaymentMoney(licence.fee)}</dd>
            </div>
          </dl>
        </section>
        <section>
          <h2>Restrictions</h2>
          <ol>
            {licence.restrictions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <section>
          <h2>Credit</h2>
          <p className="pre">{licence.credits}</p>
        </section>
        <footer>
          <p>
            Prototype commercial document · source contract{" "}
            {licence.contractReference} v{licence.contractVersion} · rights
            version {licence.rightsVersions.join(", ")}
          </p>
          <p>
            Delivery of protected master audio is controlled by a separate
            delivery authorization and secure package.
          </p>
        </footer>
      </article>
    </section>
  );
}

export function renderLicenceView(view, props) {
  if (view === "admin-licences") return <AdminDashboard {...props} />;
  if (view === "admin-licence-new") return <NewLicence {...props} />;
  if (view === "admin-licence-detail") return <LicenceDetail {...props} />;
  if (view === "buyer-licences") return <BuyerDashboard {...props} />;
  if (view === "buyer-licence") return <LicenceDetail {...props} buyer />;
  if (view === "admin-licence-expiring")
    return <QueuePage {...props} type="expiring" />;
  if (view === "admin-licence-amendments")
    return <QueuePage {...props} type="amendments" />;
  if (view === "admin-licence-renewals")
    return <QueuePage {...props} type="renewals" />;
  if (view === "admin-licence-analytics") return <Analytics {...props} />;
  if (view === "licence-print") return <PrintLicence {...props} />;
  return null;
}
