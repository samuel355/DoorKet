import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Text,
  Card,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Basic placeholder component
const PlaceholderScreen: React.FC<{
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  navigation?: any;
}> = ({ title, subtitle = 'This screen is under development', icon = 'construct', color = '#2196F3', navigation }) => {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon as any} size={48} color={color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.message}>
              This screen is currently under development and will be available in a future update.
            </Text>

            <View style={styles.features}>
              <Text style={styles.featuresTitle}>Planned Features:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>User-friendly interface</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Real-time updates</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Enhanced functionality</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {navigation && (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            icon="arrow-left"
          >
            Go Back
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Student Screens
export const CategoriesScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Categories"
    subtitle="Browse all available item categories"
    icon="grid"
    color="#2196F3"
    navigation={navigation}
  />
);

export const CategoryItemsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => (
  <PlaceholderScreen
    title={`${route.params?.categoryName || 'Category'} Items`}
    subtitle="Browse items in this category"
    icon="list"
    color="#2196F3"
    navigation={navigation}
  />
);

export const ItemDetailsScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Item Details"
    subtitle="View detailed information about this item"
    icon="information-circle"
    color="#2196F3"
    navigation={navigation}
  />
);

export const CartScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Shopping Cart"
    subtitle="Review your selected items"
    icon="basket"
    color="#2196F3"
    navigation={navigation}
  />
);

export const CheckoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Checkout"
    subtitle="Complete your order"
    icon="card"
    color="#2196F3"
    navigation={navigation}
  />
);

export const OrderTrackingScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => (
  <PlaceholderScreen
    title="Order Tracking"
    subtitle={`Track order #${route.params?.orderId?.slice(-6) || 'XXXXXX'}`}
    icon="location"
    color="#4CAF50"
    navigation={navigation}
  />
);

export const OrderHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Order History"
    subtitle="View all your past orders"
    icon="receipt"
    color="#2196F3"
    navigation={navigation}
  />
);

// Runner Screens
export const RunnerDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Runner Dashboard"
    subtitle="Overview of your runner activities"
    icon="speedometer"
    color="#4CAF50"
    navigation={navigation}
  />
);

export const AvailableOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Available Orders"
    subtitle="Browse orders ready for pickup"
    icon="list-circle"
    color="#4CAF50"
    navigation={navigation}
  />
);

export const OrderDetailsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => (
  <PlaceholderScreen
    title="Order Details"
    subtitle={`Order #${route.params?.orderId?.slice(-6) || 'XXXXXX'} details`}
    icon="clipboard"
    color="#4CAF50"
    navigation={navigation}
  />
);

export const AcceptedOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="My Active Orders"
    subtitle="Orders you've accepted and are working on"
    icon="checkmark-circle"
    color="#4CAF50"
    navigation={navigation}
  />
);

export const ShoppingListScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Shopping List"
    subtitle="Items to purchase for this order"
    icon="list"
    color="#4CAF50"
    navigation={navigation}
  />
);

export const DeliveryNavigationScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Delivery Navigation"
    subtitle="Navigate to delivery location"
    icon="navigate"
    color="#4CAF50"
    navigation={navigation}
  />
);

export const EarningsScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Earnings"
    subtitle="Track your earnings and performance"
    icon="wallet"
    color="#4CAF50"
    navigation={navigation}
  />
);

export const RunnerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Runner Profile"
    subtitle="Manage your runner profile and settings"
    icon="person"
    color="#4CAF50"
    navigation={navigation}
  />
);

// Admin Screens
// export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
//   <PlaceholderScreen
//     title="Admin Dashboard"
//     subtitle="Platform overview and analytics"
//     icon="grid"
//     color="#FF9800"
//     navigation={navigation}
//   />
// );

export const UserManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="User Management"
    subtitle="Manage students and runners"
    icon="people"
    color="#FF9800"
    navigation={navigation}
  />
);

export const OrderManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Order Management"
    subtitle="Monitor and manage all orders"
    icon="receipt"
    color="#FF9800"
    navigation={navigation}
  />
);

export const AnalyticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Analytics"
    subtitle="Platform insights and reports"
    icon="analytics"
    color="#FF9800"
    navigation={navigation}
  />
);

export const AdminSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Admin Settings"
    subtitle="Platform configuration and settings"
    icon="settings"
    color="#FF9800"
    navigation={navigation}
  />
);

export const UserDetailsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => (
  <PlaceholderScreen
    title="User Details"
    subtitle={`Details for ${route.params?.userName || 'User'}`}
    icon="person"
    color="#FF9800"
    navigation={navigation}
  />
);

export const ReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Reports"
    subtitle="Detailed platform reports"
    icon="document-text"
    color="#FF9800"
    navigation={navigation}
  />
);

export const CategoryManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Category Management"
    subtitle="Manage item categories and products"
    icon="library"
    color="#FF9800"
    navigation={navigation}
  />
);

export const ItemManagementScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => (
  <PlaceholderScreen
    title="Item Management"
    subtitle={`Manage items in ${route.params?.categoryName || 'category'}`}
    icon="cube"
    color="#FF9800"
    navigation={navigation}
  />
);

// Shared Screens
export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Profile"
    subtitle="Manage your account information"
    icon="person"
    color="#9C27B0"
    navigation={navigation}
  />
);

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Notifications"
    subtitle="View your notifications and alerts"
    icon="notifications"
    color="#9C27B0"
    navigation={navigation}
  />
);

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Settings"
    subtitle="App preferences and configuration"
    icon="settings"
    color="#9C27B0"
    navigation={navigation}
  />
);

// Auth Screens
export const ProfileSetupScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <PlaceholderScreen
    title="Profile Setup"
    subtitle="Complete your profile information"
    icon="person-add"
    color="#2196F3"
    navigation={navigation}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    elevation: 4,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  cardContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  features: {
    marginTop: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  backButton: {
    borderRadius: 12,
    alignSelf: 'center',
    minWidth: 120,
  },
});
