import { type LiteClient, liteClient } from "algoliasearch/lite";

export type AlgoliaBlogHit = {
  objectID: string;
  _id: string;
  title: string;
  slug: string;
  description: string;
  publishedAt: string | null;
  publishedTimestamp: number;
  orderRank?: string;
  category: string | null;
  categories: string[];
  categoryLabels?: string[];
  authorName?: string;
  authors?: {
    name?: string;
    image?: unknown;
  } | null;
  image?: unknown;
  _highlightResult?: {
    title?: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
    description?: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
  };
};

const APP_ID =
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || process.env.ALGOLIA_APP_ID || "";
const SEARCH_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || "";
export const DEFAULT_ALGOLIA_INDEX =
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ||
  process.env.ALGOLIA_INDEX_NAME ||
  "turbo-start-sanity";

// Only instantiate liteClient if both APP_ID and search API key are present
let clientInstance: LiteClient | null = null;

export function getAlgoliaSearchClient(): LiteClient | null {
  if (!clientInstance && APP_ID && SEARCH_API_KEY) {
    clientInstance = liteClient(APP_ID, SEARCH_API_KEY);
  }
  return clientInstance;
}
