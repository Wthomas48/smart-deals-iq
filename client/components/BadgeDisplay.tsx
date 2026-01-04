import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

interface BadgeDisplayProps {
  badges: Badge[];
  unlockedBadges: Badge[];
  onBadgePress?: (badge: Badge) => void;
  compact?: boolean;
}

const RARITY_COLORS: Record<'common' | 'rare' | 'epic' | 'legendary', readonly [string, string]> = {
  common: ['#6B7280', '#4B5563'] as const,
  rare: ['#3B82F6', '#1D4ED8'] as const,
  epic: ['#8B5CF6', '#6D28D9'] as const,
  legendary: ['#F59E0B', '#D97706'] as const,
};

const RARITY_GLOW = {
  common: 'rgba(107, 114, 128, 0.3)',
  rare: 'rgba(59, 130, 246, 0.4)',
  epic: 'rgba(139, 92, 246, 0.5)',
  legendary: 'rgba(245, 158, 11, 0.6)',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function BadgeItem({
  badge,
  index,
  isUnlocked,
  onPress,
  compact,
}: {
  badge: Badge;
  index: number;
  isUnlocked: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 50,
      withSpring(1, { damping: 10, stiffness: 100 })
    );

    if (isUnlocked && badge.rarity === 'legendary') {
      glow.value = withDelay(
        index * 50 + 300,
        withTiming(1, { duration: 1000 })
      );
      // Subtle rotation for legendary
      rotate.value = withDelay(
        index * 50 + 500,
        withSequence(
          withTiming(-5, { duration: 100 }),
          withTiming(5, { duration: 100 }),
          withTiming(0, { duration: 100 })
        )
      );
    }
  }, []);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        isUnlocked ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    }
    onPress();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  const colors = RARITY_COLORS[badge.rarity];
  const glowColor = RARITY_GLOW[badge.rarity];

  return (
    <AnimatedPressable
      style={[
        styles.badgeItem,
        compact && styles.badgeItemCompact,
        containerStyle,
      ]}
      onPress={handlePress}
    >
      {/* Glow effect for unlocked badges */}
      {isUnlocked && (
        <Animated.View
          style={[
            styles.badgeGlow,
            { backgroundColor: glowColor },
            glowStyle,
          ]}
        />
      )}

      <LinearGradient
        colors={isUnlocked ? colors : (['#374151', '#1F2937'] as const)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeIconContainer, compact && styles.badgeIconContainerCompact]}
      >
        <ThemedText style={[styles.badgeEmoji, compact && styles.badgeEmojiCompact]}>
          {isUnlocked ? badge.icon : '🔒'}
        </ThemedText>
      </LinearGradient>

      {!compact && (
        <>
          <ThemedText
            style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]}
            numberOfLines={1}
          >
            {badge.name}
          </ThemedText>
          <View style={[styles.rarityBadge, { backgroundColor: colors[0] }]}>
            <ThemedText style={styles.rarityText}>
              {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
            </ThemedText>
          </View>
        </>
      )}
    </AnimatedPressable>
  );
}

// Badge unlock celebration modal
export function BadgeUnlockModal({
  badge,
  visible,
  onClose,
}: {
  badge: Badge | null;
  visible: boolean;
  onClose: () => void;
}) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const particleScale = useSharedValue(0);

  useEffect(() => {
    if (visible && badge) {
      scale.value = withSpring(1, { damping: 8, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });
      particleScale.value = withSequence(
        withTiming(1.5, { duration: 500 }),
        withTiming(0, { duration: 500 })
      );
      rotate.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 200 }),
        withTiming(-5, { duration: 150 }),
        withTiming(0, { duration: 100 })
      );

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [visible, badge]);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const particleStyle = useAnimatedStyle(() => ({
    opacity: 1 - particleScale.value / 1.5,
    transform: [{ scale: particleScale.value }],
  }));

  if (!badge) return null;

  const colors = RARITY_COLORS[badge.rarity];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.unlockModal, modalStyle]}>
          {/* Particles */}
          <Animated.View style={[styles.particles, particleStyle]}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.particle,
                  {
                    backgroundColor: colors[0],
                    transform: [
                      { rotate: `${i * 45}deg` },
                      { translateY: -60 },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>

          <ThemedText style={styles.unlockTitle}>Badge Unlocked!</ThemedText>

          <LinearGradient
            colors={colors}
            style={styles.unlockBadgeContainer}
          >
            <ThemedText style={styles.unlockBadgeEmoji}>{badge.icon}</ThemedText>
          </LinearGradient>

          <ThemedText style={styles.unlockBadgeName}>{badge.name}</ThemedText>
          <ThemedText style={styles.unlockBadgeDesc}>{badge.description}</ThemedText>

          <View style={[styles.unlockRarityBadge, { backgroundColor: colors[0] }]}>
            <Feather name="star" size={12} color="#fff" />
            <ThemedText style={styles.unlockRarityText}>
              {badge.rarity.toUpperCase()}
            </ThemedText>
          </View>

          <Pressable style={styles.dismissButton} onPress={onClose}>
            <ThemedText style={styles.dismissText}>Awesome!</ThemedText>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function BadgeDisplay({ badges, unlockedBadges, onBadgePress, compact }: BadgeDisplayProps) {
  const unlockedIds = new Set(unlockedBadges.map(b => b.id));

  // Sort: unlocked first, then by rarity
  const sortedBadges = [...badges].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id) ? 1 : 0;
    const bUnlocked = unlockedIds.has(b.id) ? 1 : 0;
    if (aUnlocked !== bUnlocked) return bUnlocked - aUnlocked;

    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Badges</ThemedText>
        <ThemedText style={styles.count}>
          {unlockedBadges.length}/{badges.length} unlocked
        </ThemedText>
      </View>

      {compact ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactScroll}
        >
          {sortedBadges.slice(0, 8).map((badge, index) => (
            <BadgeItem
              key={badge.id}
              badge={badge}
              index={index}
              isUnlocked={unlockedIds.has(badge.id)}
              onPress={() => onBadgePress?.(badge)}
              compact
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {sortedBadges.map((badge, index) => (
            <BadgeItem
              key={badge.id}
              badge={badge}
              index={index}
              isUnlocked={unlockedIds.has(badge.id)}
              onPress={() => onBadgePress?.(badge)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Progress bar for next badge
export function BadgeProgress({
  currentProgress,
  targetProgress,
  badgeName,
  badgeIcon,
}: {
  currentProgress: number;
  targetProgress: number;
  badgeName: string;
  badgeIcon: string;
}) {
  const progress = Math.min(currentProgress / targetProgress, 1);
  const animProgress = useSharedValue(0);

  useEffect(() => {
    animProgress.value = withTiming(progress, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animProgress.value * 100}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <ThemedText style={styles.progressEmoji}>{badgeIcon}</ThemedText>
          <ThemedText style={styles.progressBadgeName}>{badgeName}</ThemedText>
        </View>
        <ThemedText style={styles.progressText}>
          {currentProgress}/{targetProgress}
        </ThemedText>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  count: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  compactScroll: {
    gap: 12,
  },
  badgeItem: {
    width: 80,
    alignItems: 'center',
  },
  badgeItemCompact: {
    width: 56,
  },
  badgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIconContainerCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 0,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeEmojiCompact: {
    fontSize: 22,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: Colors.textSecondary,
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockModal: {
    backgroundColor: Colors.dark.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
  },
  particles: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: 24,
  },
  unlockBadgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  unlockBadgeEmoji: {
    fontSize: 48,
  },
  unlockBadgeName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  unlockBadgeDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  unlockRarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 24,
  },
  unlockRarityText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  dismissButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  progressContainer: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressEmoji: {
    fontSize: 20,
  },
  progressBadgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.dark.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
});
