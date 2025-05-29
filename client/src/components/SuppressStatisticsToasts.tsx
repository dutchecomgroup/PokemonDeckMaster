import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

/**
 * Component that suppresses toast notifications when on the statistics page
 * This prevents the annoying "Loading your cards" popups
 */
const SuppressStatisticsToasts: React.FC = () => {
  const [location] = useLocation();
  const { toast, dismiss } = useToast();
  
  useEffect(() => {
    // Check if we're on the statistics page
    const isStatsPage = location === '/statistics';
    
    if (isStatsPage) {
      // Create a function to intercept toast calls
      const originalToast = toast;
      
      // Replace the toast function with our custom one that filters out loading messages
      (window as any).__suppressToasts = true;
      
      // Dismiss any existing toasts
      dismiss();
      
      return () => {
        // Restore normal toast behavior when leaving stats page
        (window as any).__suppressToasts = false;
      };
    }
  }, [location, toast, dismiss]);
  
  return null;
};

export default SuppressStatisticsToasts;