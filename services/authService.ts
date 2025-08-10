import supabase from "./supabase";
import * as Linking from "expo-linking";
// Auth Helper Functions
export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("SignUp error:", error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("SignUp error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("SignIn error:", error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("SignIn error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: Linking.createURL("/auth/callback"),
        },
      });

      if (error) {
        console.error("Google SignIn error:", error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("Google SignIn error:", error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("SignOut error:", error);
        return { error: error.message };
      }
      return { error: null };
    } catch (error: any) {
      console.error("SignOut error:", error);
      return { error: error.message };
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Get session error:", error);
        return { session: null, error: error.message };
      }
      return { session, error: null };
    } catch (error: any) {
      console.error("Get session error:", error);
      return { session: null, error: error.message };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Get user error:", error);
        return { user: null, error: error.message };
      }
      return { user, error: null };
    } catch (error: any) {
      console.error("Get user error:", error);
      return { user: null, error: error.message };
    }
  }
}