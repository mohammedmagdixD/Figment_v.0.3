import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig, useDragControls } from 'motion/react';
import { Star, Heart, Repeat, Bold, Italic, Link as LinkIcon, EyeOff, Loader2, Check, ArrowUp } from 'lucide-react';
import { SearchResult } from '../services/api';
import { haptics } from '../utils/haptics';
import { useScrollLock } from '../hooks/useScrollLock';

interface LogMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SearchResult | null;
  onSave: (item: SearchResult, details: { rating: number, date: string, liked: boolean, rewatched: boolean, reviewText?: string, hasSpoilers?: boolean }) => Promise<void> | void;
}

export function LogMediaModal({ isOpen, onClose, item, onSave }: LogMediaModalProps) {
  useScrollLock(isOpen);

  const getLocalDateString = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  const [sheetState, setSheetState] = useState<'half' | 'full'>('half');
  const [rating, setRating] = useState(0);
  const [displayRating, setDisplayRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [rewatched, setRewatched] = useState(false);
  const [date, setDate] = useState(getLocalDateString());
  const [reviewText, setReviewText] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);

  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [viewportTop, setViewportTop] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const initialHeight = useRef(window.innerHeight);

  // Visual Viewport tracking
  useEffect(() => {
    if (!isOpen) return;
    
    initialHeight.current = Math.max(initialHeight.current, window.innerHeight);
    
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        setViewportTop(window.visualViewport.offsetTop);
        setIsKeyboardOpen(window.visualViewport.height < initialHeight.current * 0.8);
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    handleResize();
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showErrorShake, setShowErrorShake] = useState(false);

  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isInteractingWithStars, setIsInteractingWithStars] = useState(false);

  const dragControls = useDragControls();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const ratingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const sheetStateRef = useRef(sheetState);
  const isKeyboardOpenRef = useRef(isKeyboardOpen);
  const historyDepthRef = useRef(0);

  useEffect(() => {
    sheetStateRef.current = sheetState;
  }, [sheetState]);

  useEffect(() => {
    isKeyboardOpenRef.current = isKeyboardOpen;
  }, [isKeyboardOpen]);

  // State Machine & Back Navigation
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modal: 'half' }, '');
    historyDepthRef.current = 1;

    const handlePopState = (e: PopStateEvent) => {
      if (isKeyboardOpenRef.current) {
        window.history.pushState({ modal: 'full' }, '');
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (sheetStateRef.current === 'full') {
        setSheetState('half');
        historyDepthRef.current = 1;
      } else {
        historyDepthRef.current = 0;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (historyDepthRef.current > 0) {
        window.history.go(-historyDepthRef.current);
        historyDepthRef.current = 0;
      }
    };
  }, [isOpen, onClose]);

  // Reset state on unmount
  useEffect(() => {
    if (!isOpen) {
      setSheetState('half');
      setRating(0);
      setDisplayRating(0);
      setLiked(false);
      setRewatched(false);
      setDate(getLocalDateString());
      setReviewText('');
      setHasSpoilers(false);
      setSaveState('idle');
      setShowErrorShake(false);
      setShowLinkPopover(false);
    }
  }, [isOpen]);

  const handleRatingChange = (newRating: number, isTap: boolean) => {
    if (newRating === rating) return;
    setRating(newRating);
    haptics.light();

    if (isTap) {
      let current = 0;
      clearInterval(ratingTimeoutRef.current);
      ratingTimeoutRef.current = setInterval(() => {
        current += 1;
        if (current >= newRating) {
          setDisplayRating(newRating);
          clearInterval(ratingTimeoutRef.current);
        } else {
          setDisplayRating(current);
        }
      }, 50);
    } else {
      setDisplayRating(newRating);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, x / width));
    const rawRating = percent * 5;
    let newRating = Math.ceil(rawRating * 2) / 2;
    if (newRating < 0) newRating = 0;
    if (newRating > 5) newRating = 5;
    handleRatingChange(newRating, false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsInteractingWithStars(true);
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, x / width));
    const rawRating = percent * 5;
    let newRating = Math.ceil(rawRating * 2) / 2;
    if (newRating < 0) newRating = 0;
    if (newRating > 5) newRating = 5;
    handleRatingChange(newRating, true);
  };

  const handlePointerUp = () => {
    setIsInteractingWithStars(false);
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const text = reviewText;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    setReviewText(`${before}${prefix}${selected}${suffix}${after}`);
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleOpenLinkPopover = () => {
    if (textAreaRef.current) {
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      if (start !== end) {
        setLinkText(reviewText.substring(start, end));
      } else {
        setLinkText('');
      }
    }
    setLinkUrl('');
    setShowLinkPopover(true);
  };

  const handleAddLink = () => {
    if (!linkUrl) return;
    const textToDisplay = linkText || linkUrl;
    const markdownLink = `[${textToDisplay}](${linkUrl})`;

    if (textAreaRef.current) {
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const before = reviewText.substring(0, start);
      const after = reviewText.substring(end);
      setReviewText(`${before}${markdownLink}${after}`);
    } else {
      setReviewText(prev => prev + markdownLink);
    }
    setShowLinkPopover(false);
  };

  const handleSave = async () => {
    if (!item) return;
    if (rating === 0) {
      haptics.error();
      setShowErrorShake(true);
      setTimeout(() => setShowErrorShake(false), 500);
      return;
    }

    setSaveState('loading');
    try {
      await onSave(item, {
        rating,
        date,
        liked,
        rewatched,
        reviewText: reviewText.trim() || undefined,
        hasSpoilers
      });
      setSaveState('success');
      haptics.success();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setSaveState('error');
      haptics.error();
      setTimeout(() => setSaveState('idle'), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-overlay backdrop-blur-[10px] z-[60]"
            onClick={() => {
              if (sheetState === 'half') onClose();
            }}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
          />
          <motion.div
            initial={{ y: viewportHeight }}
            animate={{ 
              y: sheetState === 'full' 
                ? (isKeyboardOpen ? viewportTop : viewportTop + viewportHeight - (initialHeight.current * 0.9)) 
                : viewportTop + viewportHeight - (initialHeight.current * 0.45)
            }}
            exit={{ y: viewportHeight + viewportTop }}
            style={{
              top: 0,
              height: isKeyboardOpen ? viewportHeight : initialHeight.current * 0.9,
            }}
            transition={{ 
              type: "spring", 
              damping: 28, 
              stiffness: 300, 
              mass: 0.8 
            }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: sheetState === 'full' ? (isKeyboardOpen ? viewportTop : viewportTop + viewportHeight - (initialHeight.current * 0.9)) : viewportTop + viewportHeight - (initialHeight.current * 0.45) }}
            onDragEnd={(e, { offset, velocity }) => {
              const velocityY = velocity.y;
              const offsetY = offset.y;

              if (sheetState === 'half') {
                if (velocityY < -500 || offsetY < -50) {
                  window.history.pushState({ modal: 'full' }, '');
                  historyDepthRef.current = 2;
                  setSheetState('full');
                  haptics.light();
                } else if (velocityY > 500 || offsetY > 50) {
                  haptics.light();
                  window.history.back();
                }
              } else {
                if (velocityY > 500 || offsetY > 150) {
                  haptics.light();
                  window.history.back();
                }
              }
            }}
            className="fixed inset-x-0 z-[60] bg-secondary-system-background rounded-t-[32px] shadow-2xl flex flex-col sm:max-w-[428px] sm:mx-auto"
          >
            {/* Drag Handle */}
            <div 
              className="w-full flex justify-center pt-3 pb-3 shrink-0 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-separator rounded-full pointer-events-none" />
            </div>

            <MotionConfig transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}>
              <div className="flex-1 overflow-y-auto px-5 pb-24 hide-scrollbar flex flex-col relative">
                <motion.div layout className={`grid relative w-full ${
                  sheetState === 'full'
                    ? 'grid-cols-[48px_1fr_auto] gap-x-3 gap-y-1 mb-6'
                    : 'grid-cols-[80px_1fr_auto] gap-x-4 gap-y-5 mb-4'
                }`}>
                  {/* Full State Divider */}
                  <motion.div layout className={`absolute -bottom-4 left-0 right-0 h-[1px] bg-separator origin-center ${
                    sheetState === 'full' ? 'opacity-100' : 'opacity-0'
                  }`} />

                  {/* POSTER */}
                  <motion.img layout src={item.image || undefined} alt={item.title} className={`object-cover rounded-xl shadow-sm bg-tertiary-system-background origin-top-left ${
                    sheetState === 'full' ? 'col-start-1 row-start-1 row-span-2 w-12 h-16' : 'col-start-1 row-start-1 w-20 h-28'
                  }`} />

                  {/* TITLE & SUBTITLE */}
                  <motion.div layout className={`flex flex-col min-w-0 origin-left ${
                    sheetState === 'full' ? 'col-start-2 row-start-1 self-end' : 'col-start-2 col-span-2 row-start-1 self-center'
                  }`}>
                    <motion.h3 layout className={`font-sans font-semibold text-label ${
                      sheetState === 'full' ? 'text-base truncate' : 'text-xl line-clamp-2'
                    }`}>{item.title}</motion.h3>
                    <motion.p layout className={`font-sans text-secondary-label truncate ${
                      sheetState === 'full' ? 'text-xs' : 'text-base'
                    }`}>{item.subtitle}</motion.p>
                  </motion.div>

                  {/* DATE PICKER */}
                  <motion.div layout className={`relative origin-right ${
                    sheetState === 'full' ? 'col-start-3 row-start-1 self-end justify-self-end' : 'col-start-3 row-start-3 self-center justify-self-end'
                  }`} whileTap={{ scale: 0.95 }}>
                    <motion.div layout className={`bg-tertiary-system-background font-sans text-label pointer-events-none ${
                      sheetState === 'full' ? 'px-2 py-1 text-[11px] font-medium rounded-md' : 'px-3 py-1.5 text-sm rounded-lg'
                    }`}>
                      {date ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: sheetState === 'full' ? undefined : 'numeric' }) : 'Select Date'}
                    </motion.div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </motion.div>

                  {/* STARS */}
                  <motion.div
                    layout
                    animate={{
                      scale: isInteractingWithStars ? (sheetState === 'full' ? 0.68 : 1.05) : (sheetState === 'full' ? 0.65 : 1),
                      ...(showErrorShake ? { x: [-10, 10, -10, 10, 0] } : {})
                    }}
                    transition={showErrorShake ? { duration: 0.4 } : { type: "spring", stiffness: 400, damping: 25 }}
                    ref={starsRef}
                    className={`flex gap-1 touch-none cursor-pointer origin-left w-max ${
                      sheetState === 'full' ? 'col-start-2 row-start-2 self-start pt-0.5' : 'col-start-1 col-span-2 row-start-2 self-center'
                    }`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={(e) => { if (e.buttons > 0) handlePointerMove(e); }}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    aria-label="Star Rating"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="relative w-8 h-8 pointer-events-none">
                        <Star className="absolute inset-0 w-8 h-8 text-separator fill-transparent" />
                        <div
                          className="absolute inset-0 overflow-hidden transition-all duration-100 ease-out"
                          style={{ width: displayRating >= star ? '100%' : displayRating >= star - 0.5 ? '50%' : '0%' }}
                        >
                          <Star className="w-8 h-8 text-label fill-label max-w-none" />
                        </div>
                      </div>
                    ))}
                  </motion.div>

                  {/* QUICK ACTIONS (Like/Rewatch) */}
                  <motion.div layout className={`flex items-center origin-right ${
                    sheetState === 'full' ? 'col-start-3 row-start-2 self-start justify-self-end gap-1.5 pt-0.5' : 'col-start-3 row-start-2 self-center justify-self-end gap-3'
                  }`}>
                    <motion.button
                      layout
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { haptics.light(); setLiked(!liked); }}
                      className={`rounded-full flex items-center justify-center transition-colors ${liked ? 'bg-ios-red/10' : 'bg-tertiary-system-background'} ${sheetState === 'full' ? 'w-8 h-8' : 'w-10 h-10'}`}
                      aria-label="Like"
                    >
                      <Heart className={`${liked ? 'fill-ios-red text-ios-red' : 'text-secondary-label'} ${sheetState === 'full' ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </motion.button>
                    {(item.type === 'movie' || item.type === 'tv' || item.type === 'anime') && (
                      <motion.button
                        layout
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { haptics.light(); setRewatched(!rewatched); }}
                        className={`rounded-full flex items-center justify-center transition-colors ${rewatched ? 'bg-ios-blue/10' : 'bg-tertiary-system-background'} ${sheetState === 'full' ? 'w-8 h-8' : 'w-10 h-10'}`}
                        aria-label="Rewatch"
                      >
                        <Repeat className={`${rewatched ? 'text-ios-blue' : 'text-secondary-label'} ${sheetState === 'full' ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      </motion.button>
                    )}
                  </motion.div>

                  {/* DATE LABEL */}
                  <motion.span layout className={`font-sans text-label text-base origin-left ${
                    sheetState === 'full' ? 'opacity-0 absolute pointer-events-none scale-90' : 'col-start-1 col-span-2 row-start-3 self-center opacity-100 scale-100'
                  }`}>Date</motion.span>

                </motion.div>

                {/* Review Canvas */}
                <textarea
                  ref={textAreaRef}
                  value={reviewText}
                  onChange={(e) => {
                    if (e.target.value.length <= 10000) {
                      setReviewText(e.target.value);
                    }
                  }}
                  onFocus={() => {
                    if (sheetState === 'half') {
                      window.history.pushState({ modal: 'full' }, '');
                      historyDepthRef.current = 2;
                      setSheetState('full');
                    }
                  }}
                  placeholder={`What did you think of ${item.title}?`}
                  className="flex-1 w-full bg-transparent border-none outline-none resize-none font-sans text-lg text-label placeholder:text-secondary-label"
                />
              </div>
            </MotionConfig>

            {/* Toolbar & FAB */}
            <div
              className="absolute left-0 right-0 px-4 py-3 flex items-center justify-end border-t border-separator bg-secondary-system-background sm:max-w-[428px] sm:mx-auto"
              style={{
                bottom: 0,
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(12px + env(safe-area-inset-bottom))'
              }}
            >
              <AnimatePresence>
                {sheetState === 'full' && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{
                      visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
                      hidden: { opacity: 0, transition: { duration: 0.15 } }
                    }}
                    className="absolute left-4 flex items-center gap-1 z-10"
                  >
                    <motion.button variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} whileTap={{ scale: 0.9 }} onPointerDown={(e) => e.preventDefault()} onClick={() => insertFormatting('**')} className="p-2 rounded-lg text-secondary-label hover:bg-tertiary-system-background hover:text-label transition-colors" aria-label="Bold">
                      <Bold className="w-5 h-5" />
                    </motion.button>
                    <motion.button variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} whileTap={{ scale: 0.9 }} onPointerDown={(e) => e.preventDefault()} onClick={() => insertFormatting('*')} className="p-2 rounded-lg text-secondary-label hover:bg-tertiary-system-background hover:text-label transition-colors" aria-label="Italic">
                      <Italic className="w-5 h-5" />
                    </motion.button>
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="relative">
                      <motion.button whileTap={{ scale: 0.9 }} onPointerDown={(e) => e.preventDefault()} onClick={handleOpenLinkPopover} className="p-2 rounded-lg text-secondary-label hover:bg-tertiary-system-background hover:text-label transition-colors" aria-label="Insert Link">
                        <LinkIcon className="w-5 h-5" />
                      </motion.button>
                      {showLinkPopover && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowLinkPopover(false)}
                          />
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-2 w-64 bg-system-background rounded-xl shadow-xl border border-separator p-3 z-50 flex flex-col gap-2"
                          >
                            <input
                              type="url"
                              placeholder="https://..."
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              className="w-full bg-secondary-system-background rounded-lg px-3 py-2 text-sm text-label outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Text to display"
                              value={linkText}
                              onChange={(e) => setLinkText(e.target.value)}
                              className="w-full bg-secondary-system-background rounded-lg px-3 py-2 text-sm text-label outline-none"
                            />
                            <div className="flex justify-end gap-2 mt-1">
                              <button onClick={() => setShowLinkPopover(false)} className="px-3 py-1.5 text-sm text-secondary-label">Cancel</button>
                              <button onClick={handleAddLink} className="px-3 py-1.5 text-sm bg-label text-system-background rounded-lg font-medium">Add</button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </motion.div>
                    <motion.button
                      variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
                      whileTap={{ scale: 0.9 }}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => setHasSpoilers(!hasSpoilers)}
                      className={`p-2 rounded-lg transition-colors ${hasSpoilers ? 'bg-amber-500/10 text-amber-500' : 'text-secondary-label hover:bg-tertiary-system-background hover:text-label'}`}
                      aria-label="Spoiler Toggle"
                    >
                      <EyeOff className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                layout
                onClick={handleSave}
                initial={false}
                animate={{
                  borderRadius: sheetState === 'full' ? 24 : 12,
                  ...(showErrorShake ? { x: [-10, 10, -10, 10, 0] } : {})
                }}
                transition={{ 
                  borderRadius: { duration: 0.15, ease: "easeOut" },
                  layout: { type: "spring", damping: 30, stiffness: 350, mass: 0.8 },
                  x: { duration: 0.4 }
                }}
                className={`flex items-center justify-center text-system-background font-medium transition-colors ml-auto overflow-hidden
                  ${sheetState === 'full' ? 'w-12 h-12' : 'w-full h-14 text-base'}
                  ${saveState === 'success' ? '!bg-green-500' : ''}
                  ${saveState === 'error' ? '!bg-ios-red' : ''}
                  ${showErrorShake ? '!bg-ios-red' : 'bg-label'}
                `}
              >
                <AnimatePresence mode="wait">
                  {saveState === 'loading' ? (
                    <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </motion.div>
                  ) : saveState === 'success' ? (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : sheetState === 'full' ? (
                    <motion.div key="full" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                      <ArrowUp className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div key="half" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                      Save to Diary
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
          {/* Error Toast */}
          <AnimatePresence>
            {saveState === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ios-red text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-[70]"
              >
                Failed to save. Please try again.
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
