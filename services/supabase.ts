import {
  createClient,
  SupabaseClient,
  Session,
  User,
} from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User as AppUser,
  Order,
  Item,
  Category,
  OrderItem,
  Rating,
  Notification,
  OrderStatus,
  PaymentStatus,
  UserType,
} from "../types";
import { MockItemService, isMockModeEnabled } from "./mockData";

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env file.'
  );
}

// Database type definitions
export interface Database {
  public: {
    Tables: {
      users: {
        Row: AppUser;
        Insert: Omit<AppUser, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AppUser, "id" | "created_at" | "updated_at">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Item, "id" | "created_at" | "updated_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<
          Order,
          "id" | "order_number" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<Order, "id" | "order_number" | "created_at" | "updated_at">
        >;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id" | "created_at">;
        Update: Partial<Omit<OrderItem, "id" | "created_at">>;
      };
      ratings: {
        Row: Rating;
        Insert: Omit<Rating, "id" | "created_at">;
        Update: Partial<Omit<Rating, "id" | "created_at">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id" | "created_at">>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_type: UserType;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
    };
  };
}

// Create Supabase client
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);

// Auth Helper Functions
export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("SignUp error:", error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("SignUp error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("SignIn error:", error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("SignIn error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "DoorKet://auth/callback",
        },
      });

      if (error) {
        console.error("Google SignIn error:", error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("Google SignIn error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("SignOut error:", error);
        return { error: error.message };
      }
      return { error: null };
    } catch (error: any) {
      console.error("SignOut error:", error);
      return { error: error.message };
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Get session error:", error);
        return { session: null, error: error.message };
      }
      return { session, error: null };
    } catch (error: any) {
      console.error("Get session error:", error);
      return { session: null, error: error.message };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Get user error:", error);
        return { user: null, error: error.message };
      }
      return { user, error: null };
    } catch (error: any) {
      console.error("Get user error:", error);
      return { user: null, error: error.message };
    }
  }
}

// User Profile Functions
export class SupabaseService {
  /**
   * Create user profile after successful authentication
   */
  static async createUserProfile(
    userData: Database["public"]["Tables"]["users"]["Insert"],
  ) {
    try {
      console.log("🚀 SupabaseService: Starting createUserProfile...");
      console.log("📊 User data for DB insertion:", userData);
      console.log("📝 Data fields:", Object.keys(userData));

      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      console.log("📊 Supabase insert result:", {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
      });

      if (error) {
        console.log("❌ Database insertion failed:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return { data: null, error: error.message };
      }

      console.log("✅ User profile created successfully:", data?.id);
      return { data, error: null };
    } catch (error: any) {
      console.error("💥 Create user profile error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack,
      });
      return { data: null, error: error.message };
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Get user profile error:", error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("Get user profile error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: Database["public"]["Tables"]["users"]["Update"],
  ) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Update user profile error:", error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("Update user profile error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get runners available for orders
   */
  static async getAvailableRunners() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_type", "runner")
        .eq("is_active", true)
        .eq("is_verified", true);

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get available runners error:", error);
      return { data: null, error: error.message };
    }
  }

  // Notification methods
  static async getUserNotifications(userId: string) {
    return NotificationService.getUserNotifications(userId);
  }

  static async markNotificationAsRead(notificationId: string) {
    return NotificationService.markNotificationAsRead(notificationId);
  }

  static async markAllNotificationsAsRead(userId: string) {
    return NotificationService.markAllNotificationsAsRead(userId);
  }

  // Order methods
  static async getOrderById(orderId: string) {
    return OrderService.getOrderById(orderId);
  }

  static async getStudentOrders(studentId: string) {
    return OrderService.getStudentOrders(studentId);
  }

  static async createOrder(
    orderData: Database["public"]["Tables"]["orders"]["Insert"],
  ) {
    return OrderService.createOrder(orderData);
  }

  static async addOrderItems(
    orderItems: Database["public"]["Tables"]["order_items"]["Insert"][],
  ) {
    return OrderService.addOrderItems(orderItems);
  }

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updates?: any,
  ) {
    return OrderService.updateOrderStatus(orderId, status, updates);
  }

  // Item methods
  static async getItemsByCategory(categoryId: string) {
    return ItemService.getItemsByCategory(categoryId);
  }

  static async getItemById(itemId: string) {
    return ItemService.getItemById(itemId);
  }

  // Storage methods
  static async uploadProfileImage(
    userId: string,
    fileUri: string,
    fileName: string,
  ) {
    return StorageService.uploadProfileImage(userId, fileUri, fileName);
  }
}

export class ItemService {
  /**
   * Get all categories
   */
  static async getCategories() {
    // Remove or set to false to test real Supabase connection
    // if (isMockModeEnabled()) {
    //   console.log("Using mock data for categories");
    //   return MockItemService.getCategories();
    // }

    try {
      console.log("Fetching categories from Supabase...");
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Categories fetched successfully:");
      return { data, error: null };
    } catch (error: any) {
      console.error("Failed to fetch categories:", error.message);
      return { 
        data: null, 
        error: "Failed to load categories" 
      };
    }
  }

  /**
   * Get items by category
   */
  static async getItemsByCategory(categoryId: string) {
    // Use mock data if database is not available or in development mode
    // if (isMockModeEnabled()) {
    //   console.log("Using mock data for items");
    //   return MockItemService.getItemsByCategory(categoryId);
    // }
    try {
      const { data, error } = await supabase
        .from("items")
        .select(
          `
          *,
          category:categories(*)
        `,
        )
        .eq("category_id", categoryId)
        .eq("is_available", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get items by category error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Search items
   */
  static async searchItems(query: string) {
    try {
      const { data, error } = await supabase
        .from("items")
        .select(
          `
          *,
          category:categories(*)
        `,
        )
        .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
        .eq("is_available", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Search items error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get item by ID
   */
  static async getItemById(itemId: string) {
    try {
      const { data, error } = await supabase
        .from("items")
        .select(
          `
          *,
          category:categories(*)
        `,
        )
        .eq("id", itemId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get item by ID error:", error);
      return { data: null, error: error.message };
    }
  }
}

// Order Functions
export class OrderService {
  /**
   * Create new order
   */
  static async createOrder(
    orderData: Database["public"]["Tables"]["orders"]["Insert"],
  ) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Create order error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Add items to order
   */
  static async addOrderItems(
    orderItems: Database["public"]["Tables"]["order_items"]["Insert"][],
  ) {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Add order items error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get orders for student
   */
  static async getStudentOrders(studentId: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          runner:users!orders_runner_id_fkey(*),
          order_items(
            *,
            item:items(*)
          )
        `,
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get student orders error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get available orders for runners
   */
  static async getAvailableOrders() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          student:users!orders_student_id_fkey(*),
          order_items(
            *,
            item:items(*)
          )
        `,
        )
        .eq("status", "pending")
        .is("runner_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get available orders error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get orders for runner
   */
  static async getRunnerOrders(runnerId: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          student:users!orders_student_id_fkey(*),
          order_items(
            *,
            item:items(*)
          )
        `,
        )
        .eq("runner_id", runnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get runner orders error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    additionalData?: Partial<Database["public"]["Tables"]["orders"]["Update"]>,
  ) {
    try {
      const updateData: Database["public"]["Tables"]["orders"]["Update"] = {
        status,
        ...additionalData,
      };

      // Set timestamp fields based on status
      if (status === "accepted") {
        updateData.accepted_at = new Date().toISOString();
      } else if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Update order status error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Assign runner to order
   */
  static async assignRunnerToOrder(orderId: string, runnerId: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({
          runner_id: runnerId,
          status: "accepted",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("status", "pending") // Ensure order is still pending
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Assign runner to order error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get order by ID with full details
   */
  static async getOrderById(orderId: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          student:users!orders_student_id_fkey(*),
          runner:users!orders_runner_id_fkey(*),
          order_items(
            *,
            item:items(
              *,
              category:categories(*)
            )
          )
        `,
        )
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get order by ID error:", error);
      return { data: null, error: error.message };
    }
  }
}

// Notification Functions
export class NotificationService {
  /**
   * Create notification
   */
  static async createNotification(
    notificationData: Database["public"]["Tables"]["notifications"]["Insert"],
  ) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Create notification error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get user notifications error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Mark notification as read error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllNotificationsAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Mark all notifications as read error:", error);
      return { data: null, error: error.message };
    }
  }
}

// Real-time Subscriptions
export class RealtimeService {
  /**
   * Subscribe to order updates
   */
  static subscribeToOrderUpdates(
    orderId: string,
    callback: (payload: any) => void,
  ) {
    return supabase
      .channel(`order_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        callback,
      )
      .subscribe();
  }

  /**
   * Subscribe to new orders for runners
   */
  static subscribeToNewOrders(callback: (payload: any) => void) {
    return supabase
      .channel("new_orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        callback,
      )
      .subscribe();
  }

  /**
   * Subscribe to user notifications
   */
  static subscribeToUserNotifications(
    userId: string,
    callback: (payload: any) => void,
  ) {
    return supabase
      .channel(`notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  }

  /**
   * Unsubscribe from channel
   */
  static unsubscribe(subscription: any) {
    return supabase.removeChannel(subscription);
  }
}

// File Upload Functions
export class StorageService {
  /**
   * Upload profile image
   */
  static async uploadProfileImage(
    userId: string,
    fileUri: string,
    fileName: string,
  ) {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const filePath = `profiles/${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("user-images")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-images").getPublicUrl(filePath);

      return { data: { path: data.path, publicUrl }, error: null };
    } catch (error: any) {
      console.error("Upload profile image error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Upload receipt image
   */
  static async uploadReceiptImage(
    orderId: string,
    fileUri: string,
    fileName: string,
  ) {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const filePath = `receipts/${orderId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("order-receipts")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("order-receipts").getPublicUrl(filePath);

      return { data: { path: data.path, publicUrl }, error: null };
    } catch (error: any) {
      console.error("Upload receipt image error:", error);
      return { data: null, error: error.message };
    }
  }
}

// Export the configured client and all services
export default supabase;
