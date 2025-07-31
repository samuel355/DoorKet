import { useAuth } from "@/store/authStore";
import { RootStackParamList } from "@/types";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import AuthNavigator from "./AuthNavigator";

const Stack = createStackNavigator<RootStackParamList>();

//Loading on Screen
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.loadingText}>Loading ChopCart...</Text>
    </View>
  );
};



const AppNavigator: React.FC = () => {

  const {
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    profile,
    error,
    checkAuthStatus,
  } = useAuth();

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
    <NavigationContainer>
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
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    fontSize: 16,
    color: "#2196F3",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default AppNavigator;
