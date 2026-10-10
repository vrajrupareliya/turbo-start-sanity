"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { ArrowUpDown } from "lucide-react";

export type SortOrder = "newest" | "oldest" | "a-z";

export type BlogFilterToolbarProps = {
  totalCount: number;
  sortOrder: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  className?: string;
  hasFilters?: boolean;
};

export function BlogFilterToolbar({
  totalCount,
  sortOrder,
  onSortChange,
  className,
  hasFilters = false,
}: Readonly<BlogFilterToolbarProps>) {
  const countLabel = (() => {
    const plural = totalCount === 1 ? "article" : "articles";
    return hasFilters
      ? `${totalCount} ${plural} found`
      : `${totalCount} ${plural}`;
  })();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4",
        className
      )}
    >
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {countLabel}
      </span>

      <div className="flex items-center gap-2">
        <label
          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground"
          htmlFor="blog-sort-select"
        >
          <ArrowUpDown className="size-3" />
          <span>Sort by:</span>
        </label>
        <div className="relative">
          <select
            className="focus-ring cursor-pointer rounded-none border border-border bg-background px-3 py-1.5 pr-8 font-mono text-xs uppercase tracking-wide text-foreground transition-colors hover:border-foreground"
            id="blog-sort-select"
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
            value={sortOrder}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="a-z">A–Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}
