import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useEcomGuardStore } from '../../store/useEcomGuardStore';
import { useApi } from '../../hooks/useApi';
import AgentStatusBadge from '../../components/AgentStatusBadge';
import MetricCard from '../../components/MetricCard';
import HealthSourceCard from '../../components/HealthSourceCard';
import { theme } from '../../constants/theme';

export default function Dashboard() {
  const {
    isConnected,
    apiStatus,
    sseStatus,
    errorMessage,
    agentStatus,
    reviews,
    dataSources,
    contradictions,
    proposedActions,
  } = useEcomGuardStore();
  const { fetchState, resetSystem, triggerInvestigation } = useApi();

  useEffect(() => {
    console.log('[Dashboard] Connection state:', { isConnected, apiStatus, sseStatus, errorMessage });
    console.log('[Dashboard] Calling fetchState...');
    fetchState();
  }, [fetchState]);

  const totalReviews = reviews.length;
  const genuineReviews = reviews.filter(r => r.classification === 'genuine').length;
  const pendingActions = proposedActions.filter(a => a.status === 'pending').length;
  const noiseReviews = reviews.filter(
    r => r.classification && r.classification !== 'genuine' && r.classification !== 'unclassified'
  ).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>EG</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headerSubtitle}>TechMart PK · Crisis Monitor</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={resetSystem}>
          <Text style={styles.resetIcon}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Banner */}
      <View style={[
        styles.connectionBanner,
        { backgroundColor: isConnected ? theme.colors.successSurface : theme.colors.dangerSurface }
      ]}>
        <View style={[
          styles.connDot,
          { backgroundColor: isConnected ? theme.colors.success : theme.colors.danger }
        ]} />
        <Text style={[
          styles.connText,
          { color: isConnected ? theme.colors.success : theme.colors.danger }
        ]}>
          {isConnected
            ? `Live · REST ${apiStatus.toUpperCase()} · SSE ${sseStatus.toUpperCase()}`
            : 'Disconnected — Check backend connection'}
        </Text>
      </View>

      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorText} numberOfLines={2}>{errorMessage}</Text>
        </View>
      )}

      {/* Debug Panel */}

      {/* Hero Card — Agent Status */}
      <View style={styles.heroCard}>
        <View style={styles.heroCardTop}>
          <View>
            <Text style={styles.heroLabel}>ACTIVE INVESTIGATION</Text>
            <Text style={styles.heroProduct}>CBL-047 · Batch B2024-11</Text>
            <Text style={styles.heroSubProduct}>USB-C Fast Charging Cable</Text>
          </View>
          <View style={styles.heroIconBox}>
            <Text style={styles.heroIcon}>🛡</Text>
          </View>
        </View>
        <View style={styles.heroCardBottom}>
          <AgentStatusBadge status={agentStatus} />
          {(agentStatus === 'idle' || agentStatus === 'monitoring') && (
            <TouchableOpacity style={styles.investigateBtn} onPress={triggerInvestigation}>
              <Text style={styles.investigateBtnText}>Force Investigate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Metrics Grid */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Reviews"
          value={totalReviews}
          icon="📋"
          color={theme.colors.primary}
          subtitle="ingested"
        />
        <MetricCard
          title="Genuine"
          value={genuineReviews}
          icon="🔥"
          color={genuineReviews > 0 ? theme.colors.warning : theme.colors.success}
          trend={genuineReviews > 0 ? 'up' : 'neutral'}
          subtitle="signals"
        />
        <MetricCard
          title="Conflicts"
          value={contradictions.length}
          icon="⚡"
          color={contradictions.length > 0 ? theme.colors.danger : theme.colors.neutral}
          subtitle="found"
        />
        <MetricCard
          title="Actions"
          value={pendingActions}
          icon="✅"
          color={pendingActions > 0 ? theme.colors.primary : theme.colors.neutral}
          subtitle="pending"
        />
      </View>

      {/* Data Sources */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <View style={[styles.badge, { backgroundColor: theme.colors.successMuted }]}>
          <Text style={[styles.badgeText, { color: theme.colors.success }]}>5 ACTIVE</Text>
        </View>
      </View>
      <View style={styles.sourcesGrid}>
        {dataSources.map(source => (
          <HealthSourceCard key={source.id} source={source} />
        ))}
      </View>

      {/* Bottom padding */}
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    ...(Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center', width: '100%' } : {}),
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  resetIcon: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },

  // Connection
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  connText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.dangerSurface,
    borderWidth: 1,
    borderColor: theme.colors.danger + '30',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
    color: theme.colors.danger,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Hero Card
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.md,
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroProduct: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSubProduct: {
    fontSize: theme.typography.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 22,
  },
  heroCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  investigateBtn: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  investigateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
    letterSpacing: 0.3,
  },

  // Metrics
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
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
    letterSpacing: 0.8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  sourcesGrid: {
    gap: 8,
  },
});
