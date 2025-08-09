import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Easing,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants';

export interface LoadingProps {
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  fullScreen?: boolean;
  visible?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
  overlayColor?: string;
  testID?: string;
}

const Loading: React.FC<LoadingProps> = ({
  type = 'spinner',
  size = 'medium',
  color = COLORS.PRIMARY,
  text,
  overlay = false,
  fullScreen = false,
  visible = true,
  style,
  textStyle,
  backgroundColor = COLORS.WHITE,
  overlayColor = COLORS.OVERLAY,
  testID,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const dotsAnim = React.useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  React.useEffect(() => {
    if (type === 'pulse') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }

    if (type === 'dots') {
      const createDotAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.delay(600),
          ])
        );
      };

      const animations = dotsAnim.map((dot, index) =>
        createDotAnimation(dot, index * 200)
      );

      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    }
  }, [type, pulseAnim, dotsAnim]);

  if (!visible) return null;

  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 20, height: 20, fontSize: FONTS.SIZE.SM };
      case 'large':
        return { width: 40, height: 40, fontSize: FONTS.SIZE.XL };
      default: // medium
        return { width: 30, height: 30, fontSize: FONTS.SIZE.LG };
    }
  };

  const sizeConfig = getSize();

  const renderSpinner = () => (
    <ActivityIndicator
      size={size === 'small' ? 'small' : 'large'}
      color={color}
      testID={`${testID}-spinner`}
    />
  );

  const renderDots = () => {
    const dotSize = size === 'small' ? 6 : size === 'large' ? 12 : 8;
    const dotSpacing = size === 'small' ? 4 : size === 'large' ? 8 : 6;

    return (
      <View style={[styles.dotsContainer, { gap: dotSpacing }]} testID={`${testID}-dots`}>
        {dotsAnim.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                backgroundColor: color,
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.5],
                    }),
                  },
                ],
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderPulse = () => {
    const pulseSize = sizeConfig.width;

    return (
      <View style={styles.pulseContainer} testID={`${testID}-pulse`}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              width: pulseSize,
              height: pulseSize,
              borderRadius: pulseSize / 2,
              backgroundColor: color,
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.3],
                  }),
                },
              ],
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.3],
              }),
            },
          ]}
        />
        <View
          style={[
            styles.pulseCore,
            {
              width: pulseSize * 0.6,
              height: pulseSize * 0.6,
              borderRadius: (pulseSize * 0.6) / 2,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  };

  const renderSkeleton = () => {
    const skeletonHeight = size === 'small' ? 60 : size === 'large' ? 120 : 80;

    return (
      <View style={[styles.skeletonContainer, { height: skeletonHeight }]} testID={`${testID}-skeleton`}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonSubtitle]} />
        <View style={[styles.skeletonLine, styles.skeletonText]} />
      </View>
    );
  };

  const renderLoadingIndicator = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const renderText = () => {
    if (!text || type === 'skeleton') return null;

    return (
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeConfig.fontSize,
            color: overlay ? COLORS.WHITE : COLORS.TEXT_PRIMARY,
          },
          textStyle,
        ]}
        testID={`${testID}-text`}
      >
        {text}
      </Text>
    );
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (overlay || fullScreen) {
      baseStyle.position = 'absolute';
      baseStyle.top = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
      baseStyle.bottom = 0;
      baseStyle.backgroundColor = overlayColor;
      baseStyle.zIndex = 1000;
    }

    if (fullScreen) {
      baseStyle.flex = 1;
    }

    return baseStyle;
  };

  const getContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (overlay) {
      baseStyle.backgroundColor = backgroundColor;
      baseStyle.borderRadius = BORDER_RADIUS.LG;
      baseStyle.padding = SPACING.LG;
      baseStyle.minWidth = 100;
      baseStyle.elevation = 8;
      baseStyle.shadowColor = COLORS.BLACK;
      baseStyle.shadowOffset = { width: 0, height: 4 };
      baseStyle.shadowOpacity = 0.3;
      baseStyle.shadowRadius = 8;
    }

    return baseStyle;
  };

  return (
    <View style={[getContainerStyle(), style]} testID={testID}>
      <View style={getContentStyle()}>
        {renderLoadingIndicator()}
        {renderText()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: FONTS.FAMILY.MEDIUM,
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
  },
  pulseCore: {
    position: 'absolute',
  },
  skeletonContainer: {
    width: '100%',
    padding: SPACING.MD,
  },
  skeletonLine: {
    backgroundColor: COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.SM,
  },
  skeletonTitle: {
    height: 20,
    width: '60%',
  },
  skeletonSubtitle: {
    height: 16,
    width: '80%',
  },
  skeletonText: {
    height: 14,
    width: '40%',
  },
});

export default Loading;
