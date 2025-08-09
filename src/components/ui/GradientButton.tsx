import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  gradient?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  size?: "small" | "medium" | "large";
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error";
  fullWidth?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  gradient,
  style,
  textStyle,
  icon,
  iconPosition = "right",
  size = "medium",
  variant = "primary",
  fullWidth = true,
}) => {
  const getGradientColors = (): string[] => {
    if (gradient) return gradient;
    if (disabled || loading) return ["#cccccc", "#999999"];

    switch (variant) {
      case "primary":
        return ["#667eea", "#764ba2"];
      case "secondary":
        return ["#22c55e", "#16a34a"];
      case "accent":
        return ["#f093fb", "#f5576c"];
      case "success":
        return ["#00b894", "#00a085"];
      case "warning":
        return ["#fdcb6e", "#e17055"];
      case "error":
        return ["#fd79a8", "#e84393"];
      default:
        return ["#667eea", "#764ba2"];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
        };
      case "medium":
        return {
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderRadius: 14,
        };
      case "large":
        return {
          paddingVertical: 20,
          paddingHorizontal: 24,
          borderRadius: 16,
        };
      default:
        return {
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderRadius: 14,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return 14;
      case "medium":
        return 16;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "medium":
        return 18;
      case "large":
        return 20;
      default:
        return 18;
    }
  };

  const sizeStyles = getSizeStyles();
  const textSize = getTextSize();
  const iconSize = getIconSize();

  return (
    <TouchableOpacity
      style={[styles.container, fullWidth && styles.fullWidth, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={getGradientColors() as [string, string, ...string[]]}
        style={[styles.gradient, sizeStyles]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={[styles.text, { fontSize: textSize }, textStyle]}>
              Loading...
            </Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {icon && iconPosition === "left" && (
              <Ionicons
                name={icon}
                size={iconSize}
                color="#ffffff"
                style={styles.iconLeft}
              />
            )}
            <Text style={[styles.text, { fontSize: textSize }, textStyle]}>
              {title}
            </Text>
            {icon && iconPosition === "right" && (
              <Ionicons
                name={icon}
                size={iconSize}
                color="#ffffff"
                style={styles.iconRight}
              />
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fullWidth: {
    width: "100%",
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default GradientButton;
