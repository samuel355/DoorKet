import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";

// import { validatePhoneNumber } from "../../services/firebase"; // Commented out - phone auth disabled
import AnimatedInput from "../../components/ui/AnimatedInput";
import GradientButton from "../../components/ui/GradientButton";
import { LightTheme, ColorPalette } from "../../theme/colors";
import { spacing, borderRadius, createShadows } from "../../theme/styling";
import { ErrorBoundary } from "../../components/common";

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Login"
>;
type LoginScreenRouteProp = RouteProp<AuthStackParamList, "Login">;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
}

interface LoginForm {
  // phone?: string; // Commented out - phone auth disabled
  email?: string;
  password?: string;
}

// type LoginMode = "phone" | "email"; // Commented out - phone auth disabled

const { width, height } = Dimensions.get("window");
const shadows = createShadows(LightTheme);

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route }) => {
  const { userType } = route.params || {};

  const { signInWithEmail, signInWithGoogle, isLoading, error, clearError } =
    useAuth();

  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const toggleAnimation = useRef(new Animated.Value(0)).current;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation
    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      }),
    ).start();

    clearError();
  }, []);
  //   Animated.timing(toggleAnimation, {
  //     toValue: loginMode === "phone" ? 0 : 1,
  //     duration: 300,
  //     useNativeDriver: false,
  //   }).start();

  //   reset();
  //   clearError();
  // }, [loginMode]);

  // Phone authentication commented out - disabled for now
  // const onPhoneSubmit = async (data: LoginForm) => {
  //   if (!data.phone) {
  //     Alert.alert("Error", "Please enter a phone number");
  //     return;
  //   }
  //
  //   try {
  //     clearError();
  //     const result = await sendPhoneOTP(data.phone);
  //
  //     if (result.success) {
  //       navigation.navigate("PhoneVerification", {
  //         phone: data.phone,
  //         userType: userType,
  //       });
  //     } else {
  //       Alert.alert(
  //         "Error",
  //         result.error || "Failed to send verification code",
  //       );
  //     }
  //   } catch (error: any) {
  //     Alert.alert("Error", error.message || "Something went wrong");
  //   }
  // };

  const onEmailSubmit = async (data: LoginForm) => {
    try {
      clearError();

      if (!data.email || !data.password) {
        Alert.alert("Validation Error", "Email and password are required");
        return;
      }

      const authResult = await signInWithEmail(data.email, data.password);

      if (!authResult.success) {
        const formattedError = handleAuthError({
          message: authResult.error || "Invalid email or password",
        });
        Alert.alert("Login Failed", formattedError);
        return;
      }

      console.log("✅ Login successful");
    } catch (error: any) {
      console.error("Login error caught:", error);
      const formattedError = handleAuthError(error);
      Alert.alert("Login Error", formattedError);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      clearError();

      const authResult = await signInWithGoogle();

      if (!authResult.success) {
        const formattedError = formatErrorMessage(
          { message: authResult.error || "Google sign-in failed" },
          "Google Sign-In",
        );
        Alert.alert("Google Sign-In Failed", formattedError, [
          {
            text: "Create Account",
            onPress: () => navigation.navigate("UserTypeSelection"),
          },
          { text: "OK", style: "cancel" },
        ]);
        return;
      }

      console.log("✅ Google sign-in successful");
    } catch (error: any) {
      console.error("Google sign-in error caught:", error);
      const formattedError = formatErrorMessage(error, "Google Sign-In");
      Alert.alert("Google Sign-In Error", formattedError, [
        {
          text: "Create Account",
          onPress: () => navigation.navigate("UserTypeSelection"),
        },
        { text: "OK", style: "cancel" },
      ]);
    }
  };

  const logoRotate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // const toggleIndicatorPosition = toggleAnimation.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [4, 150],
  // });

  // Phone form commented out - phone auth disabled
  // const renderPhoneForm = () => (
  //   <View style={styles.formContainer}>
  //     <Controller
  //       control={control}
  //       name="phone"
  //       rules={{
  //         required: "Phone number is required",
  //         validate: (value) => {
  //           if (!value) return "Phone number is required";
  //           if (!validatePhoneNumber(value)) {
  //             return "Please enter a valid Ghana phone number";
  //           }
  //           return true;
  //         },
  //       }}
  //       render={({ field: { onChange, value } }) => (
  //         <AnimatedInput
  //           label="Phone Number"
  //           value={value || ""}
  //           onChangeText={(text) => {
  //             onChange(text);
  //             clearError();
  //           }}
  //           error={errors.phone?.message}
  //           leftIcon="call"
  //           placeholder="+233 XX XXX XXXX"
  //           keyboardType="phone-pad"
  //           textContentType="telephoneNumber"
  //           autoCapitalize="none"
  //           autoComplete="tel"
  //           required
  //           theme={{
  //             primary: ColorPalette.primary.main,
  //             background: ColorPalette.pure.white,
  //             surface: ColorPalette.neutral[50],
  //             text: ColorPalette.neutral[900],
  //             placeholder: ColorPalette.neutral[500],
  //             error: ColorPalette.semantic.error,
  //           }}
  //         />
  //       )}
  //     />
  //
  //     <GradientButton
  //       title="Send OTP"
  //       onPress={handleSubmit(onPhoneSubmit)}
  //       loading={isLoading}
  //       disabled={isLoading}
  //       variant="primary"
  //       size="large"
  //       fullWidth
  //       style={styles.submitButton}
  //       icon="arrow-forward"
  //     />
  //   </View>
  // );

  const renderEmailForm = () => (
    <View style={styles.formContainer}>
      <Controller
        control={control}
        name="email"
        rules={{
          required: "Email is required",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Invalid email address",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <AnimatedInput
            label="Email Address"
            value={value || ""}
            onChangeText={(text) => {
              onChange(text);
              clearError();
            }}
            error={errors.email?.message}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            required
            theme={{
              primary: ColorPalette.primary[500],
              background: ColorPalette.pure.white,
              surface: ColorPalette.neutral[50],
              text: ColorPalette.neutral[800],
              error: ColorPalette.error[500],
            }}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{
          required: "Password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <AnimatedInput
            label="Password"
            value={value || ""}
            onChangeText={(text) => {
              onChange(text);
              clearError();
            }}
            error={errors.password?.message}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            secureTextEntry={!showPassword}
            required
            theme={{
              primary: ColorPalette.primary[500],
              background: ColorPalette.pure.white,
              surface: ColorPalette.neutral[50],
              text: ColorPalette.neutral[800],
              error: ColorPalette.error[500],
            }}
          />
        )}
      />

      <TouchableOpacity style={styles.forgotButton}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <GradientButton
        title="Sign In"
        onPress={handleSubmit(onEmailSubmit)}
        loading={isLoading}
        disabled={isLoading}
        variant="primary"
        size="large"
        fullWidth
        style={styles.submitButton}
        icon="arrow-forward"
      />
    </View>
  );

  return (
    <ErrorBoundary level="screen">
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        {/* Background Gradient */}
        <LinearGradient
          colors={[
            ColorPalette.primary[600],
            ColorPalette.primary[500],
            ColorPalette.secondary[500],
          ]}
          locations={[0, 0.6, 1]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Floating Elements */}
        <View style={styles.floatingElements}>
          <View style={[styles.floatingElement, styles.element1]} />
          <View style={[styles.floatingElement, styles.element2]} />
          <View style={[styles.floatingElement, styles.element3]} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
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
                    styles.logoContainer,
                    { transform: [{ rotate: logoRotate }] },
                  ]}
                >
                  <LinearGradient
                    colors={[ColorPalette.pure.white, "rgba(255,255,255,0.9)"]}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name="basket"
                      size={36}
                      color={ColorPalette.primary[600]}
                    />
                  </LinearGradient>
                </Animated.View>

                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subtitleText}>
                  Sign in to continue your shopping journey
                </Text>
              </View>

              {/* Login Form Card */}
              <View style={styles.formCard}>
                <LinearGradient
                  colors={[ColorPalette.pure.white, "rgba(255,255,255,0.98)"]}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Header */}
                  <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Sign in with your email</Text>
                  </View>

                  {/* Mode Toggle - Commented out, only email auth now */}
                  {/* <View style={styles.toggleContainer}>
                  <View style={styles.toggleTrack}>
                    Phone/Email toggle commented out - only email auth now
                  </View>
                </View> */}

                  {/* Error Display */}
                  {error && (
                    <Animated.View style={styles.errorContainer}>
                      <LinearGradient
                        colors={[
                          ColorPalette.error[50],
                          ColorPalette.error[100],
                        ]}
                        style={styles.errorGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={20}
                          color={ColorPalette.error[600]}
                        />
                        <Text style={styles.errorText}>{error}</Text>
                      </LinearGradient>
                    </Animated.View>
                  )}

                  {/* Form Fields - Only email form now */}
                  {renderEmailForm()}

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Google Sign In */}
                  <GradientButton
                    title="Continue with Google"
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                    variant="secondary"
                    size="large"
                    fullWidth
                    style={styles.googleButton}
                    gradient={[
                      ColorPalette.pure.white,
                      ColorPalette.neutral[50],
                    ]}
                    textStyle={styles.googleButtonText}
                    icon="person-add"
                  />
                </LinearGradient>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("UserTypeSelection")}
                >
                  <Text style={styles.footerLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
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
    top: height * 0.1,
    left: -40,
  },
  element2: {
    width: 60,
    height: 60,
    top: height * 0.3,
    right: -30,
  },
  element3: {
    width: 100,
    height: 100,
    bottom: height * 0.2,
    left: width * 0.8,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === "android" ? spacing.xxxxl : spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxxxl,
    paddingTop: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "800",
    color: ColorPalette.pure.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },
  formCard: {
    borderRadius: borderRadius.xxxl,
    overflow: "hidden",
    marginBottom: spacing.xxxl,
    ...shadows.xl,
  },
  cardGradient: {
    padding: spacing.xxxl,
  },
  toggleContainer: {
    marginBottom: spacing.xxxl,
  },
  toggleTrack: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: ColorPalette.neutral[100],
    borderRadius: borderRadius.xl,
    padding: 4,
    height: 50,
    width: 300,
    alignSelf: "center",
    overflow: "hidden",
  },
  toggleIndicator: {
    position: "absolute",
    top: 4,
    width: 146,
    height: 42,
    backgroundColor: ColorPalette.primary[500],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    zIndex: 1,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },

  errorGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: ColorPalette.error[600],
    fontWeight: "500",
  },
  formContainer: {
    gap: spacing.lg,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -spacing.sm,
  },
  forgotText: {
    fontSize: 14,
    color: ColorPalette.primary[600],
    fontWeight: "600",
  },
  submitButton: {
    marginTop: spacing.sm,
    ...shadows.md,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xxxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ColorPalette.neutral[200],
  },
  dividerText: {
    marginHorizontal: spacing.lg,
    fontSize: 14,
    color: ColorPalette.neutral[500],
    fontWeight: "500",
  },
  googleButton: {
    borderWidth: 1,
    borderColor: ColorPalette.neutral[200],
    ...shadows.sm,
  },
  googleButtonText: {
    color: ColorPalette.neutral[700],
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  footerText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  footerLink: {
    fontSize: 16,
    color: ColorPalette.pure.white,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  headerContainer: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default LoginScreen;
