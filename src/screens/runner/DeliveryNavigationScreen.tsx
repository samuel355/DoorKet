import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Linking,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  FAB,
  Portal,
  Dialog,
  Chip,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RunnerStackParamList, Order } from "@/types";
import { useAuth } from "@/store/authStore";
import { OrderService } from "@/services/orderService";
import { ColorPalette } from "../../theme/colors";
import { borderRadius, spacing } from "../../theme/styling";

type DeliveryNavigationNavigationProp = StackNavigationProp<
  RunnerStackParamList,
  "DeliveryNavigation"
>;

type DeliveryNavigationRouteProp = RouteProp<
  RunnerStackParamList,
  "DeliveryNavigation"
>;

interface DeliveryNavigationProps {
  navigation: DeliveryNavigationNavigationProp;
  route: DeliveryNavigationRouteProp;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const { width, height } = Dimensions.get("window");

const DeliveryNavigationScreen: React.FC<DeliveryNavigationProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(
    null,
  );
  const [deliveryLocation, setDeliveryLocation] =
    useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<string>("Calculating...");
  const [deliveryStartTime] = useState(new Date());

  // Modal states
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Map ref
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadOrderDetails();
    requestLocationPermission();
    startAnimations();
    startPulseAnimation();

    return () => {
      // Cleanup location tracking
      setIsTracking(false);
    };
  }, [orderId]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const loadOrderDetails = async () => {
    try {
      const result = await OrderService.getOrderById(orderId);
      if (result.data) {
        setOrder(result.data);

        // Parse delivery coordinates if available
        if (result.data.delivery_latitude && result.data.delivery_longitude) {
          setDeliveryLocation({
            latitude: result.data.delivery_latitude,
            longitude: result.data.delivery_longitude,
          });
        } else {
          // Geocode the address if coordinates not available
          geocodeAddress(result.data.delivery_address);
        }
      }
    } catch (error) {
      console.error("Failed to load order:", error);
      Alert.alert("Error", "Failed to load order details");
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      const geocoded = await Location.geocodeAsync(address);
      if (geocoded.length > 0) {
        setDeliveryLocation({
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      // Fallback to default location (Accra, Ghana)
      setDeliveryLocation({
        latitude: 5.6037,
        longitude: -0.187,
      });
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        startLocationTracking();
      } else {
        Alert.alert(
          "Location Permission",
          "Location access is required for navigation. Please enable it in settings.",
        );
      }
    } catch (error) {
      console.error("Location permission error:", error);
    }
  };

  const startLocationTracking = async () => {
    try {
      setIsTracking(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);

      // Watch position updates
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        },
      );

      setIsLoading(false);
    } catch (error) {
      console.error("Location tracking error:", error);
      setIsLoading(false);
    }
  };

  const calculateDistance = (from: LocationCoords, to: LocationCoords) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(to.latitude - from.latitude);
    const dLon = deg2rad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(from.latitude)) *
        Math.cos(deg2rad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  useEffect(() => {
    if (currentLocation && deliveryLocation) {
      const dist = calculateDistance(currentLocation, deliveryLocation);
      setDistance(dist);

      // Estimate duration (assuming 30 km/h average speed in city)
      const estimatedMinutes = Math.round((dist / 30) * 60);
      setDuration(`${estimatedMinutes} min`);

      // Auto-center map to show both points
      if (mapRef.current) {
        mapRef.current.fitToCoordinates([currentLocation, deliveryLocation], {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }
    }
  }, [currentLocation, deliveryLocation]);

  const openExternalNavigation = () => {
    if (!deliveryLocation || !order) return;

    const destination = `${deliveryLocation.latitude},${deliveryLocation.longitude}`;
    const label = encodeURIComponent(order.delivery_address);

    Alert.alert("Open Navigation", "Choose your preferred navigation app:", [
      {
        text: "Google Maps",
        onPress: () => {
          const url = Platform.select({
            ios: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
            android: `google.navigation:q=${destination}`,
          });
          Linking.canOpenURL(url!).then((supported) => {
            if (supported) {
              Linking.openURL(url!);
            } else {
              // Fallback to web version
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
              );
            }
          });
        },
      },
      {
        text: "Apple Maps",
        onPress: () => {
          if (Platform.OS === "ios") {
            Linking.openURL(
              `http://maps.apple.com/?daddr=${destination}&dirflg=d`,
            );
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const callCustomer = () => {
    if (order?.student?.phone) {
      Linking.openURL(`tel:${order.student.phone}`);
    } else {
      Alert.alert("Info", "Customer phone number not available");
    }
  };

  const handleArrived = () => {
    Alert.alert(
      "Arrived at Destination",
      "Have you arrived at the customer's location?",
      [
        { text: "Not Yet", style: "cancel" },
        {
          text: "Yes, I'm Here",
          onPress: () => setCompletionModalVisible(true),
        },
      ],
    );
  };

  const completeDelivery = async () => {
    if (!order) return;

    try {
      setIsCompleting(true);
      const result = await OrderService.updateOrderStatusWithResult(
        order.id,
        "completed",
        {
          completed_at: new Date().toISOString(),
        },
      );

      if (result.success) {
        Alert.alert(
          "Delivery Completed!",
          "Great job! The order has been marked as delivered.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Dashboard" }],
                });
              },
            },
          ],
        );
      } else {
        Alert.alert("Error", result.message || "Failed to complete delivery");
      }
    } catch (error) {
      console.error("Complete delivery error:", error);
      Alert.alert("Error", "Failed to complete delivery");
    } finally {
      setIsCompleting(false);
      setCompletionModalVisible(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`;
  };

  const formatDistance = (dist: number) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m`;
    }
    return `${dist.toFixed(1)}km`;
  };

  const getElapsedTime = () => {
    const now = new Date();
    const elapsed = Math.floor(
      (now.getTime() - deliveryStartTime.getTime()) / 60000,
    );
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading navigation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: currentLocation?.latitude || 5.6037,
            longitude: currentLocation?.longitude || -0.187,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              pinColor="blue"
            />
          )}

          {deliveryLocation && (
            <Marker
              coordinate={deliveryLocation}
              title="Delivery Location"
              description={order?.delivery_address}
              pinColor="red"
            />
          )}
        </MapView>

        {/* Overlay Controls */}
        <Animated.View
          style={[
            styles.overlayTop,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.8)", "transparent"]}
            style={styles.gradientOverlay}
          >
            <Card style={styles.infoCard}>
              <Card.Content style={styles.infoContent}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>
                    Order #{order?.order_number}
                  </Text>
                  <Chip
                    style={styles.statusChip}
                    textStyle={styles.statusChipText}
                  >
                    DELIVERING
                  </Chip>
                </View>

                <View style={styles.customerInfo}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.customerName}>
                    {order?.student?.full_name}
                  </Text>
                </View>

                <View style={styles.addressInfo}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.address} numberOfLines={2}>
                    {order?.delivery_address}
                  </Text>
                </View>

                <View style={styles.deliveryStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {formatDistance(distance)}
                    </Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{duration}</Text>
                    <Text style={styles.statLabel}>ETA</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{getElapsedTime()}</Text>
                    <Text style={styles.statLabel}>Elapsed</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {formatCurrency(order?.total_amount || 0)}
                    </Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </LinearGradient>
        </Animated.View>

        {/* Bottom Action Buttons */}
        <Animated.View
          style={[
            styles.overlayBottom,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradientOverlay}
          >
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={callCustomer}
                style={styles.actionButton}
                labelStyle={styles.callButtonText}
                icon="call"
                disabled={!order?.student?.phone}
              >
                Call Customer
              </Button>

              <Button
                mode="outlined"
                onPress={openExternalNavigation}
                style={styles.actionButton}
                labelStyle={styles.navButtonText}
                icon="navigation"
              >
                Open Navigation
              </Button>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Floating Action Button */}
        <Animated.View
          style={[styles.fabContainer, { transform: [{ scale: pulseAnim }] }]}
        >
          <FAB
            style={styles.arrivedFab}
            icon="map-marker-check"
            label="I've Arrived"
            onPress={handleArrived}
            mode="extended"
          />
        </Animated.View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <FAB
            style={styles.mapControlButton}
            icon="crosshairs-gps"
            size="small"
            onPress={() => {
              if (currentLocation && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
              }
            }}
          />
        </View>
      </View>

      {/* Completion Modal */}
      <Portal>
        <Dialog
          visible={completionModalVisible}
          onDismiss={() => setCompletionModalVisible(false)}
        >
          <Dialog.Title>Complete Delivery</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.completionText}>
              Confirm that you have successfully delivered the order to the
              customer.
            </Text>

            <View style={styles.orderSummary}>
              <Text style={styles.summaryLabel}>
                Order: #{order?.order_number}
              </Text>
              <Text style={styles.summaryLabel}>
                Customer: {order?.student?.full_name}
              </Text>
              <Text style={styles.summaryLabel}>
                Total: {formatCurrency(order?.total_amount || 0)}
              </Text>
              <Text style={styles.summaryLabel}>
                Your Earnings:{" "}
                {formatCurrency(
                  (order?.delivery_fee || 0) + (order?.service_fee || 0),
                )}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCompletionModalVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={completeDelivery}
              mode="contained"
              loading={isCompleting}
              disabled={isCompleting}
            >
              Complete Delivery
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ColorPalette.neutral[50],
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  gradientOverlay: {
    padding: spacing.lg,
  },
  infoCard: {
    elevation: 5,
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  infoContent: {
    padding: spacing.md,
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
  },
  statusChip: {
    backgroundColor: "#FF5722",
  },
  statusChipText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 10,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.primary[500],
    marginLeft: spacing.xs,
  },
  addressInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  address: {
    fontSize: 14,
    color: ColorPalette.primary[500],
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 20,
  },
  deliveryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: ColorPalette.primary[500],
  },
  statLabel: {
    fontSize: 10,
    color: ColorPalette.primary[500],
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: ColorPalette.primary[500],
  },
  callButtonText: {
    color: ColorPalette.primary[500],
    fontWeight: "600",
  },
  navButtonText: {
    color: ColorPalette.primary[500],
    fontWeight: "600",
  },
  fabContainer: {
    position: "absolute",
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 2,
  },
  arrivedFab: {
    backgroundColor: "#4CAF50",
    alignSelf: "center",
  },
  mapControls: {
    position: "absolute",
    right: spacing.lg,
    top: height * 0.4,
    zIndex: 1,
  },
  mapControlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginBottom: spacing.sm,
  },
  completionText: {
    fontSize: 16,
    color: ColorPalette.primary[500],
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  orderSummary: {
    backgroundColor: "#f8f9fa",
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  summaryLabel: {
    fontSize: 14,
    color: ColorPalette.primary[500],
    marginBottom: spacing.xs,
  },
});

export default DeliveryNavigationScreen;
