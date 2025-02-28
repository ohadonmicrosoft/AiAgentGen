import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  /**
   * The size of the spinner
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Additional class name for the spinner
   */
  className?: string;
}

/**
 * A loading spinner component with customizable size
 */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-transparent border-background",
        "border-current text-primary/30",
        size === "sm" && "h-4 w-4 border-2",
        size === "md" && "h-6 w-6 border-2",
        size === "lg" && "h-8 w-8 border-3",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Spinner; 