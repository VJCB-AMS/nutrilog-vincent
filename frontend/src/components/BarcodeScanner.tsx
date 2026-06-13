import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Check, X, Camera, CameraOff } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { FoodEntry, MealType } from '@/types';
import { lookupBarcode } from '@/lib/api';
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

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export default function BarcodeScanner({ selectedDate, onAdd }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<Partial<FoodEntry> | null>(null);
  const [mealType, setMealType] = useState<MealType>((getDefaultMealType() as MealType) || 'breakfast');
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editScanned, setEditScanned] = useState<Partial<FoodEntry> | null>(null);

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      try {
        // BrowserMultiFormatReader doesn't expose reset directly; reassigning stops the stream
        (readerRef.current as any).reset?.();
      } catch { /* ignore */ }
      readerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => stopScanner();
  }, [stopScanner]);

  const handleBarcode = useCallback(async (code: string) => {
    stopScanner();
    setLoading(true);
    setError('');
    try {
      const result = await lookupBarcode(code);
      if (result) {
        setScanned(result);
        setEditScanned({ ...result, mealType });
      } else {
        setError(`Product not found for barcode: ${code}. Try entering manually.`);
      }
    } catch {
      setError('Failed to lookup barcode. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [mealType, stopScanner]);

  const startScanner = async () => {
    setError('');
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      setScanning(true);

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const deviceId = devices.find(d => d.label.toLowerCase().includes('back'))?.deviceId
        || devices[0]?.deviceId;

      if (!deviceId) {
        setError('No camera found. Try manual entry.');
        setScanning(false);
        return;
      }

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current!,
        (result, err) => {
          if (result) {
            handleBarcode(result.getText());
          }
        }
      );
    } catch (err) {
      setError('Camera access denied or unavailable.');
      setScanning(false);
    }
  };

  const handleManualLookup = async () => {
    if (!manualBarcode.trim()) return;
    await handleBarcode(manualBarcode.trim());
  };

  const handleConfirm = async () => {
    if (!editScanned) return;
    await onAdd({
      date: selectedDate,
      mealType: (editScanned.mealType as MealType) || mealType,
      name: editScanned.name || 'Unknown',
      calories: Number(editScanned.calories) || 0,
      protein: Number(editScanned.protein) || 0,
      carbs: Number(editScanned.carbs) || 0,
      fat: Number(editScanned.fat) || 0,
      amount: editScanned.amount || '1 serving',
    });
    setScanned(null);
    setEditScanned(null);
    setManualBarcode('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Scan size={20} className="text-accent" />
          Barcode Scanner
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Scan a product barcode or enter it manually. Uses Open Food Facts database.
        </p>
      </div>

      {/* Meal selector */}
      <div className="flex gap-2 flex-wrap">
        {MEALS.map(m => (
          <button
            key={m}
            onClick={() => setMealType(m)}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all ${
              mealType === m ? 'bg-accent text-white' : 'bg-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {getMealEmoji(m)} {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Camera preview */}
      <div className="card overflow-hidden">
        <div className="relative aspect-video bg-black rounded-t-2xl overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${scanning ? '' : 'hidden'}`}
          />
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera size={48} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-muted text-sm">Camera not active</p>
              </div>
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-accent rounded-lg w-48 h-24 opacity-70" />
            </div>
          )}
        </div>
        <div className="p-4 flex gap-2">
          <button
            onClick={scanning ? stopScanner : startScanner}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              scanning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'btn-primary'
            }`}
          >
            {scanning ? (
              <><CameraOff size={18} /> Stop Scanner</>
            ) : (
              <><Camera size={18} /> Start Camera</>
            )}
          </button>
        </div>
      </div>

      {/* Manual entry */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Manual Barcode Entry</h3>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Enter barcode number"
            value={manualBarcode}
            onChange={e => setManualBarcode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
          />
          <button
            onClick={handleManualLookup}
            disabled={loading || !manualBarcode.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Scan size={18} />
            )}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-3 py-2">{error}</div>
        )}
      </div>

      {/* Result */}
      <AnimatePresence>
        {editScanned && (
          <motion.div
            className="card p-4 border-green-nutrilog/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-nutrilog inline-block" />
              Product Found — Review & Edit
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Product Name</label>
                  <input
                    className="input-field"
                    value={editScanned.name || ''}
                    onChange={e => setEditScanned(p => p ? { ...p, name: e.target.value } : p)}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Serving Size</label>
                  <input
                    className="input-field"
                    value={editScanned.amount || ''}
                    onChange={e => setEditScanned(p => p ? { ...p, amount: e.target.value } : p)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Meal</label>
                <select
                  className="input-field"
                  value={(editScanned.mealType as string) || mealType}
                  onChange={e => setEditScanned(p => p ? { ...p, mealType: e.target.value as MealType } : p)}
                >
                  {MEALS.map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['calories', 'protein', 'carbs', 'fat'] as const).map(field => (
                  <div key={field}>
                    <label className="text-xs text-text-muted mb-1 block capitalize">
                      {field}{field !== 'calories' ? ' (g)' : ''}
                    </label>
                    <input
                      className="input-field"
                      type="number"
                      value={(editScanned[field] as number) || 0}
                      onChange={e => setEditScanned(p => p ? { ...p, [field]: Number(e.target.value) } : p)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleConfirm} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Check size={16} /> Log Food
                </button>
                <button onClick={() => { setScanned(null); setEditScanned(null); }} className="btn-ghost flex items-center gap-1">
                  <X size={16} /> Discard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
