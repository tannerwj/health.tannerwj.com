export const SITE_ORIGIN = "https://health.tannerwj.com";
export const SITE_NAME = "health.tannerwj.com";

export const SITE_DESCRIPTION =
  "Notes on Tanner Johnson's current health practices: what he takes, does, uses, tests, and follows.";

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
    description: "My routine, room, gear, and sleep tracking.",
    href: "/sleep"
  },
  {
    key: "exercise",
    number: "03",
    title: "Exercise",
    description: "My current split, training principles, sessions, and recovery.",
    href: "/exercise"
  },
  {
    key: "protocols",
    number: "04",
    title: "Protocols",
    description: "High-level testing, therapies, nutrition, and recovery practices.",
    href: "/protocols"
  },
  {
    key: "peptides",
    number: "05",
    title: "Peptides",
    description: "Notes on what I use, have tried, or am considering.",
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
