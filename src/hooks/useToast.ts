import { useState, useCallback } from "react";

export interface ToastConfig {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const initialState: ToastState = {
  visible: false,
  message: "",
  type: "info",
  duration: 3000,
};

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>(initialState);

  const showToast = useCallback((config: ToastConfig) => {
    setToast({
      visible: true,
      message: config.message,
      type: config.type || "info",
      duration: config.duration || 3000,
      action: config.action,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Convenience methods
  const showSuccess = useCallback(
    (message: string, duration?: number, action?: { label: string; onPress: () => void }) => {
      showToast({ message, type: "success", duration, action });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number, action?: { label: string; onPress: () => void }) => {
      showToast({ message, type: "error", duration, action });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number, action?: { label: string; onPress: () => void }) => {
      showToast({ message, type: "info", duration, action });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number, action?: { label: string; onPress: () => void }) => {
      showToast({ message, type: "warning", duration, action });
    },
    [showToast]
  );

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};

export default useToast;
