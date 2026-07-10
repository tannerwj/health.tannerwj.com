import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { validateIntegrity, type ValidationInput } from "../scripts/validate-content";
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

test("statusless sourced supplements remain separate from personal stack groups", () => {
  const supplementsDir = path.join(workspaceRoot, "src/content/supplements");
  const entries = readdirSync(supplementsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const content = readFileSync(path.join(supplementsDir, file), "utf8");
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
      assert(frontmatter, `${file} must have frontmatter`);
      return parseYaml(frontmatter[1]) as {
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

  assert.equal(personalEntries.length, 3);
  assert.deepEqual(
    sourceNotes.map((entry) => entry.slug),
    ["apigenin", "glycine", "myo-inositol", "melatonin-caution"]
  );

  const supplementsPage = readFileSync(path.join(workspaceRoot, "src/pages/supplements.astro"), "utf8");
  const supplementList = readFileSync(
    path.join(workspaceRoot, "src/components/supplements/SupplementList.astro"),
    "utf8"
  );
  assert.match(supplementsPage, /const sourceNotes = entries\.filter/);
  assert.match(supplementsPage, /heading="Source notes"/);
  assert.match(supplementList, /: "Source note"/);
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
