import type { Compound } from "./types";

export const compounds = [
  {
    id: "bpc-157",
    name: "BPC-157",
    aliases: ["Body Protection Compound 157"],
    description:
      "Practice calculator compound used to exercise explicit vial and dose units.",
    commonVials: [
      { value: 5, unit: "mg" },
      { value: 10, unit: "mg" }
    ],
    commonWaterMl: [1, 2, 3],
    dosePresets: [
      { label: "Practice 250 mcg reference", value: 250, unit: "mcg" },
      { label: "Practice 500 mcg reference", value: 500, unit: "mcg" }
    ],
    referenceRanges: [
      {
        label: "Practice community reference",
        kind: "community",
        min: { value: 250, unit: "mcg" },
        max: { value: 500, unit: "mcg" },
        sourceIds: ["practice-pep-pedia-bpc-157"]
      }
    ],
    sources: [
      {
        id: "practice-pep-pedia-bpc-157",
        type: "pep-pedia",
        url: "https://pep-pedia.org/bpc-157",
        note: "Practice provenance entry; not launch content.",
        accessed: "2026-07-09"
      }
    ],
    practiceOnly: true,
    practiceNote: "Practice data for schema validation only; not Tanner's stack."
  },
  {
    id: "tb-500",
    name: "TB-500",
    aliases: ["Thymosin Beta-4 fragment"],
    description:
      "Practice calculator compound used to exercise blend component references.",
    commonVials: [
      { value: 5, unit: "mg" },
      { value: 10, unit: "mg" }
    ],
    commonWaterMl: [2, 3],
    dosePresets: [
      { label: "Practice 1 mg reference", value: 1, unit: "mg" },
      { label: "Practice 2 mg reference", value: 2, unit: "mg" }
    ],
    referenceRanges: [
      {
        label: "Practice community reference",
        kind: "community",
        min: { value: 1, unit: "mg" },
        max: { value: 2, unit: "mg" },
        sourceIds: ["practice-pep-pedia-tb-500"]
      }
    ],
    sources: [
      {
        id: "practice-pep-pedia-tb-500",
        type: "pep-pedia",
        url: "https://pep-pedia.org/tb-500",
        note: "Practice provenance entry; not launch content.",
        accessed: "2026-07-09"
      }
    ],
    practiceOnly: true,
    practiceNote: "Practice data for schema validation only; not Tanner's stack."
  }
] satisfies Compound[];
