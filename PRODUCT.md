# health.tannerwj.com Product Notes

## Purpose

`health.tannerwj.com` is Tanner Johnson's public personal health field guide: the canonical link for what he currently takes, does, uses, tests, and follows across supplements, sleep, exercise, protocols, peptides, and health voices.

The site is a current-state reference, not a scientific reference library, medical protocol, or visible changelog. It should be useful to Tanner first and easy for friends, X followers, and curious strangers to scan after a conversation.

## Product Goals

- One shareable URL for Tanner's current public health stack.
- Repo-native content that is quick to update and mechanically hard to break.
- Glanceable section pages with optional depth for specifics.
- Static, fast, mobile-first pages with no default client JavaScript.
- Affiliate links where they fit naturally, without changing editorial judgment.
- A separate peptide calculator page later, with the calculator data model kept separate from editorial peptide content.

## Non-Goals For V1

- No CMS or admin UI.
- No private/auth-gated section.
- No personal lab result storage or health ledger.
- No wearable integrations.
- No public changelog or dated update log.
- No scientific evidence-grading system.
- No client-side tools beyond the future peptide calculator island.

## Information Architecture

- `/` overview and section entry points.
- `/supplements` daily and weekly stack.
- `/sleep` routine, environment, gear, and tracking.
- `/exercise` current split, principles, equipment, and recovery.
- `/protocols` high-level testing, therapies, nutrition, recovery, and other protocols.
- `/peptides` editorial peptides Tanner uses, has used, or is considering.
- `/peptides/calculator` future dosing and reconstitution calculator.
- `/follow` people and accounts worth following.

## Content Principles

- First person, terse, and practical.
- Current facts live in one place and should not be duplicated into homepage copy.
- Practical provenance is welcome: X posts, Pep-Pedia, websites, studies, people, and conversations can all be useful sources.
- Mechanical facts are strict: IDs, slugs, units, numeric quantities, URLs, affiliate keys, and calculator references must validate.
- Practice content must be visibly marked and replaced before launch.

## Technical Baseline

- Astro static output.
- TypeScript.
- Astro content collections for editorial content.
- Typed data files for calculator compounds and named blends.
- Central affiliate registry.
- No SSR adapter and no Cloudflare adapter in the application code.
