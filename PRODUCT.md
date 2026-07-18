# health.tannerwj.com Product Notes

## Purpose

`health.tannerwj.com` is Tanner Johnson's public personal health field guide: the canonical link for what he currently takes, does, uses, tests, and follows across supplements, sleep, exercise, protocols, peptide reference notes, and health voices.

The site is a current-state reference, not a scientific reference library, medical protocol, or visible changelog. It should be useful to Tanner first and easy for friends, X followers, and curious strangers to scan after a conversation.

## Product Goals

- One shareable URL for Tanner's current public health stack.
- Repo-native content that is quick to update and mechanically hard to break.
- Glanceable section pages with optional depth for specifics.
- Static, fast, mobile-first pages with intentionally small client-side boundaries for the responsive menu and peptide calculator.
- Affiliate links where they fit naturally, without changing editorial judgment.
- A separate peptide calculator, supporting individual compounds and named blends, with a catalog kept separate from editorial peptide content.

## Non-Goals For V1

- No CMS or admin UI.
- No private/auth-gated section.
- No personal lab result storage or health ledger.
- No wearable integrations.
- No public changelog or dated update log.
- No scientific evidence-grading system.
- No account system, private health ledger, or client-side application framework beyond the calculator and responsive navigation behavior.

## Information Architecture

- `/` overview and section entry points.
- `/supplements` daily and weekly stack.
- `/sleep` routine, environment, gear, and tracking.
- `/exercise` current split, principles, equipment, and recovery.
- `/protocols` high-level testing, therapies, nutrition, recovery, and other protocols.
- `/peptides` a source-reference library for individual peptides and named blends, with room for Tanner's personal entries when he supplies them.
- `/peptides/calculator` a live reconstitution and named-blend calculator with client-side saved preferences and direct links from peptide entries.
- `/follow` people and accounts worth following.

## Content Principles

- First person, terse, and practical for Tanner's own entries; neutral and clearly attributed for source notes.
- Current facts live in one place and should not be duplicated into homepage copy.
- Practical provenance is welcome: X posts, Pep-Pedia, websites, studies, people, and conversations can all be useful sources.
- Mechanical facts are strict: IDs, slugs, units, numeric quantities, URLs, affiliate keys, and calculator references must validate.
- Unknown personal details stay unknown. The site never invents Tanner's use, dose, timing, cadence, outcome, or provider.
- Affiliate product links are disclosed and remain separate from editorial judgment.

## Technical Baseline

- Astro static output.
- TypeScript.
- Astro content collections for editorial content.
- Typed data files for calculator compounds and named blends.
- Central affiliate registry.
- A mobile-menu controller and the calculator are the only intentional client-side JavaScript boundaries; other editorial pages remain static.
- Shared metadata, canonical URLs, sitemap, robots, social cards, and mobile navigation are part of the site contract.
- Cloudflare Pages serves the static output; no SSR or Cloudflare adapter is used in the application code.
