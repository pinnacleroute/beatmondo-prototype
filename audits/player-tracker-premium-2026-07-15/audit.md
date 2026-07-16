# beatmondo player tracker visual audit

Date: 2026-07-15

## Audit scope

The full-width Protected Preview progress tracker in its active playback state.

## User goal and accessibility target

Communicate elapsed preview progress immediately, with the restraint and precision expected from premium music-supervision tooling.

## Step 1 — Read active preview progress

Health: Visually weak

Evidence: `01-current-tracker.jpg`

### Strengths

- Played and remaining portions are distinguishable.
- The single playhead communicates direction better than the previous trim handles.
- Timing and protected-preview status remain outside the rail, avoiding label collision.

### UX and visual risks

- Identical full-height bars read as a barcode, equalizer grille, or loading state rather than audio information.
- The dense red-and-gold repetition creates shimmer and visual noise across a very wide surface.
- The played region is overly saturated, while the remaining region has too many bright dividers; neither side recedes gracefully.
- The playhead resembles one more separator because it has no distinct cap or depth treatment.
- The uniform waveform has no amplitude hierarchy, so it communicates no useful audio shape.
- The strong outer border and flat dark fill make the rail feel boxed and mechanical rather than refined.

### Accessibility risks

- Dense alternating vertical contrast can be uncomfortable for users sensitive to visual patterns.
- If the rail remains non-interactive, it must not gain a grab cursor or slider-like hover treatment.
- Screenshot review cannot verify contrast ratios, keyboard behavior, screen-reader updates, or zoom resilience.

## Recommended direction

### Best immediate treatment

Use a minimal **signal rail** until real preview waveform data is available:

1. Replace the striped fill with a low-contrast continuous rail and one thin center line.
2. Use a restrained Gary Burke red-to-muted-brass progress gradient; keep the unplayed rail near-black with only a soft gold tint.
3. Make the playhead a crisp 1–2px ivory-gold line with a small circular cap and very subtle glow.
4. Reduce the tracker height to approximately 30–32px and use an 8px radius with a faint inner highlight.
5. Let the played area carry the emphasis; remove bright dividers from the unplayed section.
6. Keep movement linear and functional. Do not add shimmer, pulsing, or continuously animated waveform bars.

### Later, when audio is connected

Generate a true mirrored waveform from the preview audio. Use variable-height peaks, 2px strokes, 3–5px gaps, low opacity for unplayed audio, and increased opacity only behind progress. Do not fabricate a waveform when no audio sample exists.

### Interaction

- If the tracker is display-only, retain `role="progressbar"` and a default cursor.
- If scrubbing is added, convert it to an actual slider with keyboard arrows, a visible focus ring, a timestamp tooltip, and a minimum 44px interaction target around the visual rail.

## Evidence limits

This review covers the current desktop visual state and exposed progress semantics. It does not establish full accessibility compliance or validate behavior with real audio data.
