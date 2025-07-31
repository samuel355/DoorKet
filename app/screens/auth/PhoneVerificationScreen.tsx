import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  TextInput as RNTextInput,
  Animated,
  Dimensions,
  TouchableOpacity,
  Vibration,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Button,
  TextInput,
  Text,
  Card,
  ActivityIndicator,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ColorPalette, LightTheme } from "../../theme/colors";
import { spacing, borderRadius, createShadows } from "../../theme/styling";
import { AuthStackParamList } from "@/types";
import { useAuth } from "@/store/authStore";

const { width, height } = Dimensions.get("window");
const shadows = createShadows(LightTheme);

type PhoneVerificationScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "PhoneVerification"
>;

type PhoneVerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  "PhoneVerification"
>;

interface PhoneVerificationScreenProps {
  navigation: PhoneVerificationScreenNavigationProp;
  route: PhoneVerificationScreenRouteProp;
}

const FORM_STORAGE_KEY = "register_form_data";

const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { phone, userType } = route.params;
  const insets = useSafeAreaInsets();

  const { verifyPhoneOTP, resendPhoneOTP, isLoading, error, clearError } =
    useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Refs for OTP inputs
  const otpRefs = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    clearError();
    startCountdown();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 0.8,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Pulse animation for phone icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimation.start();

    // Floating animation for background elements
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    );
    floatingAnimation.start();
  };

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all fields are filled
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      setTimeout(() => {
        handleVerifyOTP(newOtp.join(""));
      }, 500);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join("");
    if (code.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter a 6-digit verification code.");
      shakeAnimation();
      return;
    }

    try {
      setIsVerifying(true);
      Vibration.vibrate(50);

      const result = await verifyPhoneOTP(code);

      if (result.success) {
        // Load existing form data and add verification status
        try {
          const existingData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
          let formData;

          if (existingData) {
            // Preserve existing registration data and add verification
            formData = {
              ...JSON.parse(existingData),
              phone,
              userType,
              verified: true,
            };
          } else {
            // Fallback if no existing data
            formData = {
              phone,
              userType,
              verified: true,
            };
          }

          await AsyncStorage.setItem(
            FORM_STORAGE_KEY,
            JSON.stringify(formData),
          );
        } catch (error) {
          console.warn("Failed to preserve form data:", error);
          // Continue navigation even if storage fails
        }

        // Navigate to ProfileSetup
        navigation.navigate("ProfileSetup", {
          phone,
          userType: userType || "student",
        });
      } else {
        shakeAnimation();
        Alert.alert("Verification Failed", result.error || "Invalid OTP code");
      }
    } catch (error: any) {
      shakeAnimation();
      Alert.alert(
        "Verification Error",
        error.message || "Failed to verify OTP. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      Vibration.vibrate(30);

      const result = await resendPhoneOTP(phone);

      if (result.success) {
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        startCountdown();
        Alert.alert("OTP Sent", "A new verification code has been sent.");
      } else {
        Alert.alert("Resend Failed", result.error || "Failed to resend OTP");
      }
    } catch (error: any) {
      Alert.alert(
        "Resend Error",
        error.message || "Failed to resend OTP. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const floatY1 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const floatY2 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "80%"],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          ColorPalette.primary[700],
          ColorPalette.primary[600],
          ColorPalette.secondary[500],
          ColorPalette.accent[500],
        ]}
        locations={[0, 0.4, 0.7, 1]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            { transform: [{ translateY: floatY1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            { transform: [{ translateY: floatY2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            { transform: [{ translateY: floatY1 }] },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <LinearGradient
                  colors={[
                    ColorPalette.pure.white,
                    "rgba(255, 255, 255, 0.95)",
                  ]}
                  style={styles.iconGradient}
                >
                  <Ionicons
                    name="call"
                    size={48}
                    color={ColorPalette.primary[600]}
                  />
                </LinearGradient>
              </Animated.View>

              <Text style={styles.title}>Verify Your Phone</Text>
              <Text style={styles.subtitle}>
                We&apos;ve sent a verification code to
              </Text>
              <View style={styles.phoneContainer}>
                <Text style={styles.phoneNumber}>{phone}</Text>
              </View>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressWidth,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      ColorPalette.secondary[500],
                      ColorPalette.accent[500],
                    ]}
                    style={styles.progressGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </Animated.View>
              </View>
              <Text style={styles.progressText}>Step 2 of 3</Text>
            </View>

            {/* Main Card */}
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                {/* Error Display */}
                {error && (
                  <Animated.View
                    style={[
                      styles.errorContainer,
                      { transform: [{ translateX: shakeAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        ColorPalette.error[500],
                        ColorPalette.error[600],
                      ]}
                      style={styles.errorGradient}
                    >
                      <Ionicons
                        name="alert-circle"
                        size={20}
                        color={ColorPalette.pure.white}
                      />
                      <Text style={styles.errorMessage}>{error}</Text>
                    </LinearGradient>
                  </Animated.View>
                )}

                {/* OTP Input Section */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Enter Verification Code</Text>

                  <Animated.View
                    style={[
                      styles.otpContainer,
                      { transform: [{ translateX: shakeAnim }] },
                    ]}
                  >
                    {otp.map((digit, index) => (
                      <View key={index} style={styles.otpInputWrapper}>
                        <TextInput
                          ref={(ref: any) => (otpRefs.current[index] = ref)}
                          value={digit}
                          onChangeText={(value) =>
                            handleOtpChange(value, index)
                          }
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          style={styles.otpInput}
                          contentStyle={[
                            styles.otpInputContent,
                            {
                              color: digit
                                ? ColorPalette.primary[600]
                                : ColorPalette.neutral[400],
                            },
                          ]}
                          outlineStyle={[
                            styles.otpInputOutline,
                            digit && styles.otpInputFilled,
                          ]}
                          mode="outlined"
                          keyboardType="numeric"
                          maxLength={1}
                          textAlign="center"
                          autoComplete="one-time-code"
                          selectTextOnFocus
                        />
                        {digit && (
                          <View style={styles.inputCheckmark}>
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={ColorPalette.success[500]}
                            />
                          </View>
                        )}
                      </View>
                    ))}
                  </Animated.View>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={() => handleVerifyOTP()}
                  disabled={
                    otp.some((digit) => digit === "") ||
                    isVerifying ||
                    isLoading
                  }
                  style={[
                    styles.verifyButtonContainer,
                    (otp.some((digit) => digit === "") ||
                      isVerifying ||
                      isLoading) &&
                      styles.disabledButton,
                  ]}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      otp.some((digit) => digit === "") ||
                      isVerifying ||
                      isLoading
                        ? [ColorPalette.neutral[400], ColorPalette.neutral[300]]
                        : [
                            ColorPalette.primary[600],
                            ColorPalette.primary[500],
                            ColorPalette.secondary[500],
                          ]
                    }
                    style={styles.verifyButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isVerifying || isLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={ColorPalette.pure.white}
                      />
                    ) : (
                      <>
                        <Text style={styles.verifyButtonText}>Verify Code</Text>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={ColorPalette.pure.white}
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Resend Section */}
                <View style={styles.resendContainer}>
                  {!canResend ? (
                    <View style={styles.countdownContainer}>
                      <Ionicons
                        name="time"
                        size={16}
                        color={ColorPalette.neutral[600]}
                      />
                      <Text style={styles.countdownText}>
                        Resend code in {formatTime(countdown)}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={isResending}
                      style={styles.resendButton}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[
                          ColorPalette.pure.white,
                          ColorPalette.neutral[50],
                        ]}
                        style={styles.resendButtonGradient}
                      >
                        {isResending ? (
                          <ActivityIndicator
                            size="small"
                            color={ColorPalette.primary[600]}
                          />
                        ) : (
                          <Ionicons
                            name="refresh"
                            size={18}
                            color={ColorPalette.primary[600]}
                          />
                        )}
                        <Text style={styles.resendButtonText}>
                          {isResending ? "Sending..." : "Resend Code"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Help Section */}
                <View style={styles.helpContainer}>
                  <LinearGradient
                    colors={[ColorPalette.info[100], ColorPalette.info[50]]}
                    style={styles.helpGradient}
                  >
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={ColorPalette.info[600]}
                    />
                    <Text style={styles.helpText}>
                      Didn&apos;t receive the code? Check your SMS messages or
                      try resending after the countdown.
                    </Text>
                  </LinearGradient>
                </View>
              </View>
            </Card>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Having trouble?{" "}
                <Text
                  style={styles.footerLink}
                  onPress={() => navigation.goBack()}
                >
                  Go back and try again
                </Text>
              </Text>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.2)",
                    "rgba(255, 255, 255, 0.1)",
                  ]}
                  style={styles.backButtonGradient}
                >
                  <Ionicons
                    name="arrow-back"
                    size={18}
                    color={ColorPalette.pure.white}
                  />
                  <Text style={styles.backButtonText}>Back</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.primary[600],
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.full,
  },
  element1: {
    width: 80,
    height: 80,
    top: height * 0.15,
    left: width * 0.1,
  },
  element2: {
    width: 60,
    height: 60,
    top: height * 0.3,
    right: width * 0.15,
  },
  element3: {
    width: 100,
    height: 100,
    bottom: height * 0.2,
    right: width * 0.05,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxxxxl,
    paddingBottom: spacing.xxxxl,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxxxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.xl,
    ...shadows.xl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: ColorPalette.pure.white,
    marginBottom: spacing.md,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: spacing.md,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  phoneContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  phoneNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    textAlign: "center",
    letterSpacing: 1,
  },
  progressContainer: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.sm,
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  card: {
    borderRadius: borderRadius.xxl,
    backgroundColor: ColorPalette.pure.white,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xl,
    ...shadows.xl,
  },
  cardContent: {
    padding: spacing.xxxxl,
  },
  errorContainer: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  errorGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  errorMessage: {
    color: ColorPalette.pure.white,
    fontSize: 14,
    marginLeft: spacing.md,
    flex: 1,
    fontWeight: "500",
  },
  inputSection: {
    marginBottom: spacing.xxxxl,
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
    marginBottom: spacing.xl,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: spacing.md,
  },
  otpInputWrapper: {
    position: "relative",
    flex: 1,
  },
  otpInput: {
    backgroundColor: "transparent",
    height: 64,
  },
  otpInputContent: {
    fontSize: 24,
    fontWeight: "700",
  },
  otpInputOutline: {
    borderWidth: 2,
    borderColor: ColorPalette.neutral[200],
    borderRadius: borderRadius.lg,
  },
  otpInputFilled: {
    borderColor: ColorPalette.primary[500],
    backgroundColor: ColorPalette.primary[50],
  },
  inputCheckmark: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: ColorPalette.pure.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.md,
  },
  verifyButtonContainer: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  disabledButton: {
    opacity: 0.5,
    ...shadows.sm,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    letterSpacing: 0.3,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
    minHeight: 48,
    justifyContent: "center",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorPalette.neutral[100],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  countdownText: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "600",
  },
  resendButton: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  resendButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: ColorPalette.primary[200],
    gap: spacing.sm,
  },
  resendButtonText: {
    color: ColorPalette.primary[600],
    fontSize: 16,
    fontWeight: "600",
  },
  helpContainer: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  helpGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
  },
  helpText: {
    fontSize: 14,
    color: ColorPalette.info[700],
    marginLeft: spacing.md,
    flex: 1,
    lineHeight: 20,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: spacing.lg,
    fontWeight: "500",
  },
  footerLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  backButton: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  backButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backButtonText: {
    color: ColorPalette.pure.white,
    fontWeight: "600",
    fontSize: 16,
  },
});

export default PhoneVerificationScreen;
