import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
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
import Card from "./Card";

interface ThemeSettingsProps {
  showTitle?: boolean;
  style?: any;
  onThemeChange?: (isDark: boolean) => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  showTitle = true,
  style,
  onThemeChange,
}) => {
  const { theme, themeMode, toggleTheme, setThemeMode, isDark } = useTheme();
  const typography = useTypography();
  const shadows = useShadows();

  const handleToggleTheme = () => {
    toggleTheme();
    onThemeChange?.(themeMode === "light");
  };

  const handleSetLightTheme = () => {
    setThemeMode("light");
    onThemeChange?.(false);
  };

  const handleSetDarkTheme = () => {
    setThemeMode("dark");
    onThemeChange?.(true);
  };

  const handleAutoTheme = () => {
    Alert.alert(
      "Auto Theme",
      "This will follow your system theme preference. Your manual selection will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Use System",
          onPress: () => {
            // Clear manual preference and use system theme
            setThemeMode("light"); // This will be overridden by system preference
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, style]}>
      {showTitle && (
        <Text
          style={[
            typography.h6,
            { color: theme.text.primary, marginBottom: spacing.lg },
          ]}
        >
          Theme Settings
        </Text>
      )}

      {/* Quick Toggle */}
      <Card
        variant="outlined"
        padding="large"
        margin="none"
        style={{ marginBottom: spacing.md }}
      >
        <View style={styles.toggleContainer}>
          <View style={styles.toggleInfo}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={24}
                color={theme.primary.main}
              />
            </View>
            <View style={styles.toggleText}>
              <Text
                style={[typography.labelLarge, { color: theme.text.primary }]}
              >
                Dark Mode
              </Text>
              <Text
                style={[typography.bodySmall, { color: theme.text.secondary }]}
              >
                {isDark ? "Using dark theme" : "Using light theme"}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={handleToggleTheme}
            trackColor={{
              false: theme.surface.tertiary,
              true: theme.primary.light,
            }}
            thumbColor={isDark ? theme.primary.main : theme.surface.primary}
            ios_backgroundColor={theme.surface.tertiary}
          />
        </View>
      </Card>

      {/* Theme Options */}
      <Card
        variant="outlined"
        padding="large"
        margin="none"
        style={{ marginBottom: spacing.md }}
      >
        <Text
          style={[
            typography.labelLarge,
            { color: theme.text.primary, marginBottom: spacing.md },
          ]}
        >
          Theme Options
        </Text>

        {/* Light Theme Option */}
        <TouchableOpacity
          style={[
            styles.themeOption,
            themeMode === "light" && styles.selectedOption,
            { borderColor: theme.border.primary },
            themeMode === "light" && {
              borderColor: theme.primary.main,
              backgroundColor: theme.primary.light,
            },
          ]}
          onPress={handleSetLightTheme}
          activeOpacity={0.7}
        >
          <View style={styles.themeOptionContent}>
            <View style={[styles.themePreview, styles.lightThemePreview]}>
              <View style={styles.previewHeader} />
              <View style={styles.previewContent} />
            </View>
            <View style={styles.themeInfo}>
              <Text style={[typography.label, { color: theme.text.primary }]}>
                Light Theme
              </Text>
              <Text
                style={[typography.caption, { color: theme.text.secondary }]}
              >
                Clean and bright interface
              </Text>
            </View>
            {themeMode === "light" && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.primary.main}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Dark Theme Option */}
        <TouchableOpacity
          style={[
            styles.themeOption,
            themeMode === "dark" && styles.selectedOption,
            { borderColor: theme.border.primary },
            themeMode === "dark" && {
              borderColor: theme.primary.main,
              backgroundColor: theme.primary.light,
            },
          ]}
          onPress={handleSetDarkTheme}
          activeOpacity={0.7}
        >
          <View style={styles.themeOptionContent}>
            <View style={[styles.themePreview, styles.darkThemePreview]}>
              <View
                style={[styles.previewHeader, { backgroundColor: "#374151" }]}
              />
              <View
                style={[styles.previewContent, { backgroundColor: "#4B5563" }]}
              />
            </View>
            <View style={styles.themeInfo}>
              <Text style={[typography.label, { color: theme.text.primary }]}>
                Dark Theme
              </Text>
              <Text
                style={[typography.caption, { color: theme.text.secondary }]}
              >
                Easy on the eyes in low light
              </Text>
            </View>
            {themeMode === "dark" && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.primary.main}
              />
            )}
          </View>
        </TouchableOpacity>
      </Card>

      {/* Theme Info */}
      <Card variant="filled" padding="large" margin="none">
        <View style={styles.infoContainer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={theme.info.main}
            style={{ marginRight: spacing.sm }}
          />
          <Text
            style={[
              typography.bodySmall,
              { color: theme.text.secondary, flex: 1 },
            ]}
          >
            Your theme preference is saved automatically and will persist across
            app sessions.
          </Text>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    ...layout.flex.center,
    marginRight: spacing.md,
  },
  toggleText: {
    flex: 1,
  },
  themeOption: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  selectedOption: {
    borderWidth: 2,
  },
  themeOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  themePreview: {
    width: 40,
    height: 30,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    overflow: "hidden",
  },
  lightThemePreview: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  darkThemePreview: {
    backgroundColor: "#1f2937",
  },
  previewHeader: {
    height: 8,
    backgroundColor: "#f3f4f6",
  },
  previewContent: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  themeInfo: {
    flex: 1,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
});

export default ThemeSettings;
