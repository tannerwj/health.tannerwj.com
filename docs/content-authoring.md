# Content Authoring Guide

**Executable source of truth:** [`src/content.config.ts`](../src/content.config.ts), then [`scripts/validate-content.ts`](../scripts/validate-content.ts). This guide explains those rules and does not replace them. When they disagree, the code is right.

## The one rule that matters

Two kinds of information live here:

1. **Personal entries** — what Tanner actually does, supplied or approved by him.
2. **Sourced notes** — ideas worth keeping from someone else, written so they cannot be mistaken for his practice.

Never turn a source into a claim about Tanner. Never invent a dose, cadence, product, outcome, provider, or peptide use. Omit unknown fields rather than guessing or writing a placeholder.

The supplements page is a special case: it lists what Tanner takes plus saved product links. It is deliberately **not** a catalog of supplements he does not take.

## Fast path

1. Pick the collection: `src/content/<collection>/<slug>.md`.
2. Filename and frontmatter `slug` must match exactly, lowercase kebab-case.
3. First person only for approved personal facts.
4. Product links use an affiliate key from [`src/data/affiliates.json`](../src/data/affiliates.json), never a raw URL.
5. Run `npm run check && npm run build && npm run assert:build`.

## Voice

Write like Tanner explaining something to a friend who asked, not like a paper defending itself.

- **Hedge once, not every paragraph.** State the caveat that would change someone's decision — an interaction, a side effect, a reason to skip it — then stop. Trailing disclaimers like "that is not evidence that…", "the durable idea is…", or "not a settled conclusion" are the clearest tell of machine-written copy.
- **Don't restate the summary in the first line of the body.** The card already shows it.
- **Lead personal entries with specifics:** dose, when, how long, what happened. Put them in `dose`/`timing`/`frequency` so the cards carry them.
- **Sources are "who convinced me," not a citation wall.** A source `note` should say something; "Sleep toolkit context for X" is a label, not information.
- **Peptides keep their caveats.** These are unregulated injectables and the warnings are load-bearing. Plain and once, not hedged and repeatedly.
- **No filler section descriptions.** If a heading says "Before bed," it does not need a subtitle explaining that this is what he takes before bed.

## Shared fields

| Field | Required | Rule |
| --- | --- | --- |
| `name` | yes | Card title. |
| `slug` | yes | Kebab-case, equals the filename, becomes the URL fragment. |
| `summary` | yes | Short, specific card copy. |
| `order` | yes | Non-negative integer; sorts within a page group. |
| `featured` | no | Makes an eligible current item available to the homepage. |
| `homepageOrder` | no | **Unique site-wide** across featured entries. Space them: 10, 20, 30. |
| `sources` | no | See below. |
| `practiceOnly` / `practiceNote` | no | Literal `true` plus an explanation, for visibly marked placeholders only. |

Where supported, `status` is exactly `current`, `considering`, or `previously-tried`.

**Homepage eligibility:** `featured: true` **and** `status: current`; peptides additionally need `entryType: personal`. Follow profiles have no status, so their `featured`/`homepageOrder` are unused.

**Sources:**

~~~yaml
sources:
  - type: x            # x | pep-pedia | website | study | person | conversation
    url: https://...   # required by the validator for x, website, and study
    author: Example Person
    note: What this source actually contributes.
    accessed: "2026-07-18"
~~~

`pep-pedia`, `person`, and `conversation` may honestly have no URL. `local-file` is for calculator sources only.

## Collections

Each collection adds fields to the shared set. The authoritative list is [`src/content.config.ts`](../src/content.config.ts); below is the intent behind the ones that need explaining.

### Supplements

Page groups: time-of-day groups for current items, then Saved product links, Considering, Previously tried, Source notes.

| Field | Meaning |
| --- | --- |
| `when` | `morning`, `daytime`, `evening`, or `bedtime`. Groups current items by when they are actually taken, so things taken together render together. A current item with no `when` falls into a trailing "Current" group. |
| `tier` | Only `foundational` — the short "start here" list you would hand a curious friend. Renders a badge. Never on a sourced note. |
| `stacks` | Other stack pages this item belongs on, e.g. `[sleep]`. The target page links back rather than duplicating. |
| `dose`, `timing`, `frequency` | Approved display strings. Never calculator inputs. |
| `brand`, `product` | Product context on the card. |
| `affiliate` / `affiliates` | One key, or an ordered list for intentional variants. Never both. |

### Sleep

Requires `kind`: `routine`, `environment`, `gear`, or `tracking`. Adds `status`, `tier`, `timing`, `frequency`, `spec`, and product fields. Current personal cards feed the at-a-glance strip. Supplements with `stacks: [sleep]` render in their own section linking back to `/supplements`.

### Exercise

Requires `kind`: `split`, `session`, `principle`, `equipment`, or `recovery`. Adds `status`, `tier`, `schedule`, `frequency`, `duration`, `spec`, and product fields. Only a split with `status: current` gets the dedicated treatment. Use `equipment` only for confirmed home-gym items.

### Protocols

Requires `kind`: `testing`, `therapy`, `nutrition`, `recovery`, or `other`. Adds `status`, `tier`, `cadence`, `provider`, `service`, `location`, `markers`, and a **singular** `affiliate` only. Not a lab-result log — no raw bloodwork or sensitive provider details.

### Peptides

Requires `entryType` (`personal` | `source-note`), `form` (`single` | `blend`), `category`, `evidenceMaturity`, plus `atAGlance`, `commonContext`, and `evidenceNote`.

- A **personal** entry requires `status`.
- A **source-note** requires at least one source and may **not** contain `dose`, `timing`, `frequency`, `cycle`, or `effects` — including smuggled into the summary or body.
- `calculatorId` must exactly match a compound ID in `compounds.ts` or a blend ID in `blends.ts`. Omit it rather than guessing; a blend name is not a formula.

### Supplies

Requires `name`, `slug`, `summary`, `order`, `category: peptide-preparation`, and a nonempty `affiliates` list. Supply links only — no peptide vendors.

### Follow

Requires `name`, `slug`, `handle`, `url`, `group`, `summary`, `order`. Use `profiles` for a primary account plus related ones. Write a first-person reason only if Tanner actually follows the account.

## Affiliates

Every key in `src/data/affiliates.json` is kebab-case and points at one exact product or one search page.

- `kind: product` is an exact item; `kind: search` is an options page. Never present a search link as a product he chose.
- A present `asin` is exactly ten uppercase alphanumerics. Never invent one — resolve it from the real link or omit it.
- Preserve supplied `amzn.to` short URLs exactly; do not append parameters.
- The affiliate disclosure is stated **once, in the site footer** (`FOOTER_DISCLOSURE` in `src/data/site.ts`). Do not add a per-page disclosure component or handwrite one in an item body.
- Shared rendering supplies `rel="sponsored noreferrer"`. Do not bypass it with raw Markdown links.

## Calculator catalog

Separate from the editorial library. Editorial Markdown never feeds calculator math.

- Masses are structured and positive with an explicit unit — `mcg` or `mg` only. Never a display string like `"5 mg"`.
- IDs are unique across compounds and blends. A range's `sourceIds` must exist in that compound's own sources.
- A blend needs a unique ID, a variant label, at least two distinct known compound IDs, and an explicit positive amount per component. `anchorCompoundId` must name one of its own components.
- A different composition means a new variant, never an overwrite.
- Favorites, recents, and saved presets are browser `localStorage`. Never committed.

## Validation

~~~sh
npm run check        # validate + tests
npm run build
npm run assert:build
~~~

The whole gate runs in under ten seconds. Also look at the affected route at mobile and desktop width.

Content files are LF-only, enforced by `.gitattributes` and a test. Frontmatter readers go through `readTextFile` / `parseFrontmatter` in `scripts/validate-content.ts`, which normalize newlines — do not hand-roll a `^---\n` match.

## Common failures

| Failure | Fix |
| --- | --- |
| `slug-filename-mismatch` | Make filename and `slug` match exactly. |
| `unknown-affiliate` | Add the registry record first, or use the existing key. |
| `unknown-calculator-id` | Use a real compound/blend ID, or omit the deep link. |
| `missing-personal-status` | Add a status, or make it a source note. |
| `source-note-personal-field` | Remove dose/timing/frequency/cycle/effects from peptide source notes. |
| `missing-source-url` | Add an HTTP(S) URL to an `x`, `website`, or `study` source. |
| `homepage-order-collision` | `homepageOrder` is unique site-wide, not per collection. |
| `invalid-asin` | Use a verified 10-character ASIN or omit it. |
| `missing-unit` / `invalid-quantity` | Positive number plus `mg` or `mcg`. |
| Source note reads as practice | Remove first-person copy and status; name the source. |

Calculator feature ideas that are not yet built live in [calculator-ideas.md](./calculator-ideas.md).
