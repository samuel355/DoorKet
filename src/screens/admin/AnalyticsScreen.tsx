// src/screens/admin/AnalyticsScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
  Snackbar,
  useTheme,
  ProgressBar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import {
  AnalyticsService,
  Preset,
  rangeFromPreset,
} from "@/services/analyticsService";

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
});

const number = (n: number) =>
  Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
const money = (n: number) =>
  Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(n);

const AnalyticsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  const [preset, setPreset] = useState<Preset>("7d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: "",
  });

  const [kpis, setKpis] = useState<{
    totalOrders: number;
    revenue: number;
    aov: number;
    paidRate: number;
    deliveredRate: number;
  } | null>(null);
  const [series, setSeries] = useState<
    Array<{ day: string; orders: number; revenue: number }>
  >([]);
  const [statusRows, setStatusRows] = useState<
    Array<{ status: string; count: number; pct: number }>
  >([]);
  const [userRows, setUserRows] = useState<
    Array<{ type: string; count: number }>
  >([]);

  const range = useMemo(() => rangeFromPreset(preset), [preset]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [kp, ts, sb, nu] = await Promise.all([
        AnalyticsService.kpis(range),
        AnalyticsService.timeseries(range),
        AnalyticsService.statusBreakdown(range),
        AnalyticsService.newUsers(range),
      ]);
      setKpis(kp);
      setSeries(ts);
      setStatusRows(sb);
      setUserRows(nu);
    } catch (e) {
      console.error(e);
      setSnack({ visible: true, text: "Failed to load analytics" });
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const maxOrders = useMemo(
    () => Math.max(1, ...series.map((s) => s.orders)),
    [series]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.header, shadow]}>
          <View style={[styles.iconCircle, { backgroundColor: "#FF980015" }]}>
            <Ionicons name="analytics" size={26} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Analytics & Insights</Text>
            <Text style={styles.subtitle}>Traffic, orders, revenue</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            {(["7d", "30d", "90d"] as Preset[]).map((p) => (
              <Chip
                key={p}
                selected={preset === p}
                onPress={() => setPreset(p)}
                style={[
                  styles.presetChip,
                  preset === p && { backgroundColor: "#FF980022" },
                ]}
                selectedColor={PRIMARY}
              >
                {p.toUpperCase()}
              </Chip>
            ))}
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <KpiCard
            icon="cash-outline"
            label="Revenue"
            value={kpis ? money(kpis.revenue) : "—"}
            deltaLabel={preset.toUpperCase()}
          />
          <KpiCard
            icon="receipt-outline"
            label="Orders"
            value={kpis ? number(kpis.totalOrders) : "—"}
            deltaLabel={preset.toUpperCase()}
          />
          <KpiCard
            icon="calculator-outline"
            label="Avg. Order"
            value={kpis ? money(kpis.aov) : "—"}
            deltaLabel={preset.toUpperCase()}
          />
          <KpiCard
            icon="checkmark-done-outline"
            label="Paid Rate"
            value={kpis ? `${Math.round(kpis.paidRate * 100)}%` : "—"}
            deltaLabel={preset.toUpperCase()}
          />
          <KpiCard
            icon="cube-outline"
            label="Delivered Rate"
            value={kpis ? `${Math.round(kpis.deliveredRate * 100)}%` : "—"}
            deltaLabel={preset.toUpperCase()}
          />
        </View>

        {/* Orders trend (mini bars) */}
        <Card style={[styles.card, shadow]}>
          <Card.Title
            title="Orders over time"
            subtitle={`Daily counts (${preset.toUpperCase()})`}
            left={(p) => <Ionicons {...p} name="bar-chart-outline" size={20} />}
          />
          <Card.Content>
            {series.length === 0 ? (
              <Text style={styles.muted}>No data in this range.</Text>
            ) : (
              <View style={styles.barsRow}>
                {series.map((s, idx) => (
                  <View key={s.day + idx} style={styles.barWrap}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, (80 * s.orders) / maxOrders),
                          backgroundColor: PRIMARY,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            )}
            <Divider style={{ marginVertical: 10 }} />
            <View style={styles.legendRow}>
              <Text style={styles.legendText}>
                Peak: {number(maxOrders)} orders/day
              </Text>
              <Text style={styles.legendText}>
                Total: {kpis ? number(kpis.totalOrders) : 0}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Status breakdown */}
        <Card style={[styles.card, shadow]}>
          <Card.Title
            title="Orders by status"
            subtitle="Distribution in selected range"
            left={(p) => (
              <Ionicons {...p} name="swap-vertical-outline" size={20} />
            )}
          />
          <Card.Content>
            {statusRows.length === 0 ? (
              <Text style={styles.muted}>No orders yet.</Text>
            ) : (
              statusRows.map((r) => (
                <View key={r.status} style={{ marginBottom: 10 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowLabel}>{r.status}</Text>
                    <Text style={styles.rowValue}>
                      {r.count} • {Math.round(r.pct * 100)}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={r.pct}
                    style={{ height: 8, borderRadius: 6 }}
                    color={PRIMARY}
                  />
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* New users */}
        <Card style={[styles.card, shadow]}>
          <Card.Title
            title="New users"
            subtitle={`By type (${preset.toUpperCase()})`}
            left={(p) => <Ionicons {...p} name="people-outline" size={20} />}
          />
          <Card.Content>
            {userRows.length === 0 ? (
              <Text style={styles.muted}>No new users in this range.</Text>
            ) : (
              userRows.map((u) => (
                <View
                  key={u.type}
                  style={[styles.rowBetween, { marginBottom: 10 }]}
                >
                  <Text style={styles.rowLabel}>{u.type}</Text>
                  <Text style={styles.rowValue}>{u.count}</Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <View style={{ height: 28 }} />
      </ScrollView>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2200}
      >
        {snack.text}
      </Snackbar>
    </SafeAreaView>
  );
};

const KpiCard: React.FC<{
  icon: any;
  label: string;
  value: string | number;
  deltaLabel?: string;
}> = ({ icon, label, value, deltaLabel }) => (
  <Card style={[styles.kpiCard, shadow]}>
    <Card.Content style={{ paddingVertical: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={styles.kpiIcon}>
          <Ionicons name={icon} size={20} color="#FF9800" />
        </View>
        <View>
          <Text style={styles.kpiLabel}>{label}</Text>
          <Text style={styles.kpiValue}>{value}</Text>
        </View>
      </View>
      {deltaLabel ? <Text style={styles.kpiSub}>{deltaLabel}</Text> : null}
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  content: { padding: 16, paddingBottom: 28 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B" },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  kpiCard: { backgroundColor: "#fff", borderRadius: 16, width: "48%" },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FF980022",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiLabel: { fontSize: 12, color: "#64748B" },
  kpiValue: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  kpiSub: { fontSize: 11, color: "#94A3B8", marginTop: 8 },

  card: { backgroundColor: "#fff", borderRadius: 16, marginTop: 12 },
  muted: { color: "#64748B", fontSize: 13 },

  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 90,
    marginTop: 8,
  },
  barWrap: { flex: 1, alignItems: "center", paddingHorizontal: 2 },
  bar: { width: 10, borderRadius: 6 },

  legendRow: { flexDirection: "row", justifyContent: "space-between" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 14, color: "#0F172A", fontWeight: "700" },
  rowValue: { fontSize: 13, color: "#334155" },
  presetChip:{marginRight: 5},
  legendText:{}
});

export default AnalyticsScreen;
