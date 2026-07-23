import { env } from "@workspace/env/server";
import { sanityFetch } from "@workspace/sanity/live";
import { queryAllBlogDataForSearch } from "@workspace/sanity/query";
import { NextResponse } from "next/server";

import {
  type AlgoliaRecord,
  configureIndex,
  indexBlogPosts,
} from "@/lib/algolia-admin";

async function fetchSearchableBlogs() {
  "use cache";
  const { data } = await sanityFetch({
    query: queryAllBlogDataForSearch,
    perspective: "published",
    stega: false,
  });
  return data;
}

async function handleReindex(request: Request) {
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");
  const expectedToken = env.SANITY_REVALIDATE_SECRET;

  if (
    expectedToken &&
    authHeader !== `Bearer ${expectedToken}` &&
    secretParam !== expectedToken
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchSearchableBlogs();

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "No published blog posts found to index" },
        { status: 200 }
      );
    }

    // Configure index settings (idempotent)
    await configureIndex();

    const records: AlgoliaRecord[] = data.map((post) => ({
      objectID: post._id,
      _type: post._type,
      _id: post._id,
      title: post.title,
      description: post.description,
      slug: post.slug,
      publishedAt: post.publishedAt,
      publishedAtTimestamp: post.publishedAt
        ? new Date(post.publishedAt).getTime()
        : 0,
      orderRank: post.orderRank,
      pokemonId: post.pokemonId,
      category: post.category,
      authors: post.authors,
    }));

    await indexBlogPosts(records);

    return NextResponse.json({
      success: true,
      index: env.ALGOLIA_INDEX_NAME,
      message: `Successfully indexed ${records.length} published blog post(s) into Algolia index '${env.ALGOLIA_INDEX_NAME}'`,
      count: records.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handleReindex(request);
}

export async function GET(request: Request) {
  return handleReindex(request);
}
