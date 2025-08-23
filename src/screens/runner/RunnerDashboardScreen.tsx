import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order, RunnerStats } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";

type RunnerDashboardNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "Dashboard"
>;

interface RunnerDashboardProps {
  navigation: RunnerDashboardNavigationProp;
}

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;
const HERO_HEIGHT = height * 0.32;

const RunnerDashboardScreen: React.FC<RunnerDashboardProps> = ({
  navigation,
}) => {
  const { user, profile } = useAuth();

  // State
  const [stats, setStats] = useState<RunnerStats>({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_earnings: 0,
    average_rating: 0,
    today_orders: 0,
    total_deliveries: 0,
    completion_rate: 0,
    average_delivery_time: 0,
  });
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const cardAnimations = useRef(
    Array(6)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;
  const slideAnimations = useRef(
    Array(4)
      .fill(0)
      .map(() => new Animated.Value(50)),
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatingActionAnim = useRef(new Animated.Value(0)).current;

  // Start entrance animations
  const startAnimations = useCallback(() => {
    // Hero animation
    Animated.parallel([
      Animated.timing(heroOpacity, {
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
        delay: index * 100,
        useNativeDriver: true,
      }),
    );

    const slideStagger = slideAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 800,
        delay: index * 150,
        useNativeDriver: true,
      }),
    );

    // Floating action button
    Animated.timing(floatingActionAnim, {
      toValue: 1,
      duration: 800,
      delay: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 },
    ).start();

    Animated.stagger(100, [...cardStagger, ...slideStagger]).start();
  }, [
    cardAnimations,
    slideAnimations,
    heroOpacity,
    heroScale,
    floatingActionAnim,
    pulseAnim,
  ]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [availableResult, activeResult, statsResult] = await Promise.all([
        OrderService.getAvailableOrders(),
        OrderService.getRunnerActiveOrders(user.id),
        OrderService.getRunnerStats(user.id),
      ]);

      if (availableResult.data) setAvailableOrders(availableResult.data);
      if (activeResult.data) setActiveOrders(activeResult.data);
      if (statsResult.data) setStats(statsResult.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
    startAnimations();

    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData, startAnimations]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return ColorPalette.warning[500];
      case "accepted":
        return ColorPalette.info[500];
      case "shopping":
        return ColorPalette.accent[500];
      case "delivering":
        return ColorPalette.secondary[500];
      case "completed":
        return ColorPalette.success[500];
      default:
        return ColorPalette.neutral[500];
    }
  };

  // Header parallax effect
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [0, -HERO_HEIGHT / 2],
    extrapolate: "clamp",
  });

  const headerOpacityInterpolate = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT - 100, HERO_HEIGHT],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp",
  });

  const renderHeroSection = () => (
    <Animated.View
      style={[
        styles.heroContainer,
        {
          transform: [{ translateY: headerTranslateY }, { scale: heroScale }],
          opacity: Animated.multiply(heroOpacity, headerOpacityInterpolate),
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.primary[500], ColorPalette.primary[600]] as const}
        style={styles.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroBackground}>
          {/* Decorative elements */}
          <View style={styles.decorativeElements}>
            <Animated.View
              style={[
                styles.floatingOrb,
                styles.orb1,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Animated.View
              style={[
                styles.floatingOrb,
                styles.orb2,
                {
                  transform: [
                    {
                      scale: Animated.subtract(
                        1.2,
                        Animated.subtract(pulseAnim, 1),
                      ),
                    },
                  ],
                },
              ]}
            />
            <View style={[styles.floatingOrb, styles.orb3]} />
          </View>

          <View style={[styles.heroContent]}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>
                {profile?.full_name?.split(" ")[0] || "Runner"}! 👋
              </Text>
              <Text style={styles.heroSubtitle}>
                Ready to make some deliveries?
              </Text>
            </View>

            <View style={styles.heroStatsContainer}>
              <View style={styles.heroStatCard}>
                <View style={styles.blurCard}>
                  <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.heroStatValue}>
                    {formatCurrency(stats.total_earnings || 0)}
                  </Text>
                  <Text style={styles.heroStatLabel}>Total Earnings</Text>
                </View>
              </View>

              <View style={styles.heroStatCard}>
                <View style={styles.blurCard}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                  <Text style={styles.heroStatValue}>
                    {stats.average_rating?.toFixed(1) || "0.0"}
                  </Text>
                  <Text style={styles.heroStatLabel}>Rating</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Animated.Text
        style={[
          styles.sectionTitle,
          {
            opacity: cardAnimations[0],
            transform: [{ translateY: slideAnimations[0] }],
          },
        ]}
      >
        Quick Actions
      </Animated.Text>

      <View style={styles.quickActionsGrid}>
        {[
          {
            icon: "list-circle-outline",
            title: "Available\nOrders",
            color: ColorPalette.success[500],
            bgColor: ColorPalette.success[50],
            count: availableOrders.length,
            onPress: () => navigation.navigate("AvailableOrders"),
            animation: cardAnimations[0],
          },
          {
            icon: "checkmark-circle-outline",
            title: "Active\nOrders",
            color: ColorPalette.info[500],
            bgColor: ColorPalette.info[50],
            count: activeOrders.length,
            onPress: () => navigation.navigate("AcceptedOrders"),
            animation: cardAnimations[1],
          },
          {
            icon: "analytics-outline",
            title: "Earnings",
            color: ColorPalette.accent[500],
            bgColor: ColorPalette.accent[50],
            onPress: () => navigation.navigate("Earnings"),
            animation: cardAnimations[2],
          },
          {
            icon: "person-circle-outline",
            title: "Profile",
            color: ColorPalette.primary[500],
            bgColor: ColorPalette.primary[50],
            onPress: () => navigation.navigate("Profile"),
            animation: cardAnimations[3],
          },
        ].map((action, index) => (
          <Animated.View
            key={index}
            style={[
              styles.quickActionCard,
              {
                opacity: action.animation,
                transform: [{ scale: action.animation }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.quickActionTouchable}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FFFFFF", "#FAFAFA"] as const}
                style={styles.quickActionGradient}
              >
                <View
                  style={[
                    styles.quickActionIconContainer,
                    { backgroundColor: action.bgColor },
                  ]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                {action.count !== undefined && action.count > 0 && (
                  <Animated.View
                    style={[
                      styles.quickActionBadge,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <Text style={styles.quickActionBadgeText}>
                      {action.count}
                    </Text>
                  </Animated.View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderPerformanceCards = () => (
    <View style={styles.performanceSection}>
      <Animated.Text
        style={[
          styles.sectionTitle,
          {
            opacity: cardAnimations[4],
            transform: [{ translateY: slideAnimations[1] }],
          },
        ]}
      >
        Todays Performance
      </Animated.Text>

      <View style={styles.performanceGrid}>
        {[
          {
            icon: "today-outline",
            value: stats.today_orders,
            label: "Today's Orders",
            color: ColorPalette.info[500],
            gradient: [ColorPalette.info[100], ColorPalette.info[50]] as const,
          },
          {
            icon: "checkmark-done-outline",
            value: stats.completed_orders,
            label: "Completed",
            color: ColorPalette.success[500],
            gradient: [
              ColorPalette.success[100],
              ColorPalette.success[50],
            ] as const,
          },
          {
            icon: "speedometer-outline",
            value: `${Math.round(stats.completion_rate || 0)}%`,
            label: "Success Rate",
            color: ColorPalette.accent[500],
            gradient: [
              ColorPalette.accent[100],
              ColorPalette.accent[50],
            ] as const,
          },
          {
            icon: "time-outline",
            value: `${Math.round(stats.average_delivery_time || 0)}m`,
            label: "Avg. Time",
            color: ColorPalette.secondary[500],
            gradient: [
              ColorPalette.secondary[100],
              ColorPalette.secondary[50],
            ] as const,
          },
        ].map((stat, index) => (
          <Animated.View
            key={index}
            style={[
              styles.performanceCard,
              {
                opacity: cardAnimations[4],
                transform: [
                  { scale: cardAnimations[4] },
                  { translateY: slideAnimations[1] },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={stat.gradient}
              style={styles.performanceCardGradient}
            >
              <View style={styles.performanceCardContent}>
                <Ionicons
                  name={stat.icon as any}
                  size={32}
                  color={stat.color}
                />
                <Text style={styles.performanceValue}>{stat.value}</Text>
                <Text style={styles.performanceLabel}>{stat.label}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderActiveOrders = () => {
    if (activeOrders.length === 0) return null;

    return (
      <View style={styles.activeOrdersSection}>
        <View style={styles.sectionHeader}>
          <Animated.Text
            style={[
              styles.sectionTitle,
              {
                opacity: cardAnimations[5],
                transform: [{ translateY: slideAnimations[2] }],
              },
            ]}
          >
            Active Orders
          </Animated.Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AcceptedOrders")}
          >
            <Text style={styles.sectionAction}>View All →</Text>
          </TouchableOpacity>
        </View>

        {activeOrders.slice(0, 2).map((order, index) => (
          <Animated.View
            key={order.id}
            style={[
              styles.orderCard,
              {
                opacity: cardAnimations[5],
                transform: [
                  { translateY: slideAnimations[2] },
                  { scale: cardAnimations[5] },
                ],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("OrderDetails", { orderId: order.id })
              }
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#FFFFFF", "#FAFAFA"] as const}
                style={styles.orderCardGradient}
              >
                <View style={styles.orderCardContent}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>
                      #{order.order_number}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {order.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailRow}>
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color={ColorPalette.neutral[600]}
                      />
                      <Text style={styles.orderDetailText}>
                        {order.student?.full_name}
                      </Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={ColorPalette.neutral[600]}
                      />
                      <Text style={styles.orderDetailText} numberOfLines={1}>
                        {order.delivery_address}
                      </Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Ionicons
                        name="cash-outline"
                        size={16}
                        color={ColorPalette.neutral[600]}
                      />
                      <Text
                        style={[styles.orderDetailText, styles.orderAmount]}
                      >
                        {formatCurrency(order.total_amount)}
                      </Text>
                    </View>
                  </View>

                  {order.status === "accepted" && (
                    <TouchableOpacity
                      style={[styles.orderActionButton, styles.primaryButton]}
                      onPress={() =>
                        navigation.navigate("ShoppingList", {
                          orderId: order.id,
                        })
                      }
                    >
                      <Ionicons name="bag-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.orderActionButtonText}>
                        Start Shopping
                      </Text>
                    </TouchableOpacity>
                  )}

                  {order.status === "shopping" && (
                    <TouchableOpacity
                      style={[styles.orderActionButton, styles.accentButton]}
                      onPress={() =>
                        navigation.navigate("ShoppingList", {
                          orderId: order.id,
                        })
                      }
                    >
                      <Ionicons
                        name="bag-check-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.orderActionButtonText}>
                        Continue Shopping
                      </Text>
                    </TouchableOpacity>
                  )}

                  {order.status === "delivering" && (
                    <TouchableOpacity
                      style={[styles.orderActionButton, styles.successButton]}
                      onPress={() =>
                        navigation.navigate("DeliveryNavigation", {
                          orderId: order.id,
                        })
                      }
                    >
                      <Ionicons
                        name="navigate-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.orderActionButtonText}>
                        Continue Delivery
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderFloatingActionButton = () => (
    <Animated.View
      style={[
        styles.fab,
        {
          opacity: floatingActionAnim,
          transform: [{ scale: floatingActionAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fabTouchable}
        onPress={() => navigation.navigate("AvailableOrders")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            [ColorPalette.primary[400], ColorPalette.primary[600]] as const
          }
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ColorPalette.primary[500]}
        translucent
      />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[ColorPalette.primary[500]]}
            tintColor={ColorPalette.primary[500]}
            progressViewOffset={HERO_HEIGHT / 2}
          />
        }
      >
        {renderHeroSection()}

        <View style={styles.contentContainer}>
          {renderQuickActions()}
          {renderPerformanceCards()}
          {renderActiveOrders()}
        </View>
      </Animated.ScrollView>

      {renderFloatingActionButton()}
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
    marginTop: -59
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Hero Section
  heroContainer: {
    height: HERO_HEIGHT,
    overflow: "hidden",
  },
  heroGradient: {
    flex: 1,
  },
  heroBackground: {
    flex: 1,
    position: "relative",
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingOrb: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  orb1: {
    width: 120,
    height: 120,
    top: -20,
    right: -20,
  },
  orb2: {
    width: 80,
    height: 80,
    top: HERO_HEIGHT * 0.3,
    left: -30,
  },
  orb3: {
    width: 40,
    height: 40,
    top: HERO_HEIGHT * 0.7,
    right: width * 0.3,
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    justifyContent: "space-between",
  },
  greetingSection: {
    flex: 1,
    justifyContent: "center",
  },
  greeting: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "400",
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "400",
  },
  heroStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 24,
    marginBottom: 14,
  },
  heroStatCard: {
    flex: 1,
    marginHorizontal: 6,
  },
  blurCard: {
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 10,
  },
  heroStatValue: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 8,
  },
  heroStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginTop: 4,
  },

  // Content Container
  contentContainer: {
    backgroundColor: ColorPalette.neutral[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    minHeight: height * 0.7,
  },

  // Section Headers
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionAction: {
    fontSize: 16,
    color: ColorPalette.primary[600],
    fontWeight: "600",
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  quickActionTouchable: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
    position: "relative",
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    textAlign: "center",
    lineHeight: 20,
  },
  quickActionBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: ColorPalette.error[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  quickActionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Performance Section
  performanceSection: {
    marginBottom: 32,
  },
  performanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  performanceCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  performanceCardGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  performanceCardContent: {
    alignItems: "center",
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: ColorPalette.neutral[900],
    marginTop: 12,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.neutral[600],
    textAlign: "center",
  },

  // Active Orders
  activeOrdersSection: {
    marginBottom: 32,
  },
  orderCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  orderCardGradient: {
    borderRadius: 20,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  orderCardContent: {
    padding: 20,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderDetails: {
    marginBottom: 16,
  },
  orderDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  orderAmount: {
    fontWeight: "700",
    color: ColorPalette.neutral[900],
  },
  orderActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: ColorPalette.primary[500],
  },
  accentButton: {
    backgroundColor: ColorPalette.accent[500],
  },
  successButton: {
    backgroundColor: ColorPalette.success[500],
  },
  orderActionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: ColorPalette.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabTouchable: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
  },
  fabGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RunnerDashboardScreen;
