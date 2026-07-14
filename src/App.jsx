import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  Article,
  Bell,
  BookmarkSimple,
  CalendarBlank,
  CaretDown,
  CheckCircle,
  Clock,
  CloudArrowUp,
  DownloadSimple,
  Eye,
  FadersHorizontal,
  FileAudio,
  FilmSlate,
  GearSix,
  Heart,
  House,
  LockKey,
  MagnifyingGlass,
  MicrophoneStage,
  MusicNote,
  Pause,
  Play,
  ShieldCheck,
  SignIn,
  Sliders,
  Sparkle,
  UserCircle,
  UsersThree,
  X,
} from "@phosphor-icons/react";

const logo = "/assets/beatmondo-logo.png";
const opener = "/assets/beatmondo-logo-gif.mp4";

const img = {
  studio: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  vinyl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  tape: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1200&q=80",
  film: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
  edit: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
  concert: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  portrait: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
  agency: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  car: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  city: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  campaign: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  broadcast: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  documentary: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
  luxury: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
  trailer: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  streaming: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  privateStudio: "/assets/editorial/private-studio-console.webp",
  musicArchive: "/assets/editorial/music-archive-room.webp",
  scoringStage: "/assets/editorial/scoring-stage.webp",
  soulVocal: "/assets/editorial/soul-vocal-session.webp",
  supervisorSuite: "/assets/editorial/supervisor-review-suite.webp",
  mediaDesk: "/assets/editorial/media-production-desk.webp",
  legacyDetail: "/assets/editorial/gary-burke-legacy-detail.webp",
  shortSyncEdit: "/assets/editorial/short-sync-edit-suite.webp",
  mediaInterview: "/assets/editorial/media-episodes-interview.webp",
};

const buyerTiers = [
  {
    id: "discovery",
    name: "Discovery Access",
    description: "Curated browsing and protected previews for approved early-stage buyers.",
    priceLabel: "Entry access required",
    features: ["Curated browsing", "Protected previews", "Selected metadata", "Saved tracks", "Editorial discovery", "Professional-access application"],
  },
  {
    id: "professional",
    name: "Professional Buyer",
    description: "Full licensing workspace for agencies, studios, producers, and professional music buyers.",
    priceLabel: "Quote-based licensing",
    features: ["Project workspaces", "Advanced discovery", "Licensing requests", "Quotes", "Rights review", "Secure approved delivery"],
  },
  {
    id: "vip",
    name: "VIP Sync Access",
    description: "Private curated collections, priority licensing, and premium support for top-tier buyers.",
    priceLabel: "Premium access",
    features: ["Private curated collections", "Priority licensing", "Premium buyer support", "Accelerated review", "Pre-approved commercial pathways", "Exclusive opportunities"],
  },
];

const currentBuyer = {
  name: "Maya Hart",
  company: "Northstar Pictures",
  role: "Music Supervisor",
  accessTier: "VIP Sync Access",
  verified: true,
  membershipStatus: "Active",
  preApprovedTerms: true,
};

const rawTracks = [
  {
    id: 1,
    title: "Golden Hours",
    artist: "Lennox",
    composer: "Mara Lennox / Theo Vale",
    genre: "Cinematic",
    mood: "Reflective",
    tempo: "Slow",
    bpm: "72 BPM",
    era: "Modern",
    vocal: "Instrumental",
    usage: "Film / TV",
    availability: "Exclusive Option",
    duration: "2:34",
    key: "C# Major",
    instrumentation: "Felt piano, bowed guitar, warm analog pads",
    tags: ["Warm", "Uplifting", "Reflective"],
    status: "Rights Reviewed",
    image: img.studio,
    rights: "One-stop clearance available for select usages. Master controlled by a beatmondo partner rightsholder.",
  },
  {
    id: 2,
    title: "Paper Planes",
    artist: "Arco North",
    composer: "Jon Arco",
    genre: "Indie Rock",
    mood: "Driven",
    tempo: "Upbeat",
    bpm: "118 BPM",
    era: "2000s",
    vocal: "Vocal",
    usage: "Advertising",
    availability: "Available Now",
    duration: "3:12",
    key: "A Minor",
    instrumentation: "Electric guitars, live drums, handclaps, group vocal",
    tags: ["Hopeful", "Driven", "Youthful"],
    status: "Preview Only",
    image: img.concert,
    rights: "Standard brand campaign license available. Custom edit approval required for lyric changes.",
  },
  {
    id: 3,
    title: "Midnight Transit",
    artist: "Soren",
    composer: "Soren Ivers",
    genre: "Ambient",
    mood: "Moody",
    tempo: "Slow",
    bpm: "64 BPM",
    era: "Modern",
    vocal: "Instrumental",
    usage: "Documentary",
    availability: "Available Now",
    duration: "3:45",
    key: "D Minor",
    instrumentation: "Tape loops, muted piano, granular textures",
    tags: ["Nocturne", "Introspective", "Atmospheric"],
    status: "Delivery Ready",
    image: img.edit,
    rights: "Worldwide documentary usage supported. Stems available after approval.",
  },
  {
    id: 4,
    title: "All That Remains",
    artist: "Vespera",
    composer: "Ela Vesper / M. Reid",
    genre: "Soul",
    mood: "Emotional",
    tempo: "Midtempo",
    bpm: "86 BPM",
    era: "1970s",
    vocal: "Vocal",
    usage: "Trailer",
    availability: "Quote Required",
    duration: "2:58",
    key: "F Major",
    instrumentation: "Rhodes, upright bass, strings, lead vocal",
    tags: ["Haunting", "Minimal", "Emotional"],
    status: "Rights Review",
    image: img.vinyl,
    rights: "Archive master requires rights-team review before quoting.",
  },
  {
    id: 5,
    title: "Chasing the Light",
    artist: "Hollow Skies",
    composer: "Nate Calder",
    genre: "Acoustic",
    mood: "Inspiring",
    tempo: "Midtempo",
    bpm: "96 BPM",
    era: "1990s",
    vocal: "Instrumental",
    usage: "Brand Film",
    availability: "Available Now",
    duration: "3:27",
    key: "G Major",
    instrumentation: "Acoustic guitar, mandolin, upright percussion",
    tags: ["Organic", "Cinematic", "Inspiring"],
    status: "Protected Delivery",
    image: img.tape,
    rights: "Brand, event, and digital license terms available by territory.",
  },
  {
    id: 6,
    title: "Better Than Before",
    artist: "Milo Hart",
    composer: "Milo Hart / June Ellis",
    genre: "Pop",
    mood: "Feel Good",
    tempo: "Upbeat",
    bpm: "104 BPM",
    era: "Modern",
    vocal: "Vocal",
    usage: "Streaming",
    availability: "Available Now",
    duration: "2:46",
    key: "E Major",
    instrumentation: "Live bass, bright guitars, claps, lead vocal",
    tags: ["Upbeat", "Optimistic", "Clean"],
    status: "Ready to License",
    image: img.agency,
    rights: "Non-exclusive digital campaigns can be reviewed within two business days.",
  },
  {
    id: 7,
    title: "Underpass",
    artist: "Noire Bureau",
    composer: "Sade Olu / Kit Noire",
    genre: "Electronic",
    mood: "Tense",
    tempo: "Midtempo",
    bpm: "110 BPM",
    era: "Modern",
    vocal: "Instrumental",
    usage: "Trailer",
    availability: "Available Now",
    duration: "3:18",
    key: "B Minor",
    instrumentation: "Modular synths, processed drums, sub-bass, glitch textures",
    tags: ["Dark", "Cinematic", "Pulsing"],
    status: "Ready to License",
    image: img.city,
    rights: "Worldwide trailer and promo usage available. Custom edits on request.",
  },
  {
    id: 8,
    title: "Harbor Light",
    artist: "Emilia Shore",
    composer: "Emilia Shore",
    genre: "Folk",
    mood: "Nostalgic",
    tempo: "Slow",
    bpm: "68 BPM",
    era: "1960s",
    vocal: "Vocal",
    usage: "Documentary",
    availability: "Quote Required",
    duration: "4:12",
    key: "A Major",
    instrumentation: "Fingerpicked guitar, cello, brush drums, voice",
    tags: ["Warm", "Intimate", "Storytelling"],
    status: "Rights Review",
    image: img.tape,
    rights: "Archive master requires estate consultation before licensing.",
  },
  {
    id: 9,
    title: "Meridian",
    artist: "Atlas Collective",
    composer: "Ravi Shan / Atlas Collective",
    genre: "World",
    mood: "Uplifting",
    tempo: "Upbeat",
    bpm: "126 BPM",
    era: "Modern",
    vocal: "Vocal",
    usage: "Brand Film",
    availability: "Available Now",
    duration: "3:02",
    key: "D Major",
    instrumentation: "Tabla, sitar drone, global percussion, choir",
    tags: ["Global", "Joyful", "Cinematic"],
    status: "Delivery Ready",
    image: img.concert,
    rights: "Global brand campaign usage supported. Multi-territory clearance available.",
  },
  {
    id: 10,
    title: "Glass Cathedral",
    artist: "Lennox",
    composer: "Mara Lennox",
    genre: "Cinematic",
    mood: "Ethereal",
    tempo: "Slow",
    bpm: "58 BPM",
    era: "Modern",
    vocal: "Instrumental",
    usage: "Film / TV",
    availability: "Exclusive Option",
    duration: "5:22",
    key: "E Minor",
    instrumentation: "Glass piano, reverb strings, tape hiss, field recordings",
    tags: ["Spacious", "Contemplative", "Premium"],
    status: "Protected Delivery",
    image: img.scoringStage,
    rights: "Exclusive cinematic placement available for premium feature film usage.",
  },
  {
    id: 11,
    title: "Twenty-Six Letters",
    artist: "Jade Montague",
    composer: "Jade Montague / C. Rivera",
    genre: "R&B",
    mood: "Sensual",
    tempo: "Midtempo",
    bpm: "92 BPM",
    era: "Modern",
    vocal: "Vocal",
    usage: "Advertising",
    availability: "Available Now",
    duration: "3:34",
    key: "G# Minor",
    instrumentation: "Neo-soul keys, live bass, finger snaps, breathy vocal",
    tags: ["Smooth", "Cool", "Premium"],
    status: "Ready to License",
    image: img.soulVocal,
    rights: "Luxury brand campaigns preferred. Non-exclusive standard terms.",
  },
  {
    id: 12,
    title: "Fault Lines",
    artist: "Hollow Skies",
    composer: "Nate Calder / Elise Thorpe",
    genre: "Alternative",
    mood: "Intense",
    tempo: "Upbeat",
    bpm: "134 BPM",
    era: "2000s",
    vocal: "Vocal",
    usage: "Streaming",
    availability: "Available Now",
    duration: "2:51",
    key: "C Minor",
    instrumentation: "Distorted guitars, driving drums, emotional vocal, feedback",
    tags: ["Raw", "Powerful", "Anthem"],
    status: "Delivery Ready",
    image: img.broadcast,
    rights: "OTT series and streaming platform campaigns available.",
  },
  {
    id: 13,
    title: "Burnt Sienna",
    artist: "Vespera",
    composer: "Ela Vesper",
    genre: "Jazz",
    mood: "Sophisticated",
    tempo: "Slow",
    bpm: "74 BPM",
    era: "1970s",
    vocal: "Instrumental",
    usage: "Hospitality",
    availability: "Quote Required",
    duration: "4:48",
    key: "Bb Major",
    instrumentation: "Upright bass, brush kit, flugelhorn, piano trio",
    tags: ["Elegant", "Warm", "Timeless"],
    status: "Rights Review",
    image: img.luxury,
    rights: "Estate-controlled archive track. Premium hospitality and luxury placements preferred.",
  },
  {
    id: 14,
    title: "Starting Over",
    artist: "Milo Hart",
    composer: "Milo Hart",
    genre: "Pop",
    mood: "Hopeful",
    tempo: "Upbeat",
    bpm: "120 BPM",
    era: "Modern",
    vocal: "Vocal",
    usage: "Advertising",
    availability: "Available Now",
    duration: "2:38",
    key: "F Major",
    instrumentation: "Acoustic piano, layered vocals, soft synths, handclaps",
    tags: ["Bright", "Motivating", "Clean"],
    status: "Ready to License",
    image: img.agency,
    rights: "Social and digital campaign usage pre-approved for standard terms.",
  },
];

const energyMap = ["Low", "High", "Low", "Medium", "Medium", "High", "Medium", "Low", "High", "Low", "Medium", "High", "Low", "High"];
const sceneFitMap = ["Opening titles", "Launch film", "Night drive", "Trailer turn", "Human story", "Social campaign", "Chase sequence", "Memory montage", "Global anthem", "Final scene", "Brand reveal", "Climax moment", "Dinner scene", "New chapter"];
const subgenreMap = ["Neo-classical", "Indie anthem", "Textural ambient", "Vintage soul", "Americana", "Bright pop", "Dark electronic", "Archive folk", "World fusion", "Modern classical", "Neo-soul", "Post-rock", "Cool jazz", "Uplift pop"];
const valueSignalMap = ["High Demand", "Growing Interest", "Growing Interest", "Premium Demand", "Emerging", "Growing Interest", "Emerging", "Premium Demand", "Growing Interest", "Premium Demand", "Emerging", "Growing Interest", "Premium Demand", "Emerging"];

const tracks = rawTracks.map((track, index) => ({
  ...track,
  vipOnly: [1, 4, 10, 13].includes(track.id),
  energy: energyMap[index] || "Medium",
  sceneFit: sceneFitMap[index] || "General placement",
  subgenre: subgenreMap[index] || "Mixed",
  valueSignal: valueSignalMap[index] || "Emerging",
  assets: {
    preview: true,
    wavMaster: ![4, 8].includes(track.id),
    stems: [1, 3, 5, 6, 7, 9, 10, 12].includes(track.id),
    instrumental: track.vocal === "Instrumental" || [2, 4, 6, 11, 14].includes(track.id),
    vocal: track.vocal === "Vocal",
    alternateMixes: [1, 2, 5, 9, 11, 14].includes(track.id),
    loopEdit: [3, 5, 6, 7, 12].includes(track.id),
    thirtySecondEdit: [1, 2, 6, 9, 11, 14].includes(track.id),
    drumStem: [1, 3, 5, 7, 9, 12].includes(track.id),
    bassStem: [1, 3, 5, 7, 9, 11].includes(track.id),
    guitarStem: [2, 5, 8, 12].includes(track.id),
    keysStem: [1, 3, 6, 10, 11, 13].includes(track.id),
    percStem: [7, 9].includes(track.id),
  },
  commercial: {
    pricingType: [4, 8, 13].includes(track.id) ? "Quote Required" : [10].includes(track.id) ? "Private Pricing" : [1].includes(track.id) ? "VIP Pricing" : "Fixed Price",
    priceRange: [4, 8, 13].includes(track.id) ? "Request quote" : [10].includes(track.id) ? "Contact for terms" : [1].includes(track.id) ? "VIP terms apply" : "$5,000 – $25,000",
    rightsReviewRequired: [4, 8, 13].includes(track.id),
    exclusivityAvailable: [1, 4, 10].includes(track.id),
  },
  rightsData: {
    proAffiliation: index % 2 === 0 ? "ASCAP" : "BMI",
    registrationId: `BMO-MOCK-${String(track.id).padStart(4, "0")}`,
    publisher: `${track.artist} Publishing`,
    masterOwner: "beatmondo Partner Catalog",
    publishingOwner: `${track.artist} Publishing`,
    ownershipProof: [4, 8, 13].includes(track.id) ? "Rights Review Needed" : "Verified",
    contractStatus: [4, 8, 13].includes(track.id) ? "Legal Review Needed" : "On File",
    legalReview: [4, 8, 13].includes(track.id) ? "Pending" : "Approved",
    prestonApproval: [4, 8, 13].includes(track.id) ? "Pending" : "Approved",
    licensingEligible: ![4, 8, 13].includes(track.id),
    rightsVerified: ![4, 8, 13].includes(track.id),
    deliveryReady: ["Delivery Ready", "Protected Delivery", "Ready to License"].includes(track.status),
    lastReview: "Jul 2026",
    territory: [4, 8, 13].includes(track.id) ? "Territory restrictions may apply" : "Worldwide",
    verificationStatus: [4, 8, 13].includes(track.id) ? "Documentation Required" : "Verified",
    ownershipPercentage: track.id <= 6 ? "100%" : index % 3 === 0 ? "50% (co-owned)" : "100%",
  },
}));

const useCases = [
  ["Film", "Emotional themes, source cues, title beds, and end-credit moments for feature films and independent cinema.", img.film],
  ["Television", "Series music, episodic scoring, recap cues, and premium network placements.", img.streaming],
  ["OTT & Streaming", "Rights-ready music for premium series, originals, and global streaming campaigns.", img.campaign],
  ["Advertising", "Authentic tracks for launches, product films, and premium brand storytelling.", img.agency],
  ["Trailers", "Impactful builds, emotional lifts, and quote-ready archive tracks for theatrical and digital trailers.", img.trailer],
  ["Branded Content", "Curated music for branded entertainment, sponsored content, and editorial integrations.", img.luxury],
  ["Documentaries", "Human, textured music with provenance and rights context for documentary storytelling.", img.documentary],
  ["Games", "Adaptive music, licensed tracks, and scoring for interactive entertainment.", img.city],
  ["Sports", "Driven cues for broadcast packages, promos, and human achievement stories.", img.broadcast],
  ["Hospitality", "Atmospheric selections for hotels, restaurants, and premium hospitality environments.", img.car],
  ["Live Experiences", "Curated music for launches, installations, events, and immersive moments.", img.concert],
  ["Premium Events", "Exclusive selections for galas, premieres, brand activations, and VIP experiences.", img.tape],
];

const collections = [
  ["Staff Picks", "A weekly edit of tracks with story, restraint, and sync potential.", 42, ["Curated", "New"], img.privateStudio],
  ["From the Archive", "Rare recordings, legacy cuts, and artist stories worth resurfacing.", 68, ["Archive", "Soul"], img.musicArchive],
  ["Music for Emotional Storytelling", "Piano-led, acoustic, and vocal tracks for human narratives.", 53, ["Film", "Documentary"], img.scoringStage],
  ["Cinematic Instrumentals", "Preview-only instrumentals with protected master delivery.", 37, ["Score", "Trailer"], img.supervisorSuite],
  ["Americana & Soul", "Warm guitars, lived-in performances, and vocal character.", 29, ["Roots", "Vocal"], img.soulVocal],
  ["Supervisor Favorites", "Tracks repeatedly saved by professional creative buyers.", 31, ["Buyer", "Proven"], img.mediaDesk],
];

const projects = [
  { name: "Luxury Auto Campaign - Fall 2026", type: "Advertising", status: "Quote Sent", tracks: 4, notes: 6, image: img.car },
  { name: "Documentary Opening Titles", type: "Documentary", status: "Under Review", tracks: 7, notes: 11, image: img.film },
  { name: "Premium Hotel Launch Film", type: "Brand Film", status: "Approved", tracks: 2, notes: 3, image: img.city },
];

const inquiries = [
  { id: "BM-1048", company: "VisionTech", track: "Golden Hours", type: "Corporate Promo", budget: "$18k-$25k", deadline: "Jul 12", status: "Approved", buyerTier: "VIP Sync Access", priority: "VIP Priority", preApprovedTerms: true, rightsCheck: "Verified", deliveryReadiness: "Delivery Ready" },
  { id: "BM-1047", company: "National Geographic", track: "Midnight Transit", type: "Documentary", budget: "$25k-$50k", deadline: "Jul 18", status: "Quote Needed", buyerTier: "Professional Buyer", priority: "Standard", preApprovedTerms: false, rightsCheck: "Verified", deliveryReadiness: "Stems Ready" },
  { id: "BM-1046", company: "Peak Performance", track: "Paper Planes", type: "Ad Campaign", budget: "$50k+", deadline: "Jul 24", status: "Quote Sent", buyerTier: "VIP Sync Access", priority: "Fast-Track Delivery", preApprovedTerms: true, rightsCheck: "Verified", deliveryReadiness: "WAV Ready" },
  { id: "BM-1045", company: "Moonline Films", track: "All That Remains", type: "Film Trailer", budget: "$10k-$18k", deadline: "Jul 28", status: "Rights Check Needed", buyerTier: "Discovery Access", priority: "Rights Review", preApprovedTerms: false, rightsCheck: "Legal Review Needed", deliveryReadiness: "Blocked" },
];

const artists = [
  { name: "Lennox", credit: "Independent composer, film textures, modern piano", tracks: 18, image: img.portrait },
  { name: "Arco North", credit: "Guitar-led indie catalog with sync-friendly hooks", tracks: 24, image: img.concert },
  { name: "Vespera", credit: "Soul archive with rare vocal performances", tracks: 11, image: img.vinyl },
];

const navItems = [
  ["home", "Home", House],
  ["catalog", "Explore Music", MagnifyingGlass],
  ["usecases", "Use Cases", FilmSlate],
  ["track", "Track Detail", FileAudio],
  ["artist", "Artist Profile", MicrophoneStage],
  ["legacy", "Gary Burke Legacy", Archive],
  ["licensing", "Licensing / Access", ShieldCheck],
  ["buyer", "Buyer Dashboard", UserCircle],
  ["project", "Project Detail", BookmarkSimple],
  ["artist-dashboard", "Artist Dashboard", MicrophoneStage],
  ["admin", "Admin", GearSix],
  ["content", "Editorial Hub", Article],
  ["stories", "Stories", Article],
  ["media", "Media Episodes", FilmSlate],
  ["contact", "Contact", UsersThree],
  ["investor", "Investor Overview", Eye],
  ["system", "Design System", Sliders],
];

const navItemMap = new Map(navItems.map((item) => [item[0], item]));
const sidebarSections = [
  ["Buyer workspace", ["home", "catalog", "usecases", "buyer", "project", "licensing"]],
  ["Editorial", ["legacy", "content", "stories", "media", "contact"]],
  ["Operations", ["admin", "artist-dashboard"]],
  ["Prototype", ["investor"]],
];

const publicViews = new Set(["home", "login", "signup", "forgot"]);
const validViews = new Set([...navItems.map(([id]) => id), ...publicViews]);

function parseDurationMinutes(duration) {
  const [min, sec] = duration.split(":").map(Number);
  return min + sec / 60;
}

function matchesDuration(duration, filter) {
  if (filter === "Any Duration") return true;
  const minutes = parseDurationMinutes(duration);
  if (filter === "Under 3:00") return minutes < 3;
  if (filter === "3:00+") return minutes >= 3;
  return true;
}

function sortTracks(list, sortBy) {
  const sorted = [...list];
  if (sortBy === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
  else if (sortBy === "artist") sorted.sort((a, b) => a.artist.localeCompare(b.artist));
  else if (sortBy === "duration") sorted.sort((a, b) => parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration));
  return sorted;
}

function getRightsStatus(track) {
  return track.rightsData.rightsVerified ? "Rights Verified" : "Rights Review";
}

function getDeliveryStatus(track) {
  if (track.rightsData.deliveryReady) return "Delivery Ready";
  if (track.assets.wavMaster) return "Protected Delivery";
  return "Delivery Locked";
}

function App() {
  const [view, setView] = useState("home");
  const [selectedTrack, setSelectedTrack] = useState(tracks[0]);
  const [playingId, setPlayingId] = useState(null);
  const [playerTrackId, setPlayerTrackId] = useState(null);
  const [savedIds, setSavedIds] = useState([1, 5]);
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState("list");
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState({
    genre: "All Genres",
    mood: "Any Mood",
    theme: "Any Theme",
    energy: "Any Energy",
    tempo: "Any Tempo",
    bpm: "Any BPM",
    duration: "Any Duration",
    vocal: "Any Vocal",
    era: "Any Era",
    instrumentation: "Any Instrument",
    usage: "Any Usage",
    rightsVerified: "Any Rights Status",
    availability: "All Availability",
    vipCatalog: "All Access",
    exclusivity: "Any Exclusivity",
    stems: "Any Stem Status",
  });
  const [modalTrack, setModalTrack] = useState(null);
  const [pageRequestSent, setPageRequestSent] = useState(false);
  const [modalRequestSent, setModalRequestSent] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = (nextView) => {
    if (!validViews.has(nextView)) return;
    setView(nextView);
    setModalTrack(null);
    setShowNotifications(false);
    setMobileNav(false);
    window.history.replaceState(null, "", nextView === "home" ? window.location.pathname : `#${nextView}`);
  };

  useEffect(() => {
    const syncFromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (!id || id === "home") {
        setView("home");
        setModalTrack(null);
        setShowNotifications(false);
        return;
      }
      if (validViews.has(id)) {
        setView(id);
        setModalTrack(null);
        setShowNotifications(false);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message) => setToast(message);

  const filteredTracks = useMemo(() => {
    const filtered = tracks.filter((track) => {
      const text = `${track.title} ${track.artist} ${track.genre} ${track.mood} ${track.tags.join(" ")} ${track.usage} ${track.instrumentation}`.toLowerCase();
      
      const bpmVal = parseInt(track.bpm) || 0;
      const matchBpm = filters.bpm === "Any BPM"
        || (filters.bpm === "Under 80 BPM" && bpmVal < 80)
        || (filters.bpm === "80 - 120 BPM" && bpmVal >= 80 && bpmVal <= 120)
        || (filters.bpm === "120+ BPM" && bpmVal > 120);

      const matchExclusivity = filters.exclusivity === "Any Exclusivity"
        || (filters.exclusivity === "Exclusivity Available" && track.commercial.exclusivityAvailable)
        || (filters.exclusivity === "Non-Exclusive Only" && !track.commercial.exclusivityAvailable);

      return text.includes(query.toLowerCase())
        && (filters.genre === "All Genres" || track.genre === filters.genre)
        && (filters.mood === "Any Mood" || track.mood === filters.mood)
        && (filters.theme === "Any Theme" || track.tags.map((t) => t.toLowerCase()).includes(filters.theme.toLowerCase()))
        && (filters.energy === "Any Energy" || track.energy === filters.energy)
        && (filters.tempo === "Any Tempo" || track.tempo === filters.tempo)
        && matchBpm
        && matchesDuration(track.duration, filters.duration)
        && (filters.vocal === "Any Vocal" || track.vocal === filters.vocal)
        && (filters.era === "Any Era" || track.era === filters.era)
        && (filters.instrumentation === "Any Instrument" || track.instrumentation.toLowerCase().includes(filters.instrumentation.toLowerCase()))
        && (filters.usage === "Any Usage" || track.usage === filters.usage)
        && (filters.rightsVerified === "Any Rights Status" || (filters.rightsVerified === "Rights Verified" ? track.rightsData.rightsVerified : !track.rightsData.rightsVerified))
        && (filters.availability === "All Availability" || track.availability === filters.availability)
        && (filters.vipCatalog === "All Access" || (filters.vipCatalog === "VIP Picks" ? track.vipOnly : !track.vipOnly))
        && matchExclusivity
        && (filters.stems === "Any Stem Status" || (filters.stems === "Stems Available" ? track.assets.stems : !track.assets.stems));
    });
    return sortTracks(filtered, sortBy);
  }, [query, filters, sortBy]);

  const saveTrack = (id) => setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const togglePlay = (id) => {
    setPlayerTrackId(id);
    setPlayingId((current) => (current === id ? null : id));
  };
  const openTrack = (track) => {
    setSelectedTrack(track);
    navigate("track");
  };
  const requestLicense = (track) => {
    setModalTrack(track);
    setModalRequestSent(false);
  };
  const playerTrack = tracks.find((track) => track.id === playerTrackId);
  const isPublicView = publicViews.has(view);

  return (
    <div className={`app ${isPublicView ? "home-app public-app" : ""}`}>
      {!isPublicView && <Sidebar view={view} setView={navigate} mobileNav={mobileNav} setMobileNav={setMobileNav} />}
      <main className="main-shell">
        {!isPublicView && (
          <Topbar
            view={view}
            setView={navigate}
            setMobileNav={setMobileNav}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            onProfile={() => navigate("buyer")}
          />
        )}
        {view === "home" && (
          <Home
            setView={navigate}
            setSelectedTrack={setSelectedTrack}
            playingId={playingId}
            togglePlay={togglePlay}
            savedIds={savedIds}
            saveTrack={saveTrack}
            requestLicense={requestLicense}
          />
        )}
        {view === "login" && <AuthPage mode="login" setView={navigate} showToast={showToast} />}
        {view === "signup" && <AuthPage mode="signup" setView={navigate} showToast={showToast} />}
        {view === "forgot" && <AuthPage mode="forgot" setView={navigate} showToast={showToast} />}
        {view === "catalog" && (
          <Catalog
            tracks={filteredTracks}
            query={query}
            setQuery={setQuery}
            filters={filters}
            setFilters={setFilters}
            layout={layout}
            setLayout={setLayout}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            playingId={playingId}
            togglePlay={togglePlay}
            savedIds={savedIds}
            saveTrack={saveTrack}
            openTrack={openTrack}
            requestLicense={requestLicense}
            showToast={showToast}
          />
        )}
        {view === "usecases" && <UseCasesPage setView={navigate} />}
        {view === "track" && (
          <TrackDetail
            track={selectedTrack}
            togglePlay={togglePlay}
            playingId={playingId}
            saveTrack={saveTrack}
            saved={savedIds.includes(selectedTrack.id)}
            requestLicense={requestLicense}
            openTrack={openTrack}
          />
        )}
        {view === "artist" && (
          <ArtistProfile
            requestLicense={() => requestLicense(selectedTrack)}
            openTrack={openTrack}
            playingId={playingId}
            togglePlay={togglePlay}
            savedIds={savedIds}
            saveTrack={saveTrack}
            setView={navigate}
          />
        )}
        {view === "legacy" && <Legacy setView={navigate} openTrack={openTrack} />}
        {view === "licensing" && (
          <LicensingAccess
            selectedTrack={selectedTrack}
            requestSent={pageRequestSent}
            setRequestSent={setPageRequestSent}
            setView={navigate}
          />
        )}
        {view === "buyer" && (
          <BuyerDashboard
            savedIds={savedIds}
            setView={navigate}
            requestLicense={requestLicense}
            openTrack={openTrack}
            playingId={playingId}
            togglePlay={togglePlay}
            saveTrack={saveTrack}
            showToast={showToast}
          />
        )}
        {view === "project" && (
          <ProjectDetail
            requestLicense={() => requestLicense(selectedTrack)}
            openTrack={openTrack}
            showToast={showToast}
          />
        )}
        {view === "admin" && <AdminDashboard showToast={showToast} togglePlay={togglePlay} />}
        {view === "artist-dashboard" && <ArtistDashboardPage showToast={showToast} setView={navigate} />}
        {view === "content" && <ContentPages setView={navigate} showToast={showToast} />}
        {view === "stories" && <StoriesPage setView={navigate} showToast={showToast} />}
        {view === "media" && <MediaEpisodesPage setView={navigate} showToast={showToast} />}
        {view === "contact" && <ContactPage setView={navigate} />}
        {view === "investor" && <InvestorOverview setView={navigate} />}
        {view === "system" && <DesignSystem />}
      </main>
      {playerTrack && (
        <MiniPlayer
          track={playerTrack}
          playingId={playingId}
          onTogglePlay={() => togglePlay(playerTrack.id)}
          onOpen={() => openTrack(playerTrack)}
        />
      )}
      {modalTrack && (
        <InquiryModal
          track={modalTrack}
          requestSent={modalRequestSent}
          setRequestSent={setModalRequestSent}
          onClose={() => setModalTrack(null)}
          setView={navigate}
        />
      )}
      {toast && <div className="toast-banner" role="status">{toast}</div>}
    </div>
  );
}

function Sidebar({ view, setView, mobileNav, setMobileNav }) {
  return (
    <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
      <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={20} /></button>
      <button
        className="sidebar-logo"
        onClick={() => {
          setView("home");
          setMobileNav(false);
        }}
        aria-label="Go to beatmondo homepage"
      >
        <img className="brand-logo" src={logo} alt="beatmondo" />
      </button>
      <nav>
        {sidebarSections.map(([section, ids]) => (
          <div className="sidebar-section" key={section}>
            <span>{section}</span>
            {ids.map((id) => {
              const [, label, Icon] = navItemMap.get(id);
              return (
                <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setMobileNav(false); }}>
                  <Icon size={20} weight={view === id ? "fill" : "regular"} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function Topbar({ view, setView, setMobileNav, showNotifications, setShowNotifications, onProfile }) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileNav(true)}><FadersHorizontal size={20} /> Menu</button>
      <div>
        <span className="eyebrow"><span className="brand-name">beatmondo</span> private sync workspace</span>
        <h1>{navItems.find(([id]) => id === view)?.[1]}</h1>
      </div>
      <div className="top-actions">
        <span className="tier-badge vip">{currentBuyer.accessTier}</span>
        <button onClick={() => setView("licensing")} className="ghost-button"><SignIn size={18} /> Request Access</button>
        <button
          className="icon-button"
          aria-label="Notifications"
          aria-expanded={showNotifications}
          onClick={() => setShowNotifications((open) => !open)}
        >
          <Bell size={20} />
        </button>
        <button className="profile-pill" onClick={onProfile} aria-label="Open buyer dashboard"><span>AD</span> Alex Davenport</button>
      </div>
      {showNotifications && (
        <div className="panel notification-panel" role="region" aria-label="Notifications">
          <p><CheckCircle size={16} /> Quote sent for Luxury Auto Campaign</p>
          <p><ShieldCheck size={16} /> New inquiry assigned to licensing team</p>
          <p><DownloadSimple size={16} /> Secure WAV master ready for Premium Hotel Launch Film</p>
        </div>
      )}
    </header>
  );
}

function PublicHeader({ setView, authMode = null }) {
  return (
    <header className={`public-header ${authMode ? "auth-header" : ""}`}>
      <button className="public-logo" onClick={() => setView("home")} aria-label="beatmondo home">
        <img src={logo} alt="beatmondo" />
      </button>
      {authMode ? (
        <>
          <div />
          <div className="public-auth-actions">
            <button className="plain-button auth-help-button" onClick={() => setView("contact")}>Help</button>
            <button className="outline-button" onClick={() => setView(authMode === "signup" ? "login" : "signup")}>
              {authMode === "signup" ? "Log In" : "Request Access"}
            </button>
          </div>
        </>
      ) : (
        <>
          <nav>
            <button onClick={() => setView("catalog")}>Explore Music</button>
            <button onClick={() => setView("licensing")}>Licensing</button>
            <button onClick={() => setView("legacy")}>Legacy</button>
            <button onClick={() => setView("stories")}>Stories</button>
          </nav>
          <div className="public-auth-actions">
            <button className="plain-button" onClick={() => setView("login")}>Log In</button>
            <button className="outline-button" onClick={() => setView("signup")}><SignIn size={18} /> Request Access</button>
          </div>
        </>
      )}
    </header>
  );
}

function Home({ setView, setSelectedTrack, playingId, togglePlay, savedIds, saveTrack, requestLicense }) {
  return (
    <section className="home-view">
      <PublicHeader setView={setView} />
      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Premium gated sync licensing ecosystem</span>
          <h2>Premium Sync Access.</h2>
          <p>A private music licensing ecosystem connecting exceptional catalogs with film, television, streaming, advertising, premium brands, and global creative buyers.</p>
          <p className="trust-line">Built for professional buyers. Designed for long-term catalog value.</p>
          <div className="button-row">
            <button className="outline-button" onClick={() => setView("catalog")}><Play size={18} weight="fill" /> Explore the Catalog</button>
            <button className="outline-button" onClick={() => setView("licensing")}><ShieldCheck size={18} /> See How Licensing Works</button>
            <button className="gold-button vip-access-button" onClick={() => setView("signup")}><LockKey size={18} /> Request VIP Sync Access</button>
          </div>
        </div>
        <HeroMedia />
      </div>

      <InvestorSummaryStrip setView={setView} />

      <ProblemSolution />

      <section className="access-tier-band">
        <div className="section-heading">
          <div><span className="eyebrow">Choose your access level</span><h2>Curated access for serious sync buyers.</h2></div>
          <button className="text-action" onClick={() => setView("licensing")}>Compare access</button>
        </div>
        <div className="tier-grid">
          {buyerTiers.map((tier) => <AccessTierCard key={tier.id} tier={tier} onSelect={() => setView("licensing")} />)}
        </div>
        <p className="tier-note">VIP access is individually reviewed.</p>
      </section>

      <BusinessModelSection />

      <section>
        <div className="section-kicker"><span className="eyebrow">Commercial use cases</span><h2>Music for every premium placement.</h2></div>
        <div className="image-card-grid use-cases use-cases-full">
          {useCases.map(([title, text, image]) => <ImageCard key={title} title={title} text={text} image={image} action={() => setView("catalog")} />)}
        </div>
      </section>

      <section className="warm-band collections-band">
        <div className="section-heading"><div><span className="eyebrow">Curated selections</span><h2>Editorial paths into Explore Music.</h2></div><button className="text-action" onClick={() => setView("catalog")}>Explore Music</button></div>
        <div className="collection-grid">
          {collections.slice(0, 4).map(([title, text, count, tags, image]) => (
            <CollectionCard key={title} title={title} text={text} count={count} tags={tags} image={image} onView={() => setView("catalog")} />
          ))}
        </div>
      </section>

      <section className="split-section">
        <div>
          <div className="section-heading"><div><span className="eyebrow">Featured tracks</span><h2>Preview publicly. Deliver securely.</h2></div><button className="text-action" onClick={() => setView("catalog")}>Explore Music</button></div>
          <div className="track-list compact">
            {tracks.slice(0, 4).map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isPlaying={playingId === track.id}
                saved={savedIds.includes(track.id)}
                onPlay={() => togglePlay(track.id)}
                onSave={() => saveTrack(track.id)}
                onOpen={() => { setSelectedTrack(track); setView("track"); }}
                onRequest={() => requestLicense(track)}
              />
            ))}
          </div>
        </div>
        <div className="trust-panel">
          <h3>Secure licensing workflow</h3>
          <TrustItem icon={ShieldCheck} title="Rights-aware metadata" text="Usage, territory, term, and clearance notes stay attached to the licensing workflow." />
          <TrustItem icon={LockKey} title="Protected masters" text="WAV files and stems stay locked until approval, payment, and delivery rules are complete." />
          <TrustItem icon={UsersThree} title="Artist-first music" text="Real musicianship, provenance, and relationship-led licensing sit at the center." />
        </div>
      </section>

      <CompetitiveDifferentiation />

      <section className="content-preview">
        <MiniStory title="Gary Burke Legacy" text="A tasteful archive honoring the original vision and musician-led spirit behind beatmondo." image={img.legacyDetail} actionLabel="Read legacy story" action={() => setView("legacy")} />
        <MiniStory title="Short Sync Clips" text="Fast editorial clips for social discovery, Catalog Highlights, VIP Picks, and licensing conversations." image={img.shortSyncEdit} actionLabel="View clips" action={() => setView("stories")} />
        <MiniStory title="Media Episodes" text="Artist stories, studio sessions, Catalog Highlights, legacy clips, and supervisor conversations." image={img.mediaInterview} actionLabel="Watch episodes" action={() => setView("media")} />
      </section>
      <Footer setView={setView} />
    </section>
  );
}

function InvestorSummaryStrip({ setView }) {
  const cards = [
    [ShieldCheck, "Discover", "Music Worth Shortlisting", "Selected music reviewed for quality, provenance, and sync potential."],
    [LockKey, "Verify", "Rights You Can Trust", "Ownership, publishing, master, and contributor details reviewed before licensing."],
    [FileAudio, "License", "A Clear Path to Clearance", "Guided requests, quotes, approvals, and payment in one professional workflow."],
    [DownloadSimple, "Deliver", "Protected Files, Ready", "Approved WAV masters and stems delivered through controlled, secure access."],
  ];
  return (
    <section className="investor-summary-section" aria-labelledby="beatmondo-standard-title">
      <div className="investor-summary-intro">
        <span className="eyebrow">the <span className="brand-name">beatmondo</span> standard</span>
        <h2 id="beatmondo-standard-title">From first listen to cleared delivery.</h2>
        <div className="investor-summary-intro-copy">
          <p>A trusted path through discovery, rights, licensing, and secure delivery for serious sync buyers.</p>
          <button className="text-action" onClick={() => setView("catalog")}>Explore Music <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="investor-summary-strip">
        {cards.map(([Icon, step, title, text], index) => (
          <article key={title} className="investor-summary-card">
            <div className="investor-summary-card-topline">
              <Icon size={30} weight="duotone" aria-hidden="true" />
              <span className="investor-summary-step">0{index + 1} · {step}</span>
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProblemSolution() {
  const problems = [
    "Discovery is disconnected from rights",
    "Licensing can be slow and unclear",
    "Rights information is often scattered",
    "Approved masters and stems are hard to access",
  ];
  const solutions = [
    "Curated professional discovery",
    "Verified, rights-aware metadata",
    "Structured licensing and approvals",
    "Protected master and stems delivery",
  ];
  return (
    <section className="problem-solution-band">
      <div className="problem-solution-grid">
        <div className="problem-side">
          <span className="eyebrow">The problem</span>
          <h2>Music licensing remains fragmented.</h2>
          <ul>{problems.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="solution-side">
          <span className="eyebrow">The solution</span>
          <h2>One connected licensing path.</h2>
          <ul>{solutions.map((item) => <li key={item}><CheckCircle size={16} weight="fill" /> {item}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

function BusinessModelSection() {
  const models = [
    [FileAudio, "Licensing Revenue", "Revenue generated through approved sync licenses across film, television, advertising, streaming, and premium brand placements."],
    [LockKey, "Premium Access", "Professional and VIP access opportunities that create recurring revenue from serious commercial buyers."],
    [ShieldCheck, "Exclusive Licensing", "Higher-value category, territory, or full exclusivity licensing for premium commercial use cases."],
    [UsersThree, "Catalog Partnerships", "Strategic relationships with artists, estates, publishers, and rights holders that expand the platform catalog."],
    [Sparkle, "Premium Services", "Curated recommendations, priority review, rights support, and custom commercial pathways for high-value buyers."],
  ];
  return (
    <section className="business-model-band">
      <div className="section-kicker"><span className="eyebrow">How <span className="brand-name">beatmondo</span> generates revenue</span><h2>Multiple Revenue Pathways</h2></div>
      <div className="business-model-grid">
        {models.map(([Icon, title, text]) => (
          <article key={title} className="business-model-card">
            <Icon size={26} weight="duotone" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CompetitiveDifferentiation() {
  const points = [
    ["Curated, not open", "Every artist, track, and catalog is reviewed and selected — not self-uploaded."],
    ["Professional, not mass-market", "Built for music supervisors, studios, agencies, and premium brands — not casual creators."],
    ["Rights-aware, not discovery-only", "Rights, ownership, and clearance data are part of the discovery and licensing experience."],
    ["Protected masters, not public downloads", "WAV masters and stems are delivered only after approval, payment, or VIP terms."],
    ["High-touch, not transactional", "Concierge review, curated selections, and relationship-led licensing for serious buyers."],
    ["Catalog intelligence, not simple hosting", "Usage data, demand signals, and licensing activity create long-term catalog value."],
  ];
  return (
    <section className="differentiation-band">
      <div className="section-kicker"><span className="eyebrow">Competitive advantage</span><h2>Why beatmondo is different</h2></div>
      <div className="differentiation-grid">
        {points.map(([title, text]) => (
          <article key={title} className="differentiation-card">
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HeroMedia() {
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const playVideo = async () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      video.muted = true;
      await video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playVideo();
        } else {
          video.pause();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(video);
    playVideo();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="hero-media">
      {!videoFailed && (
        <video
          ref={videoRef}
          src={opener}
          poster={logo}
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      )}
      {videoFailed && <img className="hero-logo-fallback" src={logo} alt="beatmondo" />}
    </div>
  );
}

function UseCasesPage({ setView }) {
  return (
    <section className="use-cases-page">
      <div className="page-intro">
        <span className="eyebrow">Music for global sync opportunities</span>
        <h2>Explore music by placement and market.</h2>
        <p>Start with the work you are making, then move into curated previews, rights context, and the appropriate licensing path.</p>
      </div>
      <div className="image-card-grid use-cases-directory">
        {useCases.map(([title, text, image]) => (
          <ImageCard key={title} title={title} text={text} image={image} action={() => setView("catalog")} />
        ))}
      </div>
      <div className="page-cta">
        <div><span className="eyebrow">Need a private selection?</span><h3>Tell us about the brief and deadline.</h3></div>
        <button className="gold-button" onClick={() => setView("licensing")}>Request Access</button>
      </div>
    </section>
  );
}

function AuthPage({ mode, setView, showToast }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState("");
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const title = isSignup ? "Request your beatmondo workspace." : isForgot ? "Reset your password." : "Welcome back.";
  const description = isSignup
    ? "Create an account request for buyer verification, project tools, licensing workflows, and protected delivery."
    : isForgot
      ? "Enter your work email and we’ll simulate sending a secure reset link."
      : "Log in to access saved tracks, active projects, licensing requests, and secure deliveries.";

  const submit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    setAuthError("");
    if (!isForgot && email.toLowerCase().includes("locked")) {
      setAuthError("This demo account is locked. Contact buyer support or request an access review.");
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      showToast(isForgot ? "Password reset link simulated." : isSignup ? "Access request account created." : "Signed in to the demo workspace.");
      if (!isForgot) setView("buyer");
    }, 700);
  };

  const socialLogin = (provider) => {
    showToast(`${provider} sign-in simulated.`);
    window.setTimeout(() => setView("buyer"), 650);
  };

  return (
    <section className="auth-view">
      <PublicHeader setView={setView} authMode={mode} />
      <div className="auth-shell">
        <aside className="auth-story">
          <span className="eyebrow">Private buyer access</span>
          <h1>Private access for serious sync work.</h1>
          <p>Return to curated music, verified rights, licensing requests, and secure delivery.</p>
          <ul>
            <li><ShieldCheck size={18} /> Rights-aware metadata</li>
            <li><BookmarkSimple size={18} /> Private projects and selections</li>
            <li><LockKey size={18} /> Protected master audio delivery</li>
          </ul>
        </aside>
        <div className="auth-card">
          <span className="eyebrow">{isForgot ? "Account recovery" : isSignup ? "New buyer account" : "Approved buyer login"}</span>
          <h2>{title}</h2>
          <p>{description}</p>

          {!isForgot && (
            <>
              <div className="social-auth-grid">
                <button className="social-provider google" type="button" onClick={() => socialLogin("Google")}><img src="/assets/auth/google-g.png" alt="" />Continue with Google</button>
                <button className="social-provider apple" type="button" onClick={() => socialLogin("Apple")}><img src="/assets/auth/apple-logo.svg" alt="" />Continue with Apple</button>
                <button className="social-provider microsoft" type="button" onClick={() => socialLogin("Microsoft")}><img src="/assets/auth/microsoft-symbol.svg" alt="" />Continue with Microsoft</button>
              </div>
              <div className="auth-divider"><span>or continue with email</span></div>
            </>
          )}

          <form onSubmit={submit}>
            {isSignup && (
              <div className="auth-two-col">
                <label>First name<input required autoComplete="given-name" /></label>
                <label>Last name<input required autoComplete="family-name" /></label>
              </div>
            )}
            {isSignup && <label>Company<input required autoComplete="organization" /></label>}
            <label>Work email<input name="email" type="email" required autoComplete="email" placeholder="name@company.com" aria-describedby={authError ? "auth-error" : undefined} /></label>
            {!isForgot && (
              <label>Password
                <span className="password-field">
                  <input name="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} aria-describedby={authError ? "auth-error" : undefined} />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-pressed={showPassword}>{showPassword ? "Hide" : "Show"}</button>
                </span>
              </label>
            )}
            {isSignup && <label className="auth-consent"><input type="checkbox" required /> I agree to buyer verification and access review.</label>}
            {!isSignup && !isForgot && (
              <div className="auth-utilities">
                <label className="auth-consent"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Remember me</label>
                <button type="button" className="auth-link" onClick={() => setView("forgot")}>Forgot password?</button>
              </div>
            )}
            {authError && <div id="auth-error" className="auth-error" role="alert"><ShieldCheck size={18} /> {authError}</div>}
            <button className="gold-button auth-submit" type="submit" disabled={submitted || submitting}>{submitting ? "Signing in…" : submitted ? "Submitted" : isForgot ? "Send reset link" : isSignup ? "Create account request" : "Log In"}</button>
            {!isForgot && <p className="auth-reassurance"><LockKey size={15} /> Authentication is simulated in this prototype. <button type="button" onClick={() => setView("contact")}>Contact buyer support</button>.</p>}
          </form>

          {(isForgot || isSignup) && (
            <div className="auth-switch">
              {isForgot ? (
                <button onClick={() => setView("login")}>Return to Log In</button>
              ) : (
                <span>Already have access? <button onClick={() => setView("login")}>Log In</button></span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Catalog(props) {
  const {
    tracks: visibleTracks, query, setQuery, filters, setFilters, layout, setLayout, sortBy, setSortBy,
    selectedTrack, setSelectedTrack, playingId, togglePlay, savedIds, saveTrack, openTrack, requestLicense, showToast,
  } = props;

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const defaultFilters = {
    genre: "All Genres",
    mood: "Any Mood",
    theme: "Any Theme",
    energy: "Any Energy",
    tempo: "Any Tempo",
    bpm: "Any BPM",
    duration: "Any Duration",
    vocal: "Any Vocal",
    era: "Any Era",
    instrumentation: "Any Instrument",
    usage: "Any Usage",
    rightsVerified: "Any Rights Status",
    availability: "All Availability",
    vipCatalog: "All Access",
    exclusivity: "Any Exclusivity",
    stems: "Any Stem Status",
  };
  const resetFilters = () => setFilters(defaultFilters);
  const removeFilter = (key) => setFilters(prev => ({ ...prev, [key]: defaultFilters[key] }));
  const chips = Object.entries(filters).filter(([key, value]) => value !== defaultFilters[key]);

  const filterControls = {
    genre: <Select label="Genre" value={filters.genre} options={["All Genres", "Cinematic", "Indie Rock", "Ambient", "Soul", "Acoustic", "Pop", "Electronic", "Folk", "World", "R&B", "Jazz"]} onChange={(genre) => setFilters({ ...filters, genre })} />,
    mood: <Select label="Mood" value={filters.mood} options={["Any Mood", "Reflective", "Driven", "Moody", "Emotional", "Inspiring", "Feel Good", "Tense", "Nostalgic", "Uplifting", "Ethereal", "Sensual", "Intense", "Sophisticated", "Hopeful"]} onChange={(mood) => setFilters({ ...filters, mood })} />,
    theme: <Select label="Theme" value={filters.theme} options={["Any Theme", "Warm", "Uplifting", "Reflective", "Hopeful", "Driven", "Youthful", "Atmospheric", "Emotional", "Cinematic", "Global", "Dark", "Spacious", "Smooth", "Anthem"]} onChange={(theme) => setFilters({ ...filters, theme })} />,
    energy: <Select label="Energy" value={filters.energy} options={["Any Energy", "Low", "Medium", "High"]} onChange={(energy) => setFilters({ ...filters, energy })} />,
    tempo: <Select label="Tempo" value={filters.tempo} options={["Any Tempo", "Slow", "Midtempo", "Upbeat"]} onChange={(tempo) => setFilters({ ...filters, tempo })} />,
    bpm: <Select label="BPM" value={filters.bpm} options={["Any BPM", "Under 80 BPM", "80 - 120 BPM", "120+ BPM"]} onChange={(bpm) => setFilters({ ...filters, bpm })} />,
    duration: <Select label="Duration" value={filters.duration} options={["Any Duration", "Under 3:00", "3:00+"]} onChange={(duration) => setFilters({ ...filters, duration })} />,
    vocal: <Select label="Vocal" value={filters.vocal} options={["Any Vocal", "Instrumental", "Vocal"]} onChange={(vocal) => setFilters({ ...filters, vocal })} />,
    era: <Select label="Era" value={filters.era} options={["Any Era", "Modern", "2000s", "1990s", "1970s", "1960s"]} onChange={(era) => setFilters({ ...filters, era })} />,
    instrumentation: <Select label="Instrument" value={filters.instrumentation} options={["Any Instrument", "Piano", "Guitar", "Strings", "Synth", "Drums", "Brass", "Vocal"]} onChange={(instrumentation) => setFilters({ ...filters, instrumentation })} />,
    usage: <Select label="Usage" value={filters.usage} options={["Any Usage", "Film / TV", "Advertising", "Documentary", "Trailer", "Brand Film", "Streaming", "Hospitality"]} onChange={(usage) => setFilters({ ...filters, usage })} />,
    rightsVerified: <Select label="Rights" value={filters.rightsVerified} options={["Any Rights Status", "Rights Verified", "Rights Review Needed"]} onChange={(rightsVerified) => setFilters({ ...filters, rightsVerified })} />,
    availability: <Select label="Availability" value={filters.availability} options={["All Availability", "Available Now", "Exclusive Option", "Quote Required"]} onChange={(availability) => setFilters({ ...filters, availability })} />,
    vipCatalog: <Select label="Access" value={filters.vipCatalog} options={["All Access", "Standard Access", "VIP Picks"]} onChange={(vipCatalog) => setFilters({ ...filters, vipCatalog })} />,
    exclusivity: <Select label="Exclusivity" value={filters.exclusivity} options={["Any Exclusivity", "Exclusivity Available", "Non-Exclusive Only"]} onChange={(exclusivity) => setFilters({ ...filters, exclusivity })} />,
    stems: <Select label="Stems" value={filters.stems} options={["Any Stem Status", "Stems Available", "Stems Not Ready"]} onChange={(stems) => setFilters({ ...filters, stems })} />,
  };

  return (
    <section className="catalog-layout">
      <div className="catalog-main">
        <div className="catalog-header">
          <div>
            <span className="tier-badge vip"><LockKey size={14} /> {currentBuyer.accessTier}</span>
            <h2>Explore Music</h2>
            <p>Search by mood, use case, artist, era, tempo, stems, rights verification, VIP access, and delivery readiness.</p>
          </div>
        </div>
        <div className="search-row">
          <label className="search-box"><MagnifyingGlass size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search track, artist, mood, instrument, usage, or keyword..." /></label>
          <div className="catalog-actions">
            <button className="outline-button" onClick={() => showToast("Search saved to Buyer workspace.")}><BookmarkSimple size={18} /> Save Search</button>
            <button className="outline-button" onClick={() => requestLicense(selectedTrack)}><Sparkle size={18} /> Need Something Specific?</button>
          </div>
        </div>
        <div className="filter-panel">
          <div className="filters wide primary-filters">
            {filterControls.genre}
            {filterControls.usage}
            {filterControls.availability}
            {filterControls.vipCatalog}
            {filterControls.mood}
            {filterControls.theme}
          </div>
          <button className="filter-toggle" type="button" aria-expanded={showAdvancedFilters} onClick={() => setShowAdvancedFilters((open) => !open)}>
            <Sliders size={18} /> {showAdvancedFilters ? "Hide advanced filters" : "Show advanced filters"}
          </button>
          {showAdvancedFilters && (
            <div className="filters wide advanced-filters">
              {filterControls.tempo}
              {filterControls.bpm}
              {filterControls.energy}
              {filterControls.exclusivity}
              {filterControls.era}
              {filterControls.vocal}
              {filterControls.duration}
              {filterControls.instrumentation}
              {filterControls.stems}
              {filterControls.rightsVerified}
            </div>
          )}
        </div>
        <div className="chip-row">
          {chips.map(([key, value]) => (
            <span key={key} className="filter-chip">
              <span>{key}: {value}</span>
              <button type="button" onClick={() => removeFilter(key)}><X size={12} /></button>
            </span>
          ))}
          {chips.length > 0 && <button className="clear-all-filters" onClick={resetFilters}>Clear All</button>}
        </div>
        <div className="results-meta">
          <span>{visibleTracks.length} tracks found</span>
          <div className="results-tools">
            <label className="select-label compact-sort">
              <span>Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="relevance">Supervisor relevance</option>
                <option value="title">Title</option>
                <option value="artist">Artist</option>
                <option value="duration">Duration</option>
              </select>
              <CaretDown size={14} />
            </label>
            <div className="segmented"><button className={layout === "list" ? "active" : ""} onClick={() => setLayout("list")}>List</button><button className={layout === "cards" ? "active" : ""} onClick={() => setLayout("cards")}>Cards</button></div>
          </div>
        </div>
        {visibleTracks.length === 0 ? (
          <EmptyState title="No tracks match your filters" text="Try clearing filters or broadening your search terms." actionLabel="Clear filters" onAction={resetFilters} />
        ) : (
          <div className={layout === "cards" ? "track-card-grid" : "track-list"}>
            {visibleTracks.map((track) => layout === "cards" ? (
              <TrackCard key={track.id} track={track} isPlaying={playingId === track.id} saved={savedIds.includes(track.id)} onPlay={() => togglePlay(track.id)} onSave={() => saveTrack(track.id)} onOpen={() => openTrack(track)} onRequest={() => requestLicense(track)} />
            ) : (
              <TrackRow key={track.id} track={track} isSelected={selectedTrack.id === track.id} isPlaying={playingId === track.id} saved={savedIds.includes(track.id)} onPlay={() => togglePlay(track.id)} onSave={() => saveTrack(track.id)} onOpen={() => openTrack(track)} onRequest={() => requestLicense(track)} onSelect={() => setSelectedTrack(track)} />
            ))}
          </div>
        )}
      </div>
      <TrackSidePanel track={selectedTrack} requestLicense={requestLicense} playingId={playingId} onTogglePlay={() => togglePlay(selectedTrack.id)} />
    </section>
  );
}

function TrackRow({ track, isSelected, isPlaying, saved, onPlay, onSave, onOpen, onRequest, onSelect = () => {} }) {
  return (
    <article className={`track-row ${isSelected ? "selected" : ""}`} onClick={onSelect}>
      <button className="play-button" onClick={(event) => { event.stopPropagation(); onPlay(); }} aria-label={isPlaying ? "Pause preview" : "Play preview"}>{isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}</button>
      <div className="cover-art" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.45)), url(${track.image})` }} />
      <div className="track-title">
        <strong>{track.title}{track.vipOnly && <span className="vip-mini">VIP</span>}</strong>
        <small>{track.artist} · {track.genre} · {track.bpm}</small>
        <div>{track.tags.slice(0, 2).map((tag) => <em key={tag}>{tag}</em>)}{track.assets.stems && <em>Stems</em>}</div>
      </div>
      <div className="status-stack" aria-label={`${track.availability}, ${getRightsStatus(track)}, ${getDeliveryStatus(track)}`}>
        <span className="status-availability">{track.availability}</span>
        <span>{getRightsStatus(track)}</span>
        <span>{getDeliveryStatus(track)}</span>
      </div>
      <div className="waveform" aria-hidden="true" />
      <span className="duration">{track.duration}</span>
      <button className={`heart ${saved ? "saved" : ""}`} onClick={(event) => { event.stopPropagation(); onSave(); }} aria-label="Save track"><Heart size={20} weight={saved ? "fill" : "regular"} /></button>
      <button className="small-button" onClick={(event) => { event.stopPropagation(); onRequest(); }}>Request License</button>
      <button className="icon-button" onClick={(event) => { event.stopPropagation(); onOpen(); }} aria-label="View details"><Eye size={18} /></button>
    </article>
  );
}

function TrackCard({ track, isPlaying, saved, onPlay, onSave, onOpen, onRequest }) {
  return (
    <article className="track-card">
      <div className="track-card-art" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.55)), url(${track.image})` }}><button onClick={onPlay} aria-label={isPlaying ? "Pause preview" : "Play preview"}>{isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}</button></div>
      <div><h3>{track.title} {track.vipOnly && <span className="vip-mini">VIP</span>}</h3><p>{track.artist} · {track.genre} · {track.sceneFit}</p></div>
      <div className="waveform" />
      <div className="tag-row">{track.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}<span>{track.duration}</span></div>
      <div className="button-row"><button className={`heart ${saved ? "saved" : ""}`} onClick={onSave}><Heart weight={saved ? "fill" : "regular"} /></button><button className="outline-button" onClick={onOpen}>Details</button><button className="gold-button" onClick={onRequest}>Request License</button></div>
    </article>
  );
}

function TrackSidePanel({ track, requestLicense, playingId, onTogglePlay }) {
  const isPlaying = playingId === track.id;
  return (
    <aside className="detail-rail">
      <div className="preview-card" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.72)), url(${track.image})` }}>
        <span>Preview Only</span>
        <button onClick={onTogglePlay} aria-label={isPlaying ? "Pause preview" : "Play preview"}>{isPlaying ? <Pause size={34} weight="fill" /> : <Play size={34} weight="fill" />}</button>
      </div>
      <h2>{track.title}</h2>
      <p>{track.artist} · {track.genre} · {track.usage}</p>
      <div className="tag-row">{track.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="meta-grid"><span><Clock size={16} /> {track.duration}</span><span><MusicNote size={16} /> {track.bpm}</span><span>{track.key}</span></div>
      <AssetBadges track={track} compact />
      <div className="rights-list">
        <h3>Rights & licensing</h3>
        <p>Preview Only</p>
        <p>Protected master audio</p>
        <p>{track.assets.wavMaster ? "WAV available after approval" : "WAV pending rights check"}</p>
        <p>{track.rightsData.rightsVerified ? "Ownership verified" : "Rights check needed"}</p>
      </div>
      <button className="gold-button full" onClick={() => requestLicense(track)}><ShieldCheck size={18} /> {track.vipOnly ? "Fast-Track License" : "Request License"}</button>
      <div className="locked-box"><LockKey size={28} /> Secure Delivery <small>Protected master audio is delivered only after approval.</small></div>
    </aside>
  );
}

function TrackDetail({ track, playingId, togglePlay, saved, saveTrack, requestLicense, openTrack }) {
  const assetsList = [
    ["Preview", track.assets.preview, "Public-limited preview"],
    ["WAV Master", track.assets.wavMaster, "Uncompressed master file"],
    ["Instrumental", track.assets.instrumental, "No lead vocal mix"],
    ["Vocal Version", track.assets.vocal, "Vocal only stems"],
    ["Alternate Mix", track.assets.alternateMixes, "Alternative arrangement"],
    ["Drum Stem", track.assets.drumStem, "Isolated percussion tracks"],
    ["Bass Stem", track.assets.bassStem, "Isolated bassline tracks"],
    ["Guitar Stem", track.assets.guitarStem, "Isolated guitar tracks"],
    ["Keyboard Stem", track.assets.keysStem, "Isolated keys/piano tracks"],
    ["Percussion Stem", track.assets.percStem, "Isolated auxiliary percussion"],
    ["Additional Stems", track.assets.stems, "All other individual instrument tracks"],
  ];

  return (
    <section className="detail-page">
      <div className="detail-hero">
        <div>
          <div className="detail-header-badges">
            <span className={`value-signal-badge ${track.valueSignal.toLowerCase().replace(" ", "-")}`}>
              {track.valueSignal}
            </span>
            {track.vipOnly && <span className="tier-badge vip">VIP Only</span>}
          </div>
          <h2>{track.title}</h2>
          <p className="detail-sub">{track.artist} · {track.genre} · {track.era}</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => togglePlay(track.id)}>
              {playingId === track.id ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />} Preview Track
            </button>
            <button className="outline-button" onClick={() => saveTrack(track.id)}>
              <Heart size={18} weight={saved ? "fill" : "regular"} /> {saved ? "Saved to Project" : "Save to Project"}
            </button>
            <button className="gold-button" onClick={() => requestLicense(track)}>
              <LockKey size={18} /> {track.vipOnly ? "Fast-Track License" : "Request License"}
            </button>
          </div>
        </div>
        <div className="detail-image" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.55)), url(${track.image})` }} />
      </div>

      <div className="large-player">
        <div className="player-top">
          <strong>Preview Only</strong>
          <span>Protected master audio · WAV available after approval · Secure delivery</span>
        </div>
        <div className="waveform big" />
      </div>

      <div className="detail-grid-three">
        <Panel title="Track Information" action="Metadata Summary">
          <dl className="definition-grid">
            <dt>Title</dt><dd>{track.title}</dd>
            <dt>Artist</dt><dd>{track.artist}</dd>
            <dt>Album</dt><dd>{track.artist} – {track.title} (Single)</dd>
            <dt>Genre</dt><dd>{track.genre} · {track.subgenre}</dd>
            <dt>Mood</dt><dd>{track.mood}</dd>
            <dt>Energy</dt><dd>{track.energy}</dd>
            <dt>BPM</dt><dd>{track.bpm}</dd>
            <dt>Duration</dt><dd>{track.duration}</dd>
            <dt>Vocal Type</dt><dd>{track.vocal}</dd>
            <dt>Era</dt><dd>{track.era}</dd>
            <dt>Instrumentation</dt><dd className="instr-desc">{track.instrumentation}</dd>
          </dl>
        </Panel>

        <Panel title="Rights & Ownership" action={track.rightsData.rightsVerified ? "Verified" : "Review Required"}>
          <dl className="definition-grid">
            <dt>Master Owner</dt><dd>{track.rightsData.masterOwner}</dd>
            <dt>Publishing Owner</dt><dd>{track.rightsData.publishingOwner}</dd>
            <dt>Rights Status</dt><dd>{track.rightsData.rightsVerified ? "Verified" : "Under Review"}</dd>
            <dt>Territory</dt><dd>{track.rightsData.territory}</dd>
            <dt>PRO / Affiliation</dt><dd>{track.rightsData.proAffiliation} · {track.rightsData.registrationId}</dd>
            <dt>Exclusivity Status</dt><dd>{track.commercial.exclusivityAvailable ? "Exclusivity Options Available" : "Non-Exclusive Only"}</dd>
            <dt>Approval Status</dt><dd>Preston: {track.rightsData.prestonApproval} · Legal: {track.rightsData.legalReview}</dd>
          </dl>
          <div className="disclaimer-box">
            <small>Rights information is subject to documentation and legal review.</small>
          </div>
        </Panel>

        <Panel title="Commercial & Assets" action="Clearance Path">
          <div className="commercial-info-box">
            <h4>Commercial Information</h4>
            <dl className="definition-grid">
              <dt>Pricing Model</dt><dd>{track.commercial.pricingType}</dd>
              <dt>Price Range</dt><dd>{track.commercial.priceRange}</dd>
              <dt>Clearance State</dt><dd>{track.commercial.rightsReviewRequired ? "Rights Review Required" : "Eligible for Fast-Track"}</dd>
            </dl>
          </div>

          <div className="assets-status-section">
            <h4>Available Assets</h4>
            <div className="asset-detail-badges">
              {assetsList.map(([label, ready, desc]) => (
                <span key={label} className={`asset-status-pill ${ready ? "unlocked" : "locked"}`} title={desc}>
                  <LockKey size={12} />
                  <strong>{label}</strong>
                  <small>{ready ? "Ready" : "Locked"}</small>
                </span>
              ))}
            </div>
            <p className="muted-note">WAV master files, stems, vocals, instrumentals, alternate mixes, and loops remain encrypted and locked. Access keys are issued automatically upon license approval, payment, or VIP agreement terms.</p>
          </div>
        </Panel>
      </div>

      <div className="detail-grid">
        <Panel title="Sync Details & Placement Fit" action="Stewardship">
          <p>{track.rights}</p>
          <div className="placement-fit-callout">
            <strong>Optimal Scene Fit:</strong> <span>{track.sceneFit}</span>
          </div>
          <div className="locked-box"><LockKey size={24} /> Protected Master Audio <small>Encrypted master asset delivery, validation hashing, and transaction auditing are configured for this track.</small></div>
        </Panel>
      </div>

      <section>
        <h3>Similar tracks</h3>
        <div className="track-list compact">
          {tracks.filter((item) => item.id !== track.id).slice(0, 3).map((item) => (
            <TrackRow
              key={item.id}
              track={item}
              isPlaying={playingId === item.id}
              saved={saved}
              onPlay={() => togglePlay(item.id)}
              onSave={() => saveTrack(item.id)}
              onOpen={() => openTrack(item)}
              onRequest={() => requestLicense(item)}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function ArtistProfile({ requestLicense, openTrack, playingId, togglePlay, savedIds, saveTrack, setView }) {
  const artist = artists[0];
  return (
    <section className="artist-page">
      <div className="artist-hero">
        <div className="portrait" style={{ backgroundImage: `url(${artist.image})` }} />
        <div>
          <span className="eyebrow">Artist profile</span>
          <h2>{artist.name}</h2>
          <p>A musician-founded composer project blending warm piano, cinematic restraint, and live-band provenance for film, television, and brand storytelling.</p>
          <div className="button-row"><button className="gold-button" onClick={requestLicense}><ShieldCheck size={18} /> Request License</button><button className="outline-button" onClick={() => setView("stories")}><Article size={18} /> Editorial Story</button></div>
        </div>
      </div>
      <div className="editorial-band two-col">
        <Panel title="Editorial story" action="Human context"><p>Lennox writes with the restraint of a film editor: space for dialogue, room for memory, and enough melodic gravity to carry a scene without crowding it.</p></Panel>
        <Panel title="Credits / notable work" action="Verified"><p>Independent film campaigns, documentary title beds, premium hospitality reels, and limited-run artist collaborations.</p></Panel>
        <Panel title="Archive / context notes" action="Provenance"><p>Recording notes preserve collaborators, dates, instruments, and rights conversations so discovery feels credible and respectful.</p></Panel>
        <Panel title="Featured collection" action="Licensable"><p>Music for Emotional Storytelling includes 18 related tracks, preview-only listening, and protected master delivery after approval.</p></Panel>
      </div>
      <h3>Related tracks</h3>
      <div className="track-list compact">{tracks.slice(0, 3).map((track) => <TrackRow key={track.id} track={track} isPlaying={playingId === track.id} saved={savedIds.includes(track.id)} onPlay={() => togglePlay(track.id)} onSave={() => saveTrack(track.id)} onOpen={() => openTrack(track)} onRequest={requestLicense} />)}</div>
    </section>
  );
}

function Legacy({ setView, openTrack }) {
  const legacyTimeline = [
    ["1972 — The Tapes Exist", "Gary Burke begins recording raw jazz-funk sessions in a converted warehouse in Brooklyn, capturing analog vibes on a 2-inch tape deck."],
    ["1981 — Lowercase Brand Spirit", "Burke registers the lowercase 'beatmondo' logo, insisting that the music should speak softly rather than scream for attention."],
    ["1995 — Private Licensing Room", "A selective, physical listening space is set up in Soho, letting film supervisors listen to secure masters under private rights contracts."],
    ["2026 — Gated Sync Platform", "The original stewardship values transition to a premium gated ecosystem, preserving rights integrity and master quality for the next era."]
  ];

  const legacyStories = [
    {
      title: "The Tape Archival Sessions",
      kicker: "Studio Memories",
      desc: "Gary was obsessive about room mic placement. We preserved every tape hiss, original room reflection, and transient response. When you download a WAV master here, you are getting the direct analog path.",
      image: img.musicArchive
    },
    {
      title: "Inside the Starlite Studio Console",
      kicker: "Stewardship Notes",
      desc: "Built on custom transformers and Class-A circuitry. The classic warmth of these recordings cannot be replicated in modern digital environments. It is a highly differentiated asset for premium film cues.",
      image: img.privateStudio
    }
  ];

  return (
    <section className="legacy-page">
      <div className="legacy-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,8,6,.88), rgba(10,8,6,.48), rgba(10,8,6,.2)), url(${img.legacyDetail})` }}>
        <div className="legacy-hero-copy">
          <span className="eyebrow">Stewardship · Archive</span>
          <h2>The Gary Burke Legacy</h2>
          <p>A respectful look at the original beatmondo spirit, analog studio memories, lowercase brand identity, and musician-led sync stewardship.</p>
          <button className="gold-button legacy-primary-button" onClick={() => setView("catalog")}><MusicNote size={18} /> Explore Legacy Music</button>
        </div>
      </div>

      <div className="legacy-grid-two">
        <Panel title="Gary Burke & beatmondo" action="Biography">
          <div className="legacy-biography-layout">
            <figure className="gary-burke-portrait">
              <img src="/assets/editorial/gary-burke-studio-portrait.webp" alt="Gary Burke seated in a recording studio beside a drum kit" />
              <figcaption>Gary Burke in the studio · musician, recordist, and original steward of beatmondo</figcaption>
            </figure>
            <div className="biography-text">
              <p>Gary Burke was a recordist, visionary, and defender of artist rights. In a time when mass-market libraries began to commoditize music, Gary established <strong>beatmondo</strong> as a private sanctuary for authentic musicianship.</p>
              <p>He famously insisted on lowercase typography for the brand name, believing that premium works do not need to shout. To Gary, sync licensing was not a transaction — it was a respectful placement of art into a storytelling medium.</p>
              <p>Today, we maintain that philosophy through selective access, verified rights, and protected delivery.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Archive Milestones" action="Historical Timeline">
          <div className="timeline-vertical">
            {legacyTimeline.map(([title, text]) => (
              <div className="timeline-node" key={title}>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <section className="legacy-editorial-section">
        <div className="legacy-section-heading">
          <span className="eyebrow">Archive stories</span>
          <h3>Studio memories and stewardship notes</h3>
        </div>
        <div className="editorial-row">
          {legacyStories.map(story => (
            <article className="story-card-editorial" key={story.title} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(8,6,4,.9)), url(${story.image})` }}>
              <span className="story-kicker">{story.kicker}</span>
              <h3>{story.title}</h3>
              <p>{story.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="featured-legacy-tracks">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Archive selections</span>
            <h3>Featured Legacy Recordings</h3>
          </div>
          <button className="outline-button" onClick={() => setView("catalog")}>Explore Music</button>
        </div>
        <div className="legacy-tracks-grid">
          <article className="legacy-track-card" onClick={() => openTrack(tracks[3])}>
            <div className="track-img-block" style={{ backgroundImage: `url(${tracks[3].image})` }} />
            <div className="track-desc-block">
              <span className="value-signal-badge premium-demand">{tracks[3].valueSignal}</span>
              <h4>{tracks[3].title}</h4>
              <p>{tracks[3].artist} · {tracks[3].era} · {tracks[3].genre}</p>
              <span>Original Soho session master · 100% publishing verified</span>
            </div>
            <button className="gold-button legacy-primary-button">Request License</button>
          </article>

          <article className="legacy-track-card" onClick={() => openTrack(tracks[12])}>
            <div className="track-img-block" style={{ backgroundImage: `url(${tracks[12].image})` }} />
            <div className="track-desc-block">
              <span className="value-signal-badge growing-interest">{tracks[12].valueSignal}</span>
              <h4>{tracks[12].title}</h4>
              <p>{tracks[12].artist} · {tracks[12].era} · {tracks[12].genre}</p>
              <span>Multi-track tape transfer complete · Stems ready</span>
            </div>
            <button className="gold-button legacy-primary-button">Request License</button>
          </article>
        </div>
      </section>
    </section>
  );
}

function LicensingAccess({ selectedTrack, requestSent, setRequestSent, setView }) {
  const [mode, setMode] = useState("license");
  const [accessSent, setAccessSent] = useState(false);
  const [selectedTier, setSelectedTier] = useState("VIP Sync Access");
  return (
    <section className="form-page wide-page licensing-page">
      <div className="licensing-header">
        <div className="form-intro">
          <span className="eyebrow">Licensing and access</span>
          <h2>Gated access first. Secure delivery after approval or VIP terms.</h2>
          <p>Request a license for a track or apply for Discovery, Professional, or VIP Sync Access. beatmondo keeps access selective, rights-controlled, and audit-ready.</p>
        </div>
        <div className="segmented stacked licensing-mode">
          <span className="eyebrow">Request type</span>
          <p>{mode === "license" ? "Submit usage parameters for a selected track." : "Apply for buyer, contributor, or partner workspace access."}</p>
          <button className={mode === "license" ? "active" : ""} onClick={() => setMode("license")}>Request License</button>
          <button className={mode === "access" ? "active" : ""} onClick={() => setMode("access")}>Request Access</button>
        </div>
      </div>
      <div className="tier-grid form-tier-grid">
        {buyerTiers.map((tier) => (
          <button type="button" key={tier.id} className={`tier-pick ${tier.id === "vip" ? "vip-tier-pick" : ""} ${selectedTier === tier.name ? "active" : ""}`} onClick={() => setSelectedTier(tier.name)}>
            <span className="tier-badge">{tier.name}</span>
            <strong>{tier.name}</strong>
            <small>{tier.priceLabel}</small>
            <span>{tier.features.slice(0, 3).join(" · ")}</span>
          </button>
        ))}
      </div>
      <div className="licensing-workspace">
        <div>
          {mode === "license" ? (requestSent ? <ConfirmationScreen track={selectedTrack} tier={selectedTier} setView={setView} /> : <InquiryForm track={selectedTrack} onSubmit={() => setRequestSent(true)} selectedTier={selectedTier} />) : (accessSent ? <AccessConfirmation tier={selectedTier} /> : <AccessForm onSubmit={() => setAccessSent(true)} selectedTier={selectedTier} />)}
        </div>
        <LicensingSummary track={selectedTrack} selectedTier={selectedTier} mode={mode} />
      </div>
    </section>
  );
}

function FieldGroup({ title, note, children }) {
  return (
    <fieldset className="form-section">
      <legend>{title}</legend>
      {note && <p>{note}</p>}
      <div className="form-section-grid">{children}</div>
    </fieldset>
  );
}

function LicensingSummary({ track, selectedTier, mode }) {
  const isVip = selectedTier === "VIP Sync Access";
  const steps = isVip
    ? ["Confirm usage parameters", "Concierge rights review", "Pre-approved terms or quote", "Fast-track secure delivery"]
    : ["Submit usage details", "Rights and quote review", "Approval and payment", "Secure WAV delivery"];
  return (
    <aside className="licensing-summary-panel">
      <span className="eyebrow">{mode === "license" ? "Licensing summary" : "Access review"}</span>
      <h3>{isVip ? "VIP priority path" : "Controlled access path"}</h3>
      <div className="summary-list">
        <span><strong>Track</strong>{track.title}</span>
        <span><strong>Buyer tier</strong>{selectedTier}</span>
        <span><strong>Verification</strong>{currentBuyer.verified ? "Verified buyer" : "Review needed"}</span>
        <span><strong>Rights status</strong>{track.rightsData?.rightsVerified ? "Ownership verified" : "Rights check needed"}</span>
        <span><strong>Delivery</strong>{track.assets?.stems ? "WAV master + stems" : "WAV master after approval"}</span>
        <span><strong>Terms</strong>{isVip ? "Pre-approved where available" : "Quote-based licensing"}</span>
      </div>
      <div className="workflow-steps">
        {steps.map((step, index) => <span key={step}><em>{index + 1}</em>{step}</span>)}
      </div>
      <div className="locked-box summary-lock"><LockKey size={24} /> Protected master audio <small>Files remain private until approval, payment, or VIP terms are confirmed.</small></div>
    </aside>
  );
}

function InquiryModal({ track, requestSent, setRequestSent, onClose, setView }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    modalRef.current?.querySelector("input, button, select, textarea")?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="license-modal-title" onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        {requestSent ? <ConfirmationScreen track={track} compact setView={setView} onClose={onClose} /> : <><h2 id="license-modal-title">Request license for {track.title}</h2><InquiryForm track={track} onSubmit={() => setRequestSent(true)} compact /></>}
      </div>
    </div>
  );
}

function InquiryForm({ track, onSubmit, compact, selectedTier = currentBuyer.accessTier }) {
  const [form, setForm] = useState({
    name: "Alex Davenport",
    email: "alex@northstar.com",
    company: "Northstar Pictures",
    role: "Music Supervisor",
    buyerLevel: selectedTier,
    projectName: "Luxury Auto Campaign - Fall 2026",
    projectType: "Advertising",
    brand: "Aster Automotive",
    productionCompany: "Northstar Pictures",
    description: "High-end cinematic project targeting global brand platforms.",
    deadline: "2026-09-18",
    usage: "Advertising",
    territory: "Global",
    term: "1 Year",
    rights: "Non-Exclusive",
    assets: ["WAV Master", "Stems", "Instrumental"],
    budget: "$25k-$50k",
    notes: "Scene involves a night drive in a coastal setting. Music should build towards the reveal.",
  });

  const [attempted, setAttempted] = useState(false);
  const [step, setStep] = useState(0);

  const update = (field, value) => setForm({ ...form, [field]: value });
  
  const toggleAsset = (assetName) => {
    setForm(prev => {
      const current = prev.assets.includes(assetName)
        ? prev.assets.filter(a => a !== assetName)
        : [...prev.assets, assetName];
      return { ...prev, assets: current };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);
    onSubmit();
  };

  const stepsList = [
    "Buyer", "Project", "Usage", "Territory", "Term", "Rights", "Assets", "Budget", "Notes", "Review"
  ];

  const steps = [
    {
      id: "buyer",
      title: "Step 1 — Buyer Details",
      note: "Who should the licensing team verify and contact?",
      fields: (
        <FieldGroup title="Buyer Details" note="Provide supervisor/buyer context.">
          <label>Full Name <input required value={form.name} onChange={e => update("name", e.target.value)} /></label>
          <label>Work Email <input type="email" required value={form.email} onChange={e => update("email", e.target.value)} /></label>
          <label>Company <input required value={form.company} onChange={e => update("company", e.target.value)} /></label>
          <label>Job Title <input required value={form.role} onChange={e => update("role", e.target.value)} /></label>
          <label>Buyer Level <input value={form.buyerLevel} readOnly className="read-only-input" /></label>
        </FieldGroup>
      )
    },
    {
      id: "project",
      title: "Step 2 — Project Context",
      note: "Provide credentials and details about the project.",
      fields: (
        <FieldGroup title="Project Details" note="Details of the production workspace.">
          <label>Project Name <input required value={form.projectName} onChange={e => update("projectName", e.target.value)} /></label>
          <label>Project Type <select value={form.projectType} onChange={e => update("projectType", e.target.value)}><option>Film / TV</option><option>OTT / streaming</option><option>Advertising</option><option>Brand Film</option><option>Trailer / Promo</option><option>Documentary</option><option>Sports / broadcast</option><option>Luxury / lifestyle campaign</option><option>Game</option><option>Live event</option><option>Editorial / Media</option></select></label>
          <label>Brand / Client <input value={form.brand} onChange={e => update("brand", e.target.value)} /></label>
          <label>Production Company <input value={form.productionCompany} onChange={e => update("productionCompany", e.target.value)} /></label>
          <label>Project Description <input value={form.description} onChange={e => update("description", e.target.value)} /></label>
          <label>Project Deadline <input type="date" value={form.deadline} onChange={e => update("deadline", e.target.value)} /></label>
        </FieldGroup>
      )
    },
    {
      id: "usage",
      title: "Step 3 — Usage Categories",
      note: "Select the primary placement medium for this request.",
      fields: (
        <FieldGroup title="Usage Categories" note="Choose how the track will be placed.">
          <div className="toggle-button-group">
            {["Film", "Television", "OTT", "Advertising", "Social", "Trailer", "Documentary", "Game", "Event", "Other"].map(opt => (
              <button type="button" key={opt} className={`toggle-option-btn ${form.usage === opt ? "active" : ""}`} onClick={() => update("usage", opt)}>
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      )
    },
    {
      id: "territory",
      title: "Step 4 — Territory Scope",
      note: "What distribution territories are required?",
      fields: (
        <FieldGroup title="Territory Scope" note="Select licensing coverage.">
          <div className="toggle-button-group">
            {["Local", "National", "Regional", "Global", "Custom"].map(opt => (
              <button type="button" key={opt} className={`toggle-option-btn ${form.territory === opt ? "active" : ""}`} onClick={() => update("territory", opt)}>
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      )
    },
    {
      id: "term",
      title: "Step 5 — Term Duration",
      note: "How long will the licensing coverage remain active?",
      fields: (
        <FieldGroup title="Term Duration" note="Select the license period.">
          <div className="toggle-button-group">
            {["3 Months", "6 Months", "1 Year", "2 Years", "5 Years", "Perpetual", "Custom"].map(opt => (
              <button type="button" key={opt} className={`toggle-option-btn ${form.term === opt ? "active" : ""}`} onClick={() => update("term", opt)}>
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      )
    },
    {
      id: "rights",
      title: "Step 6 — Rights Scope",
      note: "Select the exclusivity requirements for this request.",
      fields: (
        <FieldGroup title="Rights Scope" note="Exclusivity terms affect clearance pathways.">
          <div className="toggle-button-group">
            {["Non-Exclusive", "Category Exclusive", "Territory Exclusive", "Full Exclusive", "Rights Review Required"].map(opt => (
              <button type="button" key={opt} className={`toggle-option-btn ${form.rights === opt ? "active" : ""}`} onClick={() => update("rights", opt)}>
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      )
    },
    {
      id: "assets",
      title: "Step 7 — Asset Selections",
      note: "Which file deliveries are needed for this workspace?",
      fields: (
        <FieldGroup title="Asset Deliveries" note="Locked masters and stems will be prepared.">
          <div className="toggle-button-group multi">
            {["WAV Master", "Instrumental", "Vocal Version", "Stems", "Alternate Mix", "Short Edit", "Extended Version", "Custom Version"].map(opt => (
              <button type="button" key={opt} className={`toggle-option-btn ${form.assets.includes(opt) ? "active" : ""}`} onClick={() => toggleAsset(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      )
    },
    {
      id: "budget",
      title: "Step 8 — Budget Level",
      note: "Select the budget range allocated for this track placement.",
      fields: (
        <FieldGroup title="Budget Level" note="This shapes the quote calculations.">
          <div className="toggle-button-group">
            {["Budget Range", "Request Quote", "Existing Terms", "VIP Terms"].map(opt => (
              <button type="button" key={opt} className={`toggle-option-btn ${form.budget === opt ? "active" : ""}`} onClick={() => update("budget", opt)}>
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      )
    },
    {
      id: "notes",
      title: "Step 9 — Editorial Notes",
      note: "Provide scene descriptions, sync timing, or custom requirements.",
      fields: (
        <FieldGroup title="Editorial Notes" note="Add scene details or custom requests.">
          <label className="full-field">
            Inquiry notes and creative brief
            <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Describe the scene, cue placement, edits, and delivery details..." />
          </label>
        </FieldGroup>
      )
    },
    {
      id: "review",
      title: "Step 10 — Review Request",
      note: "Verify your parameters before submitting to platform admin.",
      fields: (
        <div className="review-summary-wrapper">
          <div className="review-summary-header">
            <h4>Sync Licensing Request Summary</h4>
            <span className="prototype-badge">Submitted for Review</span>
          </div>
          <div className="review-grid-two">
            <div className="review-block">
              <h5>Track Details</h5>
              <p><strong>Title:</strong> {track.title}</p>
              <p><strong>Artist:</strong> {track.artist}</p>
              <p><strong>Clearance:</strong> {track.rightsData.rightsVerified ? "Rights Verified" : "Review Needed"}</p>
            </div>
            <div className="review-block">
              <h5>Buyer Details</h5>
              <p><strong>Name:</strong> {form.name} ({form.role})</p>
              <p><strong>Company:</strong> {form.company}</p>
              <p><strong>Email:</strong> {form.email}</p>
              <p><strong>Tier:</strong> {form.buyerLevel}</p>
            </div>
            <div className="review-block">
              <h5>Project Parameters</h5>
              <p><strong>Project:</strong> {form.projectName}</p>
              <p><strong>Type:</strong> {form.projectType}</p>
              <p><strong>Brand / Client:</strong> {form.brand}</p>
              <p><strong>Deadline:</strong> {form.deadline}</p>
            </div>
            <div className="review-block">
              <h5>Licensing Terms</h5>
              <p><strong>Usage:</strong> {form.usage}</p>
              <p><strong>Territory:</strong> {form.territory}</p>
              <p><strong>Term:</strong> {form.term}</p>
              <p><strong>Rights:</strong> {form.rights}</p>
              <p><strong>Budget Pathway:</strong> {form.budget}</p>
            </div>
          </div>
          <div className="review-block full-width">
            <h5>Requested Assets</h5>
            <div className="review-assets-list">
              {form.assets.map(a => <span key={a} className="review-asset-pill"><LockKey size={10} /> {a}</span>)}
            </div>
          </div>
          <div className="review-block full-width">
            <h5>Editorial Notes</h5>
            <p className="review-notes-text">{form.notes}</p>
          </div>
        </div>
      )
    }
  ];

  const isLastStep = step === steps.length - 1;

  return (
    <form className={`inquiry-form ${compact ? "compact-form" : ""}`} onSubmit={handleSubmit} noValidate>
      {selectedTier === "VIP Sync Access" && step < 9 && (
        <p className="vip-form-note">VIP Concierge review is active. Your request will be prioritized for fast-track clearance.</p>
      )}
      
      <div className="request-stepper-scrollable">
        <div className="request-stepper-10">
          {stepsList.map((name, index) => (
            <button
              type="button"
              key={name}
              className={`step-btn-10 ${index === step ? "active" : index < step ? "complete" : ""}`}
              onClick={() => setStep(index)}
            >
              <em>{index + 1}</em>
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="step-intro">
        <span className="eyebrow">Step {step + 1} of {steps.length}</span>
        <h3>{steps[step].title}</h3>
        <p>{steps[step].note}</p>
      </div>

      <div className="step-fields-content">
        {steps[step].fields}
      </div>

      <div className="form-step-actions">
        <button
          type="button"
          className="outline-button"
          disabled={step === 0}
          onClick={() => setStep(current => Math.max(0, current - 1))}
        >
          Back
        </button>
        {isLastStep ? (
          <button className="gold-button form-submit" type="submit">
            <ShieldCheck size={18} /> Submit to Licensing Team
          </button>
        ) : (
          <button
            type="button"
            className="gold-button form-submit"
            onClick={() => setStep(current => Math.min(steps.length - 1, current + 1))}
          >
            Continue
          </button>
        )}
      </div>
    </form>
  );
}

function AccessForm({ onSubmit, selectedTier = currentBuyer.accessTier }) {
  const [role, setRole] = useState("Music Supervisor");
  return (
    <form className="inquiry-form access-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="role-grid">{["Music Supervisor", "Film / TV Producer", "Brand / Agency", "Trailer Editor", "Artist / Contributor", "Strategic Partner", "Other"].map((item) => <button type="button" key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)}>{item}</button>)}</div>
      <label>Name<input required placeholder="Jane Mitchell" /></label>
      <label>Email<input required placeholder="name@company.com" /></label>
      <label>Company<input required placeholder="Company or studio" /></label>
      <label>Role<input value={role} readOnly /></label>
      <label>Requested access tier<input value={selectedTier} readOnly /></label>
      <label>Membership / payment status<input value={selectedTier === "Discovery Access" ? "Entry approval required" : "Verification required"} readOnly /></label>
      <label className="full-field">Intended use<textarea required placeholder="Tell us how you expect to use beatmondo." /></label>
      <label className="full-field">Message<textarea placeholder="Anything the team should know?" /></label>
      <button className={`gold-button form-submit ${selectedTier === "VIP Sync Access" ? "vip-access-button" : ""}`} type="submit"><SignIn size={18} /> Request Access</button>
    </form>
  );
}

function ConfirmationScreen({ track, compact, tier = currentBuyer.accessTier, setView, onClose }) {
  return (
    <section className={`confirmation ${compact ? "compact-confirmation" : ""}`}>
      <CheckCircle size={52} weight="fill" />
      <h2>Your license request has been received.</h2>
      <p>The beatmondo team will review your usage details for <strong>{track.title}</strong> under <strong>{tier}</strong> and respond with next steps.</p>
      <div className="status-strip">{(tier === "VIP Sync Access" ? ["VIP Priority", "Concierge Review", "Pre-Approved Terms", "Fast-Track Delivery", "VIP Delivered"] : ["Submitted", "In Review", "Quote Needed", "Quote Sent", "Approved", "Paid", "Delivery Ready"]).map((status) => <span key={status}>{status}</span>)}</div>
      <div className="button-row" style={{ marginTop: 24, justifyContent: "center" }}>
        <button type="button" className="gold-button" onClick={() => {
          if (setView) setView("buyer");
          if (onClose) onClose();
        }}>
          Go to Buyer Dashboard
        </button>
        {onClose && (
          <button type="button" className="outline-button" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </section>
  );
}

function AccessConfirmation({ tier = currentBuyer.accessTier }) {
  return <section className="confirmation"><CheckCircle size={52} weight="fill" /><h2>Access request received.</h2><p>beatmondo will review your role, company, intended use, and requested <strong>{tier}</strong> permissions before enabling the right workspace.</p><div className="status-strip"><span>Request received</span><span>Buyer verification</span><span>{tier === "VIP Sync Access" ? "Concierge review" : "Workspace setup"}</span></div></section>;
}

function BuyerDashboard({ savedIds, setView, requestLicense, openTrack, playingId, togglePlay, saveTrack, showToast }) {
  const saved = tracks.filter((track) => savedIds.includes(track.id));
  
  const nextSteps = [
    ["Quote awaiting review", "Luxury Auto Campaign", "Review terms", () => setView("project")],
    ["Deadline approaching", "Documentary Opening Titles", "Submit usage notes", () => requestLicense(tracks[2])],
    ["Download ready", "Premium Hotel Launch Film", "Open delivery", () => showToast("Secure delivery workspace opened.")],
  ];

  const quotes = [
    { id: "Q-1042", project: "Luxury Auto Campaign - Fall 2026", track: "Golden Hours", cost: "$22,000", expires: "Sep 12, 2026", status: "Awaiting Review" },
    { id: "Q-1041", project: "Premium Hotel Launch Film", track: "Chasing the Light", cost: "$15,000", expires: "Aug 28, 2026", status: "Approved" },
    { id: "Q-1040", project: "Documentary Opening Titles", track: "Midnight Transit", cost: "$8,500", expires: "Sep 02, 2026", status: "Awaiting Terms" }
  ];

  const payments = [
    { invoice: "INV-2026-004", project: "Premium Hotel Launch Film", amount: "$15,000", date: "Jul 10, 2026", method: "Wire Transfer", status: "Paid" },
    { invoice: "INV-2026-005", project: "Luxury Auto Campaign - Fall 2026", amount: "$22,000", date: "Pending", method: "VIP Accounts Receivable", status: "Invoice Pending" }
  ];

  const deliveries = [
    { id: 1, asset: "Golden Hours (WAV Master)", fileType: "WAV (24-bit / 48kHz)", license: "Worldwide Brand Campaign (1 Year)", expiry: "Sep 30, 2026", count: 3, status: "Delivery Ready" },
    { id: 2, asset: "Chasing the Light (Full Stems)", fileType: "ZIP (8 WAV Stems)", license: "Premium Hotel Launch (Perpetual)", expiry: "Oct 15, 2026", count: 5, status: "Delivery Ready" }
  ];

  const history = [
    { date: "Jul 14, 2026", project: "Luxury Auto Campaign - Fall 2026", action: "VIP Fast-Track Clearance Initiated" },
    { date: "Jul 12, 2026", project: "Premium Hotel Launch Film", action: "Payment Confirmed & Access Keys Issued" },
    { date: "Jul 10, 2026", project: "Premium Hotel Launch Film", action: "License Terms Accepted by Buyer" },
    { date: "Jul 08, 2026", project: "Documentary Opening Titles", action: "Licensing Request Submitted" }
  ];

  return (
    <section className="dashboard-page">
      <section className="buyer-profile-card">
        <div>
          <span className="eyebrow">Buyer profile</span>
          <h2>{currentBuyer.name}</h2>
          <p>{currentBuyer.company} · {currentBuyer.role}</p>
        </div>
        <div className="buyer-profile-meta">
          <span className="tier-badge vip">{currentBuyer.accessTier}</span>
          <span>{currentBuyer.verified ? "Verified buyer" : "Verification needed"}</span>
          <span>Membership: {currentBuyer.membershipStatus}</span>
          <span>{currentBuyer.preApprovedTerms ? "Pre-approved terms active" : "Terms review needed"}</span>
        </div>
      </section>

      <div className="metric-grid-six">
        <Metric icon={Heart} label="Saved Tracks" value={saved.length || "0"} note="Ready for project review" />
        <Metric icon={BookmarkSimple} label="Active Projects" value="3" note="1 quote pending" />
        <Metric icon={FileAudio} label="Open Requests" value="4" note="2 need response" />
        <Metric icon={Sparkle} label="Quotes" value="3" note="1 needs approval" />
        <Metric icon={ShieldCheck} label="Approved Licenses" value="2" note="2 active syncs" />
        <Metric icon={DownloadSimple} label="Secure Deliveries" value="2" note="1 expires soon" />
      </div>

      <section className="vip-dashboard-panel">
        <div>
          <span className="eyebrow">VIP Sync Access</span>
          <h2>Priority licensing workspace</h2>
          <p>Private curated tracks, pre-approved terms, concierge review, fast-track licensing, and secure WAV/stems delivery for vetted high-value projects.</p>
        </div>
        <div className="metric-grid compact-metrics">
          <Metric icon={Sparkle} label="VIP Curated Tracks" value="18" note="Private selections" />
          <Metric icon={ShieldCheck} label="Priority Requests" value="3" note="Concierge review" />
          <Metric icon={DownloadSimple} label="Approved Downloads" value="2" note="WAV + stems" />
          <Metric icon={CalendarBlank} label="Membership" value="Active" note="Renews Sep 2026" />
        </div>
      </section>

      <section className="next-steps">
        <div>
          <span className="eyebrow">Next steps</span>
          <h2>Buyer workspace priorities</h2>
        </div>
        <div className="next-step-list">
          {nextSteps.map(([title, project, action, handler]) => (
            <article key={title}>
              <strong>{title}</strong>
              <span>{project}</span>
              <button onClick={handler}>{action}</button>
            </article>
          ))}
        </div>
      </section>

      <div className="dashboard-grid-full">
        <Panel title="Active Projects" action="Buyer workspace">
          <div className="project-grid-dashboard">
            {projects.map((project) => <ProjectCard key={project.name} project={project} onOpen={() => setView("project")} />)}
          </div>
        </Panel>
      </div>

      <div className="dashboard-grid">
        <Panel title="Saved tracks" action="Compare tracks">
          <div className="track-list compact">
            {saved.length ? saved.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isPlaying={playingId === track.id}
                saved
                onPlay={() => togglePlay(track.id)}
                onSave={() => saveTrack(track.id)}
                onOpen={() => openTrack(track)}
                onRequest={() => requestLicense(track)}
              />
            )) : (
              <EmptyState title="No saved tracks yet" text="Explore music and save tracks to compare inside a project." actionLabel="Explore music" onAction={() => setView("catalog")} />
            )}
          </div>
        </Panel>

        <Panel title="Submitted Licensing Requests" action="Status tracking">
          <div className="request-list">
            {inquiries.map((item) => <RequestRow key={item.id} item={item} />)}
          </div>
        </Panel>

        <Panel title="Active Quotes" action="Clearance pricing">
          <div className="dashboard-table-container">
            <table className="dashboard-data-table">
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Project Name</th>
                  <th>Track</th>
                  <th>Fee</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.id}>
                    <td><strong>{q.id}</strong></td>
                    <td>{q.project}</td>
                    <td>{q.track}</td>
                    <td>{q.cost}</td>
                    <td>{q.expires}</td>
                    <td><span className={`status-badge-inline ${q.status.toLowerCase().replace(" ", "-")}`}>{q.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Payment Status" action="Billing summary">
          <div className="dashboard-table-container">
            <table className="dashboard-data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Project Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.invoice}>
                    <td><strong>{p.invoice}</strong></td>
                    <td>{p.project}</td>
                    <td>{p.amount}</td>
                    <td>{p.date}</td>
                    <td>{p.method}</td>
                    <td><span className={`status-badge-inline ${p.status.toLowerCase().replace(" ", "-")}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Secure Deliveries" action="Approved files" className="full-width-panel">
          <div className="secure-deliveries-list">
            {deliveries.map(d => (
              <div key={d.id} className="delivery-card">
                <LockKey size={30} />
                <div className="delivery-card-info">
                  <strong>{d.asset}</strong>
                  <span>{d.fileType} · {d.license}</span>
                  <small>Expires {d.expiry} · {d.count} downloads remaining · download history tracked</small>
                </div>
                <div className="delivery-actions">
                  <button className="gold-button" onClick={() => showToast(`Secure download started for ${d.asset}.`)}>
                    <DownloadSimple size={18} /> Download
                  </button>
                  <button className="outline-button" onClick={() => showToast(`Reissue request submitted for ${d.asset}.`)}>
                    Request Reissue
                  </button>
                  <button className="outline-button" onClick={() => showToast("Viewing terms document...")}>
                    View Terms
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Licensing History Log" action="Audit trails">
          <div className="history-timeline">
            {history.map((h, i) => (
              <div key={i} className="history-item">
                <span className="history-date">{h.date}</span>
                <span className="history-proj"><strong>{h.project}</strong></span>
                <span className="history-action">{h.action}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function ProjectDetail({ requestLicense, openTrack, showToast }) {
  const projectTracks = tracks.slice(0, 4);
  return (
    <section className="project-page">
      <div className="project-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(17,15,12,.88), rgba(17,15,12,.28)), url(${projects[0].image})` }}>
        <div className="project-hero-content">
          <span className="eyebrow">Buyer project</span>
          <h2>{projects[0].name}</h2>
          <p>VIP project workspace for global brand campaign usage, multi-track quote review, rights verification, WAV/stems readiness, and fast-track licensing.</p>
          <div className="project-meta-strip">
            <span>VIP Sync Access</span><span>Global brand campaign</span><span>$25k-$50k</span><span>Deadline Sep 18</span><span>Pre-approved terms</span><span>3 WAV masters ready</span>
          </div>
          <div className="button-row"><button className="gold-button vip-access-button" onClick={requestLicense}><ShieldCheck size={18} /> Open VIP Licensing Workspace</button><button className="outline-button" onClick={() => showToast("Multi-track quote request opened.")}><BookmarkSimple size={18} /> Request Multiple Tracks</button><button className="outline-button" onClick={() => showToast("VIP fast-track review requested.")}><Sparkle size={18} /> Fast-Track Review</button></div>
        </div>
      </div>
      <div className="project-workspace-grid">
        <Panel title="Track comparison" action="4 shortlisted" className="track-comparison-panel">
          <div className="comparison-table">
            <div className="comparison-head"><span>Track</span><span>Mood</span><span>Rights</span><span>WAV / Stems</span><span /></div>
            {projectTracks.map((track) => (
              <button className="comparison-row" key={track.id} onClick={() => openTrack(track)}>
                <span><strong>{track.title}</strong><small>{track.artist} · {track.duration}</small></span>
                <span>{track.mood}</span>
                <span>{track.rightsData.rightsVerified ? "Verified" : "Review needed"}</span>
                <span>{track.assets.wavMaster ? "WAV" : "WAV pending"} · {track.assets.stems ? "Stems" : "No stems"}</span>
                <Eye size={18} />
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Internal notes" action="Private buyer workflow">
          <div className="note-list project-notes">
            <article><strong>Golden Hours</strong><span>Best fit for hero reveal. Check final VO timing before quote approval.</span></article>
            <article><strong>All That Remains</strong><span>Strong alternate, but may be too emotionally heavy for the final cut.</span></article>
            <textarea placeholder="Add note for creative team..." />
          </div>
        </Panel>
        <Panel title="Licensing status" action="Quote Sent">
          <div className="project-stepper">{["Submitted", "Under Review", "Quote Sent", "Payment Pending", "Delivered"].map((status, index) => <span key={status} className={index < 3 ? "complete" : ""}>{status}</span>)}</div>
        </Panel>
        <Panel title="Licensing summary" action="Buyer review">
          <div className="license-summary">
            <span>4 tracks selected</span><span>Worldwide paid media</span><span>1 year term</span><span>Non-exclusive</span><span>Protected masters locked</span><span>VIP fast-track available</span><span>Quote expires Sep 12</span>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function ProjectCard({ project, onOpen }) {
  return (
    <article className="project-card">
      <div className="project-card-image" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.06), rgba(0,0,0,.3)), url(${project.image})` }} />
      <div className="project-card-body">
        <span>{project.status}</span>
        <h3>{project.name}</h3>
        <p>{project.type} · {project.tracks} tracks · {project.notes} notes</p>
        <button onClick={onOpen}>Open project</button>
      </div>
    </article>
  );
}

function AdminDashboard({ showToast, togglePlay }) {
  const [adminTab, setAdminTab] = useState("Overview");
  const tabs = ["Overview", "Tracks", "Artists", "Inquiries", "Buyers", "Secure Delivery", "Media", "Analytics", "Audit Logs", "Settings"];
  const metricGroups = [
    ["Catalog Operations", [
      [MusicNote, "Total Tracks", "12,842", "Selected catalog"],
      [UsersThree, "Active Artists", "248", "Stewardship list"],
      [Sparkle, "Catalog Value Signals", "1,842", "High demand focus"]
    ]],
    ["Buyer Segments", [
      [UserCircle, "Professional Buyers", "154", "Approved workspaces"],
      [ShieldCheck, "VIP Buyers", "42", "Priority review active"],
      [FileAudio, "Revenue Pipeline", "$1.8M", "Quote pipeline"]
    ]],
    ["Licensing & Delivery", [
      [FileAudio, "Licensing Requests", "37", "Active requests"],
      [CheckCircle, "Approved Licenses", "124", "Verified placements"],
      [DownloadSimple, "Secure Deliveries", "84", "Delivered WAV/stems"]
    ]]
  ];
  const pipelineItems = [
    ["New", 37, "neutral"],
    ["In Review", 21, "neutral"],
    ["Rights Check Needed", 14, "attention"],
    ["Quote Needed", 9, "attention"],
    ["Quote Sent", 11, "neutral"],
    ["VIP Priority", 7, "priority"],
    ["Delivery Ready", 5, "ready"],
  ];
  const activityItems = [
    ["License delivered to VisionTech", "Delivery", "2m ago"],
    ["New inquiry from National Geographic", "New", "10m ago"],
    ["Quote approved for Peak Performance", "Quote", "18m ago"],
    ["Track uploaded: Midnight Conversations", "Asset", "26m ago"],
    ["Permissions updated", "Audit", "34m ago"],
  ];
  const priorityItems = [
    ["Rights checks", "14 blocked", "Review ownership proof, PRO data, and Preston approvals before tracks become licensing eligible.", "Tracks"],
    ["Quotes needed", "9 open", "Move high-intent buyer requests from review into quote-ready status.", "Inquiries"],
    ["VIP priority", "7 active", "Fast-track concierge review, pre-approved terms, and secure delivery for top-tier buyers.", "Buyers"],
    ["Delivery ready", "5 waiting", "Confirm payment or VIP terms before protected master audio is released.", "Secure Delivery"],
  ];

  const renderAdminPanel = () => {
    if (adminTab === "Artists") return <ArtistAdmin showToast={showToast} />;
    if (adminTab === "Inquiries") return <InquiryAdmin />;
    if (adminTab === "Media") return <MediaAdmin showToast={showToast} />;
    if (adminTab === "Audit Logs") return <AuditAdmin />;
    if (adminTab === "Secure Delivery") return <SecureDeliveryAdmin showToast={showToast} />;
    if (adminTab === "Buyers") return <BuyerAdmin showToast={showToast} />;
    if (adminTab === "Overview") return <OverviewAdmin showToast={showToast} />;
    if (adminTab === "Analytics") return <AnalyticsAdmin />;
    if (adminTab === "Settings") return <SettingsAdmin showToast={showToast} />;
    return <TrackAdmin showToast={showToast} togglePlay={togglePlay} />;
  };

  return (
    <section className="admin-page">
      {adminTab === "Overview" && (
        <div className="admin-overview-summary">
          <div>
            <span className="eyebrow">Today in the workspace</span>
            <strong>23 items need admin attention before buyers receive quotes or protected master audio.</strong>
          </div>
          <div><span>Rights checks</span><strong>14</strong></div>
          <div><span>Quotes needed</span><strong>9</strong></div>
          <div><span>VIP priority</span><strong>7</strong></div>
        </div>
      )}
      <div className="admin-priority-strip" aria-label="Priority admin queues">
        {priorityItems.map(([title, count, note, target]) => (
          <button key={title} type="button" onClick={() => setAdminTab(target)}>
            <span>{title}</span>
            <strong>{count}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>
      <div className="admin-tabs">{tabs.map((tab) => <button key={tab} className={adminTab === tab ? "active" : ""} onClick={() => setAdminTab(tab)}>{tab}</button>)}</div>
      <div className="admin-metric-groups">
        {metricGroups.map(([group, metrics]) => (
          <section key={group}>
            <h3>{group}</h3>
            <div>
              {metrics.map(([Icon, label, value, note]) => <Metric key={label} icon={Icon} label={label} value={value} note={note} />)}
            </div>
          </section>
        ))}
      </div>
      <div className={`admin-grid ${adminTab === "Tracks" ? "tracks-admin-grid" : ""}`}>
        <section className="pipeline-panel">
          <h3>Licensing inquiry pipeline</h3>
          <div className="pipeline">
            {pipelineItems.map(([status, count, tone]) => (
              <button key={status} className={`pipeline-${tone}`} onClick={() => showToast(`Filtered pipeline by ${status}.`)}>
                <span>{status}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </section>
        <Panel title={adminTab === "Overview" ? "Music operations" : `${adminTab} management`} action="Operational view">{renderAdminPanel()}</Panel>
        <Panel title="Activity feed" action="Audit ready">
          <div className="activity-list activity-list-actionable">{activityItems.map(([text, tag, time]) => <p key={text}><CheckCircle size={18} /> <span className="activity-copy">{text}<small>{tag}</small></span> <span>{time}</span></p>)}</div>
          <p className="admin-audit-note">Audit trail synced across licensing, delivery, and permissions events.</p>
        </Panel>
      </div>
    </section>
  );
}

function OverviewAdmin({ showToast }) {
  const cards = [
    [Sparkle, "Catalog health", "94% complete", "Published tracks with rights notes, preview audio, and delivery readiness.", "Open report"],
    [ShieldCheck, "Licensing queue", "37 new", "New inquiries, quote requests, and approvals awaiting payment confirmation.", "Review queue"],
    [Eye, "Private catalog intelligence", "42% lift", "VIP buyers are saving cinematic instrumentals more often this week.", "Open insights"],
    [LockKey, "Rights verification backlog", "19 blocked", "Ownership proof, PRO registry confirmation, contract review, or Preston approval needed.", "Review rights"],
  ];
  return (
    <div className="cards-admin overview-action-grid">
      {cards.map(([Icon, title, stat, copy, action]) => (
        <article key={title}>
          <div className="overview-card-head"><Icon size={24} /><strong>{stat}</strong></div>
          <h3>{title}</h3>
          <p>{copy}</p>
          <button onClick={() => showToast(`${title} opened.`)}>{action}</button>
        </article>
      ))}
    </div>
  );
}

function AnalyticsAdmin() {
  const analyticsCards = [
    [Eye, "Most Requested Tracks", "Golden Hours (14 requests) · Chasing the Light (11) · Paper Planes (9) · Better Than Before (8)"],
    [Heart, "Most Saved Tracks", "Golden Hours (42 saves) · Midnight Transit (38) · Chasing the Light (31) · All That Remains (27)"],
    [ShieldCheck, "Highest Conversion Tracks", "Paper Planes (47% save→request) · Better Than Before (41%) · Golden Hours (33%)"],
    [UsersThree, "Buyer Activity", "18 active buyers this week · 7 VIP buyers · 4 new Professional accounts · 3 upgrade candidates"],
    [FilmSlate, "Top Use Cases", "Advertising (31%) · Film/TV (24%) · OTT/Streaming (18%) · Branded Content (12%) · Documentary (9%)"],
    [MusicNote, "Top Genres", "Cinematic (28%) · Indie Rock (22%) · Soul (16%) · Ambient (14%) · Acoustic (12%) · Pop (8%)"],
    [Sparkle, "Top Moods", "Reflective (24%) · Driven (19%) · Emotional (17%) · Inspiring (15%) · Moody (14%) · Feel Good (11%)"],
    [UserCircle, "VIP Activity", "VIP buyers engaging 42% more with cinematic instrumentals · 3 exclusive requests pending · 2 fast-track deliveries in progress"],
    [LockKey, "Rights Bottlenecks", "4 high-intent requests delayed by rights verification · 2 tracks awaiting ownership documentation · 1 legal review pending"],
    [FileAudio, "Asset Demand", "WAV masters requested on 89% of approved licenses · Instrumentals requested on 64% · Custom edits requested on 23%"],
    [CloudArrowUp, "Stem Demand", "Stem requests increased 31% this quarter · Drum stems most requested (45%) · Guitar stems (28%) · Vocal isolations (18%)"],
    [CalendarBlank, "Licensing Trends", "Average quote value up 18% this quarter · VIP deal size 2.4x standard · Perpetual licensing requests growing 12% month-over-month"],
  ];
  const aiInsights = [
    "Instrumental versions show increased demand in advertising projects.",
    "VIP buyers are engaging most with cinematic and emotionally driven tracks.",
    "Three catalog assets are showing accelerated licensing activity.",
    "Rights verification is delaying four high-intent requests.",
  ];
  return (
    <div className="analytics-admin-expanded">
      <div className="cards-admin analytics-card-grid">
        {analyticsCards.map(([Icon, title, text]) => (
          <article key={title}>
            <Icon size={24} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="ai-insights-panel">
        <div className="ai-insights-header">
          <Sparkle size={22} />
          <div>
            <h3>AI Catalog Insights</h3>
            <span className="eyebrow">Prototype Insight · Demonstration Data</span>
          </div>
        </div>
        <div className="ai-insights-grid">
          {aiInsights.map((insight) => (
            <article key={insight} className="ai-insight-card">
              <span className="prototype-badge">Prototype Insight</span>
              <p>{insight}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsAdmin({ showToast }) {
  return (
    <div className="cards-admin">
      <article><GearSix size={28} /><h3>Workspace settings</h3><p>Role permissions, delivery rules, quote templates, and notification defaults.</p><button onClick={() => showToast("Workspace settings panel opened.")}>Edit settings</button></article>
      <article><LockKey size={28} /><h3>Security controls</h3><p>Master delivery encryption, download limits, and audit retention policies.</p><button onClick={() => showToast("Security controls opened.")}>Manage security</button></article>
    </div>
  );
}

function TrackAdmin({ showToast, togglePlay }) {
  const filters = ["All", "Rights Review Needed", "Verified", "Stems Ready", "WAV Pending", "Preston Pending", "Licensing Eligible"];
  const reviewQueue = tracks.filter((track) => !track.rightsData.rightsVerified || !track.rightsData.licensingEligible || track.rightsData.prestonApproval !== "Approved");
  return (
    <div className="track-ops">
      <div className="track-admin-toolbar">
        <input placeholder="Search tracks, artists, ISRC..." />
        <button onClick={() => showToast("Track upload workflow opened.")}><CloudArrowUp size={18} /> Add Track</button>
      </div>
      <div className="track-filter-row">{filters.map((filter) => <button key={filter} onClick={() => showToast(`Filtered tracks by ${filter}.`)}>{filter}</button>)}</div>
      <div className="track-ops-grid">
        <div className="track-operation-list">
          {tracks.slice(0, 5).map((track) => (
            <article className={`track-operation-row ${track.rightsData.licensingEligible ? "eligible" : "blocked"}`} key={track.id}>
              <div className="track-op-main">
                <button className="mini-play" aria-label={`Preview ${track.title}`} onClick={() => togglePlay(track.id)}><Play size={14} weight="fill" /></button>
                <div>
                  <strong>{track.title}</strong>
                  <span>{track.artist} · ISRC US-BMO-25-000{track.id}</span>
                </div>
              </div>
              <div className="track-op-badges">
                <span className={track.rightsData.rightsVerified ? "state-good" : "state-risk"}>{track.rightsData.ownershipProof}</span>
                <span>{track.rightsData.proAffiliation} · {track.rightsData.registrationId}</span>
                <span className={track.rightsData.prestonApproval === "Approved" ? "state-good" : "state-risk"}>Preston {track.rightsData.prestonApproval}</span>
                <span className={track.rightsData.licensingEligible ? "state-good" : "state-risk"}>{track.rightsData.licensingEligible ? "Licensing Eligible" : "Not Eligible"}</span>
              </div>
              <div className="asset-chip-row">
                <span className={track.assets.preview ? "state-good" : "state-risk"}>Preview</span>
                <span className={track.assets.wavMaster ? "state-good" : "state-risk"}>WAV</span>
                <span className={track.assets.stems ? "state-good" : "state-warn"}>Stems</span>
                <span className={track.assets.instrumental ? "state-good" : "state-warn"}>Instrumental</span>
              </div>
              <div className="owner-stack">
                <span>Master: {track.rightsData.masterOwner}</span>
                <span>Publishing: {track.rightsData.publishingOwner}</span>
              </div>
              <div className="track-op-actions">
                <button onClick={() => showToast(`Rights review opened for ${track.title}.`)}>Review</button>
                <button onClick={() => showToast(`Asset manager opened for ${track.title}.`)}>Assets</button>
                <button onClick={() => togglePlay(track.id)}>Preview</button>
              </div>
            </article>
          ))}
        </div>
        <aside className="rights-review-queue">
          <span className="eyebrow">Rights review queue</span>
          <h3>Blocked tracks need action</h3>
          {reviewQueue.map((track) => (
            <article key={track.id}>
              <strong>{track.title}</strong>
              <span>{track.rightsData.contractStatus} · Preston {track.rightsData.prestonApproval}</span>
              <button onClick={() => showToast(`Priority review opened for ${track.title}.`)}>Open review</button>
            </article>
          ))}
        </aside>
      </div>
      <div className="file-separation upload-control-grid">
        <button onClick={() => showToast("Preview audio upload opened.")}><FileAudio size={24} /><strong>Preview Audio</strong><p>Upload compressed, watermarked preview streams for approved buyers.</p></button>
        <button onClick={() => showToast("Protected WAV master upload opened.")}><LockKey size={24} /><strong>WAV Master</strong><p>Upload encrypted protected master audio for approved delivery only.</p></button>
        <button onClick={() => showToast("Stems and alternate mixes workflow opened.")}><CloudArrowUp size={24} /><strong>Stems / Alternate Mixes</strong><p>Manage stems, instrumentals, loop edits, cue versions, and delivery readiness.</p></button>
      </div>
    </div>
  );
}

function ArtistAdmin({ showToast }) {
  return <div className="cards-admin">{artists.map((artist, index) => <article key={artist.name}><div className="portrait small" style={{ backgroundImage: `url(${artist.image})` }} /><h3>{artist.name}</h3><p>{artist.credit}</p><span>{["Metadata Review", "Rights Documentation Review", "Preston Approval"][index]} · {artist.tracks} submitted tracks</span><button onClick={() => showToast(`Controlled contributor review opened for ${artist.name}.`)}>Review submission</button></article>)}</div>;
}

function InquiryAdmin() {
  return <div className="request-list">{inquiries.map((item) => <RequestRow key={item.id} item={item} detailed />)}</div>;
}

function BuyerAdmin({ showToast }) {
  return <div className="cards-admin">{[["Aster Studio", "VIP Sync Access", "Active", "Concierge assigned"], ["Northline Pictures", "Professional Buyer", "Verified", "Standard support"], ["Cobalt Agency", "Discovery Access", "Entry approval", "Upgrade candidate"]].map(([name, tier, status, note]) => <article key={name}><UsersThree size={28} /><h3>{name}</h3><p>Role-based access, saved projects, invoice contacts, request history, and private buyer intelligence.</p><span>{tier} · {status} · {note}</span><button onClick={() => showToast(`Opened buyer account for ${name}.`)}>Open account</button></article>)}</div>;
}

function SecureDeliveryAdmin({ showToast }) {
  return <div className="cards-admin"><article><LockKey size={28} /><h3>Delivery queue</h3><p>5 approved licenses waiting on payment confirmation or VIP terms before WAV/stems delivery.</p><span>Buyer tier · payment status · rights cleared · expiry date</span><button onClick={() => showToast("Delivery queue opened.")}>Review queue</button></article><article><DownloadSimple size={28} /><h3>Download controls</h3><p>Expiring links, remaining download counts, terms accepted state, revoke access, and reissue secure link actions.</p><button onClick={() => showToast("Secure link reissue controls opened.")}>Manage links</button></article><article><ShieldCheck size={28} /><h3>Download history</h3><p>Every master and stems download is timestamped and tied to buyer role, project, license, and IP context.</p><button onClick={() => showToast("Download history opened.")}>View logs</button></article></div>;
}

function MediaAdmin({ showToast }) {
  return <div className="cards-admin"><article><Article size={28} /><h3>Stories editor</h3><p>Featured story, categories, tags, draft status, rights-sensitive language, and publish controls.</p><button onClick={() => showToast("Stories editor opened.")}>Edit stories</button></article><article><FilmSlate size={28} /><h3>Media episodes</h3><p>Short sync clips, artist stories, studio sessions, catalog highlights, VIP picks, legacy clips, and guest references.</p><button onClick={() => showToast("Media episodes manager opened.")}>Manage episodes</button></article></div>;
}

function AuditAdmin() {
  return <div className="activity-list">{["Role changed: Content Manager", "Master download approved", "Track rights notes edited", "Buyer access revoked", "Quote status changed"].map((item) => <p key={item}><ShieldCheck size={18} /> {item}<span>Immutable log</span></p>)}</div>;
}

function ContentPages({ setView, showToast }) {
  const hubCards = [
    ["Short Sync Clips", "30 sec", "Fast editorial cuts for high-intent discovery, social context, and sync-ready catalog moments.", img.mediaDesk, "media"],
    ["Story Library", "Features", "Rights-aware essays, artist context, Gary Burke legacy notes, and buyer-facing catalog stories.", img.privateStudio, "stories"],
    ["Media Episodes", "Episodes", "Artist stories, studio sessions, licensing conversations, catalog highlights, VIP picks, and legacy clips.", img.soulVocal, "media"],
    ["VIP Picks", "Private", "Curated premium selections and catalog intelligence for vetted buyers and strategic sync opportunities.", img.supervisorSuite, "media"],
    ["Gary Burke Legacy", "Archive", "Original brand spirit, archive memories, collaborator notes, and legacy-aware editorial context.", img.musicArchive, "legacy"],
    ["Catalog Highlights", "15 sec", "Quick, visual entry points into tracks with strong sync potential, stems, and rights context.", img.scoringStage, "media"],
  ];
  const pathways = [
    ["Stories", "Browse the editorial library", "stories"],
    ["Media Episodes", "Open the media library", "media"],
    ["Gary Burke Legacy", "Visit the archive", "legacy"],
  ];
  return (
    <section className="content-page editorial-hub-page">
      <div className="editorial-hub-grid">
        <article className="editorial-hub-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(13,9,8,.90), rgba(13,9,8,.42)), url(${img.supervisorSuite})` }}>
          <span className="feature-story-kicker">Hub · Stories · Clips · Catalog intelligence</span>
          <span className="eyebrow">Editorial Hub</span>
          <h2>Stories, clips, and catalog context for serious sync buyers.</h2>
          <p>Editorial context, short-form sync clips, artist stories, legacy notes, and media conversations designed to help vetted buyers understand the music behind the catalog.</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => setView("stories")}><Article size={18} /> Browse Stories</button>
            <button className="outline-button" onClick={() => setView("media")}><FilmSlate size={18} /> Watch Media Episodes</button>
          </div>
        </article>
        <aside className="hub-pathways">
          {pathways.map(([title, text, target]) => (
            <button key={title} onClick={() => setView(target)}>
              <strong>{title}</strong>
              <span>{text}</span>
            </button>
          ))}
        </aside>
        <div className="hub-card-grid">
          {hubCards.map(([title, duration, text, image, target]) => (
            <button key={title} className="hub-card" onClick={() => target === "legacy" ? setView("legacy") : setView(target)}>
              <span className="hub-card-image" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.05), rgba(0,0,0,.5)), url(${image})` }} />
              <span className="hub-card-body">
                <small>{duration}</small>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="content-archive-note">Short clips are designed for fast discovery and social engagement; longer pieces are reserved for standout artist, catalog, licensing, VIP, and legacy stories.</p>
      </div>
    </section>
  );
}

function StoriesPage({ setView, showToast }) {
  const [selectedStory, setSelectedStory] = useState("The musicians behind unforgettable sounds");
  const stories = [
    ["The musicians behind unforgettable sounds", "2 min feature", "Provenance, collaborators, recording context, and why the work matters to buyers.", img.soulVocal],
    ["How rights-aware discovery protects the creative process", "45 sec", "A concise guide to usage, territory, term, exclusivity, and quote readiness.", img.supervisorSuite],
    ["Gary Burke and the catalog as a living archive", "2 min feature", "A respectful look at the original beatmondo spirit, studio memories, lowercase identity, and musician-led stewardship.", img.musicArchive],
    ["What supervisors save before they request a quote", "30 sec", "Signals from buyer shortlists: emotional fit, edit flexibility, vocal context, and clearance confidence.", img.privateStudio],
  ];
  const active = stories.find(([title]) => title === selectedStory) || stories[0];

  return (
    <section className="content-page stories-page">
      <div className="content-grid">
        <article className="feature-story" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.20), rgba(0,0,0,.72)), url(${active[3]})` }}>
          <span className="feature-story-kicker">{active[1]} · Rights-aware editorial</span>
          <span className="eyebrow">Stories</span>
          <h2>{active[0]}</h2>
          <p>{active[2]}</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => showToast(`Opened "${active[0]}" in the story reader.`)}><Article size={18} /> Open Story</button>
            <button className="outline-button" onClick={() => setView("media")}><FilmSlate size={18} /> Related Media</button>
          </div>
        </article>
        <Panel title="Editorial library" action="Selectable">
          <div className="state-grid">
            {stories.map(([title, category]) => (
              <button key={title} className={`chip-button ${selectedStory === title ? "active" : ""}`} onClick={() => setSelectedStory(title)}>
                {category}: {title}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Reader notes" action="Buyer context">
          <div className="note-list project-notes">
            <article><strong>Why it matters</strong><span>Stories add provenance, usage context, and artist credibility before a buyer starts a license request.</span></article>
            <article><strong>Editorial status</strong><span>Reviewed for rights language, archive sensitivity, and buyer-facing clarity.</span></article>
          </div>
        </Panel>
        <Panel title="Story pathways" action="Discovery">
          <div className="state-grid">
            {["Licensing Education", "Artist Stories", "Behind the Catalog", "Gary Burke Legacy", "Sync Licensing Insights"].map((title) => <button key={title} className="chip-button" onClick={() => showToast(`Story pathway filtered to ${title}.`)}>{title}</button>)}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function MediaEpisodesPage({ setView, showToast }) {
  const [selectedEpisode, setSelectedEpisode] = useState("Artist interviews");
  const episodes = [
    ["Short Sync Clips", "Fast 15-45 second clips for premium discovery, social engagement, and high-intent music moments.", "30 sec", img.mediaDesk],
    ["Artist Stories", "Vocal texture, writing rooms, and the human story behind licensable tracks.", "2 min feature", img.soulVocal],
    ["Studio Sessions", "Recording context, stems, session notes, and the craft behind songs that still feel alive.", "45 sec", img.privateStudio],
    ["Licensing Conversations", "Supervisors, producers, and catalog partners discuss quote context and rights confidence.", "2 min feature", img.supervisorSuite],
    ["Catalog Highlights", "Private selections, VIP picks, and high-value tracks with strong sync potential.", "15 sec", img.scoringStage],
    ["Legacy Clips", "Short archive-led moments honoring Gary Burke and the original beatmondo spirit.", "45 sec", img.musicArchive],
  ];
  const active = episodes.find(([title]) => title === selectedEpisode) || episodes[0];

  return (
    <section className="content-page media-page">
      <div className="content-grid">
        <article className="feature-story" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.70)), url(${active[3]})` }}>
          <span className="feature-story-kicker">Episode · {active[2]} · <span className="brand-name">beatmondo</span> Media</span>
          <span className="eyebrow">Media Episodes</span>
          <h2>{active[0]}</h2>
          <p>{active[1]}</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => showToast(`Playing preview for ${active[0]}.`)}><Play size={18} weight="fill" /> Play Episode</button>
            <button className="outline-button" onClick={() => setView("stories")}><Article size={18} /> Episode Notes</button>
          </div>
        </article>
        <Panel title="Episode library" action="Selectable">
          <div className="state-grid">
            {episodes.map(([title, text, duration]) => (
              <button key={title} className={`chip-button ${selectedEpisode === title ? "active" : ""}`} onClick={() => setSelectedEpisode(title)}>
                {title} · {duration}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Production notes" action="Media kit">
          <div className="mini-thumb-row">
            {episodes.slice(0, 3).map(([title, , , image]) => (
              <span key={title} style={{ backgroundImage: `url(${image})` }}>
                <span className="thumb-caption">{title}</span>
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="For guests and partners" action="Contact">
          <p>Use the contact page for media inquiries, guest suggestions, partnership conversations, and archive contributions.</p>
          <button className="outline-button" onClick={() => setView("contact")}><UsersThree size={18} /> Contact beatmondo</button>
        </Panel>
      </div>
    </section>
  );
}

function ContactPage({ setView }) {
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState("Licensing");
  const topics = [
    { name: "Licensing", route: "Licensing team", next: "Use the licensing form when a track, usage, budget, and timing are already known.", note: "Best for quote questions, usage clarification, and project timing.", action: "Open Licensing / Access" },
    { name: "Buyer Access", route: "Access review", next: "Buyer role, company, and intended use are reviewed before workspace permissions are enabled.", note: "Best for music supervisors, producers, agencies, and brand teams." },
    { name: "VIP Sync Access", route: "VIP concierge", next: "VIP requests are reviewed for buyer fit, project value, and premium access eligibility.", note: "Best for studios, luxury brands, high-value agencies, and strategic sync buyers." },
    { name: "Artist / Contributor", route: "Contributor review", next: "Submissions require metadata, ownership proof, PRO details, and approval before licensing representation.", note: "Artists cannot publish directly into the live catalog." },
    { name: "Rights / Catalog", route: "Rights review", next: "Catalog submissions are reviewed privately for ownership, contracts, registry data, and eligibility.", note: "Rights and catalog materials stay private during review." },
    { name: "Strategic Partner", route: "Partnerships", next: "Partnership notes are routed for catalog value, market fit, and long-term opportunity review.", note: "Best for catalog owners, investors, and global commercial partners." },
    { name: "Media", route: "Editorial team", next: "Media notes, guest ideas, and story opportunities are routed to the editorial workflow.", note: "Best for interviews, episodes, short clips, and catalog stories." },
    { name: "Archive / Legacy", route: "Archive team", next: "Legacy notes are reviewed with sensitivity to Gary Burke history and archive provenance.", note: "Best for memories, materials, credits, and historical context." },
  ];
  const activeTopic = topics.find((item) => item.name === topic) || topics[0];
  const featureRoutes = topics.filter((item) => ["VIP Sync Access", "Rights / Catalog", "Strategic Partner", "Archive / Legacy"].includes(item.name));

  if (sent) {
    return (
      <section className="confirmation">
        <CheckCircle size={52} weight="fill" />
        <h2>Message received.</h2>
        <p>The beatmondo team will route your {topic.toLowerCase()} note to the right person and follow up with next steps.</p>
        <div className="status-strip"><span>Received</span><span>Team review</span><span>Follow-up</span></div>
        <div className="button-row"><button className="gold-button" onClick={() => setSent(false)}>Send another message</button><button className="outline-button" onClick={() => setView("licensing")}>Request Access</button></div>
      </section>
    );
  }

  return (
    <section className="form-page wide-page contact-page">
      <div className="contact-header">
        <div className="form-intro">
          <span className="eyebrow">Contact <span className="brand-name">beatmondo</span></span>
          <h2>The right conversation, routed clearly.</h2>
          <p>Reach the team for licensing questions, buyer access, VIP review, artist or contributor interest, strategic partnerships, media conversations, and Gary Burke legacy/archive notes.</p>
        </div>
        <aside className="contact-routing-summary">
          <span className="eyebrow">Routing summary</span>
          <h3>{activeTopic.route}</h3>
          <p>{activeTopic.next}</p>
          <div className="workflow-steps">
            {["Received", "Routed to team", "Private review", "Follow-up"].map((step, index) => <span key={step}><em>{index + 1}</em>{step}</span>)}
          </div>
        </aside>
      </div>
      <div className="contact-topic-grid">
        {topics.map((item) => (
          <button type="button" key={item.name} className={topic === item.name ? "active" : ""} onClick={() => setTopic(item.name)}>
            <strong>{item.name}</strong>
            <span>{item.route}</span>
          </button>
        ))}
      </div>
      <div className="contact-workspace">
        <form className="inquiry-form access-form contact-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
          <p className="vip-form-note">{activeTopic.note}</p>
          <label>Name<input required placeholder="Jane Mitchell" /></label>
          <label>Email<input required placeholder="name@company.com" /></label>
          <label>Company<input placeholder="Company, studio, or organization" /></label>
          <label>Topic<input value={topic} readOnly /></label>
          <label className="full-field">Message<textarea required placeholder="Tell us what you need, what you are working on, and any timing or rights context." /></label>
          <div className="button-row">
            <button className="gold-button form-submit" type="submit"><UsersThree size={18} /> Send Message</button>
            <button className="outline-button" type="button" onClick={() => setView("licensing")}><ShieldCheck size={18} /> Open Licensing / Access</button>
          </div>
        </form>
        <aside className="contact-private-note">
          <LockKey size={28} />
          <strong>Private routing</strong>
          <p>Rights, catalog, contributor, VIP, and archive notes are reviewed privately before any representation, publication, or licensing discussion.</p>
          <span>Response path depends on topic, verification needs, and project urgency.</span>
        </aside>
      </div>
      <div className="contact-route-cards">
        {featureRoutes.map((item) => (
          <button key={item.name} onClick={() => setTopic(item.name)}>
            <strong>{item.name}</strong>
            <span>{item.note}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function InvestorOverview({ setView }) {
  const sections = [
    ["The Opportunity", "The global sync licensing market exceeds $1.5B annually and continues to grow with streaming, branded content, and premium media production. Most music licensing remains fragmented, manual, and disconnected from rights data. There is a clear opportunity for a technology-enabled platform that combines curated discovery, structured licensing, protected delivery, and catalog intelligence."],
    ["The Problem", "Music supervisors and professional buyers navigate disconnected tools, unclear rights, slow quote processes, and inconsistent access to masters and stems. Artists and rights holders lack visibility into demand and licensing activity. Valuable catalogs are underserved by generic stock libraries and open marketplaces."],
    ["The Solution", "beatmondo is a premium, curated, gated music discovery and sync licensing ecosystem. It connects exceptional catalogs with professional creative buyers while protecting rights, masters, metadata, and long-term catalog value. The platform combines curated discovery, structured licensing workflows, rights-aware metadata, protected master delivery, and catalog intelligence."],
    ["How It Works", "Selected artists and catalogs are reviewed and accepted into the platform. Buyers discover music through curated browsing, editorial content, and professional search tools. Licensing requests follow structured workflows with usage parameters, territory, term, rights review, and secure delivery. Three buyer tiers — Discovery Access, Professional Buyer, and VIP Sync Access — provide appropriate levels of access and service."],
    ["Revenue Model", "Revenue is generated through multiple pathways: approved sync licensing fees, premium buyer access, exclusive licensing arrangements, strategic catalog partnerships, and premium services including curated recommendations, priority review, and custom commercial pathways."],
    ["Product Ecosystem", "The platform serves professional buyers (music supervisors, studios, agencies, brands), artists and rights holders (selected catalogs, controlled participation), and platform operations (rights management, catalog intelligence, delivery infrastructure). Editorial content, stories, and media episodes support discovery and buyer engagement."],
    ["Competitive Advantage", "beatmondo is curated rather than open, professional rather than mass-market, rights-aware rather than discovery-only, and intelligence-driven rather than simple hosting. Protected master delivery, controlled artist participation, and catalog value signals create defensible differentiation from generic stock libraries and open marketplaces."],
    ["Scalability", "The platform architecture supports growth across catalog size, buyer volume, geographic markets, and licensing complexity. Catalog intelligence data becomes more valuable with scale. Rights management infrastructure creates operational moats. Premium buyer relationships and VIP access create recurring engagement."],
    ["Current Prototype Status", "This prototype demonstrates the full product concept including curated discovery, track detail with rights data, multi-step licensing workflows, buyer and admin dashboards, secure delivery representation, catalog intelligence, editorial content, and three buyer access tiers. All data is demonstration data. Authentication, payment, and file delivery are simulated."],
    ["Future Development", "Next phases include production backend development, real authentication and payment processing, encrypted file delivery infrastructure, expanded catalog onboarding, rights management automation, buyer CRM, analytics pipeline, and mobile-optimized experiences."],
  ];
  return (
    <section className="investor-page">
      <div className="investor-hero">
        <span className="eyebrow">Investor overview</span>
        <h2>beatmondo — Premium Sync Licensing Ecosystem</h2>
        <p>A curated, gated music discovery and sync licensing platform connecting exceptional catalogs with professional creative buyers while protecting rights, masters, metadata, and long-term catalog value.</p>
        <div className="button-row">
          <button className="gold-button" onClick={() => setView("home")}><House size={18} /> View Product</button>
          <button className="outline-button" onClick={() => setView("catalog")}><MagnifyingGlass size={18} /> Explore Music</button>
          <button className="outline-button" onClick={() => setView("admin")}><GearSix size={18} /> View Dashboard</button>
        </div>
      </div>
      <div className="investor-sections">
        {sections.map(([title, text], index) => (
          <article key={title} className="investor-section">
            <span className="investor-section-number">0{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="investor-disclaimer">
        <p>This document represents the current prototype concept. No financial projections, valuation estimates, or investment commitments are included. All platform data is demonstration data. beatmondo is a working brand name.</p>
      </div>
    </section>
  );
}

function ArtistDashboardPage({ showToast, setView }) {
  const capabilities = [
    [Eye, "View Profile", "Review your public artist profile as buyers see it."],
    [MusicNote, "View Catalog", "See all submitted and published tracks with metadata status."],
    [CloudArrowUp, "Track Submissions", "View submission status, review notes, and approval progress."],
    [Heart, "Licensing Interest", "See anonymized saves, preview activity, and buyer interest signals."],
    [FileAudio, "Request History", "View past licensing requests involving your tracks."],
    [ShieldCheck, "Rights Status", "Review rights verification, ownership records, and documentation status."],
  ];
  const changeRequests = [
    [GearSix, "Request Metadata Changes", "Submit corrections to titles, credits, instrumentation, or contributor details."],
    [FilmSlate, "Request Media Changes", "Submit updated images, editorial text, or promotional materials."],
    [Archive, "Request Track Removal", "Initiate a removal request with rights review and contractual confirmation."],
    [UsersThree, "Submit Inquiry", "Contact the beatmondo team for catalog, rights, or partnership questions."],
  ];
  const restrictions = [
    "Artists cannot publish directly into the live catalog",
    "Artists cannot directly edit rights or ownership data",
    "Artists cannot set or change pricing or licensing terms",
    "Artists cannot edit live metadata without review",
    "Artists cannot approve or reject license requests",
  ];
  return (
    <section className="artist-dashboard-page">
      <div className="page-intro">
        <span className="eyebrow">Artist workspace</span>
        <h2>Controlled artist participation</h2>
        <p>Artists and contributors can view their profile, catalog, and licensing activity. All changes are submitted for review — direct publishing, rights editing, and pricing changes are not available.</p>
      </div>
      <div className="artist-dash-grid">
        <Panel title="Your capabilities" action="View only">
          <div className="capability-grid">
            {capabilities.map(([Icon, title, text]) => (
              <article key={title} className="capability-card">
                <Icon size={22} weight="duotone" />
                <strong>{title}</strong>
                <span>{text}</span>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Change requests" action="Submit for review">
          <div className="capability-grid change-request-grid">
            {changeRequests.map(([Icon, title, text]) => (
              <button key={title} className="capability-card" onClick={() => showToast(`${title} form opened.`)}>
                <Icon size={22} weight="duotone" />
                <strong>{title}</strong>
                <span>{text}</span>
              </button>
            ))}
          </div>
          <button className="gold-button" style={{ marginTop: 16 }} onClick={() => showToast("Change request form opened.")}><CloudArrowUp size={18} /> Submit Change Request</button>
        </Panel>
        <Panel title="Restrictions" action="Platform policy">
          <ul className="restriction-list">
            {restrictions.map((item) => <li key={item}><LockKey size={15} /> {item}</li>)}
          </ul>
        </Panel>
        <Panel title="Artist profile preview" action="Public view">
          <div className="artist-preview-mini">
            <div className="portrait small" style={{ backgroundImage: `url(${artists[0].image})` }} />
            <div>
              <strong>{artists[0].name}</strong>
              <span>{artists[0].credit}</span>
              <span>{artists[0].tracks} tracks in catalog</span>
            </div>
            <button className="outline-button" onClick={() => setView("artist")}>View public profile</button>
          </div>
        </Panel>
      </div>
    </section>
  );
}


function DesignSystem() {
  const palette = ["#18130f", "#2a231b", "#f4efe6", "#cdbfaa", "#a6342a", "#5f7167"];
  return (
    <section className="system-page">
      <div className="system-brand"><img src={logo} alt="beatmondo logo usage" /><p>Use lowercase beatmondo, Gary Burke red as a strategic brand accent, muted brass as secondary emphasis, and a darker gated/private sync licensing visual system.</p></div>
      <div className="swatches">{palette.map((color) => <span key={color} style={{ "--swatch": color }}>{color}</span>)}</div>
      <div className="section-grid">
        <Panel title="Buttons & forms" action="Controls"><div className="button-row"><button className="gold-button">Primary</button><button className="outline-button">Secondary</button><button className="plain-button">Text action</button></div><input placeholder="Form input" /></Panel>
        <Panel title="Audio player" action="Components"><div className="large-player small-player"><div className="waveform big" /><span>Preview-only playback state</span></div></Panel>
        <Panel title="Access badges" action="Gated"><div className="tag-row"><span>Discovery Access</span><span>Professional Buyer</span><span>VIP Sync Access</span><span>VIP Only</span></div></Panel>
        <Panel title="Rights and delivery badges" action="Licensing"><div className="tag-row"><span>Rights Verified</span><span>Preston Approved</span><span>WAV master</span><span>Stems</span><span>Fast-Track Delivery</span></div></Panel>
        <Panel title="Locked components" action="Private"><p>Locked/VIP-only states, missing rights notes, expired secure links, protected masters, and quote states are represented with restrained, legally serious product language.</p></Panel>
      </div>
    </section>
  );
}

function MiniPlayer({ track, playingId, onTogglePlay, onOpen }) {
  const isPlaying = playingId === track.id;
  return (
    <aside className="mini-player">
      <button onClick={onTogglePlay} aria-label={isPlaying ? "Pause preview" : "Resume preview"}>{isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}</button>
      <div className="cover-art small" style={{ backgroundImage: `url(${track.image})` }} />
      <div><strong>{track.title}</strong><span>{track.artist} · Preview Only</span></div>
      <div className="cut-track-strip" aria-label="Selected track cut from 0:18 to 1:42">
        <div className="cut-track-meta">
          <span>0:18</span>
          <strong>Cut Track</strong>
          <span>1:42</span>
        </div>
        <div className="cut-waveform" aria-hidden="true">
          <span className="cut-selection" />
          <span className="cut-handle start" />
          <span className="cut-handle end" />
        </div>
      </div>
      <button className="outline-button" onClick={onOpen}>Details</button>
    </aside>
  );
}

function ImageCard({ title, text, image, action }) {
  return <article className="image-card" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.64)), url(${image})` }}><div><h3>{title}</h3><p>{text}</p><button onClick={action}>Explore Music</button></div></article>;
}

function CollectionCard({ title, text, count, tags, image, onView }) {
  return <article className="collection-card"><div style={{ backgroundImage: `url(${image})` }} /><h3>{title}</h3><p>{text}</p><span>{count} tracks</span><div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button onClick={onView}>View collection</button></article>;
}

function AccessTierCard({ tier, onSelect }) {
  return (
    <article className={`tier-card ${tier.id === "vip" ? "vip-tier" : ""}`}>
      <span className="tier-badge">{tier.name}</span>
      <h3>{tier.name}</h3>
      <p>{tier.description}</p>
      <strong>{tier.priceLabel}</strong>
      <ul>{tier.features.map((feature) => <li key={feature}><CheckCircle size={15} weight="fill" /> {feature}</li>)}</ul>
      <button className={tier.id === "vip" ? "gold-button vip-access-button" : "outline-button"} onClick={onSelect}>Request Access</button>
    </article>
  );
}

function AssetBadges({ track, compact = false }) {
  const assets = [
    ["Preview", track.assets.preview, "Public-limited"],
    ["WAV Master", track.assets.wavMaster, "After approval"],
    ["Stems", track.assets.stems, "After approval"],
    ["Instrumental", track.assets.instrumental, "Available"],
    ["Vocal", track.assets.vocal, "Available"],
    ["30-sec edit", track.assets.thirtySecondEdit, "VIP"],
    ["Loopable", track.assets.loopEdit, "Edit-ready"],
    ["Alt mix", track.assets.alternateMixes, "On request"],
  ];
  return (
    <div className={`asset-badges ${compact ? "compact-assets" : ""}`}>
      {assets.map(([label, ready, note]) => (
        <span key={label} className={ready ? "ready" : "locked"}><LockKey size={compact ? 12 : 14} /> {label}{!compact && <small>{ready ? note : "Rights check"}</small>}</span>
      ))}
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return <label className="select-label"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><CaretDown size={14} /></label>;
}

function Panel({ title, action, children, className = "" }) {
  return <section className={`panel ${className}`.trim()}><div className="panel-head"><h3>{title}</h3><span>{action}</span></div>{children}</section>;
}

function Metric({ icon: Icon, label, value, note }) {
  return <article className="metric"><Icon size={24} weight="duotone" /><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function TrustItem({ icon: Icon, title, text }) {
  return <div className="trust-item"><Icon size={30} /><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function MiniStory({ title, text, image, actionLabel = "Open", action }) {
  return <article className="mini-story"><div style={{ backgroundImage: `url(${image})` }} /><h3>{title}</h3><p>{text}</p><button onClick={action}>{actionLabel}</button></article>;
}

function RequestRow({ item, detailed }) {
  return <article className="request-row"><div><strong>{item.company}</strong><span>{item.track} · {item.type}</span>{detailed && <small>{item.id} · {item.budget} · Deadline {item.deadline} · {item.buyerTier} · {item.priority} · {item.rightsCheck}</small>}</div><span className="badge">{item.status}</span></article>;
}

function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <BookmarkSimple size={28} />
      <strong>{title}</strong>
      <p>{text}</p>
      {actionLabel && onAction && <button className="outline-button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function Footer({ setView }) {
  const linkGroups = [
    ["Explore", ["Explore Music", "Licensing", "Artists", "Gary Burke Legacy"]],
    ["Media", ["Editorial Hub", "Stories", "Media Episodes", "Contact"]],
    ["Access", ["Request Access", "Licensing Access", "Partner Inquiry"]],
  ];
  const navigate = (item) => {
    if (item === "Explore Music") setView("catalog");
    else if (item === "Gary Burke Legacy") setView("legacy");
    else if (item === "Request Access" || item === "Licensing" || item === "Licensing Access" || item === "Partner Inquiry") setView("licensing");
    else if (item === "Artists") setView("artist");
    else if (item === "Editorial Hub") setView("content");
    else if (item === "Stories") setView("stories");
    else if (item === "Media Episodes") setView("media");
    else if (item === "Contact") setView("contact");
    else setView("content");
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src={logo} alt="beatmondo" />
          <p>Authentic tracks from real musicians. Built for licensing conversations.</p>
          <span>Preview publicly. Deliver securely.</span>
        </div>
        <nav>
          {linkGroups.map(([group, links]) => (
            <div key={group}>
              <strong>{group}</strong>
              {links.map((item) => <button key={item} onClick={() => navigate(item)}>{item}</button>)}
            </div>
          ))}
        </nav>
        <small>Master files are protected and delivered only through approved licensing workflows. Copyright and rights notices apply to all represented materials.</small>
      </div>
    </footer>
  );
}

export { App };
