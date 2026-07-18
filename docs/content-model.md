# Content Model — health.tannerwj.com

**Status:** Current conceptual map. For exact fields, valid examples, and the editing workflow, use [content-authoring.md](./content-authoring.md). The executable sources of truth are [src/content.config.ts](../src/content.config.ts) and [scripts/validate-content.ts](../scripts/validate-content.ts).

## Model in one view

~~~text
Markdown editorial entries                    Typed application data
--------------------------                    ----------------------
supplements                                  affiliates.json
sleep                                        calculator/compounds.ts
exercise                                     calculator/blends.ts
protocols
peptides
supplies
follow
~~~

Editorial entries live in src/content/<collection>/<slug>.md; their filename and kebab-case slug must match. The homepage reads curated fields from those same records. Calculator math is separate and uses typed numeric values with explicit units.

## Editorial core

Every live editorial collection uses name, slug, summary, and numeric order; most also accept sources and homepage controls. status is optional for Supplements, Sleep, Exercise, and Protocols, and required only for a personal peptide entry.

- A **personal entry** has Tanner-approved first-person facts and, where relevant, status.
- A **sourced note** preserves an attributed idea without implying Tanner uses it.
- A statusless Supplement with a product link and no sources is a **saved product link**, not a stack item.
- A peptide reference note is entryType: source-note; it requires sources and cannot contain personal dose, timing, frequency, cycle, or effects fields.

featured: true plus status: current makes a personal item homepage-eligible; a peptide additionally must be entryType: personal. homepageOrder is the intentional cross-site sort for featured records.

## Collections and page semantics

| Collection | Distinguishing fields | Page behavior |
| --- | --- | --- |
| Supplements | optional status, dose/timing/frequency, product links | Current, saved product links, considering, previously tried, source notes |
| Sleep | kind | Routine, environment, gear, tracking |
| Exercise | kind | Current split first, then sessions, principles, equipment, recovery, other splits |
| Protocols | kind | Current records first, then testing, therapy, nutrition, recovery, other notes |
| Peptides | entryType, form, category, evidenceMaturity, atAGlance, commonContext, evidenceNote | Personal records by status; reference blends then singles by category |
| Supplies | category: peptide-preparation, plural affiliate keys | Separate peptide supply-link section; not Tanner's setup |
| Follow | handle, URL, group, optional profiles | Longevity, training, sleep, nutrition, general; handles lead |

## Relationships

Sources are practical provenance. Editorial x, website, and study sources need HTTP(S) URLs. Retail URLs live in affiliates.json and are referenced by affiliate keys, not duplicated in content files.

calculatorId is the editorial-to-calculator relationship. It must exactly name a compound or blend ID; a valid relationship opens the calculator with that item selected.

## Calculator data

Compounds and blends are TypeScript records. Mathematical values are structured positive quantities with mg or mcg units; water amounts are positive numeric mL values. A blend contains at least two distinct, known compounds. Reference ranges cite local source IDs and blend presets anchor to an included component.

The calculator catalog can be broader than Tanner’s practice. Browser preferences and saved custom presets remain in localStorage, not repository content.

## Intent

The model favors accurate, glanceable personal reference material over a universal health database. It is strict about IDs, links, math, and labels; prose remains flexible. If repeated real content does not fit, make a deliberate schema change and update the canonical guide with it.
