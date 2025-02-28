import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface TouchButtonProps extends ButtonProps {
  /**
   * The amount of scale to apply when the button is pressed
   * @default 0.95
   */
  pressScale?: number;
  
  /**
   * The duration of the press animation in seconds
   * @default 0.2
   */
  pressDuration?: number;
  
  /**
   * Whether to add a tap highlight effect
   * @default true
   */
  tapHighlight?: boolean;
  
  /**
   * The color of the tap highlight
   * @default "rgba(0, 0, 0, 0.1)"
   */
  tapHighlightColor?: string;
  
  /**
   * Whether to add haptic feedback on press (if supported)
   * @default true
   */
  hapticFeedback?: boolean;
}

/**
 * A touch-optimized button component that enhances the touch experience on mobile devices.
 * It provides visual feedback through animations and optional haptic feedback.
 */
export function TouchButton({
  children,
  className,
  pressScale = 0.95,
  pressDuration = 0.2,
  tapHighlight = true,
  tapHighlightColor = "rgba(0, 0, 0, 0.1)",
  hapticFeedback = true,
  onClick,
  ...props
}: TouchButtonProps) {
  const isMobile = useIsMobile();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  // Handle click with optional haptic feedback
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (hapticFeedback && isMobile && navigator.vibrate) {
      // Short vibration for tactile feedback (if supported)
      navigator.vibrate(10);
    }
    
    if (onClick) {
      onClick(e);
    }
  }, [hapticFeedback, isMobile, onClick]);
  
  // Add touch-specific styles for mobile devices
  const touchStyles = isMobile ? {
    // Increase touch target size
    padding: "0.75rem 1rem",
    // Remove outline on touch devices
    WebkitTapHighlightColor: tapHighlight ? tapHighlightColor : "transparent",
    // Prevent text selection during taps
    WebkitUserSelect: "none" as const,
    userSelect: "none" as const,
    // Prevent double-tap zoom
    touchAction: "manipulation" as const,
  } : {};
  
  return (
    <motion.div
      whileTap={{ scale: isMobile ? pressScale : 1 }}
      transition={{ duration: pressDuration }}
      style={{ display: "inline-block" }}
    >
      <Button
        ref={buttonRef}
        className={cn(
          "transition-all duration-200",
          isMobile && "mobile-optimized",
          className
        )}
        onClick={handleClick}
        style={touchStyles}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
} 