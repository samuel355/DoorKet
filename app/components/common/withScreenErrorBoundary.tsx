import React from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface ScreenErrorBoundaryProps {
  screenName: string;
  fallbackComponent?: React.ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: any) => void;
}

/**
 * Higher-order component that wraps screens with error boundary
 * Provides screen-specific error handling with fallback UI
 */
export const withScreenErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: ScreenErrorBoundaryProps,
) => {
  const ScreenWithErrorBoundary = (props: P) => {
    const handleError = (error: Error, errorInfo: any) => {
      console.error(`🚨 Error in ${options.screenName}:`, error);
      console.error("Component Stack:", errorInfo.componentStack);

      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error, errorInfo);
      }

      // Log to analytics/crash reporting
      // Analytics.trackEvent('screen_error', {
      //   screen: options.screenName,
      //   error: error.message,
      //   stack: error.stack
      // });
    };

    return (
      <ErrorBoundary
        level="screen"
        onError={handleError}
        fallbackComponent={options.fallbackComponent}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  ScreenWithErrorBoundary.displayName = `withScreenErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ScreenWithErrorBoundary;
};

/**
 * Hook for handling errors within screens
 * Provides error state management and recovery functions
 */
export const useScreenErrorHandler = (screenName: string) => {
  const [error, setError] = React.useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback(
    (error: Error) => {
      console.error(`Error in ${screenName}:`, error);
      setError(error);
    },
    [screenName],
  );

  const clearError = React.useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retryAction = React.useCallback(
    async (action: () => Promise<void>) => {
      try {
        setIsRetrying(true);
        setError(null);
        await action();
      } catch (err) {
        handleError(err as Error);
      } finally {
        setIsRetrying(false);
      }
    },
    [handleError],
  );

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retryAction,
  };
};

/**
 * Utility function to create screen-specific error fallback components
 */
export const createScreenErrorFallback = (screenName: string) => {
  const FallbackComponent = ({
    error,
    resetError,
  }: {
    error: Error;
    resetError: () => void;
  }) => (
    <div
      style={{
        padding: 20,
        textAlign: "center",
        backgroundColor: "#f8f9fa",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h3>Something went wrong in {screenName}</h3>
      <p>We&apos;re sorry for the inconvenience. Please try again.</p>
      <button
        onClick={resetError}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
      {__DEV__ && (
        <details style={{ marginTop: 20, fontSize: "12px", color: "#666" }}>
          <summary>Error Details (Development)</summary>
          <pre>{error.message}</pre>
        </details>
      )}
    </div>
  );

  FallbackComponent.displayName = `${screenName}ErrorFallback`;

  return FallbackComponent;
};
