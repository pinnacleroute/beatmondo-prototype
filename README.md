# beatmondo Prototype

beatmondo is a premium, gated, rights-controlled sync licensing ecosystem built as a React single-page application. It presents the product as a selective private environment for serious music supervisors, brands, studios, agencies, strategic partners, artists, rightsholders, and global sync opportunities.

The prototype combines access-tiered music discovery, VIP Sync Access, track detail pages, licensing and access request flows, buyer project workflows, admin rights verification, secure WAV/stems delivery concepts, private catalog intelligence, and editorial legacy/media content in one navigable website experience.

## Project Purpose

beatmondo is designed around a few core product ideas:

- Keep the brand lowercase as `beatmondo`, honoring Gary Burke's original brand style.
- Present the product as a gated, elite sync licensing environment, not a public stock library or open upload platform.
- Support three access tiers: `Discovery Access`, `Professional Buyer`, and `VIP Sync Access`.
- Give VIP buyers curated selections, priority review, pre-approved terms where available, concierge support, fast-track licensing, and premium secure delivery.
- Keep preview listening separate from protected WAV master and stems delivery.
- Capture buyer tier, verification, usage, rights, project, delivery, and deadline context before licensing.
- Represent ownership proof, PRO/registry details, contract status, Preston approval, legal review, and licensing eligibility before tracks become quote-ready.
- Present artists and catalog history with provenance, editorial context, controlled submission workflows, and respect for the Gary Burke legacy/archive.
- Give internal teams an audit-ready admin surface for catalog health, rights review, inquiries, buyers, secure delivery, media, private catalog intelligence, and settings.

## Latest Scope Direction

The current implementation follows the updated Preston review direction:

- The website should feel like a private club plus premium catalog plus sync licensing workflow plus secure delivery system plus catalog intelligence dashboard.
- Public visitors can see brand positioning, selected editorial content, limited preview examples, Gary Burke legacy content, access tier information, and request-access CTAs.
- Approved or paid buyers can access fuller discovery, metadata, projects, licensing forms, quote workflows, and approved delivery.
- VIP buyers can see curated premium catalog cues, fast-track licensing, priority requests, concierge support, pre-approved terms, and premium delivery states.
- Secure delivery is simulated with expiring access, limited downloads, terms accepted state, download history, revoke/reissue admin controls, WAV master, and stems labels.
- Admin workflows simulate private intelligence, AI-style insights, rights verification, ownership proof, Preston approval, buyer tiers, VIP priority, and delivery controls.

## Tech Stack

- React 19
- Vite 6
- Phosphor Icons for UI iconography
- CSS modules are not used; styling lives in global CSS files.
- Static image/video assets are served from `public/assets`.
- Remote editorial imagery is currently sourced from Unsplash URLs in `src/App.jsx`.

## Project Structure

```text
.
├── AGENTS.md
├── CNAME
├── index.html
├── package.json
├── package-lock.json
├── vite.config.mjs
├── public/
│   ├── CNAME
│   └── assets/
│       ├── beatmondo-logo.png
│       ├── beatmondo-logo-gif.mp4
│       └── beatmondo-opener.mp4
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   └── premium-skin.css
└── docs/
    ├── CNAME
    ├── index.html
    └── assets/
```

### Important Files

- `src/App.jsx`: Contains the full React application, mock data, navigation state, all page components, forms, admin panels, modal logic, mini player, and reusable UI components.
- `src/main.jsx`: Mounts the React app.
- `src/styles.css`: Main layout, component, responsive, typography, and interaction styling.
- `src/premium-skin.css`: Premium visual skin that overrides and refines the color palette, surfaces, and brand mood.
- `public/assets`: Source assets used by the live Vite app.
- `docs`: Static build output used for deployment.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The configured development command runs Vite on `127.0.0.1`. A typical local URL is:

```text
http://127.0.0.1:5173/
```

Build the static site:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The production build output is written to `docs/` because `vite.config.mjs` sets `build.outDir` to `docs`.

### Site password gate

The preview gate password defaults in code for local demos. Override it without editing source:

```bash
# .env.local
VITE_SITE_PASSWORD=your-private-preview-password
```

See `.env.example`.

### Demo accounts (simulated auth)

Use the in-app login surface. Seeded accounts live in `src/auth/mockAuthData.js` (for example VIP buyer **Olivia Bennett**, artist **Marcus Hale**, admin **Preston Repenning**). Buyer-facing forms and dashboards use the **signed-in user** as the identity source of truth.

### Prototype boundaries

Authentication, permissions, payments, e-sign, secure delivery, and audit immutability are **browser simulations**. Production systems must enforce authorization before any private catalog, rights, or master-audio response reaches the client.

## Application Architecture

The app is a hash-routed single-page prototype. It does not use React Router. Navigation is controlled by the `view` state in `App.jsx`, and the current view is mirrored into the URL hash.

Examples:

- `/` or no hash: Home
- `/#catalog`: Explore Music
- `/#search`: Music Search (same discovery engine as Explore Music)
- `/#track`: Track Detail
- `/#track/15`: Track Detail for a specific track id (deep link)
- `/#artist`: Artist Profile
- `/#legacy`: Gary Burke Legacy
- `/#licensing`: Licensing / Access
- `/#licensing/request`: License-a-track path
- `/#licensing/access`: Account access request path
- `/#buyer`: Buyer Dashboard
- `/#project`: Project Detail
- `/#admin`: Admin
- `/#content`: Editorial Hub overview
- `/#stories`: Stories
- `/#media`: Media Episodes
- `/#contact`: Contact
- `/#system`: Design System

Navigation is defined in the `navItems` array in `src/App.jsx`. Every non-home view uses the sidebar and topbar shell. The home page uses a public-facing header and full editorial landing layout.

## Data Model

The current prototype uses in-memory mock data inside `src/App.jsx`.

### Tracks

The `tracks` array powers Explore Music, featured tracks, track detail pages, buyer saved tracks, project comparisons, admin track tables, and the mini player.

Each track includes:

- Title and artist
- Composer/writer
- Genre, mood, tempo, BPM, key, era, vocal status, and usage
- Availability status such as `Available Now`, `Exclusive Option`, or `Quote Required`
- Duration and instrumentation
- Tags
- Operational status such as `Rights Reviewed`, `Preview Only`, `Delivery Ready`, `Rights Review`, `Protected Delivery`, or `Ready to License`
- Artwork image
- Rights and clearance notes

### Collections

The `collections` array powers curated collection cards on the home page. These include editorial pathways such as Staff Picks, From the Archive, Music for Emotional Storytelling, Cinematic Instrumentals, Americana & Soul, and Supervisor Favorites.

### Use Cases

The `useCases` array powers the home page grid for music discovery by buyer intent, including film and television, advertising, trailers, documentary, streaming, events, sports/broadcast, and luxury/lifestyle campaigns.

### Projects

The `projects` array powers buyer dashboard project cards and the project detail page. It models project name, type, workflow status, track count, notes count, and image.

### Inquiries

The `inquiries` array powers buyer request history and admin inquiry management. It models company, track, project type, budget, deadline, and status.

### Artists

The `artists` array powers the artist profile and admin artist cards.

## Global UI Behavior

### Sidebar

The sidebar appears on all non-home pages. It includes:

- beatmondo logo button back to Home
- Full section navigation
- Active state for the current view
- Mobile close button
- Security card emphasizing protected licensing, preview-only listening, and audit-ready activity logs

### Topbar

The topbar appears on all non-home pages. It includes:

- Mobile menu button
- Current page title
- Request Access action
- Notification button with a dropdown panel
- Buyer profile pill that opens the Buyer Dashboard

### Public Header

The home page uses a public header with:

- beatmondo logo
- Explore Music, Licensing, Legacy, and Stories navigation
- Request Access CTA

### Mini Player

When a track has been previewed, a mini player appears at the bottom of the app. It shows:

- Play/pause control
- Cover art
- Track title and artist
- Preview-only state
- Decorative waveform
- Details button that opens the track detail view

The prototype simulates playback state visually. It does not stream actual track audio.

### Toasts

Several actions trigger temporary toast messages, including saving searches, opening admin workflows, starting secure download simulations, filtering content, and opening project tools.

### License Request Modal

Track rows, cards, side panels, and detail pages can open a license request modal. The modal:

- Is tied to the selected track
- Focuses the first interactive element on open
- Closes on Escape or backdrop click
- Contains the same license request form used on the Licensing / Access page
- Shows a confirmation state after successful submission

## Page and Section Guide

## Home

The home page is the public editorial entry point for the product.

### Hero

The hero introduces beatmondo as a premium gated sync licensing ecosystem. It includes:

- Brand navigation
- Editorial headline and supporting copy
- Primary CTA: Explore Music
- Secondary CTA: Request Licensing Access
- Tertiary CTA: Learn the Story
- Video-based hero media using the beatmondo opener asset

The hero video attempts to play with audio when visible, falls back to muted playback when autoplay restrictions apply, pauses when out of view, and attempts to unlock audio after a user pointer or keyboard interaction.

### What Is beatmondo?

This editorial band explains the product pillars:

- Curated music with context
- Built for professional buyers
- Secure master delivery

### Music for Creative Use

This image-led grid lets users enter Explore Music through use-case categories:

- Film & Television
- Advertising & Brand Campaigns
- Trailers & Promos
- Documentary & Editorial
- Streaming & Digital Content
- Events & Experiences
- Sports & Broadcast
- Luxury / Lifestyle Campaigns

Each card routes to Explore Music.

### Curated Collections

Collection cards present editorial paths into the music catalog. Each card includes an image, description, track count, tags, and a button to view the collection.

### Featured Tracks

The home page includes a compact track list with:

- Preview play/pause button
- Artwork
- Track title and status
- Artist, genre, and BPM
- Tags
- Duration
- Save button
- Request License button
- Details button

### Trust Panel

The adjacent trust panel reinforces:

- Rights-aware metadata
- Protected masters
- Artist-first catalog positioning

### Partner Band

The strategic partner band frames beatmondo as a long-term catalog and licensing foundation. The Partnership Inquiry button routes to Licensing / Access.

### Content Preview

Three editorial preview cards route to:

- Gary Burke Legacy
- Stories
- Media

### Footer

The footer includes grouped navigation:

- Explore: Explore Music, Licensing, Artists, Gary Burke Legacy
- Media: Editorial Hub, Stories, Media Episodes, Contact
- Access: Request Access, Licensing Access, Partner Inquiry

It also reinforces that master files are protected and delivered only through approved licensing workflows.

## Explore Music

Explore Music is the main buyer-facing discovery interface.

### Search

The search input filters tracks by text across title, artist, genre, mood, tags, and usage.

### Filters

The filter set includes:

- Genre
- Mood
- Tempo
- Era
- Usage
- Vocal
- Availability
- Duration

Active filters appear as chips. A Clear filters action resets all filters.

### Sorting

Sorting options include:

- Supervisor relevance
- Title
- Artist
- Duration

### Layout Toggle

Users can switch between:

- List view: dense professional buyer workflow
- Card view: more visual artwork-led browsing

### Result States

The page displays the number of matching tracks. If no tracks match, an empty state appears with a clear-filters action.

### Track List View

Each row supports:

- Selecting the track for the side panel
- Preview play/pause
- Save/unsave
- Request License
- Open detail view

### Track Card View

Each card supports:

- Preview play/pause
- Save/unsave
- Details
- Request License

### Track Side Panel

The side panel summarizes the selected track with:

- Preview-only artwork card
- Play/pause button
- Title, artist, genre, and usage
- Tags
- Duration, BPM, and key
- Rights and licensing state
- Protected master audio messaging
- WAV availability after approval
- Request License CTA
- Secure delivery lockup

## Track Detail

The track detail page gives a more complete track-level licensing view.

It includes:

- Track hero with title, artist, genre, era, and artwork
- Preview Track button
- Save to Project button
- Request License button
- Large preview-only waveform area
- Protected master audio and WAV-after-approval messaging
- Metadata panel with artist, composer/writer, genre, mood, BPM, duration, instrumentation, era, vocal status, and usage availability
- Rights and clearance panel with track-specific rights notes
- Secure protected master audio box
- Similar tracks list

Similar track rows reuse the same preview, save, detail, and request interactions as Explore Music.

## Artist Profile

The artist profile page currently focuses on Lennox as the representative artist.

It includes:

- Artist portrait
- Artist introduction and positioning
- Request License CTA
- Editorial Story CTA
- Editorial story panel
- Credits / notable work panel
- Archive / context notes panel
- Featured collection panel
- Related tracks list

The page is intended to show how beatmondo can pair music discovery with provenance, credits, and human context.

## Gary Burke Legacy

The Gary Burke Legacy page is an archive-oriented editorial section.

It includes:

- Cinematic image hero
- Archive-oriented headline and copy
- Explore related music CTA
- Four-part timeline:
  - The founding idea
  - Studio stories
  - Catalog stewardship
  - Artist-first future
- Legacy archive cards:
  - Preserving the Original Vision
  - Studio Memories
  - Featured Legacy Tracks
  - Quotes and Stories

The Featured Legacy Tracks card can open a legacy-connected track detail page.

## Licensing / Access

The Licensing / Access page contains two modes:

- Request License
- Request Access

### Request License Mode

This mode captures usage details before licensing review. Fields include:

- Name
- Email
- Company
- Role
- Project name
- Project type
- Track of interest
- Media type
- Territory
- Term
- Exclusivity
- Budget range
- Deadline
- Need WAV master?
- Need stems?
- Need custom edit?
- Intended usage / message

Required fields show inline validation after submit attempts.

After valid submission, the confirmation screen shows a licensing workflow strip:

- Submitted
- Under Review
- Quote Needed
- Quote Sent
- Approved
- Paid
- Delivered

### Request Access Mode

This mode captures account/workspace access requests. It includes a role selector for:

- Music Supervisor
- Film / TV Producer
- Brand / Agency
- Trailer Editor
- Artist / Contributor
- Strategic Partner
- Other

The form also collects name, email, company, role, intended use, and message.

After submission, the confirmation screen shows:

- Request received
- Role review
- Workspace setup

## Buyer Dashboard

The Buyer Dashboard models a logged-in buyer workspace.

### Metrics

The top metrics show:

- Saved Tracks
- Active Projects
- License Requests
- Approved Downloads

### Next Steps

The next-step cards surface buyer priorities:

- Quote awaiting review
- Deadline approaching
- Download ready

Actions can open the project page, open a license modal, or simulate a secure delivery workspace toast.

### Project Cards

The project grid shows buyer projects with image, status, name, type, track count, notes count, and Open project action.

### Saved Tracks

Saved tracks are derived from the app-level saved state. If there are no saved tracks, an empty state directs users back to Explore Music.

### Submitted License Requests

The request list shows company, track, project type, and status for submitted inquiries.

### Recently Previewed

Preview cards open track details for recently previewed or suggested tracks.

### Approved Downloads

The secure delivery card models approved master delivery with:

- Locked file state
- Expiration date
- Remaining download count
- Download history tracking
- WAV master label
- Invoice paid status
- Role verified status
- Secure WAV Download button

The download action is simulated with a toast.

## Project Detail

The Project Detail page models a buyer project workspace for a licensing shortlist.

It includes:

- Project hero with image background
- Project metadata strip with usage, territory, budget, deadline, and status
- Submit License Request CTA
- Add Track CTA
- Track comparison table
- Internal notes area
- Licensing status stepper
- Licensing summary

The track comparison table shows title, artist, duration, mood, usage fit, availability, and a detail action. Clicking a comparison row opens that track detail page.

The licensing status stepper visually marks progress through:

- Submitted
- Under Review
- Quote Sent
- Payment Pending
- Delivered

## Admin

The Admin page is an internal operations surface with tabbed management areas and shared operational metrics.

### Admin Tabs

Tabs include:

- Overview
- Tracks
- Artists
- Inquiries
- Buyers
- Secure Delivery
- Media
- Analytics
- Audit Logs
- Settings

### Metric Groups

The top of the admin page groups metrics into:

- Catalog: tracks, published tracks, health
- Licensing: new inquiries, quote requests, approved items
- Delivery: secure downloads, rights missing, recent masters

### Licensing Inquiry Pipeline

The pipeline displays status counts for:

- New
- In Review
- Quote Needed
- Quote Sent
- Approved
- Paid
- Delivered

Clicking a pipeline status simulates filtering with a toast.

### Overview

The overview tab contains cards for:

- Catalog health
- Licensing queue

Each card has an action that simulates opening the relevant report or queue.

### Tracks

The Tracks tab includes:

- Search toolbar
- Add Track button
- Track operations table
- Track title and generated ISRC-like identifier
- Artist
- Status badge
- Preview readiness
- Protected master state
- Rights review state
- Preview audio upload explanation
- Protected master audio upload explanation

This section explicitly separates public preview audio from private protected master audio.

### Artists

The Artists tab displays artist cards with portrait, credit line, related track count, and manage action.

### Inquiries

The Inquiries tab shows detailed request rows with:

- Company
- Track
- Project type
- Inquiry ID
- Budget
- Deadline
- Status

### Buyers

The Buyers tab displays buyer account cards with role-based access, saved projects, invoice contacts, and request history.

### Secure Delivery

The Secure Delivery tab includes:

- Delivery queue
- Download history

These reinforce payment confirmation, WAV delivery, timestamped downloads, buyer role, project, and license tracking.

### Media

The Media tab includes internal management concepts for:

- Stories editor
- Media episodes manager

Note: buyer-facing terminology elsewhere uses Editorial Hub, Stories, and Media Episodes. This admin tab still contains some internal editor labels.

### Analytics

The Analytics tab summarizes:

- Discovery trends
- Buyer activity

### Audit Logs

The Audit Logs tab lists immutable operational events such as role changes, master download approvals, rights note edits, access revocations, and quote status changes.

### Settings

The Settings tab includes:

- Workspace settings
- Security controls

These cover role permissions, delivery rules, quote templates, notification defaults, encryption, download limits, and audit retention policies.

### Activity Feed

The admin page also includes an activity feed showing recent licensing, inquiry, quote, track upload, and permissions activity.

## Editorial Hub Overview

The Editorial Hub overview page introduces the editorial content area.

It includes:

- Featured story card
- Story category chips
- Media episode category chips
- Latest cover thumbnails
- Editorial archive note

Story category chips route to the Stories page and show a filter toast. Episode chips route to Media Episodes and show a toast.

## Stories

The Stories page is a selectable editorial library.

It includes:

- Feature story hero for the selected story
- Open Story action
- Related Media action
- Editorial library selector
- Reader notes
- Story pathway chips

Available stories include:

- The musicians behind unforgettable sounds
- How rights-aware discovery protects the creative process
- Gary Burke and the catalog as a living archive
- What supervisors save before they request a quote

Selecting a story updates the hero content and image.

## Media Episodes

The Media Episodes page is a selectable media episode library.

It includes:

- Episode hero for the selected episode
- Play Episode action
- Episode Notes action
- Episode library selector
- Production note thumbnails
- Guest and partner contact panel

Available episode categories include:

- Artist interviews
- Licensing conversations
- Catalog stories
- Behind-the-scenes
- Music supervisor insights

Selecting an episode updates the hero content and image. Playback is simulated with a toast.

## Contact

The Contact page routes different types of inbound conversations.

Topic choices include:

- Licensing
- Buyer Access
- Artist / Contributor
- Strategic Partner
- Media
- Archive / Legacy

The form collects:

- Name
- Email
- Company
- Topic
- Message

After submit, a confirmation screen shows:

- Received
- Team review
- Follow-up

Users can send another message or move to the Licensing / Access page.

## Design System

The Design System page documents the prototype’s visual language and key component states.

It includes:

- Logo usage block
- Color swatches
- Buttons and form controls
- Audio player component state
- Licensing status badges
- Empty/loading/error language guidance

The palette shown in the page includes:

- Charcoal / black
- Warm surface browns
- Ivory
- Taupe
- Clay accent
- Sage accent

## Visual Design Direction

The prototype uses an editorial, premium music-industry visual system.

Core visual traits:

- Dark cinematic shell for app/workspace pages
- Warm ivory editorial sections on the public home page
- Gold and champagne accents for brand emphasis
- Charcoal, taupe, sage, clay, and warm grey supporting colors
- Image-led cards and hero areas
- Restrained overlays on photography
- Serif display typography for major editorial headings
- Inter for UI text, navigation, forms, and operational surfaces
- Dense but readable admin and buyer workflows
- Rounded cards and controls with restrained radii
- Icon-led actions using Phosphor Icons

The app intentionally avoids feeling like a commodity stock-music catalog. It presents music as curated, contextual, rights-aware, and professionally licensed.

## Responsive Behavior

The CSS includes responsive behavior for smaller screens:

- The app shell collapses from sidebar layout into a mobile-friendly structure.
- The sidebar can open and close via the mobile menu.
- Grid sections collapse into fewer columns.
- Track rows, cards, forms, and panels adjust for narrower widths.
- Public home sections preserve image-led hierarchy while stacking content.
- The mini player remains fixed near the bottom and adapts to available width.

## Forms and Validation

Forms are client-side only and do not submit to a backend.

Implemented form behavior:

- License request form uses controlled React state.
- Required fields are checked with native form validity.
- Inline error messages appear after a submit attempt for missing required fields.
- Access and contact forms simulate success states.
- Confirmation screens represent workflow outcomes.

No data is persisted after refresh.

## Prototype Limitations

This is a front-end prototype, not a production platform.

Current limitations:

- No backend API
- No real authentication
- No database
- No persistent saved tracks after refresh
- No real audio streaming
- No real WAV/master download
- No real file upload
- No actual license quote generation
- No email or notification delivery
- No payment workflow
- No user roles or permission enforcement
- No real analytics collection
- No real audit log persistence

The UI demonstrates intended product behavior and workflow structure using local state and mock data.

## Deployment Notes

The Vite build emits static files into `docs/`, which suggests the project is intended to support static hosting such as GitHub Pages.

The project includes:

- Root `CNAME`
- `public/CNAME`
- `docs/CNAME`

These should be kept aligned with the intended custom domain when deploying.

## Product Terminology

The prototype follows these terminology rules:

- Use `Explore Music` for buyer-facing discovery.
- Reserve `Catalog` for admin/internal operations.
- Use `Request License` for track/project licensing CTAs.
- Use `Request Access` for account or workspace access.
- Keep availability, workflow status, delivery state, and admin review state distinct.
- Use `Quote Required` for track availability.
- Use `Quote Needed` for internal pipeline status.
- Prefer `protected master audio` in explanatory copy.
- Use `WAV master` when naming the delivered file.
- Use `Editorial Hub` for the overview content area, with `Stories` and `Media Episodes` as child areas instead of generic Blog/Podcast naming.

## Key User Journeys

### Buyer Discovers and Requests a Track

1. Start on Home.
2. Select Explore Music.
3. Search or filter tracks by genre, mood, usage, availability, or duration.
4. Preview a track.
5. Save it or open the track detail page.
6. Review metadata and rights notes.
7. Select Request License.
8. Complete usage details.
9. Receive a submitted request confirmation.

### Buyer Manages a Project

1. Open Buyer Dashboard.
2. Review saved tracks, active projects, requests, and approved downloads.
3. Open a project card.
4. Compare shortlisted tracks.
5. Add notes or open track details.
6. Submit or update a license request.
7. Track licensing status toward delivery.

### Internal Team Reviews Operations

1. Open Admin.
2. Review catalog, licensing, and delivery metrics.
3. Filter the inquiry pipeline by status.
4. Manage tracks, artists, inquiries, buyers, secure delivery, media, analytics, audit logs, or settings.
5. Use activity feed and audit logs to understand recent operational changes.

### Visitor Explores Brand and Legacy

1. Start on Home.
2. Read the product positioning and trust signals.
3. Open Gary Burke Legacy.
4. Review timeline and archive cards.
5. Open related music or move into Editorial Hub.
6. Contact beatmondo for archive, media, partnership, or licensing conversations.

## Development Notes

- The app state is centralized inside `App`.
- Reusable components such as `TrackRow`, `TrackCard`, `Panel`, `Metric`, `MiniPlayer`, `InquiryForm`, and `EmptyState` are defined in the same file as the page components.
- Adding a new top-level page requires:
  - Adding an entry to `navItems`
  - Ensuring the ID is included in `validViews`
  - Adding a conditional render branch in `App`
  - Adding any related footer or public navigation behavior if needed
- Adding a new track requires extending the `tracks` array with all metadata used by list, card, detail, admin, and licensing views.
- Since there is no router, direct links should use hash URLs.

## Scripts

```json
{
  "dev": "vite --host 127.0.0.1",
  "build": "vite build",
  "preview": "vite preview --host 127.0.0.1"
}
```
