# Content Intake Brief — health.tannerwj.com

**Use this for an authoring session.** Put approved entries directly in the live collection under src/content/; there is no staging docs/seed-content directory. The precise schema reference is [content-authoring.md](./content-authoring.md).

## First question: whose information is this?

Classify each candidate before writing:

- **Tanner personal fact:** he explicitly says he uses, is considering, or previously tried it. Record only approved public facts such as status, optional dose/timing/cadence, product, equipment, or high-level provider context.
- **Sourced note:** an idea from X, Pep-Pedia, a website, study, conversation, or person. Attribute it, add its source, and do not imply Tanner does it.
- **Saved product:** a specific product link worth retaining, but not confirmed as Tanner’s use.
- **Calculator reference:** a curated math record with explicit numeric values and units.

Do not ask for an entire health history. Work in small section-sized batches and omit unknown fields.

## Session flow

1. Choose Supplements, Sleep, Exercise, Protocols, Peptides, Supplies, or Follow.
2. Gather only facts needed by its card and page grouping.
3. Confirm whether it is personal, sourced, a saved product, or calculator data.
4. Verify source URLs and capture why each source is retained.
5. Create src/content/<collection>/<kebab-case-slug>.md; filename and slug match.
6. Add product URLs to src/data/affiliates.json first, then reference their keys.
7. For peptide calculator links, verify calculatorId exists in the compound or blend catalog.
8. Run npm run check, npm run build, and npm run assert:build.

## Questions by section

### Supplements

- Is it current, considering, previously tried, source context, or only a saved product?
- If personal, which dose, timing, and frequency are actually approved?
- Is there an exact product link or only a search/options link?

### Sleep

- Is it routine, environment, gear, or tracking?
- Is it Tanner’s current setup or sourced context?
- For a personal setup, what timing, cadence, or specification belongs on the card?

### Exercise

- Is it a current split, session, principle, equipment item, or recovery practice?
- For home-gym equipment, what item/specification is confirmed?
- Is this an attributed coaching idea rather than Tanner’s plan?

### Protocols

- Is it testing, therapy, nutrition, recovery, or another note?
- If personal, what high-level cadence, provider/service, or markers are approved?
- Keep raw results, diagnoses, and unapproved clinical detail off the public site.

### Peptides

- Is this a personal entry or a library source note?
- What form, category, evidence maturity, at-a-glance takeaway, common context, and caveat are honest?
- If personal, is status confirmed? Are route, dose, timing, cycle, or effects explicitly approved?
- If sourced, do not publish personal dose/timing/frequency/cycle/effects.
- Does the exact calculator compound or blend variant exist? Named blends need their actual composition, not just a market name.

### Supplies and Follow

- Supplies are peptide-preparation product links, not a use record or peptide-vendor directory.
- For Follow, capture main handle/profile URL, related profiles, group, and Tanner’s honest reason for following them.

## Writing rules

- Personal copy is first person and concrete: “I use an eye mask as part of my sleep setup.”
- Sourced copy names the source: “Rhonda Patrick discusses…” rather than “I do this.”
- Do not manufacture dose, timing, cadence, start date, brand, outcome, clinical claim, lab result, or equipment ownership.
- Avoid generic filler such as “useful when you need it,” “evidence-led,” or “optimized.”
- Sources are context, not synthetic literature reviews.
- An omitted field is better than a guessed one.

## Final checklist

- [ ] Every file is in live src/content/<collection>/ and its filename matches slug.
- [ ] Personal facts and sourced notes are visibly separate.
- [ ] Status is used only when Tanner confirmed it.
- [ ] Every x, website, or study source has an HTTP(S) URL.
- [ ] Affiliate keys exist and raw retailer URLs were not pasted into entries.
- [ ] Peptide source notes contain required evidence/context fields and no prohibited personal fields.
- [ ] Calculator quantities use structured mg or mcg values and blend components/anchors are valid.
- [ ] Homepage features are intentional, not every current item.
- [ ] Validation, tests, build, and build assertions pass.

If repeated real content does not fit, propose a narrow schema change and update content-authoring.md with the code. Do not invent undocumented YAML fields.
