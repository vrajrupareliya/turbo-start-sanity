"use client";

import { cn } from "@workspace/tailwind-config/utils";
import Image from "next/image";
import { useState } from "react";

import {
  formatPokemonName,
  getPokemonArtworkUrl,
  getPokemonSpriteUrl,
} from "@/lib/pokemon";

export type PokemonArtworkProps = {
  id: number;
  name: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  showBadge?: boolean;
};

export function PokemonArtwork({
  id,
  name,
  className,
  containerClassName,
  priority = false,
  sizes = "(min-width: 1440px) 700px, (min-width: 1024px) 50vw, 100vw",
}: Readonly<PokemonArtworkProps>) {
  const [useFallbackSprite, setUseFallbackSprite] = useState(false);
  const [hasError, setHasError] = useState(false);

  const formattedName = formatPokemonName(name);
  const artworkUrl = useFallbackSprite
    ? getPokemonSpriteUrl(id)
    : getPokemonArtworkUrl(id);

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden bg-zinc-950/40 p-6 select-none",
        containerClassName
      )}
    >
      {/* Subtle grid background for aesthetic alignment with the design system */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent"
      />

      {hasError ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <svg
            aria-hidden="true"
            className="size-16 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <path d="M12 2a10 10 0 0 0 0 20M2 12h20" strokeWidth="1.5" />
            <circle cx="12" cy="12" fill="currentColor" r="3" />
          </svg>
        </div>
      ) : (
        <div className="relative size-full flex items-center justify-center">
          <Image
            alt={`Pokémon artwork of ${formattedName}`}
            className={cn(
              "object-contain transition-transform duration-300 ease-out group-hover:scale-105",
              useFallbackSprite && "pixelated [image-rendering:pixelated]",
              className
            )}
            fill
            onError={() => {
              if (!useFallbackSprite) {
                // Try sprite if official-artwork fails
                setUseFallbackSprite(true);
              } else {
                // If sprite also fails, trigger error state
                setHasError(true);
              }
            }}
            priority={priority}
            sizes={sizes}
            src={artworkUrl}
            unoptimized={useFallbackSprite} // Sprites are tiny pixel gifs/pngs
          />
        </div>
      )}
    </div>
  );
}
