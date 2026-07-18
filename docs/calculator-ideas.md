# Peptide Calculator — Historical Ideas and Context

> **Historical idea backlog.** The calculator is implemented and its current data contract lives in [content-authoring.md](./content-authoring.md#calculator-catalog), [src/data/calculator/types.ts](../src/data/calculator/types.ts), [src/data/calculator/compounds.ts](../src/data/calculator/compounds.ts), and [src/data/calculator/blends.ts](../src/data/calculator/blends.ts). Treat this document as product context, not a specification for current behavior or a license to add personal defaults.

From a survey of 13 calculators (PeptideFox, PeptideDoseCalculator, PeptideMind, CalcMyPeptide, Rite Aid, Jay Campbell, Cellgenic, PeptIndex, et al.). Goal: clean, intuitive, useful — a broad catalog of common peptides and named blends, with Tanner's own choices and defaults featured where relevant.

The calculator is a utility on its own page, not the center of the health site. Its data model is separate from the editorial `/peptides` page: the implemented editorial page contains both Tanner’s personal entries and sourced reference notes, while the calculator may include other common compounds.

## Historical baseline

This list predates the current implementation. Verify current UI behavior, tests, and data before treating any item as present or planned.

## Table stakes (must have)
- Vial mg + BAC water mL → concentration
- Desired dose → **units to draw on a U-100 syringe** (the single most-wanted output)
- mcg/mg toggle on dose entry
- Syringe-size selector (0.3/0.5/1.0 mL = 30/50/100-unit U-100 syringes)
- Preset chips for common vial sizes / water volumes / doses, always with a custom "Other" escape hatch
- Live recalc, no submit button
- Doses-per-vial (trivial, half the field omits it — always show it)

## Best ideas to steal (ranked)
1. **Visual syringe with exact fill line + tick labels** — turns a number into "pull to here." Show both units and mL. Support U-100/U-50/luer-lock. *(PeptideMind, PeptideDoseCalculator)*
2. **Solve backward from dose, optimizing for readable ticks** — "Easier to measure" vs "Smaller injection" toggle recommends the BAC volume that lands the dose on a clean mark. *(PeptideFox)*
3. **Smart guardrail warnings** — flag draws too small to measure (<3–5 units), over syringe capacity, or outside the selected Tanner/community reference range, each with a one-tap fix. Pairs with existing green/yellow/red. *(PeptideDoseCalculator)*
4. **Vial duration + cost-per-dose** — "lasts 37 days / 18 doses / $4.20 each," with the 28-day reconstituted-efficacy cap flagged when depletion runs past it. *(CalcMyPeptide, PeptIndex)*
5. **Deep-linkable configured examples** — extends the existing share-link idea to preset example rows. *(Rite Aid)*
6. **Anchor-compound blend reconstitution** — pick one component as anchor, derive one fluid volume that keeps all ratios fixed. Cleaner than "+ Add Peptide." *(PeptideFox, CalcMyPeptide)*
7. **Half-life / accumulation decay chart** — nice-to-have if half-life is already stored per peptide. *(CalcMyPeptide)*
8. **GLP-1 week-by-week escalation scheduler** — only if Tanner runs a GLP-1. *(CalcMyPeptide)*

## Pitfalls to avoid
- Reference/dose tables that scroll horizontally on mobile → use stacked cards
- Single-value output → show concentration + units + mL + doses-per-vial together
- All-dropdown inputs with no custom field
- Ambiguous units → always label the scale (U-100: 1 unit = 0.01 mL) and echo dose in both mg and mcg
- Silent bad advice on unmeasurable/over-capacity draws → guardrails matter more here (injectables)
- No dark mode (nobody in the field has it — cheap differentiator)
- Login walls / vendor upsell → best tools are local, instant, no-account

## The personalization payoff (why a curated personal tool wins)
A generic calculator starts empty with a 100-peptide dropdown. Tanner's leads with useful common entries and makes his own peptides and blends especially easy to find:

1. **Per-peptide baked-in defaults** — only when Tanner explicitly approves them. Community/reference catalog values must remain labeled as such.
2. **Named blend vials as first-class objects** — GLOW, KLOW, Wolverine, Beauty, and other common blends load their components, explicit amounts/units, water, and dose defaults in one tap. Formulations remain editable because the same name may be sold in different ratios.
3. **Local preferences** — favorites, recent selections, preferred syringe, display unit, last-used values, and custom saved presets persist in `localStorage` without accounts.
4. **Personalized dose-range status** — green/yellow/red tuned to his target and titration stage, not a wide population band.
5. **Curated list = better UX** — no giant dropdown; a visual grid of ~10–15 peptide cards showing his defaults + half-life + notes at a glance.
6. **Exact cost tracking** — optional later enhancement if it proves useful; not part of the first calculator build.

## Recommended build priority
- **Keep/modernize:** reconstitution math, per-unit dose, green/yellow/red, blends, URL sharing
- **Add first (high ROI):** visual syringe, doses-per-vial, guardrail warnings, mcg/mg + syringe-size toggles, dark mode, per-peptide defaults on select
- **Add next (personalization):** favorites, recents, custom saved presets, and remembered display/syringe preferences
- **Optional polish:** water-volume optimizer, GLP-1 scheduler, half-life decay chart

## Data rules

- Pep-Pedia-derived data and other useful websites are valid starting material.
- The old 68-entry dataset is a discovery pool, not a runtime schema; curate useful entries instead of importing every loose string.
- Every calculator quantity has an explicit numeric value and unit. Display strings are never parsed for math.
- Named blends contain explicit per-component quantities and may have multiple variants.
- Reference ranges are labeled by context, usually `Tanner` or `community`, rather than presented as universally authoritative recommendations.
- Share URLs reproduce the current calculation. Favorites, recents, and unrelated preferences stay local.

Full source list: peptidefox.com, peptidedosecalculator.com, peptidemind.com, calcmypeptide.com, riteaid.com/tools, jaycampbell.com, cellgenic.com, peptindex.com, muscleandbrawn.com, peptidedeck.com, joyapp.com, palmettopeptides.com, mypeptidematch.com
