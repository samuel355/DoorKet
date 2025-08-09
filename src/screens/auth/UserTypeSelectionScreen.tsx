import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, Text, RadioButton } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";

import { AuthStackParamList, UserType } from "../../../types";
import { ColorPalette, LightTheme } from "../../theme/colors";
import { spacing, borderRadius, createShadows } from "../../theme/styling";

type UserTypeSelectionScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "UserTypeSelection"
>;

interface UserTypeSelectionScreenProps {
  navigation: UserTypeSelectionScreenNavigationProp;
}

const { width, height } = Dimensions.get("window");
const shadows = createShadows(LightTheme);

const UserTypeSelectionScreen: React.FC<UserTypeSelectionScreenProps> = ({
  navigation,
}) => {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
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

    // Pulse animation for interactive elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
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
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Animate button when selection changes
  useEffect(() => {
    if (selectedType) {
      // Show indicator first
      Animated.timing(indicatorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Delay the button animation slightly for better UX
      setTimeout(() => {
        Animated.spring(buttonSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, 200);
    } else {
      Animated.parallel([
        Animated.timing(indicatorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(buttonSlideAnim, {
          toValue: 100,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedType]);

  const userTypes = [
    {
      type: "student" as UserType,
      title: "Student",
      description: "Order items and get them delivered to your hostel",
      icon: "school",
      gradient: [
        ColorPalette.primary[600],
        ColorPalette.primary[500],
        ColorPalette.info[500],
      ] as const,
      lightColor: ColorPalette.primary[100],
      features: [
        "Browse and order from various categories",
        "Custom item requests with budget",
        "Real-time order tracking",
        "Multiple payment options",
        "Rate and review runners",
      ],
    },
    {
      type: "runner" as UserType,
      title: "Runner",
      description: "Earn money by shopping and delivering for students",
      icon: "bicycle",
      gradient: [
        ColorPalette.secondary[600],
        ColorPalette.secondary[500],
        ColorPalette.accent[500],
      ] as const,
      lightColor: ColorPalette.secondary[100],
      features: [
        "Accept orders from students",
        "Flexible working hours",
        "Earn money for each delivery",
        "Build your reputation with ratings",
        "Track your earnings and performance",
      ],
    },
  ];

  const handleContinue = () => {
    if (!selectedType) return;

    // Haptic feedback
    Vibration.vibrate(50);

    navigation.navigate("Register", {
      userType: selectedType,
    });
  };

  const handleSignIn = () => {
    navigation.navigate("Login");
  };

  const floatY1 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const floatY2 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const renderUserTypeCard = (userType: (typeof userTypes)[0]) => {
    const isSelected = selectedType === userType.type;

    return (
      <Animated.View
        key={userType.type}
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale: isSelected ? pulseAnim : scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setSelectedType(userType.type);
            // Haptic feedback on selection
            Vibration.vibrate(30);
          }}
          style={[styles.typeCard, isSelected && styles.selectedCard]}
        >
          {/* Card Background Gradient */}
          <LinearGradient
            colors={
              isSelected
                ? userType.gradient
                : [ColorPalette.pure.white, ColorPalette.pure.white]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Selection Indicator */}
            {isSelected && (
              <View style={styles.selectionIndicator}>
                <LinearGradient
                  colors={[ColorPalette.pure.white, "rgba(255, 255, 255, 0.9)"]}
                  style={styles.selectionGradient}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={userType.gradient[0]}
                  />
                </LinearGradient>
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.radioContainer}>
                  <RadioButton
                    value={userType.type}
                    status={isSelected ? "checked" : "unchecked"}
                    onPress={() => setSelectedType(userType.type)}
                    color={
                      isSelected
                        ? ColorPalette.pure.white
                        : userType.gradient[0]
                    }
                  />
                </View>

                <View style={styles.iconSection}>
                  <LinearGradient
                    colors={
                      isSelected
                        ? [
                            "rgba(255, 255, 255, 0.3)",
                            "rgba(255, 255, 255, 0.1)",
                          ]
                        : [userType.lightColor, `${userType.gradient[0]}20`]
                    }
                    style={styles.iconContainer}
                  >
                    <Ionicons
                      name={userType.icon as any}
                      size={36}
                      color={
                        isSelected
                          ? ColorPalette.pure.white
                          : userType.gradient[0]
                      }
                    />
                  </LinearGradient>

                  <View style={styles.typeInfo}>
                    <Text
                      style={[
                        styles.typeTitle,
                        {
                          color: isSelected
                            ? ColorPalette.pure.white
                            : userType.gradient[0],
                        },
                      ]}
                    >
                      {userType.title}
                    </Text>
                    <Text
                      style={[
                        styles.typeDescription,
                        {
                          color: isSelected
                            ? "rgba(255, 255, 255, 0.9)"
                            : ColorPalette.neutral[600],
                        },
                      ]}
                    >
                      {userType.description}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.featuresContainer}>
                <Text
                  style={[
                    styles.featuresTitle,
                    {
                      color: isSelected
                        ? "rgba(255, 255, 255, 0.9)"
                        : ColorPalette.neutral[700],
                    },
                  ]}
                >
                  What you can do:
                </Text>
                {userType.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={
                        isSelected
                          ? "rgba(255, 255, 255, 0.8)"
                          : userType.gradient[0]
                      }
                      style={styles.featureIcon}
                    />
                    <Text
                      style={[
                        styles.featureText,
                        {
                          color: isSelected
                            ? "rgba(255, 255, 255, 0.8)"
                            : ColorPalette.neutral[600],
                        },
                      ]}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background */}
      <LinearGradient
        colors={[
          ColorPalette.neutral[50],
          ColorPalette.pure.white,
          ColorPalette.primary[50],
        ]}
        style={styles.backgroundGradient}
      />

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            { transform: [{ translateY: floatY1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            { transform: [{ translateY: floatY2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            { transform: [{ translateY: floatY1 }] },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[
                  ColorPalette.primary[600],
                  ColorPalette.primary[500],
                  ColorPalette.secondary[500],
                ]}
                style={styles.logoCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name="basket"
                  size={36}
                  color={ColorPalette.pure.white}
                />
              </LinearGradient>
              <Text style={styles.title}>Choose Your Role</Text>
              <Text style={styles.subtitle}>
                How would you like to use DoorKet?
              </Text>
            </View>
          </View>

          {/* User Type Cards */}
          <View style={styles.typesContainer}>
            {userTypes.map(renderUserTypeCard)}
          </View>

          {/* University Badge */}
          <View style={styles.universityBadge}>
            <LinearGradient
              colors={[ColorPalette.pure.white, ColorPalette.neutral[50]]}
              style={styles.universityGradient}
            >
              <Ionicons
                name="school-outline"
                size={16}
                color={ColorPalette.primary[600]}
              />
              <Text style={styles.universityText}>
                Currently available for KNUST students
              </Text>
            </LinearGradient>
          </View>

          {/* Continue Button - Static placeholder for layout */}
          <View style={[styles.buttonContainer, { opacity: 0.3 }]}>
            <View style={styles.continueButtonContainer}>
              <View style={styles.continueButton}>
                <Text style={styles.continueButtonText}>
                  Select a role to continue
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.footerLink} onPress={handleSignIn}>
                Sign In
              </Text>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Button Indicator */}
      <Animated.View
        style={[
          styles.buttonIndicator,
          {
            opacity: indicatorAnim,
            transform: [
              {
                scale: indicatorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.indicatorDot} />
        <Text style={styles.indicatorText}>Continue button below</Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={ColorPalette.neutral[600]}
        />
      </Animated.View>

      {/* Sticky Continue Button */}
      <Animated.View
        style={[
          styles.stickyButtonContainer,
          {
            paddingBottom: spacing.xl + insets.bottom,
            transform: [{ translateY: buttonSlideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedType}
          style={styles.stickyButton}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={
              selectedType === "student"
                ? userTypes[0].gradient
                : selectedType === "runner"
                  ? userTypes[1].gradient
                  : [ColorPalette.neutral[400], ColorPalette.neutral[300]]
            }
            style={styles.stickyButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.stickyButtonContent}>
              <View style={styles.selectedTypeInfo}>
                <Ionicons
                  name={selectedType === "student" ? "school" : "bicycle"}
                  size={20}
                  color={ColorPalette.pure.white}
                />
                <Text style={styles.selectedTypeText}>
                  {selectedType === "student" ? "Student" : "Runner"}
                </Text>
              </View>
              <View style={styles.continueAction}>
                <Text style={styles.stickyButtonText}>Continue</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={ColorPalette.pure.white}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.pure.white,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    backgroundColor: "rgba(124, 115, 240, 0.08)",
    borderRadius: borderRadius.full,
  },
  element1: {
    width: 80,
    height: 80,
    top: height * 0.15,
    left: width * 0.1,
  },
  element2: {
    width: 60,
    height: 60,
    top: height * 0.25,
    right: width * 0.15,
  },
  element3: {
    width: 100,
    height: 100,
    bottom: height * 0.2,
    right: width * 0.05,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxxl,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxxxl,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: ColorPalette.neutral[900],
    marginBottom: spacing.sm,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "500",
  },
  typesContainer: {
    marginBottom: spacing.xxxxl,
    gap: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  typeCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.lg,
  },
  selectedCard: {
    ...shadows.xl,
  },
  cardGradient: {
    flex: 1,
    position: "relative",
  },
  selectionIndicator: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  selectionGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  radioContainer: {
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  iconSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
    ...shadows.sm,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  typeDescription: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  featuresContainer: {
    paddingLeft: spacing.xxxxl,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  featureIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
    fontWeight: "400",
  },
  universityBadge: {
    alignSelf: "center",
    marginBottom: spacing.xxxxl,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  universityGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  universityText: {
    fontSize: 14,
    color: ColorPalette.primary[700],
    marginLeft: spacing.sm,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  buttonContainer: {
    marginBottom: spacing.xl,
  },
  continueButtonContainer: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.lg,
  },
  disabledButton: {
    opacity: 0.5,
    ...shadows.sm,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    fontWeight: "500",
  },
  footerLink: {
    color: ColorPalette.primary[600],
    fontWeight: "700",
  },
  buttonIndicator: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ColorPalette.pure.white,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    ...shadows.md,
    gap: spacing.xs,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ColorPalette.accent[500],
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: "600",
    color: ColorPalette.neutral[600],
  },
  stickyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ColorPalette.pure.white,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    ...shadows.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    // Add a subtle border top for better definition
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[100],
  },
  stickyButton: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  stickyButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  stickyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  selectedTypeText: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.pure.white,
  },
  continueAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stickyButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.pure.white,
  },
});

export default UserTypeSelectionScreen;
