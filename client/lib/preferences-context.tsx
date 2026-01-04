import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NotificationPreferences {
  pushEnabled: boolean;
  dealAlerts: boolean;
  flashDeals: boolean;
  priceDrops: boolean;
  newStores: boolean;
  weeklyDigest: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface LocationPreferences {
  locationEnabled: boolean;
  searchRadius: number; // in miles
  autoUpdateLocation: boolean;
  showDistanceInKm: boolean;
  defaultCity: string;
}

interface PreferencesContextType {
  notifications: NotificationPreferences;
  location: LocationPreferences;
  updateNotifications: (updates: Partial<NotificationPreferences>) => Promise<void>;
  updateLocation: (updates: Partial<LocationPreferences>) => Promise<void>;
  isLoaded: boolean;
}

const defaultNotifications: NotificationPreferences = {
  pushEnabled: true,
  dealAlerts: true,
  flashDeals: true,
  priceDrops: true,
  newStores: false,
  weeklyDigest: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

const defaultLocation: LocationPreferences = {
  locationEnabled: true,
  searchRadius: 10,
  autoUpdateLocation: true,
  showDistanceInKm: false,
  defaultCity: "",
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const NOTIFICATIONS_KEY = "@smartdealsiq_notifications";
const LOCATION_KEY = "@smartdealsiq_location_prefs";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotifications);
  const [location, setLocation] = useState<LocationPreferences>(defaultLocation);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [savedNotifications, savedLocation] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
        AsyncStorage.getItem(LOCATION_KEY),
      ]);

      if (savedNotifications) {
        setNotifications({ ...defaultNotifications, ...JSON.parse(savedNotifications) });
      }
      if (savedLocation) {
        setLocation({ ...defaultLocation, ...JSON.parse(savedLocation) });
      }
    } catch (error) {
      console.error("[Preferences] Failed to load preferences:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateNotifications = async (updates: Partial<NotificationPreferences>) => {
    try {
      const newNotifications = { ...notifications, ...updates };
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newNotifications));
      setNotifications(newNotifications);
    } catch (error) {
      console.error("[Preferences] Failed to save notification preferences:", error);
    }
  };

  const updateLocation = async (updates: Partial<LocationPreferences>) => {
    try {
      const newLocation = { ...location, ...updates };
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(newLocation));
      setLocation(newLocation);
    } catch (error) {
      console.error("[Preferences] Failed to save location preferences:", error);
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        notifications,
        location,
        updateNotifications,
        updateLocation,
        isLoaded,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
