import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

interface CachedDeal {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description: string;
  discount: string;
  originalPrice: number;
  discountedPrice: number;
  expiresAt: string;
  category: string;
  distance?: number;
  cachedAt: string;
}

interface CachedVendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  cachedAt: string;
}

interface PendingAction {
  id: string;
  type: 'favorite' | 'redeem' | 'review';
  payload: any;
  createdAt: string;
  retryCount: number;
}

interface OfflineContextType {
  isOnline: boolean;
  isOfflineMode: boolean;
  // Cached data
  cachedDeals: CachedDeal[];
  cachedVendors: CachedVendor[];
  pendingActions: PendingAction[];
  // Cache management
  cacheDeals: (deals: CachedDeal[]) => Promise<void>;
  cacheVendors: (vendors: CachedVendor[]) => Promise<void>;
  getCachedData: () => { deals: CachedDeal[]; vendors: CachedVendor[] };
  clearCache: () => Promise<void>;
  // Offline actions
  queueAction: (action: Omit<PendingAction, 'id' | 'createdAt' | 'retryCount'>) => Promise<void>;
  syncPendingActions: () => Promise<void>;
  // Stats
  lastSyncTime: Date | null;
  cacheSize: number;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

const CACHE_KEYS = {
  DEALS: '@smartdealsiq_cached_deals',
  VENDORS: '@smartdealsiq_cached_vendors',
  PENDING_ACTIONS: '@smartdealsiq_pending_actions',
  LAST_SYNC: '@smartdealsiq_last_sync',
};

const MAX_CACHE_AGE_HOURS = 24;
const MAX_CACHED_DEALS = 100;
const MAX_CACHED_VENDORS = 50;

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedDeals, setCachedDeals] = useState<CachedDeal[]>([]);
  const [cachedVendors, setCachedVendors] = useState<CachedVendor[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Initialize and monitor network status
  useEffect(() => {
    loadCachedData();

    if (Platform.OS === 'web') {
      // Web-based offline detection
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Native network monitoring
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsOnline(state.isConnected ?? true);
      });

      return () => unsubscribe();
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline]);

  const loadCachedData = async () => {
    try {
      const [dealsJson, vendorsJson, actionsJson, lastSyncJson] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.DEALS),
        AsyncStorage.getItem(CACHE_KEYS.VENDORS),
        AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS),
        AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC),
      ]);

      if (dealsJson) {
        const deals = JSON.parse(dealsJson);
        // Filter out expired cache
        const validDeals = deals.filter((d: CachedDeal) => {
          const cachedAt = new Date(d.cachedAt);
          const hoursSinceCached = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);
          return hoursSinceCached < MAX_CACHE_AGE_HOURS;
        });
        setCachedDeals(validDeals);
      }

      if (vendorsJson) {
        const vendors = JSON.parse(vendorsJson);
        const validVendors = vendors.filter((v: CachedVendor) => {
          const cachedAt = new Date(v.cachedAt);
          const hoursSinceCached = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);
          return hoursSinceCached < MAX_CACHE_AGE_HOURS;
        });
        setCachedVendors(validVendors);
      }

      if (actionsJson) {
        setPendingActions(JSON.parse(actionsJson));
      }

      if (lastSyncJson) {
        setLastSyncTime(new Date(lastSyncJson));
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  const cacheDeals = useCallback(async (deals: CachedDeal[]) => {
    try {
      const timestamp = new Date().toISOString();
      const dealsWithTimestamp = deals.map(d => ({
        ...d,
        cachedAt: timestamp,
      }));

      // Merge with existing, keeping most recent, limit total
      const merged = [...dealsWithTimestamp, ...cachedDeals]
        .filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
        .slice(0, MAX_CACHED_DEALS);

      setCachedDeals(merged);
      await AsyncStorage.setItem(CACHE_KEYS.DEALS, JSON.stringify(merged));

      setLastSyncTime(new Date());
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Failed to cache deals:', error);
    }
  }, [cachedDeals]);

  const cacheVendors = useCallback(async (vendors: CachedVendor[]) => {
    try {
      const timestamp = new Date().toISOString();
      const vendorsWithTimestamp = vendors.map(v => ({
        ...v,
        cachedAt: timestamp,
      }));

      const merged = [...vendorsWithTimestamp, ...cachedVendors]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .slice(0, MAX_CACHED_VENDORS);

      setCachedVendors(merged);
      await AsyncStorage.setItem(CACHE_KEYS.VENDORS, JSON.stringify(merged));
    } catch (error) {
      console.error('Failed to cache vendors:', error);
    }
  }, [cachedVendors]);

  const getCachedData = useCallback(() => {
    return { deals: cachedDeals, vendors: cachedVendors };
  }, [cachedDeals, cachedVendors]);

  const clearCache = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.DEALS),
        AsyncStorage.removeItem(CACHE_KEYS.VENDORS),
      ]);
      setCachedDeals([]);
      setCachedVendors([]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  const queueAction = useCallback(async (action: Omit<PendingAction, 'id' | 'createdAt' | 'retryCount'>) => {
    const newAction: PendingAction = {
      ...action,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    const updatedActions = [...pendingActions, newAction];
    setPendingActions(updatedActions);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(updatedActions));
  }, [pendingActions]);

  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const actionsToProcess = [...pendingActions];
    const failedActions: PendingAction[] = [];

    for (const action of actionsToProcess) {
      try {
        // Process action based on type
        switch (action.type) {
          case 'favorite':
            // await api.addFavorite(action.payload);
            if (__DEV__) console.log('Syncing favorite:', action.payload);
            break;
          case 'redeem':
            // await api.redeemDeal(action.payload);
            if (__DEV__) console.log('Syncing redemption:', action.payload);
            break;
          case 'review':
            // await api.submitReview(action.payload);
            if (__DEV__) console.log('Syncing review:', action.payload);
            break;
        }
      } catch (error) {
        // Retry up to 3 times
        if (action.retryCount < 3) {
          failedActions.push({ ...action, retryCount: action.retryCount + 1 });
        }
      }
    }

    setPendingActions(failedActions);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(failedActions));
  }, [isOnline, pendingActions]);

  const cacheSize = JSON.stringify(cachedDeals).length + JSON.stringify(cachedVendors).length;

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOfflineMode: !isOnline,
        cachedDeals,
        cachedVendors,
        pendingActions,
        cacheDeals,
        cacheVendors,
        getCachedData,
        clearCache,
        queueAction,
        syncPendingActions,
        lastSyncTime,
        cacheSize,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
