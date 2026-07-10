import registry from "../data/affiliates.json";

export interface AffiliateEntry {
  vendor: string;
  product: string;
  url: string;
  kind?: "search" | "product";
  asin?: string;
  practiceOnly?: boolean;
}

const affiliateRegistry = registry as Record<string, AffiliateEntry>;

export function getAffiliateEntries(data: {
  affiliate?: string;
  affiliates?: string[];
}): AffiliateEntry[] {
  const keys = data.affiliates ?? (data.affiliate ? [data.affiliate] : []);
  return keys.flatMap((key) => affiliateRegistry[key] ? [affiliateRegistry[key]] : []);
}

export function amazonLinkLabel(affiliate: AffiliateEntry, fallbackName: string): string {
  return affiliate.kind === "product"
    ? `View ${affiliate.product} on Amazon`
    : `View ${fallbackName} options on Amazon`;
}
