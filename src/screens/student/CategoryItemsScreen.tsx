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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Searchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

import { Loading, EmptyState } from "../../components/common";
import { Item, StudentStackParamList } from "@/types";
import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";
import { ItemService } from "@/services/itemService";

type CategoryItemsScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "CategoryItems"
>;

type CategoryItemsScreenRouteProp = RouteProp<
  StudentStackParamList,
  "CategoryItems"
>;

interface CategoryItemsScreenProps {
  navigation: CategoryItemsScreenNavigationProp;
  route: CategoryItemsScreenRouteProp;
}

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.25;
const ITEM_WIDTH = (width - 60) / 2;

const CategoryItemsScreen: React.FC<CategoryItemsScreenProps> = ({
  navigation,
  route,
}) => {
  const { categoryId, categoryName } = route.params;
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
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
    loadCategoryItems();
    startAnimations();
  }, [categoryId]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items]);

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
      ]),
    ).start();
  }, [floatAnim, headerOpacity, cardScale, slideAnim, fadeAnim]);

  const loadCategoryItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await ItemService.getItemsByCategory(categoryId);
      if (error) {
        console.error("Error loading category items:", error);
        return;
      }
      setItems(data || []);
    } catch (error) {
      console.error("Error loading category items:", error);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const filterItems = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategoryItems();
    setRefreshing(false);
  }, [loadCategoryItems]);

  const handleItemPress = (item: Item) => {
    navigation.navigate("ItemDetails", { itemId: item.id });
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
              <Text style={styles.headerTitle}>{categoryName}</Text>
              <Text style={styles.headerSubtitle}>
                {filteredItems.length} items available
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
                <Ionicons name="grid-outline" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search items..."
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

  const renderItem = (item: Item, index: number) => (
    <Animated.View
      key={item.id}
      style={[
        styles.itemCard,
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
      <TouchableOpacity onPress={() => handleItemPress(item)}>
        <LinearGradient
          colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
          style={styles.itemGradient}
        >
          <View style={styles.itemImageContainer}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.itemImage}
              />
            ) : (
              <LinearGradient
                colors={[ColorPalette.neutral[100], ColorPalette.neutral[50]]}
                style={styles.imagePlaceholder}
              >
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={ColorPalette.neutral[400]}
                />
              </LinearGradient>
            )}

            {item.is_available ? (
              <View style={styles.availableBadge}>
                <LinearGradient
                  colors={[
                    ColorPalette.success[500],
                    ColorPalette.success[600],
                  ]}
                  style={styles.badgeGradient}
                >
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.unavailableBadge}>
                <LinearGradient
                  colors={[ColorPalette.error[500], ColorPalette.error[600]]}
                  style={styles.badgeGradient}
                >
                  <Ionicons name="close" size={12} color="#ffffff" />
                </LinearGradient>
              </View>
            )}
          </View>

          <View style={styles.itemContent}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>

            {item.description && (
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.itemFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.itemPrice}>
                  GHS {item.base_price ? item.base_price.toFixed(2) : "0.00"}
                </Text>
              </View>

              {item.unit && (
                <View style={styles.unitContainer}>
                  <Text style={styles.unitLabel}>Unit</Text>
                  <Text style={styles.itemUnit}>{item.unit}</Text>
                </View>
              )}
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => {
                  // Add to cart functionality
                  console.log("Add to cart:", item.id);
                }}
              >
                <LinearGradient
                  colors={[
                    ColorPalette.primary[500],
                    ColorPalette.primary[600],
                  ]}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                  <Text style={styles.addButtonText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => handleItemPress(item)}
              >
                <LinearGradient
                  colors={[ColorPalette.neutral[100], ColorPalette.neutral[50]]}
                  style={styles.viewButtonGradient}
                >
                  <Ionicons
                    name="eye-outline"
                    size={16}
                    color={ColorPalette.neutral[600]}
                  />
                </LinearGradient>
              </TouchableOpacity>
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
            name="bag-outline"
            size={64}
            color={ColorPalette.neutral[400]}
          />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No items found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? "Try adjusting your search terms"
            : "This category doesn't have any items yet"}
        </Text>
        {!searchQuery && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("Categories")}
          >
            <LinearGradient
              colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
              style={styles.emptyButtonGradient}
            >
              <Text style={styles.emptyButtonText}>Browse Categories</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return <Loading text="Loading items..." />;
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
        {filteredItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.itemsGrid}>
            {filteredItems.map((item, index) => (
              <View key={item.id} style={styles.itemWrapper}>
                {renderItem(item, index)}
              </View>
            ))}
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

  // Items grid
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  itemWrapper: {
    width: ITEM_WIDTH,
    marginBottom: spacing.lg,
  },
  itemCard: { marginTop: spacing.lg },
  itemGradient: {
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  itemImageContainer: {
    position: "relative",
    height: 140,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  availableBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
  },
  unavailableBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
  },
  badgeGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    padding: spacing.md,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  itemDescription: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  itemFooter: {
    marginBottom: spacing.sm,
  },
  priceContainer: {
    marginBottom: spacing.xs,
  },
  priceLabel: {
    fontSize: 10,
    color: ColorPalette.neutral[500],
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
  },
  unitContainer: {},
  unitLabel: {
    fontSize: 10,
    color: ColorPalette.neutral[500],
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  addToCartButton: {
    flex: 1,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: ColorPalette.pure.white,
  },
  viewButton: {},
  viewButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

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

export default CategoryItemsScreen;
