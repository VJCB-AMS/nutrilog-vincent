import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { TrendingUp, Target, Award } from 'lucide-react';
import { FoodEntry, DailyTotals } from '@/types';
import { getWeekEntries } from '@/lib/api';
import { getTargetForDate, getDayType } from '@/lib/targets';
import { useSettings } from '@/contexts/SettingsContext';

interface Props {
  selectedDate: string;
}

interface DayData {
  date: string;
  label: string;
  shortLabel: string;
  totals: DailyTotals;
  target: number;
  proteinTarget: number;
  isToday: boolean;
}

export default function WeeklyOverview({ selectedDate }: Props) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getWeekEntries(selectedDate)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const { targets } = useSettings();
  const today = new Date().toISOString().split('T')[0];

  const weekData = useMemo<DayData[]>(() => {
    const days: DayData[] = [];
    const end = new Date(selectedDate + 'T12:00:00');

    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = entries.filter(e => e.date === dateStr);
      const target = getTargetForDate(dateStr, targets);

      const totals = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        shortLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        totals,
        target: target.calories,
        proteinTarget: target.protein,
        isToday: dateStr === today,
      });
    }
    return days;
  }, [entries, selectedDate, today, targets]);

  const avgCalories = Math.round(
    weekData.reduce((a, d) => a + d.totals.calories, 0) / weekData.filter(d => d.totals.calories > 0).length || 0
  );

  const daysOnTarget = weekData.filter(d => {
    if (d.totals.calories === 0) return false;
    const ratio = d.totals.calories / d.target;
    return ratio >= 0.9 && ratio <= 1.1;
  }).length;

  const avgProtein = Math.round(
    weekData.reduce((a, d) => a + d.totals.protein, 0) / weekData.filter(d => d.totals.protein > 0).length || 0
  );

  const calChartData = weekData.map(d => ({
    name: d.shortLabel,
    calories: Math.round(d.totals.calories),
    target: d.target,
    isToday: d.isToday,
  }));

  const macroChartData = weekData.map(d => ({
    name: d.shortLabel,
    protein: Math.round(d.totals.protein),
    carbs: Math.round(d.totals.carbs),
    fat: Math.round(d.totals.fat),
    isToday: d.isToday,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        backgroundColor: 'rgba(10, 10, 26, 0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}>
        <p style={{ fontWeight: 600, color: '#F0F0FF', marginBottom: 4 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill || p.color, margin: '2px 0' }}>
            {p.name}: {p.value} {p.name === 'calories' || p.name === 'target' ? 'kcal' : 'g'}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <TrendingUp size={20} className="text-accent" />
          Weekly Overview
        </h1>
        <p className="text-text-secondary text-sm mt-1">Last 7 days ending {selectedDate}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none rounded-[1.25rem]" style={{ background: 'linear-gradient(135deg, #6c63ff22 0%, #6c63ff06 100%)' }} />
          <div className="relative">
            <div className="text-4xl font-bold text-white leading-none">{avgCalories || '—'}</div>
            <div className="text-sm text-gray-300 mt-1.5">Avg Calories</div>
          </div>
        </div>
        <div className="card p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none rounded-[1.25rem]" style={{ background: 'linear-gradient(135deg, #00d68f22 0%, #00d68f06 100%)' }} />
          <div className="relative">
            <div className="text-4xl font-bold text-white leading-none">{daysOnTarget}</div>
            <div className="text-sm text-gray-300 mt-1.5">Days on Target</div>
          </div>
        </div>
        <div className="card p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none rounded-[1.25rem]" style={{ background: 'linear-gradient(135deg, #ff8c4222 0%, #ff8c4206 100%)' }} />
          <div className="relative">
            <div className="text-4xl font-bold text-white leading-none">{avgProtein || '—'}<span className="text-2xl">g</span></div>
            <div className="text-sm text-gray-300 mt-1.5">Avg Protein</div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5" />

      {/* Calorie chart */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Target size={14} className="text-accent" />
          Daily Calories vs Target
        </h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-text-muted text-sm">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={calChartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#d1d5db', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<CustomTooltip />}
                contentStyle={{ background: 'none', border: 'none', padding: 0 }}
                wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', outline: 'none' }}
              />
              <Bar dataKey="calories" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {calChartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isToday ? '#6c63ff' : (entry.calories >= entry.target * 0.9 && entry.calories <= entry.target * 1.1) ? '#00d68f' : entry.calories > 0 ? '#ff8c42' : '#1e1e2e'}
                  />
                ))}
              </Bar>
              <Bar dataKey="target" fill="transparent" stroke="#6c63ff" strokeWidth={1} strokeDasharray="4 4" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-300">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: '#00d68f' }} /> On target</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: '#ff8c42' }} /> Off target</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: '#6c63ff' }} /> Today</span>
        </div>
      </div>

      {/* Macro chart */}
      <div className="card p-4 mt-2">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Award size={14} className="text-carbs" />
          Daily Macros (g)
        </h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-text-muted text-sm">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={macroChartData} barGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#d1d5db', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<CustomTooltip />}
                contentStyle={{ background: 'none', border: 'none', padding: 0 }}
                wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', outline: 'none' }}
              />
              <Bar dataKey="protein" fill="#6c63ff" radius={[3, 3, 0, 0]} maxBarSize={14} />
              <Bar dataKey="carbs" fill="#00d68f" radius={[3, 3, 0, 0]} maxBarSize={14} />
              <Bar dataKey="fat" fill="#ff8c42" radius={[3, 3, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-300">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: '#6c63ff' }} /> Protein</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: '#00d68f' }} /> Carbs</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: '#ff8c42' }} /> Fat</span>
        </div>
      </div>

      {/* Day breakdown */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Day-by-Day Breakdown</h2>
        <div className="space-y-3">
          {weekData.map(day => {
            const pct = day.target > 0 ? Math.round((day.totals.calories / day.target) * 100) : 0;
            const dayType = getDayType(new Date(day.date + 'T12:00:00'));
            const dayTypeColor = dayType === 'training' ? 'text-carbs' : dayType === 'active' ? 'text-accent' : 'text-accent-secondary';

            return (
              <motion.div
                key={day.date}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${day.isToday ? 'bg-accent/10 border border-accent/20' : 'hover:bg-surface'}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="w-16 flex-shrink-0">
                  <div className={`text-xs font-semibold ${day.isToday ? 'text-accent' : 'text-text-secondary'}`}>
                    {day.shortLabel}
                  </div>
                  <div className={`text-xs ${dayTypeColor}`}>{dayType}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {day.totals.calories > 0 ? `${Math.round(day.totals.calories)} kcal` : 'No data'}
                    </span>
                    {day.totals.calories > 0 && (
                      <span className="text-xs font-semibold" style={{ color: pct >= 90 && pct <= 110 ? '#00d68f' : '#ff8c42' }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                  {day.totals.calories > 0 && (
                    <div className="progress-bar h-1.5">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: pct >= 90 && pct <= 110 ? '#00d68f' : '#ff8c42',
                        }}
                      />
                    </div>
                  )}
                </div>
                {day.totals.protein > 0 && (
                  <div className="text-right text-xs text-text-muted flex-shrink-0">
                    <div className="text-accent font-medium">{Math.round(day.totals.protein)}g P</div>
                    <div>{Math.round(day.totals.carbs)}g C</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
