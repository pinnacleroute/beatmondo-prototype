import { readAuthState, writeAuthState } from "../auth/authService.js";
import {
  CHECKOUT_STORAGE_KEY,
  DEFAULT_MEMBERSHIP_BILLING_STATE,
  MEMBERSHIP_PLANS,
  MEMBERSHIP_STATUS_CONTENT,
  MEMBERSHIP_STORAGE_KEY,
} from "./membershipData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const wait = (ms = 280) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
const round = (value) => Math.max(0, Math.round(Number(value) || 0));

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function normalize(value) {
  const fallback = clone(DEFAULT_MEMBERSHIP_BILLING_STATE);
  if (
    !value ||
    !Array.isArray(value.memberships) ||
    !Array.isArray(value.invoices)
  )
    return fallback;
  return {
    ...fallback,
    ...value,
    plans: Array.isArray(value.plans) ? value.plans : fallback.plans,
    discounts: Array.isArray(value.discounts)
      ? value.discounts
      : fallback.discounts,
    paymentMethods: Array.isArray(value.paymentMethods)
      ? value.paymentMethods
      : fallback.paymentMethods,
    transactions: Array.isArray(value.transactions)
      ? value.transactions
      : fallback.transactions,
    enterpriseInquiries: Array.isArray(value.enterpriseInquiries)
      ? value.enterpriseInquiries
      : [],
    refunds: Array.isArray(value.refunds) ? value.refunds : [],
    checkoutSessions: Array.isArray(value.checkoutSessions)
      ? value.checkoutSessions
      : [],
    audit: Array.isArray(value.audit) ? value.audit : [],
  };
}
export function readMembershipState() {
  const raw = window.localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
  const state = normalize(raw ? safeParse(raw) : null);
  if (!raw || !safeParse(raw))
    window.localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function writeMembershipState(state) {
  const next = normalize(state);
  window.localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(next));
  return next;
}
function mutate(updater) {
  const state = readMembershipState();
  const result = updater(state);
  writeMembershipState(state);
  return result;
}
function actorName(actor) {
  return actor?.name || actor?.email || "Billing simulation";
}
function addAudit(
  state,
  membership,
  actor,
  action,
  description,
  before = null,
  after = null,
  status = "Succeeded",
  source = "Membership portal",
) {
  state.audit.unshift({
    id: uid("billing-audit"),
    membershipId: membership?.id || null,
    userId: membership?.userId || actor?.id || null,
    organizationId: membership?.organizationId || actor?.organizationId || null,
    actor: actorName(actor),
    timestamp: now(),
    action,
    description,
    before,
    after,
    source,
    status,
  });
}
function addMessage(userId, title, body, action = "billing") {
  if (!userId) return;
  const auth = readAuthState();
  auth.messages.unshift({
    id: uid("billing-message"),
    userId,
    type: "billing",
    title,
    body,
    createdAt: now(),
    read: false,
    action,
  });
  writeAuthState(auth);
}
function planPrice(plan, interval) {
  return interval === "Annual" ? plan.annualPriceCents : plan.monthlyPriceCents;
}
export function formatMoney(cents, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(round(cents) / 100);
}
export function calculateMockTax(country, subtotalCents, taxExempt = false) {
  if (taxExempt) return { rate: 0, label: "Tax exempt", amountCents: 0 };
  const rules = {
    "United Kingdom": [20, "Demo VAT"],
    Australia: [10, "Demo GST"],
    India: [18, "Demo GST"],
    France: [20, "Demo EU VAT"],
    Germany: [20, "Demo EU VAT"],
    Spain: [20, "Demo EU VAT"],
  };
  const [rate, label] = rules[country] || [0, "Mock tax"];
  return { rate, label, amountCents: round((subtotalCents * rate) / 100) };
}
export function calculateDiscount(
  discount,
  plan,
  interval,
  amountCents,
  context = {},
) {
  if (!discount) return { ok: true, amountCents: 0, discount: null };
  if (!discount.active || new Date(discount.expiresAt).getTime() < Date.now())
    return { ok: false, message: "This discount code has expired." };
  if (
    !discount.plans.includes(plan.id) ||
    !discount.intervals.includes(interval)
  )
    return {
      ok: false,
      message:
        "This discount does not apply to the selected plan and billing cycle.",
    };
  if (discount.requiresVip && !context.vipEligible)
    return { ok: false, message: "VIP20 requires approved VIP eligibility." };
  if (discount.adminOnly && !context.admin)
    return {
      ok: false,
      message: "This partner code requires an authorized invitation.",
    };
  if (discount.uses >= discount.maxUses)
    return { ok: false, message: "This discount has reached its usage limit." };
  return {
    ok: true,
    amountCents:
      discount.type === "percent"
        ? round((amountCents * discount.value) / 100)
        : Math.min(amountCents, discount.valueCents),
    discount,
  };
}
export function calculateInvoiceTotals({
  plan,
  interval,
  discount = null,
  country = "United States",
  taxExempt = false,
  context = {},
}) {
  const listPriceCents = round(planPrice(plan, interval));
  const discountResult = calculateDiscount(
    discount,
    plan,
    interval,
    listPriceCents,
    context,
  );
  if (!discountResult.ok) return discountResult;
  const subtotalCents = Math.max(
    0,
    listPriceCents - discountResult.amountCents,
  );
  const tax = calculateMockTax(country, subtotalCents, taxExempt);
  return {
    ok: true,
    listPriceCents,
    discountCents: discountResult.amountCents,
    subtotalCents,
    taxCents: tax.amountCents,
    taxRate: tax.rate,
    taxLabel: tax.label,
    totalCents: subtotalCents + tax.amountCents,
  };
}
export function calculateProration(
  membership,
  newPlan,
  interval = "Monthly",
  asOf = new Date(),
) {
  const currentEnd = membership?.currentPeriodEnd
    ? new Date(membership.currentPeriodEnd)
    : asOf;
  const currentStart = membership?.currentPeriodStart
    ? new Date(membership.currentPeriodStart)
    : asOf;
  const totalDays = Math.max(
    1,
    Math.ceil((currentEnd - currentStart) / 86400000),
  );
  const remainingDays = Math.max(0, Math.ceil((currentEnd - asOf) / 86400000));
  const creditCents = round(
    ((membership?.totalCents || 0) * remainingDays) / totalDays,
  );
  const newChargeCents = round(planPrice(newPlan, interval));
  return {
    remainingDays,
    totalDays,
    creditCents,
    newChargeCents,
    amountDueCents: Math.max(0, newChargeCents - creditCents),
  };
}

const validStatuses = new Set([
  "Active",
  "Complimentary",
  "Trialing",
  "Cancelling",
]);
export function canTransitionMembershipStatus(current, next) {
  const map = {
    Free: ["Trialing", "Active", "Pending Verification", "Pending Approval"],
    Trialing: ["Active", "Expired", "Cancelling"],
    Active: ["Past Due", "Grace Period", "Cancelling", "Paused", "Suspended"],
    "Past Due": ["Grace Period", "Active", "Payment Failed"],
    "Grace Period": ["Active", "Suspended", "Payment Failed"],
    "Payment Failed": ["Active", "Suspended"],
    Cancelling: ["Active", "Cancelled"],
    Paused: ["Active", "Cancelling"],
    Suspended: ["Active", "Cancelled"],
    Incomplete: ["Active", "Cancelled"],
    Complimentary: ["Suspended", "Expired", "Active"],
  };
  return (map[current] || []).includes(next);
}
function approvedVerification(verification) {
  return ["Approved", "Approved with Restrictions", "Reinstated"].includes(
    verification?.status,
  );
}
function vipVerification(verification) {
  return (
    approvedVerification(verification) &&
    verification?.currentAccessTier === "VIP Sync Access"
  );
}
export function calculateEffectiveAccess(user, verification, membership) {
  const discovery = MEMBERSHIP_PLANS[0].entitlements;
  const reasons = [];
  if (!user || user.accountStatus !== "active")
    return {
      entitlements: [],
      effectivePlan: "No Access",
      reasons: ["Account is not active"],
      has: () => false,
    };
  if (!membership)
    return {
      entitlements: discovery,
      effectivePlan: "Discovery Access",
      reasons: ["No active paid membership"],
      has: (key) => discovery.includes(key),
    };
  if (!validStatuses.has(membership.status))
    reasons.push(
      MEMBERSHIP_STATUS_CONTENT[membership.status]?.description ||
        "Membership is not active",
    );
  if (
    [
      "Past Due",
      "Grace Period",
      "Payment Failed",
      "Paused",
      "Suspended",
      "Cancelled",
      "Expired",
    ].includes(membership.status)
  ) {
    return {
      entitlements: discovery,
      effectivePlan: "Discovery Access",
      reasons,
      membershipStatus: membership.status,
      has: (key) => discovery.includes(key),
    };
  }
  if (membership.planId === "plan-discovery")
    return {
      entitlements: discovery,
      effectivePlan: "Discovery Access",
      reasons,
      membershipStatus: membership.status,
      has: (key) => discovery.includes(key),
    };
  if (!approvedVerification(verification))
    reasons.push("Professional buyer verification is not approved");
  if (
    verification?.status === "Suspended" ||
    verification?.status === "Reverification Required"
  )
    reasons.push("Buyer verification requires review");
  if (!approvedVerification(verification))
    return {
      entitlements: discovery,
      effectivePlan: "Discovery Access",
      reasons,
      membershipStatus: membership.status,
      has: (key) => discovery.includes(key),
    };
  if (membership.planId === "plan-vip" && !vipVerification(verification)) {
    const professional = MEMBERSHIP_PLANS[1].entitlements.filter(
      (key) => !membership.restrictions?.includes(key),
    );
    reasons.push("VIP verification or senior approval is incomplete");
    return {
      entitlements: professional,
      effectivePlan: "Professional Buyer",
      reasons,
      membershipStatus: membership.status,
      has: (key) => professional.includes(key),
    };
  }
  let entitlements = [...(membership.entitlements || [])];
  if (!verification?.secureDeliveryApproved)
    entitlements = entitlements.filter((key) => key !== "delivery.secure");
  if (!verification?.masterAccessApproved)
    entitlements = entitlements.filter((key) => key !== "delivery.masters");
  if (!verification?.stemAccessApproved)
    entitlements = entitlements.filter((key) => key !== "delivery.stems");
  if (!verification?.preApprovedTerms)
    entitlements = entitlements.filter((key) => key !== "terms.preapproved");
  entitlements = entitlements.filter(
    (key) => !(membership.restrictions || []).includes(key),
  );
  return {
    entitlements,
    effectivePlan: membership.planName,
    reasons,
    membershipStatus: membership.status,
    has: (key) => entitlements.includes(key),
  };
}

function cardOutcome(number) {
  const digits = String(number).replace(/\D/g, "");
  if (digits === "4000000000000002")
    return {
      ok: false,
      code: "card_declined",
      message: "The simulated card was declined.",
    };
  if (digits === "4000000000009995")
    return {
      ok: false,
      code: "insufficient_funds",
      message: "The simulated card has insufficient funds.",
    };
  if (digits === "4000002500003155")
    return { ok: true, requiresAuthentication: true };
  if (digits === "4242424242424242") return { ok: true };
  return {
    ok: false,
    code: "invalid_test_card",
    message: "Use one of the documented prototype test card numbers.",
  };
}
function brandFor(number) {
  const digits = String(number).replace(/\D/g, "");
  return digits.startsWith("5") ? "Mastercard" : "Visa";
}
function validatePayment(values) {
  const digits = String(values.cardNumber || "").replace(/\D/g, "");
  if (!values.cardholderName?.trim()) return "Cardholder name is required.";
  if (digits.length !== 16) return "Enter a 16-digit prototype card number.";
  if (!/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(values.expiry || ""))
    return "Enter expiry as MM/YY.";
  const [month, yearText] = values.expiry.split("/");
  const year = Number(yearText.length === 2 ? `20${yearText}` : yearText);
  if (new Date(year, Number(month), 1).getTime() <= Date.now())
    return "The expiry date must be in the future.";
  if (!/^\d{3,4}$/.test(values.cvc || ""))
    return "Enter a valid three- or four-digit CVC.";
  if (!values.postalCode?.trim()) return "Billing postal code is required.";
  return "";
}

export const membershipService = {
  getState: readMembershipState,
  getPlans() {
    return clone(readMembershipState().plans).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  },
  getPlan(id) {
    return clone(
      readMembershipState().plans.find((plan) => plan.id === id) || null,
    );
  },
  getCurrentMembership(userId) {
    return clone(
      readMembershipState()
        .memberships.filter((item) => item.userId === userId)
        .sort((a, b) =>
          String(b.startedAt || "").localeCompare(String(a.startedAt || "")),
        )[0] || null,
    );
  },
  getMembership(id) {
    return clone(
      readMembershipState().memberships.find((item) => item.id === id) || null,
    );
  },
  getMemberships(filters = {}) {
    let list = readMembershipState().memberships;
    const query = String(filters.query || "").toLowerCase();
    if (query)
      list = list.filter((item) =>
        `${item.id} ${item.planName} ${item.billingContact?.name} ${item.billingContact?.email} ${item.billingContact?.company}`
          .toLowerCase()
          .includes(query),
      );
    if (filters.plan && filters.plan !== "All Plans")
      list = list.filter((item) => item.planName === filters.plan);
    if (filters.status && filters.status !== "All Statuses")
      list = list.filter((item) => item.status === filters.status);
    if (filters.interval && filters.interval !== "All Intervals")
      list = list.filter((item) => item.billingInterval === filters.interval);
    return clone(list);
  },
  getPaymentMethods(userId) {
    return clone(
      readMembershipState().paymentMethods.filter(
        (item) => item.userId === userId,
      ),
    );
  },
  getPaymentMethod(id) {
    return clone(
      readMembershipState().paymentMethods.find((item) => item.id === id) ||
        null,
    );
  },
  getInvoices(userId = null) {
    const list = readMembershipState().invoices;
    return clone(
      (userId ? list.filter((item) => item.userId === userId) : list).sort(
        (a, b) => String(b.invoiceDate).localeCompare(String(a.invoiceDate)),
      ),
    );
  },
  getInvoice(id) {
    return clone(
      readMembershipState().invoices.find((item) => item.id === id) || null,
    );
  },
  getTransactions(membershipId = null) {
    const list = readMembershipState().transactions;
    return clone(
      membershipId
        ? list.filter((item) => item.membershipId === membershipId)
        : list,
    );
  },
  getAudit(membershipId = null) {
    const list = readMembershipState().audit;
    return clone(
      membershipId
        ? list.filter((item) => item.membershipId === membershipId)
        : list,
    );
  },
  getCheckout() {
    return clone(
      safeParse(window.localStorage.getItem(CHECKOUT_STORAGE_KEY)) || null,
    );
  },
  clearCheckout() {
    window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
  },
  startCheckout(user, planId, interval = "Monthly") {
    const plan = this.getPlan(planId);
    if (!plan) return { ok: false, message: "Plan not found." };
    if (plan.id === "plan-enterprise")
      return {
        ok: false,
        enterprise: true,
        message: "Enterprise plans use an organization inquiry.",
      };
    const existing = this.getCurrentMembership(user.id);
    if (
      existing &&
      !["Free", "Cancelled", "Expired"].includes(existing.status) &&
      existing.planId === planId
    )
      return {
        ok: false,
        message: "This plan is already attached to the account.",
      };
    const checkout = {
      id: uid("checkout"),
      userId: user.id,
      organizationId: user.organizationId,
      planId,
      interval,
      step: 1,
      discountCode: "",
      billing: {
        name: user.name,
        company: user.organization,
        email: user.email,
        country: user.country || "United States",
        address1: "",
        address2: "",
        city: "",
        region: "",
        postalCode: "",
        taxId: "",
        purchaseOrder: "",
      },
      payment: null,
      termsAccepted: false,
      createdAt: now(),
      updatedAt: now(),
    };
    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkout));
    mutate((state) =>
      addAudit(
        state,
        existing,
        user,
        "Checkout started",
        `${plan.name} ${interval.toLowerCase()} checkout started.`,
      ),
    );
    return { ok: true, checkout: clone(checkout) };
  },
  saveCheckout(values) {
    const checkout = {
      ...(this.getCheckout() || {}),
      ...values,
      updatedAt: now(),
    };
    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkout));
    return clone(checkout);
  },
  validateDiscount(code, planId, interval, context = {}) {
    const state = readMembershipState();
    const discount = state.discounts.find(
      (item) => item.code === String(code).trim().toUpperCase(),
    );
    if (!discount)
      return { ok: false, message: "Discount code was not found." };
    const plan = state.plans.find((item) => item.id === planId);
    const result = calculateDiscount(
      discount,
      plan,
      interval,
      planPrice(plan, interval),
      context,
    );
    return result.ok ? { ...result, code: discount.code } : result;
  },
  checkoutTotals(checkout, context = {}) {
    const state = readMembershipState();
    const plan = state.plans.find((item) => item.id === checkout.planId);
    const discount = state.discounts.find(
      (item) => item.code === checkout.discountCode,
    );
    return calculateInvoiceTotals({
      plan,
      interval: checkout.interval,
      discount,
      country: checkout.billing?.country,
      context,
    });
  },
  async processPayment(values) {
    await wait(500);
    const validation = validatePayment(values);
    if (validation)
      return { ok: false, code: "validation_error", message: validation };
    const outcome = cardOutcome(values.cardNumber);
    if (!outcome.ok || outcome.requiresAuthentication)
      return {
        ...outcome,
        last4: String(values.cardNumber).replace(/\D/g, "").slice(-4),
      };
    const digits = String(values.cardNumber).replace(/\D/g, "");
    const [expiryMonth, expiryYearText] = values.expiry.split("/");
    return {
      ok: true,
      method: {
        id: uid("pm"),
        brand: brandFor(digits),
        last4: digits.slice(-4),
        expiryMonth: Number(expiryMonth),
        expiryYear: Number(
          expiryYearText.length === 2 ? `20${expiryYearText}` : expiryYearText,
        ),
        cardholderName: values.cardholderName.trim(),
        token: uid("pm_demo"),
        default: true,
        status: "Valid",
        billingPostalCode: values.postalCode,
      },
    };
  },
  recordFailedCheckout(user, checkout, failure) {
    return mutate((state) => {
      const plan = state.plans.find((item) => item.id === checkout.planId);
      const totals = this.checkoutTotals(checkout, { vipEligible: true });
      const transaction = {
        id: uid("txn"),
        membershipId: null,
        invoiceId: null,
        userId: user.id,
        organizationId: user.organizationId,
        type: "Charge",
        amountCents: totals.totalCents,
        currency: plan.currency,
        status: "Failed",
        paymentMethodId: null,
        createdAt: now(),
        processedAt: now(),
        failureCode: failure.code,
        failureMessage: failure.message,
        metadata: { checkoutId: checkout.id },
      };
      state.transactions.unshift(transaction);
      addAudit(
        state,
        null,
        user,
        "Payment failed",
        failure.message,
        null,
        failure.code,
        "Failed",
        "Mock checkout",
      );
      addMessage(
        user.id,
        "Membership payment failed",
        `${failure.message} No full card details were stored.`,
      );
      return { ok: false, transaction: clone(transaction) };
    });
  },
  async completeCheckout(
    user,
    verification,
    checkout,
    paymentMethod,
    authenticationApproved = true,
  ) {
    await wait(650);
    if (!authenticationApproved)
      return this.recordFailedCheckout(user, checkout, {
        code: "authentication_declined",
        message: "Mock payment authentication was declined.",
      });
    const state = readMembershipState();
    const plan = state.plans.find((item) => item.id === checkout.planId);
    if (!plan) return { ok: false, message: "Plan not found." };
    const totals = this.checkoutTotals(checkout, {
      vipEligible: vipVerification(verification),
    });
    if (!totals.ok) return totals;
    const existing = this.getCurrentMembership(user.id);
    if (
      existing &&
      !["Free", "Cancelled", "Expired"].includes(existing.status) &&
      existing.planId === plan.id
    )
      return {
        ok: false,
        message: "An equivalent active membership already exists.",
      };
    const requiresVipApproval =
      plan.id === "plan-vip" && !vipVerification(verification);
    const requiresVerification =
      plan.requiresVerification && !approvedVerification(verification);
    const status = requiresVipApproval
      ? "Pending Approval"
      : requiresVerification
        ? "Pending Verification"
        : "Active";
    const start = new Date();
    const end = new Date(start);
    if (checkout.interval === "Annual") end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    return mutate((draft) => {
      const method = {
        ...paymentMethod,
        userId: user.id,
        organizationId: user.organizationId,
      };
      draft.paymentMethods
        .filter((item) => item.userId === user.id)
        .forEach((item) => {
          item.default = false;
        });
      draft.paymentMethods.push(method);
      const membership = {
        id: uid("membership"),
        ownerType: user.organizationId ? "Organization" : "Individual",
        ownerId: user.organizationId || user.id,
        userId: user.id,
        organizationId: user.organizationId,
        planId: plan.id,
        planName: plan.name,
        billingInterval: checkout.interval,
        status,
        currency: plan.currency,
        listPriceCents: totals.listPriceCents,
        subtotalCents: totals.subtotalCents,
        discount: checkout.discountCode
          ? { code: checkout.discountCode, amountCents: totals.discountCents }
          : null,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        startedAt: start.toISOString(),
        currentPeriodStart: start.toISOString(),
        currentPeriodEnd: end.toISOString(),
        cancelAtPeriodEnd: false,
        autoRenew: true,
        paymentMethodId: method.id,
        billingContact: clone(checkout.billing),
        verificationRequirement: plan.verificationRequirement,
        entitlements: clone(plan.entitlements),
        restrictions:
          status === "Active"
            ? []
            : [
                status === "Pending Approval"
                  ? "VIP access awaits senior approval"
                  : "Professional access awaits buyer verification",
              ],
        nextInvoiceAt: end.toISOString(),
        nextInvoiceAmountCents: totals.totalCents,
        seats: plan.supportsTeamMembers ? 5 : 1,
        usedSeats: 1,
      };
      draft.memberships.push(membership);
      draft.lastInvoiceNumber += 1;
      const invoice = {
        id: uid("invoice"),
        number: `BM-INV-2026-${String(draft.lastInvoiceNumber).padStart(4, "0")}`,
        membershipId: membership.id,
        userId: user.id,
        organizationId: user.organizationId,
        planName: plan.name,
        invoiceDate: start.toISOString(),
        dueDate: start.toISOString(),
        currency: plan.currency,
        lineItems: [
          {
            description: `${plan.name} — ${checkout.interval.toLowerCase()} membership`,
            quantity: 1,
            amountCents: totals.listPriceCents,
          },
        ],
        subtotalCents: totals.listPriceCents,
        discountCents: totals.discountCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        amountPaidCents: totals.totalCents,
        balanceDueCents: 0,
        status: "Paid",
        paymentMethodId: method.id,
        transactionReference: `BM-TXN-${String(draft.lastInvoiceNumber).padStart(4, "0")}`,
        billingSnapshot: clone(checkout.billing),
        notes:
          "Prototype invoice. Membership fees do not include track licence fees.",
      };
      draft.invoices.unshift(invoice);
      const transaction = {
        id: uid("txn"),
        membershipId: membership.id,
        invoiceId: invoice.id,
        userId: user.id,
        organizationId: user.organizationId,
        type: totals.totalCents ? "Charge" : "Credit",
        amountCents: totals.totalCents,
        currency: plan.currency,
        status: "Succeeded",
        paymentMethodId: method.id,
        createdAt: now(),
        processedAt: now(),
        metadata: { reference: invoice.transactionReference },
      };
      draft.transactions.unshift(transaction);
      addAudit(
        draft,
        membership,
        user,
        "Membership created",
        `${plan.name} membership created with ${status.toLowerCase()} status.`,
        existing?.planName || "None",
        plan.name,
      );
      addAudit(
        draft,
        membership,
        user,
        "Payment succeeded",
        `${formatMoney(totals.totalCents)} prototype payment recorded.`,
        null,
        invoice.transactionReference,
      );
      addMessage(
        user.id,
        status === "Active"
          ? `Welcome to ${plan.name}`
          : `Membership ${status.toLowerCase()}`,
        status === "Active"
          ? `${plan.name} is active. Invoice ${invoice.number} is available.`
          : `${plan.name} billing is recorded, but access remains dependent on verification or approval.`,
      );
      window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      return {
        ok: true,
        membership: clone(membership),
        invoice: clone(invoice),
        transaction: clone(transaction),
      };
    });
  },
  addPaymentMethod(user, values) {
    const validation = validatePayment(values);
    if (validation) return { ok: false, message: validation };
    const outcome = cardOutcome(values.cardNumber);
    if (!outcome.ok) return outcome;
    const digits = String(values.cardNumber).replace(/\D/g, "");
    const [month, yearText] = values.expiry.split("/");
    return mutate((state) => {
      state.paymentMethods
        .filter((item) => item.userId === user.id)
        .forEach((item) => {
          item.default = false;
        });
      const method = {
        id: uid("pm"),
        userId: user.id,
        organizationId: user.organizationId,
        brand: brandFor(digits),
        last4: digits.slice(-4),
        expiryMonth: Number(month),
        expiryYear: Number(yearText.length === 2 ? `20${yearText}` : yearText),
        cardholderName: values.cardholderName,
        token: uid("pm_demo"),
        default: true,
        status: "Valid",
        billingPostalCode: values.postalCode,
      };
      state.paymentMethods.push(method);
      const membership = state.memberships.find(
        (item) => item.userId === user.id,
      );
      if (membership) membership.paymentMethodId = method.id;
      addAudit(
        state,
        membership,
        user,
        "Payment method added",
        `${method.brand} ending ${method.last4} added and set as default.`,
      );
      return { ok: true, method: clone(method) };
    });
  },
  setDefaultPaymentMethod(user, methodId) {
    return mutate((state) => {
      const methods = state.paymentMethods.filter(
        (item) => item.userId === user.id,
      );
      const method = methods.find((item) => item.id === methodId);
      if (!method || method.status !== "Valid")
        return {
          ok: false,
          message: "Only a valid payment method can be set as default.",
        };
      methods.forEach((item) => {
        item.default = item.id === methodId;
      });
      const membership = state.memberships.find(
        (item) => item.userId === user.id,
      );
      if (membership) membership.paymentMethodId = methodId;
      addAudit(
        state,
        membership,
        user,
        "Default payment method changed",
        `${method.brand} ending ${method.last4} is now the default.`,
      );
      return { ok: true, method: clone(method) };
    });
  },
  removePaymentMethod(user, methodId) {
    return mutate((state) => {
      const membership = state.memberships.find(
        (item) => item.userId === user.id,
      );
      const method = state.paymentMethods.find(
        (item) => item.id === methodId && item.userId === user.id,
      );
      const valid = state.paymentMethods.filter(
        (item) => item.userId === user.id && item.status === "Valid",
      );
      if (!method) return { ok: false, message: "Payment method not found." };
      if (
        method.default &&
        valid.length <= 1 &&
        membership &&
        ["Active", "Past Due", "Grace Period"].includes(membership.status) &&
        membership.totalCents > 0
      )
        return {
          ok: false,
          message:
            "Add a replacement before removing the only valid default payment method.",
        };
      state.paymentMethods = state.paymentMethods.filter(
        (item) => item.id !== methodId,
      );
      addAudit(
        state,
        membership,
        user,
        "Payment method removed",
        `${method.brand} ending ${method.last4} was removed.`,
      );
      return { ok: true };
    });
  },
  updateBillingContact(user, membershipId, contact) {
    return mutate((state) => {
      const membership = state.memberships.find(
        (item) =>
          item.id === membershipId &&
          (item.userId === user.id || user.permissions?.includes("*")),
      );
      if (!membership) return { ok: false, message: "Membership not found." };
      membership.billingContact = { ...membership.billingContact, ...contact };
      addAudit(
        state,
        membership,
        user,
        "Billing contact updated",
        "Future invoices will use the updated billing profile.",
      );
      return { ok: true, membership: clone(membership) };
    });
  },
  scheduleCancellation(user, membershipId, reason) {
    return mutate((state) => {
      const membership = state.memberships.find(
        (item) =>
          item.id === membershipId &&
          (item.userId === user.id || user.permissions?.includes("*")),
      );
      if (
        !membership ||
        !["Active", "Complimentary", "Trialing"].includes(membership.status)
      )
        return {
          ok: false,
          message:
            "This membership cannot be cancelled from its current state.",
        };
      const before = membership.status;
      membership.status = "Cancelling";
      membership.cancelAtPeriodEnd = true;
      membership.autoRenew = false;
      membership.cancelledAt = now();
      membership.cancellationReason = reason;
      addAudit(
        state,
        membership,
        user,
        "Cancellation scheduled",
        `Access remains until ${new Date(membership.currentPeriodEnd).toLocaleDateString()}.`,
        before,
        "Cancelling",
      );
      addMessage(
        membership.userId,
        "Membership cancellation scheduled",
        `${membership.planName} will end on ${new Date(membership.currentPeriodEnd).toLocaleDateString()}. Licences remain in your records.`,
      );
      return { ok: true, membership: clone(membership) };
    });
  },
  reactivate(user, membershipId) {
    return mutate((state) => {
      const membership = state.memberships.find(
        (item) =>
          item.id === membershipId &&
          (item.userId === user.id || user.permissions?.includes("*")),
      );
      if (!membership || membership.status !== "Cancelling")
        return {
          ok: false,
          message:
            "Only a cancelling membership can be reactivated before period end.",
        };
      membership.status = "Active";
      membership.cancelAtPeriodEnd = false;
      membership.cancelledAt = null;
      membership.autoRenew = true;
      addAudit(
        state,
        membership,
        user,
        "Membership reactivated",
        "Auto-renewal and the current billing cycle were restored.",
        "Cancelling",
        "Active",
      );
      addMessage(
        membership.userId,
        "Membership reactivated",
        `${membership.planName} remains active with its original billing cycle.`,
      );
      return { ok: true, membership: clone(membership) };
    });
  },
  scheduleDowngrade(user, membershipId, targetPlanId) {
    return mutate((state) => {
      const membership = state.memberships.find(
        (item) => item.id === membershipId,
      );
      const plan = state.plans.find((item) => item.id === targetPlanId);
      if (
        !membership ||
        !plan ||
        !["Active", "Complimentary"].includes(membership.status)
      )
        return { ok: false, message: "This downgrade cannot be scheduled." };
      membership.scheduledPlanId = plan.id;
      membership.scheduledPlanName = plan.name;
      membership.scheduledChangeAt = membership.currentPeriodEnd;
      addAudit(
        state,
        membership,
        user,
        "Downgrade scheduled",
        `${plan.name} will begin at period end. Existing licences are preserved.`,
        membership.planName,
        plan.name,
      );
      addMessage(
        membership.userId,
        "Membership downgrade scheduled",
        `${plan.name} will begin on ${new Date(membership.currentPeriodEnd).toLocaleDateString()}.`,
      );
      return { ok: true, membership: clone(membership) };
    });
  },
  changePlan(
    user,
    membershipId,
    targetPlanId,
    interval,
    verification,
    overrideReason = "",
  ) {
    return mutate((state) => {
      const membership = state.memberships.find(
        (item) => item.id === membershipId,
      );
      const plan = state.plans.find((item) => item.id === targetPlanId);
      if (!membership || !plan)
        return { ok: false, message: "Membership or plan not found." };
      if (
        plan.id === "plan-vip" &&
        !vipVerification(verification) &&
        !user.permissions?.includes("*")
      )
        return {
          ok: false,
          message: "VIP upgrade requires approved VIP verification.",
        };
      if (
        plan.id === "plan-vip" &&
        !vipVerification(verification) &&
        user.permissions?.includes("*") &&
        !overrideReason
      )
        return {
          ok: false,
          message: "A super-administrator override reason is required.",
        };
      const proration = calculateProration(membership, plan, interval);
      const before = `${membership.planName} ${membership.billingInterval}`;
      membership.planId = plan.id;
      membership.planName = plan.name;
      membership.billingInterval = interval;
      membership.listPriceCents = planPrice(plan, interval);
      membership.totalCents = planPrice(plan, interval);
      membership.entitlements = clone(plan.entitlements);
      membership.status =
        plan.id === "plan-vip" && !vipVerification(verification)
          ? "Pending Approval"
          : approvedVerification(verification)
            ? "Active"
            : "Pending Verification";
      membership.metadata = {
        ...(membership.metadata || {}),
        lastProration: proration,
        adminOverrideReason: overrideReason || null,
      };
      addAudit(
        state,
        membership,
        user,
        "Membership upgraded",
        `${before} changed to ${plan.name} ${interval}. Amount due today ${formatMoney(proration.amountDueCents)}.`,
        before,
        `${plan.name} ${interval}`,
      );
      addMessage(
        membership.userId,
        membership.status === "Active"
          ? "Membership upgrade completed"
          : "Membership upgrade awaiting approval",
        `${plan.name} is ${membership.status.toLowerCase()}.`,
      );
      return { ok: true, membership: clone(membership), proration };
    });
  },
  retryPayment(user, membershipId, succeed = true) {
    return mutate((state) => {
      const membership = state.memberships.find(
        (item) => item.id === membershipId,
      );
      const invoice = state.invoices.find(
        (item) =>
          item.membershipId === membershipId && item.balanceDueCents > 0,
      );
      if (!membership || !invoice)
        return { ok: false, message: "No outstanding invoice was found." };
      const method = state.paymentMethods.find(
        (item) => item.id === membership.paymentMethodId,
      );
      if (succeed && (!method || method.status !== "Valid"))
        return {
          ok: false,
          message: "Update the payment method before retrying.",
        };
      const transaction = {
        id: uid("txn"),
        membershipId,
        invoiceId: invoice.id,
        userId: membership.userId,
        organizationId: membership.organizationId,
        type: "Charge",
        amountCents: invoice.balanceDueCents,
        currency: invoice.currency,
        status: succeed ? "Succeeded" : "Failed",
        paymentMethodId: method?.id || null,
        createdAt: now(),
        processedAt: now(),
        failureCode: succeed ? null : "card_declined",
        failureMessage: succeed ? null : "The simulated retry was declined.",
        metadata: { retry: true },
      };
      state.transactions.unshift(transaction);
      if (succeed) {
        invoice.amountPaidCents = invoice.totalCents;
        invoice.balanceDueCents = 0;
        invoice.status = "Paid";
        membership.status = "Active";
        membership.outstandingBalanceCents = 0;
        membership.gracePeriodEndsAt = null;
        membership.nextPaymentAttemptAt = null;
        addAudit(
          state,
          membership,
          user,
          "Payment recovered",
          `${formatMoney(transaction.amountCents)} payment retry succeeded.`,
          "Past Due",
          "Active",
        );
        addMessage(
          membership.userId,
          "Payment resolved and access restored",
          `${invoice.number} is paid and eligible membership access has been restored.`,
        );
      } else {
        membership.status = "Grace Period";
        membership.nextPaymentAttemptAt = new Date(
          Date.now() + 3 * 86400000,
        ).toISOString();
        addAudit(
          state,
          membership,
          user,
          "Payment retry failed",
          transaction.failureMessage,
          membership.status,
          "Grace Period",
          "Failed",
        );
        addMessage(
          membership.userId,
          "Payment retry failed",
          "Update your payment method before the grace period ends.",
        );
      }
      return {
        ok: succeed,
        membership: clone(membership),
        invoice: clone(invoice),
        transaction: clone(transaction),
        message: succeed ? "Payment resolved." : transaction.failureMessage,
      };
    });
  },
  simulateGraceExpiry(user, membershipId) {
    return mutate((state) => {
      const membership = state.memberships.find(
        (item) => item.id === membershipId,
      );
      if (
        !membership ||
        !["Past Due", "Grace Period", "Payment Failed"].includes(
          membership.status,
        )
      )
        return { ok: false, message: "No active grace period can be expired." };
      const before = membership.status;
      membership.status = "Suspended";
      addAudit(
        state,
        membership,
        user,
        "Grace period expired",
        "Paid entitlements were removed; Discovery access remains.",
        before,
        "Suspended",
      );
      addMessage(
        membership.userId,
        "Membership suspended",
        "The payment grace period ended. Resolve the outstanding invoice to restore eligible access.",
      );
      return { ok: true, membership: clone(membership) };
    });
  },
  issueRefund(actor, transactionId, amountCents, reason, buyerMessage) {
    return mutate((state) => {
      const transaction = state.transactions.find(
        (item) => item.id === transactionId,
      );
      if (!transaction || transaction.status !== "Succeeded")
        return {
          ok: false,
          message: "Only a successful charge can be refunded.",
        };
      if (!amountCents || amountCents > transaction.amountCents)
        return {
          ok: false,
          message: "Refund amount must not exceed the successful charge.",
        };
      const membership = state.memberships.find(
        (item) => item.id === transaction.membershipId,
      );
      const invoice = state.invoices.find(
        (item) => item.id === transaction.invoiceId,
      );
      const full = amountCents === transaction.amountCents;
      transaction.refundAmountCents =
        (transaction.refundAmountCents || 0) + amountCents;
      transaction.status = full ? "Refunded" : "Partially Refunded";
      if (invoice) invoice.status = full ? "Refunded" : "Partially Refunded";
      const refund = {
        id: uid("refund"),
        transactionId,
        membershipId: transaction.membershipId,
        amountCents,
        currency: transaction.currency,
        reason,
        buyerMessage,
        actor: actorName(actor),
        createdAt: now(),
      };
      state.refunds.unshift(refund);
      addAudit(
        state,
        membership,
        actor,
        full ? "Full refund issued" : "Partial refund issued",
        `${formatMoney(amountCents)} refunded. ${reason}`,
        transaction.amountCents,
        amountCents,
      );
      addMessage(
        membership?.userId,
        "Refund processed",
        buyerMessage ||
          `${formatMoney(amountCents)} was refunded in this billing simulation.`,
      );
      return {
        ok: true,
        refund: clone(refund),
        transaction: clone(transaction),
        invoice: clone(invoice),
      };
    });
  },
  grantComplimentary(actor, values) {
    return mutate((state) => {
      const plan = state.plans.find((item) => item.id === values.planId);
      if (!plan || !actor.permissions?.includes("*"))
        return {
          ok: false,
          message:
            "Complimentary access requires super-administrator permission.",
        };
      const membership = {
        id: uid("membership"),
        ownerType: values.organizationId ? "Organization" : "Individual",
        ownerId: values.organizationId || values.userId,
        userId: values.userId || null,
        organizationId: values.organizationId || null,
        planId: plan.id,
        planName: plan.name,
        billingInterval: "Annual review",
        status: "Complimentary",
        currency: "USD",
        listPriceCents: 0,
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0,
        startedAt: values.startDate,
        currentPeriodStart: values.startDate,
        currentPeriodEnd: values.reviewDate,
        cancelAtPeriodEnd: false,
        autoRenew: false,
        paymentMethodId: null,
        billingContact: values.billingContact,
        verificationRequirement: plan.verificationRequirement,
        entitlements: clone(plan.entitlements),
        restrictions: values.restrictions || [],
        complimentaryReason: values.reason,
        grantedBy: actorName(actor),
        nextReviewAt: values.reviewDate,
        seats: values.seats || 1,
        usedSeats: 1,
      };
      state.memberships.push(membership);
      addAudit(
        state,
        membership,
        actor,
        "Complimentary access granted",
        `${plan.name} granted until review.`,
        null,
        "Complimentary",
      );
      addMessage(
        membership.userId,
        "Complimentary membership granted",
        `${plan.name} access was granted with a review date of ${new Date(values.reviewDate).toLocaleDateString()}.`,
      );
      return { ok: true, membership: clone(membership) };
    });
  },
  createEnterpriseInquiry(user, values) {
    return mutate((state) => {
      const inquiry = {
        id: uid("enterprise"),
        userId: user?.id || null,
        organizationId: user?.organizationId || null,
        status: "Submitted",
        submittedAt: now(),
        ...values,
      };
      state.enterpriseInquiries.unshift(inquiry);
      addAudit(
        state,
        null,
        user,
        "Enterprise inquiry submitted",
        `${values.company} requested enterprise access.`,
        null,
        inquiry.id,
      );
      addMessage(
        user?.id,
        "Enterprise membership inquiry received",
        "The licensing team will review your organization requirements.",
      );
      return { ok: true, inquiry: clone(inquiry) };
    });
  },
  createEnterpriseMembership(actor, values) {
    return mutate((state) => {
      if (!actor.permissions?.includes("*"))
        return {
          ok: false,
          message:
            "Enterprise billing requires super-administrator permission.",
        };
      const plan = state.plans.find((item) => item.id === "plan-enterprise");
      const membership = {
        id: uid("membership"),
        ownerType: "Organization",
        ownerId: values.organizationId,
        userId: values.userId || null,
        organizationId: values.organizationId,
        planId: plan.id,
        planName: plan.name,
        billingInterval: values.billingInterval || "Manual",
        status: values.paymentStatus === "Paid" ? "Active" : "Incomplete",
        currency: values.currency || "USD",
        listPriceCents: round(values.customPriceCents),
        subtotalCents: round(values.customPriceCents),
        taxCents: 0,
        totalCents: round(values.customPriceCents),
        startedAt: values.startDate,
        currentPeriodStart: values.startDate,
        currentPeriodEnd: values.renewalDate,
        cancelAtPeriodEnd: false,
        autoRenew: false,
        paymentMethodId: null,
        billingContact: values.billingContact,
        verificationRequirement: "Manual enterprise agreement",
        entitlements: clone(plan.entitlements),
        restrictions: values.restrictions || [],
        seats: Number(values.seats) || 1,
        usedSeats: 1,
        metadata: {
          invoiceTerms: values.invoiceTerms,
          purchaseOrder: values.purchaseOrder,
          accountManager: values.accountManager,
        },
      };
      state.memberships.push(membership);
      addAudit(
        state,
        membership,
        actor,
        "Enterprise membership created",
        `${formatMoney(membership.totalCents)} manual agreement created.`,
        null,
        membership.status,
      );
      return { ok: true, membership: clone(membership) };
    });
  },
  getAnalytics() {
    const state = readMembershipState();
    const paid = state.memberships.filter(
      (item) =>
        item.totalCents > 0 &&
        ["Active", "Past Due", "Grace Period", "Cancelling"].includes(
          item.status,
        ),
    );
    const monthly = paid.filter((item) => item.billingInterval === "Monthly");
    const annual = paid.filter((item) => item.billingInterval === "Annual");
    const mrrCents =
      monthly.reduce((sum, item) => sum + item.totalCents, 0) +
      annual.reduce((sum, item) => sum + round(item.totalCents / 12), 0);
    const arrCents = mrrCents * 12;
    const failed = state.transactions.filter(
      (item) => item.status === "Failed",
    );
    const recovered = state.audit.filter(
      (item) => item.action === "Payment recovered",
    );
    return {
      active: state.memberships.filter((item) =>
        ["Active", "Complimentary", "Cancelling"].includes(item.status),
      ).length,
      paid: paid.length,
      free: state.memberships.filter((item) => item.status === "Free").length,
      professional: state.memberships.filter(
        (item) => item.planId === "plan-professional",
      ).length,
      vip: state.memberships.filter((item) => item.planId === "plan-vip")
        .length,
      pastDue: state.memberships.filter((item) =>
        ["Past Due", "Grace Period", "Payment Failed"].includes(item.status),
      ).length,
      cancelling: state.memberships.filter(
        (item) => item.status === "Cancelling",
      ).length,
      complimentary: state.memberships.filter(
        (item) => item.status === "Complimentary",
      ).length,
      mrrCents,
      arrCents,
      arpmCents: paid.length ? round(mrrCents / paid.length) : 0,
      annualMix: paid.length ? round((annual.length / paid.length) * 100) : 0,
      paymentFailureRate: state.transactions.length
        ? round((failed.length / state.transactions.length) * 100)
        : 0,
      paymentRecoveryRate: failed.length
        ? round((recovered.length / failed.length) * 100)
        : 0,
      upcomingRenewals: state.memberships.filter((item) => item.nextInvoiceAt)
        .length,
      enterpriseInquiries: state.enterpriseInquiries.length,
    };
  },
  resetMembershipBillingDemoData() {
    const state = clone(DEFAULT_MEMBERSHIP_BILLING_STATE);
    writeMembershipState(state);
    window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    return state;
  },
};

export const entitlementService = {
  calculateEffectiveAccess,
  getEffectiveEntitlements(user, verification, membership = null) {
    const current =
      membership || membershipService.getCurrentMembership(user?.id);
    return calculateEffectiveAccess(user, verification, current).entitlements;
  },
  hasEntitlement(user, verification, entitlement, membership = null) {
    return calculateEffectiveAccess(
      user,
      verification,
      membership || membershipService.getCurrentMembership(user?.id),
    ).has(entitlement);
  },
};
