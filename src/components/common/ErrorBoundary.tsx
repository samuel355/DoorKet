import React, { Component, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: any) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: (string | number)[];
  level?: "app" | "screen" | "component";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  eventId: string | null;
}

const { width } = Dimensions.get("window");

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const eventId = this.logError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (
        resetKeys &&
        resetKeys.some((key, idx) => prevProps.resetKeys?.[idx] !== key)
      ) {
        this.resetError();
      }
    }

    if (
      hasError &&
      resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  logError = (error: Error, errorInfo: any): string => {
    const eventId = Date.now().toString();

    // Enhanced error logging
    console.group(`🚨 ErrorBoundary Caught Error [${eventId}]`);
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Component Stack:", errorInfo.componentStack);
    console.error("Error Stack:", error.stack);
    console.error("Props:", this.props);
    console.error("Timestamp:", new Date().toISOString());
    console.groupEnd();

    // Log to crash reporting service (Sentry, Crashlytics, etc.)
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });

    return eventId;
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleRetry = () => {
    this.resetError();
  };

  handleAutoRetry = () => {
    // Auto-retry after 3 seconds for component-level errors
    if (this.props.level === "component") {
      this.resetTimeoutId = setTimeout(() => {
        this.resetError();
      }, 3000) as unknown as number;
    }
  };

  renderDefaultFallback = () => {
    const { error, errorInfo, eventId } = this.state;
    const { level = "component" } = this.props;

    // Different UI based on error level
    switch (level) {
      case "app":
        return this.renderAppLevelError();
      case "screen":
        return this.renderScreenLevelError();
      case "component":
      default:
        return this.renderComponentLevelError();
    }
  };

  renderAppLevelError = () => {
    const { error, eventId } = this.state;

    return (
      <SafeAreaView style={[styles.container, styles.appLevelContainer]}>
        <View style={styles.content}>
          <Ionicons name="warning" size={80} color="#ff6b6b" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an unexpected error. We&apos;ve logged the issue
            and will fix it soon.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={this.handleRetry}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <ScrollView style={styles.debugContainer}>
              <Text style={styles.debugTitle}>
                Debug Info (Development Only)
              </Text>
              <Text style={styles.debugText}>Error ID: {eventId}</Text>
              <Text style={styles.debugText}>Error: {error?.message}</Text>
              <Text style={styles.debugText}>Stack: {error?.stack}</Text>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    );
  };

  renderScreenLevelError = () => {
    const { error, eventId } = this.state;

    return (
      <View style={[styles.container, styles.screenLevelContainer]}>
        <View style={styles.content}>
          <Ionicons name="alert-circle" size={60} color="#ffa726" />
          <Text style={styles.title}>Screen Error</Text>
          <Text style={styles.message}>
            This screen encountered an error. You can try refreshing or go back.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={this.handleRetry}
            >
              <Ionicons name="refresh" size={18} color="#666" />
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <Text style={styles.debugText}>Error ID: {eventId}</Text>
              <Text style={styles.debugText}>{error?.message}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  renderComponentLevelError = () => {
    const { error } = this.state;

    return (
      <View style={[styles.container, styles.componentLevelContainer]}>
        <View style={styles.componentContent}>
          <Ionicons name="warning-outline" size={24} color="#ff9800" />
          <Text style={styles.componentTitle}>Component Error</Text>

          <TouchableOpacity
            style={styles.componentButton}
            onPress={this.handleRetry}
          >
            <Text style={styles.componentButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ && (
          <Text style={styles.componentDebugText}>{error?.message}</Text>
        )}
      </View>
    );
  };

  render() {
    const { hasError } = this.state;
    const { children, fallbackComponent: FallbackComponent } = this.props;

    if (hasError) {
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      return this.renderDefaultFallback();
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  appLevelContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  screenLevelContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 300,
  },
  componentLevelContainer: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 8,
    minHeight: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    maxWidth: width - 40,
  },
  componentContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  componentTitle: {
    fontSize: 14,
    color: "#856404",
    fontWeight: "600",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#007bff",
  },
  secondaryButton: {
    backgroundColor: "#e9ecef",
    borderColor: "#ced4da",
    borderWidth: 1,
  },
  componentButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderColor: "#856404",
    borderWidth: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  componentButtonText: {
    color: "#856404",
    fontSize: 12,
    fontWeight: "600",
  },
  debugContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    maxHeight: 200,
    width: "100%",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#6c757d",
    fontFamily: "monospace",
    lineHeight: 16,
    marginBottom: 4,
  },
  componentDebugText: {
    fontSize: 10,
    color: "#856404",
    marginTop: 4,
    fontStyle: "italic",
  },
});

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for error boundary
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error("useErrorHandler caught error:", error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;
