import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { siteRoutes } from "../src/data/site";

const distDir = join(process.cwd(), "dist");
const homepage = readFileSync(join(distDir, "index.html"), "utf8");
const robots = readFileSync(join(distDir, "robots.txt"), "utf8");
const sitemap = readFileSync(join(distDir, "sitemap.xml"), "utf8");

const count = (source: string, pattern: RegExp) => source.match(pattern)?.length ?? 0;

assert.equal(count(homepage, /class="skip-link"/g), 1, "homepage should render one skip link");
assert.equal(count(homepage, /<header\b/g), 1, "homepage should render one header landmark");
assert.equal(count(homepage, /<main\b/g), 1, "homepage should render one main landmark");
assert.equal(count(homepage, /<footer\b/g), 1, "homepage should render one footer landmark");
assert.equal(count(homepage, /<script\b/g), 0, "homepage should not emit JavaScript");

assert.match(robots, /Sitemap: https:\/\/health\.tannerwj\.com\/sitemap\.xml/);

for (const route of siteRoutes) {
  assert.match(sitemap, new RegExp(`<loc>https://health\\.tannerwj\\.com${route}</loc>`));
}

console.log("Build output assertions passed.");
