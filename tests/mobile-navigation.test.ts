import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { calculatorRoute, editorialSections } from "../src/data/site";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string) {
  return readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

test("mobile navigation uses the complete shared route registry", () => {
  const header = read("src/components/site/SiteHeader.astro");

  assert.match(header, /editorialSections\.map/);
  assert.match(header, /calculatorRoute\.href/);
  assert.deepEqual(
    [...editorialSections.map(({ href }) => href), calculatorRoute.href],
    [
      "/supplements",
      "/sleep",
      "/exercise",
      "/protocols",
      "/peptides",
      "/follow",
      "/peptides/calculator"
    ]
  );
});

test("mobile menu exposes accessible state and current-page context", () => {
  const header = read("src/components/site/SiteHeader.astro");

  assert.match(header, /<button[\s\S]*?aria-label="Open primary navigation"/);
  assert.match(header, /aria-expanded="false"/);
  assert.match(header, /aria-controls="mobile-navigation"/);
  assert.match(header, /id="mobile-navigation"/);
  assert.match(header, /aria-label="Mobile primary navigation"/);
  assert.match(header, /aria-current=\{isCurrent\([^)]*\) \? "page" : undefined\}/);
});

test("mobile menu closes through keyboard, link, outside-click, and desktop transitions", () => {
  const header = read("src/components/site/SiteHeader.astro");

  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /closest\("a"\)/);
  assert.match(header, /!header\.contains/);
  assert.match(header, /desktopQuery\.addEventListener\("change"/);
  assert.match(header, /toggle\.setAttribute\("aria-expanded", String\(open\)\)/);
  assert.match(header, /navigation\.hidden = !open/);
});

test("mobile styles preserve touch targets, narrow widths, focus, and reduced motion", () => {
  const css = read("src/styles/global.css");

  assert.match(css, /@media \(max-width: 47\.99rem\)/);
  assert.match(css, /\.mobile-menu-toggle[\s\S]*?min-height: 44px/);
  assert.match(css, /\.mobile-nav a[\s\S]*?min-height: 48px/);
  assert.match(css, /\.mobile-nav a:focus-visible/);
  assert.match(css, /@media \(max-width: 22rem\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
