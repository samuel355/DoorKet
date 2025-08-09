// ChopCart Utility Functions
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Dimensions, Alert } from "react-native";
import { COLORS, VALIDATION, STORAGE_KEYS, ERROR_MESSAGES } from "../constants";
import type { UserType, OrderStatus, PaymentMethod } from "../../types";

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Format currency amount with Ghana Cedi symbol
 */
export const formatCurrency = (amount: number, showSymbol = true): string => {
  if (isNaN(amount)) return showSymbol ? "₵0.00" : "0.00";

  const formatted = amount.toFixed(2);
  return showSymbol ? `₵${formatted}` : formatted;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Handle Ghana phone numbers
  if (cleaned.startsWith("233") && cleaned.length === 12) {
    // +233 XX XXX XXXX
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    // 0XX XXX XXXX
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  return phone;
};

/**
 * Format phone number to international format for API calls
 */
export const formatPhoneForAPI = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with +233
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+233${cleaned.substring(1)}`;
  }

  // If already has country code without +
  if (cleaned.startsWith("233") && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  // If already has + and country code
  if (phone.startsWith("+233")) {
    return phone;
  }

  // Default case - assume it needs +233 prefix
  return `+233${cleaned}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (
  date: string | Date,
  format: "short" | "long" | "time" = "short",
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "Invalid Date";

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Relative time for recent dates
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Absolute formatting
  const options: Intl.DateTimeFormatOptions =
    format === "long"
      ? {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : format === "time"
        ? { hour: "2-digit", minute: "2-digit" }
        : { year: "numeric", month: "short", day: "numeric" };

  return dateObj.toLocaleDateString("en-GB", options);
};

/**
 * Format order number for display
 */
export const formatOrderNumber = (orderNumber: string): string => {
  if (!orderNumber) return "";
  return `#${orderNumber.slice(-6).toUpperCase()}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate Ghana phone number
 */
export const isValidGhanaPhone = (phone: string): boolean => {
  if (!phone) return false;
  return VALIDATION.PHONE.GHANA_REGEX.test(phone);
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return VALIDATION.EMAIL.REGEX.test(email);
};

/**
 * Validate OTP code
 */
export const isValidOTP = (otp: string): boolean => {
  if (!otp) return false;
  return VALIDATION.OTP.REGEX.test(otp);
};

/**
 * Validate required field
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

/**
 * Validate minimum length
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return Boolean(value && value.length >= minLength);
};

/**
 * Validate maximum length
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return !value || value.length <= maxLength;
};

/**
 * Validate numeric range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// =============================================================================
// DATA MANIPULATION UTILITIES
// =============================================================================

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array)
    return obj.map((item) => deepClone(item)) as unknown as T;
  if (typeof obj === "object") {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Remove empty values from object
 */
export const removeEmptyValues = (
  obj: Record<string, any>,
): Record<string, any> => {
  const result: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== "") {
      result[key] = value;
    }
  });

  return result;
};

/**
 * Group array by key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce(
    (groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
};

/**
 * Sort array by key
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  direction: "asc" | "desc" = "asc",
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as any;
  };
};

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert to title case
 */
export const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return "";

  const names = name.trim().split(" ");
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }

  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

/**
 * Convert to slug
 */
export const toSlug = (str: string): string => {
  if (!str) return "";

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

/**
 * Round to specified decimal places
 */
export const roundTo = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Generate random number between min and max
 */
export const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Convert to percentage
 */
export const toPercentage = (
  value: number,
  total: number,
  decimals: number = 1,
): string => {
  if (total === 0) return "0%";
  const percentage = (value / total) * 100;
  return `${roundTo(percentage, decimals)}%`;
};

// =============================================================================
// DEVICE/PLATFORM UTILITIES
// =============================================================================

/**
 * Check if device is small
 */
export const isSmallDevice = (): boolean => {
  const { width } = Dimensions.get("window");
  return width < 375;
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return Platform.OS === "ios";
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return Platform.OS === "android";
};

/**
 * Get platform-specific value
 */
export const platformSelect = <T>(ios: T, android: T): T => {
  return Platform.select({ ios, android }) as T;
};

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

/**
 * Store data in AsyncStorage
 */
export const storeData = async (key: string, value: any): Promise<boolean> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error("Error storing data:", error);
    return false;
  }
};

/**
 * Get data from AsyncStorage
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("Error getting data:", error);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 */
export const removeData = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("Error removing data:", error);
    return false;
  }
};

/**
 * Clear all data from AsyncStorage
 */
export const clearAllData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing data:", error);
    return false;
  }
};

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.code) {
    switch (error.code) {
      case "NETWORK_ERROR":
        return ERROR_MESSAGES.NETWORK;
      case "TIMEOUT":
        return ERROR_MESSAGES.TIMEOUT;
      case "UNAUTHORIZED":
        return ERROR_MESSAGES.UNAUTHORIZED;
      default:
        return ERROR_MESSAGES.UNKNOWN;
    }
  }

  return ERROR_MESSAGES.UNKNOWN;
};

/**
 * Show alert dialog
 */
export const showAlert = (
  title: string,
  message: string,
  buttons?: {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
  }[],
): void => {
  Alert.alert(title, message, buttons || [{ text: "OK", style: "default" }], {
    cancelable: true,
  });
};

/**
 * Show confirmation dialog
 */
export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
): void => {
  Alert.alert(
    title,
    message,
    [
      {
        text: "Cancel",
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: "Confirm",
        style: "default",
        onPress: onConfirm,
      },
    ],
    { cancelable: true },
  );
};

// =============================================================================
// BUSINESS LOGIC UTILITIES
// =============================================================================

/**
 * Calculate order total
 */
export const calculateOrderTotal = (
  subtotal: number,
  deliveryFee: number = 0,
  serviceFeePercentage: number = 0.05,
): {
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  total: number;
} => {
  const serviceFee = roundTo(subtotal * serviceFeePercentage);
  const total = roundTo(subtotal + serviceFee + deliveryFee);

  return {
    subtotal: roundTo(subtotal),
    serviceFee,
    deliveryFee: roundTo(deliveryFee),
    total,
  };
};

/**
 * Get user type color
 */
export const getUserTypeColor = (userType: UserType): string => {
  switch (userType) {
    case "student":
      return COLORS.STUDENT;
    case "runner":
      return COLORS.RUNNER;
    case "admin":
      return COLORS.ADMIN;
    default:
      return COLORS.PRIMARY;
  }
};

/**
 * Get order status color
 */
export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case "pending":
      return COLORS.PENDING;
    case "accepted":
      return COLORS.ACCEPTED;
    case "shopping":
      return COLORS.ACCENT;
    case "delivering":
      return COLORS.PRIMARY;
    case "completed":
      return COLORS.COMPLETED;
    case "cancelled":
      return COLORS.CANCELLED;
    default:
      return COLORS.GRAY_500;
  }
};

/**
 * Get payment method icon
 */
export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method) {
    case "momo":
      return "phone-portrait";
    case "card":
      return "card";
    case "cash":
      return "wallet";
    default:
      return "wallet";
  }
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Generate OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Check if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const today = new Date();
  const checkDate = typeof date === "string" ? new Date(date) : date;

  return today.toDateString() === checkDate.toDateString();
};

/**
 * Check if date is this week
 */
export const isThisWeek = (date: Date | string): boolean => {
  const today = new Date();
  const checkDate = typeof date === "string" ? new Date(date) : date;
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(
    today.setDate(today.getDate() - today.getDay() + 6),
  );

  return checkDate >= startOfWeek && checkDate <= endOfWeek;
};

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default {
  // Formatting
  formatCurrency,
  formatPhoneNumber,
  formatPhoneForAPI,
  formatDate,
  formatOrderNumber,
  truncateText,

  // Validation
  isValidGhanaPhone,
  isValidEmail,
  isValidOTP,
  isRequired,
  hasMinLength,
  hasMaxLength,
  isInRange,

  // Data manipulation
  deepClone,
  removeEmptyValues,
  groupBy,
  sortBy,
  generateId,
  debounce,

  // String utilities
  capitalize,
  toTitleCase,
  getInitials,
  toSlug,

  // Number utilities
  roundTo,
  randomBetween,
  toPercentage,

  // Device/Platform
  isSmallDevice,
  isIOS,
  isAndroid,
  platformSelect,

  // Storage
  storeData,
  getData,
  removeData,
  clearAllData,

  // Error handling
  getErrorMessage,
  showAlert,
  showConfirmation,

  // Business logic
  calculateOrderTotal,
  getUserTypeColor,
  getOrderStatusColor,
  getPaymentMethodIcon,
  calculateDistance,
  generateOTP,
  isToday,
  isThisWeek,
};
