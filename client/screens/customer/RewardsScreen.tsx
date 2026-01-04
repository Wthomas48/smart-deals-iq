import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Spacer } from '@/components/Spacer';
import { BadgeDisplay, BadgeProgress, BadgeUnlockModal } from '@/components/BadgeDisplay';
import { Leaderboard } from '@/components/Leaderboard';
import { useGamification } from '@/lib/gamification-context';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RewardsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const {
    stats,
    badges,
    unlockedBadges,
    recentUnlocks,
    getProgressToNextLevel,
    getLevelTitle,
    checkIn,
    clearRecentUnlocks,
  } = useGamification();

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  // Animations
  const levelProgress = useSharedValue(0);
  const cardScale = useSharedValue(0);

  useEffect(() => {
    levelProgress.value = withDelay(
      300,
      withTiming(getProgressToNextLevel() / 100, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
    cardScale.value = withSpring(1, { damping: 12 });
  }, [stats.currentXP]);

  // Show unlock modal for recent unlocks
  useEffect(() => {
    if (recentUnlocks.length > 0) {
      setSelectedBadge(recentUnlocks[0]);
      setShowUnlockModal(true);
    }
  }, [recentUnlocks]);

  const handleCloseModal = () => {
    setShowUnlockModal(false);
    setSelectedBadge(null);
    clearRecentUnlocks();
  };

  const handleCheckIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    checkIn();
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${levelProgress.value * 100}%`,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  // Mock leaderboard data
  const leaderboardData = [
    { id: '1', rank: 1, name: 'DealHunter99', points: 15420, level: 12, badge: '👑' },
    { id: '2', rank: 2, name: 'SavingsQueen', points: 14850, level: 11, badge: '💎' },
    { id: '3', rank: 3, name: 'BargainKing', points: 13200, level: 10, badge: '🔥' },
    { id: '4', rank: 4, name: 'You', points: stats.totalPoints, level: stats.level, isCurrentUser: true },
    { id: '5', rank: 5, name: 'SmartShopper', points: 10500, level: 9 },
    { id: '6', rank: 6, name: 'CouponClipper', points: 9800, level: 8 },
    { id: '7', rank: 7, name: 'DealSeeker', points: 8500, level: 7 },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        {/* Level & XP Card */}
        <Animated.View style={cardStyle}>
          <Card style={styles.levelCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.levelGradient}
            >
              <View style={styles.levelHeader}>
                <View>
                  <ThemedText style={styles.levelLabel}>LEVEL {stats.level}</ThemedText>
                  <ThemedText style={styles.levelTitle}>{getLevelTitle()}</ThemedText>
                </View>
                <View style={styles.pointsBadge}>
                  <Feather name="star" size={16} color={Colors.accent} />
                  <ThemedText style={styles.pointsText}>
                    {stats.totalPoints.toLocaleString()}
                  </ThemedText>
                </View>
              </View>

              <Spacer size="lg" />

              {/* XP Progress Bar */}
              <View style={styles.xpContainer}>
                <View style={styles.xpLabels}>
                  <ThemedText style={styles.xpText}>
                    {stats.currentXP.toLocaleString()} XP
                  </ThemedText>
                  <ThemedText style={styles.xpText}>
                    {stats.xpToNextLevel.toLocaleString()} XP
                  </ThemedText>
                </View>
                <View style={styles.xpTrack}>
                  <Animated.View style={[styles.xpFill, progressStyle]} />
                </View>
                <ThemedText style={styles.xpRemaining}>
                  {(stats.xpToNextLevel - stats.currentXP).toLocaleString()} XP to Level {stats.level + 1}
                </ThemedText>
              </View>

              <Spacer size="lg" />

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{stats.currentStreak}</ThemedText>
                  <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{stats.dealsRedeemed}</ThemedText>
                  <ThemedText style={styles.statLabel}>Deals</ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>${stats.totalSavings.toFixed(0)}</ThemedText>
                  <ThemedText style={styles.statLabel}>Saved</ThemedText>
                </View>
              </View>
            </LinearGradient>
          </Card>
        </Animated.View>

        <Spacer size="xl" />

        {/* Daily Check-in */}
        <AnimatedPressable onPress={handleCheckIn}>
          <Card style={styles.checkInCard}>
            <LinearGradient
              colors={[Colors.accent + '20', Colors.accent + '05']}
              style={styles.checkInGradient}
            >
              <View style={styles.checkInIcon}>
                <Feather name="gift" size={24} color={Colors.accent} />
              </View>
              <View style={styles.checkInContent}>
                <ThemedText type="body" style={{ fontWeight: '700' }}>
                  Daily Check-in Bonus
                </ThemedText>
                <ThemedText type="small" secondary>
                  Tap to claim +25 XP
                </ThemedText>
              </View>
              <View style={styles.streakBadge}>
                <Feather name="zap" size={14} color={Colors.accent} />
                <ThemedText style={styles.streakText}>{stats.currentStreak}</ThemedText>
              </View>
            </LinearGradient>
          </Card>
        </AnimatedPressable>

        <Spacer size="xl" />

        {/* Badges Section */}
        <Card style={styles.badgesCard}>
          <BadgeDisplay
            badges={badges}
            unlockedBadges={unlockedBadges}
            onBadgePress={(badge) => {
              setSelectedBadge(badge);
              if (badge.unlockedAt) {
                setShowUnlockModal(true);
              }
            }}
          />

          {/* Next Badge Progress */}
          <BadgeProgress
            currentProgress={stats.dealsRedeemed}
            targetProgress={10}
            badgeName="Deal Hunter"
            badgeIcon="🎪"
          />
        </Card>

        <Spacer size="xl" />

        {/* Leaderboard */}
        <Card style={styles.leaderboardCard}>
          <Leaderboard
            data={leaderboardData}
            title="Top Deal Hunters"
            subtitle="This Week"
            type="customers"
          />
        </Card>

        <Spacer size="xl" />

        {/* Achievements Section */}
        <Card>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Achievements</ThemedText>
            <Pressable>
              <ThemedText style={{ color: Colors.primary }}>See All</ThemedText>
            </Pressable>
          </View>
          <Spacer size="md" />

          {[
            { title: 'First Deal', desc: 'Redeem your first deal', progress: 1, total: 1, xp: 100, done: true },
            { title: 'Explorer', desc: 'Visit 5 different vendors', progress: stats.vendorsVisited.length, total: 5, xp: 150, done: false },
            { title: 'Hot Streak', desc: 'Maintain a 7-day streak', progress: stats.currentStreak, total: 7, xp: 200, done: false },
          ].map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <View style={[styles.achievementCheck, achievement.done && styles.achievementCheckDone]}>
                {achievement.done ? (
                  <Feather name="check" size={16} color="#fff" />
                ) : (
                  <ThemedText style={styles.achievementProgress}>
                    {achievement.progress}/{achievement.total}
                  </ThemedText>
                )}
              </View>
              <View style={styles.achievementInfo}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  {achievement.title}
                </ThemedText>
                <ThemedText type="small" secondary>
                  {achievement.desc}
                </ThemedText>
              </View>
              <View style={styles.achievementXP}>
                <ThemedText style={{ color: Colors.accent, fontWeight: '700' }}>
                  +{achievement.xp} XP
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Badge Unlock Modal */}
      <BadgeUnlockModal
        badge={selectedBadge}
        visible={showUnlockModal && selectedBadge?.unlockedAt}
        onClose={handleCloseModal}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  levelCard: {
    padding: 0,
    overflow: 'hidden',
  },
  levelGradient: {
    padding: Spacing.xl,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 2,
  },
  levelTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  xpContainer: {},
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  xpTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  xpRemaining: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkInCard: {
    padding: 0,
    overflow: 'hidden',
  },
  checkInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  checkInIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkInContent: {
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
  },
  badgesCard: {
    padding: 0,
    overflow: 'hidden',
  },
  leaderboardCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  achievementCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  achievementCheckDone: {
    backgroundColor: Colors.success,
  },
  achievementProgress: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementXP: {
    marginLeft: Spacing.md,
  },
});
