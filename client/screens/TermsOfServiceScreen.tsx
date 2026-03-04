import React from "react";
import { View, StyleSheet, ScrollView, Linking, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacer } from "@/components/Spacer";
import { Spacing, Colors } from "@/constants/theme";

export default function TermsOfServiceScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const handleSupportPress = () => {
    Linking.openURL("https://smartdealsiq.com/support/");
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
        <ThemedText type="h2">Terms of Service</ThemedText>
        <ThemedText type="caption" secondary>SmartDealsIQ Platform</ThemedText>

        <Spacer size="lg" />

        <ThemedText type="small" secondary>Effective Date: June 15, 2025</ThemedText>
        <ThemedText type="small" secondary>Last Updated: January 2026</ThemedText>

        <Spacer size="lg" />

        <View style={styles.operatorBox}>
          <ThemedText type="small" style={{ fontWeight: '600' }}>Operated by:</ThemedText>
          <ThemedText type="small" secondary>SMARTDEALSIQ SOLUTIONS LLC</ThemedText>
          <ThemedText type="small" secondary>("Company," "we," "our," or "us")</ThemedText>
        </View>

        <Spacer size="lg" />

        <ThemedText type="body" secondary>
          These Terms of Service ("Terms") govern your access to and use of our websites, mobile applications, and software services, including but not limited to smartdealsiq.com, smartdealsiq.net, SmartDealsIQ, SmartDealsIQ, and all SmartDealsIQ-branded products and services (collectively, the "Services").
        </ThemedText>

        <Spacer size="md" />

        <ThemedText type="body" secondary>
          By accessing or using the Services, you agree to be bound by these Terms. If you do not agree, do not use the Services.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 1 */}
        <ThemedText type="h4">1. Eligibility & Accounts</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          You must be at least 13 years old to use the Services. Some features may require you to create an account.{"\n\n"}
          You agree to:{"\n\n"}
          - Provide accurate and current information{"\n"}
          - Maintain the security of your credentials{"\n"}
          - Accept responsibility for all activity under your account{"\n\n"}
          We may suspend or terminate accounts that violate these Terms or applicable laws.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 2 */}
        <ThemedText type="h4">2. Description of Services</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          The Services provide AI-powered software tools, including but not limited to:{"\n\n"}
          - Prompt generation and automation tools{"\n"}
          - Productivity and workflow features{"\n"}
          - Vendor and deal-based platforms{"\n"}
          - Location-based discovery and mapping{"\n"}
          - Audio, voice, and royalty-free music tools{"\n"}
          - Subscription-based and free-tier features{"\n\n"}
          We may modify, update, suspend, or discontinue any part of the Services at any time.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 3 */}
        <ThemedText type="h4">3. Vendor & Business Use</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          If you register as a vendor or business user:{"\n\n"}
          - You are responsible for the accuracy of listings, deals, or offers{"\n"}
          - You must comply with all applicable laws and regulations{"\n"}
          - You may only use customer information for legitimate service-related purposes{"\n\n"}
          We are not responsible for disputes between vendors and customers.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 4 */}
        <ThemedText type="h4">4. Location-Based Features</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          Certain features rely on location data, such as nearby deals or local discovery. You control location permissions through your device settings. Disabling location access may limit functionality.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 5 */}
        <ThemedText type="h4">5. Subscriptions & Payments</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          Some features require payment.{"\n\n"}
          - Subscriptions are billed in advance and may renew automatically{"\n"}
          - You may cancel at any time before renewal{"\n"}
          - No partial refunds are provided unless required by law{"\n"}
          - Payments are processed by third-party providers{"\n\n"}
          We do not store full payment card details.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 6 */}
        <ThemedText type="h4">6. Acceptable Use</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          You agree not to:{"\n\n"}
          - Use the Services for unlawful, deceptive, or harmful purposes{"\n"}
          - Abuse, overload, or interfere with platform functionality{"\n"}
          - Reverse engineer, modify, or exploit the Services{"\n"}
          - Resell, sublicense, or redistribute the platform or generated content in violation of these Terms{"\n"}
          - Circumvent security or access controls{"\n\n"}
          Violations may result in immediate suspension or termination.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 7 */}
        <ThemedText type="h4">7. Content & Intellectual Property</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          All software, designs, trademarks, branding, and platform content are owned by SMARTDEALSIQ SOLUTIONS LLC or its licensors.{"\n\n"}
          You retain ownership of content you generate, subject to these Terms. However:{"\n\n"}
          - Standalone resale or redistribution of generated audio or music files is prohibited{"\n"}
          - We are not responsible for how generated content is used{"\n\n"}
          You grant us a limited license to host and process your content solely to provide the Services.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 8 */}
        <ThemedText type="h4">8. Third-Party Services</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          The Services may integrate with third-party tools such as payment processors, analytics providers, or infrastructure services. Use of such services may be subject to their own terms and policies.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 9 */}
        <ThemedText type="h4">9. Disclaimers</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          The Services are provided "as is" and "as available." We make no warranties regarding:{"\n\n"}
          - Accuracy or reliability of AI-generated content{"\n"}
          - Uninterrupted or error-free operation{"\n"}
          - Fitness for a particular purpose{"\n\n"}
          Use of the Services and generated content is at your own risk.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 10 */}
        <ThemedText type="h4">10. Limitation of Liability</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          To the maximum extent permitted by law, SMARTDEALSIQ SOLUTIONS LLC shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the Services.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 11 */}
        <ThemedText type="h4">11. Termination</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We may suspend or terminate your access at any time for violations of these Terms. You may discontinue use and cancel subscriptions at any time through your account settings or by contacting us.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 12 */}
        <ThemedText type="h4">12. Governing Law</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          These Terms shall be governed by and construed in accordance with the laws of the United States and the state in which SMARTDEALSIQ SOLUTIONS LLC is registered, without regard to conflict of law principles.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 13 */}
        <ThemedText type="h4">13. Changes to Terms</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We reserve the right to modify these Terms at any time. We will notify you of significant changes through the Services or by email. Continued use of the Services after changes constitutes acceptance of the updated Terms.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 14 */}
        <ThemedText type="h4">14. Contact Us</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          For questions about these Terms:
        </ThemedText>
        <Spacer size="md" />
        <Pressable onPress={handleSupportPress}>
          <ThemedText type="body" style={{ color: Colors.primary }}>
            smartdealsiq.com/support
          </ThemedText>
        </Pressable>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          SMARTDEALSIQ SOLUTIONS LLC
        </ThemedText>

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
  operatorBox: {
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
});
