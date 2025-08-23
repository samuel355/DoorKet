import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Text, Surface } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Item } from "@/types";
import { useCartStore, useCartActions } from "@/store/cartStore";
import { formatCurrency } from "@/src/utils";
import { ColorPalette } from "@/src/theme/colors";
import { spacing, borderRadius } from "@/src/theme/styling";

interface QuickAddItemProps {
  item: Item;
  onPress?: (item: Item) => void;
  showImage?: boolean;
  compact?: boolean;
  style?: any;
}

const { width } = Dimensions.get("window");

const QuickAddItem: React.FC<QuickAddItemProps> = ({
  item,
  onPress,
  showImage = true,
  compact = false,
  style,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { addItem } = useCartActions();
  const isItemInCart = useCartStore((state) => state.isItemInCart(item.id));
  const itemQuantity = useCartStore((state) => state.getItemQuantity(item.id));
  const isUpdating = useCartStore((state) => state.isUpdating);

  const handleAddToCart = useCallback(async () => {
    if (isAdding || isUpdating) return;

    setIsAdding(true);
    try {
      await addItem(item, quantity);
      setQuantity(1); // Reset quantity after adding
    } finally {
      setIsAdding(false);
    }
  }, [item, quantity, addItem, isAdding, isUpdating]);

  const handleItemPress = useCallback(() => {
    if (onPress) {
      onPress(item);
    }
  }, [item, onPress]);

  const increaseQuantity = useCallback(() => {
    setQuantity(prev => Math.min(prev + 1, 99));
  }, []);

  const decreaseQuantity = useCallback(() => {
    setQuantity(prev => Math.max(prev - 1, 1));
  }, []);

  const totalPrice = (item.base_price || 0) * quantity;
  const hasValidPrice = item.base_price && item.base_price > 0;

  return (
    <Surface style={[styles.container, compact && styles.compactContainer, style]} elevation={1}>
      <TouchableOpacity
        style={styles.content}
        onPress={handleItemPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        {/* Item Image */}
        {showImage && (
          <View style={styles.imageContainer}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={[styles.image, compact && styles.compactImage]}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[ColorPalette.primary[100], ColorPalette.primary[200]]}
                style={[styles.imagePlaceholder, compact && styles.compactImage]}
              >
                <Ionicons
                  name="image-outline"
                  size={compact ? 16 : 20}
                  color={ColorPalette.primary[600]}
                />
              </LinearGradient>
            )}

            {/* Cart indicator */}
            {isItemInCart && itemQuantity > 0 && (
              <View style={styles.cartIndicator}>
                <Text style={styles.cartIndicatorText}>{itemQuantity}</Text>
              </View>
            )}
          </View>
        )}

        {/* Item Details */}
        <View style={styles.details}>
          <Text
            style={[styles.itemName, compact && styles.compactItemName]}
            numberOfLines={compact ? 1 : 2}
          >
            {item.name}
          </Text>

          {item.unit && (
            <Text style={styles.unit}>per {item.unit}</Text>
          )}

          {hasValidPrice && (
            <Text style={styles.price}>
              {formatCurrency(item.base_price!)}
            </Text>
          )}

          {!item.is_available && (
            <Text style={styles.unavailable}>Out of Stock</Text>
          )}
        </View>

        {/* Add to Cart Controls */}
        {item.is_available && hasValidPrice && (
          <View style={styles.addControls}>
            {/* Quantity Selector */}
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={decreaseQuantity}
                disabled={quantity <= 1 || isAdding}
              >
                <Ionicons
                  name="remove"
                  size={14}
                  color={
                    quantity <= 1
                      ? ColorPalette.neutral[400]
                      : ColorPalette.primary[600]
                  }
                />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={increaseQuantity}
                disabled={isAdding || quantity >= 99}
              >
                <Ionicons
                  name="add"
                  size={14}
                  color={ColorPalette.primary[600]}
                />
              </TouchableOpacity>
            </View>

            {/* Add Button */}
            <TouchableOpacity
              style={[
                styles.addButton,
                (isAdding || isUpdating) && styles.addButtonDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={isAdding || isUpdating}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isAdding || isUpdating
                    ? [ColorPalette.neutral[300], ColorPalette.neutral[400]]
                    : [ColorPalette.primary[600], ColorPalette.primary[700]]
                }
                style={styles.addButtonGradient}
              >
                <Ionicons
                  name={
                    isAdding || isUpdating
                      ? "hourglass-outline"
                      : isItemInCart
                      ? "add-circle-outline"
                      : "basket-outline"
                  }
                  size={16}
                  color={ColorPalette.pure.white}
                />
                {!compact && (
                  <Text style={styles.addButtonText}>
                    {isAdding || isUpdating
                      ? "Adding..."
                      : isItemInCart
                      ? "Add More"
                      : "Add"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Total Price */}
            {quantity > 1 && (
              <Text style={styles.totalPrice}>
                {formatCurrency(totalPrice)}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: ColorPalette.pure.white,
    overflow: "hidden",
  },
  compactContainer: {
    marginBottom: spacing.xs,
  },
  content: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    marginRight: spacing.md,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  compactImage: {
    width: 45,
    height: 45,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cartIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: ColorPalette.secondary[500],
    borderRadius: borderRadius.full,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: ColorPalette.pure.white,
  },
  cartIndicatorText: {
    fontSize: 10,
    fontWeight: "700",
    color: ColorPalette.pure.white,
  },
  details: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    lineHeight: 20,
    marginBottom: spacing.xs / 2,
  },
  compactItemName: {
    fontSize: 14,
    lineHeight: 18,
  },
  unit: {
    fontSize: 11,
    color: ColorPalette.neutral[500],
    fontStyle: "italic",
    marginBottom: spacing.xs / 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: ColorPalette.primary[600],
  },
  unavailable: {
    fontSize: 12,
    color: ColorPalette.error[600],
    fontWeight: "600",
    fontStyle: "italic",
  },
  addControls: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorPalette.neutral[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    marginBottom: spacing.xs,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    backgroundColor: ColorPalette.pure.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: ColorPalette.neutral[900],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityButtonDisabled: {
    backgroundColor: ColorPalette.neutral[100],
  },
  quantityText: {
    fontSize: 13,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginHorizontal: spacing.sm,
    minWidth: 16,
    textAlign: "center",
  },
  addButton: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    shadowColor: ColorPalette.primary[600],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 60,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    marginLeft: spacing.xs,
  },
  totalPrice: {
    fontSize: 11,
    fontWeight: "600",
    color: ColorPalette.primary[600],
    marginTop: spacing.xs / 2,
    textAlign: "center",
  },
});

export default QuickAddItem;
