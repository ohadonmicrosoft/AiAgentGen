# Error Handling & Resilience System

This document provides an overview of the error handling and resilience mechanisms implemented in the AI Agent Generator application. The system is designed to gracefully handle errors at different levels of the application, provide meaningful feedback to users, and facilitate debugging for developers.

## Core Components

### 1. React Error Boundaries

Error boundaries are React components that catch JavaScript errors in their child component tree, log those errors, and display fallback UI.

#### Components

- **`ErrorBoundary`** (`/client/src/components/ui/error-boundary.tsx`)

  - A class component that implements React's error boundary lifecycle methods
  - Catches errors in child components and renders fallback UI
  - Provides error handling callbacks and reset functionality

- **`withErrorBoundary`** HOC
  - A higher-order component for wrapping components with error boundaries
  - Simplifies the application of error boundaries to existing components

#### Usage

```tsx
// Basic usage
<ErrorBoundary>
  <ComponentThatMightThrow />
</ErrorBoundary>

// With custom fallback UI
<ErrorBoundary
  fallback={<CustomErrorMessage />}
  onError={(error, info) => logError(error, info)}
>
  <ComponentThatMightThrow />
</ErrorBoundary>

// Using the HOC
const SafeComponent = withErrorBoundary(RiskyComponent);
```

### 2. Functional Component Hooks

For functional components, we provide React hooks that simplify error handling.

#### Hooks

- **`useErrorBoundary`** (`/client/src/hooks/use-error-boundary.tsx`)
  - Provides error state and handler functions for functional components
  - Returns an error boundary wrapper component and state management functions

#### Usage

```tsx
function MyComponent() {
  const { ErrorBoundaryWrapper, hasError, error, resetBoundary } =
    useErrorBoundary();

  return (
    <ErrorBoundaryWrapper>
      <ComponentThatMightThrow />
    </ErrorBoundaryWrapper>
  );
}
```

### 3. Fallback UI Components

Standardized error fallback components provide consistent error presentation.

#### Components

- **`ErrorFallback`** (`/client/src/components/ui/error-fallback.tsx`)

  - A full-size error display with error details and retry functionality
  - Designed for primary content areas

- **`CompactErrorFallback`**
  - A smaller version for use in cards or sidebar components
  - Minimizes disruption while still conveying error information

### 4. Async Data Handling

Components and utilities for handling asynchronous operations with proper error handling.

#### Components

- **`AsyncBoundary`** (`/client/src/components/ui/async-boundary.tsx`)
  - Combines React Suspense and ErrorBoundary
  - Handles both loading states and error states for async operations

#### Usage

```tsx
<AsyncBoundary
  loadingFallback={<LoadingSpinner />}
  errorFallback={<ErrorFallback />}
>
  <DataComponent />
</AsyncBoundary>
```

### 5. API Error Handling

Utilities for standardized API error handling.

#### Utilities

- **`ApiError`** class (`/client/src/lib/api-error.ts`)

  - Extended Error class with additional context for API errors
  - Includes status code, endpoint information, and response data
  - Provides helpers for identifying error types (auth, server, etc.)

- **`checkResponse`** and **`createApiError`** functions
  - Utility functions for working with Fetch API responses
  - Consistently transform HTTP errors into ApiError instances

#### Usage

```tsx
try {
  const response = await fetch('/api/data');
  await checkResponse(response, '/api/data');
  const data = await response.json();
  // Process data
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isAuthError()) {
      // Handle authentication error
    } else if (error.isServerError()) {
      // Handle server error
    }
  }
  // Handle other errors
}
```

### 6. API Request Hook

A React hook that simplifies API requests with built-in error handling.

#### Hook

- **`useApi`** (`/client/src/hooks/use-api.tsx`)
  - Provides a fetch wrapper with standardized error handling
  - Manages loading states, error states, and success states
  - Automatically handles authentication and content-type headers

#### Usage

```tsx
function UserProfile() {
  const [fetchApi, { data, isLoading, error }] = useApi<User>();

  useEffect(() => {
    fetchApi('/api/user/profile');
  }, [fetchApi]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return data ? <div>Hello, {data.name}!</div> : null;
}
```

### 7. Logging System

Comprehensive logging system for both client and server.

#### Client-side Logger

- **`logger`** (`/client/src/lib/logger.ts`)
  - Provides logging methods for different severity levels
  - Supports context and tags for better filtering
  - Batches and sends logs to the server
  - Automatically captures uncaught errors and unhandled promise rejections

#### Server-side Logger

- **`serverLogger`** and **`logger`** (`/server/api/logs.ts`)
  - Handles logs from both client and server
  - Writes logs to files with date-based rotation
  - Validates log structure

#### Usage

```tsx
// Client-side
import { logger } from '@/lib/logger';

logger.info('User action completed', { userId: '123', action: 'save' });
logger.error('Failed to save data', error, { component: 'UserForm' });

// Server-side
import { logger } from './api/logs';

logger.info('API request received', { endpoint: '/api/users', method: 'GET' });
```

## Implementation Strategy

The error handling system is implemented using a layered approach:

1. **Component Level**: Error boundaries catch rendering errors
2. **Data Fetching Level**: `useApi` and `AsyncBoundary` handle data fetching errors
3. **Application Level**: Global error handlers catch uncaught errors
4. **Server Level**: API endpoints return consistent error responses

This ensures that errors are caught at the appropriate level and handled gracefully.

## Best Practices

When working with the error handling system, follow these guidelines:

1. **Wrap uncertain components in error boundaries**

   - Use error boundaries for components that might throw errors
   - Place boundaries strategically to isolate failures

2. **Use specific error types**

   - Extend the `ApiError` class for domain-specific errors
   - Provide meaningful error messages

3. **Implement recovery mechanisms**

   - Provide retry functionality where appropriate
   - Preserve user input when possible

4. **Log appropriately**

   - Include context in log messages
   - Use appropriate log levels (debug, info, warn, error)
   - Add tags for better filtering

5. **Provide helpful user feedback**
   - Show user-friendly error messages
   - Suggest next steps for recovery

## Error Handling Flow

The typical flow for handling errors in the application is:

1. Component throws an error during rendering
2. Nearest error boundary catches the error
3. Error boundary renders fallback UI
4. Error is logged to the console and sent to the server
5. User is provided with a way to recover (if possible)

For API errors:

1. API request fails
2. `useApi` hook catches the error
3. Error is transformed into an `ApiError` instance
4. Error is logged
5. Component shows error state
6. User can retry the request

## Automated Error Reporting

The logging system automatically captures and reports errors to the server. This includes:

1. **Uncaught exceptions**

   - JavaScript errors not caught by error boundaries
   - Runtime exceptions

2. **Unhandled promise rejections**

   - Failed async operations without catch handlers

3. **API errors**
   - HTTP errors from API requests
   - Validation errors

All errors are logged to the server with contextual information, including:

- User session ID
- User ID (if authenticated)
- Browser and OS information
- Current URL
- Application version

## Testing Error Handling

The error handling system can be tested using:

1. **Component Tests**

   - Test that error boundaries catch errors and render fallback UI
   - Verify that error callbacks are called

2. **Hook Tests**

   - Test that hooks like `useApi` handle errors correctly
   - Verify loading and error states

3. **Integration Tests**
   - Test the full error handling flow
   - Verify error logging

## Conclusion

The error handling and resilience system provides a comprehensive approach to handling errors throughout the application. By implementing this system, we ensure that:

1. Errors are caught and handled gracefully
2. Users receive appropriate feedback
3. Developers can easily debug issues
4. The application remains stable even in the face of errors

This system is a critical part of providing a reliable and user-friendly experience in the AI Agent Generator application.
