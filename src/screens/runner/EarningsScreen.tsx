import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList } from "@/types";
import { useAuth } from "@/store/authStore";
import { ColorPalette } from "../../theme/colors";
import { RunnerHeader } from "../../components/runner/RunnerHeader";

interface EarningsData {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  completedOrders: number;
  averageOrderValue: number;
  totalTips: number;
  deliveryFees: number;
}

interface EarningRecord {
  id: string;
  date: string;
  orderId: string;
  customerName: string;
  deliveryFee: number;
  tip: number;
  total: number;
}

type EarningsNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "Earnings"
>;

interface EarningsProps {
  navigation: EarningsNavigationProp;
}

const EarningsScreen: React.FC<EarningsProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    totalTips: 0,
    deliveryFees: 0,
  });
  const [earningsHistory, setEarningsHistory] = useState<EarningRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month" | "all"
  >("week");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation refs
  const cardAnimations = useRef(
    Array(6)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = useCallback(() => {
    // Stagger card animations
    const cardStagger = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(100, [
      ...cardStagger,
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(listAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardAnimations, chartAnim, listAnim]);

  const loadEarnings = useCallback(async () => {
    if (!user?.id) return;

    try {
      // In a real app, this would fetch actual earnings data
      const mockEarnings: EarningsData = {
        totalEarnings: 2450.75,
        todayEarnings: 85.5,
        weekEarnings: 425.25,
        monthEarnings: 1850.3,
        completedOrders: 156,
        averageOrderValue: 15.71,
        totalTips: 320.5,
        deliveryFees: 2130.25,
      };

      const mockHistory: EarningRecord[] = [
        {
          id: "1",
          date: new Date().toISOString(),
          orderId: "ORD-001",
          customerName: "John Smith",
          deliveryFee: 8.5,
          tip: 3.0,
          total: 11.5,
        },
        {
          id: "2",
          date: new Date(Date.now() - 86400000).toISOString(),
          orderId: "ORD-002",
          customerName: "Sarah Johnson",
          deliveryFee: 12.0,
          tip: 5.5,
          total: 17.5,
        },
        {
          id: "3",
          date: new Date(Date.now() - 172800000).toISOString(),
          orderId: "ORD-003",
          customerName: "Mike Davis",
          deliveryFee: 6.75,
          tip: 2.25,
          total: 9.0,
        },
      ];

      setEarnings(mockEarnings);
      setEarningsHistory(mockHistory);
    } catch (error) {
      console.error("Failed to load earnings:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEarnings();
    startAnimations();
  }, [loadEarnings, startAnimations]);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPeriodEarnings = () => {
    switch (selectedPeriod) {
      case "today":
        return earnings.todayEarnings;
      case "week":
        return earnings.weekEarnings;
      case "month":
        return earnings.monthEarnings;
      case "all":
        return earnings.totalEarnings;
      default:
        return earnings.weekEarnings;
    }
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <Animated.View
          style={[
            styles.statCard,
            styles.primaryStatCard,
            {
              opacity: cardAnimations[0],
              transform: [
                {
                  translateY: cardAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[ColorPalette.success[500], ColorPalette.success[600]]}
            style={styles.statCardGradient}
          >
            <View style={styles.statCardContent}>
              <Ionicons name="wallet" size={28} color="#FFFFFF" />
              <View style={styles.statCardText}>
                <Text style={styles.statCardValue}>
                  {formatCurrency(getPeriodEarnings())}
                </Text>
                <Text style={styles.statCardLabel}>
                  {selectedPeriod.charAt(0).toUpperCase() +
                    selectedPeriod.slice(1)}{" "}
                  Earnings
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.statsRow}>
        <Animated.View
          style={[
            styles.statCard,
            {
              opacity: cardAnimations[1],
              transform: [
                {
                  translateY: cardAnimations[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.statCardContent}>
            <Ionicons
              name="bag-check"
              size={24}
              color={ColorPalette.primary[500]}
            />
            <View style={styles.statCardText}>
              <Text style={styles.statCardValue}>
                {earnings.completedOrders}
              </Text>
              <Text style={styles.statCardLabel}>Completed Orders</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.statCard,
            {
              opacity: cardAnimations[2],
              transform: [
                {
                  translateY: cardAnimations[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.statCardContent}>
            <Ionicons
              name="trending-up"
              size={24}
              color={ColorPalette.accent[500]}
            />
            <View style={styles.statCardText}>
              <Text style={styles.statCardValue}>
                {formatCurrency(earnings.averageOrderValue)}
              </Text>
              <Text style={styles.statCardLabel}>Avg per Order</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.statsRow}>
        <Animated.View
          style={[
            styles.statCard,
            {
              opacity: cardAnimations[3],
              transform: [
                {
                  translateY: cardAnimations[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.statCardContent}>
            <Ionicons name="gift" size={24} color="#FF9800" />
            <View style={styles.statCardText}>
              <Text style={styles.statCardValue}>
                {formatCurrency(earnings.totalTips)}
              </Text>
              <Text style={styles.statCardLabel}>Total Tips</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.statCard,
            {
              opacity: cardAnimations[4],
              transform: [
                {
                  translateY: cardAnimations[4].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.statCardContent}>
            <Ionicons name="car" size={24} color="#4CAF50" />
            <View style={styles.statCardText}>
              <Text style={styles.statCardValue}>
                {formatCurrency(earnings.deliveryFees)}
              </Text>
              <Text style={styles.statCardLabel}>Delivery Fees</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );

  const renderPeriodSelector = () => (
    <Animated.View
      style={[
        styles.periodSelector,
        {
          opacity: chartAnim,
          transform: [
            {
              translateY: chartAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      {["today", "week", "month", "all"].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.activePeriodButton,
          ]}
          onPress={() => setSelectedPeriod(period as any)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.activePeriodButtonText,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderEarningsHistory = () => (
    <Animated.View
      style={[
        styles.historyContainer,
        {
          opacity: listAnim,
          transform: [
            {
              translateY: listAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.historyTitle}>Recent Earnings</Text>
      {earningsHistory.map((earning, index) => (
        <Animated.View
          key={earning.id}
          style={[
            styles.historyItem,
            {
              opacity: cardAnimations[5],
              transform: [
                {
                  translateY: cardAnimations[5].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.historyItemContent}>
            <View style={styles.historyItemLeft}>
              <View style={styles.historyItemIcon}>
                <Ionicons
                  name="receipt"
                  size={20}
                  color={ColorPalette.primary[500]}
                />
              </View>
              <View style={styles.historyItemDetails}>
                <Text style={styles.historyItemTitle}>
                  {earning.customerName}
                </Text>
                <Text style={styles.historyItemSubtitle}>
                  Order #{earning.orderId} • {formatDate(earning.date)}
                </Text>
                <View style={styles.historyItemBreakdown}>
                  <Text style={styles.breakdownText}>
                    Delivery: {formatCurrency(earning.deliveryFee)}
                  </Text>
                  <Text style={styles.breakdownText}>
                    Tip: {formatCurrency(earning.tip)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.historyItemRight}>
              <Text style={styles.historyItemAmount}>
                {formatCurrency(earning.total)}
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <RunnerHeader
        title="My Earnings"
        subtitle={`${earnings.completedOrders} orders completed`}
        onBack={() => navigation.goBack()}
        onRefresh={loadEarnings}
        isRefreshing={isRefreshing}
        gradientColors={[
          ColorPalette.accent[400],
          ColorPalette.accent[500],
          ColorPalette.accent[600],
        ]}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderPeriodSelector()}
        {renderStatsCards()}
        {renderEarningsHistory()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  periodSelector: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  activePeriodButton: {
    backgroundColor: ColorPalette.accent[500],
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  activePeriodButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  primaryStatCard: {
    marginBottom: 16,
  },
  statCardGradient: {
    borderRadius: 16,
    padding: 20,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCardText: {
    marginLeft: 16,
    flex: 1,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  historyContainer: {
    paddingHorizontal: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ColorPalette.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyItemDetails: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  historyItemSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 6,
  },
  historyItemBreakdown: {
    flexDirection: "row",
    gap: 12,
  },
  breakdownText: {
    fontSize: 12,
    color: "#888888",
  },
  historyItemRight: {
    alignItems: "flex-end",
  },
  historyItemAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.success[600],
  },
});

export default EarningsScreen;
