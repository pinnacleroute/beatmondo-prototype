import { readAuthState, writeAuthState } from "../auth/authService.js";
import { membershipService } from "../membership/membershipService.js";
import {
  quoteService,
  readQuoteState,
  writeQuoteState,
} from "../quotes/quoteService.js";
import { rightsService } from "../rights/rightsService.js";
import { readStorageState } from "../storage/storageService.js";
import { STORAGE_KEY } from "../storage/storageData.js";
import {
  DEFAULT_CONTRACT_STATE,
  CONTRACT_STORAGE_KEY,
  CONTRACT_STATUSES,
  SELECTED_CONTRACT_KEY,
  SIGNATURE_CODE,
} from "./contractData.js";

const clone = (v) => JSON.parse(JSON.stringify(v));
const now = () => new Date().toISOString();
const uid = (p) =>
  `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const parse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const allowed = (user, p) =>
  user?.permissions?.includes("*") || user?.permissions?.includes(p);
function normalize(value) {
  const base = clone(DEFAULT_CONTRACT_STATE);
  if (!value || !Array.isArray(value.contracts)) return base;
  const merge = (a = [], b = []) => [
    ...a,
    ...b.filter((x) => !a.some((y) => y.id === x.id)),
  ];
  return {
    ...base,
    ...value,
    contracts: merge(value.contracts, base.contracts),
    templates: value.templates?.length ? value.templates : base.templates,
    clauses: value.clauses?.length ? value.clauses : base.clauses,
    contractVersions: value.contractVersions || [],
    signatureRecords: value.signatureRecords || [],
    consentRecords: value.consentRecords || [],
    signedDocuments: value.signedDocuments || [],
    activity: value.activity || [],
    analyticsEvents: value.analyticsEvents || [],
  };
}
export function readContractState() {
  const raw = localStorage.getItem(CONTRACT_STORAGE_KEY);
  const state = normalize(raw ? parse(raw) : null);
  if (!raw || !parse(raw))
    localStorage.setItem(CONTRACT_STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function writeContractState(state) {
  const next = normalize(state);
  localStorage.setItem(CONTRACT_STORAGE_KEY, JSON.stringify(next));
  return next;
}
function mutate(fn) {
  const state = readContractState();
  const result = fn(state);
  writeContractState(state);
  return result;
}
function event(
  state,
  contract,
  user,
  action,
  description,
  visibility = "Internal Only",
  before = null,
  after = null,
) {
  const e = {
    id: uid("contract-event"),
    contractId: contract?.id,
    reference: contract?.reference,
    version: contract?.version,
    buyer: contract?.buyer,
    organization: contract?.organization,
    project: contract?.project,
    track: contract?.trackTitle,
    actor: user?.name || "Contract service",
    userId: user?.id || null,
    timestamp: now(),
    action,
    description,
    before,
    after,
    source: "Contracts and E-Signature",
    visibility,
  };
  state.activity.unshift(e);
  return e;
}
function notify(userId, title, body, action = "buyer-contracts") {
  if (!userId) return;
  const auth = readAuthState();
  auth.messages.unshift({
    id: uid("contract-message"),
    userId,
    type: "contract",
    title,
    body,
    createdAt: now(),
    read: false,
    action,
  });
  writeAuthState(auth);
}
export function canTransitionContractStatus(current, next, context = {}) {
  const definition = CONTRACT_STATUSES[current];
  if (!definition?.next.includes(next)) return false;
  if (
    ["Sent", "Awaiting Buyer Signature"].includes(next) &&
    (!context.complete || !context.approved)
  )
    return false;
  if (
    ["Fully Signed", "Countersigned", "Effective"].includes(next) &&
    context.requiredSignersComplete === false
  )
    return false;
  return true;
}

export function renderContractTemplate(template, variables, clauses = []) {
  const replace = (text) =>
    String(text || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) =>
      String(variables[key] ?? `[${key}]`),
    );
  return {
    title: replace(`${variables.PROJECT_NAME} — ${template.name}`),
    sections: template.clauseIds
      .map((id, index) => {
        const clause = clauses.find((c) => c.id === id);
        return clause
          ? {
              id: clause.id,
              number: String(index + 1),
              title: clause.title,
              body: replace(clause.body),
              version: clause.version,
              unresolved: replace(clause.body).match(/\[[A-Z0-9_]+\]/g) || [],
            }
          : null;
      })
      .filter(Boolean),
  };
}

export function calculateContractCompleteness(contract) {
  const blockers = [],
    warnings = [],
    unresolvedVariables = [];
  const resolvedVariables = variablesFor(contract);
  const required = {
    "Accepted or authorized quote": contract.quoteId,
    "Current quote version": contract.quoteVersion,
    "Licensor legal name": contract.licensor?.legalName,
    "Licensee legal name": contract.licensee?.legalName,
    Project: contract.project,
    Track: contract.trackIds?.length,
    Fee: contract.fees?.licenceFee,
    Currency: contract.fees?.currency,
    Usage: contract.usage,
    Media: contract.media?.length,
    Territory: contract.territory,
    Term: contract.term,
    Exclusivity: contract.exclusivity,
    Restrictions: contract.restrictions?.length,
    Credits: contract.credits,
    "Required clauses": contract.clauses?.length,
    "Required signers": contract.signers?.filter((s) => s.required).length,
    "Signature deadline": contract.signatureDeadline,
  };
  Object.entries(required).forEach(([label, value]) => {
    if (!value) blockers.push(label);
  });
  contract.clauses?.forEach((c) => {
    const unresolved = (
      c.resolvedBody?.match(/\{\{[A-Z0-9_]+\}\}/g) || []
    ).filter((token) => {
      const key = token.slice(2, -2);
      return !String(resolvedVariables[key] ?? "").trim();
    });
    unresolvedVariables.push(...unresolved);
  });
  if (contract.rightsVersions?.length !== contract.trackIds?.length)
    blockers.push("Current rights version");
  if (contract.restrictions?.length < 2)
    warnings.push("Review whether all rights restrictions were imported.");
  const missingApprovals = (contract.approvals || [])
    .filter((a) => a.status !== "Approved")
    .map((a) => a.type);
  const missingSigners = (contract.signers || [])
    .filter((s) => s.required && !s.name)
    .map((s) => s.role);
  const total =
    Object.keys(required).length +
    Math.max(1, (contract.approvals || []).length);
  const incomplete =
    blockers.length + unresolvedVariables.length + missingSigners.length;
  const percentage = Math.max(
    0,
    Math.round(((total - incomplete) / total) * 100),
  );
  return {
    percentage,
    complete: incomplete === 0,
    blockers,
    warnings,
    unresolvedVariables: [...new Set(unresolvedVariables)],
    missingApprovals,
    missingSigners,
  };
}

function variablesFor(contract) {
  return {
    CONTRACT_REFERENCE: contract.reference,
    EFFECTIVE_DATE:
      contract.effectiveDate || "Effective on final required signature",
    LICENSOR_NAME: contract.licensor.legalName,
    LICENSOR_ADDRESS: contract.licensor.address,
    LICENSEE_NAME: contract.licensee.legalName,
    LICENSEE_ADDRESS: contract.licensee.address,
    BUYER_SIGNER_NAME: contract.licensee.authorizedSignatory,
    PROJECT_NAME: contract.project,
    TRACK_TITLE: contract.trackTitle,
    ARTIST_NAME: contract.artist,
    QUOTE_REFERENCE: contract.quoteReference,
    LICENCE_FEE: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: contract.fees.currency,
      maximumFractionDigits: 0,
    }).format(contract.fees.licenceFee / 100),
    CURRENCY: contract.fees.currency,
    DEPOSIT_AMOUNT: contract.fees.deposit / 100,
    BALANCE_AMOUNT: contract.fees.balance / 100,
    MEDIA: contract.media.join(", "),
    TERRITORY: contract.territory,
    TERM: contract.term,
    EXCLUSIVITY: contract.exclusivity,
    USAGE_DESCRIPTION: contract.usage,
    ASSETS_INCLUDED: contract.assets.join(", "),
    CREDIT_REQUIREMENT: contract.credits,
    RESTRICTIONS: contract.restrictions.join("; "),
    PAYMENT_TERMS: contract.paymentTerms,
    SIGNATURE_DEADLINE: new Date(
      contract.signatureDeadline,
    ).toLocaleDateString(),
  };
}
function syncQuote(contract) {
  const qs = readQuoteState();
  const q = qs.quotes.find((x) => x.id === contract.quoteId);
  if (q) {
    q.futureWorkflow = {
      ...q.futureWorkflow,
      contractReadiness:
        contract.status === "Effective" ? "Effective" : contract.status,
      invoiceReadiness: ["Fully Signed", "Countersigned", "Effective"].includes(
        contract.status,
      )
        ? "Ready"
        : "Pending contract",
    };
    if (
      [
        "Draft",
        "Internal Review",
        "Legal Review",
        "Rights Review",
        "Finance Review",
        "Approved Internally",
        "Ready to Send",
        "Sent",
        "Awaiting Buyer Signature",
        "Partially Signed",
        "Effective",
      ].includes(contract.status) &&
      q.status === "Accepted"
    )
      q.status = "Converted to Contract";
    q.updatedAt = now();
    writeQuoteState(qs);
  }
}
function syncSignedDocumentToStorage(contract, document) {
  const storage = readStorageState();
  if (storage.assets.some((asset) => asset.id === document.assetId)) return;
  storage.assets.unshift({
    id: document.assetId,
    ownerType: "Contract",
    ownerId: contract.id,
    relatedTrackId: contract.trackIds[0],
    relatedContractId: contract.id,
    relatedLicenceId: null,
    relatedInvoiceId: null,
    storageClass: "COMMERCIAL_DOCUMENT",
    assetType: "Signed Contract",
    fileName: `${contract.reference.toLowerCase()}-signed-v${contract.version}.pdf`,
    displayName: `${contract.reference} Signed Agreement`,
    fileExtension: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 720000,
    checksum: `demo-sha256-${document.assetId}`,
    version: contract.version,
    status: "Ready",
    visibility: "Organization Restricted",
    confidentiality: "Commercial",
    storageReference: `storage://commercial-document/${document.assetId}`,
    uploadedBy: "Contracts and E-Signature",
    uploadedAt: document.createdAt,
    processedAt: document.createdAt,
    current: true,
    metadata: {
      trackTitle: contract.trackTitle,
      artistName: contract.artist,
      contractReference: contract.reference,
      immutablePrototypeRecord: true,
      integrityStatus: "Verified",
    },
    accessPolicy: {
      requiresAuthentication: true,
      organizationRestrictions: [contract.organizationId],
      downloadAllowed: true,
      streamAllowed: false,
      maxDownloads: 0,
    },
    processingInfo: { status: "Completed", warnings: [], failure: null },
    versions: [],
    notes: [
      "Prototype signed-document metadata; not a certified provider document.",
    ],
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

export const contractService = {
  getState: readContractState,
  resetContractsESignatureDemoData() {
    localStorage.removeItem(CONTRACT_STORAGE_KEY);
    localStorage.removeItem(SELECTED_CONTRACT_KEY);
    return readContractState();
  },
  getContract(id) {
    return clone(
      readContractState().contracts.find((c) => c.id === id) || null,
    );
  },
  getContracts(user) {
    let contracts = readContractState().contracts;
    if (user?.userType === "buyer")
      contracts = contracts.filter(
        (c) =>
          c.organizationId === user.organizationId &&
          CONTRACT_STATUSES[c.status]?.buyerVisible,
      );
    return clone(
      [...contracts].sort((a, b) =>
        String(b.updatedAt).localeCompare(String(a.updatedAt)),
      ),
    );
  },
  getTemplates() {
    return clone(readContractState().templates);
  },
  getClauses() {
    return clone(readContractState().clauses);
  },
  updateTemplate(id, changes, reason, user) {
    if (!allowed(user, "contracts.manage_templates"))
      return {
        ok: false,
        message: "Template-management permission is required.",
      };
    if (!reason) return { ok: false, message: "A version reason is required." };
    return mutate((state) => {
      const template = state.templates.find((item) => item.id === id);
      if (!template) return { ok: false, message: "Template not found." };
      state.templateVersions.unshift({
        ...clone(template),
        archivedAt: now(),
        reason,
      });
      Object.assign(template, changes, {
        version: template.version + 1,
        updatedAt: now(),
      });
      const affected = state.contracts.filter(
        (contract) =>
          contract.templateId === id &&
          !["Effective", "Completed", "Archived"].includes(contract.status),
      );
      affected.forEach((contract) =>
        contract.internalNotes.push(
          `Template ${template.name} advanced to v${template.version}; regeneration review required.`,
        ),
      );
      event(
        state,
        null,
        user,
        "Template version created",
        `${template.name} v${template.version}: ${reason}`,
      );
      return { ok: true, template: clone(template), affected: affected.length };
    });
  },
  updateClause(id, changes, reason, user) {
    if (!allowed(user, "contracts.manage_clauses"))
      return {
        ok: false,
        message: "Clause-management permission is required.",
      };
    if (!reason) return { ok: false, message: "A version reason is required." };
    return mutate((state) => {
      const clause = state.clauses.find((item) => item.id === id);
      if (!clause) return { ok: false, message: "Clause not found." };
      state.clauseVersions.unshift({
        ...clone(clause),
        archivedAt: now(),
        reason,
        updatedBy: user.name,
      });
      Object.assign(clause, changes, {
        version: clause.version + 1,
        updatedAt: now(),
      });
      const affected = state.contracts.filter(
        (contract) =>
          contract.clauses.some(
            (item) => item.id === id && item.clauseVersion < clause.version,
          ) &&
          !["Effective", "Completed", "Archived"].includes(contract.status),
      );
      affected.forEach((contract) =>
        contract.internalNotes.push(
          `Clause ${clause.title} advanced to v${clause.version}; the historical contract text was preserved and regeneration review is required.`,
        ),
      );
      event(
        state,
        null,
        user,
        "Clause version created",
        `${clause.title} v${clause.version}: ${reason}`,
      );
      return { ok: true, clause: clone(clause), affected: affected.length };
    });
  },
  render(contract) {
    const state = readContractState();
    const template = state.templates.find((t) => t.id === contract.templateId);
    if (!template)
      return { ok: false, message: "Contract template not found." };
    return {
      ok: true,
      document: renderContractTemplate(
        template,
        variablesFor(contract),
        contract.clauses || state.clauses,
      ),
    };
  },
  eligibleQuotes() {
    const state = readContractState();
    return quoteService
      .getState()
      .quotes.filter(
        (q) =>
          q.status === "Accepted" &&
          !state.contracts.some(
            (c) =>
              c.quoteId === q.id &&
              !["Cancelled", "Superseded", "Archived"].includes(c.status),
          ),
      );
  },
  validateQuote(quote) {
    if (!quote) return { ok: false, message: "Accepted quote not found." };
    if (quote.status !== "Accepted")
      return {
        ok: false,
        message: "Only an accepted current quote can generate a contract.",
      };
    if (new Date(quote.validUntil) < new Date(quote.acceptedAt || 0))
      return {
        ok: false,
        message: "Quote acceptance is outside the valid quote period.",
      };
    const rights = rightsService.getBuyerSummary(quote.trackId, {
      territory: quote.terms?.territory,
      assets: quote.terms?.assets,
    });
    if (!rights?.licensable || quote.trackId === 15)
      return {
        ok: false,
        message: "Current rights eligibility blocks contract generation.",
      };
    return { ok: true, rights };
  },
  createFromQuote(quoteId, options, user) {
    if (!allowed(user, "contracts.create"))
      return {
        ok: false,
        message: "Contract creation permission is required.",
      };
    const quote = quoteService.getQuote(quoteId);
    const validation = this.validateQuote(quote);
    if (!validation.ok) return validation;
    return mutate((state) => {
      if (
        state.contracts.some(
          (c) =>
            c.quoteId === quoteId &&
            !["Cancelled", "Superseded", "Archived"].includes(c.status),
        )
      )
        return {
          ok: false,
          message: "An active contract already exists for this accepted quote.",
        };
      const template = state.templates.find((t) => t.id === options.templateId);
      if (!template)
        return { ok: false, message: "Select an active contract template." };
      const sequence =
        Math.max(
          ...state.contracts
            .filter((c) => c.reference.startsWith("BM-C"))
            .map((c) => Number(c.reference.split("-").pop()) || 0),
          25,
        ) + 1;
      const id = uid("contract");
      const contract = {
        ...clone(DEFAULT_CONTRACT_STATE.contracts[0]),
        id,
        reference: `BM-C-2026-${String(sequence).padStart(4, "0")}`,
        contractType: options.contractType || template.contractType,
        status: "Draft",
        version: 1,
        current: true,
        quoteId: quote.id,
        quoteReference: quote.reference,
        quoteVersion: quote.version,
        licensingRequestId: quote.licensingRequestId,
        projectId: quote.projectId,
        project: quote.project,
        buyerId: quote.buyerId,
        buyer: quote.buyer,
        organizationId: quote.organizationId,
        organization: quote.organization,
        trackIds: [quote.trackId],
        trackTitle: quote.trackTitle,
        artist: quote.artist,
        rightsRecordIds: [`rights-${quote.trackId}`],
        rightsVersions: [quote.rightsSummary?.rightsVersion || 1],
        templateId: template.id,
        templateVersion: template.version,
        title: `${quote.project} — Music Licence`,
        effectiveDate: null,
        signatureDeadline: new Date(Date.now() + 21 * 86400000).toISOString(),
        licensee: {
          legalName: quote.organization,
          address: "Buyer legal address on approved account",
          companyNumber: "",
          authorizedSignatory: quote.buyer,
          title: "Authorized buyer signatory",
          email:
            readAuthState().users.find((u) => u.id === quote.buyerId)?.email ||
            "",
          billingContact: "Buyer billing contact on account",
        },
        usage: quote.usageSummary,
        media: quote.terms.media,
        territory: quote.terms.territory,
        term: quote.terms.term,
        exclusivity: quote.terms.exclusivity,
        fees: {
          licenceFee: quote.total,
          currency: quote.currency,
          deposit: Math.round(quote.total * 0.25),
          balance: Math.round(quote.total * 0.75),
          taxTreatment: "Not calculated in prototype",
          preparationFees: quote.lineItems
            .filter(
              (l) =>
                !l.name.includes("Licence") && !l.name.includes("Discount"),
            )
            .reduce((n, l) => n + l.total, 0),
        },
        paymentTerms: quote.terms.paymentTerms || "Due before delivery",
        assets: quote.terms.assets || [],
        restrictions: [
          ...new Set([
            ...(quote.conditions || []),
            ...(quote.exclusions || []),
            ...(validation.rights.restrictions || []),
            "No machine-learning training",
          ]),
        ],
        approvals: template.requiredApprovals.map((type) => ({
          id: uid("approval"),
          type,
          status: "Pending",
          approver:
            type === "Rights"
              ? "Amelia Grant"
              : type === "Finance"
                ? "Nadia Foster"
                : type === "Licensing"
                  ? "Jordan Lee"
                  : "Preston Repenning",
          note: "",
          date: null,
          history: [],
        })),
        credits: `“${quote.trackTitle}” performed by ${quote.artist}\nLicensed courtesy of beatmondo`,
        clauses: template.clauseIds.map((cid) => {
          const c = state.clauses.find((x) => x.id === cid);
          return {
            ...clone(c),
            clauseVersion: c.version,
            resolvedBody: c.body,
          };
        }),
        schedules: [
          {
            id: uid("schedule"),
            title: "Track and Usage Schedule",
            items: [
              quote.trackTitle,
              quote.project,
              quote.terms.media.join(", "),
              quote.terms.territory,
            ],
          },
          {
            id: uid("schedule"),
            title: "Approved Assets",
            items: quote.terms.assets || [],
          },
        ],
        signers: [
          {
            id: uid("signer"),
            userId: quote.buyerId,
            name: quote.buyer,
            email:
              readAuthState().users.find((u) => u.id === quote.buyerId)
                ?.email || "",
            organization: quote.organization,
            title: "Authorized buyer signatory",
            role: "Buyer signatory",
            signingOrder: 1,
            required: true,
            status: "Not Invited",
            expiresAt: new Date(Date.now() + 21 * 86400000).toISOString(),
          },
          {
            id: uid("signer"),
            userId: "user-preston",
            name: "Preston Repenning",
            email: "admin@beatmondo.com",
            organization: "beatmondo",
            title: "Authorized Signatory",
            role: "Beatmondo senior signatory",
            signingOrder: 2,
            required: true,
            status: "Not Invited",
            expiresAt: new Date(Date.now() + 21 * 86400000).toISOString(),
          },
        ],
        signatures: [],
        comments: [],
        internalNotes: [],
        buyerMessages: [],
        previousVersionId: null,
        supersededBy: null,
        generatedDocumentAssetId: `contract-document-${id}-v1`,
        signedDocumentAssetId: null,
        createdAt: now(),
        createdBy: user.name,
        updatedAt: now(),
        sentAt: null,
        fullySignedAt: null,
        countersignedAt: null,
        cancelledAt: null,
        contractOwner: user.name,
        dependencies: {
          fullSignature: false,
          countersignature: false,
          payment: false,
          rightsApproval: validation.rights.eligibility === "Eligible",
          buyerVerification: true,
          membership: true,
          deliveryAuthorized: false,
        },
        paymentStatus: "Not Ready",
        licenceGeneration: "Not Ready",
        deliveryStatus: "Not authorized",
        signingOrder: options.signingOrder || "Buyer first",
      };
      state.contracts.unshift(contract);
      event(
        state,
        contract,
        user,
        "Contract created",
        `Generated from accepted ${quote.reference} using ${template.name}.`,
      );
      localStorage.setItem(SELECTED_CONTRACT_KEY, contract.id);
      syncQuote(contract);
      return { ok: true, contract: clone(contract) };
    });
  },
  update(id, changes, reason, user) {
    if (!allowed(user, "contracts.edit"))
      return { ok: false, message: "Contract editing permission is required." };
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (!c) return { ok: false, message: "Contract not found." };
      if (!reason)
        return { ok: false, message: "A change reason is required." };
      state.contractVersions.unshift({
        ...clone(c),
        snapshotId: uid("contract-version"),
        snapshotAt: now(),
        snapshotReason: reason,
      });
      Object.assign(c, changes, {
        version: c.version + 1,
        previousVersionId: `${c.id}-v${c.version}`,
        updatedAt: now(),
        status: "Draft",
      });
      c.approvals = c.approvals.map((a) => ({
        ...a,
        status: "Pending",
        date: null,
        note: "Reopened after material change",
      }));
      event(
        state,
        c,
        user,
        "Contract version created",
        reason,
        "Internal Only",
      );
      return { ok: true, contract: clone(c) };
    });
  },
  requestReview(id, user) {
    if (!allowed(user, "contracts.request_review"))
      return { ok: false, message: "Review-request permission is required." };
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (!c) return { ok: false, message: "Contract not found." };
      const complete = calculateContractCompleteness(c);
      if (!complete.complete)
        return {
          ok: false,
          message: `Contract is incomplete: ${complete.blockers[0] || complete.unresolvedVariables[0]}`,
        };
      c.status = "Internal Review";
      c.updatedAt = now();
      event(
        state,
        c,
        user,
        "Review requested",
        "Licensing, rights, finance, and simulated legal review requested.",
      );
      notify(
        "user-amelia",
        `${c.reference} needs rights review`,
        `${c.trackTitle} contract review is ready.`,
        `admin-contract-detail`,
      );
      notify(
        "user-finance",
        `${c.reference} needs finance review`,
        `${c.organization} commercial terms are ready.`,
        `admin-contract-detail`,
      );
      return { ok: true, contract: clone(c) };
    });
  },
  decideApproval(id, type, decision, note, user) {
    const permission = {
      Licensing: "contracts.approve_licensing",
      Rights: "contracts.approve_rights",
      Finance: "contracts.approve_finance",
      Legal: "contracts.approve_legal",
      Senior: "contracts.approve_senior",
    }[type];
    if (!allowed(user, permission))
      return { ok: false, message: `${type} approval permission is required.` };
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      const a = c?.approvals.find((x) => x.type === type);
      if (!a) return { ok: false, message: "Required approval not found." };
      a.status = decision;
      a.note = note;
      a.approver = user.name;
      a.date = now();
      c.status =
        decision === "Rejected"
          ? "Changes Requested"
          : c.approvals.every((x) => x.status === "Approved")
            ? "Approved Internally"
            : `${type} Review`;
      c.updatedAt = now();
      event(
        state,
        c,
        user,
        `${type} ${decision.toLowerCase()}`,
        note || `${type} decision recorded.`,
      );
      return { ok: true, contract: clone(c) };
    });
  },
  addComment(id, values, user) {
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (!c) return { ok: false, message: "Contract not found." };
      if (user.userType === "buyer" && c.organizationId !== user.organizationId)
        return {
          ok: false,
          message: "This contract is unavailable to your organization.",
        };
      const visibility =
        user.userType === "buyer"
          ? "Buyer Visible"
          : values.visibility || "Internal Only";
      const comment = {
        id: uid("comment"),
        author: user.name,
        role: user.roleLabel || user.role,
        date: now(),
        section: values.section || "General",
        selectedText: values.selectedText || "",
        comment: values.comment,
        visibility,
        status: values.status || "Open",
        assignee: values.assignee || c.contractOwner,
      };
      c.comments.push(comment);
      c.updatedAt = now();
      event(
        state,
        c,
        user,
        "Comment added",
        `${visibility} comment added to ${comment.section}.`,
        visibility,
      );
      return { ok: true, comment, contract: clone(c) };
    });
  },
  requestBuyerChanges(id, values, user) {
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (!c || c.organizationId !== user.organizationId)
        return {
          ok: false,
          message: "This contract is unavailable to your organization.",
        };
      if (!CONTRACT_STATUSES[c.status]?.buyerVisible)
        return {
          ok: false,
          message: "This contract is not open for buyer review.",
        };
      c.status = "Buyer Changes Requested";
      c.comments.push({
        id: uid("comment"),
        author: user.name,
        role: "Buyer",
        date: now(),
        section: values.section,
        selectedText: "",
        comment: values.comment,
        proposedWording: values.proposedWording || "",
        priority: values.priority || "Standard",
        visibility: "Buyer Visible",
        status: "Buyer Response Required",
        assignee: c.contractOwner,
      });
      c.signers = c.signers.map((s) => ({
        ...s,
        status: s.status === "Signed" ? s.status : "Cancelled",
      }));
      c.updatedAt = now();
      event(
        state,
        c,
        user,
        "Buyer requested changes",
        values.comment,
        "Buyer Visible",
      );
      notify(
        "user-jordan",
        `${c.reference}: buyer changes requested`,
        `${user.name} requested changes to ${values.section}.`,
        `admin-contract-detail`,
      );
      return { ok: true, contract: clone(c) };
    });
  },
  sendSignatureRequest(id, user) {
    if (!allowed(user, "contracts.send"))
      return { ok: false, message: "Contract sending permission is required." };
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (!c) return { ok: false, message: "Contract not found." };
      const completeness = calculateContractCompleteness(c);
      if (!completeness.complete)
        return {
          ok: false,
          message: "Complete all required contract data before sending.",
        };
      if (c.approvals.some((a) => a.status !== "Approved"))
        return {
          ok: false,
          message: "All mandatory approvals must be completed before sending.",
        };
      const rights = rightsService.getBuyerSummary(c.trackIds[0], {
        territory: c.territory,
        assets: c.assets,
      });
      if (!rights?.licensable)
        return {
          ok: false,
          message: "Current rights eligibility blocks the signature request.",
        };
      c.status = "Awaiting Buyer Signature";
      c.sentAt = now();
      c.signers = c.signers.map((s) => ({
        ...s,
        status: s.signingOrder === 1 ? "Invited" : "Not Invited",
        invitedAt: s.signingOrder === 1 ? now() : null,
        expiresAt: c.signatureDeadline,
      }));
      c.updatedAt = now();
      event(
        state,
        c,
        user,
        "Signature request sent",
        `Invitation created for ${c.signers
          .filter((s) => s.signingOrder === 1)
          .map((s) => s.name)
          .join(", ")}.`,
      );
      notify(
        c.buyerId,
        `${c.reference} is ready to sign`,
        `${c.trackTitle} licensing agreement is ready. This is a simulated signature invitation.`,
        `buyer-contract`,
      );
      syncQuote(c);
      return { ok: true, contract: clone(c) };
    });
  },
  verifyCode(code) {
    return {
      ok: String(code) === SIGNATURE_CODE,
      message:
        String(code) === SIGNATURE_CODE
          ? "Signature code confirmed."
          : "The signature code is incorrect.",
    };
  },
  sign(id, values, user) {
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (!c) return { ok: false, message: "Contract not found." };
      const signer = c.signers.find((s) => s.userId === user.id && s.required);
      if (!signer)
        return {
          ok: false,
          message: "You are not an assigned signer for this contract.",
        };
      if (
        !["Invited", "Delivered", "Viewed", "Ready to Sign"].includes(
          signer.status,
        )
      )
        return {
          ok: false,
          message: "This signature invitation is not active.",
        };
      if (new Date(signer.expiresAt) < new Date())
        return { ok: false, message: "This signature invitation has expired." };
      if (c.version !== Number(values.contractVersion))
        return {
          ok: false,
          message: "This contract version changed after the invitation.",
        };
      if (user.accountStatus !== "active")
        return { ok: false, message: "Your account is not active." };
      if (user.userType === "buyer") {
        const membership = membershipService.getCurrentMembership(user.id);
        if (
          user.verificationStatus !== "approved" ||
          (membership && membership.status !== "Active")
        )
          return {
            ok: false,
            message: "Buyer verification or membership status blocks signing.",
          };
      }
      if (!values.consents?.every(Boolean))
        return {
          ok: false,
          message: "All electronic-signature acknowledgments are required.",
        };
      if (String(values.code) !== SIGNATURE_CODE)
        return { ok: false, message: "The signature code is incorrect." };
      if (
        values.method === "Typed signature" &&
        values.signature.trim().toLowerCase() !==
          signer.name.trim().toLowerCase()
      )
        return {
          ok: false,
          message: "Typed signature must match the assigned signer name.",
        };
      if (!values.signature)
        return { ok: false, message: "Provide a simulated signature." };
      const record = {
        id: uid("signature"),
        contractId: c.id,
        contractVersion: c.version,
        signerId: signer.id,
        signerName: signer.name,
        signerEmail: signer.email,
        signerRole: signer.role,
        signatureMethod: values.method,
        signatureDisplay: values.signature,
        consentVersion: "prototype-consent-v1",
        signedAt: now(),
        mockIp: "203.0.113.42",
        device: "Codex Browser",
        sessionId: uid("session"),
        verificationMethod: "Authenticated account + dummy email code",
        status: "Recorded",
      };
      state.signatureRecords.push(record);
      state.consentRecords.push({
        id: uid("consent"),
        contractId: c.id,
        contractVersion: c.version,
        signerId: signer.id,
        consentVersion: "prototype-consent-v1",
        acceptedAt: now(),
        mockIp: record.mockIp,
        device: record.device,
      });
      c.signatures.push(record);
      signer.status = "Signed";
      signer.signedAt = record.signedAt;
      signer.signatureMethod = record.signatureMethod;
      signer.signatureRecordId = record.id;
      const remaining = c.signers.filter(
        (s) => s.required && s.status !== "Signed",
      );
      if (remaining.length) {
        const nextOrder = Math.min(...remaining.map((s) => s.signingOrder));
        remaining
          .filter((s) => s.signingOrder === nextOrder)
          .forEach((s) => {
            s.status = "Invited";
            s.invitedAt = now();
          });
        c.status = remaining.some((s) => s.role.startsWith("Beatmondo"))
          ? "Awaiting Beatmondo Signature"
          : "Awaiting Additional Signer";
      } else {
        c.status = "Fully Signed";
        c.fullySignedAt = now();
        c.dependencies.fullSignature = true;
        c.paymentStatus = "Ready";
        c.licenceGeneration = "Pending effectiveness";
        const doc = {
          id: uid("signed-document"),
          contractId: c.id,
          contractVersion: c.version,
          assetId: `signed-contract-${c.id}-v${c.version}`,
          immutable: true,
          createdAt: now(),
          certificateLabel:
            "Prototype signature record — not a certified e-signature-provider certificate.",
        };
        state.signedDocuments.push(doc);
        c.signedDocumentAssetId = doc.assetId;
        syncSignedDocumentToStorage(c, doc);
      }
      c.updatedAt = now();
      event(
        state,
        c,
        user,
        "Signer signed",
        `${signer.name} recorded a ${values.method.toLowerCase()} for version ${c.version}.`,
        "All Signers",
      );
      notify(
        "user-jordan",
        `${c.reference}: ${signer.name} signed`,
        `${remaining.length} required signer(s) remain.`,
        `admin-contract-detail`,
      );
      syncQuote(c);
      return {
        ok: true,
        contract: clone(c),
        record,
        remaining: remaining.length,
      };
    });
  },
  declineSignature(id, reason, user) {
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      const signer = c?.signers.find((s) => s.userId === user.id);
      if (!c || !signer)
        return { ok: false, message: "Active signer record not found." };
      if (!reason)
        return { ok: false, message: "A decline reason is required." };
      signer.status = "Declined";
      signer.declinedAt = now();
      c.status = "Signature Declined";
      c.updatedAt = now();
      event(state, c, user, "Signer declined", reason, "All Signers");
      notify(
        "user-jordan",
        `${c.reference}: signature declined`,
        reason,
        "admin-contract-detail",
      );
      return { ok: true, contract: clone(c) };
    });
  },
  resend(id, days, reason, user) {
    if (!allowed(user, "contracts.resend_signature"))
      return { ok: false, message: "Signature resend permission is required." };
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (!c) return { ok: false, message: "Contract not found." };
      if (!reason)
        return { ok: false, message: "A resend reason is required." };
      c.signatureDeadline = new Date(
        Date.now() + Number(days || 14) * 86400000,
      ).toISOString();
      c.status = "Awaiting Buyer Signature";
      c.signers
        .filter((s) => s.status !== "Signed")
        .forEach((s) => {
          s.status = s.signingOrder === 1 ? "Invited" : "Not Invited";
          s.expiresAt = c.signatureDeadline;
        });
      event(state, c, user, "Signature request resent", reason);
      notify(
        c.buyerId,
        `${c.reference} signature request renewed`,
        `New deadline: ${new Date(c.signatureDeadline).toLocaleDateString()}.`,
        `buyer-contract`,
      );
      return { ok: true, contract: clone(c) };
    });
  },
  replaceSigner(id, signerId, replacement, reason, user) {
    if (!allowed(user, "contracts.replace_signer"))
      return {
        ok: false,
        message: "Signer-replacement permission is required.",
      };
    if (!reason || !replacement?.name || !replacement?.email)
      return {
        ok: false,
        message: "Replacement identity, email, and reason are required.",
      };
    return mutate((state) => {
      const c = state.contracts.find((item) => item.id === id);
      const prior = c?.signers.find((item) => item.id === signerId);
      if (!c || !prior)
        return { ok: false, message: "Signer record not found." };
      if (prior.status === "Signed")
        return { ok: false, message: "A completed signer cannot be replaced." };
      prior.status = "Reassigned";
      const next = {
        ...clone(prior),
        ...replacement,
        id: uid("signer"),
        status: prior.signingOrder === 1 ? "Invited" : "Not Invited",
        invitedAt: prior.signingOrder === 1 ? now() : null,
        signedAt: null,
        signatureRecordId: null,
        reassignedFrom: prior.id,
      };
      c.signers.push(next);
      c.updatedAt = now();
      event(
        state,
        c,
        user,
        "Signer replaced",
        `${prior.name} was reassigned to ${next.name}: ${reason}`,
      );
      notify(
        next.userId,
        `${c.reference} signature assignment`,
        "You have been assigned to a simulated contract-signing workflow.",
        "buyer-contract",
      );
      return { ok: true, contract: clone(c), signer: clone(next) };
    });
  },
  countersign(id, user) {
    if (!allowed(user, "signatures.countersign"))
      return { ok: false, message: "Countersignature permission is required." };
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (
        !c ||
        !["Fully Signed", "Awaiting Beatmondo Signature"].includes(c.status)
      )
        return {
          ok: false,
          message: "Contract is not ready for countersignature.",
        };
      const signer = c.signers.find(
        (s) => s.userId === user.id || s.role.startsWith("Beatmondo"),
      );
      if (signer && signer.status !== "Signed") {
        signer.status = "Signed";
        signer.signedAt = now();
        signer.signatureMethod = "Approved stored signature";
      }
      c.status = "Countersigned";
      c.countersignedAt = now();
      c.dependencies.countersignature = true;
      if (c.dependencies.rightsApproval) {
        c.status = "Effective";
        c.effectiveDate = now();
        c.paymentStatus = "Pending";
        c.licenceGeneration = "Pending payment";
      }
      event(
        state,
        c,
        user,
        "Contract countersigned",
        `Simulated countersignature recorded; status is ${c.status}.`,
        "All Signers",
      );
      notify(
        c.buyerId,
        `${c.reference} countersigned`,
        `The agreement is ${c.status.toLowerCase()}. Payment and delivery remain separate.`,
        `buyer-contract`,
      );
      syncQuote(c);
      return { ok: true, contract: clone(c) };
    });
  },
  cancel(id, reason, buyerMessage, user) {
    if (!allowed(user, "contracts.cancel"))
      return {
        ok: false,
        message: "Contract cancellation permission is required.",
      };
    return mutate((state) => {
      const c = state.contracts.find((x) => x.id === id);
      if (!c) return { ok: false, message: "Contract not found." };
      if (!reason || !buyerMessage)
        return {
          ok: false,
          message: "Cancellation reason and buyer-facing message are required.",
        };
      c.status = "Cancelled";
      c.cancelledAt = now();
      c.buyerMessages.push(buyerMessage);
      c.signers = c.signers.map((s) =>
        s.status === "Signed" ? s : { ...s, status: "Cancelled" },
      );
      c.paymentStatus = "Not Ready";
      c.licenceGeneration = "Not Ready";
      c.deliveryStatus = "Not authorized";
      event(state, c, user, "Contract cancelled", reason);
      notify(
        c.buyerId,
        `${c.reference} cancelled`,
        buyerMessage,
        "buyer-contract",
      );
      syncQuote(c);
      return { ok: true, contract: clone(c) };
    });
  },
  terminate(id, values, user) {
    if (!allowed(user, "contracts.terminate"))
      return {
        ok: false,
        message: "Contract-termination permission is required.",
      };
    if (!values?.reason || !values?.effectiveDate || !values?.legalReviewStatus)
      return {
        ok: false,
        message:
          "Reason, effective date, and legal-review status are required.",
      };
    return mutate((state) => {
      const c = state.contracts.find((item) => item.id === id);
      if (!c || c.status !== "Effective")
        return {
          ok: false,
          message: "Only an effective contract can enter termination.",
        };
      c.status = "Terminated";
      c.termination = { ...values, createdAt: now(), createdBy: user.name };
      c.deliveryStatus = "Revoked pending impact review";
      c.licenceGeneration = "Terminated agreement review";
      event(state, c, user, "Contract terminated", values.reason);
      notify(
        c.buyerId,
        `${c.reference} termination notice`,
        values.buyerNotification ||
          "Contact beatmondo for the reviewed termination record.",
        "buyer-contract",
      );
      return { ok: true, contract: clone(c) };
    });
  },
  createLinkedAgreement(id, type, quoteId, changes, user) {
    const permission =
      type === "Renewal Agreement"
        ? "contracts.create_renewal"
        : "contracts.create_amendment";
    if (!allowed(user, permission))
      return { ok: false, message: `${type} permission is required.` };
    return mutate((state) => {
      const original = state.contracts.find((item) => item.id === id);
      const quote = quoteService.getQuote(quoteId);
      if (!original || !quote || quote.status !== "Accepted")
        return {
          ok: false,
          message:
            "An original contract and accepted linked quote are required.",
        };
      const linked = {
        ...clone(original),
        ...changes,
        id: uid(type.startsWith("Renewal") ? "renewal" : "amendment"),
        reference: `${type.startsWith("Renewal") ? "BM-R" : "BM-A"}-2026-${String(state.contracts.length + 4).padStart(4, "0")}`,
        contractType: type,
        status: "Draft",
        version: 1,
        quoteId: quote.id,
        quoteReference: quote.reference,
        quoteVersion: quote.version,
        previousVersionId: original.id,
        signatures: [],
        signedDocumentAssetId: null,
        fullySignedAt: null,
        countersignedAt: null,
        effectiveDate: null,
        createdAt: now(),
        createdBy: user.name,
        updatedAt: now(),
      };
      linked.signers = linked.signers.map((signer) => ({
        ...signer,
        id: uid("signer"),
        status: "Not Invited",
        signedAt: null,
        signatureRecordId: null,
      }));
      linked.approvals = linked.approvals.map((approval) => ({
        ...approval,
        id: uid("approval"),
        status: "Pending",
        date: null,
        note: "New linked agreement review required.",
      }));
      state.contracts.unshift(linked);
      (type.startsWith("Renewal") ? state.renewals : state.amendments).push(
        linked.id,
      );
      event(
        state,
        linked,
        user,
        `${type} created`,
        `Linked to ${original.reference} and ${quote.reference}.`,
      );
      return { ok: true, contract: clone(linked) };
    });
  },
  analytics() {
    const cs = readContractState().contracts;
    const visible = cs.filter((c) => !["Archived"].includes(c.status));
    const signed = visible.filter((c) =>
      ["Fully Signed", "Countersigned", "Effective", "Completed"].includes(
        c.status,
      ),
    );
    const sent = visible.filter(
      (c) => c.sentAt || CONTRACT_STATUSES[c.status]?.buyerVisible,
    );
    return {
      total: visible.length,
      drafts: visible.filter((c) => c.status === "Draft").length,
      review: visible.filter((c) => c.status.includes("Review")).length,
      awaitingBuyer: visible.filter(
        (c) => c.status === "Awaiting Buyer Signature",
      ).length,
      awaitingBeatmondo: visible.filter(
        (c) => c.status === "Awaiting Beatmondo Signature",
      ).length,
      partiallySigned: visible.filter((c) => c.status === "Partially Signed")
        .length,
      effective: visible.filter((c) => c.status === "Effective").length,
      expired: visible.filter((c) => c.status === "Signature Expired").length,
      changes: visible.filter((c) => c.status === "Buyer Changes Requested")
        .length,
      completionRate: sent.length
        ? Math.round((signed.length / sent.length) * 100)
        : 0,
      contractedValue: visible.reduce(
        (n, c) => n + (c.fees?.licenceFee || 0),
        0,
      ),
      effectiveValue: visible
        .filter((c) => c.status === "Effective")
        .reduce((n, c) => n + (c.fees?.licenceFee || 0), 0),
      byStatus: Object.fromEntries(
        [...new Set(visible.map((c) => c.status))].map((s) => [
          s,
          visible.filter((c) => c.status === s).length,
        ]),
      ),
      byType: Object.fromEntries(
        [...new Set(visible.map((c) => c.contractType))].map((s) => [
          s,
          visible.filter((c) => c.contractType === s).length,
        ]),
      ),
    };
  },
};
