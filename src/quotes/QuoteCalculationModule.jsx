import { Fragment, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle,
  Clock,
  CurrencyDollar,
  DownloadSimple,
  FileText,
  Funnel,
  PaperPlaneTilt,
  Plus,
  Printer,
  ShieldCheck,
  TrendUp,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  DEFAULT_PRICING_MODELS,
  QUOTE_STATUSES,
  SELECTED_QUOTE_KEY,
} from "./quoteData.js";
import { formatQuoteMoney, quoteService } from "./quoteService.js";
import { SectionSubnav } from "../ui/SectionSubnav.jsx";
import "./quotes.css";

export const QUOTE_VIEWS = new Set([
  "admin-quotes",
  "admin-quotes-new",
  "admin-quote",
  "admin-quotes-analytics",
  "admin-pricing-rules",
  "buyer-quotes",
  "buyer-quote",
  "quote-print",
]);
const can = (user, p) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(p);

function QuotesAdminNav({ navigate, active, user }) {
  const items = [
    { view: "admin-quotes", label: "Quotes" },
    can(user, "quotes.create") && {
      view: "admin-quotes-new",
      label: "New quote",
    },
    { view: "admin-pricing-rules", label: "Pricing rules" },
    { view: "admin-quotes-analytics", label: "Analytics" },
  ].filter(Boolean);
  return (
    <SectionSubnav
      ariaLabel="Quote calculation sections"
      navigate={navigate}
      active={active}
      items={items}
      backTo={
        active !== "admin-quotes"
          ? { view: "admin-quotes", label: "Back to quote dashboard" }
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
    className={`qt-status qt-${String(value).toLowerCase().replaceAll(" ", "-")}`}
  >
    {value}
  </span>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="qt-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="qt-actions">{actions}</div>}
  </header>
);
const Notice = () => (
  <div className="qt-notice">
    <WarningCircle />
    <span>
      <strong>Prototype pricing guidance.</strong> All figures are fictional,
      internal suggestions—not market-standard pricing, legal advice, tax
      calculations, or binding offers.
    </span>
  </div>
);

function quotePricingContext(q) {
  const calculation = quoteService
    .getState()
    .calculations?.find((item) => item.id === q.calculationId);
  const input = calculation?.inputs || {};
  const lines = q.lineItems || [];
  const baseLicencePrice = lines
    .filter((item) =>
      ["Master Licence Fee", "Publishing Licence Fee"].includes(item.type),
    )
    .reduce((sum, item) => sum + Number(item.total || 0), 0);
  const rushFee = lines
    .filter((item) => item.type === "Rush Fee")
    .reduce((sum, item) => sum + Number(item.total || 0), 0);
  const addOns = lines.filter(
    (item) =>
      ![
        "Master Licence Fee",
        "Publishing Licence Fee",
        "Rush Fee",
        "Discount",
        "Credit",
        "Tax",
      ].includes(item.type),
  );
  const addOnsTotal = addOns.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );
  const discount =
    Number(q.discounts || 0) ||
    lines
      .filter((item) => ["Discount", "Credit"].includes(item.type))
      .reduce((sum, item) => sum + Number(item.total || 0), 0);
  const activeRules = quoteService
    .getState()
    .pricingModels?.find((model) => model.active)?.rules;
  const threshold = activeRules?.approvalThresholds || {};
  const approvalThreshold =
    q.total >= Number(threshold.seniorAbove || Infinity)
      ? `Senior approval above ${formatQuoteMoney(threshold.seniorAbove)}`
      : q.total >= Number(threshold.financeFrom || Infinity)
        ? `Finance approval from ${formatQuoteMoney(threshold.financeFrom)}`
        : `Licensing approval below ${formatQuoteMoney(threshold.financeFrom)}`;
  const rights = q.rightsSummary || {};
  const rightsInvolved = [
    rights.masterControlledShare != null
      ? `Master ${rights.masterControlledShare}% controlled`
      : "Master rights",
    rights.publishingControlledShare != null
      ? `Publishing ${rights.publishingControlledShare}% controlled`
      : "Publishing rights",
  ].join(" · ");
  const customEdit =
    q.terms?.assets?.some((asset) => /custom|cut|edit/i.test(asset)) ||
    lines.some((item) => /custom|cut|edit/i.test(item.type));
  return {
    projectType: input.projectType || "Advertising campaign",
    territory: q.terms?.territory || input.territory || "—",
    term: q.terms?.term || input.term || "—",
    exclusivity: q.terms?.exclusivity || input.exclusivity || "—",
    media: q.terms?.media?.join(", ") || input.media?.join(", ") || "—",
    scale: q.terms?.scale || input.scale || "—",
    track: `${q.trackTitle} — ${q.artist}`,
    rightsInvolved,
    files: q.terms?.assets?.join(", ") || "None requested",
    customEdit: customEdit ? "Required" : "Not requested",
    rushFee,
    baseLicencePrice: baseLicencePrice || Math.max(0, q.subtotal - addOnsTotal - rushFee),
    addOns,
    addOnsTotal,
    tax: Number(q.tax || 0),
    discount,
    total: Number(q.total || 0),
    internalMargin: q.internalMarginRate ?? 0.32,
    approvalThreshold,
  };
}

function QuoteRequestBridge({ q }) {
  return (
    <section className="qt-request-bridge" aria-label="Request to quote workflow">
      <div>
        <span>01</span>
        <strong>Request received</strong>
        <small>{q.licensingRequestId || "Linked licensing request"}</small>
      </div>
      <ArrowRight aria-hidden="true" />
      <div>
        <span>02</span>
        <strong>Pricing logic applied</strong>
        <small>Usage, rights and delivery inputs</small>
      </div>
      <ArrowRight aria-hidden="true" />
      <div>
        <span>03</span>
        <strong>Quote ready</strong>
        <small>{q.reference} · version {q.version}</small>
      </div>
      <ArrowRight aria-hidden="true" />
      <div>
        <span>04</span>
        <strong>Contract follows</strong>
        <small>Only after quote acceptance</small>
      </div>
    </section>
  );
}

function QuotePricingStory({ q, internal = false }) {
  const pricing = quotePricingContext(q);
  const inputs = [
    ["Project type", pricing.projectType],
    ["Territory", pricing.territory],
    ["Term", pricing.term],
    ["Exclusivity", pricing.exclusivity],
    ["Media usage", pricing.media],
    ["Audience scale", pricing.scale],
    ["Track", pricing.track],
    ["Rights involved", pricing.rightsInvolved],
    ["Requested files", pricing.files],
    ["Custom edit", pricing.customEdit],
  ];
  return (
    <>
      <section className="qt-panel qt-pricing-story">
        <div className="qt-section-heading">
          <div>
            <span>Request inputs</span>
            <h2>What shaped this quote</h2>
          </div>
          <small>Snapshot locked to quote version {q.version}</small>
        </div>
        <div className="qt-input-map">
          {inputs.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="qt-panel qt-price-stack">
        <div className="qt-section-heading">
          <div>
            <span>Pricing logic</span>
            <h2>Quote breakdown</h2>
          </div>
          <small>Fictional, review-subject guidance</small>
        </div>
        <div className="qt-price-row">
          <span>Base licence price</span>
          <strong>{formatQuoteMoney(pricing.baseLicencePrice, q.currency)}</strong>
        </div>
        <div className="qt-price-row">
          <span>Rush fee <small>{q.terms?.rush || "Standard"}</small></span>
          <strong>{formatQuoteMoney(pricing.rushFee, q.currency)}</strong>
        </div>
        <div className="qt-price-row">
          <span>Add-ons <small>{pricing.addOns.map((item) => item.name).join(", ") || "None"}</small></span>
          <strong>{formatQuoteMoney(pricing.addOnsTotal, q.currency)}</strong>
        </div>
        <div className="qt-price-row">
          <span>Taxes <small>Final tax treatment reviewed at invoicing</small></span>
          <strong>{formatQuoteMoney(pricing.tax, q.currency)}</strong>
        </div>
        <div className="qt-price-row qt-discount-row">
          <span>Discount</span>
          <strong>{formatQuoteMoney(pricing.discount, q.currency)}</strong>
        </div>
        <div className="qt-price-row qt-grand-total">
          <span>Total</span>
          <strong>{formatQuoteMoney(pricing.total, q.currency)}</strong>
        </div>
        <div className="qt-validity-row">
          <Clock aria-hidden="true" /> Valid until {date(q.validUntil)}
        </div>
      </section>
      {internal && (
        <section className="qt-panel qt-internal-controls">
          <div>
            <span>Internal margin</span>
            <strong>{Math.round(pricing.internalMargin * 100)}% illustrative</strong>
            <small>Restricted internal planning assumption</small>
          </div>
          <div>
            <span>Approval threshold</span>
            <strong>{pricing.approvalThreshold}</strong>
            <small>{q.approvalStatus} · pricing model v{q.pricingModelVersion}</small>
          </div>
        </section>
      )}
    </>
  );
}

function downloadQuote(q) {
  const pricing = quotePricingContext(q);
  const content = [
    "beatmondo licensing quote — prototype",
    `${q.reference} · version ${q.version}`,
    `${q.trackTitle} — ${q.artist}`,
    `${q.project} · ${q.organization}`,
    "",
    `Media usage: ${pricing.media}`,
    `Territory: ${pricing.territory}`,
    `Term: ${pricing.term}`,
    `Exclusivity: ${pricing.exclusivity}`,
    `Requested files: ${pricing.files}`,
    `Total: ${formatQuoteMoney(pricing.total, q.currency)}`,
    `Valid until: ${date(q.validUntil)}`,
    "",
    "Fictional, non-binding prototype quote. Rights, contract, payment and delivery remain separate approval stages.",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${q.reference}-beatmondo-quote.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}
function selectQuote(id, navigate, target = "admin-quote") {
  localStorage.setItem(SELECTED_QUOTE_KEY, id);
  navigate(target);
}

function Dashboard({ navigate }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const quotes = useMemo(() => quoteService.getQuotes(user), [user, revision]);
  const analytics = quoteService.analytics();
  const filtered = quotes.filter(
    (q) =>
      (status === "All" || q.status === status) &&
      `${q.reference} ${q.buyer} ${q.organization} ${q.project} ${q.trackTitle}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="qt-page">
      <QuotesAdminNav navigate={navigate} active="admin-quotes" user={user} />
      <Header
        eyebrow="Licensing operations"
        title="Quote Calculation"
        text="Draft, review, approve, negotiate, and monitor rights-aware licensing quotes."
        actions={
          <button
            className="qt-primary"
            onClick={() => navigate("admin-quotes-new")}
            disabled={!can(user, "quotes.create")}
          >
            <Plus /> New quote
          </button>
        }
      />
      <Notice />
      <div className="qt-metrics">
        <article>
          <span>Quote pipeline</span>
          <strong>{formatQuoteMoney(analytics.pipeline)}</strong>
          <small>{analytics.total} total records</small>
        </article>
        <article>
          <span>Accepted value</span>
          <strong>{formatQuoteMoney(analytics.acceptedValue)}</strong>
          <small>{analytics.conversion}% sent-to-accepted</small>
        </article>
        <article>
          <span>Average accepted</span>
          <strong>{formatQuoteMoney(analytics.average)}</strong>
          <small>Fictional demo dataset</small>
        </article>
        <article>
          <span>Needs review</span>
          <strong>
            {(analytics.byStatus["Internal Review"] || 0) +
              (analytics.byStatus.Blocked || 0)}
          </strong>
          <small>Rights or internal review</small>
        </article>
      </div>
      <section className="qt-panel">
        <div className="qt-toolbar">
          <label>
            Search quotes
            <input
              placeholder="Buyer, project, track, reference…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              {Object.keys(QUOTE_STATUSES).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button onClick={() => setRevision((x) => x + 1)}>Refresh</button>
        </div>
        <div className="qt-table">
          <table>
            <thead>
              <tr>
                <th>Quote</th>
                <th>Buyer / project</th>
                <th>Track</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Validity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td>
                    <strong>{q.reference}</strong>
                    <small>
                      {q.quoteType} · v{q.version}
                    </small>
                  </td>
                  <td>
                    <strong>{q.organization}</strong>
                    <small>
                      {q.buyer} · {q.project}
                    </small>
                  </td>
                  <td>
                    <strong>{q.trackTitle}</strong>
                    <small>{q.artist}</small>
                  </td>
                  <td>
                    <strong>
                      {q.minimum != null && q.maximum != null
                        ? `${formatQuoteMoney(q.minimum)}–${formatQuoteMoney(q.maximum)}`
                        : formatQuoteMoney(q.total)}
                    </strong>
                    <small>{q.currency}</small>
                  </td>
                  <td>
                    <Status value={q.status} />
                  </td>
                  <td>{date(q.validUntil)}</td>
                  <td>
                    <button
                      aria-label={`Open ${q.reference}`}
                      onClick={() => selectQuote(q.id, navigate)}
                    >
                      Open <ArrowRight />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="qt-empty">No quotes match these filters.</p>
          )}
        </div>
      </section>
    </section>
  );
}

const initial = {
  buyerId: "user-olivia",
  buyer: "Olivia Bennett",
  organizationId: "org-northstar",
  organization: "Northstar Pictures",
  project: "New Licensing Project",
  projectType: "Advertising campaign",
  trackId: "1",
  media: ["Online Video"],
  territory: "North America",
  term: "12 months",
  exclusivity: "Non-exclusive",
  prominence: "Featured background",
  scale: "Standard",
  assets: ["WAV master"],
  rush: "Standard",
  currency: "USD",
  buyerTier: "VIP Sync Access",
};
function CalculatorPage({ navigate, tracks, showToast }) {
  const { user } = useAuth();
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const update = (key, value) => setForm((x) => ({ ...x, [key]: value }));
  const selected = tracks.find((t) => String(t.id) === String(form.trackId));
  const calculate = () => {
    const r = quoteService.calculate(
      { ...form, trackTitle: selected?.title, artist: selected?.artist },
      user,
    );
    setResult(r);
    showToast(
      r.ok
        ? "Suggested range calculated and saved."
        : r.blockingIssues?.[0] || "Calculation needs more information.",
    );
  };
  const create = () => {
    const r = quoteService.createDraft(
      { ...form, trackTitle: selected?.title, artist: selected?.artist },
      result?.calculation,
      user,
    );
    showToast(r.message || "Draft quote created.");
    if (r.ok) selectQuote(r.quote.id, navigate);
  };
  return (
    <section className="qt-page">
      <button className="qt-back" onClick={() => navigate("admin-quotes")}>
        <ArrowLeft /> Quote dashboard
      </button>
      <Header
        eyebrow="Rights-aware calculator"
        title="New Quote Calculation"
        text="Build a transparent suggested range, capture assumptions, then create an approval-controlled draft."
      />
      <Notice />
      <div className="qt-calc-layout">
        <section className="qt-panel">
          <h2>Usage inputs</h2>
          <div className="qt-form-grid">
            <label>
              Buyer
              <select
                value={form.buyerId}
                onChange={(e) => {
                  const options = {
                    "user-olivia": [
                      "Olivia Bennett",
                      "org-northstar",
                      "Northstar Pictures",
                      "VIP Sync Access",
                    ],
                    "user-ethan": [
                      "Ethan Cole",
                      "org-brightframe",
                      "BrightFrame Agency",
                      "Discovery Access",
                    ],
                    "user-sofia": [
                      "Sofia Martinez",
                      "org-lighthouse",
                      "Lighthouse Creative",
                      "Professional Buyer",
                    ],
                  };
                  const v = options[e.target.value];
                  setForm((x) => ({
                    ...x,
                    buyerId: e.target.value,
                    buyer: v[0],
                    organizationId: v[1],
                    organization: v[2],
                    buyerTier: v[3],
                  }));
                }}
              >
                <option value="user-olivia">Olivia Bennett — VIP</option>
                <option value="user-ethan">Ethan Cole — Discovery</option>
                <option value="user-sofia">
                  Sofia Martinez — Professional
                </option>
              </select>
            </label>
            <label>
              Project name
              <input
                value={form.project}
                onChange={(e) => update("project", e.target.value)}
              />
            </label>
            <label>
              Track
              <select
                value={form.trackId}
                onChange={(e) => update("trackId", e.target.value)}
              >
                {tracks.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.title} — {t.artist}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Project type
              <select
                value={form.projectType}
                onChange={(e) => update("projectType", e.target.value)}
              >
                {[
                  "Advertising campaign",
                  "Trailer",
                  "Documentary",
                  "Feature film",
                  "Television",
                  "Video game",
                  "Podcast",
                  "Corporate film",
                  "Sonic branding",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Media
              <select
                value={form.media[0]}
                onChange={(e) => update("media", [e.target.value])}
              >
                {[
                  "Online Video",
                  "Paid Social",
                  "Broadcast TV",
                  "Cinema",
                  "All Media",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Territory
              <select
                value={form.territory}
                onChange={(e) => update("territory", e.target.value)}
              >
                {[
                  "Single country",
                  "North America",
                  "Multi-territory",
                  "Worldwide",
                  "Unknown",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Term
              <select
                value={form.term}
                onChange={(e) => update("term", e.target.value)}
              >
                {[
                  "3 months",
                  "6 months",
                  "12 months",
                  "24 months",
                  "3 years",
                  "Perpetuity",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Exclusivity
              <select
                value={form.exclusivity}
                onChange={(e) => update("exclusivity", e.target.value)}
              >
                {[
                  "Non-exclusive",
                  "Category exclusive",
                  "Full exclusive",
                  "Unknown",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Prominence
              <select
                value={form.prominence}
                onChange={(e) => update("prominence", e.target.value)}
              >
                {[
                  "Background",
                  "Featured background",
                  "Main title",
                  "Logo or sonic-brand use",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Production scale
              <select
                value={form.scale}
                onChange={(e) => update("scale", e.target.value)}
              >
                {["Independent", "Standard", "Major", "Global", "Unknown"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Rush
              <select
                value={form.rush}
                onChange={(e) => update("rush", e.target.value)}
              >
                {["Standard", "5 business days", "48 hours", "Same day"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Deliverables
              <select
                value={form.assets[0]}
                onChange={(e) => update("assets", [e.target.value])}
              >
                <option>WAV master</option>
                <option>Stems</option>
                <option>Instrumental</option>
                <option>Custom edit</option>
              </select>
            </label>
          </div>
          <button className="qt-primary qt-large" onClick={calculate}>
            <Calculator /> Calculate suggested range
          </button>
        </section>
        <aside className="qt-panel qt-result">
          <h2>Pricing guidance</h2>
          {!result && (
            <div className="qt-placeholder">
              <Calculator />
              <p>Complete the inputs to see an explainable suggested range.</p>
            </div>
          )}
          {result && !result.ok && (
            <div className="qt-block">
              <WarningCircle />
              <h3>{result.status}</h3>
              <p>{result.blockingIssues?.join(" ")}</p>
              {Number(form.trackId) === 15 && (
                <small>
                  The SMYRK rights, splits, eligibility, and pricing remain
                  explicitly unconfirmed.
                </small>
              )}
            </div>
          )}
          {result?.ok && (
            <>
              <Status value={`${result.calculation.confidence} confidence`} />
              <div className="qt-range">
                <span>Suggested range</span>
                <strong>
                  {formatQuoteMoney(result.calculation.minimum)}–
                  {formatQuoteMoney(result.calculation.maximum)}
                </strong>
                <small>
                  Recommended draft:{" "}
                  {formatQuoteMoney(result.calculation.recommendedAmount)}
                </small>
              </div>
              <dl>
                <dt>Base range</dt>
                <dd>
                  {formatQuoteMoney(result.calculation.baseRates.minimum)}–
                  {formatQuoteMoney(result.calculation.baseRates.maximum)}
                </dd>
                {result.calculation.multipliers.map(([n, v]) => (
                  <Fragment key={n}>
                    <dt>{n}</dt>
                    <dd>× {Number(v).toFixed(2)}</dd>
                  </Fragment>
                ))}
              </dl>
              {result.calculation.manualReviewRequired && (
                <div className="qt-warning">
                  <WarningCircle /> {result.calculation.manualReasons.join(" ")}
                </div>
              )}
              <h3>Recommended split</h3>
              <p>
                Master {formatQuoteMoney(result.calculation.split.master)} ·
                Publishing{" "}
                {formatQuoteMoney(result.calculation.split.publishing)}
              </p>
              <button className="qt-primary" onClick={create}>
                <FileText /> Create draft quote
              </button>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

function QuoteDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const [rev, setRev] = useState(0);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const id = localStorage.getItem(SELECTED_QUOTE_KEY) || "quote-47";
  const q = useMemo(() => quoteService.getQuote(id), [id, rev]);
  if (!q)
    return (
      <section className="qt-page">
        <p>Quote not found.</p>
      </section>
    );
  const act = (fn, success) => {
    const r = fn();
    showToast(r.message || success);
    setRev((x) => x + 1);
  };
  return (
    <section className="qt-page">
      <button className="qt-back" onClick={() => navigate("admin-quotes")}>
        <ArrowLeft /> Quote dashboard
      </button>
      <Header
        eyebrow={`${q.reference} · version ${q.version}`}
        title={`${q.trackTitle} — ${q.project}`}
        text={`${q.buyer}, ${q.organization}`}
        actions={
          <>
            <button onClick={() => navigate("quote-print")}>
              <Printer /> Print view
            </button>
            {q.status === "Draft" && (
              <button
                onClick={() =>
                  act(
                    () => quoteService.requestApproval(q.id, user),
                    "Approvals requested.",
                  )
                }
                disabled={!can(user, "quotes.request_approval")}
              >
                <ShieldCheck /> Request approval
              </button>
            )}
            {q.approvalStatus === "Completed" && q.status !== "Sent" && (
              <button
                className="qt-primary"
                onClick={() =>
                  act(() => quoteService.send(q.id, user), "Quote sent.")
                }
                disabled={!can(user, "quotes.send")}
              >
                <PaperPlaneTilt /> Send quote
              </button>
            )}
          </>
        }
      />
      <Notice />
      <QuoteRequestBridge q={q} />
      <div className="qt-detail-grid">
        <main>
          <QuotePricingStory q={q} internal />
          <section className="qt-panel">
            <h2>Conditions & exclusions</h2>
            {q.conditions?.map((x) => (
              <p className="qt-condition" key={x}>
                <WarningCircle /> {x}
              </p>
            ))}
            {q.exclusions?.map((x) => (
              <p key={x}>• {x}</p>
            ))}
            <h3>Buyer message</h3>
            <p>{q.buyerMessage}</p>
          </section>
          <section className="qt-panel">
            <h2>Negotiation</h2>
            {q.negotiation?.map((n) => (
              <article
                className={`qt-message ${n.internal ? "internal" : ""}`}
                key={n.id}
              >
                <header>
                  <strong>{n.author}</strong>
                  <span>
                    {n.role} · {date(n.date)}
                  </span>
                </header>
                <p>{n.message}</p>
                {n.proposedAmount && (
                  <strong>
                    Proposed: {formatQuoteMoney(n.proposedAmount)}
                  </strong>
                )}
              </article>
            ))}
            <div className="qt-compose">
              <textarea
                placeholder="Add a negotiation message or internal note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <input
                type="number"
                placeholder="Proposed amount in cents"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                onClick={() => {
                  if (!note) return;
                  act(
                    () =>
                      quoteService.addNegotiation(
                        q.id,
                        note,
                        amount,
                        user,
                        false,
                      ),
                    "Message added.",
                  );
                  setNote("");
                  setAmount("");
                }}
              >
                Share message
              </button>
            </div>
          </section>
        </main>
        <aside>
          <section className="qt-panel">
            <h2>Approval chain</h2>
            {q.approvers?.length ? (
              q.approvers.map((a) => (
                <article className="qt-approval" key={a.id}>
                  <div>
                    <strong>{a.type}</strong>
                    <small>{a.approver}</small>
                  </div>
                  <Status value={a.status} />
                  {a.status === "Pending" && (
                    <div>
                      <button
                        onClick={() =>
                          act(
                            () =>
                              quoteService.decideApproval(
                                q.id,
                                a.type,
                                "Approved",
                                "Approved in prototype review.",
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
                              quoteService.decideApproval(
                                q.id,
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
              <p>No approval request yet.</p>
            )}
          </section>
          <section className="qt-panel">
            <h2>Rights & safeguards</h2>
            <Status value={q.rightsSummary?.eligibility || "Review required"} />
            <p>Rights snapshot v{q.rightsSummary?.rightsVersion || "—"}</p>
            <small>
              Rights and pricing are rechecked before sending. Protected
              delivery remains a separate post-contract workflow.
            </small>
          </section>
          <section className="qt-panel">
            <h2>Lifecycle</h2>
            <p>
              Created {date(q.createdAt)} by {q.createdBy}
            </p>
            <p>Valid until {date(q.validUntil)}</p>
            <p>Sent {date(q.sentAt)}</p>
            <p>Accepted {date(q.acceptedAt)}</p>
            <p>Contract readiness: {q.futureWorkflow?.contractReadiness}</p>
            <p>Invoice readiness: {q.futureWorkflow?.invoiceReadiness}</p>
          </section>
        </aside>
      </div>
    </section>
  );
}

function BuyerQuotes({ navigate }) {
  const { user } = useAuth();
  const quotes = quoteService
    .getQuotes(user)
    .filter(
      (q) =>
        QUOTE_STATUSES[q.status]?.buyerVisible ||
        [
          "Accepted",
          "Declined",
          "Expired",
          "Buyer Revision Requested",
        ].includes(q.status),
    );
  return (
    <section className="qt-page">
      <Header
        eyebrow="Licensing workspace"
        title="My Quotes"
        text="Review buyer-safe commercial terms and respond to active quotes."
      />
      <Notice />
      <div className="qt-buyer-grid">
        {quotes.map((q) => (
          <article className="qt-buyer-card" key={q.id}>
            <div>
              <Status
                value={QUOTE_STATUSES[q.status]?.buyerLabel || q.status}
              />
              <small>{q.reference}</small>
            </div>
            <h2>{q.trackTitle}</h2>
            <p>{q.project}</p>
            <strong>
              {q.minimum != null && q.maximum != null
                ? `${formatQuoteMoney(q.minimum)}–${formatQuoteMoney(q.maximum)}`
                : formatQuoteMoney(q.total)}
            </strong>
            <small>Valid until {date(q.validUntil)}</small>
            <button
              className="qt-primary"
              onClick={() => selectQuote(q.id, navigate, "buyer-quote")}
            >
              Review quote <ArrowRight />
            </button>
          </article>
        ))}
      </div>
      {!quotes.length && (
        <div className="qt-panel qt-empty">
          No buyer-visible quotes are available for this account.
        </div>
      )}
    </section>
  );
}

function BuyerQuote({ navigate, showToast }) {
  const { user } = useAuth();
  const [rev, setRev] = useState(0);
  const [mode, setMode] = useState(null);
  const [text, setText] = useState("");
  const [budget, setBudget] = useState("");
  const q = quoteService.getQuote(
    localStorage.getItem(SELECTED_QUOTE_KEY) || "",
  );
  if (!q || q.buyerId !== user?.id)
    return (
      <section className="qt-page">
        <button className="qt-back" onClick={() => navigate("buyer-quotes")}>
          <ArrowLeft /> My quotes
        </button>
        <div className="qt-panel">
          This quote is not available to your account.
        </div>
      </section>
    );
  const respond = (type) => {
    const r = quoteService.respond(
      q.id,
      type,
      { message: text, requestedBudget: budget },
      user,
    );
    showToast(r.message || `Quote ${type.toLowerCase()}.`);
    setMode(null);
    setRev(rev + 1);
  };
  return (
    <section className="qt-page" key={rev}>
      <button className="qt-back" onClick={() => navigate("buyer-quotes")}>
        <ArrowLeft /> My quotes
      </button>
      <Header
        eyebrow={q.reference}
        title={`${q.trackTitle} for ${q.project}`}
        text={`Prepared for ${q.organization}. Valid until ${date(q.validUntil)}.`}
        actions={
          <button onClick={() => navigate("quote-print")}>
            <Printer /> Print view
          </button>
        }
      />
      <Notice />
      <QuoteRequestBridge q={q} />
      <div className="qt-buyer-detail">
        <main>
          <QuotePricingStory q={q} />
          <section className="qt-panel">
            <h2>Conditions</h2>
            {q.conditions?.map((x) => (
              <p className="qt-condition" key={x}>
                <WarningCircle /> {x}
              </p>
            ))}
            <p>{q.buyerMessage}</p>
            <small>
              Acceptance records commercial intent only. It does not transfer
              rights, complete payment, or unlock protected master audio.
            </small>
          </section>
        </main>
        <aside className="qt-panel">
          <h2>Your response</h2>
          <button className="qt-full" onClick={() => downloadQuote(q)}>
            <DownloadSimple /> Download quote summary
          </button>
          <button className="qt-full" onClick={() => navigate("quote-print")}>
            <Printer /> Print or save as PDF
          </button>
          {["Sent", "Viewed", "Buyer Revision Requested"].includes(q.status) ? (
            <>
              <button
                className="qt-primary qt-full"
                onClick={() => setMode("Accepted")}
              >
                <CheckCircle /> Accept quote
              </button>
              <button
                className="qt-full"
                onClick={() => setMode("Change Request")}
              >
                <CurrencyDollar /> Request changes
              </button>
              <button
                className="qt-danger qt-full"
                onClick={() => setMode("Declined")}
              >
                <XCircle /> Decline
              </button>
              {mode && (
                <div className="qt-response">
                  <h3>{mode}</h3>
                  {mode !== "Accepted" && (
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Add a required reason or requested change"
                    />
                  )}
                  {mode === "Change Request" && (
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Requested budget in cents"
                    />
                  )}
                  <button
                    className="qt-primary"
                    disabled={mode !== "Accepted" && !text}
                    onClick={() => respond(mode)}
                  >
                    Confirm {mode.toLowerCase()}
                  </button>
                  <button onClick={() => setMode(null)}>Cancel</button>
                </div>
              )}
            </>
          ) : q.status === "Accepted" ? (
            <div className="qt-complete qt-contract-ready">
              <CheckCircle />
              <strong>Quote accepted</strong>
              <p>Commercial intent is recorded. Contract preparation is the next separate stage.</p>
              <button
                className="qt-primary qt-full"
                onClick={() => {
                  const result = quoteService.proceedToContract(q.id, user);
                  showToast(result.message || "Contract preparation opened.");
                  if (result.ok) navigate("buyer-contracts");
                }}
              >
                Proceed to contract <ArrowRight />
              </button>
            </div>
          ) : (
            <div className="qt-complete">
              <CheckCircle />
              <strong>Response recorded</strong>
              <p>Status: {q.status}</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function PricingRules({ navigate }) {
  const { user } = useAuth();
  const state = quoteService.getState();
  return (
    <section className="qt-page">
      <QuotesAdminNav
        navigate={navigate}
        active="admin-pricing-rules"
        user={user}
      />
      <Header
        eyebrow="Versioned governance"
        title="Pricing Models & Rules"
        text="Inspect demo inputs, review thresholds, and effective versions. Changes never rewrite historical calculations."
      />
      <Notice />
      {state.pricingModels.map((model) => (
        <section className="qt-panel" key={model.id}>
          <div className="qt-title-row">
            <div>
              <Status value={model.active ? "Active" : "Historical"} />
              <h2>{model.name}</h2>
            </div>
            <strong>v{model.version}</strong>
          </div>
          <p>
            Effective {date(model.effectiveFrom)}{" "}
            {model.effectiveUntil && `to ${date(model.effectiveUntil)}`}
          </p>
          <div className="qt-rule-grid">
            <div>
              <h3>Base rate categories</h3>
              {Object.entries(model.rules.baseRates || {}).map(([k, v]) => (
                <p key={k}>
                  <span>{k}</span>
                  <strong>
                    {formatQuoteMoney(v[0])}–{formatQuoteMoney(v[1])}
                  </strong>
                </p>
              ))}
            </div>
            <div>
              <h3>Approval controls</h3>
              <p>
                <span>Finance review from</span>
                <strong>
                  {formatQuoteMoney(
                    model.rules.approvalThresholds?.financeFrom,
                  )}
                </strong>
              </p>
              <p>
                <span>Senior review above</span>
                <strong>
                  {formatQuoteMoney(
                    model.rules.approvalThresholds?.seniorAbove,
                  )}
                </strong>
              </p>
              <p>
                <span>Exceptional discount</span>
                <strong>
                  {model.rules.approvalThresholds?.seniorDiscountAbove * 100 ||
                    0}
                  %
                </strong>
              </p>
              <p>
                <span>Full exclusivity</span>
                <strong>Manual approval</strong>
              </p>
            </div>
          </div>
        </section>
      ))}
    </section>
  );
}

function Analytics({ navigate }) {
  const { user } = useAuth();
  const a = quoteService.analytics();
  return (
    <section className="qt-page">
      <QuotesAdminNav
        navigate={navigate}
        active="admin-quotes-analytics"
        user={user}
      />
      <Header
        eyebrow="Commercial intelligence"
        title="Quote Analytics"
        text="Derived from local demo records; not financial reporting or accounting data."
      />
      <Notice />
      <div className="qt-metrics">
        <article>
          <span>Pipeline</span>
          <strong>{formatQuoteMoney(a.pipeline)}</strong>
        </article>
        <article>
          <span>Accepted</span>
          <strong>{formatQuoteMoney(a.acceptedValue)}</strong>
        </article>
        <article>
          <span>Conversion</span>
          <strong>{a.conversion}%</strong>
        </article>
        <article>
          <span>Average accepted</span>
          <strong>{formatQuoteMoney(a.average)}</strong>
        </article>
      </div>
      <section className="qt-panel">
        <h2>Lifecycle distribution</h2>
        {Object.entries(a.byStatus).map(([status, count]) => (
          <div className="qt-bar" key={status}>
            <span>{status}</span>
            <div>
              <i
                style={{ width: `${Math.max(4, (count / a.total) * 100)}%` }}
              />
            </div>
            <strong>{count}</strong>
          </div>
        ))}
      </section>
    </section>
  );
}

function PrintQuote({ navigate }) {
  const { user } = useAuth();
  const q = quoteService.getQuote(
    localStorage.getItem(SELECTED_QUOTE_KEY) || "quote-47",
  );
  const buyer = user?.userType === "buyer";
  if (!q || (buyer && q.buyerId !== user.id))
    return (
      <section className="qt-page">
        <div className="qt-panel">
          This print view is not available to your account.
        </div>
      </section>
    );
  const pricing = quotePricingContext(q);
  return (
    <section className="qt-print">
      <div className="qt-print-actions">
        <button onClick={() => navigate(buyer ? "buyer-quote" : "admin-quote")}>
          <ArrowLeft /> Back
        </button>
        <button onClick={() => window.print()}>
          <Printer /> Print
        </button>
      </div>
      <header>
        <span>beatmondo</span>
        <small>Licensing quote · prototype</small>
      </header>
      <h1>{q.trackTitle}</h1>
      <p>
        {q.project} · {q.organization}
      </p>
      <div className="qt-print-total">
        <span>{q.reference}</span>
        <strong>
          {q.minimum != null && q.maximum != null
            ? `${formatQuoteMoney(q.minimum)}–${formatQuoteMoney(q.maximum)}`
            : formatQuoteMoney(q.total)}
        </strong>
      </div>
      <dl className="qt-dl">
        <dt>Project type</dt>
        <dd>{pricing.projectType}</dd>
        <dt>Media</dt>
        <dd>{pricing.media}</dd>
        <dt>Territory</dt>
        <dd>{pricing.territory}</dd>
        <dt>Term</dt>
        <dd>{pricing.term}</dd>
        <dt>Exclusivity</dt>
        <dd>{pricing.exclusivity}</dd>
        <dt>Audience scale</dt>
        <dd>{pricing.scale}</dd>
        <dt>Rights involved</dt>
        <dd>{pricing.rightsInvolved}</dd>
        <dt>Requested files</dt>
        <dd>{pricing.files}</dd>
        <dt>Custom edit</dt>
        <dd>{pricing.customEdit}</dd>
        <dt>Valid until</dt>
        <dd>{date(q.validUntil)}</dd>
      </dl>
      <h2>Pricing breakdown</h2>
      <dl className="qt-dl">
        <dt>Base licence price</dt>
        <dd>{formatQuoteMoney(pricing.baseLicencePrice, q.currency)}</dd>
        <dt>Rush fee</dt>
        <dd>{formatQuoteMoney(pricing.rushFee, q.currency)}</dd>
        <dt>Add-ons</dt>
        <dd>{formatQuoteMoney(pricing.addOnsTotal, q.currency)}</dd>
        <dt>Taxes</dt>
        <dd>{formatQuoteMoney(pricing.tax, q.currency)}</dd>
        <dt>Discount</dt>
        <dd>{formatQuoteMoney(pricing.discount, q.currency)}</dd>
        <dt>Total</dt>
        <dd><strong>{formatQuoteMoney(pricing.total, q.currency)}</strong></dd>
      </dl>
      <h2>Conditions</h2>
      {q.conditions.map((x) => (
        <p key={x}>• {x}</p>
      ))}
      <p>{q.buyerMessage}</p>
      <footer>
        Fictional, non-binding prototype quote. Final license terms remain
        subject to rights confirmation, internal approval, contract completion,
        and any required payment.
      </footer>
    </section>
  );
}

export function renderQuoteView(view, props) {
  if (view === "admin-quotes") return <Dashboard {...props} />;
  if (view === "admin-quotes-new") return <CalculatorPage {...props} />;
  if (view === "admin-quote") return <QuoteDetail {...props} />;
  if (view === "admin-quotes-analytics") return <Analytics {...props} />;
  if (view === "admin-pricing-rules") return <PricingRules {...props} />;
  if (view === "buyer-quotes") return <BuyerQuotes {...props} />;
  if (view === "buyer-quote") return <BuyerQuote {...props} />;
  if (view === "quote-print") return <PrintQuote {...props} />;
  return null;
}
