import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Badge definitions
export type BadgeId =
  | 'first_deal'
  | 'deal_hunter'
  | 'deal_master'
  | 'early_bird'
  | 'night_owl'
  | 'explorer'
  | 'loyal_customer'
  | 'social_butterfly'
  | 'streak_starter'
  | 'streak_warrior'
  | 'streak_legend'
  | 'big_spender'
  | 'penny_pincher'
  | 'variety_seeker'
  | 'foodie'
  | 'local_hero';

interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: number;
  unlockedAt?: Date;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number; // points
  completed: boolean;
}

interface GamificationStats {
  totalPoints: number;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  dealsRedeemed: number;
  totalSavings: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  vendorsVisited: string[];
  categoriesExplored: string[];
}

interface GamificationContextType {
  stats: GamificationStats;
  badges: Badge[];
  achievements: Achievement[];
  unlockedBadges: Badge[];
  recentUnlocks: Badge[];
  // Actions
  addPoints: (points: number, reason: string) => void;
  redeemDeal: (dealId: string, vendorId: string, category: string, savings: number) => void;
  checkIn: () => void;
  shareOnSocial: () => void;
  clearRecentUnlocks: () => void;
  // Computed
  getProgressToNextLevel: () => number;
  getLevelTitle: () => string;
}

const BADGES: Badge[] = [
  { id: 'first_deal', name: 'First Steps', description: 'Redeem your first deal', icon: '🎯', rarity: 'common', requirement: 1 },
  { id: 'deal_hunter', name: 'Deal Hunter', description: 'Redeem 10 deals', icon: '🎪', rarity: 'common', requirement: 10 },
  { id: 'deal_master', name: 'Deal Master', description: 'Redeem 50 deals', icon: '👑', rarity: 'epic', requirement: 50 },
  { id: 'early_bird', name: 'Early Bird', description: 'Redeem 5 deals before 9 AM', icon: '🌅', rarity: 'rare', requirement: 5 },
  { id: 'night_owl', name: 'Night Owl', description: 'Redeem 5 deals after 9 PM', icon: '🦉', rarity: 'rare', requirement: 5 },
  { id: 'explorer', name: 'Explorer', description: 'Visit 20 different vendors', icon: '🗺️', rarity: 'rare', requirement: 20 },
  { id: 'loyal_customer', name: 'Loyal Customer', description: 'Visit the same vendor 10 times', icon: '💎', rarity: 'epic', requirement: 10 },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Share 10 deals with friends', icon: '🦋', rarity: 'common', requirement: 10 },
  { id: 'streak_starter', name: 'Streak Starter', description: 'Maintain a 7-day streak', icon: '🔥', rarity: 'common', requirement: 7 },
  { id: 'streak_warrior', name: 'Streak Warrior', description: 'Maintain a 30-day streak', icon: '⚡', rarity: 'epic', requirement: 30 },
  { id: 'streak_legend', name: 'Streak Legend', description: 'Maintain a 100-day streak', icon: '🏆', rarity: 'legendary', requirement: 100 },
  { id: 'big_spender', name: 'Big Spender', description: 'Save $500 total', icon: '💰', rarity: 'rare', requirement: 500 },
  { id: 'penny_pincher', name: 'Penny Pincher', description: 'Save $1000 total', icon: '🤑', rarity: 'epic', requirement: 1000 },
  { id: 'variety_seeker', name: 'Variety Seeker', description: 'Try deals from 10 categories', icon: '🎨', rarity: 'rare', requirement: 10 },
  { id: 'foodie', name: 'Foodie', description: 'Redeem 25 restaurant deals', icon: '🍽️', rarity: 'rare', requirement: 25 },
  { id: 'local_hero', name: 'Local Hero', description: 'Support 30 local businesses', icon: '🦸', rarity: 'epic', requirement: 30 },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'welcome', title: 'Welcome!', description: 'Create your account', progress: 1, target: 1, reward: 100, completed: true },
  { id: 'first_save', title: 'First Save', description: 'Save your first favorite vendor', progress: 0, target: 1, reward: 50, completed: false },
  { id: 'deal_streak_3', title: 'Hot Streak', description: 'Redeem deals 3 days in a row', progress: 0, target: 3, reward: 150, completed: false },
  { id: 'savings_100', title: 'Smart Saver', description: 'Save $100 on deals', progress: 0, target: 100, reward: 200, completed: false },
  { id: 'explore_5', title: 'Explorer', description: 'Visit 5 different vendors', progress: 0, target: 5, reward: 100, completed: false },
];

const LEVEL_TITLES = [
  'Newcomer', 'Browser', 'Shopper', 'Bargain Hunter', 'Deal Seeker',
  'Savings Pro', 'Deal Expert', 'Master Saver', 'Deal Champion', 'Savings Legend'
];

const GamificationContext = createContext<GamificationContextType | null>(null);

const STORAGE_KEY = '@smartdealsiq_gamification';

const XP_PER_LEVEL = 1000;

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<GamificationStats>({
    totalPoints: 0,
    level: 1,
    currentXP: 0,
    xpToNextLevel: XP_PER_LEVEL,
    dealsRedeemed: 0,
    totalSavings: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    vendorsVisited: [],
    categoriesExplored: [],
  });

  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [recentUnlocks, setRecentUnlocks] = useState<Badge[]>([]);

  // Load saved data
  useEffect(() => {
    loadData();
  }, []);

  // Save data on changes
  useEffect(() => {
    saveData();
  }, [stats, badges, achievements]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setStats(data.stats);
        setBadges(data.badges);
        setAchievements(data.achievements);
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ stats, badges, achievements }));
    } catch (error) {
      console.error('Failed to save gamification data:', error);
    }
  };

  const addPoints = useCallback((points: number, reason: string) => {
    setStats(prev => {
      let newXP = prev.currentXP + points;
      let newLevel = prev.level;
      let xpToNext = prev.xpToNextLevel;

      // Level up check
      while (newXP >= xpToNext) {
        newXP -= xpToNext;
        newLevel++;
        xpToNext = XP_PER_LEVEL * newLevel; // Progressive XP requirements
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return {
        ...prev,
        totalPoints: prev.totalPoints + points,
        currentXP: newXP,
        level: newLevel,
        xpToNextLevel: xpToNext,
      };
    });
  }, []);

  const checkBadgeUnlocks = useCallback((newStats: GamificationStats) => {
    const newUnlocks: Badge[] = [];

    setBadges(prevBadges => {
      return prevBadges.map(badge => {
        if (badge.unlockedAt) return badge;

        let shouldUnlock = false;

        switch (badge.id) {
          case 'first_deal':
            shouldUnlock = newStats.dealsRedeemed >= 1;
            break;
          case 'deal_hunter':
            shouldUnlock = newStats.dealsRedeemed >= 10;
            break;
          case 'deal_master':
            shouldUnlock = newStats.dealsRedeemed >= 50;
            break;
          case 'explorer':
            shouldUnlock = newStats.vendorsVisited.length >= 20;
            break;
          case 'streak_starter':
            shouldUnlock = newStats.currentStreak >= 7;
            break;
          case 'streak_warrior':
            shouldUnlock = newStats.currentStreak >= 30;
            break;
          case 'streak_legend':
            shouldUnlock = newStats.currentStreak >= 100;
            break;
          case 'big_spender':
            shouldUnlock = newStats.totalSavings >= 500;
            break;
          case 'penny_pincher':
            shouldUnlock = newStats.totalSavings >= 1000;
            break;
          case 'variety_seeker':
            shouldUnlock = newStats.categoriesExplored.length >= 10;
            break;
          case 'local_hero':
            shouldUnlock = newStats.vendorsVisited.length >= 30;
            break;
        }

        if (shouldUnlock) {
          const unlockedBadge = { ...badge, unlockedAt: new Date() };
          newUnlocks.push(unlockedBadge);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return unlockedBadge;
        }

        return badge;
      });
    });

    if (newUnlocks.length > 0) {
      setRecentUnlocks(prev => [...newUnlocks, ...prev].slice(0, 5));
    }
  }, []);

  const redeemDeal = useCallback((dealId: string, vendorId: string, category: string, savings: number) => {
    setStats(prev => {
      const today = new Date().toDateString();
      const lastActivity = prev.lastActivityDate;

      // Calculate streak
      let newStreak = prev.currentStreak;
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const daysDiff = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          newStreak++;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newStats = {
        ...prev,
        dealsRedeemed: prev.dealsRedeemed + 1,
        totalSavings: prev.totalSavings + savings,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastActivityDate: today,
        vendorsVisited: prev.vendorsVisited.includes(vendorId)
          ? prev.vendorsVisited
          : [...prev.vendorsVisited, vendorId],
        categoriesExplored: prev.categoriesExplored.includes(category)
          ? prev.categoriesExplored
          : [...prev.categoriesExplored, category],
      };

      // Award points
      const pointsEarned = Math.round(50 + savings * 2);
      addPoints(pointsEarned, 'Deal redeemed');

      // Check for badge unlocks
      checkBadgeUnlocks(newStats);

      return newStats;
    });
  }, [addPoints, checkBadgeUnlocks]);

  const checkIn = useCallback(() => {
    addPoints(25, 'Daily check-in');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [addPoints]);

  const shareOnSocial = useCallback(() => {
    addPoints(15, 'Social share');
  }, [addPoints]);

  const clearRecentUnlocks = useCallback(() => {
    setRecentUnlocks([]);
  }, []);

  const getProgressToNextLevel = useCallback(() => {
    return (stats.currentXP / stats.xpToNextLevel) * 100;
  }, [stats.currentXP, stats.xpToNextLevel]);

  const getLevelTitle = useCallback(() => {
    const index = Math.min(stats.level - 1, LEVEL_TITLES.length - 1);
    return LEVEL_TITLES[index];
  }, [stats.level]);

  const unlockedBadges = badges.filter(b => b.unlockedAt);

  return (
    <GamificationContext.Provider
      value={{
        stats,
        badges,
        achievements,
        unlockedBadges,
        recentUnlocks,
        addPoints,
        redeemDeal,
        checkIn,
        shareOnSocial,
        clearRecentUnlocks,
        getProgressToNextLevel,
        getLevelTitle,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
