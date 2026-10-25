import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Task } from '@/types';
import { StorageService } from '@/services/storage';
import { Check, Trash2, Plus, Flag } from 'lucide-react-native';

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
};

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const confirmDelete = () => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
    ]);
  };

  return (
    <View style={[styles.taskCard, task.completed && styles.taskCardDone]}>
      <TouchableOpacity
        style={[
          styles.taskCheckbox,
          task.completed && { backgroundColor: PRIORITY_COLORS[task.priority], borderColor: PRIORITY_COLORS[task.priority] },
        ]}
        onPress={() => onToggle(task.id)}
        activeOpacity={0.7}
      >
        {task.completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </TouchableOpacity>

      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: PRIORITY_COLORS[task.priority] + '20' },
            ]}
          >
            <Flag size={10} color={PRIORITY_COLORS[task.priority]} />
            <Text style={[styles.priorityText, { color: PRIORITY_COLORS[task.priority] }]}>
              {PRIORITY_LABELS[task.priority]}
            </Text>
          </View>
          {task.dueDate && (
            <Text style={styles.dueDate}>Due {task.dueDate}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={confirmDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Trash2 size={15} color="#CBD5E1" />
      </TouchableOpacity>
    </View>
  );
}

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title');
      return;
    }
    onAdd({
      title: title.trim(),
      completed: false,
      priority,
      dueDate: dueDate.trim() || undefined,
    });
    setTitle('');
    setPriority('medium');
    setDueDate('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>New Task</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as Task['priority'][]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityPill,
                    priority === p && {
                      backgroundColor: PRIORITY_COLORS[p],
                      borderColor: PRIORITY_COLORS[p],
                    },
                  ]}
                  onPress={() => setPriority(p)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.priorityPillText,
                      priority === p && { color: '#FFFFFF' },
                    ]}
                  >
                    {PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Due Date (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-11-01"
              placeholderTextColor="#94A3B8"
              value={dueDate}
              onChangeText={setDueDate}
              keyboardType="default"
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addTaskBtn, { backgroundColor: PRIORITY_COLORS[priority] }]}
              onPress={handleAdd}
            >
              <Text style={styles.addTaskBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      StorageService.getTasks().then(setTasks);
    }, [])
  );

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    await StorageService.saveTasks(updated);
  };

  const toggleTask = async (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    await StorageService.saveTasks(updated);
  };

  const deleteTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    await StorageService.saveTasks(updated);
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.heading}>Tasks</Text>
          <Text style={styles.subheading}>
            {doneCount}/{tasks.length} completed
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'done'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem task={item} onToggle={toggleTask} onDelete={deleteTask} />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'done' ? 'No completed tasks' : 'No tasks yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' ? 'Tap "New" to add your first task' : ''}
            </Text>
          </View>
        }
      />

      <AddTaskModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subheading: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  taskCardDone: {
    opacity: 0.6,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  deleteBtn: {
    padding: 4,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
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
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  priorityPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  addTaskBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addTaskBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
