export const siteUrl = "https://health.tannerwj.com";
export const siteTitle = "health.tannerwj.com";
export const siteDescription =
  "Tanner Johnson's public personal health field guide for current supplements, sleep, exercise, protocols, peptides, and people worth following.";
export const disclosureText =
  "This is what I do, not a protocol for you. Some links are affiliate links — they don't change what I recommend.";

export const editorialSections = [
  {
    key: "supplements",
    code: "01",
    label: "Supplements",
    href: "/supplements",
    description: "Daily and weekly stack with dose, timing, and why."
  },
  {
    key: "sleep",
    code: "02",
    label: "Sleep",
    href: "/sleep",
    description: "Routine, environment, gear, and tracking."
  },
  {
    key: "exercise",
    code: "03",
    label: "Exercise",
    href: "/exercise",
    description: "Current split, principles, equipment, and recovery."
  },
  {
    key: "protocols",
    code: "04",
    label: "Protocols",
    href: "/protocols",
    description: "Testing cadence plus other nutrition, therapy, and recovery protocols."
  },
  {
    key: "peptides",
    code: "05",
    label: "Peptides",
    href: "/peptides",
    description: "Editorial peptide notes kept separate from calculator math."
  },
  {
    key: "follow",
    code: "06",
    label: "Follow",
    href: "/follow",
    description: "People and accounts worth following across health topics."
  }
] as const;

export const calculatorRoute = {
  label: "Calculator",
  href: "/peptides/calculator",
  description:
    "Separate route for reconstitution math, named blends, and future calculator presets."
} as const;

export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Supplements", href: "/supplements" },
  { label: "Sleep", href: "/sleep" },
  { label: "Exercise", href: "/exercise" },
  { label: "Protocols", href: "/protocols" },
  { label: "Peptides", href: "/peptides" },
  { label: "Follow", href: "/follow" }
] as const;

export type EditorialSection = (typeof editorialSections)[number];
export type EditorialSectionKey = EditorialSection["key"];
