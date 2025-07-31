import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  type?: 'text' | 'email' | 'phone' | 'password' | 'number' | 'multiline';
  showClearButton?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperText?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  autoCorrect?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export interface InputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

const Input = forwardRef<InputRef, InputProps>(({
  label,
  placeholder,
  value = '',
  onChangeText,
  error,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  size = 'medium',
  type = 'text',
  showClearButton = false,
  loading = false,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  helperText,
  maxLength,
  showCharacterCount = false,
  autoCorrect = true,
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureEntry, setIsSecureEntry] = useState(type === 'password');
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => onChangeText?.(''),
    isFocused: () => isFocused,
  }));

  // Input configuration based on type
  const getInputConfig = () => {
    const config: Partial<TextInputProps> = {
      autoCorrect,
      autoCapitalize,
    };

    switch (type) {
      case 'email':
        config.keyboardType = 'email-address';
        config.autoCapitalize = 'none';
        config.autoCorrect = false;
        break;
      case 'phone':
        config.keyboardType = 'phone-pad';
        config.autoCapitalize = 'none';
        config.autoCorrect = false;
        break;
      case 'password':
        config.secureTextEntry = isSecureEntry;
        config.autoCapitalize = 'none';
        config.autoCorrect = false;
        break;
      case 'number':
        config.keyboardType = 'numeric';
        config.autoCorrect = false;
        break;
      case 'multiline':
        config.multiline = true;
        config.numberOfLines = numberOfLines || 4;
        config.textAlignVertical = 'top';
        break;
    }

    return config;
  };

  // Container styles
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: SPACING.SM,
    };

    return baseStyle;
  };

  // Input container styles
  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: type === 'multiline' ? 'flex-start' : 'center',
      borderRadius: BORDER_RADIUS.LG,
      backgroundColor: disabled ? COLORS.GRAY_100 : COLORS.WHITE,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = SPACING.SM;
        baseStyle.paddingVertical = SPACING.SM;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingHorizontal = SPACING.LG;
        baseStyle.paddingVertical = SPACING.LG;
        baseStyle.minHeight = 56;
        break;
      default: // medium
        baseStyle.paddingHorizontal = SPACING.MD;
        baseStyle.paddingVertical = SPACING.MD;
        baseStyle.minHeight = 48;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'outlined':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = error
          ? COLORS.ERROR
          : isFocused
            ? COLORS.PRIMARY
            : COLORS.BORDER;
        break;
      case 'filled':
        baseStyle.backgroundColor = disabled
          ? COLORS.GRAY_100
          : COLORS.GRAY_50;
        baseStyle.borderWidth = 0;
        break;
      default: // default
        baseStyle.borderBottomWidth = 1;
        baseStyle.borderBottomColor = error
          ? COLORS.ERROR
          : isFocused
            ? COLORS.PRIMARY
            : COLORS.BORDER;
        baseStyle.backgroundColor = COLORS.TRANSPARENT;
        break;
    }

    // Error state
    if (error) {
      baseStyle.borderColor = COLORS.ERROR;
    }

    return baseStyle;
  };

  // Text input styles
  const getTextInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontFamily: FONTS.FAMILY.REGULAR,
      color: disabled ? COLORS.TEXT_DISABLED : COLORS.TEXT_PRIMARY,
      includeFontPadding: false,
      textAlignVertical: type === 'multiline' ? 'top' : 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = FONTS.SIZE.SM;
        break;
      case 'large':
        baseStyle.fontSize = FONTS.SIZE.XL;
        break;
      default: // medium
        baseStyle.fontSize = FONTS.SIZE.LG;
        break;
    }

    // Platform specific adjustments
    if (Platform.OS === 'android') {
      baseStyle.paddingVertical = 0;
    }

    return baseStyle;
  };

  // Label styles
  const getLabelStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: FONTS.SIZE.MD,
      fontFamily: FONTS.FAMILY.MEDIUM,
      color: COLORS.TEXT_PRIMARY,
      marginBottom: SPACING.XS,
    };

    if (error) {
      baseStyle.color = COLORS.ERROR;
    }

    return baseStyle;
  };

  // Icon size based on input size
  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  // Handle focus
  const handleFocus = (e: any) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  // Handle blur
  const handleBlur = (e: any) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  // Handle clear button press
  const handleClearPress = () => {
    onChangeText?.('');
    inputRef.current?.focus();
  };

  // Handle password visibility toggle
  const handlePasswordToggle = () => {
    setIsSecureEntry(!isSecureEntry);
  };

  // Render left icon
  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    return (
      <Ionicons
        name={leftIcon as any}
        size={getIconSize()}
        color={error ? COLORS.ERROR : isFocused ? COLORS.PRIMARY : COLORS.GRAY_500}
        style={styles.leftIcon}
      />
    );
  };

  // Render right icon/buttons
  const renderRightContent = () => {
    const iconSize = getIconSize();
    const iconColor = error ? COLORS.ERROR : isFocused ? COLORS.PRIMARY : COLORS.GRAY_500;

    return (
      <View style={styles.rightContent}>
        {/* Clear button */}
        {showClearButton && value.length > 0 && !disabled && (
          <TouchableOpacity
            onPress={handleClearPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={iconSize}
              color={COLORS.GRAY_400}
            />
          </TouchableOpacity>
        )}

        {/* Password visibility toggle */}
        {type === 'password' && (
          <TouchableOpacity
            onPress={handlePasswordToggle}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSecureEntry ? 'eye-off' : 'eye'}
              size={iconSize}
              color={iconColor}
            />
          </TouchableOpacity>
        )}

        {/* Custom right icon */}
        {rightIcon && type !== 'password' && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.iconButton}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon as any}
              size={iconSize}
              color={iconColor}
            />
          </TouchableOpacity>
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.iconButton}>
            <Ionicons
              name="hourglass"
              size={iconSize}
              color={iconColor}
            />
          </View>
        )}
      </View>
    );
  };

  // Render label
  const renderLabel = () => {
    if (!label) return null;

    return (
      <Text style={[getLabelStyle(), labelStyle]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
    );
  };

  // Render error message
  const renderError = () => {
    if (!error) return null;

    return (
      <Text style={[styles.errorText, errorStyle]}>
        {error}
      </Text>
    );
  };

  // Render helper text
  const renderHelperText = () => {
    if (!helperText || error) return null;

    return (
      <Text style={styles.helperText}>
        {helperText}
      </Text>
    );
  };

  // Render character count
  const renderCharacterCount = () => {
    if (!showCharacterCount || !maxLength) return null;

    const count = value.length;
    const isOverLimit = count > maxLength;

    return (
      <Text style={[
        styles.characterCount,
        isOverLimit && styles.characterCountError
      ]}>
        {count}/{maxLength}
      </Text>
    );
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {renderLabel()}

      <View style={getInputContainerStyle()}>
        {renderLeftIcon()}

        <TextInput
          ref={inputRef}
          style={[getTextInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT_HINT}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled && !loading}
          selectTextOnFocus={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          {...getInputConfig()}
          {...props}
        />

        {renderRightContent()}
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.bottomLeft}>
          {renderError()}
          {renderHelperText()}
        </View>
        <View style={styles.bottomRight}>
          {renderCharacterCount()}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  leftIcon: {
    marginRight: SPACING.SM,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: SPACING.XS,
    padding: SPACING.XS,
  },
  required: {
    color: COLORS.ERROR,
    fontSize: FONTS.SIZE.MD,
  },
  errorText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  helperText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  characterCount: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  characterCountError: {
    color: COLORS.ERROR,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomLeft: {
    flex: 1,
  },
  bottomRight: {
    marginLeft: SPACING.SM,
  },
});

Input.displayName = 'Input';

export default Input;
