import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  points: number;
  level: number;
  badge?: string;
  isCurrentUser?: boolean;
  change?: 'up' | 'down' | 'same';
  changeAmount?: number;
}

interface LeaderboardProps {
  data: LeaderboardEntry[];
  title?: string;
  subtitle?: string;
  type?: 'customers' | 'vendors';
  onEntryPress?: (entry: LeaderboardEntry) => void;
}

const RANK_COLORS: Record<number, readonly [string, string]> = {
  1: ['#FFD700', '#FFA500'] as const, // Gold
  2: ['#C0C0C0', '#A0A0A0'] as const, // Silver
  3: ['#CD7F32', '#8B4513'] as const, // Bronze
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LeaderboardItem({
  item,
  index,
  onPress,
}: {
  item: LeaderboardEntry;
  index: number;
  onPress?: () => void;
}) {
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withDelay(index * 80, withSpring(1, { damping: 12 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: animValue.value,
    transform: [
      { translateX: interpolate(animValue.value, [0, 1], [-50, 0]) },
      { scale: interpolate(animValue.value, [0, 0.5, 1], [0.8, 1.05, 1]) },
    ],
  }));

  const isTopThree = item.rank <= 3;
  const gradientColors = RANK_COLORS[item.rank as 1 | 2 | 3] || ([Colors.dark.card, Colors.dark.card] as const);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <AnimatedPressable
      style={[
        styles.itemContainer,
        item.isCurrentUser && styles.currentUserContainer,
        animStyle,
      ]}
      onPress={handlePress}
    >
      {isTopThree ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rankBadge}
        >
          {item.rank === 1 && <ThemedText style={styles.crownEmoji}>👑</ThemedText>}
          <ThemedText style={styles.rankText}>{item.rank}</ThemedText>
        </LinearGradient>
      ) : (
        <View style={styles.rankBadgeNormal}>
          <ThemedText style={styles.rankTextNormal}>{item.rank}</ThemedText>
        </View>
      )}

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
            <ThemedText style={styles.avatarInitial}>
              {item.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
        {item.badge && (
          <View style={styles.badgeContainer}>
            <ThemedText style={styles.badgeEmoji}>{item.badge}</ThemedText>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <ThemedText
            style={[styles.name, item.isCurrentUser && styles.currentUserName]}
            numberOfLines={1}
          >
            {item.name}
          </ThemedText>
          {item.isCurrentUser && (
            <View style={styles.youBadge}>
              <ThemedText style={styles.youText}>You</ThemedText>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <ThemedText style={styles.level}>Level {item.level}</ThemedText>
          <View style={styles.dot} />
          <ThemedText style={styles.points}>{item.points.toLocaleString()} pts</ThemedText>
        </View>
      </View>

      {/* Change indicator */}
      {item.change && item.change !== 'same' && (
        <View style={styles.changeContainer}>
          <Feather
            name={item.change === 'up' ? 'arrow-up' : 'arrow-down'}
            size={14}
            color={item.change === 'up' ? Colors.success : Colors.error}
          />
          <ThemedText
            style={[
              styles.changeAmount,
              { color: item.change === 'up' ? Colors.success : Colors.error },
            ]}
          >
            {item.changeAmount}
          </ThemedText>
        </View>
      )}
    </AnimatedPressable>
  );
}

export function Leaderboard({ data, title, subtitle, type = 'customers', onEntryPress }: LeaderboardProps) {
  // Get current user for highlighting
  const currentUser = data.find(d => d.isCurrentUser);

  return (
    <View style={styles.container}>
      {/* Header */}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <View style={styles.titleRow}>
              <Feather name="award" size={24} color={Colors.accent} />
              <ThemedText style={styles.title}>{title}</ThemedText>
            </View>
          )}
          {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
        </View>
      )}

      {/* Top 3 Podium */}
      <View style={styles.podium}>
        {data.slice(0, 3).map((entry, index) => {
          const position = index === 0 ? 1 : index === 1 ? 0 : 2; // Reorder: 2nd, 1st, 3rd
          const heights = [100, 130, 80];
          const actualEntry = data[position === 0 ? 1 : position === 1 ? 0 : 2];

          if (!actualEntry) return null;

          return (
            <View key={actualEntry.id} style={styles.podiumItem}>
              <View style={styles.podiumAvatarContainer}>
                {actualEntry.avatar ? (
                  <Image
                    source={{ uri: actualEntry.avatar }}
                    style={[
                      styles.podiumAvatar,
                      position === 1 && styles.podiumAvatarFirst,
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.podiumAvatarPlaceholder,
                      position === 1 && styles.podiumAvatarFirst,
                    ]}
                  >
                    <ThemedText style={styles.podiumInitial}>
                      {actualEntry.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                )}
                {position === 1 && (
                  <ThemedText style={styles.podiumCrown}>👑</ThemedText>
                )}
              </View>
              <ThemedText style={styles.podiumName} numberOfLines={1}>
                {actualEntry.name}
              </ThemedText>
              <ThemedText style={styles.podiumPoints}>
                {actualEntry.points.toLocaleString()}
              </ThemedText>
              <LinearGradient
                colors={RANK_COLORS[(position === 1 ? 1 : position === 0 ? 2 : 3) as 1 | 2 | 3]}
                style={[styles.podiumBar, { height: heights[position] }]}
              >
                <ThemedText style={styles.podiumRank}>
                  {position === 1 ? '1' : position === 0 ? '2' : '3'}
                </ThemedText>
              </LinearGradient>
            </View>
          );
        })}
      </View>

      {/* Rest of the list */}
      <FlatList
        data={data.slice(3)}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LeaderboardItem
            item={item}
            index={index}
            onPress={() => onEntryPress?.(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Current user summary if not in view */}
      {currentUser && currentUser.rank > 10 && (
        <View style={styles.currentUserSummary}>
          <ThemedText style={styles.currentUserSummaryText}>
            Your rank: #{currentUser.rank} with {currentUser.points.toLocaleString()} points
          </ThemedText>
          <Feather name="chevron-up" size={16} color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 100,
  },
  podiumAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  podiumAvatarFirst: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  podiumAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  podiumCrown: {
    position: 'absolute',
    top: -16,
    left: '50%',
    marginLeft: -10,
    fontSize: 20,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  podiumBar: {
    width: '80%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  currentUserContainer: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  crownEmoji: {
    position: 'absolute',
    top: -8,
    fontSize: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  rankBadgeNormal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankTextNormal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 12,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  currentUserName: {
    color: Colors.primary,
  },
  youBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  level: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textSecondary,
    marginHorizontal: 6,
  },
  points: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  currentUserSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.dark.card,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: 8,
  },
  currentUserSummaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
