import { Platform, ViewStyle, TextStyle } from 'react-native';
import { Theme } from './colors';

// Enhanced shadow presets for different elevations
export const createShadows = (theme: Theme) => ({
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  xs: {
    shadowColor: theme.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,

  sm: {
    shadowColor: theme.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  md: {
    shadowColor: theme.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  lg: {
    shadowColor: theme.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,

  xl: {
    shadowColor: theme.shadow.dark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  } as ViewStyle,

  xxl: {
    shadowColor: theme.shadow.heavy,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 16,
  } as ViewStyle,

  // Special shadows for specific use cases
  card: {
    shadowColor: theme.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,

  button: {
    shadowColor: theme.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  modal: {
    shadowColor: theme.shadow.heavy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 16,
  } as ViewStyle,

  fab: {
    shadowColor: theme.shadow.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle,
});

// Border radius system
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999,
} as const;

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
  xxxxxxl: 64,
} as const;

// Typography system
export const createTypography = (theme: Theme) => ({
  // Display text styles
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as const,
    color: theme.text.primary,
    letterSpacing: -0.5,
  } as TextStyle,

  // Heading styles
  h1: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700' as const,
    color: theme.text.primary,
    letterSpacing: -0.25,
  } as TextStyle,

  h2: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as const,
    color: theme.text.primary,
    letterSpacing: -0.25,
  } as TextStyle,

  h3: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    color: theme.text.primary,
    letterSpacing: 0,
  } as TextStyle,

  h4: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    color: theme.text.primary,
    letterSpacing: 0,
  } as TextStyle,

  h5: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    color: theme.text.primary,
    letterSpacing: 0,
  } as TextStyle,

  h6: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    color: theme.text.primary,
    letterSpacing: 0,
  } as TextStyle,

  // Body text styles
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400' as const,
    color: theme.text.primary,
    letterSpacing: 0,
  } as TextStyle,

  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    color: theme.text.primary,
    letterSpacing: 0,
  } as TextStyle,

  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    color: theme.text.secondary,
    letterSpacing: 0,
  } as TextStyle,

  // Label styles
  labelLarge: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500' as const,
    color: theme.text.primary,
    letterSpacing: 0.1,
  } as TextStyle,

  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500' as const,
    color: theme.text.primary,
    letterSpacing: 0.1,
  } as TextStyle,

  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    color: theme.text.secondary,
    letterSpacing: 0.1,
  } as TextStyle,

  // Caption styles
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    color: theme.text.tertiary,
    letterSpacing: 0.1,
  } as TextStyle,

  captionSmall: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
    color: theme.text.tertiary,
    letterSpacing: 0.1,
  } as TextStyle,

  // Button text styles
  buttonLarge: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  } as TextStyle,

  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  } as TextStyle,

  buttonSmall: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  } as TextStyle,

  // Special text styles
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    color: theme.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  } as TextStyle,

  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    color: theme.text.link,
    textDecorationLine: 'underline' as const,
  } as TextStyle,
});

// Animation configurations
export const animations = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },

  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },

  // Spring configurations
  spring: {
    gentle: {
      damping: 15,
      stiffness: 100,
      mass: 0.8,
    },
    normal: {
      damping: 12,
      stiffness: 120,
      mass: 1,
    },
    bouncy: {
      damping: 8,
      stiffness: 150,
      mass: 1.2,
    },
  },
} as const;

// Layout utilities
export const layout = {
  // Flex utilities
  flex: {
    center: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    centerHorizontal: {
      alignItems: 'center' as const,
    },
    centerVertical: {
      justifyContent: 'center' as const,
    },
    spaceBetween: {
      justifyContent: 'space-between' as const,
    },
    spaceAround: {
      justifyContent: 'space-around' as const,
    },
    spaceEvenly: {
      justifyContent: 'space-evenly' as const,
    },
    flexStart: {
      justifyContent: 'flex-start' as const,
      alignItems: 'flex-start' as const,
    },
    flexEnd: {
      justifyContent: 'flex-end' as const,
      alignItems: 'flex-end' as const,
    },
  },

  // Position utilities
  position: {
    absolute: {
      position: 'absolute' as const,
    },
    relative: {
      position: 'relative' as const,
    },
    absoluteFill: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  },

  // Size utilities
  size: {
    full: {
      width: '100%',
      height: '100%',
    },
    fullWidth: {
      width: '100%',
    },
    fullHeight: {
      height: '100%',
    },
  },
} as const;

// Component-specific styling utilities
export const createComponentStyles = (theme: Theme) => {
  const shadows = createShadows(theme);
  const typography = createTypography(theme);

  return {
    // Card styles
    card: {
      default: {
        backgroundColor: theme.surface.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.card,
      } as ViewStyle,

      elevated: {
        backgroundColor: theme.surface.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
      } as ViewStyle,

      outlined: {
        backgroundColor: theme.surface.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: theme.border.primary,
      } as ViewStyle,
    },

    // Button styles
    button: {
      primary: {
        backgroundColor: theme.primary.main,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        ...shadows.button,
      } as ViewStyle,

      secondary: {
        backgroundColor: theme.secondary.main,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        ...shadows.button,
      } as ViewStyle,

      outlined: {
        backgroundColor: 'transparent',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderWidth: 2,
        borderColor: theme.primary.main,
      } as ViewStyle,

      text: {
        backgroundColor: 'transparent',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      } as ViewStyle,
    },

    // Input styles
    input: {
      default: {
        backgroundColor: theme.surface.secondary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderWidth: 1,
        borderColor: theme.border.primary,
        ...typography.body,
      } as ViewStyle,

      focused: {
        borderColor: theme.border.focus,
        borderWidth: 2,
        ...shadows.sm,
      } as ViewStyle,

      error: {
        borderColor: theme.border.error,
        borderWidth: 2,
      } as ViewStyle,
    },

    // Modal styles
    modal: {
      backdrop: {
        ...layout.position.absoluteFill,
        backgroundColor: theme.background.overlay,
        ...layout.flex.center,
      } as ViewStyle,

      container: {
        backgroundColor: theme.surface.primary,
        borderRadius: borderRadius.xl,
        margin: spacing.lg,
        maxWidth: '90%',
        ...shadows.modal,
      } as ViewStyle,
    },

    // Navigation styles
    header: {
      default: {
        backgroundColor: theme.surface.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.border.secondary,
        ...shadows.sm,
      } as ViewStyle,

      transparent: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
        ...shadows.none,
      } as ViewStyle,
    },

    tabBar: {
      default: {
        backgroundColor: theme.surface.primary,
        borderTopWidth: 1,
        borderTopColor: theme.border.secondary,
        ...shadows.lg,
      } as ViewStyle,
    },
  };
};

// Utility functions
export const createUtilities = (theme: Theme) => ({
  // Get color with opacity
  withOpacity: (color: string, opacity: number) => {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Handle rgba colors
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/g, `${opacity})`);
    }

    // Handle rgb colors
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }

    return color;
  },

  // Platform-specific styles
  platformSelect: <T>(styles: { ios?: T; android?: T; default: T }): T => {
    if (Platform.OS === 'ios' && styles.ios) return styles.ios;
    if (Platform.OS === 'android' && styles.android) return styles.android;
    return styles.default;
  },

  // Responsive helpers
  isSmallDevice: (width: number) => width < 375,
  isMediumDevice: (width: number) => width >= 375 && width < 414,
  isLargeDevice: (width: number) => width >= 414,

  // Safe area helpers
  getSafeAreaInsets: () => ({
    top: Platform.OS === 'ios' ? 44 : 24,
    bottom: Platform.OS === 'ios' ? 34 : 0,
  }),
});

// Export everything
export type ShadowPreset = keyof ReturnType<typeof createShadows>;
export type TypographyVariant = keyof ReturnType<typeof createTypography>;
export type SpacingValue = keyof typeof spacing;
export type BorderRadiusValue = keyof typeof borderRadius;

export {
  borderRadius as BorderRadius,
  spacing as Spacing,
  animations as Animations,
  layout as Layout,
};
