import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Spacer } from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

type AuthMode = "welcome" | "login" | "signup" | "role";

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<AuthMode>("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  const switchMode = (newMode: AuthMode) => {
    clearForm();
    if (newMode === "welcome") {
      setSelectedRole(null);
    }
    setMode(newMode);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError("Invalid credentials. Please sign up first.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!selectedRole) {
      setError("Please select how you'll use the app");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await signup(name, email, password, selectedRole);
    } catch (err) {
      setError("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setMode("role");
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <ThemedText type="h1" style={styles.title}>SmartDealsIQ</ThemedText>
      <ThemedText type="body" secondary style={styles.subtitle}>
        Discover amazing deals from restaurants and local food businesses near you
      </ThemedText>
      <Spacer size="3xl" />
      <Button onPress={() => switchMode("signup")} style={styles.primaryButton}>
        Get Started
      </Button>
      <Spacer size="md" />
      <Pressable onPress={() => switchMode("login")} style={styles.secondaryButton}>
        <ThemedText type="body" style={{ color: Colors.primary }}>
          Already have an account? Log in
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderLogin = () => (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[
        styles.formContainer,
        { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable onPress={() => switchMode("welcome")} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="xl" />
      <ThemedText type="h2">Welcome back</ThemedText>
      <ThemedText type="body" secondary>Log in to continue</ThemedText>
      <Spacer size="2xl" />

      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}

      <Spacer size="2xl" />
      <Button onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : "Log In"}
      </Button>
      <Spacer size="lg" />
      <Pressable onPress={() => switchMode("signup")}>
        <ThemedText type="small" style={{ color: Colors.primary, textAlign: "center" }}>
          Don't have an account? Sign up
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );

  const renderSignup = () => (
    <KeyboardAwareScrollViewCompat
      contentContainerStyle={[
        styles.formContainer,
        { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable onPress={() => switchMode("welcome")} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="xl" />
      <ThemedText type="h2">Create account</ThemedText>
      <ThemedText type="body" secondary>Join SmartDealsIQ today</ThemedText>
      <Spacer size="2xl" />

      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Full name"
        placeholderTextColor={theme.textSecondary}
        value={name}
        onChangeText={setName}
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
      />
      <Spacer size="md" />
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}

      <Spacer size="2xl" />
      <Button onPress={handleContinue}>Continue</Button>
      <Spacer size="lg" />
      <Pressable onPress={() => switchMode("login")}>
        <ThemedText type="small" style={{ color: Colors.primary, textAlign: "center" }}>
          Already have an account? Log in
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );

  const renderRoleSelection = () => (
    <View style={[styles.formContainer, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }]}>
      <Pressable onPress={() => switchMode("signup")} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>
      <Spacer size="xl" />
      <ThemedText type="h2">How will you use SmartDealsIQ?</ThemedText>
      <ThemedText type="body" secondary>Select your role to get started</ThemedText>
      <Spacer size="3xl" />

      <Pressable
        style={[
          styles.roleCard,
          { backgroundColor: theme.backgroundDefault, borderColor: selectedRole === "customer" ? Colors.primary : theme.border },
          selectedRole === "customer" && styles.roleCardSelected,
        ]}
        onPress={() => setSelectedRole("customer")}
      >
        <View style={[styles.roleIcon, { backgroundColor: Colors.secondary + "20" }]}>
          <Feather name="search" size={28} color={Colors.secondary} />
        </View>
        <View style={styles.roleContent}>
          <ThemedText type="h4">Customer</ThemedText>
          <ThemedText type="small" secondary>Discover deals from food vendors near you</ThemedText>
        </View>
        {selectedRole === "customer" ? (
          <Feather name="check-circle" size={24} color={Colors.primary} />
        ) : null}
      </Pressable>

      <Spacer size="md" />

      <Pressable
        style={[
          styles.roleCard,
          { backgroundColor: theme.backgroundDefault, borderColor: selectedRole === "vendor" ? Colors.primary : theme.border },
          selectedRole === "vendor" && styles.roleCardSelected,
        ]}
        onPress={() => setSelectedRole("vendor")}
      >
        <View style={[styles.roleIcon, { backgroundColor: Colors.primary + "20" }]}>
          <Feather name="truck" size={28} color={Colors.primary} />
        </View>
        <View style={styles.roleContent}>
          <ThemedText type="h4">Vendor</ThemedText>
          <ThemedText type="small" secondary>Manage your business and promote deals</ThemedText>
        </View>
        {selectedRole === "vendor" ? (
          <Feather name="check-circle" size={24} color={Colors.primary} />
        ) : null}
      </Pressable>

      {error ? (
        <>
          <Spacer size="md" />
          <ThemedText type="small" style={{ color: Colors.error }}>{error}</ThemedText>
        </>
      ) : null}

      <View style={styles.spacer} />
      <Button onPress={handleSignup} disabled={isLoading || !selectedRole}>
        {isLoading ? <ActivityIndicator color="#fff" /> : "Complete Setup"}
      </Button>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {mode === "welcome" && renderWelcome()}
      {mode === "login" && renderLogin()}
      {mode === "signup" && renderSignup()}
      {mode === "role" && renderRoleSelection()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    marginBottom: Spacing.xl,
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
  primaryButton: {
    width: "100%",
  },
  secondaryButton: {
    padding: Spacing.md,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  roleCardSelected: {
    borderWidth: 2,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  roleContent: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
