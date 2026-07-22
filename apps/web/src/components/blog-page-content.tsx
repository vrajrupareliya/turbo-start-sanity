import type {
  QueryBlogCategoriesResult,
  QueryBlogCategoryBySlugResult,
  QueryBlogIndexPageDataResult,
} from "@workspace/sanity/types";

import type { SortOption } from "@/lib/sort";

import { BlogHeader } from "@/components/blog-card";
import { BlogCategoryFilter } from "@/components/blog-category-filter";
import { BlogPagination } from "@/components/blog-pagination";
import { BlogSection } from "@/components/blog-section";
import { PageBuilder } from "@/components/pagebuilder";
import type { Blog } from "@/types";
import type { PaginationMetadata } from "@/utils";
import { BlogSearch } from "./blog-search";

type BlogPageContentProps = {
  categories: QueryBlogCategoriesResult;
  categoriesLoadFailed?: boolean;
  categoryError?: "invalid" | "not-found" | "unavailable";
  indexPageData: NonNullable<QueryBlogIndexPageDataResult>;
  blogs: Blog[];
  paginationMetadata: PaginationMetadata;
  selectedCategory?: QueryBlogCategoryBySlugResult;
  selectedSort: SortOption;
  totalPostCount: number;
};

export function BlogPageContent({
  categories,
  categoriesLoadFailed = false,
  categoryError,
  indexPageData,
  blogs,
  paginationMetadata,
  selectedCategory,
  selectedSort,
  totalPostCount,
}: BlogPageContentProps) {
  const {
    title,
    description,
    pageBuilder = [],
    _id,
    _type,
    featuredBlogsCount,
    displayFeaturedBlogs,
  } = indexPageData;

  return (
    <main className="bg-background">
      <div className="container my-16">
        <BlogHeader description={description} title={title} />
        <BlogCategoryFilter
          categories={categories}
          categoriesLoadFailed={categoriesLoadFailed}
          selectedSlug={selectedCategory?.slug}
          selectedSort={selectedSort}
          totalPostCount={totalPostCount}
        />
        <BlogContentState
          blogs={blogs}
          categoryError={categoryError}
          displayFeaturedBlogs={displayFeaturedBlogs}
          featuredBlogsCount={featuredBlogsCount}
          paginationMetadata={paginationMetadata}
          selectedCategory={selectedCategory}
          selectedSort={selectedSort}
        />
      </div>

      {pageBuilder && pageBuilder.length > 0 && (
        <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
      )}
    </main>
  );
}

function BlogContentState({
  blogs,
  categoryError,
  displayFeaturedBlogs,
  featuredBlogsCount,
  paginationMetadata,
  selectedCategory,
  selectedSort,
}: Pick<
  BlogPageContentProps,
  | "blogs"
  | "categoryError"
  | "paginationMetadata"
  | "selectedCategory"
  | "selectedSort"
> & {
  displayFeaturedBlogs: boolean | null;
  featuredBlogsCount: string | null;
}) {
  const message = getCategoryErrorMessage(categoryError);
  if (message) {
    return <CategoryMessage {...message} />;
  }

  return (
    <>
      <BlogSearch categorySlug={selectedCategory?.slug} />
      <BlogPostListing
        blogs={blogs}
        displayFeaturedBlogs={displayFeaturedBlogs}
        featuredBlogsCount={featuredBlogsCount}
        paginationMetadata={paginationMetadata}
        selectedCategory={selectedCategory}
        selectedSort={selectedSort}
      />
    </>
  );
}

function BlogPostListing({
  blogs,
  displayFeaturedBlogs,
  featuredBlogsCount,
  paginationMetadata,
  selectedCategory,
  selectedSort,
}: Pick<
  BlogPageContentProps,
  | "blogs"
  | "paginationMetadata"
  | "selectedCategory"
  | "selectedSort"
> & {
  displayFeaturedBlogs: boolean | null;
  featuredBlogsCount: string | null;
}) {
  const featuredCount = getFeaturedCount({
    displayFeaturedBlogs,
    featuredBlogsCount,
    paginationMetadata,
    selectedCategory,
  });
  const featuredBlogs = blogs.slice(0, featuredCount);
  const remainingBlogs = blogs.slice(featuredCount);

  if (blogs.length === 0) {
    const categoryTitle = selectedCategory?.title ?? "this category";
    return (
      <CategoryMessage
        description={
          selectedCategory
            ? `There are no posts in ${categoryTitle} yet. Check back soon or explore another topic.`
            : "There are no blog posts available at the moment."
        }
        title={
          selectedCategory
            ? `No posts in ${categoryTitle}`
            : "No blog posts yet"
        }
      />
    );
  }

  return (
    <>
      <BlogSection blogs={featuredBlogs} isFeatured title="Featured Posts" />
      <BlogSection blogs={remainingBlogs} title="All Posts" />
      {paginationMetadata.totalPages > 1 && (
        <BlogPagination
          categorySlug={selectedCategory?.slug}
          className="mt-12 flex justify-center"
          currentPage={paginationMetadata.currentPage}
          hasNextPage={paginationMetadata.hasNextPage}
          hasPreviousPage={paginationMetadata.hasPreviousPage}
          sortOption={selectedSort}
          totalPages={paginationMetadata.totalPages}
        />
      )}
    </>
  );
}

function getCategoryErrorMessage(
  categoryError: BlogPageContentProps["categoryError"]
) {
  const messages = {
    invalid: {
      description:
        "Use one category slug in the URL, for example /blog?category=sanity.",
      title: "This category URL is invalid",
    },
    "not-found": {
      description:
        "This category may have been renamed or removed. Choose another topic or browse all posts.",
      title: "Category not found",
    },
    unavailable: {
      description:
        "We could not verify this category right now. Please refresh the page or browse all posts.",
      title: "Category is temporarily unavailable",
    },
  } as const;
  return categoryError ? messages[categoryError] : undefined;
}

function getFeaturedCount({
  displayFeaturedBlogs,
  featuredBlogsCount,
  paginationMetadata,
  selectedCategory,
}: {
  displayFeaturedBlogs: boolean | null;
  featuredBlogsCount: string | null;
  paginationMetadata: PaginationMetadata;
  selectedCategory?: QueryBlogCategoryBySlugResult;
}) {
  if (
    !displayFeaturedBlogs ||
    selectedCategory ||
    paginationMetadata.currentPage !== 1
  ) {
    return 0;
  }
  return featuredBlogsCount ? Number.parseInt(featuredBlogsCount, 10) : 0;
}

function CategoryMessage({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <section
      className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
      role="status"
    >
      <h2 className="font-semibold text-lg">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
        {description}
      </p>
    </section>
  );
}
