import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { RunnerHeader } from "../../components/runner/RunnerHeader";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

interface OrderCardProps {
  order: Order;
  index: number;
  onStartDelivery: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
  formatCurrency: (amount: number) => string;
  formatTime: (dateString: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  index,
  onStartDelivery,
  onViewDetails,
  formatCurrency,
  formatTime,
}) => {
  const cardAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnimation, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [cardAnimation, index]);

  return (
    <Animated.View
      style={[
        styles.orderCard,
        {
          opacity: cardAnimation,
          transform: [
            {
              translateY: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onViewDetails(order.id)}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F8F9FA"]}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>
                Order #{order.order_number}
              </Text>
              <Text style={styles.orderTime}>
                {formatTime(order.created_at)}
              </Text>
            </View>
            <View style={[styles.statusBadge, styles.acceptedBadge]}>
              <Text style={[styles.statusText, styles.acceptedText]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.customerInfo}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.customerName}>
              {(order as any).student?.full_name || "Customer"}
            </Text>
          </View>

          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {order.delivery_address || "Delivery address"}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.totalAmount}>
                {formatCurrency(order.total_amount || 0)}
              </Text>
              <Text style={styles.itemCount}>
                {(order as any).items?.length || 0} items
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {order.status === "accepted" && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => onStartDelivery(order.id)}
                >
                  <LinearGradient
                    colors={[
                      ColorPalette.primary[500],
                      ColorPalette.primary[600],
                    ]}
                    style={styles.startButtonGradient}
                  >
                    <Text style={styles.startButtonText}>Start Shopping</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => onViewDetails(order.id)}
              >
                <Text style={styles.detailsButtonText}>View Details</Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={ColorPalette.primary[500]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

type AcceptedOrdersNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "AcceptedOrders"
>;

interface AcceptedOrdersProps {
  navigation: AcceptedOrdersNavigationProp;
}

const AcceptedOrdersScreen: React.FC<AcceptedOrdersProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    "active" | "shopping" | "delivering"
  >("active");

  // Animation refs
  const tabAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = useCallback(() => {
    Animated.stagger(200, [
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
  }, [tabAnim, listAnim]);

  const loadOrders = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await OrderService.getRunnerActiveOrders(user.id);
      if (result.data) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
    startAnimations();
  }, [loadOrders, startAnimations]);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStartDelivery = async (orderId: string) => {
    try {
      const result = await OrderService.updateOrderStatus(
        orderId,
        "shopping" as any,
      );
      if (result.data) {
        navigation.navigate("ShoppingList", { orderId });
      }
    } catch {
      Alert.alert("Error", "Failed to start shopping");
    }
  };

  const handleViewDetails = (orderId: string) => {
    navigation.navigate("OrderDetails", { orderId });
  };

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      switch (selectedTab) {
        case "active":
          return order.status === "accepted";
        case "shopping":
          return order.status === "shopping";
        case "delivering":
          return order.status === "delivering";
        default:
          return true;
      }
    });
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
      {["active", "shopping", "delivering"].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, selectedTab === tab && styles.activeTab]}
          onPress={() => setSelectedTab(tab as any)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === tab && styles.activeTabText,
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} (
            {orders.filter((order) => order.status === tab).length})
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No Orders Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        You don&apos;t have any {selectedTab} orders at the moment.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <RunnerHeader
        title="Active Orders"
        subtitle={`${orders.length} orders in progress`}
        onBack={() => navigation.goBack()}
        onRefresh={loadOrders}
        isRefreshing={isRefreshing}
        gradientColors={[
          ColorPalette.secondary[500],
          ColorPalette.secondary[600],
          ColorPalette.secondary[700],
        ]}
      />

      {renderTabs()}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: listAnim,
          },
        ]}
      >
        <AnimatedFlatList
          data={getFilteredOrders()}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item, index }) => (
            <OrderCard
              order={item as Order}
              index={index}
              onStartDelivery={handleStartDelivery}
              onViewDetails={handleViewDetails}
              formatCurrency={formatCurrency}
              formatTime={formatTime}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadOrders();
              }}
              colors={[ColorPalette.primary[500]]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: ColorPalette.secondary[500],
  },
  tabText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  orderTime: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptedBadge: {
    backgroundColor: "#E3F2FD",
  },
  shoppingBadge: {
    backgroundColor: "#FFF3E0",
  },
  deliveringBadge: {
    backgroundColor: "#E8F5E8",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  acceptedText: {
    color: ColorPalette.primary[600],
  },
  shoppingText: {
    color: "#F57C00",
  },
  deliveringText: {
    color: "#4CAF50",
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  customerName: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
  },
  itemCount: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  startButton: {
    borderRadius: 8,
  },
  startButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ColorPalette.primary[500],
  },
  detailsButtonText: {
    color: ColorPalette.primary[500],
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default AcceptedOrdersScreen;
