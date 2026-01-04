import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacer } from "@/components/Spacer";
import { Spacing } from "@/constants/theme";

export default function PrivacyPolicyScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

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
        <ThemedText type="caption" secondary>Last updated: January 2025</ThemedText>

        <Spacer size="xl" />

        <ThemedText type="body" secondary>
          SmartDealsIQ™ ("we", "our", or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and safeguard your information.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">1. Information We Collect</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          <ThemedText type="body" style={{ fontWeight: '600' }}>Account Information:</ThemedText>
          {"\n"}- Name, email address, and password{"\n"}
          - Business name and details (for vendors){"\n\n"}

          <ThemedText type="body" style={{ fontWeight: '600' }}>Location Data:</ThemedText>
          {"\n"}- Your location to show nearby deals{"\n"}
          - Vendor business locations{"\n\n"}

          <ThemedText type="body" style={{ fontWeight: '600' }}>Usage Information:</ThemedText>
          {"\n"}- Deals you view and save{"\n"}
          - Search history{"\n"}
          - App usage patterns
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">2. How We Use Your Information</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We use your information to:{"\n\n"}
          - Provide and improve our services{"\n"}
          - Show you relevant deals near your location{"\n"}
          - Send notifications about deals you might like{"\n"}
          - Process vendor transactions{"\n"}
          - Ensure security and prevent fraud{"\n"}
          - Communicate important updates
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">3. Information Sharing</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We do NOT sell your personal information. We may share information with:{"\n\n"}
          - Vendors (limited information when you claim a deal){"\n"}
          - Service providers who help operate our App{"\n"}
          - Law enforcement when required by law{"\n"}
          - Other parties with your consent
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">4. Location Data</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We collect location data to show you nearby deals. You can control location access
          in your device settings. Without location access, some features may be limited.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">5. Data Security</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We implement industry-standard security measures to protect your data, including:{"\n\n"}
          - Encryption of data in transit and at rest{"\n"}
          - Secure authentication{"\n"}
          - Regular security audits{"\n"}
          - Access controls and monitoring
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">6. Your Rights</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          You have the right to:{"\n\n"}
          - Access your personal data{"\n"}
          - Correct inaccurate data{"\n"}
          - Delete your account and data{"\n"}
          - Opt out of marketing communications{"\n"}
          - Export your data{"\n"}
          - Withdraw consent at any time
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">7. Cookies and Tracking</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We use cookies and similar technologies to:{"\n\n"}
          - Remember your preferences{"\n"}
          - Analyze app usage{"\n"}
          - Improve user experience{"\n\n"}
          You can control cookie settings in your browser or device.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">8. Children's Privacy</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          Our App is not intended for children under 13. We do not knowingly collect
          information from children under 13. If we learn we have collected such information,
          we will delete it promptly.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">9. Data Retention</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We retain your data as long as your account is active or as needed to provide services.
          You can request deletion of your data at any time by contacting us or using the
          "Delete Account" feature.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">10. Changes to This Policy</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We may update this Privacy Policy periodically. We will notify you of significant
          changes through the App or by email.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">11. Contact Us</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          For privacy-related questions or to exercise your rights:{"\n\n"}
          Email: info@smartdealsiq.com{"\n"}
          Address: SmartDealsIQ™ Inc.
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
});
