import { OrderStatus } from "@/types";
import supabase, { Database } from "./supabase";

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

  /**
   * Get active orders for runner
   */
  static async getRunnerActiveOrders(runnerId: string) {
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
        .in("status", ["accepted", "shopping", "delivering"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get runner active orders error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Accept an order
   */
  static async acceptOrder(orderId: string, runnerId: string) {
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
        .eq("status", "pending")
        .is("runner_id", null)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, message: "Order accepted successfully" };
    } catch (error: any) {
      console.error("Accept order error:", error);
      return { success: false, data: null, message: error.message };
    }
  }

  /**
   * Update order status with success/error handling
   */
  static async updateOrderStatusWithResult(
    orderId: string,
    status: OrderStatus,
    additionalData?: Partial<Database["public"]["Tables"]["orders"]["Update"]>,
  ) {
    try {
      const updateData: Database["public"]["Tables"]["orders"]["Update"] = {
        status,
        updated_at: new Date().toISOString(),
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
      return {
        success: true,
        data,
        message: "Order status updated successfully",
      };
    } catch (error: any) {
      console.error("Update order status error:", error);
      return { success: false, data: null, message: error.message };
    }
  }

  /**
   * Get runner statistics
   */
  static async getRunnerStats(runnerId: string) {
    try {
      // Get total orders count
      const { data: totalOrders, error: totalError } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("runner_id", runnerId);

      if (totalError) throw totalError;

      // Get completed orders count
      const { data: completedOrders, error: completedError } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("runner_id", runnerId)
        .eq("status", "completed");

      if (completedError) throw completedError;

      // Get pending orders count
      const { data: pendingOrders, error: pendingError } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("runner_id", runnerId)
        .in("status", ["accepted", "shopping", "delivering"]);

      if (pendingError) throw pendingError;

      // Get today's orders count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayOrders, error: todayError } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("runner_id", runnerId)
        .gte("created_at", today.toISOString());

      if (todayError) throw todayError;

      // Calculate total earnings (sum of delivery fees and service fees)
      const { data: earningsData, error: earningsError } = await supabase
        .from("orders")
        .select("delivery_fee, service_fee")
        .eq("runner_id", runnerId)
        .eq("status", "completed");

      if (earningsError) throw earningsError;

      const totalEarnings =
        earningsData?.reduce(
          (sum, order) =>
            sum + (order.delivery_fee || 0) + (order.service_fee || 0),
          0,
        ) || 0;

      // Get runner rating from user profile
      const { data: runnerData, error: runnerError } = await supabase
        .from("users")
        .select("rating")
        .eq("id", runnerId)
        .single();

      if (runnerError) throw runnerError;

      const stats = {
        total_orders: totalOrders?.length || 0,
        pending_orders: pendingOrders?.length || 0,
        completed_orders: completedOrders?.length || 0,
        total_earnings: totalEarnings,
        average_rating: runnerData?.rating || 0,
        today_orders: todayOrders?.length || 0,
        total_deliveries: completedOrders?.length || 0,
        completion_rate: totalOrders?.length
          ? ((completedOrders?.length || 0) / totalOrders.length) * 100
          : 0,
        average_delivery_time: 35, // Placeholder - implement actual calculation
      };

      return { data: stats, error: null };
    } catch (error: any) {
      console.error("Get runner stats error:", error);
      return { data: null, error: error.message };
    }
  }
}
