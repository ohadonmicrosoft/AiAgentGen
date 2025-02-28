import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { withErrorBoundary } from "@/components/ui/error-boundary";

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
const TouchButtonComponent = React.forwardRef<HTMLButtonElement, TouchButtonProps>(({
  children,
  className,
  pressScale = 0.95,
  pressDuration = 0.2,
  tapHighlight = true,
  tapHighlightColor = "rgba(0, 0, 0, 0.1)",
  hapticFeedback = true,
  onClick,
  ...props
}, ref) => {
  const isMobile = useIsMobile();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  // Merge refs to support both forwarded ref and internal ref
  const mergedRef = React.useMemo(() => {
    return (elementRef: HTMLButtonElement) => {
      // Update internal ref
      if (buttonRef) {
        (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = elementRef;
      }
      // Forward the ref
      if (typeof ref === 'function') {
        ref(elementRef);
      } else if (ref) {
        ref.current = elementRef;
      }
    };
  }, [ref]);
  
  // Handle click with optional haptic feedback
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      if (hapticFeedback && isMobile && navigator.vibrate) {
        // Short vibration for tactile feedback (if supported)
        navigator.vibrate(10);
      }
      
      if (onClick) {
        onClick(e);
      }
    } catch (error) {
      console.error("Error in TouchButton click handler:", error);
      // Ensure the error doesn't prevent default button behavior
      if (onClick && !e.defaultPrevented) {
        // Try again with basic functionality
        onClick(e);
      }
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
  
  // Use useWhileTap for lighter-weight animation on mobile
  return (
    <motion.div
      whileTap={{ scale: isMobile ? pressScale : 1 }}
      transition={{ 
        duration: pressDuration,
        // Use more performant animations on mobile
        type: isMobile ? "tween" : "spring",
        // Reduce animation complexity on mobile
        bounce: isMobile ? 0 : 0.25
      }}
      style={{ 
        display: "inline-block",
        // Improve performance by using hardware acceleration
        willChange: "transform",
        // Ensure the animation doesn't cause layout shifts
        transform: "translateZ(0)"
      }}
    >
      <Button
        ref={mergedRef}
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
});

TouchButtonComponent.displayName = "TouchButton";

// Export the component wrapped with an error boundary
export const TouchButton = withErrorBoundary(TouchButtonComponent, {
  // Use a simpler fallback for the button to maintain layout
  fallback: (
    <Button 
      variant="outline"
      disabled
      className="opacity-70"
    >
      ⚠️ Button Error
    </Button>
  )
}); 