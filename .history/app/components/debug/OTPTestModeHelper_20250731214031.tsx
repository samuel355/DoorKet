import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Card, Button, Chip } from "react-native-paper";

interface OTPTestModeHelperProps {
  phoneNumber: string;
  onTestModeEnabled?: () => void;
  visible?: boolean;
}

const OTPTestModeHelper: React.FC<OTPTestModeHelperProps> = ({
  phoneNumber,
  onTestModeEnabled,
  visible = true,
}) => {
  const { sendPhoneOTP, isLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (!__DEV__ || !visible) {
    return null;
  }

  const isTestMode = process.env.EXPO_PUBLIC_ENABLE_TEST_MODE === "true";
  const testOTP = process.env.EXPO_PUBLIC_TEST_OTP_CODE || "123456";
  const testPhone =
    process.env.EXPO_PUBLIC_TEST_PHONE_NUMBER || "+233246562377";

  const testPhoneNumbers = [
    "+233246562377",
    "+233000000000",
    "+233111111111",
    "0246562377",
  ];

  const isValidTestPhone = testPhoneNumbers.some(
    (test) => phoneNumber === test || phoneNumber === test.replace("+233", "0"),
  );

  const handleQuickTest = async () => {
    try {
      console.log("🧪 QUICK TEST: Sending OTP to test number...");
      const result = await sendPhoneOTP(testPhone);

      Alert.alert(
        "Test Result",
        `OTP Send: ${result.success ? "SUCCESS ✅" : "FAILED ❌"}\n\n` +
          `Phone: ${testPhone}\n` +
          `Use OTP: ${testOTP}\n\n` +
          `${result.error ? `Error: ${result.error}` : "Test mode is working!"}`,
        [{ text: "OK", onPress: () => onTestModeEnabled?.() }],
      );
    } catch (error: any) {
      Alert.alert(
        "Test Failed",
        `Error: ${error.message}\n\nCheck console for details.`,
      );
    }
  };

  const showEnvironmentHelp = () => {
    const instructions = `To enable test mode:

1. Create/edit .env file in project root:
   EXPO_PUBLIC_ENABLE_TEST_MODE=true
   EXPO_PUBLIC_TEST_OTP_CODE=123456
   EXPO_PUBLIC_TEST_PHONE_NUMBER=+233246562377

2. Restart Expo: npm start --clear

3. Use test phone: ${testPhone}
   Use OTP code: ${testOTP}`;

    Alert.alert("Test Mode Setup", instructions, [
      {
        text: "Copy Phone Number",
        onPress: () => {
          // In a real app, you'd copy to clipboard
          console.log("Test phone copied:", testPhone);
        },
      },
      { text: "OK" },
    ]);
  };

  return (
    <Card style={styles.container}>
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.header}
      >
        <Text style={styles.title}>
          🧪 OTP Test Mode {isTestMode ? "✅" : "❌"}
        </Text>
        <Text style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.statusRow}>
            <Chip
              icon={isTestMode ? "check" : "close"}
              style={[
                styles.chip,
                { backgroundColor: isTestMode ? "#E8F5E8" : "#FFF3E0" },
              ]}
            >
              Test Mode: {isTestMode ? "ENABLED" : "DISABLED"}
            </Chip>
          </View>

          <View style={styles.statusRow}>
            <Chip
              icon={isValidTestPhone ? "check" : "alert"}
              style={[
                styles.chip,
                { backgroundColor: isValidTestPhone ? "#E8F5E8" : "#FFEBEE" },
              ]}
            >
              Valid Test Phone: {isValidTestPhone ? "YES" : "NO"}
            </Chip>
          </View>

          <Text style={styles.infoText}>Current Phone: {phoneNumber}</Text>

          <Text style={styles.infoText}>Test OTP Code: {testOTP}</Text>

          <View style={styles.buttonContainer}>
            {isTestMode ? (
              <Button
                mode="contained"
                onPress={handleQuickTest}
                loading={isLoading}
                disabled={isLoading}
                style={styles.testButton}
                buttonColor="#4CAF50"
              >
                Quick Test OTP
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={showEnvironmentHelp}
                style={styles.helpButton}
              >
                Enable Test Mode
              </Button>
            )}
          </View>

          {!isValidTestPhone && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ Use a test phone number:
              </Text>
              {testPhoneNumbers.map((phone, index) => (
                <Text key={index} style={styles.phoneOption}>
                  • {phone}
                </Text>
              ))}
            </View>
          )}

          <Text style={styles.instructions}>
            💡 Test mode bypasses real SMS and works in Expo Go
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
  },
  expandIcon: {
    fontSize: 14,
    color: "#666",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statusRow: {
    marginBottom: 8,
  },
  chip: {
    alignSelf: "flex-start",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  buttonContainer: {
    marginVertical: 16,
  },
  testButton: {
    borderRadius: 8,
  },
  helpButton: {
    borderRadius: 8,
    borderColor: "#FF9800",
  },
  warningContainer: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F57C00",
    marginBottom: 8,
  },
  phoneOption: {
    fontSize: 14,
    color: "#555",
    fontFamily: "monospace",
    marginLeft: 8,
  },
  instructions: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
  },
});

export default OTPTestModeHelper;
