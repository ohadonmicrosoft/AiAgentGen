import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavItem } from "@/types";

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
  animated = true
}: BottomNavigationProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  
  // Don't render on non-mobile devices
  if (!isMobile) return null;
  
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t",
        "flex items-center justify-around h-16 px-2",
        className
      )}
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const isActive = pathname === item.path;
        
        return (
          <Link
            key={item.path}
            href={item.path}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              "relative py-1 transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {showActiveIndicator && isActive && (
              <motion.div
                className="absolute top-0 left-1/2 w-1/2 h-0.5 bg-primary rounded-full"
                layoutId={animated ? "bottomNavIndicator" : undefined}
                initial={animated ? { width: 0 } : undefined}
                animate={animated ? { width: "50%" } : undefined}
                style={{ translateX: "-50%" }}
              />
            )}
            
            <div className="relative">
              {/* Icon */}
              <div className="flex items-center justify-center h-6">
                {item.icon}
              </div>
              
              {/* Label */}
              {showLabels && (
                <span className="mt-1 text-xs font-medium block text-center">
                  {item.label}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * A component that adds padding to the bottom of the page to account for the bottom navigation bar on mobile.
 */
export function BottomNavigationSpacer() {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;
  
  return <div className="h-16" aria-hidden="true" />;
} 