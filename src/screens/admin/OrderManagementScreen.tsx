// src/screens/OrderManagementScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  useTheme,
  Searchbar,
  Chip,
  Avatar,
  Portal,
  Modal,
  Button,
  Divider,
  IconButton,
  Card,
  Snackbar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase"; // if default export: `import supabase from "@/services/supabase"`
import { OrderAdmin } from "@/services/adminService";
import type { Order as BaseOrder, OrderStatus } from "@/types";

/* ---------- local UI typing ---------- */
type UIOrder = BaseOrder & {
  customer_name?: string | null;
  total_amount?: number | null;
  order_number?: string | number | null;
};

/* ---------- tiny color utils ---------- */
type RGB = { r: number; g: number; b: number };
const parseHex = (hex: string): RGB | null => {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) return { r: parseInt(h[0]+h[0],16), g: parseInt(h[1]+h[1],16), b: parseInt(h[2]+h[2],16) };
  if (h.length >= 6) {
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    if ([r,g,b].every(Number.isFinite)) return { r,g,b };
  }
  return null;
};
const toRGB = (color: string, fallback = "#FF9800"): RGB =>
  parseHex(color) ?? parseHex(fallback)!;
const rgba = (color: string, a = 1) => {
  const { r,g,b } = toRGB(color);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
};

/* ---------- consts ---------- */
const PAGE_SIZE = 20;
const ORDER_STATUSES = ["pending","accepted","shopping","delivering","completed","cancelled"] as const;
type StatusFilter = "all" | typeof ORDER_STATUSES[number];

const STATUS_COLORS: Record<typeof ORDER_STATUSES[number], string> = {
  pending: "#A78BFA",
  accepted: "#22C55E",
  shopping: "#0EA5E9",
  delivering: "#F59E0B",
  completed: "#10B981",
  cancelled: "#EF4444",
};

const currency = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "GHS", maximumFractionDigits: 0 });

const useDebounced = (value: string, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v;
};

/* ---------- gentle shadows ---------- */
const shadowSm = Platform.select({
  ios: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
});
const shadowMd = Platform.select({
  ios: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 3 },
});

const OrderManagementScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  const [query, setQuery] = useState("");
  const q = useDebounced(query);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState<UIOrder | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({ visible: false, text: "" });

  /* ---------- helpers ---------- */
  const matchesFilters = useCallback((o: UIOrder) => {
    if (status !== "all" && o.status !== status) return false;
    if (q.trim().length > 0) {
      const s = q.trim().toLowerCase();
      const orderNo = String(o.order_number ?? "").toLowerCase();
      const customer = String(o.customer_name ?? "").toLowerCase();
      if (!orderNo.includes(s) && !customer.includes(s)) return false;
    }
    return true;
  }, [status, q]);

  const fetchPage = useCallback(
    async (pageIndex: number) => {
      const offset = pageIndex * PAGE_SIZE;
      const res = await OrderAdmin.list({
        status: status === "all" ? undefined : (status as any),
        search: q,
        limit: PAGE_SIZE,
        offset,
      });
      if (res.error) throw new Error(res.error);
      return { rows: (res.data as UIOrder[]) ?? [], count: res.count };
    },
    [q, status]
  );

  const loadFirst = useCallback(async () => {
    setLoading(true);
    try {
      const { rows, count } = await fetchPage(0);
      setOrders(rows);
      setHasMore(rows.length < (count ?? 0));
      setPage(0);
    } catch (e) {
      console.error("Order fetch failed:", e);
      setOrders([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || refreshing || !hasMore) return;
    const next = page + 1;
    try {
      const { rows, count } = await fetchPage(next);
      setOrders(prev => [...prev, ...rows]);
      setHasMore((next + 1) * PAGE_SIZE < (count ?? 0));
      setPage(next);
    } catch (e) {
      console.error("Pagination error:", e);
      setHasMore(false);
    }
  }, [page, loading, refreshing, hasMore, fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirst();
    setRefreshing(false);
  }, [loadFirst]);

  useEffect(() => { loadFirst(); }, [q, status, loadFirst]);

  /* ---------- realtime: INSERT / UPDATE / DELETE ---------- */
  useEffect(() => {
    const channel = supabase
      .channel("orders_admin_feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        setOrders((prev) => {
          let next = prev.slice();

          if (eventType === "INSERT") {
            const row: UIOrder = newRow;
            if (matchesFilters(row) && !next.find(x => x.id === row.id)) {
              next = [row, ...next];
              setSnack({ visible: true, text: `Order #${row.order_number ?? ""} created` });
            }
          } else if (eventType === "UPDATE") {
            const row: UIOrder = newRow;
            const idx = next.findIndex(x => x.id === row.id);
            const wasVisible = idx >= 0;
            const nowMatches = matchesFilters(row);

            if (wasVisible && nowMatches) {
              next[idx] = row;
            } else if (wasVisible && !nowMatches) {
              next.splice(idx, 1);
            } else if (!wasVisible && nowMatches) {
              next = [row, ...next];
            }
            setSnack({ visible: true, text: `Order #${row.order_number ?? ""} → ${row.status}` });
          } else if (eventType === "DELETE") {
            const row: UIOrder = oldRow;
            next = next.filter(x => x.id !== row.id);
            setSnack({ visible: true, text: `Order #${row.order_number ?? ""} deleted` });
          }

          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchesFilters]);

  /* ---------- actions ---------- */
  const nextStatus = (s: OrderStatus): OrderStatus => {
    const flow: OrderStatus[] = ["pending","accepted","shopping","delivering","completed"];
    const i = flow.indexOf(s);
    if (i < 0 || i === flow.length - 1) return s;
    return flow[i + 1];
  };

  const advanceOrder = async (o: UIOrder) => {
    const ns = nextStatus(o.status as OrderStatus);
    if (ns === o.status) return;

    // optimistic update
    setOrders(prev => prev.map(x => (x.id === o.id ? { ...x, status: ns } : x)));
    setSelected(s => (s && s.id === o.id ? { ...s, status: ns } : s));

    try {
      const { data, error } = await OrderAdmin.updateStatus(o.id, ns);
      if (error) throw new Error(error);
      const updated = data as UIOrder;
      setOrders(prev => prev.map(x => (x.id === o.id ? updated : x)));
      setSelected(s => (s && s.id === o.id ? updated : s));
      setSnack({ visible: true, text: `Order #${updated.order_number ?? ""} → ${updated.status}` });
    } catch (e) {
      // rollback if failed
      setOrders(prev => prev.map(x => (x.id === o.id ? { ...x, status: o.status } : x)));
      setSelected(s => (s && s.id === o.id ? { ...s, status: o.status } : s));
      console.error("advance failed:", e);
      setSnack({ visible: true, text: "Failed to update order status" });
    }
  };

  const cancelOrder = async (o: UIOrder) => {
    if ((o.status as OrderStatus) === "completed") return;

    const old = o.status;
    // optimistic
    setOrders(prev => prev.map(x => (x.id === o.id ? { ...x, status: "cancelled" } : x)));
    setSelected(s => (s && s.id === o.id ? { ...s, status: "cancelled" } : s));

    try {
      const { data, error } = await OrderAdmin.updateStatus(o.id, "cancelled" as any);
      if (error) throw new Error(error);
      const updated = data as UIOrder;
      setOrders(prev => prev.map(x => (x.id === o.id ? updated : x)));
      setSelected(s => (s && s.id === o.id ? updated : s));
      setSnack({ visible: true, text: `Order #${updated.order_number ?? ""} cancelled` });
    } catch (e) {
      // rollback
      setOrders(prev => prev.map(x => (x.id === o.id ? { ...x, status: old } : x)));
      setSelected(s => (s && s.id === o.id ? { ...s, status: old } : s));
      console.error("cancel failed:", e);
      setSnack({ visible: true, text: "Failed to cancel order" });
    }
  };

  /* ---------- derived summaries ---------- */
  const summary = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending").length;
    const active = orders.filter(o => ["accepted","shopping","delivering"].includes(String(o.status))).length;
    const done = orders.filter(o => o.status === "completed").length;
    return { total, pending, active, done };
  }, [orders]);

  /* ---------- header ---------- */
  const Header = () => (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, shadowMd]}>
        <View style={[styles.iconContainer, { backgroundColor: rgba(PRIMARY, 0.12) }]}>
          <Ionicons name="cube" size={20} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Order Management</Text>
          <Text style={styles.subtitle}>Track, update, and fulfill orders</Text>
        </View>
        <IconButton icon="refresh" onPress={onRefresh} size={20} style={styles.refreshBtn} iconColor={PRIMARY} />
      </View>

      <View style={[styles.card, shadowSm]}>
        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by order number or customer name"
          style={styles.search}
          inputStyle={{ fontSize: 14 }}
        />
        <Divider style={styles.divider} />
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.chipsRow}>
          {(["all", ...ORDER_STATUSES] as const).map(s => (
            <Chip
              key={s}
              selected={status === s}
              onPress={() => setStatus(s)}
              style={[styles.chip, status === s && { backgroundColor: rgba(PRIMARY, 0.12) }]}
              textStyle={{ color: status === s ? PRIMARY : "#0F172A" }}
              showSelectedCheck
            >
              {s[0].toUpperCase() + s.slice(1)}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />
        <View style={styles.kpisRow}>
          <KPI label="Total" value={summary.total} />
          <KPI label="Pending" value={summary.pending} />
          <KPI label="Active" value={summary.active} />
          <KPI label="Completed" value={summary.done} />
        </View>
      </View>
    </View>
  );

  /* ---------- empty ---------- */
  const Empty = () => (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: rgba(PRIMARY, 0.12) }]}>
        <Ionicons name="cube-outline" size={24} color={PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>No orders</Text>
      <Text style={styles.emptySub}>Try changing filters or search terms.</Text>
    </View>
  );

  /* ---------- row ---------- */
  const renderItem = ({ item }: { item: UIOrder }) => {
    const pillColor = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] ?? "#64748B";
    return (
      <Card style={[styles.rowCard, shadowSm]}>
        <Pressable
          onPress={() => setSelected(item)}
          android_ripple={{ color: rgba(PRIMARY, 0.08), borderless: false }}
          style={styles.rowPress}
        >
          <View style={styles.rowFlat}>
            <Avatar.Text
              size={42}
              label={String(item.order_number ?? "—").slice(-2)}
              style={{ backgroundColor: rgba(PRIMARY, 0.15) }}
              color={PRIMARY}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowName}>Order #{item.order_number ?? "—"}</Text>
              <Text style={styles.rowSub}>
                {item.customer_name ?? "Unknown customer"} • {currency(item.total_amount)}
              </Text>
              <View style={{ flexDirection: "row", marginTop: 6, alignItems: "center" }}>
                <StatusPill label={String(item.status)} color={pillColor} />
                {item.created_at ? (
                  <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                    <Ionicons name="time-outline" size={12} color="#94A3B8" />
                    <Text style={styles.rowMeta}> {new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>
        </Pressable>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left","right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {loading && orders.length === 0 ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={Header}
          ListEmptyComponent={Empty}
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={PRIMARY} />
              </View>
            ) : null
          }
        />
      )}

      {/* details / actions */}
      <Portal>
        <Modal
          visible={!!selected}
          onDismiss={() => setSelected(null)}
          contentContainerStyle={[styles.modalFlat, shadowMd]}
        >
          {selected && (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Avatar.Text
                  size={44}
                  label={String(selected.order_number ?? "—").slice(-2)}
                  style={{ backgroundColor: rgba(PRIMARY, 0.15) }}
                  color={PRIMARY}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.modalName}>Order #{selected.order_number ?? "—"}</Text>
                  <Text style={styles.modalSub}>
                    {selected.customer_name ?? "Unknown"} • {currency(selected.total_amount)}
                  </Text>
                </View>
                <IconButton icon="close" onPress={() => setSelected(null)} />
              </View>

              <Divider style={styles.divider} />

              <View style={{ marginTop: 8 }}>
                <Text style={styles.modalLabel}>Status</Text>
                <View style={styles.chipsRow}>
                  {ORDER_STATUSES.map((s) => (
                    <Chip
                      key={s}
                      selected={selected.status === s}
                      onPress={async () => {
                        if (selected.status !== s) {
                          // optimistic
                          const old = selected.status as OrderStatus;
                          setSelected({ ...selected, status: s });
                          setOrders(prev => prev.map(x => (x.id === selected.id ? { ...x, status: s } : x)));
                          try {
                            const { data, error } = await OrderAdmin.updateStatus(selected.id, s as any);
                            if (error) throw new Error(error);
                            const updated = data as UIOrder;
                            setSelected(updated);
                            setOrders(prev => prev.map(x => (x.id === updated.id ? updated : x)));
                            setSnack({ visible: true, text: `Order #${updated.order_number ?? ""} → ${updated.status}` });
                          } catch (e) {
                            // rollback
                            setSelected({ ...selected, status: old });
                            setOrders(prev => prev.map(x => (x.id === selected.id ? { ...x, status: old } : x)));
                            setSnack({ visible: true, text: "Failed to update status" });
                          }
                        }
                      }}
                      style={[
                        styles.chip,
                        selected.status === s && { backgroundColor: rgba(STATUS_COLORS[s], 0.14) },
                      ]}
                      textStyle={{ color: selected.status === s ? STATUS_COLORS[s] : "#0F172A" }}
                      showSelectedCheck
                    >
                      {s[0].toUpperCase() + s.slice(1)}
                    </Chip>
                  ))}
                </View>

                <View style={[styles.modalActionRow, { marginTop: 8 }]}>
                  <Button
                    mode="contained"
                    onPress={() => advanceOrder(selected)}
                    buttonColor={PRIMARY}
                    textColor="#fff"
                    disabled={(selected.status as OrderStatus) === "completed"}
                    style={{ flex: 1, marginRight: 8 }}
                    icon="arrow-right-bold"
                  >
                    Advance
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => cancelOrder(selected)}
                    textColor={STATUS_COLORS.cancelled}
                    disabled={(selected.status as OrderStatus) === "completed"}
                    style={{ flex: 1, marginLeft: 8 }}
                    icon="close-octagon"
                  >
                    Cancel
                  </Button>
                </View>

                {navigation && (
                  <Button
                    mode="text"
                    style={{ marginTop: 6 }}
                    onPress={() => {
                      setSelected(null);
                      navigation.navigate?.("OrderDetails", { id: selected.id });
                    }}
                    icon="open-in-new"
                  >
                    Open details
                  </Button>
                )}
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2500}
        action={{ label: "Dismiss", onPress: () => setSnack({ visible: false, text: "" }) }}
      >
        {snack.text}
      </Snackbar>
    </SafeAreaView>
  );
};

/* ---------- small components ---------- */
const KPI: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <View style={styles.kpiItem}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const StatusPill: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={[styles.pill, { backgroundColor: rgba(color, 0.15) }]}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={[styles.pillText, { color }]}>{label[0].toUpperCase() + label.slice(1)}</Text>
  </View>
);

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { flex: 1, backgroundColor: "#F7F7FB" },
  center: { justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingBottom: 28 },

  headerWrap: { marginBottom: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
  },
  iconContainer: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  refreshBtn: { marginLeft: "auto", borderRadius: 10, backgroundColor: "#fff" },

  card: {
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  search: { borderRadius: 12, elevation: 0 },
  divider: { height: 1, backgroundColor: "#EEF2F7", marginVertical: 12 },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: { marginRight: 8, marginBottom: 8 },

  kpisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  kpiItem: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: "center",
  },
  kpiValue: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  kpiLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },

  rowCard: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 12 },
  rowPress: { borderRadius: 14, overflow: "hidden" },
  rowFlat: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10 },
  rowName: { fontSize: 15, color: "#0F172A", fontWeight: "700" },
  rowSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  rowMeta: { fontSize: 11, color: "#94A3B8" },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 11, fontWeight: "700" },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },

  footerLoading: { paddingVertical: 16 },

  emptyWrap: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: {
    width: 54, height: 54, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  emptySub: { fontSize: 13, color: "#64748B" },

  modalFlat: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  modalName: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  modalSub: { fontSize: 12, color: "#64748B" },
  modalLabel: { fontSize: 12, color: "#64748B", marginTop: 4, marginBottom: 6 },
  modalActionRow: { flexDirection: "row", alignItems: "center" },
});

export default OrderManagementScreen;
