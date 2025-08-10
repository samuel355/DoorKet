import { OrderStatus } from "@/types";
import supabase, { Database } from "./supabase";
import { OrderService } from "./orderService";
import { ItemService } from "./itemService";
import { StorageService } from "./storageService";
import NotificationService from "@/services/notificationService";


// User Profile Functions
export class ProfileService {
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