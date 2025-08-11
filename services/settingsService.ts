import AsyncStorage from "@react-native-async-storage/async-storage";

export type CurrencyCode = "GHS" | "USD" | "NGN" | "KES";
export type RegionCode = "GH" | "NG" | "KE" | "TZ" | "LR";

export type AdminSettings = {
  organizationName: string;
  currency: CurrencyCode;
  region: RegionCode;
  maintenanceMode: boolean;
  lowStockThreshold: number; // <= 0 disables alerts
  allowPriceEdits: boolean;
  autoApproveStudents: boolean;
  requireRunnerVerification: boolean;
  enableCashOnDelivery: boolean;
};

export type NotificationPrefs = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours: { start: string; end: string } | null; // "22:00" - "06:30"
  orderEvents: boolean;
  stockAlerts: boolean;
  systemAnnouncements: boolean;
};

export type SecuritySettings = {
  biometricLock: boolean;
  reauthForSensitive: boolean;
};

const K_SETTINGS = "ADMIN_SETTINGS:v1";
const K_NOTIF    = "ADMIN_NOTIFICATION_PREFS:v1";
const K_SEC      = "ADMIN_SECURITY_SETTINGS:v1";

const defaults: AdminSettings = {
  organizationName: "DoorKet",
  currency: "GHS",
  region: "GH",
  maintenanceMode: false,
  lowStockThreshold: 5,
  allowPriceEdits: true,
  autoApproveStudents: true,
  requireRunnerVerification: true,
  enableCashOnDelivery: true,
};

const notifDefaults: NotificationPrefs = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  quietHours: null,
  orderEvents: true,
  stockAlerts: true,
  systemAnnouncements: true,
};

const secDefaults: SecuritySettings = {
  biometricLock: false,
  reauthForSensitive: true,
};

async function get<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try { return { ...fallback, ...JSON.parse(raw) }; }
  catch { return fallback; }
}
async function set<T>(key: string, val: T) {
  await AsyncStorage.setItem(key, JSON.stringify(val));
}

export const SettingsAdmin = {
  async getAll(): Promise<AdminSettings> { return get(K_SETTINGS, defaults); },
  async update(patch: Partial<AdminSettings>): Promise<AdminSettings> {
    const current = await SettingsAdmin.getAll();
    const next = { ...current, ...patch };
    await set(K_SETTINGS, next);
    return next;
  },
  async reset(): Promise<AdminSettings> { await set(K_SETTINGS, defaults); return defaults; },
};

export const NotificationAdmin = {
  async get(): Promise<NotificationPrefs> { return get(K_NOTIF, notifDefaults); },
  async update(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const current = await NotificationAdmin.get();
    const next = { ...current, ...patch };
    await set(K_NOTIF, next);
    return next;
  },
  async reset(): Promise<NotificationPrefs> { await set(K_NOTIF, notifDefaults); return notifDefaults; },
};

export const SecurityAdmin = {
  async get(): Promise<SecuritySettings> { return get(K_SEC, secDefaults); },
  async update(patch: Partial<SecuritySettings>): Promise<SecuritySettings> {
    const current = await SecurityAdmin.get();
    const next = { ...current, ...patch };
    await set(K_SEC, next);
    return next;
  },
  async reset(): Promise<SecuritySettings> { await set(K_SEC, secDefaults); return secDefaults; },
};

// Optional helpers
export async function clearAllAdminLocalCaches() {
  await Promise.all([
    AsyncStorage.removeItem(K_SETTINGS),
    AsyncStorage.removeItem(K_NOTIF),
    AsyncStorage.removeItem(K_SEC),
  ]);
}
