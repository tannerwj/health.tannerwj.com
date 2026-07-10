import {
  formatDecimal,
  isSyringeCapacityMl,
  type DrawUnit,
  type SyringeCapacityMl
} from "../../data/calculator/engine";
import type {
  BlendComponent,
  BlendVariant,
  Compound,
  MassUnit,
  Quantity
} from "../../data/calculator/types";

export const DEFAULT_SYRINGE_CAPACITY_ML = 0.3 satisfies SyringeCapacityMl;
export const DEFAULT_DIRECT_DRAW_UNITS = 10;
export const DEFAULT_FALLBACK_DOSE = { value: 250, unit: "mcg" } satisfies Quantity<MassUnit>;

export interface MassPresetOption {
  key: string;
  label: string;
  quantity: Quantity<MassUnit>;
}

export interface WaterPresetOption {
  key: string;
  label: string;
  value: number;
}

export interface SingleCompoundDefaults {
  compoundId: string;
  vialQuantity: Quantity<MassUnit>;
  vialPresetKey: string;
  waterVolumeMl: number;
  desiredDose: Quantity<MassUnit>;
  syringeCapacityMl: SyringeCapacityMl;
}

export interface BlendAnchorDefaults {
  kind: "anchor";
  anchorCompoundId: string;
  target: Quantity<MassUnit>;
}

export interface BlendDirectDefaults {
  kind: "direct";
  draw: {
    value: number;
    unit: DrawUnit;
  };
}

export type BlendModeDefaults = BlendAnchorDefaults | BlendDirectDefaults;

export interface BlendDefaults {
  blendId: string;
  waterVolumeMl: number;
  syringeCapacityMl: SyringeCapacityMl;
  mode: BlendModeDefaults;
}

export interface CatalogSearchResult {
  id: string;
  mode: "single" | "blend";
  name: string;
  detail: string;
  favorite: boolean;
  score: number;
}

export function quantityKey(quantity: Quantity<MassUnit>): string {
  return `${quantity.unit}:${formatDecimal(quantity.value, 6)}`;
}

export function waterKey(value: number): string {
  return `mL:${formatDecimal(value, 6)}`;
}

export function formatQuantity(quantity: Quantity<MassUnit>, maximumFractionDigits = 2): string {
  return `${formatDecimal(quantity.value, maximumFractionDigits)} ${quantity.unit}`;
}

export function buildMassPresetOptions(
  quantities: readonly Quantity<MassUnit>[] | undefined
): MassPresetOption[] {
  const seen = new Set<string>();
  const options: MassPresetOption[] = [];

  for (const quantity of quantities ?? []) {
    if (!isPositiveFiniteNumber(quantity.value)) {
      continue;
    }
    const key = quantityKey(quantity);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    options.push({
      key,
      label: formatQuantity(quantity),
      quantity: { value: quantity.value, unit: quantity.unit }
    });
  }

  return options;
}

export function buildWaterPresetOptions(values: readonly number[] | undefined): WaterPresetOption[] {
  const seen = new Set<string>();
  const options: WaterPresetOption[] = [];

  for (const value of values ?? []) {
    if (!isPositiveFiniteNumber(value)) {
      continue;
    }
    const key = waterKey(value);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    options.push({
      key,
      label: `${formatDecimal(value, 2)} mL`,
      value
    });
  }

  return options;
}

export function getSingleCompoundDefaults(compound: Compound): SingleCompoundDefaults {
  const vialOptions = buildMassPresetOptions(compound.commonVials);
  const firstVial = vialOptions[0]?.quantity ?? { value: 5, unit: "mg" };
  const firstDose = compound.dosePresets?.[0];
  const desiredDose = firstDose
    ? { value: firstDose.value, unit: firstDose.unit }
    : compound.referenceRanges?.[0]?.min ?? DEFAULT_FALLBACK_DOSE;

  return {
    compoundId: compound.id,
    vialQuantity: { value: firstVial.value, unit: firstVial.unit },
    vialPresetKey: quantityKey(firstVial),
    waterVolumeMl: firstPositiveFinite(compound.commonWaterMl, 2),
    desiredDose: { value: desiredDose.value, unit: desiredDose.unit },
    syringeCapacityMl: DEFAULT_SYRINGE_CAPACITY_ML
  };
}

export function getBlendDefaults(
  blend: BlendVariant,
  compoundsById: Record<string, Compound>
): BlendDefaults {
  const firstPreset = blend.dosePresets?.[0];

  return {
    blendId: blend.id,
    waterVolumeMl: firstPositiveFinite(blend.commonWaterMl, 2),
    syringeCapacityMl: DEFAULT_SYRINGE_CAPACITY_ML,
    mode: firstPreset
      ? {
          kind: "anchor",
          anchorCompoundId: firstPreset.anchorCompoundId,
          target: { value: firstPreset.target.value, unit: firstPreset.target.unit }
        }
      : {
          kind: "direct",
          draw: { value: DEFAULT_DIRECT_DRAW_UNITS, unit: "units" }
        }
  };
}

export function getDefaultAnchorForBlend(
  blend: BlendVariant,
  compoundsById: Record<string, Compound>
): BlendAnchorDefaults {
  const firstPreset = blend.dosePresets?.[0];
  if (firstPreset) {
    return {
      kind: "anchor",
      anchorCompoundId: firstPreset.anchorCompoundId,
      target: { value: firstPreset.target.value, unit: firstPreset.target.unit }
    };
  }

  const firstComponent = blend.components[0];
  const compound = firstComponent ? compoundsById[firstComponent.compoundId] : undefined;
  const firstDose = compound?.dosePresets?.[0];
  const target = firstDose
    ? { value: firstDose.value, unit: firstDose.unit }
    : compound?.referenceRanges?.[0]?.min ?? DEFAULT_FALLBACK_DOSE;

  return {
    kind: "anchor",
    anchorCompoundId: firstComponent?.compoundId ?? "",
    target: { value: target.value, unit: target.unit }
  };
}

export function getCompoundDisplayName(
  compoundId: string,
  compoundsById: Record<string, Pick<Compound, "name">>
): string {
  return compoundsById[compoundId]?.name ?? compoundId;
}

export function formatBlendComponent(
  component: BlendComponent,
  compoundsById: Record<string, Pick<Compound, "name">>
): string {
  return `${formatQuantity(component.amount)} ${getCompoundDisplayName(component.compoundId, compoundsById)}`;
}

export function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function moveCatalogSearchIndex(
  index: number,
  resultCount: number,
  direction: 1 | -1,
  visibleLimit = resultCount
): number {
  const count = Math.min(Math.max(resultCount, 0), Math.max(visibleLimit, 0));
  if (count === 0) {
    return -1;
  }
  const current = index < 0 ? (direction === 1 ? -1 : 0) : Math.min(index, count - 1);
  return (current + direction + count) % count;
}

export function searchCompoundCatalog(
  catalog: readonly Compound[],
  query: string,
  favoriteIds: ReadonlySet<string> = new Set()
): CatalogSearchResult[] {
  return rankCatalogResults(
    catalog.map((compound) => ({
      id: compound.id,
      mode: "single" as const,
      name: compound.name,
      detail: compound.aliases?.join(" · ") || compound.id,
      favorite: favoriteIds.has(compound.id),
      fields: [compound.name, compound.id, ...(compound.aliases ?? [])]
    })),
    query
  );
}

export function searchBlendCatalog(
  catalog: readonly BlendVariant[],
  query: string,
  compoundsById: Record<string, Compound>,
  favoriteIds: ReadonlySet<string> = new Set()
): CatalogSearchResult[] {
  return rankCatalogResults(
    catalog.map((blend) => {
      const componentFields = blend.components.flatMap((component) => {
        const compound = compoundsById[component.compoundId];
        return [component.compoundId, compound?.name, ...(compound?.aliases ?? [])].filter(
          (value): value is string => Boolean(value)
        );
      });
      return {
        id: blend.id,
        mode: "blend" as const,
        name: blend.name,
        detail: blend.variant,
        favorite: favoriteIds.has(blend.id),
        fields: [blend.name, blend.variant, blend.id, ...componentFields]
      };
    }),
    query
  );
}

function rankCatalogResults(
  candidates: Array<Omit<CatalogSearchResult, "score"> & { fields: string[] }>,
  query: string
): CatalogSearchResult[] {
  const normalizedQuery = normalizeCatalogSearch(query);
  const matches = candidates.flatMap((candidate) => {
    const fields = candidate.fields.map(normalizeCatalogSearch).filter(Boolean);
    const score = normalizedQuery ? bestCatalogMatchScore(fields, normalizedQuery) : 4;
    if (score === null) {
      return [];
    }
    const { fields: _fields, ...result } = candidate;
    return [{ ...result, score }];
  });

  return matches.sort((left, right) =>
    left.score - right.score ||
    Number(right.favorite) - Number(left.favorite) ||
    left.name.localeCompare(right.name) ||
    left.detail.localeCompare(right.detail)
  );
}

function bestCatalogMatchScore(fields: string[], query: string): number | null {
  if (fields.some((field) => field === query)) {
    return 0;
  }
  if (fields.some((field) => field.startsWith(query))) {
    return 1;
  }
  if (fields.some((field) => field.split(" ").some((word) => word.startsWith(query)))) {
    return 2;
  }
  if (fields.some((field) => field.includes(query))) {
    return 3;
  }
  return null;
}

export function isKnownSyringeCapacity(value: number): value is SyringeCapacityMl {
  return isSyringeCapacityMl(value);
}

function firstPositiveFinite(values: readonly number[] | undefined, fallback: number): number {
  return values?.find(isPositiveFiniteNumber) ?? fallback;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
