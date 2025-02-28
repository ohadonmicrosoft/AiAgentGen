import { Button, ButtonProps } from '@/components/ui/button';
import { withErrorBoundary } from '@/components/ui/error-boundary';
import { useReducedMotion } from '@/hooks/animations/useReducedMotion';
import { useFluidSpacing } from '@/hooks/use-fluid-spacing';
import { useHaptic } from '@/hooks/use-haptic';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import * as React from 'react';

// Define haptic feedback types
type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | boolean;

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
   * The type of haptic feedback to apply when pressed
   * @default "light"
   */
  hapticFeedback?: HapticType;

  /**
   * Whether to show a ripple effect when pressed
   * @default false
   */
  showRipple?: boolean;

  /**
   * The color of the ripple effect
   * @default "currentColor"
   */
  rippleColor?: string;

  /**
   * The size of the touch target padding (in pixels or fluid spacing value)
   * @default "xs" for mobile, "none" for desktop
   */
  touchPadding?: string;

  /**
   * Whether to add tactile animation when pressed
   * @default true
   */
  tactileAnimation?: boolean;
}

/**
 * A touch-optimized button component that enhances the touch experience on mobile devices.
 * It provides visual feedback through animations and optional haptic feedback.
 */
const TouchButtonComponent = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      children,
      className,
      pressScale = 0.95,
      pressDuration = 0.2,
      tapHighlight = true,
      tapHighlightColor = 'rgba(0, 0, 0, 0.1)',
      hapticFeedback = 'light',
      showRipple = false,
      rippleColor = 'currentColor',
      touchPadding,
      tactileAnimation = true,
      onClick,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const { getSpacing } = useFluidSpacing();
    const shouldReduceMotion = useReducedMotion();
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [isPressed, setIsPressed] = React.useState(false);

    // Get haptic feedback methods from hook
    const {
      isSupported: hapticSupported,
      light: triggerLightFeedback,
      medium: triggerMediumFeedback,
      heavy: triggerHeavyFeedback,
      success: triggerSuccessFeedback,
      warning: triggerWarningFeedback,
      error: triggerErrorFeedback,
    } = useHaptic();

    // Manage ripple effect state
    const [ripples, setRipples] = React.useState<
      Array<{
        id: number;
        x: number;
        y: number;
        size: number;
      }>
    >([]);
    const rippleCount = React.useRef(0);

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

    // Handle haptic feedback based on type
    const triggerAppropriateHaptic = React.useCallback(() => {
      if (!hapticFeedback || disabled) return;

      try {
        switch (hapticFeedback) {
          case 'light':
            triggerLightFeedback();
            break;
          case 'medium':
            triggerMediumFeedback();
            break;
          case 'heavy':
            triggerHeavyFeedback();
            break;
          case 'success':
            triggerSuccessFeedback();
            break;
          case 'warning':
            triggerWarningFeedback();
            break;
          case 'error':
            triggerErrorFeedback();
            break;
          case true:
            triggerLightFeedback();
            break;
          default:
            // No haptic feedback if false or unrecognized
            break;
        }
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
        // Fail silently - haptic is an enhancement, not critical functionality
      }
    }, [
      hapticFeedback,
      disabled,
      triggerLightFeedback,
      triggerMediumFeedback,
      triggerHeavyFeedback,
      triggerSuccessFeedback,
      triggerWarningFeedback,
      triggerErrorFeedback,
    ]);

    // Create a ripple effect centered on the touch/click point
    const createRipple = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
        if (!showRipple || disabled) return;

        try {
          const button = buttonRef.current;
          if (!button) return;

          // Get button dimensions and position
          const rect = button.getBoundingClientRect();

          // Get coordinates (handle both touch and mouse events)
          let x, y;
          if ('touches' in e) {
            // Touch event
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
          } else {
            // Mouse event
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
          }

          // Calculate ripple size based on button dimensions
          const size = Math.max(rect.width, rect.height) * 2;

          // Add new ripple
          const id = rippleCount.current++;
          setRipples((prev) => [...prev, { id, x, y, size }]);

          // Remove ripple after animation completes
          setTimeout(() => {
            setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
          }, 600); // Match with CSS animation duration
        } catch (error) {
          console.warn('Ripple effect failed:', error);
          // Fail silently - ripple is just a visual enhancement
        }
      },
      [showRipple, disabled],
    );

    // Handle click with haptic feedback and ripple effect
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        try {
          if (disabled) return;

          // Trigger haptic feedback
          triggerAppropriateHaptic();

          // Create ripple effect
          createRipple(e);

          // Call original onClick handler
          if (onClick) {
            onClick(e);
          }
        } catch (error) {
          console.error('Error in TouchButton click handler:', error);
          // Ensure the error doesn't prevent default button behavior
          if (onClick && !e.defaultPrevented) {
            // Try again with basic functionality
            onClick(e);
          }
        }
      },
      [disabled, triggerAppropriateHaptic, createRipple, onClick],
    );

    // Handle touch start event for immediate feedback
    const handleTouchStart = React.useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        if (disabled) return;

        setIsPressed(true);
        createRipple(e);
      },
      [disabled, createRipple],
    );

    // Handle touch end event
    const handleTouchEnd = React.useCallback(() => {
      setIsPressed(false);
    }, []);

    // Determine padding for touch targets
    const padValue = React.useMemo(() => {
      if (touchPadding !== undefined) {
        return touchPadding;
      }
      return isMobile ? getSpacing('xs') : '0';
    }, [touchPadding, isMobile, getSpacing]);

    // Add touch-specific styles for mobile devices
    const touchStyles = isMobile
      ? {
          // Increase touch target size
          padding: padValue,
          // Remove outline on touch devices
          WebkitTapHighlightColor: tapHighlight ? tapHighlightColor : 'transparent',
          // Prevent text selection during taps
          WebkitUserSelect: 'none' as const,
          userSelect: 'none' as const,
          // Prevent double-tap zoom
          touchAction: 'manipulation' as const,
          // Position relative for ripple container
          position: 'relative' as const,
          // Isolate z-index stacking context
          zIndex: 1,
          // Ensure content doesn't get clipped
          overflow: 'hidden' as const,
        }
      : {};

    // Determine animation based on device and preferences
    const shouldAnimate = isMobile && tactileAnimation && !shouldReduceMotion;

    return (
      <motion.div
        whileTap={shouldAnimate ? { scale: pressScale } : undefined}
        animate={isPressed && shouldAnimate ? { scale: pressScale } : { scale: 1 }}
        transition={{
          duration: pressDuration,
          // Use more performant animations on mobile
          type: isMobile ? 'tween' : 'spring',
          // Reduce animation complexity on mobile
          bounce: isMobile ? 0 : 0.25,
        }}
        style={{
          display: 'inline-block',
          // Improve performance by using hardware acceleration
          willChange: 'transform',
          // Ensure the animation doesn't cause layout shifts
          transform: 'translateZ(0)',
        }}
      >
        <Button
          ref={mergedRef}
          className={cn(
            'transition-all duration-200',
            isMobile && 'mobile-optimized touch-manipulation',
            showRipple && 'overflow-hidden',
            className,
          )}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={touchStyles}
          disabled={disabled}
          {...props}
        >
          {/* Ripple effects container */}
          {showRipple && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {ripples.map((ripple) => (
                <span
                  key={ripple.id}
                  className="absolute rounded-full opacity-30 animate-ripple"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: ripple.size,
                    height: ripple.size,
                    backgroundColor: rippleColor,
                    transform: 'translate(-50%, -50%) scale(0)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Button content */}
          {children}
        </Button>
      </motion.div>
    );
  },
);

TouchButtonComponent.displayName = 'TouchButton';

// Export the component wrapped with an error boundary
export const TouchButton = withErrorBoundary(TouchButtonComponent, {
  // Use a simpler fallback for the button to maintain layout
  fallback: (
    <Button variant="outline" disabled className="opacity-70">
      ⚠️ Button Error
    </Button>
  ),
});
