import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/store/authStore";

import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";

interface ProfileScreenProps {
  navigation: any;
}

interface ProfileFormData {
  full_name: string;
  email: string;
  hall_hostel: string;
  room_number: string;
  phone_number: string;
  university: string;
}

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.38; // Increased from 0.35 to 0.38
const AVATAR_SIZE = 120;

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, profile, signOut, updateProfile } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    hall_hostel: profile?.hall_hostel || "",
    room_number: profile?.room_number || "",
    phone_number: profile?.phone || "",
    university: profile?.university || "",
  });
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;

  const startAnimations = useCallback(() => {
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(avatarScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim, headerOpacity, cardScale, slideAnim, fadeAnim, avatarScale]);

  const loadProfile = useCallback(async () => {
    if (!profile) return;

    setProfileData({
      full_name: profile.full_name || "",
      email: profile.email || "",
      hall_hostel: profile.hall_hostel || "",
      room_number: profile.room_number || "",
      phone_number: profile.phone || "",
      university: profile.university || "",
    });
  }, [profile]);

  useEffect(() => {
    loadProfile();
    startAnimations();
  }, [loadProfile, startAnimations]);

  // Reload profile data when profile changes
  useEffect(() => {
    loadProfile();
  }, [profile, loadProfile]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!profileData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (profileData.full_name.trim().length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters";
    }

    if (profileData.email && profileData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!profileData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (profileData.phone_number.trim().length < 10) {
      newErrors.phone_number = "Please enter a valid phone number";
    }

    if (!profileData.university.trim()) {
      newErrors.university = "University is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveProfile = async () => {
    if (!validateForm() || !user) {
      if (!user) {
        Alert.alert("Error", "You must be logged in to update your profile");
      }
      return;
    }

    try {
      setLoading(true);

      // Clear any previous errors
      setErrors({});

      const updateData = {
        full_name: profileData.full_name.trim(),
        email: profileData.email?.trim() || undefined,
        hall_hostel: profileData.hall_hostel?.trim() || undefined,
        room_number: profileData.room_number?.trim() || undefined,
        phone: profileData.phone_number.trim(),
        university: profileData.university.trim(),
      };

      console.log("Updating profile with data:", updateData);
      const result = await updateProfile(updateData);

      if (result.success) {
        setEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
        // Profile data will be automatically updated through the auth store
      } else {
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Update Failed",
        error.message || "Failed to update profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to change your profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        // Handle image upload logic here
        // For now, just show a success message
        setTimeout(() => {
          setUploading(false);
          Alert.alert("Success", "Profile picture updated!");
        }, 2000);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image");
      setUploading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              console.log("Signing out user...");
              await signOut();
              console.log("User signed out successfully");
              // Navigation will be handled automatically by auth state change
            } catch (error: any) {
              console.error("Sign out error:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { opacity: headerOpacity, zIndex: 100, marginBottom: 10 }]}>
      <LinearGradient
        colors={[
          ColorPalette.primary[700],
          ColorPalette.primary[600],
          ColorPalette.primary[500],
        ]}
        locations={[0, 0.6, 1]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating decorative elements with gradient accents */}
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            { transform: [{ translateY: floatY }] },
          ]}
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.elementGradient}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            { transform: [{ translateY: floatY }] },
          ]}
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.08)"]}
            style={styles.elementGradient}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            { transform: [{ translateY: floatY }] },
          ]}
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.10)", "rgba(255, 255, 255, 0.06)"]}
            style={styles.elementGradient}
          />
        </Animated.View>

        <SafeAreaView style={[styles.headerContent]}>
          <View style={[styles.headerTop]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.25)",
                  "rgba(255, 255, 255, 0.15)",
                ]}
                style={styles.headerButton}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Profile</Text>

            {editing ? (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditing(false);
                    loadProfile(); // Reset form data
                    setErrors({}); // Clear errors
                  }}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0.25)",
                      "rgba(255, 255, 255, 0.15)",
                    ]}
                    style={styles.headerButton}
                  >
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={loading || uploading}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0.25)",
                      "rgba(255, 255, 255, 0.15)",
                    ]}
                    style={styles.headerButton}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark" size={24} color="#ffffff" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
                disabled={loading || uploading}
              >
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.25)",
                    "rgba(255, 255, 255, 0.15)",
                  ]}
                  style={styles.headerButton}
                >
                  <Ionicons name="create-outline" size={24} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.avatarContainer]}>
            <Animated.View
              style={[
                styles.avatarWrapper,
                { transform: [{ scale: avatarScale }] },
              ]}
            >
              <LinearGradient
                colors={[ColorPalette.pure.white, "rgba(255, 255, 255, 0.9)"]}
                style={styles.avatarGradient}
              >
                {(profile as any)?.avatar_url ? (
                  <Image
                    source={{ uri: (profile as any).avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleImageUpload}
                  disabled={uploading}
                >
                  <LinearGradient
                    colors={[
                      ColorPalette.primary[500],
                      ColorPalette.primary[600],
                    ]}
                    style={styles.cameraGradient}
                  >
                    <Ionicons
                      name={uploading ? "hourglass" : "camera"}
                      size={16}
                      color="#ffffff"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            <Text style={styles.userName}>{profile?.full_name || "User"}</Text>
            <Text style={styles.userEmail}>
              {profile?.email || "No email provided"}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  const renderFormField = (
    label: string,
    field: keyof ProfileFormData,
    icon: string,
    placeholder: string,
    multiline = false,
  ) => (
    <Animated.View
      style={[
        styles.fieldContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.fieldHeader}>
        <LinearGradient
          colors={[ColorPalette.primary[100], ColorPalette.primary[50]]}
          style={styles.fieldIcon}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={ColorPalette.primary[600]}
          />
        </LinearGradient>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>

      <TextInput
        value={profileData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        editable={editing}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[
          styles.textInput,
          editing && styles.textInputEditing,
          errors[field] && styles.textInputError,
        ]}
        underlineColor="transparent"
        activeUnderlineColor={ColorPalette.primary[500]}
        theme={{
          colors: {
            text: ColorPalette.neutral[800],
            placeholder: ColorPalette.neutral[400],
            background: editing
              ? ColorPalette.pure.white
              : ColorPalette.neutral[50],
          },
        }}
      />

      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </Animated.View>
  );

  const renderActions = () => (
    <Animated.View
      style={[
        styles.actionsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: cardScale }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("Settings")}
      >
        <LinearGradient
          colors={[
            ColorPalette.primary[50],
            ColorPalette.primary[25] || "#f0f4ff",
          ]}
          style={styles.actionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <LinearGradient
            colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
            style={styles.actionIconContainer}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={ColorPalette.pure.white}
            />
          </LinearGradient>
          <Text
            style={[styles.actionText, { color: ColorPalette.primary[700] }]}
          >
            Settings
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={ColorPalette.primary[400]}
          />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("OrderHistory")}
      >
        <LinearGradient
          colors={[
            ColorPalette.primary[50],
            ColorPalette.primary[100] || "#f0f4ff",
          ]}
          style={styles.actionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <LinearGradient
            colors={[ColorPalette.accent[500], ColorPalette.accent[600]]}
            style={styles.actionIconContainer}
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={ColorPalette.pure.white}
            />
          </LinearGradient>
          <Text
            style={[styles.actionText, { color: ColorPalette.primary[700] }]}
          >
            Order History
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={ColorPalette.primary[400]}
          />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
        <LinearGradient
          colors={[
            ColorPalette.primary[50],
            ColorPalette.primary[25] || "#f0f4ff",
          ]}
          style={styles.actionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <LinearGradient
            colors={[ColorPalette.error[500], ColorPalette.error[600]]}
            style={styles.actionIconContainer}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={ColorPalette.pure.white}
            />
          </LinearGradient>
          <Text
            style={[styles.actionText, { color: ColorPalette.primary[700] }]}
          >
            Sign Out
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={ColorPalette.primary[400]}
          />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ColorPalette.primary[600]}
      />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: cardScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
            style={styles.formCard}
          >
            {renderFormField(
              "Full Name",
              "full_name",
              "person",
              "Enter your full name",
            )}
            {renderFormField(
              "Email",
              "email",
              "mail",
              "Enter your email address",
            )}
            {renderFormField(
              "University",
              "university",
              "school",
              "Select your university",
            )}
            {renderFormField(
              "Hall/Hostel",
              "hall_hostel",
              "business",
              "Enter your hall or hostel",
            )}
            {renderFormField(
              "Room Number",
              "room_number",
              "home",
              "Enter your room number",
            )}
            {renderFormField(
              "Phone Number",
              "phone_number",
              "call",
              "Enter your phone number",
            )}
          </LinearGradient>
        </Animated.View>

        {renderActions()}
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.5)"]}
            style={styles.loadingGradient}
          >
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={ColorPalette.pure.white} />
              <Text style={styles.loadingText}>
                {editing ? "Saving your profile..." : "Please wait..."}
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },

  // Header styles
  headerContainer: {
    height: HEADER_HEIGHT,
    position: "relative",
  },
  headerGradient: {
    flex: 1,
    paddingTop: 0,
  },
  floatingElement: {
    position: "absolute",
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  elementGradient: {
    flex: 1,
    borderRadius: borderRadius.full,
  },
  element1: {
    width: 60,
    height: 60,
    top: height * 0.08,
    left: width * 0.1,
  },
  element2: {
    width: 40,
    height: 40,
    top: height * 0.05,
    right: width * 0.15,
  },
  element3: {
    width: 80,
    height: 80,
    top: height * 0.12,
    right: width * 0.05,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "space-between",
    paddingBottom: spacing.xl, // Increased from lg to xl
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
  },
  backButton: {},
  editButton: {},
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cancelButton: {},
  saveButton: {},

  // Avatar styles
  avatarContainer: {
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md, // Added bottom margin
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatarGradient: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: ColorPalette.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  cameraGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: ColorPalette.pure.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm, // Added bottom margin
  },

  // Content styles
  scrollView: {
    flex: 1,
    marginTop: -spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl,
    paddingTop: spacing.xl,
  },

  // Form styles
  formContainer: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xxxl,
  },
  formCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  fieldIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.xs,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[700],
  },
  textInput: {
    backgroundColor: ColorPalette.neutral[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
    borderWidth: 1,
    borderColor: ColorPalette.neutral[200],
    minHeight: 42,
  },
  textInputEditing: {
    backgroundColor: ColorPalette.pure.white,
    borderColor: ColorPalette.primary[300],
    elevation: 2,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  textInputError: {
    borderColor: ColorPalette.error[500],
  },
  errorText: {
    fontSize: 12,
    color: ColorPalette.error[600],
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },

  // Loading overlay styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  loadingText: {
    fontSize: 16,
    color: ColorPalette.pure.white,
    marginTop: spacing.md,
    textAlign: "center",
  },

  // Actions styles
  actionsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxxxxl,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 3,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(124, 115, 240, 0.1)",
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
