import { createClient } from "@sanity/client";
import { algoliasearch } from "algoliasearch";
import dotenv from "dotenv";

dotenv.config();

const appId =
  process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const adminApiKey = process.env.ALGOLIA_ADMIN_API_KEY;
const indexName = process.env.ALGOLIA_INDEX_NAME || "turbo-start-sanity";

if (!appId || !adminApiKey) {
  console.error("Missing Algolia credentials:", {
    appId: Boolean(appId),
    adminApiKey: Boolean(adminApiKey),
  });
  process.exit(1);
}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

const algoliaClient = algoliasearch(appId, adminApiKey);

function cleanToken(val) {
  if (!val) return "";
  return String(val)
    .replace(/[\u200B-\u200F\u2060\uFEFF]/g, "")
    .trim()
    .toLowerCase();
}

function getCategories(post) {
  const rawList = [...(post.categories ?? []), post.category];
  const set = new Set();
  for (const item of rawList) {
    const c = cleanToken(item);
    if (c) set.add(c);
  }
  return Array.from(set);
}

function formatBlogSlug(slug) {
  if (!slug) return "/blog";
  const str = typeof slug === "string" ? slug : slug.current || "";
  const cleaned = cleanToken(str) || str;
  if (cleaned.startsWith("/blog/")) return cleaned;
  return `/blog/${cleaned.replace(/^\/+/, "")}`;
}

async function sync() {
  console.log("Fetching published blog posts from Sanity...");
  const posts =
    await sanityClient.fetch(`*[_type == "blog" && defined(slug.current) && !(_id in path("drafts.**")) && (seoHideFromLists != true)]{
    _id,
    title,
    slug,
    category,
    categories,
    publishedAt,
    description,
    orderRank,
    "authors": authors[0]->{ name, image },
    "image": image { asset->{ _id, url } }
  }`);

  console.log(`Found ${posts.length} published posts in Sanity.`);

  const records = posts.map((post) => {
    const categories = getCategories(post);
    return {
      objectID: post._id,
      _id: post._id,
      title: post.title || "",
      slug: formatBlogSlug(post.slug),
      description: post.description || "",
      publishedAt: post.publishedAt || null,
      publishedTimestamp: post.publishedAt
        ? new Date(post.publishedAt).getTime()
        : 0,
      orderRank: post.orderRank || "",
      category: post.category || null,
      categories,
      authorName: post.authors?.name || "",
      authors: post.authors || null,
      image: post.image || null,
    };
  });

  console.log("Configuring Algolia index settings...");
  await algoliaClient.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: [
        "unordered(title)",
        "unordered(description)",
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

  console.log(`Replacing all objects in Algolia index '${indexName}'...`);
  const result = await algoliaClient.replaceAllObjects({
    indexName,
    objects: records,
  });

  console.log("Sync complete! Algolia result:", result);
}

sync().catch(console.error);
