import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  interpolateColor,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { Shadows } from '@/constants/theme';

interface FlashDealBannerProps {
  deal: {
    id: string;
    vendorName: string;
    title: string;
    discount: string;
    originalPrice: number;
    discountedPrice: number;
    expiresIn: number; // seconds
    claimedCount: number;
    totalAvailable: number;
  };
  onPress: () => void;
  onDismiss: () => void;
}

export function FlashDealBanner({ deal, onPress, onDismiss }: FlashDealBannerProps) {
  const [timeLeft, setTimeLeft] = useState(deal.expiresIn);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animations
  const slideAnim = useSharedValue(-150);
  const pulseAnim = useSharedValue(1);
  const shakeAnim = useSharedValue(0);
  const progressAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    // Slide in animation
    slideAnim.value = withSpring(0, { damping: 12, stiffness: 100 });

    // Pulse animation for urgency
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    // Glow effect
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );

    // Haptic feedback on appear
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }

        // Shake when time is running out
        if (prev <= 30 && prev % 10 === 0) {
          shakeAnim.value = withSequence(
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }

        return prev - 1;
      });
    }, 1000);

    // Progress bar animation
    progressAnim.value = withTiming(0, {
      duration: timeLeft * 1000,
      easing: Easing.linear,
    });

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: slideAnim.value },
      { translateX: shakeAnim.value },
      { scale: pulseAnim.value },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value * 0.5,
    transform: [{ scale: 1 + glowAnim.value * 0.1 }],
  }));

  const urgencyColor = timeLeft <= 30 ? Colors.error : timeLeft <= 60 ? Colors.accent : Colors.primary;
  const remainingPercent = ((deal.totalAvailable - deal.claimedCount) / deal.totalAvailable) * 100;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Glow effect */}
      <Animated.View style={[styles.glow, glowStyle, { backgroundColor: urgencyColor }]} />

      <Pressable
        style={styles.content}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
      >
        {/* Flash icon */}
        <View style={[styles.iconContainer, { backgroundColor: urgencyColor }]}>
          <Feather name="zap" size={24} color="#fff" />
        </View>

        {/* Deal info */}
        <View style={styles.info}>
          <View style={styles.header}>
            <ThemedText style={styles.flashLabel}>FLASH DEAL</ThemedText>
            <View style={[styles.timerBadge, { backgroundColor: urgencyColor }]}>
              <Feather name="clock" size={12} color="#fff" />
              <ThemedText style={styles.timerText}>{formatTime(timeLeft)}</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.vendorName}>{deal.vendorName}</ThemedText>
          <ThemedText style={styles.dealTitle} numberOfLines={1}>
            {deal.title}
          </ThemedText>

          <View style={styles.priceRow}>
            <ThemedText style={styles.discountBadge}>{deal.discount}</ThemedText>
            <ThemedText style={styles.originalPrice}>${deal.originalPrice.toFixed(2)}</ThemedText>
            <ThemedText style={styles.discountedPrice}>${deal.discountedPrice.toFixed(2)}</ThemedText>
          </View>

          {/* Social proof */}
          <View style={styles.socialProof}>
            <Feather name="users" size={12} color={Colors.textSecondary} />
            <ThemedText style={styles.claimedText}>
              {deal.claimedCount} claimed ({Math.round(remainingPercent)}% left)
            </ThemedText>
          </View>
        </View>

        {/* Dismiss button */}
        <Pressable
          style={styles.dismissButton}
          onPress={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          <Feather name="x" size={18} color={Colors.textSecondary} />
        </Pressable>
      </Pressable>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, progressStyle, { backgroundColor: urgencyColor }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    ...Shadows.xl,
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: 100,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  flashLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  dealTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: Colors.success,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  claimedText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dismissButton: {
    padding: 4,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
