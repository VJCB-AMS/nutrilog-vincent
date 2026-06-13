import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, X, MessageSquare, Trash2, CheckCheck } from 'lucide-react';
import { FoodEntry, MealType } from '@/types';
import { parseFood } from '@/lib/api';
import { getDefaultMealType } from '@/lib/targets';
import { getMealEmoji } from '@/lib/utils';
import { Tab } from '@/App';

interface Props {
  entries: FoodEntry[];
  selectedDate: string;
  onAdd: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
  onNavigate: (tab: Tab) => void;
  loading: boolean;
}

interface ParsedItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  amount: string;
  mealType: MealType;
}

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export default function ChatLogger({ entries, selectedDate, onAdd }: Props) {
  const [input, setInput] = useState('');
  const mealType = getDefaultMealType() as MealType;
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleParse = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setItems([]);
    setExpandedIndex(null);
    try {
      const results = await parseFood(input, mealType);
      const parsed = results.map(r => ({
        name: r.name || 'Unknown',
        calories: Number(r.calories) || 0,
        protein: Number(r.protein) || 0,
        carbs: Number(r.carbs) || 0,
        fat: Number(r.fat) || 0,
        amount: r.amount || '1 serving',
        mealType: (r.mealType as MealType) || mealType,
      }));
      setItems(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to log food: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: keyof ParsedItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const logAll = async () => {
    for (const item of items) {
      await onAdd({ date: selectedDate, ...item });
    }
    setItems([]);
    setInput('');
  };

  const logOne = async (index: number) => {
    await onAdd({ date: selectedDate, ...items[index] });
    removeItem(index);
  };

  const totalCalories = items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = items.reduce((s, i) => s + i.protein, 0);

  const examples = [
    '4 eggs and avocado for breakfast',
    'Chicken breast 200g with rice',
    'Protein shake 1 scoop',
    'AH ready meal teriyaki',
    'Greek yogurt 150g with blueberries',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <MessageSquare size={20} className="text-accent" />
          AI Food Logger
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Describe what you ate — AI splits multiple foods automatically.
        </p>
      </div>

      {/* Input area */}
      <div className="card p-4 space-y-3">
        <textarea
          className="input-field resize-none"
          rows={2}
          placeholder="What did you eat? I'll log it automatically."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleParse();
            }
          }}
        />

        <button
          onClick={handleParse}
          disabled={loading || !input.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Send size={16} />
              Log Food
            </>
          )}
        </button>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 rounded-xl px-3 py-2">{error}</div>
        )}
      </div>

      {/* Parsed items */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Summary header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-nutrilog inline-block" />
                <span className="font-semibold text-text-primary">
                  {items.length} item{items.length !== 1 ? 's' : ''} detected
                </span>
                <span className="text-text-muted text-sm">
                  · {totalCalories} kcal · {Math.round(totalProtein)}g protein
                </span>
              </div>
              <button
                onClick={logAll}
                className="btn-primary flex items-center gap-1.5 text-sm"
              >
                <CheckCheck size={15} />
                Log All
              </button>
            </div>

            {/* Individual items */}
            {items.map((item, index) => (
              <motion.div
                key={index}
                className="card overflow-hidden"
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                {/* Item row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg flex-shrink-0">{getMealEmoji(item.mealType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary truncate">{item.name}</div>
                    <div className="text-xs text-text-muted">
                      {item.amount} · {item.calories} kcal · P:{Math.round(item.protein)} C:{Math.round(item.carbs)} F:{Math.round(item.fat)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      className="text-xs px-2 py-1 rounded-lg bg-border hover:bg-border/70 text-text-secondary transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => logOne(index)}
                      className="text-xs px-2 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent transition-all"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline editor */}
                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      className="border-t border-border px-4 pb-4 pt-3 space-y-3"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">Name</label>
                          <input
                            className="input-field text-sm py-2"
                            value={item.name}
                            onChange={e => updateItem(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">Amount</label>
                          <input
                            className="input-field text-sm py-2"
                            value={item.amount}
                            onChange={e => updateItem(index, 'amount', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">Meal</label>
                          <select
                            className="input-field text-sm py-2"
                            value={item.mealType}
                            onChange={e => updateItem(index, 'mealType', e.target.value)}
                          >
                            {MEALS.map(m => (
                              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">Calories</label>
                          <input
                            className="input-field text-sm py-2"
                            type="number"
                            value={item.calories}
                            onChange={e => updateItem(index, 'calories', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['protein', 'carbs', 'fat'] as const).map(field => (
                          <div key={field}>
                            <label className="text-xs text-text-muted mb-1 block capitalize">{field} (g)</label>
                            <input
                              className="input-field text-sm py-2"
                              type="number"
                              value={item[field]}
                              onChange={e => updateItem(index, field, Number(e.target.value))}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Discard all */}
            <button
              onClick={() => setItems([])}
              className="w-full text-sm text-text-muted hover:text-text-secondary flex items-center justify-center gap-1.5 py-2 transition-colors"
            >
              <X size={14} /> Discard all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples */}
      {items.length === 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Try these examples</h3>
          <div className="flex flex-wrap gap-2">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-border hover:bg-border/70 text-gray-200 hover:text-text-primary transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's log */}
      {entries.length > 0 && items.length === 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-100 mb-3">
            Today's log ({entries.length} items)
          </h3>
          <div className="space-y-2">
            {entries.slice(-5).reverse().map(e => (
              <div key={e.id} className="flex items-center justify-between bg-surface rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0">{getMealEmoji(e.mealType)}</span>
                  <span className="text-sm font-semibold text-white truncate">{e.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{e.amount}</span>
                </div>
                <div className="flex items-baseline gap-1 ml-3 flex-shrink-0">
                  <span className="text-lg font-bold text-white">{e.calories}</span>
                  <span className="text-sm text-gray-400">kcal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
