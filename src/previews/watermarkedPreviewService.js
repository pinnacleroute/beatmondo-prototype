import { authService } from "../auth/authService.js";
import { buyerVerificationService } from "../verification/buyerVerificationService.js";
import { calculateEffectiveAccess, membershipService } from "../membership/membershipService.js";
import { rightsService } from "../rights/rightsService.js";
import { STORAGE_KEY } from "../storage/storageData.js";
import {
  createJobsForPreview,
  DEFAULT_WATERMARK_STATE,
  PREVIEW_STATUSES,
  WATERMARK_STORAGE_KEY,
} from "./watermarkedPreviewData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const has = (user, permission) => Boolean(user?.permissions?.includes("*") || user?.permissions?.includes(permission));
const internal = (user) => user?.userType === "internal" || user?.permissions?.includes("*");
const playableStatuses = new Set(["Ready", "Ready with Warning"]);

function readState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WATERMARK_STORAGE_KEY));
    if (parsed?.version && Array.isArray(parsed.previews) && Array.isArray(parsed.policies)) {
      const mergeById = (current, defaults) => [...current, ...defaults.filter((fallback) => !current.some((item) => item.id === fallback.id))];
      const normalized = {
        ...clone(DEFAULT_WATERMARK_STATE),
        ...parsed,
        policies: mergeById(parsed.policies, DEFAULT_WATERMARK_STATE.policies),
        voiceProfiles: mergeById(parsed.voiceProfiles || [], DEFAULT_WATERMARK_STATE.voiceProfiles),
        previews: mergeById(parsed.previews, DEFAULT_WATERMARK_STATE.previews),
        jobs: mergeById(parsed.jobs || [], DEFAULT_WATERMARK_STATE.jobs),
      };
      window.localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch {}
  const state = clone(DEFAULT_WATERMARK_STATE);
  window.localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify(state));
  syncReadyPreviewsToStorage(state);
  return state;
}

function writeState(state) {
  try {
    window.localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function update(mutator) {
  const state = readState();
  const result = mutator(state);
  if (!writeState(state)) return { ok: false, message: "The preview change could not be persisted." };
  return result;
}

function addActivity(state, preview, user, action, description, reason = "") {
  state.activity.unshift({ id: uid("preview-activity"), previewId: preview?.id || null, trackId: preview?.trackId || null, track: preview?.trackTitle || "", policyId: preview?.policyId || null, actor: user?.name || "System", actorId: user?.id || null, action, description, reason, before: null, after: preview?.status || null, timestamp: now(), visibility: "Internal", source: "Watermarked Previews" });
}

function addEvent(state, preview, user, eventType, details = {}) {
  state.analyticsEvents.unshift({ id: uid("wm-event"), eventType, userId: user?.id || null, anonymousSessionId: user ? null : details.anonymousSessionId || uid("anonymous"), organizationId: user?.organizationId || null, trackId: preview?.trackId || details.trackId || null, previewId: preview?.id || null, policyId: preview?.policyId || null, watermarkType: preview?.watermarkType || null, timestamp: now(), playbackPosition: details.playbackPosition || 0, sourcePage: details.sourcePage || "Unknown", accessTier: details.accessTier || getAccessTier(user), result: details.result || "Recorded", reasonCode: details.reasonCode || null });
}

function notify(state, userId, type, title, body, action = "notifications") {
  state.notifications.unshift({ id: uid("preview-notification"), userId, type, title, body, action, createdAt: now(), read: false });
  if (userId) authService.addDemoMessage(userId, type, title, body, action);
}

function getAccessTier(user) {
  if (internal(user)) return "Internal";
  if (!user) return "Public";
  if (user.userType !== "buyer") return user.role === "artist" ? "Artist" : "Discovery";
  const verification = buyerVerificationService.getByUser(user.id);
  const membership = membershipService.getCurrentMembership(user.id);
  const access = calculateEffectiveAccess(user, verification, membership);
  if (access.effectivePlan?.includes("VIP")) return "VIP";
  if (access.effectivePlan?.includes("Professional")) return "Professional";
  return "Discovery";
}

function getIngestionRecord(trackId) {
  try {
    const state = JSON.parse(window.localStorage.getItem("beatmondo-track-ingestion-v1"));
    return state?.records?.find((item) => String(item.trackId) === String(trackId)) || null;
  } catch {
    return null;
  }
}

function syncPreviewStatusToIngestion(preview, status, note) {
  try {
    const key = "beatmondo-track-ingestion-v1";
    const ingestion = JSON.parse(window.localStorage.getItem(key));
    const record = ingestion?.records?.find((item) => String(item.trackId) === String(preview.trackId));
    if (!record) return;
    record.previewGeneration = { previewId: preview.id, outputAssetId: preview.outputAssetId, sourceAssetId: preview.sourceAssetId, sourceVersion: preview.sourceAssetVersion, status, updatedAt: now(), note };
    record.updatedAt = now();
    window.localStorage.setItem(key, JSON.stringify(ingestion));
  } catch {}
}

function syncReadyPreviewsToStorage(watermarkState) {
  let storage;
  try {
    storage = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return;
  }
  if (!storage?.assets) return;
  let changed = false;
  for (const preview of watermarkState.previews) {
    if (!playableStatuses.has(preview.status) || !preview.current) continue;
    const existing = storage.assets.find((asset) => asset.id === preview.outputAssetId);
    const policy = watermarkState.policies.find((item) => item.id === preview.policyId);
    const assetData = {
      id: preview.outputAssetId,
      ownerType: "Track",
      ownerId: `track-${preview.trackId}`,
      relatedTrackId: preview.trackId,
      relatedArtistId: preview.trackId === 15 ? "artist-smyrk" : null,
      storageClass: "PROTECTED_PREVIEW",
      assetType: preview.variantType,
      fileName: `${preview.trackTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${preview.accessTier.toLowerCase()}-preview_v${preview.version}.${preview.outputFormat.toLowerCase()}`,
      displayName: preview.variantType,
      fileExtension: preview.outputFormat.toLowerCase(),
      mimeType: preview.outputFormat === "MP3" ? "audio/mpeg" : "audio/mp4",
      sizeBytes: Math.round(preview.previewDurationSeconds * (parseInt(preview.outputBitrate, 10) || 128) * 125),
      durationSeconds: preview.previewDurationSeconds,
      checksum: `demo-watermark-${preview.id}-v${preview.version}`,
      version: preview.version,
      status: preview.status,
      visibility: preview.organizationId ? "Organization Restricted" : "Protected",
      confidentiality: preview.organizationId ? "Private Buyer" : "Standard",
      storageReference: `storage://protected-preview/${preview.outputAssetId}`,
      sourceAssetId: preview.sourceAssetId,
      derivedFromAssetId: preview.sourceAssetId,
      uploadedBy: preview.generatedBy,
      uploadedAt: preview.generatedAt,
      processedAt: preview.generatedAt,
      expiresAt: preview.expiresAt,
      archivedAt: null,
      environment: "Prototype",
      lastAccessedAt: existing?.lastAccessedAt || null,
      usageCount: existing?.usageCount || 0,
      current: preview.current,
      metadata: { trackTitle: preview.trackTitle, artistName: preview.artistName, trackPublished: true, watermark: true, watermarkedPreviewId: preview.id, watermarkType: preview.watermarkType, previewVariant: preview.variantType, protectedEditorialPreview: Boolean(preview.metadata?.protectedEditorialPreview), integrityStatus: "Verified" },
      accessPolicy: { requiresAuthentication: policy?.authenticationRequired || false, requiredPermissions: [], requiredEntitlements: [], streamAllowed: true, downloadAllowed: false, organizationRestrictions: preview.organizationId ? [preview.organizationId] : [] },
      processingInfo: { status: "Completed", warnings: preview.status === "Ready with Warning" ? preview.notes : [], failure: null },
      versions: [], notes: ["Watermarking and forensic identification are simulated in this frontend prototype."],
    };
    if (existing) Object.assign(existing, assetData);
    else storage.assets.unshift(assetData);
    changed = true;
  }
  if (changed) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

export function validateWatermarkPhrase(value = "") {
  const phrase = value.trim();
  if (!phrase) return { valid: false, message: "A spoken phrase is required for this watermark type." };
  if (phrase.length > 80) return { valid: false, message: "Keep the spoken phrase under 80 characters." };
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(phrase)) return { valid: false, message: "Personal email addresses cannot be spoken in previews." };
  if (/\+?\d[\d\s().-]{7,}\d/.test(phrase)) return { valid: false, message: "Phone numbers cannot be spoken in previews." };
  if (/password|credit card|social security|passport/i.test(phrase)) return { valid: false, message: "Sensitive personal information is not allowed." };
  return { valid: true, message: "Safe phrase." };
}

export function validatePreviewConfiguration(config) {
  const errors = [];
  if (!config.trackId) errors.push("Select a track.");
  if (!config.sourceAssetId) errors.push("Select an approved source asset.");
  if (!config.audience) errors.push("Select a preview audience.");
  if (!config.policyId) errors.push("Select a preview policy.");
  const start = Number(config.previewStartSeconds);
  const end = Number(config.previewEndSeconds);
  const duration = Number(config.sourceDurationSeconds || 180);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) errors.push("Preview end must be after the start.");
  if (start < 0 || end > duration) errors.push("Preview range must remain inside the approved source duration.");
  for (const position of config.watermarkPositions || []) if (position < start || position > end) errors.push(`Watermark position ${position}s is outside the selected range.`);
  if (!["NONE", "TONAL_INTRO", "TONAL_PERIODIC", "SESSION_SPECIFIC_SIMULATION"].includes(config.watermarkType)) {
    const validation = validateWatermarkPhrase(config.watermarkPhrase);
    if (!validation.valid) errors.push(validation.message);
  }
  if (!config.outputFormat || !["MP3", "AAC", "M4A"].includes(config.outputFormat)) errors.push("Select MP3, AAC, or M4A output.");
  if (config.storageClass && config.storageClass !== "PROTECTED_PREVIEW") errors.push("Preview output must use PROTECTED_PREVIEW storage.");
  if (config.organizationId && !config.watermarkPhrase?.includes("Prepared for")) errors.push("Buyer-specific previews require a safe organization phrase.");
  return { valid: errors.length === 0, errors };
}

export function resolvePreviewPolicy(track, user, collectionContext = null) {
  const state = readState();
  const rights = rightsService.getByTrack(track?.id || track);
  if (["Disputed", "Restricted"].includes(rights?.status)) return { policy: clone(state.policies.find((item) => item.id === "policy-restricted")), source: "Rights restriction", tier: getAccessTier(user) };
  if (collectionContext?.id === "collection-northstar-private" && user?.organizationId === "org-northstar") return { policy: clone(state.policies.find((item) => item.id === "policy-northstar")), source: "Collection-specific policy", tier: getAccessTier(user) };
  if (user?.organizationId === "org-northstar" && state.previews.some((item) => item.trackId === (track?.id || track) && item.organizationId === "org-northstar" && item.current)) return { policy: clone(state.policies.find((item) => item.id === "policy-northstar")), source: "Buyer-specific policy", tier: getAccessTier(user) };
  if (internal(user)) return { policy: clone(state.policies.find((item) => item.id === "policy-internal")), source: "Internal access policy", tier: "Internal" };
  const tier = getAccessTier(user);
  const id = tier === "VIP" ? "policy-vip" : tier === "Professional" ? "policy-professional" : "policy-public";
  return { policy: clone(state.policies.find((item) => item.id === id)), source: `${tier} access-tier policy`, tier };
}

export function checkPreviewAccess(preview, user, context = {}) {
  const deny = (reasonCode, message, additionalApproval = false) => ({ allowed: false, reasonCode, message, requiresAdditionalApproval: additionalApproval });
  if (!preview) return deny("PREVIEW_NOT_GENERATED", "A protected preview has not been generated for this track.");
  if (preview.status === "Generating" || preview.status === "Queued") return deny("PREVIEW_GENERATING", "This protected preview is still being prepared.");
  if (preview.status === "Failed") return deny("PREVIEW_FAILED", "This preview could not be prepared. The beatmondo team has been notified.");
  if (preview.status === "Expired" || (preview.expiresAt && new Date(preview.expiresAt) <= new Date())) return deny("PREVIEW_EXPIRED", "This preview access has expired. Request renewed access.", true);
  if (preview.status === "Revoked") return deny("PREVIEW_REVOKED", "This preview is no longer available.");
  if (!playableStatuses.has(preview.status)) return deny("PREVIEW_NOT_GENERATED", "This preview is not approved for playback.");
  if (user?.accountStatus && user.accountStatus !== "active") return deny("PREVIEW_PERMISSION_DENIED", "Preview access is unavailable for this account.", true);
  const ingestion = getIngestionRecord(preview.trackId);
  if (ingestion && ingestion.status !== "Published" && !preview.metadata?.protectedEditorialPreview) return deny("PREVIEW_TRACK_UNPUBLISHED", "This track is not published for preview access.");
  const rights = rightsService.getByTrack(preview.trackId);
  if (["Disputed", "Restricted"].includes(rights?.status) && !preview.metadata?.protectedEditorialPreview) return deny("PREVIEW_RIGHTS_RESTRICTED", "Preview access is temporarily unavailable while rights information is under review.", true);
  if (preview.organizationId && preview.organizationId !== user?.organizationId) return deny("PREVIEW_ORGANIZATION_RESTRICTED", "This private preview belongs to another organization.");
  if (preview.buyerId && preview.buyerId !== user?.id) return deny("PREVIEW_PERMISSION_DENIED", "This private preview is assigned to another approved buyer.");
  if (preview.accessTier === "Internal" && !internal(user)) return deny("PREVIEW_PERMISSION_DENIED", "This preview is limited to internal review.");
  const tier = getAccessTier(user);
  if (["Professional", "VIP"].includes(preview.accessTier)) {
    if (!user) return deny("PREVIEW_ACCESS_TIER_REQUIRED", `Sign in with an approved ${preview.accessTier} buyer account.`, true);
    const verification = buyerVerificationService.getByUser(user.id);
    if (!["Approved", "Approved with Restrictions", "Reinstated"].includes(verification?.status)) return deny("PREVIEW_BUYER_VERIFICATION_REQUIRED", "Approved buyer verification is required for this preview.", true);
    const rank = { Public: 0, Discovery: 1, Professional: 2, VIP: 3, Internal: 4 };
    if ((rank[tier] || 0) < rank[preview.accessTier]) return deny("PREVIEW_MEMBERSHIP_REQUIRED", `${preview.accessTier} preview access is not included in the current verified membership.`, true);
  }
  const state = readState();
  const policy = state.policies.find((item) => item.id === preview.policyId);
  if (policy?.authenticationRequired && !user) return deny("PREVIEW_PERMISSION_DENIED", "Sign in to access this protected preview.");
  const activeSessions = state.sessions.filter((item) => item.previewId === preview.id && ["Active", "Paused"].includes(item.status));
  if (policy?.maxActiveSessions && activeSessions.length >= policy.maxActiveSessions) return deny("PREVIEW_SESSION_LIMIT_REACHED", "The active preview-session limit has been reached. Request new access.", true);
  if (context.device && policy?.maxDevices && new Set(activeSessions.map((item) => item.device)).size >= policy.maxDevices && !activeSessions.some((item) => item.device === context.device)) return deny("PREVIEW_SESSION_LIMIT_REACHED", "The approved device limit has been reached.", true);
  return { allowed: true, reasonCode: "PREVIEW_READY", message: "Protected preview ready.", restrictions: preview.restrictions };
}

function previewPriority(preview, user, collectionContext) {
  if (preview.organizationId && preview.organizationId === user?.organizationId) return 100;
  if (preview.collectionId && preview.collectionId === collectionContext?.id) return 95;
  if (preview.accessTier === "Internal" && internal(user)) return 90;
  const tier = getAccessTier(user);
  if (preview.accessTier === "VIP" && tier === "VIP") return 80;
  if (preview.accessTier === "Professional" && ["Professional", "VIP"].includes(tier)) return 70;
  if (preview.accessTier === "Discovery" && user) return 60;
  if (preview.accessTier === "Public") return 50;
  return 0;
}

export const watermarkedPreviewService = {
  getState: readState,
  getPolicies() { return clone(readState().policies); },
  getPolicy(id) { return clone(readState().policies.find((item) => item.id === id) || null); },
  getPreviews(filters = {}, user = null) {
    let previews = readState().previews;
    if (user?.role === "artist") previews = previews.filter((item) => item.artistName === user.organization && !item.organizationId);
    if (user?.userType === "buyer") previews = previews.filter((item) => !item.organizationId || item.organizationId === user.organizationId);
    const query = String(filters.query || "").toLowerCase();
    if (query) previews = previews.filter((item) => `${item.id} ${item.trackTitle} ${item.artistName} ${item.variantType} ${item.policyId} ${item.organizationId || ""}`.toLowerCase().includes(query));
    for (const key of ["status", "watermarkType", "accessTier"]) if (filters[key] && !String(filters[key]).startsWith("All")) previews = previews.filter((item) => item[key] === filters[key]);
    if (filters.expiring) previews = previews.filter((item) => item.expiresAt);
    if (filters.buyerSpecific) previews = previews.filter((item) => item.organizationId || item.buyerId);
    if (filters.current === "Current") previews = previews.filter((item) => item.current);
    if (filters.current === "Superseded") previews = previews.filter((item) => !item.current || item.status === "Superseded");
    return clone(previews);
  },
  getPreview(id) { return clone(readState().previews.find((item) => item.id === id) || null); },
  configurePreview(previewId, changes, user) {
    if (!has(user, "previews.configure")) return { ok: false, message: "Preview-configuration permission is required." };
    const validation = validatePreviewConfiguration({ ...changes, trackId: changes.trackId, sourceAssetId: changes.sourceAssetId, audience: changes.accessTier, policyId: changes.policyId, sourceDurationSeconds: Math.max(Number(changes.previewEndSeconds || 0), 180), storageClass: "PROTECTED_PREVIEW" });
    if (!validation.valid) return { ok: false, message: validation.errors[0], errors: validation.errors };
    return update((state) => {
      const preview = state.previews.find((item) => item.id === previewId);
      if (!preview) return { ok: false, message: "Preview not found." };
      if (playableStatuses.has(preview.status)) return { ok: false, message: "Create a replacement version before changing an active preview." };
      const allowed = ["watermarkType","watermarkPhrase","watermarkVoice","watermarkPositions","repeatIntervalSeconds","previewStartSeconds","previewEndSeconds","previewDurationSeconds","outputFormat","outputBitrate","outputSampleRate","channels","expiresAt","sessionTraceability"];
      allowed.forEach((key) => { if (key in changes) preview[key] = clone(changes[key]); });
      preview.updatedAt = now();
      addActivity(state, preview, user, "Preview configuration updated", "Watermark, range, or output settings were saved.");
      return { ok: true };
    });
  },
  resolvePreviewPolicy,
  checkPreviewAccess,
  getPlayablePreviewAsset(trackId, user, collectionContext = null) {
    const state = readState();
    const candidates = state.previews.filter((item) => String(item.trackId) === String(trackId) && item.current).sort((a, b) => previewPriority(b, user, collectionContext) - previewPriority(a, user, collectionContext));
    let firstDenied = null;
    for (const preview of candidates) {
      if (!previewPriority(preview, user, collectionContext)) continue;
      const decision = checkPreviewAccess(preview, user, { device: "Codex Browser" });
      if (!decision.allowed) { firstDenied ||= decision; continue; }
      const policy = state.policies.find((item) => item.id === preview.policyId);
      return {
        preview: clone(preview), decision, hasRecords: candidates.length > 0,
        asset: {
          id: preview.outputAssetId, relatedTrackId: preview.trackId, storageClass: "PROTECTED_PREVIEW", assetType: preview.variantType,
          displayName: preview.variantType, fileName: `protected-${preview.id}.${preview.outputFormat.toLowerCase()}`, status: preview.status,
          sizeBytes: Math.round(preview.previewDurationSeconds * (parseInt(preview.outputBitrate, 10) || 128) * 125), durationSeconds: preview.previewDurationSeconds,
          visibility: preview.organizationId ? "Organization Restricted" : "Protected", usageCount: 0,
          metadata: { trackTitle: preview.trackTitle, artistName: preview.artistName, trackPublished: true, watermark: true, watermarkedPreviewId: preview.id, watermarkType: preview.watermarkType, watermarkPhrase: preview.watermarkPhrase, watermarkPositions: preview.watermarkPositions, forensicReference: preview.forensicReference, protectedEditorialPreview: Boolean(preview.metadata?.protectedEditorialPreview), previewVariant: preview.variantType, organizationSpecific: Boolean(preview.organizationId), policyName: policy?.name },
          accessPolicy: { streamAllowed: true, downloadAllowed: false, requiresAuthentication: policy?.authenticationRequired || false, requiredEntitlements: [], organizationRestrictions: preview.organizationId ? [preview.organizationId] : [] },
        },
      };
    }
    return { preview: null, asset: null, hasRecords: candidates.length > 0, decision: firstDenied || { allowed: false, reasonCode: "PREVIEW_NOT_GENERATED", message: "No approved preview is available for this track." } };
  },
  createPreviewSession(previewId, user, storageSessionId, sourcePage = "Track Detail") {
    return update((state) => {
      const preview = state.previews.find((item) => item.id === previewId);
      const decision = checkPreviewAccess(preview, user, { device: "Codex Browser" });
      if (!decision.allowed) { addEvent(state, preview, user, "Access denied", { sourcePage, result: "Denied", reasonCode: decision.reasonCode }); return { ok: false, message: decision.message, code: decision.reasonCode }; }
      const ref = `BM-FP-${String(new Date().getFullYear()).slice(-2)}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
      const policy = state.policies.find((item) => item.id === preview.policyId);
      const session = { id: uid("wm-session"), storageSessionId, previewId, trackId: preview.trackId, userId: user?.id || null, anonymousSessionId: user ? null : uid("anonymous"), organizationId: user?.organizationId || null, accessId: uid("preview-access"), forensicReference: policy?.traceability ? ref : null, status: "Active", startedAt: now(), expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), device: "Codex Browser", approximateLocation: "India", lastPosition: 0, cuePositionsReached: [], sourcePage };
      state.sessions.unshift(session);
      addEvent(state, preview, user, preview.organizationId ? "Buyer-specific preview accessed" : "Preview playback started", { sourcePage, result: "Allowed", accessTier: getAccessTier(user) });
      addActivity(state, preview, user, "Session created", `Protected preview session ${session.id} created.`);
      return { ok: true, session: clone(session) };
    });
  },
  recordWatermarkCue(previewId, storageSessionId, user, position, sourcePage) {
    return update((state) => {
      const preview = state.previews.find((item) => item.id === previewId);
      const session = state.sessions.find((item) => item.storageSessionId === storageSessionId);
      if (session && !session.cuePositionsReached.includes(position)) session.cuePositionsReached.push(position);
      addEvent(state, preview, user, "Watermark cue reached", { playbackPosition: position, sourcePage, result: "Reached" });
      return { ok: true };
    });
  },
  completeSession(storageSessionId, user, position, completed = false) {
    return update((state) => {
      const session = state.sessions.find((item) => item.storageSessionId === storageSessionId);
      if (!session) return { ok: false };
      session.status = completed ? "Completed" : "Paused";
      session.lastPosition = position || 0;
      const preview = state.previews.find((item) => item.id === session.previewId);
      if (completed) addEvent(state, preview, user, "Playback completed", { playbackPosition: position, sourcePage: session.sourcePage, result: "Completed" });
      return { ok: true };
    });
  },
  createPreviewDraft(config, user) {
    if (!has(user, "previews.create")) return { ok: false, message: "Preview-creation permission is required." };
    const validation = validatePreviewConfiguration(config);
    if (!validation.valid) return { ok: false, message: validation.errors[0], errors: validation.errors };
    return update((state) => {
      const policy = state.policies.find((item) => item.id === config.policyId);
      const existing = state.previews.filter((item) => item.trackId === Number(config.trackId) && item.accessTier === config.accessTier);
      const version = Math.max(0, ...existing.map((item) => item.version || 0)) + 1;
      const preview = { id: uid("preview"), trackId: Number(config.trackId), trackTitle: config.trackTitle, artistName: config.artistName, sourceAssetId: config.sourceAssetId, sourceAssetVersion: config.sourceAssetVersion || 1, outputAssetId: uid("asset-wm"), policyId: config.policyId, policyVersion: policy?.version || 1, variantType: config.variantType || `${config.accessTier} protected preview`, accessTier: config.accessTier, organizationId: config.organizationId || null, buyerId: config.buyerId || null, collectionId: config.collectionId || null, status: "Draft", watermarkType: config.watermarkType, watermarkPhrase: config.watermarkPhrase, watermarkVoice: config.watermarkVoice, watermarkPositions: config.watermarkPositions, repeatIntervalSeconds: config.repeatIntervalSeconds || null, previewStartSeconds: Number(config.previewStartSeconds), previewEndSeconds: Number(config.previewEndSeconds), previewDurationSeconds: Number(config.previewEndSeconds) - Number(config.previewStartSeconds), outputFormat: config.outputFormat, outputBitrate: config.outputBitrate, outputSampleRate: config.outputSampleRate, channels: config.channels || "Stereo", sessionTraceability: config.sessionTraceability || false, forensicReference: null, expiresAt: config.expiresAt || null, approvedAt: null, approvedBy: null, generatedAt: null, generatedBy: null, failureCode: null, failureMessage: null, version, current: false, restrictions: ["Streaming only", "No direct download"], assignedReviewer: "Jordan Lee", updatedAt: now(), reviewChecklist: Object.fromEntries(Object.keys(DEFAULT_WATERMARK_STATE.previews[0].reviewChecklist).map((item) => [item, false])), generationHistory: [], notes: ["Watermark processing is simulated."], metadata: {} };
      state.previews.unshift(preview);
      addActivity(state, preview, user, "Preview draft created", `${preview.variantType} v${version} created from ${preview.sourceAssetId}.`);
      notify(state, "user-noah", "preview", "Preview generation requested", `${preview.trackTitle} has a new preview draft.`, "admin-previews-generation");
      return { ok: true, preview: clone(preview) };
    });
  },
  startGeneration(previewId, user) {
    if (!has(user, "previews.generate")) return { ok: false, message: "Preview-generation permission is required." };
    return update((state) => {
      const preview = state.previews.find((item) => item.id === previewId);
      if (!preview) return { ok: false, message: "Preview not found." };
      const validation = validatePreviewConfiguration({ ...preview, audience: preview.accessTier, sourceDurationSeconds: Math.max(preview.previewEndSeconds, 180), storageClass: "PROTECTED_PREVIEW" });
      if (!validation.valid) return { ok: false, message: validation.errors[0] };
      preview.status = "Queued";
      preview.updatedAt = now();
      state.jobs = state.jobs.filter((job) => job.previewId !== preview.id || !["Queued", "Processing", "Retrying"].includes(job.status));
      state.jobs.unshift(...createJobsForPreview(preview.id, preview.trackId));
      addActivity(state, preview, user, "Generation started", "Ten simulated processing jobs were queued.");
      syncPreviewStatusToIngestion(preview, "Queued", "Watermarked-preview generation requested.");
      return { ok: true };
    });
  },
  runNextJob(previewId, user) {
    if (!has(user, "previews.generate")) return { ok: false, message: "Preview-generation permission is required." };
    return update((state) => {
      const preview = state.previews.find((item) => item.id === previewId);
      const job = state.jobs.filter((item) => item.previewId === previewId).reverse().find((item) => ["Queued", "Retrying"].includes(item.status));
      if (!preview || !job) return { ok: false, message: "No queued generation job remains." };
      job.status = "Completed"; job.progress = 100; job.startedAt ||= now(); job.completedAt = now(); job.result = "Mock processing step completed.";
      preview.status = state.jobs.some((item) => item.previewId === previewId && ["Queued", "Retrying"].includes(item.status)) ? "Generating" : "Under Review";
      preview.generatedAt = preview.status === "Under Review" ? now() : preview.generatedAt;
      preview.generatedBy = user.name;
      addActivity(state, preview, user, "Generation job completed", job.jobType);
      if (preview.status === "Under Review") notify(state, "user-jordan", "preview", "Preview awaiting approval", `${preview.trackTitle} is ready for watermark review.`, "admin-previews-preview");
      syncPreviewStatusToIngestion(preview, preview.status, `${job.jobType} completed.`);
      return { ok: true, job: clone(job), status: preview.status };
    });
  },
  completeAllJobs(previewId, user) {
    if (!has(user, "previews.generate")) return { ok: false, message: "Preview-generation permission is required." };
    return update((state) => {
      const preview = state.previews.find((item) => item.id === previewId);
      if (!preview) return { ok: false, message: "Preview not found." };
      state.jobs.filter((item) => item.previewId === previewId && !["Cancelled"].includes(item.status)).forEach((job) => { job.status = "Completed"; job.progress = 100; job.startedAt ||= now(); job.completedAt = now(); job.result = "Mock processing step completed."; job.failureCode = null; job.failureMessage = null; });
      preview.status = "Under Review"; preview.generatedAt = now(); preview.generatedBy = user.name; preview.failureCode = null; preview.failureMessage = null;
      addActivity(state, preview, user, "Generation completed", "All simulated processing jobs completed.");
      notify(state, "user-jordan", "preview", "Preview awaiting approval", `${preview.trackTitle} is ready for watermark review.`, "admin-previews-preview");
      syncPreviewStatusToIngestion(preview, "Under Review", "Simulated preview generation completed.");
      return { ok: true };
    });
  },
  failJob(previewId, user, jobType = "Watermark insertion simulation") {
    if (!has(user, "previews.generate")) return { ok: false, message: "Preview-generation permission is required." };
    return update((state) => {
      const preview = state.previews.find((item) => item.id === previewId);
      let job = state.jobs.find((item) => item.previewId === previewId && item.jobType === jobType);
      if (!job) { job = createJobsForPreview(previewId, preview.trackId).find((item) => item.jobType === jobType); state.jobs.unshift(job); }
      job.status = "Failed"; job.progress = 48; job.startedAt ||= now(); job.completedAt = now(); job.failureCode = jobType.includes("Encoding") ? "ENCODING_FAILED" : "WATERMARK_GENERATION_FAILED"; job.failureMessage = `${jobType} failed in the demo scenario.`;
      preview.status = "Failed"; preview.failureCode = job.failureCode; preview.failureMessage = job.failureMessage;
      addActivity(state, preview, user, "Generation failed", job.failureMessage);
      notify(state, "user-noah", "preview", "Preview generation failed", `${preview.trackTitle}: ${job.failureMessage}`, "admin-previews-generation");
      syncPreviewStatusToIngestion(preview, "Failed", job.failureMessage);
      return { ok: true };
    });
  },
  retryFailedJob(jobId, user) {
    if (!has(user, "previews.generate")) return { ok: false, message: "Preview-generation permission is required." };
    return update((state) => {
      const job = state.jobs.find((item) => item.id === jobId);
      if (!job || job.status !== "Failed") return { ok: false, message: "Failed job not found." };
      job.status = "Retrying"; job.retryCount += 1; job.failureCode = null; job.failureMessage = null; job.progress = 0;
      const preview = state.previews.find((item) => item.id === job.previewId); preview.status = "Queued"; preview.failureCode = null; preview.failureMessage = null;
      addActivity(state, preview, user, "Generation retry queued", `${job.jobType} retry ${job.retryCount}.`);
      return { ok: true };
    });
  },
  setChecklist(previewId, checklist, user) {
    return update((state) => { const preview = state.previews.find((item) => item.id === previewId); if (!preview) return { ok: false }; preview.reviewChecklist = clone(checklist); addActivity(state, preview, user, "Review checklist updated", "Preview review controls were updated."); return { ok: true }; });
  },
  approvePreview(previewId, user, withWarning = false) {
    if (!has(user, "previews.approve")) return { ok: false, message: "Preview-approval permission is required." };
    return update((state) => {
      const preview = state.previews.find((item) => item.id === previewId);
      if (!preview) return { ok: false, message: "Preview not found." };
      const missing = Object.entries(preview.reviewChecklist).filter(([, value]) => !value);
      if (missing.length) return { ok: false, message: `Complete the review checklist first: ${missing[0][0]}.` };
      state.previews.filter((item) => item.trackId === preview.trackId && item.accessTier === preview.accessTier && item.organizationId === preview.organizationId && item.current && item.id !== preview.id).forEach((item) => { item.current = false; item.status = "Superseded"; });
      preview.status = withWarning ? "Ready with Warning" : "Ready"; preview.current = true; preview.approvedAt = now(); preview.approvedBy = user.name; preview.updatedAt = now();
      addActivity(state, preview, user, withWarning ? "Preview approved with warning" : "Preview approved", "Protected-preview output activated and prior matching version superseded.");
      addEvent(state, preview, user, "Preview approved", { result: preview.status, sourcePage: "Preview Review" });
      notify(state, preview.trackId === 15 ? "user-marcus" : "user-noah", "preview", "Preview approved", `${preview.trackTitle} ${preview.variantType} is ready.`, preview.trackId === 15 ? "artist-previews" : "admin-previews");
      syncReadyPreviewsToStorage(state);
      syncPreviewStatusToIngestion(preview, preview.status, "Approved protected-preview output registered.");
      return { ok: true };
    });
  },
  requestRegeneration(previewId, user, reason = "Configuration changed") {
    if (!has(user, "previews.regenerate")) return { ok: false, message: "Preview-regeneration permission is required." };
    return update((state) => { const current = state.previews.find((item) => item.id === previewId); if (!current) return { ok: false, message: "Preview not found." }; const replacement = { ...clone(current), id: uid("preview"), outputAssetId: uid("asset-wm"), status: "Draft", version: current.version + 1, current: false, approvedAt: null, approvedBy: null, generatedAt: null, generatedBy: null, failureCode: null, failureMessage: null, updatedAt: now(), reviewChecklist: Object.fromEntries(Object.keys(current.reviewChecklist).map((item) => [item, false])), generationHistory: [...(current.generationHistory || []), { version: current.version, status: current.status, generatedAt: current.generatedAt, approvedAt: current.approvedAt, reason }] }; state.previews.unshift(replacement); addActivity(state, replacement, user, "Preview regeneration requested", reason, reason); notify(state, "user-noah", "preview", "Preview regeneration required", `${current.trackTitle}: ${reason}`, "admin-previews-generation"); syncPreviewStatusToIngestion(replacement, "Draft", reason); return { ok: true, preview: clone(replacement) }; });
  },
  rejectPreview(previewId, user, reason) {
    if (!has(user, "previews.reject")) return { ok: false, message: "Preview-rejection permission is required." };
    if (!reason?.trim()) return { ok: false, message: "A rejection reason is required." };
    return update((state) => { const preview = state.previews.find((item) => item.id === previewId); preview.status = "Failed"; preview.failureCode = "REVIEW_REJECTED"; preview.failureMessage = reason; addActivity(state, preview, user, "Preview rejected", reason, reason); return { ok: true }; });
  },
  revokePreview(previewId, user, reason) {
    if (!has(user, "previews.revoke")) return { ok: false, message: "Preview-revocation permission is required." };
    if (!reason?.trim()) return { ok: false, message: "A revocation reason is required." };
    return update((state) => { const preview = state.previews.find((item) => item.id === previewId); if (!preview) return { ok: false, message: "Preview not found." }; preview.status = "Revoked"; preview.revokedAt = now(); preview.revokedBy = user.name; preview.revocationReason = reason; const sessions = state.sessions.filter((item) => item.previewId === previewId && ["Active", "Paused"].includes(item.status)); sessions.forEach((session) => { session.status = "Revoked"; window.dispatchEvent(new CustomEvent("beatmondo-preview-session-invalidated", { detail: { sessionId: session.storageSessionId, reason: "Protected preview access was revoked." } })); }); addActivity(state, preview, user, "Preview revoked", `${reason}; ${sessions.length} active sessions revoked.`, reason); addEvent(state, preview, user, "Preview revoked", { result: "Revoked", reasonCode: "PREVIEW_REVOKED" }); if (preview.organizationId) notify(state, "user-olivia", "preview", "Private preview revoked", `${preview.trackTitle} is no longer available in the private selection.`, "buyer-private-previews"); return { ok: true, sessions: sessions.length }; });
  },
  expirePreview(previewId, user) {
    return update((state) => { const preview = state.previews.find((item) => item.id === previewId); if (!preview) return { ok: false }; preview.status = "Expired"; preview.expiresAt = now(); state.sessions.filter((item) => item.previewId === previewId && ["Active", "Paused"].includes(item.status)).forEach((session) => { session.status = "Expired"; window.dispatchEvent(new CustomEvent("beatmondo-preview-session-invalidated", { detail: { sessionId: session.storageSessionId, reason: "Protected preview access expired." } })); }); addActivity(state, preview, user, "Preview expired", "Expiry simulated; access history was preserved."); addEvent(state, preview, user, "Preview expired", { result: "Expired", reasonCode: "PREVIEW_EXPIRED" }); return { ok: true }; });
  },
  updatePolicy(policyId, changes, user, reason) {
    if (!has(user, "previews.manage_policies")) return { ok: false, message: "Preview-policy permission is required." };
    if (!reason?.trim()) return { ok: false, message: "A policy-change reason is required." };
    return update((state) => { const policy = state.policies.find((item) => item.id === policyId); if (!policy) return { ok: false, message: "Policy not found." }; const before = clone(policy); policy.versions.unshift({ version: policy.version, changedBy: policy.updatedBy, changedAt: policy.updatedAt, snapshot: before }); policy.version += 1; Object.assign(policy, clone(changes), { updatedAt: now(), updatedBy: user.name }); const affected = state.previews.filter((item) => item.policyId === policyId && item.current && playableStatuses.has(item.status)); affected.forEach((preview) => { preview.metadata ||= {}; preview.metadata.regenerationRequired = true; preview.failureCode = "POLICY_VERSION_CHANGED"; preview.failureMessage = reason; }); state.policyVersions.unshift({ id: uid("policy-version"), policyId, version: policy.version, changedBy: user.name, changedAt: now(), reason, before, after: clone(policy), affectedPreviewCount: affected.length, regenerationRequired: affected.length > 0 }); addActivity(state, affected[0] || null, user, "Policy version changed", `${policy.name} v${policy.version}; ${affected.length} previews require regeneration.`, reason); notify(state, "user-noah", "preview", "Watermark policy changed", `${policy.name} changed; ${affected.length} previews require regeneration.`, "admin-previews-policies"); return { ok: true, affected: affected.length }; });
  },
  duplicatePolicy(policyId, user) {
    if (!has(user, "previews.manage_policies")) return { ok: false, message: "Preview-policy permission is required." };
    return update((state) => { const source = state.policies.find((item) => item.id === policyId); const copy = { ...clone(source), id: uid("policy"), name: `${source.name} — Copy`, isDefault: false, version: 1, versions: [], updatedAt: now(), updatedBy: user.name }; state.policies.unshift(copy); return { ok: true, policy: clone(copy) }; });
  },
  setDefaultPolicy(policyId, user) { return this.updatePolicy(policyId, { isDefault: true }, user, "Set as global default policy"); },
  requestArtistCorrection(previewId, user, message) {
    if (user?.role !== "artist") return { ok: false, message: "Artist access required." };
    if (!message?.trim()) return { ok: false, message: "Describe the requested correction." };
    return update((state) => { const preview = state.previews.find((item) => item.id === previewId && item.artistName === user.organization); if (!preview) return { ok: false, message: "Preview not available in this artist workspace." }; preview.notes.push(`Artist correction request: ${message}`); addActivity(state, preview, user, "Artist correction requested", message, message); notify(state, "user-noah", "preview", "Artist preview correction requested", `${preview.trackTitle}: ${message}`, "admin-previews-preview"); return { ok: true }; });
  },
  handleSourceAssetReplacement(previousAssetId, replacementAssetId, sourceVersion, user) {
    return update((state) => {
      const affected = state.previews.filter((preview) => preview.sourceAssetId === previousAssetId && preview.current);
      affected.forEach((preview) => {
        preview.metadata ||= {};
        preview.metadata.regenerationRequired = true;
        preview.metadata.replacementSourceAssetId = replacementAssetId;
        preview.metadata.currentSourceVersion = sourceVersion;
        preview.failureCode = "SOURCE_VERSION_CHANGED";
        preview.failureMessage = "Source asset changed; generate and approve a replacement preview.";
        addActivity(state, preview, user, "Source changed", preview.failureMessage);
        syncPreviewStatusToIngestion(preview, "Regeneration Required", preview.failureMessage);
      });
      if (affected.length) notify(state, "user-noah", "preview", "Preview regeneration required", `${affected.length} protected previews use a replaced source asset.`, "admin-previews-generation");
      return { ok: true, affected: affected.length };
    });
  },
  createBuyerSpecificPreview(track, user, data) {
    if (!has(user, "previews.manage_buyer_specific")) return { ok: false, message: "Buyer-specific preview permission is required." };
    const phraseCheck = validateWatermarkPhrase(data.watermarkPhrase);
    if (!phraseCheck.valid) return { ok: false, message: phraseCheck.message };
    if (!data.organizationId) return { ok: false, message: "Select a buyer organization." };
    return this.createPreviewDraft({ trackId: track.id, trackTitle: track.title, artistName: track.artist, sourceAssetId: data.sourceAssetId || `asset-preview-${track.id}-approved`, sourceAssetVersion: 1, audience: "Named buyer organization", policyId: "policy-northstar", accessTier: "VIP", organizationId: data.organizationId, collectionId: data.collectionId, watermarkType: "BUYER_SPECIFIC", watermarkPhrase: data.watermarkPhrase, watermarkVoice: "beatmondo Warm", watermarkPositions: [3, 63], previewStartSeconds: 0, previewEndSeconds: data.duration || 90, sourceDurationSeconds: data.duration || 90, outputFormat: "M4A", outputBitrate: "256 kbps", outputSampleRate: "44.1 kHz", storageClass: "PROTECTED_PREVIEW", sessionTraceability: true, expiresAt: data.expiresAt, variantType: "Private buyer preview" }, user);
  },
  checkPreviewRegenerationRequired(preview, track, sourceAsset, policy) {
    const reasons = [];
    if (sourceAsset?.version && sourceAsset.version !== preview.sourceAssetVersion) reasons.push("Source version changed");
    if (policy?.version && policy.version !== preview.policyVersion) reasons.push("Policy version changed");
    if (track?.title && track.title !== preview.trackTitle) reasons.push("Track title changed");
    if (track?.artist && track.artist !== preview.artistName) reasons.push("Artist name changed");
    if (preview.expiresAt && new Date(preview.expiresAt) <= new Date()) reasons.push("Preview expired");
    return { required: reasons.length > 0, reasons };
  },
  getAnalytics() {
    const state = readState(); const events = state.analyticsEvents; const plays = events.filter((item) => item.eventType === "Preview playback started" || item.eventType === "Buyer-specific preview accessed"); const completed = events.filter((item) => item.eventType === "Playback completed"); const generatedJobs = state.jobs.filter((item) => item.jobType === "Storage registration"); const successful = generatedJobs.filter((item) => item.status === "Completed").length; return { totalVariants: state.previews.length, ready: state.previews.filter((item) => playableStatuses.has(item.status)).length, generating: state.previews.filter((item) => ["Queued", "Generating"].includes(item.status)).length, failed: state.previews.filter((item) => item.status === "Failed").length, expired: state.previews.filter((item) => item.status === "Expired" || item.expiresAt && new Date(item.expiresAt) <= new Date()).length, revoked: state.previews.filter((item) => item.status === "Revoked").length, buyerSpecific: state.previews.filter((item) => item.organizationId || item.buyerId).length, outdated: state.previews.filter((item) => item.status === "Regeneration Required" || item.metadata?.regenerationRequired).length, plays: plays.length, uniqueListeners: new Set(plays.map((item) => item.userId || item.anonymousSessionId)).size, averageCompletion: plays.length ? Math.round(completed.length / plays.length * 100) : 0, cuesReached: events.filter((item) => item.eventType === "Watermark cue reached").length, denials: events.filter((item) => item.eventType === "Access denied").length, generationSuccessRate: generatedJobs.length ? Math.round(successful / generatedJobs.length * 100) : 0, generationFailureRate: generatedJobs.length ? Math.round(generatedJobs.filter((item) => item.status === "Failed").length / generatedJobs.length * 100) : 0, byTier: Object.fromEntries(["Public", "Discovery", "Professional", "VIP", "Internal"].map((tier) => [tier, plays.filter((item) => item.accessTier === tier).length])), mostPlayed: state.previews.map((preview) => ({ track: preview.trackTitle, count: plays.filter((item) => item.previewId === preview.id).length })).sort((a,b)=>b.count-a.count).slice(0,5) };
  },
  syncReadyPreviewsToStorage() { const state = readState(); syncReadyPreviewsToStorage(state); return { ok: true }; },
  resetWatermarkedPreviewsDemoData() {
    const state = clone(DEFAULT_WATERMARK_STATE);
    writeState(state);
    try {
      const storage = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      const defaultReadyOutputs = new Set(state.previews.filter((preview) => playableStatuses.has(preview.status) && preview.current).map((preview) => preview.outputAssetId));
      if (storage?.assets) {
        storage.assets = storage.assets.filter((asset) => !asset.metadata?.watermarkedPreviewId || defaultReadyOutputs.has(asset.id));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      }
    } catch {}
    authService.removeDemoMessagesByType("preview");
    syncReadyPreviewsToStorage(state);
    return clone(state);
  },
};

export const previewPolicyService = { getPreviewPolicies: () => watermarkedPreviewService.getPolicies(), getPreviewPolicy: (id) => watermarkedPreviewService.getPolicy(id), resolvePreviewPolicy, updatePreviewPolicy: (...args) => watermarkedPreviewService.updatePolicy(...args), duplicatePreviewPolicy: (...args) => watermarkedPreviewService.duplicatePolicy(...args) };
export const previewAccessService = { checkPreviewAccess, getPlayablePreviewAsset: (...args) => watermarkedPreviewService.getPlayablePreviewAsset(...args) };
export const previewGenerationService = { startPreviewGeneration: (...args) => watermarkedPreviewService.startGeneration(...args), runPreviewGenerationJob: (...args) => watermarkedPreviewService.runNextJob(...args), retryPreviewGeneration: (...args) => watermarkedPreviewService.retryFailedJob(...args) };
export const previewAnalyticsService = { getPreviewAnalytics: () => watermarkedPreviewService.getAnalytics() };
