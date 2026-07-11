import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SITE_NAME,
  SITE_ORIGIN,
  SOCIAL_IMAGE_ALT,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_PATH,
  SOCIAL_IMAGE_WIDTH,
  X_HANDLE,
  routeMetadata,
  siteRoutes
} from "../src/data/site";

const distDir = join(process.cwd(), "dist");
const homepage = readFileSync(join(distDir, "index.html"), "utf8");
const robots = readFileSync(join(distDir, "robots.txt"), "utf8");
const sitemap = readFileSync(join(distDir, "sitemap.xml"), "utf8");

const count = (source: string, pattern: RegExp) => source.match(pattern)?.length ?? 0;
const decodeHtml = (value: string) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&#39;", "'")
  .replaceAll("&quot;", "\"");
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const routeFile = (route: string) => route === "/"
  ? join(distDir, "index.html")
  : join(distDir, route.slice(1), "index.html");
const tagContent = (html: string, tag: string) => {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  assert.ok(match, `expected <${tag}>`);
  return decodeHtml(match[1]);
};
const metaContent = (html: string, attribute: "name" | "property", key: string) => {
  const match = html.match(new RegExp(`<meta ${attribute}="${escapeRegExp(key)}" content="([^"]*)"`));
  assert.ok(match, `expected ${attribute}=${key}`);
  return decodeHtml(match[1]);
};

assert.equal(count(homepage, /class="skip-link"/g), 1, "homepage should render one skip link");
assert.equal(count(homepage, /<header\b/g), 1, "homepage should render one header landmark");
assert.equal(count(homepage, /<main\b/g), 1, "homepage should render one main landmark");
assert.equal(count(homepage, /<footer\b/g), 1, "homepage should render one footer landmark");
assert.equal(count(homepage, /<script\b/g), 2, "homepage should emit structured data and the mobile navigation controller");
assert.equal(count(homepage, /<script\b(?![^>]*type="application\/ld\+json")/g), 1, "homepage should emit only the mobile navigation controller as executable JavaScript");
assert.match(homepage, /<script type="module">[^<]*data-mobile-menu-toggle[^<]*<\/script>/, "homepage JavaScript should stay scoped to the mobile navigation");

assert.match(robots, /Sitemap: https:\/\/health\.tannerwj\.com\/sitemap\.xml/);

for (const route of siteRoutes) {
  assert.match(sitemap, new RegExp(`<loc>https://health\\.tannerwj\\.com${route}</loc>`));

  const html = readFileSync(routeFile(route), "utf8");
  const metadata = routeMetadata[route];
  const expectedTitle = `${metadata.title} | ${SITE_NAME}`;
  const expectedCanonical = new URL(route, SITE_ORIGIN).toString();
  const socialImage = new URL(SOCIAL_IMAGE_PATH, SITE_ORIGIN).toString();

  assert.match(html, /aria-controls="mobile-navigation"/);
  assert.match(html, /id="mobile-navigation"/);

  assert.equal(tagContent(html, "title"), expectedTitle, `${route} title`);
  assert.equal(metaContent(html, "name", "description"), metadata.description, `${route} description`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${escapeRegExp(expectedCanonical)}"`));
  assert.equal(metaContent(html, "property", "og:site_name"), SITE_NAME);
  assert.equal(metaContent(html, "property", "og:title"), expectedTitle);
  assert.equal(metaContent(html, "property", "og:description"), metadata.description);
  assert.equal(metaContent(html, "property", "og:url"), expectedCanonical);
  assert.equal(metaContent(html, "property", "og:image"), socialImage);
  assert.equal(metaContent(html, "property", "og:image:width"), String(SOCIAL_IMAGE_WIDTH));
  assert.equal(metaContent(html, "property", "og:image:height"), String(SOCIAL_IMAGE_HEIGHT));
  assert.equal(metaContent(html, "property", "og:image:alt"), SOCIAL_IMAGE_ALT);
  assert.equal(metaContent(html, "name", "twitter:card"), "summary_large_image");
  assert.equal(metaContent(html, "name", "twitter:site"), X_HANDLE);
  assert.equal(metaContent(html, "name", "twitter:creator"), X_HANDLE);
  assert.equal(metaContent(html, "name", "twitter:title"), expectedTitle);
  assert.equal(metaContent(html, "name", "twitter:description"), metadata.description);
  assert.equal(metaContent(html, "name", "twitter:url"), expectedCanonical);
  assert.equal(metaContent(html, "name", "twitter:image"), socialImage);
  assert.equal(metaContent(html, "name", "twitter:image:alt"), SOCIAL_IMAGE_ALT);

  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLdMatch, `${route} should include JSON-LD`);
  const graph = JSON.parse(jsonLdMatch[1]);
  assert.equal(graph["@context"], "https://schema.org");
  assert.deepEqual(graph["@graph"].map((entry: { "@type": string }) => entry["@type"]), ["WebSite", "Person"]);

  const shareMatch = html.match(/<a href="([^"]+)" target="_blank" rel="noopener noreferrer">\s*Share on X/);
  assert.ok(shareMatch, `${route} should include a static X share link`);
  const shareUrl = new URL(decodeHtml(shareMatch[1]));
  assert.equal(shareUrl.origin + shareUrl.pathname, "https://x.com/intent/tweet");
  assert.equal(shareUrl.searchParams.get("text"), expectedTitle);
  assert.equal(shareUrl.searchParams.get("url"), expectedCanonical);
}

const socialImage = readFileSync(join(distDir, SOCIAL_IMAGE_PATH));
assert.deepEqual([...socialImage.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.equal(socialImage.readUInt32BE(16), SOCIAL_IMAGE_WIDTH);
assert.equal(socialImage.readUInt32BE(20), SOCIAL_IMAGE_HEIGHT);

console.log("Build output assertions passed.");
