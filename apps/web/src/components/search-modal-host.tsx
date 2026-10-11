"use client";

import dynamic from "next/dynamic";
import { useSearchModal } from "@/components/search-modal-context";

const DynamicBlogSearchModal = dynamic(
  () => import("@/components/blog-search-modal").then((m) => m.BlogSearchModal),
  { ssr: false }
);

export function SearchModalHost() {
  const { isOpen } = useSearchModal();
  if (!isOpen) {
    return null;
  }
  return <DynamicBlogSearchModal />;
}
