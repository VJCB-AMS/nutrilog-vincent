import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { FoodEntry, MealType } from '@/types';
import { getMealEmoji } from '@/lib/utils';
import { getDefaultMealType } from '@/lib/targets';
import { Tab } from '@/App';

interface Props {
  entries: FoodEntry[];
  selectedDate: string;
  onAdd: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<FoodEntry, 'id' | 'createdAt'>>) => Promise<void>;
  onDateChange: (date: string) => void;
  onNavigate: (tab: Tab) => void;
  loading: boolean;
}

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

interface ManualFormData {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  amount: string;
  mealType: MealType;
}

const MEAL_ACCENT: Record<string, string> = {
  breakfast: '#FCD34D',
  lunch: '#34D399',
  dinner: '#7C3AED',
  snacks: '#FB923C',
};

const MEAL_PILL: Record<string, string> = {
  breakfast: 'meal-pill-breakfast',
  lunch: 'meal-pill-lunch',
  dinner: 'meal-pill-dinner',
  snacks: 'meal-pill-snacks',
};

const MEAL_ICON_BG: Record<string, string> = {
  breakfast: 'rgba(252, 211, 77, 0.20)',
  lunch:     'rgba(52, 211, 153, 0.20)',
  dinner:    'rgba(124, 58, 237, 0.20)',
  snacks:    'rgba(251, 146, 60, 0.20)',
};

export default function FoodLog({ entries, selectedDate, onAdd, onDelete, onUpdate, onDateChange }: Props) {
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(
    new Set(['breakfast', 'lunch', 'dinner', 'snacks'])
  );
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ManualFormData>({
    name: '', calories: '', protein: '', carbs: '', fat: '', amount: '',
    mealType: (getDefaultMealType() as MealType) || 'breakfast',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ManualFormData>({
    name: '', calories: '', protein: '', carbs: '', fat: '', amount: '', mealType: 'breakfast',
  });
  const [editSaving, setEditSaving] = useState(false);

  // Auto-collapse sections with > 4 items on initial load per date
  const collapsedForDate = useRef<string | null>(null);
  useEffect(() => {
    if (entries.length === 0) return;
    if (collapsedForDate.current === selectedDate) return;
    collapsedForDate.current = selectedDate;
    setExpandedMeals(() => {
      const next = new Set(['breakfast', 'lunch', 'dinner', 'snacks'] as string[]);
      MEALS.forEach(meal => {
        if (entries.filter(e => e.mealType === meal).length > 4) next.delete(meal);
      });
      return next;
    });
  }, [entries, selectedDate]);

  const toggleMeal = (meal: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      if (next.has(meal)) next.delete(meal); else next.add(meal);
      return next;
    });
  };

  const getEntriesForMeal = (meal: MealType) => entries.filter(e => e.mealType === meal);

  const getMealTotal = (meal: MealType) =>
    getEntriesForMeal(meal).reduce(
      (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein }),
      { calories: 0, protein: 0 }
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.calories) return;
    setSaving(true);
    try {
      await onAdd({
        date: selectedDate,
        mealType: form.mealType,
        name: form.name,
        calories: parseFloat(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        amount: form.amount || '1 serving',
      });
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', amount: '', mealType: form.mealType });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: FoodEntry) => {
    setEditingId(entry.id);
    setEditForm({
      name: entry.name,
      calories: String(entry.calories),
      protein: String(entry.protein),
      carbs: String(entry.carbs),
      fat: String(entry.fat),
      amount: entry.amount,
      mealType: entry.mealType,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await onUpdate(id, {
        name: editForm.name,
        calories: parseFloat(editForm.calories) || 0,
        protein: parseFloat(editForm.protein) || 0,
        carbs: parseFloat(editForm.carbs) || 0,
        fat: parseFloat(editForm.fat) || 0,
        amount: editForm.amount,
        mealType: editForm.mealType,
      });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update entry:', err);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Food Log</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            className="input-field text-sm py-1.5 w-auto"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Manual add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="card p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-semibold text-text-primary mb-4">Add Food Manually</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input-field col-span-2" placeholder="Food name"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                />
                <input
                  className="input-field" placeholder="Amount (e.g. 100g)"
                  value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                />
                <select
                  className="input-field" value={form.mealType}
                  onChange={e => setForm(p => ({ ...p, mealType: e.target.value as MealType }))}
                >
                  {MEALS.map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['calories', 'protein', 'carbs', 'fat'] as const).map(field => (
                  <div key={field}>
                    <label className="text-xs text-text-muted mb-1 block capitalize">
                      {field === 'calories' ? 'Calories' : `${field.charAt(0).toUpperCase() + field.slice(1)} (g)`}
                    </label>
                    <input
                      className="input-field" type="number" placeholder="0"
                      value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                      required={field === 'calories'}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Add Food'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meal sections */}
      <div className="space-y-3">
        {MEALS.map(meal => {
          const mealEntries = getEntriesForMeal(meal);
          const { calories, protein } = getMealTotal(meal);
          const isExpanded = expandedMeals.has(meal);
          const accentColor = MEAL_ACCENT[meal];

          return (
            <div key={meal} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.025] transition-colors"
                onClick={() => toggleMeal(meal)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: MEAL_ICON_BG[meal] }}
                  >
                    {getMealEmoji(meal)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize text-text-primary">{meal}</span>
                      {mealEntries.length > 0 && (
                        <span className={`text-[10px] px-1 py-0 rounded-full font-medium leading-4 ${MEAL_PILL[meal]}`}>
                          {mealEntries.length}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {mealEntries.length > 0
                        ? `${calories} kcal · ${Math.round(protein)}g protein`
                        : 'Nothing logged yet'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {calories > 0 && (
                    <span className="text-base font-bold" style={{ color: accentColor }}>{calories}</span>
                  )}
                  {isExpanded
                    ? <ChevronUp size={16} className="text-text-muted" />
                    : <ChevronDown size={16} className="text-text-muted" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.04]">
                      {mealEntries.length === 0 ? (
                        <div className="px-4 py-6 text-center text-text-muted text-sm">
                          Nothing logged yet
                        </div>
                      ) : (
                        <AnimatePresence initial={false}>
                          {mealEntries.map((entry, idx) => (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, x: 12 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -12 }}
                              transition={{ duration: 0.22, delay: idx * 0.03 }}
                              className="border-b border-white/[0.03] last:border-b-0 group"
                            >
                              {editingId === entry.id ? (
                                <form
                                  className="px-4 py-3 space-y-2"
                                  onSubmit={e => handleEditSubmit(e, entry.id)}
                                >
                                  <input
                                    className="input-field text-sm"
                                    value={editForm.name}
                                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                  />
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {(['calories', 'protein', 'carbs', 'fat'] as const).map(field => (
                                      <div key={field}>
                                        <label className="text-[10px] text-text-muted block mb-0.5 capitalize">
                                          {field === 'calories' ? 'kcal' : field[0].toUpperCase()}
                                        </label>
                                        <input
                                          className="input-field text-sm py-1.5"
                                          type="number"
                                          placeholder="0"
                                          value={editForm[field]}
                                          onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                                          required={field === 'calories'}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <input
                                      className="input-field text-sm"
                                      placeholder="Amount"
                                      value={editForm.amount}
                                      onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
                                    />
                                    <select
                                      className="input-field text-sm"
                                      value={editForm.mealType}
                                      onChange={e => setEditForm(p => ({ ...p, mealType: e.target.value as MealType }))}
                                    >
                                      {MEALS.map(m => (
                                        <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-2">
                                    <button type="submit" disabled={editSaving} className="btn-primary flex-1 text-sm py-1.5">
                                      {editSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingId(null)}
                                      className="btn-ghost text-sm py-1.5"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="flex items-center justify-between px-4 py-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-white truncate">{entry.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="text-[11px] text-gray-400">{entry.amount}</span>
                                      <span className="text-gray-500 text-sm">·</span>
                                      <span className="flex items-center gap-1">
                                        <span className="macro-dot-protein" />
                                        <span className="text-xs text-gray-200">{Math.round(entry.protein)}g</span>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="macro-dot-carbs" />
                                        <span className="text-xs text-gray-200">{Math.round(entry.carbs)}g</span>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="macro-dot-fat" />
                                        <span className="text-xs text-gray-200">{Math.round(entry.fat)}g</span>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                                    <span className="text-lg font-bold text-white">{entry.calories}</span>
                                    <span className="text-sm text-gray-400">kcal</span>
                                    <motion.button
                                      onClick={() => startEdit(entry)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-accent p-1.5 rounded-lg hover:bg-accent/10"
                                      whileTap={{ scale: 0.9 }}
                                      title="Edit"
                                    >
                                      <Pencil size={12} />
                                    </motion.button>
                                    <motion.button
                                      onClick={() => onDelete(entry.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-danger p-1.5 rounded-lg hover:bg-danger/10"
                                      whileTap={{ scale: 0.9 }}
                                      title="Delete"
                                    >
                                      <Trash2 size={12} />
                                    </motion.button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
