import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Card } from "./Card";
import { Spacer } from "./Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth-context";
import {
  foodTruckService,
  LocationAnalytics as LocationAnalyticsType,
  LocationHistoryEntry,
} from "@/lib/food-truck-service";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type TabType = "best" | "history";

export function LocationAnalytics() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("best");
  const [bestLocations, setBestLocations] = useState<LocationAnalyticsType[]>([]);
  const [history, setHistory] = useState<LocationHistoryEntry[]>([]);

  useEffect(() => {
    if (user?.id) {
      setBestLocations(foodTruckService.getBestLocations(user.id, 10));
      setHistory(foodTruckService.getLocationHistory(user.id));
    }
  }, [user?.id]);

  const renderStars = (rating: number) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Feather
            key={star}
            name="star"
            size={12}
            color={star <= rating ? Colors.warning : theme.textSecondary}
            style={{ opacity: star <= rating ? 1 : 0.3 }}
          />
        ))}
      </View>
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: string, end?: string): string => {
    if (!end) return "In progress";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const renderBestLocation = ({ item, index }: { item: LocationAnalyticsType; index: number }) => (
    <Card style={styles.locationCard}>
      <View style={styles.rankBadge}>
        <ThemedText type="caption" style={{ color: "#fff", fontWeight: "700" }}>
          #{index + 1}
        </ThemedText>
      </View>

      <View style={styles.locationHeader}>
        <View style={[styles.locationIcon, { backgroundColor: Colors.primary + "20" }]}>
          <Feather name="map-pin" size={20} color={Colors.primary} />
        </View>
        <View style={styles.locationInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
            {item.address}
          </ThemedText>
          <ThemedText type="caption" secondary>
            {item.visitCount} visits
          </ThemedText>
        </View>
        {renderStars(item.rating)}
      </View>

      <Spacer size="md" />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Feather name="users" size={14} color={Colors.secondary} />
          <ThemedText type="small" secondary style={{ marginLeft: 4 }}>
            {item.avgCustomers} avg customers
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <Feather name="dollar-sign" size={14} color={Colors.success} />
          <ThemedText type="small" style={{ marginLeft: 4, color: Colors.success }}>
            {formatCurrency(item.avgRevenue)} avg
          </ThemedText>
        </View>
      </View>

      <Spacer size="md" />

      <View style={[styles.insightBox, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.insightRow}>
          <Feather name="calendar" size={14} color={Colors.primary} />
          <ThemedText type="caption" style={{ marginLeft: Spacing.sm }}>
            Best days: {item.bestDays.join(", ")}
          </ThemedText>
        </View>
        <View style={styles.insightRow}>
          <Feather name="clock" size={14} color={Colors.primary} />
          <ThemedText type="caption" style={{ marginLeft: Spacing.sm }}>
            Best time: {item.bestTimeSlot}
          </ThemedText>
        </View>
      </View>
    </Card>
  );

  const renderHistoryItem = ({ item }: { item: LocationHistoryEntry }) => (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.historyDate}>
          <ThemedText type="small" style={{ fontWeight: "600" }}>
            {formatDate(item.startTime)}
          </ThemedText>
          <View style={[styles.durationBadge, { backgroundColor: Colors.secondary + "20" }]}>
            <Feather name="clock" size={10} color={Colors.secondary} />
            <ThemedText type="caption" style={{ marginLeft: 2, color: Colors.secondary }}>
              {formatDuration(item.startTime, item.endTime)}
            </ThemedText>
          </View>
        </View>
        {!item.endTime && (
          <View style={[styles.liveBadge, { backgroundColor: Colors.success }]}>
            <ThemedText type="caption" style={{ color: "#fff" }}>
              LIVE
            </ThemedText>
          </View>
        )}
      </View>

      <Spacer size="sm" />

      <View style={styles.historyLocation}>
        <Feather name="map-pin" size={14} color={theme.textSecondary} />
        <ThemedText type="small" secondary style={{ marginLeft: Spacing.xs, flex: 1 }} numberOfLines={1}>
          {item.address || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
        </ThemedText>
      </View>

      {(item.customersServed || item.revenue) && (
        <>
          <Spacer size="sm" />
          <View style={styles.historyStats}>
            {item.customersServed && (
              <View style={styles.historyStatItem}>
                <Feather name="users" size={12} color={Colors.secondary} />
                <ThemedText type="caption" style={{ marginLeft: 4 }}>
                  {item.customersServed}
                </ThemedText>
              </View>
            )}
            {item.revenue && (
              <View style={styles.historyStatItem}>
                <Feather name="dollar-sign" size={12} color={Colors.success} />
                <ThemedText type="caption" style={{ marginLeft: 4, color: Colors.success }}>
                  {formatCurrency(item.revenue)}
                </ThemedText>
              </View>
            )}
          </View>
        </>
      )}

      {item.notes && (
        <>
          <Spacer size="sm" />
          <ThemedText type="caption" secondary style={{ fontStyle: "italic" }}>
            "{item.notes}"
          </ThemedText>
        </>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "best" && { backgroundColor: Colors.primary },
          ]}
          onPress={() => setActiveTab("best")}
        >
          <Feather
            name="award"
            size={16}
            color={activeTab === "best" ? "#fff" : theme.textSecondary}
          />
          <ThemedText
            type="small"
            style={{
              marginLeft: Spacing.xs,
              color: activeTab === "best" ? "#fff" : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            Best Spots
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "history" && { backgroundColor: Colors.primary },
          ]}
          onPress={() => setActiveTab("history")}
        >
          <Feather
            name="clock"
            size={16}
            color={activeTab === "history" ? "#fff" : theme.textSecondary}
          />
          <ThemedText
            type="small"
            style={{
              marginLeft: Spacing.xs,
              color: activeTab === "history" ? "#fff" : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            History
          </ThemedText>
        </Pressable>
      </View>

      <Spacer size="lg" />

      {activeTab === "best" ? (
        bestLocations.length > 0 ? (
          <FlatList
            data={bestLocations}
            keyExtractor={(item) => item.locationId}
            renderItem={renderBestLocation}
            ItemSeparatorComponent={() => <Spacer size="md" />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
          />
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="map" size={40} color={theme.textSecondary} />
            <Spacer size="md" />
            <ThemedText type="body" secondary>
              No location data yet
            </ThemedText>
            <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
              Go live at different spots to see your best performing locations
            </ThemedText>
          </Card>
        )
      ) : history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          ItemSeparatorComponent={() => <Spacer size="sm" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        />
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="clock" size={40} color={theme.textSecondary} />
          <Spacer size="md" />
          <ThemedText type="body" secondary>
            No history yet
          </ThemedText>
          <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
            Your location sessions will appear here
          </ThemedText>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  locationCard: {
    position: "relative",
    overflow: "visible",
  },
  rankBadge: {
    position: "absolute",
    top: -8,
    left: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  insightBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyCard: {
    padding: Spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  liveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  historyLocation: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyStats: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  historyStatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
});
