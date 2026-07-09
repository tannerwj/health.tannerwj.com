import assert from "node:assert/strict";
import test from "node:test";
import { validateIntegrity, type ValidationInput } from "../scripts/validate-content";

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

test("valid relationships pass", () => {
  assert.equal(validateIntegrity(validInput).length, 0);
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
