import { motion } from 'motion/react';
import { User, Book, Plus, LayoutGrid, Sparkles } from 'lucide-react';
import { haptics } from '../utils/haptics';

export type TabType = 'recommendations' | 'feed' | 'add' | 'diary' | 'profile';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const handleTabChange = (tab: TabType) => {
    if (activeTab !== tab) {
      if (tab === 'add') {
        haptics.medium();
      } else {
        haptics.light();
      }
      onTabChange(tab);
    }
  };

  const tabs = [
    { id: 'recommendations', icon: Sparkles, label: 'For You', width: 105 },
    { id: 'feed', icon: LayoutGrid, label: 'Feed', width: 85 },
    { id: 'add', icon: Plus, label: 'Add', width: 80 },
    { id: 'diary', icon: Book, label: 'Diary', width: 85 },
    { id: 'profile', icon: User, label: 'Profile', width: 95 },
  ] as const;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="flex items-center gap-1 p-1 bg-[var(--secondary-system-background)]/80 backdrop-blur-2xl border border-[var(--separator)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-full pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              animate={{ width: isActive ? tab.width : 44 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              className="relative flex items-center justify-center h-11 rounded-full outline-none tap-highlight-transparent overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute inset-0 bg-[var(--label)] rounded-full"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              
              <div className="relative z-10 flex items-center justify-center gap-1.5 px-3 w-full">
                <Icon 
                  className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                    isActive ? 'text-[var(--system-background)]' : 'text-[var(--secondary-label)]'
                  }`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.3, type: "spring", bounce: 0 }}
                    className="text-sm font-semibold text-[var(--system-background)] whitespace-nowrap"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
