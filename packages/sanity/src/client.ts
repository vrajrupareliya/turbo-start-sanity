import { createClient } from "next-sanity";

import { DEFAULT_SANITY_API_VERSION } from "@workspace/env/constants";
import type { SanityImageSource } from "@sanity/asset-utils";
import { createImageUrlBuilder } from "@sanity/image-url";
import { env } from "@workspace/env/client";

export const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION || DEFAULT_SANITY_API_VERSION,
  useCdn: env.NODE_ENV === "production",
  perspective: "published",
  stega: {
    studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    enabled: env.NODE_ENV === "development",
    filter: (props) => {
      const last = props.sourcePath.at(-1);
      if (
        last === "category" ||
        last === "categories" ||
        props.sourcePath.includes("categories")
      ) {
        return false;
      }
      return props.filterDefault(props);
    },
  },
});

const imageBuilder = createImageUrlBuilder({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
});

export const urlFor = (source: SanityImageSource) =>
  imageBuilder.image(source).auto("format").quality(80).format("webp");
