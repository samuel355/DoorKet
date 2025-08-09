import { useFonts } from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import React from "react";
import { ThemeProvider } from "./theme/ThemeContext";
import AppNavigator from "./navigation/AppNavigator";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PaperProvider theme={createPaperTheme()}>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Custom theme for React Native Paper - enhanced by our theme system
const createPaperTheme = () => ({
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#7c73f0",
    secondary: "#22c55e",
    accent: "#f97316",
    background: "#ffffff",
    surface: "#ffffff",
    text: "#333333",
    disabled: "#cccccc",
    placeholder: "#666666",
    backdrop: "rgba(0, 0, 0, 0.5)",
    onSurface: "#333333",
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
