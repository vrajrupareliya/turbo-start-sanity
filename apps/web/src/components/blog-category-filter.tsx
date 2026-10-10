"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { X } from "lucide-react";

import { getBlogCategoryLabel } from "@/lib/blog-categories";

export type BlogCategoryOptionItem = {
  value: string;
  label: string;
};

export type BlogCategoryFilterProps = {
  selectedCategories: string[];
  availableOptions: BlogCategoryOptionItem[];
  onSelectCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
  onClearAll: () => void;
  className?: string;
};

export function BlogCategoryFilter({
  selectedCategories,
  availableOptions,
  onSelectCategory,
  onRemoveCategory,
  onClearAll,
  className,
}: Readonly<BlogCategoryFilterProps>) {
  const hasSelected = selectedCategories.length > 0;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* Active / Selected filters with individual remove controls and Clear all */}
      {hasSelected ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Active Filters ({selectedCategories.length})
            </span>
            <button
              className="focus-ring shrink-0 whitespace-nowrap font-mono text-xs uppercase tracking-wider text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground active:scale-[0.97]"
              onClick={onClearAll}
              type="button"
            >
              Clear all
            </button>
          </div>

          <section
            aria-label="Active category filters"
            className="flex flex-wrap items-center gap-1.5"
          >
            {selectedCategories.map((category) => {
              const label = getBlogCategoryLabel(category) ?? category;
              return (
                <span
                  className="inline-flex items-center gap-1.5 border border-accent-green bg-accent-green px-2.5 py-1 font-mono text-xs text-accent-green-foreground uppercase tracking-wide transition-transform duration-150 ease-out"
                  key={category}
                >
                  <span>{label}</span>
                  <button
                    aria-label={`Remove ${label} filter`}
                    className="focus-ring -mr-1 inline-flex size-4 items-center justify-center rounded-none text-accent-green-foreground/80 transition-transform duration-150 ease-out hover:bg-black/15 hover:text-accent-green-foreground active:scale-90 dark:hover:bg-white/25"
                    onClick={() => onRemoveCategory(category)}
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })}
          </section>
        </div>
      ) : null}

      {/* Dynamic available categories:
          - If filters are active (hasSelected): only render if additional categories can actually be added.
          - If no filters are active (!hasSelected): render category choices under 'Categories'.
      */}
      {hasSelected ? (
        availableOptions.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Add More Categories
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableOptions.map(({ label, value }) => (
                <button
                  className="focus-ring inline-flex items-center border border-border bg-background px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-foreground transition-transform duration-150 ease-out hover:border-foreground active:scale-[0.97]"
                  key={value}
                  onClick={() => onSelectCategory(value)}
                  type="button"
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>
        ) : null
      ) : (
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Categories
          </span>
          {availableOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {availableOptions.map(({ label, value }) => (
                <button
                  className="focus-ring inline-flex items-center border border-border bg-background px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-foreground transition-transform duration-150 ease-out hover:border-foreground active:scale-[0.97]"
                  key={value}
                  onClick={() => onSelectCategory(value)}
                  type="button"
                >
                  + {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-muted-foreground italic">
              No categories available
            </p>
          )}
        </div>
      )}
    </div>
  );
}
