import React, { useState, useRef } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useOffline } from "@/lib/offline-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

// Check if Google Sign-In is configured at module level
const GOOGLE_SIGN_IN_ENABLED = !!process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

type AuthMode = "choose-role" | "customer-login" | "customer-signup" | "vendor-login" | "vendor-signup" | "forgot-password" | "social-role-select";

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, loginAsVendor, signup, signInWithApple, signInWithGoogle, requestPasswordReset, confirmPasswordReset } = useAuth();
  const { isOnline } = useOffline();

  const [mode, setMode] = useState<AuthMode>("choose-role");
  const [returnToMode, setReturnToMode] = useState<AuthMode>("choose-role");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  // Track which social provider triggered role selection
  const pendingSocialProviderRef = useRef<"apple" | "google" | null>(null);

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setNewPassword("");
    setResetCode("");
    setResetStep("email");
    setResetEmail("");
    setError("");
    setSuccessMessage("");
  };

  const switchMode = (newMode: AuthMode) => {
    clearForm();
    if (newMode !== "social-role-select") {
      pendingSocialProviderRef.current = null;
    }
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
    const originalMessage = err?.message || "";

    if (message.includes("network") || message.includes("timeout") || message.includes("connection")) {
      return "Unable to connect. Please check your internet connection.";
    }
    if (message.includes("registered as a")) {
      return originalMessage;
    }
    if (message.includes("uses sign in with")) {
      return originalMessage;
    }
    if (message.includes("invalid") || message.includes("credentials") || message.includes("password")) {
      return "Invalid email or password. Please try again.";
    }
    if (message.includes("not found") || message.includes("no user") || message.includes("create an account")) {
      return originalMessage || "Account not found. Please sign up first.";
    }
    if (message.includes("already exists") || message.includes("duplicate") || message.includes("already registered") || message.includes("already taken")) {
      return originalMessage || "An account with this email already exists.";
    }
    return originalMessage || "Something went wrong. Please try again.";
  };

  // ============================================
  // SOCIAL AUTH HANDLERS
  // ============================================

  const handleAppleSignIn = async (preselectedRole?: UserRole) => {
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      const result = await signInWithApple(preselectedRole);
      if (result.needsRole) {
        pendingSocialProviderRef.current = "apple";
        setMode("social-role-select");
      }
    } catch (err: any) {
      // Don't show error if user cancelled
      if (!err.message?.includes("cancelled") && !err.message?.includes("ERR_REQUEST_CANCELED")) {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (preselectedRole?: UserRole) => {
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle(preselectedRole);
      if (result.needsRole) {
        pendingSocialProviderRef.current = "google";
        setMode("social-role-select");
      }
    } catch (err: any) {
      if (!err.message?.includes("cancelled")) {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRoleSelect = async (selectedRole: UserRole) => {
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      const provider = pendingSocialProviderRef.current;
      if (provider === "apple") {
        await signInWithApple(selectedRole);
      } else if (provider === "google") {
        await signInWithGoogle(selectedRole);
      }
    } catch (err: any) {
      if (!err.message?.includes("cancelled")) {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // SOCIAL AUTH BUTTONS COMPONENT
  // ============================================

  const renderSocialAuthButtons = (role?: UserRole) => {
    const showApple = Platform.OS === "ios";
    const showGoogle = GOOGLE_SIGN_IN_ENABLED;

    if (!showApple && !showGoogle) return null;

    return (
      <>
        {showApple && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={BorderRadius.sm}
            style={styles.appleButton}
            onPress={() => handleAppleSignIn(role)}
          />
        )}

        {showApple && showGoogle && <Spacer size="md" />}

        {showGoogle && (
          <Pressable
            style={[styles.googleButton, { borderColor: theme.border }]}
            onPress={() => handleGoogleSignIn(role)}
            disabled={isLoading}
          >
            <ThemedText type="body" style={styles.googleButtonText}>
              Sign in with Google
            </ThemedText>
          </Pressable>
        )}

        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <ThemedText type="small" secondary style={styles.dividerText}>or</ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>
      </>
    );
  };

  // Customer Login
  const handleCustomerLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!trimmedPassword) {
      setError("Please enter your password");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      await login(trimmedEmail, trimmedPassword);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Customer Signup
  const handleCustomerSignup = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      setError("Please enter your full name");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!trimmedPassword) {
      setError("Please enter a password");
      return;
    }
    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      // Split name into first/last and create username from email with random suffix
      const nameParts = trimmedName.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || undefined;
      const baseUsername = trimmedEmail.split("@")[0].replace(/[^a-z0-9]/g, "").slice(0, 24);
      const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      const username = (baseUsername || "user") + suffix;

      await signup({
        email: trimmedEmail,
        username: username.slice(0, 30),
        password: trimmedPassword,
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
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!trimmedPassword) {
      setError("Please enter your password");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      await loginAsVendor(trimmedEmail, trimmedPassword);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Vendor Signup
  const handleVendorSignup = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      setError("Please enter your business name");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!trimmedPassword) {
      setError("Please enter a password");
      return;
    }
    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    try {
      // Use business name + random suffix as username to avoid collisions
      const baseUsername = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
      const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      const username = (baseUsername || trimmedEmail.split("@")[0]) + suffix;

      await signup({
        email: trimmedEmail,
        username: username.slice(0, 30),
        password: trimmedPassword,
        role: "vendor",
        firstName: trimmedName, // Store business name in firstName for vendors
      });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Step 1: Request verification code
  const handleRequestResetCode = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const message = await requestPasswordReset(trimmedEmail);
      setResetEmail(trimmedEmail);
      setResetStep("code");
      setSuccessMessage("Check your email for the verification code.");
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Step 2: Verify code and set new password
  const handleConfirmReset = async () => {
    const trimmedCode = resetCode.trim();
    const trimmedNewPassword = newPassword.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    if (!trimmedNewPassword) {
      setError("Please enter a new password");
      return;
    }
    if (trimmedNewPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    triggerHaptic();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await confirmPasswordReset(resetEmail, trimmedCode, trimmedNewPassword);
      setSuccessMessage("Password reset successfully!");
      // After 2 seconds, go back to the login screen
      setTimeout(() => {
        setPassword(trimmedNewPassword);
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

      {/* Social Sign-In Options */}
      {(Platform.OS === "ios" || GOOGLE_SIGN_IN_ENABLED) && (
        <>
          <Spacer size="2xl" />
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <ThemedText type="small" secondary style={styles.dividerText}>or continue with</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>
          <Spacer size="lg" />

          {Platform.OS === "ios" && (
            <>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={BorderRadius.sm}
                style={styles.appleButton}
                onPress={() => handleAppleSignIn()}
              />
              <Spacer size="md" />
            </>
          )}

          {GOOGLE_SIGN_IN_ENABLED && (
            <Pressable
              style={[styles.googleButton, { borderColor: theme.border }]}
              onPress={() => handleGoogleSignIn()}
              disabled={isLoading}
            >
              <ThemedText type="body" style={styles.googleButtonText}>
                Continue with Google
              </ThemedText>
            </Pressable>
          )}
        </>
      )}

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}
    </View>
  );

  // ============================================
  // SOCIAL ROLE SELECT SCREEN
  // ============================================
  const renderSocialRoleSelect = () => (
    <View style={[styles.container, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }]}>
      <Pressable onPress={() => switchMode("choose-role")} style={[styles.backButton, { alignSelf: "flex-start" }]}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="lg" />

      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <ThemedText type="h2" style={styles.title}>Welcome to SmartDealsIQ!</ThemedText>
      <ThemedText type="body" secondary style={styles.subtitle}>
        One last step — how will you use the app?
      </ThemedText>
      <Spacer size="3xl" />

      {/* Customer Option */}
      <Pressable
        style={[styles.roleCard, { backgroundColor: theme.backgroundDefault, borderColor: Colors.secondary }]}
        onPress={() => handleSocialRoleSelect("customer")}
        disabled={isLoading}
      >
        <View style={[styles.roleIcon, { backgroundColor: Colors.secondary + "20" }]}>
          <Feather name="shopping-bag" size={32} color={Colors.secondary} />
        </View>
        <View style={styles.roleContent}>
          <ThemedText type="h3">I'm a Customer</ThemedText>
          <ThemedText type="small" secondary>Find deals from food vendors near me</ThemedText>
        </View>
        {isLoading ? (
          <ActivityIndicator color={Colors.secondary} />
        ) : (
          <Feather name="chevron-right" size={24} color={theme.textSecondary} />
        )}
      </Pressable>

      <Spacer size="lg" />

      {/* Vendor Option */}
      <Pressable
        style={[styles.roleCard, { backgroundColor: theme.backgroundDefault, borderColor: Colors.primary }]}
        onPress={() => handleSocialRoleSelect("vendor")}
        disabled={isLoading}
      >
        <View style={[styles.roleIcon, { backgroundColor: Colors.primary + "20" }]}>
          <Feather name="briefcase" size={32} color={Colors.primary} />
        </View>
        <View style={styles.roleContent}>
          <ThemedText type="h3">I'm a Vendor</ThemedText>
          <ThemedText type="small" secondary>Manage my business and post deals</ThemedText>
        </View>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Feather name="chevron-right" size={24} color={theme.textSecondary} />
        )}
      </Pressable>

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error, textAlign: "center" }}>{error}</ThemedText>
        </>
      ) : null}
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

      <Pressable onPress={() => switchMode("choose-role")} style={styles.logoTouchable}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.secondary + '20' }]}>
          <Feather name="shopping-bag" size={32} color={Colors.secondary} />
        </View>
      </Pressable>
      <Spacer size="lg" />
      <ThemedText type="h2">Customer Sign In</ThemedText>
      <ThemedText type="body" secondary>Welcome back! Sign in to find deals</ThemedText>
      <Spacer size="2xl" />

      {renderSocialAuthButtons("customer")}

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

      <Pressable onPress={() => switchMode("choose-role")} style={styles.logoTouchable}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.secondary + '20' }]}>
          <Feather name="shopping-bag" size={32} color={Colors.secondary} />
        </View>
      </Pressable>
      <Spacer size="lg" />
      <ThemedText type="h2">Create Customer Account</ThemedText>
      <ThemedText type="body" secondary>Join SmartDealsIQ™ to find great deals</ThemedText>
      <Spacer size="2xl" />

      {renderSocialAuthButtons("customer")}

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

      <Pressable onPress={() => switchMode("choose-role")} style={styles.logoTouchable}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.primary + '20' }]}>
          <Feather name="briefcase" size={32} color={Colors.primary} />
        </View>
      </Pressable>
      <Spacer size="lg" />
      <ThemedText type="h2">Vendor Sign In</ThemedText>
      <ThemedText type="body" secondary>Manage your business and deals</ThemedText>
      <Spacer size="2xl" />

      {renderSocialAuthButtons("vendor")}

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

      <Pressable onPress={() => switchMode("choose-role")} style={styles.logoTouchable}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.primary + '20' }]}>
          <Feather name="briefcase" size={32} color={Colors.primary} />
        </View>
      </Pressable>
      <Spacer size="lg" />
      <ThemedText type="h2">Create Vendor Account</ThemedText>
      <ThemedText type="body" secondary>Set up your business on SmartDealsIQ™</ThemedText>
      <Spacer size="2xl" />

      {renderSocialAuthButtons("vendor")}

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
  // FORGOT PASSWORD SCREEN (2-step flow)
  // ============================================
  const renderForgotPassword = () => (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[
        styles.formContainer,
        { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable onPress={() => resetStep === "code" ? setResetStep("email") : switchMode(returnToMode)} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="lg" />

      <Pressable onPress={() => switchMode("choose-role")} style={styles.logoTouchable}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.warning + '20' }]}>
          <Feather name="lock" size={32} color={Colors.warning} />
        </View>
      </Pressable>
      <Spacer size="lg" />
      <ThemedText type="h2">Reset Password</ThemedText>
      <ThemedText type="body" secondary style={{ textAlign: 'center' }}>
        {resetStep === "email"
          ? "Enter your email to receive a verification code"
          : "Enter the 6-digit code sent to your email"}
      </ThemedText>
      <Spacer size="2xl" />

      {resetStep === "email" ? (
        <>
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
        </>
      ) : (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="6-digit code"
            placeholderTextColor={theme.textSecondary}
            value={resetCode}
            onChangeText={setResetCode}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
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
        </>
      )}

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
      {resetStep === "email" ? (
        <Button onPress={handleRequestResetCode} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : "Send Verification Code"}
        </Button>
      ) : (
        <>
          <Button onPress={handleConfirmReset} disabled={isLoading || !!successMessage}>
            {isLoading ? <ActivityIndicator color="#fff" /> : "Reset Password"}
          </Button>
          <Spacer size="md" />
          <Pressable onPress={() => { setError(""); setSuccessMessage(""); handleRequestResetCode(); }}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Didn't receive a code? Resend
            </ThemedText>
          </Pressable>
        </>
      )}
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
      {mode === "social-role-select" && renderSocialRoleSelect()}
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
  },
  logoTouchable: {
    alignSelf: 'center',
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  // Social auth styles
  appleButton: {
    width: "100%",
    height: 50,
  },
  googleButton: {
    width: "100%",
    height: 50,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  googleButtonText: {
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
  },
});
