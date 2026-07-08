# beatmondo Homepage Audit

## Audit scope

- Mode: Combined UX, visual-design, and screenshot-based accessibility audit.
- Surface: Public desktop homepage.
- Evidence: `01-homepage-desktop.png`, supplied at 2940 × 12373.
- User goal: Understand beatmondo, assess credibility, explore music, compare access levels, and choose a clear next action.
- Accessibility target: A readable, keyboard-operable, zoom-resilient public landing page with WCAG 2.2 AA contrast and target-size considerations.

## Step list

1. **Public homepage — generally healthy, but overlong and visually repetitive.**  
   The positioning, premium tone, gated-access model, and primary entry actions are understandable. The page loses momentum after the opening sections because too many similarly weighted grids and dark promotional bands compete for attention.

## Strengths

1. The hero communicates the private, premium licensing position immediately.
2. Lowercase beatmondo branding, red accents, dark cinematic surfaces, and brass highlights feel cohesive.
3. “Request Access” and “Explore Music” offer clear buyer and discovery paths.
4. Access tiers make the gated business model tangible.
5. Rights verification, protected delivery, and licensing workflow content establish trust.
6. The new editorial imagery has a more intentional and consistent photographic direction.
7. Section titles are descriptive and use buyer-facing terminology consistently.

## UX risks

### P1 — The homepage is too long and asks users to process too many equal-weight choices

Nine use cases, three access tiers, six collections, four tracks, three workflow benefits, a partner pitch, and three editorial cards all appear in one continuous journey. The main conversion path becomes less clear as users scroll.

**Recommendation:** Reduce the homepage to six primary beats: hero, trust proposition, access tiers, selected use cases, featured music, and final access CTA. Move the complete collection and editorial inventories to their dedicated pages.

### P1 — The hero video functions mainly as a second logo

The header already establishes the brand. A large framed logo animation consumes roughly half of the hero without showing music, artists, licensing work, or premium delivery.

**Recommendation:** Replace it with a short cinematic montage of studio craft, artist performance, supervisor review, and secure delivery. Retain the logo only as a brief opener or end frame.

### P1 — The collections grid ends with a visibly incomplete row

“Supervisor Favorites” sits alone while two-thirds of the row remains empty. This makes the section feel unfinished and creates a large dead area.

**Recommendation:** Use a balanced 2×3 grid, let the final card span the remaining columns, or reduce the homepage preview to three or four collections.

### P1 — Calls to action compete instead of forming a clear ladder

The page mixes “Request Access,” “Apply for VIP Access,” “Discuss Licensing Access,” “Explore Music,” “Explore selection,” “View all music,” “Request License,” and “Partnership Inquiry.” Many have similar visual weight.

**Recommendation:** Establish a consistent CTA hierarchy:

- Primary: Request Access
- Music action: Explore Music
- Track action: Request License
- Contextual links: View collection, Learn about VIP, Partnership Inquiry

### P2 — Access-tier cards are dense for an early-stage visitor

Descriptions, badges, feature lists, pricing-language labels, and buttons create a lot of small text. The meaningful differences between Professional Buyer and VIP are not immediately scannable.

**Recommendation:** Show three or four differentiators in a comparison structure: metadata depth, project tools, licensing speed, and delivery level. Link to the full tier details.

### P2 — The use-case grid creates choice overload

Nine cards receive equal prominence. The section does not guide users toward common or strategically important placements.

**Recommendation:** Feature four primary categories and place the remainder behind “View all use cases” or a compact horizontal selector.

### P2 — Repeated card anatomy makes the middle of the page monotonous

Most sections use bordered rectangles, image cards, small eyebrow text, serif headings, and bottom-aligned links. The rhythm becomes predictable despite strong individual components.

**Recommendation:** Introduce one editorial split layout, one compact horizontal carousel/list, and more deliberate whitespace between major conversion stages.

### P2 — Some imagery still repeats within the same homepage

The archive, headphones, and vocalist scenes appear in both collection cards and the final editorial cards. The reuse is semantically defensible, but its proximity makes the page feel asset-limited.

**Recommendation:** Create three dedicated thumbnails for Gary Burke Legacy, Short Sync Clips, and Media Episodes.

### P2 — Featured track rows are information-dense

Artwork, title, artist, genre, BPM, multiple status pills, duration, favorite, and Request License appear in a shallow row. Important distinctions become difficult to scan.

**Recommendation:** Prioritize title/artist, availability, duration, and the primary action. Move secondary rights and delivery states into a details popover or track page.

### P3 — The partner section arrives late and feels detached

The strategic-partner message is relevant to a separate audience and interrupts the buyer-focused journey near the end.

**Recommendation:** Move it to the footer area or a dedicated Partners page unless partner acquisition is a primary homepage objective.

### P3 — Several section-level text buttons look visually unfinished

“Explore music” and “View all music” have low visual presence and resemble default outlined controls compared with the polished primary buttons.

**Recommendation:** Standardize tertiary button styling, casing, padding, borders, hover states, and icon treatment.

## Accessibility risks

1. **Contrast:** Muted gold text on cream surfaces and muted brown text on dark panels may fall below WCAG AA, particularly at small sizes.
2. **Text size:** Eyebrows, status pills, footer copy, and card metadata appear very small in the full-page view.
3. **Target size:** Small tag-like buttons and text links may not consistently reach a 24 × 24 CSS pixel minimum target.
4. **Heading structure:** Visual heading hierarchy is strong, but semantic `h1`–`h3` order must be verified in the DOM.
5. **Video controls:** Autoplay behavior needs a visible pause/mute control and must honor `prefers-reduced-motion`.
6. **Status communication:** Availability and delivery states should not rely on color alone.
7. **Focus visibility:** Keyboard focus treatment cannot be verified from the screenshot.
8. **Zoom/reflow:** Desktop screenshot alone cannot prove correct behavior at 200% zoom or with increased text spacing.

## Recommended sequence

1. Shorten and restructure the homepage journey.
2. Fix the incomplete collections grid.
3. Normalize CTA hierarchy and labels.
4. Replace the hero logo loop with product-relevant footage.
5. Simplify tier cards and track rows.
6. Add dedicated images for the final editorial cards.
7. Run measured contrast, keyboard, reduced-motion, zoom, and screen-reader checks.

## Evidence limits

This audit is based on one static desktop screenshot. It cannot confirm hover behavior, keyboard order, focus visibility, accessible names, screen-reader output, actual contrast ratios, video controls, loading behavior, form validation, or responsive behavior. Those require live interaction and DOM inspection.
