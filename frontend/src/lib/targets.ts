import { DayType, DailyTarget } from '@/types';

export const TARGETS_STORAGE_KEY = 'nutrilog-targets';

type TargetsMap = Record<DayType, DailyTarget>;

export const DEFAULT_TARGETS: TargetsMap = {
  training: {
    calories: 2800,
    protein: 190,
    carbs: 341,
    fat: 75,
    label: 'Training Day',
  },
  active: {
    calories: 2600,
    protein: 190,
    carbs: 314,
    fat: 65,
    label: 'Active Day',
  },
  rest: {
    calories: 2400,
    protein: 190,
    carbs: 264,
    fat: 65,
    label: 'Rest Day',
  },
};

// Mon/Wed/Thu = active, Tue/Fri = training, Sat/Sun = rest
export function getDayType(date: Date): DayType {
  const day = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  if (day === 2 || day === 5) return 'training';
  if (day === 1 || day === 3 || day === 4) return 'active';
  return 'rest';
}

export function getTargetForDate(dateStr: string, targets: TargetsMap = DEFAULT_TARGETS): DailyTarget {
  const date = new Date(dateStr + 'T12:00:00');
  return targets[getDayType(date)];
}

export function getDefaultMealType(): string {
  const hour = new Date().getHours();
  if (hour >= 6  && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'snacks';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snacks'; // 21:00–06:00
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
