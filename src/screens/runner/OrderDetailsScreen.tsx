import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Badge,
  Button,
  Divider,
  Avatar,
  Chip,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RunnerStackParamList, Order, OrderItem } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";
import { COLORS } from "../../constants";

type OrderDetailsNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "OrderDetails"
>;

type OrderDetailsRouteProp = RouteProp<RunnerStackParamList, "OrderDetails">;

interface OrderDetailsProps {
  navigation: OrderDetailsNavigationProp;
  route: OrderDetailsRouteProp;
}

const { width } = Dimensions.get("window");

const OrderDetailsScreen: React.FC<OrderDetailsProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadOrderDetails();
    startAnimations();
  }, [orderId]);

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

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      const result = await OrderService.getOrderById(orderId);
      if (result.data) {
        setOrder(result.data);
      }
    } catch (error) {
      console.error("Failed to load order details:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!user?.id || !order) return;

    Alert.alert(
      "Accept Order",
      `Are you sure you want to accept order #${order.order_number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              setIsUpdating(true);
              const result = await OrderService.acceptOrder(order.id, user.id);
              if (result.success) {
                setOrder({ ...order, status: "accepted", runner_id: user.id });
                Alert.alert(
                  "Order Accepted!",
                  "You can now start shopping for this order.",
                );
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              console.error("Accept order error:", error);
              Alert.alert("Error", "Failed to accept order");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ],
    );
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;

    try {
      setIsUpdating(true);
      const result = await OrderService.updateOrderStatusWithResult(
        order.id,
        newStatus,
      );
      if (result.success) {
        setOrder({ ...order, status: newStatus });
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Update status error:", error);
      Alert.alert("Error", "Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCallCustomer = () => {
    if (order?.student?.phone) {
      Linking.openURL(`tel:${order.student.phone}`);
    } else {
      Alert.alert("Info", "Customer phone number not available");
    }
  };

  const handleMessageCustomer = () => {
    if (order?.student?.phone) {
      Linking.openURL(`sms:${order.student.phone}`);
    } else {
      Alert.alert("Info", "Customer phone number not available");
    }
  };

  const handleStartShopping = () => {
    if (order) {
      navigation.navigate("ShoppingList", { orderId: order.id });
    }
  };

  const handleStartDelivery = () => {
    if (order) {
      navigation.navigate("DeliveryNavigation", { orderId: order.id });
    }
  };

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
      case "cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "accepted":
        return "checkmark-circle-outline";
      case "shopping":
        return "bag-outline";
      case "delivering":
        return "car-outline";
      case "completed":
        return "checkmark-done-outline";
      case "cancelled":
        return "close-circle-outline";
      default:
        return "ellipse-outline";
    }
  };

  const canAcceptOrder = () => {
    return order?.status === "pending" && !order.runner_id;
  };

  const canStartShopping = () => {
    return order?.status === "accepted" && order.runner_id === user?.id;
  };

  const canStartDelivery = () => {
    return order?.status === "shopping" && order.runner_id === user?.id;
  };

  const canCompleteOrder = () => {
    return order?.status === "delivering" && order.runner_id === user?.id;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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
          >
            <View style={styles.headerContent}>
              <View style={styles.orderNumberSection}>
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
              <View style={styles.orderTimeSection}>
                <Ionicons name="time" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.orderTime}>
                  Placed {formatDateTime(order.created_at)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          {/* Customer Information */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={ColorPalette.primary[500]}
                  />
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                </View>

                <View style={styles.customerInfo}>
                  <Avatar.Text
                    size={50}
                    label={order.student?.full_name?.charAt(0) || "U"}
                    style={styles.customerAvatar}
                  />
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>
                      {order.student?.full_name || "Unknown Customer"}
                    </Text>
                    <View style={styles.customerMeta}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>
                          {order.student?.rating?.toFixed(1) || "New"}
                        </Text>
                      </View>
                      <Text style={styles.orderCount}>
                        {order.student?.total_orders || 0} orders
                      </Text>
                    </View>
                    <Text style={styles.customerContact}>
                      {order.student?.email || "No email"}
                    </Text>
                  </View>
                </View>

                <View style={styles.contactButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleCallCustomer}
                    style={styles.contactButton}
                    icon="call"
                    disabled={!order.student?.phone}
                  >
                    Call
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleMessageCustomer}
                    style={styles.contactButton}
                    icon="message"
                    disabled={!order.student?.phone}
                  >
                    Message
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Delivery Information */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={ColorPalette.primary[500]}
                  />
                  <Text style={styles.sectionTitle}>Delivery Information</Text>
                </View>

                <View style={styles.deliveryInfo}>
                  <View style={styles.addressContainer}>
                    <Text style={styles.addressLabel}>Delivery Address:</Text>
                    <Text style={styles.address}>{order.delivery_address}</Text>
                  </View>

                  {order.special_instructions && (
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsLabel}>
                        Special Instructions:
                      </Text>
                      <Text style={styles.instructions}>
                        {order.special_instructions}
                      </Text>
                    </View>
                  )}

                  <View style={styles.deliveryMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Payment Method:</Text>
                      <Chip style={styles.paymentChip}>
                        {order.payment_method?.toUpperCase() || "PENDING"}
                      </Chip>
                    </View>
                    {order.estimated_delivery_time && (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Est. Delivery:</Text>
                        <Text style={styles.metaValue}>
                          {formatDateTime(order.estimated_delivery_time)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Order Items */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="bag"
                    size={20}
                    color={ColorPalette.primary[500]}
                  />
                  <Text style={styles.sectionTitle}>
                    Order Items ({order.order_items?.length || 0})
                  </Text>
                </View>

                {order.order_items?.map((item: OrderItem, index: number) => (
                  <View key={item.id} style={styles.orderItem}>
                    <View style={styles.itemMain}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>
                          {item.item?.name ||
                            item.custom_item_name ||
                            "Unknown Item"}
                        </Text>
                        <Text style={styles.itemDetails}>
                          Qty: {item.quantity} {item.item?.unit || ""}
                        </Text>
                        {item.notes && (
                          <Text style={styles.itemNotes}>
                            Note: {item.notes}
                          </Text>
                        )}
                      </View>
                      <View style={styles.itemPrice}>
                        <Text style={styles.itemPriceText}>
                          {item.unit_price
                            ? formatCurrency(item.unit_price * item.quantity)
                            : item.custom_budget
                              ? formatCurrency(item.custom_budget)
                              : "TBD"}
                        </Text>
                      </View>
                    </View>
                    {index < (order.order_items?.length || 0) - 1 && (
                      <Divider style={styles.itemDivider} />
                    )}
                  </View>
                ))}
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Order Summary */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="calculator"
                    size={20}
                    color={ColorPalette.primary[500]}
                  />
                  <Text style={styles.sectionTitle}>Order Summary</Text>
                </View>

                <View style={styles.summaryContainer}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(
                        order.total_amount -
                          order.delivery_fee -
                          order.service_fee,
                      )}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(order.delivery_fee)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Service Fee:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(order.service_fee)}
                    </Text>
                  </View>
                  <Divider style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>Total:</Text>
                    <Text style={styles.summaryTotalValue}>
                      {formatCurrency(order.total_amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.earningsInfo}>
                  <Text style={styles.earningsLabel}>Your Earnings:</Text>
                  <Text style={styles.earningsValue}>
                    {formatCurrency(order.delivery_fee + order.service_fee)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.actionsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {canAcceptOrder() && (
              <Button
                mode="contained"
                onPress={handleAcceptOrder}
                style={[styles.actionButton, styles.acceptButton]}
                labelStyle={styles.actionButtonText}
                loading={isUpdating}
                disabled={isUpdating}
                icon="checkmark-circle"
              >
                Accept Order
              </Button>
            )}

            {canStartShopping() && (
              <Button
                mode="contained"
                onPress={handleStartShopping}
                style={[styles.actionButton, styles.shoppingButton]}
                labelStyle={styles.actionButtonText}
                icon="bag"
              >
                Start Shopping
              </Button>
            )}

            {canStartDelivery() && (
              <Button
                mode="contained"
                onPress={handleStartDelivery}
                style={[styles.actionButton, styles.deliveryButton]}
                labelStyle={styles.actionButtonText}
                icon="car"
              >
                Start Delivery
              </Button>
            )}

            {canCompleteOrder() && (
              <Button
                mode="contained"
                onPress={() => handleUpdateStatus("completed")}
                style={[styles.actionButton, styles.completeButton]}
                labelStyle={styles.actionButtonText}
                loading={isUpdating}
                disabled={isUpdating}
                icon="checkmark-done"
              >
                Complete Order
              </Button>
            )}
          </Animated.View>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: -20,
  },
  headerGradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    alignItems: "flex-start",
  },
  orderNumberSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "bold",
  },
  orderTimeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderTime: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  card: {
    elevation: 3,
    borderRadius: borderRadius.lg,
  },
  cardContent: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.neutral[900],
    marginLeft: spacing.sm,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  customerAvatar: {
    backgroundColor: ColorPalette.primary[500],
    marginRight: spacing.md,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.neutral[900],
    marginBottom: 4,
  },
  customerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  ratingText: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginLeft: 4,
  },
  orderCount: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
  },
  customerContact: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
  },
  contactButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  contactButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderColor: ColorPalette.primary[500],
  },
  deliveryInfo: {
    gap: spacing.md,
  },
  addressContainer: {},
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    lineHeight: 22,
  },
  instructionsContainer: {},
  instructionsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    lineHeight: 20,
    fontStyle: "italic",
  },
  deliveryMeta: {
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.neutral[900],
  },
  metaValue: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
  },
  paymentChip: {
    backgroundColor: ColorPalette.secondary[100],
  },
  orderItem: {
    marginBottom: spacing.sm,
  },
  itemMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
    fontStyle: "italic",
  },
  itemPrice: {
    alignItems: "flex-end",
  },
  itemPriceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.neutral[900],
  },
  itemDivider: {
    marginTop: spacing.sm,
  },
  summaryContainer: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
  },
  summaryValue: {
    fontSize: 14,
    color: ColorPalette.neutral[900],
    fontWeight: "500",
  },
  summaryDivider: {
    marginVertical: spacing.sm,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
  },
  earningsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ColorPalette.primary[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  actionsContainer: {
    paddingBottom: spacing.xl,
  },
  actionButton: {
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  acceptButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  shoppingButton: {
    backgroundColor: "#9C27B0",
  },
  deliveryButton: {
    backgroundColor: "#FF5722",
  },
  completeButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default OrderDetailsScreen;
