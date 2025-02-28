/**
 * Standardized API error class with additional context
 */
export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data: any;
  public endpoint: string;

  constructor(
    message: string,
    status: number,
    statusText: string,
    endpoint: string,
    data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.endpoint = endpoint;
    this.data = data;
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
   * Get a user-friendly error message based on the error type
   */
  getFriendlyMessage(): string {
    if (this.isAuthError()) {
      return 'Your session has expired. Please log in again.';
    }

    if (this.isForbiddenError()) {
      return 'You don\'t have permission to access this resource.';
    }

    if (this.isNotFoundError()) {
      return 'The requested resource was not found.';
    }

    if (this.isClientError()) {
      return this.message || 'There was an error with your request.';
    }

    if (this.isServerError()) {
      return 'The server encountered an error. Please try again later.';
    }

    return this.message || 'An unexpected error occurred.';
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
  endpoint: string
): Promise<ApiError> {
  let data;
  let errorMessage;

  try {
    // Try to parse the response as JSON
    data = await response.json();
    errorMessage = data.error || data.message || response.statusText;
  } catch (e) {
    // If parsing fails, use the status text
    errorMessage = response.statusText || 'Unknown error';
  }

  return new ApiError(
    errorMessage,
    response.status,
    response.statusText,
    endpoint,
    data
  );
}

/**
 * Check if a Response is ok, otherwise throw an ApiError
 */
export async function checkResponse(response: Response, endpoint: string): Promise<Response> {
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
    };
  }

  return {
    error,
    type: typeof error,
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
    return error.message || 'An unexpected error occurred.';
  }

  return 'An unexpected error occurred.';
} 