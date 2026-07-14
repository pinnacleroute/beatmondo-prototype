# beatmondo Prototype QA Notes

Date: 2026-07-07

## Scope

Complete visual, responsive, route-loading, console, image, overflow, and basic interaction-target QA for the beatmondo prototype.

## Evidence

- Screenshots: `qa-audit/screenshots/`
- Machine-readable route report: `qa-audit/route-report.json`
- Checked viewports: desktop `1440x1000`, mobile `390x844`
- Checked routes: Home, Explore Music, Track Detail, Artist Profile, Gary Burke Legacy, Licensing / Access, Buyer Dashboard, Project Detail, Admin, Editorial Hub, Stories, Media Episodes, Contact, Design System

## Fixes Applied

- Fixed mobile home hero reflow by removing inherited minimum grid width and constraining media/text to the viewport.
- Fixed mobile featured track rows on the home page so waveform, duration, and Request License controls stack within the phone width.
- Hardened tap targets for text-style buttons, chips, project cards, action cards, footer links, and close navigation.
- Added horizontal scroll behavior for Admin tabs on mobile without causing page-level overflow.
- Added box-sizing guards for card/panel surfaces to prevent border math from creating edge overflow.
- Updated hero video autoplay behavior to start muted and unlock audio only after user interaction, removing autoplay console warnings.
- Updated `qa-desktop.mjs` and `qa-mobile.mjs` to use the current local server port and current `Explore Music` nav label.

## Final Results

- `npm run build`: passed
- `node qa-desktop.mjs`: passed with `[]`
- `node qa-mobile.mjs`: passed with `[]`
- Full screenshot audit: 28 route/viewport checks, 0 failures

## Evidence Limits

This QA pass confirms rendered layout, route availability, screenshots, console warnings/errors, broken images, horizontal overflow, unlabeled icon-only buttons, and small visible control bounds. It does not prove full WCAG compliance, screen-reader semantics, real backend behavior, payment/licensing integrations, or production performance under network/device variability.
