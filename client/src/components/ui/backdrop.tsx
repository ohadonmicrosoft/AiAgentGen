import React from 'react';
import { cn } from '@/lib/utils';

interface BackdropProps {
  show: boolean;
  onClick?: () => void;
  className?: string;
  zIndex?: string;
  transparent?: boolean;
}

/**
 * Responsive backdrop component that appears behind modals, menus, etc.
 * Can be used to close the overlay when clicked.
 */
export function Backdrop({
  show,
  onClick,
  className,
  zIndex = 'z-40',
  transparent = false,
}: BackdropProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 transition-opacity duration-300 ease-in-out',
        zIndex,
        transparent ? 'bg-transparent' : 'bg-black/50',
        show ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className,
      )}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}
