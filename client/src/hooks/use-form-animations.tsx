import { useReducedMotion } from './use-reduced-motion';

export interface FormAnimationConfig {
  /**
   * How strong the spring effect should be (higher = more bouncy)
   * Default: 400
   */
  stiffness?: number;
  /**
   * How quickly the spring effect should dampen (higher = less bouncy)
   * Default: 25
   */
  damping?: number;
  /**
   * Duration for tween animations in seconds
   * Default: 0.2
   */
  duration?: number;
}

/**
 * Returns animation variants and transitions for form validation feedback
 */
export function useFormAnimations(config?: FormAnimationConfig) {
  const prefersReducedMotion = useReducedMotion();

  // Default config values
  const { stiffness = 400, damping = 25, duration = 0.2 } = config || {};

  // Transition based on reduced motion preference
  const getTransition = (type: 'spring' | 'tween' = 'spring') => {
    if (prefersReducedMotion) {
      return { duration: 0 };
    }

    return type === 'spring'
      ? {
          type: 'spring',
          stiffness,
          damping,
        }
      : {
          type: 'tween',
          duration,
        };
  };

  // Input variants
  const inputVariants = {
    idle: {
      scale: 1,
      borderColor: 'hsl(var(--input))',
      boxShadow: 'none',
    },
    focus: {
      scale: 1,
      borderColor: 'hsl(var(--primary))',
      boxShadow: '0 0 0 2px hsl(var(--primary) / 0.2)',
    },
    error: {
      scale: [1, 1.02, 1],
      borderColor: 'hsl(var(--destructive))',
      boxShadow: '0 0 0 2px hsl(var(--destructive) / 0.2)',
    },
    success: {
      borderColor: 'hsl(var(--success, 142 69% 58%))',
      boxShadow: '0 0 0 2px hsl(var(--success, 142 69% 58%) / 0.2)',
    },
  };

  // Label variants
  const labelVariants = {
    idle: {
      y: 0,
      scale: 1,
      color: 'hsl(var(--muted-foreground))',
    },
    focus: {
      y: -12,
      scale: 0.85,
      color: 'hsl(var(--primary))',
    },
    filled: {
      y: -12,
      scale: 0.85,
      color: 'hsl(var(--muted-foreground))',
    },
    error: {
      y: -12,
      scale: 0.85,
      color: 'hsl(var(--destructive))',
    },
  };

  // Error message variants
  const errorVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      height: 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      height: 'auto',
    },
    exit: {
      opacity: 0,
      y: -10,
      height: 0,
    },
  };

  // Success icon variants
  const successIconVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
    },
    visible: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0,
    },
  };

  return {
    inputVariants,
    labelVariants,
    errorVariants,
    successIconVariants,
    getTransition,
  };
}
