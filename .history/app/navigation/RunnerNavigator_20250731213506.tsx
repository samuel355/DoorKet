import { RunnerStackParamList } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { Platform } from "react-native";
import { AcceptedOrdersScreen, AvailableOrdersScreen, DeliveryNavigationScreen, EarningsScreen, OrderDetailsScreen, RunnerProfileScreen, ShoppingListScreen } from "../../screens/PlaceholderScreens";
import RunnerDashboardScreen from "../../screens/runner/RunnerDashboardScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import SettingsScreen from "../../screens/shared/SettingsScreen";


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RunnerStackParamList>();

// Dashboard Stack Navigator
const DashboardStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4CAF50",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={RunnerDashboardScreen}
        options={{
          title: "ChopCart Runner",
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
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={({ route }) => ({
          title: `Order #${route.params.orderId.slice(-6)}`,
        })}
      />
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={({ route }) => ({
          title: "Shopping List",
        })}
      />
      <Stack.Screen
        name="DeliveryNavigation"
        component={DeliveryNavigationScreen}
        options={{
          title: "Delivery",
          headerLeft: () => null, // Prevent going back during delivery
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Available Orders Stack Navigator
const AvailableOrdersStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4CAF50",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="AvailableOrders"
        component={AvailableOrdersScreen}
        options={{
          title: "Available Orders",
          headerRight: () => (
            <Ionicons
              name="refresh-outline"
              size={24}
              color="#ffffff"
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={({ route }) => ({
          title: `Order #${route.params.orderId.slice(-6)}`,
        })}
      />
    </Stack.Navigator>
  );
};

// Active Orders Stack Navigator
const ActiveOrdersStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4CAF50",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="AcceptedOrders"
        component={AcceptedOrdersScreen}
        options={{
          title: "My Active Orders",
        }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={({ route }) => ({
          title: `Order #${route.params.orderId.slice(-6)}`,
        })}
      />
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={({ route }) => ({
          title: "Shopping List",
        })}
      />
      <Stack.Screen
        name="DeliveryNavigation"
        component={DeliveryNavigationScreen}
        options={{
          title: "Delivery in Progress",
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Earnings Stack Navigator
const EarningsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4CAF50",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          title: "My Earnings",
          headerRight: () => (
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#ffffff"
              style={{ marginRight: 16 }}
            />
          ),
        }}
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
          backgroundColor: "#4CAF50",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={RunnerProfileScreen}
        options={{
          title: "Runner Profile",
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

const RunnerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "DashboardTab":
              iconName = focused ? "speedometer" : "speedometer-outline";
              break;
            case "AvailableTab":
              iconName = focused ? "list-circle" : "list-circle-outline";
              break;
            case "ActiveTab":
              iconName = focused
                ? "checkmark-circle"
                : "checkmark-circle-outline";
              break;
            case "EarningsTab":
              iconName = focused ? "wallet" : "wallet-outline";
              break;
            case "ProfileTab":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
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
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: "Dashboard",
          tabBarBadge: undefined, // Can be used for urgent orders count
        }}
      />

      <Tab.Screen
        name="AvailableTab"
        component={AvailableOrdersStackNavigator}
        options={{
          tabBarLabel: "Available",
          tabBarBadge: undefined, // Can be used for new orders count
        }}
      />

      <Tab.Screen
        name="ActiveTab"
        component={ActiveOrdersStackNavigator}
        options={{
          tabBarLabel: "Active",
          tabBarBadge: undefined, // Can be used for active orders count
        }}
      />

      <Tab.Screen
        name="EarningsTab"
        component={EarningsStackNavigator}
        options={{
          tabBarLabel: "Earnings",
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

export default RunnerNavigator;
