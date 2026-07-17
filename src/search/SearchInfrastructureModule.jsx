import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookmarkSimple,
  CaretDown,
  Check,
  Clock,
  Copy,
  Eye,
  FadersHorizontal,
  GearSix,
  ListBullets,
  MagnifyingGlass,
  Pause,
  Play,
  Plus,
  Rows,
  Sliders,
  Sparkle,
  SquaresFour,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import { DEFAULT_SEARCH_FILTERS } from "./searchData.js";
import { searchService } from "./searchService.js";

export const SEARCH_VIEWS = new Set([
  "search",
  "search-results",
  "search-saved",
  "search-recent",
  "search-collections",
  "admin-search",
  "admin-search-index",
]);

const clone = (value) => JSON.parse(JSON.stringify(value));
const facetLabels = {
  genre: "Genre",
  mood: "Mood",
  usage: "Usage",
  tempo: "Tempo",
  vocalType: "Vocal",
  language: "Language",
  accessTier: "Access tier",
  territory: "Territory",
  rightsStatus: "Rights status",
  licensingEligibility: "Licensing",
  indexStatus: "Index status",
};

function statusClass(value = "") {
  return `search-status status-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function SearchStatus({ children }) {
  return <span className={statusClass(children)}><span />{children}</span>;
}

function FilterGroup({ label, values, selected = [], onToggle, hideEmpty = true, limit = 8 }) {
  const entries = values.filter(
    ([value, count]) => !hideEmpty || count > 0 || selected.includes(value),
  );
  if (!entries.length) return null;
  return (
    <fieldset className="search-filter-group">
      <legend>{label}</legend>
      {entries.slice(0, limit).map(([value, count]) => (
        <label key={value}>
          <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} />
          <span>{value}</span><small>{count}</small>
        </label>
      ))}
    </fieldset>
  );
}

const ESSENTIAL_FACET_KEYS = ["genre", "mood", "usage", "vocalType", "accessTier", "licensingEligibility"];
const ADVANCED_FACET_KEYS = ["tempo", "language", "territory"];
const INTERNAL_FACET_KEYS = ["rightsStatus", "indexStatus"];
const ESSENTIAL_TOGGLES = ["stemsAvailable", "masterAvailable", "recentlyAdded", "featured", "savedOnly"];
const ADVANCED_TOGGLES = ["instrumentalAvailable", "cleanVersionAvailable", "preApprovedTerms", "approvalRequired"];
const TOGGLE_LABELS = {
  stemsAvailable: "Stems available",
  masterAvailable: "Master available",
  instrumentalAvailable: "Instrumental available",
  cleanVersionAvailable: "Clean version",
  preApprovedTerms: "Pre-approved terms",
  recentlyAdded: "Recently added",
  featured: "Featured",
  approvalRequired: "Approval required",
  savedOnly: "Saved tracks",
};

function SearchFilters({ filters, setFilters, facets, internal, onClose, showAdvanced, setShowAdvanced }) {
  const toggle = (key, value) => setFilters((current) => ({
    ...current,
    [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
  }));
  const facetEntries = (key) =>
    Object.entries(facets[key] || {}).sort((a, b) => b[1] - a[1]);
  const essentialKeys = [...ESSENTIAL_FACET_KEYS];
  const advancedKeys = [
    ...ADVANCED_FACET_KEYS,
    ...(internal ? INTERNAL_FACET_KEYS : []),
  ];
  return (
    <aside className="search-filter-sidebar" aria-label="Search filters">
      <div className="search-filter-heading">
        <div>
          <span>Refine</span>
          <strong>Music filters</strong>
        </div>
        {onClose && (
          <button aria-label="Close filters" onClick={onClose}>
            <X />
          </button>
        )}
      </div>
      <div className="search-range-grid">
        <label>
          BPM minimum
          <input
            aria-label="BPM minimum"
            type="number"
            min="0"
            max="240"
            value={filters.bpmMin}
            onChange={(e) => setFilters({ ...filters, bpmMin: e.target.value })}
          />
        </label>
        <label>
          BPM maximum
          <input
            aria-label="BPM maximum"
            type="number"
            min="0"
            max="240"
            value={filters.bpmMax}
            onChange={(e) => setFilters({ ...filters, bpmMax: e.target.value })}
          />
        </label>
      </div>
      <label className="search-select-label">
        Duration
        <select
          value={filters.duration}
          onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
        >
          <option>Any</option>
          <option>Under 30 seconds</option>
          <option>30–60 seconds</option>
          <option>1–2 minutes</option>
          <option>2–3 minutes</option>
          <option>3–5 minutes</option>
          <option>Over 5 minutes</option>
        </select>
      </label>
      <div className="search-availability-filter">
        {ESSENTIAL_TOGGLES.map((key) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={filters[key]}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.checked })}
            />
            <span>{TOGGLE_LABELS[key]}</span>
          </label>
        ))}
      </div>
      {essentialKeys.map((key) => (
        <FilterGroup
          key={key}
          label={facetLabels[key]}
          values={facetEntries(key)}
          selected={filters[key]}
          onToggle={(value) => toggle(key, value)}
        />
      ))}
      <button
        type="button"
        className="search-more-filters"
        aria-expanded={showAdvanced}
        onClick={() => setShowAdvanced((open) => !open)}
      >
        <FadersHorizontal />
        {showAdvanced ? "Hide advanced filters" : "More filters"}
        <CaretDown className={showAdvanced ? "is-open" : ""} />
      </button>
      {showAdvanced && (
        <div className="search-advanced-filters">
          <label className="search-select-label">
            Explicit content
            <select
              value={filters.explicit}
              onChange={(e) =>
                setFilters({ ...filters, explicit: e.target.value })
              }
            >
              <option>Any</option>
              <option>Clean only</option>
              <option>Explicit only</option>
            </select>
          </label>
          <div className="search-availability-filter">
            {ADVANCED_TOGGLES.map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={(e) =>
                    setFilters({ ...filters, [key]: e.target.checked })
                  }
                />
                <span>{TOGGLE_LABELS[key]}</span>
              </label>
            ))}
          </div>
          {advancedKeys.map((key) => (
            <FilterGroup
              key={key}
              label={facetLabels[key]}
              values={facetEntries(key)}
              selected={filters[key]}
              onToggle={(value) => toggle(key, value)}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        className="search-clear-filters"
        onClick={() => setFilters(clone(DEFAULT_SEARCH_FILTERS))}
      >
        Clear all filters
      </button>
    </aside>
  );
}

function SearchInput({ query, setQuery, suggestions, onSubmit, onSelectSuggestion }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  useEffect(() => {
    if (window.sessionStorage.getItem("beatmondo-focus-global-search")) {
      window.sessionStorage.removeItem("beatmondo-focus-global-search");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
    const shortcut = (event) => {
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) { event.preventDefault(); inputRef.current?.focus(); setOpen(true); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const onKeyDown = (event) => {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setOpen(true); setActive((value) => Math.min(value + 1, suggestions.length - 1)); }
    else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    else if (event.key === "Escape") { setOpen(false); setActive(-1); }
    else if (event.key === "Enter") { event.preventDefault(); if (open && active >= 0) onSelectSuggestion(suggestions[active]); else onSubmit(); setOpen(false); }
  };
  return (
    <div className="search-combobox">
      <label className="search-primary-input">
        <span className="sr-only">Search music, artists, moods, usage, and metadata</span><MagnifyingGlass />
        <input ref={inputRef} role="combobox" aria-expanded={open && suggestions.length > 0} aria-controls="search-suggestions" aria-activedescendant={active >= 0 ? `suggestion-${active}` : undefined} value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} placeholder="Try ‘uplifting indie track for a car commercial’" />
        {query && <button aria-label="Clear search" onClick={() => setQuery("")}><X /></button>}
      </label>
      <button className="search-submit" onClick={() => { onSubmit(); setOpen(false); }}>Search</button>
      {open && suggestions.length > 0 && (
        <div className="search-suggestions" id="search-suggestions" role="listbox">
          {suggestions.map((suggestion, index) => (
            <button id={`suggestion-${index}`} role="option" aria-selected={active === index} className={active === index ? "active" : ""} key={`${suggestion.type}-${suggestion.label}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelectSuggestion(suggestion); setOpen(false); }}>
              <small>{suggestion.type}</small><strong>{suggestion.label}</strong>{suggestion.subtitle && <span>{suggestion.subtitle}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackSearchCard({
  document,
  layout,
  isPlaying,
  saved,
  compared,
  mode = "buyer",
  onPlay,
  onSave,
  onOpen,
  onRequest,
  onCompare,
  onProject,
  onAdminAction,
}) {
  const track = document.source;
  const blocked = ["Blocked", "Not Licensable", "Not Yet Eligible"].includes(
    document.rightsEligibility,
  );
  const isInternal = mode === "internal";
  const isArtist = mode === "artist";
  return (
    <article className={`search-track-result layout-${layout} mode-${mode}`}>
      <button
        className="search-result-art"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.56)),url(${track.image})`,
        }}
        onClick={onOpen}
        aria-label={`Open ${track.title} details`}
      >
        <span>{document.featured ? "Editorial pick" : document.accessLevel}</span>
      </button>
      <div className="search-result-main">
        <div>
          <small>
            {track.genre} · {track.mood}
          </small>
          <h3>
            <button onClick={onOpen}>{track.title}</button>
          </h3>
          <button className="search-artist-link" onClick={onOpen}>
            {track.artist}
          </button>
        </div>
        <div className="search-result-tags">
          <span>{track.duration}</span>
          <span>{track.bpm}</span>
          {document.filterFields.vocalType[0] && (
            <span>{document.filterFields.vocalType[0]}</span>
          )}
          {document.stemsAvailable && <span>Stems</span>}
        </div>
      </div>
      <div className="search-result-rights">
        <SearchStatus>{document.rightsEligibility}</SearchStatus>
        <small>{document.accessLevel} access</small>
      </div>
      <div className="search-result-actions">
        <button
          aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title} preview`}
          onClick={onPlay}
          disabled={!document.previewAvailable}
          title={
            document.previewAvailable
              ? document.previewLabel
              : "Preview unavailable"
          }
        >
          {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
        </button>
        {!isInternal && (
          <button
            aria-label={`${saved ? "Remove" : "Save"} ${track.title}`}
            className={saved ? "active" : ""}
            onClick={onSave}
          >
            <BookmarkSimple weight={saved ? "fill" : "regular"} />
          </button>
        )}
        {!isInternal && !isArtist && (
          <button
            aria-label={`${compared ? "Remove" : "Add"} ${track.title} ${compared ? "from" : "to"} comparison`}
            className={compared ? "active" : ""}
            onClick={onCompare}
          >
            <Rows />
          </button>
        )}
        {isInternal ? (
          <>
            <button className="search-license-action" onClick={onOpen}>
              Open track
            </button>
            <button
              type="button"
              onClick={() => onAdminAction?.(track, "rights")}
            >
              <Eye /> Rights
            </button>
          </>
        ) : isArtist ? (
          <button className="search-license-action" onClick={onOpen}>
            View track
          </button>
        ) : (
          <>
            <button type="button" onClick={onProject}>
              <Plus /> Project
            </button>
            <button
              className="search-license-action"
              disabled={blocked}
              onClick={onRequest}
            >
              Request License
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function AppliedChips({ query, filters, parsed, setFilters, setQuery }) {
  const chips = [];
  if (query) chips.push({ key: "query", label: query, clear: () => setQuery("") });
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => chips.push({ key: `${key}-${item}`, label: item, clear: () => setFilters((current) => ({ ...current, [key]: current[key].filter((entry) => entry !== item) })) }));
    else if (value && value !== "Any") chips.push({ key, label: typeof value === "boolean" ? key.replace(/([A-Z])/g, " $1") : value, clear: () => setFilters((current) => ({ ...current, [key]: typeof value === "boolean" ? false : key.startsWith("bpm") ? "" : "Any" })) });
  });
  return (
    <div className="search-chips" aria-label="Applied search terms and filters">
      {parsed.length > 0 && <span className="interpretation-label">Interpreted as</span>}
      {chips.map((chip) => <button key={chip.key} onClick={chip.clear}>{chip.label}<X /></button>)}
    </div>
  );
}

function ComparisonTray({ documents, onRemove, onClose, onPlay, onRequest, mode = "buyer" }) {
  if (!documents.length) return null;
  const buyerMode = mode === "buyer";
  return (
    <aside className="search-comparison" aria-label="Track comparison">
      <div className="search-comparison-header"><div><small>Compare tracks</small><strong>{documents.length} of 3 selected</strong></div><button aria-label="Close comparison" onClick={onClose}><X /></button></div>
      <div className="search-comparison-grid">
        {documents.map((doc) => <article key={doc.id}><button className="remove" onClick={() => onRemove(doc.entityId)} aria-label={`Remove ${doc.title}`}><X /></button><h3>{doc.title}</h3><p>{doc.subtitle}</p><dl><dt>Genre</dt><dd>{doc.source.genre}</dd><dt>Mood</dt><dd>{doc.source.mood}</dd><dt>BPM</dt><dd>{doc.source.bpm}</dd><dt>Duration</dt><dd>{doc.source.duration}</dd><dt>Vocal</dt><dd>{doc.filterFields.vocalType[0]}</dd><dt>Rights</dt><dd>{doc.rightsEligibility}</dd><dt>Territory</dt><dd>{doc.filterFields.territory.join(", ")}</dd><dt>Stems</dt><dd>{doc.stemsAvailable ? "Available" : "Not available"}</dd></dl><div><button onClick={() => onPlay(doc.entityId)}><Play /> Preview</button>{buyerMode ? <button disabled={["Blocked", "Not Licensable", "Not Yet Eligible"].includes(doc.rightsEligibility)} onClick={() => onRequest(doc.source)}>Request License</button> : <button onClick={() => onRequest(doc.source)}>Open track</button>}</div></article>)}
      </div>
    </aside>
  );
}

function SearchLibraryNav({ active, navigate, user }) {
  const canSearchAdmin =
    user?.permissions?.includes("*") ||
    user?.permissions?.includes("search.index.manage");
  const goMusic = () => navigate("catalog");
  const items = [
    ["music", "Music", goMusic],
    ["collections", "Collections", () => navigate("search-collections")],
    ["saved", "Saved searches", () => navigate("search-saved")],
    ["recent", "Recent", () => navigate("search-recent")],
  ];
  if (canSearchAdmin) {
    items.push(["admin", "Search admin", () => navigate("admin-search")]);
  }
  return (
    <div className="search-library-nav-wrap">
      {active !== "music" && (
        <button
          type="button"
          className="search-back-to-music"
          onClick={goMusic}
        >
          <ArrowRight className="search-back-arrow" aria-hidden="true" />
          Back to Explore Music
        </button>
      )}
      <nav className="search-subnav" aria-label="Search library">
        {items.map(([id, label, onClick]) => (
          <button
            key={id}
            type="button"
            className={active === id ? "active" : ""}
            aria-current={active === id ? "page" : undefined}
            onClick={onClick}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function SearchCollections({ tracks, user, onRun, showToast, navigate }) {
  const collections = searchService.getCollections(tracks, user);
  return (
    <section className="search-library-page">
      <SearchLibraryNav active="collections" navigate={navigate} user={user} />
      <header>
        <span>Curated music discovery</span>
        <h2>Collections</h2>
        <p>
          Editorial, rights-ready, and buyer-specific selections filtered
          through your current access.
        </p>
      </header>
      <div className="search-collection-grid">
        {collections.map((collection) => (
          <article key={collection.id}>
            <span>{collection.accessTier}</span>
            <h3>{collection.title}</h3>
            <p>{collection.description}</p>
            <small>
              {collection.trackCount} accessible tracks · {collection.curator}
            </small>
            <div>
              <button
                onClick={() =>
                  onRun(
                    { filters: { collection: collection.id }, query: "" },
                    collection.trackIds,
                  )
                }
              >
                Open collection
              </button>
              <button onClick={() => showToast(`${collection.title} saved.`)}>
                <BookmarkSimple /> Save
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SavedSearches({ tracks, user, onRun, showToast, navigate }) {
  const [version, setVersion] = useState(0);
  const searches = searchService.getSavedSearches(user);
  return (
    <section className="search-library-page">
      <SearchLibraryNav active="saved" navigate={navigate} user={user} />
      <header>
        <span>Persistent buyer discovery</span>
        <h2>Saved Searches</h2>
        <p>
          Run, duplicate, rename, update, delete, or simulate new-match alerts.
        </p>
      </header>
      {!user ? (
        <div className="search-empty">
          <h3>Sign in to manage saved searches</h3>
          <p>Recent searches remain available for this public session.</p>
        </div>
      ) : (
        <div className="saved-search-grid">
          {searches.map((item) => (
            <article key={item.id}>
              <div>
                <SearchStatus>
                  {item.notificationEnabled ? "Notifications On" : "Saved"}
                </SearchStatus>
                <h3>{item.name}</h3>
                <p>
                  {item.query || "Structured filters"} · {item.lastResultCount}{" "}
                  previous matches
                </p>
              </div>
              <div>
                <button onClick={() => onRun(item)}>
                  <ArrowRight /> Run
                </button>
                <button
                  onClick={() => {
                    const result = searchService.duplicateSavedSearch(
                      user,
                      item.id,
                    );
                    showToast(
                      result.ok
                        ? "Saved search duplicated."
                        : result.message,
                    );
                    setVersion(version + 1);
                  }}
                >
                  <Copy /> Duplicate
                </button>
                <button
                  onClick={() => {
                    const result = searchService.simulateNewMatches(
                      user,
                      item.id,
                    );
                    showToast(result.message);
                    setVersion(version + 1);
                  }}
                >
                  <Sparkle /> Simulate matches
                </button>
                <button
                  onClick={() => {
                    searchService.deleteSavedSearch(user, item.id);
                    setVersion(version + 1);
                  }}
                >
                  <Trash /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentSearches({ user, onRun, navigate }) {
  const [version, setVersion] = useState(0);
  const recent = searchService.getRecent(user);
  return (
    <section className="search-library-page">
      <SearchLibraryNav active="recent" navigate={navigate} user={user} />
      <header>
        <span>Search history</span>
        <h2>Recent Searches</h2>
        <p>History is isolated per account or anonymous browser session.</p>
        {recent.length > 0 && (
          <button
            onClick={() => {
              searchService.clearRecent(user);
              setVersion(version + 1);
            }}
          >
            Clear all
          </button>
        )}
      </header>
      {recent.length === 0 ? (
        <div className="search-empty">
          <Clock />
          <h3>No recent searches</h3>
          <p>Your submitted searches will appear here.</p>
          <button type="button" onClick={() => navigate("catalog")}>
            Back to Explore Music
          </button>
        </div>
      ) : (
        <div className="recent-search-list">
          {recent.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.query || "Browse all music"}</strong>
                <span>
                  {item.resultCount} results ·{" "}
                  {new Date(item.date).toLocaleString()}
                </span>
              </div>
              <button onClick={() => onRun(item)}>Run again</button>
              <button
                aria-label={`Remove ${item.query}`}
                onClick={() => {
                  searchService.removeRecent(user, item.id);
                  setVersion(version + 1);
                }}
              >
                <X />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function searchAudienceMode(user) {
  if (!user) return "public";
  if (user.userType === "internal" || user.permissions?.includes("*"))
    return "internal";
  if (user.role === "artist" || user.userType === "artist") return "artist";
  return "buyer";
}

export function SearchExperience({ view, tracks, navigate, openTrack, playingId, togglePlay, requestLicense, showToast }) {
  const { user } = useAuth();
  const mode = searchAudienceMode(user);
  const isInternal = mode === "internal";
  const isBuyer = mode === "buyer";
  const [projectContext, setProjectContext] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("beatmondo-search-project-context")); } catch { return null; }
  });
  const [query, setQuery] = useState(() => projectContext?.query || new URLSearchParams(window.location.hash.split("?")[1] || "").get("q") || "");
  const [filters, setFilters] = useState(() => ({ ...clone(DEFAULT_SEARCH_FILTERS), ...(projectContext?.filters || {}) }));
  const [sort, setSort] = useState(query ? "relevance" : "recent");
  const [layout, setLayout] = useState(() => {
    const stored = window.localStorage.getItem(`beatmondo-search-layout-${user?.id || "public"}`);
    if (stored) return stored;
    return isInternal ? "list" : "grid";
  });
  const [submitted, setSubmitted] = useState(query);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [compareIds, setCompareIds] = useState([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [collectionIds, setCollectionIds] = useState(null);
  const search = useMemo(() => {
    const merged = { ...filters };
    const parsed = searchService.search(tracks, { query: submitted, filters: merged, sort, user });
    if (collectionIds) parsed.documents = parsed.documents.filter((doc) => collectionIds.includes(doc.entityId));
    parsed.total = parsed.documents.length;
    return parsed;
  }, [tracks, submitted, filters, sort, user, collectionIds]);
  const suggestions = useMemo(() => searchService.getSuggestions(tracks, query, user), [tracks, query, user]);
  const savedIds = searchService.getSavedTracks(user);
  const recommendations = useMemo(() => {
    if (isInternal) {
      const needsReview = search.documents.filter((doc) =>
        ["Manual Review Required", "Not Yet Eligible", "Blocked", "Documents Requested"].includes(
          doc.rightsEligibility,
        ),
      );
      return {
        eyebrow: "Operations focus",
        title: "Needs attention in catalog",
        items: (needsReview.length ? needsReview : search.documents).slice(0, 3),
      };
    }
    if (mode === "artist") {
      return {
        eyebrow: "Your catalog",
        title: "Tracks to review",
        items: search.documents.slice(0, 3),
      };
    }
    const eligible = search.documents.filter((doc) =>
      ["Eligible", "Eligible with Restrictions"].includes(doc.rightsEligibility),
    );
    const filled = [
      ...eligible,
      ...search.documents.filter((doc) => !eligible.includes(doc)),
    ].slice(0, 3);
    return {
      eyebrow: "Curated next steps",
      title: "Rights-ready recommendations",
      items: filled,
    };
  }, [search.documents, isInternal, mode]);
  const submit = () => {
    const nl = searchService.search(tracks, { query, user }).parsed;
    if (nl.interpreted.length) setFilters((current) => ({ ...current, ...nl.filters }));
    setSubmitted(query); setSort(query ? "relevance" : "recent"); setVisibleCount(12); setCollectionIds(null);
    searchService.recordSearch(user, query, { ...filters, ...nl.filters }, searchService.search(tracks, { query, filters: { ...filters, ...nl.filters }, user }).total, "Explore Music");
    const params = new URLSearchParams(); if (query) params.set("q", query); window.history.replaceState(null, "", `#search${params.toString() ? `?${params}` : ""}`);
  };
  const runSearch = (item, ids = null) => {
    setQuery(item.query || "");
    setSubmitted(item.query || "");
    setFilters({ ...clone(DEFAULT_SEARCH_FILTERS), ...(item.filters || {}) });
    setSort(item.sort || (item.query ? "relevance" : "recent"));
    setCollectionIds(ids);
    navigate("catalog");
  };
  const adminAction = (track, action) => {
    if (action === "rights") {
      window.localStorage.setItem("beatmondo-selected-track", String(track.id));
      if (user?.permissions?.includes("*") || user?.permissions?.includes("rights.view")) {
        navigate("admin-rights");
        showToast(`Opening rights context for ${track.title}.`);
        return;
      }
    }
    openTrack(track);
  };
  if (view === "search-saved")
    return (
      <SavedSearches
        tracks={tracks}
        user={user}
        onRun={runSearch}
        showToast={showToast}
        navigate={navigate}
      />
    );
  if (view === "search-recent")
    return <RecentSearches user={user} onRun={runSearch} navigate={navigate} />;
  if (view === "search-collections")
    return (
      <SearchCollections
        tracks={tracks}
        user={user}
        onRun={runSearch}
        showToast={showToast}
        navigate={navigate}
      />
    );
  const compared = search.documents.filter((doc) => compareIds.includes(doc.entityId));
  const hero = isInternal
    ? {
        eyebrow: "Internal catalog search",
        title: "Search the full rights-aware index.",
        text: "Operational discovery across creative metadata, access tiers, licensing eligibility, and delivery readiness. Buyer commercial actions stay on buyer accounts.",
      }
    : mode === "artist"
      ? {
          eyebrow: "Artist catalog discovery",
          title: "Find context across the platform.",
          text: "Browse accessible previews and metadata. Submissions and rights corrections stay in your artist workspace.",
        }
      : {
          eyebrow: "Rights-aware music discovery",
          title: "Find the right track faster.",
          text: "Search creative qualities, commercial use, access, licensing readiness, and available deliverables without exposing confidential rights data.",
        };
  return (
    <section className={`search-page search-mode-${mode}`}>
      <header className="search-hero">
        <span className="eyebrow">{hero.eyebrow}</span>
        <h2>{hero.title}</h2>
        <p>{hero.text}</p>
        {isInternal && (
          <div className="search-hero-actions">
            {(user?.permissions?.includes("*") ||
              user?.permissions?.includes("search.index.manage")) && (
              <button
                type="button"
                className="search-hero-link"
                onClick={() => navigate("admin-search")}
              >
                <GearSix /> Open Search Infrastructure
              </button>
            )}
          </div>
        )}
      </header>
      <SearchInput query={query} setQuery={setQuery} suggestions={suggestions} onSubmit={submit} onSelectSuggestion={(suggestion) => { setQuery(suggestion.query); setSubmitted(suggestion.query); setSort("relevance"); searchService.recordSearch(user, suggestion.query, filters, 1, "Suggestion"); if (suggestion.trackId) openTrack(tracks.find((track) => track.id === suggestion.trackId)); }} />
      {projectContext && <div className="search-project-context"><div><small>Searching for project</small><strong>{projectContext.name}</strong><span>Automotive · Uplifting · Worldwide · Stems preferred · Professional or VIP</span></div><button onClick={() => { window.localStorage.removeItem("beatmondo-search-project-context"); setProjectContext(null); setFilters(clone(DEFAULT_SEARCH_FILTERS)); setQuery(""); setSubmitted(""); }}>Remove project context <X /></button></div>}
      {search.correction && <div className="search-correction" role="status">Showing results for <button onClick={() => { setQuery(search.correction); setSubmitted(search.correction); }}>{search.correction}</button><button onClick={() => setSubmitted(query)}>Search instead for {query}</button></div>}
      <AppliedChips query={submitted} filters={filters} parsed={search.parsed.interpreted} setFilters={setFilters} setQuery={(value) => { setQuery(value); setSubmitted(value); }} />
      <SearchLibraryNav active="music" navigate={navigate} user={user} />
      <div className="search-workspace">
        <SearchFilters
          filters={filters}
          setFilters={setFilters}
          facets={search.facets}
          internal={search.context.internal}
          showAdvanced={showAdvancedFilters}
          setShowAdvanced={setShowAdvancedFilters}
        />
        <div className="search-results-area">
          <div className="search-results-toolbar">
            <div>
              <button className="mobile-filter-button" onClick={() => setShowFilters(true)}>
                <FadersHorizontal /> Filters
              </button>
              <strong aria-live="polite">
                {search.total} accessible tracks found
              </strong>
              <span>
                {isInternal
                  ? "Internal full index"
                  : `${search.context.accessTier} catalog view`}
              </span>
              {!user && search.total > 0 && search.total < 8 && (
                <p className="search-public-note">
                  Public preview of a selective catalog. Sign in or Request Access
                  for fuller discovery and project tools.
                </p>
              )}
            </div>
            <div>
              {isBuyer && (
                <button onClick={() => setSaveOpen(true)}>
                  <BookmarkSimple /> Save search
                </button>
              )}
              <label>
                Sort
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="relevance">Relevance</option>
                  <option value="recent">Recently added</option>
                  <option value="popular">Most previewed</option>
                  <option value="title">Track title A–Z</option>
                  <option value="artist">Artist A–Z</option>
                  <option value="duration-short">Duration shortest</option>
                  <option value="duration-long">Duration longest</option>
                  <option value="bpm-low">BPM low to high</option>
                  <option value="bpm-high">BPM high to low</option>
                  <option value="licensing-readiness">Licensing readiness</option>
                  {search.context.internal && (
                    <option value="rights-completeness">Rights completeness</option>
                  )}
                </select>
                <CaretDown />
              </label>
              <div className="search-layout-toggle">
                <button
                  aria-label="Grid layout"
                  className={layout === "grid" ? "active" : ""}
                  onClick={() => {
                    setLayout("grid");
                    window.localStorage.setItem(
                      `beatmondo-search-layout-${user?.id || "public"}`,
                      "grid",
                    );
                  }}
                >
                  <SquaresFour />
                </button>
                <button
                  aria-label="List layout"
                  className={layout === "list" ? "active" : ""}
                  onClick={() => {
                    setLayout("list");
                    window.localStorage.setItem(
                      `beatmondo-search-layout-${user?.id || "public"}`,
                      "list",
                    );
                  }}
                >
                  <ListBullets />
                </button>
              </div>
            </div>
          </div>
          {search.error ? (
            <div className="search-empty search-error" role="alert">
              <WarningCircle />
              <h3>Search is temporarily unavailable</h3>
              <p>{search.error}</p>
              <button
                onClick={() => {
                  setFilters(clone(DEFAULT_SEARCH_FILTERS));
                  setQuery("");
                  setSubmitted("");
                }}
              >
                Retry search
              </button>
            </div>
          ) : search.total === 0 ? (
            <div className="search-empty" role="status">
              <MagnifyingGlass />
              <h3>
                {submitted
                  ? "No accessible tracks match"
                  : "No tracks match these filters"}
              </h3>
              <p>
                Broaden the wording or remove a restrictive filter. Private
                catalog counts remain hidden.
              </p>
              <button
                onClick={() => {
                  setFilters(clone(DEFAULT_SEARCH_FILTERS));
                  setQuery("");
                  setSubmitted("");
                }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={`search-results search-layout-${layout}`}>
              {search.documents.slice(0, visibleCount).map((document) => (
                <TrackSearchCard
                  key={document.id}
                  document={document}
                  layout={layout}
                  mode={mode}
                  isPlaying={playingId === document.entityId}
                  saved={savedIds.includes(document.entityId)}
                  compared={compareIds.includes(document.entityId)}
                  onPlay={() => togglePlay(document.entityId)}
                  onSave={() => {
                    const result = searchService.toggleSavedTrack(
                      user,
                      document.entityId,
                    );
                    showToast(
                      result.ok
                        ? result.saved
                          ? `${document.title} saved.`
                          : `${document.title} removed from saved tracks.`
                        : result.message,
                    );
                    setFilters((current) => ({ ...current }));
                  }}
                  onOpen={() => openTrack(document.source)}
                  onRequest={() =>
                    isInternal
                      ? openTrack(document.source)
                      : requestLicense(document.source)
                  }
                  onProject={() =>
                    showToast(
                      `${document.title} added to the active project shortlist.`,
                    )
                  }
                  onCompare={() =>
                    setCompareIds((current) =>
                      current.includes(document.entityId)
                        ? current.filter((id) => id !== document.entityId)
                        : current.length < 3
                          ? [...current, document.entityId]
                          : current,
                    )
                  }
                  onAdminAction={adminAction}
                />
              ))}
            </div>
          )}
          {visibleCount < search.total ? (
            <button
              className="search-load-more"
              onClick={() => setVisibleCount((count) => count + 12)}
            >
              Load 12 more{" "}
              <span>
                {visibleCount} of {search.total} shown
              </span>
            </button>
          ) : (
            search.total > 0 && (
              <p className="search-end">
                All {search.total} accessible results shown.
              </p>
            )
          )}
          {search.total > 0 && recommendations.items.length > 0 && (
            <section className="search-recommendations">
              <div>
                <span>{recommendations.eyebrow}</span>
                <h3>{recommendations.title}</h3>
              </div>
              {recommendations.items.map((doc) => (
                <button key={doc.id} onClick={() => openTrack(doc.source)}>
                  <strong>{doc.title}</strong>
                  <span>
                    {doc.subtitle} · {doc.source.mood}
                    {isInternal ? ` · ${doc.rightsEligibility}` : ""}
                  </span>
                </button>
              ))}
            </section>
          )}
        </div>
      </div>
      {showFilters && (
        <div className="search-filter-drawer">
          <button
            className="drawer-backdrop"
            aria-label="Close filters"
            onClick={() => setShowFilters(false)}
          />
          <SearchFilters
            filters={filters}
            setFilters={setFilters}
            facets={search.facets}
            internal={search.context.internal}
            onClose={() => setShowFilters(false)}
            showAdvanced={showAdvancedFilters}
            setShowAdvanced={setShowAdvancedFilters}
          />
        </div>
      )}
      {saveOpen && (
        <div className="search-modal-backdrop" role="presentation">
          <div
            className="search-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-search-title"
          >
            <button
              className="modal-close"
              onClick={() => setSaveOpen(false)}
              aria-label="Close"
            >
              <X />
            </button>
            <h3 id="save-search-title">Save this search</h3>
            <p>Keep the query, filters, and sort order for your account.</p>
            <label>
              Saved-search name
              <input
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
            </label>
            <label className="notification-check">
              <input type="checkbox" defaultChecked /> Notify me about new
              matches
            </label>
            <div>
              <button onClick={() => setSaveOpen(false)}>Cancel</button>
              <button
                onClick={() => {
                  const result = searchService.createSavedSearch(user, {
                    name: saveName,
                    query: submitted,
                    filters,
                    sort,
                    notificationEnabled: true,
                    lastResultCount: search.total,
                  });
                  showToast(result.ok ? "Search saved." : result.message);
                  if (result.ok) {
                    setSaveOpen(false);
                    setSaveName("");
                  }
                }}
              >
                Save search
              </button>
            </div>
          </div>
        </div>
      )}
      {isBuyer && compareIds.length > 0 && !comparisonOpen && (
        <div className="search-compare-launcher" role="status">
          <strong>{compareIds.length} of 3 tracks selected</strong>
          <button onClick={() => setComparisonOpen(true)}>Compare selected</button>
          <button
            aria-label="Clear comparison"
            onClick={() => setCompareIds([])}
          >
            <X />
          </button>
        </div>
      )}
      {isBuyer && comparisonOpen && (
        <ComparisonTray
          documents={compared}
          mode={mode}
          onRemove={(id) =>
            setCompareIds((current) => current.filter((item) => item !== id))
          }
          onClose={() => setComparisonOpen(false)}
          onPlay={togglePlay}
          onRequest={requestLicense}
        />
      )}
    </section>
  );
}

function Metric({ label, value }) { return <article><span>{label}</span><strong>{value}</strong></article>; }

export function SearchAdmin({ tracks, navigate, showToast }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [version, setVersion] = useState(0);
  const state = searchService.getState();
  const index = searchService.getIndex(tracks, user);
  const analytics = searchService.getAnalytics();
  const [synonyms, setSynonyms] = useState(state.synonyms);
  const [ranking, setRanking] = useState(state.ranking);
  if (!user?.permissions?.includes("*") && !user?.permissions?.includes("search.index.manage")) return <section className="search-page"><div className="search-empty"><WarningCircle /><h2>Search administration unavailable</h2><p>Search index management permission is required.</p><button type="button" onClick={() => navigate("catalog")}>Back to Explore Music</button></div></section>;
  return <section className="search-admin-page"><SearchLibraryNav active="admin" navigate={navigate} user={user} /><header><div><span className="eyebrow">Internal search operations</span><h2>Search Infrastructure</h2><p>Index health, metadata quality, synonyms, ranking, visibility, and derived search analytics.</p></div><button onClick={() => { searchService.resetSearchInfrastructureDemoData(); setVersion(version + 1); showToast("Search Infrastructure demo data reset."); }}>Reset search demo</button></header><div className="search-admin-version"><span>Index v{state.version}</span><span>Source v{state.sourceDataVersion}</span><span>Synonyms v{state.synonymVersion}</span><span>Ranking v{state.rankingVersion}</span><span>Rebuilt {new Date(state.lastRebuildAt).toLocaleString()}</span></div><nav><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Overview</button><button className={tab === "index" ? "active" : ""} onClick={() => setTab("index")}>Index</button><button className={tab === "synonyms" ? "active" : ""} onClick={() => setTab("synonyms")}>Synonyms</button><button className={tab === "ranking" ? "active" : ""} onClick={() => setTab("ranking")}>Ranking</button><button className={tab === "analytics" ? "active" : ""} onClick={() => setTab("analytics")}>Analytics</button></nav>{tab === "overview" && <><div className="search-admin-metrics"><Metric label="Source tracks" value={tracks.length} /><Metric label="Indexed" value={index.filter((doc) => doc.status === "Indexed").length} /><Metric label="Pending" value={index.filter((doc) => doc.status === "Pending").length} /><Metric label="Outdated" value={index.filter((doc) => doc.status === "Outdated").length} /><Metric label="Failed" value={index.filter((doc) => doc.status === "Failed").length} /><Metric label="Average quality" value={`${Math.round(index.reduce((sum, doc) => sum + doc.metadataQuality.percentage, 0) / index.length)}%`} /></div><section className="search-admin-panel"><div><h3>Index controls</h3><p>Prototype rebuild and synchronization actions update persistent index diagnostics.</p></div><button onClick={() => { const result = searchService.rebuildSearchIndex(); showToast(`Mock index rebuilt as version ${result.version}.`); setVersion(version + 1); }}>Rebuild mock index</button></section></>}{tab === "index" && <div className="search-admin-table-wrap"><table><thead><tr><th>Record</th><th>Status</th><th>Access</th><th>Quality</th><th>Search impact</th><th>Action</th></tr></thead><tbody>{index.map((doc) => <tr key={doc.id}><td><strong>{doc.title}</strong><small>{doc.subtitle} · {doc.id}</small></td><td><SearchStatus>{doc.status}</SearchStatus></td><td>{doc.accessLevel}</td><td><strong>{doc.metadataQuality.percentage}%</strong><small>{doc.metadataQuality.missing.join(", ") || "Complete"}</small></td><td>{doc.metadataQuality.warning}</td><td><button onClick={() => { searchService.updateIndexStatus(doc.entityId, doc.status === "Hidden" ? "Indexed" : "Hidden"); setVersion(version + 1); }}>{doc.status === "Hidden" ? "Restore" : "Mark hidden"}</button><button onClick={() => { searchService.syncTrackToSearchIndex(doc.entityId); setVersion(version + 1); }}>Refresh</button></td></tr>)}</tbody></table></div>}{tab === "synonyms" && <section className="search-admin-grid">{Object.entries(synonyms).map(([group, values]) => <article key={group}><h3>{group}</h3><p>{values.join(" · ")}</p><label>Add synonym<input onKeyDown={(e) => { if (e.key === "Enter" && e.currentTarget.value.trim()) { e.preventDefault(); setSynonyms((current) => ({ ...current, [group]: [...current[group], e.currentTarget.value.trim()] })); e.currentTarget.value = ""; } }} /></label>{values.map((value) => <button key={value} onClick={() => setSynonyms((current) => ({ ...current, [group]: current[group].filter((item) => item !== value) }))}>{value}<X /></button>)}</article>)}<button className="search-admin-save" onClick={() => { searchService.updateSynonyms(synonyms); showToast("Synonym groups updated."); setVersion(version + 1); }}>Save synonym groups</button></section>}{tab === "ranking" && <section className="ranking-settings"><div><h3>Mock ranking priorities</h3><p>Exact title and artist relevance remain dominant over popularity.</p></div>{Object.entries(ranking).map(([key, value]) => <label key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><input type="range" min="0" max="50" value={value} onChange={(e) => setRanking({ ...ranking, [key]: Number(e.target.value) })} /><strong>{value}</strong></label>)}<button onClick={() => { searchService.updateRanking(ranking); showToast("Ranking settings updated."); setVersion(version + 1); }}>Save ranking</button></section>}{tab === "analytics" && <><div className="search-admin-metrics"><Metric label="Total searches" value={analytics.totalSearches} /><Metric label="Unique users" value={analytics.uniqueUsers} /><Metric label="No-result searches" value={analytics.noResultSearches} /><Metric label="Average results" value={analytics.averageResults} /></div><section className="search-admin-panel"><div><h3>Popular queries</h3>{analytics.topQueries.length ? analytics.topQueries.map(([query, count]) => <p key={query}><strong>{query || "Browse all"}</strong> — {count}</p>) : <p>Analytics populate as searches are submitted.</p>}</div><div><h3>Recent search events</h3>{analytics.events.slice(0, 8).map((event) => <p key={event.id}>{event.event} · {event.query || "Browse all"} · {event.resultCount ?? "—"}</p>)}</div></section></>}</section>;
}

export function renderSearchView(view, props) {
  if (["admin-search", "admin-search-index"].includes(view)) return <SearchAdmin {...props} />;
  return <SearchExperience view={view} {...props} />;
}
