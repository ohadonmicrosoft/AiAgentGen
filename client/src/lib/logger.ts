import { formatErrorForLogging } from './api-error';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  tags?: string[];
}

interface LoggerOptions {
  minLevel?: LogLevel;
  enableConsole?: boolean;
  enableRemoteLogging?: boolean;
  remoteLoggingUrl?: string;
  batchSize?: number;
  flushInterval?: number;
  appVersion?: string;
  environment?: string;
}

// Default options
const DEFAULT_OPTIONS: LoggerOptions = {
  minLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableConsole: true,
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  remoteLoggingUrl: '/api/logs',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  appVersion: process.env.APP_VERSION || 'unknown',
  environment: process.env.NODE_ENV || 'development',
};

// Log level priority order
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger service for client-side logging with batched remote logging capability
 */
class LoggerService {
  private options: LoggerOptions;
  private logQueue: LogEntry[] = [];
  private flushTimerId: number | null = null;
  private isFlushing = false;
  private userId: string | null = null;
  private sessionId: string;

  constructor(options: LoggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();

    if (this.options.enableRemoteLogging) {
      this.startFlushTimer();
    }
  }

  /**
   * Set the current user ID for logs
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('debug', message, context, tags);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('info', message, context, tags);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>, tags?: string[]): void {
    this.log('warn', message, context, tags);
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    error?: unknown,
    context?: Record<string, any>,
    tags?: string[],
  ): void {
    // Format the error if provided
    const errorContext = error
      ? {
          ...context,
          error: formatErrorForLogging(error),
        }
      : context;

    this.log('error', message, errorContext, tags);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    tags?: string[],
  ): void {
    // Check if this log level should be processed
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      tags,
    };

    // Log to console if enabled
    if (this.options.enableConsole) {
      this.logToConsole(entry);
    }

    // Add to remote logging queue if enabled
    if (this.options.enableRemoteLogging) {
      this.queueLog(entry);
    }
  }

  /**
   * Check if the log level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    const minLevelPriority =
      LOG_LEVEL_PRIORITY[this.options.minLevel || 'debug'];
    const currentLevelPriority = LOG_LEVEL_PRIORITY[level];
    return currentLevelPriority >= minLevelPriority;
  }

  /**
   * Log to the console with appropriate styling
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}`, entry.context || '');
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}`, entry.context || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}`, entry.context || '');
        break;
      case 'error':
        console.error(`${prefix} ${entry.message}`, entry.context || '');
        break;
    }
  }

  /**
   * Add a log entry to the queue for remote logging
   */
  private queueLog(entry: LogEntry): void {
    this.logQueue.push(entry);

    // If we've reached batch size, flush immediately
    if (this.logQueue.length >= (this.options.batchSize || 10)) {
      this.flush();
    }
  }

  /**
   * Start the timer for periodic log flushing
   */
  private startFlushTimer(): void {
    if (this.flushTimerId !== null) {
      clearInterval(this.flushTimerId);
    }

    this.flushTimerId = window.setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
  }

  /**
   * Send queued logs to the remote logging endpoint
   */
  async flush(): Promise<void> {
    // Don't flush if already flushing, no logs, or not enabled
    if (
      this.isFlushing ||
      this.logQueue.length === 0 ||
      !this.options.enableRemoteLogging
    ) {
      return;
    }

    this.isFlushing = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      // Add metadata to the log batch
      const payload = {
        logs: logsToSend,
        metadata: {
          sessionId: this.sessionId,
          userId: this.userId,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          appVersion: this.options.appVersion,
          environment: this.options.environment,
        },
      };

      // Send logs to the server
      const response = await fetch(
        this.options.remoteLoggingUrl || '/api/logs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          // Don't let this request slow down the application
          keepalive: true,
        },
      );

      if (!response.ok) {
        // Add logs back to the queue on failure
        this.logQueue = [...logsToSend, ...this.logQueue];
        console.error(
          `Failed to send logs: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      // Add logs back to the queue on error
      this.logQueue = [...logsToSend, ...this.logQueue];
      console.error('Error sending logs:', error);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Setup global error handlers for uncaught errors and promise rejections
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.error(
        'Uncaught error',
        event.error || event.message,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        ['uncaught', 'global'],
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', event.reason, {}, [
        'unhandled-rejection',
        'global',
      ]);
    });
  }

  /**
   * Flush logs before the page unloads
   */
  setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }
}

// Create and export a singleton instance
export const logger = new LoggerService();

// Setup the beforeunload handler
if (typeof window !== 'undefined') {
  logger.setupBeforeUnloadHandler();
}

/**
 * Example usage:
 *
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * // Basic logging
 * logger.debug('This is a debug message');
 * logger.info('User signed in', { userId: 'user123' });
 * logger.warn('API rate limit approaching', { remainingCalls: 10 });
 * logger.error('Failed to load data', error, { componentName: 'UserProfile' });
 *
 * // With tags for better filtering
 * logger.info('Page loaded', { page: '/dashboard' }, ['performance', 'pageview']);
 * ```
 */
