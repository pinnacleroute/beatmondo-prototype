import { readAuthState, writeAuthState } from "../auth/authService.js";
import { membershipService } from "../membership/membershipService.js";
import {
  readContractState,
  writeContractState,
} from "../contracts/contractService.js";
import { readQuoteState, writeQuoteState } from "../quotes/quoteService.js";
import { readStorageState } from "../storage/storageService.js";
import { STORAGE_KEY } from "../storage/storageData.js";
import {
  PAYMENT_STORAGE_KEY,
  DEFAULT_PAYMENT_STATE,
  PAYMENT_STATUSES,
  SELECTED_PAYMENT_KEY,
} from "./paymentData.js";

const clone = (v) => JSON.parse(JSON.stringify(v));
const now = () => new Date().toISOString();
const uid = (p) =>
  `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const parse = (r) => {
  try {
    return JSON.parse(r);
  } catch {
    return null;
  }
};
const can = (u, p) =>
  u?.permissions?.includes("*") || u?.permissions?.includes(p);
function normalize(value) {
  const base = clone(DEFAULT_PAYMENT_STATE);
  if (!value || !Array.isArray(value.invoices)) return base;
  const merge = (a = [], b = []) => [
    ...a,
    ...b.filter((x) => !a.some((y) => y.id === x.id)),
  ];
  return {
    ...base,
    ...value,
    invoices: merge(value.invoices, base.invoices).map((invoice) => ({
      ...base.invoices.find((item) => item.id === invoice.id),
      ...invoice,
    })),
    obligations: merge(value.obligations, base.obligations),
    transactions: merge(value.transactions, base.transactions),
    credits: merge(value.credits, base.credits),
    refunds: merge(value.refunds, base.refunds),
    receipts: merge(value.receipts, base.receipts).map((receipt) => ({
      ...base.receipts.find((item) => item.id === receipt.id),
      ...receipt,
    })),
    allocations: value.allocations || [],
    bankTransfers: value.bankTransfers || [],
    reconciliations: value.reconciliations || [],
    authenticationRecords: value.authenticationRecords || [],
    activity: value.activity || [],
    analyticsEvents: value.analyticsEvents || [],
  };
}
export function readPaymentState() {
  const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
  const state = normalize(raw ? parse(raw) : null);
  if (!raw || !parse(raw))
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function writePaymentState(state) {
  const next = normalize(state);
  localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(next));
  return next;
}
function mutate(fn) {
  const state = readPaymentState();
  const result = fn(state);
  writePaymentState(state);
  return result;
}
function activity(
  state,
  ctx,
  user,
  action,
  description,
  visibility = "Internal",
) {
  const e = {
    id: uid("payment-event"),
    actor: user?.name || "Payment service",
    userId: user?.id || null,
    buyer: ctx?.buyer,
    organization: ctx?.organization,
    project: ctx?.project,
    quote: ctx?.quoteReference,
    contract: ctx?.contractReference,
    invoice: ctx?.reference || ctx?.invoiceReference,
    payment: ctx?.paymentReference || ctx?.reference,
    timestamp: now(),
    action,
    description,
    source: "Licensing Payments",
    visibility,
  };
  state.activity.unshift(e);
  return e;
}
function notify(userId, title, body, action = "buyer-payments") {
  if (!userId) return;
  const auth = readAuthState();
  auth.messages.unshift({
    id: uid("payment-message"),
    userId,
    type: "licensing-payment",
    title,
    body,
    createdAt: now(),
    read: false,
    action,
  });
  writeAuthState(auth);
}
function contractById(id) {
  return readContractState().contracts.find((c) => c.id === id) || null;
}
function safeFailure(code) {
  return (
    {
      CARD_DECLINED: "The card was declined. Try another payment method.",
      INSUFFICIENT_FUNDS: "The payment method has insufficient funds.",
      AUTHENTICATION_FAILED: "Payment authentication was not completed.",
      ACCOUNT_RESTRICTED:
        "Account eligibility currently restricts this payment.",
      INVOICE_ALREADY_PAID: "This invoice has already been paid.",
      INVOICE_CANCELLED: "This invoice is no longer payable.",
      AMOUNT_INVALID: "The payment amount is invalid.",
      PAYMENT_METHOD_INVALID: "Choose a valid payment method.",
      PROCESSING_ERROR: "The payment could not be processed. Please retry.",
    }[code] || "The payment could not be completed."
  );
}
export function canTransitionPaymentStatus(current, next) {
  return Boolean(PAYMENT_STATUSES[current]?.next.includes(next));
}
const invoiceTransitions = {
  Draft: ["Open", "Void"],
  Open: ["Partially Paid", "Paid", "Past Due", "Cancelled"],
  "Partially Paid": ["Paid", "Past Due"],
  Paid: ["Partially Refunded", "Refunded"],
  "Past Due": ["Paid"],
  "Partially Refunded": ["Refunded"],
};
export function canTransitionLicensingInvoiceStatus(current, next) {
  return Boolean(invoiceTransitions[current]?.includes(next));
}
export function allocatePayment(
  transaction,
  obligations,
  amount = transaction.amount,
) {
  let remaining = amount;
  return obligations
    .filter((o) => o.balanceRemaining > 0)
    .map((o) => {
      const applied = Math.min(remaining, o.balanceRemaining);
      remaining -= applied;
      return { obligationId: o.id, invoiceId: o.invoiceId, amount: applied };
    })
    .filter((a) => a.amount > 0);
}
export function calculateLicencePaymentReadiness(
  contract,
  invoices = readPaymentState().invoices,
  payments = readPaymentState().transactions,
) {
  const related = invoices.filter(
    (i) =>
      i.contractId === contract?.id &&
      !["Cancelled", "Void"].includes(i.status),
  );
  const remaining = related.reduce((n, i) => n + i.balanceDue, 0);
  const underReview = payments.some(
    (p) =>
      p.contractId === contract?.id &&
      [
        "Pending Reconciliation",
        "Chargeback Simulation",
        "Disputed Simulation",
      ].includes(p.status),
  );
  const refunded = payments.some(
    (p) =>
      p.contractId === contract?.id &&
      ["Partially Refunded", "Refunded"].includes(p.status),
  );
  const blockers = [];
  if (remaining)
    blockers.push(
      `Remaining balance of ${formatPaymentMoney(remaining)} is unpaid`,
    );
  if (underReview) blockers.push("A payment is under finance review");
  if (refunded) blockers.push("A refund may affect the paid amount");
  if (
    !["Fully Signed", "Countersigned", "Effective", "Completed"].includes(
      contract?.status,
    )
  )
    blockers.push("Contract execution is incomplete");
  return {
    ready: blockers.length === 0,
    status: underReview
      ? "Payment Under Review"
      : remaining
        ? related.some((i) => i.amountPaid > 0)
          ? "Deposit Paid"
          : "Payment Due"
        : "Payment Complete",
    remaining,
    blockers,
  };
}
export function calculatePaymentDeliveryReadiness(contract, licence = null) {
  const payment = calculateLicencePaymentReadiness(contract);
  if (!payment.ready)
    return { ready: false, status: payment.status, blockers: payment.blockers };
  if (!licence)
    return {
      ready: false,
      status: "Waiting for Licence Issuance",
      blockers: ["An issued licence is required before delivery"],
    };
  return {
    ready: Boolean(licence.status === "Issued"),
    status:
      licence.status === "Issued"
        ? "Payment and licence complete"
        : "Licence not issued",
    blockers:
      licence.status === "Issued" ? [] : ["Licence issuance is incomplete"],
  };
}
export function formatPaymentMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((amount || 0) / 100);
}
function syncContractPayment(contractId, state) {
  const contracts = readContractState();
  const c = contracts.contracts.find((x) => x.id === contractId);
  if (!c) return;
  const ready = calculateLicencePaymentReadiness(
    c,
    state.invoices,
    state.transactions,
  );
  c.paymentStatus = ready.status;
  c.licenceGeneration = ready.ready ? "Ready" : "Waiting for payment";
  c.deliveryStatus =
    "Not authorized — issued licence and delivery policy required";
  c.dependencies.payment = ready.ready;
  c.updatedAt = now();
  writeContractState(contracts);
  const quotes = readQuoteState();
  const q = quotes.quotes.find((x) => x.id === c.quoteId);
  if (q) {
    q.futureWorkflow = {
      ...q.futureWorkflow,
      paymentStatus: ready.status,
      paymentSchedule: state.invoices
        .filter((i) => i.contractId === c.id)
        .map((i) => i.reference),
      invoiceGenerated: true,
      invoiceReadiness: ready.ready ? "Payment complete" : "Payment due",
    };
    writeQuoteState(quotes);
  }
}
function registerReceiptAsset(receipt) {
  const storage = readStorageState();
  if (storage.assets.some((a) => a.id === receipt.assetId)) return;
  storage.assets.unshift({
    id: receipt.assetId,
    ownerType: "Payment",
    ownerId: receipt.paymentId,
    relatedTrackId: null,
    relatedContractId: receipt.contractId,
    relatedInvoiceId: receipt.invoiceId,
    storageClass: "COMMERCIAL_DOCUMENT",
    assetType: "Payment Receipt",
    fileName: `${receipt.reference.toLowerCase()}-receipt.pdf`,
    displayName: `${receipt.reference} Payment Receipt`,
    fileExtension: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 280000,
    checksum: `demo-sha256-${receipt.assetId}`,
    version: 1,
    status: "Ready",
    visibility: "Organization Restricted",
    confidentiality: "Commercial",
    storageReference: `storage://commercial-document/${receipt.assetId}`,
    uploadedBy: "Licensing Payments",
    uploadedAt: receipt.date,
    processedAt: receipt.date,
    current: true,
    metadata: {
      paymentReference: receipt.paymentReference,
      invoiceReference: receipt.invoiceReference,
      contractReference: receipt.contractReference,
      integrityStatus: "Verified",
    },
    accessPolicy: {
      requiresAuthentication: true,
      organizationRestrictions: [receipt.organizationId],
      downloadAllowed: true,
      streamAllowed: false,
      maxDownloads: 0,
    },
    processingInfo: { status: "Completed", warnings: [], failure: null },
    versions: [],
    notes: ["Payment receipt only; not labelled as a tax invoice."],
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}
function finishSuccess(state, invoice, transaction, creditAmount, user) {
  const credit = state.credits.find(
    (item) => item.id === transaction.metadata?.creditId,
  );
  if (creditAmount && credit) {
    credit.remainingAmount -= creditAmount;
    credit.status = credit.remainingAmount ? "Partially Used" : "Used";
    credit.usageHistory.push({
      invoiceId: invoice.id,
      amount: creditAmount,
      date: now(),
      actor: user.name,
    });
    state.transactions.unshift({
      ...clone(transaction),
      id: uid("credit-application"),
      reference: `BM-CR-APP-2026-${String(state.lastNumbers.payment).padStart(4, "0")}`,
      paymentType: "Account credit",
      paymentMethodLabel: credit.reference,
      amount: creditAmount,
      status: "Succeeded",
      capturedAt: now(),
      providerReference: null,
    });
  }
  invoice.amountPaid += transaction.amount;
  invoice.creditApplied += creditAmount || 0;
  invoice.balanceDue = Math.max(
    0,
    invoice.total - invoice.amountPaid - invoice.creditApplied,
  );
  invoice.status = invoice.balanceDue ? "Partially Paid" : "Paid";
  invoice.updatedAt = now();
  const obligation = state.obligations.find((o) => o.invoiceId === invoice.id);
  if (obligation) {
    obligation.amountPaid = invoice.amountPaid + invoice.creditApplied;
    obligation.balanceRemaining = invoice.balanceDue;
    obligation.status = invoice.balanceDue ? "Partially Paid" : "Paid";
    obligation.updatedAt = now();
  }
  transaction.status = "Succeeded";
  transaction.authorizedAt = now();
  transaction.capturedAt = now();
  const allocations = allocatePayment(
    transaction,
    state.obligations.filter((o) => o.invoiceId === invoice.id),
  );
  allocations.forEach((a) =>
    state.allocations.push({
      id: uid("allocation"),
      transactionId: transaction.id,
      ...a,
      date: now(),
      actor: user.name,
      reconciliationStatus: "Allocated",
    }),
  );
  state.lastNumbers.receipt += 1;
  const receipt = {
    id: uid("receipt"),
    reference: `BM-RCPT-2026-${String(state.lastNumbers.receipt).padStart(4, "0")}`,
    paymentId: transaction.id,
    paymentReference: transaction.reference,
    invoiceId: invoice.id,
    invoiceReference: invoice.reference,
    buyerId: invoice.buyerId,
    buyer: invoice.buyer,
    organizationId: invoice.organizationId,
    organization: invoice.organization,
    amount: transaction.amount,
    currency: transaction.currency,
    method: transaction.paymentMethodLabel,
    date: now(),
    contractId: invoice.contractId,
    contractReference: invoice.contractReference,
    project: invoice.project,
    track: invoice.track,
    tax: invoice.tax,
    taxRate: invoice.taxRate,
    taxLabel: invoice.taxLabel,
    taxJurisdiction: invoice.taxJurisdiction,
    taxRegistrationReference: invoice.taxRegistrationReference,
    projectId: invoice.projectId,
    licenceReference: invoice.licenceReference || null,
    creditApplied: creditAmount || 0,
    remainingBalance: invoice.balanceDue,
    assetId: `asset-receipt-${transaction.id}`,
    taxInvoice: false,
  };
  state.receipts.unshift(receipt);
  registerReceiptAsset(receipt);
  activity(
    state,
    invoice,
    user,
    "Payment succeeded",
    `${transaction.reference} recorded; ${formatPaymentMoney(invoice.balanceDue)} remains.`,
    "Buyer",
  );
  activity(
    state,
    receipt,
    user,
    "Receipt generated",
    `${receipt.reference} registered in commercial-document storage.`,
    "Buyer",
  );
  notify(
    invoice.buyerId,
    `${transaction.reference} payment recorded`,
    `${formatPaymentMoney(transaction.amount)} was recorded for ${invoice.reference}.`,
    `buyer-payment-success`,
  );
  syncContractPayment(invoice.contractId, state);
  localStorage.setItem(SELECTED_PAYMENT_KEY, transaction.id);
  return receipt;
}

function processSimulatedPartnerPayment(invoiceId, values, user) {
  const state = readPaymentState();
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return { ok: false, message: "Licensing invoice not found." };
  if (
    state.transactions.some(
      (transaction) =>
        transaction.metadata?.idempotencyKey === values.idempotencyKey,
    )
  )
    return {
      ok: false,
      code: "DUPLICATE_PAYMENT",
      message: "This simulated PayPal request was already submitted.",
    };
  const credit = state.credits.find(
    (item) =>
      item.id === values.creditId &&
      item.organizationId === invoice.organizationId &&
      item.status === "Active",
  );
  const creditAmount = Math.min(
    Number(values.creditAmount || 0),
    credit?.remainingAmount || 0,
    invoice.balanceDue,
  );
  const charge = invoice.balanceDue - creditAmount;
  state.lastNumbers.payment += 1;
  const sequence = String(state.lastNumbers.payment).padStart(4, "0");
  const transaction = {
    id: uid("payment"),
    reference: `BM-PAY-2026-${sequence}`,
    paymentType: invoice.invoiceType,
    source: "PayPal Partner Simulation",
    buyerId: user.id,
    buyer: user.name,
    organizationId: invoice.organizationId,
    organization: invoice.organization,
    projectId: invoice.projectId,
    quoteId: invoice.quoteId,
    contractId: invoice.contractId,
    licenceId: invoice.licenceId || null,
    invoiceId: invoice.id,
    paymentMethodId: null,
    paymentMethodLabel: "PayPal · simulated",
    currency: invoice.currency,
    amount: charge,
    status: "Processing",
    providerReference: `mock_paypal_${Date.now()}`,
    mockAuthorizationId: `MOCK-PAYPAL-AUTH-${sequence}`,
    failureCode: null,
    failureMessage: null,
    authenticationRequired: false,
    authenticationStatus: "Mock approved",
    initiatedAt: now(),
    authorizedAt: null,
    capturedAt: null,
    failedAt: null,
    refundedAt: null,
    reconciledAt: null,
    createdBy: user.name,
    metadata: {
      idempotencyKey: values.idempotencyKey || uid("bm_pay_idem"),
      purchaseOrder: values.purchaseOrder || null,
      creditId: credit?.id || null,
      creditAmount,
      partner: "PayPal",
      transactionStatus: "Mock partner authorization received",
      settlementCurrency: invoice.currency,
      auditReference: `BM-AUD-PAYPAL-2026-${sequence}`,
      internalOnly: false,
    },
  };
  state.transactions.unshift(transaction);
  state.paymentAttempts.unshift({
    id: uid("attempt"),
    transactionId: transaction.id,
    invoiceId: invoice.id,
    attemptedAt: now(),
    method: transaction.paymentMethodLabel,
    status: "Mock authorization received",
  });
  activity(
    state,
    transaction,
    user,
    "Mock PayPal authorization received",
    `${transaction.metadata.auditReference} recorded without a live PayPal call.`,
    "Buyer",
  );
  const receipt = finishSuccess(
    state,
    invoice,
    transaction,
    creditAmount,
    user,
  );
  writePaymentState(state);
  return {
    ok: true,
    message: "Mock PayPal payment recorded.",
    transaction: clone(transaction),
    receipt: clone(receipt),
    invoice: clone(invoice),
  };
}

export const paymentService = {
  getState: readPaymentState,
  resetPaymentsDemoData() {
    localStorage.removeItem(PAYMENT_STORAGE_KEY);
    localStorage.removeItem("beatmondo-selected-licensing-invoice");
    localStorage.removeItem("beatmondo-selected-licensing-payment");
    localStorage.removeItem("beatmondo-licensing-checkout");
    return readPaymentState();
  },
  getInvoices(user) {
    let list = readPaymentState().invoices;
    if (user?.userType === "buyer")
      list = list.filter((i) => i.organizationId === user.organizationId);
    return clone(
      [...list].sort((a, b) =>
        String(b.issueDate).localeCompare(String(a.issueDate)),
      ),
    );
  },
  getInvoice(id, user) {
    const i = readPaymentState().invoices.find((x) => x.id === id);
    if (
      !i ||
      (user?.userType === "buyer" && i.organizationId !== user.organizationId)
    )
      return null;
    return clone(i);
  },
  getTransactions(user) {
    let list = readPaymentState().transactions;
    if (user?.userType === "buyer")
      list = list.filter((t) => t.organizationId === user.organizationId);
    return clone(
      [...list].sort((a, b) =>
        String(b.initiatedAt).localeCompare(String(a.initiatedAt)),
      ),
    );
  },
  getPayment(id, user) {
    const p = readPaymentState().transactions.find((x) => x.id === id);
    if (
      !p ||
      (user?.userType === "buyer" && p.organizationId !== user.organizationId)
    )
      return null;
    return clone(p);
  },
  getCredits(user) {
    let credits = readPaymentState().credits;
    if (user?.userType === "buyer")
      credits = credits.filter((c) => c.organizationId === user.organizationId);
    return clone(credits);
  },
  getReceipts(user) {
    let receipts = readPaymentState().receipts;
    if (user?.userType === "buyer")
      receipts = receipts.filter(
        (r) => r.organizationId === user.organizationId,
      );
    return clone(receipts);
  },
  getRefunds(user) {
    let refunds = readPaymentState().refunds;
    if (user?.userType === "buyer")
      refunds = refunds.filter(
        (refund) => refund.organizationId === user.organizationId,
      );
    return clone(
      [...refunds].sort((a, b) =>
        String(b.createdAt).localeCompare(String(a.createdAt)),
      ),
    );
  },
  getPaymentMethods(user) {
    return membershipService.getPaymentMethods(user.id).map((m) => ({
      ...m,
      scope:
        "Tokenized membership-billing method available for licensing checkout display; transactions remain separate.",
    }));
  },
  validateEligibility(invoice, user) {
    if (!invoice)
      return {
        ok: false,
        code: "MISSING_INVOICE",
        message: "Licensing invoice not found.",
      };
    if (user.accountStatus !== "active")
      return {
        ok: false,
        code: "ACCOUNT_RESTRICTED",
        message: safeFailure("ACCOUNT_RESTRICTED"),
      };
    if (
      user.userType === "buyer" &&
      invoice.organizationId !== user.organizationId
    )
      return {
        ok: false,
        code: "ACCOUNT_RESTRICTED",
        message: "This invoice belongs to another organization.",
      };
    if (
      ["Paid", "Refunded"].includes(invoice.status) ||
      invoice.balanceDue <= 0
    )
      return {
        ok: false,
        code: "INVOICE_ALREADY_PAID",
        message: safeFailure("INVOICE_ALREADY_PAID"),
      };
    if (["Cancelled", "Void"].includes(invoice.status))
      return {
        ok: false,
        code: "INVOICE_CANCELLED",
        message: safeFailure("INVOICE_CANCELLED"),
      };
    const contract = contractById(invoice.contractId);
    if (
      contract &&
      !["Fully Signed", "Countersigned", "Effective", "Completed"].includes(
        contract.status,
      )
    )
      return {
        ok: false,
        code: "CONTRACT_INCOMPLETE",
        message: "The contract is not yet at a payable stage.",
      };
    if (user.verificationStatus !== "approved")
      return {
        ok: false,
        code: "ACCOUNT_RESTRICTED",
        message:
          "Buyer verification must be approved before this licensing payment.",
      };
    return { ok: true, contract };
  },
  startPayment(invoiceId, user) {
    const invoice = this.getInvoice(invoiceId, user);
    const eligibility = this.validateEligibility(invoice, user);
    if (!eligibility.ok) return eligibility;
    const state = readPaymentState();
    if (
      state.transactions.some(
        (t) =>
          t.invoiceId === invoice.id &&
          [
            "Pending",
            "Processing",
            "Authentication Required",
            "Authorized",
          ].includes(t.status),
      )
    )
      return {
        ok: false,
        code: "DUPLICATE_PAYMENT",
        message: "Another payment attempt for this invoice is still active.",
      };
    return {
      ok: true,
      invoice,
      methods: this.getPaymentMethods(user),
      credits: this.getCredits(user).filter(
        (c) =>
          c.status === "Active" &&
          new Date(c.expiresAt) > new Date() &&
          c.eligibleInvoiceTypes.includes(invoice.invoiceType),
      ),
    };
  },
  processCard(invoiceId, values, user) {
    const invoice = this.getInvoice(invoiceId, user);
    const eligibility = this.validateEligibility(invoice, user);
    if (!eligibility.ok) return eligibility;
    const digits = String(values.cardNumber || "").replace(/\D/g, "");
    if (
      ![
        "4242424242424242",
        "4000000000000002",
        "4000000000009995",
        "4000002500003155",
      ].includes(digits)
    )
      return {
        ok: false,
        code: "PAYMENT_METHOD_INVALID",
        message: safeFailure("PAYMENT_METHOD_INVALID"),
      };
    const state = readPaymentState();
    if (
      state.transactions.some(
        (t) => t.metadata?.idempotencyKey === values.idempotencyKey,
      )
    )
      return {
        ok: false,
        code: "DUPLICATE_PAYMENT",
        message: "This payment request was already submitted.",
      };
    const credit = state.credits.find(
      (c) =>
        c.id === values.creditId &&
        c.organizationId === invoice.organizationId &&
        c.status === "Active",
    );
    const creditAmount = Math.min(
      Number(values.creditAmount || 0),
      credit?.remainingAmount || 0,
      invoice.balanceDue,
    );
    const charge = invoice.balanceDue - creditAmount;
    if (charge < 0)
      return {
        ok: false,
        code: "AMOUNT_INVALID",
        message: safeFailure("AMOUNT_INVALID"),
      };
    state.lastNumbers.payment += 1;
    const transaction = {
      id: uid("payment"),
      reference: `BM-PAY-2026-${String(state.lastNumbers.payment).padStart(4, "0")}`,
      paymentType: invoice.invoiceType,
      source: "Licensing Checkout",
      buyerId: user.id,
      buyer: user.name,
      organizationId: invoice.organizationId,
      organization: invoice.organization,
      projectId: invoice.projectId,
      quoteId: invoice.quoteId,
      contractId: invoice.contractId,
      licenceId: null,
      invoiceId: invoice.id,
      paymentMethodId: values.paymentMethodId || null,
      paymentMethodLabel: `Visa ending ${digits.slice(-4)}`,
      currency: invoice.currency,
      amount: charge,
      status: "Processing",
      providerReference: `mock_provider_${Date.now()}`,
      mockAuthorizationId: null,
      failureCode: null,
      failureMessage: null,
      authenticationRequired: false,
      authenticationStatus: null,
      initiatedAt: now(),
      authorizedAt: null,
      capturedAt: null,
      failedAt: null,
      refundedAt: null,
      reconciledAt: null,
      createdBy: user.name,
      metadata: {
        idempotencyKey: values.idempotencyKey || uid("bm_pay_idem"),
        cardLast4: digits.slice(-4),
        purchaseOrder: values.purchaseOrder || null,
        creditId: credit?.id || null,
        creditAmount,
        internalOnly: false,
      },
    };
    state.transactions.unshift(transaction);
    state.paymentAttempts.unshift({
      id: uid("attempt"),
      transactionId: transaction.id,
      invoiceId: invoice.id,
      attemptedAt: now(),
      method: transaction.paymentMethodLabel,
      status: "Processing",
    });
    activity(
      state,
      invoice,
      user,
      "Payment initiated",
      `${transaction.reference} started for ${formatPaymentMoney(charge)}.`,
      "Buyer",
    );
    if (digits.endsWith("0002") || digits.endsWith("9995")) {
      const code = digits.endsWith("0002")
        ? "CARD_DECLINED"
        : "INSUFFICIENT_FUNDS";
      transaction.status = "Failed";
      transaction.failureCode = code;
      transaction.failureMessage = safeFailure(code);
      transaction.failedAt = now();
      activity(
        state,
        transaction,
        user,
        "Payment failed",
        transaction.failureMessage,
        "Buyer",
      );
      notify(
        user.id,
        `${invoice.reference} payment failed`,
        transaction.failureMessage,
        "buyer-payment-failed",
      );
      writePaymentState(state);
      localStorage.setItem(SELECTED_PAYMENT_KEY, transaction.id);
      return {
        ok: false,
        failed: true,
        transaction: clone(transaction),
        code,
        message: transaction.failureMessage,
      };
    }
    if (digits.endsWith("3155")) {
      transaction.status = "Authentication Required";
      transaction.authenticationRequired = true;
      transaction.authenticationStatus = "Pending";
      transaction.mockAuthorizationId = uid("auth");
      state.authenticationRecords.push({
        id: transaction.mockAuthorizationId,
        transactionId: transaction.id,
        status: "Pending",
        requestedAt: now(),
        completedAt: null,
        merchant: "beatmondo Licensing (prototype)",
        amount: charge,
        currency: invoice.currency,
        cardLast4: "3155",
      });
      activity(
        state,
        transaction,
        user,
        "Authentication requested",
        "Mock strong-customer-authentication challenge created.",
        "Buyer",
      );
      notify(
        user.id,
        `${invoice.reference} needs authentication`,
        `Approve or decline the simulated ${formatPaymentMoney(charge)} payment.`,
        `buyer-payment-authentication`,
      );
      writePaymentState(state);
      localStorage.setItem(SELECTED_PAYMENT_KEY, transaction.id);
      return {
        ok: true,
        authenticationRequired: true,
        transaction: clone(transaction),
      };
    }
    const receipt = finishSuccess(
      state,
      invoice,
      transaction,
      creditAmount,
      user,
    );
    writePaymentState(state);
    return {
      ok: true,
      transaction: clone(transaction),
      receipt: clone(receipt),
      invoice: clone(invoice),
    };
  },
  authenticate(paymentId, approved, user) {
    return mutate((state) => {
      const t = state.transactions.find((x) => x.id === paymentId);
      const record = state.authenticationRecords.find(
        (x) => x.transactionId === paymentId,
      );
      if (!t || t.buyerId !== user.id || t.status !== "Authentication Required")
        return {
          ok: false,
          message: "Active payment authentication was not found.",
        };
      record.status = approved ? "Approved" : "Declined";
      record.completedAt = now();
      t.authenticationStatus = record.status;
      if (!approved) {
        t.status = "Failed";
        t.failureCode = "AUTHENTICATION_FAILED";
        t.failureMessage = safeFailure("AUTHENTICATION_FAILED");
        t.failedAt = now();
        activity(
          state,
          t,
          user,
          "Authentication failed",
          t.failureMessage,
          "Buyer",
        );
        return {
          ok: false,
          failed: true,
          transaction: clone(t),
          message: t.failureMessage,
        };
      }
      t.status = "Authorized";
      const invoice = state.invoices.find((i) => i.id === t.invoiceId);
      const receipt = finishSuccess(
        state,
        invoice,
        t,
        t.metadata?.creditAmount || 0,
        user,
      );
      activity(
        state,
        t,
        user,
        "Authentication approved",
        "Mock authentication approved and payment captured.",
        "Buyer",
      );
      return {
        ok: true,
        transaction: clone(t),
        receipt: clone(receipt),
        invoice: clone(invoice),
      };
    });
  },
  processPayPal(invoiceId, values, user) {
    const invoice = this.getInvoice(invoiceId, user);
    const eligibility = this.validateEligibility(invoice, user);
    if (!eligibility.ok) return eligibility;
    if (!values.payerEmail)
      return {
        ok: false,
        message: "A payer email placeholder is required for the simulation.",
      };
    return processSimulatedPartnerPayment(invoiceId, values, user);
  },
  processCrypto(invoiceId, values, user) {
    const visibleInvoice = this.getInvoice(invoiceId, user);
    const eligibility = this.validateEligibility(visibleInvoice, user);
    if (!eligibility.ok) return eligibility;
    if (
      !values.providerSelection ||
      !values.finalSettlementCurrency ||
      !values.walletConfirmed
    )
      return {
        ok: false,
        message:
          "Provider placeholder, settlement currency, and mock wallet confirmation are required.",
      };
    const state = readPaymentState();
    if (
      state.transactions.some(
        (t) => t.metadata?.idempotencyKey === values.idempotencyKey,
      )
    )
      return {
        ok: false,
        code: "DUPLICATE_PAYMENT",
        message: "This mock wallet-payment request was already submitted.",
      };
    const invoice = state.invoices.find((item) => item.id === invoiceId);
    const credit = state.credits.find(
      (c) =>
        c.id === values.creditId &&
        c.organizationId === invoice.organizationId &&
        c.status === "Active",
    );
    const creditAmount = Math.min(
      Number(values.creditAmount || 0),
      credit?.remainingAmount || 0,
      invoice.balanceDue,
    );
    const charge = invoice.balanceDue - creditAmount;
    if (charge < 0)
      return {
        ok: false,
        code: "AMOUNT_INVALID",
        message: safeFailure("AMOUNT_INVALID"),
      };
    state.lastNumbers.payment += 1;
    const sequence = String(state.lastNumbers.payment).padStart(4, "0");
    const transaction = {
      id: uid("payment"),
      reference: `BM-PAY-2026-${sequence}`,
      paymentType: invoice.invoiceType,
      source: "Crypto Wallet Simulation",
      buyerId: user.id,
      buyer: user.name,
      organizationId: invoice.organizationId,
      organization: invoice.organization,
      projectId: invoice.projectId,
      quoteId: invoice.quoteId,
      contractId: invoice.contractId,
      licenceId: null,
      invoiceId: invoice.id,
      paymentMethodId: null,
      paymentMethodLabel: "Crypto wallet · simulated",
      currency: invoice.currency,
      amount: charge,
      status: "Processing",
      providerReference: `mock_crypto_provider_${Date.now()}`,
      mockAuthorizationId: null,
      failureCode: null,
      failureMessage: null,
      authenticationRequired: false,
      authenticationStatus: null,
      initiatedAt: now(),
      authorizedAt: null,
      capturedAt: null,
      failedAt: null,
      refundedAt: null,
      reconciledAt: null,
      createdBy: user.name,
      metadata: {
        crypto: true,
        idempotencyKey: values.idempotencyKey || uid("bm_pay_idem"),
        purchaseOrder: values.purchaseOrder || null,
        creditId: credit?.id || null,
        creditAmount,
        providerSelection: values.providerSelection,
        providerExample: "Coinbase Commerce — example only",
        merchantVerification: "Required — not completed in prototype",
        finalSettlementCurrency: values.finalSettlementCurrency,
        walletConfirmationReference: `MOCK-WALLET-2026-${sequence}`,
        transactionStatus: "Mock wallet confirmed · simulation only",
        auditReference: `BM-AUD-CRYPTO-2026-${sequence}`,
        complianceReview: "Pending",
        internalOnly: false,
      },
    };
    state.transactions.unshift(transaction);
    state.paymentAttempts.unshift({
      id: uid("attempt"),
      transactionId: transaction.id,
      invoiceId: invoice.id,
      attemptedAt: now(),
      method: transaction.paymentMethodLabel,
      status: "Mock wallet confirmed",
    });
    activity(
      state,
      invoice,
      user,
      "Mock crypto wallet confirmed",
      `${transaction.metadata.walletConfirmationReference} recorded without a provider or blockchain call.`,
      "Buyer",
    );
    activity(
      state,
      transaction,
      user,
      "Crypto compliance review pending",
      `${transaction.metadata.auditReference}: merchant verification, provider, legal, tax, market, KYC/AML, refund, and dispute approvals remain outstanding.`,
      "Internal",
    );
    const receipt = finishSuccess(
      state,
      invoice,
      transaction,
      creditAmount,
      user,
    );
    writePaymentState(state);
    return {
      ok: true,
      message: "Mock wallet payment confirmation recorded.",
      transaction: clone(transaction),
      receipt: clone(receipt),
      invoice: clone(invoice),
    };
  },
  submitBankTransfer(invoiceId, values, user) {
    const invoice = this.getInvoice(invoiceId, user);
    const eligibility = this.validateEligibility(invoice, user);
    if (!eligibility.ok) return eligibility;
    if (!values.reference || !values.transferDate || !values.proofFile)
      return {
        ok: false,
        message:
          "Transfer date, buyer reference, and proof simulation are required.",
      };
    return mutate((state) => {
      state.lastNumbers.payment += 1;
      const t = {
        id: uid("payment"),
        reference: `BM-PAY-2026-${String(state.lastNumbers.payment).padStart(4, "0")}`,
        paymentType: invoice.invoiceType,
        source: "Bank Transfer Submission",
        buyerId: user.id,
        buyer: user.name,
        organizationId: invoice.organizationId,
        organization: invoice.organization,
        projectId: invoice.projectId,
        quoteId: invoice.quoteId,
        contractId: invoice.contractId,
        licenceId: null,
        invoiceId: invoice.id,
        paymentMethodId: null,
        paymentMethodLabel: "Bank transfer",
        currency: invoice.currency,
        amount: invoice.balanceDue,
        status: "Pending Reconciliation",
        providerReference: null,
        mockAuthorizationId: null,
        failureCode: "BANK_TRANSFER_PENDING",
        failureMessage: null,
        authenticationRequired: false,
        authenticationStatus: null,
        initiatedAt: now(),
        authorizedAt: null,
        capturedAt: null,
        failedAt: null,
        refundedAt: null,
        reconciledAt: null,
        createdBy: user.name,
        metadata: {
          idempotencyKey: values.idempotencyKey || uid("bm_pay_idem"),
          purchaseOrder: values.reference,
          internalOnly: false,
        },
      };
      state.transactions.unshift(t);
      state.bankTransfers.unshift({
        id: uid("bank-transfer"),
        transactionId: t.id,
        invoiceId: invoice.id,
        buyerReference: values.reference,
        transferDate: values.transferDate,
        proofFile: values.proofFile,
        status: "Proof Submitted",
        amount: t.amount,
        currency: t.currency,
        notes: [],
      });
      activity(
        state,
        t,
        user,
        "Bank transfer submitted",
        `${values.reference} proof submitted for finance review.`,
        "Buyer",
      );
      notify(
        "user-finance",
        `${invoice.reference} bank transfer pending`,
        `${invoice.organization} submitted ${values.reference}.`,
        `admin-payment-reconciliation`,
      );
      localStorage.setItem(SELECTED_PAYMENT_KEY, t.id);
      return { ok: true, pending: true, transaction: clone(t) };
    });
  },
  recordManualPayment(invoiceId, values, user) {
    if (!can(user, "payments.record_manual"))
      return { ok: false, message: "Manual-payment permission is required." };
    if (
      !values?.amount ||
      !values?.date ||
      !values?.reference ||
      !values?.method ||
      !values?.evidence ||
      !values?.internalNote ||
      !values?.approver
    )
      return {
        ok: false,
        message:
          "Amount, date, reference, method, evidence, note, and approver are required.",
      };
    return mutate((state) => {
      const invoice = state.invoices.find((item) => item.id === invoiceId);
      if (!invoice)
        return { ok: false, message: "Licensing invoice not found." };
      const amount = Number(values.amount);
      if (amount <= 0 || amount > invoice.balanceDue)
        return {
          ok: false,
          message:
            "Manual payment must be positive and cannot silently exceed the invoice balance.",
        };
      state.lastNumbers.payment += 1;
      const transaction = {
        id: uid("payment"),
        reference: `BM-PAY-2026-${String(state.lastNumbers.payment).padStart(4, "0")}`,
        paymentType: invoice.invoiceType,
        source: "Manual Finance Record",
        buyerId: invoice.buyerId,
        buyer: invoice.buyer,
        organizationId: invoice.organizationId,
        organization: invoice.organization,
        projectId: invoice.projectId,
        quoteId: invoice.quoteId,
        contractId: invoice.contractId,
        licenceId: null,
        invoiceId: invoice.id,
        paymentMethodId: null,
        paymentMethodLabel: values.method,
        currency: invoice.currency,
        amount,
        status: "Reconciled",
        providerReference: values.reference,
        mockAuthorizationId: null,
        failureCode: null,
        failureMessage: null,
        authenticationRequired: false,
        authenticationStatus: "Manual evidence reviewed",
        initiatedAt: values.date,
        authorizedAt: values.date,
        capturedAt: values.date,
        failedAt: null,
        refundedAt: null,
        reconciledAt: now(),
        createdBy: user.name,
        metadata: {
          idempotencyKey: uid("bm_pay_idem"),
          cardLast4: null,
          evidence: values.evidence,
          internalNote: values.internalNote,
          approver: values.approver,
          internalOnly: true,
        },
      };
      state.transactions.unshift(transaction);
      const receipt = finishSuccess(state, invoice, transaction, 0, user);
      transaction.status = "Reconciled";
      activity(
        state,
        transaction,
        user,
        "Manual payment recorded",
        `${values.method} ${values.reference} recorded with evidence and approver ${values.approver}.`,
      );
      return {
        ok: true,
        transaction: clone(transaction),
        receipt: clone(receipt),
      };
    });
  },
  reconcile(paymentId, decision, note, user) {
    if (!can(user, "payments.reconcile"))
      return {
        ok: false,
        message: "Payment-reconciliation permission is required.",
      };
    return mutate((state) => {
      const t = state.transactions.find((x) => x.id === paymentId);
      const transfer = state.bankTransfers.find(
        (x) => x.transactionId === paymentId,
      );
      if (!t || !transfer)
        return { ok: false, message: "Bank-transfer record not found." };
      if (!note)
        return { ok: false, message: "A reconciliation note is required." };
      if (decision !== "Reconciled") {
        t.status = "Failed";
        t.failureCode = "PROCESSING_ERROR";
        t.failureMessage = "Bank-transfer proof was not matched.";
        transfer.status = decision;
        activity(state, t, user, "Bank transfer rejected", note);
        return { ok: true, transaction: clone(t) };
      }
      t.status = "Reconciled";
      t.reconciledAt = now();
      transfer.status = "Reconciled";
      state.reconciliations.unshift({
        id: uid("reconciliation"),
        transactionId: t.id,
        invoiceId: t.invoiceId,
        status: "Reconciled",
        note,
        reconciledAt: now(),
        reconciledBy: user.name,
      });
      const invoice = state.invoices.find((i) => i.id === t.invoiceId);
      const receipt = finishSuccess(state, invoice, t, 0, user);
      t.status = "Reconciled";
      activity(state, t, user, "Payment reconciled", note);
      return { ok: true, transaction: clone(t), receipt: clone(receipt) };
    });
  },
  createCredit(values, user) {
    if (!can(user, "payments.manage_credits"))
      return {
        ok: false,
        message: "Credit-management permission is required.",
      };
    if (!values.organizationId || !values.amount || !values.reason)
      return {
        ok: false,
        message: "Organization, amount, and reason are required.",
      };
    return mutate((state) => {
      state.lastNumbers.credit += 1;
      const c = {
        id: uid("credit"),
        reference: `BM-CR-2026-${String(state.lastNumbers.credit).padStart(4, "0")}`,
        organizationId: values.organizationId,
        buyerId: values.buyerId || null,
        currency: values.currency || "USD",
        originalAmount: Number(values.amount),
        remainingAmount: Number(values.amount),
        reason: values.reason,
        sourceTransactionId: values.sourceTransactionId || null,
        eligibleInvoiceTypes: values.eligibleInvoiceTypes || [
          "Licence Balance",
          "Full Licence Fee",
        ],
        createdAt: now(),
        expiresAt:
          values.expiresAt ||
          new Date(Date.now() + 180 * 86400000).toISOString(),
        status: "Active",
        createdBy: user.name,
        usageHistory: [],
      };
      state.credits.unshift(c);
      activity(
        state,
        c,
        user,
        "Credit created",
        `${c.reference} created for ${formatPaymentMoney(c.originalAmount)}.`,
      );
      return { ok: true, credit: clone(c) };
    });
  },
  requestRefund(paymentId, values, user) {
    if (!can(user, "payments.request_refund"))
      return { ok: false, message: "Refund-request permission is required." };
    return mutate((state) => {
      const t = state.transactions.find((x) => x.id === paymentId);
      if (
        !t ||
        !["Succeeded", "Reconciled", "Partially Refunded"].includes(t.status)
      )
        return {
          ok: false,
          message: "Only a captured payment can be refunded.",
        };
      const completed = state.refunds
        .filter(
          (r) => r.originalTransactionId === t.id && r.status === "Completed",
        )
        .reduce((n, r) => n + r.amount, 0);
      const amount = Number(values.amount);
      if (!amount || amount > t.amount - completed)
        return {
          ok: false,
          message: "Refund exceeds the remaining captured amount.",
        };
      state.lastNumbers.refund += 1;
      const approvals =
        amount <= 100000
          ? [{ type: "Finance", status: "Pending", approver: "Nadia Foster" }]
          : amount <= 500000
            ? [
                {
                  type: "Finance",
                  status: "Pending",
                  approver: "Nadia Foster",
                },
                {
                  type: "Administrator",
                  status: "Pending",
                  approver: "Preston Repenning",
                },
              ]
            : [
                {
                  type: "Senior",
                  status: "Pending",
                  approver: "Preston Repenning",
                },
              ];
      const r = {
        id: uid("refund"),
        reference: `BM-REF-2026-${String(state.lastNumbers.refund).padStart(4, "0")}`,
        originalTransactionId: t.id,
        invoiceId: t.invoiceId,
        buyerId: t.buyerId,
        organizationId: t.organizationId,
        currency: t.currency,
        amount,
        status: "Pending Review",
        reason: values.reason,
        buyerMessage: values.buyerMessage,
        internalNote: values.internalNote,
        contractImpact: values.contractImpact || "Review required",
        licenceImpact: values.licenceImpact || "Review required",
        deliveryImpact: values.deliveryImpact || "Review required",
        approvals,
        createdAt: now(),
        completedAt: null,
      };
      state.refunds.unshift(r);
      activity(
        state,
        r,
        user,
        "Refund requested",
        `${r.reference} requested for ${formatPaymentMoney(amount)}.`,
      );
      return { ok: true, refund: clone(r) };
    });
  },
  decideRefund(refundId, decision, note, user) {
    if (!can(user, "payments.approve_refund"))
      return { ok: false, message: "Refund-approval permission is required." };
    return mutate((state) => {
      const r = state.refunds.find((x) => x.id === refundId);
      if (!r) return { ok: false, message: "Refund not found." };
      const pending = r.approvals.find((a) => a.status === "Pending");
      if (!pending)
        return { ok: false, message: "No pending refund approval remains." };
      pending.status = decision;
      pending.approver = user.name;
      pending.note = note;
      pending.date = now();
      r.status =
        decision === "Rejected"
          ? "Rejected"
          : r.approvals.every((a) => a.status === "Approved")
            ? "Approved"
            : "Pending Review";
      activity(
        state,
        r,
        user,
        `Refund ${decision.toLowerCase()}`,
        note || "Refund decision recorded.",
      );
      return { ok: true, refund: clone(r) };
    });
  },
  issueRefund(refundId, user) {
    if (!can(user, "payments.issue_refund"))
      return { ok: false, message: "Refund-issue permission is required." };
    return mutate((state) => {
      const r = state.refunds.find((x) => x.id === refundId);
      if (!r || r.status !== "Approved")
        return {
          ok: false,
          message: "All required refund approvals must be complete.",
        };
      const t = state.transactions.find(
        (x) => x.id === r.originalTransactionId,
      );
      const invoice = state.invoices.find((i) => i.id === r.invoiceId);
      r.status = "Completed";
      r.completedAt = now();
      t.status = r.amount === t.amount ? "Refunded" : "Partially Refunded";
      t.refundedAt = now();
      invoice.status =
        r.amount === invoice.amountPaid ? "Refunded" : "Partially Refunded";
      const obligation = state.obligations.find(
        (o) => o.invoiceId === invoice.id,
      );
      if (obligation) {
        obligation.amountRefunded += r.amount;
        obligation.balanceRemaining += r.amount;
        obligation.status = "Under Review";
      }
      activity(
        state,
        r,
        user,
        "Refund completed",
        `${formatPaymentMoney(r.amount)} refund recorded.`,
      );
      notify(
        r.buyerId,
        `${r.reference} refund recorded`,
        r.buyerMessage,
        "buyer-payments",
      );
      syncContractPayment(t.contractId, state);
      return { ok: true, refund: clone(r), transaction: clone(t) };
    });
  },
  analytics() {
    const s = readPaymentState();
    const successful = s.transactions.filter((t) =>
      ["Succeeded", "Reconciled", "Partially Refunded", "Refunded"].includes(
        t.status,
      ),
    );
    const failed = s.transactions.filter((t) =>
      ["Failed", "Declined"].includes(t.status),
    );
    const total = successful.reduce((n, t) => n + t.amount, 0);
    return {
      transactions: s.transactions.length,
      totalCollected: total,
      successfulVolume: successful.reduce((n, t) => n + t.amount, 0),
      failedVolume: failed.reduce((n, t) => n + t.amount, 0),
      average: successful.length ? Math.round(total / successful.length) : 0,
      successRate: s.transactions.length
        ? Math.round((successful.length / s.transactions.length) * 100)
        : 0,
      outstanding: s.invoices.reduce((n, i) => n + i.balanceDue, 0),
      pastDue: s.invoices
        .filter((i) => i.status === "Past Due")
        .reduce((n, i) => n + i.balanceDue, 0),
      failed: failed.length,
      pendingTransfers: s.transactions.filter(
        (t) => t.status === "Pending Reconciliation",
      ).length,
      refundValue: s.refunds
        .filter((r) => r.status === "Completed")
        .reduce((n, r) => n + r.amount, 0),
      creditValue: s.credits
        .filter((c) => c.status === "Active")
        .reduce((n, c) => n + c.remainingAmount, 0),
      reconciliationBacklog: s.bankTransfers.filter(
        (b) => b.status !== "Reconciled",
      ).length,
      byStatus: Object.fromEntries(
        [...new Set(s.transactions.map((t) => t.status))].map((status) => [
          status,
          s.transactions.filter((t) => t.status === status).length,
        ]),
      ),
      byMethod: Object.fromEntries(
        [...new Set(s.transactions.map((t) => t.paymentMethodLabel))].map(
          (method) => [
            method,
            s.transactions.filter((t) => t.paymentMethodLabel === method)
              .length,
          ],
        ),
      ),
    };
  },
};
