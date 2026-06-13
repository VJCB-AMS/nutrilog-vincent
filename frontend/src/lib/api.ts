import { FoodEntry } from '@/types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export async function getEntries(date: string): Promise<FoodEntry[]> {
  const res = await fetch(`${BASE}/entries/${date}`);
  if (!res.ok) throw new Error('Failed to fetch entries');
  return res.json();
}

export async function getWeekEntries(date: string): Promise<FoodEntry[]> {
  const res = await fetch(`${BASE}/entries/week/${date}`);
  if (!res.ok) throw new Error('Failed to fetch week entries');
  return res.json();
}

export async function addEntry(entry: Omit<FoodEntry, 'id' | 'createdAt'>): Promise<FoodEntry> {
  const res = await fetch(`${BASE}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Failed to add entry');
  return res.json();
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`${BASE}/entries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entry');
}

export async function updateEntry(id: string, updates: Partial<Omit<FoodEntry, 'id' | 'createdAt'>>): Promise<FoodEntry> {
  const res = await fetch(`${BASE}/entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function parseFood(text: string, mealType: string): Promise<Partial<FoodEntry>[]> {
  const res = await fetch(`${BASE}/ai/parse-food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mealType }),
  });
  if (!res.ok) throw new Error('Failed to parse food');
  return res.json();
}

export async function lookupBarcode(barcode: string): Promise<Partial<FoodEntry> | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const nutriments = p.nutriments || {};
    const servingSize = p.serving_size || '100g';

    return {
      name: p.product_name || p.product_name_en || 'Unknown Product',
      calories: Math.round(nutriments['energy-kcal_serving'] || nutriments['energy-kcal_100g'] || 0),
      protein: Math.round((nutriments['proteins_serving'] || nutriments['proteins_100g'] || 0) * 10) / 10,
      carbs: Math.round((nutriments['carbohydrates_serving'] || nutriments['carbohydrates_100g'] || 0) * 10) / 10,
      fat: Math.round((nutriments['fat_serving'] || nutriments['fat_100g'] || 0) * 10) / 10,
      amount: servingSize,
    };
  } catch {
    return null;
  }
}
