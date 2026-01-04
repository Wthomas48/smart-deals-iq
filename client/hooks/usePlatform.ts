import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

type PlatformType = 'ios' | 'android' | 'web' | 'desktop' | 'unknown';
type DeviceType = 'phone' | 'tablet' | 'desktop';

interface PlatformInfo {
  platform: PlatformType;
  device: DeviceType;
  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isElectron: boolean;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
  isLandscape: boolean;
  // Responsive breakpoints
  isMobileSize: boolean;
  isTabletSize: boolean;
  isDesktopSize: boolean;
  isLargeDesktop: boolean;
}

// Check if running in Electron
const checkElectron = (): boolean => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron;
  }
  return false;
};

// Determine device type based on screen size
const getDeviceType = (width: number, height: number): DeviceType => {
  const minDimension = Math.min(width, height);
  if (minDimension >= 900) return 'desktop';
  if (minDimension >= 600) return 'tablet';
  return 'phone';
};

export function usePlatform(): PlatformInfo {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [isElectron] = useState(checkElectron);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const device = getDeviceType(width, height);
  const isWeb = Platform.OS === 'web';

  // Determine platform
  let platform: PlatformType = 'unknown';
  if (isElectron) {
    platform = 'desktop';
  } else if (Platform.OS === 'ios') {
    platform = 'ios';
  } else if (Platform.OS === 'android') {
    platform = 'android';
  } else if (isWeb) {
    platform = 'web';
  }

  return {
    platform,
    device,
    isDesktop: device === 'desktop' || isElectron,
    isMobile: device === 'phone',
    isTablet: device === 'tablet',
    isElectron,
    isWeb,
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    screenWidth: width,
    screenHeight: height,
    isLandscape: width > height,
    // Responsive breakpoints
    isMobileSize: width < 640,
    isTabletSize: width >= 640 && width < 1024,
    isDesktopSize: width >= 1024,
    isLargeDesktop: width >= 1440,
  };
}

// Responsive value helper
export function useResponsiveValue<T>(mobile: T, tablet: T, desktop: T): T {
  const { isMobileSize, isTabletSize } = usePlatform();
  if (isMobileSize) return mobile;
  if (isTabletSize) return tablet;
  return desktop;
}

// Grid columns helper for responsive layouts
export function useGridColumns(): number {
  const { screenWidth } = usePlatform();
  if (screenWidth < 640) return 1;
  if (screenWidth < 1024) return 2;
  if (screenWidth < 1440) return 3;
  return 4;
}
