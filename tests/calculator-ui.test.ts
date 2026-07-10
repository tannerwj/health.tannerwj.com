import assert from "node:assert/strict";
import test from "node:test";
import { blends } from "../src/data/calculator/blends";
import { compounds } from "../src/data/calculator/compounds";
import {
  buildMassPresetOptions,
  buildWaterPresetOptions,
  getBlendDefaults,
  getDefaultAnchorForBlend,
  getSingleCompoundDefaults,
  quantityKey
} from "../src/lib/calculator/catalog-ui";
import {
  CALCULATOR_PREFERENCES_VERSION,
  parseCalculatorPreferences,
  serializeCalculatorPreferences,
  type CalculatorPreferences
} from "../src/lib/calculator/preferences";

const compoundsById = Object.fromEntries(compounds.map((compound) => [compound.id, compound]));
const catalogContext = {
  compoundIds: compounds.map((compound) => compound.id),
  blendIds: blends.map((blend) => blend.id)
};

test("calculator preferences parse valid saved state and filter stale catalog ids", () => {
  const raw = JSON.stringify({
    version: CALCULATOR_PREFERENCES_VERSION,
    mode: "blend",
    compoundId: "bpc-157",
    blendId: "wolverine-5-5",
    favoriteCompoundIds: ["bpc-157", "missing", "bpc-157", "tb-500"],
    favoriteBlendIds: ["missing", "glow-57-27-12-54-10-45"],
    single: {
      vialMode: "custom",
      catalogVialKey: "mg:5",
      customVialQuantity: { value: 7.5, unit: "mg" },
      waterVolumeMl: 2,
      desiredDose: { value: 250, unit: "mcg" },
      doseUnit: "mcg",
      syringeCapacityMl: 0.5
    },
    blend: {
      waterVolumeMl: 3,
      syringeCapacityMl: 1,
      drawMode: "direct",
      anchorCompoundId: "bpc-157",
      anchorTarget: { value: 250, unit: "mcg" },
      directDraw: { value: 12, unit: "units" }
    }
  });

  const parsed = parseCalculatorPreferences(raw, catalogContext);

  assert.equal(parsed?.mode, "blend");
  assert.equal(parsed?.compoundId, "bpc-157");
  assert.equal(parsed?.blendId, "wolverine-5-5");
  assert.deepEqual(parsed?.favoriteCompoundIds, ["bpc-157", "tb-500"]);
  assert.deepEqual(parsed?.favoriteBlendIds, ["glow-57-27-12-54-10-45"]);
  assert.deepEqual(parsed?.single?.customVialQuantity, { value: 7.5, unit: "mg" });
  assert.equal(parsed?.single?.syringeCapacityMl, 0.5);
  assert.deepEqual(parsed?.blend?.directDraw, { value: 12, unit: "units" });
});

test("calculator preferences gracefully reject corrupt, old, and invalid saved state", () => {
  assert.equal(parseCalculatorPreferences("{bad json", catalogContext), null);
  assert.equal(parseCalculatorPreferences(JSON.stringify({ version: 99 }), catalogContext), null);

  const parsed = parseCalculatorPreferences(
    JSON.stringify({
      version: CALCULATOR_PREFERENCES_VERSION,
      compoundId: "missing",
      blendId: "missing",
      single: {
        customVialQuantity: { value: -1, unit: "mg" },
        desiredDose: { value: 250, unit: "iu" },
        syringeCapacityMl: 2
      },
      blend: {
        directDraw: { value: 0, unit: "drops" }
      }
    }),
    catalogContext
  );

  assert.deepEqual(parsed, { version: CALCULATOR_PREFERENCES_VERSION });
});

test("calculator preference serialization keeps the versioned public schema stable", () => {
  const preferences: CalculatorPreferences = {
    version: CALCULATOR_PREFERENCES_VERSION,
    mode: "single",
    compoundId: "semaglutide",
    favoriteCompoundIds: ["semaglutide"],
    single: {
      vialMode: "catalog",
      catalogVialKey: "mg:10",
      waterVolumeMl: 2,
      desiredDose: { value: 0.25, unit: "mg" },
      doseUnit: "mg",
      syringeCapacityMl: 0.3
    }
  };

  const parsed = parseCalculatorPreferences(serializeCalculatorPreferences(preferences), catalogContext);

  assert.deepEqual(parsed, preferences);
});

test("single-compound UI defaults and preset keys come from structured catalog quantities", () => {
  const bpc157 = compounds.find((compound) => compound.id === "bpc-157");
  assert(bpc157);

  const defaults = getSingleCompoundDefaults(bpc157);
  const vialPresets = buildMassPresetOptions(bpc157.commonVials);
  const waterPresets = buildWaterPresetOptions(bpc157.commonWaterMl);

  assert.deepEqual(defaults.vialQuantity, { value: 5, unit: "mg" });
  assert.equal(defaults.vialPresetKey, quantityKey({ value: 5, unit: "mg" }));
  assert.deepEqual(defaults.desiredDose, { value: 250, unit: "mcg" });
  assert.deepEqual(
    vialPresets.map((preset) => preset.key),
    ["mg:5"]
  );
  assert.deepEqual(
    waterPresets.map((preset) => preset.value),
    [1, 2, 3]
  );
});

test("blend UI defaults use catalog presets when present and direct draw when absent", () => {
  const wolverine = blends.find((blend) => blend.id === "wolverine-5-5");
  const glow = blends.find((blend) => blend.id === "glow-57-27-12-54-10-45");
  assert(wolverine);
  assert(glow);

  const wolverineDefaults = getBlendDefaults(wolverine, compoundsById);
  assert.equal(wolverineDefaults.mode.kind, "anchor");
  if (wolverineDefaults.mode.kind === "anchor") {
    assert.equal(wolverineDefaults.mode.anchorCompoundId, "bpc-157");
    assert.deepEqual(wolverineDefaults.mode.target, { value: 250, unit: "mcg" });
  }

  const glowDefaults = getBlendDefaults(glow, compoundsById);
  assert.equal(glowDefaults.mode.kind, "direct");
  if (glowDefaults.mode.kind === "direct") {
    assert.deepEqual(glowDefaults.mode.draw, { value: 10, unit: "units" });
  }

  const glowAnchorFallback = getDefaultAnchorForBlend(glow, compoundsById);
  assert.equal(glowAnchorFallback.anchorCompoundId, "ghk-cu");
  assert.deepEqual(glowAnchorFallback.target, { value: 1, unit: "mg" });
});
