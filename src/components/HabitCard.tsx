import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Habit } from '@/types';
import { Check, Flame, Trash2 } from 'lucide-react-native';

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  onToggle: () => void;
  onDelete?: (id: string) => void;
}

/** Returns the last 7 ISO date strings starting from today */
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompletedToday,
  onToggle,
  onDelete,
}) => {
  const last7 = getLast7Days();
  const completedSet = new Set(habit.completedDates);
  const doneThisWeek = last7.filter((d) => completedSet.has(d)).length;
  const progressPct = Math.min(doneThisWeek / Math.max(habit.targetDaysPerWeek, 1), 1);

  const confirmDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(habit.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { borderLeftColor: habit.color }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{habit.title}</Text>
          {habit.description ? (
            <Text style={styles.description}>{habit.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.streakBadge}>
              <Flame size={13} color="#F59E0B" />
              <Text style={styles.streakText}>{habit.streak} day streak</Text>
            </View>
            <Text style={styles.categoryBadge}>{habit.category}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={confirmDelete}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={15} color="#CBD5E1" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.checkbox,
              isCompletedToday && { backgroundColor: habit.color, borderColor: habit.color },
            ]}
            onPress={onToggle}
            activeOpacity={0.7}
          >
            {isCompletedToday && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly progress */}
      <View style={styles.weekRow}>
        {last7.map((dateStr, i) => {
          const done = completedSet.has(dateStr);
          const isToday = i === 6;
          return (
            <View key={dateStr} style={styles.dayCol}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {DAY_LABELS[new Date(dateStr + 'T00:00:00').getDay()]}
              </Text>
              <View
                style={[
                  styles.dayCirle,
                  done && { backgroundColor: habit.color },
                  isToday && !done && styles.dayCirleToday,
                ]}
              />
            </View>
          );
        })}

        {/* Progress bar */}
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBar, { width: `${progressPct * 100}%`, backgroundColor: habit.color }]} />
        </View>
      </View>

      <Text style={styles.progressLabel}>
        {doneThisWeek}/{habit.targetDaysPerWeek} days this week
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  categoryBadge: {
    fontSize: 11,
    textTransform: 'capitalize',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Weekly dots row
  weekRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 6,
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dayLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dayLabelToday: {
    color: '#0F172A',
    fontWeight: '700',
  },
  dayCirle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  dayCirleToday: {
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: 'transparent',
  },
  progressBarWrap: {
    flex: 2,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 4,
    alignSelf: 'center',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
  },
});
