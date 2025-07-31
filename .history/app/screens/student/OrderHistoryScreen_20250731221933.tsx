import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Button, Chip, Searchbar, FAB } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Loading, EmptyState, ErrorState } from "../../components/common";
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  ORDER_STATUS_CONFIG,
} from "../../constants";
import { useAuth } from "@/store/authStore";
import { Order, OrderStatus } from "@/types";
import { SupabaseService } from "@/services/supabase";

interface OrderHistoryScreenProps {
  navigation: any;
}

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | "all">(
    "all",
  );

  // Filter options
  const filterOptions = [
    { id: "all", label: "All Orders", icon: "list" },
    { id: "pending", label: "Pending", icon: "time" },
    { id: "accepted", label: "Accepted", icon: "checkmark-circle" },
    { id: "shopping", label: "Shopping", icon: "basket" },
    { id: "delivering", label: "Delivering", icon: "car" },
    { id: "completed", label: "Completed", icon: "checkmark-done" },
    { id: "cancelled", label: "Cancelled", icon: "close-circle" },
  ];

  // Load orders
  const loadOrders = useCallback(
    async (showRefreshing = false) => {
      if (!user) return;

      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const { data, error } = await SupabaseService.getStudentOrders(user.id);

        if (error) {
          throw new Error(error);
        }

        setOrders(data || []);
        setFilteredOrders(data || []);
      } catch (err: any) {
        console.error("Error loading orders:", err);
        setError(err.message || "Failed to load order history");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  // Filter orders
  const filterOrders = useCallback(() => {
    let filtered = [...orders];

    // Filter by status
    if (selectedFilter !== "all") {
      filtered = filtered.filter((order) => order.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.delivery_address.toLowerCase().includes(query) ||
          order.runner?.full_name?.toLowerCase().includes(query),
      );
    }

    setFilteredOrders(filtered);
  }, [orders, selectedFilter, searchQuery]);

  // Handle order press
  const handleOrderPress = (order: Order) => {
    navigation.navigate("OrderTracking", { orderId: order.id });
  };

  // Handle reorder
  const handleReorder = (order: Order) => {
    // This would typically add all items from the order back to cart
    navigation.navigate("Cart");
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Format time
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Effects
  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  // Render filter chip
  const renderFilterChip = ({
    item: filter,
  }: {
    item: (typeof filterOptions)[0];
  }) => (
    <Chip
      key={filter.id}
      selected={selectedFilter === filter.id}
      onPress={() => setSelectedFilter(filter.id as any)}
      icon={filter.icon}
      style={[
        styles.filterChip,
        selectedFilter === filter.id && styles.selectedFilterChip,
      ]}
      textStyle={[
        styles.filterChipText,
        selectedFilter === filter.id && styles.selectedFilterChipText,
      ]}
    >
      {filter.label}
    </Chip>
  );

  // Render order item
  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const statusConfig = ORDER_STATUS_CONFIG[order.status];
    const itemCount = order.order_items?.length || 0;

    return (
      <TouchableOpacity onPress={() => handleOrderPress(order)}>
        <Card style={styles.orderCard}>
          <Card.Content style={styles.orderContent}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                <Text style={styles.orderDate}>
                  {formatDate(order.created_at)} at{" "}
                  {formatTime(order.created_at)}
                </Text>
              </View>
              <Chip
                icon={statusConfig.icon}
                style={[
                  styles.statusChip,
                  { backgroundColor: statusConfig.color + "20" },
                ]}
                textStyle={[
                  styles.statusChipText,
                  { color: statusConfig.color },
                ]}
              >
                {statusConfig.label}
              </Chip>
            </View>

            {/* Order Details */}
            <View style={styles.orderDetails}>
              <View style={styles.orderDetailRow}>
                <Ionicons
                  name="basket"
                  size={16}
                  color={COLORS.TEXT_SECONDARY}
                />
                <Text style={styles.orderDetailText}>
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </Text>
              </View>

              <View style={styles.orderDetailRow}>
                <Ionicons
                  name="location"
                  size={16}
                  color={COLORS.TEXT_SECONDARY}
                />
                <Text style={styles.orderDetailText} numberOfLines={1}>
                  {order.delivery_address}
                </Text>
              </View>

              {order.runner && (
                <View style={styles.orderDetailRow}>
                  <Ionicons
                    name="person"
                    size={16}
                    color={COLORS.TEXT_SECONDARY}
                  />
                  <Text style={styles.orderDetailText}>
                    Runner: {order.runner.full_name}
                  </Text>
                </View>
              )}
            </View>

            {/* Order Footer */}
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>
                GHS {order.total_amount.toFixed(2)}
              </Text>
              <View style={styles.orderActions}>
                {order.status === "completed" && (
                  <Button
                    mode="text"
                    onPress={() => handleReorder(order)}
                    style={styles.reorderButton}
                    compact
                  >
                    Reorder
                  </Button>
                )}
                <Button
                  mode="outlined"
                  onPress={() => handleOrderPress(order)}
                  style={styles.viewButton}
                  compact
                >
                  {order.status === "completed" || order.status === "cancelled"
                    ? "View"
                    : "Track"}
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return <Loading text="Loading order history..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Unable to Load Orders"
        subtitle={error}
        actionText="Retry"
        onActionPress={() => loadOrders()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filterOptions}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Orders Found"
            message={
              searchQuery.trim()
                ? `No orders match "${searchQuery}"`
                : selectedFilter === "all"
                  ? "You haven't placed any orders yet"
                  : `No ${filterOptions.find((f) => f.id === selectedFilter)?.label.toLowerCase()} orders`
            }
            icon="receipt-outline"
            actionTitle={
              searchQuery.trim() || selectedFilter !== "all"
                ? "Clear Filters"
                : "Start Shopping"
            }
            onAction={() => {
              if (searchQuery.trim() || selectedFilter !== "all") {
                setSearchQuery("");
                setSelectedFilter("all");
              } else {
                navigation.navigate("Home");
              }
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("Home")}
        label="New Order"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  searchContainer: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
  },
  searchInput: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  filtersContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  filtersContent: {
    paddingHorizontal: SPACING.LG,
  },
  filterChip: {
    marginRight: SPACING.SM,
    backgroundColor: COLORS.GRAY_100,
    borderColor: COLORS.BORDER,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  filterChipText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONTS.SIZE.SM,
  },
  selectedFilterChipText: {
    color: COLORS.PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  listContent: {
    padding: SPACING.LG,
    flexGrow: 1,
    paddingBottom: 100, // Space for FAB
  },
  orderCard: {
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
    backgroundColor: COLORS.WHITE,
  },
  orderContent: {
    padding: SPACING.MD,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.MD,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  orderDate: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  statusChip: {
    height: 32,
    marginLeft: SPACING.SM,
  },
  statusChipText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  orderDetails: {
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  orderDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDetailText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
    flex: 1,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
  },
  orderTotal: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  orderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SM,
  },
  reorderButton: {
    minWidth: 80,
  },
  viewButton: {
    minWidth: 80,
  },
  fab: {
    position: "absolute",
    margin: SPACING.LG,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
  },
});

export default OrderHistoryScreen;
