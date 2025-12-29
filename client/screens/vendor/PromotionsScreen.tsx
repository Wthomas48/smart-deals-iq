import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput, Modal, Switch, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useData, Promotion } from "@/lib/data-context";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AI_SUGGESTIONS = [
  "Taco Tuesday: Buy 2, Get 1 Free until 2pm!",
  "Happy Hour Special: 20% off all items 3-5pm",
  "Weekend Warrior: Family combo deal $29.99",
  "Flash Sale: First 50 customers get 50% off!",
  "Lunch Rush: Free drink with any entree 11am-1pm",
];

export default function PromotionsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { promotions, addPromotion, updatePromotion, deletePromotion } = useData();

  const [showModal, setShowModal] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOriginalPrice("");
    setDiscountedPrice("");
    setIsActive(true);
  };

  const handleCreate = async () => {
    if (!title || !description || !originalPrice || !discountedPrice) return;

    await addPromotion({
      title,
      description,
      originalPrice: parseFloat(originalPrice),
      discountedPrice: parseFloat(discountedPrice),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      isActive,
    });

    resetForm();
    setShowModal(false);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsGenerating(false);
    setShowAISuggestions(true);
  };

  const applyAISuggestion = (suggestion: string) => {
    setTitle(suggestion.split(":")[0].trim());
    setDescription(suggestion);
    setShowAISuggestions(false);
  };

  const togglePromoActive = async (promo: Promotion) => {
    await updatePromotion(promo.id, { isActive: !promo.isActive });
  };

  const renderPromotion = ({ item }: { item: Promotion }) => (
    <Card style={styles.promoCard}>
      <View style={styles.promoHeader}>
        <View style={styles.promoInfo}>
          <ThemedText type="h4" numberOfLines={1}>{item.title}</ThemedText>
          <ThemedText type="small" secondary numberOfLines={2} style={styles.promoDesc}>
            {item.description}
          </ThemedText>
        </View>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.isActive ? Colors.success : theme.textSecondary }
        ]} />
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceInfo}>
          <ThemedText type="caption" secondary>Original</ThemedText>
          <ThemedText type="body" style={styles.originalPrice}>
            ${item.originalPrice.toFixed(2)}
          </ThemedText>
        </View>
        <Feather name="arrow-right" size={16} color={theme.textSecondary} />
        <View style={styles.priceInfo}>
          <ThemedText type="caption" secondary>Sale</ThemedText>
          <ThemedText type="body" style={{ color: Colors.success, fontWeight: "600" }}>
            ${item.discountedPrice.toFixed(2)}
          </ThemedText>
        </View>
        <View style={[styles.savingsBadge, { backgroundColor: Colors.primary + "20" }]}>
          <ThemedText type="caption" style={{ color: Colors.primary }}>
            -{Math.round((1 - item.discountedPrice / item.originalPrice) * 100)}%
          </ThemedText>
        </View>
      </View>

      <View style={[styles.promoActions, { borderTopColor: theme.border }]}>
        <View style={styles.toggleRow}>
          <ThemedText type="small">Active</ThemedText>
          <Switch
            value={item.isActive}
            onValueChange={() => togglePromoActive(item)}
            trackColor={{ false: theme.backgroundTertiary, true: Colors.success + "60" }}
            thumbColor={item.isActive ? Colors.success : theme.backgroundSecondary}
          />
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={() => deletePromotion(item.id)}
          hitSlop={8}
        >
          <Feather name="trash-2" size={18} color={Colors.error} />
        </Pressable>
      </View>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={promotions}
        renderItem={renderPromotion}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing["5xl"] + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <Spacer size="md" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.primary + "15" }]}>
              <Feather name="tag" size={40} color={Colors.primary} />
            </View>
            <Spacer size="lg" />
            <ThemedText type="h4">No promotions yet</ThemedText>
            <ThemedText type="body" secondary style={styles.emptyText}>
              Create your first promotion to start attracting customers
            </ThemedText>
          </View>
        }
      />

      <Pressable
        style={[styles.fab, { bottom: tabBarHeight + Spacing.xl, backgroundColor: Colors.primary }]}
        onPress={() => setShowModal(true)}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[
              styles.modalContent,
              { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => { resetForm(); setShowModal(false); }}>
                <ThemedText type="body" style={{ color: Colors.primary }}>Cancel</ThemedText>
              </Pressable>
              <ThemedText type="h4">New Promotion</ThemedText>
              <Pressable onPress={handleCreate} disabled={!title || !description}>
                <ThemedText
                  type="body"
                  style={{ color: title && description ? Colors.primary : theme.textSecondary, fontWeight: "600" }}
                >
                  Create
                </ThemedText>
              </Pressable>
            </View>

            <Spacer size="2xl" />

            <Pressable
              style={[styles.aiButton, { backgroundColor: Colors.accent + "20" }]}
              onPress={handleAISuggest}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Feather name="zap" size={18} color={Colors.accent} />
              )}
              <ThemedText type="body" style={{ color: Colors.accent, marginLeft: Spacing.sm, fontWeight: "600" }}>
                {isGenerating ? "Generating..." : "AI Suggest"}
              </ThemedText>
            </Pressable>

            {showAISuggestions ? (
              <View style={styles.suggestionsContainer}>
                <ThemedText type="small" secondary style={styles.suggestionsLabel}>
                  Tap to use a suggestion:
                </ThemedText>
                {AI_SUGGESTIONS.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={[styles.suggestionCard, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => applyAISuggestion(suggestion)}
                  >
                    <ThemedText type="small">{suggestion}</ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Spacer size="xl" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Promotion Title</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., Taco Tuesday Special"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <Spacer size="lg" />

            <ThemedText type="small" secondary style={styles.inputLabel}>Description</ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="Describe your promotion..."
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Spacer size="lg" />

            <View style={styles.priceInputRow}>
              <View style={styles.priceInputContainer}>
                <ThemedText type="small" secondary style={styles.inputLabel}>Original Price</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textSecondary}
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.priceInputContainer}>
                <ThemedText type="small" secondary style={styles.inputLabel}>Sale Price</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textSecondary}
                  value={discountedPrice}
                  onChangeText={setDiscountedPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Spacer size="lg" />

            <View style={styles.switchRow}>
              <View>
                <ThemedText type="body">Activate Immediately</ThemedText>
                <ThemedText type="small" secondary>Promotion goes live when created</ThemedText>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: theme.backgroundTertiary, true: Colors.success + "60" }}
                thumbColor={isActive ? Colors.success : theme.backgroundSecondary}
              />
            </View>
          </KeyboardAwareScrollViewCompat>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  promoCard: {
    padding: 0,
  },
  promoHeader: {
    flexDirection: "row",
    padding: Spacing.md,
  },
  promoInfo: {
    flex: 1,
  },
  promoDesc: {
    marginTop: Spacing.xs,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: Spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  priceInfo: {},
  originalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  savingsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  promoActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.fab,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  suggestionsContainer: {
    marginTop: Spacing.lg,
  },
  suggestionsLabel: {
    marginBottom: Spacing.sm,
  },
  suggestionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  priceInputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  priceInputContainer: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
