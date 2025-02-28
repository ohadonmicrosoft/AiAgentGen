import { PerformanceMetric, performanceMonitor } from '@/lib/performance-metrics';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options for the usePerformance hook
 */
export interface UsePerformanceOptions {
  /**
   * Component or feature name for tracking
   */
  name: string;

  /**
   * Whether to automatically track FPS
   * @default false
   */
  trackFPS?: boolean;

  /**
   * Whether to automatically track render times
   * @default true
   */
  trackRenders?: boolean;

  /**
   * Whether to automatically start monitoring
   * @default true
   */
  autoStart?: boolean;

  /**
   * Filter for metrics to track
   */
  metricFilter?: (metric: PerformanceMetric) => boolean;
}

/**
 * Hook for monitoring performance in React components
 *
 * @example
 * const {
 *   metrics,
 *   startTracking,
 *   stopTracking,
 *   trackOperation
 * } = usePerformance({ name: 'MyComponent' });
 */
export function usePerformance({
  name,
  trackFPS = false,
  trackRenders = true,
  autoStart = true,
  metricFilter,
}: UsePerformanceOptions) {
  const [isTracking, setIsTracking] = useState(autoStart);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  // Start tracking performance
  const startTracking = useCallback(() => {
    if (isTracking) return;

    setIsTracking(true);

    if (trackFPS) {
      performanceMonitor.startComponentFPS(name);
    }

    performanceMonitor.recordMetric(`component:${name}:tracking:start`, performance.now(), 'ms');
  }, [isTracking, name, trackFPS]);

  // Stop tracking performance
  const stopTracking = useCallback(() => {
    if (!isTracking) return;

    setIsTracking(false);

    if (trackFPS) {
      performanceMonitor.stopComponentFPS(name);
    }

    performanceMonitor.recordMetric(`component:${name}:tracking:stop`, performance.now(), 'ms');
  }, [isTracking, name, trackFPS]);

  // Track a specific operation
  const trackOperation = useCallback(
    (operationName: string, operation: () => any, metadata?: Record<string, any>) => {
      if (!isTracking) return operation();

      return performanceMonitor.measureFunction(
        `component:${name}:operation:${operationName}`,
        operation,
        metadata,
      );
    },
    [isTracking, name],
  );

  // Track an async operation
  const trackAsyncOperation = useCallback(
    async (
      operationName: string,
      operation: () => Promise<any>,
      metadata?: Record<string, any>,
    ) => {
      if (!isTracking) return operation();

      return performanceMonitor.measureAsyncFunction(
        `component:${name}:operation:${operationName}`,
        operation,
        metadata,
      );
    },
    [isTracking, name],
  );

  // Mark a point in time
  const markPoint = useCallback(
    (pointName: string, metadata?: Record<string, any>) => {
      if (!isTracking) return;

      performanceMonitor.recordMetric(
        `component:${name}:point:${pointName}`,
        performance.now(),
        'ms',
        metadata,
      );
    },
    [isTracking, name],
  );

  // Track render time
  useEffect(() => {
    if (!isTracking || !trackRenders) return;

    const now = performance.now();
    const renderTime = now - lastRenderTimeRef.current;
    renderCountRef.current += 1;

    performanceMonitor.recordMetric(`component:${name}:render`, renderTime, 'ms', {
      renderCount: renderCountRef.current,
    });

    lastRenderTimeRef.current = now;
  });

  // Subscribe to metrics
  useEffect(() => {
    if (!isTracking) return;

    // Add listener for new metrics
    const removeListener = performanceMonitor.addListener((metric) => {
      // Only track metrics for this component or global metrics
      if (
        metric.name.startsWith(`component:${name}:`) ||
        (!metric.name.startsWith('component:') && metricFilter?.(metric) !== false)
      ) {
        setMetrics((prev) => [...prev, metric]);
      }
    });

    return () => {
      removeListener();
    };
  }, [isTracking, name, metricFilter]);

  // Start/stop tracking based on isTracking
  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      if (isTracking) {
        performanceMonitor.recordMetric(`component:${name}:unmount`, performance.now(), 'ms', {
          renderCount: renderCountRef.current,
        });

        if (trackFPS) {
          performanceMonitor.stopComponentFPS(name);
        }
      }
    };
  }, [isTracking, name, startTracking, stopTracking, trackFPS]);

  return {
    isTracking,
    metrics,
    startTracking,
    stopTracking,
    trackOperation,
    trackAsyncOperation,
    markPoint,
  };
}

/**
 * Hook for measuring the performance of a specific component operation
 */
export function useOperationPerformance(componentName: string, operationName: string) {
  const startTimeRef = useRef(0);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    performanceMonitor.startMarker(`component:${componentName}:operation:${operationName}`);
  }, [componentName, operationName]);

  const end = useCallback(
    (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTimeRef.current;
      performanceMonitor.endMarker(
        `component:${componentName}:operation:${operationName}`,
        metadata,
      );
      return duration;
    },
    [componentName, operationName],
  );

  return { start, end };
}

/**
 * Hook for measuring the time between renders
 */
export function useRenderPerformance(componentName: string) {
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;

    performanceMonitor.recordMetric(
      `component:${componentName}:renderInterval`,
      timeSinceLastRender,
      'ms',
    );

    lastRenderTimeRef.current = now;
  });
}

/**
 * Initialize performance monitoring for the entire application
 */
export function initializePerformanceMonitoring() {
  performanceMonitor.startMonitoring();

  // Log when monitoring starts
  console.log('Performance monitoring initialized');

  return {
    stopMonitoring: () => performanceMonitor.stopMonitoring(),
    getMetrics: () => performanceMonitor.getMetrics(),
    clearMetrics: () => performanceMonitor.clearMetrics(),
  };
}
