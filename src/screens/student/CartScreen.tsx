import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
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

import { useCart } from "../../hooks";
import {
  Loading,
  EmptyState,
  Button as CustomButton,
  Input,
} from "../../components/common";
import { formatCurrency, showConfirmation } from "../../utils";
import { CartItem, StudentStackParamList } from "@/types";
import { useAuth } from "@/store/authStore";
import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";

type CartScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Cart"
>;

interface CartScreenProps {
  navigation: CartScreenNavigationProp;
}

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.25;

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const {
    cart,
    loading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    updateDeliveryAddress,
    updateSpecialInstructions,
    itemCount,
    isEmpty,
    canCheckout,
  } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState(cart.delivery_address);
  const [specialInstructions, setSpecialInstructions] = useState(
    cart.special_instructions,
  );
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
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

  const handleQuantityChange = useCallback(
    async (itemId: string, newQuantity: number) => {
      if (newQuantity < 1) {
        handleRemoveItem(itemId);
        return;
      }
      await updateQuantity(itemId, newQuantity);
    },
    [updateQuantity],
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      showConfirmation(
        "Remove Item",
        "Are you sure you want to remove this item from your cart?",
        () => removeItem(itemId),
      );
    },
    [removeItem],
  );

  const handleClearCart = useCallback(() => {
    showConfirmation(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      () => clearCart(),
    );
  }, [clearCart]);

  const handleAddressUpdate = useCallback(async () => {
    setIsUpdatingAddress(true);
    try {
      await updateDeliveryAddress(deliveryAddress);
      await updateSpecialInstructions(specialInstructions || "");
    } finally {
      setIsUpdatingAddress(false);
    }
  }, [
    deliveryAddress,
    specialInstructions,
    updateDeliveryAddress,
    updateSpecialInstructions,
  ]);

  const handleCheckout = useCallback(() => {
    if (!canCheckout) {
      if (isEmpty) {
        Alert.alert(
          "Empty Cart",
          "Your cart is empty. Add some items to continue.",
        );
        return;
      }
      if (!deliveryAddress.trim()) {
        Alert.alert(
          "Delivery Address Required",
          "Please add a delivery address to continue.",
        );
        return;
      }
    }
    handleAddressUpdate();
    navigation.navigate("Checkout");
  }, [canCheckout, isEmpty, deliveryAddress, handleAddressUpdate, navigation]);

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
                style={styles.backButtonGradient}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>My Cart</Text>
              <Text style={styles.headerSubtitle}>
                {isEmpty
                  ? "0 items"
                  : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              </Text>
            </View>

            {!isEmpty && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCart}
              >
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.2)",
                    "rgba(255, 255, 255, 0.1)",
                  ]}
                  style={styles.clearButtonGradient}
                >
                  <Ionicons name="trash-outline" size={20} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  const renderCartItem = (item: CartItem, index: number) => {
    const itemName = item.item?.name || item.custom_item_name || "Unknown Item";
    const itemPrice = item.unit_price || item.custom_budget || 0;
    const imageUrl = item.item?.image_url;

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.cartItemContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: cardScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
          style={styles.cartItemCard}
        >
          <View style={styles.cartItemContent}>
            <View style={styles.cartItemLeft}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
              ) : (
                <LinearGradient
                  colors={[ColorPalette.neutral[100], ColorPalette.neutral[50]]}
                  style={styles.placeholderImage}
                >
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={ColorPalette.neutral[400]}
                  />
                </LinearGradient>
              )}

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {itemName}
                </Text>
                <Text style={styles.itemPrice}>
                  {formatCurrency(itemPrice)} each
                </Text>
                {item.notes && (
                  <Text style={styles.itemNotes} numberOfLines={2}>
                    Note: {item.notes}
                  </Text>
                )}
                {item.item?.unit && (
                  <Text style={styles.itemUnit}>Unit: {item.item.unit}</Text>
                )}
              </View>
            </View>

            <View style={styles.cartItemRight}>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    handleQuantityChange(item.id, item.quantity - 1)
                  }
                >
                  <LinearGradient
                    colors={[
                      ColorPalette.neutral[100],
                      ColorPalette.neutral[50],
                    ]}
                    style={styles.quantityButtonGradient}
                  >
                    <Ionicons
                      name="remove"
                      size={16}
                      color={ColorPalette.neutral[600]}
                    />
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.quantityText}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    handleQuantityChange(item.id, item.quantity + 1)
                  }
                >
                  <LinearGradient
                    colors={[
                      ColorPalette.primary[100],
                      ColorPalette.primary[50],
                    ]}
                    style={styles.quantityButtonGradient}
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color={ColorPalette.primary[600]}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Text style={styles.itemTotal}>
                {formatCurrency(item.total_price)}
              </Text>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <LinearGradient
                  colors={[ColorPalette.error[100], ColorPalette.error[50]]}
                  style={styles.removeButtonGradient}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={ColorPalette.error[600]}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderDeliverySection = () => (
    <Animated.View
      style={[
        styles.sectionContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
        style={styles.sectionCard}
      >
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={[ColorPalette.primary[100], ColorPalette.primary[50]]}
            style={styles.sectionIcon}
          >
            <Ionicons
              name="location"
              size={20}
              color={ColorPalette.primary[600]}
            />
          </LinearGradient>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
        </View>

        <Input
          label="Delivery Address"
          placeholder="Enter your delivery address..."
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          multiline
          numberOfLines={3}
          style={styles.addressInput}
          leftIcon="location-outline"
          required
        />

        <Input
          label="Special Instructions (Optional)"
          placeholder="Any special delivery instructions..."
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline
          numberOfLines={2}
          style={styles.instructionsInput}
          leftIcon="information-circle-outline"
        />
      </LinearGradient>
    </Animated.View>
  );

  const renderOrderSummary = () => (
    <Animated.View
      style={[
        styles.sectionContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
        style={styles.sectionCard}
      >
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={[ColorPalette.accent[100], ColorPalette.accent[50]]}
            style={styles.sectionIcon}
          >
            <Ionicons
              name="receipt"
              size={20}
              color={ColorPalette.accent[600]}
            />
          </LinearGradient>
          <Text style={styles.sectionTitle}>Order Summary</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(cart.subtotal)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(cart.delivery_fee)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Fee</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(cart.service_fee)}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>
            {formatCurrency(cart.total)}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderEmptyCart = () => (
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
            name="basket-outline"
            size={64}
            color={ColorPalette.neutral[400]}
          />
        </LinearGradient>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add some items to get started</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate("Categories")}
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

  const renderCheckoutButton = () => {
    if (isEmpty) return null;

    return (
      <Animated.View
        style={[
          styles.checkoutContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          disabled={!canCheckout || isUpdatingAddress}
        >
          <LinearGradient
            colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
            style={styles.checkoutGradient}
          >
            <Ionicons name="card" size={24} color="#ffffff" />
            <Text style={styles.checkoutText}>
              Checkout • {formatCurrency(cart.total)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {!deliveryAddress.trim() && (
          <Text style={styles.checkoutHint}>
            Please add a delivery address to continue
          </Text>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return <Loading text="Loading your cart..." />;
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
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          renderEmptyCart()
        ) : (
          <>
            <View style={styles.cartItemsContainer}>
              {cart.items.map(renderCartItem)}
            </View>
            {renderDeliverySection()}
            {renderOrderSummary()}
          </>
        )}
      </ScrollView>

      {renderCheckoutButton()}
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
  headerContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "flex-end",
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    marginRight: spacing.md,
  },
  backButtonGradient: {
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
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: spacing.xs,
  },
  clearButton: {
    marginLeft: spacing.md,
  },
  clearButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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

  // Cart items
  cartItemsContainer: {
    paddingHorizontal: spacing.lg,
  },
  cartItemContainer: {
    marginBottom: spacing.md,
  },
  cartItemCard: {
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  cartItemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
  },
  cartItemLeft: {
    flex: 1,
    flexDirection: "row",
  },
  cartItemRight: {
    alignItems: "flex-end",
    marginLeft: spacing.md,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginBottom: spacing.xs,
  },
  itemNotes: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
    fontStyle: "italic",
    marginBottom: spacing.xs,
  },
  itemUnit: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  quantityButton: {
    margin: 0,
  },
  quantityButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    marginHorizontal: spacing.md,
    minWidth: 30,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
    marginBottom: spacing.sm,
  },
  removeButton: {
    margin: 0,
  },
  removeButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // Section styles
  sectionContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
  },
  addressInput: {
    marginBottom: spacing.md,
  },
  instructionsInput: {
    marginBottom: 0,
  },

  // Summary styles
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
  },
  summaryValue: {
    fontSize: 14,
    color: ColorPalette.neutral[800],
    fontWeight: "500",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: ColorPalette.neutral[200],
    marginVertical: spacing.md,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
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

  // Checkout styles
  checkoutContainer: {
    padding: spacing.lg,
    backgroundColor: ColorPalette.pure.white,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[200],
  },
  checkoutButton: {
    marginBottom: spacing.sm,
  },
  checkoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
  },
  checkoutHint: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default CartScreen;
