import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Types
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  biometricType?: "fingerprint" | "faceId" | "iris" | "unknown";
}

export interface BiometricSettings {
  isEnabled: boolean;
  userId: string;
  enabledAt: string;
  lastUsed?: string;
}

// Constants
const BIOMETRIC_STORAGE_KEY = "DoorKet_biometric_settings";
const USER_BIOMETRIC_PREFIX = "biometric_user_";

export class BiometricService {
  /**
   * Check if biometric authentication is available on the device
   */
  static async getCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      let biometricType: "fingerprint" | "faceId" | "iris" | "unknown" =
        "unknown";

      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
      ) {
        biometricType = "faceId";
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        )
      ) {
        biometricType = "fingerprint";
      } else if (
        supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
      ) {
        biometricType = "iris";
      }

      return {
        isAvailable: hasHardware && isEnrolled && supportedTypes.length > 0,
        hasHardware,
        isEnrolled,
        supportedTypes,
        biometricType,
      };
    } catch (error) {
      console.error("Error checking biometric capabilities:", error);
      return {
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        biometricType: "unknown",
      };
    }
  }

  /**
   * Check if biometric authentication is enabled for a specific user
   */
  static async isBiometricEnabled(userId: string): Promise<boolean> {
    try {
      const settings = await this.getBiometricSettings(userId);
      return settings?.isEnabled || false;
    } catch (error) {
      console.error("Error checking biometric status:", error);
      return false;
    }
  }

  /**
   * Alias for isBiometricEnabled for compatibility
   */
  static async isEnabledForUser(userId: string): Promise<boolean> {
    return this.isBiometricEnabled(userId);
  }

  /**
   * Enable biometric authentication for a user
   */
  static async enableBiometric(
    userId: string,
    promptMessage: string = "Enable biometric authentication",
  ): Promise<BiometricAuthResult> {
    try {
      // First check if biometric is available
      const capabilities = await this.getCapabilities();
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: "Biometric authentication is not available on this device",
        };
      }

      // Authenticate to enable biometric
      const authResult = await this.authenticate(promptMessage);
      if (!authResult.success) {
        return authResult;
      }

      // Save biometric settings
      const settings: BiometricSettings = {
        isEnabled: true,
        userId,
        enabledAt: new Date().toISOString(),
      };

      await this.saveBiometricSettings(userId, settings);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error("Error enabling biometric:", error);
      return {
        success: false,
        error: error.message || "Failed to enable biometric authentication",
      };
    }
  }

  /**
   * Disable biometric authentication for a user
   */
  static async disableBiometric(
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.removeBiometricSettings(userId);
      return { success: true };
    } catch (error: any) {
      console.error("Error disabling biometric:", error);
      return {
        success: false,
        error: error.message || "Failed to disable biometric authentication",
      };
    }
  }

  /**
   * Authenticate using biometric
   */
  static async authenticate(
    promptMessage: string = "Authenticate to continue",
    fallbackLabel: string = "Use Passcode",
  ): Promise<BiometricAuthResult> {
    try {
      // Check if biometric is available
      const capabilities = await this.getCapabilities();
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: "Biometric authentication is not available",
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel,
        disableDeviceFallback: false,
        cancelLabel: "Cancel",
      });

      if (result.success) {
        return { success: true };
      } else {
        // Handle different error scenarios
        let errorMessage = "Authentication failed";
        let cancelled = false;

        if (
          result.error === "user_cancel" ||
          result.error === "user_fallback"
        ) {
          cancelled = true;
          errorMessage = "Authentication cancelled by user";
        } else if (result.error === "authentication_failed") {
          errorMessage = "Too many failed attempts. Please try again later.";
        } else if (result.error === "not_available") {
          errorMessage = "Biometric authentication is not available";
        } else if (result.error === "not_enrolled") {
          errorMessage = "No biometric credentials are enrolled on this device";
        } else if (result.error === "lockout") {
          errorMessage = "Biometric authentication is temporarily locked";
        } else if (result.error === "passcode_not_set") {
          errorMessage = "Device passcode is not set";
        }

        return {
          success: false,
          error: errorMessage,
          cancelled,
        };
      }
    } catch (error: any) {
      console.error("Biometric authentication error:", error);
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }
  }

  /**
   * Authenticate user with biometric and update last used timestamp
   */
  static async authenticateUser(userId: string): Promise<BiometricAuthResult> {
    try {
      // Check if biometric is enabled for this user
      const isEnabled = await this.isBiometricEnabled(userId);
      if (!isEnabled) {
        return {
          success: false,
          error: "Biometric authentication is not enabled for this user",
        };
      }

      const capabilities = await this.getCapabilities();
      let promptMessage = "Authenticate to continue";

      // Customize prompt based on biometric type
      switch (capabilities.biometricType) {
        case "faceId":
          promptMessage =
            Platform.OS === "ios"
              ? "Use Face ID to authenticate"
              : "Use face recognition to authenticate";
          break;
        case "fingerprint":
          promptMessage = "Use fingerprint to authenticate";
          break;
        case "iris":
          promptMessage = "Use iris scan to authenticate";
          break;
        default:
          promptMessage = "Use biometric authentication";
      }

      const result = await this.authenticate(promptMessage);

      if (result.success) {
        // Update last used timestamp
        await this.updateLastUsed(userId);
      }

      return result;
    } catch (error: any) {
      console.error("User biometric authentication error:", error);
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }
  }

  /**
   * Get biometric type string for UI display
   */
  static async getBiometricTypeString(): Promise<string> {
    try {
      const capabilities = await this.getCapabilities();

      switch (capabilities.biometricType) {
        case "faceId":
          return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
        case "fingerprint":
          return "Fingerprint";
        case "iris":
          return "Iris Scan";
        default:
          return "Biometric Authentication";
      }
    } catch (error) {
      return "Biometric Authentication";
    }
  }

  /**
   * Check if device supports biometric authentication
   */
  static async isSupported(): Promise<boolean> {
    try {
      const capabilities = await this.getCapabilities();
      return capabilities.hasHardware && capabilities.supportedTypes.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get biometric settings for a user
   */
  private static async getBiometricSettings(
    userId: string,
  ): Promise<BiometricSettings | null> {
    try {
      const settingsJson = await SecureStore.getItemAsync(
        `${USER_BIOMETRIC_PREFIX}${userId}`,
      );
      return settingsJson ? JSON.parse(settingsJson) : null;
    } catch (error) {
      console.error("Error getting biometric settings:", error);
      return null;
    }
  }

  /**
   * Save biometric settings for a user
   */
  private static async saveBiometricSettings(
    userId: string,
    settings: BiometricSettings,
  ): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        `${USER_BIOMETRIC_PREFIX}${userId}`,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error("Error saving biometric settings:", error);
      throw error;
    }
  }

  /**
   * Remove biometric settings for a user
   */
  private static async removeBiometricSettings(userId: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${USER_BIOMETRIC_PREFIX}${userId}`);
    } catch (error) {
      console.error("Error removing biometric settings:", error);
      throw error;
    }
  }

  /**
   * Update last used timestamp for biometric authentication
   */
  private static async updateLastUsed(userId: string): Promise<void> {
    try {
      const settings = await this.getBiometricSettings(userId);
      if (settings) {
        settings.lastUsed = new Date().toISOString();
        await this.saveBiometricSettings(userId, settings);
      }
    } catch (error) {
      console.error("Error updating last used timestamp:", error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Clear all biometric data (for app reset/logout)
   */
  static async clearAllBiometricData(): Promise<void> {
    try {
      // Note: This is a destructive operation
      // In a real implementation, you might want to list all stored keys
      // and remove only biometric-related ones
      console.log("Clearing all biometric data...");
      // Implementation would depend on how you track all user biometric settings
    } catch (error) {
      console.error("Error clearing biometric data:", error);
    }
  }

  /**
   * Get security level of biometric authentication
   */
  static async getSecurityLevel(): Promise<"weak" | "strong" | "unknown"> {
    try {
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

      switch (securityLevel) {
        case LocalAuthentication.SecurityLevel.NONE:
          return "weak";
        case LocalAuthentication.SecurityLevel.SECRET:
        case LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK:
          return "weak";
        case LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG:
          return "strong";
        default:
          return "unknown";
      }
    } catch (error) {
      console.error("Error getting security level:", error);
      return "unknown";
    }
  }

  /**
   * Check if biometric authentication should be recommended to user
   */
  static async shouldRecommendBiometric(): Promise<boolean> {
    try {
      const capabilities = await this.getCapabilities();
      const securityLevel = await this.getSecurityLevel();

      return (
        capabilities.isAvailable &&
        capabilities.hasHardware &&
        capabilities.isEnrolled &&
        securityLevel === "strong"
      );
    } catch (error) {
      return false;
    }
  }
}

export default BiometricService;
