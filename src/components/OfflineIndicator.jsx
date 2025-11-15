import { useEffect, useState, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';

/**
 * OfflineIndicator - Shows connection status icon in header
 * Uses browser events + periodic checks when offline for reliable detection
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Verify actual connectivity
    const checkConnection = async () => {
      if (!navigator.onLine) {
        if (isMountedRef.current) setIsOnline(false);
        return false;
      }
      
      try {
        await fetch('/favicon.svg', { 
          method: 'HEAD', 
          cache: 'no-cache',
          signal: AbortSignal.timeout(2000)
        });
        if (isMountedRef.current) setIsOnline(true);
        return true;
      } catch {
        if (isMountedRef.current) setIsOnline(false);
        return false;
      }
    };

    // Start/stop polling based on connection status
    const startPolling = () => {
      if (intervalRef.current) return; // Already polling
      intervalRef.current = setInterval(async () => {
        const connected = await checkConnection();
        if (connected) {
          stopPolling(); // Stop polling once back online
        }
      }, 3000); // Check every 3 seconds when offline
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Check on mount and start polling if offline
    checkConnection().then(connected => {
      if (!connected) startPolling();
    });

    const handleOnline = async () => {
      stopPolling();
      await checkConnection();
    };
    
    const handleOffline = () => {
      if (isMountedRef.current) setIsOnline(false);
      startPolling();
    };

    // Check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnection().then(connected => {
          if (!connected && !intervalRef.current) startPolling();
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      stopPolling();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
            className='cursor-default hover:bg-transparent'
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
