"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type SearchModalContextType = {
  isOpen: boolean;
  initialCategories: string[];
  openSearch: (
    triggerEl?: HTMLElement | null,
    options?: { initialCategories?: string[] }
  ) => void;
  closeSearch: () => void;
  toggleSearch: () => void;
};

const SearchModalContext = createContext<SearchModalContextType | null>(null);

export function SearchModalProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialCategories, setInitialCategories] = useState<string[]>([]);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openSearch = useCallback(
    (
      triggerEl?: HTMLElement | null,
      options?: { initialCategories?: string[] }
    ) => {
      if (triggerEl) {
        triggerRef.current = triggerEl;
      } else if (
        typeof document !== "undefined" &&
        document.activeElement instanceof HTMLElement
      ) {
        triggerRef.current = document.activeElement;
      }

      setInitialCategories(options?.initialCategories || []);
      setIsOpen(true);
    },
    []
  );

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    // Restore focus to the trigger that opened the modal
    if (triggerRef.current && typeof triggerRef.current.focus === "function") {
      setTimeout(() => {
        triggerRef.current?.focus();
        triggerRef.current = null;
      }, 0);
    }
  }, []);

  const toggleSearch = useCallback(() => {
    if (isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [isOpen, closeSearch, openSearch]);

  // Global hotkey: Cmd+K on macOS, Ctrl+K on Windows/Linux
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch]);

  return (
    <SearchModalContext.Provider
      value={{
        isOpen,
        initialCategories,
        openSearch,
        closeSearch,
        toggleSearch,
      }}
    >
      {children}
    </SearchModalContext.Provider>
  );
}

export function useSearchModal() {
  const context = useContext(SearchModalContext);
  if (!context) {
    throw new Error("useSearchModal must be used within a SearchModalProvider");
  }
  return context;
}
