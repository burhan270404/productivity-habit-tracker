import { AddHabitDialog } from '@/components/AddHabitDialog';
import { HabitCard } from '@/components/HabitCard';
import { StorageService } from '@/services/storage';
import { Habit } from '@/types';
import { useFocusEffect } from 'expo-router';
import { Plus, Sparkles } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── time-aware content ────────────────────────────────────────────────────
const hour = new Date().getHours();

function getGreeting(): string {
  if (hour < 5) return 'Up late 🌙';
  if (hour < 12) return 'Good morning ☀️';
  if (hour < 17) return 'Good afternoon 🌤';
  if (hour < 21) return 'Good evening 🌆';
  return 'Good night 🌙';
}

const QUOTES = [
  'Small steps daily lead to massive results.',
  'You don\'t rise to your goals, you fall to your systems.',
  'Consistency beats perfection every single day.',
  'The secret to getting ahead is getting started.',
  'Your habits shape your identity.',
  'Every expert was once a beginner. Keep going.',
  'Progress, not perfection.',
];

const todayQuote = QUOTES[new Date().getDay() % QUOTES.length];

// ─── gradient-like header using stacked views ─────────────────────────────
function Header({
  completedToday,
  total,
  onAdd,
}: {
  completedToday: number;
  total: number;
  onAdd: () => void;
}) {
  const insets = useSafeAreaInsets();
  const pct = total > 0 ? completedToday / total : 0;
  const allDone = completedToday === total && total > 0;

  return (
    <View style={h.wrap}>
      {/* Dark background with accent blobs */}
      <View style={h.bg} />
      <View style={h.blob1} />
      <View style={h.blob2} />

      {/* Content */}
      <View style={[h.content, { paddingTop: insets.top + 12 }]}>
        <View style={h.topRow}>
          <View>
            <Text style={h.greeting}>{getGreeting()}</Text>
            <Text style={h.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity style={h.addBtn} onPress={onAdd} activeOpacity={0.85}>
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Quote */}
        <View style={h.quoteRow}>
          <Sparkles size={12} color="#F59E0B" />
          <Text style={h.quote}>{todayQuote}</Text>
        </View>

        {/* Progress ring-style summary */}
        <View style={h.progressCard}>
          <View style={h.progressLeft}>
            <Text style={h.progressNum}>
              <Text style={{ color: allDone ? '#10B981' : '#F8FAFC' }}>{completedToday}</Text>
              <Text style={h.progressOf}>/{total}</Text>
            </Text>
            <Text style={h.progressLabel}>habits today</Text>
          </View>

          <View style={h.progressBarCol}>
            <View style={h.progressBarTrack}>
              <View
                style={[
                  h.progressBarFill,
                  {
                    width: `${Math.round(pct * 100)}%`,
                    backgroundColor: allDone ? '#10B981' : '#3B82F6',
                  },
                ]}
              />
            </View>
            <Text style={h.progressPct}>
              {total === 0 ? '0' : Math.round(pct * 100)}% complete
              {allDone ? ' 🎉' : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  bg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
  },
  blob1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1D4ED8',
    opacity: 0.25,
    top: -80,
    right: -60,
  },
  blob2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#7C3AED',
    opacity: 0.18,
    top: 40,
    left: -40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A5F',
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  quote: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    flex: 1,
  },
  progressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressLeft: {
    alignItems: 'center',
    minWidth: 52,
  },
  progressNum: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 32,
  },
  progressOf: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  progressBarCol: {
    flex: 1,
    gap: 6,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

// ─── category pill filter ─────────────────────────────────────────────────
type FilterCategory = 'all' | Habit['category'];

const CATEGORY_FILTERS: { label: string; value: FilterCategory; emoji: string }[] = [
  { label: 'All', value: 'all', emoji: '✨' },
  { label: 'Productivity', value: 'productivity', emoji: '⚡' },
  { label: 'Health', value: 'health', emoji: '🏃' },
  { label: 'Learning', value: 'learning', emoji: '📚' },
  { label: 'Mindfulness', value: 'mindfulness', emoji: '🧘' },
];

// ─── main screen ──────────────────────────────────────────────────────────
export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const today = new Date().toISOString().split('T')[0];
  const insets = useSafeAreaInsets();

  const loadHabits = async () => {
    const data = await StorageService.getHabits();
    setHabits(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const toggleHabit = async (id: string) => {
    const updated = await StorageService.toggleHabitCompletion(id, today);
    setHabits(updated);
  };

  const addHabit = async (
    newHabit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>
  ) => {
    const newHabitFull: Habit = {
      ...newHabit,
      streak: 0,
      completedDates: [],
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const updated = [...habits, newHabitFull];
    setHabits(updated);
    await StorageService.saveHabits(updated);
  };

  const deleteHabit = async (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    await StorageService.saveHabits(updated);
  };

  const completedToday = habits.filter((h) => h.completedDates.includes(today)).length;

  const filtered =
    filter === 'all' ? habits : habits.filter((h) => h.category === filter);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Header
              completedToday={completedToday}
              total={habits.length}
              onAdd={() => setShowDialog(true)}
            />

            {/* Category filter */}
            <View style={styles.filterWrap}>
              <FlatList
                horizontal
                data={CATEGORY_FILTERS}
                keyExtractor={(item) => item.value}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item }) => {
                  const active = filter === item.value;
                  return (
                    <TouchableOpacity
                      style={[styles.filterPill, active && styles.filterPillActive]}
                      onPress={() => setFilter(item.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterEmoji}>{item.emoji}</Text>
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {filtered.length === 0 && habits.length > 0 && (
              <View style={styles.emptyFilter}>
                <Text style={styles.emptyFilterText}>No {filter} habits yet</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            isCompletedToday={item.completedDates.includes(today)}
            onToggle={() => toggleHabit(item.id)}
            onDelete={deleteHabit}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          habits.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the{' '}
                <Text style={{ color: '#3B82F6', fontWeight: '700' }}>+</Text>
                {' '}button to create your first habit
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setShowDialog(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyAddBtnText}>＋ Add First Habit</Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      <Modal visible={showDialog} transparent animationType="fade">
        <AddHabitDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          onAdd={addHabit}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  filterWrap: {
    marginBottom: 4,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#3B82F6',
  },
  filterEmoji: {
    fontSize: 12,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#F8FAFC',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  emptyFilter: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFilterText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});