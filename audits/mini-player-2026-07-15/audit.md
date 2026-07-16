# beatmondo mini-player audit

Date: 2026-07-15

## Audit scope

The fixed desktop mini-player shown after starting a track preview in Explore Music. The review covers playback clarity, the selected preview range, track identity, hierarchy, and visible accessibility risks.

## User goal and accessibility target

Let an approved buyer understand what is playing, pause or resume quickly, see the protected preview segment, and open track details without the control feeling like a full audio editor.

## Step 1 — Playing a protected preview

Health: Needs improvement

Evidence: `01-desktop-mini-player.jpg`

### Strengths

- Track art, title, artist, and preview-only status stay visible.
- The primary pause control has a generous target and strong contrast.
- The player remains compact and visually consistent with the dark cinematic workspace.

### UX risks

- The white markers look draggable, but the range is decorative. This creates a false editing affordance.
- “CUT TRACK” reads like an action or editing mode rather than a label for the available preview segment.
- The two times appear to be range boundaries, but their meaning is not stated. There is no separate current playback time or full duration.
- The repeated vertical bars resemble a waveform but do not communicate actual audio shape or playback progress.
- The selected red area dominates the rail while the current playhead is absent, so users cannot tell where they are inside the preview.
- “Details” is visually heavier than its secondary role needs.

### Accessibility risks

- The preview strip is exposed only as a generic labelled region, not as a progress bar or slider.
- There is no visible keyboard focus or keyboard operation for scrubbing or range adjustment because the rail is not interactive.
- Small 11px timestamps and low-contrast muted text may be difficult at zoom or for low-vision users.
- Motion and time updates were not present, so live progress announcements and reduced-motion behavior could not be verified.

## Recommended direction

Use a **Preview segment rail**, not a DAW-style trimming control.

1. Rename the center label to **Protected preview** or **Preview segment**.
2. Show current playback time on the left and total preview duration on the right.
3. Add one unmistakable playhead that moves continuously with playback.
4. Show the allowed preview range as a restrained tinted band behind the playhead.
5. Remove the two white handles unless users can genuinely change the range. If trimming is added later, move it to a dedicated detail workspace with semantic dual-range controls.
6. Increase the visual rail height to roughly 40–44px while keeping the overall player compact.
7. Use a real static waveform or a simple amplitude rail; only the playhead/progress should animate.
8. Reduce the Details action to a compact secondary button or chevron-labelled action.
9. Preserve the 42–44px play/pause target, add strong focus rings, and expose elapsed time through an accessible progress element.

## Evidence limits

This audit verifies the visible desktop state and DOM semantics of the current prototype. It does not establish WCAG compliance, color-contrast ratios, screen-reader announcements, touch behavior, or responsive behavior on physical mobile devices.
