import { authService } from "../auth/authService.js";
import { rightsService } from "../rights/rightsService.js";
import { searchService } from "../search/searchService.js";
import {
  ACTIVE_DRAFT_KEY,
  DEFAULT_INGESTION_STATE,
  FILE_SCENARIOS,
  INGESTION_STATUSES,
  INGESTION_STORAGE_KEY,
  INGESTION_TRANSITIONS,
} from "./ingestionData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const actorName = (actor) => actor?.name || "System";
const internal = (user) => user?.userType === "internal" || user?.permissions?.includes("*");
const can = (user, permission) =>
  Boolean(user?.permissions?.includes("*") || user?.permissions?.includes(permission));

export function readIngestionState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(INGESTION_STORAGE_KEY));
    if (parsed?.version && Array.isArray(parsed.records) && Array.isArray(parsed.drafts)) return parsed;
  } catch {}
  const seeded = clone(DEFAULT_INGESTION_STATE);
  try { window.localStorage.setItem(INGESTION_STORAGE_KEY, JSON.stringify(seeded)); } catch {}
  return seeded;
}

function writeState(state) {
  try { window.localStorage.setItem(INGESTION_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

function update(mutator) {
  const state = readIngestionState();
  const result = mutator(state);
  if (!writeState(state)) return { ok: false, message: "The ingestion change could not be persisted." };
  return result;
}

function activity(record, actor, action, description, before = null, after = null, visibility = "Internal") {
  const event = { id: uid("activity"), actor: actorName(actor), actorId: actor?.id || null, ingestionId: record.id, track: record.trackTitle, artist: record.artistName, timestamp: now(), action, description, before, after, source: "Track Ingestion", visibility };
  record.activity.unshift(event);
  return event;
}

function notify(state, record, userId, type, title, message, action = "artist-submissions") {
  const notification = { id: uid("notification"), userId, ingestionId: record.id, type, title, message, action, createdAt: now(), read: false };
  state.notifications.unshift(notification);
  state.demoMessages.unshift({ ...notification, id: uid("email"), channel: "Demo Email" });
  if (authService.addDemoMessage && userId) authService.addDemoMessage(userId, type, title, message, action);
  return notification;
}

export function calculateMetadataReadiness(record) {
  const metadata = record.metadata || {};
  const requirements = [
    ["Track title", metadata.title],
    ["Artist", metadata.artist],
    ["Primary genre", metadata.primaryGenre],
    ["At least two moods", metadata.moods?.length >= 2],
    ["Duration", metadata.duration],
    ["Vocal type", metadata.vocalType],
    ["Intended usage", metadata.intendedUsage?.length > 0],
    ["Short description", metadata.shortDescription],
    ["Explicit-content state", metadata.explicit && metadata.explicit !== "Undeclared"],
  ];
  const missing = requirements.filter(([, complete]) => !complete).map(([label]) => label);
  return { ready: !missing.length, percentage: Math.round(((requirements.length - missing.length) / requirements.length) * 100), blockers: missing.map((item) => `${item} is required`), warnings: !metadata.bpm ? ["BPM is recommended for buyer discovery"] : [] };
}

export function calculateTechnicalReadiness(record) {
  const master = record.assets?.find((item) => item.assetType === "WAV Master" || item.assetType === "AIFF Master");
  const failedJobs = (record.processingJobs || []).filter((job) => job.status === "Failed");
  const activeJobs = (record.processingJobs || []).filter((job) => ["Queued", "Processing", "Retrying"].includes(job.status));
  const blockers = [];
  if (!master) blockers.push("A WAV or AIFF master is required");
  else if (["Failed", "Rejected"].includes(master.qualityStatus) || master.processingStatus === "Failed") blockers.push("The master audio failed validation");
  if (failedJobs.length) blockers.push(`${failedJobs.length} processing job${failedJobs.length === 1 ? " has" : "s have"} failed`);
  if (record.qualityControl?.status === "Failed") blockers.push("Technical review failed");
  const total = Math.max(1, (record.processingJobs || []).length);
  const completed = (record.processingJobs || []).filter((job) => ["Completed", "Completed with Warning"].includes(job.status)).length;
  return { ready: !blockers.length && !activeJobs.length && ["Passed", "Passed with Warnings"].includes(record.qualityControl?.status), percentage: Math.round((completed / total) * 100), blockers, warnings: [...(record.qualityControl?.warnings || []), ...(master?.warnings || [])] };
}

export function calculateRightsReadiness(record) {
  const status = record.rightsReadiness?.status || "Rights record not created";
  const policyReady = ["Fully Verified", "Manual Review Required", "Partially Verified"].includes(status);
  const blocked = ["Disputed", "Restricted", "Documents Requested", "Draft declaration", "Rights record not created"].includes(status);
  return { ready: policyReady && !blocked, percentage: status === "Fully Verified" ? 100 : status === "Manual Review Required" ? 85 : status === "Partially Verified" ? 70 : status === "Under review" ? 55 : status === "Documents Requested" ? 35 : 20, blockers: blocked ? record.rightsReadiness?.blockers?.length ? clone(record.rightsReadiness.blockers) : [`Rights status is ${status}`] : [], warnings: clone(record.rightsReadiness?.warnings || []) };
}

export function calculateSearchReadiness(record) {
  const metadata = calculateMetadataReadiness(record);
  const status = record.searchReadiness?.status || "Not Created";
  const ready = ["Ready", "Indexed"].includes(status) && metadata.ready;
  return { ready, percentage: status === "Indexed" ? 100 : status === "Ready" ? 90 : status === "Pending" ? 60 : status === "Outdated" ? 45 : 10, blockers: [...metadata.blockers, ...((record.searchReadiness?.missing || []).map((item) => `${item} is missing from search metadata`))], warnings: status === "Outdated" ? ["Search document is stale"] : [] };
}

export function calculateIngestionCompleteness(record) {
  const metadata = calculateMetadataReadiness(record);
  const categories = [
    Boolean(record.metadata?.title && record.metadata?.artist),
    Boolean(record.assets?.some((item) => ["WAV Master", "AIFF Master"].includes(item.assetType))),
    metadata.ready,
    Boolean(record.contributors?.length || record.metadata?.artist),
    Boolean(record.rightsReadiness?.status && record.rightsReadiness.status !== "Rights record not created"),
    ["Approved", "Uploaded", "Revision Requested"].includes(record.artwork?.status),
    Boolean(record.lyrics?.status && record.lyrics.status !== "Not Provided"),
    Boolean(Object.keys(record.deliveryAssets || {}).length),
    Boolean(record.declarations?.authorized),
    Boolean(record.submittedAt || record.status === "Draft"),
  ];
  return { percentage: Math.round((categories.filter(Boolean).length / categories.length) * 100), ready: categories.every(Boolean), blockers: [...metadata.blockers, ...(!record.declarations?.authorized ? ["Submission declarations are incomplete"] : [])], warnings: metadata.warnings };
}

export function calculatePublicationReadiness(record) {
  const technical = calculateTechnicalReadiness(record);
  const metadata = calculateMetadataReadiness(record);
  const rights = calculateRightsReadiness(record);
  const search = calculateSearchReadiness(record);
  const blockers = [...technical.blockers, ...metadata.blockers, ...rights.blockers, ...search.blockers];
  if (!['Approved', 'Not Required'].includes(record.artwork?.status)) blockers.push("Artwork is not approved");
  if (!record.lyrics?.status || ["Not Provided", "Unavailable"].includes(record.lyrics.status)) blockers.push("Lyrics or an instrumental declaration is required");
  if (record.catalogReview?.status !== "Approved") blockers.push("Catalog review is not approved");
  if (record.revisionRequests?.some((item) => item.status === "Open")) blockers.push("An active revision request remains open");
  if (record.status === "Processing Failed") blockers.push("Processing failure blocks publication");
  return { ready: !blockers.length, percentage: Math.round([technical.ready, metadata.ready, rights.ready, search.ready, ["Approved", "Not Required"].includes(record.artwork?.status), record.catalogReview?.status === "Approved"].filter(Boolean).length / 6 * 100), blockers: [...new Set(blockers)], warnings: [...technical.warnings, ...metadata.warnings, ...rights.warnings, ...search.warnings] };
}

export function canTransitionIngestionStatus(current, next, context = {}) {
  if (context.override && context.reason?.trim()) return { allowed: true, override: true };
  if (!(INGESTION_TRANSITIONS[current] || []).includes(next)) return { allowed: false, message: `${current} cannot transition directly to ${next}.` };
  if (["Approved", "Published", "Scheduled"].includes(next) && !context.publicationReadiness?.ready) return { allowed: false, message: "Publication-readiness blockers must be resolved first." };
  return { allowed: true, override: false };
}

function freshDraft(user, source = "Artist Portal") {
  return { id: uid("draft"), reference: null, trackId: null, artistId: user?.organizationId === "org-smyrk" ? "artist-smyrk" : null, trackTitle: "Untitled submission", artistName: user?.organization || "", source, submittedBy: actorName(user), submittedByUserId: user?.id || null, organizationId: user?.organizationId || null, status: "Draft", priority: "Standard", currentStage: "Submission", lastStep: 1, assignedCatalogReviewer: null, assignedRightsReviewer: null, assignedAudioReviewer: null, metadata: { title: "", alternateTitle: "", artist: user?.organization || "", versionName: "Original", releaseStatus: "Unreleased", album: "", releaseDate: "", releaseYear: "", primaryLanguage: "English", explicit: "Undeclared", isrc: "", catalogCode: "", shortDescription: "", primaryGenre: "", secondaryGenres: [], subgenres: [], moods: [], themes: [], tempo: "", bpm: "", key: "", timeSignature: "4/4", energy: "", vocalType: "", instrumentation: "", era: "Modern", productionStyle: "", lyricalThemes: [], intendedUsage: [], similarArtists: [], keywords: [], editorialDescription: "", duration: "" }, assets: [], processingJobs: [], qualityControl: { status: "Not Started", checklist: {} }, catalogReview: { status: "Not Started", checklist: {} }, rightsReadiness: { status: "Draft declaration", blockers: ["Rights declaration incomplete"], rightsRecordId: null }, rightsDeclaration: { controlsMaster: "Undeclared", masterPercentage: "", allWritersIdentified: "Undeclared", writerSharesTotal: "", publishersIdentified: "Undeclared", samplesUsed: "Undeclared", interpolationsUsed: "Undeclared", featuredArtists: "Undeclared", releasesAvailable: "Undeclared", licensingRestrictions: "", territoryRestrictions: "", thirdPartyApproval: "Undeclared", rightsDisputed: "Undeclared", exclusiveAgreements: "Undeclared", splitSheetAvailable: "Undeclared" }, searchReadiness: { status: "Not Created", missing: [] }, artwork: { status: "Not Uploaded" }, lyrics: { status: "Not Provided", text: "", language: "English", explicit: false }, deliveryAssets: {}, contributors: [], declarations: { authorized: false, accurate: false, disclosed: false, reviewAllowed: false, noGuarantee: false, additionalInfo: false, privateUntilApproved: false }, revisionRequests: [], restrictions: [], internalNotes: [], artistMessages: [], activity: [], createdAt: now(), updatedAt: now(), submittedAt: null, approvedAt: null, publishedAt: null, archivedAt: null };
}

export const ingestionService = {
  getState: readIngestionState,
  getById(id) { const state = readIngestionState(); return clone([...state.records, ...state.drafts].find((item) => item.id === id) || null); },
  getByTrack(trackId) { return clone(readIngestionState().records.find((item) => String(item.trackId) === String(trackId)) || null); },
  getIngestionByUser(user) { if (!user) return []; if (internal(user) && user.permissions?.includes("*")) return clone([...readIngestionState().records, ...readIngestionState().drafts]); return clone([...readIngestionState().records, ...readIngestionState().drafts].filter((item) => item.submittedByUserId === user.id || item.organizationId === user.organizationId)); },
  getQueue(filters = {}, user) {
    let records = [...readIngestionState().records, ...readIngestionState().drafts];
    if (!internal(user)) records = records.filter((item) => item.submittedByUserId === user?.id || item.organizationId === user?.organizationId);
    const query = String(filters.query || "").toLowerCase();
    if (query) records = records.filter((item) => `${item.reference || "draft"} ${item.trackTitle} ${item.artistName} ${item.metadata?.isrc || ""} ${item.submittedBy}`.toLowerCase().includes(query));
    ["status", "currentStage", "source", "priority"].forEach((key) => { if (filters[key] && !String(filters[key]).startsWith("All")) records = records.filter((item) => item[key] === filters[key]); });
    if (filters.technical && filters.technical !== "All Technical") records = records.filter((item) => item.qualityControl?.status === filters.technical);
    if (filters.rights && filters.rights !== "All Rights") records = records.filter((item) => item.rightsReadiness?.status === filters.rights);
    return clone(records.sort((a, b) => ({ Critical: 4, Urgent: 3, High: 2, Standard: 1 }[b.priority] || 0) - ({ Critical: 4, Urgent: 3, High: 2, Standard: 1 }[a.priority] || 0)));
  },
  createDraft(user, source = "Artist Portal") { return update((state) => { const duplicate = state.drafts.find((item) => item.submittedByUserId === user?.id && item.status === "Draft"); if (duplicate) { window.localStorage.setItem(ACTIVE_DRAFT_KEY, duplicate.id); return { ok: true, draft: clone(duplicate), resumed: true }; } const draft = freshDraft(user, source); activity(draft, user, "Draft created", "New track submission draft created.", null, "Draft", "Artist Visible"); state.drafts.unshift(draft); window.localStorage.setItem(ACTIVE_DRAFT_KEY, draft.id); return { ok: true, draft: clone(draft), resumed: false }; }); },
  saveStep(id, step, changes, actor) { return update((state) => { const record = [...state.drafts, ...state.records].find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; if (!internal(actor) && record.submittedByUserId !== actor?.id && record.organizationId !== actor?.organizationId) return { ok: false, message: "You cannot edit another artist's submission." }; Object.entries(changes || {}).forEach(([key, value]) => { record[key] = typeof value === "object" && !Array.isArray(value) ? { ...(record[key] || {}), ...clone(value) } : clone(value); }); record.trackTitle = record.metadata?.title || record.trackTitle; record.artistName = record.metadata?.artist || record.artistName; record.lastStep = step; record.updatedAt = now(); activity(record, actor, "Draft saved", `Step ${step} saved automatically.`, null, step, "Artist Visible"); return { ok: true, record: clone(record) }; }); },
  discardDraft(id, actor) { return update((state) => { const before = state.drafts.length; state.drafts = state.drafts.filter((item) => !(item.id === id && (internal(actor) || item.submittedByUserId === actor?.id))); if (window.localStorage.getItem(ACTIVE_DRAFT_KEY) === id) window.localStorage.removeItem(ACTIVE_DRAFT_KEY); return { ok: state.drafts.length < before, message: state.drafts.length < before ? "Draft discarded." : "Draft not found." }; }); },
  validateAssetScenario(scenarioName, existing = []) { const scenario = FILE_SCENARIOS[scenarioName]; if (!scenario) return { valid: false, errors: ["Select a supported demo file scenario."], warnings: [] }; const errors = scenario.validation === "Invalid" ? [scenario.error] : []; if (existing.some((item) => item.fileName === scenario.fileName && item.current)) errors.push("This file has already been uploaded."); if (/[^a-zA-Z0-9._-]/.test(scenario.fileName)) errors.push("Filename contains unsafe characters."); return { valid: !errors.length, errors, warnings: clone(scenario.warnings || []), scenario: clone(scenario) }; },
  uploadMockAsset(id, scenarioName, actor, replaceAssetId = null) { return update((state) => { const record = [...state.drafts, ...state.records].find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; const validation = this.validateAssetScenario(scenarioName, record.assets); if (!validation.valid) return { ok: false, message: validation.errors.join(" "), validation }; const scenario = validation.scenario; let version = 1; const replaced = record.assets.find((item) => item.id === replaceAssetId); if (replaced) { replaced.current = false; replaced.reviewResult = "Superseded"; version = (replaced.version || 1) + 1; }
      const newAsset = { id: uid("asset"), assetType: scenario.assetType, fileName: scenario.fileName, fileType: scenario.extension.toUpperCase(), fileSize: `${scenario.sizeMb} MB`, sizeMb: scenario.sizeMb, duration: scenario.duration || null, sampleRate: scenario.sampleRate ? `${scenario.sampleRate / 1000} kHz` : null, bitDepth: scenario.bitDepth ? `${scenario.bitDepth}-bit` : null, channels: scenario.channels === 1 ? "Mono" : scenario.channels === 2 ? "Stereo" : null, uploadStatus: "Uploaded", uploadProgress: 100, processingStatus: scenario.validation === "Warning" ? "Completed with Warning" : "Queued", qualityStatus: scenario.validation === "Warning" ? "Warning" : "Under Review", warnings: validation.warnings, storageReference: `mock://private/${uid("file")}`, version, checksum: uid("checksum"), current: true, uploadedAt: now(), uploadedBy: actorName(actor), replacedReason: replaced ? "Replacement uploaded" : null, versions: [] };
      record.assets.push(newAsset); record.status = record.status === "Draft" ? "Upload In Progress" : record.status; record.currentStage = "File Upload"; record.updatedAt = now(); activity(record, actor, replaced ? "File replaced" : "File uploaded", `${newAsset.assetType} ${newAsset.fileName} version ${version} uploaded.`, replaced?.fileName || null, newAsset.fileName, "Artist Visible"); return { ok: true, asset: clone(newAsset), warnings: validation.warnings }; }); },
  removeAsset(id, assetId, actor) { return update((state) => { const record = [...state.drafts, ...state.records].find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; const assetItem = record.assets.find((item) => item.id === assetId); if (!assetItem) return { ok: false, message: "Asset not found." }; assetItem.current = false; assetItem.reviewResult = "Removed from current package"; activity(record, actor, "File removed", `${assetItem.fileName} removed from the current package.`, assetItem.fileName, null, "Artist Visible"); return { ok: true }; }); },
  addContributor(id, contributor, actor) { return update((state) => { const record = [...state.drafts, ...state.records].find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; if (!String(contributor.name || "").trim() || !contributor.role) return { ok: false, message: "Contributor name and role are required." }; const item = { id: uid("contributor"), ...clone(contributor) }; record.contributors.push(item); activity(record, actor, "Contributor added", `${item.name} added as ${item.role}.`, null, item); return { ok: true, contributor: clone(item) }; }); },
  updateRightsDeclaration(id, declaration, actor) { return update((state) => { const record = [...state.drafts, ...state.records].find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; record.rightsDeclaration = { ...(record.rightsDeclaration || {}), ...clone(declaration) }; const blockers = []; if (Number(record.rightsDeclaration.masterPercentage || 0) < 100) blockers.push("Claimed master ownership is below 100%"); if (Number(record.rightsDeclaration.writerSharesTotal || 0) < 100) blockers.push("Writer shares are incomplete"); if (record.rightsDeclaration.samplesUsed === "Yes") blockers.push("Samples require rights review"); if (record.rightsDeclaration.rightsDisputed === "Yes") blockers.push("An active rights dispute blocks publication"); if (record.rightsDeclaration.splitSheetAvailable !== "Yes") blockers.push("Split sheet is missing"); record.rightsReadiness = { ...record.rightsReadiness, status: "Draft declaration", blockers }; activity(record, actor, "Rights declaration updated", "Submission-level rights declarations updated; no rights were verified.", null, blockers, "Artist Visible"); return { ok: true, blockers }; }); },
  submitIngestion(id, actor) { return update((state) => { const draftIndex = state.drafts.findIndex((item) => item.id === id); const record = draftIndex >= 0 ? state.drafts[draftIndex] : state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Draft not found." }; const completeness = calculateIngestionCompleteness(record); const master = record.assets.some((item) => item.current && ["WAV Master", "AIFF Master"].includes(item.assetType)); const declarationComplete = Object.values(record.declarations || {}).every(Boolean) && Object.keys(record.declarations || {}).length >= 7; if (!master || !declarationComplete) return { ok: false, message: !master ? "A valid WAV or AIFF master is required before submission." : "All submission declarations must be accepted.", blockers: completeness.blockers };
      if (!record.reference) record.reference = `BM-ING-2026-${String(18 + state.records.length + state.drafts.length).padStart(4, "0")}`; record.status = calculateMetadataReadiness(record).ready ? "Files Uploaded" : "Metadata Incomplete"; record.currentStage = record.status === "Files Uploaded" ? "File Processing" : "Metadata"; record.submittedAt = now(); record.updatedAt = now(); record.processingJobs = ["Malware scan simulation", "Audio validation", "Metadata extraction", "Waveform generation", "Preview conversion", "Watermark preparation", "Loudness analysis", "Artwork optimization", "Stems validation", "Search-document preparation"].map((jobType, index) => ({ id: uid("job"), ingestionId: record.id, assetId: record.assets[0]?.id || null, jobType, status: "Queued", progress: 0, startedAt: null, completedAt: null, failureCode: null, failureMessage: null, retryCount: 0, result: null })); activity(record, actor, "Track submitted", `${record.reference} submitted for human review.`, "Draft", record.status, "Artist Visible"); notify(state, record, actor?.id, "ingestion.submitted", "Submission received", `${record.trackTitle} has entered the beatmondo review workflow.`, "artist-submission-detail"); notify(state, record, "user-preston", "ingestion.new", "New track submission", `${record.reference} requires ingestion review.`, "admin-ingestion-detail"); if (draftIndex >= 0) { state.drafts.splice(draftIndex, 1); state.records.unshift(record); } window.localStorage.removeItem(ACTIVE_DRAFT_KEY); return { ok: true, record: clone(record), reference: record.reference }; }); },
  runProcessingJob(id, jobId, actor, outcome = "complete") { return update((state) => { const record = state.records.find((item) => item.id === id); const job = record?.processingJobs.find((item) => item.id === jobId); if (!record || !job) return { ok: false, message: "Processing job not found." }; const before = job.status; if (outcome === "fail") { job.status = "Failed"; job.progress = 34; job.failureCode = "DEMO_PROCESSING_FAILURE"; job.failureMessage = "Simulated processing failure — no real scan or analysis was performed."; record.status = "Processing Failed"; } else { job.status = "Completed"; job.progress = 100; job.completedAt = now(); job.result = job.jobType === "Waveform generation" ? { label: "Fixed-value prototype waveform", peaks: [18, 42, 28, 64, 46, 78, 55, 36, 72, 48, 31, 60, 44, 26, 52] } : "Demo processing completed"; }
      activity(record, actor, job.status === "Failed" ? "Processing failed" : "Processing completed", `${job.jobType}: ${job.status}.`, before, job.status); return { ok: true, job: clone(job) }; }); },
  completeAllJobs(id, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; record.processingJobs.forEach((job) => { job.status = "Completed"; job.progress = 100; job.completedAt = now(); job.failureCode = null; job.failureMessage = null; job.result = job.jobType === "Waveform generation" ? { label: "Fixed-value prototype waveform", peaks: [18,42,28,64,46,78,55,36,72,48,31,60] } : "Demo processing completed"; }); if (["Files Processing", "Processing Failed", "Resubmitted"].includes(record.status)) { record.status = "Technical Review"; record.currentStage = "Technical Review"; } activity(record, actor, "Processing completed", "All demo processing jobs completed."); return { ok: true, record: clone(record) }; }); },
  retryProcessingJob(id, jobId, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); const job = record?.processingJobs.find((item) => item.id === jobId); if (!job) return { ok: false, message: "Failed job not found." }; job.status = "Retrying"; job.progress = 0; job.retryCount += 1; job.failureCode = null; job.failureMessage = null; record.status = "Files Processing"; activity(record, actor, "Processing retried", `${job.jobType} retry ${job.retryCount} queued.`); return { ok: true }; }); },
  assignReviewers(id, assignments, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; const before = { catalog: record.assignedCatalogReviewer, rights: record.assignedRightsReviewer, audio: record.assignedAudioReviewer, priority: record.priority }; Object.assign(record, clone(assignments)); activity(record, actor, "Reviewer assigned", "Reviewer assignments and priority updated.", before, assignments); return { ok: true, record: clone(record) }; }); },
  completeTechnicalReview(id, status, checklist, reason, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; if (status === "Passed with Warnings" && !reason?.trim()) return { ok: false, message: "A warning-approval reason is required." }; record.qualityControl = { ...record.qualityControl, status, checklist: clone(checklist), reason, completedAt: now(), completedBy: actorName(actor) }; record.status = status === "Failed" ? "Processing Failed" : "Catalog Review"; record.currentStage = status === "Failed" ? "File Processing" : "Creative Review"; activity(record, actor, "Technical review completed", `Technical review: ${status}.`, null, status); return { ok: true, record: clone(record) }; }); },
  completeCatalogReview(id, decision, checklist, reason, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; record.catalogReview = { ...record.catalogReview, status: decision === "Approve" || decision === "Approve with Metadata Changes" ? "Approved" : decision, decision, checklist: clone(checklist), reason, completedAt: now(), completedBy: actorName(actor) }; if (decision === "Request Revision") { record.status = "Revision Requested"; record.currentStage = "Submission"; } else if (decision === "Reject") { record.status = "Rejected"; record.currentStage = "Final Approval"; } else { record.status = "Rights Review"; record.currentStage = "Rights Review"; } activity(record, actor, "Catalog review completed", `Catalog decision: ${decision}.`, null, decision); return { ok: true, record: clone(record) }; }); },
  requestRevision(id, request, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; if (!request.title?.trim() || !request.artistMessage?.trim()) return { ok: false, message: "Revision title and artist-visible message are required." }; const item = { id: uid("revision"), status: "Open", createdAt: now(), ...clone(request) }; record.revisionRequests.unshift(item); record.status = "Revision Requested"; record.currentStage = "Submission"; activity(record, actor, "Revision requested", item.artistMessage, null, item, "Artist Visible"); notify(state, record, record.submittedByUserId, "ingestion.revision", "Revision requested", item.artistMessage, "artist-submission-detail"); return { ok: true, revision: clone(item) }; }); },
  submitRevision(id, response, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; const open = record.revisionRequests.filter((item) => item.status === "Open"); if (!open.length) return { ok: false, message: "No open revision request was found." }; open.forEach((item) => { item.status = "Responded"; item.response = response; item.respondedAt = now(); }); record.status = "Resubmitted"; record.currentStage = "File Processing"; record.processingJobs.filter((job) => ["Audio validation", "Artwork optimization", "Stems validation", "Search-document preparation"].includes(job.jobType)).forEach((job) => { job.status = "Queued"; job.progress = 0; }); activity(record, actor, "Submission resubmitted", response || "Revision response submitted.", "Revision Requested", "Resubmitted", "Artist Visible"); notify(state, record, record.assignedCatalogReviewer || "user-preston", "ingestion.resubmitted", "Revision response received", `${record.reference} was resubmitted.`, "admin-ingestion-detail"); return { ok: true, record: clone(record) }; }); },
  approveIngestion(id, restrictions, reason, actor, override = false) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; const readiness = calculatePublicationReadiness(record); const transition = canTransitionIngestionStatus(record.status, "Approved", { publicationReadiness: readiness, override, reason }); if (!transition.allowed) return { ok: false, message: transition.message, blockers: readiness.blockers }; if (override && !reason?.trim()) return { ok: false, message: "An override reason is required." }; record.status = "Approved"; record.currentStage = "Final Approval"; record.restrictions = clone(restrictions || []); record.approvedAt = now(); record.approvedBy = actorName(actor); activity(record, actor, override ? "Override used" : "Track approved", restrictions?.length ? `Approved with restrictions: ${restrictions.join(", ")}.` : "Approved for publication preparation.", null, restrictions || [], "Artist Visible"); notify(state, record, record.submittedByUserId, "ingestion.approved", "Submission approved", `${record.trackTitle} has been approved for publication preparation.`, "artist-submission-detail"); return { ok: true, record: clone(record), override: transition.override }; }); },
  rejectIngestion(id, reasons, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; if (!reasons?.artistReason?.trim() || !reasons?.internalRationale?.trim()) return { ok: false, message: "Artist-facing and internal rejection reasons are required." }; record.status = "Rejected"; record.currentStage = "Final Approval"; record.rejection = { ...clone(reasons), rejectedAt: now(), rejectedBy: actorName(actor) }; record.searchReadiness.status = "Hidden"; searchService.updateIndexStatus(record.trackId, "Hidden"); activity(record, actor, "Submission rejected", reasons.artistReason, null, reasons, "Artist Visible"); notify(state, record, record.submittedByUserId, "ingestion.rejected", "Submission decision", reasons.artistReason, "artist-submission-detail"); return { ok: true }; }); },
  withdraw(id, reason, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record || !["Draft", "Revision Requested", "Metadata Incomplete", "Rights Information Required"].includes(record.status)) return { ok: false, message: "This submission cannot be withdrawn from its current state." }; record.status = "Withdrawn"; record.currentStage = "Submission"; record.processingJobs.forEach((job) => { if (["Queued", "Processing", "Retrying"].includes(job.status)) job.status = "Cancelled"; }); activity(record, actor, "Submission withdrawn", reason || "Withdrawn by submitter.", null, "Withdrawn", "Artist Visible"); return { ok: true }; }); },
  schedulePublication(id, schedule, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record || record.status !== "Approved") return { ok: false, message: "Only approved tracks can be scheduled." }; if (!schedule.date || !schedule.time) return { ok: false, message: "Publication date and time are required." }; record.status = "Scheduled"; record.currentStage = "Publication"; record.publicationSchedule = { ...clone(schedule), scheduledBy: actorName(actor), createdAt: now() }; activity(record, actor, "Publication scheduled", `${schedule.date} ${schedule.time} ${schedule.timeZone || "UTC"}.`, null, schedule, "Artist Visible"); notify(state, record, record.submittedByUserId, "ingestion.scheduled", "Publication scheduled", `${record.trackTitle} is scheduled for ${schedule.date}.`, "artist-submission-detail"); return { ok: true }; }); },
  publishTrack(id, actor, overrideReason = "") { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; const readiness = calculatePublicationReadiness(record); const permitted = ["Approved", "Scheduled", "Unpublished"].includes(record.status); if ((!permitted || !readiness.ready) && !overrideReason.trim()) return { ok: false, message: !permitted ? "Track is not approved for publication." : "Publication blockers remain.", blockers: readiness.blockers }; record.status = "Published"; record.currentStage = "Publication"; record.publishedAt = now(); record.searchReadiness.status = "Indexed"; if (record.trackId) searchService.syncTrackToSearchIndex(record.trackId); activity(record, actor, overrideReason ? "Override used" : "Track published", overrideReason || "Published and synchronized to the search index.", null, "Published", "Artist Visible"); notify(state, record, record.submittedByUserId, "ingestion.published", "Track published", `${record.trackTitle} is now published subject to rights and access restrictions.`, "artist-submission-detail"); return { ok: true, record: clone(record) }; }); },
  unpublishTrack(id, details, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record || record.status !== "Published") return { ok: false, message: "Only a published track can be unpublished." }; if (!details?.reason?.trim()) return { ok: false, message: "An unpublish reason is required." }; record.status = "Unpublished"; record.searchReadiness.status = details.searchBehavior || "Hidden"; record.unpublishDetails = { ...clone(details), unpublishedAt: now(), existingLicencesPreserved: true }; if (record.trackId) searchService.updateIndexStatus(record.trackId, "Hidden"); activity(record, actor, "Track unpublished", `${details.reason} Existing licences remain preserved.`, "Published", "Unpublished"); return { ok: true }; }); },
  archiveTrack(id, reason, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record || !["Unpublished", "Rejected", "Withdrawn", "Processing Failed"].includes(record.status)) return { ok: false, message: "Unpublish, reject, withdraw, or resolve failure before archiving." }; record.status = "Archived"; record.currentStage = "Publication"; record.archivedAt = now(); record.archiveReason = reason || "Other"; record.searchReadiness.status = "Hidden"; if (record.trackId) searchService.updateIndexStatus(record.trackId, "Hidden"); activity(record, actor, "Track archived", `${record.archiveReason}; rights, licences, ingestion, and asset history preserved.`); return { ok: true }; }); },
  requestRightsReview(id, actor) { return update((state) => { const record = state.records.find((item) => item.id === id); if (!record) return { ok: false, message: "Ingestion record not found." }; record.status = "Rights Review"; record.currentStage = "Rights Review"; record.rightsReadiness.status = "Under review"; if (record.rightsReadiness.rightsRecordId) rightsService.triggerReverification(record.rightsReadiness.rightsRecordId, actor, `Requested from ${record.reference}`); activity(record, actor, "Rights review requested", "Linked rights record routed for human review."); notify(state, record, "user-preston", "ingestion.rights_review", "Rights review requested", `${record.reference} requires rights review.`, "admin-ingestion-detail"); return { ok: true }; }); },
  getAnalytics() { const records = readIngestionState().records; const count = (status) => records.filter((item) => item.status === status).length; return { total: records.length, drafts: readIngestionState().drafts.length, newSubmissions: records.filter((item) => item.submittedAt && new Date(item.submittedAt) > new Date("2026-07-01")).length, processing: count("Files Processing"), failures: count("Processing Failed"), metadataIncomplete: count("Metadata Incomplete"), technical: count("Technical Review"), catalog: count("Catalog Review"), rights: records.filter((item) => ["Rights Review", "Rights Information Required"].includes(item.status)).length, revisions: count("Revision Requested"), awaiting: count("Awaiting Approval"), published: count("Published"), rejected: count("Rejected"), publishedRate: Math.round(count("Published") / records.length * 100), rejectionRate: Math.round(count("Rejected") / records.length * 100), averageCompleteness: Math.round(records.reduce((sum, item) => sum + calculateIngestionCompleteness(item).percentage, 0) / records.length), averageDays: 18, oldest: records.slice().sort((a,b) => a.updatedAt.localeCompare(b.updatedAt))[0]?.reference }; },
  getNotifications(user) { return clone(readIngestionState().notifications.filter((item) => internal(user) || item.userId === user?.id)); },
  resetTrackIngestionDemoData() { const state = clone(DEFAULT_INGESTION_STATE); writeState(state); window.localStorage.removeItem(ACTIVE_DRAFT_KEY); return clone(state); },
  calculateReadiness(record) { return { completeness: calculateIngestionCompleteness(record), metadata: calculateMetadataReadiness(record), technical: calculateTechnicalReadiness(record), rights: calculateRightsReadiness(record), search: calculateSearchReadiness(record), publication: calculatePublicationReadiness(record) }; },
};

function protectIngestionAction(method, permission, actorIndex) {
  const original = ingestionService[method].bind(ingestionService);
  ingestionService[method] = (...args) =>
    can(args[actorIndex], permission)
      ? original(...args)
      : { ok: false, message: `${permission} permission is required.` };
}

[
  ["uploadMockAsset", "ingestion.upload_assets", 2],
  ["removeAsset", "ingestion.replace_assets", 2],
  ["runProcessingJob", "ingestion.manage_jobs", 2],
  ["completeAllJobs", "ingestion.manage_jobs", 1],
  ["retryProcessingJob", "ingestion.manage_jobs", 2],
  ["assignReviewers", "ingestion.assign_reviewers", 2],
  ["completeTechnicalReview", "ingestion.review_technical", 4],
  ["completeCatalogReview", "ingestion.review_catalog", 4],
  ["requestRevision", "ingestion.request_revision", 2],
  ["approveIngestion", "ingestion.approve", 4],
  ["rejectIngestion", "ingestion.reject", 2],
  ["schedulePublication", "ingestion.publish", 2],
  ["publishTrack", "ingestion.publish", 1],
  ["unpublishTrack", "ingestion.unpublish", 2],
  ["archiveTrack", "ingestion.archive", 2],
].forEach((args) => protectIngestionAction(...args));

export const assetUploadService = { validateAsset: (...args) => ingestionService.validateAssetScenario(...args), uploadMockAsset: (...args) => ingestionService.uploadMockAsset(...args), replaceAsset: (...args) => ingestionService.uploadMockAsset(...args) };
export const processingJobService = { runProcessingJob: (...args) => ingestionService.runProcessingJob(...args), retryProcessingJob: (...args) => ingestionService.retryProcessingJob(...args) };
export const technicalReviewService = { calculateTechnicalReadiness, completeTechnicalReview: (...args) => ingestionService.completeTechnicalReview(...args) };
export const publicationService = { calculatePublicationReadiness, publishTrack: (...args) => ingestionService.publishTrack(...args), unpublishTrack: (...args) => ingestionService.unpublishTrack(...args) };
