import { StudentStackParamList } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { CommonActions } from "@react-navigation/native";
import React from "react";
import { Platform, View, Text, TouchableOpacity } from "react-native";
import ProfileScreen from "../screens/shared/ProfileScreen";
import NotificationsScreen from "../screens/shared/NotificationsScreen";
import SettingsScreen from "../screens/shared/SettingsScreen";
import EnhancedCartScreen from "../screens/student/EnhancedCartScreen";
import CategoriesScreen from "../screens/student/CategoriesScreen";
import CategoryItemsScreen from "../screens/student/CategoryItemsScreen";
import CheckoutScreen from "../screens/student/CheckoutScreen";
import HomeScreen from "../screens/student/HomeScreen";
import ItemDetailsScreen from "../screens/student/ItemDetailsScreen";
import OrderHistoryScreen from "../screens/student/OrderHistoryScreen";
import OrderTrackingScreen from "../screens/student/OrderTrackingScreen";
import PaymentScreen from "../screens/student/PaymentScreen";
import { useCartItemCount } from "@/store/cartStore";
import { CartBadge } from "../components/cart";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<StudentStackParamList>();

// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "DoorKet",
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate("Notifications")}
                style={{ marginRight: 12 }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#ffffff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.getParent()?.dispatch(
                    CommonActions.navigate({
                      name: "CartTab",
                      params: { screen: "Cart" },
                    }),
                  )
                }
              >
                <CartBadge
                  color="#ffffff"
                  badgeColor="#FF6B6B"
                  size="small"
                  showZero={false}
                />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={({ navigation }) => ({
          title: "All Categories",
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.getParent()?.dispatch(
                  CommonActions.navigate({
                    name: "CartTab",
                    params: { screen: "Cart" },
                  }),
                )
              }
              style={{ marginRight: 16 }}
            >
              <CartBadge
                color="#ffffff"
                badgeColor="#FF6B6B"
                size="small"
                showZero={false}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="CategoryItems"
        component={CategoryItemsScreen}
        options={({ route, navigation }) => ({
          title: route.params.categoryName,
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.getParent()?.dispatch(
                  CommonActions.navigate({
                    name: "CartTab",
                    params: { screen: "Cart" },
                  }),
                )
              }
              style={{ marginRight: 16 }}
            >
              <CartBadge
                color="#ffffff"
                badgeColor="#FF6B6B"
                size="small"
                showZero={false}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ItemDetails"
        component={ItemDetailsScreen}
        options={({ navigation }) => ({
          title: "Item Details",
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.getParent()?.dispatch(
                  CommonActions.navigate({
                    name: "CartTab",
                    params: { screen: "Cart" },
                  }),
                )
              }
              style={{ marginRight: 16 }}
            >
              <CartBadge
                color="#ffffff"
                badgeColor="#FF6B6B"
                size="small"
                showZero={false}
              />
            </TouchableOpacity>
          ),
        })}
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
        headerShown: false,
      }}
    >
      <Stack.Screen name="Cart" component={EnhancedCartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
};

// Orders Stack Navigator
const OrdersStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
        headerShown: false,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
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
  const cartItemCount = useCartItemCount();

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
              iconName = focused ? "bag" : "bag-outline";
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

          return (
            <View
              style={{
                backgroundColor: focused ? "#7c73f020" : "transparent",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                minWidth: 50,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Ionicons
                name={iconName}
                size={focused ? 26 : 24}
                color={focused ? "#7c73f0" : "#64748b"}
              />
              {route.name === "CartTab" && cartItemCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 8,
                    backgroundColor: "#FF6B6B",
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#ffffff",
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
        tabBarActiveTintColor: "#7c73f0",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "rgba(0, 0, 0, 0.1)",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          paddingBottom: Platform.OS === "ios" ? 25 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 90 : 65,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
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
          tabBarBadge:
            cartItemCount > 0
              ? cartItemCount > 99
                ? "99+"
                : cartItemCount.toString()
              : undefined,
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
