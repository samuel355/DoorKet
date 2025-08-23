import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
  SegmentedButtons,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";

type EarningsNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "Earnings"
>;

interface EarningsProps {
  navigation: EarningsNavigationProp;
}

interface EarningsData {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  deliveryFees: number;
  tips: number;
  bonuses: number;
}

interface EarningsHistory {
  date: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  type: "delivery" | "tip" | "bonus";
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2;

const EarningsScreen: React.FC<EarningsProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    deliveryFees: 0,
    tips: 0,
    bonuses: 0,
  });
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([]);
  const [timePeriod, setTimePeriod] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadEarningsData();
    startAnimations();
  }, [user?.id, timePeriod]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadEarningsData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get completed orders for earnings calculation
      const result = await OrderService.getRunnerOrders(user.id);
      if (result.data) {
        const completedOrders = result.data.filter(
          (order: Order) => order.status === "completed",
        );

        calculateEarnings(completedOrders);
        generateEarningsHistory(completedOrders);
      }
    } catch (error) {
      console.error("Failed to load earnings data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateEarnings = (orders: Order[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarnings = 0;
    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let deliveryFees = 0;
    let tips = 0;
    let bonuses = 0;

    orders.forEach((order) => {
      const orderDate = new Date(order.completed_at || order.created_at);
      const deliveryFee = order.delivery_fee || 0;
      const serviceFee = order.service_fee || 0;
      const estimatedTip = order.total_amount * 0.05; // Assume 5% average tip

      const orderEarnings = deliveryFee + serviceFee + estimatedTip;

      totalEarnings += orderEarnings;
      deliveryFees += deliveryFee + serviceFee;
      tips += estimatedTip;

      if (orderDate >= today) {
        todayEarnings += orderEarnings;
      }
      if (orderDate >= weekStart) {
        weekEarnings += orderEarnings;
      }
      if (orderDate >= monthStart) {
        monthEarnings += orderEarnings;
      }
    });

    // Add some random bonuses for demo
    bonuses = Math.floor(totalEarnings * 0.1);

    setEarnings({
      total: totalEarnings + bonuses,
      today: todayEarnings,
      thisWeek: weekEarnings + bonuses * 0.3,
      thisMonth: monthEarnings + bonuses,
      deliveryFees,
      tips,
      bonuses,
    });
  };

  const generateEarningsHistory = (orders: Order[]) => {
    const history: EarningsHistory[] = [];

    orders
      .slice(0, 20) // Show last 20 orders
      .forEach((order) => {
        const deliveryFee = order.delivery_fee || 0;
        const serviceFee = order.service_fee || 0;
        const estimatedTip = order.total_amount * 0.05;

        // Add delivery fee entry
        if (deliveryFee + serviceFee > 0) {
          history.push({
            date: order.completed_at || order.created_at,
            orderId: order.id,
            orderNumber: order.order_number,
            customerName: order.student?.full_name || "Unknown Customer",
            amount: deliveryFee + serviceFee,
            type: "delivery",
          });
        }

        // Add tip entry
        if (estimatedTip > 0) {
          history.push({
            date: order.completed_at || order.created_at,
            orderId: order.id,
            orderNumber: order.order_number,
            customerName: order.student?.full_name || "Unknown Customer",
            amount: estimatedTip,
            type: "tip",
          });
        }
      });

    // Sort by date (most recent first)
    history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    setEarningsHistory(history);
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadEarningsData();
  }, [user?.id, timePeriod]);

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date >= today) {
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date >= yesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getEarningsIcon = (type: string) => {
    switch (type) {
      case "delivery":
        return "car";
      case "tip":
        return "heart";
      case "bonus":
        return "trophy";
      default:
        return "cash";
    }
  };

  const getEarningsColor = (type: string) => {
    switch (type) {
      case "delivery":
        return ColorPalette.primary[500];
      case "tip":
        return "#FF9800";
      case "bonus":
        return "#4CAF50";
      default:
        return "#666";
    }
  };

  const getCurrentPeriodEarnings = () => {
    switch (timePeriod) {
      case "today":
        return earnings.today;
      case "week":
        return earnings.thisWeek;
      case "month":
        return earnings.thisMonth;
      default:
        return earnings.thisWeek;
    }
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.totalEarnings}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(earnings.total)}
            </Text>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>
                {formatCurrency(earnings.today)}
              </Text>
              <Text style={styles.headerStatLabel}>Today</Text>
            </View>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>
                {formatCurrency(earnings.thisWeek)}
              </Text>
              <Text style={styles.headerStatLabel}>This Week</Text>
            </View>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>
                {formatCurrency(earnings.thisMonth)}
              </Text>
              <Text style={styles.headerStatLabel}>This Month</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderEarningsBreakdown = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>

          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIcon}>
                <Ionicons
                  name="car"
                  size={24}
                  color={ColorPalette.primary[500]}
                />
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownLabel}>Delivery Fees</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(earnings.deliveryFees)}
                </Text>
              </View>
              <Text style={styles.breakdownPercentage}>
                {Math.round((earnings.deliveryFees / earnings.total) * 100)}%
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIcon}>
                <Ionicons name="heart" size={24} color="#FF9800" />
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownLabel}>Tips</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(earnings.tips)}
                </Text>
              </View>
              <Text style={styles.breakdownPercentage}>
                {Math.round((earnings.tips / earnings.total) * 100)}%
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIcon}>
                <Ionicons name="trophy" size={24} color="#4CAF50" />
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownLabel}>Bonuses</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(earnings.bonuses)}
                </Text>
              </View>
              <Text style={styles.breakdownPercentage}>
                {Math.round((earnings.bonuses / earnings.total) * 100)}%
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  const renderPeriodSelector = () => (
    <Animated.View
      style={[
        styles.periodSelector,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <SegmentedButtons
        value={timePeriod}
        onValueChange={setTimePeriod}
        buttons={[
          { value: "today", label: "Today" },
          { value: "week", label: "This Week" },
          { value: "month", label: "This Month" },
        ]}
        style={styles.segmentedButtons}
      />
    </Animated.View>
  );

  const renderEarningsHistory = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Earnings</Text>
            <Text style={styles.sectionSubtitle}>
              {formatCurrency(getCurrentPeriodEarnings())} earned
            </Text>
          </View>

          <View style={styles.historyContainer}>
            {earningsHistory.length > 0 ? (
              earningsHistory.slice(0, 10).map((item, index) => (
                <View key={`${item.orderId}-${item.type}-${index}`}>
                  <View style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <View
                        style={[
                          styles.historyIcon,
                          {
                            backgroundColor: `${getEarningsColor(item.type)}20`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getEarningsIcon(item.type)}
                          size={20}
                          color={getEarningsColor(item.type)}
                        />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyTitle}>
                          {item.type === "delivery"
                            ? "Delivery Fee"
                            : item.type === "tip"
                              ? "Customer Tip"
                              : "Bonus"}
                        </Text>
                        <Text style={styles.historySubtitle}>
                          Order #{item.orderNumber.slice(-6)} •{" "}
                          {item.customerName}
                        </Text>
                        <Text style={styles.historyDate}>
                          {formatDate(item.date)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyAmount}>
                      +{formatCurrency(item.amount)}
                    </Text>
                  </View>
                  {index < earningsHistory.length - 1 && (
                    <Divider style={styles.historyDivider} />
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyHistory}>
                <Ionicons name="wallet-outline" size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>No Earnings Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Complete your first delivery to start earning!
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );

  const renderActionButtons = () => (
    <Animated.View
      style={[
        styles.actionsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Button
        mode="outlined"
        onPress={() => {
          // TODO: Implement payout request
        }}
        style={styles.actionButton}
        icon="bank-transfer"
        disabled={earnings.total < 50} // Minimum payout threshold
      >
        Request Payout
      </Button>

      <Button
        mode="outlined"
        onPress={() => {
          // TODO: Implement earnings report
        }}
        style={styles.actionButton}
        icon="file-document-outline"
      >
        Download Report
      </Button>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[ColorPalette.primary[500]]}
            tintColor={ColorPalette.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderPeriodSelector()}
        {renderEarningsBreakdown()}
        {renderEarningsHistory()}
        {renderActionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: -20,
  },
  headerGradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
  },
  totalEarnings: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  totalLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: spacing.sm,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  headerStat: {
    alignItems: "center",
  },
  headerStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  periodSelector: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  segmentedButtons: {
    backgroundColor: "#ffffff",
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  card: {
    elevation: 3,
    borderRadius: borderRadius.lg,
  },
  cardContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.primary[500],
  },
  breakdownContainer: {
    gap: spacing.md,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "#f8f9fa",
    borderRadius: borderRadius.md,
  },
  breakdownIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.primary[500],
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
  },
  breakdownPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.primary[500],
  },
  historyContainer: {
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.primary[500],
    marginBottom: 2,
  },
  historySubtitle: {
    fontSize: 14,
    color: ColorPalette.primary[500],
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: ColorPalette.primary[500],
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  historyDivider: {
    marginLeft: 64,
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: ColorPalette.primary[500],
    textAlign: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderColor: ColorPalette.primary[500],
  },
});

export default EarningsScreen;
