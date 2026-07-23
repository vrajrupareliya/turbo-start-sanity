import "server-only";

import { env } from "@workspace/env/server";
import { algoliasearch } from "algoliasearch";

const adminClient = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_ADMIN_API_KEY);

const INDEX_NAME = env.ALGOLIA_INDEX_NAME;

/**
 * Configure the Algolia index with production-quality settings.
 *
 * - searchableAttributes: ordered list so title matches rank above description
 * - attributesForFaceting: filterOnly avoids facet count overhead
 * - typoTolerance: forgives typos in words ≥ 4 chars
 * - customRanking: recent posts rank higher among equal relevance
 * - queryType: prefixLast — "rea" matches "React" on the last word only
 * - highlightPreTag/Post: standard <mark> for rendering matched text
 */
export async function configureIndex() {
  await adminClient.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      searchableAttributes: [
        "title",
        "description",
        "category.title",
        "authors.name",
      ],
      attributesForFaceting: ["filterOnly(category.slug)"],
      customRanking: ["desc(publishedAtTimestamp)"],
      queryType: "prefixLast",
      typoTolerance: true,
      minWordSizefor1Typo: 4,
      minWordSizefor2Typos: 8,
      highlightPreTag: "<mark>",
      highlightPostTag: "</mark>",
      attributesToHighlight: ["title", "description"],
      hitsPerPage: 10,
    },
  });
}

export type AlgoliaRecord = {
  objectID: string;
  _type: string;
  _id: string;
  title: string | null;
  description: string | null;
  slug: string | null;
  publishedAt: string | null;
  publishedAtTimestamp: number;
  orderRank: string | null;
  pokemonId: number | null;
  category: {
    _id: string;
    title: string | null;
    slug: string | null;
    color: string | null;
    icon: string | null;
  } | null;
  authors: {
    _id: string;
    name: string | null;
    position: string | null;
    image: Record<string, unknown> | null;
  } | null;
};

export async function indexBlogPosts(records: AlgoliaRecord[]) {
  if (records.length === 0) {
    return [];
  }
  return adminClient.saveObjects({
    indexName: INDEX_NAME,
    objects: records,
  });
}

export async function deleteRecords(objectIDs: string[]) {
  if (objectIDs.length === 0) {
    return;
  }
  await adminClient.deleteObjects({
    indexName: INDEX_NAME,
    objectIDs,
  });
}
