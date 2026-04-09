import { useEffect } from 'react';

let lockCount = 0;

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const body = document.body;
    if (lockCount === 0) {
      body.classList.add('scroll-locked');
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) {
        body.classList.remove('scroll-locked');
      }
    };
  }, [isLocked]);
}
