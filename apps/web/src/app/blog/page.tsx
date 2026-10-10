import { getDynamicFetchOptions } from "@workspace/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import type { SortOrder } from "@/components/blog-filter-toolbar";
import { BlogPageContent } from "@/components/blog-page-content";
import { PageBuilderJsonLd } from "@/components/page-builder-json-ld";
import { PageBuilder } from "@/components/pagebuilder";
import { cleanCategoryToken } from "@/lib/blog-categories";
import { type BlogIndexPageData, fetchBlogIndexPage } from "@/lib/blog-index";
import { seoFromDocument } from "@/lib/seo";

type BlogPageProps = Readonly<{
  searchParams: Promise<{
    page?: string;
    category?: string;
    categories?: string;
    sort?: string;
  }>;
}>;

export async function generateMetadata({
  searchParams: _,
}: BlogPageProps): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();

  const data = await fetchBlogIndexPage({
    perspective,
    stega: false,
  });
  // No index document is a 404, matching the view's behavior.
  if (!data) {
    notFound();
  }

  return seoFromDocument(data, { slug: "/blog" });
}

export default function BlogIndexPage({ searchParams }: BlogPageProps) {
  return (
    <Suspense fallback={<BlogIndexShell />}>
      <BlogIndexView searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * The static shell: real published page content.
 */
async function BlogIndexShell() {
  const data = await fetchBlogIndexPage({
    perspective: "published",
    stega: false,
  });

  if (!data) {
    return null;
  }

  return (
    <BlogIndexBody
      data={data}
      initialCategories={[]}
      initialPage={1}
      initialSort="newest"
    />
  );
}

async function BlogIndexView({ searchParams }: BlogPageProps) {
  const [params, { perspective, stega }] = await Promise.all([
    searchParams,
    getDynamicFetchOptions(),
  ]);

  const data = await fetchBlogIndexPage({
    perspective,
    stega,
  });
  if (!data) {
    notFound();
  }

  // Parse initial state from searchParams
  const rawCategories = params.categories || params.category;
  const initialCategories = rawCategories
    ? rawCategories.split(",").map(cleanCategoryToken).filter(Boolean)
    : [];

  const rawSort = params.sort?.toLowerCase();
  const initialSort: SortOrder =
    rawSort === "oldest"
      ? "oldest"
      : rawSort === "a-z" || rawSort === "az" || rawSort === "title"
        ? "a-z"
        : "newest";

  const rawPage = Number(params.page);
  const initialPage = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <BlogIndexBody
      data={data}
      initialCategories={initialCategories}
      initialPage={initialPage}
      initialSort={initialSort}
    />
  );
}

function BlogIndexBody({
  data,
  initialCategories = [],
  initialSort = "newest",
  initialPage = 1,
}: Readonly<{
  data: BlogIndexPageData;
  initialCategories?: string[];
  initialSort?: SortOrder;
  initialPage?: number;
}>) {
  return (
    <>
      <PageBuilderJsonLd pageBuilder={data.pageBuilder} />
      <BlogPageContent
        blogs={data.blogs}
        featuredBlogs={data.featuredBlogs}
        indexPageData={data}
        initialCategories={initialCategories}
        initialPage={initialPage}
        initialSort={initialSort}
      >
        {data.pageBuilder && data.pageBuilder.length > 0 ? (
          <div className="pb-16">
            <PageBuilder
              id={data._id}
              pageBuilder={data.pageBuilder}
              type={data._type}
            />
          </div>
        ) : null}
      </BlogPageContent>
    </>
  );
}
