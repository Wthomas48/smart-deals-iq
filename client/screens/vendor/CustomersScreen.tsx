import React, { useState } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData, CustomerRecord } from "@/lib/data-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

type FilterType = "all" | "top" | "atrisk" | "new";

export default function CustomersScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { customers } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "top", label: "Top Spenders" },
    { key: "atrisk", label: "At Risk" },
    { key: "new", label: "New" },
  ];

  const getFilteredCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (activeFilter) {
      case "top":
        return [...filtered].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
      case "atrisk":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return filtered.filter((c) => new Date(c.lastVisit) < thirtyDaysAgo);
      case "new":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return filtered.filter((c) => c.visitCount <= 2);
      default:
        return filtered;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderCustomer = ({ item }: { item: CustomerRecord }) => (
    <Card style={styles.customerCard}>
      <View style={styles.customerContent}>
        <View style={[styles.avatar, { backgroundColor: Colors.secondary + "30" }]}>
          <ThemedText type="body" style={{ color: Colors.secondary, fontWeight: "600" }}>
            {getInitials(item.name)}
          </ThemedText>
        </View>
        <View style={styles.customerInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>{item.name}</ThemedText>
          <ThemedText type="small" secondary>{item.email}</ThemedText>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Feather name="repeat" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={styles.statText}>
                {item.visitCount} visits
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <Feather name="dollar-sign" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={styles.statText}>
                ${item.totalSpent.toFixed(2)}
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <Feather name="clock" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={styles.statText}>
                {formatDate(item.lastVisit)}
              </ThemedText>
            </View>
          </View>
        </View>
        <Pressable style={[styles.sendOfferButton, { backgroundColor: Colors.primary + "15" }]}>
          <Feather name="send" size={16} color={Colors.primary} />
        </Pressable>
      </View>
    </Card>
  );

  const filteredCustomers = getFilteredCustomers();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search customers..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <Pressable
              key={filter.key}
              style={[
                styles.filterChip,
                { backgroundColor: activeFilter === filter.key ? Colors.primary : theme.backgroundDefault },
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <ThemedText
                type="small"
                style={{ color: activeFilter === filter.key ? "#fff" : theme.text }}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <Spacer size="sm" />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ThemedText type="small" secondary>
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={40} color={theme.textSecondary} />
            <Spacer size="lg" />
            <ThemedText type="h4">No customers found</ThemedText>
            <ThemedText type="body" secondary style={styles.emptyText}>
              {searchQuery ? "Try adjusting your search" : "Customers will appear here as they make purchases"}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  customerCard: {
    padding: 0,
  },
  customerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  customerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 4,
  },
  sendOfferButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
