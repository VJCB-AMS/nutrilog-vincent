import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toFixed(decimals);
}

export function getProgressColor(percent: number): string {
  if (percent >= 100) return '#EF4444';
  if (percent >= 85) return '#F59E0B';
  return '#818CF8';
}

export function getMealEmoji(mealType: string): string {
  const map: Record<string, string> = {
    breakfast: '🍳',
    lunch: '🥗',
    dinner: '🍽️',
    snacks: '🍎',
  };
  return map[mealType] || '🍽️';
}
