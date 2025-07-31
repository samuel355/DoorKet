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
import {
  useTheme,
  useTypography,
  useShadows,
  spacing,
  borderRadius,
  layout,
} from "../../theme";

export interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: "elevated" | "outlined" | "flat" | "filled";
  padding?: "none" | "small" | "medium" | "large";
  margin?: "none" | "small" | "medium" | "large";
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  rightIcon?: string;
  leftIcon?: string;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
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
  contentStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  header,
  footer,
  rightIcon,
  leftIcon,
  onRightIconPress,
  onLeftIconPress,
  loading = false,
  testID,
  elevation = "medium",
}) => {
  const { theme } = useTheme();
  const typography = useTypography();
  const shadows = useShadows();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      overflow: "hidden",
    };

    // Margin styles
    switch (margin) {
      case "small":
        baseStyle.margin = spacing.sm;
        break;
      case "large":
        baseStyle.margin = spacing.lg;
        break;
      case "none":
        baseStyle.margin = 0;
        break;
      default: // medium
        baseStyle.margin = spacing.md;
        break;
    }

    // Variant styles
    switch (variant) {
      case "elevated":
        baseStyle.backgroundColor = theme.surface.elevated;
        switch (elevation) {
          case "small":
            Object.assign(baseStyle, shadows.sm);
            break;
          case "large":
            Object.assign(baseStyle, shadows.lg);
            break;
          case "none":
            Object.assign(baseStyle, shadows.none);
            break;
          default: // medium
            Object.assign(baseStyle, shadows.card);
            break;
        }
        break;
      case "outlined":
        baseStyle.backgroundColor = theme.surface.primary;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = theme.border.primary;
        break;
      case "filled":
        baseStyle.backgroundColor = theme.surface.secondary;
        break;
      case "flat":
        baseStyle.backgroundColor = theme.surface.primary;
        break;
    }

    // Disabled state
    if (disabled) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const getContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    // Padding styles
    switch (padding) {
      case "small":
        baseStyle.padding = spacing.sm;
        break;
      case "large":
        baseStyle.padding = spacing.lg;
        break;
      case "none":
        baseStyle.padding = 0;
        break;
      default: // medium
        baseStyle.padding = spacing.md;
        break;
    }

    return baseStyle;
  };

  const renderHeader = () => {
    if (header) {
      return (
        <View style={[styles.headerContainer, headerStyle]}>{header}</View>
      );
    }

    if (!title && !subtitle && !leftIcon && !rightIcon) {
      return null;
    }

    return (
      <View style={[styles.headerContainer, headerStyle]}>
        <View style={styles.headerLeft}>
          {leftIcon && (
            <TouchableOpacity
              onPress={onLeftIconPress}
              disabled={!onLeftIconPress || disabled}
              style={[
                styles.iconButton,
                { backgroundColor: theme.surface.tertiary },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={leftIcon as any}
                size={20}
                color={theme.text.primary}
              />
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.titleContainer,
              leftIcon && { marginLeft: spacing.sm },
            ]}
          >
            {title && (
              <Text
                style={[
                  styles.title,
                  { color: theme.text.primary },
                  titleStyle,
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.text.secondary },
                  subtitleStyle,
                ]}
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress || disabled}
            style={[
              styles.iconButton,
              { backgroundColor: theme.surface.tertiary },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon as any}
              size={20}
              color={theme.text.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (!children) return null;

    return <View style={[getContentStyle(), contentStyle]}>{children}</View>;
  };

  const renderFooter = () => {
    if (!footer) return null;

    return (
      <View
        style={[
          styles.footerContainer,
          { borderTopColor: theme.border.secondary },
        ]}
      >
        {footer}
      </View>
    );
  };

  const cardContent = (
    <View style={[getCardStyle(), style]} testID={testID}>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
        style={[
          {
            transform: [{ scale: 1 }],
          },
        ]}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...layout.flex.centerVertical,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    ...layout.flex.center,
  },
  footerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});

export default Card;
