import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { type AlgoliaBlogHit, searchBlogs } from "@/lib/algolia";

import { useDebounce } from "./use-debounce";

const SEARCH_DEBOUNCE_MS = 300;
const CACHE_STALE_TIME_MS = 30_000;

export function useBlogSearch(categorySlug?: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const [searchQuery, setSearchQueryState] = useState(initialQuery);
  const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  const setSearchQuery = useCallback(
    (value: string) => {
      setSearchQueryState(value);

      // Sync URL on next tick to avoid blocking the input
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      // Remove page param when searching
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  const hasQuery = debouncedQuery.trim().length > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-search", categorySlug, debouncedQuery],
    queryFn: ({ signal }) =>
      searchBlogs(debouncedQuery, { categorySlug, signal }),
    enabled: hasQuery,
    staleTime: CACHE_STALE_TIME_MS,
  });

  return {
    searchQuery,
    setSearchQuery,
    results: (data?.hits ?? []) as AlgoliaBlogHit[],
    isSearching: isLoading && hasQuery,
    error: error ?? null,
    hasQuery,
  };
}
