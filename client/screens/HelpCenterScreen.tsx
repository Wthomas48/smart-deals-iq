import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const helpCategories: HelpCategory[] = [
  {
    title: "Getting Started",
    icon: "play-circle",
    items: [
      {
        question: "How do I find deals near me?",
        answer: "Open the app and go to the 'Deals' tab. Make sure you've allowed location access so we can show you deals nearby. You can also use the 'Nearby' tab to see deals on a map.",
      },
      {
        question: "Do I need an account to use SmartDealsIQ™?",
        answer: "You can browse deals without an account, but creating one lets you save favorites, get personalized recommendations, and receive notifications about new deals.",
      },
      {
        question: "How do I create an account?",
        answer: "Tap the Profile tab, then 'Sign Up'. Enter your name, email, and password. You can sign up as either a Customer or a Vendor.",
      },
    ],
  },
  {
    title: "For Customers",
    icon: "shopping-bag",
    items: [
      {
        question: "How do I save a deal to my favorites?",
        answer: "On any deal card, tap the heart icon to save it to your Favorites. Access your saved deals anytime from the Favorites tab.",
      },
      {
        question: "How do I claim a deal?",
        answer: "Tap on a deal to view details, then tap 'Get Deal'. Show the deal screen to the vendor when you make your purchase.",
      },
      {
        question: "Why can't I see deals near me?",
        answer: "Make sure location services are enabled for SmartDealsIQ™ in your device settings. If deals still don't appear, there may not be any vendors in your immediate area yet.",
      },
      {
        question: "Can I get notifications for new deals?",
        answer: "Yes! Go to Profile > Notifications to enable deal alerts. You can customize which types of deals you want to be notified about.",
      },
    ],
  },
  {
    title: "For Vendors",
    icon: "briefcase",
    items: [
      {
        question: "How do I become a vendor?",
        answer: "Sign up for a vendor account by selecting 'I'm a Vendor' on the login screen. You'll need to provide your business details and set up your listing.",
      },
      {
        question: "How do I create a deal?",
        answer: "Go to the Promotions tab and tap 'Create Deal'. Add your deal title, description, discount, and validity period. Your deal will be visible to customers once published.",
      },
      {
        question: "How do I update my business location?",
        answer: "Go to 'My Listing' tab and tap 'Update Location'. For food trucks, this lets customers know your current spot.",
      },
      {
        question: "What are the vendor tiers?",
        answer: "We offer different tiers with varying features. Check the Pricing tab for details on each tier and their benefits.",
      },
    ],
  },
  {
    title: "Account & Security",
    icon: "shield",
    items: [
      {
        question: "How do I change my password?",
        answer: "Go to Profile > Account, then tap 'Change Password'. You'll need to enter your current password to set a new one.",
      },
      {
        question: "How do I delete my account?",
        answer: "Go to Profile > Account Actions > Delete Account. This action is permanent and will delete all your data.",
      },
      {
        question: "Is my data secure?",
        answer: "Yes! We use industry-standard encryption and security measures to protect your data. See our Privacy Policy for details.",
      },
    ],
  },
];

export default function HelpCenterScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Getting Started");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const handleContactSupport = () => {
    Linking.openURL("mailto:info@smartdealsiq.com?subject=SmartDealsIQ Support Request");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <ThemedText type="h2">Help Center</ThemedText>
        <ThemedText type="body" secondary>Find answers to common questions</ThemedText>

        <Spacer size="xl" />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={[styles.quickAction, { backgroundColor: Colors.primary + '15' }]}
            onPress={handleContactSupport}
          >
            <Feather name="mail" size={24} color={Colors.primary} />
            <ThemedText type="small" style={{ color: Colors.primary, marginTop: Spacing.xs }}>
              Email Support
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.quickAction, { backgroundColor: Colors.secondary + '15' }]}
            onPress={() => Linking.openURL("https://smartdealsiq.com/faq")}
          >
            <Feather name="external-link" size={24} color={Colors.secondary} />
            <ThemedText type="small" style={{ color: Colors.secondary, marginTop: Spacing.xs }}>
              Online FAQ
            </ThemedText>
          </Pressable>
        </View>

        <Spacer size="xl" />

        {/* FAQ Categories */}
        {helpCategories.map((category) => (
          <View key={category.title} style={styles.categorySection}>
            <Pressable
              style={[styles.categoryHeader, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => setExpandedCategory(
                expandedCategory === category.title ? null : category.title
              )}
            >
              <View style={[styles.categoryIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Feather name={category.icon as any} size={20} color={Colors.primary} />
              </View>
              <ThemedText type="h4" style={styles.categoryTitle}>{category.title}</ThemedText>
              <Feather
                name={expandedCategory === category.title ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>

            {expandedCategory === category.title && (
              <Card style={styles.faqList}>
                {category.items.map((item, index) => (
                  <View key={item.question}>
                    <Pressable
                      style={[
                        styles.faqItem,
                        index < category.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                      ]}
                      onPress={() => setExpandedQuestion(
                        expandedQuestion === item.question ? null : item.question
                      )}
                    >
                      <View style={styles.faqQuestion}>
                        <ThemedText type="body" style={{ flex: 1 }}>{item.question}</ThemedText>
                        <Feather
                          name={expandedQuestion === item.question ? "minus" : "plus"}
                          size={18}
                          color={Colors.primary}
                        />
                      </View>
                      {expandedQuestion === item.question && (
                        <ThemedText type="small" secondary style={styles.faqAnswer}>
                          {item.answer}
                        </ThemedText>
                      )}
                    </Pressable>
                  </View>
                ))}
              </Card>
            )}
          </View>
        ))}

        <Spacer size="xl" />

        {/* Still need help */}
        <Card style={styles.contactCard}>
          <Feather name="message-circle" size={32} color={Colors.primary} />
          <Spacer size="md" />
          <ThemedText type="h4">Still need help?</ThemedText>
          <ThemedText type="small" secondary style={{ textAlign: 'center', marginTop: Spacing.xs }}>
            Our support team is here to assist you
          </ThemedText>
          <Spacer size="lg" />
          <Pressable
            style={[styles.contactButton, { backgroundColor: Colors.primary }]}
            onPress={handleContactSupport}
          >
            <ThemedText type="body" style={{ color: '#fff', fontWeight: '600' }}>
              Contact Support
            </ThemedText>
          </Pressable>
        </Card>

        <Spacer size="3xl" />
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
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  categorySection: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryTitle: {
    flex: 1,
  },
  faqList: {
    marginTop: Spacing.sm,
    padding: 0,
  },
  faqItem: {
    padding: Spacing.md,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqAnswer: {
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  contactCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  contactButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
});
