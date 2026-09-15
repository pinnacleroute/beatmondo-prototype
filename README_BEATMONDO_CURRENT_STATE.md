# beatmondo Current Technical State

Last inspected: 2026-09-15

## 1. Project Overview

beatmondo is currently implemented as a premium, gated, rights-controlled music discovery and sync-licensing prototype. The repository demonstrates a private-club style buyer experience, curated music discovery, protected preview playback, buyer verification, membership tiers, licensing requests, quote calculation, contracts and simulated e-signature, simulated licensing payments, licence generation, secure delivery, rights review, file storage policy simulation, audit logging, privacy tooling, email/message simulation, analytics, and admin operations.

The current application is a frontend-only React single-page application. It is not production-ready and should not be treated as an MVP backend or commercially enforceable platform. Most operational systems are sophisticated browser-side simulations backed by seeded JavaScript data and `localStorage`. There is no real backend, database, object storage, payment processor, e-signature provider, notification provider, search service, audit log service, identity provider, rights authority, or CDN integration in this repository.

Current development stage: high-fidelity strategic/prototype application. It is valuable as product architecture, UX, domain workflow modeling, stakeholder demo material, planning input, and frontend seed work. It is not ready for live commercial launch without a full production backend and security architecture.

## 2. Current Feature Inventory

| Area | Current state | Real, mocked, or placeholder |
| --- | --- | --- |
| Homepage | Full public/private marketing-style homepage with full-bleed hero video, investor summary, problem/solution, tiers, business model, commercial use cases, collections, featured tracks, differentiators, editorial panels, footer logo animation. | Real frontend; content and workflow claims are prototype positioning. |
| Music discovery/search | Explore Music and Music Search use a shared React search/filter experience. Filters include genre, mood, usage, vocal/instrumental, availability, BPM, duration, rights, VIP access, exclusivity, stems. | Real frontend filtering over seeded arrays and `localStorage`; no search index/backend. |
| Track detail | Track detail page shows metadata, rights summaries, assets, protected preview controls, related licensing CTA. | Real frontend; rights and asset data are seeded/simulated. |
| Artist profiles | Artist profile for seeded artists, including The SMYRK and The Slambovian Circus of Dreams, with editorial media and track connections. | Real frontend; data is hardcoded/seeded. |
| Catalog browsing | Buyer-facing "Explore Music" route; internal "Catalog" language appears in operations modules. | Real frontend; no catalog database. |
| Licensing requests | Buyer request/access form with multi-step draft persistence and duplicate detection using `localStorage`. | Frontend simulation; no submitted backend workflow. |
| Quotes | Quote calculation, pricing rules, approvals, buyer quote views, print view, negotiation actions, accept/decline/proceed to contract. | Browser-side simulated quote ledger in `src/quotes`; no pricing service or legal/finance enforcement. |
| Rights metadata | Structured rights database with master, composition, publisher, writer, sample, territory, restriction, document, dispute, checklist, reviewer, eligibility, activity data. | Browser-side simulated rights records. Comments state all data is fabricated for workflow demonstration. |
| Master rights | Master ownership owners, percentages, evidence docs, status, licensing status. | Simulated data and calculations only. |
| Composition/publishing rights | Writers, writer shares, publishers, publisher shares, PRO/IPI fields, publishing status. | Simulated data and calculations only. |
| Contracts | Contract templates, clauses, contract generation from accepted quotes, version history, approvals, buyer comments, buyer signature, countersignature, print view. | Browser simulation. Signature code is hardcoded; no e-signature provider. |
| Payments | Licensing invoices, obligations, card, PayPal simulation, bank-transfer reconciliation, crypto placeholder, receipts, refunds, credits, analytics. | Browser simulation. No Stripe/PayPal/Coinbase/bank integration. |
| Secure music delivery | Delivery authorizations, packages, asset entries, entitlements, manifests, download sessions, extension requests, replacement packages, release-gate checklist. | Browser simulation; no real storage/download service. |
| Buyer dashboards | Buyer dashboard, project detail, quotes, contracts, payments, licences, secure deliveries, media access, private previews, organization analytics, privacy/settings. | Real frontend; all business data is seeded/browser persisted. |
| Artist dashboards | Artist dashboard, track submissions, new submission wizard, submission detail, artist files, own rights review, protected previews, performance analytics. | Real frontend; uploads are simulated metadata records. |
| Admin dashboards | Admin overview with operational panels plus modules for memberships, verification, rights, search, ingestion, storage, previews, quotes, contracts, payments, licences, delivery, expiring access, audit, email, permissions, analytics, privacy, users. | Real frontend modules; operational state is mocked. |
| Analytics | Central analytics service aggregates browser-side source records from modules and separates commercial, finance, membership, buyer, artist, rights, operations, search, email, security, permissions scopes. | Browser-side analytics simulation with seeded events; no warehouse or instrumentation pipeline. |
| User roles | Seeded buyers, artist, and internal users. Roles include discovery/professional/VIP buyers, artist, catalog manager, licensing manager/rights manager, media operations, finance, legal, privacy, security, support, administrator, super administrator. | Demo auth/RBAC only. |
| Permissions/RBAC | `AuthContext` route decisions plus a larger `authorizationService` supporting roles, assignments, direct grants, explicit denials, temporary elevations, separation of duties, approval limits, impersonation restrictions, field redaction. | Frontend enforcement only; useful model but not secure. |
| Authentication | Password gate, login, demo account panel, registration/request access, forgot/reset password, email verification, MFA challenge, profile/security/session UI. | Browser simulation with plaintext demo passwords and `localStorage` sessions. |
| Membership/access tiers | Discovery Access, Professional Buyer, VIP Sync Access, enterprise inquiry, checkout, billing, invoices, payment methods, subscription changes, cancellation/reactivation, admin membership operations. | Browser simulation; no subscription provider. |
| Media player/waveform | Fixed mini-player using a real hidden `<audio>` element for real supplied preview audio where available, plus simulated playback for tracks without real audio. Supports play/pause, progress, seek in expanded rail, minimize/close. | Mixed: real HTML audio for available assets; access/session enforcement is simulated. |
| Uploads | Artist/internal track ingestion wizard and temporary upload access records create mock asset metadata. | Simulated; no file upload to server/storage. |
| Search/filtering | Shared search service, saved/recent searches, collections, relevance scoring, role-aware counts. | Local deterministic filtering; no external search/index. |
| Notifications | In-app demo messages plus email module queue/templates/triggers/preferences/failures. | Simulated; no email/SMS/push delivery. |
| Crypto placeholders | Licensing payment flow includes crypto provider placeholder, Coinbase as example only, settlement currency and mock wallet confirmation. | Placeholder/simulated only. |
| Merchandise | Merchandise page presents future partner-led products, fictional pricing, no checkout/inventory/payment/shipping. | Frontend placeholder. |
| Investor screens | Investor Overview exists as a polished private-review route. | Real frontend narrative; metrics are prototype/simulated. |
| Stories/media/contact | Editorial Hub, Stories, Media Episodes, Gary Burke Legacy, Contact pages exist. | Real frontend content; contact form has no backend submission. |
| Multilingual readiness | No i18n library, translation files, locale routing, or formatting strategy beyond ad hoc labels. | Not implemented. |
| Mobile/responsive behavior | CSS includes responsive breakpoints, mobile nav, full-width fixed player, safe-area inset handling. | Real frontend responsive CSS; no automated cross-browser suite. |

## 3. Role & Permission Matrix

Two overlapping permission systems exist:

- `src/auth/mockAuthData.js` defines demo users and direct permission arrays used by much of the UI through `roleHasPermission`.
- `src/permissions/permissionData.js` and `src/permissions/authorizationService.js` define a richer RBAC model with permission registry, roles, role assignments, explicit denials, temporary elevations, approval authorities, delegations, impersonation, access reviews, conflicts, and route policies.

All enforcement is client-side and demo-only.

| Role | User type | Available pages | Main permissions represented | Restricted functionality | Enforcement status |
| --- | --- | --- | --- | --- | --- |
| Public/anonymous | Public | Home, Explore Music/Search, Use Cases, Track Detail, Artist Profile, Legacy, Licensing/Access, Editorial Hub, Stories, Media, Merchandise, Investor, Contact, Membership Plans | Public browsing, public protected previews where policy allows. | Private buyer dashboard, admin, delivery rooms, payments, contracts, account settings. | Route checks only; no server enforcement. |
| Discovery Buyer (`discovery_buyer`) | Buyer | Buyer workspace core pages, catalog/search, verification, membership/billing, profile/security/privacy, own quotes/contracts/payments/licences/delivery views when eligible. | Discovery search, public previews, saved searches, own audit/email, own quotes/contracts/payment/licence/delivery records. | VIP catalog, professional project tools, delivery may be blocked by verification/membership. | Demo auth + entitlement calculation. |
| Professional Buyer (`professional_buyer`) | Buyer | Buyer dashboard, project, quotes, contracts, payments, licences, secure deliveries, analytics/privacy, catalog/search. | Professional search, projects, licensing requests, own commercial records, payment processing simulation. | VIP catalog/private previews unless VIP entitlement exists. | Demo auth + membership/verification gates. |
| VIP Buyer (`vip_buyer`) | Buyer | Full buyer workspace including private previews, VIP catalog signals, secure delivery, concierge-like paths. | VIP search/catalog, private preview access, priority delivery states, own commercial workflows. | Cannot access internal admin modules. Delivery still depends on rights/licence/payment simulation. | Demo auth + membership/verification gates. |
| Artist (`artist`) | Artist/rightsholder | Artist dashboard, submissions, new submission, submission detail, artist files, own rights review, protected previews, performance analytics, privacy/security. | Own submissions, own file metadata, own preview review/change requests, own rights-safe summaries. | Internal notes, buyer activity, unrelated artists, private documents, admin tools. | Demo auth + client filtering. |
| Catalog Manager | Internal | Admin, catalog/search, ingestion, track admin, analytics/reporting subsets, user-safe pages. | Catalog editing/publishing concepts, ingestion review, search readiness, basic quote calculations. | Finance/security/legal/privacy critical actions unless separately granted. | Demo permission arrays and RBAC route policies. |
| Licensing Manager / Rights Manager | Internal | Admin quote/contract/licence/delivery plus rights and expiring-access surfaces depending permission arrays. | Quotes, contracts, rights approvals, licensing workflow, selected delivery/access actions. | High-risk finance/security/super-admin actions. | Demo permission arrays. |
| Media Operations | Internal | Storage, previews, delivery preparation, ingestion asset replacement, operations analytics. | Media processing, preview generation, storage assets, delivery package preparation. | Finance, legal, restricted admin unless granted. | Demo permission arrays. |
| Finance Manager | Internal | Licensing Payments, reconciliation, refunds, credits, finance analytics, relevant admin panels. | Payment viewing/processing/reconciliation/refund/credit simulations. | Non-finance rights/legal/security actions. | Demo permission arrays. |
| Legal Reviewer | Internal | Contracts/licences/legal review, privacy legal holds/vendors/incidents, restricted reports. | Contract/licence approval/suspension/termination concepts, legal privacy controls. | Payment processing and broad super-admin operations. | Demo permission arrays. |
| Privacy Administrator | Internal | Compliance & Privacy module, notices, consents, inventory, requests, retention, vendors, assessments, exports. | Privacy request review/completion, notices, consents, data inventory, retention, vendors, assessments. | Unrelated finance/legal/security operations unless separately granted. | Richer RBAC route policies for privacy routes. |
| Security Administrator | Internal | Admin Permissions, audit/security, sessions, temporary access, security analytics, privacy security paths. | Access reviews, conflicts, session revocation, temporary access revocation, audit security, reports. | Commercial signing/payment/download actions during impersonation. | Richer RBAC route policies, still client-side. |
| Support Administrator | Internal | Access users, support-safe impersonation/request paths, privacy request creation. | Safe account support and view-only impersonation concepts. | Legally significant actions. | Demo-only restrictions. |
| Administrator | Internal | Broad operations pages. | Platform operations lead permissions. | Not equivalent to super administrator in rich RBAC. | Demo-only. |
| Super Administrator | Internal | All admin/prototype routes including Investor and Design System. | `*` permissions in auth mock data and all permissions in RBAC registry. | None inside prototype; still cannot enforce backend reality. | Demo-only and unsafe for production as implemented. |

## 4. End-to-End User Flows

### Buyer: discover track to secure asset delivery

1. Buyer unlocks the site password gate. This uses `VITE_SITE_PASSWORD` or the fallback password in `src/main.jsx`.
2. Buyer logs in through `src/auth/AuthModule.jsx` using seeded demo accounts in `src/auth/mockAuthData.js`.
3. Buyer browses Explore Music/Search. Filtering occurs against `tracks` in `src/App.jsx` and search state in `src/search`.
4. Buyer opens a track detail page. Track metadata, assets, and rights summary are read from hardcoded track objects and rights service mock records.
5. Buyer plays a protected preview. For The SMYRK and Slambovian audio extract, real audio files are used. `storageService.createStreamingSession` and `watermarkedPreviewService` create short-lived simulated sessions in `localStorage`.
6. Buyer clicks Request License. `requestLicense` checks simulated rights eligibility, buyer verification, and membership entitlements. Blocked/editorial-only tracks do not enter automatic licensing.
7. Buyer completes licensing form. Draft/submission data is persisted to `beatmondo-license-submissions` and draft keys in `localStorage`.
8. Admin or licensing users can create/calculate quotes in `src/quotes`. Suggested ranges use rule multipliers and simulated rights checks.
9. Buyer reviews, accepts, requests revision, or declines quote. Acceptance updates quote state only; it does not legally bind, charge, or license anything.
10. Accepted quote can proceed to contract generation. `contractService` creates a simulated contract from quote/template/clause data.
11. Contract goes through simulated internal approvals, signature request, buyer signature, countersignature, versioning, and document asset creation.
12. Payment module creates/handles licensing invoices and simulated card, PayPal, bank transfer, or crypto placeholder payment. Payment readiness updates contract/quote state but no processor is called.
13. Licence module can generate/approve/issue simulated licence records from accepted quote, contract, payment, and rights state.
14. Secure delivery module creates delivery packages, checks release-gate readiness, entitlements, manifests, temporary access, sessions, download counts, replacements, suspensions, and revocations.
15. Actual WAV master/stem transfer is not implemented. Downloads are simulated records, not secure file delivery.

### Artist/catalog onboarding

1. Artist logs in as a seeded artist account.
2. Artist opens Track Submissions and starts/resumes a draft.
3. Wizard collects basic metadata, audio asset scenario, metadata, contributors, rights declarations, artwork/lyrics, delivery assets, review, declarations, and submission.
4. Uploads create mock asset records only; there is no binary upload.
5. Submission creates processing job records and notifies internal users through demo messages.
6. Internal ingestion workspace can simulate jobs, checklists, revisions, technical approval, rights handoff, final approval, publishing/unpublishing.
7. Storage service syncs ingestion assets into simulated storage metadata.

### Admin/catalog management

1. Internal users log in through demo auth.
2. `AdminDashboard` in `src/App.jsx` exposes overview, tracks, artists, inquiries, buyers, secure delivery, media, settings, and links to domain modules.
3. Admin actions update seeded browser states and show toasts/messages.
4. Super admin can reset all demo data through `window.resetAllBeatmondoDemoData`.

### Rights verification

1. Rights records live in `src/rights/rightsData.js`.
2. Rights service calculates completeness from master owners, writer shares, publisher shares, PRO identifiers, samples, territories, documents, disputes, and approvals.
3. Licensing eligibility is calculated locally and can be Eligible, Conditional, Not Yet Eligible, Manual Review Required, or Blocked.
4. Actions can update parties, owners, writers, publishers, documents, disputes, status, assignments, versions, and public buyer summaries.
5. This is a workflow simulation. It does not verify ownership or legal authority.

### Contract workflow

1. Quote must be accepted before contract generation.
2. Contract is generated from a template and clauses.
3. Completeness checks validate required fields, unresolved tokens, approvals, signers, and rights.
4. Internal approvals are simulated.
5. Signature requests expose buyer signing pages. The QA signature code is hardcoded as `864209`.
6. Typed signatures and countersignatures create browser-side signature records and document assets.
7. No certified e-signature provider, legal identity proofing, or document vault exists.

### Approval workflow

Approvals exist across quotes, contracts, licences, delivery packages, refunds, buyer verification, permissions, privacy, and rights records. They are implemented as local state transitions, role permission checks, and audit/message records. They are not enforced by a server, queue, workflow engine, or policy service.

## 5. Technical Architecture

| Layer | Current implementation |
| --- | --- |
| Frontend framework | React 19.2.0 mounted by Vite 6.4.3. |
| Backend | None. No Express/Next/API route/serverless code found. |
| APIs | None external. Internal "services" are frontend JavaScript modules. |
| Database | None. Persistence uses browser `localStorage` and `sessionStorage`. |
| Authentication | Demo password gate plus demo auth service. Plaintext seeded passwords and browser sessions. |
| Storage | Static assets in `public/assets`; simulated storage records in `localStorage`. |
| Media delivery | HTML audio previews for supplied local assets; simulated stream/session/access records. |
| Payment architecture | Simulated licensing and membership payment services. No live card, bank, PayPal, crypto, tax, or settlement integration. |
| State management | React `useState`/`useEffect` plus domain service read/write helpers around browser storage. No Redux/Zustand/server cache. |
| Routing | Hash-routing controlled by `view` state and `window.location.hash`; no React Router. |
| Styling/UI | Global CSS files: `styles.css`, `premium-skin.css`, and module CSS files. Phosphor Icons for iconography. |
| Third-party libraries | `react`, `react-dom`, `@phosphor-icons/react`, `vite`, `@vitejs/plugin-react`. |
| Analytics | Browser-side aggregation in `src/analytics`; no telemetry pipeline. |
| Infrastructure/deployment | Vite builds static files into `docs/`; GitHub Actions commits `docs/` on push to `main`; `CNAME` files indicate custom-domain GitHub Pages style deployment. |

## 6. Repository / Folder Structure

```text
.
├── .env.example                         # Optional Vite site-password variable
├── .github/workflows/deploy.yml          # GitHub Actions build and docs/ deployment commit
├── AGENTS.md                             # Durable prototype instructions and brand/product direction
├── CNAME                                 # Custom domain file
├── README.md                             # Existing shorter prototype README
├── README_BEATMONDO_CURRENT_STATE.md     # This current-state technical source document
├── BEATMONDO_PRODUCTION_GAP_ANALYSIS.md  # Production-gap summary document
├── design-qa.md                          # Prior product-design QA evidence
├── docs/                                 # Built static site output, committed for GitHub Pages
├── index.html                            # Vite HTML entry
├── package.json                          # Scripts and dependencies
├── public/
│   ├── CNAME
│   └── assets/
│       ├── artists/                      # The SMYRK and Slambovian supplied media
│       ├── audio/previews/               # Protected preview audio files
│       ├── auth/                         # Social sign-in logos
│       ├── editorial/                    # Editorial imagery
│       ├── footer/                       # Footer animated beatmondo logo video
│       ├── hero/                         # Smyrk live-to-record hero footage and poster
│       └── beatmondo-logo.png
├── product-design-audits/                # Screenshot/audit artifacts from earlier design QA
├── src/
│   ├── App.jsx                           # Main SPA, route registry, public pages, buyer/artist/admin pages, mini-player
│   ├── main.jsx                          # Password gate, React mount, imports global CSS
│   ├── styles.css                        # Base global styling and responsive behavior
│   ├── premium-skin.css                  # Premium visual refinements
│   ├── analytics/                        # Browser-side reporting data, service, module, CSS
│   ├── audit/                            # Simulated append-only audit evidence module
│   ├── auth/                             # Demo authentication, users, route context, auth UI
│   ├── contracts/                        # Contract/e-signature simulation
│   ├── delivery/                         # Secure delivery simulation
│   ├── email/                            # Email/in-app notification simulation
│   ├── expiring-access/                  # Temporary token/access simulation
│   ├── ingestion/                        # Track submission and ingestion workflow simulation
│   ├── licences/                         # Licence generation simulation
│   ├── membership/                       # Membership billing/access-tier simulation
│   ├── payments/                         # Licensing payment simulation
│   ├── permissions/                      # Richer admin RBAC simulation
│   ├── previews/                         # Watermarked preview simulation
│   ├── privacy/                          # Compliance/privacy simulation
│   ├── quotes/                           # Quote calculation/approval simulation
│   ├── rights/                           # Rights database simulation
│   ├── search/                           # Search/filtering simulation
│   ├── storage/                          # File storage/streaming policy simulation
│   ├── ui/                               # Shared section/account nav components
│   └── verification/                     # Buyer verification simulation
└── vite.config.mjs                       # Vite config, output to docs/
```

## 7. Pages & Routes

Routing is hash-based. A route such as `/#admin-rights` is represented internally as view `admin-rights`.

| Route/view | Page name | Intended user | Purpose | Status |
| --- | --- | --- | --- | --- |
| `home` | Home | Public/all | Brand, hero video, investor strip, tiers, use cases, featured tracks. | Real frontend, strategic content. |
| `catalog` | Explore Music | Public/buyers | Buyer discovery experience. | Local filter/search over mock tracks. |
| `search`, `search-saved`, `search-recent`, `search-collections` | Music Search family | Public/buyers/internal | Search, saved searches, recent searches, search collections. | Local search service. |
| `usecases` | Use Cases | Public/buyers | Commercial use-case discovery. | Frontend content. |
| `track` / `track/:id` | Track Detail | Public/buyers | Track metadata, preview, rights/delivery summary, license CTA. | Frontend; seeded data. |
| `artist` | Artist Profile | Public/buyers/artists | Artist story/media/track links. | Frontend; seeded artists. |
| `legacy` | Gary Burke Legacy | Public/all | Brand/history/editorial archive. | Frontend content. |
| `licensing`, `licensing/request`, `licensing/access` | Licensing / Access | Public/buyers | Request access or request license. | Frontend form and local drafts. |
| `buyer`, `project` | Buyer Dashboard / Project Detail | Buyers | Saved tracks, projects, verification, commercial actions. | Frontend with simulated records. |
| `buyer-verification`, `admin-verifications`, `admin-verification-detail` | Buyer Verification | Buyers/admin | Buyer application and admin review. | Local workflow simulation. |
| `membership*`, `billing*`, `admin-memberships`, `admin-membership-detail` | Membership/Billing | Buyers/admin | Plans, checkout, invoices, payment methods, subscription management. | Simulated billing. |
| `buyer-quotes`, `buyer-quote`, `quote-print`, `admin-quotes*`, `admin-pricing-rules` | Quotes | Buyers/internal | Quote list/detail/print, calculations, approvals, pricing rules. | Simulated quote ledger. |
| `buyer-contracts`, `buyer-contract`, `signature*`, `contract-print`, `admin-contracts*` | Contracts & E-Signature | Buyers/internal | Contracts, templates, clauses, signatures, approvals. | Simulated e-signature. |
| `buyer-payments*`, `payment-receipt`, `admin-payments*`, `admin-refunds`, `admin-credits` | Licensing Payments | Buyers/finance/admin | Invoices, checkout, authentication, success/failure, receipts, reconciliation, refunds, credits, analytics. | Simulated payments. |
| `buyer-licences*`, `licence-print`, `admin-licences*` | Licences | Buyers/internal | Licence records, documents, generation, issue, amendments, renewals, analytics. | Simulated licence generation. |
| `buyer-deliveries*`, `admin-deliveries*` | Secure Delivery | Buyers/internal | Delivery packages, rooms, release gates, sessions, replacements, analytics. | Simulated delivery. |
| `admin-rights*`, `artist-rights` | Rights Database | Artists/internal | Rights queue, track rights, parties, documents, reviews, disputes, expiring rights, artist-safe summaries. | Simulated rights database. |
| `artist-dashboard`, `artist-submissions`, `artist-submission-new`, `artist-submission-detail` | Artist Workspace / Ingestion | Artists/internal | Submission wizard and review workspace. | Simulated upload/ingestion. |
| `admin-ingestion*` | Track Ingestion | Internal | Internal queue, draft, review, processing jobs, publication. | Simulated. |
| `admin-storage*`, `artist-files`, `buyer-media-access` | File Storage & Streaming | Internal/artists/buyers | Asset browser, policy decisions, processing, access logs, usage, scoped file views. | Simulated storage; static public assets only. |
| `admin-previews*`, `artist-previews`, `buyer-private-previews` | Watermarked Previews | Internal/artists/buyers | Preview variants, policies, generation jobs, access/sessions. | Simulated. |
| `admin-expiring-access*`, `access/:token` | Expiring Access | Internal/buyers | Temporary stream/download/document/upload/sign tokens. | Simulated tokens/hashes. |
| `admin-audit*` | Audit Logging | Internal | Audit evidence, security, exports, retention, analytics. | Browser-side audit simulation. |
| `notifications`, `settings/notifications`, `email/message`, `admin/email*` | Email & Demo Messages | Users/internal | Message center, templates, queue, triggers, preferences, failures, analytics. | Simulated; no delivery. |
| `admin/access*` | Admin Permissions | Security/internal | RBAC users, roles, permissions, grants, denials, temporary access, delegations, impersonation, reviews, conflicts. | Client-side RBAC simulation. |
| `admin/analytics*`, `admin/reports*`, `buyer/analytics`, `artist/analytics` | Analytics & Reporting | Internal/buyers/artists | Dashboards, reports, builder, scheduled reports, exports. | Browser aggregation simulation. |
| `settings/privacy`, `privacy/request*`, `admin/privacy*` | Compliance & Privacy | Users/privacy/legal/security | Notices, consents, requests, inventory, retention, holds, vendors, incidents, assessments, exports. | Simulated compliance workflow. |
| `content`, `stories`, `media`, `merchandise`, `contact`, `investor`, `system` | Editorial/Other | Public/internal | Editorial Hub, Stories, Media Episodes, Merchandise, Contact, Investor Overview, Design System. | Frontend content/placeholders. |
| `login`, `register`, `signup`, `forgot`, `reset-password`, `verify-email`, `mfa`, `account-*`, `session-expired`, `access-denied`, `profile`, `security`, `admin-users` | Auth/account | Users/admin | Auth and account state flows. | Demo auth. |

## 8. Components

Major reusable or important components include:

- `PasswordGate` in `src/main.jsx`: private preview gate using `sessionStorage`.
- `App` in `src/App.jsx`: central SPA state, route rendering, audio element, modal/player orchestration.
- `Sidebar`, `Topbar`, `PublicHeader`, `Footer`: global navigation/shell.
- `MiniPlayer`: fixed protected-preview transport using the shared audio element and simulated stream sessions.
- `TrackRow`, `TrackCard`, `TrackSidePanel`, `TrackDetail`, `AssetBadges`: discovery and track UI.
- `ArtistProfile`, `ArtistDashboardPage`: artist surfaces.
- `InquiryForm`, `InquiryModal`, `LicensingAccess`, `ConfirmationScreen`: licensing/access forms.
- Domain module renderers: `renderVerificationView`, `renderMembershipView`, `renderRightsView`, `renderSearchView`, `renderIngestionView`, `renderStorageView`, `renderWatermarkedPreviewView`, `renderQuoteView`, `renderContractsView`, `renderPaymentView`, `renderLicenceView`, `renderSecureDeliveryView`, `renderExpiringAccessView`, `renderAuditView`, `renderEmailView`, `renderPermissionsView`, `renderAnalyticsView`, `renderPrivacyView`.
- Shared nav components: `SectionSubnav` and `AccountSettingsNav`.

## 9. Data Model

No real persisted server-side models exist. The repository contains frontend mock/conceptual entities in JavaScript arrays and local storage states.

| Entity | Where represented | Implementation status |
| --- | --- | --- |
| User | `src/auth/mockAuthData.js`, permissions/auth services | Seeded mock users with plaintext demo passwords. |
| Organization | `src/auth/mockAuthData.js` | Seeded mock organizations. |
| Buyer | User records with buyer roles; buyer verification, membership, quote/payment/delivery records | Mock/browser state. |
| Artist/rightsholder | Artist user and hardcoded artist list in `App.jsx`; rights parties | Mock/browser state. |
| Track | `tracks` in `App.jsx`; rights/search/storage references | Hardcoded frontend objects. |
| Catalog/collections | `collections` and `useCases` in `App.jsx`; search collections | Hardcoded/mock state. |
| Rights holder/party | `RIGHTS_PARTIES` in `rightsData.js` | Mock rights parties. |
| Master right | `masterRights` in rights records | Mock with owner percentages/evidence. |
| Composition right | `compositionRights` in rights records | Mock writer shares/PRO/IPI. |
| Publisher | `publishingRights.publishers` | Mock publisher shares. |
| Writer/composer | `compositionRights.writers` | Mock writer shares. |
| License request | `beatmondo-license-submissions` in `App.jsx`; quotes references | Local form submission records. |
| Quote | `src/quotes/quoteData.js` | Simulated quote records/calculations. |
| Contract | `src/contracts/contractData.js` | Simulated contract records, templates, clauses, signatures. |
| Payment | `src/payments/paymentData.js` and membership billing data | Simulated transactions/invoices/refunds/receipts. |
| Delivery asset/package | `src/storage`, `src/delivery`, `src/licences` | Simulated asset metadata/packages/entitlements. |
| Membership | `src/membership/membershipData.js` | Simulated memberships/plans/invoices/payment methods. |
| Analytics event | `src/analytics/analyticsData.js` plus module activity arrays | Seeded/derived mock events. |
| Audit event | `src/audit/auditData.js` and `auditService` | Browser-side audit simulation, not tamper-proof. |
| Email/message | `src/email/emailData.js`, auth messages | Simulated queue/templates/messages. |
| Privacy request/consent/vendor | `src/privacy/privacyData.js` | Simulated compliance records. |
| Temporary access token | `src/expiring-access` | Simulated token/hash/session state. |

## 10. Rights & Licensing Architecture

Current rights implementation is unusually detailed for a prototype but remains entirely fabricated demo data. The file header in `src/rights/rightsData.js` explicitly says all rights, party, contract, document, dispute, and clearance data is fabricated and does not confirm legal ownership.

Implemented concepts:

- Master ownership status, owners, ownership percentages, evidence documents, restrictions.
- Composition rights with writers, writer shares, PRO affiliations, IPI/CAE identifiers, publisher links.
- Publishing rights with publishers, publisher shares, territories, verification status.
- Sample/third-party clearance records and statuses.
- Territory inclusions/exclusions/conflicts.
- Approval requirements and reviewers.
- Completeness scoring and missing-section/blocker/warning detection.
- Licensing eligibility calculation, buyer-safe summary wording, manual review flags, allowed assets, restrictions.
- Version snapshots and historical licence-rights linkage concepts.
- Disputes, expiring review, documents requested, restricted/manual review states.

Not implemented for production:

- No authoritative rights database.
- No document upload/storage verification.
- No legal review workflow service.
- No external PRO/publisher/label integration.
- No enforceable ownership certification.
- No real contract authority or licensing eligibility engine.
- No territory/legal-rule system beyond seeded fields.

## 11. Payments & Commercial Flow

There are two separate payment simulations:

- Membership billing in `src/membership`.
- Licensing payments in `src/payments`.

Licensing payments include invoices, obligations, transactions, attempts, receipts, reconciliation records, credits, refunds, payment analytics, card checkout, PayPal simulation, bank-transfer proof/reconciliation, and crypto placeholder. The code stores provider-like references such as `mock_provider_*`, `mock_paypal_*`, and `mock_crypto_provider_*`. Card data handling stores only mock last-four metadata in records, but the form accepts typed test card numbers in the browser. Crypto is explicitly a provider-selection placeholder with Coinbase Commerce as an example only.

Actual integrations: none.

Missing production capabilities:

- Payment processor integration.
- PCI-compliant card handling/tokenization.
- Bank transfer rails and reconciliation.
- PayPal live provider flow.
- Crypto provider, KYC/AML/tax/legal approval.
- Tax calculation and invoice compliance.
- Marketplace split payments, settlement, payout, withholding, statements.
- Revenue recognition/accounting integration.
- Chargeback/dispute workflows.
- Secure receipts and tax documents.

## 12. Media & File Architecture

Real static media in `public/assets` includes:

- Hero video/poster for Smyrk live-to-record.
- Footer beatmondo logo animation.
- The SMYRK artist images and preview audio (`.wav`, `.m4a`).
- Slambovian images, videos, captions, and audio extract (`.wav`, `.m4a`).
- Editorial images and auth provider icons.

Simulated media/file systems include:

- Storage classes: public media, protected previews, private masters, private stems, rights documents, commercial documents, temporary processing, archive.
- Asset metadata, storage references such as `storage://...`, checksums, versions, status, access policy, processing info.
- Preview sessions, signed access records, playback history, access logs.
- Watermarked preview variants/policies/jobs/sessions.
- Expiring access tokens and hash placeholders.
- Secure delivery packages, entitlements, manifests, download sessions and limits.

There is no real object storage, private bucket, CDN, signed URL service, transcoding pipeline, waveform generator, watermark generation, malware scanning, or secure download transfer.

## 13. Authentication & Security

Current auth/security implementation:

- Site password gate in `src/main.jsx`.
- Optional `VITE_SITE_PASSWORD`; fallback password is hardcoded as `circusboy`.
- Demo auth state stored under `beatmondo-auth-demo-v1`.
- Session state stored under `beatmondo-auth-session-v1`.
- Pending MFA state stored under `beatmondo-auth-pending-mfa-v1`.
- Demo users and plaintext passwords are in `src/auth/mockAuthData.js`.
- MFA demo code is `246810`.
- Contract signature QA code is `864209`.
- Route checks are performed in `getRouteDecision` and richer RBAC checks are performed in `authorizationService`.
- Security/account pages allow simulated profile edits, password reset, MFA toggle, sessions, account status, admin user management.

Production blockers:

- Plaintext passwords in source.
- Client-side auth and authorization only.
- Browser storage sessions/tokens.
- No identity provider or server session validation.
- No secure cookies, CSRF protection, server-side rate limiting, bot protection, password hashing, audit-grade logging, secrets management, or MFA provider.
- No backend policy enforcement before private data reaches the client.
- Site password gate is not meaningful security for production.

## 14. Environment Variables

| Variable | Referenced in | Purpose | Required? |
| --- | --- | --- | --- |
| `VITE_SITE_PASSWORD` | `src/main.jsx`, `.env.example`, `README.md` | Overrides the private site password gate. | Optional for prototype; production should not rely on this gate. |

No other `import.meta.env`, `process.env`, `VITE_*`, or `REACT_APP_*` environment references were found in the authored repository.

## 15. Installation & Local Development

Prerequisites:

- Node.js 20 is used by the GitHub Actions workflow.
- npm.

Install:

```bash
npm install
```

Optional environment:

```bash
cp .env.example .env.local
# edit VITE_SITE_PASSWORD if desired
```

Run locally:

```bash
npm run dev
```

The `dev` script runs:

```bash
vite --host 127.0.0.1
```

Typical local URL:

```text
http://127.0.0.1:5173/
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Lint/test:

No lint or test scripts are defined in `package.json`.

## 16. Deployment

Current deployment setup:

- `vite.config.mjs` sets `build.outDir` to `docs`.
- `.github/workflows/deploy.yml` runs on pushes to `main` except changes under `docs/**`.
- Workflow steps: checkout, setup Node 20, `npm ci`, `npm run build`, commit built `docs/`, push.
- `docs/.nojekyll`, `CNAME`, and `docs/CNAME` indicate GitHub Pages-style static hosting with a custom domain.

Build command:

```bash
npm run build
```

Output directory:

```text
docs/
```

This is static-site deployment only. It cannot host production backend/API/database/payment/storage services by itself.

## 17. Testing

Current tests:

- No automated unit, integration, or E2E test files were found.
- No `test`, `lint`, `typecheck`, or `e2e` scripts exist in `package.json`.
- Existing QA evidence exists in `design-qa.md` and `product-design-audits/`, but these are manual/screenshot artifacts, not automated tests.

Required before production:

- Unit tests for domain rules: rights eligibility, quote calculations, contract readiness, payment allocation, licence issuance, delivery release gate, expiring access, RBAC, privacy exports/deletion handling.
- Integration tests across buyer/commercial workflows.
- E2E tests for public, buyer, artist, admin, security, payment, contract, delivery, and privacy flows.
- Accessibility tests.
- Responsive visual regression tests.
- Security tests, authorization tests, and audit integrity tests.
- Backend/API tests once production architecture exists.

## 18. Known Technical Debt / Gaps

- Frontend-only prototype; no backend.
- No real database or durable multi-user persistence.
- Browser `localStorage` is the primary state store.
- Demo auth uses plaintext passwords in source.
- Site password fallback is hardcoded.
- MFA and e-signature verification codes are hardcoded demo values.
- RBAC is enforced in the client, so restricted data can still be shipped to the browser.
- No server-side authorization, policy engine, or field-level response filtering.
- No real file upload, private asset storage, secure streaming, signed URLs, CDN, watermarking, transcoding, waveform extraction, virus scanning, or delivery.
- No real payments, membership billing, licensing payment processing, bank reconciliation, refunds, tax, marketplace payout, settlement, or accounting.
- No production rights database, rights-party verification, document evidence vault, legal review system, or authoritative licensing eligibility.
- No real contract generation service, legal templates workflow, certified e-signature provider, identity verification, or document vault.
- No real licence issuance authority or legally binding document generation.
- No real email/SMS/push provider, background queue, retry worker, or notification audit delivery.
- No production analytics pipeline, event collection, warehouse, BI, monitoring, or reporting scheduler.
- No privacy/compliance backend, data discovery, export/deletion job system, legal hold enforcement, or vendor/compliance evidence.
- No CI checks beyond build.
- No automated tests.
- No i18n/multilingual implementation.
- Remote Unsplash imagery is referenced from `App.jsx`, creating external dependency/licensing/performance/privacy considerations.
- Built output in `docs/` is committed, which is fine for Pages deployment but creates generated artifact churn.
- Many modules are large and dense; several service files encode business rules directly in frontend JavaScript.
- No TypeScript/schema validation.
- No error monitoring, logging, secrets management, rate limiting, WAF, backup/restore, disaster recovery, or operational runbooks.

## 19. Production Readiness Assessment

Scores: 0 = absent, 5 = production-ready.

| Area | Score | Justification |
| --- | ---: | --- |
| UX/UI | 4 | Broad, polished prototype with responsive design and coherent premium positioning; needs usability/accessibility validation and production hardening. |
| Frontend | 3 | React/Vite SPA is functional and reusable, but code is large, frontend-only, untyped, minimally tested, and not integrated with APIs. |
| Backend | 0 | No backend exists. |
| Database | 0 | No production database exists. |
| Authentication | 1 | Demo auth exists, but it uses plaintext seeded passwords and browser sessions. |
| RBAC | 2 | Domain-rich RBAC model exists, but only client-side and not consistently unified. |
| Rights management | 2 | Strong conceptual data/workflow model, but fabricated and browser-only. |
| Licensing workflow | 2 | End-to-end simulated flow exists, but no enforceable backend or legal authority. |
| Contracts | 2 | Detailed simulated templates/signatures/versioning; no legal/e-sign provider integration. |
| Payments | 1 | Detailed simulations; no live processor, compliance, settlement, tax, or payout logic. |
| Settlements | 0 | No rightsholder/marketplace settlement or payout system. |
| Media storage | 1 | Static assets and simulated storage metadata only. |
| Secure delivery | 1 | Detailed delivery state model, but no real secure transfer. |
| Analytics | 2 | Browser aggregation model exists; no real instrumentation/warehouse/report runner. |
| Admin operations | 3 | Very broad admin UI simulation; no operational backend or jobs. |
| Infrastructure | 1 | Static GitHub Pages-style deployment only. |
| Security | 0 | Production security is not present; current secrets/auth/storage are demo-only. |
| Testing | 0 | No automated tests/scripts. |
| Internationalization | 0 | No i18n implementation. |
| Compliance readiness | 1 | Compliance workflows are modeled, but not legally or technically enforceable. |

## 20. What Must Be Built to Go Live

### Must-have before launch

- Production backend/API architecture.
- Production database with schema, migrations, backups, access controls.
- Server-side authentication, authorization, RBAC, sessions, MFA, account lifecycle.
- Secure media storage, preview streaming, signed URL/session service, protected master/stem delivery.
- Real upload, processing, validation, scanning, transcoding, waveform, preview/watermark generation.
- Production rights database and rights review workflow.
- Quote, contract, licence, delivery state machines backed by server policies.
- Legal contract generation and certified e-signature provider integration.
- Payment processing for licensing and membership, tax handling, refunds, receipts, reconciliation.
- Marketplace payout/settlement model if rightsholder revenue sharing launches.
- Audit logging service with tamper-evident storage and redaction.
- Email/notification provider and background job queue.
- Automated tests and CI/CD gates.
- Security review, threat model, secrets management, monitoring, incident response.

### Important before launch

- Production search service and indexing pipeline.
- Analytics event collection and warehouse/reporting.
- Admin usability and operations runbooks.
- Privacy/compliance workflows backed by real data inventory/export/deletion/retention/legal hold systems.
- Accessibility audit and remediation.
- Internationalization architecture if launching globally.
- Content/media licensing review for all public assets and external images.
- Observability, dashboards, alerts, SLOs.

### Can follow after launch

- Advanced recommendations/AI insights.
- Expanded merchandise operations.
- Advanced investor/partner reporting.
- Richer multilingual content packs.
- Advanced buyer collaboration tools.
- Deeper CRM/marketing automation integrations.
- Native mobile apps.

## 21. Suggested Production Architecture

| Layer | Recommendation |
| --- | --- |
| Frontend | Preserve React UI, migrate route/state boundaries toward API-backed data, add TypeScript or schema validation, component tests, E2E coverage. Consider React Router or framework routing if needed. |
| Backend | Node/NestJS, Django, Rails, or similar modular API. Separate bounded contexts: Identity, Catalog, Rights, Licensing, Quotes, Contracts, Payments, Delivery, Media, Notifications, Analytics, Admin. |
| Database | PostgreSQL primary relational store with migrations, row-level/tenant-aware access patterns, audit tables, immutable historical snapshots. |
| Authentication | Auth0, Clerk, WorkOS, Cognito, or custom hardened auth with MFA, SSO for enterprise, secure cookies, session rotation, device/session management. |
| Authorization | Server-side policy engine with role assignments, scopes, explicit denials, temporary elevations, approval limits, impersonation controls, field-level redaction. |
| Media storage/CDN | S3/GCS/Azure Blob private buckets, CloudFront/Cloud CDN, short-lived signed URLs, streaming sessions, KMS, asset versioning, malware scanning, transcoding queue. |
| Search | OpenSearch/Elasticsearch/Meilisearch/Algolia with visibility-aware indexing and query-time permission filtering. |
| Payments | Stripe or Adyen for cards/subscriptions; PayPal if required; bank transfer reconciliation; Coinbase/crypto only after legal/tax/KYC approval. |
| Marketplace payments | Stripe Connect/Adyen for Platforms or dedicated ledger/payout partner; implement rightsholder splits, statements, tax forms, holds, refunds, chargebacks. |
| Rights management | Structured rights DB, document vault, review queues, workflow approvals, versioned eligibility decisions, rights-party contacts with restricted visibility. |
| Contract/e-sign | Contract generation service from approved templates and immutable quote/rights snapshots; DocuSign/Adobe Sign/Dropbox Sign integration; secure document vault. |
| Notifications | Transactional email provider such as SendGrid/Postmark/AWS SES, template approval, queue, retries, webhooks, quiet hours/preferences. |
| Analytics | Event pipeline, warehouse, BI dashboards, permission-aware reporting, scheduled exports. |
| Logging/monitoring | OpenTelemetry, structured logs, Sentry, Datadog/Grafana, audit log store, alerting. |
| Security | Secrets manager, WAF/rate limits, encryption at rest/in transit, KMS, vulnerability scanning, dependency scanning, pen test, incident response. |
| CI/CD | Build, lint, test, typecheck, E2E, preview environments, deploy approvals, migrations, rollback. |

## 22. Estimated Production Workstreams

| Workstream | Scope | Dependencies | Complexity | Parallel? |
| --- | --- | --- | --- | --- |
| Product/Domain Finalization | Lock launch scope, legal/commercial workflows, roles, data ownership, go-live countries. | Stakeholder/legal decisions. | High | Starts immediately; informs all streams. |
| Backend Platform | API framework, auth integration, database, services, jobs, admin APIs. | Architecture decisions. | Very High | Parallel with frontend once contracts are defined. |
| Data Modeling & Migration | Convert mock entities into normalized schemas and seed/migration strategy. | Backend architecture, domain finalization. | Very High | Parallel with backend design. |
| Auth/RBAC/Security | Identity, MFA, sessions, server-side authorization, scopes, impersonation, audit. | Backend/database. | Very High | Critical path. |
| Catalog/Search | Track/artist/catalog APIs, search indexing, visibility filtering, saved searches. | Data model, auth/RBAC. | High | Parallel after auth contract. |
| Rights Management | Rights records, parties, documents, reviews, eligibility engine, legal evidence. | Data model, legal rules. | Very High | Critical path. |
| Media Pipeline | Uploads, storage, scanning, transcoding, previews, waveform, watermarking, streaming. | Storage provider, backend, rights rules. | Very High | Critical path. |
| Licensing/Quotes | Licensing request lifecycle, pricing rules, approval workflow, buyer-safe quote views. | Rights, RBAC, payments/contracts. | High | Parallel with contracts/payments after data contracts. |
| Contracts/E-Sign | Template governance, generation, e-sign provider, document vault, version snapshots. | Quotes, rights, legal. | Very High | Critical path. |
| Payments/Billing/Settlement | Membership billing, licensing invoices, payment processing, tax, refunds, credits, payouts. | Legal/tax/provider decisions. | Very High | Critical path. |
| Licence & Delivery | Licence issuance, delivery authorization, entitlements, secure download sessions. | Rights, contracts, payments, media. | Very High | Depends on several critical streams. |
| Notifications | Email templates, queue, provider, webhooks, preferences. | Backend/user/commercial events. | Medium | Parallel. |
| Analytics/Reporting | Instrumentation, warehouse, dashboards, exports. | Event model, backend data. | High | Parallel but needs source systems. |
| Privacy/Compliance | Notices, consent, DSAR, retention, legal holds, vendor records. | Legal/privacy decisions, data inventory. | High | Parallel. |
| Frontend Integration | Replace local services with APIs, harden routing, loading/errors, accessibility. | Backend API contracts. | High | Parallel by module. |
| QA/Testing/Release | Test strategy, automation, E2E, performance, security testing, UAT, launch readiness. | All production systems. | High | Starts early, intensifies late. |

## 23. 6-Month Delivery Feasibility

With a larger, well-resourced team, six months is technically possible for a controlled first commercial launch only if scope is tightly managed and legal/commercial decisions start immediately. It is not realistic to launch the full global platform implied by every prototype surface at production depth in six months without major risk.

Critical path:

1. Production architecture, domain model, and launch-scope lock.
2. Auth/RBAC/security foundation.
3. Catalog/search plus rights database.
4. Media storage/preview/upload/delivery pipeline.
5. Quote, contract/e-sign, payment, licence, delivery chain.
6. Audit, notifications, privacy, observability, testing.

Highest-risk areas:

- Rights verification and legal eligibility.
- Secure media delivery and preview protection.
- Payments, tax, refunds, settlement, marketplace payouts.
- Contract/e-sign legal enforceability.
- Server-side authorization and audit.
- Scope creep from the prototype's very broad admin surface.

Must start immediately:

- Legal/commercial process mapping.
- Data model and system architecture.
- Provider selection for auth, storage/CDN, payments, e-sign, email.
- Security/threat model.
- Rights and media pipeline design.
- Test strategy.

Likely bottlenecks:

- Legal and rights data validation.
- Payment/tax/marketplace compliance.
- Secure media handling.
- Integrating provider webhooks and state machines.
- Migrating broad frontend mock services to real APIs.

## 24. Executive Technical Summary

Today, beatmondo is a polished, strategically rich React/Vite prototype. It demonstrates the intended buyer, artist, and admin experience across music discovery, rights review, licensing, quotes, contracts, payments, licence generation, secure delivery, analytics, privacy, audit, and communications.

What is already valuable: the product vision is unusually concrete; the UI and workflow model give a strong blueprint for a premium sync licensing platform; many domain boundaries and state transitions are already thought through.

What still needs to be built: the entire production platform behind the UI, including backend, database, secure auth/RBAC, media infrastructure, rights evidence, contracts/e-sign, payments, settlement, audit, notifications, analytics, compliance, monitoring, and tests.

The current prototype is reusable as a product and frontend foundation, but it must be re-platformed around server-enforced APIs and production services before handling real users, rights, money, contracts, or protected audio.

Six months is technically achievable only for a focused first launch with a senior, well-funded team and disciplined scope. The biggest production risks are rights/legal certainty, secure media delivery, payments/settlement/compliance, server-side authorization, and the complexity of converting a broad browser simulation into a reliable commercial operating platform.
