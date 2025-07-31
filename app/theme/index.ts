// Theme system exports
export * from "./colors";
export * from "./styling";
export * from "./ThemeContext";

// Re-export commonly used items for convenience
export {
  ColorPalette,
  LightTheme,
  DarkTheme,
  themes,
  type Theme,
  type ThemeMode,
} from "./colors";

export {
  borderRadius,
  spacing,
  animations,
  layout,
  createShadows,
  createTypography,
  createComponentStyles,
  createUtilities,
  type ShadowPreset,
  type TypographyVariant,
  type SpacingValue,
  type BorderRadiusValue,
} from "./styling";

export {
  ThemeProvider,
  useTheme,
  useThemeColors,
  useTypography,
  useShadows,
  useComponentStyles,
  useThemeUtils,
  withTheme,
  useThemeModeSelector,
  type ThemeContextType,
} from "./ThemeContext";

// Default export for convenience
export { themes as default } from "./colors";
