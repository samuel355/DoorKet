import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, Card, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { AuthStackParamList } from "@/types";
import { useAuth } from "@/store/authStore";

type GoogleLoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "GoogleLogin"
>;

interface GoogleLoginScreenProps {
  navigation: GoogleLoginScreenNavigationProp;
}

const GoogleLoginScreen: React.FC<GoogleLoginScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const { signInWithGoogle, isLoading, error, clearError } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    clearError();
    // Auto-initiate Google sign-in when screen loads
    handleGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    try {
      clearError();
      const result = await signInWithGoogle();

      if (result.success) {
        // Navigation will be handled by auth state change
        navigation.goBack();
      } else {
        Alert.alert(
          "Sign In Failed",
          result.error || "Google sign in failed. Please try again.",
          [
            { text: "Retry", onPress: handleGoogleSignIn },
            { text: "Cancel", onPress: () => navigation.goBack() },
          ],
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Something went wrong. Please try again.",
        [
          { text: "Retry", onPress: handleGoogleSignIn },
          { text: "Cancel", onPress: () => navigation.goBack() },
        ],
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="logo-google" size={64} color="#4285F4" />
          </View>
          <Text style={styles.title}>Sign in with Google</Text>
          <Text style={styles.subtitle}>
            {isProcessing
              ? "Connecting to your Google account..."
              : "Use your Google account to sign in to ChopCart"}
          </Text>
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <Card.Content style={styles.cardContent}>
            {isProcessing || isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>
                  Please complete the sign in process in your browser
                </Text>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={40} color="#f44336" />
                <Text style={styles.errorTitle}>Sign In Required</Text>
                <Text style={styles.errorMessage}>
                  {error || "Please try signing in with Google again"}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!isProcessing && !isLoading && (
            <Button
              mode="contained"
              onPress={handleGoogleSignIn}
              style={styles.retryButton}
              contentStyle={styles.buttonContent}
              icon={() => (
                <Ionicons name="logo-google" size={20} color="#ffffff" />
              )}
            >
              Try Again
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={handleCancel}
            disabled={isProcessing || isLoading}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
          >
            Cancel
          </Button>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#666666"
          />
          <Text style={styles.helpText}>
            If youre having trouble signing in, make sure you have Google
            services enabled on your device.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  statusCard: {
    elevation: 4,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    marginBottom: 32,
  },
  cardContent: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
  },
  errorContainer: {
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#4285F4",
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: "#666666",
  },
  buttonContent: {
    paddingVertical: 8,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
  },
  helpText: {
    fontSize: 12,
    color: "#1976d2",
    marginLeft: 12,
    flex: 1,
    lineHeight: 16,
  },
});

export default GoogleLoginScreen;
