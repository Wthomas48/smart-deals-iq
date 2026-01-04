import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacer } from "@/components/Spacer";
import { Spacing } from "@/constants/theme";

export default function TermsOfServiceScreen() {
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
        <ThemedText type="h2">Terms of Service</ThemedText>
        <ThemedText type="caption" secondary>Last updated: January 2025</ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">1. Acceptance of Terms</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          By accessing or using SmartDealsIQ™ ("the App"), you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use the App.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">2. Description of Service</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          SmartDealsIQ is a platform that connects customers with local food vendors, restaurants,
          and food trucks. The App allows vendors to post deals and promotions, and customers to
          discover and save deals near their location.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">3. User Accounts</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          3.1. You must provide accurate and complete information when creating an account.{"\n\n"}
          3.2. You are responsible for maintaining the confidentiality of your account credentials.{"\n\n"}
          3.3. You must be at least 13 years old to use this App.{"\n\n"}
          3.4. One person may not maintain more than one account.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">4. Vendor Terms</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          4.1. Vendors must have valid business licenses and permits for their jurisdiction.{"\n\n"}
          4.2. All deals and promotions posted must be accurate and honored as advertised.{"\n\n"}
          4.3. Vendors are responsible for compliance with all local health and safety regulations.{"\n\n"}
          4.4. SmartDealsIQ reserves the right to remove any vendor or deal that violates these terms.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">5. Customer Terms</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          5.1. Customers must use the App for lawful purposes only.{"\n\n"}
          5.2. Deals are subject to vendor availability and terms.{"\n\n"}
          5.3. SmartDealsIQ is not responsible for the quality of products or services provided by vendors.{"\n\n"}
          5.4. Customers should verify deal details with vendors before making purchases.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">6. Prohibited Activities</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          You may not:{"\n\n"}
          - Use the App for any illegal purpose{"\n"}
          - Harass, abuse, or harm other users{"\n"}
          - Post false or misleading information{"\n"}
          - Attempt to gain unauthorized access to the App{"\n"}
          - Use automated systems to access the App{"\n"}
          - Interfere with the proper functioning of the App
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">7. Intellectual Property</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          All content, trademarks, and intellectual property in the App are owned by SmartDealsIQ
          or its licensors. You may not copy, modify, or distribute any content without permission.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">8. Disclaimer of Warranties</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT
          THE APP WILL BE ERROR-FREE OR UNINTERRUPTED. USE OF THE APP IS AT YOUR OWN RISK.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">9. Limitation of Liability</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          SmartDealsIQ shall not be liable for any indirect, incidental, special, or consequential
          damages arising from your use of the App or any transactions with vendors.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">10. Changes to Terms</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          We reserve the right to modify these Terms at any time. Continued use of the App after
          changes constitutes acceptance of the new Terms.
        </ThemedText>

        <Spacer size="xl" />

        <ThemedText type="h4">11. Contact Information</ThemedText>
        <Spacer size="sm" />
        <ThemedText type="body" secondary>
          For questions about these Terms, please contact us at:{"\n\n"}
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
