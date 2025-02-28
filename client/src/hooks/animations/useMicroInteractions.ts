import { useReducedMotion } from "./useReducedMotion";

/**
 * Hook to provide micro-interaction animation variants
 * Used for small UI interactions like hover, click, etc.
 */
export function useMicroInteractions() {
  const prefersReducedMotion = useReducedMotion();

  return {
    // Button hover animation
    buttonHover: prefersReducedMotion
      ? {}
      : {
          scale: 1.02,
          transition: { duration: 0.2 },
        },

    // Button tap/click animation
    buttonTap: prefersReducedMotion
      ? {}
      : {
          scale: 0.98,
          transition: { duration: 0.1 },
        },

    // Card hover animation
    cardHover: prefersReducedMotion
      ? {}
      : {
          y: -4,
          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
          transition: { duration: 0.2 },
        },

    // Icon hover animation
    iconHover: prefersReducedMotion
      ? {}
      : {
          rotate: 5,
          scale: 1.1,
          transition: { duration: 0.2 },
        },

    // Input focus animation
    inputFocus: prefersReducedMotion
      ? {}
      : {
          scale: 1.01,
          transition: { duration: 0.2 },
        },
  };
}

/**
 * Animation variants for different UI elements
 */
export const microInteractionVariants = {
  // Ripple effect for buttons
  ripple: {
    initial: { scale: 0, opacity: 0.5 },
    animate: {
      scale: 1.5,
      opacity: 0,
      transition: { duration: 0.5 },
    },
  },

  // Checkbox animation
  checkbox: {
    unchecked: { scale: 1 },
    checked: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.3 },
    },
  },

  // Toggle switch animation
  toggle: {
    off: { x: 0 },
    on: {
      x: 22,
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
  },

  // Dropdown animation
  dropdown: {
    closed: { height: 0, opacity: 0 },
    open: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3 },
    },
  },

  // Notification badge animation
  badge: {
    initial: { scale: 0 },
    animate: {
      scale: [0, 1.2, 1],
      transition: { duration: 0.3 },
    },
  },
};
