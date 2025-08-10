// src/services/notificationService.ts
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/services/supabase";
import type { Database } from "@/services/supabase";
import type { NotificationType, Order } from "@/types";

// ------------------ Categories/Types ------------------
export const NOTIFICATION_CATEGORIES = {
  ORDER_UPDATE: "order_update",
  PAYMENT: "payment",
  GENERAL: "general",
  PROMOTION: "promotion",
} as const;

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

type NotificationsInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

// ------------------ Singleton Service ------------------
class NotificationService {
  private static _instance: NotificationService | null = null;
  private realtime: Map<string, RealtimeChannel> = new Map();
  static get instance() {
    if (!this._instance) this._instance = new NotificationService();
    return this._instance;
  }

  private pushToken: string | null = null;
  private notificationSub?: Notifications.Subscription;
  private responseSub?: Notifications.Subscription;

  // Optional navigation hooks (set from App layer)
  private nav = {
    gotoOrder: (orderId: string) => {},
    gotoPayment: (orderId: string) => {},
  };

  /** Call this once from App.tsx on startup */
  async init() {
    // Set global handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    await this.setupCategories();
    this.attachListeners();
  }

  /** Clean up listeners (optional on unmount) */
  cleanup = () => {
    if (this.notificationSub) {
      Notifications.removeNotificationSubscription(this.notificationSub);
      this.notificationSub = undefined;
    }
    if (this.responseSub) {
      Notifications.removeNotificationSubscription(this.responseSub);
      this.responseSub = undefined;
    }
    this.unsubscribeAll();
  };

  /** Provide navigation handlers so taps can route into screens */
  configureNavigation(opts: { gotoOrder?: (id: string) => void; gotoPayment?: (id: string) => void }) {
    this.nav = { ...this.nav, ...opts };
  }

  // ------------------ Expo notifications ------------------
  private async setupCategories() {
    if (Platform.OS !== "ios") return;
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.ORDER_UPDATE, [
      { identifier: "view_order", buttonTitle: "View Order", options: { opensAppToForeground: true } },
      { identifier: "dismiss", buttonTitle: "Dismiss", options: { opensAppToForeground: false } },
    ]);
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.PAYMENT, [
      { identifier: "view_payment", buttonTitle: "View Details", options: { opensAppToForeground: true } },
    ]);
  }

  private attachListeners() {
    this.notificationSub = Notifications.addNotificationReceivedListener(this.onForegroundNotification);
    this.responseSub = Notifications.addNotificationResponseReceivedListener(this.onNotificationResponse);
  }

  private onForegroundNotification = async (notification: Notifications.Notification) => {
    const { title, body, data } = notification.request.content;
    // keep an in-app feed (DB)
    await this.createNotification({
      user_id: (await supabase.auth.getUser()).data.user?.id ?? "",
      title: title || "",
      message: body || "",
      type: (data?.type as NotificationType) || "general",
      data,
      is_read: false,
    });
    await this.updateBadgeCount();
  };

  private onNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification, actionIdentifier } = response;
    const { data } = notification.request.content;

    if (actionIdentifier === "view_order" && data?.orderId) {
      this.nav.gotoOrder(String(data.orderId));
      return;
    }
    if (actionIdentifier === "view_payment" && data?.orderId) {
      this.nav.gotoPayment(String(data.orderId));
      return;
    }
    // Default tap
    if (data?.type === "order_update" && data?.orderId) this.nav.gotoOrder(String(data.orderId));
    if (data?.type === "payment" && data?.orderId) this.nav.gotoPayment(String(data.orderId));
  };

  async requestPermissions(): Promise<NotificationPermissions> {
    if (!Device.isDevice) {
      return { granted: false, canAskAgain: false, status: "denied" as Notifications.PermissionStatus };
    }
    const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") {
      return { granted: true, canAskAgain, status: existingStatus };
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return { granted: status === "granted", canAskAgain, status };
  }

  async getPushToken() {
    if (this.pushToken) return { success: true, token: this.pushToken } as const;
    if (!Device.isDevice) return { success: false, error: "Push not supported on simulator" } as const;

    const perms = await this.requestPermissions();
    if (!perms.granted) return { success: false, error: "Notification permissions not granted" } as const;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants?.expoConfig?.extra?.eas?.projectId,
    });
    this.pushToken = token.data;
    return { success: true, token: this.pushToken } as const;
  }

  async registerDevice(userId: string) {
    const t = await this.getPushToken();
    if (!t.success || !t.token) return { success: false, error: t.error ?? "No token" } as const;

    const { error } = await supabase.from("device_tokens").upsert({
      user_id: userId,
      token: t.token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    });
    if (error) return { success: false, error: error.message } as const;
    return { success: true } as const;
  }

  async sendLocalNotification(options: LocalNotificationOptions) {
    const perms = await this.requestPermissions();
    if (!perms.granted) return null;
  
    // Build a properly typed trigger
    const trigger: Notifications.NotificationTriggerInput =
      options.scheduledTime
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DATE, // or: type: 'date'
            date: options.scheduledTime,
          }
        : null;
  
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data || {},
        categoryIdentifier: options.categoryId,
        // iOS accepts boolean or a sound name; leave true for default
        sound: options.sound !== false ? true : undefined,
        badge: options.badge,
      },
      // On Android you may also want to force a channel (created in init())
      trigger,
    });
  
    return id;
  }


  async scheduleReminder(title: string, body: string, when: Date, data?: any) {
    return this.sendLocalNotification({ title, body, data, scheduledTime: when });
  }

  async cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  }

  async getNotificationSettings() {
    return Notifications.getPermissionsAsync();
  }

  // ------------------ Realtime ------------------
  subscribeToOrderUpdates(orderId: string, cb: (order: Order) => void) {
    const key = `order_${orderId}`;
    if (this.realtime.has(key)) return;

    const sub = supabase
      .channel(key)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        async (payload) => {
          if (payload.new) {
            const o = payload.new as Order;
            cb(o);
            await this.handleOrderUpdateNotification(o);
          }
        }
      )
      .subscribe();

    this.realtime.set(key, sub);
  }

  subscribeToNewOrders(cb: (order: Order) => void) {
    const key = "new_orders";
    if (this.realtime.has(key)) return;

    const sub = supabase
      .channel(key)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          if (payload.new) {
            const o = payload.new as Order;
            cb(o);
            await this.sendLocalNotification({
              title: "New Order Available",
              body: `Order #${o.order_number} • GHS ${o.total_amount}`,
              data: { type: "new_order", orderId: o.id },
              categoryId: NOTIFICATION_CATEGORIES.ORDER_UPDATE,
            });
          }
        }
      )
      .subscribe();

    this.realtime.set(key, sub);
  }

  subscribeToUserNotifications(userId: string, cb: (row: any) => void): () => void {
    const key = `notifications_${userId}`;
    if (this.realtime.has(key)) {
      return () => this.unsubscribe(key); // ✅ no void branch
    }
  
    const sub = supabase
      .channel(key)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        async (payload) => {
          if (payload.new) {
            cb(payload.new);
            await this.sendLocalNotification({
              title: payload.new.title,
              body: payload.new.message,
              data: { type: payload.new.type, notificationId: payload.new.id, ...(payload.new.data || {}) },
            });
          }
        }
      )
      .subscribe();
  
    this.realtime.set(key, sub);
    return () => this.unsubscribe(key);
  }
  
  unsubscribe(channelName: string) {
    const sub = this.realtime.get(channelName);
    if (sub) {
      supabase.removeChannel(sub);
      this.realtime.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.realtime.forEach((sub) => supabase.removeChannel(sub));
    this.realtime.clear();
  }

  // ------------------ DB (notifications table) ------------------
  async createNotification(row: NotificationsInsert) {
    try {
      const { data, error } = await supabase.from("notifications").insert(row).select().single();
      if (error) throw error;
      return { data, error: null as null };
    } catch (e: any) {
      console.error("createNotification:", e);
      return { data: null, error: e.message as string };
    }
  }

  async getUserNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { data, error: null as null };
    } catch (e: any) {
      console.error("getUserNotifications:", e);
      return { data: null, error: e.message as string };
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .select()
        .single();
      if (error) throw error;
      await this.updateBadgeCount();
      return { data, error: null as null };
    } catch (e: any) {
      console.error("markNotificationAsRead:", e);
      return { data: null, error: e.message as string };
    }
  }

  async markAllNotificationsAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .select();
      if (error) throw error;
      await this.updateBadgeCount();
      return { data, error: null as null };
    } catch (e: any) {
      console.error("markAllNotificationsAsRead:", e);
      return { data: null, error: e.message as string };
    }
  }

  private async updateBadgeCount() {
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id;
      if (!userId) return;
      const { data } = await supabase.from("notifications").select("id").eq("user_id", userId).eq("is_read", false);
      const count = data?.length ?? 0;
      await Notifications.setBadgeCountAsync(count);
    } catch (e) {
      console.error("updateBadgeCount:", e);
    }
  }

  // ------------------ Server push via Edge Function ------------------
  async sendPushNotification(userIds: string[], payload: PushNotificationData) {
    try {
      const { error } = await supabase.functions.invoke("send-push-notification", {
        body: { userIds, notification: payload },
      });
      if (error) throw error;
      return { success: true as const };
    } catch (e: any) {
      console.error("sendPushNotification:", e);
      return { success: false as const, error: e.message as string };
    }
  }

  // ------------------ Helpers ------------------
  private async handleOrderUpdateNotification(order: Order) {
    let title = "";
    let body = "";
    switch (order.status) {
      case "accepted":
        title = "Order Accepted";
        body = `Your order #${order.order_number} has been accepted`;
        break;
      case "shopping":
        title = "Shopping in Progress";
        body = `Runner is shopping for order #${order.order_number}`;
        break;
      case "delivering":
        title = "Out for Delivery";
        body = `Order #${order.order_number} is on the way`;
        break;
      case "completed":
        title = "Order Delivered";
        body = `Order #${order.order_number} has been delivered`;
        break;
      case "cancelled":
        title = "Order Cancelled";
        body = `Order #${order.order_number} was cancelled`;
        break;
    }
    if (title) {
      await this.sendLocalNotification({
        title,
        body,
        data: { type: "order_update", orderId: order.id },
        categoryId: NOTIFICATION_CATEGORIES.ORDER_UPDATE,
      });
    }
  }
}

// Export singleton
const service = NotificationService.instance;
export default service;
