import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, readTextFile } from "../scripts/validate-content";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string) {
  return readTextFile(path.join(workspaceRoot, relativePath));
}

function frontmatter(relativePath: string) {
  return parseFrontmatter(read(relativePath), relativePath);
}

test("Amazon links preserve generic searches and exact amzn.to product links", () => {
  const affiliates = JSON.parse(read("src/data/affiliates.json")) as Record<
    string,
    { vendor: string; product: string; url: string; kind?: string; asin?: string }
  >;
  const expectedMappings = new Map([
    ["src/content/supplements/magnesium-glycinate.md", "amazon-magnesium-glycinate"],
    ["src/content/supplements/l-theanine.md", "amazon-l-theanine"],
    ["src/content/sleep/mouth-tape.md", "amazon-nexcare-mouth-tape"],
    ["src/content/sleep/eye-mask.md", "amazon-eye-mask"],
    ["src/content/sleep/10000-lux-light.md", "amazon-carex-day-light-classic-plus"],
    ["src/content/sleep/temperature-controlled-bed.md", "eight-sleep-pod"],
    ["src/content/sleep/ultrahuman-ring.md", "ultrahuman-ring-pro"]
  ]);

  const exactProducts = [
    ["amazon-thorne-basic-nutrients-2-day", "B00FOTMGTU", "https://amzn.to/4h7u1vX"],
    ["amazon-timeline-mitopure-gummies", "B0F1ZJM7X6", "https://amzn.to/4grzsWm"],
    ["amazon-bucked-up-creatine-blue-raspberry", "B0DW7FCXRY", "https://amzn.to/3STSJpG"],
    ["amazon-bucked-up-creatine-mango-pineapple", "B0DW7BQLG8", "https://amzn.to/4paLgyo"],
    ["amazon-easy-touch-insulin-syringes", "B07P2HV7XQ", "https://amzn.to/44n4xDu"],
    ["amazon-medpride-alcohol-prep-pads", "B07F2MQ9NJ", "https://amzn.to/4vjF8Fz"],
    ["amazon-avmacol-sulforaphane", "B07V485YZH", "https://amzn.to/44sq7q2"],
    ["amazon-nutricost-ubiquinol", "B0C87VT8CW", "https://amzn.to/4aNBRHn"],
    ["amazon-now-curcumin-phytosome", "B004AC0676", "https://amzn.to/4wzaclH"],
    ["amazon-magnesium-glycinate", "B0C2XSJ9H5", "https://amzn.to/3Si6EG2"],
    ["amazon-l-theanine", "B01F261E88", "https://amzn.to/4xOz2yT"],
    ["amazon-pure-encapsulations-one-multivitamin", "B00CBYG1L0", "https://amzn.to/4zJ7nkm"],
    ["amazon-nordic-naturals-ultimate-omega", "B0739KKHWL", "https://amzn.to/4h0SgeM"],
    ["amazon-nexcare-mouth-tape", "B00KOC7FFM", "https://amzn.to/4h3h1pN"],
    ["amazon-carex-day-light-classic-plus", "B00PCN4UVU", "https://amzn.to/4y8ObLl"]
  ] as const;

  // Referral links from vendors that run their own programs, not Amazon.
  const directVendors = new Map([
    ["eight-sleep-pod", "https://refer.eight.sl/tanner85"],
    ["ultrahuman-ring-pro", "https://www.ultrahuman.com/ring-pro/buy/?referral=1zjotd"]
  ]);

  assert.equal(Object.keys(affiliates).length, 18);
  assert(!JSON.stringify(affiliates).includes("example.com"));
  assert(!JSON.stringify(affiliates).includes("practice"));

  for (const [key, affiliate] of Object.entries(affiliates)) {
    const url = new URL(affiliate.url);
    if (directVendors.has(key)) {
      // A direct vendor referral has no ASIN and is not an amzn.to short link.
      assert.notEqual(affiliate.vendor, "Amazon", `${key} is a direct vendor link`);
      assert.equal(affiliate.url, directVendors.get(key));
      assert.equal(affiliate.asin, undefined, `${key} must not claim an ASIN`);
      assert.equal(url.protocol, "https:");
      continue;
    }
    assert.equal(affiliate.vendor, "Amazon");
    if (affiliate.kind === "product") {
      assert.equal(url.origin, "https://amzn.to");
      assert.equal(url.search, "", `${key} must preserve the provided short URL without appended parameters`);
      assert.match(affiliate.asin ?? "", /^[A-Z0-9]{10}$/);
    } else {
      assert.equal(url.origin, "https://www.amazon.com");
      assert.equal(url.pathname, "/s");
      assert(url.searchParams.get("k"), `${key} must include a search query`);
      assert.equal(url.searchParams.get("tag"), "tannerwj-20");
      assert.match(affiliate.product, /search results$/i);
    }
  }

  for (const [key, asin, url] of exactProducts) {
    assert.equal(affiliates[key].asin, asin);
    assert.equal(affiliates[key].url, url);
    assert.equal(affiliates[key].kind, "product");
  }

  for (const [file, affiliateKey] of expectedMappings) {
    assert.equal(frontmatter(file).affiliate, affiliateKey);
    assert(affiliates[affiliateKey], `${affiliateKey} must exist in the affiliate registry`);
  }

  
  assert.deepEqual(frontmatter("src/content/supplements/creatine-monohydrate.md").affiliates, [
    "amazon-bucked-up-creatine-blue-raspberry",
    "amazon-bucked-up-creatine-mango-pineapple"
  ]);
  assert.equal(affiliates["amazon-creatine-monohydrate"], undefined);

  const productMappings = new Map([
    ["src/content/supplements/thorne-basic-nutrients-2-day.md", "amazon-thorne-basic-nutrients-2-day"],
    ["src/content/supplements/timeline-mitopure-urolithin-a-gummies.md", "amazon-timeline-mitopure-gummies"],
    ["src/content/supplements/avmacol-sulforaphane.md", "amazon-avmacol-sulforaphane"],
    ["src/content/supplements/nutricost-ubiquinol.md", "amazon-nutricost-ubiquinol"],
    ["src/content/supplements/now-curcumin-phytosome.md", "amazon-now-curcumin-phytosome"]
  ]);
  for (const [file, affiliateKey] of productMappings) {
    const data = frontmatter(file);
    assert.equal(data.affiliate, affiliateKey);
    // Anything not currently taken must not carry a live dose or timing.
    if (data.status !== "current") {
      assert.equal(data.dose, undefined, `${file} is not current and must not state a dose`);
      assert.equal(data.timing, undefined, `${file} is not current and must not state timing`);
    }
  }

  const avmacol = frontmatter("src/content/supplements/avmacol-sulforaphane.md");
  assert.equal(avmacol.name, "Avmacol Sulforaphane-Producing Supplement");
  assert.match(String(avmacol.summary), /glucoraphanin/i);
  assert.match(String(avmacol.summary), /active myrosinase/i);
  assert.equal(
    affiliates["amazon-avmacol-sulforaphane"].product,
    "Avmacol Sulforaphane-Producing Supplement, 60 tablets"
  );

  const supplyMappings = new Map([
    ["src/content/supplies/easy-touch-insulin-syringes.md", "amazon-easy-touch-insulin-syringes"],
    ["src/content/supplies/medpride-alcohol-prep-pads.md", "amazon-medpride-alcohol-prep-pads"]
  ]);
  for (const [file, affiliateKey] of supplyMappings) {
    const data = frontmatter(file);
    assert.equal(data.category, "peptide-preparation");
    assert.deepEqual(data.affiliates, [affiliateKey]);
    assert.equal(data.status, undefined);
  }
});

test("affiliate calls to action are transparent and sponsored", () => {
  // Outbound product links render in exactly one place, so the sponsored
  // relationship and new-tab behaviour cannot drift between collections.
  const shared = read("src/components/site/AffiliateLinks.astro");
  assert.match(shared, /target="_blank" rel="sponsored noreferrer noopener"/);
  assert.match(shared, /getAffiliateEntries/);
  assert.doesNotMatch(shared, /Search Amazon for/);
  assert.doesNotMatch(shared, />\s*Buy/i);

  for (const file of [
    "src/components/supplements/SupplementList.astro",
    "src/components/sleep/SleepEntry.astro",
    "src/components/exercise/ExerciseGroup.astro",
    "src/components/peptides/PeptideSupplies.astro"
  ]) {
    const component = read(file);
    assert.match(component, /<AffiliateLinks /, `${file} must use the shared component`);
    // No collection may hand-roll its own outbound link markup.
    assert.doesNotMatch(component, /rel="sponsored/, `${file} must not inline an affiliate link`);
  }

  const affiliateHelper = read("src/lib/affiliates.ts");
  // The label names the actual vendor, now that not every link is Amazon.
  assert.match(affiliateHelper, /View \$\{affiliate\.product\} on \$\{affiliate\.vendor\}/);

  // Affiliate disclosure lives once in the site footer, not per page.
  assert(!existsSync(path.join(workspaceRoot, "src/components/site/AmazonDisclosure.astro")));
  assert.match(read("src/data/site.ts"), /Some links are affiliate links/);
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
