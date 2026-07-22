"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/tailwind-config/utils";
import { ArrowUpDown, Check } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  type SortOption,
  DEFAULT_SORT,
  SORT_OPTIONS,
  getSortLabel,
} from "@/lib/sort";

export function BlogSortSelect({
  selectedSort,
}: {
  selectedSort: SortOption;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSortChange(value: SortOption) {
    if (value === selectedSort) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    // Remove page when changing sort to avoid empty pages
    params.delete("page");
    if (value === DEFAULT_SORT) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5",
          "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:bg-muted hover:text-foreground"
        )}
      >
        <ArrowUpDown aria-hidden="true" className="h-3 w-3" />
        <span>{getSortLabel(selectedSort)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SORT_OPTIONS.map((option) => {
          const isActive = option.value === selectedSort;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
            >
              <Check
                className={cn(
                  "mr-1 h-3.5 w-3.5",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
