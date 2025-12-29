import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Vendor {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  rating: number;
  reviewCount: number;
  image: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  priceRange: "$" | "$$" | "$$$";
  dietary: string[];
}

export interface Deal {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  expiresAt: string;
  image?: string;
}

export interface Favorite {
  vendorId: string;
  notifyWhenNearby: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  visitCount: number;
  lastVisit: string;
  totalSpent: number;
  avatar?: string;
}

export interface VendorAnalytics {
  impressions: number;
  clicks: number;
  redemptions: number;
  revenue: number;
  trend: number[];
}

interface DataContextType {
  vendors: Vendor[];
  deals: Deal[];
  favorites: Favorite[];
  promotions: Promotion[];
  customers: CustomerRecord[];
  analytics: VendorAnalytics;
  addFavorite: (vendorId: string) => Promise<void>;
  removeFavorite: (vendorId: string) => Promise<void>;
  toggleNotifyNearby: (vendorId: string) => Promise<void>;
  isFavorite: (vendorId: string) => boolean;
  getVendorById: (id: string) => Vendor | undefined;
  getDealsByVendor: (vendorId: string) => Deal[];
  addPromotion: (promo: Omit<Promotion, "id">) => Promise<void>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const FAVORITES_KEY = "@smartdealsiq_favorites";
const PROMOTIONS_KEY = "@smartdealsiq_promotions";

const mockVendors: Vendor[] = [
  {
    id: "1",
    name: "Taco Loco",
    cuisine: "Mexican",
    description: "Authentic street tacos and burritos made fresh daily",
    rating: 4.8,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
    latitude: 37.7749,
    longitude: -122.4194,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian", "Gluten-Free Options"],
  },
  {
    id: "2",
    name: "Seoul Kitchen",
    cuisine: "Korean",
    description: "Korean BBQ bowls and Korean fried chicken",
    rating: 4.6,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
    latitude: 37.7751,
    longitude: -122.4180,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Spicy Options"],
  },
  {
    id: "3",
    name: "Pizza Wheels",
    cuisine: "Italian",
    description: "Wood-fired pizza from our mobile oven",
    rating: 4.9,
    reviewCount: 203,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
    latitude: 37.7755,
    longitude: -122.4200,
    isOpen: false,
    priceRange: "$$",
    dietary: ["Vegetarian"],
  },
  {
    id: "4",
    name: "BBQ Boss",
    cuisine: "BBQ",
    description: "Slow-smoked brisket, ribs, and pulled pork",
    rating: 4.7,
    reviewCount: 178,
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400",
    latitude: 37.7745,
    longitude: -122.4210,
    isOpen: true,
    priceRange: "$$$",
    dietary: [],
  },
  {
    id: "5",
    name: "Green Bowl",
    cuisine: "Healthy",
    description: "Fresh salads, smoothie bowls, and cold-pressed juices",
    rating: 4.5,
    reviewCount: 67,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    latitude: 37.7760,
    longitude: -122.4185,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegan", "Gluten-Free", "Organic"],
  },
  {
    id: "6",
    name: "Sweet Wheels",
    cuisine: "Desserts",
    description: "Gourmet ice cream sandwiches and churros",
    rating: 4.8,
    reviewCount: 134,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400",
    latitude: 37.7740,
    longitude: -122.4175,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian"],
  },
];

const mockDeals: Deal[] = [
  {
    id: "d1",
    vendorId: "1",
    title: "Taco Tuesday Special",
    description: "Buy 2 tacos, get 1 free! Valid until 2pm",
    originalPrice: 12,
    discountedPrice: 8,
    expiresAt: new Date(Date.now() + 3600000 * 2).toISOString(),
  },
  {
    id: "d2",
    vendorId: "2",
    title: "Lunch Combo Deal",
    description: "Korean BBQ bowl + drink for special price",
    originalPrice: 18,
    discountedPrice: 14,
    expiresAt: new Date(Date.now() + 3600000 * 4).toISOString(),
  },
  {
    id: "d3",
    vendorId: "4",
    title: "Happy Hour BBQ",
    description: "15% off all platters between 3-5pm",
    originalPrice: 25,
    discountedPrice: 21.25,
    expiresAt: new Date(Date.now() + 3600000 * 5).toISOString(),
  },
  {
    id: "d4",
    vendorId: "5",
    title: "Morning Boost",
    description: "Free smoothie shot with any bowl purchase",
    originalPrice: 15,
    discountedPrice: 12,
    expiresAt: new Date(Date.now() + 3600000 * 1).toISOString(),
  },
  {
    id: "d5",
    vendorId: "6",
    title: "Sweet Deal",
    description: "2 churros for the price of 1",
    originalPrice: 8,
    discountedPrice: 4,
    expiresAt: new Date(Date.now() + 3600000 * 3).toISOString(),
  },
];

const mockCustomers: CustomerRecord[] = [
  { id: "c1", name: "Sarah Johnson", email: "sarah@email.com", visitCount: 12, lastVisit: "2024-12-28", totalSpent: 156.50 },
  { id: "c2", name: "Mike Chen", email: "mike@email.com", visitCount: 8, lastVisit: "2024-12-27", totalSpent: 98.00 },
  { id: "c3", name: "Emily Davis", email: "emily@email.com", visitCount: 23, lastVisit: "2024-12-29", totalSpent: 287.25 },
  { id: "c4", name: "James Wilson", email: "james@email.com", visitCount: 5, lastVisit: "2024-12-20", totalSpent: 62.00 },
  { id: "c5", name: "Lisa Garcia", email: "lisa@email.com", visitCount: 15, lastVisit: "2024-12-28", totalSpent: 198.75 },
];

const mockAnalytics: VendorAnalytics = {
  impressions: 2847,
  clicks: 456,
  redemptions: 89,
  revenue: 1234.50,
  trend: [120, 145, 132, 178, 165, 189, 210],
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedFavorites, storedPromotions] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(PROMOTIONS_KEY),
      ]);
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      if (storedPromotions) setPromotions(JSON.parse(storedPromotions));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFavorite = async (vendorId: string) => {
    const newFavorites = [...favorites, { vendorId, notifyWhenNearby: false }];
    setFavorites(newFavorites);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const removeFavorite = async (vendorId: string) => {
    const newFavorites = favorites.filter((f) => f.vendorId !== vendorId);
    setFavorites(newFavorites);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const toggleNotifyNearby = async (vendorId: string) => {
    const newFavorites = favorites.map((f) =>
      f.vendorId === vendorId ? { ...f, notifyWhenNearby: !f.notifyWhenNearby } : f
    );
    setFavorites(newFavorites);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const isFavorite = (vendorId: string) => favorites.some((f) => f.vendorId === vendorId);

  const getVendorById = (id: string) => mockVendors.find((v) => v.id === id);

  const getDealsByVendor = (vendorId: string) => mockDeals.filter((d) => d.vendorId === vendorId);

  const addPromotion = async (promo: Omit<Promotion, "id">) => {
    const newPromo = { ...promo, id: Date.now().toString() };
    const newPromotions = [...promotions, newPromo];
    setPromotions(newPromotions);
    await AsyncStorage.setItem(PROMOTIONS_KEY, JSON.stringify(newPromotions));
  };

  const updatePromotion = async (id: string, updates: Partial<Promotion>) => {
    const newPromotions = promotions.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPromotions(newPromotions);
    await AsyncStorage.setItem(PROMOTIONS_KEY, JSON.stringify(newPromotions));
  };

  const deletePromotion = async (id: string) => {
    const newPromotions = promotions.filter((p) => p.id !== id);
    setPromotions(newPromotions);
    await AsyncStorage.setItem(PROMOTIONS_KEY, JSON.stringify(newPromotions));
  };

  return (
    <DataContext.Provider
      value={{
        vendors: mockVendors,
        deals: mockDeals,
        favorites,
        promotions,
        customers: mockCustomers,
        analytics: mockAnalytics,
        addFavorite,
        removeFavorite,
        toggleNotifyNearby,
        isFavorite,
        getVendorById,
        getDealsByVendor,
        addPromotion,
        updatePromotion,
        deletePromotion,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
