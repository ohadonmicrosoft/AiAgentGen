import { useReducedMotion } from "@/hooks/animations/useReducedMotion";
import { useFluidSpacing } from "@/hooks/use-fluid-spacing";
import { useHaptic } from "@/hooks/use-haptic";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

interface BottomNavigationProps {
  /**
   * Navigation items to display
   */
  items: NavItem[];

  /**
   * Additional class name for the container
   */
  className?: string;

  /**
   * Whether to show labels for the navigation items
   * @default true
   */
  showLabels?: boolean;

  /**
   * Whether to show the active indicator
   * @default true
   */
  showActiveIndicator?: boolean;

  /**
   * Whether to animate the navigation items
   * @default true
   */
  animated?: boolean;

  /**
   * Whether to use a glass effect for the navigation bar
   * @default false
   */
  useGlassEffect?: boolean;

  /**
   * Whether to enable haptic feedback on navigation
   * @default true
   */
  enableHaptic?: boolean;

  /**
   * Callback when an item is selected
   */
  onItemSelect?: (item: NavItem) => void;
}

/**
 * A bottom navigation component for mobile devices that provides easy access to key app features.
 * It's designed to be fixed at the bottom of the screen and provide large touch targets.
 */
export function BottomNavigation({
  items,
  className,
  showLabels = true,
  showActiveIndicator = true,
  animated = true,
  useGlassEffect = false,
  enableHaptic = true,
  onItemSelect,
}: BottomNavigationProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { success: triggerSuccessFeedback } = useHaptic();
  const { light: _triggerLightFeedback } = useHaptic();
  const shouldReduceMotion = useReducedMotion();
  const { getDeviceSpacing } = useFluidSpacing();

  // Only animate if animations are enabled and reduced motion is not preferred
  const shouldAnimate = animated && !shouldReduceMotion;

  // Get appropriate spacing based on device
  const itemPadding = getDeviceSpacing({
    mobile: "xs",
    tablet: "sm",
    desktop: "md",
  });

  // Don't render on non-mobile/tablet devices
  if (!isMobile && !isTablet) return null;

  // Handle item click with haptic feedback
  const handleItemClick = React.useCallback(
    (item: NavItem, e: React.MouseEvent) => {
      if (item.path === pathname) {
        // Prevent navigation if already on the page
        e.preventDefault();
        return;
      }

      // Trigger haptic feedback if enabled
      if (enableHaptic) {
        triggerSuccessFeedback();
      }

      // Call onItemSelect callback if provided
      if (onItemSelect) {
        onItemSelect(item);
      }
    },
    [pathname, enableHaptic, triggerSuccessFeedback, onItemSelect],
  );

  return (
    <AnimatePresence>
      <motion.nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background border-t",
          "flex items-center justify-around h-16 px-2",
          useGlassEffect && "bg-background/80 backdrop-blur-md",
          "touch-action-none", // Prevent scroll interference
          className,
        )}
        aria-label="Mobile navigation"
        initial={shouldAnimate ? { y: 100 } : undefined}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3,
        }}
      >
        {items.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => handleItemClick(item, e)}
              className={cn(
                "flex flex-col items-center justify-center",
                "relative py-1 px-1",
                "min-w-[64px] h-full",
                "transition-colors duration-200",
                "active:scale-95", // Touch feedback
                "touch-manipulation", // Optimize for touch
                isActive ? "text-primary" : "text-muted-foreground",
                `p-[${itemPadding}]`,
              )}
            >
              {showActiveIndicator && isActive && (
                <motion.div
                  className={cn(
                    "absolute top-0 left-1/2 h-0.5 bg-primary rounded-full",
                    "transform -translate-x-1/2",
                  )}
                  layoutId={shouldAnimate ? "bottomNavIndicator" : undefined}
                  initial={shouldAnimate ? { width: 0 } : { width: "50%" }}
                  animate={{ width: "50%" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative">
                {/* Icon with animation */}
                <motion.div
                  className="flex items-center justify-center h-6"
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    duration: 0.2,
                  }}
                >
                  {item.icon}
                </motion.div>

                {/* Label with animation */}
                {showLabels && (
                  <motion.span
                    className={cn(
                      "mt-1 text-xs font-medium block text-center",
                      isActive && "font-semibold",
                    )}
                    animate={{
                      opacity: isActive ? 1 : 0.8,
                      scale: isActive ? 1 : 0.95,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>

              {/* Touch feedback indicator */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-primary/5 rounded-md"
                  layoutId={shouldAnimate ? "activeItemBackground" : undefined}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          );
        })}
      </motion.nav>
    </AnimatePresence>
  );
}

/**
 * A component that adds padding to the bottom of the page to account for the bottom navigation bar on mobile.
 */
export function BottomNavigationSpacer() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (!isMobile && !isTablet) return null;

  return <div className="h-16" aria-hidden="true" />;
}

/**
 * A specialized tab bar that provides enhanced touch interactions for mobile applications.
 * Similar to BottomNavigation but designed for in-page tabbed content rather than navigation.
 */
export function TouchTabBar({
  items,
  activeTab,
  onChange,
  className,
  enableHaptic = true,
}: {
  items: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  enableHaptic?: boolean;
}) {
  const { triggerLightFeedback } = useHaptic();
  const shouldReduceMotion = useReducedMotion();

  const handleTabChange = React.useCallback(
    (id: string) => {
      if (id === activeTab) return;

      if (enableHaptic) {
        triggerLightFeedback();
      }

      onChange(id);
    },
    [activeTab, enableHaptic, onChange, triggerLightFeedback],
  );

  return (
    <div
      className={cn(
        "flex items-center justify-around",
        "bg-muted/30 rounded-full p-1",
        "touch-manipulation",
        className,
      )}
      role="tablist"
      aria-orientation="horizontal"
    >
      {items.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`${item.id}-panel`}
            id={`${item.id}-tab`}
            className={cn(
              "flex items-center justify-center px-4 py-2",
              "relative rounded-full text-sm font-medium",
              "transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "min-h-[40px] min-w-[80px]",
              "active:scale-95", // Touch feedback
            )}
            onClick={() => handleTabChange(item.id)}
          >
            {/* Background pill for active tab */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-background rounded-full shadow-sm"
                layoutId={
                  shouldReduceMotion ? undefined : "activeTabBackground"
                }
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            {/* Content with icon and label */}
            <motion.div
              className="flex items-center justify-center gap-2 z-10"
              animate={{ scale: isActive ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {item.icon && (
                <span
                  className={
                    isActive ? "text-primary" : "text-muted-foreground"
                  }
                >
                  {item.icon}
                </span>
              )}
              <span
                className={
                  isActive ? "text-foreground" : "text-muted-foreground"
                }
              >
                {item.label}
              </span>
            </motion.div>
          </button>
        );
      })}
    </div>
  );
}
