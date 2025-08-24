import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
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
  onAccept: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
  formatCurrency: (amount: number) => string;
  formatTime: (dateString: string) => string;
  getDistanceText: (order: Order) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  index,
  onAccept,
  onViewDetails,
  formatCurrency,
  formatTime,
  getDistanceText,
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
        style={styles.cardContainer}
        onPress={() => onViewDetails(order.id)}
        activeOpacity={0.9}
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
            <View style={styles.urgencyBadge}>
              <Ionicons name="time-outline" size={14} color="#FF6B35" />
              <Text style={styles.urgencyText}>New</Text>
            </View>
          </View>

          <View style={styles.customerInfo}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.customerName}>
              {(order as any).student?.full_name || "Customer"}
            </Text>
            <View style={styles.distanceBadge}>
              <Ionicons name="location-outline" size={12} color="#4CAF50" />
              <Text style={styles.distanceText}>{getDistanceText(order)}</Text>
            </View>
          </View>

          <View style={styles.locationInfo}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.locationText} numberOfLines={2}>
              {order.delivery_address || "Delivery address"}
            </Text>
          </View>

          <View style={styles.orderSummary}>
            <Text style={styles.itemsText}>
              {(order as any).items?.length || 0} items
            </Text>
            <View style={styles.separator} />
            <Text style={styles.estimatedTime}>Est. 30 min</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>You&apos;ll earn</Text>
              <Text style={styles.earningsAmount}>
                {formatCurrency(order.delivery_fee || 5.0)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAccept(order.id)}
            >
              <LinearGradient
                colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
                style={styles.acceptButtonGradient}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

type AvailableOrdersNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "AvailableOrders"
>;

interface AvailableOrdersProps {
  navigation: AvailableOrdersNavigationProp;
}

const AvailableOrdersScreen: React.FC<AvailableOrdersProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "nearby" | "high-pay"
  >("all");

  // Animation refs
  const searchAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = useCallback(() => {
    Animated.stagger(200, [
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(filterAnim, {
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
  }, [searchAnim, filterAnim, listAnim]);

  const loadOrders = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await OrderService.getAvailableOrders();
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
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getDistanceText = (order: Order): string => {
    // This would normally calculate actual distance
    const distances = ["0.5 mi", "0.8 mi", "1.2 mi", "0.3 mi", "1.5 mi"];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const result = await OrderService.acceptOrder(orderId, user!.id);
      if (result.data) {
        Alert.alert(
          "Order Accepted! 🎉",
          "You've successfully accepted this order. Start shopping now!",
          [
            {
              text: "View Orders",
              onPress: () => navigation.navigate("AcceptedOrders"),
            },
          ],
        );
        loadOrders(); // Refresh the list
      }
    } catch {
      Alert.alert("Error", "Failed to accept order. Please try again.");
    }
  };

  const handleViewDetails = (orderId: string) => {
    navigation.navigate("OrderDetails", { orderId });
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.order_number
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (order as any).student?.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.delivery_address
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case "nearby":
        // This would normally filter by actual distance
        filtered = filtered.slice(0, Math.ceil(filtered.length * 0.6));
        break;
      case "high-pay":
        filtered = filtered.filter((order) => (order.delivery_fee || 5) >= 8);
        break;
      default:
        break;
    }

    return filtered;
  };

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <Animated.View
        style={[
          styles.searchBar,
          {
            opacity: searchAnim,
            transform: [{ translateY: Animated.multiply(searchAnim, -20) }],
          },
        ]}
      >
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.filtersContainer,
          {
            opacity: filterAnim,
            transform: [{ translateY: Animated.multiply(filterAnim, -20) }],
          },
        ]}
      >
        {[
          { key: "all", label: "All Orders", icon: "grid-outline" },
          { key: "nearby", label: "Nearby", icon: "location-outline" },
          { key: "high-pay", label: "High Pay", icon: "diamond-outline" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={
                selectedFilter === filter.key
                  ? "#FFFFFF"
                  : ColorPalette.primary[500]
              }
            />
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.activeFilterChipText,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="basket-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>No Orders Available</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery.trim()
          ? "No orders match your search criteria."
          : "Check back later for new delivery opportunities!"}
      </Text>
      {searchQuery.trim() && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchQuery("")}
        >
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const filteredOrders = getFilteredOrders();

  return (
    <SafeAreaView style={styles.container}>
      <RunnerHeader
        title="Available Orders"
        subtitle={`${filteredOrders.length} orders waiting`}
        onBack={() => navigation.goBack()}
        onRefresh={loadOrders}
        isRefreshing={isRefreshing}
        gradientColors={[
          ColorPalette.primary[500],
          ColorPalette.primary[600],
          ColorPalette.primary[700],
        ]}
      />

      {renderSearchAndFilters()}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: listAnim,
            transform: [{ translateY: Animated.multiply(listAnim, -20) }],
          },
        ]}
      >
        <AnimatedFlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <OrderCard
              order={item as Order}
              index={index}
              onAccept={handleAcceptOrder}
              onViewDetails={handleViewDetails}
              formatCurrency={formatCurrency}
              formatTime={formatTime}
              getDistanceText={getDistanceText}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F4F8",
    borderWidth: 1,
    borderColor: ColorPalette.primary[200],
  },
  activeFilterChip: {
    backgroundColor: ColorPalette.primary[500],
    borderColor: ColorPalette.primary[500],
  },
  filterChipText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.primary[500],
  },
  activeFilterChipText: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    marginBottom: 16,
  },
  cardContainer: {
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
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
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
    flex: 1,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666666",
    flex: 1,
    lineHeight: 18,
  },
  orderSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  itemsText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCCCCC",
    marginHorizontal: 12,
  },
  estimatedTime: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 14,
    color: "#666666",
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 2,
  },
  acceptButton: {
    borderRadius: 8,
  },
  acceptButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
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
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: ColorPalette.primary[500],
    borderRadius: 8,
  },
  clearSearchText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AvailableOrdersScreen;
