import "server-only";

import { createClient } from "@sanity/client";
import { Logger } from "@workspace/logger";
import { algoliasearch } from "algoliasearch";

import {
  formatBlogSlug,
  getBlogCategoryLabel,
  getPostCategories,
} from "@/lib/blog-categories";

const logger = new Logger("AlgoliaAdmin");

const APP_ID =
  process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY || "";
const INDEX_NAME =
  process.env.ALGOLIA_INDEX_NAME ||
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ||
  "turbo-start-sanity";

export function getAlgoliaAdminClient() {
  if (!APP_ID || !ADMIN_API_KEY) {
    throw new Error(
      "Missing Algolia admin configuration: ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY are required"
    );
  }
  return algoliasearch(APP_ID, ADMIN_API_KEY);
}

function getSanityClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_READ_TOKEN;

  if (!projectId || !dataset) {
    throw new Error(
      "Missing Sanity configuration: projectId and dataset are required"
    );
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    token,
    useCdn: false,
  });
}

export type AlgoliaBlogRecord = {
  objectID: string;
  _id: string;
  title: string;
  slug: string;
  description: string;
  publishedAt: string | null;
  publishedTimestamp: number;
  orderRank: string;
  category: string | null;
  categories: string[];
  categoryLabels: string[];
  authorName: string;
  authors: {
    _id?: string;
    name?: string;
    position?: string;
    image?: unknown;
  } | null;
  image: unknown;
};

type SanityBlogDoc = {
  _id: string;
  title?: string | null;
  slug?: { current?: string | null } | string | null;
  description?: string | null;
  publishedAt?: string | null;
  orderRank?: string | null;
  category?: string | null;
  categories?: (string | null)[] | null;
  authors?: {
    _id?: string;
    name?: string;
    position?: string;
    image?: unknown;
  } | null;
  image?: unknown;
};

// Map a raw Sanity blog document to Algolia record
export function mapSanityBlogToAlgoliaRecord(
  post: SanityBlogDoc
): AlgoliaBlogRecord {
  const categories = getPostCategories(post);
  const categoryLabels = categories
    .map((cat) => getBlogCategoryLabel(cat) ?? cat)
    .filter(Boolean);

  const rawSlug =
    typeof post.slug === "object" && post.slug !== null
      ? post.slug.current
      : post.slug;
  const slug = formatBlogSlug(rawSlug);

  return {
    objectID: post._id,
    _id: post._id,
    title: post.title || "",
    slug,
    description: post.description || "",
    publishedAt: post.publishedAt || null,
    publishedTimestamp: post.publishedAt
      ? new Date(post.publishedAt).getTime()
      : 0,
    orderRank: post.orderRank || "",
    category: post.category || null,
    categories,
    categoryLabels,
    authorName: post.authors?.name || "",
    authors: post.authors || null,
    image: post.image || null,
  };
}

export async function configureAlgoliaIndexSettings() {
  const client = getAlgoliaAdminClient();
  await client.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      searchableAttributes: [
        "unordered(title)",
        "unordered(description)",
        "unordered(categoryLabels)",
        "unordered(categories)",
        "unordered(authorName)",
      ],
      attributesForFaceting: ["filterOnly(categories)"],
      customRanking: ["desc(publishedTimestamp)"],
      ranking: [
        "typo",
        "words",
        "filters",
        "proximity",
        "attribute",
        "exact",
        "custom",
      ],
      attributesToHighlight: ["title", "description"],
      highlightPreTag: "<mark>",
      highlightPostTag: "</mark>",
    },
  });
  logger.info(`Updated index settings for ${INDEX_NAME}`);
}

export async function syncAllPublishedPostsToAlgolia() {
  const sanity = getSanityClient();
  const algolia = getAlgoliaAdminClient();

  logger.info("Fetching published blog posts from Sanity...");
  const posts =
    await sanity.fetch(`*[_type == "blog" && defined(slug.current) && !(_id in path("drafts.**")) && (seoHideFromLists != true)]{
    _id,
    title,
    slug,
    category,
    categories,
    publishedAt,
    description,
    orderRank,
    "authors": authors[0]->{ _id, name, position, image },
    "image": image { asset->{ _id, url } }
  }`);

  logger.info(`Found ${posts.length} published blog posts to index.`);

  const records = posts.map(mapSanityBlogToAlgoliaRecord);

  await configureAlgoliaIndexSettings();

  logger.info(
    `Syncing ${records.length} records to Algolia index '${INDEX_NAME}'...`
  );
  const result = await algolia.replaceAllObjects({
    indexName: INDEX_NAME,
    objects: records,
  });

  logger.info("Sync complete", { count: records.length });
  return { success: true, count: records.length, result };
}

export async function syncSinglePostToAlgolia(postId: string) {
  const sanity = getSanityClient();
  const algolia = getAlgoliaAdminClient();

  const cleanId = postId.replace(/^drafts\./, "");

  const post = await sanity.fetch(
    `*[_type == "blog" && _id == $id && defined(slug.current) && (seoHideFromLists != true)][0]{
      _id,
      title,
      slug,
      category,
      categories,
      publishedAt,
      description,
      orderRank,
      "authors": authors[0]->{ _id, name, position, image },
      "image": image { asset->{ _id, url } }
    }`,
    { id: cleanId }
  );

  if (!post) {
    logger.info(
      `Post ${cleanId} not found or unpublished. Deleting from Algolia...`
    );
    await algolia.deleteObject({
      indexName: INDEX_NAME,
      objectID: cleanId,
    });
    return { success: true, action: "deleted", id: cleanId };
  }

  const record = mapSanityBlogToAlgoliaRecord(post);
  await algolia.saveObjects({
    indexName: INDEX_NAME,
    objects: [record],
  });

  logger.info(`Upserted post ${cleanId} in Algolia index '${INDEX_NAME}'.`);
  return { success: true, action: "upserted", id: cleanId };
}

export async function deletePostFromAlgolia(postId: string) {
  const algolia = getAlgoliaAdminClient();
  const cleanId = postId.replace(/^drafts\./, "");

  await algolia.deleteObject({
    indexName: INDEX_NAME,
    objectID: cleanId,
  });

  logger.info(`Deleted post ${cleanId} from Algolia.`);
  return { success: true, action: "deleted", id: cleanId };
}
