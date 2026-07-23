import { SearchIcon } from "@sanity/icons";
import {
  Autocomplete,
  Box,
  Card,
  Flex,
  Spinner,
  Stack,
  Text,
} from "@sanity/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type NumberInputProps, set, unset } from "sanity";

type PokemonListItem = {
  name: string;
  url: string;
};

type PokemonOption = {
  value: string;
  label: string;
  id: number;
};

const POKEMON_LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=2000";
const POKEMON_ARTWORK_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

/** Module-level cache so the list persists across re-renders during a Studio session */
let cachedPokemonList: PokemonOption[] | null = null;

function extractIdFromUrl(url: string): number {
  const segments = url.replace(/\/$/, "").split("/");
  return Number(segments[segments.length - 1]);
}

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

async function fetchPokemonList(): Promise<PokemonOption[]> {
  if (cachedPokemonList) {
    return cachedPokemonList;
  }

  const response = await fetch(POKEMON_LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon list: ${response.statusText}`);
  }

  const data: { results: PokemonListItem[] } = await response.json();
  cachedPokemonList = data.results.map((pokemon) => {
    const id = extractIdFromUrl(pokemon.url);
    return {
      value: String(id),
      label: capitalize(pokemon.name),
      id,
    };
  });

  return cachedPokemonList;
}

export function PokemonInput(props: NumberInputProps) {
  const { onChange, value, readOnly } = props;
  const [options, setOptions] = useState<PokemonOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchPokemonList()
      .then((list) => {
        setOptions(list);
        setError(null);
      })
      .catch(() => {
        setError("Could not load Pokémon list. Please try again later.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const selectedOption = useMemo(() => {
    if (!value) {
      return undefined;
    }
    return options.find((opt) => opt.id === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!query) {
      return options;
    }
    const lower = query.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, query]);

  const handleQueryChange = useCallback((nextQuery: string | null) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setQuery(nextQuery ?? "");
    }, 300);
  }, []);

  const handleSelect = useCallback(
    (nextValue: string) => {
      const id = Number(nextValue);
      if (Number.isNaN(id)) {
        onChange(unset());
        return;
      }
      onChange(set(id));
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange(unset());
    setQuery("");
  }, [onChange]);

  if (error) {
    return (
      <Card padding={3} radius={2} tone="critical">
        <Text size={1}>{error}</Text>
      </Card>
    );
  }

  return (
    <Stack space={3}>
      {isLoading ? (
        <Flex align="center" gap={2} padding={3}>
          <Spinner muted />
          <Text muted size={1}>
            Loading Pokémon list…
          </Text>
        </Flex>
      ) : (
        <Autocomplete
          disabled={readOnly}
          filterOption={() => true}
          fontSize={2}
          icon={SearchIcon}
          id="pokemon-search"
          onQueryChange={handleQueryChange}
          onSelect={handleSelect}
          openButton
          options={filteredOptions}
          placeholder="Search Pokémon…"
          renderOption={(option) => (
            <Card as="button" padding={3}>
              <Flex align="center" gap={3}>
                <img
                  alt=""
                  height={40}
                  src={`${POKEMON_ARTWORK_URL}/${option.value}.png`}
                  style={{ objectFit: "contain" }}
                  width={40}
                />
                <Text size={2}>{option.label}</Text>
              </Flex>
            </Card>
          )}
          renderValue={() =>
            selectedOption ? selectedOption.label : ""
          }
          value={value ? String(value) : undefined}
        />
      )}

      {selectedOption && (
        <Card border padding={3} radius={2}>
          <Flex align="center" gap={3} justify="space-between">
            <Flex align="center" gap={3}>
              <img
                alt={selectedOption.label}
                height={64}
                src={`${POKEMON_ARTWORK_URL}/${selectedOption.id}.png`}
                style={{ objectFit: "contain" }}
                width={64}
              />
              <Box>
                <Text size={2} weight="semibold">
                  {selectedOption.label}
                </Text>
                <Text muted size={1}>
                  Pokédex #{selectedOption.id}
                </Text>
              </Box>
            </Flex>
            {!readOnly && (
              <button
                onClick={handleClear}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--card-muted-fg-color)",
                  fontSize: "0.8125rem",
                  textDecoration: "underline",
                }}
                type="button"
              >
                Clear
              </button>
            )}
          </Flex>
        </Card>
      )}
    </Stack>
  );
}
