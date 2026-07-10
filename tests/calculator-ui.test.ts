import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { blends } from "../src/data/calculator/blends";
import { compounds } from "../src/data/calculator/compounds";
import {
  buildMassPresetOptions,
  buildWaterPresetOptions,
  getBlendDefaults,
  getDefaultAnchorForBlend,
  getSingleCompoundDefaults,
  moveCatalogSearchIndex,
  normalizeCatalogSearch,
  quantityKey,
  searchBlendCatalog,
  searchCompoundCatalog
} from "../src/lib/calculator/catalog-ui";
import {
  calculatorHrefForCatalogEntry,
  calculatorSelectionHref,
  parseCalculatorSelection,
  replaceCalculatorSelectionInUrl,
  resolveCalculatorSelection
} from "../src/lib/calculator/catalog-query";
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

test("calculator query contract parses valid catalog selections and rejects invalid pairs", () => {
  assert.deepEqual(parseCalculatorSelection("?mode=single&id=bpc-157", catalogContext), {
    mode: "single",
    id: "bpc-157"
  });
  assert.deepEqual(parseCalculatorSelection("mode=blend&id=glow-57-27-12-54-10-45", catalogContext), {
    mode: "blend",
    id: "glow-57-27-12-54-10-45"
  });
  assert.equal(parseCalculatorSelection("?mode=blend&id=bpc-157", catalogContext), null);
  assert.equal(parseCalculatorSelection("?mode=single&id=missing", catalogContext), null);
  assert.equal(parseCalculatorSelection("?mode=single", catalogContext), null);
  assert.equal(parseCalculatorSelection("?mode=other&id=bpc-157", catalogContext), null);
});

test("URL selection wins over saved state while invalid links fall through safely", () => {
  const saved: CalculatorPreferences = {
    version: CALCULATOR_PREFERENCES_VERSION,
    mode: "blend",
    compoundId: "semaglutide",
    blendId: "wolverine-5-5",
    favoriteCompoundIds: ["bpc-157"],
    single: { waterVolumeMl: 3 }
  };

  assert.deepEqual(
    resolveCalculatorSelection("?mode=single&id=bpc-157", saved, catalogContext),
    { selection: { mode: "single", id: "bpc-157" }, source: "url" }
  );
  assert.deepEqual(
    resolveCalculatorSelection("?mode=single&id=missing", saved, catalogContext),
    { selection: { mode: "blend", id: "wolverine-5-5" }, source: "saved" }
  );
  assert.deepEqual(resolveCalculatorSelection("", null, catalogContext), {
    selection: { mode: "single", id: compounds[0].id },
    source: "default"
  });
  assert.deepEqual(saved.favoriteCompoundIds, ["bpc-157"]);
  assert.deepEqual(saved.single, { waterVolumeMl: 3 });
});

test("calculator selection URLs serialize only public catalog identity", () => {
  assert.equal(
    calculatorSelectionHref({ mode: "blend", id: "wolverine-5-5" }),
    "/peptides/calculator?mode=blend&id=wolverine-5-5"
  );
  assert.equal(
    replaceCalculatorSelectionInUrl(
      "https://health.tannerwj.com/peptides/calculator?ref=library#result",
      { mode: "single", id: "bpc-157" }
    ),
    "/peptides/calculator?ref=library&mode=single&id=bpc-157#result"
  );
});

test("every calculator-linked peptide record maps to a validated mode and id deep link", () => {
  const peptideDirectory = new URL("../src/content/peptides/", import.meta.url);
  const linkedRecords = readdirSync(peptideDirectory)
    .filter((file) => file.endsWith(".md"))
    .flatMap((file) => {
      const source = readFileSync(new URL(file, peptideDirectory), "utf8");
      const form = source.match(/^form:\s*(single|blend)$/m)?.[1] as "single" | "blend" | undefined;
      const id = source.match(/^calculatorId:\s*([^\s]+)$/m)?.[1];
      return form && id ? [{ file, form, id }] : [];
    });

  assert(linkedRecords.length > 0);
  for (const record of linkedRecords) {
    assert.equal(
      calculatorHrefForCatalogEntry(record.form, record.id, catalogContext),
      `/peptides/calculator?mode=${record.form}&id=${record.id}`,
      record.file
    );
  }
  assert.equal(calculatorHrefForCatalogEntry("single", "missing", catalogContext), null);
});

test("catalog search normalizes punctuation and ranks exact, prefix, and substring matches", () => {
  assert.equal(normalizeCatalogSearch("  CJC-1295 / Ipamorelin  "), "cjc 1295 ipamorelin");

  const aliasMatches = searchCompoundCatalog(compounds, "Body Protection Compound");
  assert.equal(aliasMatches[0]?.id, "bpc-157");
  assert.equal(aliasMatches[0]?.score, 1);

  const exactMatches = searchCompoundCatalog(compounds, "bpc-157");
  assert.equal(exactMatches[0]?.id, "bpc-157");
  assert.equal(exactMatches[0]?.score, 0);

  const substringMatches = searchCompoundCatalog(compounds, "tection");
  assert.equal(substringMatches[0]?.id, "bpc-157");
  assert.equal(substringMatches[0]?.score, 3);
});

test("catalog search keyboard index wraps, respects the visible limit, and handles empty results", () => {
  assert.equal(moveCatalogSearchIndex(-1, 18, 1, 10), 0);
  assert.equal(moveCatalogSearchIndex(0, 18, -1, 10), 9);
  assert.equal(moveCatalogSearchIndex(9, 18, 1, 10), 0);
  assert.equal(moveCatalogSearchIndex(4, 5, 1, 10), 0);
  assert.equal(moveCatalogSearchIndex(0, 0, 1, 10), -1);
});

test("blend search includes variants, component names and aliases, with visible favorite priority", () => {
  const componentMatches = searchBlendCatalog(blends, "Copper Tripeptide", compoundsById);
  assert.deepEqual(
    componentMatches.map((match) => match.id),
    ["glow-57-27-12-54-10-45", "klow-15-5-5-2"]
  );

  const variantMatches = searchBlendCatalog(blends, "57.27", compoundsById);
  assert.equal(variantMatches[0]?.id, "glow-57-27-12-54-10-45");

  const favoritesFirst = searchBlendCatalog(
    blends,
    "",
    compoundsById,
    new Set(["wolverine-5-5"])
  );
  assert.equal(favoritesFirst[0]?.id, "wolverine-5-5");
  assert.equal(favoritesFirst[0]?.favorite, true);
});
