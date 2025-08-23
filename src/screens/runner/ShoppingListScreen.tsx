import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Checkbox,
  Divider,
  FAB,
  Portal,
  Dialog,
  TextInput as PaperTextInput,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RunnerStackParamList, Order, OrderItem } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";

type ShoppingListNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "ShoppingList"
>;

type ShoppingListRouteProp = RouteProp<RunnerStackParamList, "ShoppingList">;

interface ShoppingListProps {
  navigation: ShoppingListNavigationProp;
  route: ShoppingListRouteProp;
}

interface ShoppingItem extends OrderItem {
  isCompleted: boolean;
  actualPrice?: number;
  notes?: string;
}

const { width } = Dimensions.get("window");

const ShoppingListScreen: React.FC<ShoppingListProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalEstimated, setTotalEstimated] = useState(0);
  const [totalActual, setTotalActual] = useState(0);

  // Modal states
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [actualPrice, setActualPrice] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadOrderAndItems();
    startAnimations();
  }, [orderId]);

  useEffect(() => {
    updateProgress();
  }, [shoppingItems]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadOrderAndItems = async () => {
    try {
      setIsLoading(true);
      const result = await OrderService.getOrderById(orderId);
      if (result.data) {
        setOrder(result.data);

        // Convert order items to shopping items
        const items: ShoppingItem[] = (result.data.order_items || []).map(
          (item: any) => ({
            ...item,
            isCompleted: false,
            actualPrice: item.unit_price || 0,
            notes: item.notes || "",
          }),
        );

        setShoppingItems(items);

        // Calculate initial totals
        const estimated = items.reduce(
          (sum, item) =>
            sum + (item.unit_price || item.custom_budget || 0) * item.quantity,
          0,
        );
        setTotalEstimated(estimated);
      }
    } catch (error) {
      console.error("Failed to load order:", error);
      Alert.alert("Error", "Failed to load shopping list");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = () => {
    const completed = shoppingItems.filter((item) => item.isCompleted).length;
    setCompletedCount(completed);

    const actual = shoppingItems.reduce(
      (sum, item) => sum + (item.actualPrice || 0) * item.quantity,
      0,
    );
    setTotalActual(actual);

    // Animate progress bar
    const progress =
      shoppingItems.length > 0 ? completed / shoppingItems.length : 0;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleItemCompletion = (itemId: string) => {
    setShoppingItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    );
  };

  const openPriceModal = (item: ShoppingItem) => {
    setSelectedItem(item);
    setActualPrice((item.actualPrice || 0).toString());
    setItemNotes(item.notes || "");
    setPriceModalVisible(true);
  };

  const savePriceUpdate = () => {
    if (!selectedItem) return;

    const price = parseFloat(actualPrice) || 0;
    setShoppingItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              actualPrice: price,
              notes: itemNotes,
              isCompleted: price > 0, // Auto-complete when price is set
            }
          : item,
      ),
    );

    setPriceModalVisible(false);
    setSelectedItem(null);
    setActualPrice("");
    setItemNotes("");
  };

  const handleStartDelivery = async () => {
    const incompleteItems = shoppingItems.filter((item) => !item.isCompleted);

    if (incompleteItems.length > 0) {
      Alert.alert(
        "Incomplete Shopping",
        `You have ${incompleteItems.length} items not yet completed. Continue anyway?`,
        [
          { text: "Continue Shopping", style: "cancel" },
          { text: "Start Delivery", onPress: proceedToDelivery },
        ],
      );
    } else {
      proceedToDelivery();
    }
  };

  const proceedToDelivery = async () => {
    try {
      // Update order status to delivering
      const result = await OrderService.updateOrderStatusWithResult(
        orderId,
        "delivering",
      );
      if (result.success) {
        navigation.navigate("DeliveryNavigation", { orderId });
      } else {
        Alert.alert("Error", result.message || "Failed to start delivery");
      }
    } catch (error) {
      console.error("Start delivery error:", error);
      Alert.alert("Error", "Failed to start delivery");
    }
  };

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const renderProgressHeader = () => (
    <Animated.View
      style={[
        styles.progressContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={styles.progressCard}>
        <Card.Content style={styles.progressContent}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Shopping Progress</Text>
            <Text style={styles.progressText}>
              {completedCount} of {shoppingItems.length} items completed
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(
                (completedCount / Math.max(shoppingItems.length, 1)) * 100,
              )}
              %
            </Text>
          </View>

          <View style={styles.totalsContainer}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Estimated:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(totalEstimated)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Actual:</Text>
              <Text
                style={[
                  styles.totalValue,
                  {
                    color: totalActual > totalEstimated ? "#FF5722" : "#4CAF50",
                  },
                ]}
              >
                {formatCurrency(totalActual)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  const renderShoppingItem = ({
    item,
    index,
  }: {
    item: ShoppingItem;
    index: number;
  }) => (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 30 * (index + 1)],
              }),
            },
          ],
        },
      ]}
    >
      <Card
        style={[styles.itemCard, item.isCompleted && styles.completedItemCard]}
      >
        <Card.Content style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Checkbox
              status={item.isCompleted ? "checked" : "unchecked"}
              onPress={() => toggleItemCompletion(item.id)}
              color={ColorPalette.primary[500]}
            />

            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemName,
                  item.isCompleted && styles.completedItemName,
                ]}
              >
                {item.item?.name || item.custom_item_name || "Unknown Item"}
              </Text>

              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>
                  Qty: {item.quantity} {item.item?.unit || ""}
                </Text>

                {item.item?.category && (
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>
                      {item.item.category.name}
                    </Text>
                  </View>
                )}
              </View>

              {(item.notes || item.custom_budget) && (
                <View style={styles.itemNotesContainer}>
                  {item.custom_budget && (
                    <Text style={styles.budgetText}>
                      Budget: {formatCurrency(item.custom_budget)}
                    </Text>
                  )}
                  {item.notes && (
                    <Text style={styles.itemNotesText}>Note: {item.notes}</Text>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.priceButton}
              onPress={() => openPriceModal(item)}
            >
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.priceValue}>
                  {formatCurrency((item.actualPrice || 0) * item.quantity)}
                </Text>
              </View>
              <Ionicons
                name="create-outline"
                size={16}
                color={ColorPalette.primary[500]}
              />
            </TouchableOpacity>
          </View>

          {item.isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bag-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Items in Shopping List</Text>
      <Text style={styles.emptySubtitle}>
        This order doesn't have any items to shop for.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading shopping list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={shoppingItems}
        renderItem={renderShoppingItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderProgressHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      {shoppingItems.length > 0 && (
        <FAB
          style={[
            styles.fab,
            {
              backgroundColor:
                completedCount === shoppingItems.length
                  ? "#4CAF50"
                  : ColorPalette.primary[500],
            },
          ]}
          icon={completedCount === shoppingItems.length ? "car" : "check-all"}
          label={
            completedCount === shoppingItems.length
              ? "Start Delivery"
              : `${completedCount}/${shoppingItems.length} Done`
          }
          onPress={handleStartDelivery}
          mode="extended"
        />
      )}

      {/* Price Update Modal */}
      <Portal>
        <Dialog
          visible={priceModalVisible}
          onDismiss={() => setPriceModalVisible(false)}
        >
          <Dialog.Title>Update Item Price</Dialog.Title>
          <Dialog.Content>
            {selectedItem && (
              <>
                <Text style={styles.modalItemName}>
                  {selectedItem.item?.name || selectedItem.custom_item_name}
                </Text>

                <PaperTextInput
                  label="Actual Price (per item)"
                  value={actualPrice}
                  onChangeText={setActualPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.priceInput}
                  left={<PaperTextInput.Affix text="GH₵" />}
                />

                <Text style={styles.totalPriceText}>
                  Total:{" "}
                  {formatCurrency(
                    (parseFloat(actualPrice) || 0) * selectedItem.quantity,
                  )}
                </Text>

                <PaperTextInput
                  label="Notes (optional)"
                  value={itemNotes}
                  onChangeText={setItemNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.notesInput}
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPriceModalVisible(false)}>Cancel</Button>
            <Button onPress={savePriceUpdate} mode="contained">
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressCard: {
    elevation: 3,
    borderRadius: borderRadius.lg,
  },
  progressContent: {
    padding: spacing.lg,
  },
  progressInfo: {
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: ColorPalette.primary[500],
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: ColorPalette.primary[500],
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
    minWidth: 40,
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalItem: {
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: ColorPalette.primary[500],
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
  },
  itemContainer: {
    marginBottom: spacing.md,
  },
  itemCard: {
    elevation: 2,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: ColorPalette.primary[500],
  },
  completedItemCard: {
    borderLeftColor: "#4CAF50",
    opacity: 0.8,
  },
  itemContent: {
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.primary[500],
    marginBottom: 4,
  },
  completedItemName: {
    textDecorationLine: "line-through",
    color: ColorPalette.secondary[500],
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  itemQuantity: {
    fontSize: 14,
    color: ColorPalette.primary[500],
    marginRight: spacing.sm,
  },
  categoryChip: {
    backgroundColor: ColorPalette.secondary[100],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: 10,
    color: ColorPalette.primary[500],
    fontWeight: "600",
  },
  itemNotesContainer: {
    marginTop: spacing.xs,
  },
  budgetText: {
    fontSize: 12,
    color: ColorPalette.primary[500],
    fontWeight: "500",
    marginBottom: 2,
  },
  itemNotesText: {
    fontSize: 12,
    color: ColorPalette.primary[500],
    fontStyle: "italic",
  },
  priceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  priceContainer: {
    alignItems: "center",
    marginRight: spacing.xs,
  },
  priceLabel: {
    fontSize: 10,
    color: ColorPalette.primary[500],
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    padding: spacing.xs,
    backgroundColor: "#e8f5e8",
    borderRadius: borderRadius.md,
  },
  completedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginLeft: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: ColorPalette.primary[500],
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.primary[500],
    marginBottom: spacing.md,
  },
  priceInput: {
    marginBottom: spacing.sm,
  },
  totalPriceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
    marginBottom: spacing.md,
    textAlign: "center",
  },
  notesInput: {
    marginTop: spacing.sm,
  },
});

export default ShoppingListScreen;
