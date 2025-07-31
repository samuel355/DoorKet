import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import {
  supabase,
  NotificationService as SupabaseNotificationService,
} from "./supabase";
import { NotificationType, Order, User as AppUser } from "../types";

// Notification Configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification Categories
export const NOTIFICATION_CATEGORIES = {
  ORDER_UPDATE: "order_update",
  PAYMENT: "payment",
  GENERAL: "general",
  PROMOTION: "promotion",
} as const;

// Notification Types
export interface PushNotificationData {
  type: NotificationType;
  orderId?: string;
  userId?: string;
  title: string;
  message: string;
  data?: any;
}

export interface LocalNotificationOptions {
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
  sound?: boolean;
  badge?: number;
  scheduledTime?: Date;
}

export interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

// Push Notification Token Response
interface PushTokenResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private realtimeSubscriptions: Map<string, any> = new Map();

  private constructor() {
    this.initializeNotifications();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  private async initializeNotifications() {
    try {
      // Set up notification categories
      await this.setupNotificationCategories();

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log("Notification service initialized");
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
    }
  }

  /**
   * Setup notification categories for iOS
   */
  private async setupNotificationCategories() {
    if (Platform.OS === "ios") {
      await Notifications.setNotificationCategoryAsync("order_update", [
        {
          identifier: "view_order",
          buttonTitle: "View Order",
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: "dismiss",
          buttonTitle: "Dismiss",
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync("payment", [
        {
          identifier: "view_payment",
          buttonTitle: "View Details",
          options: {
            opensAppToForeground: true,
          },
        },
      ]);
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupNotificationListeners() {
    // Listener for notifications that are received while the app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived.bind(this),
    );

    // Listener for when a user taps on or interacts with a notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(
        this.handleNotificationResponse.bind(this),
      );
  }

  /**
   * Handle notification received while app is in foreground
   */
  private handleNotificationReceived(notification: Notifications.Notification) {
    console.log("Notification received:", notification);

    const { title, body, data } = notification.request.content;

    // Store notification in local database
    this.storeNotificationLocally({
      title: title || "",
      body: body || "",
      data,
      type: (data?.type as string) || "general",
    });

    // Update badge count
    this.updateBadgeCount();
  }

  /**
   * Handle notification response (user interaction)
   */
  private handleNotificationResponse(
    response: Notifications.NotificationResponse,
  ) {
    console.log("Notification response:", response);

    const { notification, actionIdentifier } = response;
    const { data } = notification.request.content;

    // Handle different actions
    switch (actionIdentifier) {
      case "view_order":
        if (data?.orderId) {
          this.navigateToOrder(String(data.orderId));
        }
        break;
      case "view_payment":
        if (data?.orderId) {
          this.navigateToPayment(String(data.orderId));
        }
        break;
      default:
        // Default action (tap on notification)
        this.handleDefaultNotificationAction(data || {});
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      if (!Device.isDevice) {
        return {
          granted: false,
          canAskAgain: false,
          status: "denied" as Notifications.PermissionStatus,
        };
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return {
        granted: finalStatus === "granted",
        canAskAgain: existingStatus === "undetermined",
        status: finalStatus,
      };
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return {
        granted: false,
        canAskAgain: false,
        status: "denied" as Notifications.PermissionStatus,
      };
    }
  }

  /**
   * Get push notification token
   */
  async getPushToken(): Promise<PushTokenResponse> {
    try {
      if (this.pushToken) {
        return { success: true, token: this.pushToken };
      }

      if (!Device.isDevice) {
        return {
          success: false,
          error: "Push notifications not supported on simulator",
        };
      }

      const permissions = await this.requestPermissions();
      if (!permissions.granted) {
        return {
          success: false,
          error: "Notification permissions not granted",
        };
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId:
          Constants.expoConfig?.extra?.eas?.projectId || "default-project-id",
      });

      this.pushToken = token.data;
      console.log("Push token obtained:", this.pushToken);

      return { success: true, token: this.pushToken };
    } catch (error: any) {
      console.error("Error getting push token:", error);
      return {
        success: false,
        error: error.message || "Failed to get push token",
      };
    }
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tokenResponse = await this.getPushToken();
      if (!tokenResponse.success || !tokenResponse.token) {
        return {
          success: false,
          error: tokenResponse.error || "Failed to get push token",
        };
      }

      // Store token in Supabase (you'd need to create a device_tokens table)
      const { error } = await supabase.from("device_tokens").upsert({
        user_id: userId,
        token: tokenResponse.token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error storing device token:", error);
        return { success: false, error: "Failed to register device" };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error registering device:", error);
      return {
        success: false,
        error: error.message || "Failed to register device",
      };
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(
    options: LocalNotificationOptions,
  ): Promise<string | null> {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.granted) {
        console.warn("Notification permissions not granted");
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data || {},
          categoryIdentifier: options.categoryId,
          sound: options.sound !== false,
          badge: options.badge,
        },
        trigger: options.scheduledTime
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: options.scheduledTime,
            }
          : null,
      });

      return notificationId;
    } catch (error) {
      console.error("Error sending local notification:", error);
      return null;
    }
  }

  /**
   * Send push notification (server-side)
   */
  async sendPushNotification(
    userIds: string[],
    notification: PushNotificationData,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This would typically be done on your backend
      // For demo purposes, we'll call a Supabase Edge Function
      const { error } = await supabase.functions.invoke(
        "send-push-notification",
        {
          body: {
            userIds,
            notification,
          },
        },
      );

      if (error) {
        console.error("Error sending push notification:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error sending push notification:", error);
      return {
        success: false,
        error: error.message || "Failed to send notification",
      };
    }
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrderUpdates(orderId: string, callback: (order: Order) => void) {
    const channelName = `order_${orderId}`;

    if (this.realtimeSubscriptions.has(channelName)) {
      return; // Already subscribed
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Order update received:", payload);

          if (payload.new) {
            callback(payload.new as Order);

            // Send local notification for order updates
            this.handleOrderUpdateNotification(payload.new as Order);
          }
        },
      )
      .subscribe();

    this.realtimeSubscriptions.set(channelName, subscription);
  }

  /**
   * Subscribe to new orders (for runners)
   */
  subscribeToNewOrders(callback: (order: Order) => void) {
    const channelName = "new_orders";

    if (this.realtimeSubscriptions.has(channelName)) {
      return;
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("New order received:", payload);

          if (payload.new) {
            callback(payload.new as Order);

            // Send notification to available runners
            this.sendLocalNotification({
              title: "New Order Available",
              body: `Order #${payload.new.order_number} - GHS ${payload.new.total_amount}`,
              data: { type: "new_order", orderId: payload.new.id },
              categoryId: "order_update",
            });
          }
        },
      )
      .subscribe();

    this.realtimeSubscriptions.set(channelName, subscription);
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToUserNotifications(
    userId: string,
    callback: (notification: any) => void,
  ) {
    const channelName = `notifications_${userId}`;

    if (this.realtimeSubscriptions.has(channelName)) {
      return;
    }

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("User notification received:", payload);

          if (payload.new) {
            callback(payload.new);

            // Send local notification
            this.sendLocalNotification({
              title: payload.new.title,
              body: payload.new.message,
              data: {
                type: payload.new.type,
                notificationId: payload.new.id,
                ...payload.new.data,
              },
            });
          }
        },
      )
      .subscribe();

    this.realtimeSubscriptions.set(channelName, subscription);
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(channelName: string) {
    const subscription = this.realtimeSubscriptions.get(channelName);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.realtimeSubscriptions.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all real-time updates
   */
  unsubscribeAll() {
    this.realtimeSubscriptions.forEach((subscription, channelName) => {
      supabase.removeChannel(subscription);
    });
    this.realtimeSubscriptions.clear();
  }

  /**
   * Handle order update notifications
   */
  private async handleOrderUpdateNotification(order: Order) {
    let title = "";
    let body = "";

    switch (order.status) {
      case "accepted":
        title = "Order Accepted";
        body = `Your order #${order.order_number} has been accepted by a runner`;
        break;
      case "shopping":
        title = "Shopping in Progress";
        body = `Your runner is shopping for order #${order.order_number}`;
        break;
      case "delivering":
        title = "Out for Delivery";
        body = `Your order #${order.order_number} is on the way`;
        break;
      case "completed":
        title = "Order Delivered";
        body = `Your order #${order.order_number} has been delivered`;
        break;
      case "cancelled":
        title = "Order Cancelled";
        body = `Your order #${order.order_number} has been cancelled`;
        break;
    }

    if (title && body) {
      await this.sendLocalNotification({
        title,
        body,
        data: { type: "order_update", orderId: order.id },
        categoryId: "order_update",
      });
    }
  }

  /**
   * Store notification locally for in-app display
   */
  private async storeNotificationLocally(notification: {
    title: string;
    body: string;
    data?: any;
    type: string;
  }) {
    try {
      // Store in AsyncStorage or local SQLite database
      // For now, we'll use Supabase notifications table
      const user = supabase.auth.getUser();
      if ((await user).data.user) {
        await SupabaseNotificationService.createNotification({
          user_id: (await user).data.user!.id,
          title: notification.title,
          message: notification.body,
          type: notification.type as NotificationType,
          data: notification.data,
          is_read: false,
        });
      }
    } catch (error) {
      console.error("Error storing notification locally:", error);
    }
  }

  /**
   * Update app badge count
   */
  private async updateBadgeCount() {
    try {
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        const { data } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.data.user.id)
          .eq("is_read", false);

        const count = data?.length || 0;
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error("Error updating badge count:", error);
    }
  }

  /**
   * Navigate to order screen
   */
  private navigateToOrder(orderId: string) {
    // This would need to be implemented with your navigation system
    console.log("Navigate to order:", orderId);
  }

  /**
   * Navigate to payment screen
   */
  private navigateToPayment(orderId: string) {
    // This would need to be implemented with your navigation system
    console.log("Navigate to payment:", orderId);
  }

  /**
   * Handle default notification action
   */
  private handleDefaultNotificationAction(data: any) {
    if (data?.type === "order_update" && data?.orderId) {
      this.navigateToOrder(data.orderId);
    } else if (data?.type === "payment" && data?.orderId) {
      this.navigateToPayment(data.orderId);
    }
  }

  /**
   * Schedule reminder notification
   */
  async scheduleReminder(
    title: string,
    body: string,
    scheduledTime: Date,
    data?: any,
  ): Promise<string | null> {
    return this.sendLocalNotification({
      title,
      body,
      data,
      scheduledTime,
    });
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error cancelling notification:", error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    return Notifications.getPermissionsAsync();
  }

  /**
   * Cleanup when app is closing
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    this.unsubscribeAll();
  }
}

// Export singleton instance
export default NotificationService.getInstance();
