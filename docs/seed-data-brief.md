# Seed Data Brief — health.tannerwj.com

**Purpose:** Instructions for helping Tanner author representative and launch content for the site. Produce clean Markdown entries that follow [`content-model.md`](./content-model.md), but change the model when real content exposes a better structure.

## How to Work with Tanner

- Work one section at a time. Do not ask for the entire health stack at once.
- Start with what Tanner actually does and how he describes it. Preserve his vocabulary.
- Voice is first person, terse, and direct: “I take 400 mg magnesium glycinate before bed because it helps me fall asleep.”
- If Tanner names an X post, Pep-Pedia page, website, study, person, or conversation, capture it as practical source provenance.
- Do not turn ordinary authoring into a formal research review. Sources should help Tanner remember where an idea came from and allow useful details to be revisited.
- Ask for missing mechanical facts that affect display or math, especially dose units and blend composition. Do not invent those values.
- One file per editorial item. Filename is the kebab-case slug.
- Practice data is acceptable during private development. Replace it before launch where it would otherwise read as a false claim about Tanner.

## Shared Editorial Pattern

Collections reuse a small set of fields where appropriate:

```markdown
---
name: Magnesium Glycinate
slug: magnesium-glycinate
status: current
summary: I take this before bed because it helps me wind down.
order: 10
featured: true
homepageOrder: 20
started: 2026-03
sources:
  - type: x
    url: https://x.com/example/status/123
    author: "@example"
    note: Prompted me to try it before bed.
    accessed: 2026-07-09
---

Optional longer prose goes here when there is something useful beyond the
frontmatter.
```

This is a pattern, not a universal schema. Use only fields supported by the relevant section model.

### Editorial Rules

- `summary` is usually the most important field: concrete, first-person, and quick to scan.
- `status` is `current`, `considering`, or `previously-tried` where that distinction is useful.
- `order` is deliberate; do not rely on alphabetical filenames for presentation.
- `featured` means suitable for homepage consideration, not automatically entitled to a large homepage module.
- `affiliate` contains only a registry key. URLs remain centralized.
- The Markdown body holds nuance, personal experience, tables, protocols, or expandable detail.

## Section Interviews

### Supplements

For each supplement or combined product, ask:

- What is it?
- Are you taking it, considering it, or did you stop?
- How much, when, and how often?
- Why do you use it, in your own words?
- Which brand or exact product?
- Is there a source or person that prompted it?
- Should it be a homepage highlight?

Useful fields: `dose`, `timing`, `frequency`, `brand`, `product`, `affiliate`.

### Sleep

Capture routines, environment, gear, and tracking separately. Ask Tanner to walk through a typical night, then identify the few things that materially matter.

Each item has `kind: routine | environment | gear | tracking`. Use `timing`, `frequency`, `spec`, brand, product, and affiliate fields only where relevant.

### Exercise

Start with the current weekly shape, then capture important sessions, principles, equipment, and recovery practices.

Each item has `kind: split | session | principle | equipment | recovery`. A training split may use its Markdown body for a concise table or list. Do not model daily workout logs.

### Protocols

Capture high-level testing, therapies, nutrition practices, and recovery protocols.

Each item has `kind: testing | therapy | nutrition | recovery | other`. For bloodwork, ask what Tanner tests, how often, and through whom. Do not collect personal lab results for v1.

Useful fields: `cadence`, `provider`, `service`, `location`, and a short `markers` list.

### Editorial Peptides

Only create editorial entries for peptides Tanner is using, has used, or might use. Ask:

- Which status applies?
- Is it a single compound or a named blend?
- What does Tanner use or consider it for?
- What vial and composition does he encounter?
- What dose, timing, route, cycle, reconstitution, or storage detail is useful to him?
- What did he notice, and would he use it again?
- What X post, Pep-Pedia page, website, or other source was useful?

Use practical fields such as `dose`, `route`, `cycle`, `vial`, `reconstitution`, `mechanism`, `effects`, `sideEffects`, and `sources` only when they add value. Connect to the calculator with `calculatorId` when a matching catalog item exists.

### Follow

For each person or account, capture:

- Name, handle, and profile URL
- Topic group
- A terse explanation of why Tanner follows them
- Whether they deserve a homepage highlight

Do not add dose, timing, brand, or status fields.

## Calculator Curation

Calculator data is not authored as editorial Markdown. Curate it separately from the old Pep-Pedia-derived data and other useful sources.

For a compound, capture:

- Stable ID and display name
- Explicit common vial quantities with numeric values and units
- Common BAC-water volumes
- Useful dose presets or reference ranges, labeled as Tanner-specific or community reference
- Source notes when available

For a named blend such as GLOW, KLOW, Wolverine, or Beauty, capture:

- Name and variant label
- Every component with a compound ID, numeric amount, and explicit unit
- Common water volumes
- Tanner's preferred defaults where applicable
- Alternate formulations as separate variants rather than pretending the name has one fixed recipe

The 68-entry old dataset is a discovery pool. It does not need to be migrated in full, and its loose display strings should never be parsed for calculator math.

## Coverage Checklist

- [ ] Supplements: enough representative items to test dose, timing, brand, grouping, and affiliates
- [ ] Sleep: at least one routine, environment item, gear item, and tracking item if applicable
- [ ] Exercise: a current split plus representative principles, sessions, or equipment
- [ ] Protocols: bloodwork cadence/provider plus other practices Tanner wants public
- [ ] Peptides: representative current, considering, and previously-tried entries
- [ ] Follow: enough accounts to test multiple topic groups
- [ ] Calculator compounds: enough singles to exercise unit conversion and presets
- [ ] Calculator blends: GLOW, KLOW, Wolverine, Beauty, and Tanner's actual variants as known
- [ ] Homepage: identify a small set of featured items across the site

## Output During Content Work

Put finished editorial entries in `docs/seed-content/<section>/<slug>.md` until the application collections exist. Keep calculator research in a separate structured draft so it cannot be confused with published runtime data.

After each section:

1. List what was created.
2. Flag missing mechanical facts.
3. Note any fields that felt forced or any recurring content that the current model cannot express cleanly.
4. Recommend a schema adjustment when the content warrants it.
