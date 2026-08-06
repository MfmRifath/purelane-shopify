# Build notes

What I would flag about `purelane-homepage.html`, what I changed and why, and
what I would do next.

---

## 1. What I'd flag about the original file

### Bugs that change what renders

**a. Four of the eight shop cards render an empty image box above 760px.**

The grid mixes two ways of drawing a bottle: cards 1–4 use
`<span class="pimg p-tap">` (a background image on an empty span), cards 5–8
use an inline `<svg>`. The only sizing rule is:

```css
.card .shot svg { height: 122px; width: auto }          /* line 411 */
@media (max-width: 760px) { .card .shot .pimg { height: 108px } }  /* line 615 */
```

There is no desktop height for `.pimg`. An empty span with `aspect-ratio` and
no height, inside `display: grid; place-items: center`, resolves to 0×0. So on
any viewport wider than 760px the first four cards show an empty tile. It is
visible in a screenshot of the original file at 1440px.

Fixed: the media is a real `<img>`, sized at 122px desktop / 108px mobile to
match the SVG cards that did work.

**b. A PDP style leaks onto the bundle tier number.**

`purelane-homepage.html:794` defines a bare `.qty` for a product-detail
quantity stepper:

```css
.qty { background: rgba(255,255,255,.56); border: 1px solid rgba(75,58,143,.18) }
```

`.tier .qty` (the big `2` / `3` / `5`) never sets `background` or `border`, so
it inherits the stepper's white box and square 1px border. The result is a
sharp-cornered rectangle in a design where nothing else has square corners, and
the markup it was written for is not on this page at all — the whole PDP block
(`.crumb`, `.gal-main`, `.vopt`, `.thumb`, `.stickybuy`, …) is dead CSS here.

**This is the one place the port does not match the file pixel for pixel.** The
tier card is 2px shorter (1px border top and bottom). I judged it a collision
rather than a design decision; if you want it back it is one rule.

**c. Duplicate `id`s inside the background SVGs.**

`.wl-a` and `.wl-b` are two inline SVGs in the same document that both define
`id="cg"`, `id="wf"` and `id="wf2"`. `url(#wf2)` in the second layer resolves
against the first definition in the document. Invalid HTML, and the layer is
not filtered the way it was written to be.

**d. `#voices` is a dead anchor.** The progress rail links to it, `.voices`
and `.voice` CSS exists, but there is no such section in the markup. Clicking
that dot does nothing.

**e. `.striphint` is only ever `display: block` inside `@media (max-width: 760px)`.**
It has no base rule, so "Swipe to see the full shelf" is a `<p>` and shows at
every width, including desktop where there is nothing to swipe.

### Structural problems

**f. Content is invisible if JavaScript fails.** `.rv { opacity: 0 }` is set in
CSS and only removed by JS. A blocked script, a JS error, or a bot without JS
gets a blank page below the hero.

**g. Everything is addressed by `id`.** `#hstage`, `#hdots`, `#heroProd`,
`#rot`, `#scenes`. That is fine for one file and fatal for Shopify sections,
where a merchant can add the same section twice.

**h. One startup pass.** `document.querySelectorAll('.rv')` runs once. In the
theme editor every settings change re-renders the section, and anything
re-rendered would have stayed at `opacity: 0` forever.

**i. Heading order.** `h1 → h2 → h4` in the shop grid, `h5` for review titles.
Levels are being used as type sizes.

**j. No pause control on the review marquee.** It moves indefinitely and only
pauses on hover, which fails WCAG 2.2.2 for keyboard and touch users.

**k. Two full stylesheets, one painted.** A complete dark palette (V1) is
loaded and then overridden by a complete light palette (V2), so most of V1's
colour, shadow and gradient declarations are overwritten before they render.
On top of that, the whole PDP block at the end of V2 (`.crumb`, `.gal-main`,
`.thumb`, `.vopt`, `.cmp`, `.stickybuy`, …) styles markup that does not exist
on this page.

**l. Generic global class names.** `.card`, `.btn`, `.rate`, `.stack`,
`.qty`, plus `--ink` / `--paper` / `--surface` custom properties. `.card`
collides with Dawn directly; `.qty` already collides with itself (see b).

---

## 2. What I changed, and why

| Change | Why |
| --- | --- |
| Flattened V1 + V2 into one resolved token set | Only V2 is painted. Shipping both means downloading and parsing a palette that is immediately overwritten. |
| Namespaced everything `pl-` / `--pl-` | `.card`, `.btn`, `.rate` collide with Dawn. `--ink`, `--surface` are too generic to leave on `:root`. |
| Sized `.pl-card__shot .pl-pimg` at 122px / 108px | Fixes bug (a). |
| Dropped the leaked `.qty` box | Fixes bug (b). The one intentional pixel difference. |
| Moved the four caustic SVGs into `assets/purelane-water-*.svg` with namespaced ids | Fixes bug (c), and takes ~22KB of path data out of every HTML response so it can be cached and served in parallel. |
| `.pl-rv` hidden state gated behind `html.pl-js` | Fixes (f). `snippets/purelane-boot.liquid` sets the class in `<head>` before first paint, so there is no flash and no blank page without JS. |
| Interactive parts are custom elements (`<pl-hero-stage>`, `<pl-marquee>`) | Fixes (g) and (h). `connectedCallback` fires again every time the theme editor injects new DOM, so nothing needs to be re-wired. Two heroes on a page work independently. |
| Reveal + backdrop + rail listen for `shopify:section:load` / `:unload` / `:reorder` | The scene index and the progress rail are rebuilt from the DOM on every editor mutation instead of being read once. |
| Progress rail is generated from `[data-pl-rail-label]` | The prototype hardcoded seven dots, one of them dead (d). Now it reflects the sections actually on the page, in their current order. |
| `h1 → h2 → h3` throughout | Fixes (i). Type sizes come from `.pl-d1`…`.pl-d4`, independent of level. |
| Added a pause control to the reviews marquee | Fixes (j). It is invisible until focused, so the design is unchanged but a keyboard user has the mechanism WCAG requires. With Reduce motion on, the rail becomes a normal horizontal scroller instead of a frozen row. |
| Combo rail and review rail are focusable regions (`role="region"`, `tabindex="0"`) | A scrolling region needs to be reachable to be scrollable from a keyboard. No visual change. |
| Hero dots got a 24px hit area via `::before` | 6px dots fail WCAG 2.5.8. The dot still draws at 6px. |
| Card title became the link; the inert `<button>` became a real form | The prototype's "Add to cart" did nothing and the card had no route to the product. |
| Self-hosted Inter and Outfit, latin subset + a 2KB U+20B9 slice | The prototype pulled 9 static weights from two Google origins. This is 84KB from the Shopify CDN, no third-party connection, no render-blocking `@import`. |
| Inactive hero slides get `inert` | They sit stacked at `opacity: 0`. Without `inert` their content is still in the accessibility tree and the tab order. |
| `sold out` / `no image` / `long title` states | The prototype has no concept of any of them. Sold out reuses the existing pill and button silhouettes; a product with no image gets the same bottle shape drawn inline. |

---

## 3. Pixel parity

Measured in headless Chromium against the original file at 375, 768, 1024,
1200 and 1440px. Bounding boxes and computed type of the load-bearing elements:

| Element | 375 | 768 | 1024 | 1200 | 1440 |
| --- | --- | --- | --- | --- | --- |
| Hero `h1` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hero lede | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hero copy column | ✓ | ✓ | ✓ | ✓ | ✓ |
| Primary button | ✓ | ✓ | ✓ | ✓ | ✓ |
| Shop card | ✓ | ✓ | ✓ | ✓ | ✓ |
| Combo card | ✓ | ✓ | ✓ | ✓ | ✓ |
| Review card | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bundle tier | −2px height | −2px | −2px | −2px | −2px |

The tier delta is the leaked `.qty` border in section 1(b). Everything else is
identical to one decimal place, including font-size, line-height and the
resolved `max-width: 44ch` on the lede.

Two things I caught this way and corrected back toward the original:

- I had made `.pl-tier` a flex column so the buttons bottom-aligned. The
  original lets the button follow the feature list, so tiers with different
  numbers of features have buttons at different heights. Reverted to match.
- I had added `flex-wrap: wrap` to the card price row. At 375px that wraps the
  "33% off" pill and adds 12px to every card in the grid. Reverted to match.

---

## 4. Performance

- No third-party origins. Fonts are on the Shopify CDN, subset, `font-display: swap`.
- The four caustic layers are separate cacheable SVGs at `fetchpriority="low"`,
  not 22KB of inline path data in every HTML response.
- Every product image is a real `<img>` with `width`/`height`, `srcset` and
  `sizes`, so it contributes nothing to CLS. The prototype's bottles were
  base64 CSS backgrounds, which cannot be responsive and cannot be lazy.
- The hero's first slide loads `eager` + `fetchpriority="high"` (it is the LCP
  candidate); every other slide is lazy.
- One rAF-throttled scroll handler drives the backdrop, the parallax and the
  rail. The hero owns a second one for its own parallax.
- `contain: strict` on the fixed backdrop so its animations do not invalidate
  layout for the page.
- Below 760px the second caustic layer and the bubbles are removed — the two
  most expensive things to composite, and the least visible on a phone.
- Section CSS is split per section and requested by the section that needs it,
  so a page without a combos section never downloads combo CSS.

Not done: no preload for the two font files. The sections can't emit a
`<link rel="preload">` into `<head>`, and putting one in `theme.liquid`
unconditionally would cost every page that has no Purelane section on it. If
Purelane became the whole theme rather than five sections, that moves to
`theme.liquid` and saves a round trip on the hero text.

---

## 5. Accessibility

- Keyboard: every control is a real `button` or `a`. Both horizontal rails are
  focusable regions so they can be scrolled without a pointer. Hero dots have
  24px hit areas.
- Focus: a single visible `:focus-visible` ring on the leaf green, scoped to
  Purelane sections so it doesn't fight Dawn's.
- Motion: `prefers-reduced-motion` stops the marquee, the caustics, the
  bubbles, the hero autoplay and the parallax, and turns the reveal off rather
  than leaving content mid-transition. The marquee also gains a scrollbar so
  the stopped reviews are still reachable.
- Screen readers: the duplicated half of the marquee is `aria-hidden`;
  inactive hero slides are `inert`; decorative bottles in the tier strips have
  empty alt; ratings have a visually hidden long form ("Rated 4.8 out of 5,
  from 237 reviews") next to the `★ 4.8` shorthand.
- Contrast: **two pairings in the original palette fail AA and I did not
  change them**, because changing brand colours is a redesign, not a port.
  Measured against a glass panel (≈ `#f2f8f3`):

  | Token | Value | Ratio | Verdict |
  | --- | --- | --- | --- |
  | `--pl-paper-2` | `rgba(36,26,61,.78)` | 7.7:1 | passes AAA |
  | `--pl-leaf` `#4f7d10` | tick icons, small caps | 4.6:1 | passes AA |
  | `--pl-accent` `#b8701c` | price pills, `4.8` in the review header | **3.6:1** | fails AA for text under 18.66px bold |
  | `--pl-paper-3` | `rgba(36,26,61,.56)` | **3.8:1** | fails AA for the 8.5–12px text it is used on |

  The cheapest fix that keeps the design intact is darkening `--pl-accent` to
  about `#9c5d14` and `--pl-paper-3` to `rgba(36,26,61,.68)`; both are single
  token changes in `purelane-core.css`. Flagging rather than doing, since it
  moves brand colour.

---

## 6. What I'd do with more time

1. **The remaining sections.** Ingredients, pillars, proof + rotator, the range
   strip, why-bundles, categories, trust bar and signup are all in the file and
   all still to build. The rotator in particular shares the hero's slide
   machinery and should reuse `<pl-hero-stage>`.
2. **Header, footer and the ticker.** Currently stock Dawn, which is visibly a
   different design language at the top and bottom of the page. The ticker
   belongs in the announcement bar group.
3. **A combo section-block fallback.** Metaobjects are the right model, but a
   merchant who wants one throwaway combo for a weekend sale has to create an
   entry. A block type on the section that renders the same card would cover
   that without duplicating the card snippet.
4. **Bundle builder.** "Build this box" currently links to a product. The
   design implies a picker that pre-fills from the combo you came from. That is
   a cart-transform / bundle app decision, not a theme one, and I'd want the
   commercial model settled before building it.
5. **Real add-to-cart from the combo cards.** They link out today. Adding all
   three products in one request needs `/cart/add.js` with multiple lines and
   an error path when one of them has gone out of stock.
6. **Visual regression in CI.** The measurement harness I used to check parity
   is throwaway. Making it a committed script with stored baselines would keep
   this honest as the theme changes.
