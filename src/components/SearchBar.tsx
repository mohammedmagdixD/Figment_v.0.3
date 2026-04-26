import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowLeft } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isFocused?: boolean;
  onFocusChange?: (focused: boolean) => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  onClear,
  placeholder = "Search...",
  isFocused: externalIsFocused,
  onFocusChange,
  showBackButton,
  onBackClick
}) => {
  const [internalFocused, setInternalFocused] = useState(false);
  const isFocused = externalIsFocused !== undefined ? externalIsFocused : internalFocused;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setInternalFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setInternalFocused(false);
    onFocusChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
      onSearch?.(query);
    }
  };

  const handleBack = () => {
    inputRef.current?.blur();
    if (onBackClick) {
      onBackClick();
    } else {
      setInternalFocused(false);
      onFocusChange?.(false);
      onQueryChange('');
      onClear?.();
    }
  };

  // Expose focus method if needed in the future

  return (
    <div className="flex items-center w-full">
      <AnimatePresence>
        {showBackButton && (
          <motion.button
            layout
            initial={{ opacity: 0, width: 0, marginRight: 0 }}
            animate={{ opacity: 1, width: 36, marginRight: 12 }}
            exit={{ opacity: 0, width: 0, marginRight: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleBack}
            className="flex-shrink-0 overflow-hidden flex items-center"
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary-system-background text-label shrink-0 hover:bg-tertiary-system-background transition-colors active:scale-95">
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
      
      <motion.div layout className="relative flex-1">
        <Search 
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-label cursor-pointer" 
          onClick={() => {
            inputRef.current?.blur();
            onSearch?.(query);
          }}
        />
        <input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-secondary-system-background border border-separator rounded-full py-2.5 pl-10 pr-4 text-sm font-sans text-label placeholder:text-secondary-label focus:outline-none focus:ring-2 focus:ring-label/10 transition-all shadow-sm"
        />
      </motion.div>
    </div>
  );
};
