import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { Text, Surface } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { CartItem } from "@/types";
import { formatCurrency } from "@/src/utils";
import { ColorPalette } from "@/src/theme/colors";
import { spacing, borderRadius } from "@/src/theme/styling";

interface CartItemCardProps {
  item: CartItem;
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
  onPress?: (item: CartItem) => void;
  onEdit?: (item: CartItem) => void;
  showRemoveButton?: boolean;
  showQuantityControls?: boolean;
  compact?: boolean;
}

const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onQuantityChange,
  onRemove,
  onPress,
  onEdit,
  showRemoveButton = true,
  showQuantityControls = true,
  compact = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const itemName = item.item?.name || item.custom_item_name || "Unknown Item";
  const itemPrice = item.unit_price || item.custom_budget || 0;
  const imageUrl = item.item?.image_url;
  const isCustomItem = !!item.custom_item_name;

  const handleQuantityChange = useCallback(
    async (newQuantity: number) => {
      if (isUpdating) return;

      setIsUpdating(true);
      try {
        if (newQuantity < 1) {
          handleRemove();
          return;
        }
        await onQuantityChange(item.id, newQuantity);
      } finally {
        setIsUpdating(false);
      }
    },
    [item.id, onQuantityChange, isUpdating],
  );

  const handleRemove = useCallback(() => {
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove "${itemName}" from your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onRemove(item.id),
        },
      ],
    );
  }, [item.id, itemName, onRemove]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(item);
    }
  }, [item, onPress]);

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(item);
    }
  }, [item, onEdit]);

  return (
    <Surface
      style={[styles.container, compact && styles.compactContainer]}
      elevation={1}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
        style={onPress ? styles.clickableContainer : undefined}
      >
        <View style={styles.content}>
          {/* Item Image */}
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={[styles.image, compact && styles.compactImage]}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[ColorPalette.primary[100], ColorPalette.primary[200]]}
                style={[
                  styles.imagePlaceholder,
                  compact && styles.compactImage,
                ]}
              >
                <Ionicons
                  name={isCustomItem ? "create-outline" : "image-outline"}
                  size={compact ? 20 : 24}
                  color={ColorPalette.primary[600]}
                />
              </LinearGradient>
            )}

            {/* Custom item badge */}
            {isCustomItem && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>

          {/* Item Details */}
          <View style={styles.details}>
            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.itemName, compact && styles.compactItemName]}
                  numberOfLines={compact ? 1 : 2}
                >
                  {itemName}
                </Text>
                {onPress && item.item?.id && (
                  <Ionicons
                    name="chevron-forward-outline"
                    size={16}
                    color={ColorPalette.primary[500]}
                    style={styles.clickIcon}
                  />
                )}
                {onEdit && isCustomItem && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEdit}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={ColorPalette.primary[600]}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {item.item?.unit && !isCustomItem && (
                <Text style={styles.unit}>per {item.item.unit}</Text>
              )}

              {onPress && item.item?.id && (
                <Text style={styles.clickHint}>Tap to view details</Text>
              )}
            </View>

            {/* Notes */}
            {item.notes && !compact && (
              <Text style={styles.notes} numberOfLines={2}>
                {item.notes}
              </Text>
            )}

            {/* Price and Quantity Row */}
            <View style={styles.bottomRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.unitPrice}>
                  {formatCurrency(itemPrice)}
                  {item.quantity > 1 && (
                    <Text style={styles.quantityMultiplier}>
                      {" "}
                      × {item.quantity}
                    </Text>
                  )}
                </Text>
                <Text style={styles.totalPrice}>
                  {formatCurrency(item.total_price)}
                </Text>
              </View>

              {/* Quantity Controls */}
              {showQuantityControls && (
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      item.quantity <= 1 && styles.quantityButtonDisabled,
                    ]}
                    onPress={() => handleQuantityChange(item.quantity - 1)}
                    disabled={isUpdating || item.quantity <= 1}
                  >
                    <Ionicons
                      name="remove"
                      size={16}
                      color={
                        item.quantity <= 1
                          ? ColorPalette.neutral[400]
                          : ColorPalette.primary[600]
                      }
                    />
                  </TouchableOpacity>

                  <Text style={styles.quantityText}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(item.quantity + 1)}
                    disabled={isUpdating}
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color={ColorPalette.primary[600]}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Remove Button */}
          {showRemoveButton && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
              disabled={isUpdating}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={ColorPalette.error[600]}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: ColorPalette.pure.white,
    overflow: "hidden",
  },
  clickableContainer: {
    borderWidth: 1,
    borderColor: ColorPalette.primary[100],
  },
  compactContainer: {
    marginBottom: spacing.xs,
  },
  content: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "flex-start",
  },
  imageContainer: {
    position: "relative",
    marginRight: spacing.md,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
  },
  compactImage: {
    width: 50,
    height: 50,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  customBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: ColorPalette.secondary[500],
    borderRadius: borderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  customBadgeText: {
    fontSize: 8,
    fontWeight: "600",
    color: ColorPalette.pure.white,
    textTransform: "uppercase",
  },
  details: {
    flex: 1,
    justifyContent: "space-between",
  },
  nameContainer: {
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    lineHeight: 22,
  },
  compactItemName: {
    fontSize: 14,
    lineHeight: 20,
  },
  unit: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
    fontStyle: "italic",
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
    fontStyle: "italic",
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  clickIcon: {
    marginLeft: spacing.xs,
  },
  clickHint: {
    fontSize: 10,
    color: ColorPalette.primary[500],
    fontStyle: "italic",
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {
    flex: 1,
  },
  unitPrice: {
    fontSize: 12,
    color: ColorPalette.neutral[600],
    marginBottom: 2,
  },
  quantityMultiplier: {
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: ColorPalette.primary[600],
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorPalette.neutral[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
  },
  quantityButton: {
    width: 28,
    height: 28,
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
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginHorizontal: spacing.sm,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: ColorPalette.error[50],
    marginLeft: spacing.sm,
    alignSelf: "flex-start",
  },
  editButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: ColorPalette.primary[50],
    marginLeft: spacing.xs,
  },
});

export default CartItemCard;
