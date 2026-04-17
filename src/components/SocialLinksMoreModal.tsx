import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { UserSocial } from '../types/user';
import { SOCIAL_PLATFORMS } from '../constants/socialPlatforms';
import { SocialIcon } from './SocialIcon';
import { haptics } from '../utils/haptics';

interface SocialLinksMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  socials: UserSocial[];
}

export function SocialLinksMoreModal({ isOpen, onClose, socials }: SocialLinksMoreModalProps) {
  const [sheetState, setSheetState] = useState<'half' | 'full'>('half');
  const dragControls = useDragControls();

  useEffect(() => {
    if (isOpen) {
      setSheetState('half');
    }
  }, [isOpen]);

  const getUrl = (social: UserSocial) => {
    if (social.platform === 'personal_website') {
      return social.url.split('||')[0];
    }
    const platformDef = SOCIAL_PLATFORMS[social.platform];
    if (!platformDef) return '#';
    return platformDef.urlTemplate.replace('{handle}', social.url);
  };

  // Group by category
  const groupedSocials = socials.reduce((acc, social) => {
    const platformDef = SOCIAL_PLATFORMS[social.platform];
    if (!platformDef) return acc;
    const category = platformDef.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(social);
    return acc;
  }, {} as Record<string, UserSocial[]>);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocityY = info.velocity.y;
    const offsetY = info.offset.y;

    if (sheetState === 'half') {
      if (velocityY < -500 || offsetY < -50) {
        setSheetState('full');
        haptics.light();
      } else if (velocityY > 500 || offsetY > 50) {
        onClose();
      }
    } else if (sheetState === 'full') {
      if (velocityY > 500 || offsetY > 50) {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              if (sheetState === 'half') onClose();
            }}
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
          />
          
          <motion.div
            initial="closed"
            animate={sheetState}
            exit="closed"
            variants={{
              closed: { y: '100%' },
              half: { y: '50%' },
              full: { y: '5%' }
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-system-background shadow-2xl overflow-hidden flex flex-col max-w-md rounded-t-[32px] sm:rounded-3xl h-[95vh] sm:h-[85vh] sm:max-h-[850px]"
          >
          {/* Dash Icon for dragging */}
          <div 
            className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-3 pb-3 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="w-12 h-1.5 bg-tertiary-label rounded-full" />
          </div>

          <div className="flex items-center justify-between p-4 pt-8 border-b border-separator shrink-0">
            <h2 className="text-xl font-bold text-label">All Links</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary-system-background text-secondary-label transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className={`flex-1 hide-scrollbar overlay-content px-4 pb-8 space-y-5 ${sheetState === 'full' ? 'overflow-y-auto' : 'overflow-hidden'}`}
            onPointerDown={(e) => {
              if (sheetState === 'half') {
                dragControls.start(e);
              }
            }}
            onWheel={(e) => {
              if (sheetState === 'half' && e.deltaY > 0) {
                setSheetState('full');
                haptics.light();
              }
            }}
          >
            <div className="pt-2 space-y-5">
              {Object.entries(groupedSocials).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-separator"></div>
                    <h3 className="text-[11px] font-semibold text-secondary-label uppercase tracking-wider">
                      {category}
                    </h3>
                    <div className="flex-1 h-px bg-separator"></div>
                  </div>
                  <div className="space-y-2">
                    {items.map(social => {
                      const platformDef = SOCIAL_PLATFORMS[social.platform];
                      const Icon = platformDef.icon;

                      return (
                        <a
                          key={social.id}
                          href={getUrl(social)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-4 py-3 rounded-full border border-separator hover:bg-secondary-system-background transition-colors"
                        >
                          <SocialIcon icon={Icon} className="w-5 h-5 text-label shrink-0" />
                          <p className="text-label font-medium text-[15px]">{platformDef.name}</p>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
