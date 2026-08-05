import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { theme } from '../constants/theme';
import { Review } from '../types';

/**
 * FR-013 — Complaint velocity time-series.
 *
 * Plots how many concerning (genuine, ≤2★) reviews arrive per day as reviews
 * stream in. Fully client-side and reactive: it recomputes whenever the
 * reviews array changes, so it "updates as new reviews arrive" with no polling.
 *
 * Uses react-native-svg (already a dependency) rather than a chart library so
 * it renders identically on web and on a physical device via Expo Go.
 */

type Point = { day: string; complaints: number; total: number };

const W = 320;
const H = 150;
const PAD_L = 26;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 22;

function buildSeries(reviews: Review[]): Point[] {
  const byDay = new Map<string, { complaints: number; total: number }>();
  for (const r of reviews) {
    const day = (r.date || '').slice(5, 10) || '—'; // MM-DD
    const bucket = byDay.get(day) || { complaints: 0, total: 0 };
    bucket.total += 1;
    // A complaint = a genuine review with a low rating. Noise is excluded so
    // spam / wrong-batch reviews never inflate the velocity line.
    const isGenuine = r.classification === 'genuine' || !r.classification || r.classification === 'unclassified';
    if (isGenuine && (r.rating ?? 5) <= 2) bucket.complaints += 1;
    byDay.set(day, bucket);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, v]) => ({ day, ...v }));
}

export default function ComplaintVelocityChart() {
  // Import the store lazily to keep this component drop-in.
  const reviews = useReviews();
  const series = useMemo(() => buildSeries(reviews), [reviews]);

  if (series.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No review data yet — add reviews to see complaint velocity build over time.</Text>
      </View>
    );
  }

  const maxY = Math.max(2, ...series.map(p => p.complaints));
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const x = (i: number) =>
    PAD_L + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
  const y = (v: number) => PAD_T + plotH - (v / maxY) * plotH;

  const complaintPts = series.map((p, i) => `${x(i)},${y(p.complaints)}`).join(' ');
  const totalComplaints = series.reduce((s, p) => s + p.complaints, 0);
  const peak = series.reduce((m, p) => (p.complaints > m.complaints ? p : m), series[0]);

  // Horizontal gridlines at 0, mid, max.
  const gridVals = [0, Math.round(maxY / 2), maxY];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Complaint Velocity</Text>
          <Text style={styles.subtitle}>Genuine safety complaints per day</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statNum}>{totalComplaints}</Text>
          <Text style={styles.statLabel}>total</Text>
        </View>
      </View>

      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {gridVals.map((gv, idx) => (
          <React.Fragment key={idx}>
            <Line
              x1={PAD_L}
              y1={y(gv)}
              x2={W - PAD_R}
              y2={y(gv)}
              stroke={theme.colors.border}
              strokeWidth={1}
              strokeDasharray={idx === 0 ? undefined : '3,3'}
            />
            <SvgText x={2} y={y(gv) + 3} fontSize={9} fill={theme.colors.textMuted}>
              {gv}
            </SvgText>
          </React.Fragment>
        ))}

        {series.length > 1 && (
          <Polyline
            points={complaintPts}
            fill="none"
            stroke={theme.colors.danger}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {series.map((p, i) => (
          <React.Fragment key={p.day}>
            <Circle cx={x(i)} cy={y(p.complaints)} r={3.5} fill={theme.colors.danger} />
            {(i === 0 || i === series.length - 1 || i % 2 === 0) && (
              <SvgText
                x={x(i)}
                y={H - 7}
                fontSize={8}
                fill={theme.colors.textMuted}
                textAnchor="middle"
              >
                {p.day}
              </SvgText>
            )}
          </React.Fragment>
        ))}
      </Svg>

      <View style={styles.footerRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.danger }]} />
          <Text style={styles.legendText}>Complaints/day</Text>
        </View>
        {peak.complaints > 0 && (
          <Text style={styles.peakText}>Peak {peak.complaints} on {peak.day}</Text>
        )}
      </View>
    </View>
  );
}

// Kept at the bottom so the store import doesn't create a cycle at module top.
import { useEcomGuardStore } from '../store/useEcomGuardStore';
function useReviews() {
  return useEcomGuardStore(state => state.reviews);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: theme.colors.dangerMuted,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statNum: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '800',
    color: theme.colors.danger,
  },
  statLabel: {
    fontSize: 9,
    color: theme.colors.danger,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: theme.typography.sizes.xs, color: theme.colors.textSecondary },
  peakText: { fontSize: theme.typography.sizes.xs, color: theme.colors.textMuted, fontWeight: '600' },
  empty: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
