import { useAuth } from "@/store/authStore";
import { RootStackParamList } from "@/types";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import React from "react";

import AuthNavigator from "./AuthNavigator";
import StudentNavigator from "./StudentNavigator";
import RunnerNavigator from "./RunnerNavigator";
import AdminNavigator from "./AdminNavigator";

const Stack = createStackNavigator<RootStackParamList>();

//Loading on Screen
// LoadingScreen component removed as it's not being used

const AppNavigator: React.FC = () => {
  const { isAuthenticated, profile } = useAuth();

  const MainNavigator = () => {
    if (!isAuthenticated) {
      return <Stack.Screen name="Auth" component={AuthNavigator} />;
    }

    // Check if user has completed profile setup
    if (!profile) {
      // User is authenticated but no profile exists, redirect to auth for profile completion
      return <Stack.Screen name="Auth" component={AuthNavigator} />;
    }

    // Route based on user type
    switch (profile.user_type) {
      case "student":
        return <Stack.Screen name="Student" component={StudentNavigator} />;
      case "runner":
        return <Stack.Screen name="Runner" component={RunnerNavigator} />;
      case "admin":
        return <Stack.Screen name="Admin" component={AdminNavigator} />;
      default:
        // Unknown user type, redirect to auth
        return <Stack.Screen name="Auth" component={AuthNavigator} />;
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back for security
          cardStyle: { backgroundColor: "#ffffff" },
        }}
        initialRouteName="Auth"
      >
        {MainNavigator()}
      </Stack.Navigator>
    </>
  );
};

export default AppNavigator;
