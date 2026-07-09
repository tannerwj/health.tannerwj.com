import type { BlendVariant } from "./types";

export const blends = [
  {
    id: "practice-wolverine-5-5",
    name: "Practice Wolverine",
    variant: "5 mg BPC-157 / 5 mg TB-500",
    components: [
      { compoundId: "bpc-157", amount: { value: 5, unit: "mg" } },
      { compoundId: "tb-500", amount: { value: 5, unit: "mg" } }
    ],
    commonWaterMl: [2, 3],
    dosePresets: [
      {
        label: "Practice draw anchored to BPC-157",
        anchorCompoundId: "bpc-157",
        target: { value: 250, unit: "mcg" }
      }
    ],
    featured: true,
    editable: true,
    practiceOnly: true,
    practiceNote: "Practice blend variant for schema validation only; not Tanner's stack."
  },
  {
    id: "practice-wolverine-10-10",
    name: "Practice Wolverine",
    variant: "10 mg BPC-157 / 10 mg TB-500",
    components: [
      { compoundId: "bpc-157", amount: { value: 10, unit: "mg" } },
      { compoundId: "tb-500", amount: { value: 10, unit: "mg" } }
    ],
    commonWaterMl: [2, 4],
    dosePresets: [
      {
        label: "Practice draw anchored to TB-500",
        anchorCompoundId: "tb-500",
        target: { value: 1, unit: "mg" }
      }
    ],
    editable: true,
    practiceOnly: true,
    practiceNote: "Practice blend variant for schema validation only; not Tanner's stack."
  }
] satisfies BlendVariant[];
