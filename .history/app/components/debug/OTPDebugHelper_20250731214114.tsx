import { useAuth } from "@/store/authStore";
import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { Button, Card } from "react-native-paper";

interface OTPDebugHelperProps {
  phoneNumber?: string;
  onOTPSent?: (success: boolean) => void;
  onOTPVerified?: (success: boolean) => void;
}

const OTPDebugHelper: React.FC<OTPDebugHelperProps> = ({
  phoneNumber = "+233246562377",
  onOTPSent,
  onOTPVerified,
}) => {
  const { sendPhoneOTP, verifyPhoneOTP, isLoading, error } = useAuth();
  const [lastSentPhone, setLastSentPhone] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  const isTestMode = process.env.EXPO_PUBLIC_ENABLE_TEST_MODE === "true";
  const testOTP = process.env.EXPO_PUBLIC_TEST_OTP_CODE || "123456";

  const handleSendTestOTP = async () => {
    try {
      setDebugInfo("Sending OTP...");
      const result = await sendPhoneOTP(phoneNumber);

      setLastSentPhone(phoneNumber);
      setDebugInfo(
        `OTP sent to ${phoneNumber}. Result: ${JSON.stringify(result, null, 2)}`,
      );

      onOTPSent?.(result.success);

      if (result.success) {
        Alert.alert(
          "OTP Sent Successfully",
          `Test OTP: ${testOTP}\nPhone: ${phoneNumber}\nYou can now verify with the test OTP.`,
          [{ text: "OK" }],
        );
      } else {
        Alert.alert("OTP Send Failed", result.error || "Unknown error");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Send OTP failed";
      setDebugInfo(`Error: ${errorMessage}`);
      Alert.alert("Error", errorMessage);
    }
  };

  const handleVerifyTestOTP = async () => {
    try {
      setDebugInfo("Verifying test OTP...");
      const result = await verifyPhoneOTP(testOTP);

      setDebugInfo(
        `OTP verification result: ${JSON.stringify(result, null, 2)}`,
      );

      onOTPVerified?.(result.success);

      if (result.success) {
        Alert.alert(
          "OTP Verified Successfully",
          "Test OTP verification completed!",
        );
      } else {
        Alert.alert("OTP Verification Failed", result.error || "Unknown error");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Verify OTP failed";
      setDebugInfo(`Error: ${errorMessage}`);
      Alert.alert("Error", errorMessage);
    }
  };

  const handleVerifyWrongOTP = async () => {
    try {
      setDebugInfo("Verifying wrong OTP...");
      const result = await verifyPhoneOTP("000000");

      setDebugInfo(
        `Wrong OTP verification result: ${JSON.stringify(result, null, 2)}`,
      );

      Alert.alert(
        "Wrong OTP Test",
        result.success
          ? "Unexpected: Wrong OTP was accepted!"
          : `Expected failure: ${result.error}`,
      );
    } catch (error: any) {
      const errorMessage = error.message || "Verify wrong OTP failed";
      setDebugInfo(`Error: ${errorMessage}`);
      Alert.alert("Wrong OTP Error", errorMessage);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo("");
  };

  const showEnvironmentInfo = () => {
    const envInfo = {
      testMode: isTestMode,
      testOTP: testOTP,
      testPhone: process.env.EXPO_PUBLIC_TEST_PHONE_NUMBER || "Not set",
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY
        ? "Set"
        : "Not set",
      firebaseProjectId:
        process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "Not set",
    };

    Alert.alert("Environment Info", JSON.stringify(envInfo, null, 2), [
      { text: "OK" },
    ]);
  };

  // Only show in development mode
  if (!__DEV__) {
    return null;
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>🔧 OTP Debug Helper</Text>
        <Text style={styles.subtitle}>Development tools for OTP testing</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Test Mode:</Text>
          <Text
            style={[
              styles.infoValue,
              { color: isTestMode ? "#4CAF50" : "#F44336" },
            ]}
          >
            {isTestMode ? "Enabled" : "Disabled"}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Test Phone:</Text>
          <Text style={styles.infoValue}>{phoneNumber}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Test OTP:</Text>
          <Text style={styles.infoValue}>{testOTP}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSendTestOTP}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Send Test OTP
          </Button>

          <Button
            mode="contained"
            onPress={handleVerifyTestOTP}
            loading={isLoading}
            disabled={isLoading || !lastSentPhone}
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
          >
            Verify Correct OTP
          </Button>

          <Button
            mode="outlined"
            onPress={handleVerifyWrongOTP}
            loading={isLoading}
            disabled={isLoading || !lastSentPhone}
            style={styles.button}
          >
            Test Wrong OTP
          </Button>

          <Button
            mode="text"
            onPress={showEnvironmentInfo}
            style={styles.button}
          >
            Show Environment Info
          </Button>

          <Button mode="text" onPress={clearDebugInfo} style={styles.button}>
            Clear Debug Info
          </Button>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorLabel}>Current Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {debugInfo && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugLabel}>Debug Info:</Text>
            <ScrollView style={styles.debugScroll} nestedScrollEnabled>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </ScrollView>
          </View>
        )}

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>📋 Instructions:</Text>
          <Text style={styles.instructionsText}>
            1. Enable test mode in your .env file:{"\n"}
            EXPO_PUBLIC_ENABLE_TEST_MODE=true{"\n"}
            EXPO_PUBLIC_TEST_OTP_CODE=123456{"\n"}
            EXPO_PUBLIC_TEST_PHONE_NUMBER=+233246562377{"\n\n"}
            2. Restart the app after changing environment variables{"\n"}
            3. Use "Send Test OTP to initiate the flow{"\n"}
            4. Use Verify Correct OTP to test successful verification{"\n"}
            5. Use "Test Wrong OTP" to test error handling
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  infoValue: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  buttonContainer: {
    marginTop: 16,
    gap: 8,
  },
  button: {
    marginBottom: 8,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#C62828",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#D32F2F",
    fontFamily: "monospace",
  },
  debugContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 4,
  },
  debugScroll: {
    maxHeight: 120,
  },
  debugText: {
    fontSize: 11,
    color: "#424242",
    fontFamily: "monospace",
    lineHeight: 16,
  },
  instructionsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: "#388E3C",
    lineHeight: 18,
    fontFamily: "monospace",
  },
});

export default OTPDebugHelper;
