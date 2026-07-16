# Button Animation Inspiration Audit

## Audit scope

- Reference: `/Users/amankumarsingh/Downloads/June To-Do's/beatmondo/beatmondo GIFs/Without music.mp4`
- Format: H.264 MP4, 1280 × 720, 10 seconds, no audio.
- Product surface: beatmondo VIP, primary, secondary, text, and icon buttons.
- User goal: translate the reference animation's premium music identity into usable interface motion without reproducing a ten-second logo intro inside a control.
- Timeline evidence: `01-reference-timeline.png`.

## Step 1 — Dark hold and waveform formation, 0–2 seconds

General health: strong for cinematic anticipation, too slow when copied literally into a button.

- The motion begins from near-black and concentrates attention into one warm gold waveform mark.
- Vertical bars appear with different heights rather than moving uniformly.
- A soft bloom gives the gold material depth without relying on a harsh border.
- Button inspiration: begin from a low-amplitude waveform, stagger bar heights, and briefly increase glow at the pulse peak.

## Step 2 — Acoustic ripple expansion, 2–3 seconds

General health: the most distinctive and reusable motion idea.

- Concentric rings expand from the waveform and fade as they travel.
- The rings communicate sound, reach, and premium energy without changing the core logo geometry.
- Button inspiration: use one or two restrained rings from the VIP icon or button center during a periodic emphasis moment; never let the rings obscure the label.

## Step 3 — Traveling gold reveal, 3–5 seconds

General health: visually premium and highly suitable for primary actions when compressed.

- A bright gold highlight travels left to right as the wordmark is revealed.
- Tiny light particles trail the highlight, while unrevealed letters remain outlined or dark.
- Button inspiration: a narrow specular sheen can cross the gold surface, with the label remaining fully present and stationary throughout.

## Step 4 — Complete lockup and calm hold, 5–10 seconds

General health: excellent restraint after the reveal.

- Once the lockup is complete, the reference stops introducing new movement.
- The remaining motion is mostly a soft, localized shimmer and glow decay.
- Button inspiration: continuous motion should contain long quiet phases. The waveform can keep moving, but most of the loop should remain low-amplitude.

## Recommended translation to beatmondo buttons

### VIP buttons

- Use a continuous 2.4–3.2 second loop with four phases: low waveform, brief bar rise, one ripple/glow accent, then a long settle.
- Keep the existing label fixed above the effect.
- Let the waveform occupy the lower 35–50% of the button rather than the full surface.
- Add a narrow gold highlight sweep only once per loop, not continuously.
- Keep the ripple to one or two faint rings with rapid opacity decay.

### Gold primary buttons

- Borrow only the traveling specular highlight and 1–2px lift.
- Trigger on hover, keyboard focus, or important state change rather than looping.

### Outline buttons

- Use a short interior glow or border-energy pass inspired by the fading acoustic rings.
- Avoid full waveform animation so VIP remains distinct.

### Text actions

- Use a left-to-right underline reveal that echoes the wordmark reveal.
- Keep duration around 180–240ms.

### Icon buttons

- Use one expanding ring on press or activation, followed by a compact scale return.
- Do not use particles or repeated ambient motion.

## Suggested VIP timing

- 0–500ms: waveform bars rise with staggered amplitude.
- 500–900ms: glow peaks and a faint ring expands.
- 900–1300ms: narrow gold sheen moves left to right.
- 1300–2800ms: waveform settles to low amplitude before the loop restarts.

## UX and accessibility risks

- Reproducing the full 10-second sequence would make buttons feel delayed and decorative rather than actionable.
- Constant full-amplitude motion across several VIP buttons would compete with page content.
- The effect must not move the label, change button dimensions, or communicate state by animation alone.
- `prefers-reduced-motion: reduce` should remove waveform travel, ripple expansion, particles, sheen, lift, and scaling while preserving focus outlines and color contrast.

## Recommendation

Adopt the reference's sequence and material behavior—not its duration or scale. The best signature is a low continuous waveform punctuated by a periodic ripple and one gold light sweep, followed by a long calm phase.

## Evidence limits

Ten one-second samples and four full-resolution focus frames were inspected. This supports analysis of staging, composition, glow, reveal direction, and pacing, but exact easing curves and sub-frame particle trajectories would require frame-by-frame motion tracking.
