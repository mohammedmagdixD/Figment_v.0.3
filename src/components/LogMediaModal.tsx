import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const [sheetState, setSheetState] = useState<'half' | 'full'>('half');
  const [rating, setRating] = useState(0);
  const [displayRating, setDisplayRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [rewatched, setRewatched] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewText, setReviewText] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);

  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showErrorShake, setShowErrorShake] = useState(false);

  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const ratingTimeoutRef = useRef<NodeJS.Timeout>();

  // Visual Viewport tracking
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        setIsKeyboardOpen(window.visualViewport.height < window.innerHeight);
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize();
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [isOpen]);

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
        textAreaRef.current?.blur();
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
      setDate(new Date().toISOString().split('T')[0]);
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
            className="fixed inset-0 bg-black/40 backdrop-blur-[10px] z-[60]"
            onClick={() => {
              if (sheetState === 'half') onClose();
            }}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ 
              y: 0, 
              height: sheetState === 'full' ? viewportHeight : window.innerHeight * 0.55,
              bottom: window.innerHeight - viewportHeight
            }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 500) {
                if (sheetState === 'full' && offset.y < 300) {
                  window.history.back();
                  haptics.light();
                } else {
                  haptics.light();
                  if (sheetState === 'full') {
                     window.history.go(-2);
                  } else {
                     window.history.back();
                  }
                  onClose();
                }
              } else if (offset.y < -50 || velocity.y < -500) {
                if (sheetState === 'half') {
                  window.history.pushState({ modal: 'full' }, '');
                  historyDepthRef.current = 2;
                  setSheetState('full');
                  haptics.light();
                }
              }
            }}
            className="fixed inset-x-0 z-[60] bg-[var(--secondary-system-background)] rounded-t-[32px] shadow-2xl flex flex-col sm:max-w-[428px] sm:mx-auto"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-3 shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-[var(--separator)] rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-24 hide-scrollbar flex flex-col relative">
              {/* Header */}
              <motion.div
                animate={{
                  scale: sheetState === 'full' ? 0.9 : 1,
                  opacity: sheetState === 'full' ? 0.8 : 1,
                  transformOrigin: 'left center'
                }}
                className="flex gap-4 mb-6 shrink-0"
              >
                <img src={item.image || undefined} alt={item.title} className="w-20 h-28 object-cover rounded-xl shadow-sm bg-[var(--tertiary-system-background)]" />
                <div className="flex-1 py-1 flex flex-col justify-center">
                  <h3 className="font-serif font-semibold text-xl text-[var(--label)] line-clamp-2 mb-1">{item.title}</h3>
                  <p className="font-sans text-base text-[var(--secondary-label)]">{item.subtitle}</p>
                </div>
              </motion.div>

              <div className="h-[1px] bg-[var(--separator)] w-full mb-6 shrink-0" />

              {/* Quick Actions */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <motion.div
                  animate={showErrorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  ref={starsRef}
                  className="flex gap-1 touch-none cursor-pointer"
                  onPointerDown={handlePointerDown}
                  onPointerMove={(e) => {
                    if (e.buttons > 0) handlePointerMove(e);
                  }}
                  aria-label="Star Rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative w-8 h-8">
                      <Star className="absolute inset-0 w-8 h-8 text-[var(--separator)] fill-transparent" />
                      <div
                        className="absolute inset-0 overflow-hidden transition-all duration-100 ease-out"
                        style={{ width: displayRating >= star ? '100%' : displayRating >= star - 0.5 ? '50%' : '0%' }}
                      >
                        <Star className="w-8 h-8 text-[var(--label)] fill-[var(--label)] max-w-none" />
                      </div>
                    </div>
                  ))}
                </motion.div>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { haptics.light(); setLiked(!liked); }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${liked ? 'bg-ios-red/10' : 'bg-[var(--tertiary-system-background)]'}`}
                    aria-label="Like"
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-ios-red text-ios-red' : 'text-[var(--secondary-label)]'}`} />
                  </motion.button>
                  {(item.type === 'movie' || item.type === 'tv' || item.type === 'anime') && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { haptics.light(); setRewatched(!rewatched); }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${rewatched ? 'bg-ios-blue/10' : 'bg-[var(--tertiary-system-background)]'}`}
                      aria-label="Rewatch"
                    >
                      <Repeat className={`w-5 h-5 ${rewatched ? 'text-ios-blue' : 'text-[var(--secondary-label)]'}`} />
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="h-[1px] bg-[var(--separator)] w-full mb-6 shrink-0" />

              {/* Date Picker */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <span className="font-sans text-base text-[var(--label)]">Date</span>
                <div className="relative">
                  <div className="bg-[var(--tertiary-system-background)] px-3 py-1.5 rounded-lg font-sans text-sm text-[var(--label)] pointer-events-none">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>

              <div className="h-[1px] bg-[var(--separator)] w-full mb-6 shrink-0" />

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
                className="flex-1 w-full bg-transparent border-none outline-none resize-none font-serif text-lg text-[var(--label)] placeholder:text-[var(--secondary-label)]"
              />
            </div>

            {/* Toolbar & FAB */}
            <div
              className="absolute left-0 right-0 px-4 py-3 flex items-center justify-between border-t border-[var(--separator)] bg-[var(--secondary-system-background)] sm:max-w-[428px] sm:mx-auto"
              style={{
                bottom: 0,
                paddingBottom: isKeyboardOpen ? '12px' : 'calc(12px + env(safe-area-inset-bottom))'
              }}
            >
              <AnimatePresence>
                {sheetState === 'full' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-1 relative"
                  >
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => insertFormatting('**')} className="p-2 rounded-lg text-[var(--secondary-label)] hover:bg-[var(--tertiary-system-background)] hover:text-[var(--label)] transition-colors" aria-label="Bold">
                      <Bold className="w-5 h-5" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => insertFormatting('*')} className="p-2 rounded-lg text-[var(--secondary-label)] hover:bg-[var(--tertiary-system-background)] hover:text-[var(--label)] transition-colors" aria-label="Italic">
                      <Italic className="w-5 h-5" />
                    </motion.button>
                    <div className="relative">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={handleOpenLinkPopover} className="p-2 rounded-lg text-[var(--secondary-label)] hover:bg-[var(--tertiary-system-background)] hover:text-[var(--label)] transition-colors" aria-label="Insert Link">
                        <LinkIcon className="w-5 h-5" />
                      </motion.button>
                      {showLinkPopover && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--system-background)] rounded-xl shadow-xl border border-[var(--separator)] p-3 z-50 flex flex-col gap-2">
                          <input
                            type="url"
                            placeholder="https://..."
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="w-full bg-[var(--secondary-system-background)] rounded-lg px-3 py-2 text-sm text-[var(--label)] outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Text to display"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            className="w-full bg-[var(--secondary-system-background)] rounded-lg px-3 py-2 text-sm text-[var(--label)] outline-none"
                          />
                          <div className="flex justify-end gap-2 mt-1">
                            <button onClick={() => setShowLinkPopover(false)} className="px-3 py-1.5 text-sm text-[var(--secondary-label)]">Cancel</button>
                            <button onClick={handleAddLink} className="px-3 py-1.5 text-sm bg-[var(--label)] text-[var(--system-background)] rounded-lg font-medium">Add</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setHasSpoilers(!hasSpoilers)}
                      className={`p-2 rounded-lg transition-colors ${hasSpoilers ? 'bg-amber-500/10 text-amber-500' : 'text-[var(--secondary-label)] hover:bg-[var(--tertiary-system-background)] hover:text-[var(--label)]'}`}
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
                animate={showErrorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`flex items-center justify-center text-[var(--system-background)] font-medium transition-colors ml-auto
                  ${sheetState === 'full' ? 'w-12 h-12 rounded-full' : 'w-full py-4 rounded-xl text-base'}
                  ${saveState === 'success' ? '!bg-green-500' : ''}
                  ${saveState === 'error' ? '!bg-ios-red' : ''}
                  ${showErrorShake ? '!bg-ios-red' : 'bg-[var(--label)]'}
                `}
              >
                {saveState === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : saveState === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : sheetState === 'full' ? (
                  <ArrowUp className="w-6 h-6" />
                ) : (
                  'Save to Diary'
                )}
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
