# health.tannerwj.com — Agent Guide

This is the canonical working contract for this repository. Read it before changing content, UI, metadata, calculator data, or deployment configuration.

## Purpose

`health.tannerwj.com` is Tanner Johnson's public, personal field guide for supplements, sleep, exercise, protocols, peptide reference notes, the calculator, and people worth following. It is a useful reference after a conversation—not a medical protocol, a clinical record, or a generic evidence encyclopedia.

## Source of truth

These sources answer different questions. Never use prose to override an enforced contract.

1. The user's current request and explicit corrections govern scope and approved personal facts.
2. This file governs repository-wide boundaries, safety, review, and release expectations.
3. [`src/content.config.ts`](src/content.config.ts), [`scripts/validate-content.ts`](scripts/validate-content.ts), [`src/data/calculator/`](src/data/calculator/), and [`tests/`](tests/) govern mechanically enforced schemas, relationships, quantities, calculator behavior, and output contracts. When they conflict with prose, code and tests win.
4. [`docs/content-authoring.md`](docs/content-authoring.md) explains the current code-backed content contract with examples. Update it in the same change whenever a schema or authoring rule changes.
5. [`PRODUCT.md`](PRODUCT.md) and [`DESIGN.md`](DESIGN.md) provide product and visual intent where no enforced contract or user instruction says otherwise.
6. [`docs/deployment.md`](docs/deployment.md) governs preview, release, rollback, and production verification.

[`docs/implementation-plan.md`](docs/implementation-plan.md) is historical planning context, not an instruction source.

## Repository map

- `src/content/<collection>/` — public editorial records in Markdown with YAML frontmatter.
- `src/content.config.ts` — collection schemas; update it only when the content model truly changes.
- `src/data/calculator/` — typed calculator catalog, blends, math engine, and preferences; distinct from editorial peptide entries.
- `src/data/affiliates.json` — reusable product/search-link registry.
- `src/data/site.ts` — site identity, routes, navigation labels, and metadata defaults.
- `src/pages/` and `src/components/` — route rendering and UI.
- `scripts/validate-content.ts` and `tests/` — integrity rules and regression coverage.
- `docs/` — authoring and release documentation.

## Editorial rules

### Personal records vs. sourced notes

- Use first person only for facts Tanner has supplied or explicitly approved as his own practice.
- Never invent Tanner's use, ownership, dose, cadence, timing, outcome, provider, or status.
- When personal details are unknown, omit the field. Do not write placeholders such as “to be determined” or “research note.”
- Status values are `current`, `considering`, and `previously-tried`; do not infer one.
- Source-backed entries are allowed and should be written as neutral notes with named attribution. They must not imply Tanner follows them.
- A peptide `source-note` requires at least one source and may not contain personal dose, timing, frequency, cycle, or effects fields. A peptide `personal` entry requires a status.
- Do not turn the site into a lab-results tracker, medical advice, or a universal protocol.

### Sources and attribution

- Prefer direct links to the original post, paper, official site, or first-party material.
- Use the supported source types: `x`, `pep-pedia`, `website`, `study`, `person`, or `conversation`.
- Add the author and a brief note when they help explain the source's relevance. An `accessed` value uses `YYYY-MM-DD`.
- Preserve uncertainty and disagreements. Do not overstate evidence or recast community practice as clinical guidance.
- Keep source notes concise and human; avoid repetitive labels and boilerplate.

### Products and affiliates

- Reuse keys from `src/data/affiliates.json`; never paste product URLs into arbitrary page markup.
- Exact product links and generic search links are deliberately different. Do not present a search link as a product Tanner selected.
- Preserve the Amazon disclosure and `rel="sponsored noreferrer"` behavior in shared affiliate rendering.
- Affiliate links must not drive editorial claims, rankings, or invented product experience.

### Calculator and peptide links

- Editorial peptide records and calculator catalog records are separate. A `calculatorId` must point to an existing compound or blend ID.
- Keep all calculator math quantities structured, numeric, positive, and explicitly unit-labeled. Never make math depend on display strings.
- Preserve deep links from peptide entries into a preselected calculator state and keep calculator preferences client-side.

## Change boundaries

- A normal content task changes Markdown in `src/content/` and, when needed, an existing affiliate registry entry. It should not change schemas, calculator math, shared components, or global styles.
- Treat `src/content.config.ts`, `src/data/calculator/`, `src/data/site.ts`, shared layout/components, SEO assets, and `astro.config.mjs` as implementation changes: explain why, add or update tests where relevant, and inspect the rendered result.
- Preserve the Stone & Sage / Field Notes visual language, semantic landmarks, keyboard behavior, responsive header, and mobile menu unless the request explicitly changes them.
- Keep editorial pages static. The mobile-nav controller and calculator island are intentional client-side JavaScript boundaries; do not add page-wide client JavaScript casually.
- Preserve canonical URLs, Open Graph/Twitter metadata, sitemap, robots, and the social-card assets when editing routes or site identity.

## Required checks

Run the smallest relevant checks while working, then run all of these before handoff for content, UI, or data changes:

```sh
npm run check
npm run build
npm run assert:build
```

Also inspect the affected route at a narrow mobile width and desktop width. For calculator changes, test the affected direct/deep link and saved-preferences behavior. For metadata or route changes, inspect canonical, social, sitemap, and internal-link output.

## Public Git/GitHub hygiene

- Do not mention internal automation or coding-assistant tooling in public issues, pull requests, commit messages, or upstream discussions unless the user explicitly requests it.
- Do not add tool-related `Co-authored-by:` trailers to commits or squash-merge messages; remove any prefilled trailer before merging.
- Describe only the user-visible change, relevant environment or reproduction details, and verification.

## Handoff and release

- State exactly which content is personal, which is sourced, and any intentional unknowns.
- Report checks run, rendered routes reviewed, and any schema or data-model change.
- Use a preview deployment before promoting a visual, content, calculator, or routing change to production.
- Verify the exact production artifact on `https://health.tannerwj.com/` after promotion; do not rely only on a deployment URL or a cached browser tab.
- Preserve the legacy peptide deployment and its redirects until the replacement has been verified in production. Do not remove, repoint, or broaden redirects as part of a routine content edit.
