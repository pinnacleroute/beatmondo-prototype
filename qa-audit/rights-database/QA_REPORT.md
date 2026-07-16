# Rights Database QA Report

Date: 16 July 2026  
Environment: local Vite development server, in-app Chromium browser

## Result

The module passed its primary functional, permission, integration, and responsive smoke tests. The production build also completes successfully. Vite reports only the existing advisory that the main JavaScript chunk exceeds 500 kB.

## Verified workflows

- Logged-out access to the admin rights route redirects to login without rendering rights data.
- Super-administrator login and MFA open the Rights Database.
- Queue metrics, search/filter behavior, sample-clearance filter, sorting, track review links, and all seeded status scenarios render.
- Ownership totals validate both under- and over-100% states; valid edits create versions with required reasons.
- Version history compares status, ownership, writer, publisher, territory, restriction, document, and dispute changes.
- Incomplete ownership and checklist items prevent final verification with explicit blockers.
- Document review changes completeness; confidentiality labels and role filtering render.
- Contributors, samples, territories, restrictions, reviewer assignment, checklist persistence, and licensing-impact recalculation work.
- Territory overlap is detected and blocks eligibility.
- Opening a dispute blocks licensing; resolving it preserves the dispute and audit history.
- Reusable rights parties can be created and searched.
- Artist login exposes only The SMYRK's limited record and accepts a correction for human review.
- Direct artist access to the admin rights route returns Access Denied.
- Buyer track detail for a blocked track shows only the buyer-safe summary, locks master/stems, and disables Request License.
- Membership Operations and Verification Queue still render after integration.
- Super-administrator reset restores all deterministic rights seed data.

## Responsive coverage

The Rights Database was exercised at 320, 375, 768, 1024, and 1440 px widths. Controls stack, metrics reflow, and wide data tables retain contained horizontal scrolling. A body-level 320 px minimum-width issue found during QA was removed; the 320 px page no longer overflows horizontally.

## Seed scenarios

- Golden Hours — fully verified / eligible.
- Paper Planes — partial / conditional publishing approval.
- All That Remains — incomplete split / documents requested.
- Midnight Transit — incomplete sample clearance / blocked.
- Glass Cathedral — disputed / blocked.
- Harbor Light — expired review / manual review required.
- The End of Jason Todd — unreviewed / documentation pending, with no invented rights claims.

## Known prototype boundaries

File upload/download, signatures, document analysis, emails, notifications, payment, legal review, and secure delivery are simulations. Browser storage is not secure, concurrent, immutable, or suitable for production rights evidence. No displayed score or status confirms legal ownership.
