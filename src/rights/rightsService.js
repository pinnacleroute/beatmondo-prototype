import { readAuthState, writeAuthState } from "../auth/authService.js";
import {
  DEFAULT_RIGHTS_STATE,
  ELIGIBILITY_STATUSES,
  RIGHTS_CHECKLIST,
  RIGHTS_DOCUMENTS,
  RIGHTS_PARTIES,
  RIGHTS_STATUS_CONTENT,
  RIGHTS_STATUS_TRANSITIONS,
  RIGHTS_STORAGE_KEY,
} from "./rightsData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const wait = (ms = 250) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const sum = (items, field) =>
  Math.round(
    items.reduce((total, item) => total + (Number(item[field]) || 0), 0) * 100,
  ) / 100;

function normalize(value) {
  const fallback = clone(DEFAULT_RIGHTS_STATE);
  if (!value || !Array.isArray(value.records)) return fallback;
  return {
    ...fallback,
    ...value,
    records: value.records,
    parties: Array.isArray(value.parties) ? value.parties : fallback.parties,
    documents: Array.isArray(value.documents)
      ? value.documents
      : fallback.documents,
    reports: Array.isArray(value.reports) ? value.reports : [],
    globalActivity: Array.isArray(value.globalActivity)
      ? value.globalActivity
      : [],
  };
}
export function readRightsState() {
  const raw = window.localStorage.getItem(RIGHTS_STORAGE_KEY);
  const state = normalize(raw ? safeParse(raw) : null);
  if (!raw || !safeParse(raw))
    window.localStorage.setItem(RIGHTS_STORAGE_KEY, JSON.stringify(state));
  return state;
}
export function writeRightsState(state) {
  const next = normalize(state);
  window.localStorage.setItem(RIGHTS_STORAGE_KEY, JSON.stringify(next));
  return next;
}
function mutate(updater) {
  const state = readRightsState();
  const result = updater(state);
  writeRightsState(state);
  return result;
}
function actorName(actor) {
  return actor?.name || actor?.email || "Rights Database";
}
function hasPermission(actor, permission) {
  return (
    actor?.permissions?.includes("*") ||
    actor?.permissions?.includes(permission)
  );
}
function addMessage(userId, title, body, action = "artist-rights") {
  if (!userId) return;
  const auth = readAuthState();
  auth.messages.unshift({
    id: uid("rights-message"),
    userId,
    type: "rights",
    title,
    body,
    createdAt: now(),
    read: false,
    action,
  });
  writeAuthState(auth);
}
function addActivity(
  state,
  record,
  actor,
  action,
  description,
  before = null,
  after = null,
  reason = "",
  visibility = "Internal",
) {
  const event = {
    id: uid("rights-activity"),
    actor: actorName(actor),
    trackId: record.trackId,
    rightsRecordId: record.id,
    version: record.version,
    timestamp: now(),
    action,
    description,
    before,
    after,
    reason,
    source: "Rights Database",
    visibility,
  };
  record.activity.unshift(event);
  state.globalActivity.unshift(event);
  return event;
}

export function calculateCompleteness(record) {
  const categories = [
    [
      "Master ownership",
      record.masterRights?.owners?.length > 0 &&
        record.masterRights.totalOwnership === 100,
    ],
    [
      "Writer shares",
      record.compositionRights?.writers?.length > 0 &&
        record.compositionRights.writerShareTotal === 100,
    ],
    [
      "Publisher shares",
      record.publishingRights?.publishers?.length > 0 &&
        record.publishingRights.publisherShareTotal === 100,
    ],
    [
      "PRO information",
      record.compositionRights?.writers?.length > 0 &&
        record.compositionRights.writers.every((item) => item.pro),
    ],
    ["Contracts", record.contracts?.length > 0],
    [
      "Samples",
      record.samples?.length === 0
        ? record.declarations?.noUndeclaredSamples
        : record.samples.every(
            (item) =>
              !item.clearanceRequired || item.status === "Fully Cleared",
          ),
    ],
    [
      "Contributor releases",
      record.contributors?.length === 0 ||
        record.contributors.every((item) => item.releaseStatus === "Accepted"),
    ],
    [
      "Territories",
      record.territories?.included?.length > 0 &&
        !record.territories?.conflicts?.length,
    ],
    [
      "Approval requirements",
      (record.approvalRequirements || []).every(
        (item) => !item.required || item.approver,
      ),
    ],
    [
      "Supporting documents",
      record.documents?.length > 0 &&
        record.documents.every((id) => {
          const doc =
            readRightsState().documents.find((item) => item.id === id) ||
            RIGHTS_DOCUMENTS.find((item) => item.id === id);
          return doc && ["Accepted", "Superseded"].includes(doc.reviewStatus);
        }),
    ],
  ];
  const percentage = Math.round(
    (categories.filter(([, complete]) => complete).length / categories.length) *
      100,
  );
  const missingSections = categories
    .filter(([, complete]) => !complete)
    .map(([name]) => name);
  const blockingIssues = [];
  const warnings = [];
  if (record.masterRights.totalOwnership !== 100)
    blockingIssues.push(
      `Master ownership totals ${record.masterRights.totalOwnership}%`,
    );
  if (record.compositionRights.writerShareTotal !== 100)
    blockingIssues.push(
      `Writer shares total ${record.compositionRights.writerShareTotal}%`,
    );
  if (record.publishingRights.publisherShareTotal !== 100)
    warnings.push(
      `Publisher shares total ${record.publishingRights.publisherShareTotal}%`,
    );
  if (
    record.disputes?.some(
      (item) => !["Resolved", "Rejected", "Closed"].includes(item.status),
    )
  )
    blockingIssues.push("Active rights dispute");
  if (
    record.samples?.some(
      (item) => item.clearanceRequired && item.status !== "Fully Cleared",
    )
  )
    blockingIssues.push("Sample clearance incomplete");
  if (record.territories?.conflicts?.length)
    blockingIssues.push("Territory control conflict");
  if (
    record.contracts?.some(
      (item) =>
        item.expiryDate && new Date(item.expiryDate).getTime() < Date.now(),
    )
  )
    blockingIssues.push("Contract or authority expired");
  if (record.compositionRights.writers?.some((item) => !item.ipiCae))
    warnings.push("Writer IPI or CAE missing");
  return { percentage, missingSections, blockingIssues, warnings };
}

export function calculateRightsStatus(record) {
  if (
    record.disputes?.some(
      (item) => !["Resolved", "Rejected", "Closed"].includes(item.status),
    )
  )
    return "Disputed";
  if (
    record.review?.nextReviewAt &&
    new Date(record.review.nextReviewAt).getTime() < Date.now()
  )
    return "Review Expired";
  if (
    record.samples?.some(
      (item) => item.clearanceRequired && item.status !== "Fully Cleared",
    )
  )
    return "Restricted";
  if (
    record.restrictions?.some((item) =>
      item.appliesTo?.toLowerCase().includes("all commercial"),
    )
  )
    return "Restricted";
  const master =
    record.masterRights?.status === "Verified" &&
    record.masterRights.totalOwnership === 100;
  const publishing =
    record.publishingRights?.status === "Verified" &&
    record.compositionRights?.writerShareTotal === 100 &&
    record.publishingRights.publisherShareTotal === 100;
  if (master && publishing) return "Fully Verified";
  if (master && !publishing) return "Partially Verified";
  if (!master && publishing) return "Publishing Verified";
  if (
    record.compositionRights?.writerShareTotal !== 100 ||
    record.masterRights?.totalOwnership !== 100
  )
    return "Documents Requested";
  return record.status === "Unreviewed" ? "Unreviewed" : "Under Review";
}

function restrictionMatches(restriction, context) {
  if (!restriction) return false;
  const territoryBlocked =
    restriction.type === "Territory Restriction" &&
    context.territory &&
    restriction.territory &&
    !restriction.territory.includes(context.territory);
  const mediaBlocked =
    restriction.type === "Media Restriction" &&
    context.media &&
    restriction.description
      ?.toLowerCase()
      .includes(context.media.toLowerCase());
  const generalBlocked =
    [
      "No Advertising",
      "No Trailer Use",
      "Political Use Restriction",
      "Brand Category Restriction",
    ].includes(restriction.type) &&
    (!context.usageType ||
      restriction.description
        ?.toLowerCase()
        .includes(context.usageType.toLowerCase()) ||
      restriction.appliesTo?.toLowerCase().includes("all"));
  return territoryBlocked || mediaBlocked || generalBlocked;
}

export function calculateLicensingEligibility(record, requestContext = {}) {
  const completeness = calculateCompleteness(record);
  const blockingIssues = [...completeness.blockingIssues];
  const requiredApprovals = (record.approvalRequirements || [])
    .filter((item) => item.required)
    .map((item) => item.type);
  const restrictions = (record.restrictions || [])
    .filter((item) => item.publicVisibility !== "Internal")
    .map((item) => item.buyerWording || item.description);
  const contextBlocks = (record.restrictions || []).filter((item) =>
    restrictionMatches(item, requestContext),
  );
  if (contextBlocks.length)
    blockingIssues.push(
      ...contextBlocks.map((item) => item.buyerWording || item.description),
    );
  let eligibility = record.licensingEligibility;
  if (
    record.status === "Disputed" ||
    record.disputes?.some(
      (item) => !["Resolved", "Rejected", "Closed"].includes(item.status),
    )
  )
    eligibility = "Blocked";
  else if (record.status === "Review Expired")
    eligibility = "Manual Review Required";
  else if (blockingIssues.length)
    eligibility =
      record.status === "Restricted" ? "Blocked" : "Not Yet Eligible";
  else if (requiredApprovals.length) eligibility = "Conditional";
  else if (record.status === "Fully Verified")
    eligibility = restrictions.length
      ? "Eligible with Restrictions"
      : "Eligible";
  const manualReviewRequired = [
    "Conditional",
    "Manual Review Required",
    "Eligible with Restrictions",
    "Not Yet Eligible",
    "Not Licensable",
    "Blocked",
  ].includes(eligibility);
  let allowedAssets = ["Preview"];
  if (
    ["Eligible", "Eligible with Restrictions", "Conditional"].includes(
      eligibility,
    ) &&
    record.masterRights.masterUseAllowed
  )
    allowedAssets.push("Master");
  if (
    eligibility === "Eligible" &&
    record.buyerSummary?.stems?.toLowerCase().includes("available")
  )
    allowedAssets.push("Stems");
  if (requestContext.deliveryAssets?.length)
    requestContext.deliveryAssets
      .filter((item) => !allowedAssets.includes(item))
      .forEach((item) =>
        blockingIssues.push(`${item} delivery is not currently cleared`),
      );
  return {
    eligibility,
    blockingIssues: [...new Set(blockingIssues)],
    requiredApprovals: [...new Set(requiredApprovals)],
    restrictions: [...new Set(restrictions)],
    manualReviewRequired,
    allowedAssets,
    blockedAssets: ["Preview", "Master", "Stems"].filter(
      (item) => !allowedAssets.includes(item),
    ),
  };
}

export function canTransitionRightsStatus(current, next, context = {}) {
  if (
    !(RIGHTS_STATUS_TRANSITIONS[current] || []).includes(next) &&
    !context.superAdmin
  )
    return false;
  if (
    next === "Fully Verified" &&
    context.blockers?.length &&
    !context.overrideReason
  )
    return false;
  if (
    next === "Fully Verified" &&
    !context.canVerifyFinal &&
    !context.superAdmin
  )
    return false;
  return true;
}

function versionSnapshot(record) {
  return {
    status: record.status,
    licensingEligibility: record.licensingEligibility,
    masterRights: clone(record.masterRights),
    compositionRights: clone(record.compositionRights),
    publishingRights: clone(record.publishingRights),
    contributors: clone(record.contributors),
    samples: clone(record.samples),
    contracts: clone(record.contracts),
    territories: clone(record.territories),
    restrictions: clone(record.restrictions),
    approvalRequirements: clone(record.approvalRequirements),
    documents: clone(record.documents),
    disputes: clone(record.disputes),
    completeness: clone(record.completeness),
    review: clone(record.review),
  };
}
function createVersionInState(
  state,
  record,
  actor,
  reason,
  summary,
  before,
  linkedDocuments = [],
) {
  const previous = record.versions?.find((item) => item.current);
  if (previous) previous.current = false;
  record.version = (record.version || 1) + 1;
  const version = {
    version: record.version,
    effectiveDate: now(),
    createdBy: actorName(actor),
    reason,
    summary,
    before: clone(before),
    after: versionSnapshot(record),
    linkedDocuments,
    current: true,
  };
  record.versions = record.versions || [];
  record.versions.unshift(version);
  record.updatedAt = now();
  record.updatedBy = actorName(actor);
  addActivity(
    state,
    record,
    actor,
    "Rights version created",
    `Version ${record.version}: ${summary}`,
    before?.status,
    record.status,
    reason,
  );
  return version;
}
function recalculate(record) {
  record.masterRights.totalOwnership = sum(
    record.masterRights.owners || [],
    "ownershipPercentage",
  );
  record.compositionRights.writerShareTotal = sum(
    record.compositionRights.writers || [],
    "writerShare",
  );
  record.publishingRights.publisherShareTotal = sum(
    record.publishingRights.publishers || [],
    "publisherShare",
  );
  record.publishingRights.controlledShare = sum(
    (record.publishingRights.publishers || []).filter(
      (item) => item.controlledByBeatmondo,
    ),
    "publisherShare",
  );
  record.publishingRights.uncontrolledShare = Math.max(
    0,
    100 - record.publishingRights.controlledShare,
  );
  record.completeness = calculateCompleteness(record);
  const calculated = calculateRightsStatus(record);
  if (
    ![
      "Restricted",
      "Disputed",
      "Review Expired",
      "Archived",
      "Not Licensable",
    ].includes(record.status)
  )
    record.status = calculated;
  record.licensingEligibility =
    calculateLicensingEligibility(record).eligibility;
  return record;
}

export const rightsService = {
  getState: readRightsState,
  getByTrack(trackId) {
    return clone(
      readRightsState().records.find(
        (item) => String(item.trackId) === String(trackId),
      ) || null,
    );
  },
  getById(id) {
    return clone(
      readRightsState().records.find((item) => item.id === id) || null,
    );
  },
  getQueue(filters = {}) {
    let records = readRightsState().records.map((record) => ({
      ...record,
      completeness: calculateCompleteness(record),
    }));
    const query = String(filters.query || "").toLowerCase();
    if (query)
      records = records.filter((record) => {
        const text = [
          record.trackTitle,
          record.artist,
          record.isrc,
          record.compositionRights?.iswc,
          ...(record.masterRights?.owners || []).map((item) => item.partyName),
          ...(record.compositionRights?.writers || []).map((item) => item.name),
          ...(record.publishingRights?.publishers || []).map(
            (item) => item.name,
          ),
        ]
          .join(" ")
          .toLowerCase();
        return text.includes(query);
      });
    if (filters.status && filters.status !== "All Statuses")
      records = records.filter((item) => item.status === filters.status);
    if (filters.eligibility && filters.eligibility !== "All Eligibility")
      records = records.filter(
        (item) => item.licensingEligibility === filters.eligibility,
      );
    if (filters.master && filters.master !== "All Master States")
      records = records.filter(
        (item) => item.masterRights.status === filters.master,
      );
    if (filters.publishing && filters.publishing !== "All Publishing States")
      records = records.filter(
        (item) => item.publishingRights.status === filters.publishing,
      );
    if (filters.sample === "Clearance Required")
      records = records.filter((item) =>
        item.samples.some(
          (sample) =>
            sample.clearanceRequired && sample.status !== "Fully Cleared",
        ),
      );
    if (filters.sample === "No Sample Declared")
      records = records.filter((item) => !item.samples.length);
    if (filters.completeness === "Below 70%")
      records = records.filter((item) => item.completeness.percentage < 70);
    if (filters.completeness === "70–89%")
      records = records.filter(
        (item) =>
          item.completeness.percentage >= 70 &&
          item.completeness.percentage < 90,
      );
    if (filters.completeness === "90–100%")
      records = records.filter((item) => item.completeness.percentage >= 90);
    if (filters.artist && filters.artist !== "All Artists")
      records = records.filter((item) => item.artist === filters.artist);
    const sort = filters.sort || "Highest Priority";
    const priority = { Critical: 4, Urgent: 3, High: 2, Standard: 1 };
    records = [...records].sort((a, b) =>
      sort === "Lowest Completeness"
        ? a.completeness.percentage - b.completeness.percentage
        : sort === "Oldest Review"
          ? String(a.review.lastReviewedAt || "").localeCompare(
              String(b.review.lastReviewedAt || ""),
            )
          : sort === "Track Title"
            ? a.trackTitle.localeCompare(b.trackTitle)
            : (priority[b.priority] || 0) - (priority[a.priority] || 0),
    );
    return clone(records);
  },
  getParties(filters = {}) {
    const query = String(filters.query || "").toLowerCase();
    return clone(
      readRightsState().parties.filter(
        (party) =>
          !query ||
          `${party.legalName} ${party.displayName} ${party.partyType} ${party.pro || ""} ${party.ipiCae || ""}`
            .toLowerCase()
            .includes(query),
      ),
    );
  },
  getDocuments(filters = {}) {
    let documents = readRightsState().documents;
    if (filters.trackId)
      documents = documents.filter(
        (item) => String(item.relatedTrackId) === String(filters.trackId),
      );
    if (filters.status && filters.status !== "All Statuses")
      documents = documents.filter(
        (item) => item.reviewStatus === filters.status,
      );
    return clone(documents);
  },
  getVisibleDocuments(record, user) {
    const documents = readRightsState().documents.filter((item) =>
      record.documents.includes(item.id),
    );
    if (user?.permissions?.includes("*")) return clone(documents);
    if (hasPermission(user, "rights.view_legal_notes"))
      return clone(
        documents.filter((item) => item.confidentiality !== "Super Admin Only"),
      );
    if (
      hasPermission(user, "rights.manage_documents") ||
      hasPermission(user, "rights.view_internal_notes")
    )
      return clone(
        documents.filter(
          (item) =>
            !["Legal Restricted", "Super Admin Only"].includes(
              item.confidentiality,
            ),
        ),
      );
    if (user?.role === "artist")
      return clone(
        documents.filter(
          (item) =>
            ["Buyer Visible", "Public Summary"].includes(
              item.confidentiality,
            ) || item.uploadedBy === user.name,
        ),
      );
    return clone(
      documents.filter((item) =>
        ["Buyer Visible", "Public Summary"].includes(item.confidentiality),
      ),
    );
  },
  getBuyerSummary(trackId, context = {}) {
    const record = this.getByTrack(trackId);
    if (!record) return null;
    const result = calculateLicensingEligibility(record, context);
    return {
      trackId: record.trackId,
      trackTitle: record.trackTitle,
      status: record.publicSummary?.status || "Rights Review Required",
      wording: record.publicSummary?.wording || "Rights review is required.",
      territory: record.publicSummary?.territory || "Not confirmed",
      master: record.buyerSummary?.master || "Under review",
      publishing: record.buyerSummary?.publishing || "Under review",
      approvals: record.buyerSummary?.approvals || "Manual review",
      stems: record.buyerSummary?.stems || "Not available",
      delivery: record.buyerSummary?.delivery || "Disabled",
      eligibility: result.eligibility,
      requiredApprovals: result.requiredApprovals,
      restrictions: result.restrictions,
      allowedAssets: result.allowedAssets,
      manualReviewRequired: result.manualReviewRequired,
      licensable: [
        "Eligible",
        "Eligible with Restrictions",
        "Conditional",
      ].includes(result.eligibility),
    };
  },
  getArtistRecords(user) {
    if (!user || user.role !== "artist") return [];
    return clone(
      readRightsState().records.filter(
        (item) =>
          item.trackId === 15 ||
          item.artist.toLowerCase() ===
            String(user.organization || "").toLowerCase(),
      ),
    );
  },
  createParty(values, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.manage_parties"))
        return {
          ok: false,
          message: "Rights-party management permission is required.",
        };
      if (!values.legalName || !values.partyType)
        return {
          ok: false,
          message: "Legal name and party type are required.",
        };
      if (
        state.parties.some(
          (item) =>
            item.legalName.toLowerCase() === values.legalName.toLowerCase() &&
            item.active,
        )
      )
        return {
          ok: false,
          message:
            "An active rights party with this legal name already exists.",
        };
      const party = {
        id: uid("party"),
        displayName: values.legalName,
        country: "",
        pro: null,
        ipiCae: null,
        verificationStatus: "Unverified",
        active: true,
        documents: [],
        internalNotes: "",
        ...values,
      };
      state.parties.push(party);
      return { ok: true, party: clone(party) };
    });
  },
  async updateSection(
    recordId,
    section,
    values,
    actor,
    reason = "Rights data updated",
  ) {
    await wait();
    return mutate((state) => {
      if (!hasPermission(actor, "rights.edit"))
        return { ok: false, message: "Rights editing permission is required." };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false, message: "Rights record not found." };
      const before = versionSnapshot(record);
      record[section] = { ...record[section], ...clone(values) };
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        reason,
        `${section} updated.`,
        before,
      );
      return { ok: true, record: clone(record) };
    });
  },
  updateMasterOwners(recordId, owners, actor, reason) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.edit"))
        return {
          ok: false,
          message: "Ownership editing permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false, message: "Rights record not found." };
      const ids = owners.map((item) => item.partyId);
      if (ids.some((id, index) => ids.indexOf(id) !== index))
        return { ok: false, message: "Duplicate master owner detected." };
      if (
        owners.some(
          (item) =>
            !item.partyName ||
            Number(item.ownershipPercentage) < 0 ||
            Number(item.ownershipPercentage) > 100,
        )
      )
        return {
          ok: false,
          message:
            "Each owner requires a name and percentage between 0 and 100.",
        };
      const before = versionSnapshot(record);
      record.masterRights.owners = clone(owners);
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        reason || "Master ownership updated",
        `Master ownership now totals ${record.masterRights.totalOwnership}%.`,
        before,
      );
      addActivity(
        state,
        record,
        actor,
        "Ownership percentage changed",
        `Master ownership total is ${record.masterRights.totalOwnership}%.`,
        before.masterRights.totalOwnership,
        record.masterRights.totalOwnership,
        reason,
      );
      if (record.masterRights.totalOwnership !== 100)
        addMessage(
          "user-marcus",
          "Master ownership requires attention",
          `${record.trackTitle} master ownership totals ${record.masterRights.totalOwnership}%.`,
        );
      return { ok: true, record: clone(record) };
    });
  },
  updateWriters(recordId, writers, actor, reason) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.edit"))
        return {
          ok: false,
          message: "Composition editing permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false };
      const ids = writers.map((item) => item.partyId);
      if (ids.some((id, index) => ids.indexOf(id) !== index))
        return { ok: false, message: "Duplicate writer detected." };
      if (
        writers.some(
          (item) =>
            !item.name ||
            Number(item.writerShare) < 0 ||
            Number(item.writerShare) > 100,
        )
      )
        return {
          ok: false,
          message: "Each writer requires a name and valid share.",
        };
      const before = versionSnapshot(record);
      record.compositionRights.writers = clone(writers);
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        reason || "Writer shares updated",
        `Writer shares now total ${record.compositionRights.writerShareTotal}%.`,
        before,
      );
      if (record.compositionRights.writerShareTotal !== 100)
        addMessage(
          "user-marcus",
          "Ownership split incomplete",
          `${record.trackTitle} writer shares total ${record.compositionRights.writerShareTotal}%.`,
        );
      return { ok: true, record: clone(record) };
    });
  },
  updatePublishers(recordId, publishers, actor, reason) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.edit"))
        return {
          ok: false,
          message: "Publishing editing permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false };
      const before = versionSnapshot(record);
      record.publishingRights.publishers = clone(publishers);
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        reason || "Publishing shares updated",
        `Publisher shares now total ${record.publishingRights.publisherShareTotal}%.`,
        before,
      );
      return { ok: true, record: clone(record) };
    });
  },
  addContributor(recordId, values, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.edit"))
        return { ok: false, message: "Rights editing permission is required." };
      const record = state.records.find((item) => item.id === recordId);
      if (!record || !values.name || !values.role)
        return {
          ok: false,
          message: "Contributor name and role are required.",
        };
      const before = versionSnapshot(record);
      record.contributors.push({
        id: uid("contributor"),
        contractStatus: "Pending Review",
        releaseStatus: "Pending Review",
        approvalRequired: false,
        revenueParticipation: "Not recorded",
        territory: "Worldwide",
        evidenceDocumentIds: [],
        notes: "Participation is not automatically ownership.",
        ...values,
      });
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        "Contributor added",
        `${values.name} added as ${values.role}.`,
        before,
      );
      return { ok: true, record: clone(record) };
    });
  },
  addSample(recordId, values, actor) {
    return mutate((state) => {
      if (
        !hasPermission(actor, "rights.verify_samples") &&
        !hasPermission(actor, "rights.edit")
      )
        return {
          ok: false,
          message: "Sample-management permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record || !values.sourceTrack)
        return { ok: false, message: "Sample source is required." };
      const before = versionSnapshot(record);
      record.samples.push({
        id: uid("sample"),
        declared: true,
        type: "Master and composition sample",
        sourceArtist: "",
        sourceMasterOwner: "",
        sourcePublisher: "",
        portionUsed: "",
        clearanceRequired: true,
        masterClearance: "Research Required",
        publishingClearance: "Research Required",
        territory: "Worldwide",
        restrictions: ["Commercial licensing blocked until cleared"],
        clearanceFee: "Confidential placeholder",
        evidenceDocumentIds: [],
        status: "Research Required",
        reviewerId: record.assignedReviewerId,
        ...values,
      });
      record.restrictions.push({
        id: uid("restriction"),
        type: "No Advertising",
        description: "Sample clearance incomplete.",
        appliesTo: "All commercial licensing and delivery",
        territory: "Worldwide",
        effectiveFrom: now().slice(0, 10),
        effectiveUntil: null,
        approvalPath: "Sample-owner and publisher approval",
        publicVisibility: "Buyer Visible",
        buyerWording:
          "Manual rights review is required before commercial licensing.",
        internalRationale: "Sample clearance is incomplete.",
      });
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        "Sample declared",
        "Sample clearance workflow added and licensing eligibility recalculated.",
        before,
      );
      addMessage(
        "user-marcus",
        "Sample clearance required",
        `${record.trackTitle} requires sample-clearance evidence.`,
      );
      return { ok: true, record: clone(record) };
    });
  },
  addRestriction(recordId, values, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.manage_restrictions"))
        return {
          ok: false,
          message: "Restriction-management permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record || !values.type || !values.description)
        return {
          ok: false,
          message: "Restriction type and description are required.",
        };
      const before = versionSnapshot(record);
      record.restrictions.push({
        id: uid("restriction"),
        appliesTo: "Licensing",
        territory: "Worldwide",
        effectiveFrom: now().slice(0, 10),
        effectiveUntil: null,
        approvalPath: "Manual review",
        publicVisibility: "Buyer Visible",
        buyerWording: values.description,
        internalRationale: "",
        ...values,
      });
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        "Restriction added",
        `${values.type} added; eligibility recalculated.`,
        before,
      );
      return { ok: true, record: clone(record) };
    });
  },
  addTerritory(recordId, territory, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.manage_territories"))
        return {
          ok: false,
          message: "Territory-management permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false };
      const before = versionSnapshot(record);
      if (!record.territories.included.includes(territory))
        record.territories.included.push(territory);
      if (
        record.territories.included.includes("Worldwide") &&
        territory !== "Worldwide"
      )
        record.territories.conflicts = [
          `Worldwide control conflicts with specific ${territory} control; reviewer confirmation required.`,
        ];
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        "Territory changed",
        `${territory} added; conflicts recalculated.`,
        before,
      );
      return { ok: true, record: clone(record) };
    });
  },
  uploadDocument(recordId, file, category, confidentiality, actor) {
    return mutate((state) => {
      if (
        !hasPermission(actor, "rights.manage_documents") &&
        actor?.role !== "artist"
      )
        return {
          ok: false,
          message: "Document-upload permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false };
      const document = {
        id: uid("rights-document"),
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        category,
        relatedTrackId: record.trackId,
        relatedPartyId: null,
        version: 1,
        uploadedBy: actorName(actor),
        uploadedAt: now(),
        reviewStatus: "Uploaded",
        effectiveDate: null,
        expiryDate: null,
        confidentiality:
          actor?.role === "artist" ? "Internal" : confidentiality,
        mockStorageReference: `mock://rights/${uid("file")}`,
        notes: "Simulated upload metadata only.",
      };
      state.documents.push(document);
      record.documents.push(document.id);
      recalculate(record);
      addActivity(
        state,
        record,
        actor,
        "Document uploaded",
        `${document.fileName} uploaded as ${category}.`,
        null,
        document.id,
        "",
        actor?.role === "artist" ? "Internal" : confidentiality,
      );
      if (actor?.role === "artist")
        addMessage(
          "user-preston",
          "Rights document uploaded",
          `${record.trackTitle}: ${document.fileName} is ready for review.`,
          "admin-rights",
        );
      return { ok: true, record: clone(record), document: clone(document) };
    });
  },
  reviewDocument(recordId, documentId, status, privateNote, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.manage_documents"))
        return {
          ok: false,
          message: "Document-review permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      const document = state.documents.find((item) => item.id === documentId);
      if (!record || !document) return { ok: false };
      const before = document.reviewStatus;
      document.reviewStatus = status;
      document.privateNote = privateNote;
      recalculate(record);
      addActivity(
        state,
        record,
        actor,
        `Document ${status.toLowerCase()}`,
        `${document.fileName} changed from ${before} to ${status}.`,
        before,
        status,
        privateNote,
        "Internal",
      );
      if (["Replacement Requested", "Rejected"].includes(status))
        addMessage(
          "user-marcus",
          "Rights document action required",
          `${document.fileName}: ${status}.`,
        );
      return { ok: true, record: clone(record), document: clone(document) };
    });
  },
  assignReviewer(recordId, reviewerId, priority, dueDate, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.assign_reviewers"))
        return {
          ok: false,
          message: "Reviewer-assignment permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false };
      const before = record.assignedReviewerId;
      record.assignedReviewerId = reviewerId;
      record.priority = priority;
      record.review.dueDate = dueDate;
      if (
        ["Unreviewed", "Draft", "Documents Requested"].includes(record.status)
      )
        record.status = "Under Review";
      addActivity(
        state,
        record,
        actor,
        "Reviewer assigned",
        `${reviewerId} assigned with ${priority} priority.`,
        before,
        reviewerId,
      );
      addMessage(
        "user-preston",
        "Rights review assigned",
        `${record.trackTitle} assigned to ${reviewerId}.`,
        "admin-rights-track",
      );
      return { ok: true, record: clone(record) };
    });
  },
  updateChecklist(recordId, item, checked, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.edit"))
        return { ok: false, message: "Rights review permission is required." };
      const record = state.records.find((entry) => entry.id === recordId);
      if (!record || !RIGHTS_CHECKLIST.includes(item)) return { ok: false };
      record.review.checklist[item] = checked;
      addActivity(
        state,
        record,
        actor,
        "Review checklist updated",
        `${item}: ${checked ? "Complete" : "Incomplete"}.`,
        !checked,
        checked,
      );
      return { ok: true, record: clone(record) };
    });
  },
  verifyDomain(recordId, domain, actor) {
    return mutate((state) => {
      const permission =
        domain === "masterRights"
          ? "rights.verify_master"
          : domain === "publishingRights"
            ? "rights.verify_publishing"
            : "rights.verify_samples";
      if (!hasPermission(actor, permission))
        return { ok: false, message: `${permission} permission is required.` };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false };
      const before = versionSnapshot(record);
      if (
        domain === "masterRights" &&
        (record.masterRights.totalOwnership !== 100 ||
          record.disputes?.some(
            (item) => !["Resolved", "Closed", "Rejected"].includes(item.status),
          ))
      )
        return {
          ok: false,
          message: "Master ownership must total 100% with no active dispute.",
        };
      if (
        domain === "publishingRights" &&
        (record.compositionRights.writerShareTotal !== 100 ||
          record.publishingRights.publisherShareTotal !== 100)
      )
        return {
          ok: false,
          message: "Writer and publisher shares must each total 100%.",
        };
      if (
        domain === "samples" &&
        record.samples.some(
          (item) => item.clearanceRequired && item.status !== "Fully Cleared",
        )
      )
        return {
          ok: false,
          message: "Every required sample clearance must be fully cleared.",
        };
      if (domain === "masterRights") {
        record.masterRights.status = "Verified";
        record.masterRights.verifiedAt = now();
        record.masterRights.verifiedBy = actorName(actor);
      } else if (domain === "publishingRights") {
        record.publishingRights.status = "Verified";
        record.publishingRights.verifiedAt = now();
        record.publishingRights.verifiedBy = actorName(actor);
        record.compositionRights.status = "Verified";
      }
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        `${domain} verified`,
        `${domain} verification recorded.`,
        before,
      );
      return { ok: true, record: clone(record) };
    });
  },
  markFullyVerified(recordId, actor, overrideReason = "") {
    return mutate((state) => {
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false };
      const completeness = calculateCompleteness(record);
      const checklistMissing = RIGHTS_CHECKLIST.filter(
        (item) => !record.review.checklist[item],
      );
      const blockers = [
        ...completeness.blockingIssues,
        ...checklistMissing.map((item) => `Checklist incomplete: ${item}`),
      ];
      const superAdmin = actor?.permissions?.includes("*");
      if (!hasPermission(actor, "rights.verify_final"))
        return {
          ok: false,
          message: "Final-verification permission is required.",
        };
      if (blockers.length && !(superAdmin && overrideReason))
        return {
          ok: false,
          message: `Fully Verified is blocked: ${blockers.slice(0, 5).join("; ")}.`,
        };
      const before = versionSnapshot(record);
      record.status = "Fully Verified";
      record.licensingEligibility = record.restrictions.length
        ? "Eligible with Restrictions"
        : "Eligible";
      record.review.workflowStage = "Approved";
      record.review.lastReviewedAt = now();
      record.review.nextReviewAt = new Date(
        Date.now() + 365 * 86400000,
      ).toISOString();
      record.review.expiryStatus = "Current";
      record.publicSummary.approved = true;
      createVersionInState(
        state,
        record,
        actor,
        overrideReason
          ? "Final verification with override"
          : "Final verification",
        "Track marked Fully Verified after prerequisite validation.",
        before,
      );
      addActivity(
        state,
        record,
        actor,
        overrideReason ? "Manual override used" : "Track fully verified",
        overrideReason || "Final review complete.",
        before.status,
        record.status,
        overrideReason,
        "Internal",
      );
      addMessage(
        "user-marcus",
        "Track rights verified",
        `${record.trackTitle} completed the recorded rights review.`,
      );
      return { ok: true, record: clone(record) };
    });
  },
  openDispute(recordId, values, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.manage_disputes"))
        return {
          ok: false,
          message: "Dispute-management permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      if (!record || !values.claimant || !values.claimType)
        return { ok: false, message: "Claimant and claim type are required." };
      const before = versionSnapshot(record);
      const dispute = {
        id: uid("dispute"),
        reference: `BM-RD-2026-${String(Date.now()).slice(-4)}`,
        track: record.trackTitle,
        claimant: values.claimant,
        claimType: values.claimType,
        claimedPercentage: Number(values.claimedPercentage) || 0,
        rightsDomain: values.rightsDomain || "Master",
        dateRaised: now().slice(0, 10),
        evidenceDocumentIds: [],
        internalOwner: actorName(actor),
        legalReviewer: values.legalReviewer || "Preston Repenning",
        status: "Reported",
        buyerImpact: "Licensing and secure delivery blocked",
        publicImpact: "Buyer-safe unavailable state",
        resolution: null,
        closedDate: null,
      };
      record.disputes.push(dispute);
      record.status = "Disputed";
      record.licensingEligibility = "Blocked";
      record.masterRights.masterUseAllowed = false;
      createVersionInState(
        state,
        record,
        actor,
        "Dispute opened",
        `${dispute.claimType} dispute ${dispute.reference} opened.`,
        before,
      );
      addMessage(
        "user-preston",
        "Rights dispute opened",
        `${record.trackTitle}: ${dispute.reference}.`,
        "admin-rights-disputes",
      );
      return { ok: true, record: clone(record), dispute: clone(dispute) };
    });
  },
  updateDispute(recordId, disputeId, status, resolution, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.manage_disputes"))
        return {
          ok: false,
          message: "Dispute-management permission is required.",
        };
      const record = state.records.find((item) => item.id === recordId);
      const dispute = record?.disputes.find((item) => item.id === disputeId);
      if (!record || !dispute) return { ok: false };
      const before = versionSnapshot(record);
      const old = dispute.status;
      dispute.status = status;
      dispute.resolution = resolution;
      if (["Resolved", "Rejected", "Closed"].includes(status)) {
        dispute.closedDate = now().slice(0, 10);
        record.status = "Under Review";
        record.licensingEligibility = "Manual Review Required";
      }
      recalculate(record);
      createVersionInState(
        state,
        record,
        actor,
        `Dispute ${status.toLowerCase()}`,
        `${dispute.reference} changed from ${old} to ${status}.`,
        before,
      );
      return { ok: true, record: clone(record), dispute: clone(dispute) };
    });
  },
  triggerReverification(recordId, actor, reason) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.trigger_reverification"))
        return { ok: false, message: "Reverification permission is required." };
      const record = state.records.find((item) => item.id === recordId);
      if (!record) return { ok: false };
      const before = versionSnapshot(record);
      record.previousStatus = record.status;
      record.status = "Under Review";
      record.licensingEligibility = "Manual Review Required";
      record.review.workflowStage = "Initial Review";
      record.review.expiryStatus = "Reverification Started";
      record.review.dueDate = new Date(Date.now() + 14 * 86400000)
        .toISOString()
        .slice(0, 10);
      record.review.checklist = {};
      createVersionInState(
        state,
        record,
        actor,
        reason || "Reverification triggered",
        "Rights review reopened; new licensing requires a current decision.",
        before,
      );
      addMessage(
        "user-marcus",
        "Rights reverification started",
        `${record.trackTitle} requires updated rights information.`,
      );
      return { ok: true, record: clone(record) };
    });
  },
  submitArtistCorrection(recordId, values, actor) {
    return mutate((state) => {
      const record = state.records.find((item) => item.id === recordId);
      if (!record || actor?.role !== "artist" || record.trackId !== 15)
        return {
          ok: false,
          message: "Artists can submit corrections only for their own catalog.",
        };
      record.artistSubmissions = record.artistSubmissions || [];
      const submission = {
        id: uid("artist-correction"),
        submittedBy: actorName(actor),
        submittedAt: now(),
        status: "Pending Review",
        ...values,
      };
      record.artistSubmissions.unshift(submission);
      addActivity(
        state,
        record,
        actor,
        "Artist correction submitted",
        "Rights correction submitted for internal review.",
        null,
        submission.id,
        values.message,
        "Internal",
      );
      addMessage(
        "user-preston",
        "Artist rights correction submitted",
        `${record.trackTitle}: ${values.message}`,
        "admin-rights-track",
      );
      return { ok: true, record: clone(record), submission: clone(submission) };
    });
  },
  compareVersions(recordId, leftVersion, rightVersion) {
    const record = readRightsState().records.find(
      (item) => item.id === recordId,
    );
    if (!record) return null;
    const left = record.versions.find(
      (item) => item.version === Number(leftVersion),
    );
    const right = record.versions.find(
      (item) => item.version === Number(rightVersion),
    );
    if (!left || !right) return null;
    const before = left.after || left.before || {};
    const after = right.after || right.before || {};
    const changes = [];
    const add = (label, a, b) => {
      if (JSON.stringify(a) !== JSON.stringify(b))
        changes.push({ label, before: a, after: b });
    };
    add("Rights status", before.status, after.status);
    add(
      "Licensing eligibility",
      before.licensingEligibility,
      after.licensingEligibility,
    );
    add(
      "Master owners",
      before.masterRights?.owners,
      after.masterRights?.owners,
    );
    add(
      "Writers",
      before.compositionRights?.writers,
      after.compositionRights?.writers,
    );
    add(
      "Publishers",
      before.publishingRights?.publishers,
      after.publishingRights?.publishers,
    );
    add("Territories", before.territories, after.territories);
    add("Restrictions", before.restrictions, after.restrictions);
    add("Documents", before.documents, after.documents);
    add("Disputes", before.disputes, after.disputes);
    return { left: clone(left), right: clone(right), changes };
  },
  getAnalytics() {
    const records = readRightsState().records.map((record) => ({
      ...record,
      completeness: calculateCompleteness(record),
    }));
    const completeness = records.reduce(
      (total, item) => total + item.completeness.percentage,
      0,
    );
    return {
      total: records.length,
      fullyVerified: records.filter((item) => item.status === "Fully Verified")
        .length,
      partiallyVerified: records.filter(
        (item) => item.status === "Partially Verified",
      ).length,
      underReview: records.filter((item) =>
        ["Under Review", "Master Verified", "Publishing Verified"].includes(
          item.status,
        ),
      ).length,
      documentsRequested: records.filter(
        (item) => item.status === "Documents Requested",
      ).length,
      restricted: records.filter((item) => item.status === "Restricted").length,
      disputed: records.filter((item) => item.status === "Disputed").length,
      notLicensable: records.filter((item) =>
        ["Not Licensable", "Blocked"].includes(item.licensingEligibility),
      ).length,
      expiring: records.filter(
        (item) =>
          item.status === "Review Expired" ||
          item.review.expiryStatus === "Expiring Soon",
      ).length,
      averageCompleteness: records.length
        ? Math.round(completeness / records.length)
        : 0,
      missingShares: records.filter(
        (item) =>
          item.masterRights.totalOwnership !== 100 ||
          item.compositionRights.writerShareTotal !== 100,
      ).length,
      sampleCases: records.filter((item) =>
        item.samples.some(
          (sample) =>
            sample.clearanceRequired && sample.status !== "Fully Cleared",
        ),
      ).length,
      manualReviews: records.filter((item) =>
        ["Conditional", "Manual Review Required"].includes(
          item.licensingEligibility,
        ),
      ).length,
      uncontrolledPublishing: records.reduce(
        (total, item) => total + (item.publishingRights.uncontrolledShare || 0),
        0,
      ),
      verificationRate: records.length
        ? Math.round(
            (records.filter((item) => item.status === "Fully Verified").length /
              records.length) *
              100,
          )
        : 0,
      workload: Object.fromEntries(
        records
          .map((item) => item.assignedReviewerId)
          .reduce((map, id) => map.set(id, (map.get(id) || 0) + 1), new Map()),
      ),
    };
  },
  generateReport(type, actor) {
    return mutate((state) => {
      if (!hasPermission(actor, "rights.view"))
        return {
          ok: false,
          message: "Rights reporting permission is required.",
        };
      const report = {
        id: uid("rights-report"),
        type,
        generatedAt: now(),
        generatedBy: actorName(actor),
        format: "Print / CSV simulation",
        recordCount: state.records.length,
      };
      state.reports.unshift(report);
      return { ok: true, report: clone(report) };
    });
  },
  resetRightsDatabaseDemoData() {
    const state = clone(DEFAULT_RIGHTS_STATE);
    writeRightsState(state);
    return state;
  },
};

export const rightsEligibilityService = {
  calculateCompleteness,
  calculateRightsStatus,
  calculateLicensingEligibility,
};
export const rightsVersionService = {
  compareRightsVersions: (...args) => rightsService.compareVersions(...args),
};
export const rightsPartyService = {
  getParties: (...args) => rightsService.getParties(...args),
  createParty: (...args) => rightsService.createParty(...args),
};
export const rightsDocumentService = {
  getDocuments: (...args) => rightsService.getDocuments(...args),
  uploadRightsDocument: (...args) => rightsService.uploadDocument(...args),
  reviewRightsDocument: (...args) => rightsService.reviewDocument(...args),
};
