import { useEffect, useMemo, useRef, useState } from "react";
import { getRouteDecision, useAuth } from "./auth/AuthContext.jsx";
import { AUTH_VIEWS, UserMenu, renderAuthView } from "./auth/AuthModule.jsx";
import {
  VERIFICATION_VIEWS,
  renderVerificationView,
} from "./verification/BuyerVerificationModule.jsx";
import { buyerVerificationService } from "./verification/buyerVerificationService.js";
import {
  MEMBERSHIP_RETURN_KEY,
  MEMBERSHIP_VIEWS,
  renderMembershipView,
} from "./membership/MembershipBillingModule.jsx";
import {
  calculateEffectiveAccess,
  formatMoney,
  membershipService,
} from "./membership/membershipService.js";
import {
  BuyerRightsSummary,
  RIGHTS_VIEWS,
  renderRightsView,
} from "./rights/RightsDatabaseModule.jsx";
import { rightsService } from "./rights/rightsService.js";
import {
  SEARCH_VIEWS,
  renderSearchView,
} from "./search/SearchInfrastructureModule.jsx";
import { searchService } from "./search/searchService.js";
import {
  INGESTION_VIEWS,
  renderIngestionView,
} from "./ingestion/TrackIngestionModule.jsx";
import {
  STORAGE_VIEWS,
  renderStorageView,
} from "./storage/FileStorageStreamingModule.jsx";
import { storageService } from "./storage/storageService.js";
import {
  WATERMARK_PREVIEW_VIEWS,
  WatermarkNotice,
  renderWatermarkedPreviewView,
} from "./previews/WatermarkedPreviewsModule.jsx";
import { watermarkedPreviewService } from "./previews/watermarkedPreviewService.js";
import {
  QUOTE_VIEWS,
  renderQuoteView,
} from "./quotes/QuoteCalculationModule.jsx";
import {
  CONTRACT_VIEWS,
  renderContractsView,
} from "./contracts/ContractsESignatureModule.jsx";
import {
  PAYMENT_VIEWS,
  renderPaymentView,
} from "./payments/PaymentsModule.jsx";
import {
  LICENCE_VIEWS,
  renderLicenceView,
} from "./licences/LicenceGenerationModule.jsx";
import {
  SECURE_DELIVERY_VIEWS,
  renderSecureDeliveryView,
} from "./delivery/SecureDeliveryModule.jsx";
import {
  EXPIRING_ACCESS_VIEWS,
  renderExpiringAccessView,
} from "./expiring-access/ExpiringAccessModule.jsx";
import { AUDIT_VIEWS, renderAuditView } from "./audit/AuditLoggingModule.jsx";
import {
  EMAIL_VIEWS,
  renderEmailView,
} from "./email/EmailNotificationsModule.jsx";
import {
  ImpersonationBanner,
  PERMISSIONS_VIEWS,
  renderPermissionsView,
} from "./permissions/AdminPermissionsModule.jsx";
import {
  ANALYTICS_VIEWS,
  renderAnalyticsView,
} from "./analytics/AnalyticsReportingModule.jsx";
import {
  PRIVACY_VIEWS,
  renderPrivacyView,
} from "./privacy/CompliancePrivacyModule.jsx";
import { quoteService } from "./quotes/quoteService.js";
import { contractService } from "./contracts/contractService.js";
import { paymentService } from "./payments/paymentService.js";
import { licenceService } from "./licences/licenceService.js";
import { secureDeliveryService } from "./delivery/secureDeliveryService.js";
import { expiringAccessService } from "./expiring-access/expiringAccessService.js";
import { auditService } from "./audit/auditService.js";
import { emailService } from "./email/emailService.js";
import { resetAdminPermissionsDemoData } from "./permissions/authorizationService.js";
import { resetCompliancePrivacyDemoData } from "./privacy/privacyService.js";
import { ingestionService } from "./ingestion/ingestionService.js";
import { analyticsService } from "./analytics/analyticsService.js";
import {
  Archive,
  ArrowRight,
  Article,
  Bell,
  BookmarkSimple,
  CalendarBlank,
  Certificate,
  CaretDown,
  CheckCircle,
  Calculator,
  Clock,
  CloudArrowUp,
  DownloadSimple,
  CurrencyDollar,
  Eye,
  FadersHorizontal,
  FileAudio,
  FileText,
  FilmSlate,
  Fingerprint,
  GearSix,
  Heart,
  HardDrives,
  House,
  Key,
  LinkSimple,
  LockKey,
  MagnifyingGlass,
  MicrophoneStage,
  MusicNote,
  Pause,
  PenNib,
  Play,
  Printer,
  ShieldCheck,
  ShoppingBag,
  SignIn,
  Sliders,
  Sparkle,
  TrendUp,
  SquaresFour,
  UserCircle,
  UsersThree,
  WarningCircle,
  Waveform,
  X,
  Repeat,
} from "@phosphor-icons/react";

const logo = "/assets/beatmondo-logo.png";
const FEATURED_TRACK_ID = 15;
const SLAMBOVIAN_AUDIO_TRACK_ID = 21;
const PINNED_GENERAL_TRACK_IDS = [
  FEATURED_TRACK_ID,
  SLAMBOVIAN_AUDIO_TRACK_ID,
];
const heroVideo = "/assets/hero/smyrk-live-to-record.mp4";
const heroPoster = "/assets/hero/smyrk-live-to-record-poster.png";
const footerLogoAnimation = "/assets/footer/beatmondo-logo-animation.mp4";

const img = {
  studio:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  vinyl:
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  tape: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1200&q=80",
  film: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
  edit: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
  concert:
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  portrait:
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
  agency:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  car: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  city: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  campaign:
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  broadcast:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  documentary:
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
  luxury:
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
  trailer:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  streaming:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  privateStudio: "/assets/editorial/private-studio-console.webp",
  musicArchive: "/assets/editorial/music-archive-room.webp",
  scoringStage: "/assets/editorial/scoring-stage.webp",
  soulVocal: "/assets/editorial/soul-vocal-session.webp",
  supervisorSuite: "/assets/editorial/supervisor-review-suite.webp",
  mediaDesk: "/assets/editorial/media-production-desk.webp",
  legacyDetail: "/assets/editorial/gary-burke-legacy-detail.webp",
  shortSyncEdit: "/assets/editorial/short-sync-edit-suite.webp",
  mediaInterview: "/assets/editorial/media-episodes-interview.webp",
  smyrkHero: "/assets/artists/the-smyrk/d-hoppin-hero.webp",
  smyrkCard: "/assets/artists/the-smyrk/d-hoppin-card.webp",
  smyrkPortrait: "/assets/artists/the-smyrk/ari-d-red-hood.webp",
  smyrkLive: "/assets/artists/the-smyrk/the-smyrk-live.webp",
  slambovianHero:
    "/assets/artists/the-slambovian-circus-of-dreams/live-hero.webp",
  slambovianCard:
    "/assets/artists/the-slambovian-circus-of-dreams/live-stage-card.webp",
  slambovianArchive:
    "/assets/artists/the-slambovian-circus-of-dreams/psychedelic-archive.webp",
};

const slambovianMedia = {
  teaser:
    "/assets/artists/the-slambovian-circus-of-dreams/2022-teaser-web.mp4",
  teaserCaptions:
    "/assets/artists/the-slambovian-circus-of-dreams/2022-teaser-captions.vtt",
  shortClip:
    "/assets/artists/the-slambovian-circus-of-dreams/slambovian-short-sync-clip.mp4",
  shortClipCaptions:
    "/assets/artists/the-slambovian-circus-of-dreams/short-sync-clip-captions.vtt",
};

const buyerTiers = [
  {
    id: "discovery",
    name: "Discovery Access",
    description:
      "Curated browsing and protected previews for approved early-stage buyers.",
    priceLabel: "Entry access required",
    features: [
      "Curated browsing",
      "Protected previews",
      "Selected metadata",
      "Saved tracks",
      "Editorial discovery",
      "Professional-access application",
    ],
  },
  {
    id: "professional",
    name: "Professional Buyer",
    description:
      "Full licensing workspace for agencies, studios, producers, and professional music buyers.",
    priceLabel: "Quote-based licensing",
    features: [
      "Project workspaces",
      "Advanced discovery",
      "Licensing requests",
      "Quotes",
      "Rights review",
      "Secure approved delivery",
    ],
  },
  {
    id: "vip",
    name: "VIP Sync Access",
    description:
      "Private curated collections, priority licensing, and premium support for top-tier buyers.",
    priceLabel: "Premium access",
    features: [
      "Private curated collections",
      "Priority licensing",
      "Premium buyer support",
      "Accelerated review",
      "Pre-approved commercial pathways",
      "Exclusive opportunities",
    ],
  },
];

/* Fallback when logged out — keep in sync with DEFAULT_USERS vip buyer (Olivia Bennett). */
const currentBuyer = {
  name: "Olivia Bennett",
  company: "Northstar Pictures",
  role: "Senior Music Supervisor",
  accessTier: "VIP Sync Access",
  email: "olivia@northstarpictures.com",
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
    rights:
      "One-stop clearance available for select usages. Master controlled by a beatmondo partner rightsholder.",
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
    rights:
      "Standard brand campaign license available. Custom edit approval required for lyric changes.",
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
    rights:
      "Worldwide documentary usage supported. Stems available after approval.",
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
    rights:
      "Non-exclusive digital campaigns can be reviewed within two business days.",
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
    instrumentation:
      "Modular synths, processed drums, sub-bass, glitch textures",
    tags: ["Dark", "Cinematic", "Pulsing"],
    status: "Ready to License",
    image: img.city,
    rights:
      "Worldwide trailer and promo usage available. Custom edits on request.",
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
    rights:
      "Global brand campaign usage supported. Multi-territory clearance available.",
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
    rights:
      "Exclusive cinematic placement available for premium feature film usage.",
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
    instrumentation:
      "Distorted guitars, driving drums, emotional vocal, feedback",
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
    rights:
      "Estate-controlled archive track. Premium hospitality and luxury placements preferred.",
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
    rights:
      "Social and digital campaign usage pre-approved for standard terms.",
  },
  {
    id: 15,
    title: "The End of Jason Todd",
    artist: "The SMYRK",
    composer: "Composition credits pending verification",
    genre: "Alternative",
    mood: "Intense",
    tempo: "Upbeat",
    bpm: "132 BPM",
    era: "2000s",
    vocal: "Vocal",
    usage: "Film / TV",
    availability: "Quote Required",
    duration: "2:49",
    key: "A Minor / C Major",
    instrumentation:
      "Full-band rock arrangement; exact session credits pending verification",
    tags: ["Dark", "Raw", "Climactic"],
    status: "Rights Review",
    image: img.smyrkCard,
    heroImage: img.smyrkHero,
    rights:
      "Original 2009 stereo master located. Publishing, ownership splits, personnel, and commercial clearance remain under documentation review.",
    previewSrc: "/assets/audio/previews/the-end-of-jason-todd-preview-pcm.wav",
    previewFallbackSrc: "/assets/audio/previews/the-end-of-jason-todd.m4a",
    previewSourceStart: 78,
    previewDuration: 84,
    assetOverrides: {
      wavMaster: true,
      stems: false,
      instrumental: false,
      vocal: false,
      alternateMixes: false,
      loopEdit: false,
      thirtySecondEdit: false,
      drumStem: false,
      bassStem: false,
      guitarStem: false,
      keysStem: false,
      percStem: false,
    },
    rightsOverrides: {
      proAffiliation: "Pending verification",
      registrationId: "Registration pending",
      publisher: "Publishing control under review",
      masterOwner: "Master documentation under review",
      publishingOwner: "Publishing documentation under review",
      ownershipPercentage: "Pending verification",
    },
  },
  {
    id: 21,
    title: "2022 Teaser Video (Audio Extract)",
    artist: "The Slambovian Circus of Dreams",
    composer: "Composition and recording credits pending verification",
    genre: "Alternative / Americana",
    mood: "Theatrical",
    tempo: "Mixed",
    bpm: "BPM pending",
    era: "2020s",
    vocal: "Mixed",
    usage: "Editorial Discovery",
    availability: "Quote Required",
    duration: "1:59",
    key: "Pending analysis",
    instrumentation:
      "Mixed promotional-montage audio; individual recordings, performers, and session credits pending verification",
    tags: ["Theatrical", "Psychedelic", "Live Energy"],
    status: "Rights Review",
    image: img.slambovianCard,
    heroImage: img.slambovianHero,
    rights:
      "Audio extracted from the supplied 2022 promotional teaser. It is available for protected editorial listening only; individual song titles, master ownership, publishing, samples, performers, and licensing authority remain unverified.",
    previewSrc:
      "/assets/artists/the-slambovian-circus-of-dreams/2022-teaser-audio-extract.wav",
    previewFallbackSrc:
      "/assets/artists/the-slambovian-circus-of-dreams/2022-teaser-audio-extract.m4a",
    previewSourceStart: 0,
    previewDuration: 119.637,
    editorialAudioExtract: true,
    assetOverrides: {
      wavMaster: false,
      stems: false,
      instrumental: false,
      vocal: false,
      alternateMixes: false,
      loopEdit: false,
      thirtySecondEdit: false,
      drumStem: false,
      bassStem: false,
      guitarStem: false,
      keysStem: false,
      percStem: false,
    },
    rightsOverrides: {
      proAffiliation: "Pending verification",
      registrationId: "No track registration represented",
      publisher: "Publishing control under review",
      masterOwner: "Promotional-video audio authority under review",
      publishingOwner: "Publishing documentation under review",
      ownershipPercentage: "Pending verification",
    },
  },
  {
    id: 16,
    title: "Northern Lines",
    artist: "Arco North",
    composer: "Jon Arco",
    genre: "Indie Rock",
    mood: "Uplifting",
    tempo: "Upbeat",
    bpm: "122 BPM",
    era: "Modern",
    vocal: "Instrumental",
    usage: "Advertising",
    availability: "Available Now",
    duration: "2:42",
    key: "D Major",
    instrumentation: "Bright guitars, live drums, pulsing bass, handclaps",
    tags: ["Driving", "Hopeful", "Automotive"],
    status: "Ready to License",
    image: img.car,
    rights: "Standard multi-territory commercial review is available.",
  },
  {
    id: 17,
    title: "Heavy Weather",
    artist: "Hollow Skies",
    composer: "Nate Calder / Elise Thorpe",
    genre: "Alternative",
    mood: "Triumphant",
    tempo: "Upbeat",
    bpm: "138 BPM",
    era: "Modern",
    vocal: "Vocal",
    usage: "Trailer",
    availability: "Available Now",
    duration: "2:26",
    key: "E Minor",
    instrumentation: "Overdriven guitars, tom ensemble, synth bass, lead vocal",
    tags: ["Epic", "Energetic", "Sports"],
    status: "Protected Delivery",
    image: img.trailer,
    rights:
      "Trailer and sports placements are available after final usage review.",
  },
  {
    id: 18,
    title: "Quiet Machines",
    artist: "Soren",
    composer: "Soren Ivers",
    genre: "Electronic",
    mood: "Mysterious",
    tempo: "Midtempo",
    bpm: "98 BPM",
    era: "Modern",
    vocal: "Instrumental",
    usage: "Technology",
    availability: "Available Now",
    duration: "2:18",
    key: "F# Minor",
    instrumentation: "Soft modular pulses, prepared piano, brushed electronics",
    tags: ["Technology", "Minimal", "Clean"],
    status: "Ready to License",
    image: img.edit,
    rights:
      "Technology, corporate, and podcast review paths are available worldwide.",
  },
  {
    id: 19,
    title: "Velvet Warning",
    artist: "Jade Montague",
    composer: "Jade Montague / C. Rivera",
    genre: "R&B",
    mood: "Dark",
    tempo: "Midtempo",
    bpm: "88 BPM",
    era: "Modern",
    vocal: "Vocal",
    usage: "Advertising",
    availability: "Exclusive Option",
    duration: "2:55",
    key: "C Minor",
    instrumentation: "Muted keys, live bass, sparse drums, intimate lead vocal",
    tags: ["Luxury", "Brooding", "Female Vocal"],
    status: "Protected Delivery",
    image: img.soulVocal,
    rights:
      "Luxury and fashion campaign pathways are available on premium terms.",
  },
  {
    id: 20,
    title: "The Long Arrival",
    artist: "Vespera",
    composer: "Ela Vesper",
    genre: "Orchestral",
    mood: "Emotional",
    tempo: "Slow",
    bpm: "66 BPM",
    era: "1970s",
    vocal: "Instrumental",
    usage: "Feature Film",
    availability: "Quote Required",
    duration: "4:36",
    key: "G Minor",
    instrumentation: "Chamber strings, upright piano, tape ambience, low brass",
    tags: ["Archive", "Cinematic", "Melancholic"],
    status: "Rights Review",
    image: img.scoringStage,
    rights:
      "Archive documentation and territory review are required before quoting.",
  },
];

const energyMap = [
  "Low",
  "High",
  "Low",
  "Medium",
  "Medium",
  "High",
  "Medium",
  "Low",
  "High",
  "Low",
  "Medium",
  "High",
  "Low",
  "High",
  "High",
];
const sceneFitMap = [
  "Opening titles",
  "Launch film",
  "Night drive",
  "Trailer turn",
  "Human story",
  "Social campaign",
  "Chase sequence",
  "Memory montage",
  "Global anthem",
  "Final scene",
  "Brand reveal",
  "Climax moment",
  "Dinner scene",
  "New chapter",
  "Antihero turn / confrontation",
];
const subgenreMap = [
  "Neo-classical",
  "Indie anthem",
  "Textural ambient",
  "Vintage soul",
  "Americana",
  "Bright pop",
  "Dark electronic",
  "Archive folk",
  "World fusion",
  "Modern classical",
  "Neo-soul",
  "Post-rock",
  "Cool jazz",
  "Uplift pop",
  "Post-hardcore / alternative rock",
];
const valueSignalMap = [
  "High Demand",
  "Growing Interest",
  "Growing Interest",
  "Premium Demand",
  "Emerging",
  "Growing Interest",
  "Emerging",
  "Premium Demand",
  "Growing Interest",
  "Premium Demand",
  "Emerging",
  "Growing Interest",
  "Premium Demand",
  "Emerging",
  "Archive Discovery",
];

const tracks = rawTracks
  .map((track, index) => ({
    ...track,
    vipOnly: [1, 4, 10, 13].includes(track.id),
    energy: energyMap[index] || "Medium",
    sceneFit: sceneFitMap[index] || "General placement",
    subgenre: subgenreMap[index] || "Mixed",
    valueSignal: valueSignalMap[index] || "Emerging",
    assets: {
      preview: true,
      wavMaster: track.assetOverrides?.wavMaster ?? ![4, 8].includes(track.id),
      stems:
        track.assetOverrides?.stems ??
        [1, 3, 5, 6, 7, 9, 10, 12].includes(track.id),
      instrumental:
        track.assetOverrides?.instrumental ??
        (track.vocal === "Instrumental" ||
          [2, 4, 6, 11, 14].includes(track.id)),
      vocal: track.assetOverrides?.vocal ?? track.vocal === "Vocal",
      alternateMixes:
        track.assetOverrides?.alternateMixes ??
        [1, 2, 5, 9, 11, 14].includes(track.id),
      loopEdit:
        track.assetOverrides?.loopEdit ?? [3, 5, 6, 7, 12].includes(track.id),
      thirtySecondEdit:
        track.assetOverrides?.thirtySecondEdit ??
        [1, 2, 6, 9, 11, 14].includes(track.id),
      drumStem:
        track.assetOverrides?.drumStem ??
        [1, 3, 5, 7, 9, 12].includes(track.id),
      bassStem:
        track.assetOverrides?.bassStem ??
        [1, 3, 5, 7, 9, 11].includes(track.id),
      guitarStem:
        track.assetOverrides?.guitarStem ?? [2, 5, 8, 12].includes(track.id),
      keysStem:
        track.assetOverrides?.keysStem ??
        [1, 3, 6, 10, 11, 13].includes(track.id),
      percStem: track.assetOverrides?.percStem ?? [7, 9].includes(track.id),
    },
    commercial: {
      pricingType: [4, 8, 13, 15, 21].includes(track.id)
        ? "Quote Required"
        : [10].includes(track.id)
          ? "Private Pricing"
          : [1].includes(track.id)
            ? "VIP Pricing"
            : "Fixed Price",
      priceRange: [4, 8, 13, 15, 21].includes(track.id)
        ? "Request quote"
        : [10].includes(track.id)
          ? "Contact for terms"
          : [1].includes(track.id)
            ? "VIP terms apply"
            : "$5,000 – $25,000",
      rightsReviewRequired: [4, 8, 13, 15, 21].includes(track.id),
      exclusivityAvailable: [1, 4, 10].includes(track.id),
    },
    rightsData: {
      proAffiliation:
        track.rightsOverrides?.proAffiliation ??
        (index % 2 === 0 ? "ASCAP" : "BMI"),
      registrationId:
        track.rightsOverrides?.registrationId ??
        `BMO-MOCK-${String(track.id).padStart(4, "0")}`,
      publisher:
        track.rightsOverrides?.publisher ?? `${track.artist} Publishing`,
      masterOwner:
        track.rightsOverrides?.masterOwner ?? "beatmondo Partner Catalog",
      publishingOwner:
        track.rightsOverrides?.publishingOwner ?? `${track.artist} Publishing`,
      ownershipProof: [4, 8, 13, 15, 21].includes(track.id)
        ? "Rights Review Needed"
        : "Verified",
      contractStatus: [4, 8, 13, 15, 21].includes(track.id)
        ? "Legal Review Needed"
        : "On File",
      legalReview: [4, 8, 13, 15, 21].includes(track.id)
        ? "Pending"
        : "Approved",
      prestonApproval: [4, 8, 13, 15, 21].includes(track.id)
        ? "Pending"
        : "Approved",
      licensingEligible: ![4, 8, 13, 15, 21].includes(track.id),
      rightsVerified: ![4, 8, 13, 15, 21].includes(track.id),
      deliveryReady: [
        "Delivery Ready",
        "Protected Delivery",
        "Ready to License",
      ].includes(track.status),
      lastReview: "Jul 2026",
      territory: [4, 8, 13, 15, 21].includes(track.id)
        ? "Territory restrictions may apply"
        : "Worldwide",
      verificationStatus: [4, 8, 13, 15, 21].includes(track.id)
        ? "Documentation Required"
        : "Verified",
      ownershipPercentage:
        track.rightsOverrides?.ownershipPercentage ??
        (track.id <= 6 ? "100%" : index % 3 === 0 ? "50% (co-owned)" : "100%"),
    },
  }))
  .sort((a, b) => {
    const aRank = PINNED_GENERAL_TRACK_IDS.indexOf(a.id);
    const bRank = PINNED_GENERAL_TRACK_IDS.indexOf(b.id);
    return (aRank < 0 ? Number.MAX_SAFE_INTEGER : aRank) -
      (bRank < 0 ? Number.MAX_SAFE_INTEGER : bRank);
  });

const useCases = [
  [
    "Film",
    "Emotional themes, source cues, title beds, and end-credit moments for feature films and independent cinema.",
    img.film,
  ],
  [
    "Television",
    "Series music, episodic scoring, recap cues, and premium network placements.",
    img.streaming,
  ],
  [
    "OTT & Streaming",
    "Rights-ready music for premium series, originals, and global streaming campaigns.",
    img.campaign,
  ],
  [
    "Advertising",
    "Authentic tracks for launches, product films, and premium brand storytelling.",
    img.agency,
  ],
  [
    "Trailers",
    "Impactful builds, emotional lifts, and quote-ready archive tracks for theatrical and digital trailers.",
    img.trailer,
  ],
  [
    "Branded Content",
    "Curated music for branded entertainment, sponsored content, and editorial integrations.",
    img.luxury,
  ],
  [
    "Documentaries",
    "Human, textured music with provenance and rights context for documentary storytelling.",
    img.documentary,
  ],
  [
    "Games",
    "Adaptive music, licensed tracks, and scoring for interactive entertainment.",
    img.city,
  ],
  [
    "Sports",
    "Driven cues for broadcast packages, promos, and human achievement stories.",
    img.broadcast,
  ],
  [
    "Hospitality",
    "Atmospheric selections for hotels, restaurants, and premium hospitality environments.",
    img.car,
  ],
  [
    "Live Experiences",
    "Curated music for launches, installations, events, and immersive moments.",
    img.concert,
  ],
  [
    "Premium Events",
    "Exclusive selections for galas, premieres, brand activations, and VIP experiences.",
    img.tape,
  ],
];

const collections = [
  [
    "Staff Picks",
    "A weekly edit of tracks with story, restraint, and sync potential.",
    42,
    ["Curated", "New"],
    img.privateStudio,
  ],
  [
    "From the Archive",
    "Rare recordings, legacy cuts, and artist stories worth resurfacing.",
    68,
    ["Archive", "Soul"],
    img.musicArchive,
  ],
  [
    "Music for Emotional Storytelling",
    "Piano-led, acoustic, and vocal tracks for human narratives.",
    53,
    ["Film", "Documentary"],
    img.scoringStage,
  ],
  [
    "Cinematic Instrumentals",
    "Preview-only instrumentals with protected master delivery.",
    37,
    ["Score", "Trailer"],
    img.supervisorSuite,
  ],
  [
    "Americana & Soul",
    "Warm guitars, lived-in performances, and vocal character.",
    29,
    ["Roots", "Vocal"],
    img.soulVocal,
  ],
  [
    "Supervisor Favorites",
    "Tracks repeatedly saved by professional creative buyers.",
    31,
    ["Buyer", "Proven"],
    img.mediaDesk,
  ],
];

const projects = [
  {
    name: "Luxury Auto Campaign - Fall 2026",
    type: "Advertising",
    status: "Quote Sent",
    tracks: 4,
    notes: 6,
    image: img.car,
  },
  {
    name: "Documentary Opening Titles",
    type: "Documentary",
    status: "Under Review",
    tracks: 7,
    notes: 11,
    image: img.film,
  },
  {
    name: "Premium Hotel Launch Film",
    type: "Brand Film",
    status: "Approved",
    tracks: 2,
    notes: 3,
    image: img.city,
  },
];

const inquiries = [
  {
    id: "BM-1048",
    company: "VisionTech",
    track: "Golden Hours",
    type: "Corporate Promo",
    budget: "$18k-$25k",
    deadline: "Jul 12",
    status: "Approved",
    buyerTier: "VIP Sync Access",
    priority: "VIP Priority",
    preApprovedTerms: true,
    rightsCheck: "Verified",
    deliveryReadiness: "Delivery Ready",
  },
  {
    id: "BM-1047",
    company: "National Geographic",
    track: "Midnight Transit",
    type: "Documentary",
    budget: "$25k-$50k",
    deadline: "Jul 18",
    status: "Quote Needed",
    buyerTier: "Professional Buyer",
    priority: "Standard",
    preApprovedTerms: false,
    rightsCheck: "Verified",
    deliveryReadiness: "Stems Ready",
  },
  {
    id: "BM-1046",
    company: "Peak Performance",
    track: "Paper Planes",
    type: "Ad Campaign",
    budget: "$50k+",
    deadline: "Jul 24",
    status: "Quote Sent",
    buyerTier: "VIP Sync Access",
    priority: "Fast-Track Delivery",
    preApprovedTerms: true,
    rightsCheck: "Verified",
    deliveryReadiness: "WAV Ready",
  },
  {
    id: "BM-1045",
    company: "Moonline Films",
    track: "All That Remains",
    type: "Film Trailer",
    budget: "$10k-$18k",
    deadline: "Jul 28",
    status: "Rights Check Needed",
    buyerTier: "Discovery Access",
    priority: "Rights Review",
    preApprovedTerms: false,
    rightsCheck: "Legal Review Needed",
    deliveryReadiness: "Blocked",
  },
];

const artists = [
  {
    name: "Lennox",
    credit: "Independent composer, film textures, modern piano",
    tracks: 18,
    image: img.portrait,
    stage: "Metadata Review",
    openItems: 6,
    priority: "Medium",
  },
  {
    name: "Arco North",
    credit: "Guitar-led indie catalog with sync-friendly hooks",
    tracks: 24,
    image: img.concert,
    stage: "Rights Documentation Review",
    openItems: 9,
    priority: "High",
  },
  {
    name: "Vespera",
    credit: "Soul archive with rare vocal performances",
    tracks: 11,
    image: img.vinyl,
    stage: "Preston Approval",
    openItems: 4,
    priority: "High",
  },
  {
    name: "The SMYRK",
    credit:
      "Alternative rock with cinematic tension, live-band impact, and sharp dynamic turns",
    tracks: 1,
    image: img.smyrkCard,
    heroImage: img.smyrkHero,
    portraitImage: img.smyrkPortrait,
    liveImage: img.smyrkLive,
    featureTrackId: 15,
    stage: "Metadata Review",
    openItems: 1,
    priority: "Low",
  },
  {
    name: "The Slambovian Circus of Dreams",
    credit:
      "Theatrical psychedelic Americana with a vivid live identity, eccentric character, and festival-scale energy",
    tracks: 1,
    image: img.slambovianCard,
    heroImage: img.slambovianHero,
    archiveImage: img.slambovianArchive,
    stage: "Editorial Review",
    openItems: 8,
    priority: "High",
    featureTrackId: SLAMBOVIAN_AUDIO_TRACK_ID,
    media: slambovianMedia,
  },
];

const ADMIN_TAB_STORAGE_KEY = "beatmondo-admin-tab";
const ADMIN_TAB_EVENT = "beatmondo-admin-tab";

const navItems = [
  ["home", "Home", House],
  ["catalog", "Explore Music", MagnifyingGlass],
  ["search", "Music Search", MagnifyingGlass],
  ["search-saved", "Saved Searches", BookmarkSimple],
  ["search-recent", "Recent Searches", Clock],
  ["search-collections", "Search Collections", SquaresFour],
  ["usecases", "Use Cases", FilmSlate],
  ["track", "Track Detail", FileAudio],
  ["artist", "Artist Profile", MicrophoneStage],
  ["legacy", "Gary Burke Legacy", Archive],
  ["licensing", "Licensing / Access", ShieldCheck],
  ["buyer", "Buyer Dashboard", UserCircle],
  ["project", "Project Detail", BookmarkSimple],
  ["buyer-quotes", "My Quotes", CurrencyDollar],
  ["buyer-quote", "Quote Detail", FileText],
  ["quote-print", "Quote Print View", Printer],
  ["buyer-contracts", "My Contracts", FileText],
  ["buyer-contract", "Contract Detail", FileText],
  ["signature", "Review & Sign", PenNib],
  ["signature-complete", "Signature Complete", CheckCircle],
  ["signature-declined", "Signature Declined", WarningCircle],
  ["signature-expired", "Signature Expired", Clock],
  ["contract-print", "Contract Print View", Printer],
  ["buyer-payments", "Licence Payments", CurrencyDollar],
  ["buyer-payment", "Licensing Invoice", FileText],
  ["buyer-pay", "Pay Licensing Invoice", CurrencyDollar],
  ["buyer-payment-success", "Payment Success", CheckCircle],
  ["buyer-payment-failed", "Payment Failed", WarningCircle],
  ["buyer-payment-authentication", "Payment Authentication", ShieldCheck],
  ["buyer-payment-methods", "Licensing Payment Methods", CurrencyDollar],
  ["payment-receipt", "Payment Receipt", FileText],
  ["buyer-licences", "My Licences", Certificate],
  ["buyer-licence", "Licence Detail", Certificate],
  ["licence-print", "Licence Document", Printer],
  ["buyer-deliveries", "Secure Deliveries", HardDrives],
  ["buyer-delivery", "Delivery Detail", HardDrives],
  ["buyer-delivery-room", "Project Delivery Room", HardDrives],
  ["artist-dashboard", "Artist Dashboard", MicrophoneStage],
  ["artist-submissions", "Track Submissions", FileAudio],
  ["artist-submission-new", "New Track Submission", CloudArrowUp],
  ["artist-submission-detail", "Submission Detail", FileAudio],
  ["admin", "Admin", GearSix],
  ["content", "Editorial Hub", Article],
  ["stories", "Stories", Article],
  ["media", "Media Episodes", FilmSlate],
  ["merchandise", "Merchandise", ShoppingBag],
  ["contact", "Contact", UsersThree],
  ["investor", "Investor Overview", Eye],
  ["system", "Design System", Sliders],
  ["profile", "Profile", UserCircle],
  ["security", "Security", ShieldCheck],
  ["notifications", "Demo Messages", Bell],
  ["membership", "Membership", Sparkle],
  ["membership-plans", "Membership Plans", Sparkle],
  ["membership-checkout", "Membership Checkout", Sparkle],
  ["membership-confirmation", "Membership Confirmation", CheckCircle],
  ["billing", "Billing", Sparkle],
  ["billing-payment-methods", "Payment Methods", Sparkle],
  ["billing-invoices", "Invoices", FileAudio],
  ["billing-invoice", "Invoice", FileAudio],
  ["billing-subscription", "Manage Subscription", Sparkle],
  ["billing-plan-change-confirmation", "Confirm Plan Change", CheckCircle],
  ["billing-cancel", "Cancel Membership", Sparkle],
  ["billing-reactivate", "Reactivate Membership", Sparkle],
  ["billing-payment-failed", "Resolve Payment", ShieldCheck],
  ["admin-memberships", "Membership Operations", Sparkle],
  ["admin-membership-detail", "Membership Review", Sparkle],
  ["admin-rights", "Rights Database", ShieldCheck],
  ["admin-rights-track", "Track Rights", ShieldCheck],
  ["admin-rights-parties", "Rights Parties", UsersThree],
  ["admin-rights-documents", "Rights Documents", FileAudio],
  ["admin-rights-reviews", "Rights Reviews", ShieldCheck],
  ["admin-rights-disputes", "Rights Disputes", ShieldCheck],
  ["admin-rights-expiring", "Expiring Rights", Clock],
  ["admin-search", "Search Infrastructure", MagnifyingGlass],
  ["admin-search-index", "Search Index", Sliders],
  ["admin-ingestion", "Track Ingestion", CloudArrowUp],
  ["admin-ingestion-new", "Internal Track Draft", CloudArrowUp],
  ["admin-ingestion-detail", "Ingestion Review", FileAudio],
  ["admin-storage", "File Storage & Streaming", HardDrives],
  ["admin-storage-assets", "Storage Assets", FileAudio],
  ["admin-storage-asset", "Asset Detail", FileAudio],
  ["admin-storage-usage", "Storage Usage", Sliders],
  ["admin-storage-access", "Media Access Logs", ShieldCheck],
  ["admin-storage-processing", "Storage Processing", GearSix],
  ["artist-files", "Artist Files", FileAudio],
  ["buyer-media-access", "Playback & Delivery Access", Play],
  ["admin-previews", "Watermarked Previews", Waveform],
  ["admin-previews-queue", "Preview Queue", FileAudio],
  ["admin-previews-preview", "Preview Detail", Waveform],
  ["admin-previews-new", "Create Preview", CloudArrowUp],
  ["admin-previews-policies", "Preview Policies", Sliders],
  ["admin-previews-generation", "Preview Generation", GearSix],
  ["admin-previews-access", "Preview Analytics", ShieldCheck],
  ["admin-quotes", "Quote Calculation", CurrencyDollar],
  ["admin-quotes-new", "New Quote", Calculator],
  ["admin-quote", "Quote Detail", FileText],
  ["admin-quotes-analytics", "Quote Analytics", TrendUp],
  ["admin-pricing-rules", "Pricing Rules", Sliders],
  ["admin-contracts", "Contracts & E-Signature", FileText],
  ["admin-contract-new", "Generate Contract", FileText],
  ["admin-contract-detail", "Contract Detail", FileText],
  ["admin-contract-templates", "Contract Templates", FileText],
  ["admin-contract-clauses", "Clause Library", Article],
  ["admin-contract-analytics", "Contract Analytics", TrendUp],
  ["admin-payments", "Licensing Payments", CurrencyDollar],
  ["admin-payment-detail", "Payment Detail", CurrencyDollar],
  ["admin-payment-reconciliation", "Payment Reconciliation", ShieldCheck],
  ["admin-refunds", "Refunds", CurrencyDollar],
  ["admin-credits", "Account Credits", CurrencyDollar],
  ["admin-payment-analytics", "Payment Analytics", TrendUp],
  ["admin-licences", "Licence Generation", Certificate],
  ["admin-licence-new", "Generate Licence", Certificate],
  ["admin-licence-detail", "Licence Detail", Certificate],
  ["admin-licence-expiring", "Expiring Licences", Clock],
  ["admin-licence-amendments", "Licence Amendments", FileText],
  ["admin-licence-renewals", "Licence Renewals", Clock],
  ["admin-licence-analytics", "Licence Analytics", TrendUp],
  ["admin-deliveries", "Secure Delivery", HardDrives],
  ["admin-deliveries-new", "Create Delivery Package", HardDrives],
  ["admin-delivery-detail", "Delivery Detail", HardDrives],
  ["admin-delivery-access", "Delivery Access Requests", ShieldCheck],
  ["admin-delivery-replacements", "Delivery Replacements", FileText],
  ["admin-delivery-analytics", "Delivery Analytics", TrendUp],
  ["admin-expiring-access", "Expiring Access", Clock],
  ["admin-expiring-access-detail", "Access Record", LinkSimple],
  ["admin-expiring-access-policies", "Access Policies", Sliders],
  ["admin-expiring-access-security", "Access Security", ShieldCheck],
  ["admin-expiring-access-analytics", "Access Analytics", TrendUp],
  ["admin-audit", "Audit Logging", Archive],
  ["admin-audit-event", "Audit Evidence", FileText],
  ["admin-audit-security", "Audit Security", ShieldCheck],
  ["admin-audit-exports", "Audit Exports", DownloadSimple],
  ["admin-audit-settings", "Audit Retention", Sliders],
  ["admin-audit-analytics", "Audit Analytics", TrendUp],
  ["admin/email", "Email Notifications", Bell],
  ["admin/email/queue", "Email Queue", Clock],
  ["admin/email/messages", "Email Messages", Bell],
  ["admin/email/templates", "Email Templates", FileText],
  ["admin/email/template", "Template Preview", Eye],
  ["admin/email/triggers", "Email Triggers", GearSix],
  ["admin/email/preferences", "Email Preferences", Sliders],
  ["admin/email/failures", "Email Failures", WarningCircle],
  ["admin/email/analytics", "Email Analytics", TrendUp],
  ["settings/notifications", "Notification Preferences", Bell],
  ["email/message", "Message Detail", Bell],
  ["admin/access", "Admin Permissions", ShieldCheck],
  ["admin/access/users", "Access Users", UsersThree],
  ["admin/access/user", "User Access", UserCircle],
  ["admin/access/roles", "Access Roles", ShieldCheck],
  ["admin/access/role", "Role Detail", ShieldCheck],
  ["admin/access/permissions", "Permissions", Key],
  ["admin/access/permission", "Permission Detail", Key],
  ["admin/access/requests", "Access Requests", Key],
  ["admin/access/temporary", "Temporary Access", Clock],
  ["admin/access/delegations", "Delegations", UsersThree],
  ["admin/access/impersonation", "Impersonation", Eye],
  ["admin/access/reviews", "Access Reviews", CheckCircle],
  ["admin/access/conflicts", "Access Conflicts", WarningCircle],
  ["admin/analytics", "Analytics & Reporting", TrendUp],
  ["admin/analytics/executive", "Executive Analytics", TrendUp],
  ["admin/analytics/commercial", "Commercial Analytics", CurrencyDollar],
  ["admin/analytics/catalog", "Catalog Analytics", MusicNote],
  ["admin/analytics/search", "Search Analytics", MagnifyingGlass],
  ["admin/analytics/buyers", "Buyer Analytics", UsersThree],
  ["admin/analytics/artists", "Artist Analytics", MicrophoneStage],
  ["admin/analytics/rights", "Rights Analytics", ShieldCheck],
  ["admin/analytics/finance", "Finance Analytics", CurrencyDollar],
  ["admin/analytics/operations", "Operations Analytics", Sliders],
  ["admin/analytics/security", "Security Analytics", LockKey],
  ["admin/analytics/email", "Email Analytics", Bell],
  ["admin/analytics/permissions", "Permissions Analytics", Key],
  ["admin/reports", "Report Library", FileText],
  ["admin/reports/builder", "Report Builder", Sliders],
  ["admin/reports/scheduled", "Scheduled Reports", Clock],
  ["admin/reports/exports", "Report Exports", DownloadSimple],
  ["buyer/analytics", "Organization Analytics", TrendUp],
  ["artist/analytics", "My Performance", TrendUp],
  ["settings/privacy", "Privacy & Data", ShieldCheck],
  ["privacy/request", "Privacy Request", FileText],
  ["privacy/request/detail", "Privacy Request Detail", FileText],
  ["admin/privacy", "Compliance & Privacy", ShieldCheck],
  ["admin/privacy/requests", "Privacy Requests", UsersThree],
  ["admin/privacy/request", "Privacy Request Review", FileText],
  ["admin/privacy/inventory", "Data Inventory", Archive],
  ["admin/privacy/purposes", "Processing Purposes", Sliders],
  ["admin/privacy/notices", "Privacy Notices", FileText],
  ["admin/privacy/consents", "Consent Records", CheckCircle],
  ["admin/privacy/retention", "Privacy Retention", Clock],
  ["admin/privacy/legal-holds", "Legal Holds", LockKey],
  ["admin/privacy/vendors", "Privacy Vendors", UsersThree],
  ["admin/privacy/incidents", "Privacy Incidents", WarningCircle],
  ["admin/privacy/assessments", "Privacy Assessments", ShieldCheck],
  ["admin/privacy/exports", "Privacy Exports", DownloadSimple],
  ["artist-previews", "My Protected Previews", Waveform],
  ["buyer-private-previews", "Private Previews", LockKey],
  ["artist-rights", "My Rights Review", ShieldCheck],
  ["admin-users", "User Management", UsersThree],
  ["buyer-verification", "Buyer Verification", ShieldCheck],
  ["admin-verifications", "Verification Queue", ShieldCheck],
  ["admin-verification-detail", "Verification Review", ShieldCheck],
];

const navItemMap = new Map(navItems.map((item) => [item[0], item]));
const BUYER_SIDEBAR_CORE = [
  "home",
  "catalog",
  "usecases",
  "buyer",
  "project",
  "buyer-verification",
  "membership",
  "billing",
  "licensing",
];
const BUYER_SIDEBAR_COMMERCIAL = [
  "buyer-quotes",
  "buyer-contracts",
  "buyer-payments",
  "buyer-licences",
  "buyer-deliveries",
  "buyer-media-access",
  "buyer-private-previews",
  "buyer/analytics",
  "settings/privacy",
];
const ARTIST_SIDEBAR = [
  "home",
  "catalog",
  "artist-dashboard",
  "artist-submissions",
  "artist-files",
  "artist-rights",
  "artist-previews",
  "artist/analytics",
  "settings/privacy",
];
const OPS_SIDEBAR = [
  "admin",
  "admin-verifications",
  "admin-memberships",
  "admin-rights",
  "admin-search",
  "admin-ingestion",
  "admin-storage",
  "admin-previews",
  "admin-quotes",
  "admin-contracts",
  "admin-payments",
  "admin-licences",
  "admin-deliveries",
  "admin-expiring-access",
  "admin-audit",
  "admin/email",
  "admin/access",
  "admin/analytics",
  "admin/privacy",
];
const EDITORIAL_SIDEBAR = ["legacy", "content", "stories", "media", "contact"];
const PROTOTYPE_SIDEBAR = ["investor", "system"];

/** Parent nav highlight map for nested commercial / ops / account routes. */
const NAV_PARENT_BY_VIEW = {
  // Search library family → Explore Music
  search: "catalog",
  "search-saved": "catalog",
  "search-recent": "catalog",
  "search-collections": "catalog",
  "admin-search": "catalog",
  "admin-search-index": "catalog",
  // Buyer commercial detail
  "buyer-quote": "buyer-quotes",
  "quote-print": "buyer-quotes",
  "buyer-contract": "buyer-contracts",
  signature: "buyer-contracts",
  "signature-complete": "buyer-contracts",
  "signature-declined": "buyer-contracts",
  "signature-expired": "buyer-contracts",
  "contract-print": "buyer-contracts",
  "buyer-payment": "buyer-payments",
  "buyer-pay": "buyer-payments",
  "buyer-payment-success": "buyer-payments",
  "buyer-payment-failed": "buyer-payments",
  "buyer-payment-authentication": "buyer-payments",
  "buyer-payment-methods": "buyer-payments",
  "payment-receipt": "buyer-payments",
  "buyer-licence": "buyer-licences",
  "licence-print": "buyer-licences",
  "buyer-delivery": "buyer-deliveries",
  "buyer-delivery-room": "buyer-deliveries",
  // Membership / billing
  "membership-plans": "membership",
  "membership-checkout": "membership",
  "membership-confirmation": "membership",
  "billing-payment-methods": "billing",
  "billing-invoices": "billing",
  "billing-invoice": "billing",
  "billing-subscription": "billing",
  "billing-cancel": "billing",
  "billing-reactivate": "billing",
  "billing-plan-change-confirmation": "billing-subscription",
  "billing-payment-failed": "billing",
  "admin-membership-detail": "admin-memberships",
  // Artist
  "artist-submission-new": "artist-submissions",
  "artist-submission-detail": "artist-submissions",
  // Rights
  "admin-rights-track": "admin-rights",
  "admin-rights-parties": "admin-rights",
  "admin-rights-documents": "admin-rights",
  "admin-rights-reviews": "admin-rights",
  "admin-rights-disputes": "admin-rights",
  "admin-rights-expiring": "admin-rights",
  // Ingestion
  "admin-ingestion-new": "admin-ingestion",
  "admin-ingestion-detail": "admin-ingestion",
  // Storage
  "admin-storage-assets": "admin-storage",
  "admin-storage-asset": "admin-storage",
  "admin-storage-usage": "admin-storage",
  "admin-storage-access": "admin-storage",
  "admin-storage-processing": "admin-storage",
  // Previews
  "admin-previews-queue": "admin-previews",
  "admin-previews-preview": "admin-previews",
  "admin-previews-new": "admin-previews",
  "admin-previews-policies": "admin-previews",
  "admin-previews-generation": "admin-previews",
  "admin-previews-access": "admin-previews",
  // Quotes
  "admin-quotes-new": "admin-quotes",
  "admin-quote": "admin-quotes",
  "admin-quotes-analytics": "admin-quotes",
  "admin-pricing-rules": "admin-quotes",
  // Contracts
  "admin-contract-new": "admin-contracts",
  "admin-contract-detail": "admin-contracts",
  "admin-contract-templates": "admin-contracts",
  "admin-contract-clauses": "admin-contracts",
  "admin-contract-analytics": "admin-contracts",
  // Payments
  "admin-payment-detail": "admin-payments",
  "admin-payment-reconciliation": "admin-payments",
  "admin-refunds": "admin-payments",
  "admin-credits": "admin-payments",
  "admin-payment-analytics": "admin-payments",
  // Licences
  "admin-licence-new": "admin-licences",
  "admin-licence-detail": "admin-licences",
  "admin-licence-expiring": "admin-licences",
  "admin-licence-amendments": "admin-licences",
  "admin-licence-renewals": "admin-licences",
  "admin-licence-analytics": "admin-licences",
  // Delivery
  "admin-deliveries-new": "admin-deliveries",
  "admin-delivery-detail": "admin-deliveries",
  "admin-delivery-access": "admin-deliveries",
  "admin-delivery-replacements": "admin-deliveries",
  "admin-delivery-analytics": "admin-deliveries",
  // Expiring access
  "admin-expiring-access-detail": "admin-expiring-access",
  "admin-expiring-access-policies": "admin-expiring-access",
  "admin-expiring-access-security": "admin-expiring-access",
  "admin-expiring-access-analytics": "admin-expiring-access",
  // Audit
  "admin-audit-event": "admin-audit",
  "admin-audit-security": "admin-audit",
  "admin-audit-exports": "admin-audit",
  "admin-audit-settings": "admin-audit",
  "admin-audit-analytics": "admin-audit",
  // Email
  "admin/email/queue": "admin/email",
  "admin/email/messages": "admin/email",
  "admin/email/message": "admin/email",
  "admin/email/templates": "admin/email",
  "admin/email/template": "admin/email",
  "admin/email/triggers": "admin/email",
  "admin/email/preferences": "admin/email",
  "admin/email/failures": "admin/email",
  "admin/email/analytics": "admin/email",
  "email/message": "notifications",
  "settings/notifications": "notifications",
  // Permissions
  "admin/access/users": "admin/access",
  "admin/access/user": "admin/access",
  "admin/access/roles": "admin/access",
  "admin/access/role": "admin/access",
  "admin/access/permissions": "admin/access",
  "admin/access/permission": "admin/access",
  "admin/access/requests": "admin/access",
  "admin/access/temporary": "admin/access",
  "admin/access/delegations": "admin/access",
  "admin/access/impersonation": "admin/access",
  "admin/access/reviews": "admin/access",
  "admin/access/conflicts": "admin/access",
  // Analytics / reports
  "admin/analytics/executive": "admin/analytics",
  "admin/analytics/commercial": "admin/analytics",
  "admin/analytics/catalog": "admin/analytics",
  "admin/analytics/search": "admin/analytics",
  "admin/analytics/buyers": "admin/analytics",
  "admin/analytics/artists": "admin/analytics",
  "admin/analytics/rights": "admin/analytics",
  "admin/analytics/finance": "admin/analytics",
  "admin/analytics/operations": "admin/analytics",
  "admin/analytics/security": "admin/analytics",
  "admin/analytics/email": "admin/analytics",
  "admin/analytics/permissions": "admin/analytics",
  "admin/reports": "admin/analytics",
  "admin/reports/builder": "admin/analytics",
  "admin/reports/scheduled": "admin/analytics",
  "admin/reports/exports": "admin/analytics",
  // Privacy
  "privacy/request": "settings/privacy",
  "privacy/request/detail": "settings/privacy",
  "admin/privacy/requests": "admin/privacy",
  "admin/privacy/request": "admin/privacy",
  "admin/privacy/inventory": "admin/privacy",
  "admin/privacy/purposes": "admin/privacy",
  "admin/privacy/notices": "admin/privacy",
  "admin/privacy/consents": "admin/privacy",
  "admin/privacy/retention": "admin/privacy",
  "admin/privacy/legal-holds": "admin/privacy",
  "admin/privacy/vendors": "admin/privacy",
  "admin/privacy/incidents": "admin/privacy",
  "admin/privacy/assessments": "admin/privacy",
  "admin/privacy/exports": "admin/privacy",
  // Verification
  "admin-verification-detail": "admin-verifications",
  // Account settings family (profile is the account hub)
  security: "profile",
  "settings/privacy": "profile",
};

function buildSidebarSections(user) {
  const editorial = ["Editorial", EDITORIAL_SIDEBAR];
  if (!user) {
    return [
      ["Discover", ["home", "catalog", "usecases", "licensing", "membership-plans"]],
      editorial,
    ];
  }
  if (user.userType === "artist" || user.role === "artist") {
    return [["Artist workspace", ARTIST_SIDEBAR], editorial];
  }
  const isBuyer = ["discovery_buyer", "professional_buyer", "vip_buyer"].includes(
    user.role,
  );
  const isInternal =
    user.permissions?.includes("*") ||
    [
      "licensing_manager",
      "catalog_manager",
      "media_operations",
      "finance_manager",
      "legal_reviewer",
      "security_administrator",
      "privacy_administrator",
      "support_administrator",
      "senior_approver",
      "administrator",
      "super_administrator",
    ].includes(user.role);

  const sections = [];
  if (isBuyer) {
    sections.push([
      "Buyer workspace",
      [...BUYER_SIDEBAR_CORE, ...BUYER_SIDEBAR_COMMERCIAL],
    ]);
  } else if (isInternal) {
    sections.push([
      "Discover",
      ["home", "catalog", "usecases", "licensing"],
    ]);
    sections.push(["Operations", OPS_SIDEBAR]);
    if (user.role === "super_administrator" || user.permissions?.includes("*")) {
      sections.push(["Prototype", PROTOTYPE_SIDEBAR]);
    }
  }
  sections.push(editorial);
  return sections;
}

const sidebarSections = [
  ["Buyer workspace", [...BUYER_SIDEBAR_CORE, ...BUYER_SIDEBAR_COMMERCIAL]],
  ["Editorial", EDITORIAL_SIDEBAR],
  ["Operations", OPS_SIDEBAR],
  ["Prototype", PROTOTYPE_SIDEBAR],
];

const standaloneViews = new Set([
  "home",
  "merchandise",
  "investor",
  "login",
  "register",
  "signup",
  "forgot",
  "forgot-password",
  "reset-password",
  "verify-email",
  "verification-success",
  "mfa",
  "account-locked",
  "account-suspended",
  "session-expired",
  "access-denied",
  "membership-plans",
  "licence-print",
  "access",
]);
const validViews = new Set([
  ...navItems.map(([id]) => id),
  ...standaloneViews,
  ...AUTH_VIEWS,
  ...VERIFICATION_VIEWS,
  ...MEMBERSHIP_VIEWS,
  ...RIGHTS_VIEWS,
  ...SEARCH_VIEWS,
  ...INGESTION_VIEWS,
  ...STORAGE_VIEWS,
  ...WATERMARK_PREVIEW_VIEWS,
  ...QUOTE_VIEWS,
  ...CONTRACT_VIEWS,
  ...PAYMENT_VIEWS,
  ...LICENCE_VIEWS,
  ...SECURE_DELIVERY_VIEWS,
  ...EXPIRING_ACCESS_VIEWS,
  ...AUDIT_VIEWS,
  ...EMAIL_VIEWS,
  ...PERMISSIONS_VIEWS,
  ...ANALYTICS_VIEWS,
  ...PRIVACY_VIEWS,
]);

function parseDurationMinutes(duration) {
  const [min, sec] = duration.split(":").map(Number);
  return min + sec / 60;
}

function formatDurationSeconds(seconds) {
  const rounded = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function getPlayableDuration(track) {
  return track.previewSrc
    ? formatDurationSeconds(track.previewDuration)
    : track.duration;
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
  else if (sortBy === "artist")
    sorted.sort((a, b) => a.artist.localeCompare(b.artist));
  else if (sortBy === "duration")
    sorted.sort(
      (a, b) =>
        parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration),
    );
  sorted.sort((a, b) => {
    const aRank = PINNED_GENERAL_TRACK_IDS.indexOf(a.id);
    const bRank = PINNED_GENERAL_TRACK_IDS.indexOf(b.id);
    return (aRank < 0 ? Number.MAX_SAFE_INTEGER : aRank) -
      (bRank < 0 ? Number.MAX_SAFE_INTEGER : bRank);
  });
  return sorted;
}

function getRightsStatus(track) {
  return (
    rightsService.getBuyerSummary(track.id)?.status ||
    (track.rightsData.rightsVerified ? "Rights Verified" : "Rights Review")
  );
}

function getDeliveryStatus(track) {
  const rights = rightsService.getBuyerSummary(track.id);
  if (rights && !rights.allowedAssets.includes("Master"))
    return "Delivery Locked";
  if (track.rightsData.deliveryReady) return "Delivery Ready";
  if (track.assets.wavMaster) return "Protected Delivery";
  return "Delivery Locked";
}

function App() {
  const auth = useAuth();
  const [view, setView] = useState("home");
  const [accessReason, setAccessReason] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(tracks[0]);
  const [selectedArtistName, setSelectedArtistName] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [playerTrackId, setPlayerTrackId] = useState(null);
  const [streamSessionId, setStreamSessionId] = useState(null);
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
  const [activePreviewInfo, setActivePreviewInfo] = useState(null);
  const previewAudioRef = useRef(null);

  useEffect(() => {
    watermarkedPreviewService.syncReadyPreviewsToStorage();
  }, []);

  useEffect(() => {
    window.resetAllBeatmondoDemoData = () => {
      buyerVerificationService.resetDemoData();
      membershipService.resetMembershipBillingDemoData();
      rightsService.resetRightsDatabaseDemoData();
      searchService.resetSearchInfrastructureDemoData();
      storageService.resetFileStorageStreamingDemoData();
      watermarkedPreviewService.resetWatermarkedPreviewsDemoData();
      quoteService.reset();
      contractService.resetContractsESignatureDemoData();
      paymentService.resetPaymentsDemoData();
      licenceService.reset();
      secureDeliveryService.resetSecureDeliveryDemoData();
      expiringAccessService.resetExpiringUrlsDemoData();
      auditService.reset();
      emailService.reset();
      resetAdminPermissionsDemoData();
      resetCompliancePrivacyDemoData();
      ingestionService.resetTrackIngestionDemoData();
      analyticsService.resetAnalyticsReportingDemoData();
      // Clean selected keys from localStorage
      localStorage.removeItem("beatmondo-selected-track");
      localStorage.removeItem("beatmondo-selected-quote");
      localStorage.removeItem("beatmondo-selected-contract");
      localStorage.removeItem("beatmondo-selected-licence");
      localStorage.removeItem("beatmondo-selected-delivery");
      localStorage.removeItem("beatmondo-selected-asset");
      localStorage.removeItem("beatmondo-selected-preview");
    };
    return () => {
      delete window.resetAllBeatmondoDemoData;
    };
  }, []);

  const setRoute = (nextView, entityId = null) => {
    if (!validViews.has(nextView)) return;
    setView(nextView);
    setModalTrack(null);
    setShowNotifications(false);
    setMobileNav(false);
    let hash = "";
    if (nextView !== "home") {
      hash =
        entityId != null && entityId !== ""
          ? `#${nextView}/${entityId}`
          : `#${nextView}`;
    }
    window.history.replaceState(null, "", hash || window.location.pathname);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const navigate = (nextView) => {
    if (!validViews.has(nextView)) return;
    const decision = getRouteDecision(nextView, auth.user, auth.ready);
    if (!decision.allowed) {
      auth.setIntendedView(nextView);
      setAccessReason(
        decision.reason ||
          "This private workspace is not available to the current account.",
      );
      setRoute(auth.sessionExpired ? "session-expired" : decision.redirect);
      return;
    }
    setAccessReason("");
    if (nextView === "membership-plans" && view !== "membership-plans") {
      window.sessionStorage.setItem(
        MEMBERSHIP_RETURN_KEY,
        JSON.stringify({ view, recordedAt: Date.now() }),
      );
    }
    setRoute(nextView);
  };

  useEffect(() => {
    const syncFromHash = () => {
      const raw = window.location.hash.replace("#", "");
      if (!raw || raw === "home") {
        setView("home");
        setModalTrack(null);
        setShowNotifications(false);
        return;
      }
      if (raw.startsWith("access/")) {
        setView("access");
        setModalTrack(null);
        setShowNotifications(false);
        return;
      }
      // Prefer full multi-segment routes (settings/privacy, admin/email, …)
      // before treating the first segment as a deep-link base (track/15).
      if (validViews.has(raw)) {
        setView(raw);
        setModalTrack(null);
        setShowNotifications(false);
        return;
      }
      const [base, entity] = raw.split("/");
      if (base === "track" && entity) {
        const found = tracks.find((t) => String(t.id) === entity);
        if (found) setSelectedTrack(found);
        if (validViews.has("track")) {
          setView("track");
          setModalTrack(null);
          setShowNotifications(false);
        }
        return;
      }
      if (base === "licensing" && entity === "access") {
        window.sessionStorage.setItem("beatmondo-licensing-mode", "access");
        setView("licensing");
        setModalTrack(null);
        setShowNotifications(false);
        return;
      }
      if (base === "licensing" && entity === "request") {
        window.sessionStorage.setItem("beatmondo-licensing-mode", "license");
        setView("licensing");
        setModalTrack(null);
        setShowNotifications(false);
        return;
      }
      if (validViews.has(base)) {
        setView(base);
        setModalTrack(null);
        setShowNotifications(false);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    if (!auth.ready) return;
    const decision = getRouteDecision(view, auth.user, true);
    if (!decision.allowed && view !== decision.redirect) {
      auth.setIntendedView(view);
      setAccessReason(
        decision.reason ||
          "This private workspace is not available to the current account.",
      );
      setRoute(auth.sessionExpired ? "session-expired" : decision.redirect);
    }
  }, [auth.ready, auth.user, auth.sessionExpired, view]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onExternalToast = (event) => {
      if (typeof event.detail === "string" && event.detail) setToast(event.detail);
    };
    window.addEventListener("beatmondo-toast", onExternalToast);
    return () => window.removeEventListener("beatmondo-toast", onExternalToast);
  }, []);

  useEffect(() => {
    const openGlobalSearch = (event) => {
      if (
        event.key !== "/" ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName,
        )
      )
        return;
      event.preventDefault();
      window.sessionStorage.setItem("beatmondo-focus-global-search", "true");
      navigate("search");
    };
    window.addEventListener("keydown", openGlobalSearch);
    return () => window.removeEventListener("keydown", openGlobalSearch);
  }, [view, auth.user]);

  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio) return undefined;

    const syncPlayingTrack = () => {
      const activeTrackId = Number(audio.dataset.trackId);
      setPlayingId(Number.isFinite(activeTrackId) ? activeTrackId : null);
    };
    const syncPausedTrack = () => setPlayingId(null);
    const syncPlaybackError = () => {
      const fallbackSrc = audio.dataset.fallbackSrc;
      if (fallbackSrc && audio.dataset.fallbackAttempted !== "true") {
        const resumeAt = audio.currentTime || 0;
        audio.dataset.fallbackAttempted = "true";
        audio.src = fallbackSrc;
        audio.load();
        audio.currentTime = resumeAt;
        audio.play().catch(() => {
          setPlayingId(null);
          showToast(
            "The protected preview could not be played. Please try again.",
          );
        });
        return;
      }
      setPlayingId(null);
      showToast("The protected preview could not be played. Please try again.");
    };

    audio.addEventListener("play", syncPlayingTrack);
    audio.addEventListener("pause", syncPausedTrack);
    audio.addEventListener("ended", syncPausedTrack);
    audio.addEventListener("error", syncPlaybackError);
    return () => {
      audio.removeEventListener("play", syncPlayingTrack);
      audio.removeEventListener("pause", syncPausedTrack);
      audio.removeEventListener("ended", syncPausedTrack);
      audio.removeEventListener("error", syncPlaybackError);
    };
  }, []);

  const showToast = (message) => setToast(message);

  const filteredTracks = useMemo(() => {
    const verification = auth.user
      ? buyerVerificationService.getByUser(auth.user.id)
      : null;
    const membership = auth.user
      ? membershipService.getCurrentMembership(auth.user.id)
      : null;
    const effectiveAccess = auth.user?.permissions?.includes("*")
      ? { has: () => true }
      : calculateEffectiveAccess(auth.user, verification, membership);
    const canViewVipCatalog = effectiveAccess.has("catalog.vip");
    const filtered = tracks.filter((track) => {
      const rights = rightsService.getBuyerSummary(track.id);
      const text =
        `${track.title} ${track.artist} ${track.genre} ${track.mood} ${track.tags.join(" ")} ${track.usage} ${track.instrumentation}`.toLowerCase();

      const bpmVal = parseInt(track.bpm) || 0;
      const matchBpm =
        filters.bpm === "Any BPM" ||
        (filters.bpm === "Under 80 BPM" && bpmVal < 80) ||
        (filters.bpm === "80 - 120 BPM" && bpmVal >= 80 && bpmVal <= 120) ||
        (filters.bpm === "120+ BPM" && bpmVal > 120);

      const matchExclusivity =
        filters.exclusivity === "Any Exclusivity" ||
        (filters.exclusivity === "Exclusivity Available" &&
          track.commercial.exclusivityAvailable) ||
        (filters.exclusivity === "Non-Exclusive Only" &&
          !track.commercial.exclusivityAvailable);

      return (
        text.includes(query.toLowerCase()) &&
        (!track.vipOnly || canViewVipCatalog) &&
        (filters.genre === "All Genres" || track.genre === filters.genre) &&
        (filters.mood === "Any Mood" || track.mood === filters.mood) &&
        (filters.theme === "Any Theme" ||
          track.tags
            .map((t) => t.toLowerCase())
            .includes(filters.theme.toLowerCase())) &&
        (filters.energy === "Any Energy" || track.energy === filters.energy) &&
        (filters.tempo === "Any Tempo" || track.tempo === filters.tempo) &&
        matchBpm &&
        matchesDuration(track.duration, filters.duration) &&
        (filters.vocal === "Any Vocal" || track.vocal === filters.vocal) &&
        (filters.era === "Any Era" || track.era === filters.era) &&
        (filters.instrumentation === "Any Instrument" ||
          track.instrumentation
            .toLowerCase()
            .includes(filters.instrumentation.toLowerCase())) &&
        (filters.usage === "Any Usage" || track.usage === filters.usage) &&
        (filters.rightsVerified === "Any Rights Status" ||
          (filters.rightsVerified === "Rights Verified" &&
            rights?.eligibility === "Eligible") ||
          (filters.rightsVerified === "Licensing Available" &&
            rights?.licensable) ||
          (filters.rightsVerified === "Manual Clearance Required" &&
            rights?.manualReviewRequired) ||
          (filters.rightsVerified === "Rights Review Needed" &&
            (!rights || !rights.licensable))) &&
        (filters.availability === "All Availability" ||
          track.availability === filters.availability) &&
        (filters.vipCatalog === "All Access" ||
          (filters.vipCatalog === "VIP Picks"
            ? track.vipOnly
            : !track.vipOnly)) &&
        matchExclusivity &&
        (filters.stems === "Any Stem Status" ||
          (filters.stems === "Stems Available"
            ? Boolean(rights?.allowedAssets.includes("Stems"))
            : !rights?.allowedAssets.includes("Stems")))
      );
    });
    return sortTracks(filtered, sortBy);
  }, [query, filters, sortBy, auth.user]);

  const saveTrack = (id) =>
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const togglePlay = (id) => {
    const nextTrack = tracks.find((track) => track.id === id);
    const audio = previewAudioRef.current;
    if (!audio) return;
    const isActiveTrack = audio.dataset.trackId === String(id);
    if (!nextTrack?.previewSrc && playingId === id) {
      setPlayingId(null);
      if (streamSessionId)
        storageService.updateSession(
          streamSessionId,
          { status: "Paused", lastPosition: 0 },
          auth.user,
        );
      if (streamSessionId)
        watermarkedPreviewService.completeSession(
          streamSessionId,
          auth.user,
          0,
          false,
        );
      return;
    }
    if (isActiveTrack && !audio.paused) {
      audio.pause();
      if (streamSessionId)
        storageService.updateSession(
          streamSessionId,
          { status: "Paused", lastPosition: audio.currentTime },
          auth.user,
        );
      if (streamSessionId)
        watermarkedPreviewService.completeSession(
          streamSessionId,
          auth.user,
          audio.currentTime,
          false,
        );
      return;
    }
    const stream = storageService.createStreamingSession(id, auth.user, view);
    if (!stream.ok) {
      showToast(stream.message);
      return;
    }
    setStreamSessionId(stream.session.id);
    if (stream.asset.watermarkedPreviewId) {
      const watermarkSession = watermarkedPreviewService.createPreviewSession(
        stream.asset.watermarkedPreviewId,
        auth.user,
        stream.session.id,
        view,
      );
      if (!watermarkSession.ok) {
        storageService.expireStreamingSession(stream.session.id, auth.user);
        showToast(watermarkSession.message);
        return;
      }
      setActivePreviewInfo({
        ...stream.asset,
        previewSessionId: watermarkSession.session.id,
        forensicReference: watermarkSession.session.forensicReference,
      });
    } else {
      setActivePreviewInfo(null);
    }
    setPlayerTrackId(id);
    if (!nextTrack?.previewSrc) {
      audio.pause();
      audio.removeAttribute("src");
      audio.dataset.trackId = String(id);
      setPlayingId(id);
      showToast("Protected preview session created with simulated playback.");
      return;
    }

    if (!isActiveTrack) {
      audio.pause();
      audio.src = nextTrack.previewSrc;
      audio.dataset.fallbackSrc = nextTrack.previewFallbackSrc || "";
      delete audio.dataset.fallbackAttempted;
      audio.dataset.trackId = String(id);
      audio.currentTime = 0;
      audio.load();
    }
    if (
      audio.ended ||
      (Number.isFinite(audio.duration) &&
        audio.currentTime >= audio.duration - 0.1)
    ) {
      audio.currentTime = 0;
    }
    audio.defaultMuted = false;
    audio.muted = false;
    audio.volume = 1;
    delete audio.dataset.playbackError;
    const playback = audio.play();
    if (playback?.catch)
      playback.catch((error) => {
        audio.dataset.playbackError = `${error.name}: ${error.message}`;
        setPlayingId(null);
        showToast("Playback needs a direct click. Please press play again.");
      });
  };
  const closePlayer = () => {
    const audio = previewAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingId(null);
    setPlayerTrackId(null);
    if (streamSessionId)
      storageService.updateSession(
        streamSessionId,
        { status: "Completed", lastPosition: 0 },
        auth.user,
      );
    if (streamSessionId)
      watermarkedPreviewService.completeSession(
        streamSessionId,
        auth.user,
        0,
        true,
      );
    setStreamSessionId(null);
    setActivePreviewInfo(null);
  };
  useEffect(() => {
    const handleInvalidatedSession = (event) => {
      if (!streamSessionId || event.detail?.sessionId !== streamSessionId)
        return;
      const audio = previewAudioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingId(null);
      setPlayerTrackId(null);
      setStreamSessionId(null);
      setActivePreviewInfo(null);
      showToast(event.detail?.reason || "Protected preview access ended.");
    };
    window.addEventListener(
      "beatmondo-preview-session-invalidated",
      handleInvalidatedSession,
    );
    return () =>
      window.removeEventListener(
        "beatmondo-preview-session-invalidated",
        handleInvalidatedSession,
      );
  }, [streamSessionId]);
  const openTrack = (track) => {
    setSelectedTrack(track);
    setSelectedArtistName(track.artist);
    if (!validViews.has("track")) return;
    const decision = getRouteDecision("track", auth.user, auth.ready);
    if (!decision.allowed) {
      auth.setIntendedView("track");
      setAccessReason(
        decision.reason ||
          "This private workspace is not available to the current account.",
      );
      setRoute(auth.sessionExpired ? "session-expired" : decision.redirect);
      return;
    }
    setAccessReason("");
    setRoute("track", track.id);
  };
  const openArtistProfile = (artistName) => {
    if (!artists.some((artist) => artist.name === artistName)) return;
    setSelectedArtistName(artistName);
    navigate("artist");
  };
  const requestLicense = (track) => {
    if (track.editorialAudioExtract) {
      setSelectedTrack(track);
      showToast(
        "This teaser audio extract is available for protected editorial listening only while track-level rights and licensing authority are reviewed.",
      );
      navigate("track");
      return;
    }
    const rights = rightsService.getBuyerSummary(track.id, {
      territory: "Worldwide",
      usageType: "commercial",
      deliveryAssets: ["Master"],
    });
    if (
      rights &&
      !["Eligible", "Eligible with Restrictions", "Conditional"].includes(
        rights.eligibility,
      )
    ) {
      setSelectedTrack(track);
      showToast(
        `${track.title} cannot enter an automatic licensing request: ${rights.wording}`,
      );
      navigate("track");
      return;
    }
    if (auth.user?.userType === "buyer") {
      const verification = buyerVerificationService.getByUser(auth.user.id);
      const membership = membershipService.getCurrentMembership(auth.user.id);
      const access = calculateEffectiveAccess(
        auth.user,
        verification,
        membership,
      );
      if (!access.has("licensing.request")) {
        if (
          !["Approved", "Approved with Restrictions", "Reinstated"].includes(
            verification?.status,
          )
        ) {
          showToast(
            "Professional buyer verification is required before submitting licensing requests.",
          );
          navigate("buyer-verification");
        } else if (
          ["Past Due", "Grace Period", "Payment Failed", "Suspended"].includes(
            membership?.status,
          )
        ) {
          showToast(
            "Resolve the membership billing issue before submitting a licensing request.",
          );
          navigate("billing-payment-failed");
        } else {
          showToast(
            "An active Professional Buyer or VIP membership is required.",
          );
          navigate("membership-plans");
        }
        return;
      }
    }
    setModalTrack(track);
    setModalRequestSent(false);
  };
  const playerTrack = tracks.find((track) => track.id === playerTrackId);
  const isStandaloneView = standaloneViews.has(view);

  return (
    <div className={`app ${isStandaloneView ? "home-app public-app" : ""}`}>
      {!isStandaloneView && (
        <Sidebar
          view={view}
          setView={navigate}
          mobileNav={mobileNav}
          setMobileNav={setMobileNav}
        />
      )}
      <main className="main-shell">
        {!isStandaloneView && <ImpersonationBanner />}
        {!isStandaloneView && (
          <Topbar
            view={view}
            setView={navigate}
            setMobileNav={setMobileNav}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            onProfile={() => navigate("profile")}
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
        {AUTH_VIEWS.has(view) &&
          !EMAIL_VIEWS.has(view) &&
          renderAuthView(view, { navigate, showToast, reason: accessReason })}
        {VERIFICATION_VIEWS.has(view) &&
          renderVerificationView(view, { navigate, showToast })}
        {MEMBERSHIP_VIEWS.has(view) &&
          renderMembershipView(view, { navigate, showToast })}
        {RIGHTS_VIEWS.has(view) &&
          renderRightsView(view, { navigate, showToast })}
        {INGESTION_VIEWS.has(view) &&
          renderIngestionView(view, { navigate, showToast })}
        {STORAGE_VIEWS.has(view) &&
          renderStorageView(view, { navigate, showToast })}
        {WATERMARK_PREVIEW_VIEWS.has(view) &&
          renderWatermarkedPreviewView(view, {
            navigate,
            showToast,
            tracks,
            togglePlay,
            playingId,
          })}
        {QUOTE_VIEWS.has(view) &&
          renderQuoteView(view, {
            navigate,
            showToast,
            tracks,
          })}
        {CONTRACT_VIEWS.has(view) &&
          renderContractsView(view, {
            navigate,
            showToast,
            tracks,
          })}
        {PAYMENT_VIEWS.has(view) &&
          renderPaymentView(view, {
            navigate,
            showToast,
            tracks,
          })}
        {LICENCE_VIEWS.has(view) &&
          renderLicenceView(view, {
            navigate,
            showToast,
            tracks,
          })}
        {SECURE_DELIVERY_VIEWS.has(view) &&
          renderSecureDeliveryView(view, {
            navigate,
            showToast,
            tracks,
          })}
        {EXPIRING_ACCESS_VIEWS.has(view) &&
          renderExpiringAccessView(view, {
            navigate,
            showToast,
            tracks,
          })}
        {AUDIT_VIEWS.has(view) &&
          renderAuditView(view, {
            navigate,
            showToast,
          })}
        {EMAIL_VIEWS.has(view) &&
          renderEmailView(view, {
            navigate,
            showToast,
          })}
        {PERMISSIONS_VIEWS.has(view) &&
          getRouteDecision(view, auth.user, auth.ready).allowed &&
          renderPermissionsView(view, {
            navigate,
            showToast,
          })}
        {ANALYTICS_VIEWS.has(view) &&
          getRouteDecision(view, auth.user, auth.ready).allowed &&
          renderAnalyticsView(view, {
            navigate,
            showToast,
          })}
        {PRIVACY_VIEWS.has(view) &&
          getRouteDecision(view, auth.user, auth.ready).allowed &&
          renderPrivacyView(view, {
            navigate,
            showToast,
          })}
        {view === "catalog" &&
          renderSearchView("search", {
            view: "search",
            tracks,
            navigate,
            openTrack,
            playingId,
            togglePlay,
            requestLicense,
            showToast,
          })}
        {SEARCH_VIEWS.has(view) &&
          renderSearchView(view, {
            view,
            tracks,
            navigate,
            openTrack,
            playingId,
            togglePlay,
            requestLicense,
            showToast,
          })}
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
            openArtist={() => openArtistProfile(selectedTrack.artist)}
          />
        )}
        {view === "artist" && (
          <ArtistProfile
            selectedTrack={selectedTrack}
            requestLicense={requestLicense}
            openTrack={openTrack}
            playingId={playingId}
            togglePlay={togglePlay}
            savedIds={savedIds}
            saveTrack={saveTrack}
            setView={navigate}
            selectedArtistName={selectedArtistName}
          />
        )}
        {view === "legacy" && (
          <Legacy setView={navigate} openTrack={openTrack} />
        )}
        {view === "licensing" && (
          <LicensingAccess
            authUser={auth.user}
            selectedTrack={selectedTrack}
            requestSent={pageRequestSent}
            setRequestSent={setPageRequestSent}
            setView={navigate}
          />
        )}
        {view === "buyer" && (
          <BuyerDashboard
            authUser={auth.user}
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
            searchForProject={() => {
              window.localStorage.setItem(
                "beatmondo-search-project-context",
                JSON.stringify({
                  name: "Aurora Motors Campaign",
                  query: "uplifting automotive",
                  filters: {
                    usage: ["Automotive"],
                    accessTier: ["Professional", "VIP"],
                  },
                }),
              );
              navigate("search");
            }}
          />
        )}
        {view === "admin" && (
          <AdminDashboard
            authUser={auth.user}
            hasPermission={auth.hasPermission}
            showToast={showToast}
            togglePlay={togglePlay}
            playingId={playingId}
            setView={navigate}
          />
        )}
        {view === "artist-dashboard" && (
          <ArtistDashboardPage
            authUser={auth.user}
            showToast={showToast}
            setView={navigate}
          />
        )}
        {view === "content" && (
          <ContentPages
            setView={navigate}
            showToast={showToast}
            openArtistProfile={openArtistProfile}
          />
        )}
        {view === "stories" && (
          <StoriesPage
            setView={navigate}
            showToast={showToast}
            openArtistProfile={openArtistProfile}
          />
        )}
        {view === "media" && (
          <MediaEpisodesPage
            setView={navigate}
            showToast={showToast}
            openArtistProfile={openArtistProfile}
          />
        )}
        {view === "merchandise" && <MerchandisePage setView={navigate} />}
        {view === "contact" && <ContactPage setView={navigate} />}
        {view === "investor" && <InvestorOverview setView={navigate} />}
        {view === "system" && <DesignSystem />}
      </main>
      <audio
        ref={previewAudioRef}
        hidden
        preload="auto"
        playsInline
        data-track-id="15"
      >
        <source
          src="/assets/audio/previews/the-end-of-jason-todd-preview-pcm.wav"
          type="audio/wav"
        />
        <source
          src="/assets/audio/previews/the-end-of-jason-todd.m4a"
          type="audio/mp4"
        />
      </audio>
      {playerTrack && (
        <MiniPlayer
          track={playerTrack}
          playingId={playingId}
          onTogglePlay={() => togglePlay(playerTrack.id)}
          onClose={closePlayer}
          onPreviewEnd={() => {
            setPlayingId(null);
            if (streamSessionId) {
              storageService.updateSession(
                streamSessionId,
                {
                  status: "Completed",
                  lastPosition:
                    activePreviewInfo?.durationSeconds ||
                    playerTrack.previewDuration ||
                    84,
                },
                auth.user,
              );
              watermarkedPreviewService.completeSession(
                streamSessionId,
                auth.user,
                activePreviewInfo?.durationSeconds ||
                  playerTrack.previewDuration ||
                  84,
                true,
              );
            }
          }}
          audioRef={previewAudioRef}
          previewInfo={activePreviewInfo}
          sessionId={streamSessionId}
          onWatermarkCue={(position) =>
            activePreviewInfo?.watermarkedPreviewId &&
            watermarkedPreviewService.recordWatermarkCue(
              activePreviewInfo.watermarkedPreviewId,
              streamSessionId,
              auth.user,
              position,
              view,
            )
          }
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
      {toast && (
        <div
          className="toast-banner"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function SidebarNavButton({ id, view, activeNavId, setView, setMobileNav }) {
  const item = navItemMap.get(id);
  if (!item) return null;
  const [, label, Icon] = item;
  const isActive = activeNavId === id || view === id;
  return (
    <button
      key={id}
      className={isActive ? "active" : ""}
      aria-current={isActive ? "page" : undefined}
      onClick={() => {
        setView(id);
        setMobileNav(false);
      }}
    >
      <Icon size={20} weight={isActive ? "fill" : "regular"} />
      <span>{label}</span>
    </button>
  );
}

function Sidebar({ view, setView, mobileNav, setMobileNav }) {
  const { user } = useAuth();
  const activeNavId = NAV_PARENT_BY_VIEW[view] || view;
  const commercialOpenDefault = BUYER_SIDEBAR_COMMERCIAL.includes(activeNavId);
  const [commercialOpen, setCommercialOpen] = useState(commercialOpenDefault);
  useEffect(() => {
    if (commercialOpenDefault) setCommercialOpen(true);
  }, [commercialOpenDefault]);
  const visibleSections = buildSidebarSections(user)
    .map(([section, ids]) => {
      const visibleIds = ids.filter(
        (id) => getRouteDecision(id, user, true).allowed,
      );
      if (section === "Operations" && user?.role === "super_administrator")
        visibleIds.push("admin-users");
      return [section, visibleIds];
    })
    .filter(([, ids]) => ids.length);
  return (
    <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
      <button
        className="close-nav"
        onClick={() => setMobileNav(false)}
        aria-label="Close navigation"
      >
        <X size={20} />
      </button>
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
      <nav aria-label="Primary">
        {visibleSections.map(([section, ids]) => {
          const isBuyer = section === "Buyer workspace";
          const coreIds = isBuyer
            ? ids.filter((id) => !BUYER_SIDEBAR_COMMERCIAL.includes(id))
            : ids;
          const commercialIds = isBuyer
            ? ids.filter((id) => BUYER_SIDEBAR_COMMERCIAL.includes(id))
            : [];
          return (
            <div className="sidebar-section" key={section}>
              <span>{section}</span>
              {coreIds.map((id) => (
                <SidebarNavButton
                  key={id}
                  id={id}
                  view={view}
                  activeNavId={activeNavId}
                  setView={setView}
                  setMobileNav={setMobileNav}
                />
              ))}
              {commercialIds.length > 0 && (
                <div className="sidebar-subgroup">
                  <button
                    type="button"
                    className={`sidebar-subgroup-toggle ${commercialOpen || commercialOpenDefault ? "is-open" : ""}`}
                    aria-expanded={commercialOpen || commercialOpenDefault}
                    onClick={() => setCommercialOpen((open) => !open)}
                  >
                    <Certificate size={18} />
                    <span>Commercial</span>
                    <CaretDown size={14} aria-hidden="true" />
                  </button>
                  {(commercialOpen || commercialOpenDefault) &&
                    commercialIds.map((id) => (
                      <SidebarNavButton
                        key={id}
                        id={id}
                        view={view}
                        activeNavId={activeNavId}
                        setView={setView}
                        setMobileNav={setMobileNav}
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar({
  view,
  setView,
  setMobileNav,
  showNotifications,
  setShowNotifications,
  onProfile,
}) {
  const { user } = useAuth();
  const [adminTabLabel, setAdminTabLabel] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY) || "Overview";
    } catch {
      return "Overview";
    }
  });
  useEffect(() => {
    const sync = (event) => {
      const tab = event?.detail?.tab;
      if (tab) setAdminTabLabel(tab);
      else {
        try {
          setAdminTabLabel(
            sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY) || "Overview",
          );
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener(ADMIN_TAB_EVENT, sync);
    if (view === "admin") sync();
    return () => window.removeEventListener(ADMIN_TAB_EVENT, sync);
  }, [view]);
  const basePageLabel =
    navItems.find(([id]) => id === view)?.[1] ||
    navItems.find(([id]) => id === (NAV_PARENT_BY_VIEW[view] || view))?.[1] ||
    "Workspace";
  const pageLabel =
    view === "admin" ? `Admin · ${adminTabLabel}` : basePageLabel;
  const verification = user
    ? buyerVerificationService.getByUser(user.id)
    : null;
  const membership = user
    ? membershipService.getCurrentMembership(user.id)
    : null;
  const effective = user
    ? calculateEffectiveAccess(user, verification, membership)
    : null;
  const tierLabel =
    user?.userType === "internal"
      ? user.roleLabel || "Internal"
      : user?.role === "artist"
        ? user.membershipTier || user.roleLabel
        : effective?.effectivePlan ||
          user?.membershipTier ||
          user?.roleLabel ||
          "";
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileNav(true)}>
        <FadersHorizontal size={20} /> Menu
      </button>
      <div className="topbar-context">
        <span className="eyebrow">
          <span className="brand-name">beatmondo</span> private sync workspace
        </span>
        <p className="topbar-page-label" aria-live="polite">
          {pageLabel}
        </p>
      </div>
      <div className="top-actions">
        <button
          className="icon-button"
          aria-label="Open global search"
          title="Search (/)"
          onClick={() => setView("search")}
        >
          <MagnifyingGlass size={20} />
        </button>
        {user && tierLabel && (
          <span
            className={`tier-badge ${tierLabel.includes("VIP") ? "vip" : ""}`}
          >
            {tierLabel}
          </span>
        )}
        {user && (
          <button
            className="icon-button"
            aria-label="Demo Messages"
            onClick={() => setView("notifications")}
          >
            <Bell size={20} />
          </button>
        )}
        <UserMenu navigate={setView} />
      </div>
      {showNotifications && (
        <div
          className="panel notification-panel"
          role="region"
          aria-label="Notifications"
        >
          <p>
            <CheckCircle size={16} /> Quote sent for Luxury Auto Campaign
          </p>
          <p>
            <ShieldCheck size={16} /> New inquiry assigned to licensing team
          </p>
          <p>
            <DownloadSimple size={16} /> Secure WAV master ready for Premium
            Hotel Launch Film
          </p>
        </div>
      )}
    </header>
  );
}

function PublicHeader({ setView, authMode = null }) {
  const { user } = useAuth();
  return (
    <header className={`public-header ${authMode ? "auth-header" : ""}`}>
      <button
        className="public-logo"
        onClick={() => setView("home")}
        aria-label="beatmondo home"
      >
        <img src={logo} alt="beatmondo" />
      </button>
      {authMode ? (
        <>
          <div />
          <div className="public-auth-actions">
            <button
              className="plain-button auth-help-button"
              onClick={() => setView("contact")}
            >
              Help
            </button>
            <button
              className="outline-button"
              onClick={() =>
                setView(authMode === "signup" ? "login" : "signup")
              }
            >
              {authMode === "signup" ? "Log In" : "Request Access"}
            </button>
          </div>
        </>
      ) : (
        <>
          <nav>
            <button
              className="explore-action-button"
              onClick={() => setView("catalog")}
            >
              Explore Music <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button onClick={() => setView("licensing")}>Licensing</button>
            <button onClick={() => setView("legacy")}>Legacy</button>
            <button onClick={() => setView("stories")}>Stories</button>
            <button
              className="merchandise-button merchandise-button-compact"
              onClick={() => setView("merchandise")}
            >
              <ShoppingBag size={15} aria-hidden="true" /> Merchandise
            </button>
          </nav>
          <div className="public-auth-actions">
            {user ? (
              <UserMenu navigate={setView} compact />
            ) : (
              <>
                <button
                  className="plain-button"
                  onClick={() => setView("login")}
                >
                  Log In
                </button>
                <button
                  className="outline-button"
                  onClick={() => setView("register")}
                >
                  <SignIn size={18} /> Request Access
                </button>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
}

function Home({
  setView,
  setSelectedTrack,
  playingId,
  togglePlay,
  savedIds,
  saveTrack,
  requestLicense,
}) {
  return (
    <section className="home-view">
      <PublicHeader setView={setView} />
      <div className="hero">
        <HeroMedia />
        <div className="hero-copy">
          <h2>
            <span>Curated Music.</span>
            <span>Protected Rights.</span>
            <span>Premium Access.</span>
          </h2>
        </div>
      </div>

      <InvestorSummaryStrip setView={setView} />

      <ProblemSolution />

      <section className="access-tier-band">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Choose your access level</span>
            <h2>Curated access for serious sync buyers.</h2>
          </div>
          <button
            className="text-action"
            onClick={() => setView("membership-plans")}
          >
            Compare access
          </button>
        </div>
        <div className="tier-grid">
          {buyerTiers.map((tier) => (
            <AccessTierCard
              key={tier.id}
              tier={tier}
              onSelect={() => setView("membership-plans")}
            />
          ))}
        </div>
        <p className="tier-note">VIP access is individually reviewed.</p>
      </section>

      <BusinessModelSection />

      <section>
        <div className="section-kicker">
          <span className="eyebrow">Commercial use cases</span>
          <h2>Music for every premium placement.</h2>
        </div>
        <div className="image-card-grid use-cases use-cases-full">
          {useCases.map(([title, text, image]) => (
            <ImageCard
              key={title}
              title={title}
              text={text}
              image={image}
              action={() => setView("catalog")}
            />
          ))}
        </div>
      </section>

      <section className="warm-band collections-band">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Curated selections</span>
            <h2>Editorial paths into Explore Music.</h2>
          </div>
          <button
            className="text-action explore-action-button"
            onClick={() => setView("catalog")}
          >
            Explore Music <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="collection-grid">
          {collections.slice(0, 4).map(([title, text, count, tags, image]) => (
            <CollectionCard
              key={title}
              title={title}
              text={text}
              count={count}
              tags={tags}
              image={image}
              onView={() => setView("catalog")}
            />
          ))}
        </div>
      </section>

      <section className="split-section">
        <div>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Featured tracks</span>
              <h2>Preview publicly. Deliver securely.</h2>
            </div>
            <button
              className="text-action explore-action-button"
              onClick={() => setView("catalog")}
            >
              Explore Music <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="track-list compact">
            {tracks.slice(0, 4).map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isPlaying={playingId === track.id}
                saved={savedIds.includes(track.id)}
                onPlay={() => togglePlay(track.id)}
                onSave={() => saveTrack(track.id)}
                onOpen={() => {
                  setSelectedTrack(track);
                  setView("track");
                }}
                onRequest={() => requestLicense(track)}
              />
            ))}
          </div>
        </div>
        <div className="trust-panel">
          <h3>Secure licensing workflow</h3>
          <TrustItem
            icon={ShieldCheck}
            title="Rights-aware metadata"
            text="Usage, territory, term, and clearance notes stay attached to the licensing workflow."
          />
          <TrustItem
            icon={LockKey}
            title="Protected masters"
            text="WAV files and stems stay locked until approval, payment, and delivery rules are complete."
          />
          <TrustItem
            icon={UsersThree}
            title="Artist-first music"
            text="Real musicianship, provenance, and relationship-led licensing sit at the center."
          />
        </div>
      </section>

      <CompetitiveDifferentiation />

      <section className="content-preview">
        <MiniStory
          title="Gary Burke Legacy"
          text="A tasteful archive honoring the original vision and musician-led spirit behind beatmondo."
          image={img.legacyDetail}
          actionLabel="Read legacy story"
          action={() => setView("legacy")}
        />
        <MiniStory
          title="Short Sync Clips"
          text="Fast editorial clips for social discovery, Catalog Highlights, VIP Picks, and licensing conversations."
          image={img.shortSyncEdit}
          actionLabel="View clips"
          action={() => setView("stories")}
        />
        <MiniStory
          title="Media Episodes"
          text="Artist stories, studio sessions, Catalog Highlights, legacy clips, and supervisor conversations."
          image={img.mediaInterview}
          actionLabel="Watch episodes"
          action={() => setView("media")}
        />
      </section>
      <Footer setView={setView} />
    </section>
  );
}

function InvestorSummaryStrip({ setView }) {
  const cards = [
    [
      ShieldCheck,
      "Discover",
      "Music Worth Shortlisting",
      "Selected music reviewed for quality, provenance, and sync potential.",
    ],
    [
      LockKey,
      "Verify",
      "Rights You Can Trust",
      "Ownership, publishing, master, and contributor details reviewed before licensing.",
    ],
    [
      FileAudio,
      "License",
      "A Clear Path to Clearance",
      "Guided requests, quotes, approvals, and payment in one professional workflow.",
    ],
    [
      DownloadSimple,
      "Deliver",
      "Protected Files, Ready",
      "Approved WAV masters and stems delivered through controlled, secure access.",
    ],
  ];
  return (
    <section
      className="investor-summary-section"
      aria-labelledby="beatmondo-standard-title"
    >
      <div className="investor-summary-intro">
        <span className="eyebrow">
          the <span className="brand-name">beatmondo</span> standard
        </span>
        <h2 id="beatmondo-standard-title">
          From first listen to cleared delivery.
        </h2>
        <div className="investor-summary-intro-copy">
          <p>
            A trusted path through discovery, rights, licensing, and secure
            delivery for serious sync buyers.
          </p>
          <button
            className="text-action explore-action-button"
            onClick={() => setView("catalog")}
          >
            Explore Music <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="investor-summary-strip">
        {cards.map(([Icon, step, title, text], index) => (
          <article key={title} className="investor-summary-card">
            <div className="investor-summary-card-topline">
              <Icon size={30} weight="duotone" aria-hidden="true" />
              <span className="investor-summary-step">
                0{index + 1} · {step}
              </span>
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
          <ul>
            {problems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="solution-side">
          <span className="eyebrow">The solution</span>
          <h2>One connected licensing path.</h2>
          <ul>
            {solutions.map((item) => (
              <li key={item}>
                <CheckCircle size={16} weight="fill" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function BusinessModelSection() {
  const models = [
    [
      FileAudio,
      "Licensing Revenue",
      "Revenue generated through approved sync licenses across film, television, advertising, streaming, and premium brand placements.",
    ],
    [
      LockKey,
      "Premium Access",
      "Professional and VIP access opportunities that create recurring revenue from serious commercial buyers.",
    ],
    [
      ShieldCheck,
      "Exclusive Licensing",
      "Higher-value category, territory, or full exclusivity licensing for premium commercial use cases.",
    ],
    [
      UsersThree,
      "Catalog Partnerships",
      "Strategic relationships with artists, estates, publishers, and rights holders that expand the platform catalog.",
    ],
    [
      Sparkle,
      "Premium Services",
      "Curated recommendations, priority review, rights support, and custom commercial pathways for high-value buyers.",
    ],
  ];
  return (
    <section className="business-model-band">
      <div className="section-kicker">
        <span className="eyebrow">
          How <span className="brand-name">beatmondo</span> generates revenue
        </span>
        <h2>Multiple Revenue Pathways</h2>
      </div>
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
    [
      "Curated",
      "not open",
      "Every artist, track, and catalog is reviewed and selected — not self-uploaded.",
    ],
    [
      "Professional",
      "not mass-market",
      "Built for music supervisors, studios, agencies, and premium brands — not casual creators.",
    ],
    [
      "Rights-aware",
      "not discovery-only",
      "Rights, ownership, and clearance data are part of the discovery and licensing experience.",
    ],
    [
      "Protected masters",
      "not public downloads",
      "WAV masters and stems are delivered only after approval, payment, or VIP terms.",
    ],
    [
      "High-touch",
      "not transactional",
      "Concierge review, curated selections, and relationship-led licensing for serious buyers.",
    ],
    [
      "Catalog intelligence",
      "not simple hosting",
      "Usage data, demand signals, and licensing activity create long-term catalog value.",
    ],
  ];
  return (
    <section className="differentiation-band">
      <div className="section-kicker">
        <span className="eyebrow">Competitive advantage</span>
        <h2>Why beatmondo is different</h2>
      </div>
      <div className="differentiation-grid" role="list">
        {points.map(([strength, contrast, text], index) => (
          <article
            key={strength}
            className="differentiation-card"
            role="listitem"
          >
            <span className="differentiation-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3>
              <strong>{strength}</strong>
              <span>, {contrast}</span>
            </h3>
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
      { threshold: 0.45 },
    );

    observer.observe(video);
    playVideo();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="hero-media">
      <img className="hero-video-fallback" src={heroPoster} alt="" />
      {!videoFailed && (
        <video
          ref={videoRef}
          src={heroVideo}
          poster={heroPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
        />
      )}
    </div>
  );
}

function UseCasesPage({ setView }) {
  const openUseCase = (title) => {
    const usageHints = {
      Film: "Film / TV",
      Television: "Film / TV",
      "OTT & Streaming": "Film / TV",
      Advertising: "Advertising",
      Trailers: "Trailer / Promo",
      "Branded Content": "Advertising",
      Documentaries: "Documentary",
      Games: "Game",
    };
    const usage = usageHints[title] || title;
    window.localStorage.setItem(
      "beatmondo-search-project-context",
      JSON.stringify({
        name: title,
        query: title,
        filters: { usage: [usage] },
      }),
    );
    window.sessionStorage.setItem(
      "beatmondo-focus-global-search",
      "true",
    );
    setView("search");
  };
  return (
    <section className="use-cases-page">
      <div className="page-intro">
        <span className="eyebrow">Music for global sync opportunities</span>
        <h2>Explore music by placement and market.</h2>
        <p>
          Start with the work you are making, then move into curated previews,
          rights context, and the appropriate licensing path.
        </p>
      </div>
      <div className="image-card-grid use-cases-directory">
        {useCases.map(([title, text, image]) => (
          <ImageCard
            key={title}
            title={title}
            text={text}
            image={image}
            action={() => openUseCase(title)}
          />
        ))}
      </div>
      <div className="page-cta">
        <div>
          <span className="eyebrow">Need a private selection?</span>
          <h3>Tell us about the brief and deadline.</h3>
        </div>
        <button
          className="gold-button"
          onClick={() => {
            window.sessionStorage.setItem(
              "beatmondo-licensing-mode",
              "access",
            );
            setView("licensing");
          }}
        >
          Request Access
        </button>
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
  const title = isSignup
    ? "Request your beatmondo workspace."
    : isForgot
      ? "Reset your password."
      : "Welcome back.";
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
      setAuthError(
        "This demo account is locked. Contact buyer support or request an access review.",
      );
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      showToast(
        isForgot
          ? "Password reset link simulated."
          : isSignup
            ? "Access request account created."
            : "Signed in to the demo workspace.",
      );
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
          <p>
            Return to curated music, verified rights, licensing requests, and
            secure delivery.
          </p>
          <ul>
            <li>
              <ShieldCheck size={18} /> Rights-aware metadata
            </li>
            <li>
              <BookmarkSimple size={18} /> Private projects and selections
            </li>
            <li>
              <LockKey size={18} /> Protected master audio delivery
            </li>
          </ul>
        </aside>
        <div className="auth-card">
          <span className="eyebrow">
            {isForgot
              ? "Account recovery"
              : isSignup
                ? "New buyer account"
                : "Approved buyer login"}
          </span>
          <h2>{title}</h2>
          <p>{description}</p>

          {!isForgot && (
            <>
              <div className="social-auth-grid">
                <button
                  className="social-provider google"
                  type="button"
                  onClick={() => socialLogin("Google")}
                >
                  <img src="/assets/auth/google-g.png" alt="" />
                  Continue with Google
                </button>
                <button
                  className="social-provider apple"
                  type="button"
                  onClick={() => socialLogin("Apple")}
                >
                  <img src="/assets/auth/apple-logo.svg" alt="" />
                  Continue with Apple
                </button>
                <button
                  className="social-provider microsoft"
                  type="button"
                  onClick={() => socialLogin("Microsoft")}
                >
                  <img src="/assets/auth/microsoft-symbol.svg" alt="" />
                  Continue with Microsoft
                </button>
              </div>
              <div className="auth-divider">
                <span>or continue with email</span>
              </div>
            </>
          )}

          <form onSubmit={submit}>
            {isSignup && (
              <div className="auth-two-col">
                <label>
                  First name
                  <input required autoComplete="given-name" />
                </label>
                <label>
                  Last name
                  <input required autoComplete="family-name" />
                </label>
              </div>
            )}
            {isSignup && (
              <label>
                Company
                <input required autoComplete="organization" />
              </label>
            )}
            <label>
              Work email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                aria-describedby={authError ? "auth-error" : undefined}
              />
            </label>
            {!isForgot && (
              <label>
                Password
                <span className="password-field">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    aria-describedby={authError ? "auth-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
            )}
            {isSignup && (
              <label className="auth-consent">
                <input type="checkbox" required /> I agree to buyer verification
                and access review.
              </label>
            )}
            {!isSignup && !isForgot && (
              <div className="auth-utilities">
                <label className="auth-consent">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />{" "}
                  Remember me
                </label>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setView("forgot")}
                >
                  Forgot password?
                </button>
              </div>
            )}
            {authError && (
              <div id="auth-error" className="auth-error" role="alert">
                <ShieldCheck size={18} /> {authError}
              </div>
            )}
            <button
              className={`gold-button auth-submit ${submitting ? "is-loading" : ""} ${submitted ? "is-success" : ""}`}
              type="submit"
              disabled={submitted || submitting}
              aria-busy={submitting}
            >
              {submitting
                ? "Signing in…"
                : submitted
                  ? "Submitted"
                  : isForgot
                    ? "Send reset link"
                    : isSignup
                      ? "Create account request"
                      : "Log In"}
            </button>
            {!isForgot && (
              <p className="auth-reassurance">
                <LockKey size={15} /> Authentication is simulated in this
                prototype.{" "}
                <button type="button" onClick={() => setView("contact")}>
                  Contact buyer support
                </button>
                .
              </p>
            )}
          </form>

          {(isForgot || isSignup) && (
            <div className="auth-switch">
              {isForgot ? (
                <button onClick={() => setView("login")}>
                  Return to Log In
                </button>
              ) : (
                <span>
                  Already have access?{" "}
                  <button onClick={() => setView("login")}>Log In</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* Legacy Catalog UI removed — Explore Music uses SearchExperience via #catalog. */

function TrackRow({
  track,
  isSelected,
  isPlaying,
  saved,
  onPlay,
  onSave,
  onOpen,
  onRequest,
  onSelect = () => {},
}) {
  return (
    <article
      className={`track-row ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <button
        className="play-button sound-ring-button"
        onClick={(event) => {
          event.stopPropagation();
          onPlay();
        }}
        aria-label={isPlaying ? "Pause preview" : "Play preview"}
      >
        {isPlaying ? (
          <Pause size={18} weight="fill" />
        ) : (
          <Play size={18} weight="fill" />
        )}
      </button>
      <div
        className="cover-art"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.45)), url(${track.image})`,
        }}
      />
      <div className="track-title">
        <strong>
          {track.title}
          {track.vipOnly && <span className="vip-mini">VIP</span>}
        </strong>
        <small>
          {track.artist} · {track.genre} · {track.bpm}
        </small>
        <div>
          {track.tags.slice(0, 2).map((tag) => (
            <em key={tag}>{tag}</em>
          ))}
          {track.assets.stems && <em>Stems</em>}
        </div>
      </div>
      <div
        className="status-stack"
        aria-label={`${track.availability}, ${getRightsStatus(track)}, ${getDeliveryStatus(track)}`}
      >
        <span className="status-availability">{track.availability}</span>
        <span>{getRightsStatus(track)}</span>
        <span>{getDeliveryStatus(track)}</span>
      </div>
      <div className="waveform" aria-hidden="true" />
      <span
        className="duration"
        aria-label={`${track.previewSrc ? "Preview" : "Full track"} duration ${getPlayableDuration(track)}`}
      >
        {getPlayableDuration(track)}
      </span>
      <button
        className={`heart save-motion-button ${saved ? "saved" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onSave();
        }}
        aria-label="Save track"
      >
        <Heart size={20} weight={saved ? "fill" : "regular"} />
      </button>
      <button
        className="small-button license-action-button"
        disabled={track.editorialAudioExtract}
        aria-disabled={track.editorialAudioExtract || undefined}
        onClick={(event) => {
          event.stopPropagation();
          onRequest();
        }}
      >
        {track.editorialAudioExtract ? "Rights Review" : "Request License"}
      </button>
      <button
        className="icon-button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        aria-label="View details"
      >
        <Eye size={18} />
      </button>
    </article>
  );
}

function TrackCard({
  track,
  isPlaying,
  saved,
  onPlay,
  onSave,
  onOpen,
  onRequest,
}) {
  return (
    <article className="track-card">
      <div
        className="track-card-art"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.55)), url(${track.image})`,
        }}
      >
        <button
          className="sound-ring-button"
          onClick={onPlay}
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
        >
          {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
        </button>
      </div>
      <div>
        <h3>
          {track.title} {track.vipOnly && <span className="vip-mini">VIP</span>}
        </h3>
        <p>
          {track.artist} · {track.genre} · {track.sceneFit}
        </p>
      </div>
      <div className="waveform" />
      <div className="tag-row">
        {track.tags.slice(0, 2).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
        <span>
          {track.previewSrc
            ? `Preview ${getPlayableDuration(track)}`
            : track.duration}
        </span>
      </div>
      <div className="button-row">
        <button
          className={`heart save-motion-button ${saved ? "saved" : ""}`}
          onClick={onSave}
        >
          <Heart weight={saved ? "fill" : "regular"} />
        </button>
        <button className="outline-button" onClick={onOpen}>
          Details
        </button>
        <button
          className="gold-button license-action-button"
          disabled={track.editorialAudioExtract}
          aria-disabled={track.editorialAudioExtract || undefined}
          onClick={onRequest}
        >
          {track.editorialAudioExtract ? "Rights Review" : "Request License"}
        </button>
      </div>
    </article>
  );
}

function TrackSidePanel({ track, requestLicense, playingId, onTogglePlay }) {
  const isPlaying = playingId === track.id;
  return (
    <aside className="detail-rail">
      <div
        className="preview-card"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.72)), url(${track.image})`,
        }}
      >
        <span>Preview Only</span>
        <button
          className="sound-ring-button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
        >
          {isPlaying ? (
            <Pause size={34} weight="fill" />
          ) : (
            <Play size={34} weight="fill" />
          )}
        </button>
      </div>
      <h2>{track.title}</h2>
      <p>
        {track.artist} · {track.genre} · {track.usage}
      </p>
      <div className="tag-row">
        {track.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="meta-grid">
        <span>
          <Clock size={16} /> Preview {getPlayableDuration(track)}
        </span>
        <span>
          {track.editorialAudioExtract
            ? `Source montage ${track.duration}`
            : `Full track ${track.duration}`}
        </span>
        <span>
          <MusicNote size={16} /> {track.bpm}
        </span>
        <span>{track.key}</span>
      </div>
      <AssetBadges track={track} compact />
      <div className="rights-list">
        <h3>Rights & licensing</h3>
        <p>Preview Only</p>
        <p>Protected master audio</p>
        <p>
          {track.assets.wavMaster
            ? "WAV available after approval"
            : "WAV pending rights check"}
        </p>
        <p>
          {track.rightsData.rightsVerified
            ? "Ownership verified"
            : "Rights check needed"}
        </p>
      </div>
      <button
        className={`gold-button full license-action-button ${track.vipOnly ? "vip-access-button" : ""}`}
        disabled={track.editorialAudioExtract}
        aria-disabled={track.editorialAudioExtract || undefined}
        onClick={() => requestLicense(track)}
      >
        <span className="motion-button-label">
          <ShieldCheck size={18} />{" "}
          {track.editorialAudioExtract
            ? "Rights Review"
            : track.vipOnly
              ? "Fast-Track License"
              : "Request License"}
        </span>
        {track.vipOnly && (
          <span className="vip-acoustic-ripple" aria-hidden="true" />
        )}
      </button>
      <div className="locked-box">
        <LockKey size={28} /> Secure Delivery{" "}
        <small>Protected master audio is delivered only after approval.</small>
      </div>
    </aside>
  );
}

function TrackDetail({
  track,
  playingId,
  togglePlay,
  saved,
  saveTrack,
  requestLicense,
  openTrack,
  openArtist,
}) {
  const { user } = useAuth();
  const rightsSummary = rightsService.getBuyerSummary(track.id);
  const similarTracks = searchService
    .getSimilarTracks(tracks, track.id, user)
    .map((document) => document.source);
  const masterAllowed =
    !rightsSummary || rightsSummary.allowedAssets.includes("Master");
  const stemsAllowed =
    !rightsSummary || rightsSummary.allowedAssets.includes("Stems");
  const rightsBlocked =
    track.editorialAudioExtract || (rightsSummary && !rightsSummary.licensable);
  const assetsList = [
    ["Preview", track.assets.preview, "Public-limited preview"],
    [
      "WAV Master",
      track.assets.wavMaster && masterAllowed,
      "Uncompressed master file",
    ],
    [
      "Instrumental",
      track.assets.instrumental && masterAllowed,
      "No lead vocal mix",
    ],
    ["Vocal Version", track.assets.vocal && stemsAllowed, "Vocal only stems"],
    [
      "Alternate Mix",
      track.assets.alternateMixes && masterAllowed,
      "Alternative arrangement",
    ],
    [
      "Drum Stem",
      track.assets.drumStem && stemsAllowed,
      "Isolated percussion tracks",
    ],
    [
      "Bass Stem",
      track.assets.bassStem && stemsAllowed,
      "Isolated bassline tracks",
    ],
    [
      "Guitar Stem",
      track.assets.guitarStem && stemsAllowed,
      "Isolated guitar tracks",
    ],
    [
      "Keyboard Stem",
      track.assets.keysStem && stemsAllowed,
      "Isolated keys/piano tracks",
    ],
    [
      "Percussion Stem",
      track.assets.percStem && stemsAllowed,
      "Isolated auxiliary percussion",
    ],
    [
      "Additional Stems",
      track.assets.stems && stemsAllowed,
      "All other individual instrument tracks",
    ],
  ];

  return (
    <section className="detail-page">
      <div className="detail-hero">
        <div>
          <div className="detail-header-badges">
            <span
              className={`value-signal-badge ${track.valueSignal.toLowerCase().replace(" ", "-")}`}
            >
              {track.valueSignal}
            </span>
            {track.vipOnly && <span className="tier-badge vip">VIP Only</span>}
          </div>
          <h2>{track.title}</h2>
          <p className="detail-sub">
            <button className="artist-inline-link" onClick={openArtist}>
              {track.artist}
            </button>{" "}
            · {track.genre} · {track.era}
          </p>
          <div className="button-row">
            <button
              className="gold-button sound-ring-button"
              onClick={() => togglePlay(track.id)}
            >
              {playingId === track.id ? (
                <Pause size={18} weight="fill" />
              ) : (
                <Play size={18} weight="fill" />
              )}{" "}
              Preview Track
            </button>
            <button
              className={`outline-button save-motion-button ${saved ? "saved" : ""}`}
              onClick={() => saveTrack(track.id)}
            >
              <Heart size={18} weight={saved ? "fill" : "regular"} />{" "}
              {saved ? "Saved to Project" : "Save to Project"}
            </button>
            {rightsBlocked ? (
              <div className="rights-blocked-actions">
                <button
                  className="gold-button license-action-button"
                  type="button"
                  disabled
                  aria-disabled="true"
                >
                  <LockKey size={18} /> Rights Review Required
                </button>
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => {
                    window.sessionStorage.setItem(
                      "beatmondo-contact-intent",
                      "concierge-clearance",
                    );
                    window.location.hash = "contact";
                  }}
                >
                  Talk to concierge
                </button>
                <div className="rights-blocked-secondary">
                  <button
                    className="text-action"
                    type="button"
                    onClick={() => openArtist()}
                  >
                    View artist & rights context
                  </button>
                  <button
                    className="text-action"
                    type="button"
                    onClick={() => {
                      try {
                        const key = "beatmondo-clearance-watchlist";
                        const prev = JSON.parse(
                          window.localStorage.getItem(key) || "[]",
                        );
                        const next = prev.includes(track.id)
                          ? prev
                          : [...prev, track.id];
                        window.localStorage.setItem(key, JSON.stringify(next));
                      } catch {
                        /* ignore */
                      }
                      window.dispatchEvent(
                        new CustomEvent("beatmondo-toast", {
                          detail:
                            "Saved interest. Licensing will follow up when this track becomes clearable.",
                        }),
                      );
                    }}
                  >
                    Notify when clearable
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="gold-button license-action-button"
                onClick={() => requestLicense(track)}
              >
                <LockKey size={18} />{" "}
                {track.vipOnly ? "Fast-Track License" : "Request License"}
              </button>
            )}
          </div>
          {rightsBlocked && (rightsSummary?.wording || track.rights) && (
            <p className="rights-blocked-note" role="status">
              {rightsSummary?.wording || track.rights}
            </p>
          )}
          <WatermarkNotice trackId={track.id} />
        </div>
        <div
          className="detail-image"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.55)), url(${track.image})`,
          }}
        />
      </div>

      <div
        className="large-player compact-preview-band"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(17,15,12,.92), rgba(17,15,12,.55)), url(${track.image})`,
        }}
      >
        <div className="player-top">
          <strong>Protected preview</strong>
          <span>
            {getPlayableDuration(track)} preview ·{" "}
            {track.editorialAudioExtract
              ? "Complete teaser montage audio · Source WAV is not a licensable master"
              : `Full track ${track.duration} · WAV after approval`}
          </span>
        </div>
        <div className="compact-preview-actions">
          <button
            className="gold-button sound-ring-button"
            type="button"
            onClick={() => togglePlay(track.id)}
          >
            {playingId === track.id ? (
              <Pause size={18} weight="fill" />
            ) : (
              <Play size={18} weight="fill" />
            )}{" "}
            {playingId === track.id ? "Pause" : "Play preview"}
          </button>
          <span className="preview-band-note">
            {track.editorialAudioExtract
              ? "Protected editorial listening only; individual recordings and licensing authority remain under review."
              : "Master audio stays locked until clearance and delivery terms are complete."}
          </span>
        </div>
      </div>

      <div className="detail-grid-three">
        <Panel title="Track Information" action="Metadata Summary">
          <dl className="definition-grid">
            <dt>Title</dt>
            <dd>{track.title}</dd>
            <dt>Artist</dt>
            <dd>{track.artist}</dd>
            <dt>Album</dt>
            <dd>
              {track.editorialAudioExtract
                ? "2022 Teaser Video · Promotional montage"
                : `${track.artist} – ${track.title} (Single)`}
            </dd>
            <dt>Genre</dt>
            <dd>
              {track.genre} · {track.subgenre}
            </dd>
            <dt>Mood</dt>
            <dd>{track.mood}</dd>
            <dt>Energy</dt>
            <dd>{track.energy}</dd>
            <dt>BPM</dt>
            <dd>{track.bpm}</dd>
            <dt>
              {track.editorialAudioExtract
                ? "Source montage duration"
                : "Full track duration"}
            </dt>
            <dd>{track.duration}</dd>
            <dt>Protected preview</dt>
            <dd>{getPlayableDuration(track)}</dd>
            <dt>Vocal Type</dt>
            <dd>{track.vocal}</dd>
            <dt>Era</dt>
            <dd>{track.era}</dd>
            <dt>Instrumentation</dt>
            <dd className="instr-desc">{track.instrumentation}</dd>
          </dl>
        </Panel>

        <Panel title="Rights & Ownership" action={getRightsStatus(track)}>
          <BuyerRightsSummary trackId={track.id} compact />
        </Panel>

        <Panel title="Commercial & Assets" action="Clearance Path">
          <div className="commercial-info-box">
            <h4>Commercial Information</h4>
            <dl className="definition-grid">
              <dt>Pricing Model</dt>
              <dd>{track.commercial.pricingType}</dd>
              <dt>Price Range</dt>
              <dd>{track.commercial.priceRange}</dd>
              <dt>Clearance State</dt>
              <dd>
                {track.commercial.rightsReviewRequired
                  ? "Rights Review Required"
                  : "Eligible for Fast-Track"}
              </dd>
            </dl>
          </div>

          <div className="assets-status-section">
            <h4>Available Assets</h4>
            <div className="asset-detail-badges">
              {assetsList.map(([label, ready, desc]) => (
                <span
                  key={label}
                  className={`asset-status-pill ${ready ? "unlocked" : "locked"}`}
                  title={desc}
                >
                  <LockKey size={12} />
                  <strong>{label}</strong>
                  <small>{ready ? "Ready" : "Locked"}</small>
                </span>
              ))}
            </div>
            <p className="muted-note">
              WAV master files, stems, vocals, instrumentals, alternate mixes,
              and loops remain encrypted and locked. Access keys are issued
              automatically upon license approval, payment, or VIP agreement
              terms.
            </p>
          </div>
        </Panel>
      </div>

      <div className="detail-grid">
        <Panel title="Sync Details & Placement Fit" action="Stewardship">
          <p>{track.rights}</p>
          <div className="placement-fit-callout">
            <strong>Optimal Scene Fit:</strong> <span>{track.sceneFit}</span>
          </div>
          <div className="locked-box">
            <LockKey size={24} /> Protected Master Audio{" "}
            <small>
              Encrypted master asset delivery, validation hashing, and
              transaction auditing are configured for this track.
            </small>
          </div>
        </Panel>
      </div>

      <section>
        <h3>Similar tracks</h3>
        <div className="track-list compact">
          {similarTracks.slice(0, 6).map((item) => (
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

function ArtistProfile({
  selectedTrack,
  selectedArtistName,
  requestLicense,
  openTrack,
  playingId,
  togglePlay,
  savedIds,
  saveTrack,
  setView,
}) {
  const artist =
    artists.find(
      (item) => item.name === (selectedArtistName || selectedTrack.artist),
    ) || artists[0];
  const artistTracks = tracks.filter((track) => track.artist === artist.name);
  const featuredTrack =
    tracks.find((track) => track.id === artist.featureTrackId) ||
    artistTracks[0] ||
    selectedTrack;

  if (artist.name === "The Slambovian Circus of Dreams") {
    return (
      <section className="artist-page slambovian-artist-page">
        <div
          className="slambovian-artist-hero"
          style={{ backgroundImage: `url(${artist.heroImage})` }}
        >
          <div className="slambovian-hero-scrim" aria-hidden="true" />
          <div className="slambovian-hero-content">
            <span className="eyebrow">Artist profile · Editorial spotlight</span>
            <h2>The Slambovian Circus of Dreams</h2>
            <p>
              {artist.credit}. A strong editorial introduction while individual
              track rights and licensing authority remain under review.
            </p>
            <div className="slambovian-status-row" aria-label="Artist status">
              <span>2022 teaser</span>
              <span>Archival promotional media</span>
              <span>1 protected audio extract</span>
            </div>
            <div className="button-row">
              <button
                className="gold-button sound-ring-button"
                onClick={() =>
                  document
                    .getElementById("slambovian-feature-media")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <Play size={18} weight="fill" /> Watch Artist Story
              </button>
              <button
                className="outline-button explore-action-button"
                onClick={() => setView("catalog")}
              >
                Explore Music <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                className="merchandise-button"
                onClick={() => setView("merchandise")}
              >
                <ShoppingBag size={18} /> Merchandise
              </button>
            </div>
          </div>
        </div>

        <div className="slambovian-profile-grid">
          <Panel title="Sync character" action="Editorial assessment">
            <p>
              The teaser suggests a theatrical psychedelic-Americana world with
              eccentric character, strong live presence, and audience-facing
              energy. This is creative positioning, not track-level metadata.
            </p>
            <div className="slambovian-fit-list">
              <span>Outsider stories</span>
              <span>Strange journeys</span>
              <span>Festival scenes</span>
              <span>Wonder with an edge</span>
              <span>Character-led indie</span>
            </div>
          </Panel>
          <Panel title="Publication boundary" action="Rights-aware">
            <p>
              The supplied teaser may be presented as archival promotional
              media. It does not verify ownership, publishing, samples,
              performers, quoted endorsements, or authority to license any song
              heard in the edit.
            </p>
            <div className="rights-review-callout">
              <LockKey size={18} /> Editorial feature available · Track
              licensing remains locked
            </div>
          </Panel>
        </div>

        <section
          id="slambovian-feature-media"
          className="slambovian-feature-media"
          aria-labelledby="slambovian-feature-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Media Episode · 1 min 59 sec</span>
              <h2 id="slambovian-feature-title">2022 Teaser Video</h2>
            </div>
            <span className="slambovian-media-badge">Archival promotional media</span>
          </div>
          <video
            controls
            playsInline
            preload="metadata"
            poster={artist.image}
            aria-label="The Slambovian Circus of Dreams 2022 teaser video"
          >
            <source src={artist.media.teaser} type="video/mp4" />
            <track
              kind="captions"
              src={artist.media.teaserCaptions}
              srcLang="en"
              label="English"
              default
            />
          </video>
          <div className="slambovian-media-notes">
            <span><strong>Source:</strong> supplied 2022 promotional teaser</span>
            <span><strong>Format:</strong> optimized 720p H.264 web media</span>
            <span><strong>Accessibility:</strong> reviewed descriptive captions</span>
          </div>
        </section>

        <section
          className="slambovian-audio-listing"
          aria-labelledby="slambovian-audio-listing-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Protected editorial listening</span>
              <h2 id="slambovian-audio-listing-title">
                Complete teaser audio extract
              </h2>
            </div>
            <button
              className="text-action"
              onClick={() => openTrack(featuredTrack)}
            >
              View audio details <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <TrackRow
            track={featuredTrack}
            isSelected
            isPlaying={playingId === featuredTrack.id}
            saved={savedIds.includes(featuredTrack.id)}
            onPlay={() => togglePlay(featuredTrack.id)}
            onSave={() => saveTrack(featuredTrack.id)}
            onOpen={() => openTrack(featuredTrack)}
            onRequest={() => requestLicense(featuredTrack)}
          />
          <p className="slambovian-audio-note">
            This 1:59 WAV is derived from the supplied promotional video. It is
            not represented as a song master, and its component recordings
            remain unavailable for licensing until separately identified and
            cleared.
          </p>
        </section>

        <section className="slambovian-story-grid" aria-label="Artist context">
          <article className="slambovian-story-card">
            <img
              src={artist.archiveImage}
              alt="The band presented in a whimsical illustrated scene from the supplied teaser"
            />
            <div>
              <span className="eyebrow">Visual identity</span>
              <h3>A world as distinctive as the performance.</h3>
              <p>
                Kaleidoscopic and theatrical imagery gives the band immediate
                recall. On beatmondo it is treated as archival character, with
                live photography carrying the primary premium presentation.
              </p>
            </div>
          </article>
          <article className="slambovian-story-card slambovian-short-card">
            <video
              controls
              playsInline
              preload="metadata"
              poster={artist.image}
              aria-label="Thirty-second Slambovian short sync clip"
            >
              <source src={artist.media.shortClip} type="video/mp4" />
              <track
                kind="captions"
                src={artist.media.shortClipCaptions}
                srcLang="en"
                label="English"
                default
              />
            </video>
            <div>
              <span className="eyebrow">Short Sync Clip · 30 sec</span>
              <h3>A faster route into the live identity.</h3>
              <p>
                A continuous performance excerpt framed for high-intent
                discovery. It remains editorial media and is not a protected
                music preview or delivery asset.
              </p>
            </div>
          </article>
        </section>

        <section className="slambovian-readiness">
          <div>
            <span className="eyebrow">Catalog readiness</span>
            <h2>Publish the story now. Clear each track before licensing.</h2>
            <p>
              No song title has been inferred from the montage. The clearly
              labelled teaser audio extract can support protected editorial
              discovery, while separately supplied recordings still require
              verified titles, credits, ownership, publishing, restrictions,
              and approved preview assets.
            </p>
          </div>
          <ol>
            <li><CheckCircle size={18} /> Editorial identity and teaser reviewed</li>
            <li><WarningCircle size={18} /> Video, likeness, animation, and quotation permissions required</li>
            <li><WarningCircle size={18} /> Track titles, masters, writers, publishers, and splits required</li>
            <li><WarningCircle size={18} /> Samples, featured performers, restrictions, and territories required</li>
            <li><WarningCircle size={18} /> Instrumentals, stems, clean versions, and edit points to be declared</li>
          </ol>
        </section>

        <div className="slambovian-profile-footer">
          <div>
            <span className="eyebrow">Explore Music</span>
            <h3>One protected teaser extract is listed for discovery.</h3>
            <p>
              It remains clearly separated from licensable song recordings and
              protected master delivery.
            </p>
          </div>
          <button
            className="outline-button explore-action-button"
            onClick={() => setView("catalog")}
          >
            Explore Music <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    );
  }

  if (artist.name === "The SMYRK") {
    return (
      <section className="artist-page smyrk-artist-page">
        <div
          className="smyrk-artist-hero"
          style={{ backgroundImage: `url(${artist.heroImage})` }}
        >
          <div className="smyrk-hero-scrim" aria-hidden="true" />
          <div className="smyrk-hero-content">
            <span className="eyebrow">Artist profile · Archive discovery</span>
            <h2>The SMYRK</h2>
            <p>
              {artist.credit}. Built for scenes that need pressure, release, and
              a decisive final lift.
            </p>
            <div
              className="smyrk-status-row"
              aria-label="Artist catalog status"
            >
              <span>1 located master</span>
              <span>2009 recording</span>
              <span>Rights review active</span>
            </div>
            <div className="button-row">
              <button
                className="gold-button sound-ring-button"
                onClick={() => togglePlay(featuredTrack.id)}
              >
                {playingId === featuredTrack.id ? (
                  <Pause size={18} weight="fill" />
                ) : (
                  <Play size={18} weight="fill" />
                )}{" "}
                Preview Track
              </button>
              <button
                className="outline-button"
                onClick={() => openTrack(featuredTrack)}
              >
                <FileAudio size={18} /> Track Details
              </button>
              <button
                className="gold-button license-action-button"
                onClick={() => requestLicense(featuredTrack)}
              >
                <ShieldCheck size={18} /> Request License
              </button>
              <button
                className="merchandise-button"
                onClick={() => setView("merchandise")}
              >
                <ShoppingBag size={18} /> Merchandise
              </button>
            </div>
          </div>
        </div>

        <div className="smyrk-profile-grid">
          <Panel
            title="Sync character"
            action="Placement intelligence"
            className="smyrk-sync-panel"
          >
            <p>
              Dark, low-frequency-forward alternative rock with a fast pulse,
              halftime weight, and a pronounced breakdown-to-climax arc.
            </p>
            <div className="smyrk-fit-list">
              <span>Antihero drama</span>
              <span>Confrontation</span>
              <span>Action aftermath</span>
              <span>Escalating montage</span>
            </div>
          </Panel>
          <Panel
            title="Rights & provenance"
            action="Documentation review"
            className="smyrk-rights-panel"
          >
            <p>
              The original stereo master is preserved with Pro Tools Broadcast
              Wave metadata dated August 2009. Publishing, splits, personnel,
              and commercial clearance are not represented as verified.
            </p>
            <div className="rights-review-callout">
              <LockKey size={18} /> Quote Required · Protected delivery remains
              locked
            </div>
          </Panel>
        </div>

        <section
          className="smyrk-featured-track"
          aria-labelledby="smyrk-featured-track-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">Featured master</span>
              <h2 id="smyrk-featured-track-title">The End of Jason Todd</h2>
            </div>
            <button
              className="text-action"
              onClick={() => openTrack(featuredTrack)}
            >
              Open track details <ArrowRight size={16} />
            </button>
          </div>
          <TrackRow
            track={featuredTrack}
            isSelected
            isPlaying={playingId === featuredTrack.id}
            saved={savedIds.includes(featuredTrack.id)}
            onPlay={() => togglePlay(featuredTrack.id)}
            onSave={() => saveTrack(featuredTrack.id)}
            onOpen={() => openTrack(featuredTrack)}
            onRequest={() => requestLicense(featuredTrack)}
          />
          <div
            className="smyrk-cue-map"
            aria-label="Track structure and edit points"
          >
            <span>
              <strong>1:18</strong> Preview opens
            </span>
            <span>
              <strong>1:45</strong> Breakdown
            </span>
            <span>
              <strong>2:13</strong> Full-band return
            </span>
            <span>
              <strong>2:20</strong> Final lift
            </span>
          </div>
        </section>

        <section
          className="smyrk-story-grid"
          aria-label="The SMYRK artist story and live archive"
        >
          <article className="smyrk-story-card smyrk-portrait-story">
            <img
              src={artist.portraitImage}
              alt="Ari and D in a studio portrait, one wearing a red masked costume"
            />
            <div>
              <span className="eyebrow">Artist context</span>
              <h3>Personality with live-band intent.</h3>
              <p>
                The supplied photography identifies Ari and D. Full personnel,
                composition, and performance credits remain intentionally
                unlisted until verified.
              </p>
            </div>
          </article>
          <article className="smyrk-story-card smyrk-live-story">
            <img
              src={artist.liveImage}
              alt="The SMYRK performing live with vocals, guitars, bass, and drums"
            />
            <div>
              <span className="eyebrow">Live archive</span>
              <h3>Performance provenance.</h3>
              <p>
                The live image anchors the recording in a real band context
                while the protected master supplies the sync-ready listening
                experience.
              </p>
            </div>
          </article>
        </section>

        <div className="smyrk-profile-footer">
          <div>
            <span className="eyebrow">Catalog stewardship</span>
            <h3>Clear the story before releasing the master.</h3>
            <p>
              Discovery and protected preview are available now. Licensing, WAV
              delivery, and any derivative assets remain gated behind
              documentation review.
            </p>
          </div>
          <button
            className="gold-button license-action-button"
            onClick={() => requestLicense(featuredTrack)}
          >
            <ShieldCheck size={18} /> Request License
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="artist-page">
      <div className="artist-hero">
        <div
          className="portrait"
          style={{ backgroundImage: `url(${artist.image})` }}
        />
        <div>
          <span className="eyebrow">Artist profile</span>
          <h2>{artist.name}</h2>
          <p>
            A musician-founded composer project blending warm piano, cinematic
            restraint, and live-band provenance for film, television, and brand
            storytelling.
          </p>
          <div className="button-row">
            <button
              className="gold-button license-action-button"
              onClick={() => requestLicense(featuredTrack)}
            >
              <ShieldCheck size={18} /> Request License
            </button>
            <button
              className="outline-button"
              onClick={() => setView("stories")}
            >
              <Article size={18} /> Editorial Story
            </button>
            <button
              className="merchandise-button"
              onClick={() => setView("merchandise")}
            >
              <ShoppingBag size={18} /> Merchandise
            </button>
          </div>
        </div>
      </div>
      <div className="editorial-band two-col">
        <Panel title="Editorial story" action="Human context">
          <p>
            Lennox writes with the restraint of a film editor: space for
            dialogue, room for memory, and enough melodic gravity to carry a
            scene without crowding it.
          </p>
        </Panel>
        <Panel title="Credits / notable work" action="Verified">
          <p>
            Independent film campaigns, documentary title beds, premium
            hospitality reels, and limited-run artist collaborations.
          </p>
        </Panel>
        <Panel title="Archive / context notes" action="Provenance">
          <p>
            Recording notes preserve collaborators, dates, instruments, and
            rights conversations so discovery feels credible and respectful.
          </p>
        </Panel>
        <Panel title="Featured collection" action="Licensable">
          <p>
            Music for Emotional Storytelling includes 18 related tracks,
            preview-only listening, and protected master delivery after
            approval.
          </p>
        </Panel>
      </div>
      <h3>Related tracks</h3>
      <div className="track-list compact">
        {artistTracks.slice(0, 3).map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isPlaying={playingId === track.id}
            saved={savedIds.includes(track.id)}
            onPlay={() => togglePlay(track.id)}
            onSave={() => saveTrack(track.id)}
            onOpen={() => openTrack(track)}
            onRequest={() => requestLicense(track)}
          />
        ))}
      </div>
    </section>
  );
}

function Legacy({ setView, openTrack }) {
  const legacyTimeline = [
    [
      "1972 — The Tapes Exist",
      "Gary Burke begins recording raw jazz-funk sessions in a converted warehouse in Brooklyn, capturing analog vibes on a 2-inch tape deck.",
    ],
    [
      "1981 — Lowercase Brand Spirit",
      "Burke registers the lowercase 'beatmondo' logo, insisting that the music should speak softly rather than scream for attention.",
    ],
    [
      "1995 — Private Licensing Room",
      "A selective, physical listening space is set up in Soho, letting film supervisors listen to secure masters under private rights contracts.",
    ],
    [
      "2026 — Gated Sync Platform",
      "The original stewardship values transition to a premium gated ecosystem, preserving rights integrity and master quality for the next era.",
    ],
  ];

  const legacyStories = [
    {
      title: "The Tape Archival Sessions",
      kicker: "Studio Memories",
      desc: "Gary was obsessive about room mic placement. We preserved every tape hiss, original room reflection, and transient response. When you download a WAV master here, you are getting the direct analog path.",
      image: img.musicArchive,
    },
    {
      title: "Inside the Starlite Studio Console",
      kicker: "Stewardship Notes",
      desc: "Built on custom transformers and Class-A circuitry. The classic warmth of these recordings cannot be replicated in modern digital environments. It is a highly differentiated asset for premium film cues.",
      image: img.privateStudio,
    },
  ];

  return (
    <section className="legacy-page">
      <div
        className="legacy-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(10,8,6,.88), rgba(10,8,6,.48), rgba(10,8,6,.2)), url(${img.legacyDetail})`,
        }}
      >
        <div className="legacy-hero-copy">
          <span className="eyebrow">Stewardship · Archive</span>
          <h2>The Gary Burke Legacy</h2>
          <p>
            A respectful look at the original beatmondo spirit, analog studio
            memories, lowercase brand identity, and musician-led sync
            stewardship.
          </p>
          <button
            className="gold-button legacy-primary-button"
            onClick={() => setView("catalog")}
          >
            <MusicNote size={18} /> Explore Legacy Music
          </button>
        </div>
      </div>

      <div className="legacy-grid-two">
        <Panel
          title="Gary Burke & beatmondo"
          action="Biography"
          className="legacy-biography-panel"
        >
          <div className="legacy-biography-layout">
            <figure className="gary-burke-portrait">
              <img
                src="/assets/editorial/gary-burke-studio-portrait.webp"
                alt="Gary Burke seated in a recording studio beside a drum kit"
              />
              <figcaption>
                Gary Burke in the studio · musician, recordist, and original
                steward of beatmondo
              </figcaption>
            </figure>
            <div className="biography-text">
              <p>
                Gary Burke was a recordist, visionary, and defender of artist
                rights. In a time when mass-market libraries began to
                commoditize music, Gary established <strong>beatmondo</strong>{" "}
                as a private sanctuary for authentic musicianship.
              </p>
              <p>
                He famously insisted on lowercase typography for the brand name,
                believing that premium works do not need to shout. To Gary, sync
                licensing was not a transaction — it was a respectful placement
                of art into a storytelling medium.
              </p>
              <p>
                Today, we maintain that philosophy through selective access,
                verified rights, and protected delivery.
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Archive Milestones"
          action="Historical Timeline"
          className="legacy-timeline-panel"
        >
          <ol
            className="timeline-vertical"
            aria-label="beatmondo archive milestones"
          >
            {legacyTimeline.map(([entry, text]) => {
              const [year, title] = entry.split(" — ");
              return (
                <li
                  className={`timeline-node ${year === "2026" ? "is-current" : ""}`}
                  key={entry}
                >
                  <span className="timeline-year">{year}</span>
                  <div className="timeline-copy">
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      <section className="legacy-editorial-section">
        <div className="legacy-section-heading">
          <span className="eyebrow">Archive stories</span>
          <h3>Studio memories and stewardship notes</h3>
        </div>
        <div className="editorial-row">
          {legacyStories.map((story) => (
            <article
              className="story-card-editorial"
              key={story.title}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(8,6,4,.9)), url(${story.image})`,
              }}
            >
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
          <button
            className="outline-button explore-action-button"
            onClick={() => setView("catalog")}
          >
            Explore Music <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="legacy-tracks-grid">
          <article
            className="legacy-track-card"
            onClick={() => openTrack(tracks[3])}
          >
            <div
              className="track-img-block"
              style={{ backgroundImage: `url(${tracks[3].image})` }}
            />
            <div className="track-desc-block">
              <span className="value-signal-badge premium-demand">
                {tracks[3].valueSignal}
              </span>
              <h4>{tracks[3].title}</h4>
              <p>
                {tracks[3].artist} · {tracks[3].era} · {tracks[3].genre}
              </p>
              <span>
                Original Soho session master · 100% publishing verified
              </span>
            </div>
            <button className="gold-button legacy-primary-button license-action-button">
              Request License
            </button>
          </article>

          <article
            className="legacy-track-card"
            onClick={() => openTrack(tracks[12])}
          >
            <div
              className="track-img-block"
              style={{ backgroundImage: `url(${tracks[12].image})` }}
            />
            <div className="track-desc-block">
              <span className="value-signal-badge growing-interest">
                {tracks[12].valueSignal}
              </span>
              <h4>{tracks[12].title}</h4>
              <p>
                {tracks[12].artist} · {tracks[12].era} · {tracks[12].genre}
              </p>
              <span>Multi-track tape transfer complete · Stems ready</span>
            </div>
            <button className="gold-button legacy-primary-button license-action-button">
              Request License
            </button>
          </article>
        </div>
      </section>
    </section>
  );
}

function LicensingAccess({
  authUser,
  selectedTrack,
  requestSent,
  setRequestSent,
  setView,
}) {
  const initialMode =
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("beatmondo-licensing-mode") === "access"
      ? "access"
      : "license";
  const [mode, setMode] = useState(initialMode);
  const [accessSent, setAccessSent] = useState(false);
  const [requestSummary, setRequestSummary] = useState(null);
  const [selectedTier, setSelectedTier] = useState(
    authUser?.membershipTier?.includes("Buyer") ||
      authUser?.membershipTier?.includes("Access")
      ? authUser.membershipTier
      : "Discovery Access",
  );
  const switchMode = (next) => {
    setMode(next);
    window.sessionStorage.setItem("beatmondo-licensing-mode", next);
    window.history.replaceState(
      null,
      "",
      next === "access" ? "#licensing/access" : "#licensing/request",
    );
  };
  return (
    <section className="form-page wide-page licensing-page">
      <div className="licensing-header">
        <div className="form-intro">
          <span className="eyebrow">Licensing and access</span>
          <h2>
            {mode === "license"
              ? "License a track with rights-aware clearance."
              : "Request workspace access for your team."}
          </h2>
          <p>
            {mode === "license"
              ? "Submit usage, territory, term, and delivery needs for the selected track. Account access tiers are managed separately."
              : "Apply for Discovery, Professional, or VIP Sync Access. beatmondo keeps entry selective and audit-ready."}
          </p>
        </div>
        <div
          className="segmented stacked licensing-mode"
          role="tablist"
          aria-label="Licensing or access"
        >
          <span className="eyebrow">Choose a path</span>
          <p>
            {mode === "license"
              ? "Track licensing path — usage parameters for a selected work."
              : "Account access path — buyer, contributor, or partner workspace."}
          </p>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "license"}
            className={mode === "license" ? "active" : ""}
            onClick={() => switchMode("license")}
          >
            Request License
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "access"}
            className={mode === "access" ? "active" : ""}
            onClick={() => switchMode("access")}
          >
            Request Access
          </button>
        </div>
      </div>
      <div className="tier-grid form-tier-grid">
        {buyerTiers.map((tier) => (
          <button
            type="button"
            key={tier.id}
            className={`tier-pick ${tier.id === "vip" ? "vip-tier-pick" : ""} ${selectedTier === tier.name ? "active" : ""}`}
            onClick={() => setSelectedTier(tier.name)}
          >
            <span className="tier-badge">{tier.name}</span>
            <strong>{tier.name}</strong>
            <small>{tier.priceLabel}</small>
            <span>{tier.features.slice(0, 3).join(" · ")}</span>
          </button>
        ))}
      </div>
      <p className="simulation-banner" role="note">
        Licensing, quotes, payments, and delivery outcomes in this prototype are
        simulated for demonstration — not live legal or financial transactions.
      </p>
      <div className="licensing-workspace">
        <div>
          {mode === "license" ? (
            requestSent ? (
              <ConfirmationScreen
                track={selectedTrack}
                tier={selectedTier}
                setView={setView}
              />
            ) : (
              <InquiryForm
                track={selectedTrack}
                onSubmit={() => setRequestSent(true)}
                selectedTier={selectedTier}
                onDraftChange={setRequestSummary}
              />
            )
          ) : accessSent ? (
            <AccessConfirmation tier={selectedTier} />
          ) : (
            <AccessForm
              onSubmit={() => setAccessSent(true)}
              selectedTier={selectedTier}
            />
          )}
        </div>
        <LicensingSummary
          track={selectedTrack}
          selectedTier={selectedTier}
          mode={mode}
          draft={requestSummary}
        />
      </div>
    </section>
  );
}

function FieldGroup({ title, note, children, requirement }) {
  return (
    <fieldset className="form-section">
      <legend>
        {title}
        {requirement && (
          <span
            className={`field-requirement ${requirement === "Optional" ? "optional" : ""}`}
          >
            {requirement}
          </span>
        )}
      </legend>
      {note && <p>{note}</p>}
      <div className="form-section-grid">{children}</div>
    </fieldset>
  );
}

function LicensingSummary({ track, selectedTier, mode, draft }) {
  const { user } = useAuth();
  const isVip = selectedTier === "VIP Sync Access";
  const verified = user?.verificationStatus === "approved";
  const steps = isVip
    ? [
        "Confirm usage parameters",
        "Concierge rights review",
        "Pre-approved terms or quote",
        "Fast-track secure delivery",
      ]
    : [
        "Submit usage details",
        "Rights and quote review",
        "Approval and payment",
        "Secure WAV delivery",
      ];
  return (
    <aside className="licensing-summary-panel">
      <span className="eyebrow">
        {mode === "license" ? "Licensing summary" : "Access review"}
      </span>
      <h3>{isVip ? "VIP priority path" : "Controlled access path"}</h3>
      <div className="summary-list">
        <span>
          <strong>Track</strong>
          {track.title}
        </span>
        <span>
          <strong>Buyer</strong>
          {user?.name || "Sign in to attach your profile"}
        </span>
        <span>
          <strong>Buyer tier</strong>
          {selectedTier}
        </span>
        <span>
          <strong>Verification</strong>
          {user
            ? verified
              ? "Verified buyer"
              : "Review needed"
            : "Sign in required"}
        </span>
        <span>
          <strong>Rights status</strong>
          {track.rightsData?.rightsVerified
            ? "Ownership verified"
            : "Rights check needed"}
        </span>
        <span>
          <strong>Delivery</strong>
          {track.assets?.stems
            ? "WAV master + stems"
            : "WAV master after approval"}
        </span>
        <span>
          <strong>Terms</strong>
          {isVip ? "Pre-approved where available" : "Quote-based licensing"}
        </span>
        {mode === "license" && (
          <>
            <span>
              <strong>Request status</strong>
              {draft?.status || "Draft"}
            </span>
            <span>
              <strong>Completion</strong>
              {draft?.completion || 0}%
            </span>
            <span>
              <strong>Project</strong>
              {draft?.form?.projectName || "Not completed"}
            </span>
            <span>
              <strong>Usage / territory</strong>
              {draft?.form?.usage || "—"} · {draft?.form?.territory || "—"}
            </span>
            <span>
              <strong>Term / rights</strong>
              {draft?.form?.term || "—"} · {draft?.form?.rights || "—"}
            </span>
            <span>
              <strong>Budget pathway</strong>
              {draft?.form?.budget || "Not selected"}
            </span>
          </>
        )}
      </div>
      <div className="workflow-steps">
        {steps.map((step, index) => (
          <span key={step}>
            <em>{index + 1}</em>
            {step}
          </span>
        ))}
      </div>
      <div className="locked-box summary-lock">
        <LockKey size={24} /> Protected master audio{" "}
        <small>
          Files remain private until approval, payment, or VIP terms are
          confirmed.
        </small>
      </div>
    </aside>
  );
}

function InquiryModal({
  track,
  requestSent,
  setRequestSent,
  onClose,
  setView,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
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
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="license-modal-title"
      onClick={onClose}
    >
      <div
        className="modal"
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        {requestSent ? (
          <ConfirmationScreen
            track={track}
            compact
            setView={setView}
            onClose={onClose}
          />
        ) : (
          <>
            <h2 id="license-modal-title">Request license for {track.title}</h2>
            <InquiryForm
              track={track}
              onSubmit={() => setRequestSent(true)}
              compact
            />
          </>
        )}
      </div>
    </div>
  );
}

function InquiryForm({
  track,
  onSubmit,
  compact,
  selectedTier = currentBuyer.accessTier,
  onDraftChange,
}) {
  const { user } = useAuth();
  const sessionBuyer = user
    ? {
        name: user.name || "",
        email: user.email || "",
        company: user.organization || "",
        role: user.jobTitle || "",
        tier: user.membershipTier || selectedTier,
      }
    : {
        name: "",
        email: "",
        company: "",
        role: "",
        tier: selectedTier,
      };
  const projectContext = (() => {
    try {
      return JSON.parse(
        window.localStorage.getItem("beatmondo-search-project-context") ||
          "null",
      );
    } catch {
      return null;
    }
  })();
  const draftKey = `beatmondo-license-draft-${user?.id || "guest"}-${track.id}`;
  const baseForm = {
    name: sessionBuyer.name,
    email: sessionBuyer.email,
    company: sessionBuyer.company,
    role: sessionBuyer.role,
    buyerLevel: sessionBuyer.tier,
    projectName: projectContext?.name || (user ? "Luxury Auto Campaign - Fall 2026" : ""),
    projectType: "Advertising",
    brand: user ? "Aster Automotive" : "",
    productionCompany: sessionBuyer.company,
    description: user
      ? "High-end cinematic project targeting global brand platforms."
      : "",
    deadline: "",
    usage: projectContext?.filters?.usage?.[0] || "Advertising",
    territory: "Global",
    term: "1 Year",
    rights: "Non-Exclusive",
    assets: ["WAV Master", "Stems", "Instrumental"],
    budget: "",
    notes: "",
  };
  const savedDraft = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(draftKey) || "null");
    } catch {
      return null;
    }
  })();
  const [form, setForm] = useState(() => ({
    ...baseForm,
    ...(savedDraft?.form || {}),
    buyerLevel: sessionBuyer.tier,
  }));

  const [step, setStep] = useState(() =>
    Math.min(9, Math.max(0, Number(savedDraft?.step || 0))),
  );
  const [highestCompleted, setHighestCompleted] = useState(() =>
    Math.min(
      9,
      Math.max(
        0,
        Number(savedDraft?.highestCompleted ?? savedDraft?.step ?? 0),
      ),
    ),
  );
  const [errors, setErrors] = useState({});
  const [savedAt, setSavedAt] = useState(savedDraft?.updatedAt || null);

  const requiredFieldsByStep = {
    0: ["name", "email", "company", "role"],
    1: ["projectName", "projectType", "description"],
    2: ["usage"],
    3: ["territory"],
    4: ["term"],
    5: ["rights"],
    6: ["assets"],
    7: ["budget"],
  };
  const requiredFieldLabels = {
    name: "Full name",
    email: "Work email",
    company: "Company",
    role: "Job title",
    projectName: "Project name",
    projectType: "Project type",
    description: "Project description",
    usage: "Usage category",
    territory: "Territory",
    term: "Term duration",
    rights: "Rights scope",
    assets: "Asset selection",
    budget: "Budget pathway",
  };
  const stepIsComplete = (index) => {
    if (index === 8) return true;
    if (index === 9)
      return Object.keys(requiredFieldsByStep).every((value) =>
        stepIsComplete(Number(value)),
      );
    return (requiredFieldsByStep[index] || []).every((field) => {
      const value = form[field];
      if (field === "email")
        return /\S+@\S+\.\S+/.test(String(value || ""));
      return Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());
    });
  };
  const effectiveCompleted = Math.max(
    highestCompleted,
    stepIsComplete(step) ? step + 1 : step,
  );
  const completion = Math.min(100, Math.round((effectiveCompleted / 10) * 100));
  const estimatedMinutes = Math.max(1, 10 - effectiveCompleted);
  const duplicateRequest = (() => {
    let submissions = [];
    try {
      submissions = JSON.parse(
        window.localStorage.getItem("beatmondo-license-submissions") || "[]",
      );
    } catch {
      submissions = [];
    }
    const storedDuplicate = submissions.some(
      (item) =>
        String(item.trackId) === String(track.id) &&
        item.projectName?.toLowerCase() === form.projectName.toLowerCase(),
    );
    const seededDuplicate =
      track.title === "Golden Hours" &&
      form.projectName.toLowerCase().includes("luxury auto campaign");
    return storedDuplicate || seededDuplicate;
  })();
  const persistDraft = (status = "Draft") => {
    const updatedAt = new Date().toISOString();
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        form,
        step,
        highestCompleted,
        status,
        completion,
        updatedAt,
      }),
    );
    setSavedAt(updatedAt);
    onDraftChange?.({ form, step, status, completion, updatedAt });
  };
  useEffect(() => {
    const timeout = window.setTimeout(() => persistDraft("Draft"), 250);
    return () => window.clearTimeout(timeout);
  }, [form, step, highestCompleted]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateStep = (index) => {
    const nextErrors = {};
    (requiredFieldsByStep[index] || []).forEach((field) => {
      const value = form[field];
      const valid =
        field === "email"
          ? /\S+@\S+\.\S+/.test(String(value || ""))
          : Array.isArray(value)
            ? value.length > 0
            : Boolean(String(value || "").trim());
      if (!valid)
        nextErrors[field] =
          field === "email"
            ? `${requiredFieldLabels[field]}: enter a valid work email.`
            : `${requiredFieldLabels[field]}: complete this required field before continuing.`;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const toggleAsset = (assetName) => {
    setForm((prev) => {
      const current = prev.assets.includes(assetName)
        ? prev.assets.filter((a) => a !== assetName)
        : [...prev.assets, assetName];
      return { ...prev, assets: current };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const invalidStep = Object.keys(requiredFieldsByStep)
      .map(Number)
      .find((index) => !stepIsComplete(index));
    if (invalidStep !== undefined) {
      validateStep(invalidStep);
      setStep(invalidStep);
      return;
    }
    let submissions = [];
    try {
      submissions = JSON.parse(
        window.localStorage.getItem("beatmondo-license-submissions") || "[]",
      );
    } catch {
      submissions = [];
    }
    submissions.unshift({
      id: `mock-request-${Date.now()}`,
      trackId: track.id,
      trackTitle: track.title,
      projectName: form.projectName,
      status: "Submitted for review",
      submittedAt: new Date().toISOString(),
    });
    window.localStorage.setItem(
      "beatmondo-license-submissions",
      JSON.stringify(submissions),
    );
    window.localStorage.removeItem(draftKey);
    onSubmit();
  };

  const stepsList = [
    "Buyer",
    "Project",
    "Usage",
    "Territory",
    "Term",
    "Rights",
    "Assets",
    "Budget",
    "Notes",
    "Review",
  ];

  const steps = [
    {
      id: "buyer",
      title: "Step 1 — Buyer Details",
      note: "Who should the licensing team verify and contact?",
      fields: (
        <FieldGroup
          title="Buyer Details"
          note="Provide supervisor/buyer context."
          requirement="Required"
        >
          <label>
            Full Name <span className="required-mark">Required</span>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <label>
            Work Email <span className="required-mark">Required</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>
          <label>
            Company <span className="required-mark">Required</span>
            <input
              required
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
            />
          </label>
          <label>
            Job Title <span className="required-mark">Required</span>
            <input
              required
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            />
          </label>
          <label>
            Buyer Level{" "}
            <input
              value={form.buyerLevel}
              readOnly
              className="read-only-input"
            />
          </label>
        </FieldGroup>
      ),
    },
    {
      id: "project",
      title: "Step 2 — Project Context",
      note: "Provide credentials and details about the project.",
      fields: (
        <FieldGroup
          title="Project Details"
          note="Details of the production workspace."
          requirement="Required core fields · supporting fields optional"
        >
          <label>
            Project Name <span className="required-mark">Required</span>
            <input
              required
              value={form.projectName}
              onChange={(e) => update("projectName", e.target.value)}
            />
          </label>
          <label>
            Project Type <span className="required-mark">Required</span>
            <select
              value={form.projectType}
              onChange={(e) => update("projectType", e.target.value)}
            >
              <option>Film / TV</option>
              <option>OTT / streaming</option>
              <option>Advertising</option>
              <option>Brand Film</option>
              <option>Trailer / Promo</option>
              <option>Documentary</option>
              <option>Sports / broadcast</option>
              <option>Luxury / lifestyle campaign</option>
              <option>Game</option>
              <option>Live event</option>
              <option>Editorial / Media</option>
            </select>
          </label>
          <label>
            Brand / Client <span className="optional-mark">Optional</span>
            <input
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
            />
          </label>
          <label>
            Production Company <span className="optional-mark">Optional</span>
            <input
              value={form.productionCompany}
              onChange={(e) => update("productionCompany", e.target.value)}
            />
          </label>
          <label>
            Project Description <span className="required-mark">Required</span>
            <input
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </label>
          <label>
            Project Deadline <span className="optional-mark">Optional</span>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
            />
          </label>
        </FieldGroup>
      ),
    },
    {
      id: "usage",
      title: "Step 3 — Usage Categories",
      note: "Select the primary placement medium for this request.",
      fields: (
        <FieldGroup
          title="Usage Categories"
          note="Choose how the track will be placed."
          requirement="Required"
        >
          <div className="toggle-button-group">
            {[
              "Film",
              "Television",
              "OTT",
              "Advertising",
              "Social",
              "Trailer",
              "Documentary",
              "Game",
              "Event",
              "Other",
            ].map((opt) => (
              <button
                type="button"
                key={opt}
                className={`toggle-option-btn ${form.usage === opt ? "active" : ""}`}
                onClick={() => update("usage", opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      ),
    },
    {
      id: "territory",
      title: "Step 4 — Territory Scope",
      note: "What distribution territories are required?",
      fields: (
        <FieldGroup
          title="Territory Scope"
          note="Select licensing coverage."
          requirement="Required"
        >
          <div className="toggle-button-group">
            {["Local", "National", "Regional", "Global", "Custom"].map(
              (opt) => (
                <button
                  type="button"
                  key={opt}
                  className={`toggle-option-btn ${form.territory === opt ? "active" : ""}`}
                  onClick={() => update("territory", opt)}
                >
                  {opt}
                </button>
              ),
            )}
          </div>
        </FieldGroup>
      ),
    },
    {
      id: "term",
      title: "Step 5 — Term Duration",
      note: "How long will the licensing coverage remain active?",
      fields: (
        <FieldGroup
          title="Term Duration"
          note="Select the licence period."
          requirement="Required"
        >
          <div className="toggle-button-group">
            {[
              "3 Months",
              "6 Months",
              "1 Year",
              "2 Years",
              "5 Years",
              "Perpetual",
              "Custom",
            ].map((opt) => (
              <button
                type="button"
                key={opt}
                className={`toggle-option-btn ${form.term === opt ? "active" : ""}`}
                onClick={() => update("term", opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      ),
    },
    {
      id: "rights",
      title: "Step 6 — Rights Scope",
      note: "Select the exclusivity requirements for this request.",
      fields: (
        <FieldGroup
          title="Rights Scope"
          note="Exclusivity terms affect clearance pathways."
          requirement="Required"
        >
          <div className="toggle-button-group">
            {[
              "Non-Exclusive",
              "Category Exclusive",
              "Territory Exclusive",
              "Full Exclusive",
              "Rights Review Required",
            ].map((opt) => (
              <button
                type="button"
                key={opt}
                className={`toggle-option-btn ${form.rights === opt ? "active" : ""}`}
                onClick={() => update("rights", opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      ),
    },
    {
      id: "assets",
      title: "Step 7 — Asset Selections",
      note: "Which file deliveries are needed for this workspace?",
      fields: (
        <FieldGroup
          title="Asset Deliveries"
          note="Locked masters and stems will be prepared."
          requirement="Required"
        >
          <div className="toggle-button-group multi">
            {[
              "WAV Master",
              "Instrumental",
              "Vocal Version",
              "Stems",
              "Alternate Mix",
              "Short Edit",
              "Extended Version",
              "Custom Version",
            ].map((opt) => (
              <button
                type="button"
                key={opt}
                className={`toggle-option-btn ${form.assets.includes(opt) ? "active" : ""}`}
                onClick={() => toggleAsset(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      ),
    },
    {
      id: "budget",
      title: "Step 8 — Budget Level",
      note: "Select the budget range allocated for this track placement.",
      fields: (
        <FieldGroup
          title="Budget Level"
          note="This shapes the quote calculations."
          requirement="Required"
        >
          <div className="toggle-button-group">
            {[
              "Budget Range",
              "Request Quote",
              "Existing Terms",
              "VIP Terms",
            ].map((opt) => (
              <button
                type="button"
                key={opt}
                className={`toggle-option-btn ${form.budget === opt ? "active" : ""}`}
                onClick={() => update("budget", opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </FieldGroup>
      ),
    },
    {
      id: "notes",
      title: "Step 9 — Editorial Notes",
      note: "Provide scene descriptions, sync timing, or custom requirements.",
      fields: (
        <FieldGroup
          title="Editorial Notes"
          note="Add scene details or custom requests."
          requirement="Optional"
        >
          <label className="full-field">
            Inquiry notes and creative brief
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Describe the scene, cue placement, edits, and delivery details..."
            />
          </label>
        </FieldGroup>
      ),
    },
    {
      id: "review",
      title: "Step 10 — Review Request",
      note: "Verify your parameters before submitting to platform admin.",
      fields: (
        <div className="review-summary-wrapper">
          <div className="review-summary-header">
            <h4>Sync Licensing Request Summary</h4>
            <span className="prototype-badge">Draft · Final review</span>
          </div>
          <div className="review-grid-two">
            <div className="review-block">
              <h5>Track Details</h5>
              <p>
                <strong>Title:</strong> {track.title}
              </p>
              <p>
                <strong>Artist:</strong> {track.artist}
              </p>
              <p>
                <strong>Clearance:</strong>{" "}
                {track.rightsData.rightsVerified
                  ? "Rights Verified"
                  : "Review Needed"}
              </p>
            </div>
            <div className="review-block">
              <h5>Buyer Details</h5>
              <p>
                <strong>Name:</strong> {form.name} ({form.role})
              </p>
              <p>
                <strong>Company:</strong> {form.company}
              </p>
              <p>
                <strong>Email:</strong> {form.email}
              </p>
              <p>
                <strong>Tier:</strong> {form.buyerLevel}
              </p>
            </div>
            <div className="review-block">
              <h5>Project Parameters</h5>
              <p>
                <strong>Project:</strong> {form.projectName}
              </p>
              <p>
                <strong>Type:</strong> {form.projectType}
              </p>
              <p>
                <strong>Brand / Client:</strong> {form.brand}
              </p>
              <p>
                <strong>Deadline:</strong> {form.deadline}
              </p>
            </div>
            <div className="review-block">
              <h5>Licensing Terms</h5>
              <p>
                <strong>Usage:</strong> {form.usage}
              </p>
              <p>
                <strong>Territory:</strong> {form.territory}
              </p>
              <p>
                <strong>Term:</strong> {form.term}
              </p>
              <p>
                <strong>Rights:</strong> {form.rights}
              </p>
              <p>
                <strong>Budget Pathway:</strong> {form.budget}
              </p>
            </div>
          </div>
          <div className="review-block full-width">
            <h5>Requested Assets</h5>
            <div className="review-assets-list">
              {form.assets.map((a) => (
                <span key={a} className="review-asset-pill">
                  <LockKey size={10} /> {a}
                </span>
              ))}
            </div>
          </div>
          <div className="review-block full-width">
            <h5>Editorial Notes</h5>
            <p className="review-notes-text">{form.notes}</p>
          </div>
          <div className="review-edit-actions" aria-label="Edit request sections">
            {[
              ["Buyer", 0],
              ["Project", 1],
              ["Usage", 2],
              ["Territory", 3],
              ["Term", 4],
              ["Rights", 5],
              ["Assets", 6],
              ["Budget", 7],
              ["Notes", 8],
            ].map(([label, index]) => (
              <button type="button" key={label} onClick={() => setStep(index)}>
                Edit {label}
              </button>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const isLastStep = step === steps.length - 1;

  return (
    <form
      className={`inquiry-form ${compact ? "compact-form" : ""}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="request-draft-bar">
        <span className="draft-status"><em /> Draft</span>
        <span>
          {savedAt
            ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Saving automatically"}
        </span>
        <button type="button" onClick={() => persistDraft("Draft")}>
          Save progress
        </button>
      </div>
      <details className="licensing-terminology-help">
        <summary>Licensing terminology help</summary>
        <dl>
          <dt>Usage</dt><dd>Where and how the music will appear.</dd>
          <dt>Territory</dt><dd>The geographic distribution area.</dd>
          <dt>Term</dt><dd>How long the approved use will remain active.</dd>
          <dt>Rights scope</dt><dd>Whether the use is non-exclusive or restricts other licensing.</dd>
          <dt>Assets</dt><dd>The protected master, instrumental, stems, or edits requested after approval.</dd>
          <dt>Quote</dt><dd>A review-subject commercial proposal, not a licence or delivery authorization.</dd>
        </dl>
      </details>
      {form.buyerLevel === "VIP Sync Access" && step < 9 && (
        <p className="vip-form-note">
          VIP Concierge review is active. Your request will be prioritized for
          fast-track clearance.
        </p>
      )}

      <div className="request-progress" aria-hidden="true">
        <div
          className="request-progress-bar"
          style={{ width: `${completion}%` }}
        />
      </div>
      <div className="request-progress-meta" aria-live="polite">
        <strong>{completion}% complete</strong>
        <span>About {estimatedMinutes} min remaining</span>
        <span>Step {step + 1} of {steps.length}</span>
      </div>
      {duplicateRequest && (
        <div className="duplicate-request-warning" role="status">
          <WarningCircle size={20} />
          <div>
            <strong>Possible duplicate request</strong>
            <span>
              This track and project appear in another request. You may
              continue, but review the existing request before submitting.
            </span>
          </div>
        </div>
      )}
      <div
        className="request-stepper-scrollable"
        role="navigation"
        aria-label="License request steps"
      >
        <div className="request-stepper-10">
          {stepsList.map((name, index) => (
            <button
              type="button"
              key={name}
              className={`step-btn-10 ${index === step ? "active" : index < highestCompleted ? "complete" : ""}`}
              aria-current={index === step ? "step" : undefined}
              onClick={() => {
                if (index <= highestCompleted) setStep(index);
              }}
            >
              <em>{index + 1}</em>
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="step-intro">
        <span className="eyebrow">
          Step {step + 1} of {steps.length}
        </span>
        <h3>{steps[step].title}</h3>
        <p>{steps[step].note}</p>
      </div>

      <div className="step-fields-content">{steps[step].fields}</div>
      {Object.keys(errors).length > 0 && (
        <div className="step-validation" role="alert">
          <WarningCircle size={20} />
          <div>
            <strong>Complete this step</strong>
            {Object.entries(errors).map(([field, message]) => (
              <span key={field}>{message}</span>
            ))}
          </div>
        </div>
      )}

      <div className="form-step-actions">
        <button
          type="button"
          className="outline-button"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
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
            onClick={() => {
              if (validateStep(step)) {
                setHighestCompleted((current) => Math.max(current, step + 1));
                setStep((current) => Math.min(steps.length - 1, current + 1));
              }
            }}
          >
            Continue
          </button>
        )}
      </div>
    </form>
  );
}

function AccessForm({ onSubmit, selectedTier = currentBuyer.accessTier }) {
  const { user } = useAuth();
  const [role, setRole] = useState(
    user?.jobTitle || "Music Supervisor",
  );
  return (
    <form
      className="inquiry-form access-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="role-grid">
        {[
          "Music Supervisor",
          "Film / TV Producer",
          "Brand / Agency",
          "Trailer Editor",
          "Artist / Contributor",
          "Strategic Partner",
          "Other",
        ].map((item) => (
          <button
            type="button"
            key={item}
            className={role === item ? "active" : ""}
            onClick={() => setRole(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <label>
        Name
        <input
          required
          defaultValue={user?.name || ""}
          placeholder="Jane Mitchell"
        />
      </label>
      <label>
        Email
        <input
          required
          type="email"
          defaultValue={user?.email || ""}
          placeholder="name@company.com"
        />
      </label>
      <label>
        Company
        <input
          required
          defaultValue={user?.organization || ""}
          placeholder="Company or studio"
        />
      </label>
      <label>
        Role
        <input value={role} readOnly />
      </label>
      <label>
        Requested access tier
        <input value={selectedTier} readOnly />
      </label>
      <label>
        Membership / payment status
        <input
          value={
            selectedTier === "Discovery Access"
              ? "Entry approval required"
              : "Verification required"
          }
          readOnly
        />
      </label>
      <label className="full-field">
        Intended use
        <textarea
          required
          placeholder="Tell us how you expect to use beatmondo."
        />
      </label>
      <label className="full-field">
        Message
        <textarea placeholder="Anything the team should know?" />
      </label>
      <button
        className={`gold-button form-submit ${selectedTier === "VIP Sync Access" ? "vip-access-button" : ""}`}
        type="submit"
      >
        <span className="motion-button-label">
          <SignIn size={18} /> Request Access
        </span>
        {selectedTier === "VIP Sync Access" && (
          <span className="vip-acoustic-ripple" aria-hidden="true" />
        )}
      </button>
    </form>
  );
}

function ConfirmationScreen({
  track,
  compact,
  tier = currentBuyer.accessTier,
  setView,
  onClose,
}) {
  return (
    <section
      className={`confirmation ${compact ? "compact-confirmation" : ""}`}
    >
      <CheckCircle size={52} weight="fill" />
      <h2>Your license request has been received.</h2>
      <p>
        The beatmondo team will review your usage details for{" "}
        <strong>{track.title}</strong> under <strong>{tier}</strong> and respond
        with next steps.
      </p>
      <div className="status-strip">
        {(tier === "VIP Sync Access"
          ? [
              "VIP Priority",
              "Concierge Review",
              "Pre-Approved Terms",
              "Fast-Track Delivery",
              "VIP Delivered",
            ]
          : [
              "Submitted",
              "In Review",
              "Quote Needed",
              "Quote Sent",
              "Approved",
              "Paid",
              "Delivery Ready",
            ]
        ).map((status) => (
          <span key={status}>{status}</span>
        ))}
      </div>
      <div
        className="button-row"
        style={{ marginTop: 24, justifyContent: "center" }}
      >
        <button
          type="button"
          className="gold-button"
          onClick={() => {
            if (setView) setView("buyer");
            if (onClose) onClose();
          }}
        >
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
  return (
    <section className="confirmation">
      <CheckCircle size={52} weight="fill" />
      <h2>Access request received.</h2>
      <p>
        beatmondo will review your role, company, intended use, and requested{" "}
        <strong>{tier}</strong> permissions before enabling the right workspace.
      </p>
      <div className="status-strip">
        <span>Request received</span>
        <span>Buyer verification</span>
        <span>
          {tier === "VIP Sync Access" ? "Concierge review" : "Workspace setup"}
        </span>
      </div>
    </section>
  );
}

function BuyerDashboard({
  authUser,
  savedIds,
  setView,
  requestLicense,
  openTrack,
  playingId,
  togglePlay,
  saveTrack,
  showToast,
}) {
  const verification = authUser
    ? buyerVerificationService.getByUser(authUser.id)
    : null;
  const currentMembership = authUser
    ? membershipService.getCurrentMembership(authUser.id)
    : null;
  const effectiveAccess = authUser
    ? calculateEffectiveAccess(authUser, verification, currentMembership)
    : { has: () => false, effectivePlan: "Discovery Access" };
  const verificationApproved =
    verification &&
    ["Approved", "Approved with Restrictions", "Reinstated"].includes(
      verification.status,
    );
  const buyer = authUser
    ? {
        name: authUser.name,
        company: authUser.organization,
        role: authUser.jobTitle,
        accessTier: authUser.membershipTier,
        verified: verification
          ? verificationApproved
          : authUser.verificationStatus === "approved",
        membershipStatus:
          authUser.accountStatus === "active"
            ? "Active"
            : authUser.accountStatus,
        preApprovedTerms: Boolean(authUser.preApprovedTerms),
      }
    : currentBuyer;
  const canUseSecureDelivery = Boolean(
    authUser?.permissions?.includes("*") ||
    effectiveAccess.has("delivery.secure"),
  );
  const verificationLabel = buyer.verified
    ? "Verified buyer"
    : verification?.status === "Rejected"
      ? "Verification not approved"
      : verification?.status === "Suspended"
        ? "Access suspended"
        : verification?.status === "Additional Information Required"
          ? "Information required"
          : verification?.status === "Reverification Required"
            ? "Reverification required"
            : "Verification under review";
  const saved = tracks.filter((track) => savedIds.includes(track.id));

  const nextSteps = [
    [
      "Quote awaiting review",
      "Luxury Auto Campaign",
      "Review terms",
      () => setView("project"),
    ],
    [
      "Deadline approaching",
      "Documentary Opening Titles",
      "Submit usage notes",
      () => requestLicense(tracks[2]),
    ],
    [
      "Download ready",
      "Premium Hotel Launch Film",
      "Open delivery",
      () => showToast("Secure delivery workspace opened."),
    ],
  ];

  const quotes = [
    {
      id: "Q-1042",
      project: "Luxury Auto Campaign - Fall 2026",
      track: "Golden Hours",
      cost: "$22,000",
      expires: "Sep 12, 2026",
      status: "Awaiting Review",
    },
    {
      id: "Q-1041",
      project: "Premium Hotel Launch Film",
      track: "Chasing the Light",
      cost: "$15,000",
      expires: "Aug 28, 2026",
      status: "Approved",
    },
    {
      id: "Q-1040",
      project: "Documentary Opening Titles",
      track: "Midnight Transit",
      cost: "$8,500",
      expires: "Sep 02, 2026",
      status: "Awaiting Terms",
    },
  ];

  const payments = [
    {
      invoice: "INV-2026-004",
      project: "Premium Hotel Launch Film",
      amount: "$15,000",
      date: "Jul 10, 2026",
      method: "Wire Transfer",
      status: "Paid",
    },
    {
      invoice: "INV-2026-005",
      project: "Luxury Auto Campaign - Fall 2026",
      amount: "$22,000",
      date: "Pending",
      method: "VIP Accounts Receivable",
      status: "Invoice Pending",
    },
  ];

  const deliveries = [
    {
      id: 1,
      asset: "Golden Hours (WAV Master)",
      fileType: "WAV (24-bit / 48kHz)",
      license: "Worldwide Brand Campaign (1 Year)",
      expiry: "Sep 30, 2026",
      count: 3,
      status: "Delivery Ready",
    },
    {
      id: 2,
      asset: "Chasing the Light (Full Stems)",
      fileType: "ZIP (8 WAV Stems)",
      license: "Premium Hotel Launch (Perpetual)",
      expiry: "Oct 15, 2026",
      count: 5,
      status: "Delivery Ready",
    },
  ];

  const history = [
    {
      date: "Jul 14, 2026",
      project: "Luxury Auto Campaign - Fall 2026",
      action: "VIP Fast-Track Clearance Initiated",
    },
    {
      date: "Jul 12, 2026",
      project: "Premium Hotel Launch Film",
      action: "Payment Confirmed & Access Keys Issued",
    },
    {
      date: "Jul 10, 2026",
      project: "Premium Hotel Launch Film",
      action: "License Terms Accepted by Buyer",
    },
    {
      date: "Jul 08, 2026",
      project: "Documentary Opening Titles",
      action: "Licensing Request Submitted",
    },
  ];

  return (
    <section className="dashboard-page">
      {currentMembership &&
        ["Past Due", "Grace Period", "Payment Failed", "Suspended"].includes(
          currentMembership.status,
        ) && (
          <div className="account-status-banner warning buyer-verification-banner">
            <WarningCircle size={28} />
            <div>
              <strong>Membership payment action required</strong>
              <span>
                {formatMoney(
                  currentMembership.outstandingBalanceCents ||
                    currentMembership.totalCents,
                )}{" "}
                is outstanding. Premium catalog, licensing, and secure delivery
                remain restricted until payment and verification conditions are
                satisfied.
              </span>
              {currentMembership.gracePeriodEndsAt && (
                <small>
                  Grace period ends{" "}
                  {new Date(
                    currentMembership.gracePeriodEndsAt,
                  ).toLocaleDateString()}
                </small>
              )}
            </div>
            <button
              className="gold-button"
              onClick={() => setView("billing-payment-failed")}
            >
              Resolve payment
            </button>
          </div>
        )}
      {currentMembership?.status === "Cancelling" && (
        <div className="account-status-banner warning buyer-verification-banner">
          <Sparkle size={28} />
          <div>
            <strong>Membership cancellation scheduled</strong>
            <span>
              {currentMembership.planName} remains active until{" "}
              {new Date(
                currentMembership.currentPeriodEnd,
              ).toLocaleDateString()}
              . Auto-renewal is disabled.
            </span>
          </div>
          <button
            className="gold-button"
            onClick={() => setView("billing-reactivate")}
          >
            Reactivate
          </button>
        </div>
      )}
      {!buyer.verified && (
        <div className="account-status-banner warning buyer-verification-banner">
          <ShieldCheck size={28} />
          <div>
            <strong>
              {verification?.status === "Additional Information Required"
                ? "Verification information required"
                : verification?.status === "Rejected"
                  ? "Professional access was not approved"
                  : verification?.status === "Suspended"
                    ? "Professional access temporarily restricted"
                    : "Professional verification under review"}
            </strong>
            <span>
              {verification?.status === "Additional Information Required"
                ? verification.informationRequests?.find(
                    (item) => item.status === "Open",
                  )?.buyerExplanation
                : verification?.status === "Rejected"
                  ? verification.decision?.buyerMessage
                  : verification?.status === "Suspended"
                    ? verification.buyerVisibleMessages?.[0]?.body
                    : "Discovery, protected previews, saved tracks, profile, and membership remain available. Projects, quotes, contracts, and secure delivery unlock after approval."}
            </span>
            {verification?.informationRequests?.find(
              (item) => item.status === "Open",
            )?.dueDate && (
              <small>
                Response due{" "}
                {
                  verification.informationRequests.find(
                    (item) => item.status === "Open",
                  ).dueDate
                }
              </small>
            )}
          </div>
          <button className="outline-button" onClick={() => setView("profile")}>
            Complete verification profile
          </button>
          <button
            className="gold-button"
            onClick={() => setView("buyer-verification")}
          >
            {verification?.status === "Additional Information Required" ||
            verification?.status === "Suspended"
              ? "Submit Information"
              : "View Application"}
          </button>
        </div>
      )}
      <section className="buyer-profile-card">
        <div>
          <span className="eyebrow">Buyer profile</span>
          <h2>{buyer.name}</h2>
          <p>
            {buyer.company} · {buyer.role}
          </p>
        </div>
        <div className="buyer-profile-meta">
          <span
            className={`tier-badge ${buyer.accessTier === "VIP Sync Access" ? "vip" : ""}`}
          >
            {buyer.accessTier}
          </span>
          <span>{verificationLabel}</span>
          <span>Membership: {buyer.membershipStatus}</span>
          <span>
            {buyer.preApprovedTerms
              ? "Pre-approved terms active"
              : "Terms review needed"}
          </span>
          {verificationApproved && (
            <span>
              Reverify{" "}
              {verification.nextReviewAt
                ? new Date(verification.nextReviewAt).toLocaleDateString()
                : "as requested"}
            </span>
          )}
          {currentMembership && (
            <span>
              {currentMembership.planName} · {currentMembership.status}
            </span>
          )}
          {currentMembership?.nextInvoiceAt && (
            <span>
              Next billing{" "}
              {new Date(currentMembership.nextInvoiceAt).toLocaleDateString()}
            </span>
          )}
          {currentMembership && (
            <button className="plain-button" onClick={() => setView("billing")}>
              Manage Billing
            </button>
          )}
        </div>
      </section>

      <div className="metric-grid-six">
        <Metric
          icon={Heart}
          label="Saved Tracks"
          value={saved.length || "0"}
          note="Ready for project review"
        />
        <Metric
          icon={BookmarkSimple}
          label="Active Projects"
          value={canUseSecureDelivery ? "3" : "Locked"}
          note={
            canUseSecureDelivery ? "1 quote pending" : "Professional access"
          }
        />
        <Metric
          icon={FileAudio}
          label="Open Requests"
          value={canUseSecureDelivery ? "4" : "Locked"}
          note={
            canUseSecureDelivery ? "2 need response" : "Professional access"
          }
        />
        <Metric
          icon={Sparkle}
          label="Quotes"
          value={canUseSecureDelivery ? "3" : "Locked"}
          note={
            canUseSecureDelivery ? "1 needs approval" : "Professional access"
          }
        />
        <Metric
          icon={ShieldCheck}
          label="Approved Licenses"
          value={canUseSecureDelivery ? "2" : "Locked"}
          note={
            canUseSecureDelivery ? "2 active syncs" : "Verification pending"
          }
        />
        <Metric
          icon={DownloadSimple}
          label="Secure Deliveries"
          value={canUseSecureDelivery ? "2" : "Locked"}
          note={
            canUseSecureDelivery ? "1 expires soon" : "Verification pending"
          }
        />
      </div>

      {!canUseSecureDelivery ? (
        <div className="dashboard-grid discovery-dashboard-grid">
          <Panel title="Saved tracks" action="Discovery workspace">
            <div className="track-list compact">
              {saved.length ? (
                saved.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    isPlaying={playingId === track.id}
                    saved
                    onPlay={() => togglePlay(track.id)}
                    onSave={() => saveTrack(track.id)}
                    onOpen={() => openTrack(track)}
                    onRequest={() => setView("membership")}
                  />
                ))
              ) : (
                <EmptyState
                  title="No saved tracks yet"
                  text="Explore Music and save protected previews while verification is reviewed."
                  actionLabel="Explore Music"
                  onAction={() => setView("catalog")}
                />
              )}
            </div>
          </Panel>
          <Panel title="Access upgrade" action={verificationLabel}>
            <p>
              Complete your professional profile and request Professional Buyer
              or VIP Sync Access to unlock projects, quotes, contracts,
              payments, and approved secure delivery.
            </p>
            <button
              className="gold-button"
              onClick={() => setView("membership")}
            >
              Review membership
            </button>
          </Panel>
        </div>
      ) : (
        <>
          <section className="vip-dashboard-panel">
            <div>
              <span className="eyebrow">{buyer.accessTier}</span>
              <h2>
                {buyer.accessTier === "VIP Sync Access"
                  ? "Priority licensing workspace"
                  : "Professional licensing workspace"}
              </h2>
              <p>
                {buyer.accessTier === "VIP Sync Access"
                  ? "Private curated tracks, pre-approved terms, concierge review, fast-track licensing, and secure WAV/stems delivery for vetted high-value projects."
                  : "Project workspaces, verified catalog intelligence, quote workflows, contracts, and approved secure delivery for professional sync work."}
              </p>
            </div>
            <div className="metric-grid compact-metrics">
              <Metric
                icon={Sparkle}
                label="VIP Curated Tracks"
                value="18"
                note="Private selections"
              />
              <Metric
                icon={ShieldCheck}
                label="Priority Requests"
                value="3"
                note="Concierge review"
              />
              <Metric
                icon={DownloadSimple}
                label="Approved Downloads"
                value="2"
                note="WAV + stems"
              />
              <Metric
                icon={CalendarBlank}
                label="Membership"
                value="Active"
                note="Renews Sep 2026"
              />
            </div>
          </section>

          <section className="next-steps buyer-priority-queue">
            <div>
              <span className="eyebrow">What needs me</span>
              <h2>Action queue</h2>
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
                {projects.map((project) => (
                  <ProjectCard
                    key={project.name}
                    project={project}
                    onOpen={() => setView("project")}
                  />
                ))}
              </div>
            </Panel>
          </div>

          <div className="dashboard-grid">
            <Panel title="Saved tracks" action="Compare tracks">
              <div className="track-list compact">
                {saved.length ? (
                  saved.map((track) => (
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
                  ))
                ) : (
                  <EmptyState
                    title="No saved tracks yet"
                    text="Explore music and save tracks to compare inside a project."
                    actionLabel="Explore music"
                    onAction={() => setView("catalog")}
                  />
                )}
              </div>
            </Panel>

            <Panel
              title="Submitted Licensing Requests"
              action="Status tracking"
            >
              <div className="request-list">
                {inquiries.map((item) => (
                  <RequestRow key={item.id} item={item} />
                ))}
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
                    {quotes.map((q) => (
                      <tr key={q.id}>
                        <td>
                          <strong>{q.id}</strong>
                        </td>
                        <td>{q.project}</td>
                        <td>{q.track}</td>
                        <td>{q.cost}</td>
                        <td>{q.expires}</td>
                        <td>
                          <span
                            className={`status-badge-inline ${q.status.toLowerCase().replace(" ", "-")}`}
                          >
                            {q.status}
                          </span>
                        </td>
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
                    {payments.map((p) => (
                      <tr key={p.invoice}>
                        <td>
                          <strong>{p.invoice}</strong>
                        </td>
                        <td>{p.project}</td>
                        <td>{p.amount}</td>
                        <td>{p.date}</td>
                        <td>{p.method}</td>
                        <td>
                          <span
                            className={`status-badge-inline ${p.status.toLowerCase().replace(" ", "-")}`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title="Secure Deliveries"
              action="Approved files"
              className="full-width-panel"
            >
              <div className="secure-deliveries-list">
                {deliveries.map((d) => (
                  <div key={d.id} className="delivery-card">
                    <LockKey size={30} />
                    <div className="delivery-card-info">
                      <strong>{d.asset}</strong>
                      <span>
                        {d.fileType} · {d.license}
                      </span>
                      <small>
                        Expires {d.expiry} · {d.count} downloads remaining ·
                        download history tracked
                      </small>
                    </div>
                    <div className="delivery-actions">
                      <button
                        className="gold-button"
                        disabled={!canUseSecureDelivery}
                        onClick={() =>
                          showToast(`Secure download started for ${d.asset}.`)
                        }
                      >
                        <DownloadSimple size={18} />{" "}
                        {canUseSecureDelivery
                          ? "Download"
                          : "Verification required"}
                      </button>
                      <button
                        className="outline-button"
                        disabled={!canUseSecureDelivery}
                        onClick={() =>
                          showToast(`Reissue request submitted for ${d.asset}.`)
                        }
                      >
                        Request Reissue
                      </button>
                      <button
                        className="outline-button"
                        onClick={() => showToast("Viewing terms document...")}
                      >
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
                    <span className="history-proj">
                      <strong>{h.project}</strong>
                    </span>
                    <span className="history-action">{h.action}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </section>
  );
}

function ProjectDetail({
  requestLicense,
  openTrack,
  showToast,
  searchForProject,
}) {
  const projectTracks = tracks.slice(0, 4);
  return (
    <section className="project-page">
      <div
        className="project-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(17,15,12,.88), rgba(17,15,12,.28)), url(${projects[0].image})`,
        }}
      >
        <div className="project-hero-content">
          <span className="eyebrow">Buyer project</span>
          <h2>{projects[0].name}</h2>
          <p>
            VIP project workspace for global brand campaign usage, multi-track
            quote review, rights verification, WAV/stems readiness, and
            fast-track licensing.
          </p>
          <div className="project-meta-strip">
            <span>VIP Sync Access</span>
            <span>Global brand campaign</span>
            <span>Deadline Sep 18</span>
            <span>3 WAV masters ready</span>
          </div>
          <div className="button-row project-hero-actions">
            <button
              className="gold-button vip-access-button"
              onClick={requestLicense}
            >
              <span className="motion-button-label">
                <ShieldCheck size={18} /> Open VIP Licensing Workspace
              </span>
              <span className="vip-acoustic-ripple" aria-hidden="true" />
            </button>
            <button className="outline-button" onClick={searchForProject}>
              <MagnifyingGlass size={18} /> Search for this project
            </button>
            <details className="project-more-actions">
              <summary className="outline-button">More actions</summary>
              <div className="project-more-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => showToast("Multi-track quote request opened.")}
                >
                  <BookmarkSimple size={16} /> Request Multiple Tracks
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => showToast("VIP fast-track review requested.")}
                >
                  <Sparkle size={16} /> Fast-Track Review
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
      <div className="project-workspace-grid">
        <Panel
          title="Track comparison"
          action="4 shortlisted"
          className="track-comparison-panel"
        >
          <div className="comparison-table">
            <div className="comparison-head">
              <span>Track</span>
              <span>Mood</span>
              <span>Rights</span>
              <span>WAV / Stems</span>
              <span />
            </div>
            {projectTracks.map((track) => (
              <button
                className="comparison-row"
                key={track.id}
                onClick={() => openTrack(track)}
              >
                <span>
                  <strong>{track.title}</strong>
                  <small>
                    {track.artist} · {track.duration}
                  </small>
                </span>
                <span>{track.mood}</span>
                <span>
                  {track.rightsData.rightsVerified
                    ? "Verified"
                    : "Review needed"}
                </span>
                <span>
                  {track.assets.wavMaster ? "WAV" : "WAV pending"} ·{" "}
                  {track.assets.stems ? "Stems" : "No stems"}
                </span>
                <Eye size={18} />
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Internal notes" action="Private buyer workflow">
          <div className="note-list project-notes">
            <article>
              <strong>Golden Hours</strong>
              <span>
                Best fit for hero reveal. Check final VO timing before quote
                approval.
              </span>
            </article>
            <article>
              <strong>All That Remains</strong>
              <span>
                Strong alternate, but may be too emotionally heavy for the final
                cut.
              </span>
            </article>
            <textarea placeholder="Add note for creative team..." />
          </div>
        </Panel>
        <Panel title="Licensing status" action="Quote Sent">
          <div className="project-stepper">
            {[
              "Submitted",
              "Under Review",
              "Quote Sent",
              "Payment Pending",
              "Delivered",
            ].map((status, index) => (
              <span key={status} className={index < 3 ? "complete" : ""}>
                {status}
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="Licensing summary" action="Buyer review">
          <div className="license-summary">
            <span>4 tracks selected</span>
            <span>Worldwide paid media</span>
            <span>1 year term</span>
            <span>Non-exclusive</span>
            <span>Protected masters locked</span>
            <span>VIP fast-track available</span>
            <span>Quote expires Sep 12</span>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function ProjectCard({ project, onOpen }) {
  return (
    <article className="project-card">
      <div
        className="project-card-image"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.06), rgba(0,0,0,.3)), url(${project.image})`,
        }}
      />
      <div className="project-card-body">
        <span>{project.status}</span>
        <h3>{project.name}</h3>
        <p>
          {project.type} · {project.tracks} tracks · {project.notes} notes
        </p>
        <button onClick={onOpen}>Open project</button>
      </div>
    </article>
  );
}

function AdminDashboard({
  authUser,
  hasPermission,
  showToast,
  togglePlay,
  playingId,
  setView,
}) {
  const ADMIN_HUB_TABS = [
    "Overview",
    "Tracks",
    "Artists",
    "Inquiries",
    "Buyers",
    "Media",
    "Settings",
  ];
  const [adminTab, setAdminTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY) || "Overview";
      return ADMIN_HUB_TABS.includes(saved) ? saved : "Overview";
    } catch {
      return "Overview";
    }
  });
  const can = (permission) => {
    if (typeof hasPermission === "function") return hasPermission(permission);
    return true;
  };
  const rightsAnalytics = rightsService.getAnalytics();
  const attention = {
    rights: 14,
    quotes: 9,
    vip: 7,
    delivery: 5,
  };
  attention.total =
    attention.rights + attention.quotes + attention.vip + attention.delivery;

  /** In-hub tabs stay here; external tabs open full modules (sidebar-aligned). */
  const hubTabs = [
    ["Overview", true],
    ["Tracks", can("catalog.view") || can("*")],
    ["Artists", can("rights.view") || can("catalog.manage") || can("*")],
    ["Inquiries", can("quotes.view") || can("*")],
    ["Buyers", can("buyers.view") || can("*")],
    ["Media", can("content.manage") || can("*")],
    ["Settings", can("settings.manage") || can("users.manage") || can("*")],
  ]
    .filter(([, allowed]) => allowed)
    .map(([tab]) => tab);

  useEffect(() => {
    if (hubTabs.length && !hubTabs.includes(adminTab)) {
      setAdminTab(hubTabs[0] || "Overview");
    }
  }, [hubTabs.join("|"), adminTab]);

  const moduleShortcuts = [
    (can("delivery.manage") || can("*")) && {
      label: "Secure Delivery",
      view: "admin-deliveries",
      hint: "Full delivery workspace",
    },
    (can("analytics.view") || can("*")) && {
      label: "Analytics",
      view: "admin/analytics",
      hint: "Full analytics & reports",
    },
    (can("audit.view") || can("*")) && {
      label: "Audit Logs",
      view: "admin-audit",
      hint: "Evidence ledger",
    },
    (can("rights.view") || can("*")) && {
      label: "Rights Database",
      view: "admin-rights",
      hint: "Clearance queue",
    },
  ].filter(Boolean);

  useEffect(() => {
    try {
      sessionStorage.setItem(ADMIN_TAB_STORAGE_KEY, adminTab);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent(ADMIN_TAB_EVENT, { detail: { tab: adminTab } }),
    );
  }, [adminTab]);

  const metricGroups = [
    [
      "Catalog Operations",
      [
        [MusicNote, "Total Tracks", "12,842", "Selected catalog"],
        [UsersThree, "Active Artists", "248", "Stewardship list"],
        [Sparkle, "Catalog Value Signals", "1,842", "High demand focus"],
      ],
    ],
    [
      "Buyer Segments",
      [
        [UserCircle, "Professional Buyers", "154", "Approved workspaces"],
        [ShieldCheck, "VIP Buyers", "42", "Priority review active"],
        [FileAudio, "Revenue Pipeline", "$1.8M", "Quote pipeline"],
      ],
    ],
    [
      "Licensing & Delivery",
      [
        [FileAudio, "Licensing Requests", "37", "Active requests"],
        [CheckCircle, "Approved Licenses", "124", "Verified placements"],
        [DownloadSimple, "Secure Deliveries", "84", "Delivered WAV/stems"],
      ],
    ],
    [
      "Rights Intelligence",
      [
        [
          ShieldCheck,
          "Rights Backlog",
          rightsAnalytics.total - rightsAnalytics.fullyVerified,
          "Human review queue",
        ],
        [
          WarningCircle,
          "Missing Ownership",
          rightsAnalytics.missingShares,
          "Share gaps",
        ],
        [
          FileAudio,
          "Blocked Tracks",
          rightsAnalytics.notLicensable,
          "Licensing unavailable",
        ],
      ],
    ],
  ];
  const pipelineItems = [
    ["New", 37, "neutral", "Inquiries"],
    ["In Review", 21, "neutral", "Inquiries"],
    ["Rights Check Needed", 14, "attention", "Tracks"],
    ["Quote Needed", 9, "attention", "Inquiries"],
    ["Quote Sent", 11, "neutral", "Inquiries"],
    ["VIP Priority", 7, "priority", "Buyers"],
    ["Delivery Ready", 5, "ready", null],
  ];
  const activityItems = [
    ["License delivered to VisionTech", "Delivery", "2m ago", "admin-deliveries"],
    [
      "New inquiry from National Geographic",
      "New",
      "10m ago",
      "Inquiries",
    ],
    ["Quote approved for Peak Performance", "Quote", "18m ago", "admin-quotes"],
    [
      "Track uploaded: Midnight Conversations",
      "Asset",
      "26m ago",
      "admin-ingestion",
    ],
    ["Permissions updated", "Audit", "34m ago", "admin-audit"],
  ];
  const priorityItems = [
    {
      title: "Rights checks",
      count: `${attention.rights} blocked`,
      note: "Ownership proof, PRO data, and Preston approvals before licensing eligibility.",
      onClick: () => setAdminTab("Tracks"),
    },
    {
      title: "Quotes needed",
      count: `${attention.quotes} open`,
      note: "Move high-intent buyer requests into quote-ready status.",
      onClick: () => setAdminTab("Inquiries"),
    },
    {
      title: "VIP priority",
      count: `${attention.vip} active`,
      note: "Concierge review, pre-approved terms, and secure delivery for top-tier buyers.",
      onClick: () => setAdminTab("Buyers"),
    },
    {
      title: "Delivery ready",
      count: `${attention.delivery} waiting`,
      note: "Confirm payment or VIP terms before protected master audio is released.",
      onClick: () => setView("admin-deliveries"),
    },
  ];

  const panelMeta = {
    Overview: "Summary hub · open full modules from shortcuts",
    Tracks: "Catalog track operations",
    Artists: "Contributor stewardship queue",
    Inquiries: "Licensing inquiry pipeline",
    Buyers: "Buyer accounts & tiers",
    Media: "Editorial media controls",
    Settings: "Workspace & notification settings",
  };

  const renderAdminPanel = () => {
    if (adminTab === "Artists")
      return <ArtistAdmin showToast={showToast} setView={setView} />;
    if (adminTab === "Inquiries")
      return <InquiryAdmin setView={setView} showToast={showToast} />;
    if (adminTab === "Media")
      return <MediaAdmin showToast={showToast} setView={setView} />;
    if (adminTab === "Buyers")
      return <BuyerAdmin showToast={showToast} setView={setView} />;
    if (adminTab === "Overview")
      return (
        <OverviewAdmin
          showToast={showToast}
          setView={setView}
          setAdminTab={setAdminTab}
        />
      );
    if (adminTab === "Settings") return <SettingsAdmin showToast={showToast} setView={setView} />;
    return (
      <TrackAdmin
        showToast={showToast}
        togglePlay={togglePlay}
        playingId={playingId}
        setView={setView}
      />
    );
  };

  const jumpKpi = (key) => {
    if (key === "rights") setAdminTab("Tracks");
    else if (key === "quotes") setAdminTab("Inquiries");
    else if (key === "vip") setAdminTab("Buyers");
    else if (key === "delivery") setView("admin-deliveries");
  };

  return (
    <section className="admin-page admin-page-compact">
      <nav className="admin-breadcrumb" aria-label="Admin location">
        <button type="button" onClick={() => setAdminTab("Overview")}>
          Admin
        </button>
        <span aria-hidden="true">›</span>
        <strong>{adminTab}</strong>
      </nav>

      <div className="admin-command-bar admin-command-bar-slim">
        <p className="admin-signed-in">
          <span className="eyebrow">Operations hub</span>
          <strong>
            {authUser?.name || "beatmondo team"} ·{" "}
            {authUser?.roleLabel || "Internal"}
          </strong>
          <small>
            {authUser?.mfaEnabled ? "MFA on" : "MFA optional"} · demo
            permissions are client-side only
          </small>
        </p>
        <div
          className="admin-overview-summary admin-kpi-strip"
          aria-label="Org-wide attention summary"
        >
          <button
            type="button"
            className="admin-kpi-chip"
            onClick={() => setAdminTab("Overview")}
          >
            <span>Org-wide total</span>
            <strong>{attention.total}</strong>
          </button>
          <button
            type="button"
            className="admin-kpi-chip"
            onClick={() => jumpKpi("rights")}
          >
            <span>Rights queue</span>
            <strong>{attention.rights}</strong>
          </button>
          <button
            type="button"
            className="admin-kpi-chip"
            onClick={() => jumpKpi("quotes")}
          >
            <span>Quotes open</span>
            <strong>{attention.quotes}</strong>
          </button>
          <button
            type="button"
            className="admin-kpi-chip"
            onClick={() => jumpKpi("vip")}
          >
            <span>VIP active</span>
            <strong>{attention.vip}</strong>
          </button>
          <button
            type="button"
            className="admin-kpi-chip"
            onClick={() => jumpKpi("delivery")}
          >
            <span>Delivery wait</span>
            <strong>{attention.delivery}</strong>
          </button>
        </div>
      </div>

      {adminTab === "Overview" && (
        <div
          className="admin-priority-strip compact"
          aria-label="Priority admin queues"
        >
          {priorityItems.map((item) => (
            <button key={item.title} type="button" onClick={item.onClick}>
              <span>{item.title}</span>
              <strong>{item.count}</strong>
              <small>{item.note}</small>
            </button>
          ))}
        </div>
      )}

      <div className="admin-tabs-row">
        <div className="admin-tabs" role="tablist" aria-label="Admin hub sections">
          {hubTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={adminTab === tab}
              className={adminTab === tab ? "active" : ""}
              onClick={() => setAdminTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        {moduleShortcuts.length > 0 && (
          <div className="admin-module-shortcuts" aria-label="Full operation modules">
            <span className="admin-module-shortcuts-label">Full modules</span>
            {moduleShortcuts.map((item) => (
              <button
                key={item.view}
                type="button"
                className="admin-module-chip"
                title={item.hint}
                onClick={() => setView(item.view)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {adminTab === "Overview" && (
        <>
          <div className="admin-metric-groups admin-metric-groups-overview">
            {metricGroups.map(([group, metrics]) => (
              <section key={group}>
                <h3>{group}</h3>
                <div>
                  {metrics.map(([Icon, label, value, note]) => (
                    <Metric
                      key={label}
                      icon={Icon}
                      label={label}
                      value={value}
                      note={note}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
      <div
        className={`admin-grid ${adminTab === "Tracks" ? "tracks-admin-grid" : ""} ${adminTab !== "Overview" ? "admin-grid-workspace" : ""}`}
      >
        {adminTab === "Overview" && (
          <section className="pipeline-panel">
            <h3>Licensing inquiry pipeline</h3>
            <div className="pipeline">
              {pipelineItems.map(([status, count, tone, target]) => (
                <button
                  key={status}
                  type="button"
                  className={`pipeline-${tone}`}
                  onClick={() => {
                    if (target === null) setView("admin-deliveries");
                    else if (target) setAdminTab(target);
                    else showToast(`Filtered pipeline by ${status}.`);
                  }}
                >
                  <span>{status}</span>
                  <strong>{count}</strong>
                </button>
              ))}
            </div>
          </section>
        )}
        <Panel
          title={
            adminTab === "Overview"
              ? "Music operations"
              : `${adminTab} management`
          }
          action={panelMeta[adminTab] || "Hub section"}
        >
          {renderAdminPanel()}
        </Panel>
        {adminTab === "Overview" && (
          <Panel title="Activity feed" action="Jump to related module">
            <div className="activity-list activity-list-actionable">
              {activityItems.map(([text, tag, time, target]) => (
                <button
                  key={text}
                  type="button"
                  className="activity-row-button"
                  onClick={() => {
                    if (hubTabs.includes(target)) setAdminTab(target);
                    else if (target) setView(target);
                  }}
                >
                  <CheckCircle size={18} />{" "}
                  <span className="activity-copy">
                    {text}
                    <small>{tag}</small>
                  </span>{" "}
                  <span>{time}</span>
                </button>
              ))}
            </div>
            <p className="admin-audit-note">
              Audit trail is simulated in-browser. Use{" "}
              <button
                type="button"
                className="text-action"
                onClick={() => setView("admin-audit")}
              >
                Audit Logs
              </button>{" "}
              for the full evidence ledger.
            </p>
          </Panel>
        )}
      </div>
    </section>
  );
}

function OverviewAdmin({ showToast, setView, setAdminTab }) {
  const cards = [
    [
      Sparkle,
      "Catalog health",
      "94% complete",
      "Published tracks with rights notes, preview audio, and delivery readiness.",
      "Open tracks",
      () => setAdminTab("Tracks"),
    ],
    [
      ShieldCheck,
      "Licensing queue",
      "37 new",
      "New inquiries, quote requests, and approvals awaiting payment confirmation.",
      "Review inquiries",
      () => setAdminTab("Inquiries"),
    ],
    [
      Eye,
      "Private catalog intelligence",
      "42% lift",
      "VIP buyers are saving cinematic instrumentals more often this week.",
      "Open analytics",
      () => setView("admin/analytics"),
    ],
    [
      LockKey,
      "Rights verification backlog",
      "19 blocked",
      "Ownership proof, PRO registry confirmation, contract review, or Preston approval needed.",
      "Open rights database",
      () => setView("admin-rights"),
    ],
  ];
  return (
    <div className="cards-admin overview-action-grid">
      {cards.map(([Icon, title, stat, copy, action, onAction]) => (
        <article key={title}>
          <div className="overview-card-head">
            <Icon size={24} />
            <strong>{stat}</strong>
          </div>
          <h3>{title}</h3>
          <p>{copy}</p>
          <button
            type="button"
            onClick={() => {
              onAction?.();
              showToast(`${title} opened.`);
            }}
          >
            {action}
          </button>
        </article>
      ))}
    </div>
  );
}


function SettingsAdmin({ showToast, setView }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Priority");
  const priorityRank = { High: 0, Medium: 1, Low: 2 };
  const filtered = adminSettingsItems
    .filter((item) => {
      const hay =
        `${item.title} ${item.summary} ${item.status} ${item.chips.join(" ")}`.toLowerCase();
      return !query || hay.includes(query.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === "Name") return a.title.localeCompare(b.title);
      return (
        (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
        a.title.localeCompare(b.title)
      );
    });

  const runReset = () => {
    if (
      !window.confirm(
        "Reset all beatmondo demo data? This restores seeded databases and reloads the app.",
      )
    ) {
      return;
    }
    if (window.resetAllBeatmondoDemoData) {
      window.resetAllBeatmondoDemoData();
      showToast("All beatmondo demo data has been successfully reset.");
      window.location.reload();
    } else {
      showToast("Reset function is not registered.");
    }
  };

  const go = (target, label) => {
    if (!target) return;
    if (target.action === "reset") {
      runReset();
      return;
    }
    showToast(`${label || target.label} opened.`);
    setView?.(target.view);
  };

  return (
    <div className="settings-admin-workspace">
      <div className="inquiry-list-summary" aria-label="Settings hub summary">
        <span>
          <strong>{adminSettingsItems.length}</strong> settings areas
        </span>
        <span>Access · Account · Security · Email · Privacy · Demo reset</span>
        <small>
          Each card opens a full module or account page. Org-wide KPI chips
          above remain commercial pipeline metrics.
        </small>
      </div>
      <div className="artist-admin-toolbar">
        <label>
          Search settings
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Permissions, privacy, email, reset…"
          />
        </label>
        <label>
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Priority</option>
            <option>Name</option>
          </select>
        </label>
        <button
          type="button"
          className="outline-button"
          onClick={() => setView?.("admin/access")}
        >
          Permissions
        </button>
        <button
          type="button"
          className="plain-button"
          onClick={() => setView?.("profile")}
        >
          Profile
        </button>
        <button
          type="button"
          className="plain-button"
          onClick={() => setView?.("admin/email")}
        >
          Email admin
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <GearSix size={28} />
          <h4>No settings match</h4>
          <p>Clear search to see access, security, privacy, and demo tools.</p>
          <button type="button" onClick={() => setQuery("")}>
            Reset search
          </button>
        </div>
      ) : (
        <div className="cards-admin settings-admin-grid">
          {filtered.map((item) => {
            const Icon = item.Icon;
            return (
              <article
                key={item.id}
                className={`settings-admin-card ${item.destructive ? "destructive-panel" : ""}`}
              >
                <div className="buyer-admin-card-head">
                  <Icon
                    size={26}
                    style={
                      item.destructive
                        ? { color: "var(--beatmondo-red)" }
                        : undefined
                    }
                  />
                  <span
                    className={`artist-priority-pill priority-${String(item.priority).toLowerCase()}`}
                  >
                    {item.priority} priority
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div className="request-meta-chips">
                  <span
                    className={
                      item.destructive ? "meta-attention" : "meta-neutral"
                    }
                  >
                    {item.status}
                  </span>
                  {item.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
                <div className="artist-admin-actions">
                  <button
                    type="button"
                    className={
                      item.destructive ? "danger-button" : "gold-button"
                    }
                    onClick={() => go(item.primary, item.primary.label)}
                  >
                    {item.primary.label}
                  </button>
                  {item.secondary && (
                    <button
                      type="button"
                      className="outline-button"
                      onClick={() => go(item.secondary, item.secondary.label)}
                    >
                      {item.secondary.label}
                    </button>
                  )}
                  {item.tertiary && (
                    <button
                      type="button"
                      className="plain-button"
                      onClick={() => go(item.tertiary, item.tertiary.label)}
                    >
                      {item.tertiary.label}
                    </button>
                  )}
                  {item.quaternary && (
                    <button
                      type="button"
                      className="plain-button"
                      onClick={() =>
                        go(item.quaternary, item.quaternary.label)
                      }
                    >
                      {item.quaternary.label}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrackAdmin({ showToast, togglePlay, playingId, setView }) {
  const filters = [
    "All",
    "Rights Review Needed",
    "Verified",
    "Stems Ready",
    "WAV Pending",
    "Preston Pending",
    "Licensing Eligible",
  ];
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const reviewQueue = tracks.filter(
    (track) =>
      !track.rightsData.rightsVerified ||
      !track.rightsData.licensingEligible ||
      track.rightsData.prestonApproval !== "Approved",
  );
  const matchesFilter = (track) => {
    const r = track.rightsData || {};
    const a = track.assets || {};
    switch (activeFilter) {
      case "Rights Review Needed":
        return !r.rightsVerified || r.prestonApproval !== "Approved";
      case "Verified":
        return Boolean(r.rightsVerified);
      case "Stems Ready":
        return Boolean(a.stems);
      case "WAV Pending":
        return !a.wavMaster;
      case "Preston Pending":
        return r.prestonApproval !== "Approved";
      case "Licensing Eligible":
        return Boolean(r.licensingEligible);
      default:
        return true;
    }
  };
  const filteredTracks = tracks.filter((track) => {
    const hay =
      `${track.title} ${track.artist} ${track.id} US-BMO-25-000${track.id}`.toLowerCase();
    const matchesQuery = !query || hay.includes(query.toLowerCase());
    return matchesQuery && matchesFilter(track);
  });
  return (
    <div className="track-ops">
      <div className="track-admin-toolbar">
        <input
          aria-label="Search tracks"
          placeholder="Search tracks, artists, ISRC..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            showToast("Opening internal track ingestion.");
            setView?.("admin-ingestion");
          }}
        >
          <CloudArrowUp size={18} /> Add Track
        </button>
      </div>
      <div className="track-filter-row" role="toolbar" aria-label="Track filters">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={activeFilter === filter ? "active" : ""}
            aria-pressed={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <p className="admin-inline-hint">
        Showing {filteredTracks.length} of {tracks.length} catalog tracks
        {activeFilter !== "All" ? ` · filter: ${activeFilter}` : ""}
        {query ? ` · search: “${query}”` : ""}.
      </p>
      <div className="track-ops-grid">
        <div className="track-operation-list">
          {filteredTracks.length === 0 ? (
            <div className="admin-empty-state">
              <MusicNote size={28} />
              <h4>No tracks match</h4>
              <p>Clear search or choose another filter.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveFilter("All");
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredTracks.map((track) => (
            <article
              className={`track-operation-row ${track.rightsData.licensingEligible ? "eligible" : "blocked"}`}
              key={track.id}
            >
              <div className="track-op-main">
                <button
                  className="mini-play"
                  aria-label={`${playingId === track.id ? "Pause" : "Preview"} ${track.title}`}
                  onClick={() => togglePlay(track.id)}
                >
                  {playingId === track.id ? (
                    <Pause size={14} weight="fill" />
                  ) : (
                    <Play size={14} weight="fill" />
                  )}
                </button>
                <div>
                  <strong>{track.title}</strong>
                  <span>
                    {track.artist} · ISRC US-BMO-25-000{track.id}
                  </span>
                </div>
              </div>
              <div className="track-op-badges">
                <span
                  className={
                    track.rightsData.rightsVerified
                      ? "state-good"
                      : "state-risk"
                  }
                >
                  {track.rightsData.ownershipProof}
                </span>
                <span>
                  {track.rightsData.proAffiliation} ·{" "}
                  {track.rightsData.registrationId}
                </span>
                <span
                  className={
                    track.rightsData.prestonApproval === "Approved"
                      ? "state-good"
                      : "state-risk"
                  }
                >
                  Preston {track.rightsData.prestonApproval}
                </span>
                <span
                  className={
                    track.rightsData.licensingEligible
                      ? "state-good"
                      : "state-risk"
                  }
                >
                  {track.rightsData.licensingEligible
                    ? "Licensing Eligible"
                    : "Not Eligible"}
                </span>
              </div>
              <div className="asset-chip-row">
                <span
                  className={track.assets.preview ? "state-good" : "state-risk"}
                >
                  Preview
                </span>
                <span
                  className={
                    track.assets.wavMaster ? "state-good" : "state-risk"
                  }
                >
                  WAV
                </span>
                <span
                  className={track.assets.stems ? "state-good" : "state-warn"}
                >
                  Stems
                </span>
                <span
                  className={
                    track.assets.instrumental ? "state-good" : "state-warn"
                  }
                >
                  Instrumental
                </span>
              </div>
              <div className="owner-stack">
                <span>Master: {track.rightsData.masterOwner}</span>
                <span>Publishing: {track.rightsData.publishingOwner}</span>
              </div>
              <div className="track-op-actions">
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Rights review opened for ${track.title}.`);
                    setView?.("admin-rights");
                  }}
                >
                  Review rights
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Asset manager opened for ${track.title}.`);
                    setView?.("admin-storage");
                  }}
                >
                  Assets
                </button>
                <button type="button" onClick={() => togglePlay(track.id)}>
                  {playingId === track.id ? "Pause" : "Preview"}
                </button>
              </div>
            </article>
            ))
          )}
        </div>
        <aside className="rights-review-queue">
          <span className="eyebrow">Rights review queue</span>
          <h3>Blocked tracks need action</h3>
          {reviewQueue.length === 0 ? (
            <p className="admin-inline-hint">No blocked tracks in the current catalog sample.</p>
          ) : (
            reviewQueue.map((track) => (
            <article key={track.id}>
              <strong>{track.title}</strong>
              <span>
                {track.rightsData.contractStatus} · Preston{" "}
                {track.rightsData.prestonApproval}
              </span>
              <button
                type="button"
                onClick={() => {
                  showToast(`Priority review opened for ${track.title}.`);
                  setView?.("admin-rights");
                }}
              >
                Open rights review
              </button>
            </article>
            ))
          )}
        </aside>
      </div>
      <div className="file-separation upload-control-grid">
        <button
          type="button"
          onClick={() => {
            showToast("Opening preview asset workflow via storage.");
            setView?.("admin-storage");
          }}
        >
          <FileAudio size={24} />
          <strong>Preview Audio</strong>
          <p>
            Upload compressed, watermarked preview streams for approved buyers.
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            showToast("Opening protected master workflow via storage.");
            setView?.("admin-storage");
          }}
        >
          <LockKey size={24} />
          <strong>WAV Master</strong>
          <p>
            Upload encrypted protected master audio for approved delivery only.
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            showToast("Opening stems workflow via storage.");
            setView?.("admin-storage");
          }}
        >
          <CloudArrowUp size={24} />
          <strong>Stems / Alternate Mixes</strong>
          <p>
            Manage stems, instrumentals, loop edits, cue versions, and delivery
            readiness.
          </p>
        </button>
      </div>
    </div>
  );
}

function ArtistAdmin({ showToast, setView }) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [sort, setSort] = useState("Priority");
  const stages = [
    "All stages",
    ...new Set(artists.map((artist) => artist.stage || "Unassigned")),
  ];
  const priorityRank = { High: 0, Medium: 1, Low: 2 };
  const filtered = artists
    .filter((artist) => {
      const hay = `${artist.name} ${artist.credit} ${artist.stage}`.toLowerCase();
      const matchesQuery = !query || hay.includes(query.toLowerCase());
      const matchesStage =
        stageFilter === "All stages" || artist.stage === stageFilter;
      return matchesQuery && matchesStage;
    })
    .sort((a, b) => {
      if (sort === "Name") return a.name.localeCompare(b.name);
      if (sort === "Tracks") return (b.tracks || 0) - (a.tracks || 0);
      return (
        (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
        a.name.localeCompare(b.name)
      );
    });

  return (
    <div className="artist-admin-workspace">
      <div className="artist-admin-toolbar">
        <label>
          Search artists
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, stage, or description"
          />
        </label>
        <label>
          Stage
          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
          >
            {stages.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option>Priority</option>
            <option>Name</option>
            <option>Tracks</option>
          </select>
        </label>
        <button
          type="button"
          className="outline-button"
          onClick={() => setView("admin-ingestion")}
        >
          Open ingestion queue
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <UsersThree size={28} />
          <h4>No artists match these filters</h4>
          <p>Clear search or choose another stage to continue stewardship review.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStageFilter("All stages");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="cards-admin artist-admin-grid">
          {filtered.map((artist) => {
            const openItems = artist.openItems ?? artist.tracks ?? 0;
            const primaryLabel =
              openItems === 1 ? "Review track" : `Review queue (${openItems})`;
            return (
              <article key={artist.name} className="artist-admin-card">
                <div
                  className="portrait small"
                  style={{ backgroundImage: `url(${artist.image})` }}
                  role="img"
                  aria-label={artist.name}
                />
                <div className="artist-admin-card-head">
                  <h3>{artist.name}</h3>
                  <span
                    className={`artist-priority-pill priority-${String(artist.priority || "Medium").toLowerCase()}`}
                  >
                    {artist.priority || "Medium"} priority
                  </span>
                </div>
                <p>{artist.credit}</p>
                <div className="artist-admin-meta">
                  <span className="artist-stage-pill">
                    {artist.stage || "Unassigned"}
                  </span>
                  <span>
                    {artist.tracks} submitted track
                    {artist.tracks === 1 ? "" : "s"}
                  </span>
                  <span>
                    {openItems} open review item{openItems === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="artist-admin-actions">
                  <button
                    type="button"
                    className="gold-button"
                    onClick={() => {
                      showToast(
                        `${primaryLabel} opened for ${artist.name}. Admin hub stays available from the sidebar.`,
                      );
                      setView("admin-ingestion");
                    }}
                  >
                    {primaryLabel}
                  </button>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => {
                      showToast(`Artist profile preview for ${artist.name}.`);
                      setView("artist");
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    className="plain-button"
                    onClick={() => {
                      showToast(`Rights context for ${artist.name}.`);
                      setView("admin-rights");
                    }}
                  >
                    Rights
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function inquiryPrimaryAction(item) {
  switch (item.status) {
    case "Quote Needed":
      return {
        label: "Create quote",
        view: "admin-quotes-new",
        toast: `Quote draft workspace opened for ${item.company}.`,
      };
    case "Quote Sent":
      return {
        label: "Open quote",
        view: "admin-quotes",
        toast: `Quote follow-up for ${item.company}.`,
      };
    case "Rights Check Needed":
      return {
        label: "Review rights",
        view: "admin-rights",
        toast: `Rights review for ${item.track} · ${item.company}.`,
      };
    case "Approved":
      return {
        label: "Prepare delivery",
        view: "admin-deliveries",
        toast: `Delivery prep for ${item.company}.`,
      };
    default:
      return {
        label: "Open quotes",
        view: "admin-quotes",
        toast: `Commercial workspace for ${item.company}.`,
      };
  }
}

function InquiryAdmin({ setView, showToast }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sort, setSort] = useState("Deadline");
  const statuses = [
    "All statuses",
    ...new Set(inquiries.map((item) => item.status)),
  ];
  const statusWeight = {
    "Rights Check Needed": 0,
    "Quote Needed": 1,
    "Quote Sent": 2,
    Approved: 3,
  };
  const filtered = inquiries
    .filter((item) => {
      const hay =
        `${item.company} ${item.track} ${item.type} ${item.id} ${item.buyerTier} ${item.status}`.toLowerCase();
      const matchesQuery = !query || hay.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "All statuses" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => {
      if (sort === "Company") return a.company.localeCompare(b.company);
      if (sort === "Status")
        return (
          (statusWeight[a.status] ?? 9) - (statusWeight[b.status] ?? 9) ||
          a.company.localeCompare(b.company)
        );
      const day = (value) => {
        const match = String(value || "").match(/(\d{1,2})/);
        return match ? Number(match[1]) : 99;
      };
      return day(a.deadline) - day(b.deadline);
    });
  const listStats = {
    total: inquiries.length,
    quoteNeeded: inquiries.filter((i) => i.status === "Quote Needed").length,
    rights: inquiries.filter((i) => i.status === "Rights Check Needed").length,
    quoteSent: inquiries.filter((i) => i.status === "Quote Sent").length,
    approved: inquiries.filter((i) => i.status === "Approved").length,
  };

  return (
    <div className="inquiry-admin-workspace">
      <div className="inquiry-list-summary" aria-label="This hub list">
        <span>
          <strong>{listStats.total}</strong> in this hub list
        </span>
        <span>{listStats.rights} rights blocked</span>
        <span>{listStats.quoteNeeded} quote needed</span>
        <span>{listStats.quoteSent} quote sent</span>
        <span>{listStats.approved} approved</span>
        <small>Top KPI chips are org-wide pipeline, not this list alone.</small>
      </div>
      <div className="artist-admin-toolbar">
        <label>
          Search inquiries
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Company, track, ID, tier…"
          />
        </label>
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Deadline</option>
            <option>Status</option>
            <option>Company</option>
          </select>
        </label>
        <button
          type="button"
          className="outline-button"
          onClick={() => setView?.("admin-quotes")}
        >
          Open quote calculation
        </button>
        <button
          type="button"
          className="plain-button"
          onClick={() => setView?.("admin-quotes-new")}
        >
          New quote
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <FileText size={28} />
          <h4>No inquiries match these filters</h4>
          <p>Clear search or choose another status to continue the pipeline.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("All statuses");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="request-list inquiry-request-list">
          {filtered.map((item) => (
            <RequestRow
              key={item.id}
              item={item}
              detailed
              actionable
              setView={setView}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const adminBuyers = [
  {
    id: "buyer-aster",
    name: "Aster Studio",
    tier: "VIP Sync Access",
    status: "Active",
    support: "Concierge assigned",
    contact: "Morgan Ellis",
    openProjects: 6,
    openQuotes: 2,
    verification: "Verified",
    focus: "VIP concierge + pre-approved terms",
    priority: "High",
  },
  {
    id: "buyer-northline",
    name: "Northline Pictures",
    tier: "Professional Buyer",
    status: "Verified",
    support: "Standard support",
    contact: "Priya Shah",
    openProjects: 3,
    openQuotes: 1,
    verification: "Verified",
    focus: "Active licensing pipeline",
    priority: "Medium",
  },
  {
    id: "buyer-cobalt",
    name: "Cobalt Agency",
    tier: "Discovery Access",
    status: "Entry approval",
    support: "Upgrade candidate",
    contact: "Jordan Blake",
    openProjects: 1,
    openQuotes: 0,
    verification: "In review",
    focus: "Awaiting professional verification",
    priority: "High",
  },
];

function buyerPrimaryAction(buyer) {
  if (
    buyer.status === "Entry approval" ||
    buyer.verification === "In review"
  ) {
    return {
      label: "Review verification",
      view: "admin-verifications",
      toast: `Verification queue opened for ${buyer.name}.`,
    };
  }
  if (buyer.tier === "VIP Sync Access") {
    return {
      label: "VIP workspace",
      view: "admin-quotes",
      toast: `VIP commercial workspace for ${buyer.name}.`,
    };
  }
  if (buyer.openQuotes > 0) {
    return {
      label: `Open quotes (${buyer.openQuotes})`,
      view: "admin-quotes",
      toast: `Quotes for ${buyer.name}.`,
    };
  }
  return {
    label: "Open commercial tools",
    view: "admin-quotes",
    toast: `Commercial tools for ${buyer.name}.`,
  };
}

function BuyerAdmin({ showToast, setView }) {
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("All tiers");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sort, setSort] = useState("Priority");
  const tiers = ["All tiers", ...new Set(adminBuyers.map((b) => b.tier))];
  const statuses = [
    "All statuses",
    ...new Set(adminBuyers.map((b) => b.status)),
  ];
  const priorityRank = { High: 0, Medium: 1, Low: 2 };
  const filtered = adminBuyers
    .filter((buyer) => {
      const hay =
        `${buyer.name} ${buyer.tier} ${buyer.status} ${buyer.contact} ${buyer.support}`.toLowerCase();
      const matchesQuery = !query || hay.includes(query.toLowerCase());
      const matchesTier =
        tierFilter === "All tiers" || buyer.tier === tierFilter;
      const matchesStatus =
        statusFilter === "All statuses" || buyer.status === statusFilter;
      return matchesQuery && matchesTier && matchesStatus;
    })
    .sort((a, b) => {
      if (sort === "Name") return a.name.localeCompare(b.name);
      if (sort === "Tier") return a.tier.localeCompare(b.tier);
      return (
        (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
        a.name.localeCompare(b.name)
      );
    });
  const listStats = {
    total: adminBuyers.length,
    vip: adminBuyers.filter((b) => b.tier.includes("VIP")).length,
    professional: adminBuyers.filter((b) =>
      b.tier.includes("Professional"),
    ).length,
    discovery: adminBuyers.filter((b) => b.tier.includes("Discovery")).length,
    verification: adminBuyers.filter(
      (b) =>
        b.verification === "In review" || b.status === "Entry approval",
    ).length,
  };

  return (
    <div className="buyer-admin-workspace">
      <div className="inquiry-list-summary" aria-label="This hub buyer list">
        <span>
          <strong>{listStats.total}</strong> in this hub list
        </span>
        <span>{listStats.vip} VIP</span>
        <span>{listStats.professional} professional</span>
        <span>{listStats.discovery} discovery</span>
        <span>{listStats.verification} need verification</span>
        <small>
          Top KPI “VIP active” is org-wide pipeline, not this short hub sample.
        </small>
      </div>
      <div className="artist-admin-toolbar">
        <label>
          Search buyers
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Org, contact, tier, status…"
          />
        </label>
        <label>
          Tier
          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
          >
            {tiers.map((tier) => (
              <option key={tier}>{tier}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Priority</option>
            <option>Name</option>
            <option>Tier</option>
          </select>
        </label>
        <button
          type="button"
          className="outline-button"
          onClick={() => setView?.("admin-verifications")}
        >
          Verification queue
        </button>
        <button
          type="button"
          className="plain-button"
          onClick={() => setView?.("admin-memberships")}
        >
          Membership ops
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <UsersThree size={28} />
          <h4>No buyers match these filters</h4>
          <p>Clear search or change tier/status to continue account review.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTierFilter("All tiers");
              setStatusFilter("All statuses");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="cards-admin buyer-admin-grid">
          {filtered.map((buyer) => {
            const primary = buyerPrimaryAction(buyer);
            return (
              <article key={buyer.id} className="buyer-admin-card">
                <div className="buyer-admin-card-head">
                  <UsersThree size={26} />
                  <span
                    className={`artist-priority-pill priority-${String(buyer.priority).toLowerCase()}`}
                  >
                    {buyer.priority} priority
                  </span>
                </div>
                <h3>{buyer.name}</h3>
                <p>{buyer.focus}</p>
                <div className="request-meta-chips" aria-label="Buyer details">
                  <span>{buyer.tier}</span>
                  <span
                    className={
                      buyer.status === "Entry approval"
                        ? "meta-attention"
                        : "meta-good"
                    }
                  >
                    {buyer.status}
                  </span>
                  <span
                    className={
                      buyer.verification === "Verified"
                        ? "meta-good"
                        : "meta-attention"
                    }
                  >
                    {buyer.verification}
                  </span>
                  <span>{buyer.support}</span>
                  <span>Contact: {buyer.contact}</span>
                  <span>
                    {buyer.openProjects} project
                    {buyer.openProjects === 1 ? "" : "s"}
                  </span>
                  <span>
                    {buyer.openQuotes} open quote
                    {buyer.openQuotes === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="artist-admin-actions">
                  <button
                    type="button"
                    className="gold-button"
                    onClick={() => {
                      showToast(primary.toast);
                      setView?.(primary.view);
                    }}
                  >
                    {primary.label}
                  </button>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() =>
                      showToast(
                        `Account summary for ${buyer.name} (prototype — no CRM).`,
                      )
                    }
                  >
                    Account note
                  </button>
                  <button
                    type="button"
                    className="plain-button"
                    onClick={() => {
                      showToast(`Payments context for ${buyer.name}.`);
                      setView?.("admin-payments");
                    }}
                  >
                    Payments
                  </button>
                  <button
                    type="button"
                    className="plain-button"
                    onClick={() => {
                      showToast(`Delivery packages for ${buyer.name}.`);
                      setView?.("admin-deliveries");
                    }}
                  >
                    Deliveries
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}


function MediaAdmin({ showToast, setView }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Priority");
  const priorityRank = { High: 0, Medium: 1, Low: 2 };
  const filtered = adminMediaItems
    .filter((item) => {
      const hay =
        `${item.title} ${item.summary} ${item.status} ${item.chips.join(" ")}`.toLowerCase();
      return !query || hay.includes(query.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === "Name") return a.title.localeCompare(b.title);
      return (
        (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
        a.title.localeCompare(b.title)
      );
    });

  return (
    <div className="media-admin-workspace">
      <div className="inquiry-list-summary" aria-label="Editorial media summary">
        <span>
          <strong>{adminMediaItems.length}</strong> editorial surfaces
        </span>
        <span>Stories · Episodes · Hub · Legacy</span>
        <small>
          These open the live editorial pages. Org-wide KPI chips above are
          commercial pipeline metrics, not editorial counts.
        </small>
      </div>
      <div className="artist-admin-toolbar">
        <label>
          Search media surfaces
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Stories, episodes, legacy…"
          />
        </label>
        <label>
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Priority</option>
            <option>Name</option>
          </select>
        </label>
        <button
          type="button"
          className="outline-button"
          onClick={() => setView?.("content")}
        >
          Editorial hub
        </button>
        <button
          type="button"
          className="plain-button"
          onClick={() => setView?.("stories")}
        >
          Stories
        </button>
        <button
          type="button"
          className="plain-button"
          onClick={() => setView?.("media")}
        >
          Episodes
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <FilmSlate size={28} />
          <h4>No media surfaces match</h4>
          <p>Clear search to see stories, episodes, hub, and legacy.</p>
          <button type="button" onClick={() => setQuery("")}>
            Reset search
          </button>
        </div>
      ) : (
        <div className="cards-admin media-admin-grid">
          {filtered.map((item) => {
            const Icon = item.Icon;
            return (
              <article key={item.id} className="media-admin-card">
                <div className="buyer-admin-card-head">
                  <Icon size={26} />
                  <span
                    className={`artist-priority-pill priority-${String(item.priority).toLowerCase()}`}
                  >
                    {item.priority} priority
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div className="request-meta-chips">
                  <span className="meta-neutral">{item.status}</span>
                  {item.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
                <div className="artist-admin-actions">
                  <button
                    type="button"
                    className="gold-button"
                    onClick={() => {
                      showToast(`${item.title} opened.`);
                      setView?.(item.view);
                    }}
                  >
                    {item.primary}
                  </button>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => {
                      showToast(`${item.secondaryLabel} opened.`);
                      setView?.(item.secondaryView);
                    }}
                  >
                    {item.secondaryLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}


function ContentPages({ setView, showToast, openArtistProfile }) {
  const hubCards = [
    [
      "The Slambovian Circus of Dreams",
      "Artist Story",
      "A theatrical psychedelic-Americana world introduced through archival promotional media while track rights remain under review.",
      img.slambovianCard,
      "slambovian",
    ],
    [
      "Short Sync Clips",
      "30 sec",
      "Fast editorial cuts for high-intent discovery, social context, and sync-ready catalog moments.",
      img.mediaDesk,
      "media",
    ],
    [
      "Story Library",
      "Features",
      "Rights-aware essays, artist context, Gary Burke legacy notes, and buyer-facing catalog stories.",
      img.privateStudio,
      "stories",
    ],
    [
      "Media Episodes",
      "Episodes",
      "Artist stories, studio sessions, licensing conversations, catalog highlights, VIP picks, and legacy clips.",
      img.soulVocal,
      "media",
    ],
    [
      "VIP Picks",
      "Private",
      "Curated premium selections and catalog intelligence for vetted buyers and strategic sync opportunities.",
      img.supervisorSuite,
      "media",
    ],
    [
      "Gary Burke Legacy",
      "Archive",
      "Original brand spirit, archive memories, collaborator notes, and legacy-aware editorial context.",
      img.musicArchive,
      "legacy",
    ],
    [
      "Catalog Highlights",
      "15 sec",
      "Quick, visual entry points into tracks with strong sync potential, stems, and rights context.",
      img.scoringStage,
      "media",
    ],
  ];
  const pathways = [
    ["Stories", "Browse the editorial library", "stories"],
    ["Media Episodes", "Open the media library", "media"],
    ["Gary Burke Legacy", "Visit the archive", "legacy"],
  ];
  return (
    <section className="content-page editorial-hub-page">
      <div className="editorial-hub-grid">
        <article
          className="editorial-hub-hero"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(13,9,8,.90), rgba(13,9,8,.42)), url(${img.supervisorSuite})`,
          }}
        >
          <span className="feature-story-kicker">
            Hub · Stories · Clips · Catalog intelligence
          </span>
          <span className="eyebrow">Editorial Hub</span>
          <h2>Stories, clips, and catalog context for serious sync buyers.</h2>
          <p>
            Editorial context, short-form sync clips, artist stories, legacy
            notes, and media conversations designed to help vetted buyers
            understand the music behind the catalog.
          </p>
          <div className="button-row">
            <button className="gold-button" onClick={() => setView("stories")}>
              <Article size={18} /> Browse Stories
            </button>
            <button className="outline-button" onClick={() => setView("media")}>
              <FilmSlate size={18} /> Watch Media Episodes
            </button>
            <button
              className="merchandise-button"
              onClick={() => setView("merchandise")}
            >
              <ShoppingBag size={18} /> Merchandise
            </button>
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
            <button
              key={title}
              className="hub-card"
              onClick={() => {
                if (target === "slambovian")
                  openArtistProfile("The Slambovian Circus of Dreams");
                else if (target === "legacy") setView("legacy");
                else setView(target);
              }}
            >
              <span
                className="hub-card-image"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,.05), rgba(0,0,0,.5)), url(${image})`,
                }}
              />
              <span className="hub-card-body">
                <small>{duration}</small>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="content-archive-note">
          Short clips are designed for fast discovery and social engagement;
          longer pieces are reserved for standout artist, catalog, licensing,
          VIP, and legacy stories.
        </p>
      </div>
    </section>
  );
}

function StoriesPage({ setView, showToast, openArtistProfile }) {
  const [selectedStory, setSelectedStory] = useState(
    "Inside the strange, vivid world of the Slambovians",
  );
  const stories = [
    [
      "Inside the strange, vivid world of the Slambovians",
      "2 min artist story",
      "A theatrical live identity, psychedelic imagery, and a rights-aware path from editorial discovery to separately verified tracks.",
      img.slambovianHero,
      [],
      "The Slambovian Circus of Dreams",
    ],
    [
      "The musicians behind unforgettable sounds",
      "2 min feature",
      "Provenance, collaborators, recording context, and why the work matters to buyers.",
      img.soulVocal,
      [1, 3, 5],
    ],
    [
      "How rights-aware discovery protects the creative process",
      "45 sec",
      "A concise guide to usage, territory, term, exclusivity, and quote readiness.",
      img.supervisorSuite,
      [2, 4, 6],
    ],
    [
      "Gary Burke and the catalog as a living archive",
      "2 min feature",
      "A respectful look at the original beatmondo spirit, studio memories, lowercase identity, and musician-led stewardship.",
      img.musicArchive,
      [15, 1, 7],
    ],
    [
      "What supervisors save before they request a quote",
      "30 sec",
      "Signals from buyer shortlists: emotional fit, edit flexibility, vocal context, and clearance confidence.",
      img.privateStudio,
      [1, 2, 8],
    ],
  ];
  const active =
    stories.find(([title]) => title === selectedStory) || stories[0];
  const relatedTracks = (active[4] || [])
    .map((id) => tracks.find((track) => track.id === id))
    .filter(Boolean);

  return (
    <section className="content-page stories-page">
      <div className="content-grid">
        <article
          className="feature-story"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.20), rgba(0,0,0,.72)), url(${active[3]})`,
          }}
        >
          <span className="feature-story-kicker">
            {active[1]} · Rights-aware editorial
          </span>
          <span className="eyebrow">Stories</span>
          <h2>{active[0]}</h2>
          <p>{active[2]}</p>
          <div className="button-row story-hero-actions">
            <button
              className="gold-button"
              onClick={() => {
                if (active[5]) openArtistProfile(active[5]);
                else showToast(`Opened "${active[0]}" in the story reader.`);
              }}
            >
              <Article size={18} /> {active[5] ? "View Artist Story" : "Open Story"}
            </button>
            <button className="text-action" onClick={() => setView("media")}>
              Related Media
            </button>
            <button className="text-action" onClick={() => setView("catalog")}>
              Explore Music
            </button>
          </div>
        </article>
        <Panel title="Related tracks" action="From this story">
          <div className="editorial-related-tracks">
            {relatedTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                className="editorial-related-track"
                onClick={() => {
                  window.location.hash = `track/${track.id}`;
                }}
              >
                <strong>{track.title}</strong>
                <span>
                  {track.artist} · {track.mood}
                </span>
                <small>
                  {track.availability}
                  {track.id === FEATURED_TRACK_ID ? " · Rights review" : ""}
                </small>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Editorial library" action="Selectable">
          <div className="state-grid">
            {stories.map(([title, category]) => (
              <button
                key={title}
                className={`chip-button ${selectedStory === title ? "active" : ""}`}
                onClick={() => setSelectedStory(title)}
              >
                {category}: {title}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Reader notes" action="Buyer context">
          <div className="note-list project-notes">
            <article>
              <strong>Why it matters</strong>
              <span>
                Stories add provenance, usage context, and artist credibility
                before a buyer starts a license request.
              </span>
            </article>
            <article>
              <strong>Editorial status</strong>
              <span>
                Reviewed for rights language, archive sensitivity, and
                buyer-facing clarity.
              </span>
            </article>
          </div>
        </Panel>
        <Panel title="Story pathways" action="Discovery">
          <div className="state-grid">
            {[
              "Licensing Education",
              "Artist Stories",
              "Behind the Catalog",
              "Gary Burke Legacy",
              "Sync Licensing Insights",
            ].map((title) => (
              <button
                key={title}
                className="chip-button"
                onClick={() => showToast(`Story pathway filtered to ${title}.`)}
              >
                {title}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function MediaEpisodesPage({ setView, showToast, openArtistProfile }) {
  const [selectedEpisode, setSelectedEpisode] = useState(
    "The Slambovian Circus of Dreams — 2022 Teaser",
  );
  const episodes = [
    [
      "The Slambovian Circus of Dreams — 2022 Teaser",
      "A theatrical psychedelic-Americana artist introduction presented as archival promotional media, separate from track-level licensing readiness.",
      "1 min 59 sec",
      img.slambovianHero,
      slambovianMedia.teaser,
      slambovianMedia.teaserCaptions,
    ],
    [
      "Short Sync Clips",
      "Fast 15-45 second clips for premium discovery, social engagement, and high-intent music moments.",
      "30 sec",
      img.mediaDesk,
    ],
    [
      "Artist Stories",
      "Vocal texture, writing rooms, and the human story behind licensable tracks.",
      "2 min feature",
      img.soulVocal,
    ],
    [
      "Studio Sessions",
      "Recording context, stems, session notes, and the craft behind songs that still feel alive.",
      "45 sec",
      img.privateStudio,
    ],
    [
      "Licensing Conversations",
      "Supervisors, producers, and catalog partners discuss quote context and rights confidence.",
      "2 min feature",
      img.supervisorSuite,
    ],
    [
      "Catalog Highlights",
      "Private selections, VIP picks, and high-value tracks with strong sync potential.",
      "15 sec",
      img.scoringStage,
    ],
    [
      "Legacy Clips",
      "Short archive-led moments honoring Gary Burke and the original beatmondo spirit.",
      "45 sec",
      img.musicArchive,
    ],
  ];
  const active =
    episodes.find(([title]) => title === selectedEpisode) || episodes[0];

  return (
    <section className="content-page media-page">
      <div className="content-grid">
        <article
          className="feature-story"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.70)), url(${active[3]})`,
          }}
        >
          <span className="feature-story-kicker">
            Episode · {active[2]} ·{" "}
            <span className="brand-name">beatmondo</span> Media
          </span>
          <span className="eyebrow">Media Episodes</span>
          <h2>{active[0]}</h2>
          <p>{active[1]}</p>
          <div className="button-row story-hero-actions">
            <button
              className="gold-button sound-ring-button"
              onClick={() => {
                if (active[4])
                  document
                    .getElementById("featured-media-episode")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                else showToast(`Playing preview for ${active[0]}.`);
              }}
            >
              <Play size={18} weight="fill" /> Play Episode
            </button>
            <button className="text-action" onClick={() => setView("stories")}>
              Episode Notes
            </button>
            <button className="text-action" onClick={() => setView("catalog")}>
              Explore related music
            </button>
          </div>
        </article>
        {active[4] && (
          <section
            id="featured-media-episode"
            className="editorial-episode-player"
            aria-label={`${active[0]} player`}
          >
            <video
              controls
              playsInline
              preload="metadata"
              poster={active[3]}
              aria-label={active[0]}
            >
              <source src={active[4]} type="video/mp4" />
              <track
                kind="captions"
                src={active[5]}
                srcLang="en"
                label="English"
                default
              />
            </video>
            <div>
              <span className="eyebrow">Editorial media boundary</span>
              <h3>Artist identity, not licensing evidence.</h3>
              <p>
                The episode introduces the band without treating the montage as
                a protected track preview. Individual recordings enter Explore
                Music only after separate rights and metadata review.
              </p>
              <button
                className="outline-button"
                onClick={() =>
                  openArtistProfile("The Slambovian Circus of Dreams")
                }
              >
                View Artist Profile
              </button>
            </div>
          </section>
        )}
        <Panel title="Episode library" action="Selectable">
          <div className="state-grid">
            {episodes.map(([title, text, duration]) => (
              <button
                key={title}
                className={`chip-button ${selectedEpisode === title ? "active" : ""}`}
                onClick={() => setSelectedEpisode(title)}
              >
                {title} · {duration}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Featured listening" action="Commerce path">
          <div className="editorial-related-tracks">
            {tracks.slice(0, 3).map((track) => (
              <button
                key={track.id}
                type="button"
                className="editorial-related-track"
                onClick={() => {
                  window.location.hash = `track/${track.id}`;
                }}
              >
                <strong>{track.title}</strong>
                <span>
                  {track.artist} · {getPlayableDuration(track)} preview
                </span>
                <small>{track.availability}</small>
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
          <p>
            Use the contact page for media inquiries, guest suggestions,
            partnership conversations, and archive contributions.
          </p>
          <button className="outline-button" onClick={() => setView("contact")}>
            <UsersThree size={18} /> Contact beatmondo
          </button>
        </Panel>
      </div>
    </section>
  );
}

function ContactPage({ setView }) {
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState("Licensing");
  const topics = [
    {
      name: "Licensing",
      route: "Licensing team",
      next: "Use the licensing form when a track, usage, budget, and timing are already known.",
      note: "Best for quote questions, usage clarification, and project timing.",
      action: "Open Licensing / Access",
    },
    {
      name: "Buyer Access",
      route: "Access review",
      next: "Buyer role, company, and intended use are reviewed before workspace permissions are enabled.",
      note: "Best for music supervisors, producers, agencies, and brand teams.",
    },
    {
      name: "VIP Sync Access",
      route: "VIP concierge",
      next: "VIP requests are reviewed for buyer fit, project value, and premium access eligibility.",
      note: "Best for studios, luxury brands, high-value agencies, and strategic sync buyers.",
    },
    {
      name: "Artist / Contributor",
      route: "Contributor review",
      next: "Submissions require metadata, ownership proof, PRO details, and approval before licensing representation.",
      note: "Artists cannot publish directly into the live catalog.",
    },
    {
      name: "Rights / Catalog",
      route: "Rights review",
      next: "Catalog submissions are reviewed privately for ownership, contracts, registry data, and eligibility.",
      note: "Rights and catalog materials stay private during review.",
    },
    {
      name: "Strategic Partner",
      route: "Partnerships",
      next: "Partnership notes are routed for catalog value, market fit, and long-term opportunity review.",
      note: "Best for catalog owners, investors, and global commercial partners.",
    },
    {
      name: "Media",
      route: "Editorial team",
      next: "Media notes, guest ideas, and story opportunities are routed to the editorial workflow.",
      note: "Best for interviews, episodes, short clips, and catalog stories.",
    },
    {
      name: "Archive / Legacy",
      route: "Archive team",
      next: "Legacy notes are reviewed with sensitivity to Gary Burke history and archive provenance.",
      note: "Best for memories, materials, credits, and historical context.",
    },
  ];
  const activeTopic = topics.find((item) => item.name === topic) || topics[0];
  const featureRoutes = topics.filter((item) =>
    [
      "VIP Sync Access",
      "Rights / Catalog",
      "Strategic Partner",
      "Archive / Legacy",
    ].includes(item.name),
  );

  if (sent) {
    return (
      <section className="confirmation">
        <CheckCircle size={52} weight="fill" />
        <h2>Message received.</h2>
        <p>
          The beatmondo team will route your {topic.toLowerCase()} note to the
          right person and follow up with next steps.
        </p>
        <div className="status-strip">
          <span>Received</span>
          <span>Team review</span>
          <span>Follow-up</span>
        </div>
        <div className="button-row">
          <button className="gold-button" onClick={() => setSent(false)}>
            Send another message
          </button>
          <button
            className="outline-button"
            onClick={() => setView("licensing")}
          >
            Request Access
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="form-page wide-page contact-page">
      <div className="contact-header">
        <div className="form-intro">
          <span className="eyebrow">
            Contact <span className="brand-name">beatmondo</span>
          </span>
          <h2>The right conversation, routed clearly.</h2>
          <p>
            Reach the team for licensing questions, buyer access, VIP review,
            artist or contributor interest, strategic partnerships, media
            conversations, and Gary Burke legacy/archive notes.
          </p>
        </div>
        <aside className="contact-routing-summary">
          <span className="eyebrow">Routing summary</span>
          <h3>{activeTopic.route}</h3>
          <p>{activeTopic.next}</p>
          <div className="workflow-steps">
            {["Received", "Routed to team", "Private review", "Follow-up"].map(
              (step, index) => (
                <span key={step}>
                  <em>{index + 1}</em>
                  {step}
                </span>
              ),
            )}
          </div>
        </aside>
      </div>
      <div className="contact-topic-grid">
        {topics.map((item) => (
          <button
            type="button"
            key={item.name}
            className={topic === item.name ? "active" : ""}
            onClick={() => setTopic(item.name)}
          >
            <strong>{item.name}</strong>
            <span>{item.route}</span>
          </button>
        ))}
      </div>
      <div className="contact-workspace">
        <form
          className="inquiry-form access-form contact-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <p className="vip-form-note">{activeTopic.note}</p>
          <label>
            Name
            <input required placeholder="Jane Mitchell" />
          </label>
          <label>
            Email
            <input required placeholder="name@company.com" />
          </label>
          <label>
            Company
            <input placeholder="Company, studio, or organization" />
          </label>
          <label>
            Topic
            <input value={topic} readOnly />
          </label>
          <label className="full-field">
            Message
            <textarea
              required
              placeholder="Tell us what you need, what you are working on, and any timing or rights context."
            />
          </label>
          <div className="button-row">
            <button className="gold-button form-submit" type="submit">
              <UsersThree size={18} /> Send Message
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => setView("licensing")}
            >
              <ShieldCheck size={18} /> Open Licensing / Access
            </button>
          </div>
        </form>
        <aside className="contact-private-note">
          <LockKey size={28} />
          <strong>Private routing</strong>
          <p>
            Rights, catalog, contributor, VIP, and archive notes are reviewed
            privately before any representation, publication, or licensing
            discussion.
          </p>
          <span>
            Response path depends on topic, verification needs, and project
            urgency.
          </span>
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

function MerchandisePage({ setView }) {
  const products = [
    {
      name: "The SMYRK Archive Vinyl",
      category: "Featured artist merchandise",
      format: "Limited-edition vinyl",
      price: "$38",
      image: img.smyrkCard,
      position: "center 38%",
      status: "Coming Soon",
    },
    {
      name: "Slambovian 2022 Tour Poster",
      category: "Tour merchandise",
      format: "Numbered archival poster",
      price: "$24",
      image: img.slambovianArchive,
      position: "center",
      status: "Coming Soon",
    },
    {
      name: "beatmondo Studio Jacket",
      category: "beatmondo merchandise",
      format: "Embroidered work jacket",
      price: "$140",
      image: img.privateStudio,
      position: "center",
      status: "Partner Integration Planned",
    },
    {
      name: "beatmondo Wordmark Hat",
      category: "beatmondo merchandise",
      format: "Low-profile cotton cap",
      price: "$32",
      image: img.studio,
      position: "center 58%",
      status: "Partner Integration Planned",
    },
    {
      name: "Artist Edition Apparel",
      category: "Featured artist merchandise",
      format: "Premium heavyweight tee",
      price: "$36",
      image: img.smyrkPortrait,
      position: "center 34%",
      status: "Coming Soon",
    },
    {
      name: "Tour Night Hoodie",
      category: "Tour merchandise",
      format: "Venue-exclusive apparel",
      price: "$72",
      image: img.concert,
      position: "center",
      status: "Partner Integration Planned",
    },
    {
      name: "Gary Burke Archive Print",
      category: "Limited editions",
      format: "Museum-grade art print",
      price: "$45",
      image: img.legacyDetail,
      position: "center",
      status: "Coming Soon",
    },
    {
      name: "VIP Artist Experience",
      category: "VIP packages",
      format: "Curated event package",
      price: "$195",
      image: img.slambovianHero,
      position: "center 32%",
      status: "Partner Integration Planned",
    },
  ];

  return (
    <section className="merchandise-page">
      <PublicHeader setView={setView} />
      <div className="merchandise-hero">
        <div>
          <span className="eyebrow">Artist products · Tour goods · Limited editions</span>
          <h1>Merchandise, built around the music.</h1>
          <p>
            A future commercial channel for artist-led products, beatmondo
            editions, touring moments, vinyl, apparel, and premium fan
            experiences.
          </p>
          <div className="merchandise-hero-status">
            <span>Concept storefront</span>
            <span>No live checkout</span>
            <span>Approved partners only</span>
          </div>
        </div>
        <aside className="merchandise-partner-note">
          <ShoppingBag size={30} weight="duotone" aria-hidden="true" />
          <span className="eyebrow">Partner-led commerce</span>
          <h2>Produced and fulfilled by approved merchandise partners.</h2>
          <p>
            Fulfilment can be handled through external print-on-demand or
            specialist merchandise partners. Checkout, inventory, payment, and
            shipping integrations are planned for a later phase.
          </p>
        </aside>
      </div>

      <div className="merchandise-catalog">
        <div className="merchandise-section-heading">
          <div>
            <span className="eyebrow">Future product mix</span>
            <h2>Featured merchandise concepts</h2>
          </div>
          <p>
            Dummy pricing is shown for prototype demonstration only. Nothing
            on this page is available to purchase yet.
          </p>
        </div>
        <div className="merchandise-category-row" aria-label="Merchandise categories">
          {["Artist merchandise", "beatmondo", "Tour", "Limited editions", "VIP packages"].map(
            (category) => <span key={category}>{category}</span>,
          )}
        </div>
        <div className="merchandise-product-grid">
          {products.map((product) => (
            <article className="merchandise-product-card" key={product.name}>
              <div
                className="merchandise-product-image"
                style={{
                  backgroundImage: `linear-gradient(180deg, transparent 44%, rgba(8,7,5,.76)), url(${product.image})`,
                  backgroundPosition: product.position,
                }}
                role="img"
                aria-label={`${product.name} concept image`}
              >
                <span>{product.status}</span>
              </div>
              <div className="merchandise-product-copy">
                <small>{product.category}</small>
                <h3>{product.name}</h3>
                <div>
                  <span>{product.format}</span>
                  <strong>{product.price}</strong>
                </div>
                <em>Mock price · Not available for purchase</em>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className="merchandise-roadmap">
        <div>
          <span className="eyebrow">Commercial roadmap</span>
          <h2>A partner-ready revenue channel—not a simulated shop.</h2>
        </div>
        <div className="merchandise-roadmap-steps">
          {[
            ["01", "Curate", "Select artist, brand, tour, and limited-edition concepts."],
            ["02", "Approve", "Review brand, artist, rights, quality, and partner suitability."],
            ["03", "Integrate", "Connect specialist production, fulfilment, and commerce partners."],
            ["04", "Launch", "Activate products when commercial and operational terms are ready."],
          ].map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <button className="outline-button" onClick={() => setView("contact")}>
          Discuss a merchandise partnership <ArrowRight size={16} />
        </button>
      </section>
      <Footer setView={setView} />
    </section>
  );
}

function InvestorOverview({ setView }) {
  const problems = [
    "Valuable music catalogs remain undiscovered",
    "Rights information is fragmented across people, files, and systems",
    "Licensing is slow and manually coordinated",
    "Artists lack visibility and secure commercial access",
    "Buyers struggle to find distinctive, rights-cleared music",
  ];
  const solutions = [
    [MagnifyingGlass, "Curated music discovery"],
    [ShieldCheck, "Rights-aware metadata"],
    [FileAudio, "Structured licensing requests"],
    [FileText, "Quote and contract workflows"],
    [HardDrives, "Secure WAV and stem delivery"],
    [SquaresFour, "Role-specific operating dashboards"],
    [Fingerprint, "Audit and compliance controls"],
  ];
  const revenuePathways = [
    [Sparkle, "Discovery memberships", "Recurring access"],
    [UsersThree, "Professional buyer memberships", "Recurring access"],
    [Certificate, "VIP Sync Access", "Premium service"],
    [CurrencyDollar, "Licensing and synchronization fees", "Transaction"],
    [MicrophoneStage, "Artist and catalog partnerships", "Partnership"],
    [ShoppingBag, "Merchandise", "Artist commerce"],
    [CalendarBlank, "Touring and events", "Experiences"],
    [Waveform, "Streaming and media", "Audience"],
    [Archive, "Strategic catalog partnerships", "Portfolio"],
    [SquaresFour, "Regional expansion", "Geographic growth"],
  ];
  const ecosystem = [
    [MagnifyingGlass, "Discovery", "Curated buyer entry"],
    [MusicNote, "Catalog", "Controlled music records"],
    [ShieldCheck, "Rights", "Human-reviewed evidence"],
    [FileAudio, "Licensing", "Structured requests"],
    [FileText, "Contracts", "Versioned agreements"],
    [CurrencyDollar, "Payments", "Separated commercial ledgers"],
    [HardDrives, "Delivery", "Protected asset access"],
    [MicrophoneStage, "Artists", "Managed participation"],
    [TrendUp, "Analytics", "Role-safe intelligence"],
    [LockKey, "Security & compliance", "Permissioned evidence"],
  ];
  const advantages = [
    ["Premium curation", "Professional and selective—not commodity stock music."],
    ["Human context", "Artist stories, archive depth, and Gary Burke legacy content."],
    ["Artist-first control", "Rights, masters, access, and participation stay protected."],
    ["Multiple revenue models", "Membership, licensing, services, commerce, media, and events."],
    ["International readiness", "Modular operations can support regional market editions."],
    ["Paragon 360 structure", "Independent divisions can share one operating foundation."],
  ];
  const divisions = [
    [ShieldCheck, "Sync Licensing", "Core"],
    [MusicNote, "Music & Artist Catalogs", "Core"],
    [MicrophoneStage, "Touring", "Expansion"],
    [FilmSlate, "Film & Entertainment", "Expansion"],
    [Waveform, "Streaming", "Expansion"],
    [ShoppingBag, "Merchandise", "Partner-led"],
    [SquaresFour, "Regional Editions", "Future"],
  ];

  const scrollToRevenue = () => {
    document.getElementById("investor-revenue-model")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="investor-page">
      <PublicHeader setView={setView} />

      <section
        className="investor-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(7,6,5,.97) 0%, rgba(9,8,6,.88) 48%, rgba(9,8,6,.3) 100%), url(${img.scoringStage})`,
        }}
      >
        <div className="investor-hero-copy">
          <span className="eyebrow">Private investor overview</span>
          <h1>
            The premium operating system for music discovery, licensing and
            artist commerce.
          </h1>
          <p>
            beatmondo connects distinctive music, verified rights context,
            professional buyers, structured licensing, secure delivery, and
            new artist-led commercial pathways in one curated ecosystem.
          </p>
          <div className="investor-status-line" aria-label="Current investment status">
            <span>Architecture substantially complete</span>
            <span>Advanced operating prototype</span>
            <span>Private review by invitation</span>
          </div>
          <div className="button-row investor-hero-actions">
            <button className="gold-button" onClick={() => setView("home")}>
              Explore Platform <ArrowRight size={17} />
            </button>
            <button className="outline-button" onClick={scrollToRevenue}>
              View Revenue Model <CurrencyDollar size={17} />
            </button>
          </div>
        </div>
        <div className="investor-hero-metrics" aria-label="Platform at a glance">
          <article>
            <strong>3</strong>
            <span>Buyer access tiers</span>
          </article>
          <article>
            <strong>10</strong>
            <span>Connected operating areas</span>
          </article>
          <article>
            <strong>10</strong>
            <span>Revenue pathways</span>
          </article>
        </div>
      </section>

      <div className="investor-page-body">
        <section className="investor-framing" aria-labelledby="investor-problem-title">
          <div className="investor-problem-panel">
            <span className="eyebrow">The problem</span>
            <h2 id="investor-problem-title">Music value is lost between discovery and clearance.</h2>
            <div className="investor-problem-list">
              {problems.map((problem, index) => (
                <article key={problem}>
                  <span>0{index + 1}</span>
                  <p>{problem}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="investor-solution-panel">
            <span className="eyebrow">The solution</span>
            <h2>A curated operating layer for the full commercial journey.</h2>
            <div className="investor-solution-list">
              {solutions.map(([Icon, label]) => (
                <article key={label}>
                  <Icon size={22} weight="duotone" aria-hidden="true" />
                  <span>{label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="investor-revenue-model"
          className="investor-revenue-section"
          aria-labelledby="investor-revenue-title"
        >
          <div className="investor-section-heading">
            <div>
              <span className="eyebrow">Revenue pathways</span>
              <h2 id="investor-revenue-title">One platform. Multiple commercial engines.</h2>
            </div>
            <p>
              Revenue can combine recurring access, licensing transactions,
              premium service, artist commerce, media, experiences, and
              strategic expansion without collapsing those activities into one
              financial model.
            </p>
          </div>
          <div className="investor-revenue-grid">
            {revenuePathways.map(([Icon, title, type]) => (
              <article key={title} className={title === "Merchandise" ? "is-merchandise" : ""}>
                <Icon size={23} weight="duotone" aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <span>{type}</span>
                </div>
              </article>
            ))}
          </div>
          <p className="investor-model-note">
            Revenue pathways are strategic prototype concepts, not financial
            forecasts. Licensing finance remains separate from membership,
            merchandise, touring, and other commercial simulations.
          </p>
        </section>

        <section className="investor-ecosystem-section" aria-labelledby="investor-ecosystem-title">
          <div className="investor-section-heading">
            <div>
              <span className="eyebrow">Platform ecosystem</span>
              <h2 id="investor-ecosystem-title">The operating architecture already connects the journey.</h2>
            </div>
            <p>
              Buyers, artists, legal, finance, rights, security, and operations
              work from role-specific views over one permissioned evidence
              layer.
            </p>
          </div>
          <div className="investor-ecosystem-map">
            {ecosystem.map(([Icon, title, detail], index) => (
              <article key={title}>
                <span className="investor-ecosystem-number">{String(index + 1).padStart(2, "0")}</span>
                <Icon size={24} weight="duotone" aria-hidden="true" />
                <strong>{title}</strong>
                <small>{detail}</small>
              </article>
            ))}
          </div>
          <div className="investor-architecture-band">
            <span>Discover</span>
            <ArrowRight size={16} aria-hidden="true" />
            <span>Verify rights</span>
            <ArrowRight size={16} aria-hidden="true" />
            <span>License</span>
            <ArrowRight size={16} aria-hidden="true" />
            <span>Contract & pay</span>
            <ArrowRight size={16} aria-hidden="true" />
            <span>Deliver securely</span>
          </div>
        </section>

        <section className="investor-advantage-section" aria-labelledby="investor-advantage-title">
          <div className="investor-advantage-intro">
            <span className="eyebrow">Commercial advantage</span>
            <h2 id="investor-advantage-title">Built for catalog value—not volume at any cost.</h2>
            <p>
              beatmondo combines a premium public story with a deep private
              operating model. That allows the platform to stay selective at
              the surface while supporting commercial complexity underneath.
            </p>
          </div>
          <div className="investor-advantage-grid">
            {advantages.map(([title, text], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="investor-expansion-section" aria-labelledby="investor-expansion-title">
          <div className="investor-section-heading">
            <div>
              <span className="eyebrow">Expansion vision</span>
              <h2 id="investor-expansion-title">A modular music and entertainment group under Paragon 360.</h2>
            </div>
            <p>
              Future beatmondo divisions can share brand, technology,
              relationships, rights intelligence, and operating controls while
              developing their own commercial models.
            </p>
          </div>
          <div className="investor-division-grid">
            {divisions.map(([Icon, title, stage]) => (
              <article key={title}>
                <Icon size={28} weight="duotone" aria-hidden="true" />
                <strong>{title}</strong>
                <span>{stage}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="investor-cta" aria-labelledby="investor-cta-title">
          <div>
            <span className="eyebrow">Private review</span>
            <h2 id="investor-cta-title">See the operating depth behind the business story.</h2>
            <p>
              Request access to the full prototype, schedule a guided review,
              or contact Preston and the designated investment team for a
              confidential conversation.
            </p>
          </div>
          <div className="investor-cta-actions">
            <button className="gold-button" onClick={() => setView("register")}>
              Request Prototype Access <ArrowRight size={17} />
            </button>
            <button className="outline-button" onClick={() => setView("contact")}>
              Schedule a Private Review <CalendarBlank size={17} />
            </button>
            <button className="text-action" onClick={() => setView("contact")}>
              Contact the Investment Team <ArrowRight size={15} />
            </button>
          </div>
        </section>

        <div className="investor-disclaimer">
          <ShieldCheck size={18} aria-hidden="true" />
          <p>
            Private prototype overview. No financial projections, valuation,
            investment offer, legal conclusion, rights certification, or
            commercial commitment is presented. Authentication, payment,
            delivery, compliance, and other infrastructure remain simulated
            until production systems and approved providers are implemented.
          </p>
        </div>
      </div>
      <Footer setView={setView} />
    </section>
  );
}

function ArtistDashboardPage({ authUser, showToast, setView }) {
  const capabilities = [
    [
      Eye,
      "View Profile",
      "Review your public artist profile as buyers see it.",
    ],
    [
      MusicNote,
      "View Catalog",
      "See all submitted and published tracks with metadata status.",
    ],
    [
      CloudArrowUp,
      "Track Submissions",
      "View submission status, review notes, and approval progress.",
    ],
    [
      Heart,
      "Licensing Interest",
      "See anonymized saves, preview activity, and buyer interest signals.",
    ],
    [
      FileAudio,
      "Request History",
      "View past licensing requests involving your tracks.",
    ],
    [
      ShieldCheck,
      "Rights Status",
      "Review rights verification, ownership records, and documentation status.",
    ],
  ];
  const changeRequests = [
    [
      GearSix,
      "Request Metadata Changes",
      "Submit corrections to titles, credits, instrumentation, or contributor details.",
    ],
    [
      FilmSlate,
      "Request Media Changes",
      "Submit updated images, editorial text, or promotional materials.",
    ],
    [
      Archive,
      "Request Track Removal",
      "Initiate a removal request with rights review and contractual confirmation.",
    ],
    [
      UsersThree,
      "Submit Inquiry",
      "Contact the beatmondo team for catalog, rights, or partnership questions.",
    ],
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
      <div className="artist-account-summary">
        <div className="profile-avatar-large">{authUser?.avatar || "AR"}</div>
        <div>
          <span className="eyebrow">Welcome back</span>
          <h2>{authUser?.name || "Artist representative"}</h2>
          <p>
            {authUser?.organization || "Artist catalog"} ·{" "}
            {authUser?.jobTitle || "Rightsholder"}
          </p>
        </div>
        <div className="account-status-row">
          <span>
            {authUser?.verificationStatus === "approved"
              ? "Artist Approved"
              : "Artist Verification Pending"}
          </span>
          <span>
            {authUser?.submissionAccess
              ? "Submission Access Enabled"
              : "Submission Access Limited"}
          </span>
          <span>{authUser?.profileCompletion || 0}% Profile</span>
        </div>
      </div>
      <div className="page-intro">
        <span className="eyebrow">Artist workspace</span>
        <h2>Controlled artist participation</h2>
        <p>
          Artists and contributors can view their profile, catalog, and
          licensing activity. All changes are submitted for review — direct
          publishing, rights editing, and pricing changes are not available.
        </p>
        <button
          className="gold-button"
          onClick={() => setView("artist-rights")}
        >
          Open My Rights Review
        </button>
      </div>
      <div className="artist-dash-grid">
        <Panel title="The SMYRK submissions" action="Own catalog only">
          <div className="request-list artist-submission-list">
            <article>
              <strong>The End of Jason Todd</strong>
              <span>
                Rights documentation review · Master located · Preston approval
                pending
              </span>
            </article>
            <article>
              <strong>Requested document</strong>
              <span>Publishing ownership confirmation · Due Jul 22</span>
            </article>
            <article>
              <strong>Recent notification</strong>
              <span>Catalog team requested an additional rights document.</span>
            </article>
          </div>
          <button
            className="gold-button"
            onClick={() => setView("artist-submission-new")}
            disabled={!authUser?.submissionAccess}
          >
            <CloudArrowUp size={18} />{" "}
            {authUser?.submissionAccess
              ? "New Track Submission"
              : "Submission access pending"}
          </button>
          <button
            className="outline-button"
            onClick={() => setView("artist-submissions")}
          >
            View Track Submissions
          </button>
        </Panel>
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
              <button
                key={title}
                className="capability-card"
                onClick={() => showToast(`${title} form opened.`)}
              >
                <Icon size={22} weight="duotone" />
                <strong>{title}</strong>
                <span>{text}</span>
              </button>
            ))}
          </div>
          <button
            className="gold-button"
            style={{ marginTop: 16 }}
            onClick={() => showToast("Change request form opened.")}
          >
            <CloudArrowUp size={18} /> Submit Change Request
          </button>
        </Panel>
        <Panel title="Restrictions" action="Platform policy">
          <ul className="restriction-list">
            {restrictions.map((item) => (
              <li key={item}>
                <LockKey size={15} /> {item}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Artist profile preview" action="Public view">
          <div className="artist-preview-mini">
            <div
              className="portrait small"
              style={{ backgroundImage: `url(${artists[0].image})` }}
            />
            <div>
              <strong>{artists[0].name}</strong>
              <span>{artists[0].credit}</span>
              <span>{artists[0].tracks} tracks in catalog</span>
            </div>
            <button
              className="outline-button"
              onClick={() => setView("artist")}
            >
              View public profile
            </button>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function DesignSystem() {
  const palette = [
    "#18130f",
    "#2a231b",
    "#f4efe6",
    "#cdbfaa",
    "#a6342a",
    "#5f7167",
  ];
  return (
    <section className="system-page">
      <div className="system-brand">
        <img src={logo} alt="beatmondo logo usage" />
        <p>
          Use lowercase beatmondo, Gary Burke red as a strategic brand accent,
          muted brass as secondary emphasis, and a darker gated/private sync
          licensing visual system.
        </p>
      </div>
      <div className="swatches">
        {palette.map((color) => (
          <span key={color} style={{ "--swatch": color }}>
            {color}
          </span>
        ))}
      </div>
      <div className="section-grid">
        <Panel title="Buttons & forms" action="Controls">
          <div className="button-row">
            <button className="gold-button">Primary</button>
            <button className="outline-button">Secondary</button>
            <button className="plain-button">Text action</button>
          </div>
          <input placeholder="Form input" />
        </Panel>
        <Panel title="Audio player" action="Components">
          <div className="large-player small-player">
            <div className="waveform big" />
            <span>Preview-only playback state</span>
          </div>
        </Panel>
        <Panel title="Access badges" action="Gated">
          <div className="tag-row">
            <span>Discovery Access</span>
            <span>Professional Buyer</span>
            <span>VIP Sync Access</span>
            <span>VIP Only</span>
          </div>
        </Panel>
        <Panel title="Rights and delivery badges" action="Licensing">
          <div className="tag-row">
            <span>Rights Verified</span>
            <span>Preston Approved</span>
            <span>WAV master</span>
            <span>Stems</span>
            <span>Fast-Track Delivery</span>
          </div>
        </Panel>
        <Panel title="Locked components" action="Private">
          <p>
            Locked/VIP-only states, missing rights notes, expired secure links,
            protected masters, and quote states are represented with restrained,
            legally serious product language.
          </p>
        </Panel>
      </div>
    </section>
  );
}

function MiniPlayer({
  track,
  playingId,
  onTogglePlay,
  onClose,
  onPreviewEnd,
  audioRef,
  previewInfo,
  sessionId,
  onWatermarkCue,
}) {
  const isPlaying = playingId === track.id;
  const previewDuration =
    previewInfo?.durationSeconds || track.previewDuration || 84;
  const previewSourceStart = track.previewSourceStart || 18;
  const [elapsed, setElapsed] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const elapsedRef = useRef(0);
  const reachedCuesRef = useRef(new Set());
  const onPreviewEndRef = useRef(onPreviewEnd);
  const simulatedClockRef = useRef({ startedAt: 0, base: 0 });

  useEffect(() => {
    onPreviewEndRef.current = onPreviewEnd;
  }, [onPreviewEnd]);

  useEffect(() => {
    const nextElapsed = track.previewSrc
      ? audioRef.current?.currentTime || 0
      : 0;
    elapsedRef.current = nextElapsed;
    setElapsed(nextElapsed);
    setIsMinimized(false);
    reachedCuesRef.current = new Set();
  }, [audioRef, track.id, track.previewSrc]);

  const cuePositions = previewInfo?.watermarkPositions || [];
  const activeCue = cuePositions.find(
    (position) => elapsed >= position && elapsed < position + 2.2,
  );

  useEffect(() => {
    if (!isPlaying) return;
    cuePositions.forEach((position) => {
      if (elapsed >= position && !reachedCuesRef.current.has(position)) {
        reachedCuesRef.current.add(position);
        onWatermarkCue?.(position);
      }
    });
  }, [cuePositions, elapsed, isPlaying, onWatermarkCue]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!track.previewSrc || !audio) return undefined;
    const updateElapsed = () => {
      const nextElapsed = Math.min(audio.currentTime, previewDuration);
      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
    };
    const handleEnded = () => {
      elapsedRef.current = previewDuration;
      setElapsed(previewDuration);
      onPreviewEndRef.current?.();
    };
    audio.addEventListener("timeupdate", updateElapsed);
    audio.addEventListener("seeked", updateElapsed);
    audio.addEventListener("loadedmetadata", updateElapsed);
    audio.addEventListener("ended", handleEnded);
    updateElapsed();
    return () => {
      audio.removeEventListener("timeupdate", updateElapsed);
      audio.removeEventListener("seeked", updateElapsed);
      audio.removeEventListener("loadedmetadata", updateElapsed);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, previewDuration, track.id, track.previewSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!track.previewSrc || !audio || !isPlaying) return undefined;

    let frame;
    const syncProgress = () => {
      const nextElapsed = Math.min(audio.currentTime, previewDuration);
      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
      frame = window.requestAnimationFrame(syncProgress);
    };

    frame = window.requestAnimationFrame(syncProgress);
    return () => window.cancelAnimationFrame(frame);
  }, [audioRef, isPlaying, previewDuration, track.id, track.previewSrc]);

  useEffect(() => {
    if (track.previewSrc || !isPlaying) return undefined;
    simulatedClockRef.current = {
      startedAt: Date.now(),
      base: elapsedRef.current,
    };
    const timer = window.setInterval(() => {
      const nextElapsed = Math.min(
        previewDuration,
        simulatedClockRef.current.base +
          (Date.now() - simulatedClockRef.current.startedAt) / 1000,
      );
      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
      if (nextElapsed >= previewDuration) {
        window.clearInterval(timer);
        onPreviewEndRef.current?.();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [isPlaying, previewDuration, track.id, track.previewSrc]);

  const formatTime = (seconds) => {
    const rounded = Math.max(0, Math.floor(seconds));
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
  };

  const progress = Math.min(100, (elapsed / previewDuration) * 100);
  const sourceRange = `${formatTime(previewSourceStart)}–${formatTime(previewSourceStart + previewDuration)} source segment`;
  const setPreviewPosition = (position) => {
    const nextElapsed = Math.min(
      previewDuration,
      Math.max(0, Number(position)),
    );
    const audio = audioRef.current;
    if (track.previewSrc && audio) audio.currentTime = nextElapsed;
    if (!track.previewSrc && isPlaying)
      simulatedClockRef.current = { startedAt: Date.now(), base: nextElapsed };
    elapsedRef.current = nextElapsed;
    setElapsed(nextElapsed);
  };
  const seekPreview = (event) => setPreviewPosition(event.currentTarget.value);
  const handleSeekKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setPreviewPosition(
      elapsedRef.current + (event.key === "ArrowRight" ? 5 : -5),
    );
  };
  const playButton = (
    <button
      className="sound-ring-button"
      onClick={onTogglePlay}
      aria-label={isPlaying ? "Pause preview" : "Resume preview"}
    >
      {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
    </button>
  );

  if (isMinimized) {
    return (
      <aside
        className="mini-player is-minimized"
        aria-label={`Minimized protected preview player for ${track.title}`}
      >
        <div
          className="mini-player-progress-ring"
          style={{ "--preview-progress": `${progress * 3.6}deg` }}
        >
          {playButton}
        </div>
        <div
          className="cover-art small"
          style={{ backgroundImage: `url(${track.image})` }}
          aria-hidden="true"
        />
        <div className="mini-player-meta">
          <strong>{track.title}</strong>
          <span>
            {previewInfo?.organizationSpecific ? "Private" : "Protected"} ·{" "}
            {formatTime(elapsed)} of {formatTime(previewDuration)}
          </span>
        </div>
        <button
          className="mini-player-action-button mini-player-restore"
          onClick={() => setIsMinimized(false)}
          aria-label="Expand player"
        >
          <CaretDown size={18} aria-hidden="true" />
        </button>
        <button
          className="mini-player-action-button"
          onClick={onClose}
          aria-label="Close player"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`mini-player ${previewInfo?.watermark ? "has-watermark-context" : "has-standard-context"}`}
      aria-label={`Protected preview player for ${track.title}`}
    >
      {playButton}
      <div
        className="cover-art small"
        style={{ backgroundImage: `url(${track.image})` }}
        aria-hidden="true"
      />
      <div className="mini-player-meta">
        <strong>{track.title}</strong>
        <span>
          {track.artist} · {previewInfo?.assetType || "Preview Only"}
        </span>
      </div>
      {previewInfo?.watermark && (
        <div
          className={`mini-player-watermark ${activeCue !== undefined ? "is-active" : ""}`}
          role="status"
          aria-live="polite"
        >
          <ShieldCheck size={15} aria-hidden="true" />
          <span>
            {activeCue !== undefined
              ? `Watermark cue: ${previewInfo.watermarkPhrase || "beatmondo preview"}`
              : previewInfo.organizationSpecific
                ? "Private preview · account and organization associated"
                : `${previewInfo.policyName || "Protected preview"} · simulated cues`}
          </span>
          {sessionId && <small>Session active</small>}
        </div>
      )}
      <div className="preview-track-strip">
        <div className="preview-track-meta">
          <time aria-label={`Elapsed time ${formatTime(elapsed)}`}>
            {formatTime(elapsed)}
          </time>
          <strong>
            <LockKey size={12} weight="fill" aria-hidden="true" /> Protected
            preview
            {track.duration && track.duration !== getPlayableDuration(track)
              ? ` · full ${track.duration}`
              : ""}{" "}
            · Drag to seek
          </strong>
          <time aria-label={`Preview duration ${formatTime(previewDuration)}`}>
            {formatTime(previewDuration)}
          </time>
        </div>
        <div className="preview-waveform">
          <span className="preview-allowed-range" aria-hidden="true" />
          <span
            className="preview-progress"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
          <span
            className="preview-playhead"
            style={{ left: `${progress}%` }}
            aria-hidden="true"
          />
          <input
            className="preview-seek-control"
            type="range"
            min="0"
            max={previewDuration}
            step="0.1"
            value={elapsed}
            onInput={seekPreview}
            onChange={seekPreview}
            onKeyDown={handleSeekKeyDown}
            aria-label={`Seek ${track.title} protected preview. Use left and right arrow keys to move five seconds.`}
            aria-valuetext={`${formatTime(elapsed)} of ${formatTime(previewDuration)}; ${sourceRange}`}
          />
        </div>
      </div>
      <div className="mini-player-actions">
        <button
          className="mini-player-action-button"
          onClick={() => setIsMinimized(true)}
          aria-label="Minimize player"
        >
          <CaretDown size={18} aria-hidden="true" />
        </button>
        <button
          className="mini-player-action-button"
          onClick={onClose}
          aria-label="Close player"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function ImageCard({ title, text, image, action }) {
  return (
    <article
      className="image-card"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.64)), url(${image})`,
      }}
      onClick={action}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          action();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Explore music for ${title}`}
    >
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

/* Image cards use CSS background images; lazy loading applies to <img> assets elsewhere. */

function CollectionCard({ title, text, count, tags, image, onView }) {
  return (
    <article className="collection-card">
      <div
        className="collection-card-image"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="collection-card-heading">
        <h3>{title}</h3>
        <span>{count} tracks</span>
      </div>
      <p>{text}</p>
      <div className="collection-card-footer">
        <div className="tag-row">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <button onClick={onView}>View collection</button>
      </div>
    </article>
  );
}

function AccessTierCard({ tier, onSelect }) {
  return (
    <article className={`tier-card ${tier.id === "vip" ? "vip-tier" : ""}`}>
      <span className="tier-badge">{tier.name}</span>
      <h3>{tier.name}</h3>
      <p>{tier.description}</p>
      <strong>{tier.priceLabel}</strong>
      <ul>
        {tier.features.map((feature) => (
          <li key={feature}>
            <CheckCircle size={15} weight="fill" /> {feature}
          </li>
        ))}
      </ul>
      <button
        className={
          tier.id === "vip" ? "gold-button vip-access-button" : "outline-button"
        }
        onClick={onSelect}
      >
        <span className="motion-button-label">Request Access</span>
        {tier.id === "vip" && (
          <span className="vip-acoustic-ripple" aria-hidden="true" />
        )}
      </button>
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
        <span key={label} className={ready ? "ready" : "locked"}>
          <LockKey size={compact ? 12 : 14} /> {label}
          {!compact && <small>{ready ? note : "Rights check"}</small>}
        </span>
      ))}
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="select-label">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <CaretDown size={14} />
    </label>
  );
}

function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`.trim()}>
      <div className="panel-head">
        <h3>{title}</h3>
        <span>{action}</span>
      </div>
      {children}
    </section>
  );
}

function Metric({ icon: Icon, label, value, note }) {
  return (
    <article className="metric">
      <Icon size={24} weight="duotone" />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function TrustItem({ icon: Icon, title, text }) {
  return (
    <div className="trust-item">
      <Icon size={30} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function MiniStory({ title, text, image, actionLabel = "Open", action }) {
  return (
    <article className="mini-story">
      <div style={{ backgroundImage: `url(${image})` }} />
      <h3>{title}</h3>
      <p>{text}</p>
      <button onClick={action}>{actionLabel}</button>
    </article>
  );
}

function RequestRow({
  item,
  detailed = false,
  actionable = false,
  setView,
  showToast,
}) {
  const primary = actionable ? inquiryPrimaryAction(item) : null;
  const statusClass = `status-${String(item.status || "")
    .toLowerCase()
    .replaceAll(" ", "-")}`;
  const runPrimary = () => {
    if (!primary) return;
    showToast?.(primary.toast);
    setView?.(primary.view);
  };
  return (
    <article
      className={`request-row ${actionable ? "request-row-actionable" : ""} ${statusClass}`}
    >
      <div className="request-row-main">
        <div className="request-row-title">
          <strong>{item.company}</strong>
          <span className={`badge ${statusClass}`}>{item.status}</span>
        </div>
        <span className="request-row-track">
          {item.track} · {item.type}
        </span>
        {detailed && (
          <div className="request-meta-chips" aria-label="Inquiry details">
            <span>{item.id}</span>
            <span>{item.budget}</span>
            <span>Deadline {item.deadline}</span>
            <span>{item.buyerTier}</span>
            <span>{item.priority}</span>
            <span
              className={
                item.rightsCheck === "Verified"
                  ? "meta-good"
                  : "meta-attention"
              }
            >
              Rights: {item.rightsCheck}
            </span>
            {item.deliveryReadiness && (
              <span
                className={
                  item.deliveryReadiness === "Blocked"
                    ? "meta-attention"
                    : "meta-neutral"
                }
              >
                {item.deliveryReadiness}
              </span>
            )}
          </div>
        )}
        {actionable && (
          <div className="request-row-actions">
            <button type="button" className="gold-button" onClick={runPrimary}>
              {primary.label}
            </button>
            {(item.status === "Quote Needed" ||
              item.status === "Quote Sent" ||
              item.status === "Approved") && (
              <button
                type="button"
                className="outline-button"
                onClick={() => {
                  showToast?.(`Quotes workspace for ${item.company}.`);
                  setView?.("admin-quotes");
                }}
              >
                Quotes
              </button>
            )}
            {item.status !== "Rights Check Needed" && (
              <button
                type="button"
                className="plain-button"
                onClick={() => {
                  showToast?.(`Rights context for ${item.track}.`);
                  setView?.("admin-rights");
                }}
              >
                Rights
              </button>
            )}
            {item.status === "Approved" && (
              <button
                type="button"
                className="plain-button"
                onClick={() => {
                  showToast?.(`Buyer contracts for ${item.company}.`);
                  setView?.("admin-contracts");
                }}
              >
                Contracts
              </button>
            )}
          </div>
        )}
      </div>
      {!actionable && <span className="badge">{item.status}</span>}
    </article>
  );
}

function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <BookmarkSimple size={28} />
      <strong>{title}</strong>
      <p>{text}</p>
      {actionLabel && onAction && (
        <button className="outline-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Footer({ setView }) {
  const footerLogoVideoRef = useRef(null);
  const [footerLogoFailed, setFooterLogoFailed] = useState(false);

  useEffect(() => {
    const video = footerLogoVideoRef.current;
    if (!video) return undefined;

    const playLogo = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      video.muted = true;
      video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) playLogo();
        else video.pause();
      },
      { threshold: 0.1 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const linkGroups = [
    ["Explore", ["Explore Music", "Licensing", "Artists", "Merchandise", "Gary Burke Legacy"]],
    ["Media", ["Editorial Hub", "Stories", "Media Episodes", "Contact"]],
    ["Access", ["Request Access", "Licensing Access", "Partner Inquiry"]],
  ];
  const navigate = (item) => {
    if (item === "Explore Music") setView("catalog");
    else if (item === "Merchandise") setView("merchandise");
    else if (item === "Gary Burke Legacy") setView("legacy");
    else if (
      item === "Request Access" ||
      item === "Licensing" ||
      item === "Licensing Access" ||
      item === "Partner Inquiry"
    )
      setView("licensing");
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
          <div
            className={`footer-logo-lockup ${footerLogoFailed ? "is-fallback" : ""}`}
            role="img"
            aria-label="beatmondo"
          >
            <video
              ref={footerLogoVideoRef}
              className="footer-logo-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setFooterLogoFailed(true)}
              aria-hidden="true"
            >
              <source src={footerLogoAnimation} type="video/mp4" />
            </video>
            <img
              className="footer-logo-fallback"
              src={logo}
              alt=""
              aria-hidden="true"
            />
          </div>
          <p>
            Authentic tracks from real musicians. Built for licensing
            conversations.
          </p>
          <span>Preview publicly. Deliver securely.</span>
        </div>
        <nav>
          {linkGroups.map(([group, links]) => (
            <div key={group}>
              <strong>{group}</strong>
              {links.map((item) => (
                <button
                  key={item}
                  onClick={() => navigate(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <small>
          Master files are protected and delivered only through approved
          licensing workflows. Copyright and rights notices apply to all
          represented materials.
        </small>
      </div>
    </footer>
  );
}

export { App };
