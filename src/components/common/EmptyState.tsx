import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../../constants";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  iconColor?: string;
  iconSize?: number;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  testID?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "information-circle-outline",
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
  iconColor = COLORS.TEXT_SECONDARY,
  iconSize = 64,
  titleStyle,
  subtitleStyle,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={iconSize} color={iconColor} />
        </View>

        <Text style={[styles.title, titleStyle]}>{title}</Text>

        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        )}

        {actionText && onActionPress && (
          <Button
            title={actionText}
            onPress={onActionPress}
            variant="outline"
            style={styles.actionButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.XXL,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: SPACING.LG,
    opacity: 0.6,
  },
  title: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    fontFamily: FONTS.FAMILY.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: "center",
    marginBottom: SPACING.SM,
    lineHeight: FONTS.SIZE.XL * 1.3,
  },
  subtitle: {
    fontSize: FONTS.SIZE.MD,
    fontFamily: FONTS.FAMILY.REGULAR,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: SPACING.LG,
    lineHeight: FONTS.SIZE.MD * 1.5,
  },
  actionButton: {
    marginTop: SPACING.MD,
    minWidth: 140,
  },
});

export default EmptyState;
