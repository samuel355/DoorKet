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
import { Text, Card, Badge, Button, Searchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";

type AvailableOrdersNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "AvailableOrders"
>;

interface AvailableOrdersProps {
  navigation: AvailableOrdersNavigationProp;
}

const { width } = Dimensions.get("window");

const AvailableOrdersScreen: React.FC<AvailableOrdersProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadOrders();
    startAnimations();

    // Set up real-time updates
    const interval = setInterval(loadOrders, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery]);

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
    try {
      setIsLoading(true);
      const result = await OrderService.getAvailableOrders();
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

  const filterOrders = () => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.student?.full_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.delivery_address
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
    setFilteredOrders(filtered);
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadOrders();
  }, []);

  const handleAcceptOrder = async (order: Order) => {
    if (!user?.id) return;

    Alert.alert(
      "Accept Order",
      `Are you sure you want to accept order #${order.order_number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            try {
              setAcceptingOrder(order.id);
              const result = await OrderService.acceptOrder(order.id, user.id);
              if (result.success) {
                // Remove from available orders
                setOrders((prev) => prev.filter((o) => o.id !== order.id));
                Alert.alert(
                  "Success",
                  "Order accepted successfully! You can now start shopping.",
                  [
                    {
                      text: "Start Shopping",
                      onPress: () =>
                        navigation.navigate("ShoppingList", {
                          orderId: order.id,
                        }),
                    },
                    { text: "Later", style: "cancel" },
                  ],
                );
              } else {
                Alert.alert(
                  "Error",
                  result.message || "Failed to accept order",
                );
              }
            } catch (error) {
              console.error("Accept order error:", error);
              Alert.alert("Error", "Failed to accept order. Please try again.");
            } finally {
              setAcceptingOrder(null);
            }
          },
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

  const getDeliveryFee = (order: Order) => {
    // Calculate delivery fee based on distance/location
    // This is a placeholder - implement actual calculation
    return order.delivery_fee || 5.0;
  };

  const getEstimatedEarnings = (order: Order) => {
    const deliveryFee = getDeliveryFee(order);
    const tip = order.total_amount * 0.1; // Estimated 10% tip
    return deliveryFee + tip;
  };

  const renderOrderItem = ({
    item: order,
    index,
  }: {
    item: Order;
    index: number;
  }) => (
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
        disabled={acceptingOrder === order.id}
      >
        <Card style={styles.orderCard}>
          <Card.Content style={styles.cardContent}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                <Text style={styles.orderTime}>
                  {formatTime(order.created_at)}
                </Text>
              </View>
              <Badge style={styles.urgentBadge} visible={true}>
                AVAILABLE
              </Badge>
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
                <Text style={styles.earningsLabel}>Estimated Earnings</Text>
                <Text style={styles.earningsAmount}>
                  {formatCurrency(getEstimatedEarnings(order))}
                </Text>
              </View>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryFee}>
                  Delivery Fee: {formatCurrency(getDeliveryFee(order))}
                </Text>
                <Text style={styles.estimatedTime}>Est. 30-45 min</Text>
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
              >
                View Details
              </Button>

              <Button
                mode="contained"
                onPress={() => handleAcceptOrder(order)}
                style={styles.acceptButton}
                labelStyle={styles.acceptButtonText}
                loading={acceptingOrder === order.id}
                disabled={acceptingOrder === order.id}
              >
                {acceptingOrder === order.id ? "Accepting..." : "Accept Order"}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Ionicons name="bag-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Available Orders</Text>
      <Text style={styles.emptySubtitle}>
        New orders will appear here when students place them. Pull down to
        refresh.
      </Text>
      <Button
        mode="outlined"
        onPress={onRefresh}
        style={styles.refreshButton}
        icon="refresh"
      >
        Refresh
      </Button>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search by order number, customer, or address"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon="magnify"
          clearIcon="close"
        />

        {orders.length > 0 && (
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {filteredOrders.length} available orders
            </Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshIcon}>
              <Ionicons
                name="refresh"
                size={20}
                color={ColorPalette.primary[500]}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={filteredOrders}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#f5f5f5",
    borderRadius: borderRadius.lg,
  },
  searchInput: {
    fontSize: 14,
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  statsText: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  refreshIcon: {
    padding: 4,
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
  urgentBadge: {
    backgroundColor: ColorPalette.secondary[500],
    fontSize: 10,
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
    marginBottom: spacing.sm,
  },
  earningsLabel: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
  },
  deliveryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryFee: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
  },
  estimatedTime: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
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
  },
  acceptButton: {
    flex: 2,
    backgroundColor: ColorPalette.primary[500],
  },
  acceptButtonText: {
    color: "#ffffff",
    fontWeight: "600",
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
  refreshButton: {
    marginTop: spacing.md,
    borderColor: ColorPalette.primary[500],
  },
});

export default AvailableOrdersScreen;
