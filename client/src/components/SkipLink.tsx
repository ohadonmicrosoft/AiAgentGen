import React from 'react';
import { SkipLinkProps } from '@/lib/accessibility';
import { cn } from '@/lib/utils';

/**
 * A skip link that allows keyboard users to bypass navigation
 * and jump directly to main content
 */
export function SkipLink({ targetId, children, className }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);

    if (target) {
      // Set tabindex temporarily to ensure focusability
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');

        // Remove it after blur to maintain proper semantics
        const handleBlur = () => {
          target.removeAttribute('tabindex');
          target.removeEventListener('blur', handleBlur);
        };

        target.addEventListener('blur', handleBlur);
      }

      // Focus the element
      target.focus();

      // Also scroll to it
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Only visible when focused
        'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50',
        'focus:bg-primary focus:text-primary-foreground focus:p-3 focus:m-2 focus:rounded',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className,
      )}
    >
      {children}
    </a>
  );
}
