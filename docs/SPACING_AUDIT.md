# Interface spacing audit

Reviewed October 7, 2026, before committing the current changes. This is an identification report; no interface styles were changed during this audit.

Follow-up: finding 1 has now been fixed in response to the request to repair the responsive card spacing. Cards use equal-width tracks, bounded images, consistent internal spacing, and a container query that stacks media and text below a 520-pixel card width. Rerunning the audit regenerates screenshots with the corrected layout; other findings remain open.

## Scope and evidence

Headless Chrome measurements and screenshots cover all 18 routes at widths 280, 390, 900, 1024, 1346, and 1440 pixels. Heights are 844 pixels for the two narrow widths and 900 pixels otherwise. Both themes were captured at 390 and 1346 pixels. Quote and financing panels, expanded navigation, cookie consent, and chat were also opened. Cookie consent and chat received an additional 844 × 390 landscape check. There are 176 recorded page/control states.

Run `node tools/spacing-audit.js` to reproduce. Screenshots and raw bounds are generated in `out/spacing/`, which is ignored by Git. `measurements.json` records the actual route, element bounds, padding, margins, overlaps, and clipping.

This checks the default build step and office use case. Other tab selections, validation messages, browser zoom, virtual keyboards, and other browser engines remain outside this audit. Passing document overflow checks does not imply that elements inside a card cannot overlap.

## Functional problems to resolve before committing

### 1. Homepage product images cover card text — resolved

**Confirmed at every tested desktop width from 900 through 1440 pixels, including the supplied screenshot width of 1346 pixels.** At 900 and 1024 pixels all four cards overlap. At 1346 and 1440 pixels the two right-hand cards overlap. At 1346 pixels the images extend 64 pixels into the adjacent text column, covering headings, descriptions, and prices.

The desktop grid in `public/assets/css/theme.css:115` splits both the section and each card into unequal available widths. Its `.pic` keeps the original `aspect-ratio:4/3` from `public/assets/css/site.css:190` while gaining `height:100%` and `min-height:220px` in `theme.css:117`. The resulting image box is wider than its grid track.

Resolution: constrain the media box to its assigned track and remove the conflicting aspect ratio/full-height sizing; use stacked cards until both media and text have enough room. Verify sibling bounds, not just page width.

Verification screenshots showing the corrected layout: [1346px close-up](../out/spacing/home-dark-1346-detail.png), [1024px close-up](../out/spacing/home-dark-1024-detail.png).

### 2. Storage customization dock covers the hero

**Confirmed at 1024 pixels.** The dock overlaps the text container by 120 pixels horizontally and 343 pixels vertically. It covers the start of the headline, body copy, and quote button.

`public/assets/css/site.css:225` positions the dock absolutely at the left edge. The hero remains a centered 780-pixel container at `site.css:231`. The dock only moves into normal flow at 1020 pixels in `public/assets/css/responsive.css:73`, leaving insufficient room immediately above that breakpoint.

Resolution: reserve a real column for the dock or move it into normal flow earlier; avoid overlaying a centered text container.

Evidence: [1024px hero](../out/spacing/storage-dark-1024-detail.png).

### 3. Build walkthrough loses its heading and paragraph start

**Confirmed at 280 pixels.** The first step's title and the start of its description sit outside the stage and are clipped. The visible card begins midway through the paragraph.

`public/assets/css/site.css:744` hides overflow. The mobile stage has a 320-pixel minimum height at `site.css:781`, but its caption is absolutely positioned at the bottom with 80-pixel top padding at `site.css:746`. Wrapped content becomes taller than the stage without increasing its height.

Resolution: put the caption in normal flow and give the image its own sized area. Allow content height to grow with wrapping.

Evidence: [280px build stage](../out/spacing/build-dark-280-detail.png).

### 4. Landscape chat has no usable message area

**Confirmed at 844 × 390 pixels.** The chat panel is 366 pixels high, but `.yc-msgs` collapses to 28 pixels: exactly its 18-pixel top and 10-pixel bottom padding, leaving zero height for messages. The input row extends to approximately y=391, past the panel bottom at y=378 and the viewport bottom at y=390.

The header, notice, consent fieldset, and input exceed the available height. `public/assets/css/responsive.css:59` permits the message region to shrink to zero; the short-screen panel rule at `responsive.css:143` does not make the remaining content fit. Notice and consent spacing comes from `public/assets/css/privacy.css:24`.

Resolution: use a layout that can scroll the required consent content and retains a usable conversation area and visible input on short screens. Keep all required consents accessible.

Evidence: [landscape chat](../out/spacing/chat-light-844-landscape.png); exact widget bounds are in `measurements.json` under the `landscape` chat state.

## Spacing inconsistencies

### 5. Product section padding compounds with shared section spacing

Affected pages: storage, office, kiosk, multi-compartment, shipping containers, and accessories.

The new shared section padding in `public/assets/css/theme.css:86` is added to retained inner panel padding, such as `public/assets/css/site.css:242` and `site.css:521`. At 390 pixels this is 48 pixels outside plus 28 pixels inside each section edge. Adjacent content can consequently have 152 pixels of vertical separation, compared with 96 pixels between ordinary homepage section contents.

The same rule overrides the global horizontal gutter: product panel text starts 28 pixels from the edge on mobile while navigation and ordinary sections start at 16 pixels. At 1440 pixels the product panel inset is 56 pixels while the shared gutter is 32 pixels. This creates visible alignment shifts between heroes, panels, and footer content.

Resolution: assign vertical section spacing and horizontal container gutters consistently; give cards their own internal padding without duplicating section padding.

Evidence: [storage mobile page](../out/spacing/storage-dark-390-default.png), [office mobile page](../out/spacing/office-dark-390-default.png).

### 6. Policy pages add a second top-spacing layer

Affected routes: privacy, terms, refunds, cookies, data deletion, unsubscribe, and business details.

Their headlines start approximately 157 pixels below the fixed header at both 390 and 1024 pixels. Other standalone pages have approximately 111 pixels of clearance at 390 pixels and 126 pixels at 1024 pixels. `public/assets/css/responsive.css:5` already offsets standalone content below the header, and `public/assets/css/privacy.css:3` adds a further 120-pixel top padding, plus the standalone heading margin.

Resolution: apply the fixed-header offset once, then use the shared content spacing for the policy introduction.

Evidence: [privacy mobile page](../out/spacing/privacy-dark-390-default.png).

### 7. Solid photo captions retain excessive fade-padding

Affected components include the office use-case stage, build walkthrough, and kiosk band. `public/assets/css/privacy.css:52` changed these caption backgrounds to solid fills, but they retain the large top padding originally intended for gradient fades: 70 pixels in `site.css:538` and 80 pixels in `site.css:653` and `site.css:746`.

At 390 pixels the office use-case stage leaves only roughly 58 pixels of its 340-pixel image stage visible, with a large empty solid band above the caption. On the build page the same pattern contributes to finding 3.

Resolution: use normal caption padding and separate the caption from the image when text wraps. Review related storage and multi-compartment caption overrides under the same selector.

Evidence: [390px office stage](../out/spacing/office-dark-390-detail.png), [280px build stage](../out/spacing/build-dark-280-detail.png).

### 8. Final product calls to action bypass the spacing scale

All six product pages retain final-section padding of 110–120 pixels above and 132–140 pixels below (`public/assets/css/site.css:263`, `:571`, `:666`, `:885`, `:997`, `:1063`). Ordinary section spacing is 48–80 pixels per edge. This leaves unusually large pauses before the disclosure/footer and varies between product pages.

Resolution: bring these final sections onto the shared spacing scale, with any intentionally larger treatment expressed through one consistent rule.

## Other reviewed areas

The audit did not detect sibling overlap or clipped text in the default sizes and gallery pages, the contact form panels, expanded navigation, or cookie consent at the tested dimensions. Shared footer content remains readable in the captures. This is bounded evidence for these states, not a guarantee for untested interactions or content changes.

The recent homepage layout change introduced finding 1. The previous overflow checks missed it because the image stays within the card's overall bounds while covering its sibling text. The spacing audit now checks that internal overlap explicitly.
