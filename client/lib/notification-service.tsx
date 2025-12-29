import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PERMISSION_KEY = "@smartdealsiq_notification_permission";
const NEARBY_ALERT_RADIUS_KEY = "@smartdealsiq_nearby_radius";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  hasPermission: boolean;
  nearbyAlertRadius: number;
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const hasPermission = finalStatus === "granted";
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, JSON.stringify(hasPermission));
    return hasPermission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const [permissionStr, radiusStr] = await Promise.all([
      AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY),
      AsyncStorage.getItem(NEARBY_ALERT_RADIUS_KEY),
    ]);

    return {
      hasPermission: permissionStr ? JSON.parse(permissionStr) : false,
      nearbyAlertRadius: radiusStr ? parseFloat(radiusStr) : 0.5,
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return { hasPermission: false, nearbyAlertRadius: 0.5 };
  }
}

export async function setNearbyAlertRadius(radius: number): Promise<void> {
  try {
    await AsyncStorage.setItem(NEARBY_ALERT_RADIUS_KEY, radius.toString());
  } catch (error) {
    console.error("Error saving nearby alert radius:", error);
  }
}

export async function scheduleNearbyVendorNotification(vendorName: string, distance: number): Promise<void> {
  try {
    if (Platform.OS === "web") return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Favorite Vendor Nearby!",
        body: `${vendorName} is ${distance.toFixed(1)} miles away. Check out their deals!`,
        data: { type: "nearby_vendor", vendorName },
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling notifications:", error);
  }
}
