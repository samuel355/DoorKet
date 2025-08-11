import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
//import { MockItemService, isMockModeEnabled } from "./mockData";

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

// Database type definitions
export interface Database {
  public: {
    Tables: {
      users: {
        Row: AppUser;
        Insert: Omit<AppUser, "id" | "created_at" | "updated_at">;
         Update: Partial<Omit<AppUser, "id" | "created_at">>;
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
      flowType: "pkce",
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);

// Export the configured client and all services
export default supabase;
