import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { AdminDashboardScreen, AdminSettingsScreen, AnalyticsScreen, CategoryManagementScreen, ItemManagementScreen, OrderDetailsScreen, OrderManagementScreen, ProfileScreen, ReportsScreen, SettingsScreen, UserDetailsScreen, UserManagementScreen } from "../screens/screens/PlaceholderScreens";


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack Navigator
const DashboardStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FF9800",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          title: "ChopCart Admin",
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
        name="Reports"
        component={ReportsScreen}
        options={{
          title: "Reports & Analytics",
        }}
      />
    </Stack.Navigator>
  );
};

// Users Management Stack Navigator
const UsersStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FF9800",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{
          title: "User Management",
          headerRight: () => (
            <Ionicons
              name="add-outline"
              size={24}
              color="#ffffff"
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="UserDetails"
        component={UserDetailsScreen}
        options={({ route }) => ({
          title: (route.params as any)?.userName || "User Details",
        })}
      />
    </Stack.Navigator>
  );
};

// Orders Management Stack Navigator
const OrdersStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FF9800",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="OrderManagement"
        component={OrderManagementScreen}
        options={{
          title: "Order Management",
          headerRight: () => (
            <Ionicons
              name="filter-outline"
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
          title: `Order #${(route.params as any)?.orderId?.slice(-6) || "XXXXXX"}`,
        })}
      />
    </Stack.Navigator>
  );
};

// Catalog Management Stack Navigator
const CatalogStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FF9800",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="CategoryManagement"
        component={CategoryManagementScreen}
        options={{
          title: "Catalog Management",
          headerRight: () => (
            <Ionicons
              name="add-outline"
              size={24}
              color="#ffffff"
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="ItemManagement"
        component={ItemManagementScreen}
        options={({ route }) => ({
          title: (route.params as any)?.categoryName || "Items",
        })}
      />
    </Stack.Navigator>
  );
};

// Analytics Stack Navigator
const AnalyticsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FF9800",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: "Analytics & Insights",
          headerRight: () => (
            <Ionicons
              name="download-outline"
              size={24}
              color="#ffffff"
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: "Detailed Reports",
        }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FF9800",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
        options={{
          title: "Admin Settings",
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Admin Profile",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "App Settings",
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

const AdminNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "DashboardTab":
              iconName = focused ? "grid" : "grid-outline";
              break;
            case "UsersTab":
              iconName = focused ? "people" : "people-outline";
              break;
            case "OrdersTab":
              iconName = focused ? "receipt" : "receipt-outline";
              break;
            case "CatalogTab":
              iconName = focused ? "library" : "library-outline";
              break;
            case "AnalyticsTab":
              iconName = focused ? "analytics" : "analytics-outline";
              break;
            case "SettingsTab":
              iconName = focused ? "settings" : "settings-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#FF9800",
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
          fontSize: 10,
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
          tabBarBadge: undefined, // Can be used for alerts count
        }}
      />

      <Tab.Screen
        name="UsersTab"
        component={UsersStackNavigator}
        options={{
          tabBarLabel: "Users",
          tabBarBadge: undefined, // Can be used for pending verifications
        }}
      />

      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          tabBarLabel: "Orders",
          tabBarBadge: undefined, // Can be used for disputed orders
        }}
      />

      <Tab.Screen
        name="CatalogTab"
        component={CatalogStackNavigator}
        options={{
          tabBarLabel: "Catalog",
        }}
      />

      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStackNavigator}
        options={{
          tabBarLabel: "Analytics",
        }}
      />

      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
