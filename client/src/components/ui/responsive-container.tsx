import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useActiveBreakpoint } from "@/hooks/use-mobile";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
  fullWidth?: boolean;
  withTransition?: boolean;
}

/**
 * A responsive container component that applies different styles based on screen size
 * and transitions smoothly between them
 */
export function ResponsiveContainer({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
  fullWidth = false,
  withTransition = true
}: ResponsiveContainerProps) {
  const breakpoint = useActiveBreakpoint();
  const [mounted, setMounted] = useState(false);
  
  // Used for the initial render to prevent transition flickering
  useEffect(() => {
    setMounted(true);
  }, []);

  const getBreakpointClassName = () => {
    if (breakpoint === "xs" || breakpoint === "sm") {
      return mobileClassName || "";
    } else if (breakpoint === "md") {
      return tabletClassName || "";
    } else {
      return desktopClassName || "";
    }
  };

  return (
    <div
      className={cn(
        "w-full mx-auto",
        fullWidth ? "" : "container px-4 md:px-6",
        withTransition ? "transition-all duration-300 ease-in-out" : "",
        !mounted && withTransition ? "duration-0" : "",
        getBreakpointClassName(),
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A component that only renders on specific screen sizes
 */
export function ScreenSizeOnly({
  children,
  showOnMobile = false,
  showOnTablet = false,
  showOnDesktop = false
}: {
  children: ReactNode;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}) {
  const breakpoint = useActiveBreakpoint();
  
  // Don't render anything during SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const isTablet = breakpoint === "md";
  const isDesktop = breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl";
  
  if (
    (showOnMobile && isMobile) ||
    (showOnTablet && isTablet) ||
    (showOnDesktop && isDesktop)
  ) {
    return <>{children}</>;
  }
  
  return null;
}