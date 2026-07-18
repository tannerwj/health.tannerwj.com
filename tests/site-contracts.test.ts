import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  SITE_NAME,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_PATH,
  SOCIAL_IMAGE_WIDTH,
  calculatorRoute,
  editorialSections,
  isHomepageCurrentEntry,
  routeMetadata,
  siteRoutes
} from "../src/data/site";
import { GET as getRobots } from "../src/pages/robots.txt";
import { GET as getSitemap } from "../src/pages/sitemap.xml";

const expectedEditorialRoutes = [
  "/supplements",
  "/sleep",
  "/exercise",
  "/protocols",
  "/peptides",
  "/follow"
];

test("site section metadata preserves accepted homepage order and routes", () => {
  assert.deepEqual(
    editorialSections.map((section) => section.href),
    expectedEditorialRoutes
  );

  assert.deepEqual(
    editorialSections.map((section) => section.title),
    ["Supplements", "Sleep", "Exercise", "Protocols", "Peptides", "Follow"]
  );

  assert.equal(calculatorRoute.href, "/peptides/calculator");
});

test("shared route list covers home, peer sections, and calculator", () => {
  assert.deepEqual(siteRoutes, ["/", ...expectedEditorialRoutes, "/peptides/calculator"]);
});

test("every public route has distinct human SEO metadata", () => {
  assert.deepEqual(Object.keys(routeMetadata), [...siteRoutes]);
  assert.equal(new Set(Object.values(routeMetadata).map(({ description }) => description)).size, siteRoutes.length);

  for (const route of siteRoutes) {
    const metadata = routeMetadata[route];
    assert.ok(metadata.title.length >= 5, `${route} should have a descriptive title`);
    assert.ok(metadata.description.length >= 70, `${route} should have a useful description`);
    assert.doesNotMatch(metadata.title, /health\.tannerwj\.com/i);
  }

  assert.equal(SITE_NAME, "Tanner's Field Notes");
});

test("social card is a correctly sized PNG", () => {
  const image = readFileSync(join(process.cwd(), "public", SOCIAL_IMAGE_PATH));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), SOCIAL_IMAGE_WIDTH);
  assert.equal(image.readUInt32BE(20), SOCIAL_IMAGE_HEIGHT);
});

test("homepage current entries exclude peptide source notes", () => {
  assert.equal(
    isHomepageCurrentEntry("peptides", {
      featured: true,
      status: "current",
      entryType: "source-note"
    }),
    false
  );
  assert.equal(
    isHomepageCurrentEntry("peptides", {
      featured: true,
      status: "current",
      entryType: "personal"
    }),
    true
  );
  assert.equal(isHomepageCurrentEntry("supplements", { featured: true, status: "current" }), true);
  assert.equal(
    isHomepageCurrentEntry("supplements", { featured: true, status: "previously-tried" }),
    false
  );
});

test("peptide library introduction stays neutral about sourced entries", () => {
  const page = readFileSync(join(process.cwd(), "src", "pages", "peptides", "index.astro"), "utf8");

  assert.match(
    page,
    /A reference library of single peptides and named blends, with source context and evidence labels\./
  );
  assert.match(page, /These are sourced notes, not a record of what I use\./);
  assert.doesNotMatch(page, /I want close at hand\./);
});

test("static SEO endpoints expose canonical production routes", async () => {
  const robots = await getRobots({} as never);
  const robotsText = await robots.text();

  assert.match(robotsText, /User-agent: \*/);
  assert.match(robotsText, /Sitemap: https:\/\/health\.tannerwj\.com\/sitemap\.xml/);

  const sitemap = await getSitemap({} as never);
  const sitemapText = await sitemap.text();

  for (const route of siteRoutes) {
    assert.match(sitemapText, new RegExp(`<loc>https://health\\.tannerwj\\.com${route}</loc>`));
  }
});
