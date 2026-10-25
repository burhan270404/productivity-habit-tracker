import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { StorageService } from '@/services/storage';
import { Habit } from '@/types';

// ─── stat computation ─────────────────────────────────────────────────────

function computeStats(habits: Habit[]) {
  const today = new Date().toISOString().split('T')[0];
  const totalHabitsCompleted = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const completedToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  const allDates = new Set(habits.flatMap((h) => h.completedDates));
  let currentStreak = 0;
  const check = new Date();
  while (allDates.has(check.toISOString().split('T')[0])) {
    currentStreak++;
    check.setDate(check.getDate() - 1);
  }

  const last7: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.push(d.toISOString().split('T')[0]);
  }
  const weeklyCompletions = habits.flatMap((h) =>
    h.completedDates.filter((d) => last7.includes(d))
  ).length;
  const maxWeekly = habits.reduce((sum, h) => sum + h.targetDaysPerWeek, 0);
  const weeklyRate = maxWeekly > 0 ? Math.round((weeklyCompletions / maxWeekly) * 100) : 0;

  // 30-day heatmap data: date → completion count
  const heatmap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    heatmap[key] = habits.filter((h) => h.completedDates.includes(key)).length;
  }

  // Category breakdown
  const categories = ['productivity', 'health', 'learning', 'mindfulness'] as const;
  const categoryBreakdown = categories.map((cat) => {
    const catHabits = habits.filter((h) => h.category === cat);
    const completions = catHabits.reduce((sum, h) => sum + h.completedDates.length, 0);
    const maxPossible = catHabits.reduce((sum, h) => sum + h.targetDaysPerWeek * 4, 0);
    return {
      category: cat,
      count: catHabits.length,
      completions,
      rate: maxPossible > 0 ? Math.min(Math.round((completions / maxPossible) * 100), 100) : 0,
    };
  }).filter((c) => c.count > 0);

  return {
    totalHabitsCompleted,
    completedToday,
    totalHabits: habits.length,
    bestStreak,
    currentStreak,
    weeklyRate,
    weeklyCompletions,
    maxWeekly,
    heatmap,
    categoryBreakdown,
  };
}

// ─── completion ring (SVG) ────────────────────────────────────────────────

function CompletionRing({
  completed,
  total,
  size = 120,
}: {
  completed: number;
  total: number;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - pct);
  const color = pct === 1 ? '#10B981' : pct >= 0.5 ? '#3B82F6' : '#F59E0B';

  return (
    <Svg width={size} height={size}>
      {/* Track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#1E293B"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
      {/* Center text */}
      <SvgText
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        fill={color}
        fontSize="22"
        fontWeight="800"
      >
        {total === 0 ? '—' : `${completed}`}
      </SvgText>
      <SvgText
        x={size / 2}
        y={size / 2 + 12}
        textAnchor="middle"
        fill="#64748B"
        fontSize="11"
      >
        of {total}
      </SvgText>
    </Svg>
  );
}

// ─── 30-day heatmap ──────────────────────────────────────────────────────

function HeatmapGrid({ data, maxVal }: { data: Record<string, number>; maxVal: number }) {
  const keys = Object.keys(data).sort();
  const cells = keys.slice(-30);

  const getColor = (val: number) => {
    if (val === 0) return '#1E293B';
    const intensity = maxVal > 0 ? val / maxVal : 0;
    if (intensity >= 0.8) return '#1D4ED8';
    if (intensity >= 0.5) return '#3B82F6';
    if (intensity >= 0.2) return '#93C5FD';
    return '#BFDBFE';
  };

  return (
    <View style={hm.grid}>
      {cells.map((key, i) => {
        const val = data[key] ?? 0;
        const isToday = i === cells.length - 1;
        return (
          <View
            key={key}
            style={[
              hm.cell,
              { backgroundColor: getColor(val) },
              isToday && hm.cellToday,
            ]}
          />
        );
      })}
    </View>
  );
}

const hm = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  cell: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
});

// ─── category emoji map ────────────────────────────────────────────────────
const CAT_META: Record<string, { emoji: string; color: string }> = {
  productivity: { emoji: '⚡', color: '#3B82F6' },
  health: { emoji: '🏃', color: '#10B981' },
  learning: { emoji: '📚', color: '#8B5CF6' },
  mindfulness: { emoji: '🧘', color: '#F59E0B' },
};

// ─── stat card ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent,
}: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <View style={[sc.card, { borderLeftColor: accent }]}>
      <Text style={sc.label}>{label}</Text>
      <Text style={[sc.value, { color: accent }]}>{value}</Text>
      {sub ? <Text style={sc.sub}>{sub}</Text> : null}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    minWidth: '44%',
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
  },
  sub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});

// ─── main screen ──────────────────────────────────────────────────────────

export default function StatsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      StorageService.getHabits().then(setHabits);
    }, [])
  );

  const stats = computeStats(habits);
  const maxHeatmapVal = Math.max(...Object.values(stats.heatmap), 1);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerBg} />
        <View style={styles.headerBlob} />
        <View style={[styles.headerContent, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Today's ring + streak side-by-side */}
      <View style={styles.ringRow}>
        <View style={styles.ringCard}>
          <Text style={styles.ringLabel}>Today</Text>
          <CompletionRing
            completed={stats.completedToday}
            total={stats.totalHabits}
            size={120}
          />
          <Text style={styles.ringSubLabel}>habits done</Text>
        </View>

        <View style={styles.streakCol}>
          <View style={[styles.streakCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.streakNum}>{stats.currentStreak}</Text>
            <Text style={styles.streakUnit}>day streak</Text>
          </View>
          <View style={[styles.streakCard, { borderLeftColor: '#8B5CF6' }]}>
            <Text style={[styles.streakNum, { color: '#8B5CF6' }]}>{stats.bestStreak}</Text>
            <Text style={styles.streakUnit}>best streak</Text>
          </View>
        </View>
      </View>

      {/* 4-stat grid */}
      <View style={styles.grid}>
        <StatCard label="All-time" value={stats.totalHabitsCompleted} sub="check-ins" accent="#3B82F6" />
        <StatCard label="This week" value={`${stats.weeklyRate}%`} sub="completion rate" accent="#10B981" />
      </View>

      {/* 30-day heatmap */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>30-Day Activity</Text>
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendLabel}>Less</Text>
            {['#1E293B', '#BFDBFE', '#93C5FD', '#3B82F6', '#1D4ED8'].map((c) => (
              <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
            ))}
            <Text style={styles.legendLabel}>More</Text>
          </View>
        </View>
        <View style={styles.heatmapCard}>
          <HeatmapGrid data={stats.heatmap} maxVal={maxHeatmapVal} />
          <Text style={styles.heatmapNote}>Each cell = one day · darker = more habits completed</Text>
        </View>
      </View>

      {/* Weekly bar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekCard}>
          <View style={styles.weekTopRow}>
            <Text style={styles.weekRate}>{stats.weeklyRate}%</Text>
            <Text style={styles.weekRateLabel}>completion rate</Text>
          </View>
          <View style={styles.weekBarWrap}>
            <View
              style={[
                styles.weekBar,
                { width: `${stats.weeklyRate}%` },
                {
                  backgroundColor:
                    stats.weeklyRate >= 80
                      ? '#10B981'
                      : stats.weeklyRate >= 50
                      ? '#3B82F6'
                      : '#F59E0B',
                },
              ]}
            />
          </View>
          <Text style={styles.weekSub}>
            {stats.weeklyCompletions} / {stats.maxWeekly} possible completions
          </Text>
        </View>
      </View>

      {/* Category breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          {stats.categoryBreakdown.map((cat) => {
            const meta = CAT_META[cat.category] ?? { emoji: '📌', color: '#64748B' };
            return (
              <View key={cat.category} style={styles.catRow}>
                <Text style={styles.catEmoji}>{meta.emoji}</Text>
                <View style={styles.catInfo}>
                  <View style={styles.catTopRow}>
                    <Text style={styles.catName}>
                      {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                    </Text>
                    <Text style={[styles.catRate, { color: meta.color }]}>{cat.rate}%</Text>
                  </View>
                  <View style={styles.catBarWrap}>
                    <View
                      style={[
                        styles.catBar,
                        { width: `${cat.rate}%`, backgroundColor: meta.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.catSub}>
                    {cat.count} habit{cat.count !== 1 ? 's' : ''} · {cat.completions} total completions
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Per-habit breakdown */}
      {habits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit Details</Text>
          {habits.map((h) => {
            const rate =
              h.targetDaysPerWeek > 0
                ? Math.min(Math.round((h.completedDates.length / (h.targetDaysPerWeek * 4)) * 100), 100)
                : 0;
            return (
              <View key={h.id} style={styles.habitRow}>
                <View style={[styles.habitDot, { backgroundColor: h.color }]} />
                <View style={styles.habitInfo}>
                  <View style={styles.habitRowTop}>
                    <Text style={styles.habitName}>{h.title}</Text>
                    <Text style={styles.habitStreak}>🔥 {h.streak}</Text>
                  </View>
                  <View style={styles.habitBarWrap}>
                    <View style={[styles.habitBar, { width: `${rate}%`, backgroundColor: h.color }]} />
                  </View>
                  <Text style={styles.habitSub}>
                    {h.completedDates.length} total · {h.targetDaysPerWeek}×/week target
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  container: { paddingBottom: 48 },

  // Header
  headerWrap: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  headerBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
  },
  headerBlob: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1D4ED8',
    opacity: 0.2,
    top: -60,
    right: -40,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  // Ring row
  ringRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  ringCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ringSubLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  streakCol: {
    flex: 1,
    gap: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    justifyContent: 'center',
  },
  streakNum: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F59E0B',
  },
  streakUnit: {
    fontSize: 12,
    color: '#64748B',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 10,
  },

  // Heatmap
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendLabel: {
    fontSize: 10,
    color: '#475569',
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  heatmapNote: {
    fontSize: 10,
    color: '#475569',
    marginTop: 10,
    textAlign: 'center',
  },

  // Weekly
  weekCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
  },
  weekTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  weekRate: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  weekRateLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  weekBarWrap: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  weekBar: {
    height: '100%',
    borderRadius: 4,
  },
  weekSub: {
    fontSize: 12,
    color: '#64748B',
  },

  // Category
  catRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    alignItems: 'flex-start',
    gap: 10,
  },
  catEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  catInfo: {
    flex: 1,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  catRate: {
    fontSize: 14,
    fontWeight: '700',
  },
  catBarWrap: {
    height: 5,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  catBar: {
    height: '100%',
    borderRadius: 3,
  },
  catSub: {
    fontSize: 11,
    color: '#64748B',
  },

  // Per-habit
  habitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  habitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  habitInfo: { flex: 1 },
  habitRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  habitStreak: {
    fontSize: 12,
    color: '#F59E0B',
  },
  habitBarWrap: {
    height: 5,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  habitBar: {
    height: '100%',
    borderRadius: 3,
  },
  habitSub: {
    fontSize: 11,
    color: '#64748B',
  },
});
