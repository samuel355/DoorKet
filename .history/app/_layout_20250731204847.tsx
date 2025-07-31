import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const [isDark, setIsDark] = React.useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={createPaperTheme(isDark)}>
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// Custom theme for React Native Paper - will be enhanced by our theme system
const createPaperTheme = (isDark: boolean) => ({
  ...DefaultTheme,
  dark: isDark,
  colors: {
    ...DefaultTheme.colors,
    primary: "#7c73f0",
    secondary: "#22c55e",
    accent: "#f97316",
    background: isDark ? "#0c0a09" : "#ffffff",
    surface: isDark ? "#1c1917" : "#ffffff",
    text: isDark ? "#fafaf9" : "#333333",
    disabled: isDark ? "#78716c" : "#cccccc",
    placeholder: isDark ? "#a8a29e" : "#666666",
    backdrop: "rgba(0, 0, 0, 0.5)",
    onSurface: isDark ? "#fafaf9" : "#333333",
    notification: "#ef4444",
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: "System",
      fontWeight: "normal" as const,
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500" as const,
    },
    light: {
      fontFamily: "System",
      fontWeight: "300" as const,
    },
    thin: {
      fontFamily: "System",
      fontWeight: "100" as const,
    },
  },
});