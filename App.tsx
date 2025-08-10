// App.tsx
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme as NavDefaultTheme, Theme as NavigationTheme } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import NotificationService from "@/services/notificationService";

import {
  Provider as PaperProvider,
  MD3LightTheme as PaperLightTheme,
  adaptNavigationTheme,
} from "react-native-paper";
import { navigationRef, navigate } from "./src/navigation/navigationRef"; // ✅ add navigate

const PRIMARY = "#FF9800";

// Paper (MD3) theme
const paperTheme = {
  ...PaperLightTheme,
  colors: {
    ...PaperLightTheme.colors,
    primary: PRIMARY,
    onPrimary: "#ffffff",
    background: "#F7F7FB",
    surface: "#ffffff",
    outline: "#EEF2F7",
  },
};

// Adapt Paper ↔︎ React Navigation
const { LightTheme: AdaptedNavTheme } = adaptNavigationTheme({
  reactNavigationLight: NavDefaultTheme,
  materialLight: paperTheme,
});

// ✅ Fix TS: ensure `fonts` exists for NavigationContainer’s Theme
const NavTheme: NavigationTheme = {
  ...NavDefaultTheme,
  ...AdaptedNavTheme,
  colors: {
    ...NavDefaultTheme.colors,
    ...AdaptedNavTheme.colors,
  },
  fonts: (AdaptedNavTheme as any).fonts ?? (NavDefaultTheme as any).fonts,
};

export default function App() {
  React.useEffect(() => {
    NotificationService.init();

    NotificationService.configureNavigation({
      gotoOrder: (id) => navigate("OrderDetails", { id }),
      gotoPayment: (id) => navigate("PaymentDetails", { id }),
    });
    return () => NotificationService.cleanup();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer theme={NavTheme} ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
