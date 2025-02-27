import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * This is used to disable or reduce animations for users who have this preference
 */
export function useReducedMotion() {
  // Default to false to ensure animations are enabled by default
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if the browser supports matchMedia
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    
    // Set the initial value
    setPrefersReducedMotion(mediaQuery?.matches ?? false);
    
    // Add listener for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Add event listener
    mediaQuery?.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery?.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns appropriate animation properties based on user's motion preference
 */
export function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion();
  
  return {
    // Disable duration for reduced motion
    transition: prefersReducedMotion 
      ? { duration: 0 } 
      : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] },
    
    // Disable scale animations for reduced motion
    hover: prefersReducedMotion 
      ? {} 
      : { scale: 1.02 },
    
    // Disable entrance animations for reduced motion
    entrance: prefersReducedMotion
      ? { opacity: 1, y: 0 }
      : { opacity: [0, 1], y: [20, 0] },
  };
} 