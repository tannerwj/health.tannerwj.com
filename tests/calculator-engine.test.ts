import assert from "node:assert/strict";
import test from "node:test";
import {
  assessReferenceRange,
  calculateBlend,
  calculateSingleCompound,
  formatDecimal,
  formatMassConcentration,
  formatMassSnapshot,
  formatU100Units,
  formatVolumeMl,
  roundForDisplay,
  syringeCapacityOptions,
  syringeCapacityUnits,
  toMcg,
  toMg,
  type CalculationResult,
  type CompoundCatalogEntry
} from "../src/data/calculator/engine";
import type { BlendVariant } from "../src/data/calculator/types";

const bpc157 = {
  id: "bpc-157",
  name: "BPC-157",
  referenceRanges: [
    {
      label: "Community reference",
      kind: "community",
      min: { value: 250, unit: "mcg" },
      max: { value: 500, unit: "mcg" }
    }
  ]
} satisfies CompoundCatalogEntry;

const tb500 = {
  id: "tb-500",
  name: "TB-500",
  referenceRanges: [
    {
      label: "Community reference",
      kind: "community",
      min: { value: 200, unit: "mcg" },
      max: { value: 400, unit: "mcg" }
    }
  ]
} satisfies CompoundCatalogEntry;

const bareCompound = {
  id: "bare-peptide",
  name: "Bare Peptide"
} satisfies CompoundCatalogEntry;

const wolverine = {
  id: "wolverine-5-5",
  name: "Wolverine",
  variant: "5 mg BPC-157 / 5 mg TB-500",
  components: [
    { compoundId: "bpc-157", amount: { value: 5, unit: "mg" } },
    { compoundId: "tb-500", amount: { value: 5, unit: "mg" } }
  ]
} satisfies BlendVariant;

const ratioBlend = {
  id: "ratio-10-5",
  name: "Ratio Blend",
  variant: "10 mg BPC-157 / 5 mg TB-500",
  components: [
    { compoundId: "bpc-157", amount: { value: 10, unit: "mg" } },
    { compoundId: "tb-500", amount: { value: 5, unit: "mg" } }
  ]
} satisfies BlendVariant;

const compoundsById = {
  "bpc-157": bpc157,
  "tb-500": tb500
};

function approxEqual(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

function expectSuccess<T>(
  result: CalculationResult<T>
): Extract<CalculationResult<T>, { ok: true }> {
  if (!result.ok) {
    assert.fail(`expected success, got issues: ${result.issues.map((issue) => issue.code).join(", ")}`);
  }
  return result;
}

function expectFailure<T>(
  result: CalculationResult<T>
): Extract<CalculationResult<T>, { ok: false }> {
  if (result.ok) {
    assert.fail("expected failure");
  }
  return result;
}

function assertMassSnapshot(
  actual: { mcg: number; mg: number },
  expected: { mcg: number; mg: number },
  tolerance = 1e-9
) {
  approxEqual(actual.mcg, expected.mcg, tolerance);
  approxEqual(actual.mg, expected.mg, tolerance);
}

test("mass conversion helpers normalize mg and mcg without display parsing", () => {
  const cases = [
    {
      quantity: { value: 250, unit: "mcg" as const },
      mcg: 250,
      mg: 0.25
    },
    {
      quantity: { value: 0.25, unit: "mg" as const },
      mcg: 250,
      mg: 0.25
    },
    {
      quantity: { value: 1.5, unit: "mg" as const },
      mcg: 1500,
      mg: 1.5
    }
  ];

  for (const { quantity, mcg, mg } of cases) {
    approxEqual(toMcg(quantity), mcg);
    approxEqual(toMg(quantity), mg);
  }

  assert.deepEqual([...syringeCapacityOptions], [0.3, 0.5, 1]);
  assert.equal(syringeCapacityUnits[0.3], 30);
  assert.equal(syringeCapacityUnits[0.5], 50);
  assert.equal(syringeCapacityUnits[1], 100);
});

test("reference ranges classify below, within, and above after unit normalization", () => {
  const range = {
    label: "Community reference",
    kind: "community" as const,
    min: { value: 100, unit: "mcg" as const },
    max: { value: 200, unit: "mcg" as const }
  };

  const cases = [
    { value: { value: 50, unit: "mcg" as const }, status: "below" as const },
    { value: { value: 0.15, unit: "mg" as const }, status: "within" as const },
    { value: { value: 250, unit: "mcg" as const }, status: "above" as const }
  ];

  for (const { value, status } of cases) {
    const assessment = assessReferenceRange(value, range);
    assert.equal(assessment.status, status);
    assertMassSnapshot(assessment.value, {
      mcg: toMcg(value),
      mg: toMg(value)
    });
  }
});

test("display helpers round explicitly without affecting raw math", () => {
  assert.equal(roundForDisplay(1.005, 2), 1.01);
  assert.equal(formatDecimal(1.005, 2), "1.01");
  assert.equal(formatMassSnapshot({ mcg: 250, mg: 0.25 }, "mg", 2), "0.25 mg");
  assert.equal(formatMassSnapshot({ mcg: 250, mg: 0.25 }, "mcg", 0), "250 mcg");
  assert.equal(formatMassConcentration({ mcgPerMl: 2500, mgPerMl: 2.5 }, "mg", 1), "2.5 mg/mL");
  assert.equal(formatVolumeMl(0.15, 2), "0.15 mL");
  assert.equal(formatU100Units(10, 0), "10 U-100 units");
});

test("single-compound calculations produce reconstitution math, doses per vial, and reference status", () => {
  const result = expectSuccess(
    calculateSingleCompound({
      compound: bpc157,
      vialQuantity: { value: 5, unit: "mg" },
      waterVolumeMl: 2,
      desiredDose: { value: 250, unit: "mcg" },
      syringeCapacityMl: 0.3,
      measurableThresholdUnits: 5
    })
  );

  assert.equal(result.status, "ok");
  assert.equal(result.alerts.length, 0);
  assertMassSnapshot(result.data.vialQuantity, { mcg: 5000, mg: 5 });
  approxEqual(result.data.waterVolumeMl, 2);
  approxEqual(result.data.concentration.mcgPerMl, 2500);
  approxEqual(result.data.concentration.mgPerMl, 2.5);
  assertMassSnapshot(result.data.requestedDose, { mcg: 250, mg: 0.25 });
  assertMassSnapshot(result.data.deliveredDose, { mcg: 250, mg: 0.25 });
  approxEqual(result.data.draw.ml, 0.1);
  approxEqual(result.data.draw.units, 10);
  approxEqual(result.data.dosesPerVial, 20);
  assert.equal(result.data.syringe.capacityUnits, 30);
  assert.equal(result.data.referenceRanges[0]?.status, "within");
});

test("single-compound calculations treat equivalent mg and mcg dose inputs the same", () => {
  const cases = [
    { desiredDose: { value: 250, unit: "mcg" as const } },
    { desiredDose: { value: 0.25, unit: "mg" as const } },
    { desiredDose: { value: 375, unit: "mcg" as const } }
  ];

  for (const { desiredDose } of cases) {
    const result = expectSuccess(
      calculateSingleCompound({
        compound: bpc157,
        vialQuantity: { value: 5, unit: "mg" },
        waterVolumeMl: 2,
        desiredDose,
        syringeCapacityMl: 0.5,
        measurableThresholdUnits: 5
      })
    );

    assert.equal(result.status, "ok");
    approxEqual(result.data.concentration.mcgPerMl, 2500);
    approxEqual(result.data.draw.ml, desiredDose.value === 375 ? 0.15 : 0.1);
    approxEqual(result.data.draw.units, desiredDose.value === 375 ? 15 : 10);
    approxEqual(result.data.dosesPerVial, desiredDose.value === 375 ? 13.333333333333334 : 20);
    assert.equal(result.data.referenceRanges[0]?.status, "within");
  }
});

test("single-compound calculations respect all syringe capacities", () => {
  for (const [capacityMl, expectedUnits] of [
    [0.3, 30],
    [0.5, 50],
    [1, 100]
  ] as const) {
    const result = expectSuccess(
      calculateSingleCompound({
        compound: bareCompound,
        vialQuantity: { value: 5, unit: "mg" },
        waterVolumeMl: 2,
        desiredDose: { value: 250, unit: "mcg" },
        syringeCapacityMl: capacityMl,
        measurableThresholdUnits: 5
      })
    );

    assert.equal(result.status, "ok");
    assert.equal(result.data.syringe.capacityUnits, expectedUnits);
    approxEqual(result.data.draw.units, 10);
    assert.equal(result.alerts.length, 0);
  }
});

test("single-compound guardrails fire deterministically for small and oversized draws", () => {
  const belowThreshold = expectSuccess(
    calculateSingleCompound({
      compound: bareCompound,
      vialQuantity: { value: 5, unit: "mg" },
      waterVolumeMl: 2,
      desiredDose: { value: 50, unit: "mcg" },
      syringeCapacityMl: 1,
      measurableThresholdUnits: 5
    })
  );

  assert.equal(belowThreshold.status, "guardrailed");
  assert.equal(
    belowThreshold.alerts.some((alert) => alert.code === "below-measurable-threshold"),
    true
  );
  approxEqual(belowThreshold.data.draw.units, 2);

  const aboveCapacity = expectSuccess(
    calculateSingleCompound({
      compound: bareCompound,
      vialQuantity: { value: 5, unit: "mg" },
      waterVolumeMl: 2,
      desiredDose: { value: 1000, unit: "mcg" },
      syringeCapacityMl: 0.3,
      measurableThresholdUnits: 5
    })
  );

  assert.equal(aboveCapacity.status, "guardrailed");
  assert.equal(
    aboveCapacity.alerts.some((alert) => alert.code === "above-syringe-capacity"),
    true
  );
  approxEqual(aboveCapacity.data.draw.units, 40);
});

test("single-compound validation rejects zero and negative inputs", () => {
  const cases = [
    {
      name: "zero water volume",
      input: {
        compound: bareCompound,
        vialQuantity: { value: 5, unit: "mg" as const },
        waterVolumeMl: 0,
        desiredDose: { value: 250, unit: "mcg" as const },
        syringeCapacityMl: 0.3
      },
      code: "invalid-water-volume"
    },
    {
      name: "negative desired dose",
      input: {
        compound: bareCompound,
        vialQuantity: { value: 5, unit: "mg" as const },
        waterVolumeMl: 2,
        desiredDose: { value: -1, unit: "mg" as const },
        syringeCapacityMl: 0.3
      },
      code: "invalid-quantity"
    }
  ];

  for (const { name, input, code } of cases) {
    const result = expectFailure(
      calculateSingleCompound({
        measurableThresholdUnits: 5,
        ...input
      })
    );

    assert.equal(result.status, "invalid", name);
    assert.equal(result.issues.some((issue) => issue.code === code), true, name);
  }
});

test("blend anchor solving returns a shared draw and per-component delivery amounts", () => {
  const result = expectSuccess(
    calculateBlend({
      blend: wolverine,
      waterVolumeMl: 2,
      syringeCapacityMl: 0.3,
      measurableThresholdUnits: 5,
      mode: {
        kind: "anchor",
        anchorCompoundId: "bpc-157",
        target: { value: 250, unit: "mcg" }
      },
      compoundsById
    })
  );

  assert.equal(result.status, "ok");
  approxEqual(result.data.draw.ml, 0.1);
  approxEqual(result.data.draw.units, 10);
  approxEqual(result.data.dosesPerVial, 20);
  assert.equal(result.data.anchor?.compoundId, "bpc-157");
  assertMassSnapshot(result.data.anchor?.targetDose ?? { mcg: NaN, mg: NaN }, {
    mcg: 250,
    mg: 0.25
  });
  assert.equal(result.data.anchor?.referenceRanges[0]?.status, "within");
  assertMassSnapshot(result.data.components[0].deliveredDose, { mcg: 250, mg: 0.25 });
  assertMassSnapshot(result.data.components[1].deliveredDose, { mcg: 250, mg: 0.25 });
  approxEqual(result.data.components[0].concentration.mcgPerMl, 2500);
  approxEqual(result.data.components[1].concentration.mcgPerMl, 2500);
  assert.equal(result.alerts.length, 0);
});

test("blend direct-draw mode accepts units or mL and computes per-component delivery", () => {
  const cases = [
    { draw: { value: 20, unit: "units" as const } },
    { draw: { value: 0.2, unit: "mL" as const } }
  ];

  for (const { draw } of cases) {
    const result = expectSuccess(
      calculateBlend({
        blend: ratioBlend,
        waterVolumeMl: 3,
        syringeCapacityMl: 1,
        measurableThresholdUnits: 5,
        mode: {
          kind: "direct",
          draw
        },
        compoundsById
      })
    );

    assert.equal(result.status, "guardrailed");
    approxEqual(result.data.draw.ml, 0.2);
    approxEqual(result.data.draw.units, 20);
    approxEqual(result.data.dosesPerVial, 15);
    assert.equal(result.data.draw.source, "direct");
    assert.equal(result.data.draw.input?.unit, draw.unit);
    approxEqual(result.data.components[0].concentration.mcgPerMl, 3333.3333333333335);
    approxEqual(result.data.components[1].concentration.mcgPerMl, 1666.6666666666667);
    approxEqual(result.data.components[0].deliveredDose.mcg, 666.6666666666667, 1e-8);
    approxEqual(result.data.components[1].deliveredDose.mcg, 333.33333333333337, 1e-8);
    assert.equal(result.data.components[0].referenceRanges[0]?.status, "above");
    assert.equal(result.data.components[1].referenceRanges[0]?.status, "within");
    assert.equal(result.alerts.some((alert) => alert.code === "outside-reference-range"), true);
  }
});

test("blend guardrails fire for small draws, oversized draws, and unknown anchors", () => {
  const smallDraw = expectSuccess(
    calculateBlend({
      blend: wolverine,
      waterVolumeMl: 2,
      syringeCapacityMl: 1,
      measurableThresholdUnits: 5,
      mode: {
        kind: "direct",
        draw: { value: 4, unit: "units" }
      },
      compoundsById
    })
  );

  assert.equal(smallDraw.status, "guardrailed");
  assert.equal(
    smallDraw.alerts.some((alert) => alert.code === "below-measurable-threshold"),
    true
  );

  const oversizedDraw = expectSuccess(
    calculateBlend({
      blend: wolverine,
      waterVolumeMl: 2,
      syringeCapacityMl: 0.3,
      measurableThresholdUnits: 5,
      mode: {
        kind: "direct",
        draw: { value: 35, unit: "units" }
      },
      compoundsById
    })
  );

  assert.equal(oversizedDraw.status, "guardrailed");
  assert.equal(
    oversizedDraw.alerts.some((alert) => alert.code === "above-syringe-capacity"),
    true
  );

  const unknownAnchor = expectFailure(
    calculateBlend({
      blend: wolverine,
      waterVolumeMl: 2,
      syringeCapacityMl: 0.3,
      measurableThresholdUnits: 5,
      mode: {
        kind: "anchor",
        anchorCompoundId: "missing-anchor",
        target: { value: 250, unit: "mcg" }
      },
      compoundsById
    })
  );

  assert.equal(
    unknownAnchor.issues.some((issue) => issue.code === "unknown-anchor-component"),
    true
  );
});
