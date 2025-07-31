import { AuthStackParamList } from "@/types";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import BiometricSetupScreen from "../../screens/auth/BiometricSetupScreen";
import EmailVerificationScreen from "../../screens/auth/EmailVerificationScreen";
import GoogleLoginScreen from "../../screens/auth/GoogleLoginScreen";
import LoginScreen from "../../screens/auth/LoginScreen";
import RegisterScreen from "../../screens/auth/RegisterScreen";
import UserTypeSelectionScreen from "../../screens/auth/UserTypeSelectionScreen";
import WelcomeScreen from "../../screens/auth/WelcomeScreen";
import SplashScreen from "../../screens/splash/SplashScreen";


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
