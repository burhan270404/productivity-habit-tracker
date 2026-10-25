export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: 'productivity' | 'health' | 'learning' | 'mindfulness';
  color: string;
  streak: number;
  completedDates: string[]; // ISO strings YYYY-MM-DD
  targetDaysPerWeek: number;
  reminderTime?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  pomodoroCount?: number;
  createdAt: string;
}

export interface UserStats {
  totalHabitsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  focusMinutesToday: number;
}

export interface NewHabitFormValues {
  title: string;
  description: string;
  category: Habit['category'];
  color: string;
  targetDaysPerWeek: number;
}

export interface LocationEntry {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;          // m/s
  accuracy: number | null;       // meters
  timestamp: number;             // ms since epoch
}