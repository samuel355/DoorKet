// Modern color system with comprehensive light and dark themes
export const ColorPalette = {
  // Primary Brand Colors - Modern blue-purple gradient
  primary: {
    25: "#f0f4ff",
    50: "#f0f4ff",
    100: "#e0e9ff",
    200: "#c7d6fe",
    300: "#a5b8fc",
    400: "#8b94f8",
    500: "#7c73f0", // Main primary
    600: "#6d5ce3",
    700: "#5d47ca",
    800: "#4c3ba3",
    900: "#3f3182",
  },

  // Secondary Colors - Vibrant green
  secondary: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // Main secondary
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  // Accent Colors - Warm orange
  accent: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316", // Main accent
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },

  // Success Colors
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  // Warning Colors
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  // Error Colors
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  // Info Colors
  info: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Neutral Colors - Warm grays
  neutral: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09",
  },

  // Cool grays for contrast
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },

  // Pure colors
  pure: {
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
  },
};

// Light Theme
export const LightTheme = {
  // Background colors
  background: {
    primary: ColorPalette.pure.white,
    secondary: ColorPalette.neutral[50],
    tertiary: ColorPalette.neutral[100],
    elevated: ColorPalette.pure.white,
    overlay: "rgba(0, 0, 0, 0.5)",
    backdrop: "rgba(0, 0, 0, 0.3)",
  },

  // Surface colors
  surface: {
    primary: ColorPalette.pure.white,
    secondary: ColorPalette.neutral[50],
    tertiary: ColorPalette.neutral[100],
    elevated: ColorPalette.pure.white,
    disabled: ColorPalette.neutral[200],
  },

  // Text colors
  text: {
    primary: ColorPalette.neutral[900],
    secondary: ColorPalette.neutral[600],
    tertiary: ColorPalette.neutral[500],
    disabled: ColorPalette.neutral[400],
    inverse: ColorPalette.pure.white,
    link: ColorPalette.primary[600],
    success: ColorPalette.success[700],
    warning: ColorPalette.warning[700],
    error: ColorPalette.error[700],
    info: ColorPalette.info[700],
  },

  // Border colors
  border: {
    primary: ColorPalette.neutral[200],
    secondary: ColorPalette.neutral[100],
    tertiary: ColorPalette.neutral[50],
    focus: ColorPalette.primary[500],
    error: ColorPalette.error[500],
    success: ColorPalette.success[500],
    warning: ColorPalette.warning[500],
  },

  // Brand colors
  primary: {
    main: ColorPalette.primary[500],
    light: ColorPalette.primary[400],
    dark: ColorPalette.primary[600],
    contrastText: ColorPalette.pure.white,
  },

  secondary: {
    main: ColorPalette.secondary[500],
    light: ColorPalette.secondary[400],
    dark: ColorPalette.secondary[600],
    contrastText: ColorPalette.pure.white,
  },

  accent: {
    main: ColorPalette.accent[500],
    light: ColorPalette.accent[400],
    dark: ColorPalette.accent[600],
    contrastText: ColorPalette.pure.white,
  },

  // Status colors
  success: {
    main: ColorPalette.success[500],
    light: ColorPalette.success[100],
    dark: ColorPalette.success[700],
    contrastText: ColorPalette.pure.white,
  },

  warning: {
    main: ColorPalette.warning[500],
    light: ColorPalette.warning[100],
    dark: ColorPalette.warning[700],
    contrastText: ColorPalette.pure.white,
  },

  error: {
    main: ColorPalette.error[500],
    light: ColorPalette.error[100],
    dark: ColorPalette.error[700],
    contrastText: ColorPalette.pure.white,
  },

  info: {
    main: ColorPalette.info[500],
    light: ColorPalette.info[100],
    dark: ColorPalette.info[700],
    contrastText: ColorPalette.pure.white,
  },

  // Shadow colors
  shadow: {
    light: "rgba(0, 0, 0, 0.05)",
    medium: "rgba(0, 0, 0, 0.1)",
    dark: "rgba(0, 0, 0, 0.15)",
    heavy: "rgba(0, 0, 0, 0.25)",
  },
};

// Dark Theme
export const DarkTheme = {
  // Background colors
  background: {
    primary: ColorPalette.neutral[950],
    secondary: ColorPalette.neutral[900],
    tertiary: ColorPalette.neutral[800],
    elevated: ColorPalette.neutral[900],
    overlay: "rgba(0, 0, 0, 0.7)",
    backdrop: "rgba(0, 0, 0, 0.5)",
  },

  // Surface colors
  surface: {
    primary: ColorPalette.neutral[900],
    secondary: ColorPalette.neutral[800],
    tertiary: ColorPalette.neutral[700],
    elevated: ColorPalette.neutral[800],
    disabled: ColorPalette.neutral[700],
  },

  // Text colors
  text: {
    primary: ColorPalette.neutral[50],
    secondary: ColorPalette.neutral[300],
    tertiary: ColorPalette.neutral[400],
    disabled: ColorPalette.neutral[500],
    inverse: ColorPalette.neutral[900],
    link: ColorPalette.primary[400],
    success: ColorPalette.success[400],
    warning: ColorPalette.warning[400],
    error: ColorPalette.error[400],
    info: ColorPalette.info[400],
  },

  // Border colors
  border: {
    primary: ColorPalette.neutral[700],
    secondary: ColorPalette.neutral[800],
    tertiary: ColorPalette.neutral[600],
    focus: ColorPalette.primary[500],
    error: ColorPalette.error[500],
    success: ColorPalette.success[500],
    warning: ColorPalette.warning[500],
  },

  // Brand colors
  primary: {
    main: ColorPalette.primary[500],
    light: ColorPalette.primary[400],
    dark: ColorPalette.primary[600],
    contrastText: ColorPalette.pure.white,
  },

  secondary: {
    main: ColorPalette.secondary[500],
    light: ColorPalette.secondary[400],
    dark: ColorPalette.secondary[600],
    contrastText: ColorPalette.pure.white,
  },

  accent: {
    main: ColorPalette.accent[500],
    light: ColorPalette.accent[400],
    dark: ColorPalette.accent[600],
    contrastText: ColorPalette.pure.white,
  },

  // Status colors
  success: {
    main: ColorPalette.success[500],
    light: ColorPalette.success[900],
    dark: ColorPalette.success[400],
    contrastText: ColorPalette.pure.white,
  },

  warning: {
    main: ColorPalette.warning[500],
    light: ColorPalette.warning[900],
    dark: ColorPalette.warning[400],
    contrastText: ColorPalette.pure.white,
  },

  error: {
    main: ColorPalette.error[500],
    light: ColorPalette.error[900],
    dark: ColorPalette.error[400],
    contrastText: ColorPalette.pure.white,
  },

  info: {
    main: ColorPalette.info[500],
    light: ColorPalette.info[900],
    dark: ColorPalette.info[400],
    contrastText: ColorPalette.pure.white,
  },

  // Shadow colors
  shadow: {
    light: "rgba(0, 0, 0, 0.2)",
    medium: "rgba(0, 0, 0, 0.3)",
    dark: "rgba(0, 0, 0, 0.4)",
    heavy: "rgba(0, 0, 0, 0.6)",
  },
};

// Theme type
export type Theme = typeof LightTheme;
export type ThemeMode = "light" | "dark";

// Export themes
export const themes = {
  light: LightTheme,
  dark: DarkTheme,
} as const;
