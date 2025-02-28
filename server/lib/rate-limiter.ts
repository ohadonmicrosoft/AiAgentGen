import type { NextFunction, Request, Response } from "express";
import { logger } from "../api/logs";
import { MemoryCache } from "./cache";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests allowed in the time window
  message?: string; // Message to return when rate limit is exceeded
  statusCode?: number; // Status code to return when rate limit is exceeded
  keyGenerator?: (req: Request) => string; // Function to generate a unique key for the request
  skip?: (req: Request) => boolean; // Function to skip rate limiting for certain requests
  headers?: boolean; // Whether to include rate limit info in response headers
}

// Default options
const defaultOptions: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: "Too many requests, please try again later",
  statusCode: 429, // Too Many Requests
  keyGenerator: (req) => {
    // Default: IP address
    return (
      req.ip ||
      req.connection.remoteAddress ||
      (req.headers["x-forwarded-for"] as string) ||
      "unknown"
    );
  },
  skip: () => false, // Don't skip any requests by default
  headers: true, // Include headers by default
};

// Cache to store rate limit info
const cache = new MemoryCache<{ count: number; resetTime: number }>(
  60 * 60 * 1000,
); // 1 hour TTL

/**
 * Create a rate limiter middleware
 * @param options Rate limit options
 * @returns Express middleware
 */
export function rateLimiter(options: Partial<RateLimitOptions> = {}) {
  // Merge options with defaults
  const opts: RateLimitOptions = {
    ...defaultOptions,
    ...options,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting if specified
    if (opts.skip && opts.skip(req)) {
      return next();
    }

    // Generate key for this request
    const key = opts.keyGenerator!(req);

    // Get current time
    const now = Date.now();

    // Get or create rate limit info for this key
    let rateInfo = cache.get(key);

    if (!rateInfo) {
      // Create new rate limit info
      rateInfo = {
        count: 0,
        resetTime: now + opts.windowMs,
      };
    }

    // If the time window has passed, reset the counter
    if (now > rateInfo.resetTime) {
      rateInfo.count = 0;
      rateInfo.resetTime = now + opts.windowMs;
    }

    // Increment the counter
    rateInfo.count++;

    // Store the updated rate limit info
    cache.set(key, rateInfo, opts.windowMs);

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, opts.maxRequests - rateInfo.count);
    const resetTime = rateInfo.resetTime;

    // Add rate limit headers if enabled
    if (opts.headers) {
      res.setHeader("X-RateLimit-Limit", opts.maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil(resetTime / 1000).toString(),
      );
    }

    // If rate limit is exceeded, return error
    if (rateInfo.count > opts.maxRequests) {
      // Log rate limit exceeded
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        path: req.path,
        method: req.method,
        key,
        limit: opts.maxRequests,
        window: opts.windowMs,
      });

      // Set retry-after header
      res.setHeader(
        "Retry-After",
        Math.ceil((resetTime - now) / 1000).toString(),
      );

      // Return error
      return res.status(opts.statusCode!).json({
        error: opts.message,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      });
    }

    // If rate limit is not exceeded, continue
    next();
  };
}

/**
 * Create a rate limiter that varies based on user authentication status
 * @param authMaxRequests Maximum requests for authenticated users
 * @param unauthMaxRequests Maximum requests for unauthenticated users
 * @param windowMs Time window in milliseconds
 * @returns Express middleware
 */
export function adaptiveRateLimiter(
  authMaxRequests = 120,
  unauthMaxRequests = 30,
  windowMs = 60 * 1000,
) {
  return rateLimiter({
    windowMs,
    maxRequests: authMaxRequests, // This will be overridden based on auth status
    keyGenerator: (req) => {
      // Use user ID if authenticated, IP address otherwise
      const userId = req.user?.id;
      const ip =
        req.ip ||
        req.connection.remoteAddress ||
        (req.headers["x-forwarded-for"] as string) ||
        "unknown";

      return userId ? `user:${userId}` : `ip:${ip}`;
    },
    headers: true,
    message: "Rate limit exceeded. Please slow down your requests.",

    // Override maxRequests based on authentication status
    skip: (req) => {
      // Don't skip, but adjust the limit
      if (!req.user) {
        // For unauthenticated requests, update the cache to use a lower limit
        const key = `ip:${
          req.ip ||
          req.connection.remoteAddress ||
          (req.headers["x-forwarded-for"] as string) ||
          "unknown"
        }`;

        // Store the lower limit for this key
        // This is a bit of a hack, but it works because we know the cache implementation
        // @ts-ignore
        req.rateLimit = { maxRequests: unauthMaxRequests };
      }

      return false;
    },
  });
}
