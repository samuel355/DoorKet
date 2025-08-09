import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes, Theme, ThemeMode } from "./colors";
import {
  createShadows,
  createTypography,
  createComponentStyles,
  createUtilities,
} from "./styling";

// Storage key for theme preference
const THEME_STORAGE_KEY = "@chopcart/theme_mode";

// Theme context interface
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  shadows: ReturnType<typeof createShadows>;
  typography: ReturnType<typeof createTypography>;
  components: ReturnType<typeof createComponentStyles>;
  utils: ReturnType<typeof createUtilities>;
}

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeMode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    initialTheme || "light",
  );
  const [isLoading, setIsLoading] = useState(true);

  // Get current theme based on mode
  const theme = themes[themeMode];
  const isDark = themeMode === "dark";

  // Create theme utilities
  const shadows = createShadows(theme);
  const typography = createTypography(theme);
  const components = createComponentStyles(theme);
  const utils = createUtilities(theme);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        // Try to load saved theme preference
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
          setThemeModeState(savedTheme);
        } else {
          // If no saved preference, use system theme
          const systemTheme = Appearance.getColorScheme();
          if (systemTheme) {
            setThemeModeState(systemTheme);
          }
        }
      } catch (error) {
        console.warn("Failed to load theme preference:", error);
        // Fallback to system theme or light mode
        const systemTheme = Appearance.getColorScheme() || "light";
        setThemeModeState(systemTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only auto-switch if user hasn't set a manual preference
      AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
        if (!savedTheme && colorScheme) {
          setThemeModeState(colorScheme);
        }
      });
    });

    return () => subscription?.remove();
  }, []);

  // Set theme mode and save to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn("Failed to save theme preference:", error);
    }
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
  };

  // Context value
  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
    shadows,
    typography,
    components,
    utils,
  };

  // Show loading state while theme is being loaded
  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

// Hook to get just the theme colors
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme;
};

// Hook to get typography styles
export const useTypography = () => {
  const { typography } = useTheme();
  return typography;
};

// Hook to get shadow styles
export const useShadows = () => {
  const { shadows } = useTheme();
  return shadows;
};

// Hook to get component styles
export const useComponentStyles = () => {
  const { components } = useTheme();
  return components;
};

// Hook to get theme utilities
export const useThemeUtils = () => {
  const { utils } = useTheme();
  return utils;
};

// HOC for theme-aware components
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: ThemeContextType }>,
) => {
  return (props: P) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

// Theme mode selector hook
interface ThemeModeSelectorProps {
  onModeChange?: (mode: ThemeMode) => void;
}

export const useThemeModeSelector = (
  onModeChange?: (mode: ThemeMode) => void,
) => {
  const { themeMode, setThemeMode } = useTheme();

  const handleModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    onModeChange?.(mode);
  };

  return {
    currentMode: themeMode,
    setMode: handleModeChange,
    isLight: themeMode === "light",
    isDark: themeMode === "dark",
  };
};

// Export types
export type { ThemeContextType };
