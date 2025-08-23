import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Text, Divider, Surface } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Cart } from "@/types";
import { formatCurrency } from "@/src/utils";
import { ColorPalette } from "@/src/theme/colors";
import { spacing, borderRadius } from "@/src/theme/styling";

interface CartSummaryProps {
  cart: Cart;
  onCheckout?: () => void;
  showCheckoutButton?: boolean;
  showDeliveryInfo?: boolean;
  canCheckout?: boolean;
  checkoutButtonText?: string;
  loading?: boolean;
  compact?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  onCheckout,
  showCheckoutButton = true,
  showDeliveryInfo = true,
  canCheckout = true,
  checkoutButtonText = "Proceed to Checkout",
  loading = false,
  compact = false,
}) => {
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const hasItems = cart.items.length > 0;
  const hasDeliveryAddress = cart.delivery_address.trim().length > 0;

  return (
    <Surface style={[styles.container, compact && styles.compactContainer]} elevation={2}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Order Summary</Text>
          <Text style={styles.itemCount}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* Price Breakdown */}
        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(cart.subtotal)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Delivery Fee</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(cart.delivery_fee)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Service Fee</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(cart.service_fee)}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(cart.total)}
          </Text>
        </View>

        {/* Delivery Info */}
        {showDeliveryInfo && !compact && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryHeader}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={ColorPalette.primary[600]}
                />
                <Text style={styles.deliveryTitle}>Delivery Address</Text>
              </View>

              {hasDeliveryAddress ? (
                <Text style={styles.deliveryAddress} numberOfLines={2}>
                  {cart.delivery_address}
                </Text>
              ) : (
                <Text style={styles.noAddress}>
                  No delivery address set
                </Text>
              )}

              {cart.special_instructions && (
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsLabel}>Special Instructions:</Text>
                  <Text style={styles.instructions} numberOfLines={2}>
                    {cart.special_instructions}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Checkout Button */}
        {showCheckoutButton && (
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              (!canCheckout || !hasItems) && styles.checkoutButtonDisabled,
            ]}
            onPress={onCheckout}
            disabled={!canCheckout || !hasItems || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                canCheckout && hasItems
                  ? [ColorPalette.primary[600], ColorPalette.primary[700]]
                  : [ColorPalette.neutral[300], ColorPalette.neutral[400]]
              }
              style={styles.checkoutButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.checkoutButtonContent}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.checkoutButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.checkoutButtonText}>
                      {checkoutButtonText}
                    </Text>
                    <View style={styles.checkoutButtonPrice}>
                      <Text style={styles.checkoutButtonPriceText}>
                        {formatCurrency(cart.total)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Checkout Requirements */}
        {showCheckoutButton && (!canCheckout || !hasItems) && (
          <View style={styles.requirementsContainer}>
            {!hasItems && (
              <View style={styles.requirement}>
                <Ionicons
                  name="alert-circle-outline"
                  size={14}
                  color={ColorPalette.warning[600]}
                />
                <Text style={styles.requirementText}>
                  Add items to your cart to continue
                </Text>
              </View>
            )}

            {hasItems && !hasDeliveryAddress && (
              <View style={styles.requirement}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={ColorPalette.warning[600]}
                />
                <Text style={styles.requirementText}>
                  Add delivery address to continue
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    backgroundColor: ColorPalette.pure.white,
    overflow: "hidden",
  },
  compactContainer: {
    borderRadius: borderRadius.md,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
  },
  itemCount: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    fontWeight: "500",
  },
  divider: {
    marginVertical: spacing.md,
    backgroundColor: ColorPalette.neutral[200],
  },
  breakdown: {
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  breakdownLabel: {
    fontSize: 14,
    color: ColorPalette.neutral[700],
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    backgroundColor: ColorPalette.primary[50],
    paddingHorizontal: spacing.md,
    marginHorizontal: -spacing.md,
    borderRadius: borderRadius.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: ColorPalette.primary[700],
  },
  deliveryInfo: {
    marginTop: spacing.sm,
  },
  deliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    marginLeft: spacing.xs,
  },
  deliveryAddress: {
    fontSize: 14,
    color: ColorPalette.neutral[700],
    lineHeight: 20,
    marginLeft: spacing.lg + spacing.xs,
  },
  noAddress: {
    fontSize: 14,
    color: ColorPalette.warning[600],
    fontStyle: "italic",
    marginLeft: spacing.lg + spacing.xs,
  },
  instructionsContainer: {
    marginTop: spacing.sm,
    marginLeft: spacing.lg + spacing.xs,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: ColorPalette.neutral[600],
    marginBottom: spacing.xs / 2,
  },
  instructions: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
    lineHeight: 16,
    fontStyle: "italic",
  },
  checkoutButton: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: ColorPalette.primary[600],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkoutButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  checkoutButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    flex: 1,
  },
  checkoutButtonPrice: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  checkoutButtonPriceText: {
    fontSize: 14,
    fontWeight: "700",
    color: ColorPalette.pure.white,
  },
  requirementsContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: ColorPalette.warning[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: ColorPalette.warning[200],
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  requirementText: {
    fontSize: 12,
    color: ColorPalette.warning[700],
    marginLeft: spacing.xs,
    flex: 1,
  },
});

export default CartSummary;
