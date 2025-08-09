import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";

import { AuthStackParamList } from "../../../types";
import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";

type SplashScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Splash"
>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

const { width, height } = Dimensions.get("window");

// Responsive sizing
const isSmallDevice = width < 375;
const logoSize = isSmallDevice ? 70 : 80;
const appNameSize = isSmallDevice ? 46 : 52;
const logoCircleSize = isSmallDevice ? 140 : 160;

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Floating elements
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start splash animation sequence
    const splashSequence = Animated.sequence([
      // Phase 1: Background fade in
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      // Phase 2: Circle scale and logo entrance
      Animated.parallel([
        Animated.spring(circleScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),

      // Phase 3: Logo rotation
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // Phase 4: Text entrance
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // Phase 5: Hold for a moment
      Animated.delay(800),
    ]);

    // Floating animations
    const floatingAnimations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(float1, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(float1, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(float2, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(float2, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(float3, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(float3, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ];

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    // Start all animations
    splashSequence.start(() => {
      // Navigate to Welcome screen after splash completes
      setTimeout(() => {
        navigation.replace("Welcome");
      }, 800);
    });

    floatingAnimations.forEach((anim) => anim.start());
    pulseAnimation.start();

    // Cleanup
    return () => {
      splashSequence.stop();
      floatingAnimations.forEach((anim) => anim.stop());
      pulseAnimation.stop();
    };
  }, [navigation]);

  // Interpolations
  const logoRotate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const float1Y = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const float2Y = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const float3Y = float3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Animated Background */}
      <Animated.View
        style={[styles.backgroundContainer, { opacity: backgroundOpacity }]}
      >
        <LinearGradient
          colors={[
            ColorPalette.primary[700],
            ColorPalette.primary[600],
            ColorPalette.secondary[500],
            ColorPalette.accent[500],
          ]}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            { transform: [{ translateY: float1Y }, { scale: 0.8 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            { transform: [{ translateY: float2Y }, { scale: 1.2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            { transform: [{ translateY: float3Y }, { scale: 0.6 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element4,
            { transform: [{ translateY: float1Y }, { scale: 1.0 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element5,
            { transform: [{ translateY: float2Y }, { scale: 0.9 }] },
          ]}
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate: logoRotate }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logoCircle,
              {
                transform: [{ scale: circleScale }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                ColorPalette.pure.white,
                "rgba(255, 255, 255, 0.95)",
                "rgba(255, 255, 255, 0.9)",
              ]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.View
                style={[styles.logoIcon, { transform: [{ scale: pulseAnim }] }]}
              >
                <Ionicons
                  name="basket"
                  size={logoSize}
                  color={ColorPalette.primary[600]}
                />
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* App Name and Tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textSlide }],
            },
          ]}
        >
          <Text style={styles.appName}>ChopCart</Text>
          <View style={styles.taglineContainer}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>Your Campus Shopping Made Easy</Text>
            <View style={styles.taglineLine} />
          </View>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[styles.loadingContainer, { opacity: textOpacity }]}
        >
          <Text style={styles.loadingText}>
            Loading your shopping experience...
          </Text>
          <View style={styles.loadingDots}>
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [1, 1.3],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [1.1, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [1, 1.3],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.primary[600],
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  floatingElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.full,
  },
  element1: {
    width: 60,
    height: 60,
    top: height * 0.15,
    left: width * 0.1,
  },
  element2: {
    width: 40,
    height: 40,
    top: height * 0.25,
    right: width * 0.15,
  },
  element3: {
    width: 80,
    height: 80,
    top: height * 0.7,
    left: width * 0.05,
  },
  element4: {
    width: 50,
    height: 50,
    bottom: height * 0.2,
    right: width * 0.1,
  },
  element5: {
    width: 35,
    height: 35,
    top: height * 0.4,
    left: width * 0.8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.xxxxl,
  },
  logoCircle: {
    width: logoCircleSize,
    height: logoCircleSize,
    borderRadius: logoCircleSize / 2,
    elevation: 20,
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  logoGradient: {
    width: logoCircleSize,
    height: logoCircleSize,
    borderRadius: logoCircleSize / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  logoIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: spacing.xxxxl,
  },
  appName: {
    fontSize: appNameSize,
    fontWeight: "900",
    color: ColorPalette.pure.white,
    textAlign: "center",
    marginBottom: spacing.lg,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 4 },
    textShadowRadius: 10,
    letterSpacing: -1.5,
  },
  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  taglineLine: {
    width: 30,
    height: 2,
    backgroundColor: ColorPalette.accent[400],
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  version: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    fontWeight: "500",
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: "absolute",
    bottom: spacing.xxxxxxl,
    alignSelf: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  loadingDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ColorPalette.pure.white,
    opacity: 0.8,
  },
});

export default SplashScreen;
