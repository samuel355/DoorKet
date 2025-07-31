import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Searchbar,
  Card,
  Surface,
  useTheme,
  Button,
  Chip,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { Loading, EmptyState, ErrorState } from "../../components/common";
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from "../../constants";
import { debounce } from "../../utils";
import { StudentStackParamList } from "@/types";

type CategoriesScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Categories"
>;

interface CategoriesScreenProps {
  navigation: CategoriesScreenNavigationProp;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with margins

type ViewMode = "grid" | "list";
type SortOption = "name" | "popular" | "recent";

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const theme = useTheme();

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories when search query or filters change
  useEffect(() => {
    filterCategories();
  }, [categories, searchQuery, sortBy, showActiveOnly]);

  const loadCategories = async (showLoader: boolean = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      setError(null);

      const { data, error: apiError } = await ItemService.getCategories();

      if (apiError) {
        throw new Error(apiError);
      }

      setCategories(data || []);
    } catch (err: any) {
      console.error("Error loading categories:", err);
      setError(err.message || "Failed to load categories");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterCategories = useCallback(() => {
    let filtered = [...categories];

    // Filter by active status
    if (showActiveOnly) {
      filtered = filtered.filter((category) => category.is_active);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (category) =>
          category.name.toLowerCase().includes(query) ||
          category.description?.toLowerCase().includes(query),
      );
    }

    // Sort categories
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "popular":
        // Sort by sort_order for now (could be item count in future)
        filtered.sort((a, b) => a.sort_order - b.sort_order);
        break;
      case "recent":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    setFilteredCategories(filtered);
  }, [categories, searchQuery, sortBy, showActiveOnly]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    [],
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCategories(false);
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate("CategoryItems", {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // Could navigate to search results or apply search
      filterCategories();
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity
          style={styles.viewModeButton}
          onPress={toggleViewMode}
        >
          <Ionicons
            name={viewMode === "grid" ? "list" : "grid"}
            size={24}
            color={COLORS.TEXT_PRIMARY}
          />
        </TouchableOpacity>
      </View>

      <Searchbar
        style={styles.searchBar}
        placeholder="Search categories..."
        value={searchQuery}
        onChangeText={debouncedSearch}
        onSubmitEditing={handleSearchSubmit}
        icon="search"
        clearIcon="close"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <Chip
          selected={sortBy === "name"}
          onPress={() => setSortBy("name")}
          style={styles.filterChip}
        >
          A-Z
        </Chip>
        <Chip
          selected={sortBy === "popular"}
          onPress={() => setSortBy("popular")}
          style={styles.filterChip}
        >
          Popular
        </Chip>
        <Chip
          selected={sortBy === "recent"}
          onPress={() => setSortBy("recent")}
          style={styles.filterChip}
        >
          Recent
        </Chip>
        <Chip
          selected={showActiveOnly}
          onPress={() => setShowActiveOnly(!showActiveOnly)}
          style={styles.filterChip}
        >
          Active Only
        </Chip>
      </ScrollView>
    </View>
  );

  const renderCategoryGridItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.gridCategoryContainer}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.gridCategoryCard}>
        <Card.Content style={styles.gridCategoryContent}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: `${item.color_code || COLORS.PRIMARY}15` },
            ]}
          >
            <Ionicons
              name={(item.icon_name as any) || "basket"}
              size={32}
              color={item.color_code || COLORS.PRIMARY}
            />
          </View>
          <Text style={styles.gridCategoryName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.gridCategoryDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderCategoryListItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.listCategoryContainer}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.listCategoryCard}>
        <Card.Content style={styles.listCategoryContent}>
          <View
            style={[
              styles.listCategoryIcon,
              { backgroundColor: `${item.color_code || COLORS.PRIMARY}15` },
            ]}
          >
            <Ionicons
              name={(item.icon_name as any) || "basket"}
              size={24}
              color={item.color_code || COLORS.PRIMARY}
            />
          </View>
          <View style={styles.listCategoryInfo}>
            <Text style={styles.listCategoryName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.listCategoryDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.TEXT_SECONDARY}
          />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim()) {
      return (
        <EmptyState
          icon="search"
          title="No Categories Found"
          subtitle={`No categories match "${searchQuery}"`}
          actionText="Clear Search"
          onActionPress={() => setSearchQuery("")}
        />
      );
    }

    return (
      <EmptyState
        icon="grid"
        title="No Categories Available"
        subtitle="Categories will appear here when they're added"
        actionText="Refresh"
        onActionPress={() => loadCategories()}
      />
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loading text="Loading categories..." />;
    }

    if (error) {
      return (
        <ErrorState
          title="Failed to Load Categories"
          subtitle={error}
          actionText="Try Again"
          onActionPress={() => loadCategories()}
        />
      );
    }

    if (filteredCategories.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={filteredCategories}
        renderItem={
          viewMode === "grid" ? renderCategoryGridItem : renderCategoryListItem
        }
        keyExtractor={(item) => item.id}
        numColumns={viewMode === "grid" ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {renderHeader()}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    paddingBottom: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    textAlign: "center",
  },
  viewModeButton: {
    padding: SPACING.SM,
  },
  searchBar: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
    backgroundColor: COLORS.GRAY_50,
  },
  filtersContainer: {
    marginBottom: SPACING.SM,
  },
  filtersContent: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
  filterChip: {
    marginRight: SPACING.SM,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XXL,
  },

  // Grid styles
  gridCategoryContainer: {
    width: CARD_WIDTH,
    marginBottom: SPACING.MD,
    marginHorizontal: SPACING.XS,
  },
  gridCategoryCard: {
    elevation: 2,
    borderRadius: BORDER_RADIUS.LG,
  },
  gridCategoryContent: {
    alignItems: "center",
    paddingVertical: SPACING.LG,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.MD,
  },
  gridCategoryName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: "center",
    marginBottom: SPACING.XS,
  },
  gridCategoryDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: FONTS.SIZE.SM * 1.4,
  },

  // List styles
  listCategoryContainer: {
    marginBottom: SPACING.SM,
  },
  listCategoryCard: {
    elevation: 1,
    borderRadius: BORDER_RADIUS.MD,
  },
  listCategoryContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.MD,
  },
  listCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.MD,
  },
  listCategoryInfo: {
    flex: 1,
  },
  listCategoryName: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  listCategoryDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: FONTS.SIZE.SM * 1.4,
  },
});

export default CategoriesScreen;
