import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { TextInput, HelperText } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | undefined;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  theme?: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    error: string;
  };
  disabled?: boolean;
  required?: boolean;
  animated?: boolean;
  placeholder?: string;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "number-pad";
  autoComplete?: any;
  textContentType?: any;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  value,
  onChangeText,
  error = "",
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  theme = {
    primary: "#667eea",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#1e293b",
    error: "#ef4444",
  },
  disabled = false,
  required = false,
  animated = true,
  placeholder,
  keyboardType = "default",
  autoComplete,
  textContentType,
  autoCapitalize = "sentences",
  secureTextEntry,
  multiline,
  numberOfLines,
  maxLength,
  editable = true,
}) => {
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const errorAnimation = useRef(new Animated.Value(0)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;

  // Convert undefined error to empty string for internal handling
  const errorText = error ?? "";
  const hasValidError = Boolean(errorText && errorText.trim() !== "");

  useEffect(() => {
    if (hasValidError) {
      Animated.spring(errorAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(errorAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [hasValidError, errorAnimation]);

  useEffect(() => {
    if (value && !hasValidError && animated) {
      Animated.spring(successAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(successAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [value, hasValidError, animated, successAnimation]);

  const handleFocus = () => {
    if (animated) {
      Animated.spring(focusAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handleBlur = () => {
    if (animated) {
      Animated.spring(focusAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const borderColor = hasValidError
    ? theme.error
    : value
      ? theme.primary
      : "#e2e8f0";

  const animatedContainerStyle = animated
    ? {
        transform: [
          {
            scale: focusAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.02],
            }),
          },
        ],
      }
    : {};

  const animatedBorderStyle = animated
    ? {
        borderColor: errorAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [borderColor, theme.error],
        }),
        transform: [
          {
            scale: errorAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.05],
            }),
          },
        ],
      }
    : { borderColor };

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.inputContainer, animatedContainerStyle]}>
        <Animated.View
          style={[
            styles.inputWrapper,
            animatedBorderStyle,
            error && styles.errorBorder,
          ]}
        >
          <TextInput
            label={required ? `${label} *` : label}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            mode="outlined"
            style={[styles.input, disabled && styles.disabled]}
            error={hasValidError}
            disabled={disabled}
            editable={editable}
            left={
              leftIcon ? (
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={leftIcon}
                    size={20}
                    color={hasValidError ? theme.error : theme.primary}
                  />
                </View>
              ) : undefined
            }
            right={
              rightIcon ? (
                <TouchableOpacity
                  style={styles.iconContainer}
                  onPress={onRightIconPress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={rightIcon}
                    size={20}
                    color={hasValidError ? theme.error : theme.primary}
                  />
                </TouchableOpacity>
              ) : value && !hasValidError && animated ? (
                <Animated.View
                  style={[
                    styles.successIcon,
                    {
                      opacity: successAnimation,
                      transform: [
                        {
                          scale: successAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#00b894" />
                </Animated.View>
              ) : undefined
            }
            theme={{
              colors: {
                primary: theme.primary,
                background: theme.background,
                surface: theme.surface,
                onSurface: theme.text,
                error: theme.error,
              },
            }}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoComplete={autoComplete}
            textContentType={textContentType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
          />
        </Animated.View>
      </Animated.View>

      {/* Helper Text */}
      {(hasValidError || helperText) && (
        <View style={styles.helperContainer}>
          {hasValidError ? (
            <Animated.View
              style={[
                styles.errorContainer,
                {
                  opacity: errorAnimation,
                  transform: [
                    {
                      translateY: errorAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={14}
                color={theme.error}
                style={styles.errorIcon}
              />
              <HelperText
                type="error"
                visible={hasValidError}
                style={styles.errorText}
              >
                {errorText}
              </HelperText>
            </Animated.View>
          ) : (
            <HelperText
              type="info"
              visible={!!helperText}
              style={styles.helperText}
            >
              {helperText}
            </HelperText>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  inputContainer: {
    position: "relative",
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: "transparent",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  errorBorder: {
    borderWidth: 2,
    borderColor: "#ef4444",
  },

  successIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10,
  },
  helperContainer: {
    marginTop: 4,
    marginLeft: 12,
    minHeight: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
  },
  helperText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "400",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
});

export default AnimatedInput;
