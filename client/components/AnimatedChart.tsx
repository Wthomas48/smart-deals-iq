import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DataPoint {
  label: string;
  value: number;
}

interface AnimatedChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  showLabels?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  color?: string;
  gradientColors?: [string, string];
  animated?: boolean;
  type?: 'line' | 'bar' | 'area';
}

export function AnimatedChart({
  data,
  height = 200,
  width: propWidth,
  showLabels = true,
  showDots = true,
  showGrid = true,
  color = Colors.primary,
  gradientColors = [Colors.primary, 'transparent'],
  animated = true,
  type = 'area',
}: AnimatedChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || screenWidth - 48;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = 1;
    }
  }, [data]);

  const { path, areaPath, minValue, maxValue, points } = useMemo(() => {
    if (data.length === 0) return { path: '', areaPath: '', minValue: 0, maxValue: 0, points: [] };

    const values = data.map(d => d.value);
    const min = Math.min(...values) * 0.9;
    const max = Math.max(...values) * 1.1;

    const padding = { top: 20, right: 20, bottom: 40, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xStep = chartWidth / (data.length - 1);

    const pts = data.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + chartHeight - ((d.value - min) / (max - min)) * chartHeight,
      label: d.label,
      value: d.value,
    }));

    // Create smooth curve using cubic bezier
    let linePath = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = pts[i].x + xStep / 3;
      const cp1y = pts[i].y;
      const cp2x = pts[i + 1].x - xStep / 3;
      const cp2y = pts[i + 1].y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }

    // Area path (closes back to bottom)
    const area = `${linePath} L ${pts[pts.length - 1].x} ${height - padding.bottom} L ${pts[0].x} ${height - padding.bottom} Z`;

    return { path: linePath, areaPath: area, minValue: min, maxValue: max, points: pts };
  }, [data, width, height]);

  return (
    <View style={[styles.container, { height, width }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradientColors[0]} stopOpacity={0.4} />
            <Stop offset="1" stopColor={gradientColors[1]} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {showGrid && (
          <G>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Line
                key={i}
                x1={10}
                y1={20 + ratio * (height - 60)}
                x2={width - 20}
                y2={20 + ratio * (height - 60)}
                stroke={Colors.dark.border}
                strokeWidth={1}
                strokeDasharray="4,4"
                opacity={0.3}
              />
            ))}
          </G>
        )}

        {/* Area fill */}
        {type === 'area' && areaPath && (
          <AnimatedPath d={areaPath} fill="url(#gradient)" />
        )}

        {/* Line */}
        {path && (
          <AnimatedPath
            d={path}
            stroke={color}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {showDots && points.map((point, i) => (
          <G key={i}>
            {/* Outer glow */}
            <AnimatedCircle
              cx={point.x}
              cy={point.y}
              r={8}
              fill={color}
              opacity={0.2}
            />
            {/* Inner dot */}
            <AnimatedCircle
              cx={point.x}
              cy={point.y}
              r={5}
              fill={Colors.dark.card}
              stroke={color}
              strokeWidth={2}
            />
          </G>
        ))}

        {/* Labels */}
        {showLabels && points.map((point, i) => (
          <SvgText
            key={`label-${i}`}
            x={point.x}
            y={height - 10}
            fill={Colors.textSecondary}
            fontSize={10}
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

// Bar Chart Component
interface BarChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  color?: string;
  showValues?: boolean;
}

export function AnimatedBarChart({
  data,
  height = 200,
  width: propWidth,
  color = Colors.primary,
  showValues = true,
}: BarChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || screenWidth - 48;

  const maxValue = Math.max(...data.map(d => d.value)) * 1.1;
  const barWidth = (width - 40) / data.length - 8;

  return (
    <View style={[styles.barContainer, { height, width }]}>
      <View style={styles.barsWrapper}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 60);
          const animValue = useSharedValue(0);

          useEffect(() => {
            animValue.value = withDelay(
              index * 100,
              withSpring(1, { damping: 12 })
            );
          }, []);

          const barStyle = useAnimatedStyle(() => ({
            height: barHeight * animValue.value,
            transform: [{ scaleY: animValue.value }],
          }));

          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barValueContainer}>
                {showValues && (
                  <ThemedText style={styles.barValue}>
                    {item.value.toLocaleString()}
                  </ThemedText>
                )}
              </View>
              <Animated.View
                style={[
                  styles.bar,
                  { width: barWidth, backgroundColor: color },
                  barStyle,
                ]}
              />
              <ThemedText style={styles.barLabel}>{item.label}</ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Donut Chart Component
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function AnimatedDonutChart({
  data,
  size = 200,
  strokeWidth = 24,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let accumulatedOffset = 0;

  return (
    <View style={[styles.donutContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.dark.border}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Data segments */}
        {data.map((item, index) => {
          const percentage = item.value / total;
          const strokeLength = circumference * percentage;
          const offset = accumulatedOffset;
          accumulatedOffset += strokeLength;

          const animValue = useSharedValue(0);

          useEffect(() => {
            animValue.value = withDelay(
              index * 200,
              withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
            );
          }, []);

          const animatedProps = useAnimatedProps(() => ({
            strokeDashoffset: circumference - strokeLength * animValue.value + offset,
          }));

          return (
            <AnimatedCircle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>

      {/* Center content */}
      {(centerLabel || centerValue) && (
        <View style={styles.donutCenter}>
          {centerValue && (
            <ThemedText style={styles.donutCenterValue}>{centerValue}</ThemedText>
          )}
          {centerLabel && (
            <ThemedText style={styles.donutCenterLabel}>{centerLabel}</ThemedText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  barContainer: {
    paddingVertical: 20,
  },
  barsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
    paddingHorizontal: 20,
  },
  barColumn: {
    alignItems: 'center',
  },
  barValueContainer: {
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  bar: {
    borderRadius: 6,
    transformOrigin: 'bottom',
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  donutContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutCenterValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  donutCenterLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
