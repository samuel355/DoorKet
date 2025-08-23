import supabase from "./supabase";

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
      return { data, error: null };
    } catch (error: any) {
      console.error("Failed to fetch categories:", error.message);
      return {
        data: null,
        error: "Failed to load categories",
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
      console.log("Fetched items by category:", data);
      return { data, error: null };
    } catch (error: any) {
      console.error("Get items by category error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get all available items
   */
  static async getAllItems(limit?: number) {
    try {
      let query = supabase
        .from("items")
        .select(
          `
          *,
          category:categories(*)
        `,
        )
        .eq("is_available", true)
        .order("name", { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Get all items error:", error);
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