"use client";

import { useEffect } from "react";

/**
 * Tracks the number of active scroll locks across the application.
 * Reference counting ensures that nested or concurrent locks (e.g. StrictMode,
 * fast transitions) do not prematurely restore styles before all locks are released.
 */
let lockCount = 0;
let originalOverflow: string | null = null;
let originalPaddingRight: string | null = null;
let originalScrollbarWidthProp: string | null = null;

/**
 * Calculates the width of the vertical scrollbar.
 * Returns 0 if there is no vertical scrollbar, if overlay scrollbars are used,
 * or during server-side rendering.
 */
function getScrollbarWidth(): number {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return 0;
  }
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

function restoreStyle(
  element: HTMLElement,
  property: string,
  originalValue: string | null
): void {
  if (originalValue === null) {
    return;
  }
  if (originalValue) {
    element.style.setProperty(property, originalValue);
  } else {
    element.style.removeProperty(property);
  }
}

function restoreOriginalStyles(): void {
  restoreStyle(document.body, "padding-right", originalPaddingRight);
  restoreStyle(document.body, "overflow", originalOverflow);
  restoreStyle(
    document.documentElement,
    "--scrollbar-width",
    originalScrollbarWidthProp
  );

  originalPaddingRight = null;
  originalOverflow = null;
  originalScrollbarWidthProp = null;
}

/**
 * Locks background scrolling on document.body and compensates for scrollbar width
 * to prevent layout shifts.
 */
export function lockScroll(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (lockCount === 0) {
    const scrollbarWidth = getScrollbarWidth();

    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;
    originalScrollbarWidthProp =
      document.documentElement.style.getPropertyValue("--scrollbar-width");

    if (scrollbarWidth > 0) {
      const computedPadding = window.getComputedStyle(
        document.body
      ).paddingRight;
      const currentPadding = parseFloat(computedPadding) || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${scrollbarWidth}px`
      );
    }

    document.body.style.overflow = "hidden";
  }

  lockCount++;
}

/**
 * Unlocks background scrolling on document.body and restores original styles
 * once all active locks have been released.
 */
export function unlockScroll(): void {
  if (typeof document === "undefined") {
    return;
  }

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    restoreOriginalStyles();
  }
}

/**
 * React hook to lock body scrolling while `enabled` is true.
 * Prevents layout shifts caused by scrollbar removal, cleans up correctly on unmount,
 * and maintains independent scrollability of nested containers.
 *
 * @param enabled Whether scroll locking is active (default: true)
 */
export function useScrollLock(enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [enabled]);
}
