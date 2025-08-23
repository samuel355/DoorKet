import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Portal, Modal } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { Loading, Input } from "../../components/common";
import { useAuth } from "@/store/authStore";
import { useCartStore, useCartActions } from "@/store/cartStore";
import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";
import { PaymentMethod } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_HEIGHT = 120;

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

const PAYMENT_METHODS = [
  {
    id: "momo" as PaymentMethod,
    name: "Mobile Money",
    icon: "phone-portrait",
    color: ColorPalette.primary[500],
    description: "Pay with MTN, Vodafone, or AirtelTigo",
  },
  {
    id: "card" as PaymentMethod,
    name: "Credit/Debit Card",
    icon: "card",
    color: ColorPalette.secondary[500],
    description: "Visa, Mastercard, or other cards",
  },
  {
    id: "cash" as PaymentMethod,
    name: "Cash on Delivery",
    icon: "cash",
    color: ColorPalette.success[500],
    description: "Pay when your order arrives",
  },
];

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const { cart } = useCartStore();
  const { clearCart } = useCartActions();
  const { user, profile } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("momo");
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    address: "",
    hall_hostel: profile?.hall_hostel || "",
    room_number: profile?.room_number || "",
    phone: profile?.phone || "",
    specialInstructions: cart.special_instructions || "",
  });
  const [errors, setErrors] = useState<Partial<DeliveryInfo>>({});
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Pre-fill delivery info from profile
  useEffect(() => {
    if (profile) {
      setDeliveryInfo((prev) => ({
        ...prev,
        hall_hostel: profile.hall_hostel || prev.hall_hostel,
        room_number: profile.room_number || prev.room_number,
        phone: profile.phone || prev.phone,
      }));
    }
  }, [profile]);

  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, slideUpAnim, scaleAnim, floatAnim]);

  // Start animations on mount
  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

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

  // Calculate fees (simplified for now)
  const paymentFees = {
    fees: selectedPaymentMethod !== "cash" ? cart.total * 0.025 : 0,
  };
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

    setShowConfirmModal(false);

    try {
      setLoading(true);

      // Prepare delivery address
      const fullAddress = `${deliveryInfo.address}, ${deliveryInfo.hall_hostel}, Room ${deliveryInfo.room_number}`;

      // Simulate order creation (replace with actual service calls)
      const order = {
        id: Date.now().toString(),
        order_number: `DK${Date.now().toString().slice(-6)}`,
      };

      // Clear cart
      clearCart();

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
        // Show success for cash payments
        Alert.alert(
          "Order Placed Successfully! 🎉",
          `Your order #${order.order_number} has been placed. You'll pay cash on delivery.\n\nA runner will be assigned shortly and you'll receive updates about your order.`,
          [
            {
              text: "View Order",
              onPress: () =>
                navigation.navigate("OrderTracking", { orderId: order.id }),
            },
            {
              text: "Continue Shopping",
              onPress: () => navigation.navigate("HomeTab"),
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("Error placing order:", error);
      Alert.alert(
        "Order Failed",
        error.message || "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const renderHeader = () => (
    <LinearGradient
      colors={[
        ColorPalette.primary[600],
        ColorPalette.primary[500],
        ColorPalette.secondary[500],
      ]}
      locations={[0, 0.6, 1]}
      style={styles.header}
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
              colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.1)"]}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Text style={styles.headerSubtitle}>
              {cart.items.length} item{cart.items.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <LinearGradient
              colors={[ColorPalette.accent[100], ColorPalette.accent[50]]}
              style={styles.totalBadge}
            >
              <Text style={styles.totalBadgeText}>
                GHS {finalTotal.toFixed(2)}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderDeliverySection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
        style={styles.sectionGradient}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
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
        </View>

        <View style={styles.sectionContent}>
          <Input
            label="Delivery Address"
            value={deliveryInfo.address}
            onChangeText={(value) => handleInputChange("address", value)}
            placeholder="e.g., Near main gate, opposite library"
            error={errors.address}
            style={styles.input}
          />

          <View style={styles.inputRow}>
            <Input
              label="Hall/Hostel"
              value={deliveryInfo.hall_hostel}
              onChangeText={(value) => handleInputChange("hall_hostel", value)}
              placeholder="e.g., Unity Hall"
              error={errors.hall_hostel}
              style={styles.inputHalf}
            />

            <Input
              label="Room Number"
              value={deliveryInfo.room_number}
              onChangeText={(value) => handleInputChange("room_number", value)}
              placeholder="e.g., A101"
              error={errors.room_number}
              style={styles.inputHalf}
            />
          </View>

          <Input
            label="Phone Number"
            value={deliveryInfo.phone}
            onChangeText={(value) => handleInputChange("phone", value)}
            placeholder="+233 XX XXX XXXX"
            keyboardType="phone-pad"
            error={errors.phone}
            style={styles.input}
          />

          <Input
            label="Special Instructions (Optional)"
            value={deliveryInfo.specialInstructions}
            onChangeText={(value) =>
              handleInputChange("specialInstructions", value)
            }
            placeholder="Any special delivery instructions..."
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderPaymentSection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
        style={styles.sectionGradient}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <LinearGradient
              colors={[ColorPalette.secondary[100], ColorPalette.secondary[50]]}
              style={styles.sectionIcon}
            >
              <Ionicons
                name="card"
                size={20}
                color={ColorPalette.secondary[600]}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
        </View>

        <View style={styles.sectionContent}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.paymentOption}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <LinearGradient
                colors={
                  selectedPaymentMethod === method.id
                    ? [method.color + "20", method.color + "10"]
                    : [ColorPalette.neutral[100], ColorPalette.neutral[50]]
                }
                style={[
                  styles.paymentOptionGradient,
                  selectedPaymentMethod === method.id &&
                    styles.paymentOptionSelected,
                ]}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentOptionLeft}>
                    <LinearGradient
                      colors={[method.color + "30", method.color + "15"]}
                      style={styles.paymentIcon}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={24}
                        color={method.color}
                      />
                    </LinearGradient>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>{method.name}</Text>
                      <Text style={styles.paymentDescription}>
                        {method.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.radioButton}>
                    {selectedPaymentMethod === method.id ? (
                      <LinearGradient
                        colors={[method.color, method.color + "CC"]}
                        style={styles.radioSelected}
                      >
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      </LinearGradient>
                    ) : (
                      <View style={styles.radioUnselected} />
                    )}
                  </View>
                </View>

                {paymentFees.fees > 0 &&
                  selectedPaymentMethod === method.id && (
                    <View style={styles.feeInfo}>
                      <Text style={styles.feeText}>
                        Processing fee: GHS {paymentFees.fees.toFixed(2)}
                      </Text>
                    </View>
                  )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderOrderSummary = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
        style={styles.sectionGradient}
      >
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
        >
          <View style={styles.sectionTitleContainer}>
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
          <Ionicons
            name={orderSummaryExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={ColorPalette.neutral[600]}
          />
        </TouchableOpacity>

        {orderSummaryExpanded && (
          <View style={styles.sectionContent}>
            {cart.items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName} numberOfLines={2}>
                    {item.item?.name || item.custom_item_name}
                  </Text>
                  <Text style={styles.orderItemDetails}>
                    Qty: {item.quantity} × GHS{" "}
                    {(item.unit_price || item.custom_budget || 0).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.orderItemPrice}>
                  GHS {item.total_price.toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.orderTotals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>
                  GHS {cart.subtotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Delivery Fee</Text>
                <Text style={styles.totalValue}>
                  GHS {cart.delivery_fee.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Service Fee</Text>
                <Text style={styles.totalValue}>
                  GHS {cart.service_fee.toFixed(2)}
                </Text>
              </View>
              {paymentFees.fees > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Payment Fee</Text>
                  <Text style={styles.totalValue}>
                    GHS {paymentFees.fees.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.totalRowFinal}>
                <LinearGradient
                  colors={[
                    ColorPalette.primary[500],
                    ColorPalette.primary[400],
                  ]}
                  style={styles.finalTotalGradient}
                >
                  <Text style={styles.finalTotalLabel}>Total</Text>
                  <Text style={styles.finalTotalValue}>
                    GHS {finalTotal.toFixed(2)}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  const renderConfirmModal = () => (
    <Portal>
      <Modal
        visible={showConfirmModal}
        onDismiss={() => setShowConfirmModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <BlurView intensity={100} tint="dark" style={styles.modalBlur}>
          <LinearGradient
            colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={[ColorPalette.primary[100], ColorPalette.primary[50]]}
                style={styles.modalIcon}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color={ColorPalette.primary[600]}
                />
              </LinearGradient>
              <Text style={styles.modalTitle}>Confirm Your Order</Text>
              <Text style={styles.modalSubtitle}>
                Please review your order details before proceeding
              </Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Items:</Text>
                <Text style={styles.confirmValue}>{cart.items.length}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Total Amount:</Text>
                <Text style={styles.confirmValue}>
                  GHS {finalTotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Payment Method:</Text>
                <Text style={styles.confirmValue}>
                  {
                    PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod)
                      ?.name
                  }
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Delivery to:</Text>
                <Text style={styles.confirmValue} numberOfLines={2}>
                  {deliveryInfo.hall_hostel}, Room {deliveryInfo.room_number}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <LinearGradient
                  colors={[
                    ColorPalette.neutral[200],
                    ColorPalette.neutral[100],
                  ]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handlePlaceOrder}
              >
                <LinearGradient
                  colors={[
                    ColorPalette.primary[500],
                    ColorPalette.primary[400],
                  ]}
                  style={styles.modalButtonGradient}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      styles.modalButtonTextPrimary,
                    ]}
                  >
                    Place Order
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </Modal>
    </Portal>
  );

  if (loading) {
    return <Loading text="Placing your order..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderDeliverySection()}
          {renderPaymentSection()}
          {renderOrderSummary()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Place Order Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={() => setShowConfirmModal(true)}
          disabled={loading}
        >
          <LinearGradient
            colors={[ColorPalette.primary[600], ColorPalette.primary[500]]}
            style={styles.placeOrderGradient}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="bag-check" size={24} color="#ffffff" />
              <Text style={styles.placeOrderText}>
                Place Order • GHS {finalTotal.toFixed(2)}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {renderConfirmModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    height: HEADER_HEIGHT,
    position: "relative",
  },
  floatingElement: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.full,
  },
  element1: {
    width: 60,
    height: 60,
    top: "20%",
    left: "10%",
  },
  element2: {
    width: 40,
    height: 40,
    top: "60%",
    right: "15%",
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "flex-end",
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
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
    fontWeight: "500",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  totalBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  totalBadgeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.accent[700],
  },

  // Sections
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionGradient: {
    borderRadius: borderRadius.xl,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  sectionContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },

  // Input Styles
  input: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  inputHalf: {
    flex: 1,
  },

  // Payment Method Styles
  paymentOption: {
    marginBottom: spacing.md,
  },
  paymentOptionGradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentOptionSelected: {
    borderColor: ColorPalette.primary[300],
    elevation: 2,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  paymentOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.xs,
  },
  paymentDescription: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    lineHeight: 18,
  },
  radioButton: {
    marginLeft: spacing.md,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ColorPalette.neutral[300],
    backgroundColor: ColorPalette.pure.white,
  },
  feeInfo: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[200],
  },
  feeText: {
    fontSize: 12,
    color: ColorPalette.warning[600],
    fontWeight: "500",
    textAlign: "center",
  },

  // Order Summary Styles
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ColorPalette.neutral[100],
  },
  orderItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  orderItemDetails: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
  },
  orderTotals: {
    marginTop: spacing.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 14,
    color: ColorPalette.neutral[800],
    fontWeight: "600",
  },
  totalRowFinal: {
    marginTop: spacing.md,
  },
  finalTotalGradient: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
  },
  finalTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
  },

  // Bottom Container
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ColorPalette.pure.white,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[200],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    elevation: 8,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  placeOrderButton: {
    borderRadius: borderRadius.xl,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  placeOrderGradient: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 56,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    margin: spacing.xl,
    maxWidth: SCREEN_WIDTH - spacing.xl * 2,
    elevation: 8,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  modalHeader: {
    padding: spacing.xl,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: ColorPalette.neutral[100],
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 22,
  },
  modalBody: {
    padding: spacing.xl,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  confirmLabel: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  confirmValue: {
    fontSize: 16,
    color: ColorPalette.neutral[800],
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    padding: spacing.xl,
    paddingTop: 0,
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  modalButtonGradient: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 48,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[700],
  },
  modalButtonTextPrimary: {
    color: ColorPalette.pure.white,
  },
});

export default CheckoutScreen;
