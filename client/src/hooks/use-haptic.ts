import { useCallback } from 'react';
import { useIsMobile } from './use-mobile';
import { logger } from '@/lib/logger';

/**
 * Haptic patterns for different feedback types
 */
export type HapticPattern =
  | 'success' // A single short vibration for success
  | 'error' // Three short vibrations for error
  | 'warning' // Two short vibrations for warning
  | 'light' // Very subtle feedback for regular interactions
  | 'medium' // Standard feedback for important interactions
  | 'heavy' // Strong feedback for critical interactions
  | number[]; // Custom pattern of vibration durations and pauses in ms

/**
 * Hook that provides haptic feedback functionality on supported devices.
 * Gracefully degrades when haptic feedback is not available.
 */
export function useHaptic() {
  const isMobile = useIsMobile();

  /**
   * Check if vibration is supported on this device
   */
  const isSupported =
    typeof navigator !== 'undefined' && 'vibrate' in navigator;

  /**
   * Trigger haptic feedback with the specified pattern.
   */
  const trigger = useCallback(
    (pattern: HapticPattern = 'medium') => {
      // Don't do anything if not on mobile or vibration not supported
      if (!isMobile || !isSupported) return false;

      try {
        // Convert named patterns to vibration durations
        let vibrationPattern: number | number[];

        if (typeof pattern === 'string') {
          switch (pattern) {
            case 'success':
              vibrationPattern = [40];
              break;
            case 'error':
              vibrationPattern = [60, 50, 60, 50, 60];
              break;
            case 'warning':
              vibrationPattern = [30, 50, 30];
              break;
            case 'light':
              vibrationPattern = [10];
              break;
            case 'medium':
              vibrationPattern = [35];
              break;
            case 'heavy':
              vibrationPattern = [80];
              break;
            default:
              vibrationPattern = [50];
          }
        } else {
          // Use custom pattern
          vibrationPattern = pattern;
        }

        // Trigger vibration
        return navigator.vibrate(vibrationPattern);
      } catch (error) {
        logger.error('Error triggering haptic feedback:', { error, pattern });
        return false;
      }
    },
    [isMobile, isSupported],
  );

  /**
   * Stop any ongoing vibration
   */
  const stop = useCallback(() => {
    if (!isMobile || !isSupported) return false;

    try {
      return navigator.vibrate(0);
    } catch (error) {
      logger.error('Error stopping haptic feedback:', { error });
      return false;
    }
  }, [isMobile, isSupported]);

  /**
   * Helper methods for common feedback types
   */
  const success = useCallback(() => trigger('success'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);
  const warning = useCallback(() => trigger('warning'), [trigger]);
  const light = useCallback(() => trigger('light'), [trigger]);
  const medium = useCallback(() => trigger('medium'), [trigger]);
  const heavy = useCallback(() => trigger('heavy'), [trigger]);

  return {
    isSupported,
    trigger,
    stop,
    success,
    error,
    warning,
    light,
    medium,
    heavy,
  };
}

/**
 * Example usage:
 *
 * ```tsx
 * function MyComponent() {
 *   const haptic = useHaptic();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await submitForm();
 *       haptic.success();
 *     } catch (error) {
 *       haptic.error();
 *     }
 *   };
 *
 *   return (
 *     <button
 *       onClick={() => {
 *         haptic.light(); // Light feedback on click
 *         handleSubmit();
 *       }}
 *     >
 *       Submit
 *     </button>
 *   );
 * }
 * ```
 */
