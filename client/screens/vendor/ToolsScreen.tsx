import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, ActivityIndicator, Alert, Image } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { GoLiveToggle } from "@/components/GoLiveToggle";
import { LocationAnalytics } from "@/components/LocationAnalytics";
import { BoostListing } from "@/components/BoostListing";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/subscription-context";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  isNew?: boolean;
  isPremium?: boolean;
}

const TOOLS: Tool[] = [
  {
    id: "go-live",
    title: "Go Live",
    description: "Share your current location with customers in real-time",
    icon: "radio",
    color: "#22C55E",
    isNew: true,
  },
  {
    id: "location-history",
    title: "Location Analytics",
    description: "View your best spots, peak times, and performance data",
    icon: "bar-chart-2",
    color: "#8B5CF6",
    isNew: true,
  },
  {
    id: "boost",
    title: "Boost Listing",
    description: "Get more visibility with featured placement",
    icon: "trending-up",
    color: "#F59E0B",
    isPremium: true,
  },
  {
    id: "qr",
    title: "QR Code Generator",
    description: "Create QR codes for your menu, promotions, and loyalty program",
    icon: "grid",
    color: Colors.primary,
  },
  {
    id: "barcode",
    title: "Barcode Generator",
    description: "Generate barcodes for products, coupons, and inventory",
    icon: "maximize-2",
    color: "#1E293B",
    isNew: true,
  },
  {
    id: "flyer",
    title: "Flyer Designer",
    description: "Design and print professional marketing flyers",
    icon: "file-text",
    color: "#9333EA",
    isPremium: true,
  },
  {
    id: "print-menu",
    title: "Menu Printer",
    description: "Order professionally printed menus for your restaurant",
    icon: "printer",
    color: "#0891B2",
    isPremium: true,
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
    id: "menu-scanner",
    title: "Menu Scanner",
    description: "Scan competitor menus and get pricing insights",
    icon: "camera",
    color: "#0EA5E9",
    badge: "AI",
    isNew: true,
  },
  {
    id: "review-analyzer",
    title: "Review Analyzer",
    description: "Analyze customer reviews for actionable insights",
    icon: "message-circle",
    color: "#8B5CF6",
    badge: "AI",
    isNew: true,
  },
  {
    id: "social-content",
    title: "Social Media Creator",
    description: "Generate posts for Instagram, TikTok, and more",
    icon: "share-2",
    color: "#EC4899",
    badge: "AI",
  },
  {
    id: "sales-forecast",
    title: "Sales Forecaster",
    description: "AI-powered predictions for demand planning",
    icon: "trending-up",
    color: "#10B981",
    badge: "AI",
    isPremium: true,
  },
];

// Flyer templates
const FLYER_TEMPLATES = [
  { id: "special", name: "Daily Special", color: "#EF4444" },
  { id: "grand-opening", name: "Grand Opening", color: "#10B981" },
  { id: "event", name: "Event", color: "#8B5CF6" },
  { id: "menu", name: "Menu Highlight", color: "#F59E0B" },
  { id: "seasonal", name: "Seasonal", color: "#06B6D4" },
];

// Print sizes and pricing
const PRINT_OPTIONS = [
  { size: "4x6", name: "Postcard", price: 0.15, qty: [50, 100, 250, 500] },
  { size: "5x7", name: "Small Flyer", price: 0.25, qty: [50, 100, 250, 500] },
  { size: "8.5x11", name: "Full Page", price: 0.35, qty: [50, 100, 250, 500] },
  { size: "11x17", name: "Poster", price: 0.75, qty: [25, 50, 100, 250] },
];

const AI_COPY_TEMPLATES = [
  { type: "promo", label: "Promotion", example: "Create a compelling offer for..." },
  { type: "social", label: "Social Post", example: "Write an Instagram caption..." },
  { type: "email", label: "Email", example: "Compose a newsletter for..." },
  { type: "sms", label: "SMS", example: "Write a text message deal..." },
];

export default function ToolsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { isSubscribed } = useSubscription();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout },
      ]
    );
  };

  const [showQRModal, setShowQRModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiResult, setAIResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedQRType, setSelectedQRType] = useState<"menu" | "promo" | "loyalty">("menu");

  // Barcode state
  const [barcodeType, setBarcodeType] = useState<"ean13" | "code128" | "qr">("ean13");
  const [barcodeValue, setBarcodeValue] = useState("");

  // Flyer state
  const [selectedTemplate, setSelectedTemplate] = useState(FLYER_TEMPLATES[0].id);
  const [flyerTitle, setFlyerTitle] = useState("");
  const [flyerDescription, setFlyerDescription] = useState("");
  const [selectedPrintSize, setSelectedPrintSize] = useState(PRINT_OPTIONS[0].size);
  const [selectedQty, setSelectedQty] = useState(100);
  const [isOrdering, setIsOrdering] = useState(false);

  const handleToolPress = (toolId: string) => {
    switch (toolId) {
      case "go-live":
        setShowGoLiveModal(true);
        break;
      case "location-history":
        setShowLocationModal(true);
        break;
      case "boost":
        if (!isSubscribed) {
          Alert.alert(
            "Pro Feature",
            "Upgrade to Pro ($29.99/mo) to boost your listing and get more visibility. Or try our 7-Day Ad for just $7.99!",
            [
              { text: "Maybe Later", style: "cancel" },
              { text: "View Plans", onPress: () => {} },
            ]
          );
          return;
        }
        setShowBoostModal(true);
        break;
      case "qr":
        setShowQRModal(true);
        break;
      case "barcode":
        setShowBarcodeModal(true);
        break;
      case "flyer":
      case "print-menu":
        if (!isSubscribed) {
          Alert.alert(
            "Pro Feature",
            "Upgrade to Pro ($29.99/mo) to access the Flyer Designer and print marketing materials. Or try our 7-Day Ad for just $7.99!",
            [
              { text: "Maybe Later", style: "cancel" },
              { text: "View Plans", onPress: () => {} },
            ]
          );
          return;
        }
        setShowFlyerModal(true);
        break;
      case "ai-copy":
      case "ai-image":
        setShowAIModal(true);
        break;
      default:
        Alert.alert("Coming Soon", `${toolId} feature is coming soon!`);
        break;
    }
  };

  const calculatePrice = () => {
    const option = PRINT_OPTIONS.find((o) => o.size === selectedPrintSize);
    if (!option) return 0;
    return (option.price * selectedQty).toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (!flyerTitle) {
      Alert.alert("Required", "Please enter a title for your flyer");
      return;
    }

    setIsOrdering(true);
    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsOrdering(false);

    Alert.alert(
      "Order Placed!",
      `Your order for ${selectedQty} ${selectedPrintSize} flyers has been placed. Total: $${calculatePrice()}`,
      [{ text: "OK", onPress: () => setShowFlyerModal(false) }]
    );

    // Reset form
    setFlyerTitle("");
    setFlyerDescription("");
    setSelectedTemplate(FLYER_TEMPLATES[0].id);
    setSelectedPrintSize(PRINT_OPTIONS[0].size);
    setSelectedQty(100);
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
                {tool.isNew && (
                  <View style={styles.newDot} />
                )}
              </View>
              <View style={styles.toolInfo}>
                <View style={styles.toolTitleRow}>
                  <ThemedText type="h4">{tool.title}</ThemedText>
                  <View style={styles.badgeRow}>
                    {tool.isNew && (
                      <View style={[styles.newBadge, { backgroundColor: Colors.success }]}>
                        <ThemedText type="caption" style={styles.badgeText}>NEW</ThemedText>
                      </View>
                    )}
                    {tool.isPremium && (
                      <View style={[styles.premiumBadge, { backgroundColor: Colors.accent }]}>
                        <Feather name="star" size={10} color="#000" />
                        <ThemedText type="caption" style={styles.badgeText}>PRO</ThemedText>
                      </View>
                    )}
                    {tool.badge && !tool.isNew && !tool.isPremium && (
                      <View style={[styles.badge, { backgroundColor: Colors.accent }]}>
                        <ThemedText type="caption" style={styles.badgeText}>{tool.badge}</ThemedText>
                      </View>
                    )}
                  </View>
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

        <Spacer size="2xl" />

        {/* Logout Button */}
        <Pressable
          style={[styles.logoutButton, { backgroundColor: Colors.error + "15" }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={Colors.error} />
          <ThemedText type="body" style={{ color: Colors.error, marginLeft: Spacing.md }}>
            Log Out
          </ThemedText>
        </Pressable>
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

      {/* Barcode Generator Modal */}
      <Modal visible={showBarcodeModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[
              styles.modalContent,
              { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => { setShowBarcodeModal(false); setBarcodeValue(""); }}>
                <ThemedText type="body" style={{ color: Colors.primary }}>Close</ThemedText>
              </Pressable>
              <ThemedText type="h4">Barcode Generator</ThemedText>
              <View style={{ width: 50 }} />
            </View>

            <Spacer size="2xl" />

            <ThemedText type="body" secondary>Select barcode type:</ThemedText>
            <Spacer size="md" />

            <View style={styles.qrTypeContainer}>
              {[
                { key: "ean13" as const, label: "EAN-13", icon: "maximize-2" },
                { key: "code128" as const, label: "Code 128", icon: "minus" },
                { key: "qr" as const, label: "QR Code", icon: "grid" },
              ].map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.qrTypeButton,
                    { backgroundColor: theme.backgroundDefault },
                    barcodeType === type.key && { backgroundColor: "#1E293B" + "20", borderColor: "#1E293B" },
                  ]}
                  onPress={() => setBarcodeType(type.key)}
                >
                  <Feather
                    name={type.icon as any}
                    size={24}
                    color={barcodeType === type.key ? "#1E293B" : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      marginTop: Spacing.sm,
                      color: barcodeType === type.key ? "#1E293B" : theme.text,
                    }}
                  >
                    {type.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer size="xl" />

            <ThemedText type="small" secondary>Enter value:</ThemedText>
            <Spacer size="sm" />
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder={barcodeType === "ean13" ? "Enter 13 digits..." : "Enter code value..."}
              placeholderTextColor={theme.textSecondary}
              value={barcodeValue}
              onChangeText={setBarcodeValue}
              keyboardType={barcodeType === "ean13" ? "number-pad" : "default"}
              maxLength={barcodeType === "ean13" ? 13 : 50}
            />

            <Spacer size="xl" />

            <View style={[styles.barcodePreview, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.barcodePlaceholder}>
                {barcodeType === "qr" ? (
                  <Feather name="grid" size={80} color={theme.textSecondary} />
                ) : (
                  <View style={styles.barcodeLines}>
                    {[...Array(20)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.barcodeLine,
                          { backgroundColor: theme.text, width: Math.random() > 0.5 ? 2 : 4 },
                        ]}
                      />
                    ))}
                  </View>
                )}
                <ThemedText type="small" secondary style={{ marginTop: Spacing.md }}>
                  {barcodeValue || "Preview"}
                </ThemedText>
              </View>
            </View>

            <Spacer size="xl" />

            <Button disabled={!barcodeValue}>Download Barcode</Button>
            <Spacer size="md" />
            <View style={styles.buttonRow}>
              <Pressable style={[styles.secondaryButton, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="printer" size={18} color={theme.text} />
                <ThemedText type="small" style={{ marginLeft: 8 }}>Print</ThemedText>
              </Pressable>
              <Pressable style={[styles.secondaryButton, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="share-2" size={18} color={theme.text} />
                <ThemedText type="small" style={{ marginLeft: 8 }}>Share</ThemedText>
              </Pressable>
            </View>
          </KeyboardAwareScrollViewCompat>
        </ThemedView>
      </Modal>

      {/* Flyer Designer Modal */}
      <Modal visible={showFlyerModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[
              styles.modalContent,
              { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowFlyerModal(false)}>
                <ThemedText type="body" style={{ color: Colors.primary }}>Cancel</ThemedText>
              </Pressable>
              <View style={styles.flyerModalTitle}>
                <Feather name="star" size={16} color={Colors.accent} />
                <ThemedText type="h4" style={{ marginLeft: 8 }}>Flyer Designer</ThemedText>
              </View>
              <View style={{ width: 50 }} />
            </View>

            <Spacer size="lg" />

            <View style={[styles.proBanner, { backgroundColor: Colors.accent + "15" }]}>
              <Feather name="award" size={20} color={Colors.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>Pro Marketing Tools</ThemedText>
                <ThemedText type="caption" secondary>Design, print, and deliver directly to your customers</ThemedText>
              </View>
            </View>

            <Spacer size="xl" />

            <ThemedText type="body" style={{ fontWeight: "600" }}>1. Choose Template</ThemedText>
            <Spacer size="md" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.templateRow}>
                {FLYER_TEMPLATES.map((template) => (
                  <Pressable
                    key={template.id}
                    style={[
                      styles.templateCard,
                      { backgroundColor: template.color + "20", borderColor: template.color },
                      selectedTemplate === template.id && styles.templateCardSelected,
                    ]}
                    onPress={() => setSelectedTemplate(template.id)}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
                      <Feather name="file-text" size={24} color="#fff" />
                    </View>
                    <ThemedText type="caption" style={{ marginTop: 8, color: template.color }}>
                      {template.name}
                    </ThemedText>
                    {selectedTemplate === template.id && (
                      <View style={[styles.selectedCheck, { backgroundColor: template.color }]}>
                        <Feather name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Spacer size="xl" />

            <ThemedText type="body" style={{ fontWeight: "600" }}>2. Add Content</ThemedText>
            <Spacer size="md" />

            <ThemedText type="small" secondary>Title</ThemedText>
            <Spacer size="xs" />
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., Grand Opening Special!"
              placeholderTextColor={theme.textSecondary}
              value={flyerTitle}
              onChangeText={setFlyerTitle}
            />

            <Spacer size="md" />

            <ThemedText type="small" secondary>Description</ThemedText>
            <Spacer size="xs" />
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="Enter your promotion details..."
              placeholderTextColor={theme.textSecondary}
              value={flyerDescription}
              onChangeText={setFlyerDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Spacer size="xl" />

            <ThemedText type="body" style={{ fontWeight: "600" }}>3. Print Options</ThemedText>
            <Spacer size="md" />

            <View style={styles.printOptionsGrid}>
              {PRINT_OPTIONS.map((option) => (
                <Pressable
                  key={option.size}
                  style={[
                    styles.printOption,
                    { backgroundColor: theme.backgroundSecondary },
                    selectedPrintSize === option.size && { borderColor: Colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedPrintSize(option.size)}
                >
                  <ThemedText type="body" style={{ fontWeight: "600" }}>{option.size}</ThemedText>
                  <ThemedText type="caption" secondary>{option.name}</ThemedText>
                  <ThemedText type="small" style={{ color: Colors.success, marginTop: 4 }}>
                    ${option.price.toFixed(2)}/ea
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer size="lg" />

            <ThemedText type="small" secondary>Quantity</ThemedText>
            <Spacer size="sm" />
            <View style={styles.qtyRow}>
              {PRINT_OPTIONS.find((o) => o.size === selectedPrintSize)?.qty.map((qty) => (
                <Pressable
                  key={qty}
                  style={[
                    styles.qtyChip,
                    { backgroundColor: theme.backgroundSecondary },
                    selectedQty === qty && { backgroundColor: Colors.primary },
                  ]}
                  onPress={() => setSelectedQty(qty)}
                >
                  <ThemedText
                    type="small"
                    style={{ color: selectedQty === qty ? "#fff" : theme.text, fontWeight: "600" }}
                  >
                    {qty}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer size="xl" />

            <View style={[styles.orderSummary, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.orderRow}>
                <ThemedText type="body">Print Size:</ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>{selectedPrintSize}</ThemedText>
              </View>
              <View style={styles.orderRow}>
                <ThemedText type="body">Quantity:</ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>{selectedQty} flyers</ThemedText>
              </View>
              <View style={[styles.orderRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.md }]}>
                <ThemedText type="h4">Total:</ThemedText>
                <ThemedText type="h3" style={{ color: Colors.success }}>${calculatePrice()}</ThemedText>
              </View>
            </View>

            <Spacer size="lg" />

            <Button onPress={handlePlaceOrder} disabled={isOrdering || !flyerTitle}>
              {isOrdering ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <ThemedText type="body" style={{ color: "#fff", marginLeft: Spacing.sm }}>
                    Processing...
                  </ThemedText>
                </View>
              ) : (
                <>
                  <Feather name="printer" size={18} color="#fff" style={{ marginRight: 8 }} />
                  Place Print Order - ${calculatePrice()}
                </>
              )}
            </Button>

            <Spacer size="md" />

            <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
              Estimated delivery: 3-5 business days
            </ThemedText>

          </KeyboardAwareScrollViewCompat>
        </ThemedView>
      </Modal>

      {/* Go Live Modal */}
      <Modal visible={showGoLiveModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowGoLiveModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4">Food Truck Live Status</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Spacer size="xl" />
              <GoLiveToggle onStatusChange={() => {}} />
              <Spacer size="lg" />
              <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
                When you go live, customers can see your location on the map and get notified.
              </ThemedText>
            </ScrollView>
          </View>
        </ThemedView>
      </Modal>

      {/* Location Analytics Modal */}
      <Modal visible={showLocationModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowLocationModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4">Location Analytics</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <Spacer size="lg" />
            <LocationAnalytics />
          </View>
        </ThemedView>
      </Modal>

      {/* Boost Listing Modal */}
      <Modal visible={showBoostModal} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowBoostModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4">Boost Your Listing</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Spacer size="lg" />
              <BoostListing />
            </ScrollView>
          </View>
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
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  newBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  badgeText: {
    color: "#000",
    fontWeight: "600",
  },
  newDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
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
  // Input styles
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  // Barcode styles
  barcodePreview: {
    height: 150,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  barcodePlaceholder: {
    alignItems: "center",
  },
  barcodeLines: {
    flexDirection: "row",
    gap: 2,
    height: 80,
    alignItems: "flex-end",
  },
  barcodeLine: {
    height: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  // Flyer styles
  flyerModalTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  templateRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  templateCard: {
    width: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 2,
    position: "relative",
  },
  templateCardSelected: {
    borderWidth: 3,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  printOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  printOption: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  qtyRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  qtyChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  orderSummary: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
