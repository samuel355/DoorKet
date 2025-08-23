import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Cart, CartItem, Item } from "@/types";
import { APP_CONFIG } from "@/src/constants";
import { calculateOrderTotal, generateId } from "@/src/utils";

interface CartState {
  // Cart data
  cart: Cart;

  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  // Cart actions
  addItem: (item: Item | CartItem, quantity?: number, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  addCustomItem: (name: string, budget: number, notes?: string) => boolean;

  // Cart information
  updateDeliveryAddress: (address: string) => void;
  updateSpecialInstructions: (instructions: string) => void;

  // Cart utilities
  getItemQuantity: (itemId: string) => number;
  isItemInCart: (itemId: string) => boolean;
  getCartItem: (itemId: string) => CartItem | undefined;
  getTotalItems: () => number;
  canCheckout: () => boolean;

  // Error handling
  clearError: () => void;
  setError: (error: string) => void;

  // Reset cart
  resetCart: () => void;
}

const INITIAL_CART: Cart = {
  items: [],
  subtotal: 0,
  delivery_fee: APP_CONFIG.DEFAULT_DELIVERY_FEE,
  service_fee: 0,
  total: 0,
  delivery_address: "",
  special_instructions: "",
};

// Helper function to calculate cart totals
const calculateCartTotals = (
  items: CartItem[],
): Omit<Cart, "items" | "delivery_address" | "special_instructions"> => {
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const { serviceFee, deliveryFee, total } = calculateOrderTotal(
    subtotal,
    APP_CONFIG.DEFAULT_DELIVERY_FEE,
    APP_CONFIG.DEFAULT_SERVICE_FEE_PERCENTAGE,
  );

  return {
    subtotal,
    service_fee: serviceFee,
    delivery_fee: deliveryFee,
    total,
  };
};

// Helper function to create cart item
const createCartItem = (
  item: Item | CartItem,
  quantity: number = 1,
  notes: string = "",
): CartItem => {
  if ("item" in item || "custom_item_name" in item) {
    // It's already a CartItem
    const cartItem = item as CartItem;
    return {
      ...cartItem,
      quantity,
      notes: notes || cartItem.notes || "",
      total_price:
        (cartItem.unit_price || cartItem.custom_budget || 0) * quantity,
    };
  } else {
    // It's an Item, convert to CartItem
    const baseItem = item as Item;
    return {
      id: generateId(),
      item: baseItem,
      quantity,
      unit_price: baseItem.base_price || 0,
      notes,
      total_price: (baseItem.base_price || 0) * quantity,
    };
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: INITIAL_CART,
      isLoading: false,
      isUpdating: false,
      error: null,

      // Add item to cart
      addItem: (
        item: Item | CartItem,
        quantity: number = 1,
        notes: string = "",
      ) => {
        try {
          const currentCart = get().cart;

          if (quantity <= 0) {
            set({ error: "Quantity must be greater than 0" });
            return;
          }

          if (currentCart.items.length >= APP_CONFIG.MAX_CART_ITEMS) {
            set({
              error: `Cart is full. Maximum ${APP_CONFIG.MAX_CART_ITEMS} items allowed.`,
            });
            return;
          }

          const newItems = [...currentCart.items];

          // Check if item already exists in cart
          const existingItemIndex = newItems.findIndex((cartItem) => {
            if ("item" in item || "custom_item_name" in item) {
              // CartItem case
              const itemToAdd = item as CartItem;
              if (itemToAdd.item?.id) {
                return cartItem.item?.id === itemToAdd.item.id;
              }
              if (itemToAdd.custom_item_name) {
                return cartItem.custom_item_name === itemToAdd.custom_item_name;
              }
            } else {
              // Item case
              const itemToAdd = item as Item;
              return cartItem.item?.id === itemToAdd.id;
            }
            return false;
          });

          if (existingItemIndex >= 0) {
            // Update existing item
            const existingItem = newItems[existingItemIndex];
            newItems[existingItemIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + quantity,
              notes: notes || existingItem.notes || "",
              total_price:
                (existingItem.unit_price || existingItem.custom_budget || 0) *
                (existingItem.quantity + quantity),
            };
          } else {
            // Add new item
            const newCartItem = createCartItem(item, quantity, notes);
            newItems.push(newCartItem);
          }

          // Calculate new totals
          const totals = calculateCartTotals(newItems);

          set({
            cart: {
              ...currentCart,
              items: newItems,
              ...totals,
            },
            error: null,
          });
        } catch (error) {
          console.error("Error adding item to cart:", error);
          set({ error: "Failed to add item to cart" });
        }
      },

      // Remove item from cart
      removeItem: (itemId: string) => {
        try {
          const currentCart = get().cart;
          const newItems = currentCart.items.filter(
            (item) => item.id !== itemId && item.item?.id !== itemId,
          );

          if (newItems.length === currentCart.items.length) {
            set({ error: "Item not found in cart" });
            return;
          }

          const totals = calculateCartTotals(newItems);

          set({
            cart: {
              ...currentCart,
              items: newItems,
              ...totals,
            },
            error: null,
          });
        } catch (error) {
          console.error("Error removing item from cart:", error);
          set({ error: "Failed to remove item from cart" });
        }
      },

      // Update item quantity
      updateQuantity: (itemId: string, quantity: number) => {
        try {
          if (quantity < 0) {
            set({ error: "Quantity cannot be negative" });
            return;
          }

          if (quantity === 0) {
            get().removeItem(itemId);
            return;
          }

          const currentCart = get().cart;
          const newItems = currentCart.items.map((item) => {
            if (item.id === itemId || item.item?.id === itemId) {
              return {
                ...item,
                quantity,
                total_price:
                  (item.unit_price || item.custom_budget || 0) * quantity,
              };
            }
            return item;
          });

          const totals = calculateCartTotals(newItems);

          set({
            cart: {
              ...currentCart,
              items: newItems,
              ...totals,
            },
            error: null,
          });
        } catch (error) {
          console.error("Error updating item quantity:", error);
          set({ error: "Failed to update item quantity" });
        }
      },

      // Clear cart
      clearCart: () => {
        try {
          const currentCart = get().cart;
          set({
            cart: {
              ...INITIAL_CART,
              delivery_address: currentCart.delivery_address,
              special_instructions: currentCart.special_instructions,
            },
            error: null,
          });
        } catch (error) {
          console.error("Error clearing cart:", error);
          set({ error: "Failed to clear cart" });
        }
      },

      // Add custom item
      addCustomItem: (
        name: string,
        budget: number,
        notes: string = "",
      ): boolean => {
        try {
          if (!name.trim()) {
            set({ error: "Custom item name is required" });
            return false;
          }

          if (budget <= 0) {
            set({ error: "Budget must be greater than 0" });
            return false;
          }

          const currentCart = get().cart;
          if (currentCart.items.length >= APP_CONFIG.MAX_CART_ITEMS) {
            set({
              error: `Cart is full. Maximum ${APP_CONFIG.MAX_CART_ITEMS} items allowed.`,
            });
            return false;
          }

          const customItem: CartItem = {
            id: generateId(),
            custom_item_name: name.trim(),
            quantity: 1,
            custom_budget: budget,
            notes: notes.trim(),
            total_price: budget,
          };

          // Clear any existing error before adding
          set({ error: null });

          // Create a new items array to check if the item will fit
          const currentItems = get().cart.items;
          if (currentItems.length >= APP_CONFIG.MAX_CART_ITEMS) {
            set({
              error: `Cart is full. Maximum ${APP_CONFIG.MAX_CART_ITEMS} items already in cart.`,
            });
            return false;
          }

          // Check if custom item with same name already exists
          const existingCustomItem = currentItems.find(
            (item) => item.custom_item_name === name.trim(),
          );

          if (existingCustomItem) {
            // Update existing custom item quantity and total
            const newQuantity = existingCustomItem.quantity + 1;
            const newTotal = existingCustomItem.custom_budget! * newQuantity;

            const updatedItems = currentItems.map((item) =>
              item.custom_item_name === name.trim()
                ? {
                    ...item,
                    quantity: newQuantity,
                    total_price: newTotal,
                    notes: notes.trim() || item.notes || "",
                  }
                : item,
            );

            const totals = calculateCartTotals(updatedItems);

            set({
              cart: {
                ...get().cart,
                items: updatedItems,
                ...totals,
              },
              error: null,
            });
          } else {
            // Add new custom item
            const updatedItems = [...currentItems, customItem];
            const totals = calculateCartTotals(updatedItems);

            set({
              cart: {
                ...get().cart,
                items: updatedItems,
                ...totals,
              },
              error: null,
            });
          }

          return true;
        } catch (error) {
          console.error("Error adding custom item:", error);
          set({ error: "Failed to add custom item" });
          return false;
        }
      },

      // Update delivery address
      updateDeliveryAddress: (address: string) => {
        try {
          const currentCart = get().cart;
          set({
            cart: {
              ...currentCart,
              delivery_address: address.trim(),
            },
            error: null,
          });
        } catch (error) {
          console.error("Error updating delivery address:", error);
          set({ error: "Failed to update delivery address" });
        }
      },

      // Update special instructions
      updateSpecialInstructions: (instructions: string) => {
        try {
          const currentCart = get().cart;
          set({
            cart: {
              ...currentCart,
              special_instructions: instructions.trim(),
            },
            error: null,
          });
        } catch (error) {
          console.error("Error updating special instructions:", error);
          set({ error: "Failed to update special instructions" });
        }
      },

      // Get item quantity in cart
      getItemQuantity: (itemId: string): number => {
        const cartItem = get().cart.items.find(
          (item) => item.id === itemId || item.item?.id === itemId,
        );
        return cartItem?.quantity || 0;
      },

      // Check if item is in cart
      isItemInCart: (itemId: string): boolean => {
        return get().cart.items.some(
          (item) => item.id === itemId || item.item?.id === itemId,
        );
      },

      // Get cart item by ID
      getCartItem: (itemId: string): CartItem | undefined => {
        return get().cart.items.find(
          (item) => item.id === itemId || item.item?.id === itemId,
        );
      },

      // Get total items count
      getTotalItems: (): number => {
        return get().cart.items.reduce((sum, item) => sum + item.quantity, 0);
      },

      // Check if cart can proceed to checkout
      canCheckout: (): boolean => {
        const cart = get().cart;
        return (
          cart.items.length > 0 &&
          cart.total >= APP_CONFIG.MIN_ORDER_AMOUNT &&
          cart.delivery_address.trim().length > 0
        );
      },

      // Clear error
      clearError: (): void => {
        set({ error: null });
      },

      // Set error
      setError: (error: string): void => {
        set({ error });
      },

      // Reset cart to initial state
      resetCart: (): void => {
        set({
          cart: INITIAL_CART,
          isLoading: false,
          isUpdating: false,
          error: null,
        });
      },
    }),
    {
      name: "cart-store",
      storage: {
        getItem: async (name) => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error("Error getting item from storage:", error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error("Error saving item to storage:", error);
          }
        },
        removeItem: async (name) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error("Error removing item from storage:", error);
          }
        },
      },
      partialize: (state) =>
        ({
          cart: state.cart,
        }) as any,
    },
  ),
);

// Convenience hooks for specific cart data
export const useCartItems = () => useCartStore((state) => state.cart.items);
export const useCartTotal = () => useCartStore((state) => state.cart.total);
export const useCartSubtotal = () =>
  useCartStore((state) => state.cart.subtotal);
export const useCartItemCount = () =>
  useCartStore((state) => state.getTotalItems());
export const useCartIsEmpty = () =>
  useCartStore((state) => state.cart.items.length === 0);
export const useCartCanCheckout = () =>
  useCartStore((state) => state.canCheckout());
export const useCartError = () => useCartStore((state) => state.error);
export const useCartLoading = () => useCartStore((state) => state.isLoading);

// Cart actions hooks
export const useCartActions = () => {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const addCustomItem = useCartStore((state) => state.addCustomItem);
  const updateDeliveryAddress = useCartStore(
    (state) => state.updateDeliveryAddress,
  );
  const updateSpecialInstructions = useCartStore(
    (state) => state.updateSpecialInstructions,
  );

  return {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    addCustomItem,
    updateDeliveryAddress,
    updateSpecialInstructions,
  };
};

export default useCartStore;
