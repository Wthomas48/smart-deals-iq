import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useOffline } from '@/lib/offline-context';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

export function NetworkStatusBanner() {
  const { isOnline, pendingActions } = useOffline();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isOnline) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(-100, { duration: 300, easing: Easing.in(Easing.ease) });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOnline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.xs },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <Feather name="wifi-off" size={18} color="#fff" />
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>No Internet Connection</ThemedText>
          <ThemedText style={styles.subtitle}>
            Some features may be unavailable
            {pendingActions.length > 0
              ? ` \u2022 ${pendingActions.length} pending action${pendingActions.length !== 1 ? 's' : ''}`
              : ''}
          </ThemedText>
        </View>
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
    zIndex: 9999,
    backgroundColor: Colors.error,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
  },
});
