import React, { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageTransition } from '@/hooks/animations';

interface PageTransitionProps {
  children: ReactNode;
  location?: string;
}

/**
 * PageTransition component that wraps route content with animated transitions
 * This creates smooth transitions between pages
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  location,
}) => {
  const [currentLocation] = useLocation();
  const { initial, animate, exit, transition } = usePageTransition();

  // Use provided location or current location from wouter
  const currentPath = location || currentLocation;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPath}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        className="page-transition w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Higher-order component to wrap a page component with transition animations
 */
export function withPageTransition<T extends object>(
  Component: React.ComponentType<T>,
) {
  return (props: T) => (
    <PageTransition>
      <Component {...props} />
    </PageTransition>
  );
}
