import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { useEcomGuardStore } from '../../store/useEcomGuardStore';
import { useApi } from '../../hooks/useApi';
import ActionCard from '../../components/ActionCard';
import { theme } from '../../constants/theme';

export default function Actions() {
  const { proposedActions, agentStatus } = useEcomGuardStore();
  const { approveAllActions, executeActions } = useApi();

  const pendingCount = proposedActions.filter(a => a.status === 'pending').length;
  const approvedCount = proposedActions.filter(a => a.status === 'approved').length;
  const readyToExecute = proposedActions.length > 0 &&
    proposedActions.every(a => a.status === 'approved' || a.status === 'rejected') &&
    proposedActions.some(a => a.status === 'approved');

  const isExecuting = agentStatus === 'executing';

  const handleApproveAll = () => {
    if (Platform.OS === 'web') {
      if (confirm('Approve all pending actions?')) approveAllActions();
    } else {
      Alert.alert('Approve All', 'Approve all pending actions?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve All', onPress: approveAllActions },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Action Center</Text>
          <Text style={styles.subtitle}>
            {pendingCount > 0
              ? `${pendingCount} actions require approval`
              : approvedCount > 0
              ? `${approvedCount} actions approved`
              : 'Review and execute approved actions'}
          </Text>
        </View>

        {pendingCount > 0 && (
          <TouchableOpacity style={styles.approveAllBtn} onPress={handleApproveAll}>
            <Text style={styles.btnText}>✓ Approve All</Text>
          </TouchableOpacity>
        )}

        {readyToExecute && !isExecuting && (
          <TouchableOpacity style={styles.executeBtn} onPress={executeActions}>
            <Text style={styles.btnText}>▶ Execute</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {proposedActions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>No actions proposed</Text>
            <Text style={styles.emptySubtext}>Agent will propose actions if a crisis is detected</Text>
          </View>
        ) : (
          proposedActions.map(action => <ActionCard key={action.id} action={action} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 8,
    ...theme.shadow.sm,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  approveAllBtn: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.round,
    ...theme.shadow.sm,
  },
  executeBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.round,
    ...theme.shadow.sm,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
    letterSpacing: 0.3,
  },
  list: {
    padding: theme.spacing.md,
    ...(Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center', width: '100%' } : {}),
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});
