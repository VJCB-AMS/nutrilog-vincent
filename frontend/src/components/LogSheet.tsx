import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Scan, BookOpen, X } from 'lucide-react';
import { Tab } from '@/App';

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
}

const OPTIONS = [
  {
    tab: 'chat' as Tab,
    icon: <MessageSquare size={22} />,
    label: 'AI Chat',
    description: 'Describe your meal in natural language',
    color: '#7C3AED',
  },
  {
    tab: 'barcode' as Tab,
    icon: <Scan size={22} />,
    label: 'Scan Barcode',
    description: 'Scan a product barcode with your camera',
    color: '#06B6D4',
  },
];

export default function LogSheet({ open, onClose, onNavigate }: Props) {
  const go = (tab: Tab) => {
    onClose();
    setTimeout(() => onNavigate(tab), 130);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — mobile only */}
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
          >
            <div
              className="rounded-t-[2rem] border-t border-white/[0.07]"
              style={{
                background: 'rgba(13,13,32,0.98)',
                backdropFilter: 'blur(32px)',
                paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Log Food</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Choose how to add your meal</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-white/[0.06] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Options */}
              <div className="px-4 space-y-2.5 pb-2">
                {OPTIONS.map((opt, i) => (
                  <motion.button
                    key={opt.tab}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] text-left"
                    style={{ background: `${opt.color}12` }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.05, duration: 0.2 }}
                    onClick={() => go(opt.tab)}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ color: opt.color, background: `${opt.color}22` }}
                    >
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary text-sm">{opt.label}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{opt.description}</div>
                    </div>
                  </motion.button>
                ))}

                {/* Food log link */}
                <button
                  onClick={() => go('log')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 text-sm text-text-secondary hover:text-text-primary transition-colors border border-white/[0.04] rounded-2xl hover:bg-white/[0.025]"
                >
                  <BookOpen size={15} />
                  View food log
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
