import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface ApiErrorHandlerOptions {
  showAlert?: boolean;
  alertTitle?: string;
  logError?: boolean;
  onError?: (error: ApiError) => void;
  retryable?: boolean;
  maxRetries?: number;
}

export const useApiErrorHandler = (screenName: string, options: ApiErrorHandlerOptions = {}) => {
  const {
    showAlert = true,
    alertTitle = 'Error',
    logError = true,
    onError,
    retryable = false,
    maxRetries = 3
  } = options;

  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const parseError = useCallback((error: any): ApiError => {
    // Handle different error types
    if (error?.response) {
      // HTTP error response
      return {
        message: error.response.data?.message || error.response.statusText || 'Network error',
        status: error.response.status,
        code: error.response.data?.code,
        details: error.response.data
      };
    }

    if (error?.message) {
      // Error with message
      return {
        message: error.message,
        code: error.code,
        details: error
      };
    }

    if (typeof error === 'string') {
      return {
        message: error
      };
    }

    return {
      message: 'An unexpected error occurred'
    };
  }, []);

  const getErrorMessage = useCallback((apiError: ApiError): string => {
    // Customize error messages based on status codes
    switch (apiError.status) {
      case 400:
        return apiError.message || 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authorized. Please sign in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service is temporarily unavailable. Please try again later.';
      default:
        return apiError.message || 'Something went wrong. Please try again.';
    }
  }, []);

  const shouldRetry = useCallback((apiError: ApiError): boolean => {
    if (!retryable || retryCount >= maxRetries) {
      return false;
    }

    // Retry on network errors or 5xx server errors
    return !apiError.status || apiError.status >= 500;
  }, [retryable, maxRetries, retryCount]);

  const handleError = useCallback((error: any): ApiError => {
    const apiError = parseError(error);
    const errorMessage = getErrorMessage(apiError);
    const finalError = { ...apiError, message: errorMessage };

    setError(finalError);

    if (logError) {
      console.error(`🚨 API Error in ${screenName}:`, {
        error: finalError,
        originalError: error,
        timestamp: new Date().toISOString()
      });
    }

    if (showAlert && !shouldRetry(finalError)) {
      Alert.alert(alertTitle, errorMessage);
    }

    if (onError) {
      onError(finalError);
    }

    return finalError;
  }, [screenName, parseError, getErrorMessage, shouldRetry, logError, showAlert, alertTitle, onError]);

  const executeWithErrorHandling = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: ApiError) => void;
      showLoadingState?: boolean;
    }
  ): Promise<T | null> => {
    const { onSuccess, onError: localOnError, showLoadingState = true } = options || {};

    try {
      if (showLoadingState) {
        setIsLoading(true);
      }
      clearError();

      const result = await apiCall();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const apiError = handleError(error);

      if (localOnError) {
        localOnError(apiError);
      }

      return null;
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  }, [handleError, clearError]);

  const retryLastOperation = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    if (!error || retryCount >= maxRetries) {
      return null;
    }

    setRetryCount(prev => prev + 1);
    return executeWithErrorHandling(apiCall);
  }, [error, retryCount, maxRetries, executeWithErrorHandling]);

  return {
    error,
    isLoading,
    retryCount,
    clearError,
    handleError,
    executeWithErrorHandling,
    retryLastOperation,
    canRetry: error ? shouldRetry(error) : false
  };
};

// Specialized hooks for common error scenarios

export const useAuthErrorHandler = (screenName: string) => {
  return useApiErrorHandler(screenName, {
    alertTitle: 'Authentication Error',
    onError: (error) => {
      if (error.status === 401) {
        // Handle logout or redirect to login
        console.log('User needs to re-authenticate');
      }
    }
  });
};

export const useNetworkErrorHandler = (screenName: string) => {
  return useApiErrorHandler(screenName, {
    alertTitle: 'Network Error',
    retryable: true,
    maxRetries: 3,
    onError: (error) => {
      if (!error.status) {
        console.log('Network connectivity issue detected');
      }
    }
  });
};

export const useFormErrorHandler = (screenName: string) => {
  return useApiErrorHandler(screenName, {
    alertTitle: 'Validation Error',
    showAlert: false, // Handle form errors differently
    onError: (error) => {
      // Form errors are usually handled by the form validation
      console.log('Form validation error:', error);
    }
  });
};
