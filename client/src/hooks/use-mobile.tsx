import { useCallback, useEffect, useState } from "react";

// Breakpoints matching Tailwind's default breakpoints
export const breakpoints = {
  sm: 640, // Small devices (phones)
  md: 768, // Medium devices (tablets)
  lg: 1024, // Large devices (laptops)
  xl: 1280, // Extra large devices (desktops)
  "2xl": 1536, // Extra extra large devices
};

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook that returns whether the current viewport is smaller than the specified breakpoint
 *
 * @param breakpoint - The breakpoint to check against (sm, md, lg, xl, 2xl)
 * @returns boolean indicating if viewport is smaller than the breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint) {
  const [isSmaller, setIsSmaller] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  const checkBreakpoint = useCallback(() => {
    setIsSmaller(window.innerWidth < breakpoints[breakpoint]);
  }, [breakpoint]);

  useEffect(() => {
    setMounted(true);
    checkBreakpoint();

    const handleResize = () => {
      checkBreakpoint();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkBreakpoint]);

  // During SSR or first render, default to false to avoid layout shift
  if (!mounted) return false;

  return isSmaller;
}

/**
 * Hook that returns whether the current viewport is mobile-sized (< 1024px by default)
 *
 * @returns boolean indicating if viewport is mobile-sized
 */
export function useIsMobile() {
  return useBreakpoint("lg");
}

/**
 * Hook that returns whether the current viewport is tablet-sized (< 768px)
 *
 * @returns boolean indicating if viewport is tablet-sized
 */
export function useIsTablet() {
  return useBreakpoint("md");
}

/**
 * Hook that returns the current active breakpoint name
 *
 * @returns string representing the current breakpoint (xs, sm, md, lg, xl, 2xl)
 */
export function useActiveBreakpoint() {
  const [breakpoint, setBreakpoint] = useState("xs");
  const [mounted, setMounted] = useState(false);

  const updateBreakpoint = useCallback(() => {
    const width = window.innerWidth;
    if (width >= breakpoints["2xl"]) {
      setBreakpoint("2xl");
    } else if (width >= breakpoints.xl) {
      setBreakpoint("xl");
    } else if (width >= breakpoints.lg) {
      setBreakpoint("lg");
    } else if (width >= breakpoints.md) {
      setBreakpoint("md");
    } else if (width >= breakpoints.sm) {
      setBreakpoint("sm");
    } else {
      setBreakpoint("xs");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    updateBreakpoint();

    const handleResize = () => {
      updateBreakpoint();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateBreakpoint]);

  // During SSR or first render, default to 'xs' to avoid layout shift
  if (!mounted) return "xs";

  return breakpoint;
}
