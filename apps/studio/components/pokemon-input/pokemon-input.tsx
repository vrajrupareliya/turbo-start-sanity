import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui";
import { type VirtualItem, useVirtualizer } from "@tanstack/react-virtual";
import { AlertCircle, Check, RefreshCw, Search, Trash2, X } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { type ObjectInputProps, set, unset } from "sanity";

import {
  POKEMON_CATALOG,
  type PokemonCatalogEntry,
} from "@/utils/pokemon-catalog";

export type PokemonValue = {
  _type?: "pokemon";
  id?: number;
  name?: string;
};

export function formatPokemonName(name?: string | null): string {
  if (!name) return "";
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatPokemonId(id: number): string {
  return `#${id.toString().padStart(3, "0")}`;
}

export function getPokemonArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getPokemonSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

const CACHE_STORAGE_KEY = "turbo_start_sanity_pokemon_catalog";

function readCachedCatalog(): readonly PokemonCatalogEntry[] | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

async function fetchPokeApiCatalog(): Promise<PokemonCatalogEntry[]> {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1351");
  if (!res.ok) {
    throw new Error(`PokéAPI responded with status: ${res.status}`);
  }
  const data = await res.json();
  const list: PokemonCatalogEntry[] = (data.results ?? [])
    .map((p: { name: string; url: string }) => {
      const parts = p.url.split("/").filter(Boolean);
      const id = parseInt(parts[parts.length - 1] ?? "0", 10);
      return { id, name: p.name };
    })
    .filter((p: PokemonCatalogEntry) => p.id > 0)
    .sort((a: PokemonCatalogEntry, b: PokemonCatalogEntry) => a.id - b.id);

  if (list.length > 0 && typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore localStorage quota failures
    }
  }
  return list;
}

type PokemonOptionItemProps = {
  item: PokemonCatalogEntry;
  virtualRow: VirtualItem;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (item: PokemonCatalogEntry) => void;
};

function PokemonOptionItem({
  item,
  virtualRow,
  isSelected,
  isActive,
  onSelect,
}: Readonly<PokemonOptionItemProps>) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(item);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <button
        aria-selected={isSelected}
        className="w-full text-left"
        onClick={() => onSelect(item)}
        onKeyDown={handleKeyDown}
        role="option"
        style={{
          width: "100%",
          height: "100%",
          padding: 0,
          border: "none",
          background: "none",
          textAlign: "inherit",
          cursor: "pointer",
        }}
        tabIndex={0}
        type="button"
      >
        <Card
          paddingX={3}
          paddingY={1}
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isSelected
              ? "rgba(59, 130, 246, 0.15)"
              : isActive
                ? "rgba(0, 0, 0, 0.05)"
                : "transparent",
            transition: "background-color 75ms linear",
          }}
          tone={isSelected ? "primary" : isActive ? "transparent" : "default"}
        >
          <Flex align="center" gap={3}>
            <img
              alt={item.name}
              height={36}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.visibility = "hidden";
              }}
              src={getPokemonSpriteUrl(item.id)}
              style={{
                objectFit: "contain",
                imageRendering: "pixelated",
                flexShrink: 0,
              }}
              width={36}
            />

            <Flex align="baseline" gap={2}>
              <Badge fontSize={1} tone="default">
                {formatPokemonId(item.id)}
              </Badge>
              <Text size={1} weight={isSelected ? "bold" : "medium"}>
                {formatPokemonName(item.name)}
              </Text>
              <Text muted size={1}>
                ({item.name})
              </Text>
            </Flex>
          </Flex>

          {isSelected && (
            <Flex align="center" gap={1}>
              <Check color="currentColor" size={16} />
            </Flex>
          )}
        </Card>
      </button>
    </div>
  );
}

type PokemonSelectedCardProps = {
  value: PokemonValue;
  readOnly?: boolean;
  onOpenSearch: () => void;
  onClear: () => void;
};

function PokemonSelectedCard({
  value,
  readOnly,
  onOpenSearch,
  onClear,
}: Readonly<PokemonSelectedCardProps>) {
  const [imageError, setImageError] = useState(false);
  const id = value.id ?? 0;
  const name = value.name ?? "";

  return (
    <Card border padding={3} radius={2} tone="default">
      <Flex align="center" gap={3} justify="space-between">
        <Flex align="center" gap={3} style={{ minWidth: 0 }}>
          <Card
            border
            radius={2}
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              flexShrink: 0,
            }}
            tone="transparent"
          >
            {imageError ? (
              <img
                alt={name}
                onError={() => setImageError(true)}
                src={getPokemonSpriteUrl(id)}
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "contain",
                  imageRendering: "pixelated",
                }}
              />
            ) : (
              <img
                alt={name}
                onError={() => setImageError(true)}
                src={getPokemonArtworkUrl(id)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            )}
          </Card>

          <Box style={{ minWidth: 0 }}>
            <Flex align="center" gap={2}>
              <Text size={2} textOverflow="ellipsis" weight="bold">
                {formatPokemonName(name)}
              </Text>
              <Badge fontSize={1} padding={1} tone="primary">
                {formatPokemonId(id)}
              </Badge>
            </Flex>
            <Text muted size={1} style={{ marginTop: 4 }}>
              Canonical ID: <code>{name}</code>
            </Text>
          </Box>
        </Flex>

        {!readOnly && (
          <Flex align="center" gap={2}>
            <Button
              aria-label="Change Pokémon"
              fontSize={1}
              mode="ghost"
              onClick={onOpenSearch}
              text="Change"
              tone="default"
            />
            <Button
              aria-label="Remove Pokémon"
              fontSize={1}
              icon={Trash2}
              mode="ghost"
              onClick={onClear}
              tone="critical"
            />
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

export function PokemonInput(props: ObjectInputProps<PokemonValue>) {
  const { value, onChange, readOnly } = props;
  const listboxId = useId();

  const [catalog, setCatalog] =
    useState<readonly PokemonCatalogEntry[]>(POKEMON_CATALOG);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(!value?.id);
  const [activeIndex, setActiveIndex] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const cached = readCachedCatalog();
    if (cached) {
      setCatalog(cached);
      return;
    }

    setCatalogLoading(true);
    fetchPokeApiCatalog()
      .then((list) => {
        if (active && list.length > 0) {
          setCatalog(list);
        }
      })
      .catch(() => {
        // Keep bundled fallback
      })
      .finally(() => {
        if (active) {
          setCatalogLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return catalog;
    }

    const numeric = parseInt(q.replace(/^#/, ""), 10);
    const hasNum = !Number.isNaN(numeric);

    return catalog.filter((entry) => {
      if (entry.name.toLowerCase().includes(q)) return true;
      if (hasNum && entry.id === numeric) return true;
      return entry.id.toString().includes(q);
    });
  }, [catalog, searchQuery]);

  const virtualizer = useVirtualizer({
    count: filteredCatalog.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  const handleSelect = useCallback(
    (entry: PokemonCatalogEntry) => {
      if (readOnly) return;
      onChange(
        set({
          _type: "pokemon",
          id: entry.id,
          name: entry.name,
        })
      );
      setIsSearching(false);
      setSearchQuery("");
    },
    [onChange, readOnly]
  );

  const handleClear = useCallback(() => {
    if (readOnly) return;
    onChange(unset());
    setIsSearching(true);
    setSearchQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [onChange, readOnly]);

  const handleOpenSearch = useCallback(() => {
    setIsSearching(true);
    setSearchQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const len = filteredCatalog.length;
      if (len === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, len - 1);
        setActiveIndex(next);
        virtualizer.scrollToIndex(next, { align: "auto" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        setActiveIndex(prev);
        virtualizer.scrollToIndex(prev, { align: "auto" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCatalog[activeIndex];
        if (selected) {
          handleSelect(selected);
        }
      } else if (e.key === "Escape" && value?.id) {
        setIsSearching(false);
      }
    },
    [filteredCatalog, activeIndex, virtualizer, handleSelect, value]
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveIndex(0);
  }, []);

  return (
    <Stack gap={3}>
      {value?.id && value?.name && !isSearching ? (
        <PokemonSelectedCard
          onClear={handleClear}
          onOpenSearch={handleOpenSearch}
          readOnly={readOnly}
          value={value}
        />
      ) : null}

      {(isSearching || !value?.id) && (
        <Card border padding={2} radius={2}>
          <Stack gap={2}>
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <TextInput
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  aria-expanded="true"
                  autoComplete="off"
                  icon={Search}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search Pokémon by name or #ID (e.g. Pikachu, 25)..."
                  readOnly={readOnly}
                  ref={inputRef}
                  role="combobox"
                  value={searchQuery}
                />
              </Box>

              {searchQuery ? (
                <Button
                  aria-label="Clear search"
                  icon={X}
                  mode="bleed"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                  tone="default"
                />
              ) : null}

              {value?.id && !readOnly ? (
                <Button
                  mode="ghost"
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery("");
                  }}
                  text="Cancel"
                  tone="default"
                />
              ) : null}
            </Flex>

            <Flex align="center" justify="space-between" paddingX={1}>
              <Text muted size={1}>
                {catalogLoading ? (
                  <Flex align="center" gap={1}>
                    <RefreshCw className="animate-spin" size={12} />
                    <span>Syncing catalog...</span>
                  </Flex>
                ) : (
                  <span>
                    {filteredCatalog.length}{" "}
                    {filteredCatalog.length === 1 ? "result" : "results"}
                  </span>
                )}
              </Text>
              <Text muted size={1}>
                Use ↑↓ keys to navigate, Enter to select
              </Text>
            </Flex>

            <Box
              id={listboxId}
              ref={scrollContainerRef}
              role="listbox"
              style={{
                height: 260,
                overflowY: "auto",
                border: "1px solid var(--card-border-color, rgba(0,0,0,0.1))",
                borderRadius: 4,
                position: "relative",
              }}
            >
              {filteredCatalog.length === 0 ? (
                <Flex
                  align="center"
                  direction="column"
                  gap={2}
                  justify="center"
                  style={{ height: "100%", padding: 24 }}
                >
                  <AlertCircle opacity={0.4} size={24} />
                  <Text align="center" muted size={1}>
                    No Pokémon matching &ldquo;{searchQuery}&rdquo;
                  </Text>
                </Flex>
              ) : (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const item = filteredCatalog[virtualRow.index];
                    if (!item) return null;
                    return (
                      <PokemonOptionItem
                        isActive={activeIndex === virtualRow.index}
                        isSelected={value?.id === item.id}
                        item={item}
                        key={item.id}
                        onSelect={handleSelect}
                        virtualRow={virtualRow}
                      />
                    );
                  })}
                </div>
              )}
            </Box>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
