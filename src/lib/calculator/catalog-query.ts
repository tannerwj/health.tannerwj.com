import type { CalculatorMode, CalculatorPreferences } from "./preferences";

export interface CalculatorCatalogContext {
  compoundIds: readonly string[];
  blendIds: readonly string[];
}

export interface CalculatorCatalogSelection {
  mode: CalculatorMode;
  id: string;
}

/**
 * Public calculator link contract. Only catalog identity belongs in the URL;
 * vial, dose, water, syringe, and favorite preferences stay browser-local.
 */
export function calculatorSelectionHref(selection: CalculatorCatalogSelection): string {
  const params = new URLSearchParams({ mode: selection.mode, id: selection.id });
  return `/peptides/calculator?${params.toString()}`;
}

export function calculatorHrefForCatalogEntry(
  mode: CalculatorMode,
  id: string | undefined,
  context: CalculatorCatalogContext
): string | null {
  if (!id || !isKnownSelection({ mode, id }, context)) {
    return null;
  }
  return calculatorSelectionHref({ mode, id });
}

export function parseCalculatorSelection(
  search: string,
  context: CalculatorCatalogContext
): CalculatorCatalogSelection | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const mode = params.get("mode");
  const id = params.get("id");
  if ((mode !== "single" && mode !== "blend") || !id) {
    return null;
  }

  const selection = { mode, id } satisfies CalculatorCatalogSelection;
  return isKnownSelection(selection, context) ? selection : null;
}

export function resolveCalculatorSelection(
  search: string,
  preferences: CalculatorPreferences | null,
  context: CalculatorCatalogContext
): { selection: CalculatorCatalogSelection; source: "url" | "saved" | "default" } {
  const linked = parseCalculatorSelection(search, context);
  if (linked) {
    return { selection: linked, source: "url" };
  }

  const savedMode = preferences?.mode;
  const savedId = savedMode === "blend" ? preferences?.blendId : preferences?.compoundId;
  if (savedMode && savedId) {
    const saved = { mode: savedMode, id: savedId } satisfies CalculatorCatalogSelection;
    if (isKnownSelection(saved, context)) {
      return { selection: saved, source: "saved" };
    }
  }

  return {
    selection: { mode: "single", id: context.compoundIds[0] ?? "" },
    source: "default"
  };
}

export function replaceCalculatorSelectionInUrl(
  currentHref: string,
  selection: CalculatorCatalogSelection
): string {
  const url = new URL(currentHref, "https://health.tannerwj.com");
  url.searchParams.set("mode", selection.mode);
  url.searchParams.set("id", selection.id);
  return `${url.pathname}${url.search}${url.hash}`;
}

function isKnownSelection(
  selection: CalculatorCatalogSelection,
  context: CalculatorCatalogContext
): boolean {
  return selection.mode === "single"
    ? context.compoundIds.includes(selection.id)
    : context.blendIds.includes(selection.id);
}
