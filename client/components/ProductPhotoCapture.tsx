import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Spacer } from "./Spacer";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

// Conditionally import camera for native platforms only
let CameraView: React.ComponentType<any> | null = null;
let Camera: any = null;

if (Platform.OS !== "web") {
  try {
    const ExpoCamera = require("expo-camera");
    CameraView = ExpoCamera.CameraView;
    Camera = ExpoCamera.Camera;
  } catch (e) {
    if (__DEV__) console.log("expo-camera not available");
  }
}

export interface ProductPhoto {
  id: string;
  uri: string;
  caption?: string;
  createdAt: string;
}

interface ProductPhotoCaptureProps {
  photos: ProductPhoto[];
  onPhotosChange: (photos: ProductPhoto[]) => void;
  maxPhotos?: number;
  title?: string;
  subtitle?: string;
}

export function ProductPhotoCapture({
  photos,
  onPhotosChange,
  maxPhotos = 6,
  title = "Product Photos",
  subtitle = "Showcase your products with great photos",
}: ProductPhotoCaptureProps) {
  const { theme } = useTheme();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<"back" | "front">("back");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<any>(null);

  // Camera permissions - only on native
  const [permission, setPermission] = useState<{ granted: boolean } | null>(null);

  const requestCameraPermission = async () => {
    if (Platform.OS === "web" || !Camera) {
      return { granted: false };
    }
    try {
      const result = await Camera.requestCameraPermissionsAsync();
      setPermission(result);
      return result;
    } catch {
      return { granted: false };
    }
  };

  const handleOpenCamera = async () => {
    // On web, go straight to gallery
    if (Platform.OS === "web" || !CameraView) {
      handlePickFromGallery();
      return;
    }

    if (!permission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to take product photos.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Use Gallery", onPress: handlePickFromGallery },
          ]
        );
        return;
      }
    }

    if (photos.length >= maxPhotos) {
      Alert.alert(
        "Maximum Photos Reached",
        `You can only add up to ${maxPhotos} photos. Remove some to add new ones.`
      );
      return;
    }

    setShowCamera(true);
  };

  const handlePickFromGallery = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert(
        "Maximum Photos Reached",
        `You can only add up to ${maxPhotos} photos. Remove some to add new ones.`
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
      Alert.alert("Error", "Failed to open gallery. Please try again.");
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error("Failed to capture photo:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      addPhoto(capturedPhoto);
      setCapturedPhoto(null);
      setShowCamera(false);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
  };

  const addPhoto = (uri: string) => {
    const newPhoto: ProductPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uri,
      createdAt: new Date().toISOString(),
    };

    onPhotosChange([...photos, newPhoto]);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const removePhoto = (photoId: string) => {
    if (Platform.OS === "web") {
      onPhotosChange(photos.filter((p) => p.id !== photoId));
      return;
    }

    Alert.alert("Remove Photo", "Are you sure you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          onPhotosChange(photos.filter((p) => p.id !== photoId));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      },
    ]);
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const renderPhotoGrid = () => {
    const slots = [];
    for (let i = 0; i < maxPhotos; i++) {
      const photo = photos[i];
      slots.push(
        <View key={i} style={styles.photoSlot}>
          {photo ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <Pressable
                style={[styles.removeButton, { backgroundColor: Colors.error }]}
                onPress={() => removePhoto(photo.id)}
              >
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
              {i === 0 && (
                <View style={[styles.primaryBadge, { backgroundColor: Colors.primary }]}>
                  <ThemedText type="caption" style={styles.primaryBadgeText}>
                    Main
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <Pressable
              style={[
                styles.emptySlot,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
              onPress={i === 0 ? handleOpenCamera : handlePickFromGallery}
            >
              <Feather name="plus" size={24} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={styles.addPhotoText}>
                Add
              </ThemedText>
            </Pressable>
          )}
        </View>
      );
    }
    return slots;
  };

  // Check if camera is available
  const isCameraAvailable = Platform.OS !== "web" && CameraView !== null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText type="h4">{title}</ThemedText>
          <ThemedText type="small" secondary>
            {subtitle}
          </ThemedText>
        </View>
        <ThemedText type="caption" secondary>
          {photos.length}/{maxPhotos}
        </ThemedText>
      </View>

      <Spacer size="md" />

      <View style={styles.photoGrid}>{renderPhotoGrid()}</View>

      <Spacer size="md" />

      <View style={styles.actionButtons}>
        {isCameraAvailable && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: Colors.primary + "15" }]}
            onPress={handleOpenCamera}
            disabled={photos.length >= maxPhotos}
          >
            <Feather name="camera" size={20} color={Colors.primary} />
            <ThemedText type="small" style={{ color: Colors.primary, marginLeft: Spacing.sm }}>
              Take Photo
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: theme.backgroundSecondary },
            !isCameraAvailable && { flex: 1 },
          ]}
          onPress={handlePickFromGallery}
          disabled={photos.length >= maxPhotos}
        >
          <Feather name="image" size={20} color={theme.text} />
          <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
            {isCameraAvailable ? "Gallery" : "Add Photo"}
          </ThemedText>
        </Pressable>
      </View>

      {/* Camera Modal - only for native */}
      {isCameraAvailable && CameraView && (
        <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
          <ThemedView style={styles.cameraContainer}>
            {capturedPhoto ? (
              // Photo Preview
              <View style={styles.previewContainer}>
                <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />

                <View style={styles.previewActions}>
                  <Pressable
                    style={[styles.previewButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={handleRetakePhoto}
                  >
                    <Feather name="refresh-cw" size={24} color={theme.text} />
                    <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
                      Retake
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.previewButton, { backgroundColor: Colors.success }]}
                    onPress={handleConfirmPhoto}
                  >
                    <Feather name="check" size={24} color="#fff" />
                    <ThemedText type="body" style={{ color: "#fff", marginTop: Spacing.xs }}>
                      Use Photo
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : (
              // Camera View
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={cameraType}
              >
                {/* Camera Header */}
                <View style={styles.cameraHeader}>
                  <Pressable
                    style={styles.cameraHeaderButton}
                    onPress={() => setShowCamera(false)}
                  >
                    <Feather name="x" size={28} color="#fff" />
                  </Pressable>

                  <ThemedText type="body" style={styles.cameraTitle}>
                    Take Product Photo
                  </ThemedText>

                  <Pressable style={styles.cameraHeaderButton} onPress={toggleCameraType}>
                    <Feather name="refresh-cw" size={24} color="#fff" />
                  </Pressable>
                </View>

                {/* Camera Frame Guide */}
                <View style={styles.frameGuide}>
                  <View style={[styles.frameCorner, styles.frameTopLeft]} />
                  <View style={[styles.frameCorner, styles.frameTopRight]} />
                  <View style={[styles.frameCorner, styles.frameBottomLeft]} />
                  <View style={[styles.frameCorner, styles.frameBottomRight]} />
                </View>

                {/* Camera Controls */}
                <View style={styles.cameraControls}>
                  <Pressable
                    style={styles.galleryButton}
                    onPress={async () => {
                      setShowCamera(false);
                      setTimeout(handlePickFromGallery, 300);
                    }}
                  >
                    <Feather name="image" size={24} color="#fff" />
                  </Pressable>

                  <Pressable
                    style={[
                      styles.captureButton,
                      isCapturing && styles.captureButtonDisabled,
                    ]}
                    onPress={handleCapture}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <View style={styles.captureButtonInner} />
                    )}
                  </Pressable>

                  <View style={styles.galleryButton} />
                </View>

                {/* Tips */}
                <View style={styles.tipContainer}>
                  <ThemedText type="caption" style={styles.tipText}>
                    Tip: Use good lighting and show your product clearly
                  </ThemedText>
                </View>
              </CameraView>
            )}
          </ThemedView>
        </Modal>
      )}
    </View>
  );
}

// Simplified photo picker for web or when camera is not available
export function ProductPhotoPickerSimple({
  photos,
  onPhotosChange,
  maxPhotos = 6,
}: Omit<ProductPhotoCaptureProps, "title" | "subtitle">) {
  const { theme } = useTheme();

  const handlePickPhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert("Maximum Photos", `You can only add up to ${maxPhotos} photos.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: ProductPhoto = {
        id: `photo_${Date.now()}`,
        uri: result.assets[0].uri,
        createdAt: new Date().toISOString(),
      };
      onPhotosChange([...photos, newPhoto]);
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.simplePhotoRow}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.simplePhotoItem}>
            <Image source={{ uri: photo.uri }} style={styles.simplePhotoImage} />
            <Pressable
              style={[styles.simpleRemoveButton, { backgroundColor: Colors.error }]}
              onPress={() => onPhotosChange(photos.filter((p) => p.id !== photo.id))}
            >
              <Feather name="x" size={12} color="#fff" />
            </Pressable>
          </View>
        ))}

        {photos.length < maxPhotos && (
          <Pressable
            style={[styles.simpleAddButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={handlePickPhoto}
          >
            <Feather name="plus" size={24} color={Colors.primary} />
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  photoSlot: {
    width: "31%",
    aspectRatio: 1,
  },
  photoContainer: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBadge: {
    position: "absolute",
    bottom: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  primaryBadgeText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptySlot: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoText: {
    marginTop: Spacing.xs,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  cameraHeaderButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTitle: {
    color: "#fff",
    fontWeight: "600",
  },
  frameGuide: {
    flex: 1,
    margin: Spacing.xl,
    position: "relative",
  },
  frameCorner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#fff",
    borderWidth: 3,
  },
  frameTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: BorderRadius.md,
  },
  frameTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: BorderRadius.md,
  },
  frameBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
  },
  frameBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: BorderRadius.md,
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 50,
    paddingHorizontal: Spacing.xl,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  tipContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tipText: {
    color: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  // Preview styles
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewImage: {
    flex: 1,
    resizeMode: "contain",
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.xl,
    paddingBottom: 50,
    backgroundColor: "#000",
  },
  previewButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
  },
  // Simple picker styles
  simplePhotoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  simplePhotoItem: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  simplePhotoImage: {
    width: "100%",
    height: "100%",
  },
  simpleRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  simpleAddButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
