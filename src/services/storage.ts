import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, Task, UserStats } from '@/types';

const HABITS_KEY = '@habits_storage';
const TASKS_KEY = '@tasks_storage';
const STATS_KEY = '@stats_storage';

const DEFAULT_HABITS: Habit[] = [
  {
    id: '1',
    title: 'Morning Meditation',
    description: '10 minutes of mindfulness',
    category: 'mindfulness',
    color: '#8B5CF6',
    streak: 3,
    completedDates: [],
    targetDaysPerWeek: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Deep Work Session',
    description: '45 mins focused work',
    category: 'productivity',
    color: '#3B82F6',
    streak: 5,
    completedDates: [],
    targetDaysPerWeek: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Drink 2L Water',
    description: 'Stay properly hydrated',
    category: 'health',
    color: '#10B981',
    streak: 12,
    completedDates: [],
    targetDaysPerWeek: 7,
    createdAt: new Date().toISOString(),
  },
];

export const StorageService = {
  // Habit functions
  async getHabits(): Promise<Habit[]> {
    try {
      const data = await AsyncStorage.getItem(HABITS_KEY);
      if (!data) {
        await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(DEFAULT_HABITS));
        return DEFAULT_HABITS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading habits', e);
      return [];
    }
  },

  async saveHabits(habits: Habit[]): Promise<void> {
    try {
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    } catch (e) {
      console.error('Error saving habits', e);
    }
  },

  async toggleHabitCompletion(id: string, dateStr: string): Promise<Habit[]> {
    const habits = await this.getHabits();
    const updated = habits.map(h => {
      if (h.id === id) {
        const isDone = h.completedDates.includes(dateStr);
        const newDates = isDone
          ? h.completedDates.filter(d => d !== dateStr)
          : [...h.completedDates, dateStr];

        return {
          ...h,
          completedDates: newDates,
          streak: isDone ? Math.max(0, h.streak - 1) : h.streak + 1,
        };
      }
      return h;
    });
    await this.saveHabits(updated);
    return updated;
  },

  // Task functions
  async getTasks(): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading tasks', e);
      return [];
    }
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks', e);
    }
  },

  // Stats functions
  async getStats(): Promise<UserStats> {
    try {
      const data = await AsyncStorage.getItem(STATS_KEY);
      return data
        ? JSON.parse(data)
        : {
            totalHabitsCompleted: 0,
            currentStreak: 0,
            bestStreak: 0,
            focusMinutesToday: 0,
          };
    } catch {
      return {
        totalHabitsCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        focusMinutesToday: 0,
      };
    }
  },

  async saveStats(stats: UserStats): Promise<void> {
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Error saving stats', e);
    }
  },
};
