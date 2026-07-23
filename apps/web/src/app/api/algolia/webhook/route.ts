import { env } from "@workspace/env/server";
import { sanityFetch } from "@workspace/sanity/live";
import { queryAllBlogDataForSearch } from "@workspace/sanity/query";
import { NextResponse } from "next/server";

import {
  type AlgoliaRecord,
  deleteRecords,
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

type WebhookBody = {
  _id?: string;
  _type?: string;
  operation?: "create" | "update" | "delete";
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = env.SANITY_REVALIDATE_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as WebhookBody;
    const { _id, operation } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Missing _id in webhook payload" },
        { status: 400 }
      );
    }

    // On delete, remove the record from Algolia
    if (operation === "delete") {
      await deleteRecords([_id]);
      return NextResponse.json({
        message: `Deleted ${_id} from Algolia index`,
      });
    }

    const data = await fetchSearchableBlogs();
    const post = data?.find((p) => p._id === _id);

    if (!post) {
      // Post may have been unpublished or hidden — remove from index
      await deleteRecords([_id]);
      return NextResponse.json({
        message: `Post ${_id} not found in published data, removed from index`,
      });
    }

    const record: AlgoliaRecord = {
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
    };

    await indexBlogPosts([record]);

    return NextResponse.json({
      message: `Indexed post ${_id}`,
      operation: operation ?? "update",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
