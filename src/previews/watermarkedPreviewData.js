export const WATERMARK_STORAGE_KEY = "beatmondo-watermarked-previews-v1";
export const SELECTED_PREVIEW_KEY = "beatmondo-selected-watermarked-preview";

export const WATERMARK_TYPES = {
  NONE: { label: "No audible watermark", settings: [], buyerBehavior: "Internal-use notice", processing: "Session registration", reviewRequired: true },
  SPOKEN_INTRO: { label: "Spoken intro", settings: ["phrase", "voice", "position"], buyerBehavior: "Audible identifier near the beginning", processing: "Spoken cue simulation", reviewRequired: true },
  SPOKEN_OUTRO: { label: "Spoken outro", settings: ["phrase", "voice", "position"], buyerBehavior: "Audible identifier near the end", processing: "Spoken cue simulation", reviewRequired: true },
  SPOKEN_PERIODIC: { label: "Periodic spoken", settings: ["phrase", "voice", "positions", "repeatInterval"], buyerBehavior: "Audible identifier at configured intervals", processing: "Periodic cue simulation", reviewRequired: true },
  TONAL_INTRO: { label: "Tonal intro", settings: ["tone", "position"], buyerBehavior: "Restrained tonal identifier near the beginning", processing: "Tonal cue simulation", reviewRequired: true },
  TONAL_PERIODIC: { label: "Periodic tonal", settings: ["tone", "positions", "repeatInterval"], buyerBehavior: "Restrained tonal identifier at configured intervals", processing: "Periodic tonal cue simulation", reviewRequired: true },
  BUYER_SPECIFIC: { label: "Buyer-specific spoken", settings: ["organization", "phrase", "voice", "positions"], buyerBehavior: "Safe organization identifier", processing: "Organization-specific cue simulation", reviewRequired: true },
  SESSION_SPECIFIC_SIMULATION: { label: "Session-specific simulation", settings: ["sessionReference"], buyerBehavior: "Session traceability notice", processing: "Reference registration only", reviewRequired: true },
  COMBINED: { label: "Combined protection", settings: ["phrase", "voice", "positions", "sessionReference"], buyerBehavior: "Audible and session-specific identification", processing: "Combined cue and reference simulation", reviewRequired: true },
};

export const PREVIEW_STATUSES = {
  Draft: { playable: false, visible: "Internal", actions: ["Configure", "Generate"], searchVisible: false, notify: false },
  Queued: { playable: false, visible: "Internal", actions: ["Cancel"], searchVisible: false, notify: false },
  Generating: { playable: false, visible: "Internal", actions: ["Fail", "Cancel"], searchVisible: false, notify: false },
  Generated: { playable: false, visible: "Internal", actions: ["Review"], searchVisible: false, notify: true },
  "Under Review": { playable: false, visible: "Internal", actions: ["Approve", "Reject"], searchVisible: false, notify: true },
  Approved: { playable: false, visible: "Internal", actions: ["Activate"], searchVisible: false, notify: true },
  Ready: { playable: true, visible: "Audience", actions: ["Regenerate", "Revoke"], searchVisible: true, notify: true },
  "Ready with Warning": { playable: true, visible: "Audience", actions: ["Regenerate", "Revoke"], searchVisible: true, notify: true },
  Failed: { playable: false, visible: "Internal", actions: ["Retry", "Regenerate"], searchVisible: false, notify: true },
  Expired: { playable: false, visible: "Internal", actions: ["Renew", "Regenerate"], searchVisible: false, notify: true },
  Revoked: { playable: false, visible: "Internal", actions: ["Regenerate", "Archive"], searchVisible: false, notify: true },
  "Regeneration Required": { playable: false, visible: "Internal", actions: ["Regenerate"], searchVisible: false, notify: true },
  Superseded: { playable: false, visible: "Internal", actions: ["Compare", "Archive"], searchVisible: false, notify: false },
  Archived: { playable: false, visible: "Internal", actions: ["View"], searchVisible: false, notify: false },
};

export const DEFAULT_VOICE_PROFILES = [
  { id: "voice-neutral", name: "beatmondo Neutral", language: "English", tone: "Clear and discreet", description: "Gender-neutral simulated voice profile.", status: "Approved", approvedPhrases: ["beatmondo preview", "beatmondo licensing preview"] },
  { id: "voice-warm", name: "beatmondo Warm", language: "English", tone: "Warm and restrained", description: "Gender-neutral simulated voice profile for private collections.", status: "Approved", approvedPhrases: ["Prepared for Northstar Pictures", "Private beatmondo preview"] },
  { id: "voice-minimal", name: "beatmondo Minimal", language: "English", tone: "Brief and neutral", description: "Minimal simulated identifier; no synthesized audio is generated.", status: "Approved", approvedPhrases: ["beatmondo preview"] },
];

const policy = (id, name, audience, watermarkType, overrides = {}) => ({
  id, name, description: overrides.description || "Protected preview policy", audience, watermarkType,
  phrase: overrides.phrase || "beatmondo preview", voiceProfileId: overrides.voiceProfileId || "voice-neutral",
  positions: overrides.positions || [8], repeatIntervalSeconds: overrides.repeatIntervalSeconds || null,
  durationRule: overrides.durationRule || "Full approved preview", maxDurationSeconds: overrides.maxDurationSeconds || null,
  outputFormat: overrides.outputFormat || "AAC", outputBitrate: overrides.outputBitrate || "192 kbps", outputSampleRate: overrides.outputSampleRate || "44.1 kHz",
  channels: overrides.channels || "Stereo", authenticationRequired: overrides.authenticationRequired ?? true,
  anonymousAllowed: overrides.anonymousAllowed ?? false, sessionRequired: true, downloadAllowed: false,
  expiryDays: overrides.expiryDays ?? null, maxActiveSessions: overrides.maxActiveSessions ?? 3, maxTotalSessions: overrides.maxTotalSessions ?? 30,
  maxDevices: overrides.maxDevices ?? 3, traceability: overrides.traceability ?? false,
  organizationId: overrides.organizationId || null, collectionId: overrides.collectionId || null,
  active: true, isDefault: overrides.isDefault || false, version: 1, versions: [], updatedAt: "2026-07-16T10:00:00.000Z", updatedBy: "Preston Repenning",
  restrictions: overrides.restrictions || ["Streaming only", "No direct download"],
});

export const DEFAULT_PREVIEW_POLICIES = [
  policy("policy-public", "Public Discovery Standard", ["Public", "Discovery"], "SPOKEN_PERIODIC", { description: "Limited public discovery with periodic simulated spoken cues.", positions: [8, 38], repeatIntervalSeconds: 30, durationRule: "60-second excerpt", maxDurationSeconds: 60, outputFormat: "MP3", outputBitrate: "128 kbps", authenticationRequired: false, anonymousAllowed: true, maxActiveSessions: 2, isDefault: true }),
  policy("policy-professional", "Professional Buyer Preview", ["Professional"], "COMBINED", { description: "Longer professional preview with a tonal intro and periodic spoken cue.", positions: [3, 63], repeatIntervalSeconds: 60, outputFormat: "AAC", outputBitrate: "192 kbps", maxActiveSessions: 4 }),
  policy("policy-vip", "VIP Premium Preview", ["VIP"], "SPOKEN_INTRO", { description: "Full approved preview with a restrained intro cue and session traceability.", positions: [3], outputFormat: "M4A", outputBitrate: "256 kbps", traceability: true, maxActiveSessions: 6, maxDevices: 4 }),
  policy("policy-northstar", "Northstar Private Collection", ["Named organization", "Private collection"], "BUYER_SPECIFIC", { description: "Organization-restricted private collection preview.", phrase: "Prepared for Northstar Pictures", voiceProfileId: "voice-warm", positions: [3, 63], outputFormat: "M4A", outputBitrate: "256 kbps", expiryDays: 7, traceability: true, organizationId: "org-northstar", collectionId: "collection-northstar-private", maxActiveSessions: 3, maxTotalSessions: 20 }),
  policy("policy-restricted", "Rights Restricted Preview", ["Restricted"], "NONE", { description: "Disables playback while rights information is under review.", authenticationRequired: true, maxActiveSessions: 0, restrictions: ["Preview disabled", "Rights review required"] }),
  policy("policy-internal", "Internal Review Preview", ["Internal"], "NONE", { description: "Logged internal preview review without audible cue; master playback remains prohibited.", positions: [], outputFormat: "AAC", outputBitrate: "192 kbps", traceability: true, expiryDays: 14, maxActiveSessions: 8, restrictions: ["Internal use only", "Protected preview asset only"] }),
];

const preview = (id, trackId, trackTitle, artistName, policyId, variantType, accessTier, status, overrides = {}) => ({
  id, trackId, trackTitle, artistName, sourceAssetId: overrides.sourceAssetId || `asset-master-${trackId}`,
  sourceAssetVersion: overrides.sourceAssetVersion || 1, outputAssetId: overrides.outputAssetId || `asset-${id}`,
  policyId, policyVersion: overrides.policyVersion || 1, variantType, accessTier,
  organizationId: overrides.organizationId || null, buyerId: overrides.buyerId || null, collectionId: overrides.collectionId || null,
  status, watermarkType: overrides.watermarkType || "SPOKEN_PERIODIC", watermarkPhrase: overrides.watermarkPhrase || "beatmondo preview",
  watermarkVoice: overrides.watermarkVoice || "beatmondo Neutral", watermarkPositions: overrides.watermarkPositions || [8, 38],
  repeatIntervalSeconds: overrides.repeatIntervalSeconds || 30, previewStartSeconds: overrides.previewStartSeconds || 0,
  previewEndSeconds: overrides.previewEndSeconds || 60, previewDurationSeconds: overrides.previewDurationSeconds || 60,
  outputFormat: overrides.outputFormat || "MP3", outputBitrate: overrides.outputBitrate || "128 kbps", outputSampleRate: overrides.outputSampleRate || "44.1 kHz",
  channels: overrides.channels || "Stereo", sessionTraceability: overrides.sessionTraceability || false,
  forensicReference: overrides.forensicReference || null, expiresAt: overrides.expiresAt || null,
  approvedAt: overrides.approvedAt || (PREVIEW_STATUSES[status]?.playable ? "2026-07-15T12:00:00.000Z" : null),
  approvedBy: overrides.approvedBy || (PREVIEW_STATUSES[status]?.playable ? "Jordan Lee" : null),
  generatedAt: overrides.generatedAt || "2026-07-15T10:00:00.000Z", generatedBy: overrides.generatedBy || "Noah Bennett",
  failureCode: overrides.failureCode || null, failureMessage: overrides.failureMessage || null,
  version: overrides.version || 1, current: overrides.current ?? true, restrictions: overrides.restrictions || ["Streaming only", "No direct download"],
  assignedReviewer: overrides.assignedReviewer || "Jordan Lee", updatedAt: overrides.updatedAt || "2026-07-16T09:00:00.000Z",
  reviewChecklist: overrides.reviewChecklist || Object.fromEntries(["Source asset approved","Source version current","Track title correct","Artist correct","Audience correct","Watermark phrase approved","Watermark timing appropriate","Preview range appropriate","Output configuration approved","Rights permit preview","Access policy correct","Search visibility correct","Buyer-specific identifier safe","Playback test completed","Expiry configured","Final approval complete"].map((item)=>[item,PREVIEW_STATUSES[status]?.playable || false])),
  generationHistory: overrides.generationHistory || [], notes: overrides.notes || [], metadata: overrides.metadata || {},
});

export const DEFAULT_WATERMARKED_PREVIEWS = [
  preview("preview-1-public", 1, "Golden Hours", "Lennox", "policy-public", "Public watermarked excerpt", "Public", "Ready", { sourceAssetId: "asset-preview-1-standard", outputAssetId: "asset-wm-1-public", previewEndSeconds: 60 }),
  preview("preview-1-professional", 1, "Golden Hours", "Lennox", "policy-professional", "Professional full preview", "Professional", "Ready", { sourceAssetId: "asset-preview-1-standard", outputAssetId: "asset-wm-1-professional", watermarkType: "COMBINED", watermarkPositions: [3,63], repeatIntervalSeconds: 60, previewEndSeconds: 94, previewDurationSeconds: 94, outputFormat: "AAC", outputBitrate: "192 kbps" }),
  preview("preview-1-vip", 1, "Golden Hours", "Lennox", "policy-vip", "VIP premium preview", "VIP", "Ready", { sourceAssetId: "asset-preview-1-standard", outputAssetId: "asset-wm-1-vip", watermarkType: "SPOKEN_INTRO", watermarkPositions: [3], previewEndSeconds: 94, previewDurationSeconds: 94, outputFormat: "M4A", outputBitrate: "256 kbps", sessionTraceability: true }),
  preview("preview-1-northstar", 1, "Golden Hours", "Lennox", "policy-northstar", "Northstar private preview", "VIP", "Ready", { sourceAssetId: "asset-preview-1-standard", outputAssetId: "asset-wm-1-northstar", organizationId: "org-northstar", collectionId: "collection-northstar-private", watermarkType: "BUYER_SPECIFIC", watermarkPhrase: "Prepared for Northstar Pictures", watermarkVoice: "beatmondo Warm", watermarkPositions: [3,63], previewEndSeconds: 94, previewDurationSeconds: 94, outputFormat: "M4A", outputBitrate: "256 kbps", sessionTraceability: true, expiresAt: "2026-08-15T12:00:00.000Z", forensicReference: "BM-FP-26-8F4C21" }),
  preview("preview-2-public", 2, "Paper Planes", "Arco North", "policy-public", "Public watermarked excerpt", "Public", "Generating", { sourceAssetId: "asset-temp-2-master", failureMessage: "Master version updated; output is regenerating." }),
  preview("preview-2-professional", 2, "Paper Planes", "Arco North", "policy-professional", "Professional full preview", "Professional", "Regeneration Required", { sourceAssetVersion: 1, metadata: { currentSourceVersion: 2 }, failureMessage: "Source asset version changed." }),
  preview("preview-3-public", 3, "Midnight Transit", "Soren", "policy-public", "45-second public excerpt", "Public", "Ready with Warning", { previewEndSeconds: 45, previewDurationSeconds: 45, watermarkPositions: [8,38], notes: ["Source preview derived from a 16-bit asset."] }),
  preview("preview-4-public", 4, "All That Remains", "Vespera", "policy-public", "Public protected excerpt", "Public", "Ready", { previewEndSeconds: 60, previewDurationSeconds: 60 }),
  preview("preview-5-public", 5, "Chasing the Light", "Hollow Skies", "policy-restricted", "Disabled public preview", "Public", "Revoked", { watermarkType: "NONE", watermarkPositions: [], failureCode: "PREVIEW_RIGHTS_RESTRICTED", failureMessage: "Active ownership dispute." }),
  preview("preview-16-public-v1", 16, "Northern Lines", "Arco North", "policy-public", "Expired public preview", "Public", "Regeneration Required", { sourceAssetId: "asset-temp-16-preview", expiresAt: "2026-07-10T12:00:00.000Z", failureCode: "PREVIEW_EXPIRED", failureMessage: "Rights review expired and the source asset changed." }),
  preview("preview-15-public", 15, "The End of Jason Todd", "The SMYRK", "policy-public", "Protected editorial excerpt", "Public", "Ready", { sourceAssetId: "asset-preview-15-aac", outputAssetId: "asset-preview-15-aac", watermarkType: "SPOKEN_INTRO", watermarkPositions: [8], previewEndSeconds: 84, previewDurationSeconds: 84, outputFormat: "M4A", outputBitrate: "160 kbps", metadata: { protectedEditorialPreview: true }, notes: ["Original master remains locked; this record represents the existing derived browser preview."] }),
  preview("preview-17-public", 17, "Heavy Weather", "Hollow Skies", "policy-public", "Public 30-second excerpt", "Public", "Ready", { previewEndSeconds: 30, previewDurationSeconds: 30, watermarkPositions: [8] }),
  preview("preview-18-internal", 18, "Quiet Machines", "Soren", "policy-internal", "Internal review preview", "Internal", "Ready", { watermarkType: "NONE", watermarkPositions: [], previewEndSeconds: 90, previewDurationSeconds: 90, sessionTraceability: true, expiresAt: "2026-08-01T12:00:00.000Z" }),
  preview("preview-9-public", 9, "Meridian", "Atlas Collective", "policy-public", "Public watermarked excerpt", "Public", "Ready", { sourceAssetId: "asset-preview-9-approved", watermarkPositions: [8,38], previewEndSeconds: 60, previewDurationSeconds: 60 }),
  preview("preview-12-public", 12, "Fault Lines", "Hollow Skies", "policy-public", "Public watermarked excerpt", "Public", "Ready", { sourceAssetId: "asset-preview-12-approved", watermarkPositions: [8,38], previewEndSeconds: 60, previewDurationSeconds: 60 }),
];

const jobTypes = ["Source validation","Preview extraction","Watermark preparation","Watermark insertion simulation","Encoding","Loudness normalization simulation","Waveform generation","Storage registration","Access-policy creation","Search availability update"];
export const createJobsForPreview = (previewId, trackId, status = "Queued") => jobTypes.map((jobType, index) => ({ id: `job-${previewId}-${index+1}`, previewId, trackId, jobType, status, progress: status === "Completed" ? 100 : 0, startedAt: null, completedAt: status === "Completed" ? "2026-07-15T11:00:00.000Z" : null, retryCount: 0, result: status === "Completed" ? "Mock step completed." : null, failureCode: null, failureMessage: null }));

export const DEFAULT_PREVIEW_JOBS = [
  ...createJobsForPreview("preview-2-public", 2).map((job,index)=>index<3?{...job,status:"Completed",progress:100,completedAt:"2026-07-16T08:00:00.000Z"}:index===3?{...job,status:"Processing",progress:45,startedAt:"2026-07-16T08:01:00.000Z"}:job),
  ...createJobsForPreview("preview-1-public", 1, "Completed"),
];

export const DEFAULT_WATERMARK_STATE = {
  version: 1,
  policies: DEFAULT_PREVIEW_POLICIES,
  policyVersions: [],
  voiceProfiles: DEFAULT_VOICE_PROFILES,
  previews: DEFAULT_WATERMARKED_PREVIEWS,
  jobs: DEFAULT_PREVIEW_JOBS,
  sessions: [],
  analyticsEvents: [],
  activity: [],
  notifications: [],
  selectedPreviewId: "preview-1-public",
  collections: [{ id: "collection-northstar-private", name: "Northstar Private Selection", organizationId: "org-northstar", projectId: "project-aurora", trackIds: [1], expiresAt: "2026-08-15T12:00:00.000Z", confidentiality: "Private buyer collection", concierge: "beatmondo VIP desk" }],
};
