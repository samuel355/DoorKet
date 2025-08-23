import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { StackNavigationProp } from "@react-navigation/stack";
import { RunnerStackParamList, Order } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import {
  borderRadius,
  spacing,
  createShadows,
  createTypography,
} from "../../theme/styling";

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
  completedOrders: number;
}

interface EarningHistory {
  id: string;
  date: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  deliveryFee: number;
  tip: number;
  bonus: number;
  status: string;
}

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = 280;

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
    completedOrders: 0,
  });
  const [earningsHistory, setEarningsHistory] = useState<EarningHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month" | "all"
  >("week");

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(
    Array(6)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const shadows = createShadows({
    shadow: { medium: "rgba(0, 0, 0, 0.1)" },
  } as any);

  useEffect(() => {
    loadEarnings();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Header animation
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Staggered card animations
    const cardStagger = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(100, cardStagger).start();

    // Chart animation
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 800,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for earnings
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const loadEarnings = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // Mock data - replace with actual API calls
      const mockEarnings: EarningsData = {
        total: 1250.75,
        today: 45.5,
        thisWeek: 285.25,
        thisMonth: 892.4,
        deliveryFees: 750.0,
        tips: 425.75,
        bonuses: 75.0,
        completedOrders: 156,
      };

      const mockHistory: EarningHistory[] = [
        {
          id: "1",
          date: "2024-01-15T14:30:00Z",
          orderId: "ord_001",
          orderNumber: "ORD-2024-001",
          customerName: "John Doe",
          amount: 25.5,
          deliveryFee: 15.0,
          tip: 10.5,
          bonus: 0,
          status: "completed",
        },
        // Add more mock data
      ];

      setEarnings(mockEarnings);
      setEarningsHistory(mockHistory);
    } catch (error) {
      console.error("Failed to load earnings:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadEarnings();
  }, []);

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getPeriodEarnings = () => {
    switch (selectedPeriod) {
      case "today":
        return earnings.today;
      case "week":
        return earnings.thisWeek;
      case "month":
        return earnings.thisMonth;
      default:
        return earnings.total;
    }
  };

  const renderHeader = () => {
    const headerScale = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT],
      outputRange: [1, 0.8],
      extrapolate: "clamp",
    });

    const headerOpacity = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT - 100, HEADER_HEIGHT],
      outputRange: [1, 0.8, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.header,
          {
            opacity: Animated.multiply(headerOpacity, headerAnim),
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            ColorPalette.accent[400],
            ColorPalette.accent[500],
            ColorPalette.accent[600],
            ColorPalette.accent[700],
          ]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <BlurView
                  intensity={20}
                  tint="light"
                  style={styles.backButtonBlur}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>

              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>My Earnings</Text>
                <Text style={styles.headerSubtitle}>
                  {earnings.completedOrders} orders completed
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => {
                  setIsRefreshing(true);
                  loadEarnings();
                }}
              >
                <BlurView
                  intensity={20}
                  tint="light"
                  style={styles.refreshButtonBlur}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Total Earnings Display */}
            <Animated.View
              style={[
                styles.totalEarningsContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <BlurView
                intensity={30}
                tint="light"
                style={styles.totalEarningsBlur}
              >
                <View style={styles.totalEarningsContent}>
                  <Ionicons name="wallet" size={32} color="#FFFFFF" />
                  <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
                  <Text style={styles.totalEarningsAmount}>
                    {formatCurrency(earnings.total)}
                  </Text>
                  <View style={styles.earningsBreakdown}>
                    <Text style={styles.breakdownText}>
                      Delivery: {formatCurrency(earnings.deliveryFees)} • Tips:{" "}
                      {formatCurrency(earnings.tips)}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </SafeAreaView>

          {/* Decorative elements */}
          <View style={styles.headerDecoration}>
            <Animated.View
              style={[
                styles.decorativeOrb,
                styles.orb1,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={[styles.decorativeOrb, styles.orb2]} />
            <View style={[styles.decorativeOrb, styles.orb3]} />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderPeriodSelector = () => (
    <Animated.View
      style={[
        styles.periodSelectorContainer,
        {
          opacity: cardAnimations[0],
          transform: [
            { translateY: Animated.multiply(cardAnimations[0], -20) },
          ],
        },
      ]}
    >
      <View style={styles.periodSelector}>
        {[
          { key: "today", label: "Today", amount: earnings.today },
          { key: "week", label: "This Week", amount: earnings.thisWeek },
          { key: "month", label: "This Month", amount: earnings.thisMonth },
          { key: "all", label: "All Time", amount: earnings.total },
        ].map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
          >
            <LinearGradient
              colors={
                selectedPeriod === period.key
                  ? [ColorPalette.accent[500], ColorPalette.accent[600]]
                  : ["#FFFFFF", "#FAFAFA"]
              }
              style={styles.periodButtonGradient}
            >
              <Text
                style={[
                  styles.periodButtonLabel,
                  selectedPeriod === period.key &&
                    styles.periodButtonLabelActive,
                ]}
              >
                {period.label}
              </Text>
              <Text
                style={[
                  styles.periodButtonAmount,
                  selectedPeriod === period.key &&
                    styles.periodButtonAmountActive,
                ]}
              >
                {formatCurrency(period.amount)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <Animated.Text
        style={[
          styles.sectionTitle,
          {
            opacity: cardAnimations[1],
            transform: [
              { translateY: Animated.multiply(cardAnimations[1], -10) },
            ],
          },
        ]}
      >
        Earnings Breakdown
      </Animated.Text>

      <View style={styles.statsGrid}>
        {[
          {
            title: "Delivery Fees",
            amount: earnings.deliveryFees,
            icon: "car-outline",
            color: ColorPalette.primary[500],
            gradient: [ColorPalette.primary[100], ColorPalette.primary[50]],
            percentage: (
              (earnings.deliveryFees / earnings.total) *
              100
            ).toFixed(0),
            animation: cardAnimations[1],
          },
          {
            title: "Tips",
            amount: earnings.tips,
            icon: "heart-outline",
            color: ColorPalette.success[500],
            gradient: [ColorPalette.success[100], ColorPalette.success[50]],
            percentage: ((earnings.tips / earnings.total) * 100).toFixed(0),
            animation: cardAnimations[2],
          },
          {
            title: "Bonuses",
            amount: earnings.bonuses,
            icon: "star-outline",
            color: ColorPalette.accent[500],
            gradient: [ColorPalette.accent[100], ColorPalette.accent[50]],
            percentage: ((earnings.bonuses / earnings.total) * 100).toFixed(0),
            animation: cardAnimations[3],
          },
          {
            title: "Orders",
            amount: earnings.completedOrders,
            icon: "bag-check-outline",
            color: ColorPalette.info[500],
            gradient: [ColorPalette.info[100], ColorPalette.info[50]],
            percentage: "100",
            animation: cardAnimations[4],
            isCount: true,
          },
        ].map((stat, index) => (
          <Animated.View
            key={index}
            style={[
              styles.statCard,
              {
                opacity: stat.animation,
                transform: [{ scale: stat.animation }],
              },
            ]}
          >
            <LinearGradient
              colors={stat.gradient}
              style={styles.statCardGradient}
            >
              <View style={styles.statCardHeader}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: "#FFFFFF" },
                  ]}
                >
                  <Ionicons
                    name={stat.icon as any}
                    size={24}
                    color={stat.color}
                  />
                </View>
                <Text style={styles.statPercentage}>{stat.percentage}%</Text>
              </View>
              <Text style={styles.statAmount}>
                {stat.isCount
                  ? stat.amount.toString()
                  : formatCurrency(stat.amount)}
              </Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderEarningsChart = () => (
    <Animated.View
      style={[
        styles.chartContainer,
        {
          opacity: chartAnim,
          transform: [{ translateY: Animated.multiply(chartAnim, -20) }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Weekly Earnings Trend</Text>
      <LinearGradient colors={["#FFFFFF", "#FAFAFA"]} style={styles.chartCard}>
        <View style={styles.chartContent}>
          {/* Mock chart visualization */}
          <View style={styles.chartBars}>
            {[0.6, 0.8, 0.4, 0.9, 0.7, 1.0, 0.5].map((height, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.chartBar,
                  {
                    height: `${height * 60}%`,
                    opacity: chartAnim,
                    transform: [
                      {
                        scaleY: chartAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, height],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={[ColorPalette.accent[400], ColorPalette.accent[600]]}
                  style={styles.chartBarGradient}
                />
              </Animated.View>
            ))}
          </View>
          <View style={styles.chartLabels}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <Text key={day} style={styles.chartLabel}>
                {day}
              </Text>
            ))}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderEarningsHistory = () => (
    <Animated.View
      style={[
        styles.historyContainer,
        {
          opacity: cardAnimations[5],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Earnings</Text>
        <TouchableOpacity>
          <Text style={styles.sectionAction}>View All</Text>
        </TouchableOpacity>
      </View>

      {earningsHistory.slice(0, 5).map((earning, index) => (
        <Animated.View
          key={earning.id}
          style={[
            styles.historyItem,
            {
              opacity: cardAnimations[5],
              transform: [
                {
                  translateX: Animated.multiply(
                    Animated.subtract(1, cardAnimations[5]),
                    -50,
                  ),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FEFEFE"]}
            style={styles.historyItemGradient}
          >
            <View style={styles.historyItemContent}>
              <View style={styles.historyItemLeft}>
                <View style={styles.historyItemIcon}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={ColorPalette.success[500]}
                  />
                </View>
                <View style={styles.historyItemDetails}>
                  <Text style={styles.historyItemOrder}>
                    #{earning.orderNumber}
                  </Text>
                  <Text style={styles.historyItemCustomer}>
                    {earning.customerName}
                  </Text>
                  <Text style={styles.historyItemDate}>
                    {formatDate(earning.date)}
                  </Text>
                </View>
              </View>
              <View style={styles.historyItemRight}>
                <Text style={styles.historyItemAmount}>
                  +{formatCurrency(earning.amount)}
                </Text>
                <View style={styles.historyItemBreakdown}>
                  <Text style={styles.historyItemBreakdownText}>
                    Fee: {formatCurrency(earning.deliveryFee)}
                  </Text>
                  {earning.tip > 0 && (
                    <Text style={styles.historyItemBreakdownText}>
                      Tip: {formatCurrency(earning.tip)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      ))}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[ColorPalette.accent[500]]}
            tintColor={ColorPalette.accent[500]}
            progressViewOffset={HEADER_HEIGHT}
          />
        }
      >
        {renderPeriodSelector()}
        {renderStatsCards()}
        {renderEarningsChart()}
        {renderEarningsHistory()}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },

  // Header Styles
  header: {
    height: HEADER_HEIGHT,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    position: "relative",
  },
  headerContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  refreshButton: {},
  refreshButtonBlur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  totalEarningsContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  totalEarningsBlur: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    minWidth: width * 0.8,
  },
  totalEarningsContent: {
    alignItems: "center",
  },
  totalEarningsLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 8,
  },
  totalEarningsAmount: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "800",
    marginBottom: 8,
  },
  earningsBreakdown: {
    alignItems: "center",
  },
  breakdownText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  headerDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    height: "100%",
  },
  decorativeOrb: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  orb1: {
    width: 100,
    height: 100,
    top: -30,
    right: -30,
  },
  orb2: {
    width: 150,
    height: 150,
    top: HEADER_HEIGHT * 0.3,
    left: -50,
  },
  orb3: {
    width: 80,
    height: 80,
    bottom: -20,
    right: width * 0.4,
  },

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 100,
  },

  // Period Selector
  periodSelectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  periodSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  periodButton: {
    width: (width - 56) / 2,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  periodButtonActive: {},
  periodButtonGradient: {
    padding: 16,
    alignItems: "center",
    ...createShadows({ shadow: { medium: "rgba(0, 0, 0, 0.08)" } } as any).sm,
  },
  periodButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[600],
    marginBottom: 4,
  },
  periodButtonLabelActive: {
    color: "#FFFFFF",
  },
  periodButtonAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
  },
  periodButtonAmountActive: {
    color: "#FFFFFF",
  },

  // Stats Section
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - 56) / 2,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  statCardGradient: {
    padding: 20,
    ...createShadows({ shadow: { medium: "rgba(0, 0, 0, 0.08)" } } as any).md,
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statPercentage: {
    fontSize: 12,
    fontWeight: "600",
    color: ColorPalette.neutral[600],
  },
  statAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: ColorPalette.neutral[900],
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.neutral[600],
  },

  // Chart Section
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  chartCard: {
    borderRadius: 20,
    padding: 20,
    ...createShadows({ shadow: { medium: "rgba(0, 0, 0, 0.08)" } } as any).md,
  },
  chartContent: {
    height: 200,
  },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  chartBar: {
    width: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  chartBarGradient: {
    flex: 1,
    borderRadius: 16,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: ColorPalette.neutral[600],
    textAlign: "center",
    width: 32,
  },

  // History Section
  historyContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionAction: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.accent[500],
  },
  historyItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  historyItemGradient: {
    ...createShadows({ shadow: { medium: "rgba(0, 0, 0, 0.06)" } } as any).sm,
  },
  historyItemContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  historyItemLeft: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  historyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ColorPalette.success[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyItemDetails: {
    flex: 1,
  },
  historyItemOrder: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[900],
    marginBottom: 2,
  },
  historyItemCustomer: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginBottom: 2,
  },
  historyItemDate: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
  },
  historyItemRight: {
    alignItems: "flex-end",
  },
  historyItemAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.success[600],
    marginBottom: 4,
  },
  historyItemBreakdown: {
    alignItems: "flex-end",
  },
  historyItemBreakdownText: {
    fontSize: 11,
    color: ColorPalette.neutral[500],
    fontWeight: "500",
  },
});

export default EarningsScreen;
