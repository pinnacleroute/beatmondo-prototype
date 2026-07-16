import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bank,
  CaretRight,
  CheckCircle,
  CreditCard,
  CurrencyDollar,
  FileText,
  Funnel,
  Money,
  Printer,
  Receipt,
  Repeat,
  ShieldCheck,
  TrendUp,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  CHECKOUT_KEY,
  PAYMENT_STATUSES,
  SELECTED_INVOICE_KEY,
  SELECTED_PAYMENT_KEY,
} from "./paymentData.js";
import {
  calculateLicencePaymentReadiness,
  calculatePaymentDeliveryReadiness,
  formatPaymentMoney,
  paymentService,
} from "./paymentService.js";
import { contractService } from "../contracts/contractService.js";
import { expiringAccessService } from "../expiring-access/expiringAccessService.js";
import "./payments.css";

export const PAYMENT_VIEWS = new Set([
  "buyer-payments",
  "buyer-payment",
  "buyer-pay",
  "buyer-payment-success",
  "buyer-payment-failed",
  "buyer-payment-authentication",
  "buyer-payment-methods",
  "payment-receipt",
  "admin-payments",
  "admin-payment-detail",
  "admin-payment-reconciliation",
  "admin-refunds",
  "admin-credits",
  "admin-payment-analytics",
]);
const can = (u, p) =>
  u?.permissions?.includes("*") || u?.permissions?.includes(p);
const date = (v) =>
  v
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
        new Date(v),
      )
    : "—";
const Status = ({ value }) => (
  <span
    className={`pm-status pm-${String(value).toLowerCase().replaceAll(" ", "-")}`}
  >
    {value}
  </span>
);
const Notice = () => (
  <div className="pm-notice">
    <ShieldCheck />
    <span>
      <strong>Simulated licensing payment.</strong> No real processor, bank, tax
      service, accounting platform, card authorization, or fund movement is
      connected. Never enter real financial information.
    </span>
  </div>
);
const Separation = () => (
  <div className="pm-separation">
    <div>
      <strong>Platform Membership</strong>
      <span>
        Controls beatmondo access and uses separate membership invoices.
      </span>
    </div>
    <CaretRight />
    <div>
      <strong>Music Licence Payment</strong>
      <span>
        Pays a specific contract obligation without expanding licence terms or
        authorizing delivery.
      </span>
    </div>
  </div>
);
const Header = ({ eyebrow, title, text, actions }) => (
  <header className="pm-header">
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
    {actions && <div className="pm-actions">{actions}</div>}
  </header>
);
function selectInvoice(id, navigate, target = "buyer-payment") {
  localStorage.setItem(SELECTED_INVOICE_KEY, id);
  navigate(target);
}
function selectPayment(id, navigate, target = "admin-payment-detail") {
  localStorage.setItem(SELECTED_PAYMENT_KEY, id);
  navigate(target);
}

function BuyerDashboard({ navigate }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const invoices = paymentService.getInvoices(user);
  const transactions = paymentService.getTransactions(user);
  const credits = paymentService.getCredits(user);
  const list = invoices.filter(
    (i) =>
      filter === "All" ||
      (filter === "Open" &&
        ["Open", "Partially Paid", "Past Due"].includes(i.status)) ||
      filter === i.status,
  );
  const outstanding = invoices.reduce((n, i) => n + i.balanceDue, 0);
  return (
    <section className="pm-page">
      <Header
        eyebrow="Music licensing finance"
        title="Licence Payments"
        text="Review contract-linked invoices, payment attempts, receipts, refunds, and account credits separately from platform membership billing."
        actions={
          <button onClick={() => navigate("buyer-payment-methods")}>
            <CreditCard /> Payment methods
          </button>
        }
      />
      <Notice />
      <Separation />
      <div className="pm-metrics">
        <article>
          <span>Outstanding balance</span>
          <strong>{formatPaymentMoney(outstanding)}</strong>
          <small>
            {invoices.filter((i) => i.balanceDue > 0).length} open obligations
          </small>
        </article>
        <article>
          <span>Successful payments</span>
          <strong>
            {formatPaymentMoney(
              transactions
                .filter((t) => ["Succeeded", "Reconciled"].includes(t.status))
                .reduce((n, t) => n + t.amount, 0),
            )}
          </strong>
          <small>Licensing only</small>
        </article>
        <article>
          <span>Account credit</span>
          <strong>
            {formatPaymentMoney(
              credits.reduce((n, c) => n + c.remainingAmount, 0),
            )}
          </strong>
          <small>Eligible licensing invoices only</small>
        </article>
        <article>
          <span>Delivery readiness</span>
          <strong>Locked</strong>
          <small>Issued licence still required</small>
        </article>
      </div>
      <div className="pm-filter-row">
        {["All", "Open", "Paid", "Past Due", "Refunded"].map((f) => (
          <button
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
            key={f}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="pm-invoice-grid">
        {list.map((i) => (
          <article className="pm-invoice-card" key={i.id}>
            <div>
              <Status value={i.status} />
              <small>{i.reference}</small>
            </div>
            <h2>{i.project}</h2>
            <p>
              {i.track} · {i.invoiceType}
            </p>
            <dl>
              <dt>Total</dt>
              <dd>{formatPaymentMoney(i.total, i.currency)}</dd>
              <dt>Paid</dt>
              <dd>
                {formatPaymentMoney(i.amountPaid + i.creditApplied, i.currency)}
              </dd>
              <dt>Balance</dt>
              <dd>{formatPaymentMoney(i.balanceDue, i.currency)}</dd>
              <dt>Due</dt>
              <dd>{date(i.dueDate)}</dd>
            </dl>
            <small>
              {i.contractReference} · {i.paymentTerms}
            </small>
            <div className="pm-actions">
              <button onClick={() => selectInvoice(i.id, navigate)}>
                View invoice
              </button>
              {i.balanceDue > 0 &&
                ["Open", "Partially Paid", "Past Due"].includes(i.status) && (
                  <button
                    className="pm-primary"
                    onClick={() => selectInvoice(i.id, navigate, "buyer-pay")}
                  >
                    Pay now <ArrowRight />
                  </button>
                )}
            </div>
          </article>
        ))}
      </div>
      <section className="pm-panel">
        <h2>Recent payment activity</h2>
        {transactions.slice(0, 8).map((t) => (
          <article className="pm-list-row" key={t.id}>
            <div>
              <strong>{t.reference}</strong>
              <small>
                {t.paymentType} · {t.paymentMethodLabel}
              </small>
            </div>
            <strong>{formatPaymentMoney(t.amount, t.currency)}</strong>
            <Status
              value={PAYMENT_STATUSES[t.status]?.buyerLabel || t.status}
            />
          </article>
        ))}
      </section>
    </section>
  );
}

function InvoiceDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const invoice = paymentService.getInvoice(
    localStorage.getItem(SELECTED_INVOICE_KEY),
    user,
  );
  if (!invoice)
    return (
      <section className="pm-page">
        <div className="pm-panel">Licensing invoice not found.</div>
      </section>
    );
  const contract = contractService.getContract(invoice.contractId);
  const readiness = calculateLicencePaymentReadiness(contract);
  const delivery = calculatePaymentDeliveryReadiness(contract, null);
  const openReceipt = () => {
    try {
      const generated = expiringAccessService.generateExpiringAccess(
        {
          resourceType: "Financial document",
          resourceLabel: `${invoice.reference} receipt`,
          resourceId: `receipt-${invoice.id}`,
          relatedInvoiceId: invoice.id,
          relatedContractId: invoice.contractId,
          action: "VIEW",
        },
        user,
        {
          action: "VIEW",
          userId: user.id,
          organizationId: invoice.organizationId,
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
    <section className="pm-page">
      <button className="pm-back" onClick={() => navigate("buyer-payments")}>
        <ArrowLeft /> Licence payments
      </button>
      <Header
        eyebrow={invoice.reference}
        title={invoice.project}
        text={`${invoice.track} · ${invoice.contractReference} · ${invoice.invoiceType}`}
        actions={
          <button onClick={openReceipt} disabled={!invoice.amountPaid}>
            <Receipt /> Open receipt
          </button>
        }
      />
      <Notice />
      <Separation />
      <div className="pm-detail-grid">
        <main>
          <section className="pm-panel pm-invoice-paper">
            <header>
              <span>beatmondo</span>
              <small>LICENSING INVOICE · NOT A MEMBERSHIP INVOICE</small>
            </header>
            <h1>{invoice.reference}</h1>
            <div className="pm-title-row">
              <Status value={invoice.status} />
              <strong>
                {formatPaymentMoney(invoice.balanceDue, invoice.currency)} due
              </strong>
            </div>
            <dl className="pm-dl">
              <dt>Buyer</dt>
              <dd>{invoice.buyer}</dd>
              <dt>Organization</dt>
              <dd>{invoice.organization}</dd>
              <dt>Project</dt>
              <dd>{invoice.project}</dd>
              <dt>Track</dt>
              <dd>{invoice.track}</dd>
              <dt>Contract</dt>
              <dd>{invoice.contractReference}</dd>
              <dt>Issue date</dt>
              <dd>{date(invoice.issueDate)}</dd>
              <dt>Due date</dt>
              <dd>{date(invoice.dueDate)}</dd>
              <dt>Payment terms</dt>
              <dd>{invoice.paymentTerms}</dd>
            </dl>
            {invoice.lineItems.map((l) => (
              <div className="pm-line" key={l.id}>
                <span>{l.description}</span>
                <strong>{formatPaymentMoney(l.total, invoice.currency)}</strong>
              </div>
            ))}
            <div className="pm-total">
              <span>Total</span>
              <strong>
                {formatPaymentMoney(invoice.total, invoice.currency)}
              </strong>
            </div>
            <div className="pm-line">
              <span>Paid and credited</span>
              <strong>
                -
                {formatPaymentMoney(
                  invoice.amountPaid + invoice.creditApplied,
                  invoice.currency,
                )}
              </strong>
            </div>
            <div className="pm-total">
              <span>Balance due</span>
              <strong>
                {formatPaymentMoney(invoice.balanceDue, invoice.currency)}
              </strong>
            </div>
            <footer>
              This licensing invoice is a simulated commercial document and is
              not combined with platform-membership billing.
            </footer>
          </section>
        </main>
        <aside>
          <section className="pm-panel">
            <h2>Payment requirement</h2>
            <p>
              <strong>{readiness.status}</strong>
            </p>
            {readiness.blockers.map((b) => (
              <p className="pm-warning" key={b}>
                <WarningCircle /> {b}
              </p>
            ))}
            {invoice.balanceDue > 0 && (
              <button
                className="pm-primary pm-full"
                onClick={() => navigate("buyer-pay")}
              >
                Pay {formatPaymentMoney(invoice.balanceDue)}
              </button>
            )}
          </section>
          <section className="pm-panel">
            <h2>What happens after payment</h2>
            <p>
              Your payment will be recorded and licence readiness recalculated.
            </p>
            <p>
              <strong>Licence:</strong>{" "}
              {readiness.ready ? "Ready for separate generation" : "Not ready"}
            </p>
            <p>
              <strong>Delivery:</strong> {delivery.status}
            </p>
            <small>
              Payment never expands the signed usage and does not directly
              release protected master audio or stems.
            </small>
          </section>
        </aside>
      </div>
    </section>
  );
}

const defaultCheckout = {
  step: 1,
  method: "Card",
  cardNumber: "4242 4242 4242 4242",
  expiry: "12/30",
  cvc: "123",
  name: "Olivia Bennett",
  billingEmail: "billing@northstarpictures.com",
  address: "100 Production Avenue",
  country: "United States",
  taxId: "",
  purchaseOrder: "",
  creditId: "",
  creditAmount: 0,
  ack: [false, false, false, false],
  bankReference: "",
  transferDate: "",
  proofFile: "",
  idempotencyKey: "",
};
function Checkout({ navigate, showToast }) {
  const { user } = useAuth();
  const invoice = paymentService.getInvoice(
    localStorage.getItem(SELECTED_INVOICE_KEY),
    user,
  );
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHECKOUT_KEY) || "null");
      return {
        ...defaultCheckout,
        ...(saved || {}),
        idempotencyKey:
          saved?.idempotencyKey ||
          `bm_pay_idem_${Math.random().toString(36).slice(2, 8)}`,
      };
    } catch {
      return {
        ...defaultCheckout,
        idempotencyKey: `bm_pay_idem_${Math.random().toString(36).slice(2, 8)}`,
      };
    }
  });
  const methods = paymentService.getPaymentMethods(user);
  const credits = paymentService
    .getCredits(user)
    .filter(
      (c) =>
        c.status === "Active" &&
        c.eligibleInvoiceTypes.includes(invoice?.invoiceType),
    );
  if (!invoice)
    return (
      <section className="pm-page">
        <div className="pm-panel">Checkout invoice not found.</div>
      </section>
    );
  const eligibility = paymentService.validateEligibility(invoice, user);
  if (!eligibility.ok)
    return (
      <section className="pm-page pm-state-page">
        <WarningCircle />
        <Header
          eyebrow="Payment unavailable"
          title="This invoice cannot be paid yet"
          text={eligibility.message}
        />
        <Notice />
        <button onClick={() => navigate("buyer-payment")}>
          Return to invoice
        </button>
      </section>
    );
  const update = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    localStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify({
        ...next,
        cardNumber: next.cardNumber.slice(-4),
        cvc: "",
      }),
    );
  };
  const credit = credits.find((c) => c.id === form.creditId);
  const creditAmount = Math.min(
    Number(form.creditAmount || 0),
    credit?.remainingAmount || 0,
    invoice.balanceDue,
  );
  const charge = Math.max(0, invoice.balanceDue - creditAmount);
  const steps = ["Summary", "Billing", "Method", "Credit", "Review"];
  const submit = () => {
    if (form.method === "Bank transfer") {
      const r = paymentService.submitBankTransfer(
        invoice.id,
        {
          reference: form.bankReference,
          transferDate: form.transferDate,
          proofFile: form.proofFile,
          idempotencyKey: form.idempotencyKey,
        },
        user,
      );
      showToast(r.message || "Bank transfer submitted for reconciliation.");
      if (r.ok) {
        localStorage.removeItem(CHECKOUT_KEY);
        navigate("buyer-payment-success");
      }
      return;
    }
    const r = paymentService.processCard(
      invoice.id,
      {
        cardNumber: form.cardNumber,
        paymentMethodId: methods[0]?.id,
        creditId: form.creditId,
        creditAmount,
        purchaseOrder: form.purchaseOrder,
        idempotencyKey: form.idempotencyKey,
      },
      user,
    );
    showToast(r.message || "Licensing payment recorded.");
    if (r.authenticationRequired) navigate("buyer-payment-authentication");
    else if (r.ok) {
      localStorage.removeItem(CHECKOUT_KEY);
      navigate("buyer-payment-success");
    } else navigate("buyer-payment-failed");
  };
  return (
    <section className="pm-page">
      <button className="pm-back" onClick={() => navigate("buyer-payment")}>
        <ArrowLeft /> Invoice detail
      </button>
      <Header
        eyebrow="Licensing checkout"
        title={`Pay ${invoice.reference}`}
        text="A calm, contract-linked payment simulation. No real card or bank details are processed."
      />
      <Notice />
      <Separation />
      <div className="pm-checkout-progress">
        {steps.map((s, i) => (
          <button
            className={
              form.step === i + 1 ? "active" : form.step > i + 1 ? "done" : ""
            }
            onClick={() => update("step", i + 1)}
            key={s}
          >
            <span>{i + 1}</span>
            {s}
          </button>
        ))}
      </div>
      <div className="pm-checkout-layout">
        <main className="pm-panel">
          {form.step === 1 && (
            <>
              <h2>Payment summary</h2>
              <dl className="pm-dl">
                <dt>Invoice</dt>
                <dd>{invoice.reference}</dd>
                <dt>Contract</dt>
                <dd>{invoice.contractReference}</dd>
                <dt>Project</dt>
                <dd>{invoice.project}</dd>
                <dt>Track</dt>
                <dd>{invoice.track}</dd>
                <dt>Fee type</dt>
                <dd>{invoice.invoiceType}</dd>
                <dt>Balance</dt>
                <dd>{formatPaymentMoney(invoice.balanceDue)}</dd>
                <dt>Due</dt>
                <dd>{date(invoice.dueDate)}</dd>
              </dl>
              <div className="pm-warning">
                <WarningCircle /> After payment, licence generation still
                requires complete contract and rights conditions. Secure
                delivery is not yet available.
              </div>
            </>
          )}
          {form.step === 2 && (
            <>
              <h2>Billing details</h2>
              <div className="pm-form-grid">
                <label>
                  Billing contact
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </label>
                <label>
                  Company
                  <input value={invoice.organization} readOnly />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={form.billingEmail}
                    onChange={(e) => update("billingEmail", e.target.value)}
                  />
                </label>
                <label>
                  Address
                  <input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                  />
                </label>
                <label>
                  Country
                  <input
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                  />
                </label>
                <label>
                  Tax ID
                  <input
                    value={form.taxId}
                    onChange={(e) => update("taxId", e.target.value)}
                  />
                </label>
                <label>
                  Purchase order
                  <input
                    value={form.purchaseOrder}
                    onChange={(e) => update("purchaseOrder", e.target.value)}
                  />
                </label>
              </div>
              <small>
                Updates apply to future billing details only and never rewrite
                this historic invoice.
              </small>
            </>
          )}
          {form.step === 3 && (
            <>
              <h2>Payment method</h2>
              <div className="pm-method-grid">
                {["Card", "Bank transfer"].map((m) => (
                  <button
                    className={form.method === m ? "selected" : ""}
                    onClick={() => update("method", m)}
                    key={m}
                  >
                    {m === "Card" ? <CreditCard /> : <Bank />}
                    <strong>{m}</strong>
                    <small>
                      {m === "Card"
                        ? methods[0]
                          ? `${methods[0].brand} ending ${methods[0].last4}`
                          : "Use a test card"
                        : "Finance reconciliation required"}
                    </small>
                  </button>
                ))}
              </div>
              {form.method === "Card" ? (
                <div className="pm-form-grid">
                  <label className="pm-wide">
                    Test card number
                    <input
                      inputMode="numeric"
                      value={form.cardNumber}
                      onChange={(e) => update("cardNumber", e.target.value)}
                      autoComplete="off"
                    />
                    <small>
                      4242 succeeds · 0002 declines · 9995 insufficient · 3155
                      authentication
                    </small>
                  </label>
                  <label>
                    Expiry
                    <input
                      value={form.expiry}
                      onChange={(e) => update("expiry", e.target.value)}
                    />
                  </label>
                  <label>
                    CVC
                    <input
                      value={form.cvc}
                      onChange={(e) => update("cvc", e.target.value)}
                      autoComplete="off"
                    />
                  </label>
                </div>
              ) : (
                <div className="pm-bank">
                  <Bank />
                  <h3>Bank-transfer instructions</h3>
                  <p>
                    Account details are available through the approved
                    production finance configuration.
                  </p>
                  <p>
                    Use invoice reference <strong>{invoice.reference}</strong>{" "}
                    for {formatPaymentMoney(invoice.balanceDue)}{" "}
                    {invoice.currency}.
                  </p>
                  <div className="pm-form-grid">
                    <label>
                      Transfer date
                      <input
                        type="date"
                        value={form.transferDate}
                        onChange={(e) => update("transferDate", e.target.value)}
                      />
                    </label>
                    <label>
                      Buyer reference
                      <input
                        value={form.bankReference}
                        onChange={(e) =>
                          update("bankReference", e.target.value)
                        }
                      />
                    </label>
                    <label className="pm-wide">
                      Proof upload simulation
                      <input
                        type="file"
                        onChange={(e) =>
                          update("proofFile", e.target.files?.[0]?.name || "")
                        }
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
          {form.step === 4 && (
            <>
              <h2>Apply account credit</h2>
              {credits.length ? (
                credits.map((c) => (
                  <label className="pm-credit-choice" key={c.id}>
                    <input
                      type="radio"
                      name="credit"
                      checked={form.creditId === c.id}
                      onChange={() => {
                        update("creditId", c.id);
                        update(
                          "creditAmount",
                          Math.min(c.remainingAmount, invoice.balanceDue),
                        );
                      }}
                    />
                    <span>
                      <strong>
                        {c.reference} · {formatPaymentMoney(c.remainingAmount)}
                      </strong>
                      <small>
                        Expires {date(c.expiresAt)} · {c.reason}
                      </small>
                    </span>
                  </label>
                ))
              ) : (
                <p>No eligible licensing credit is available.</p>
              )}
              {form.creditId && (
                <label>
                  Amount to apply
                  <input
                    type="number"
                    value={form.creditAmount}
                    max={Math.min(
                      credit?.remainingAmount || 0,
                      invoice.balanceDue,
                    )}
                    onChange={(e) =>
                      update("creditAmount", Number(e.target.value))
                    }
                  />
                  <small>
                    Remaining card or bank charge: {formatPaymentMoney(charge)}
                  </small>
                </label>
              )}
              <button
                onClick={() => {
                  update("creditId", "");
                  update("creditAmount", 0);
                }}
              >
                Do not apply credit
              </button>
            </>
          )}
          {form.step === 5 && (
            <>
              <h2>Review and authorize</h2>
              <dl className="pm-dl">
                <dt>Invoice</dt>
                <dd>{invoice.reference}</dd>
                <dt>Contract</dt>
                <dd>{invoice.contractReference}</dd>
                <dt>Invoice balance</dt>
                <dd>{formatPaymentMoney(invoice.balanceDue)}</dd>
                <dt>Credit</dt>
                <dd>-{formatPaymentMoney(creditAmount)}</dd>
                <dt>Total charge</dt>
                <dd>
                  <strong>{formatPaymentMoney(charge)}</strong>
                </dd>
                <dt>Method</dt>
                <dd>{form.method}</dd>
                <dt>Billing contact</dt>
                <dd>
                  {form.name} · {form.billingEmail}
                </dd>
              </dl>
              {[
                "I authorize this simulated payment.",
                "I confirm the invoice and project details.",
                "I understand payment does not expand the agreed licence terms.",
                "I understand delivery depends on completed licensing conditions.",
              ].map((label, i) => (
                <label className="pm-check" key={label}>
                  <input
                    type="checkbox"
                    checked={form.ack[i]}
                    onChange={(e) =>
                      update(
                        "ack",
                        form.ack.map((v, n) =>
                          n === i ? e.target.checked : v,
                        ),
                      )
                    }
                  />
                  {label}
                </label>
              ))}
              <button
                className="pm-primary pm-large"
                disabled={
                  !form.ack.every(Boolean) ||
                  (form.method === "Bank transfer" &&
                    (!form.bankReference ||
                      !form.transferDate ||
                      !form.proofFile))
                }
                onClick={submit}
              >
                {form.method === "Bank transfer" ? (
                  <>
                    <Bank /> Submit for reconciliation
                  </>
                ) : (
                  <>
                    <CreditCard /> Pay {formatPaymentMoney(charge)}
                  </>
                )}
              </button>
            </>
          )}
        </main>
        <aside className="pm-panel pm-order">
          <span>Payment total</span>
          <strong>{formatPaymentMoney(charge)}</strong>
          <small>
            {invoice.currency} · {invoice.invoiceType}
          </small>
          <hr />
          <p>{invoice.project}</p>
          <p>{invoice.track}</p>
          <p>{invoice.contractReference}</p>
          <Status value={invoice.status} />
        </aside>
      </div>
      <div className="pm-wizard-nav">
        <button
          onClick={() => update("step", Math.max(1, form.step - 1))}
          disabled={form.step === 1}
        >
          Back
        </button>
        <span>
          Step {form.step} of {steps.length}
        </span>
        <button
          onClick={() => update("step", Math.min(5, form.step + 1))}
          disabled={form.step === 5}
        >
          Continue
        </button>
      </div>
    </section>
  );
}

function Authentication({ navigate, showToast }) {
  const { user } = useAuth();
  const payment = paymentService.getPayment(
    localStorage.getItem(SELECTED_PAYMENT_KEY),
    user,
  );
  if (!payment)
    return (
      <section className="pm-page">
        <div className="pm-panel">Authentication record not found.</div>
      </section>
    );
  const decide = (approved) => {
    const r = paymentService.authenticate(payment.id, approved, user);
    showToast(
      r.message || `Authentication ${approved ? "approved" : "declined"}.`,
    );
    navigate(r.ok ? "buyer-payment-success" : "buyer-payment-failed");
  };
  return (
    <section className="pm-page pm-state-page">
      <ShieldCheck />
      <Header
        eyebrow="Secure-payment simulation"
        title="Confirm this licensing payment"
        text="This is a mock authentication challenge, not a bank or card-provider screen."
      />
      <Notice />
      <section className="pm-panel">
        <dl className="pm-dl">
          <dt>Merchant</dt>
          <dd>beatmondo Licensing (prototype)</dd>
          <dt>Amount</dt>
          <dd>{formatPaymentMoney(payment.amount, payment.currency)}</dd>
          <dt>Card</dt>
          <dd>{payment.paymentMethodLabel}</dd>
          <dt>Invoice</dt>
          <dd>{payment.invoiceId}</dd>
        </dl>
        <div className="pm-actions">
          <button className="pm-primary" onClick={() => decide(true)}>
            Approve simulated payment
          </button>
          <button className="pm-danger" onClick={() => decide(false)}>
            Decline
          </button>
        </div>
      </section>
    </section>
  );
}
function PaymentSuccess({ navigate }) {
  const { user } = useAuth();
  const p = paymentService.getPayment(
    localStorage.getItem(SELECTED_PAYMENT_KEY),
    user,
  );
  const invoice = p && paymentService.getInvoice(p.invoiceId, user);
  const receipt = paymentService
    .getReceipts(user)
    .find((r) => r.paymentId === p?.id);
  return (
    <section className="pm-page pm-state-page">
      <CheckCircle />
      <Header
        eyebrow={
          p?.status === "Pending Reconciliation"
            ? "Transfer submitted"
            : "Payment recorded"
        }
        title={
          p?.status === "Pending Reconciliation"
            ? "Finance review is pending"
            : "Licensing payment successful"
        }
        text="The transaction is recorded separately from membership billing, licence issuance, and delivery."
      />
      <Notice />
      <section className="pm-panel">
        <dl className="pm-dl">
          <dt>Payment</dt>
          <dd>{p?.reference}</dd>
          <dt>Invoice</dt>
          <dd>{invoice?.reference}</dd>
          <dt>Amount</dt>
          <dd>{formatPaymentMoney(p?.amount, p?.currency)}</dd>
          <dt>Method</dt>
          <dd>{p?.paymentMethodLabel}</dd>
          <dt>Status</dt>
          <dd>{p?.status}</dd>
          <dt>Remaining balance</dt>
          <dd>{formatPaymentMoney(invoice?.balanceDue, p?.currency)}</dd>
          <dt>Receipt</dt>
          <dd>
            {receipt?.reference || "Generated after successful reconciliation"}
          </dd>
        </dl>
        <p>
          <strong>Next step:</strong>{" "}
          {invoice?.balanceDue
            ? "Complete the remaining obligation."
            : "Licence readiness will be reviewed. Delivery remains locked until an issued licence and delivery policy exist."}
        </p>
        <div className="pm-actions">
          {receipt && (
            <button onClick={() => navigate("payment-receipt")}>
              <Receipt /> View receipt
            </button>
          )}
          <button
            className="pm-primary"
            onClick={() => navigate("buyer-payments")}
          >
            Return to payments
          </button>
        </div>
      </section>
    </section>
  );
}
function PaymentFailed({ navigate }) {
  const { user } = useAuth();
  const p = paymentService.getPayment(
    localStorage.getItem(SELECTED_PAYMENT_KEY),
    user,
  );
  return (
    <section className="pm-page pm-state-page">
      <XCircle />
      <Header
        eyebrow="Payment not completed"
        title="The licensing payment failed"
        text={
          p?.failureMessage ||
          "Choose another simulated payment method or retry safely."
        }
      />
      <Notice />
      <section className="pm-panel">
        <dl className="pm-dl">
          <dt>Attempt</dt>
          <dd>{p?.reference}</dd>
          <dt>Safe reason</dt>
          <dd>{p?.failureCode || "PROCESSING_ERROR"}</dd>
          <dt>Invoice</dt>
          <dd>{p?.invoiceId}</dd>
          <dt>Delivery</dt>
          <dd>Disabled</dd>
        </dl>
        <div className="pm-actions">
          <button
            className="pm-primary"
            onClick={() => {
              localStorage.removeItem(CHECKOUT_KEY);
              navigate("buyer-pay");
            }}
          >
            Retry with a new attempt
          </button>
          <button onClick={() => navigate("buyer-payment-methods")}>
            Change method
          </button>
          <button onClick={() => navigate("contact")}>Contact finance</button>
        </div>
      </section>
    </section>
  );
}
function PaymentMethods({ navigate }) {
  const { user } = useAuth();
  const methods = paymentService.getPaymentMethods(user);
  return (
    <section className="pm-page">
      <button className="pm-back" onClick={() => navigate("buyer-payments")}>
        <ArrowLeft /> Licence payments
      </button>
      <Header
        eyebrow="Tokenized display only"
        title="Payment Methods"
        text="Existing method summaries may be selected for licensing checkout, but membership and licensing transaction ledgers remain separate."
      />
      <Notice />
      <div className="pm-method-grid">
        {methods.map((m) => (
          <article className="pm-panel" key={m.id}>
            <CreditCard />
            <h2>
              {m.brand} ending {m.last4}
            </h2>
            <p>
              Expires {m.expMonth}/{m.expYear}
            </p>
            <Status value={m.status} />
            <small>{m.scope}</small>
          </article>
        ))}
        <article className="pm-panel">
          <Bank />
          <h2>Bank transfer</h2>
          <p>
            Instructions use placeholders and require finance reconciliation.
          </p>
        </article>
      </div>
    </section>
  );
}
function ReceiptView({ navigate }) {
  const { user } = useAuth();
  const paymentId = localStorage.getItem(SELECTED_PAYMENT_KEY);
  const receipts = paymentService.getReceipts(user);
  const receipt =
    receipts.find((r) => r.paymentId === paymentId) || receipts[0];
  if (!receipt)
    return (
      <section className="pm-page">
        <div className="pm-panel">No successful receipt is available.</div>
      </section>
    );
  return (
    <section className="pm-receipt">
      <div className="pm-print-actions">
        <button
          onClick={() =>
            navigate(
              user.userType === "buyer"
                ? "buyer-payments"
                : "admin-payment-detail",
            )
          }
        >
          <ArrowLeft /> Back
        </button>
        <button onClick={() => window.print()}>
          <Printer /> Print
        </button>
      </div>
      <header>
        <span>beatmondo</span>
        <small>PAYMENT RECEIPT · NOT A TAX INVOICE</small>
      </header>
      <h1>{receipt.reference}</h1>
      <p>
        {receipt.organization} · {receipt.buyer}
      </p>
      <div className="pm-receipt-total">
        <span>Payment received</span>
        <strong>{formatPaymentMoney(receipt.amount, receipt.currency)}</strong>
      </div>
      <dl className="pm-dl">
        <dt>Payment</dt>
        <dd>{receipt.paymentReference}</dd>
        <dt>Invoice</dt>
        <dd>{receipt.invoiceReference}</dd>
        <dt>Contract</dt>
        <dd>{receipt.contractReference}</dd>
        <dt>Project</dt>
        <dd>{receipt.project}</dd>
        <dt>Track</dt>
        <dd>{receipt.track}</dd>
        <dt>Method</dt>
        <dd>{receipt.method}</dd>
        <dt>Date</dt>
        <dd>{date(receipt.date)}</dd>
        <dt>Credit applied</dt>
        <dd>{formatPaymentMoney(receipt.creditApplied)}</dd>
        <dt>Remaining balance</dt>
        <dd>{formatPaymentMoney(receipt.remainingBalance)}</dd>
      </dl>
      <footer>
        Simulated receipt for a music-licensing payment. This is not a
        membership invoice, tax invoice, bank confirmation, or payment-provider
        record.
      </footer>
    </section>
  );
}

function AdminDashboard({ navigate }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const a = paymentService.analytics();
  const txs = paymentService
    .getTransactions(user)
    .filter(
      (t) =>
        (status === "All" || t.status === status) &&
        `${t.reference} ${t.invoiceId} ${t.contractId} ${t.buyer} ${t.organization}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <section className="pm-page">
      <Header
        eyebrow="Finance operations"
        title="Licensing Payments"
        text="Monitor contract obligations, payment attempts, bank reconciliation, refunds, credits, and downstream readiness without mixing membership revenue."
        actions={
          <>
            {can(user, "payments.reconcile") && (
              <button onClick={() => navigate("admin-payment-reconciliation")}>
                <Bank /> Reconciliation
              </button>
            )}
            {can(user, "payments.request_refund") && (
              <button onClick={() => navigate("admin-refunds")}>
                <Repeat /> Refunds
              </button>
            )}
            {can(user, "payments.manage_credits") && (
              <button onClick={() => navigate("admin-credits")}>
                <Money /> Credits
              </button>
            )}
            {can(user, "payments.view_analytics") && (
              <button onClick={() => navigate("admin-payment-analytics")}>
                <TrendUp /> Analytics
              </button>
            )}
          </>
        }
      />
      <Notice />
      <Separation />
      <div className="pm-metrics">
        <article>
          <span>Total collected</span>
          <strong>{formatPaymentMoney(a.totalCollected)}</strong>
          <small>{a.successRate}% transaction success</small>
        </article>
        <article>
          <span>Outstanding</span>
          <strong>{formatPaymentMoney(a.outstanding)}</strong>
          <small>{formatPaymentMoney(a.pastDue)} past due</small>
        </article>
        <article>
          <span>Pending transfers</span>
          <strong>{a.pendingTransfers}</strong>
          <small>{a.reconciliationBacklog} reconciliation items</small>
        </article>
        <article>
          <span>Refunds and credits</span>
          <strong>{formatPaymentMoney(a.refundValue + a.creditValue)}</strong>
          <small>{a.failed} failed attempts</small>
        </article>
      </div>
      <section className="pm-panel">
        <div className="pm-toolbar">
          <label>
            Search payments
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Payment, invoice, contract, buyer…"
            />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              {Object.keys(PAYMENT_STATUSES).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="pm-table">
          <table>
            <thead>
              <tr>
                <th>Payment</th>
                <th>Buyer / project</th>
                <th>Contract / invoice</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.reference}</strong>
                    <small>{t.paymentType}</small>
                  </td>
                  <td>
                    <strong>{t.organization}</strong>
                    <small>
                      {t.buyer} · {t.projectId}
                    </small>
                  </td>
                  <td>
                    <strong>{t.contractId}</strong>
                    <small>{t.invoiceId}</small>
                  </td>
                  <td>{formatPaymentMoney(t.amount, t.currency)}</td>
                  <td>{t.paymentMethodLabel}</td>
                  <td>
                    <Status value={t.status} />
                  </td>
                  <td>{date(t.capturedAt || t.failedAt || t.initiatedAt)}</td>
                  <td>
                    <button
                      aria-label={`Open ${t.reference}`}
                      onClick={() => selectPayment(t.id, navigate)}
                    >
                      Open <ArrowRight />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
function AdminDetail({ navigate }) {
  const { user } = useAuth();
  const p = paymentService.getPayment(
    localStorage.getItem(SELECTED_PAYMENT_KEY),
    user,
  );
  if (!p)
    return (
      <section className="pm-page">
        <div className="pm-panel">Payment not found.</div>
      </section>
    );
  const invoice = paymentService.getInvoice(p.invoiceId, user);
  const state = paymentService.getState();
  const allocations = state.allocations.filter((a) => a.transactionId === p.id);
  const refunds = state.refunds.filter((r) => r.originalTransactionId === p.id);
  const receipt = state.receipts.find((r) => r.paymentId === p.id);
  return (
    <section className="pm-page">
      <button className="pm-back" onClick={() => navigate("admin-payments")}>
        <ArrowLeft /> Payments dashboard
      </button>
      <Header
        eyebrow={p.reference}
        title={`${formatPaymentMoney(p.amount, p.currency)} · ${p.status}`}
        text={`${p.organization} · ${invoice?.project} · ${invoice?.contractReference}`}
        actions={
          receipt && (
            <button onClick={() => navigate("payment-receipt")}>
              <Receipt /> Receipt
            </button>
          )
        }
      />
      <Notice />
      <div className="pm-detail-grid">
        <main>
          <section className="pm-panel">
            <div className="pm-title-row">
              <Status value={p.status} />
              <strong>{formatPaymentMoney(p.amount, p.currency)}</strong>
            </div>
            <dl className="pm-dl">
              <dt>Buyer</dt>
              <dd>{p.buyer}</dd>
              <dt>Organization</dt>
              <dd>{p.organization}</dd>
              <dt>Invoice</dt>
              <dd>
                {invoice?.reference} · {invoice?.status}
              </dd>
              <dt>Contract</dt>
              <dd>{invoice?.contractReference}</dd>
              <dt>Project</dt>
              <dd>{invoice?.project}</dd>
              <dt>Track</dt>
              <dd>{invoice?.track}</dd>
              <dt>Method</dt>
              <dd>{p.paymentMethodLabel}</dd>
              <dt>Failure</dt>
              <dd>
                {p.failureCode || "—"} {p.failureMessage}
              </dd>
              <dt>Authentication</dt>
              <dd>{p.authenticationStatus || "Not required"}</dd>
              <dt>Reconciled</dt>
              <dd>{date(p.reconciledAt)}</dd>
            </dl>
          </section>
          <section className="pm-panel">
            <h2>Allocation</h2>
            {allocations.map((a) => (
              <article className="pm-list-row" key={a.id}>
                <div>
                  <strong>{a.obligationId}</strong>
                  <small>
                    {a.invoiceId} · {a.reconciliationStatus}
                  </small>
                </div>
                <strong>{formatPaymentMoney(a.amount)}</strong>
              </article>
            ))}
            {!allocations.length && (
              <p>No successful allocation for this attempt.</p>
            )}
          </section>
          <section className="pm-panel">
            <h2>Refunds</h2>
            {refunds.map((r) => (
              <article className="pm-list-row" key={r.id}>
                <div>
                  <strong>{r.reference}</strong>
                  <small>{r.reason}</small>
                </div>
                <strong>{formatPaymentMoney(r.amount)}</strong>
                <Status value={r.status} />
              </article>
            ))}
            {!refunds.length && <p>No refund record.</p>}
          </section>
        </main>
        <aside>
          <section className="pm-panel">
            <h2>Dependencies</h2>
            <p>Invoice balance: {formatPaymentMoney(invoice?.balanceDue)}</p>
            <p>Contract: {invoice?.contractReference}</p>
            <p>Licence generation: recalculated from all obligations</p>
            <p>Delivery: always requires an issued licence</p>
          </section>
          <section className="pm-panel">
            <h2>Security metadata</h2>
            <p>Idempotency: {p.metadata.idempotencyKey}</p>
            <p>Stored card data: ending {p.metadata.cardLast4 || "—"} only</p>
            <p>
              Provider reference: {p.providerReference || "Manual workflow"}
            </p>
            <small>
              No full card number, CVC, or bank credential is stored.
            </small>
          </section>
        </aside>
      </div>
    </section>
  );
}
function Reconciliation({ navigate, showToast }) {
  const { user } = useAuth();
  const [rev, setRev] = useState(0);
  const [note, setNote] = useState("");
  const [manual, setManual] = useState({
    invoiceId: "invoice-lic-37",
    amount: 2800000,
    date: "2026-07-19",
    reference: "",
    method: "Bank transfer",
    evidence: "",
    internalNote: "",
    approver: user.name,
  });
  const state = paymentService.getState();
  const pending = state.transactions.filter(
    (t) => t.status === "Pending Reconciliation",
  );
  const act = (id, decision) => {
    const r = paymentService.reconcile(id, decision, note, user);
    showToast(r.message || `Transfer ${decision.toLowerCase()}.`);
    setRev(rev + 1);
    setNote("");
  };
  return (
    <section className="pm-page">
      <button className="pm-back" onClick={() => navigate("admin-payments")}>
        <ArrowLeft /> Payments dashboard
      </button>
      <Header
        eyebrow="Finance-controlled matching"
        title="Payment Reconciliation"
        text="Review proof, references, amounts, mismatches, and allocations before marking a bank transfer paid."
      />
      <Notice />
      <label className="pm-search">
        Required reconciliation note
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Document the evidence and matching decision…"
        />
      </label>
      {pending.map((t) => {
        const b = state.bankTransfers.find((x) => x.transactionId === t.id);
        const invoice = state.invoices.find((i) => i.id === t.invoiceId);
        return (
          <section className="pm-panel" key={t.id}>
            <div className="pm-title-row">
              <div>
                <Status value={t.status} />
                <h2>{t.reference}</h2>
              </div>
              <strong>{formatPaymentMoney(t.amount, t.currency)}</strong>
            </div>
            <dl className="pm-dl">
              <dt>Organization</dt>
              <dd>{t.organization}</dd>
              <dt>Invoice</dt>
              <dd>{invoice?.reference}</dd>
              <dt>Buyer reference</dt>
              <dd>{b?.buyerReference}</dd>
              <dt>Transfer date</dt>
              <dd>{date(b?.transferDate)}</dd>
              <dt>Proof</dt>
              <dd>{b?.proofFile || "Missing"}</dd>
              <dt>Proof status</dt>
              <dd>{b?.status}</dd>
            </dl>
            <div className="pm-actions">
              <button
                className="pm-primary"
                disabled={!note || !can(user, "payments.reconcile")}
                onClick={() => act(t.id, "Reconciled")}
              >
                Match and reconcile
              </button>
              <button
                disabled={!note || !can(user, "payments.reconcile")}
                onClick={() => act(t.id, "Information Required")}
              >
                Request information
              </button>
              <button
                className="pm-danger"
                disabled={!note || !can(user, "payments.reconcile")}
                onClick={() => act(t.id, "Rejected")}
              >
                Reject proof
              </button>
            </div>
          </section>
        );
      })}
      {!pending.length && (
        <div className="pm-panel pm-empty">
          No bank transfer is pending reconciliation.
        </div>
      )}
      {can(user, "payments.record_manual") && (
        <section className="pm-panel">
          <h2>Record manual payment</h2>
          <p>
            Requires evidence, an approver, and an internal note. Overpayments
            must use a separate credit or refund workflow.
          </p>
          <div className="pm-form-grid">
            <label>
              Licensing invoice
              <select
                value={manual.invoiceId}
                onChange={(e) =>
                  setManual((value) => ({
                    ...value,
                    invoiceId: e.target.value,
                    amount:
                      state.invoices.find((item) => item.id === e.target.value)
                        ?.balanceDue || 0,
                  }))
                }
              >
                {state.invoices
                  .filter((invoice) => invoice.balanceDue > 0)
                  .map((invoice) => (
                    <option value={invoice.id} key={invoice.id}>
                      {invoice.reference} — {invoice.organization}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Amount in cents
              <input
                type="number"
                value={manual.amount}
                onChange={(e) =>
                  setManual((value) => ({
                    ...value,
                    amount: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label>
              Payment date
              <input
                type="date"
                value={manual.date}
                onChange={(e) =>
                  setManual((value) => ({ ...value, date: e.target.value }))
                }
              />
            </label>
            <label>
              External reference
              <input
                value={manual.reference}
                onChange={(e) =>
                  setManual((value) => ({
                    ...value,
                    reference: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Method
              <select
                value={manual.method}
                onChange={(e) =>
                  setManual((value) => ({ ...value, method: e.target.value }))
                }
              >
                <option>Bank transfer</option>
                <option>Wire</option>
                <option>Check</option>
                <option>External payment</option>
                <option>Account adjustment</option>
              </select>
            </label>
            <label>
              Evidence reference
              <input
                value={manual.evidence}
                onChange={(e) =>
                  setManual((value) => ({
                    ...value,
                    evidence: e.target.value,
                  }))
                }
              />
            </label>
            <label className="pm-wide">
              Internal note
              <textarea
                value={manual.internalNote}
                onChange={(e) =>
                  setManual((value) => ({
                    ...value,
                    internalNote: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Approver
              <input value={manual.approver} readOnly />
            </label>
          </div>
          <button
            className="pm-primary"
            onClick={() => {
              const result = paymentService.recordManualPayment(
                manual.invoiceId,
                manual,
                user,
              );
              showToast(result.message || "Manual payment recorded.");
              if (result.ok) setRev((value) => value + 1);
            }}
          >
            Record reviewed payment
          </button>
        </section>
      )}
    </section>
  );
}
function Refunds({ navigate }) {
  const state = paymentService.getState();
  return (
    <section className="pm-page">
      <button className="pm-back" onClick={() => navigate("admin-payments")}>
        <ArrowLeft /> Payments dashboard
      </button>
      <Header
        eyebrow="Controlled financial adjustments"
        title="Refunds"
        text="Every refund remains linked to the captured payment and displays contract, licence, and delivery impact separately."
      />
      <Notice />
      <div className="pm-table">
        <table>
          <thead>
            <tr>
              <th>Refund</th>
              <th>Original payment</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Approvals</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {state.refunds.map((r) => (
              <tr key={r.id}>
                <td>{r.reference}</td>
                <td>{r.originalTransactionId}</td>
                <td>{r.reason}</td>
                <td>{formatPaymentMoney(r.amount, r.currency)}</td>
                <td>
                  <Status value={r.status} />
                </td>
                <td>
                  {r.approvals.map((a) => `${a.type}: ${a.status}`).join(" · ")}
                </td>
                <td>
                  <small>
                    Contract: {r.contractImpact}
                    <br />
                    Licence: {r.licenceImpact}
                    <br />
                    Delivery: {r.deliveryImpact}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Credits({ navigate }) {
  const state = paymentService.getState();
  return (
    <section className="pm-page">
      <button className="pm-back" onClick={() => navigate("admin-payments")}>
        <ArrowLeft /> Payments dashboard
      </button>
      <Header
        eyebrow="Organization-scoped ledger"
        title="Account Credits"
        text="Credits apply only to eligible licensing invoice types, within currency, organization, amount, and expiry limits."
      />
      <Notice />
      <div className="pm-invoice-grid">
        {state.credits.map((c) => (
          <article className="pm-panel" key={c.id}>
            <div className="pm-title-row">
              <Status value={c.status} />
              <strong>
                {formatPaymentMoney(c.remainingAmount, c.currency)}
              </strong>
            </div>
            <h2>{c.reference}</h2>
            <p>{c.reason}</p>
            <small>
              {c.organizationId} · expires {date(c.expiresAt)}
            </small>
            <p>Eligible: {c.eligibleInvoiceTypes.join(", ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function Analytics({ navigate }) {
  const a = paymentService.analytics();
  return (
    <section className="pm-page">
      <button className="pm-back" onClick={() => navigate("admin-payments")}>
        <ArrowLeft /> Payments dashboard
      </button>
      <Header
        eyebrow="Licensing-finance intelligence"
        title="Payment Analytics"
        text="Derived from local prototype transactions—not processor, bank, tax, accounting, or recognized-revenue reporting."
      />
      <Notice />
      <div className="pm-metrics">
        <article>
          <span>Successful volume</span>
          <strong>{formatPaymentMoney(a.successfulVolume)}</strong>
        </article>
        <article>
          <span>Failed volume</span>
          <strong>{formatPaymentMoney(a.failedVolume)}</strong>
        </article>
        <article>
          <span>Average payment</span>
          <strong>{formatPaymentMoney(a.average)}</strong>
        </article>
        <article>
          <span>Past due</span>
          <strong>{formatPaymentMoney(a.pastDue)}</strong>
        </article>
      </div>
      <div className="pm-two">
        <section className="pm-panel">
          <h2>Transaction states</h2>
          {Object.entries(a.byStatus).map(([s, n]) => (
            <div className="pm-bar" key={s}>
              <span>{s}</span>
              <div>
                <i
                  style={{
                    width: `${Math.max(4, (n / a.transactions) * 100)}%`,
                  }}
                />
              </div>
              <strong>{n}</strong>
            </div>
          ))}
        </section>
        <section className="pm-panel">
          <h2>Payment methods</h2>
          {Object.entries(a.byMethod).map(([s, n]) => (
            <div className="pm-bar" key={s}>
              <span>{s}</span>
              <div>
                <i
                  style={{
                    width: `${Math.max(4, (n / a.transactions) * 100)}%`,
                  }}
                />
              </div>
              <strong>{n}</strong>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

export function renderPaymentView(view, props) {
  if (view === "buyer-payments") return <BuyerDashboard {...props} />;
  if (view === "buyer-payment") return <InvoiceDetail {...props} />;
  if (view === "buyer-pay") return <Checkout {...props} />;
  if (view === "buyer-payment-authentication")
    return <Authentication {...props} />;
  if (view === "buyer-payment-success") return <PaymentSuccess {...props} />;
  if (view === "buyer-payment-failed") return <PaymentFailed {...props} />;
  if (view === "buyer-payment-methods") return <PaymentMethods {...props} />;
  if (view === "payment-receipt") return <ReceiptView {...props} />;
  if (view === "admin-payments") return <AdminDashboard {...props} />;
  if (view === "admin-payment-detail") return <AdminDetail {...props} />;
  if (view === "admin-payment-reconciliation")
    return <Reconciliation {...props} />;
  if (view === "admin-refunds") return <Refunds {...props} />;
  if (view === "admin-credits") return <Credits {...props} />;
  if (view === "admin-payment-analytics") return <Analytics {...props} />;
  return null;
}
