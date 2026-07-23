import Image from "next/image";

const POKEMON_API_URL = "https://pokeapi.co/api/v2/pokemon";

type PokemonSpriteProps = {
  pokemonId: number | null | undefined;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
};

type PokeApiResponse = {
  sprites?: {
    other?: {
      "official-artwork"?: {
        front_default?: string | null;
      };
    };
    front_default?: string | null;
  };
};

async function getPokemonArtworkUrl(
  pokemonId: number
): Promise<string | null> {
  try {
    const response = await fetch(`${POKEMON_API_URL}/${pokemonId}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return null;
    }

    const data: PokeApiResponse = await response.json();
    return (
      data.sprites?.other?.["official-artwork"]?.front_default ??
      data.sprites?.front_default ??
      null
    );
  } catch {
    return null;
  }
}

function FallbackArtwork({
  className,
  width,
  height,
}: {
  className?: string;
  width: number;
  height: number;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-muted/40 ${className ?? ""}`}
      style={{ minHeight: height, maxWidth: width }}
    >
      <svg
        className="h-12 w-12 text-muted-foreground/40"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <title>Artwork fallback placeholder</title>
        <path
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}

export async function PokemonSprite({
  pokemonId,
  className,
  width = 400,
  height = 400,
  alt = "Pokémon artwork",
}: PokemonSpriteProps) {
  if (!pokemonId || typeof pokemonId !== "number" || pokemonId <= 0) {
    return (
      <FallbackArtwork className={className} height={height} width={width} />
    );
  }

  const artworkUrl = await getPokemonArtworkUrl(pokemonId);

  if (!artworkUrl) {
    return (
      <FallbackArtwork className={className} height={height} width={width} />
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      src={artworkUrl}
      width={width}
    />
  );
}
