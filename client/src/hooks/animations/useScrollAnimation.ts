import { useEffect, useState, useRef, RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook to detect when an element is visible in the viewport
 * Used to trigger animations when elements scroll into view
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
): [RefObject<T>, boolean] {
  const { 
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true 
  } = options;
  
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // If user prefers reduced motion, consider element as always visible
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }
    
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update state when intersection status changes
        if (entry.isIntersecting) {
          setIsVisible(true);
          // If triggerOnce is true, disconnect the observer after the element becomes visible
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, prefersReducedMotion]);

  return [ref, isVisible];
}

/**
 * Returns animation variants for scroll-triggered animations
 */
export function useScrollAnimationVariants() {
  const prefersReducedMotion = useReducedMotion();
  
  return {
    hidden: prefersReducedMotion 
      ? { opacity: 1, y: 0 } 
      : { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };
} 