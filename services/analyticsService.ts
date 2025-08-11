// src/services/analyticsService.ts
import supabase, { Database } from "@/services/supabase";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type UserRow  = Database["public"]["Tables"]["users"]["Row"];

export type DateRange = { from: string; to: string };
export type Preset = "7d" | "30d" | "90d";

export function rangeFromPreset(p: Preset): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (p === "7d" ? 6 : p === "30d" ? 29 : 89));
  return { from: from.toISOString(), to: new Date(to.getTime() + 1).toISOString() };
}

function dayKey(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  // YYYY-MM-DD
  return x.toISOString().slice(0, 10);
}

// ---- Core fetchers (orders/users) ----
async function fetchOrders(range: DateRange): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Analytics: fetchOrders error", error);
    return [];
  }
  return (data ?? []) as OrderRow[];
}

async function fetchUsers(range: DateRange): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Analytics: fetchUsers error", error);
    return [];
  }
  return (data ?? []) as UserRow[];
}

// ---- Public API ----
export const AnalyticsService = {
  async kpis(range: DateRange) {
    const orders = await fetchOrders(range);
    const totalOrders = orders.length;

    const revenue = orders.reduce((sum, o: any) => {
      const amt = typeof o.total_amount === "number" ? o.total_amount : 0;
      // if you store currency minor units, adapt here
      return sum + amt;
    }, 0);

    const aov = totalOrders > 0 ? revenue / totalOrders : 0;

    const paidStatuses = new Set(["paid", "succeeded", "completed"]);
    const deliveredStatuses = new Set(["delivered", "completed"]);

    const paidCount = orders.filter((o: any) => paidStatuses.has(String(o.payment_status || "").toLowerCase())).length;
    const deliveredCount = orders.filter((o: any) => deliveredStatuses.has(String(o.status || "").toLowerCase())).length;

    const paidRate = totalOrders ? paidCount / totalOrders : 0;
    const deliveredRate = totalOrders ? deliveredCount / totalOrders : 0;

    return { totalOrders, revenue, aov, paidRate, deliveredRate };
  },

  async timeseries(range: DateRange) {
    const orders = await fetchOrders(range);

    // Build daily buckets for the whole range so gaps render as zeros
    const start = new Date(range.from);
    const end = new Date(range.to);
    const days: string[] = [];
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    while (cur <= endDay) {
      days.push(dayKey(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const byDay = new Map<string, { orders: number; revenue: number }>();
    for (const d of days) byDay.set(d, { orders: 0, revenue: 0 });

    for (const o of orders as any[]) {
      const k = dayKey(o.created_at);
      if (!byDay.has(k)) byDay.set(k, { orders: 0, revenue: 0 });
      const r = byDay.get(k)!;
      r.orders += 1;
      r.revenue += typeof o.total_amount === "number" ? o.total_amount : 0;
    }

    return days.map((d) => ({ day: d, orders: byDay.get(d)!.orders, revenue: byDay.get(d)!.revenue }));
  },

  async statusBreakdown(range: DateRange) {
    const orders = await fetchOrders(range);
    const total = orders.length || 1;
    const map = new Map<string, number>();
    for (const o of orders as any[]) {
      const s = String(o.status || "unknown").toLowerCase();
      map.set(s, (map.get(s) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([status, count]) => ({ status, count, pct: count / total }))
      .sort((a, b) => b.count - a.count);
  },

  async newUsers(range: DateRange) {
    const users = await fetchUsers(range);
    const byType = new Map<string, number>();
    for (const u of users as any[]) {
      const t = String(u.user_type || "unknown").toLowerCase();
      byType.set(t, (byType.get(t) ?? 0) + 1);
    }
    return Array.from(byType.entries()).map(([type, count]) => ({ type, count }));
  },
};
