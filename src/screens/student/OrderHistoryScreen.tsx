import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Searchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";

import { Loading, EmptyState } from "../../components/common";
import { StudentStackParamList } from "@/types";
import { OrderService } from "@/services/supabase";
import { useAuth } from "@/store/authStore";
import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";
import { CommonActions } from "@react-navigation/native";

type OrderHistoryScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "OrderHistory"
>;

interface OrderHistoryScreenProps {
  navigation: OrderHistoryScreenNavigationProp;
}

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.25;

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadOrders();
    startAnimations();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, orders]);

  const startAnimations = useCallback(() => {
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
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
      ]),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, headerOpacity, cardScale, slideAnim, fadeAnim]);

  const loadOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await OrderService.getStudentOrders(user.id);
      if (error) {
        console.error("Error loading orders:", error);
        return;
      }
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const filterOrders = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order) =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const handleOrderPress = (order: Order) => {
    navigation.navigate("OrderTracking", { orderId: order.id });
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return ColorPalette.warning[500];
      case "accepted":
      case "shopping":
        return ColorPalette.info[500];
      case "delivering":
        return ColorPalette.accent[500];
      case "completed":
        return ColorPalette.success[500];
      case "cancelled":
        return ColorPalette.error[500];
      default:
        return ColorPalette.neutral[500];
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Finding Runner";
      case "accepted":
        return "Accepted";
      case "shopping":
        return "Shopping";
      case "delivering":
        return "On the Way";
      case "completed":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "accepted":
        return "checkmark-circle-outline";
      case "shopping":
        return "bag-outline";
      case "delivering":
        return "bicycle-outline";
      case "completed":
        return "checkmark-done-outline";
      case "cancelled":
        return "close-circle-outline";
      default:
        return "ellipse-outline";
    }
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={[
          ColorPalette.primary[600],
          ColorPalette.primary[500],
          ColorPalette.secondary[500],
          ColorPalette.accent[500],
        ]}
        locations={[0, 0.4, 0.7, 1]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating decorative elements */}
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            { transform: [{ translateY: floatY }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            { transform: [{ translateY: floatY }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            { transform: [{ translateY: floatY }] },
          ]}
        />

        <SafeAreaView style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.2)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                style={styles.headerButton}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>My Orders</Text>
              <Text style={styles.headerSubtitle}>
                {filteredOrders.length} orders found
              </Text>
            </View>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                // Could add filter/sort options here
              }}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.2)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                style={styles.headerButton}
              >
                <Ionicons name="filter-outline" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search orders..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              icon={() => (
                <Ionicons
                  name="search"
                  size={20}
                  color={ColorPalette.primary[500]}
                />
              )}
              iconColor={ColorPalette.primary[500]}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  const renderOrder = (order: Order, index: number) => (
    <Animated.View
      key={order.id}
      style={[
        styles.orderCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            {
              scale: cardScale.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity onPress={() => handleOrderPress(order)}>
        <LinearGradient
          colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
          style={styles.orderGradient}
        >
          <View style={styles.orderContent}>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>

              <LinearGradient
                colors={[
                  `${getOrderStatusColor(order.status)}20`,
                  `${getOrderStatusColor(order.status)}10`,
                ]}
                style={styles.statusContainer}
              >
                <Ionicons
                  name={getOrderStatusIcon(order.status) as any}
                  size={16}
                  color={getOrderStatusColor(order.status)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getOrderStatusColor(order.status) },
                  ]}
                >
                  {getOrderStatusText(order.status)}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.priceContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  GHS {order.total_amount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.orderMeta}>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={ColorPalette.neutral[500]}
                  />
                  <Text style={styles.metaText}>
                    {new Date(order.created_at).toLocaleTimeString()}
                  </Text>
                </View>

                {order.runner && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={ColorPalette.neutral[500]}
                    />
                    <Text style={styles.metaText}>
                      {order.runner.full_name}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.orderFooter}>
              <View style={styles.itemsInfo}>
                <Ionicons
                  name="bag-outline"
                  size={16}
                  color={ColorPalette.neutral[500]}
                />
                <Text style={styles.itemsText}>
                  {order.items?.length || 0} items
                </Text>
              </View>

              <View style={styles.actionArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={ColorPalette.primary[500]}
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
        style={styles.emptyCard}
      >
        <LinearGradient
          colors={[ColorPalette.neutral[100], ColorPalette.neutral[50]]}
          style={styles.emptyIcon}
        >
          <Ionicons
            name="receipt-outline"
            size={64}
            color={ColorPalette.neutral[400]}
          />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>
          Start shopping to see your orders here
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() =>
            navigation.dispatch(
              CommonActions.navigate({
                name: "HomeTab", // 👈 tab route name
                params: { screen: "Categories" }, // 👈 stack screen inside HomeTab
              })
            )
          }
        >
          <LinearGradient
            colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
            style={styles.emptyButtonGradient}
          >
            <Text style={styles.emptyButtonText}>Start Shopping</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return <Loading text="Loading orders..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ColorPalette.primary[600]}
      />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[ColorPalette.primary[500]]}
            tintColor={ColorPalette.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.ordersContainer}>
            {filteredOrders.map(renderOrder)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },

  // Header styles
  headerContainer: {
    height: HEADER_HEIGHT,
    position: "relative",
  },
  headerGradient: {
    flex: 1,
    paddingTop: 0,
  },
  floatingElement: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.full,
  },
  element1: {
    width: 60,
    height: 60,
    top: height * 0.08,
    left: width * 0.1,
  },
  element2: {
    width: 40,
    height: 40,
    top: height * 0.05,
    right: width * 0.15,
  },
  element3: {
    width: 80,
    height: 80,
    top: height * 0.12,
    right: width * 0.05,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
  },
  backButton: {},
  menuButton: {},
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: spacing.xs,
    textAlign: "center",
  },
  searchContainer: {
    marginTop: spacing.lg,
  },
  searchBar: {
    backgroundColor: ColorPalette.pure.white,
    elevation: 8,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    borderRadius: borderRadius.xl,
  },
  searchInput: {
    fontSize: 16,
    color: ColorPalette.neutral[700],
  },

  // Content styles
  scrollView: {
    flex: 1,
    marginTop: -spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl,
    paddingTop: spacing.xl,
  },

  // Orders container
  ordersContainer: {
    paddingHorizontal: spacing.lg,
  },
  orderCard: {
    marginBottom: spacing.md,
  },
  orderGradient: {
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  orderContent: {
    padding: spacing.lg,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  orderInfo: {},
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    marginBottom: spacing.md,
  },
  priceContainer: {
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
  },
  orderMeta: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  itemsText: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  actionArrow: {},

  // Empty state styles
  emptyContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxxl,
  },
  emptyCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxxl,
    alignItems: "center",
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  emptyButton: {
    marginTop: spacing.lg,
  },
  emptyButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.pure.white,
  },
});

export default OrderHistoryScreen;

export interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  runner?: {
    full_name: string;
  };
  items?: any[]; // Add the items property, adjust type as needed
  // other properties...
}
