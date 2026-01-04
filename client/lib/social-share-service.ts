import { Share, Platform, Linking } from "react-native";
import * as Sharing from "expo-sharing";

export type SharePlatform = "facebook" | "instagram" | "twitter" | "whatsapp" | "sms" | "native";

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
  imageUrl?: string;
}

export interface FoodTruckShareData {
  truckName: string;
  location?: string;
  isOpen: boolean;
  cuisineType?: string;
  deal?: string;
  appLink?: string;
}

export interface VendorShareData {
  vendorName: string;
  type: "live" | "special" | "location";
  location?: string;
  specialTitle?: string;
  specialDiscount?: number;
  appLink?: string;
}

// App store links (replace with actual links when published)
const APP_STORE_LINK = "https://smartdealsiq.app/download";
const PLAY_STORE_LINK = "https://smartdealsiq.app/download";

class SocialShareService {
  private getAppLink(): string {
    return Platform.OS === "ios" ? APP_STORE_LINK : PLAY_STORE_LINK;
  }

  // Generate share message for food truck (customer sharing)
  generateFoodTruckMessage(data: FoodTruckShareData): ShareContent {
    const statusEmoji = data.isOpen ? "🟢" : "🔴";
    const status = data.isOpen ? "Open now!" : "Currently closed";

    let message = `${statusEmoji} Check out ${data.truckName}!\n\n`;

    if (data.cuisineType) {
      message += `🍽️ ${data.cuisineType}\n`;
    }

    if (data.location) {
      message += `📍 ${data.location}\n`;
    }

    message += `${status}\n`;

    if (data.deal) {
      message += `\n🔥 ${data.deal}\n`;
    }

    message += `\nFind more deals on SmartDealsIQ™!\n${data.appLink || this.getAppLink()}`;

    return {
      title: `${data.truckName} on SmartDealsIQ™`,
      message,
      url: data.appLink || this.getAppLink(),
    };
  }

  // Generate share message for vendor sharing
  generateVendorMessage(data: VendorShareData): ShareContent {
    let title = "";
    let message = "";

    switch (data.type) {
      case "live":
        title = `${data.vendorName} is LIVE!`;
        message = `🚚 ${data.vendorName} is LIVE now!\n\n`;
        if (data.location) {
          message += `📍 Find us at: ${data.location}\n`;
        }
        message += `\nCome grab some delicious food! 🍔🌮🍕\n`;
        message += `\nDownload SmartDealsIQ™ to find us:\n${data.appLink || this.getAppLink()}`;
        break;

      case "special":
        title = `${data.vendorName} - Special Deal!`;
        message = `🔥 SPECIAL DEAL from ${data.vendorName}!\n\n`;
        if (data.specialTitle) {
          message += `${data.specialTitle}\n`;
        }
        if (data.specialDiscount) {
          message += `💰 ${data.specialDiscount}% OFF!\n`;
        }
        if (data.location) {
          message += `📍 ${data.location}\n`;
        }
        message += `\nDon't miss out! Find us on SmartDealsIQ™:\n${data.appLink || this.getAppLink()}`;
        break;

      case "location":
        title = `${data.vendorName} - New Location!`;
        message = `📍 ${data.vendorName} is at a new spot!\n\n`;
        if (data.location) {
          message += `Find us at: ${data.location}\n`;
        }
        message += `\nTrack our location on SmartDealsIQ™:\n${data.appLink || this.getAppLink()}`;
        break;
    }

    return { title, message, url: data.appLink || this.getAppLink() };
  }

  // Share using native share sheet
  async shareNative(content: ShareContent): Promise<boolean> {
    try {
      // On web, try the Web Share API first
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: content.title,
          text: content.message,
          url: content.url,
        });
        return true;
      }

      // Fallback for web without Web Share API - copy to clipboard
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(content.message);
          alert("Link copied to clipboard!");
          return true;
        }
        return false;
      }

      // Native platforms (iOS/Android)
      const result = await Share.share({
        message: content.message,
        title: content.title,
        url: content.url,
      });

      return result?.action === Share.sharedAction;
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error)?.name === "AbortError") {
        // User cancelled the share - not an error
        return false;
      }
      console.error("Native share failed:", error);
      return false;
    }
  }

  // Share to specific platform
  async shareToPlatform(platform: SharePlatform, content: ShareContent): Promise<boolean> {
    const encodedMessage = encodeURIComponent(content.message);
    const encodedUrl = encodeURIComponent(content.url || "");

    let url = "";

    switch (platform) {
      case "facebook":
        // Facebook sharing - opens share dialog
        url = `https://www.facebook.com/sharer/sharer.php?quote=${encodedMessage}&u=${encodedUrl}`;
        break;

      case "twitter":
        // X/Twitter sharing
        url = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        break;

      case "whatsapp":
        // WhatsApp sharing
        url = `whatsapp://send?text=${encodedMessage}`;
        break;

      case "instagram":
        // Instagram doesn't support direct text sharing, open app
        // For stories, would need expo-sharing with image
        if (Platform.OS === "ios") {
          url = "instagram://app";
        } else {
          url = "https://www.instagram.com/";
        }
        break;

      case "sms":
        // SMS sharing
        url = Platform.OS === "ios"
          ? `sms:&body=${encodedMessage}`
          : `sms:?body=${encodedMessage}`;
        break;

      case "native":
      default:
        return this.shareNative(content);
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback to native share if platform not available
        if (__DEV__) console.log(`Cannot open ${platform}, falling back to native share`);
        return this.shareNative(content);
      }
    } catch (error) {
      console.error(`Share to ${platform} failed:`, error);
      return false;
    }
  }

  // Check if sharing is available
  async isShareAvailable(): Promise<boolean> {
    try {
      return await Sharing.isAvailableAsync();
    } catch {
      return true; // Fallback to native Share API
    }
  }

  // Quick share for vendors - "We're Live!"
  async shareWeAreLive(vendorName: string, location?: string): Promise<boolean> {
    const content = this.generateVendorMessage({
      vendorName,
      type: "live",
      location,
    });
    return this.shareNative(content);
  }

  // Quick share for vendors - Daily Special
  async shareDailySpecial(
    vendorName: string,
    specialTitle: string,
    discount: number,
    location?: string
  ): Promise<boolean> {
    const content = this.generateVendorMessage({
      vendorName,
      type: "special",
      specialTitle,
      specialDiscount: discount,
      location,
    });
    return this.shareNative(content);
  }

  // Quick share for vendors - New Location
  async shareNewLocation(vendorName: string, location: string): Promise<boolean> {
    const content = this.generateVendorMessage({
      vendorName,
      type: "location",
      location,
    });
    return this.shareNative(content);
  }

  // Customer sharing a food truck
  async shareFoodTruck(data: FoodTruckShareData, platform: SharePlatform = "native"): Promise<boolean> {
    const content = this.generateFoodTruckMessage(data);
    return this.shareToPlatform(platform, content);
  }
}

export const socialShareService = new SocialShareService();
