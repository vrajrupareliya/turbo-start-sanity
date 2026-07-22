import { env } from "@workspace/env/client";
import { algoliasearch } from "algoliasearch";

import type { Blog } from "@/types";

export const ALGOLIA_INDEX_NAME = "tss-search";

const searchClient = algoliasearch(
  env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
);

export type AlgoliaSearchOptions = {
  categorySlug?: string | null;
  hitsPerPage?: number;
  signal?: AbortSignal;
};

export type AlgoliaBlogHit = Blog & {
  objectID: string;
  _highlightResult?: Record<
    string,
    {
      value: string;
      matchLevel: "none" | "partial" | "full";
      matchedWords: string[];
    }
  >;
};

export async function searchBlogs(
  query: string,
  { categorySlug, hitsPerPage = 10, signal }: AlgoliaSearchOptions = {}
): Promise<{ hits: AlgoliaBlogHit[]; nbHits: number }> {
  const filters = categorySlug ? `category.slug:${categorySlug}` : undefined;

  const result = await searchClient.searchSingleIndex<Blog>(
    {
      indexName: ALGOLIA_INDEX_NAME,
      searchParams: {
        query,
        filters,
        hitsPerPage,
        attributesToHighlight: ["title", "description"],
        highlightPreTag: "<mark>",
        highlightPostTag: "</mark>",
      },
    },
    signal ? ({ signal } as unknown as Parameters<typeof searchClient.searchSingleIndex>[1]) : undefined
  );

  return { hits: result.hits as AlgoliaBlogHit[], nbHits: result.nbHits ?? 0 };
}
