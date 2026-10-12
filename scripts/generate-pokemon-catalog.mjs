import fs from "node:fs/promises";
import path from "node:path";

async function generate() {
  console.log("Fetching Pokémon catalog from PokéAPI...");
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1351");
  if (!res.ok) {
    throw new Error(`Failed to fetch PokéAPI: ${res.statusText}`);
  }
  const data = await res.json();
  
  // Format each pokemon: id (extracted from url) and name
  const catalog = data.results.map((p) => {
    const parts = p.url.split("/").filter(Boolean);
    const id = parseInt(parts[parts.length - 1], 10);
    return {
      id,
      name: p.name,
    };
  }).filter((p) => !Number.isNaN(p.id) && p.id > 0);

  // Sort by ID
  catalog.sort((a, b) => a.id - b.id);

  console.log(`Fetched ${catalog.length} Pokémon.`);

  const jsonContent = JSON.stringify(catalog);

  // Write to apps/studio/src or utils
  const studioDest = path.resolve("apps/studio/utils/pokemon-catalog.json");
  await fs.writeFile(studioDest, jsonContent, "utf8");
  console.log(`Written to ${studioDest}`);

  // Write to apps/web/src/lib
  const webDest = path.resolve("apps/web/src/lib/pokemon-catalog.json");
  await fs.writeFile(webDest, jsonContent, "utf8");
  console.log(`Written to ${webDest}`);
}

generate().catch((err) => {
  console.error("Error generating Pokémon catalog:", err);
  process.exit(1);
});
