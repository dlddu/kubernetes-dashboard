import { useState, useEffect } from 'react';

/**
 * Hook to track page visibility state (active/inactive tab)
 * @returns boolean - true if page is visible, false if hidden
 */
export function useVisibilityChange(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(
    () => document.visibilityState === 'visible'
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
