import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'index':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'categories':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'cart':
              iconName = focused ? 'bag' : 'bag-outline';
              break;
            case 'orders':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return (
            <View
              style={{
                backgroundColor: focused ? '#7c73f020' : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                minWidth: 50,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={iconName}
                size={focused ? 26 : 24}
                color={focused ? '#7c73f0' : '#64748b'}
              />
            </View>
          );
        },
        tabBarActiveTintColor: '#7c73f0',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 90 : 65,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarLabel: 'Cart',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: 'Orders',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
