// ChopCart App Constants
import { Dimensions, Platform } from "react-native";

// Device Dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// App Configuration
export const APP_CONFIG = {
  APP_NAME: "ChopCart",
  VERSION: "1.0.0",
  API_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_PAGINATION_LIMIT: 20,
  MIN_ORDER_AMOUNT: 5.0,
  DEFAULT_DELIVERY_FEE: 2.0,
  DEFAULT_SERVICE_FEE_PERCENTAGE: 0.05, // 5%
  MAX_CART_ITEMS: 50,
  OTP_LENGTH: 6,
  OTP_TIMEOUT: 300, // 5 minutes in seconds
  RATING_MAX: 5,
  SEARCH_DEBOUNCE_DELAY: 500,
} as const;

// Screen Dimensions
export const DIMENSIONS = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  IS_SMALL_DEVICE: SCREEN_WIDTH < 375,
  IS_IOS: Platform.OS === "ios",
  IS_ANDROID: Platform.OS === "android",
  STATUS_BAR_HEIGHT: Platform.OS === "ios" ? 44 : 24,
  HEADER_HEIGHT: Platform.OS === "ios" ? 88 : 64,
  TAB_BAR_HEIGHT: Platform.OS === "ios" ? 83 : 60,
} as const;

// Spacing & Layout
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
} as const;

export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  XXL: 24,
  ROUND: 999,
} as const;

// Colors
export const COLORS = {
  // Primary Brand Colors
  PRIMARY: "#2196F3",
  PRIMARY_DARK: "#1976D2",
  PRIMARY_LIGHT: "#BBDEFB",

  // Secondary Colors
  SECONDARY: "#4CAF50",
  SECONDARY_DARK: "#388E3C",
  SECONDARY_LIGHT: "#C8E6C9",

  // Accent Colors
  ACCENT: "#FF9800",
  ACCENT_DARK: "#F57C00",
  ACCENT_LIGHT: "#FFE0B2",

  // User Type Colors
  STUDENT: "#2196F3",
  RUNNER: "#4CAF50",
  ADMIN: "#FF9800",

  // Status Colors
  SUCCESS: "#4CAF50",
  WARNING: "#FF9800",
  ERROR: "#F44336",
  INFO: "#2196F3",

  // Order Status Colors
  PENDING: "#FF9800",
  ACCEPTED: "#2196F3",
  SHOPPING: "#9C27B0",
  DELIVERING: "#FF5722",
  COMPLETED: "#4CAF50",
  CANCELLED: "#F44336",

  // Neutral Colors
  WHITE: "#FFFFFF",
  BLACK: "#000000",
  TRANSPARENT: "transparent",

  // Gray Scale
  GRAY_50: "#FAFAFA",
  GRAY_100: "#F5F5F5",
  GRAY_200: "#EEEEEE",
  GRAY_300: "#E0E0E0",
  GRAY_400: "#BDBDBD",
  GRAY_500: "#9E9E9E",
  GRAY_600: "#757575",
  GRAY_700: "#616161",
  GRAY_800: "#424242",
  GRAY_900: "#212121",

  // Text Colors
  TEXT_PRIMARY: "#212121",
  TEXT_SECONDARY: "#757575",
  TEXT_DISABLED: "#BDBDBD",
  TEXT_HINT: "#9E9E9E",
  TEXT_WHITE: "#FFFFFF",

  // Background Colors
  BACKGROUND: "#FFFFFF",
  BACKGROUND_SECONDARY: "#F5F5F5",
  SURFACE: "#FFFFFF",
  OVERLAY: "rgba(0, 0, 0, 0.5)",
  BACKDROP: "rgba(0, 0, 0, 0.3)",

  // Border Colors
  BORDER: "#E0E0E0",
  BORDER_LIGHT: "#F0F0F0",
  BORDER_DARK: "#BDBDBD",

  // Shadow Colors
  SHADOW_LIGHT: "rgba(0, 0, 0, 0.1)",
  SHADOW_MEDIUM: "rgba(0, 0, 0, 0.2)",
  SHADOW_DARK: "rgba(0, 0, 0, 0.3)",
} as const;

// Typography
export const FONTS = {
  FAMILY: {
    REGULAR: Platform.OS === "ios" ? "System" : "Roboto",
    MEDIUM: Platform.OS === "ios" ? "System" : "Roboto-Medium",
    BOLD: Platform.OS === "ios" ? "System" : "Roboto-Bold",
  },
  SIZE: {
    XS: 10,
    SM: 12,
    MD: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
    TITLE: 28,
    HEADING: 32,
    DISPLAY: 36,
  },
  WEIGHT: {
    LIGHT: "300" as const,
    REGULAR: "400" as const,
    MEDIUM: "500" as const,
    SEMIBOLD: "600" as const,
    BOLD: "700" as const,
  },
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.4,
    RELAXED: 1.6,
    LOOSE: 1.8,
  },
} as const;

// Icons
export const ICONS = {
  // Tab Bar Icons
  HOME: "home",
  CATEGORIES: "grid",
  CART: "basket",
  ORDERS: "receipt",
  PROFILE: "person",
  DASHBOARD: "speedometer",
  AVAILABLE: "list-circle",
  ACTIVE: "checkmark-circle",
  EARNINGS: "wallet",
  USERS: "people",
  ANALYTICS: "analytics",
  SETTINGS: "settings",

  // Common Icons
  SEARCH: "search",
  FILTER: "funnel",
  SORT: "swap-vertical",
  ADD: "add",
  REMOVE: "remove",
  EDIT: "create",
  DELETE: "trash",
  BACK: "arrow-back",
  FORWARD: "arrow-forward",
  UP: "chevron-up",
  DOWN: "chevron-down",
  LEFT: "chevron-back",
  RIGHT: "chevron-forward",
  CLOSE: "close",
  CHECK: "checkmark",
  INFO: "information-circle",
  WARNING: "warning",
  ERROR: "alert-circle",
  SUCCESS: "checkmark-circle",

  // Feature Icons
  PHONE: "call",
  EMAIL: "mail",
  LOCATION: "location",
  CAMERA: "camera",
  GALLERY: "images",
  NOTIFICATION: "notifications",
  STAR: "star",
  HEART: "heart",
  SHARE: "share",
  MENU: "menu",
  MORE: "ellipsis-horizontal",

  // Payment Icons
  CARD: "card",
  MOMO: "phone-portrait",
  CASH: "wallet",

  // Order Status Icons
  PENDING: "time",
  ACCEPTED: "checkmark-circle",
  SHOPPING: "basket",
  DELIVERING: "car",
  COMPLETED: "checkmark-done",
  CANCELLED: "close-circle",
} as const;

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  VERY_SLOW: 500,

  // Easing
  EASE_IN: "ease-in",
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
  LINEAR: "linear",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_OTP: "/auth/verify-otp",
    REFRESH_TOKEN: "/auth/refresh",
    LOGOUT: "/auth/logout",
    PROFILE: "/auth/profile",
  },
  USERS: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    UPLOAD_AVATAR: "/users/avatar",
    SETTINGS: "/users/settings",
  },
  CATEGORIES: {
    LIST: "/categories",
    DETAILS: "/categories/:id",
  },
  ITEMS: {
    LIST: "/items",
    DETAILS: "/items/:id",
    SEARCH: "/items/search",
    BY_CATEGORY: "/items/category/:categoryId",
  },
  ORDERS: {
    CREATE: "/orders",
    LIST: "/orders",
    DETAILS: "/orders/:id",
    UPDATE_STATUS: "/orders/:id/status",
    CANCEL: "/orders/:id/cancel",
    RATE: "/orders/:id/rate",
    ACCEPT: "/orders/:id/accept",
    COMPLETE: "/orders/:id/complete",
  },
  PAYMENTS: {
    INITIATE: "/payments/initiate",
    VERIFY: "/payments/verify",
    STATUS: "/payments/:id/status",
  },
  NOTIFICATIONS: {
    LIST: "/notifications",
    MARK_READ: "/notifications/:id/read",
    MARK_ALL_READ: "/notifications/read-all",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    ORDERS: "/admin/orders",
    ANALYTICS: "/admin/analytics",
    REPORTS: "/admin/reports",
  },
} as const;

// Validation Rules
export const VALIDATION = {
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    GHANA_REGEX: /^(\+233|0)[0-9]{9}$/,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  OTP: {
    LENGTH: 6,
    REGEX: /^\d{6}$/,
  },
  AMOUNT: {
    MIN: 0.01,
    MAX: 10000,
  },
  RATING: {
    MIN: 1,
    MAX: 5,
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "@chopcart/auth_token",
  REFRESH_TOKEN: "@chopcart/refresh_token",
  USER_PROFILE: "@chopcart/user_profile",
  BIOMETRIC_ENABLED: "@chopcart/biometric_enabled",
  ONBOARDING_COMPLETED: "@chopcart/onboarding_completed",
  CART_ITEMS: "@chopcart/cart_items",
  RECENT_SEARCHES: "@chopcart/recent_searches",
  APP_SETTINGS: "@chopcart/app_settings",
  NOTIFICATION_TOKEN: "@chopcart/notification_token",
  LAST_LOCATION: "@chopcart/last_location",
} as const;

// Feature Flags
export const FEATURES = {
  BIOMETRIC_AUTH: true,
  GOOGLE_LOGIN: true,
  CARD_PAYMENTS: true,
  CASH_PAYMENTS: true,
  CUSTOM_ITEMS: true,
  REAL_TIME_TRACKING: true,
  PUSH_NOTIFICATIONS: true,
  IN_APP_PURCHASES: false,
  DARK_MODE: true,
  OFFLINE_MODE: false,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your internet connection.",
  TIMEOUT: "Request timeout. Please try again.",
  UNKNOWN: "Something went wrong. Please try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  VALIDATION: "Please check your input and try again.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  PHONE_INVALID: "Please enter a valid Ghana phone number.",
  EMAIL_INVALID: "Please enter a valid email address.",
  OTP_INVALID: "Invalid OTP code. Please try again.",
  OTP_EXPIRED: "OTP code has expired. Please request a new one.",
  BIOMETRIC_NOT_AVAILABLE:
    "Biometric authentication is not available on this device.",
  LOCATION_PERMISSION: "Location permission is required for this feature.",
  CAMERA_PERMISSION: "Camera permission is required for this feature.",
  CART_EMPTY: "Your cart is empty. Add some items to continue.",
  INSUFFICIENT_BALANCE:
    "Insufficient balance. Please add funds to your account.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Login successful!",
  REGISTER: "Registration successful!",
  PROFILE_UPDATED: "Profile updated successfully!",
  ORDER_PLACED: "Order placed successfully!",
  ORDER_CANCELLED: "Order cancelled successfully!",
  PAYMENT_SUCCESS: "Payment completed successfully!",
  BIOMETRIC_ENABLED: "Biometric authentication enabled!",
  NOTIFICATION_SENT: "Notification sent successfully!",
  ITEM_ADDED_TO_CART: "Item added to cart!",
  ITEM_REMOVED_FROM_CART: "Item removed from cart!",
  RATING_SUBMITTED: "Rating submitted successfully!",
} as const;

// University Data
export const UNIVERSITIES = [
  "University of Ghana",
  "Kwame Nkrumah University of Science and Technology",
  "University of Cape Coast",
  "University of Education, Winneba",
  "University for Development Studies",
  "Ashesi University",
  "Valley View University",
  "Central University",
  "Presbyterian University",
  "Methodist University",
] as const;

// Payment Methods
export const PAYMENT_METHODS = [
  {
    id: "momo" as const,
    name: "Mobile Money",
    icon: "phone-portrait",
    color: COLORS.SUCCESS,
    enabled: true,
  },
  {
    id: "card" as const,
    name: "Credit/Debit Card",
    icon: "card",
    color: COLORS.PRIMARY,
    enabled: FEATURES.CARD_PAYMENTS,
  },
  {
    id: "cash" as const,
    name: "Cash on Delivery",
    icon: "wallet",
    color: COLORS.WARNING,
    enabled: FEATURES.CASH_PAYMENTS,
  },
] as const;

// Order Status Configurations
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: COLORS.WARNING,
    icon: ICONS.PENDING,
    description: "Waiting for runner to accept",
  },
  accepted: {
    label: "Accepted",
    color: COLORS.INFO,
    icon: ICONS.ACCEPTED,
    description: "Runner has accepted your order",
  },
  shopping: {
    label: "Shopping",
    color: COLORS.ACCENT,
    icon: ICONS.SHOPPING,
    description: "Runner is shopping for your items",
  },
  delivering: {
    label: "Delivering",
    color: COLORS.PRIMARY,
    icon: ICONS.DELIVERING,
    description: "Runner is on the way to deliver",
  },
  completed: {
    label: "Completed",
    color: COLORS.SUCCESS,
    icon: ICONS.COMPLETED,
    description: "Order has been delivered",
  },
  cancelled: {
    label: "Cancelled",
    color: COLORS.ERROR,
    icon: ICONS.CANCELLED,
    description: "Order has been cancelled",
  },
} as const;

// Export types for TypeScript
export type ColorKey = keyof typeof COLORS;
export type IconKey = keyof typeof ICONS;
export type SpacingKey = keyof typeof SPACING;
export type FontSizeKey = keyof typeof FONTS.SIZE;
export type FontWeightKey = keyof typeof FONTS.WEIGHT;

// Default export
export default {
  APP_CONFIG,
  DIMENSIONS,
  SPACING,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  ICONS,
  ANIMATION,
  API_ENDPOINTS,
  VALIDATION,
  STORAGE_KEYS,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UNIVERSITIES,
  PAYMENT_METHODS,
  ORDER_STATUS_CONFIG,
};
