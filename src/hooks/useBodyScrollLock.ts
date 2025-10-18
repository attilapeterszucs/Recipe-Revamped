import { useEffect, useRef } from 'react';

/**
 * Hook to lock body scroll when a modal/popup is open
 * Prevents background page scrolling while modal is displayed
 *
 * @param isOpen - Whether the modal is currently open
 */
export const useBodyScrollLock = (isOpen: boolean): void => {
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    // Store current scroll position
    scrollPositionRef.current = window.scrollY;

    // Get the current body overflow to restore later
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';

    // Add padding to compensate for scrollbar removal (prevent layout shift)
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup function - restore scroll when modal closes
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;

      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [isOpen]);
};
