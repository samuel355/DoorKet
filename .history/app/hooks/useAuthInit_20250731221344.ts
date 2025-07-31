import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

/**
 * Hook to initialize authentication state when the app starts
 */
export const useAuthInit = () => {
  const { checkAuthStatus, isInitialized, isLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log("🚀 Initializing auth state...");
        await checkAuthStatus();

        if (isMounted) {
          console.log("✅ Auth initialization complete");
        }
      } catch (error) {
        console.error("❌ Auth initialization failed:", error);
        // Don't crash the app, just log the error
        // The auth store will handle setting the appropriate state
      }
    };

    // Only initialize if not already initialized
    if (!isInitialized && !isLoading) {
      initializeAuth();
    }

    return () => {
      isMounted = false;
    };
  }, [checkAuthStatus, isInitialized, isLoading]);

  return {
    isInitialized,
    isLoading,
  };
};
