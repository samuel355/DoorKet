import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Divider,
  Portal,
  Modal,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Loading, ErrorState, Input } from "../../components/common";
import { useCart } from "../../hooks";
import { SupabaseService } from "../../services/supabase";
import { Item, Category } from "../../types";
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from "../../constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ItemDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      itemId: string;
    };
  };
}

const ItemDetailsScreen: React.FC<ItemDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { itemId } = route.params;
  const { addItem, loading: cartLoading } = useCart();

  // State
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load item details
  const loadItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await SupabaseService.getItemById(itemId);

      if (error) {
        throw new Error(error);
      }

      if (!data) {
        throw new Error("Item not found");
      }

      setItem(data);
    } catch (err: any) {
      console.error("Error loading item:", err);
      setError(err.message || "Failed to load item details");
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  // Handle quantity change
  const updateQuantity = (increment: boolean) => {
    setQuantity((prev) => {
      if (increment) {
        return Math.min(prev + 1, 99);
      } else {
        return Math.max(prev - 1, 1);
      }
    });
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!item) return;

    try {
      const success = await addItem(item, quantity, notes.trim() || undefined);
      if (success) {
        Alert.alert("Success", `${item.name} (${quantity}) added to cart!`, [
          {
            text: "Continue Shopping",
            style: "cancel",
          },
          {
            text: "View Cart",
            onPress: () => navigation.navigate("Cart"),
          },
        ]);

        // Reset form
        setQuantity(1);
        setNotes("");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
    }
  };

  // Handle favorite toggle
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would typically save to backend or local storage
  };

  // Handle share
  const handleShare = () => {
    if (!item) return;

    Alert.alert("Share Item", `Share "${item.name}" with friends?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Share", onPress: () => console.log("Share item") },
    ]);
  };

  // Calculate total price
  const totalPrice = (item?.base_price || 0) * quantity;

  // Effects
  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem]),
  );

  // Loading state
  if (loading) {
    return <Loading text="Loading item details..." />;
  }

  // Error state
  if (error || !item) {
    return (
      <ErrorState
        title="Item Not Found"
        subtitle={error || "The item you are looking for does not exist"}
        onRetry={() => loadItem()}
        actionTitle="Go Back"
        onAction={() => navigation.goBack()}
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
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={COLORS.WHITE}
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerActionsRight}>
            <IconButton
              icon={isFavorite ? "heart" : "heart-outline"}
              size={24}
              iconColor={COLORS.WHITE}
              style={styles.headerButton}
              onPress={toggleFavorite}
            />
            <IconButton
              icon="share-variant"
              size={24}
              iconColor={COLORS.WHITE}
              style={styles.headerButton}
              onPress={handleShare}
            />
          </View>
        </View>

        {/* Item Image */}
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name="image-outline"
                size={64}
                color={COLORS.GRAY_400}
              />
            </View>
          )}
        </View>

        {/* Item Info */}
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            {/* Availability Status */}
            <View style={styles.statusContainer}>
              <Chip
                icon={item.is_available ? "check-circle" : "close-circle"}
                style={[
                  styles.statusChip,
                  item.is_available
                    ? styles.availableChip
                    : styles.unavailableChip,
                ]}
                textStyle={[
                  styles.statusText,
                  item.is_available
                    ? styles.availableText
                    : styles.unavailableText,
                ]}
              >
                {item.is_available ? "Available" : "Unavailable"}
              </Chip>
            </View>

            {/* Item Name */}
            <Text style={styles.itemName}>{item.name}</Text>

            {/* Category */}
            {item.category && (
              <View style={styles.categoryContainer}>
                <Ionicons
                  name="grid-outline"
                  size={16}
                  color={COLORS.TEXT_SECONDARY}
                />
                <Text style={styles.categoryText}>{item.category.name}</Text>
              </View>
            )}

            {/* Price and Unit */}
            <View style={styles.priceContainer}>
              <View style={styles.priceInfo}>
                <Text style={styles.priceLabel}>Price per {item.unit}</Text>
                {item.base_price ? (
                  <Text style={styles.priceValue}>
                    GHS {item.base_price.toFixed(2)}
                  </Text>
                ) : (
                  <Text style={styles.priceValue}>Ask for price</Text>
                )}
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Description */}
            {item.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsContent}>
                  {item.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      style={styles.tag}
                      textStyle={styles.tagText}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Additional Info */}
            <View style={styles.additionalInfo}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color={COLORS.TEXT_SECONDARY}
                />
                <Text style={styles.infoLabel}>Unit: </Text>
                <Text style={styles.infoValue}>{item.unit}</Text>
              </View>

              {item.barcode && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="barcode-outline"
                    size={16}
                    color={COLORS.TEXT_SECONDARY}
                  />
                  <Text style={styles.infoLabel}>Barcode: </Text>
                  <Text style={styles.infoValue}>{item.barcode}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Quantity and Notes */}
        {item.is_available && (
          <Card style={styles.orderCard}>
            <Card.Content style={styles.orderContent}>
              <Text style={styles.sectionTitle}>Order Details</Text>

              {/* Quantity Selector */}
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <IconButton
                    icon="minus"
                    size={20}
                    iconColor={COLORS.PRIMARY}
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(false)}
                    disabled={quantity <= 1}
                  />
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <IconButton
                    icon="plus"
                    size={20}
                    iconColor={COLORS.PRIMARY}
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(true)}
                    disabled={quantity >= 99}
                  />
                </View>
              </View>

              {/* Notes */}
              <TouchableOpacity
                style={styles.notesContainer}
                onPress={() => setShowNotesModal(true)}
              >
                <Text style={styles.notesLabel}>Special Instructions</Text>
                <View style={styles.notesPreview}>
                  <Text style={styles.notesText} numberOfLines={2}>
                    {notes.trim() || "Add any special instructions..."}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.TEXT_SECONDARY}
                  />
                </View>
              </TouchableOpacity>

              {/* Total Price */}
              {item.base_price && (
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    GHS {totalPrice.toFixed(2)}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Add to Cart Button */}
      {item.is_available && (
        <View style={styles.bottomContainer}>
          <Button
            mode="contained"
            onPress={handleAddToCart}
            loading={cartLoading}
            disabled={cartLoading}
            style={styles.addToCartButton}
            contentStyle={styles.addToCartContent}
            labelStyle={styles.addToCartLabel}
            icon="cart-plus"
          >
            Add to Cart
          </Button>
        </View>
      )}

      {/* Notes Modal */}
      <Portal>
        <Modal
          visible={showNotesModal}
          onDismiss={() => setShowNotesModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Special Instructions</Text>
          <Text style={styles.modalSubtitle}>
            Add any special instructions for this item
          </Text>

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g., Extra spicy, no onions, etc."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowNotesModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowNotesModal(false)}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
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
  headerActions: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.MD,
    zIndex: 1,
  },
  headerButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    margin: 0,
  },
  headerActionsRight: {
    flexDirection: "row",
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.8,
    backgroundColor: COLORS.GRAY_100,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.GRAY_100,
  },
  infoCard: {
    margin: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
  },
  infoContent: {
    padding: SPACING.LG,
  },
  statusContainer: {
    alignItems: "flex-start",
    marginBottom: SPACING.MD,
  },
  statusChip: {
    height: 32,
  },
  availableChip: {
    backgroundColor: COLORS.SUCCESS + "20",
  },
  unavailableChip: {
    backgroundColor: COLORS.ERROR + "20",
  },
  statusText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  availableText: {
    color: COLORS.SUCCESS,
  },
  unavailableText: {
    color: COLORS.ERROR,
  },
  itemName: {
    fontSize: FONTS.SIZE.XXXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    lineHeight: FONTS.LINE_HEIGHT.TIGHT * FONTS.SIZE.XXXL,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.LG,
  },
  categoryText: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  priceContainer: {
    marginBottom: SPACING.LG,
  },
  priceInfo: {
    alignItems: "flex-start",
  },
  priceLabel: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  priceValue: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  divider: {
    marginVertical: SPACING.LG,
  },
  descriptionContainer: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  description: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: FONTS.LINE_HEIGHT.RELAXED * FONTS.SIZE.MD,
  },
  tagsContainer: {
    marginBottom: SPACING.LG,
  },
  tagsContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.SM,
  },
  tag: {
    backgroundColor: COLORS.GRAY_100,
    height: 32,
  },
  tagText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  additionalInfo: {
    gap: SPACING.SM,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  infoValue: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  orderCard: {
    margin: SPACING.LG,
    marginTop: 0,
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
  },
  orderContent: {
    padding: SPACING.LG,
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.LG,
  },
  quantityLabel: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
  },
  quantityButton: {
    margin: 0,
    width: 40,
    height: 40,
  },
  quantityValue: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    minWidth: 30,
    textAlign: "center",
  },
  notesContainer: {
    marginBottom: SPACING.LG,
  },
  notesLabel: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    marginBottom: SPACING.SM,
  },
  notesPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  notesText: {
    flex: 1,
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
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
  addToCartButton: {
    borderRadius: BORDER_RADIUS.LG,
  },
  addToCartContent: {
    height: 56,
  },
  addToCartLabel: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
  },
  modalTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  modalSubtitle: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
  },
  notesInput: {
    marginBottom: SPACING.LG,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.MD,
  },
  modalButton: {
    minWidth: 80,
  },
});

export default ItemDetailsScreen;
