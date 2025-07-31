import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  IconButton,
  Divider,
  TextInput,
  Surface,
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";

import { StudentStackParamList, CartItem } from "../../types";
import { useCart } from "../../hooks";
import {
  Loading,
  EmptyState,
  Button as CustomButton,
  Input,
} from "../../components/common";
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from "../../constants";
import { formatCurrency, showConfirmation, truncateText } from "../../utils";

type CartScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Cart"
>;

interface CartScreenProps {
  navigation: CartScreenNavigationProp;
}

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const theme = useTheme();
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
      await updateSpecialInstructions(specialInstructions);
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

    // Update address before proceeding
    handleAddressUpdate();
    navigation.navigate("Checkout");
  }, [canCheckout, isEmpty, deliveryAddress, handleAddressUpdate, navigation]);

  const handleContinueShopping = useCallback(() => {
    navigation.navigate("Home");
  }, [navigation]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Cart</Text>
      {!isEmpty && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCartItem = (item: CartItem) => {
    const itemName = item.item?.name || item.custom_item_name || "Unknown Item";
    const itemPrice = item.unit_price || item.custom_budget || 0;
    const imageUrl = item.item?.image_url;

    return (
      <Card key={item.id} style={styles.cartItemCard}>
        <Card.Content style={styles.cartItemContent}>
          <View style={styles.cartItemLeft}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={COLORS.TEXT_SECONDARY}
                />
              </View>
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
              <IconButton
                icon="minus"
                size={20}
                iconColor={COLORS.TEXT_PRIMARY}
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
              />
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <IconButton
                icon="plus"
                size={20}
                iconColor={COLORS.TEXT_PRIMARY}
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
              />
            </View>

            <Text style={styles.itemTotal}>
              {formatCurrency(item.total_price)}
            </Text>

            <IconButton
              icon="trash-can-outline"
              size={20}
              iconColor={COLORS.ERROR}
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item.id)}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDeliverySection = () => (
    <Card style={styles.deliveryCard}>
      <Card.Content style={styles.deliveryContent}>
        <View style={styles.deliveryHeader}>
          <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.deliveryTitle}>Delivery Information</Text>
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
      </Card.Content>
    </Card>
  );

  const renderOrderSummary = () => (
    <Card style={styles.summaryCard}>
      <Card.Content style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>Order Summary</Text>

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

        <Divider style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>
            {formatCurrency(cart.total)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyCart = () => (
    <EmptyState
      icon="basket-outline"
      title="Your cart is empty"
      subtitle="Add some items to get started"
      actionText="Start Shopping"
      onActionPress={handleContinueShopping}
    />
  );

  const renderCheckoutButton = () => {
    if (isEmpty) return null;

    return (
      <View style={styles.checkoutContainer}>
        <CustomButton
          title={`Checkout • ${formatCurrency(cart.total)}`}
          onPress={handleCheckout}
          disabled={!canCheckout || isUpdatingAddress}
          loading={isUpdatingAddress}
          fullWidth
          size="large"
          style={styles.checkoutButton}
        />

        {!deliveryAddress.trim() && (
          <Text style={styles.checkoutHint}>
            Please add a delivery address to continue
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return <Loading text="Loading your cart..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {renderHeader()}

      {isEmpty ? (
        renderEmptyCart()
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cartItemsContainer}>
              {cart.items.map(renderCartItem)}
            </View>

            {renderDeliverySection()}
            {renderOrderSummary()}
          </ScrollView>

          {renderCheckoutButton()}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
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
  clearButton: {
    padding: SPACING.SM,
  },
  clearButtonText: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.ERROR,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.XXL,
  },

  // Cart Items
  cartItemsContainer: {
    padding: SPACING.MD,
  },
  cartItemCard: {
    marginBottom: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    elevation: 1,
  },
  cartItemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cartItemLeft: {
    flex: 1,
    flexDirection: "row",
  },
  cartItemRight: {
    alignItems: "flex-end",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.SM,
    marginRight: SPACING.MD,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.MD,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  itemPrice: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  itemNotes: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: "italic",
    marginBottom: SPACING.XS,
  },
  itemUnit: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.SM,
  },
  quantityButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  quantityText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: SPACING.SM,
    minWidth: 30,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  removeButton: {
    margin: 0,
    width: 32,
    height: 32,
  },

  // Delivery Section
  deliveryCard: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    elevation: 1,
  },
  deliveryContent: {
    padding: SPACING.MD,
  },
  deliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.MD,
  },
  deliveryTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  addressInput: {
    marginBottom: SPACING.MD,
  },
  instructionsInput: {
    marginBottom: 0,
  },

  // Order Summary
  summaryCard: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    elevation: 1,
  },
  summaryContent: {
    padding: SPACING.MD,
  },
  summaryTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.SM,
  },
  summaryLabel: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  summaryDivider: {
    marginVertical: SPACING.SM,
    backgroundColor: COLORS.BORDER,
  },
  summaryTotalLabel: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  summaryTotalValue: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },

  // Checkout
  checkoutContainer: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
  },
  checkoutButton: {
    marginBottom: SPACING.SM,
  },
  checkoutHint: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default CartScreen;
