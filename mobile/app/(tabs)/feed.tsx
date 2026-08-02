import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import { useEcomGuardStore } from '../../store/useEcomGuardStore';
import { useApi } from '../../hooks/useApi';
import ReviewCard from '../../components/ReviewCard';
import ComplaintVelocityChart from '../../components/ComplaintVelocityChart';
import { theme } from '../../constants/theme';

export default function Feed() {
  const { reviews, errorMessage, isConnected } = useEcomGuardStore();
  const { startAutoStream, addReview } = useApi();
  const [filter, setFilter] = useState<'all' | 'genuine' | 'noise'>('all');
  const [draft, setDraft] = useState('');
  const [draftRating, setDraftRating] = useState(1);

  const filteredReviews = reviews.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'genuine') return r.classification === 'genuine';
    if (filter === 'noise') return r.classification && r.classification !== 'genuine' && r.classification !== 'unclassified';
    return true;
  });

  const genuineCount = reviews.filter(r => r.classification === 'genuine').length;
  const noiseCount = reviews.filter(r => r.classification && r.classification !== 'genuine' && r.classification !== 'unclassified').length;

  const submitDraft = () => {
    const text = draft.trim();
    if (!text) return;
    addReview(text, draftRating, 'Manager');
    setDraft('');
    setDraftRating(1);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Live Feedback Stream</Text>
            <View style={styles.statusRow}>
              <View style={[styles.connDot, { backgroundColor: isConnected ? theme.colors.success : theme.colors.danger }]} />
              <Text style={styles.subtitle}>{reviews.length} reports ingested</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.streamBtn} onPress={startAutoStream}>
            <Text style={styles.streamBtnText}>▶ Auto-Stream</Text>
          </TouchableOpacity>
        </View>

        {/* Manual add (US-02) */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a customer review…"
            placeholderTextColor={theme.colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitDraft}
            returnKeyType="send"
          />
          <View style={styles.ratingPicker}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setDraftRating(n)} hitSlop={6}>
                <Text style={[styles.star, n <= draftRating && styles.starOn]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={submitDraft}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Error/Success Banner */}
        {errorMessage && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['all', 'genuine', 'noise'] as const).map(f => {
            const count = f === 'all' ? reviews.length : f === 'genuine' ? genuineCount : noiseCount;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={[...filteredReviews].reverse()}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListHeaderComponent={<View style={styles.chartWrap}><ComplaintVelocityChart /></View>}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>Tap Auto-Stream or add one above to start</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  connDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  banner: {
    backgroundColor: theme.colors.primarySurface,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  bannerText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
  },
  streamBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.round,
    ...theme.shadow.sm,
  },
  streamBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
    letterSpacing: 0.3,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  ratingPicker: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    color: theme.colors.border,
    paddingHorizontal: 1,
  },
  starOn: {
    color: theme.colors.warning,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.md,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
  },
  chartWrap: {
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary + '30',
  },
  filterText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  filterTextActive: {
    color: theme.colors.primary,
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
  },
});
