import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataSourceHealth } from '../types';
import { theme } from '../constants/theme';

const SOURCE_ICONS: Record<string, string> = {
  'DS-01': '💬',
  'DS-02': '📊',
  'DS-03': '📋',
  'DS-04': '🏭',
  'DS-05': '📰',
};

export default function HealthSourceCard({ source }: { source: DataSourceHealth }) {
  const getCredConfig = () => {
    if (source.credibility.includes('direct') || source.credibility.includes('internal_transaction')) {
      return { color: theme.colors.success, bg: theme.colors.successMuted, label: 'HIGH' };
    }
    if (source.credibility.includes('internal')) {
      return { color: theme.colors.success, bg: theme.colors.successMuted, label: 'HIGH' };
    }
    if (source.credibility.includes('supplier')) {
      return { color: theme.colors.warning, bg: theme.colors.warningMuted, label: 'MEDIUM' };
    }
    return { color: theme.colors.neutral, bg: theme.colors.neutralMuted, label: 'LOW' };
  };

  const cred = getCredConfig();
  const icon = SOURCE_ICONS[source.id] || '📁';

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.id}>{source.id}</Text>
            <Text style={styles.name}>{source.name}</Text>
          </View>
          <Text style={styles.type}>{source.type}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={[styles.credBadge, { backgroundColor: cred.bg }]}>
          <Text style={[styles.credText, { color: cred.color }]}>{cred.label}</Text>
        </View>
        <View style={styles.statusDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadow.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  id: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '700',
    color: theme.colors.text,
  },
  type: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  credBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
  },
  credText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
});
