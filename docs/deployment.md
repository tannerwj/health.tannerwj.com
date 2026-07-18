# Deployment and release guide

This repository deploys as a static Astro site through Cloudflare Pages. The production project is **`health-tannerwj`**, its build command is **`npm run build`**, its output directory is **`dist`**, and its public domain is **`https://health.tannerwj.com`**.

Use this guide for every change, including content-only edits. Do not treat an apparently simple Markdown update as exempt from validation or a production smoke test.

Cloudflare Pages settings are external and are not version-controlled in this repository. Before the first release from a new environment, or whenever build/deploy behavior drifts, verify through the authenticated Cloudflare API or dashboard that project `health-tannerwj` uses production branch `main`, build command `npm run build`, and output directory `dist`. Any mismatch is a release blocker. Correct the project setting; do not work around it by bypassing the npm lifecycle or the required Astro cache purge.

## Local release gate

Start from a clean, current branch. Install dependencies with the lockfile, then run the complete local gate:

```sh
npm ci
npm run check
npm run build
npm run assert:build
git diff --check
git status --short
```

`git status --short` must show only the intentional release files before a branch is pushed. `npm run check` runs content integrity validation and tests; `npm run assert:build` verifies the generated static output.

Use `npm run build` exactly. Its `prebuild` lifecycle runs `scripts/clean-astro-cache.mjs`, which removes both `.astro` and `node_modules/.astro` before Astro indexes content. This purge is required because a stale Astro content index previously caused deleted practice entries to reappear in a Cloudflare build. Do not run `astro build`, `npx astro build`, or a Cloudflare build command that bypasses this lifecycle.

For a local browser smoke test after the build:

```sh
npm run preview
```

Open the URL Astro prints, verify the edited route and `/peptides/calculator`, then stop the preview server when finished.

## Branch and preview workflow

Work on a focused branch and push it for a Cloudflare Pages preview:

```sh
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feat/<short-change-name>
# edit files
npm run check
npm run build
npm run assert:build
git diff --check
git add <intentional-files>
git commit -m "Describe the user-visible change"
git push -u origin HEAD
```

Cloudflare Pages builds the pushed branch and exposes a unique preview URL. Use the deployment URL shown by Cloudflare or GitHub; never guess a preview hostname. Confirm that the preview deployment reports the same commit SHA as the branch tip:

```sh
git rev-parse HEAD
```

Set the actual preview URL before using these commands:

```sh
export PREVIEW_URL='https://<Cloudflare-preview-hostname>'
curl --fail --show-error --silent --location "$PREVIEW_URL/" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/supplements/" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/sleep/" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/exercise/" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/protocols/" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/peptides/" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/peptides/calculator/" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/follow/" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/robots.txt" >/dev/null
curl --fail --show-error --silent --location "$PREVIEW_URL/sitemap.xml" >/dev/null
```

Visually smoke the preview on a phone-width viewport and a desktop viewport. Check navigation, the changed page, internal links, affiliate disclosure where applicable, the calculator's search and selected-item flow, and that no page scrolls horizontally. For a content change, also confirm the new record is visibly in the intended group and no source note is presented as Tanner's practice.

## Exact-commit production promotion

Promote only the previewed commit. Do not make new edits on `main`, force-push, or rebuild an unverified working tree as a substitute for promotion.

```sh
git fetch origin
git switch main
git pull --ff-only origin main
git merge --ff-only origin/feat/<short-change-name>
git rev-parse HEAD
git rev-parse origin/feat/<short-change-name>
git push origin main
```

The two `rev-parse` values must be identical before the push. After Cloudflare marks the production deployment successful, verify that deployment's commit SHA is the same value. Then test the actual custom domain, using the SHA only as a cache-busting query value:

```sh
export RELEASE_SHA='<the-promoted-commit-sha>'
curl --fail --show-error --silent --location \
  "https://health.tannerwj.com/?v=$RELEASE_SHA" | rg -F "Tanner's Field Notes"
curl --fail --show-error --silent --location \
  "https://health.tannerwj.com/peptides/?v=$RELEASE_SHA" | rg -F "Peptide"
curl --fail --show-error --silent --location \
  "https://health.tannerwj.com/peptides/calculator/?v=$RELEASE_SHA" | rg -F "Calculator"
curl --fail --show-error --silent --location \
  "https://health.tannerwj.com/sitemap.xml?v=$RELEASE_SHA" | rg -F "health.tannerwj.com"
```

Also open `https://health.tannerwj.com` in a regular browser after deployment. If a browser appears stale while direct requests show the promoted content, record both results and give the CDN/browser cache time to converge; do not promote another commit merely to chase a cache.

## Production smoke checklist

Before calling a release complete, verify:

- All eight public routes return successfully: `/`, `/supplements/`, `/sleep/`, `/exercise/`, `/protocols/`, `/peptides/`, `/peptides/calculator/`, and `/follow/`.
- `robots.txt` and `sitemap.xml` are live and point to `https://health.tannerwj.com`.
- Page title, canonical URL, description, social image, and X sharing link are correct on the changed route.
- The desktop header and mobile hamburger menu work; focus remains usable and no narrow viewport has horizontal overflow.
- Editorial routes remain statically generated with only the shared mobile-navigation controller; calculator-specific JavaScript stays isolated to `/peptides/calculator/`.
- Affiliate links have the visible Amazon disclosure, are the intended exact links, and do not link to peptide vendors.
- Content records render with their intended personal or sourced label, and no placeholder/practice data has returned.
- Calculator math, deep links from peptide records, live search, and local preferences still work after the release.

## Rollback

Do not use `git reset --hard`, force-push, delete deployments, or manually upload an old `dist` directory. Roll back with a new, auditable commit that reverses the release:

```sh
git switch main
git pull --ff-only origin main
git revert --no-edit <bad-production-commit>
npm run check
npm run build
npm run assert:build
git diff --check
git push origin main
```

Wait for Cloudflare's new production deployment, verify its commit, and rerun the custom-domain smoke checks. If the incident is a stale content cache rather than a bad commit, first confirm that `npm run build` was used and that its prebuild cache purge ran; fix the build path instead of rolling back correct content.

## Legacy peptide site safeguard

The old peptide deployment and its redirect behavior are separate from this repository. Preserve `peptides.tannerwj.com/*` redirects to the replacement site (with calculator routes retaining calculator intent) until the replacement has passed custom-domain verification. Do not delete the legacy project, change its redirects, or alter the old repository as part of a normal health-site release. Any redirect or legacy-deployment change requires its own preview, production verification, and an explicit decision that the replacement route is working.
