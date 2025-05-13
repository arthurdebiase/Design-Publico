import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface ScrollToTopProps {
  children?: React.ReactNode;
}

/**
 * ScrollToTop component that scrolls the window to the top
 * whenever the route changes
 */
export default function ScrollToTop({ children }: ScrollToTopProps) {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top when the location changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // Using 'auto' instead of 'smooth' for immediate reset
    });
  }, [location]);

  return <>{children}</>;
}