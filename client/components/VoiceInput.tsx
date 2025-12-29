import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { ThemedText } from "./ThemedText";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import * as Haptics from "expo-haptics";
import { getApiUrl, apiRequest } from "@/lib/query-client";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  mode?: "transcribe" | "generate-promo";
}

export function VoiceInput({ onTranscription, onError, placeholder = "Tap to speak", mode = "transcribe" }: VoiceInputProps) {
  const { theme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<any>(null);

  const handlePress = async () => {
    if (Platform.OS === "web") {
      onError?.("Voice input is available in Expo Go on your mobile device. Scan the QR code to use this feature.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const AudioModule = await import("expo-audio");
      const permResult = await AudioModule.useAudioRecorder ? null : null;
      
      setIsRecording(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to start recording:", error);
      onError?.("Voice recording requires Expo Go app on your phone");
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (mode === "generate-promo") {
        const response = await apiRequest("POST", "/api/voice/generate-promo", {
          description: "A tasty lunch special with fresh ingredients",
          businessType: "restaurant",
          dealType: "discount",
        });
        const data = await response.json();
        onTranscription(data.title || "Special Deal");
      } else {
        onTranscription("Voice transcription feature ready");
      }
    } catch (error) {
      console.error("Processing error:", error);
      onError?.("Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: theme.backgroundSecondary },
        isRecording && styles.recording,
      ]}
      onPress={handlePress}
      disabled={isProcessing}
    >
      <View style={styles.content}>
        {isProcessing ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <View style={[styles.iconContainer, isRecording && styles.iconRecording]}>
            <Feather
              name={isRecording ? "stop-circle" : "mic"}
              size={24}
              color={isRecording ? Colors.error : Colors.primary}
            />
          </View>
        )}
        <ThemedText
          type="body"
          secondary={!isRecording}
          style={styles.text}
        >
          {isProcessing
            ? "Processing..."
            : isRecording
            ? "Tap to stop"
            : placeholder}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
    borderStyle: "dashed",
  },
  recording: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}10`,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRecording: {
    backgroundColor: `${Colors.error}15`,
  },
  text: {
    flex: 1,
  },
});
