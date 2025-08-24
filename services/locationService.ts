import * as Location from "expo-location";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends LocationCoordinates {
  address: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  message: string;
}

export class LocationService {
  private static instance: LocationService;
  private static readonly GHANA_BOUNDS = {
    north: 11.174,
    south: 4.737,
    east: 1.191,
    west: -3.261,
  };

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        message: this.getPermissionMessage(status, canAskAgain),
      };
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return {
        granted: false,
        canAskAgain: false,
        message: "Failed to request location permission",
      };
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        throw new Error(permission.message);
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const { latitude, longitude } = location.coords;

      // Validate location is within Ghana bounds (for this app)
      if (!this.isLocationInGhana(latitude, longitude)) {
        console.warn("Location is outside Ghana bounds");
      }

      const addressData = await this.reverseGeocode(latitude, longitude);

      return {
        latitude,
        longitude,
        address: addressData.address,
        city: addressData.city,
        region: addressData.region,
        country: addressData.country,
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  }

  /**
   * Reverse geocode - convert coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const result = results[0];
        const address = this.formatAddress(result);

        return {
          latitude,
          longitude,
          address,
          city: result.city || result.subregion || undefined,
          region: result.region || undefined,
          country: result.country || "Ghana",
        };
      }

      // Fallback if no results
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        country: "Ghana",
      };
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        country: "Ghana",
      };
    }
  }

  /**
   * Forward geocode - convert address to coordinates
   */
  async forwardGeocode(address: string): Promise<LocationCoordinates | null> {
    try {
      const results = await Location.geocodeAsync(address);

      if (results && results.length > 0) {
        const result = results[0];
        return {
          latitude: result.latitude,
          longitude: result.longitude,
        };
      }

      return null;
    } catch (error) {
      console.error("Error forward geocoding:", error);
      return null;
    }
  }

  /**
   * Calculate distance between two points in kilometers
   */
  calculateDistance(
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate estimated delivery time based on distance
   */
  calculateEstimatedDeliveryTime(distanceKm: number): number {
    // Base time: 15 minutes
    // Add 3 minutes per kilometer
    const baseTime = 15;
    const timePerKm = 3;

    const estimatedTime = baseTime + (distanceKm * timePerKm);

    // Round to nearest 5 minutes and minimum 15 minutes
    return Math.max(15, Math.round(estimatedTime / 5) * 5);
  }

  /**
   * Check if location is within Ghana bounds
   */
  private isLocationInGhana(latitude: number, longitude: number): boolean {
    return (
      latitude >= LocationService.GHANA_BOUNDS.south &&
      latitude <= LocationService.GHANA_BOUNDS.north &&
      longitude >= LocationService.GHANA_BOUNDS.west &&
      longitude <= LocationService.GHANA_BOUNDS.east
    );
  }

  /**
   * Format address from geocoding result
   */
  private formatAddress(result: Location.LocationGeocodedAddress): string {
    const parts: string[] = [];

    // Add street number and name
    if (result.streetNumber) {
      parts.push(result.streetNumber);
    }
    if (result.street) {
      parts.push(result.street);
    } else if (result.name) {
      parts.push(result.name);
    }

    // Add district or subregion
    if (result.district) {
      parts.push(result.district);
    } else if (result.subregion) {
      parts.push(result.subregion);
    }

    // Add city
    if (result.city) {
      parts.push(result.city);
    }

    // Add region if different from city
    if (result.region && result.region !== result.city) {
      parts.push(result.region);
    }

    return parts.filter(Boolean).join(", ") || "Unknown Address";
  }

  /**
   * Get permission status message
   */
  private getPermissionMessage(
    status: Location.PermissionStatus,
    canAskAgain: boolean
  ): string {
    switch (status) {
      case Location.PermissionStatus.GRANTED:
        return "Location permission granted";
      case Location.PermissionStatus.DENIED:
        return canAskAgain
          ? "Location permission denied. Please allow location access."
          : "Location permission permanently denied. Please enable in device settings.";
      case Location.PermissionStatus.UNDETERMINED:
        return "Location permission not determined";
      default:
        return "Unknown location permission status";
    }
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get popular locations in Ghana (for suggestions)
   */
  getPopularLocations(): Array<{ name: string; coordinates: LocationCoordinates }> {
    return [
      {
        name: "University of Ghana, Legon",
        coordinates: { latitude: 5.6519, longitude: -0.1869 },
      },
      {
        name: "Kwame Nkrumah University of Science and Technology",
        coordinates: { latitude: 6.6745, longitude: -1.5716 },
      },
      {
        name: "University of Cape Coast",
        coordinates: { latitude: 5.1127, longitude: -1.2821 },
      },
      {
        name: "Accra Mall",
        coordinates: { latitude: 5.6037, longitude: -0.1870 },
      },
      {
        name: "Kotoka International Airport",
        coordinates: { latitude: 5.6052, longitude: -0.1678 },
      },
      {
        name: "Kumasi Central Market",
        coordinates: { latitude: 6.6885, longitude: -1.6244 },
      },
    ];
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(coordinates: LocationCoordinates): string {
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  }

  /**
   * Check if device location services are enabled
   */
  async isLocationServicesEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error("Error checking location services:", error);
      return false;
    }
  }

  /**
   * Get location accuracy description
   */
  getAccuracyDescription(accuracy?: number): string {
    if (!accuracy) return "Unknown accuracy";

    if (accuracy <= 10) return "High accuracy";
    if (accuracy <= 50) return "Medium accuracy";
    if (accuracy <= 100) return "Low accuracy";
    return "Very low accuracy";
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();

// Export default
export default locationService;
