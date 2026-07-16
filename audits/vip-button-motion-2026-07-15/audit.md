# VIP Button Motion Audit

## Audit scope

- Surface: homepage access-tier section shown in the supplied screenshot.
- User goal: distinguish VIP Sync Access as the premium, faster path without making the interface feel noisy or promotional.
- Evidence: `01-access-tier-buttons.png`.

## Step 1 — Compare access tiers

General health: strong. The VIP card and gold action already have clear visual priority, while Discovery and Professional remain appropriately quieter.

### Strengths

- The gold VIP action is the clearest primary action on the screen.
- The three-card comparison makes tier hierarchy easy to understand.
- A sound-wave motif is product-relevant because beatmondo is a music licensing ecosystem.

### UX risks

- A waveform that runs continuously would compete with the tier content and can make the premium treatment feel like a music player, advertisement, or gaming effect.
- Applying the same transition to every button would flatten the hierarchy the screen currently establishes.
- Moving the button label or changing its width during animation would reduce scanability and create layout jitter.

### Accessibility risks

- Repeating motion may be distracting for motion-sensitive users.
- Hover-only behavior would not translate to keyboard or touch users.
- The animation must not be the only indication of focus, loading, success, or disabled state.

## Recommended motion system

### VIP actions

- Use the existing `.vip-access-button` hook as the global VIP motion contract.
- Keep the label fixed and place a low-amplitude waveform behind or below it.
- At rest, show either no waveform or a nearly still 8–12% opacity trace.
- On hover and keyboard focus, animate the waveform for roughly 700–900ms, then let it settle; do not loop indefinitely.
- On press, use one short compression/pulse of about 140ms.
- On touch devices, run the effect only on press.

### Other primary buttons

- Gold primary: 1–2px lift, restrained highlight sweep, and slightly deeper shadow over 180–240ms.
- Outline secondary: subtle border brightening and a very light background fill; avoid scale-heavy motion.
- Text actions: underline reveal or arrow movement of 3–4px.
- Icon buttons: small color/opacity change with a compact press response; no waveform.

### Motion tokens

- Quick press: 140–160ms.
- Standard hover/focus: 200–240ms.
- VIP waveform phrase: 700–900ms.
- Use a premium ease such as `cubic-bezier(0.16, 1, 0.3, 1)`.
- Under `prefers-reduced-motion: reduce`, remove waveform travel, sheen, lift, and scaling while preserving clear focus and color changes.

## Evidence limits

The supplied screenshot supports hierarchy and visual-style recommendations, but it cannot confirm keyboard focus, hover behavior, touch response, frame rate, or reduced-motion behavior. Those require implementation and browser testing.

## Recommendation

Proceed with a restrained, interaction-triggered VIP waveform and a smaller family of role-based transitions for other buttons. Avoid continuous ambient motion.
