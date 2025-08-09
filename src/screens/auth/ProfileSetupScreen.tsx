import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Button, Input, Card } from "../../components/common";
import { ColorPalette, LightTheme } from "../../theme/colors";
import { spacing, borderRadius, createShadows } from "../../theme/styling";
import { UserType } from "@/types";
import { useAuth } from "@/store/authStore";

type ProfileSetupScreenProps = {
  navigation: any;
  route: {
    params?: {
      phone?: string;
      userType?: UserType;
    };
  };
};

interface RegisterFormData {
  full_name: string;
  email?: string;
  phone: string;
  university: string;
  hall_hostel?: string;
  room_number?: string;
}

interface ProfileFormData {
  emergencyContact: string;
}

const { width, height } = Dimensions.get("window");
const shadows = createShadows(LightTheme);
const FORM_STORAGE_KEY = "register_form_data";

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  navigation,
  route,
}) => {
  const { user, createProfile, isLoading } = useAuth();
  const routeParams = route.params as
    | { phone?: string; userType?: UserType }
    | undefined;
  const { phone, userType = "student" } = routeParams || {};

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const [formData, setFormData] = useState<ProfileFormData>({
    emergencyContact: "",
  });

  const [registrationData, setRegistrationData] =
    useState<RegisterFormData | null>(null);
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadRegistrationData();
    startAnimations();
  }, []);

  const loadRegistrationData = async () => {
    try {
      setIsLoadingData(true);

      // Load saved registration data
      const savedData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
      if (savedData) {
        const parsedData: RegisterFormData = JSON.parse(savedData);
        setRegistrationData(parsedData);
        console.log("Loaded registration data:", parsedData);
      } else {
        // If no saved data, use route params as fallback
        console.warn("No registration data found in storage, using fallback");
        setRegistrationData({
          full_name: "",
          phone: phone || "",
          email: "",
          university: "",
          hall_hostel: "",
          room_number: "",
        });
      }
    } catch (error) {
      console.warn("Failed to load registration data:", error);
      // Fallback to route params
      console.error("Failed to load registration data:", error);
      setRegistrationData({
        full_name: "",
        phone: phone || "",
        email: "",
        university: "",
        hall_hostel: "",
        room_number: "",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

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
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    // Emergency contact validation
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = "Emergency contact is required";
    } else if (!/^(\+233|0)[0-9]{9}$/.test(formData.emergencyContact.trim())) {
      newErrors.emergencyContact = "Please enter a valid Ghana phone number";
    } else if (
      formData.emergencyContact.trim() === registrationData?.phone.trim()
    ) {
      newErrors.emergencyContact =
        "Emergency contact cannot be the same as your phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    console.log("🚀 ProfileSetup: Starting profile creation...");
    console.log("📊 Registration data:", registrationData);
    console.log("👤 User type:", userType);
    console.log("📞 Phone from route:", phone);

    if (!validateForm()) {
      console.log("❌ Form validation failed");
      Alert.alert(
        "Validation Error",
        "Please correct the errors and try again.",
      );
      return;
    }

    if (!registrationData) {
      console.log("❌ No registration data found");
      Alert.alert(
        "Missing Registration Data",
        "Registration data not found. Please go back and complete the registration process.",
      );
      return;
    }

    // Validate required fields
    const missingFields = [];
    if (!registrationData.phone) missingFields.push("Phone Number");
    if (!registrationData.full_name) missingFields.push("Full Name");
    if (!registrationData.university) missingFields.push("University");

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      Alert.alert(
        "Missing Required Information",
        `Please provide the following required information: ${missingFields.join(", ")}. Go back to the registration screen to complete your profile.`,
      );
      return;
    }

    try {
      // Generate a temporary phone number if not provided (since phone is NOT NULL in DB)
      const tempPhone =
        registrationData.phone || `temp_${user?.id?.slice(0, 8) || Date.now()}`;

      const profileData = {
        phone: tempPhone,
        full_name: registrationData.full_name,
        email:
          registrationData.email ||
          `${tempPhone.replace(/[^\d]/g, "")}@chopcart.app`,
        user_type: userType,
        university: registrationData.university || "KNUST", // Default university to satisfy NOT NULL
        hall_hostel:
          userType === "student" ? registrationData.hall_hostel : undefined,
        room_number:
          userType === "student" ? registrationData.room_number : undefined,
      };

      console.log("📝 Prepared profile data:", profileData);
      console.log("🔄 Calling createProfile...");

      const result = await createProfile(profileData);
      console.log("✅ CreateProfile result:", result);

      if (result && result.success === false) {
        console.log("❌ Profile creation failed with result:", result);
        Alert.alert(
          "Authentication Failed",
          result.error || "Failed to create user profile. Please try again.",
        );
        return;
      }

      console.log("🎉 Profile created successfully!");

      // Clear stored registration data after successful profile creation
      await AsyncStorage.removeItem(FORM_STORAGE_KEY);
      console.log("🧹 Cleared form storage");
    } catch (error) {
      console.error("💥 Profile creation error:", error);
      console.error("💥 Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        error: error,
      });

      Alert.alert(
        "Authentication Failed",
        `Profile creation failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
      );
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[
            ColorPalette.primary[700],
            ColorPalette.primary[600],
            ColorPalette.secondary[500],
          ]}
          style={styles.backgroundGradient}
        />
        <View style={styles.loadingContainer}>
          <Ionicons
            name="hourglass"
            size={48}
            color={ColorPalette.pure.white}
          />
          <Text style={styles.loadingText}>Loading your information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          ColorPalette.primary[700],
          ColorPalette.primary[600],
          ColorPalette.secondary[500],
          ColorPalette.accent[500],
        ]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
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
              <LinearGradient
                colors={[ColorPalette.pure.white, "rgba(255, 255, 255, 0.95)"]}
                style={styles.headerIcon}
              >
                <Ionicons
                  name={userType === "student" ? "school" : "car"}
                  size={36}
                  color={ColorPalette.primary[600]}
                />
              </LinearGradient>
              <Text style={styles.title}>Almost Done!</Text>
              <Text style={styles.subtitle}>
                Just one more detail to complete your {userType} profile
              </Text>
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
              <Text style={styles.progressText}>Step 3 of 3</Text>
            </View>

            {/* Registration Summary Card */}
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={ColorPalette.success[500]}
                />
                <Text style={styles.summaryTitle}>Your Information</Text>
              </View>

              <View style={styles.summaryContent}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Name</Text>
                  <Text style={styles.summaryValue}>
                    {registrationData?.full_name || "Not provided"}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phone</Text>
                  <Text style={styles.summaryValue}>
                    {registrationData?.phone || "Not provided"}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>University</Text>
                  <Text style={styles.summaryValue}>
                    {registrationData?.university || "Not provided"}
                  </Text>
                </View>

                {userType === "student" && registrationData?.hall_hostel && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Hall/Hostel</Text>
                    <Text style={styles.summaryValue}>
                      {registrationData.hall_hostel}
                    </Text>
                  </View>
                )}

                {registrationData?.email && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Email</Text>
                    <Text style={styles.summaryValue}>
                      {registrationData.email}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.editButton}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={ColorPalette.primary[600]}
                />
                <Text style={styles.editButtonText}>Edit Information</Text>
              </TouchableOpacity>
            </Card>

            {/* Emergency Contact Form */}
            <Card style={styles.formCard}>
              <View style={styles.formHeader}>
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={ColorPalette.warning[500]}
                />
                <Text style={styles.formTitle}>Emergency Contact</Text>
              </View>

              <Text style={styles.formDescription}>
                For your safety, please provide an emergency contact who can be
                reached if needed during deliveries or in case of emergencies.
              </Text>

              <Input
                label="Emergency Contact Number"
                value={formData.emergencyContact}
                onChangeText={(value) =>
                  handleInputChange("emergencyContact", value)
                }
                error={errors.emergencyContact}
                placeholder="0XX XXX XXXX"
                keyboardType="phone-pad"
                autoCorrect={false}
                returnKeyType="done"
                leftIcon="call"
                style={styles.emergencyInput}
              />

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
                    This should be a family member or close friend who can be
                    contacted in case of emergency. This number will be kept
                    private.
                  </Text>
                </LinearGradient>
              </View>
            </Card>

            {/* User Type Badge */}
            <View style={styles.userTypeContainer}>
              <View style={styles.userTypeBadge}>
                <Ionicons
                  name={userType === "student" ? "school" : "car"}
                  size={20}
                  color={ColorPalette.pure.white}
                  style={styles.userTypeIcon}
                />
                <Text style={styles.userTypeText}>
                  {userType === "student"
                    ? "Student Account"
                    : "Runner Account"}
                </Text>
              </View>
            </View>

            {/* Complete Profile Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!formData.emergencyContact || isLoading}
              style={[
                styles.completeButtonContainer,
                (!formData.emergencyContact || isLoading) &&
                  styles.disabledButton,
              ]}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  !formData.emergencyContact || isLoading
                    ? [ColorPalette.neutral[400], ColorPalette.neutral[300]]
                    : userType === "student"
                      ? [
                          ColorPalette.primary[600],
                          ColorPalette.primary[500],
                          ColorPalette.info[500],
                        ]
                      : [
                          ColorPalette.secondary[600],
                          ColorPalette.secondary[500],
                          ColorPalette.accent[500],
                        ]
                }
                style={styles.completeButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={ColorPalette.pure.white}
                  />
                ) : (
                  <>
                    <Text style={styles.completeButtonText}>
                      Complete Profile
                    </Text>
                    <Ionicons
                      name="checkmark-done"
                      size={20}
                      color={ColorPalette.pure.white}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back to Registration</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: ColorPalette.pure.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
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
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: ColorPalette.pure.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  summaryCard: {
    marginBottom: spacing.lg,
    backgroundColor: ColorPalette.pure.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
    letterSpacing: -0.3,
  },
  summaryContent: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ColorPalette.neutral[100],
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: ColorPalette.neutral[900],
    flex: 1,
    textAlign: "right",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ColorPalette.primary[50],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.primary[600],
  },
  formCard: {
    marginBottom: spacing.xl,
    backgroundColor: ColorPalette.pure.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
    letterSpacing: -0.3,
  },
  formDescription: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    lineHeight: 24,
    marginBottom: spacing.xl,
    fontWeight: "400",
  },
  emergencyInput: {
    marginBottom: spacing.lg,
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
  userTypeContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  userTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: spacing.sm,
  },
  userTypeIcon: {
    // marginRight: spacing.sm,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.pure.white,
    textTransform: "capitalize",
  },
  completeButtonContainer: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  disabledButton: {
    opacity: 0.5,
    ...shadows.sm,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    letterSpacing: 0.3,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
});

export default ProfileSetupScreen;
