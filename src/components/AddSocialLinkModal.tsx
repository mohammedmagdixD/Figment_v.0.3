import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'motion/react';
import { X, MagnifyingGlass, CaretLeft } from '@phosphor-icons/react';
import { SOCIAL_PLATFORMS } from '../constants/socialPlatforms';
import { UserSocial } from '../types/user';
import { upsertUserSocials } from '../services/supabaseData';
import { haptics } from '../utils/haptics';

import { SocialIcon } from './SocialIcon';

interface AddSocialLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentCount: number;
  onAdd: (social: UserSocial) => void;
}

export function AddSocialLinkModal({ isOpen, onClose, userId, currentCount, onAdd }: AddSocialLinkModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [handle, setHandle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [sheetState, setSheetState] = useState<'half' | 'full'>('half');
  const dragControls = useDragControls();

  useEffect(() => {
    if (isOpen) {
      setSheetState('half');
    }
  }, [isOpen]);

  const handleClose = () => {
    setStep(1);
    setSearchQuery('');
    setSelectedPlatform(null);
    setHandle('');
    onClose();
  };

  const filteredPlatforms = Object.entries(SOCIAL_PLATFORMS).filter(([id, def]) => 
    def.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered platforms by category
  const groupedPlatforms = filteredPlatforms.reduce((acc, [id, def]) => {
    if (!acc[def.category]) acc[def.category] = [];
    acc[def.category].push({ id, ...def });
    return acc;
  }, {} as Record<string, any[]>);

  const handleSave = async () => {
    if (!selectedPlatform || !handle.trim()) return;
    
    setIsSaving(true);
    try {
      let finalUrl = handle.trim();

      const newSocial = {
        id: crypto.randomUUID(),
        user_id: userId,
        platform: selectedPlatform,
        url: finalUrl,
        position: currentCount
      };

      await upsertUserSocials([newSocial]);
      onAdd(newSocial);
      handleClose();
    } catch (error) {
      console.error('Failed to add social link:', error);
      // Could add toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocityY = info.velocity.y;
    const offsetY = info.offset.y;

    if (sheetState === 'half') {
      if (velocityY < -500 || offsetY < -50) {
        setSheetState('full');
        haptics.light();
      } else if (velocityY > 500 || offsetY > 50) {
        handleClose();
      }
    } else if (sheetState === 'full') {
      if (velocityY > 500 || offsetY > 50) {
        handleClose();
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
              if (sheetState === 'half') handleClose();
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
            {step === 2 ? (
              <button
                onClick={() => setStep(1)}
                className="p-2 -ml-2 rounded-full hover:bg-secondary-system-background text-label transition-colors"
              >
                <CaretLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-9" /> // Spacer
            )}
            <h2 className="text-lg font-bold text-label">
              {step === 1 ? 'Add Link' : SOCIAL_PLATFORMS[selectedPlatform!]?.name}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 rounded-full hover:bg-secondary-system-background text-secondary-label transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className={`flex-1 hide-scrollbar overlay-content ${sheetState === 'full' ? 'overflow-y-auto' : 'overflow-hidden'}`}
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
            {step === 1 ? (
              <div className="p-4 pb-8">
                <div className="relative mb-6">
                  <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-label" />
                  <input
                    type="text"
                    placeholder="Search platforms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-secondary-system-background border border-separator rounded-2xl py-3 pl-11 pr-4 text-base font-sans text-label placeholder:text-secondary-label focus:outline-none focus:ring-2 focus:ring-label/10 transition-all"
                  />
                </div>

                <div className="space-y-5">
                  {Object.entries(groupedPlatforms).map(([category, platforms]) => (
                    <div key={category}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-px bg-separator"></div>
                        <h3 className="text-[11px] font-semibold text-secondary-label uppercase tracking-wider">
                          {category}
                        </h3>
                        <div className="flex-1 h-px bg-separator"></div>
                      </div>
                      <div className="space-y-2">
                        {platforms.map(p => {
                          const Icon = p.icon;
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedPlatform(p.id);
                                setStep(2);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 rounded-full border border-separator hover:bg-secondary-system-background transition-colors text-left"
                            >
                              <SocialIcon icon={Icon} className="w-5 h-5 text-label shrink-0" />
                              <p className="text-label font-medium text-[15px]">{p.name}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-label mb-2">
                    {selectedPlatform === 'personal_website' ? 'Website URL' : 'Username / Handle'}
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder={selectedPlatform === 'personal_website' ? 'https://example.com' : '@username'}
                    className="w-full bg-secondary-system-background border border-separator rounded-xl p-3 text-label placeholder:text-tertiary-label focus:outline-none focus:ring-2 focus:ring-label/10 transition-all"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={!handle.trim() || isSaving}
                  className="w-full py-4 rounded-2xl bg-label text-system-background font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
                >
                  {isSaving ? 'Saving...' : 'Save Link'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
