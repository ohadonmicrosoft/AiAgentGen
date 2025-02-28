import * as React from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { withErrorBoundary } from '@/components/ui/error-boundary';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react'; 
import { Logger } from '@/lib/logger';

const logger = new Logger('PullRefresh');

export interface PullRefreshProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Function called when the pull-to-refresh action is triggered
   * Should return a promise that resolves when the refresh is complete
   */
  onRefresh: () => Promise<void>;
  
  /**
   * Pull distance required to trigger refresh (in pixels)
   * @default 80
   */
  pullThreshold?: number;
  
  /**
   * Maximum pull distance (in pixels)
   * @default 120
   */
  maxPullDistance?: number;
  
  /**
   * Custom loading indicator
   */
  loadingIndicator?: React.ReactNode;
  
  /**
   * Text to display while pulling
   * @default "Pull to refresh"
   */
  pullText?: string;
  
  /**
   * Text to display when pulled enough to refresh
   * @default "Release to refresh"
   */
  releaseText?: string;
  
  /**
   * Text to display while refreshing
   * @default "Refreshing..."
   */
  refreshingText?: string;
  
  /**
   * Whether to disable pull-to-refresh
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Children to render inside the pull-refresh container
   */
  children: React.ReactNode;
}

const PullRefreshBase = React.forwardRef<HTMLDivElement, PullRefreshProps>(
  ({
    className,
    children,
    onRefresh,
    pullThreshold = 80,
    maxPullDistance = 120,
    loadingIndicator,
    pullText = "Pull to refresh",
    releaseText = "Release to refresh",
    refreshingText = "Refreshing...",
    disabled = false,
    ...props
  }, ref) => {
    const controls = useAnimation();
    const isMobile = useIsMobile();
    const [isPulling, setIsPulling] = React.useState(false);
    const [pullDistance, setPullDistance] = React.useState(0);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    
    // Only enable pull-to-refresh on mobile devices
    const isPullEnabled = isMobile && !disabled && !isRefreshing;
    
    // Handle when the user releases the pull
    const handleDragEnd = React.useCallback(
      async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        try {
          if (!isPullEnabled) return;
          
          const { offset } = info;
          
          // If pulled past threshold, trigger refresh
          if (offset.y >= pullThreshold) {
            setIsRefreshing(true);
            
            // Animate to loading state
            controls.start({
              y: pullThreshold / 2,
              transition: { type: 'spring', bounce: 0.3 }
            });
            
            // Call the onRefresh function
            try {
              await onRefresh();
            } catch (error) {
              logger.error('Error during refresh:', { error });
            }
            
            // Animation to close the refresh view
            controls.start({
              y: 0,
              transition: { type: 'spring', bounce: 0.2 }
            });
            
            setIsRefreshing(false);
          } else {
            // If not pulled far enough, animate back to starting position
            controls.start({
              y: 0,
              transition: { type: 'spring', bounce: 0.2 }
            });
          }
          
          setIsPulling(false);
          setPullDistance(0);
        } catch (error) {
          logger.error('Error in pull refresh handler:', { error });
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
          
          // Ensure we reset the UI state even if there was an error
          controls.start({
            y: 0,
            transition: { type: 'spring', bounce: 0.2 }
          });
        }
      },
      [controls, isPullEnabled, pullThreshold, onRefresh]
    );
    
    // Handle the dragging motion
    const handleDrag = React.useCallback(
      (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        try {
          if (!isPullEnabled) return;
          
          const { offset } = info;
          
          // Only allow pulling down from the top
          if (offset.y > 0) {
            setIsPulling(true);
            
            // Apply resistance to the pull (gets harder as you pull further)
            const resistedPull = Math.min(
              maxPullDistance,
              Math.pow(offset.y, 0.8)
            );
            
            setPullDistance(resistedPull);
            controls.set({ y: resistedPull });
          } else {
            setIsPulling(false);
            setPullDistance(0);
          }
        } catch (error) {
          logger.error('Error during pull motion:', { error });
        }
      },
      [controls, isPullEnabled, maxPullDistance]
    );
    
    // Determine the current status text
    const statusText = isRefreshing
      ? refreshingText
      : pullDistance >= pullThreshold
      ? releaseText
      : pullText;
    
    // Default loading indicator
    const defaultLoadingIndicator = (
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground mt-3 h-6">
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <motion.div
            animate={{ rotate: pullDistance >= pullThreshold ? 180 : 0 }}
            className="h-4 w-4 transition-transform"
          >
            ↓
          </motion.div>
        )}
        <span>{statusText}</span>
      </div>
    );
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          disabled && 'pointer-events-none',
          className
        )}
        drag={isPullEnabled ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        {...props}
      >
        {/* Loading indicator container */}
        <div
          className={cn(
            'absolute left-0 right-0 flex justify-center -top-16 transition-opacity',
            (isPulling || isRefreshing) ? 'opacity-100' : 'opacity-0'
          )}
        >
          {loadingIndicator || defaultLoadingIndicator}
        </div>
        
        {/* Content container */}
        <div
          className={cn(
            'min-h-full will-change-transform',
            isRefreshing && 'pointer-events-none'
          )}
        >
          {children}
        </div>
      </motion.div>
    );
  }
);

PullRefreshBase.displayName = 'PullRefreshBase';

// Wrap with error boundary
const PullRefresh = withErrorBoundary(PullRefreshBase);
PullRefresh.displayName = 'PullRefresh';

export { PullRefresh }; 