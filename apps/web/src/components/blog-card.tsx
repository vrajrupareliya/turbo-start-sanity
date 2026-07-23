import Link from "next/link";
import { Suspense } from "react";

import { PokemonSprite } from "@/components/pokemon-sprite";
import type { Blog } from "@/types";

type BlogCardProps = {
  blog: Blog;
};

function BlogMeta({ publishedAt }: { publishedAt: string | null }) {
  return (
    <div className="my-4 flex items-center gap-x-4 text-xs">
      <time className="text-muted-foreground" dateTime={publishedAt ?? ""}>
        {publishedAt
          ? new Date(publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : ""}
      </time>
    </div>
  );
}

function BlogContent({
  title,
  slug,
  description,
  isFeatured,
}: {
  title: string | null;
  slug: string | null;
  description: string | null;
  isFeatured?: boolean;
}) {
  const HeadingTag = isFeatured ? "h2" : "h3";
  const headingClasses = isFeatured
    ? "mt-3 text-3xl font-semibold leading-tight"
    : "mt-3 text-lg font-semibold leading-6";

  return (
    <div className="group relative">
      <HeadingTag className={headingClasses}>
        <Link href={slug ?? "#"}>
          <span className="absolute inset-0" />
          {title}
        </Link>
      </HeadingTag>
      <p className="mt-5 text-muted-foreground text-sm leading-6">
        {description}
      </p>
    </div>
  );
}

export function FeaturedBlogCard({ blog }: BlogCardProps) {
  const { title, publishedAt, slug, description, pokemonId } = blog ?? {};

  return (
    <article className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-muted/30 p-4 sm:aspect-2/1 lg:aspect-3/2">
        <Suspense
          fallback={
            <div className="h-full w-full animate-pulse rounded-2xl bg-muted" />
          }
        >
          <PokemonSprite
            alt={title ?? "Blog artwork"}
            className="h-full w-full object-contain p-4"
            height={400}
            pokemonId={pokemonId}
            width={400}
          />
        </Suspense>
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-gray-900/10 ring-inset" />
      </div>
      <div className="space-y-6">
        <BlogMeta publishedAt={publishedAt} />
        <BlogContent
          description={description}
          isFeatured
          slug={slug}
          title={title}
        />
      </div>
    </article>
  );
}

export function BlogCard({ blog }: BlogCardProps) {
  if (!blog) {
    return (
      <article className="grid w-full grid-cols-1 gap-4">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-6 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      </article>
    );
  }

  const { title, publishedAt, slug, description, pokemonId } = blog;

  return (
    <article className="grid w-full grid-cols-1 gap-4">
      <div className="relative flex aspect-video h-auto w-full items-center justify-center overflow-hidden rounded-2xl bg-muted/30 p-4">
        <Suspense
          fallback={
            <div className="h-full w-full animate-pulse rounded-2xl bg-muted" />
          }
        >
          <PokemonSprite
            alt={title ?? "Blog artwork"}
            className="h-full w-full object-contain p-2"
            height={300}
            pokemonId={pokemonId}
            width={300}
          />
        </Suspense>
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-gray-900/10 ring-inset" />
      </div>
      <div className="w-full space-y-4">
        <BlogMeta publishedAt={publishedAt} />
        <BlogContent description={description} slug={slug} title={title} />
      </div>
    </article>
  );
}

export function BlogHeader({
  title,
  description,
}: {
  title: string | null;
  description: string | null;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="font-bold text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-4 text-lg text-muted-foreground leading-8">
        {description}
      </p>
    </div>
  );
}
