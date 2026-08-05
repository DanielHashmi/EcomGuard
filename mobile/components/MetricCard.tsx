import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  subtitle?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  trend,
  color = theme.colors.primary,
  subtitle,
}: MetricCardProps) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  const trendColor = trend === 'up' ? theme.colors.danger : trend === 'down' ? theme.colors.success : theme.colors.neutral;

  // Derive background from color
  const bgColor = color + '10';

  return (
    <View style={[styles.card, { width: '47%' }]}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <View style={styles.footer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {trend && trend !== 'neutral' && (
          <Text style={[styles.trend, { color: trendColor }]}>{trendIcon}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  value: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  trend: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '700',
    marginLeft: 'auto',
  },
});
