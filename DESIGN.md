# health.tannerwj.com Design Notes

## Selected System

The selected direction is **Stone & Sage / Field Notes**: warm paper, dark sage, restrained clay accents, editorial spacing, and a compact field-mark rather than a large domain-name wordmark. The site should feel like a well-kept personal notebook—specific, legible, and calm—rather than a clinic portal or SaaS landing page.

## Design Constraints

- Mobile-first is mandatory; the site will often be opened from X bios, DMs, and phone conversations.
- The header lockup uses the orbit/aperture-style field mark with `Field Notes` and `Tanner Johnson · Health`.
- Do not add a marketing tagline or turn the domain name into the primary masthead.
- The site should feel like a personal field guide: calm, distinctive, readable, and fast to scan.
- Avoid SaaS landing-page patterns, generic marketing copy, and heavy legal or medical framing.
- Peptides are one peer section in a broader health site. The calculator can be prominent later without making peptides dominate the site.
- Content pages should ship no client-side JavaScript by default.
- The responsive mobile menu and peptide calculator are intentional, contained client-side behavior. Do not add page-wide JavaScript casually.
- Affiliate links should be compact and contextual, with mobile rendering treated as primary.
- Keep affiliate disclosure visible where product links appear and retain the global footer disclosure: "This is what I do, not a protocol for you. Some links are affiliate links — they don't change what I recommend."

## Existing Interface System

- The desktop header exposes the primary section navigation directly. Below `48rem`, it becomes an accessible Menu control with a toggleable navigation panel; Escape, outside clicks, route changes, and desktop breakpoint changes close it.
- The field mark and favicon are part of the selected identity. Preserve their quiet, geometric character rather than substituting a generic health icon.
- The homepage provides an editorial overview and clear section entry points. Section pages lead with an at-a-glance view, then let individual records carry the detail.
- Make entries unmistakably distinct from their metadata: name and practical summary first; dose, cadence, specifications, sources, and product links second.
- Use borders and rules sparingly to establish rhythm, not to create dashboard chrome.
- On small screens, prioritize readable line lengths, clear tap targets, and a single-column flow before adding density or decoration.
- The calculator may be denser and interactive, but it should still use the same palette, typography, spacing, and plain-language labels.

## Layout Principles

1. Make the current or highest-value information visible before long explanation.
2. Let each section use its natural grouping; avoid forcing every type of record into identical cards.
3. Keep source notes visibly attributed and visually separate from Tanner's own practice.
4. Write like a person maintaining useful notes. Avoid meta copy, generic reassurance, and marketing filler.
5. Prefer accessible HTML, good contrast, keyboard navigation, and semantic landmarks over decorative effects.

## JavaScript Boundary

The site is statically generated. The header's mobile navigation script and the calculator's client-side search, preference, and share-state behavior are deliberate exceptions. Any additional browser JavaScript needs a concrete interaction reason and must preserve a useful static reading experience.

## Evolving Carefully

The visual system can evolve, but retain the Field Notes identity, mobile-first behavior, and editorial hierarchy unless a deliberate redesign is requested. Treat changes to the header, field mark, navigation, global typography, social card, or color tokens as cross-site work and review them on both phone and desktop.
