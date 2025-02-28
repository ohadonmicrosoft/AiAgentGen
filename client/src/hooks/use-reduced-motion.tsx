import { useEffect, useState } from "react";

/**
 * Hook that detects if the user has requested reduced motion
 * This can be used to disable or modify animations for users who have
 * enabled the "reduced motion" accessibility setting in their OS
 *
 * @returns {boolean} - true if the user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  // Default to false (animations enabled) if we can't detect media query support
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if the browser supports matchMedia and the prefers-reduced-motion media query
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    if (!mediaQuery) {
      return;
    }

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Update value when the preference changes
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add event listener for preference changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    } else {
      // Older browser support
      mediaQuery.addListener(onChange);
      return () => mediaQuery.removeListener(onChange);
    }
  }, []);

  return prefersReducedMotion;
}
