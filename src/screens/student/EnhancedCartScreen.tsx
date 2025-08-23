import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";

import {
  CartItemCard,
  CartSummary,
  EmptyCart,
  CustomItemDialog,
  CartBadge,
} from "@/src/components/cart";
import { Loading } from "@/src/components/common";
import { useCartStore, useCartActions } from "@/store/cartStore";
import { StudentStackParamList, CartItem } from "@/types";
import { ColorPalette } from "@/src/theme/colors";
import { spacing, borderRadius } from "@/src/theme/styling";
import { showConfirmation } from "@/src/utils";

type EnhancedCartScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Cart"
>;

interface EnhancedCartScreenProps {
  navigation: EnhancedCartScreenNavigationProp;
}

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.15;

const EnhancedCartScreen: React.FC<EnhancedCartScreenProps> = ({
  navigation,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [customItemDialogVisible, setCustomItemDialogVisible] = useState(false);

  // Cart store hooks
  const cart = useCartStore((state) => state.cart);
  const isLoading = useCartStore((state) => state.isLoading);
  const isUpdating = useCartStore((state) => state.isUpdating);
  const error = useCartStore((state) => state.error);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const canCheckout = useCartStore((state) => state.canCheckout);

  // Cart actions
  const {
    removeItem,
    updateQuantity,
    clearCart,
    updateDeliveryAddress,
    updateSpecialInstructions,
  } = useCartActions();

  const isEmpty = cart.items.length === 0;
  const itemCount = getTotalItems();

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // In a real app, you might want to refresh cart data from server
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Navigation handlers
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleGoToHome = useCallback(() => {
    navigation.navigate("Home");
  }, [navigation]);

  const handleGoToCategories = useCallback(() => {
    navigation.navigate("Categories");
  }, [navigation]);

  const handleCheckout = useCallback(() => {
    if (!canCheckout()) {
      return;
    }
    navigation.navigate("Checkout");
  }, [navigation, canCheckout]);

  // Cart item handlers
  const handleQuantityChange = useCallback(
    async (itemId: string, newQuantity: number) => {
      await updateQuantity(itemId, newQuantity);
    },
    [updateQuantity]
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      const item = cart.items.find((cartItem) => cartItem.id === itemId);
      const itemName =
        item?.item?.name || item?.custom_item_name || "this item";

      showConfirmation(
        "Remove Item",
        `Are you sure you want to remove "${itemName}" from your cart?`,
        () => removeItem(itemId)
      );
    },
    [cart.items, removeItem]
  );

  const handleClearCart = useCallback(() => {
    showConfirmation(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      () => clearCart()
    );
  }, [clearCart]);

  // Custom item handlers
  const handleAddCustomItem = useCallback(() => {
    setCustomItemDialogVisible(true);
  }, []);

  const handleCustomItemSuccess = useCallback(() => {
    setCustomItemDialogVisible(false);
  }, []);

  // Item press handler (navigate to item details if needed)
  const handleItemPress = useCallback(
    (item: CartItem) => {
      if (item.item?.id) {
        navigation.navigate("ItemDetails", { itemId: item.item.id });
      }
    },
    [navigation]
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[
          ColorPalette.primary[600],
          ColorPalette.primary[700],
          ColorPalette.secondary[600],
        ]}
        locations={[0, 0.6, 1]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.headerContent}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" />

          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>My Cart</Text>
              <CartBadge
                showZero
                color="#ffffff"
                badgeColor={ColorPalette.secondary[500]}
                size="small"
              />
            </View>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleAddCustomItem}
            >
              <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.itemCountText}>
              {isEmpty
                ? "No items in cart"
                : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            </Text>
            {!isEmpty && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCart}
              >
                <Ionicons name="trash-outline" size={16} color="#ffffff" />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderCartItems = () => (
    <View style={styles.cartItemsContainer}>
      {cart.items.map((item, index) => (
        <CartItemCard
          key={item.id}
          item={item}
          onQuantityChange={handleQuantityChange}
          onRemove={handleRemoveItem}
          onPress={handleItemPress}
          showRemoveButton
          showQuantityControls
        />
      ))}
    </View>
  );

  const renderEmptyCart = () => (
    <EmptyCart
      onStartShopping={handleGoToHome}
      onBrowseCategories={handleGoToCategories}
      title="Your cart is empty"
      message="Discover amazing products and add them to your cart to get started!"
      showAnimation
      showActions
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {renderHeader()}
        <Loading message="Loading your cart..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ColorPalette.primary[600]]}
            tintColor={ColorPalette.primary[600]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? renderEmptyCart() : renderCartItems()}

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={ColorPalette.error[600]}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Add some bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Cart Summary */}
      {!isEmpty && (
        <View style={styles.summaryContainer}>
          <CartSummary
            cart={cart}
            onCheckout={handleCheckout}
            showCheckoutButton
            showDeliveryInfo={false}
            canCheckout={canCheckout()}
            loading={isUpdating}
            compact
          />
        </View>
      )}

      {/* Custom Item Dialog */}
      <CustomItemDialog
        visible={customItemDialogVisible}
        onDismiss={() => setCustomItemDialogVisible(false)}
        onSuccess={handleCustomItemSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    paddingTop: spacing.md,
  },
  headerContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  itemCountText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  clearButtonText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cartItemsContainer: {
    paddingTop: spacing.lg,
  },
  summaryContainer: {
    backgroundColor: ColorPalette.pure.white,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[200],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: ColorPalette.neutral[900],
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorPalette.error[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: ColorPalette.error[600],
  },
  errorText: {
    fontSize: 14,
    color: ColorPalette.error[700],
    marginLeft: spacing.sm,
    flex: 1,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default EnhancedCartScreen;
