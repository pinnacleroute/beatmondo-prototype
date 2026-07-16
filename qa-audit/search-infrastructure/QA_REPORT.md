# Search Infrastructure QA Report

Date: 16 July 2026  
Environment: local Vite development server and in-app Chromium browser

## Functional coverage

- Exact-title search returns Golden Hours first and alone.
- Artist, genre, mood, usage, instrumentation, and metadata tokens are indexed.
- Typo query `cinamatic` displays the cinematic correction and original-query option.
- Synonym expansion and deterministic natural-language interpretation render removable chips.
- Suggestions are grouped and expose combobox/listbox semantics.
- Recent and saved searches persist per account; duplicate, delete, run, and simulated-new-match controls render.
- Creative, BPM, duration, vocal, language, asset, rights, access, territory, saved-only, and internal filters are wired through the central service.
- Grid and list layouts persist per user.
- Comparison supports selecting up to three tracks before opening the comparison tray.
- Project search applies an Automotive + Professional/VIP context and returns an accessible shortlist.
- Similar-track results use the same visibility service as primary search.
- Curated collections and Northstar-only VIP collections render only in the correct context.
- Search index health, metadata quality, hiding/refreshing, synonym groups, ranking sliders, analytics, rebuild, and reset controls render and persist.

## Visibility and regression coverage

- Public context returned three public records and did not expose The SMYRK, VIP facets, VIP titles, or private counts in suggestions.
- Discovery buyer returned eight accessible records, including allowed Discovery content but excluding Professional/VIP titles and facets.
- VIP buyer returned 18 rights-eligible or reviewable accessible records and all three Northstar private collections.
- Artist context included The End of Jason Todd, excluded VIP Golden Hours, and excluded search-admin navigation.
- Direct artist access to `#admin-search` returned Access Denied.
- Super-administrator MFA and Search Infrastructure access passed.
- Authentication, Buyer Verification, Membership Operations, and Rights Database admin routes still rendered after integration.

## Responsive coverage

Search was exercised at 320, 375, 768, 1024, and 1440 px. The mobile filter drawer exposes a clear heading and close controls; result layouts stack; comparison uses stacked cards; admin tables retain contained scrolling; and the page does not introduce body-level horizontal overflow.

## Build

`npm run build` passes. Vite continues to emit a non-blocking advisory for the large main JavaScript chunk.

## Security boundary

The browser-side visibility service is suitable only for prototype behavior. Production authorization and private-catalog isolation must be enforced before records enter a client-visible response, suggestion set, facet count, or analytics payload.
