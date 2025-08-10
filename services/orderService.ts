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
}