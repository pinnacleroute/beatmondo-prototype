# Track Ingestion QA Report

Date: 16 July 2026  
Environment: local Vite development server and in-app Chromium browser

## Verified workflows

- Eight seeded records render across the primary ingestion states.
- Queue metrics, status filter, search, review links, and readiness summaries work.
- Failed audio processing exposes a retry; retry queues the job; completing all jobs generates a fixed-value waveform and advances to Technical Review.
- Unsupported FLAC is rejected with a safe format message.
- A 16-bit replacement creates version 2 and preserves the superseded version internally.
- Publication readiness blocks direct Technical Review → Approved transitions.
- Awaiting Approval supports approval with restrictions, publication, unpublishing with preserved licences, and archive.
- Admin revision requests appear in the artist workspace; the artist can respond and resubmit.
- Artists see only their own organization’s submission and no internal notes.
- Artist drafts retain title, metadata, assets, step, and contributors after refresh.
- The wizard accepts a valid master, creative metadata, contributor, draft rights declaration, artwork, instrumental lyrics state, delivery declaration, legal declarations, and creates a reference on submission.
- Draft rights warnings respond to incomplete master and writer percentages without marking rights verified.
- Public search excludes all ingestion-linked processing, incomplete, revision, failed, and awaiting-approval tracks.
- Media Operations can manage processing jobs but receives a permission denial when attempting final approval.
- Super-administrator reset restores the deterministic seed.

## Responsive coverage

The dashboard and wizard were exercised at 320, 375, 768, 1024, and 1440 px. Metrics and forms stack, wizard navigation becomes horizontally scrollable, tables retain contained scrolling, review panels remain usable, and the page introduces no body-level horizontal overflow.

## Regression coverage

Authentication, Buyer Verification, Membership Billing, Rights Database, Search Infrastructure, and the existing public/product routes were smoke-tested after integration. The production build passes; Vite retains its non-blocking main-chunk size advisory.

## Security boundary

No displayed processing result represents a real scan, audio analysis, secure upload, private storage, transcode, waveform, watermark, or publication pipeline. Production enforcement must occur server-side before protected assets or unpublished metadata are exposed.
