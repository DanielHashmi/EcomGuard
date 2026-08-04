import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Review } from '../types';
import { theme } from '../constants/theme';

export default function ReviewCard({ review }: { review: Review }) {
  const getBadgeConfig = () => {
    switch (review.classification) {
      case 'genuine': return { color: theme.colors.success, bg: theme.colors.successMuted, label: 'GENUINE' };
      case 'spam': return { color: theme.colors.danger, bg: theme.colors.dangerMuted, label: 'SPAM' };
      case 'duplicate': return { color: theme.colors.warning, bg: theme.colors.warningMuted, label: 'DUPLICATE' };
      case 'wrong_batch': return { color: theme.colors.neutral, bg: theme.colors.neutralMuted, label: 'WRONG BATCH' };
      default: return null;
    }
  };

  const badge = getBadgeConfig();
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  return (
    <View style={[styles.card, review.is_noise && styles.cardNoise]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewer}>{review.reviewer}</Text>
          <Text style={styles.meta}>
            {new Date(review.date).toLocaleDateString()} · {review.batch}
          </Text>
        </View>
        <Text style={styles.stars}>{stars}</Text>
      </View>

      <Text style={styles.text}>{review.text}</Text>

      {badge && (
        <View style={[styles.badgeContainer, { backgroundColor: badge.bg }]}>
          <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
          <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
          {review.classification_reason ? (
            <Text style={styles.badgeReason}> — {review.classification_reason}</Text>
          ) : null}
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
  cardNoise: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  reviewer: {
    fontWeight: '700',
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  stars: {
    color: theme.colors.warning,
    fontSize: theme.typography.sizes.sm,
    letterSpacing: 1,
  },
  text: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeLabel: {
    fontWeight: '700',
    fontSize: theme.typography.sizes.xs,
    letterSpacing: 0.5,
  },
  badgeReason: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});
