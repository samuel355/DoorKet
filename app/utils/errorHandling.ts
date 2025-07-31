import { Alert } from 'react-native';

export interface ErrorHandlingOptions {
  showAlert?: boolean;
  alertTitle?: string;
  alertMessage?: string;
  logError?: boolean;
  fallbackValue?: any;
  retryCount?: number;
  retryDelay?: number;
}

export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Safely executes async functions with error handling and recovery
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<AsyncResult<T>> {
  const {
    showAlert = false,
    alertTitle = 'Error',
    alertMessage,
    logError = true,
    fallbackValue,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const result = await asyncFn();
      return { success: true, data: result };
    } catch (error: any) {
      lastError = error;

      if (logError) {
        console.error(`🔴 Async Error (Attempt ${attempt + 1}/${retryCount + 1}):`, error);
      }

      // If we have retries left, wait and try again
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // All retries exhausted, handle the error
      const errorMessage = error?.message || 'An unexpected error occurred';

      if (showAlert) {
        Alert.alert(
          alertTitle,
          alertMessage || errorMessage,
          [{ text: 'OK', style: 'default' }]
        );
      }

      return {
        success: false,
        error: errorMessage,
        data: fallbackValue,
      };
    }
  }

  // This shouldn't be reached, but TypeScript needs it
  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    data: fallbackValue,
  };
}

/**
 * Creates a safe version of an async function that won't crash the app
 */
export function makeSafeAsync<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: ErrorHandlingOptions = {}
) {
  return async (...args: T): Promise<AsyncResult<R>> => {
    return safeAsync(() => asyncFn(...args), options);
  };
}

/**
 * Handles network errors specifically
 */
export function handleNetworkError(error: any): string {
  if (!error) return 'Unknown network error';

  const message = error.message?.toLowerCase() || '';

  if (message.includes('network')) {
    return 'Please check your internet connection and try again.';
  }

  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (message.includes('fetch')) {
    return 'Unable to connect to server. Please try again.';
  }

  if (error.code === 'NETWORK_ERROR') {
    return 'Network connection failed. Please check your internet.';
  }

  return error.message || 'Network error occurred';
}

/**
 * Handles authentication errors
 */
export function handleAuthError(error: any): string {
  if (!error) return 'Authentication error occurred';

  const message = error.message?.toLowerCase() || '';

  if (message.includes('invalid_grant') || message.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }

  if (message.includes('too many requests')) {
    return 'Too many login attempts. Please try again later.';
  }

  if (message.includes('weak password')) {
    return 'Password is too weak. Please choose a stronger password.';
  }

  if (message.includes('email already registered')) {
    return 'An account with this email already exists.';
  }

  return error.message || 'Authentication failed';
}

/**
 * Handles database/API errors
 */
export function handleDatabaseError(error: any): string {
  if (!error) return 'Database error occurred';

  const message = error.message?.toLowerCase() || '';

  if (message.includes('row-level security') || message.includes('rls')) {
    return 'Permission denied. Please contact support.';
  }

  if (message.includes('unique constraint') || message.includes('already exists')) {
    return 'This information is already in use.';
  }

  if (message.includes('foreign key')) {
    return 'Invalid reference. Please try again.';
  }

  if (message.includes('not found')) {
    return 'The requested information was not found.';
  }

  if (error.code === '23505') {
    return 'This information is already in use.';
  }

  if (error.code === '42501') {
    return 'Permission denied. Please contact support.';
  }

  return error.message || 'Database operation failed';
}

/**
 * Generic error message formatter
 */
export function formatErrorMessage(error: any, context?: string): string {
  if (!error) return 'An unknown error occurred';

  // Try specific handlers first
  const message = error.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return handleNetworkError(error);
  }

  if (message.includes('auth') || message.includes('login') || message.includes('credential')) {
    return handleAuthError(error);
  }

  if (message.includes('database') || message.includes('sql') || error.code) {
    return handleDatabaseError(error);
  }

  // Fallback to generic message
  const contextPrefix = context ? `${context}: ` : '';
  return `${contextPrefix}${error.message || 'An unexpected error occurred'}`;
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (i === maxRetries - 1) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },

  /**
   * Circuit breaker pattern for failing services
   */
  createCircuitBreaker<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    threshold: number = 5,
    timeout: number = 60000
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let isOpen = false;

    return async (...args: T): Promise<R> => {
      const now = Date.now();

      // If circuit is open and timeout hasn't passed, fail fast
      if (isOpen && now - lastFailureTime < timeout) {
        throw new Error('Service temporarily unavailable');
      }

      // Reset circuit if timeout has passed
      if (isOpen && now - lastFailureTime >= timeout) {
        isOpen = false;
        failures = 0;
      }

      try {
        const result = await fn(...args);
        // Success, reset failure count
        failures = 0;
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        // Open circuit if threshold reached
        if (failures >= threshold) {
          isOpen = true;
        }

        throw error;
      }
    };
  },
};

/**
 * Development error utilities
 */
export const DevErrorUtils = {
  /**
   * Enhanced console logging for development
   */
  logError(error: any, context?: string, additionalData?: any) {
    if (__DEV__) {
      console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
      console.error('Error:', error);
      console.error('Message:', error?.message);
      console.error('Stack:', error?.stack);
      if (additionalData) {
        console.error('Additional Data:', additionalData);
      }
      console.error('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },

  /**
   * Create error boundary component with better dev experience
   */
  createDevErrorDisplay(error: Error, errorInfo: any) {
    return {
      title: 'Development Error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: errorInfo.props,
    };
  },
};
