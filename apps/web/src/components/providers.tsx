"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";

import { SearchModalHost } from "@/components/search-modal-host";
import { SearchModalProvider } from "@/components/search-modal-context";

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableColorScheme
        enableSystem
      >
        <SearchModalProvider>
          {children}
          <SearchModalHost />
        </SearchModalProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
