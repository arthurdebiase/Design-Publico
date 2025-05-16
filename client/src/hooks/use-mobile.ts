import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile sized
 * Returns true if screen width is less than 768px (standard tablet breakpoint)
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to update state based on window width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Clean up event listener on unmount
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}