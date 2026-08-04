import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Action } from '../types';
import { theme } from '../constants/theme';
import { useApi } from '../hooks/useApi';

export default function ActionCard({ action }: { action: Action }) {
  const api = useApi();

  const getRiskConfig = () => {
    switch (action.risk_level) {
      case 'low': return { color: theme.colors.success, bg: theme.colors.successMuted };
      case 'medium': return { color: theme.colors.warning, bg: theme.colors.warningMuted };
      case 'high': return { color: theme.colors.danger, bg: theme.colors.dangerMuted };
      case 'critical': return { color: '#E83A3A', bg: 'rgba(232, 58, 58, 0.15)' };
      default: return { color: theme.colors.neutral, bg: theme.colors.neutralMuted };
    }
  };

  const getStatusBadge = () => {
    switch (action.status) {
      case 'pending':
        return <View style={[styles.badge, { backgroundColor: theme.colors.warningMuted }]}><Text style={[styles.badgeText, { color: theme.colors.warning }]}>PENDING</Text></View>;
      case 'approved':
        return <View style={[styles.badge, { backgroundColor: theme.colors.successMuted }]}><Text style={[styles.badgeText, { color: theme.colors.success }]}>APPROVED</Text></View>;
      case 'rejected':
        return <View style={[styles.badge, { backgroundColor: theme.colors.dangerMuted }]}><Text style={[styles.badgeText, { color: theme.colors.danger }]}>REJECTED</Text></View>;
      case 'executing':
        return (
          <View style={[styles.badge, { backgroundColor: theme.colors.primaryMuted, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>EXECUTING</Text>
          </View>
        );
      case 'complete':
        return <View style={[styles.badge, { backgroundColor: theme.colors.success }]}><Text style={[styles.badgeText, { color: '#fff' }]}>DONE</Text></View>;
      case 'escalated':
        return <View style={[styles.badge, { backgroundColor: theme.colors.danger }]}><Text style={[styles.badgeText, { color: '#fff' }]}>ESCALATED</Text></View>;
      default: return null;
    }
  };

  const risk = getRiskConfig();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{action.title}</Text>
        {getStatusBadge()}
      </View>

      <Text style={styles.description}>{action.description}</Text>

      {action.rationale ? (
        <View style={styles.reasonBlock}>
          <Text style={styles.reasonLabel}>WHY</Text>
          <Text style={styles.reasonText}>{action.rationale}</Text>
        </View>
      ) : null}

      {action.tradeoffs ? (
        <View style={styles.reasonBlock}>
          <Text style={styles.reasonLabel}>TRADEOFFS</Text>
          <Text style={styles.reasonText}>{action.tradeoffs}</Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <View style={[styles.metaChip, { backgroundColor: theme.colors.surfaceHighlight }]}>
          <Text style={styles.metaLabel}>Cost</Text>
          <Text style={styles.metaValue}>{action.estimated_cost_pkr > 0 ? `${action.estimated_cost_pkr.toLocaleString()} PKR` : 'Free'}</Text>
        </View>
        <View style={[styles.metaChip, { backgroundColor: risk.bg }]}>
          <Text style={styles.metaLabel}>Risk</Text>
          <Text style={[styles.metaValue, { color: risk.color }]}>{action.risk_level.toUpperCase()}</Text>
        </View>
        <View style={[styles.metaChip, { backgroundColor: theme.colors.surfaceHighlight }]}>
          <Text style={styles.metaLabel}>Urgency</Text>
          <Text style={styles.metaValue}>{action.urgency.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {action.requires_approval === false ? (
        <Text style={styles.autoNote}>✓ Internal action — auto-approved, no sign-off needed</Text>
      ) : null}

      {action.constraint_notes ? (
        <Text style={styles.constraint}>⚡ {action.constraint_notes}</Text>
      ) : null}

      {action.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.btnReject} onPress={() => api.rejectAction(action.id)}>
            <Text style={styles.btnRejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnApprove} onPress={() => api.approveAction(action.id)}>
            <Text style={styles.btnApproveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaLabel: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  metaValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.text,
  },
  constraint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surfaceHighlight,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
  },
  reasonBlock: {
    marginBottom: theme.spacing.sm,
  },
  reasonLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  autoNote: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.success,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  btnReject: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.dangerMuted,
    borderWidth: 1,
    borderColor: theme.colors.danger + '30',
  },
  btnRejectText: {
    color: theme.colors.danger,
    fontWeight: '700',
    fontSize: theme.typography.sizes.sm,
  },
  btnApprove: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primary,
    ...theme.shadow.sm,
  },
  btnApproveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.typography.sizes.sm,
  },
});
