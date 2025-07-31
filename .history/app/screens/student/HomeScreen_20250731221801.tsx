import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Searchbar,
  Surface,
  useTheme,
  Avatar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { Category, Order, StudentStackParamList } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/supabase";

type HomeScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Home"
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user, profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadCategories(), loadRecentOrders()]);
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await ItemService.getCategories();
      if (error) {
        console.error("Error loading categories:", error);
        return;
      }
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadRecentOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await OrderService.getStudentOrders(user.id);
      if (error) {
        console.error("Error loading recent orders:", error);
        return;
      }
      // Get only the 2 most recent orders
      setRecentOrders((data || []).slice(0, 2));
    } catch (error) {
      console.error("Error loading recent orders:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search results or categories with search
      navigation.navigate("Categories");
    }
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate("CategoryItems", {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate("OrderTracking", { orderId: order.id });
  };

  const handleViewAllCategories = () => {
    navigation.navigate("Categories");
  };

  const handleViewAllOrders = () => {
    navigation.navigate("OrderHistory");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "accepted":
      case "shopping":
        return "#2196F3";
      case "delivering":
        return "#9C27B0";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#f44336";
      default:
        return "#666666";
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.userName}>{profile?.full_name || "Student"}!</Text>
        {profile?.hall_hostel && (
          <Text style={styles.location}>
            {profile.hall_hostel}{" "}
            {profile.room_number ? `- Room ${profile.room_number}` : ""}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => navigation.navigate("Notifications")}
      >
        <Ionicons name="notifications-outline" size={24} color="#333333" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <Searchbar
      placeholder="Search for items..."
      onChangeText={setSearchQuery}
      value={searchQuery}
      onSubmitEditing={handleSearch}
      style={styles.searchBar}
      inputStyle={styles.searchInput}
      icon={() => <Ionicons name="search" size={20} color="#666666" />}
    />
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Cart")}
        >
          <Surface
            style={[styles.quickActionSurface, { backgroundColor: "#e3f2fd" }]}
          >
            <Ionicons name="basket" size={24} color="#2196F3" />
          </Surface>
          <Text style={styles.quickActionText}>My Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={handleViewAllOrders}
        >
          <Surface
            style={[styles.quickActionSurface, { backgroundColor: "#e8f5e8" }]}
          >
            <Ionicons name="receipt" size={24} color="#4CAF50" />
          </Surface>
          <Text style={styles.quickActionText}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Categories")}
        >
          <Surface
            style={[styles.quickActionSurface, { backgroundColor: "#fff3e0" }]}
          >
            <Ionicons name="grid" size={24} color="#FF9800" />
          </Surface>
          <Text style={styles.quickActionText}>Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Profile")}
        >
          <Surface
            style={[styles.quickActionSurface, { backgroundColor: "#f3e5f5" }]}
          >
            <Ionicons name="person" size={24} color="#9C27B0" />
          </Surface>
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity onPress={handleViewAllCategories}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categories.slice(0, 6).map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
          >
            <Card style={styles.categoryCardInner}>
              <Card.Content style={styles.categoryContent}>
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: `${category.color_code || "#2196F3"}15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={(category.icon_name as any) || "basket"}
                    size={24}
                    color={category.color_code || "#2196F3"}
                  />
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {category.name}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRecentOrders = () => {
    if (recentOrders.length === 0) return null;

    return (
      <View style={styles.recentOrdersContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={handleViewAllOrders}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => handleOrderPress(order)}
          >
            <Card style={styles.orderCard}>
              <Card.Content style={styles.orderContent}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <View
                    style={[
                      styles.orderStatus,
                      {
                        backgroundColor: `${getOrderStatusColor(order.status)}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderStatusText,
                        { color: getOrderStatusColor(order.status) },
                      ]}
                    >
                      {getOrderStatusText(order.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderAmount}>
                  GHS {order.total_amount.toFixed(2)}
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderSearchBar()}
        {renderQuickActions()}
        {renderCategories()}
        {renderRecentOrders()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#666666",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 24,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
    width: (width - 80) / 4,
  },
  quickActionSurface: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: "#333333",
    textAlign: "center",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoryCard: {
    width: CARD_WIDTH,
    marginRight: 12,
  },
  categoryCardInner: {
    elevation: 2,
  },
  categoryContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
  },
  recentOrdersContainer: {
    paddingHorizontal: 20,
  },
  orderCard: {
    marginBottom: 12,
    elevation: 2,
  },
  orderContent: {
    paddingVertical: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#666666",
  },
});

export default HomeScreen;
