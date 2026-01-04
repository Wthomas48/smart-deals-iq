import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, Switch, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Card } from "./Card";
import { Spacer } from "./Spacer";
import { useTheme } from "@/hooks/useTheme";
import {
  foodTruckService,
  GeoFenceZone,
  POPULAR_ZONES,
} from "@/lib/food-truck-service";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface GeoFenceAlertsProps {
  onZoneToggle?: (zone: GeoFenceZone, subscribed: boolean) => void;
}

export function GeoFenceAlerts({ onZoneToggle }: GeoFenceAlertsProps) {
  const { theme } = useTheme();
  const [subscribedZones, setSubscribedZones] = useState<Set<string>>(new Set());
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  useEffect(() => {
    // Load subscribed zones
    const zones = foodTruckService.getSubscribedZones();
    setSubscribedZones(new Set(zones.map((z) => z.id)));
  }, []);

  // Group zones by city
  const zonesByCity = POPULAR_ZONES.reduce((acc, zone) => {
    const city = zone.name.split(" ").slice(-1)[0] || zone.name;
    const cityKey = zone.id.split("_")[1]; // e.g., "miami" from "zone_miami_downtown"
    if (!acc[cityKey]) {
      acc[cityKey] = [];
    }
    acc[cityKey].push(zone);
    return acc;
  }, {} as Record<string, GeoFenceZone[]>);

  const cities = Object.entries(zonesByCity).map(([key, zones]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    zones,
    subscribedCount: zones.filter((z) => subscribedZones.has(z.id)).length,
  }));

  const handleToggleZone = async (zone: GeoFenceZone) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isSubscribed = subscribedZones.has(zone.id);

    if (isSubscribed) {
      await foodTruckService.unsubscribeFromZone(zone.id);
      setSubscribedZones((prev) => {
        const next = new Set(prev);
        next.delete(zone.id);
        return next;
      });
    } else {
      await foodTruckService.subscribeToZone(zone);
      setSubscribedZones((prev) => new Set(prev).add(zone.id));
    }

    onZoneToggle?.(zone, !isSubscribed);
  };

  const handleToggleAllInCity = async (cityZones: GeoFenceZone[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const allSubscribed = cityZones.every((z) => subscribedZones.has(z.id));

    for (const zone of cityZones) {
      if (allSubscribed) {
        await foodTruckService.unsubscribeFromZone(zone.id);
      } else if (!subscribedZones.has(zone.id)) {
        await foodTruckService.subscribeToZone(zone);
      }
    }

    setSubscribedZones((prev) => {
      const next = new Set(prev);
      if (allSubscribed) {
        cityZones.forEach((z) => next.delete(z.id));
      } else {
        cityZones.forEach((z) => next.add(z.id));
      }
      return next;
    });
  };

  const formatRadius = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  const renderZone = (zone: GeoFenceZone) => {
    const isSubscribed = subscribedZones.has(zone.id);

    return (
      <Pressable
        key={zone.id}
        style={[
          styles.zoneItem,
          { backgroundColor: theme.backgroundDefault },
          isSubscribed && { backgroundColor: Colors.primary + "10" },
        ]}
        onPress={() => handleToggleZone(zone)}
      >
        <View style={styles.zoneInfo}>
          <View
            style={[
              styles.zoneIcon,
              {
                backgroundColor: isSubscribed ? Colors.primary + "20" : theme.backgroundSecondary,
              },
            ]}
          >
            <Feather
              name="map-pin"
              size={16}
              color={isSubscribed ? Colors.primary : theme.textSecondary}
            />
          </View>
          <View style={styles.zoneText}>
            <ThemedText type="small" style={{ fontWeight: "500" }}>
              {zone.name}
            </ThemedText>
            <ThemedText type="caption" secondary>
              {formatRadius(zone.radiusMeters)} radius
            </ThemedText>
          </View>
        </View>
        <Switch
          value={isSubscribed}
          onValueChange={() => handleToggleZone(zone)}
          trackColor={{ false: theme.backgroundTertiary, true: Colors.primary + "50" }}
          thumbColor={isSubscribed ? Colors.primary : theme.textSecondary}
        />
      </Pressable>
    );
  };

  const renderCity = ({ item }: { item: typeof cities[0] }) => {
    const isExpanded = expandedCity === item.id;
    const allSubscribed = item.zones.every((z) => subscribedZones.has(z.id));

    return (
      <Card style={styles.cityCard}>
        <Pressable
          style={styles.cityHeader}
          onPress={() => setExpandedCity(isExpanded ? null : item.id)}
        >
          <View style={styles.cityInfo}>
            <View style={[styles.cityIcon, { backgroundColor: Colors.secondary + "20" }]}>
              <Feather name="map" size={18} color={Colors.secondary} />
            </View>
            <View>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {item.name}
              </ThemedText>
              <ThemedText type="caption" secondary>
                {item.zones.length} zones • {item.subscribedCount} active
              </ThemedText>
            </View>
          </View>
          <View style={styles.cityActions}>
            {item.subscribedCount > 0 && (
              <View style={[styles.activeBadge, { backgroundColor: Colors.success + "20" }]}>
                <Feather name="bell" size={12} color={Colors.success} />
                <ThemedText type="caption" style={{ color: Colors.success, marginLeft: 4 }}>
                  {item.subscribedCount}
                </ThemedText>
              </View>
            )}
            <Feather
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </View>
        </Pressable>

        {isExpanded && (
          <>
            <Spacer size="md" />

            <Pressable
              style={[styles.toggleAllButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => handleToggleAllInCity(item.zones)}
            >
              <Feather
                name={allSubscribed ? "bell-off" : "bell"}
                size={16}
                color={allSubscribed ? Colors.error : Colors.primary}
              />
              <ThemedText
                type="small"
                style={{
                  marginLeft: Spacing.sm,
                  color: allSubscribed ? Colors.error : Colors.primary,
                  fontWeight: "500",
                }}
              >
                {allSubscribed ? "Unsubscribe from all" : "Subscribe to all"}
              </ThemedText>
            </Pressable>

            <Spacer size="sm" />

            {item.zones.map(renderZone)}
          </>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.warning + "20" }]}>
          <Feather name="bell" size={24} color={Colors.warning} />
        </View>
        <Spacer size="md" />
        <ThemedText type="h4">Location Alerts</ThemedText>
        <Spacer size="xs" />
        <ThemedText type="small" secondary style={{ textAlign: "center" }}>
          Get notified when food trucks arrive in your favorite areas
        </ThemedText>
      </View>

      <Spacer size="xl" />

      {subscribedZones.size > 0 && (
        <>
          <View style={[styles.summaryCard, { backgroundColor: Colors.success + "10" }]}>
            <Feather name="check-circle" size={20} color={Colors.success} />
            <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: Colors.success }}>
              You'll be notified for {subscribedZones.size} zone{subscribedZones.size !== 1 ? "s" : ""}
            </ThemedText>
          </View>
          <Spacer size="lg" />
        </>
      )}

      <FlatList
        data={cities}
        keyExtractor={(item) => item.id}
        renderItem={renderCity}
        ItemSeparatorComponent={() => <Spacer size="md" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
      />

      <Spacer size="lg" />

      <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="info" size={16} color={Colors.primary} />
        <ThemedText type="caption" secondary style={{ marginLeft: Spacing.sm, flex: 1 }}>
          Alerts are sent when a food truck goes live within the zone radius. You can unsubscribe
          anytime.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  cityCard: {
    overflow: "hidden",
  },
  cityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cityInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cityActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  toggleAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  zoneItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  zoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  zoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  zoneText: {
    flex: 1,
  },
  infoBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
});
