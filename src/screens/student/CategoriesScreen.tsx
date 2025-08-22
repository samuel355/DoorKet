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

import { Loading } from "../../components/common";
import { Category, StudentStackParamList } from "@/types";
import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";
import { ItemService } from "@/services/itemService";

type CategoriesScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Categories"
>;

interface CategoriesScreenProps {
  navigation: CategoriesScreenNavigationProp;
}

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.25;
//const CARD_WIDTH = (width - 60) / 2;

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await ItemService.getCategories();
      if (error) {
        console.error("Error loading categories:", error);
        return;
      }
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    loadCategories();
    startAnimations();
  }, [loadCategories, startAnimations]);

  const filterCategories = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  useEffect(() => {
    filterCategories();
  }, [searchQuery, categories, filterCategories]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  }, [loadCategories]);

  const handleCategoryPress = (category: Category) => {
    navigation.navigate("CategoryItems", {
      categoryId: category.id,
      categoryName: category.name,
    });
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
              <Text style={styles.headerTitle}>Shop by Category</Text>
              <Text style={styles.headerSubtitle}>
                {filteredCategories.length} categories available
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
                <Ionicons name="options-outline" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search categories..."
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

  const renderCategory = (category: Category, index: number) => (
    <Animated.View
      key={category.id}
      style={[
        styles.categoryCard,
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
      <TouchableOpacity onPress={() => handleCategoryPress(category)}>
        <LinearGradient
          colors={[
            `${category.color_code || ColorPalette.primary[500]}20`,
            `${category.color_code || ColorPalette.primary[500]}10`,
            ColorPalette.pure.white,
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
                name={(category.icon_name as any) || "grid"}
                size={32}
                color={category.color_code || ColorPalette.primary[500]}
              />
            </View>

            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName} numberOfLines={2}>
                {category.name}
              </Text>
              {category.description && (
                <Text style={styles.categoryDescription} numberOfLines={3}>
                  {category.description}
                </Text>
              )}
            </View>

            <View style={styles.categoryArrow}>
              <LinearGradient
                colors={[
                  `${category.color_code || ColorPalette.primary[500]}20`,
                  `${category.color_code || ColorPalette.primary[500]}10`,
                ]}
                style={styles.arrowContainer}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={category.color_code || ColorPalette.primary[500]}
                />
              </LinearGradient>
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
            name="search-outline"
            size={64}
            color={ColorPalette.neutral[400]}
          />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No categories found</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your search terms
        </Text>
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return <Loading text="Loading categories..." />;
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
        {filteredCategories.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.categoriesGrid}>
            {filteredCategories.map(renderCategory)}
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
    paddingTop: 10,
    marginBottom: 45
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl,
    paddingTop: spacing.xl,
  },

  // Categories grid
  categoriesGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryCard: {
    marginBottom: spacing.md,
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
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    lineHeight: 20,
  },
  categoryArrow: {},
  arrowContainer: {
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
  },
});

export default CategoriesScreen;
