import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Image,
  StatusBar,
} from "react-native";

import { Text, Portal, Dialog, Button, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import * as ImagePicker from "expo-image-picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList } from "@/types";
import { useAuth } from "@/store/authStore";
import { ColorPalette } from "../../theme/colors";
import { RunnerHeader } from "../../components/runner/RunnerHeader";

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
  streak: number;
  badge: string;
}

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 320;

const RunnerProfileScreen: React.FC<RunnerProfileProps> = ({ navigation }) => {
  const { profile, signOut, updateProfile } = useAuth();

  const [stats, setStats] = useState<ProfileStats>({
    totalDeliveries: 0,
    completionRate: 0,
    averageRating: 0,
    totalEarnings: 0,
    joinedDate: new Date().toISOString(),
    streak: 0,
    badge: "bronze",
  });

  const [isAvailable, setIsAvailable] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: profile?.full_name || "",
    phone_number: (profile as any)?.phone_number || "",
    email: profile?.email || "",
  });

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(
    Array(8)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const togglePosition = useRef(
    new Animated.Value(isAvailable ? 22 : 2),
  ).current;

  const startAnimations = useCallback(() => {
    // Header animation
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    const cardStagger = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 80,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(100, cardStagger).start();

    // Pulse animation for active status
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [headerAnim, heroScale, cardAnimations, pulseAnim]);

  useEffect(() => {
    loadProfileData();
    startAnimations();
  }, [startAnimations]);

  const loadProfileData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockStats: ProfileStats = {
        totalDeliveries: 247,
        completionRate: 98.5,
        averageRating: 4.8,
        totalEarnings: 3250.75,
        joinedDate: "2023-08-15T10:30:00Z",
        streak: 12,
        badge: "gold",
      };

      setStats(mockStats);
    } catch (error) {
      console.error("Failed to load profile data:", error);
    }
  };

  const handleUpdateAvailability = (available: boolean) => {
    setIsAvailable(available);
    Animated.timing(togglePosition, {
      toValue: available ? 22 : 2,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Handle image upload
      console.log("Selected image:", result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editedProfile);
      setShowEditDialog(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        {[
          {
            title: "Total Deliveries",
            value: stats.totalDeliveries.toString(),
            icon: "bag-check-outline",
            color: ColorPalette.primary[500],
            gradient: [
              ColorPalette.primary[100],
              ColorPalette.primary[50],
            ] as const,
            animation: cardAnimations[0],
          },
          {
            title: "Success Rate",
            value: `${stats.completionRate.toFixed(1)}%`,
            icon: "checkmark-circle-outline",
            color: ColorPalette.success[500],
            gradient: [
              ColorPalette.success[100],
              ColorPalette.success[50],
            ] as const,
            animation: cardAnimations[1],
          },
          {
            title: "Rating",
            value: `⭐ ${stats.averageRating.toFixed(1)}`,
            icon: "star-outline",
            color: ColorPalette.warning[500],
            gradient: [
              ColorPalette.warning[100],
              ColorPalette.warning[50],
            ] as const,
            animation: cardAnimations[2],
          },
          {
            title: "Current Streak",
            value: `${stats.streak} days`,
            icon: "flame-outline",
            color: ColorPalette.accent[500],
            gradient: [
              ColorPalette.accent[100],
              ColorPalette.accent[50],
            ] as const,
            animation: cardAnimations[3],
          },
        ].map((stat, index) => (
          <Animated.View
            key={index}
            style={[
              styles.statCard,
              {
                opacity: stat.animation,
                transform: [{ scale: stat.animation }],
              },
            ]}
          >
            <LinearGradient
              colors={stat.gradient}
              style={styles.statCardGradient}
            >
              <View style={styles.statCardHeader}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: "#FFFFFF" },
                  ]}
                >
                  <Ionicons
                    name={stat.icon as any}
                    size={24}
                    color={stat.color}
                  />
                </View>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderMenuItems = () => (
    <View style={styles.menuContainer}>
      {[
        {
          title: "Order History",
          subtitle: "View your completed deliveries",
          icon: "time-outline",
          color: ColorPalette.info[500],
          onPress: () => navigation.navigate("AcceptedOrders"),
          animation: cardAnimations[4],
        },
        {
          title: "Earnings",
          subtitle: `Total earned: ${formatCurrency(stats.totalEarnings)}`,
          icon: "wallet-outline",
          color: ColorPalette.success[500],
          onPress: () => navigation.navigate("Earnings"),
          animation: cardAnimations[5],
        },
        {
          title: "Settings",
          subtitle: "App preferences and notifications",
          icon: "settings-outline",
          color: ColorPalette.neutral[600],
          onPress: () => {
            // Navigate to settings
          },
          animation: cardAnimations[6],
        },
        {
          title: "Help & Support",
          subtitle: "Get help or contact support",
          icon: "help-circle-outline",
          color: ColorPalette.accent[500],
          onPress: () => {
            // Navigate to help
          },
          animation: cardAnimations[7],
        },
      ].map((item, index) => (
        <Animated.View
          key={index}
          style={[
            styles.menuItem,
            {
              opacity: item.animation,
              transform: [
                {
                  translateX: Animated.multiply(
                    Animated.subtract(1, item.animation),
                    -100,
                  ),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItemTouchable}
            onPress={item.onPress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#FFFFFF", "#FEFEFE"]}
              style={styles.menuItemGradient}
            >
              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={item.color}
                  />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={ColorPalette.neutral[400]}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  const renderSignOutButton = () => (
    <Animated.View
      style={[
        styles.signOutContainer,
        {
          opacity: cardAnimations[7],
          transform: [
            { translateY: Animated.multiply(cardAnimations[7], -20) },
          ],
        },
      ]}
    >
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LinearGradient
          colors={[ColorPalette.error[500], ColorPalette.error[600]] as const}
          style={styles.signOutGradient}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEditDialog = () => (
    <Portal>
      <Dialog
        visible={showEditDialog}
        onDismiss={() => setShowEditDialog(false)}
      >
        <Dialog.Title>Edit Profile</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Full Name"
            value={editedProfile.full_name}
            onChangeText={(text: string) =>
              setEditedProfile({ ...editedProfile, full_name: text })
            }
            mode="outlined"
            style={styles.dialogInput}
          />
          <TextInput
            label="Phone Number"
            value={editedProfile.phone_number}
            onChangeText={(text: string) =>
              setEditedProfile({ ...editedProfile, phone_number: text })
            }
            mode="outlined"
            style={styles.dialogInput}
          />
          <TextInput
            label="Email"
            value={editedProfile.email}
            onChangeText={(text: string) =>
              setEditedProfile({ ...editedProfile, email: text })
            }
            mode="outlined"
            style={styles.dialogInput}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onPress={handleSaveProfile}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ColorPalette.primary[500]}
        translucent
      />

      <RunnerHeader
        title="My Profile"
        subtitle="Runner Dashboard"
        onBack={() => navigation.goBack()}
        onRefresh={() => setShowEditDialog(true)}
        gradientColors={[
          ColorPalette.primary[400],
          ColorPalette.primary[500],
          ColorPalette.primary[600],
        ]}
        showDecorations={true}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
        bouncesZoom={false}
        alwaysBounceVertical={true}
        decelerationRate="normal"
      >
        {/* Profile Info Section */}
        <View style={styles.profileSectionCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {profile?.full_name || "Runner Name"}
              </Text>
              <Text style={styles.profileEmail}>
                {profile?.email || "runner@example.com"}
              </Text>
              <View style={styles.availabilityRow}>
                <View
                  style={[
                    styles.availabilityToggle,
                    {
                      backgroundColor: isAvailable
                        ? ColorPalette.success[500]
                        : ColorPalette.neutral[400],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => handleUpdateAvailability(!isAvailable)}
                  >
                    <Animated.View
                      style={[
                        styles.toggleIndicator,
                        {
                          left: togglePosition,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.availabilityText}>
                  {isAvailable ? "Available" : "Offline"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {renderStatsCards()}
          {renderMenuItems()}
          {renderSignOutButton()}
        </View>
      </Animated.ScrollView>

      {renderEditDialog()}
    </View>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Header Styles
  header: {
    height: HEADER_HEIGHT,
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  editButton: {},
  editButtonBlur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  // Profile Section
  profileSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileInfo: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ColorPalette.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  profileDetails: {
    flex: 1,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Availability Toggle

  availabilityToggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    justifyContent: "center",
  },
  toggleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    position: "absolute",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: ColorPalette.primary[500],
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  availabilityText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Decorative Elements
  headerDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    height: "100%",
  },
  decorativeOrb: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  orb1: {
    width: 120,
    height: 120,
    top: -30,
    right: -30,
  },
  orb2: {
    width: 80,
    height: 80,
    top: HEADER_HEIGHT * 0.4,
    left: -20,
  },
  orb3: {
    width: 60,
    height: 60,
    bottom: -20,
    right: width * 0.3,
  },

  scrollContent: {
    paddingTop: 24,
    paddingBottom: 100,
  },

  // Stats Cards
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - 56) / 2,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  statCardGradient: {
    padding: 20,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  statCardHeader: {
    marginBottom: 16,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: ColorPalette.neutral[900],
    marginBottom: 4,
    textAlign: "center",
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.neutral[600],
    textAlign: "center",
  },

  // Menu Items
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  menuItem: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  menuItemTouchable: {
    borderRadius: 20,
  },
  menuItemGradient: {
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },

  // Sign Out Button
  signOutContainer: {
    paddingHorizontal: 20,
  },
  signOutButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  signOutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  // Dialog Styles
  dialogInput: {
    marginBottom: 16,
  },
});

export default RunnerProfileScreen;
