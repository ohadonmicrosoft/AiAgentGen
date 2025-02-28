import * as React from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { withErrorBoundary } from '@/components/ui/error-boundary';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logger } from '@/lib/logger';

const logger = new Logger('SwipeContainer');

export interface SwipeContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Function called when user swipes left
   */
  onSwipeLeft?: () => void;

  /**
   * Function called when user swipes right
   */
  onSwipeRight?: () => void;

  /**
   * Function called when user swipes up
   */
  onSwipeUp?: () => void;

  /**
   * Function called when user swipes down
   */
  onSwipeDown?: () => void;

  /**
   * Minimum distance in pixels required to trigger a swipe
   * @default 50
   */
  swipeThreshold?: number;

  /**
   * Whether to show visual feedback during swipe
   * @default true
   */
  visualFeedback?: boolean;

  /**
   * Whether to apply spring animation for smoother feel
   * @default true
   */
  useSpringAnimation?: boolean;

  /**
   * Whether to disable swiping
   * @default false
   */
  disabled?: boolean;

  /**
   * Which directions to allow swiping
   * @default "horizontal"
   */
  direction?: 'horizontal' | 'vertical' | 'both';

  /**
   * Children to render inside the swipe container
   */
  children: React.ReactNode;
}

const SwipeContainerBase = React.forwardRef<
  HTMLDivElement,
  SwipeContainerProps
>(
  (
    {
      className,
      children,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      swipeThreshold = 50,
      visualFeedback = true,
      useSpringAnimation = true,
      disabled = false,
      direction = 'horizontal',
      ...props
    },
    ref,
  ) => {
    const controls = useAnimation();
    const isMobile = useIsMobile();

    // Only enable swipe behavior on mobile devices
    const isSwipeEnabled = isMobile && !disabled;

    // Handle the drag end event
    const handleDragEnd = React.useCallback(
      (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        try {
          if (!isSwipeEnabled) return;

          const { offset, velocity } = info;
          const isHorizontalEnabled =
            direction === 'horizontal' || direction === 'both';
          const isVerticalEnabled =
            direction === 'vertical' || direction === 'both';

          // Check if the horizontal swipe meets the threshold
          if (isHorizontalEnabled) {
            // Check if swipe distance exceeds threshold OR velocity is high enough
            if (
              offset.x < -swipeThreshold ||
              (offset.x < -20 && velocity.x < -0.5)
            ) {
              if (onSwipeLeft) {
                onSwipeLeft();
                logger.debug('Swipe left detected');
              }
            } else if (
              offset.x > swipeThreshold ||
              (offset.x > 20 && velocity.x > 0.5)
            ) {
              if (onSwipeRight) {
                onSwipeRight();
                logger.debug('Swipe right detected');
              }
            }
          }

          // Check if the vertical swipe meets the threshold
          if (isVerticalEnabled) {
            if (
              offset.y < -swipeThreshold ||
              (offset.y < -20 && velocity.y < -0.5)
            ) {
              if (onSwipeUp) {
                onSwipeUp();
                logger.debug('Swipe up detected');
              }
            } else if (
              offset.y > swipeThreshold ||
              (offset.y > 20 && velocity.y > 0.5)
            ) {
              if (onSwipeDown) {
                onSwipeDown();
                logger.debug('Swipe down detected');
              }
            }
          }
        } catch (error) {
          logger.error('Error in swipe handler:', { error });
        }

        // Always reset the position with animation
        controls.start({
          x: 0,
          y: 0,
          transition: {
            type: useSpringAnimation ? 'spring' : 'tween',
            bounce: 0.2,
          },
        });
      },
      [
        controls,
        isSwipeEnabled,
        swipeThreshold,
        direction,
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        useSpringAnimation,
      ],
    );

    // Track current drag direction for constraining movement
    const handleDrag = React.useCallback(
      (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        try {
          // Don't do anything if not enabled
          if (!isSwipeEnabled || !visualFeedback) return;

          // Determine drag constraints based on direction
          const isHorizontalEnabled =
            direction === 'horizontal' || direction === 'both';
          const isVerticalEnabled =
            direction === 'vertical' || direction === 'both';

          // Update position if visual feedback is enabled
          controls.set({
            x: isHorizontalEnabled ? info.offset.x * 0.5 : 0, // Apply resistance by multiplying by 0.5
            y: isVerticalEnabled ? info.offset.y * 0.5 : 0,
          });
        } catch (error) {
          logger.error('Error in drag handler:', { error });
        }
      },
      [controls, isSwipeEnabled, visualFeedback, direction],
    );

    return (
      <motion.div
        ref={ref}
        className={cn(
          'touch-pan-y', // Improve touch behavior
          disabled && 'pointer-events-none',
          className,
        )}
        drag={
          isSwipeEnabled ? (direction === 'both' ? true : direction) : false
        }
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1} // Add a bit of elasticity
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={
          isSwipeEnabled && visualFeedback ? { scale: 0.98 } : undefined
        }
        style={{
          // Hardware acceleration for smoother animations
          willChange: isSwipeEnabled ? 'transform' : 'auto',
          transform: 'translateZ(0)',
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

SwipeContainerBase.displayName = 'SwipeContainerBase';

// Wrap with error boundary
const SwipeContainer = withErrorBoundary(SwipeContainerBase);
SwipeContainer.displayName = 'SwipeContainer';

export { SwipeContainer };
