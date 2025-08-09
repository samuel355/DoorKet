import { useState, useEffect, useCallback, useRef } from "react";
import { Keyboard, AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// DoorKet Custom Hooks Export
export { default as useCart, type UseCartReturn } from "./useCart";

// Common hook patterns

// =============================================================================
// LOADING STATE HOOK
// =============================================================================
export const useLoading = (initialState: boolean = false) => {
  const [loading, setLoading] = useState(initialState);

  const withLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { loading, setLoading, withLoading };
};

// =============================================================================
// ASYNC OPERATION HOOK
// =============================================================================
interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useAsync = <T>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = [],
) => {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
    } catch (error: any) {
      setState({ data: null, loading: false, error: error.message });
    }
  }, [asyncFn, ...dependencies]);

  useEffect(() => {
    execute();
  }, [execute]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return { ...state, retry, execute };
};

// =============================================================================
// BOOLEAN TOGGLE HOOK
// =============================================================================
export const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return { value, toggle, setTrue, setFalse, setValue };
};

// =============================================================================
// PREVIOUS VALUE HOOK
// =============================================================================
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

// =============================================================================
// MOUNTED STATE HOOK
// =============================================================================
export const useIsMounted = () => {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
};

// =============================================================================
// TIMEOUT HOOK
// =============================================================================
export const useTimeout = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const timeoutId = setTimeout(() => {
      savedCallback.current();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay]);
};

// =============================================================================
// INTERVAL HOOK
// =============================================================================
export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const intervalId = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(intervalId);
  }, [delay]);
};

// =============================================================================
// LOCAL STORAGE HOOK
// =============================================================================
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const getValue = useCallback(async () => {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        setStoredValue(parsedItem);
        return parsedItem;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const setValue = useCallback(
    async (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  const removeValue = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  useEffect(() => {
    getValue();
  }, [getValue]);

  return { storedValue, setValue, removeValue, getValue };
};

// =============================================================================
// KEYBOARD VISIBILITY HOOK
// =============================================================================
export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  return isKeyboardVisible;
};

// =============================================================================
// APP STATE HOOK
// =============================================================================
export const useAppStateChange = (
  callback: (state: AppStateStatus) => void,
) => {
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      callback(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, [callback]);
};

// =============================================================================
// NETWORK STATE HOOK
// =============================================================================
export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    type: "unknown",
  });

  useEffect(() => {
    // NetInfo not available, return default state
    setNetworkState({
      isConnected: true,
      type: "unknown",
    });
  }, []);

  return networkState;
};

// =============================================================================
// FORCE UPDATE HOOK
// =============================================================================
export const useForceUpdate = () => {
  const [, setTick] = useState(0);

  const update = useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);

  return update;
};

// =============================================================================
// FIRST MOUNT HOOK
// =============================================================================
export const useIsFirstMount = () => {
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }

  return false;
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================
export default {
  useLoading,
  useAsync,
  useToggle,
  usePrevious,
  useIsMounted,
  useTimeout,
  useInterval,
  useLocalStorage,
  useKeyboardVisible,
  useAppStateChange,
  useNetworkState,
  useForceUpdate,
  useIsFirstMount,
};
