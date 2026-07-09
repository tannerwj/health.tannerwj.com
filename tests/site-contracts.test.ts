import assert from "node:assert/strict";
import test from "node:test";
import { calculatorRoute, editorialSections, siteRoutes } from "../src/data/site";
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
