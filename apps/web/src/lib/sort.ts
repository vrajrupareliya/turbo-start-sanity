export type SortOption = "latest" | "oldest" | "az";

export const DEFAULT_SORT: SortOption = "latest";

export const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: "latest", label: "Latest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "Title A\u2013Z" },
] as const;

const VALID_SORT_VALUES = new Set<string>(
  SORT_OPTIONS.map((o) => o.value)
);

export function isValidSortOption(value: unknown): value is SortOption {
  return typeof value === "string" && VALID_SORT_VALUES.has(value);
}

export function getSortLabel(sort: SortOption): string {
  return SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Latest first";
}
