import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  ConfirmationResult,
  Auth,
  UserCredential,
} from "firebase/auth";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

console.log("Firebase service module loading...");

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase config loaded:", {
  hasApiKey: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

try {
  console.log("Initializing Firebase with config:", {
    apiKey: firebaseConfig.apiKey ? "✓ Present" : "✗ Missing",
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw new Error("Failed to initialize Firebase");
}

export { auth as firebaseAuth };

// Types
export interface PhoneAuthResult {
  success: boolean;
  confirmation?: ConfirmationResult;
  error?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  userCredential?: UserCredential;
  error?: string;
}

export interface PhoneAuthCredential {
  verificationId: string;
  verificationCode: string;
}

// Phone number validation
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  console.log("validatePhoneNumber input:", phoneNumber);

  // Ghana phone number validation
  const ghanaPhoneRegex = /^(\+233|0)[0-9]{9}$/;
  const isValid = ghanaPhoneRegex.test(phoneNumber);

  console.log("Phone number validation result:", isValid);
  console.log("Regex pattern:", ghanaPhoneRegex.toString());

  return isValid;
};

// Format phone number to international format
export const formatPhoneNumber = (phoneNumber: string): string => {
  console.log("formatPhoneNumber input:", phoneNumber);

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");
  console.log("Cleaned phone number:", cleaned);

  // If starts with 0, replace with +233
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    const formatted = `+233${cleaned.substring(1)}`;
    console.log("Format case 1 (0 prefix):", formatted);
    return formatted;
  }

  // If already has country code without +
  if (cleaned.startsWith("233") && cleaned.length === 12) {
    const formatted = `+${cleaned}`;
    console.log("Format case 2 (233 prefix):", formatted);
    return formatted;
  }

  // If already has + and country code
  if (phoneNumber.startsWith("+233")) {
    console.log("Format case 3 (already formatted):", phoneNumber);
    return phoneNumber;
  }

  // Default case - assume it needs +233 prefix
  const formatted = `+233${cleaned}`;
  console.log("Format case 4 (default):", formatted);
  return formatted;
};

export class FirebasePhoneAuth {
  private static recaptchaVerifier: RecaptchaVerifier | null = null;

  /**
   * Initialize reCAPTCHA verifier for web platform
   */
  private static initializeRecaptcha(): RecaptchaVerifier | null {
    if (Platform.OS === "web") {
      try {
        this.recaptchaVerifier = new RecaptchaVerifier(
          auth,
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
    return null;
  }

  /**
   * Send OTP to phone number
   */
  static async sendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    console.log("=== FIREBASE SEND OTP START ===");
    console.log("Input phone number:", phoneNumber);

    // Validate phone number
    console.log("Validating phone number...");
    const isValid = validatePhoneNumber(phoneNumber);
    console.log("Phone validation result:", isValid);

    if (!isValid) {
      console.log("❌ Phone number validation failed");
      return {
        success: false,
        error:
          "Invalid phone number format. Please use Ghana phone number format.",
      };
    }

    // Format phone number
    console.log("Formatting phone number...");
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log("✅ Formatted phone number:", formattedPhone);

    try {
      // Check if we're in test mode
      const isTestMode = process.env.EXPO_PUBLIC_ENABLE_TEST_MODE === "true";
      const testPhoneNumber =
        process.env.EXPO_PUBLIC_TEST_PHONE_NUMBER || "+233000000000";

      // For development/testing, you can enable test mode
      if (isTestMode) {
        console.log("🧪 Test mode enabled - using Firebase test phone numbers");
        console.log(
          "📱 Make sure to add test phone numbers in Firebase Console:",
        );
        console.log(
          "   Authentication > Sign-in method > Phone > Test phone numbers",
        );
        console.log("   Add: +233246562377 with code: 123456");
      }

      // Initialize reCAPTCHA for web only
      if (Platform.OS === "web" && !this.recaptchaVerifier) {
        console.log("Initializing reCAPTCHA for web platform...");
        const recaptcha = this.initializeRecaptcha();
        if (!recaptcha) {
          return {
            success: false,
            error:
              "Failed to initialize reCAPTCHA. Please refresh and try again.",
          };
        }
      }

      // Validate Firebase auth instance
      if (!auth) {
        console.error("Firebase auth not initialized");
        return {
          success: false,
          error:
            "Firebase authentication not initialized. Check your environment variables.",
        };
      }

      // Check environment configuration
      console.log("🔧 Firebase environment check:", {
        hasApiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        hasProjectId: !!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      });

      if (
        !process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
        !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
      ) {
        return {
          success: false,
          error:
            "Firebase configuration missing. Run 'npm run setup-firebase' to generate .env file.",
        };
      }

      // Send OTP
      console.log("Calling signInWithPhoneNumber with:", {
        phoneNumber: formattedPhone,
        platform: Platform.OS,
        hasRecaptcha: Platform.OS === "web" ? !!this.recaptchaVerifier : "N/A",
        authInitialized: !!auth,
      });

      let confirmation;
      if (Platform.OS === "web") {
        // For web, use reCAPTCHA
        if (!this.recaptchaVerifier) {
          const recaptcha = this.initializeRecaptcha();
          if (!recaptcha) {
            return {
              success: false,
              error:
                "Failed to initialize reCAPTCHA. Please refresh and try again.",
            };
          }
        }
        confirmation = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          this.recaptchaVerifier!,
        );
      } else {
        // For React Native/Expo, we need to use a different approach
        // The Firebase web SDK doesn't support phone auth on mobile without reCAPTCHA
        if (Platform.OS === "android" || Platform.OS === "ios") {
          throw new Error(
            "Phone authentication on mobile requires Firebase React Native SDK or Expo Firebase integration. Current web SDK setup only works in web browsers with reCAPTCHA.",
          );
        }

        // For mobile platforms, use web view or redirect to web for phone auth
        confirmation = await signInWithPhoneNumber(auth, formattedPhone);
      }

      return {
        success: true,
        confirmation,
      };
    } catch (error: any) {
      console.error("Send OTP error:", error);

      console.error("❌ Firebase OTP send failed:", error);

      // Provide detailed error guidance
      if (Platform.OS === "android" || Platform.OS === "ios") {
        console.log("\n🔧 Mobile Phone Auth Setup Required:");
        console.log("1. Use Expo's Firebase integration:");
        console.log("   npx expo install expo-firebase-auth");
        console.log("2. Or implement web-based phone auth flow");
        console.log("3. Or use Firebase React Native SDK");
        console.log(
          "\nCurrent setup only works in web browsers with reCAPTCHA.",
        );
      }

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
        case "auth/user-disabled":
          errorMessage = "This phone number has been disabled.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Phone authentication is not enabled.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later.";
          break;
        case "auth/argument-error":
          errorMessage =
            "Phone authentication not properly configured in Firebase. Please check Firebase Console settings.";
          break;
        case "auth/project-not-found":
          errorMessage =
            "Firebase project not found. Please check your configuration.";
          break;
        case "auth/app-not-authorized":
          errorMessage = "App not authorized for this Firebase project.";
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
  static async verifyOTP(
    confirmation: ConfirmationResult,
    otpCode: string,
  ): Promise<OTPVerificationResult> {
    try {
      // Validate OTP code format
      if (!otpCode || otpCode.length !== 6) {
        return {
          success: false,
          error: "OTP must be 6 digits.",
        };
      }

      // Verify the OTP
      const userCredential = await confirmation.confirm(otpCode);

      return {
        success: true,
        userCredential,
      };
    } catch (error: any) {
      console.error("Verify OTP error:", error);

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
          errorMessage = error.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sign in with phone auth credential
   */
  static async signInWithCredential(
    credential: PhoneAuthCredential,
  ): Promise<OTPVerificationResult> {
    try {
      const authCredential = PhoneAuthProvider.credential(
        credential.verificationId,
        credential.verificationCode,
      );

      const userCredential = await signInWithCredential(auth, authCredential);

      return {
        success: true,
        userCredential,
      };
    } catch (error: any) {
      console.error("Sign in with credential error:", error);

      return {
        success: false,
        error: error.message || "Authentication failed. Please try again.",
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error: any) {
      console.error("Firebase sign out error:", error);
      return {
        success: false,
        error: error.message || "Failed to sign out.",
      };
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: any) => void) {
    return auth.onAuthStateChanged(callback);
  }

  /**
   * Clean up reCAPTCHA verifier
   */
  static cleanup() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }

  /**
   * Resend OTP (same as sendOTP but with logging for resend)
   */
  static async resendOTP(phoneNumber: string): Promise<PhoneAuthResult> {
    console.log("Resending OTP to:", phoneNumber);
    return this.sendOTP(phoneNumber);
  }

  /**
   * Check if phone number is already registered
   */
  static async isPhoneNumberRegistered(phoneNumber: string): Promise<boolean> {
    try {
      // This is a helper method - in production, you'd check against your user database
      // For now, we'll return false as Firebase doesn't provide a direct way to check
      // if a phone number is registered without sending an OTP
      return false;
    } catch (error) {
      console.error("Check phone number registration error:", error);
      return false;
    }
  }
}

// Utility functions
export const generateMockOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isValidOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

// Export auth instance and service class
export default FirebasePhoneAuth;
