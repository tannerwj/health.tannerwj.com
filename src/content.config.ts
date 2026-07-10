import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const statusSchema = z.enum(["current", "considering", "previously-tried"]);
const startedSchema = z.string().regex(/^\d{4}(?:-\d{2})?$/);
const sourceTypeSchema = z.enum([
  "x",
  "pep-pedia",
  "website",
  "study",
  "person",
  "conversation"
]);

const sourceSchema = z.object({
  type: sourceTypeSchema,
  url: z.string().url().optional(),
  author: z.string().optional(),
  note: z.string().optional(),
  accessed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const sharedFields = {
  name: z.string().min(1),
  slug: slugSchema,
  summary: z.string().min(1),
  order: z.number().int().nonnegative(),
  featured: z.boolean().optional(),
  homepageOrder: z.number().int().nonnegative().optional(),
  started: startedSchema.optional(),
  sources: z.array(sourceSchema).optional(),
  practiceOnly: z.literal(true).optional(),
  practiceNote: z.string().optional()
};

const productFields = {
  brand: z.string().optional(),
  product: z.string().optional(),
  affiliate: z.string().optional(),
  affiliates: z.array(z.string()).min(1).optional()
};

const supplements = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/supplements" }),
  schema: z.object({
    ...sharedFields,
    status: statusSchema.optional(),
    dose: z.string().optional(),
    timing: z.string().optional(),
    frequency: z.string().optional(),
    ...productFields
  })
});

const sleep = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/sleep" }),
  schema: z.object({
    ...sharedFields,
    kind: z.enum(["routine", "environment", "gear", "tracking"]),
    status: statusSchema.optional(),
    timing: z.string().optional(),
    frequency: z.string().optional(),
    spec: z.string().optional(),
    ...productFields
  })
});

const exercise = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/exercise" }),
  schema: z.object({
    ...sharedFields,
    kind: z.enum(["split", "session", "principle", "equipment", "recovery"]),
    status: statusSchema.optional(),
    schedule: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    spec: z.string().optional(),
    ...productFields
  })
});

const protocols = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/protocols" }),
  schema: z.object({
    ...sharedFields,
    kind: z.enum(["testing", "therapy", "nutrition", "recovery", "other"]),
    status: statusSchema.optional(),
    cadence: z.string().optional(),
    provider: z.string().optional(),
    service: z.string().optional(),
    location: z.string().optional(),
    markers: z.array(z.string()).optional(),
    affiliate: z.string().optional()
  })
});

const peptides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/peptides" }),
  schema: z.object({
    ...sharedFields,
    entryType: z.enum(["personal", "source-note"]),
    status: statusSchema.optional(),
    calculatorId: z.string().optional(),
    form: z.enum(["single", "blend"]),
    category: z.enum([
      "repair",
      "growth-hormone",
      "metabolic",
      "immune",
      "pigmentation-sexual-health",
      "longevity-sleep"
    ]),
    evidenceMaturity: z.enum([
      "established-human-use",
      "human-trial",
      "limited-human",
      "preclinical",
      "component-extrapolation"
    ]),
    aliases: z.array(z.string()).optional(),
    components: z.array(z.string()).optional(),
    commonContext: z.string().min(1),
    evidenceNote: z.string().min(1),
    atAGlance: z.string().min(1),
    route: z.string().optional(),
    dose: z.string().optional(),
    timing: z.string().optional(),
    frequency: z.string().optional(),
    cycle: z.string().optional(),
    vial: z.string().optional(),
    reconstitution: z.string().optional(),
    storage: z.string().optional(),
    mechanism: z.string().optional(),
    effects: z.string().optional(),
    sideEffects: z.array(z.string()).optional(),
    contraindications: z.array(z.string()).optional()
  }).superRefine((entry, context) => {
    if (entry.entryType === "personal" && !entry.status) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Personal peptide entries require a status."
      });
    }

    if (entry.entryType === "source-note") {
      if (!entry.sources?.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Peptide source notes require at least one source."
        });
      }

      for (const field of ["dose", "timing", "frequency", "cycle", "effects"] as const) {
        if (entry[field]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Peptide source notes cannot include personal ${field}.`,
            path: [field]
          });
        }
      }
    }
  })
});

const supplies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/supplies" }),
  schema: z.object({
    name: z.string().min(1),
    slug: slugSchema,
    summary: z.string().min(1),
    order: z.number().int().nonnegative(),
    category: z.literal("peptide-preparation"),
    affiliates: z.array(z.string()).min(1)
  })
});

const follow = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/follow" }),
  schema: z.object({
    name: z.string().min(1),
    slug: slugSchema,
    handle: z.string().min(1),
    url: z.string().url(),
    profiles: z.array(z.object({
      handle: z.string().min(1),
      url: z.string().url(),
      platform: z.string().default("x")
    })).min(1).optional(),
    group: z.enum(["longevity", "training", "sleep", "nutrition", "general"]),
    summary: z.string().min(1),
    order: z.number().int().nonnegative(),
    platform: z.string().default("x"),
    featured: z.boolean().optional(),
    homepageOrder: z.number().int().nonnegative().optional(),
    practiceOnly: z.literal(true).optional(),
    practiceNote: z.string().optional()
  })
});

export const collections = {
  supplements,
  sleep,
  exercise,
  protocols,
  peptides,
  supplies,
  follow
};
