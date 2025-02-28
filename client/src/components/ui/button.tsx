import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { withErrorBoundary } from "@/components/ui/error-boundary"
import { logger } from "@/lib/logger"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 hover:scale-[1.02] relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent",
        destructive:
          "bg-background text-destructive border border-destructive hover:bg-destructive/10",
        outline:
          "border border-input bg-background hover:bg-accent/50 hover:border-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
        ghost: "hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-9 w-9 rounded-full p-0",
        xs: "h-7 rounded-md px-2 text-xs",
        xl: "h-12 rounded-md px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Create a safe click handler that prevents event propagation issues
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      try {
        // Prevent propagation issues with nested event handlers
        if (event.target !== event.currentTarget) {
          // Make sure the event doesn't bubble up in a problematic way
          // This prevents double-firing in some cases
          event.stopPropagation();
        }
        
        // Call the original onClick handler
        if (onClick) {
          onClick(event);
        }
      } catch (error) {
        // Log the error but don't crash the component
        logger.error('Error in button click handler:', { error });
        
        // Try to proceed with default behavior if possible
        if (!event.defaultPrevented) {
          // For links or other buttons that should still work even if the handler fails
          if (asChild && props.href) {
            window.location.href = props.href as string;
          }
        }
      }
    }, [onClick, asChild, props.href]);
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
ButtonBase.displayName = "ButtonBase"

// Create a version wrapped with error boundary
const Button = withErrorBoundary(ButtonBase, {
  // Use a minimal fallback to avoid disrupting layouts
  fallback: (
    <button 
      className={cn(
        buttonVariants({ variant: "outline" }),
        "opacity-70 cursor-not-allowed"
      )}
      disabled
    >
      Error
    </button>
  )
});
Button.displayName = "Button"

export { Button, ButtonBase, buttonVariants }
