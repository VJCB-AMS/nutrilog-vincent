import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, RotateCcw, Save, Check, Lock, Unlock } from 'lucide-react';
import { DayType } from '@/types';
import { useSettings, TargetsMap } from '@/contexts/SettingsContext';
import { DEFAULT_TARGETS } from '@/lib/targets';

type GramForm = Record<DayType, { calories: string; protein: string; carbs: string; fat: string }>;
type ToggleMode = 'g' | 'pct';

const DAY_TYPES: { key: DayType; emoji: string; tint: string }[] = [
  { key: 'training', emoji: '💪', tint: '#7C3AED' },
  { key: 'active',   emoji: '🏃', tint: '#06B6D4' },
  { key: 'rest',     emoji: '🧘', tint: '#818CF8' },
];

// carbs locked = carbs is residual (calculated), fat is free
// carbs unlocked = fat is residual (calculated), carbs is free
function calcCarbs(cal: number, p: number, f: number) {
  return Math.max(0, Math.round((cal - p * 4 - f * 9) / 4));
}
function calcFat(cal: number, p: number, c: number) {
  return Math.max(0, Math.round((cal - p * 4 - c * 4) / 9));
}

function toGramForm(t: TargetsMap): GramForm {
  return {
    training: { calories: String(t.training.calories), protein: String(t.training.protein), carbs: String(t.training.carbs), fat: String(t.training.fat) },
    active:   { calories: String(t.active.calories),   protein: String(t.active.protein),   carbs: String(t.active.carbs),   fat: String(t.active.fat)   },
    rest:     { calories: String(t.rest.calories),     protein: String(t.rest.protein),     carbs: String(t.rest.carbs),     fat: String(t.rest.fat)     },
  };
}

const LOCKED_STYLE = {
  backgroundColor: 'rgba(129,140,248,0.06)',
  borderColor: 'rgba(129,140,248,0.22)',
  color: '#818cf8',
  cursor: 'default' as const,
};

export default function Settings() {
  const { targets, setTargets, resetTargets } = useSettings();
  const [form, setForm]           = useState<GramForm>(() => toGramForm(targets));
  const [modes, setModes]         = useState<Record<DayType, ToggleMode>>({ training: 'g', active: 'g', rest: 'g' });
  const [carbsLocked, setCarbsLocked] = useState<Record<DayType, boolean>>({ training: true, active: true, rest: true });
  const [saved, setSaved]         = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Toggle which field is the residual
  const toggleLock = (dayType: DayType) => {
    setCarbsLocked(prev => ({ ...prev, [dayType]: !prev[dayType] }));
  };

  // Handle any editable gram field — always recalcs the locked residual
  const handleGramChange = (dayType: DayType, field: 'calories' | 'protein' | 'carbs' | 'fat', value: string) => {
    setSaved(false);
    setForm(prev => {
      const cur = prev[dayType];
      const isLocked = carbsLocked[dayType];
      const cal = field === 'calories' ? (parseInt(value) || 0) : (parseInt(cur.calories) || 0);
      const p   = field === 'protein'  ? (parseInt(value) || 0) : (parseInt(cur.protein)  || 0);
      const c   = field === 'carbs'    ? (parseInt(value) || 0) : (parseInt(cur.carbs)    || 0);
      const f   = field === 'fat'      ? (parseInt(value) || 0) : (parseInt(cur.fat)      || 0);
      return {
        ...prev,
        [dayType]: isLocked
          ? { calories: field === 'calories' ? value : cur.calories, protein: field === 'protein' ? value : cur.protein, carbs: String(calcCarbs(cal, p, f)), fat: field === 'fat' ? value : cur.fat }
          : { calories: field === 'calories' ? value : cur.calories, protein: field === 'protein' ? value : cur.protein, carbs: field === 'carbs' ? value : cur.carbs, fat: String(calcFat(cal, p, c)) },
      };
    });
  };

  // Handle % mode inputs — converts pct→grams then recalcs residual
  const handlePctChange = (dayType: DayType, field: 'proteinPct' | 'carbsPct' | 'fatPct', value: string) => {
    setSaved(false);
    setForm(prev => {
      const cur = prev[dayType];
      const isLocked = carbsLocked[dayType];
      const cal = parseInt(cur.calories) || 0;
      const pct = Math.max(0, parseFloat(value) || 0);
      let p = parseInt(cur.protein) || 0;
      let c = parseInt(cur.carbs)   || 0;
      let f = parseInt(cur.fat)     || 0;
      if (field === 'proteinPct') p = Math.max(0, Math.round(pct / 100 * cal / 4));
      if (field === 'carbsPct')   c = Math.max(0, Math.round(pct / 100 * cal / 4));
      if (field === 'fatPct')     f = Math.max(0, Math.round(pct / 100 * cal / 9));
      return {
        ...prev,
        [dayType]: isLocked
          ? { calories: cur.calories, protein: String(p), carbs: String(calcCarbs(cal, p, f)), fat: String(f) }
          : { calories: cur.calories, protein: String(p), carbs: String(c), fat: String(calcFat(cal, p, c)) },
      };
    });
  };

  const handleSave = () => {
    const newTargets: TargetsMap = {
      training: { ...DEFAULT_TARGETS.training, calories: parseInt(form.training.calories) || DEFAULT_TARGETS.training.calories, protein: parseInt(form.training.protein) || DEFAULT_TARGETS.training.protein, carbs: parseInt(form.training.carbs) || DEFAULT_TARGETS.training.carbs, fat: parseInt(form.training.fat) || DEFAULT_TARGETS.training.fat },
      active:   { ...DEFAULT_TARGETS.active,   calories: parseInt(form.active.calories)   || DEFAULT_TARGETS.active.calories,   protein: parseInt(form.active.protein)   || DEFAULT_TARGETS.active.protein,   carbs: parseInt(form.active.carbs)   || DEFAULT_TARGETS.active.carbs,   fat: parseInt(form.active.fat)   || DEFAULT_TARGETS.active.fat   },
      rest:     { ...DEFAULT_TARGETS.rest,     calories: parseInt(form.rest.calories)     || DEFAULT_TARGETS.rest.calories,     protein: parseInt(form.rest.protein)     || DEFAULT_TARGETS.rest.protein,     carbs: parseInt(form.rest.carbs)     || DEFAULT_TARGETS.rest.carbs,     fat: parseInt(form.rest.fat)     || DEFAULT_TARGETS.rest.fat     },
    };
    setTargets(newTargets);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    resetTargets();
    setForm(toGramForm(DEFAULT_TARGETS));
    setCarbsLocked({ training: true, active: true, rest: true });
    setShowReset(false);
    setSaved(false);
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold pointer-events-none"
            style={{ backgroundColor: 'rgba(0,214,143,0.12)', border: '1px solid rgba(0,214,143,0.35)', color: '#00d68f', backdropFilter: 'blur(12px)' }}
          >
            <Check size={15} /> Targets saved!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon size={20} className="text-accent" />
          Macro Targets
        </h1>
        <p className="text-gray-400 text-sm mt-1">Daily nutrition goals per day type.</p>
      </div>

      {/* Day cards */}
      {DAY_TYPES.map(({ key, emoji, tint }) => {
        const mode      = modes[key];
        const isLocked  = carbsLocked[key];  // true = carbs residual; false = fat residual
        const cal = parseInt(form[key].calories) || 0;
        const p   = parseInt(form[key].protein)  || 0;
        const c   = parseInt(form[key].carbs)    || 0;
        const f   = parseInt(form[key].fat)      || 0;

        const proteinPct = cal > 0 ? Math.round(p * 4 / cal * 100) : 0;
        const carbsPct   = cal > 0 ? Math.round(c * 4 / cal * 100) : 0;
        const fatPct     = cal > 0 ? Math.round(f * 9 / cal * 100) : 0;

        // Renders a lock-toggle button on a field label
        const LockBtn = ({ field }: { field: 'carbs' | 'fat' }) => {
          const isThisLocked = field === 'carbs' ? isLocked : !isLocked;
          if (!isThisLocked) return null;
          return (
            <button
              onClick={() => toggleLock(key)}
              className="ml-1 flex-shrink-0 transition-opacity hover:opacity-70"
              title={`Click to ${field === 'carbs' ? 'unlock carbs / lock fat' : 'unlock fat / lock carbs'}`}
            >
              <Lock size={9} style={{ color: 'rgba(129,140,248,0.7)' }} />
            </button>
          );
        };

        return (
          <div key={key} className="card p-4 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none rounded-[1.25rem]"
              style={{ background: `linear-gradient(135deg, ${tint}22 0%, ${tint}06 100%)` }}
            />

            <div className="relative space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{emoji}</span>
                  <span className="font-semibold text-white">{DEFAULT_TARGETS[key].label}</span>
                </div>
                <div
                  className="flex rounded-lg overflow-hidden text-xs font-semibold"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {(['g', 'pct'] as ToggleMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setModes(prev => ({ ...prev, [key]: m }))}
                      className="px-2.5 py-1 transition-colors"
                      style={{
                        backgroundColor: mode === m ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.04)',
                        color: mode === m ? '#fff' : '#9ca3af',
                      }}
                    >
                      {m === 'g' ? 'g' : '%'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input grid */}
              <div className="grid grid-cols-4 gap-2">
                {/* Calories — always editable */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block text-gray-300">
                    Calories <span className="text-gray-400 font-normal">(kcal)</span>
                  </label>
                  <input
                    className="input-field text-center font-bold"
                    type="number"
                    min="0"
                    value={form[key].calories}
                    onChange={e => handleGramChange(key, 'calories', e.target.value)}
                  />
                </div>

                {/* Protein — always editable */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block text-gray-300">
                    Protein <span className="text-gray-400 font-normal">({mode === 'g' ? 'g' : '%'})</span>
                  </label>
                  <input
                    className="input-field text-center font-bold"
                    type="number"
                    min="0"
                    value={mode === 'g' ? form[key].protein : String(proteinPct)}
                    onChange={e =>
                      mode === 'g'
                        ? handleGramChange(key, 'protein', e.target.value)
                        : handlePctChange(key, 'proteinPct', e.target.value)
                    }
                  />
                </div>

                {/* Carbs — locked (residual) when isLocked=true, editable when isLocked=false */}
                <div>
                  <label className="text-xs font-medium mb-1.5 flex items-center gap-1">
                    {isLocked
                      ? <><span style={{ color: '#818cf8' }}>Carbs</span><span className="font-normal" style={{ color: 'rgba(129,140,248,0.65)' }}>({mode === 'g' ? 'g' : '%'})</span><LockBtn field="carbs" /></>
                      : <><span className="text-gray-300">Carbs</span><span className="text-gray-400 font-normal">({mode === 'g' ? 'g' : '%'})</span><LockBtn field="carbs" /></>
                    }
                  </label>
                  <input
                    className="input-field text-center font-bold"
                    type="number"
                    readOnly={isLocked}
                    tabIndex={isLocked ? -1 : undefined}
                    min="0"
                    value={mode === 'g' ? form[key].carbs : String(carbsPct)}
                    onChange={isLocked ? undefined : e =>
                      mode === 'g'
                        ? handleGramChange(key, 'carbs', e.target.value)
                        : handlePctChange(key, 'carbsPct', e.target.value)
                    }
                    style={isLocked ? LOCKED_STYLE : undefined}
                  />
                </div>

                {/* Fat — editable when isLocked=true, locked (residual) when isLocked=false */}
                <div>
                  <label className="text-xs font-medium mb-1.5 flex items-center gap-1">
                    {!isLocked
                      ? <><span style={{ color: '#818cf8' }}>Fat</span><span className="font-normal" style={{ color: 'rgba(129,140,248,0.65)' }}>({mode === 'g' ? 'g' : '%'})</span><LockBtn field="fat" /></>
                      : <><span className="text-gray-300">Fat</span><span className="text-gray-400 font-normal">({mode === 'g' ? 'g' : '%'})</span><LockBtn field="fat" /></>
                    }
                  </label>
                  <input
                    className="input-field text-center font-bold"
                    type="number"
                    readOnly={!isLocked}
                    tabIndex={!isLocked ? -1 : undefined}
                    min="0"
                    value={mode === 'g' ? form[key].fat : String(fatPct)}
                    onChange={!isLocked ? undefined : e =>
                      mode === 'g'
                        ? handleGramChange(key, 'fat', e.target.value)
                        : handlePctChange(key, 'fatPct', e.target.value)
                    }
                    style={!isLocked ? LOCKED_STYLE : undefined}
                  />
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* Macro percentage bars */}
              <div className="space-y-2">
                {[
                  { label: 'Protein', pct: proteinPct, color: '#818CF8' },
                  { label: 'Carbs',   pct: carbsPct,   color: '#34D399' },
                  { label: 'Fat',     pct: fatPct,     color: '#FB923C' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, backgroundColor: color }} />
                    <span className="text-xs text-gray-400 w-11 flex-shrink-0">{label}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-300 w-8 text-right flex-shrink-0">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <motion.button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ opacity: 0.9, transition: { duration: 0.15 } }}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span key="saved" className="flex items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <Check size={16} /> Saved!
              </motion.span>
            ) : (
              <motion.span key="save" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Save size={16} /> Save Changes
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {!showReset ? (
          <button onClick={() => setShowReset(true)} className="btn-ghost flex items-center gap-2 px-4">
            <RotateCcw size={16} /> Reset
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-semibold transition-all">
              Confirm
            </button>
            <button onClick={() => setShowReset(false)} className="btn-ghost text-sm">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
