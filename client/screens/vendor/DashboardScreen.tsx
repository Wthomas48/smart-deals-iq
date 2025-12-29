import React from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/lib/data-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { analytics, promotions } = useData();

  const kpis = [
    { label: "Impressions", value: analytics.impressions.toLocaleString(), icon: "eye", color: Colors.secondary },
    { label: "Clicks", value: analytics.clicks.toLocaleString(), icon: "mouse-pointer", color: Colors.primary },
    { label: "Redemptions", value: analytics.redemptions.toLocaleString(), icon: "check-circle", color: Colors.success },
    { label: "Revenue", value: `$${analytics.revenue.toFixed(0)}`, icon: "dollar-sign", color: Colors.accent },
  ];

  const maxTrend = Math.max(...analytics.trend);
  const chartHeight = 120;

  const activePromotions = promotions.filter((p) => p.isActive).length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <Card key={kpi.label} style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: kpi.color + "20" }]}>
                <Feather name={kpi.icon as any} size={20} color={kpi.color} />
              </View>
              <ThemedText type="h3" style={styles.kpiValue}>{kpi.value}</ThemedText>
              <ThemedText type="caption" secondary>{kpi.label}</ThemedText>
            </Card>
          ))}
        </View>

        <Spacer size="xl" />

        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <ThemedText type="h4">Performance Trend</ThemedText>
            <View style={[styles.periodBadge, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption">Last 7 days</ThemedText>
            </View>
          </View>
          <Spacer size="lg" />
          <View style={styles.chart}>
            {analytics.trend.map((value, index) => (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (value / maxTrend) * chartHeight,
                      backgroundColor: index === analytics.trend.length - 1 ? Colors.primary : Colors.primary + "50",
                    },
                  ]}
                />
                <ThemedText type="caption" secondary style={styles.barLabel}>
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>

        <Spacer size="xl" />

        <Card style={styles.benchmarkCard}>
          <View style={styles.benchmarkIcon}>
            <Feather name="trending-up" size={24} color={Colors.success} />
          </View>
          <View style={styles.benchmarkContent}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              You're outperforming 68% of similar vendors
            </ThemedText>
            <ThemedText type="small" secondary>
              Based on click-through rate in your area
            </ThemedText>
          </View>
        </Card>

        <Spacer size="xl" />

        <ThemedText type="h4">Quick Stats</ThemedText>
        <Spacer size="md" />

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Feather name="tag" size={24} color={Colors.primary} />
            <ThemedText type="h3" style={styles.statValue}>{activePromotions}</ThemedText>
            <ThemedText type="caption" secondary>Active Deals</ThemedText>
          </Card>
          <Card style={styles.statCard}>
            <Feather name="users" size={24} color={Colors.secondary} />
            <ThemedText type="h3" style={styles.statValue}>156</ThemedText>
            <ThemedText type="caption" secondary>Followers</ThemedText>
          </Card>
          <Card style={styles.statCard}>
            <Feather name="repeat" size={24} color={Colors.accent} />
            <ThemedText type="h3" style={styles.statValue}>42%</ThemedText>
            <ThemedText type="caption" secondary>Return Rate</ThemedText>
          </Card>
        </View>

        <Spacer size="xl" />

        <Card style={styles.tipCard}>
          <View style={[styles.tipBadge, { backgroundColor: Colors.accent + "20" }]}>
            <Feather name="zap" size={16} color={Colors.accent} />
            <ThemedText type="caption" style={{ color: Colors.accent, marginLeft: 4 }}>Tip</ThemedText>
          </View>
          <Spacer size="md" />
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            Lunch hour is your busiest time
          </ThemedText>
          <ThemedText type="small" secondary>
            Consider running special promotions between 11am-1pm to maximize engagement.
          </ThemedText>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  kpiCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    alignItems: "flex-start",
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    marginBottom: Spacing.xs,
  },
  chartCard: {},
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  periodBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
  },
  bar: {
    width: 24,
    borderRadius: BorderRadius.xs,
  },
  barLabel: {
    marginTop: Spacing.sm,
  },
  benchmarkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.success + "10",
  },
  benchmarkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  benchmarkContent: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  statValue: {
    marginVertical: Spacing.xs,
  },
  tipCard: {
    backgroundColor: Colors.accent + "08",
  },
  tipBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
});
