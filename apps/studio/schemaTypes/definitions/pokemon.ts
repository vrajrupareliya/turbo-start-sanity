import { Sparkles } from "lucide-react";
import { defineField, defineType } from "sanity";

import { PokemonInput } from "@/components/pokemon-input/pokemon-input";

export const pokemon = defineType({
  name: "pokemon",
  title: "Pokémon",
  type: "object",
  icon: Sparkles,
  components: {
    input: PokemonInput,
  },
  fields: [
    defineField({
      name: "id",
      title: "Pokémon ID",
      type: "number",
      description: "Stable PokéAPI national Pokédex ID",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      title: "Pokémon Name",
      type: "string",
      description: "Canonical Pokémon name from PokéAPI",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      id: "id",
      name: "name",
    },
    prepare: ({ id, name }) => ({
      title: name ? name.charAt(0).toUpperCase() + name.slice(1) : "No Pokémon",
      subtitle: id ? `#${id.toString().padStart(3, "0")}` : "",
    }),
  },
});
