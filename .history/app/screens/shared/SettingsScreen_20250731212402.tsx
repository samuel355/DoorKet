import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  Switch,
  Divider,
  Portal,
  Modal,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../../store/authStore";
import { NotificationService } from "../../services/notifications";
import {
  COLORS,
  SPACING,
  FONTS,
  BORDER_RADIUS,
  APP_CONFIG,
  STORAGE_KEYS,
} from "../../constants";

interface SettingsScreenProps {
  navigation: any;
}

interface AppSettings {
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    generalAlerts: boolean;
    sound: boolean;
    vibration: boolean;
  };
  privacy: {
    shareLocation: boolean;
    shareUsageData: boolean;
  };
  preferences: {
    language: string;
    currency: string;
    theme: "light" | "dark" | "auto";
  };
}

const defaultSettings: AppSettings = {
  notifications: {
    orderUpdates: true,
    promotions: true,
    generalAlerts: true,
    sound: true,
    vibration: true,
  },
  privacy: {
    shareLocation: true,
    shareUsageData: false,
  },
  preferences: {
    language: "en",
    currency: "GHS",
    theme: "light",
  },
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, profile } = useAuth();

  // State
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Load settings from storage
  const loadSettings = useCallback(async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(
        STORAGE_KEYS.APP_SETTINGS,
      );
      if (storedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, []);

  // Save settings to storage
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_SETTINGS,
        JSON.stringify(newSettings),
      );
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings");
    }
  };

  // Handle notification setting change
  const handleNotificationChange = async (
    key: keyof AppSettings["notifications"],
    value: boolean,
  ) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    };

    // If disabling all notifications, check permissions
    if (key === "orderUpdates" && !value) {
      Alert.alert(
        "Disable Order Updates",
        "You will not receive notifications about your order status. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Disable", onPress: () => saveSettings(newSettings) },
        ],
      );
    } else {
      await saveSettings(newSettings);
    }
  };

  // Handle privacy setting change
  const handlePrivacyChange = async (
    key: keyof AppSettings["privacy"],
    value: boolean,
  ) => {
    if (key === "shareLocation" && !value) {
      Alert.alert(
        "Disable Location Sharing",
        "Disabling location sharing may affect delivery accuracy. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            onPress: async () => {
              const newSettings = {
                ...settings,
                privacy: {
                  ...settings.privacy,
                  [key]: value,
                },
              };
              await saveSettings(newSettings);
            },
          },
        ],
      );
    } else {
      const newSettings = {
        ...settings,
        privacy: {
          ...settings.privacy,
          [key]: value,
        },
      };
      await saveSettings(newSettings);
    }
  };

  // Handle clear cache
  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear temporary app data and may improve performance. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            setLoading(true);
            try {
              // Clear specific cache keys (implement based on your caching strategy)
              await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Handle reset settings
  const handleResetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "This will reset all app settings to default values. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => saveSettings(defaultSettings),
        },
      ],
    );
  };

  // Handle contact support
  const handleContactSupport = () => {
    const email = "support@chopcart.com";
    const subject = "ChopCart Support Request";
    const body = `Hi ChopCart Support Team,\n\nUser ID: ${user?.id}\nUser Type: ${profile?.user_type}\nApp Version: ${APP_CONFIG.VERSION}\n\nDescription:\n`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoUrl);
        } else {
          Alert.alert("Email not available", `Please contact us at ${email}`, [
            { text: "OK" },
            {
              text: "Copy Email",
              onPress: () => console.log("Copy email functionality"),
            },
          ]);
        }
      })
      .catch((error) => {
        console.error("Error opening email:", error);
        Alert.alert("Error", "Failed to open email app");
      });
  };

  // Handle privacy policy
  const handlePrivacyPolicy = () => {
    const url = "https://chopcart.com/privacy";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Failed to open privacy policy");
    });
  };

  // Handle terms of service
  const handleTermsOfService = () => {
    const url = "https://chopcart.com/terms";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Failed to open terms of service");
    });
  };

  // Effects
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Render setting item with switch
  const renderSwitchSetting = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon?: string,
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={24}
            color={COLORS.PRIMARY}
            style={styles.settingIcon}
          />
        )}
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        color={COLORS.PRIMARY}
      />
    </View>
  );

  // Render setting item with action
  const renderActionSetting = (
    title: string,
    description: string,
    onPress: () => void,
    icon?: string,
    rightText?: string,
    destructive?: boolean,
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingInfo}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={24}
            color={destructive ? COLORS.ERROR : COLORS.PRIMARY}
            style={styles.settingIcon}
          />
        )}
        <View style={styles.settingText}>
          <Text
            style={[styles.settingTitle, destructive && styles.destructiveText]}
          >
            {title}
          </Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightText && <Text style={styles.settingRightText}>{rightText}</Text>}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.TEXT_SECONDARY}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            {renderSwitchSetting(
              "Order Updates",
              "Get notified about order status changes",
              settings.notifications.orderUpdates,
              (value) => handleNotificationChange("orderUpdates", value),
              "receipt",
            )}

            {renderSwitchSetting(
              "Promotions",
              "Receive promotional offers and discounts",
              settings.notifications.promotions,
              (value) => handleNotificationChange("promotions", value),
              "gift",
            )}

            {renderSwitchSetting(
              "General Alerts",
              "App updates and important announcements",
              settings.notifications.generalAlerts,
              (value) => handleNotificationChange("generalAlerts", value),
              "information-circle",
            )}

            <Divider style={styles.sectionDivider} />

            {renderSwitchSetting(
              "Sound",
              "Play sound for notifications",
              settings.notifications.sound,
              (value) => handleNotificationChange("sound", value),
              "volume-high",
            )}

            {renderSwitchSetting(
              "Vibration",
              "Vibrate for notifications",
              settings.notifications.vibration,
              (value) => handleNotificationChange("vibration", value),
              "phone-vibrate",
            )}
          </Card.Content>
        </Card>

        {/* Privacy */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Privacy</Text>

            {renderSwitchSetting(
              "Share Location",
              "Allow location sharing for accurate delivery",
              settings.privacy.shareLocation,
              (value) => handlePrivacyChange("shareLocation", value),
              "location",
            )}

            {renderSwitchSetting(
              "Usage Analytics",
              "Help improve the app by sharing usage data",
              settings.privacy.shareUsageData,
              (value) => handlePrivacyChange("shareUsageData", value),
              "analytics",
            )}

            {renderActionSetting(
              "Privacy Policy",
              "Read our privacy policy",
              handlePrivacyPolicy,
              "shield-checkmark",
              "View",
            )}
          </Card.Content>
        </Card>

        {/* Preferences */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            {renderActionSetting(
              "Language",
              "Choose your preferred language",
              () => setShowLanguageModal(true),
              "language",
              "English",
            )}

            {renderActionSetting(
              "Currency",
              "Display currency preference",
              () =>
                Alert.alert(
                  "Coming Soon",
                  "Currency selection will be available in a future update",
                ),
              "card",
              settings.preferences.currency,
            )}

            {renderActionSetting(
              "Theme",
              "Choose app appearance",
              () => setShowThemeModal(true),
              "color-palette",
              "Light",
            )}
          </Card.Content>
        </Card>

        {/* Storage & Data */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Storage & Data</Text>

            {renderActionSetting(
              "Clear Cache",
              "Free up storage space",
              handleClearCache,
              "trash",
              undefined,
              false,
            )}

            {renderActionSetting(
              "Reset Settings",
              "Reset all settings to default values",
              handleResetSettings,
              "refresh",
              undefined,
              true,
            )}
          </Card.Content>
        </Card>

        {/* Support */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Support</Text>

            {renderActionSetting(
              "Contact Support",
              "Get help from our support team",
              handleContactSupport,
              "mail",
              "Email",
            )}

            {renderActionSetting(
              "Terms of Service",
              "Read our terms and conditions",
              handleTermsOfService,
              "document-text",
              "View",
            )}

            {renderActionSetting(
              "Rate App",
              "Rate ChopCart on the app store",
              () =>
                Alert.alert("Coming Soon", "App rating will be available soon"),
              "star",
              "Rate",
            )}
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>About</Text>

            <View style={styles.appInfo}>
              <Text style={styles.appName}>{APP_CONFIG.APP_NAME}</Text>
              <Text style={styles.appVersion}>
                Version {APP_CONFIG.VERSION}
              </Text>
              <Text style={styles.appDescription}>
                Your campus food delivery companion
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Language Selection Modal */}
      <Portal>
        <Modal
          visible={showLanguageModal}
          onDismiss={() => setShowLanguageModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select Language</Text>
          <TouchableOpacity style={styles.languageOption}>
            <Text style={styles.languageText}>English</Text>
            <Ionicons name="checkmark" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.comingSoonText}>More languages coming soon!</Text>
          <Button
            mode="outlined"
            onPress={() => setShowLanguageModal(false)}
            style={styles.modalButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>

      {/* Theme Selection Modal */}
      <Portal>
        <Modal
          visible={showThemeModal}
          onDismiss={() => setShowThemeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Select Theme</Text>
          <TouchableOpacity style={styles.themeOption}>
            <View style={styles.themeInfo}>
              <Ionicons name="sunny" size={24} color={COLORS.WARNING} />
              <Text style={styles.themeText}>Light</Text>
            </View>
            <Ionicons name="checkmark" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.themeOption, styles.disabledOption]}>
            <View style={styles.themeInfo}>
              <Ionicons name="moon" size={24} color={COLORS.GRAY_400} />
              <Text style={[styles.themeText, styles.disabledText]}>Dark</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.themeOption, styles.disabledOption]}>
            <View style={styles.themeInfo}>
              <Ionicons
                name="phone-portrait"
                size={24}
                color={COLORS.GRAY_400}
              />
              <Text style={[styles.themeText, styles.disabledText]}>Auto</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.comingSoonText}>
            Dark and Auto themes coming soon!
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowThemeModal(false)}
            style={styles.modalButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.LG,
  },
  sectionCard: {
    borderRadius: BORDER_RADIUS.LG,
    elevation: 2,
    marginBottom: SPACING.LG,
  },
  sectionContent: {
    padding: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
  },
  sectionDivider: {
    marginVertical: SPACING.MD,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: SPACING.MD,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  settingDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingRightText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginRight: SPACING.SM,
  },
  destructiveText: {
    color: COLORS.ERROR,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: SPACING.LG,
  },
  appName: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  appVersion: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  appDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
  },
  modalTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
    textAlign: "center",
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  languageText: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  themeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  disabledOption: {
    opacity: 0.5,
  },
  themeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeText: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.MD,
  },
  disabledText: {
    color: COLORS.TEXT_SECONDARY,
  },
  comingSoonText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginVertical: SPACING.MD,
    fontStyle: "italic",
  },
  modalButton: {
    marginTop: SPACING.LG,
    alignSelf: "center",
    minWidth: 100,
  },
});

export default SettingsScreen;
