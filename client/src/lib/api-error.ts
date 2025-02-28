import { logger } from "@/lib/logger";

// Create a dedicated logger instance for API errors
const logger = new Logger("ApiError");

// Error categories for better error handling
export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  SERVER = "server",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

/**
 * Standardized API error class with additional context
 */
export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  public endpoint: string;
  public category: ErrorCategory;
  public requestId?: string;
  public timestamp: Date;

  constructor(
    message: string,
    status: number,
    statusText: string,
    endpoint: string,
    data?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.endpoint = endpoint;
    this.data = data;
    this.requestId = requestId;
    this.timestamp = new Date();
    this.category = this.determineCategory();
  }

  /**
   * Determine the error category based on status code and other factors
   */
  private determineCategory(): ErrorCategory {
    if (this.status === 401) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (this.status === 403) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (this.status === 404) {
      return ErrorCategory.NOT_FOUND;
    }
    if (this.status === 408 || this.status === 504) {
      return ErrorCategory.TIMEOUT;
    }
    if (this.status === 422) {
      return ErrorCategory.VALIDATION;
    }
    if (this.status >= 400 && this.status < 500) {
      return ErrorCategory.VALIDATION;
    }
    if (this.status >= 500) {
      return ErrorCategory.SERVER;
    }
    return ErrorCategory.UNKNOWN;
  }

  /**
   * Returns true if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Returns true if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Returns true if this is an authentication error (401)
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Returns true if this is a forbidden error (403)
   */
  isForbiddenError(): boolean {
    return this.status === 403;
  }

  /**
   * Returns true if this is a not found error (404)
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Returns true if this is a validation error (422)
   */
  isValidationError(): boolean {
    return this.status === 422;
  }

  /**
   * Returns true if this is a timeout error
   */
  isTimeoutError(): boolean {
    return this.status === 408 || this.status === 504;
  }

  /**
   * Returns true if this error should be reported to the server
   */
  shouldReportToServer(): boolean {
    // Don't report authentication or validation errors
    return !(this.isAuthError() || this.isValidationError());
  }

  /**
   * Get a user-friendly error message based on the error type
   */
  getFriendlyMessage(): string {
    if (this.isAuthError()) {
      return "Your session has expired. Please log in again.";
    }

    if (this.isForbiddenError()) {
      return "You don't have permission to access this resource.";
    }

    if (this.isNotFoundError()) {
      return "The requested resource was not found.";
    }

    if (this.isValidationError()) {
      return this.message || "Please check your input and try again.";
    }

    if (this.isTimeoutError()) {
      return "The request timed out. Please check your connection and try again.";
    }

    if (this.isClientError()) {
      return this.message || "There was an error with your request.";
    }

    if (this.isServerError()) {
      return "The server encountered an error. Please try again later.";
    }

    return this.message || "An unexpected error occurred.";
  }

  /**
   * Format the error for logging
   */
  toLog(): object {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      endpoint: this.endpoint,
      category: this.category,
      requestId: this.requestId,
      timestamp: this.timestamp.toISOString(),
      data: this.data,
      stack: this.stack,
    };
  }
}

/**
 * Factory function to create an ApiError from a Response object
 */
export async function createApiError(
  response: Response,
  endpoint: string,
): Promise<ApiError> {
  let data;
  let errorMessage;
  const requestId = response.headers.get("x-request-id") || undefined;

  try {
    // Try to parse the response as JSON
    data = await response.json();
    errorMessage = data.error || data.message || response.statusText;
  } catch (e) {
    // If parsing fails, use the status text
    errorMessage = response.statusText || "Unknown error";
  }

  const error = new ApiError(
    errorMessage,
    response.status,
    response.statusText,
    endpoint,
    data,
    requestId,
  );

  // Log the error if it's not a standard client error
  if (error.shouldReportToServer()) {
    logger.error(`API Error: ${error.status} ${error.message}`, error.toLog());
  } else {
    logger.debug(`API Error: ${error.status} ${error.message}`, error.toLog());
  }

  return error;
}

/**
 * Creates a network error when fetch fails
 */
export function createNetworkError(error: Error, endpoint: string): ApiError {
  const apiError = new ApiError(
    error.message || "Network error",
    0, // No status code for network errors
    "Network Error",
    endpoint,
  );

  // Override category for network errors
  apiError.category = ErrorCategory.NETWORK;

  logger.error(`Network Error: ${error.message}`, apiError.toLog());

  return apiError;
}

/**
 * Check if a Response is ok, otherwise throw an ApiError
 */
export async function checkResponse(
  response: Response,
  endpoint: string,
): Promise<Response> {
  if (!response.ok) {
    throw await createApiError(response, endpoint);
  }
  return response;
}

/**
 * Formats error objects for consistent logging
 */
export function formatErrorForLogging(error: unknown): object {
  if (error instanceof ApiError) {
    return error.toLog();
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    error,
    type: typeof error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Gets a user-friendly error message from any error type
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.getFriendlyMessage();
  }

  if (error instanceof Error) {
    return error.message || "An unexpected error occurred.";
  }

  return "An unexpected error occurred.";
}
