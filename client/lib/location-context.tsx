import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { Platform, Linking, Alert } from "react-native";

type OnLocationUpdateCallback = (lat: number, lon: number) => void;

interface LocationContextType {
  userLocation: Location.LocationObject | null;
  locationPermission: Location.PermissionStatus | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  calculateDistance: (lat: number, lon: number) => number | null;
  registerOnLocationUpdate: (callback: OnLocationUpdateCallback) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const onLocationUpdateCallbackRef = useRef<OnLocationUpdateCallback | null>(null);

  const registerOnLocationUpdate = useCallback((callback: OnLocationUpdateCallback) => {
    onLocationUpdateCallbackRef.current = callback;
  }, []);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      // On web, only fetch location in response to user gesture to avoid browser warning
      // Native platforms can auto-fetch if permission is already granted
      if (status === Location.PermissionStatus.GRANTED && Platform.OS !== "web") {
        await fetchLocation();
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(location);
      if (onLocationUpdateCallbackRef.current) {
        onLocationUpdateCallbackRef.current(
          location.coords.latitude,
          location.coords.longitude
        );
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === Location.PermissionStatus.GRANTED) {
        await fetchLocation();
        return true;
      }

      if (status === Location.PermissionStatus.DENIED && !canAskAgain) {
        if (Platform.OS !== "web") {
          Alert.alert(
            "Location Permission Required",
            "Please enable location access in your device settings to see nearby deals.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (e) {
                    console.error("Could not open settings:", e);
                  }
                },
              },
            ]
          );
        }
      }

      return false;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  const refreshLocation = async () => {
    if (locationPermission === Location.PermissionStatus.GRANTED) {
      await fetchLocation();
    }
  };

  const calculateDistance = useCallback(
    (lat: number, lon: number): number | null => {
      if (!userLocation) return null;
      return haversineDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        lat,
        lon
      );
    },
    [userLocation]
  );

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        locationPermission,
        isLoading,
        requestPermission,
        refreshLocation,
        calculateDistance,
        registerOnLocationUpdate,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
