import { blends } from "../data/calculator/blends";
import { compounds } from "../data/calculator/compounds";
import {
  calculateBlend,
  calculateSingleCompound,
  formatDecimal,
  formatMassConcentration,
  formatMassSnapshot,
  formatU100Units,
  formatVolumeMl,
  syringeCapacityUnits,
  type BlendCalculationData,
  type CalculationAlert,
  type CalculationIssue,
  type CalculationResult,
  type DrawUnit,
  type ReferenceRangeAssessment,
  type SingleCompoundCalculationData,
  type SyringeCapacityMl
} from "../data/calculator/engine";
import type { BlendVariant, Compound, MassUnit, Quantity } from "../data/calculator/types";
import {
  DEFAULT_DIRECT_DRAW_UNITS,
  buildMassPresetOptions,
  buildWaterPresetOptions,
  formatQuantity,
  getBlendDefaults,
  getCompoundDisplayName,
  getDefaultAnchorForBlend,
  getSingleCompoundDefaults,
  isKnownSyringeCapacity,
  moveCatalogSearchIndex,
  searchBlendCatalog,
  searchCompoundCatalog,
  type CatalogSearchResult
} from "../lib/calculator/catalog-ui";
import {
  replaceCalculatorSelectionInUrl,
  resolveCalculatorSelection
} from "../lib/calculator/catalog-query";
import {
  CALCULATOR_PREFERENCES_STORAGE_KEY,
  parseCalculatorPreferences,
  serializeCalculatorPreferences,
  type BlendDrawMode,
  type CalculatorMode,
  type CalculatorPreferences,
  type VialMode
} from "../lib/calculator/preferences";

const compoundsById = Object.fromEntries(compounds.map((compound) => [compound.id, compound])) as Record<
  string,
  Compound
>;
const blendsById = Object.fromEntries(blends.map((blend) => [blend.id, blend])) as Record<string, BlendVariant>;
const compoundIds = compounds.map((compound) => compound.id);
const blendIds = blends.map((blend) => blend.id);
const catalogContext = { compoundIds, blendIds };
const SEARCH_RESULT_LIMIT = 10;

const root = document.querySelector<HTMLElement>("[data-calculator-root]");

if (root) {
  initCalculator(root);
}

function initCalculator(rootElement: HTMLElement) {
  const form = requireElement<HTMLFormElement>(rootElement, "[data-calculator-form]");
  const saveStatus = requireElement<HTMLElement>(rootElement, "[data-save-status]");
  const resetDefaults = requireElement<HTMLButtonElement>(rootElement, "[data-reset-defaults]");

  const modeInputs = all<HTMLInputElement>(rootElement, "[data-mode-input]");
  const singleSection = requireElement<HTMLElement>(rootElement, '[data-mode-section="single"]');
  const blendSection = requireElement<HTMLElement>(rootElement, '[data-mode-section="blend"]');

  const compoundSearch = requireElement<HTMLInputElement>(rootElement, "[data-compound-search]");
  const compoundSearchResults = requireElement<HTMLElement>(rootElement, "[data-compound-search-results]");
  const compoundSearchCount = requireElement<HTMLElement>(rootElement, "[data-compound-search-count]");
  const compoundSearchEmpty = requireElement<HTMLElement>(rootElement, "[data-compound-search-empty]");
  const compoundSelect = requireElement<HTMLSelectElement>(rootElement, "[data-compound-select]");
  const compoundSummary = requireElement<HTMLElement>(rootElement, "[data-compound-summary]");
  const singleFavorite = requireElement<HTMLButtonElement>(rootElement, "[data-single-favorite]");
  const singleVialPresets = requireElement<HTMLElement>(rootElement, "[data-single-vial-presets]");
  const singleVialCustomValue = requireElement<HTMLInputElement>(rootElement, "[data-single-vial-custom-value]");
  const singleVialCustomUnit = requireElement<HTMLSelectElement>(rootElement, "[data-single-vial-custom-unit]");
  const singleWaterPresets = requireElement<HTMLElement>(rootElement, "[data-single-water-presets]");
  const singleWater = requireElement<HTMLInputElement>(rootElement, "[data-single-water]");
  const singleDosePresets = requireElement<HTMLElement>(rootElement, "[data-single-dose-presets]");
  const singleDoseValue = requireElement<HTMLInputElement>(rootElement, "[data-single-dose-value]");
  const singleDoseUnit = requireElement<HTMLSelectElement>(rootElement, "[data-single-dose-unit]");
  const singleSyringes = all<HTMLInputElement>(rootElement, "[data-single-syringe]");

  const blendSearch = requireElement<HTMLInputElement>(rootElement, "[data-blend-search]");
  const blendSearchResults = requireElement<HTMLElement>(rootElement, "[data-blend-search-results]");
  const blendSearchCount = requireElement<HTMLElement>(rootElement, "[data-blend-search-count]");
  const blendSearchEmpty = requireElement<HTMLElement>(rootElement, "[data-blend-search-empty]");
  const blendSelect = requireElement<HTMLSelectElement>(rootElement, "[data-blend-select]");
  const blendFavorite = requireElement<HTMLButtonElement>(rootElement, "[data-blend-favorite]");
  const blendComponents = requireElement<HTMLElement>(rootElement, "[data-blend-components]");
  const blendWaterPresets = requireElement<HTMLElement>(rootElement, "[data-blend-water-presets]");
  const blendWater = requireElement<HTMLInputElement>(rootElement, "[data-blend-water]");
  const blendDrawModes = all<HTMLInputElement>(rootElement, "[data-blend-draw-mode]");
  const blendAnchorPanel = requireElement<HTMLElement>(rootElement, "[data-blend-anchor-panel]");
  const blendDirectPanel = requireElement<HTMLElement>(rootElement, "[data-blend-direct-panel]");
  const blendAnchorSelect = requireElement<HTMLSelectElement>(rootElement, "[data-blend-anchor-select]");
  const blendDosePresets = requireElement<HTMLElement>(rootElement, "[data-blend-dose-presets]");
  const blendAnchorDoseValue = requireElement<HTMLInputElement>(rootElement, "[data-blend-anchor-dose-value]");
  const blendAnchorDoseUnit = requireElement<HTMLSelectElement>(rootElement, "[data-blend-anchor-dose-unit]");
  const blendDirectValue = requireElement<HTMLInputElement>(rootElement, "[data-blend-direct-value]");
  const blendDirectUnit = requireElement<HTMLSelectElement>(rootElement, "[data-blend-direct-unit]");
  const blendSyringes = all<HTMLInputElement>(rootElement, "[data-blend-syringe]");

  const resultState = requireElement<HTMLElement>(rootElement, "[data-result-state]");
  const syringeFill = requireElement<HTMLElement>(rootElement, "[data-syringe-fill]");
  const syringeTicks = requireElement<HTMLElement>(rootElement, "[data-syringe-ticks]");
  const singleResults = requireElement<HTMLElement>(rootElement, "[data-single-results]");
  const blendResults = requireElement<HTMLElement>(rootElement, "[data-blend-results]");
  const alertList = requireElement<HTMLElement>(rootElement, "[data-alerts]");
  const errorList = requireElement<HTMLElement>(rootElement, "[data-errors]");

  let storageWritable = true;
  const rawPreferences = readStoredPreferences();
  const parsedPreferences = parseCalculatorPreferences(rawPreferences, catalogContext);
  const unreadablePreferences = Boolean(rawPreferences && !parsedPreferences);
  const initialSelection = resolveCalculatorSelection(window.location.search, parsedPreferences, catalogContext);

  let mode: CalculatorMode = initialSelection.selection.mode;
  let selectedCompoundId =
    initialSelection.selection.mode === "single"
      ? initialSelection.selection.id
      : parsedPreferences?.compoundId ?? compounds[0].id;
  let selectedBlendId =
    initialSelection.selection.mode === "blend"
      ? initialSelection.selection.id
      : parsedPreferences?.blendId ?? blends[0].id;
  let favoriteCompoundIds = new Set(parsedPreferences?.favoriteCompoundIds ?? []);
  let favoriteBlendIds = new Set(parsedPreferences?.favoriteBlendIds ?? []);
  let singleVialMode: VialMode = parsedPreferences?.single?.vialMode ?? "catalog";
  let selectedSingleVialKey = parsedPreferences?.single?.catalogVialKey;
  let compoundSearchOpen = false;
  let blendSearchOpen = false;
  let activeCompoundResult = -1;
  let activeBlendResult = -1;
  let compoundMatches: CatalogSearchResult[] = [];
  let blendMatches: CatalogSearchResult[] = [];

  if (initialSelection.source === "url" && mode === "single") {
    singleVialMode = "catalog";
    selectedSingleVialKey = undefined;
  }

  hydrateMode();
  hydrateSingleControls(initialSelection.source === "url" && mode === "single" ? null : parsedPreferences);
  hydrateBlendControls(initialSelection.source === "url" && mode === "blend" ? null : parsedPreferences);
  renderSelectLabels();
  updateFavoriteButtons();
  filterCompoundOptions();
  filterBlendOptions();
  renderCalculator();
  updateStorageStatus(
    unreadablePreferences
      ? "Using catalog defaults. Saved preferences were ignored because they could not be read."
      : initialSelection.source === "url"
        ? "Catalog link loaded. Other saved choices remain on this device."
        : parsedPreferences
        ? "Preferences loaded and saved on this device."
        : "Using catalog defaults. Changes save locally on this device."
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  resetDefaults.addEventListener("click", () => {
    mode = "single";
    selectedCompoundId = compounds[0].id;
    selectedBlendId = blends[0].id;
    favoriteCompoundIds = new Set();
    favoriteBlendIds = new Set();
    singleVialMode = "catalog";
    selectedSingleVialKey = undefined;
    hydrateMode();
    hydrateSingleControls(null);
    hydrateBlendControls(null);
    renderSelectLabels();
    updateFavoriteButtons();
    filterCompoundOptions();
    filterBlendOptions();
    renderCalculator();
    removeStoredPreferences();
    syncSelectionUrl();
    updateStorageStatus("Catalog defaults restored. Favorites and saved local preferences were cleared.");
  });

  for (const input of modeInputs) {
    input.addEventListener("change", () => {
      if (input.checked && (input.value === "single" || input.value === "blend")) {
        mode = input.value;
        closeSearchResults();
        commitChange(true);
      }
    });
  }

  compoundSearch.addEventListener("focus", () => {
    compoundSearchOpen = true;
    activeCompoundResult = 0;
    filterCompoundOptions();
  });
  compoundSearch.addEventListener("input", () => {
    compoundSearchOpen = true;
    activeCompoundResult = 0;
    filterCompoundOptions();
  });
  compoundSearch.addEventListener("keydown", handleCompoundSearchKeydown);
  compoundSearch.addEventListener("blur", () => {
    compoundSearchOpen = false;
    renderCompoundSearchResults();
  });
  compoundSearchResults.addEventListener("pointerdown", (event) => {
    const option = closestSearchOption(event.target);
    if (!option?.dataset.catalogId) {
      return;
    }
    event.preventDefault();
    chooseCompound(option.dataset.catalogId);
  });
  compoundSelect.addEventListener("change", () => {
    chooseCompound(compoundSelect.value, false);
  });
  singleFavorite.addEventListener("click", () => {
    toggleSetValue(favoriteCompoundIds, selectedCompoundId);
    renderSelectLabels();
    updateFavoriteButtons();
    filterCompoundOptions();
    commitChange();
  });
  singleVialPresets.addEventListener("change", (event) => {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    if (!input || input.name !== "single-vial-preset") {
      return;
    }
    if (input.value === "custom") {
      singleVialMode = "custom";
    } else {
      singleVialMode = "catalog";
      selectedSingleVialKey = input.value;
      const option = buildMassPresetOptions(knownCompound(selectedCompoundId).commonVials).find(
        (preset) => preset.key === selectedSingleVialKey
      );
      if (option) {
        singleVialCustomValue.value = formatDecimal(option.quantity.value, 6);
        singleVialCustomUnit.value = option.quantity.unit;
      }
    }
    commitChange();
  });
  singleVialCustomValue.addEventListener("input", () => {
    singleVialMode = "custom";
    renderSingleVialPresets();
    commitChange();
  });
  singleVialCustomUnit.addEventListener("change", () => {
    singleVialMode = "custom";
    renderSingleVialPresets();
    commitChange();
  });
  singleWaterPresets.addEventListener("click", (event) => {
    const button = closestButton(event.target);
    const value = button?.dataset.waterValue;
    if (!value) {
      return;
    }
    singleWater.value = value;
    commitChange();
  });
  singleWater.addEventListener("input", commitChange);
  singleDosePresets.addEventListener("click", (event) => {
    const button = closestButton(event.target);
    if (!button?.dataset.doseValue || !isMassUnit(button.dataset.doseUnit)) {
      return;
    }
    singleDoseValue.value = button.dataset.doseValue;
    singleDoseUnit.value = button.dataset.doseUnit;
    commitChange();
  });
  singleDoseValue.addEventListener("input", commitChange);
  singleDoseUnit.addEventListener("change", commitChange);
  for (const input of singleSyringes) {
    input.addEventListener("change", commitChange);
  }

  blendSearch.addEventListener("focus", () => {
    blendSearchOpen = true;
    activeBlendResult = 0;
    filterBlendOptions();
  });
  blendSearch.addEventListener("input", () => {
    blendSearchOpen = true;
    activeBlendResult = 0;
    filterBlendOptions();
  });
  blendSearch.addEventListener("keydown", handleBlendSearchKeydown);
  blendSearch.addEventListener("blur", () => {
    blendSearchOpen = false;
    renderBlendSearchResults();
  });
  blendSearchResults.addEventListener("pointerdown", (event) => {
    const option = closestSearchOption(event.target);
    if (!option?.dataset.catalogId) {
      return;
    }
    event.preventDefault();
    chooseBlend(option.dataset.catalogId);
  });
  blendSelect.addEventListener("change", () => {
    chooseBlend(blendSelect.value, false);
  });
  blendFavorite.addEventListener("click", () => {
    toggleSetValue(favoriteBlendIds, selectedBlendId);
    renderSelectLabels();
    updateFavoriteButtons();
    filterBlendOptions();
    commitChange();
  });
  blendWaterPresets.addEventListener("click", (event) => {
    const button = closestButton(event.target);
    const value = button?.dataset.waterValue;
    if (!value) {
      return;
    }
    blendWater.value = value;
    commitChange();
  });
  blendWater.addEventListener("input", commitChange);
  for (const input of blendDrawModes) {
    input.addEventListener("change", () => {
      if (!input.checked || (input.value !== "anchor" && input.value !== "direct")) {
        return;
      }
      setBlendDrawMode(input.value);
      if (input.value === "anchor" && !blendAnchorSelect.value) {
        applyBlendAnchorDefaults();
      }
      if (input.value === "direct" && !positiveNumber(blendDirectValue.value)) {
        blendDirectValue.value = String(DEFAULT_DIRECT_DRAW_UNITS);
        blendDirectUnit.value = "units";
      }
      commitChange();
    });
  }
  blendAnchorSelect.addEventListener("change", commitChange);
  blendDosePresets.addEventListener("click", (event) => {
    const button = closestButton(event.target);
    if (
      !button?.dataset.anchorCompoundId ||
      !button.dataset.doseValue ||
      !isMassUnit(button.dataset.doseUnit)
    ) {
      return;
    }
    setBlendDrawMode("anchor");
    blendAnchorSelect.value = button.dataset.anchorCompoundId;
    blendAnchorDoseValue.value = button.dataset.doseValue;
    blendAnchorDoseUnit.value = button.dataset.doseUnit;
    commitChange();
  });
  blendAnchorDoseValue.addEventListener("input", commitChange);
  blendAnchorDoseUnit.addEventListener("change", commitChange);
  blendDirectValue.addEventListener("input", commitChange);
  blendDirectUnit.addEventListener("change", commitChange);
  for (const input of blendSyringes) {
    input.addEventListener("change", commitChange);
  }

  function hydrateMode() {
    for (const input of modeInputs) {
      input.checked = input.value === mode;
    }
    singleSection.hidden = mode !== "single";
    blendSection.hidden = mode !== "blend";
    singleResults.hidden = mode !== "single";
    blendResults.hidden = mode !== "blend";
  }

  function hydrateSingleControls(preferences: CalculatorPreferences | null) {
    const compound = knownCompound(preferences?.compoundId ?? selectedCompoundId);
    selectedCompoundId = compound.id;
    compoundSelect.value = compound.id;
    compoundSummary.textContent = compound.description ?? "Curated catalog entry for vial math.";

    const defaults = getSingleCompoundDefaults(compound);
    selectedSingleVialKey = preferences?.single?.catalogVialKey ?? selectedSingleVialKey ?? defaults.vialPresetKey;
    singleVialMode = preferences?.single?.vialMode ?? singleVialMode;
    const customVial = preferences?.single?.customVialQuantity ?? defaults.vialQuantity;
    singleVialCustomValue.value = formatDecimal(customVial.value, 6);
    singleVialCustomUnit.value = customVial.unit;
    singleWater.value = formatDecimal(preferences?.single?.waterVolumeMl ?? defaults.waterVolumeMl, 6);
    const desiredDose = preferences?.single?.desiredDose ?? defaults.desiredDose;
    singleDoseValue.value = formatDecimal(desiredDose.value, 6);
    singleDoseUnit.value = preferences?.single?.doseUnit ?? desiredDose.unit;
    setCheckedSyringe(singleSyringes, preferences?.single?.syringeCapacityMl ?? defaults.syringeCapacityMl);
    renderSingleVialPresets();
    renderSingleDosePresets();
    renderWaterPresetButtons(singleWaterPresets, compound.commonWaterMl, readNumber(singleWater.value));
  }

  function hydrateBlendControls(preferences: CalculatorPreferences | null) {
    const blend = knownBlend(preferences?.blendId ?? selectedBlendId);
    selectedBlendId = blend.id;
    blendSelect.value = blend.id;
    const defaults = getBlendDefaults(blend, compoundsById);
    blendWater.value = formatDecimal(preferences?.blend?.waterVolumeMl ?? defaults.waterVolumeMl, 6);
    setCheckedSyringe(blendSyringes, preferences?.blend?.syringeCapacityMl ?? defaults.syringeCapacityMl);

    const defaultMode = defaults.mode.kind;
    const drawMode = preferences?.blend?.drawMode ?? defaultMode;
    setBlendDrawMode(drawMode);
    renderBlendComponents();
    renderBlendAnchorOptions();
    renderBlendDosePresets();

    if (drawMode === "anchor") {
      const fallbackAnchor = getDefaultAnchorForBlend(blend, compoundsById);
      blendAnchorSelect.value =
        preferences?.blend?.anchorCompoundId ??
        (defaults.mode.kind === "anchor" ? defaults.mode.anchorCompoundId : fallbackAnchor.anchorCompoundId);
      const target =
        preferences?.blend?.anchorTarget ??
        (defaults.mode.kind === "anchor" ? defaults.mode.target : fallbackAnchor.target);
      blendAnchorDoseValue.value = formatDecimal(target.value, 6);
      blendAnchorDoseUnit.value = target.unit;
    } else {
      const directDraw = preferences?.blend?.directDraw ?? {
        value: defaults.mode.kind === "direct" ? defaults.mode.draw.value : DEFAULT_DIRECT_DRAW_UNITS,
        unit: "units" as DrawUnit
      };
      blendDirectValue.value = formatDecimal(directDraw.value, 6);
      blendDirectUnit.value = directDraw.unit;
      applyBlendAnchorDefaults();
    }

    renderWaterPresetButtons(blendWaterPresets, blend.commonWaterMl, readNumber(blendWater.value));
  }

  function applyBlendAnchorDefaults() {
    const anchorDefaults = getDefaultAnchorForBlend(knownBlend(selectedBlendId), compoundsById);
    blendAnchorSelect.value = anchorDefaults.anchorCompoundId;
    blendAnchorDoseValue.value = formatDecimal(anchorDefaults.target.value, 6);
    blendAnchorDoseUnit.value = anchorDefaults.target.unit;
  }

  function renderCalculator() {
    hydrateMode();
    updateFavoriteButtons();
    renderSingleVialPresets();
    renderSingleDosePresets();
    renderBlendDosePresets();
    syncBlendDrawPanels();
    renderWaterPresetButtons(singleWaterPresets, knownCompound(selectedCompoundId).commonWaterMl, readNumber(singleWater.value));
    renderWaterPresetButtons(blendWaterPresets, knownBlend(selectedBlendId).commonWaterMl, readNumber(blendWater.value));

    if (mode === "single") {
      const result = calculateSingle();
      renderSingleCalculation(result);
      return;
    }

    const result = calculateBlendCalculation();
    renderBlendCalculation(result);
  }

  function calculateSingle(): CalculationResult<SingleCompoundCalculationData> {
    const compound = knownCompound(selectedCompoundId);
    return calculateSingleCompound({
      compound,
      vialQuantity: readSingleVialQuantity(),
      waterVolumeMl: readNumber(singleWater.value),
      desiredDose: {
        value: readNumber(singleDoseValue.value),
        unit: readMassUnit(singleDoseUnit)
      },
      syringeCapacityMl: readCheckedSyringe(singleSyringes)
    });
  }

  function calculateBlendCalculation(): CalculationResult<BlendCalculationData> {
    const drawMode = readBlendDrawMode();
    return calculateBlend({
      blend: knownBlend(selectedBlendId),
      waterVolumeMl: readNumber(blendWater.value),
      syringeCapacityMl: readCheckedSyringe(blendSyringes),
      mode:
        drawMode === "anchor"
          ? {
              kind: "anchor",
              anchorCompoundId: blendAnchorSelect.value,
              target: {
                value: readNumber(blendAnchorDoseValue.value),
                unit: readMassUnit(blendAnchorDoseUnit)
              }
            }
          : {
              kind: "direct",
              draw: {
                value: readNumber(blendDirectValue.value),
                unit: readDrawUnit(blendDirectUnit)
              }
            },
      compoundsById
    });
  }

  function renderSingleCalculation(result: CalculationResult<SingleCompoundCalculationData>) {
    blendResults.hidden = true;
    singleResults.hidden = false;

    if (!result.ok) {
      renderInvalid(result.issues, readCheckedSyringe(singleSyringes));
      return;
    }

    resultState.dataset.status = result.status;
    resultState.textContent =
      result.status === "ok"
        ? `${formatU100Units(result.data.draw.units, 2)} / ${formatVolumeMl(result.data.draw.ml, 3)}.`
        : `Calculated, with ${result.alerts.length} guardrail${result.alerts.length === 1 ? "" : "s"} to review.`;
    renderSyringe(result.data.draw.ml, result.data.syringe.capacityMl);
    renderAlerts(result.alerts);
    renderErrors([]);

    singleResults.replaceChildren(
      metric("U-100 draw", formatU100Units(result.data.draw.units, 2), formatVolumeMl(result.data.draw.ml, 3)),
      metric(
        "Concentration",
        formatMassConcentration(result.data.concentration, "mg", 3),
        formatMassConcentration(result.data.concentration, "mcg", 0)
      ),
      metric("Doses per vial", formatDecimal(result.data.dosesPerVial, 1), "Based on the requested dose."),
      metric("Delivered dose", formatDualMass(result.data.deliveredDose), "Echoed in both mass units."),
      metric("Reference classification", formatReferenceRangeSummary(result.data.referenceRanges), "Catalog context only.")
    );
  }

  function renderBlendCalculation(result: CalculationResult<BlendCalculationData>) {
    singleResults.hidden = true;
    blendResults.hidden = false;

    if (!result.ok) {
      renderInvalid(result.issues, readCheckedSyringe(blendSyringes));
      return;
    }

    resultState.dataset.status = result.status;
    resultState.textContent =
      result.status === "ok"
        ? `${formatU100Units(result.data.draw.units, 2)} / ${formatVolumeMl(result.data.draw.ml, 3)} shared draw.`
        : `Calculated, with ${result.alerts.length} guardrail${result.alerts.length === 1 ? "" : "s"} to review.`;
    renderSyringe(result.data.draw.ml, result.data.syringe.capacityMl);
    renderAlerts(result.alerts);
    renderErrors([]);

    const nodes: HTMLElement[] = [
      metric("Shared draw", formatU100Units(result.data.draw.units, 2), formatVolumeMl(result.data.draw.ml, 3)),
      metric("Doses per vial", formatDecimal(result.data.dosesPerVial, 1), "Based on the shared draw."),
      metric(
        "Mode",
        result.data.draw.source === "anchor" ? "Anchor target" : "Direct draw",
        result.data.anchor ? `${result.data.anchor.compoundName ?? result.data.anchor.compoundId}: ${formatDualMass(result.data.anchor.targetDose)}` : "Draw entered directly."
      )
    ];

    for (const component of result.data.components) {
      nodes.push(renderComponentResult(component));
    }

    blendResults.replaceChildren(...nodes);
  }

  function renderInvalid(issues: CalculationIssue[], capacityMl: SyringeCapacityMl) {
    resultState.dataset.status = "invalid";
    resultState.textContent = "Enter positive quantities with explicit units.";
    renderSyringe(0, capacityMl);
    renderAlerts([]);
    renderErrors(issues);
    singleResults.replaceChildren();
    blendResults.replaceChildren();
  }

  function renderComponentResult(component: BlendCalculationData["components"][number]): HTMLElement {
    const article = document.createElement("article");
    article.className = "component-result";

    const heading = document.createElement("h3");
    heading.textContent = component.compoundName ?? component.compoundId;

    const list = document.createElement("dl");
    appendDefinition(list, "Vial amount", formatDualMass(component.amount));
    appendDefinition(list, "Concentration", formatMassConcentration(component.concentration, "mg", 3));
    appendDefinition(list, "Delivered", formatDualMass(component.deliveredDose));
    appendDefinition(list, "Reference", formatReferenceRangeSummary(component.referenceRanges));

    article.append(heading, list);
    return article;
  }

  function renderSyringe(drawMl: number, capacityMl: SyringeCapacityMl) {
    const capacityUnits = syringeCapacityUnits[capacityMl];
    const percentage = Number.isFinite(drawMl) ? clamp((drawMl / capacityMl) * 100, 0, 100) : 0;
    syringeFill.style.width = `${percentage}%`;
    syringeTicks.replaceChildren();
    for (const value of [0, capacityUnits / 2, capacityUnits]) {
      const tick = document.createElement("span");
      tick.textContent = `${formatDecimal(value, value % 1 === 0 ? 0 : 1)} units`;
      syringeTicks.append(tick);
    }
  }

  function renderAlerts(alerts: CalculationAlert[]) {
    alertList.replaceChildren(
      ...alerts.map((alert) => {
        const item = document.createElement("p");
        item.textContent = alert.message;
        return item;
      })
    );
  }

  function renderErrors(issues: CalculationIssue[]) {
    errorList.hidden = issues.length === 0;
    errorList.replaceChildren(
      ...issues.map((issue) => {
        const item = document.createElement("p");
        item.textContent = issue.message;
        return item;
      })
    );
  }

  function renderSingleVialPresets() {
    const options = buildMassPresetOptions(knownCompound(selectedCompoundId).commonVials);
    if (singleVialMode === "catalog" && !options.some((option) => option.key === selectedSingleVialKey)) {
      selectedSingleVialKey = options[0]?.key;
    }
    singleVialPresets.replaceChildren(
      ...options.map((option) =>
        radioChip("single-vial-preset", option.key, option.label, singleVialMode === "catalog" && selectedSingleVialKey === option.key)
      ),
      radioChip("single-vial-preset", "custom", "Other", singleVialMode === "custom")
    );
  }

  function renderSingleDosePresets() {
    const compound = knownCompound(selectedCompoundId);
    singleDosePresets.replaceChildren(
      ...(compound.dosePresets ?? []).map((preset) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.doseValue = String(preset.value);
        button.dataset.doseUnit = preset.unit;
        button.textContent = `${preset.label}: ${formatQuantity(preset)}`;
        button.setAttribute(
          "aria-pressed",
          String(
            nearlyEqual(readNumber(singleDoseValue.value), preset.value) &&
              readMassUnit(singleDoseUnit) === preset.unit
          )
        );
        return button;
      })
    );
  }

  function renderBlendDosePresets() {
    const blend = knownBlend(selectedBlendId);
    blendDosePresets.replaceChildren(
      ...(blend.dosePresets ?? []).map((preset) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.anchorCompoundId = preset.anchorCompoundId;
        button.dataset.doseValue = String(preset.target.value);
        button.dataset.doseUnit = preset.target.unit;
        button.textContent = `${preset.label}: ${formatQuantity(preset.target)}`;
        button.setAttribute(
          "aria-pressed",
          String(
            readBlendDrawMode() === "anchor" &&
              blendAnchorSelect.value === preset.anchorCompoundId &&
              nearlyEqual(readNumber(blendAnchorDoseValue.value), preset.target.value) &&
              readMassUnit(blendAnchorDoseUnit) === preset.target.unit
          )
        );
        return button;
      })
    );
  }

  function renderWaterPresetButtons(container: HTMLElement, values: readonly number[] | undefined, currentValue: number) {
    container.replaceChildren(
      ...buildWaterPresetOptions(values).map((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.waterValue = String(option.value);
        button.textContent = option.label;
        button.setAttribute("aria-pressed", String(nearlyEqual(currentValue, option.value)));
        return button;
      })
    );
  }

  function renderBlendComponents() {
    const blend = knownBlend(selectedBlendId);
    blendComponents.replaceChildren(
      ...blend.components.map((component) => {
        const item = document.createElement("div");
        const name = document.createElement("span");
        const amount = document.createElement("strong");
        name.textContent = getCompoundDisplayName(component.compoundId, compoundsById);
        amount.textContent = formatQuantity(component.amount);
        item.append(name, amount);
        return item;
      })
    );
  }

  function renderBlendAnchorOptions() {
    const blend = knownBlend(selectedBlendId);
    const currentValue = blendAnchorSelect.value;
    blendAnchorSelect.replaceChildren(
      ...blend.components.map((component) => {
        const option = document.createElement("option");
        option.value = component.compoundId;
        option.textContent = getCompoundDisplayName(component.compoundId, compoundsById);
        return option;
      })
    );
    blendAnchorSelect.value = blend.components.some((component) => component.compoundId === currentValue)
      ? currentValue
      : blend.components[0]?.compoundId ?? "";
  }

  function renderSelectLabels() {
    for (const option of all<HTMLOptionElement>(compoundSelect, "option")) {
      const compound = knownCompound(option.value);
      option.textContent = favoriteCompoundIds.has(compound.id) ? `Favorite - ${compound.name}` : compound.name;
    }
    for (const option of all<HTMLOptionElement>(blendSelect, "option")) {
      const blend = knownBlend(option.value);
      const label = `${blend.name} - ${blend.variant}`;
      option.textContent = favoriteBlendIds.has(blend.id) ? `Favorite - ${label}` : label;
    }
  }

  function updateFavoriteButtons() {
    const compoundFavorite = favoriteCompoundIds.has(selectedCompoundId);
    singleFavorite.setAttribute("aria-pressed", String(compoundFavorite));
    singleFavorite.textContent = compoundFavorite ? "Favorited" : "Favorite";

    const isBlendFavorite = favoriteBlendIds.has(selectedBlendId);
    blendFavorite.setAttribute("aria-pressed", String(isBlendFavorite));
    blendFavorite.textContent = isBlendFavorite ? "Favorited" : "Favorite";
  }

  function filterCompoundOptions() {
    const query = compoundSearch.value.trim();
    for (const option of all<HTMLOptionElement>(compoundSelect, "option")) {
      const compound = knownCompound(option.value);
      const haystack = [compound.name, compound.id, ...(compound.aliases ?? [])].join(" ").toLowerCase();
      option.hidden = query.length > 0 && !haystack.includes(query.toLowerCase());
    }
    compoundMatches = searchCompoundCatalog(compounds, query, favoriteCompoundIds);
    activeCompoundResult = clampResultIndex(activeCompoundResult, compoundMatches);
    renderCompoundSearchResults();
  }

  function filterBlendOptions() {
    const query = blendSearch.value.trim();
    for (const option of all<HTMLOptionElement>(blendSelect, "option")) {
      const blend = knownBlend(option.value);
      const componentTerms = blend.components.flatMap((component) => {
        const compound = compoundsById[component.compoundId];
        return [component.compoundId, compound?.name, ...(compound?.aliases ?? [])];
      });
      const haystack = [blend.name, blend.variant, blend.id, ...componentTerms].join(" ").toLowerCase();
      option.hidden = query.length > 0 && !haystack.includes(query.toLowerCase());
    }
    blendMatches = searchBlendCatalog(blends, query, compoundsById, favoriteBlendIds);
    activeBlendResult = clampResultIndex(activeBlendResult, blendMatches);
    renderBlendSearchResults();
  }

  function renderCompoundSearchResults() {
    renderCatalogSearchResults({
      input: compoundSearch,
      container: compoundSearchResults,
      count: compoundSearchCount,
      empty: compoundSearchEmpty,
      matches: compoundMatches,
      activeIndex: activeCompoundResult,
      open: compoundSearchOpen,
      query: compoundSearch.value,
      noun: "compound"
    });
  }

  function renderBlendSearchResults() {
    renderCatalogSearchResults({
      input: blendSearch,
      container: blendSearchResults,
      count: blendSearchCount,
      empty: blendSearchEmpty,
      matches: blendMatches,
      activeIndex: activeBlendResult,
      open: blendSearchOpen,
      query: blendSearch.value,
      noun: "blend"
    });
  }

  function handleCompoundSearchKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      compoundSearchOpen = true;
      activeCompoundResult = moveCatalogSearchIndex(
        activeCompoundResult,
        compoundMatches.length,
        event.key === "ArrowDown" ? 1 : -1,
        SEARCH_RESULT_LIMIT
      );
      renderCompoundSearchResults();
      return;
    }
    if (event.key === "Enter" && compoundSearchOpen && compoundMatches[activeCompoundResult]) {
      event.preventDefault();
      chooseCompound(compoundMatches[activeCompoundResult].id);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      compoundSearchOpen = false;
      renderCompoundSearchResults();
    }
  }

  function handleBlendSearchKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      blendSearchOpen = true;
      activeBlendResult = moveCatalogSearchIndex(
        activeBlendResult,
        blendMatches.length,
        event.key === "ArrowDown" ? 1 : -1,
        SEARCH_RESULT_LIMIT
      );
      renderBlendSearchResults();
      return;
    }
    if (event.key === "Enter" && blendSearchOpen && blendMatches[activeBlendResult]) {
      event.preventDefault();
      chooseBlend(blendMatches[activeBlendResult].id);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      blendSearchOpen = false;
      renderBlendSearchResults();
    }
  }

  function chooseCompound(id: string, keepFocus = true) {
    if (!compoundsById[id]) {
      return;
    }
    mode = "single";
    selectedCompoundId = id;
    singleVialMode = "catalog";
    selectedSingleVialKey = undefined;
    compoundSearch.value = "";
    compoundSearchOpen = false;
    activeCompoundResult = -1;
    hydrateSingleControls(null);
    updateFavoriteButtons();
    filterCompoundOptions();
    commitChange(true);
    if (keepFocus) {
      compoundSearch.focus({ preventScroll: true });
    }
  }

  function chooseBlend(id: string, keepFocus = true) {
    if (!blendsById[id]) {
      return;
    }
    mode = "blend";
    selectedBlendId = id;
    blendSearch.value = "";
    blendSearchOpen = false;
    activeBlendResult = -1;
    hydrateBlendControls(null);
    updateFavoriteButtons();
    filterBlendOptions();
    commitChange(true);
    if (keepFocus) {
      blendSearch.focus({ preventScroll: true });
    }
  }

  function closeSearchResults() {
    compoundSearchOpen = false;
    blendSearchOpen = false;
    renderCompoundSearchResults();
    renderBlendSearchResults();
  }

  function readSingleVialQuantity(): Quantity<MassUnit> {
    if (singleVialMode === "catalog") {
      const preset = buildMassPresetOptions(knownCompound(selectedCompoundId).commonVials).find(
        (option) => option.key === selectedSingleVialKey
      );
      if (preset) {
        return preset.quantity;
      }
    }

    return {
      value: readNumber(singleVialCustomValue.value),
      unit: readMassUnit(singleVialCustomUnit)
    };
  }

  function readCheckedSyringe(inputs: HTMLInputElement[]): SyringeCapacityMl {
    const checked = inputs.find((input) => input.checked);
    const value = checked ? Number(checked.value) : 0.3;
    return isKnownSyringeCapacity(value) ? value : 0.3;
  }

  function setCheckedSyringe(inputs: HTMLInputElement[], capacity: SyringeCapacityMl) {
    for (const input of inputs) {
      input.checked = Number(input.value) === capacity;
    }
  }

  function setBlendDrawMode(drawMode: BlendDrawMode) {
    for (const input of blendDrawModes) {
      input.checked = input.value === drawMode;
    }
    syncBlendDrawPanels();
  }

  function syncBlendDrawPanels() {
    const drawMode = readBlendDrawMode();
    blendAnchorPanel.hidden = drawMode !== "anchor";
    blendDirectPanel.hidden = drawMode !== "direct";
  }

  function readBlendDrawMode(): BlendDrawMode {
    return blendDrawModes.find((input) => input.checked)?.value === "direct" ? "direct" : "anchor";
  }

  function commitChange(updateUrl = false) {
    renderCalculator();
    savePreferences();
    if (updateUrl) {
      syncSelectionUrl();
    }
  }

  function syncSelectionUrl() {
    const selection = {
      mode,
      id: mode === "single" ? selectedCompoundId : selectedBlendId
    };
    const nextUrl = replaceCalculatorSelectionInUrl(window.location.href, selection);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }

  function savePreferences() {
    const preferences = buildPreferences();
    try {
      localStorage.setItem(CALCULATOR_PREFERENCES_STORAGE_KEY, serializeCalculatorPreferences(preferences));
      storageWritable = true;
      updateStorageStatus("Preferences saved locally on this device.");
    } catch {
      storageWritable = false;
      updateStorageStatus("Local preferences are unavailable. The calculator still works for this session.");
    }
  }

  function buildPreferences(): CalculatorPreferences {
    const single: NonNullable<CalculatorPreferences["single"]> = {
      vialMode: singleVialMode,
      catalogVialKey: selectedSingleVialKey,
      customVialQuantity: positiveQuantity(singleVialCustomValue.value, readMassUnit(singleVialCustomUnit)),
      waterVolumeMl: positiveNumber(singleWater.value),
      desiredDose: positiveQuantity(singleDoseValue.value, readMassUnit(singleDoseUnit)),
      doseUnit: readMassUnit(singleDoseUnit),
      syringeCapacityMl: readCheckedSyringe(singleSyringes)
    };

    const blend: NonNullable<CalculatorPreferences["blend"]> = {
      waterVolumeMl: positiveNumber(blendWater.value),
      syringeCapacityMl: readCheckedSyringe(blendSyringes),
      drawMode: readBlendDrawMode(),
      anchorCompoundId: blendAnchorSelect.value,
      anchorTarget: positiveQuantity(blendAnchorDoseValue.value, readMassUnit(blendAnchorDoseUnit)),
      directDraw: positiveNumber(blendDirectValue.value)
        ? {
            value: positiveNumber(blendDirectValue.value) ?? DEFAULT_DIRECT_DRAW_UNITS,
            unit: readDrawUnit(blendDirectUnit)
          }
        : undefined
    };

    return {
      version: 1,
      mode,
      compoundId: selectedCompoundId,
      blendId: selectedBlendId,
      favoriteCompoundIds: [...favoriteCompoundIds],
      favoriteBlendIds: [...favoriteBlendIds],
      single,
      blend
    };
  }

  function readStoredPreferences(): string | null {
    try {
      return localStorage.getItem(CALCULATOR_PREFERENCES_STORAGE_KEY);
    } catch {
      storageWritable = false;
      return null;
    }
  }

  function removeStoredPreferences() {
    try {
      localStorage.removeItem(CALCULATOR_PREFERENCES_STORAGE_KEY);
      storageWritable = true;
    } catch {
      storageWritable = false;
    }
  }

  function updateStorageStatus(message: string) {
    saveStatus.textContent = storageWritable ? message : "Local preferences are unavailable. The calculator still works.";
  }
}

function metric(label: string, value: string, detail?: string): HTMLElement {
  const item = document.createElement("div");
  item.className = "metric";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  item.append(labelNode, valueNode);
  if (detail) {
    const detailNode = document.createElement("small");
    detailNode.textContent = detail;
    item.append(detailNode);
  }
  return item;
}

interface CatalogSearchRenderOptions {
  input: HTMLInputElement;
  container: HTMLElement;
  count: HTMLElement;
  empty: HTMLElement;
  matches: CatalogSearchResult[];
  activeIndex: number;
  open: boolean;
  query: string;
  noun: "compound" | "blend";
}

function renderCatalogSearchResults(options: CatalogSearchRenderOptions) {
  const visibleMatches = options.matches.slice(0, SEARCH_RESULT_LIMIT);
  const plural = options.matches.length === 1 ? options.noun : `${options.noun}s`;
  options.count.textContent =
    options.matches.length > SEARCH_RESULT_LIMIT
      ? `${options.matches.length} ${plural} · showing ${SEARCH_RESULT_LIMIT}`
      : `${options.matches.length} ${plural}`;

  options.container.replaceChildren(
    ...visibleMatches.map((match, index) => {
      const item = document.createElement("li");
      item.id = `${options.input.id}-option-${match.id}`;
      item.dataset.catalogId = match.id;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(index === options.activeIndex));

      const name = document.createElement("strong");
      appendHighlightedText(name, match.name, options.query);
      const detail = document.createElement("small");
      appendHighlightedText(detail, match.detail, options.query);
      item.append(name, detail);

      if (match.favorite) {
        const favorite = document.createElement("span");
        favorite.className = "favorite-marker";
        favorite.textContent = "★ Favorite";
        item.append(favorite);
      }
      return item;
    })
  );

  const hasMatches = visibleMatches.length > 0;
  options.container.hidden = !options.open || !hasMatches;
  options.empty.hidden = !options.open || hasMatches;
  options.input.setAttribute("aria-expanded", String(options.open && hasMatches));

  const activeOption = options.open
    ? options.container.querySelector<HTMLElement>('[aria-selected="true"]')
    : null;
  if (activeOption) {
    options.input.setAttribute("aria-activedescendant", activeOption.id);
    requestAnimationFrame(() => activeOption.scrollIntoView({ block: "nearest" }));
  } else {
    options.input.removeAttribute("aria-activedescendant");
  }
}

function appendHighlightedText(node: HTMLElement, value: string, rawQuery: string) {
  const query = rawQuery.trim();
  const index = query ? value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) : -1;
  if (index < 0) {
    node.textContent = value;
    return;
  }
  node.append(
    document.createTextNode(value.slice(0, index)),
    createMark(value.slice(index, index + query.length)),
    document.createTextNode(value.slice(index + query.length))
  );
}

function createMark(value: string): HTMLElement {
  const mark = document.createElement("mark");
  mark.textContent = value;
  return mark;
}

function clampResultIndex(index: number, matches: CatalogSearchResult[]): number {
  const visibleCount = Math.min(matches.length, SEARCH_RESULT_LIMIT);
  if (visibleCount === 0) {
    return -1;
  }
  return Math.min(Math.max(index, 0), visibleCount - 1);
}

function appendDefinition(list: HTMLDListElement, term: string, description: string) {
  const wrapper = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = term;
  dd.textContent = description;
  wrapper.append(dt, dd);
  list.append(wrapper);
}

function radioChip(name: string, value: string, label: string, checked: boolean): HTMLLabelElement {
  const chip = document.createElement("label");
  chip.className = "radio-chip";
  const input = document.createElement("input");
  input.type = "radio";
  input.name = name;
  input.value = value;
  input.checked = checked;
  const text = document.createElement("span");
  text.textContent = label;
  chip.append(input, text);
  return chip;
}

function formatDualMass(snapshot: { mg: number; mcg: number }): string {
  return `${formatMassSnapshot(snapshot, "mg", 3)} / ${formatMassSnapshot(snapshot, "mcg", 0)}`;
}

function formatReferenceRangeSummary(ranges: ReferenceRangeAssessment[]): string {
  if (ranges.length === 0) {
    return "No catalog reference range";
  }
  return ranges
    .map((range) => {
      const kind = range.kind === "tanner" ? "Tanner" : range.kind;
      return `${range.status} ${kind} reference (${formatDualMass(range.min)} to ${formatDualMass(range.max)})`;
    })
    .join("; ");
}

function positiveQuantity(value: string, unit: MassUnit): Quantity<MassUnit> | undefined {
  const parsed = positiveNumber(value);
  return parsed ? { value: parsed, unit } : undefined;
}

function positiveNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function readNumber(value: string): number {
  return Number(value);
}

function readMassUnit(select: HTMLSelectElement): MassUnit {
  return select.value === "mg" ? "mg" : "mcg";
}

function readDrawUnit(select: HTMLSelectElement): DrawUnit {
  return select.value === "mL" ? "mL" : "units";
}

function isMassUnit(value: unknown): value is MassUnit {
  return value === "mcg" || value === "mg";
}

function knownCompound(id: string): Compound {
  return compoundsById[id] ?? compounds[0];
}

function knownBlend(id: string): BlendVariant {
  return blendsById[id] ?? blends[0];
}

function requireElement<T extends Element>(rootElement: ParentNode, selector: string): T {
  const element = rootElement.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Calculator element missing: ${selector}`);
  }
  return element;
}

function all<T extends Element>(rootElement: ParentNode, selector: string): T[] {
  return Array.from(rootElement.querySelectorAll<T>(selector));
}

function closestButton(target: EventTarget | null): HTMLButtonElement | null {
  return target instanceof Element ? target.closest("button") : null;
}

function closestSearchOption(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>("[data-catalog-id]") : null;
}

function toggleSetValue(values: Set<string>, value: string) {
  if (values.has(value)) {
    values.delete(value);
  } else {
    values.add(value);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nearlyEqual(left: number, right: number): boolean {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-9;
}
