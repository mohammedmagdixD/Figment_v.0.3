import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface IOSDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export function IOSDatePicker({ value, onChange }: IOSDatePickerProps) {
  const [viewDate, setViewDate] = useState(() => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = useMemo(() => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (newDate > today) return; // Prevent future dates
    
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-light dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl p-3.5 text-base font-sans text-ink-black dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-black/10 dark:focus:ring-white/10 transition-all text-left flex justify-between items-center"
      >
        <span>{monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-black/5 dark:border-white/10 p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-light dark:hover:bg-[#2C2C2E] rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-ink-black dark:text-white" />
            </button>
            <div className="font-sans font-semibold text-base text-ink-black dark:text-white">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-light dark:hover:bg-[#2C2C2E] rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-ink-black dark:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray dark:text-ios-gray-1 uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const isFuture = dateObj > today;
              const isSelected = dateObj.getTime() === selectedDate.getTime();
              const isToday = dateObj.getTime() === today.getTime();

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleSelectDate(day)}
                  className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center text-sm font-sans transition-colors
                    ${isFuture ? 'text-gray/30 dark:text-ios-gray-1/30 cursor-not-allowed' : 'hover:bg-light dark:hover:bg-[#2C2C2E] text-ink-black dark:text-white'}
                    ${isSelected ? 'bg-ink-black dark:bg-white text-white dark:text-ink-black hover:bg-ink-black dark:hover:bg-white' : ''}
                    ${!isSelected && isToday ? 'text-blue-500 dark:text-ios-blue font-semibold' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
