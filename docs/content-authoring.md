# Content Authoring Guide

**Status:** Canonical operating guide for the live site.  
**Executable source of truth:** src/content.config.ts, then scripts/validate-content.ts. This guide explains those rules; it does not replace them.

This site contains two kinds of public information:

1. **Personal entries** are facts Tanner explicitly supplied or approved as his own current, considering, or previously tried practice.
2. **Sourced notes** preserve useful ideas, products, or reference material from someone else. They must not imply Tanner uses them.

Never turn a source into a claim about Tanner. Never guess a dose, cadence, start date, product, outcome, provider, equipment list, or peptide use. Omit an unknown field.

## Fast path

1. Choose the collection below.
2. Create or edit src/content/<collection>/<slug>.md; filename and kebab-case slug must match.
3. Use first person only for Tanner-approved personal facts. Attribute sourced notes naturally.
4. Add an affiliate key, never a raw retailer URL, when a product link belongs on the card.
5. Run validation, tests, build, and build assertions before publishing.

The build clears stale Astro content caches. Do not commit or manually restore Astro cache files.

## Repository map

| Change | Live location |
| --- | --- |
| Supplements | src/content/supplements/ |
| Sleep | src/content/sleep/ |
| Exercise | src/content/exercise/ |
| Protocols | src/content/protocols/ |
| Peptide reference entries | src/content/peptides/ |
| Peptide-preparation supplies | src/content/supplies/ |
| Follow profiles | src/content/follow/ |
| Affiliate registry | src/data/affiliates.json |
| Calculator compounds | src/data/calculator/compounds.ts |
| Calculator blend variants | src/data/calculator/blends.ts |

Editorial entries are Markdown with YAML frontmatter. Calculator data is TypeScript; display strings from Markdown are never calculator inputs.

## Shared editorial fields

| Field | Required | Rule / behavior |
| --- | --- | --- |
| name | yes | Human-readable card title. |
| slug | yes | Lowercase kebab-case. Must equal the filename without .md; becomes the URL fragment. |
| summary | yes | Short, specific card copy. First person only for approved personal facts. |
| order | yes | Non-negative integer; lower values appear first within a page group. |
| featured | no | Makes an eligible current item available to the homepage. It is not a guarantee. |
| homepageOrder | no | Non-negative integer; unique among featured items that specify it. Lower appears first. |
| started | no | Personal timeline only: YYYY or YYYY-MM. Never infer it from a source date. |
| sources | no | Practical provenance records; shape below. |
| practiceOnly | no | Literal true for a temporary, visibly marked placeholder only. Requires practiceNote. |
| practiceNote | conditional | Required when practiceOnly is true; explains the placeholder. |

Where supported, status is exactly current, considering, or previously-tried. It is not universal.

### Homepage eligibility

Only collections that support status can feed the homepage's current-item module. An entry needs featured: true **and** status: current; a peptide must additionally have entryType: personal. Follow profiles have no status field, so their featured and homepageOrder fields are currently unused by that module. Sourced notes and saved products do not become personal homepage highlights.

Use homepageOrder only for deliberate cross-section placement. Keep values unique and spaced, such as 10, 20, 30.

### Sources

~~~yaml
sources:
  - type: x # x | pep-pedia | website | study | person | conversation
    url: https://x.com/example/status/123 # required for x, website, and study
    author: Example Person
    note: What the source contributes; not a fabricated citation abstract.
    accessed: "2026-07-18" # YYYY-MM-DD
~~~

The collection schema permits URL, author, note, and accessed to be absent, but the validator requires a valid HTTP(S) URL for x, website, and study. pep-pedia, person, and conversation may honestly have no URL. local-file is for calculator source records only, not editorial Markdown.

## Personal entries versus sourced notes

| Situation | Correct shape |
| --- | --- |
| Tanner confirms personal use / consideration / prior use | A record with status, personal wording, and only approved facts. |
| A product is useful but Tanner has not said he uses it | Statusless product record; no personal language. |
| An idea is useful to retain from a source | Statusless entry with sources, neutral attribution, and no invented personal facts. |
| A peptide is library context, not Tanner's practice | entryType: source-note; source required and personal dosing/outcome fields forbidden. |

On Supplements, a statusless affiliate record with no sources is a **Saved product link**. A statusless record with sources is a **Source note**. Sleep, Exercise, and Protocols show statusless sourced records as **Source note**. Do not describe these as Tanner's stack, routine, plan, protocol, or equipment.

## Supplements

**Path:** src/content/supplements/  
**Page groups:** Current, Saved product links, Considering, Previously tried, Source notes.

Required: shared fields. status is optional.

| Field | Meaning |
| --- | --- |
| dose, timing, frequency | Approved display strings only; not calculator inputs. |
| brand, product | Optional product context displayed on the card. |
| affiliate | One affiliate registry key. |
| affiliates | Ordered nonempty keys for intentional product variants. Do not set both singular and plural forms. |

Personal example:

~~~markdown
---
name: Magnesium glycinate
slug: magnesium-glycinate
status: current
summary: I take this before bed as part of my current supplement list.
order: 10
featured: true
homepageOrder: 10
dose: 200 mg
timing: Before bed
frequency: Most evenings
affiliate: amazon-magnesium-glycinate
sources:
  - type: website
    url: https://example.com/magnesium-context
    author: Example publication
    note: Background reading; not a record of my dose.
    accessed: "2026-07-18"
---

Optional context without an unapproved personal outcome.
~~~

Saved product example:

~~~markdown
---
name: Example Ubiquinol
slug: example-ubiquinol
summary: A product link saved for future reference; it is not listed as part of my current stack.
order: 90
brand: Example
product: Ubiquinol 100 mg
affiliate: amazon-nutricost-ubiquinol
---
~~~

## Sleep

**Path:** src/content/sleep/  
**Page groups:** routine, environment, gear, then tracking, preserving order.

Required: shared fields plus kind: routine, environment, gear, or tracking.

Additional fields: status, timing, frequency, spec, brand, product, affiliate, and affiliates. spec is a concrete setup detail, not a made-up product claim. Personal current cards feed the at-a-glance section.

~~~markdown
---
name: Eye mask
slug: eye-mask
kind: gear
status: current
summary: I use an eye mask as part of my sleep setup.
order: 30
spec: Blackout-style mask
affiliate: amazon-eye-mask
---

Optional setup context.
~~~

## Exercise

**Path:** src/content/exercise/  
**Page groups:** current split first, then session, principle, equipment, recovery, and other splits.

Required: shared fields plus kind: split, session, principle, equipment, or recovery.

Additional fields: status, schedule, frequency, duration, spec, brand, product, affiliate, and affiliates.

Only a split with status: current receives the dedicated current-split treatment. Use equipment only for confirmed home-gym items; an author's recommendation belongs in a sourced note.

~~~markdown
---
name: Adjustable dumbbells
slug: adjustable-dumbbells
kind: equipment
status: current
summary: I keep adjustable dumbbells in my home gym for compact strength work.
order: 40
spec: Adjustable pair; exact model not recorded
---
~~~

Sourced exercise-note example:

~~~markdown
---
name: Split squat progression
slug: split-squat-progression
kind: session
summary: ATG coaching uses assistance, range, and elevation changes before adding load.
order: 150
sources:
  - type: website
    url: https://example.com/atg-guide
    author: Example coach
    note: Progression context only.
    accessed: "2026-07-18"
---
~~~

## Protocols

**Path:** src/content/protocols/  
**Page groups:** personal current records first; remaining records group by kind.

Required: shared fields plus kind: testing, therapy, nutrition, recovery, or other.

Additional fields: status, cadence, provider, service, location, markers (a string list), and a singular affiliate. Protocols do **not** support plural affiliates.

This is not a lab-result log. Do not publish raw bloodwork, diagnoses, or sensitive provider information without an explicit product decision.

~~~markdown
---
name: Vitamin D status
slug: vitamin-d-status
kind: testing
summary: Rhonda Patrick discusses testing vitamin D, addressing low status, and retesting rather than guessing indefinitely.
order: 70
sources:
  - type: website
    url: https://example.com/vitamin-d
    author: FoundMyFitness
    note: Status-and-retesting context.
    accessed: "2026-07-18"
---
~~~

## Peptide reference library

**Path:** src/content/peptides/  
**Page groups:** personal entries by status; source-note blends first, then source-note singles by category. The collection may honestly have zero entries.

Every peptide entry requires the shared core plus:

| Field | Values / purpose |
| --- | --- |
| entryType | personal or source-note |
| form | single or blend |
| category | repair, growth-hormone, metabolic, immune, pigmentation-sexual-health, or longevity-sleep |
| evidenceMaturity | established-human-use, human-trial, limited-human, preclinical, or component-extrapolation |
| atAGlance | Compact card-level takeaway. |
| commonContext | What it is commonly discussed around; never a prescription. |
| evidenceNote | Plain-language evidence context and limitation. |

Optional fields are calculatorId, aliases, components, mechanism, route, dose, timing, frequency, cycle, vial, reconstitution, storage, effects, sideEffects, contraindications, and sources.

calculatorId must exactly match a compound ID in compounds.ts or a blend ID in blends.ts. A valid relationship makes the card's calculator link preselect that item. An invalid nonempty value fails validation.

### Personal peptide

A personal peptide **requires status**. Add route, dose, timing, cycle, effects, or other personal facts only when Tanner approves them.

~~~markdown
---
name: Example peptide
slug: example-peptide
entryType: personal
status: considering
form: single
category: metabolic
evidenceMaturity: limited-human
summary: I am considering this item and have not recorded a personal protocol here.
atAGlance: A single-compound item I am considering.
commonContext: Often discussed in metabolic research contexts.
evidenceNote: Human evidence is limited and does not establish an individual outcome.
order: 20
sources:
  - type: website
    url: https://example.com/source
    author: Example source
    note: Identity and evidence context.
    accessed: "2026-07-18"
---
~~~

This schematic example deliberately omits calculatorId. Add that field only when its value exactly matches a curated compound or blend catalog ID.

### Peptide source note

A source-note requires at least one source and may **not** contain dose, timing, frequency, cycle, or effects. Do not move those personal details into the summary or Markdown body.

~~~markdown
---
name: GLOW
slug: glow
entryType: source-note
form: blend
category: repair
evidenceMaturity: component-extrapolation
calculatorId: glow-57-27-12-54-10-45
summary: A named GHK-Cu, BPC-157, and TB-500 blend.
atAGlance: A three-component blend whose evidence is inherited from its ingredients, not the named vial.
components:
  - 57.27 mg GHK-Cu
  - 12.54 mg BPC-157
  - 10.45 mg TB-500
commonContext: Marketed in tissue, skin, and recovery conversations.
evidenceNote: The named blend has no established clinical evidence as a combined formulation.
order: 10
sources:
  - type: pep-pedia
    author: Pep-Pedia-derived dataset
    note: Identity context only; dosing and outcome claims excluded.
    accessed: "2026-07-18"
---
~~~

For a blend, components is human-readable reference copy; the exact mathematical formulation belongs in the calculator blend record. A market name is not a universal formula.

## Peptide-preparation supplies

**Path:** src/content/supplies/  
**Page behavior:** separate Supply links section on /peptides; it does not describe Tanner's current setup.

Required: name, slug, summary, order, category: peptide-preparation, and a nonempty plural affiliates list. No body or source is required by the current schema.

~~~markdown
---
name: Easy Touch Insulin Syringes
slug: easy-touch-insulin-syringes
summary: 31-gauge, 0.3 cc syringes with 5/16-inch needles, supplied in a 100-count box.
order: 10
category: peptide-preparation
affiliates:
  - amazon-easy-touch-insulin-syringes
---
~~~

Do not add peptide vendor links. These are supply links, not endorsements or current-use records.

## Follow profiles

**Path:** src/content/follow/  
**Page groups:** longevity, training, sleep, nutrition, then general.

Required: name, slug, handle, url, group, summary, and order. group is exactly one of the listed page groups. platform defaults to x.

Use profiles for a primary account plus related accounts. If omitted, the top-level handle, url, and platform form the one profile. Write a first-person reason only when Tanner actually follows the account.

~~~markdown
---
name: Rhonda Patrick
slug: rhonda-patrick
handle: "@foundmyfitness"
url: https://x.com/foundmyfitness
profiles:
  - handle: "@foundmyfitness"
    url: https://x.com/foundmyfitness
    platform: x
  - handle: "@fmfclips"
    url: https://x.com/fmfclips
    platform: x
group: longevity
summary: I read FoundMyFitness for research-heavy context on longevity, micronutrients, sleep, heat exposure, and metabolism.
order: 30
---
~~~

## Affiliate registry and disclosure

**Registry:** src/data/affiliates.json. Every registry key is kebab-case and represents a single exact product or a search/options page.

~~~json
{
  "amazon-example-product": {
    "vendor": "Amazon",
    "product": "Example Product, 60 capsules",
    "kind": "product",
    "asin": "B012345678",
    "url": "https://amzn.to/example"
  },
  "amazon-example-search": {
    "vendor": "Amazon",
    "product": "Example product search results",
    "kind": "search",
    "url": "https://www.amazon.com/s?k=example&tag=tannerwj-20"
  }
}
~~~

Rules:

- kind: product is an exact product; kind: search is a search/options page. Use a kind for new records.
- A present asin is exactly ten uppercase letters/digits; never invent it.
- Preserve supplied Amazon short URLs exactly. Do not exchange a known product link for a search result or alter its tag.
- affiliate is one key. affiliates is ordered plural keys for variants. Supplements, Sleep, Exercise, and Supplies support plural links; Protocols supports only singular.
- Pages with Amazon links use the shared disclosure component. Do not handwrite a competing disclosure in an item body.
- Registry rendering provides the sponsored link relationship; do not bypass it with raw Markdown product links.

## Calculator catalog

The calculator is separate from the editorial peptide library. A catalog record can be broadly useful without being Tanner's practice, while an editorial peptide record can deep-link into it.

### Compounds

**File:** src/data/calculator/compounds.ts  
**Type:** Compound in src/data/calculator/types.ts

Every mathematical mass is a positive structured number with an explicit unit:

~~~ts
{
  id: "example-peptide",
  name: "Example Peptide",
  commonVials: [{ value: 5, unit: "mg" }],
  commonWaterMl: [1, 2],
  dosePresets: [{ label: "Community reference", value: 250, unit: "mcg" }],
  referenceRanges: [{
    label: "Community reference",
    kind: "community",
    min: { value: 250, unit: "mcg" },
    max: { value: 500, unit: "mcg" },
    sourceIds: ["example-source"]
  }],
  sources: [{
    id: "example-source",
    type: "website",
    url: "https://example.com/source",
    note: "Identity and reference context.",
    accessed: "2026-07-18"
  }]
}
~~~

Allowed mass units are only mcg and mg; water is a positive numeric mL value. Never use a display string such as "5 mg" for calculator math. IDs are unique across compounds and blends. A range's sourceIds must exist in its compound's own sources. Calculator sources support editorial source types plus local-file.

practiceOnly: true requires practiceNote. It never turns community data into Tanner defaults. Reference-range kind is tanner, community, or other, according to actual context.

### Blend variants

**File:** src/data/calculator/blends.ts  
**Type:** BlendVariant

A blend needs a unique ID, name, variant label, at least two distinct known compound IDs, and an explicit positive amount for every component:

~~~ts
{
  id: "example-blend-5-2",
  name: "Example Blend",
  variant: "5 mg Example A / 2 mg Example B",
  components: [
    { compoundId: "example-a", amount: { value: 5, unit: "mg" } },
    { compoundId: "example-b", amount: { value: 2, unit: "mg" } }
  ],
  commonWaterMl: [2, 3],
  dosePresets: [{
    label: "Reference anchored to Example A",
    anchorCompoundId: "example-a",
    target: { value: 250, unit: "mcg" }
  }],
  featured: true,
  editable: true,
  sources: [{
    id: "example-blend-source",
    type: "website",
    url: "https://example.com/blend",
    note: "Exact composition context.",
    accessed: "2026-07-18"
  }]
}
~~~

anchorCompoundId must identify a component in that blend. Calculator featured and editable control calculator behavior, not homepage layout. Create a separate variant for a different composition; do not overwrite a blend because a market name matches.

Favorites, recents, display/syringe preferences, and saved custom presets belong to browser localStorage, never to editorial Markdown or committed user data.

## Validation and review

Run from the repository root:

~~~sh
npm run validate
npm test
npm run build
npm run assert:build
~~~

npm run check runs the first two. Use all four before a production content change. Also inspect the affected route on desktop and mobile; for affiliate, calculator, or deep-link changes, verify the rendered card/link as well as the source file.

The integrity check covers collection presence (peptides may be empty), duplicate and filename-mismatched slugs, affiliate keys/URLs/ASINs, calculator relationships, peptide source-note restrictions, source URL/date shape, homepage-order collisions, and calculator units, sources, ranges, blend components, and anchors.

## Common failures

| Failure | Fix |
| --- | --- |
| slug-filename-mismatch | Make filename and frontmatter slug exactly match. |
| unknown-affiliate | Add a registry record first or use the existing exact key. |
| unknown-calculator-id | Use a compound/blend ID that exists or omit the deep link until curated. |
| missing-personal-status | Add a real status to a personal peptide, or use a source note. |
| source-note-personal-field | Remove personal dose/timing/frequency/cycle/effects from peptide source notes. |
| missing-source-url | Add HTTP(S) URL to an x, website, or study source. |
| homepage-order-collision | Give featured records distinct homepage order values. |
| invalid-asin | Use a verified 10-character ASIN or omit it. |
| missing-unit / invalid-quantity | Use a positive numeric calculator quantity and mg or mcg. |
| unknown-blend-compound / unknown-blend-anchor | Add/correct the compound or anchor ID. |
| Source note reads as Tanner's practice | Remove first-person copy and status; identify the source. |

## Editorial quality bar

- Use ordinary, specific language rather than generic “optimized,” “evidence-led,” or “useful when…” copy.
- Make cards glanceable: what it is, whose idea or practice it is, and the one detail that matters.
- Treat source links as context, not a veneer of certainty. Preserve caveats, especially for peptides.
- Use exact product links for exact products and search/options links only when the exact item is unknown.
- If a real repeated item does not fit, propose a schema change and update this guide with the code. Do not smuggle a new schema into arbitrary YAML.

For a concise conceptual overview, see content-model.md. For a session-oriented intake checklist, see seed-data-brief.md.
