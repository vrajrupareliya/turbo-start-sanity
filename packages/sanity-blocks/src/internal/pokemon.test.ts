import { describe, expect, it } from "vitest";

// Pokémon utility functions under test
function getPokemonArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function getPokemonSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function formatPokemonName(name?: string | null): string {
  if (!name) return "";
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPokemonId(id: number): string {
  return `#${id.toString().padStart(3, "0")}`;
}

function filterPokemonCatalog(
  catalog: readonly { id: number; name: string }[],
  query: string
) {
  const q = query.trim().toLowerCase();
  if (!q) return catalog;

  const numeric = parseInt(q.replace(/^#/, ""), 10);
  const hasNum = !Number.isNaN(numeric);

  return catalog.filter((entry) => {
    if (entry.name.toLowerCase().includes(q)) return true;
    if (hasNum && entry.id === numeric) return true;
    return entry.id.toString().includes(q);
  });
}

describe("Pokemon Helpers & Catalog Search", () => {
  describe("getPokemonArtworkUrl", () => {
    it("generates correct official-artwork URL for standard Pokémon", () => {
      expect(getPokemonArtworkUrl(25)).toBe(
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
      );
      expect(getPokemonArtworkUrl(1)).toBe(
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png"
      );
    });
  });

  describe("getPokemonSpriteUrl", () => {
    it("generates correct pixel sprite URL", () => {
      expect(getPokemonSpriteUrl(25)).toBe(
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
      );
    });
  });

  describe("formatPokemonName", () => {
    it("capitalizes single-word names", () => {
      expect(formatPokemonName("pikachu")).toBe("Pikachu");
      expect(formatPokemonName("charizard")).toBe("Charizard");
    });

    it("formats hyphenated names cleanly", () => {
      expect(formatPokemonName("mr-mime")).toBe("Mr Mime");
      expect(formatPokemonName("iron-valiant")).toBe("Iron Valiant");
    });

    it("handles empty or null/undefined gracefully", () => {
      expect(formatPokemonName("")).toBe("");
      expect(formatPokemonName(null)).toBe("");
      expect(formatPokemonName(undefined)).toBe("");
    });
  });

  describe("formatPokemonId", () => {
    it("pads single digit IDs with 2 zeros", () => {
      expect(formatPokemonId(1)).toBe("#001");
      expect(formatPokemonId(7)).toBe("#007");
    });

    it("pads double digit IDs with 1 zero", () => {
      expect(formatPokemonId(25)).toBe("#025");
      expect(formatPokemonId(94)).toBe("#094");
    });

    it("leaves triple digit and quadruple digit IDs unchanged with hash", () => {
      expect(formatPokemonId(150)).toBe("#150");
      expect(formatPokemonId(1025)).toBe("#1025");
    });
  });

  describe("filterPokemonCatalog", () => {
    const mockCatalog = [
      { id: 1, name: "bulbasaur" },
      { id: 2, name: "ivysaur" },
      { id: 3, name: "venusaur" },
      { id: 4, name: "charmander" },
      { id: 5, name: "charmeleon" },
      { id: 6, name: "charizard" },
      { id: 25, name: "pikachu" },
      { id: 26, name: "raichu" },
    ];

    it("returns entire catalog when query is empty", () => {
      expect(filterPokemonCatalog(mockCatalog, "")).toEqual(mockCatalog);
      expect(filterPokemonCatalog(mockCatalog, "   ")).toEqual(mockCatalog);
    });

    it("matches by partial name", () => {
      const results = filterPokemonCatalog(mockCatalog, "char");
      expect(results.map((r) => r.name)).toEqual([
        "charmander",
        "charmeleon",
        "charizard",
      ]);
    });

    it("matches by exact numeric ID", () => {
      const results = filterPokemonCatalog(mockCatalog, "25");
      expect(results.map((r) => r.name)).toEqual(["pikachu"]);
    });

    it("matches by # prefixed ID", () => {
      const results = filterPokemonCatalog(mockCatalog, "#6");
      expect(results.map((r) => r.name)).toEqual(["charizard"]);
    });

    it("returns empty array when no matches found", () => {
      const results = filterPokemonCatalog(mockCatalog, "nonexistent");
      expect(results).toEqual([]);
    });
  });
});
