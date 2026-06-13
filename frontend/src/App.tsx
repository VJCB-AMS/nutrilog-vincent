import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import LogSheet from '@/components/LogSheet';
import InstallPrompt from '@/components/InstallPrompt';
import Dashboard from '@/components/Dashboard';
import ChatLogger from '@/components/ChatLogger';
import FoodLog from '@/components/FoodLog';
import BarcodeScanner from '@/components/BarcodeScanner';
import WeeklyOverview from '@/components/WeeklyOverview';
import Settings from '@/components/Settings';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { FoodEntry } from '@/types';
import { getEntries, addEntry, deleteEntry, updateEntry } from '@/lib/api';
import { getTodayString } from '@/lib/targets';

export type Tab = 'dashboard' | 'log' | 'chat' | 'barcode' | 'weekly' | 'settings';

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [loading, setLoading] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEntries(selectedDate);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAdd = async (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => {
    try {
      const newEntry = await addEntry(entry);
      setEntries(prev => [...prev, newEntry]);
    } catch (err) {
      console.error('Failed to add entry:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Omit<FoodEntry, 'id' | 'createdAt'>>) => {
    try {
      const updated = await updateEntry(id, updates);
      setEntries(prev => prev.map(e => e.id === id ? updated : e));
    } catch (err) {
      console.error('Failed to update entry:', err);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit:    { opacity: 0, y: -6, filter: 'blur(2px)' },
  };

  const renderTab = () => {
    const props = {
      entries,
      selectedDate,
      onAdd: handleAdd,
      onDelete: handleDelete,
      onUpdate: handleUpdate,
      onDateChange: setSelectedDate,
      onNavigate: setActiveTab,
      loading,
    };

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard {...props} />;
      case 'log':
        return <FoodLog {...props} />;
      case 'chat':
        return <ChatLogger {...props} />;
      case 'barcode':
        return <BarcodeScanner {...props} />;
      case 'weekly':
        return <WeeklyOverview selectedDate={selectedDate} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 md:pl-24 max-w-4xl mx-auto w-full px-4 pt-safe-extra content-area">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenLog={() => setLogSheetOpen(true)}
      />
      <LogSheet
        open={logSheetOpen}
        onClose={() => setLogSheetOpen(false)}
        onNavigate={setActiveTab}
      />
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}
