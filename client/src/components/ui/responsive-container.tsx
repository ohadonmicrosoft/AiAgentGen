import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useActiveBreakpoint, useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { useFluidSpacing, fluidSpacingToClassName } from "@/hooks/use-fluid-spacing";
import { SpaceScaleKey } from "@/hooks/use-fluid-spacing";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
  fullWidth?: boolean;
  withTransition?: boolean;
  maxWidth?: 'text' | 'ui' | 'full' | number;
  padding?: SpaceScaleKey | { x?: SpaceScaleKey; y?: SpaceScaleKey };
  margin?: SpaceScaleKey | { x?: SpaceScaleKey; y?: SpaceScaleKey };
  deviceSpecific?: boolean;
}

/**
 * A container component that applies different styles based on screen size
 * Uses our fluid spacing system for consistent spacing across breakpoints
 */
export function ResponsiveContainer({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = '',
  fullWidth = false,
  withTransition = true,
  maxWidth,
  padding,
  margin,
  deviceSpecific = false,
}: ResponsiveContainerProps) {
  const [isClient, setIsClient] = useState(false);
  const activeBreakpoint = useActiveBreakpoint();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  // Get fluid spacing styles
  const { style: spacingStyle } = useFluidSpacing({
    maxWidth,
    padding,
    margin,
    deviceSpecific,
  });
  
  // Generate responsive classes based on current device
  const responsiveClasses = cn(
    className,
    isMobile && mobileClassName,
    isTablet && tabletClassName,
    !isMobile && !isTablet && desktopClassName,
    // Automatically apply fluid container classes if fullWidth is false
    !fullWidth && 'fluid-container',
    // Generate classes from fluid spacing options
    padding && fluidSpacingToClassName({ padding, deviceSpecific }),
    margin && fluidSpacingToClassName({ margin, deviceSpecific }),
  );
  
  // Prevent transition flickering on initial render
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const containerStyles = {
    ...(!fullWidth && !maxWidth ? {} : spacingStyle),
    ...(withTransition && isClient ? {
      transition: 'padding 0.3s ease, margin 0.3s ease, max-width 0.3s ease',
    } : {}),
  };
  
  return (
    <div className={responsiveClasses} style={containerStyles}>
      {children}
    </div>
  );
}

interface ScreenSizeOnlyProps {
  children: ReactNode;
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  className?: string;
}

/**
 * A component that conditionally renders its children based on screen size
 */
export function ScreenSizeOnly({
  children,
  mobile = false,
  tablet = false,
  desktop = false,
  className = '',
}: ScreenSizeOnlyProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = !isMobile && !isTablet;
  
  // Only render after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render anything on the server
  if (!mounted) return null;
  
  // Only render if current screen size matches the requested sizes
  if ((mobile && isMobile) || (tablet && isTablet) || (desktop && isDesktop)) {
    return <div className={className}>{children}</div>;
  }
  
  return null;
}

/**
 * A component that adds device-specific padding around its children
 */
export function DeviceAdaptiveContainer({
  children,
  className = '',
  horizontalPadding = 'md',
  verticalPadding,
}: {
  children: ReactNode;
  className?: string;
  horizontalPadding?: SpaceScaleKey;
  verticalPadding?: SpaceScaleKey;
}) {
  const { style } = useFluidSpacing({
    padding: {
      x: horizontalPadding,
      ...(verticalPadding ? { y: verticalPadding } : {})
    },
    deviceSpecific: true,
  });
  
  return (
    <div className={cn('w-full', className)} style={style}>
      {children}
    </div>
  );
}