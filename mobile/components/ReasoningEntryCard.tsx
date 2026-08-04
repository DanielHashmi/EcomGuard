import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReasoningEntry } from '../types';
import { theme } from '../constants/theme';

export default function ReasoningEntryCard({ entry }: { entry: ReasoningEntry }) {
  const category = entry.category || 'observation';
  const message = entry.message || '';
  const timestamp = entry.timestamp || new Date().toISOString();

  const getConfig = () => {
    switch (category) {
      case 'observation': return { icon: '👁', color: theme.colors.textSecondary, bg: theme.colors.neutralMuted };
      case 'question': return { icon: '❓', color: theme.colors.primary, bg: theme.colors.primaryMuted };
      case 'discovery': return { icon: '💡', color: theme.colors.success, bg: theme.colors.successMuted };
      case 'decision': return { icon: '⚖️', color: theme.colors.warning, bg: theme.colors.warningMuted };
      case 'warning': return { icon: '⚠️', color: theme.colors.danger, bg: theme.colors.dangerMuted };
      default: return { icon: '→', color: theme.colors.text, bg: theme.colors.neutralMuted };
    }
  };

  const config = getConfig();

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <View style={styles.line} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
            <Text style={styles.icon}>{config.icon}</Text>
          </View>
          <Text style={[styles.category, { color: config.color }]}>
            {category.toUpperCase()}
          </Text>
          <Text style={styles.time}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  timeline: {
    width: 20,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 16,
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: theme.colors.border,
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 12,
  },
  category: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  time: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  message: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
