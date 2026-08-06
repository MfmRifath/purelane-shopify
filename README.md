# Purelane — Shopify sections

Five production sections built from `purelane-homepage.html`, on a clean
install of **Dawn 15.5.0**.

| # | Section | File | Anchor |
| --- | --- | --- | --- |
| 1 | Hero | `sections/purelane-hero.liquid` | `#hero` |
| 2 | Shop / product grid | `sections/purelane-shop.liquid` | `#shop` |
| 3 | Best-selling combos | `sections/purelane-combos.liquid` | `#combos` |
| 4 | Bundles | `sections/purelane-bundles.liquid` | `#bundles` |
| 5 | Reviews rail | `sections/purelane-reviews.liquid` | `#reviews` |

`templates/index.json` wires all five in the prototype's order with its copy.

---

## Read these

- **[docs/SETUP.md](docs/SETUP.md)** — metafield and metaobject definitions,
  the seed catalogue, currency format, theme settings.
- **[docs/BUILD-NOTES.md](docs/BUILD-NOTES.md)** — what I'd flag about the
  original file, what I changed and why, the pixel-parity measurements, and
  what I'd do next.
- **[docs/AI-WORKFLOW.md](docs/AI-WORKFLOW.md)** — what I delegated, where it
  failed, what I'd systematise.

---

## How it's put together

```
sections/purelane-*.liquid        the five sections
snippets/purelane-*.liquid        everything shared between them
assets/purelane-*.css             one core stylesheet + one per section
assets/purelane-*.js              motion, backdrop, hero stage, marquee
assets/purelane-water-*.svg       the four caustic layers
assets/purelane-*.woff2           self-hosted Inter and Outfit subsets
```

### Shared pieces

Several sections render similar cards, so the parts they share live in one
place:

| Snippet | Used by |
| --- | --- |
| `purelane-product-media` | hero stage, shop card, combo tray, bundle strip |
| `purelane-price` | hero price tag, shop card, combo card, bundle tier |
| `purelane-section-head` | shop, combos, bundles, reviews |
| `purelane-icon` | all five |
| `purelane-product-card` | shop grid |
| `purelane-combo-card` | combos |
| `purelane-review-card` | reviews |
| `purelane-atmosphere` | rendered once from `layout/theme.liquid` |

`purelane-price` renders the same markup everywhere and is styled per context
by a `pl-price--{card,tag,combo,tier}` modifier — one snippet, four looks.

### Where the data comes from

Nothing a marketing team would want to change is in the Liquid.

| Content | Source |
| --- | --- |
| Products, prices, compare-at, stock, images | Shopify products |
| Card badge | `custom.card_badge` product metafield |
| Combo tray captions | `custom.benefit` product metafield |
| Rating and review count | `reviews.rating` / `reviews.rating_count` (Shopify standard) |
| Combos | `purelane_combo` metaobject |
| Reviews | `purelane_review` metaobject |
| Bundle tiers | Section blocks, priced off a real bundle product |
| Headings, eyebrows, buttons, badges, hints | Section and block settings |

### Theme-editor behaviour

Interactive parts are custom elements (`<pl-hero-stage>`, `<pl-marquee>`), so
`connectedCallback` re-initialises them whenever Shopify injects new DOM. The
backdrop, the scene index and the progress rail rebuild from the DOM on
`shopify:section:load`, `:unload` and `:reorder`. The rail is generated from
the sections actually present, so adding, removing and reordering sections
changes it instead of breaking it. Two heroes on one page work independently.

### Changes to Dawn

Four files, all additive:

| File | Change |
| --- | --- |
| `layout/theme.liquid` | renders `purelane-boot` in `<head>` and `purelane-atmosphere` after the skip link |
| `config/settings_schema.json` | a "Purelane" group with two chrome toggles |
| `locales/en.default.json` | a `purelane` translation group |
| `templates/index.json` | the five sections |

No Dawn section, snippet, stylesheet or script was modified.

---

## Local development

```bash
shopify theme dev --store your-store.myshopify.com
shopify theme check
```

`shopify theme check` is clean on every Purelane file. The eight warnings it
reports are all pre-existing in stock Dawn 15.5.0 — `layout/password.liquid`,
`layout/theme.liquid`, `main-article`, `main-list-collections`, `main-product`,
`main-search` and `quick-order-product-row`.

---

Built on [Dawn](https://github.com/Shopify/dawn), MIT licensed. See
[LICENSE.md](LICENSE.md).
