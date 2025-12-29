import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ 
  width = "100%", 
  height = 20, 
  borderRadius = BorderRadius.sm,
  style 
}: SkeletonProps) {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.backgroundTertiary,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function DealCardSkeleton() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <Skeleton width={64} height={64} borderRadius={BorderRadius.sm} />
        <View style={styles.headerInfo}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
          <View style={styles.badges}>
            <Skeleton width={60} height={22} borderRadius={BorderRadius.full} />
            <Skeleton width={40} height={22} borderRadius={BorderRadius.full} style={{ marginLeft: 8 }} />
          </View>
        </View>
      </View>
      <View style={[styles.content, { backgroundColor: theme.backgroundSecondary }]}>
        <Skeleton width="80%" height={16} />
        <View style={styles.priceRow}>
          <Skeleton width={50} height={20} />
          <Skeleton width={60} height={24} style={{ marginLeft: 8 }} />
        </View>
      </View>
    </View>
  );
}

export function VendorCardSkeleton() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.vendorCard, { backgroundColor: theme.backgroundDefault }]}>
      <Skeleton width={64} height={64} borderRadius={BorderRadius.sm} />
      <View style={styles.vendorInfo}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
        <Skeleton width="30%" height={22} borderRadius={BorderRadius.full} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    padding: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  badges: {
    flexDirection: "row",
    marginTop: 8,
  },
  content: {
    padding: 12,
    margin: 8,
    marginTop: 0,
    borderRadius: BorderRadius.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  vendorCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: BorderRadius.md,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
});
