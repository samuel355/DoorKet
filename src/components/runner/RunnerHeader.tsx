import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { ColorPalette } from "../../theme/colors";

const { width } = Dimensions.get("window");

interface RunnerHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  gradientColors?: string[];
  showDecorations?: boolean;
}

export const RunnerHeader: React.FC<RunnerHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onRefresh,
  isRefreshing = false,
  gradientColors = [
    ColorPalette.primary[500],
    ColorPalette.primary[600],
    ColorPalette.primary[700],
  ],
  showDecorations = true,
}) => {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, heroScale]);

  return (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: headerAnim,
          transform: [{ scale: heroScale }],
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors as any}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>

            {onRefresh && (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                disabled={isRefreshing}
              >
                <BlurView intensity={20} tint="light" style={styles.refreshButtonBlur}>
                  <Ionicons
                    name={isRefreshing ? "hourglass" : "refresh"}
                    size={20}
                    color="#FFFFFF"
                  />
                </BlurView>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>

        {/* Decorative elements */}
        {showDecorations && (
          <View style={styles.headerDecoration}>
            <View style={[styles.decorativeOrb, styles.orb1]} />
            <View style={[styles.decorativeOrb, styles.orb2]} />
            <View style={[styles.decorativeOrb, styles.orb3]} />
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
  },
  refreshButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
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
    right: -20,
  },
  orb2: {
    width: 60,
    height: 60,
    top: 20,
    left: -10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  orb3: {
    width: 80,
    height: 80,
    bottom: -20,
    right: width * 0.3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
});
