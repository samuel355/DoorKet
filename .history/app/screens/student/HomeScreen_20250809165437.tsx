import { ItemService, OrderService } from "@/services/supabase";
import { useAuth } from "@/store/authStore";
import { Category, Order, StudentStackParamList } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Searchbar, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";

type HomeScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Home"
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2;
const HEADER_HEIGHT = height * 0.28;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = useCallback(() => {
    // Stagger animations for smooth entrance
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
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

    // Floating animation for decorative elements
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
  }, [floatAnim, headerOpacity, cardScale, slideAnim, fadeAnim]);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await ItemService.getCategories();
      if (error) {
        console.error("Error loading categories:", error);
        return;
      }
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, []);

  const loadRecentOrders = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await OrderService.getStudentOrders(user.id);
      if (error) {
        console.error("Error loading recent orders:", error);
        return;
      }
      setRecentOrders((data || []).slice(0, 2));
    } catch (error) {
      console.error("Error loading recent orders:", error);
    }
  }, [user]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadCategories(), loadRecentOrders()]);
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadCategories, loadRecentOrders]);

  useEffect(() => {
    const loadAndAnimate = async () => {
      await loadInitialData();
      startAnimations();
    };
    loadAndAnimate();
  }, [loadInitialData, startAnimations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push("/student/categories");
    }
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate("CategoryItems", {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate("OrderTracking", { orderId: order.id });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return ColorPalette.warning[500];
      case "accepted":
      case "shopping":
        return ColorPalette.info[500];
      case "delivering":
        return ColorPalette.accent[500];
      case "completed":
        return ColorPalette.success[500];
      case "cancelled":
        return ColorPalette.error[500];
      default:
        return ColorPalette.neutral[500];
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Finding Runner";
      case "accepted":
        return "Accepted";
      case "shopping":
        return "Shopping";
      case "delivering":
        return "On the Way";
      case "completed":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={[
          ColorPalette.primary[600],
          ColorPalette.primary[500],
          ColorPalette.secondary[500],
          ColorPalette.accent[500],
        ]}
        locations={[0, 0.4, 0.7, 1]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating decorative elements */}
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            { transform: [{ translateY: floatY }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            { transform: [{ translateY: floatY }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            { transform: [{ translateY: floatY }] },
          ]}
        />

        <SafeAreaView style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {profile?.full_name || "Student"}!
              </Text>
              {profile?.hall_hostel && (
                <Text style={styles.location}>
                  {profile.hall_hostel}
                  {profile.room_number ? ` - Room ${profile.room_number}` : ""}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("Notifications")}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.2)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                style={styles.notificationGradient}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#ffffff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search for items..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              onSubmitEditing={handleSearch}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              icon={() => (
                <Ionicons
                  name="search"
                  size={20}
                  color={ColorPalette.primary[500]}
                />
              )}
              iconColor={ColorPalette.primary[500]}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <Animated.View
      style={[
        styles.quickActionsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: cardScale }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Cart")}
        >
          <LinearGradient
            colors={[ColorPalette.primary[100], ColorPalette.primary[50]]}
            style={styles.quickActionGradient}
          >
            <Ionicons
              name="basket"
              size={24}
              color={ColorPalette.primary[600]}
            />
          </LinearGradient>
          <Text style={styles.quickActionText}>My Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("OrderHistory")}
        >
          <LinearGradient
            colors={[ColorPalette.success[100], ColorPalette.success[50]]}
            style={styles.quickActionGradient}
          >
            <Ionicons
              name="receipt"
              size={24}
              color={ColorPalette.success[600]}
            />
          </LinearGradient>
          <Text style={styles.quickActionText}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push("/student/categories")}
        >
          <LinearGradient
            colors={[ColorPalette.accent[100], ColorPalette.accent[50]]}
            style={styles.quickActionGradient}
          >
            <Ionicons name="grid" size={24} color={ColorPalette.accent[600]} />
          </LinearGradient>
          <Text style={styles.quickActionText}>Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Profile")}
        >
          <LinearGradient
            colors={[ColorPalette.secondary[100], ColorPalette.secondary[50]]}
            style={styles.quickActionGradient}
          >
            <Ionicons
              name="person"
              size={24}
              color={ColorPalette.secondary[600]}
            />
          </LinearGradient>
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderCategories = () => (
    <Animated.View
      style={[
        styles.categoriesContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity onPress={() => router.push("/student/categories")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categories.slice(0, 6).map((category, index) => (
          <Animated.View
            key={category.id}
            style={[
              styles.categoryCard,
              {
                transform: [
                  {
                    scale: cardScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity onPress={() => handleCategoryPress(category)}>
              <LinearGradient
                colors={[
                  `${category.color_code || ColorPalette.primary[500]}20`,
                  `${category.color_code || ColorPalette.primary[500]}10`,
                ]}
                style={styles.categoryGradient}
              >
                <View style={styles.categoryContent}>
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor: `${category.color_code || ColorPalette.primary[500]}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={(category.icon_name as any) || "basket"}
                      size={28}
                      color={category.color_code || ColorPalette.primary[500]}
                    />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.name}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderRecentOrders = () => {
    if (recentOrders.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.recentOrdersContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate("OrderHistory")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => handleOrderPress(order)}
          >
            <LinearGradient
              colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
              style={styles.orderCard}
            >
              <View style={styles.orderContent}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <LinearGradient
                    colors={[
                      `${getOrderStatusColor(order.status)}20`,
                      `${getOrderStatusColor(order.status)}10`,
                    ]}
                    style={styles.orderStatus}
                  >
                    <Text
                      style={[
                        styles.orderStatusText,
                        { color: getOrderStatusColor(order.status) },
                      ]}
                    >
                      {getOrderStatusText(order.status)}
                    </Text>
                  </LinearGradient>
                </View>
                <Text style={styles.orderAmount}>
                  GHS {order.total_amount.toFixed(2)}
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ColorPalette.primary[500]]}
            tintColor={ColorPalette.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderQuickActions()}
        {renderCategories()}
        {renderRecentOrders()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: spacing.md,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  location: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
    fontWeight: "500",
  },
  notificationButton: {
    marginTop: spacing.sm,
  },
  notificationGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  searchContainer: {
    marginTop: spacing.lg,
  },
  searchBar: {
    backgroundColor: ColorPalette.pure.white,
    elevation: 8,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    borderRadius: borderRadius.xl,
  },
  searchInput: {
    fontSize: 16,
    color: ColorPalette.neutral[700],
  },
  scrollView: {
    flex: 1,
    marginTop: -spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl,
    paddingTop: spacing.xl,
  },
  quickActionsContainer: {
    backgroundColor: ColorPalette.pure.white,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
    width: (width - 120) / 4,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: ColorPalette.neutral[700],
    textAlign: "center",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  viewAllText: {
    fontSize: 14,
    color: ColorPalette.primary[600],
    fontWeight: "600",
  },
  categoriesContainer: {
    marginBottom: spacing.xl,
  },
  categoriesScroll: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  categoryCard: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
  },
  categoryGradient: {
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  categoryContent: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[700],
    textAlign: "center",
    lineHeight: 18,
  },
  recentOrdersContainer: {
    paddingHorizontal: spacing.lg,
  },
  orderCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  orderContent: {
    padding: spacing.lg,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
  },
  orderStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
    fontWeight: "500",
  },
});

export default HomeScreen;
