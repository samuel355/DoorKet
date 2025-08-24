import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Text, Portal, Modal, ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

import { Loading, Input } from "../../components/common";
import { useAuth } from "@/store/authStore";
import { useCartStore, useCartActions } from "@/store/cartStore";
import { OrderService } from "@/services/orderService";

import { ColorPalette } from "../../theme/colors";
import { spacing, borderRadius } from "../../theme/styling";
import { PaymentMethod } from "@/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.12;

interface CheckoutScreenProps {
  navigation: any;
}

interface DeliveryInfo {
  address: string;
  hall_hostel: string;
  room_number: string;
  phone: string;
  specialInstructions: string;
  latitude?: number;
  longitude?: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const PAYMENT_METHODS = [
  {
    id: "momo" as PaymentMethod,
    name: "Mobile Money",
    icon: "phone-portrait",
    color: ColorPalette.primary[500],
    description: "Pay with MTN, Vodafone, or AirtelTigo",
  },
  {
    id: "card" as PaymentMethod,
    name: "Credit/Debit Card",
    icon: "card",
    color: ColorPalette.secondary[500],
    description: "Visa, Mastercard, or other cards",
  },
  {
    id: "cash" as PaymentMethod,
    name: "Pay on Delivery",
    icon: "cash",
    color: ColorPalette.success[500],
    description: "Pay when your order arrives",
  },
];

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const { cart } = useCartStore();
  const { clearCart } = useCartActions();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();

  // State
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("momo");
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    address: "",
    hall_hostel: profile?.hall_hostel || "",
    room_number: profile?.room_number || "",
    phone: profile?.phone || "",
    specialInstructions: cart.special_instructions || "",
    latitude: undefined,
    longitude: undefined,
  });
  const [errors, setErrors] = useState<Partial<DeliveryInfo>>({});
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 5.6037, // Default to Accra, Ghana
    longitude: -0.187,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  // Location autocomplete
  const [addressInput, setAddressInput] = useState("");
  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>(
    [],
  );
  const [showPredictions, setShowPredictions] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(
    null,
  );

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.98)).current;

  // Pre-fill delivery info from profile
  useEffect(() => {
    if (profile) {
      setDeliveryInfo((prev) => ({
        ...prev,
        hall_hostel: profile.hall_hostel || prev.hall_hostel,
        room_number: profile.room_number || prev.room_number,
        phone: profile.phone || prev.phone,
      }));
    }
  }, [profile]);

  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideUpAnim]);

  // Start animations on mount
  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  // Check if form is valid (for button state)
  const isFormValid = (): boolean => {
    return (
      deliveryInfo.address.trim() !== "" &&
      deliveryInfo.hall_hostel.trim() !== "" &&
      deliveryInfo.room_number.trim() !== "" &&
      deliveryInfo.phone.trim() !== "" &&
      /^(\+233|0)[0-9]{9}$/.test(deliveryInfo.phone.trim()) &&
      deliveryInfo.latitude !== undefined &&
      deliveryInfo.longitude !== undefined
    );
  };

  // Animate button when form validity changes
  useEffect(() => {
    if (isFormValid()) {
      // Pulse animation when button becomes enabled
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Scale down when disabled
      Animated.timing(buttonScaleAnim, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isFormValid(), buttonScaleAnim]);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access to use current location feature.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const addressString = address[0]
        ? `${address[0].name || ""} ${address[0].street || ""}, ${address[0].city || ""}`
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setLocationData({
        latitude,
        longitude,
        address: addressString,
      });

      setMapRegion({
        ...mapRegion,
        latitude,
        longitude,
      });

      setAddressInput(addressString);
      setDeliveryInfo((prev) => ({
        ...prev,
        latitude,
        longitude,
        address: addressString,
      }));

      // Clear address error
      if (errors.address) {
        setErrors((prev) => ({ ...prev, address: undefined }));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Failed to get your current location. Please try again.",
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  // Search places with Google Places API
  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setPlacePredictions([]);
      setShowPredictions(false);
      setAutocompleteError(null);
      return;
    }

    try {
      setLoadingPredictions(true);
      setAutocompleteError(null);
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        setAutocompleteError("Google Maps API key not configured");
        console.warn("Google Maps API key not found");
        return;
      }

      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query,
        )}&key=${apiKey}&components=country:gh&types=establishment|geocode`,
        {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error_message) {
        throw new Error(data.error_message);
      }

      if (data.predictions && data.predictions.length > 0) {
        // Limit to 6 predictions for better UX
        const limitedPredictions = data.predictions.slice(0, 6);
        setPlacePredictions(limitedPredictions);
        setShowPredictions(true);
      } else {
        setPlacePredictions([]);
        setShowPredictions(false);
        setAutocompleteError(
          "No locations found. Try a different search term.",
        );
      }
    } catch (error: any) {
      console.error("Error searching places:", error);
      setPlacePredictions([]);
      setShowPredictions(false);

      if (error.name === "AbortError") {
        setAutocompleteError("Search timeout. Please try again.");
      } else {
        setAutocompleteError(
          "Unable to search locations. Check your connection.",
        );
      }
    } finally {
      setLoadingPredictions(false);
    }
  };

  // Get place details
  const getPlaceDetails = async (placeId: string) => {
    try {
      setLoadingLocation(true);
      setAutocompleteError(null);
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        setAutocompleteError("Google Maps API key not configured");
        console.warn("Google Maps API key not found");
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=geometry,formatted_address`,
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error_message) {
        throw new Error(data.error_message);
      }

      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        const address = data.result.formatted_address;

        setLocationData({
          latitude: lat,
          longitude: lng,
          address: address,
        });

        setMapRegion({
          ...mapRegion,
          latitude: lat,
          longitude: lng,
        });

        setDeliveryInfo((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: address,
        }));

        // Clear address error
        if (errors.address) {
          setErrors((prev) => ({ ...prev, address: undefined }));
        }
      } else {
        throw new Error("Location details not found");
      }
    } catch (error: any) {
      console.error("Error getting place details:", error);
      if (error.name === "AbortError") {
        setAutocompleteError("Request timeout. Please try again.");
      } else {
        setAutocompleteError("Unable to get location details. Try again.");
      }
    } finally {
      setLoadingLocation(false);
      setShowPredictions(false);
    }
  };

  // Handle address input change
  const handleAddressInputChange = (text: string) => {
    setAddressInput(text);
    searchPlaces(text);
  };

  // Handle map press
  const onMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    try {
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const addressString = address[0]
        ? `${address[0].name || ""} ${address[0].street || ""}, ${address[0].city || ""}`
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setLocationData({
        latitude,
        longitude,
        address: addressString,
      });

      setAddressInput(addressString);
      setDeliveryInfo((prev) => ({
        ...prev,
        latitude,
        longitude,
        address: addressString,
      }));

      // Clear address error
      if (errors.address) {
        setErrors((prev) => ({ ...prev, address: undefined }));
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<DeliveryInfo> = {};

    if (!deliveryInfo.address.trim()) {
      newErrors.address = "Delivery address is required";
    }

    if (!deliveryInfo.hall_hostel.trim()) {
      newErrors.hall_hostel = "Hall/Hostel is required";
    }

    if (!deliveryInfo.room_number.trim()) {
      newErrors.room_number = "Room number is required";
    }

    if (!deliveryInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+233|0)[0-9]{9}$/.test(deliveryInfo.phone.trim())) {
      newErrors.phone = "Please enter a valid Ghana phone number";
    }

    if (!deliveryInfo.latitude || !deliveryInfo.longitude) {
      newErrors.address = "Please select your delivery location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Calculate fees
  const serviceFee = cart.total * 0.05; // 5% service fee
  const deliveryFee = 5.0; // Fixed delivery fee
  const finalTotal = cart.total + serviceFee + deliveryFee;

  // Create order in database
  const createOrder = async (): Promise<{
    success: boolean;
    orderId?: string;
    orderNumber?: string;
  }> => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      const orderData = {
        student_id: user.id,
        status: "pending" as const,
        total_amount: finalTotal,
        service_fee: serviceFee,
        delivery_fee: deliveryFee,
        delivery_address: deliveryInfo.address,
        delivery_latitude: deliveryInfo.latitude,
        delivery_longitude: deliveryInfo.longitude,
        special_instructions: deliveryInfo.specialInstructions || undefined,
        payment_method: selectedPaymentMethod,
        payment_status: "pending" as const,
      };

      const { data: order, error: orderError } = await OrderService.createOrder(
        orderData as any,
      );

      if (orderError || !order) {
        throw new Error(orderError || "Failed to create order");
      }

      const orderItems = cart.items.map((item) => ({
        order_id: (order as any).id,
        item_id: item.item?.id || undefined,
        custom_item_name: item.item?.id ? undefined : item.custom_item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        custom_budget: item.custom_budget,
        notes: item.notes,
      }));

      const { error: itemsError } =
        await OrderService.addOrderItems(orderItems);

      if (itemsError) {
        throw new Error(itemsError);
      }

      return {
        success: true,
        orderId: (order as any).id,
        orderNumber: (order as any).order_number,
      };
    } catch (error: any) {
      console.error("Error creating order:", error);
      return {
        success: false,
      };
    }
  };

  // Handle payment for mobile money and card
  const handlePayment = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const orderResult = await createOrder();

      if (!orderResult.success || !orderResult.orderId) {
        Alert.alert(
          "Order Creation Failed",
          "Failed to create your order. Please try again.",
        );
        return;
      }

      clearCart();

      navigation.navigate("Payment", {
        orderId: orderResult.orderId,
        amount: finalTotal,
        paymentMethod: selectedPaymentMethod,
        customerData: {
          name: profile?.full_name || "",
          phone: deliveryInfo.phone,
        },
      });
    } catch (error) {
      console.error("Payment initiation error:", error);
      Alert.alert(
        "Payment Error",
        "Failed to initiate payment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle place order for cash on delivery
  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setShowConfirmModal(false);

    try {
      setLoading(true);

      const orderResult = await createOrder();

      if (
        !orderResult.success ||
        !orderResult.orderId ||
        !orderResult.orderNumber
      ) {
        Alert.alert(
          "Order Failed",
          "Failed to place your order. Please try again.",
        );
        return;
      }

      clearCart();

      Alert.alert(
        "Order Placed Successfully! 🎉",
        `Your order #${orderResult.orderNumber} has been placed. You'll pay cash on delivery.\n\nA runner will be assigned shortly and you'll receive updates about your order.`,
        [
          {
            text: "View Order",
            onPress: () =>
              navigation.navigate("OrderTracking", {
                orderId: orderResult.orderId,
              }),
          },
          {
            text: "Continue Shopping",
            onPress: () => navigation.navigate("HomeTab"),
          },
        ],
      );
    } catch (error: any) {
      console.error("Error placing order:", error);
      Alert.alert(
        "Order Failed",
        error.message || "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[
          ColorPalette.primary[600],
          ColorPalette.primary[700],
          ColorPalette.secondary[600],
        ]}
        locations={[0, 0.6, 1]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" />

          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Checkout</Text>
              <Text style={styles.headerSubtitle}>
                {cart.items.length} item{cart.items.length !== 1 ? "s" : ""} • ₵
                {finalTotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.headerAmount}>₵{finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderLocationSection = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name="location" size={24} color={ColorPalette.primary[600]} />
        <Text style={styles.sectionTitle}>Delivery Location</Text>
      </View>

      {/* Address Input with Autocomplete */}
      <View style={styles.locationInputContainer}>
        <Input
          label="Search or enter delivery address"
          value={addressInput}
          onChangeText={handleAddressInputChange}
          placeholder="Start typing your location..."
          error={errors.address}
          rightIcon="search"
          required
        />

        {loadingPredictions && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={ColorPalette.primary[500]} />
            <Text style={styles.loadingText}>Searching locations...</Text>
          </View>
        )}

        {/* Autocomplete Error */}
        {autocompleteError && !loadingPredictions && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="warning-outline"
              size={16}
              color={ColorPalette.error[500]}
            />
            <Text style={styles.errorMessage}>{autocompleteError}</Text>
          </View>
        )}

        {/* Place Predictions */}
        {showPredictions && placePredictions.length > 0 && (
          <View style={styles.predictionsContainer}>
            {placePredictions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.predictionItem}
                onPress={() => {
                  setAddressInput(item.description);
                  getPlaceDetails(item.place_id);
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={ColorPalette.neutral[500]}
                />
                <View style={styles.predictionText}>
                  <Text style={styles.predictionMainText}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.predictionSecondaryText}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={styles.predictionsFooter}>
              <Text style={styles.predictionsFooterText}>
                Showing top {placePredictions.length} result
                {placePredictions.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Current Location Button */}
      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={getCurrentLocation}
        disabled={loadingLocation}
      >
        <View style={styles.currentLocationContent}>
          {loadingLocation ? (
            <ActivityIndicator size="small" color={ColorPalette.primary[500]} />
          ) : (
            <Ionicons
              name="navigate"
              size={20}
              color={ColorPalette.primary[500]}
            />
          )}
          <Text style={styles.currentLocationText}>
            {loadingLocation ? "Getting location..." : "Use current location"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Map Button */}
      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => setShowLocationModal(true)}
      >
        <Ionicons name="map" size={20} color={ColorPalette.primary[500]} />
        <Text style={styles.mapButtonText}>Select on map</Text>
      </TouchableOpacity>

      {/* Location Preview */}
      {deliveryInfo.latitude && deliveryInfo.longitude && (
        <View style={styles.locationPreview}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.previewMap}
            region={{
              latitude: deliveryInfo.latitude,
              longitude: deliveryInfo.longitude,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: deliveryInfo.latitude,
                longitude: deliveryInfo.longitude,
              }}
            />
          </MapView>
        </View>
      )}
    </Animated.View>
  );

  const renderDeliveryInfo = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons
          name="information-circle"
          size={24}
          color={ColorPalette.primary[600]}
        />
        <Text style={styles.sectionTitle}>Delivery Details</Text>
      </View>

      <View style={styles.inputGroup}>
        <Input
          label="Hall/Hostel"
          value={deliveryInfo.hall_hostel}
          onChangeText={(value) => handleInputChange("hall_hostel", value)}
          error={errors.hall_hostel}
          placeholder="e.g., Unity Hall"
          required
        />

        <Input
          label="Room Number"
          value={deliveryInfo.room_number}
          onChangeText={(value) => handleInputChange("room_number", value)}
          error={errors.room_number}
          placeholder="e.g., A24 or 204"
          required
        />

        <Input
          label="Phone Number"
          value={deliveryInfo.phone}
          onChangeText={(value) => handleInputChange("phone", value)}
          error={errors.phone}
          placeholder="+233 or 0 followed by 9 digits"
          keyboardType="phone-pad"
          required
        />

        <Input
          label="Special Instructions (Optional)"
          value={deliveryInfo.specialInstructions}
          onChangeText={(value) =>
            handleInputChange("specialInstructions", value)
          }
          placeholder="Any special delivery instructions..."
          multiline
          numberOfLines={3}
        />
      </View>
    </Animated.View>
  );

  const renderPaymentMethods = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name="card" size={24} color={ColorPalette.primary[600]} />
        <Text style={styles.sectionTitle}>Payment Method</Text>
      </View>

      <View style={styles.paymentMethods}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              selectedPaymentMethod === method.id &&
                styles.paymentMethodSelected,
            ]}
            onPress={() => setSelectedPaymentMethod(method.id)}
          >
            <View style={styles.paymentMethodLeft}>
              <View
                style={[
                  styles.paymentMethodIcon,
                  { backgroundColor: method.color + "20" },
                ]}
              >
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={method.color}
                />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodName}>{method.name}</Text>
                <Text style={styles.paymentMethodDescription}>
                  {method.description}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.paymentMethodRadio,
                selectedPaymentMethod === method.id &&
                  styles.paymentMethodRadioSelected,
              ]}
            >
              {selectedPaymentMethod === method.id && (
                <View style={styles.paymentMethodRadioInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderOrderSummary = () => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
      >
        <Ionicons name="receipt" size={24} color={ColorPalette.primary[600]} />
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <Ionicons
          name={orderSummaryExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={ColorPalette.neutral[400]}
        />
      </TouchableOpacity>

      {orderSummaryExpanded && (
        <View style={styles.orderSummary}>
          {cart.items.map((item, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>
                {item.item?.name || item.custom_item_name}
              </Text>
              <Text style={styles.summaryItemPrice}>
                {item.quantity} × ₵
                {(item.unit_price || item.custom_budget || 0).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₵{cart.total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee (5%)</Text>
            <Text style={styles.summaryValue}>₵{serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₵{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              ₵{finalTotal.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );

  const renderLocationModal = () => (
    <Portal>
      <Modal
        visible={showLocationModal}
        onDismiss={() => setShowLocationModal(false)}
        contentContainerStyle={styles.locationModalContainer}
      >
        <View style={styles.locationModalContent}>
          <View style={styles.locationModalHeader}>
            <Text style={styles.locationModalTitle}>
              Select Delivery Location
            </Text>
            <TouchableOpacity
              style={styles.locationModalClose}
              onPress={() => setShowLocationModal(false)}
            >
              <Ionicons
                name="close"
                size={24}
                color={ColorPalette.neutral[600]}
              />
            </TouchableOpacity>
          </View>

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.locationMap}
            region={mapRegion}
            onPress={onMapPress}
            onRegionChangeComplete={setMapRegion}
          >
            {locationData && (
              <Marker
                coordinate={{
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                }}
                title="Delivery Location"
              />
            )}
          </MapView>

          {locationData && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationAddress}>{locationData.address}</Text>
              <TouchableOpacity
                style={styles.confirmLocationButton}
                onPress={() => {
                  setAddressInput(locationData.address);
                  setDeliveryInfo((prev) => ({
                    ...prev,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    address: locationData.address,
                  }));
                  setShowLocationModal(false);
                  if (errors.address) {
                    setErrors((prev) => ({ ...prev, address: undefined }));
                  }
                }}
              >
                <Text style={styles.confirmLocationButtonText}>
                  Confirm Location
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </Portal>
  );

  const renderConfirmModal = () => (
    <Portal>
      <Modal
        visible={showConfirmModal}
        onDismiss={() => setShowConfirmModal(false)}
        contentContainerStyle={styles.confirmModalContainer}
      >
        <BlurView intensity={20} style={styles.confirmModalBlur}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalIcon}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={ColorPalette.success[500]}
              />
            </View>
            <Text style={styles.confirmModalTitle}>Confirm Order</Text>
            <Text style={styles.confirmModalMessage}>
              You&apos;re about to place an order for ₵{finalTotal.toFixed(2)}{" "}
              with cash on delivery payment.
            </Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={styles.confirmModalCancel}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalConfirm}
                onPress={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? (
                  <Loading size="small" color="white" />
                ) : (
                  <Text style={styles.confirmModalConfirmText}>
                    Place Order
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </Portal>
  );

  if (cart.items.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View
          style={[
            styles.emptyContainer,
            { paddingBottom: Math.max(insets.bottom + 20, 90) },
          ]}
        >
          <Ionicons
            name="cart-outline"
            size={80}
            color={ColorPalette.neutral[300]}
          />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyMessage}>
            Add some items to your cart before proceeding to checkout.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("HomeTab")}
          >
            <Text style={styles.emptyButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const buttonText =
    selectedPaymentMethod === "cash" ? "Place Order" : "Proceed to Payment";
  const onPress =
    selectedPaymentMethod === "cash"
      ? () => setShowConfirmModal(true)
      : handlePayment;

  return (
    <View style={styles.container}>
      {renderHeader()}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderLocationSection()}
          {renderDeliveryInfo()}
          {renderPaymentMethods()}
          {renderOrderSummary()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Always visible action button */}
      <View
        style={[
          styles.actionContainer,
          { paddingBottom: Math.max(insets.bottom + 20, 90) },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: buttonScaleAnim }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              !isFormValid() && styles.actionButtonDisabled,
            ]}
            onPress={onPress}
            disabled={!isFormValid() || loading}
          >
            <LinearGradient
              colors={[ColorPalette.primary[500], ColorPalette.primary[600]]}
              style={styles.actionButtonGradient}
            >
              {loading ? (
                <Loading size="small" color="white" />
              ) : (
                <>
                  <Text style={styles.actionButtonText}>{buttonText}</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {renderLocationModal()}
      {renderConfirmModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorPalette.neutral[50],
  },
  headerContainer: {
    height: HEADER_HEIGHT,
  },
  headerGradient: {
    flex: 1,
  },
  headerSafeArea: {
    flex: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // Content
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 140, // Extra space for action button + bottom tabs
  },

  // Section
  section: {
    backgroundColor: "white",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    marginLeft: spacing.md,
    flex: 1,
  },

  // Location Input
  locationInputContainer: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    backgroundColor: ColorPalette.neutral[50],
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: ColorPalette.neutral[600],
    fontSize: 14,
  },

  // Error Container
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    backgroundColor: ColorPalette.error[50],
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  errorMessage: {
    marginLeft: spacing.sm,
    color: ColorPalette.error[600],
    fontSize: 14,
  },

  // Predictions
  predictionsContainer: {
    backgroundColor: "white",
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: ColorPalette.neutral[200],
  },

  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ColorPalette.neutral[100],
  },
  predictionText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  predictionMainText: {
    fontSize: 16,
    fontWeight: "500",
    color: ColorPalette.neutral[800],
  },
  predictionSecondaryText: {
    fontSize: 14,
    color: ColorPalette.neutral[500],
    marginTop: 2,
  },
  predictionsFooter: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[100],
    backgroundColor: ColorPalette.neutral[25],
  },
  predictionsFooterText: {
    fontSize: 12,
    color: ColorPalette.neutral[500],
    textAlign: "center",
    fontStyle: "italic",
  },

  // Current Location Button
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: ColorPalette.primary[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  currentLocationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  currentLocationText: {
    marginLeft: spacing.sm,
    color: ColorPalette.primary[600],
    fontWeight: "500",
    fontSize: 16,
  },

  // Map Button
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: ColorPalette.neutral[100],
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  mapButtonText: {
    marginLeft: spacing.sm,
    color: ColorPalette.primary[600],
    fontWeight: "500",
    fontSize: 16,
  },

  // Location Preview
  locationPreview: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    height: 150,
  },
  previewMap: {
    flex: 1,
  },

  // Input Group
  inputGroup: {
    gap: spacing.lg,
  },

  // Payment Methods
  paymentMethods: {
    gap: spacing.md,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: ColorPalette.neutral[300],
    borderRadius: borderRadius.md,
  },
  paymentMethodSelected: {
    borderColor: ColorPalette.primary[500],
    backgroundColor: ColorPalette.primary[50],
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
    marginTop: 2,
  },
  paymentMethodRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ColorPalette.neutral[300],
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethodRadioSelected: {
    borderColor: ColorPalette.primary[500],
  },
  paymentMethodRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ColorPalette.primary[500],
  },

  // Order Summary
  orderSummary: {
    marginTop: spacing.md,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  summaryItemName: {
    fontSize: 14,
    color: ColorPalette.neutral[700],
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.neutral[600],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: ColorPalette.neutral[200],
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: 14,
    color: ColorPalette.neutral[600],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: ColorPalette.neutral[800],
  },
  summaryTotal: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[200],
    marginTop: spacing.md,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.primary[600],
  },

  // Location Modal
  locationModalContainer: {
    margin: 0,
    justifyContent: "flex-end",
  },
  locationModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: "80%",
  },
  locationModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ColorPalette.neutral[200],
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
  },
  locationModalClose: {
    padding: spacing.sm,
  },
  locationMap: {
    flex: 1,
  },
  locationInfo: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[200],
  },
  locationAddress: {
    fontSize: 16,
    color: ColorPalette.neutral[700],
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  confirmLocationButton: {
    backgroundColor: ColorPalette.primary[500],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  confirmLocationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Action Button
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    // paddingBottom is now handled dynamically in the component
    backgroundColor: "white",
    borderTopWidth: 2,
    borderTopColor: ColorPalette.primary[100],
    shadowColor: ColorPalette.primary[900],
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginHorizontal: spacing.sm,
    shadowColor: ColorPalette.primary[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonGradient: {
    paddingVertical: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Confirm Modal
  confirmModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  confirmModalContent: {
    backgroundColor: "white",
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    margin: spacing.xl,
    alignItems: "center",
    maxWidth: SCREEN_WIDTH - spacing.xl * 2,
  },
  confirmModalIcon: {
    marginBottom: spacing.lg,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.md,
    textAlign: "center",
  },
  confirmModalMessage: {
    fontSize: 16,
    color: ColorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  confirmModalActions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  confirmModalCancel: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: ColorPalette.neutral[300],
    alignItems: "center",
  },
  confirmModalCancelText: {
    color: ColorPalette.neutral[600],
    fontSize: 16,
    fontWeight: "500",
  },
  confirmModalConfirm: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: ColorPalette.primary[500],
    alignItems: "center",
  },
  confirmModalConfirmText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: ColorPalette.neutral[600],
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyMessage: {
    fontSize: 16,
    color: ColorPalette.neutral[500],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: ColorPalette.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CheckoutScreen;
