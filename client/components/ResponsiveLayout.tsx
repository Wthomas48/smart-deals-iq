import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { usePlatform, useGridColumns } from '@/hooks/usePlatform';
import { Colors } from '@/constants/Colors';

interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

// Main responsive layout with optional sidebar for desktop
export function ResponsiveLayout({ children, sidebar, header, footer }: ResponsiveLayoutProps) {
  const { isDesktopSize, isTabletSize } = usePlatform();
  const showSidebar = isDesktopSize && sidebar;

  return (
    <View style={styles.container}>
      {/* Header - spans full width */}
      {header && <View style={styles.header}>{header}</View>}

      <View style={styles.mainArea}>
        {/* Sidebar for desktop */}
        {showSidebar && (
          <View style={styles.sidebar}>
            <ScrollView
              style={styles.sidebarScroll}
              showsVerticalScrollIndicator={false}
            >
              {sidebar}
            </ScrollView>
          </View>
        )}

        {/* Main content area */}
        <View style={showSidebar ? [styles.content, styles.contentWithSidebar] : styles.content}>
          {children}
        </View>
      </View>

      {/* Footer */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

// Responsive grid for cards
interface ResponsiveGridProps {
  children: ReactNode[];
  gap?: number;
  minItemWidth?: number;
}

export function ResponsiveGrid({ children, gap = 16, minItemWidth = 300 }: ResponsiveGridProps) {
  const { screenWidth, isDesktopSize, isTabletSize } = usePlatform();

  // Calculate columns based on screen width and minimum item width
  const availableWidth = screenWidth - 32; // padding
  const columns = Math.max(1, Math.floor(availableWidth / minItemWidth));
  const itemWidth = (availableWidth - gap * (columns - 1)) / columns;

  return (
    <View style={[styles.grid, { gap }]}>
      {children.map((child, index) => (
        <View key={index} style={{ width: itemWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
}

// Responsive container that constrains max width on large screens
interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: number;
  padding?: number;
}

export function ResponsiveContainer({
  children,
  maxWidth = 1200,
  padding = 16,
}: ResponsiveContainerProps) {
  const { isDesktopSize, screenWidth } = usePlatform();

  return (
    <View
      style={[
        styles.responsiveContainer,
        {
          maxWidth: isDesktopSize ? maxWidth : '100%',
          paddingHorizontal: isDesktopSize ? 32 : padding,
          alignSelf: 'center',
          width: '100%',
        },
      ]}
    >
      {children}
    </View>
  );
}

// Split view for tablet/desktop - side by side content
interface SplitViewProps {
  primary: ReactNode;
  secondary: ReactNode;
  ratio?: number; // 0-1, primary content ratio
}

export function SplitView({ primary, secondary, ratio = 0.6 }: SplitViewProps) {
  const { isDesktopSize, isTabletSize, isMobileSize } = usePlatform();

  if (isMobileSize) {
    // Stack on mobile
    return (
      <View style={styles.splitMobile}>
        {primary}
        {secondary}
      </View>
    );
  }

  return (
    <View style={styles.splitContainer}>
      <View style={[styles.splitPrimary, { flex: ratio }]}>{primary}</View>
      <View style={[styles.splitSecondary, { flex: 1 - ratio }]}>{secondary}</View>
    </View>
  );
}

// Card grid specifically for deal cards
interface DealCardGridProps {
  children: ReactNode[];
}

export function DealCardGrid({ children }: DealCardGridProps) {
  const columns = useGridColumns();
  const { screenWidth } = usePlatform();
  const gap = 16;
  const padding = 16;

  const availableWidth = screenWidth - padding * 2;
  const itemWidth = (availableWidth - gap * (columns - 1)) / columns;

  return (
    <View style={[styles.dealGrid, { gap }]}>
      {children.map((child, index) => (
        <View key={index} style={{ width: itemWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
}

// Desktop-only wrapper
export function DesktopOnly({ children }: { children: ReactNode }) {
  const { isDesktopSize } = usePlatform();
  if (!isDesktopSize) return null;
  return <>{children}</>;
}

// Mobile-only wrapper
export function MobileOnly({ children }: { children: ReactNode }) {
  const { isMobileSize } = usePlatform();
  if (!isMobileSize) return null;
  return <>{children}</>;
}

// Tablet and up wrapper
export function TabletUp({ children }: { children: ReactNode }) {
  const { isMobileSize } = usePlatform();
  if (isMobileSize) return null;
  return <>{children}</>;
}

// Responsive text size hook
export function useResponsiveTextSize() {
  const { isDesktopSize, isTabletSize } = usePlatform();

  return {
    h1: isDesktopSize ? 40 : isTabletSize ? 36 : 32,
    h2: isDesktopSize ? 32 : isTabletSize ? 28 : 24,
    h3: isDesktopSize ? 24 : isTabletSize ? 22 : 20,
    body: isDesktopSize ? 18 : 16,
    small: isDesktopSize ? 15 : 14,
    caption: isDesktopSize ? 13 : 12,
  };
}

// Responsive spacing hook
export function useResponsiveSpacing() {
  const { isDesktopSize, isTabletSize } = usePlatform();

  const multiplier = isDesktopSize ? 1.5 : isTabletSize ? 1.25 : 1;

  return {
    xs: 4 * multiplier,
    sm: 8 * multiplier,
    md: 12 * multiplier,
    lg: 16 * multiplier,
    xl: 20 * multiplier,
    xxl: 24 * multiplier,
    xxxl: 32 * multiplier,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: Colors.dark.card,
    borderRightWidth: 1,
    borderRightColor: Colors.dark.border,
  },
  sidebarScroll: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentWithSidebar: {
    marginLeft: 0,
  },
  footer: {
    backgroundColor: Colors.dark.card,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  responsiveContainer: {},
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  splitMobile: {
    flex: 1,
  },
  splitPrimary: {
    borderRightWidth: 1,
    borderRightColor: Colors.dark.border,
  },
  splitSecondary: {},
  dealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
});
