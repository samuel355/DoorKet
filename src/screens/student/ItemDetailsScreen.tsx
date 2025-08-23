import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Portal, Modal } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { Loading, ErrorState, Input } from "../../components/common";
import { useCartStore, useCartActions } from "@/store/cartStore";
import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";
import { Item } from "@/types";
import { ItemService } from "@/services/itemService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.5;
const HEADER_HEIGHT = 100;

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
  // Cart store hooks
  const {
    isItemInCart,
    getItemQuantity,
    error: cartError,
    clearError,
  } = useCartStore();
  const {
    addItem,
    updateQuantity: updateCartQuantity,
    removeItem: removeFromCart,
  } = useCartActions();

  // State
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;

  // Animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - HEADER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const imageParallax = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT],
    outputRange: [0, -IMAGE_HEIGHT * 0.5],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  });

  const startAnimations = useCallback(() => {
    // Stagger entrance animations
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
      Animated.spring(cardScale, {
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
  }, [floatAnim, cardScale, slideUpAnim, fadeAnim, scaleAnim]);

  // Load item details
  const loadItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await ItemService.getItemById(itemId);

      if (error) {
        throw new Error(error);
      }

      if (!data) {
        throw new Error("Item not found");
      }

      setItem(data);
      startAnimations();
    } catch (err: any) {
      console.error("Error loading item:", err);
      setError(err.message || "Failed to load item details");
    } finally {
      setLoading(false);
    }
  }, [itemId, startAnimations]);

  // Check if item is in cart and get quantity
  const itemInCart = item ? isItemInCart(item.id) : false;
  const cartQuantity = item ? getItemQuantity(item.id) : 0;

  // Handle quantity change
  const updateQuantity = (increment: boolean) => {
    if (itemInCart) {
      // Update cart quantity directly
      const newQuantity = increment ? cartQuantity + 1 : cartQuantity - 1;
      if (newQuantity <= 0) {
        removeFromCart(item!.id);
      } else {
        updateCartQuantity(item!.id, Math.min(newQuantity, 99));
      }
    } else {
      // Update local state for new items
      setQuantity((prev) => {
        if (increment) {
          return Math.min(prev + 1, 99);
        } else {
          return Math.max(prev - 1, 1);
        }
      });
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!item) return;

    try {
      setCartLoading(true);

      // Clear any previous cart errors
      clearError();

      console.log("DEBUG: Adding item to cart:", {
        itemId: item.id,
        itemName: item.name,
        quantity,
        notes: notes.trim() || undefined,
        itemInCart,
        currentCartQuantity: cartQuantity,
      });

      // Add the selected quantity to cart using cart store
      addItem(item, quantity, notes.trim() || undefined);

      // Check for cart errors after adding
      setTimeout(() => {
        const currentError = useCartStore.getState().error;
        if (currentError) {
          console.error("Cart store error:", currentError);
          Alert.alert("Error", currentError);
          return;
        }

        console.log("DEBUG: Item successfully added to cart store");

        Alert.alert("Success", `${item.name} (${quantity}) added to cart!`, [
          {
            text: "Continue Shopping",
            style: "cancel",
          },
          {
            text: "View Cart",
            onPress: () => navigation.navigate("CartTab"),
          },
        ]);

        // Reset form only if item wasn't in cart before
        if (!itemInCart) {
          setQuantity(1);
          setNotes("");
        }
      }, 100);
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
    } finally {
      setCartLoading(false);
    }
  };

  // Handle favorite toggle
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);

    // Heart animation
    Animated.sequence([
      Animated.spring(heartScaleAnim, {
        toValue: 1.3,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(heartScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const currentQuantity = itemInCart ? cartQuantity : quantity;
  const totalPrice = (item?.base_price || 0) * currentQuantity;
  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

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
        actionText="Try Again"
        onActionPress={() => loadItem()}
        secondaryActionText="Go Back"
        onSecondaryActionPress={() => navigation.goBack()}
      />
    );
  }

  const renderFloatingHeader = () => (
    <Animated.View
      style={[styles.floatingHeader, { opacity: headerOpacity }]}
      pointerEvents="box-none"
    >
      <BlurView intensity={100} tint="dark" style={styles.headerBlur}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.3)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                style={styles.headerButtonGradient}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {item.name}
            </Text>

            <TouchableOpacity style={styles.headerButton} onPress={() => {}}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.3)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                style={styles.headerButtonGradient}
              >
                <Ionicons name="share-outline" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>
    </Animated.View>
  );

  const renderImageSection = () => (
    <View style={styles.imageSection}>
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ translateY: imageParallax }, { scale: imageScale }],
          },
        ]}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        ) : (
          <LinearGradient
            colors={[ColorPalette.neutral[200], ColorPalette.neutral[100]]}
            style={styles.placeholderImage}
          >
            <Ionicons
              name="image-outline"
              size={80}
              color={ColorPalette.neutral[400]}
            />
          </LinearGradient>
        )}

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
      </Animated.View>

      {/* Fixed Action Buttons */}
      <SafeAreaView
        style={styles.actionButtonsContainer}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.5)"]}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.actionButtonsRight}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleFavorite}
          >
            <LinearGradient
              colors={
                isFavorite
                  ? [ColorPalette.error[500], ColorPalette.error[400]]
                  : ["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.5)"]
              }
              style={styles.actionButtonGradient}
            >
              <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color="#ffffff"
                />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <LinearGradient
              colors={["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.5)"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="share-outline" size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  const renderContentSection = () => (
    <Animated.View
      style={[
        styles.contentSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* Availability Status */}
      <View style={styles.statusContainer}>
        <LinearGradient
          colors={
            item.is_available
              ? [
                  ColorPalette.success[500] + "20",
                  ColorPalette.success[500] + "10",
                ]
              : [ColorPalette.error[500] + "20", ColorPalette.error[500] + "10"]
          }
          style={styles.statusBadge}
        >
          <Ionicons
            name={item.is_available ? "checkmark-circle" : "close-circle"}
            size={16}
            color={
              item.is_available
                ? ColorPalette.success[600]
                : ColorPalette.error[600]
            }
          />
          <Text
            style={[
              styles.statusText,
              {
                color: item.is_available
                  ? ColorPalette.success[600]
                  : ColorPalette.error[600],
              },
            ]}
          >
            {item.is_available ? "Available" : "Out of Stock"}
          </Text>
        </LinearGradient>
      </View>

      {/* Item Name and Category */}
      <View style={styles.titleSection}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.category && (
          <View style={styles.categoryContainer}>
            <LinearGradient
              colors={[ColorPalette.primary[100], ColorPalette.primary[50]]}
              style={styles.categoryBadge}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={ColorPalette.primary[600]}
              />
              <Text style={styles.categoryText}>{item.category.name}</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Price Section */}
      <LinearGradient
        colors={[ColorPalette.primary[50], ColorPalette.primary[50]]}
        style={styles.priceSection}
      >
        <View style={styles.priceContent}>
          <Text style={styles.priceLabel}>Price per {item.unit}</Text>
          {item.base_price ? (
            <Text style={styles.priceValue}>
              GHS {item.base_price.toFixed(2)}
            </Text>
          ) : (
            <Text style={styles.priceValue}>Ask for price</Text>
          )}
        </View>
        <View style={styles.priceIcon}>
          <LinearGradient
            colors={[ColorPalette.primary[200], ColorPalette.primary[100]]}
            style={styles.priceIconGradient}
          >
            <Ionicons
              name="pricetag"
              size={20}
              color={ColorPalette.primary[600]}
            />
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Description */}
      {item.description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <LinearGradient
            colors={[ColorPalette.neutral[50], ColorPalette.pure.white]}
            style={styles.descriptionCard}
          >
            <Text style={styles.description}>{item.description}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag: string, index: number) => (
                <LinearGradient
                  key={index}
                  colors={[ColorPalette.accent[100], ColorPalette.accent[50]]}
                  style={styles.tagBadge}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </LinearGradient>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Order Section - Always show when item is available */}
      {item.is_available && (
        <LinearGradient
          colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
          style={styles.orderSection}
        >
          <Text style={styles.sectionTitle}>Order Details</Text>

          {/* Quantity Selector */}
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>
              {itemInCart ? "Add More" : "Quantity"}
            </Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  currentQuantity <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={() => updateQuantity(false)}
                disabled={currentQuantity <= 1}
              >
                <LinearGradient
                  colors={
                    currentQuantity <= 1
                      ? [ColorPalette.neutral[200], ColorPalette.neutral[100]]
                      : [ColorPalette.primary[200], ColorPalette.primary[100]]
                  }
                  style={styles.quantityButtonGradient}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={
                      currentQuantity <= 1
                        ? ColorPalette.neutral[400]
                        : ColorPalette.primary[600]
                    }
                  />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityValue}>{currentQuantity}</Text>
              </View>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(true)}
                disabled={currentQuantity >= 99}
              >
                <LinearGradient
                  colors={[
                    ColorPalette.primary[200],
                    ColorPalette.primary[100],
                  ]}
                  style={styles.quantityButtonGradient}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={ColorPalette.primary[600]}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Special Instructions */}
          <TouchableOpacity
            style={styles.notesRow}
            onPress={() => setShowNotesModal(true)}
          >
            <View style={styles.notesContent}>
              <Text style={styles.notesLabel}>Special Instructions</Text>
              <Text style={styles.notesPreview} numberOfLines={2}>
                {notes.trim() || "Add any special instructions..."}
              </Text>
            </View>
            <LinearGradient
              colors={[ColorPalette.secondary[100], ColorPalette.secondary[50]]}
              style={styles.notesIcon}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={ColorPalette.secondary[600]}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Total */}
          {item.base_price && (
            <LinearGradient
              colors={[ColorPalette.primary[500], ColorPalette.primary[400]]}
              style={styles.totalSection}
            >
              <View style={styles.totalContent}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  GHS {totalPrice.toFixed(2)}
                </Text>
              </View>
            </LinearGradient>
          )}
        </LinearGradient>
      )}

      {/* In Cart Status - Show info when item is in cart */}
      {item.is_available && itemInCart && (
        <View style={styles.inCartInfo}>
          <LinearGradient
            colors={[ColorPalette.success[100], ColorPalette.success[50]]}
            style={styles.inCartBadge}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={ColorPalette.success[600]}
            />
            <Text style={styles.inCartText}>
              Already in cart: {cartQuantity} {item.unit}
            </Text>
          </LinearGradient>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {renderImageSection()}
        {renderContentSection()}
      </Animated.ScrollView>

      {renderFloatingHeader()}

      {/* Add to Cart Button */}
      {item && item.is_available && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            disabled={cartLoading}
          >
            <LinearGradient
              colors={[ColorPalette.primary[600], ColorPalette.primary[500]]}
              style={styles.addToCartGradient}
            >
              {cartLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.addToCartText}>Adding...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="cart" size={24} color="#ffffff" />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Notes Modal */}
      <Portal>
        <Modal
          visible={showNotesModal}
          onDismiss={() => setShowNotesModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <LinearGradient
            colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
            style={styles.modalContent}
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
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowNotesModal(false)}
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
                onPress={() => setShowNotesModal(false)}
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
                    Save
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Floating Header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    height: HEADER_HEIGHT,
  },
  headerSafeArea: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
  },
  headerButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginHorizontal: spacing.md,
  },

  // Image Section
  imageSection: {
    height: IMAGE_HEIGHT,
    position: "relative",
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    overflow: "hidden",
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
  },
  floatingElement: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.full,
  },
  element1: {
    width: 80,
    height: 80,
    top: "20%",
    left: "10%",
  },
  element2: {
    width: 60,
    height: 60,
    top: "70%",
    right: "15%",
  },

  // Action Buttons
  actionButtonsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  actionButton: {
    marginHorizontal: spacing.xs,
  },
  actionButtonsRight: {
    flexDirection: "row",
  },
  actionButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // Content Section
  contentSection: {
    marginTop: -spacing.xl,
    backgroundColor: "transparent",
    paddingHorizontal: spacing.lg,
  },

  // Status
  statusContainer: {
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "600",
  },

  // Title Section
  titleSection: {
    backgroundColor: ColorPalette.pure.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  itemName: {
    fontSize: 28,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.md,
    lineHeight: 34,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  categoryText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.primary[600],
  },

  // Price Section
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  priceContent: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginBottom: spacing.xs,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: ColorPalette.primary[600],
  },
  priceIcon: {
    marginLeft: spacing.lg,
  },
  priceIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  // Description Section
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.md,
  },
  descriptionCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    elevation: 2,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: ColorPalette.neutral[700],
    lineHeight: 24,
  },

  // Tags Section
  tagsSection: {
    marginBottom: spacing.lg,
  },
  tagsContainer: {
    flexDirection: "row",
    paddingRight: spacing.lg,
  },
  tagBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.accent[600],
  },

  // Order Section
  orderSection: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },

  // Quantity Controls
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorPalette.neutral[100],
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  quantityButton: {
    width: 44,
    height: 44,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityDisplay: {
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.neutral[800],
  },

  // Notes Section
  notesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ColorPalette.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  notesContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.xs,
  },
  notesPreview: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    lineHeight: 20,
  },
  notesIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Total Section
  totalSection: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  totalContent: {
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.pure.white,
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
  },

  // Bottom Container
  bottomContainer: {
    position: "absolute",
    bottom: 90, // Add margin to avoid tab overlap
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
  addToCartButton: {
    borderRadius: borderRadius.xl,
    elevation: 4,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  addToCartGradient: {
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
  addToCartText: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal Styles
  modalContainer: {
    backgroundColor: "transparent",
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
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
    marginBottom: spacing.xl,
    textAlign: "center",
    lineHeight: 24,
  },
  notesInput: {
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
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

  // In Cart Status
  inCartInfo: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  inCartBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  inCartText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.success[700],
  },
});

export default ItemDetailsScreen;
