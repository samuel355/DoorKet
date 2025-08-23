import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, User } from "@/types";
import { useAuth } from "@/store/authStore";
import { ColorPalette } from "../../theme/colors";
import {
  borderRadius,
  spacing,
  createShadows,
  createTypography,
} from "../../theme/styling";

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

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = 320;

const RunnerProfileScreen: React.FC<RunnerProfileProps> = ({ navigation }) => {
  const { user, profile, signOut, updateProfile } = useAuth();

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
    phone_number: profile?.phone_number || "",
    email: profile?.email || "",
  });

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(
    Array(8)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const switchAnim = useRef(new Animated.Value(0)).current;

  const shadows = createShadows({
    shadow: { medium: "rgba(0, 0, 0, 0.1)" },
  } as any);

  useEffect(() => {
    loadProfileData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Header animation
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Staggered card animations
    const cardStagger = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(80, cardStagger).start();

    // Pulse animation for avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Switch animation
    Animated.timing(switchAnim, {
      toValue: isAvailable ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

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
    Animated.timing(switchAnim, {
      toValue: available ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
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
    } catch (error) {
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

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "bronze":
        return ColorPalette.accent[600];
      case "silver":
        return ColorPalette.neutral[400];
      case "gold":
        return ColorPalette.warning[500];
      case "platinum":
        return ColorPalette.primary[500];
      default:
        return ColorPalette.neutral[500];
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "bronze":
        return "medal-outline";
      case "silver":
        return "medal-outline";
      case "gold":
        return "trophy-outline";
      case "platinum":
        return "diamond-outline";
      default:
        return "star-outline";
    }
  };

  const renderHeader = () => {
    const headerScale = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT],
      outputRange: [1, 0.8],
      extrapolate: "clamp",
    });

    const headerOpacity = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT - 100, HEADER_HEIGHT],
      outputRange: [1, 0.8, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.header,
          {
            opacity: Animated.multiply(headerOpacity, headerAnim),
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            ColorPalette.primary[400],
            ColorPalette.primary[500],
            ColorPalette.primary[600],
            ColorPalette.primary[700],
          ]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <BlurView
                  intensity={20}
                  tint="light"
                  style={styles.backButtonBlur}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>

              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <Text style={styles.headerSubtitle}>Runner Dashboard</Text>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowEditDialog(true)}
              >
                <BlurView
                  intensity={20}
                  tint="light"
                  style={styles.editButtonBlur}
                >
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Profile Avatar and Info */}
            <View style={styles.profileSection}>
              <Animated.View
                style={[
                  styles.avatarContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.avatarTouchable}
                  onPress={handleImagePicker}
                >
                  <BlurView
                    intensity={30}
                    tint="light"
                    style={styles.avatarBlur}
                  >
                    {profile?.avatar_url ? (
                      <Image
                        source={{ uri: profile.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Ionicons name="person" size={48} color="#FFFFFF" />
                    )}
                  </BlurView>
                  <View style={styles.editAvatarIcon}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Badge */}
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: getBadgeColor(stats.badge) },
                  ]}
                >
                  <Ionicons
                    name={getBadgeIcon(stats.badge) as any}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              </Animated.View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profile?.full_name || "Runner Name"}
                </Text>
                <Text style={styles.profileTitle}>
                  {stats.badge.charAt(0).toUpperCase() + stats.badge.slice(1)}{" "}
                  Runner
                </Text>
                <Text style={styles.profileJoined}>
                  Member since {new Date(stats.joinedDate).getFullYear()}
                </Text>

                {/* Availability Toggle */}
                <View style={styles.availabilityContainer}>
                  <Animated.View
                    style={[
                      styles.availabilityToggle,
                      {
                        backgroundColor: switchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            ColorPalette.neutral[400],
                            ColorPalette.success[500],
                          ],
                        }),
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
                            transform: [
                              {
                                translateX: switchAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [2, 22],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                  <Text style={styles.availabilityText}>
                    {isAvailable ? "Available for Orders" : "Currently Offline"}
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>

          {/* Decorative elements */}
          <View style={styles.headerDecoration}>
            <View style={[styles.decorativeOrb, styles.orb1]} />
            <View style={[styles.decorativeOrb, styles.orb2]} />
            <View style={[styles.decorativeOrb, styles.orb3]} />
          </View>
        </LinearGradient>
      </Animated.View>
    );
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
            gradient: [ColorPalette.primary[100], ColorPalette.primary[50]],
            animation: cardAnimations[0],
          },
          {
            title: "Success Rate",
            value: `${stats.completionRate.toFixed(1)}%`,
            icon: "checkmark-circle-outline",
            color: ColorPalette.success[500],
            gradient: [ColorPalette.success[100], ColorPalette.success[50]],
            animation: cardAnimations[1],
          },
          {
            title: "Rating",
            value: `⭐ ${stats.averageRating.toFixed(1)}`,
            icon: "star-outline",
            color: ColorPalette.warning[500],
            gradient: [ColorPalette.warning[100], ColorPalette.warning[50]],
            animation: cardAnimations[2],
          },
          {
            title: "Current Streak",
            value: `${stats.streak} days`,
            icon: "flame-outline",
            color: ColorPalette.accent[500],
            gradient: [ColorPalette.accent[100], ColorPalette.accent[50]],
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
          colors={[ColorPalette.error[500], ColorPalette.error[600]]}
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
            onChangeText={(text) =>
              setEditedProfile({ ...editedProfile, full_name: text })
            }
            mode="outlined"
            style={styles.dialogInput}
          />
          <TextInput
            label="Phone Number"
            value={editedProfile.phone_number}
            onChangeText={(text) =>
              setEditedProfile({ ...editedProfile, phone_number: text })
            }
            mode="outlined"
            style={styles.dialogInput}
          />
          <TextInput
            label="Email"
            value={editedProfile.email}
            onChangeText={(text) =>
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
      {renderHeader()}

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {renderStatsCards()}
        {renderMenuItems()}
        {renderSignOutButton()}
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

  // Header Styles
  header: {
    height: HEADER_HEIGHT,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    position: "relative",
  },
  headerContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
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
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatarBlur: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  editAvatarIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ColorPalette.primary[500],
    alignItems: "center",
    justifyContent: "center",
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
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  profileTitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginBottom: 4,
  },
  profileJoined: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    marginBottom: 20,
  },

  // Availability Toggle
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  availabilityToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: "center",
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

  // Content
  content: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
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
    ...createShadows({ shadow: { medium: "rgba(0, 0, 0, 0.08)" } } as any).md,
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
    ...createShadows({ shadow: { medium: "rgba(0, 0, 0, 0.06)" } } as any).sm,
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
