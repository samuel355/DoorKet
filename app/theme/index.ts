// Theme system exports - specific exports to avoid conflicts

// Colors and themes
export {
  ColorPalette,
  LightTheme,
  DarkTheme,
  themes,
  type Theme,
  type ThemeMode,
} from "./colors";

// Styling utilities
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

// Theme context and hooks
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
