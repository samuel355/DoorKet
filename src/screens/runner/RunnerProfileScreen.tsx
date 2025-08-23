import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Avatar,
  Divider,
  Switch,
  List,
  Portal,
  Dialog,
  TextInput,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, User } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";

type RunnerProfileNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "Profile"
>;

interface RunnerProfileProps {
  navigation: RunnerProfileNavigationProp;
}

interface ProfileStats {
  totalDeliveries: number;
  completionRate: number;
  averageRating: number;
  totalEarnings: number;
  joinedDate: string;
}

const { width } = Dimensions.get("window");

const RunnerProfileScreen: React.FC<RunnerProfileProps> = ({ navigation }) => {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    totalDeliveries: 0,
    completionRate: 0,
    averageRating: 0,
    totalEarnings: 0,
    joinedDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Modal states
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadProfileData();
    startAnimations();
  }, [user?.id]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Load runner statistics
      const statsResult = await OrderService.getRunnerStats(user.id);
      if (statsResult.data) {
        setStats({
          totalDeliveries: statsResult.data.total_deliveries || 0,
          completionRate: statsResult.data.completion_rate || 0,
          averageRating: statsResult.data.average_rating || 0,
          totalEarnings: statsResult.data.total_earnings || 0,
          joinedDate: user.created_at,
        });
      }

      // Set initial form values
      setEditedName(profile?.full_name || "");
      setEditedEmail(profile?.email || "");
      setEditedPhone(profile?.phone || "");
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // TODO: Upload image to storage and update profile
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to update profile picture");
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsUpdatingProfile(true);
      // TODO: Implement profile update API call

      Alert.alert("Success", "Profile updated successfully!");
      setEditProfileVisible(false);
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const hsignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
  signOut();
          // Navigation will be handled by auth state change
        },
      },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const renderProfileHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleImagePicker}
          >
            <Avatar.Text
              size={80}
              label={profile?.full_name?.charAt(0) || "R"}
              style={styles.avatar}
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.full_name || "Runner"}
            </Text>
            <Text style={styles.profileEmail}>
              {profile?.email || "No email"}
            </Text>
            <Text style={styles.joinedDate}>
              Runner since {formatDate(stats.joinedDate)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditProfileVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color="#ffffff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderStatsCards = () => (
    <Animated.View
      style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons
                name="car"
                size={24}
                color={ColorPalette.primary[500]}
              />
            </View>
            <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <Text style={styles.statValue}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>
              {Math.round(stats.completionRate)}%
            </Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="wallet" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(stats.totalEarnings)}
            </Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </Card.Content>
        </Card>
      </View>
    </Animated.View>
  );

  const renderAccountSection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Account</Text>

          <List.Item
            title="Personal Information"
            description="Update your profile details"
            left={(props) => (
              <List.Icon
                {...props}
                icon="account-edit"
                color={ColorPalette.primary[500]}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setEditProfileVisible(true)}
            style={styles.listItem}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Payment Settings"
            description="Manage payment methods and payouts"
            left={(props) => (
              <List.Icon
                {...props}
                icon="credit-card"
                color={ColorPalette.primary[500]}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to payment settings
            }}
            style={styles.listItem}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Vehicle Information"
            description="Update your delivery vehicle details"
            left={(props) => (
              <List.Icon
                {...props}
                icon="car"
                color={ColorPalette.primary[500]}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to vehicle settings
            }}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>
    </Animated.View>
  );

  const renderSettingsSection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="notifications"
                size={24}
                color={ColorPalette.primary[500]}
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive order updates and alerts
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color={ColorPalette.primary[500]}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="location"
                size={24}
                color={ColorPalette.primary[500]}
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>Location Tracking</Text>
                <Text style={styles.settingDescription}>
                  Enable location for deliveries
                </Text>
              </View>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              color={ColorPalette.primary[500]}
            />
          </View>

          <Divider style={styles.divider} />

          <List.Item
            title="Privacy Policy"
            left={(props) => (
              <List.Icon
                {...props}
                icon="shield-account"
                color={ColorPalette.primary[500]}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to privacy policy
            }}
            style={styles.listItem}
          />

          <Divider style={styles.divider} />

          <List.Item
            title="Terms of Service"
            left={(props) => (
              <List.Icon
                {...props}
                icon="file-document"
                color={ColorPalette.primary[500]}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to terms of service
            }}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>
    </Animated.View>
  );

  const renderActionButtons = () => (
    <Animated.View
      style={[
        styles.actionsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Button
        mode="outlined"
        onPress={() => navigation.navigate("Settings")}
        style={styles.actionButton}
        icon="cog"
      >
        App Settings
      </Button>

      <Button
        mode="outlined"
        onPress={hsignOut}
        style={[styles.actionButton, styles.logoutButton]}
        icon="logout"
        textColor="#F44336"
      >
        Sign Out
      </Button>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        {renderStatsCards()}
        {renderAccountSection()}
        {renderSettingsSection()}
        {renderActionButtons()}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Portal>
        <Dialog
          visible={editProfileVisible}
          onDismiss={() => setEditProfileVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Full Name"
              value={editedName}
              onChangeText={setEditedName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email"
              value={editedEmail}
              onChangeText={setEditedEmail}
              mode="outlined"
              keyboardType="email-address"
              style={styles.input}
            />

            <TextInput
              label="Phone Number"
              value={editedPhone}
              onChangeText={setEditedPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditProfileVisible(false)}>Cancel</Button>
            <Button
              onPress={handleSaveProfile}
              mode="contained"
              loading={isUpdatingProfile}
              disabled={isUpdatingProfile}
            >
              Save Changes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: -40,
  },
  headerGradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  avatar: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: ColorPalette.primary[600],
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  joinedDate: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  editButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - spacing.lg * 3) / 2,
    marginBottom: spacing.md,
    elevation: 3,
    borderRadius: borderRadius.lg,
  },
  statContent: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  statIcon: {
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: ColorPalette.primary[500],
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  card: {
    elevation: 3,
    borderRadius: borderRadius.lg,
  },
  cardContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
    marginBottom: spacing.md,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.primary[500],
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: ColorPalette.primary[500],
  },
  actionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
        borderColor: ColorPalette.primary[500],
  },
  logoutButton: {
    borderColor: "#F44336",
  },
  dialog: {
    backgroundColor: "#ffffff",
  },
  input: {
    marginBottom: spacing.md,
  },
});

export default RunnerProfileScreen;
