import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Session } from "@supabase/supabase-js";
import { User as AppUser, RegisterData, BiometricAuthResult } from "../types";
import { AuthService, SupabaseService } from "../services/supabase";
import BiometricService from "../services/auth/biometric";

// Auth state interface
interface AuthState {
  // Core state
  user: User | null;
  profile: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Error handling - simpler approach
  error: string | null;
  lastError: {
    message: string;
    type: "auth" | "network" | "validation" | "system";
    timestamp: number;
  } | null;

  // Actions
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Phone OTP methods
  sendPhoneOTP: (
    phone: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOTP: (
    otp: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resendPhoneOTP: (
    phone: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Profile management
  createProfile: (
    userData: RegisterData,
    signUpUser?: User,
  ) => Promise<{ success: boolean; error?: string }>;
  createUserProfile: (
    userData: RegisterData,
    signUpUser?: User,
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    updates: Partial<AppUser>,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;

  // Biometric auth
  enableBiometric: () => Promise<BiometricAuthResult>;
  authenticateWithBiometric: () => Promise<BiometricAuthResult>;
  disableBiometric: () => Promise<{ success: boolean; error?: string }>;
  isBiometricEnabled: () => Promise<boolean>;

  // Utility
  clearError: () => void;
  clearLastError: () => void;
  checkAuthStatus: () => Promise<void>;
  reset: () => void;
}

// Helper function to determine error type
const getErrorType = (
  error: any,
): "auth" | "network" | "validation" | "system" => {
  const message = error?.message?.toLowerCase() || "";

  if (
    message.includes("invalid login") ||
    message.includes("authentication") ||
    message.includes("unauthorized")
  ) {
    return "auth";
  }
  if (
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("timeout")
  ) {
    return "network";
  }
  if (
    message.includes("validation") ||
    message.includes("required") ||
    message.includes("invalid")
  ) {
    return "validation";
  }
  return "system";
};

// Create the store
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isInitialized: false,
        error: null,
        lastError: null,

        // Email/Password Authentication
        signInWithEmail: async (email: string, password: string) => {
          try {
            // console.log("🔐 BEFORE LOGIN - Auth State:", {
            //   isAuthenticated: get().isAuthenticated,
            //   isInitialized: get().isInitialized,
            //   isLoading: get().isLoading,
            // });

            set({ isLoading: true, error: null });

            console.log("🔐 Attempting email sign in...");
            const { data, error } = await AuthService.signInWithEmail(
              email,
              password,
            );

            if (error) {
              const errorMessage = error || "Sign in failed";
              console.error("❌ SignIn error:", error);
              // console.log("🔐 FAILED LOGIN - Setting state:", {
              //   isLoading: false,
              //   error: errorMessage,
              //   isAuthenticated: get().isAuthenticated,
              //   isInitialized: get().isInitialized,
              // });

              set({
                isLoading: false,
                error: errorMessage,
                lastError: {
                  message: errorMessage,
                  type: getErrorType({ message: error }),
                  timestamp: Date.now(),
                },
              });

              // console.log("🔐 AFTER FAILED LOGIN - Auth State:", {
              //   isAuthenticated: get().isAuthenticated,
              //   isInitialized: get().isInitialized,
              //   isLoading: get().isLoading,
              // });

              return { success: false, error: errorMessage };
            }

            if (data?.user && data?.session) {
              console.log("✅ Email sign in successful");

              // Load user profile
              const profileResult = await SupabaseService.getUserProfile(
                data.user.id,
              );

              if (!profileResult.data && !profileResult.error) {
                console.log(
                  "ℹ️ No profile found, attempting to create basic profile",
                );

                // Try to auto-create a basic profile for existing auth users
                const basicProfileData = {
                  id: data.user.id,
                  email: data.user.email || "",
                  phone: `temp_${data.user.id.slice(0, 8)}`, // Temporary unique phone
                  full_name:
                    data.user.user_metadata?.full_name ||
                    data.user.email?.split("@")[0] ||
                    "User",
                  user_type: "admin" as const,
                  university: "KNUST", // Default university to satisfy NOT NULL constraint
                  is_verified: false,
                  is_active: true,
                  face_id_enabled: false,
                  rating: 0,
                  total_orders: 0,
                };

                console.log("🔄 Creating basic profile:", basicProfileData);
                const createResult =
                  await SupabaseService.createUserProfile(basicProfileData);

                if (createResult.error) {
                  console.log(
                    "❌ Failed to auto-create profile, user needs manual setup",
                  );
                  // User exists but has no profile - allow them to complete setup manually
                  set({
                    user: data.user,
                    session: data.session,
                    profile: null,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                    lastError: null,
                  });
                  return { success: true };
                }

                console.log("✅ Basic profile created successfully");
                set({
                  user: data.user,
                  session: data.session,
                  profile: createResult.data,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                  lastError: null,
                });
                return { success: true };
              }

              if (profileResult.error) {
                console.error("Profile fetch error:", profileResult.error);
                set({
                  isLoading: false,
                  error: `Profile error: ${profileResult.error}`,
                  lastError: profileResult.error,
                });
                return { success: false, error: profileResult.error };
              }

              const profile = profileResult.data;
              set({
                user: data.user,
                session: data.session,
                profile,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                lastError: null,
              });

              return { success: true };
            }

            const errorMessage = "No user data received";
            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: "auth",
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          } catch (error: any) {
            const errorMessage = error.message || "Sign in failed";
            console.error("❌ SignIn exception:", error);

            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: getErrorType(error),
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          }
        },

        signUpWithEmail: async (email: string, password: string) => {
          try {
            set({ isLoading: true, error: null });

            console.log("📧 Attempting email sign up...");
            const { data, error } = await AuthService.signUpWithEmail(
              email,
              password,
            );

            if (error) {
              const errorMessage = error || "Sign up failed";
              console.error("❌ SignUp error:", error);

              set({
                isLoading: false,
                error: errorMessage,
                lastError: {
                  message: errorMessage,
                  type: getErrorType({ message: error }),
                  timestamp: Date.now(),
                },
              });

              return { success: false, error: errorMessage };
            }

            if (data?.user) {
              console.log(
                "✅ Email sign up successful, awaiting email confirmation",
              );

              set({
                user: data.user,
                session: data.session,
                isLoading: false,
                error: null,
                lastError: null,
              });

              return { success: true, user: data.user };
            }

            const errorMessage = "No user data received";
            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: "auth",
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          } catch (error: any) {
            const errorMessage = error.message || "Sign up failed";
            console.error("❌ SignUp exception:", error);

            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: getErrorType(error),
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          }
        },

        signInWithGoogle: async () => {
          try {
            set({ isLoading: true, error: null });

            console.log("🔐 Attempting Google sign in...");
            const result = await AuthService.signInWithGoogle();

            if (result.error) {
              const errorMessage = result.error || "Google sign in failed";

              set({
                isLoading: false,
                error: errorMessage,
                lastError: {
                  message: errorMessage,
                  type: getErrorType({ message: errorMessage }),
                  timestamp: Date.now(),
                },
              });

              return { success: false, error: errorMessage };
            }

            // For Google OAuth, we need to get the current session after redirect
            console.log("✅ Google OAuth initiated, checking session...");
            const { session } = await AuthService.getCurrentSession();

            if (session?.user) {
              console.log("✅ Google sign in successful");

              // Load user profile
              const profileResult = await SupabaseService.getUserProfile(
                session.user.id,
              );

              if (!profileResult.data && !profileResult.error) {
                console.log(
                  "ℹ️ No profile found for Google user, attempting to create basic profile",
                );

                // Try to auto-create a basic profile for Google users
                const basicProfileData = {
                  id: session.user.id,
                  email: session.user.email || "",
                  phone: `temp_${session.user.id.slice(0, 8)}`, // Temporary unique phone
                  full_name:
                    session.user.user_metadata?.full_name ||
                    session.user.email?.split("@")[0] ||
                    "User",
                  user_type: "student" as const,
                  university: "KNUST", // Default university to satisfy NOT NULL constraint
                  is_verified: false,
                  is_active: true,
                  face_id_enabled: false,
                  rating: 0,
                  total_orders: 0,
                };

                console.log(
                  "🔄 Creating basic profile for Google user:",
                  basicProfileData,
                );
                const createResult =
                  await SupabaseService.createUserProfile(basicProfileData);

                if (createResult.error) {
                  console.log(
                    "❌ Failed to auto-create profile for Google user, needs manual setup",
                  );
                  set({
                    user: session.user,
                    session: session,
                    profile: null,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                    lastError: null,
                  });
                  return { success: true };
                }

                console.log(
                  "✅ Basic profile created successfully for Google user",
                );
                set({
                  user: session.user,
                  session: session,
                  profile: createResult.data,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                  lastError: null,
                });
                return { success: true };
              }

              if (profileResult.error) {
                console.error("Profile fetch error:", profileResult.error);
                set({
                  isLoading: false,
                  error: `Profile error: ${profileResult.error}`,
                  lastError: profileResult.error,
                });
                return { success: false, error: profileResult.error };
              }

              const profile = profileResult.data;
              set({
                user: session.user,
                session: session,
                profile,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                lastError: null,
              });

              return { success: true };
            }

            const errorMessage = "No user session found after Google sign in";
            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: "auth",
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          } catch (error: any) {
            const errorMessage = error.message || "Google sign in failed";
            console.error("❌ Google SignIn exception:", error);

            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: getErrorType(error),
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          }
        },

        signOut: async () => {
          try {
            set({ isLoading: true });

            await AuthService.signOut();

            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              lastError: null,
            });

            console.log("✅ Sign out successful");
          } catch (error: any) {
            console.error("❌ Sign out error:", error);
            // Even if sign out fails, clear local state
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              lastError: null,
            });
          }
        },

        // Phone OTP methods
        sendPhoneOTP: async (phone: string) => {
          try {
            set({ isLoading: true, error: null });

            // TODO: Implement actual phone OTP sending
            console.log("📱 Sending OTP to:", phone);

            // For now, return success to prevent crashes
            set({ isLoading: false });
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || "Failed to send OTP";
            console.error("❌ Send OTP error:", error);

            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: getErrorType(error),
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          }
        },

        verifyPhoneOTP: async (otp: string) => {
          try {
            set({ isLoading: true, error: null });

            // TODO: Implement actual OTP verification
            console.log("🔐 Verifying OTP:", otp);

            // For now, return success to prevent crashes
            set({ isLoading: false });
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || "Failed to verify OTP";
            console.error("❌ Verify OTP error:", error);

            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: getErrorType(error),
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          }
        },

        resendPhoneOTP: async (phone: string) => {
          try {
            set({ isLoading: true, error: null });

            // TODO: Implement actual OTP resending
            console.log("🔄 Resending OTP to:", phone);

            // For now, return success to prevent crashes
            set({ isLoading: false });
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || "Failed to resend OTP";
            console.error("❌ Resend OTP error:", error);

            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: getErrorType(error),
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          }
        },

        // Profile management
        createProfile: async (userData: RegisterData, signUpUser?: User) => {
          try {
            set({ isLoading: true, error: null });

            const currentUser = signUpUser || get().user;
            if (!currentUser) {
              throw new Error("No authenticated user found");
            }

            console.log("👤 Creating user profile...");

            // Convert RegisterData to database format
            const profileData = {
              id: currentUser.id,
              email: currentUser.email!,
              full_name: userData.full_name,
              user_type: userData.user_type,
              university: userData.university,
              hall_hostel: userData.hall_hostel,
              room_number: userData.room_number,
              phone: userData.phone,
              is_verified: false,
              is_active: true,
              face_id_enabled: false,
              rating: 0,
              total_orders: 0,
            };

            const { data: profile, error: profileError } =
              await SupabaseService.createUserProfile(profileData);

            if (profileError) {
              throw new Error(profileError);
            }

            set({
              profile,
              isLoading: false,
              error: null,
              lastError: null,
            });

            console.log("✅ Profile created successfully");
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || "Failed to create profile";
            console.error("❌ Create profile error:", error);

            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: getErrorType(error),
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          }
        },

        // Alias for createProfile for compatibility
        createUserProfile: async (
          userData: RegisterData,
          signUpUser?: User,
        ) => {
          return get().createProfile(userData, signUpUser);
        },

        updateProfile: async (updates: Partial<AppUser>) => {
          try {
            set({ isLoading: true, error: null });

            const currentUser = get().user;
            if (!currentUser) {
              throw new Error("No authenticated user found");
            }

            console.log("👤 Updating user profile...");
            const { data: updatedProfile, error: updateError } =
              await SupabaseService.updateUserProfile(currentUser.id, updates);

            if (updateError) {
              throw new Error(updateError);
            }

            set({
              profile: updatedProfile,
              isLoading: false,
              error: null,
              lastError: null,
            });

            console.log("✅ Profile updated successfully");
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || "Failed to update profile";
            console.error("❌ Update profile error:", error);

            set({
              isLoading: false,
              error: errorMessage,
              lastError: {
                message: errorMessage,
                type: getErrorType(error),
                timestamp: Date.now(),
              },
            });

            return { success: false, error: errorMessage };
          }
        },

        refreshProfile: async () => {
          try {
            const currentUser = get().user;
            if (!currentUser) return;

            console.log("🔄 Refreshing user profile...");
            const profileResult = await SupabaseService.getUserProfile(
              currentUser.id,
            );

            if (!profileResult.data && !profileResult.error) {
              console.log("ℹ️ No profile found during refresh");
              set({ profile: null });
              return;
            }

            if (profileResult.error) {
              console.error("Profile refresh error:", profileResult.error);
              return;
            }

            set({ profile: profileResult.data });
            console.log("✅ Profile refreshed");
          } catch (error) {
            console.error("❌ Refresh profile error:", error);
            // Don't set error for profile refresh failures
          }
        },

        // Biometric authentication
        enableBiometric: async () => {
          try {
            const currentUser = get().user;
            if (!currentUser) {
              return { success: false, error: "No authenticated user found" };
            }

            const result = await BiometricService.enableBiometric(
              currentUser.id,
            );

            if (result.success && get().profile) {
              // Update profile to reflect biometric enabled
              const currentProfile = get().profile!;
              set({
                profile: {
                  ...currentProfile,
                  face_id_enabled: true,
                },
              });
            }

            return result;
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Failed to enable biometric",
            };
          }
        },

        authenticateWithBiometric: async () => {
          try {
            return await BiometricService.authenticate(
              "Authenticate to continue",
            );
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Biometric authentication failed",
            };
          }
        },

        disableBiometric: async () => {
          try {
            const currentUser = get().user;
            if (!currentUser) {
              return { success: false, error: "No authenticated user found" };
            }

            const result = await BiometricService.disableBiometric(
              currentUser.id,
            );

            if (result.success && get().profile) {
              // Update profile to reflect biometric disabled
              const currentProfile = get().profile!;
              set({
                profile: {
                  ...currentProfile,
                  face_id_enabled: false,
                },
              });
            }

            return result;
          } catch (error: any) {
            return {
              success: false,
              error: error.message || "Failed to disable biometric",
            };
          }
        },

        isBiometricEnabled: async () => {
          try {
            const currentUser = get().user;
            if (!currentUser) return false;

            return await BiometricService.isBiometricEnabled(currentUser.id);
          } catch (error) {
            return false;
          }
        },

        // Utility functions
        clearError: () => {
          set({ error: null });
        },

        clearLastError: () => {
          set({ lastError: null });
        },

        checkAuthStatus: async () => {
          try {
            // console.log("🔍 checkAuthStatus CALLED - Current state:", {
            //   isAuthenticated: get().isAuthenticated,
            //   isInitialized: get().isInitialized,
            //   isLoading: get().isLoading,
            // });

            set({ isLoading: true });

            console.log("🔍 Checking auth status...");
            const { session } = await AuthService.getCurrentSession();

            if (session?.user) {
              console.log("✅ Found active session");

              // Load user profile
              const profileResult = await SupabaseService.getUserProfile(
                session.user.id,
              );

              if (!profileResult.data && !profileResult.error) {
                console.log(
                  "ℹ️ No profile found for existing session, attempting to create basic profile",
                );

                // Try to auto-create a basic profile for existing session
                const basicProfileData = {
                  id: session.user.id,
                  email: session.user.email || "",
                  phone: `temp_${session.user.id.slice(0, 8)}`, // Temporary unique phone
                  full_name:
                    session.user.user_metadata?.full_name ||
                    session.user.email?.split("@")[0] ||
                    "User",
                  user_type: "student" as const,
                  university: "KNUST", // Default university to satisfy NOT NULL constraint
                  is_verified: false,
                  is_active: true,
                  face_id_enabled: false,
                  rating: 0,
                  total_orders: 0,
                };

                console.log(
                  "🔄 Creating basic profile for existing session:",
                  basicProfileData,
                );
                const createResult =
                  await SupabaseService.createUserProfile(basicProfileData);

                if (createResult.error) {
                  console.log(
                    "❌ Failed to auto-create profile for existing session, needs manual setup",
                  );
                  set({
                    user: session.user,
                    session: session,
                    profile: null,
                    isAuthenticated: true,
                    isInitialized: true,
                    isLoading: false,
                    error: null,
                  });
                  return;
                }

                console.log(
                  "✅ Basic profile created successfully for existing session",
                );
                set({
                  user: session.user,
                  session: session,
                  profile: createResult.data,
                  isAuthenticated: true,
                  isInitialized: true,
                  isLoading: false,
                  error: null,
                });
                return;
              }

              const profile = profileResult.data;
              set({
                user: session.user,
                session: session,
                profile,
                isAuthenticated: true,
                isInitialized: true,
                isLoading: false,
                error: null,
              });
            } else {
              console.log("ℹ️ No active session found");
              set({
                user: null,
                profile: null,
                session: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
                error: null,
              });
            }

            // console.log("🔍 checkAuthStatus COMPLETE - New state:", {
            //   isAuthenticated: get().isAuthenticated,
            //   isInitialized: get().isInitialized,
            //   isLoading: get().isLoading,
            // });
          } catch (error: any) {
            console.error("❌ Auth status check failed:", error);
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
              error: null, // Don't show error for auth check failures
            });
          }
        },

        reset: () => {
          set({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isInitialized: false,
            error: null,
            lastError: null,
          });
        },
      }),
      {
        name: "DoorKet-auth",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          // Only persist essential data, not loading states or errors
          user: state.user,
          profile: state.profile,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
          isInitialized: state.isInitialized,
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle migration if needed
          if (version === 0) {
            // Migration logic for version 0 to 1
            return persistedState;
          }
          return persistedState;
        },
      },
    ),
  ),
);

// Auth service listener setup - using supabase directly since AuthService doesn't expose onAuthStateChange
import { supabase } from "../services/supabase";

// Debug option to disable auth state listener for testing
const DISABLE_AUTH_LISTENER = __DEV__ && false; // Set to true to disable listener for debugging

if (!DISABLE_AUTH_LISTENER) {
  supabase.auth.onAuthStateChange((event, session) => {
    const { checkAuthStatus, isAuthenticated, isLoading } =
      useAuthStore.getState();

    console.log("🔄 Auth state changed:", event, !!session);

    // Prevent any state changes during loading to avoid race conditions
    if (isLoading) {
      console.log("ℹ️ Auth event ignored - currently loading");
      return;
    }

    // Only sync auth state for meaningful changes, not failed login attempts
    if (event === "SIGNED_IN" && session?.user) {
      // User successfully signed in - sync the state
      console.log("✅ User signed in, syncing auth state");
      checkAuthStatus();
    } else if (event === "SIGNED_OUT" && isAuthenticated) {
      // User was authenticated and now signed out - sync the state
      console.log(
        "🔄 User signed out from authenticated state, syncing auth state",
      );
      checkAuthStatus();
    } else if (
      event === "TOKEN_REFRESHED" &&
      session?.user &&
      isAuthenticated
    ) {
      // Token refreshed for authenticated user - sync the state
      console.log("🔄 Token refreshed, syncing auth state");
      checkAuthStatus();
    } else {
      // Don't sync for failed login attempts or other spurious events
      console.log("ℹ️ Auth event ignored - no state sync needed", {
        event,
        hasSession: !!session,
        isAuthenticated,
      });
    }
  });
} else {
  console.log("🚫 Auth state listener DISABLED for debugging");
}

// Selectors for better performance
export const useAuth = () => useAuthStore();
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useLastError = () => useAuthStore((state) => state.lastError);
