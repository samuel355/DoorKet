// src/services/admin.ts
import supabase, { Database } from "./supabase";

// ---------- Helpers ----------
type Range = { from?: string; to?: string };

const toISO = (d: Date | string | number) =>
  typeof d === "string" ? new Date(d).toISOString() : new Date(d).toISOString();

const todayISO = () => new Date().toISOString();

const safeSum = (arr: any[], key: string) =>
  arr.reduce((s, x) => s + (Number(x?.[key]) || 0), 0);

function pick<T extends object, K extends keyof T>(o: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  keys.forEach(k => (out[k] = o[k]));
  return out;
}

function errOut(e: any) {
  const msg = e?.message || String(e);
  console.error("[AdminService]", msg, e);
  return { data: null, error: msg };
}

// ========== DASHBOARD & ANALYTICS ==========
export class AdminService {
  static async getDashboardStats() {
    try {
      const since = new Date();
      since.setMonth(since.getMonth() - 6);

      const [ordersRes, usersRes, itemsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id,total_amount,created_at,payment_status,status")
          .gte("created_at", since.toISOString()),
        supabase.from("users").select("id,user_type,is_active"),
        supabase.from("items").select("id,is_available"),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (usersRes.error) throw usersRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const orders = ordersRes.data ?? [];
      const users = usersRes.data ?? [];
      const items = itemsRes.data ?? [];

      // revenue only from paid/settled orders
      const revenue = orders
        .filter(o => (o.payment_status as any) === "paid" || (o.payment_status as any) === "settled")
        .reduce((s, o) => s + (o.total_amount ?? 0), 0);

      // Last 6 months revenue buckets
      const months: { label: string; y: number; m: number }[] = [];
      const start = new Date();
      start.setMonth(start.getMonth() - 5);
      start.setDate(1);
      for (let i = 0; i < 6; i++) {
        const d = new Date(start);
        d.setMonth(start.getMonth() + i);
        months.push({ label: d.toLocaleString("default", { month: "short" }), y: d.getFullYear(), m: d.getMonth() });
      }

      const revenueData = months.map(({ y, m }) => {
        const total = orders
          .filter(o => {
            const d = new Date(o.created_at);
            return d.getFullYear() === y && d.getMonth() === m &&
              ((o.payment_status as any) === "paid" || (o.payment_status as any) === "settled");
          })
          .reduce((s, o) => s + (o.total_amount ?? 0), 0);
        return total;
      });

      return {
        data: {
          totalOrders: orders.length,
          revenue,
          activeUsers: users.filter(u => u.is_active && u.user_type === "student").length,
          totalProducts: items.filter(i => i.is_available).length,
          revenueData: { labels: months.map(m => m.label), data: revenueData },
        },
        error: null,
      };
    } catch (e) {
      return errOut(e);
    }
  }

  static async getRecentOrders(limit = 5) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          student:users!orders_student_id_fkey(id,full_name,email),
          runner:users!orders_runner_id_fkey(id,full_name,email),
          order_items(*, item:items(id,name,base_price))
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async getUserStats() {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      const total = data?.length ?? 0;
      return {
        data: {
          total,
          students: data.filter(u => u.user_type === "student").length,
          runners: data.filter(u => u.user_type === "runner").length,
          admins: data.filter(u => u.user_type === "admin").length,
          active: data.filter(u => u.is_active).length,
          inactive: data.filter(u => !u.is_active).length,
        },
        error: null,
      };
    } catch (e) {
      return errOut(e);
    }
  }

  static async getTopItems(limit = 5) {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("item:items(id,name),quantity")
        .order("quantity", { ascending: false })
        .limit(1000); // aggregate client-side (simple & fast for small sets)
      if (error) throw error;

      const map = new Map<string, { id: string; name: string; qty: number }>();
      for (const row of data ?? []) {
        const id = (row as any).item?.id;
        const name = (row as any).item?.name ?? "Unknown";
        if (!id) continue;
        const prev = map.get(id) ?? { id, name, qty: 0 };
        prev.qty += row.quantity ?? 0;
        map.set(id, prev);
      }
      const sorted = [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
      return { data: sorted, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async getTopCategories(limit = 5) {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("item:items(id,name,category_id),quantity");
      if (error) throw error;

      const catAgg = new Map<string, { category_id: string; qty: number }>();
      for (const row of data ?? []) {
        const catId = (row as any).item?.category_id;
        if (!catId) continue;
        const prev = catAgg.get(catId) ?? { category_id: catId, qty: 0 };
        prev.qty += row.quantity ?? 0;
        catAgg.set(catId, prev);
      }

      // fetch category names
      const ids = [...catAgg.keys()];
      let names = new Map<string, string>();
      if (ids.length) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id,name")
          .in("id", ids);
        names = new Map((cats ?? []).map(c => [c.id, c.name]));
      }

      const out = [...catAgg.values()]
        .map(c => ({ id: c.category_id, name: names.get(c.category_id) ?? "Unknown", qty: c.qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limit);

      return { data: out, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async getAnalytics(period: "day" | "week" | "month" | "year") {
    try {
      const start = new Date();
      switch (period) {
        case "day": start.setDate(start.getDate() - 1); break;
        case "week": start.setDate(start.getDate() - 7); break;
        case "month": start.setMonth(start.getMonth() - 1); break;
        case "year": start.setFullYear(start.getFullYear() - 1); break;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .gte("created_at", start.toISOString());

      if (error) throw error;

      const totalOrders = data?.length ?? 0;
      const totalRevenue = data?.reduce((s, o) => s + (o.total_amount ?? 0), 0) ?? 0;
      const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

      const ordersByStatus = (data ?? []).reduce((acc: Record<string, number>, o) => {
        const s = o.status as string;
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      }, {});

      // time-to-complete (mins)
      const ttc: number[] = [];
      for (const o of data ?? []) {
        if (o.accepted_at && o.completed_at) {
          const dt = (new Date(o.completed_at).getTime() - new Date(o.accepted_at).getTime()) / 60000;
          if (dt > 0) ttc.push(dt);
        }
      }
      const avgTTC = ttc.length ? ttc.reduce((a, b) => a + b, 0) / ttc.length : 0;

      // runner productivity
      const byRunner = new Map<string, number>();
      for (const o of data ?? []) {
        if (o.runner_id) byRunner.set(o.runner_id, (byRunner.get(o.runner_id) ?? 0) + 1);
      }
      const topRunners = [...byRunner.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([runner_id, count]) => ({ runner_id, count }));

      return {
        data: { totalOrders, totalRevenue, averageOrderValue, ordersByStatus, avgTimeToCompleteMins: avgTTC, topRunners },
        error: null,
      };
    } catch (e) {
      return errOut(e);
    }
  }
}

// ========== SETTINGS (key-value) ==========
/**
 * Requires a table like:
 * create table if not exists app_settings (
 *   key text primary key,
 *   value jsonb not null,
 *   updated_at timestamp with time zone default now()
 * );
 */
export class SettingsAdmin {
  static async getAll() {
    try {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      (data ?? []).forEach((r: any) => (map[r.key] = r.value));
      return { data: map, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async get<T = any>(key: string) {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return { data: (data?.value as T) ?? null, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async upsert(key: string, value: any) {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .upsert({ key, value, updated_at: todayISO() })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async updateMany(partial: Record<string, any>) {
    try {
      const entries = Object.entries(partial);
      const payload = entries.map(([key, value]) => ({ key, value, updated_at: todayISO() }));
      const { data, error } = await supabase.from("app_settings").upsert(payload).select();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }
}

// ========== CATEGORY MANAGEMENT ==========
export class CategoryAdmin {
  static async list({ includeInactive = true }: { includeInactive?: boolean } = {}) {
    try {
      let q = supabase.from("categories").select("*").order("sort_order", { ascending: true });
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async create(payload: Database["public"]["Tables"]["categories"]["Insert"]) {
    try {
      const { data, error } = await supabase.from("categories").insert(payload).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async update(id: string, updates: Database["public"]["Tables"]["categories"]["Update"]) {
    try {
      const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async toggleActive(id: string, is_active: boolean) {
    return this.update(id, { is_active });
  }

  static async reorder(idsInOrder: string[]) {
    try {
      const updates = idsInOrder.map((id, idx) => ({ id, sort_order: idx + 1 }));
      const { data, error } = await supabase.from("categories").upsert(updates).select();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async remove(id: string) {
    // Prefer soft delete:
    return this.update(id, { is_active: false } as any);
  }
}

// ========== ITEM MANAGEMENT ==========
/**
 * Optional storage bucket for item images:
 *   supabase.storage.createBucket('item-images', { public: true })
 */
export class ItemAdmin {
  static async list(params?: { category_id?: string; search?: string; onlyAvailable?: boolean }) {
    try {
      let q = supabase
        .from("items")
        .select("*, category:categories(*)")
        .order("name", { ascending: true });

      if (params?.category_id) q = q.eq("category_id", params.category_id);
      if (params?.onlyAvailable) q = q.eq("is_available", true);
      if (params?.search) q = q.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async create(payload: Database["public"]["Tables"]["items"]["Insert"]) {
    try {
      const { data, error } = await supabase.from("items").insert(payload).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async update(id: string, updates: Database["public"]["Tables"]["items"]["Update"]) {
    try {
      const { data, error } = await supabase.from("items").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async toggleAvailable(id: string, is_available: boolean) {
    return this.update(id, { is_available });
  }

  static async remove(id: string) {
    // Prefer soft: mark unavailable
    return this.update(id, { is_available: false } as any);
  }

  static async bulkAvailability(ids: string[], is_available: boolean) {
    try {
      const { data, error } = await supabase.from("items").update({ is_available }).in("id", ids).select();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async uploadItemImage(itemId: string, fileUri: string, fileName: string) {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const path = `items/${itemId}/${fileName}`;

      const { data, error } = await supabase.storage.from("item-images").upload(path, blob, {
        cacheControl: "3600",
        upsert: true,
      });
      if (error) throw error;

      const { data: pub } = supabase.storage.from("item-images").getPublicUrl(path);
      // Save URL on item (if you keep a 'image_url' column)
      await supabase.from("items").update({ image_url: pub.publicUrl } as any).eq("id", itemId);

      return { data: { path: data.path, publicUrl: pub.publicUrl }, error: null };
    } catch (e) {
      return errOut(e);
    }
  }
}

// ========== ORDER MANAGEMENT ==========
export class OrderAdmin {
  static async list(params?: {
    status?: Database["public"]["Enums"]["order_status"];
    payment_status?: Database["public"]["Enums"]["payment_status"];
    student_id?: string;
    runner_id?: string;
    range?: Range;
    limit?: number;
    offset?: number;
  }) {
    try {
      let q = supabase
        .from("orders")
        .select(
          `
          *,
          student:users!orders_student_id_fkey(id,full_name,email),
          runner:users!orders_runner_id_fkey(id,full_name,email),
          order_items(*, item:items(id,name))
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (params?.status) q = q.eq("status", params.status);
      if (params?.payment_status) q = q.eq("payment_status", params.payment_status);
      if (params?.student_id) q = q.eq("student_id", params.student_id);
      if (params?.runner_id) q = q.eq("runner_id", params.runner_id);
      if (params?.range?.from) q = q.gte("created_at", toISO(params.range.from));
      if (params?.range?.to) q = q.lte("created_at", toISO(params.range.to));
      if (params?.limit != null && params?.offset != null) q = q.range(params.offset, params.offset + params.limit - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data, count: count ?? data?.length ?? 0, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async getById(orderId: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          student:users!orders_student_id_fkey(*),
          runner:users!orders_runner_id_fkey(*),
          order_items(*, item:items(*, category:categories(*)))
        `
        )
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async updateStatus(
    orderId: string,
    status: Database["public"]["Enums"]["order_status"],
    additional?: Partial<Database["public"]["Tables"]["orders"]["Update"]>
  ) {
    try {
      const updateData: Database["public"]["Tables"]["orders"]["Update"] = { status, ...(additional ?? {}) };
      const now = todayISO();
      if (status === "accepted") updateData.accepted_at = now;
      if (status === "completed") updateData.completed_at = now;
      if (status === "cancelled") updateData.cancelled_at = now;

      const { data, error } = await supabase.from("orders").update(updateData).eq("id", orderId).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async assignRunner(orderId: string, runnerId: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ runner_id: runnerId, status: "accepted", accepted_at: todayISO(), updated_at: todayISO() })
        .eq("id", orderId)
        .in("status", ["pending", "accepted"]) // allow re-assign while accepted
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async recalcTotals(orderId: string) {
    try {
      const { data: items, error } = await supabase.from("order_items").select("quantity,unit_price").eq("order_id", orderId);
      if (error) throw error;
      const total = (items ?? []).reduce((s, it) => s + (it.unit_price ?? 0) * (it.quantity ?? 0), 0);
      const { data, error: upErr } = await supabase
        .from("orders")
        .update({ total_amount: total, updated_at: todayISO() })
        .eq("id", orderId)
        .select()
        .single();
      if (upErr) throw upErr;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async exportCSV(range?: Range) {
    try {
      const { data, error } = await this.list({ range, limit: 10000, offset: 0 });
      if (error) throw new Error(error);
      const rows = (data as any[]) ?? [];
      const headers = [
        "order_id",
        "created_at",
        "student_name",
        "runner_name",
        "status",
        "payment_status",
        "total_amount",
      ];
      const csv =
        [headers.join(",")]
          .concat(
            rows.map(r =>
              [
                r.id,
                r.created_at,
                JSON.stringify(r.student?.full_name ?? ""),
                JSON.stringify(r.runner?.full_name ?? ""),
                r.status,
                r.payment_status,
                r.total_amount ?? 0,
              ].join(",")
            )
          )
          .join("\n");
      return { data: csv, error: null };
    } catch (e) {
      return errOut(e);
    }
  }
}

// ========== PAYMENT MANAGEMENT ==========
/**
 * Payments are tracked on the orders table via payment_status.
 * Extend here if you add a dedicated payments table.
 */
export class PaymentAdmin {
  static async list(params?: {
    status?: Database["public"]["Enums"]["payment_status"];
    range?: Range;
    limit?: number;
    offset?: number;
  }) {
    try {
      let q = supabase.from("orders").select("id,created_at,total_amount,payment_status,payment_reference,student_id", {
        count: "exact",
      });
      if (params?.status) q = q.eq("payment_status", params.status);
      if (params?.range?.from) q = q.gte("created_at", toISO(params.range.from));
      if (params?.range?.to) q = q.lte("created_at", toISO(params.range.to));
      if (params?.limit != null && params?.offset != null) q = q.range(params.offset, params.offset + params.limit - 1);
      const { data, error, count } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return { data, count: count ?? data?.length ?? 0, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async updateStatus(orderId: string, payment_status: Database["public"]["Enums"]["payment_status"], meta?: any) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ payment_status, payment_meta: meta ?? null, updated_at: todayISO() } as any)
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async markPaid(orderId: string, reference?: string, meta?: any) {
    return this.updateStatus(orderId, "paid" as any, { reference, ...(meta ?? {}) });
  }

  static async markRefunded(orderId: string, reason?: string) {
    return this.updateStatus(orderId, "refunded" as any, { reason });
  }

  static async revenueSummary(range?: Range) {
    try {
      let q = supabase.from("orders").select("total_amount,payment_status,created_at");
      if (range?.from) q = q.gte("created_at", toISO(range.from));
      if (range?.to) q = q.lte("created_at", toISO(range.to));
      const { data, error } = await q;
      if (error) throw error;

      const paid = (data ?? []).filter(o => (o.payment_status as any) === "paid" || (o.payment_status as any) === "settled");
      const pending = (data ?? []).filter(o => (o.payment_status as any) === "pending");
      const failed = (data ?? []).filter(o => (o.payment_status as any) === "failed");

      return {
        data: {
          paid: safeSum(paid, "total_amount"),
          pending: safeSum(pending, "total_amount"),
          failed: safeSum(failed, "total_amount"),
          countPaid: paid.length,
          countPending: pending.length,
          countFailed: failed.length,
        },
        error: null,
      };
    } catch (e) {
      return errOut(e);
    }
  }
}

// ========== NOTIFICATIONS ==========
export class NotificationAdmin {
  static async broadcast(title: string, message: string, forRole?: Database["public"]["Enums"]["user_type"]) {
    try {
      // gather recipients
      let u = supabase.from("users").select("id,is_active,user_type");
      if (forRole) u = u.eq("user_type", forRole);
      const { data: users, error: uErr } = await u;
      if (uErr) throw uErr;

      const activeIds = (users ?? []).filter(x => x.is_active).map(x => x.id);
      if (!activeIds.length) return { data: { inserted: 0 }, error: null };

      const rows = activeIds.map(uid => ({
        user_id: uid,
        title,
        message,
        is_read: false,
        created_at: todayISO(),
      }));

      const { data, error } = await supabase.from("notifications").insert(rows).select();
      if (error) throw error;
      return { data: { inserted: data?.length ?? 0 }, error: null };
    } catch (e) {
      return errOut(e);
    }
  }

  static async sendTo(userId: string, title: string, message: string) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({ user_id: userId, title, message, is_read: false, created_at: todayISO() })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return errOut(e);
    }
  }
}
