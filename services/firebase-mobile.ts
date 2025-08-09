import { Platform, Linking } from "react-native";
import { firebaseAuth } from "./firebase";
import {
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  UserCredential,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export interface MobilePhoneAuthResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

export interface MobileOTPVerificationResult {
  success: boolean;
  userCredential?: UserCredential;
  error?: string;
}

// Storage keys
const VERIFICATION_ID_KEY = "firebase_verification_id";
const PHONE_NUMBER_KEY = "firebase_phone_number";

/**
 * Mobile-optimized Firebase Phone Authentication Service
 *
 * This service provides phone authentication that works on all platforms:
 * - Web: Uses reCAPTCHA
 * - Mobile: Uses web view or custom server integration
 */
export class MobileFirebaseAuth {
  private static instance: MobileFirebaseAuth;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  static getInstance(): MobileFirebaseAuth {
    if (!this.instance) {
      this.instance = new MobileFirebaseAuth();
    }
    return this.instance;
  }

  /**
   * Initialize reCAPTCHA for web platform only
   */
  private async initializeRecaptcha(): Promise<RecaptchaVerifier | null> {
    if (Platform.OS === "web") {
      try {
        // Create reCAPTCHA container if it doesn't exist
        if (!document.getElementById("recaptcha-container")) {
          const container = document.createElement("div");
          container.id = "recaptcha-container";
          container.style.display = "none";
          document.body.appendChild(container);
        }

        this.recaptchaVerifier = new RecaptchaVerifier(
          firebaseAuth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              console.log("reCAPTCHA solved");
            },
            "expired-callback": () => {
              console.log("reCAPTCHA expired");
            },
          },
        );
        return this.recaptchaVerifier;
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
        return null;
      }
    }
    // For mobile platforms, reCAPTCHA is not needed
    return null;
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // If starts with 0, replace with +233 (Ghana)
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      return `+233${cleaned.substring(1)}`;
    }

    // If already has country code without +
    if (cleaned.startsWith("233") && cleaned.length === 12) {
      return `+${cleaned}`;
    }

    // If already has + and country code
    if (phoneNumber.startsWith("+233")) {
      return phoneNumber;
    }

    // Default case - assume it needs +233 prefix
    return `+233${cleaned}`;
  }

  /**
   * Validate Ghana phone number
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    const ghanaPhoneRegex = /^(\+233|0)[0-9]{9}$/;
    return ghanaPhoneRegex.test(phoneNumber);
  }

  /**
   * Send OTP via web-based authentication
   */
  private async sendOTPWeb(
    phoneNumber: string,
  ): Promise<MobilePhoneAuthResult> {
    try {
      console.log("🌐 Using web-based phone authentication");

      // Initialize reCAPTCHA
      const recaptcha = await this.initializeRecaptcha();
      if (!recaptcha) {
        throw new Error("Failed to initialize reCAPTCHA");
      }

      // Send OTP
      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        phoneNumber,
        recaptcha,
      );

      // Store verification ID
      await AsyncStorage.setItem(
        VERIFICATION_ID_KEY,
        confirmation.verificationId,
      );
      await AsyncStorage.setItem(PHONE_NUMBER_KEY, phoneNumber);

      return {
        success: true,
        verificationId: confirmation.verificationId,
      };
    } catch (error: any) {
      console.error("Web OTP send error:", error);
      return {
        success: false,
        error: error.message || "Failed to send OTP via web",
      };
    }
  }

  /**
   * Send OTP for mobile platforms using Firebase Web SDK
   * Requires proper Firebase project configuration with APNs/FCM
   */
  private async sendOTPMobile(
    phoneNumber: string,
  ): Promise<MobilePhoneAuthResult> {
    try {
      console.log("📱 Sending SMS via Firebase on mobile (no reCAPTCHA)");

      // Check if this is a test phone number
      const isTestPhone = this.isTestPhoneNumber(phoneNumber);

      if (isTestPhone) {
        console.log("🧪 Test phone number detected - using test verification");

        // For test numbers, create a test verification ID
        const testVerificationId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await AsyncStorage.setItem(VERIFICATION_ID_KEY, testVerificationId);
        await AsyncStorage.setItem(PHONE_NUMBER_KEY, phoneNumber);

        console.log("✅ Test verification ID created:", testVerificationId);

        return {
          success: true,
          verificationId: testVerificationId,
        };
      }

      // For real phone numbers on mobile, try direct Firebase call without reCAPTCHA
      try {
        console.log("📱 Attempting direct Firebase SMS for real number");
        const confirmation = await signInWithPhoneNumber(
          firebaseAuth,
          phoneNumber,
        );

        await AsyncStorage.setItem(
          VERIFICATION_ID_KEY,
          confirmation.verificationId,
        );
        await AsyncStorage.setItem(PHONE_NUMBER_KEY, phoneNumber);

        console.log("✅ Real SMS sent successfully");
        return {
          success: true,
          verificationId: confirmation.verificationId,
        };
      } catch (directError: any) {
        console.warn("Direct Firebase SMS failed:", directError.message);

        // Provide helpful error messages for mobile configuration
        if (directError.code === "auth/operation-not-allowed") {
          return {
            success: false,
            error:
              "Phone authentication not enabled in Firebase Console. Enable it at: https://console.firebase.google.com/project/DoorKet-82798/authentication",
          };
        }

        if (
          directError.code === "auth/argument-error" ||
          directError.message.includes("APNs") ||
          directError.message.includes("reCAPTCHA")
        ) {
          return {
            success: false,
            error:
              "Mobile SMS requires APNs (iOS) or FCM (Android) configuration in Firebase Console. For now, use test phone number +233246562377 with code 123456.",
          };
        }

        return {
          success: false,
          error:
            directError.message ||
            "Failed to send SMS on mobile. Use test number +233246562377 for development.",
        };
      }
    } catch (error: any) {
      console.error("Mobile OTP send error:", error);
      return {
        success: false,
        error:
          error.message ||
          "Failed to send SMS on mobile. Use test number +233246562377 for development.",
      };
    }
  }

  /**
   * Send OTP to phone number (platform-aware)
   */
  async sendOTP(phoneNumber: string): Promise<MobilePhoneAuthResult> {
    console.log("=== MOBILE FIREBASE AUTH: SEND OTP ===");
    console.log("📱 Platform:", Platform.OS);
    console.log("📞 Phone:", phoneNumber);

    // Check Firebase initialization
    if (!firebaseAuth) {
      console.error("❌ Firebase Auth not initialized");
      return {
        success: false,
        error:
          "Firebase authentication not initialized. Please restart the app.",
      };
    }

    // Validate phone number
    if (!this.validatePhoneNumber(phoneNumber)) {
      return {
        success: false,
        error:
          "Invalid phone number format. Please use Ghana phone number format.",
      };
    }

    // Format phone number
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    console.log("✅ Formatted phone:", formattedPhone);

    try {
      // Check environment
      const hasFirebaseConfig = !!(
        process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
        process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
      );

      if (!hasFirebaseConfig) {
        throw new Error(
          "Firebase configuration missing. Run 'npm run setup-firebase' to generate .env file.",
        );
      }

      // Platform-specific OTP sending
      if (Platform.OS === "web") {
        return await this.sendOTPWeb(formattedPhone);
      } else {
        // For mobile, bypass reCAPTCHA and use direct Firebase
        return await this.sendOTPMobile(formattedPhone);
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);

      let errorMessage = "Failed to send OTP. Please try again.";

      // Handle specific Firebase errors
      switch (error.code) {
        case "auth/invalid-phone-number":
          errorMessage = "Invalid phone number format.";
          break;
        case "auth/missing-phone-number":
          errorMessage = "Phone number is required.";
          break;
        case "auth/quota-exceeded":
          errorMessage = "SMS quota exceeded. Please try again later.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later.";
          break;
        case "auth/operation-not-allowed":
          errorMessage =
            "Phone authentication is not enabled in Firebase Console.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(otpCode: string): Promise<MobileOTPVerificationResult> {
    console.log("=== MOBILE FIREBASE AUTH: VERIFY OTP ===");
    console.log("🔢 OTP Code:", otpCode);
    console.log("📱 Platform:", Platform.OS);

    try {
      // Check Firebase initialization
      if (!firebaseAuth) {
        console.error("❌ Firebase Auth not initialized for verification");
        return {
          success: false,
          error:
            "Firebase authentication not initialized. Please restart the app.",
        };
      }

      // Validate OTP code format
      if (!otpCode || otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
        console.log("❌ Invalid OTP format");
        return {
          success: false,
          error: "OTP must be 6 digits.",
        };
      }

      // Get stored verification data with error handling
      let verificationId: string | null = null;
      let phoneNumber: string | null = null;

      try {
        verificationId = await AsyncStorage.getItem(VERIFICATION_ID_KEY);
        phoneNumber = await AsyncStorage.getItem(PHONE_NUMBER_KEY);
        console.log("📋 Retrieved verification ID:", verificationId);
        console.log("📞 Retrieved phone number:", phoneNumber);
      } catch (storageError) {
        console.error("❌ AsyncStorage error:", storageError);
        return {
          success: false,
          error: "Failed to retrieve verification data. Please try again.",
        };
      }

      if (!verificationId || !phoneNumber) {
        console.log("❌ Missing verification data");
        return {
          success: false,
          error: "Verification session not found. Please request a new OTP.",
        };
      }

      // Platform-specific verification with error handling
      try {
        if (Platform.OS === "web") {
          console.log("🌐 Using web verification");
          return await this.verifyOTPWeb(verificationId, otpCode);
        } else {
          console.log("📱 Using mobile verification");
          return await this.verifyOTPMobile(
            verificationId,
            otpCode,
            phoneNumber,
          );
        }
      } catch (verificationError: any) {
        console.error("❌ Verification method error:", verificationError);
        throw verificationError; // Re-throw to be caught by outer try-catch
      }
    } catch (error: any) {
      console.error("💥 Verify OTP critical error:", error);
      console.error("💥 Error stack:", error.stack);

      let errorMessage = "Invalid OTP code. Please try again.";

      // Handle specific Firebase errors
      switch (error.code) {
        case "auth/invalid-verification-code":
          errorMessage = "Invalid OTP code. Please check and try again.";
          break;
        case "auth/code-expired":
          errorMessage = "OTP code has expired. Please request a new one.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case "auth/session-expired":
          errorMessage = "Session expired. Please request a new OTP.";
          break;
        default:
          errorMessage =
            error.message || "Verification failed. Please try again.";
      }

      console.log("🔄 Returning error result:", errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify OTP for web platform
   */
  private async verifyOTPWeb(
    verificationId: string,
    otpCode: string,
  ): Promise<MobileOTPVerificationResult> {
    try {
      console.log("🌐 Verifying OTP via web Firebase");

      // Create credential and sign in
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      const userCredential = await signInWithCredential(
        firebaseAuth,
        credential,
      );

      // Clean up stored data
      await AsyncStorage.removeItem(VERIFICATION_ID_KEY);
      await AsyncStorage.removeItem(PHONE_NUMBER_KEY);

      console.log("✅ Web OTP verification successful");
      return {
        success: true,
        userCredential,
      };
    } catch (error: any) {
      console.error("Web OTP verification error:", error);
      throw error;
    }
  }

  /**
   * Verify OTP for mobile platforms with test phone number support
   */
  private async verifyOTPMobile(
    verificationId: string,
    otpCode: string,
    phoneNumber: string,
  ): Promise<MobileOTPVerificationResult> {
    try {
      console.log("📱 Mobile verification starting");
      console.log("📋 Verification ID:", verificationId);
      console.log("🔢 OTP Code:", otpCode);
      console.log("📞 Phone Number:", phoneNumber);

      // Check if this is a test phone number with test verification ID
      const isTestPhone =
        phoneNumber === "+233246562377" || phoneNumber.endsWith("246562377");
      const isTestVerificationId = verificationId.startsWith("test_");
      const isTestOTP = otpCode === "123456";

      console.log("🧪 Test checks:", {
        isTestPhone,
        isTestVerificationId,
        isTestOTP,
      });

      if (isTestPhone && isTestVerificationId && isTestOTP) {
        console.log("🧪 Test phone number verification successful");

        try {
          // Clean up stored data
          await AsyncStorage.removeItem(VERIFICATION_ID_KEY);
          await AsyncStorage.removeItem(PHONE_NUMBER_KEY);
          console.log("🧹 Cleaned up test verification data");
        } catch (cleanupError) {
          console.warn("⚠️ Cleanup warning:", cleanupError);
          // Don't fail verification due to cleanup issues
        }

        // Create a mock user credential for test
        const mockUserCredential = {
          user: {
            uid: `test_${Date.now()}`,
            phoneNumber: phoneNumber,
            providerId: "phone",
            isAnonymous: false,
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: new Date().toISOString(),
            },
          },
        } as UserCredential;

        console.log(
          "✅ Test verification successful, returning mock credential",
        );

        return {
          success: true,
          userCredential: mockUserCredential,
        };
      }

      // For real verification IDs, use web verification
      console.log("🌐 Using web verification for real verification ID");
      return await this.verifyOTPWeb(verificationId, otpCode);
    } catch (error: any) {
      console.error("💥 Mobile OTP verification error:", error);
      console.error("💥 Mobile verification stack:", error.stack);

      // Don't throw - return error result instead to prevent crash
      return {
        success: false,
        error: error.message || "Mobile verification failed. Please try again.",
      };
    }
  }

  /**
   * Clean up stored verification data
   */
  async cleanup(): Promise<void> {
    try {
      console.log("🧹 Starting mobile Firebase cleanup");
      await AsyncStorage.removeItem(VERIFICATION_ID_KEY);
      await AsyncStorage.removeItem(PHONE_NUMBER_KEY);

      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
      console.log("✅ Mobile Firebase cleanup completed");
    } catch (error) {
      console.warn("⚠️ Cleanup error:", error);
    }
  }

  /**
   * Check if phone number is in test mode
   */
  isTestPhoneNumber(phoneNumber: string): boolean {
    const testNumbers = [
      "+233000000000",
      "+233111111111",
      "+233246562377", // Your Firebase Console test number
    ];

    const formatted = this.formatPhoneNumber(phoneNumber);
    const isTest = testNumbers.includes(formatted);

    if (isTest) {
      console.log(`🧪 Detected test phone number: ${formatted}`);
    }

    return isTest;
  }

  /**
   * Get current verification status
   */
  async getVerificationStatus(): Promise<{
    hasVerificationId: boolean;
    phoneNumber: string | null;
    verificationId: string | null;
  }> {
    try {
      const verificationId = await AsyncStorage.getItem(VERIFICATION_ID_KEY);
      const phoneNumber = await AsyncStorage.getItem(PHONE_NUMBER_KEY);

      return {
        hasVerificationId: !!verificationId,
        phoneNumber,
        verificationId,
      };
    } catch (error) {
      console.warn("Get verification status error:", error);
      return {
        hasVerificationId: false,
        phoneNumber: null,
        verificationId: null,
      };
    }
  }
}

// Export singleton instance
export const mobileFirebaseAuth = MobileFirebaseAuth.getInstance();

// Export for backward compatibility
export default mobileFirebaseAuth;
