import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const { width } = Dimensions.get("window");

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 3000,
  onDismiss,
  action,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Show toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    } else {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return [ColorPalette.success[500], ColorPalette.success[600]];
      case "error":
        return [ColorPalette.error[500], ColorPalette.error[600]];
      case "warning":
        return [ColorPalette.warning[500], ColorPalette.warning[600]];
      default:
        return [ColorPalette.primary[500], ColorPalette.primary[600]];
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "warning":
        return "warning";
      default:
        return "information-circle";
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toast}
        onPress={action ? undefined : hideToast}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={getColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.content}>
            <Ionicons
              name={getIcon()}
              size={20}
              color={ColorPalette.pure.white}
            />
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>

            {action && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={action.onPress}
              >
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideToast}
            >
              <Ionicons
                name="close"
                size={16}
                color="rgba(255, 255, 255, 0.8)"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: ColorPalette.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: ColorPalette.pure.white,
    textTransform: "uppercase",
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default Toast;
