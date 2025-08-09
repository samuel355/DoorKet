// DoorKet Type Definitions
import { StackScreenProps } from "@react-navigation/stack";

export type UserType = "student" | "runner" | "admin";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "shopping"
  | "delivering"
  | "completed"
  | "cancelled";

export type PaymentMethod = "momo" | "card" | "cash";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type NotificationType =
  | "order_update"
  | "payment"
  | "general"
  | "promotion";

// Database Entity Types
export interface User {
  id: string;
  email: string; // Required now since no phone auth
  phone?: string; // Optional now - phone auth disabled
  full_name: string;
  user_type: UserType;
  university: string;
  hall_hostel?: string;
  room_number?: string;
  is_verified: boolean;
  is_active: boolean;
  face_id_enabled: boolean;
  profile_image_url?: string;
  rating: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon_name?: string;
  color_code: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Item {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  base_price?: number;
  unit: string;
  is_available: boolean;
  image_url?: string;
  barcode?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Order {
  id: string;
  order_number: string;
  student_id: string;
  runner_id?: string;
  status: OrderStatus;
  total_amount: number;
  service_fee: number;
  delivery_fee: number;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  special_instructions?: string;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference?: string;
  estimated_delivery_time?: string;
  accepted_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  student?: User;
  runner?: User;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id?: string;
  custom_item_name?: string;
  quantity: number;
  unit_price?: number;
  custom_budget?: number;
  actual_price?: number;
  notes?: string;
  receipt_image_url?: string;
  created_at: string;
  item?: Item;
}

export interface Rating {
  id: string;
  order_id: string;
  student_id: string;
  runner_id: string;
  rating: number;
  review?: string;
  created_at: string;
  order?: Order;
  student?: User;
  runner?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  is_read: boolean;
  created_at: string;
}

// Authentication Types
export interface AuthUser extends User {
  profile?: User;
}

export interface LoginCredentials {
  phone: string;
  otp?: string;
}

export interface RegisterData {
  phone?: string; // Optional now - phone auth disabled
  full_name: string;
  email: string; // Required now since no phone auth
  user_type: UserType;
  university: string;
  hall_hostel?: string;
  room_number?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Cart Types
export interface CartItem {
  id: string;
  item?: Item;
  custom_item_name?: string;
  quantity: number;
  unit_price?: number;
  custom_budget?: number;
  notes?: string;
  total_price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  total: number;
  delivery_address: string;
  special_instructions?: string;
}

// Payment Types
export interface PaymentRequest {
  amount: number;
  customerNumber: string;
  customerName: string;
  orderId: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  reference?: string;
  message: string;
  checkoutUrl?: string;
}

export interface PaymentStatusResponse {
  status: "pending" | "successful" | "failed";
  message: string;
  transactionId?: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Student: undefined;
  Runner: undefined;
  Admin: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: { userType?: UserType } | undefined;
  PhoneVerification: { phone: string; userType?: UserType };
  Register: { userType?: UserType }; // Removed phone requirement
  EmailVerification: { email: string; userType?: UserType };
  UserTypeSelection: undefined;
  ProfileSetup: { phone: string; userType: UserType };
  BiometricSetup: undefined;
  GoogleLogin: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type StudentStackParamList = {
  // Home Tab Stack
  Home: undefined;
  Categories: undefined;
  CategoryItems: { categoryId: string; categoryName: string };
  ItemDetails: { itemId: string };
  Notifications: undefined;

  // Cart Tab Stack
  Cart: undefined;
  Checkout: undefined;
  Payment: { orderId: string; amount: number };

  // Orders Tab Stack
  OrderHistory: undefined;
  OrderTracking: { orderId: string };

  // Profile Tab Stack
  Profile: undefined;
  Settings: undefined;

  // Tab Names
  HomeTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type RunnerStackParamList = {
  // Dashboard Tab Stack
  Dashboard: undefined;
  OrderDetails: { orderId: string };
  ShoppingList: { orderId: string };
  DeliveryNavigation: { orderId: string };

  // Available Orders Tab Stack
  AvailableOrders: undefined;

  // Active Orders Tab Stack
  AcceptedOrders: undefined;

  // Earnings Tab Stack
  Earnings: undefined;

  // Profile Tab Stack
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;

  // Tab Names
  DashboardTab: undefined;
  AvailableTab: undefined;
  ActiveTab: undefined;
  EarningsTab: undefined;
  ProfileTab: undefined;
};

export type AdminStackParamList = {
  // Dashboard Tab Stack
  Dashboard: undefined;
  Reports: undefined;

  // Users Tab Stack
  UserManagement: undefined;
  UserDetails: { userId: string; userName?: string };

  // Orders Tab Stack
  OrderManagement: undefined;
  OrderDetails: { orderId: string };

  // Catalog Tab Stack
  CategoryManagement: undefined;
  ItemManagement: { categoryId?: string; categoryName?: string };

  // Analytics Tab Stack
  Analytics: undefined;

  // Settings Tab Stack
  AdminSettings: undefined;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;

  // Tab Names
  DashboardTab: undefined;
  UsersTab: undefined;
  OrdersTab: undefined;
  CatalogTab: undefined;
  AnalyticsTab: undefined;
  SettingsTab: undefined;
};

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface OTPForm {
  otp: string;
}

export interface RegisterForm {
  full_name: string;
  email?: string;
  university: string;
  hall_hostel?: string;
  room_number?: string;
}

export interface ProfileUpdateForm {
  full_name: string;
  email?: string;
  hall_hostel?: string;
  room_number?: string;
}

export interface CheckoutForm {
  delivery_address: string;
  special_instructions?: string;
  payment_method: PaymentMethod;
}

export interface CustomItemForm {
  name: string;
  budget: number;
  notes?: string;
}

export interface RatingForm {
  rating: number;
  review?: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface DeliveryLocation extends Location {
  hall_hostel?: string;
  room_number?: string;
  special_instructions?: string;
}

// Filter and Search Types
export interface ItemFilter {
  category_id?: string;
  search_query?: string;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  sort_by?: "name" | "price" | "created_at";
  sort_order?: "asc" | "desc";
}

export interface OrderFilter {
  status?: OrderStatus;
  date_from?: string;
  date_to?: string;
  runner_id?: string;
  student_id?: string;
}

// Real-time Types
export interface RealtimeOrderUpdate {
  order_id: string;
  status: OrderStatus;
  runner_id?: string;
  message?: string;
  timestamp: string;
}

export interface RunnerLocation {
  runner_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Theme Types
export interface AppTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    success: string;
    warning: string;
  };
  fonts: {
    regular: string;
    medium: string;
    bold: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Statistics Types
export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_earnings?: number;
  average_rating?: number;
  today_orders: number;
}

export interface RunnerStats extends DashboardStats {
  total_deliveries: number;
  completion_rate: number;
  average_delivery_time: number;
}

export interface StudentStats {
  total_orders: number;
  total_spent: number;
  favorite_categories: string[];
  recent_orders: Order[];
}

// Configuration Types
export interface AppConfig {
  api_base_url: string;
  supabase_url: string;
  supabase_anon_key: string;
  firebase_config: {
    api_key: string;
    auth_domain: string;
    project_id: string;
    storage_bucket: string;
    messaging_sender_id: string;
    app_id: string;
  };
  payment_config: {
    hubtel_client_id: string;
    default_delivery_fee: number;
    default_service_fee: number;
    min_order_amount: number;
  };
  feature_flags: {
    enable_biometric_auth: boolean;
    enable_google_login: boolean;
    enable_card_payments: boolean;
    enable_cash_payments: boolean;
    enable_custom_items: boolean;
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Export default interface for convenience
export default interface DoorKetTypes {
  User: User;
  Order: Order;
  Item: Item;
  Category: Category;
  OrderItem: OrderItem;
  Cart: Cart;
  CartItem: CartItem;
  PaymentRequest: PaymentRequest;
  PaymentResponse: PaymentResponse;
  Notification: Notification;
  Rating: Rating;
}
