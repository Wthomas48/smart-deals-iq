import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, ScrollView, Keyboard } from "react-native";
import { ThemedText } from "./ThemedText";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";

// API base URL from environment
const API_URL = Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:5000";

// Demo promo suggestions for fallback when API is unavailable
const DEMO_PROMOS = [
  { title: "Happy Hour Special", description: "50% off all appetizers from 3-6pm!" },
  { title: "Taco Tuesday", description: "Buy 2 tacos, get 1 free all day Tuesday" },
  { title: "Weekend Brunch Deal", description: "Free mimosa with any brunch entree" },
  { title: "Family Meal Bundle", description: "Feed 4 for just $29.99 - includes sides!" },
  { title: "Flash Lunch Special", description: "20% off all orders between 11am-2pm" },
  { title: "First-Timer Discount", description: "New customers get 25% off their first order" },
];

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onPromoGenerated?: (promo: { title: string; description: string; suggestedDiscount?: string }) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  mode?: "transcribe" | "generate-promo";
  businessType?: string;
  dealType?: string;
}

export function VoiceInput({
  onTranscription,
  onPromoGenerated,
  onError,
  placeholder = "Tap to speak",
  mode = "transcribe",
  businessType = "restaurant",
  dealType = "discount"
}: VoiceInputProps) {
  const { theme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");

  const handlePress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Generate promo using backend API
  const generatePromo = useCallback(async (description: string): Promise<{ title: string; description: string; suggestedDiscount?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/voice/generate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, businessType, dealType }),
      });
      if (!response.ok) throw new Error("Promo generation failed");
      return await response.json();
    } catch (error) {
      console.error("Promo generation API error:", error);
      // Fallback to demo promo
      const randomPromo = DEMO_PROMOS[Math.floor(Math.random() * DEMO_PROMOS.length)];
      return { ...randomPromo, suggestedDiscount: "15%" };
    }
  }, [businessType, dealType]);

  const startRecording = async () => {
    // For now, show text input modal for all platforms
    // Voice recording can be enabled on native when expo-audio is properly configured
    setShowTextInput(true);
    return;
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Demo mode fallback
      await new Promise(resolve => setTimeout(resolve, 500));

      if (mode === "generate-promo") {
        const randomPromo = DEMO_PROMOS[Math.floor(Math.random() * DEMO_PROMOS.length)];
        onTranscription(randomPromo.title);
        onPromoGenerated?.(randomPromo);
      } else {
        onTranscription("Voice transcription demo - please type your message");
      }
    } catch (error) {
      console.error("Processing error:", error);
      onError?.("Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async () => {
    if (textInputValue.trim()) {
      const text = textInputValue.trim();
      onTranscription(text);

      // If in promo mode, also generate a promo from the text
      if (mode === "generate-promo" && onPromoGenerated) {
        setIsProcessing(true);
        setShowTextInput(false);
        setTextInputValue("");
        try {
          const promo = await generatePromo(text);
          onPromoGenerated(promo);
        } catch {
          // Fallback to demo promo
          const randomPromo = DEMO_PROMOS[Math.floor(Math.random() * DEMO_PROMOS.length)];
          onPromoGenerated(randomPromo);
        } finally {
          setIsProcessing(false);
        }
        return;
      }
    }
    setTextInputValue("");
    setShowTextInput(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.voiceButton,
          { backgroundColor: isRecording ? Colors.error + "20" : theme.backgroundSecondary },
          isRecording && styles.recording
        ]}
        onPress={handlePress}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Feather
            name={isRecording ? "mic-off" : "mic"}
            size={20}
            color={isRecording ? Colors.error : Colors.primary}
          />
        )}
        <ThemedText
          type="small"
          style={[
            styles.buttonText,
            { color: isRecording ? Colors.error : theme.text }
          ]}
        >
          {isProcessing ? "Processing..." : isRecording ? "Tap to stop" : placeholder}
        </ThemedText>
      </Pressable>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, { backgroundColor: Colors.error }]} />
          <ThemedText type="caption" style={{ color: Colors.error }}>
            Recording...
          </ThemedText>
        </View>
      )}

      {/* Text Input Modal (fallback for web and when voice unavailable) */}
      <Modal
        visible={showTextInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTextInput(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalOverlayInner}
            onPress={() => {
              Keyboard.dismiss();
              setShowTextInput(false);
            }}
          >
            <Pressable
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.backgroundDefault || "#ffffff",
                },
                Shadows.lg,
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <ThemedText type="h4" style={styles.modalTitle}>
                {mode === "generate-promo" ? "Describe Your Promotion" : "Enter Your Message"}
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }
                ]}
                value={textInputValue}
                onChangeText={setTextInputValue}
                placeholder={mode === "generate-promo" ? "e.g., 20% off all tacos today" : "Type your message..."}
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  handleTextSubmit();
                }}
                blurOnSubmit
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowTextInput(false);
                  }}
                >
                  <ThemedText type="body">Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleTextSubmit();
                  }}
                >
                  <ThemedText type="body" style={{ color: "#fff" }}>
                    {mode === "generate-promo" ? "Generate" : "Submit"}
                  </ThemedText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  recording: {
    borderWidth: 2,
    borderColor: Colors.error,
  },
  buttonText: {
    marginLeft: Spacing.xs,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
  },
  modalOverlayInner: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
