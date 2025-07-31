// Mock Data Service for ChopCart
// This service provides mock data for development and testing when database is not available

import { Category, Item, Order, User as AppUser, OrderItem } from "../types";

// Mock Categories Data
export const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Groceries",
    description: "Fresh produce, pantry staples, and everyday essentials",
    icon_name: "basket",
    color_code: "#4CAF50",
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-2",
    name: "Fast Food",
    description: "Quick bites from local restaurants and food joints",
    icon_name: "fast-food",
    color_code: "#FF9800",
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-3",
    name: "Beverages",
    description: "Soft drinks, juices, water, and refreshing drinks",
    icon_name: "cafe",
    color_code: "#2196F3",
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-4",
    name: "Snacks",
    description: "Chips, biscuits, candies, and quick snacks",
    icon_name: "nutrition",
    color_code: "#9C27B0",
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-5",
    name: "Personal Care",
    description: "Toiletries, hygiene products, and personal items",
    icon_name: "body",
    color_code: "#E91E63",
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-6",
    name: "Stationery",
    description: "Books, pens, notebooks, and academic supplies",
    icon_name: "library",
    color_code: "#795548",
    is_active: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-7",
    name: "Electronics",
    description: "Phone accessories, cables, and small electronics",
    icon_name: "phone-portrait",
    color_code: "#607D8B",
    is_active: true,
    sort_order: 7,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-8",
    name: "Clothing",
    description: "Basic clothing items and accessories",
    icon_name: "shirt",
    color_code: "#FF5722",
    is_active: true,
    sort_order: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-9",
    name: "Medicine",
    description: "Over-the-counter medications and health products",
    icon_name: "medical",
    color_code: "#F44336",
    is_active: true,
    sort_order: 9,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-10",
    name: "Laundry",
    description: "Detergents, fabric softeners, and laundry supplies",
    icon_name: "water",
    color_code: "#00BCD4",
    is_active: true,
    sort_order: 10,
    created_at: new Date().toISOString(),
  },
];

// Mock Items Data
export const MOCK_ITEMS: Item[] = [
  // Groceries
  {
    id: "item-1",
    category_id: "cat-1",
    name: "Rice (1kg)",
    description: "Local rice, perfect for meals",
    base_price: 8.0,
    unit: "bag",
    is_available: true,
    tags: ["rice", "staple", "carbs"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-2",
    category_id: "cat-1",
    name: "Bread (Loaf)",
    description: "Fresh bread loaf",
    base_price: 3.5,
    unit: "loaf",
    is_available: true,
    tags: ["bread", "bakery", "breakfast"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-3",
    category_id: "cat-1",
    name: "Eggs (12 pieces)",
    description: "Fresh chicken eggs",
    base_price: 12.0,
    unit: "crate",
    is_available: true,
    tags: ["eggs", "protein", "breakfast"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-4",
    category_id: "cat-1",
    name: "Milk (1L)",
    description: "Fresh cow milk",
    base_price: 6.0,
    unit: "bottle",
    is_available: true,
    tags: ["milk", "dairy", "calcium"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-5",
    category_id: "cat-1",
    name: "Tomatoes (1kg)",
    description: "Fresh red tomatoes",
    base_price: 5.0,
    unit: "kg",
    is_available: true,
    tags: ["tomatoes", "vegetables", "fresh"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Fast Food
  {
    id: "item-6",
    category_id: "cat-2",
    name: "Fried Rice",
    description: "Delicious fried rice with vegetables",
    base_price: 15.0,
    unit: "plate",
    is_available: true,
    tags: ["rice", "fried", "meal"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-7",
    category_id: "cat-2",
    name: "Jollof Rice",
    description: "Spicy West African jollof rice",
    base_price: 12.0,
    unit: "plate",
    is_available: true,
    tags: ["jollof", "rice", "spicy"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-8",
    category_id: "cat-2",
    name: "Waakye",
    description: "Traditional rice and beans dish",
    base_price: 10.0,
    unit: "plate",
    is_available: true,
    tags: ["waakye", "beans", "traditional"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-9",
    category_id: "cat-2",
    name: "Banku & Tilapia",
    description: "Banku with grilled tilapia fish",
    base_price: 25.0,
    unit: "plate",
    is_available: true,
    tags: ["banku", "fish", "grilled"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-10",
    category_id: "cat-2",
    name: "Kelewele",
    description: "Spiced fried plantain",
    base_price: 8.0,
    unit: "portion",
    is_available: true,
    tags: ["plantain", "spiced", "snack"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Beverages
  {
    id: "item-11",
    category_id: "cat-3",
    name: "Coca Cola (350ml)",
    description: "Classic Coca Cola soft drink",
    base_price: 3.0,
    unit: "bottle",
    is_available: true,
    tags: ["coke", "cola", "soft drink"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-12",
    category_id: "cat-3",
    name: "Sprite (350ml)",
    description: "Lemon-lime flavored soft drink",
    base_price: 3.0,
    unit: "bottle",
    is_available: true,
    tags: ["sprite", "lemon", "lime"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-13",
    category_id: "cat-3",
    name: "Bottled Water (750ml)",
    description: "Pure drinking water",
    base_price: 2.0,
    unit: "bottle",
    is_available: true,
    tags: ["water", "pure", "hydration"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-14",
    category_id: "cat-3",
    name: "Fruit Juice (500ml)",
    description: "Fresh mixed fruit juice",
    base_price: 8.0,
    unit: "bottle",
    is_available: true,
    tags: ["juice", "fruit", "fresh"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Snacks
  {
    id: "item-15",
    category_id: "cat-4",
    name: "Potato Chips",
    description: "Crispy potato chips",
    base_price: 4.0,
    unit: "pack",
    is_available: true,
    tags: ["chips", "potato", "crispy"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-16",
    category_id: "cat-4",
    name: "Biscuits",
    description: "Sweet cream biscuits",
    base_price: 3.0,
    unit: "pack",
    is_available: true,
    tags: ["biscuits", "sweet", "cream"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-17",
    category_id: "cat-4",
    name: "Chocolate Bar",
    description: "Milk chocolate bar",
    base_price: 8.0,
    unit: "bar",
    is_available: true,
    tags: ["chocolate", "sweet", "candy"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Personal Care
  {
    id: "item-18",
    category_id: "cat-5",
    name: "Toothpaste",
    description: "Fluoride toothpaste for healthy teeth",
    base_price: 8.0,
    unit: "tube",
    is_available: true,
    tags: ["toothpaste", "dental", "hygiene"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-19",
    category_id: "cat-5",
    name: "Soap Bar",
    description: "Antibacterial soap bar",
    base_price: 5.0,
    unit: "bar",
    is_available: true,
    tags: ["soap", "antibacterial", "cleansing"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-20",
    category_id: "cat-5",
    name: "Shampoo (400ml)",
    description: "Hair cleansing shampoo",
    base_price: 15.0,
    unit: "bottle",
    is_available: true,
    tags: ["shampoo", "hair", "cleansing"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock Users Data
export const MOCK_USERS: AppUser[] = [
  {
    id: "user-1",
    email: "student1@example.com",
    phone: "+233241234567",
    full_name: "Kwame Asante",
    user_type: "student",
    university: "University of Ghana",
    hall_hostel: "Commonwealth Hall",
    room_number: "A23",
    is_verified: true,
    is_active: true,
    face_id_enabled: false,
    rating: 0,
    total_orders: 3,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updated_at: new Date().toISOString(),
  },
  {
    id: "user-2",
    email: "runner1@example.com",
    phone: "+233247654321",
    full_name: "Akosua Mensah",
    user_type: "runner",
    university: "University of Ghana",
    is_verified: true,
    is_active: true,
    face_id_enabled: true,
    rating: 4.8,
    total_orders: 145,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    updated_at: new Date().toISOString(),
  },
  {
    id: "user-3",
    email: "admin@chopcart.com",
    phone: "+233501234567",
    full_name: "Admin User",
    user_type: "admin",
    university: "University of Ghana",
    is_verified: true,
    is_active: true,
    face_id_enabled: false,
    rating: 0,
    total_orders: 0,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
    updated_at: new Date().toISOString(),
  },
];

// Mock Orders Data
export const MOCK_ORDERS: Order[] = [
  {
    id: "order-1",
    order_number: "CC202501270001",
    student_id: "user-1",
    runner_id: "user-2",
    status: "completed",
    total_amount: 47.35,
    service_fee: 2.35,
    delivery_fee: 2.0,
    delivery_address: "Commonwealth Hall, Room A23, University of Ghana",
    special_instructions: "Please call when you arrive",
    payment_method: "momo",
    payment_status: "paid",
    payment_reference: "TXN123456789",
    estimated_delivery_time: new Date(
      Date.now() + 30 * 60 * 1000,
    ).toISOString(), // 30 minutes from now
    accepted_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    completed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90 minutes ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "order-2",
    order_number: "CC202501270002",
    student_id: "user-1",
    status: "pending",
    total_amount: 23.5,
    service_fee: 1.18,
    delivery_fee: 2.0,
    delivery_address: "Commonwealth Hall, Room A23, University of Ghana",
    payment_method: "momo",
    payment_status: "pending",
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

// Utility function to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to simulate random errors
const shouldSimulateError = (errorRate: number = 0.1) =>
  Math.random() < errorRate;

// Mock Item Service
export class MockItemService {
  /**
   * Get all categories
   */
  static async getCategories(
    options: { simulateError?: boolean; delay?: number } = {},
  ) {
    const { simulateError = false, delay: delayMs = 500 } = options;

    await delay(delayMs);

    if (simulateError || shouldSimulateError()) {
      return { data: null, error: "Failed to load categories" };
    }

    return { data: MOCK_CATEGORIES, error: null };
  }

  /**
   * Get items by category
   */
  static async getItemsByCategory(
    categoryId: string,
    options: { simulateError?: boolean; delay?: number } = {},
  ) {
    const { simulateError = false, delay: delayMs = 300 } = options;

    await delay(delayMs);

    if (simulateError || shouldSimulateError()) {
      return { data: null, error: "Failed to load items" };
    }

    const items = MOCK_ITEMS.filter((item) => item.category_id === categoryId);
    return { data: items, error: null };
  }

  /**
   * Get item by ID
   */
  static async getItemById(
    itemId: string,
    options: { simulateError?: boolean; delay?: number } = {},
  ) {
    const { simulateError = false, delay: delayMs = 200 } = options;

    await delay(delayMs);

    if (simulateError || shouldSimulateError()) {
      return { data: null, error: "Failed to load item" };
    }

    const item = MOCK_ITEMS.find((item) => item.id === itemId);
    if (!item) {
      return { data: null, error: "Item not found" };
    }

    // Add category information
    const category = MOCK_CATEGORIES.find((cat) => cat.id === item.category_id);
    const itemWithCategory = { ...item, category };

    return { data: itemWithCategory, error: null };
  }

  /**
   * Search items
   */
  static async searchItems(
    query: string,
    options: { simulateError?: boolean; delay?: number } = {},
  ) {
    const { simulateError = false, delay: delayMs = 400 } = options;

    await delay(delayMs);

    if (simulateError || shouldSimulateError()) {
      return { data: null, error: "Search failed" };
    }

    if (!query.trim()) {
      return { data: [], error: null };
    }

    const lowerQuery = query.toLowerCase();
    const items = MOCK_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );

    return { data: items, error: null };
  }
}

// Mock Order Service
export class MockOrderService {
  /**
   * Get student orders
   */
  static async getStudentOrders(
    studentId: string,
    options: { simulateError?: boolean; delay?: number } = {},
  ) {
    const { simulateError = false, delay: delayMs = 300 } = options;

    await delay(delayMs);

    if (simulateError || shouldSimulateError()) {
      return { data: null, error: "Failed to load orders" };
    }

    const orders = MOCK_ORDERS.filter(
      (order) => order.student_id === studentId,
    );
    return { data: orders, error: null };
  }

  /**
   * Get order by ID
   */
  static async getOrderById(
    orderId: string,
    options: { simulateError?: boolean; delay?: number } = {},
  ) {
    const { simulateError = false, delay: delayMs = 200 } = options;

    await delay(delayMs);

    if (simulateError || shouldSimulateError()) {
      return { data: null, error: "Failed to load order" };
    }

    const order = MOCK_ORDERS.find((order) => order.id === orderId);
    if (!order) {
      return { data: null, error: "Order not found" };
    }

    return { data: order, error: null };
  }

  /**
   * Create order
   */
  static async createOrder(
    orderData: any,
    options: { simulateError?: boolean; delay?: number } = {},
  ) {
    const { simulateError = false, delay: delayMs = 600 } = options;

    await delay(delayMs);

    if (simulateError || shouldSimulateError()) {
      return { data: null, error: "Failed to create order" };
    }

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      order_number: `CC${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${Math.floor(
        Math.random() * 9999,
      )
        .toString()
        .padStart(4, "0")}`,
      ...orderData,
      status: "pending" as const,
      payment_status: "pending" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { data: newOrder, error: null };
  }
}

// Configuration for mock mode
export const MOCK_CONFIG = {
  enabled: __DEV__, // Enable mock mode in development
  errorRate: 0.1, // 10% chance of simulated errors
  defaultDelay: 500, // Default API delay in ms
  categories: {
    enabled: true,
    errorRate: 0.05,
    delay: 300,
  },
  items: {
    enabled: true,
    errorRate: 0.1,
    delay: 400,
  },
  orders: {
    enabled: true,
    errorRate: 0.15,
    delay: 600,
  },
};

// Helper function to check if mock mode is enabled
export const isMockModeEnabled = (): boolean => {
  return MOCK_CONFIG.enabled || !process.env.EXPO_PUBLIC_SUPABASE_URL;
};

// Export all mock data and services
export default {
  MOCK_CATEGORIES,
  MOCK_ITEMS,
  MOCK_USERS,
  MOCK_ORDERS,
  MockItemService,
  MockOrderService,
  MOCK_CONFIG,
  isMockModeEnabled,
};
