import { getCollection, type CollectionEntry } from "astro:content";
import { editorialSections, isHomepageCurrentEntry } from "../data/site";

type OrderedEntry = {
  data: {
    order: number;
  };
};

type HomepageEntryData = {
  data: {
    featured?: boolean;
    homepageOrder?: number;
  };
};

export function sortByOrder<TEntry extends OrderedEntry>(entries: readonly TEntry[]): TEntry[] {
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}

export function sortFeatured<TEntry extends HomepageEntryData>(entries: readonly TEntry[]): TEntry[] {
  return [...entries].sort(
    (a, b) =>
      (a.data.homepageOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.data.homepageOrder ?? Number.MAX_SAFE_INTEGER)
  );
}

export function groupBy<TEntry, TKey extends PropertyKey>(
  entries: readonly TEntry[],
  getKey: (entry: TEntry) => TKey
): Map<TKey, TEntry[]> {
  const grouped = new Map<TKey, TEntry[]>();

  for (const entry of entries) {
    const key = getKey(entry);
    const bucket = grouped.get(key);

    if (bucket) {
      bucket.push(entry);
    } else {
      grouped.set(key, [entry]);
    }
  }

  return grouped;
}

export async function getOrderedEditorialSections() {
  const [supplements, sleep, exercise, protocols, peptides, follow] = await Promise.all([
    getCollection("supplements"),
    getCollection("sleep"),
    getCollection("exercise"),
    getCollection("protocols"),
    getCollection("peptides"),
    getCollection("follow")
  ]);

  return [
    { section: editorialSections[0], entries: sortByOrder(supplements) },
    { section: editorialSections[1], entries: sortByOrder(sleep) },
    { section: editorialSections[2], entries: sortByOrder(exercise) },
    { section: editorialSections[3], entries: sortByOrder(protocols) },
    { section: editorialSections[4], entries: sortByOrder(peptides) },
    { section: editorialSections[5], entries: sortByOrder(follow) }
  ] as const;
}

export type OrderedEditorialSections = Awaited<ReturnType<typeof getOrderedEditorialSections>>;

type FeaturedEditorialEntry =
  | CollectionEntry<"supplements">
  | CollectionEntry<"sleep">
  | CollectionEntry<"exercise">
  | CollectionEntry<"protocols">
  | CollectionEntry<"peptides">
  | CollectionEntry<"follow">;

export function getFeaturedEditorialEntries(sections: OrderedEditorialSections) {
  const featuredEntries: Array<{
    section: OrderedEditorialSections[number]["section"];
    entry: FeaturedEditorialEntry;
  }> = [];

  for (const section of sections) {
    for (const entry of section.entries) {
      if (isHomepageCurrentEntry(section.section.key, entry.data)) {
        featuredEntries.push({
          section: section.section,
          entry
        });
      }
    }
  }

  return [...featuredEntries].sort(
    (a, b) =>
      (a.entry.data.homepageOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.entry.data.homepageOrder ?? Number.MAX_SAFE_INTEGER)
  );
}
