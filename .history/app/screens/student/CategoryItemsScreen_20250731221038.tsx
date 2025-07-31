import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Searchbar,
  Card,
  Button,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { EmptyState, ErrorState, Loading } from "../../components/common";
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from "../../constants";

interface CategoryItemsScreenProps {
  navigation: any;
  route: {
    params: {
      categoryId: string;
      categoryName: string;
    };
  };
}

const CategoryItemsScreen: React.FC<CategoryItemsScreenProps> = ({
  navigation,
  route,
}) => {
  const { categoryId, categoryName } = route.params;
  const { addItem, loading: cartLoading } = useCart();

  // State
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [category, setCategory] = useState<Category | null>(null);

  // Filter options
  const filterOptions = [
    { id: "price_low", label: "Low Price", icon: "trending-down" },
    { id: "price_high", label: "High Price", icon: "trending-up" },
    { id: "name_az", label: "A-Z", icon: "text" },
    { id: "name_za", label: "Z-A", icon: "text" },
  ];

  // Load items
  const loadItems = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const { data, error } =
          await SupabaseService.getItemsByCategory(categoryId);

        if (error) {
          throw new Error(error);
        }

        setItems(data || []);
        setFilteredItems(data || []);

        // Get category info if we have items
        if (data && data.length > 0 && data[0].category) {
          setCategory(data[0].category);
        }
      } catch (err: any) {
        console.error("Error loading items:", err);
        setError(err.message || "Failed to load items");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [categoryId],
  );

  // Filter and search items
  const filterItems = useCallback(() => {
    let filtered = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      );
    }

    // Sort filters
    if (selectedFilters.includes("price_low")) {
      filtered.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
    } else if (selectedFilters.includes("price_high")) {
      filtered.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
    } else if (selectedFilters.includes("name_az")) {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedFilters.includes("name_za")) {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFilteredItems(filtered);
  }, [items, searchQuery, selectedFilters]);

  // Handle filter toggle
  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) => {
      // Remove other sorting filters if selecting a new sort
      const sortFilters = ["price_low", "price_high", "name_az", "name_za"];
      if (sortFilters.includes(filterId)) {
        const withoutSorts = prev.filter((id) => !sortFilters.includes(id));
        return prev.includes(filterId)
          ? withoutSorts
          : [...withoutSorts, filterId];
      }
      return prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId];
    });
  };

  // Handle add to cart
  const handleAddToCart = async (item: Item) => {
    try {
      const success = await addItem(item, 1);
      if (success) {
        Alert.alert("Success", `${item.name} added to cart!`);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
    }
  };

  // Handle item press
  const handleItemPress = (item: Item) => {
    navigation.navigate("ItemDetails", { itemId: item.id });
  };

  // Effects
  useEffect(() => {
    filterItems();
  }, [filterItems]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  // Render item
  const renderItem = ({ item }: { item: Item }) => (
    <Card style={styles.itemCard} onPress={() => handleItemPress(item)}>
      <View style={styles.itemContent}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={32} color={COLORS.GRAY_400} />
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.itemMeta}>
            <Text style={styles.itemUnit}>{item.unit}</Text>
            {item.base_price && (
              <Text style={styles.itemPrice}>
                GHS {item.base_price.toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.itemActions}>
          <Button
            mode="contained"
            onPress={() => handleAddToCart(item)}
            loading={cartLoading}
            disabled={!item.is_available || cartLoading}
            style={styles.addButton}
            contentStyle={styles.addButtonContent}
            labelStyle={styles.addButtonLabel}
          >
            {item.is_available ? "Add" : "Unavailable"}
          </Button>
        </View>
      </View>

      {!item.is_available && <View style={styles.unavailableOverlay} />}
    </Card>
  );

  // Render filter chip
  const renderFilterChip = ({
    item: filter,
  }: {
    item: (typeof filterOptions)[0];
  }) => (
    <Chip
      key={filter.id}
      selected={selectedFilters.includes(filter.id)}
      onPress={() => toggleFilter(filter.id)}
      icon={filter.icon}
      style={[
        styles.filterChip,
        selectedFilters.includes(filter.id) && styles.selectedFilterChip,
      ]}
      textStyle={[
        styles.filterChipText,
        selectedFilters.includes(filter.id) && styles.selectedFilterChipText,
      ]}
    >
      {filter.label}
    </Chip>
  );

  // Loading state
  if (loading) {
    return <Loading text="Loading items..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Failed to Load Items"
        subtitle={error}
        onActionPress={() => loadItems()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        {category?.description && (
          <Text style={styles.categoryDescription}>{category.description}</Text>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon="magnify"
          clearIcon="close"
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

      {/* Items List */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadItems(true)}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Items Found"
            subtitle={
              searchQuery.trim()
                ? `No items match "${searchQuery}"`
                : "No items available in this category"
            }
            icon="basket-outline"
            actionText={
              searchQuery.trim() ? "Clear Search" : "Browse Categories"
            }
            onActionPress={() => {
              if (searchQuery.trim()) {
                setSearchQuery("");
              } else {
                navigation.goBack();
              }
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  categoryTitle: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  categoryDescription: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: FONTS.LINE_HEIGHT.RELAXED * FONTS.SIZE.MD,
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
  },
  itemCard: {
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
    backgroundColor: COLORS.WHITE,
    overflow: "hidden",
  },
  itemContent: {
    flexDirection: "row",
    padding: SPACING.MD,
    alignItems: "center",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.GRAY_100,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.MD,
    marginRight: SPACING.SM,
  },
  itemName: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  itemDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: FONTS.LINE_HEIGHT.NORMAL * FONTS.SIZE.SM,
    marginBottom: SPACING.SM,
  },
  itemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemUnit: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: "italic",
  },
  itemPrice: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  itemActions: {
    justifyContent: "center",
  },
  addButton: {
    borderRadius: BORDER_RADIUS.SM,
    minWidth: 80,
  },
  addButtonContent: {
    height: 36,
  },
  addButtonLabel: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  unavailableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: BORDER_RADIUS.LG,
  },
});

export default CategoryItemsScreen;
