import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
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
};

const buyerTiers = [
  {
    id: "discovery",
    name: "Discovery Access",
    description: "Limited preview access for approved early buyers.",
    priceLabel: "Entry access required",
    features: ["Limited previews", "Save selected tracks", "Submit licensing interest", "No master access"],
  },
  {
    id: "professional",
    name: "Professional Buyer",
    description: "Standard licensing workspace for agencies, producers, and serious music buyers.",
    priceLabel: "Quote-based licensing",
    features: ["Full project workspace", "Request quotes", "Track license status", "Approved WAV master delivery"],
  },
  {
    id: "vip",
    name: "VIP Sync Access",
    description: "Private selections, concierge review, and faster licensing paths for top-level buyers.",
    priceLabel: "Premium access",
    features: ["Private curated selections", "Priority review", "Pre-approved terms where available", "Premium secure delivery"],
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
];

const tracks = rawTracks.map((track, index) => ({
  ...track,
  vipOnly: [1, 4].includes(track.id),
  energy: ["Low", "High", "Low", "Medium", "Medium", "High"][index],
  sceneFit: ["Opening titles", "Launch film", "Night drive", "Trailer turn", "Human story", "Social campaign"][index],
  subgenre: ["Neo-classical", "Indie anthem", "Textural ambient", "Vintage soul", "Americana", "Bright pop"][index],
  assets: {
    preview: true,
    wavMaster: track.id !== 4,
    stems: [1, 3, 5, 6].includes(track.id),
    instrumental: track.vocal === "Instrumental" || [2, 4, 6].includes(track.id),
    vocal: track.vocal === "Vocal",
    alternateMixes: [1, 2, 5].includes(track.id),
    loopEdit: [3, 5, 6].includes(track.id),
    thirtySecondEdit: [1, 2, 6].includes(track.id),
  },
  rightsData: {
    proAffiliation: index % 2 === 0 ? "ASCAP" : "BMI",
    registrationId: `BMO-MOCK-${String(track.id).padStart(4, "0")}`,
    publisher: `${track.artist} Publishing`,
    masterOwner: "beatmondo Partner Catalog",
    publishingOwner: `${track.artist} Publishing`,
    ownershipProof: track.id === 4 ? "Rights Review Needed" : "Verified",
    contractStatus: track.id === 4 ? "Legal Review Needed" : "On File",
    legalReview: track.id === 4 ? "Pending" : "Approved",
    prestonApproval: track.id === 4 ? "Pending" : "Approved",
    licensingEligible: track.id !== 4,
    rightsVerified: track.id !== 4,
    deliveryReady: ["Delivery Ready", "Protected Delivery", "Ready to License"].includes(track.status),
    lastReview: "Jul 2026",
  },
}));

const useCases = [
  ["Film & Television", "Emotional themes, source cues, title beds, and end-credit moments.", img.film],
  ["OTT & Streaming Platforms", "Rights-ready music for premium series, originals, and global streaming campaigns.", img.streaming],
  ["Advertising & Brand Campaigns", "Authentic tracks for launches, product films, and premium storytelling.", img.campaign],
  ["Trailers & Promos", "Impactful builds, emotional lifts, and quote-ready archive tracks.", img.trailer],
  ["Documentary & Editorial", "Human, textured music with provenance and rights context.", img.documentary],
  ["Global Campaigns", "Commercially usable music for international launches, markets, and multi-territory media.", img.city],
  ["Events & Experiences", "Atmospheric selections for launches, installations, and live moments.", img.concert],
  ["Sports & Broadcast", "Driven cues for broadcast packages, promos, and human achievement stories.", img.broadcast],
  ["Luxury / Lifestyle Campaigns", "Warm, tasteful tracks for refined brand worlds.", img.luxury],
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
  ["track", "Track Detail", FileAudio],
  ["artist", "Artist Profile", MicrophoneStage],
  ["legacy", "Gary Burke Legacy", Archive],
  ["licensing", "Licensing / Access", ShieldCheck],
  ["buyer", "Buyer Dashboard", UserCircle],
  ["project", "Project Detail", BookmarkSimple],
  ["admin", "Admin", GearSix],
  ["content", "Editorial Hub", Article],
  ["stories", "Stories", Article],
  ["media", "Media Episodes", FilmSlate],
  ["contact", "Contact", UsersThree],
  ["system", "Design System", Sliders],
];

const validViews = new Set(navItems.map(([id]) => id));

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
    tempo: "Any Tempo",
    era: "Any Era",
    usage: "Any Usage",
    vocal: "Any Vocal",
    availability: "All Availability",
    duration: "Any Duration",
    vipCatalog: "All Access",
    stems: "Any Stem Status",
    rightsVerified: "Any Rights Status",
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
    setMobileNav(false);
    window.history.replaceState(null, "", nextView === "home" ? window.location.pathname : `#${nextView}`);
  };

  useEffect(() => {
    const syncFromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (!id || id === "home") {
        setView("home");
        return;
      }
      if (validViews.has(id)) setView(id);
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
      const text = `${track.title} ${track.artist} ${track.genre} ${track.mood} ${track.tags.join(" ")} ${track.usage}`.toLowerCase();
      return text.includes(query.toLowerCase())
        && (filters.genre === "All Genres" || track.genre === filters.genre)
        && (filters.mood === "Any Mood" || track.mood === filters.mood)
        && (filters.tempo === "Any Tempo" || track.tempo === filters.tempo)
        && (filters.era === "Any Era" || track.era === filters.era)
        && (filters.usage === "Any Usage" || track.usage === filters.usage)
        && (filters.vocal === "Any Vocal" || track.vocal === filters.vocal)
        && (filters.availability === "All Availability" || track.availability === filters.availability)
        && matchesDuration(track.duration, filters.duration)
        && (filters.vipCatalog === "All Access" || (filters.vipCatalog === "VIP Picks" ? track.vipOnly : !track.vipOnly))
        && (filters.stems === "Any Stem Status" || (filters.stems === "Stems Available" ? track.assets.stems : !track.assets.stems))
        && (filters.rightsVerified === "Any Rights Status" || (filters.rightsVerified === "Rights Verified" ? track.rightsData.rightsVerified : !track.rightsData.rightsVerified));
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

  return (
    <div className={`app ${view === "home" ? "home-app" : ""}`}>
      {view !== "home" && <Sidebar view={view} setView={navigate} mobileNav={mobileNav} setMobileNav={setMobileNav} />}
      <main className="main-shell">
        {view !== "home" && (
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
        {view === "content" && <ContentPages setView={navigate} showToast={showToast} />}
        {view === "stories" && <StoriesPage setView={navigate} showToast={showToast} />}
        {view === "media" && <MediaEpisodesPage setView={navigate} showToast={showToast} />}
        {view === "contact" && <ContactPage setView={navigate} />}
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
        {navItems.map(([id, label, Icon]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setMobileNav(false); }}>
            <Icon size={20} weight={view === id ? "fill" : "regular"} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="security-card">
        <ShieldCheck size={28} weight="fill" />
        <strong>Protected licensing workspace</strong>
        <span>Preview publicly. Deliver securely.</span>
        <span>Audit-ready activity logs</span>
      </div>
    </aside>
  );
}

function Topbar({ view, setView, setMobileNav, showNotifications, setShowNotifications, onProfile }) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileNav(true)}><FadersHorizontal size={20} /> Menu</button>
      <div>
        <span className="eyebrow">beatmondo private sync workspace</span>
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

function PublicHeader({ setView }) {
  return (
    <header className="public-header">
      <button className="public-logo" onClick={() => setView("home")} aria-label="beatmondo home">
        <img src={logo} alt="beatmondo" />
      </button>
      <nav>
        <button onClick={() => setView("catalog")}>Explore Music</button>
        <button onClick={() => setView("licensing")}>Licensing</button>
        <button onClick={() => setView("legacy")}>Legacy</button>
        <button onClick={() => setView("stories")}>Stories</button>
      </nav>
      <button className="outline-button" onClick={() => setView("licensing")}><SignIn size={18} /> Request Access</button>
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
          <h2>The private sync environment for music that deserves serious placement.</h2>
          <p>beatmondo connects serious music supervisors, brands, studios, agencies, and strategic buyers with curated music, verified rights, protected masters, stems, and access-controlled licensing workflows.</p>
          <p className="trust-line">Preview publicly. License professionally. Deliver securely.</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => setView("licensing")}><LockKey size={18} /> Request Access</button>
            <button className="outline-button" onClick={() => setView("catalog")}><Play size={18} weight="fill" /> Explore Music</button>
          </div>
        </div>
        <HeroMedia />
      </div>

      <section className="editorial-band">
        <div className="section-kicker"><span className="eyebrow">What is beatmondo?</span><h2>Not a stock library. A controlled sync licensing environment.</h2></div>
        <div className="section-grid">
          <Panel title="Gated access by design" action="Private">
            <p>Public visitors see selected previews and story-led context. Approved buyers unlock deeper metadata, project tools, quote workflows, and secure delivery.</p>
          </Panel>
          <Panel title="Built for serious buyers" action="Workflow">
            <p>Music supervisors, brands, studios, agencies, producers, and strategic partners can work through curated access, usage review, quote approval, and delivery controls.</p>
          </Panel>
          <Panel title="Rights verified before licensing" action="Legal">
            <p>Ownership proof, PRO details, contract status, Preston approval, and rights review are represented before music becomes licensing eligible.</p>
          </Panel>
        </div>
      </section>

      <section className="access-tier-band">
        <div className="section-heading">
          <div><span className="eyebrow">Choose your access level</span><h2>Curated access for serious sync buyers.</h2></div>
          <button onClick={() => setView("licensing")}>Discuss Licensing Access</button>
        </div>
        <div className="tier-grid">
          {buyerTiers.map((tier) => <AccessTierCard key={tier.id} tier={tier} onSelect={() => setView("licensing")} />)}
        </div>
      </section>

      <section>
        <div className="section-kicker"><span className="eyebrow">Music for global sync opportunities</span><h2>Search by the work, market, and placement you are making.</h2></div>
        <div className="image-card-grid use-cases">
          {useCases.map(([title, text, image]) => <ImageCard key={title} title={title} text={text} image={image} action={() => setView("catalog")} />)}
        </div>
      </section>

      <section className="vip-band">
        <div>
          <span className="eyebrow">VIP Sync Access</span>
          <h2>Priority music access for vetted high-value buyers.</h2>
          <p>VIP buyers receive private selections, priority review, pre-approved terms where available, concierge support, fast-track licensing, and premium secure delivery for serious sync opportunities.</p>
        </div>
        <div className="vip-feature-grid">
          {["Private high-value selections", "Priority quote review", "Pre-approved terms where available", "Concierge support", "Fast-track licensing", "Secure WAV master and stems delivery"].map((item) => <span key={item}><ShieldCheck size={16} /> {item}</span>)}
        </div>
      </section>

      <section className="warm-band collections-band">
        <div className="section-heading"><div><span className="eyebrow">Curated selections</span><h2>Editorial paths into Explore Music.</h2></div><button onClick={() => setView("catalog")}>Explore music</button></div>
        <div className="collection-grid">
          {collections.map(([title, text, count, tags, image]) => (
            <CollectionCard key={title} title={title} text={text} count={count} tags={tags} image={image} onView={() => setView("catalog")} />
          ))}
        </div>
      </section>

      <section className="split-section">
        <div>
          <div className="section-heading"><div><span className="eyebrow">Featured tracks</span><h2>Preview publicly. Deliver securely.</h2></div><button onClick={() => setView("catalog")}>View all music</button></div>
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

      <section className="partner-band">
        <div>
          <span className="eyebrow">For strategic partners</span>
          <h2>A rights-controlled foundation built for long-term value.</h2>
          <p>beatmondo combines selective music exploration, rights-aware metadata, secure licensing workflows, and artist-first positioning for thoughtful partnership and future catalog expansion.</p>
        </div>
        <button className="outline-button" onClick={() => setView("licensing")}><UsersThree size={18} /> Partnership Inquiry</button>
      </section>

      <section className="content-preview">
        <MiniStory title="Gary Burke Legacy" text="A tasteful archive honoring the original vision and musician-led spirit behind beatmondo." image={img.musicArchive} action={() => setView("legacy")} />
        <MiniStory title="Short Sync Clips" text="Fast editorial clips for social discovery, Catalog Highlights, VIP Picks, and licensing conversations." image={img.mediaDesk} action={() => setView("stories")} />
        <MiniStory title="Media Episodes" text="Artist stories, studio sessions, Catalog Highlights, legacy clips, and supervisor conversations." image={img.soulVocal} action={() => setView("media")} />
      </section>
      <Footer setView={setView} />
    </section>
  );
}

function HeroMedia() {
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const playMuted = async () => {
      video.muted = true;
      await video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playMuted();
        } else {
          video.pause();
        }
      },
      { threshold: 0.45 }
    );

    const unlockAudio = () => {
      video.muted = false;
      if (!video.paused) return;
      video.play().catch(() => {});
    };

    observer.observe(video);
    playMuted();
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  return (
    <div className="hero-media">
      {!videoFailed && (
        <video
          ref={videoRef}
          src={opener}
          poster={logo}
          autoPlay
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

function Catalog(props) {
  const {
    tracks: visibleTracks, query, setQuery, filters, setFilters, layout, setLayout, sortBy, setSortBy,
    selectedTrack, setSelectedTrack, playingId, togglePlay, savedIds, saveTrack, openTrack, requestLicense, showToast,
  } = props;
  const resetFilters = () => setFilters({ genre: "All Genres", mood: "Any Mood", tempo: "Any Tempo", era: "Any Era", usage: "Any Usage", vocal: "Any Vocal", availability: "All Availability", duration: "Any Duration", vipCatalog: "All Access", stems: "Any Stem Status", rightsVerified: "Any Rights Status" });
  const chips = Object.entries(filters).filter(([, value]) => !value.startsWith("All") && !value.startsWith("Any"));
  return (
    <section className="catalog-layout">
      <div className="catalog-main">
        <div className="catalog-header">
          <div>
            <span className="tier-badge vip"><LockKey size={14} /> {currentBuyer.accessTier}</span>
            <h2>Curated for high-value sync opportunities.</h2>
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
        <div className="filters wide">
          <Select label="Genre" value={filters.genre} options={["All Genres", "Cinematic", "Indie Rock", "Ambient", "Soul", "Acoustic", "Pop"]} onChange={(genre) => setFilters({ ...filters, genre })} />
          <Select label="Mood" value={filters.mood} options={["Any Mood", "Reflective", "Driven", "Moody", "Emotional", "Inspiring", "Feel Good"]} onChange={(mood) => setFilters({ ...filters, mood })} />
          <Select label="Tempo" value={filters.tempo} options={["Any Tempo", "Slow", "Midtempo", "Upbeat"]} onChange={(tempo) => setFilters({ ...filters, tempo })} />
          <Select label="Era" value={filters.era} options={["Any Era", "Modern", "2000s", "1990s", "1970s"]} onChange={(era) => setFilters({ ...filters, era })} />
          <Select label="Usage" value={filters.usage} options={["Any Usage", "Film / TV", "Advertising", "Documentary", "Trailer", "Brand Film", "Streaming"]} onChange={(usage) => setFilters({ ...filters, usage })} />
          <Select label="Vocal" value={filters.vocal} options={["Any Vocal", "Instrumental", "Vocal"]} onChange={(vocal) => setFilters({ ...filters, vocal })} />
          <Select label="Availability" value={filters.availability} options={["All Availability", "Available Now", "Exclusive Option", "Quote Required"]} onChange={(availability) => setFilters({ ...filters, availability })} />
          <Select label="Duration" value={filters.duration} options={["Any Duration", "Under 3:00", "3:00+"]} onChange={(duration) => setFilters({ ...filters, duration })} />
          <Select label="Access" value={filters.vipCatalog} options={["All Access", "Standard Access", "VIP Picks"]} onChange={(vipCatalog) => setFilters({ ...filters, vipCatalog })} />
          <Select label="Stems" value={filters.stems} options={["Any Stem Status", "Stems Available", "Stems Not Ready"]} onChange={(stems) => setFilters({ ...filters, stems })} />
          <Select label="Rights" value={filters.rightsVerified} options={["Any Rights Status", "Rights Verified", "Rights Review Needed"]} onChange={(rightsVerified) => setFilters({ ...filters, rightsVerified })} />
        </div>
        <div className="chip-row">{chips.map(([key, value]) => <span key={key}>{value}</span>)}{chips.length > 0 && <button onClick={resetFilters}>Clear filters</button>}</div>
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
  return (
    <section className="detail-page">
      <div className="detail-hero">
        <div>
          <span className="eyebrow">Track detail</span>
          <h2>{track.title}</h2>
          <p>{track.artist} · {track.genre} · {track.era}</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => togglePlay(track.id)}>{playingId === track.id ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />} Preview Track</button>
            <button className="outline-button" onClick={() => saveTrack(track.id)}><Heart size={18} weight={saved ? "fill" : "regular"} /> {saved ? "Saved" : "Save to Project"}</button>
            <button className="outline-button" onClick={() => requestLicense(track)}><LockKey size={18} /> Request License</button>
          </div>
        </div>
        <div className="detail-image" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.55)), url(${track.image})` }} />
      </div>
      <div className="large-player">
        <div className="player-top"><strong>Preview Only</strong><span>Protected master audio · WAV available after approval · Secure delivery</span></div>
        <div className="waveform big" />
      </div>
      <div className="detail-grid">
        <Panel title="Available audio assets" action="Access controlled">
          <AssetBadges track={track} />
          <p className="muted-note">Preview is public-limited. WAV master, stems, instrumentals, vocals, edits, loops, and alternate mixes unlock only after approval, payment, or VIP terms.</p>
        </Panel>
        <Panel title="Rights verification summary" action={track.rightsData.rightsVerified ? "Verified" : "Review needed"}>
          <div className="rights-proof-grid">
            <span>Ownership proof: {track.rightsData.ownershipProof}</span>
            <span>PRO / Registry: {track.rightsData.proAffiliation} · {track.rightsData.registrationId}</span>
            <span>Contract: {track.rightsData.contractStatus}</span>
            <span>Preston approval: {track.rightsData.prestonApproval}</span>
          </div>
        </Panel>
      </div>
      <div className="detail-grid">
        <Panel title="Metadata" action="Rights metadata">
          <dl className="definition-grid">
            <dt>Artist</dt><dd>{track.artist}</dd>
            <dt>Composer / Writer</dt><dd>{track.composer}</dd>
            <dt>Genre</dt><dd>{track.genre}</dd>
            <dt>Mood</dt><dd>{track.mood}</dd>
            <dt>Tempo</dt><dd>{track.bpm}</dd>
            <dt>Duration</dt><dd>{track.duration}</dd>
            <dt>Instrumentation</dt><dd>{track.instrumentation}</dd>
            <dt>Era</dt><dd>{track.era}</dd>
            <dt>Vocal status</dt><dd>{track.vocal}</dd>
            <dt>Usage availability</dt><dd>{track.availability}</dd>
          </dl>
        </Panel>
        <Panel title="Rights and clearance" action="Private workflow">
          <p>{track.rights}</p>
          <div className="locked-box"><LockKey size={24} /> Protected master audio <small>Encrypted WAV delivery, download history, and internal review are tracked.</small></div>
        </Panel>
      </div>
      <section>
        <h3>Similar tracks</h3>
        <div className="track-list compact">{tracks.filter((item) => item.id !== track.id).slice(0, 3).map((item) => <TrackRow key={item.id} track={item} isPlaying={playingId === item.id} saved={false} onPlay={() => togglePlay(item.id)} onSave={() => saveTrack(item.id)} onOpen={() => openTrack(item)} onRequest={() => requestLicense(item)} />)}</div>
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
    ["The founding idea", "A musician-led catalog shaped around curiosity, discovery, and respect for the people behind the recordings."],
    ["Studio stories", "Session notes, collaborator memories, gear details, and moments that explain why a track still carries emotional weight."],
    ["Catalog stewardship", "Rights context, provenance, and archive care keep the work licensable without flattening its history."],
    ["Artist-first future", "The legacy extends through discovery tools that help new creative buyers find authentic music responsibly."],
  ];
  const legacyCards = [
    ["Preserving the Original Vision", "Archive Notes", img.tape, "A warm space for founding memories, recording context, handwritten notes, and the musician-led spirit behind beatmondo."],
    ["Studio Memories", "Stories", img.privateStudio, "Behind-the-board moments, collaborators, instruments, and session details that give the catalog its human texture."],
    ["Featured Legacy Tracks", "Listen", img.vinyl, "A restrained selection of archive-connected tracks with provenance, preview listening, and protected master delivery.", true],
    ["Quotes and Stories", "Memories", img.musicArchive, "Short recollections from artists, collaborators, and partners, gathered as an archive rather than a sales pitch."],
  ];

  return (
    <section className="legacy-page">
      <div className="legacy-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,8,6,.88), rgba(10,8,6,.48), rgba(10,8,6,.2)), url(${img.musicArchive})` }}>
        <div className="legacy-hero-copy">
          <span className="eyebrow">Gary Burke legacy</span>
          <h2>Preserving the original vision.</h2>
          <p>A respectful archive for memories, studio stories, collaborators, and the musician-led spirit behind beatmondo.</p>
          <button className="outline-button" onClick={() => setView("catalog")}><MusicNote size={18} /> Explore related music</button>
        </div>
      </div>
      <div className="timeline">{legacyTimeline.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      <div className="archive-grid legacy-archive-grid">
        {legacyCards.map(([title, action, image, text, playable]) => (
          <article className="legacy-card" key={title}>
            <div className="legacy-card-image" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.42)), url(${image})` }} />
            <div>
              <span>{action}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              {playable && <button className="outline-button" onClick={() => openTrack(tracks[3])}>Open legacy track</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LicensingAccess({ selectedTrack, requestSent, setRequestSent }) {
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
          <button type="button" key={tier.id} className={`tier-pick ${selectedTier === tier.name ? "active" : ""}`} onClick={() => setSelectedTier(tier.name)}>
            <span className="tier-badge">{tier.name}</span>
            <strong>{tier.name}</strong>
            <small>{tier.priceLabel}</small>
            <span>{tier.features.slice(0, 3).join(" · ")}</span>
          </button>
        ))}
      </div>
      <div className="licensing-workspace">
        <div>
          {mode === "license" ? (requestSent ? <ConfirmationScreen track={selectedTrack} tier={selectedTier} /> : <InquiryForm track={selectedTrack} onSubmit={() => setRequestSent(true)} selectedTier={selectedTier} />) : (accessSent ? <AccessConfirmation tier={selectedTier} /> : <AccessForm onSubmit={() => setAccessSent(true)} selectedTier={selectedTier} />)}
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

function InquiryModal({ track, requestSent, setRequestSent, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    modalRef.current?.querySelector("input, button, select, textarea")?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="license-modal-title" onClick={onClose}>
      <div className="modal" ref={modalRef} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        {requestSent ? <ConfirmationScreen track={track} compact /> : <><h2 id="license-modal-title">Request license for {track.title}</h2><InquiryForm track={track} onSubmit={() => setRequestSent(true)} compact /></>}
      </div>
    </div>
  );
}

function InquiryForm({ track, onSubmit, compact, selectedTier = currentBuyer.accessTier }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", project: "Luxury Auto Campaign - Fall 2026", brand: "Aster Automotive", production: "Northstar Pictures", campaign: "Fall launch film", type: "OTT / streaming", media: "Online + paid social", territory: "Worldwide", term: "1 year", exclusivity: "Non-exclusive", paidMedia: "Paid + organic", placements: "3", scale: "Global", budget: "$25k-$50k", releaseDate: "", deadline: "", master: "Yes", stems: "Yes", instrumental: "Yes", vocal: "If available", edit: "Maybe", loop: "Maybe", urgent: "Yes", preApproved: selectedTier === "VIP Sync Access" ? "Yes" : "No", message: "" });
  const [attempted, setAttempted] = useState(false);
  const update = (field, value) => setForm({ ...form, [field]: value });
  const handleSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);
    if (!event.currentTarget.checkValidity()) return;
    onSubmit();
  };
  return (
    <form className={`inquiry-form ${compact ? "compact-form" : ""}`} onSubmit={handleSubmit} noValidate>
      {selectedTier === "VIP Sync Access" && <p className="vip-form-note">VIP requests confirm usage parameters first, then move through concierge review and pre-approved terms when available.</p>}
      <FieldGroup title="Buyer details" note="Who should the licensing team verify and contact?">
        {[["name", "Name"], ["email", "Email"], ["company", "Company"], ["role", "Role"]].map(([field, label]) => (
          <label key={field}>
            {label}
            <input required={field !== "role"} value={form[field]} onChange={(event) => update(field, event.target.value)} placeholder={field === "email" ? "name@company.com" : label} />
            {attempted && field !== "role" && !form[field] && <span className="form-error">This field is required.</span>}
          </label>
        ))}
        <label>Buyer access tier<input value={selectedTier} readOnly /></label>
        <label>Buyer verified?<input value={currentBuyer.verified ? "Verified buyer" : "Verification needed"} readOnly /></label>
        <label>VIP buyer?<input value={selectedTier === "VIP Sync Access" ? "Yes" : "No"} readOnly /></label>
        <label>Pre-approved usage terms?<select value={form.preApproved} onChange={(event) => update("preApproved", event.target.value)}><option>Yes</option><option>No</option><option>Requested</option></select></label>
      </FieldGroup>
      <FieldGroup title="Project details" note="Tell us what the music is supporting.">
        <label>Project name<input required value={form.project} onChange={(event) => update("project", event.target.value)} placeholder="Project name" />{attempted && !form.project && <span className="form-error">This field is required.</span>}</label>
        <label>Brand / client name<input value={form.brand} onChange={(event) => update("brand", event.target.value)} /></label>
        <label>Production company<input value={form.production} onChange={(event) => update("production", event.target.value)} /></label>
        <label>Campaign / title<input value={form.campaign} onChange={(event) => update("campaign", event.target.value)} /></label>
        <label>Project type<select value={form.type} onChange={(event) => update("type", event.target.value)}><option>Film / TV</option><option>OTT / streaming</option><option>Advertising</option><option>Brand Film</option><option>Trailer / Promo</option><option>Documentary</option><option>Sports / broadcast</option><option>Luxury / lifestyle campaign</option><option>Game</option><option>Live event</option><option>Editorial / Media</option></select></label>
        <label>Track of interest<input value={track.title} readOnly /></label>
      </FieldGroup>
      <FieldGroup title="Usage terms" note="These fields shape rights review, quote timing, and delivery readiness.">
        <label>Media type<input value={form.media} onChange={(event) => update("media", event.target.value)} /></label>
        <label>Territory<select value={form.territory} onChange={(event) => update("territory", event.target.value)}><option>Worldwide</option><option>North America</option><option>United States</option><option>Europe</option></select></label>
        <label>Term<select value={form.term} onChange={(event) => update("term", event.target.value)}><option>1 year</option><option>2 years</option><option>Perpetual</option><option>Festival only</option></select></label>
        <label>Exclusivity<select value={form.exclusivity} onChange={(event) => update("exclusivity", event.target.value)}><option>Non-exclusive</option><option>Category exclusive</option><option>Full exclusive</option></select></label>
        <label>Paid media or organic use?<select value={form.paidMedia} onChange={(event) => update("paidMedia", event.target.value)}><option>Paid + organic</option><option>Paid media</option><option>Organic only</option><option>Internal only</option></select></label>
        <label>Number of placements<input value={form.placements} onChange={(event) => update("placements", event.target.value)} /></label>
        <label>Usage scale<select value={form.scale} onChange={(event) => update("scale", event.target.value)}><option>Global</option><option>National</option><option>Local</option><option>Festival only</option></select></label>
        <label>Budget range<select value={form.budget} onChange={(event) => update("budget", event.target.value)}><option>$5k-$10k</option><option>$10k-$18k</option><option>$18k-$25k</option><option>$25k-$50k</option><option>$50k+</option></select></label>
        <label>Expected release date<input type="date" value={form.releaseDate} onChange={(event) => update("releaseDate", event.target.value)} /></label>
        <label>Deadline<input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label>
      </FieldGroup>
      <FieldGroup title="Delivery needs" note="Protected files unlock only after approval, payment, or VIP terms.">
        <label>Need WAV master?<select value={form.master} onChange={(event) => update("master", event.target.value)}><option>Yes</option><option>No</option></select></label>
        <label>Need stems?<select value={form.stems} onChange={(event) => update("stems", event.target.value)}><option>No</option><option>Yes</option></select></label>
        <label>Need instrumental?<select value={form.instrumental} onChange={(event) => update("instrumental", event.target.value)}><option>Yes</option><option>No</option><option>If available</option></select></label>
        <label>Need vocal version?<select value={form.vocal} onChange={(event) => update("vocal", event.target.value)}><option>If available</option><option>Yes</option><option>No</option></select></label>
        <label>Need custom edit?<select value={form.edit} onChange={(event) => update("edit", event.target.value)}><option>Maybe</option><option>Yes</option><option>No</option></select></label>
        <label>Need loop/edit points?<select value={form.loop} onChange={(event) => update("loop", event.target.value)}><option>Maybe</option><option>Yes</option><option>No</option></select></label>
        <label>Urgent delivery?<select value={form.urgent} onChange={(event) => update("urgent", event.target.value)}><option>Yes</option><option>No</option></select></label>
      </FieldGroup>
      <FieldGroup title="Message" note="Add scene, campaign, edit, rights, or timing context.">
        <label className="full-field">
          Intended usage / message
          <textarea required value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Describe the scene, campaign, media placement, edit needs, and timing." />
          {attempted && !form.message && <span className="form-error">Please describe the intended usage.</span>}
        </label>
      </FieldGroup>
      <button className="gold-button form-submit" type="submit"><ShieldCheck size={18} /> {selectedTier === "VIP Sync Access" ? "Submit VIP Priority Request" : "Submit License Request"}</button>
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
      <button className="gold-button form-submit" type="submit"><SignIn size={18} /> Request Access</button>
    </form>
  );
}

function ConfirmationScreen({ track, compact, tier = currentBuyer.accessTier }) {
  return (
    <section className={`confirmation ${compact ? "compact-confirmation" : ""}`}>
      <CheckCircle size={52} weight="fill" />
      <h2>Your license request has been received.</h2>
      <p>The beatmondo team will review your usage details for <strong>{track.title}</strong> under <strong>{tier}</strong> and respond with next steps.</p>
      <div className="status-strip">{(tier === "VIP Sync Access" ? ["VIP Priority", "Concierge Review", "Pre-Approved Terms", "Fast-Track Delivery", "VIP Delivered"] : ["Submitted", "In Review", "Quote Needed", "Quote Sent", "Approved", "Paid", "Delivery Ready"]).map((status) => <span key={status}>{status}</span>)}</div>
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
      <div className="metric-grid">
        <Metric icon={Heart} label="Saved Tracks" value={saved.length || "0"} note={saved.length ? "Ready for project review" : "No saved tracks yet"} />
        <Metric icon={BookmarkSimple} label="Active Projects" value="3" note="1 quote pending" />
        <Metric icon={FileAudio} label="License Requests" value="4" note="2 need response" />
        <Metric icon={DownloadSimple} label="Approved Downloads" value="2" note="1 expires soon" />
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
      <div className="project-grid">{projects.map((project) => <ProjectCard key={project.name} project={project} onOpen={() => setView("project")} />)}</div>
      <div className="dashboard-grid">
        <Panel title="Saved tracks" action="Buyer workspace"><div className="track-list compact">{saved.length ? saved.map((track) => <TrackRow key={track.id} track={track} isPlaying={playingId === track.id} saved onPlay={() => togglePlay(track.id)} onSave={() => saveTrack(track.id)} onOpen={() => openTrack(track)} onRequest={() => requestLicense(track)} />) : <EmptyState title="No saved tracks yet" text="Explore music and save tracks to compare inside a project." actionLabel="Explore music" onAction={() => setView("catalog")} />}</div></Panel>
        <Panel title="Submitted license requests" action="Status tracking"><div className="request-list">{inquiries.map((item) => <RequestRow key={item.id} item={item} />)}</div></Panel>
        <Panel title="Recently previewed" action="Discovery"><div className="preview-mini-grid">{tracks.slice(2, 5).map((track) => <button key={track.id} className="preview-mini" onClick={() => openTrack(track)}><span style={{ backgroundImage: `url(${track.image})` }} /><strong>{track.title}</strong><small>{track.artist} · {track.mood}</small></button>)}</div></Panel>
        <Panel title="Approved downloads" action="Secure delivery">
          <div className="delivery-card">
            <LockKey size={30} />
            <strong>Beyond the Horizon</strong>
            <span>Delivery Ready · Expires Jul 30 · 3 downloads remaining · download history tracked</span>
            <div className="delivery-meta"><span>WAV master</span><span>Stems available</span><span>Terms accepted</span><span>Invoice paid</span><span>Role verified</span></div>
            <button className="gold-button" onClick={() => showToast("Secure WAV download started. Delivery history updated.")}><DownloadSimple size={18} /> Secure WAV Download</button>
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
          <div className="button-row"><button className="gold-button" onClick={requestLicense}><ShieldCheck size={18} /> Open VIP Licensing Workspace</button><button className="outline-button" onClick={() => showToast("Multi-track quote request opened.")}><BookmarkSimple size={18} /> Request Multiple Tracks</button><button className="outline-button" onClick={() => showToast("VIP fast-track review requested.")}><Sparkle size={18} /> Fast-Track Review</button></div>
        </div>
      </div>
      <div className="project-workspace-grid">
        <Panel title="Track comparison" action="4 shortlisted">
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
    ["Music Operations", [[MusicNote, "Tracks", "12,842"], [Eye, "Published", "9,876"], [Sparkle, "Stems Ready", "61%"]]],
    ["Licensing", [[ShieldCheck, "VIP Buyers", "42"], [FileAudio, "Revenue Pipeline", "$1.8M"], [DownloadSimple, "Quote Conversion", "38%"]]],
    ["Delivery", [[LockKey, "Secure Downloads", "84"], [Article, "Rights Backlog", "19"], [CloudArrowUp, "Delivery Completion", "92%"]]],
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
      <div className="admin-tabs">{tabs.map((tab) => <button key={tab} className={adminTab === tab ? "active" : ""} onClick={() => setAdminTab(tab)}>{tab}</button>)}</div>
      <div className="admin-metric-groups">
        {metricGroups.map(([group, metrics]) => (
          <section key={group}>
            <h3>{group}</h3>
            <div>
              {metrics.map(([Icon, label, value]) => <Metric key={label} icon={Icon} label={label} value={value} note={label === "Rights Missing" ? "Needs review" : "Current"} />)}
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
  return (
    <div className="cards-admin">
      <article><Eye size={28} /><h3>Private Catalog Intelligence</h3><p>Supervisor Favorites is outperforming other entry paths, and luxury/lifestyle campaigns are trending across buyer projects.</p></article>
      <article><UsersThree size={28} /><h3>VIP activity</h3><p>VIP buyers are saving cinematic instrumental tracks 42% more this week and submitting higher-value quote requests.</p></article>
      <article><FileAudio size={28} /><h3>Stems signal</h3><p>Tracks with stems available are receiving higher quote requests and faster buyer progression.</p></article>
      <article><LockKey size={28} /><h3>Revenue blocked by rights</h3><p>3 high-interest tracks are blocked by missing rights documentation, contract review, or Preston approval.</p></article>
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
          <span className="feature-story-kicker">Episode · {active[2]} · beatmondo Media</span>
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
          <span className="eyebrow">Contact beatmondo</span>
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
      <div className="waveform" aria-hidden="true" />
      <button className="outline-button" onClick={onOpen}>Details</button>
    </aside>
  );
}

function ImageCard({ title, text, image, action }) {
  return <article className="image-card" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.64)), url(${image})` }}><div><h3>{title}</h3><p>{text}</p><button onClick={action}>Explore Music</button></div></article>;
}

function CollectionCard({ title, text, count, tags, image, onView }) {
  return <article className="collection-card"><div style={{ backgroundImage: `url(${image})` }} /><h3>{title}</h3><p>{text}</p><span>{count} tracks</span><div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button onClick={onView}>Explore selection</button></article>;
}

function AccessTierCard({ tier, onSelect }) {
  return (
    <article className={`tier-card ${tier.id === "vip" ? "vip-tier" : ""}`}>
      <span className="tier-badge">{tier.name}</span>
      <h3>{tier.name}</h3>
      <p>{tier.description}</p>
      <strong>{tier.priceLabel}</strong>
      <ul>{tier.features.map((feature) => <li key={feature}><CheckCircle size={15} weight="fill" /> {feature}</li>)}</ul>
      <button className={tier.id === "vip" ? "gold-button" : "outline-button"} onClick={onSelect}>{tier.id === "vip" ? "Apply for VIP Access" : "Request Access"}</button>
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

function Panel({ title, action, children }) {
  return <section className="panel"><div className="panel-head"><h3>{title}</h3><span>{action}</span></div>{children}</section>;
}

function Metric({ icon: Icon, label, value, note }) {
  return <article className="metric"><Icon size={24} weight="duotone" /><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function TrustItem({ icon: Icon, title, text }) {
  return <div className="trust-item"><Icon size={30} /><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function MiniStory({ title, text, image, action }) {
  return <article className="mini-story"><div style={{ backgroundImage: `url(${image})` }} /><h3>{title}</h3><p>{text}</p><button onClick={action}>Open</button></article>;
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
