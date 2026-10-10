import { BlogCard } from "@/components/blog-card";
import type { Blog } from "@/types";

export type BlogListProps = {
  blogs: Blog[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

export function BlogList({
  blogs,
  hasActiveFilters,
  onClearFilters,
}: Readonly<BlogListProps>) {
  if (blogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 border border-border p-12 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          {hasActiveFilters
            ? "No blog posts found matching all selected categories."
            : "No blog posts available at the moment."}
        </p>
        {hasActiveFilters && onClearFilters ? (
          <button
            className="focus-ring inline-flex items-center rounded-none border border-foreground px-4 py-2 font-mono text-xs uppercase tracking-wide transition-transform duration-150 ease-out hover:bg-foreground hover:text-background active:scale-[0.97]"
            onClick={onClearFilters}
            type="button"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {blogs.map((blog) => (
        <BlogCard blog={blog} key={blog._id} />
      ))}
    </div>
  );
}
