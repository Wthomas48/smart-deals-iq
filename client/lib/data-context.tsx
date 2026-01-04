import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  requestNotificationPermission,
  scheduleNearbyVendorNotification,
  sendFlashDealNotification,
  scheduleFlashDealReminder,
  FlashDeal,
} from "./notification-service";

// Food Categories
export type FoodCategory =
  | "All"
  | "Mexican"
  | "Italian"
  | "Korean"
  | "Chinese"
  | "Japanese"
  | "Indian"
  | "Thai"
  | "American"
  | "BBQ"
  | "Seafood"
  | "Healthy"
  | "Desserts"
  | "Coffee"
  | "Fast Food"
  | "Food Truck";

export const FOOD_CATEGORIES: { id: FoodCategory; label: string; icon: string; color: string }[] = [
  { id: "All", label: "All", icon: "grid", color: "#6366F1" },
  { id: "Mexican", label: "Mexican", icon: "sun", color: "#F59E0B" },
  { id: "Italian", label: "Italian", icon: "coffee", color: "#EF4444" },
  { id: "Korean", label: "Korean", icon: "box", color: "#EC4899" },
  { id: "Chinese", label: "Chinese", icon: "star", color: "#F97316" },
  { id: "Japanese", label: "Japanese", icon: "moon", color: "#8B5CF6" },
  { id: "Indian", label: "Indian", icon: "zap", color: "#F59E0B" },
  { id: "Thai", label: "Thai", icon: "feather", color: "#10B981" },
  { id: "American", label: "American", icon: "flag", color: "#3B82F6" },
  { id: "BBQ", label: "BBQ", icon: "target", color: "#DC2626" },
  { id: "Seafood", label: "Seafood", icon: "anchor", color: "#0EA5E9" },
  { id: "Healthy", label: "Healthy", icon: "heart", color: "#22C55E" },
  { id: "Desserts", label: "Desserts", icon: "gift", color: "#F472B6" },
  { id: "Coffee", label: "Coffee", icon: "coffee", color: "#78350F" },
  { id: "Fast Food", label: "Fast Food", icon: "truck", color: "#FACC15" },
  { id: "Food Truck", label: "Food Truck", icon: "truck", color: "#6366F1" },
];

// Location/City data for search
export interface CityLocation {
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export const MAJOR_CITIES: CityLocation[] = [
  // Florida Cities
  { city: "Miami", state: "FL", zipCode: "33101", latitude: 25.7617, longitude: -80.1918 },
  { city: "Orlando", state: "FL", zipCode: "32801", latitude: 28.5383, longitude: -81.3792 },
  { city: "Tampa", state: "FL", zipCode: "33602", latitude: 27.9506, longitude: -82.4572 },
  { city: "Jacksonville", state: "FL", zipCode: "32202", latitude: 30.3322, longitude: -81.6557 },
  { city: "Fort Lauderdale", state: "FL", zipCode: "33301", latitude: 26.1224, longitude: -80.1373 },
  { city: "West Palm Beach", state: "FL", zipCode: "33401", latitude: 26.7153, longitude: -80.0534 },
  { city: "St. Petersburg", state: "FL", zipCode: "33701", latitude: 27.7676, longitude: -82.6403 },
  { city: "Tallahassee", state: "FL", zipCode: "32301", latitude: 30.4383, longitude: -84.2807 },
  { city: "Pensacola", state: "FL", zipCode: "32501", latitude: 30.4213, longitude: -87.2169 },
  { city: "Gainesville", state: "FL", zipCode: "32601", latitude: 29.6516, longitude: -82.3248 },
  { city: "Naples", state: "FL", zipCode: "34102", latitude: 26.1420, longitude: -81.7948 },
  { city: "Sarasota", state: "FL", zipCode: "34236", latitude: 27.3364, longitude: -82.5307 },
  { city: "Fort Myers", state: "FL", zipCode: "33901", latitude: 26.6406, longitude: -81.8723 },
  { city: "Clearwater", state: "FL", zipCode: "33755", latitude: 27.9659, longitude: -82.8001 },
  { city: "Boca Raton", state: "FL", zipCode: "33432", latitude: 26.3587, longitude: -80.0831 },
  // California Cities
  { city: "San Francisco", state: "CA", zipCode: "94102", latitude: 37.7749, longitude: -122.4194 },
  { city: "Los Angeles", state: "CA", zipCode: "90001", latitude: 34.0522, longitude: -118.2437 },
  { city: "San Diego", state: "CA", zipCode: "92101", latitude: 32.7157, longitude: -117.1611 },
  { city: "San Jose", state: "CA", zipCode: "95101", latitude: 37.3382, longitude: -121.8863 },
  { city: "Sacramento", state: "CA", zipCode: "95814", latitude: 38.5816, longitude: -121.4944 },
  { city: "Oakland", state: "CA", zipCode: "94612", latitude: 37.8044, longitude: -122.2712 },
  { city: "Fresno", state: "CA", zipCode: "93721", latitude: 36.7378, longitude: -119.7871 },
  { city: "Long Beach", state: "CA", zipCode: "90802", latitude: 33.7701, longitude: -118.1937 },
  // Texas Cities
  { city: "Houston", state: "TX", zipCode: "77001", latitude: 29.7604, longitude: -95.3698 },
  { city: "Austin", state: "TX", zipCode: "78701", latitude: 30.2672, longitude: -97.7431 },
  { city: "Dallas", state: "TX", zipCode: "75201", latitude: 32.7767, longitude: -96.7970 },
  { city: "San Antonio", state: "TX", zipCode: "78205", latitude: 29.4241, longitude: -98.4936 },
  { city: "Fort Worth", state: "TX", zipCode: "76102", latitude: 32.7555, longitude: -97.3308 },
  { city: "El Paso", state: "TX", zipCode: "79901", latitude: 31.7619, longitude: -106.4850 },
  // New York
  { city: "New York", state: "NY", zipCode: "10001", latitude: 40.7128, longitude: -74.0060 },
  { city: "Brooklyn", state: "NY", zipCode: "11201", latitude: 40.6892, longitude: -73.9857 },
  { city: "Buffalo", state: "NY", zipCode: "14202", latitude: 42.8864, longitude: -78.8784 },
  // Other Major Cities
  { city: "Chicago", state: "IL", zipCode: "60601", latitude: 41.8781, longitude: -87.6298 },
  { city: "Seattle", state: "WA", zipCode: "98101", latitude: 47.6062, longitude: -122.3321 },
  { city: "Denver", state: "CO", zipCode: "80202", latitude: 39.7392, longitude: -104.9903 },
  { city: "Boston", state: "MA", zipCode: "02101", latitude: 42.3601, longitude: -71.0589 },
  { city: "Atlanta", state: "GA", zipCode: "30301", latitude: 33.7490, longitude: -84.3880 },
  { city: "Phoenix", state: "AZ", zipCode: "85001", latitude: 33.4484, longitude: -112.0740 },
  { city: "Las Vegas", state: "NV", zipCode: "89101", latitude: 36.1699, longitude: -115.1398 },
  { city: "Portland", state: "OR", zipCode: "97201", latitude: 45.5152, longitude: -122.6784 },
  { city: "Detroit", state: "MI", zipCode: "48201", latitude: 42.3314, longitude: -83.0458 },
  { city: "Minneapolis", state: "MN", zipCode: "55401", latitude: 44.9778, longitude: -93.2650 },
  { city: "Philadelphia", state: "PA", zipCode: "19102", latitude: 39.9526, longitude: -75.1652 },
  { city: "Charlotte", state: "NC", zipCode: "28202", latitude: 35.2271, longitude: -80.8431 },
  { city: "Nashville", state: "TN", zipCode: "37201", latitude: 36.1627, longitude: -86.7816 },
  { city: "New Orleans", state: "LA", zipCode: "70112", latitude: 29.9511, longitude: -90.0715 },
  { city: "Kansas City", state: "MO", zipCode: "64101", latitude: 39.0997, longitude: -94.5786 },
  { city: "Indianapolis", state: "IN", zipCode: "46204", latitude: 39.7684, longitude: -86.1581 },
  { city: "Columbus", state: "OH", zipCode: "43215", latitude: 39.9612, longitude: -82.9988 },
  { city: "Cleveland", state: "OH", zipCode: "44113", latitude: 41.4993, longitude: -81.6944 },
  { city: "Pittsburgh", state: "PA", zipCode: "15222", latitude: 40.4406, longitude: -79.9959 },
  { city: "Baltimore", state: "MD", zipCode: "21201", latitude: 39.2904, longitude: -76.6122 },
  { city: "Washington", state: "DC", zipCode: "20001", latitude: 38.9072, longitude: -77.0369 },
  { city: "Salt Lake City", state: "UT", zipCode: "84101", latitude: 40.7608, longitude: -111.8910 },
  { city: "Honolulu", state: "HI", zipCode: "96813", latitude: 21.3069, longitude: -157.8583 },
  { city: "Anchorage", state: "AK", zipCode: "99501", latitude: 61.2181, longitude: -149.9003 },
];

export interface Vendor {
  id: string;
  name: string;
  cuisine: string;
  category: FoodCategory;
  description: string;
  rating: number;
  reviewCount: number;
  image: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  priceRange: "$" | "$$" | "$$$";
  dietary: string[];
  address?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  hours?: string;
  isFoodTruck?: boolean;
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
  category?: FoodCategory;
  image?: string;
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
  flashDeals: FlashDeal[];
  selectedCategory: FoodCategory;
  searchLocation: CityLocation | null;
  setSelectedCategory: (category: FoodCategory) => void;
  setSearchLocation: (location: CityLocation | null) => void;
  searchByZipCode: (zipCode: string) => CityLocation | null;
  getFilteredVendors: () => Vendor[];
  getFilteredDeals: () => Deal[];
  getActiveFlashDeals: () => FlashDeal[];
  addFavorite: (vendorId: string) => Promise<void>;
  removeFavorite: (vendorId: string) => Promise<void>;
  toggleNotifyNearby: (vendorId: string) => Promise<void>;
  isFavorite: (vendorId: string) => boolean;
  getVendorById: (id: string) => Vendor | undefined;
  getDealsByVendor: (vendorId: string) => Deal[];
  addPromotion: (promo: Omit<Promotion, "id">) => Promise<void>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  createFlashDeal: (deal: Omit<FlashDeal, "id" | "createdAt" | "currentRedemptions" | "isFlash">) => Promise<FlashDeal>;
  redeemFlashDeal: (dealId: string) => Promise<boolean>;
  deleteFlashDeal: (dealId: string) => Promise<void>;
  checkNearbyVendorsForNotifications: (userLat: number, userLon: number, alertRadiusMiles?: number) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const FAVORITES_KEY = "@smartdealsiq_favorites";
const PROMOTIONS_KEY = "@smartdealsiq_promotions";
const FLASH_DEALS_KEY = "@smartdealsiq_flash_deals";

// Re-export FlashDeal for convenience
export type { FlashDeal };

const mockVendors: Vendor[] = [
  // San Francisco vendors
  {
    id: "1",
    name: "Taco Loco",
    cuisine: "Mexican",
    category: "Mexican",
    description: "Authentic street tacos and burritos made fresh daily",
    rating: 4.8,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
    latitude: 37.7749,
    longitude: -122.4194,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian", "Gluten-Free Options"],
    city: "San Francisco",
    zipCode: "94102",
    isFoodTruck: true,
  },
  {
    id: "2",
    name: "Seoul Kitchen",
    cuisine: "Korean",
    category: "Korean",
    description: "Korean BBQ bowls and Korean fried chicken",
    rating: 4.6,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
    latitude: 37.7751,
    longitude: -122.4180,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Spicy Options"],
    city: "San Francisco",
    zipCode: "94102",
  },
  {
    id: "3",
    name: "Napoli Pizzeria",
    cuisine: "Italian",
    category: "Italian",
    description: "Family-owned restaurant serving authentic wood-fired pizza since 1985",
    rating: 4.9,
    reviewCount: 203,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
    latitude: 37.7755,
    longitude: -122.4200,
    isOpen: false,
    priceRange: "$$",
    dietary: ["Vegetarian"],
    city: "San Francisco",
    zipCode: "94103",
  },
  {
    id: "4",
    name: "BBQ Boss",
    cuisine: "BBQ",
    category: "BBQ",
    description: "Slow-smoked brisket, ribs, and pulled pork",
    rating: 4.7,
    reviewCount: 178,
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400",
    latitude: 37.7745,
    longitude: -122.4210,
    isOpen: true,
    priceRange: "$$$",
    dietary: [],
    city: "San Francisco",
    zipCode: "94102",
    isFoodTruck: true,
  },
  {
    id: "5",
    name: "Green Bowl Cafe",
    cuisine: "Healthy",
    category: "Healthy",
    description: "Neighborhood cafe with fresh salads, smoothie bowls, and cold-pressed juices",
    rating: 4.5,
    reviewCount: 67,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    latitude: 37.7760,
    longitude: -122.4185,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegan", "Gluten-Free", "Organic"],
    city: "San Francisco",
    zipCode: "94103",
  },
  {
    id: "6",
    name: "Sweet Delights Bakery",
    cuisine: "Desserts",
    category: "Desserts",
    description: "Local bakery with gourmet ice cream sandwiches, pastries, and churros",
    rating: 4.8,
    reviewCount: 134,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400",
    latitude: 37.7740,
    longitude: -122.4175,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian"],
    city: "San Francisco",
    zipCode: "94102",
  },
  // Los Angeles vendors
  {
    id: "7",
    name: "Kogi BBQ Truck",
    cuisine: "Korean-Mexican Fusion",
    category: "Food Truck",
    description: "Famous Korean-Mexican fusion tacos from the original food truck",
    rating: 4.9,
    reviewCount: 892,
    image: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400",
    latitude: 34.0522,
    longitude: -118.2437,
    isOpen: true,
    priceRange: "$$",
    dietary: [],
    city: "Los Angeles",
    zipCode: "90001",
    isFoodTruck: true,
  },
  {
    id: "8",
    name: "Sushi Nakazawa",
    cuisine: "Japanese",
    category: "Japanese",
    description: "Premium omakase experience with fresh fish flown in daily",
    rating: 4.8,
    reviewCount: 245,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
    latitude: 34.0525,
    longitude: -118.2440,
    isOpen: true,
    priceRange: "$$$",
    dietary: ["Gluten-Free Options"],
    city: "Los Angeles",
    zipCode: "90001",
  },
  {
    id: "9",
    name: "In-N-Out Burger",
    cuisine: "American",
    category: "Fast Food",
    description: "Classic California burgers, fries, and shakes",
    rating: 4.7,
    reviewCount: 1523,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    latitude: 34.0530,
    longitude: -118.2435,
    isOpen: true,
    priceRange: "$",
    dietary: [],
    city: "Los Angeles",
    zipCode: "90001",
  },
  // New York vendors
  {
    id: "10",
    name: "Joe's Pizza",
    cuisine: "Italian",
    category: "Italian",
    description: "Iconic NYC slice shop since 1975",
    rating: 4.6,
    reviewCount: 2156,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    latitude: 40.7128,
    longitude: -74.0060,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian"],
    city: "New York",
    zipCode: "10001",
  },
  {
    id: "11",
    name: "Halal Guys Cart",
    cuisine: "Middle Eastern",
    category: "Food Truck",
    description: "Famous halal chicken and gyro platters",
    rating: 4.5,
    reviewCount: 3421,
    image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400",
    latitude: 40.7130,
    longitude: -74.0065,
    isOpen: true,
    priceRange: "$",
    dietary: ["Halal"],
    city: "New York",
    zipCode: "10001",
    isFoodTruck: true,
  },
  {
    id: "12",
    name: "Thai Villa",
    cuisine: "Thai",
    category: "Thai",
    description: "Authentic Thai cuisine with family recipes",
    rating: 4.7,
    reviewCount: 567,
    image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400",
    latitude: 40.7135,
    longitude: -74.0058,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian", "Vegan Options"],
    city: "New York",
    zipCode: "10002",
  },
  // Chicago vendors
  {
    id: "13",
    name: "Lou Malnati's",
    cuisine: "Italian",
    category: "Italian",
    description: "Chicago's famous deep dish pizza",
    rating: 4.8,
    reviewCount: 1876,
    image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400",
    latitude: 41.8781,
    longitude: -87.6298,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian"],
    city: "Chicago",
    zipCode: "60601",
  },
  {
    id: "14",
    name: "Portillo's",
    cuisine: "American",
    category: "American",
    description: "Chicago-style hot dogs and Italian beef",
    rating: 4.6,
    reviewCount: 2345,
    image: "https://images.unsplash.com/photo-1612392166886-ee8475b03b62?w=400",
    latitude: 41.8785,
    longitude: -87.6295,
    isOpen: true,
    priceRange: "$",
    dietary: [],
    city: "Chicago",
    zipCode: "60601",
  },
  // Austin vendors
  {
    id: "15",
    name: "Franklin BBQ",
    cuisine: "BBQ",
    category: "BBQ",
    description: "World-famous Texas BBQ worth the wait",
    rating: 4.9,
    reviewCount: 4521,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
    latitude: 30.2672,
    longitude: -97.7431,
    isOpen: true,
    priceRange: "$$",
    dietary: [],
    city: "Austin",
    zipCode: "78701",
  },
  {
    id: "16",
    name: "Torchy's Tacos",
    cuisine: "Mexican",
    category: "Mexican",
    description: "Damn good tacos with creative flavors",
    rating: 4.7,
    reviewCount: 1234,
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
    latitude: 30.2675,
    longitude: -97.7435,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian Options"],
    city: "Austin",
    zipCode: "78701",
  },
  // Miami vendors
  {
    id: "17",
    name: "Versailles",
    cuisine: "Cuban",
    category: "Mexican",
    description: "The world's most famous Cuban restaurant",
    rating: 4.5,
    reviewCount: 3456,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
    latitude: 25.7617,
    longitude: -80.1918,
    isOpen: true,
    priceRange: "$$",
    dietary: [],
    city: "Miami",
    zipCode: "33101",
  },
  {
    id: "18",
    name: "Joe's Stone Crab",
    cuisine: "Seafood",
    category: "Seafood",
    description: "Iconic Miami seafood since 1913",
    rating: 4.8,
    reviewCount: 2789,
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400",
    latitude: 25.7620,
    longitude: -80.1920,
    isOpen: true,
    priceRange: "$$$",
    dietary: ["Gluten-Free Options"],
    city: "Miami",
    zipCode: "33101",
  },
  // More Florida Vendors
  // Orlando
  {
    id: "19",
    name: "4 Rivers Smokehouse",
    cuisine: "BBQ",
    category: "BBQ",
    description: "Award-winning Texas-style BBQ in the heart of Orlando",
    rating: 4.8,
    reviewCount: 2134,
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400",
    latitude: 28.5383,
    longitude: -81.3792,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Gluten-Free Options"],
    city: "Orlando",
    zipCode: "32801",
  },
  {
    id: "20",
    name: "Se7en Bites",
    cuisine: "American",
    category: "American",
    description: "Southern comfort food and incredible biscuits",
    rating: 4.7,
    reviewCount: 876,
    image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400",
    latitude: 28.5390,
    longitude: -81.3800,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian Options"],
    city: "Orlando",
    zipCode: "32801",
  },
  {
    id: "21",
    name: "Black Rooster Taqueria",
    cuisine: "Mexican",
    category: "Mexican",
    description: "Authentic Mexican street tacos and craft cocktails",
    rating: 4.6,
    reviewCount: 654,
    image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400",
    latitude: 28.5375,
    longitude: -81.3785,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian", "Vegan Options"],
    city: "Orlando",
    zipCode: "32801",
    isFoodTruck: false,
  },
  // Tampa
  {
    id: "22",
    name: "Columbia Restaurant",
    cuisine: "Spanish",
    category: "Mexican",
    description: "Florida's oldest restaurant, serving Spanish-Cuban cuisine since 1905",
    rating: 4.7,
    reviewCount: 3456,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
    latitude: 27.9506,
    longitude: -82.4572,
    isOpen: true,
    priceRange: "$$$",
    dietary: ["Gluten-Free Options"],
    city: "Tampa",
    zipCode: "33602",
  },
  {
    id: "23",
    name: "Bern's Steak House",
    cuisine: "Steakhouse",
    category: "American",
    description: "Legendary Tampa steakhouse with world-famous dessert room",
    rating: 4.9,
    reviewCount: 2876,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    latitude: 27.9510,
    longitude: -82.4580,
    isOpen: true,
    priceRange: "$$$",
    dietary: [],
    city: "Tampa",
    zipCode: "33602",
  },
  {
    id: "24",
    name: "Taco Bus",
    cuisine: "Mexican",
    category: "Mexican",
    description: "Tampa's original Mexican food truck turned restaurant",
    rating: 4.5,
    reviewCount: 1234,
    image: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400",
    latitude: 27.9500,
    longitude: -82.4565,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian Options"],
    city: "Tampa",
    zipCode: "33602",
    isFoodTruck: true,
  },
  // Jacksonville
  {
    id: "25",
    name: "Metro Diner",
    cuisine: "American",
    category: "American",
    description: "Comfort food classics and famous fried chicken & waffles",
    rating: 4.6,
    reviewCount: 1567,
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400",
    latitude: 30.3322,
    longitude: -81.6557,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian Options"],
    city: "Jacksonville",
    zipCode: "32202",
  },
  {
    id: "26",
    name: "Safe Harbor Seafood",
    cuisine: "Seafood",
    category: "Seafood",
    description: "Fresh-off-the-boat seafood on Mayport's waterfront",
    rating: 4.7,
    reviewCount: 987,
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400",
    latitude: 30.3330,
    longitude: -81.6560,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Gluten-Free Options"],
    city: "Jacksonville",
    zipCode: "32202",
  },
  // Fort Lauderdale
  {
    id: "27",
    name: "Rocco's Tacos",
    cuisine: "Mexican",
    category: "Mexican",
    description: "Upscale Mexican with tableside guacamole and 400+ tequilas",
    rating: 4.5,
    reviewCount: 2134,
    image: "https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=400",
    latitude: 26.1224,
    longitude: -80.1373,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian", "Vegan Options"],
    city: "Fort Lauderdale",
    zipCode: "33301",
  },
  {
    id: "28",
    name: "Casablanca Cafe",
    cuisine: "Mediterranean",
    category: "Seafood",
    description: "Oceanfront dining with stunning views and fresh seafood",
    rating: 4.6,
    reviewCount: 1876,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    latitude: 26.1230,
    longitude: -80.1380,
    isOpen: true,
    priceRange: "$$$",
    dietary: ["Vegetarian", "Gluten-Free Options"],
    city: "Fort Lauderdale",
    zipCode: "33301",
  },
  // West Palm Beach
  {
    id: "29",
    name: "Hullabaloo",
    cuisine: "Southern",
    category: "American",
    description: "Farm-to-table Southern cuisine in a cozy setting",
    rating: 4.7,
    reviewCount: 765,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    latitude: 26.7153,
    longitude: -80.0534,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian", "Gluten-Free"],
    city: "West Palm Beach",
    zipCode: "33401",
  },
  // St. Petersburg
  {
    id: "30",
    name: "The Mill",
    cuisine: "American",
    category: "American",
    description: "Creative comfort food in a renovated warehouse",
    rating: 4.6,
    reviewCount: 543,
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400",
    latitude: 27.7676,
    longitude: -82.6403,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian Options"],
    city: "St. Petersburg",
    zipCode: "33701",
  },
  {
    id: "31",
    name: "Bodega on Central",
    cuisine: "Cuban",
    category: "Mexican",
    description: "Trendy Cuban cafe with craft cocktails and live music",
    rating: 4.5,
    reviewCount: 876,
    image: "https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400",
    latitude: 27.7680,
    longitude: -82.6410,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian Options"],
    city: "St. Petersburg",
    zipCode: "33701",
  },
  // Naples
  {
    id: "32",
    name: "The Local",
    cuisine: "American",
    category: "American",
    description: "Fresh, locally-sourced dishes and craft beers",
    rating: 4.7,
    reviewCount: 654,
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400",
    latitude: 26.1420,
    longitude: -81.7948,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian", "Gluten-Free"],
    city: "Naples",
    zipCode: "34102",
  },
  // Sarasota
  {
    id: "33",
    name: "Indigenous",
    cuisine: "American",
    category: "American",
    description: "James Beard-nominated farm-to-table restaurant",
    rating: 4.8,
    reviewCount: 432,
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400",
    latitude: 27.3364,
    longitude: -82.5307,
    isOpen: true,
    priceRange: "$$$",
    dietary: ["Vegetarian", "Gluten-Free Options"],
    city: "Sarasota",
    zipCode: "34236",
  },
  // Boca Raton
  {
    id: "34",
    name: "Farmer's Table",
    cuisine: "Healthy",
    category: "Healthy",
    description: "Organic, farm-fresh cuisine in a chic setting",
    rating: 4.6,
    reviewCount: 876,
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400",
    latitude: 26.3587,
    longitude: -80.0831,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegan", "Gluten-Free", "Organic"],
    city: "Boca Raton",
    zipCode: "33432",
  },
  // Gainesville
  {
    id: "35",
    name: "The Top",
    cuisine: "American",
    category: "American",
    description: "Eclectic comfort food near the University of Florida",
    rating: 4.5,
    reviewCount: 1234,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    latitude: 29.6516,
    longitude: -82.3248,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian Options"],
    city: "Gainesville",
    zipCode: "32601",
  },
  // Tallahassee
  {
    id: "36",
    name: "Kool Beanz Cafe",
    cuisine: "American",
    category: "American",
    description: "Creative New American cuisine with global influences",
    rating: 4.6,
    reviewCount: 765,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    latitude: 30.4383,
    longitude: -84.2807,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Vegetarian", "Vegan Options"],
    city: "Tallahassee",
    zipCode: "32301",
  },
  // Clearwater
  {
    id: "37",
    name: "Frenchy's Rockaway Grill",
    cuisine: "Seafood",
    category: "Seafood",
    description: "Beachfront grouper sandwiches and sunset views",
    rating: 4.5,
    reviewCount: 2345,
    image: "https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=400",
    latitude: 27.9659,
    longitude: -82.8001,
    isOpen: true,
    priceRange: "$$",
    dietary: ["Gluten-Free Options"],
    city: "Clearwater",
    zipCode: "33755",
  },
  // Fort Myers
  {
    id: "38",
    name: "The Veranda",
    cuisine: "Southern",
    category: "American",
    description: "Historic Southern dining in two restored homes",
    rating: 4.7,
    reviewCount: 543,
    image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400",
    latitude: 26.6406,
    longitude: -81.8723,
    isOpen: true,
    priceRange: "$$$",
    dietary: ["Vegetarian Options"],
    city: "Fort Myers",
    zipCode: "33901",
  },
  // Miami Beach Food Truck
  {
    id: "39",
    name: "La Ventanita",
    cuisine: "Cuban",
    category: "Mexican",
    description: "Authentic Cuban coffee and pastelitos from a window",
    rating: 4.8,
    reviewCount: 1654,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
    latitude: 25.7900,
    longitude: -80.1300,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian Options"],
    city: "Miami",
    zipCode: "33139",
    isFoodTruck: true,
  },
  // Orlando Food Truck
  {
    id: "40",
    name: "Tamale Co.",
    cuisine: "Mexican",
    category: "Mexican",
    description: "Gourmet tamales and Mexican street food",
    rating: 4.6,
    reviewCount: 432,
    image: "https://images.unsplash.com/photo-1586511925558-a4c6376fe65f?w=400",
    latitude: 28.5400,
    longitude: -81.3810,
    isOpen: true,
    priceRange: "$",
    dietary: ["Vegetarian", "Vegan Options"],
    city: "Orlando",
    zipCode: "32803",
    isFoodTruck: true,
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
  // Florida Deals - Miami
  {
    id: "d6",
    vendorId: "17",
    title: "Cuban Feast Special",
    description: "Complete Cuban dinner for 2 with appetizer, entrees & dessert",
    originalPrice: 65,
    discountedPrice: 49,
    expiresAt: new Date(Date.now() + 3600000 * 6).toISOString(),
  },
  {
    id: "d7",
    vendorId: "18",
    title: "Stone Crab Season Deal",
    description: "1 lb of stone crab claws with mustard sauce - 20% off",
    originalPrice: 75,
    discountedPrice: 60,
    expiresAt: new Date(Date.now() + 3600000 * 8).toISOString(),
  },
  {
    id: "d8",
    vendorId: "39",
    title: "Cafecito Combo",
    description: "Cuban coffee + 2 pastelitos for breakfast special",
    originalPrice: 8,
    discountedPrice: 5,
    expiresAt: new Date(Date.now() + 3600000 * 3).toISOString(),
  },
  // Orlando Deals
  {
    id: "d9",
    vendorId: "19",
    title: "Smokehouse Sampler",
    description: "Try our brisket, ribs & pulled pork sampler plate",
    originalPrice: 32,
    discountedPrice: 24,
    expiresAt: new Date(Date.now() + 3600000 * 5).toISOString(),
  },
  {
    id: "d10",
    vendorId: "20",
    title: "Biscuit Breakfast Bundle",
    description: "2 signature biscuits + coffee + side for brunch",
    originalPrice: 22,
    discountedPrice: 16,
    expiresAt: new Date(Date.now() + 3600000 * 4).toISOString(),
  },
  {
    id: "d11",
    vendorId: "21",
    title: "Taco Flight",
    description: "Try 4 different tacos at a special price",
    originalPrice: 18,
    discountedPrice: 14,
    expiresAt: new Date(Date.now() + 3600000 * 6).toISOString(),
  },
  {
    id: "d12",
    vendorId: "40",
    title: "Tamale Tuesday",
    description: "Buy 3 tamales, get 1 free!",
    originalPrice: 16,
    discountedPrice: 12,
    expiresAt: new Date(Date.now() + 3600000 * 5).toISOString(),
  },
  // Tampa Deals
  {
    id: "d13",
    vendorId: "22",
    title: "Columbia 1905 Salad Special",
    description: "Famous 1905 Salad + entree combo",
    originalPrice: 38,
    discountedPrice: 29,
    expiresAt: new Date(Date.now() + 3600000 * 7).toISOString(),
  },
  {
    id: "d14",
    vendorId: "23",
    title: "Steak & Dessert Experience",
    description: "Any steak + dessert room visit with wine pairing",
    originalPrice: 120,
    discountedPrice: 95,
    expiresAt: new Date(Date.now() + 3600000 * 10).toISOString(),
  },
  {
    id: "d15",
    vendorId: "24",
    title: "Taco Bus Party Pack",
    description: "12 tacos + chips & salsa for groups",
    originalPrice: 36,
    discountedPrice: 28,
    expiresAt: new Date(Date.now() + 3600000 * 4).toISOString(),
  },
  // Jacksonville Deals
  {
    id: "d16",
    vendorId: "25",
    title: "Fried Chicken & Waffles",
    description: "Famous chicken & waffles with bottomless coffee",
    originalPrice: 19,
    discountedPrice: 14,
    expiresAt: new Date(Date.now() + 3600000 * 5).toISOString(),
  },
  {
    id: "d17",
    vendorId: "26",
    title: "Fresh Catch Special",
    description: "Today's fresh catch with 2 sides - dock to table",
    originalPrice: 28,
    discountedPrice: 22,
    expiresAt: new Date(Date.now() + 3600000 * 6).toISOString(),
  },
  // Fort Lauderdale Deals
  {
    id: "d18",
    vendorId: "27",
    title: "Tableside Guac + Margaritas",
    description: "Fresh guacamole + 2 house margaritas",
    originalPrice: 32,
    discountedPrice: 24,
    expiresAt: new Date(Date.now() + 3600000 * 4).toISOString(),
  },
  {
    id: "d19",
    vendorId: "28",
    title: "Oceanfront Sunset Dinner",
    description: "3-course dinner with ocean view seating",
    originalPrice: 65,
    discountedPrice: 52,
    expiresAt: new Date(Date.now() + 3600000 * 8).toISOString(),
  },
  // West Palm Beach
  {
    id: "d20",
    vendorId: "29",
    title: "Farm-to-Table Prix Fixe",
    description: "Chef's 3-course seasonal tasting menu",
    originalPrice: 55,
    discountedPrice: 42,
    expiresAt: new Date(Date.now() + 3600000 * 6).toISOString(),
  },
  // St. Petersburg Deals
  {
    id: "d21",
    vendorId: "30",
    title: "Comfort Food Combo",
    description: "Burger + loaded fries + craft beer",
    originalPrice: 28,
    discountedPrice: 21,
    expiresAt: new Date(Date.now() + 3600000 * 5).toISOString(),
  },
  {
    id: "d22",
    vendorId: "31",
    title: "Cuban Brunch Special",
    description: "Brunch platter + Cuban coffee + mimosa",
    originalPrice: 26,
    discountedPrice: 19,
    expiresAt: new Date(Date.now() + 3600000 * 4).toISOString(),
  },
  // Naples
  {
    id: "d23",
    vendorId: "32",
    title: "Local Favorites Sampler",
    description: "Try 3 local favorites + craft beer flight",
    originalPrice: 38,
    discountedPrice: 29,
    expiresAt: new Date(Date.now() + 3600000 * 6).toISOString(),
  },
  // Sarasota
  {
    id: "d24",
    vendorId: "33",
    title: "James Beard Tasting Menu",
    description: "5-course tasting menu with wine pairings",
    originalPrice: 95,
    discountedPrice: 75,
    expiresAt: new Date(Date.now() + 3600000 * 8).toISOString(),
  },
  // Boca Raton
  {
    id: "d25",
    vendorId: "34",
    title: "Healthy Power Lunch",
    description: "Organic bowl + fresh juice + superfood smoothie",
    originalPrice: 32,
    discountedPrice: 24,
    expiresAt: new Date(Date.now() + 3600000 * 4).toISOString(),
  },
  // Gainesville
  {
    id: "d26",
    vendorId: "35",
    title: "Gator Game Day Special",
    description: "Appetizer platter + pitchers for game watching",
    originalPrice: 45,
    discountedPrice: 35,
    expiresAt: new Date(Date.now() + 3600000 * 5).toISOString(),
  },
  // Tallahassee
  {
    id: "d27",
    vendorId: "36",
    title: "Creative Lunch Special",
    description: "Chef's daily special + soup + drink",
    originalPrice: 24,
    discountedPrice: 18,
    expiresAt: new Date(Date.now() + 3600000 * 4).toISOString(),
  },
  // Clearwater
  {
    id: "d28",
    vendorId: "37",
    title: "Grouper Sandwich Combo",
    description: "Famous grouper sandwich + fries + sunset view",
    originalPrice: 22,
    discountedPrice: 17,
    expiresAt: new Date(Date.now() + 3600000 * 6).toISOString(),
  },
  // Fort Myers
  {
    id: "d29",
    vendorId: "38",
    title: "Southern Sunday Brunch",
    description: "Brunch buffet with champagne in historic setting",
    originalPrice: 48,
    discountedPrice: 38,
    expiresAt: new Date(Date.now() + 3600000 * 8).toISOString(),
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

const initialFlashDeals: FlashDeal[] = [
  {
    id: "flash1",
    vendorId: "1",
    vendorName: "Taco Loco",
    title: "50% OFF All Burritos",
    description: "Flash sale! Get any burrito at half price. Limited time only!",
    originalPrice: 12.99,
    discountedPrice: 6.49,
    discountPercent: 50,
    expiresAt: new Date(Date.now() + 1800000).toISOString(), // 30 mins from now
    createdAt: new Date().toISOString(),
    category: "Mexican",
    isFlash: true,
    maxRedemptions: 50,
    currentRedemptions: 23,
  },
  {
    id: "flash2",
    vendorId: "4",
    vendorName: "BBQ Boss",
    title: "BOGO Ribs Special",
    description: "Buy one rack of ribs, get one FREE! While supplies last.",
    originalPrice: 28.99,
    discountedPrice: 14.49,
    discountPercent: 50,
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    createdAt: new Date().toISOString(),
    category: "BBQ",
    isFlash: true,
    maxRedemptions: 30,
    currentRedemptions: 12,
  },
  {
    id: "flash3",
    vendorId: "7",
    vendorName: "Kogi BBQ Truck",
    title: "Lightning Deal: 40% OFF",
    description: "All fusion tacos 40% off for the next hour!",
    originalPrice: 15.99,
    discountedPrice: 9.59,
    discountPercent: 40,
    expiresAt: new Date(Date.now() + 2700000).toISOString(), // 45 mins from now
    createdAt: new Date().toISOString(),
    category: "Food Truck",
    isFlash: true,
    maxRedemptions: 100,
    currentRedemptions: 67,
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>(initialFlashDeals);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>("All");
  const [searchLocation, setSearchLocation] = useState<CityLocation | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const searchByZipCode = (zipCode: string): CityLocation | null => {
    const location = MAJOR_CITIES.find((c) => c.zipCode === zipCode);
    if (location) {
      setSearchLocation(location);
    }
    return location || null;
  };

  const getFilteredVendors = (): Vendor[] => {
    let filtered = mockVendors;

    // Filter by category
    if (selectedCategory !== "All") {
      if (selectedCategory === "Food Truck") {
        filtered = filtered.filter((v) => v.isFoodTruck);
      } else {
        filtered = filtered.filter((v) => v.category === selectedCategory);
      }
    }

    // Filter by location
    if (searchLocation) {
      filtered = filtered.filter((v) => v.city === searchLocation.city);
    }

    return filtered;
  };

  const getFilteredDeals = (): Deal[] => {
    const filteredVendorIds = getFilteredVendors().map((v) => v.id);
    return mockDeals.filter((d) => filteredVendorIds.includes(d.vendorId));
  };

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
    const currentFav = favorites.find((f) => f.vendorId === vendorId);
    const newValue = currentFav ? !currentFav.notifyWhenNearby : true;

    if (newValue) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return;
      }
    }

    const newFavorites = favorites.map((f) =>
      f.vendorId === vendorId ? { ...f, notifyWhenNearby: newValue } : f
    );
    setFavorites(newFavorites);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const notifiedVendorsRef = React.useRef<Map<string, number>>(new Map());
  const NOTIFICATION_COOLDOWN_MS = 30 * 60 * 1000;

  const checkNearbyVendorsForNotifications = async (
    userLat: number,
    userLon: number,
    alertRadiusMiles: number = 0.5
  ) => {
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
    };

    const now = Date.now();

    for (const fav of favorites) {
      if (!fav.notifyWhenNearby) continue;
      const vendor = mockVendors.find((v) => v.id === fav.vendorId);
      if (!vendor) continue;

      const lastNotified = notifiedVendorsRef.current.get(vendor.id);
      if (lastNotified && now - lastNotified < NOTIFICATION_COOLDOWN_MS) {
        continue;
      }

      const distance = haversineDistance(userLat, userLon, vendor.latitude, vendor.longitude);
      if (distance <= alertRadiusMiles) {
        await scheduleNearbyVendorNotification(vendor.name, distance);
        notifiedVendorsRef.current.set(vendor.id, now);
      }
    }
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

  // Flash Deal Functions
  const getActiveFlashDeals = (): FlashDeal[] => {
    const now = new Date();
    return flashDeals.filter((deal) => {
      const expiresAt = new Date(deal.expiresAt);
      const hasCapacity = !deal.maxRedemptions || deal.currentRedemptions < deal.maxRedemptions;
      return expiresAt > now && hasCapacity;
    });
  };

  const createFlashDeal = async (
    deal: Omit<FlashDeal, "id" | "createdAt" | "currentRedemptions" | "isFlash">
  ): Promise<FlashDeal> => {
    const newDeal: FlashDeal = {
      ...deal,
      id: `flash_${Date.now()}`,
      createdAt: new Date().toISOString(),
      currentRedemptions: 0,
      isFlash: true,
    };

    const updatedDeals = [...flashDeals, newDeal];
    setFlashDeals(updatedDeals);
    await AsyncStorage.setItem(FLASH_DEALS_KEY, JSON.stringify(updatedDeals));

    // Send push notification to subscribed users
    await sendFlashDealNotification(newDeal);

    // Schedule a reminder 5 minutes before expiration
    await scheduleFlashDealReminder(newDeal, 5);

    return newDeal;
  };

  const redeemFlashDeal = async (dealId: string): Promise<boolean> => {
    const deal = flashDeals.find((d) => d.id === dealId);
    if (!deal) return false;

    // Check if deal is still valid
    const now = new Date();
    const expiresAt = new Date(deal.expiresAt);
    if (expiresAt <= now) return false;

    // Check capacity
    if (deal.maxRedemptions && deal.currentRedemptions >= deal.maxRedemptions) {
      return false;
    }

    // Update redemption count
    const updatedDeals = flashDeals.map((d) =>
      d.id === dealId ? { ...d, currentRedemptions: d.currentRedemptions + 1 } : d
    );
    setFlashDeals(updatedDeals);
    await AsyncStorage.setItem(FLASH_DEALS_KEY, JSON.stringify(updatedDeals));

    return true;
  };

  const deleteFlashDeal = async (dealId: string): Promise<void> => {
    const updatedDeals = flashDeals.filter((d) => d.id !== dealId);
    setFlashDeals(updatedDeals);
    await AsyncStorage.setItem(FLASH_DEALS_KEY, JSON.stringify(updatedDeals));
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
        flashDeals,
        selectedCategory,
        searchLocation,
        setSelectedCategory,
        setSearchLocation,
        searchByZipCode,
        getFilteredVendors,
        getFilteredDeals,
        getActiveFlashDeals,
        addFavorite,
        removeFavorite,
        toggleNotifyNearby,
        isFavorite,
        getVendorById,
        getDealsByVendor,
        addPromotion,
        updatePromotion,
        deletePromotion,
        createFlashDeal,
        redeemFlashDeal,
        deleteFlashDeal,
        checkNearbyVendorsForNotifications,
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
