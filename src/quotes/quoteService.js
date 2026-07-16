import { readAuthState, writeAuthState } from "../auth/authService.js";
import { rightsService } from "../rights/rightsService.js";
import { membershipService } from "../membership/membershipService.js";
import {
  DEFAULT_QUOTE_STATE,
  QUOTE_STORAGE_KEY,
  SELECTED_QUOTE_KEY,
} from "./quoteData.js";

const clone = (v) => JSON.parse(JSON.stringify(v));
const now = () => new Date().toISOString();
const uid = (p) =>
  `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const parse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const round = (n, step = 5000) => Math.round(n / step) * step;

function normalize(value) {
  const base = clone(DEFAULT_QUOTE_STATE);
  if (!value || !Array.isArray(value.quotes)) return base;
  const merge = (current, defaults) => [
    ...current,
    ...defaults.filter((d) => !current.some((c) => c.id === d.id)),
  ];
  return {
    ...base,
    ...value,
    quotes: merge(value.quotes, base.quotes),
    pricingModels: value.pricingModels?.length
      ? value.pricingModels
      : base.pricingModels,
    calculations: value.calculations || base.calculations,
    activity: value.activity || [],
    analyticsEvents: value.analyticsEvents || [],
    quoteVersions: value.quoteVersions || [],
  };
}
export function readQuoteState() {
  const raw = localStorage.getItem(QUOTE_STORAGE_KEY);
  const state = normalize(raw ? parse(raw) : null);
  if (!raw || !parse(raw))
    localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function writeQuoteState(state) {
  const next = normalize(state);
  localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(next));
  return next;
}
function mutate(fn) {
  const state = readQuoteState();
  const result = fn(state);
  writeQuoteState(state);
  return result;
}
function permitted(user, permission) {
  return (
    user?.permissions?.includes("*") || user?.permissions?.includes(permission)
  );
}
function activity(
  state,
  quote,
  user,
  action,
  description,
  visibility = "Internal",
) {
  const event = {
    id: uid("quote-event"),
    quoteId: quote?.id || null,
    reference: quote?.reference || null,
    userId: user?.id || null,
    actor: user?.name || "Quote engine",
    action,
    description,
    visibility,
    timestamp: now(),
  };
  state.activity.unshift(event);
  return event;
}
function message(userId, title, body, action = "buyer-quotes") {
  if (!userId) return;
  const state = readAuthState();
  state.messages.unshift({
    id: uid("quote-message"),
    userId,
    type: "quote",
    title,
    body,
    createdAt: now(),
    read: false,
    action,
  });
  writeAuthState(state);
}
const rules = () =>
  readQuoteState().pricingModels.find((m) => m.active)?.rules || {};
const mult = (table, key) => Number(table?.[key] ?? 1);

export function formatQuoteMoney(amount, currency = "USD") {
  if (amount == null) return "Not calculated";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export function calculateSuggestedQuoteRange(input) {
  const required = [
    "trackId",
    "projectType",
    "territory",
    "term",
    "exclusivity",
    "prominence",
    "scale",
  ];
  const missing = required.filter((key) => !input[key]);
  if (!input.media?.length) missing.push("media");
  if (missing.length)
    return {
      ok: false,
      status: "Information Required",
      missing,
      blockingIssues: [`Missing: ${missing.join(", ")}`],
    };
  const r = rules();
  const rights = rightsService.getBuyerSummary(input.trackId, {
    territory: input.territory,
    assets: input.assets || [],
  });
  if (!rights || !rights.licensable || Number(input.trackId) === 15)
    return {
      ok: false,
      status: "Blocked",
      confidence: "Manual",
      rights,
      blockingIssues: [
        "Pricing unavailable while licensing eligibility is under review.",
      ],
      warnings: [
        "Do not infer or invent ownership, publishing, or commercial eligibility.",
      ],
    };
  const base = r.baseRates?.[input.projectType] || [300000, 700000];
  const factors = [
    ["Territory", mult(r.territoryMultipliers, input.territory)],
    ["Term", mult(r.termMultipliers, input.term)],
    ["Exclusivity", mult(r.exclusivityMultipliers, input.exclusivity)],
    ["Prominence", mult(r.prominenceMultipliers, input.prominence)],
    ["Scale", mult(r.scaleMultipliers, input.scale)],
  ];
  const mediaFactor =
    Math.max(...input.media.map((m) => mult(r.mediaMultipliers, m)), 1) +
    Math.max(0, input.media.length - 1) * 0.08;
  factors.push(["Media", mediaFactor]);
  const factor = factors.reduce((n, [, v]) => n * v, 1);
  let minimum = base[0] * factor,
    maximum = base[1] * factor;
  const additions = [];
  (input.assets || []).forEach((asset) => {
    const amount = Number(r.assetFees?.[asset] || 0);
    if (amount) additions.push({ name: asset, amount });
  });
  const rush = Number(r.rushFees?.[input.rush] || 0);
  if (rush) additions.push({ name: `${input.rush} rush`, amount: rush });
  const additionsTotal = additions.reduce((n, x) => n + x.amount, 0);
  minimum += additionsTotal;
  maximum += additionsTotal;
  const discountRate = input.buyerTier?.includes("VIP")
    ? Number(r.buyerDiscountRules?.VIP || 0)
    : 0;
  if (discountRate) {
    minimum *= 1 - discountRate;
    maximum *= 1 - discountRate;
  }
  minimum = round(minimum);
  maximum = round(maximum);
  const manualReasons = [];
  Object.entries({
    majorProjectTypes: input.projectType,
    prominence: input.prominence,
    terms: input.term,
    exclusivity: input.exclusivity,
    rush: input.rush,
    scale: input.scale,
  }).forEach(([key, value]) => {
    if (r.manualReviewThresholds?.[key]?.includes(value))
      manualReasons.push(`${value} requires manual review.`);
  });
  if (rights.manualReviewRequired)
    manualReasons.push("Rights conditions require manual review.");
  const controlledMaster = rights.master?.includes("100") ? 100 : 75;
  const controlledPublishing = rights.publishing?.includes("100") ? 100 : 75;
  const recommended = round((minimum + maximum) / 2);
  return {
    ok: true,
    status: "Calculated",
    currency: input.currency || "USD",
    minimum,
    maximum,
    recommendedAmount: recommended,
    confidence: manualReasons.length
      ? "Low"
      : rights.eligibility === "Eligible"
        ? "High"
        : "Medium",
    manualReviewRequired: Boolean(manualReasons.length),
    manualReasons,
    warnings: rights.restrictions || [],
    blockingIssues: [],
    rights,
    baseRates: { minimum: base[0], maximum: base[1] },
    multipliers: factors,
    additions,
    discounts: discountRate
      ? [
          {
            name: "Configured VIP service discount",
            rate: discountRate,
            amount: -round(recommended * discountRate),
          },
        ]
      : [],
    split: {
      master: round(
        recommended *
          (controlledMaster / (controlledMaster + controlledPublishing)),
      ),
      publishing: round(
        recommended *
          (controlledPublishing / (controlledMaster + controlledPublishing)),
      ),
      uncontrolledNotice:
        rights.eligibility !== "Eligible"
          ? "Third-party or uncontrolled shares remain subject to separate approval."
          : null,
    },
    calculationNotes: [
      "Fictional internal pricing guidance only.",
      "Suggested amounts remain draft and review-subject.",
    ],
  };
}

export const quoteService = {
  getState: readQuoteState,
  reset() {
    localStorage.removeItem(QUOTE_STORAGE_KEY);
    return readQuoteState();
  },
  getQuote(id) {
    return clone(readQuoteState().quotes.find((q) => q.id === id) || null);
  },
  getQuotes(user) {
    let list = readQuoteState().quotes;
    if (user?.userType === "buyer")
      list = list.filter(
        (q) =>
          q.buyerId === user.id || q.organizationId === user.organizationId,
      );
    return clone(
      list.sort((a, b) =>
        String(b.updatedAt).localeCompare(String(a.updatedAt)),
      ),
    );
  },
  calculate(input, user) {
    const result = calculateSuggestedQuoteRange(input);
    if (!result.ok) return result;
    return mutate((state) => {
      const calculation = {
        id: uid("calc"),
        inputs: clone(input),
        ...result,
        pricingModelVersion: state.pricingModels.find((m) => m.active)?.version,
        rightsVersion: result.rights?.rightsVersion || 1,
        createdAt: now(),
        createdBy: user?.name || "Quote engine",
      };
      state.calculations.unshift(calculation);
      state.analyticsEvents.unshift({
        id: uid("analytics"),
        type: "quote.calculated",
        timestamp: now(),
        userId: user?.id,
      });
      return { ok: true, calculation };
    });
  },
  createDraft(input, calculation, user) {
    if (!permitted(user, "quotes.create"))
      return { ok: false, message: "Quote creation permission is required." };
    return mutate((state) => {
      const sequence =
        Math.max(
          ...state.quotes.map((q) => Number(q.reference.split("-").pop()) || 0),
          47,
        ) + 1;
      const quote = {
        id: uid("quote"),
        reference: `BM-Q-2026-${String(sequence).padStart(4, "0")}`,
        calculationId: calculation?.id || null,
        projectId: input.projectId || uid("project"),
        project: input.project || "Untitled project",
        buyerId: input.buyerId,
        buyer: input.buyer,
        organizationId: input.organizationId,
        organization: input.organization,
        trackId: Number(input.trackId),
        trackTitle: input.trackTitle,
        artist: input.artist,
        quoteType: calculation?.manualReviewRequired
          ? "Conditional Range"
          : "Suggested Range",
        status: "Draft",
        version: 1,
        current: true,
        currency: input.currency || "USD",
        minimum: calculation?.minimum || null,
        maximum: calculation?.maximum || null,
        total: calculation?.recommendedAmount || 0,
        subtotal: calculation?.recommendedAmount || 0,
        discounts:
          calculation?.discounts?.reduce((n, d) => n + d.amount, 0) || 0,
        tax: 0,
        lineItems: [
          {
            id: uid("line"),
            type: "Master Licence Fee",
            name: "Master Licence Fee",
            description: "Master synchronization rights",
            quantity: 1,
            total: round((calculation?.recommendedAmount || 0) / 2),
            buyerVisible: true,
          },
          {
            id: uid("line"),
            type: "Publishing Licence Fee",
            name: "Publishing Licence Fee",
            description: "Publishing synchronization rights",
            quantity: 1,
            total: round((calculation?.recommendedAmount || 0) / 2),
            buyerVisible: true,
          },
        ],
        terms: {
          media: input.media,
          territory: input.territory,
          term: input.term,
          exclusivity: input.exclusivity,
          prominence: input.prominence,
          scale: input.scale,
          assets: input.assets || [],
          rush: input.rush || "Standard",
          paymentTerms: "Due before delivery",
        },
        conditions: calculation?.warnings || [],
        exclusions: [
          "No transfer of ownership",
          "No unapproved media or territory expansion",
        ],
        rightsSummary: {
          eligibility: calculation?.rights?.eligibility,
          rightsVersion: calculation?.rightsVersion || 1,
        },
        approvalStatus: "Not Started",
        approvers: [],
        validFrom: now(),
        validUntil: new Date(Date.now() + 21 * 86400000).toISOString(),
        buyerMessage:
          "Prepared by beatmondo for project review. Final rights require contract completion and any required payment.",
        internalNotes: [],
        createdAt: now(),
        updatedAt: now(),
        createdBy: user.name,
        quoteOwner: user.name,
        negotiation: [],
        buyerResponses: [],
        futureWorkflow: {
          contractReadiness: "Not Ready",
          invoiceReadiness: "Not Ready",
        },
        pricingModelVersion: calculation?.pricingModelVersion || 2,
      };
      state.quotes.unshift(quote);
      activity(
        state,
        quote,
        user,
        "Quote created",
        "Draft quote created from a saved calculation.",
      );
      localStorage.setItem(SELECTED_QUOTE_KEY, quote.id);
      return { ok: true, quote };
    });
  },
  update(id, changes, user, reason = "Quote edited") {
    return mutate((state) => {
      const quote = state.quotes.find((q) => q.id === id);
      if (!quote) return { ok: false, message: "Quote not found." };
      if (!permitted(user, "quotes.edit"))
        return { ok: false, message: "Quote editing permission is required." };
      state.quoteVersions.unshift({
        ...clone(quote),
        snapshotId: uid("snapshot"),
        snapshotAt: now(),
      });
      Object.assign(quote, changes, { updatedAt: now() });
      activity(state, quote, user, "Quote edited", reason);
      return { ok: true, quote: clone(quote) };
    });
  },
  requestApproval(id, user) {
    return mutate((state) => {
      const q = state.quotes.find((x) => x.id === id);
      if (!q) return { ok: false, message: "Quote not found." };
      if (!permitted(user, "quotes.request_approval"))
        return {
          ok: false,
          message: "Approval-request permission is required.",
        };
      const needed = [
        ["Licensing", "Jordan Lee"],
        ["Rights", "Amelia Grant"],
      ];
      if (q.total >= 500000) needed.push(["Finance", "Finance Team"]);
      if (q.total >= 2000000 || q.quoteType === "Conditional Range")
        needed.push(["Senior", "Preston Repenning"]);
      q.approvers = needed.map(([type, approver]) => ({
        id: uid("approval"),
        type,
        status: "Pending",
        approver,
        note: "",
        date: null,
        history: [],
      }));
      q.status = "Internal Review";
      q.approvalStatus = "Pending";
      q.updatedAt = now();
      activity(
        state,
        q,
        user,
        "Approval requested",
        `${needed.map((x) => x[0]).join(", ")} approvals requested.`,
      );
      return { ok: true, quote: clone(q) };
    });
  },
  decideApproval(id, type, decision, note, user) {
    return mutate((state) => {
      const q = state.quotes.find((x) => x.id === id);
      if (!q) return { ok: false, message: "Quote not found." };
      const permission =
        type === "Rights"
          ? "quotes.approve_rights"
          : type === "Finance"
            ? "quotes.approve_finance"
            : type === "Senior"
              ? "quotes.approve_senior"
              : "quotes.approve_licensing";
      if (!permitted(user, permission))
        return {
          ok: false,
          message: `${type} approval permission is required.`,
        };
      const a = q.approvers.find((x) => x.type === type);
      if (!a) return { ok: false, message: "This approval is not required." };
      a.status = decision;
      a.note = note;
      a.approver = user.name;
      a.date = now();
      q.approvalStatus = q.approvers.some((x) => x.status === "Rejected")
        ? "Rejected"
        : q.approvers.every((x) => x.status === "Approved")
          ? "Completed"
          : "Pending";
      if (q.approvalStatus === "Rejected") q.status = "Draft";
      activity(
        state,
        q,
        user,
        `${type} ${decision.toLowerCase()}`,
        note || `${type} decision recorded.`,
      );
      return { ok: true, quote: clone(q) };
    });
  },
  send(id, user) {
    return mutate((state) => {
      const q = state.quotes.find((x) => x.id === id);
      if (!q) return { ok: false, message: "Quote not found." };
      if (!permitted(user, "quotes.send"))
        return { ok: false, message: "Quote sending permission is required." };
      if (q.approvalStatus !== "Completed")
        return {
          ok: false,
          message: "All required approvals must be completed before sending.",
        };
      const rights = rightsService.getBuyerSummary(q.trackId, {
        territory: q.terms.territory,
        assets: q.terms.assets,
      });
      if (!rights?.licensable || q.trackId === 15)
        return {
          ok: false,
          message: "Current rights eligibility blocks sending.",
        };
      q.status = "Sent";
      q.sentAt = now();
      q.updatedAt = now();
      message(
        q.buyerId,
        `Quote ${q.reference} is ready`,
        `${q.trackTitle} for ${q.project} is ready for review.`,
        `buyer-quote`,
      );
      activity(
        state,
        q,
        user,
        "Quote sent",
        "Buyer-safe quote version sent.",
        "Buyer",
      );
      return { ok: true, quote: clone(q) };
    });
  },
  respond(id, type, payload, user) {
    return mutate((state) => {
      const q = state.quotes.find((x) => x.id === id);
      if (!q || q.buyerId !== user?.id)
        return {
          ok: false,
          message: "This quote is not available to your account.",
        };
      if (!["Sent", "Viewed", "Buyer Revision Requested"].includes(q.status))
        return {
          ok: false,
          message: "This quote is not open for a buyer response.",
        };
      if (new Date(q.validUntil) < new Date())
        return { ok: false, message: "This quote has expired." };
      if (type === "Accepted") {
        const membership = membershipService.getCurrentMembership(user.id);
        if (
          user.accountStatus !== "active" ||
          user.verificationStatus !== "approved" ||
          (membership && membership.status !== "Active") ||
          !q.rightsSummary?.eligibility?.match(/Eligible|Conditional/)
        )
          return {
            ok: false,
            message:
              "Account, verification, membership, or rights eligibility blocks acceptance.",
          };
        q.status = "Accepted";
        q.acceptedAt = now();
        q.acceptedBy = user.name;
        q.futureWorkflow = {
          contractReadiness: "Ready",
          invoiceReadiness: "Pending contract",
        };
      } else if (type === "Change Request") {
        q.status = "Buyer Revision Requested";
        q.buyerResponses.push({
          type,
          message: payload.message,
          requestedBudget: Number(payload.requestedBudget || 0),
          createdAt: now(),
        });
        q.negotiation.push({
          id: uid("neg"),
          author: user.name,
          role: "Buyer",
          date: now(),
          message: payload.message,
          proposedAmount: Number(payload.requestedBudget || 0),
          internal: false,
        });
      } else {
        q.status = "Declined";
        q.declinedAt = now();
        q.buyerResponses.push({
          type: "Decline",
          reason: payload.message,
          createdAt: now(),
        });
      }
      q.updatedAt = now();
      activity(
        state,
        q,
        user,
        `Quote ${type.toLowerCase()}`,
        payload.message || `Buyer ${type.toLowerCase()}.`,
        "Buyer",
      );
      message(
        "user-jordan",
        `Quote ${q.reference}: ${type}`,
        `${user.name} responded to ${q.trackTitle}.`,
        "admin-quote",
      );
      return { ok: true, quote: clone(q) };
    });
  },
  addNegotiation(id, text, amount, user, internal = false) {
    return mutate((state) => {
      const q = state.quotes.find((x) => x.id === id);
      if (!q) return { ok: false, message: "Quote not found." };
      q.negotiation.push({
        id: uid("neg"),
        author: user.name,
        role: user.userType === "buyer" ? "Buyer" : "beatmondo",
        date: now(),
        message: text,
        proposedAmount: Number(amount || 0) || null,
        internal,
      });
      q.updatedAt = now();
      activity(
        state,
        q,
        user,
        "Negotiation message added",
        internal ? "Internal note added." : "Negotiation message shared.",
        internal ? "Internal" : "Buyer",
      );
      return { ok: true, quote: clone(q) };
    });
  },
  analytics() {
    const qs = readQuoteState().quotes;
    const sent = qs.filter((q) => q.sentAt);
    const accepted = qs.filter((q) => q.status === "Accepted");
    return {
      total: qs.length,
      pipeline: qs
        .filter(
          (q) =>
            !["Accepted", "Declined", "Expired", "Withdrawn"].includes(
              q.status,
            ),
        )
        .reduce((n, q) => n + (q.total || q.maximum || 0), 0),
      acceptedValue: accepted.reduce((n, q) => n + q.total, 0),
      conversion: sent.length
        ? Math.round((accepted.length / sent.length) * 100)
        : 0,
      average: accepted.length
        ? Math.round(
            accepted.reduce((n, q) => n + q.total, 0) / accepted.length,
          )
        : 0,
      byStatus: Object.fromEntries(
        qs
          .map((q) => q.status)
          .map((s) => [s, qs.filter((q) => q.status === s).length]),
      ),
    };
  },
};
