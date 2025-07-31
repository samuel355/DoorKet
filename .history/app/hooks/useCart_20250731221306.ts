import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, APP_CONFIG } from "../constants";
import { calculateOrderTotal, generateId, showAlert } from "../utils";
import { Cart, Item } from "@/types";

export interface UseCartReturn {
  // State
  cart: Cart;
  loading: boolean;
  error: string | null;

  // Actions
  addItem: (
    item: Item | CartItem,
    quantity?: number,
    notes?: string,
  ) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  addCustomItem: (
    name: string,
    budget: number,
    quantity?: number,
    notes?: string,
  ) => Promise<boolean>;

  // Getters
  getItemQuantity: (itemId: string) => number;
  isItemInCart: (itemId: string) => boolean;
  getCartItem: (itemId: string) => CartItem | undefined;

  // Cart info
  itemCount: number;
  isEmpty: boolean;
  canCheckout: boolean;

  // Address and instructions
  updateDeliveryAddress: (address: string) => Promise<boolean>;
  updateSpecialInstructions: (instructions: string) => Promise<boolean>;
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

const useCart = (): UseCartReturn => {
  const [cart, setCart] = useState<Cart>(INITIAL_CART);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // Calculate cart totals
  const calculateCartTotals = useCallback(
    (
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
    },
    [],
  );

  // Update cart with new items and recalculate totals
  const updateCartState = useCallback(
    (
      items: CartItem[],
      deliveryAddress?: string,
      specialInstructions?: string,
    ) => {
      const totals = calculateCartTotals(items);

      setCart((prevCart) => ({
        ...prevCart,
        items,
        ...totals,
        ...(deliveryAddress !== undefined && {
          delivery_address: deliveryAddress,
        }),
        ...(specialInstructions !== undefined && {
          special_instructions: specialInstructions,
        }),
      }));
    },
    [calculateCartTotals],
  );

  // Save cart to storage
  const saveCartToStorage = useCallback(
    async (cartData: Cart): Promise<boolean> => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CART_ITEMS,
          JSON.stringify(cartData),
        );
        return true;
      } catch (error) {
        console.error("Error saving cart to storage:", error);
        setError("Failed to save cart");
        return false;
      }
    },
    [],
  );

  // Load cart from storage
  const loadCartFromStorage = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const savedCart = await AsyncStorage.getItem(STORAGE_KEYS.CART_ITEMS);

      if (savedCart) {
        const parsedCart: Cart = JSON.parse(savedCart);

        // Validate and update cart with fresh calculations
        updateCartState(
          parsedCart.items || [],
          parsedCart.delivery_address || "",
          parsedCart.special_instructions || "",
        );
      } else {
        setCart(INITIAL_CART);
      }
    } catch (error) {
      console.error("Error loading cart from storage:", error);
      setError("Failed to load cart");
      setCart(INITIAL_CART);
    } finally {
      setLoading(false);
      isInitialized.current = true;
    }
  }, [updateCartState]);

  // Initialize cart on mount
  useEffect(() => {
    if (!isInitialized.current) {
      loadCartFromStorage();
    }
  }, [loadCartFromStorage]);

  // Save cart whenever it changes (after initialization)
  useEffect(() => {
    if (isInitialized.current) {
      saveCartToStorage(cart);
    }
  }, [cart, saveCartToStorage]);

  // Add item to cart
  const addItem = useCallback(
    async (
      item: Item | CartItem,
      quantity: number = 1,
      notes: string = "",
    ): Promise<boolean> => {
      try {
        if (quantity <= 0) {
          setError("Quantity must be greater than 0");
          return false;
        }

        if (cart.items.length >= APP_CONFIG.MAX_CART_ITEMS) {
          showAlert(
            "Cart Full",
            `You can only add up to ${APP_CONFIG.MAX_CART_ITEMS} items to your cart.`,
          );
          return false;
        }

        const newItems = [...cart.items];

        // Check if item already exists in cart
        const existingItemIndex = newItems.findIndex((cartItem) => {
          if ("item" in item || "custom_item_name" in item) {
            // CartItem case
            if (item.item?.id) {
              return cartItem.item?.id === item.item.id;
            }
            if (item.custom_item_name) {
              return cartItem.custom_item_name === item.custom_item_name;
            }
          } else {
            // Item case
            return cartItem.item?.id === item.id;
          }
          return false;
        });

        if (existingItemIndex >= 0) {
          // Update existing item
          const existingItem = newItems[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;
          const unitPrice = existingItem.unit_price || 0;

          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            notes: notes || existingItem.notes,
            total_price: unitPrice * newQuantity,
          };
        } else {
          // Add new item
          let cartItem: CartItem;

          if ("item" in item || "custom_item_name" in item) {
            // Adding from CartItem
            const cartItemInput = item as CartItem;
            cartItem = {
              ...cartItemInput,
              quantity,
              notes,
              total_price:
                (cartItemInput.unit_price || cartItemInput.custom_budget || 0) *
                quantity,
            };
          } else {
            // Adding from Item
            const itemInput = item as Item;
            cartItem = {
              id: generateId(),
              item: itemInput,
              quantity,
              unit_price: itemInput.base_price || 0,
              notes,
              total_price: (itemInput.base_price || 0) * quantity,
            };
          }

          newItems.push(cartItem);
        }

        updateCartState(
          newItems,
          cart.delivery_address,
          cart.special_instructions,
        );
        setError(null);
        return true;
      } catch (error) {
        console.error("Error adding item to cart:", error);
        setError("Failed to add item to cart");
        return false;
      }
    },
    [
      cart.items,
      cart.delivery_address,
      cart.special_instructions,
      updateCartState,
    ],
  );

  // Remove item from cart
  const removeItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      try {
        const newItems = cart.items.filter(
          (item) => item.id !== itemId && item.item?.id !== itemId,
        );

        updateCartState(
          newItems,
          cart.delivery_address,
          cart.special_instructions,
        );
        setError(null);
        return true;
      } catch (error) {
        console.error("Error removing item from cart:", error);
        setError("Failed to remove item from cart");
        return false;
      }
    },
    [
      cart.items,
      cart.delivery_address,
      cart.special_instructions,
      updateCartState,
    ],
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      try {
        if (quantity <= 0) {
          return removeItem(itemId);
        }

        const newItems = cart.items.map((item) => {
          const isTargetItem = item.id === itemId || item.item?.id === itemId;

          if (isTargetItem) {
            const unitPrice = item.unit_price || item.custom_budget || 0;
            return {
              ...item,
              quantity,
              total_price: unitPrice * quantity,
            };
          }

          return item;
        });

        updateCartState(
          newItems,
          cart.delivery_address,
          cart.special_instructions,
        );
        setError(null);
        return true;
      } catch (error) {
        console.error("Error updating item quantity:", error);
        setError("Failed to update quantity");
        return false;
      }
    },
    [
      cart.items,
      cart.delivery_address,
      cart.special_instructions,
      updateCartState,
      removeItem,
    ],
  );

  // Clear cart
  const clearCart = useCallback(async (): Promise<boolean> => {
    try {
      setCart(INITIAL_CART);
      await AsyncStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
      setError(null);
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      setError("Failed to clear cart");
      return false;
    }
  }, []);

  // Add custom item
  const addCustomItem = useCallback(
    async (
      name: string,
      budget: number,
      quantity: number = 1,
      notes: string = "",
    ): Promise<boolean> => {
      try {
        if (!name.trim()) {
          setError("Item name is required");
          return false;
        }

        if (budget <= 0) {
          setError("Budget must be greater than 0");
          return false;
        }

        const customCartItem: CartItem = {
          id: generateId(),
          custom_item_name: name.trim(),
          quantity,
          custom_budget: budget,
          notes,
          total_price: budget * quantity,
        };

        return addItem(customCartItem, quantity, notes);
      } catch (error) {
        console.error("Error adding custom item:", error);
        setError("Failed to add custom item");
        return false;
      }
    },
    [addItem],
  );

  // Update delivery address
  const updateDeliveryAddress = useCallback(
    async (address: string): Promise<boolean> => {
      try {
        updateCartState(cart.items, address, cart.special_instructions);
        setError(null);
        return true;
      } catch (error) {
        console.error("Error updating delivery address:", error);
        setError("Failed to update delivery address");
        return false;
      }
    },
    [cart.items, cart.special_instructions, updateCartState],
  );

  // Update special instructions
  const updateSpecialInstructions = useCallback(
    async (instructions: string): Promise<boolean> => {
      try {
        updateCartState(cart.items, cart.delivery_address, instructions);
        setError(null);
        return true;
      } catch (error) {
        console.error("Error updating special instructions:", error);
        setError("Failed to update instructions");
        return false;
      }
    },
    [cart.items, cart.delivery_address, updateCartState],
  );

  // Get item quantity in cart
  const getItemQuantity = useCallback(
    (itemId: string): number => {
      const cartItem = cart.items.find(
        (item) => item.id === itemId || item.item?.id === itemId,
      );
      return cartItem?.quantity || 0;
    },
    [cart.items],
  );

  // Check if item is in cart
  const isItemInCart = useCallback(
    (itemId: string): boolean => {
      return cart.items.some(
        (item) => item.id === itemId || item.item?.id === itemId,
      );
    },
    [cart.items],
  );

  // Get cart item by ID
  const getCartItem = useCallback(
    (itemId: string): CartItem | undefined => {
      return cart.items.find(
        (item) => item.id === itemId || item.item?.id === itemId,
      );
    },
    [cart.items],
  );

  // Calculate derived values
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = cart.items.length === 0;
  const canCheckout =
    !isEmpty &&
    cart.total >= APP_CONFIG.MIN_ORDER_AMOUNT &&
    cart.delivery_address.trim().length > 0;

  return {
    // State
    cart,
    loading,
    error,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    addCustomItem,

    // Getters
    getItemQuantity,
    isItemInCart,
    getCartItem,

    // Cart info
    itemCount,
    isEmpty,
    canCheckout,

    // Address and instructions
    updateDeliveryAddress,
    updateSpecialInstructions,
  };
};

export default useCart;
