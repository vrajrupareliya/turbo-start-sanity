"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Input } from "@workspace/ui/components/input";
import { Search, X } from "lucide-react";
import { useRef } from "react";

import { useSearchModal } from "@/components/search-modal-context";

export function SearchInput({
  className,
  placeholder,
  value,
  onChange,
  onClear,
}: {
  className?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div className="relative">
        <label className="sr-only" htmlFor="blog-search-input">
          {placeholder}
        </label>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground"
          />

          <Input
            className="h-auto rounded-none border-border bg-transparent py-1.5 pr-10 pl-9.5 text-sm shadow-none"
            id="blog-search-input"
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            value={value}
          />

          {value && (
            <button
              aria-label="Clear search"
              className="focus-ring -translate-y-1/2 absolute top-1/2 right-2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
              onClick={onClear}
              type="button"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BlogSearchTrigger({
  className,
  placeholder = "Search articles…",
  initialCategories,
}: {
  className?: string;
  placeholder?: string;
  initialCategories?: string[];
}) {
  const { openSearch } = useSearchModal();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      aria-label="Search articles (Cmd+K)"
      className={cn(
        "focus-ring group flex w-full items-center justify-between border border-border bg-background py-2 pr-3 pl-3.5 text-left text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
        className
      )}
      onClick={() => openSearch(triggerRef.current, { initialCategories })}
      ref={triggerRef}
      type="button"
    >
      <span className="flex items-center gap-2.5">
        <Search className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        <span className="font-normal text-sm">{placeholder}</span>
      </span>
      <kbd className="hidden items-center gap-0.5 border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex group-hover:text-foreground">
        ⌘K
      </kbd>
    </button>
  );
}
