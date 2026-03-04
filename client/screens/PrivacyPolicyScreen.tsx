import React from "react";
import { View, StyleSheet, ScrollView, Linking, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacer } from "@/components/Spacer";
import { Spacing, Colors } from "@/constants/theme";

export default function PrivacyPolicyScreen() {
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
        <ThemedText type="h2">Privacy Policy</ThemedText>
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
          This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our websites, mobile applications, and software-as-a-service platforms, including but not limited to smartdealsiq.com, smartdealsiq.net, SmartDealsIQ, SmartDealsIQ, and other SmartDealsIQ-branded applications (collectively, the "Services").
        </ThemedText>

        <Spacer size="md" />

        <ThemedText type="body" secondary>
          By accessing or using our Services, you consent to the practices described in this Privacy Policy.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 1 */}
        <ThemedText type="h4">1. Information We Collect</ThemedText>
        <Spacer size="md" />

        <ThemedText type="body" style={{ fontWeight: '600' }}>A. Information You Provide</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We may collect information you voluntarily provide, including:{"\n\n"}
          - Name{"\n"}
          - Email address{"\n"}
          - Account credentials{"\n"}
          - Business name and vendor details{"\n"}
          - Support requests and communications{"\n"}
          - Preferences and settings
        </ThemedText>

        <Spacer size="lg" />

        <ThemedText type="body" style={{ fontWeight: '600' }}>B. Account & Vendor Information</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          If you register as a vendor or business user, we may collect:{"\n\n"}
          - Business name, category, and description{"\n"}
          - Business location and service area{"\n"}
          - Deal, product, or service listings{"\n"}
          - Transaction-related details
        </ThemedText>

        <Spacer size="lg" />

        <ThemedText type="body" style={{ fontWeight: '600' }}>C. Automatically Collected Information</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          When you use our Services, we may automatically collect:{"\n\n"}
          - Device type, operating system, and app version{"\n"}
          - Usage data, interactions, and feature engagement{"\n"}
          - Log files, diagnostics, and performance data{"\n"}
          - IP address and approximate location (for security and analytics)
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 2 */}
        <ThemedText type="h4">2. Location Data</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          Certain features, such as nearby deals, local discovery, and vendor mapping, require location access.{"\n\n"}
          We may collect:{"\n\n"}
          - Approximate or precise location (with your permission){"\n"}
          - Vendor business locations for display purposes{"\n\n"}
          You can control location permissions through your device settings. Disabling location access may limit certain features.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 3 */}
        <ThemedText type="h4">3. How We Use Your Information</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We use collected information to:{"\n\n"}
          - Provide, operate, and improve our Services{"\n"}
          - Personalize content, deals, and recommendations{"\n"}
          - Enable location-based features{"\n"}
          - Process transactions and vendor interactions{"\n"}
          - Send service-related notifications and updates{"\n"}
          - Maintain security, prevent fraud, and ensure compliance{"\n"}
          - Analyze usage trends and improve performance
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 4 */}
        <ThemedText type="h4">4. Analytics & Performance Monitoring</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We use analytics and monitoring tools to understand how users interact with our Services, identify issues, and improve functionality. Analytics data is collected in aggregated or anonymized form where possible and is not used to identify individuals directly.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 5 */}
        <ThemedText type="h4">5. Communications & Email</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          Our Services may send emails or notifications that are:{"\n\n"}
          - Transactional{"\n"}
          - Account-related{"\n"}
          - Vendor-enabled communications{"\n"}
          - Service updates or alerts{"\n\n"}
          Emails are sent only when enabled by the user or vendor. We do not send unsolicited marketing emails without consent.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 6 */}
        <ThemedText type="h4">6. Payments & Subscriptions</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          Payments and subscriptions are processed through secure third-party payment providers. We do not store full payment card information on our servers.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 7 */}
        <ThemedText type="h4">7. Cookies & Tracking Technologies</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We may use cookies or similar technologies to:{"\n\n"}
          - Maintain sessions{"\n"}
          - Remember preferences{"\n"}
          - Improve performance{"\n"}
          - Analyze usage patterns{"\n\n"}
          You may control cookies through your browser or device settings.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 8 */}
        <ThemedText type="h4">8. Information Sharing</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We do not sell personal data. Information may be shared only with:{"\n\n"}
          - Service providers (hosting, analytics, payments){"\n"}
          - Vendors (limited information necessary to fulfill a deal or service){"\n"}
          - Legal authorities when required by law{"\n"}
          - Business successors in the event of a merger or acquisition
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 9 */}
        <ThemedText type="h4">9. Data Security</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We implement reasonable administrative, technical, and physical safeguards to protect your information. However, no method of transmission or storage is completely secure.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 10 */}
        <ThemedText type="h4">10. Data Retention</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We retain information as long as necessary to provide our Services, comply with legal obligations, resolve disputes, and enforce agreements. Users may request account deletion where applicable.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 11 */}
        <ThemedText type="h4">11. Your Rights</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          Depending on your location, you may have rights to:{"\n\n"}
          - Access your personal data{"\n"}
          - Correct inaccurate information{"\n"}
          - Request deletion of your data{"\n"}
          - Withdraw consent at any time{"\n"}
          - Opt out of certain data processing{"\n"}
          - Data portability
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 12 */}
        <ThemedText type="h4">12. Children's Privacy</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          Our Services are not intended for children under 13. We do not knowingly collect information from children under 13. If we learn we have collected such information, we will delete it promptly.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 13 */}
        <ThemedText type="h4">13. International Users</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          If you access our Services from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 14 */}
        <ThemedText type="h4">14. Changes to This Policy</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We may update this Privacy Policy periodically. We will notify you of significant changes through the Services or by email. Your continued use of the Services after changes constitutes acceptance of the updated policy.
        </ThemedText>

        <Spacer size="xl" />

        {/* Section 15 */}
        <ThemedText type="h4">15. Contact Us</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          For privacy-related questions or to exercise your rights:
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
