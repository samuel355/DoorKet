import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
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
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import {
  borderRadius,
  spacing,
  createShadows,
  createTypography,
} from "../../theme/styling";

type AcceptedOrdersNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "AcceptedOrders"
>;

interface AcceptedOrdersProps {
  navigation: AcceptedOrdersNavigationProp;
}

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = 120;

const AcceptedOrdersScreen: React.FC<AcceptedOrdersProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "active" | "shopping" | "delivering"
  >("active");

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  const shadows = createShadows({
    shadow: { medium: "rgba(0, 0, 0, 0.1)" },
  } as any);

  useEffect(() => {
    loadOrders();
    startAnimations();

    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const startAnimations = () => {
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(listAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadOrders = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const result = await OrderService.getRunnerActiveOrders(user.id);
      if (result.data) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrder(orderId);
      const result = await OrderService.updateOrderStatus(orderId, newStatus);

      if (result.success) {
        await loadOrders();

        if (newStatus === "completed") {
          Alert.alert(
            "Order Completed! 🎉",
            "Great job! The order has been marked as completed.",
            [{ text: "OK" }],
          );
        }
      } else {
        Alert.alert("Error", result.message || "Failed to update order status");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Update order error:", error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return "checkmark-circle-outline";
      case "shopping":
        return "bag-outline";
      case "delivering":
        return "navigate-outline";
      case "completed":
        return "trophy-outline";
      default:
        return "ellipse-outline";
    }
  };

  const getFilteredOrders = () => {
    switch (selectedTab) {
      case "shopping":
        return orders.filter((order) => order.status === "shopping");
      case "delivering":
        return orders.filter((order) => order.status === "delivering");
      default:
        return orders;
    }
  };

  const renderHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [1, 0.9],
      extrapolate: "clamp",
    });

    const headerScale = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.95],
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
            ColorPalette.secondary[500],
            ColorPalette.secondary[600],
            ColorPalette.secondary[700],
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
                <Text style={styles.headerTitle}>Active Orders</Text>
                <Text style={styles.headerSubtitle}>
                  {orders.length} orders in progress
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => {
                  setIsRefreshing(true);
                  loadOrders();
                }}
              >
                <BlurView
                  intensity={20}
                  tint="light"
                  style={styles.refreshButtonBlur}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
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

  const renderTabs = () => (
    <Animated.View
      style={[
        styles.tabsContainer,
        {
          opacity: tabAnim,
          transform: [{ translateY: Animated.multiply(tabAnim, -20) }],
        },
      ]}
    >
      {[
        { key: "active", label: "All Active", icon: "list-outline" },
        { key: "shopping", label: "Shopping", icon: "bag-outline" },
        { key: "delivering", label: "Delivering", icon: "navigate-outline" },
      ].map((tab) => {
        const isActive = selectedTab === tab.key;
        const count =
          tab.key === "active"
            ? orders.length
            : orders.filter((order) => order.status === tab.key).length;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <LinearGradient
              colors={
                isActive
                  ? [ColorPalette.secondary[500], ColorPalette.secondary[600]]
                  : ["#FFFFFF", "#FAFAFA"]
              }
              style={styles.tabButtonGradient}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={isActive ? "#FFFFFF" : ColorPalette.neutral[600]}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  isActive && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.3)"
                        : ColorPalette.secondary[500],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      { color: isActive ? "#FFFFFF" : "#FFFFFF" },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );

  const renderOrderCard = ({
    item: order,
    index,
  }: {
    item: Order;
    index: number;
  }) => {
    const isUpdating = updatingOrder === order.id;
    const statusColor = getStatusColor(order.status);
    const statusIcon = getStatusIcon(order.status);

    const cardAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnimation, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    const getNextAction = () => {
      switch (order.status) {
        case "accepted":
          return {
            label: "Start Shopping",
            action: () =>
              navigation.navigate("ShoppingList", { orderId: order.id }),
            icon: "bag-outline",
            gradient: [ColorPalette.primary[500], ColorPalette.primary[600]],
          };
        case "shopping":
          return {
            label: "Continue Shopping",
            action: () =>
              navigation.navigate("ShoppingList", { orderId: order.id }),
            icon: "bag-check-outline",
            gradient: [ColorPalette.accent[500], ColorPalette.accent[600]],
          };
        case "delivering":
          return {
            label: "Continue Delivery",
            action: () =>
              navigation.navigate("DeliveryNavigation", { orderId: order.id }),
            icon: "navigate-outline",
            gradient: [ColorPalette.success[500], ColorPalette.success[600]],
          };
        default:
          return null;
      }
    };

    const nextAction = getNextAction();

    return (
      <Animated.View
        style={[
          styles.orderCard,
          {
            opacity: cardAnimation,
            transform: [
              {
                translateY: Animated.multiply(
                  Animated.subtract(1, cardAnimation),
                  50,
                ),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("OrderDetails", { orderId: order.id })
          }
        >
          <LinearGradient
            colors={["#FFFFFF", "#FEFEFE"]}
            style={styles.orderCardGradient}
          >
            <View style={styles.orderCardContent}>
              {/* Header */}
              <View style={styles.orderCardHeader}>
                <View style={styles.orderInfoSection}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderTime}>
                    {formatTimeAgo(order.created_at)}
                  </Text>
                </View>
                <View style={styles.statusSection}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor },
                    ]}
                  >
                    <Ionicons
                      name={statusIcon as any}
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.statusText}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Student Info */}
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={ColorPalette.secondary[500]}
                  />
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>
                    {order.student?.full_name || "Unknown Student"}
                  </Text>
                  <Text style={styles.studentContact}>
                    {order.student?.phone_number || "No contact"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => {
                    // Add call functionality
                    Alert.alert(
                      "Call Student",
                      `Call ${order.student?.full_name}?`,
                    );
                  }}
                >
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={ColorPalette.secondary[500]}
                  />
                </TouchableOpacity>
              </View>

              {/* Order Details */}
              <View style={styles.orderDetails}>
                <View style={styles.orderDetailRow}>
                  <Ionicons
                    name="bag-outline"
                    size={16}
                    color={ColorPalette.neutral[600]}
                  />
                  <Text style={styles.orderDetailText}>
                    {order.items?.length || 0} items •{" "}
                    {formatCurrency(order.total_amount)}
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
                {order.special_instructions && (
                  <View style={styles.orderDetailRow}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={ColorPalette.neutral[600]}
                    />
                    <Text style={styles.orderDetailText} numberOfLines={2}>
                      {order.special_instructions}
                    </Text>
                  </View>
                )}
              </View>

              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Order Progress</Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            order.status === "accepted"
                              ? "25%"
                              : order.status === "shopping"
                                ? "50%"
                                : order.status === "delivering"
                                  ? "75%"
                                  : "100%",
                          backgroundColor: statusColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {nextAction && (
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={nextAction.action}
                    disabled={isUpdating}
                  >
                    <LinearGradient
                      colors={nextAction.gradient}
                      style={styles.primaryActionGradient}
                    >
                      <Ionicons
                        name={nextAction.icon as any}
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.primaryActionText}>
                        {nextAction.label}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() =>
                    navigation.navigate("OrderDetails", { orderId: order.id })
                  }
                >
                  <Text style={styles.secondaryActionText}>View Details</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={ColorPalette.secondary[500]}
                  />
                </TouchableOpacity>

                {order.status === "delivering" && (
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      isUpdating && styles.completeButtonLoading,
                    ]}
                    onPress={() => updateOrderStatus(order.id, "completed")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Text style={styles.completeButtonText}>
                        Completing...
                      </Text>
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-done"
                          size={16}
                          color={ColorPalette.success[500]}
                        />
                        <Text style={styles.completeButtonText}>
                          Mark Complete
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: listAnim,
          transform: [{ translateY: Animated.multiply(listAnim, -20) }],
        },
      ]}
    >
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={[ColorPalette.secondary[100], ColorPalette.secondary[50]]}
          style={styles.emptyIconGradient}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={48}
            color={ColorPalette.secondary[500]}
          />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No Active Orders</Text>
      <Text style={styles.emptySubtitle}>
        Accept some orders to see them here
      </Text>
      <TouchableOpacity
        style={styles.browseOrdersButton}
        onPress={() => navigation.navigate("AvailableOrders")}
      >
        <LinearGradient
          colors={[ColorPalette.secondary[500], ColorPalette.secondary[600]]}
          style={styles.browseOrdersGradient}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.browseOrdersText}>Browse Orders</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const filteredOrders = getFilteredOrders();

  return (
    <View style={styles.container}>
      {renderHeader()}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: listAnim,
          },
        ]}
      >
        {renderTabs()}

        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[ColorPalette.secondary[500]]}
              tintColor={ColorPalette.secondary[500]}
              progressViewOffset={HEADER_HEIGHT + 100}
            />
          }
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
        />
      </Animated.View>
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
    height: HEADER_HEIGHT + (Platform.OS === "ios" ? 44 : 24),
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    position: "relative",
  },
  headerContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
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
  refreshButton: {},
  refreshButtonBlur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
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
    width: 80,
    height: 80,
    top: -20,
    right: -20,
  },
  orb2: {
    width: 120,
    height: 120,
    top: 20,
    right: width * 0.6,
  },
  orb3: {
    width: 60,
    height: 60,
    bottom: -10,
    right: width * 0.3,
  },

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabButtonActive: {},
  tabButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: "relative",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[600],
    marginLeft: 8,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  tabBadge: {
    position: "absolute",
    top: 6,
    right: 8,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // List Styles
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Order Card Styles
  orderCard: {
    marginBottom: 16,
  },
  orderCardGradient: {
    borderRadius: 20,
    padding: 20,
    ...createShadows({ shadow: { medium: "rgba(0, 0, 0, 0.08)" } } as any).md,
  },
  orderCardContent: {},
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderInfoSection: {},
  orderNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
    fontWeight: "500",
  },
  statusSection: {},
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 4,
  },

  // Student Info
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: ColorPalette.secondary[50],
    borderRadius: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginBottom: 2,
  },
  studentContact: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  // Order Details
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
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },

  // Progress
  progressContainer: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[700],
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: ColorPalette.neutral[200],
    borderRadius: 3,
    overflow: "hidden",
  },
  progressTrack: {
    flex: 1,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Action Buttons
  actionButtons: {
    gap: 12,
  },
  primaryActionButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  secondaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ColorPalette.secondary[200],
    backgroundColor: "#FFFFFF",
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.secondary[500],
    marginRight: 4,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: ColorPalette.success[50],
    borderWidth: 1,
    borderColor: ColorPalette.success[200],
  },
  completeButtonLoading: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.success[600],
    marginLeft: 4,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  browseOrdersButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  browseOrdersGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  browseOrdersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});

export default AcceptedOrdersScreen;
