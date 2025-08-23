import { useAuth } from "@/store/authStore";
import { Category, Order, StudentStackParamList, Item } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Image,
} from "react-native";
import { Searchbar, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";
import { ItemService } from "@/services/itemService";
import { OrderService } from "@/services/orderService";
import { useCartActions } from "@/store/cartStore";

type HomeScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Home"
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2;
const HEADER_HEIGHT = height * 0.25; // Reduced from 0.28 to prevent overlap

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { addItem } = useCartActions();

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStickyCategories, setShowStickyCategories] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const stickyOpacity = useRef(new Animated.Value(0)).current;
  const stickyTranslateY = useRef(new Animated.Value(-50)).current;

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = useCallback(() => {
    // Stagger animations for smooth entrance
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

    // Floating animation for decorative elements
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
      ]),
    ).start();
  }, [floatAnim, headerOpacity, cardScale, slideAnim, fadeAnim]);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await ItemService.getCategories();
      if (error) {
        console.error("Error loading categories:", {
          message: error,
          details: error,
        });
        // Optionally show user-friendly error message
        // Alert.alert("Error", "Unable to load categories. Please try again.");
        return;
      }

      if (!data) {
        console.warn("No categories data received");
        setCategories([]);
        return;
      }

      setCategories(data);
    } catch (error) {
      console.error("Unexpected error loading categories:", {
        message: error instanceof Error ? error.message : "Unknown error",
        error,
      });
      // Optionally show user-friendly error message
      // Alert.alert("Error", "Something went wrong. Please try again.");
      setCategories([]);
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const { data, error } = await ItemService.getAllItems(20); // Load first 20 items
      if (error) {
        console.error("Error loading items:", error);
        return;
      }
      setItems(data || []);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  }, []);

  const loadRecentOrders = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await OrderService.getStudentOrders(user.id);
      if (error) {
        console.error("Error loading recent orders:", error);
        return;
      }
      setRecentOrders((data || []).slice(0, 2));
    } catch (error) {
      console.error("Error loading recent orders:", error);
    }
  }, [user]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadCategories(), loadItems(), loadRecentOrders()]);
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadCategories, loadItems, loadRecentOrders]);

  useEffect(() => {
    const loadAndAnimate = async () => {
      await loadInitialData();
      startAnimations();
    };
    loadAndAnimate();
  }, [loadInitialData, startAnimations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Show sticky categories when scrolling past the quick actions and categories sections
    const shouldShow = offsetY > 200;
    if (shouldShow !== showStickyCategories) {
      setShowStickyCategories(shouldShow);
      Animated.parallel([
        Animated.timing(stickyOpacity, {
          toValue: shouldShow ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(stickyTranslateY, {
          toValue: shouldShow ? 0 : -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
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

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const getFilteredItems = () => {
    if (selectedCategory) {
      return items.filter(item => item.category_id === selectedCategory);
    }
    return items;
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

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { opacity: headerOpacity, zIndex: 100  }]}>
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

        <SafeAreaView style={[styles.headerContent]}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {profile?.full_name || "Student"}!
              </Text>
              {profile?.hall_hostel && (
                <Text style={styles.location}>
                  {profile.hall_hostel}
                  {profile.room_number ? ` - Room ${profile.room_number}` : ""}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("Notifications")}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.2)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                style={styles.notificationGradient}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#ffffff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search for items..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              onSubmitEditing={handleSearch}
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

  const renderQuickActions = () => (
    <Animated.View
      style={[
        styles.quickActionsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: cardScale }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("CartTab")}
        >
          <LinearGradient
            colors={[ColorPalette.primary[100], ColorPalette.primary[50]]}
            style={styles.quickActionGradient}
          >
            <Ionicons
              name="basket"
              size={24}
              color={ColorPalette.primary[600]}
            />
          </LinearGradient>
          <Text style={styles.quickActionText}>My Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("OrdersTab")}
        >
          <LinearGradient
            colors={[ColorPalette.success[100], ColorPalette.success[50]]}
            style={styles.quickActionGradient}
          >
            <Ionicons
              name="receipt"
              size={24}
              color={ColorPalette.success[600]}
            />
          </LinearGradient>
          <Text style={styles.quickActionText}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Categories")}
        >
          <LinearGradient
            colors={[ColorPalette.accent[100], ColorPalette.accent[50]]}
            style={styles.quickActionGradient}
          >
            <Ionicons name="grid" size={24} color={ColorPalette.accent[600]} />
          </LinearGradient>
          <Text style={styles.quickActionText}>Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("ProfileTab")}
        >
          <LinearGradient
            colors={[ColorPalette.secondary[100], ColorPalette.secondary[50]]}
            style={styles.quickActionGradient}
          >
            <Ionicons
              name="person"
              size={24}
              color={ColorPalette.secondary[600]}
            />
          </LinearGradient>
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStickyCategories = () => (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: HEADER_HEIGHT,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: ColorPalette.pure.white,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: ColorPalette.neutral[100],
          elevation: 3,
          shadowColor: "rgba(0, 0, 0, 0.1)",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          opacity: stickyOpacity,
          transform: [{ translateY: stickyTranslateY }],
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      >
        <TouchableOpacity
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginRight: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: !selectedCategory ? ColorPalette.primary[500] : ColorPalette.neutral[100],
            borderWidth: 1,
            borderColor: !selectedCategory ? ColorPalette.primary[500] : ColorPalette.neutral[200],
          }}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: !selectedCategory ? "600" : "500",
              color: !selectedCategory ? ColorPalette.pure.white : ColorPalette.neutral[600],
            }}
          >
            All Items
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              marginRight: spacing.sm,
              borderRadius: borderRadius.full,
              backgroundColor: selectedCategory === category.id ? ColorPalette.primary[500] : ColorPalette.neutral[100],
              borderWidth: 1,
              borderColor: selectedCategory === category.id ? ColorPalette.primary[500] : ColorPalette.neutral[200],
            }}
            onPress={() => handleCategorySelect(category.id)}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: selectedCategory === category.id ? "600" : "500",
                color: selectedCategory === category.id ? ColorPalette.pure.white : ColorPalette.neutral[600],
              }}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderCategories = () => (
    <Animated.View
      style={[
        styles.categoriesContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Categories")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categories.slice(0, 6).map((category, index) => (
          <Animated.View
            key={category.id}
            style={[
              styles.categoryCard,
              {
                transform: [
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
            <TouchableOpacity onPress={() => handleCategoryPress(category)}>
              <LinearGradient
                colors={[
                  `${category.color_code || ColorPalette.primary[500]}20`,
                  `${category.color_code || ColorPalette.primary[500]}10`,
                ]}
                style={styles.categoryGradient}
              >
                <View style={styles.categoryContent}>
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor: `${category.color_code || ColorPalette.primary[500]}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={(category.icon_name as any) || "basket"}
                      size={28}
                      color={category.color_code || ColorPalette.primary[500]}
                    />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.name}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderItems = () => {
    const filteredItems = getFilteredItems();
    
    if (filteredItems.length === 0) {
      return (
        <Animated.View
          style={[
            {
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.lg, // Reduced margin
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={{ alignItems: "center", paddingVertical: spacing.xxxxl }}>
            <Ionicons
              name="basket-outline"
              size={48}
              color={ColorPalette.neutral[400]}
            />
            <Text style={{ fontSize: 16, color: ColorPalette.neutral[500], textAlign: "center", marginTop: spacing.md }}>
              {selectedCategory 
                ? "No items found in this category" 
                : "No items available at the moment"}
            </Text>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          {
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg, // Reduced margin
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name || "Items"
              : "All Items"}
          </Text>
          <Text style={{ fontSize: 14, color: ColorPalette.neutral[500], fontWeight: "500" }}>
            {filteredItems.length} items
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                width: (width - spacing.lg * 3) / 2,
                marginBottom: spacing.md,
              }}
              onPress={() => navigation.navigate("ItemDetails", { itemId: item.id })}
            >
              <LinearGradient
                colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
                style={{
                  borderRadius: borderRadius.lg,
                  elevation: 2, // Reduced elevation
                  shadowColor: "rgba(0, 0, 0, 0.08)", // Lighter shadow
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 1,
                  shadowRadius: 4,
                  overflow: "hidden",
                }}
              >
                <View style={{
                  height: 120,
                  backgroundColor: ColorPalette.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  {item.image_url ? (
                    <Image 
                      source={{ uri: item.image_url }} 
                      style={{
                        width: "100%",
                        height: "100%",
                        resizeMode: "cover",
                      }} 
                    />
                  ) : (
                    <View style={{
                      width: "100%",
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: ColorPalette.neutral[100],
                    }}>
                      <Ionicons
                        name="image-outline"
                        size={32}
                        color={ColorPalette.neutral[400]}
                      />
                    </View>
                  )}
                </View>
                <View style={{ padding: spacing.md }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: ColorPalette.neutral[800],
                    marginBottom: spacing.xs,
                    lineHeight: 18,
                  }} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: ColorPalette.neutral[500],
                    marginBottom: spacing.sm,
                  }}>
                    {item.category?.name || "Unknown Category"}
                  </Text>
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: ColorPalette.primary[600],
                    }}>
                      GHS {item.base_price?.toFixed(2) || "N/A"}
                    </Text>
                    <TouchableOpacity
                      style={{ padding: spacing.xs }}
                      onPress={() => {
                        if (item.base_price && item.base_price > 0) {
                          addItem(item, 1);
                        }
                      }}
                    >
                      <Ionicons
                        name="add-circle"
                        size={20}
                        color={ColorPalette.primary[500]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderRecentOrders = () => {
    if (recentOrders.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.recentOrdersContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate("OrderHistory")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => handleOrderPress(order)}
          >
            <LinearGradient
              colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
              style={styles.orderCard}
            >
              <View style={styles.orderContent}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <LinearGradient
                    colors={[
                      `${getOrderStatusColor(order.status)}20`,
                      `${getOrderStatusColor(order.status)}10`,
                    ]}
                    style={styles.orderStatus}
                  >
                    <Text
                      style={[
                        styles.orderStatusText,
                        { color: getOrderStatusColor(order.status) },
                      ]}
                    >
                      {getOrderStatusText(order.status)}
                    </Text>
                  </LinearGradient>
                </View>
                <Text style={styles.orderAmount}>
                  GHS {order.total_amount.toFixed(2)}
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ColorPalette.primary[600]}
      />

      {renderHeader()}

      {renderStickyCategories()}
      <FlatList
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ColorPalette.primary[500]]}
            tintColor={ColorPalette.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
        data={[{ id: 'content' }]}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <View>
            {renderQuickActions()}
            {renderCategories()}
            {renderItems()}
            {renderRecentOrders()}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50], // Keep original background
  },
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: spacing.md,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  location: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
    fontWeight: "500",
  },
  notificationButton: {
    marginTop: spacing.sm,
  },
  notificationGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
  scrollView: {
    flex: 1,
    marginTop: -spacing.lg, // Reduced negative margin to prevent overlap
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl,
    paddingTop: spacing.lg, // Reduced top padding
  },
  quickActionsContainer: {
    backgroundColor: ColorPalette.pure.white,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg, // Reduced margin
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    marginTop: 8 // Reduced top margin
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
    width: (width - 120) / 4,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: ColorPalette.neutral[700],
    textAlign: "center",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18, // Slightly smaller
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.md, // Reduced margin
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md, // Reduced margin
    paddingTop: spacing.sm, // Added top padding
  },
  viewAllText: {
    fontSize: 14,
    color: ColorPalette.primary[600],
    fontWeight: "600",
  },
  categoriesContainer: {
    marginBottom: spacing.lg, // Reduced margin for better spacing
  },
  categoriesScroll: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },

  categoryCard: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
  },
  categoryGradient: {
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  categoryContent: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[700],
    textAlign: "center",
    lineHeight: 18,
  },
  recentOrdersContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm, // Added top margin for better separation
  },
  orderCard: {
    marginBottom: spacing.md,
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
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
  },
  orderStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
    fontWeight: "500",
  },
});

export default HomeScreen;