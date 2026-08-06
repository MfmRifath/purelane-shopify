# Store setup

Everything the theme needs on the Shopify side. Roughly 30 minutes on a fresh
development store.

---

## 1. Store settings

**Settings → Store details → Store currency → Change formatting**

The design shows prices as `₹200`, `₹1,495`. Set both fields to the
no-decimal format so the card, combo and tier rows stay on one line:

| Field | Value |
| --- | --- |
| HTML with currency | `₹{{amount_no_decimals_with_comma_separator}} INR` |
| HTML without currency | `₹{{amount_no_decimals_with_comma_separator}}` |

The theme never hardcodes a currency symbol — it uses `| money`, so if you leave
the default two-decimal format everything still works, the price rows are just
wider than the prototype's.

---

## 2. Product metafield definitions

**Settings → Custom data → Products → Add definition**

| Namespace and key | Type | Used by | Notes |
| --- | --- | --- | --- |
| `custom.card_badge` | Single line text | Shop grid | The pill on the card: `Best seller`, `Top rated`, `New`. Blank falls back to `On sale` when there is a compare-at price, and always shows `Sold out` when there is no stock. |
| `custom.benefit` | Single line text | Combos | The one-line caption under a product in a combo tray, e.g. `Cuts grease instantly`. Overridable per combo. |
| `reviews.rating` | Rating (0–5) | Shop grid | Shopify **standard** definition. Add it from the "standard definitions" list rather than creating your own, so review apps can write to it. |
| `reviews.rating_count` | Integer | Shop grid | Shopify standard definition. |

`reviews.*` are the same two fields Dawn's own product cards read, so nothing
here is Purelane-specific.

---

## 3. Metaobject definitions

**Settings → Custom data → Metaobjects → Add definition**

### `purelane_combo`

Type must be exactly `purelane_combo`. Enable **Storefronts → Web** so the
entries are readable by the theme.

| Field key | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | Single line text | yes | `Kitchen essentials` |
| `products` | Product, list of | | The bottles in the tray. The section shows the first 3 by default. |
| `item_captions` | Single line text, list of | | Index-aligned with `products`. Falls back to each product's `custom.benefit`, then its title. |
| `bundle_product` | Product | | The sellable bundle. **Price, compare-at price and the button link come from here.** |
| `items_count_label` | Single line text | | Overrides the computed `3 products` — use it when the combo contains more products than the tray shows. |
| `includes` | Multi-line text | | `Includes: Foaming Kitchen Cleaner, …` |
| `tray_label` | Single line text | | The pill at the top left: `You save ₹398`, `Biggest saving`. |
| `flag` | Single line text | | The solid pill top right: `Most popular`, `Best value`. |
| `featured` | True or false | | Gold border and a solid button. |
| `fine_print` | Single line text | | `Inclusive of all taxes · COD available` |
| `cta_label` | Single line text | | Defaults to `Shop bundle`. |
| `cta_url` | URL | | Defaults to the bundle product's page. |

### `purelane_review`

Type must be exactly `purelane_review`. Enable **Storefronts → Web**.

| Field key | Type | Required | Notes |
| --- | --- | --- | --- |
| `rating` | Integer | | 1–5. Defaults to 5. |
| `title` | Single line text | yes | `Works like a charm` |
| `body` | Multi-line text | yes | The quote. |
| `author` | Single line text | | Defaults to `Verified buyer`. |
| `context` | Single line text | | `Laundry detergent`. Falls back to the linked product's title. |
| `product` | Product | | Optional link to what was reviewed. |
| `verified` | True or false | | Shows the tick. |

If you already run a review app, point the rail at its metaobject type instead
by changing `metaobject_type` in `sections/purelane-reviews.liquid` — the card
snippet is the only thing that reads field names.

---

## 4. Seed catalogue

Eight products minimum, including the three edge cases the brief asks for.
This is the set the build was tested against:

| # | Title | Price | Compare at | Image | Stock | `custom.card_badge` |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Tap cleaner & limescale remover | 200 | 299 | yes | in stock | Best seller |
| 2 | Kitchen cleaner, foaming | 200 | 299 | yes | in stock | Best seller |
| 3 | Copper, bronze & brass cleaner | 200 | 299 | yes | in stock | Top rated |
| 4 | Washing machine cleaner & descaler | 200 | 299 | yes | in stock | New |
| 5 | Herbal floor cleaner with neem, lemongrass and eucalyptus for daily mopping across tile, marble and wood | 240 | 349 | yes | in stock | Best seller |
| 6 | Fabric conditioner, lavender | 210 | — | **none** | in stock | — |
| 7 | Toilet cleaner, non-toxic | 200 | 299 | yes | **sold out** | — |
| 8 | Dishwash gel, organic | 200 | 299 | yes | in stock | Top rated |

Plus the bundle products the hero, combos and tiers price off:

| Title | Price | Compare at |
| --- | --- | --- |
| Any 2 products bundle | 349 | 598 |
| Any 3 products bundle | 499 | 897 |
| Any 5 products bundle | 799 | 1495 |
| Kitchen essentials combo | 499 | 897 |
| Laundry care bundle | 499 | 947 |
| Complete home bundle | 799 | 1495 |
| Bathroom deep clean | 499 | 897 |
| Hard water solution kit | 349 | 598 |

Sold out (#7): set inventory to 0 and untick "Continue selling when out of
stock". Product 5's title is deliberately long, product 6 deliberately has no
image; both are rendered in the grid on purpose.

**Product images.** The design's bottles are tall and narrow (roughly 1:1.6
portrait) on a transparent background. Square images work but sit smaller in
the hero stage, because the stage sizes by height. Use portrait PNGs with
transparency for the closest match to the prototype.

---

## 5. Theme settings

**Online store → Themes → Customize → Theme settings → Purelane**

| Setting | Default | What it does |
| --- | --- | --- |
| Underwater backdrop | on | The fixed gradient, caustics and bubbles behind every section. |
| Section progress rail | on | The dot rail on the right, from 1180px up. |

Both are page-level chrome rendered from `layout/theme.liquid`, not from a
section, so removing a section in the editor cannot take them with it.

---

## 6. Home page

`templates/index.json` already has the five sections in order with the
prototype's copy. What is left after seeding:

1. **Hero** → each slide block: pick 1, 2 or 3 products, and set "Price comes
   from" to the matching bundle product.
2. **Combos** → leave the picker empty to show every published combo, or pick
   and order them explicitly.
3. **Bundles** → each tier block: pick the bundle product and the products for
   the preview strip.
4. **Shop** → point it at a collection, or switch the source to hand-picked.
5. **Reviews** → leave the picker empty to show every published review.

Header and footer are stock Dawn. The prototype's fixed nav is not part of the
five sections; the hero's top padding setting exists so you can dial it down
now that the header no longer overlaps.
