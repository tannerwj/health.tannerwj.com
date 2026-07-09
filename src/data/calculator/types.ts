export type MassUnit = "mcg" | "mg";
export type VolumeUnit = "mL";
export type SourceType =
  | "x"
  | "pep-pedia"
  | "website"
  | "study"
  | "person"
  | "conversation";

export interface Quantity<Unit extends string = MassUnit | VolumeUnit> {
  value: number;
  unit: Unit;
}

export interface CalculatorSource {
  id: string;
  type: SourceType;
  url?: string;
  author?: string;
  note?: string;
  accessed?: string;
}

export interface DosePreset {
  label: string;
  value: number;
  unit: MassUnit;
}

export interface ReferenceRange {
  label: string;
  kind: "tanner" | "community" | "other";
  min: Quantity<MassUnit>;
  max: Quantity<MassUnit>;
  sourceIds?: string[];
}

export interface Compound {
  id: string;
  name: string;
  aliases?: string[];
  description?: string;
  commonVials?: Quantity<MassUnit>[];
  commonWaterMl?: number[];
  dosePresets?: DosePreset[];
  referenceRanges?: ReferenceRange[];
  sources?: CalculatorSource[];
  practiceOnly?: true;
  practiceNote?: string;
}

export interface BlendComponent {
  compoundId: string;
  amount: Quantity<MassUnit>;
}

export interface BlendDosePreset {
  label: string;
  anchorCompoundId: string;
  target: Quantity<MassUnit>;
}

export interface BlendVariant {
  id: string;
  name: string;
  variant: string;
  components: BlendComponent[];
  commonWaterMl?: number[];
  dosePresets?: BlendDosePreset[];
  featured?: boolean;
  editable?: boolean;
  sources?: CalculatorSource[];
  practiceOnly?: true;
  practiceNote?: string;
}
