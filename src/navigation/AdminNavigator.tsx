// src/navigation/AdminNavigator.tsx
import React from "react";
import { Platform, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

// --- Admin screens ---
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import UserManagementScreen from "../screens/admin/UserManagementScreen";
import OrderManagementScreen from "../screens/admin/OrderManagementScreen";
import CategoryManagementScreen from "../screens/admin/CategoryManagementScreen";
import ItemManagementScreen from "../screens/admin/ItemManagementScreen";
import AdminSettingsScreen from "../screens/admin/AdminSettingsScreen";
import NotificationsScreen from "../screens/admin/NotificationsScreen";
import ProfileScreen from "../screens/admin/ProfileScreen";
import AnalyticsScreen from "../screens/admin/AnalyticsScreen";

// --- other placeholders (keep if you use them) ---
import {
  OrderDetailsScreen,
  ReportsScreen,
  SettingsScreen,
  UserDetailsScreen,
} from "../screens/PlaceholderScreens";
import { NavigatorScreenParams } from "@react-navigation/native";

// ===================== Types =====================
type DashboardStackParamList = {
  Dashboard: undefined;
  Reports: undefined;
};

type UsersStackParamList = {
  UserManagement: undefined;
  UserDetails: { userName?: string; userId?: string } | undefined;
};

type OrdersStackParamList = {
  OrderManagement: undefined;
  OrderDetails: { orderId: string };
};

type CatalogStackParamList = {
  CategoryManagement: undefined;
  ItemManagement:
    | { categoryId?: string; categoryName?: string; openNew?: boolean }
    | undefined;
};

type AnalyticsStackParamList = {
  Analytics: undefined;
  Reports: undefined;
};

type SettingsStackParamList = {
  AdminSettings: undefined;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
};

type AdminTabParamList = {
  DashboardTab: undefined;
  UsersTab: undefined;
  OrdersTab: undefined;
  CatalogTab: undefined;
  AnalyticsTab: undefined;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

// ===================== Navigators =====================
const Tab = createBottomTabNavigator<AdminTabParamList>();

const DashboardStack = createStackNavigator<DashboardStackParamList>();
const UsersStack = createStackNavigator<UsersStackParamList>();
const OrdersStack = createStackNavigator<OrdersStackParamList>();
const CatalogStack = createStackNavigator<CatalogStackParamList>();
const AnalyticsStack = createStackNavigator<AnalyticsStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: "#FF9800"},
  headerTintColor: "#ffffff",
  headerTitleStyle: { fontWeight: "bold" as const },
};

// ----- Dashboard -----
const DashboardStackNavigator = () => (
  <DashboardStack.Navigator screenOptions={stackScreenOptions}>
    <DashboardStack.Screen
      name="Dashboard"
      component={AdminDashboardScreen}
      options={({ navigation }) => ({
        title: "DoorKet Admin",
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={() =>
                navigation.getParent()?.navigate("SettingsTab", {
                  screen: "Profile",
                })
              }>
              <Ionicons
                name="notifications-outline"
                size={26}
                color="#ffffff"
                style={{ marginRight: 16 }}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                navigation.getParent()?.navigate("SettingsTab", {
                  screen: "Profile",
                })
              }
            >
              <Ionicons
                name="person-circle-outline"
                size={26}
                color="#ffffff"
                style={{ marginRight: 12 }}
              />
            </Pressable>
          </View>
        ),

      })}
    />
    <DashboardStack.Screen
      name="Reports"
      component={ReportsScreen}
      options={{ title: "Reports & Analytics" }}
    />
  </DashboardStack.Navigator>
);

// ----- Users -----
const UsersStackNavigator = () => (
  <UsersStack.Navigator screenOptions={stackScreenOptions}>
    <UsersStack.Screen
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
    <UsersStack.Screen
      name="UserDetails"
      component={UserDetailsScreen}
      options={({ route }) => ({
        title: route.params?.userName || "User Details",
      })}
    />
  </UsersStack.Navigator>
);

// ----- Orders -----
const OrdersStackNavigator = () => (
  <OrdersStack.Navigator screenOptions={stackScreenOptions}>
    <OrdersStack.Screen
      name="OrderManagement"
      component={OrderManagementScreen}
      options={{
        title: "Order Management",
        headerRight: () => (
          <Ionicons
            name="funnel-outline"
            size={24}
            color="#ffffff"
            style={{ marginRight: 16 }}
          />
        ),
      }}
    />
    <OrdersStack.Screen
      name="OrderDetails"
      component={OrderDetailsScreen}
      options={({ route }) => ({
        title: `Order #${route.params.orderId.slice(-6)}`,
      })}
    />
  </OrdersStack.Navigator>
);

// ----- Catalog -----
const CatalogStackNavigator = () => (
  <CatalogStack.Navigator screenOptions={stackScreenOptions}>
    <CatalogStack.Screen
      name="CategoryManagement"
      component={CategoryManagementScreen}
      options={{
        title: "Catalog",
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
    <CatalogStack.Screen
      name="ItemManagement"
      component={ItemManagementScreen}
      options={({ route }) => ({
        title: route.params?.categoryName || "Items",
      })}
    />
  </CatalogStack.Navigator>
);

// ----- Analytics -----
const AnalyticsStackNavigator = () => (
  <AnalyticsStack.Navigator screenOptions={stackScreenOptions}>
    <AnalyticsStack.Screen
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
    <AnalyticsStack.Screen
      name="Reports"
      component={ReportsScreen}
      options={{ title: "Detailed Reports" }}
    />
  </AnalyticsStack.Navigator>
);

// ----- Settings -----
const SettingsStackNavigator = () => (
  <SettingsStack.Navigator screenOptions={stackScreenOptions}>
    <SettingsStack.Screen
      name="AdminSettings"
      component={AdminSettingsScreen}
      options={({ navigation }) => ({
        title: "Admin Settings",
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() =>
                navigation.getParent()?.navigate("SettingsTab", {
                  screen: "Profile",
                })
              }
            >
              <Ionicons
                name="person-circle-outline"
                size={26}
                color="#ffffff"
                style={{ marginRight: 12 }}
              />
            </Pressable>
          </View>
        ),
      })}
    />
    <SettingsStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: "Admin Profile" }}
    />
    <SettingsStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: "App Settings" }}
    />
    <SettingsStack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: "Notifications" }}
    />
  </SettingsStack.Navigator>
);

// ===================== Tabs =====================
const AdminNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Use only icon names that exist in Ionicons to avoid TS issues
        tabBarIcon: ({ focused, color, size }) => {
          const name =
            route.name === "DashboardTab"
              ? focused
                ? "grid"
                : "grid-outline"
              : route.name === "UsersTab"
              ? focused
                ? "people"
                : "people-outline"
              : route.name === "OrdersTab"
              ? focused
                ? "reader"
                : "reader-outline" // ⬅ safe alternative to "receipt"
              : route.name === "CatalogTab"
              ? focused
                ? "albums"
                : "albums-outline"
              : route.name === "AnalyticsTab"
              ? focused
                ? "analytics"
                : "analytics-outline"
              : focused
              ? "settings"
              : "settings-outline";

          return <Ionicons name={name as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#FF9800",
        tabBarInactiveTintColor: "#888888",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#fff",
          paddingBottom: Platform.OS === "ios" ? 30 : 5,
          paddingTop: 5,
          height: Platform.OS === "ios" ? 86 : 60,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{ tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="UsersTab"
        component={UsersStackNavigator}
        options={{ tabBarLabel: "Users" }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{ tabBarLabel: "Orders" }}
      />
      <Tab.Screen
        name="CatalogTab"
        component={CatalogStackNavigator}
        options={{ tabBarLabel: "Catalog" }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStackNavigator}
        options={{ tabBarLabel: "Analytics" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ tabBarLabel: "Settings" }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Force the nested stack back to its root when the tab is tapped
            navigation.navigate("SettingsTab", { screen: "AdminSettings" });
          },
        })}
        
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
