import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

import { ColorPalette } from "@/src/theme/colors";
import { spacing, borderRadius } from "@/src/theme/styling";

interface EmptyCartProps {
  onStartShopping?: () => void;
  onBrowseCategories?: () => void;
  title?: string;
  message?: string;
  showAnimation?: boolean;
  showActions?: boolean;
}

const { width, height } = Dimensions.get("window");

const EmptyCart: React.FC<EmptyCartProps> = ({
  onStartShopping,
  onBrowseCategories,
  title = "Your cart is empty",
  message = "Looks like you haven't added anything to your cart yet. Start shopping to find great items!",
  showAnimation = true,
  showActions = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animation or Icon */}
        {showAnimation ? (
          <View style={styles.animationContainer}>
            {/* You can replace this with a Lottie animation if available */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[ColorPalette.primary[100], ColorPalette.primary[200]]}
                style={styles.iconGradient}
              >
                <Ionicons
                  name="basket-outline"
                  size={80}
                  color={ColorPalette.primary[400]}
                />
              </LinearGradient>

              {/* Floating dots */}
              <View style={[styles.floatingDot, styles.dot1]} />
              <View style={[styles.floatingDot, styles.dot2]} />
              <View style={[styles.floatingDot, styles.dot3]} />
            </View>
          </View>
        ) : (
          <View style={styles.simpleIconContainer}>
            <Ionicons
              name="basket-outline"
              size={64}
              color={ColorPalette.neutral[400]}
            />
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionsContainer}>
            {/* Primary Action - Start Shopping */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onStartShopping}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[ColorPalette.primary[600], ColorPalette.primary[700]]}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={ColorPalette.pure.white}
                />
                <Text style={styles.primaryButtonText}>Start Shopping</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Action - Browse Categories */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onBrowseCategories}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid-outline"
                size={18}
                color={ColorPalette.primary[600]}
              />
              <Text style={styles.secondaryButtonText}>Browse Categories</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons
              name="flash-outline"
              size={16}
              color={ColorPalette.secondary[600]}
            />
            <Text style={styles.infoText}>Fast delivery to your dorm</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={ColorPalette.success[600]}
            />
            <Text style={styles.infoText}>Secure and reliable service</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="people-outline"
              size={16}
              color={ColorPalette.accent[600]}
            />
            <Text style={styles.infoText}>Trusted by students</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  content: {
    alignItems: "center",
    maxWidth: width * 0.8,
  },
  animationContainer: {
    marginBottom: spacing.xl,
    position: "relative",
  },
  iconContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: ColorPalette.primary[600],
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ColorPalette.secondary[400],
  },
  dot1: {
    top: 20,
    right: 15,
    backgroundColor: ColorPalette.secondary[400],
  },
  dot2: {
    bottom: 30,
    left: 10,
    backgroundColor: ColorPalette.accent[400],
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dot3: {
    top: 50,
    left: -10,
    backgroundColor: ColorPalette.warning[400],
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  simpleIconContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: ColorPalette.neutral[900],
    textAlign: "center",
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  actionsContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  primaryButton: {
    width: "100%",
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    shadowColor: ColorPalette.primary[600],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: ColorPalette.primary[50],
    borderWidth: 1,
    borderColor: ColorPalette.primary[200],
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.primary[600],
    marginLeft: spacing.sm,
  },
  infoContainer: {
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
});

export default EmptyCart;
