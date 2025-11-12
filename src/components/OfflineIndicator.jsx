import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';

/**
 * OfflineIndicator - Shows connection status icon in header
 * Always visible, shows offline state with red icon
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial state - check on mount
    setIsOnline(navigator.onLine);

    // Handle online event - update service worker and reload
    const handleOnline = async () => {
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
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
              <Wifi className="h-5 w-5" />
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
