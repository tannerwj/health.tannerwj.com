# Implementation Plan — health.tannerwj.com

> **Historical planning context — implementation is complete.** This document records the initial July 2026 plan and includes statements that are no longer current (for example, references to future application code, an undecided visual system, and a future calculator). Do not use it to direct new work.
>
> For current instructions, read [`../AGENTS.md`](../AGENTS.md). For normal edits, use [`content-authoring.md`](./content-authoring.md); for previews and production, use [`deployment.md`](./deployment.md). The current product and design references are [`../PRODUCT.md`](../PRODUCT.md) and [`../DESIGN.md`](../DESIGN.md).

**Date:** 2026-07-09  
**Historical status:** Planning record

## Outcome

Launch a fast, mobile-first personal health field guide with:

- An excellent, art-directed homepage that gives a useful overview of the whole site
- Focused pages for supplements, sleep, exercise, protocols, peptides, and people to follow
- A separate, polished peptide calculator supporting single compounds and named blend vials
- Repo-native content that is quick to update and difficult to break mechanically
- A foundation for a later X research skill and, separately, possible private health tooling

## Delivery Strategy

Build in vertical slices. Use representative practice data to exercise the content shapes and visual system, then replace it with Tanner's real content as sections mature. Do not wait for a complete health-stack interview before learning from the interface.

The visual direction is chosen through comparison, not assumed up front. The content model is intentionally revisable until representative entries from every section render naturally.

## Phase 0 — Repository and Product Baseline

### Work

1. Initialize the repository and basic project metadata.
2. Establish the current stable Astro static-site project with TypeScript and the package scripts needed for development, validation, and production builds.
3. Add project-level `PRODUCT.md` and `DESIGN.md` distilled from the approved docs when implementation begins.
4. Define conventions for filenames, slugs, formatting, and content updates.
5. Preserve the old `~/repos/peptides` repository as read-only source material.

### Exit criteria

- A minimal static project builds locally.
- The repository has clear product and design constraints.
- No Cloudflare adapter or unnecessary client framework is included.

## Phase 1 — Content Foundations

### Work

1. Implement separate Astro content collections for supplements, sleep, exercise, protocols, editorial peptides, and follow entries.
2. Encode the initial models from [`content-model.md`](./content-model.md).
3. Add typed calculator compound and blend data models separately from editorial collections.
4. Add the affiliate registry model.
5. Implement cross-file integrity checks for:
   - Duplicate slugs and IDs
   - Unknown affiliate keys
   - Unknown calculator compound references
   - Blend component references and explicit units
   - Invalid quantities and URLs
   - Homepage feature ordering
6. Create representative practice entries for every section and representative calculator singles/blends.
7. Make one or two realistic content edits and record where the schema feels awkward.

### Exit criteria

- Every section has enough representative content to expose its layout needs.
- Calculator math inputs are unambiguous and typed.
- Invalid relationships fail validation.
- A normal supplement edit is simple and readable.
- Any schema changes learned from real-shaped content are reflected in the docs.

## Phase 2 — Shared Site Shell

### Work

1. Create the global document shell, metadata defaults, canonical URL behavior, navigation, and persistent footer disclosure.
2. Implement a responsive page container and baseline type scale without committing to the final visual treatment.
3. Add favicon, sitemap, robots behavior, and initial social metadata plumbing.
4. Build reusable primitives only where repeated content proves they are useful; avoid a generic card system that makes every section look the same.
5. Ensure content pages ship no client JavaScript by default.

### Exit criteria

- Every route has a functional mobile-first shell.
- Keyboard navigation, focus behavior, and semantic landmarks work.
- Page metadata has sensible defaults.
- Content routes remain static and zero-JavaScript.

## Phase 3 — Homepage Visual Bake-Off

### Work

1. Build three genuinely distinct homepage treatments against the same representative content. They should differ in composition, typography, density, rhythm, and navigation—not merely color.
2. Each treatment must include:
   - `health.tannerwj.com` wordmark with no tagline
   - One-sentence context for strangers
   - Featured “what I'm doing now” content
   - Clear overview/navigation across all six editorial sections
   - A strong peptide-calculator entry point without making peptides dominate the site
   - Persistent footer disclosure
3. Evaluate all treatments on a narrow phone viewport first, then desktop.
4. Compare screenshots side by side and select a direction by feel.
5. Record the chosen visual rules in `DESIGN.md`.
6. Run craft, polish, and critique passes on the selected treatment.

### Exit criteria

- Tanner has selected a visual direction from real rendered alternatives.
- The homepage feels useful, personal, and distinctive rather than like a SaaS landing page.
- Section navigation is immediately understandable on mobile.
- The selected direction can extend to dense calculator UI and prose-heavy section pages.

## Phase 4 — Editorial Section Pages

### Work

Implement and refine each section using its natural structure:

1. **Supplements:** current stack first; considering and previously tried secondary; easy scanning of dose, timing, why, brand, and affiliate links.
2. **Sleep:** compose routine, environment, gear, and tracking into a coherent nighttime story rather than a flat undifferentiated grid.
3. **Exercise:** show current split prominently, with principles, sessions, equipment, and recovery in supporting roles.
4. **Protocols:** explain what Tanner does at a high level, including what he tests, how often, and through whom; no personal lab-result storage.
5. **Peptides:** show current, considering, and previously tried entries with expandable practical detail and links into configured calculator states where useful.
6. **Follow:** group people by topic with handles, direct links, and terse reasons to follow.
7. Feed selected entries into the chosen homepage composition without duplicating their facts.

### Exit criteria

- Every section is excellent on a phone and supports glanceable-first, detailed-second reading.
- Section-specific content does not feel forced into a universal card.
- Status, grouping, and ordering are consistent and intentional.
- Affiliate links are contextual, compact, and registry-backed.

## Phase 5 — Calculator Core

### Work

1. Implement the calculator as the only substantial client island.
2. Support a single-compound mode with:
   - Compound selection
   - Vial quantity
   - BAC-water volume
   - Desired dose with mcg/mg display toggle
   - Syringe capacity selector
   - Live concentration, syringe units, mL, and doses-per-vial results
3. Support a named-blend mode with:
   - GLOW, KLOW, Wolverine, Beauty, and other curated variants
   - Explicit per-component vial amounts and units
   - Editable composition
   - Targeting by an anchor component's desired dose or by a direct syringe draw
   - Per-component result breakdown for a shared draw
4. Add preset chips with an `Other` escape hatch for all important inputs.
5. Add a responsive visual syringe with exact fill position and tick labels.
6. Add guardrails for:
   - Draws too small to measure meaningfully
   - Draws over the selected syringe capacity
   - Missing or invalid inputs
   - Values outside the selected Tanner/community reference range
7. Make all calculations deterministic and unit-tested independently of the interface.

### Exit criteria

- Single and blend calculations are correct across mcg/mg conversions.
- Every blend result identifies the amount delivered for each component.
- A configured result is understandable without mental conversion.
- The calculator works comfortably on a narrow phone.
- No calculator result depends on parsing display text.

## Phase 6 — Calculator Personalization and Sharing

### Work

1. Add versioned `localStorage` persistence for:
   - Favorites
   - Recent selections
   - Preferred syringe capacity
   - Preferred dose display unit
   - Last-used convenience values
   - Custom saved single or blend presets
2. Ensure named blend compositions can be edited and saved under a local custom name.
3. Add shareable URLs that reproduce a configured calculation, including custom blend components when necessary.
4. Keep favorites, recents, and unrelated preferences out of shared URLs.
5. Handle unknown or outdated saved catalog IDs gracefully.
6. Add reset controls for local preferences and individual custom presets.

### Exit criteria

- Favorites and preferences survive reloads without an account.
- Shared URLs reproduce calculations on a clean browser profile.
- Catalog changes do not crash old local state.
- Users can understand what is saved locally and remove it.

## Phase 7 — Real Content and Update Workflow

### Work

1. Interview Tanner one section at a time using [`seed-data-brief.md`](./seed-data-brief.md).
2. Replace practice content with real entries.
3. Curate calculator compounds from the old Pep-Pedia-derived discovery dataset, Tanner's actual use, X posts, and other useful sites.
4. Capture Tanner's exact named-blend variants and preferred defaults.
5. Select final homepage features using the real content.
6. Exercise the normal update loop with several realistic changes:
   - Add a supplement
   - Move an item between statuses
   - Add an X source
   - Add or modify a named blend variant
7. Adjust schemas and authoring guidance wherever these edits are unnecessarily awkward.

### Exit criteria

- All launch sections contain real content.
- No practice content reads as a claim about Tanner.
- A routine content update is one focused session and one commit.
- Mechanical mistakes fail before deployment.

## Phase 8 — Social, Performance, and Quality Pass

### Work

1. Create deliberate OG/social cards for the homepage and every section, including the calculator.
2. Finalize titles, descriptions, canonical URLs, favicon, sitemap, and social metadata.
3. Test mobile layouts across representative narrow and wide viewports.
4. Test keyboard use, focus, contrast, reduced motion, and expandable-detail behavior.
5. Measure content-page weight and remove accidental JavaScript or oversized font assets.
6. Run build, schema, integrity, calculator unit, link, and route checks.
7. Verify that localStorage failure or restriction does not break the calculator core.
8. Review all public copy for personal voice and eliminate placeholder marketing language.

### Exit criteria

- Content pages meet the under-50 KB target where practical and score effectively perfectly in Lighthouse.
- The calculator's JavaScript is isolated to its route.
- Social unfurls look intentional.
- There are no broken internal references or invalid affiliate keys.
- The site is excellent on a phone.

## Phase 9 — Deployment and Migration

### Work

1. Create the Cloudflare Pages project `health-tannerwj` with static build settings.
2. Connect `health.tannerwj.com` and verify HTTPS/canonical behavior.
3. Smoke-test production routes and social metadata.
4. Inspect the old peptide site's inbound routes.
5. Configure redirects intentionally:
   - Old editorial/root routes → `/peptides`
   - Old calculator route(s) → `/peptides/calculator`
6. Verify redirects without deleting or rewriting the old repository.
7. Replace the link used in Tanner's bio and common sharing contexts after production verification.

### Exit criteria

- Every launch route is live and canonical.
- Old calculator links retain calculator intent.
- No known inbound peptide route is broken.
- Production matches the verified local build.

## Later Work — Separate Projects

These ideas should not delay or reshape v1.

### X Research Skill

Create a dedicated skill that understands:

- The site taxonomy and section models
- Tanner's current, considering, and previously-tried entries
- Calculator compounds and named blends
- What sources are already attached
- The expected first-person authoring voice

With Tanner's X API access, it can review selected account activity, summarize relevant posts and linked material, identify possible additions or changes, and prepare suggestions for Tanner's approval. It should not publish automatically by default.

### Private Bloodwork or Health App

If pursued, treat this as an authenticated application with user-owned data, authorization, and storage. Cloudflare Access protecting static pages is not by itself a user health-data architecture.

## Deliberate Non-Goals for V1

- Scientific completeness or formal evidence grading
- Importing the entire old peptide dataset unchanged
- A CMS or admin interface
- Server-side user accounts
- Vial inventory, reconstitution countdowns, reorder reminders, or cost tracking
- Personal lab-result storage
- Wearable integrations
- Search, RSS, or public changelog
- Automatic publication from X research

## Main Risks and Responses

| Risk | Response |
|---|---|
| Schemas become rigid before real content exists | Use representative entries early and revise models when content fights them |
| Homepage becomes a directory rather than a compelling landing page | Curate featured content and compare three compositions using the same data |
| Peptides visually dominate the broader health site | Keep the calculator prominent but treat all editorial sections as peers |
| Old calculator data produces ambiguous math | Curate entries and require explicit numeric quantities and units |
| Named blend labels imply one universal recipe | Model multiple variants and make compositions editable |
| Client preferences become brittle | Version local storage and degrade gracefully when IDs change |
| Practice content leaks into launch | Make real-content replacement an explicit launch gate |
| Future private-app ideas distort the static site | Keep them documented as separate later work |

## Recommended First Implementation Slice

When coding begins, the first meaningful slice should be:

1. Project shell
2. One representative entry in every editorial collection
3. Two single calculator compounds and two named blend variants with explicit units
4. Cross-reference validation
5. A plain functional overview page that proves the data can be composed

Only after that slice validates the models should the three homepage visual treatments begin.
