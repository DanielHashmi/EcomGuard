import React, { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, StatusBar } from 'react-native';
import { useEcomGuardStore } from '../../store/useEcomGuardStore';
import ReasoningEntryCard from '../../components/ReasoningEntryCard';
import ContradictionPanel from '../../components/ContradictionPanel';
import { theme } from '../../constants/theme';

export default function Reasoning() {
  const { reasoningLog, contradictions, errorMessage } = useEcomGuardStore();
  const flatListRef = useRef<FlatList>(null);

  const timelineItems = [
    ...reasoningLog.map(item => ({ type: 'reasoning' as const, data: item, time: new Date(item.timestamp).getTime() })),
    ...contradictions.map(item => ({ type: 'contradiction' as const, data: item, time: new Date(item.discovered_at).getTime() })),
  ].sort((a, b) => a.time - b.time);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

      <View style={styles.header}>
        <Text style={styles.title}>Agent Reasoning Log</Text>
        <Text style={styles.subtitle}>
          {reasoningLog.length > 0
            ? `${reasoningLog.length} entries · ${contradictions.length} contradictions`
            : 'Real-time insight into the autonomous investigation'}
        </Text>
        {errorMessage && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{errorMessage}</Text>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={timelineItems}
        keyExtractor={(_, index) => `timeline-${index}`}
        renderItem={({ item }) => {
          if (item.type === 'contradiction') {
            return <ContradictionPanel contradiction={item.data as any} />;
          }
          return <ReasoningEntryCard entry={item.data as any} />;
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🧠</Text>
            <Text style={styles.emptyTitle}>{errorMessage ? 'Investigation blocked' : 'Agent is idle'}</Text>
            <Text style={styles.emptySubtext}>
              {errorMessage
                ? 'The agent could not produce reasoning because the model provider returned an error.'
                : 'Reasoning log will appear when an investigation begins'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    marginBottom: theme.spacing.xs,
  },
  banner: {
    backgroundColor: theme.colors.primarySurface,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  bannerText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
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
