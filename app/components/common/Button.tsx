import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useTheme,
  useTypography,
  useShadows,
  spacing,
  borderRadius,
} from "../../theme";

export interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  title: string;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "text"
    | "danger"
    | "success"
    | "accent";
  size?: "small" | "medium" | "large";
  icon?: string;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingColor?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  loadingColor,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();
  const typography = useTypography();
  const shadows = useShadows();

  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.lg,
      borderWidth: 0,
      opacity: isDisabled ? 0.6 : 1,
    };

    // Size styles
    switch (size) {
      case "small":
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.md;
        baseStyle.minHeight = 36;
        break;
      case "large":
        baseStyle.paddingVertical = spacing.lg;
        baseStyle.paddingHorizontal = spacing.xl;
        baseStyle.minHeight = 56;
        break;
      default: // medium
        baseStyle.paddingVertical = spacing.md;
        baseStyle.paddingHorizontal = spacing.lg;
        baseStyle.minHeight = 48;
        break;
    }

    // Variant styles
    switch (variant) {
      case "primary":
        baseStyle.backgroundColor = theme.primary.main;
        Object.assign(baseStyle, shadows.button);
        break;
      case "secondary":
        baseStyle.backgroundColor = theme.secondary.main;
        Object.assign(baseStyle, shadows.button);
        break;
      case "accent":
        baseStyle.backgroundColor = theme.accent.main;
        Object.assign(baseStyle, shadows.button);
        break;
      case "outline":
        baseStyle.backgroundColor = "transparent";
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = theme.primary.main;
        break;
      case "text":
        baseStyle.backgroundColor = "transparent";
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.sm;
        break;
      case "danger":
        baseStyle.backgroundColor = theme.error.main;
        Object.assign(baseStyle, shadows.button);
        break;
      case "success":
        baseStyle.backgroundColor = theme.success.main;
        Object.assign(baseStyle, shadows.button);
        break;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = "100%";
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    let baseTextStyle: TextStyle = {
      textAlign: "center",
    };

    // Size styles
    switch (size) {
      case "small":
        baseTextStyle = { ...baseTextStyle, ...typography.buttonSmall };
        break;
      case "large":
        baseTextStyle = { ...baseTextStyle, ...typography.buttonLarge };
        break;
      default: // medium
        baseTextStyle = { ...baseTextStyle, ...typography.button };
        break;
    }

    // Variant text colors
    switch (variant) {
      case "primary":
        baseTextStyle.color = theme.primary.contrastText;
        break;
      case "secondary":
        baseTextStyle.color = theme.secondary.contrastText;
        break;
      case "accent":
        baseTextStyle.color = theme.accent.contrastText;
        break;
      case "outline":
        baseTextStyle.color = theme.primary.main;
        break;
      case "text":
        baseTextStyle.color = theme.primary.main;
        break;
      case "danger":
        baseTextStyle.color = theme.error.contrastText;
        break;
      case "success":
        baseTextStyle.color = theme.success.contrastText;
        break;
    }

    return baseTextStyle;
  };

  const getIconSize = (): number => {
    switch (size) {
      case "small":
        return 16;
      case "large":
        return 24;
      default:
        return 20;
    }
  };

  const getIconColor = (): string => {
    if (loadingColor) return loadingColor;

    switch (variant) {
      case "primary":
        return theme.primary.contrastText;
      case "secondary":
        return theme.secondary.contrastText;
      case "accent":
        return theme.accent.contrastText;
      case "outline":
      case "text":
        return theme.primary.main;
      case "danger":
        return theme.error.contrastText;
      case "success":
        return theme.success.contrastText;
      default:
        return theme.primary.contrastText;
    }
  };

  const getLoadingColor = (): string => {
    if (loadingColor) return loadingColor;
    return getIconColor();
  };

  const renderIcon = (position: "left" | "right") => {
    if (!icon || iconPosition !== position) return null;

    const iconSize = getIconSize();
    const iconColor = getIconColor();
    const marginStyle =
      position === "left"
        ? { marginRight: spacing.sm }
        : { marginLeft: spacing.sm };

    return (
      <Ionicons
        name={icon as any}
        size={iconSize}
        color={iconColor}
        style={marginStyle}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={size === "small" ? "small" : "small"}
            color={getLoadingColor()}
          />
          {variant !== "text" && (
            <Text
              style={[getTextStyle(), textStyle, { marginLeft: spacing.sm }]}
            >
              Loading...
            </Text>
          )}
        </View>
      );
    }

    return (
      <>
        {renderIcon("left")}
        <Text style={[getTextStyle(), textStyle]} numberOfLines={1}>
          {title}
        </Text>
        {renderIcon("right")}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Button;
