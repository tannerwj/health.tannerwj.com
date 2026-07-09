# Content Model — health.tannerwj.com

**Date:** 2026-07-09  
**Status:** Defined for implementation; expected to evolve with real content

## Principles

1. Model the way Tanner thinks about the content, not an abstract universal health record.
2. Share only fields that are truly common. Supplements, routines, training splits, protocols, people, and peptides may have different shapes.
3. Keep prose pleasant to edit. Editorial content uses Markdown with YAML frontmatter.
4. Keep application data unambiguous. Calculator entities use typed data with explicit numeric values and units.
5. Curate the homepage. It references section content rather than duplicating it, but not every current item belongs there.
6. Treat sources as useful provenance. X, Pep-Pedia, websites, studies, people, and conversations are all valid source types.
7. Validate mechanical facts strictly and prose lightly. The model should catch broken math and references without making ordinary edits tedious.

## Proposed Content Layout

```text
src/
  content/
    supplements/
    sleep/
    exercise/
    protocols/
    peptides/
    follow/
  data/
    calculator/
      compounds.yaml
      blends.yaml
    affiliates.json
```

The exact file format for calculator data may become TypeScript instead of YAML during implementation if that produces clearer type inference. The logical model below stays the same.

## Shared Editorial Fields

These fields are reusable building blocks, not mandatory fields on every collection.

| Field | Type | Use |
|---|---|---|
| `name` | string | Display name |
| `slug` | kebab-case string | Stable identity and route fragment; should match the filename where practical |
| `summary` | string | Terse first-person explanation or value statement |
| `status` | enum | `current`, `considering`, or `previously-tried`, only where the distinction makes sense |
| `order` | integer | Deliberate order within a section or group |
| `featured` | boolean | Eligible for a homepage highlight |
| `homepageOrder` | integer | Ordering among featured homepage items |
| `started` | `YYYY` or `YYYY-MM` string | Optional personal timeline note |
| `sources` | source[] | Optional practical provenance |

### Source

```yaml
sources:
  - type: x
    url: https://x.com/example/status/123
    author: "@example"
    note: What was useful or what it prompted me to change.
    accessed: 2026-07-09
```

`type` is one of `x`, `pep-pedia`, `website`, `study`, `person`, or `conversation`. Only web-addressable sources require a URL. `note` should capture why the source matters rather than pretending to be a formal citation abstract.

## Section Models

These are initial models. Fields can be added or split after representative content exposes a better structure.

### Supplements

One entry per supplement or combined product.

Required:

- `name`, `slug`, `status`, `summary`, `order`

Optional:

- `dose`: display string such as `400 mg`
- `timing`: display string such as `before bed`
- `frequency`: display string when timing alone is insufficient
- `brand`, `product`
- `affiliate`: key into the affiliate registry
- `featured`, `homepageOrder`, `started`, `sources`
- Markdown body for nuance, observed effects, or changes over time

### Sleep

Sleep contains unlike things, so each entry declares a kind.

Required:

- `name`, `slug`, `kind`, `summary`, `order`

`kind` is one of:

- `routine`: a behavior or wind-down step
- `environment`: light, temperature, noise, blackout, or room setup
- `gear`: mattress, mask, device, bedding, or similar product
- `tracking`: how sleep is measured or reviewed

Optional:

- `status` when useful
- `timing`, `frequency`, `spec`
- `brand`, `product`, `affiliate`
- `featured`, `homepageOrder`, `started`, `sources`
- Markdown body

### Exercise

Exercise entries describe meaningful parts of the current approach rather than pretending every workout is a stack item.

Required:

- `name`, `slug`, `kind`, `summary`, `order`

`kind` is one of:

- `split`: a current training split or weekly structure
- `session`: a recurring workout or conditioning session
- `principle`: a training philosophy or rule
- `equipment`: meaningful home or gym equipment
- `recovery`: an exercise-specific recovery practice

Optional:

- `status`, `schedule`, `frequency`, `duration`, `spec`
- `brand`, `product`, `affiliate`
- `featured`, `homepageOrder`, `started`, `sources`
- Markdown body, including tables or lists for a split when useful

The model intentionally does not attempt to become a workout logger.

### Protocols

Protocols are higher-level practices and testing cadences.

Required:

- `name`, `slug`, `kind`, `summary`, `order`

`kind` is one of:

- `testing`: bloodwork or another recurring test
- `therapy`: TRT or another supervised therapy Tanner wants to mention
- `nutrition`: fasting or another structured nutrition practice
- `recovery`: sauna, cold exposure, or another recovery protocol
- `other`: escape hatch for practices that do not fit yet

Optional:

- `status`, `cadence`, `provider`, `service`, `location`
- `markers`: short list of named markers for testing entries
- `affiliate` where appropriate
- `featured`, `homepageOrder`, `started`, `sources`
- Markdown body for what Tanner tests, why, through whom, and any high-level notes

V1 stays high level. It does not store personal lab results or implement a health ledger.

### Editorial Peptides

This collection contains only peptides Tanner is using, has used, or might use. It does not need to match the broader calculator catalog.

Required:

- `name`, `slug`, `status`, `summary`, `order`

Optional:

- `calculatorId`: reference to a calculator compound
- `form`: `single` or `blend`
- `route`, `dose`, `timing`, `frequency`, `cycle`
- `vial`, `reconstitution`, `storage`
- `mechanism`: short practical description
- `effects`: what Tanner noticed or expects
- `sideEffects`, `contraindications`: concise lists when useful
- `featured`, `homepageOrder`, `started`, `sources`
- Markdown body for personal experience and expandable detail

Not every peptide entry needs every clinical-detail field. Practical usefulness is the bar.

### Follow

One entry per person or account worth following.

Required:

- `name`, `slug`, `handle`, `url`, `group`, `summary`, `order`

`group` starts with `longevity`, `training`, `sleep`, `nutrition`, or `general`, but may expand with the content.

Optional:

- `platform`, defaulting to `x`
- `featured`, `homepageOrder`
- Markdown body for a longer description or favorite starting points

`status` is unnecessary here unless a future use case makes it valuable.

## Homepage Composition

The homepage consumes, but does not duplicate, section content.

- `featured: true` makes an entry eligible for a homepage module.
- `homepageOrder` creates a deliberate cross-section sequence.
- Each section page keeps its own `order` and grouping.
- Homepage modules may choose a compact presentation per section; they do not have to render every field from the source entry.
- Navigation and section descriptions are page-level interface content, not fake collection entries.

If frontmatter flags become too limiting during visual exploration, a small `homepage.yaml` composition file may reference entries by collection and slug. That is preferable to copying their facts into a second location.

## Calculator Model

The calculator is separate from editorial peptide content. It has a broad, curated catalog and supports both single-compound and named multi-compound vials.

### Quantity

All quantities used in math are structured:

```yaml
value: 5
unit: mg
```

Allowed mass units begin with `mcg` and `mg`; volume units begin with `mL`. Values used in calculations must be numeric and positive. Display strings are never parsed to perform math.

### Compound

```yaml
id: bpc-157
name: BPC-157
aliases: []
commonVials:
  - value: 5
    unit: mg
commonWaterMl: [1, 2, 3]
dosePresets:
  - label: Common reference
    value: 250
    unit: mcg
referenceRanges:
  - label: Common reference
    kind: community
    min:
      value: 250
      unit: mcg
    max:
      value: 500
      unit: mcg
    sourceIds: [pep-pedia-bpc-157]
sources:
  - id: pep-pedia-bpc-157
    type: pep-pedia
    url: https://pep-pedia.org/...
```

Fields:

- Required: `id`, `name`
- Optional: aliases, description, common vial amounts, common water volumes, dose presets, reference ranges, source notes, and Tanner-specific defaults
- A reference-range `kind` may be `tanner`, `community`, or `other`. The point is to distinguish Tanner's target from a useful general reference, not to grade evidence.

The old Pep-Pedia-derived dataset is input to curation, not loaded directly at runtime.

### Blend Vial

```yaml
id: wolverine-5-5
name: Wolverine
variant: 5 mg / 5 mg
components:
  - compoundId: bpc-157
    amount:
      value: 5
      unit: mg
  - compoundId: tb-500
    amount:
      value: 5
      unit: mg
commonWaterMl: [2, 3]
dosePresets:
  - label: My usual draw
    anchorCompoundId: bpc-157
    target:
      value: 250
      unit: mcg
featured: true
editable: true
```

Fields:

- Required: `id`, `name`, and at least two components
- Every component requires a valid `compoundId` and an explicit quantity
- Named blends may have multiple variants because GLOW, KLOW, Wolverine, Beauty, and similar names do not guarantee one universal composition
- A blend dose preset identifies an anchor component and its desired delivered amount; the calculator derives the shared draw and shows the amount delivered for every other component
- Users can edit component amounts in the calculator and save the result as a local custom preset

### Client-Side Preferences

Stored in versioned `localStorage`, never in editorial content:

- Favorite compound and blend IDs
- Recent selections
- Preferred syringe capacity
- Preferred dose display unit
- Last-used water volume and other convenience defaults
- Custom compound or blend presets
- Theme preference if the selected visual system includes a manual theme control

Preferences should survive ordinary catalog additions. A storage-version migration or graceful reset handles breaking schema changes.

### Shareable Calculator State

The URL may encode enough state to reproduce a calculation:

- Mode: single or blend
- Catalog entity or custom components
- Vial quantities
- Water volume
- Desired dose or syringe draw
- Syringe capacity

Favorites, recents, and unrelated preferences remain local and are not included in shared URLs.

## Validation and Integrity Checks

The build should fail for:

- Duplicate IDs or slugs within a namespace
- Invalid or nonpositive calculator quantities
- Missing units on calculator quantities
- A blend referencing an unknown compound
- A peptide entry referencing an unknown `calculatorId`
- An affiliate key that does not exist in `affiliates.json`
- Duplicate or invalid homepage ordering where ordering must be unique
- A malformed web URL when a URL is supplied

The build should not fail merely because an optional narrative field or source note is absent.

## Expected Evolution

Before locking schemas, author representative entries for every section. If content repeatedly fights a field, change the model. The goal is a reliable editing workflow, not schema purity.
