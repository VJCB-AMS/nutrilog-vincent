import { createContext, useContext, useState, ReactNode } from 'react';
import { DayType, DailyTarget } from '@/types';
import { DEFAULT_TARGETS, TARGETS_STORAGE_KEY } from '@/lib/targets';

export type TargetsMap = Record<DayType, DailyTarget>;

interface SettingsContextValue {
  targets: TargetsMap;
  setTargets: (targets: TargetsMap) => void;
  resetTargets: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadStoredTargets(): TargetsMap {
  try {
    const stored = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as TargetsMap;
      // Merge with defaults to ensure label fields are always present
      return {
        training: { ...DEFAULT_TARGETS.training, ...parsed.training },
        active: { ...DEFAULT_TARGETS.active, ...parsed.active },
        rest: { ...DEFAULT_TARGETS.rest, ...parsed.rest },
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_TARGETS;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [targets, setTargetsState] = useState<TargetsMap>(loadStoredTargets);

  const setTargets = (newTargets: TargetsMap) => {
    setTargetsState(newTargets);
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(newTargets));
  };

  const resetTargets = () => {
    setTargetsState(DEFAULT_TARGETS);
    localStorage.removeItem(TARGETS_STORAGE_KEY);
  };

  return (
    <SettingsContext.Provider value={{ targets, setTargets, resetTargets }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
