import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, Share, Platform, Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';

interface SocialShareProps {
  deal: {
    id: string;
    title: string;
    vendorName: string;
    discount: string;
    discountedPrice: number;
  };
  onShare?: (platform: string) => void;
}

interface ShareOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  action: (deal: SocialShareProps['deal']) => Promise<void>;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'native',
    name: 'Share',
    icon: 'share-2',
    color: Colors.primary,
    action: async (deal) => {
      await Share.share({
        title: `Check out this deal: ${deal.title}`,
        message: `🔥 ${deal.discount} OFF at ${deal.vendorName}!\n\n${deal.title}\n\nNow just $${deal.discountedPrice.toFixed(2)}!\n\nGet this deal on SmartDealsIQ™: https://smartdealsiq.app/deal/${deal.id}`,
        url: `https://smartdealsiq.app/deal/${deal.id}`,
      });
    },
  },
  {
    id: 'copy',
    name: 'Copy Link',
    icon: 'link',
    color: '#6B7280',
    action: async (deal) => {
      // In a real app, use Clipboard API
      if (__DEV__) console.log('Copied link:', `https://smartdealsiq.app/deal/${deal.id}`);
    },
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'message-circle',
    color: '#25D366',
    action: async (deal) => {
      const message = encodeURIComponent(
        `🔥 ${deal.discount} OFF at ${deal.vendorName}!\n\n${deal.title}\n\nGet it now: https://smartdealsiq.app/deal/${deal.id}`
      );
      await Linking.openURL(`whatsapp://send?text=${message}`);
    },
  },
  {
    id: 'twitter',
    name: 'X',
    icon: 'twitter',
    color: '#000',
    action: async (deal) => {
      const text = encodeURIComponent(
        `🔥 Just found ${deal.discount} OFF at ${deal.vendorName}! ${deal.title}`
      );
      const url = encodeURIComponent(`https://smartdealsiq.app/deal/${deal.id}`);
      await Linking.openURL(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
    },
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    action: async (deal) => {
      const url = encodeURIComponent(`https://smartdealsiq.app/deal/${deal.id}`);
      await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
    },
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: 'message-square',
    color: '#34C759',
    action: async (deal) => {
      const message = encodeURIComponent(
        `🔥 Check out this deal: ${deal.discount} OFF at ${deal.vendorName}! https://smartdealsiq.app/deal/${deal.id}`
      );
      await Linking.openURL(`sms:?body=${message}`);
    },
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ShareButton({
  option,
  index,
  onPress,
}: {
  option: ShareOption;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
    iconScale.value = withSpring(1.1);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    iconScale.value = withSpring(1);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Success animation
    iconScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    onPress();
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.shareButton, buttonStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[styles.shareIconContainer, { backgroundColor: option.color }, iconStyle]}
      >
        <Feather name={option.icon as any} size={24} color="#fff" />
      </Animated.View>
      <ThemedText style={styles.shareButtonText}>{option.name}</ThemedText>
    </AnimatedPressable>
  );
}

export function SocialShareButton({ deal, onShare }: SocialShareProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [shareCount, setShareCount] = useState(23); // Mock share count
  const buttonScale = useSharedValue(1);

  const handleOpen = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalVisible(true);
  };

  const handleShare = async (option: ShareOption) => {
    try {
      await option.action(deal);
      onShare?.(option.id);
      setShareCount(prev => prev + 1);

      // Close modal after short delay
      setTimeout(() => setModalVisible(false), 500);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <>
      <AnimatedPressable
        style={[styles.triggerButton, buttonStyle]}
        onPress={handleOpen}
        onPressIn={() => { buttonScale.value = withSpring(0.95); }}
        onPressOut={() => { buttonScale.value = withSpring(1); }}
      >
        <Feather name="share-2" size={18} color={Colors.primary} />
        <ThemedText style={styles.triggerText}>Share</ThemedText>
        <View style={styles.shareCountBadge}>
          <ThemedText style={styles.shareCountText}>{shareCount}</ThemedText>
        </View>
      </AnimatedPressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <ThemedText style={styles.modalTitle}>Share this deal</ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                Earn 15 points for every friend who claims!
              </ThemedText>
            </View>

            {/* Deal preview */}
            <View style={styles.dealPreview}>
              <View style={styles.dealPreviewBadge}>
                <ThemedText style={styles.dealPreviewDiscount}>{deal.discount}</ThemedText>
              </View>
              <View style={styles.dealPreviewInfo}>
                <ThemedText style={styles.dealPreviewVendor}>{deal.vendorName}</ThemedText>
                <ThemedText style={styles.dealPreviewTitle} numberOfLines={1}>
                  {deal.title}
                </ThemedText>
              </View>
            </View>

            {/* Share options grid */}
            <View style={styles.shareGrid}>
              {SHARE_OPTIONS.map((option, index) => (
                <ShareButton
                  key={option.id}
                  option={option}
                  index={index}
                  onPress={() => handleShare(option)}
                />
              ))}
            </View>

            {/* Social proof */}
            <View style={styles.socialProofContainer}>
              <Feather name="users" size={14} color={Colors.textSecondary} />
              <ThemedText style={styles.socialProofText}>
                {shareCount} people shared this deal
              </ThemedText>
            </View>

            {/* Cancel button */}
            <Pressable
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// Quick share button for inline use
export function QuickShareButton({ deal, onShare }: SocialShareProps) {
  const scale = useSharedValue(1);

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    scale.value = withSequence(
      withSpring(0.9),
      withSpring(1.1),
      withSpring(1)
    );

    try {
      await Share.share({
        title: deal.title,
        message: `🔥 ${deal.discount} OFF at ${deal.vendorName}! ${deal.title} - Get it on SmartDealsIQ™!`,
        url: `https://smartdealsiq.app/deal/${deal.id}`,
      });
      onShare?.('native');
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable style={[styles.quickShareButton, buttonStyle]} onPress={handleShare}>
      <Feather name="share-2" size={20} color="#fff" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  shareCountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  shareCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.success,
  },
  dealPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  dealPreviewBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dealPreviewDiscount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  dealPreviewInfo: {
    flex: 1,
  },
  dealPreviewVendor: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dealPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  shareButton: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareButtonText: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  socialProofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  socialProofText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quickShareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: `0px 4px 8px rgba(255, 107, 53, 0.3)` }
      : {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }),
  },
});
