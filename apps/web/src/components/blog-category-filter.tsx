import type { QueryBlogCategoriesResult } from "@workspace/sanity/types";
import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";

import { BlogSortSelect } from "@/components/blog-sort-select";
import { type SortOption, DEFAULT_SORT } from "@/lib/sort";

type BlogCategory = QueryBlogCategoriesResult[number];

type BlogCategoryFilterProps = {
  categories: BlogCategory[];
  categoriesLoadFailed?: boolean;
  selectedSlug?: string | null;
  selectedSort: SortOption;
  totalPostCount: number;
};

function getCategoryHref(slug?: string | null, sort?: SortOption) {
  const params = new URLSearchParams();
  if (slug) {
    params.set("category", slug);
  }
  if (sort && sort !== DEFAULT_SORT) {
    params.set("sort", sort);
  }
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

function CategoryPill({
  href,
  isActive,
  label,
  postCount,
}: {
  href: string;
  isActive: boolean;
  label: string;
  postCount: number;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 border-primary bg-primary text-primary-foreground shadow-sm",
        isActive
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:bg-muted hover:text-foreground"
      )}
      href={href}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs tabular-nums transition-colors",
          isActive
            ? "bg-primary-foreground/15 text-primary-foreground"
            : "bg-muted-foreground/10 text-muted-foreground group-hover:text-foreground"
        )}
      >
        {postCount}
      </span>
    </Link>
  );
}

export function BlogCategoryFilter({
  categories,
  categoriesLoadFailed = false,
  selectedSlug,
  selectedSort,
  totalPostCount,
}: BlogCategoryFilterProps) {
  return (
    <section
      aria-labelledby="blog-category-filter-title"
      className="mt-8 sm:mt-12"
    >
      <div className="flex flex-col gap-3 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Blog categories"
          className="flex gap-2 overflow-x-auto pt-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <CategoryPill
            href={getCategoryHref(undefined, selectedSort)}
            isActive={!selectedSlug}
            label="All"
            postCount={totalPostCount}
          />
          {categories.map((category) => (
            <CategoryPill
              href={getCategoryHref(category.slug, selectedSort)}
              isActive={category.slug === selectedSlug}
              key={category._id}
              label={category.title ?? "Untitled category"}
              postCount={category.postCount ?? 0}
            />
          ))}
        </nav>
        <div className="shrink-0">
          <BlogSortSelect selectedSort={selectedSort} />
        </div>
      </div>
      {categoriesLoadFailed ? (
        <p className="mt-3 text-muted-foreground text-sm" role="status">
          Categories are temporarily unavailable. You can still browse all
          posts.
        </p>
      ) : categories.length === 0 ? (
        <p className="mt-3 text-muted-foreground text-sm" role="status">
          No categories have been created yet.
        </p>
      ) : null}
    </section>
  );
}
