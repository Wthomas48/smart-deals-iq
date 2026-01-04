import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TextInput, Pressable, Alert, Linking } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

export default function ContactScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !subject || !message) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    // Simulate sending - in production, this would call an API
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Message Sent",
        "Thank you for contacting us! We'll get back to you within 24-48 hours.",
        [{ text: "OK", onPress: () => {
          setSubject("");
          setMessage("");
        }}]
      );
    }, 1500);
  };

  const contactMethods = [
    {
      icon: "mail",
      title: "Email",
      value: "info@smartdealsiq.com",
      action: () => Linking.openURL("mailto:info@smartdealsiq.com"),
    },
    {
      icon: "phone",
      title: "Phone",
      value: "(727) 304-5812",
      action: () => Linking.openURL("tel:+17273045812"),
    },
    {
      icon: "clock",
      title: "Hours",
      value: "Mon-Fri, 9AM-6PM EST",
      action: undefined,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <ThemedText type="h2">Contact Us</ThemedText>
        <ThemedText type="body" secondary>We'd love to hear from you</ThemedText>

        <Spacer size="xl" />

        {/* Contact Methods */}
        <View style={styles.contactMethods}>
          {contactMethods.map((method) => (
            <Pressable
              key={method.title}
              style={[styles.contactMethod, { backgroundColor: theme.backgroundDefault }]}
              onPress={method.action}
              disabled={!method.action}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Feather name={method.icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <ThemedText type="caption" secondary>{method.title}</ThemedText>
                <ThemedText type="small">{method.value}</ThemedText>
              </View>
              {method.action && (
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              )}
            </Pressable>
          ))}
        </View>

        <Spacer size="xl" />

        {/* Contact Form */}
        <ThemedText type="h4">Send a Message</ThemedText>
        <Spacer size="md" />

        <Card style={styles.form}>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <ThemedText type="small" secondary style={styles.label}>Name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <Spacer size="md" />

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <ThemedText type="small" secondary style={styles.label}>Email</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <Spacer size="md" />

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <ThemedText type="small" secondary style={styles.label}>Subject</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={subject}
                onChangeText={setSubject}
                placeholder="How can we help?"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <Spacer size="md" />

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <ThemedText type="small" secondary style={styles.label}>Message</ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us more about your question or issue..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          <Spacer size="lg" />

          <Pressable
            style={[styles.submitButton, { backgroundColor: Colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <ThemedText type="body" style={{ color: '#fff', fontWeight: '600' }}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </ThemedText>
          </Pressable>
        </Card>

        <Spacer size="xl" />

        {/* Social Links */}
        <ThemedText type="h4">Follow Us</ThemedText>
        <Spacer size="md" />

        <View style={styles.socialLinks}>
          <Pressable
            style={[styles.socialLink, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => Linking.openURL("https://twitter.com/smartdealsiq")}
          >
            <Feather name="twitter" size={24} color="#1DA1F2" />
          </Pressable>
          <Pressable
            style={[styles.socialLink, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => Linking.openURL("https://facebook.com/smartdealsiq")}
          >
            <Feather name="facebook" size={24} color="#4267B2" />
          </Pressable>
          <Pressable
            style={[styles.socialLink, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => Linking.openURL("https://instagram.com/smartdealsiq")}
          >
            <Feather name="instagram" size={24} color="#E4405F" />
          </Pressable>
          <Pressable
            style={[styles.socialLink, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => Linking.openURL("https://linkedin.com/company/smartdealsiq")}
          >
            <Feather name="linkedin" size={24} color="#0077B5" />
          </Pressable>
        </View>

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
  contactMethods: {
    gap: Spacing.sm,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  form: {
    padding: Spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
  },
  formField: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  socialLink: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
