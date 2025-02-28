import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import React from "react";

interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
  message?: string;
}

/**
 * A default fallback component to display when an error is caught by an ErrorBoundary.
 * Displays the error message and provides a button to reset the error boundary.
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  message = "Something went wrong",
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-center space-y-4 min-h-[200px] w-full">
      <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400" />
      <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
        {message}
      </h2>

      {error && (
        <div className="max-w-full overflow-auto text-sm text-red-600 dark:text-red-400 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
          <p className="font-mono">{error.message || String(error)}</p>
        </div>
      )}

      {resetErrorBoundary && (
        <Button
          onClick={resetErrorBoundary}
          variant="outline"
          className="mt-4 border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/50"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * A minimal error fallback for use in smaller UI components
 */
export function CompactErrorFallback({
  resetErrorBoundary,
  message = "Component Error",
}: Omit<ErrorFallbackProps, "error">) {
  return (
    <div className="flex items-center justify-between p-3 rounded border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-sm w-full">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
        <span className="text-red-700 dark:text-red-300">{message}</span>
      </div>

      {resetErrorBoundary && (
        <Button
          onClick={resetErrorBoundary}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
