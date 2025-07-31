import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "../screens/screens/splash/SplashScreen";
import WelcomeScreen from "../screens/screens/auth/WelcomeScreen";
import LoginScreen from "../screens/screens/auth/LoginScreen";
import RegisterScreen from "../screens/screens/auth/RegisterScreen";
import UserTypeSelectionScreen from "../screens/screens/auth/UserTypeSelectionScreen";
import EmailVerificationScreen from "../screens/screens/auth/EmailVerificationScreen";
// import ProfileSetupScreen from "../screens/auth/ProfileSetupScreen"; // Commented out - phone auth disabled

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#ffffff" },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{
          gestureEnabled: false, // Prevent going back from splash
        }}
      />

      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          gestureEnabled: false, // Prevent going back from welcome
        }}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "Sign In",
        }}
      />

      {/* PhoneVerification screen commented out - phone auth disabled
      <Stack.Screen
        name="PhoneVerification"
        component={PhoneVerificationScreen}
        options={{
          title: "Verify Phone",
          gestureEnabled: false, // Prevent going back during OTP verification
        }}
      />
      */}

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: "Create Account",
        }}
      />

      <Stack.Screen
        name="UserTypeSelection"
        component={UserTypeSelectionScreen}
        options={{
          title: "Choose Account Type",
          gestureEnabled: false, // Must complete selection
        }}
      />

      {/* ProfileSetup screen commented out - phone auth disabled
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{
          title: "Complete Your Profile",
          gestureEnabled: false, // Must complete profile
        }}
      />
      */}
      
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={{
          title: "Verify Email",
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="BiometricSetup"
        component={BiometricSetupScreen}
        options={{
          title: "Secure Your Account",
          gestureEnabled: false, // Must complete or skip biometric setup
        }}
      />

      <Stack.Screen
        name="GoogleLogin"
        component={GoogleLoginScreen}
        options={{
          title: "Google Sign In",
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
