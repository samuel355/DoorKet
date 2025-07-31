import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../../constants";

export interface ErrorStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  secondaryActionText?: string;
  onSecondaryActionPress?: () => void;
  style?: ViewStyle;
  iconColor?: string;
  iconSize?: number;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  showBackground?: boolean;
  testID?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  icon = "alert-circle-outline",
  title,
  subtitle,
  actionText = "Try Again",
  onActionPress,
  secondaryActionText,
  onSecondaryActionPress,
  style,
  iconColor = COLORS.ERROR,
  iconSize = 64,
  titleStyle,
  subtitleStyle,
  showBackground = false,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={[styles.content, showBackground && styles.backgroundCard]}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={iconSize} color={iconColor} />
        </View>

        <Text style={[styles.title, titleStyle]}>{title}</Text>

        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        )}

        <View style={styles.actionsContainer}>
          {actionText && onActionPress && (
            <Button
              title={actionText}
              onPress={onActionPress}
              variant="primary"
              style={styles.primaryButton}
            />
          )}

          {secondaryActionText && onSecondaryActionPress && (
            <Button
              title={secondaryActionText}
              onPress={onSecondaryActionPress}
              variant="text"
              style={styles.secondaryButton}
            />
          )}
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
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.XXL,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
  },
  backgroundCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XL,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: SPACING.LG,
    opacity: 0.8,
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
  actionsContainer: {
    alignItems: "center",
    width: "100%",
  },
  primaryButton: {
    marginBottom: SPACING.SM,
    minWidth: 140,
  },
  secondaryButton: {
    minWidth: 120,
  },
});

export default ErrorState;
