import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Badge, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order, RunnerStats } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";

type RunnerDashboardNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "Dashboard"
>;

interface RunnerDashboardProps {
  navigation: RunnerDashboardNavigationProp;
}

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2;

const RunnerDashboardScreen: React.FC<RunnerDashboardProps> = ({
  navigation,
}) => {
  const theme = useTheme();
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
  const [isLoading, setIsLoading] = useState(true);

  // Animation refs
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start entrance animations
  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 800,
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
    ]).start();

    // Pulse animation for urgent orders
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Load available orders
      const availableResult = await OrderService.getAvailableOrders();
      if (availableResult.data) {
        setAvailableOrders(availableResult.data);
      }

      // Load runner's active orders
      const activeResult = await OrderService.getRunnerActiveOrders(user.id);
      if (activeResult.data) {
        setActiveOrders(activeResult.data);
      }

      // Load runner statistics
      const statsResult = await OrderService.getRunnerStats(user.id);
      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData();
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
    startAnimations();

    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user?.id]);

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
        return "#FF9800";
      case "accepted":
        return "#2196F3";
      case "shopping":
        return "#9C27B0";
      case "delivering":
        return "#FF5722";
      case "completed":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>
              {getGreeting()}, {profile?.full_name || "Runner"}!
            </Text>
            <Text style={styles.subGreeting}>
              Ready to make some deliveries?
            </Text>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>
                {formatCurrency(stats.total_earnings || 0)}
              </Text>
              <Text style={styles.headerStatLabel}>Total Earnings</Text>
            </View>
            <View style={styles.headerStatItem}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.headerStatValue}>
                  {stats.average_rating?.toFixed(1) || "0.0"}
                </Text>
              </View>
              <Text style={styles.headerStatLabel}>Rating</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerDecoration}>
          <Animated.View
            style={[
              styles.decorativeCircle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View style={styles.decorativeCircleSmall} />
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <Animated.View
      style={[
        styles.quickActionsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate("AvailableOrders")}
        >
          <View
            style={[styles.quickActionIcon, { backgroundColor: "#E8F5E8" }]}
          >
            <Ionicons name="list-circle" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.quickActionText}>Available Orders</Text>
          {availableOrders.length > 0 && (
            <Badge style={styles.quickActionBadge} size={20}>
              {availableOrders.length}
            </Badge>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate("AcceptedOrders")}
        >
          <View
            style={[styles.quickActionIcon, { backgroundColor: "#E3F2FD" }]}
          >
            <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
          </View>
          <Text style={styles.quickActionText}>Active Orders</Text>
          {activeOrders.length > 0 && (
            <Badge style={styles.quickActionBadge} size={20}>
              {activeOrders.length}
            </Badge>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate("Earnings")}
        >
          <View
            style={[styles.quickActionIcon, { backgroundColor: "#FFF3E0" }]}
          >
            <Ionicons name="wallet" size={24} color="#FF9800" />
          </View>
          <Text style={styles.quickActionText}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate("Profile")}
        >
          <View
            style={[styles.quickActionIcon, { backgroundColor: "#F3E5F5" }]}
          >
            <Ionicons name="person" size={24} color="#9C27B0" />
          </View>
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStatsCards = () => (
    <Animated.View
      style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: cardScale }, { translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Today's Performance</Text>
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statCardContent}>
            <View style={styles.statIconContainer}>
              <Ionicons name="today" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{stats.today_orders}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statCardContent}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-done" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{stats.completed_orders}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statCardContent}>
            <View style={styles.statIconContainer}>
              <Ionicons name="speedometer" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>
              {Math.round(stats.completion_rate || 0)}%
            </Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statCardContent}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>
              {Math.round(stats.average_delivery_time || 0)}m
            </Text>
            <Text style={styles.statLabel}>Avg. Time</Text>
          </Card.Content>
        </Card>
      </View>
    </Animated.View>
  );

  const renderActiveOrders = () => {
    if (activeOrders.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.activeOrdersContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AcceptedOrders")}
          >
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>

        {activeOrders.slice(0, 2).map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() =>
              navigation.navigate("OrderDetails", { orderId: order.id })
            }
          >
            <Card style={styles.card}>
              <Card.Content style={styles.orderCardContent}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Badge
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) },
                    ]}
                  >
                    {order.status.toUpperCase()}
                  </Badge>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.orderDetailRow}>
                    <Ionicons name="person" size={16} color="#666" />
                    <Text style={styles.orderDetailText}>
                      {order.student?.full_name}
                    </Text>
                  </View>
                  <View style={styles.orderDetailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.orderDetailText} numberOfLines={1}>
                      {order.delivery_address}
                    </Text>
                  </View>
                  <View style={styles.orderDetailRow}>
                    <Ionicons name="cash" size={16} color="#666" />
                    <Text style={styles.orderDetailText}>
                      {formatCurrency(order.total_amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  {order.status === "accepted" && (
                    <TouchableOpacity
                      style={[
                        styles.orderActionButton,
                        styles.startShoppingButton,
                      ]}
                      onPress={() =>
                        navigation.navigate("ShoppingList", {
                          orderId: order.id,
                        })
                      }
                    >
                      <Text style={styles.orderActionButtonText}>
                        Start Shopping
                      </Text>
                    </TouchableOpacity>
                  )}
                  {order.status === "shopping" && (
                    <TouchableOpacity
                      style={[
                        styles.orderActionButton,
                        styles.continueShoppingButton,
                      ]}
                      onPress={() =>
                        navigation.navigate("ShoppingList", {
                          orderId: order.id,
                        })
                      }
                    >
                      <Text style={styles.orderActionButtonText}>
                        Continue Shopping
                      </Text>
                    </TouchableOpacity>
                  )}
                  {order.status === "delivering" && (
                    <TouchableOpacity
                      style={[styles.orderActionButton, styles.deliveryButton]}
                      onPress={() =>
                        navigation.navigate("DeliveryNavigation", {
                          orderId: order.id,
                        })
                      }
                    >
                      <Text style={styles.orderActionButtonText}>
                        Continue Delivery
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ColorPalette.primary[500]}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[ColorPalette.primary[500]]}
            tintColor={ColorPalette.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderQuickActions()}
        {renderStatsCards()}
        {renderActiveOrders()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.pure.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    height: height * 0.3,
    marginBottom: -40,
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: "space-between",
  },
  greetingSection: {
    marginTop: spacing.md,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  headerStatItem: {
    alignItems: "center",
  },
  headerStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 200,
    height: 200,
  },
  decorativeCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -20,
    right: -20,
  },
  decorativeCircleSmall: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: 80,
    right: 30,
  },
  quickActionsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.neutral[900],
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionAction: {
    fontSize: 14,
    color: ColorPalette.primary[500],
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: CARD_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    textAlign: "center",
  },
  quickActionBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: ColorPalette.secondary[500],
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: CARD_WIDTH,
    marginBottom: spacing.md,
    elevation: 2,
  },
  statCardContent: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  statIconContainer: {
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: ColorPalette.neutral[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
    textAlign: "center",
  },
  activeOrdersContainer: {
    paddingHorizontal: spacing.lg,
  },
  orderCard: {
    marginBottom: spacing.md,
  },
  card: {
    elevation: 3,
    borderRadius: borderRadius.lg,
  },
  orderCardContent: {
    padding: spacing.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.neutral[900],
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
  },
  orderDetails: {
    marginBottom: spacing.md,
  },
  orderDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  orderDetailText: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginLeft: spacing.sm,
    flex: 1,
  },
  orderActions: {
    marginTop: spacing.sm,
  },
  orderActionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  startShoppingButton: {
    backgroundColor: ColorPalette.primary[500],
  },
  continueShoppingButton: {
    backgroundColor: "#9C27B0",
  },
  deliveryButton: {
    backgroundColor: "#FF5722",
  },
  orderActionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default RunnerDashboardScreen;
