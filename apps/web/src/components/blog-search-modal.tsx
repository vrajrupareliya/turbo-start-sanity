"use client";

import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSearchModal } from "@/components/search-modal-context";
import { useAlgoliaSearch } from "@/hooks/use-algolia-search";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import type { AlgoliaBlogHit } from "@/lib/algolia-client";
import { getBlogCategoryLabel } from "@/lib/blog-categories";
import { formatDate } from "@/utils";

function HighlightedText({
  text,
  fallback,
  className,
}: {
  text?: string | null;
  fallback?: string | null;
  className?: string;
}) {
  const content = text || fallback || "";
  if (!content) return null;

  // Split by Algolia's <mark> tags
  const parts = content.split(/(<mark>[\s\S]*?<\/mark>)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("<mark>") && part.endsWith("</mark>")) {
          const matched = part.slice(6, -7);
          return (
            <mark
              className="bg-foreground px-1 py-0.5 font-semibold text-background rounded-none"
              key={index}
            >
              {matched}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

function countMatches(hit: AlgoliaBlogHit): number {
  const titleHtml = hit._highlightResult?.title?.value || "";
  const descHtml = hit._highlightResult?.description?.value || "";
  const titleMatches = (titleHtml.match(/<mark>/g) || []).length;
  const descMatches = (descHtml.match(/<mark>/g) || []).length;
  return titleMatches + descMatches;
}

function BlogSearchResultItem({
  hit,
  isActive,
  hasQuery,
  index,
  onSelect,
  onMouseEnter,
}: {
  hit: AlgoliaBlogHit;
  isActive: boolean;
  hasQuery: boolean;
  index: number;
  onSelect: (hit: AlgoliaBlogHit) => void;
  onMouseEnter: () => void;
}) {
  const matches = hasQuery ? countMatches(hit) : 0;
  const formattedDate = formatDate(hit.publishedAt);
  const primaryCategory =
    hit.categoryLabels?.[0] ||
    getBlogCategoryLabel(hit.categories[0]) ||
    "BLOG";

  return (
    <button
      aria-selected={isActive}
      className={cn(
        "focus-ring group flex w-full cursor-pointer items-start justify-between gap-4 border-0 p-4 text-left transition-colors sm:px-5 sm:py-3.5",
        isActive
          ? "bg-muted/70 dark:bg-zinc-900"
          : "hover:bg-muted/40 dark:hover:bg-zinc-900/40"
      )}
      data-result-index={index}
      onClick={() => onSelect(hit)}
      onMouseEnter={onMouseEnter}
      role="option"
      tabIndex={-1}
      type="button"
    >
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        {/* Category and matches header */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {primaryCategory}
          </span>
          {matches > 0 ? (
            <span className="border border-border bg-background px-1.5 py-0.2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {matches} {matches === 1 ? "match" : "matches"}
            </span>
          ) : null}
          {formattedDate ? (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              • {formattedDate}
            </span>
          ) : null}
        </div>

        {/* Title with query highlight */}
        <h3 className="text-balance font-medium text-base text-foreground leading-snug group-hover:text-foreground">
          <HighlightedText
            fallback={hit.title}
            text={hit._highlightResult?.title?.value}
          />
        </h3>

        {/* Excerpt with query highlight */}
        {hit.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            <HighlightedText
              fallback={hit.description}
              text={hit._highlightResult?.description?.value}
            />
          </p>
        ) : null}
      </div>

      {/* Right side: Author Avatar or Name */}
      {hit.authors?.name ? (
        <div className="hidden shrink-0 items-center gap-2 self-center sm:flex">
          {hit.authors.image && (hit.authors.image as { id?: string })?.id ? (
            <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              <SanityImage
                alt={hit.authors.name}
                className="size-full object-cover"
                height={24}
                image={
                  hit.authors.image as ComponentProps<
                    typeof SanityImage
                  >["image"]
                }
                width={24}
              />
            </span>
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] uppercase text-muted-foreground">
              {hit.authors.name.charAt(0)}
            </span>
          )}
          <span className="truncate max-w-[100px] text-xs text-muted-foreground">
            {hit.authors.name}
          </span>
        </div>
      ) : null}
    </button>
  );
}

function BlogSearchEmptyState({
  hasQuery,
  hasFilters,
  query,
  onClearQuery,
  onClearFilters,
}: {
  hasQuery: boolean;
  hasFilters: boolean;
  query: string;
  onClearQuery: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <p className="font-medium text-base text-foreground">
        No matching results
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        {hasQuery ? (
          <>
            We couldn&rsquo;t find any articles matching “
            <span className="font-medium text-foreground">{query}</span>”
            {hasFilters ? " with the selected categories." : "."}
          </>
        ) : hasFilters ? (
          "No articles match all of the selected categories."
        ) : (
          "No articles found."
        )}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {hasQuery ? (
          <button
            className="focus-ring border border-foreground px-3 py-1 font-mono text-xs uppercase tracking-wide text-foreground hover:bg-foreground hover:text-background"
            onClick={onClearQuery}
            type="button"
          >
            Clear Search Text
          </button>
        ) : null}
        {hasFilters ? (
          <button
            className="focus-ring border border-border px-3 py-1 font-mono text-xs uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground"
            onClick={onClearFilters}
            type="button"
          >
            Clear Categories
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function BlogSearchModal() {
  const { isOpen, closeSearch, initialCategories } = useSearchModal();
  const router = useRouter();

  useScrollLock(isOpen);

  const {
    query,
    setQuery,
    clearQuery,
    selectedCategories,
    toggleCategory,
    removeCategory,
    clearCategories,
    results,
    availableOptions,
    allAvailableCategories,
    isLoading,
    error,
    hasQuery,
    hasFilters,
  } = useAlgoliaSearch({ initialCategories });

  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Keep active index in bounds when results change
  useEffect(() => {
    setActiveIndex((prev) => {
      if (results.length === 0) return 0;
      return Math.min(prev, results.length - 1);
    });
  }, [results.length]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || results.length === 0) return;
    const container = resultsContainerRef.current;
    if (!container) return;
    const activeEl = container.querySelector(
      `[data-result-index="${activeIndex}"]`
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, isOpen, results.length]);

  const handleSelectResult = useCallback(
    (hit: AlgoliaBlogHit) => {
      closeSearch();
      router.push(hit.slug);
    },
    [closeSearch, router]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSearch();
        return;
      }

      if (results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const activeHit = results[activeIndex];
        if (activeHit) {
          handleSelectResult(activeHit);
        }
      }
    },
    [results, activeIndex, closeSearch, handleSelectResult]
  );

  if (!isOpen) {
    return null;
  }

  const displayCategoryOptions = hasFilters
    ? availableOptions
    : allAvailableCategories;

  return (
    <div
      aria-labelledby="blog-search-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 md:p-10"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 touch-none bg-background/85 backdrop-blur-sm transition-opacity duration-200"
        onClick={closeSearch}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden border border-border bg-background shadow-2xl transition-all duration-200 sm:max-h-[85vh]">
        {/* Search Header / Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <label
            className="sr-only"
            htmlFor="algolia-search-input"
            id="blog-search-title"
          >
            Search blog articles
          </label>
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />

          <input
            autoComplete="off"
            className="flex-1 bg-transparent font-normal text-base text-foreground placeholder:text-muted-foreground outline-none"
            id="algolia-search-input"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search articles…"
            ref={inputRef}
            type="text"
            value={query}
          />

          {isLoading ? (
            <Loader2
              aria-label="Searching…"
              className="size-4 shrink-0 animate-spin text-muted-foreground"
            />
          ) : null}

          {/* Clear button (clears query only, does NOT clear selected categories) */}
          {hasQuery ? (
            <button
              aria-label="Clear query text"
              className="focus-ring shrink-0 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              onClick={clearQuery}
              type="button"
            >
              Clear
            </button>
          ) : null}

          {hasQuery ? (
            <span aria-hidden="true" className="text-border">
              |
            </span>
          ) : null}

          {/* Close button */}
          <button
            aria-label="Close search dialog"
            className="focus-ring -mr-1 inline-flex size-7 items-center justify-center rounded-none text-muted-foreground transition-colors hover:text-foreground"
            onClick={closeSearch}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Category Filters row below search bar */}
        <div
          aria-label="Filter results by category"
          className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/20 px-4 py-2.5 sm:px-5"
          role="toolbar"
        >
          {/* 'All' filter chip */}
          <button
            aria-pressed={!hasFilters}
            className={cn(
              "focus-ring inline-flex items-center border px-2.5 py-1 font-mono text-xs uppercase tracking-wide transition-colors",
              !hasFilters
                ? "border-foreground bg-foreground text-background font-medium"
                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
            )}
            onClick={clearCategories}
            type="button"
          >
            All
          </button>

          {/* Active selected categories with remove buttons */}
          {selectedCategories.map((cat) => {
            const label = getBlogCategoryLabel(cat) ?? cat;
            return (
              <span
                className="inline-flex items-center gap-1.5 border border-accent-green bg-accent-green px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-accent-green-foreground"
                key={cat}
              >
                <span>{label}</span>
                <button
                  aria-label={`Remove ${label} category filter`}
                  className="focus-ring -mr-1 inline-flex size-3.5 items-center justify-center text-accent-green-foreground/80 hover:bg-black/15 hover:text-accent-green-foreground active:scale-95"
                  onClick={() => removeCategory(cat)}
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}

          {/* Dynamic additional category choices */}
          {displayCategoryOptions.map(({ label, value }) => {
            const isSelected = selectedCategories.includes(value);
            if (isSelected) return null;
            return (
              <button
                aria-pressed={false}
                className="focus-ring inline-flex items-center border border-border bg-background px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-foreground transition-colors hover:border-foreground active:scale-[0.98]"
                key={value}
                onClick={() => toggleCategory(value)}
                type="button"
              >
                + {label}
              </button>
            );
          })}
        </div>

        {/* Results Container */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          id="blog-search-results-list"
          ref={resultsContainerRef}
          role="listbox"
          style={{ maxHeight: "calc(70vh - 120px)" }}
        >
          {/* Error State */}
          {error ? (
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-destructive">
                Search Error
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {error.message || "Failed to retrieve search results."}
              </p>
              <button
                className="focus-ring mt-2 inline-flex border border-foreground px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-foreground hover:bg-foreground hover:text-background"
                onClick={() => setQuery(query)}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <BlogSearchEmptyState
              hasFilters={hasFilters}
              hasQuery={hasQuery}
              onClearFilters={clearCategories}
              onClearQuery={clearQuery}
              query={query}
            />
          ) : (
            /* Results List */
            <div className="divide-y divide-border/60">
              {results.map((hit, index) => (
                <BlogSearchResultItem
                  hasQuery={hasQuery}
                  hit={hit}
                  index={index}
                  isActive={index === activeIndex}
                  key={hit.objectID || hit._id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onSelect={handleSelectResult}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts and count */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5 font-mono text-xs text-muted-foreground sm:px-5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="border border-border bg-background px-1.5 py-0.5 text-[10px]">
                ↓
              </kbd>
              <kbd className="border border-border bg-background px-1.5 py-0.5 text-[10px]">
                ↑
              </kbd>
              <span className="text-[11px] uppercase tracking-wider">
                Navigate
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="border border-border bg-background px-1.5 py-0.5 text-[10px]">
                ↵
              </kbd>
              <span className="text-[11px] uppercase tracking-wider">
                Select
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="border border-border bg-background px-1.5 py-0.5 text-[10px]">
                esc
              </kbd>
              <span className="text-[11px] uppercase tracking-wider">
                Close
              </span>
            </span>
          </div>

          <div className="text-[11px] uppercase tracking-wider tabular-nums">
            {results.length} {results.length === 1 ? "article" : "articles"}
          </div>
        </div>
      </div>
    </div>
  );
}
