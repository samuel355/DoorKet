import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, Card, Appbar } from "react-native-paper";
import { StackNavigationProp } from "@react-navigation/stack";
import OTPDebugHelper from "../../components/debug/OTPDebugHelper";
import { useAuth } from "@/store/authStore";

interface OTPDebugScreenProps {
  navigation: StackNavigationProp<any>;
}

const OTPDebugScreen: React.FC<OTPDebugScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated, error, clearError } = useAuth();

  const handleNavigateToPhoneVerification = () => {
    const testPhone = "+233246562377";
    const userType = "runner";

    navigation.navigate("PhoneVerification", {
      phone: testPhone,
      userType: userType,
    });
  };

  const handleNavigateToLogin = () => {
    navigation.navigate("Login");
  };

  const handleClearError = () => {
    clearError();
  };

  const showAuthState = () => {
    const authInfo = {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id || "None",
      userPhone: user?.phone || "None",
      hasError: !!error,
      error: error || "None",
    };

    Alert.alert("Auth State", JSON.stringify(authInfo, null, 2), [
      { text: "OK" },
    ]);
  };

  // Only show in development mode
  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Debug (Disabled)" />
        </Appbar.Header>
        <View style={styles.disabledContainer}>
          <Text style={styles.disabledText}>
            Debug tools are only available in development mode.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="OTP Debug Tools" />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Auth State */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🔐 Current Auth State</Text>
            <View style={styles.stateContainer}>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Authenticated:</Text>
                <Text
                  style={[
                    styles.stateValue,
                    { color: isAuthenticated ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {isAuthenticated ? "Yes" : "No"}
                </Text>
              </View>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>User ID:</Text>
                <Text style={styles.stateValue}>{user?.id || "None"}</Text>
              </View>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Phone:</Text>
                <Text style={styles.stateValue}>{user?.phone || "None"}</Text>
              </View>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Error:</Text>
                <Text
                  style={[
                    styles.stateValue,
                    { color: error ? "#F44336" : "#4CAF50" },
                  ]}
                >
                  {error || "None"}
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={showAuthState}
                style={styles.button}
              >
                Show Full Auth State
              </Button>

              {error && (
                <Button
                  mode="contained"
                  onPress={handleClearError}
                  style={[styles.button, { backgroundColor: "#F44336" }]}
                >
                  Clear Error
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Navigation Tools */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🧭 Navigation Tools</Text>
            <Text style={styles.sectionSubtitle}>
              Test different navigation flows
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleNavigateToPhoneVerification}
                style={styles.button}
              >
                Go to Phone Verification
              </Button>

              <Button
                mode="outlined"
                onPress={handleNavigateToLogin}
                style={styles.button}
              >
                Go to Login Screen
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* OTP Debug Helper */}
        <OTPDebugHelper
          phoneNumber="+233246562377"
          onOTPSent={(success) => {
            console.log("OTP Debug - OTP sent:", success);
          }}
          onOTPVerified={(success) => {
            console.log("OTP Debug - OTP verified:", success);
            if (success) {
              Alert.alert(
                "Debug Success",
                "OTP verification successful! Check console for details.",
                [{ text: "OK" }],
              );
            }
          }}
        />

        {/* Troubleshooting Tips */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🔧 Troubleshooting Tips</Text>

            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>Common Issues:</Text>
              <Text style={styles.tipText}>
                • "No OTP confirmation available" - Enable test mode or check
                Firebase config{"\n"}• OTP not received - Ensure test mode is
                enabled in development{"\n"}• Firebase errors - Check project
                configuration and API keys{"\n"}• Navigation issues - Check
                route parameters and stack state
              </Text>
            </View>

            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>Environment Setup:</Text>
              <Text style={styles.tipText}>
                Add these to your .env file:{"\n"}
                EXPO_PUBLIC_ENABLE_TEST_MODE=true{"\n"}
                EXPO_PUBLIC_TEST_OTP_CODE=123456{"\n"}
                EXPO_PUBLIC_TEST_PHONE_NUMBER=+233246562377
              </Text>
            </View>

            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>Test Flow:</Text>
              <Text style={styles.tipText}>
                1. Send OTP using debug helper{"\n"}
                2. Navigate to Phone Verification screen{"\n"}
                3. Enter test OTP (123456){"\n"}
                4. Verify successful navigation
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  disabledContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  disabledText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  stateContainer: {
    marginBottom: 16,
  },
  stateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  stateValue: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
    flex: 1,
    textAlign: "right",
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    marginBottom: 8,
  },
  tipContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: "#F57C00",
    lineHeight: 18,
    fontFamily: "monospace",
  },
});

export default OTPDebugScreen;
