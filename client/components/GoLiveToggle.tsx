import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Card } from "./Card";
import { Spacer } from "./Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth-context";
import { foodTruckService, TruckLocation } from "@/lib/food-truck-service";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface GoLiveToggleProps {
  compact?: boolean;
  onStatusChange?: (isLive: boolean) => void;
}

export function GoLiveToggle({ compact = false, onStatusChange }: GoLiveToggleProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [customersServed, setCustomersServed] = useState("");
  const [revenue, setRevenue] = useState("");
  const [currentLocation, setCurrentLocation] = useState<TruckLocation | null>(null);
  const [liveTime, setLiveTime] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check initial live status
    if (user?.id) {
      const live = foodTruckService.isVendorLive(user.id);
      setIsLive(live);
    }

    // Subscribe to updates
    const unsubscribe = foodTruckService.subscribe((trucks) => {
      if (user?.id) {
        const myTruck = trucks.find((t) => t.vendorId === user.id);
        setCurrentLocation(myTruck || null);
        setIsLive(!!myTruck);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Pulse animation when live
  useEffect(() => {
    if (isLive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isLive]);

  // Live timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setLiveTime((t) => t + 1);
      }, 1000);
    } else {
      setLiveTime(0);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const formatLiveTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleToggle = async () => {
    if (!user?.id || !user?.name) {
      Alert.alert("Error", "Please sign in to go live");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      if (isLive) {
        // Show end session modal
        setShowEndModal(true);
        setLoading(false);
      } else {
        // Go live
        const success = await foodTruckService.goLive(user.id, user.name);
        if (success) {
          setIsLive(true);
          onStatusChange?.(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Slide animation
          Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        } else {
          Alert.alert("Error", "Could not access your location. Please enable location services.");
        }
        setLoading(false);
      }
    } catch (error) {
      console.error("Toggle error:", error);
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!user?.id) return;

    setLoading(true);
    await foodTruckService.goOffline(user.id, {
      customersServed: customersServed ? parseInt(customersServed) : undefined,
      revenue: revenue ? parseFloat(revenue) : undefined,
    });

    setIsLive(false);
    setShowEndModal(false);
    setCustomersServed("");
    setRevenue("");
    onStatusChange?.(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);

    // Reset animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  if (compact) {
    return (
      <Pressable
        style={[
          styles.compactContainer,
          { backgroundColor: isLive ? Colors.success : theme.backgroundSecondary },
        ]}
        onPress={handleToggle}
        disabled={loading}
      >
        {isLive && (
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
        )}
        <ThemedText
          type="small"
          style={{ color: isLive ? "#fff" : theme.text, fontWeight: "600" }}
        >
          {loading ? "..." : isLive ? "LIVE" : "GO LIVE"}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            {isLive && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    backgroundColor: Colors.success + "30",
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
            )}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isLive ? Colors.success : theme.textSecondary },
              ]}
            />
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {isLive ? "You're Live!" : "Go Live"}
            </ThemedText>
          </View>
          {isLive && (
            <View style={[styles.timeBadge, { backgroundColor: Colors.success + "20" }]}>
              <Feather name="clock" size={12} color={Colors.success} />
              <ThemedText type="caption" style={{ color: Colors.success, marginLeft: 4 }}>
                {formatLiveTime(liveTime)}
              </ThemedText>
            </View>
          )}
        </View>

        {isLive && currentLocation && (
          <>
            <Spacer size="md" />
            <View style={[styles.locationInfo, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="map-pin" size={16} color={Colors.primary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm, flex: 1 }} numberOfLines={2}>
                {currentLocation.address || "Location detected"}
              </ThemedText>
            </View>
          </>
        )}

        <Spacer size="lg" />

        <Pressable
          style={[
            styles.toggleButton,
            {
              backgroundColor: isLive ? Colors.error : Colors.success,
            },
          ]}
          onPress={handleToggle}
          disabled={loading}
        >
          {isLive ? (
            <>
              <Feather name="stop-circle" size={20} color="#fff" />
              <ThemedText type="body" style={styles.toggleText}>
                {loading ? "Ending..." : "End Session"}
              </ThemedText>
            </>
          ) : (
            <>
              <Feather name="radio" size={20} color="#fff" />
              <ThemedText type="body" style={styles.toggleText}>
                {loading ? "Starting..." : "Start Live"}
              </ThemedText>
            </>
          )}
        </Pressable>

        <Spacer size="sm" />

        <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
          {isLive
            ? "Customers can see your location on the map"
            : "Share your location with hungry customers"}
        </ThemedText>
      </Card>

      {/* End Session Modal */}
      <Modal visible={showEndModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">End Live Session</ThemedText>
              <Pressable onPress={() => setShowEndModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <Spacer size="lg" />

            <ThemedText type="body" secondary>
              Add some stats to track your performance at this location (optional):
            </ThemedText>

            <Spacer size="lg" />

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ fontWeight: "600" }}>
                Customers Served
              </ThemedText>
              <Spacer size="xs" />
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, color: theme.text },
                ]}
                placeholder="e.g., 45"
                placeholderTextColor={theme.textSecondary}
                value={customersServed}
                onChangeText={setCustomersServed}
                keyboardType="number-pad"
              />
            </View>

            <Spacer size="md" />

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ fontWeight: "600" }}>
                Revenue ($)
              </ThemedText>
              <Spacer size="xs" />
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, color: theme.text },
                ]}
                placeholder="e.g., 350.00"
                placeholderTextColor={theme.textSecondary}
                value={revenue}
                onChangeText={setRevenue}
                keyboardType="decimal-pad"
              />
            </View>

            <Spacer size="xl" />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowEndModal(false)}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: Colors.error }]}
                onPress={handleEndSession}
              >
                <ThemedText type="body" style={{ color: "#fff" }}>
                  End Session
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  pulseRing: {
    position: "absolute",
    left: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  toggleText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputGroup: {},
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
