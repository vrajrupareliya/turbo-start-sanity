import { BLOG_CATEGORY_OPTIONS } from "@workspace/sanity-blocks/internal/blog-categories";
import { stegaClean } from "next-sanity";

export type BlogCategory = {
  label: string;
  value: string;
};

// Zero-width unicode characters and control marks injected by Stega or encoding
const ZERO_WIDTH_REGEX = /[\u200B-\u200F\u2060\uFEFF]/g;

/**
 * Strips Stega metadata, zero-width characters, and normalizes category values.
 */
export function cleanCategoryToken(value?: string | null): string {
  if (!value) {
    return "";
  }
  const cleaned = typeof value === "string" ? stegaClean(value) : String(value);
  return cleaned.replace(ZERO_WIDTH_REGEX, "").trim().toLowerCase();
}

// Sidebar filter options from the shared taxonomy (can't drift from the Studio
// schema). "All" uses an empty value to mean "no filter".
export const BLOG_CATEGORIES: BlogCategory[] = [
  { label: "All", value: "" },
  ...BLOG_CATEGORY_OPTIONS.map(({ title, value }) => ({
    label: title,
    value: cleanCategoryToken(value),
  })),
];

export function getBlogCategoryLabel(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const normalized = cleanCategoryToken(value);
  if (!normalized) {
    return null;
  }
  const match = BLOG_CATEGORIES.find(
    (category) => cleanCategoryToken(category.value) === normalized
  );
  if (match?.value) {
    return match.label;
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Extracts normalized, non-empty, unique category values from a blog post.
 * Handles both the modern `categories` array and legacy `category` single string.
 * Strips all Stega encoding and zero-width characters so categories are always deduplicated.
 */
export function getPostCategories(
  blog?: {
    categories?: (string | null)[] | null;
    category?: string | null;
  } | null
): string[] {
  if (!blog) {
    return [];
  }
  const rawList: (string | null | undefined)[] = [
    ...(blog.categories ?? []),
    blog.category,
  ];
  const unique = new Set<string>();
  for (const item of rawList) {
    const cleaned = cleanCategoryToken(item);
    if (cleaned) {
      unique.add(cleaned);
    }
  }
  return Array.from(unique);
}

/**
 * Ensures blog post href always has the /blog prefix.
 */
export function formatBlogSlug(slug?: string | null): string {
  if (!slug) {
    return "/blog";
  }
  const cleaned = cleanCategoryToken(slug) || slug;
  if (cleaned.startsWith("/blog/")) {
    return cleaned;
  }
  const stripped = cleaned.replace(/^\/+/, "");
  return `/blog/${stripped}`;
}
