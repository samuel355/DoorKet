import { StudentStackParamList } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { Platform } from "react-native";
import ProfileSetupScreen from "../../screens/auth/ProfileSetupScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import SettingsScreen from "../../screens/shared/SettingsScreen";
import CartScreen from "../../screens/student/CartScreen";
import CategoriesScreen from "../../screens/student/CategoriesScreen";
import CategoryItemsScreen from "../../screens/student/CategoryItemsScreen";
import CheckoutScreen from "../../screens/student/CheckoutScreen";
import HomeScreen from "../../screens/student/HomeScreen";
import ItemDetailsScreen from "../../screens/student/ItemDetailsScreen";
import OrderHistoryScreen from "../../screens/student/OrderHistoryScreen";
import OrderTrackingScreen from "../../screens/student/OrderTrackingScreen";
import PaymentScreen from "../../screens/student/PaymentScreen";


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<StudentStackParamList>();

// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2196F3",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "ChopCart",
          headerRight: () => (
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#ffffff"
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          title: "All Categories",
        }}
      />
      <Stack.Screen
        name="CategoryItems"
        component={CategoryItemsScreen}
        options={({ route }) => ({
          title: route.params.categoryName,
        })}
      />
      <Stack.Screen
        name="ItemDetails"
        component={ItemDetailsScreen}
        options={{
          title: "Item Details",
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
        }}
      />
    </Stack.Navigator>
  );
};

// Cart Stack Navigator
const CartStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2196F3",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "My Cart",
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: "Checkout",
        }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: "Payment",
          headerLeft: () => null, // Prevent going back during payment
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Orders Stack Navigator
const OrdersStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2196F3",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          title: "My Orders",
        }}
      />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={({ route }) => ({
          title: `Order #${route.params.orderId.slice(-6)}`,
        })}
      />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2196F3",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileSetupScreen}
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
        }}
      />
    </Stack.Navigator>
  );
};

const StudentNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "HomeTab":
              iconName = focused ? "home" : "home-outline";
              break;
            case "CartTab":
              iconName = focused ? "basket" : "basket-outline";
              break;
            case "OrdersTab":
              iconName = focused ? "receipt" : "receipt-outline";
              break;
            case "ProfileTab":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "#888888",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          paddingBottom: Platform.OS === "ios" ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === "ios" ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "Home",
          tabBarBadge: undefined, // Can be used for notifications count
        }}
      />

      <Tab.Screen
        name="CartTab"
        component={CartStackNavigator}
        options={{
          tabBarLabel: "Cart",
          tabBarBadge: undefined, // Can be used for cart items count
        }}
      />

      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          tabBarLabel: "Orders",
          tabBarBadge: undefined, // Can be used for pending orders count
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
};

export default StudentNavigator;
