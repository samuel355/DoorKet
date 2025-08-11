import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Avatar, IconButton, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { AdminService } from "@/services/adminService";

// ---------- Color utils (fixes NaN warnings) ----------
type RGB = { r: number; g: number; b: number };

function parseHex(hex: string): RGB | null {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length >= 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].every((n) => Number.isFinite(n))) return { r, g, b };
  }
  return null;
}

function parseRgbFunc(input: string): RGB | null {
  const m = input
    .replace(/\s+/g, "")
    .match(/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,[\d.]+)?\)$/i);
  if (!m) return null;
  const r = Math.min(255, parseInt(m[1], 10));
  const g = Math.min(255, parseInt(m[2], 10));
  const b = Math.min(255, parseInt(m[3], 10));
  return { r, g, b };
}

function toRGB(color: string, fallback: string = "#FF9800"): RGB {
  if (typeof color === "string") {
    if (color.startsWith("#")) {
      const px = parseHex(color);
      if (px) return px;
    }
    if (color.toLowerCase().startsWith("rgb")) {
      const pr = parseRgbFunc(color);
      if (pr) return pr;
    }
  }
  // fallback
  return parseHex(fallback)!;
}

function rgba(color: string, alpha = 1): string {
  const { r, g, b } = toRGB(color);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function rgbaFromRGB({ r, g, b }: RGB, alpha = 1): string {
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
// ------------------------------------------------------

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  trend?: string | number;
  trendUp?: boolean;
  primary: string;
  text: string;
  sub: string;
  border: string;
};

const SHADOW = Platform.select({
  ios: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  android: { elevation: 2 },
});

const defaultStats = {
  totalOrders: 0,
  revenue: 0,
  activeUsers: 0,
  totalProducts: 0,
  revenueData: { labels: [] as string[], data: [] as number[] },
};

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  trend,
  trendUp,
  primary,
  text,
  sub,
  border,
}) => (
  <View style={[styles.statCard, { borderColor: border }, SHADOW]}>
    <View style={styles.statHeader}>
      <View style={[styles.statIconWrap, { backgroundColor: rgba(primary, 0.1) }]}>
        <Ionicons name={icon} size={20} color={primary} />
      </View>
      {typeof trend !== "undefined" && (
        <View
          style={[
            styles.trendPill,
            { backgroundColor: rgba(trendUp ? "#16A34A" : "#DC2626", 0.1) },
          ]}
        >
          <Ionicons
            name={trendUp ? "arrow-up" : "arrow-down"}
            size={12}
            color={trendUp ? "#16A34A" : "#DC2626"}
          />
          <Text
            style={[
              styles.trendText,
              { color: trendUp ? "#16A34A" : "#DC2626" },
            ]}
          >
            {trend}%
          </Text>
        </View>
      )}
    </View>
    <Text style={[styles.statTitle, { color: sub }]}>{title}</Text>
    <Text style={[styles.statValue, { color: text }]}>{value}</Text>
  </View>
);

const AdminDashboardScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  const COLORS = {
    bg: "#F7F7FB",
    card: "#FFFFFF",
    text: "#0F172A",
    sub: "#64748B",
    border: "#EEF2F7",
    primary: PRIMARY,
  };

  // Precompute rgb for chart perf & safety
  const primaryRGB = toRGB(COLORS.primary);
  const textRGB = toRGB(COLORS.text);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(defaultStats);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: dashboardData } = await AdminService.getDashboardStats();
      const { data: orders } = await AdminService.getRecentOrders();
      setStats(dashboardData ?? defaultStats);
      setRecentOrders(orders ?? []);
    } catch (err) {
      setStats(defaultStats);
      setRecentOrders([]);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const chartWidth = Dimensions.get("window").width - 48;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]} edges={["left","right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={[styles.content]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 14, color: COLORS.sub }}>Welcome back,</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text }}>Admin</Text>
          </View>
          <IconButton
            icon="refresh"
            onPress={loadDashboardData}
            size={22}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
            iconColor={COLORS.primary}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="cart-outline"
            title="Total Orders"
            value={stats.totalOrders}
            trend="12"
            trendUp
            primary={COLORS.primary}
            text={COLORS.text}
            sub={COLORS.sub}
            border={COLORS.border}
          />
          <StatCard
            icon="cash-outline"
            title="Revenue"
            value={`$${(stats.revenue ?? 0).toFixed(2)}`}
            trend="8"
            trendUp
            primary={COLORS.primary}
            text={COLORS.text}
            sub={COLORS.sub}
            border={COLORS.border}
          />
          <StatCard
            icon="people-outline"
            title="Active Users"
            value={stats.activeUsers}
            trend="3"
            trendUp
            primary={COLORS.primary}
            text={COLORS.text}
            sub={COLORS.sub}
            border={COLORS.border}
          />
          <StatCard
            icon="cube-outline"
            title="Products"
            value={stats.totalProducts}
            trend="5"
            primary={COLORS.primary}
            text={COLORS.text}
            sub={COLORS.sub}
            border={COLORS.border}
          />
        </View>

        {/* Revenue chart */}
        <View style={[styles.card, { borderColor: COLORS.border, backgroundColor: COLORS.card }, SHADOW]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: COLORS.text }]}>Revenue Overview</Text>
          </View>
          <LineChart
            data={{
              labels: stats?.revenueData?.labels ?? [],
              datasets: [{ data: stats?.revenueData?.data ?? [] }],
            }}
            width={chartWidth}
            height={220}
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: COLORS.card,
              backgroundGradientFrom: COLORS.card,
              backgroundGradientTo: COLORS.card,
              decimalPlaces: 0,
              color: (opacity = 1) => rgbaFromRGB(primaryRGB, opacity),
              labelColor: (opacity = 1) => rgbaFromRGB(textRGB, opacity),
              propsForDots: { r: "3", strokeWidth: "0" },
              propsForLabels: { fontSize: 10 },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Recent orders */}
        <View style={[styles.card, { borderColor: COLORS.border, backgroundColor: COLORS.card }, SHADOW]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: COLORS.text }]}>Recent Orders</Text>
            <IconButton
              icon="chevron-right"
              onPress={() => navigation?.navigate("OrdersTab")}
              size={22}
              iconColor={COLORS.sub}
            />
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: rgba(COLORS.primary, 0.08) }]}>
                <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: COLORS.text }]}>No orders available</Text>
              <Text style={[styles.emptySub, { color: COLORS.sub }]}>
                New orders will show up here once customers start placing them.
              </Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <View key={order.id} style={[styles.orderItem, { borderTopColor: COLORS.border }]}>
                <Avatar.Text
                  size={40}
                  label={(order?.student?.full_name?.[0] ?? "U").toUpperCase()}
                  style={{ backgroundColor: rgba(COLORS.primary, 0.15) }}
                  color={COLORS.primary}
                />
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderCustomer, { color: COLORS.text }]}>
                    {order?.student?.full_name || "Unknown User"}
                  </Text>
                  <Text style={[styles.orderAmount, { color: COLORS.sub }]}>
                    ${((order?.total_amount ?? 0) as number).toFixed(2)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.orderStatus,
                    { color: order?.status === "completed" ? "#16A34A" : COLORS.primary },
                  ]}
                >
                  {String(order?.status || "").charAt(0).toUpperCase() + String(order?.status || "").slice(1)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1},
  content: { padding: 16 },

  header: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Cards
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trendText: { fontSize: 12, fontWeight: "600" },
  statTitle: { fontSize: 12 },
  statValue: { fontSize: 20, fontWeight: "800", marginTop: 4 },

  // Chart
  chart: { marginTop: 4, borderRadius: 12 },

  // Recent orders
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  orderInfo: { flex: 1, marginLeft: 12 },
  orderCustomer: { fontSize: 15, fontWeight: "600" },
  orderAmount: { fontSize: 13, marginTop: 2 },
  orderStatus: { fontSize: 13, fontWeight: "700" },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center", marginTop: 4 },

  // Loader
  centerContent: { justifyContent: "center", alignItems: "center" },
});

export default AdminDashboardScreen;
