import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ColorPalette } from "../../theme/colors";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.32;

interface RunnerHeroSectionProps {
  greeting: string;
  userName: string;
  subtitle: string;
  stats: {
    totalEarnings: number;
    averageRating: number;
  };
  formatCurrency: (amount: number) => string;
  gradientColors?: string[];
}

export const RunnerHeroSection: React.FC<RunnerHeroSectionProps> = ({
  greeting,
  userName,
  subtitle,
  stats,
  formatCurrency,
  gradientColors = [ColorPalette.primary[500], ColorPalette.primary[600]],
}) => {
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startAnimations = useCallback(() => {
    // Hero animation
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 },
    ).start();
  }, [heroOpacity, heroScale, pulseAnim]);

  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  return (
    <Animated.View
      style={[
        styles.heroContainer,
        {
          transform: [{ scale: heroScale }],
          opacity: heroOpacity,
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors as any}
        style={styles.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroBackground}>
          {/* Decorative elements */}
          <View style={styles.decorativeElements}>
            <Animated.View
              style={[
                styles.floatingOrb,
                styles.orb1,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Animated.View
              style={[
                styles.floatingOrb,
                styles.orb2,
                {
                  transform: [
                    {
                      scale: Animated.subtract(
                        1.2,
                        Animated.subtract(pulseAnim, 1),
                      ),
                    },
                  ],
                },
              ]}
            />
            <View style={[styles.floatingOrb, styles.orb3]} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{userName}! 👋</Text>
              <Text style={styles.heroSubtitle}>{subtitle}</Text>
            </View>

            <View style={styles.heroStatsContainer}>
              <View style={styles.heroStatCard}>
                <View style={styles.blurCard}>
                  <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.heroStatValue}>
                    {formatCurrency(stats.totalEarnings || 0)}
                  </Text>
                  <Text style={styles.heroStatLabel}>Total Earnings</Text>
                </View>
              </View>

              <View style={styles.heroStatCard}>
                <View style={styles.blurCard}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                  <Text style={styles.heroStatValue}>
                    {stats.averageRating?.toFixed(1) || "0.0"}
                  </Text>
                  <Text style={styles.heroStatLabel}>Rating</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    height: HERO_HEIGHT,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroGradient: {
    flex: 1,
  },
  heroBackground: {
    flex: 1,
    position: "relative",
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingOrb: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  orb1: {
    width: 120,
    height: 120,
    top: -30,
    right: -30,
  },
  orb2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: -20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  orb3: {
    width: 60,
    height: 60,
    top: "40%",
    right: "20%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  heroContent: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  greetingSection: {
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
    lineHeight: 22,
  },
  heroStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  heroStatCard: {
    flex: 1,
  },
  blurCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
    textAlign: "center",
  },
  heroStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    textAlign: "center",
  },
});
