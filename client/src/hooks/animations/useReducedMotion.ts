import { useEffect, useState, useMemo } from 'react';

/**
 * Detects if the device is likely a low-power device based on
 * user agent and hardware concurrency
 */
export function isLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for hardware concurrency (CPU cores)
  const lowConcurrency = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  
  // Check for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Check for battery status if available
  let isBatterySaving = false;
  if ('getBattery' in navigator) {
    // @ts-ignore - getBattery is not in the standard navigator type
    navigator.getBattery().then((battery) => {
      isBatterySaving = battery.level <= 0.2 && !battery.charging;
    });
  }
  
  // Consider it a low power device if it meets at least two conditions
  return (lowConcurrency && isMobile) || isBatterySaving;
}

/**
 * Hook to detect if the user prefers reduced motion
 * This is used to disable or reduce animations for users who have this preference
 * @param forceReduce - Force reduced motion regardless of user preference
 * @returns boolean indicating if reduced motion should be used
 */
export function useReducedMotion(forceReduce?: boolean) {
  // Default to false to ensure animations are enabled by default
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    // Check if the browser supports matchMedia
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    
    // Set the initial value
    setPrefersReducedMotion(mediaQuery?.matches ?? false);
    
    // Check for low power device
    setIsLowPower(isLowPowerDevice());
    
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

  // Return true if either user prefers reduced motion or we're forcing it
  return prefersReducedMotion || isLowPower || !!forceReduce;
}

/**
 * Animation configuration based on motion preference
 */
export interface AnimationConfig {
  // Transition properties
  transition: {
    duration: number;
    ease?: number[] | string;
    delay?: number;
  };
  
  // Hover animation properties
  hover: Record<string, any>;
  
  // Entrance animation properties
  entrance: Record<string, any>;
  
  // Exit animation properties
  exit: Record<string, any>;
  
  // Whether animations are enabled
  enabled: boolean;
}

/**
 * Returns appropriate animation properties based on user's motion preference
 * @param customConfig - Optional custom animation configuration
 * @returns Animation configuration object
 */
export function useAnimationConfig(customConfig?: Partial<AnimationConfig>): AnimationConfig {
  const prefersReducedMotion = useReducedMotion();
  
  return useMemo(() => {
    // Base configuration with animations enabled
    const baseConfig: AnimationConfig = {
      transition: { 
        duration: 0.3, 
        ease: [0.25, 0.1, 0.25, 1.0],
        delay: 0
      },
      hover: { 
        scale: 1.02,
        transition: { duration: 0.2 }
      },
      entrance: { 
        opacity: [0, 1], 
        y: [20, 0],
        transition: { duration: 0.4, ease: "easeOut" }
      },
      exit: {
        opacity: [1, 0],
        transition: { duration: 0.2, ease: "easeIn" }
      },
      enabled: true
    };
    
    // If reduced motion is preferred, create an accessible version
    if (prefersReducedMotion) {
      return {
        transition: { duration: 0.1, ease: "linear", delay: 0 },
        hover: {},
        entrance: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        enabled: false,
        ...customConfig
      };
    }
    
    // Return the base config with any custom overrides
    return { ...baseConfig, ...customConfig };
  }, [prefersReducedMotion, customConfig]);
}

/**
 * Returns a set of animation presets for common UI patterns
 * that respect the user's motion preferences
 */
export function useAnimationPresets() {
  const prefersReducedMotion = useReducedMotion();
  
  return useMemo(() => ({
    // Fade in animation
    fadeIn: prefersReducedMotion 
      ? { opacity: 1 }
      : { 
          opacity: [0, 1], 
          transition: { duration: 0.3, ease: "easeOut" } 
        },
    
    // Slide in from bottom
    slideInBottom: prefersReducedMotion
      ? { opacity: 1 }
      : {
          opacity: [0, 1],
          y: [20, 0],
          transition: { duration: 0.4, ease: "easeOut" }
        },
    
    // Slide in from left
    slideInLeft: prefersReducedMotion
      ? { opacity: 1 }
      : {
          opacity: [0, 1],
          x: [-20, 0],
          transition: { duration: 0.4, ease: "easeOut" }
        },
    
    // Slide in from right
    slideInRight: prefersReducedMotion
      ? { opacity: 1 }
      : {
          opacity: [0, 1],
          x: [20, 0],
          transition: { duration: 0.4, ease: "easeOut" }
        },
    
    // Scale up animation
    scaleUp: prefersReducedMotion
      ? { opacity: 1 }
      : {
          opacity: [0, 1],
          scale: [0.95, 1],
          transition: { duration: 0.3, ease: "easeOut" }
        },
    
    // Stagger children animations
    stagger: (staggerChildren = 0.05, delayChildren = 0) => ({
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : staggerChildren,
        delayChildren: prefersReducedMotion ? 0 : delayChildren
      }
    }),
    
    // Button hover animation
    buttonHover: prefersReducedMotion
      ? {}
      : {
          scale: 1.02,
          transition: { duration: 0.2 }
        },
    
    // Card hover animation
    cardHover: prefersReducedMotion
      ? {}
      : {
          y: -5,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          transition: { duration: 0.2 }
        }
  }), [prefersReducedMotion]);
} 