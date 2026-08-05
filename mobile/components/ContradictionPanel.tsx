import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Contradiction } from '../types';
import { theme } from '../constants/theme';

export default function ContradictionPanel({ contradiction }: { contradiction: Contradiction }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>⚠️</Text>
        </View>
        <Text style={styles.title}>Data Contradiction</Text>
      </View>

      <Text style={styles.metric}>{contradiction.metric_name}</Text>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Sources</Text>
        <Text style={styles.value}>{contradiction.sources_involved}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Conflict</Text>
        <Text style={styles.value}>{contradiction.values_found}</Text>
      </View>

      <View style={styles.resolutionBox}>
        <Text style={styles.resTitle}>Agent Resolution</Text>
        <Text style={styles.resText}>
          <Text style={{ fontWeight: '700', color: theme.colors.success }}>Trusting: </Text>
          {contradiction.trusted_source} ({contradiction.trusted_value})
        </Text>
        <Text style={styles.resReasoning}>{contradiction.reasoning}</Text>
      </View>

      {contradiction.recommendation ? (
        <View style={styles.recBox}>
          <Text style={styles.recTitle}>⚡ Action Required</Text>
          <Text style={styles.recText}>{contradiction.recommendation}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.danger + '30',
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
  },
  title: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metric: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 70,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  value: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  resolutionBox: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  resReasoning: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  recBox: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.warningSurface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning + '20',
  },
  recTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.warning,
    marginBottom: 2,
  },
  recText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
});
