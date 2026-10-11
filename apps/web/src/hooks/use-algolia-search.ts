"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BlogCategoryOptionItem } from "@/components/blog-category-filter";
import {
  type AlgoliaBlogHit,
  DEFAULT_ALGOLIA_INDEX,
  getAlgoliaSearchClient,
} from "@/lib/algolia-client";
import {
  cleanCategoryToken,
  getBlogCategoryLabel,
  getPostCategories,
} from "@/lib/blog-categories";

export type UseAlgoliaSearchOptions = {
  initialCategories?: string[];
  initialQuery?: string;
};

export function useAlgoliaSearch({
  initialCategories = [],
  initialQuery = "",
}: UseAlgoliaSearchOptions = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    initialCategories.map(cleanCategoryToken).filter(Boolean)
  );

  const [rawHits, setRawHits] = useState<AlgoliaBlogHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Request counter to discard out-of-order responses
  const latestRequestIdRef = useRef(0);
  // In-memory query cache for instant responses on rapid typing and backspacing
  const queryCacheRef = useRef<Map<string, AlgoliaBlogHit[]>>(new Map());

  // Execute Algolia search
  const performSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    const client = getAlgoliaSearchClient();

    if (!client) {
      setError(
        new Error(
          "Algolia client is not configured. Please check your NEXT_PUBLIC_ALGOLIA_APP_ID and NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY."
        )
      );
      return;
    }

    // Check memory cache first
    const cached = queryCacheRef.current.get(trimmed);
    if (cached) {
      setRawHits(cached);
      setIsLoading(false);
      setError(null);
    } else {
      setIsLoading(true);
    }

    const requestId = ++latestRequestIdRef.current;

    client
      .search({
        requests: [
          {
            indexName: DEFAULT_ALGOLIA_INDEX,
            query: trimmed,
            hitsPerPage: 50,
          },
        ],
      })
      .then((res) => {
        // Drop response if a newer search request has been dispatched
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        const hits =
          (res.results[0] as { hits?: AlgoliaBlogHit[] })?.hits ?? [];
        queryCacheRef.current.set(trimmed, hits);
        setRawHits(hits);
        setIsLoading(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  }, []);

  // Update query immediately (no artificial debounce delay)
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      performSearch(newQuery);
    },
    [performSearch]
  );

  // Clear query without unintentionally clearing category selections
  const clearQuery = useCallback(() => {
    setQuery("");
    performSearch("");
  }, [performSearch]);

  // Initial load when mounted
  useEffect(() => {
    performSearch(query);
  }, [performSearch, query]);

  // Filter rawHits by selectedCategories using Task 1 multi-select AND logic
  const filteredHits = useMemo(() => {
    if (selectedCategories.length === 0) {
      return rawHits;
    }

    return rawHits.filter((hit) => {
      const postCats = getPostCategories(hit);
      if (postCats.length === 0) return false;
      const hitCategorySet = new Set(postCats.map(cleanCategoryToken));
      return selectedCategories.every((cat) => hitCategorySet.has(cat));
    });
  }, [rawHits, selectedCategories]);

  // Dynamically derive category options present in matching posts
  const availableOptions = useMemo((): BlogCategoryOptionItem[] => {
    const selectedSet = new Set(selectedCategories.map(cleanCategoryToken));
    const presentCategorySet = new Set<string>();

    for (const hit of filteredHits) {
      const postCats = getPostCategories(hit);
      for (const cat of postCats) {
        const cleaned = cleanCategoryToken(cat);
        if (cleaned && !selectedSet.has(cleaned)) {
          presentCategorySet.add(cleaned);
        }
      }
    }

    return Array.from(presentCategorySet)
      .map((value) => ({
        value,
        label: getBlogCategoryLabel(value) ?? value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredHits, selectedCategories]);

  // All distinct categories present across the whole raw hit set (for the 'All' / base view)
  const allAvailableCategories = useMemo((): BlogCategoryOptionItem[] => {
    const set = new Set<string>();
    for (const hit of rawHits) {
      for (const cat of getPostCategories(hit)) {
        const cleaned = cleanCategoryToken(cat);
        if (cleaned) {
          set.add(cleaned);
        }
      }
    }
    return Array.from(set)
      .map((value) => ({
        value,
        label: getBlogCategoryLabel(value) ?? value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rawHits]);

  const selectCategory = useCallback((cat: string) => {
    const cleaned = cleanCategoryToken(cat);
    if (!cleaned) return;
    setSelectedCategories((prev) =>
      prev.includes(cleaned) ? prev : [...prev, cleaned]
    );
  }, []);

  const removeCategory = useCallback((cat: string) => {
    const cleaned = cleanCategoryToken(cat);
    setSelectedCategories((prev) => prev.filter((item) => item !== cleaned));
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    const cleaned = cleanCategoryToken(cat);
    if (!cleaned) return;
    setSelectedCategories((prev) =>
      prev.includes(cleaned)
        ? prev.filter((item) => item !== cleaned)
        : [...prev, cleaned]
    );
  }, []);

  const clearCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const clearAll = useCallback(() => {
    setQuery("");
    setSelectedCategories([]);
    performSearch("");
  }, [performSearch]);

  return {
    query,
    setQuery: handleQueryChange,
    clearQuery,
    selectedCategories,
    selectCategory,
    removeCategory,
    toggleCategory,
    clearCategories,
    clearAll,
    results: filteredHits,
    totalHits: filteredHits.length,
    rawHitsCount: rawHits.length,
    availableOptions,
    allAvailableCategories,
    isLoading,
    error,
    hasQuery: query.trim().length > 0,
    hasFilters: selectedCategories.length > 0,
  };
}
