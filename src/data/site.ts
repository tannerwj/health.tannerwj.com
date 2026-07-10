export const SITE_ORIGIN = "https://health.tannerwj.com";
export const SITE_NAME = "Tanner's Field Notes";
export const SITE_ALTERNATE_NAME = "Field Notes";
export const SITE_LOCALE = "en_US";
export const SITE_LANGUAGE = "en-US";
export const SITE_AUTHOR = "Tanner Johnson";
export const X_HANDLE = "@tannerwj";
export const SOCIAL_IMAGE_PATH = "/social-card.png";
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;
export const SOCIAL_IMAGE_ALT =
  "Tanner's Field Notes in dark green and clay on a warm paper background.";

export const SITE_DESCRIPTION =
  "Tanner Johnson's field notes on supplements, sleep, exercise, health protocols, peptides, and the people shaping his research.";

export const routeMetadata = {
  "/": {
    title: "Health, Training & Peptide Notes",
    description: SITE_DESCRIPTION
  },
  "/supplements": {
    title: "Supplements",
    description:
      "Tanner Johnson's current supplements, dosage and timing notes, product links, and sourced context on commonly discussed supplements."
  },
  "/sleep": {
    title: "Sleep",
    description:
      "Sleep field notes covering Tanner Johnson's routine, bedroom setup, light, temperature, gear, tracking, and evidence-led ideas."
  },
  "/exercise": {
    title: "Exercise",
    description:
      "Training notes on strength, conditioning, mobility, recovery, programming, fitness testing, and home gym equipment."
  },
  "/protocols": {
    title: "Health Protocols",
    description:
      "Sourced notes on nutrition, biomarkers, testing, recovery tools, and therapies, organized as a practical health reference."
  },
  "/peptides": {
    title: "Peptide Reference Library",
    description:
      "A sourced reference library for peptide singles and named blends, with evidence context and direct links to vial calculations."
  },
  "/follow": {
    title: "People to Follow",
    description:
      "The researchers, clinicians, coaches, and health educators Tanner Johnson follows, with their primary X profiles and focus areas."
  },
  "/peptides/calculator": {
    title: "Peptide Calculator",
    description:
      "Calculate peptide reconstitution, concentration, U-100 syringe units, and named blend amounts using clear vial and water inputs."
  }
} as const;

export const FOOTER_DISCLOSURE =
  "This is what I do, not a protocol for you. Some links are affiliate links — they don't change what I recommend.";

export const editorialSections = [
  {
    key: "supplements",
    number: "01",
    title: "Supplements",
    description: "My daily and weekly stack, with timing, reason, and product context.",
    href: "/supplements"
  },
  {
    key: "sleep",
    number: "02",
    title: "Sleep",
    description: "Sleep routine, room, gear, and source notes.",
    href: "/sleep"
  },
  {
    key: "exercise",
    number: "03",
    title: "Exercise",
    description: "Training principles, sessions, equipment, recovery, and ideas.",
    href: "/exercise"
  },
  {
    key: "protocols",
    number: "04",
    title: "Protocols",
    description: "High-level testing, therapy, nutrition, and recovery notes.",
    href: "/protocols"
  },
  {
    key: "peptides",
    number: "05",
    title: "Peptides",
    description: "A sourced reference library for peptide singles and named blends.",
    href: "/peptides"
  },
  {
    key: "follow",
    number: "06",
    title: "Follow",
    description: "People and accounts I follow for health and training.",
    href: "/follow"
  }
] as const;

export const calculatorRoute = {
  key: "calculator",
  title: "Calculator",
  description: "Vial math for reconstitution and named blends.",
  href: "/peptides/calculator"
} as const;

export const siteRoutes = [
  "/",
  ...editorialSections.map((section) => section.href),
  calculatorRoute.href
] as const;

export type EditorialSection = (typeof editorialSections)[number];
export type EditorialSectionKey = EditorialSection["key"];
export type SiteRoute = (typeof siteRoutes)[number];

export function isHomepageCurrentEntry(
  sectionKey: EditorialSectionKey,
  data: { featured?: boolean; status?: string; entryType?: string }
): boolean {
  return (
    data.featured === true &&
    data.status === "current" &&
    (sectionKey !== "peptides" || data.entryType === "personal")
  );
}
