import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./auth-context";

// Demo mode - matches auth-context setting
const DEMO_MODE_ENABLED = false;

// Vendor listing types matching server schema
export type VendorCategory = "food_truck" | "restaurant" | "vendor";
export type VendorTier = "free";

export interface ProductPhoto {
  id: string;
  uri: string;
  caption?: string;
  createdAt: string;
}

export interface VendorListing {
  id: string;
  userId: string;
  businessName: string;
  category: VendorCategory;
  description?: string | null;
  phone?: string | null;
  locationLat: number;
  locationLng: number;
  city: string;
  state: string;
  vendorTier: VendorTier;
  productPhotos?: ProductPhoto[];
  createdAt: string;
  updatedAt: string;
  lastLocationUpdate: string;
}

// Public vendor info (for map display - excludes sensitive data)
export interface PublicVendorListing {
  id: string;
  businessName: string;
  category: VendorCategory;
  description?: string | null;
  phone?: string | null;
  locationLat: number;
  locationLng: number;
  city: string;
  state: string;
  productPhotos?: ProductPhoto[];
  lastLocationUpdate: string;
}

export interface CreateListingData {
  businessName: string;
  category: VendorCategory;
  description?: string;
  phone?: string;
  locationLat: number;
  locationLng: number;
  city: string;
  state: string;
  productPhotos?: ProductPhoto[];
}

export interface UpdateLocationData {
  locationLat: number;
  locationLng: number;
  city?: string;
  state?: string;
}

interface TierLimits {
  staticLocationOnly: boolean;
  locationUpdateCooldownMinutes: number;
  noRealTimeTracking: boolean;
  noPromotions: boolean;
  noPriorityPlacement: boolean;
}

interface VendorListingContextType {
  // Current vendor's listing (for vendors)
  myListing: VendorListing | null;
  hasListing: boolean;
  canUpdateLocation: boolean;
  locationUpdateWaitMinutes: number;
  tierLimits: TierLimits;

  // Public listings (for map display)
  publicVendors: PublicVendorListing[];

  // Loading states
  isLoadingMyListing: boolean;
  isLoadingPublicVendors: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions for vendors
  createListing: (data: CreateListingData) => Promise<boolean>;
  updateListing: (updates: Partial<CreateListingData>) => Promise<boolean>;
  updateLocation: (data: UpdateLocationData) => Promise<boolean>;
  updateProductPhotos: (photos: ProductPhoto[]) => Promise<boolean>;
  deleteListing: () => Promise<boolean>;
  refreshMyListing: () => Promise<void>;

  // Actions for map display
  fetchPublicVendors: () => Promise<void>;
  getVendorById: (id: string) => PublicVendorListing | undefined;
}

const VendorListingContext = createContext<VendorListingContextType | undefined>(undefined);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
const VENDOR_LISTING_CACHE_KEY = "@smartdealsiq_vendor_listing";
const PUBLIC_VENDORS_CACHE_KEY = "@smartdealsiq_public_vendors";

const DEFAULT_TIER_LIMITS: TierLimits = {
  staticLocationOnly: true,
  locationUpdateCooldownMinutes: 60,
  noRealTimeTracking: true,
  noPromotions: true,
  noPriorityPlacement: true,
};

export function VendorListingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Vendor's own listing state
  const [myListing, setMyListing] = useState<VendorListing | null>(null);
  const [hasListing, setHasListing] = useState(false);
  const [canUpdateLocation, setCanUpdateLocation] = useState(true);
  const [locationUpdateWaitMinutes, setLocationUpdateWaitMinutes] = useState(0);
  const [tierLimits, setTierLimits] = useState<TierLimits>(DEFAULT_TIER_LIMITS);

  // Public vendors state (for map)
  const [publicVendors, setPublicVendors] = useState<PublicVendorListing[]>([]);

  // Loading & error states
  const [isLoadingMyListing, setIsLoadingMyListing] = useState(false);
  const [isLoadingPublicVendors, setIsLoadingPublicVendors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const [cachedListing, cachedPublicVendors] = await Promise.all([
        AsyncStorage.getItem(VENDOR_LISTING_CACHE_KEY),
        AsyncStorage.getItem(PUBLIC_VENDORS_CACHE_KEY),
      ]);

      if (cachedListing) {
        const parsed = JSON.parse(cachedListing);
        setMyListing(parsed.listing);
        setHasListing(parsed.hasListing);
      }

      if (cachedPublicVendors) {
        setPublicVendors(JSON.parse(cachedPublicVendors));
      }
    } catch (err) {
      console.error("Failed to load cached vendor data:", err);
    }
  };

  const refreshMyListing = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingMyListing(true);
    // Don't clear error - let it persist if there was one

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/api/vendors/listing/my`, {
        headers: {
          "x-user-id": user.id,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: any;
      try {
        data = await response.json();
      } catch {
        console.error("[VendorListing] Failed to parse response as JSON");
        throw new Error("Server returned invalid response");
      }

      if (response.ok) {
        setMyListing(data.listing || null);
        setHasListing(data.hasListing || false);
        setCanUpdateLocation(data.canUpdateLocation ?? true);
        setLocationUpdateWaitMinutes(data.locationUpdateWaitMinutes || 0);
        setTierLimits(data.tierLimits || DEFAULT_TIER_LIMITS);
        setError(null); // Clear error only on success

        // Cache the listing
        try {
          await AsyncStorage.setItem(VENDOR_LISTING_CACHE_KEY, JSON.stringify({
            listing: data.listing,
            hasListing: data.hasListing,
          }));
        } catch {
          // Ignore storage errors
        }
      } else if (response.status === 404) {
        // No listing yet - this is normal for new vendors
        setMyListing(null);
        setHasListing(false);
        setError(null);
        try {
          await AsyncStorage.removeItem(VENDOR_LISTING_CACHE_KEY);
        } catch {
          // Ignore storage errors
        }
      } else {
        // Server error - log but don't block the app
        console.warn("[VendorListing] Server returned error:", response.status);
        // Keep existing listing state, just note the error
      }
    } catch (err) {
      // Network error (server not running, connection refused, etc.)
      // This is NON-BLOCKING - treat as "no listing yet" for new vendors
      console.warn("[VendorListing] Network error (server may be offline):", err);
      // Don't set error state - allow app to continue
      // If we had cached data, it's still valid
      // If no cached data, vendor simply has no listing yet
      setHasListing(false);
      setMyListing(null);
    } finally {
      setIsLoadingMyListing(false);
    }
  }, [user?.id]);

  // Fetch vendor's listing when authenticated as vendor
  // Only fetch when auth is not loading and user is a vendor
  // NOTE: This is optional - app works without backend server
  useEffect(() => {
    if (isLoading) return; // Wait for auth to finish loading

    if (isAuthenticated && user?.role === "vendor") {
      // Try to fetch listing, but don't block app if server is down
      refreshMyListing().catch(() => {
        // Server not running - that's OK for local dev
        if (__DEV__) console.log("[VendorListing] Server not available - using local mode");
      });
    } else {
      setMyListing(null);
      setHasListing(false);
    }
  }, [isAuthenticated, isLoading, user?.id, user?.role, refreshMyListing]);

  const createListing = async (data: CreateListingData): Promise<boolean> => {
    if (!user?.id) {
      setError("You must be logged in as a vendor");
      return false;
    }

    setIsSaving(true);
    setError(null);

    // Helper to create listing locally
    const createLocalListing = async () => {
      if (__DEV__) console.log("[VendorListing] Creating listing locally");

      const now = new Date().toISOString();
      const localListing: VendorListing = {
        id: `local_${Date.now()}`,
        userId: user.id,
        businessName: data.businessName,
        category: data.category,
        description: data.description || null,
        phone: data.phone || null,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        city: data.city,
        state: data.state,
        vendorTier: "free",
        productPhotos: data.productPhotos || [],
        createdAt: now,
        updatedAt: now,
        lastLocationUpdate: now,
      };

      setMyListing(localListing);
      setHasListing(true);
      setCanUpdateLocation(false);
      setLocationUpdateWaitMinutes(60);

      await AsyncStorage.setItem(VENDOR_LISTING_CACHE_KEY, JSON.stringify({
        listing: localListing,
        hasListing: true,
      }));

      return true;
    };

    // Use local mode in demo mode
    if (DEMO_MODE_ENABLED) {
      try {
        return await createLocalListing();
      } finally {
        setIsSaving(false);
      }
    }

    try {
      // Try server first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/vendors/listing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...data,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (response.ok) {
        setMyListing(result.listing);
        setHasListing(true);
        setCanUpdateLocation(false);
        setLocationUpdateWaitMinutes(60);

        await AsyncStorage.setItem(VENDOR_LISTING_CACHE_KEY, JSON.stringify({
          listing: result.listing,
          hasListing: true,
        }));

        return true;
      } else {
        setError(result.error || "Failed to create listing");
        return false;
      }
    } catch (err) {
      // Server not available - use local mode
      return await createLocalListing();
    } finally {
      setIsSaving(false);
    }
  };

  const updateListing = async (updates: Partial<CreateListingData>): Promise<boolean> => {
    if (!user?.id || !myListing?.id) {
      setError("No listing to update");
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/vendors/listing/${myListing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(updates),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (response.ok) {
        setMyListing(result.listing);

        await AsyncStorage.setItem(VENDOR_LISTING_CACHE_KEY, JSON.stringify({
          listing: result.listing,
          hasListing: true,
        }));

        return true;
      } else {
        setError(result.error || "Failed to update listing");
        return false;
      }
    } catch (err) {
      // Server not available - update locally
      if (__DEV__) console.log("[VendorListing] Server not available - updating listing locally");

      const updatedListing: VendorListing = {
        ...myListing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      setMyListing(updatedListing);

      await AsyncStorage.setItem(VENDOR_LISTING_CACHE_KEY, JSON.stringify({
        listing: updatedListing,
        hasListing: true,
      }));

      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocation = async (data: UpdateLocationData): Promise<boolean> => {
    if (!user?.id || !myListing?.id) {
      setError("No listing to update");
      return false;
    }

    if (!canUpdateLocation) {
      setError(`Please wait ${locationUpdateWaitMinutes} minutes before updating location again.`);
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/vendors/listing/${myListing.id}/location`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (response.ok) {
        setMyListing(result.listing);
        setCanUpdateLocation(false);
        setLocationUpdateWaitMinutes(60);

        await AsyncStorage.setItem(VENDOR_LISTING_CACHE_KEY, JSON.stringify({
          listing: result.listing,
          hasListing: true,
        }));

        return true;
      } else if (response.status === 429) {
        setCanUpdateLocation(false);
        setLocationUpdateWaitMinutes(result.waitMinutes || 60);
        setError(result.message || "Location update rate limit exceeded");
        return false;
      } else {
        setError(result.error || "Failed to update location");
        return false;
      }
    } catch (err) {
      // Server not available - update locally
      if (__DEV__) console.log("[VendorListing] Server not available - updating location locally");

      const now = new Date().toISOString();
      const updatedListing: VendorListing = {
        ...myListing,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        city: data.city || myListing.city,
        state: data.state || myListing.state,
        lastLocationUpdate: now,
        updatedAt: now,
      };

      setMyListing(updatedListing);
      setCanUpdateLocation(false);
      setLocationUpdateWaitMinutes(60);

      await AsyncStorage.setItem(VENDOR_LISTING_CACHE_KEY, JSON.stringify({
        listing: updatedListing,
        hasListing: true,
      }));

      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProductPhotos = async (photos: ProductPhoto[]): Promise<boolean> => {
    if (!user?.id || !myListing?.id) {
      setError("No listing to update");
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      // For now, photos are stored locally since we don't have a file upload backend
      // In production, you would upload to cloud storage (S3, Cloudinary, etc.)
      const updatedListing: VendorListing = {
        ...myListing,
        productPhotos: photos,
        updatedAt: new Date().toISOString(),
      };

      setMyListing(updatedListing);

      await AsyncStorage.setItem(VENDOR_LISTING_CACHE_KEY, JSON.stringify({
        listing: updatedListing,
        hasListing: true,
      }));

      return true;
    } catch (err) {
      console.error("[VendorListing] Failed to update photos:", err);
      setError("Failed to update photos");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteListing = async (): Promise<boolean> => {
    if (!user?.id || !myListing?.id) {
      setError("No listing to delete");
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/vendors/listing/${myListing.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setMyListing(null);
        setHasListing(false);
        setCanUpdateLocation(true);
        setLocationUpdateWaitMinutes(0);

        await AsyncStorage.removeItem(VENDOR_LISTING_CACHE_KEY);

        return true;
      } else {
        const result = await response.json();
        setError(result.error || "Failed to delete listing");
        return false;
      }
    } catch (err) {
      // Server not available - delete locally
      if (__DEV__) console.log("[VendorListing] Server not available - deleting listing locally");

      setMyListing(null);
      setHasListing(false);
      setCanUpdateLocation(true);
      setLocationUpdateWaitMinutes(0);

      await AsyncStorage.removeItem(VENDOR_LISTING_CACHE_KEY);

      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const fetchPublicVendors = useCallback(async () => {
    setIsLoadingPublicVendors(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/public`);

      if (response.ok) {
        const data = await response.json();
        setPublicVendors(data.vendors || []);

        // Cache the public vendors
        try {
          await AsyncStorage.setItem(PUBLIC_VENDORS_CACHE_KEY, JSON.stringify(data.vendors || []));
        } catch {
          // Ignore storage errors
        }
      }
      // Non-ok responses: just keep using cached/empty data
    } catch (err) {
      // Network error - server offline, connection refused, etc.
      // NON-BLOCKING: keep using cached data or empty array
      console.warn("[VendorListing] Could not fetch public vendors (server may be offline):", err);
    } finally {
      setIsLoadingPublicVendors(false);
    }
  }, []);

  const getVendorById = useCallback((id: string): PublicVendorListing | undefined => {
    return publicVendors.find((v) => v.id === id);
  }, [publicVendors]);

  return (
    <VendorListingContext.Provider
      value={{
        myListing,
        hasListing,
        canUpdateLocation,
        locationUpdateWaitMinutes,
        tierLimits,
        publicVendors,
        isLoadingMyListing,
        isLoadingPublicVendors,
        isSaving,
        error,
        createListing,
        updateListing,
        updateLocation,
        updateProductPhotos,
        deleteListing,
        refreshMyListing,
        fetchPublicVendors,
        getVendorById,
      }}
    >
      {children}
    </VendorListingContext.Provider>
  );
}

export function useVendorListing() {
  const context = useContext(VendorListingContext);
  if (context === undefined) {
    throw new Error("useVendorListing must be used within a VendorListingProvider");
  }
  return context;
}
