import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useData, FOOD_CATEGORIES, FoodCategory } from "@/lib/data-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface CategoryFilterProps {
  showLabel?: boolean;
}

export function CategoryFilter({ showLabel = true }: CategoryFilterProps) {
  const { theme } = useTheme();
  const { selectedCategory, setSelectedCategory, getFilteredVendors } = useData();

  const handleCategoryPress = (category: FoodCategory) => {
    setSelectedCategory(category);
  };

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.headerRow}>
          <ThemedText type="h4">Categories</ThemedText>
          <ThemedText type="caption" secondary>
            {getFilteredVendors().length} places
          </ThemedText>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FOOD_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <Pressable
              key={category.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected
                    ? category.color
                    : theme.backgroundSecondary,
                  borderColor: isSelected ? category.color : theme.border,
                },
              ]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected
                      ? "rgba(255,255,255,0.25)"
                      : category.color + "20",
                  },
                ]}
              >
                <Feather
                  name={category.icon as any}
                  size={16}
                  color={isSelected ? "#fff" : category.color}
                />
              </View>
              <ThemedText
                type="small"
                style={[
                  styles.categoryLabel,
                  { color: isSelected ? "#fff" : theme.text },
                ]}
              >
                {category.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.xs,
  },
  categoryLabel: {
    fontWeight: "600",
  },
});
