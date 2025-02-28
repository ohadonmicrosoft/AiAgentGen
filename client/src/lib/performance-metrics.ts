/**
 * Performance metrics utility for measuring and monitoring application performance
 */

export interface PerformanceMetric {
  /**
   * Name of the metric
   */
  name: string;

  /**
   * Value of the metric
   */
  value: number;

  /**
   * Unit of measurement (ms, fps, etc.)
   */
  unit: string;

  /**
   * Timestamp when the metric was recorded
   */
  timestamp: number;

  /**
   * Optional metadata about the metric
   */
  metadata?: Record<string, any>;
}

export interface PerformanceMarker {
  /**
   * Name of the marker
   */
  name: string;

  /**
   * Start time of the marker
   */
  startTime: number;

  /**
   * End time of the marker (if completed)
   */
  endTime?: number;

  /**
   * Duration of the marker (if completed)
   */
  duration?: number;

  /**
   * Optional metadata about the marker
   */
  metadata?: Record<string, any>;
}

/**
 * Class for measuring and monitoring performance metrics
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private markers: Record<string, PerformanceMarker> = {};
  private listeners: Array<(metric: PerformanceMetric) => void> = [];
  private isMonitoring = false;
  private frameCounters: Record<string, { count: number; lastTime: number }> =
    {};
  private memoryUsageInterval: number | null = null;

  /**
   * Start monitoring performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor FPS
    this.startFPSMonitoring();

    // Monitor memory usage if supported
    this.startMemoryMonitoring();

    // Monitor long tasks
    this.startLongTaskMonitoring();

    // Record initial page load metrics
    this.recordPageLoadMetrics();

    console.log('Performance monitoring started');
  }

  /**
   * Stop monitoring performance
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Stop memory monitoring
    if (this.memoryUsageInterval !== null) {
      window.clearInterval(this.memoryUsageInterval);
      this.memoryUsageInterval = null;
    }

    console.log('Performance monitoring stopped');
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>,
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Notify listeners
    this.listeners.forEach((listener) => listener(metric));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric: ${name} = ${value}${unit}`, metadata);
    }
  }

  /**
   * Start a performance marker
   */
  startMarker(name: string, metadata?: Record<string, any>): void {
    this.markers[name] = {
      name,
      startTime: performance.now(),
      metadata,
    };
  }

  /**
   * End a performance marker and record its duration
   */
  endMarker(
    name: string,
    additionalMetadata?: Record<string, any>,
  ): number | undefined {
    const marker = this.markers[name];

    if (!marker) {
      console.warn(`No marker found with name: ${name}`);
      return undefined;
    }

    marker.endTime = performance.now();
    marker.duration = marker.endTime - marker.startTime;

    if (additionalMetadata) {
      marker.metadata = { ...marker.metadata, ...additionalMetadata };
    }

    // Record as a metric
    this.recordMetric(`marker:${name}`, marker.duration, 'ms', marker.metadata);

    return marker.duration;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.name === name);
  }

  /**
   * Add a listener for new metrics
   */
  addListener(listener: (metric: PerformanceMetric) => void): () => void {
    this.listeners.push(listener);

    // Return a function to remove the listener
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Measure the execution time of a function
   */
  measureFunction<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): T {
    this.startMarker(name, metadata);
    const result = fn();
    this.endMarker(name);
    return result;
  }

  /**
   * Measure the execution time of an async function
   */
  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    this.startMarker(name, metadata);
    try {
      const result = await fn();
      this.endMarker(name);
      return result;
    } catch (error) {
      this.endMarker(name, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Start monitoring FPS
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    let frames = 0;

    const countFrame = () => {
      frames++;
      const now = performance.now();
      const elapsed = now - lastTime;

      // Calculate FPS every second
      if (elapsed >= 1000) {
        const fps = Math.round((frames * 1000) / elapsed);
        this.recordMetric('fps', fps, 'fps');

        frames = 0;
        lastTime = now;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(countFrame);
      }
    };

    requestAnimationFrame(countFrame);
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    // Check if memory API is available
    if (performance.memory) {
      this.memoryUsageInterval = window.setInterval(() => {
        const memory = (performance as any).memory;

        if (memory) {
          this.recordMetric(
            'memory:used',
            memory.usedJSHeapSize / (1024 * 1024),
            'MB',
          );
          this.recordMetric(
            'memory:total',
            memory.totalJSHeapSize / (1024 * 1024),
            'MB',
          );
          this.recordMetric(
            'memory:limit',
            memory.jsHeapSizeLimit / (1024 * 1024),
            'MB',
          );
        }
      }, 5000) as unknown as number;
    }
  }

  /**
   * Start monitoring long tasks
   */
  private startLongTaskMonitoring(): void {
    // Check if PerformanceObserver is available
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('long-task', entry.duration, 'ms', {
              startTime: entry.startTime,
              name: entry.name,
              entryType: entry.entryType,
            });
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task monitoring not supported', e);
      }
    }
  }

  /**
   * Record page load metrics
   */
  private recordPageLoadMetrics(): void {
    // Wait for the page to be fully loaded
    if (document.readyState === 'complete') {
      this.capturePageLoadMetrics();
    } else {
      window.addEventListener('load', () => this.capturePageLoadMetrics());
    }
  }

  /**
   * Capture page load metrics
   */
  private capturePageLoadMetrics(): void {
    // Use Performance API to get timing metrics
    if (performance && performance.timing) {
      const timing = performance.timing;

      // Calculate key metrics
      const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
      const tcpTime = timing.connectEnd - timing.connectStart;
      const ttfb = timing.responseStart - timing.requestStart;
      const domInteractive = timing.domInteractive - timing.navigationStart;
      const domComplete = timing.domComplete - timing.navigationStart;
      const loadTime = timing.loadEventEnd - timing.navigationStart;

      // Record metrics
      this.recordMetric('page:dns', dnsTime, 'ms');
      this.recordMetric('page:tcp', tcpTime, 'ms');
      this.recordMetric('page:ttfb', ttfb, 'ms');
      this.recordMetric('page:domInteractive', domInteractive, 'ms');
      this.recordMetric('page:domComplete', domComplete, 'ms');
      this.recordMetric('page:load', loadTime, 'ms');
    }

    // Capture paint metrics
    if (performance && typeof performance.getEntriesByType === 'function') {
      const paintMetrics = performance.getEntriesByType('paint');

      paintMetrics.forEach((metric) => {
        if (metric.name === 'first-paint') {
          this.recordMetric('paint:first', metric.startTime, 'ms');
        } else if (metric.name === 'first-contentful-paint') {
          this.recordMetric('paint:firstContentful', metric.startTime, 'ms');
        }
      });
    }
  }

  /**
   * Start measuring FPS for a specific component or feature
   */
  startComponentFPS(componentName: string): void {
    this.frameCounters[componentName] = {
      count: 0,
      lastTime: performance.now(),
    };

    const measureFPS = () => {
      const counter = this.frameCounters[componentName];

      if (!counter) return;

      counter.count++;
      const now = performance.now();
      const elapsed = now - counter.lastTime;

      if (elapsed >= 1000) {
        const fps = Math.round((counter.count * 1000) / elapsed);
        this.recordMetric(`component:${componentName}:fps`, fps, 'fps');

        counter.count = 0;
        counter.lastTime = now;
      }

      if (this.isMonitoring && this.frameCounters[componentName]) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Stop measuring FPS for a specific component
   */
  stopComponentFPS(componentName: string): void {
    delete this.frameCounters[componentName];
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMonitoring(componentName: string): {
  measureRender: (renderName: string) => void;
  measureEffect: (
    effectName: string,
    fn: () => void | (() => void),
  ) => void | (() => void);
  measureAsyncEffect: (
    effectName: string,
    fn: () => Promise<void | (() => void)>,
  ) => Promise<void | (() => void)>;
} {
  const measureRender = (renderName: string): void => {
    performanceMonitor.recordMetric(
      `component:${componentName}:render:${renderName}`,
      performance.now(),
      'ms',
    );
  };

  const measureEffect = (
    effectName: string,
    fn: () => void | (() => void),
  ): void | (() => void) => {
    const markerName = `component:${componentName}:effect:${effectName}`;
    performanceMonitor.startMarker(markerName);

    const result = fn();
    performanceMonitor.endMarker(markerName);

    return result;
  };

  const measureAsyncEffect = async (
    effectName: string,
    fn: () => Promise<void | (() => void)>,
  ): Promise<void | (() => void)> => {
    const markerName = `component:${componentName}:asyncEffect:${effectName}`;
    performanceMonitor.startMarker(markerName);

    try {
      const result = await fn();
      performanceMonitor.endMarker(markerName);
      return result;
    } catch (error) {
      performanceMonitor.endMarker(markerName, { error: String(error) });
      throw error;
    }
  };

  return {
    measureRender,
    measureEffect,
    measureAsyncEffect,
  };
}
