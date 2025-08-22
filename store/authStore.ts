// src/store/authStore.ts
import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Session } from "@supabase/supabase-js";
import { User as AppUser, RegisterData, BiometricAuthResult } from "../types";
import BiometricService from "../services/auth/biometric";
import NotificationService from "@/services/notificationService"; // ✅ NEW
import { supabase } from "../services/supabase";
import { AuthService } from "@/services/authService";
import { ProfileService } from "@/services/profileService";

// ---------- Notifications helpers (module scope) ----------
let notifUnsub: (() => void) | null = null;

async function startNotificationsFor(userId: string) {
  try {
    await NotificationService.init(); // idempotent
    await NotificationService.registerDevice(userId); // saves Expo push token
    if (notifUnsub) {
      try {
        notifUnsub();
      } catch {}
    }
    notifUnsub = NotificationService.subscribeToUserNotifications(
      userId,
      () => {
        // Optional: bump a badge or toast in-app
      },
    );
  } catch (e) {
    console.warn("⚠️ startNotificationsFor failed:", e);
  }
}

function stopNotifications() {
  try {
    if (notifUnsub) {
      notifUnsub();
      notifUnsub = null;
    }
    NotificationService.unsubscribeAll();
  } catch (e) {
    console.warn("⚠️ stopNotifications failed:", e);
  }
}

// ---------- Auth types ----------
interface AuthState {
  user: User | null;
  profile: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  justLoggedOut: boolean;
  error: string | null;
  lastError: {
    message: string;
    type: "auth" | "network" | "validation" | "system";
    timestamp: number;
  } | null;

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

  sendPhoneOTP: (
    phone: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOTP: (
    otp: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resendPhoneOTP: (
    phone: string,
  ) => Promise<{ success: boolean; error?: string }>;

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

  enableBiometric: () => Promise<BiometricAuthResult>;
  authenticateWithBiometric: () => Promise<BiometricAuthResult>;
  disableBiometric: () => Promise<{ success: boolean; error?: string }>;
  isBiometricEnabled: () => Promise<boolean>;

  clearError: () => void;
  clearLastError: () => void;
  clearJustLoggedOut: () => void;
  checkAuthStatus: () => Promise<void>;
  reset: () => void;
}

// ---------- Error typing helper ----------
const getErrorType = (
  error: any,
): "auth" | "network" | "validation" | "system" => {
  const message = error?.message?.toLowerCase() || "";
  if (
    message.includes("invalid login") ||
    message.includes("authentication") ||
    message.includes("unauthorized")
  )
    return "auth";
  if (
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("timeout")
  )
    return "network";
  if (
    message.includes("validation") ||
    message.includes("required") ||
    message.includes("invalid")
  )
    return "validation";
  return "system";
};

// ---------- Store ----------
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isInitialized: false,
        justLoggedOut: false,
        error: null,
        lastError: null,

        // -------- Email/Password --------
        signInWithEmail: async (email, password) => {
          try {
            set({ isLoading: true, error: null });
            const { data, error } = await AuthService.signInWithEmail(
              email,
              password,
            );
            if (error) {
              const msg = error || "Sign in failed";
              set({
                isLoading: false,
                error: msg,
                lastError: {
                  message: msg,
                  type: getErrorType({ message: error }),
                  timestamp: Date.now(),
                },
              });
              return { success: false, error: msg };
            }

            if (data?.user && data?.session) {
              const profileResult = await ProfileService.getUserProfile(
                data.user.id,
              );

              // Auto-create basic profile if missing
              if (!profileResult.data && !profileResult.error) {
                const basicProfileData = {
                  id: data.user.id,
                  email: data.user.email || "",
                  phone: `temp_${data.user.id.slice(0, 8)}`,
                  full_name:
                    data.user.user_metadata?.full_name ||
                    data.user.email?.split("@")[0] ||
                    "User",
                  user_type: "admin" as const,
                  university: "KNUST",
                  is_verified: false,
                  is_active: true,
                  face_id_enabled: false,
                  rating: 0,
                  total_orders: 0,
                };
                const createResult =
                  await ProfileService.createUserProfile(basicProfileData);

                if (createResult.error) {
                  set({
                    user: data.user,
                    session: data.session,
                    profile: null,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                    lastError: null,
                  });
                  await startNotificationsFor(data.user.id); // ✅ start notifications even if profile is pending
                  return { success: true };
                }

                set({
                  user: data.user,
                  session: data.session,
                  profile: createResult.data,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                  lastError: null,
                });
                await startNotificationsFor(data.user.id); // ✅
                return { success: true };
              }

              if (profileResult.error) {
                const msg = profileResult.error;
                set({
                  isLoading: false,
                  error: `Profile error: ${msg}`,
                  lastError: {
                    message: msg,
                    type: getErrorType({ message: msg }),
                    timestamp: Date.now(),
                  },
                });
                return { success: false, error: msg };
              }

              set({
                user: data.user,
                session: data.session,
                profile: profileResult.data,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                lastError: null,
              });
              await startNotificationsFor(data.user.id); // ✅
              return { success: true };
            }

            const msg = "No user data received";
            set({
              isLoading: false,
              error: msg,
              lastError: { message: msg, type: "auth", timestamp: Date.now() },
            });
            return { success: false, error: msg };
          } catch (err: any) {
            const msg = err.message || "Sign in failed";
            set({
              isLoading: false,
              error: msg,
              lastError: {
                message: msg,
                type: getErrorType(err),
                timestamp: Date.now(),
              },
            });
            return { success: false, error: msg };
          }
        },

        // -------- Sign Up --------
        signUpWithEmail: async (email, password) => {
          try {
            set({ isLoading: true, error: null });
            const { data, error } = await AuthService.signUpWithEmail(
              email,
              password,
            );
            if (error) {
              const msg = error || "Sign up failed";
              set({
                isLoading: false,
                error: msg,
                lastError: {
                  message: msg,
                  type: getErrorType({ message: error }),
                  timestamp: Date.now(),
                },
              });
              return { success: false, error: msg };
            }
            if (data?.user) {
              set({
                user: data.user,
                session: data.session,
                isLoading: false,
                error: null,
                lastError: null,
              });
              return { success: true, user: data.user };
            }
            const msg = "No user data received";
            set({
              isLoading: false,
              error: msg,
              lastError: { message: msg, type: "auth", timestamp: Date.now() },
            });
            return { success: false, error: msg };
          } catch (err: any) {
            const msg = err.message || "Sign up failed";
            set({
              isLoading: false,
              error: msg,
              lastError: {
                message: msg,
                type: getErrorType(err),
                timestamp: Date.now(),
              },
            });
            return { success: false, error: msg };
          }
        },

        // -------- Google --------
        signInWithGoogle: async () => {
          try {
            set({ isLoading: true, error: null });
            const result = await AuthService.signInWithGoogle();
            if (result.error) {
              const msg = result.error || "Google sign in failed";
              set({
                isLoading: false,
                error: msg,
                lastError: {
                  message: msg,
                  type: getErrorType({ message: msg }),
                  timestamp: Date.now(),
                },
              });
              return { success: false, error: msg };
            }

            const { session } = await AuthService.getCurrentSession();
            if (session?.user) {
              const profileResult = await ProfileService.getUserProfile(
                session.user.id,
              );

              if (!profileResult.data && !profileResult.error) {
                const basicProfileData = {
                  id: session.user.id,
                  email: session.user.email || "",
                  phone: `temp_${session.user.id.slice(0, 8)}`,
                  full_name:
                    session.user.user_metadata?.full_name ||
                    session.user.email?.split("@")[0] ||
                    "User",
                  user_type: "student" as const,
                  university: "KNUST",
                  is_verified: false,
                  is_active: true,
                  face_id_enabled: false,
                  rating: 0,
                  total_orders: 0,
                };
                const createResult =
                  await ProfileService.createUserProfile(basicProfileData);

                if (createResult.error) {
                  set({
                    user: session.user,
                    session,
                    profile: null,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                    lastError: null,
                  });
                  await startNotificationsFor(session.user.id); // ✅
                  return { success: true };
                }

                set({
                  user: session.user,
                  session,
                  profile: createResult.data,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                  lastError: null,
                });
                await startNotificationsFor(session.user.id); // ✅
                return { success: true };
              }

              if (profileResult.error) {
                const msg = profileResult.error;
                set({
                  isLoading: false,
                  error: `Profile error: ${msg}`,
                  lastError: {
                    message: msg,
                    type: getErrorType({ message: msg }),
                    timestamp: Date.now(),
                  },
                });
                return { success: false, error: msg };
              }

              set({
                user: session.user,
                session,
                profile: profileResult.data,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                lastError: null,
              });
              await startNotificationsFor(session.user.id); // ✅
              return { success: true };
            }

            const msg = "No user session found after Google sign in";
            set({
              isLoading: false,
              error: msg,
              lastError: { message: msg, type: "auth", timestamp: Date.now() },
            });
            return { success: false, error: msg };
          } catch (err: any) {
            const msg = err.message || "Google sign in failed";
            set({
              isLoading: false,
              error: msg,
              lastError: {
                message: msg,
                type: getErrorType(err),
                timestamp: Date.now(),
              },
            });
            return { success: false, error: msg };
          }
        },

        // -------- Sign Out --------
        signOut: async () => {
          try {
            set({ isLoading: true });
            await AuthService.signOut();
            stopNotifications(); // ✅ tear down

            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              justLoggedOut: true,
              error: null,
              lastError: null,
            });
          } catch (err: any) {
            console.error("❌ Sign out error:", err);
            stopNotifications(); // ensure teardown even on error
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              justLoggedOut: true,
              error: null,
              lastError: null,
            });
          }
        },

        // -------- Phone OTP (stubs) --------
        sendPhoneOTP: async (phone: string) => {
          try {
            set({ isLoading: true, error: null });
            set({ isLoading: false });
            return { success: true };
          } catch (err: any) {
            const msg = err.message || "Failed to send OTP";
            set({
              isLoading: false,
              error: msg,
              lastError: {
                message: msg,
                type: getErrorType(err),
                timestamp: Date.now(),
              },
            });
            return { success: false, error: msg };
          }
        },

        verifyPhoneOTP: async (otp: string) => {
          try {
            set({ isLoading: true, error: null });
            set({ isLoading: false });
            return { success: true };
          } catch (err: any) {
            const msg = err.message || "Failed to verify OTP";
            set({
              isLoading: false,
              error: msg,
              lastError: {
                message: msg,
                type: getErrorType(err),
                timestamp: Date.now(),
              },
            });
            return { success: false, error: msg };
          }
        },

        resendPhoneOTP: async (phone: string) => {
          try {
            set({ isLoading: true, error: null });
            set({ isLoading: false });
            return { success: true };
          } catch (err: any) {
            const msg = err.message || "Failed to resend OTP";
            set({
              isLoading: false,
              error: msg,
              lastError: {
                message: msg,
                type: getErrorType(err),
                timestamp: Date.now(),
              },
            });
            return { success: false, error: msg };
          }
        },

        // -------- Profile --------
        createProfile: async (userData, signUpUser) => {
          try {
            set({ isLoading: true, error: null });
            const currentUser = signUpUser || get().user;
            if (!currentUser) throw new Error("No authenticated user found");

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
              await ProfileService.createUserProfile(profileData);
            if (profileError) throw new Error(profileError);

            set({ profile, isLoading: false, error: null, lastError: null });
            // In case user reached here without prior start:
            await startNotificationsFor(currentUser.id); // ✅ safe & idempotent
            return { success: true };
          } catch (err: any) {
            const msg = err.message || "Failed to create profile";
            set({
              isLoading: false,
              error: msg,
              lastError: {
                message: msg,
                type: getErrorType(err),
                timestamp: Date.now(),
              },
            });
            return { success: false, error: msg };
          }
        },

        createUserProfile: async (userData, signUpUser) => {
          return get().createProfile(userData, signUpUser);
        },

        updateProfile: async (updates) => {
          try {
            set({ isLoading: true, error: null });
            const currentUser = get().user;
            if (!currentUser) throw new Error("No authenticated user found");

            const { data: updatedProfile, error: updateError } =
              await ProfileService.updateUserProfile(currentUser.id, updates);
            if (updateError) throw new Error(updateError);

            set({
              profile: updatedProfile,
              isLoading: false,
              error: null,
              lastError: null,
            });
            return { success: true };
          } catch (err: any) {
            const msg = err.message || "Failed to update profile";
            set({
              isLoading: false,
              error: msg,
              lastError: {
                message: msg,
                type: getErrorType(err),
                timestamp: Date.now(),
              },
            });
            return { success: false, error: msg };
          }
        },

        refreshProfile: async () => {
          try {
            const currentUser = get().user;
            if (!currentUser) return;

            const profileResult = await ProfileService.getUserProfile(
              currentUser.id,
            );
            if (!profileResult.data && !profileResult.error) {
              set({ profile: null });
              return;
            }
            if (profileResult.error) {
              console.error("Profile refresh error:", profileResult.error);
              return;
            }

            set({ profile: profileResult.data });
          } catch (err) {
            console.error("❌ Refresh profile error:", err);
          }
        },

        // -------- Biometric --------
        enableBiometric: async () => {
          try {
            const currentUser = get().user;
            if (!currentUser)
              return { success: false, error: "No authenticated user found" };
            const result = await BiometricService.enableBiometric(
              currentUser.id,
            );
            if (result.success && get().profile) {
              const currentProfile = get().profile!;
              set({ profile: { ...currentProfile, face_id_enabled: true } });
            }
            return result;
          } catch (err: any) {
            return {
              success: false,
              error: err.message || "Failed to enable biometric",
            };
          }
        },

        authenticateWithBiometric: async () => {
          try {
            return await BiometricService.authenticate(
              "Authenticate to continue",
            );
          } catch (err: any) {
            return {
              success: false,
              error: err.message || "Biometric authentication failed",
            };
          }
        },

        disableBiometric: async () => {
          try {
            const currentUser = get().user;
            if (!currentUser)
              return { success: false, error: "No authenticated user found" };
            const result = await BiometricService.disableBiometric(
              currentUser.id,
            );
            if (result.success && get().profile) {
              const currentProfile = get().profile!;
              set({ profile: { ...currentProfile, face_id_enabled: false } });
            }
            return result;
          } catch (err: any) {
            return {
              success: false,
              error: err.message || "Failed to disable biometric",
            };
          }
        },

        isBiometricEnabled: async () => {
          try {
            const currentUser = get().user;
            if (!currentUser) return false;
            return await BiometricService.isBiometricEnabled(currentUser.id);
          } catch {
            return false;
          }
        },

        // -------- Utils --------
        clearError: () => set({ error: null }),
        clearLastError: () => set({ lastError: null }),
        clearJustLoggedOut: () => set({ justLoggedOut: false }),

        checkAuthStatus: async () => {
          try {
            set({ isLoading: true });
            const { session } = await AuthService.getCurrentSession();

            if (session?.user) {
              const profileResult = await ProfileService.getUserProfile(
                session.user.id,
              );

              if (!profileResult.data && !profileResult.error) {
                const basicProfileData = {
                  id: session.user.id,
                  email: session.user.email || "",
                  phone: `temp_${session.user.id.slice(0, 8)}`,
                  full_name:
                    session.user.user_metadata?.full_name ||
                    session.user.email?.split("@")[0] ||
                    "User",
                  user_type: "student" as const,
                  university: "KNUST",
                  is_verified: false,
                  is_active: true,
                  face_id_enabled: false,
                  rating: 0,
                  total_orders: 0,
                };
                const createResult =
                  await ProfileService.createUserProfile(basicProfileData);

                if (createResult.error) {
                  set({
                    user: session.user,
                    session,
                    profile: null,
                    isAuthenticated: true,
                    isInitialized: true,
                    isLoading: false,
                    error: null,
                  });
                  await startNotificationsFor(session.user.id); // ✅
                  return;
                }

                set({
                  user: session.user,
                  session,
                  profile: createResult.data,
                  isAuthenticated: true,
                  isInitialized: true,
                  isLoading: false,
                  error: null,
                });
                await startNotificationsFor(session.user.id); // ✅
                return;
              }

              set({
                user: session.user,
                session,
                profile: profileResult.data,
                isAuthenticated: true,
                isInitialized: true,
                isLoading: false,
                error: null,
              });
              await startNotificationsFor(session.user.id); // ✅
            } else {
              set({
                user: null,
                profile: null,
                session: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
                error: null,
              });
              stopNotifications(); // ✅
            }
          } catch (err: any) {
            console.error("❌ Auth status check failed:", err);
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
              error: null,
            });
            stopNotifications(); // ✅
          }
        },

        reset: () => {
          stopNotifications(); // ✅ ensure teardown
          set({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isInitialized: false,
            justLoggedOut: false,
            error: null,
            lastError: null,
          });
        },
      }),
      {
        name: "DoorKet-auth",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          user: state.user,
          profile: state.profile,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
          isInitialized: state.isInitialized,
        }),
        version: 1,
        migrate: (persistedState: any) => persistedState,
      },
    ),
  ),
);

// ---------- Auth state listener ----------
const DISABLE_AUTH_LISTENER = __DEV__ && false;

if (!DISABLE_AUTH_LISTENER) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    const { checkAuthStatus, isAuthenticated, isLoading } =
      useAuthStore.getState();
    console.log("🔄 Auth state changed:", event, !!session);

    if (isLoading) return;

    if (event === "SIGNED_IN" && session?.user) {
      // Start notifications early; checkAuthStatus will also sync state
      await startNotificationsFor(session.user.id);
      await checkAuthStatus();
    } else if (event === "SIGNED_OUT") {
      stopNotifications();
      await checkAuthStatus();
    } else if (
      event === "TOKEN_REFRESHED" &&
      session?.user &&
      isAuthenticated
    ) {
      // Token may rotate → re-register device
      await startNotificationsFor(session.user.id);
      await checkAuthStatus();
    } else {
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

// ---------- Selectors ----------
export const useAuth = () => useAuthStore();
export const useUser = () => useAuthStore((s) => s.user);
export const useProfile = () => useAuthStore((s) => s.profile);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useLastError = () => useAuthStore((s) => s.lastError);
