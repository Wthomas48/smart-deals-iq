import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
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

// Note: Full AR implementation requires expo-camera and device sensors
// This is a conceptual implementation showing the UI/UX

interface ARDeal {
  id: string;
  vendorName: string;
  discount: string;
  distance: number; // meters
  direction: number; // degrees from north
  category: string;
  expiresIn: number; // minutes
}

interface ARDealViewProps {
  deals: ARDeal[];
  onDealPress: (deal: ARDeal) => void;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// AR Deal Marker component
function ARMarker({
  deal,
  index,
  onPress,
}: {
  deal: ARDeal;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(0);
  const float = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Entrance animation
    scale.value = withDelay(index * 100, withSpring(1, { damping: 10 }));

    // Floating animation
    float.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Pulse for urgent deals
    if (deal.expiresIn < 30) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, []);

  // Position based on direction and distance (simplified 2D representation)
  const x = Math.sin((deal.direction * Math.PI) / 180) * (SCREEN_WIDTH * 0.3) + SCREEN_WIDTH / 2;
  const y = Math.cos((deal.direction * Math.PI) / 180) * (SCREEN_HEIGHT * 0.2) + SCREEN_HEIGHT / 3;

  // Size based on distance (closer = larger)
  const baseSize = interpolate(deal.distance, [0, 500], [1, 0.5]);

  const markerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value },
      { scale: scale.value * pulse.value * baseSize },
    ],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const isUrgent = deal.expiresIn < 30;

  return (
    <Animated.View
      style={[
        styles.marker,
        { left: x - 60, top: y - 50 },
        markerStyle,
      ]}
    >
      <Pressable onPress={handlePress}>
        {/* Glow effect */}
        <View style={[styles.markerGlow, isUrgent && styles.markerGlowUrgent]} />

        {/* Distance line */}
        <View style={styles.distanceLine}>
          <View style={[styles.lineSegment, { height: deal.distance / 5 }]} />
          <View style={styles.lineDot} />
        </View>

        {/* Main badge */}
        <LinearGradient
          colors={isUrgent ? [Colors.error, '#B91C1C'] : [Colors.primary, '#C2410C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.markerBadge}
        >
          <ThemedText style={styles.discountText}>{deal.discount}</ThemedText>
          <ThemedText style={styles.vendorText} numberOfLines={1}>
            {deal.vendorName}
          </ThemedText>
          <View style={styles.markerMeta}>
            <Feather name="map-pin" size={10} color="rgba(255,255,255,0.8)" />
            <ThemedText style={styles.distanceText}>{deal.distance}m</ThemedText>
            {isUrgent && (
              <>
                <Feather name="clock" size={10} color="rgba(255,255,255,0.8)" />
                <ThemedText style={styles.timeText}>{deal.expiresIn}m</ThemedText>
              </>
            )}
          </View>
        </LinearGradient>

        {/* Category icon */}
        <View style={styles.categoryBadge}>
          <ThemedText style={styles.categoryEmoji}>
            {getCategoryEmoji(deal.category)}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    food: '🍔',
    coffee: '☕',
    pizza: '🍕',
    sushi: '🍣',
    mexican: '🌮',
    chinese: '🥡',
    italian: '🍝',
    dessert: '🍰',
    drinks: '🍹',
    grocery: '🛒',
    retail: '🛍️',
    fitness: '💪',
    spa: '💆',
    entertainment: '🎬',
    default: '🏷️',
  };
  return emojis[category.toLowerCase()] || emojis.default;
}

export function ARDealView({ deals, onDealPress, onClose }: ARDealViewProps) {
  const [selectedDeal, setSelectedDeal] = useState<ARDeal | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Scanning animation
  const scanLine = useSharedValue(0);

  useEffect(() => {
    scanLine.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      3,
      false
    );

    // Stop scanning after animation
    setTimeout(() => setIsScanning(false), 6000);
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanLine.value * 100}%`,
    opacity: 1 - scanLine.value,
  }));

  const handleDealPress = (deal: ARDeal) => {
    setSelectedDeal(deal);
    onDealPress(deal);
  };

  return (
    <View style={styles.container}>
      {/* Camera placeholder (would be actual camera in real implementation) */}
      <View style={styles.cameraPlaceholder}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.cameraGradient}
        />

        {/* Grid overlay for AR feel */}
        <View style={styles.gridOverlay}>
          {[...Array(10)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.gridHorizontal, { top: `${i * 10}%` }]} />
          ))}
          {[...Array(10)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.gridVertical, { left: `${i * 10}%` }]} />
          ))}
        </View>

        {/* Scanning animation */}
        {isScanning && (
          <Animated.View style={[styles.scanLine, scanStyle]}>
            <LinearGradient
              colors={['transparent', Colors.primary, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scanGradient}
            />
          </Animated.View>
        )}

        {/* AR Markers */}
        {!isScanning && deals.map((deal, index) => (
          <ARMarker
            key={deal.id}
            deal={deal}
            index={index}
            onPress={() => handleDealPress(deal)}
          />
        ))}

        {/* Compass */}
        <View style={styles.compass}>
          <Feather name="navigation" size={20} color={Colors.primary} />
          <ThemedText style={styles.compassText}>N</ThemedText>
        </View>

        {/* Deal counter */}
        <View style={styles.dealCounter}>
          <Feather name="tag" size={16} color="#fff" />
          <ThemedText style={styles.dealCountText}>{deals.length} deals nearby</ThemedText>
        </View>

        {/* Instructions */}
        {isScanning && (
          <View style={styles.instructions}>
            <Feather name="move" size={24} color="#fff" />
            <ThemedText style={styles.instructionText}>
              Move your phone to discover deals around you
            </ThemedText>
          </View>
        )}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>AR Deal Finder</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Selected deal preview */}
      {selectedDeal && (
        <View style={styles.dealPreview}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dealPreviewContent}
          >
            <View style={styles.dealPreviewInfo}>
              <ThemedText style={styles.previewDiscount}>{selectedDeal.discount}</ThemedText>
              <ThemedText style={styles.previewVendor}>{selectedDeal.vendorName}</ThemedText>
              <ThemedText style={styles.previewDistance}>{selectedDeal.distance}m away</ThemedText>
            </View>
            <Pressable style={styles.getDirectionsButton}>
              <Feather name="navigation" size={20} color={Colors.primary} />
              <ThemedText style={styles.getDirectionsText}>Go</ThemedText>
            </Pressable>
          </LinearGradient>
        </View>
      )}

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <Pressable style={styles.controlButton}>
          <Feather name="filter" size={20} color="#fff" />
          <ThemedText style={styles.controlText}>Filter</ThemedText>
        </Pressable>
        <Pressable style={styles.controlButton}>
          <Feather name="list" size={20} color="#fff" />
          <ThemedText style={styles.controlText}>List</ThemedText>
        </Pressable>
        <Pressable style={styles.controlButton}>
          <Feather name="map" size={20} color="#fff" />
          <ThemedText style={styles.controlText}>Map</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// Simpler AR button to trigger AR mode
export function ARButton({ onPress, dealCount }: { onPress: () => void; dealCount: number }) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withSpring(0.9),
      withSpring(1)
    );
    onPress();
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.5,
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  return (
    <Animated.View style={[styles.arButton, buttonStyle]}>
      <Pressable onPress={handlePress} style={styles.arButtonInner}>
        <Animated.View style={[styles.arButtonGlow, glowStyle]} />
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.arButtonGradient}
        >
          <Feather name="camera" size={24} color="#fff" />
          <ThemedText style={styles.arButtonText}>AR View</ThemedText>
          {dealCount > 0 && (
            <View style={styles.arBadge}>
              <ThemedText style={styles.arBadgeText}>{dealCount}</ThemedText>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    flex: 1,
    position: 'relative',
  },
  cameraGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: Colors.primary,
  },
  gridHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  scanGradient: {
    flex: 1,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerGlow: {
    position: 'absolute',
    width: 120,
    height: 80,
    backgroundColor: Colors.primary,
    borderRadius: 40,
    opacity: 0.2,
  },
  markerGlowUrgent: {
    backgroundColor: Colors.error,
  },
  distanceLine: {
    alignItems: 'center',
    marginBottom: 4,
  },
  lineSegment: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  lineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  markerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  discountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  vendorText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  markerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  categoryBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  compass: {
    position: 'absolute',
    top: 100,
    right: 20,
    alignItems: 'center',
  },
  compassText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  dealCounter: {
    position: 'absolute',
    top: 100,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  dealCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  dealPreview: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  dealPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  dealPreviewInfo: {
    flex: 1,
  },
  previewDiscount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  previewVendor: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  previewDistance: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  getDirectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  getDirectionsText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  controlText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  arButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  arButtonInner: {
    position: 'relative',
  },
  arButtonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: Colors.primary,
    borderRadius: 30,
  },
  arButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  arButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  arBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  arBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
});
