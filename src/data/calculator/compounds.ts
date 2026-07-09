import type { CalculatorSource, Compound, MassUnit, Quantity } from "./types";

const accessed = "2026-07-09";
const defaultWaterMl = [1, 2, 3];

function q(value: number, unit: MassUnit): Quantity<MassUnit> {
  return { value, unit };
}

function preset(label: string, value: number, unit: MassUnit) {
  return { label, value, unit };
}

function pepPediaSource(slug: string, note?: string): CalculatorSource {
  return {
    id: `old-pep-pedia-${slug}`,
    type: "pep-pedia",
    note:
      note ??
      "Pep-Pedia-derived old dataset values curated from /Users/tjohnson/repos/peptides/public/peptide-data.json and peptide-data-processed.json; no page URL verified.",
    accessed
  };
}

function oldCalculatorSource(slug: string): CalculatorSource {
  return {
    id: `old-calculator-${slug}`,
    type: "local-file",
    note:
      "Old site calculator default vial amount curated from /Users/tjohnson/repos/peptides/public/calculator.html DEFAULT_VIAL_MG.",
    accessed
  };
}

function compoundSources(slug: string, extraSources: CalculatorSource[] = []) {
  return [pepPediaSource(slug), oldCalculatorSource(slug), ...extraSources];
}

export const compounds = [
  {
    id: "aod-9604",
    name: "AOD-9604",
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(5, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 250, "mcg"),
      preset("Community reference high", 500, "mcg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(250, "mcg"),
        max: q(500, "mcg"),
        sourceIds: ["old-pep-pedia-aod-9604"]
      }
    ],
    sources: compoundSources("aod-9604")
  },
  {
    id: "bpc-157",
    name: "BPC-157",
    aliases: ["Body Protection Compound 157"],
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(5, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 250, "mcg"),
      preset("Community reference high", 500, "mcg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(250, "mcg"),
        max: q(500, "mcg"),
        sourceIds: ["old-pep-pedia-bpc-157"]
      }
    ],
    sources: compoundSources("bpc-157")
  },
  {
    id: "cjc-1295",
    name: "CJC-1295 without DAC",
    aliases: ["Modified GRF 1-29"],
    description:
      "Curated calculator catalog entry for vial/BAC-water math; the paired CJC/ipamorelin protocol is modeled separately as a blend.",
    commonVials: [q(5, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 100, "mcg"),
      preset("Community reference high", 300, "mcg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(100, "mcg"),
        max: q(300, "mcg"),
        sourceIds: ["old-pep-pedia-cjc-1295"]
      }
    ],
    sources: compoundSources("cjc-1295")
  },
  {
    id: "cjc-1295-dac",
    name: "CJC-1295 with DAC",
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(2, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 1, "mg"),
      preset("Community reference high", 2, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(1, "mg"),
        max: q(2, "mg"),
        sourceIds: ["old-pep-pedia-cjc-1295-dac"]
      }
    ],
    sources: compoundSources("cjc-1295-dac")
  },
  {
    id: "dsip",
    name: "DSIP",
    aliases: ["Delta Sleep-Inducing Peptide"],
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(5, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 100, "mcg"),
      preset("Community reference high", 300, "mcg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(100, "mcg"),
        max: q(300, "mcg"),
        sourceIds: ["old-pep-pedia-dsip"]
      }
    ],
    sources: compoundSources("dsip")
  },
  {
    id: "epitalon",
    name: "Epitalon",
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 100, "mcg"),
      preset("Community reference high", 500, "mcg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(100, "mcg"),
        max: q(500, "mcg"),
        sourceIds: ["old-pep-pedia-epitalon"]
      }
    ],
    sources: compoundSources("epitalon")
  },
  {
    id: "ghk-cu",
    name: "GHK-Cu",
    aliases: ["Copper Tripeptide-1"],
    description:
      "Included for injectable blend math. Old editorial protocol data is topical-only, while old dosing data and calculator blend data include injectable vial use.",
    commonVials: [q(50, "mg")],
    commonWaterMl: [2, 3, 5],
    dosePresets: [
      preset("Community reference low", 1, "mg"),
      preset("Community reference high", 3, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old dosing data",
        kind: "community",
        min: q(1, "mg"),
        max: q(3, "mg"),
        sourceIds: ["old-dosing-ghk-cu"]
      }
    ],
    sources: [
      pepPediaSource(
        "ghk-cu",
        "Old peptide-data.json GHK-Cu protocols are topical-only; retained as exclusion context, not as injectable-dose support."
      ),
      {
        id: "old-dosing-ghk-cu",
        type: "local-file",
        note:
          "Injectable community range curated from /Users/tjohnson/repos/peptides/public/peptide-dosing-data.json.",
        accessed
      },
      oldCalculatorSource("ghk-cu")
    ]
  },
  {
    id: "ipamorelin",
    name: "Ipamorelin",
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(5, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 200, "mcg"),
      preset("Community reference high", 300, "mcg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(200, "mcg"),
        max: q(300, "mcg"),
        sourceIds: ["old-pep-pedia-ipamorelin"]
      }
    ],
    sources: compoundSources("ipamorelin")
  },
  {
    id: "kpv",
    name: "KPV",
    aliases: ["Lysine-Proline-Valine"],
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 200, "mcg"),
      preset("Community reference high", 500, "mcg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(200, "mcg"),
        max: q(500, "mcg"),
        sourceIds: ["old-pep-pedia-kpv"]
      }
    ],
    sources: compoundSources("kpv")
  },
  {
    id: "melanotan-1",
    name: "Melanotan I",
    aliases: ["Afamelanotide"],
    description:
      "Curated from old protocol rows with explicit subcutaneous doses because the processed typical-dose string is ambiguous.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 0.25, "mg"),
      preset("Community reference high", 0.5, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old protocol rows",
        kind: "community",
        min: q(0.25, "mg"),
        max: q(0.5, "mg"),
        sourceIds: ["old-pep-pedia-melanotan-1"]
      }
    ],
    sources: compoundSources("melanotan-1")
  },
  {
    id: "melanotan-ii",
    name: "Melanotan II",
    description:
      "Curated from old protocol rows with explicit subcutaneous doses because the processed typical-dose string is ambiguous.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Conservative reference", 0.25, "mg"),
      preset("Community reference", 0.5, "mg"),
      preset("High reference", 1, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old protocol rows",
        kind: "community",
        min: q(0.1, "mg"),
        max: q(1, "mg"),
        sourceIds: ["old-pep-pedia-melanotan-ii"]
      }
    ],
    sources: compoundSources("melanotan-ii")
  },
  {
    id: "mots-c",
    name: "MOTS-c",
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 5, "mg"),
      preset("Community reference high", 15, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(5, "mg"),
        max: q(15, "mg"),
        sourceIds: ["old-pep-pedia-mots-c"]
      }
    ],
    sources: compoundSources("mots-c")
  },
  {
    id: "pt-141",
    name: "PT-141",
    aliases: ["Bremelanotide"],
    description:
      "Curated from old protocol rows with explicit subcutaneous doses because the processed typical-dose string is ambiguous.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Low test reference", 0.5, "mg"),
      preset("Community reference", 1.75, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old protocol rows",
        kind: "community",
        min: q(0.5, "mg"),
        max: q(2, "mg"),
        sourceIds: ["old-pep-pedia-pt-141"]
      }
    ],
    sources: compoundSources("pt-141")
  },
  {
    id: "retatrutide",
    name: "Retatrutide",
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Conservative start", 0.5, "mg"),
      preset("Low reference", 1, "mg"),
      preset("Standard escalation", 2, "mg"),
      preset("Moderate reference", 4, "mg"),
      preset("High reference", 8, "mg"),
      preset("Maximum reference", 12, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old protocol rows",
        kind: "community",
        min: q(0.5, "mg"),
        max: q(12, "mg"),
        sourceIds: ["old-pep-pedia-retatrutide"]
      }
    ],
    sources: compoundSources("retatrutide")
  },
  {
    id: "semaglutide",
    name: "Semaglutide",
    description:
      "Curated from old protocol rows with explicit subcutaneous doses rather than the processed single-value summary.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Initiation reference", 0.25, "mg"),
      preset("Low reference", 0.5, "mg"),
      preset("Maintenance reference", 1, "mg"),
      preset("High reference", 2.4, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old protocol rows",
        kind: "community",
        min: q(0.25, "mg"),
        max: q(2.4, "mg"),
        sourceIds: ["old-pep-pedia-semaglutide"]
      }
    ],
    sources: compoundSources("semaglutide")
  },
  {
    id: "sermorelin",
    name: "Sermorelin",
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(5, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 200, "mcg"),
      preset("Community reference high", 300, "mcg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(200, "mcg"),
        max: q(300, "mcg"),
        sourceIds: ["old-pep-pedia-sermorelin"]
      }
    ],
    sources: compoundSources("sermorelin")
  },
  {
    id: "tb-500",
    name: "TB-500",
    aliases: ["Thymosin Beta-4 fragment"],
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(5, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Community reference low", 2, "mg"),
      preset("Community reference high", 5, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(2, "mg"),
        max: q(5, "mg"),
        sourceIds: ["old-pep-pedia-tb-500"]
      }
    ],
    sources: compoundSources("tb-500")
  },
  {
    id: "tesamorelin",
    name: "Tesamorelin",
    description:
      "Curated from old protocol rows with explicit subcutaneous doses because the processed typical-dose string is ambiguous.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Reference low", 1.4, "mg"),
      preset("Reference high", 2, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old protocol rows",
        kind: "community",
        min: q(1.4, "mg"),
        max: q(2, "mg"),
        sourceIds: ["old-pep-pedia-tesamorelin"]
      }
    ],
    sources: compoundSources("tesamorelin")
  },
  {
    id: "thymosin-alpha-1",
    name: "Thymosin Alpha 1",
    aliases: ["Thymosin alpha-1", "TA1"],
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [preset("Community reference", 1.6, "mg")],
    referenceRanges: [
      {
        label: "Community reference from old protocol rows",
        kind: "community",
        min: q(1.6, "mg"),
        max: q(1.6, "mg"),
        sourceIds: ["old-pep-pedia-thymosin-alpha-1"]
      }
    ],
    sources: compoundSources("thymosin-alpha-1")
  },
  {
    id: "tirzepatide",
    name: "Tirzepatide",
    description:
      "Curated calculator catalog entry from old Pep-Pedia-derived data; not a Tanner-specific default.",
    commonVials: [q(10, "mg")],
    commonWaterMl: defaultWaterMl,
    dosePresets: [
      preset("Initiation reference", 2.5, "mg"),
      preset("Low reference", 5, "mg"),
      preset("Moderate reference", 7.5, "mg"),
      preset("High reference", 10, "mg"),
      preset("Maximum reference", 15, "mg")
    ],
    referenceRanges: [
      {
        label: "Community reference from old data",
        kind: "community",
        min: q(2.5, "mg"),
        max: q(15, "mg"),
        sourceIds: ["old-pep-pedia-tirzepatide"]
      }
    ],
    sources: compoundSources("tirzepatide")
  }
] satisfies Compound[];
