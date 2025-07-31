import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Button,
  Card,
  IconButton,
  Portal,
  Modal,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from "../../constants";
import { AuthStackParamList } from "@/types";
import { useAuth } from "@/store/authStore";
import supabase, { AuthService } from "@/services/supabase";

type EmailVerificationNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "EmailVerification"
>;

type EmailVerificationRouteProp = RouteProp<
  AuthStackParamList,
  "EmailVerification"
>;

interface EmailVerificationScreenProps {
  navigation: EmailVerificationNavigationProp;
  route: EmailVerificationRouteProp;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { email, userType } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    // Set up app state listener to check verification when app becomes active
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    // Countdown timer for resend button
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // When app becomes active, check if user has verified their email
    if (nextAppState === "active") {
      checkVerificationStatus();
    }
  };

  const checkVerificationStatus = async () => {
    try {
      setIsLoading(true);

      // Get current session to check if email is verified
      const { session, error } = await AuthService.getCurrentSession();

      if (session?.user?.email_confirmed_at) {
        // Email is verified, proceed to profile setup
        Alert.alert(
          "Email Verified! ✅",
          "Your email has been verified successfully. You can now complete your profile setup.",
          [
            {
              text: "Continue",
              onPress: () => {
                navigation.replace("Register", { userType });
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    try {
      setIsLoading(true);

      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        throw error;
      }

      setCountdown(60); // 60 second cooldown
      Alert.alert(
        "Email Sent",
        "A new verification email has been sent to your inbox.",
      );
    } catch (error: any) {
      console.error("Resend email error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to resend verification email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEmailApp = () => {
    // Try to open the default email app
    Linking.openURL("mailto:").catch(() => {
      Alert.alert(
        "No Email App",
        "Please open your email app manually to check for the verification email.",
      );
    });
  };

  const handleBackToLogin = () => {
    Alert.alert(
      "Back to Login",
      "Are you sure you want to go back? You'll need to verify your email later to complete registration.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go Back",
          onPress: () => navigation.navigate("Login"),
        },
      ],
    );
  };

  const renderHelpModal = () => (
    <Portal>
      <Modal
        visible={showHelpModal}
        onDismiss={() => setShowHelpModal(false)}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Need Help?</Text>
          <IconButton
            icon="close"
            size={24}
            onPress={() => setShowHelpModal(false)}
          />
        </View>

        <View style={styles.helpContent}>
          <View style={styles.helpItem}>
            <Ionicons name="mail" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.helpText}>
              Check your spam/junk folder if you dont see the email
            </Text>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="time" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.helpText}>
              It may take a few minutes for the email to arrive
            </Text>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="refresh" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.helpText}>
              Use the Resend Email button if needed
            </Text>
          </View>

          <View style={styles.helpItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.helpText}>
              Return to this app after clicking the verification link
            </Text>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={() => setShowHelpModal(false)}
          style={styles.helpCloseButton}
        >
          Got it
        </Button>
      </Modal>
    </Portal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleBackToLogin}
          style={styles.backButton}
        />
        <IconButton
          icon="help-circle"
          size={24}
          onPress={() => setShowHelpModal(true)}
          style={styles.helpButton}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.emailIcon}>
            <Ionicons name="mail" size={64} color={COLORS.PRIMARY} />
          </View>
        </View>

        <Text style={styles.title}>Check Your Email</Text>

        <Text style={styles.subtitle}>
          We have sent a verification link to:
        </Text>

        <Text style={styles.email}>{email}</Text>

        <Text style={styles.description}>
          Click the link in your email to verify your account and continue with
          registration.
        </Text>

        <Card style={styles.instructionsCard}>
          <Card.Content>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepText}>1</Text>
              </View>
              <Text style={styles.stepDescription}>
                Open your email app and find our verification email
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepText}>2</Text>
              </View>
              <Text style={styles.stepDescription}>
                Click the Verify Email button in the email
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepText}>3</Text>
              </View>
              <Text style={styles.stepDescription}>
                Return to this app to complete your registration
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleOpenEmailApp}
          style={styles.actionButton}
          icon="mail"
        >
          Open Email App
        </Button>

        <Button
          mode="text"
          onPress={handleResendEmail}
          loading={isLoading}
          disabled={countdown > 0}
          style={styles.actionButton}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend Email"}
        </Button>

        <Button
          mode="contained"
          onPress={checkVerificationStatus}
          loading={isLoading}
          style={styles.primaryButton}
        >
          I have Verified My Email
        </Button>
      </View>

      {renderHelpModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.SM,
  },
  backButton: {
    margin: 0,
  },
  helpButton: {
    margin: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.XL,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: SPACING.XXL,
  },
  emailIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: "center",
    marginBottom: SPACING.MD,
  },
  subtitle: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: SPACING.SM,
  },
  email: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.PRIMARY,
    textAlign: "center",
    marginBottom: SPACING.LG,
  },
  description: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: FONTS.LINE_HEIGHT.RELAXED * FONTS.SIZE.MD,
    marginBottom: SPACING.XXL,
  },
  instructionsCard: {
    width: "100%",
    marginBottom: SPACING.XL,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.LG,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.MD,
  },
  stepText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  stepDescription: {
    flex: 1,
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: FONTS.LINE_HEIGHT.RELAXED * FONTS.SIZE.SM,
  },
  actions: {
    paddingHorizontal: SPACING.XL,
    paddingBottom: SPACING.XL,
    gap: SPACING.MD,
  },
  actionButton: {
    marginBottom: SPACING.SM,
  },
  primaryButton: {
    marginTop: SPACING.MD,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.XL,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XL,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.LG,
  },
  modalTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  helpContent: {
    marginBottom: SPACING.XL,
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.LG,
  },
  helpText: {
    flex: 1,
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.MD,
    lineHeight: FONTS.LINE_HEIGHT.RELAXED * FONTS.SIZE.SM,
  },
  helpCloseButton: {
    alignSelf: "stretch",
  },
});

export default EmailVerificationScreen;
