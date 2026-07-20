import { Fragment, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Certificate,
  CheckCircle,
  Clock,
  FileText,
  Funnel,
  NotePencil,
  PaperPlaneTilt,
  PenNib,
  Plus,
  Printer,
  ShieldCheck,
  Signature,
  TrendUp,
  UsersThree,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  CONTRACT_STATUSES,
  SELECTED_CONTRACT_KEY,
  SIGNATURE_CODE,
} from "./contractData.js";
import {
  calculateContractCompleteness,
  contractService,
} from "./contractService.js";
import { formatQuoteMoney } from "../quotes/quoteService.js";
import { expiringAccessService } from "../expiring-access/expiringAccessService.js";
import {
  calculateLicencePaymentReadiness,
  formatPaymentMoney,
  paymentService,
} from "../payments/paymentService.js";
import { licenceService } from "../licences/licenceService.js";
import { SectionSubnav } from "../ui/SectionSubnav.jsx";
import "./contracts.css";

export const CONTRACT_VIEWS = new Set([
  "admin-contracts",
  "admin-contract-new",
  "admin-contract-detail",
  "admin-contract-templates",
  "admin-contract-clauses",
  "admin-contract-analytics",
  "buyer-contracts",
  "buyer-contract",
  "signature",
  "signature-complete",
  "signature-declined",
  "signature-expired",
  "contract-print",
]);
const can = (u, p) =>
  u?.permissions?.includes("*") || u?.permissions?.includes(p);

function ContractsAdminNav({ navigate, active, user }) {
  const items = [
    { view: "admin-contracts", label: "Contracts" },
    can(user, "contracts.create") && {
      view: "admin-contract-new",
      label: "Generate",
    },
    can(user, "contracts.manage_templates") && {
      view: "admin-contract-templates",
      label: "Templates",
    },
    can(user, "contracts.manage_clauses") && {
      view: "admin-contract-clauses",
      label: "Clauses",
    },
    { view: "admin-contract-analytics", label: "Analytics" },
  ].filter(Boolean);
  return (
    <SectionSubnav
      ariaLabel="Contracts and e-signature sections"
      navigate={navigate}
      active={active}
      items={items}
      backTo={
        active !== "admin-contracts"
          ? { view: "admin-contracts", label: "Back to contract dashboard" }
          : null
      }
    />
  );
}
const date = (v) =>
  v
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
        new Date(v),
      )
    : "—";
const Status = ({ value }) => (
  <span
    className={`ct-status ct-${String(value).toLowerCase().replaceAll(" ", "-")}`}
  >
    {value}
  </span>
);
const Notice = () => (
  <div className="ct-notice">
    <WarningCircle />
    <span>
      <strong>Simulated contract and e-signature workflow.</strong> This
      prototype does not provide legal advice, legally certified signatures,
      identity verification, binding documents, or an e-signature-provider
      certificate.
    </span>
  </div>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="ct-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="ct-actions">{actions}</div>}
  </header>
);
function selectContract(id, navigate, target = "admin-contract-detail") {
  localStorage.setItem(SELECTED_CONTRACT_KEY, id);
  navigate(target);
}

function AdminDashboard({ navigate }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const contracts = contractService.getContracts(user);
  const a = contractService.analytics();
  const list = contracts.filter(
    (c) =>
      (status === "All" || c.status === status) &&
      `${c.reference} ${c.quoteReference} ${c.buyer} ${c.organization} ${c.project} ${c.trackTitle}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="ct-page">
      <ContractsAdminNav
        navigate={navigate}
        active="admin-contracts"
        user={user}
      />
      <Header
        eyebrow="Commercial agreements"
        title="Contracts & E-Signature"
        text="Generate, review, approve, negotiate, sign, and track music-licensing agreements without conflating contracts, payment, licences, or delivery."
        actions={
          <button
            className="ct-primary"
            onClick={() => navigate("admin-contract-new")}
            disabled={!can(user, "contracts.create")}
          >
            <Plus /> Generate contract
          </button>
        }
      />
      <Notice />
      <div className="ct-metrics">
        <article>
          <span>Contracted value</span>
          <strong>{formatQuoteMoney(a.contractedValue)}</strong>
          <small>{a.total} contract records</small>
        </article>
        <article>
          <span>Awaiting buyer</span>
          <strong>{a.awaitingBuyer}</strong>
          <small>{a.awaitingBeatmondo} awaiting beatmondo</small>
        </article>
        <article>
          <span>Signature completion</span>
          <strong>{a.completionRate}%</strong>
          <small>{a.partiallySigned} partially signed</small>
        </article>
        <article>
          <span>Effective value</span>
          <strong>{formatQuoteMoney(a.effectiveValue)}</strong>
          <small>{a.effective} effective agreement</small>
        </article>
      </div>
      <section className="ct-panel">
        <div className="ct-toolbar">
          <label>
            Search contracts
            <input
              placeholder="Reference, quote, buyer, project, track…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              {Object.keys(CONTRACT_STATUSES).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ct-table">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Buyer / project</th>
                <th>Track</th>
                <th>Type</th>
                <th>Value</th>
                <th>Status</th>
                <th>Signers</th>
                <th>Deadline</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.reference}</strong>
                    <small>
                      {c.quoteReference} · v{c.version}
                    </small>
                  </td>
                  <td>
                    <strong>{c.organization}</strong>
                    <small>
                      {c.buyer} · {c.project}
                    </small>
                  </td>
                  <td>
                    <strong>{c.trackTitle}</strong>
                    <small>{c.artist}</small>
                  </td>
                  <td>{c.contractType}</td>
                  <td>
                    {formatQuoteMoney(c.fees.licenceFee, c.fees.currency)}
                  </td>
                  <td>
                    <Status value={c.status} />
                  </td>
                  <td>
                    {c.signers.filter((s) => s.status === "Signed").length}/
                    {c.signers.filter((s) => s.required).length}
                    <small>{c.signingOrder}</small>
                  </td>
                  <td>{date(c.signatureDeadline)}</td>
                  <td>
                    <button
                      aria-label={`Open ${c.reference}`}
                      onClick={() => selectContract(c.id, navigate)}
                    >
                      Open <ArrowRight />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && (
            <p className="ct-empty">No contracts match these filters.</p>
          )}
        </div>
      </section>
    </section>
  );
}

function GenerationWizard({ navigate, showToast }) {
  const { user } = useAuth();
  const quotes = contractService.eligibleQuotes();
  const templates = contractService.getTemplates();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    quoteId: quotes[0]?.id || "",
    contractType: "Combined Master and Publishing Agreement",
    templateId: "template-standard",
    signingOrder: "Buyer first",
    manualReason: "",
  });
  const quote = quotes.find((q) => q.id === form.quoteId);
  const template = templates.find((t) => t.id === form.templateId);
  const validation = contractService.validateQuote(quote);
  const generate = () => {
    const r = contractService.createFromQuote(form.quoteId, form, user);
    showToast(r.message || "Contract draft generated from the accepted quote.");
    if (r.ok) selectContract(r.contract.id, navigate);
  };
  const steps = [
    "Accepted Quote",
    "Contract Type",
    "Template",
    "Parties",
    "Usage",
    "Commercial Terms",
    "Restrictions & Assets",
    "Credits & Schedules",
    "Signers",
    "Generate Draft",
  ];
  return (
    <section className="ct-page">
      <button className="ct-back" onClick={() => navigate("admin-contracts")}>
        <ArrowLeft /> Contract dashboard
      </button>
      <Header
        eyebrow="Accepted quote conversion"
        title="Generate Contract"
        text="Create an exact, version-linked agreement draft. Quote acceptance is not a signature or effective licence."
      />
      <Notice />
      <ol className="ct-steps">
        {steps.map((s, i) => (
          <li
            className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""}
            key={s}
          >
            <button onClick={() => setStep(i + 1)}>
              <span>{i + 1}</span>
              {s}
            </button>
          </li>
        ))}
      </ol>
      <section className="ct-panel ct-wizard">
        {step === 1 && (
          <>
            <h2>Select accepted quote</h2>
            {quotes.length ? (
              quotes.map((q) => (
                <label className="ct-choice" key={q.id}>
                  <input
                    type="radio"
                    name="quote"
                    checked={form.quoteId === q.id}
                    onChange={() => setForm((x) => ({ ...x, quoteId: q.id }))}
                  />
                  <span>
                    <strong>
                      {q.reference} · {q.project}
                    </strong>
                    <small>
                      {q.organization} · {q.trackTitle} ·{" "}
                      {formatQuoteMoney(q.total)} · accepted{" "}
                      {date(q.acceptedAt)}
                    </small>
                  </span>
                </label>
              ))
            ) : (
              <div className="ct-warning">
                <WarningCircle /> No accepted quote is currently available
                without an active contract.
              </div>
            )}
            <dl className="ct-dl">
              <dt>Eligibility</dt>
              <dd>{validation.ok ? "Eligible" : "Blocked"}</dd>
              <dt>Rights version</dt>
              <dd>v{quote?.rightsSummary?.rightsVersion || "—"}</dd>
              <dt>Payment terms</dt>
              <dd>{quote?.terms?.paymentTerms || "—"}</dd>
            </dl>
          </>
        )}
        {step === 2 && (
          <>
            <h2>Contract type</h2>
            <div className="ct-card-grid">
              {[
                "Combined Master and Publishing Agreement",
                "Standard synchronization licence agreement",
                "Master-use licence agreement",
                "Publishing synchronization agreement",
                "Conditional Licence Agreement",
                "Amendment Agreement",
                "Renewal Agreement",
                "Enterprise or Framework Agreement",
                "Non-disclosure agreement",
              ].map((type) => (
                <button
                  className={form.contractType === type ? "selected" : ""}
                  onClick={() => setForm((x) => ({ ...x, contractType: type }))}
                  key={type}
                >
                  <FileText />
                  <strong>{type}</strong>
                  <small>
                    {type.includes("Combined")
                      ? "Recommended when approved master and publishing rights share one agreement."
                      : "Alternative selection requires scope review."}
                  </small>
                </button>
              ))}
            </div>
            <label>
              Manual-selection reason
              <input
                value={form.manualReason}
                onChange={(e) =>
                  setForm((x) => ({ ...x, manualReason: e.target.value }))
                }
                placeholder="Required when choosing a non-recommended type"
              />
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <h2>Select template</h2>
            <div className="ct-card-grid">
              {templates.map((t) => (
                <button
                  className={form.templateId === t.id ? "selected" : ""}
                  onClick={() => setForm((x) => ({ ...x, templateId: t.id }))}
                  key={t.id}
                >
                  <ShieldCheck />
                  <strong>{t.name}</strong>
                  <small>
                    v{t.version} · {t.requiredApprovals.join(", ")}
                  </small>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h2>Confirm parties</h2>
            <div className="ct-two">
              <div>
                <h3>Licensor</h3>
                <p>
                  <strong>Beatmondo Licensing Ltd</strong>{" "}
                  <small>Prototype legal-name placeholder</small>
                </p>
                <p>Authorized signatory: Preston Repenning</p>
                <small>
                  Buyer-facing users cannot alter licensor information.
                </small>
              </div>
              <div>
                <h3>Licensee</h3>
                <p>
                  <strong>{quote?.organization}</strong>
                </p>
                <p>Authorized signatory: {quote?.buyer}</p>
                <p>
                  Address and billing contact prefilled from the approved
                  organization profile.
                </p>
              </div>
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h2>Confirm usage</h2>
            <dl className="ct-dl">
              <dt>Project</dt>
              <dd>{quote?.project}</dd>
              <dt>Track</dt>
              <dd>
                {quote?.trackTitle} — {quote?.artist}
              </dd>
              <dt>Media</dt>
              <dd>{quote?.terms.media.join(", ")}</dd>
              <dt>Territory</dt>
              <dd>{quote?.terms.territory}</dd>
              <dt>Term</dt>
              <dd>{quote?.terms.term}</dd>
              <dt>Exclusivity</dt>
              <dd>{quote?.terms.exclusivity}</dd>
            </dl>
            <div className="ct-warning">
              <WarningCircle /> Material usage changes require a quote revision
              or amendment workflow.
            </div>
          </>
        )}
        {step === 6 && (
          <>
            <h2>Commercial terms</h2>
            <dl className="ct-dl">
              <dt>Accepted fee</dt>
              <dd>{formatQuoteMoney(quote?.total || 0, quote?.currency)}</dd>
              <dt>Deposit</dt>
              <dd>
                {formatQuoteMoney(
                  Math.round((quote?.total || 0) * 0.25),
                  quote?.currency,
                )}
              </dd>
              <dt>Balance</dt>
              <dd>
                {formatQuoteMoney(
                  Math.round((quote?.total || 0) * 0.75),
                  quote?.currency,
                )}
              </dd>
              <dt>Payment timing</dt>
              <dd>{quote?.terms.paymentTerms || "Due before delivery"}</dd>
              <dt>Tax</dt>
              <dd>Not calculated in this prototype</dd>
            </dl>
          </>
        )}
        {step === 7 && (
          <>
            <h2>Restrictions and delivery assets</h2>
            {[...(quote?.conditions || []), ...(quote?.exclusions || [])].map(
              (x) => (
                <p className="ct-condition" key={x}>
                  <WarningCircle /> {x}
                </p>
              ),
            )}
            <h3>Approved assets</h3>
            <p>
              {quote?.terms.assets?.join(", ") ||
                "No deliverable assets confirmed"}
            </p>
            <small>
              Contract completion never grants delivery access by itself.
            </small>
          </>
        )}
        {step === 8 && (
          <>
            <h2>Credits and schedules</h2>
            <blockquote>
              “{quote?.trackTitle}” performed by {quote?.artist}
              <br />
              Licensed courtesy of beatmondo
            </blockquote>
            <div className="ct-card-grid">
              <article>
                <strong>Track and Usage Schedule</strong>
                <small>Project, track, media, territory, term</small>
              </article>
              <article>
                <strong>Approved Assets</strong>
                <small>{quote?.terms.assets?.join(", ")}</small>
              </article>
              <article>
                <strong>Restrictions Schedule</strong>
                <small>Rights and quote restrictions preserved</small>
              </article>
            </div>
          </>
        )}
        {step === 9 && (
          <>
            <h2>Configure signers</h2>
            <div className="ct-signer">
              <span>1</span>
              <div>
                <strong>{quote?.buyer}</strong>
                <small>Buyer signatory · {quote?.organization}</small>
              </div>
              <Status value="Not Invited" />
            </div>
            <div className="ct-signer">
              <span>2</span>
              <div>
                <strong>Preston Repenning</strong>
                <small>Beatmondo senior signatory</small>
              </div>
              <Status value="Not Invited" />
            </div>
            <label>
              Signing order
              <select
                value={form.signingOrder}
                onChange={(e) =>
                  setForm((x) => ({ ...x, signingOrder: e.target.value }))
                }
              >
                <option>Buyer first</option>
                <option>Beatmondo first</option>
                <option>Parallel</option>
                <option>Rights owner before Beatmondo</option>
              </select>
            </label>
          </>
        )}
        {step === 10 && (
          <>
            <h2>Generate linked draft</h2>
            <dl className="ct-dl">
              <dt>Quote</dt>
              <dd>
                {quote?.reference} v{quote?.version}
              </dd>
              <dt>Rights snapshot</dt>
              <dd>v{quote?.rightsSummary?.rightsVersion}</dd>
              <dt>Template</dt>
              <dd>
                {template?.name} v{template?.version}
              </dd>
              <dt>Contract type</dt>
              <dd>{form.contractType}</dd>
              <dt>Fee</dt>
              <dd>{formatQuoteMoney(quote?.total || 0)}</dd>
            </dl>
            {!validation.ok && (
              <div className="ct-error" role="alert">
                {validation.message}
              </div>
            )}
            <button
              className="ct-primary ct-large"
              disabled={!validation.ok || !quote || !template}
              onClick={generate}
            >
              <FileText /> Generate contract draft
            </button>
          </>
        )}
      </section>
      <div className="ct-wizard-nav">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Back
        </button>
        <span>
          Step {step} of {steps.length}
        </span>
        <button
          onClick={() => setStep(Math.min(steps.length, step + 1))}
          disabled={step === steps.length}
        >
          Continue
        </button>
      </div>
    </section>
  );
}

function DocumentViewer({ contract, buyer = false }) {
  const [query, setQuery] = useState("");
  const rendered = contractService.render(contract);
  const sections = rendered.ok
    ? rendered.document.sections.filter(
        (s) =>
          !query ||
          `${s.title} ${s.body}`.toLowerCase().includes(query.toLowerCase()),
      )
    : [];
  return (
    <div className="ct-document-layout">
      <nav className="ct-toc" aria-label="Contract table of contents">
        <strong>Contents</strong>
        <label>
          Search document
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clauses…"
          />
        </label>
        {sections.map((s) => (
          <a href={`#contract-section-${s.id}`} key={s.id}>
            {s.number}. {s.title}
          </a>
        ))}
      </nav>
      <article className="ct-document">
        <header>
          <span>beatmondo</span>
          <small>
            {contract.reference} · version {contract.version}
          </small>
        </header>
        <h1>{rendered.document?.title || contract.title}</h1>
        <p className="ct-document-lead">
          Music licensing agreement · Prototype document
        </p>
        {sections.map((s) => (
          <section id={`contract-section-${s.id}`} key={s.id} tabIndex="-1">
            <h2>
              {s.number}. {s.title}
            </h2>
            <p>{s.body}</p>
            {s.unresolved.length > 0 && (
              <div className="ct-error">
                Unresolved: {s.unresolved.join(", ")}
              </div>
            )}
            {!buyer && (
              <small>
                Clause {s.id} · v{s.version}
              </small>
            )}
          </section>
        ))}
        <section>
          <h2>Schedules</h2>
          {contract.schedules.map((schedule, i) => (
            <div key={schedule.id}>
              <h3>
                {String.fromCharCode(65 + i)}. {schedule.title}
              </h3>
              <ul>
                {schedule.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <footer>
          Generated by the beatmondo prototype. This document is not legal
          advice and has not been certified by an e-signature provider.
        </footer>
      </article>
    </div>
  );
}

function ApprovalPanel({ contract, user, act }) {
  return (
    <section className="ct-panel">
      <span>Version-controlled review</span>
      <h2>Internal & rights-holder approvals</h2>
      {contract.approvals.length ? (
        contract.approvals.map((a) => (
          <article className="ct-approval" key={a.id}>
            <div>
              <strong>
                {a.type === "Rights" ? "Rights-holder approval" : a.type}
              </strong>
              <small>
                {a.approver}
                {a.date && ` · ${date(a.date)}`}
              </small>
              <p>{a.note}</p>
            </div>
            <Status value={a.status} />
            {a.status === "Pending" && (
              <div className="ct-actions">
                <button
                  onClick={() =>
                    act(
                      () =>
                        contractService.decideApproval(
                          contract.id,
                          a.type,
                          "Approved",
                          "Approved in simulated review.",
                          user,
                        ),
                      `${a.type} approved.`,
                    )
                  }
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    act(
                      () =>
                        contractService.decideApproval(
                          contract.id,
                          a.type,
                          "Rejected",
                          "Revision required.",
                          user,
                        ),
                      `${a.type} rejected.`,
                    )
                  }
                >
                  Reject
                </button>
              </div>
            )}
          </article>
        ))
      ) : (
        <p>No approval chain configured.</p>
      )}
    </section>
  );
}

function ContractControlStrip({ contract }) {
  const linkedLicence = licenceService
    .getState()
    .licences.find((item) => item.contractId === contract.id);
  const approvalsComplete = contract.approvals.every(
    (item) => item.status === "Approved",
  );
  const signaturesComplete = contract.signers.length > 0 && contract.signers
    .filter((item) => item.required)
    .every((item) => item.status === "Signed");
  const steps = [
    ["01", "Source", contract.quoteReference, true],
    ["02", "Approvals", approvalsComplete ? "Internal + rights-holder complete" : "Internal + rights-holder review", approvalsComplete],
    ["03", "Signatures", `${contract.signingOrder} · ${contract.signers.filter((item) => item.status === "Signed").length}/${contract.signers.filter((item) => item.required).length}`, signaturesComplete],
    ["04", "Final document", contract.finalLockedVersion ? `Locked v${contract.finalLockedVersion}` : "Locks after execution", Boolean(contract.finalLockedVersion)],
    ["05", "Licence", linkedLicence?.reference || linkedLicence?.status || contract.licenceGeneration, Boolean(linkedLicence?.reference)],
  ];
  return (
    <section className="ct-control-strip" aria-label="Contract control path">
      <header>
        <div>
          <span>Contract controls</span>
          <strong>Every commercial stage remains separately gated</strong>
        </div>
        <Status value={contract.status} />
      </header>
      <ol>
        {steps.map(([number, label, detail, complete]) => (
          <li className={complete ? "complete" : ""} key={label}>
            <span>{number}</span>
            <div>
              <strong>{label}</strong>
              <small>{detail}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function VersionComparison({ contract, buyer = false }) {
  const snapshots = contractService
    .getState()
    .contractVersions.filter((item) => item.id === contract.id)
    .sort((a, b) => a.version - b.version);
  const defaultVersion = snapshots.at(-1)?.version || contract.version;
  const [baseline, setBaseline] = useState(defaultVersion);
  const previous = snapshots.find((item) => item.version === Number(baseline));
  const changes = (contract.clauses || [])
    .map((current) => {
      const prior = previous?.clauses?.find((item) => item.id === current.id);
      const changed =
        !prior ||
        prior.clauseVersion !== current.clauseVersion ||
        (prior.resolvedBody || prior.body) !==
          (current.resolvedBody || current.body);
      return { current, prior, changed };
    })
    .filter((item) => item.changed);

  return (
    <section className="ct-panel ct-version-compare">
      <div className="ct-section-heading">
        <div>
          <span>Document intelligence</span>
          <h2>Compare contract versions</h2>
        </div>
        <label>
          Baseline
          <select
            value={baseline}
            onChange={(event) => setBaseline(event.target.value)}
          >
            {snapshots.map((item) => (
              <option value={item.version} key={item.snapshotId}>
                Version {item.version}
              </option>
            ))}
            {!snapshots.length && <option value={contract.version}>Version {contract.version}</option>}
          </select>
        </label>
      </div>
      <div className="ct-version-summary">
        <strong>v{baseline}</strong>
        <ArrowRight />
        <strong>v{contract.version} current</strong>
        <Status value={`${changes.length} clause change${changes.length === 1 ? "" : "s"}`} />
      </div>
      {previous?.snapshotReason && <p className="ct-muted">{previous.snapshotReason}</p>}
      {changes.length ? (
        <div className="ct-diff-list">
          {changes.map(({ current, prior }) => (
            <article key={current.id}>
              <div>
                <strong>{current.title}</strong>
                <small>
                  Clause v{prior?.clauseVersion || "—"} → v{current.clauseVersion}
                </small>
              </div>
              {buyer ? (
                <p>Approved wording updated in the current review version.</p>
              ) : (
                <div className="ct-diff-copy">
                  <p><span>Previous</span>{prior?.resolvedBody || prior?.body || "Clause added"}</p>
                  <p><span>Current</span>{current.resolvedBody || current.body}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="ct-empty-note">No clause wording changed between these versions.</p>
      )}
      <small>
        {buyer
          ? "Only buyer-visible clause history is shown. Internal legal notes remain restricted."
          : "Clause versions, change reasons and approval evidence remain attached to the contract record."}
      </small>
    </section>
  );
}

function AuditHistory({ contract, buyer = false }) {
  const entries = contractService
    .getState()
    .activity.filter(
      (item) =>
        item.contractId === contract.id &&
        (!buyer || ["Buyer Visible", "All Signers"].includes(item.visibility)),
    )
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return (
    <section className="ct-panel ct-audit-history">
      <div className="ct-section-heading">
        <div>
          <span>{contract.auditReference}</span>
          <h2>Full audit history</h2>
        </div>
        <Status value={`${entries.length} events`} />
      </div>
      <ol>
        {entries.map((item) => (
          <li key={item.id}>
            <span aria-hidden="true" />
            <div>
              <header>
                <strong>{item.action}</strong>
                <time>{date(item.timestamp)}</time>
              </header>
              <p>{item.description}</p>
              <small>{item.actor} · v{item.version || contract.version} · {item.visibility}</small>
            </div>
          </li>
        ))}
      </ol>
      {!entries.length && <p>No recorded events are visible in this scope.</p>}
      <small>Append-only browser simulation; not certified as tamper-proof evidence.</small>
    </section>
  );
}

function DocumentGovernance({ contract, navigate, buyer = false, onDownload }) {
  const licence = licenceService
    .getState()
    .licences.find((item) => item.contractId === contract.id);
  return (
    <section className="ct-panel ct-governance">
      <span>Document governance</span>
      <h2>Final version & linkage</h2>
      <dl>
        <div><dt>Document expiry</dt><dd>{date(contract.documentExpiry)}</dd></div>
        <div><dt>Final locked version</dt><dd>{contract.finalLockedVersion ? `v${contract.finalLockedVersion}` : "Pending execution"}</dd></div>
        <div><dt>Signature status</dt><dd>{contract.signers.filter((item) => item.status === "Signed").length}/{contract.signers.filter((item) => item.required).length} recorded</dd></div>
        <div><dt>Licence linkage</dt><dd>{licence?.reference || licence?.status || "Not created"}</dd></div>
      </dl>
      {licence && (
        <p className="ct-linkage-note">
          <ShieldCheck /> {licence.status}. Contract v{licence.contractVersion} is preserved as the source snapshot; issuance remains a separate workflow.
        </p>
      )}
      {contract.signedDocumentAssetId && (
        <button className="ct-full" onClick={onDownload || (() => navigate("contract-print"))}>
          <FileText /> Download signed PDF
        </button>
      )}
      <small>Controlled prototype artifact; not a certified e-signature-provider result.</small>
    </section>
  );
}

function AdminDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const [rev, setRev] = useState(0);
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState("Internal Only");
  const [reason, setReason] = useState("");
  const id = localStorage.getItem(SELECTED_CONTRACT_KEY) || "contract-21";
  const contract = useMemo(() => contractService.getContract(id), [id, rev]);
  if (!contract)
    return (
      <section className="ct-page">
        <div className="ct-panel">Contract not found.</div>
      </section>
    );
  const complete = calculateContractCompleteness(contract);
  const paymentInvoices = paymentService
    .getState()
    .invoices.filter((invoice) => invoice.contractId === contract.id);
  const paymentReadiness = calculateLicencePaymentReadiness(contract);
  const act = (fn, success) => {
    const r = fn();
    showToast(r.message || success);
    setRev((x) => x + 1);
  };
  const signerDone = contract.signers.filter(
    (s) => s.status === "Signed",
  ).length;
  return (
    <section className="ct-page">
      <button className="ct-back" onClick={() => navigate("admin-contracts")}>
        <ArrowLeft /> Contract dashboard
      </button>
      <Header
        eyebrow={`${contract.reference} · version ${contract.version}`}
        title={contract.title}
        text={`${contract.organization} · ${contract.trackTitle} · linked to ${contract.quoteReference}`}
        actions={
          <>
            <button onClick={() => navigate("contract-print")}>
              <Printer /> Print
            </button>
            {contract.status === "Draft" && (
              <button
                onClick={() =>
                  act(
                    () => contractService.requestReview(contract.id, user),
                    "Review requested.",
                  )
                }
                disabled={!can(user, "contracts.request_review")}
              >
                <ShieldCheck /> Request review
              </button>
            )}
            {contract.approvals.every((a) => a.status === "Approved") &&
              !["Awaiting Buyer Signature", "Effective"].includes(
                contract.status,
              ) && (
                <button
                  className="ct-primary"
                  onClick={() =>
                    act(
                      () =>
                        contractService.sendSignatureRequest(contract.id, user),
                      "Signature request created.",
                    )
                  }
                  disabled={!can(user, "contracts.send")}
                >
                  <PaperPlaneTilt /> Send for signature
                </button>
              )}
            {["Fully Signed", "Awaiting Beatmondo Signature"].includes(
              contract.status,
            ) && (
              <button
                className="ct-primary"
                onClick={() =>
                  act(
                    () => contractService.countersign(contract.id, user),
                    "Countersignature recorded.",
                  )
                }
              >
                <PenNib /> Countersign
              </button>
            )}
          </>
        }
      />
      <Notice />
      <ContractControlStrip contract={contract} />
      <div className="ct-detail-grid">
        <main>
          <section className="ct-panel">
            <div className="ct-title-row">
              <div>
                <Status value={contract.status} />
                <Status value={`${complete.percentage}% complete`} />
              </div>
              <strong>
                {formatQuoteMoney(
                  contract.fees.licenceFee,
                  contract.fees.currency,
                )}
              </strong>
            </div>
            <div className="ct-summary-grid">
              <div>
                <span>Licensee</span>
                <strong>{contract.licensee.legalName}</strong>
                <small>{contract.licensee.authorizedSignatory}</small>
              </div>
              <div>
                <span>Usage</span>
                <strong>{contract.media.join(", ")}</strong>
                <small>
                  {contract.territory} · {contract.term}
                </small>
              </div>
              <div>
                <span>Rights snapshot</span>
                <strong>v{contract.rightsVersions.join(", v")}</strong>
                <small>{contract.restrictions.length} restrictions</small>
              </div>
              <div>
                <span>Signatures</span>
                <strong>
                  {signerDone}/
                  {contract.signers.filter((s) => s.required).length}
                </strong>
                <small>{contract.signingOrder}</small>
              </div>
            </div>
            {complete.blockers.map((b) => (
              <p className="ct-error" key={b}>
                <WarningCircle /> Missing: {b}
              </p>
            ))}
          </section>
          <section className="ct-panel">
            <h2>Contract terms</h2>
            <dl className="ct-dl">
              <dt>Contract type</dt>
              <dd>{contract.contractType}</dd>
              <dt>Project</dt>
              <dd>{contract.project}</dd>
              <dt>Track</dt>
              <dd>
                {contract.trackTitle} — {contract.artist}
              </dd>
              <dt>Media</dt>
              <dd>{contract.media.join(", ")}</dd>
              <dt>Territory</dt>
              <dd>{contract.territory}</dd>
              <dt>Term</dt>
              <dd>{contract.term}</dd>
              <dt>Exclusivity</dt>
              <dd>{contract.exclusivity}</dd>
              <dt>Payment</dt>
              <dd>{contract.paymentTerms}</dd>
              <dt>Assets</dt>
              <dd>{contract.assets.join(", ")}</dd>
              <dt>Credit</dt>
              <dd>{contract.credits}</dd>
            </dl>
            <h3>Restrictions</h3>
            {contract.restrictions.map((r) => (
              <p className="ct-condition" key={r}>
                <ShieldCheck /> {r}
              </p>
            ))}
          </section>
          <section className="ct-panel">
            <h2>Contract document</h2>
            <DocumentViewer contract={contract} />
          </section>
          <VersionComparison contract={contract} />
          <section className="ct-panel">
            <h2>Review comments</h2>
            {contract.comments
              .filter(
                (c) =>
                  can(user, "contracts.view_legal_notes") ||
                  c.visibility !== "Legal Restricted",
              )
              .map((c) => (
                <article className="ct-comment" key={c.id}>
                  <header>
                    <strong>{c.author}</strong>
                    <Status value={c.visibility} />
                  </header>
                  <small>
                    {c.section} · {date(c.date)} · {c.status}
                  </small>
                  <p>{c.comment}</p>
                </article>
              ))}
            <div className="ct-compose">
              <label>
                Comment
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add review guidance…"
                />
              </label>
              <label>
                Visibility
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option>Internal Only</option>
                  <option>Legal Restricted</option>
                  <option>Buyer Visible</option>
                  <option>All Signers</option>
                </select>
              </label>
              <button
                onClick={() => {
                  if (!comment) return;
                  act(
                    () =>
                      contractService.addComment(
                        contract.id,
                        { section: "General", comment, visibility },
                        user,
                      ),
                    "Comment added.",
                  );
                  setComment("");
                }}
              >
                Add comment
              </button>
            </div>
          </section>
          <AuditHistory contract={contract} />
        </main>
        <aside>
          <ApprovalPanel contract={contract} user={user} act={act} />
          <section className="ct-panel">
            <h2>Signers</h2>
            {contract.signers.map((s) => (
              <article className="ct-signer" key={s.id}>
                <span>{s.signingOrder}</span>
                <div>
                  <strong>{s.name}</strong>
                  <small>
                    {s.role} · {s.email}
                  </small>
                </div>
                <Status value={s.status} />
              </article>
            ))}
            {contract.status === "Signature Expired" && (
              <>
                <label>
                  Resend reason
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button
                  onClick={() =>
                    act(
                      () =>
                        contractService.resend(contract.id, 14, reason, user),
                      "Signature request renewed.",
                    )
                  }
                  disabled={!reason}
                >
                  Extend and resend
                </button>
              </>
            )}
          </section>
          <section className="ct-panel">
            <h2>Dependencies</h2>
            {Object.entries(contract.dependencies).map(([k, v]) => (
              <p className="ct-dependency" key={k}>
                <span>{k.replaceAll(/([A-Z])/g, " $1")}</span>
                <Status value={v ? "Complete" : "Pending"} />
              </p>
            ))}
            <p>
              <strong>Payment:</strong> {contract.paymentStatus}
            </p>
            <p>
              <strong>Licence generation:</strong> {contract.licenceGeneration}
            </p>
            <p>
              <strong>Delivery:</strong> {contract.deliveryStatus}
            </p>
          </section>
          <section className="ct-panel">
            <h2>Licensing payments</h2>
            <p>
              <strong>{paymentReadiness.status}</strong>
            </p>
            <p>
              Paid:{" "}
              {formatPaymentMoney(
                paymentInvoices.reduce(
                  (sum, invoice) =>
                    sum + invoice.amountPaid + invoice.creditApplied,
                  0,
                ),
              )}
            </p>
            <p>
              Due:{" "}
              {formatPaymentMoney(
                paymentInvoices.reduce(
                  (sum, invoice) => sum + invoice.balanceDue,
                  0,
                ),
              )}
            </p>
            {paymentInvoices.map((invoice) => (
              <p key={invoice.id}>
                {invoice.reference} · {invoice.status}
              </p>
            ))}
            <button onClick={() => navigate("admin-payments")}>
              Open payment workspace
            </button>
          </section>
          <section className="ct-panel">
            <h2>Versions & documents</h2>
            <p>Current version: v{contract.version}</p>
            <p>
              Template: {contract.templateId} v{contract.templateVersion}
            </p>
            <p>Draft asset: {contract.generatedDocumentAssetId}</p>
            <p>
              Signed asset: {contract.signedDocumentAssetId || "Not generated"}
            </p>
          </section>
          <DocumentGovernance contract={contract} navigate={navigate} />
          <section className="ct-panel">
            <span>Restricted</span>
            <h2>Comments & legal notes</h2>
            {contract.internalNotes.map((n) => (
              <p key={n}>{n}</p>
            ))}
            <small>Never visible in the buyer contract workspace.</small>
          </section>
        </aside>
      </div>
    </section>
  );
}

function TemplateLibrary({ navigate, showToast }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const [reason, setReason] = useState("");
  const state = contractService.getState();
  return (
    <section className="ct-page">
      <ContractsAdminNav
        navigate={navigate}
        active="admin-contract-templates"
        user={user}
      />
      <Header
        eyebrow="Versioned legal foundations"
        title="Contract Templates"
        text="Inspect active prototype templates, required approvals, variables, clauses, and signer policies."
      />
      <Notice />
      <label className="ct-search">
        Required version reason
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain the template change before creating a version…"
        />
      </label>
      <div className="ct-card-grid">
        {state.templates.map((t) => (
          <article className="ct-panel" key={t.id}>
            <div className="ct-title-row">
              <Status value={t.active ? "Active" : "Inactive"} />
              <strong>v{t.version}</strong>
            </div>
            <h2>{t.name}</h2>
            <p>{t.description}</p>
            <dl className="ct-dl">
              <dt>Type</dt>
              <dd>{t.contractType}</dd>
              <dt>Jurisdiction</dt>
              <dd>{t.jurisdiction}</dd>
              <dt>Clauses</dt>
              <dd>{t.clauseIds.length}</dd>
              <dt>Approvals</dt>
              <dd>{t.requiredApprovals.join(", ")}</dd>
              <dt>Signers</dt>
              <dd>{t.requiredSigners.join(", ")}</dd>
              <dt>Designed for</dt>
              <dd>{t.supportedProjectTypes.join(", ")}</dd>
            </dl>
            <button
              disabled={!reason}
              onClick={() => {
                const result = contractService.updateTemplate(
                  t.id,
                  {},
                  reason,
                  user,
                );
                showToast(
                  result.message ||
                    `Template v${result.template.version} created; ${result.affected} drafts flagged.`,
                );
                if (result.ok) {
                  setReason("");
                  setRevision(revision + 1);
                }
              }}
            >
              Create reviewed version
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
function ClauseLibrary({ navigate, showToast }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const state = contractService.getState();
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const clauses = state.clauses.filter((c) =>
    `${c.title} ${c.category} ${c.body}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="ct-page">
      <ContractsAdminNav
        navigate={navigate}
        active="admin-contract-clauses"
        user={user}
      />
      <Header
        eyebrow="Reusable versioned language"
        title="Clause Library"
        text="Clause text remains linked to the exact contract and clause versions used at generation."
      />
      <Notice />
      <label className="ct-search">
        Required clause-version reason
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain the clause review or wording change…"
        />
      </label>
      <label className="ct-search">
        Search clauses
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, category, or wording…"
        />
      </label>
      <div className="ct-card-grid">
        {clauses.map((c) => (
          <article className="ct-panel" key={c.id}>
            <div className="ct-title-row">
              <Status value={c.required ? "Required" : "Optional"} />
              <strong>v{c.version}</strong>
            </div>
            <span>{c.category}</span>
            <h2>{c.title}</h2>
            <p>{c.body}</p>
            <small>{c.internalGuidance}</small>
            <button
              disabled={!reason}
              onClick={() => {
                const result = contractService.updateClause(
                  c.id,
                  {},
                  reason,
                  user,
                );
                showToast(
                  result.message ||
                    `Clause v${result.clause.version} created; ${result.affected} drafts flagged.`,
                );
                if (result.ok) {
                  setReason("");
                  setRevision(revision + 1);
                }
              }}
            >
              Create reviewed version
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
function Analytics({ navigate }) {
  const { user } = useAuth();
  const a = contractService.analytics();
  return (
    <section className="ct-page">
      <ContractsAdminNav
        navigate={navigate}
        active="admin-contract-analytics"
        user={user}
      />
      <Header
        eyebrow="Agreement intelligence"
        title="Contract Analytics"
        text="Derived from local prototype events and records—not accounting, legal, or e-signature-provider reporting."
      />
      <Notice />
      <div className="ct-metrics">
        <article>
          <span>Created</span>
          <strong>{a.total}</strong>
        </article>
        <article>
          <span>Completion</span>
          <strong>{a.completionRate}%</strong>
        </article>
        <article>
          <span>Awaiting action</span>
          <strong>{a.awaitingBuyer + a.awaitingBeatmondo}</strong>
        </article>
        <article>
          <span>Effective value</span>
          <strong>{formatQuoteMoney(a.effectiveValue)}</strong>
        </article>
      </div>
      <div className="ct-two">
        <section className="ct-panel">
          <h2>Lifecycle distribution</h2>
          {Object.entries(a.byStatus).map(([s, n]) => (
            <div className="ct-bar" key={s}>
              <span>{s}</span>
              <div>
                <i style={{ width: `${Math.max(4, (n / a.total) * 100)}%` }} />
              </div>
              <strong>{n}</strong>
            </div>
          ))}
        </section>
        <section className="ct-panel">
          <h2>Contracts by type</h2>
          {Object.entries(a.byType).map(([s, n]) => (
            <div className="ct-bar" key={s}>
              <span>{s}</span>
              <div>
                <i style={{ width: `${Math.max(4, (n / a.total) * 100)}%` }} />
              </div>
              <strong>{n}</strong>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

function BuyerList({ navigate }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const all = contractService.getContracts(user);
  const list = all.filter(
    (c) =>
      filter === "All" ||
      (filter === "Needs Action" &&
        c.signers.some(
          (s) =>
            s.userId === user.id &&
            ["Invited", "Viewed", "Ready to Sign"].includes(s.status),
        )) ||
      (filter === "Awaiting Others" &&
        [
          "Partially Signed",
          "Awaiting Beatmondo Signature",
          "Awaiting Additional Signer",
        ].includes(c.status)) ||
      filter === c.status,
  );
  return (
    <section className="ct-page">
      <Header
        eyebrow="Buyer licensing workspace"
        title="My Contracts"
        text="Review organization agreements, request changes, and complete only signatures assigned to your authenticated account."
      />
      <Notice />
      <div className="ct-filter-row">
        {[
          "All",
          "Needs Action",
          "Awaiting Others",
          "Fully Signed",
          "Effective",
          "Signature Expired",
          "Cancelled",
        ].map((f) => (
          <button
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
            key={f}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="ct-buyer-grid">
        {list.map((c) => {
          const signer = c.signers.find((s) => s.userId === user.id);
          return (
            <article className="ct-buyer-card" key={c.id}>
              <div>
                <Status
                  value={CONTRACT_STATUSES[c.status]?.buyerLabel || c.status}
                />
                <small>{c.reference}</small>
              </div>
              <h2>{c.project}</h2>
              <p>
                {c.trackTitle} — {c.artist}
              </p>
              <strong>
                {formatQuoteMoney(c.fees.licenceFee, c.fees.currency)}
              </strong>
              <small>
                {signer
                  ? `${signer.role}: ${signer.status}`
                  : "Awaiting other signers"}{" "}
                · deadline {date(c.signatureDeadline)}
              </small>
              <button
                className="ct-primary"
                onClick={() => selectContract(c.id, navigate, "buyer-contract")}
              >
                Review contract <ArrowRight />
              </button>
            </article>
          );
        })}
      </div>
      {!list.length && (
        <div className="ct-panel ct-empty">
          No buyer-visible contracts match this filter.
        </div>
      )}
    </section>
  );
}

function BuyerDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const [rev, setRev] = useState(0);
  const [showChange, setShowChange] = useState(false);
  const [form, setForm] = useState({
    section: "Usage and restrictions",
    comment: "",
    proposedWording: "",
    priority: "Standard",
  });
  const id = localStorage.getItem(SELECTED_CONTRACT_KEY);
  const c = useMemo(() => contractService.getContract(id), [id, rev]);
  if (!c || c.organizationId !== user?.organizationId)
    return (
      <section className="ct-page">
        <div className="ct-panel">
          This contract is not available to your organization.
        </div>
      </section>
    );
  const signer = c.signers.find((s) => s.userId === user.id);
  const paymentInvoices = paymentService
    .getInvoices(user)
    .filter((invoice) => invoice.contractId === c.id);
  const paymentReadiness = calculateLicencePaymentReadiness(c);
  const act = (fn, success) => {
    const r = fn();
    showToast(r.message || success);
    setRev((x) => x + 1);
  };
  const openSignedContract = () => {
    try {
      const generated = expiringAccessService.generateExpiringAccess(
        {
          resourceType: "Signed contract",
          resourceLabel: `${c.reference} signed contract`,
          resourceId: c.signedDocumentAssetId,
          relatedContractId: c.id,
          action: "DOWNLOAD",
        },
        user,
        {
          action: "DOWNLOAD",
          userId: user.id,
          organizationId: c.organizationId,
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
    <section className="ct-page">
      <button className="ct-back" onClick={() => navigate("buyer-contracts")}>
        <ArrowLeft /> My contracts
      </button>
      <Header
        eyebrow={c.reference}
        title={c.title}
        text={`${c.trackTitle} — ${c.artist} · valid signature invitation until ${date(c.signatureDeadline)}`}
        actions={
          <>
            {c.signedDocumentAssetId ? (
              <button onClick={openSignedContract}>
                <FileText /> Download signed PDF
              </button>
            ) : (
              <button onClick={() => navigate("contract-print")}>
                <Printer /> Print draft
              </button>
            )}
            {signer &&
              ["Invited", "Delivered", "Viewed", "Ready to Sign"].includes(
                signer.status,
              ) && (
                <button
                  className="ct-primary"
                  onClick={() => navigate("signature")}
                >
                  <Signature /> Review & sign
                </button>
              )}
          </>
        }
      />
      <Notice />
      <ContractControlStrip contract={c} />
      <div className="ct-detail-grid">
        <main>
          <section className="ct-panel">
            <div className="ct-title-row">
              <Status
                value={CONTRACT_STATUSES[c.status]?.buyerLabel || c.status}
              />
              <strong>
                {formatQuoteMoney(c.fees.licenceFee, c.fees.currency)}
              </strong>
            </div>
            <dl className="ct-dl">
              <dt>Project</dt>
              <dd>{c.project}</dd>
              <dt>Track</dt>
              <dd>
                {c.trackTitle} — {c.artist}
              </dd>
              <dt>Usage</dt>
              <dd>{c.usage}</dd>
              <dt>Media</dt>
              <dd>{c.media.join(", ")}</dd>
              <dt>Territory</dt>
              <dd>{c.territory}</dd>
              <dt>Term</dt>
              <dd>{c.term}</dd>
              <dt>Exclusivity</dt>
              <dd>{c.exclusivity}</dd>
              <dt>Payment</dt>
              <dd>{c.paymentTerms}</dd>
              <dt>Assets</dt>
              <dd>{c.assets.join(", ")}</dd>
            </dl>
            <h3>Restrictions</h3>
            {c.restrictions.map((r) => (
              <p className="ct-condition" key={r}>
                <ShieldCheck /> {r}
              </p>
            ))}
            <h3>Credit</h3>
            <p>{c.credits}</p>
          </section>
          <section className="ct-panel">
            <h2>Contract document</h2>
            <DocumentViewer contract={c} buyer />
          </section>
          <VersionComparison contract={c} buyer />
          <section className="ct-panel">
            <h2>Buyer-visible discussion</h2>
            {c.comments
              .filter((x) =>
                ["Buyer Visible", "All Signers"].includes(x.visibility),
              )
              .map((x) => (
                <article className="ct-comment" key={x.id}>
                  <header>
                    <strong>{x.author}</strong>
                    <Status value={x.status} />
                  </header>
                  <small>
                    {x.section} · {date(x.date)}
                  </small>
                  <p>{x.comment}</p>
                </article>
              ))}
          </section>
          <AuditHistory contract={c} buyer />
        </main>
        <aside>
          <section className="ct-panel">
            <h2>Signature workflow</h2>
            {c.signers.map((s) => (
              <article className="ct-signer" key={s.id}>
                <span>{s.signingOrder}</span>
                <div>
                  <strong>{s.name}</strong>
                  <small>{s.role}</small>
                </div>
                <Status value={s.status} />
              </article>
            ))}
            <button
              className="ct-full"
              onClick={() => setShowChange(!showChange)}
              disabled={[
                "Effective",
                "Cancelled",
                "Signature Expired",
              ].includes(c.status)}
            >
              <NotePencil /> Request changes
            </button>
            {showChange && (
              <div className="ct-response">
                <label>
                  Section
                  <select
                    value={form.section}
                    onChange={(e) =>
                      setForm((x) => ({ ...x, section: e.target.value }))
                    }
                  >
                    <option>Usage and restrictions</option>
                    <option>Commercial terms</option>
                    <option>Credits</option>
                    <option>Payment terms</option>
                    <option>Signature block</option>
                  </select>
                </label>
                <label>
                  Requested change
                  <textarea
                    value={form.comment}
                    onChange={(e) =>
                      setForm((x) => ({ ...x, comment: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Proposed wording
                  <input
                    value={form.proposedWording}
                    onChange={(e) =>
                      setForm((x) => ({
                        ...x,
                        proposedWording: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((x) => ({ ...x, priority: e.target.value }))
                    }
                  >
                    <option>Standard</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </label>
                <button
                  className="ct-primary"
                  disabled={!form.comment}
                  onClick={() => {
                    act(
                      () =>
                        contractService.requestBuyerChanges(c.id, form, user),
                      "Change request submitted; signing paused.",
                    );
                    setShowChange(false);
                  }}
                >
                  Submit request
                </button>
              </div>
            )}
          </section>
          <DocumentGovernance
            contract={c}
            navigate={navigate}
            buyer
            onDownload={openSignedContract}
          />
          <section className="ct-panel">
            <h2>Next steps</h2>
            <p>
              <strong>Contract:</strong> {c.status}
            </p>
            <p>
              <strong>Payment:</strong> {c.paymentStatus}
            </p>
            <p>
              <strong>Licence:</strong> {c.licenceGeneration}
            </p>
            <p>
              <strong>Delivery:</strong> {c.deliveryStatus}
            </p>
            <small>Each stage remains separate and gated.</small>
            {paymentInvoices.length > 0 && (
              <>
                <p>
                  <strong>Licensing payment:</strong> {paymentReadiness.status}
                </p>
                <p>
                  Outstanding:{" "}
                  {formatPaymentMoney(
                    paymentInvoices.reduce(
                      (sum, invoice) => sum + invoice.balanceDue,
                      0,
                    ),
                  )}
                </p>
                <button onClick={() => navigate("buyer-payments")}>
                  Open licence payments
                </button>
              </>
            )}
          </section>
          {c.signedDocumentAssetId && (
            <section className="ct-panel">
              <Certificate />
              <h2>Signed copy</h2>
              <p>{c.signedDocumentAssetId}</p>
              <button onClick={openSignedContract}>
                Download signed PDF
              </button>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}

function SignaturePage({ navigate, showToast }) {
  const { user } = useAuth();
  const c = contractService.getContract(
    localStorage.getItem(SELECTED_CONTRACT_KEY),
  );
  const signer = c?.signers.find((s) => s.userId === user?.id);
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [codeOk, setCodeOk] = useState(false);
  const [method, setMethod] = useState("Typed signature");
  const [signature, setSignature] = useState("");
  const [consents, setConsents] = useState([false, false, false, false]);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  if (!c || !signer)
    return (
      <section className="ct-page">
        <div className="ct-panel">
          No active signature assignment is available for this account.
        </div>
      </section>
    );
  if (new Date(signer.expiresAt) < new Date() || signer.status === "Expired")
    return (
      <section className="ct-page">
        <Header
          eyebrow={c.reference}
          title="Signature invitation expired"
          text="The agreement is preserved, but this invitation can no longer be signed."
        />
        <Notice />
        <button onClick={() => navigate("signature-expired")}>
          View expiry details
        </button>
      </section>
    );
  const sign = () => {
    const r = contractService.sign(
      c.id,
      { contractVersion: c.version, code, method, signature, consents },
      user,
    );
    showToast(r.message || "Simulated signature recorded.");
    if (r.ok) navigate("signature-complete");
  };
  const verify = () => {
    const r = contractService.verifyCode(code);
    setCodeOk(r.ok);
    showToast(r.message);
  };
  const labels = [
    "I consent to use an electronic signature.",
    "I confirm I am authorized to sign for the named organization.",
    "I have reviewed the current contract version.",
    "I understand my signature will be recorded with date and simulated session information.",
  ];
  return (
    <section className="ct-page ct-signature-page">
      <button className="ct-back" onClick={() => navigate("buyer-contract")}>
        <ArrowLeft /> Contract detail
      </button>
      <Header
        eyebrow={`${c.reference} · signer ${signer.signingOrder}`}
        title="Review and Sign"
        text={`${signer.name} · ${signer.organization} · contract version ${c.version}`}
      />
      <Notice />
      <div className="ct-sign-progress">
        <span className={step >= 1 ? "active" : ""}>1 Review</span>
        <span className={step >= 2 ? "active" : ""}>2 Verify</span>
        <span className={step >= 3 ? "active" : ""}>3 Consent</span>
        <span className={step >= 4 ? "active" : ""}>4 Sign</span>
      </div>
      {step === 1 && (
        <section className="ct-panel">
          <h2>Review the current agreement</h2>
          <DocumentViewer contract={c} buyer />
          <label className="ct-check">
            <input
              type="checkbox"
              onChange={(e) => e.target.checked && setStep(2)}
            />
            I have reviewed contract version {c.version} and want to continue.
          </label>
        </section>
      )}
      {step === 2 && (
        <section className="ct-panel ct-sign-box">
          <ShieldCheck />
          <h2>Confirm signer identity</h2>
          <p>
            Signed in as {user.name} for {user.organization}.
          </p>
          <label>
            Dummy email code
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeOk(false);
              }}
              placeholder="6-digit code"
            />
          </label>
          <small>Prototype QA code: {SIGNATURE_CODE}</small>
          <button className="ct-primary" onClick={verify}>
            Verify code
          </button>
          {codeOk && (
            <button onClick={() => setStep(3)}>
              Continue to consent <ArrowRight />
            </button>
          )}
        </section>
      )}
      {step === 3 && (
        <section className="ct-panel ct-sign-box">
          <h2>Electronic-signature consent</h2>
          {labels.map((label, i) => (
            <label className="ct-check" key={label}>
              <input
                type="checkbox"
                checked={consents[i]}
                onChange={(e) =>
                  setConsents((x) =>
                    x.map((v, n) => (n === i ? e.target.checked : v)),
                  )
                }
              />
              {label}
            </label>
          ))}
          <small>Consent version: prototype-consent-v1</small>
          <button
            className="ct-primary"
            disabled={!consents.every(Boolean)}
            onClick={() => setStep(4)}
          >
            Continue to signature
          </button>
        </section>
      )}
      {step === 4 && (
        <section className="ct-panel ct-sign-box">
          <PenNib />
          <h2>Apply simulated signature</h2>
          <label>
            Signature method
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Typed signature</option>
              <option>Drawn signature simulation</option>
              <option>Uploaded signature image simulation</option>
            </select>
          </label>
          {method === "Typed signature" ? (
            <label>
              Type your full legal name
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={signer.name}
              />
              <small>Must match {signer.name}</small>
            </label>
          ) : method === "Drawn signature simulation" ? (
            <div
              className="ct-signature-pad"
              role="img"
              aria-label="Simulated signature drawing area"
            >
              <span>
                Drawn signature is represented only as a prototype mark.
              </span>
              <button
                onClick={() =>
                  setSignature(`${signer.name} — simulated drawn mark`)
                }
              >
                Add simulated mark
              </button>
            </div>
          ) : (
            <label>
              Upload a signature image simulation
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSignature(e.target.files?.[0]?.name || "")}
              />
              <small>No biometric data is processed or certified.</small>
            </label>
          )}
          <button
            className="ct-primary ct-large"
            disabled={!signature || !codeOk || !consents.every(Boolean)}
            onClick={sign}
          >
            <Signature /> Record simulated signature
          </button>
          <button className="ct-danger" onClick={() => setDeclining(true)}>
            <XCircle /> Decline signature
          </button>
          {declining && (
            <div className="ct-response">
              <label>
                Required decline reason
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                className="ct-danger"
                disabled={!reason}
                onClick={() => {
                  const r = contractService.declineSignature(
                    c.id,
                    reason,
                    user,
                  );
                  showToast(r.message || "Signature declined.");
                  if (r.ok) navigate("signature-declined");
                }}
              >
                Confirm decline
              </button>
            </div>
          )}
        </section>
      )}
    </section>
  );
}

function SignatureComplete({ navigate }) {
  const { user } = useAuth();
  const c = contractService.getContract(
    localStorage.getItem(SELECTED_CONTRACT_KEY),
  );
  const record = c?.signatures.find((s) => s.signerName === user?.name);
  return (
    <section className="ct-page ct-state-page">
      <CheckCircle />
      <Header
        eyebrow="Signature recorded"
        title="Your simulated signature is complete"
        text="The exact contract version and prototype consent record have been preserved."
      />
      <Notice />
      <section className="ct-panel">
        <dl className="ct-dl">
          <dt>Contract</dt>
          <dd>
            {c?.reference} v{c?.version}
          </dd>
          <dt>Signer</dt>
          <dd>{user?.name}</dd>
          <dt>Recorded</dt>
          <dd>{date(record?.signedAt)}</dd>
          <dt>Method</dt>
          <dd>{record?.signatureMethod}</dd>
          <dt>Current status</dt>
          <dd>{c?.status}</dd>
          <dt>Remaining signers</dt>
          <dd>
            {c?.signers
              .filter((s) => s.required && s.status !== "Signed")
              .map((s) => s.name)
              .join(", ") || "None"}
          </dd>
        </dl>
        <p>
          Payment: {c?.paymentStatus}. Licence generation:{" "}
          {c?.licenceGeneration}. Delivery: {c?.deliveryStatus}.
        </p>
        <button
          className="ct-primary"
          onClick={() => navigate("buyer-contract")}
        >
          Return to contract
        </button>
      </section>
    </section>
  );
}
function SimpleState({ type, navigate }) {
  const copy = {
    declined: [
      "Signature declined",
      "The signature workflow has stopped. The contract remains preserved for internal follow-up.",
    ],
    expired: [
      "Signature invitation expired",
      "Signing is disabled until beatmondo revalidates the quote, rights, buyer status, and current contract version.",
    ],
  }[type];
  return (
    <section className="ct-page ct-state-page">
      <WarningCircle />
      <Header eyebrow="Contract workflow" title={copy[0]} text={copy[1]} />
      <Notice />
      <button onClick={() => navigate("buyer-contracts")}>
        Return to my contracts
      </button>
    </section>
  );
}
function PrintContract({ navigate }) {
  const { user } = useAuth();
  const c = contractService.getContract(
    localStorage.getItem(SELECTED_CONTRACT_KEY),
  );
  const buyer = user?.userType === "buyer";
  if (!c || (buyer && c.organizationId !== user.organizationId))
    return (
      <section className="ct-page">
        <div className="ct-panel">
          This document is not available to your account.
        </div>
      </section>
    );
  return (
    <section className="ct-print">
      <div className="ct-print-actions">
        <button
          onClick={() =>
            navigate(buyer ? "buyer-contract" : "admin-contract-detail")
          }
        >
          <ArrowLeft /> Back
        </button>
        <button onClick={() => window.print()}>
          <Printer /> Print
        </button>
      </div>
      <DocumentViewer contract={c} buyer={buyer} />
      {c.signatures.length > 0 && (
        <section className="ct-certificate">
          <h2>Prototype signature record</h2>
          <p>Not a certified e-signature-provider certificate.</p>
          {c.signatures.map((s) => (
            <p key={s.id}>
              <strong>{s.signerName}</strong> · {s.signatureMethod} ·{" "}
              {date(s.signedAt)} · contract v{s.contractVersion}
            </p>
          ))}
        </section>
      )}
    </section>
  );
}

export function renderContractsView(view, props) {
  if (view === "admin-contracts") return <AdminDashboard {...props} />;
  if (view === "admin-contract-new") return <GenerationWizard {...props} />;
  if (view === "admin-contract-detail") return <AdminDetail {...props} />;
  if (view === "admin-contract-templates")
    return <TemplateLibrary {...props} />;
  if (view === "admin-contract-clauses") return <ClauseLibrary {...props} />;
  if (view === "admin-contract-analytics") return <Analytics {...props} />;
  if (view === "buyer-contracts") return <BuyerList {...props} />;
  if (view === "buyer-contract") return <BuyerDetail {...props} />;
  if (view === "signature") return <SignaturePage {...props} />;
  if (view === "signature-complete") return <SignatureComplete {...props} />;
  if (view === "signature-declined")
    return <SimpleState type="declined" {...props} />;
  if (view === "signature-expired")
    return <SimpleState type="expired" {...props} />;
  if (view === "contract-print") return <PrintContract {...props} />;
  return null;
}
