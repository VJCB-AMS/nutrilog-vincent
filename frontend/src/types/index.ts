export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  amount: string;
  createdAt: string;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  label: string;
}

export type DayType = 'training' | 'active' | 'rest';

export interface WeekDay {
  date: string;
  label: string;
  dayType: DayType;
  totals: DailyTotals;
  target: DailyTarget;
}
