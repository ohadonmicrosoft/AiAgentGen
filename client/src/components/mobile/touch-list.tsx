import { withErrorBoundary } from "@/components/ui/error-boundary";
import { useIsMobile } from "@/hooks/use-mobile";
import { Logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { SwipeContainer } from "./swipe-container";

const logger = new Logger("TouchList");

// Item actions that can be revealed by swiping
export interface TouchListItemAction {
  /**
   * Unique identifier for the action
   */
  id: string;

  /**
   * Label to display for the action
   */
  label: string;

  /**
   * Icon component to display (optional)
   */
  icon?: React.ReactNode;

  /**
   * Function to call when action is triggered
   */
  onAction: () => void;

  /**
   * Background color for the action button
   * @default "bg-primary"
   */
  color?: string;
}

export interface TouchListItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Unique identifier for the item
   */
  itemId: string | number;

  /**
   * Whether the item is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Function called when the item is tapped
   */
  onTap?: () => void;

  /**
   * Function called when the item is long-pressed
   */
  onLongPress?: () => void;

  /**
   * Actions that appear when swiping from right to left
   */
  leftActions?: TouchListItemAction[];

  /**
   * Actions that appear when swiping from left to right
   */
  rightActions?: TouchListItemAction[];

  /**
   * Whether to show a divider below this item
   * @default true
   */
  divider?: boolean;

  /**
   * Children to render inside the item
   */
  children: React.ReactNode;
}

const TouchListItem = React.forwardRef<HTMLDivElement, TouchListItemProps>(
  (
    {
      className,
      itemId,
      disabled = false,
      onTap,
      onLongPress,
      leftActions = [],
      rightActions = [],
      divider = true,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [showLeftActions, setShowLeftActions] = React.useState(false);
    const [showRightActions, setShowRightActions] = React.useState(false);
    const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Clear any timeouts when component unmounts
    React.useEffect(() => {
      return () => {
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
        }
      };
    }, []);

    // Handle long press detection
    const handlePointerDown = React.useCallback(() => {
      if (disabled || !onLongPress) return;

      longPressTimeoutRef.current = setTimeout(() => {
        if (onLongPress) {
          onLongPress();
          // Provide haptic feedback for long press if available
          if (navigator.vibrate) {
            navigator.vibrate(20);
          }
        }
      }, 500); // 500ms threshold for long press
    }, [disabled, onLongPress]);

    const handlePointerUp = React.useCallback(() => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }, []);

    const handleTap = React.useCallback(() => {
      if (disabled || !onTap) return;

      try {
        // Close any open actions
        setShowLeftActions(false);
        setShowRightActions(false);

        // Call the onTap callback
        onTap();
      } catch (error) {
        logger.error("Error handling item tap:", { error, itemId });
      }
    }, [disabled, onTap, itemId]);

    const handleSwipeLeft = React.useCallback(() => {
      if (disabled || leftActions.length === 0) return;

      try {
        setShowLeftActions(true);
        setShowRightActions(false);
      } catch (error) {
        logger.error("Error handling swipe left:", { error, itemId });
      }
    }, [disabled, leftActions, itemId]);

    const handleSwipeRight = React.useCallback(() => {
      if (disabled || rightActions.length === 0) return;

      try {
        setShowRightActions(true);
        setShowLeftActions(false);
      } catch (error) {
        logger.error("Error handling swipe right:", { error, itemId });
      }
    }, [disabled, rightActions, itemId]);

    // Reset the action visibility
    const resetActions = React.useCallback(() => {
      setShowLeftActions(false);
      setShowRightActions(false);
    }, []);

    // If not on mobile, render a simpler version without swipe actions
    if (!isMobile) {
      return (
        <div
          ref={ref}
          className={cn(
            "py-3 px-4",
            divider && "border-b",
            disabled && "opacity-50 pointer-events-none",
            className,
          )}
          onClick={!disabled && onTap ? onTap : undefined}
          {...props}
        >
          {children}
        </div>
      );
    }

    // Render the action buttons
    const renderActionButtons = (
      actions: TouchListItemAction[],
      position: "left" | "right",
    ) => {
      return (
        <div
          className={cn(
            "absolute top-0 bottom-0 flex h-full",
            position === "left" ? "right-0" : "left-0",
          )}
        >
          {actions.map((action) => (
            <button
              key={action.id}
              className={cn(
                "h-full px-4 flex items-center justify-center",
                action.color || "bg-primary",
                "text-white",
              )}
              onClick={(e) => {
                e.stopPropagation();
                action.onAction();
                resetActions();
              }}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                {action.icon && <div className="text-lg">{action.icon}</div>}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      );
    };

    return (
      <div
        className={cn(
          "relative overflow-hidden",
          divider && "border-b",
          disabled && "opacity-50 pointer-events-none",
          className,
        )}
        {...props}
      >
        {/* Actions revealed by swiping */}
        <AnimatePresence>
          {showLeftActions && leftActions.length > 0 && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute inset-0"
            >
              {renderActionButtons(leftActions, "left")}
            </motion.div>
          )}

          {showRightActions && rightActions.length > 0 && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute inset-0"
            >
              {renderActionButtons(rightActions, "right")}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main item content with swipe detection */}
        <SwipeContainer
          ref={ref}
          className={cn(
            "bg-background py-3 px-4",
            showLeftActions || showRightActions ? "shadow-md z-10" : "",
          )}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onClick={handleTap}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          direction="horizontal"
        >
          {children}
        </SwipeContainer>
      </div>
    );
  },
);

TouchListItem.displayName = "TouchListItem";

export interface TouchListProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Children to render inside the list
   */
  children: React.ReactNode;
}

const TouchListBase = React.forwardRef<HTMLDivElement, TouchListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("border rounded-md overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

TouchListBase.displayName = "TouchListBase";

// Apply error boundaries
const TouchListWithBoundary = withErrorBoundary(TouchListBase);
TouchListWithBoundary.displayName = "TouchList";

const TouchListItemWithBoundary = withErrorBoundary(TouchListItem);
TouchListItemWithBoundary.displayName = "TouchListItem";

// Export the components
export {
  TouchListWithBoundary as TouchList,
  TouchListItemWithBoundary as TouchListItem,
};
