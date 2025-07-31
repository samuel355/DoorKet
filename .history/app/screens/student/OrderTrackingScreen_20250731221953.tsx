import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Loading, ErrorState } from "../../components/common";
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  ORDER_STATUS_CONFIG,
} from "../../constants";
import { useAuth } from "@/store/authStore";
import { Order } from "@/types";

interface OrderTrackingScreenProps {
  navigation: any;
  route: {
    params: {
      orderId: string;
    };
  };
}

const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const { user } = useAuth();

  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Order status progression
  const statusSteps: OrderStatus[] = [
    "pending",
    "accepted",
    "shopping",
    "delivering",
    "completed",
  ];

  // Load order details
  const loadOrder = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const { data, error } = await SupabaseService.getOrderById(orderId);

        if (error) {
          throw new Error(error);
        }

        if (!data) {
          throw new Error("Order not found");
        }

        setOrder(data);
      } catch (err: any) {
        console.error("Error loading order:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId],
  );

  // Calculate progress percentage
  const getProgressPercentage = (status: OrderStatus): number => {
    const currentIndex = statusSteps.indexOf(status);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / statusSteps.length) * 100;
  };

  // Get estimated delivery time
  const getEstimatedDelivery = (): string => {
    if (!order) return "Calculating...";

    if (order.estimated_delivery_time) {
      return new Date(order.estimated_delivery_time).toLocaleTimeString();
    }

    // Calculate based on order status
    const now = new Date();
    let estimatedMinutes = 0;

    switch (order.status) {
      case "pending":
        estimatedMinutes = 45;
        break;
      case "accepted":
        estimatedMinutes = 35;
        break;
      case "shopping":
        estimatedMinutes = 25;
        break;
      case "delivering":
        estimatedMinutes = 15;
        break;
      default:
        return "N/A";
    }

    const estimatedTime = new Date(now.getTime() + estimatedMinutes * 60000);
    return estimatedTime.toLocaleTimeString();
  };

  // Handle call runner
  const handleCallRunner = () => {
    if (!order?.runner?.phone_number) {
      Alert.alert(
        "Contact Unavailable",
        "Runner contact information is not available",
      );
      return;
    }

    const phoneNumber = order.runner.phone_number;
    const url = `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Error", "Phone calls are not supported on this device");
        }
      })
      .catch((error) => {
        console.error("Error making phone call:", error);
        Alert.alert("Error", "Failed to make phone call");
      });
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    if (
      !order ||
      order.status === "completed" ||
      order.status === "cancelled"
    ) {
      return;
    }

    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const { error } = await SupabaseService.updateOrderStatus(
              order.id,
              "cancelled",
              { cancellation_reason: "Cancelled by customer" },
            );

            if (error) {
              throw new Error(error);
            }

            await loadOrder();
            Alert.alert(
              "Order Cancelled",
              "Your order has been cancelled successfully",
            );
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to cancel order");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Format time
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString();
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      loadOrder();
    }, [loadOrder]),
  );

  // Auto-refresh for active orders
  useEffect(() => {
    if (
      !order ||
      order.status === "completed" ||
      order.status === "cancelled"
    ) {
      return;
    }

    const interval = setInterval(() => {
      loadOrder(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [order, loadOrder]);

  // Render status step
  const renderStatusStep = (status: OrderStatus, index: number) => {
    const isActive = order?.status === status;
    const isCompleted = order && statusSteps.indexOf(order.status) > index;
    const isCancelled = order?.status === "cancelled";
    const config = ORDER_STATUS_CONFIG[status];

    return (
      <View key={status} style={styles.statusStep}>
        <View style={styles.statusLine}>
          {index > 0 && (
            <View
              style={[
                styles.statusLineSegment,
                (isCompleted || isActive) &&
                  !isCancelled &&
                  styles.statusLineActive,
              ]}
            />
          )}
        </View>
        <View
          style={[
            styles.statusIcon,
            (isCompleted || isActive) &&
              !isCancelled &&
              styles.statusIconActive,
            isActive && !isCancelled && styles.statusIconCurrent,
          ]}
        >
          <Ionicons
            name={config.icon as any}
            size={20}
            color={
              (isCompleted || isActive) && !isCancelled
                ? COLORS.WHITE
                : COLORS.GRAY_400
            }
          />
        </View>
        <View style={styles.statusContent}>
          <Text
            style={[
              styles.statusTitle,
              (isCompleted || isActive) &&
                !isCancelled &&
                styles.statusTitleActive,
            ]}
          >
            {config.label}
          </Text>
          <Text style={styles.statusDescription}>{config.description}</Text>
          {isActive && order && (
            <Text style={styles.statusTime}>
              {status === "pending" && formatTime(order.created_at)}
              {status === "accepted" &&
                order.accepted_at &&
                formatTime(order.accepted_at)}
              {status === "completed" &&
                order.completed_at &&
                formatTime(order.completed_at)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Render order item
  const renderOrderItem = (item: any, index: number) => (
    <View key={index} style={styles.orderItem}>
      <Text style={styles.itemName}>
        {item.item?.name || item.custom_item_name}
      </Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
        {item.unit_price && (
          <Text style={styles.itemPrice}>GHS {item.unit_price.toFixed(2)}</Text>
        )}
        {item.custom_budget && (
          <Text style={styles.itemBudget}>
            Budget: GHS {item.custom_budget.toFixed(2)}
          </Text>
        )}
      </View>
      {item.notes && <Text style={styles.itemNotes}>Note: {item.notes}</Text>}
    </View>
  );

  // Loading state
  if (loading && !refreshing) {
    return <Loading text="Loading order details..." />;
  }

  // Error state
  if (error || !order) {
    return (
      <ErrorState
        title="Order Not Found"
        subtitle={error || "The order you are looking for does not exist"}
        actionText="Retry"
        onActionPress={() => loadOrder()}
        secondaryActionText="Go Back"
        onSecondaryActionPress={() => navigation.goBack()}
      />
    );
  }

  const progressPercentage = getProgressPercentage(order.status) / 100;
  const isCancelled = order.status === "cancelled";
  const isCompleted = order.status === "completed";
  const canCancel =
    !isCompleted && !isCancelled && order.status !== "delivering";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrder(true)}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Order Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>
                Order #{order.order_number}
              </Text>
              <Chip
                icon={ORDER_STATUS_CONFIG[order.status].icon}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      ORDER_STATUS_CONFIG[order.status].color + "20",
                  },
                ]}
                textStyle={[
                  styles.statusChipText,
                  { color: ORDER_STATUS_CONFIG[order.status].color },
                ]}
              >
                {ORDER_STATUS_CONFIG[order.status].label}
              </Chip>
            </View>

            <Text style={styles.orderDate}>
              Placed on {formatDate(order.created_at)} at{" "}
              {formatTime(order.created_at)}
            </Text>

            {!isCancelled && !isCompleted && (
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={progressPercentage}
                  color={COLORS.PRIMARY}
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {Math.round(progressPercentage * 100)}% Complete
                </Text>
              </View>
            )}

            {!isCancelled && !isCompleted && (
              <View style={styles.estimatedTime}>
                <Ionicons name="time" size={16} color={COLORS.TEXT_SECONDARY} />
                <Text style={styles.estimatedTimeText}>
                  Estimated delivery: {getEstimatedDelivery()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Order Status Timeline */}
        {!isCancelled && (
          <Card style={styles.sectionCard}>
            <Card.Content style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Order Status</Text>
              <View style={styles.statusTimeline}>
                {statusSteps.map((status, index) =>
                  renderStatusStep(status, index),
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Runner Information */}
        {order.runner && (
          <Card style={styles.sectionCard}>
            <Card.Content style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>Your Runner</Text>
              <View style={styles.runnerInfo}>
                <View style={styles.runnerDetails}>
                  <Text style={styles.runnerName}>
                    {order.runner.full_name}
                  </Text>
                  <Text style={styles.runnerRating}>
                    ⭐ {order.runner.rating?.toFixed(1) || "New"} •{" "}
                    {order.runner.total_orders || 0} deliveries
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  icon="phone"
                  onPress={handleCallRunner}
                  style={styles.callButton}
                >
                  Call
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Delivery Information */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryRow}>
                <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.deliveryAddress}>
                  {order.delivery_address}
                </Text>
              </View>
              {order.special_instructions && (
                <View style={styles.deliveryRow}>
                  <Ionicons
                    name="chatbubble"
                    size={20}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.deliveryInstructions}>
                    {order.special_instructions}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Order Items */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <View style={styles.orderItems}>
              {order.order_items?.map(renderOrderItem)}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  GHS{" "}
                  {(
                    order.total_amount -
                    order.service_fee -
                    order.delivery_fee
                  ).toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>
                  GHS {order.delivery_fee.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Fee</Text>
                <Text style={styles.summaryValue}>
                  GHS {order.service_fee.toFixed(2)}
                </Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  GHS {order.total_amount.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Payment Information */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentMethod}>
                Method: {order.payment_method?.toUpperCase() || "N/A"}
              </Text>
              <Chip
                style={[
                  styles.paymentStatusChip,
                  order.payment_status === "paid" && styles.paidChip,
                ]}
                textStyle={[
                  styles.paymentStatusText,
                  order.payment_status === "paid" && styles.paidText,
                ]}
              >
                {order.payment_status?.toUpperCase() || "PENDING"}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {canCancel && (
            <Button
              mode="outlined"
              onPress={handleCancelOrder}
              style={styles.cancelButton}
              textColor={COLORS.ERROR}
            >
              Cancel Order
            </Button>
          )}

          {isCompleted && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate("OrderHistory")}
              style={styles.actionButton}
            >
              View All Orders
            </Button>
          )}
        </View>
      </ScrollView>
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
    padding: SPACING.LG,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.SM,
  },
  orderNumber: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  statusChip: {
    height: 32,
  },
  statusChipText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  orderDate: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
  },
  progressContainer: {
    marginBottom: SPACING.MD,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.GRAY_200,
    marginBottom: SPACING.SM,
  },
  progressText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  estimatedTime: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  estimatedTimeText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  sectionCard: {
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
    marginBottom: SPACING.LG,
  },
  sectionContent: {
    padding: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  statusTimeline: {
    paddingLeft: SPACING.SM,
  },
  statusStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.LG,
  },
  statusLine: {
    width: 2,
    alignItems: "center",
    marginRight: SPACING.MD,
  },
  statusLineSegment: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.GRAY_300,
    marginBottom: -20,
  },
  statusLineActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_200,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.MD,
    marginLeft: -19,
  },
  statusIconActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  statusIconCurrent: {
    backgroundColor: COLORS.PRIMARY,
    borderWidth: 3,
    borderColor: COLORS.PRIMARY_LIGHT,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  statusTitleActive: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  statusDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  statusTime: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  runnerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  runnerDetails: {
    flex: 1,
  },
  runnerName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  runnerRating: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  callButton: {
    minWidth: 80,
  },
  deliveryInfo: {
    gap: SPACING.MD,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  deliveryAddress: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    flex: 1,
  },
  deliveryInstructions: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
    flex: 1,
    fontStyle: "italic",
  },
  orderItems: {
    gap: SPACING.MD,
  },
  orderItem: {
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  itemName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.XS,
  },
  itemQuantity: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  itemPrice: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  itemBudget: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.WARNING,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  itemNotes: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: "italic",
  },
  divider: {
    marginVertical: SPACING.MD,
  },
  orderSummary: {
    gap: SPACING.SM,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  totalLabel: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  totalValue: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  paymentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentMethod: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  paymentStatusChip: {
    backgroundColor: COLORS.WARNING + "20",
  },
  paymentStatusText: {
    color: COLORS.WARNING,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  paidChip: {
    backgroundColor: COLORS.SUCCESS + "20",
  },
  paidText: {
    color: COLORS.SUCCESS,
  },
  actions: {
    gap: SPACING.MD,
    paddingVertical: SPACING.LG,
  },
  cancelButton: {
    borderColor: COLORS.ERROR,
  },
  actionButton: {
    borderRadius: BORDER_RADIUS.LG,
  },
});

export default OrderTrackingScreen;
