import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  IconButton,
  Avatar,
  Divider,
  Portal,
  Modal,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "react-native-image-picker";

import { Loading, ErrorState, Input } from "../../components/common";
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  UNIVERSITIES,
} from "../../constants";
import { useAuth } from "@/store/authStore";
import BiometricService from "@/services/auth/biometric";
import { SupabaseService } from "@/services/supabase";

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

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, profile, signOut } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    hall_hostel: profile?.hall_hostel || "",
    room_number: profile?.room_number || "",
    phone_number: profile?.phone || "",
    university: profile?.university || "",
  });
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  // Check biometric availability
  const checkBiometricStatus = useCallback(async () => {
    if (!user) return;

    try {
      const capabilities = await BiometricService.getCapabilities();
      setBiometricAvailable(capabilities.isAvailable);

      if (capabilities.isAvailable) {
        const isEnabled = await BiometricService.isEnabledForUser(user.id);
        setBiometricEnabled(isEnabled);
      }
    } catch (error) {
      console.error("Error checking biometric status:", error);
    }
  }, [user]);

  // Load profile data
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

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!profileData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (
      profileData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!profileData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^(\+233|0)[0-9]{9}$/.test(profileData.phone_number.trim())) {
      newErrors.phone_number = "Please enter a valid Ghana phone number";
    }

    if (!profileData.university.trim()) {
      newErrors.university = "University is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!validateForm() || !user) return;

    try {
      setLoading(true);

      const updateData = {
        full_name: profileData.full_name.trim(),
        email: profileData.email.trim() || null,
        hall_hostel: profileData.hall_hostel.trim() || null,
        room_number: profileData.room_number.trim() || null,
        phone_number: profileData.phone_number.trim(),
        university: profileData.university.trim(),
      };

      const { error } = await SupabaseService.updateUserProfile(
        user.id,
        updateData,
      );

      if (error) {
        throw new Error(error);
      }

      setEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = () => {
    const options = {
      mediaType: "photo",
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    Alert.alert("Change Profile Picture", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Camera",
        onPress: () => ImagePicker.launchCamera(options, handleImageResponse),
      },
      {
        text: "Gallery",
        onPress: () =>
          ImagePicker.launchImageLibrary(options, handleImageResponse),
      },
    ]);
  };

  // Handle image picker response
  const handleImageResponse = async (
    response: ImagePicker.ImagePickerResponse,
  ) => {
    if (
      response.didCancel ||
      response.errorMessage ||
      !response.assets?.[0] ||
      !user
    ) {
      return;
    }

    const asset = response.assets[0];
    if (!asset.uri) return;

    try {
      setUploading(true);

      const fileName = `profile_${user.id}_${Date.now()}.jpg`;
      const { data, error } = await SupabaseService.uploadProfileImage(
        user.id,
        asset.uri,
        fileName,
      );

      if (error || !data) {
        throw new Error(error || "Failed to upload image");
      }

      // Update profile with new image URL
      await SupabaseService.updateUserProfile(user.id, {
        profile_image_url: data.publicUrl,
      });

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Handle biometric toggle
  const handleBiometricToggle = async () => {
    if (!user) return;

    try {
      if (biometricEnabled) {
        // Disable biometric
        const { success, error } = await BiometricService.disableBiometric(
          user.id,
        );
        if (success) {
          setBiometricEnabled(false);
          Alert.alert("Success", "Biometric authentication disabled");
        } else {
          Alert.alert(
            "Error",
            error || "Failed to disable biometric authentication",
          );
        }
      } else {
        // Enable biometric
        const result = await BiometricService.enableBiometric(
          user.id,
          "Enable biometric authentication for ChopCart",
        );
        if (result.success) {
          setBiometricEnabled(true);
          Alert.alert("Success", "Biometric authentication enabled");
        } else {
          Alert.alert(
            "Error",
            result.error || "Failed to enable biometric authentication",
          );
        }
      }
    } catch (error: any) {
      console.error("Error toggling biometric:", error);
      Alert.alert("Error", "Failed to update biometric settings");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error: any) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  // Effects
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      checkBiometricStatus();
    }, [checkBiometricStatus]),
  );

  if (!profile) {
    return <Loading text="Loading profile..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={handleImageUpload}
                disabled={uploading}
              >
                {profile.profile_image_url ? (
                  <Image
                    source={{ uri: profile.profile_image_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Text
                    size={100}
                    label={profile.full_name?.charAt(0) || "U"}
                    style={styles.avatar}
                  />
                )}
                <View style={styles.cameraIcon}>
                  <IconButton
                    icon="camera"
                    size={20}
                    iconColor={COLORS.WHITE}
                    style={styles.cameraButton}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{profile.full_name}</Text>
            <Text style={styles.userType}>
              {profile.user_type?.charAt(0).toUpperCase() +
                profile.user_type?.slice(1)}
            </Text>
            {profile.email && (
              <Text style={styles.userEmail}>{profile.email}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Profile Information */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              <IconButton
                icon={editing ? "close" : "pencil"}
                size={20}
                onPress={() => {
                  if (editing) {
                    setEditing(false);
                    loadProfile(); // Reset form
                    setErrors({});
                  } else {
                    setEditing(true);
                  }
                }}
              />
            </View>

            {editing ? (
              <View style={styles.editForm}>
                <Input
                  label="Full Name *"
                  value={profileData.full_name}
                  onChangeText={(value) =>
                    handleInputChange("full_name", value)
                  }
                  error={errors.full_name}
                  style={styles.input}
                />

                <Input
                  label="Email"
                  value={profileData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Input
                  label="Phone Number *"
                  value={profileData.phone_number}
                  onChangeText={(value) =>
                    handleInputChange("phone_number", value)
                  }
                  error={errors.phone_number}
                  keyboardType="phone-pad"
                  style={styles.input}
                />

                <Input
                  label="University *"
                  value={profileData.university}
                  onChangeText={(value) =>
                    handleInputChange("university", value)
                  }
                  error={errors.university}
                  style={styles.input}
                />

                <View style={styles.row}>
                  <Input
                    label="Hall/Hostel"
                    value={profileData.hall_hostel}
                    onChangeText={(value) =>
                      handleInputChange("hall_hostel", value)
                    }
                    error={errors.hall_hostel}
                    style={styles.halfInput}
                  />

                  <Input
                    label="Room Number"
                    value={profileData.room_number}
                    onChangeText={(value) =>
                      handleInputChange("room_number", value)
                    }
                    error={errors.room_number}
                    style={styles.halfInput}
                  />
                </View>

                <View style={styles.editActions}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setEditing(false);
                      loadProfile();
                      setErrors({});
                    }}
                    style={styles.editButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveProfile}
                    loading={loading}
                    disabled={loading}
                    style={styles.editButton}
                  >
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>
                    {profile.email || "Not provided"}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{profile.phone}</Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>University</Text>
                  <Text style={styles.infoValue}>{profile.university}</Text>
                </View>

                {(profile.hall_hostel || profile.room_number) && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>
                      {[profile.hall_hostel, profile.room_number]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Security Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Security</Text>

            {biometricAvailable && (
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleBiometricToggle}
              >
                <View style={styles.settingInfo}>
                  <Ionicons
                    name="finger-print"
                    size={24}
                    color={COLORS.PRIMARY}
                    style={styles.settingIcon}
                  />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>
                      Biometric Authentication
                    </Text>
                    <Text style={styles.settingDescription}>
                      Use fingerprint or face recognition
                    </Text>
                  </View>
                </View>
                <View style={styles.settingToggle}>
                  <Text style={styles.toggleText}>
                    {biometricEnabled ? "Enabled" : "Disabled"}
                  </Text>
                  <Ionicons
                    name={biometricEnabled ? "toggle" : "toggle-outline"}
                    size={24}
                    color={biometricEnabled ? COLORS.SUCCESS : COLORS.GRAY_400}
                  />
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate("Settings")}
            >
              <View style={styles.settingInfo}>
                <Ionicons
                  name="settings"
                  size={24}
                  color={COLORS.PRIMARY}
                  style={styles.settingIcon}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>App Settings</Text>
                  <Text style={styles.settingDescription}>
                    Notifications, privacy, and more
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.TEXT_SECONDARY}
              />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Logout */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Button
              mode="outlined"
              onPress={() => setShowLogoutModal(true)}
              style={styles.logoutButton}
              textColor={COLORS.ERROR}
              icon="logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Portal>
        <Modal
          visible={showLogoutModal}
          onDismiss={() => setShowLogoutModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Logout</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to logout? You'll need to sign in again to
            access your account.
          </Text>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowLogoutModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={loading}
              disabled={loading}
              style={styles.modalButton}
              buttonColor={COLORS.ERROR}
            >
              Logout
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.LG,
  },
  headerCard: {
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
    marginBottom: SPACING.LG,
  },
  headerContent: {
    alignItems: "center",
    paddingVertical: SPACING.XL,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: SPACING.LG,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  userName: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  userType: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    marginBottom: SPACING.XS,
  },
  userEmail: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  sectionCard: {
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
    marginBottom: SPACING.LG,
  },
  sectionContent: {
    padding: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  editForm: {
    gap: SPACING.SM,
  },
  input: {
    marginBottom: SPACING.MD,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.MD,
    marginTop: SPACING.LG,
  },
  editButton: {
    minWidth: 80,
  },
  profileInfo: {
    gap: SPACING.LG,
  },
  infoItem: {
    gap: SPACING.XS,
  },
  infoLabel: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  infoValue: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: SPACING.MD,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  settingDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  settingToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
  },
  toggleText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  logoutButton: {
    borderColor: COLORS.ERROR,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
  },
  modalTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  modalMessage: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: FONTS.LINE_HEIGHT.RELAXED * FONTS.SIZE.MD,
    marginBottom: SPACING.XL,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.MD,
  },
  modalButton: {
    minWidth: 80,
  },
});

export default ProfileScreen;
