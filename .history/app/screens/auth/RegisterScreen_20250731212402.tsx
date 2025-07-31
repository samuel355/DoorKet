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
import {
  Button,
  TextInput,
  Text,
  Card,
  HelperText,
  useTheme,
  Portal,
  Modal,
  List,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthStackParamList, UserType, RegisterData } from "../../types";
import { useAuth } from "../../store/authStore";
import GradientButton from "../../components/ui/GradientButton";
import AnimatedInput from "../../components/ui/AnimatedInput";
import ModalSelector from "../../components/ui/ModalSelector";
import RegistrationDebugHelper from "../../components/debug/RegistrationDebugHelper";
import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";
import EmailVerificationScreen from "./EmailVerificationScreen";

const { width, height } = Dimensions.get("window");

type RegisterScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Register"
>;
type RegisterScreenRouteProp = RouteProp<AuthStackParamList, "Register">;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
  route: RegisterScreenRouteProp;
}

interface RegisterForm {
  full_name: string;
  email: string; // Required now since no phone auth
  password: string; // Required for email/password auth
  // phone: string; // Commented out - phone auth disabled
  university: string;
  hall_hostel?: string;
  room_number?: string;
}

const UNIVERSITIES = ["KNUST", "University of Ghana", "KNUST-Tech", "Other"];
const FORM_STORAGE_KEY = "register_form_data";

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();
  // const { phone, userType } = route.params as {
  //   phone: string;
  //   userType?: UserType;
  // }; // Commented out - phone auth disabled
  const { userType } = route.params as {
    userType?: UserType;
  };

  const {
    createUserProfile,
    signUpWithEmail,
    /* sendPhoneOTP, */ isLoading,
    error,
    clearError,
  } = useAuth(); // sendPhoneOTP commented out - phone auth disabled

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;

  // UI state
  const [selectedUniversity, setSelectedUniversity] = useState("KNUST");
  const [showHallField, setShowHallField] = useState(true);
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<RegisterForm>({
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      // phone: phone || "", // Commented out - phone auth disabled
      university: "KNUST",
      hall_hostel: "",
      room_number: "",
    },
  });

  const watchedUniversity = watch("university");
  const formValues = watch();

  // Load persisted form data
  useEffect(() => {
    loadPersistedData();
    startAnimations();
  }, []);

  // Save form data on changes
  useEffect(() => {
    saveFormData();
  }, [formValues]);

  useEffect(() => {
    clearError();
    setShowHallField(watchedUniversity === "KNUST" && userType === "student");
  }, [watchedUniversity, userType]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const loadPersistedData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Restore persisted form data
        Object.keys(parsedData).forEach((key) => {
          setValue(key as keyof RegisterForm, parsedData[key]);
        });
        // Phone auth logic commented out - disabled
        // if (!phone) {
        //   Object.keys(parsedData).forEach((key) => {
        //     setValue(key as keyof RegisterForm, parsedData[key]);
        //   });
        // } else {
        //   // If coming from phone verification, merge with existing data
        //   Object.keys(parsedData).forEach((key) => {
        //     if (key !== "phone") {
        //       setValue(key as keyof RegisterForm, parsedData[key]);
        //     }
        //   });
        // }
        setSelectedUniversity(parsedData.university || "KNUST");
      }
    } catch (error) {
      console.warn("Failed to load persisted form data:", error);
    }
  };

  const saveFormData = async () => {
    try {
      const currentValues = getValues();
      await AsyncStorage.setItem(
        FORM_STORAGE_KEY,
        JSON.stringify(currentValues),
      );
    } catch (error) {
      console.warn("Failed to save form data:", error);
    }
  };

  const clearPersistedData = async () => {
    try {
      await AsyncStorage.removeItem(FORM_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear persisted data:", error);
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Phone submission commented out - phone auth disabled
  // const handlePhoneSubmit = async (phoneNumber: string) => {
  //   try {
  //     setIsSubmitting(true);
  //     clearError();
  //
  //     // Save current form data before navigation
  //     await saveFormData();
  //
  //     const result = await sendPhoneOTP(phoneNumber);
  //     if (result.success) {
  //       navigation.navigate("PhoneVerification", {
  //         phone: phoneNumber,
  //         userType: userType,
  //       });
  //     } else {
  //       Alert.alert(
  //         "Error",
  //         result.error || "Failed to send verification code",
  //       );
  //     }
  //   } catch (error: any) {
  //     Alert.alert(
  //       "Error",
  //       error.message || "Failed to proceed with phone verification",
  //     );
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsSubmitting(true);
      clearError();

      console.log("🚀 Starting registration process...");
      console.log("📊 Registration data:", {
        email: data.email,
        full_name: data.full_name,
        user_type: userType,
        university: data.university,
      });

      // First, sign up the user with email/password
      console.log("📧 Step 1: Creating user account with email/password...");
      const signUpResult = await signUpWithEmail(data.email, data.password);

      if (!signUpResult.success) {
        console.error(
          "❌ Step 1 failed - signUpWithEmail:",
          signUpResult.error,
        );
        Alert.alert(
          "Account Creation Failed",
          signUpResult.error ||
            "Failed to create account. Please check your email and password.",
        );
        return;
      }

      console.log("✅ Step 1 complete - User account created successfully");

      // Then create the user profile
      console.log("👤 Step 2: Creating user profile...");
      const registerData: RegisterData = {
        // phone: data.phone, // Commented out - phone auth disabled
        full_name: data.full_name,
        email: data.email,
        user_type: userType || "student",
        university: data.university,
        hall_hostel: userType === "student" ? data.hall_hostel : undefined,
        room_number: userType === "student" ? data.room_number : undefined,
      };

      // Create user profile after successful signup
      const result = await createUserProfile(registerData, signUpResult.user);

      if (result.success) {
        console.log("✅ Step 2 complete - User profile created successfully");
        navigation.navigate("EmailVerification", {email: data.email});
        console.log("🧹 Clearing persisted form data...");
        await clearPersistedData();

        console.log("🎉 Registration completed successfully!");

        // Success animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        navigation.navigate("BiometricSetup");
      } else {
        console.error("❌ Step 2 failed - createUserProfile:", result.error);
        Alert.alert(
          "Profile Creation Failed",
          result.error ||
            "Account created but failed to set up profile. Please try logging in.",
        );
      }
      // Phone verification flow commented out - disabled
      // } else {
      //   // For new registrations, start with phone verification
      //   await handlePhoneSubmit(data.phone);
      // }
    } catch (error: any) {
      console.error("💥 Registration error:", {
        message: error.message,
        stack: error.stack,
        error: error,
      });
      Alert.alert(
        "Registration Error",
        error.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserTypeIcon = () => {
    return userType === "student" ? "school" : "bicycle";
  };

  const getUserTypeColor = () => {
    return userType === "student"
      ? ColorPalette.primary[600]
      : ColorPalette.secondary[600];
  };

  const getUserTypeGradient = () => {
    return userType === "student"
      ? [ColorPalette.primary[600], ColorPalette.primary[500]]
      : [ColorPalette.secondary[600], ColorPalette.secondary[500]];
  };

  const renderUniversityModal = () => (
    <ModalSelector
      visible={showUniversityModal}
      onDismiss={() => setShowUniversityModal(false)}
      title="Select University"
      items={UNIVERSITIES.map((uni) => ({
        label: uni,
        value: uni,
        icon: "school" as keyof typeof Ionicons.glyphMap,
      }))}
      onSelect={(item) => {
        setValue("university", item.value);
        setSelectedUniversity(item.value);
      }}
      selectedValue={watch("university")}
      gradient={getUserTypeGradient()}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Animated Background Gradient */}
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

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Animated Header with Back Button */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: headerAnim }],
              },
            ]}
          >
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={ColorPalette.pure.white}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${getUserTypeColor()}20` },
              ]}
            >
              <LinearGradient
                colors={getUserTypeGradient() as [string, string]}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={getUserTypeIcon() as any}
                  size={40}
                  color="#ffffff"
                />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              {userType === "student"
                ? "Tell us about yourself to get started shopping"
                : "Set up your runner profile to start earning"}
            </Text>
          </Animated.View>

          {/* Animated Registration Form */}
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={getUserTypeGradient() as [string, string]}
                      style={[
                        styles.progressFill,
                        { width: "100%" }, // Always 100% since no phone verification step
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <Text style={styles.progressText}>Complete Your Profile</Text>
                </View>

                {/* Error Display */}
                {error && (
                  <Animated.View style={styles.errorContainer}>
                    <LinearGradient
                      colors={[
                        ColorPalette.error[500],
                        ColorPalette.error[600],
                      ]}
                      style={styles.errorGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="alert-circle" size={20} color="#ffffff" />
                      <Text style={styles.errorMessage}>{error}</Text>
                    </LinearGradient>
                  </Animated.View>
                )}

                {/* Full Name */}
                <View style={styles.inputContainer}>
                  <Controller
                    control={control}
                    name="full_name"
                    rules={{
                      required: "Full name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <AnimatedInput
                        label="Full Name"
                        value={value}
                        onChangeText={(text) => {
                          onChange(text);
                          clearError();
                        }}
                        error={errors.full_name?.message || ""}
                        leftIcon="person-outline"
                        required
                        autoComplete="name"
                        textContentType="name"
                        theme={{
                          primary: getUserTypeColor(),
                          background: "#ffffff",
                          surface: "#f8fafc",
                          text: "#1e293b",
                          error: "#ef4444",
                        }}
                      />
                    )}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      required: "Email address is required", // Now required since no phone auth
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                      validate: (value) => {
                        const validDomains = [
                          "gmail.com",
                          "outlook.com",
                          "hotmail.com",
                          "yahoo.com",
                          "icloud.com",
                          "live.com",
                          "msn.com",
                        ];
                        const domain = value.split("@")[1]?.toLowerCase();
                        if (!domain || !validDomains.includes(domain)) {
                          return "Please use a valid email domain (gmail.com, outlook.com, etc.)";
                        }
                        return true;
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <AnimatedInput
                        label="Email Address (Optional)"
                        value={value || ""}
                        onChangeText={(text) => {
                          onChange(text);
                          clearError();
                        }}
                        error={errors.email?.message || ""}
                        leftIcon="mail-outline"
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="emailAddress"
                        autoCapitalize="none"
                        theme={{
                          primary: getUserTypeColor(),
                          background: "#ffffff",
                          surface: "#f8fafc",
                          text: "#1e293b",
                          error: "#ef4444",
                        }}
                      />
                    )}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
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
                        value={value}
                        onChangeText={onChange}
                        error={errors.password?.message || ""}
                        leftIcon="lock-closed-outline"
                        rightIcon={
                          showPassword ? "eye-off-outline" : "eye-outline"
                        }
                        onRightIconPress={() => setShowPassword(!showPassword)}
                        required
                        secureTextEntry={!showPassword}
                        placeholder="Enter your password"
                        textContentType="password"
                        autoCapitalize="none"
                        theme={{
                          primary: getUserTypeColor(),
                          background: "#ffffff",
                          surface: "#f8f9fa",
                          text: "#333333",
                          error: "#ef4444",
                        }}
                      />
                    )}
                  />
                </View>

                {/* Phone Number - Commented out, phone auth disabled */}
                {/* {phone ? (
                  <View style={styles.inputContainer}>
                    <AnimatedInput
                      label="Phone Number"
                      value={phone}
                      onChangeText={() => {}}
                      leftIcon="call-outline"
                      rightIcon="checkmark-circle"
                      editable={false}
                      animated={false}
                      theme={{
                        primary: "#00b894",
                        background: "#ffffff",
                        surface: "#f8f9fa",
                        text: "#333333",
                        error: "#ef4444",
                      }}
                      helperText="✓ Verified phone number"
                    />
                    <HelperText type="info">
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#00b894"
                      />{" "}
                      Verified phone number
                    </HelperText>
                  </View>
                ) : (
                  <View style={styles.inputContainer}>
                    <Controller
                      control={control}
                      name="phone"
                      rules={{
                        required: "Phone number is required",
                        pattern: {
                          value: /^(\+233|0)[0-9]{9}$/,
                          message:
                            "Enter a valid Ghana phone number (e.g., 0241234567)",
                        },
                      }}
                      render={({ field: { onChange, value } }) => (
                        <AnimatedInput
                          label="Phone Number"
                          value={value}
                          onChangeText={onChange}
                          error={errors.phone?.message || ""}
                          leftIcon="call-outline"
                          required
                          placeholder="e.g., 0241234567"
                          keyboardType="phone-pad"
                          textContentType="telephoneNumber"
                          theme={{
                            primary: getUserTypeColor(),
                            background: "#ffffff",
                            surface: "#f8f9fa",
                            text: "#333333",
                            error: "#ef4444",
                          }}
                        />
                      )}
                    />
                  </View>
                )} */}

                {/* University */}
                <View style={styles.inputContainer}>
                  <Controller
                    control={control}
                    name="university"
                    rules={{ required: "University is required" }}
                    render={({ field: { value } }) => (
                      <TouchableOpacity
                        onPress={() => setShowUniversityModal(true)}
                      >
                        <AnimatedInput
                          label="University"
                          value={value}
                          onChangeText={() => {}}
                          error={errors.university?.message || ""}
                          leftIcon="school-outline"
                          rightIcon="chevron-down"
                          required
                          editable={false}
                          animated={false}
                          theme={{
                            primary: getUserTypeColor(),
                            background: "#ffffff",
                            surface: "#f8fafc",
                            text: "#1e293b",
                            error: "#ef4444",
                          }}
                        />
                      </TouchableOpacity>
                    )}
                  />
                </View>

                {/* Hall/Hostel (for students only) */}
                {userType === "student" && showHallField && (
                  <View style={styles.inputContainer}>
                    <Controller
                      control={control}
                      name="hall_hostel"
                      rules={{
                        required:
                          userType === "student"
                            ? "Hall/Hostel is required"
                            : false,
                      }}
                      render={({ field: { onChange, value } }) => (
                        <AnimatedInput
                          label="Hall/Hostel"
                          value={value || ""}
                          onChangeText={(text) => {
                            onChange(text);
                            clearError();
                          }}
                          error={errors.hall_hostel?.message || ""}
                          leftIcon="home-outline"
                          required
                          placeholder="Enter your hall/hostel name"
                          autoCapitalize="words"
                          theme={{
                            primary: getUserTypeColor(),
                            background: "#ffffff",
                            surface: "#f8fafc",
                            text: "#1e293b",
                            error: "#ef4444",
                          }}
                        />
                      )}
                    />
                  </View>
                )}

                {/* Room Number (for students only) */}
                {userType === "student" && showHallField && (
                  <View style={styles.inputContainer}>
                    <Controller
                      control={control}
                      name="room_number"
                      render={({ field: { onChange, value } }) => (
                        <AnimatedInput
                          label="Room Number (Optional)"
                          value={value || ""}
                          onChangeText={(text) => {
                            onChange(text);
                            clearError();
                          }}
                          leftIcon="key-outline"
                          helperText="This helps runners find you faster"
                          theme={{
                            primary: getUserTypeColor(),
                            background: "#ffffff",
                            surface: "#f8fafc",
                            text: "#1e293b",
                            error: "#ef4444",
                          }}
                        />
                      )}
                    />
                  </View>
                )}

                {/* Submit Button */}
                <GradientButton
                  title="Create Account"
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting || isLoading}
                  loading={isSubmitting || isLoading}
                  gradient={getUserTypeGradient()}
                  icon="checkmark"
                  size="large"
                  style={styles.submitButton}
                />
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.footerText}>
              By creating an account, you agree to our{" "}
              <Text style={[styles.footerLink, { color: getUserTypeColor() }]}>
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text style={[styles.footerLink, { color: getUserTypeColor() }]}>
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderUniversityModal()}
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
    height: height * 0.4,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxxl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxxxl,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 20,
  },
  card: {
    elevation: 12,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    marginHorizontal: 4,
  },
  cardContent: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  progressContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  errorContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  errorGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  errorMessage: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 24,
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  footerLink: {
    fontWeight: "600",
  },
  debugContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  debugWarning: {
    fontSize: 14,
    color: "#F57C00",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
});

export default RegisterScreen;
