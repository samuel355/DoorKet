import { Alert } from "react-native";
import { NavigationProp } from "@react-navigation/native";

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  alertTitle?: string;
  alertMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  navigation?: NavigationProp<any>;
  logToAnalytics?: boolean;
}

/**
 * Common error types that screens might encounter
 */
export enum ScreenErrorType {
  NETWORK = "network",
  AUTH = "auth",
  VALIDATION = "validation",
  PERMISSION = "permission",
  NOT_FOUND = "not_found",
  SERVER = "server",
  UNKNOWN = "unknown",
}

/**
 * Categorizes errors based on their characteristics
 */
export const categorizeError = (error: any): ScreenErrorType => {
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorCode = error?.code?.toLowerCase() || "";
  const status = error?.status || error?.response?.status;

  // Network errors
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection") ||
    !status
  ) {
    return ScreenErrorType.NETWORK;
  }

  // Authentication errors
  if (
    status === 401 ||
    errorMessage.includes("auth") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("login") ||
    errorMessage.includes("token")
  ) {
    return ScreenErrorType.AUTH;
  }

  // Validation errors
  if (
    status === 400 ||
    errorMessage.includes("validation") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("required")
  ) {
    return ScreenErrorType.VALIDATION;
  }

  // Permission errors
  if (
    status === 403 ||
    errorMessage.includes("permission") ||
    errorMessage.includes("forbidden")
  ) {
    return ScreenErrorType.PERMISSION;
  }

  // Not found errors
  if (status === 404 || errorMessage.includes("not found")) {
    return ScreenErrorType.NOT_FOUND;
  }

  // Server errors
  if (status >= 500) {
    return ScreenErrorType.SERVER;
  }

  return ScreenErrorType.UNKNOWN;
};

/**
 * Gets user-friendly error messages based on error type
 */
export const getErrorMessage = (
  error: any,
  errorType?: ScreenErrorType,
): string => {
  const type = errorType || categorizeError(error);

  switch (type) {
    case ScreenErrorType.NETWORK:
      return "Unable to connect to the server. Please check your internet connection and try again.";

    case ScreenErrorType.AUTH:
      return "Your session has expired. Please sign in again.";

    case ScreenErrorType.VALIDATION:
      return error?.message || "Please check your input and try again.";

    case ScreenErrorType.PERMISSION:
      return "You do not have permission to perform this action.";

    case ScreenErrorType.NOT_FOUND:
      return "The requested information could not be found.";

    case ScreenErrorType.SERVER:
      return "Server is temporarily unavailable. Please try again later.";

    default:
      return error?.message || "Something went wrong. Please try again.";
  }
};

/**
 * Handles common error scenarios with appropriate user feedback
 */
export const handleScreenError = (
  error: any,
  screenName: string,
  options: ErrorHandlerOptions = {},
) => {
  const {
    showAlert = true,
    alertTitle = "Error",
    alertMessage,
    onRetry,
    onCancel,
    navigation,
    logToAnalytics = true,
  } = options;

  const errorType = categorizeError(error);
  const message = alertMessage || getErrorMessage(error, errorType);

  // Log error for debugging
  console.error(`🚨 Error in ${screenName}:`, {
    error,
    type: errorType,
    timestamp: new Date().toISOString(),
  });

  // Log to analytics if enabled
  if (logToAnalytics) {
    // Analytics.trackEvent('screen_error', {
    //   screen: screenName,
    //   error_type: errorType,
    //   error_message: error?.message || 'Unknown error'
    // });
  }

  // Handle specific error types
  switch (errorType) {
    case ScreenErrorType.AUTH:
      if (navigation) {
        Alert.alert("Session Expired", "Please sign in again to continue.", [
          { text: "Cancel", style: "cancel", onPress: onCancel },
          {
            text: "Sign In",
            onPress: () => {
              // Navigate to login screen
              navigation.navigate("Auth", { screen: "Login" });
            },
          },
        ]);
        return;
      }
      break;

    case ScreenErrorType.NETWORK:
      if (showAlert && onRetry) {
        Alert.alert("Connection Error", message, [
          { text: "Cancel", style: "cancel", onPress: onCancel },
          { text: "Retry", onPress: onRetry },
        ]);
        return;
      }
      break;

    case ScreenErrorType.PERMISSION:
      if (showAlert) {
        Alert.alert("Access Denied", message, [
          { text: "OK", onPress: onCancel },
        ]);
        return;
      }
      break;
  }

  // Default alert for other error types
  if (showAlert) {
    const buttons = [];

    if (onCancel) {
      buttons.push({
        text: "Cancel",
        style: "cancel" as const,
        onPress: onCancel,
      });
    }

    if (onRetry) {
      buttons.push({ text: "Retry", onPress: onRetry });
    }

    if (buttons.length === 0) {
      buttons.push({ text: "OK" });
    }

    Alert.alert(alertTitle, message, buttons);
  }
};

/**
 * Creates a standardized error handler for specific screens
 */
export const createScreenErrorHandler = (
  screenName: string,
  navigation?: NavigationProp<any>,
) => {
  return (
    error: any,
    options: Omit<ErrorHandlerOptions, "navigation"> = {},
  ) => {
    handleScreenError(error, screenName, { ...options, navigation });
  };
};

/**
 * Determines if an error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  const errorType = categorizeError(error);

  return [
    ScreenErrorType.NETWORK,
    ScreenErrorType.SERVER,
    ScreenErrorType.UNKNOWN,
  ].includes(errorType);
};

/**
 * Gets retry delay based on attempt number (exponential backoff)
 */
export const getRetryDelay = (attempt: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 10000; // 10 seconds

  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay);
};

/**
 * Utility for async operations with error handling and retry logic
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  screenName: string,
  options: ErrorHandlerOptions & {
    maxRetries?: number;
    retryDelay?: number;
  } = {},
): Promise<T | null> => {
  const { maxRetries = 3, retryDelay, ...errorOptions } = options;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryableError(error)) {
        handleScreenError(error, screenName, errorOptions);
        return null;
      }

      // Wait before retrying
      const delay = retryDelay || getRetryDelay(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
};

/**
 * Creates a safe async function that won't throw errors
 */
export const createSafeAsyncFunction = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  screenName: string,
  defaultValue: R | null = null,
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Safe async function error in ${screenName}:`, error);
      return defaultValue;
    }
  };
};

/**
 * Validates form data and handles validation errors
 */
export const validateFormData = <T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => string | null>,
  screenName: string,
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  Object.keys(validators).forEach((key) => {
    const validator = validators[key as keyof T];
    const value = data[key];
    const error = validator(value);

    if (error) {
      errors[key as keyof T] = error;
      isValid = false;
    }
  });

  if (!isValid) {
    console.log(`Form validation errors in ${screenName}:`, errors);
  }

  return { isValid, errors };
};
