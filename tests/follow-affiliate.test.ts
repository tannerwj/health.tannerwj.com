import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string) {
  return readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

function frontmatter(relativePath: string) {
  const match = read(relativePath).match(/^---\n([\s\S]*?)\n---/);
  assert(match, `${relativePath} must have frontmatter`);
  return parseYaml(match[1]) as Record<string, unknown>;
}

test("Amazon search links use Tanner's affiliate tag and map to six known items", () => {
  const affiliates = JSON.parse(read("src/data/affiliates.json")) as Record<
    string,
    { vendor: string; product: string; url: string }
  >;
  const expectedMappings = new Map([
    ["src/content/supplements/magnesium-glycinate.md", "amazon-magnesium-glycinate"],
    ["src/content/supplements/creatine-monohydrate.md", "amazon-creatine-monohydrate"],
    ["src/content/supplements/l-theanine.md", "amazon-l-theanine"],
    ["src/content/sleep/mouth-tape.md", "amazon-mouth-tape"],
    ["src/content/sleep/eye-mask.md", "amazon-eye-mask"],
    ["src/content/sleep/10000-lux-light.md", "amazon-10000-lux-light"]
  ]);

  assert.equal(Object.keys(affiliates).length, 6);
  assert(!JSON.stringify(affiliates).includes("example.com"));
  assert(!JSON.stringify(affiliates).includes("practice"));

  for (const [key, affiliate] of Object.entries(affiliates)) {
    const url = new URL(affiliate.url);
    assert.equal(affiliate.vendor, "Amazon");
    assert.equal(url.origin, "https://www.amazon.com");
    assert.equal(url.pathname, "/s");
    assert(url.searchParams.get("k"), `${key} must include a search query`);
    assert.equal(url.searchParams.get("tag"), "tannerwj-20");
    assert.match(affiliate.product, /search results$/i);
  }

  for (const [file, affiliateKey] of expectedMappings) {
    assert.equal(frontmatter(file).affiliate, affiliateKey);
    assert(affiliates[affiliateKey], `${affiliateKey} must exist in the affiliate registry`);
  }

  assert.equal(frontmatter("src/content/sleep/temperature-controlled-bed.md").affiliate, undefined);
});

test("affiliate calls to action are transparent and sponsored", () => {
  for (const file of [
    "src/components/supplements/SupplementList.astro",
    "src/components/sleep/SleepEntry.astro"
  ]) {
    const component = read(file);
    assert.match(component, /rel="sponsored noreferrer"/);
    assert.match(component, /Search Amazon for/);
    assert.doesNotMatch(component, />\s*Buy\b/i);
    assert.doesNotMatch(component, /Product context:/);
  }
});

test("Rhonda Patrick remains one person with two primary X profiles", () => {
  const rhonda = frontmatter("src/content/follow/rhonda-patrick.md") as {
    name: string;
    handle: string;
    url: string;
    profiles: Array<{ handle: string; url: string; platform: string }>;
  };

  assert.equal(rhonda.name, "Rhonda Patrick");
  assert.equal(rhonda.handle, "@foundmyfitness");
  assert.deepEqual(rhonda.profiles, [
    { handle: "@foundmyfitness", url: "https://x.com/foundmyfitness", platform: "x" },
    { handle: "@fmfclips", url: "https://x.com/fmfclips", platform: "x" }
  ]);

  const followComponent = read("src/components/follow/FollowEntry.astro");
  const followPage = read("src/pages/follow.astro");
  assert.match(followComponent, /entry\.data\.profiles/);
  assert.match(followComponent, /href=\{profile\.url\}/);
  assert.match(followComponent, /\{profile\.handle\}/);
  assert.match(followPage, /entry\.data\.profiles/);

  const ben = frontmatter("src/content/follow/ben-patrick.md");
  assert.equal(ben.name, "Ben Patrick");
  assert.equal(ben.platform, "website");
  assert.equal(ben.handle, "atgonlinecoaching.com");
});
