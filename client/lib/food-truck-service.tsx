import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface TruckLocation {
  vendorId: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
  isLive: boolean;
}

export interface LocationHistoryEntry {
  id: string;
  vendorId: string;
  latitude: number;
  longitude: number;
  address?: string;
  startTime: string;
  endTime?: string;
  customersServed?: number;
  revenue?: number;
  notes?: string;
}

export interface LocationAnalytics {
  locationId: string;
  address: string;
  visitCount: number;
  avgCustomers: number;
  avgRevenue: number;
  bestDays: string[];
  bestTimeSlot: string;
  rating: number; // 1-5 based on performance
}

export interface FeaturedListing {
  vendorId: string;
  startDate: string;
  endDate: string;
  boostLevel: "basic" | "premium" | "spotlight";
  impressions: number;
  clicks: number;
}

export interface GeoFenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}

export interface GeoFenceAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  vendorId: string;
  vendorName: string;
  eventType: "enter" | "exit";
  timestamp: string;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  LIVE_TRUCKS: "@smartdealsiq_live_trucks",
  LOCATION_HISTORY: "@smartdealsiq_location_history",
  GEOFENCE_ZONES: "@smartdealsiq_geofence_zones",
  FAVORITE_ZONES: "@smartdealsiq_favorite_zones",
  FEATURED_LISTINGS: "@smartdealsiq_featured_listings",
};

// ============================================
// FEATURED LISTING PRICING
// ============================================

export const BOOST_PRICING = {
  basic: {
    id: "boost_basic",
    name: "Basic Boost",
    price: 4.99,
    duration: 24, // hours
    description: "Appear higher in search results for 24 hours",
    multiplier: 1.5,
    features: ["Priority in search", "Badge on listing"],
  },
  premium: {
    id: "boost_premium",
    name: "Premium Boost",
    price: 14.99,
    duration: 72, // hours
    description: "Maximum visibility for 3 days",
    multiplier: 2.5,
    features: ["Top of search", "Featured badge", "Push to nearby users", "Analytics"],
  },
  spotlight: {
    id: "boost_spotlight",
    name: "Spotlight",
    price: 29.99,
    duration: 168, // hours (1 week)
    description: "Be the featured truck of the week",
    multiplier: 5,
    features: ["Homepage feature", "Spotlight banner", "Social media shoutout", "Premium analytics", "Priority support"],
  },
};

// ============================================
// POPULAR GEOFENCE ZONES (Pre-configured)
// ============================================

export const POPULAR_ZONES: GeoFenceZone[] = [
  // Miami
  { id: "zone_miami_downtown", name: "Downtown Miami", latitude: 25.7617, longitude: -80.1918, radiusMeters: 2000, notifyOnEnter: true, notifyOnExit: false },
  { id: "zone_miami_beach", name: "Miami Beach", latitude: 25.7907, longitude: -80.1300, radiusMeters: 3000, notifyOnEnter: true, notifyOnExit: false },
  { id: "zone_miami_wynwood", name: "Wynwood", latitude: 25.8010, longitude: -80.1993, radiusMeters: 1500, notifyOnEnter: true, notifyOnExit: false },
  // Orlando
  { id: "zone_orlando_downtown", name: "Downtown Orlando", latitude: 28.5383, longitude: -81.3792, radiusMeters: 2500, notifyOnEnter: true, notifyOnExit: false },
  { id: "zone_orlando_mills", name: "Mills 50", latitude: 28.5570, longitude: -81.3650, radiusMeters: 1500, notifyOnEnter: true, notifyOnExit: false },
  // Tampa
  { id: "zone_tampa_downtown", name: "Downtown Tampa", latitude: 27.9506, longitude: -82.4572, radiusMeters: 2000, notifyOnEnter: true, notifyOnExit: false },
  { id: "zone_tampa_ybor", name: "Ybor City", latitude: 27.9600, longitude: -82.4380, radiusMeters: 1500, notifyOnEnter: true, notifyOnExit: false },
];

// ============================================
// LOCATION TRACKING SERVICE
// ============================================

class FoodTruckService {
  private liveTrucks: Map<string, TruckLocation> = new Map();
  private locationHistory: LocationHistoryEntry[] = [];
  private featuredListings: FeaturedListing[] = [];
  private userGeoFenceZones: GeoFenceZone[] = [];
  private locationSubscription: Location.LocationSubscription | null = null;
  private listeners: Set<(trucks: TruckLocation[]) => void> = new Set();

  // ============================================
  // INITIALIZATION
  // ============================================

  async initialize(): Promise<void> {
    await this.loadFromStorage();
    if (__DEV__) console.log("FoodTruckService initialized");
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const [liveTrucksData, historyData, zonesData, featuredData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LIVE_TRUCKS),
        AsyncStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.GEOFENCE_ZONES),
        AsyncStorage.getItem(STORAGE_KEYS.FEATURED_LISTINGS),
      ]);

      if (liveTrucksData) {
        const trucks = JSON.parse(liveTrucksData) as TruckLocation[];
        trucks.forEach((t) => this.liveTrucks.set(t.vendorId, t));
      }

      if (historyData) {
        this.locationHistory = JSON.parse(historyData);
      }

      if (zonesData) {
        this.userGeoFenceZones = JSON.parse(zonesData);
      }

      if (featuredData) {
        this.featuredListings = JSON.parse(featuredData);
      }
    } catch (error) {
      console.error("Failed to load food truck data:", error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const liveTrucksArray = Array.from(this.liveTrucks.values());
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.LIVE_TRUCKS, JSON.stringify(liveTrucksArray)),
        AsyncStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(this.locationHistory)),
        AsyncStorage.setItem(STORAGE_KEYS.GEOFENCE_ZONES, JSON.stringify(this.userGeoFenceZones)),
        AsyncStorage.setItem(STORAGE_KEYS.FEATURED_LISTINGS, JSON.stringify(this.featuredListings)),
      ]);
    } catch (error) {
      console.error("Failed to save food truck data:", error);
    }
  }

  // ============================================
  // TRUCK IS LIVE TOGGLE
  // ============================================

  async goLive(vendorId: string, vendorName: string): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Location permission not granted");
        return false;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = addressResult
        ? `${addressResult.street || ""} ${addressResult.city || ""}, ${addressResult.region || ""}`
        : undefined;

      const truckLocation: TruckLocation = {
        vendorId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
        timestamp: new Date().toISOString(),
        isLive: true,
      };

      this.liveTrucks.set(vendorId, truckLocation);
      await this.saveToStorage();
      this.notifyListeners();

      // Start location history entry
      await this.startLocationSession(vendorId, truckLocation);

      // Notify nearby users
      await this.notifyNearbyUsers(vendorId, vendorName, truckLocation);

      return true;
    } catch (error) {
      console.error("Failed to go live:", error);
      return false;
    }
  }

  async goOffline(vendorId: string, sessionStats?: { customersServed?: number; revenue?: number }): Promise<void> {
    const truck = this.liveTrucks.get(vendorId);
    if (truck) {
      truck.isLive = false;
      this.liveTrucks.set(vendorId, truck);
      await this.saveToStorage();
      this.notifyListeners();

      // End location history session
      await this.endLocationSession(vendorId, sessionStats);
    }
  }

  async updateLiveLocation(vendorId: string): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const truck = this.liveTrucks.get(vendorId);
      if (truck && truck.isLive) {
        truck.latitude = location.coords.latitude;
        truck.longitude = location.coords.longitude;
        truck.timestamp = new Date().toISOString();
        this.liveTrucks.set(vendorId, truck);
        await this.saveToStorage();
        this.notifyListeners();
      }
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  }

  getLiveTrucks(): TruckLocation[] {
    return Array.from(this.liveTrucks.values()).filter((t) => t.isLive);
  }

  isVendorLive(vendorId: string): boolean {
    const truck = this.liveTrucks.get(vendorId);
    return truck?.isLive ?? false;
  }

  // Subscribe to live truck updates
  subscribe(callback: (trucks: TruckLocation[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const trucks = this.getLiveTrucks();
    this.listeners.forEach((callback) => callback(trucks));
  }

  // ============================================
  // LOCATION HISTORY
  // ============================================

  private async startLocationSession(vendorId: string, location: TruckLocation): Promise<void> {
    const entry: LocationHistoryEntry = {
      id: `loc_${Date.now()}`,
      vendorId,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      startTime: new Date().toISOString(),
    };
    this.locationHistory.push(entry);
    await this.saveToStorage();
  }

  private async endLocationSession(
    vendorId: string,
    stats?: { customersServed?: number; revenue?: number }
  ): Promise<void> {
    const entry = this.locationHistory.find(
      (e) => e.vendorId === vendorId && !e.endTime
    );
    if (entry) {
      entry.endTime = new Date().toISOString();
      entry.customersServed = stats?.customersServed;
      entry.revenue = stats?.revenue;
      await this.saveToStorage();
    }
  }

  getLocationHistory(vendorId: string): LocationHistoryEntry[] {
    return this.locationHistory
      .filter((e) => e.vendorId === vendorId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async addLocationNote(entryId: string, notes: string): Promise<void> {
    const entry = this.locationHistory.find((e) => e.id === entryId);
    if (entry) {
      entry.notes = notes;
      await this.saveToStorage();
    }
  }

  // ============================================
  // LOCATION ANALYTICS
  // ============================================

  getLocationAnalytics(vendorId: string): LocationAnalytics[] {
    const history = this.getLocationHistory(vendorId);
    const locationMap = new Map<string, LocationHistoryEntry[]>();

    // Group by approximate location (rounded to 3 decimal places ~111m)
    history.forEach((entry) => {
      const key = `${entry.latitude.toFixed(3)},${entry.longitude.toFixed(3)}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, []);
      }
      locationMap.get(key)!.push(entry);
    });

    const analytics: LocationAnalytics[] = [];

    locationMap.forEach((entries, key) => {
      const [lat, lng] = key.split(",");
      const customers = entries.filter((e) => e.customersServed).map((e) => e.customersServed!);
      const revenues = entries.filter((e) => e.revenue).map((e) => e.revenue!);

      // Calculate best days
      const dayCount: Record<string, number> = {};
      entries.forEach((e) => {
        const day = new Date(e.startTime).toLocaleDateString("en-US", { weekday: "long" });
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
      const bestDays = Object.entries(dayCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => day);

      // Calculate best time slot
      const hourCount: Record<number, number> = {};
      entries.forEach((e) => {
        const hour = new Date(e.startTime).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      });
      const bestHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
      const bestTimeSlot = bestHour ? `${bestHour[0]}:00 - ${parseInt(bestHour[0]) + 1}:00` : "N/A";

      // Calculate rating based on performance
      const avgRev = revenues.length ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;
      const rating = Math.min(5, Math.max(1, Math.round(avgRev / 100)));

      analytics.push({
        locationId: key,
        address: entries[0].address || `${lat}, ${lng}`,
        visitCount: entries.length,
        avgCustomers: customers.length ? Math.round(customers.reduce((a, b) => a + b, 0) / customers.length) : 0,
        avgRevenue: avgRev,
        bestDays,
        bestTimeSlot,
        rating,
      });
    });

    return analytics.sort((a, b) => b.avgRevenue - a.avgRevenue);
  }

  getBestLocations(vendorId: string, limit: number = 5): LocationAnalytics[] {
    return this.getLocationAnalytics(vendorId).slice(0, limit);
  }

  // ============================================
  // FEATURED LISTINGS
  // ============================================

  async purchaseBoost(
    vendorId: string,
    boostLevel: "basic" | "premium" | "spotlight"
  ): Promise<FeaturedListing | null> {
    const boost = BOOST_PRICING[boostLevel];
    const now = new Date();
    const endDate = new Date(now.getTime() + boost.duration * 60 * 60 * 1000);

    const listing: FeaturedListing = {
      vendorId,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      boostLevel,
      impressions: 0,
      clicks: 0,
    };

    // Remove any existing listing for this vendor
    this.featuredListings = this.featuredListings.filter((l) => l.vendorId !== vendorId);
    this.featuredListings.push(listing);
    await this.saveToStorage();

    return listing;
  }

  getActiveBoost(vendorId: string): FeaturedListing | null {
    const now = new Date();
    return (
      this.featuredListings.find(
        (l) => l.vendorId === vendorId && new Date(l.endDate) > now
      ) || null
    );
  }

  getFeaturedVendors(): string[] {
    const now = new Date();
    return this.featuredListings
      .filter((l) => new Date(l.endDate) > now)
      .sort((a, b) => {
        const boostOrder = { spotlight: 3, premium: 2, basic: 1 };
        return boostOrder[b.boostLevel] - boostOrder[a.boostLevel];
      })
      .map((l) => l.vendorId);
  }

  getBoostMultiplier(vendorId: string): number {
    const boost = this.getActiveBoost(vendorId);
    if (!boost) return 1;
    return BOOST_PRICING[boost.boostLevel].multiplier;
  }

  async recordImpression(vendorId: string): Promise<void> {
    const listing = this.featuredListings.find((l) => l.vendorId === vendorId);
    if (listing) {
      listing.impressions++;
      await this.saveToStorage();
    }
  }

  async recordClick(vendorId: string): Promise<void> {
    const listing = this.featuredListings.find((l) => l.vendorId === vendorId);
    if (listing) {
      listing.clicks++;
      await this.saveToStorage();
    }
  }

  // ============================================
  // GEO-FENCE ALERTS
  // ============================================

  async subscribeToZone(zone: GeoFenceZone): Promise<void> {
    if (!this.userGeoFenceZones.find((z) => z.id === zone.id)) {
      this.userGeoFenceZones.push(zone);
      await this.saveToStorage();
    }
  }

  async unsubscribeFromZone(zoneId: string): Promise<void> {
    this.userGeoFenceZones = this.userGeoFenceZones.filter((z) => z.id !== zoneId);
    await this.saveToStorage();
  }

  getSubscribedZones(): GeoFenceZone[] {
    return this.userGeoFenceZones;
  }

  // Check if a truck entered any subscribed zones
  async checkGeoFences(
    vendorId: string,
    vendorName: string,
    latitude: number,
    longitude: number
  ): Promise<GeoFenceAlert[]> {
    const alerts: GeoFenceAlert[] = [];

    for (const zone of this.userGeoFenceZones) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        zone.latitude,
        zone.longitude
      );

      if (distance <= zone.radiusMeters && zone.notifyOnEnter) {
        const alert: GeoFenceAlert = {
          id: `alert_${Date.now()}`,
          zoneId: zone.id,
          zoneName: zone.name,
          vendorId,
          vendorName,
          eventType: "enter",
          timestamp: new Date().toISOString(),
        };
        alerts.push(alert);

        // Send notification
        await this.sendGeoFenceNotification(alert);
      }
    }

    return alerts;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private async sendGeoFenceNotification(alert: GeoFenceAlert): Promise<void> {
    // Skip notifications on web
    if (Platform.OS === "web") return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${alert.vendorName} is nearby!`,
          body: `${alert.vendorName} just arrived in ${alert.zoneName}`,
          data: {
            type: "geofence_alert",
            vendorId: alert.vendorId,
            zoneId: alert.zoneId,
          },
          sound: "default",
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error("Failed to send geofence notification:", error);
    }
  }

  private async notifyNearbyUsers(
    vendorId: string,
    vendorName: string,
    location: TruckLocation
  ): Promise<void> {
    // Skip notifications on web
    if (Platform.OS === "web") return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${vendorName} is now live!`,
          body: location.address
            ? `Open now at ${location.address}`
            : "Check the map to find them!",
          data: {
            type: "truck_live",
            vendorId,
          },
          sound: "default",
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Failed to send live notification:", error);
    }
  }
}

// Export singleton instance
export const foodTruckService = new FoodTruckService();

// Export hook for React components
export function useFoodTruckService() {
  return foodTruckService;
}
