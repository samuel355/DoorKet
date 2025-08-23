import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Item } from "@/types";
import { useCartStore, useCartActions } from "@/store/cartStore";
import { formatCurrency } from "@/src/utils";
import { ColorPalette } from "@/src/theme/colors";
import { spacing, borderRadius } from "@/src/theme/styling";

interface AddToCartButtonProps {
  item: Item;
  quantity?: number;
  notes?: string;
  onAdded?: () => void;
  onPress?: () => void;
  style?: any;
  showQuantity?: boolean;
  showPrice?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const { width } = Dimensions.get("window");

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  item,
  quantity = 1,
  notes = "",
  onAdded,
  onPress,
  style,
  showQuantity = true,
  showPrice = true,
  disabled = false,
  loading: externalLoading = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const { addItem } = useCartActions();
  const isItemInCart = useCartStore((state) => state.isItemInCart(item.id));
  const itemQuantity = useCartStore((state) => state.getItemQuantity(item.id));
  const isUpdating = useCartStore((state) => state.isUpdating);

  const loading = isLoading || externalLoading || isUpdating;

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;

    // If onPress is provided, call it instead of adding to cart
    if (onPress) {
      onPress();
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLoading(true);

    try {
      const success = await addItem(item, quantity, notes);
      if (success && onAdded) {
        onAdded();
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, [item, quantity, notes, addItem, onAdded, onPress, disabled, loading, scaleAnim]);

  const getButtonText = () => {
    if (loading) return "Adding...";
    if (onPress) return "Select Options";
    if (isItemInCart) return "Add More";
    return "Add to Cart";
  };

  const getButtonIcon = () => {
    if (loading) return "hourglass-outline";
    if (onPress) return "options-outline";
    if (isItemInCart) return "add-circle-outline";
    return "basket-outline";
  };

  const totalPrice = (item.base_price || 0) * quantity;
  const hasValidPrice = item.base_price && item.base_price > 0;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.buttonContent,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={
              disabled
                ? [ColorPalette.neutral[300], ColorPalette.neutral[400]]
                : [ColorPalette.primary[600], ColorPalette.primary[700]]
            }
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.buttonInner}>
              {/* Left side - Icon and Text */}
              <View style={styles.leftContent}>
                <Ionicons
                  name={getButtonIcon()}
                  size={20}
                  color={ColorPalette.pure.white}
                />
                <Text style={styles.buttonText}>
                  {getButtonText()}
                </Text>
              </View>

              {/* Right side - Quantity and Price */}
              <View style={styles.rightContent}>
                {/* Quantity Badge */}
                {showQuantity && quantity > 1 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>×{quantity}</Text>
                  </View>
                )}

                {/* Current cart quantity indicator */}
                {isItemInCart && itemQuantity > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{itemQuantity}</Text>
                  </View>
                )}

                {/* Price */}
                {showPrice && hasValidPrice && (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                      {formatCurrency(totalPrice)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingIndicator}>
            <Ionicons
              name="hourglass-outline"
              size={16}
              color={ColorPalette.pure.white}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  button: {
    borderRadius: borderRadius.xl,
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
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    minHeight: 56,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  quantityBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "600",
    color: ColorPalette.pure.white,
  },
  cartBadge: {
    backgroundColor: ColorPalette.secondary[500],
    borderRadius: borderRadius.full,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: ColorPalette.pure.white,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: ColorPalette.pure.white,
  },
  priceContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: ColorPalette.pure.white,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIndicator: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AddToCartButton;
