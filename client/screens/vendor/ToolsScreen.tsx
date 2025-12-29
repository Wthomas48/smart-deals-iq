import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
}

const TOOLS: Tool[] = [
  {
    id: "qr",
    title: "QR Code Generator",
    description: "Create QR codes for your menu, promotions, and loyalty program",
    icon: "grid",
    color: Colors.primary,
  },
  {
    id: "ai-copy",
    title: "AI Promo Writer",
    description: "Generate engaging promotion copy with AI assistance",
    icon: "edit-3",
    color: Colors.accent,
    badge: "AI",
  },
  {
    id: "ai-image",
    title: "AI Image Creator",
    description: "Create professional food photos from text descriptions",
    icon: "image",
    color: Colors.secondary,
    badge: "AI",
  },
  {
    id: "flyer",
    title: "Flyer Designer",
    description: "Design and order physical marketing materials",
    icon: "file-text",
    color: "#9333EA",
  },
];

export default function ToolsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiResult, setAIResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedQRType, setSelectedQRType] = useState<"menu" | "promo" | "loyalty">("menu");

  const handleToolPress = (toolId: string) => {
    switch (toolId) {
      case "qr":
        setShowQRModal(true);
        break;
      case "ai-copy":
      case "ai-image":
        setShowAIModal(true);
        break;
      default:
        break;
    }
  };

  const generateAIContent = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAIResult(
      aiPrompt.toLowerCase().includes("image")
        ? "Generated a vibrant photo of fresh tacos with colorful toppings on a rustic wooden surface."
        : `"${aiPrompt}" - Fresh ingredients, bold flavors, unforgettable taste! Limited time offer, don't miss out on this incredible deal. Visit us today!`
    );
    setIsGenerating(false);
  };

  const qrTypes = [
    { key: "menu" as const, label: "Menu", icon: "book-open" },
    { key: "promo" as const, label: "Promotion", icon: "tag" },
    { key: "loyalty" as const, label: "Loyalty", icon: "award" },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        <ThemedText type="body" secondary style={styles.introText}>
          Powerful tools to grow your business and engage customers
        </ThemedText>

        <Spacer size="xl" />

        {TOOLS.map((tool) => (
          <Card
            key={tool.id}
            style={styles.toolCard}
            onPress={() => handleToolPress(tool.id)}
          >
            <View style={styles.toolContent}>
              <View style={[styles.toolIcon, { backgroundColor: tool.color + "20" }]}>
                <Feather name={tool.icon as any} size={24} color={tool.color} />
              </View>
              <View style={styles.toolInfo}>
                <View style={styles.toolTitleRow}>
                  <ThemedText type="h4">{tool.title}</ThemedText>
                  {tool.badge ? (
                    <View style={[styles.badge, { backgroundColor: Colors.accent }]}>
                      <ThemedText type="caption" style={styles.badgeText}>{tool.badge}</ThemedText>
                    </View>
                  ) : null}
                </View>
                <ThemedText type="small" secondary>{tool.description}</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </View>
          </Card>
        ))}

        <Spacer size="2xl" />

        <Card style={styles.statsCard}>
          <ThemedText type="h4">Tool Usage This Month</ThemedText>
          <Spacer size="lg" />
          <View style={styles.usageRow}>
            <View style={styles.usageItem}>
              <ThemedText type="h2" style={{ color: Colors.primary }}>23</ThemedText>
              <ThemedText type="caption" secondary>QR Scans</ThemedText>
            </View>
            <View style={styles.usageItem}>
              <ThemedText type="h2" style={{ color: Colors.accent }}>12</ThemedText>
              <ThemedText type="caption" secondary>AI Prompts</ThemedText>
            </View>
            <View style={styles.usageItem}>
              <ThemedText type="h2" style={{ color: Colors.secondary }}>5</ThemedText>
              <ThemedText type="caption" secondary>Flyers Printed</ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>

      <Modal visible={showQRModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowQRModal(false)}>
                <ThemedText type="body" style={{ color: Colors.primary }}>Close</ThemedText>
              </Pressable>
              <ThemedText type="h4">QR Code Generator</ThemedText>
              <View style={{ width: 50 }} />
            </View>

            <Spacer size="2xl" />

            <ThemedText type="body" secondary>Select QR code type:</ThemedText>
            <Spacer size="md" />

            <View style={styles.qrTypeContainer}>
              {qrTypes.map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.qrTypeButton,
                    { backgroundColor: theme.backgroundDefault },
                    selectedQRType === type.key && { backgroundColor: Colors.primary + "20", borderColor: Colors.primary },
                  ]}
                  onPress={() => setSelectedQRType(type.key)}
                >
                  <Feather
                    name={type.icon as any}
                    size={24}
                    color={selectedQRType === type.key ? Colors.primary : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      marginTop: Spacing.sm,
                      color: selectedQRType === type.key ? Colors.primary : theme.text,
                    }}
                  >
                    {type.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer size="2xl" />

            <View style={[styles.qrPreview, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.qrPlaceholder}>
                <Feather name="grid" size={80} color={theme.textSecondary} />
                <ThemedText type="small" secondary style={styles.qrPlaceholderText}>
                  QR Code Preview
                </ThemedText>
              </View>
            </View>

            <Spacer size="2xl" />

            <Button>Download QR Code</Button>
            <Spacer size="md" />
            <Pressable style={styles.secondaryAction}>
              <ThemedText type="body" style={{ color: Colors.primary }}>Share QR Code</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </Modal>

      <Modal visible={showAIModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[
              styles.modalContent,
              { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => { setShowAIModal(false); setAIPrompt(""); setAIResult(""); }}>
                <ThemedText type="body" style={{ color: Colors.primary }}>Close</ThemedText>
              </Pressable>
              <ThemedText type="h4">AI Assistant</ThemedText>
              <View style={{ width: 50 }} />
            </View>

            <Spacer size="2xl" />

            <View style={[styles.aiBadge, { backgroundColor: Colors.accent + "20" }]}>
              <Feather name="zap" size={16} color={Colors.accent} />
              <ThemedText type="small" style={{ color: Colors.accent, marginLeft: Spacing.xs }}>
                Powered by AI
              </ThemedText>
            </View>

            <Spacer size="lg" />

            <ThemedText type="small" secondary>
              Describe what you want to create:
            </ThemedText>
            <Spacer size="sm" />
            <TextInput
              style={[styles.aiInput, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., Create a catchy promotion for our new spicy tacos..."
              placeholderTextColor={theme.textSecondary}
              value={aiPrompt}
              onChangeText={setAIPrompt}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Spacer size="lg" />

            <Button onPress={generateAIContent} disabled={!aiPrompt || isGenerating}>
              {isGenerating ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <ThemedText type="body" style={{ color: "#fff", marginLeft: Spacing.sm }}>
                    Generating...
                  </ThemedText>
                </View>
              ) : (
                "Generate"
              )}
            </Button>

            {aiResult ? (
              <>
                <Spacer size="xl" />
                <View style={[styles.resultCard, { backgroundColor: theme.backgroundSecondary }]}>
                  <View style={styles.resultHeader}>
                    <Feather name="check-circle" size={18} color={Colors.success} />
                    <ThemedText type="small" style={{ color: Colors.success, marginLeft: Spacing.xs }}>
                      Generated Content
                    </ThemedText>
                  </View>
                  <Spacer size="md" />
                  <ThemedText type="body">{aiResult}</ThemedText>
                  <Spacer size="md" />
                  <Pressable style={[styles.copyButton, { backgroundColor: Colors.primary + "15" }]}>
                    <Feather name="copy" size={16} color={Colors.primary} />
                    <ThemedText type="small" style={{ color: Colors.primary, marginLeft: Spacing.xs }}>
                      Copy to clipboard
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            ) : null}
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  introText: {
    textAlign: "center",
  },
  toolCard: {
    marginBottom: Spacing.md,
  },
  toolContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: "#000",
    fontWeight: "600",
  },
  statsCard: {},
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  usageItem: {
    alignItems: "center",
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
  qrTypeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  qrTypeButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  qrPreview: {
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  qrPlaceholder: {
    alignItems: "center",
  },
  qrPlaceholderText: {
    marginTop: Spacing.md,
  },
  secondaryAction: {
    alignItems: "center",
    padding: Spacing.md,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  aiInput: {
    minHeight: 120,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});
