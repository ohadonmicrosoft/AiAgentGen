import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

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
      className={cn('h-8 w-8 p-0 rounded-full bg-background border shadow-sm', className)}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!isCollapsed}
      aria-controls="main-sidebar"
    >
      <motion.div
        animate={{ rotate: isCollapsed ? 180 : 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.2,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        )}
      </motion.div>
    </Button>
  );
}
