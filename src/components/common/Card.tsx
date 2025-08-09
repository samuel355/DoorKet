import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";

export interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: "elevated" | "outlined" | "filled" | "flat";
  padding?: "none" | "small" | "medium" | "large";
  margin?: "none" | "small" | "medium" | "large";
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  footerStyle?: ViewStyle;
  leftIcon?: string;
  rightIcon?: string;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;
  loading?: boolean;
  testID?: string;
  elevation?: "none" | "small" | "medium" | "large";
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  variant = "elevated",
  padding = "medium",
  margin = "medium",
  onPress,
  disabled = false,
  style,
  titleStyle,
  subtitleStyle,
  contentStyle,
  headerStyle,
  footerStyle,
  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,
  loading = false,
  testID,
  elevation = "medium",
}) => {
  const theme = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 16,
    };

    // Elevation
    if (variant === "elevated") {
      baseStyle.elevation = 4;
      baseStyle.shadowColor = "#000";
      baseStyle.shadowOffset = { width: 0, height: 2 };
      baseStyle.shadowOpacity = 0.1;
      baseStyle.shadowRadius = 4;
    }

    // Outline
    if (variant === "outlined") {
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = theme.colors.outline;
    }

    // Padding
    const paddingMap = {
      none: 0,
      small: 8,
      medium: 16,
      large: 24,
    };
    baseStyle.padding = paddingMap[padding];

    // Margin
    const marginMap = {
      none: 0,
      small: 4,
      medium: 8,
      large: 16,
    };
    baseStyle.margin = marginMap[margin];

    return baseStyle;
  };

  const cardStyle = getCardStyle();

  const CardContent = () => (
    <View style={[cardStyle, style]} testID={testID}>
      {(title || subtitle || leftIcon || rightIcon) && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            {leftIcon && (
              <TouchableOpacity
                onPress={onLeftIconPress}
                disabled={!onLeftIconPress}
              >
                <Ionicons
                  name={leftIcon as any}
                  size={24}
                  color={theme.colors.onSurface}
                  style={styles.icon}
                />
              </TouchableOpacity>
            )}
            <View style={styles.headerText}>
              {title && (
                <Text
                  style={[
                    styles.title,
                    { color: theme.colors.onSurface },
                    titleStyle,
                  ]}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.onSurfaceVariant },
                    subtitleStyle,
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
            >
              <Ionicons
                name={rightIcon as any}
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {children && (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
  },
  content: {
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
});

export default Card;
