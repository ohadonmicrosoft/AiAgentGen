/**
 * Viewport Utilities
 *
 * This file contains utilities for handling viewport-specific layout issues
 * and optimizing the mobile experience.
 */

/**
 * Adjusts the viewport height to account for mobile browser chrome.
 * This solves the "100vh" problem on mobile browsers where the viewport height
 * includes the address bar, which can cause layout issues.
 */
export function setupViewportHeight(): void {
  // Only run in the browser
  if (typeof window === 'undefined') return;

  // Function to set the CSS variable
  const setViewportHeight = () => {
    // Get the actual viewport height
    const vh = window.innerHeight * 0.01;
    // Set the CSS variable
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set the height initially
  setViewportHeight();

  // Update the height on resize and orientation change
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
}

/**
 * Prevents overscroll/bounce effects on iOS
 */
export function preventIOSOverscroll(): void {
  // Only run in the browser
  if (typeof window === 'undefined') return;

  // Check if the device is iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  if (isIOS) {
    // Prevent touchmove events on the body when at the edge
    document.body.addEventListener(
      'touchmove',
      (e) => {
        // Allow scrolling in elements that should scroll
        if ((e.target as HTMLElement).closest('.allow-scroll')) {
          return;
        }

        e.preventDefault();
      },
      { passive: false },
    );
  }
}

/**
 * Handles the virtual keyboard on mobile devices to prevent layout issues
 */
export function handleVirtualKeyboard(): void {
  // Only run in the browser
  if (typeof window === 'undefined') return;

  // Function to handle focus on input elements
  const handleFocus = (e: FocusEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      // Add a class to the body when the keyboard is likely visible
      document.body.classList.add('keyboard-visible');

      // On iOS, scroll the element into view with a delay
      setTimeout(() => {
        (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  // Function to handle blur on input elements
  const handleBlur = () => {
    // Remove the class when the keyboard is likely hidden
    document.body.classList.remove('keyboard-visible');
  };

  // Add event listeners
  document.addEventListener('focus', handleFocus, true);
  document.addEventListener('blur', handleBlur, true);
}

/**
 * Detects if the device supports touch events
 */
export function isTouchDevice(): boolean {
  // Only run in the browser
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Initializes all viewport utilities
 */
export function initViewportUtils(): void {
  setupViewportHeight();
  preventIOSOverscroll();
  handleVirtualKeyboard();
}

/**
 * Hook to use the viewport height CSS variable
 * Usage: height: calc(var(--vh, 1vh) * 100);
 */
export function useViewportHeight(): string {
  return 'calc(var(--vh, 1vh) * 100)';
}
