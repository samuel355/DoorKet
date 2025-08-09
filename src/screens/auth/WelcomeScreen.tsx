import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import GradientButton from "../../components/ui/GradientButton";
import { ColorPalette, LightTheme } from "../../theme/colors";
import { borderRadius, createShadows, spacing } from "../../theme/styling";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AuthStackParamList } from "@/types";

const { width, height } = Dimensions.get("window");
const shadows = createShadows(LightTheme);

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
    ).start();

    // Pulse animation for buttons
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Floating animation for background elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Use Expo Router navigation with relative paths (no leading slash)
  const handleGetStarted = () => {
    navigation.navigate("Login");
  };

  const handleCreateAccount = () => {
    navigation.navigate("UserTypeSelection");
  };

  const logoRotate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const floatingTranslateY = floatingAnim.interpolate({
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

      {/* Background Gradient */}
      <LinearGradient
        colors={[
          ColorPalette.primary[600],
          ColorPalette.primary[500],
          ColorPalette.secondary[500],
          ColorPalette.accent[500],
        ]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Background Elements */}
      <View style={styles.backgroundElements}>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            { transform: [{ translateY: floatingTranslateY }, { scale: 1.2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            {
              transform: [
                { translateY: floatingTranslateY },
                { rotate: "45deg" },
                { scale: 0.8 },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            { transform: [{ translateY: floatingTranslateY }, { scale: 1.1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element4,
            {
              transform: [
                { translateY: floatingTranslateY },
                { rotate: "-30deg" },
                { scale: 0.9 },
              ],
            },
          ]}
        />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ rotate: logoRotate }, { scale: scaleAnim }] },
              ]}
            >
              <LinearGradient
                colors={[ColorPalette.pure.white, "rgba(255,255,255,0.9)"]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name="basket"
                  size={68}
                  color={ColorPalette.primary[600]}
                />
              </LinearGradient>
            </Animated.View>

            <Animated.View
              style={[styles.textContainer, { opacity: fadeAnim }]}
            >
              <Text style={styles.appName}>DoorKet</Text>
              <Text style={styles.tagline}>Your campus shopping made easy</Text>
              <View style={styles.taglineUnderline} />
            </Animated.View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Why Choose DoorKet?</Text>

            <View style={styles.featuresGrid}>
              {/* Feature 1 */}
              <Animated.View style={[styles.featureCard, styles.featureCard1]}>
                <LinearGradient
                  colors={[ColorPalette.pure.white, "rgba(255,255,255,0.95)"]}
                  style={[
                    styles.featureGradient,
                    { transform: [{ rotate: "-0.3deg" }] },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: ColorPalette.primary[100] },
                    ]}
                  >
                    <Ionicons
                      name="storefront"
                      size={32}
                      color={ColorPalette.primary[600]}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Wide Selection</Text>
                  <Text style={styles.featureDescription}>
                    From snacks to essentials, find everything you need
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Feature 2 */}
              <Animated.View style={[styles.featureCard, styles.featureCard2]}>
                <LinearGradient
                  colors={[ColorPalette.pure.white, "rgba(255,255,255,0.95)"]}
                  style={[
                    styles.featureGradient,
                    { transform: [{ rotate: "0.3deg" }] },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: ColorPalette.secondary[100] },
                    ]}
                  >
                    <Ionicons
                      name="bicycle"
                      size={32}
                      color={ColorPalette.secondary[600]}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Fast Delivery</Text>
                  <Text style={styles.featureDescription}>
                    Get your orders delivered to your hostel quickly
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Feature 3 */}
              <Animated.View style={[styles.featureCard, styles.featureCard3]}>
                <LinearGradient
                  colors={[ColorPalette.pure.white, "rgba(255,255,255,0.95)"]}
                  style={[
                    styles.featureGradient,
                    { transform: [{ rotate: "0.3deg" }] },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: ColorPalette.accent[100] },
                    ]}
                  >
                    <Ionicons
                      name="card"
                      size={32}
                      color={ColorPalette.accent[600]}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Secure Payment</Text>
                  <Text style={styles.featureDescription}>
                    Multiple payment options including Mobile Money
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Feature 4 */}
              <Animated.View style={[styles.featureCard, styles.featureCard4]}>
                <LinearGradient
                  colors={[ColorPalette.pure.white, "rgba(255,255,255,0.95)"]}
                  style={[
                    styles.featureGradient,
                    { transform: [{ rotate: "-0.3deg" }] },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View
                    style={[
                      styles.featureIcon,
                      { backgroundColor: ColorPalette.info[100] },
                    ]}
                  >
                    <Ionicons
                      name="notifications"
                      size={32}
                      color={ColorPalette.info[600]}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Real-time Updates</Text>
                  <Text style={styles.featureDescription}>
                    Track your orders with live notifications
                  </Text>
                </LinearGradient>
              </Animated.View>
            </View>
          </View>

          {/* University Badge */}
          <View style={styles.universityBadge}>
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.universityGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name="school"
                size={18}
                color={ColorPalette.pure.white}
              />
              <Text style={styles.universityText}>
                Starting with KNUST Campus
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <Animated.View
          style={[styles.actionSection, { transform: [{ scale: pulseAnim }] }]}
        >
          <GradientButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            fullWidth
            style={styles.primaryButton}
            gradient={[ColorPalette.pure.white, "rgba(255,255,255,0.9)"]}
            textStyle={styles.primaryButtonText}
            icon="arrow-forward"
          />

          <GradientButton
            title="Create Account"
            onPress={handleCreateAccount}
            variant="secondary"
            size="large"
            fullWidth
            gradient={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
            textStyle={styles.secondaryButtonText}
            icon="person-add"
          />

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              Sign In
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.primary[600],
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  floatingElement: {
    position: "absolute",
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  element1: {
    width: 100,
    height: 100,
    top: height * 0.1,
    left: -50,
  },
  element2: {
    width: 150,
    height: 150,
    top: height * 0.3,
    right: -75,
  },
  element3: {
    width: 80,
    height: 80,
    bottom: height * 0.2,
    left: width * 0.1,
  },
  element4: {
    width: 120,
    height: 120,
    bottom: height * 0.4,
    right: -60,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "android" ? spacing.xxxxl : spacing.lg,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: spacing.xxxxl,
    paddingTop: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.xl,
  },
  textContainer: {
    alignItems: "center",
    position: "relative",
  },
  appName: {
    fontSize: 48,
    fontWeight: "800",
    color: ColorPalette.pure.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.5,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  taglineUnderline: {
    width: 60,
    height: 3,
    backgroundColor: ColorPalette.accent[400],
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    opacity: 0.8,
  },
  featuresSection: {
    marginBottom: spacing.xxxxl,
  },
  featuresTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: ColorPalette.pure.white,
    textAlign: "center",
    marginBottom: spacing.xxxl,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 0.5,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  featureCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    backgroundColor: ColorPalette.pure.white,
    ...shadows.lg,
  },
  featureCard1: {},
  featureCard2: {},
  featureCard3: {},
  featureCard4: {},
  featureGradient: {
    padding: spacing.lg,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
    width: "100%",
    borderRadius: borderRadius.xl,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ColorPalette.neutral[800],
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  featureDescription: {
    fontSize: 13,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 18,
  },
  universityBadge: {
    alignSelf: "center",
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  universityGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  universityText: {
    fontSize: 14,
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
    fontWeight: "600",
    opacity: 0.9,
  },
  actionSection: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
    paddingHorizontal: spacing.xl,
    marginHorizontal: -spacing.xl,
    ...shadows.lg,
  },
  primaryButton: {
    ...shadows.lg,
  },
  primaryButtonText: {
    color: ColorPalette.primary[600],
    fontWeight: "700",
    fontSize: 18,
  },
  secondaryButton: {},
  secondaryButtonText: {
    color: ColorPalette.pure.white,
    fontWeight: "600",
    fontSize: 16,
  },
  loginSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  loginText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  loginLink: {
    fontSize: 14,
    color: ColorPalette.pure.white,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default WelcomeScreen;
