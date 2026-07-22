"use client";

import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";

import type { AlgoliaBlogHit } from "@/lib/algolia";

type BlogSearchResultsProps = {
  className?: string;
  results: AlgoliaBlogHit[];
  isSearching: boolean;
  hasQuery: boolean;
  searchQuery: string;
  error?: Error | null;
};

function HighlightedText({ hit, attribute }: { hit: AlgoliaBlogHit; attribute: string }) {
  const highlight = hit._highlightResult?.[attribute];
  if (highlight?.value) {
    return (
      <span
        dangerouslySetInnerHTML={{ __html: highlight.value }}
      />
    );
  }
  const raw = hit[attribute as keyof typeof hit];
  return <>{typeof raw === "string" ? raw : ""}</>;
}

function SearchResultItem({ hit }: { hit: AlgoliaBlogHit }) {
  return (
    <Link
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
      href={hit.slug ?? "#"}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm text-foreground [&>mark]:bg-primary/20 [&>mark]:text-foreground [&_mark]:bg-primary/20 [&_mark]:text-foreground">
          <HighlightedText attribute="title" hit={hit} />
        </p>
        <p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs [&>mark]:bg-primary/20 [&>mark]:text-foreground [&_mark]:bg-primary/20 [&_mark]:text-foreground">
          <HighlightedText attribute="description" hit={hit} />
        </p>
      </div>
      {hit.category?.title && (
        <span className="mt-0.5 shrink-0 rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
          {hit.category.title}
        </span>
      )}
    </Link>
  );
}

function DropdownLoadingState() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="flex items-start gap-3" key={`search-skeleton-${i.toString()}`}>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

function DropdownEmptyState({ query }: { query: string }) {
  return (
    <div className="px-3 py-6 text-center">
      <p className="font-medium text-foreground text-sm">No results found</p>
      <p className="mt-1 text-muted-foreground text-xs">
        No articles matching &ldquo;{query}&rdquo;. Try different keywords.
      </p>
    </div>
  );
}

function DropdownErrorState() {
  return (
    <div className="px-3 py-6 text-center">
      <p className="font-medium text-destructive text-sm">Search failed</p>
      <p className="mt-1 text-muted-foreground text-xs">
        Please try again in a moment.
      </p>
    </div>
  );
}

export function BlogSearchResults({
  className,
  results,
  isSearching,
  hasQuery,
  searchQuery,
  error,
}: BlogSearchResultsProps) {
  if (!hasQuery) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-full right-0 left-0 z-10 mx-auto mt-1 max-h-80 w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-popover shadow-lg",
        className
      )}
      role="listbox"
    >
      {isSearching ? (
        <DropdownLoadingState />
      ) : error ? (
        <DropdownErrorState />
      ) : results.length === 0 ? (
        <DropdownEmptyState query={searchQuery} />
      ) : (
        <div className="p-1">
          <p className="px-3 py-1.5 text-muted-foreground text-xs">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
          {results.map((hit) => (
            <SearchResultItem hit={hit} key={hit.objectID} />
          ))}
        </div>
      )}
    </div>
  );
}
