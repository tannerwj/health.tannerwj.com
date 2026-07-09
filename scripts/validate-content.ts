import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import affiliates from "../src/data/affiliates.json" with { type: "json" };
import { blends } from "../src/data/calculator/blends";
import { compounds } from "../src/data/calculator/compounds";
import type {
  BlendVariant,
  Compound,
  MassUnit,
  Quantity
} from "../src/data/calculator/types";

const requiredCollections = [
  "supplements",
  "sleep",
  "exercise",
  "protocols",
  "peptides",
  "follow"
] as const;

const webSourceTypes = new Set(["x", "pep-pedia", "website", "study"]);
const massUnits = new Set(["mcg", "mg"]);

export interface ValidationIssue {
  code: string;
  message: string;
  file?: string;
}

export interface EditorialEntry {
  collection: string;
  file: string;
  slug?: unknown;
  data: Record<string, unknown>;
}

export interface AffiliateEntry {
  vendor: string;
  product: string;
  url: string;
  practiceOnly?: boolean;
}

export interface ValidationInput {
  editorialEntries: EditorialEntry[];
  affiliates: Record<string, AffiliateEntry>;
  compounds: Compound[];
  blends: BlendVariant[];
  requiredCollections?: readonly string[];
}

export function validateIntegrity(input: ValidationInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = input.requiredCollections ?? requiredCollections;
  const affiliateKeys = new Set(Object.keys(input.affiliates));
  const compoundIds = new Set<string>();
  const blendIds = new Set<string>();
  const calculatorIds = new Set<string>();

  for (const collection of required) {
    if (!input.editorialEntries.some((entry) => entry.collection === collection)) {
      issues.push({
        code: "missing-collection-entry",
        message: `Collection "${collection}" must have at least one entry.`
      });
    }
  }

  for (const [key, affiliate] of Object.entries(input.affiliates)) {
    if (!isSlug(key)) {
      issues.push({
        code: "invalid-affiliate-key",
        message: `Affiliate key "${key}" must be kebab-case.`
      });
    }
    if (!isHttpUrl(affiliate.url)) {
      issues.push({
        code: "invalid-url",
        message: `Affiliate "${key}" has a malformed URL.`
      });
    }
  }

  for (const compound of input.compounds) {
    if (compoundIds.has(compound.id)) {
      issues.push({
        code: "duplicate-compound-id",
        message: `Duplicate compound id "${compound.id}".`
      });
    }
    compoundIds.add(compound.id);

    if (calculatorIds.has(compound.id)) {
      issues.push({
        code: "duplicate-calculator-id",
        message: `Calculator id "${compound.id}" is used more than once.`
      });
    }
    calculatorIds.add(compound.id);

    if (!isSlug(compound.id)) {
      issues.push({
        code: "invalid-compound-id",
        message: `Compound id "${compound.id}" must be kebab-case.`
      });
    }

    if (compound.practiceOnly && !compound.practiceNote) {
      issues.push({
        code: "missing-practice-note",
        message: `Practice compound "${compound.id}" must explain that it is practice data.`
      });
    }

    for (const vial of compound.commonVials ?? []) {
      pushQuantityIssues(issues, vial, `Compound "${compound.id}" common vial`);
    }

    for (const waterMl of compound.commonWaterMl ?? []) {
      if (!isPositiveNumber(waterMl)) {
        issues.push({
          code: "invalid-quantity",
          message: `Compound "${compound.id}" has a nonpositive common water volume.`
        });
      }
    }

    for (const preset of compound.dosePresets ?? []) {
      pushQuantityIssues(issues, preset, `Compound "${compound.id}" dose preset`);
    }

    const sourceIds = new Set<string>();
    for (const source of compound.sources ?? []) {
      if (sourceIds.has(source.id)) {
        issues.push({
          code: "duplicate-source-id",
          message: `Compound "${compound.id}" has duplicate source id "${source.id}".`
        });
      }
      sourceIds.add(source.id);
      pushSourceIssues(issues, source, `Compound "${compound.id}" source "${source.id}"`);
    }

    for (const range of compound.referenceRanges ?? []) {
      pushQuantityIssues(issues, range.min, `Compound "${compound.id}" reference range min`);
      pushQuantityIssues(issues, range.max, `Compound "${compound.id}" reference range max`);
      if (range.min.unit !== range.max.unit) {
        issues.push({
          code: "unit-mismatch",
          message: `Compound "${compound.id}" reference range "${range.label}" mixes units.`
        });
      }
      if (
        range.min.unit === range.max.unit &&
        isPositiveNumber(range.min.value) &&
        isPositiveNumber(range.max.value) &&
        range.max.value < range.min.value
      ) {
        issues.push({
          code: "invalid-range",
          message: `Compound "${compound.id}" reference range "${range.label}" max is below min.`
        });
      }
      for (const sourceId of range.sourceIds ?? []) {
        if (!sourceIds.has(sourceId)) {
          issues.push({
            code: "unknown-source-id",
            message: `Compound "${compound.id}" reference range "${range.label}" references unknown source "${sourceId}".`
          });
        }
      }
    }
  }

  for (const blend of input.blends) {
    if (blendIds.has(blend.id)) {
      issues.push({
        code: "duplicate-blend-id",
        message: `Duplicate blend id "${blend.id}".`
      });
    }
    blendIds.add(blend.id);

    if (calculatorIds.has(blend.id)) {
      issues.push({
        code: "duplicate-calculator-id",
        message: `Calculator id "${blend.id}" is used more than once.`
      });
    }
    calculatorIds.add(blend.id);

    if (!isSlug(blend.id)) {
      issues.push({
        code: "invalid-blend-id",
        message: `Blend id "${blend.id}" must be kebab-case.`
      });
    }

    if (blend.practiceOnly && !blend.practiceNote) {
      issues.push({
        code: "missing-practice-note",
        message: `Practice blend "${blend.id}" must explain that it is practice data.`
      });
    }

    if (blend.components.length < 2) {
      issues.push({
        code: "invalid-blend-components",
        message: `Blend "${blend.id}" must have at least two components.`
      });
    }

    const componentIds = new Set<string>();
    for (const component of blend.components) {
      if (!compoundIds.has(component.compoundId)) {
        issues.push({
          code: "unknown-blend-compound",
          message: `Blend "${blend.id}" references unknown compound "${component.compoundId}".`
        });
      }
      if (componentIds.has(component.compoundId)) {
        issues.push({
          code: "duplicate-blend-component",
          message: `Blend "${blend.id}" repeats component "${component.compoundId}".`
        });
      }
      componentIds.add(component.compoundId);
      pushQuantityIssues(
        issues,
        component.amount,
        `Blend "${blend.id}" component "${component.compoundId}"`
      );
    }

    for (const waterMl of blend.commonWaterMl ?? []) {
      if (!isPositiveNumber(waterMl)) {
        issues.push({
          code: "invalid-quantity",
          message: `Blend "${blend.id}" has a nonpositive common water volume.`
        });
      }
    }

    for (const preset of blend.dosePresets ?? []) {
      if (!componentIds.has(preset.anchorCompoundId)) {
        issues.push({
          code: "unknown-blend-anchor",
          message: `Blend "${blend.id}" preset "${preset.label}" anchors to an unknown component.`
        });
      }
      pushQuantityIssues(issues, preset.target, `Blend "${blend.id}" preset "${preset.label}"`);
    }

    for (const source of blend.sources ?? []) {
      pushSourceIssues(issues, source, `Blend "${blend.id}" source "${source.id}"`);
    }
  }

  const slugsByCollection = new Map<string, Map<string, string>>();
  const homepageOrders = new Map<number, string>();

  for (const entry of input.editorialEntries) {
    const slug = typeof entry.slug === "string" ? entry.slug : entry.data.slug;
    if (typeof slug !== "string" || !isSlug(slug)) {
      issues.push({
        code: "invalid-slug",
        message: `Entry "${entry.file}" must have a kebab-case slug.`,
        file: entry.file
      });
    } else {
      const collectionSlugs =
        slugsByCollection.get(entry.collection) ?? new Map<string, string>();
      const existing = collectionSlugs.get(slug);
      if (existing) {
        issues.push({
          code: "duplicate-slug",
          message: `Slug "${slug}" is duplicated in "${entry.collection}".`,
          file: entry.file
        });
      }
      collectionSlugs.set(slug, entry.file);
      slugsByCollection.set(entry.collection, collectionSlugs);

      const filenameSlug = path.basename(entry.file, path.extname(entry.file));
      if (filenameSlug !== slug) {
        issues.push({
          code: "slug-filename-mismatch",
          message: `Entry "${entry.file}" slug should match its filename.`,
          file: entry.file
        });
      }
    }

    if (entry.data.practiceOnly === true && typeof entry.data.practiceNote !== "string") {
      issues.push({
        code: "missing-practice-note",
        message: `Practice entry "${entry.file}" must explain that it is practice data.`,
        file: entry.file
      });
    }

    const affiliate = entry.data.affiliate;
    if (typeof affiliate === "string" && !affiliateKeys.has(affiliate)) {
      issues.push({
        code: "unknown-affiliate",
        message: `Entry "${entry.file}" references unknown affiliate "${affiliate}".`,
        file: entry.file
      });
    }

    const calculatorId = entry.data.calculatorId;
    if (typeof calculatorId === "string" && !calculatorIds.has(calculatorId)) {
      issues.push({
        code: "unknown-calculator-id",
        message: `Entry "${entry.file}" references unknown calculatorId "${calculatorId}".`,
        file: entry.file
      });
    }

    if (typeof entry.data.url === "string" && !isHttpUrl(entry.data.url)) {
      issues.push({
        code: "invalid-url",
        message: `Entry "${entry.file}" has a malformed URL.`,
        file: entry.file
      });
    }

    if (Array.isArray(entry.data.sources)) {
      for (const source of entry.data.sources) {
        pushSourceIssues(issues, source, `Entry "${entry.file}" source`, entry.file);
      }
    }

    if (entry.data.featured === true && typeof entry.data.homepageOrder === "number") {
      const existing = homepageOrders.get(entry.data.homepageOrder);
      if (existing) {
        issues.push({
          code: "homepage-order-collision",
          message: `Homepage order ${entry.data.homepageOrder} is used by both "${existing}" and "${entry.file}".`,
          file: entry.file
        });
      }
      homepageOrders.set(entry.data.homepageOrder, entry.file);
    }
  }

  return issues;
}

export function loadProjectInput(rootDir: string): ValidationInput {
  return {
    editorialEntries: readEditorialEntries(rootDir),
    affiliates: affiliates as Record<string, AffiliateEntry>,
    compounds,
    blends
  };
}

export function readEditorialEntries(rootDir: string): EditorialEntry[] {
  const entries: EditorialEntry[] = [];
  for (const collection of requiredCollections) {
    const collectionDir = path.join(rootDir, "src", "content", collection);
    if (!existsSync(collectionDir)) {
      continue;
    }
    for (const filename of readdirSync(collectionDir).filter((file) => file.endsWith(".md"))) {
      const absoluteFile = path.join(collectionDir, filename);
      const relativeFile = path.relative(rootDir, absoluteFile);
      const data = readFrontmatter(absoluteFile);
      entries.push({
        collection,
        file: relativeFile,
        slug: data.slug,
        data
      });
    }
  }
  return entries;
}

export function readFrontmatter(filePath: string): Record<string, unknown> {
  const source = readFileSync(filePath, "utf8");
  if (!source.startsWith("---\n")) {
    throw new Error(`${filePath} is missing YAML frontmatter.`);
  }
  const end = source.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error(`${filePath} has unterminated YAML frontmatter.`);
  }
  const yaml = source.slice(4, end);
  const parsed = parseYaml(yaml);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${filePath} frontmatter must be a mapping.`);
  }
  return parsed as Record<string, unknown>;
}

function pushQuantityIssues(
  issues: ValidationIssue[],
  quantity: Partial<Quantity<MassUnit>> | undefined,
  context: string
) {
  if (!quantity || typeof quantity !== "object") {
    issues.push({
      code: "missing-quantity",
      message: `${context} is missing a structured quantity.`
    });
    return;
  }

  if (!isPositiveNumber(quantity.value)) {
    issues.push({
      code: "invalid-quantity",
      message: `${context} must have a positive numeric value.`
    });
  }

  if (typeof quantity.unit !== "string" || !massUnits.has(quantity.unit)) {
    issues.push({
      code: "missing-unit",
      message: `${context} must use an explicit mass unit.`
    });
  }
}

function pushSourceIssues(
  issues: ValidationIssue[],
  source: unknown,
  context: string,
  file?: string
) {
  if (!source || typeof source !== "object") {
    issues.push({
      code: "invalid-source",
      message: `${context} must be an object.`,
      file
    });
    return;
  }

  const sourceRecord = source as Record<string, unknown>;
  const type = sourceRecord.type;
  const url = sourceRecord.url;

  if (typeof url === "string" && !isHttpUrl(url)) {
    issues.push({
      code: "invalid-url",
      message: `${context} has a malformed URL.`,
      file
    });
  }

  if (typeof type === "string" && webSourceTypes.has(type) && typeof url !== "string") {
    issues.push({
      code: "missing-source-url",
      message: `${context} of type "${type}" requires a URL.`,
      file
    });
  }
}

function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const isCli =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCli) {
  const rootDir = process.cwd();
  const issues = validateIntegrity(loadProjectInput(rootDir));
  if (issues.length > 0) {
    console.error("Content validation failed:");
    for (const issue of issues) {
      console.error(`- [${issue.code}] ${issue.message}`);
    }
    process.exit(1);
  }
  console.log("Content validation passed.");
}
