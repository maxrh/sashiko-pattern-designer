import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';

/**
 * OfflineIndicator - Shows connection status icon in header
 * Always visible, shows offline state with red icon
 */
export default function OfflineIndicator() {
  // Initialize with actual connection state to avoid flash
  const [isOnline, setIsOnline] = useState(() => {
    // Check if navigator is available (SSR safety)
    const initialState = typeof navigator !== 'undefined' ? navigator.onLine : true;
    console.log('🌐 OfflineIndicator INITIAL STATE:', initialState, 'navigator.onLine:', typeof navigator !== 'undefined' ? navigator.onLine : 'undefined');
    return initialState;
  });

  useEffect(() => {
    // Perform a real network test to verify connection status
    const testConnection = async () => {
      try {
        // Try to fetch a small resource with no-cache to test real connectivity
        const response = await fetch('/favicon.svg', {
          method: 'HEAD',
          cache: 'no-store',
          mode: 'no-cors'
        });
        console.log('🌐 Network test PASSED - setting online');
        setIsOnline(true);
      } catch (error) {
        console.log('🌐 Network test FAILED - setting offline');
        setIsOnline(false);
      }
    };

    // Initial network test
    testConnection();

    // Also sync with navigator.onLine as backup
    const currentState = navigator.onLine;
    console.log('🌐 OfflineIndicator MOUNT CHECK:', currentState, 'current isOnline state:', isOnline);
    
    // If navigator says offline, trust it immediately
    if (!currentState) {
      setIsOnline(false);
    }

    // Handle online event - update service worker and reload
    const handleOnline = async () => {
      console.log('🌐 ONLINE EVENT FIRED');
      setIsOnline(true);
      
      // Force service worker to check for updates
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            // Force update check
            await registration.update();
            
            // If there's a waiting service worker, activate it immediately
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              // Reload page to get latest version
              window.location.reload();
            }
          }
        } catch (error) {
          console.error('Error updating service worker:', error);
        }
      }
    };

    // Handle offline event
    const handleOffline = () => {
      console.log('🌐 OFFLINE EVENT FIRED');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  console.log('🌐 OfflineIndicator RENDER:', isOnline ? 'ONLINE' : 'OFFLINE');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={isOnline ? 'Online' : 'Offline'}
          >
            {isOnline ? (
              <Wifi className="h-5 w-5 text-ring" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOnline ? 'Online' : 'Working offline'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
