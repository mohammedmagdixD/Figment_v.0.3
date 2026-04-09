import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function FeedView() {
  const parentRef = useRef<HTMLDivElement>(null);
  const items: any[] = []; // Placeholder for future feed items

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h2 className="font-serif text-2xl font-semibold text-[var(--label)]">Feed</h2>
      </div>
      
      <div ref={parentRef} className="flex-1 overflow-y-auto px-4 hide-scrollbar scroll-container">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <h2 className="font-serif text-2xl font-semibold text-[var(--label)] mb-2">
              Available Soon xD
            </h2>
            <p className="font-sans text-sm text-[var(--secondary-label)] max-w-[250px]">
              We're working hard to bring you a personalized feed of updates from your friends.
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Feed item will go here */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
