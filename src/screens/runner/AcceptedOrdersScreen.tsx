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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Badge, Button, Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";

type AcceptedOrdersNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "AcceptedOrders"
>;

interface AcceptedOrdersProps {
  navigation: AcceptedOrdersNavigationProp;
}

const { width } = Dimensions.get("window");

const AcceptedOrdersScreen: React.FC<AcceptedOrdersProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadOrders();
    startAnimations();

    // Set up real-time updates
    const interval = setInterval(loadOrders, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

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
      console.error("Failed to load active orders:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadOrders();
  }, [user?.id]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
  ) => {
    try {
      setUpdatingOrder(orderId);
      const result = await OrderService.updateOrderStatusWithResult(
        orderId,
        newStatus,
      );
      if (result.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );

        if (newStatus === "completed") {
          Alert.alert(
            "Order Completed!",
            "Great job! The order has been marked as completed.",
            [{ text: "OK" }],
          );
        }
      } else {
        Alert.alert("Error", result.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Update order status error:", error);
      Alert.alert("Error", "Failed to update order status. Please try again.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleStartShopping = (orderId: string) => {
    navigation.navigate("ShoppingList", { orderId });
  };

  const handleStartDelivery = async (orderId: string) => {
    await handleUpdateOrderStatus(orderId, "delivering");
    navigation.navigate("DeliveryNavigation", { orderId });
  };

  const handleCompleteOrder = (orderId: string) => {
    Alert.alert(
      "Complete Order",
      "Are you sure you want to mark this order as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          style: "default",
          onPress: () => handleUpdateOrderStatus(orderId, "completed"),
        },
      ],
    );
  };

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "READY TO SHOP";
      case "shopping":
        return "SHOPPING";
      case "delivering":
        return "DELIVERING";
      case "completed":
        return "COMPLETED";
      default:
        return status.toUpperCase();
    }
  };

  const getNextAction = (order: Order) => {
    switch (order.status) {
      case "accepted":
        return {
          text: "Start Shopping",
          action: () => handleStartShopping(order.id),
          color: ColorPalette.primary[500],
          icon: "bag",
        };
      case "shopping":
        return {
          text: "Continue Shopping",
          action: () => handleStartShopping(order.id),
          color: "#9C27B0",
          icon: "bag",
        };
      case "delivering":
        return {
          text: "Complete Delivery",
          action: () => handleCompleteOrder(order.id),
          color: "#4CAF50",
          icon: "checkmark-circle",
        };
      default:
        return null;
    }
  };

  const getSecondaryAction = (order: Order) => {
    if (order.status === "shopping") {
      return {
        text: "Start Delivery",
        action: () => handleStartDelivery(order.id),
        color: "#FF5722",
        icon: "car",
      };
    }
    return null;
  };

  const renderOrderItem = ({
    item: order,
    index,
  }: {
    item: Order;
    index: number;
  }) => {
    const nextAction = getNextAction(order);
    const secondaryAction = getSecondaryAction(order);

    return (
      <Animated.View
        style={[
          styles.orderContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 30 * (index + 1)],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("OrderDetails", { orderId: order.id })
          }
          disabled={updatingOrder === order.id}
        >
          <Card style={styles.orderCard}>
            <Card.Content style={styles.cardContent}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderTime}>
                    Accepted {formatTime(order.accepted_at || order.created_at)}
                  </Text>
                </View>
                <Badge
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                >
                  {getStatusText(order.status)}
                </Badge>
              </View>

              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          order.status === "accepted"
                            ? 25
                            : order.status === "shopping"
                              ? 50
                              : order.status === "delivering"
                                ? 75
                                : 100
                        }%`,
                        backgroundColor: getStatusColor(order.status),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressSteps}>
                  <Chip
                    style={[
                      styles.stepChip,
                      {
                        backgroundColor:
                          [
                            "accepted",
                            "shopping",
                            "delivering",
                            "completed",
                          ].indexOf(order.status) >= 0
                            ? getStatusColor(order.status)
                            : "#e0e0e0",
                      },
                    ]}
                    textStyle={styles.stepChipText}
                  >
                    Accept
                  </Chip>
                  <Chip
                    style={[
                      styles.stepChip,
                      {
                        backgroundColor:
                          ["shopping", "delivering", "completed"].indexOf(
                            order.status,
                          ) >= 0
                            ? getStatusColor(order.status)
                            : "#e0e0e0",
                      },
                    ]}
                    textStyle={styles.stepChipText}
                  >
                    Shop
                  </Chip>
                  <Chip
                    style={[
                      styles.stepChip,
                      {
                        backgroundColor:
                          ["delivering", "completed"].indexOf(order.status) >= 0
                            ? getStatusColor(order.status)
                            : "#e0e0e0",
                      },
                    ]}
                    textStyle={styles.stepChipText}
                  >
                    Deliver
                  </Chip>
                  <Chip
                    style={[
                      styles.stepChip,
                      {
                        backgroundColor:
                          order.status === "completed"
                            ? getStatusColor(order.status)
                            : "#e0e0e0",
                      },
                    ]}
                    textStyle={styles.stepChipText}
                  >
                    Done
                  </Chip>
                </View>
              </View>

              {/* Customer Info */}
              <View style={styles.customerSection}>
                <View style={styles.customerInfo}>
                  <Ionicons name="person-circle" size={24} color="#666" />
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>
                      {order.student?.full_name || "Customer"}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>
                        {order.student?.rating?.toFixed(1) || "New"} •{" "}
                        {order.student?.total_orders || 0} orders
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Order Details */}
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="bag" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {order.order_items?.length || 0} items •{" "}
                    {formatCurrency(order.total_amount)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.detailText} numberOfLines={2}>
                    {order.delivery_address}
                  </Text>
                </View>

                {order.special_instructions && (
                  <View style={styles.detailRow}>
                    <Ionicons name="chatbubble" size={16} color="#666" />
                    <Text style={styles.detailText} numberOfLines={2}>
                      {order.special_instructions}
                    </Text>
                  </View>
                )}
              </View>

              {/* Earnings Info */}
              <View style={styles.earningsSection}>
                <View style={styles.earningsBox}>
                  <Text style={styles.earningsLabel}>Delivery Earnings</Text>
                  <Text style={styles.earningsAmount}>
                    {formatCurrency(order.delivery_fee + order.service_fee)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={() =>
                    navigation.navigate("OrderDetails", { orderId: order.id })
                  }
                  style={styles.viewButton}
                  labelStyle={styles.viewButtonText}
                  icon="eye"
                >
                  Details
                </Button>

                {nextAction && (
                  <Button
                    mode="contained"
                    onPress={nextAction.action}
                    style={[
                      styles.actionButton,
                      { backgroundColor: nextAction.color },
                    ]}
                    labelStyle={styles.actionButtonText}
                    loading={updatingOrder === order.id}
                    disabled={updatingOrder === order.id}
                    icon={nextAction.icon}
                  >
                    {nextAction.text}
                  </Button>
                )}
              </View>

              {/* Secondary Action */}
              {secondaryAction && (
                <View style={styles.secondaryActionContainer}>
                  <Button
                    mode="contained"
                    onPress={secondaryAction.action}
                    style={[
                      styles.secondaryActionButton,
                      { backgroundColor: secondaryAction.color },
                    ]}
                    labelStyle={styles.actionButtonText}
                    loading={updatingOrder === order.id}
                    disabled={updatingOrder === order.id}
                    icon={secondaryAction.icon}
                  >
                    {secondaryAction.text}
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Ionicons name="checkmark-circle-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Active Orders</Text>
      <Text style={styles.emptySubtitle}>
        Accept orders from the Available Orders tab to see them here.
      </Text>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate("AvailableOrders")}
        style={styles.browseButton}
        icon="bag-add"
      >
        Browse Available Orders
      </Button>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[ColorPalette.primary[500]]}
            tintColor={ColorPalette.primary[500]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  orderContainer: {
    marginBottom: spacing.lg,
  },
  orderCard: {
    elevation: 3,
    borderRadius: borderRadius.lg,
    backgroundColor: "#ffffff",
  },
  cardContent: {
    padding: spacing.lg,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.neutral[900],
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepChip: {
    height: 24,
    paddingHorizontal: spacing.xs,
  },
  stepChipText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  customerSection: {
    marginBottom: spacing.md,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerDetails: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
    marginLeft: 4,
  },
  orderDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  earningsSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  earningsBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsLabel: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  viewButton: {
    flex: 1,
    borderColor: ColorPalette.primary[500],
  },
  viewButtonText: {
    color: ColorPalette.primary[500],
    fontWeight: "600",
    fontSize: 12,
  },
  actionButton: {
    flex: 2,
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  secondaryActionContainer: {
    marginTop: spacing.sm,
  },
  secondaryActionButton: {
    width: "100%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.neutral[900],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  browseButton: {
    marginTop: spacing.md,
    borderColor: ColorPalette.primary[500],
  },
});

export default AcceptedOrdersScreen;
