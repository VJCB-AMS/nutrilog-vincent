import { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { animate } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { FoodEntry, DailyTotals } from '@/types';
import { getTargetForDate, getDayType } from '@/lib/targets';
import { useSettings } from '@/contexts/SettingsContext';
import { Tab } from '@/App';

interface Props {
  entries: FoodEntry[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onNavigate: (tab: Tab) => void;
  loading: boolean;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef<number>(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prev.current;
    prev.current = value;
    if (from === value) { el.textContent = Math.round(value).toString(); return; }
    const ctrl = animate(from, value, {
      duration: 0.7,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: v => { if (el) el.textContent = Math.round(v).toString(); },
    });
    return () => ctrl.stop();
  }, [value]);

  return <span ref={ref} className={className}>{Math.round(value)}</span>;
}

function statusBg(pct: number): string | null {
  if (pct > 115) return 'rgba(239,68,68,0.07)';
  if (pct >= 95) return 'rgba(16,185,129,0.07)';
  if (pct >= 85) return 'rgba(245,158,11,0.07)';
  return null;
}

function ringCenterColor(pct: number): string {
  if (pct >= 100) return '#EF4444';
  if (pct >= 85) return '#F59E0B';
  return '#818CF8';
}

function MacroCard({
  label, value, target, unit, color, dotClass,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  dotClass: string;
}) {
  const rawPct = target > 0 ? (value / target) * 100 : 0;
  const fillPct = Math.min(rawPct, 100);
  const tint = statusBg(rawPct);
  const isOnTarget = rawPct >= 95 && rawPct <= 105;
  const barColor = isOnTarget ? '#10B981' : color;

  return (
    <motion.div
      className="card p-4 relative overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
    >
      {/* Status tint overlay — replaces fixed gradient tint */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[1.25rem]"
        style={{ background: tint ?? `linear-gradient(135deg, ${color}22 0%, ${color}06 100%)` }}
      />

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={dotClass} />
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</span>
        </div>

        <div className="mb-3">
          <AnimatedNumber value={value} className="text-3xl font-bold text-text-primary leading-none" />
          <span className="text-text-muted text-sm ml-1">{unit}</span>
        </div>

        {/* 8px progress bar */}
        <div
          className="rounded-full overflow-hidden mb-1.5"
          style={{ height: 8, background: 'rgba(255,255,255,0.05)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: barColor,
              width: `${fillPct}%`,
              boxShadow: `0 0 8px ${barColor}66`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          />
        </div>

        <div className="text-right">
          <span className="text-xs text-text-secondary">{target}{unit}</span>
        </div>
      </div>
    </motion.div>
  );
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  if (endDeg - startDeg >= 360) {
    // Full circle: two semicircles to avoid degenerate A command
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const xm = cx + r * Math.cos(toRad(startDeg + 180));
    const ym = cy + r * Math.sin(toRad(startDeg + 180));
    return `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${xm} ${ym} A ${r} ${r} 0 1 1 ${x1} ${y1}`;
  }
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function CalorieRing({
  caloriePercent, totalCalories, isNearGoal,
}: {
  caloriePercent: number;
  totalCalories: number;
  isNearGoal: boolean;
}) {
  const SIZE = 230;
  const CX = 115;
  const CY = 115;
  const R = 89;
  const SW = 28;

  const pct = Math.min(caloriePercent, 100);
  const hasFill = pct > 0;
  const fillEndAngle = -90 + (pct / 100) * 360;

  return (
    <div
      className="relative"
      style={{ width: SIZE, height: SIZE, filter: 'drop-shadow(0 8px 40px rgba(124,58,237,0.4))' }}
    >
      {isNearGoal && (
        <div
          className="absolute inset-0 rounded-full animate-ring-pulse pointer-events-none"
          style={{ border: '2px solid rgba(124,58,237,0.4)', boxShadow: '0 0 0 0 rgba(124,58,237,0.3)' }}
        />
      )}

      <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>
        <defs>
          {/* Purple → cyan color gradient along the arc, anchored to the ring's top-to-right sweep */}
          <linearGradient id="rg-fill" x1={CX} y1={CY - R} x2={CX + R} y2={CY} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          {/* Light-source overlay: bright highlight at 12 o'clock, fades to transparent */}
          <linearGradient id="rg-light" x1={CX} y1={CY - R} x2={CX} y2={CY + R * 0.6} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="rg-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
          </filter>
          {/* Dot flare: blurred halo composited beneath the sharp dot */}
          <filter id="rg-dot-glow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track — unfilled ring */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
        {/* Inner shadow — dark ring just inside inner edge, creates recessed groove */}
        <circle cx={CX} cy={CY} r={R - SW / 2 + 3} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={4} />
        {/* Outer edge highlight */}
        <circle cx={CX} cy={CY} r={R + SW / 2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        {/* Inner edge highlight */}
        <circle cx={CX} cy={CY} r={R - SW / 2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

        {hasFill && (
          <g>
            {/* Glow — blurred version of the arc, same gradient */}
            <path
              d={arcPath(CX, CY, R, -90, fillEndAngle)}
              fill="none"
              stroke="url(#rg-fill)"
              strokeWidth={SW + 8}
              opacity={0.55}
              filter="url(#rg-glow)"
            />
            {/* Filled arc — purple to cyan gradient */}
            <path
              d={arcPath(CX, CY, R, -90, fillEndAngle)}
              fill="none"
              stroke="url(#rg-fill)"
              strokeWidth={SW}
            />
            {/* Light-source overlay — simulates light hitting the top of the ring */}
            <path
              d={arcPath(CX, CY, R, -90, fillEndAngle)}
              fill="none"
              stroke="url(#rg-light)"
              strokeWidth={SW}
            />
            {/* Light-flare dot at 12 o'clock — blurred halo + sharp center */}
            <circle cx={CX} cy={CY - R} r={4} fill="white" opacity={0.85} filter="url(#rg-dot-glow)" />
          </g>
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <AnimatedNumber value={totalCalories} className="text-5xl font-bold text-white leading-none" />
        <span className="text-xs text-gray-300 mt-0.5">kcal</span>
        <span
          className="text-sm font-bold mt-1"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {caloriePercent}%
        </span>
      </div>
    </div>
  );
}

const MEAL_BAR_COLORS: Record<string, string> = {
  breakfast: '#FCD34D',
  lunch: '#34D399',
  dinner: '#7C3AED',
  snacks: '#FB923C',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

export default function Dashboard({ entries, selectedDate, onDateChange, onNavigate, loading }: Props) {
  const { targets } = useSettings();
  const target = getTargetForDate(selectedDate, targets);
  const dayType = getDayType(new Date(selectedDate + 'T12:00:00'));

  const totals = useMemo<DailyTotals>(() => {
    return entries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [entries]);

  const caloriePercent = target.calories > 0
    ? Math.round((totals.calories / target.calories) * 100)
    : 0;
  const caloriesLeft = Math.max(target.calories - Math.round(totals.calories), 0);
  const caloriesOver = Math.round(totals.calories) - target.calories;
  const isNearGoal = caloriePercent >= 80 && caloriePercent <= 102;

  const pieData = [
    { name: 'Protein', value: totals.protein * 4, color: '#818CF8' },
    { name: 'Carbs',   value: totals.carbs * 4,   color: '#34D399' },
    { name: 'Fat',     value: totals.fat * 9,     color: '#FB923C' },
  ];

  const mealGroups = useMemo(() => {
    const groups: Record<string, FoodEntry[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    entries.forEach(e => { if (groups[e.mealType]) groups[e.mealType].push(e); });
    return groups;
  }, [entries]);

  const mealCalories = (meal: string) =>
    mealGroups[meal]?.reduce((a, e) => a + e.calories, 0) || 0;

  const dayTypeColors: Record<string, string> = {
    training: 'text-carbs bg-carbs-bg',
    active: 'text-accent bg-accent/10',
    rest: 'text-accent-secondary bg-accent-secondary/10',
  };

  return (
    <div className="space-y-6">
      {/* ── Hero card ───────────────────────────────────── */}
      <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Greeting row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-text-secondary text-xs font-medium tracking-wide uppercase">{getGreeting()}</p>
            <h1 className="text-text-primary mt-0.5">
              <span className="text-2xl font-bold">Vincent</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dayTypeColors[dayType]}`}>
              {target.label}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => onDateChange(e.target.value)}
              className="input-field text-xs py-1.5 w-auto"
            />
          </div>
        </div>

        {/* Ring */}
        <div className="flex flex-col items-center gap-3 relative">
          {/* Ambient glow on card surface beneath the ring */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
            }}
          />
          <CalorieRing
            caloriePercent={caloriePercent}
            totalCalories={Math.round(totals.calories)}
            isNearGoal={isNearGoal}
          />

          {/* Hero remaining text */}
          {caloriesLeft > 0 ? (
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1.5">
                <AnimatedNumber value={caloriesLeft} className="text-5xl font-bold text-white leading-none" />
                <span className="text-sm text-gray-300">remaining</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-5xl font-bold leading-none" style={{ color: '#EF4444' }}>
                  +{caloriesOver}
                </span>
                <span className="text-xl font-bold" style={{ color: '#EF4444' }}>over</span>
              </div>
            </div>
          )}

          {/* Secondary: eaten · goal */}
          <p className="text-xs text-gray-400 -mt-1">
            {Math.round(totals.calories)} eaten · {target.calories} goal
          </p>
        </div>
      </motion.div>

      {/* ── Macro cards ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <MacroCard
          label="Protein" value={totals.protein} target={target.protein} unit="g"
          color="#818CF8" dotClass="macro-dot-protein"
        />
        <MacroCard
          label="Carbs" value={totals.carbs} target={target.carbs} unit="g"
          color="#34D399" dotClass="macro-dot-carbs"
        />
        <MacroCard
          label="Fat" value={totals.fat} target={target.fat} unit="g"
          color="#FB923C" dotClass="macro-dot-fat"
        />
      </div>

      {/* ── Meal breakdown ──────────────────────────────── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            Meal Breakdown
          </h2>
          <button
            onClick={() => onNavigate('log')}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="space-y-3">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map(meal => {
            const kcal = mealCalories(meal);
            const dotColor = MEAL_BAR_COLORS[meal];
            return (
              <div key={meal} className="flex items-center gap-3">
                {/* 8px colored dot */}
                <span
                  className="flex-shrink-0 rounded-full"
                  style={{ width: 8, height: 8, background: dotColor, boxShadow: `0 0 6px ${dotColor}88` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium capitalize text-text-primary">{meal}</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: kcal > 0 ? dotColor : '#35354A' }}
                    >
                      {kcal > 0 ? `${kcal} kcal` : '—'}
                    </span>
                  </div>
                  <div className="progress-bar-sm">
                    <motion.div
                      className="progress-fill"
                      style={{
                        backgroundColor: dotColor,
                        width: `${Math.min((kcal / target.calories) * 100, 100)}%`,
                        boxShadow: kcal > 0 ? `0 0 6px ${dotColor}55` : 'none',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((kcal / target.calories) * 100, 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center py-4 text-text-muted text-sm">Loading...</div>
      )}
    </div>
  );
}
