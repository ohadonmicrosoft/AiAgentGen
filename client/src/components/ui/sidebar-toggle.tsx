import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface SidebarToggleProps {
  className?: string;
}

export function SidebarToggle({ className }: SidebarToggleProps) {
  const { isCollapsed, toggleCollapsed } = useSidebarState();
  const prefersReducedMotion = useReducedMotion();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCollapsed}
      className={cn(
        "h-8 w-8 p-0 rounded-full bg-background border shadow-sm",
        className
      )}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <motion.div
        animate={{ rotate: isCollapsed ? 180 : 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.2,
          ease: "easeInOut",
        }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </motion.div>
    </Button>
  );
} 