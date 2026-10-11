"use client";

import type { ReactNode } from "react";

import { BlogSearchTrigger } from "@/components/blog-search";

type BlogSearchLayoutProps = {
  categoryFilter: ReactNode;
  featured: ReactNode;
  list: ReactNode;
  initialCategories?: string[];
};

export function BlogSearchLayout({
  categoryFilter,
  featured,
  list,
  initialCategories,
}: Readonly<BlogSearchLayoutProps>) {
  return (
    <>
      {featured ? (
        <section aria-label="Featured posts" className="mt-10 grid gap-8">
          {featured}
        </section>
      ) : null}

      <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <aside className="h-max bg-grid-dots p-4 text-zinc-800 lg:sticky lg:top-24 lg:self-start dark:text-zinc-50">
          <div className="flex flex-col gap-6 bg-background p-4">
            <BlogSearchTrigger
              initialCategories={initialCategories}
              placeholder="Search articles…"
            />
            {categoryFilter}
          </div>
        </aside>

        <div className="grid content-start text-foreground">{list}</div>
      </div>
    </>
  );
}
