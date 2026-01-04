import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, TextInput, Modal } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface DealTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  titleTemplate: string;
  descriptionTemplate: string;
  fields: TemplateField[];
  suggestedDiscount?: number;
  suggestedDuration?: number; // in minutes, for flash deals
}

export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "number" | "time" | "percent";
  defaultValue?: string;
}

// Pre-built deal templates
export const DEAL_TEMPLATES: DealTemplate[] = [
  {
    id: "happy_hour",
    name: "Happy Hour",
    icon: "clock",
    color: "#F59E0B",
    titleTemplate: "Happy Hour Special: {discount}% off {items}",
    descriptionTemplate: "Join us for Happy Hour! Get {discount}% off {items} from {startTime} to {endTime}. Don't miss out!",
    fields: [
      { key: "discount", label: "Discount %", placeholder: "20", type: "percent", defaultValue: "20" },
      { key: "items", label: "Items", placeholder: "drinks & appetizers", type: "text", defaultValue: "drinks & appetizers" },
      { key: "startTime", label: "Start Time", placeholder: "3pm", type: "time", defaultValue: "3pm" },
      { key: "endTime", label: "End Time", placeholder: "6pm", type: "time", defaultValue: "6pm" },
    ],
    suggestedDiscount: 20,
    suggestedDuration: 180,
  },
  {
    id: "lunch_deal",
    name: "Lunch Deal",
    icon: "sun",
    color: "#10B981",
    titleTemplate: "Lunch Deal: {dish} + {drink} for ${price}",
    descriptionTemplate: "Perfect lunch combo! Get our {dish} paired with a refreshing {drink} for only ${price}. Available 11am-2pm.",
    fields: [
      { key: "dish", label: "Dish Name", placeholder: "Signature Burger", type: "text", defaultValue: "Signature Burger" },
      { key: "drink", label: "Drink", placeholder: "Soft Drink", type: "text", defaultValue: "Soft Drink" },
      { key: "price", label: "Price ($)", placeholder: "9.99", type: "number", defaultValue: "9.99" },
    ],
    suggestedDuration: 180,
  },
  {
    id: "bogo",
    name: "Buy 1 Get 1",
    icon: "gift",
    color: "#8B5CF6",
    titleTemplate: "Weekend Special: Buy 1 Get 1 {item}",
    descriptionTemplate: "Double the flavor! Buy any {item} and get another one FREE. This weekend only!",
    fields: [
      { key: "item", label: "Item", placeholder: "Taco", type: "text", defaultValue: "Taco" },
    ],
    suggestedDiscount: 50,
    suggestedDuration: 240,
  },
  {
    id: "first_time",
    name: "First-Time Customer",
    icon: "user-plus",
    color: "#3B82F6",
    titleTemplate: "First-Time Customer: {discount}% off your first order",
    descriptionTemplate: "Welcome! As a first-time customer, enjoy {discount}% off your entire order. Use code: WELCOME",
    fields: [
      { key: "discount", label: "Discount %", placeholder: "15", type: "percent", defaultValue: "15" },
    ],
    suggestedDiscount: 15,
  },
  {
    id: "slow_day",
    name: "Slow Day Boost",
    icon: "zap",
    color: "#EF4444",
    titleTemplate: "Flash Sale: {discount}% off all orders today only!",
    descriptionTemplate: "Today's special! Get {discount}% off everything on the menu. Hurry, this deal ends at midnight!",
    fields: [
      { key: "discount", label: "Discount %", placeholder: "25", type: "percent", defaultValue: "25" },
    ],
    suggestedDiscount: 25,
    suggestedDuration: 60,
  },
  {
    id: "family_deal",
    name: "Family Deal",
    icon: "users",
    color: "#EC4899",
    titleTemplate: "Family Feast: Feed {count} for ${price}",
    descriptionTemplate: "Perfect for families! Our Family Feast includes {items} - enough to feed {count} people for only ${price}!",
    fields: [
      { key: "count", label: "People", placeholder: "4", type: "number", defaultValue: "4" },
      { key: "items", label: "Included Items", placeholder: "2 entrees, 2 sides, 4 drinks", type: "text", defaultValue: "2 entrees, 2 sides, 4 drinks" },
      { key: "price", label: "Price ($)", placeholder: "39.99", type: "number", defaultValue: "39.99" },
    ],
  },
  {
    id: "loyalty_reward",
    name: "Loyalty Reward",
    icon: "award",
    color: "#F97316",
    titleTemplate: "Loyalty Special: Free {item} with purchase",
    descriptionTemplate: "Thank you for being a loyal customer! Get a FREE {item} with any purchase of ${minPurchase} or more.",
    fields: [
      { key: "item", label: "Free Item", placeholder: "Dessert", type: "text", defaultValue: "Dessert" },
      { key: "minPurchase", label: "Min Purchase ($)", placeholder: "20", type: "number", defaultValue: "20" },
    ],
  },
  {
    id: "early_bird",
    name: "Early Bird",
    icon: "sunrise",
    color: "#06B6D4",
    titleTemplate: "Early Bird: {discount}% off before {time}",
    descriptionTemplate: "Rise and save! Get {discount}% off your order when you visit us before {time}. Early birds get the best deals!",
    fields: [
      { key: "discount", label: "Discount %", placeholder: "15", type: "percent", defaultValue: "15" },
      { key: "time", label: "Cutoff Time", placeholder: "10am", type: "time", defaultValue: "10am" },
    ],
    suggestedDiscount: 15,
    suggestedDuration: 120,
  },
];

interface DealTemplatesProps {
  onSelectTemplate: (title: string, description: string, suggestedDiscount?: number, suggestedDuration?: number) => void;
  type?: "promotion" | "flash";
}

export function DealTemplates({ onSelectTemplate, type = "promotion" }: DealTemplatesProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedTemplate, setSelectedTemplate] = useState<DealTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const handleTemplatePress = (template: DealTemplate) => {
    // Initialize field values with defaults
    const initialValues: Record<string, string> = {};
    template.fields.forEach((field) => {
      initialValues[field.key] = field.defaultValue || "";
    });
    setFieldValues(initialValues);
    setSelectedTemplate(template);
    setShowCustomizeModal(true);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    let title = selectedTemplate.titleTemplate;
    let description = selectedTemplate.descriptionTemplate;

    // Replace placeholders with actual values
    Object.entries(fieldValues).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, "g"), value);
      description = description.replace(new RegExp(placeholder, "g"), value);
    });

    onSelectTemplate(
      title,
      description,
      selectedTemplate.suggestedDiscount,
      selectedTemplate.suggestedDuration
    );
    setShowCustomizeModal(false);
    setSelectedTemplate(null);
  };

  const handleQuickApply = (template: DealTemplate) => {
    // Quick apply with default values
    let title = template.titleTemplate;
    let description = template.descriptionTemplate;

    template.fields.forEach((field) => {
      const placeholder = `{${field.key}}`;
      const value = field.defaultValue || field.placeholder;
      title = title.replace(new RegExp(placeholder, "g"), value);
      description = description.replace(new RegExp(placeholder, "g"), value);
    });

    onSelectTemplate(
      title,
      description,
      template.suggestedDiscount,
      template.suggestedDuration
    );
  };

  const updateFieldValue = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  // Filter templates based on type (flash deals prefer shorter durations)
  const templates = type === "flash"
    ? DEAL_TEMPLATES.filter(t => t.suggestedDuration && t.suggestedDuration <= 240)
    : DEAL_TEMPLATES;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="file-text" size={16} color={Colors.primary} />
        <ThemedText type="small" style={styles.headerText}>
          One-Tap Templates
        </ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templateScroll}
      >
        {templates.map((template) => (
          <Pressable
            key={template.id}
            style={[
              styles.templateCard,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
            ]}
            onPress={() => handleTemplatePress(template)}
            onLongPress={() => handleQuickApply(template)}
          >
            <View style={[styles.templateIcon, { backgroundColor: template.color + "20" }]}>
              <Feather name={template.icon as any} size={20} color={template.color} />
            </View>
            <ThemedText type="caption" style={styles.templateName} numberOfLines={1}>
              {template.name}
            </ThemedText>
            <View style={styles.tapHint}>
              <Feather name="chevron-right" size={12} color={theme.textSecondary} />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <ThemedText type="caption" secondary style={styles.hint}>
        Tap to customize, hold to apply instantly
      </ThemedText>

      {/* Customize Template Modal */}
      <Modal
        visible={showCustomizeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomizeModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowCustomizeModal(false)}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>Cancel</ThemedText>
              </Pressable>
              <ThemedText type="h4">Customize Template</ThemedText>
              <Pressable onPress={handleApplyTemplate}>
                <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
                  Apply
                </ThemedText>
              </Pressable>
            </View>

            {selectedTemplate && (
              <>
                <View style={styles.templatePreviewHeader}>
                  <View style={[styles.templateIconLarge, { backgroundColor: selectedTemplate.color + "20" }]}>
                    <Feather name={selectedTemplate.icon as any} size={28} color={selectedTemplate.color} />
                  </View>
                  <ThemedText type="h3" style={styles.templateTitle}>
                    {selectedTemplate.name}
                  </ThemedText>
                </View>

                <View style={styles.fieldsContainer}>
                  <ThemedText type="small" secondary style={styles.sectionLabel}>
                    Customize Your Deal
                  </ThemedText>

                  {selectedTemplate.fields.map((field) => (
                    <View key={field.key} style={styles.fieldRow}>
                      <ThemedText type="small" style={styles.fieldLabel}>
                        {field.label}
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.fieldInput,
                          {
                            backgroundColor: theme.backgroundDefault,
                            color: theme.text,
                            borderColor: theme.border,
                          },
                        ]}
                        value={fieldValues[field.key] || ""}
                        onChangeText={(value) => updateFieldValue(field.key, value)}
                        placeholder={field.placeholder}
                        placeholderTextColor={theme.textSecondary}
                        keyboardType={field.type === "number" || field.type === "percent" ? "decimal-pad" : "default"}
                      />
                    </View>
                  ))}
                </View>

                <View style={[styles.previewSection, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText type="small" secondary style={styles.sectionLabel}>
                    Preview
                  </ThemedText>
                  <ThemedText type="body" style={styles.previewTitle}>
                    {(() => {
                      let title = selectedTemplate.titleTemplate;
                      Object.entries(fieldValues).forEach(([key, value]) => {
                        title = title.replace(new RegExp(`{${key}}`, "g"), value || `[${key}]`);
                      });
                      return title;
                    })()}
                  </ThemedText>
                  <ThemedText type="small" secondary style={styles.previewDescription}>
                    {(() => {
                      let desc = selectedTemplate.descriptionTemplate;
                      Object.entries(fieldValues).forEach(([key, value]) => {
                        desc = desc.replace(new RegExp(`{${key}}`, "g"), value || `[${key}]`);
                      });
                      return desc;
                    })()}
                  </ThemedText>
                </View>

                <Pressable
                  style={[styles.applyButton, { backgroundColor: selectedTemplate.color }]}
                  onPress={handleApplyTemplate}
                >
                  <Feather name="check" size={20} color="#fff" />
                  <ThemedText type="body" style={styles.applyButtonText}>
                    Use This Template
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerText: {
    marginLeft: Spacing.xs,
    color: Colors.primary,
    fontWeight: "600",
  },
  templateScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  templateCard: {
    width: 100,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  templateName: {
    textAlign: "center",
    fontWeight: "500",
  },
  tapHint: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  hint: {
    marginTop: Spacing.xs,
    textAlign: "center",
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  templatePreviewHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  templateIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  templateTitle: {
    textAlign: "center",
  },
  fieldsContainer: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  fieldRow: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  fieldInput: {
    height: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  previewSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  previewTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  previewDescription: {
    lineHeight: 20,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: Spacing.sm,
  },
});
