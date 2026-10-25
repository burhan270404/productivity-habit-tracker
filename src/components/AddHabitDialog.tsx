import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Habit, NewHabitFormValues } from '@/types';

interface AddHabitDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => void;
}

const CATEGORIES: { label: string; value: Habit['category']; emoji: string }[] = [
  { label: 'Productivity', value: 'productivity', emoji: '⚡' },
  { label: 'Health', value: 'health', emoji: '🏃' },
  { label: 'Learning', value: 'learning', emoji: '📚' },
  { label: 'Mindfulness', value: 'mindfulness', emoji: '🧘' },
];

const COLOR_SWATCHES = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export const AddHabitDialog: React.FC<AddHabitDialogProps> = ({ open, onClose, onAdd }) => {
  const [values, setValues] = React.useState<NewHabitFormValues>({
    title: '',
    description: '',
    category: 'productivity',
    color: '#3B82F6',
    targetDaysPerWeek: 7,
  });

  const handleAdd = () => {
    if (!values.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a habit title');
      return;
    }

    onAdd({
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      color: values.color,
      targetDaysPerWeek: values.targetDaysPerWeek,
    });

    // Reset form
    setValues({
      title: '',
      description: '',
      category: 'productivity',
      color: '#3B82F6',
      targetDaysPerWeek: 7,
    });
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Add New Habit</Text>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Habit Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Morning Meditation"
              placeholderTextColor="#94A3B8"
              value={values.title}
              onChangeText={(text) => setValues({ ...values, title: text })}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. 10 minutes of mindfulness..."
              placeholderTextColor="#94A3B8"
              value={values.description}
              onChangeText={(text) => setValues({ ...values, description: text })}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pillRow}>
              {CATEGORIES.map((cat) => {
                const selected = values.category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.pill,
                      selected && { backgroundColor: values.color, borderColor: values.color },
                    ]}
                    onPress={() => setValues({ ...values, category: cat.value })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pillEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color */}
          <View style={styles.field}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.swatchRow}>
              {COLOR_SWATCHES.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.swatch,
                    { backgroundColor: color },
                    values.color === color && styles.swatchSelected,
                  ]}
                  onPress={() => setValues({ ...values, color })}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          </View>

          {/* Target Days/Week */}
          <View style={styles.field}>
            <Text style={styles.label}>Target Days / Week</Text>
            <View style={styles.pillRow}>
              {DAY_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayPill,
                    values.targetDaysPerWeek === d && {
                      backgroundColor: values.color,
                      borderColor: values.color,
                    },
                  ]}
                  onPress={() => setValues({ ...values, targetDaysPerWeek: d })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      values.targetDaysPerWeek === d && styles.pillTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: values.color }]}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.saveText}>Save Habit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '92%',
    maxWidth: 420,
    maxHeight: '88%',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  container: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  pillEmoji: {
    fontSize: 13,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  swatchSelected: {
    transform: [{ scale: 1.2 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  dayPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
    paddingBottom: 4,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
