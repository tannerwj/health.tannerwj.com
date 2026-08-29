import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  parseFrontmatter,
  readTextFile,
  validateIntegrity,
  type ValidationInput
} from "../scripts/validate-content";
import { blends as catalogBlends } from "../src/data/calculator/blends";
import { compounds as catalogCompounds } from "../src/data/calculator/compounds";

const validInput: ValidationInput = {
  requiredCollections: ["supplements"],
  affiliates: {
    "practice-affiliate": {
      vendor: "Practice Vendor",
      product: "Practice Product",
      url: "https://example.com/product"
    }
  },
  compounds: [
    {
      id: "known-compound",
      name: "Known Compound",
      commonVials: [{ value: 5, unit: "mg" }]
    },
    {
      id: "second-compound",
      name: "Second Compound",
      commonVials: [{ value: 10, unit: "mg" }]
    }
  ],
  blends: [
    {
      id: "known-blend",
      name: "Known Blend",
      variant: "5 mg / 10 mg",
      components: [
        { compoundId: "known-compound", amount: { value: 5, unit: "mg" } },
        { compoundId: "second-compound", amount: { value: 10, unit: "mg" } }
      ],
      dosePresets: [
        {
          label: "Known anchor",
          anchorCompoundId: "known-compound",
          target: { value: 250, unit: "mcg" }
        }
      ]
    }
  ],
  editorialEntries: [
    {
      collection: "supplements",
      file: "src/content/supplements/practice-entry.md",
      slug: "practice-entry",
      data: {
        slug: "practice-entry",
        affiliate: "practice-affiliate",
        featured: true,
        homepageOrder: 10
      }
    }
  ]
};

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("frontmatter parses identically from LF and CRLF checkouts", () => {
  const body = ["---", "name: Example", "slug: example", "order: 10", "---", "", "Body text."].join("\n");
  const expected = { name: "Example", slug: "example", order: 10 };

  assert.deepEqual(parseFrontmatter(body, "lf.md"), expected);
  assert.deepEqual(parseFrontmatter(body.replaceAll("\n", "\r\n"), "crlf.md"), expected);
});

test("every content file is committed with LF newlines", () => {
  const contentRoot = path.join(workspaceRoot, "src/content");
  const offenders = readdirSync(contentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((collection) => {
      const dir = path.join(contentRoot, collection.name);
      return readdirSync(dir)
        .filter((file) => file.endsWith(".md"))
        .filter((file) => readFileSync(path.join(dir, file), "utf8").includes("\r\n"))
        .map((file) => `${collection.name}/${file}`);
    });

  assert.deepEqual(offenders, [], "content files must use LF newlines; see .gitattributes");
});

test("the bedtime pair stays coupled and surfaces on the sleep stack", () => {
  const read = (slug: string) =>
    parseFrontmatter(
      readTextFile(path.join(workspaceRoot, "src/content/supplements", `${slug}.md`)),
      slug
    ) as Record<string, unknown>;

  for (const slug of ["magnesium-glycinate", "l-theanine"]) {
    const entry = read(slug);
    assert.equal(entry.status, "current", `${slug} is a personal current item`);
    assert.equal(entry.when, "bedtime", `${slug} must group with the bedtime pair`);
    assert.equal(entry.tier, "foundational", `${slug} is a start-here recommendation`);
    assert.deepEqual(entry.stacks, ["sleep"], `${slug} must surface on the sleep page`);
    assert.equal(entry.dose, "200 mg");
  }

  // The sleep page renders opted-in supplements by linking back, not by copying.
  const sleepPage = readTextFile(path.join(workspaceRoot, "src/pages/sleep.astro"));
  assert.match(sleepPage, /getCollection\("supplements"\)/);
  assert.match(sleepPage, /stacks\?\.includes\("sleep"\)/);
  assert.match(sleepPage, /\/supplements#\$\{entry\.data\.slug\}/);
});

test("supplement time-of-day groups keep every current item reachable", () => {
  const supplementsPage = readTextFile(path.join(workspaceRoot, "src/pages/supplements.astro"));
  // Items without a recorded time must still render, or they vanish from the page.
  assert.match(supplementsPage, /currentUngrouped/);
  assert.match(supplementsPage, /current\.filter\(\(entry\) => !entry\.data\.when\)/);
});

test("statusless sourced supplements remain separate from personal stack groups", () => {
  const supplementsDir = path.join(workspaceRoot, "src/content/supplements");
  const entries = readdirSync(supplementsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      return parseFrontmatter(readTextFile(path.join(supplementsDir, file)), file) as {
        slug: string;
        order: number;
        status?: string;
        sources?: unknown[];
      };
    });

  const personalEntries = entries.filter((entry) => entry.status);
  const sourceNotes = entries
    .filter((entry) => !entry.status && entry.sources?.length)
    .sort((a, b) => a.order - b.order);

  // The supplements page lists what Tanner actually takes plus saved product
  // links. It is deliberately not a catalog of supplements he does not take.
  assert.equal(personalEntries.length, 3);
  assert.deepEqual(sourceNotes, []);

  const supplementsPage = readFileSync(path.join(workspaceRoot, "src/pages/supplements.astro"), "utf8");
  const supplementList = readFileSync(
    path.join(workspaceRoot, "src/components/supplements/SupplementList.astro"),
    "utf8"
  );
  assert.match(supplementsPage, /const sourceNotes = entries\.filter/);
  assert.match(supplementsPage, /heading="Source notes"/);
  assert.match(supplementList, /"Source note"/);
  assert.match(supplementsPage, /heading="Saved product links"/);
  assert.match(supplementList, /"Saved product"/);
});

test("valid relationships pass", () => {
  assert.equal(validateIntegrity(validInput).length, 0);
});

test("empty peptides are valid while relationship failures still fail", () => {
  const emptyPeptides = validateIntegrity({
    ...validInput,
    requiredCollections: ["supplements", "peptides"]
  });

  assert.deepEqual(emptyPeptides, []);

  const brokenRelationship = validateIntegrity({
    ...validInput,
    requiredCollections: ["supplements", "peptides"],
    editorialEntries: [
      {
        ...validInput.editorialEntries[0],
        data: {
          ...validInput.editorialEntries[0].data,
          affiliate: "missing-affiliate"
        }
      }
    ]
  });

  assert(brokenRelationship.some((issue) => issue.code === "unknown-affiliate"));
});

test("unknown affiliate keys fail validation", () => {
  const issues = validateIntegrity({
    ...validInput,
    editorialEntries: [
      {
        ...validInput.editorialEntries[0],
        data: {
          ...validInput.editorialEntries[0].data,
          affiliate: "missing-affiliate"
        }
      }
    ]
  });

  assert(issues.some((issue) => issue.code === "unknown-affiliate"));
});

test("unknown affiliate keys in multi-product lists fail validation", () => {
  const issues = validateIntegrity({
    ...validInput,
    editorialEntries: [
      {
        ...validInput.editorialEntries[0],
        data: {
          ...validInput.editorialEntries[0].data,
          affiliate: undefined,
          affiliates: ["practice-affiliate", "missing-affiliate"]
        }
      }
    ]
  });

  assert(issues.some((issue) => issue.code === "unknown-affiliate"));
});

test("malformed affiliate ASINs fail validation", () => {
  const issues = validateIntegrity({
    ...validInput,
    affiliates: {
      ...validInput.affiliates,
      "bad-asin": {
        vendor: "Amazon",
        product: "Broken product",
        url: "https://amzn.to/example",
        kind: "product",
        asin: "short"
      }
    }
  });

  assert(issues.some((issue) => issue.code === "invalid-asin"));
});

test("unknown calculatorId references fail validation", () => {
  const issues = validateIntegrity({
    ...validInput,
    editorialEntries: [
      {
        ...validInput.editorialEntries[0],
        data: {
          ...validInput.editorialEntries[0].data,
          calculatorId: "missing-calculator-entry"
        }
      }
    ]
  });

  assert(issues.some((issue) => issue.code === "unknown-calculator-id"));
});

test("personal peptide entries require a status", () => {
  const issues = validateIntegrity({
    ...validInput,
    requiredCollections: ["supplements", "peptides"],
    editorialEntries: [
      validInput.editorialEntries[0],
      {
        collection: "peptides",
        file: "src/content/peptides/personal-note.md",
        slug: "personal-note",
        data: { slug: "personal-note", entryType: "personal" }
      }
    ]
  });

  assert(issues.some((issue) => issue.code === "missing-personal-status"));
});

test("peptide source notes require sources and reject personal regimen fields", () => {
  const issues = validateIntegrity({
    ...validInput,
    requiredCollections: ["supplements", "peptides"],
    editorialEntries: [
      validInput.editorialEntries[0],
      {
        collection: "peptides",
        file: "src/content/peptides/source-note.md",
        slug: "source-note",
        data: {
          slug: "source-note",
          entryType: "source-note",
          dose: "Not allowed",
          timing: "Not allowed",
          frequency: "Not allowed",
          cycle: "Not allowed",
          effects: "Not allowed"
        }
      }
    ]
  });

  assert(issues.some((issue) => issue.code === "missing-source-note-source"));
  assert.equal(issues.filter((issue) => issue.code === "source-note-personal-field").length, 5);
});

test("curated peptide library has the accepted shape and calculator coverage", () => {
  const peptideDir = path.join(workspaceRoot, "src/content/peptides");
  const entries = readdirSync(peptideDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      return parseFrontmatter(readTextFile(path.join(peptideDir, file)), file) as {
        slug: string;
        entryType: string;
        form: string;
        calculatorId?: string;
        status?: string;
        dose?: string;
        timing?: string;
        frequency?: string;
        cycle?: string;
        effects?: string;
        sources?: unknown[];
      };
    });

  assert.equal(entries.length, 26);
  assert.equal(entries.filter((entry) => entry.form === "single").length, 20);
  assert.equal(entries.filter((entry) => entry.form === "blend").length, 6);
  assert.equal(entries.filter((entry) => entry.calculatorId).length, 25);
  assert.equal(entries.find((entry) => entry.slug === "beauty")?.calculatorId, undefined);

  const catalogIds = new Set([...catalogCompounds, ...catalogBlends].map((entry) => entry.id));
  for (const entry of entries) {
    assert.equal(entry.entryType, "source-note");
    assert(entry.sources?.length, `${entry.slug} must have a source`);
    assert.equal(entry.status, undefined);
    for (const field of ["dose", "timing", "frequency", "cycle", "effects"] as const) {
      assert.equal(entry[field], undefined, `${entry.slug} must not include ${field}`);
    }
    if (entry.calculatorId) {
      assert(catalogIds.has(entry.calculatorId), `${entry.slug} has an unknown calculator ID`);
    }
  }
});

test("blend components must reference known compounds", () => {
  const issues = validateIntegrity({
    ...validInput,
    blends: [
      {
        ...validInput.blends[0],
        components: [
          { compoundId: "known-compound", amount: { value: 5, unit: "mg" } },
          { compoundId: "missing-compound", amount: { value: 10, unit: "mg" } }
        ]
      }
    ]
  });

  assert(issues.some((issue) => issue.code === "unknown-blend-compound"));
});

test("nonpositive quantities fail validation", () => {
  const issues = validateIntegrity({
    ...validInput,
    compounds: [
      {
        id: "known-compound",
        name: "Known Compound",
        commonVials: [{ value: 0, unit: "mg" }]
      },
      validInput.compounds[1]
    ]
  });

  assert(issues.some((issue) => issue.code === "invalid-quantity"));
});

test("calculator source references must be valid", () => {
  const issues = validateIntegrity({
    ...validInput,
    compounds: [
      {
        id: "known-compound",
        name: "Known Compound",
        commonVials: [{ value: 5, unit: "mg" }],
        referenceRanges: [
          {
            label: "Broken source reference",
            kind: "community",
            min: { value: 100, unit: "mcg" },
            max: { value: 200, unit: "mcg" },
            sourceIds: ["missing-source"]
          }
        ],
        sources: [
          {
            id: "bad source id",
            type: "local-file"
          }
        ]
      },
      validInput.compounds[1]
    ]
  });

  assert(issues.some((issue) => issue.code === "invalid-source-id"));
  assert(issues.some((issue) => issue.code === "unknown-source-id"));
});

test("homepage order collisions fail validation", () => {
  const issues = validateIntegrity({
    ...validInput,
    editorialEntries: [
      validInput.editorialEntries[0],
      {
        collection: "supplements",
        file: "src/content/supplements/second-entry.md",
        slug: "second-entry",
        data: {
          slug: "second-entry",
          featured: true,
          homepageOrder: 10
        }
      }
    ]
  });

  assert(issues.some((issue) => issue.code === "homepage-order-collision"));
});

test("curated calculator catalog passes integrity checks", () => {
  const issues = validateIntegrity({
    requiredCollections: [],
    affiliates: {},
    compounds: catalogCompounds,
    blends: catalogBlends,
    editorialEntries: []
  });

  assert.deepEqual(issues, []);
  assert(catalogCompounds.length >= 12 && catalogCompounds.length <= 20);
  assert(catalogBlends.length >= 5);
  assert(!catalogCompounds.some((compound) => compound.practiceOnly));
  assert(!catalogBlends.some((blend) => blend.practiceOnly));

  for (const id of [
    "bpc-157",
    "tb-500",
    "ghk-cu",
    "kpv",
    "ipamorelin",
    "cjc-1295",
    "semaglutide",
    "tirzepatide"
  ]) {
    assert(catalogCompounds.some((compound) => compound.id === id), `Missing ${id}`);
  }

  for (const id of [
    "glow-57-27-12-54-10-45",
    "klow-15-5-5-2",
    "wolverine-5-5",
    "healing-5-2-5-2",
    "cjc-ipamorelin-2-5"
  ]) {
    assert(catalogBlends.some((blend) => blend.id === id), `Missing ${id}`);
  }
});

test("curated catalog includes a unit-normalization-sensitive blend preset", () => {
  const hasMixedAnchorUnits = catalogBlends.some((blend) =>
    blend.dosePresets?.some((dosePreset) => {
      const anchor = blend.components.find(
        (component) => component.compoundId === dosePreset.anchorCompoundId
      );
      return anchor && anchor.amount.unit !== dosePreset.target.unit;
    })
  );

  assert(hasMixedAnchorUnits);
});
