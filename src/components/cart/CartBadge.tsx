import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { useCartStore } from "@/store/cartStore";
import { ColorPalette } from "@/src/theme/colors";
import { spacing, borderRadius } from "@/src/theme/styling";

interface CartBadgeProps {
  onPress?: () => void;
  size?: "small" | "medium" | "large";
  showZero?: boolean;
  color?: string;
  badgeColor?: string;
  textColor?: string;
  animated?: boolean;
  style?: any;
}

const CartBadge: React.FC<CartBadgeProps> = ({
  onPress,
  size = "medium",
  showZero = false,
  color = ColorPalette.neutral[700],
  badgeColor = ColorPalette.error[500],
  textColor = ColorPalette.pure.white,
  animated = true,
  style,
}) => {
  const itemCount = useCartStore((state) => state.getTotalItems());
  const [scaleAnim] = React.useState(new Animated.Value(1));

  const shouldShowBadge = showZero || itemCount > 0;
  const displayCount = itemCount > 99 ? "99+" : itemCount.toString();

  // Animate when count changes
  React.useEffect(() => {
    if (animated && itemCount > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [itemCount, animated, scaleAnim]);

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 20;
      case "large":
        return 28;
      default:
        return 24;
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case "small":
        return {
          minWidth: 16,
          height: 16,
          top: -4,
          right: -4,
        };
      case "large":
        return {
          minWidth: 22,
          height: 22,
          top: -6,
          right: -6,
        };
      default:
        return {
          minWidth: 18,
          height: 18,
          top: -5,
          right: -5,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 10;
      case "large":
        return 12;
      default:
        return 11;
    }
  };

  const badgeSize = getBadgeSize();

  const renderBadge = () => {
    if (!shouldShowBadge) return null;

    return (
      <Animated.View
        style={[
          styles.badge,
          {
            backgroundColor: badgeColor,
            minWidth: badgeSize.minWidth,
            height: badgeSize.height,
            top: badgeSize.top,
            right: badgeSize.right,
            transform: animated ? [{ scale: scaleAnim }] : [],
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            {
              color: textColor,
              fontSize: getFontSize(),
            },
          ]}
          numberOfLines={1}
        >
          {displayCount}
        </Text>
      </Animated.View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="basket-outline"
          size={getIconSize()}
          color={color}
        />
        {renderBadge()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="basket-outline"
        size={getIconSize()}
        color={color}
      />
      {renderBadge()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    padding: spacing.xs,
  },
  badge: {
    position: "absolute",
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: ColorPalette.pure.white,
    shadowColor: ColorPalette.neutral[900],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },
});

export default CartBadge;
