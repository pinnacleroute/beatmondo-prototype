# Legacy Archive Milestones Audit

## Scope

- Surface: Gary Burke Legacy page — Archive Milestones / Historical Timeline panel.
- Desktop evidence: `01-desktop.png`.
- Mobile evidence: `02-mobile.png`.
- Goal: make four milestones easy to scan while preserving the dark archival visual system.

## Findings

1. **P1 — Timeline content exceeds its panel height.** The timeline uses `min-height: calc(100% - 8px)` beneath a separate panel header while the panel itself is forced to `height: 100%`. In the measured desktop state, the timeline bottom extends roughly 14 px beyond the grid panel boundary; the mobile layout shows the same structural pressure.
2. **P2 — The visual spine is fragmented.** Each milestone draws its own border segment, so the timeline reads as four independent callouts rather than one chronology.
3. **P2 — Date and event hierarchy are merged.** Year and milestone title share one bold string, slowing year-based scanning and producing awkward wrapping at narrower widths.
4. **P2 — Vertical spacing is controlled by `justify-content: space-between`.** Milestone gaps depend on the neighboring biography height instead of the timeline content, producing inconsistent rhythm and excessive separation.
5. **P2 — Header metadata becomes cramped on mobile.** “Historical Timeline” competes horizontally with the main panel title instead of acting as quiet supporting context.
6. **P2 — Supporting copy is visually subdued.** Body text is readable in the capture but sits close to the low-contrast end of the palette; code-level contrast measurement is still required.

## Recommendations

1. Replace the forced-height flex layout with an intrinsic ordered list and consistent 26–30 px item gaps.
2. Draw one continuous spine on the timeline container; position each milestone marker against that shared spine.
3. Split each milestone into a year, title, and description. Use a compact year column on desktop and stack the year above the title on small screens.
4. Let the timeline panel size to its own content. Keep the biography and timeline top-aligned rather than forcing equal heights.
5. Stack the panel header label beneath the title on mobile or reduce it to a small uppercase eyebrow.
6. Raise description contrast slightly and maintain a 1.55–1.65 line height.
7. Use muted gold for historical markers and Gary Burke red only for the current 2026 milestone, reinforcing chronology without adding decorative clutter.
8. Use semantic `ol` and `li` elements so assistive technologies announce the timeline as an ordered sequence.

## Evidence limits

- Screenshots and DOM measurements confirm layout pressure and responsive wrapping.
- Full WCAG contrast compliance and screen-reader announcement quality require implementation-level testing after the redesign.
