import React from 'react';
import { motion } from 'motion/react';
import { User, Book, Plus, LayoutGrid, Sparkles } from 'lucide-react';
import { haptics } from '../utils/haptics';

export type TabType = 'recommendations' | 'feed' | 'add' | 'diary' | 'profile';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'recommendations', icon: Sparkles, label: 'For You', width: 115 },
  { id: 'feed', icon: LayoutGrid, label: 'Feed', width: 95 },
  { id: 'add', icon: Plus, label: 'Add', width: 90 },
  { id: 'diary', icon: Book, label: 'Diary', width: 95 },
  { id: 'profile', icon: User, label: 'Profile', width: 105 },
] as const;

export const BottomTabBar = React.memo(function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
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

  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const activeTabConfig = tabs[activeIndex] || tabs[0];

  // Deterministic calculation of the active pill's position.
  // padding (6px) + (index * inactiveWidth (48px)) + (index * gap (6px))
  const pillLeft = 6 + (activeIndex * 48) + (activeIndex * 6);
  const pillWidth = activeTabConfig.width;

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <motion.div 
        layout
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        className="relative flex items-center gap-1.5 p-1.5 bg-system-background/80 backdrop-blur-3xl border border-separator shadow-sm rounded-full pointer-events-auto overflow-hidden"
      >
        {/* The sliding active background pill (Using GPU 'x' transform instead of 'left') */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 left-0 bg-label rounded-full z-0 origin-left"
          initial={false}
          animate={{ 
            x: pillLeft, 
            width: pillWidth 
          }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              initial={false}
              animate={{ width: isActive ? tab.width : 48 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              className="relative z-10 flex items-center justify-center h-12 rounded-full outline-none tap-highlight-transparent overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={tab.label}
            >
              <div className="flex items-center justify-center px-3 w-full h-full">
                <Icon 
                  className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                    isActive ? 'text-system-background' : 'text-secondary-label'
                  }`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                <motion.div
                  initial={false}
                  animate={{ 
                    width: isActive ? tab.width - 50 : 0,
                    opacity: isActive ? 1 : 0,
                    filter: isActive ? 'blur(0px)' : 'blur(4px)',
                    x: isActive ? 0 : -10,
                    marginLeft: isActive ? 6 : 0
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  className="overflow-hidden whitespace-nowrap flex items-center"
                >
                  <span className="text-sm font-semibold text-system-background">
                    {tab.label}
                  </span>
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
});
