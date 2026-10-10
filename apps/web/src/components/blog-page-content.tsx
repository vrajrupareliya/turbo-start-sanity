"use client";

import type { QueryBlogIndexPageResult } from "@workspace/sanity/types";
import type { ReactNode } from "react";

import { BlogHeader, FeaturedBlogCard } from "@/components/blog-card";
import { BlogCategoryFilter } from "@/components/blog-category-filter";
import {
  BlogFilterToolbar,
  type SortOrder,
} from "@/components/blog-filter-toolbar";
import { BlogList } from "@/components/blog-list";
import { BlogPagination } from "@/components/blog-pagination";
import { BlogSearchLayout } from "@/components/blog-search-layout";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useBlogFilter } from "@/hooks/use-blog-filter";
import type { Blog } from "@/types";

type BlogPageContentProps = {
  indexPageData: NonNullable<QueryBlogIndexPageResult>;
  blogs: Blog[];
  featuredBlogs: Blog[];
  initialCategories?: string[];
  initialSort?: SortOrder;
  initialPage?: number;
  children?: ReactNode;
};

export function BlogPageContent({
  indexPageData,
  blogs,
  featuredBlogs,
  initialCategories = [],
  initialSort = "newest",
  initialPage = 1,
  children,
}: BlogPageContentProps) {
  const { title, description } = indexPageData;

  const {
    selectedCategories,
    sortOrder,
    currentPage,
    availableOptions,
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
  } = useBlogFilter({
    allBlogs: blogs,
    initialCategories,
    initialSort,
    initialPage,
  });

  const hasFilters = selectedCategories.length > 0;
  const showFeatured =
    !hasFilters &&
    sortOrder === "newest" &&
    currentPage === 1 &&
    featuredBlogs.length > 0;

  return (
    <main className="bg-background">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <div className="container mt-8 mb-16 md:my-16">
        <BlogHeader description={description} title={title} />

        <BlogSearchLayout
          categoryFilter={
            <BlogCategoryFilter
              availableOptions={availableOptions}
              onClearAll={onClearAll}
              onRemoveCategory={onRemoveCategory}
              onSelectCategory={onSelectCategory}
              selectedCategories={selectedCategories}
            />
          }
          featured={
            showFeatured
              ? featuredBlogs.map((blog) => (
                  <FeaturedBlogCard blog={blog} key={blog._id} />
                ))
              : null
          }
          list={
            <div className="flex flex-col gap-8">
              <BlogFilterToolbar
                hasFilters={hasFilters}
                onSortChange={onSortChange}
                sortOrder={sortOrder}
                totalCount={totalMatching}
              />
              <BlogList
                blogs={paginatedBlogs}
                hasActiveFilters={hasFilters}
                onClearFilters={onClearAll}
              />
              {totalPages > 1 ? (
                <BlogPagination
                  categories={selectedCategories}
                  className="mt-4"
                  currentPage={currentPage}
                  hasNextPage={hasNextPage}
                  hasPreviousPage={hasPreviousPage}
                  onPageChange={onPageChange}
                  sort={sortOrder}
                  totalPages={totalPages}
                />
              ) : null}
            </div>
          }
        />
      </div>

      {children}
    </main>
  );
}
