import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AgentStatus } from '../types';
import { theme } from '../constants/theme';

export default function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return { color: theme.colors.neutral, bg: theme.colors.neutralMuted, label: 'Idle' };
      case 'monitoring':
        return { color: theme.colors.success, bg: theme.colors.successMuted, label: 'Monitoring' };
      case 'investigating':
        return { color: theme.colors.warning, bg: theme.colors.warningMuted, label: 'Investigating' };
      case 'awaiting_approval':
        return { color: theme.colors.danger, bg: theme.colors.dangerMuted, label: 'Approval Required' };
      case 'executing':
        return { color: theme.colors.primary, bg: theme.colors.primaryMuted, label: 'Executing' };
      case 'resolved':
        return { color: theme.colors.success, bg: theme.colors.successMuted, label: 'Resolved' };
      default:
        return { color: theme.colors.neutral, bg: theme.colors.neutralMuted, label: 'Unknown' };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.round,
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
