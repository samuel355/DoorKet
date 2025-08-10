import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Avatar, Surface, IconButton } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { AdminService } from "@/services/supabase";

type StatCardProps = {
  icon: string;
  title: string;
  value: string | number;
  trend: string | number;
  trendUp: boolean;
};

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
}) => (
  <Surface style={styles.statCard}>
    <View style={styles.statContent}>
      <View style={[styles.iconContainer, { backgroundColor: "#FF980015" }]}>
        <Ionicons name={icon as any} size={24} color="#FF9800" />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <View style={styles.trendContainer}>
          <Ionicons
            name={trendUp ? "arrow-up" : "arrow-down"}
            size={16}
            color={trendUp ? "#4CAF50" : "#F44336"}
          />
          <Text
            style={[
              styles.trendText,
              { color: trendUp ? "#4CAF50" : "#F44336" },
            ]}
          >
            {trend}%
          </Text>
        </View>
      </View>
    </View>
  </Surface>
);

const AdminDashboardScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(defaultStats);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
  
      const { data: dashboardData, error } = await AdminService.getDashboardStats();
      const { data: orders, error: ordersErr } = await AdminService.getRecentOrders();
  
      if (error) console.warn("Dashboard stats error:", error);
      if (ordersErr) console.warn("Recent orders error:", ordersErr);
  
      setStats(dashboardData ?? defaultStats);
      setRecentOrders(orders ?? []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setStats(defaultStats);
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>Admin User</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="cart-outline"
            title="Total Orders"
            value={stats?.totalOrders ?? 0}
            trend="12"
            trendUp={true}
          />
          <StatCard
            icon="cash-outline"
            title="Revenue"
            value={`$${(stats?.revenue ?? 0).toFixed(2)}`}
            trend="8"
            trendUp={true}
          />
          <StatCard
            icon="people-outline"
            title="Active Users"
            value={stats?.activeUsers ?? 0}
            trend="3"
            trendUp={true}
          />
          <StatCard
            icon="cube-outline"
            title="Products"
            value={stats?.totalProducts ?? 0}
            trend="5"
            trendUp={true}
          />
        </View>

        <Card style={styles.chartCard}>
          <Card.Title title="Revenue Overview" />
          <Card.Content>
            <LineChart
              data={{
                labels: stats?.revenueData?.labels ?? [],
                datasets: [
                  {
                    data: stats?.revenueData?.data ?? [],
                  },
                ],
              }}
              width={Dimensions.get("window").width - 48}
              height={220}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        <Card style={styles.recentOrdersCard}>
          <Card.Title
            title="Recent Orders"
            right={(props) => (
              <IconButton
                {...props}
                icon="arrow-right"
                onPress={() => navigation?.navigate("OrdersTab")}
              />
            )}
          />
          <Card.Content>
            {recentOrders.map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <Avatar.Text
                  size={40}
                  label={order.student?.full_name?.[0] || "U"}
                />
                <View style={styles.orderInfo}>
                  <Text style={styles.orderCustomer}>
                    {order.student?.full_name || "Unknown User"}
                  </Text>
                  <Text style={styles.orderAmount}>
                    ${order.total_amount.toFixed(2)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.orderStatus,
                    {
                      color:
                        order.status === "completed" ? "#4CAF50" : "#FF9800",
                    },
                  ]}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666666",
  },
  adminName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  statCard: {
    width: "46%",
    margin: "2%",
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#ffffff",
  },
  statContent: {
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  chartCard: {
    marginVertical: 16,
    borderRadius: 12,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recentOrdersCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderCustomer: {
    fontSize: 16,
    color: "#333333",
  },
  orderAmount: {
    fontSize: 14,
    color: "#666666",
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AdminDashboardScreen;
