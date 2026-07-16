import { buyerVerificationService } from "../verification/buyerVerificationService.js";
import { calculateEffectiveAccess, membershipService } from "../membership/membershipService.js";
import { rightsService } from "../rights/rightsService.js";
import {
  DEFAULT_COLLECTIONS,
  DEFAULT_RANKING,
  DEFAULT_SAVED_SEARCHES,
  DEFAULT_SEARCH_FILTERS,
  SEARCH_CORRECTIONS,
  SEARCH_STORAGE_KEY,
  SEARCH_SYNONYMS,
  TRACK_SEARCH_OVERLAYS,
} from "./searchData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const internalRoles = new Set(["super_administrator", "administrator", "catalog_manager", "licensing_manager"]);
const tierRank = { Public: 0, Discovery: 1, Professional: 2, VIP: 3, "Internal Only": 4 };

export function normalizeSearchText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[-_/]+/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .replace(/\b(instrumentals|tracks|songs)\b/g, (match) => match.replace(/s$/, ""))
    .replace(/\bup tempo\b/g, "uptempo")
    .replace(/\s+/g, " ")
    .trim();
}

const durationSeconds = (duration = "0:00") => {
  const [minutes, seconds] = String(duration).split(":").map(Number);
  return (minutes || 0) * 60 + (seconds || 0);
};

function buildTrackDocument(track, index, state) {
  const overlay = TRACK_SEARCH_OVERLAYS[track.id] || {};
  const rights = rightsService.getByTrack(track.id);
  const buyerRights = rightsService.getBuyerSummary(track.id);
  const accessTier = overlay.accessTier || (track.vipOnly ? "VIP" : "Discovery");
  const genres = [track.genre, track.subgenre].filter(Boolean);
  const moods = [...new Set([track.mood, ...(track.tags || [])])];
  const usageTypes = overlay.usageTypes || [track.usage];
  const keywords = [track.energy, track.tempo, track.sceneFit, track.valueSignal, ...(track.tags || [])].filter(Boolean);
  const searchableText = normalizeSearchText([
    track.title,
    track.artist,
    track.composer,
    genres.join(" "),
    moods.join(" "),
    usageTypes.join(" "),
    track.instrumentation,
    track.era,
    track.key,
    keywords.join(" "),
    internalRoles.has(state?.actorRole) ? rights?.isrc : "",
  ].join(" "));
  const indexedOverride = state?.indexOverrides?.[track.id] || {};
  let ingestionRecord = null;
  let storageAssets = [];
  let watermarkedPreviews = [];
  try {
    const ingestionState = JSON.parse(
      window.localStorage.getItem("beatmondo-track-ingestion-v1"),
    );
    ingestionRecord = ingestionState?.records?.find(
      (item) => String(item.trackId) === String(track.id),
    );
    const storageState = JSON.parse(
      window.localStorage.getItem("beatmondo-file-storage-streaming-v1"),
    );
    storageAssets = (storageState?.assets || []).filter(
      (asset) =>
        String(asset.relatedTrackId) === String(track.id) &&
        asset.current !== false,
    );
    const previewState = JSON.parse(
      window.localStorage.getItem("beatmondo-watermarked-previews-v1"),
    );
    watermarkedPreviews = (previewState?.previews || []).filter(
      (preview) =>
        String(preview.trackId) === String(track.id) &&
        preview.current &&
        !preview.organizationId,
    );
  } catch {}
  const ingestionVisible = !ingestionRecord || ingestionRecord.status === "Published";
  const hasStorageRecords = storageAssets.length > 0;
  const storageReady = (storageClass) =>
    storageAssets.some(
      (asset) =>
        asset.storageClass === storageClass &&
        ["Ready", "Ready with Warning"].includes(asset.status),
    );
  const effectiveIndexStatus = ingestionVisible
    ? indexedOverride.status || "Indexed"
    : ingestionRecord?.searchReadiness?.status || "Hidden";
  const readyWatermarkedPreviews = watermarkedPreviews.filter((preview) =>
    ["Ready", "Ready with Warning"].includes(preview.status),
  );
  const actorPreviewTier = state?.actorRole === "vip_buyer"
    ? "VIP"
    : state?.actorRole === "professional_buyer"
      ? "Professional"
      : "Public";
  const previewLabel = readyWatermarkedPreviews.some((preview) => preview.accessTier === actorPreviewTier)
    ? actorPreviewTier === "VIP"
      ? "VIP Preview"
      : actorPreviewTier === "Professional"
        ? "Protected Preview"
        : "Watermarked Preview"
    : readyWatermarkedPreviews.some((preview) => preview.accessTier === "Public")
      ? "Watermarked Preview"
      : watermarkedPreviews.length
        ? "Preview Unavailable"
        : "Protected Preview";
  return {
    id: `search-track-${track.id}`,
    entityType: "track",
    entityId: track.id,
    title: track.title,
    subtitle: track.artist,
    description: `${track.genre} · ${track.mood} · ${track.usage}`,
    searchableText,
    keywords,
    tags: track.tags || [],
    accessLevel: accessTier,
    visibility: ingestionVisible
      ? indexedOverride.visibility || "Published"
      : "Hidden",
    status: effectiveIndexStatus,
    searchableFields: { title: track.title, artist: track.artist, genre: genres, mood: moods, usage: usageTypes, instrumentation: track.instrumentation },
    filterFields: {
      genre: genres,
      mood: moods,
      usage: usageTypes,
      tempo: [track.tempo === "Upbeat" ? "Uptempo" : track.tempo],
      vocalType: [overlay.vocalType || (track.vocal === "Instrumental" ? "Instrumental" : "Male Vocal")],
      language: [overlay.language || "English"],
      instrumentation: String(track.instrumentation || "").split(",").map((item) => item.trim()),
      accessTier: [accessTier],
      territory:
        rights?.territories?.included?.includes("Worldwide") ||
        track.rightsData?.territory === "Worldwide"
          ? ["Worldwide"]
          : rights?.territories?.included || ["Manual Review"],
      rightsStatus: [rights?.status || (track.rightsData?.rightsVerified ? "Fully Verified" : "Unreviewed")],
      licensingEligibility: [buyerRights?.eligibility || (track.rightsData?.licensingEligible ? "Eligible" : "Manual Review Required")],
      sampleStatus: [rights?.samples?.some((sample) => sample.clearanceRequired && sample.status !== "Fully Cleared") ? "Clearance Required" : "No Open Sample Issue"],
      indexStatus: [effectiveIndexStatus],
    },
    sortFields: {
      title: track.title,
      artist: track.artist,
      duration: durationSeconds(track.duration),
      bpm: parseInt(track.bpm, 10) || null,
      popularity: overlay.popularityScore || 50,
      recency: overlay.recentlyAdded ? 100 : Math.max(1, 70 - index),
      rightsCompleteness: rights?.completeness?.percentage ?? (track.rightsData?.rightsVerified ? 100 : 45),
    },
    popularity: overlay.popularityScore || 50,
    recency: overlay.recentlyAdded ? 100 : Math.max(1, 70 - index),
    rightsEligibility: buyerRights?.eligibility || "Manual Review Required",
    rightsStatus: rights?.status || "Unreviewed",
    membershipRequirement: accessTier,
    verificationRequirement: ["Professional", "VIP"].includes(accessTier) ? "Approved buyer verification" : "None",
    createdAt: overlay.recentlyAdded ? "2026-07-10T10:00:00.000Z" : `2026-0${(index % 6) + 1}-10T10:00:00.000Z`,
    updatedAt: indexedOverride.updatedAt || "2026-07-16T10:00:00.000Z",
    indexedAt: indexedOverride.indexedAt || "2026-07-16T10:05:00.000Z",
    metadataQuality: calculateMetadataQuality(track),
    source: track,
    masterAvailable: Boolean((hasStorageRecords ? storageReady("PRIVATE_MASTER") : track.assets?.wavMaster) && buyerRights?.allowedAssets?.includes("Master")),
    stemsAvailable: Boolean((hasStorageRecords ? storageReady("PRIVATE_STEMS") : track.assets?.stems) && buyerRights?.allowedAssets?.includes("Stems")),
    instrumentalAvailable: Boolean(track.assets?.instrumental),
    cleanVersionAvailable: Boolean(!overlay.explicit && (track.assets?.instrumental || track.assets?.alternateMixes)),
    previewAvailable: Boolean(ingestionVisible && (watermarkedPreviews.length ? readyWatermarkedPreviews.length > 0 : hasStorageRecords ? storageReady("PROTECTED_PREVIEW") : track.assets?.preview)),
    previewLabel,
    preApprovedTerms: Boolean(overlay.preApprovedTerms),
    approvalRequired: Boolean(overlay.approvalRequired || buyerRights?.approvals !== "No additional approval"),
    explicit: Boolean(overlay.explicit),
    featured: Boolean(overlay.featured),
    recentlyAdded: Boolean(overlay.recentlyAdded),
    ownerOrganizationId: track.artist === "The SMYRK" ? "org-smyrk" : null,
  };
}

export function calculateMetadataQuality(track) {
  const fields = ["title", "artist", "genre", "mood", "usage", "bpm", "duration", "vocal", "instrumentation", "era", "status", "availability", "rights", "tags"];
  const missing = fields.filter((key) => !track[key] || (Array.isArray(track[key]) && !track[key].length));
  return { percentage: Math.round(((fields.length - missing.length) / fields.length) * 100), missing, warning: missing.length ? "Missing fields reduce discovery and filter accuracy." : "Search metadata is complete.", nextAction: missing.length ? `Add ${missing[0]}` : "Monitor source changes" };
}

function seedState() {
  return {
    version: 1,
    sourceDataVersion: 1,
    synonymVersion: 1,
    rankingVersion: 1,
    lastRebuildAt: now(),
    savedSearches: clone(DEFAULT_SAVED_SEARCHES),
    recentSearches: {},
    savedTracks: { "user-olivia": [1, 5], "user-ethan": [2] },
    collections: clone(DEFAULT_COLLECTIONS),
    savedCollections: {},
    synonyms: clone(SEARCH_SYNONYMS),
    ranking: clone(DEFAULT_RANKING),
    analytics: [],
    indexOverrides: { 8: { status: "Outdated" }, 13: { status: "Pending" }, 20: { status: "Failed" } },
  };
}

export function readSearchState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEARCH_STORAGE_KEY));
    if (parsed?.version && parsed.savedSearches && parsed.synonyms) return parsed;
  } catch {}
  const seeded = seedState();
  try { window.localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(seeded)); } catch {}
  return seeded;
}

function writeSearchState(state) {
  try { window.localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(state)); } catch { return false; }
  return true;
}

export function buildSearchContext(user) {
  const internal = Boolean(user && (user.permissions?.includes("*") || internalRoles.has(user.role)));
  const verification = user?.userType === "buyer" ? buyerVerificationService.getByUser(user.id) : null;
  const membership = user?.userType === "buyer" ? membershipService.getCurrentMembership(user.id) : null;
  const access = internal ? { effectivePlan: "Internal", has: () => true, reasons: [] } : calculateEffectiveAccess(user, verification, membership);
  let accessTier = "Public";
  if (internal) accessTier = "Internal Only";
  else if (user?.userType === "artist") accessTier = "Discovery";
  else if (access.effectivePlan?.includes("VIP")) accessTier = "VIP";
  else if (access.effectivePlan?.includes("Professional")) accessTier = "Professional";
  else if (user) accessTier = "Discovery";
  return { user, internal, verification, membership, access, accessTier, organizationId: user?.organizationId || null };
}

export function canViewSearchDocument(document, context, { allowTeaser = false } = {}) {
  if (!document || document.visibility === "Removed") return { visible: false, locked: false };
  if (context.internal) return { visible: true, locked: false };
  if (document.visibility !== "Published" || document.accessLevel === "Internal Only") return { visible: false, locked: false };
  if (context.user?.userType === "artist" && document.ownerOrganizationId === context.organizationId) return { visible: true, locked: false };
  const required = tierRank[document.accessLevel] ?? 4;
  const actual = tierRank[context.accessTier] ?? 0;
  if (required <= actual) return { visible: true, locked: false };
  if (allowTeaser && actual > 0 && required === actual + 1 && document.source?.teaserApproved) return { visible: true, locked: true };
  return { visible: false, locked: false };
}

function expandedQuery(query, synonyms) {
  const normalized = normalizeSearchText(query);
  const additions = [];
  Object.entries(synonyms).forEach(([group, values]) => {
    const normalizedValues = values.map(normalizeSearchText);
    if (normalized.includes(normalizeSearchText(group)) || normalizedValues.some((value) => normalized.includes(value))) additions.push(group, ...values);
  });
  return normalizeSearchText([normalized, ...additions].join(" "));
}

export function getSpellingCorrection(query) {
  const tokens = normalizeSearchText(query).split(" ");
  let changed = false;
  const corrected = tokens.map((token) => {
    const match = Object.entries(SEARCH_CORRECTIONS).find(([wrong]) => normalizeSearchText(wrong) === token);
    if (!match) return token;
    changed = true;
    return normalizeSearchText(match[1]);
  }).join(" ");
  return changed ? corrected : null;
}

export function parseNaturalLanguageQuery(query) {
  const normalized = normalizeSearchText(query);
  const interpreted = [];
  const filters = {};
  const take = (key, label, values) => {
    const match = values.find((value) => normalized.includes(normalizeSearchText(value)));
    if (match) { filters[key] = key === "duration" ? match : [match]; interpreted.push({ key, label, value: match }); }
  };
  take("mood", "Mood", ["Uplifting", "Hopeful", "Dark", "Emotional", "Energetic", "Tense", "Reflective", "Nostalgic", "Romantic", "Triumphant", "Mysterious", "Dreamy", "Warm", "Inspiring"]);
  take("genre", "Genre", ["Indie Rock", "Alternative", "Pop", "Electronic", "Cinematic", "Soul", "R&B", "Folk", "Ambient", "Rock", "Acoustic", "Synthwave", "Orchestral"]);
  take("usage", "Usage", ["Automotive", "Advertising", "Trailer", "Feature Film", "Television", "Documentary", "Technology", "Luxury", "Travel", "Sports"]);
  take("vocalType", "Vocal", ["Female Vocal", "Male Vocal", "Instrumental", "Mixed Vocal", "Choir", "No Lead Vocal"]);
  if (/\bindie( track| music)?\b/.test(normalized) && !filters.genre) {
    filters.genre = ["Indie Rock"];
    interpreted.push({ key: "genre", label: "Genre", value: "Indie Rock" });
  }
  if (/\b(car|automotive|vehicle)\b/.test(normalized) && !filters.usage) {
    filters.usage = ["Automotive"];
    interpreted.push({ key: "usage", label: "Usage", value: "Automotive" });
  }
  if (/\bcommercial\b/.test(normalized)) {
    filters.usage = [...new Set([...(filters.usage || []), "Advertising"] )];
    interpreted.push({ key: "usage", label: "Usage", value: "Advertising" });
  }
  if (/under (two|2) minutes/.test(normalized)) { filters.duration = "Under 2 minutes"; interpreted.push({ key: "duration", label: "Duration", value: "Under 2 minutes" }); }
  if (/under (three|3) minutes/.test(normalized)) { filters.duration = "Under 3 minutes"; interpreted.push({ key: "duration", label: "Duration", value: "Under 3 minutes" }); }
  if (/worldwide/.test(normalized)) { filters.territory = ["Worldwide"]; interpreted.push({ key: "territory", label: "Territory", value: "Worldwide" }); }
  if (/stems?/.test(normalized)) { filters.stemsAvailable = true; interpreted.push({ key: "stemsAvailable", label: "Availability", value: "Stems" }); }
  if (/pre approved|preapproved/.test(normalized)) { filters.preApprovedTerms = true; interpreted.push({ key: "preApprovedTerms", label: "Terms", value: "Pre-approved" }); }
  if (/vip/.test(normalized)) { filters.accessTier = ["VIP"]; interpreted.push({ key: "accessTier", label: "Access", value: "VIP" }); }
  if (/no explicit|clean version/.test(normalized)) { filters.explicit = "Clean only"; filters.cleanVersionAvailable = true; interpreted.push({ key: "explicit", label: "Content", value: "Clean only" }); }
  return { filters, interpreted };
}

function matchFilters(document, filters, context, savedIds) {
  for (const [key, value] of Object.entries(filters || {})) {
    if (value === "" || value === false || value === "Any" || (Array.isArray(value) && !value.length)) continue;
    if (key === "bpmMin" && document.sortFields.bpm != null && document.sortFields.bpm < Number(value)) return false;
    if (key === "bpmMax" && document.sortFields.bpm != null && document.sortFields.bpm > Number(value)) return false;
    if (key === "duration") {
      const seconds = document.sortFields.duration;
      if (value === "Under 30 seconds" && seconds >= 30) return false;
      if (value === "30–60 seconds" && (seconds < 30 || seconds > 60)) return false;
      if (value === "1–2 minutes" && (seconds < 60 || seconds > 120)) return false;
      if (value === "2–3 minutes" && (seconds < 120 || seconds > 180)) return false;
      if (value === "3–5 minutes" && (seconds < 180 || seconds > 300)) return false;
      if (value === "Over 5 minutes" && seconds <= 300) return false;
      if (value === "Under 2 minutes" && seconds >= 120) return false;
      if (value === "Under 3 minutes" && seconds >= 180) return false;
      continue;
    }
    if (key === "explicit" && value === "Clean only" && document.explicit) return false;
    if (key === "explicit" && value === "Explicit only" && !document.explicit) return false;
    if (key === "savedOnly" && value && !savedIds.includes(document.entityId)) return false;
    if (["stemsAvailable", "masterAvailable", "instrumentalAvailable", "cleanVersionAvailable", "preApprovedTerms", "recentlyAdded", "featured", "approvalRequired"].includes(key)) {
      if (value && !document[key]) return false;
      continue;
    }
    const candidate = document.filterFields[key] || [];
    const requested = Array.isArray(value) ? value : [value];
    if (!requested.some((item) => candidate.map(normalizeSearchText).includes(normalizeSearchText(item)))) return false;
  }
  if (!context.internal && ["Blocked", "Not Licensable"].includes(document.rightsEligibility)) return false;
  return true;
}

export function calculateRelevance(document, query, ranking, context) {
  const q = normalizeSearchText(query);
  if (!q) return (document.featured ? ranking.featured : 0) + document.recency * 0.05 + document.popularity * 0.02;
  const tokens = q.split(" ").filter(Boolean);
  const title = normalizeSearchText(document.title);
  const artist = normalizeSearchText(document.subtitle);
  let score = 0;
  if (title === q) score += ranking.title * 4;
  else if (title.includes(q)) score += ranking.title * 2;
  if (artist === q || `${artist}`.includes(q)) score += ranking.artist * 2;
  const fields = document.searchableFields;
  const fieldWeights = { genre: ranking.genre, mood: ranking.mood, usage: ranking.usage, instrumentation: ranking.instrumentation };
  Object.entries(fieldWeights).forEach(([key, weight]) => {
    const value = normalizeSearchText(Array.isArray(fields[key]) ? fields[key].join(" ") : fields[key]);
    tokens.forEach((token) => { if (value.includes(token)) score += weight; });
  });
  tokens.forEach((token) => { if (document.searchableText.includes(token)) score += 3; });
  score += document.popularity * ranking.popularity * 0.002;
  score += document.recency * ranking.recency * 0.002;
  if (["Eligible", "Eligible with Restrictions"].includes(document.rightsEligibility)) score += ranking.rightsReadiness;
  if (document.featured) score += ranking.featured;
  if (context.accessTier === "VIP" && document.accessLevel === "VIP") score += ranking.vipCuration;
  return score;
}

function sortDocuments(documents, sort) {
  const result = [...documents];
  const by = (key, direction = 1) => result.sort((a, b) => direction * ((a.sortFields[key] ?? 0) > (b.sortFields[key] ?? 0) ? 1 : -1));
  if (sort === "recent") by("recency", -1);
  else if (sort === "popular") by("popularity", -1);
  else if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "artist") result.sort((a, b) => a.subtitle.localeCompare(b.subtitle));
  else if (sort === "duration-short") by("duration");
  else if (sort === "duration-long") by("duration", -1);
  else if (sort === "bpm-low") by("bpm");
  else if (sort === "bpm-high") by("bpm", -1);
  else if (sort === "licensing-readiness") result.sort((a, b) => Number(["Eligible", "Eligible with Restrictions"].includes(b.rightsEligibility)) - Number(["Eligible", "Eligible with Restrictions"].includes(a.rightsEligibility)) || b.score - a.score);
  else if (sort === "rights-completeness") by("rightsCompleteness", -1);
  else result.sort((a, b) => b.score - a.score);
  return result;
}

export const searchService = {
  getState: readSearchState,
  parseNaturalLanguageQuery,
  calculateRelevance,
  canViewSearchDocument,
  search(tracks, { query = "", filters = DEFAULT_SEARCH_FILTERS, sort = query ? "relevance" : "recent", user = null, record = false, source = "Search" } = {}) {
    const state = readSearchState();
    const context = buildSearchContext(user);
    if (
      normalizeSearchText(query) === "simulate search error" ||
      (filters.bpmMin !== "" &&
        filters.bpmMax !== "" &&
        Number(filters.bpmMin) > Number(filters.bpmMax))
    ) {
      return {
        documents: [],
        total: 0,
        correction: null,
        effectiveQuery: query,
        parsed: parseNaturalLanguageQuery(query),
        facets: {},
        context,
        error:
          Number(filters.bpmMin) > Number(filters.bpmMax)
            ? "BPM minimum cannot be greater than BPM maximum."
            : "The simulated search service is temporarily unavailable.",
      };
    }
    const correction = getSpellingCorrection(query);
    const effectiveQuery = correction || query;
    const expanded = expandedQuery(effectiveQuery, state.synonyms);
    const savedIds = state.savedTracks[user?.id || "anonymous"] || [];
    let documents = tracks.map((track, index) => buildTrackDocument(track, index, { ...state, actorRole: user?.role }));
    documents = documents.filter((document) => canViewSearchDocument(document, context).visible);
    documents = documents.filter((document) => !expanded || expanded.split(" ").some((token) => token.length > 1 && document.searchableText.includes(token)));
    documents = documents.filter((document) => matchFilters(document, filters, context, savedIds));
    documents = documents.map((document) => ({ ...document, score: calculateRelevance(document, expanded, state.ranking, context) }));
    documents = sortDocuments(documents, sort);
    const facets = this.getFacets(documents);
    const parsed = parseNaturalLanguageQuery(query);
    if (record) this.recordSearch(user, query, filters, documents.length, source);
    return { documents, total: documents.length, correction, effectiveQuery, parsed, facets, context };
  },
  getFacets(documents) {
    const keys = ["genre", "mood", "usage", "tempo", "vocalType", "language", "accessTier", "territory", "rightsStatus", "licensingEligibility", "indexStatus"];
    return Object.fromEntries(keys.map((key) => {
      const counts = {};
      documents.forEach((doc) => (doc.filterFields[key] || []).forEach((value) => { counts[value] = (counts[value] || 0) + 1; }));
      return [key, counts];
    }));
  },
  getSuggestions(tracks, query, user) {
    if (!normalizeSearchText(query)) return [];
    const result = this.search(tracks, { query, user, sort: "relevance" });
    const suggestions = result.documents.slice(0, 5).map((doc) => ({ type: "Tracks", label: doc.title, subtitle: doc.subtitle, query: doc.title, trackId: doc.entityId }));
    const artists = [...new Set(result.documents.map((doc) => doc.subtitle))].slice(0, 2).map((artist) => ({ type: "Artists", label: artist, query: artist }));
    const terms = [...new Set(result.documents.flatMap((doc) => [...doc.filterFields.genre, ...doc.filterFields.mood]))].filter((value) => normalizeSearchText(value).includes(normalizeSearchText(query))).slice(0, 2).map((value) => ({ type: "Genres & moods", label: value, query: value }));
    return [...suggestions, ...artists, ...terms].slice(0, 9);
  },
  recordSearch(user, query, filters, resultCount, source = "Search") {
    const state = readSearchState();
    const key = user?.id || "anonymous-session";
    const recent = { id: uid("recent"), query, filters: clone(filters), resultCount, date: now(), context: source, selectedResult: null };
    state.recentSearches[key] = [recent, ...(state.recentSearches[key] || []).filter((item) => item.query !== query)].slice(0, 12);
    state.analytics.unshift({ id: uid("event"), event: resultCount ? "Search submitted" : "No results", userId: user?.id || null, organizationId: user?.organizationId || null, query, filters: clone(filters), resultCount, timestamp: now(), accessTier: user?.membershipTier || "Public", source });
    writeSearchState(state);
  },
  getRecent(user) { return clone(readSearchState().recentSearches[user?.id || "anonymous-session"] || []); },
  removeRecent(user, id) { const state = readSearchState(); const key = user?.id || "anonymous-session"; state.recentSearches[key] = (state.recentSearches[key] || []).filter((item) => item.id !== id); return writeSearchState(state); },
  clearRecent(user) { const state = readSearchState(); state.recentSearches[user?.id || "anonymous-session"] = []; return writeSearchState(state); },
  getSavedSearches(user) { return clone(readSearchState().savedSearches.filter((item) => item.userId === user?.id)); },
  createSavedSearch(user, payload) {
    if (!user) return { ok: false, message: "Sign in to save searches." };
    const name = String(payload.name || "").trim();
    if (name.length < 3) return { ok: false, message: "Use a saved-search name of at least three characters." };
    const state = readSearchState();
    if (state.savedSearches.some((item) => item.userId === user.id && normalizeSearchText(item.name) === normalizeSearchText(name))) return { ok: false, message: "A saved search with this name already exists." };
    const item = { id: uid("saved"), userId: user.id, name, query: payload.query || "", filters: clone(payload.filters || {}), sort: payload.sort || "relevance", resultType: "Music", notificationEnabled: Boolean(payload.notificationEnabled), createdAt: now(), updatedAt: now(), lastRunAt: now(), lastResultCount: payload.lastResultCount || 0 };
    state.savedSearches.unshift(item); writeSearchState(state); return { ok: true, savedSearch: clone(item) };
  },
  updateSavedSearch(user, id, changes) { const state = readSearchState(); const item = state.savedSearches.find((entry) => entry.id === id && entry.userId === user?.id); if (!item) return { ok: false, message: "Saved search not found." }; Object.assign(item, clone(changes), { updatedAt: now() }); writeSearchState(state); return { ok: true, savedSearch: clone(item) }; },
  deleteSavedSearch(user, id) { const state = readSearchState(); const before = state.savedSearches.length; state.savedSearches = state.savedSearches.filter((item) => !(item.id === id && item.userId === user?.id)); writeSearchState(state); return state.savedSearches.length < before; },
  duplicateSavedSearch(user, id) { const source = this.getSavedSearches(user).find((item) => item.id === id); return source ? this.createSavedSearch(user, { ...source, name: `${source.name} copy` }) : { ok: false, message: "Saved search not found." }; },
  simulateNewMatches(user, id) { const state = readSearchState(); const item = state.savedSearches.find((entry) => entry.id === id && entry.userId === user?.id); if (!item) return { ok: false, message: "Saved search not found." }; item.lastResultCount += 2; item.updatedAt = now(); state.analytics.unshift({ id: uid("event"), event: "Saved-search notification", userId: user.id, query: item.query, resultCount: item.lastResultCount, timestamp: now(), source: "Saved Search" }); writeSearchState(state); return { ok: true, message: `2 new tracks match ‘${item.name}’.` }; },
  getSavedTracks(user) { return clone(readSearchState().savedTracks[user?.id || "anonymous"] || []); },
  toggleSavedTrack(user, trackId) { if (!user) return { ok: false, message: "Sign in to save tracks." }; const state = readSearchState(); const list = state.savedTracks[user.id] || []; state.savedTracks[user.id] = list.includes(trackId) ? list.filter((id) => id !== trackId) : [...list, trackId]; writeSearchState(state); return { ok: true, saved: state.savedTracks[user.id].includes(trackId) }; },
  getCollections(tracks, user) { const state = readSearchState(); const context = buildSearchContext(user); return clone(state.collections.filter((collection) => collection.published && (!collection.organizationId || context.internal || collection.organizationId === context.organizationId) && tierRank[collection.accessTier] <= tierRank[context.accessTier]).map((collection) => ({ ...collection, trackCount: collection.trackIds.filter((id) => tracks.some((track) => track.id === id)).length }))); },
  getCollection(tracks, id, user) { return this.getCollections(tracks, user).find((item) => item.id === id || item.slug === id) || null; },
  getSimilarTracks(tracks, trackId, user) { const source = tracks.find((track) => track.id === trackId); if (!source) return []; const visible = this.search(tracks, { user }).documents.filter((doc) => doc.entityId !== trackId); return visible.map((doc) => ({ ...doc, similarity: (doc.source.genre === source.genre ? 5 : 0) + (doc.source.mood === source.mood ? 4 : 0) + (doc.source.tempo === source.tempo ? 2 : 0) + (doc.source.vocal === source.vocal ? 2 : 0) + (doc.source.usage === source.usage ? 2 : 0) })).sort((a, b) => b.similarity - a.similarity).slice(0, 6); },
  getRelatedArtists(tracks, artistName, user) { const artistTracks = tracks.filter((track) => track.artist === artistName); const visible = this.search(tracks, { user }).documents; const scores = {}; visible.filter((doc) => doc.subtitle !== artistName).forEach((doc) => { scores[doc.subtitle] = (scores[doc.subtitle] || 0) + artistTracks.some((track) => track.genre === doc.source.genre) * 3 + artistTracks.some((track) => track.mood === doc.source.mood) * 2; }); return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, score]) => ({ name, score })); },
  getAnalytics() { const state = readSearchState(); const events = state.analytics; const searches = events.filter((event) => ["Search submitted", "No results"].includes(event.event)); const countBy = (key) => Object.entries(searches.reduce((acc, item) => { const value = item[key] || "None"; acc[value] = (acc[value] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]); return { totalSearches: searches.length, uniqueUsers: new Set(searches.map((item) => item.userId || "anonymous")).size, noResultSearches: searches.filter((item) => !item.resultCount).length, averageResults: searches.length ? Math.round(searches.reduce((sum, item) => sum + item.resultCount, 0) / searches.length) : 0, topQueries: countBy("query").slice(0, 6), events: clone(events.slice(0, 30)) }; },
  getIndex(tracks, user) { const state = readSearchState(); return tracks.map((track, index) => buildTrackDocument(track, index, { ...state, actorRole: user?.role })); },
  rebuildSearchIndex() { const state = readSearchState(); state.indexOverrides = {}; state.lastRebuildAt = now(); state.version += 1; writeSearchState(state); return { ok: true, version: state.version }; },
  updateIndexStatus(trackId, status) { const state = readSearchState(); state.indexOverrides[trackId] = { ...(state.indexOverrides[trackId] || {}), status, updatedAt: now(), indexedAt: status === "Indexed" ? now() : state.indexOverrides[trackId]?.indexedAt }; writeSearchState(state); return true; },
  updateSynonyms(synonyms) { const state = readSearchState(); state.synonyms = clone(synonyms); state.synonymVersion += 1; writeSearchState(state); return true; },
  updateRanking(ranking) { const state = readSearchState(); state.ranking = clone(ranking); state.rankingVersion += 1; writeSearchState(state); return true; },
  resetSearchInfrastructureDemoData() { const state = seedState(); writeSearchState(state); return clone(state); },
  syncTrackToSearchIndex(trackId) { return this.updateIndexStatus(trackId, "Indexed"); },
};

searchService.searchTracks = (...args) => searchService.search(...args);
searchService.getRecommendations = (tracks, user) =>
  searchService
    .search(tracks, { user, sort: "licensing-readiness" })
    .documents.filter((document) =>
      ["Eligible", "Eligible with Restrictions"].includes(
        document.rightsEligibility,
      ),
    )
    .slice(0, 6);

export const searchVisibilityService = { canViewSearchDocument, buildSearchContext };
export const searchIndexService = { rebuildSearchIndex: () => searchService.rebuildSearchIndex(), syncTrackToSearchIndex: (trackId) => searchService.syncTrackToSearchIndex(trackId) };
export const savedSearchService = { getSavedSearches: (user) => searchService.getSavedSearches(user), createSavedSearch: (user, payload) => searchService.createSavedSearch(user, payload) };
export const recommendationService = { getSimilarTracks: (tracks, trackId, user) => searchService.getSimilarTracks(tracks, trackId, user), getRelatedArtists: (tracks, artist, user) => searchService.getRelatedArtists(tracks, artist, user) };
export const searchAnalyticsService = { getSearchAnalytics: () => searchService.getAnalytics() };
