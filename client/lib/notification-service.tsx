import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PERMISSION_KEY = "@smartdealsiq_notification_permission";
const NEARBY_ALERT_RADIUS_KEY = "@smartdealsiq_nearby_radius";
const FLASH_DEALS_ENABLED_KEY = "@smartdealsiq_flash_deals_enabled";
const SUBSCRIBED_CATEGORIES_KEY = "@smartdealsiq_subscribed_categories";
const SUBSCRIBED_VENDORS_KEY = "@smartdealsiq_subscribed_vendors";

// Only set notification handler on native platforms
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface NotificationSettings {
  hasPermission: boolean;
  nearbyAlertRadius: number;
  flashDealsEnabled: boolean;
  subscribedCategories: string[];
  subscribedVendors: string[];
}

export interface FlashDeal {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  expiresAt: string;
  createdAt: string;
  category?: string;
  image?: string;
  isFlash: true;
  maxRedemptions?: number;
  currentRedemptions: number;
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
    const [permissionStr, radiusStr, flashStr, categoriesStr, vendorsStr] = await Promise.all([
      AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY),
      AsyncStorage.getItem(NEARBY_ALERT_RADIUS_KEY),
      AsyncStorage.getItem(FLASH_DEALS_ENABLED_KEY),
      AsyncStorage.getItem(SUBSCRIBED_CATEGORIES_KEY),
      AsyncStorage.getItem(SUBSCRIBED_VENDORS_KEY),
    ]);

    return {
      hasPermission: permissionStr ? JSON.parse(permissionStr) : false,
      nearbyAlertRadius: radiusStr ? parseFloat(radiusStr) : 0.5,
      flashDealsEnabled: flashStr ? JSON.parse(flashStr) : true,
      subscribedCategories: categoriesStr ? JSON.parse(categoriesStr) : [],
      subscribedVendors: vendorsStr ? JSON.parse(vendorsStr) : [],
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return {
      hasPermission: false,
      nearbyAlertRadius: 0.5,
      flashDealsEnabled: true,
      subscribedCategories: [],
      subscribedVendors: [],
    };
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

// Flash Deal Notification Functions

export async function setFlashDealsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(FLASH_DEALS_ENABLED_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error("Error saving flash deals setting:", error);
  }
}

export async function subscribeToCategory(category: string): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    const categories = [...settings.subscribedCategories];
    if (!categories.includes(category)) {
      categories.push(category);
      await AsyncStorage.setItem(SUBSCRIBED_CATEGORIES_KEY, JSON.stringify(categories));
    }
  } catch (error) {
    console.error("Error subscribing to category:", error);
  }
}

export async function unsubscribeFromCategory(category: string): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    const categories = settings.subscribedCategories.filter((c) => c !== category);
    await AsyncStorage.setItem(SUBSCRIBED_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error("Error unsubscribing from category:", error);
  }
}

export async function subscribeToVendor(vendorId: string): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    const vendors = [...settings.subscribedVendors];
    if (!vendors.includes(vendorId)) {
      vendors.push(vendorId);
      await AsyncStorage.setItem(SUBSCRIBED_VENDORS_KEY, JSON.stringify(vendors));
    }
  } catch (error) {
    console.error("Error subscribing to vendor:", error);
  }
}

export async function unsubscribeFromVendor(vendorId: string): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    const vendors = settings.subscribedVendors.filter((v) => v !== vendorId);
    await AsyncStorage.setItem(SUBSCRIBED_VENDORS_KEY, JSON.stringify(vendors));
  } catch (error) {
    console.error("Error unsubscribing from vendor:", error);
  }
}

export async function sendFlashDealNotification(flashDeal: FlashDeal): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // For web, use browser notifications if available
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Flash Deal: ${flashDeal.title}`, {
          body: `${flashDeal.discountPercent}% OFF at ${flashDeal.vendorName}! Expires soon.`,
          icon: "/icon.png",
          tag: flashDeal.id,
        });
      }
      return;
    }

    const settings = await getNotificationSettings();
    if (!settings.flashDealsEnabled) return;

    // Check if user is subscribed to this vendor or category
    const isSubscribedToVendor = settings.subscribedVendors.includes(flashDeal.vendorId);
    const isSubscribedToCategory = flashDeal.category && settings.subscribedCategories.includes(flashDeal.category);

    // Send notification if subscribed to "all" (empty arrays mean all) or specifically subscribed
    const shouldNotify =
      (settings.subscribedVendors.length === 0 && settings.subscribedCategories.length === 0) ||
      isSubscribedToVendor ||
      isSubscribedToCategory;

    if (!shouldNotify) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚡ Flash Deal: ${flashDeal.discountPercent}% OFF!`,
        body: `${flashDeal.title} at ${flashDeal.vendorName}. Was $${flashDeal.originalPrice}, now $${flashDeal.discountedPrice}!`,
        data: {
          type: "flash_deal",
          dealId: flashDeal.id,
          vendorId: flashDeal.vendorId,
        },
        sound: "default",
        badge: 1,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error("Error sending flash deal notification:", error);
  }
}

export async function scheduleFlashDealReminder(flashDeal: FlashDeal, minutesBefore: number = 5): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;

    const expiresAt = new Date(flashDeal.expiresAt);
    const reminderTime = new Date(expiresAt.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();

    if (reminderTime <= now) return null;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Flash Deal Ending Soon!`,
        body: `"${flashDeal.title}" at ${flashDeal.vendorName} expires in ${minutesBefore} minutes!`,
        data: {
          type: "flash_deal_reminder",
          dealId: flashDeal.id,
          vendorId: flashDeal.vendorId,
        },
        sound: "default",
      },
      trigger: {
        type: "date",
        date: reminderTime,
      } as Notifications.DateTriggerInput,
    });

    return identifier;
  } catch (error) {
    console.error("Error scheduling flash deal reminder:", error);
    return null;
  }
}

export async function requestWebNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}
