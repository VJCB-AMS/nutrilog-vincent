import { motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, MessageSquare, Scan,
  BarChart3, SlidersHorizontal, Plus,
} from 'lucide-react';
import { Tab } from '@/App';
import { cn } from '@/lib/utils';

const DESKTOP_NAV_ITEMS = [
  { id: 'dashboard' as Tab, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'log'       as Tab, label: 'Log',       icon: <BookOpen size={20} /> },
  { id: 'chat'      as Tab, label: 'AI Chat',   icon: <MessageSquare size={20} /> },
  { id: 'barcode'   as Tab, label: 'Scan',      icon: <Scan size={20} /> },
  { id: 'weekly'    as Tab, label: 'Weekly',    icon: <BarChart3 size={20} /> },
  { id: 'settings'  as Tab, label: 'Targets',   icon: <SlidersHorizontal size={20} /> },
];


interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onOpenLog: () => void;
}

export default function Navigation({ activeTab, onTabChange, onOpenLog }: Props) {
  // "active" for mobile purposes — log-related tabs all highlight the Log button area
  const logTabs: Tab[] = ['log', 'chat', 'barcode'];

  return (
    <>
      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div
          className="border-t border-white/[0.06] pb-safe"
          style={{ background: 'rgba(10,10,26,0.95)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)' }}
        >
          <div className="grid grid-cols-4 items-end px-2 py-2 gap-1">

            <MobileNavItem
              id="dashboard"
              label="Home"
              icon={<LayoutDashboard size={22} />}
              active={activeTab === 'dashboard'}
              onClick={() => onTabChange('dashboard')}
            />

            {/* Log — primary action */}
            <button
              onClick={onOpenLog}
              className="flex flex-col items-center gap-1 py-2 rounded-2xl relative"
              style={{
                background: logTabs.includes(activeTab)
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.30) 0%, rgba(6,182,212,0.20) 100%)'
                  : 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
              }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: '#fff' }}>
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold tracking-wide" style={{ color: '#fff' }}>Log</span>
            </button>

            <MobileNavItem
              id="weekly"
              label="Weekly"
              icon={<BarChart3 size={22} />}
              active={activeTab === 'weekly'}
              onClick={() => onTabChange('weekly')}
            />

            <MobileNavItem
              id="settings"
              label="Targets"
              icon={<SlidersHorizontal size={22} />}
              active={activeTab === 'settings'}
              onClick={() => onTabChange('settings')}
            />

          </div>
        </div>
      </nav>

      {/* ── Desktop side nav ──────────────────────────────── */}
      <nav
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-24 flex-col items-center py-6 border-r border-border"
        style={{ background: 'rgba(10,10,26,0.96)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="mb-6">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden shadow-glow">
            <div className="absolute inset-0 bg-gradient-accent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-black text-base tracking-tighter">NL</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 w-full px-2">
          {DESKTOP_NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={cn(
                'relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 w-full',
                activeTab === item.id
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
              )}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="nav-active-desktop"
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.10) 100%)',
                    border: '1px solid rgba(124,58,237,0.22)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {item.icon}
              <span className="text-[9px] font-semibold leading-none tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

function MobileNavItem({
  id, label, icon, active, onClick,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200',
        active ? 'text-accent' : 'text-[#6B6B8A]'
      )}
      style={{ background: 'rgba(255,255,255,0.035)' }}
    >
      {active && (
        <motion.div
          layoutId="nav-active-mobile"
          className="absolute inset-0 rounded-2xl -z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(6,182,212,0.12) 100%)',
            border: '1px solid rgba(124,58,237,0.28)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative">{icon}</span>
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  );
}
