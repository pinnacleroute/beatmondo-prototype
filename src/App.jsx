import { useMemo, useState } from "react";
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
const opener = "/assets/beatmondo-opener.mp4";

const tracks = [
  {
    id: 1,
    title: "Golden Hours",
    artist: "Lennox",
    genre: "Cinematic",
    mood: "Reflective",
    tempo: "72 BPM",
    era: "Modern",
    vocal: "Instrumental",
    usage: "Film / TV",
    availability: "Exclusive Available",
    duration: "2:34",
    key: "C# Major",
    tags: ["Warm", "Uplifting", "Reflective"],
    status: "New",
  },
  {
    id: 2,
    title: "Paper Planes",
    artist: "Arco North",
    genre: "Indie Rock",
    mood: "Driven",
    tempo: "118 BPM",
    era: "2000s",
    vocal: "Vocal",
    usage: "Advertising",
    availability: "Available Now",
    duration: "3:12",
    key: "A Minor",
    tags: ["Cinematic", "Hopeful", "Driven"],
    status: "Available",
  },
  {
    id: 3,
    title: "Midnight Transit",
    artist: "Soren",
    genre: "Ambient",
    mood: "Moody",
    tempo: "64 BPM",
    era: "Modern",
    vocal: "Instrumental",
    usage: "Documentary",
    availability: "Available Now",
    duration: "3:45",
    key: "D Minor",
    tags: ["Nocturne", "Introspective", "Ambient"],
    status: "Private",
  },
  {
    id: 4,
    title: "All That Remains",
    artist: "Vespera",
    genre: "Soul",
    mood: "Emotional",
    tempo: "86 BPM",
    era: "1970s",
    vocal: "Vocal",
    usage: "Trailer",
    availability: "Quote Required",
    duration: "2:58",
    key: "F Major",
    tags: ["Haunting", "Minimal", "Emotional"],
    status: "Quote",
  },
  {
    id: 5,
    title: "Chasing the Light",
    artist: "Hollow Skies",
    genre: "Acoustic",
    mood: "Inspiring",
    tempo: "96 BPM",
    era: "1990s",
    vocal: "Instrumental",
    usage: "Brand Film",
    availability: "Available Now",
    duration: "3:27",
    key: "G Major",
    tags: ["Epic", "Cinematic", "Inspiring"],
    status: "Published",
  },
  {
    id: 6,
    title: "Better Than Before",
    artist: "Milo Hart",
    genre: "Pop",
    mood: "Feel Good",
    tempo: "104 BPM",
    era: "Modern",
    vocal: "Vocal",
    usage: "Streaming",
    availability: "Available Now",
    duration: "2:46",
    key: "E Major",
    tags: ["Upbeat", "Pop", "Feel Good"],
    status: "Published",
  },
];

const inquiries = [
  { id: "BM-1048", company: "VisionTech", track: "Golden Hours", type: "Corporate Promo", budget: "$18k-$25k", deadline: "Jul 12", status: "Approved" },
  { id: "BM-1047", company: "National Geographic", track: "Into the Wild", type: "Documentary", budget: "$25k-$50k", deadline: "Jul 18", status: "Quote Needed" },
  { id: "BM-1046", company: "Peak Performance", track: "Rise Again", type: "Ad Campaign", budget: "$50k+", deadline: "Jun 30", status: "Quote Sent" },
  { id: "BM-1045", company: "Moonline Films", track: "Midnight Transit", type: "Film Trailer", budget: "$10k-$18k", deadline: "Jul 4", status: "In Review" },
];

const artists = [
  { name: "Lennox", credit: "Independent composer, film textures, modern piano", tracks: 18 },
  { name: "Arco North", credit: "Guitar-led indie catalog with sync-friendly hooks", tracks: 24 },
  { name: "Vespera", credit: "Soul archive with rare vocal performances", tracks: 11 },
];

const navItems = [
  ["home", "Home", House],
  ["catalog", "Catalog", MagnifyingGlass],
  ["track", "Track Detail", FileAudio],
  ["artist", "Artist Profile", MicrophoneStage],
  ["legacy", "Gary Burke Legacy", Archive],
  ["licensing", "Licensing Flow", ShieldCheck],
  ["buyer", "Buyer Dashboard", UserCircle],
  ["admin", "Admin", GearSix],
  ["content", "Blog / Podcast", Article],
  ["system", "Design System", Sliders],
];

function App() {
  const [view, setView] = useState("home");
  const [selectedTrack, setSelectedTrack] = useState(tracks[0]);
  const [playingId, setPlayingId] = useState(null);
  const [savedIds, setSavedIds] = useState([1, 5]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    genre: "All Genres",
    mood: "Any Mood",
    tempo: "Any Tempo",
    availability: "All Availability",
  });
  const [modalTrack, setModalTrack] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const text = `${track.title} ${track.artist} ${track.genre} ${track.mood} ${track.tags.join(" ")}`.toLowerCase();
      const matchesText = text.includes(query.toLowerCase());
      const matchesGenre = filters.genre === "All Genres" || track.genre === filters.genre;
      const matchesMood = filters.mood === "Any Mood" || track.mood === filters.mood;
      const matchesAvailability = filters.availability === "All Availability" || track.availability === filters.availability;
      return matchesText && matchesGenre && matchesMood && matchesAvailability;
    });
  }, [query, filters]);

  const saveTrack = (id) => {
    setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const openTrack = (track) => {
    setSelectedTrack(track);
    setView("track");
    setMobileNav(false);
  };

  const requestLicense = (track) => {
    setModalTrack(track);
    setRequestSent(false);
  };

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} mobileNav={mobileNav} setMobileNav={setMobileNav} />
      <main className="main-shell">
        <Topbar view={view} setView={setView} setMobileNav={setMobileNav} />
        {view === "home" && <Home setView={setView} requestLicense={() => requestLicense(selectedTrack)} setSelectedTrack={setSelectedTrack} />}
        {view === "catalog" && (
          <Catalog
            tracks={filteredTracks}
            query={query}
            setQuery={setQuery}
            filters={filters}
            setFilters={setFilters}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            playingId={playingId}
            setPlayingId={setPlayingId}
            savedIds={savedIds}
            saveTrack={saveTrack}
            openTrack={openTrack}
            requestLicense={requestLicense}
          />
        )}
        {view === "track" && <TrackDetail track={selectedTrack} setPlayingId={setPlayingId} playingId={playingId} saveTrack={saveTrack} saved={savedIds.includes(selectedTrack.id)} requestLicense={requestLicense} openTrack={openTrack} />}
        {view === "artist" && <ArtistProfile requestLicense={() => requestLicense(selectedTrack)} openTrack={openTrack} />}
        {view === "legacy" && <Legacy setView={setView} />}
        {view === "licensing" && <LicensingFlow selectedTrack={selectedTrack} requestSent={requestSent} setRequestSent={setRequestSent} />}
        {view === "buyer" && <BuyerDashboard savedIds={savedIds} setView={setView} requestLicense={requestLicense} />}
        {view === "admin" && <AdminDashboard />}
        {view === "content" && <ContentPages />}
        {view === "system" && <DesignSystem />}
      </main>
      {modalTrack && (
        <InquiryModal
          track={modalTrack}
          requestSent={requestSent}
          setRequestSent={setRequestSent}
          onClose={() => setModalTrack(null)}
        />
      )}
    </div>
  );
}

function Sidebar({ view, setView, mobileNav, setMobileNav }) {
  return (
    <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
      <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={20} /></button>
      <img className="brand-logo" src={logo} alt="Beatmondo" />
      <nav>
        {navItems.map(([id, label, Icon]) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            onClick={() => {
              setView(id);
              setMobileNav(false);
            }}
          >
            <Icon size={20} weight={view === id ? "fill" : "regular"} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="security-card">
        <ShieldCheck size={28} weight="fill" />
        <strong>All Systems Secure</strong>
        <span>Master files encrypted</span>
        <span>Role-based access active</span>
      </div>
    </aside>
  );
}

function Topbar({ view, setView, setMobileNav }) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileNav(true)}><FadersHorizontal size={20} /> Menu</button>
      <div>
        <span className="eyebrow">Beatmondo Prototype</span>
        <h1>{navItems.find(([id]) => id === view)?.[1]}</h1>
      </div>
      <div className="top-actions">
        <button onClick={() => setView("licensing")} className="ghost-button"><LockKey size={18} /> Request Access</button>
        <button className="icon-button" aria-label="Notifications"><Bell size={20} /></button>
        <button className="profile-pill"><span>AD</span> Alex Davenport</button>
      </div>
    </header>
  );
}

function Home({ setView, setSelectedTrack }) {
  return (
    <section className="home-view">
      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Musician-founded licensing</span>
          <h2>Discover authentic music from the musicians behind unforgettable sounds.</h2>
          <p>Beatmondo connects music supervisors, brands, producers, and media teams with curated, rights-aware music in a secure, artist-first environment.</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => setView("catalog")}><Play size={18} weight="fill" /> Explore Music</button>
            <button className="outline-button" onClick={() => setView("licensing")}><LockKey size={18} /> Request Licensing Access</button>
            <button className="plain-button" onClick={() => setView("legacy")}><Archive size={18} /> Learn the Story</button>
          </div>
        </div>
        <div className="hero-media">
          <img className="hero-logo-fallback" src={logo} alt="" aria-hidden="true" />
          <video src={opener} poster={logo} autoPlay muted loop playsInline />
          <div className="media-control"><Play size={18} weight="fill" /> 0:00 / 0:06 <span /></div>
        </div>
      </div>

      <div className="section-grid">
        <Panel title="What is Beatmondo?" action="Editorial, curated, secure">
          <p>Not a generic stock library. Beatmondo is a premium discovery and licensing platform built around original artists, clear rights context, and professional buyer workflows.</p>
        </Panel>
        <Panel title="Artist-first licensing" action="Human by design">
          <p>Every request keeps preview listening separate from licensed master delivery, with space for notes, budgets, usage terms, and relationship-led follow-up.</p>
        </Panel>
        <Panel title="Why it is different" action="Provenance matters">
          <p>Editorial stories, artist context, legacy archives, and verified rights cues make the catalog feel cared for instead of commoditized.</p>
        </Panel>
      </div>

      <section className="split-section">
        <div>
          <div className="section-heading">
            <span className="eyebrow">Featured music preview</span>
            <button onClick={() => setView("catalog")}>View all music</button>
          </div>
          <div className="track-list compact">
            {tracks.slice(0, 4).map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isPlaying={false}
                saved={false}
                onPlay={() => {}}
                onSave={() => {}}
                onOpen={() => {
                  setSelectedTrack(track);
                  setView("track");
                }}
                onRequest={() => setView("licensing")}
              />
            ))}
          </div>
        </div>
        <div className="trust-panel">
          <h3>Trusted by licensing professionals</h3>
          <TrustItem icon={ShieldCheck} title="Curated. Verified. Original." text="Every track is personally reviewed before buyer presentation." />
          <TrustItem icon={GlobeIcon} title="Clear rights. Global reach." text="Usage, territory, term, and rights notes are captured in one flow." />
          <TrustItem icon={UsersThree} title="Artist-first commitment" text="A platform built to preserve relationships and creative provenance." />
        </div>
      </section>

      <section className="content-preview">
        <MiniStory title="Gary Burke Legacy" text="A tasteful archive honoring the original vision, memories, and musician-led spirit behind Beatmondo." action={() => setView("legacy")} />
        <MiniStory title="Blog / News" text="Editorial updates, featured stories, licensing education, and artist-led announcements." action={() => setView("content")} />
        <MiniStory title="Podcast / Media" text="Conversations with artists, supervisors, and collaborators shaping the catalog." action={() => setView("content")} />
      </section>
    </section>
  );
}

function Catalog(props) {
  const { tracks, query, setQuery, filters, setFilters, selectedTrack, setSelectedTrack, playingId, setPlayingId, savedIds, saveTrack, openTrack, requestLicense } = props;
  return (
    <section className="catalog-layout">
      <div className="catalog-main">
        <div className="catalog-header">
          <div>
            <h2>Curated for Your Next Story</h2>
            <p>Premium music. Clear rights. Creative control.</p>
          </div>
          <button className="outline-button"><Sparkle size={18} /> Need Something Specific?</button>
        </div>
        <div className="search-row">
          <label className="search-box">
            <MagnifyingGlass size={20} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by track, mood, artist, instrument, or keyword..." />
          </label>
          <button className="outline-button"><BookmarkSimple size={18} /> Save Search</button>
        </div>
        <div className="filters">
          <Select label="Genre" value={filters.genre} options={["All Genres", "Cinematic", "Indie Rock", "Ambient", "Soul", "Acoustic", "Pop"]} onChange={(genre) => setFilters({ ...filters, genre })} />
          <Select label="Mood" value={filters.mood} options={["Any Mood", "Reflective", "Driven", "Moody", "Emotional", "Inspiring", "Feel Good"]} onChange={(mood) => setFilters({ ...filters, mood })} />
          <Select label="Tempo" value={filters.tempo} options={["Any Tempo", "Slow", "Midtempo", "Upbeat"]} onChange={(tempo) => setFilters({ ...filters, tempo })} />
          <Select label="Availability" value={filters.availability} options={["All Availability", "Available Now", "Exclusive Available", "Quote Required"]} onChange={(availability) => setFilters({ ...filters, availability })} />
          <button className="plain-button" onClick={() => setFilters({ genre: "All Genres", mood: "Any Mood", tempo: "Any Tempo", availability: "All Availability" })}>Clear all</button>
        </div>
        <div className="results-meta">{tracks.length} tracks found <span>Sort by: recently curated</span></div>
        <div className="track-list">
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isSelected={selectedTrack.id === track.id}
              isPlaying={playingId === track.id}
              saved={savedIds.includes(track.id)}
              onPlay={() => setPlayingId(playingId === track.id ? null : track.id)}
              onSave={() => saveTrack(track.id)}
              onOpen={() => openTrack(track)}
              onRequest={() => requestLicense(track)}
              onSelect={() => setSelectedTrack(track)}
            />
          ))}
        </div>
      </div>
      <TrackSidePanel track={selectedTrack} requestLicense={requestLicense} />
    </section>
  );
}

function TrackRow({ track, isSelected, isPlaying, saved, onPlay, onSave, onOpen, onRequest, onSelect }) {
  return (
    <article className={`track-row ${isSelected ? "selected" : ""}`} onClick={onSelect}>
      <button className="play-button" onClick={(event) => { event.stopPropagation(); onPlay(); }} aria-label={isPlaying ? "Pause preview" : "Play preview"}>
        {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
      </button>
      <div className="cover-art"><MusicNote size={28} weight="fill" /></div>
      <div className="track-title">
        <strong>{track.title} <span>{track.status}</span></strong>
        <small>{track.artist} · {track.genre}</small>
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

function TrackSidePanel({ track, requestLicense }) {
  return (
    <aside className="detail-rail">
      <div className="preview-card">
        <span>Preview only</span>
        <button><Pause size={34} weight="fill" /></button>
      </div>
      <h2>{track.title}</h2>
      <p>{track.artist} · {track.genre}</p>
      <div className="tag-row">{track.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="meta-grid">
        <span><Clock size={16} /> {track.duration}</span>
        <span><MusicNote size={16} /> {track.tempo}</span>
        <span>{track.key}</span>
      </div>
      <div className="rights-list">
        <h3>Rights & licensing</h3>
        <p>100% copyright cleared</p>
        <p>Worldwide · all media</p>
        <p>Standard license · see details</p>
        <p>Stems available upon license</p>
      </div>
      <button className="gold-button full" onClick={() => requestLicense(track)}><ShieldCheck size={18} /> Request License</button>
      <div className="locked-box"><LockKey size={28} /> Master file locked <small>Secure delivery after approval.</small></div>
    </aside>
  );
}

function TrackDetail({ track, playingId, setPlayingId, saved, saveTrack, requestLicense, openTrack }) {
  return (
    <section className="detail-page">
      <div className="detail-hero">
        <div>
          <span className="eyebrow">Track detail</span>
          <h2>{track.title}</h2>
          <p>{track.artist} · {track.genre} · {track.era}</p>
          <div className="button-row">
            <button className="gold-button" onClick={() => setPlayingId(playingId === track.id ? null : track.id)}>{playingId === track.id ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />} Preview Track</button>
            <button className="outline-button" onClick={() => saveTrack(track.id)}><Heart size={18} weight={saved ? "fill" : "regular"} /> {saved ? "Saved" : "Save Track"}</button>
            <button className="outline-button" onClick={() => requestLicense(track)}><LockKey size={18} /> Request WAV / License</button>
          </div>
        </div>
        <div className="large-player">
          <div className="waveform big" />
          <span>Preview quality audio only. Master/WAV delivery requires approved license.</span>
        </div>
      </div>
      <div className="detail-grid">
        <Panel title="Metadata" action="Catalog ready">
          <dl className="definition-grid">
            <dt>Genre</dt><dd>{track.genre}</dd>
            <dt>Mood</dt><dd>{track.mood}</dd>
            <dt>Tempo</dt><dd>{track.tempo}</dd>
            <dt>Instrumentation</dt><dd>Piano, guitar, analog textures, live rhythm section</dd>
            <dt>Era</dt><dd>{track.era}</dd>
            <dt>Vocal status</dt><dd>{track.vocal}</dd>
          </dl>
        </Panel>
        <Panel title="Rights Notes" action="Private workflow">
          <p>Preview stream is public to approved buyers. Master files, stems, and delivery links remain private until license terms are approved and logged.</p>
          <div className="locked-box"><LockKey size={24} /> Protected master file</div>
        </Panel>
      </div>
      <section>
        <h3>Similar tracks</h3>
        <div className="track-list compact">
          {tracks.filter((item) => item.id !== track.id).slice(0, 3).map((item) => (
            <TrackRow key={item.id} track={item} onPlay={() => {}} onSave={() => {}} onOpen={() => openTrack(item)} onRequest={() => requestLicense(item)} />
          ))}
        </div>
      </section>
    </section>
  );
}

function ArtistProfile({ requestLicense, openTrack }) {
  return (
    <section className="artist-page">
      <div className="artist-hero">
        <div className="portrait"><MicrophoneStage size={64} weight="fill" /></div>
        <div>
          <span className="eyebrow">Artist profile</span>
          <h2>Lennox</h2>
          <p>A musician-founded composer project blending warm piano, cinematic restraint, and live-band provenance for film, television, and brand storytelling.</p>
          <div className="button-row">
            <button className="gold-button" onClick={requestLicense}><ShieldCheck size={18} /> Licensing Inquiry</button>
            <button className="outline-button"><Article size={18} /> Editorial Story</button>
          </div>
        </div>
      </div>
      <div className="section-grid">
        <Panel title="Credits / Notable Work" action="Verified">
          <p>Independent film campaigns, documentary title beds, premium hospitality reels, and limited-run artist collaborations.</p>
        </Panel>
        <Panel title="Legacy Context" action="Human notes">
          <p>Catalog notes preserve recording context, collaborators, and rights conversations so discovery feels credible and respectful.</p>
        </Panel>
      </div>
      <h3>Related tracks</h3>
      <div className="track-list compact">
        {tracks.slice(0, 3).map((track) => <TrackRow key={track.id} track={track} onPlay={() => {}} onSave={() => {}} onOpen={() => openTrack(track)} onRequest={requestLicense} />)}
      </div>
    </section>
  );
}

function Legacy({ setView }) {
  return (
    <section className="legacy-page">
      <div className="legacy-hero">
        <span className="eyebrow">Gary Burke legacy</span>
        <h2>Preserving the original vision.</h2>
        <p>A respectful archive for memories, milestones, media, and the musician-led spirit behind Beatmondo.</p>
        <button className="gold-button" onClick={() => setView("catalog")}><MusicNote size={18} /> Discover the Catalog</button>
      </div>
      <div className="timeline">
        {["The founding idea", "Studio stories", "Catalog stewardship", "Artist-first future"].map((item, index) => (
          <article key={item}>
            <span>0{index + 1}</span>
            <h3>{item}</h3>
            <p>Memory blocks combine written stories, image/video placeholders, editorial context, and links back into the music discovery experience.</p>
          </article>
        ))}
      </div>
      <div className="archive-grid">
        <Panel title="Archive-style layout" action="Images / video">
          <p>Designed for respectful browsing, not commercialization. Media cards can hold interviews, studio photos, handwritten notes, and partner memories.</p>
        </Panel>
        <Panel title="Back to Beatmondo story" action="Continuity">
          <p>The legacy section connects emotional provenance to modern licensing trust without making the tribute feel like a sales funnel.</p>
        </Panel>
      </div>
    </section>
  );
}

function LicensingFlow({ selectedTrack, requestSent, setRequestSent }) {
  if (requestSent) return <ConfirmationScreen track={selectedTrack} />;
  return (
    <section className="form-page">
      <div className="form-intro">
        <span className="eyebrow">Licensing inquiry</span>
        <h2>Tell us how the music will be used.</h2>
        <p>Beatmondo captures the details a rights team needs to respond professionally: usage, territory, term, budget, deadline, and track context.</p>
      </div>
      <InquiryForm track={selectedTrack} onSubmit={() => setRequestSent(true)} />
    </section>
  );
}

function InquiryModal({ track, requestSent, setRequestSent, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <button className="close-button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        {requestSent ? <ConfirmationScreen track={track} compact /> : <><h2>Request license for {track.title}</h2><InquiryForm track={track} onSubmit={() => setRequestSent(true)} compact /></>}
      </div>
    </div>
  );
}

function InquiryForm({ track, onSubmit, compact }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", type: "Film / TV", territory: "Worldwide", term: "1 year", budget: "$10k-$18k", deadline: "", message: "" });
  const update = (field, value) => setForm({ ...form, [field]: value });
  return (
    <form className={`inquiry-form ${compact ? "compact-form" : ""}`} onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      {["name", "email", "company"].map((field) => (
        <label key={field}>{field}<input required value={form[field]} onChange={(event) => update(field, event.target.value)} placeholder={field === "email" ? "name@company.com" : "Jane Mitchell"} /></label>
      ))}
      <label>Project type<select value={form.type} onChange={(event) => update("type", event.target.value)}><option>Film / TV</option><option>Advertising</option><option>Brand Film</option><option>Podcast / Media</option></select></label>
      <label>Track of interest<input value={track.title} readOnly /></label>
      <label>Intended usage<textarea required value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Describe the scene, campaign, or media placement." /></label>
      <label>Territory<select value={form.territory} onChange={(event) => update("territory", event.target.value)}><option>Worldwide</option><option>North America</option><option>United States</option><option>Europe</option></select></label>
      <label>Term<select value={form.term} onChange={(event) => update("term", event.target.value)}><option>1 year</option><option>2 years</option><option>Perpetual</option><option>Festival only</option></select></label>
      <label>Budget range<select value={form.budget} onChange={(event) => update("budget", event.target.value)}><option>$5k-$10k</option><option>$10k-$18k</option><option>$18k-$25k</option><option>$25k-$50k</option><option>$50k+</option></select></label>
      <label>Deadline<input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label>
      <button className="gold-button form-submit" type="submit"><ShieldCheck size={18} /> Submit Inquiry</button>
    </form>
  );
}

function ConfirmationScreen({ track, compact }) {
  return (
    <section className={`confirmation ${compact ? "compact-confirmation" : ""}`}>
      <CheckCircle size={52} weight="fill" />
      <h2>Inquiry received</h2>
      <p>Your request for <strong>{track.title}</strong> is now marked New. Beatmondo will review rights, usage, budget, deadline, and delivery requirements before quote follow-up.</p>
      <div className="status-strip"><span>New</span><span>In Review</span><span>Quote Needed</span><span>Quote Sent</span></div>
    </section>
  );
}

function BuyerDashboard({ savedIds, setView, requestLicense }) {
  const saved = tracks.filter((track) => savedIds.includes(track.id));
  return (
    <section className="dashboard-page">
      <div className="metric-grid">
        <Metric icon={Heart} label="Saved Tracks" value={saved.length} note="Ready for review" />
        <Metric icon={FileAudio} label="Active Requests" value="4" note="2 need response" />
        <Metric icon={DownloadSimple} label="Approved Licenses" value="2" note="Secure delivery" />
        <Metric icon={Clock} label="Recent Activity" value="12" note="Last 7 days" />
      </div>
      <div className="dashboard-grid">
        <Panel title="Saved tracks" action="Buyer workspace">
          <div className="track-list compact">
            {saved.map((track) => <TrackRow key={track.id} track={track} onPlay={() => {}} onSave={() => {}} onOpen={() => setView("track")} onRequest={() => requestLicense(track)} />)}
          </div>
        </Panel>
        <Panel title="Submitted licensing requests" action="Status tracking">
          <div className="request-list">{inquiries.map((item) => <RequestRow key={item.id} item={item} />)}</div>
        </Panel>
        <Panel title="Approved downloads" action="Secure delivery">
          <div className="delivery-card"><LockKey size={30} /><strong>Beyond the Horizon</strong><span>Expires Jul 30 · 3 downloads remaining</span><button className="gold-button"><DownloadSimple size={18} /> Secure WAV Download</button></div>
        </Panel>
        <Panel title="Account settings" action="Profile">
          <p>Company profile, buyer role, invoice contacts, notification preferences, and two-step security settings.</p>
        </Panel>
      </div>
    </section>
  );
}

function AdminDashboard() {
  const [adminTab, setAdminTab] = useState("Overview");
  const tabs = ["Overview", "Tracks", "Artists", "Inquiries", "Media", "Analytics", "Audit Logs"];
  return (
    <section className="admin-page">
      <div className="admin-tabs">{tabs.map((tab) => <button key={tab} className={adminTab === tab ? "active" : ""} onClick={() => setAdminTab(tab)}>{tab}</button>)}</div>
      <div className="metric-grid admin">
        <Metric icon={MusicNote} label="Total Tracks" value="12,842" note="+128 this week" />
        <Metric icon={Eye} label="Published Tracks" value="9,876" note="76.8% of total" />
        <Metric icon={LockKey} label="Private Tracks" value="2,966" note="Protected masters" />
        <Metric icon={UsersThree} label="Total Artists" value="1,245" note="+18 this week" />
        <Metric icon={ShieldCheck} label="New Inquiries" value="37" note="+12 this week" />
        <Metric icon={DownloadSimple} label="Approved Licenses" value="216" note="+24 this week" />
      </div>
      <div className="admin-grid">
        <section className="pipeline-panel">
          <h3>Licensing inquiry pipeline</h3>
          <div className="pipeline">{["New", "In Review", "Quote Needed", "Quote Sent", "Approved", "Paid", "Delivered"].map((status, index) => <button key={status}><span>{status}</span><strong>{[37, 21, 14, 9, 11, 7, 5][index]}</strong></button>)}</div>
        </section>
        <Panel title={`${adminTab} management`} action="Operational view">
          {adminTab === "Artists" ? <ArtistAdmin /> : adminTab === "Inquiries" ? <InquiryAdmin /> : adminTab === "Media" ? <MediaAdmin /> : adminTab === "Audit Logs" ? <AuditAdmin /> : <TrackAdmin />}
        </Panel>
        <Panel title="Activity feed" action="Audit ready">
          <div className="activity-list">
            {["License delivered to VisionTech", "New inquiry from National Geographic", "Quote approved for Peak Performance", "Track uploaded: Midnight Conversations", "Permissions updated"].map((text, index) => <p key={text}><CheckCircle size={18} /> {text} <span>{index * 8 + 2}m ago</span></p>)}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function TrackAdmin() {
  return (
    <div className="admin-table">
      <div className="table-toolbar"><input placeholder="Search tracks, artists, ISRC..." /><button><CloudArrowUp size={18} /> Add Track</button></div>
      <table>
        <thead><tr><th>Track</th><th>Artist</th><th>Genre</th><th>Status</th><th>Preview Audio</th><th>Master/WAV</th><th>Added</th></tr></thead>
        <tbody>{tracks.slice(0, 5).map((track) => <tr key={track.id}><td>{track.title}<small> ISRC US-BMO-25-000{track.id}</small></td><td>{track.artist}</td><td>{track.genre}</td><td><span className={`badge ${track.status.toLowerCase()}`}>{track.status}</span></td><td><button className="mini-play"><Play size={14} weight="fill" /></button> {track.duration}</td><td><LockKey size={16} /> Protected</td><td>May {20 - track.id}, 2026</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function ArtistAdmin() {
  return <div className="cards-admin">{artists.map((artist) => <article key={artist.name}><div className="portrait small"><MicrophoneStage size={28} /></div><h3>{artist.name}</h3><p>{artist.credit}</p><span>{artist.tracks} related tracks</span><button>Manage artist</button></article>)}</div>;
}

function InquiryAdmin() {
  return <div className="request-list">{inquiries.map((item) => <RequestRow key={item.id} item={item} detailed />)}</div>;
}

function MediaAdmin() {
  return <div className="cards-admin"><article><Article size={28} /><h3>Blog editor</h3><p>Featured story, categories, tags, draft status, and publish controls.</p><button>Edit news</button></article><article><FilmSlate size={28} /><h3>Podcast media</h3><p>Episode detail, embedded audio/video, show notes, and guest references.</p><button>Manage episodes</button></article></div>;
}

function AuditAdmin() {
  return <div className="activity-list">{["Role changed: Content Manager", "Master download approved", "Track rights notes edited", "Buyer access revoked", "Quote status changed"].map((item) => <p key={item}><ShieldCheck size={18} /> {item}<span>Immutable log</span></p>)}</div>;
}

function ContentPages() {
  return (
    <section className="content-page">
      <div className="content-grid">
        <article className="feature-story"><span className="eyebrow">Featured story</span><h2>The musicians behind unforgettable sounds</h2><p>Editorial storytelling gives buyers a richer understanding of provenance, collaborators, recording context, and why the work matters.</p><button className="gold-button"><Article size={18} /> Read Story</button></article>
        <Panel title="Blog listing" action="News">
          {["Licensing authentic music for documentaries", "How Beatmondo protects master files", "Artist-first discovery for brand teams"].map((title) => <p key={title}>{title}<span className="category"> Licensing</span></p>)}
        </Panel>
        <Panel title="Podcast / media" action="Episodes">
          {["Episode 08: Archive stewardship", "Episode 07: Music supervision notes", "Episode 06: Artist stories"].map((title) => <p key={title}><MicrophoneStage size={16} /> {title}</p>)}
        </Panel>
        <Panel title="Admin editor placeholders" action="CMS ready">
          <p>Blog and media editors include draft states, tags, featured images, embedded audio/video, show notes, and related artist references.</p>
        </Panel>
      </div>
    </section>
  );
}

function DesignSystem() {
  return (
    <section className="system-page">
      <div className="system-brand"><img src={logo} alt="Beatmondo logo usage" /><p>Use logo for header, authentication, dashboard sidebar, hero opener, and key brand moments. Avoid repeating it in every card.</p></div>
      <div className="swatches">{["#050505", "#11110f", "#d6a72c", "#f5d36b", "#f7efe0", "#8f887a"].map((color) => <span key={color} style={{ "--swatch": color }}>{color}</span>)}</div>
      <div className="section-grid">
        <Panel title="Buttons & forms" action="Controls"><div className="button-row"><button className="gold-button">Primary</button><button className="outline-button">Secondary</button><button className="plain-button">Text action</button></div><input placeholder="Form input" /></Panel>
        <Panel title="Audio player" action="Components"><div className="large-player small-player"><div className="waveform big" /><span>Preview-only playback state</span></div></Panel>
        <Panel title="Status badges" action="Licensing"><div className="tag-row"><span>New</span><span>In Review</span><span>Approved</span><span>Delivered</span></div></Panel>
        <Panel title="Empty / loading / error" action="States"><p>Empty catalogs guide buyers to saved searches. Loading states use restrained logo reveal motion. Errors remain calm, clear, and secure.</p></Panel>
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="select-label">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <CaretDown size={14} />
    </label>
  );
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

function MiniStory({ title, text, action }) {
  return <article className="mini-story"><h3>{title}</h3><p>{text}</p><button onClick={action}>Open</button></article>;
}

function RequestRow({ item, detailed }) {
  return <article className="request-row"><div><strong>{item.company}</strong><span>{item.track} · {item.type}</span>{detailed && <small>{item.id} · {item.budget} · Deadline {item.deadline}</small>}</div><span className="badge">{item.status}</span></article>;
}

function GlobeIcon(props) {
  return <ShieldCheck {...props} />;
}

export { App };
