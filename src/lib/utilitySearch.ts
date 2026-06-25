import type { Utility } from "@/data/utilities";

export type UtilitySortOption = "default" | "name-asc" | "name-desc" | "status";

export interface UtilityFilters {
  category: string;
  developer: string;
}

export interface IndexedUtility extends Utility {
  searchText: string;
}

export function getFilterOptions(items: Utility[]) {
  const categories = [...new Set(items.map((item) => item.category))].sort((a, b) =>
    a.localeCompare(b, "ko"),
  );
  const developers = [...new Set(items.map((item) => item.developer))].sort((a, b) =>
    a.localeCompare(b, "ko"),
  );

  return { categories, developers };
}

export function buildUtilityIndex(items: Utility[]): IndexedUtility[] {
  return items.map((utility) => ({
    ...utility,
    searchText: [
      utility.name,
      utility.description,
      utility.category,
      utility.developer,
      ...utility.tags,
      ...utility.features,
    ]
      .join(" ")
      .toLowerCase(),
  }));
}

export function filterUtilities(
  items: IndexedUtility[],
  query: string,
  filters: UtilityFilters,
): IndexedUtility[] {
  const trimmed = query.trim().toLowerCase();
  const tokens = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];

  return items.filter((utility) => {
    if (filters.category && utility.category !== filters.category) return false;
    if (filters.developer && utility.developer !== filters.developer) return false;
    if (tokens.length === 0) return true;
    return tokens.every((token) => utility.searchText.includes(token));
  });
}

export function sortUtilities(
  items: IndexedUtility[],
  sort: UtilitySortOption,
): IndexedUtility[] {
  if (sort === "default") return items;

  const sorted = [...items];

  switch (sort) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name, "ko"));
    case "status":
      return sorted.sort((a, b) => {
        if (a.status === b.status) {
          return a.name.localeCompare(b.name, "ko");
        }
        return a.status === "live" ? -1 : 1;
      });
    default:
      return sorted;
  }
}
