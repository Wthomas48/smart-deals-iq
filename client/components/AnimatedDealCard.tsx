import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { Shadows } from '@/constants/theme';

interface AnimatedDealCardProps {
  deal: {
    id: string;
    vendorName: string;
    vendorLogo?: string;
    title: string;
    description: string;
    discount: string;
    originalPrice: number;
    discountedPrice: number;
    expiresAt: string;
    category: string;
    distance?: number;
    rating: number;
    claimedCount: number;
    imageUrl?: string;
  };
  index: number;
  onPress: () => void;
  onFavorite: () => void;
  isFavorite: boolean;
  isDesktop?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedDealCard({
  deal,
  index,
  onPress,
  onFavorite,
  isFavorite,
  isDesktop = false,
}: AnimatedDealCardProps) {
  // Entrance animation
  const enterAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const favoriteAnim = useSharedValue(isFavorite ? 1 : 0);

  useEffect(() => {
    enterAnim.value = withDelay(
      index * 100,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  }, []);

  useEffect(() => {
    favoriteAnim.value = withSpring(isFavorite ? 1 : 0);
  }, [isFavorite]);

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.97);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  const handleFavoritePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onFavorite();
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: enterAnim.value,
    transform: [
      { translateY: interpolate(enterAnim.value, [0, 1], [50, 0]) },
      { scale: scaleAnim.value },
    ],
  }));

  const favoriteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(favoriteAnim.value, [0, 0.5, 1], [1, 1.3, 1]) }],
  }));

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(deal.expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const savings = deal.originalPrice - deal.discountedPrice;
  const isUrgent = new Date(deal.expiresAt).getTime() - Date.now() < 2 * 60 * 60 * 1000; // Less than 2 hours

  return (
    <AnimatedPressable
      style={[styles.container, isDesktop && styles.containerDesktop, containerStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Deal Image */}
      <View style={styles.imageContainer}>
        {deal.imageUrl ? (
          <Image source={{ uri: deal.imageUrl }} style={styles.image} />
        ) : (
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imagePlaceholder}
          >
            <Feather name="tag" size={32} color="#fff" />
          </LinearGradient>
        )}

        {/* Discount badge */}
        <View style={[styles.discountBadge, isUrgent && styles.urgentBadge]}>
          <ThemedText style={styles.discountText}>{deal.discount}</ThemedText>
        </View>

        {/* Favorite button */}
        <AnimatedPressable
          style={[styles.favoriteButton, favoriteStyle]}
          onPress={handleFavoritePress}
        >
          <Feather
            name={isFavorite ? 'heart' : 'heart'}
            size={20}
            color={isFavorite ? Colors.error : '#fff'}
            style={{ opacity: isFavorite ? 1 : 0.8 }}
          />
        </AnimatedPressable>

        {/* Time remaining */}
        <View style={[styles.timeBadge, isUrgent && styles.urgentTimeBadge]}>
          <Feather name="clock" size={12} color="#fff" />
          <ThemedText style={styles.timeText}>{getTimeRemaining()}</ThemedText>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header with vendor info */}
        <View style={styles.header}>
          <View style={styles.vendorInfo}>
            {deal.vendorLogo && (
              <Image source={{ uri: deal.vendorLogo }} style={styles.vendorLogo} />
            )}
            <View>
              <ThemedText style={styles.vendorName}>{deal.vendorName}</ThemedText>
              <View style={styles.ratingRow}>
                <Feather name="star" size={12} color={Colors.accent} />
                <ThemedText style={styles.rating}>{deal.rating.toFixed(1)}</ThemedText>
                <ThemedText style={styles.category}>{deal.category}</ThemedText>
              </View>
            </View>
          </View>
          {deal.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Feather name="map-pin" size={12} color={Colors.textSecondary} />
              <ThemedText style={styles.distance}>
                {deal.distance < 1 ? `${Math.round(deal.distance * 5280)}ft` : `${deal.distance.toFixed(1)}mi`}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Deal title */}
        <ThemedText style={styles.title} numberOfLines={2}>
          {deal.title}
        </ThemedText>

        {/* Description */}
        <ThemedText style={styles.description} numberOfLines={1}>
          {deal.description}
        </ThemedText>

        {/* Price row */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <ThemedText style={styles.originalPrice}>${deal.originalPrice.toFixed(2)}</ThemedText>
            <ThemedText style={styles.discountedPrice}>${deal.discountedPrice.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.savingsBadge}>
            <ThemedText style={styles.savingsText}>Save ${savings.toFixed(2)}</ThemedText>
          </View>
        </View>

        {/* Social proof */}
        <View style={styles.socialProof}>
          <Feather name="users" size={12} color={Colors.textSecondary} />
          <ThemedText style={styles.claimedText}>
            {deal.claimedCount} people claimed this deal
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...Shadows.lg,
  },
  containerDesktop: {
    maxWidth: 400,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urgentBadge: {
    backgroundColor: Colors.error,
  },
  discountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgentTimeBadge: {
    backgroundColor: Colors.error,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vendorLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distance: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.success,
  },
  savingsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  claimedText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
