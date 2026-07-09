import type { BlendVariant, CalculatorSource, MassUnit, Quantity } from "./types";

const accessed = "2026-07-09";

function q(value: number, unit: MassUnit): Quantity<MassUnit> {
  return { value, unit };
}

function source(id: string, note: string): CalculatorSource {
  return {
    id,
    type: "local-file",
    note,
    accessed
  };
}

const oldDosingBlendSource = (blend: string) =>
  source(
    `old-dosing-blend-${blend}`,
    "Named blend component amounts curated from /Users/tjohnson/repos/peptides/public/peptide-dosing-data.json."
  );

const oldCalculatorBlendSource = (blend: string) =>
  source(
    `old-calculator-blend-${blend}`,
    "Named blend component amounts curated from /Users/tjohnson/repos/peptides/public/calculator.html BLENDS."
  );

export const blends = [
  {
    id: "healing-5-2-5-2",
    name: "Healing",
    variant: "5 mg TB-500 / 2.5 mg BPC-157 / 2 mg KPV",
    components: [
      { compoundId: "tb-500", amount: q(5, "mg") },
      { compoundId: "bpc-157", amount: q(2.5, "mg") },
      { compoundId: "kpv", amount: q(2, "mg") }
    ],
    commonWaterMl: [2, 3],
    dosePresets: [
      {
        label: "Community reference anchored to BPC-157",
        anchorCompoundId: "bpc-157",
        target: q(250, "mcg")
      }
    ],
    featured: true,
    editable: true,
    sources: [oldDosingBlendSource("healing"), oldCalculatorBlendSource("healing")]
  },
  {
    id: "cjc-ipamorelin-2-5",
    name: "CJC-1295 / Ipamorelin",
    variant: "2 mg CJC-1295 without DAC / 5 mg Ipamorelin",
    components: [
      { compoundId: "cjc-1295", amount: q(2, "mg") },
      { compoundId: "ipamorelin", amount: q(5, "mg") }
    ],
    commonWaterMl: [2, 3],
    dosePresets: [
      {
        label: "Community reference anchored to Ipamorelin",
        anchorCompoundId: "ipamorelin",
        target: q(250, "mcg")
      }
    ],
    featured: true,
    editable: true,
    sources: [oldDosingBlendSource("gh"), oldCalculatorBlendSource("gh")]
  },
  {
    id: "wolverine-5-5",
    name: "Wolverine",
    variant: "5 mg TB-500 / 5 mg BPC-157",
    components: [
      { compoundId: "tb-500", amount: q(5, "mg") },
      { compoundId: "bpc-157", amount: q(5, "mg") }
    ],
    commonWaterMl: [2, 3],
    dosePresets: [
      {
        label: "Community reference anchored to BPC-157",
        anchorCompoundId: "bpc-157",
        target: q(250, "mcg")
      },
      {
        label: "Community reference anchored to TB-500",
        anchorCompoundId: "tb-500",
        target: q(1, "mg")
      }
    ],
    featured: true,
    editable: true,
    sources: [oldDosingBlendSource("wolverine"), oldCalculatorBlendSource("wolverine")]
  },
  {
    id: "klow-15-5-5-2",
    name: "KLOW",
    variant: "15 mg GHK-Cu / 5 mg TB-500 / 5 mg BPC-157 / 2 mg KPV",
    components: [
      { compoundId: "ghk-cu", amount: q(15, "mg") },
      { compoundId: "tb-500", amount: q(5, "mg") },
      { compoundId: "bpc-157", amount: q(5, "mg") },
      { compoundId: "kpv", amount: q(2, "mg") }
    ],
    commonWaterMl: [3, 5],
    featured: true,
    editable: true,
    sources: [oldDosingBlendSource("klow"), oldCalculatorBlendSource("klow")]
  },
  {
    id: "glow-57-27-12-54-10-45",
    name: "GLOW",
    variant: "57.27 mg GHK-Cu / 12.54 mg BPC-157 / 10.45 mg TB-500",
    components: [
      { compoundId: "ghk-cu", amount: q(57.27, "mg") },
      { compoundId: "bpc-157", amount: q(12.54, "mg") },
      { compoundId: "tb-500", amount: q(10.45, "mg") }
    ],
    commonWaterMl: [3, 5],
    featured: true,
    editable: true,
    sources: [oldCalculatorBlendSource("glow")]
  }
] satisfies BlendVariant[];
