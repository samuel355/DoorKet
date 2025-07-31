import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  RadioButton,
  Divider,
  TextInput,
  IconButton,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Loading, EmptyState, Input } from "../../components/common";
import { useCart } from "../../hooks";
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  PAYMENT_METHODS,
} from "../../constants";
import { useAuth } from "@/store/authStore";

interface CheckoutScreenProps {
  navigation: any;
}

interface DeliveryInfo {
  address: string;
  hall_hostel: string;
  room_number: string;
  phone: string;
  specialInstructions: string;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user, profile } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("momo");
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    address: "",
    hall_hostel: profile?.hall_hostel || "",
    room_number: profile?.room_number || "",
    phone: profile?.phone_number || "",
    specialInstructions: cart.special_instructions || "",
  });
  const [errors, setErrors] = useState<Partial<DeliveryInfo>>({});
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(true);

  // Pre-fill delivery info from profile
  useEffect(() => {
    if (profile) {
      setDeliveryInfo((prev) => ({
        ...prev,
        hall_hostel: profile.hall_hostel || prev.hall_hostel,
        room_number: profile.room_number || prev.room_number,
        phone: profile.phone_number || prev.phone,
      }));
    }
  }, [profile]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<DeliveryInfo> = {};

    if (!deliveryInfo.address.trim()) {
      newErrors.address = "Delivery address is required";
    }

    if (!deliveryInfo.hall_hostel.trim()) {
      newErrors.hall_hostel = "Hall/Hostel is required";
    }

    if (!deliveryInfo.room_number.trim()) {
      newErrors.room_number = "Room number is required";
    }

    if (!deliveryInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+233|0)[0-9]{9}$/.test(deliveryInfo.phone.trim())) {
      newErrors.phone = "Please enter a valid Ghana phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Calculate fees
  const paymentFees = PaymentService.getInstance().calculatePaymentFees(
    cart.total,
    selectedPaymentMethod,
  );
  const finalTotal = cart.total + paymentFees.fees;

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Validation Error",
        "Please fill in all required fields correctly.",
      );
      return;
    }

    if (cart.items.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Your cart is empty. Add some items before placing an order.",
      );
      return;
    }

    if (!user) {
      Alert.alert("Authentication Error", "Please log in to place an order.");
      return;
    }

    try {
      setLoading(true);

      // Prepare delivery address
      const fullAddress = `${deliveryInfo.address}, ${deliveryInfo.hall_hostel}, Room ${deliveryInfo.room_number}`;

      // Create order data
      const orderData = {
        student_id: user.id,
        status: "pending" as const,
        total_amount: finalTotal,
        service_fee: cart.service_fee,
        delivery_fee: cart.delivery_fee + paymentFees.fees,
        delivery_address: fullAddress,
        special_instructions:
          deliveryInfo.specialInstructions.trim() || undefined,
        payment_method: selectedPaymentMethod,
        payment_status: "pending" as const,
      };

      // Create order
      const { data: order, error: orderError } =
        await SupabaseService.createOrder(orderData);

      if (orderError || !order) {
        throw new Error(orderError || "Failed to create order");
      }

      // Add order items
      const orderItems = cart.items.map((item) => ({
        order_id: order.id,
        item_id: item.item?.id || null,
        custom_item_name: item.custom_item_name || null,
        quantity: item.quantity,
        unit_price: item.unit_price || null,
        custom_budget: item.custom_budget || null,
        notes: item.notes || null,
      }));

      const { error: itemsError } =
        await SupabaseService.addOrderItems(orderItems);

      if (itemsError) {
        throw new Error(itemsError);
      }

      // Handle payment
      if (selectedPaymentMethod !== "cash") {
        // Navigate to payment screen for electronic payments
        navigation.navigate("Payment", {
          orderId: order.id,
          amount: finalTotal,
          paymentMethod: selectedPaymentMethod,
          customerData: {
            name: profile?.full_name || "",
            phone: deliveryInfo.phone,
          },
        });
      } else {
        // For cash payments, clear cart and navigate to tracking
        await clearCart();

        Alert.alert(
          "Order Placed Successfully!",
          `Your order #${order.order_number} has been placed. You will pay cash on delivery.`,
          [
            {
              text: "Track Order",
              onPress: () =>
                navigation.navigate("OrderTracking", { orderId: order.id }),
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("Order placement error:", error);
      Alert.alert(
        "Order Failed",
        error.message || "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if cart is empty
  useFocusEffect(
    useCallback(() => {
      if (cart.items.length === 0) {
        navigation.navigate("Cart");
      }
    }, [cart.items.length, navigation]),
  );

  // Render cart item
  const renderCartItem = (item: CartItem, index: number) => (
    <View key={index} style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>
          {item.item?.name || item.custom_item_name}
        </Text>
        {item.notes && (
          <Text style={styles.cartItemNotes}>Note: {item.notes}</Text>
        )}
        <Text style={styles.cartItemQuantity}>Qty: {item.quantity}</Text>
      </View>
      <View style={styles.cartItemPrice}>
        <Text style={styles.cartItemPriceText}>
          GHS {item.total_price.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  // Render payment method option
  const renderPaymentMethod = (method: PaymentMethod) => {
    const methodInfo = PAYMENT_METHODS.find((m) => m.id === method);
    if (!methodInfo || !methodInfo.enabled) return null;

    return (
      <TouchableOpacity
        key={method}
        style={[
          styles.paymentOption,
          selectedPaymentMethod === method && styles.selectedPaymentOption,
        ]}
        onPress={() => setSelectedPaymentMethod(method)}
      >
        <View style={styles.paymentOptionContent}>
          <RadioButton
            value={method}
            status={selectedPaymentMethod === method ? "checked" : "unchecked"}
            onPress={() => setSelectedPaymentMethod(method)}
          />
          <View style={styles.paymentOptionInfo}>
            <View style={styles.paymentOptionHeader}>
              <Ionicons
                name={methodInfo.icon as any}
                size={24}
                color={methodInfo.color}
                style={styles.paymentOptionIcon}
              />
              <Text style={styles.paymentOptionName}>{methodInfo.name}</Text>
            </View>
            <Text style={styles.paymentOptionDescription}>
              {methodInfo.name}
            </Text>
            {method !== "cash" && (
              <Text style={styles.paymentFeeText}>
                Fee: GHS{" "}
                {PaymentService.getInstance()
                  .calculatePaymentFees(cart.total, method)
                  .fees.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (cartLoading) {
    return <Loading text="Loading checkout..." />;
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Cart is Empty"
        subtitle="Add some items to your cart before checkout"
        icon="cart-outline"
        actionText="Continue Shopping"
        onActionPress={() => navigation.navigate("Home")}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <Card style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
          >
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <IconButton
              icon={orderSummaryExpanded ? "chevron-up" : "chevron-down"}
              size={20}
            />
          </TouchableOpacity>

          {orderSummaryExpanded && (
            <Card.Content style={styles.sectionContent}>
              {cart.items.map(renderCartItem)}

              <Divider style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  GHS {cart.subtotal.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>
                  GHS {cart.delivery_fee.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Fee</Text>
                <Text style={styles.summaryValue}>
                  GHS {cart.service_fee.toFixed(2)}
                </Text>
              </View>

              {selectedPaymentMethod !== "cash" && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Payment Fee</Text>
                  <Text style={styles.summaryValue}>
                    GHS {paymentFees.fees.toFixed(2)}
                  </Text>
                </View>
              )}

              <Divider style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  GHS {finalTotal.toFixed(2)}
                </Text>
              </View>
            </Card.Content>
          )}
        </Card>

        {/* Delivery Information */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Delivery Information</Text>

            <Input
              label="Delivery Address *"
              value={deliveryInfo.address}
              onChangeText={(value) => handleInputChange("address", value)}
              error={errors.address}
              placeholder="e.g., Near the main gate"
              multiline
              numberOfLines={2}
              style={styles.input}
            />

            <View style={styles.row}>
              <Input
                label="Hall/Hostel *"
                value={deliveryInfo.hall_hostel}
                onChangeText={(value) =>
                  handleInputChange("hall_hostel", value)
                }
                error={errors.hall_hostel}
                placeholder="e.g., Commonwealth Hall"
                style={styles.halfInput}
              />

              <Input
                label="Room Number *"
                value={deliveryInfo.room_number}
                onChangeText={(value) =>
                  handleInputChange("room_number", value)
                }
                error={errors.room_number}
                placeholder="e.g., A24"
                style={styles.halfInput}
              />
            </View>

            <Input
              label="Phone Number *"
              value={deliveryInfo.phone}
              onChangeText={(value) => handleInputChange("phone", value)}
              error={errors.phone}
              placeholder="0XX XXX XXXX"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Input
              label="Special Instructions"
              value={deliveryInfo.specialInstructions}
              onChangeText={(value) =>
                handleInputChange("specialInstructions", value)
              }
              placeholder="Any special delivery instructions..."
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Payment Method */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.filter((method) => method.enabled).map(
                (method) => renderPaymentMethod(method.id),
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomContainer}>
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={loading}
          disabled={loading || cart.items.length === 0}
          style={styles.placeOrderButton}
          contentStyle={styles.placeOrderContent}
          labelStyle={styles.placeOrderLabel}
          icon="check-circle"
        >
          Place Order - GHS {finalTotal.toFixed(2)}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom button
  },
  sectionCard: {
    margin: SPACING.LG,
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
  },
  sectionContent: {
    padding: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: SPACING.SM,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  cartItemName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  cartItemNotes: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: "italic",
    marginBottom: SPACING.XS,
  },
  cartItemQuantity: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  cartItemPrice: {
    alignItems: "flex-end",
  },
  cartItemPriceText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  divider: {
    marginVertical: SPACING.MD,
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
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginTop: SPACING.SM,
  },
  totalLabel: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  totalValue: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  input: {
    marginBottom: SPACING.MD,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  paymentMethods: {
    gap: SPACING.SM,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.WHITE,
  },
  selectedPaymentOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  paymentOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.MD,
  },
  paymentOptionInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  paymentOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.XS,
  },
  paymentOptionIcon: {
    marginRight: SPACING.SM,
  },
  paymentOptionName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
  },
  paymentOptionDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  paymentFeeText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.WARNING,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
    padding: SPACING.LG,
  },
  placeOrderButton: {
    borderRadius: BORDER_RADIUS.LG,
  },
  placeOrderContent: {
    height: 56,
  },
  placeOrderLabel: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
});

export default CheckoutScreen;
