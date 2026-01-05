import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

type AuthMode = "choose-role" | "customer-login" | "customer-signup" | "vendor-login" | "vendor-signup" | "forgot-password";

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, loginAsVendor, signup, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>("choose-role");
  const [returnToMode, setReturnToMode] = useState<AuthMode>("choose-role");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setNewPassword("");
    setError("");
    setSuccessMessage("");
  };

  const switchMode = (newMode: AuthMode) => {
    clearForm();
    setMode(newMode);
  };

  const goToForgotPassword = (fromMode: AuthMode) => {
    setReturnToMode(fromMode);
    clearForm();
    setMode("forgot-password");
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Helper to get user-friendly error message
  const getErrorMessage = (err: any): string => {
    const message = err?.message?.toLowerCase() || "";

    if (message.includes("network") || message.includes("timeout") || message.includes("connection")) {
      return "Unable to connect. Please check your internet connection.";
    }
    if (message.includes("invalid") || message.includes("credentials") || message.includes("password")) {
      return "Invalid email or password. Please try again.";
    }
    if (message.includes("not found") || message.includes("no user")) {
      return "Account not found. Please sign up first.";
    }
    if (message.includes("already exists") || message.includes("duplicate")) {
      return "An account with this email already exists.";
    }
    return err?.message || "Something went wrong. Please try again.";
  };

  // Customer Login
  const handleCustomerLogin = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Customer Signup
  const handleCustomerSignup = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      // Split name into first/last and create username from email
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || undefined;
      const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

      await signup({
        email,
        username,
        password,
        role: "customer",
        firstName,
        lastName,
      });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Vendor Login
  const handleVendorLogin = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      await loginAsVendor(email, password);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Vendor Signup
  const handleVendorSignup = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      // Use business name as username (cleaned up)
      const username = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);

      await signup({
        email,
        username: username || email.split("@")[0],
        password,
        role: "vendor",
        firstName: name, // Store business name in firstName for vendors
      });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset
  const handlePasswordReset = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const message = await resetPassword(email, newPassword);
      setSuccessMessage(message);
      // After 2 seconds, go back to the login screen
      setTimeout(() => {
        setPassword(newPassword); // Pre-fill the password for convenience
        switchMode(returnToMode);
      }, 2000);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // ROLE SELECTION SCREEN
  // ============================================
  const renderChooseRole = () => (
    <View style={[styles.container, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }]}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <ThemedText type="h1" style={styles.title}>SmartDealsIQ™</ThemedText>
      <ThemedText type="body" secondary style={styles.subtitle}>
        Discover amazing deals from local food businesses
      </ThemedText>
      <Spacer size="3xl" />

      <ThemedText type="h3" style={styles.chooseText}>How will you use the app?</ThemedText>
      <Spacer size="xl" />

      {/* Customer Option */}
      <Pressable
        style={[styles.roleCard, { backgroundColor: theme.backgroundDefault, borderColor: Colors.secondary }]}
        onPress={() => switchMode("customer-login")}
      >
        <View style={[styles.roleIcon, { backgroundColor: Colors.secondary + "20" }]}>
          <Feather name="shopping-bag" size={32} color={Colors.secondary} />
        </View>
        <View style={styles.roleContent}>
          <ThemedText type="h3">I'm a Customer</ThemedText>
          <ThemedText type="small" secondary>Find deals from food vendors near me</ThemedText>
        </View>
        <Feather name="chevron-right" size={24} color={theme.textSecondary} />
      </Pressable>

      <Spacer size="lg" />

      {/* Vendor Option */}
      <Pressable
        style={[styles.roleCard, { backgroundColor: theme.backgroundDefault, borderColor: Colors.primary }]}
        onPress={() => switchMode("vendor-login")}
      >
        <View style={[styles.roleIcon, { backgroundColor: Colors.primary + "20" }]}>
          <Feather name="briefcase" size={32} color={Colors.primary} />
        </View>
        <View style={styles.roleContent}>
          <ThemedText type="h3">I'm a Vendor</ThemedText>
          <ThemedText type="small" secondary>Manage my business and post deals</ThemedText>
        </View>
        <Feather name="chevron-right" size={24} color={theme.textSecondary} />
      </Pressable>
    </View>
  );

  // ============================================
  // CUSTOMER LOGIN SCREEN
  // ============================================
  const renderCustomerLogin = () => (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[
        styles.formContainer,
        { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable onPress={() => switchMode("choose-role")} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="lg" />

      <View style={[styles.headerIcon, { backgroundColor: Colors.secondary + '20' }]}>
        <Feather name="shopping-bag" size={32} color={Colors.secondary} />
      </View>
      <Spacer size="lg" />
      <ThemedText type="h2">Customer Sign In</ThemedText>
      <ThemedText type="body" secondary>Welcome back! Sign in to find deals</ThemedText>
      <Spacer size="2xl" />

      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}

      <Spacer size="2xl" />
      <Button onPress={handleCustomerLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : "Sign In"}
      </Button>
      <Spacer size="md" />
      <Pressable onPress={() => goToForgotPassword("customer-login")}>
        <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
          Forgot your password?
        </ThemedText>
      </Pressable>
      <Spacer size="lg" />
      <Pressable onPress={() => switchMode("customer-signup")}>
        <ThemedText type="body" style={{ color: Colors.primary, textAlign: "center" }}>
          New customer? Create an account
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );

  // ============================================
  // CUSTOMER SIGNUP SCREEN
  // ============================================
  const renderCustomerSignup = () => (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[
        styles.formContainer,
        { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable onPress={() => switchMode("customer-login")} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="lg" />

      <View style={[styles.headerIcon, { backgroundColor: Colors.secondary + '20' }]}>
        <Feather name="shopping-bag" size={32} color={Colors.secondary} />
      </View>
      <Spacer size="lg" />
      <ThemedText type="h2">Create Customer Account</ThemedText>
      <ThemedText type="body" secondary>Join SmartDealsIQ™ to find great deals</ThemedText>
      <Spacer size="2xl" />

      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Full Name"
        placeholderTextColor={theme.textSecondary}
        value={name}
        onChangeText={setName}
        autoComplete="name"
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}

      <Spacer size="2xl" />
      <Button onPress={handleCustomerSignup} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : "Create Account"}
      </Button>
      <Spacer size="lg" />
      <Pressable onPress={() => switchMode("customer-login")}>
        <ThemedText type="body" style={{ color: Colors.primary, textAlign: "center" }}>
          Already have an account? Sign in
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );

  // ============================================
  // VENDOR LOGIN SCREEN
  // ============================================
  const renderVendorLogin = () => (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[
        styles.formContainer,
        { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable onPress={() => switchMode("choose-role")} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="lg" />

      <View style={[styles.headerIcon, { backgroundColor: Colors.primary + '20' }]}>
        <Feather name="briefcase" size={32} color={Colors.primary} />
      </View>
      <Spacer size="lg" />
      <ThemedText type="h2">Vendor Sign In</ThemedText>
      <ThemedText type="body" secondary>Manage your business and deals</ThemedText>
      <Spacer size="2xl" />

      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}

      <Spacer size="2xl" />
      <Button onPress={handleVendorLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : "Sign In"}
      </Button>
      <Spacer size="md" />
      <Pressable onPress={() => goToForgotPassword("vendor-login")}>
        <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
          Forgot your password?
        </ThemedText>
      </Pressable>
      <Spacer size="lg" />
      <Pressable onPress={() => switchMode("vendor-signup")}>
        <ThemedText type="body" style={{ color: Colors.primary, textAlign: "center" }}>
          New vendor? Create an account
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );

  // ============================================
  // VENDOR SIGNUP SCREEN
  // ============================================
  const renderVendorSignup = () => (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[
        styles.formContainer,
        { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable onPress={() => switchMode("vendor-login")} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="lg" />

      <View style={[styles.headerIcon, { backgroundColor: Colors.primary + '20' }]}>
        <Feather name="briefcase" size={32} color={Colors.primary} />
      </View>
      <Spacer size="lg" />
      <ThemedText type="h2">Create Vendor Account</ThemedText>
      <ThemedText type="body" secondary>Set up your business on SmartDealsIQ™</ThemedText>
      <Spacer size="2xl" />

      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Business Name"
        placeholderTextColor={theme.textSecondary}
        value={name}
        onChangeText={setName}
        autoComplete="name"
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}

      <Spacer size="2xl" />
      <Button onPress={handleVendorSignup} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : "Create Vendor Account"}
      </Button>
      <Spacer size="lg" />
      <Pressable onPress={() => switchMode("vendor-login")}>
        <ThemedText type="body" style={{ color: Colors.primary, textAlign: "center" }}>
          Already have an account? Sign in
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );

  // ============================================
  // FORGOT PASSWORD SCREEN
  // ============================================
  const renderForgotPassword = () => (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[
        styles.formContainer,
        { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable onPress={() => switchMode(returnToMode)} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="lg" />

      <View style={[styles.headerIcon, { backgroundColor: Colors.warning + '20' }]}>
        <Feather name="lock" size={32} color={Colors.warning} />
      </View>
      <Spacer size="lg" />
      <ThemedText type="h2">Reset Password</ThemedText>
      <ThemedText type="body" secondary style={{ textAlign: 'center' }}>
        Enter your email and a new password to reset your account
      </ThemedText>
      <Spacer size="2xl" />

      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="New Password"
        placeholderTextColor={theme.textSecondary}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}

      {successMessage ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.success }}>{successMessage}</ThemedText>
        </>
      ) : null}

      <Spacer size="2xl" />
      <Button onPress={handlePasswordReset} disabled={isLoading || !!successMessage}>
        {isLoading ? <ActivityIndicator color="#fff" /> : "Reset Password"}
      </Button>
      <Spacer size="lg" />
      <Pressable onPress={() => switchMode(returnToMode)}>
        <ThemedText type="body" style={{ color: Colors.primary, textAlign: "center" }}>
          Back to Sign In
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );

  return (
    <ThemedView style={styles.mainContainer}>
      {mode === "choose-role" && renderChooseRole()}
      {mode === "customer-login" && renderCustomerLogin()}
      {mode === "customer-signup" && renderCustomerSignup()}
      {mode === "vendor-login" && renderVendorLogin()}
      {mode === "vendor-signup" && renderVendorSignup()}
      {mode === "forgot-password" && renderForgotPassword()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  chooseText: {
    textAlign: "center",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    width: "100%",
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  roleContent: {
    flex: 1,
  },
  formContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
});
