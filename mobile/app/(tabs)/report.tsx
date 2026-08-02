import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import { useEcomGuardStore } from '../../store/useEcomGuardStore';
import { theme } from '../../constants/theme';

export default function Report() {
  const { outcomeReport } = useEcomGuardStore();

  if (!outcomeReport) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Outcome Report Yet</Text>
        <Text style={styles.emptySubtext}>
          The report will be generated after actions are executed.
        </Text>
      </View>
    );
  }

  const { metrics, baseline_comparison, rollback_condition, outstanding_items, actions_summary } = outcomeReport;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.success} />

      {/* Hero Header */}
      <View style={styles.heroBox}>
        <View style={styles.heroIconBox}>
          <Text style={styles.heroIconText}>✓</Text>
        </View>
        <Text style={styles.heroLabel}>INCIDENT RESOLVED</Text>
        <Text style={styles.heroTitle}>{outcomeReport.crisis_summary}</Text>
        <Text style={styles.heroDate}>
          {new Date(outcomeReport.generated_at).toLocaleString()}
        </Text>
      </View>

      {/* Execution Summary */}
      <Text style={styles.sectionTitle}>Execution Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{actions_summary.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>{actions_summary.successful}</Text>
            <Text style={styles.summaryLabel}>Successful</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>{actions_summary.escalated}</Text>
            <Text style={styles.summaryLabel}>Escalated</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>{actions_summary.failed}</Text>
            <Text style={styles.summaryLabel}>Failed</Text>
          </View>
        </View>
      </View>

      {/* Before/After Metrics */}
      <Text style={styles.sectionTitle}>Before & After</Text>
      {Object.entries(metrics).map(([key, data]) => (
        <View key={key} style={styles.metricCard}>
          <Text style={styles.metricTitle}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.halfCol}>
              <Text style={styles.colLabel}>BEFORE</Text>
              <Text style={styles.valueBefore}>{data.before}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.halfCol}>
              <Text style={styles.colLabel}>AFTER</Text>
              <Text style={styles.valueAfter}>{data.after}</Text>
            </View>
          </View>
          <View style={styles.improvementBar}>
            <Text style={styles.improvementIcon}>✓</Text>
            <Text style={styles.improvementText}>{data.improvement}</Text>
          </View>
        </View>
      ))}

      {/* Baseline Comparison */}
      <Text style={styles.sectionTitle}>Agent vs. Traditional</Text>
      <View style={styles.baselineCard}>
        <View style={styles.baselineRow}>
          <Text style={styles.baselineLabel}>EcomGuard Detection</Text>
          <Text style={styles.baselineValue}>{baseline_comparison.ecomguard_detection}</Text>
        </View>
        <View style={styles.baselineRow}>
          <Text style={styles.baselineLabel}>Simple Threshold</Text>
          <Text style={styles.baselineValue}>{baseline_comparison.simple_threshold_detection}</Text>
        </View>
        <View style={styles.advantageBox}>
          <Text style={styles.advantageText}>⚡ {baseline_comparison.time_advantage}</Text>
          <Text style={styles.advantageText}>⚡ {baseline_comparison.quality_advantage}</Text>
        </View>
      </View>

      {/* Rollback */}
      <Text style={styles.sectionTitle}>Rollback Conditions</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          <Text style={{ fontWeight: '700', color: theme.colors.warning }}>Trigger: </Text>
          {rollback_condition.trigger}
        </Text>
        <Text style={[styles.cardText, { marginTop: 8 }]}>
          <Text style={{ fontWeight: '700', color: theme.colors.textSecondary }}>Observable event: </Text>
          {rollback_condition.observable_event}
        </Text>
        <Text style={[styles.cardText, { marginTop: 8 }]}>
          <Text style={{ fontWeight: '700', color: theme.colors.success }}>Restore: </Text>
          {rollback_condition.restore_action}
        </Text>
      </View>

      {/* Incident Report (FR-035) */}
      {outcomeReport.incident_report ? (
        <>
          <Text style={styles.sectionTitle}>Incident Report</Text>
          <View style={styles.card}>
            <Text style={styles.incidentText}>{outcomeReport.incident_report}</Text>
          </View>
        </>
      ) : null}

      {/* Outstanding Items */}
      <Text style={styles.sectionTitle}>Outstanding Items</Text>
      <View style={styles.card}>
        {outstanding_items.map((item, idx) => (
          <View key={idx} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    ...(Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center', width: '100%' } : {}),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  heroBox: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.md,
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  heroIconText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#fff',
    fontSize: theme.typography.sizes.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroDate: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: theme.typography.sizes.xs,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.3,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '800',
    color: theme.colors.text,
  },
  summaryLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    ...theme.shadow.sm,
  },
  metricTitle: {
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surfaceHighlight,
    letterSpacing: 0.5,
  },
  comparisonRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  colLabel: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  valueBefore: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.danger,
    lineHeight: 20,
  },
  valueAfter: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.success,
    fontWeight: '600',
    lineHeight: 20,
  },
  improvementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successSurface,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  improvementIcon: {
    color: theme.colors.success,
    fontWeight: '700',
    marginRight: 8,
  },
  improvementText: {
    color: theme.colors.success,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  baselineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  baselineRow: {
    marginBottom: theme.spacing.sm,
  },
  baselineLabel: {
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  baselineValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  advantageBox: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  advantageText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  cardText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  incidentText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: theme.typography.sizes.md,
    marginRight: 8,
    marginTop: -1,
  },
  listText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
