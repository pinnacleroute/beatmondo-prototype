import { useMemo, useState } from "react";
import {
  CheckCircle,
  CreditCard,
  FileText,
  LockKey,
  ShieldCheck,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import { buyerVerificationService } from "../verification/buyerVerificationService.js";
import {
  BILLING_FAQS,
  CHECKOUT_STORAGE_KEY,
  MEMBERSHIP_PLANS,
  MEMBERSHIP_STATUSES,
  MEMBERSHIP_STATUS_CONTENT,
  SELECTED_INVOICE_KEY,
  SELECTED_MEMBERSHIP_KEY,
} from "./membershipData.js";
import {
  calculateEffectiveAccess,
  calculateProration,
  entitlementService,
  formatMoney,
  membershipService,
} from "./membershipService.js";

export const MEMBERSHIP_VIEWS = new Set([
  "membership",
  "membership-plans",
  "membership-checkout",
  "membership-confirmation",
  "billing",
  "billing-payment-methods",
  "billing-invoices",
  "billing-invoice",
  "billing-subscription",
  "billing-cancel",
  "billing-reactivate",
  "billing-payment-failed",
  "admin-memberships",
  "admin-membership-detail",
]);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not scheduled";
const planPrice = (plan, interval) =>
  interval === "Annual" ? plan.annualPriceCents : plan.monthlyPriceCents;
const verificationFor = (user) =>
  user ? buyerVerificationService.getByUser(user.id) : null;
const statusClass = (status) =>
  `membership-status status-${String(status).toLowerCase().replaceAll(" ", "-")}`;

function MembershipStatusBadge({ status }) {
  return (
    <span className={statusClass(status)}>
      <span aria-hidden="true" />
      {status}
    </span>
  );
}
function Field({ label, children, hint }) {
  return (
    <label className="billing-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Money({ cents, currency = "USD" }) {
  return <>{formatMoney(cents, currency)}</>;
}
function EmptyBilling({ title, text, action, onAction }) {
  return (
    <div className="billing-empty">
      <CreditCard />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="gold-button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function BillingIntervalToggle({ value, onChange }) {
  return (
    <fieldset className="billing-interval" aria-label="Billing interval">
      <legend>Billing interval</legend>
      <button
        type="button"
        aria-pressed={value === "Monthly"}
        onClick={() => onChange("Monthly")}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={value === "Annual"}
        onClick={() => onChange("Annual")}
      >
        Annual <small>Save up to 17%</small>
      </button>
    </fieldset>
  );
}

function EligibilityNotice({ plan, user, verification, membership }) {
  if (
    membership?.planId === plan.id &&
    !["Cancelled", "Expired", "Free"].includes(membership.status)
  )
    return (
      <div className="eligibility-note current">
        <CheckCircle />
        Current plan
      </div>
    );
  if (!user)
    return (
      <div className="eligibility-note">
        <LockKey />
        Sign in or request access to continue.
      </div>
    );
  if (
    ["Rejected", "Suspended"].includes(verification?.status) &&
    plan.requiresVerification
  )
    return (
      <div className="eligibility-note blocked">
        <WarningCircle />
        Professional purchase is unavailable until buyer eligibility is
        restored.
      </div>
    );
  if (
    plan.id === "plan-vip" &&
    verification?.currentAccessTier !== "VIP Sync Access"
  )
    return (
      <div className="eligibility-note">
        <ShieldCheck />
        VIP selection opens an approval request; it does not grant VIP
        verification.
      </div>
    );
  if (
    plan.requiresVerification &&
    !["Approved", "Approved with Restrictions", "Reinstated"].includes(
      verification?.status,
    )
  )
    return (
      <div className="eligibility-note">
        <ShieldCheck />
        Checkout is available, but professional tools remain locked until
        verification approval.
      </div>
    );
  return (
    <div className="eligibility-note eligible">
      <CheckCircle />
      Eligible to continue.
    </div>
  );
}

export function MembershipPlans({ navigate, showToast }) {
  const { user } = useAuth();
  const [interval, setInterval] = useState("Annual");
  const [enterprise, setEnterprise] = useState(false);
  const verification = verificationFor(user);
  const membership = user
    ? membershipService.getCurrentMembership(user.id)
    : null;
  const choose = (plan) => {
    if (plan.id === "plan-enterprise") {
      setEnterprise(true);
      return;
    }
    if (
      ["Rejected", "Suspended"].includes(verification?.status) &&
      plan.requiresVerification
    ) {
      showToast(
        "Professional purchase is unavailable while buyer eligibility is restricted.",
      );
      navigate("buyer-verification");
      return;
    }
    if (!user) {
      window.localStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({ planId: plan.id, interval, pendingLogin: true }),
      );
      navigate("membership-checkout");
      return;
    }
    const result = membershipService.startCheckout(user, plan.id, interval);
    if (!result.ok) {
      showToast(result.message);
      if (membership) navigate("billing");
      return;
    }
    navigate("membership-checkout");
  };
  return (
    <section className="membership-page plans-page">
      <header className="billing-hero">
        <span className="eyebrow">Membership and service access</span>
        <h2>Choose the beatmondo access level that fits your sync work.</h2>
        <p>
          Membership controls platform access and service level. Track licences
          are quoted separately.
        </p>
        <BillingIntervalToggle value={interval} onChange={setInterval} />
      </header>
      <div className="plan-grid">
        {MEMBERSHIP_PLANS.map((plan) => {
          const price = planPrice(plan, interval);
          const annualSaving =
            plan.monthlyPriceCents && plan.annualPriceCents
              ? plan.monthlyPriceCents * 12 - plan.annualPriceCents
              : 0;
          const current =
            membership?.planId === plan.id &&
            !["Cancelled", "Expired", "Free"].includes(membership.status);
          return (
            <article
              className={`plan-card ${plan.recommended ? "recommended" : ""}`}
              key={plan.id}
            >
              {plan.recommended && (
                <span className="recommended-badge">Recommended</span>
              )}
              <span className="plan-audience">{plan.audience}</span>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="plan-price">
                {price === null ? (
                  <strong>Custom</strong>
                ) : (
                  <>
                    <strong>{formatMoney(price)}</strong>
                    <small>
                      {price
                        ? `/${interval === "Annual" ? "year" : "month"}`
                        : "Free"}
                    </small>
                  </>
                )}
                {interval === "Annual" && annualSaving > 0 && (
                  <em>Save {formatMoney(annualSaving)} annually</em>
                )}
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="plan-eligibility">
                <strong>Eligibility</strong>
                <span>{plan.eligibility}</span>
                <small>{plan.verificationRequirement}</small>
              </div>
              <EligibilityNotice
                plan={plan}
                user={user}
                verification={verification}
                membership={membership}
              />
              <button
                className={
                  plan.id === "plan-vip"
                    ? "vip-loop-button"
                    : plan.id === "plan-enterprise"
                      ? "outline-button"
                      : "gold-button"
                }
                disabled={current}
                onClick={() => choose(plan)}
              >
                {current
                  ? "Current Plan"
                  : plan.id === "plan-discovery"
                    ? "Start Discovery Access"
                    : plan.id === "plan-professional"
                      ? "Upgrade to Professional"
                      : plan.id === "plan-vip"
                        ? "Request VIP Sync Access"
                        : "Contact Enterprise Team"}
              </button>
            </article>
          );
        })}
      </div>
      <section className="billing-trust-note">
        <ShieldCheck />
        <div>
          <strong>Transparent membership boundaries</strong>
          <p>
            VIP approval is never automatic. Protected master audio, WAV
            masters, stems, and pre-approved terms require separate buyer,
            rights, project, and delivery approval.
          </p>
        </div>
      </section>
      <BillingFaqs />
      {enterprise && (
        <EnterpriseInquiry
          user={user}
          onClose={() => setEnterprise(false)}
          onComplete={() => {
            setEnterprise(false);
            showToast("Enterprise requirements submitted.");
          }}
        />
      )}
    </section>
  );
}

function BillingFaqs() {
  return (
    <section className="billing-faq">
      <span className="eyebrow">Membership and billing FAQ</span>
      <h3>Clear answers before you commit.</h3>
      {BILLING_FAQS.map(([question, answer]) => (
        <details key={question}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </section>
  );
}

function EnterpriseInquiry({ user, onClose, onComplete }) {
  const [form, setForm] = useState({
    company: user?.organization || "",
    contactName: user?.name || "",
    email: user?.email || "",
    organizationType: "Studio",
    seats: "10",
    licensingVolume: "30+ licences",
    requirements:
      "Central billing, custom seats, consolidated invoices, and account management.",
    preferredContact: "Email",
  });
  const [error, setError] = useState("");
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = () => {
    if (
      !form.company ||
      !/^\S+@\S+\.\S+$/.test(form.email) ||
      !form.requirements
    ) {
      setError(
        "Company, valid email, and organization requirements are required.",
      );
      return;
    }
    membershipService.createEnterpriseInquiry(user, form);
    onComplete();
  };
  return (
    <div
      className="billing-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enterprise-title"
    >
      <div className="billing-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <span className="eyebrow">Manual organization review</span>
        <h3 id="enterprise-title">Request Enterprise Access</h3>
        <p>
          No instant checkout is used. The licensing team will review
          requirements, verification, seats, terms, invoicing, and delivery
          policy.
        </p>
        {error && (
          <div className="billing-error" role="alert">
            {error}
          </div>
        )}
        <div className="billing-form-grid">
          <Field label="Organization">
            <input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
            />
          </Field>
          <Field label="Contact name">
            <input
              value={form.contactName}
              onChange={(e) => update("contactName", e.target.value)}
            />
          </Field>
          <Field label="Work email">
            <input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
          <Field label="Organization type">
            <select
              value={form.organizationType}
              onChange={(e) => update("organizationType", e.target.value)}
            >
              <option>Studio</option>
              <option>Network</option>
              <option>Trailer house</option>
              <option>Agency</option>
              <option>Streaming platform</option>
            </select>
          </Field>
          <Field label="Estimated seats">
            <input
              type="number"
              min="1"
              value={form.seats}
              onChange={(e) => update("seats", e.target.value)}
            />
          </Field>
          <Field label="Annual licensing volume">
            <select
              value={form.licensingVolume}
              onChange={(e) => update("licensingVolume", e.target.value)}
            >
              <option>1–12 licences</option>
              <option>13–30 licences</option>
              <option>30+ licences</option>
            </select>
          </Field>
          <Field label="Organization requirements">
            <textarea
              value={form.requirements}
              onChange={(e) => update("requirements", e.target.value)}
            />
          </Field>
        </div>
        <div className="modal-actions">
          <button className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button className="gold-button" onClick={submit}>
            Submit requirements
          </button>
        </div>
      </div>
    </div>
  );
}

const checkoutSteps = [
  "Plan Selection",
  "Billing Cycle",
  "Billing Details",
  "Payment Method",
  "Discount Code",
  "Order Review",
  "Confirmation",
];
function defaultPayment() {
  return {
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    postalCode: "",
  };
}

export function MembershipCheckout({ navigate, showToast }) {
  const { user } = useAuth();
  const verification = verificationFor(user);
  const pending = membershipService.getCheckout();
  const [checkout, setCheckout] = useState(() =>
    pending?.pendingLogin && user
      ? membershipService.startCheckout(user, pending.planId, pending.interval)
          .checkout
      : pending,
  );
  const [step, setStep] = useState(() =>
    Math.max(0, Math.min(5, (checkout?.step || 1) - 1)),
  );
  const [payment, setPayment] = useState(defaultPayment);
  const [paymentMethod, setPaymentMethod] = useState(checkout?.payment || null);
  const [discountInput, setDiscountInput] = useState(
    checkout?.discountCode || "",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  if (!user) return null;
  if (!checkout)
    return (
      <EmptyBilling
        title="No active checkout"
        text="Choose a membership plan to begin."
        action="View plans"
        onAction={() => navigate("membership-plans")}
      />
    );
  const plan = membershipService.getPlan(checkout.planId);
  const totals = membershipService.checkoutTotals(checkout, {
    vipEligible: verification?.currentAccessTier === "VIP Sync Access",
  });
  const persist = (values) => {
    const next = membershipService.saveCheckout({
      ...checkout,
      ...values,
      step: step + 1,
    });
    setCheckout(next);
    return next;
  };
  const next = () => {
    if (step === 2) {
      const b = checkout.billing;
      if (
        !b.name ||
        !/^\S+@\S+\.\S+$/.test(b.email) ||
        !b.country ||
        !b.address1 ||
        !b.city ||
        !b.postalCode
      ) {
        setError("Complete the required billing contact and address fields.");
        return;
      }
    }
    if (step === 3 && !paymentMethod) {
      setError("Add and validate a prototype payment method.");
      return;
    }
    setError("");
    persist({});
    setStep((value) => Math.min(5, value + 1));
  };
  const addPayment = async () => {
    setLoading(true);
    setError("");
    const result = await membershipService.processPayment(payment);
    setLoading(false);
    if (!result.ok) {
      membershipService.recordFailedCheckout(user, checkout, result);
      setError(result.message);
      return;
    }
    if (result.requiresAuthentication) {
      setAuthModal({
        ...result,
        payment: { ...payment },
        amount: totals.totalCents,
      });
      return;
    }
    setPaymentMethod(result.method);
    persist({ payment: result.method });
    showToast(
      `Prototype ${result.method.brand} ending ${result.method.last4} validated.`,
    );
  };
  const applyDiscount = () => {
    const result = membershipService.validateDiscount(
      discountInput,
      plan.id,
      checkout.interval,
      {
        vipEligible: verification?.currentAccessTier === "VIP Sync Access",
        admin: user.permissions?.includes("*"),
      },
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    persist({ discountCode: result.code });
    showToast(`${result.code} applied.`);
  };
  const complete = async (authenticationApproved = true) => {
    if (!checkout.termsAccepted) {
      setError(
        "Accept every membership, recurring billing, privacy, licensing-fee, verification, and delivery acknowledgement.",
      );
      return;
    }
    setError("");
    setLoading(true);
    const result = await membershipService.completeCheckout(
      user,
      verification,
      checkout,
      paymentMethod,
      authenticationApproved,
    );
    setLoading(false);
    setAuthModal(null);
    if (!result.ok) {
      setError(result.message || "Payment could not be completed.");
      return;
    }
    setConfirmation(result);
    setStep(6);
    window.localStorage.setItem(
      "beatmondo-last-membership-confirmation",
      JSON.stringify(result),
    );
    showToast("Membership checkout completed.");
  };
  const updateBilling = (key, value) =>
    persist({ billing: { ...checkout.billing, [key]: value } });
  const setInterval = (interval) => persist({ interval });
  return (
    <section className="membership-page checkout-page" aria-busy={loading}>
      <header>
        <span className="eyebrow">Secure billing simulation</span>
        <h2>{checkoutSteps[step]}</h2>
        <p>
          No real payment is processed. Full card numbers and CVC values are
          never persisted.
        </p>
      </header>
      <ol className="checkout-stepper" aria-label="Checkout progress">
        {checkoutSteps.map((label, index) => (
          <li
            key={label}
            className={
              index === step ? "active" : index < step ? "complete" : ""
            }
          >
            <span>{index < step ? <CheckCircle /> : index + 1}</span>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>
      {error && (
        <div className="billing-error" role="alert">
          <WarningCircle />
          {error}
        </div>
      )}
      <div className="checkout-layout">
        <div className="checkout-main">
          {step === 0 && (
            <CheckoutPlan
              plan={plan}
              interval={checkout.interval}
              navigate={navigate}
            />
          )}
          {step === 1 && (
            <CheckoutCycle
              plan={plan}
              interval={checkout.interval}
              setInterval={setInterval}
            />
          )}
          {step === 2 && (
            <BillingDetails form={checkout.billing} update={updateBilling} />
          )}
          {step === 3 && (
            <PaymentMethodForm
              values={payment}
              setValues={setPayment}
              method={paymentMethod}
              loading={loading}
              addPayment={addPayment}
            />
          )}
          {step === 4 && (
            <DiscountForm
              input={discountInput}
              setInput={setDiscountInput}
              applied={checkout.discountCode}
              apply={applyDiscount}
              remove={() => {
                setDiscountInput("");
                persist({ discountCode: "" });
              }}
            />
          )}
          {step === 5 && (
            <OrderReview
              checkout={checkout}
              plan={plan}
              totals={totals}
              paymentMethod={paymentMethod}
              verification={verification}
              updateTerms={(checked) => persist({ termsAccepted: checked })}
            />
          )}
          {step === 6 && (
            <CheckoutConfirmation
              result={confirmation}
              verification={verification}
              navigate={navigate}
            />
          )}
        </div>
        {step < 6 && (
          <CheckoutSummary
            plan={plan}
            checkout={checkout}
            totals={totals}
            paymentMethod={paymentMethod}
          />
        )}
      </div>
      {step < 6 && (
        <div className="checkout-actions">
          {step > 0 && (
            <button
              className="outline-button"
              onClick={() => setStep((value) => value - 1)}
            >
              Back
            </button>
          )}
          <button
            className="plain-button"
            onClick={() => {
              persist({ step: step + 1 });
              navigate("billing");
            }}
          >
            Save and Exit
          </button>
          {step < 5 && (
            <button className="gold-button" onClick={next}>
              Save and Continue
            </button>
          )}
          {step === 5 && (
            <button
              className="gold-button"
              disabled={loading}
              onClick={() => complete(true)}
            >
              {loading
                ? "Recording payment…"
                : `Confirm and Pay ${formatMoney(totals.totalCents)}`}
            </button>
          )}
        </div>
      )}
      {authModal && (
        <MockAuthentication
          amount={authModal.amount}
          last4={authModal.last4}
          onApprove={async () => {
            const result = await membershipService.processPayment(
              authModal.payment,
            );
            const method = {
              id: `pm-auth-${Date.now()}`,
              brand: "Visa",
              last4: authModal.last4,
              expiryMonth: Number(authModal.payment.expiry.split("/")[0]),
              expiryYear: 2029,
              cardholderName: authModal.payment.cardholderName,
              token: `pm_demo_auth_${Date.now()}`,
              default: true,
              status: "Valid",
              billingPostalCode: authModal.payment.postalCode,
            };
            setPaymentMethod(method);
            persist({ payment: method });
            setAuthModal(null);
            showToast("Mock secure authentication approved.");
          }}
          onDecline={() => {
            membershipService.recordFailedCheckout(user, checkout, {
              code: "authentication_declined",
              message: "Mock secure authentication was declined.",
            });
            setAuthModal(null);
            setError("Mock secure authentication was declined.");
          }}
        />
      )}
    </section>
  );
}

function CheckoutPlan({ plan, interval, navigate }) {
  return (
    <div className="checkout-card">
      <span className="plan-audience">Selected membership</span>
      <h3>{plan.name}</h3>
      <strong className="checkout-price">
        {formatMoney(planPrice(plan, interval))}{" "}
        <small>/{interval === "Annual" ? "year" : "month"}</small>
      </strong>
      <p>{plan.description}</p>
      <ul>
        {plan.features.map((item) => (
          <li key={item}>
            <CheckCircle />
            {item}
          </li>
        ))}
      </ul>
      <p>
        <strong>Activation:</strong> {plan.verificationRequirement}
      </p>
      <p>
        <strong>Cancellation:</strong> Standard cancellation applies at period
        end.
      </p>
      <button
        className="outline-button"
        onClick={() => navigate("membership-plans")}
      >
        Change plan
      </button>
    </div>
  );
}
function CheckoutCycle({ plan, interval, setInterval }) {
  const annualSaving = plan.monthlyPriceCents * 12 - plan.annualPriceCents;
  const renew = new Date();
  interval === "Annual"
    ? renew.setFullYear(renew.getFullYear() + 1)
    : renew.setMonth(renew.getMonth() + 1);
  return (
    <div className="checkout-card">
      <h3>Choose a billing cycle</h3>
      <BillingIntervalToggle value={interval} onChange={setInterval} />
      <div className="cycle-comparison">
        <article>
          <span>Amount due today</span>
          <strong>{formatMoney(planPrice(plan, interval))}</strong>
        </article>
        <article>
          <span>Renewal preview</span>
          <strong>{formatDate(renew)}</strong>
        </article>
        <article>
          <span>Annual saving</span>
          <strong>
            {interval === "Annual"
              ? formatMoney(annualSaving)
              : "Choose annual"}
          </strong>
        </article>
        <article>
          <span>Auto-renewal</span>
          <strong>Enabled</strong>
        </article>
      </div>
    </div>
  );
}
function BillingDetails({ form, update }) {
  return (
    <div className="checkout-card">
      <h3>Billing contact and address</h3>
      <p>
        Changes apply to future invoices only; historic invoice snapshots stay
        unchanged.
      </p>
      <div className="billing-form-grid">
        <Field label="Billing contact name">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Company">
          <input
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
          />
        </Field>
        <Field label="Billing email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>
        <Field label="Country">
          <select
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
          >
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Australia</option>
            <option>India</option>
            <option>France</option>
            <option>Germany</option>
          </select>
        </Field>
        <Field label="Address line 1">
          <input
            value={form.address1}
            onChange={(e) => update("address1", e.target.value)}
          />
        </Field>
        <Field label="Address line 2">
          <input
            value={form.address2}
            onChange={(e) => update("address2", e.target.value)}
          />
        </Field>
        <Field label="City">
          <input
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </Field>
        <Field label="State or region">
          <input
            value={form.region}
            onChange={(e) => update("region", e.target.value)}
          />
        </Field>
        <Field label="Postal code">
          <input
            value={form.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
          />
        </Field>
        <Field label="Tax or VAT ID" hint="Optional">
          <input
            value={form.taxId}
            onChange={(e) => update("taxId", e.target.value)}
          />
        </Field>
        <Field label="Purchase order" hint="Optional">
          <input
            value={form.purchaseOrder}
            onChange={(e) => update("purchaseOrder", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
function PaymentMethodForm({ values, setValues, method, loading, addPayment }) {
  const update = (key, value) => setValues({ ...values, [key]: value });
  const formatCard = (value) =>
    value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  return (
    <div className="checkout-card">
      <h3>Prototype payment method</h3>
      <div className="prototype-note">
        <LockKey />
        <span>
          Use only documented test numbers. This form is not connected to a
          payment provider.
        </span>
      </div>
      {method ? (
        <div className="validated-method">
          <CheckCircle />
          <strong>
            {method.brand} ending {method.last4}
          </strong>
          <span>
            Expires {String(method.expiryMonth).padStart(2, "0")}/
            {method.expiryYear}
          </span>
        </div>
      ) : (
        <>
          <div className="billing-form-grid">
            <Field label="Cardholder name">
              <input
                autoComplete="cc-name"
                value={values.cardholderName}
                onChange={(e) => update("cardholderName", e.target.value)}
              />
            </Field>
            <Field label="Card number">
              <input
                inputMode="numeric"
                autoComplete="cc-number"
                value={formatCard(values.cardNumber)}
                onChange={(e) => update("cardNumber", e.target.value)}
                placeholder="4242 4242 4242 4242"
              />
            </Field>
            <Field label="Expiry">
              <input
                autoComplete="cc-exp"
                value={values.expiry}
                onChange={(e) => update("expiry", e.target.value)}
                placeholder="12/29"
              />
            </Field>
            <Field label="CVC">
              <input
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength="4"
                value={values.cvc}
                onChange={(e) =>
                  update("cvc", e.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
            <Field label="Billing postal code">
              <input
                value={values.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
              />
            </Field>
          </div>
          <button
            className="gold-button"
            disabled={loading}
            onClick={addPayment}
          >
            {loading ? "Validating…" : "Validate prototype card"}
          </button>
        </>
      )}
      <div className="test-card-list">
        <span>
          <strong>Success</strong> 4242 4242 4242 4242
        </span>
        <span>
          <strong>Declined</strong> 4000 0000 0000 0002
        </span>
        <span>
          <strong>Insufficient funds</strong> 4000 0000 0000 9995
        </span>
        <span>
          <strong>Authentication required</strong> 4000 0025 0000 3155
        </span>
      </div>
    </div>
  );
}
function DiscountForm({ input, setInput, applied, apply, remove }) {
  return (
    <div className="checkout-card">
      <h3>Discount code</h3>
      <p>
        Codes are validated against plan, interval, eligibility, expiry, usage
        limits, and invitation controls.
      </p>
      <div className="discount-entry">
        <input
          aria-label="Discount code"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="FOUNDING10"
        />
        <button className="gold-button" onClick={apply}>
          Apply code
        </button>
      </div>
      {applied && (
        <div className="discount-applied">
          <CheckCircle />
          <strong>{applied}</strong>
          <span>Discount applied to this checkout.</span>
          <button onClick={remove}>Remove</button>
        </div>
      )}
      <ul className="discount-help">
        <li>
          <strong>FOUNDING10</strong> — 10% on paid plans
        </li>
        <li>
          <strong>VIP20</strong> — 20% first VIP period for eligible buyers
        </li>
        <li>
          <strong>ANNUAL100</strong> — $100 off annual Professional
        </li>
        <li>
          <strong>PARTNER100</strong> — invitation-controlled complimentary
          access
        </li>
      </ul>
    </div>
  );
}
function OrderReview({
  checkout,
  plan,
  totals,
  paymentMethod,
  verification,
  updateTerms,
}) {
  const labels = [
    "I accept the membership terms and cancellation policy.",
    "I authorize recurring prototype billing and auto-renewal.",
    "I acknowledge the privacy policy.",
    "I understand track licence fees are separate.",
    "I understand professional access depends on buyer verification.",
    "I understand WAV master and stem delivery require separate approval.",
  ];
  const [checks, setChecks] = useState(
    labels.map(() => Boolean(checkout.termsAccepted)),
  );
  const toggle = (index, value) => {
    const next = checks.map((item, key) => (key === index ? value : item));
    setChecks(next);
    updateTerms(next.every(Boolean));
  };
  return (
    <div className="checkout-card">
      <h3>Review your order</h3>
      <div className="review-facts">
        <span>
          Plan<strong>{plan.name}</strong>
        </span>
        <span>
          Billing interval<strong>{checkout.interval}</strong>
        </span>
        <span>
          Payment method
          <strong>
            {paymentMethod?.brand} ending {paymentMethod?.last4}
          </strong>
        </span>
        <span>
          Billing contact
          <strong>
            {checkout.billing.name} · {checkout.billing.email}
          </strong>
        </span>
        <span>
          Verification<strong>{verification?.status || "Not started"}</strong>
        </span>
        <span>
          Activation
          <strong>
            {["Approved", "Approved with Restrictions", "Reinstated"].includes(
              verification?.status,
            )
              ? "After successful payment"
              : "Paid membership; professional tools after verification"}
          </strong>
        </span>
      </div>
      <fieldset className="billing-acknowledgements">
        <legend>Required acknowledgements</legend>
        {labels.map((label, index) => (
          <label key={label}>
            <input
              type="checkbox"
              checked={checks[index]}
              onChange={(e) => toggle(index, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
function CheckoutSummary({ plan, checkout, totals, paymentMethod }) {
  return (
    <aside className="checkout-summary" aria-live="polite">
      <span className="eyebrow">Order summary</span>
      <h3>{plan.name}</h3>
      <dl>
        <dt>List price</dt>
        <dd>{formatMoney(totals.listPriceCents)}</dd>
        <dt>Discount</dt>
        <dd>−{formatMoney(totals.discountCents)}</dd>
        <dt>Subtotal</dt>
        <dd>{formatMoney(totals.subtotalCents)}</dd>
        <dt>
          {totals.taxLabel} ({totals.taxRate}%)
        </dt>
        <dd>{formatMoney(totals.taxCents)}</dd>
        <dt className="total">Due today</dt>
        <dd className="total">{formatMoney(totals.totalCents)}</dd>
      </dl>
      <span>Renews {checkout.interval.toLowerCase()} with auto-renewal.</span>
      {paymentMethod && (
        <span>
          {paymentMethod.brand} ending {paymentMethod.last4}
        </span>
      )}
      <small>Membership fees exclude track licence fees.</small>
    </aside>
  );
}
function MockAuthentication({ amount, last4, onApprove, onDecline }) {
  return (
    <div
      className="billing-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="authentication-title"
    >
      <div className="billing-modal authentication-modal">
        <ShieldCheck />
        <span className="eyebrow">Prototype secure authentication</span>
        <h3 id="authentication-title">Confirm the simulated payment</h3>
        <dl>
          <dt>Merchant</dt>
          <dd>beatmondo</dd>
          <dt>Amount</dt>
          <dd>{formatMoney(amount)}</dd>
          <dt>Card</dt>
          <dd>Visa ending {last4}</dd>
        </dl>
        <p>No bank or payment provider is contacted.</p>
        <div className="modal-actions">
          <button className="outline-button" onClick={onDecline}>
            Decline Payment
          </button>
          <button className="gold-button" onClick={onApprove}>
            Approve Payment
          </button>
        </div>
      </div>
    </div>
  );
}
function CheckoutConfirmation({ result, verification, navigate }) {
  if (!result) return null;
  const pending = result.membership.status !== "Active";
  return (
    <div className="checkout-confirmation">
      <CheckCircle />
      <span className="eyebrow">Membership confirmation</span>
      <h3>
        {pending
          ? "Membership recorded — access is pending."
          : "Membership activated."}
      </h3>
      <p>
        {pending
          ? "Your membership is active for billing purposes, but professional features become available only after buyer verification or senior approval."
          : "Your eligible platform entitlements are now active."}
      </p>
      <div className="confirmation-facts">
        <span>
          Plan<strong>{result.membership.planName}</strong>
        </span>
        <span>
          Amount paid
          <strong>{formatMoney(result.invoice.amountPaidCents)}</strong>
        </span>
        <span>
          Invoice<strong>{result.invoice.number}</strong>
        </span>
        <span>
          Renewal
          <strong>{formatDate(result.membership.currentPeriodEnd)}</strong>
        </span>
        <span>
          Verification<strong>{verification?.status}</strong>
        </span>
        <span>
          Effective access
          <strong>
            {pending ? "Discovery Access" : result.membership.planName}
          </strong>
        </span>
      </div>
      <div className="confirmation-actions">
        <button className="gold-button" onClick={() => navigate("billing")}>
          View Billing
        </button>
        <button className="outline-button" onClick={() => navigate("buyer")}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export function BillingDashboard({ navigate, showToast }) {
  const { user } = useAuth();
  if (!user) return null;
  const membership = membershipService.getCurrentMembership(user.id);
  const verification = verificationFor(user);
  if (!membership)
    return (
      <EmptyBilling
        title="No membership record"
        text="Compare plans to start Discovery or paid access."
        action="View plans"
        onAction={() => navigate("membership-plans")}
      />
    );
  const access = calculateEffectiveAccess(user, verification, membership);
  const method = membershipService.getPaymentMethod(membership.paymentMethodId);
  const invoices = membershipService.getInvoices(user.id);
  const recentInvoice = invoices[0];
  const paymentIssue = [
    "Past Due",
    "Grace Period",
    "Payment Failed",
    "Suspended",
  ].includes(membership.status);
  return (
    <section className="membership-page billing-dashboard">
      <header className="billing-page-header">
        <div>
          <span className="eyebrow">Membership and billing</span>
          <h2>{membership.planName}</h2>
          <p>{MEMBERSHIP_STATUS_CONTENT[membership.status]?.description}</p>
        </div>
        <MembershipStatusBadge status={membership.status} />
      </header>
      {paymentIssue && (
        <PaymentFailureBanner membership={membership} navigate={navigate} />
      )}
      {membership.status === "Cancelling" && (
        <div className="billing-warning">
          <WarningCircle />
          <div>
            <strong>Cancellation scheduled</strong>
            <span>
              Access remains until {formatDate(membership.currentPeriodEnd)}.
              Auto-renewal is off.
            </span>
          </div>
          <button
            className="gold-button"
            onClick={() => navigate("billing-reactivate")}
          >
            Reactivate
          </button>
        </div>
      )}
      <div className="billing-metrics">
        <article>
          <span>Billing interval</span>
          <strong>{membership.billingInterval}</strong>
        </article>
        <article>
          <span>{membership.autoRenew ? "Next renewal" : "Access until"}</span>
          <strong>{formatDate(membership.currentPeriodEnd)}</strong>
        </article>
        <article>
          <span>Next amount</span>
          <strong>
            {membership.status === "Complimentary"
              ? "No payment due"
              : formatMoney(
                  membership.nextInvoiceAmountCents ?? membership.totalCents,
                )}
          </strong>
        </article>
        <article>
          <span>Effective access</span>
          <strong>{access.effectivePlan}</strong>
        </article>
        <article>
          <span>Verification</span>
          <strong>{verification?.status || "Not started"}</strong>
        </article>
        <article>
          <span>Outstanding balance</span>
          <strong>
            {formatMoney(membership.outstandingBalanceCents || 0)}
          </strong>
        </article>
      </div>
      <div className="billing-dashboard-grid">
        <CurrentPlan
          membership={membership}
          access={access}
          verification={verification}
          method={method}
          navigate={navigate}
        />
        <section className="billing-panel">
          <div className="panel-heading-row">
            <div>
              <h3>Billing profile</h3>
              <p>
                {membership.ownerType} membership owned by{" "}
                {membership.billingContact?.company ||
                  membership.billingContact?.name}
                .
              </p>
            </div>
          </div>
          <dl className="billing-profile">
            <dt>Billing contact</dt>
            <dd>{membership.billingContact?.name}</dd>
            <dt>Email</dt>
            <dd>{membership.billingContact?.email}</dd>
            <dt>Payment method</dt>
            <dd>
              {method
                ? `${method.brand} ending ${method.last4}`
                : "No payment method required"}
            </dd>
            <dt>Seats</dt>
            <dd>
              {membership.usedSeats || 1} used of {membership.seats || 1}
            </dd>
            <dt>Auto-renew</dt>
            <dd>{membership.autoRenew ? "Enabled" : "Disabled"}</dd>
          </dl>
          <div className="billing-actions">
            <button onClick={() => navigate("billing-payment-methods")}>
              Payment Methods
            </button>
            <button onClick={() => navigate("billing-subscription")}>
              Manage Subscription
            </button>
          </div>
        </section>
        <section className="billing-panel">
          <div className="panel-heading-row">
            <div>
              <h3>Recent invoice</h3>
              <p>Invoice data preserves its original billing snapshot.</p>
            </div>
            <button
              className="plain-button"
              onClick={() => navigate("billing-invoices")}
            >
              Billing history
            </button>
          </div>
          {recentInvoice ? (
            <InvoiceMini invoice={recentInvoice} navigate={navigate} />
          ) : (
            <p>No invoices for this membership.</p>
          )}
        </section>
      </div>
    </section>
  );
}
function PaymentFailureBanner({ membership, navigate }) {
  return (
    <div className="billing-warning critical">
      <WarningCircle />
      <div>
        <strong>Payment action required</strong>
        <span>
          {formatMoney(
            membership.outstandingBalanceCents || membership.totalCents,
          )}{" "}
          is outstanding.{" "}
          {membership.gracePeriodEndsAt
            ? `Grace period ends ${formatDate(membership.gracePeriodEndsAt)}.`
            : "Premium access is restricted."}
        </span>
      </div>
      <button
        className="outline-button"
        onClick={() => navigate("billing-payment-methods")}
      >
        Update payment method
      </button>
      <button
        className="gold-button"
        onClick={() => navigate("billing-payment-failed")}
      >
        Resolve payment
      </button>
    </div>
  );
}
function CurrentPlan({ membership, access, verification, method, navigate }) {
  return (
    <section className="billing-panel current-plan-card">
      <span className="eyebrow">Current plan</span>
      <h3>{membership.planName}</h3>
      <MembershipStatusBadge status={membership.status} />
      <strong className="current-plan-price">
        {membership.status === "Complimentary"
          ? "Complimentary"
          : formatMoney(membership.totalCents)}{" "}
        <small>{membership.billingInterval}</small>
      </strong>
      <p>{MEMBERSHIP_STATUS_CONTENT[membership.status]?.access}</p>
      {access.reasons.length > 0 && (
        <div className="access-reasons">
          <strong>Current restrictions</strong>
          {access.reasons.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      )}
      <div className="entitlement-list">
        {access.entitlements.slice(0, 9).map((item) => (
          <span key={item}>
            <CheckCircle />
            {item.replaceAll(".", " · ")}
          </span>
        ))}
      </div>
      <p>
        <strong>Verification:</strong> {verification?.status}.{" "}
        <strong>Payment:</strong>{" "}
        {method ? `${method.brand} •••• ${method.last4}` : "Not required"}.
      </p>
      <div className="billing-actions">
        <button
          className="gold-button"
          onClick={() => navigate("membership-plans")}
        >
          Change plan
        </button>
        {membership.status === "Cancelling" ? (
          <button
            className="outline-button"
            onClick={() => navigate("billing-reactivate")}
          >
            Reactivate
          </button>
        ) : (
          !["Free", "Complimentary"].includes(membership.status) && (
            <button
              className="outline-button"
              onClick={() => navigate("billing-cancel")}
            >
              Cancel membership
            </button>
          )
        )}
      </div>
    </section>
  );
}
function InvoiceMini({ invoice, navigate }) {
  const open = () => {
    window.localStorage.setItem(SELECTED_INVOICE_KEY, invoice.id);
    navigate("billing-invoice");
  };
  return (
    <article className="invoice-mini">
      <FileText />
      <div>
        <strong>{invoice.number}</strong>
        <span>
          {invoice.planName} · {formatDate(invoice.invoiceDate)}
        </span>
        <small>
          {invoice.status} ·{" "}
          {invoice.paymentMethodId ? "Saved payment method" : "Manual"}
        </small>
      </div>
      <strong>{formatMoney(invoice.totalCents, invoice.currency)}</strong>
      <button onClick={open}>View invoice</button>
    </article>
  );
}

export function PaymentMethodsPage({ navigate, showToast }) {
  const { user } = useAuth();
  const [methods, setMethods] = useState(() =>
    membershipService.getPaymentMethods(user?.id),
  );
  const [adding, setAdding] = useState(false);
  const [values, setValues] = useState(defaultPayment);
  const [error, setError] = useState("");
  if (!user) return null;
  const reload = () => setMethods(membershipService.getPaymentMethods(user.id));
  const add = () => {
    const result = membershipService.addPaymentMethod(user, values);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setAdding(false);
    setValues(defaultPayment());
    reload();
    showToast("Payment method added.");
  };
  return (
    <section className="membership-page">
      <header className="billing-page-header">
        <div>
          <span className="eyebrow">Billing security</span>
          <h2>Payment methods</h2>
          <p>
            Only brand, final four digits, expiry, cardholder, billing postal
            code, and a mock token are persisted.
          </p>
        </div>
        <button className="gold-button" onClick={() => setAdding(true)}>
          Add payment method
        </button>
      </header>
      {error && (
        <div className="billing-error" role="alert">
          {error}
        </div>
      )}
      <div className="payment-method-grid">
        {methods.map((method) => (
          <article
            className={method.status === "Expired" ? "expired" : ""}
            key={method.id}
          >
            <CreditCard />
            <div>
              <strong>
                {method.brand} ending {method.last4}
              </strong>
              <span>
                Expires {String(method.expiryMonth).padStart(2, "0")}/
                {method.expiryYear}
              </span>
              <small>
                {method.cardholderName} · Postal {method.billingPostalCode}
              </small>
            </div>
            <MembershipStatusBadge status={method.status} />
            {method.default && <em>Default</em>}
            <div>
              <button
                disabled={method.default || method.status !== "Valid"}
                onClick={() => {
                  const result = membershipService.setDefaultPaymentMethod(
                    user,
                    method.id,
                  );
                  if (!result.ok) setError(result.message);
                  else {
                    reload();
                    showToast("Default payment method updated.");
                  }
                }}
              >
                Set default
              </button>
              <button
                onClick={() => {
                  const result = membershipService.removePaymentMethod(
                    user,
                    method.id,
                  );
                  if (!result.ok) setError(result.message);
                  else {
                    reload();
                    showToast("Payment method removed.");
                  }
                }}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
      <button className="plain-button" onClick={() => navigate("billing")}>
        ← Back to billing
      </button>
      {adding && (
        <div
          className="billing-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-method-title"
        >
          <div className="billing-modal">
            <button
              className="modal-x"
              onClick={() => setAdding(false)}
              aria-label="Close"
            >
              <X />
            </button>
            <h3 id="add-method-title">Add prototype payment method</h3>
            <PaymentMethodForm
              values={values}
              setValues={setValues}
              method={null}
              loading={false}
              addPayment={add}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export function InvoicesPage({ navigate }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Statuses");
  if (!user) return null;
  let invoices = membershipService.getInvoices(
    user.permissions?.includes("*") ? null : user.id,
  );
  invoices = invoices.filter(
    (item) =>
      (!query || item.number.toLowerCase().includes(query.toLowerCase())) &&
      (status === "All Statuses" || item.status === status),
  );
  const open = (invoice) => {
    window.localStorage.setItem(SELECTED_INVOICE_KEY, invoice.id);
    navigate("billing-invoice");
  };
  return (
    <section className="membership-page">
      <header className="billing-page-header">
        <div>
          <span className="eyebrow">Billing history</span>
          <h2>Invoices</h2>
          <p>
            Prototype invoices are not jurisdiction-configured legal tax
            invoices.
          </p>
        </div>
      </header>
      <div className="billing-filter-row">
        <input
          aria-label="Search invoice number"
          placeholder="Search invoice number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter invoice status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All Statuses</option>
          <option>Paid</option>
          <option>Past Due</option>
          <option>Refunded</option>
          <option>Partially Refunded</option>
        </select>
      </div>
      <div className="billing-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <strong>{invoice.number}</strong>
                </td>
                <td>{formatDate(invoice.invoiceDate)}</td>
                <td>{invoice.planName}</td>
                <td>{formatMoney(invoice.totalCents, invoice.currency)}</td>
                <td>
                  <MembershipStatusBadge status={invoice.status} />
                </td>
                <td>{invoice.paymentMethodId ? "Saved method" : "Manual"}</td>
                <td>
                  <button onClick={() => open(invoice)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function InvoiceDetail({ navigate, showToast }) {
  const { user } = useAuth();
  if (!user) return null;
  const id = window.localStorage.getItem(SELECTED_INVOICE_KEY);
  const invoice = membershipService.getInvoice(id);
  const method = invoice
    ? membershipService.getPaymentMethod(invoice.paymentMethodId)
    : null;
  if (!invoice)
    return (
      <EmptyBilling
        title="Invoice not found"
        text="The selected invoice is unavailable."
        action="Invoice history"
        onAction={() => navigate("billing-invoices")}
      />
    );
  return (
    <section className="membership-page invoice-detail">
      <div className="invoice-toolbar">
        <button
          className="plain-button"
          onClick={() => navigate("billing-invoices")}
        >
          ← Invoices
        </button>
        <div>
          <button onClick={() => window.print()}>Print</button>
          <button
            onClick={() =>
              showToast(
                "Prototype PDF download prepared from the print-ready invoice.",
              )
            }
          >
            Download PDF
          </button>
          <button onClick={() => showToast("Demo invoice email created.")}>
            Email invoice
          </button>
        </div>
      </div>
      <article className="print-invoice">
        <header>
          <div>
            <span className="invoice-brand">beatmondo</span>
            <small>Private sync licensing ecosystem</small>
          </div>
          <div>
            <strong>{invoice.number}</strong>
            <MembershipStatusBadge status={invoice.status} />
          </div>
        </header>
        <div className="invoice-parties">
          <section>
            <span>Bill to</span>
            <strong>{invoice.billingSnapshot.name}</strong>
            <p>
              {invoice.billingSnapshot.company}
              <br />
              {invoice.billingSnapshot.address1}
              <br />
              {invoice.billingSnapshot.city}, {invoice.billingSnapshot.region}{" "}
              {invoice.billingSnapshot.postalCode}
              <br />
              {invoice.billingSnapshot.country}
            </p>
          </section>
          <section>
            <dl>
              <dt>Invoice date</dt>
              <dd>{formatDate(invoice.invoiceDate)}</dd>
              <dt>Due date</dt>
              <dd>{formatDate(invoice.dueDate)}</dd>
              <dt>Currency</dt>
              <dd>{invoice.currency}</dd>
              <dt>Related membership</dt>
              <dd>{invoice.planName}</dd>
            </dl>
          </section>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((line) => (
              <tr key={line.description}>
                <td>{line.description}</td>
                <td>{line.quantity}</td>
                <td>{formatMoney(line.amountCents, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="invoice-totals">
          <dt>Subtotal</dt>
          <dd>{formatMoney(invoice.subtotalCents)}</dd>
          <dt>Discount</dt>
          <dd>−{formatMoney(invoice.discountCents)}</dd>
          <dt>Mock tax</dt>
          <dd>{formatMoney(invoice.taxCents)}</dd>
          <dt>Total</dt>
          <dd>{formatMoney(invoice.totalCents)}</dd>
          <dt>Paid</dt>
          <dd>{formatMoney(invoice.amountPaidCents)}</dd>
          <dt>Balance due</dt>
          <dd>{formatMoney(invoice.balanceDueCents)}</dd>
        </dl>
        <footer>
          <strong>Payment</strong>
          <p>
            {method
              ? `${method.brand} ending ${method.last4}`
              : "Manual billing"}{" "}
            · {invoice.transactionReference}
          </p>
          <p>{invoice.notes}</p>
          <small>
            This prototype invoice is not represented as a
            jurisdiction-configured legal tax invoice.
          </small>
        </footer>
      </article>
    </section>
  );
}

export function SubscriptionManager({ navigate, showToast }) {
  const { user } = useAuth();
  const [membership, setMembership] = useState(() =>
    membershipService.getCurrentMembership(user?.id),
  );
  const verification = verificationFor(user);
  const [target, setTarget] = useState(
    membership?.planId === "plan-vip" ? "plan-professional" : "plan-vip",
  );
  const [interval, setInterval] = useState(
    membership?.billingInterval === "Annual" ? "Annual" : "Monthly",
  );
  if (!user || !membership) return null;
  const plan = membershipService.getPlan(target);
  const proration = calculateProration(membership, plan, interval);
  const upgrade = () => {
    const result = membershipService.changePlan(
      user,
      membership.id,
      target,
      interval,
      verification,
    );
    if (!result.ok) {
      showToast(result.message);
      if (target === "plan-vip") navigate("buyer-verification");
      return;
    }
    setMembership(result.membership);
    showToast("Membership plan updated.");
  };
  const downgrade = () => {
    const result = membershipService.scheduleDowngrade(
      user,
      membership.id,
      target,
    );
    if (!result.ok) showToast(result.message);
    else {
      setMembership(result.membership);
      showToast("Downgrade scheduled at period end.");
    }
  };
  return (
    <section className="membership-page">
      <header className="billing-page-header">
        <div>
          <span className="eyebrow">Subscription management</span>
          <h2>Change membership</h2>
          <p>
            Upgrades can apply now with simulated proration. Downgrades apply at
            period end and never revoke issued licences.
          </p>
        </div>
        <MembershipStatusBadge status={membership.status} />
      </header>
      <div className="subscription-compare">
        <article>
          <span>Current</span>
          <h3>{membership.planName}</h3>
          <strong>
            {formatMoney(membership.totalCents)} · {membership.billingInterval}
          </strong>
          <small>
            Ends or renews {formatDate(membership.currentPeriodEnd)}
          </small>
        </article>
        <article>
          <span>New selection</span>
          <select
            aria-label="New membership plan"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="plan-discovery">Discovery Access</option>
            <option value="plan-professional">Professional Buyer</option>
            <option value="plan-vip">VIP Sync Access</option>
          </select>
          {target !== "plan-discovery" && (
            <BillingIntervalToggle value={interval} onChange={setInterval} />
          )}
          <strong>
            {plan.monthlyPriceCents === null
              ? "Custom"
              : formatMoney(planPrice(plan, interval))}
          </strong>
        </article>
      </div>
      {target === "plan-vip" &&
        verification?.currentAccessTier !== "VIP Sync Access" && (
          <div className="billing-warning">
            <ShieldCheck />
            <div>
              <strong>VIP approval required</strong>
              <span>
                This selection creates an approval path; billing never grants
                VIP verification.
              </span>
            </div>
          </div>
        )}
      {target !== "plan-discovery" && (
        <div className="proration-card">
          <h3>Simulated proration</h3>
          <dl>
            <dt>
              Unused {membership.planName} credit ({proration.remainingDays}{" "}
              days)
            </dt>
            <dd>−{formatMoney(proration.creditCents)}</dd>
            <dt>{plan.name} charge</dt>
            <dd>{formatMoney(proration.newChargeCents)}</dd>
            <dt>Amount due today</dt>
            <dd>{formatMoney(proration.amountDueCents)}</dd>
          </dl>
        </div>
      )}
      <section className="billing-panel">
        <h3>Feature impact</h3>
        <div className="entitlement-diff">
          {plan.entitlements.slice(0, 12).map((item) => (
            <span key={item}>
              <CheckCircle />
              {item}
            </span>
          ))}
        </div>
        {target === "plan-discovery" && (
          <p>
            VIP catalog, concierge priority, pre-approved terms, stem
            eligibility, premium projects, quotes, and contracts will be lost at
            period end. Existing licences remain visible.
          </p>
        )}
      </section>
      <div className="billing-actions">
        <button className="outline-button" onClick={() => navigate("billing")}>
          Cancel
        </button>
        {target === "plan-discovery" ||
        (membership.planId === "plan-vip" && target === "plan-professional") ? (
          <button className="gold-button" onClick={downgrade}>
            Schedule downgrade
          </button>
        ) : (
          <button className="gold-button" onClick={upgrade}>
            Confirm plan change
          </button>
        )}
      </div>
    </section>
  );
}

export function CancellationFlow({ navigate, showToast }) {
  const { user } = useAuth();
  const membership = membershipService.getCurrentMembership(user?.id);
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const losses =
    membership?.planId === "plan-vip"
      ? [
          "VIP catalog access",
          "Concierge priority",
          "Pre-approved terms",
          "Stem delivery eligibility",
          "Premium project features",
        ]
      : [
          "Professional catalog",
          "Project creation",
          "Quote and contract workflow",
          "New secure-delivery eligibility",
        ];
  if (!user || !membership) return null;
  const cancel = () => {
    const result = membershipService.scheduleCancellation(
      user,
      membership.id,
      reason,
    );
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    showToast("Cancellation scheduled.");
    navigate("billing");
  };
  return (
    <section className="membership-page cancellation-flow">
      <header>
        <span className="eyebrow">Cancellation · Step {step + 1} of 4</span>
        <h2>
          {
            [
              "Understand the impact",
              "Why are you leaving?",
              "Consider an alternative",
              "Confirm cancellation",
            ][step]
          }
        </h2>
      </header>
      {step === 0 && (
        <div className="checkout-card">
          <h3>
            {membership.planName} remains active until{" "}
            {formatDate(membership.currentPeriodEnd)}
          </h3>
          <p>
            Renewal will stop. Licence records and existing project history are
            preserved. Delivery packages continue under their own licence expiry
            rules.
          </p>
          <ul>
            {losses.map((item) => (
              <li key={item}>
                <WarningCircle />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === 1 && (
        <div className="checkout-card">
          <Field label="Cancellation reason">
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Select a reason</option>
              {[
                "Too expensive",
                "Not using it enough",
                "Missing features",
                "Project completed",
                "Switching company",
                "Verification issue",
                "Billing issue",
                "Temporary pause",
                "Other",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {step === 2 && (
        <div className="retention-grid">
          <button onClick={() => navigate("billing-subscription")}>
            <strong>Switch billing or plan</strong>
            <span>Compare annual, Professional, and Discovery options.</span>
          </button>
          <button
            onClick={() => showToast("Pause request noted for support review.")}
          >
            <strong>Pause membership</strong>
            <span>Eligible accounts may pause for 1–3 months.</span>
          </button>
          <button onClick={() => navigate("contact")}>
            <strong>Contact support</strong>
            <span>Discuss verification, billing, or feature needs.</span>
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="checkout-card">
          <h3>Schedule cancellation at period end?</h3>
          <p>
            Access continues until {formatDate(membership.currentPeriodEnd)}.
            Auto-renewal will be disabled.
          </p>
          <label className="confirmation-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I understand the access and renewal consequences.
          </label>
        </div>
      )}
      <div className="checkout-actions">
        {step > 0 && (
          <button className="outline-button" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            className="gold-button"
            disabled={step === 1 && !reason}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </button>
        ) : (
          <button className="red-button" disabled={!confirmed} onClick={cancel}>
            Schedule cancellation
          </button>
        )}
      </div>
    </section>
  );
}

export function ReactivationPage({ navigate, showToast }) {
  const { user } = useAuth();
  if (!user) return null;
  const membership = membershipService.getCurrentMembership(user.id);
  if (!membership) return null;
  const reactivate = () => {
    const result = membershipService.reactivate(user, membership.id);
    showToast(result.ok ? "Membership reactivated." : result.message);
    if (result.ok) navigate("billing");
  };
  return (
    <section className="membership-page">
      <div className="checkout-confirmation">
        <ShieldCheck />
        <span className="eyebrow">Restore auto-renewal</span>
        <h2>Reactivate {membership.planName}?</h2>
        <p>
          The original billing cycle, current-period access, payment method, and
          renewal date will remain unchanged.
        </p>
        <div className="confirmation-facts">
          <span>
            Current status<strong>{membership.status}</strong>
          </span>
          <span>
            Period end<strong>{formatDate(membership.currentPeriodEnd)}</strong>
          </span>
          <span>
            Renewal amount
            <strong>
              {formatMoney(
                membership.nextInvoiceAmountCents || membership.totalCents,
              )}
            </strong>
          </span>
        </div>
        <div className="confirmation-actions">
          <button
            className="outline-button"
            onClick={() => navigate("billing")}
          >
            Keep cancellation
          </button>
          <button className="gold-button" onClick={reactivate}>
            Reactivate membership
          </button>
        </div>
      </div>
    </section>
  );
}

export function PaymentFailedPage({ navigate, showToast }) {
  const { user } = useAuth();
  const [membership, setMembership] = useState(() =>
    membershipService.getCurrentMembership(user?.id),
  );
  const invoice = user
    ? membershipService
        .getInvoices(user.id)
        .find((item) => item.balanceDueCents > 0)
    : null;
  const [result, setResult] = useState("");
  if (!user || !membership) return null;
  const retry = (succeed) => {
    const response = membershipService.retryPayment(
      user,
      membership.id,
      succeed,
    );
    setResult(response.message);
    setMembership(membershipService.getCurrentMembership(user.id));
    if (response.ok)
      showToast("Payment resolved and eligible access restored.");
  };
  const expire = () => {
    const response = membershipService.simulateGraceExpiry(user, membership.id);
    if (!response.ok) setResult(response.message);
    else {
      setMembership(response.membership);
      setResult("Grace period expired; paid entitlements were removed.");
    }
  };
  return (
    <section className="membership-page">
      <header className="billing-page-header">
        <div>
          <span className="eyebrow">Payment resolution</span>
          <h2>Resolve the outstanding membership invoice.</h2>
          <p>
            These controls simulate retry and dunning outcomes without
            background jobs or a payment provider.
          </p>
        </div>
        <MembershipStatusBadge status={membership.status} />
      </header>
      {result && (
        <div className="billing-result" role="status">
          {result}
        </div>
      )}
      <div className="billing-dashboard-grid">
        <section className="billing-panel">
          <h3>Failed invoice</h3>
          {invoice ? (
            <InvoiceMini invoice={invoice} navigate={navigate} />
          ) : (
            <p>No outstanding invoice remains.</p>
          )}
          <dl className="billing-profile">
            <dt>Balance due</dt>
            <dd>{formatMoney(membership.outstandingBalanceCents || 0)}</dd>
            <dt>Failed payment</dt>
            <dd>{formatDate(membership.failedPaymentAt)}</dd>
            <dt>Next retry</dt>
            <dd>{formatDate(membership.nextPaymentAttemptAt)}</dd>
            <dt>Grace period ends</dt>
            <dd>{formatDate(membership.gracePeriodEndsAt)}</dd>
          </dl>
        </section>
        <section className="billing-panel demo-controls">
          <span className="eyebrow">Demo-only controls</span>
          <h3>Payment lifecycle simulation</h3>
          <button onClick={() => retry(false)}>Simulate failed retry</button>
          <button onClick={() => retry(true)}>Simulate successful retry</button>
          <button onClick={expire}>Expire grace period</button>
          <button onClick={() => navigate("billing-payment-methods")}>
            Update payment method
          </button>
        </section>
      </div>
    </section>
  );
}

export function AdminMemberships({ navigate }) {
  const { user, hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    query: "",
    plan: "All Plans",
    status: "All Statuses",
    interval: "All Intervals",
  });
  if (!user) return null;
  if (!hasPermission("memberships.view") && !user.permissions?.includes("*"))
    return null;
  const memberships = membershipService.getMemberships(filters);
  const analytics = membershipService.getAnalytics();
  const open = (membership) => {
    window.localStorage.setItem(SELECTED_MEMBERSHIP_KEY, membership.id);
    navigate("admin-membership-detail");
  };
  return (
    <section className="membership-page admin-memberships">
      <header className="billing-page-header">
        <div>
          <span className="eyebrow">Membership operations</span>
          <h2>Membership and revenue</h2>
          <p>All metrics are derived from browser-persisted demo records.</p>
        </div>
      </header>
      <div className="billing-metrics admin-metrics">
        {[
          ["Active memberships", analytics.active],
          ["Paid members", analytics.paid],
          ["Monthly recurring revenue", formatMoney(analytics.mrrCents)],
          ["Annual recurring revenue", formatMoney(analytics.arrCents)],
          ["Professional", analytics.professional],
          ["VIP", analytics.vip],
          ["Past due", analytics.pastDue],
          ["Cancelling", analytics.cancelling],
          ["Complimentary", analytics.complimentary],
          ["Annual mix", `${analytics.annualMix}%`],
          ["Payment failure rate", `${analytics.paymentFailureRate}%`],
          ["Upcoming renewals", analytics.upcomingRenewals],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="billing-filter-row">
        <input
          aria-label="Search memberships"
          placeholder="Search member, email, organization, or membership ID"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
        <select
          aria-label="Filter membership plan"
          value={filters.plan}
          onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
        >
          <option>All Plans</option>
          <option>Discovery Access</option>
          <option>Professional Buyer</option>
          <option>VIP Sync Access</option>
          <option>Enterprise / Strategic Partner</option>
        </select>
        <select
          aria-label="Filter membership status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option>All Statuses</option>
          {MEMBERSHIP_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter billing interval"
          value={filters.interval}
          onChange={(e) => setFilters({ ...filters, interval: e.target.value })}
        >
          <option>All Intervals</option>
          <option>Monthly</option>
          <option>Annual</option>
          <option>Annual review</option>
          <option>None</option>
        </select>
      </div>
      <div className="billing-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Organization</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Interval</th>
              <th>Amount</th>
              <th>Verification</th>
              <th>Next billing</th>
              <th>Payment</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {memberships.map((membership) => {
              const method = membershipService.getPaymentMethod(
                membership.paymentMethodId,
              );
              return (
                <tr key={membership.id}>
                  <td>
                    <strong>{membership.billingContact?.name}</strong>
                    <small>{membership.billingContact?.email}</small>
                  </td>
                  <td>{membership.billingContact?.company}</td>
                  <td>{membership.planName}</td>
                  <td>
                    <MembershipStatusBadge status={membership.status} />
                  </td>
                  <td>{membership.billingInterval}</td>
                  <td>{formatMoney(membership.totalCents)}</td>
                  <td>{membership.verificationRequirement}</td>
                  <td>
                    {formatDate(
                      membership.nextInvoiceAt || membership.currentPeriodEnd,
                    )}
                  </td>
                  <td>
                    {method
                      ? `${method.brand} •••• ${method.last4}`
                      : "Manual / none"}
                  </td>
                  <td>
                    <button onClick={() => open(membership)}>Review</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminMembershipDetail({ navigate, showToast }) {
  const { user } = useAuth();
  const membershipId =
    window.localStorage.getItem(SELECTED_MEMBERSHIP_KEY) || "membership-olivia";
  const [membership, setMembership] = useState(() =>
    membershipService.getMembership(membershipId),
  );
  const [tab, setTab] = useState("Summary");
  const [action, setAction] = useState(null);
  const invoices = membershipService
    .getInvoices()
    .filter((item) => item.membershipId === membershipId);
  const transactions = membershipService.getTransactions(membershipId);
  const audit = membershipService.getAudit(membershipId);
  if (!user) return null;
  if (!membership)
    return (
      <EmptyBilling
        title="Membership not found"
        text="The selected membership record is unavailable."
        action="Membership queue"
        onAction={() => navigate("admin-memberships")}
      />
    );
  const reload = (next) =>
    setMembership(next || membershipService.getMembership(membershipId));
  const verification = membership.userId
    ? buyerVerificationService.getByUser(membership.userId)
    : null;
  const access = membership.userId
    ? calculateEffectiveAccess(
        { id: membership.userId, accountStatus: "active" },
        verification,
        membership,
      )
    : {
        effectivePlan: membership.planName,
        entitlements: membership.entitlements,
        reasons: membership.restrictions || [],
      };
  const issueRefund = () => {
    const tx = transactions.find((item) => item.status === "Succeeded");
    if (!tx) {
      showToast("No refundable successful charge found.");
      return;
    }
    const result = membershipService.issueRefund(
      user,
      tx.id,
      Math.min(1000, tx.amountCents),
      "Admin prototype refund",
      "A prototype billing adjustment was processed.",
    );
    showToast(result.ok ? "Prototype refund issued." : result.message);
    setAction(null);
    reload();
  };
  const tabs = [
    "Summary",
    "Entitlements",
    "Billing",
    "Invoices",
    "Transactions",
    "Activity",
    "Admin Actions",
  ];
  return (
    <section className="membership-page">
      <button
        className="plain-button"
        onClick={() => navigate("admin-memberships")}
      >
        ← Membership queue
      </button>
      <header className="billing-page-header">
        <div>
          <span className="eyebrow">{membership.id}</span>
          <h2>{membership.billingContact?.name || membership.planName}</h2>
          <p>
            {membership.billingContact?.company} · {membership.planName} ·{" "}
            {membership.billingInterval}
          </p>
        </div>
        <MembershipStatusBadge status={membership.status} />
      </header>
      <nav className="billing-tabs" aria-label="Membership record sections">
        {tabs.map((item) => (
          <button
            aria-current={tab === item ? "page" : undefined}
            onClick={() => setTab(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </nav>
      {tab === "Summary" && (
        <div className="billing-dashboard-grid">
          <section className="billing-panel">
            <h3>Membership summary</h3>
            <dl className="billing-profile">
              <dt>Owner</dt>
              <dd>
                {membership.ownerType} · {membership.billingContact?.company}
              </dd>
              <dt>Plan</dt>
              <dd>{membership.planName}</dd>
              <dt>Status</dt>
              <dd>{membership.status}</dd>
              <dt>Verification</dt>
              <dd>
                {verification?.status || membership.verificationRequirement}
              </dd>
              <dt>Effective access</dt>
              <dd>{access.effectivePlan}</dd>
              <dt>Seats</dt>
              <dd>
                {membership.usedSeats || 1} / {membership.seats || 1}
              </dd>
            </dl>
          </section>
          <section className="billing-panel">
            <h3>Access restrictions</h3>
            {access.reasons?.length ? (
              access.reasons.map((item) => <p key={item}>{item}</p>)
            ) : (
              <p>No effective-access restrictions.</p>
            )}
          </section>
        </div>
      )}
      {tab === "Entitlements" && (
        <section className="billing-panel">
          <h3>Plan and effective entitlements</h3>
          <div className="entitlement-admin-grid">
            {membership.entitlements.map((item) => (
              <span
                className={
                  access.entitlements.includes(item) ? "enabled" : "disabled"
                }
                key={item}
              >
                <CheckCircle />
                {item}
                <small>
                  {access.entitlements.includes(item)
                    ? "Effective"
                    : "Restricted"}
                </small>
              </span>
            ))}
          </div>
        </section>
      )}
      {tab === "Billing" && (
        <section className="billing-panel">
          <h3>Billing schedule and contact</h3>
          <dl className="billing-profile">
            <dt>List price</dt>
            <dd>{formatMoney(membership.listPriceCents)}</dd>
            <dt>Total</dt>
            <dd>{formatMoney(membership.totalCents)}</dd>
            <dt>Period</dt>
            <dd>
              {formatDate(membership.currentPeriodStart)} –{" "}
              {formatDate(membership.currentPeriodEnd)}
            </dd>
            <dt>Auto-renew</dt>
            <dd>{membership.autoRenew ? "Enabled" : "Disabled"}</dd>
            <dt>Contact</dt>
            <dd>
              {membership.billingContact?.name} ·{" "}
              {membership.billingContact?.email}
            </dd>
            <dt>Address</dt>
            <dd>
              {membership.billingContact?.city},{" "}
              {membership.billingContact?.country}
            </dd>
          </dl>
        </section>
      )}
      {tab === "Invoices" && (
        <div className="billing-panel">
          {invoices.map((invoice) => (
            <InvoiceMini
              key={invoice.id}
              invoice={invoice}
              navigate={navigate}
            />
          ))}
        </div>
      )}
      {tab === "Transactions" && (
        <div className="billing-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Failure</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.type}</td>
                  <td>{formatDate(tx.createdAt)}</td>
                  <td>{formatMoney(tx.amountCents)}</td>
                  <td>
                    <MembershipStatusBadge status={tx.status} />
                  </td>
                  <td>{tx.failureMessage || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "Activity" && (
        <div className="activity-list">
          {audit.map((event) => (
            <article key={event.id}>
              <span />
              <div>
                <strong>{event.action}</strong>
                <p>{event.description}</p>
                <small>
                  {event.actor} · {new Date(event.timestamp).toLocaleString()} ·{" "}
                  {event.source}
                </small>
              </div>
              <MembershipStatusBadge status={event.status} />
            </article>
          ))}
        </div>
      )}
      {tab === "Admin Actions" && (
        <section className="billing-panel">
          <h3>Authorized billing actions</h3>
          <p>
            Sensitive modifications require the relevant permission.
            Super-administrator overrides require recorded rationale where
            eligibility is bypassed.
          </p>
          <div className="admin-billing-actions">
            <button onClick={() => setAction("plan")}>Change plan</button>
            <button
              onClick={() => {
                const result =
                  membership.status === "Cancelling"
                    ? membershipService.reactivate(user, membership.id)
                    : membershipService.scheduleCancellation(
                        user,
                        membership.id,
                        "Administrator action",
                      );
                showToast(
                  result.ok ? "Membership state updated." : result.message,
                );
                reload(result.membership);
              }}
            >
              {" "}
              {membership.status === "Cancelling"
                ? "Reactivate"
                : "Cancel at period end"}
            </button>
            <button
              onClick={() => {
                const result = membershipService.retryPayment(
                  user,
                  membership.id,
                  true,
                );
                showToast(
                  result.ok
                    ? "Manual payment recorded and membership restored."
                    : result.message,
                );
                reload(result.membership);
              }}
            >
              Record manual payment / retry
            </button>
            <button onClick={issueRefund}>Issue $10 refund</button>
            <button onClick={() => setAction("complimentary")}>
              Grant complimentary
            </button>
            <button onClick={() => setAction("enterprise")}>
              Create enterprise membership
            </button>
            <button
              onClick={() =>
                showToast("Internal note recorded in prototype activity.")
              }
            >
              Add internal note
            </button>
            <button
              onClick={() => {
                membershipService.resetMembershipBillingDemoData();
                showToast("Membership billing demo reset.");
                navigate("admin-memberships");
              }}
            >
              Reset membership billing demo
            </button>
          </div>
        </section>
      )}
      {action === "plan" && (
        <AdminPlanChange
          membership={membership}
          user={user}
          verification={verification}
          onClose={() => setAction(null)}
          onComplete={(result) => {
            setAction(null);
            reload(result.membership);
            showToast("Plan updated by administrator.");
          }}
        />
      )}
      {action === "complimentary" && (
        <ComplimentaryModal
          actor={user}
          membership={membership}
          onClose={() => setAction(null)}
          onComplete={() => {
            setAction(null);
            showToast("Complimentary access granted.");
          }}
        />
      )}
      {action === "enterprise" && (
        <EnterpriseMembershipModal
          actor={user}
          onClose={() => setAction(null)}
          onComplete={() => {
            setAction(null);
            showToast("Enterprise membership created.");
          }}
        />
      )}
    </section>
  );
}

function AdminPlanChange({
  membership,
  user,
  verification,
  onClose,
  onComplete,
}) {
  const [planId, setPlanId] = useState(membership.planId);
  const [interval, setInterval] = useState(
    membership.billingInterval === "Annual" ? "Annual" : "Monthly",
  );
  const [override, setOverride] = useState("");
  const [error, setError] = useState("");
  const apply = () => {
    const result = membershipService.changePlan(
      user,
      membership.id,
      planId,
      interval,
      verification,
      override,
    );
    if (!result.ok) setError(result.message);
    else onComplete(result);
  };
  return (
    <div
      className="billing-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-plan-title"
    >
      <div className="billing-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 id="admin-plan-title">Change membership plan</h3>
        {error && (
          <div className="billing-error" role="alert">
            {error}
          </div>
        )}
        <Field label="Plan">
          <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="plan-discovery">Discovery Access</option>
            <option value="plan-professional">Professional Buyer</option>
            <option value="plan-vip">VIP Sync Access</option>
          </select>
        </Field>
        <BillingIntervalToggle value={interval} onChange={setInterval} />
        <Field label="Super-administrator override reason">
          <textarea
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            placeholder="Required when bypassing VIP eligibility."
          />
        </Field>
        <div className="modal-actions">
          <button className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button className="gold-button" onClick={apply}>
            Apply plan change
          </button>
        </div>
      </div>
    </div>
  );
}
function ComplimentaryModal({ actor, membership, onClose, onComplete }) {
  const [reason, setReason] = useState("Strategic Partner Access");
  const grant = () => {
    const result = membershipService.grantComplimentary(actor, {
      planId: membership.planId,
      userId: null,
      organizationId: `${membership.organizationId}-complimentary`,
      startDate: new Date().toISOString(),
      reviewDate: "2027-01-01T00:00:00.000Z",
      reason,
      restrictions: [],
      seats: membership.seats,
      billingContact: {
        ...membership.billingContact,
        email: `complimentary-${membership.billingContact.email}`,
      },
    });
    if (result.ok) onComplete(result);
  };
  return (
    <div
      className="billing-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complimentary-title"
    >
      <div className="billing-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 id="complimentary-title">Grant complimentary access</h3>
        <Field label="Reason">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <p>Start: today · Review: 1 January 2027 · Granted by {actor.name}</p>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="gold-button" onClick={grant}>
            Grant access
          </button>
        </div>
      </div>
    </div>
  );
}
function EnterpriseMembershipModal({ actor, onClose, onComplete }) {
  const [form, setForm] = useState({
    organizationId: "org-enterprise-demo",
    userId: null,
    seats: 25,
    billingInterval: "Annual",
    customPriceCents: 1200000,
    currency: "USD",
    invoiceTerms: "Net 30",
    purchaseOrder: "PO-DEMO-2026",
    startDate: new Date().toISOString(),
    renewalDate: "2027-07-16T00:00:00.000Z",
    paymentStatus: "Open",
    restrictions: [],
    accountManager: actor.name,
    billingContact: {
      name: "Enterprise Billing",
      company: "Demo Network Group",
      email: "billing@demonetwork.example",
      country: "United States",
      city: "New York",
    },
  });
  const create = () => {
    const result = membershipService.createEnterpriseMembership(actor, form);
    if (result.ok) onComplete(result);
  };
  return (
    <div
      className="billing-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enterprise-membership-title"
    >
      <div className="billing-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 id="enterprise-membership-title">
          Create manual enterprise membership
        </h3>
        <div className="billing-form-grid">
          <Field label="Organization">
            <input
              value={form.billingContact.company}
              onChange={(e) =>
                setForm({
                  ...form,
                  billingContact: {
                    ...form.billingContact,
                    company: e.target.value,
                  },
                })
              }
            />
          </Field>
          <Field label="Seats">
            <input
              type="number"
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: e.target.value })}
            />
          </Field>
          <Field label="Custom annual price (cents)">
            <input
              type="number"
              value={form.customPriceCents}
              onChange={(e) =>
                setForm({ ...form, customPriceCents: e.target.value })
              }
            />
          </Field>
          <Field label="Invoice terms">
            <select
              value={form.invoiceTerms}
              onChange={(e) =>
                setForm({ ...form, invoiceTerms: e.target.value })
              }
            >
              <option>Net 30</option>
              <option>Due on receipt</option>
              <option>Net 45</option>
            </select>
          </Field>
          <Field label="Purchase order">
            <input
              value={form.purchaseOrder}
              onChange={(e) =>
                setForm({ ...form, purchaseOrder: e.target.value })
              }
            />
          </Field>
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="gold-button" onClick={create}>
            Create enterprise membership
          </button>
        </div>
      </div>
    </div>
  );
}

export function MembershipConfirmation({ navigate }) {
  const { user } = useAuth();
  if (!user) return null;
  const result = JSON.parse(
    window.localStorage.getItem("beatmondo-last-membership-confirmation") ||
      "null",
  );
  return result ? (
    <section className="membership-page">
      <CheckoutConfirmation
        result={result}
        verification={{ status: result.membership.verificationRequirement }}
        navigate={navigate}
      />
    </section>
  ) : (
    <EmptyBilling
      title="No recent confirmation"
      text="Complete a checkout to create a membership confirmation."
      action="View plans"
      onAction={() => navigate("membership-plans")}
    />
  );
}

export function renderMembershipView(view, props) {
  if (view === "membership" || view === "billing")
    return <BillingDashboard {...props} />;
  if (view === "membership-plans") return <MembershipPlans {...props} />;
  if (view === "membership-checkout") return <MembershipCheckout {...props} />;
  if (view === "membership-confirmation")
    return <MembershipConfirmation {...props} />;
  if (view === "billing-payment-methods")
    return <PaymentMethodsPage {...props} />;
  if (view === "billing-invoices") return <InvoicesPage {...props} />;
  if (view === "billing-invoice") return <InvoiceDetail {...props} />;
  if (view === "billing-subscription")
    return <SubscriptionManager {...props} />;
  if (view === "billing-cancel") return <CancellationFlow {...props} />;
  if (view === "billing-reactivate") return <ReactivationPage {...props} />;
  if (view === "billing-payment-failed")
    return <PaymentFailedPage {...props} />;
  if (view === "admin-memberships") return <AdminMemberships {...props} />;
  if (view === "admin-membership-detail")
    return <AdminMembershipDetail {...props} />;
  return null;
}

export { entitlementService };
