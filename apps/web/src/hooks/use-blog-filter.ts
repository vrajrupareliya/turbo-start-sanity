"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { BlogCategoryOptionItem } from "@/components/blog-category-filter";
import type { SortOrder } from "@/components/blog-filter-toolbar";
import {
  BLOG_CATEGORIES,
  cleanCategoryToken,
  getBlogCategoryLabel,
  getPostCategories,
} from "@/lib/blog-categories";
import type { Blog } from "@/types";

const DEFAULT_PAGE_SIZE = 9;

function parseCategoriesFromSearch(search: string): string[] {
  if (!search) return [];
  const params = new URLSearchParams(search);
  const raw = params.get("categories") || params.get("category");
  if (!raw) return [];
  return raw.split(",").map(cleanCategoryToken).filter(Boolean);
}

function parseSortFromSearch(search: string): SortOrder {
  if (!search) return "newest";
  const params = new URLSearchParams(search);
  const sort = params.get("sort")?.toLowerCase();
  if (sort === "oldest") return "oldest";
  if (sort === "a-z" || sort === "az" || sort === "title") return "a-z";
  return "newest";
}

function parsePageFromSearch(search: string): number {
  if (!search) return 1;
  const params = new URLSearchParams(search);
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export type UseBlogFilterOptions = {
  allBlogs: Blog[];
  initialCategories?: string[];
  initialSort?: SortOrder;
  initialPage?: number;
  pageSize?: number;
};

export function useBlogFilter({
  allBlogs,
  initialCategories = [],
  initialSort = "newest",
  initialPage = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseBlogFilterOptions) {
  // Set of all valid category tokens (taxonomy + existing post categories)
  const validCategorySet = useMemo(() => {
    const set = new Set<string>();
    for (const cat of BLOG_CATEGORIES) {
      const cleaned = cleanCategoryToken(cat.value);
      if (cleaned) {
        set.add(cleaned);
      }
    }
    for (const blog of allBlogs) {
      for (const cat of getPostCategories(blog)) {
        const cleaned = cleanCategoryToken(cat);
        if (cleaned) {
          set.add(cleaned);
        }
      }
    }
    return set;
  }, [allBlogs]);

  // Validate categories:
  // - Filters out invalid categories while keeping valid ones.
  // - If at least one valid category exists (e.g. "sanity,aaa"), keep the valid ones (["sanity"]).
  // - If ALL categories are invalid (e.g. "aaa,bbb") or empty, return [] ("show all blogs").
  const validateCategoryTokens = useCallback(
    (tokens: string[]): string[] => {
      if (!tokens || tokens.length === 0) return [];
      const valid = tokens
        .map(cleanCategoryToken)
        .filter((t) => t.length > 0 && validCategorySet.has(t));
      // Deduplicate valid tokens while preserving order
      return Array.from(new Set(valid));
    },
    [validCategorySet]
  );

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    validateCategoryTokens(initialCategories)
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSort);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // Sync state with browser location on mount & back/forward navigation
  useEffect(() => {
    const syncFromLocation = () => {
      const search = window.location.search;
      if (!search) {
        setSelectedCategories([]);
        setSortOrder("newest");
        setCurrentPage(1);
        return;
      }
      const parsedCats = parseCategoriesFromSearch(search);
      const validated = validateCategoryTokens(parsedCats);
      setSelectedCategories(validated);
      setSortOrder(parseSortFromSearch(search));
      setCurrentPage(parsePageFromSearch(search));
    };

    // Also sync on initial mount in case URL search params changed
    syncFromLocation();

    window.addEventListener("popstate", syncFromLocation);
    return () => {
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, [validateCategoryTokens]);

  // Update browser URL query string without a network round trip
  const syncUrl = useCallback(
    (categories: string[], sort: SortOrder, page: number) => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams();
      if (categories.length > 0) {
        params.set("categories", categories.join(","));
      }
      if (sort !== "newest") {
        params.set("sort", sort);
      }
      if (page > 1) {
        params.set("page", String(page));
      }

      const queryString = params.toString();
      const newUrl = queryString ? `/blog?${queryString}` : "/blog";
      const currentUrl = `${window.location.pathname}${window.location.search}`;

      if (currentUrl !== newUrl) {
        window.history.pushState(null, "", newUrl);
      }
    },
    []
  );

  // Multi-select AND filtering: blog must match every selected category
  const matchingBlogs = useMemo(() => {
    if (selectedCategories.length === 0) {
      return allBlogs;
    }

    return allBlogs.filter((blog) => {
      const postCats = getPostCategories(blog);
      if (postCats.length === 0) return false;
      const postCatSet = new Set(postCats.map(cleanCategoryToken));
      return selectedCategories.every((cat) =>
        postCatSet.has(cleanCategoryToken(cat))
      );
    });
  }, [allBlogs, selectedCategories]);

  // Dynamic category options: only unselected categories present in matching posts
  const availableOptions = useMemo((): BlogCategoryOptionItem[] => {
    const selectedSet = new Set(selectedCategories.map(cleanCategoryToken));
    const presentCategorySet = new Set<string>();

    for (const blog of matchingBlogs) {
      const postCats = getPostCategories(blog);
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
  }, [matchingBlogs, selectedCategories]);

  // Sorting
  const sortedBlogs = useMemo(() => {
    const items = [...matchingBlogs];

    if (sortOrder === "newest") {
      items.sort((a, b) => {
        const dateA = a.publishedAt
          ? new Date(a.publishedAt).getTime()
          : -Infinity;
        const dateB = b.publishedAt
          ? new Date(b.publishedAt).getTime()
          : -Infinity;
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        return (a.orderRank ?? "").localeCompare(b.orderRank ?? "");
      });
    } else if (sortOrder === "oldest") {
      items.sort((a, b) => {
        const dateA = a.publishedAt
          ? new Date(a.publishedAt).getTime()
          : Infinity;
        const dateB = b.publishedAt
          ? new Date(b.publishedAt).getTime()
          : Infinity;
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        return (a.orderRank ?? "").localeCompare(b.orderRank ?? "");
      });
    } else if (sortOrder === "a-z") {
      items.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }

    return items;
  }, [matchingBlogs, sortOrder]);

  // Pagination calculation
  const totalMatching = sortedBlogs.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedBlogs = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedBlogs.slice(start, start + pageSize);
  }, [sortedBlogs, safeCurrentPage, pageSize]);

  const hasNextPage = safeCurrentPage < totalPages;
  const hasPreviousPage = safeCurrentPage > 1;

  // Actions
  const onSelectCategory = useCallback(
    (category: string) => {
      const cleaned = cleanCategoryToken(category);
      if (!cleaned) return;
      if (!selectedCategories.includes(cleaned)) {
        const next = [...selectedCategories, cleaned];
        setSelectedCategories(next);
        setCurrentPage(1);
        syncUrl(next, sortOrder, 1);
      }
    },
    [selectedCategories, sortOrder, syncUrl]
  );

  const onRemoveCategory = useCallback(
    (category: string) => {
      const cleaned = cleanCategoryToken(category);
      const next = selectedCategories.filter((c) => c !== cleaned);
      setSelectedCategories(next);
      setCurrentPage(1);
      syncUrl(next, sortOrder, 1);
    },
    [selectedCategories, sortOrder, syncUrl]
  );

  const onClearAll = useCallback(() => {
    setSelectedCategories([]);
    setCurrentPage(1);
    syncUrl([], sortOrder, 1);
  }, [sortOrder, syncUrl]);

  const onSortChange = useCallback(
    (newSort: SortOrder) => {
      setSortOrder(newSort);
      syncUrl(selectedCategories, newSort, currentPage);
    },
    [selectedCategories, currentPage, syncUrl]
  );

  const onPageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      syncUrl(selectedCategories, sortOrder, newPage);
    },
    [selectedCategories, sortOrder, syncUrl]
  );

  return {
    selectedCategories,
    sortOrder,
    currentPage: safeCurrentPage,
    availableOptions,
    matchingBlogs,
    sortedBlogs,
    paginatedBlogs,
    totalMatching,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    onSelectCategory,
    onRemoveCategory,
    onClearAll,
    onSortChange,
    onPageChange,
  };
}
