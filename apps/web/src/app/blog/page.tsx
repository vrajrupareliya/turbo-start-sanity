import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
  sanityFetchMetadata,
} from "@workspace/sanity/live";
import {
  queryBlogCategories,
  queryBlogCategoryBlogsCount,
  queryBlogCategoryBlogsLatest,
  queryBlogCategoryBlogsOldest,
  queryBlogCategoryBlogsTitleAsc,
  queryBlogCategoryBySlug,
  queryBlogIndexPageBlogsCount,
  queryBlogIndexPageBlogsLatest,
  queryBlogIndexPageBlogsOldest,
  queryBlogIndexPageBlogsTitleAsc,
  queryBlogIndexPageData,
} from "@workspace/sanity/query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BlogHeader } from "@/components/blog-card";
import { BlogPageContent } from "@/components/blog-page-content";
import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { type SortOption, DEFAULT_SORT, isValidSortOption } from "@/lib/sort";
import { getSEOMetadata } from "@/lib/seo";
import type { Blog } from "@/types";
import {
  calculatePaginationMetadata,
  getBlogPaginationStartEnd,
  handleErrors,
} from "@/utils";

type BlogSearchParams = {
  category?: string | string[];
  page?: string | string[];
  sort?: string | string[];
};

type CategoryParam =
  | { error: "invalid"; slug: null }
  | { error: undefined; slug: string | null };

function parseCategoryParam(
  category: BlogSearchParams["category"]
): CategoryParam {
  if (Array.isArray(category)) {
    return { error: "invalid", slug: null };
  }

  const slug = category?.trim();
  return { error: undefined, slug: slug || null };
}

function parsePageParam(page: BlogSearchParams["page"]): number {
  if (Array.isArray(page) || !page) {
    return 1;
  }

  const parsed = Number(page);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseSortParam(sort: BlogSearchParams["sort"]): SortOption {
  if (Array.isArray(sort) || !sort) {
    return DEFAULT_SORT;
  }
  return isValidSortOption(sort) ? sort : DEFAULT_SORT;
}

async function fetchBlogIndexPageData({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogIndexPageData,
    perspective,
    stega,
  });
  return res.data;
}

async function fetchBlogCategories({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogCategories,
    perspective,
    stega,
  });
  return res.data;
}

async function fetchBlogCategoryBySlug({
  perspective,
  slug,
  stega,
}: DynamicFetchOptions & { slug: string }) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogCategoryBySlug,
    params: { slug },
    perspective,
    stega,
  });
  return res.data;
}

function getIndexBlogsQuery(sort: SortOption) {
  const queries = {
    latest: queryBlogIndexPageBlogsLatest,
    oldest: queryBlogIndexPageBlogsOldest,
    az: queryBlogIndexPageBlogsTitleAsc,
  } as const;
  return queries[sort];
}

function getCategoryBlogsQuery(sort: SortOption) {
  const queries = {
    latest: queryBlogCategoryBlogsLatest,
    oldest: queryBlogCategoryBlogsOldest,
    az: queryBlogCategoryBlogsTitleAsc,
  } as const;
  return queries[sort];
}

async function fetchSortedIndexBlogs({
  start,
  end,
  sort,
  perspective,
  stega,
}: { start: number; end: number; sort: SortOption } & DynamicFetchOptions): Promise<Blog[]> {
  "use cache";
  const res = await sanityFetch({
    query: getIndexBlogsQuery(sort),
    params: { start, end },
    perspective,
    stega,
  });
  return res.data as Blog[];
}

async function fetchSortedCategoryBlogs({
  categoryId,
  start,
  end,
  sort,
  perspective,
  stega,
}: {
  categoryId: string;
  start: number;
  end: number;
  sort: SortOption;
} & DynamicFetchOptions): Promise<Blog[]> {
  "use cache";
  const res = await sanityFetch({
    query: getCategoryBlogsQuery(sort),
    params: { categoryId, start, end },
    perspective,
    stega,
  });
  return res.data as Blog[];
}

async function fetchBlogIndexPageBlogsCount({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogIndexPageBlogsCount,
    perspective,
    stega,
  });
  return res.data;
}

async function fetchBlogCategoryBlogsCount({
  categoryId,
  perspective,
  stega,
}: { categoryId: string } & DynamicFetchOptions) {
  "use cache";
  const res = await sanityFetch({
    query: queryBlogCategoryBlogsCount,
    params: { categoryId },
    perspective,
    stega,
  });
  return res.data;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>;
}): Promise<Metadata> {
  const [{ slug, error }, { perspective }] = await Promise.all([
    searchParams.then((params) => parseCategoryParam(params.category)),
    getDynamicFetchOptions(),
  ]);

  const { data: indexPageData } = await sanityFetchMetadata({
    query: queryBlogIndexPageData,
    perspective,
  });

  if (!slug || error) {
    return getSEOMetadata({
      title: indexPageData?.title ?? indexPageData?.seoTitle,
      description: indexPageData?.description ?? indexPageData?.seoDescription,
      slug: "/blog",
      contentId: indexPageData?._id,
      contentType: indexPageData?._type,
    });
  }

  const { data: category } = await sanityFetchMetadata({
    query: queryBlogCategoryBySlug,
    params: { slug },
    perspective,
  });

  if (!category) {
    return getSEOMetadata({
      title: "Category not found",
      description: "The requested blog category could not be found.",
      slug: `/blog?category=${encodeURIComponent(slug)}`,
      seoNoIndex: true,
    });
  }

  return getSEOMetadata({
    title: `${category.title} Articles`,
    description:
      category.description ??
      `Browse all ${category.title} articles from Turbo Start.`,
    slug: `/blog?category=${encodeURIComponent(category.slug ?? slug)}`,
  });
}

export default function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>;
}) {
  return (
    <Suspense fallback={<BlogIndexFallback />}>
      <DynamicBlogIndex searchParams={searchParams} />
    </Suspense>
  );
}

async function DynamicBlogIndex({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>;
}) {
  const [
    { category: categoryParam, page: pageParam, sort: sortParam },
    { perspective, stega },
  ] = await Promise.all([searchParams, getDynamicFetchOptions()]);
  const { slug: categorySlug, error: categoryParamError } =
    parseCategoryParam(categoryParam);
  const currentPage = parsePageParam(pageParam);
  const selectedSort = parseSortParam(sortParam);

  const resources = await fetchBlogIndexResources({
    categorySlug,
    perspective,
    stega,
  });
  const [indexPageData, errIndexPageData] = resources.index;
  const [categories, errCategories] = resources.categories;
  const [totalPostCount, errTotalPostCount] = resources.totalPostCount;
  const [selectedCategory, errSelectedCategory] = resources.selectedCategory;

  if (errIndexPageData || !indexPageData) {
    notFound();
  }

  const safeCategories = categories ?? [];
  const safeTotalPostCount = totalPostCount ?? 0;
  const categoryError = getCategoryError({
    categoryParamError,
    categorySlug,
    errSelectedCategory,
    selectedCategory,
  });

  if (
    errTotalPostCount ||
    totalPostCount === null ||
    totalPostCount === undefined
  ) {
    return <BlogIndexError indexPageData={indexPageData} />;
  }

  if (categoryError) {
    return (
      <>
        <PageBuilderJsonLd pageBuilder={indexPageData.pageBuilder} />
        <BlogPageContent
          blogs={[]}
          categories={safeCategories}
          categoriesLoadFailed={Boolean(errCategories)}
          categoryError={categoryError}
          indexPageData={indexPageData}
          paginationMetadata={calculatePaginationMetadata(0, 1)}
          selectedSort={selectedSort}
          totalPostCount={safeTotalPostCount}
        />
      </>
    );
  }

  const listing = await fetchBlogListing({
    currentPage,
    indexPageData,
    perspective,
    selectedCategory,
    sort: selectedSort,
    stega,
    totalPostCount,
  });

  if (!listing) {
    return <BlogIndexError indexPageData={indexPageData} />;
  }

  return (
    <>
      <PageBuilderJsonLd pageBuilder={indexPageData.pageBuilder} />
      <BlogPageContent
        blogs={listing.blogs}
        categories={safeCategories}
        categoriesLoadFailed={Boolean(errCategories)}
        indexPageData={indexPageData}
        paginationMetadata={listing.paginationMetadata}
        selectedCategory={selectedCategory}
        selectedSort={selectedSort}
        totalPostCount={safeTotalPostCount}
      />
    </>
  );
}

async function fetchBlogIndexResources({
  categorySlug,
  perspective,
  stega,
}: DynamicFetchOptions & { categorySlug: string | null }) {
  const selectedCategory = categorySlug
    ? handleErrors(
        fetchBlogCategoryBySlug({ perspective, slug: categorySlug, stega })
      )
    : Promise.resolve([undefined, undefined] as const);

  const [index, categories, totalPostCount, category] = await Promise.all([
    handleErrors(fetchBlogIndexPageData({ perspective, stega })),
    handleErrors(fetchBlogCategories({ perspective, stega })),
    handleErrors(fetchBlogIndexPageBlogsCount({ perspective, stega })),
    selectedCategory,
  ]);
  return { index, categories, totalPostCount, selectedCategory: category };
}

function getCategoryError({
  categoryParamError,
  categorySlug,
  errSelectedCategory,
  selectedCategory,
}: {
  categoryParamError: CategoryParam["error"];
  categorySlug: string | null;
  errSelectedCategory?: string;
  selectedCategory?: Awaited<ReturnType<typeof fetchBlogCategoryBySlug>>;
}) {
  if (categoryParamError) {
    return "invalid" as const;
  }
  if (categorySlug && errSelectedCategory) {
    return "unavailable" as const;
  }
  if (categorySlug && !selectedCategory) {
    return "not-found" as const;
  }
}

async function fetchBlogListing({
  currentPage,
  indexPageData,
  perspective,
  selectedCategory,
  sort,
  stega,
  totalPostCount,
}: DynamicFetchOptions & {
  currentPage: number;
  indexPageData: NonNullable<
    Awaited<ReturnType<typeof fetchBlogIndexPageData>>
  >;
  selectedCategory?: Awaited<ReturnType<typeof fetchBlogCategoryBySlug>>;
  sort: SortOption;
  totalPostCount: number;

}) {
  const categoryId = selectedCategory?._id;
  const [filteredCount, errFilteredCount] = categoryId
    ? await handleErrors(
        fetchBlogCategoryBlogsCount({ categoryId, perspective, stega })
      )
    : [totalPostCount, undefined];

  if (
    errFilteredCount ||
    filteredCount === null ||
    filteredCount === undefined
  ) {
    return null;
  }

  const featuredBlogsCount = getFeaturedBlogsCount(
    indexPageData,
    categoryId,
    sort
  );
  const paginationMetadata = calculatePaginationMetadata(
    Math.max(0, filteredCount - featuredBlogsCount),
    currentPage
  );
  const { start, end } = getBlogPaginationStartEnd(currentPage);
  const [blogs, errBlogs] = await handleErrors(
    categoryId
      ? fetchSortedCategoryBlogs({
          categoryId,
          start,
          end,
          sort,
          perspective,
          stega,
        })
      : fetchSortedIndexBlogs({
          start: currentPage === 1 ? 0 : start + featuredBlogsCount,
          end: end + featuredBlogsCount,
          sort,
          perspective,
          stega,
        })
  );

  return errBlogs || !blogs ? null : { blogs, paginationMetadata };
}

function getFeaturedBlogsCount(
  indexPageData: NonNullable<
    Awaited<ReturnType<typeof fetchBlogIndexPageData>>
  >,
  categoryId?: string,
  sort: SortOption = DEFAULT_SORT
) {
  if (categoryId || sort !== DEFAULT_SORT || !indexPageData.displayFeaturedBlogs) {
    return 0;
  }
  return Number(indexPageData.featuredBlogsCount) || 0;
}

function BlogIndexError({
  indexPageData,
}: {
  indexPageData: NonNullable<
    Awaited<ReturnType<typeof fetchBlogIndexPageData>>
  >;
}) {
  return (
    <main className="container my-16">
      <BlogHeader
        description={indexPageData.description}
        title={indexPageData.title}
      />
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          Unable to load blog posts at the moment. Please try again shortly.
        </p>
      </div>
      {indexPageData.pageBuilder && indexPageData.pageBuilder.length > 0 && (
        <>
          <PageBuilderJsonLd pageBuilder={indexPageData.pageBuilder} />
          <PageBuilder
            id={indexPageData._id}
            pageBuilder={indexPageData.pageBuilder}
            type={indexPageData._type}
          />
        </>
      )}
    </main>
  );
}

function BlogIndexFallback() {
  return (
    <main className="container my-16" aria-busy="true">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <div className="mx-auto h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="mx-auto h-5 w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-12 h-20 animate-pulse rounded-2xl border bg-muted/40" />
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="space-y-4" key={`blog-loading-${index.toString()}`}>
            <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </main>
  );
}
