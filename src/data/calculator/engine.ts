import type { BlendVariant, Compound, MassUnit, Quantity, ReferenceRange } from "./types";

export type SyringeCapacityMl = 0.3 | 0.5 | 1;
export type DrawUnit = "units" | "mL";
export type CalculationStatus = "ok" | "guardrailed" | "invalid";

export type CalculationIssueCode =
  | "invalid-quantity"
  | "missing-unit"
  | "invalid-water-volume"
  | "invalid-syringe-capacity"
  | "invalid-draw"
  | "missing-components"
  | "missing-anchor-component"
  | "unknown-anchor-component";

export type CalculationAlertCode =
  | "below-measurable-threshold"
  | "above-syringe-capacity"
  | "outside-reference-range";

export type ReferenceRangeStatus = "below" | "within" | "above";

export interface MassSnapshot {
  mcg: number;
  mg: number;
}

export interface MassConcentration {
  mcgPerMl: number;
  mgPerMl: number;
}

export interface VolumeSnapshot {
  ml: number;
  units: number;
}

export interface CalculationIssue {
  code: CalculationIssueCode;
  message: string;
  field?: string;
  severity: "error";
}

export interface CalculationAlert {
  code: CalculationAlertCode;
  message: string;
  field?: string;
  comparison?: ReferenceRangeStatus;
  severity: "warning";
}

export interface CalculationSuccess<T> {
  ok: true;
  status: Exclude<CalculationStatus, "invalid">;
  data: T;
  alerts: CalculationAlert[];
}

export interface CalculationFailure {
  ok: false;
  status: "invalid";
  issues: CalculationIssue[];
}

export type CalculationResult<T> = CalculationSuccess<T> | CalculationFailure;

export type CompoundCatalogEntry = Pick<Compound, "id" | "name" | "referenceRanges">;

export interface ReferenceRangeAssessment {
  label: string;
  kind: ReferenceRange["kind"];
  status: ReferenceRangeStatus;
  value: MassSnapshot;
  min: MassSnapshot;
  max: MassSnapshot;
  sourceIds?: string[];
}

export interface SingleCompoundCalculationInput {
  compound: CompoundCatalogEntry;
  vialQuantity: Quantity<MassUnit>;
  waterVolumeMl: number;
  desiredDose: Quantity<MassUnit>;
  syringeCapacityMl: SyringeCapacityMl;
  measurableThresholdUnits?: number;
}

export interface SingleCompoundCalculationData {
  compoundId: string;
  compoundName: string;
  vialQuantity: MassSnapshot;
  waterVolumeMl: number;
  concentration: MassConcentration;
  requestedDose: MassSnapshot;
  deliveredDose: MassSnapshot;
  draw: VolumeSnapshot & {
    source: "dose";
  };
  syringe: {
    capacityMl: SyringeCapacityMl;
    capacityUnits: number;
    measurableThresholdUnits: number;
  };
  dosesPerVial: number;
  referenceRanges: ReferenceRangeAssessment[];
}

export interface BlendAnchorMode {
  kind: "anchor";
  anchorCompoundId: string;
  target: Quantity<MassUnit>;
}

export interface BlendDirectMode {
  kind: "direct";
  draw: {
    value: number;
    unit: DrawUnit;
  };
}

export interface BlendCalculationInput {
  blend: BlendVariant;
  waterVolumeMl: number;
  syringeCapacityMl: SyringeCapacityMl;
  measurableThresholdUnits?: number;
  mode: BlendAnchorMode | BlendDirectMode;
  compoundsById?: Record<string, CompoundCatalogEntry>;
}

export interface BlendComponentCalculation {
  compoundId: string;
  compoundName?: string;
  amount: MassSnapshot;
  concentration: MassConcentration;
  deliveredDose: MassSnapshot;
  referenceRanges: ReferenceRangeAssessment[];
}

export interface BlendCalculationData {
  blendId: string;
  blendName: string;
  variant: string;
  waterVolumeMl: number;
  draw: VolumeSnapshot & {
    source: "anchor" | "direct";
    input?: {
      value: number;
      unit: DrawUnit;
    };
  };
  syringe: {
    capacityMl: SyringeCapacityMl;
    capacityUnits: number;
    measurableThresholdUnits: number;
  };
  components: BlendComponentCalculation[];
  dosesPerVial: number;
  anchor?: {
    compoundId: string;
    compoundName?: string;
    targetDose: MassSnapshot;
    referenceRanges: ReferenceRangeAssessment[];
  };
}

export const U100_UNITS_PER_ML = 100;
export const DEFAULT_MEASURABLE_THRESHOLD_UNITS = 5;
export const syringeCapacityOptions = [0.3, 0.5, 1] as const satisfies readonly SyringeCapacityMl[];
export const syringeCapacityUnits: Record<SyringeCapacityMl, number> = {
  0.3: 30,
  0.5: 50,
  1: 100
};

const MASS_MCG_PER_MG = 1000;
const EPSILON = 1e-12;

export function isSyringeCapacityMl(value: number): value is SyringeCapacityMl {
  return value === 0.3 || value === 0.5 || value === 1;
}

export function toMcg(quantity: Quantity<MassUnit>): number {
  return quantity.unit === "mg" ? quantity.value * MASS_MCG_PER_MG : quantity.value;
}

export function toMg(quantity: Quantity<MassUnit>): number {
  return quantity.unit === "mg" ? quantity.value : quantity.value / MASS_MCG_PER_MG;
}

export function normalizeMassQuantity(quantity: Quantity<MassUnit>): MassSnapshot {
  const mcg = toMcg(quantity);
  return {
    mcg,
    mg: mcg / MASS_MCG_PER_MG
  };
}

export function normalizeMassSnapshot(snapshot: MassSnapshot): MassSnapshot {
  return {
    mcg: snapshot.mcg,
    mg: snapshot.mcg / MASS_MCG_PER_MG
  };
}

export function roundForDisplay(value: number, maximumFractionDigits = 2): number {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }
  const factor = 10 ** maximumFractionDigits;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatDecimal(value: number, maximumFractionDigits = 2): string {
  const rounded = roundForDisplay(value, maximumFractionDigits);
  if (!Number.isFinite(rounded)) {
    return "NaN";
  }
  if (maximumFractionDigits === 0) {
    return String(rounded);
  }
  return rounded
    .toFixed(maximumFractionDigits)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

export function formatMassSnapshot(
  snapshot: MassSnapshot,
  unit: MassUnit = "mg",
  maximumFractionDigits = 2
): string {
  const value = unit === "mg" ? snapshot.mg : snapshot.mcg;
  return `${formatDecimal(value, maximumFractionDigits)} ${unit}`;
}

export function formatMassConcentration(
  concentration: MassConcentration,
  unit: MassUnit = "mg",
  maximumFractionDigits = 2
): string {
  const value = unit === "mg" ? concentration.mgPerMl : concentration.mcgPerMl;
  return `${formatDecimal(value, maximumFractionDigits)} ${unit}/mL`;
}

export function formatVolumeMl(volumeMl: number, maximumFractionDigits = 2): string {
  return `${formatDecimal(volumeMl, maximumFractionDigits)} mL`;
}

export function formatU100Units(units: number, maximumFractionDigits = 2): string {
  return `${formatDecimal(units, maximumFractionDigits)} U-100 units`;
}

export function assessReferenceRange(
  value: Quantity<MassUnit> | MassSnapshot,
  range: ReferenceRange
): ReferenceRangeAssessment {
  const normalizedValue = normalizeMassLike(value);
  const normalizedMin = normalizeMassQuantity(range.min);
  const normalizedMax = normalizeMassQuantity(range.max);

  let status: ReferenceRangeStatus = "within";
  if (normalizedValue.mcg < normalizedMin.mcg - EPSILON) {
    status = "below";
  } else if (normalizedValue.mcg > normalizedMax.mcg + EPSILON) {
    status = "above";
  }

  return {
    label: range.label,
    kind: range.kind,
    status,
    value: normalizedValue,
    min: normalizedMin,
    max: normalizedMax,
    sourceIds: range.sourceIds?.length ? [...range.sourceIds] : undefined
  };
}

export function assessReferenceRanges(
  value: Quantity<MassUnit> | MassSnapshot,
  ranges: ReferenceRange[] | undefined
): ReferenceRangeAssessment[] {
  if (!ranges?.length) {
    return [];
  }
  return ranges.map((range) => assessReferenceRange(value, range));
}

export function calculateSingleCompound(
  input: SingleCompoundCalculationInput
): CalculationResult<SingleCompoundCalculationData> {
  const issues: CalculationIssue[] = [];
  const thresholdUnits = validateThresholdUnits(
    input.measurableThresholdUnits,
    issues,
    "measurableThresholdUnits"
  );
  const syringeCapacityUnitsValue = validateSyringeCapacity(
    input.syringeCapacityMl,
    issues,
    "syringeCapacityMl"
  );
  const vialQuantityIssues = validateMassQuantity(input.vialQuantity, "vialQuantity");
  const desiredDoseIssues = validateMassQuantity(input.desiredDose, "desiredDose");
  issues.push(
    ...validatePositiveFiniteNumber(input.waterVolumeMl, "waterVolumeMl", "invalid-water-volume")
  );
  issues.push(...vialQuantityIssues);
  issues.push(...desiredDoseIssues);

  if (issues.length > 0) {
    return {
      ok: false,
      status: "invalid",
      issues
    };
  }

  const vialQuantity = normalizeMassQuantity(input.vialQuantity);
  const requestedDose = normalizeMassQuantity(input.desiredDose);
  const concentrationMcgPerMl = vialQuantity.mcg / input.waterVolumeMl;
  const drawMl = requestedDose.mcg / concentrationMcgPerMl;
  const drawUnits = drawMl * U100_UNITS_PER_ML;
  const deliveredDose = normalizeMassSnapshot(requestedDose);
  const referenceRanges = assessReferenceRanges(input.desiredDose, input.compound.referenceRanges);
  const alerts = buildRangeAlerts(referenceRanges, "requestedDose");

  if (drawUnits + EPSILON < thresholdUnits) {
    alerts.push({
      code: "below-measurable-threshold",
      message: `Draw is below the measurable threshold of ${formatDecimal(thresholdUnits)} U-100 units.`,
      field: "draw.units",
      comparison: "below",
      severity: "warning"
    });
  }

  if (drawMl - input.syringeCapacityMl > EPSILON) {
    alerts.push({
      code: "above-syringe-capacity",
      message: `Draw exceeds the selected ${formatDecimal(input.syringeCapacityMl, 1)} mL syringe capacity.`,
      field: "draw.ml",
      comparison: "above",
      severity: "warning"
    });
  }

  return {
    ok: true,
    status: alerts.length > 0 ? "guardrailed" : "ok",
    alerts,
    data: {
      compoundId: input.compound.id,
      compoundName: input.compound.name,
      vialQuantity,
      waterVolumeMl: input.waterVolumeMl,
      concentration: {
        mcgPerMl: concentrationMcgPerMl,
        mgPerMl: concentrationMcgPerMl / MASS_MCG_PER_MG
      },
      requestedDose,
      deliveredDose,
      draw: {
        source: "dose",
        ml: drawMl,
        units: drawUnits
      },
      syringe: {
        capacityMl: input.syringeCapacityMl,
        capacityUnits: syringeCapacityUnitsValue,
        measurableThresholdUnits: thresholdUnits
      },
      dosesPerVial: vialQuantity.mcg / requestedDose.mcg,
      referenceRanges
    }
  };
}

export function calculateBlend(
  input: BlendCalculationInput
): CalculationResult<BlendCalculationData> {
  const issues: CalculationIssue[] = [];
  const thresholdUnits = validateThresholdUnits(
    input.measurableThresholdUnits,
    issues,
    "measurableThresholdUnits"
  );
  const syringeCapacityUnitsValue = validateSyringeCapacity(
    input.syringeCapacityMl,
    issues,
    "syringeCapacityMl"
  );
  issues.push(...validatePositiveFiniteNumber(input.waterVolumeMl, "waterVolumeMl", "invalid-water-volume"));

  if (input.blend.components.length === 0) {
    issues.push({
      code: "missing-components",
      message: `Blend "${input.blend.id}" must include at least one component.`,
      field: "blend.components",
      severity: "error"
    });
  }

  const componentIssues = input.blend.components.flatMap((component, index) =>
    validateMassQuantity(component.amount, `blend.components[${index}].amount`)
  );
  issues.push(...componentIssues);

  let anchorComponentIndex = -1;
  let anchorTarget: MassSnapshot | undefined;
  let drawMl = NaN;
  let drawUnits = NaN;
  let drawInput: { value: number; unit: DrawUnit } | undefined;
  let anchorTargetAssessments: ReferenceRangeAssessment[] = [];

  if (input.mode.kind === "anchor") {
    const anchorField = "mode.anchorCompoundId";
    if (typeof input.mode.anchorCompoundId !== "string" || input.mode.anchorCompoundId.length === 0) {
      issues.push({
        code: "missing-anchor-component",
        message: `Blend "${input.blend.id}" needs an anchor component.`,
        field: anchorField,
        severity: "error"
      });
    } else {
      anchorComponentIndex = input.blend.components.findIndex(
        (component) => component.compoundId === input.mode.anchorCompoundId
      );
      if (anchorComponentIndex === -1) {
        issues.push({
          code: "unknown-anchor-component",
          message: `Blend "${input.blend.id}" does not contain component "${input.mode.anchorCompoundId}".`,
          field: anchorField,
          severity: "error"
        });
      }
    }

    issues.push(...validateMassQuantity(input.mode.target, "mode.target"));
  } else {
    drawInput = input.mode.draw;
    issues.push(...validatePositiveFiniteNumber(drawInput.value, "mode.draw.value", "invalid-draw"));
    if (drawInput.unit !== "units" && drawInput.unit !== "mL") {
      issues.push({
        code: "invalid-draw",
        message: `Blend "${input.blend.id}" draw must be expressed in U-100 units or mL.`,
        field: "mode.draw.unit",
        severity: "error"
      });
    }
  }

  if (issues.length > 0) {
    return {
      ok: false,
      status: "invalid",
      issues
    };
  }

  const componentAmounts = input.blend.components.map((component) => normalizeMassQuantity(component.amount));
  const componentConcentrations = componentAmounts.map((amount) => ({
    mcgPerMl: amount.mcg / input.waterVolumeMl,
    mgPerMl: amount.mcg / input.waterVolumeMl / MASS_MCG_PER_MG
  }));

  if (input.mode.kind === "anchor") {
    const anchorComponent = input.blend.components[anchorComponentIndex]!;
    const anchorAmount = componentAmounts[anchorComponentIndex]!;
    const target = normalizeMassQuantity(input.mode.target);
    anchorTarget = normalizeMassSnapshot(target);
    const anchorConcentrationMcgPerMl = anchorAmount.mcg / input.waterVolumeMl;
    drawMl = target.mcg / anchorConcentrationMcgPerMl;
    drawUnits = drawMl * U100_UNITS_PER_ML;
    anchorTargetAssessments = assessReferenceRanges(
      input.mode.target,
      input.compoundsById?.[anchorComponent.compoundId]?.referenceRanges
    );
  } else if (input.mode.draw.unit === "units") {
    drawUnits = input.mode.draw.value;
    drawMl = drawUnits / U100_UNITS_PER_ML;
  } else {
    drawMl = input.mode.draw.value;
    drawUnits = drawMl * U100_UNITS_PER_ML;
  }

  const alerts = input.mode.kind === "anchor" ? buildRangeAlerts(anchorTargetAssessments, "mode.target") : [];
  const componentResults = input.blend.components.map((component, index) => {
    const amount = componentAmounts[index]!;
    const concentration = componentConcentrations[index]!;
    const deliveredDose = normalizeMassSnapshot({
      mcg: concentration.mcgPerMl * drawMl,
      mg: concentration.mgPerMl * drawMl
    });
    const referenceRanges = assessReferenceRanges(
      deliveredDose,
      input.compoundsById?.[component.compoundId]?.referenceRanges
    );
    alerts.push(...buildRangeAlerts(referenceRanges, `components.${component.compoundId}`));
    return {
      compoundId: component.compoundId,
      compoundName: input.compoundsById?.[component.compoundId]?.name,
      amount,
      concentration,
      deliveredDose,
      referenceRanges
    } satisfies BlendComponentCalculation;
  });

  if (drawUnits + EPSILON < thresholdUnits) {
    alerts.push({
      code: "below-measurable-threshold",
      message: `Draw is below the measurable threshold of ${formatDecimal(thresholdUnits)} U-100 units.`,
      field: "draw.units",
      comparison: "below",
      severity: "warning"
    });
  }

  if (drawMl - input.syringeCapacityMl > EPSILON) {
    alerts.push({
      code: "above-syringe-capacity",
      message: `Draw exceeds the selected ${formatDecimal(input.syringeCapacityMl, 1)} mL syringe capacity.`,
      field: "draw.ml",
      comparison: "above",
      severity: "warning"
    });
  }

  const data: BlendCalculationData = {
    blendId: input.blend.id,
    blendName: input.blend.name,
    variant: input.blend.variant,
    waterVolumeMl: input.waterVolumeMl,
    draw: input.mode.kind === "anchor"
      ? {
          source: "anchor",
          ml: drawMl,
          units: drawUnits
        }
      : {
          source: "direct",
          ml: drawMl,
          units: drawUnits,
          input: drawInput
        },
    syringe: {
      capacityMl: input.syringeCapacityMl,
      capacityUnits: syringeCapacityUnitsValue,
      measurableThresholdUnits: thresholdUnits
    },
    components: componentResults,
    dosesPerVial: input.waterVolumeMl / drawMl
  };

  if (input.mode.kind === "anchor") {
    const anchorCompound = input.blend.components[anchorComponentIndex];
    data.anchor = {
      compoundId: anchorCompound.compoundId,
      compoundName: input.compoundsById?.[anchorCompound.compoundId]?.name,
      targetDose: anchorTarget ?? normalizeMassQuantity(input.mode.target),
      referenceRanges: anchorTargetAssessments
    };
  }

  return {
    ok: true,
    status: alerts.length > 0 ? "guardrailed" : "ok",
    alerts,
    data
  };
}

function normalizeMassLike(value: Quantity<MassUnit> | MassSnapshot): MassSnapshot {
  if (isMassSnapshot(value)) {
    return normalizeMassSnapshot(value);
  }
  return normalizeMassQuantity(value);
}

function isMassSnapshot(value: Quantity<MassUnit> | MassSnapshot): value is MassSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "mcg" in value &&
    "mg" in value &&
    typeof value.mcg === "number" &&
    typeof value.mg === "number"
  );
}

function validateMassQuantity(
  quantity: Partial<Quantity<MassUnit>> | undefined,
  field: string
): CalculationIssue[] {
  const issues: CalculationIssue[] = [];

  if (!quantity || typeof quantity !== "object") {
    issues.push({
      code: "invalid-quantity",
      message: `${field} is missing a structured quantity.`,
      field,
      severity: "error"
    });
    return issues;
  }

  if (!isPositiveFiniteNumber(quantity.value)) {
    issues.push({
      code: "invalid-quantity",
      message: `${field} must have a positive numeric value.`,
      field,
      severity: "error"
    });
  }

  if (quantity.unit !== "mcg" && quantity.unit !== "mg") {
    issues.push({
      code: "missing-unit",
      message: `${field} must use an explicit mass unit.`,
      field,
      severity: "error"
    });
  }

  return issues;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validatePositiveFiniteNumber(
  value: unknown,
  field: string,
  code: CalculationIssueCode
): CalculationIssue[] {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return [
      {
        code,
        message: `${field} must be a positive finite number.`,
        field,
        severity: "error"
      }
    ];
  }
  return [];
}

function validateThresholdUnits(
  value: number | undefined,
  issues: CalculationIssue[],
  field: string
): number {
  const threshold = value ?? DEFAULT_MEASURABLE_THRESHOLD_UNITS;
  if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold <= 0) {
    issues.push({
      code: "invalid-quantity",
      message: `${field} must be a positive finite number.`,
      field,
      severity: "error"
    });
    return DEFAULT_MEASURABLE_THRESHOLD_UNITS;
  }
  return threshold;
}

function validateSyringeCapacity(
  value: number,
  issues: CalculationIssue[],
  field: string
): number {
  if (!isSyringeCapacityMl(value)) {
    issues.push({
      code: "invalid-syringe-capacity",
      message: `${field} must be one of 0.3, 0.5, or 1.0 mL.`,
      field,
      severity: "error"
    });
  }
  return syringeCapacityMlToUnits(value);
}

function syringeCapacityMlToUnits(value: number): number {
  return isSyringeCapacityMl(value) ? syringeCapacityUnits[value] : NaN;
}

function buildRangeAlerts(
  assessments: ReferenceRangeAssessment[],
  field: string
): CalculationAlert[] {
  const alerts: CalculationAlert[] = [];
  for (const assessment of assessments) {
    if (assessment.status === "within") {
      continue;
    }
    alerts.push({
      code: "outside-reference-range",
      message: `${assessment.label} is ${assessment.status} the ${describeRangeKind(assessment.kind)} reference range.`,
      field,
      comparison: assessment.status,
      severity: "warning"
    });
  }
  return alerts;
}

function describeRangeKind(kind: ReferenceRange["kind"]): string {
  if (kind === "tanner") {
    return "Tanner";
  }
  return kind;
}
