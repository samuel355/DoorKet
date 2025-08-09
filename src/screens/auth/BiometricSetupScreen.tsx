import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, Card, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { AuthStackParamList } from "@/types";
import { useAuth } from "@/store/authStore";
import BiometricService, { BiometricCapabilities } from "@/services/auth/biometric";


type BiometricSetupScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "BiometricSetup"
>;

interface BiometricSetupScreenProps {
  navigation: BiometricSetupScreenNavigationProp;
}

const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const { enableBiometric, user } = useAuth();

  const [capabilities, setCapabilities] =
    useState<BiometricCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingCapabilities, setIsCheckingCapabilities] = useState(true);

  useEffect(() => {
    checkBiometricCapabilities();
  }, []);

  const checkBiometricCapabilities = async () => {
    try {
      setIsCheckingCapabilities(true);
      const caps = await BiometricService.getCapabilities();
      setCapabilities(caps);
    } catch (error) {
      console.error("Error checking biometric capabilities:", error);
    } finally {
      setIsCheckingCapabilities(false);
    }
  };

  const handleEnableBiometric = async () => {
    if (!capabilities?.isAvailable) {
      Alert.alert(
        "Not Available",
        "Biometric authentication is not available on this device.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await enableBiometric();

      if (result.success) {
        Alert.alert(
          "Success",
          "Biometric authentication has been enabled for your account.",
          [{ text: "OK", onPress: handleComplete }],
        );
      } else {
        Alert.alert(
          "Setup Failed",
          result.error || "Failed to enable biometric authentication",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip Biometric Setup",
      "You can enable biometric authentication later in your account settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Skip", onPress: handleComplete },
      ],
    );
  };

  const handleComplete = () => {
    // Navigate to main app (this will be handled by auth state change)
    // For now, we'll just reset the navigation stack
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  };

  const getBiometricIcon = () => {
    if (!capabilities) return "finger-print";

    switch (capabilities.biometricType) {
      case "faceId":
        return "scan";
      case "fingerprint":
        return "finger-print";
      case "iris":
        return "eye";
      default:
        return "shield-checkmark";
    }
  };

  const getBiometricTitle = () => {
    if (!capabilities) return "Biometric Authentication";

    switch (capabilities.biometricType) {
      case "faceId":
        return "Face ID";
      case "fingerprint":
        return "Fingerprint";
      case "iris":
        return "Iris Scan";
      default:
        return "Biometric Authentication";
    }
  };

  const getBiometricDescription = () => {
    if (!capabilities?.isAvailable) {
      return "Biometric authentication is not available on this device.";
    }

    switch (capabilities.biometricType) {
      case "faceId":
        return "Use Face ID to quickly and securely access your DoorKet account.";
      case "fingerprint":
        return "Use your fingerprint to quickly and securely access your DoorKet account.";
      case "iris":
        return "Use iris scan to quickly and securely access your DoorKet account.";
      default:
        return "Use biometric authentication to quickly and securely access your DoorKet account.";
    }
  };

  if (isCheckingCapabilities) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#2196F3" />
          <Text style={styles.loadingText}>
            Checking device capabilities...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getBiometricIcon() as any}
              size={64}
              color={capabilities?.isAvailable ? "#4CAF50" : "#999999"}
            />
          </View>
          <Text style={styles.title}>Secure Your Account</Text>
          <Text style={styles.subtitle}>
            Add an extra layer of security to your DoorKet account
          </Text>
        </View>

        {/* Feature Card */}
        <Card style={styles.featureCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureTitle}>{getBiometricTitle()}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: capabilities?.isAvailable
                      ? "#e8f5e8"
                      : "#f5f5f5",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: capabilities?.isAvailable ? "#4CAF50" : "#666666",
                    },
                  ]}
                >
                  {capabilities?.isAvailable ? "Available" : "Not Available"}
                </Text>
              </View>
            </View>

            <Text style={styles.featureDescription}>
              {getBiometricDescription()}
            </Text>

            {capabilities?.isAvailable && (
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>Benefits:</Text>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.benefitText}>Quick and secure login</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.benefitText}>
                    No need to remember passwords
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.benefitText}>
                    Enhanced account security
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.securityText}>
            Your biometric data is stored securely on your device and never
            shared with DoorKet or third parties.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {capabilities?.isAvailable ? (
            <Button
              mode="contained"
              onPress={handleEnableBiometric}
              loading={isLoading}
              disabled={isLoading}
              style={styles.enableButton}
              contentStyle={styles.buttonContent}
              icon={() => (
                <Ionicons
                  name={getBiometricIcon() as any}
                  size={20}
                  color="#ffffff"
                />
              )}
            >
              Enable {getBiometricTitle()}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleComplete}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
            >
              Continue
            </Button>
          )}

          {capabilities?.isAvailable && (
            <Button
              mode="text"
              onPress={handleSkip}
              disabled={isLoading}
              style={styles.skipButton}
            >
              Skip for Now
            </Button>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can change these settings anytime in your account preferences.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    marginTop: 16,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#e3f2fd",
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
  },
  featureCard: {
    elevation: 4,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    marginBottom: 24,
  },
  cardContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  featureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  featureDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 13,
    color: "#666666",
    marginLeft: 8,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  securityText: {
    fontSize: 13,
    color: "#1976d2",
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  enableButton: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#4CAF50",
  },
  continueButton: {
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  skipButton: {
    alignSelf: "center",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default BiometricSetupScreen;
