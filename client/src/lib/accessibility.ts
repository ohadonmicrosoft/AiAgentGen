import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/animations/useReducedMotion';

/**
 * Types of announcements
 */
export type AnnouncementType = 'polite' | 'assertive';

/**
 * Announces messages to screen readers
 * @param message The message to announce
 * @param type The type of announcement ('polite' or 'assertive')
 */
export function announce(message: string, type: AnnouncementType = 'polite') {
  const announcer = getAnnouncer(type);

  // Update the content to trigger screen reader announcement
  if (announcer) {
    // Clear it first to ensure the announcement happens even if the same text is announced twice
    announcer.textContent = '';

    // Use setTimeout to ensure the change is announced
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}

/**
 * Gets or creates the announcer element for a specific type
 */
function getAnnouncer(type: AnnouncementType): HTMLElement {
  const id = `sr-announcer-${type}`;
  let announcer = document.getElementById(id);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = id;
    announcer.setAttribute('aria-live', type);
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-atomic', 'true');

    // Hide it visually but keep it accessible to screen readers
    Object.assign(announcer.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });

    document.body.appendChild(announcer);
  }

  return announcer;
}

/**
 * Creates a stateful announcer that can be used to announce messages
 * @param initialMessage The initial message to announce
 * @param type The type of announcement
 * @returns An object with the current message and a function to set a new message
 */
export function useAnnouncer(initialMessage = '', type: AnnouncementType = 'polite') {
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    if (message) {
      announce(message, type);
    }
  }, [message, type]);

  return {
    message,
    announce: setMessage,
  };
}

/**
 * Hook to trap focus within a container
 * @param active Whether the focus trap is active
 * @param onEscape Callback when the escape key is pressed
 * @returns Ref to be attached to the containing element
 */
export function useFocusTrap(active = true, onEscape?: () => void) {
  const ref = useRef<HTMLElement>(null);
  const previousFocusedElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when the trap becomes active
  useEffect(() => {
    if (active && document.activeElement instanceof HTMLElement) {
      previousFocusedElement.current = document.activeElement;
    }
  }, [active]);

  // Restore focus when the trap is deactivated
  useEffect(() => {
    return () => {
      if (previousFocusedElement.current) {
        previousFocusedElement.current.focus();
      }
    };
  }, []);

  // Handle Tab and Escape key presses
  useEffect(() => {
    if (!active || !ref.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Only handle Tab key if active
      if (e.key !== 'Tab' || !active) return;

      const focusableElements = getFocusableElements(ref.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab => backward
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab => forward
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, onEscape]);

  // Set focus on the first focusable element when activated
  useEffect(() => {
    if (active && ref.current) {
      const focusableElements = getFocusableElements(ref.current);
      if (focusableElements.length > 0) {
        // Set focus after a small delay to ensure the DOM is fully rendered
        setTimeout(() => {
          focusableElements[0].focus();
        }, 16);
      }
    }
  }, [active]);

  return ref;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'area[href]',
    'iframe',
    'object',
    'embed',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll(selector)).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.tabIndex !== -1,
  );
}

/**
 * Hook to manage focus when content is dynamically added or removed
 * @param active Whether focus management is active
 * @returns Object containing refs and function to handle focus
 */
export function useFocusManagement(active = true) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement;
    }
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, []);

  return {
    containerRef,
    saveFocus,
    restoreFocus,
    focusFirst,
  };
}

/**
 * Hook to handle keyboard navigation for custom interactive components
 * @param options Options for keyboard navigation
 * @returns Object with key handler and current index
 */
export function useKeyboardNavigation({
  itemCount,
  onSelect,
  initialIndex = 0,
  vertical = true,
  horizontal = false,
  loop = true,
}: {
  itemCount: number;
  onSelect?: (index: number) => void;
  initialIndex?: number;
  vertical?: boolean;
  horizontal?: boolean;
  loop?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let newIndex = currentIndex;

      // Vertical navigation
      if (vertical) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          newIndex = currentIndex - 1;
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          newIndex = currentIndex + 1;
        }
      }

      // Horizontal navigation
      if (horizontal) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          newIndex = currentIndex - 1;
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          newIndex = currentIndex + 1;
        }
      }

      // Home and End keys
      if (event.key === 'Home') {
        event.preventDefault();
        newIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        newIndex = itemCount - 1;
      }

      // Enter and Space to select
      if ((event.key === 'Enter' || event.key === ' ') && onSelect) {
        event.preventDefault();
        onSelect(currentIndex);
        return;
      }

      // Handle looping or constrain within bounds
      if (newIndex !== currentIndex) {
        if (loop) {
          // Loop around if out of bounds
          if (newIndex < 0) newIndex = itemCount - 1;
          if (newIndex >= itemCount) newIndex = 0;
        } else {
          // Constrain within bounds
          if (newIndex < 0) newIndex = 0;
          if (newIndex >= itemCount) newIndex = itemCount - 1;
        }

        setCurrentIndex(newIndex);
      }
    },
    [currentIndex, itemCount, onSelect, vertical, horizontal, loop],
  );

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
  };
}

/**
 * Component props for the skip link
 */
export interface SkipLinkProps {
  /**
   * The target element's id to skip to
   */
  targetId: string;

  /**
   * The text to display on the skip link
   */
  children: React.ReactNode;

  /**
   * Additional class names to apply to the skip link
   */
  className?: string;
}

/**
 * Checks if a URL parameter is set for accessibility testing mode
 * @returns Boolean indicating if a11y test mode is active
 */
export function isA11yTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('a11y');
}

/**
 * Hook for managing reduced motion based on user preference
 * @returns Object with animation settings suitable for the user's motion preferences
 */
export function useAccessibleAnimations() {
  const prefersReducedMotion = useReducedMotion();

  return {
    enabled: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : 0.3,
    transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.3 },
    transform: prefersReducedMotion ? {} : { scale: 1.02 },
    opacity: prefersReducedMotion ? { opacity: 1 } : { opacity: [0, 1] },
    slideIn: prefersReducedMotion ? { x: 0 } : { x: [-20, 0] },
  };
}
