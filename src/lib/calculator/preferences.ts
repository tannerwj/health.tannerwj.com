import { isSyringeCapacityMl, type DrawUnit, type SyringeCapacityMl } from "../../data/calculator/engine";
import type { MassUnit, Quantity } from "../../data/calculator/types";

export const CALCULATOR_PREFERENCES_VERSION = 1;
export const CALCULATOR_PREFERENCES_STORAGE_KEY = "health.tannerwj.com:peptide-calculator:v1";

export type CalculatorMode = "single" | "blend";
export type VialMode = "catalog" | "custom";
export type BlendDrawMode = "anchor" | "direct";

export interface CalculatorPreferences {
  version: typeof CALCULATOR_PREFERENCES_VERSION;
  mode?: CalculatorMode;
  compoundId?: string;
  blendId?: string;
  favoriteCompoundIds?: string[];
  favoriteBlendIds?: string[];
  single?: {
    vialMode?: VialMode;
    catalogVialKey?: string;
    customVialQuantity?: Quantity<MassUnit>;
    waterVolumeMl?: number;
    desiredDose?: Quantity<MassUnit>;
    doseUnit?: MassUnit;
    syringeCapacityMl?: SyringeCapacityMl;
  };
  blend?: {
    waterVolumeMl?: number;
    syringeCapacityMl?: SyringeCapacityMl;
    drawMode?: BlendDrawMode;
    anchorCompoundId?: string;
    anchorTarget?: Quantity<MassUnit>;
    directDraw?: {
      value: number;
      unit: DrawUnit;
    };
  };
}

export interface PreferenceCatalogContext {
  compoundIds: readonly string[];
  blendIds: readonly string[];
}

export function serializeCalculatorPreferences(preferences: CalculatorPreferences): string {
  return JSON.stringify({
    ...preferences,
    version: CALCULATOR_PREFERENCES_VERSION
  });
}

export function parseCalculatorPreferences(
  raw: string | null,
  context: PreferenceCatalogContext
): CalculatorPreferences | null {
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || parsed.version !== CALCULATOR_PREFERENCES_VERSION) {
    return null;
  }

  const compoundIds = new Set(context.compoundIds);
  const blendIds = new Set(context.blendIds);
  const preferences: CalculatorPreferences = {
    version: CALCULATOR_PREFERENCES_VERSION
  };

  if (parsed.mode === "single" || parsed.mode === "blend") {
    preferences.mode = parsed.mode;
  }

  if (typeof parsed.compoundId === "string" && compoundIds.has(parsed.compoundId)) {
    preferences.compoundId = parsed.compoundId;
  }

  if (typeof parsed.blendId === "string" && blendIds.has(parsed.blendId)) {
    preferences.blendId = parsed.blendId;
  }

  const favoriteCompoundIds = filterKnownIdList(parsed.favoriteCompoundIds, compoundIds);
  if (favoriteCompoundIds.length > 0) {
    preferences.favoriteCompoundIds = favoriteCompoundIds;
  }

  const favoriteBlendIds = filterKnownIdList(parsed.favoriteBlendIds, blendIds);
  if (favoriteBlendIds.length > 0) {
    preferences.favoriteBlendIds = favoriteBlendIds;
  }

  if (isRecord(parsed.single)) {
    const single: NonNullable<CalculatorPreferences["single"]> = {};
    if (parsed.single.vialMode === "catalog" || parsed.single.vialMode === "custom") {
      single.vialMode = parsed.single.vialMode;
    }
    if (typeof parsed.single.catalogVialKey === "string" && parsed.single.catalogVialKey.length <= 64) {
      single.catalogVialKey = parsed.single.catalogVialKey;
    }
    const customVialQuantity = parseMassQuantity(parsed.single.customVialQuantity);
    if (customVialQuantity) {
      single.customVialQuantity = customVialQuantity;
    }
    if (isPositiveFiniteNumber(parsed.single.waterVolumeMl)) {
      single.waterVolumeMl = parsed.single.waterVolumeMl;
    }
    const desiredDose = parseMassQuantity(parsed.single.desiredDose);
    if (desiredDose) {
      single.desiredDose = desiredDose;
    }
    if (isMassUnit(parsed.single.doseUnit)) {
      single.doseUnit = parsed.single.doseUnit;
    }
    const syringeCapacityMl = parseSyringeCapacity(parsed.single.syringeCapacityMl);
    if (syringeCapacityMl) {
      single.syringeCapacityMl = syringeCapacityMl;
    }
    if (Object.keys(single).length > 0) {
      preferences.single = single;
    }
  }

  if (isRecord(parsed.blend)) {
    const blend: NonNullable<CalculatorPreferences["blend"]> = {};
    if (isPositiveFiniteNumber(parsed.blend.waterVolumeMl)) {
      blend.waterVolumeMl = parsed.blend.waterVolumeMl;
    }
    const syringeCapacityMl = parseSyringeCapacity(parsed.blend.syringeCapacityMl);
    if (syringeCapacityMl) {
      blend.syringeCapacityMl = syringeCapacityMl;
    }
    if (parsed.blend.drawMode === "anchor" || parsed.blend.drawMode === "direct") {
      blend.drawMode = parsed.blend.drawMode;
    }
    if (typeof parsed.blend.anchorCompoundId === "string" && parsed.blend.anchorCompoundId.length <= 96) {
      blend.anchorCompoundId = parsed.blend.anchorCompoundId;
    }
    const anchorTarget = parseMassQuantity(parsed.blend.anchorTarget);
    if (anchorTarget) {
      blend.anchorTarget = anchorTarget;
    }
    const directDraw = parseDirectDraw(parsed.blend.directDraw);
    if (directDraw) {
      blend.directDraw = directDraw;
    }
    if (Object.keys(blend).length > 0) {
      preferences.blend = blend;
    }
  }

  return preferences;
}

function filterKnownIdList(value: unknown, knownIds: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const filtered: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !knownIds.has(item) || seen.has(item)) {
      continue;
    }
    seen.add(item);
    filtered.push(item);
  }
  return filtered;
}

function parseMassQuantity(value: unknown): Quantity<MassUnit> | undefined {
  if (!isRecord(value) || !isPositiveFiniteNumber(value.value) || !isMassUnit(value.unit)) {
    return undefined;
  }
  return {
    value: value.value,
    unit: value.unit
  };
}

function parseDirectDraw(value: unknown): { value: number; unit: DrawUnit } | undefined {
  if (!isRecord(value) || !isPositiveFiniteNumber(value.value)) {
    return undefined;
  }
  if (value.unit !== "units" && value.unit !== "mL") {
    return undefined;
  }
  return {
    value: value.value,
    unit: value.unit
  };
}

function parseSyringeCapacity(value: unknown): SyringeCapacityMl | undefined {
  return typeof value === "number" && isSyringeCapacityMl(value) ? value : undefined;
}

function isMassUnit(value: unknown): value is MassUnit {
  return value === "mcg" || value === "mg";
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
