# health.tannerwj.com — Design Spec

**Date:** 2026-05-21 (revised 2026-07-09)
**Owner:** Tanner Johnson
**Status:** Approved for planning

## Summary

A public personal health field guide at `health.tannerwj.com`. A current-state snapshot of what Tanner takes, does, uses, tests, and follows across supplements, sleep, exercise, protocols (including high-level bloodwork), peptides, and health voices worth following. It doubles as Tanner's own quick reference and as the canonical link to send after health conversations.

This is not a scientific reference library or an attempt to publish definitive health guidance. It documents Tanner's personal choices and the practical sources that inform them, including X posts, Pep-Pedia, useful websites, conversations, and formal research when relevant. The site should preserve useful attribution without turning every update into a literature review.

"Living" means the site stays current, not that it shows history: when Tanner changes his stack (often prompted by an X post from someone he trusts), he has his agent read the source and update the site in one short session → one commit. The content model exists to make that workflow reliable.

Replaces the existing `peptides` site (complete redesign, not a port) and 301-redirects `peptides.tannerwj.com`.

## Goals

- One canonical link to share when people ask "what's your stack?"
- Personal utility: Tanner uses it himself to keep his stack in one place
- Agent-editable: adding or updating an item is one agent conversation → one commit, with schema validation catching mistakes
- Quick recall after conversations: easy to scan first, with optional depth for specifics
- Long-lived, low-maintenance — content lives in the repo, edits are git commits
- Fast and polished — great social unfurls, excellent on mobile, minimal page weight
- Affiliate revenue where it fits naturally, without compromising readability
- Visually distinctive — not the default AI-slop SaaS look

## Non-Goals (v1)

- No private/auth-gated section (deferred — Cloudflare Access later)
- No CMS, no admin UI
- No analytics dashboards or live wearable integrations
- No changelog, dated update log, or visible edit history
- No daily personal logging or health ledger
- No new interactive tools beyond the (redesigned) peptide calculator and its client-side preferences

## Audience

Public-first: friends, X followers, and curious strangers who want to remember what Tanner does and why after talking with him. **Tanner is the tiebreak audience** — when glanceability for visitors conflicts with reference depth for Tanner, optimize for Tanner's own use.

## Information Architecture

File-based routes (Astro):

| Path                    | Purpose                                                                      |
|-------------------------|------------------------------------------------------------------------------|
| `/`                     | Art-directed overview: short context, featured "what I'm doing now" highlights, strong navigation into every section, and a prominent calculator entry point |
| `/peptides`             | Only peptides Tanner has tried or is taking — hand-curated, grows over time  |
| `/peptides/calculator`  | Redesigned dosing/reconstitution calculator (client island)                  |
| `/supplements`          | Daily/weekly stack: name, dose, timing, why                                  |
| `/sleep`                | Routine + gear (mattress, blackout, wind-down stack)                         |
| `/exercise`             | Current split, philosophy, equipment                                         |
| `/protocols`            | Bloodwork cadence + reference ranges, plus other protocols (TRT, fasting, etc.) |
| `/follow`               | X handles + why each is worth following, grouped (longevity, training, sleep, nutrition) |

No `/changelog`, no `/about`, no `/contact`. Each section is a single page, except the calculator which gets its own page under `/peptides`.

## Content Model

The content model is the core of the site — it powers every section, homepage highlights, calculator presets, and the update workflow.

- **Astro Content Collections** with Zod schemas. Structured editorial items live as Markdown/YAML with frontmatter. Data that is inherently relational or application-oriented, such as the calculator catalog and affiliate registry, lives in typed data files.
- Collections share only a small editorial core: identity, display order, status where relevant, a terse summary, optional homepage-feature controls, and optional source notes. Each section owns fields that fit its subject.
- `status` is used where it makes sense: `current` | `considering` | `previously-tried`. It is not required for every kind of content.
- The homepage is curated with `featured` and `homepageOrder`; it does not automatically dump every current item. Its highlights are rendered from section content so facts are not duplicated.
- The editorial peptide collection contains only peptides Tanner is using, has used, or might use. The calculator catalog is broader and may contain common peptides Tanner has not used.
- Sources are practical provenance, not a formal evidence system. An entry may point to an X post, Pep-Pedia page, website, study, person, or conversation.
- Validation is strict for mechanical facts—IDs, units, numeric amounts, relationships, URLs, and blend math—and flexible for prose and evolving section structure.

The detailed models and validation rules live in [`content-model.md`](./content-model.md).

## Authoring & Update Workflow

- Voice: first person, terse, no hedging. "I take X mg of Y in the morning because Z." Not "Some experts suggest…"
- Pages are glanceable first, detailed second: current stack at the top, optional detail below
- Typical update: Tanner sees a useful post or source → the source is summarized in the context of the site's taxonomy and Tanner's current stack → Tanner approves an addition or change → the relevant entry is updated → schemas and integrity checks validate → commit → auto-deploy
- Success bar: a new supplement entry is a single commit and under 2 minutes of Tanner's attention
- Longer-term: a dedicated X research skill understands the site's sections and tracked fields, reviews Tanner's X activity through his API access, and suggests useful additions or changes. Suggestions never need to publish automatically.

## Visual Design

**Direction:** Personal field guide — calm, distinctive, readable, and fast to scan. Avoid SaaS landing-page patterns, marketing copy, and heavy legal/medical framing.

**Mobile-first is mandatory.** The link lives in an X bio and DMs; most first visits are phones. Any pattern that only works in a wide right margin (e.g. Tufte sidenotes) is a desktop enhancement, never the primary home for essential content or affiliate links.

**Process:** Build the content model first, then prototype **2–3 genuinely distinct homepage treatments with the same representative data** and pick by feel. Practice content is acceptable during private development; visual decisions should be rechecked once enough real content exists. Tufte-CSS is one candidate (serif, cream, sidenotes), not a default.

**Customization path:** Establish a project-specific `DESIGN.md` and `PRODUCT.md` once the direction is chosen. Iterate with craft/polish/critique passes.

**No tagline.** The wordmark `health.tannerwj.com` carries it.

## Polish Requirements

- **OG/social cards** for every page — the unfurl in a DM or X post is the first impression and must look deliberate
- Meta descriptions, favicon, sitemap, canonical URLs
- Fonts budgeted carefully: subset webfonts or use a system stack; type must not blow the page-weight budget
- Lighthouse: effectively perfect scores on a content page (the calculator island is the only allowed JS cost)

## Technical Architecture

**Stack:**
- **Framework:** Astro (latest stable), **static output** — chosen deliberately: zero-JS-by-default content pages, islands for the calculator, first-class content collections and MDX. No SSR, so **no `@astrojs/cloudflare` adapter**
- **Routing:** File-based via `src/pages/`
- **Styling:** Decided by the visual-treatment bake-off (see Visual Design)
- **JavaScript:** Zero by default. Calculator ships as a client island only on `/peptides/calculator`
- **Content:** Content collections in `src/content/` for editorial material; typed data in `src/data/` for calculator entities and affiliate URLs

**Deployment:**
- Cloudflare Pages, project name: `health-tannerwj`
- Build command: `npm run build`, output dir: `dist/`
- Custom domain: `health.tannerwj.com` (Cloudflare DNS, `tannerwj.com` zone)

**Repo:**
- Location: `~/repos/health.tannerwj.com/`
- Git: new repo, GitHub remote public

## Peptides Replacement

The existing site (`~/repos/peptides`) was a first draft of this idea. Nothing is ported wholesale:

- **Editorial content:** Start from the hand-curated entries in the old `index.html`, then keep only peptides Tanner is using, has used, or might use. Rewrite them around Tanner's experience and practical notes rather than porting the old presentation.
- **Calculator catalog:** Treat the 68-entry Pep-Pedia-derived dataset as discovery/source material, not as a production-ready schema. Curate useful common entries into a clean typed catalog with explicit units and source notes. The catalog may be broader than Tanner's editorial peptide page.
- **Calculator:** Rebuild as an Astro client island matching the new visual system. Preserve reconstitution/BAC math, per-component blend math, dose-reference status, and URL sharing. Add a syringe visual, guardrails, doses per vial, unit and syringe selectors, presets, favorites, recent selections, and custom saved presets in `localStorage`.
- **Named blends:** Support common multi-compound vial formulations such as GLOW, KLOW, Wolverine, and Beauty. Every component amount has an explicit unit, and users can edit compositions because formulations vary.
- **Redirect:** Cloudflare rule on the old project: `peptides.tannerwj.com/*` → `https://health.tannerwj.com/peptides`
- Leave the old repo in place; do not delete

## Affiliate Links

- **Scope:** supplements, gear, and consumables (e.g. Amazon links for alcohol pads, syringes). **No peptide vendors.**
- All affiliate URLs centralized in `src/data/affiliates.json` so vendors can be swapped without editing prose
- Rendered as compact contextual links marked with a small `↗` glyph; on desktop they may also live in margin notes, but the mobile rendering is the primary one

```json
{
  "momentous-mag": {
    "vendor": "Momentous",
    "product": "Magnesium L-Threonate",
    "url": "https://livemomentous.com/...?ref=tanner"
  }
}
```

## Disclosure

A persistent footer line on every page: "This is what I do, not a protocol for you. Some links are affiliate links — they don't change what I recommend." One sentence, no modal, no banner.

## Deferred (v2+)

- **Private section** at `/private/*` behind Cloudflare Access (Google login, email allowlist). No code changes — Cloudflare handles it
- **Private health app / ledger** if Tanner wants deeper personal tracking outside the public site. User-owned bloodwork would require real authentication and storage beyond static Cloudflare Access pages; it is only a future concept and does not shape v1.
- **Subtle per-item dates** ("since Mar 2026") if staleness ever becomes a credibility problem
- **RSS feed** if `/follow` evolves into a curated reading list
- **Search** (Pagefind) if total content grows past ~10 pages

## Success Criteria

- Single shareable URL replaces the peptides link in Tanner's bio / DMs
- All sections live with real content (not lorem ipsum) at launch
- Old peptides URL redirects cleanly; no broken inbound links
- Social unfurls look deliberate everywhere the link gets shared
- Page weight under 50KB per content page (calculator excluded)
- Adding a new supplement is one agent session → one commit, under 2 minutes of Tanner's attention
- Site is excellent on a phone — the primary reading device

## Decisions to Make During Content Work

- Which existing peptide entries are `current`, `considering`, or `previously-tried`
- Tanner's exact compositions and preferred defaults for named blend vials
- Which real items should be featured on the launch homepage
- The appropriate structure and grouping for each section after representative content exists
- Which calculator catalog entries are useful enough to curate from the old dataset for v1
