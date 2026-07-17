export const SEARCH_STORAGE_KEY = "beatmondo-search-infrastructure-v1";
export const SEARCH_PREFERENCES_KEY = "beatmondo-search-preferences-v1";

export const SEARCH_SYNONYMS = {
  uplifting: ["inspiring", "hopeful", "optimistic", "positive"],
  cinematic: ["epic", "filmic", "dramatic", "trailer"],
  advertising: ["commercial", "brand campaign", "promo", "branded content"],
  instrumental: ["instrumentals", "no vocals", "underscore", "no lead vocal"],
  dark: ["moody", "brooding", "tense"],
  energetic: ["fast", "uptempo", "driving", "high energy"],
  luxury: ["premium", "fashion", "elegant"],
  trailer: ["promo", "teaser", "theatrical campaign"],
};

export const SEARCH_CORRECTIONS = {
  cinamatic: "cinematic",
  instumental: "instrumental",
  upfliting: "uplifting",
  advertisment: "advertising",
  advertisng: "advertising",
  smyrk: "The SMYRK",
};

export const DEFAULT_RANKING = {
  title: 40,
  artist: 28,
  genre: 18,
  mood: 18,
  usage: 16,
  instrumentation: 10,
  description: 7,
  popularity: 5,
  recency: 5,
  rightsReadiness: 8,
  featured: 7,
  vipCuration: 5,
};

export const TRACK_SEARCH_OVERLAYS = {
  1: { accessTier: "VIP", usageTypes: ["Feature Film", "Luxury", "Trailer"], vocalType: "Instrumental", language: "None", explicit: false, preApprovedTerms: true, featured: true, recentlyAdded: false, popularityScore: 94 },
  2: { accessTier: "Professional", usageTypes: ["Advertising", "Automotive", "Branded Content"], vocalType: "Group Vocal", language: "English", explicit: false, approvalRequired: true, popularityScore: 81 },
  3: { accessTier: "Discovery", usageTypes: ["Documentary", "Technology", "Podcast"], vocalType: "Instrumental", language: "None", explicit: false, popularityScore: 72 },
  4: { accessTier: "Professional", usageTypes: ["Trailer", "Television"], vocalType: "Female Vocal", language: "English", explicit: false, popularityScore: 88 },
  5: { accessTier: "Discovery", usageTypes: ["Branded Content", "Travel", "Corporate"], vocalType: "Instrumental", language: "None", explicit: false, popularityScore: 69 },
  6: { accessTier: "Public", usageTypes: ["Streaming Series", "Social Campaign", "Advertising"], vocalType: "Male Vocal", language: "English", explicit: false, recentlyAdded: true, popularityScore: 74 },
  7: { accessTier: "Professional", usageTypes: ["Trailer", "Video Game", "Technology"], vocalType: "Instrumental", language: "None", explicit: false, popularityScore: 84 },
  8: { accessTier: "Professional", usageTypes: ["Documentary", "Feature Film"], vocalType: "Female Vocal", language: "English", explicit: false, popularityScore: 76 },
  9: { accessTier: "Discovery", usageTypes: ["Advertising", "Travel", "Live Event"], vocalType: "Choir", language: "Hindi / English", explicit: false, popularityScore: 78 },
  10: { accessTier: "VIP", usageTypes: ["Feature Film", "Luxury", "Trailer"], vocalType: "Instrumental", language: "None", explicit: false, preApprovedTerms: true, featured: true, popularityScore: 91 },
  11: { accessTier: "Professional", usageTypes: ["Luxury", "Fashion", "Advertising"], vocalType: "Female Vocal", language: "English", explicit: false, popularityScore: 83 },
  12: { accessTier: "Discovery", usageTypes: ["Streaming Series", "Sports", "Trailer"], vocalType: "Male Vocal", language: "English", explicit: true, popularityScore: 87 },
  13: { accessTier: "VIP", usageTypes: ["Luxury", "Hospitality", "Fashion"], vocalType: "Instrumental", language: "None", explicit: false, popularityScore: 79 },
  14: { accessTier: "Public", usageTypes: ["Advertising", "Automotive", "Social Campaign"], vocalType: "Mixed Vocal", language: "English", explicit: false, preApprovedTerms: true, recentlyAdded: true, popularityScore: 90 },
  15: { accessTier: "Public", usageTypes: ["Feature Film", "Television", "Trailer"], vocalType: "Male Vocal", language: "English", explicit: false, featured: true, popularityScore: 73 },
  16: { accessTier: "Discovery", usageTypes: ["Automotive", "Travel", "Advertising"], vocalType: "Instrumental", language: "None", explicit: false, recentlyAdded: true, popularityScore: 71 },
  17: { accessTier: "Professional", usageTypes: ["Trailer", "Sports", "Video Game"], vocalType: "Female Vocal", language: "English", explicit: false, recentlyAdded: true, popularityScore: 82 },
  18: { accessTier: "Public", usageTypes: ["Technology", "Corporate", "Podcast"], vocalType: "Instrumental", language: "None", explicit: false, popularityScore: 67 },
  19: { accessTier: "VIP", usageTypes: ["Luxury", "Fashion", "Advertising"], vocalType: "Female Vocal", language: "English", explicit: false, preApprovedTerms: true, recentlyAdded: true, popularityScore: 86 },
  20: { accessTier: "Professional", usageTypes: ["Feature Film", "Documentary", "Streaming Series"], vocalType: "Instrumental", language: "None", explicit: false, popularityScore: 75 },
  21: { accessTier: "Public", usageTypes: ["Editorial Discovery", "Trailer", "Promotional Video"], vocalType: "Mixed Vocal", language: "English", explicit: false, featured: true, popularityScore: 72 },
};

export const DEFAULT_COLLECTIONS = [
  { id: "collection-vip-trailers", title: "VIP Trailer Selects", slug: "vip-trailer-selects", description: "Premium tension, scale, and trailer turns for priority briefs.", curator: "beatmondo Rights & Curation", accessTier: "VIP", trackIds: [1, 7, 10, 17, 19], featured: true, published: true },
  { id: "collection-uplifting", title: "Uplifting Brand Stories", slug: "uplifting-brand-stories", description: "Hopeful movement for human, automotive, and brand narratives.", curator: "beatmondo Editorial", accessTier: "Discovery", trackIds: [2, 5, 6, 9, 14, 16], featured: true, published: true },
  { id: "collection-after-dark", title: "After Dark", slug: "after-dark", description: "Brooding, nocturnal, and mysterious selections.", curator: "beatmondo Editorial", accessTier: "Discovery", trackIds: [3, 7, 10, 15, 19], featured: true, published: true },
  { id: "collection-road-motion", title: "Road and Motion", slug: "road-and-motion", description: "Driving music for automotive, travel, and kinetic edits.", curator: "beatmondo Commercial", accessTier: "Professional", trackIds: [2, 6, 12, 14, 16, 17], featured: false, published: true },
  { id: "collection-fast-review", title: "Fully Cleared for Fast Review", slug: "fully-cleared-fast-review", description: "Rights-ready tracks with an accelerated review path.", curator: "beatmondo Rights", accessTier: "Professional", trackIds: [1, 6, 9, 14, 18], featured: true, published: true },
  { id: "collection-legacy", title: "Gary Burke Legacy Picks", slug: "gary-burke-legacy-picks", description: "Archive-minded recordings selected for provenance and character.", curator: "beatmondo Archive", accessTier: "Discovery", trackIds: [4, 8, 13], featured: false, published: true },
  { id: "collection-northstar-q3", title: "Northstar — Q3 Trailer Options", slug: "northstar-q3-trailer-options", description: "A private selection for Northstar Pictures.", curator: "VIP Concierge", accessTier: "VIP", organizationId: "org-northstar", trackIds: [1, 7, 10, 17], featured: true, published: true },
  { id: "collection-northstar-auto", title: "Private Automotive Shortlist", slug: "private-automotive-shortlist", description: "Worldwide motion and uplift for the active automotive brief.", curator: "VIP Concierge", accessTier: "VIP", organizationId: "org-northstar", trackIds: [2, 14, 16, 19], featured: true, published: true },
  { id: "collection-northstar-fast", title: "Fast-Clearance VIP Picks", slug: "fast-clearance-vip-picks", description: "Priority-ready tracks for compressed timelines.", curator: "VIP Concierge", accessTier: "VIP", organizationId: "org-northstar", trackIds: [1, 10, 14, 18], featured: true, published: true },
];

export const DEFAULT_SAVED_SEARCHES = [
  { id: "saved-olivia-1", userId: "user-olivia", name: "Premium trailer tracks with stems", query: "trailer", filters: { accessTier: ["VIP"], stemsAvailable: true }, sort: "relevance", resultType: "Music", notificationEnabled: true, lastResultCount: 3 },
  { id: "saved-olivia-2", userId: "user-olivia", name: "Uplifting automotive — worldwide", query: "uplifting automotive", filters: { territory: ["Worldwide"] }, sort: "licensing-readiness", resultType: "Music", notificationEnabled: true, lastResultCount: 4 },
  { id: "saved-olivia-3", userId: "user-olivia", name: "Dark female vocal — VIP catalog", query: "dark", filters: { vocalType: ["Female Vocal"], accessTier: ["VIP"] }, sort: "relevance", resultType: "Music", notificationEnabled: false, lastResultCount: 1 },
  { id: "saved-ethan-1", userId: "user-ethan", name: "Discovery indie rock", query: "indie rock", filters: { accessTier: ["Discovery"] }, sort: "relevance", resultType: "Music", notificationEnabled: false, lastResultCount: 2 },
  { id: "saved-ethan-2", userId: "user-ethan", name: "Advertising-friendly instrumentals", query: "advertising instrumental", filters: {}, sort: "relevance", resultType: "Music", notificationEnabled: true, lastResultCount: 3 },
  { id: "saved-admin-1", userId: "user-preston", name: "Publishing incomplete", query: "", filters: { rightsStatus: ["Partially Verified", "Documents Requested"] }, sort: "rights-completeness", resultType: "Music", notificationEnabled: true, lastResultCount: 2 },
  { id: "saved-admin-2", userId: "user-preston", name: "Sample clearance required", query: "", filters: { sampleStatus: ["Clearance Required"] }, sort: "rights-completeness", resultType: "Music", notificationEnabled: true, lastResultCount: 1 },
].map((item) => ({ ...item, createdAt: "2026-07-10T10:00:00.000Z", updatedAt: "2026-07-15T10:00:00.000Z", lastRunAt: "2026-07-15T10:00:00.000Z" }));

export const DEFAULT_SEARCH_FILTERS = {
  genre: [], mood: [], usage: [], tempo: [], vocalType: [], language: [], instrumentation: [], accessTier: [], territory: [], rightsStatus: [], licensingEligibility: [], duration: "Any", bpmMin: "", bpmMax: "", explicit: "Any", stemsAvailable: false, masterAvailable: false, instrumentalAvailable: false, cleanVersionAvailable: false, preApprovedTerms: false, recentlyAdded: false, featured: false, approvalRequired: false, savedOnly: false, sampleStatus: [], indexStatus: [],
};

export const SEARCH_PERMISSIONS = ["search.public", "search.discovery", "search.professional", "search.vip", "search.internal", "search.rights", "search.buyers", "search.projects", "search.saved.manage", "search.collections.manage", "search.synonyms.manage", "search.ranking.manage", "search.index.manage", "search.analytics.view"];
