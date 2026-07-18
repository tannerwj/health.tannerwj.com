# Tanner's Field Notes

The source for [health.tannerwj.com](https://health.tannerwj.com/): a fast, mobile-first personal field guide covering supplements, sleep, exercise, health protocols, peptide reference notes, a peptide calculator, and people worth following.

## Start here

- [`AGENTS.md`](AGENTS.md) is the canonical repository contract for people and coding agents.
- [`docs/content-authoring.md`](docs/content-authoring.md) explains how to add or edit public records safely.
- [`docs/deployment.md`](docs/deployment.md) describes previews, production promotion, and verification.
- [`PRODUCT.md`](PRODUCT.md) and [`DESIGN.md`](DESIGN.md) explain the current product and visual system.

## Architecture

- [Astro](https://astro.build/) static site with TypeScript.
- Markdown + YAML frontmatter for editorial collections in `src/content/`.
- Typed TypeScript data for the calculator catalog and named blend vials in `src/data/calculator/`.
- A centralized product/affiliate registry in `src/data/affiliates.json`.
- Static editorial pages by default; client-side JavaScript is limited to the responsive mobile menu and the calculator experience.
- Cloudflare Pages serves the production site at `health.tannerwj.com`.

## Repository map

```text
src/
  content/            Editorial Markdown collections
  content.config.ts   Enforced content schemas
  data/               Site metadata, affiliates, calculator catalog and math
  pages/              Astro routes, sitemap, and robots
  components/         Shared and section-specific rendering
  styles/             Stone & Sage design system
scripts/              Validation, build assertions, cache cleanup
tests/                Content, calculator, metadata, and navigation tests
docs/                 Authoring, deployment, and historical reference material
```

## Local development

Requires a current Node.js LTS release and npm.

```sh
npm install
npm run dev
```

Useful commands:

```sh
npm run validate      # content relationships and mechanical facts
npm test              # regression tests
npm run check         # validate + test
npm run build         # clean Astro cache and create static output
npm run assert:build  # inspect generated site contracts
npm run preview       # serve the production build locally
```

## Normal content-edit workflow

1. Read [`AGENTS.md`](AGENTS.md) and the relevant section of [`docs/content-authoring.md`](docs/content-authoring.md).
2. Edit the matching Markdown record in `src/content/<collection>/`; keep its filename and `slug` aligned.
3. Add a source when a record is sourced rather than Tanner's own practice. Leave personal fields out when they are unknown.
4. For a product, reference an existing affiliate key or add a documented registry entry—do not paste a one-off product URL into a component.
5. Run `npm run check`, `npm run build`, and `npm run assert:build`.
6. Review the affected page on mobile and desktop. Use the deployment guide before production promotion.

## Do not edit casually

- `src/content.config.ts`: changes the public content contract.
- `src/data/calculator/`: affects reconstitution and blend calculations.
- `src/data/site.ts`, `src/layouts/`, shared site components, and `src/styles/global.css`: affect every route, metadata, or responsive navigation.
- `astro.config.mjs`, sitemap/robots routes, social assets, and Cloudflare configuration: affect indexing or production behavior.
- Legacy peptide deployment and redirect configuration: retain until the replacement is verified live.

This repository intentionally does not use a CMS. The Markdown records and typed data files are the editable source of truth.

