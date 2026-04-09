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
    { id: 'recommendations', icon: Sparkles, label: 'For You' },
    { id: 'feed', icon: LayoutGrid, label: 'Feed' },
    { id: 'add', icon: Plus, label: 'Add' },
    { id: 'diary', icon: Book, label: 'Diary' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 sm:absolute z-40 bg-[var(--system-background)]/80 backdrop-blur-[20px] border-t border-[var(--separator)] pb-safe-bottom sm:pb-5"
    >
      <div className="flex items-center justify-around h-[60px] px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isAdd = tab.id === 'add';

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`relative flex flex-col items-center justify-center w-16 h-full gap-1 ${isAdd ? '-mt-4' : ''}`}
            >
              {isAdd ? (
                <div className="w-12 h-12 rounded-full bg-ios-blue flex items-center justify-center shadow-md text-white">
                  <Icon className="w-6 h-6" strokeWidth={2.5} />
                </div>
              ) : (
                <>
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-300 ${
                      isActive ? 'text-ios-blue' : 'text-[var(--secondary-label)]'
                    }`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span 
                    className={`text-[10px] font-medium transition-colors duration-300 ${
                      isActive ? 'text-ios-blue' : 'text-[var(--secondary-label)]'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -top-[1px] left-3 right-3 h-[2px] bg-ios-blue rounded-b-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
