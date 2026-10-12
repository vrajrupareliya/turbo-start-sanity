import fs from "node:fs/promises";
import path from "node:path";

async function run() {
  const jsonContent = await fs.readFile(path.resolve("apps/studio/utils/pokemon-catalog.json"), "utf8");
  const data = JSON.parse(jsonContent);

  const tsContent = `export type PokemonCatalogEntry = {
  id: number;
  name: string;
};

export const POKEMON_CATALOG: readonly PokemonCatalogEntry[] = ${JSON.stringify(data, null, 2)} as const;
`;

  await fs.writeFile(path.resolve("apps/studio/utils/pokemon-catalog.ts"), tsContent, "utf8");
  await fs.writeFile(path.resolve("apps/web/src/lib/pokemon-catalog.ts"), tsContent, "utf8");
  console.log("Generated pokemon-catalog.ts for studio and web.");
}

run().catch(console.error);
