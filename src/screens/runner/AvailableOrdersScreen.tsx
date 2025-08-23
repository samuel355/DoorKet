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
import { Text, Searchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

interface OrderCardProps {
  order: Order;
  index: number;
  isAccepting: boolean;
  onAccept: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
  calculateDistance: (order: Order) => string;
  formatCurrency: (amount: number) => string;
  formatTime: (dateString: string) => string;
  isUrgent: (dateString: string) => boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  index,
  isAccepting,
  onAccept,
  onViewDetails,
  calculateDistance,
  formatCurrency,
  formatTime,
  isUrgent,
}) => {
  const urgent = isUrgent(order.created_at);
  const distance = calculateDistance(order);

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
        onPress={() => onViewDetails(order.id)}
      >
        <LinearGradient
          colors={["#FFFFFF", "#FEFEFE"]}
          style={styles.orderCardGradient}
        >
          {urgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={14} color="#FFFFFF" />
              <Text style={styles.urgentBadgeText}>URGENT</Text>
            </View>
          )}

          <View style={styles.orderCardContent}>
            {/* Header */}
            <View style={styles.orderCardHeader}>
              <View style={styles.orderNumberContainer}>
                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                <Text style={styles.orderTime}>
                  {formatTime(order.created_at)}
                </Text>
              </View>
              <View style={styles.orderAmount}>
                <Text style={styles.orderAmountText}>
                  {formatCurrency(order.total_amount)}
                </Text>
              </View>
            </View>

            {/* Student Info */}
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Ionicons
                  name="person"
                  size={20}
                  color={ColorPalette.primary[500]}
                />
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>
                  {order.student?.full_name || "Unknown Student"}
                </Text>
                <Text style={styles.studentPhone}>
                  {(order.student as any)?.phone_number || "No phone"}
                </Text>
              </View>
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
                  {(order as any).items?.length || 0} items
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
              <View style={styles.orderDetailRow}>
                <Ionicons
                  name="navigate-outline"
                  size={16}
                  color={ColorPalette.neutral[600]}
                />
                <Text style={styles.orderDetailText}>~{distance} km away</Text>
              </View>
            </View>

            {/* Action Button */}
            <View style={styles.orderActions}>
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  isAccepting && styles.acceptButtonLoading,
                ]}
                onPress={() => onAccept(order.id)}
                disabled={isAccepting}
              >
                <LinearGradient
                  colors={
                    isAccepting
                      ? [ColorPalette.neutral[400], ColorPalette.neutral[500]]
                      : [ColorPalette.success[500], ColorPalette.success[600]]
                  }
                  style={styles.acceptButtonGradient}
                >
                  {isAccepting ? (
                    <Animated.View style={styles.loadingContainer}>
                      <View style={styles.loadingDot} />
                      <Text style={styles.acceptButtonText}>Accepting...</Text>
                    </Animated.View>
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      <Text style={styles.acceptButtonText}>Accept Order</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

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

type AvailableOrdersNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "AvailableOrders"
>;

interface AvailableOrdersProps {
  navigation: AvailableOrdersNavigationProp;
}

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 120;

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
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "urgent" | "nearby"
  >("all");

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
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
  }, []);

  const filterOrders = useCallback(() => {
    let filtered = orders;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.order_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.student?.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.delivery_address
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case "urgent":
        filtered = filtered.filter((order) => {
          const createdAt = new Date(order.created_at);
          const now = new Date();
          const hoursDiff =
            (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          return hoursDiff > 2;
        });
        break;
      case "nearby":
        // This would require location data - for now just show all
        break;
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, selectedFilter]);

  useEffect(() => {
    loadOrders();
    startAnimations();

    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders, startAnimations]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const acceptOrder = async (orderId: string) => {
    if (!user?.id) return;

    try {
      setAcceptingOrder(orderId);
      const result = await OrderService.acceptOrder(orderId, user.id);

      if (result.success) {
        Alert.alert(
          "Order Accepted! 🎉",
          "You've successfully accepted this order. Start shopping now?",
          [
            {
              text: "Later",
              style: "cancel",
            },
            {
              text: "Start Shopping",
              onPress: () => navigation.navigate("ShoppingList", { orderId }),
            },
          ],
        );
        loadOrders(); // Refresh the list
      } else {
        Alert.alert("Error", result.message || "Failed to accept order");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Accept order error:", error);
    } finally {
      setAcceptingOrder(null);
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

  const isUrgent = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours > 2;
  };

  const calculateDistance = (order: Order) => {
    // Mock distance calculation - in real app, use geolocation
    return (Math.random() * 5 + 0.5).toFixed(1);
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
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            ColorPalette.primary[500],
            ColorPalette.primary[600],
            ColorPalette.primary[700],
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
                <Text style={styles.headerTitle}>Available Orders</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredOrders.length} orders waiting
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

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <Animated.View
        style={[
          styles.searchBarContainer,
          {
            opacity: searchAnim,
            transform: [{ translateY: Animated.multiply(searchAnim, -20) }],
          },
        ]}
      >
        <Searchbar
          placeholder="Search orders, students, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={ColorPalette.neutral[600]}
          placeholderTextColor={ColorPalette.neutral[500]}
          elevation={0}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.filtersContainer,
          {
            opacity: filterAnim,
            transform: [{ translateY: Animated.multiply(filterAnim, -10) }],
          },
        ]}
      >
        {[
          { key: "all", label: "All Orders", icon: "list-outline" },
          { key: "urgent", label: "Urgent", icon: "time-outline" },
          { key: "nearby", label: "Nearby", icon: "location-outline" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <LinearGradient
              colors={
                selectedFilter === filter.key
                  ? [ColorPalette.primary[500], ColorPalette.primary[600]]
                  : ["#FFFFFF", "#FAFAFA"]
              }
              style={styles.filterButtonGradient}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={
                  selectedFilter === filter.key
                    ? "#FFFFFF"
                    : ColorPalette.neutral[600]
                }
              />
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key &&
                    styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );

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
          colors={[ColorPalette.primary[100], ColorPalette.primary[50]]}
          style={styles.emptyIconGradient}
        >
          <Ionicons
            name="bag-outline"
            size={48}
            color={ColorPalette.primary[500]}
          />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No Orders Available</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for new delivery opportunities
      </Text>
      <TouchableOpacity
        style={styles.refreshEmptyButton}
        onPress={() => {
          setIsRefreshing(true);
          loadOrders();
        }}
      >
        <LinearGradient
          colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
          style={styles.refreshEmptyButtonGradient}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.refreshEmptyButtonText}>Refresh</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

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
        {renderSearchAndFilters()}

        <AnimatedFlatList
          data={filteredOrders as any}
          keyExtractor={(item) => (item as Order).id}
          renderItem={({ item, index }) => (
            <OrderCard
              order={item as Order}
              index={index}
              isAccepting={acceptingOrder === (item as Order).id}
              onAccept={acceptOrder}
              onViewDetails={(orderId: string) =>
                navigation.navigate("OrderDetails", { orderId })
              }
              calculateDistance={calculateDistance}
              formatCurrency={formatCurrency}
              formatTime={formatTimeAgo}
              isUrgent={isUrgent}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[ColorPalette.primary[500]]}
              tintColor={ColorPalette.primary[500]}
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

  // Search and Filters
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 0,
    borderWidth: 1,
    borderColor: ColorPalette.neutral[200],
  },
  searchInput: {
    fontSize: 16,
    color: ColorPalette.neutral[900],
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  filterButtonActive: {},
  filterButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[600],
    marginLeft: 8,
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
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
    position: "relative",
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  urgentBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorPalette.error[500],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  orderCardContent: {},
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderNumberContainer: {},
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
  orderAmount: {
    alignItems: "flex-end",
  },
  orderAmountText: {
    fontSize: 20,
    fontWeight: "800",
    color: ColorPalette.success[600],
  },

  // Student Info
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: ColorPalette.primary[50],
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
  studentPhone: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },

  // Order Details
  orderDetails: {
    marginBottom: 20,
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

  // Order Actions
  orderActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  acceptButton: {
    flex: 1,
    marginRight: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  acceptButtonLoading: {
    opacity: 0.8,
  },
  acceptButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.primary[500],
    marginRight: 4,
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
  refreshEmptyButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  refreshEmptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshEmptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});

export default AvailableOrdersScreen;
