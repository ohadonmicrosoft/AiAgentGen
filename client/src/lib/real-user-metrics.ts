/**
 * Real User Metrics (RUM) for monitoring application performance in production
 */

import { PerformanceMetric, performanceMonitor } from './performance-metrics';

// Metric types
export type CoreWebVitalMetric = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP';
export type NavigationMetric = 'navigationStart' | 'domComplete' | 'loadComplete';
export type CustomMetric = 'jsHeapUsed' | 'jsHeapTotal' | 'domNodes' | 'firstContentfulRender';

/**
 * All real user metrics types
 */
export type UserMetric = CoreWebVitalMetric | NavigationMetric | CustomMetric;

/**
 * RUM configuration options
 */
export interface RUMConfig {
  /**
   * Enable RUM collection
   * @default true in production, false otherwise
   */
  enabled: boolean;

  /**
   * Sampling rate (0-1) to determine what percentage of users to collect data from
   * @default 0.1 (10%)
   */
  samplingRate: number;

  /**
   * Endpoint to send metrics to
   * @default '/api/metrics'
   */
  endpoint: string;

  /**
   * Batch size for sending metrics
   * @default 10
   */
  batchSize: number;

  /**
   * Maximum time to wait before sending metrics (in ms)
   * @default 30000 (30 seconds)
   */
  maxWaitTime: number;

  /**
   * Additional data to include with metrics
   */
  metadata?: Record<string, any>;

  /**
   * Include route information in metrics
   * @default true
   */
  includeRouteInfo: boolean;

  /**
   * Include user agent information in metrics
   * @default true
   */
  includeUserAgent: boolean;

  /**
   * Include connection information in metrics
   * @default true
   */
  includeConnectionInfo: boolean;

  /**
   * Include device information in metrics
   * @default true
   */
  includeDeviceInfo: boolean;
}

/**
 * Default RUM configuration
 */
const defaultConfig: RUMConfig = {
  enabled: process.env.NODE_ENV === 'production',
  samplingRate: 0.1, // 10% of users
  endpoint: '/api/metrics',
  batchSize: 10,
  maxWaitTime: 30000, // 30 seconds
  includeRouteInfo: true,
  includeUserAgent: true,
  includeConnectionInfo: true,
  includeDeviceInfo: true,
};

/**
 * RUM user session information
 */
interface UserSession {
  /**
   * Session ID
   */
  id: string;

  /**
   * Session start time
   */
  startTime: number;

  /**
   * User agent information
   */
  userAgent?: {
    browser: string;
    version: string;
    os: string;
    mobile: boolean;
  };

  /**
   * Connection information
   */
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };

  /**
   * Device information
   */
  device?: {
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
  };
}

/**
 * RUM implementation
 */
class RealUserMetrics {
  private config: RUMConfig;
  private metricsQueue: PerformanceMetric[] = [];
  private session: UserSession;
  private flushTimeout: number | null = null;
  private isInitialized = false;
  private isEnabled = false;

  /**
   * Constructor
   */
  constructor(config: Partial<RUMConfig> = {}) {
    // Merge config with defaults
    this.config = { ...defaultConfig, ...config };

    // Create user session
    this.session = {
      id: this.generateSessionId(),
      startTime: Date.now(),
    };

    // Determine if this session should collect metrics based on sampling rate
    this.isEnabled = this.config.enabled && Math.random() <= this.config.samplingRate;
  }

  /**
   * Initialize RUM
   */
  initialize(): void {
    if (this.isInitialized || !this.isEnabled) return;

    // Collect device/browser information if enabled
    this.collectEnvironmentInfo();

    // Set up performance observer for core web vitals
    this.setupPerformanceObservers();

    // Collect navigation timing metrics
    this.collectNavigationTiming();

    // Listen for metrics from the performance monitor
    this.listenToPerformanceMonitor();

    // Set up visibility change listener to flush metrics when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });

    // Set up page unload listener to flush metrics
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Mark as initialized
    this.isInitialized = true;

    // Log initialization
    console.log('Real User Metrics initialized');
  }

  /**
   * Manually track a metric
   */
  trackMetric(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.addMetricToQueue({
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Manually track an error
   */
  trackError(error: Error, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.addMetricToQueue({
      name: 'error',
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });

    // Force flush errors immediately
    this.flush();
  }

  /**
   * Add a metric to the queue and schedule a flush if needed
   */
  private addMetricToQueue(metric: PerformanceMetric): void {
    // Add the metric to the queue
    this.metricsQueue.push(metric);

    // If we've reached the batch size, flush immediately
    if (this.metricsQueue.length >= this.config.batchSize) {
      this.flush();
      return;
    }

    // Otherwise, set a timeout to flush after maxWaitTime if not already set
    if (this.flushTimeout === null) {
      this.flushTimeout = window.setTimeout(() => {
        this.flush();
        this.flushTimeout = null;
      }, this.config.maxWaitTime);
    }
  }

  /**
   * Flush metrics to the server
   */
  private flush(isUnloading: boolean = false): void {
    if (!this.isEnabled || this.metricsQueue.length === 0) return;

    // Clear any pending flush timeout
    if (this.flushTimeout !== null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    // Prepare the metrics payload
    const payload = {
      session: this.session,
      metrics: [...this.metricsQueue],
      metadata: {
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        ...this.config.metadata,
      },
    };

    // Clear the queue
    this.metricsQueue = [];

    // If the page is unloading, use sendBeacon for better reliability
    if (isUnloading && navigator.sendBeacon) {
      navigator.sendBeacon(this.config.endpoint, JSON.stringify(payload));
      return;
    }

    // Otherwise use fetch
    fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Use keepalive to ensure the request completes even if the page changes
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to send metrics:', error);
    });
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Collect environment information
   */
  private collectEnvironmentInfo(): void {
    // Collect user agent information
    if (this.config.includeUserAgent) {
      const ua = navigator.userAgent;
      const uaParseResult = {
        browser: this.getBrowserName(ua),
        version: this.getBrowserVersion(ua),
        os: this.getOS(ua),
        mobile: /Mobi|Android/i.test(ua),
      };

      this.session.userAgent = uaParseResult;
    }

    // Collect connection information
    if (this.config.includeConnectionInfo && 'connection' in navigator) {
      const connection = (navigator as any).connection;

      if (connection) {
        this.session.connection = {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
        };
      }
    }

    // Collect device information
    if (this.config.includeDeviceInfo) {
      this.session.device = {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1,
      };
    }
  }

  /**
   * Set up performance observers for core web vitals
   */
  private setupPerformanceObservers(): void {
    if (!window.PerformanceObserver) return;

    try {
      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const fcp = entries[0] as PerformanceEntry;
          this.trackMetric('FCP', fcp.startTime, 'ms');
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        // We want the latest LCP event
        if (entries.length > 0) {
          const lcp = entries[entries.length - 1] as PerformanceEntry;
          this.trackMetric('LCP', lcp.startTime, 'ms', {
            element: (lcp as any).element ? (lcp as any).element.tagName : null,
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const fid = entries[0] as PerformanceEventTiming;
          this.trackMetric('FID', fid.processingStart - fid.startTime, 'ms');
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Layout Shift (CLS)
      let cumulativeLayoutShift = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Skip layout shifts that occur after user input
          if (!(entry as any).hadRecentInput) {
            cumulativeLayoutShift += (entry as any).value;
            this.trackMetric('CLS', cumulativeLayoutShift, 'score');
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Long Tasks
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          this.trackMetric('longTask', entry.duration, 'ms', {
            url: document.URL,
            taskName: entry.name,
          });
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });

      // Resource Timing
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          // Only track key resources (CSS, JS, fonts, images)
          const url = entry.name;
          if (
            url.includes(window.location.origin) &&
            (url.endsWith('.js') ||
              url.endsWith('.css') ||
              url.includes('fonts') ||
              url.match(/\.(png|jpg|jpeg|gif|svg)$/))
          ) {
            this.trackMetric('resourceLoad', entry.duration, 'ms', {
              url: entry.name,
              initiatorType: (entry as PerformanceResourceTiming).initiatorType,
              size: (entry as PerformanceResourceTiming).transferSize || 0,
            });
          }
        }
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (error) {
      console.error('Error setting up performance observers:', error);
    }
  }

  /**
   * Collect navigation timing metrics
   */
  private collectNavigationTiming(): void {
    // Wait for the load event to complete
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (!window.performance || !window.performance.timing) return;

        const timing = window.performance.timing;

        // Time to First Byte (TTFB)
        const ttfb = timing.responseStart - timing.navigationStart;
        this.trackMetric('TTFB', ttfb, 'ms');

        // DOM Content Loaded
        const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.trackMetric('domContentLoaded', domContentLoaded, 'ms');

        // DOM Complete
        const domComplete = timing.domComplete - timing.navigationStart;
        this.trackMetric('domComplete', domComplete, 'ms');

        // Load Complete
        const loadComplete = timing.loadEventEnd - timing.navigationStart;
        this.trackMetric('loadComplete', loadComplete, 'ms');
      }, 0);
    });
  }

  /**
   * Listen to metrics from the performance monitor
   */
  private listenToPerformanceMonitor(): void {
    performanceMonitor.addListener((metric) => {
      // Only track certain metrics to avoid too much data
      if (
        metric.name.startsWith('component:') ||
        metric.name.startsWith('api:') ||
        metric.name.startsWith('render:') ||
        metric.name.startsWith('navigation:')
      ) {
        this.addMetricToQueue(metric);
      }
    });
  }

  /**
   * Get browser name from user agent
   */
  private getBrowserName(ua: string): string {
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung Browser';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('MSIE') > -1) return 'Internet Explorer';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Unknown';
  }

  /**
   * Get browser version from user agent
   */
  private getBrowserVersion(ua: string): string {
    const browser = this.getBrowserName(ua);
    let match;

    switch (browser) {
      case 'Firefox':
        match = ua.match(/Firefox\/([0-9.]+)/);
        break;
      case 'Samsung Browser':
        match = ua.match(/SamsungBrowser\/([0-9.]+)/);
        break;
      case 'Opera':
        match = ua.match(/(?:Opera|OPR)\/([0-9.]+)/);
        break;
      case 'Edge':
        match = ua.match(/Edge\/([0-9.]+)/);
        break;
      case 'Internet Explorer':
        match = ua.match(/MSIE ([0-9.]+)/);
        break;
      case 'Chrome':
        match = ua.match(/Chrome\/([0-9.]+)/);
        break;
      case 'Safari':
        match = ua.match(/Version\/([0-9.]+).*Safari/);
        break;
      default:
        return 'Unknown';
    }

    return match ? match[1] : 'Unknown';
  }

  /**
   * Get operating system from user agent
   */
  private getOS(ua: string): string {
    if (ua.indexOf('Windows NT 10.0') > -1) return 'Windows 10';
    if (ua.indexOf('Windows NT 6.3') > -1) return 'Windows 8.1';
    if (ua.indexOf('Windows NT 6.2') > -1) return 'Windows 8';
    if (ua.indexOf('Windows NT 6.1') > -1) return 'Windows 7';
    if (ua.indexOf('Windows NT') > -1) return 'Windows';
    if (ua.indexOf('Mac OS X') > -1) return 'macOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1)
      return 'iOS';
    return 'Unknown';
  }
}

// Create a singleton instance
export const realUserMetrics = new RealUserMetrics();

// Initialize by default
if (typeof window !== 'undefined') {
  // Wait for the DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      realUserMetrics.initialize();
    });
  } else {
    realUserMetrics.initialize();
  }
}

// Export the RealUserMetrics class for testing and custom instances
export { RealUserMetrics };
