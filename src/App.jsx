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
  console: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
  vinyl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  tape: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1200&q=80",
  film: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
  edit: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
  concert: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  portrait: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
  archive: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80",
  agency: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  car: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  city: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
};

const tracks = [
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
    availability: "Exclusive Available",
    duration: "2:34",
    key: "C# Major",
    instrumentation: "Felt piano, bowed guitar, warm analog pads",
    tags: ["Warm", "Uplifting", "Reflective"],
    status: "Admin Reviewed",
    image: img.studio,
    rights: "One-stop clearance available for select usages. Master controlled by Beatmondo partner catalog.",
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
    status: "Secure Delivery",
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
    status: "Quote Needed",
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
    status: "WAV Protected",
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
    status: "Available",
    image: img.agency,
    rights: "Non-exclusive digital campaigns can be reviewed within two business days.",
  },
];

const useCases = [
  ["Film & Television", "Emotional themes, source cues, title beds, and end-credit moments.", img.film],
  ["Advertising & Brand Campaigns", "Authentic tracks for launches, product films, and premium storytelling.", img.agency],
  ["Trailers & Promos", "Impactful builds, emotional lifts, and quote-ready archive tracks.", img.edit],
  ["Documentary & Editorial", "Human, textured music with provenance and rights context.", img.studio],
  ["Streaming & Digital Content", "Polished music for series, digital originals, and social films.", img.city],
  ["Events & Experiences", "Atmospheric catalog selections for launches, installations, and live moments.", img.concert],
  ["Sports & Broadcast", "Driven cues for broadcast packages, promos, and human achievement stories.", img.car],
  ["Luxury / Lifestyle Campaigns", "Warm, tasteful tracks for refined brand worlds.", img.vinyl],
];

const collections = [
  ["Staff Picks", "A weekly edit of tracks with story, restraint, and sync potential.", 42, ["Curated", "New"], img.console],
  ["From the Archive", "Rare recordings, legacy cuts, and catalog stories worth resurfacing.", 68, ["Archive", "Soul"], img.archive],
  ["Music for Emotional Storytelling", "Piano-led, acoustic, and vocal tracks for human narratives.", 53, ["Film", "Documentary"], img.studio],
  ["Cinematic Instrumentals", "Preview-only instrumentals with protected master delivery.", 37, ["Score", "Trailer"], img.edit],
  ["Americana & Soul", "Warm guitars, lived-in performances, and vocal character.", 29, ["Roots", "Vocal"], img.vinyl],
  ["Supervisor Favorites", "Tracks repeatedly saved by professional creative buyers.", 31, ["Buyer", "Proven"], img.film],
];

const projects = [
  { name: "Luxury Auto Campaign - Fall 2026", type: "Advertising", status: "Quote Sent", tracks: 4, notes: 6, image: img.car },
  { name: "Documentary Opening Titles", type: "Documentary", status: "Under Review", tracks: 7, notes: 11, image: img.film },
  { name: "Premium Hotel Launch Film", type: "Brand Film", status: "Approved", tracks: 2, notes: 3, image: img.city },
];

const inquiries = [
  { id: "BM-1048", company: "VisionTech", track: "Golden Hours", type: "Corporate Promo", budget: "$18k-$25k", deadline: "Jul 12", status: "Approved" },
  { id: "BM-1047", company: "National Geographic", track: "Midnight Transit", type: "Documentary", budget: "$25k-$50k", deadline: "Jul 18", status: "Quote Needed" },
  { id: "BM-1046", company: "Peak Performance", track: "Paper Planes", type: "Ad Campaign", budget: "$50k+", deadline: "Jun 30", status: "Quote Sent" },
  { id: "BM-1045", company: "Moonline Films", track: "All That Remains", type: "Film Trailer", budget: "$10k-$18k", deadline: "Jul 4", status: "In Review" },
];

const artists = [
  { name: "Lennox", credit: "Independent composer, film textures, modern piano", tracks: 18, image: img.portrait },
  { name: "Arco North", credit: "Guitar-led indie catalog with sync-friendly hooks", tracks: 24, image: img.concert },
  { name: "Vespera", credit: "Soul archive with rare vocal performances", tracks: 11, image: img.vinyl },
];

const navItems = [
  ["home", "Home", House],
  ["catalog", "Catalog", MagnifyingGlass],
  ["track", "Track Detail", FileAudio],
  ["artist", "Artist Profile", MicrophoneStage],
  ["legacy", "Gary Burke Legacy", Archive],
  ["licensing", "Licensing / Access", ShieldCheck],
  ["buyer", "Buyer Dashboard", UserCircle],
  ["project", "Project Detail", BookmarkSimple],
  ["admin", "Admin", GearSix],
  ["content", "Blog / Podcast", Article],
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
        && matchesDuration(track.duration, filters.duration);
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
        aria-label="Go to Beatmondo homepage"
      >
        <img className="brand-logo" src={logo} alt="Beatmondo" />
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
        <span className="eyebrow">Beatmondo Prototype</span>
        <h1>{navItems.find(([id]) => id === view)?.[1]}</h1>
      </div>
      <div className="top-actions">
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
          <p><DownloadSimple size={16} /> Secure WAV ready for Premium Hotel Launch Film</p>
        </div>
      )}
    </header>
  );
}

function PublicHeader({ setView }) {
  return (
    <header className="public-header">
      <button className="public-logo" onClick={() => setView("home")} aria-label="Beatmondo home">
        <img src={logo} alt="Beatmondo" />
      </button>
      <nav>
        <button onClick={() => setView("catalog")}>Explore Music</button>
        <button onClick={() => setView("licensing")}>Licensing</button>
        <button onClick={() => setView("legacy")}>Legacy</button>
        <button onClick={() => setView("content")}>Stories</button>
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
          <span className="eyebrow">Premium music discovery and sync licensing</span>
          <h2>Curated music with context, built for licensing conversations.</h2>
          <p>Beatmondo brings authentic tracks, artist provenance, rights-aware metadata, and secure master delivery into one refined workspace for serious creative buyers.</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => setView("catalog")}><Play size={18} weight="fill" /> Explore Music</button>
            <button className="outline-button" onClick={() => setView("licensing")}><LockKey size={18} /> Request Licensing Access</button>
            <button className="plain-button" onClick={() => setView("legacy")}><Archive size={18} /> Learn the Story</button>
          </div>
        </div>
        <HeroMedia />
      </div>

      <section className="editorial-band">
        <div className="section-kicker"><span className="eyebrow">What is Beatmondo?</span><h2>Not stock music. A curated licensing experience.</h2></div>
        <div className="section-grid">
          <Panel title="Curated music with context" action="Editorial">
            <p>Tracks are presented with artist notes, use-case cues, rights details, and a clear path from preview to licensing review.</p>
          </Panel>
          <Panel title="Built for professional buyers" action="Workflow">
            <p>Music supervisors, brands, agencies, producers, and creative directors can save tracks into projects, compare options, and submit usage detail before quote.</p>
          </Panel>
          <Panel title="Secure master delivery" action="Protected">
            <p>Preview streams stay separate from protected WAV/master files, which are delivered only through approved licensing workflows.</p>
          </Panel>
        </div>
      </section>

      <section>
        <div className="section-kicker"><span className="eyebrow">Music for creative use</span><h2>Search by the work you are making.</h2></div>
        <div className="image-card-grid use-cases">
          {useCases.map(([title, text, image]) => <ImageCard key={title} title={title} text={text} image={image} action={() => setView("catalog")} />)}
        </div>
      </section>

      <section className="warm-band collections-band">
        <div className="section-heading"><div><span className="eyebrow">Curated collections</span><h2>Editorial paths into the catalog.</h2></div><button onClick={() => setView("catalog")}>View catalog</button></div>
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
          <h3>Trusted by licensing professionals</h3>
          <TrustItem icon={ShieldCheck} title="Rights-aware metadata" text="Usage, territory, term, and clearance notes stay attached to the licensing workflow." />
          <TrustItem icon={LockKey} title="Protected masters" text="WAV files and stems stay locked until approval, payment, and delivery rules are complete." />
          <TrustItem icon={UsersThree} title="Artist-first catalog" text="Real musicianship, provenance, and relationship-led licensing sit at the center." />
        </div>
      </section>

      <section className="partner-band">
        <div>
          <span className="eyebrow">For strategic partners</span>
          <h2>A catalog foundation built for long-term value.</h2>
          <p>Beatmondo combines curated catalog exploration, rights-aware metadata, secure licensing workflows, and artist-first positioning for thoughtful partnership and future catalog expansion.</p>
        </div>
        <button className="outline-button" onClick={() => setView("licensing")}><UsersThree size={18} /> Partnership Inquiry</button>
      </section>

      <section className="content-preview">
        <MiniStory title="Gary Burke Legacy" text="A tasteful archive honoring the original vision and musician-led spirit behind Beatmondo." image={img.archive} action={() => setView("legacy")} />
        <MiniStory title="Blog / News" text="Licensing education, artist stories, behind-the-catalog notes, and industry conversations." image={img.console} action={() => setView("content")} />
        <MiniStory title="Podcast / Media" text="Conversations with artists, supervisors, collaborators, and catalog partners." image={img.portrait} action={() => setView("content")} />
      </section>
      <Footer setView={setView} />
    </section>
  );
}

function HeroMedia() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const playWithAudio = async () => {
      try {
        video.muted = false;
        await video.play();
      } catch {
        video.muted = true;
        await video.play().catch(() => {});
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playWithAudio();
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
    playWithAudio();
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
      <video ref={videoRef} src={opener} poster={logo} autoPlay loop playsInline />
    </div>
  );
}

function Catalog(props) {
  const {
    tracks: visibleTracks, query, setQuery, filters, setFilters, layout, setLayout, sortBy, setSortBy,
    selectedTrack, setSelectedTrack, playingId, togglePlay, savedIds, saveTrack, openTrack, requestLicense, showToast,
  } = props;
  const resetFilters = () => setFilters({ genre: "All Genres", mood: "Any Mood", tempo: "Any Tempo", era: "Any Era", usage: "Any Usage", vocal: "Any Vocal", availability: "All Availability", duration: "Any Duration" });
  const chips = Object.entries(filters).filter(([, value]) => !value.startsWith("All") && !value.startsWith("Any"));
  return (
    <section className="catalog-layout">
      <div className="catalog-main">
        <div className="catalog-header">
          <div>
            <h2>Curated for Your Next Story</h2>
            <p>Search by mood, use case, artist, era, tempo, clearance, and delivery readiness.</p>
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
          <Select label="Availability" value={filters.availability} options={["All Availability", "Available Now", "Exclusive Available", "Quote Required"]} onChange={(availability) => setFilters({ ...filters, availability })} />
          <Select label="Duration" value={filters.duration} options={["Any Duration", "Under 3:00", "3:00+"]} onChange={(duration) => setFilters({ ...filters, duration })} />
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
        <strong>{track.title} <span>{track.status}</span></strong>
        <small>{track.artist} · {track.genre} · {track.bpm}</small>
        <div>{track.tags.slice(0, 3).map((tag) => <em key={tag}>{tag}</em>)}</div>
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
      <div><h3>{track.title}</h3><p>{track.artist} · {track.genre}</p></div>
      <div className="waveform" />
      <div className="tag-row">{track.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}<span>{track.duration}</span></div>
      <div className="button-row"><button className={`heart ${saved ? "saved" : ""}`} onClick={onSave}><Heart weight={saved ? "fill" : "regular"} /></button><button className="outline-button" onClick={onOpen}>Details</button><button className="gold-button" onClick={onRequest}>License</button></div>
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
      <div className="rights-list">
        <h3>Rights & licensing</h3>
        <p>Preview Only</p>
        <p>Master File Protected</p>
        <p>WAV Available After Approval</p>
        <p>Admin Reviewed</p>
      </div>
      <button className="gold-button full" onClick={() => requestLicense(track)}><ShieldCheck size={18} /> Request License</button>
      <div className="locked-box"><LockKey size={28} /> Secure Delivery <small>Protected master files are delivered only after approval.</small></div>
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
            <button className="outline-button" onClick={() => requestLicense(track)}><LockKey size={18} /> Request WAV / Master</button>
          </div>
        </div>
        <div className="detail-image" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.55)), url(${track.image})` }} />
      </div>
      <div className="large-player">
        <div className="player-top"><strong>Preview Only</strong><span>Master File Protected · WAV Available After Approval · Secure Delivery</span></div>
        <div className="waveform big" />
      </div>
      <div className="detail-grid">
        <Panel title="Metadata" action="Catalog ready">
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
          <div className="locked-box"><LockKey size={24} /> Protected master/WAV <small>Encrypted file delivery, download history, and internal review are tracked.</small></div>
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
          <div className="button-row"><button className="gold-button" onClick={requestLicense}><ShieldCheck size={18} /> Licensing Inquiry</button><button className="outline-button" onClick={() => setView("content")}><Article size={18} /> Editorial Story</button></div>
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
    ["Preserving the Original Vision", "Archive Notes", img.tape, "A warm space for founding memories, recording context, handwritten notes, and the musician-led spirit behind Beatmondo."],
    ["Studio Memories", "Stories", img.console, "Behind-the-board moments, collaborators, instruments, and session details that give the catalog its human texture."],
    ["Featured Legacy Tracks", "Listen", img.vinyl, "A restrained selection of archive-connected tracks with provenance, preview listening, and protected master delivery.", true],
    ["Quotes and Stories", "Memories", img.portrait, "Short recollections from artists, collaborators, and partners, gathered as an archive rather than a sales pitch."],
  ];

  return (
    <section className="legacy-page">
      <div className="legacy-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,8,6,.88), rgba(10,8,6,.48), rgba(10,8,6,.2)), url(${img.console})` }}>
        <div className="legacy-hero-copy">
          <span className="eyebrow">Gary Burke legacy</span>
          <h2>Preserving the original vision.</h2>
          <p>A respectful archive for memories, studio stories, collaborators, and the musician-led spirit behind Beatmondo.</p>
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
  return (
    <section className="form-page wide-page">
      <div className="form-intro">
        <span className="eyebrow">Licensing and access</span>
        <h2>Usage details first. Secure delivery after approval.</h2>
        <p>Request licensing for a track or apply for buyer, artist, or strategic partner access. Beatmondo keeps the process clear, human, and audit-ready.</p>
        <div className="segmented stacked"><button className={mode === "license" ? "active" : ""} onClick={() => setMode("license")}>Licensing Request</button><button className={mode === "access" ? "active" : ""} onClick={() => setMode("access")}>Request Access</button></div>
      </div>
      {mode === "license" ? (requestSent ? <ConfirmationScreen track={selectedTrack} /> : <InquiryForm track={selectedTrack} onSubmit={() => setRequestSent(true)} />) : (accessSent ? <AccessConfirmation /> : <AccessForm onSubmit={() => setAccessSent(true)} />)}
    </section>
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

function InquiryForm({ track, onSubmit, compact }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", project: "Luxury Auto Campaign - Fall 2026", type: "Film / TV", media: "Online + paid social", territory: "Worldwide", term: "1 year", exclusivity: "Non-exclusive", budget: "$10k-$18k", deadline: "", master: "Yes", stems: "No", edit: "Maybe", message: "" });
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
      {[["name", "Name"], ["email", "Email"], ["company", "Company"], ["role", "Role"], ["project", "Project name"]].map(([field, label]) => (
        <label key={field}>
          {label}
          <input required={field !== "role"} value={form[field]} onChange={(event) => update(field, event.target.value)} placeholder={field === "email" ? "name@company.com" : label} />
          {attempted && field !== "role" && !form[field] && <span className="form-error">This field is required.</span>}
        </label>
      ))}
      <label>Project type<select value={form.type} onChange={(event) => update("type", event.target.value)}><option>Film / TV</option><option>Advertising</option><option>Brand Film</option><option>Trailer / Promo</option><option>Podcast / Media</option></select></label>
      <label>Track of interest<input value={track.title} readOnly /></label>
      <label>Media type<input value={form.media} onChange={(event) => update("media", event.target.value)} /></label>
      <label>Territory<select value={form.territory} onChange={(event) => update("territory", event.target.value)}><option>Worldwide</option><option>North America</option><option>United States</option><option>Europe</option></select></label>
      <label>Term<select value={form.term} onChange={(event) => update("term", event.target.value)}><option>1 year</option><option>2 years</option><option>Perpetual</option><option>Festival only</option></select></label>
      <label>Exclusivity<select value={form.exclusivity} onChange={(event) => update("exclusivity", event.target.value)}><option>Non-exclusive</option><option>Category exclusive</option><option>Full exclusive</option></select></label>
      <label>Budget range<select value={form.budget} onChange={(event) => update("budget", event.target.value)}><option>$5k-$10k</option><option>$10k-$18k</option><option>$18k-$25k</option><option>$25k-$50k</option><option>$50k+</option></select></label>
      <label>Deadline<input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label>
      <label>Need WAV/master?<select value={form.master} onChange={(event) => update("master", event.target.value)}><option>Yes</option><option>No</option></select></label>
      <label>Need stems?<select value={form.stems} onChange={(event) => update("stems", event.target.value)}><option>No</option><option>Yes</option></select></label>
      <label>Need custom edit?<select value={form.edit} onChange={(event) => update("edit", event.target.value)}><option>Maybe</option><option>Yes</option><option>No</option></select></label>
      <label className="full-field">
        Intended usage / message
        <textarea required value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Describe the scene, campaign, media placement, edit needs, and timing." />
        {attempted && !form.message && <span className="form-error">Please describe the intended usage.</span>}
      </label>
      <button className="gold-button form-submit" type="submit"><ShieldCheck size={18} /> Submit Inquiry</button>
    </form>
  );
}

function AccessForm({ onSubmit }) {
  const [role, setRole] = useState("Music Supervisor");
  return (
    <form className="inquiry-form access-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="role-grid">{["Music Supervisor", "Film / TV Producer", "Brand / Agency", "Trailer Editor", "Artist / Contributor", "Strategic Partner", "Other"].map((item) => <button type="button" key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)}>{item}</button>)}</div>
      <label>Name<input required placeholder="Jane Mitchell" /></label>
      <label>Email<input required placeholder="name@company.com" /></label>
      <label>Company<input required placeholder="Company or studio" /></label>
      <label>Role<input value={role} readOnly /></label>
      <label className="full-field">Intended use<textarea required placeholder="Tell us how you expect to use Beatmondo." /></label>
      <label className="full-field">Message<textarea placeholder="Anything the team should know?" /></label>
      <button className="gold-button form-submit" type="submit"><SignIn size={18} /> Request Access</button>
    </form>
  );
}

function ConfirmationScreen({ track, compact }) {
  return (
    <section className={`confirmation ${compact ? "compact-confirmation" : ""}`}>
      <CheckCircle size={52} weight="fill" />
      <h2>Your licensing request has been received.</h2>
      <p>The Beatmondo team will review your usage details for <strong>{track.title}</strong> and respond with next steps.</p>
      <div className="status-strip">{["Submitted", "Under Review", "Quote Needed", "Quote Sent", "Approved", "Paid", "Delivered"].map((status) => <span key={status}>{status}</span>)}</div>
    </section>
  );
}

function AccessConfirmation() {
  return <section className="confirmation"><CheckCircle size={52} weight="fill" /><h2>Access request received.</h2><p>Beatmondo will review your role, company, and intended use before enabling the right workspace permissions.</p><div className="status-strip"><span>Request received</span><span>Role review</span><span>Workspace setup</span></div></section>;
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
      <div className="metric-grid">
        <Metric icon={Heart} label="Saved Tracks" value={saved.length || "0"} note={saved.length ? "Ready for project review" : "No saved tracks yet"} />
        <Metric icon={BookmarkSimple} label="Active Projects" value="3" note="1 quote pending" />
        <Metric icon={FileAudio} label="Licensing Requests" value="4" note="2 need response" />
        <Metric icon={DownloadSimple} label="Approved Downloads" value="2" note="1 expires soon" />
      </div>
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
        <Panel title="Saved tracks" action="Buyer workspace"><div className="track-list compact">{saved.length ? saved.map((track) => <TrackRow key={track.id} track={track} isPlaying={playingId === track.id} saved onPlay={() => togglePlay(track.id)} onSave={() => saveTrack(track.id)} onOpen={() => openTrack(track)} onRequest={() => requestLicense(track)} />) : <EmptyState title="No saved tracks yet" text="Explore the catalog and save tracks to compare inside a project." actionLabel="Explore catalog" onAction={() => setView("catalog")} />}</div></Panel>
        <Panel title="Submitted licensing requests" action="Status tracking"><div className="request-list">{inquiries.map((item) => <RequestRow key={item.id} item={item} />)}</div></Panel>
        <Panel title="Recently previewed" action="Discovery"><div className="preview-mini-grid">{tracks.slice(2, 5).map((track) => <button key={track.id} className="preview-mini" onClick={() => openTrack(track)}><span style={{ backgroundImage: `url(${track.image})` }} /><strong>{track.title}</strong><small>{track.artist} · {track.mood}</small></button>)}</div></Panel>
        <Panel title="Approved downloads" action="Secure delivery">
          <div className="delivery-card">
            <LockKey size={30} />
            <strong>Beyond the Horizon</strong>
            <span>Expires Jul 30 · 3 downloads remaining · download history tracked</span>
            <div className="delivery-meta"><span>WAV master</span><span>Invoice paid</span><span>Role verified</span></div>
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
          <p>Shortlist music, compare licensing fit, capture buyer notes, and move selected tracks toward quote approval.</p>
          <div className="project-meta-strip">
            <span>Advertising</span><span>Worldwide</span><span>$25k-$50k</span><span>Deadline Sep 18</span><span>Quote Sent</span>
          </div>
          <div className="button-row"><button className="gold-button" onClick={requestLicense}><ShieldCheck size={18} /> Submit Multi-Track Request</button><button className="outline-button" onClick={() => showToast("Track picker opened for this project.")}><BookmarkSimple size={18} /> Add Track</button></div>
        </div>
      </div>
      <div className="project-workspace-grid">
        <Panel title="Track comparison" action="4 shortlisted">
          <div className="comparison-table">
            <div className="comparison-head"><span>Track</span><span>Mood</span><span>Use fit</span><span>License</span><span /></div>
            {projectTracks.map((track) => (
              <button className="comparison-row" key={track.id} onClick={() => openTrack(track)}>
                <span><strong>{track.title}</strong><small>{track.artist} · {track.duration}</small></span>
                <span>{track.mood}</span>
                <span>{track.usage}</span>
                <span>{track.availability}</span>
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
            <span>4 tracks selected</span><span>Worldwide paid media</span><span>1 year term</span><span>Non-exclusive</span><span>Master files locked</span><span>Quote expires Sep 12</span>
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
    ["Catalog", [[MusicNote, "Tracks", "12,842"], [Eye, "Published", "9,876"], [Sparkle, "Health", "94%"]]],
    ["Licensing", [[ShieldCheck, "New Inquiries", "37"], [FileAudio, "Quote Requests", "14"], [DownloadSimple, "Approved", "216"]]],
    ["Delivery", [[LockKey, "Secure Downloads", "84"], [Article, "Rights Missing", "19"], [CloudArrowUp, "Recent Masters", "28"]]],
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
      <div className="admin-grid">
        <section className="pipeline-panel">
          <h3>Licensing inquiry pipeline</h3>
          <div className="pipeline">
            {["New", "In Review", "Quote Needed", "Quote Sent", "Approved", "Paid", "Delivered"].map((status, index) => (
              <button key={status} onClick={() => showToast(`Filtered pipeline by ${status}.`)}>
                <span>{status}</span>
                <strong>{[37, 21, 14, 9, 11, 7, 5][index]}</strong>
              </button>
            ))}
          </div>
        </section>
        <Panel title={adminTab === "Overview" ? "Catalog operations" : `${adminTab} management`} action="Operational view">{renderAdminPanel()}</Panel>
        <Panel title="Activity feed" action="Audit ready">
          <div className="activity-list">{["License delivered to VisionTech", "New inquiry from National Geographic", "Quote approved for Peak Performance", "Track uploaded: Midnight Conversations", "Permissions updated"].map((text, index) => <p key={text}><CheckCircle size={18} /> {text} <span>{index * 8 + 2}m ago</span></p>)}</div>
          <p className="admin-audit-note">Audit trail synced across licensing, delivery, and permissions events.</p>
        </Panel>
      </div>
    </section>
  );
}

function OverviewAdmin({ showToast }) {
  return (
    <div className="cards-admin">
      <article><Sparkle size={28} /><h3>Catalog health</h3><p>94% of published tracks have complete rights notes, preview audio, and delivery readiness.</p><button onClick={() => showToast("Catalog health report opened.")}>Open report</button></article>
      <article><ShieldCheck size={28} /><h3>Licensing queue</h3><p>37 new inquiries, 14 quote requests, and 9 approvals awaiting payment confirmation.</p><button onClick={() => showToast("Licensing queue filtered to active items.")}>Review queue</button></article>
    </div>
  );
}

function AnalyticsAdmin() {
  return (
    <div className="cards-admin">
      <article><Eye size={28} /><h3>Discovery trends</h3><p>Catalog previews up 18% this month. Cinematic and ambient tags lead supervisor saves.</p></article>
      <article><UsersThree size={28} /><h3>Buyer activity</h3><p>Music supervisors account for 42% of saved tracks and 61% of submitted licensing requests.</p></article>
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
  return (
    <div className="track-ops">
      <div className="admin-table">
        <div className="table-toolbar"><input placeholder="Search tracks, artists, ISRC..." /><button onClick={() => showToast("Track upload workflow opened.")}><CloudArrowUp size={18} /> Add Track</button></div>
        <table>
          <thead><tr><th>Track</th><th>Artist</th><th>Status</th><th>Preview</th><th>Master</th><th>Rights</th></tr></thead>
          <tbody>{tracks.slice(0, 5).map((track) => <tr key={track.id}><td>{track.title}<small>ISRC US-BMO-25-000{track.id}</small></td><td>{track.artist}</td><td><span className="badge">{track.status}</span></td><td><button className="mini-play" aria-label={`Preview ${track.title}`} onClick={() => togglePlay(track.id)}><Play size={14} weight="fill" /></button> Ready</td><td><LockKey size={16} /> Protected</td><td>{track.id === 4 ? "Missing" : "Reviewed"}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="file-separation"><div><FileAudio size={24} /><strong>Preview audio upload</strong><p>Public preview stream, compressed and watermarked for approved buyers.</p></div><div><LockKey size={24} /><strong>Protected master/WAV upload</strong><p>Private file, encrypted, not publicly downloadable, delivered only after approval.</p></div></div>
    </div>
  );
}

function ArtistAdmin({ showToast }) {
  return <div className="cards-admin">{artists.map((artist) => <article key={artist.name}><div className="portrait small" style={{ backgroundImage: `url(${artist.image})` }} /><h3>{artist.name}</h3><p>{artist.credit}</p><span>{artist.tracks} related tracks</span><button onClick={() => showToast(`Managing artist profile for ${artist.name}.`)}>Manage artist</button></article>)}</div>;
}

function InquiryAdmin() {
  return <div className="request-list">{inquiries.map((item) => <RequestRow key={item.id} item={item} detailed />)}</div>;
}

function BuyerAdmin({ showToast }) {
  return <div className="cards-admin">{["Aster Studio", "Northline Pictures", "Cobalt Agency"].map((name) => <article key={name}><UsersThree size={28} /><h3>{name}</h3><p>Role-based access, saved projects, invoice contacts, and request history.</p><button onClick={() => showToast(`Opened buyer account for ${name}.`)}>Open account</button></article>)}</div>;
}

function SecureDeliveryAdmin({ showToast }) {
  return <div className="cards-admin"><article><LockKey size={28} /><h3>Delivery queue</h3><p>5 approved licenses waiting on payment confirmation before WAV delivery.</p><button onClick={() => showToast("Delivery queue opened.")}>Review queue</button></article><article><DownloadSimple size={28} /><h3>Download history</h3><p>Every master download is timestamped and tied to buyer role, project, and license.</p><button onClick={() => showToast("Download history opened.")}>View logs</button></article></div>;
}

function MediaAdmin({ showToast }) {
  return <div className="cards-admin"><article><Article size={28} /><h3>Blog editor</h3><p>Featured story, categories, tags, draft status, and publish controls.</p><button onClick={() => showToast("Blog editor opened.")}>Edit news</button></article><article><FilmSlate size={28} /><h3>Podcast media</h3><p>Episode detail, embedded audio/video, show notes, and guest references.</p><button onClick={() => showToast("Podcast media manager opened.")}>Manage episodes</button></article></div>;
}

function AuditAdmin() {
  return <div className="activity-list">{["Role changed: Content Manager", "Master download approved", "Track rights notes edited", "Buyer access revoked", "Quote status changed"].map((item) => <p key={item}><ShieldCheck size={18} /> {item}<span>Immutable log</span></p>)}</div>;
}

function ContentPages({ setView, showToast }) {
  const posts = ["Music Licensing Education", "Artist Stories", "Behind the Catalog", "Gary Burke Legacy", "Sync Licensing Insights", "Beatmondo Updates", "Industry Conversations"];
  const episodes = ["Artist interviews", "Licensing conversations", "Catalog stories", "Behind-the-scenes", "Music supervisor insights"];
  const thumbs = [
    [img.portrait, "Artist Interview · Vocal texture"],
    [img.vinyl, "Live Culture · Event energy"],
    [img.edit, "Editing Notes · Trailer rhythm"],
  ];
  return (
    <section className="content-page">
      <div className="content-grid">
        <article className="feature-story" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.70)), url(${img.console})` }}>
          <span className="feature-story-kicker">Essay · 6 min read · Rights-aware catalog stories</span>
          <span className="eyebrow">Featured story</span>
          <h2>The musicians behind unforgettable sounds</h2>
          <p>Editorial storytelling gives buyers a richer understanding of provenance, collaborators, recording context, and why the work matters.</p>
          <button className="gold-button" onClick={() => showToast("Featured story opened in editorial reader.")}><Article size={18} /> Read Story</button>
        </article>
        <Panel title="Blog / news categories" action="Strategic"><div className="state-grid">{posts.map((title) => <button key={title} className="chip-button" onClick={() => showToast(`Filtered stories by ${title}.`)}>{title}</button>)}</div></Panel>
        <Panel title="Podcast / media" action="Episodes"><div className="state-grid">{episodes.map((title) => <button key={title} className="chip-button" onClick={() => showToast(`Opened episodes tagged ${title}.`)}>{title}</button>)}</div></Panel>
        <Panel title="Latest covers" action="Thumbnails">
          <div className="mini-thumb-row">
            {thumbs.map(([image, caption]) => (
              <span key={caption} style={{ backgroundImage: `url(${image})` }}>
                <span className="thumb-caption">{caption}</span>
              </span>
            ))}
          </div>
        </Panel>
        <p className="content-archive-note">Editorial archive · Licensing explainers, artist provenance, catalog updates, podcast conversations, and behind-the-scenes notes for supervisors and buyers.</p>
      </div>
    </section>
  );
}

function DesignSystem() {
  const palette = ["#18130f", "#2a231b", "#f4efe6", "#cdbfaa", "#a6533c", "#5f7167"];
  return (
    <section className="system-page">
      <div className="system-brand"><img src={logo} alt="Beatmondo logo usage" /><p>Use black and gold as accents within a broader editorial system: charcoal, ivory, taupe, champagne, warm grey, and muted category colors.</p></div>
      <div className="swatches">{palette.map((color) => <span key={color} style={{ "--swatch": color }}>{color}</span>)}</div>
      <div className="section-grid">
        <Panel title="Buttons & forms" action="Controls"><div className="button-row"><button className="gold-button">Primary</button><button className="outline-button">Secondary</button><button className="plain-button">Text action</button></div><input placeholder="Form input" /></Panel>
        <Panel title="Audio player" action="Components"><div className="large-player small-player"><div className="waveform big" /><span>Preview-only playback state</span></div></Panel>
        <Panel title="Status badges" action="Licensing"><div className="tag-row"><span>Under Review</span><span>Quote Sent</span><span>Approved</span><span>Delivered</span></div></Panel>
        <Panel title="Empty / loading / error" action="States"><p>Empty projects, missing rights notes, expired downloads, locked masters, and quote states are represented with calm product language.</p></Panel>
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
  return <article className="image-card" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.64)), url(${image})` }}><div><h3>{title}</h3><p>{text}</p><button onClick={action}>Explore Tracks</button></div></article>;
}

function CollectionCard({ title, text, count, tags, image, onView }) {
  return <article className="collection-card"><div style={{ backgroundImage: `url(${image})` }} /><h3>{title}</h3><p>{text}</p><span>{count} tracks</span><div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button onClick={onView}>View collection</button></article>;
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
  return <article className="request-row"><div><strong>{item.company}</strong><span>{item.track} · {item.type}</span>{detailed && <small>{item.id} · {item.budget} · Deadline {item.deadline}</small>}</div><span className="badge">{item.status}</span></article>;
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
    ["Media", ["Blog", "Podcast / Media", "Contact"]],
    ["Access", ["Request Access", "Privacy Policy", "Terms of Use"]],
  ];
  const navigate = (item) => {
    if (item === "Explore Music") setView("catalog");
    else if (item === "Gary Burke Legacy") setView("legacy");
    else if (item === "Request Access" || item === "Licensing") setView("licensing");
    else if (item === "Artists") setView("artist");
    else setView("content");
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src={logo} alt="Beatmondo" />
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
        <small>Master files are protected and delivered only through approved licensing workflows. Copyright and rights notice applies to all catalog materials.</small>
      </div>
    </footer>
  );
}

export { App };
