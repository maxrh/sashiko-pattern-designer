import { useEffect, useState, useCallback } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';

/**
 * OfflineIndicator - Shows connection status icon in header
 * Uses navigator.onLine + periodic connectivity tests for accuracy
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Test actual network connectivity (not just navigator.onLine)
  const testConnectivity = useCallback(async () => {
    if (!navigator.onLine) return false;
    
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 2000);
      
      await fetch('/favicon.svg', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  // Update connection status
  const updateConnectionStatus = useCallback(async () => {
    const connected = await testConnectivity();
    setIsOnline(connected);
    return connected;
  }, [testConnectivity]);

  useEffect(() => {
    // Test connectivity on mount
    updateConnectionStatus();

    // Handle browser online/offline events
    const handleOnline = async () => {
      const actuallyOnline = await updateConnectionStatus();
      
      // Auto-update service worker when back online
      if (actuallyOnline && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          } else {
            await registration?.update();
          }
        } catch (error) {
          console.error('Service worker update failed:', error);
        }
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check ONLY when offline (to detect when back online)
    const interval = setInterval(async () => {
      // Only check if we think we're offline
      if (!isOnline) {
        const connected = await testConnectivity();
        if (connected) {
          setIsOnline(true);
          // Trigger online handler when we detect we're back online
          handleOnline();
        }
      }
    }, 5000); // Check every 5 seconds when offline

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateConnectionStatus, testConnectivity, isOnline]); // Add isOnline to dependencies

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
