import { useEffect, useState, useCallback, useRef } from 'react';
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
  const isOnlineRef = useRef(isOnline);

  // Keep ref in sync with state
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

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

  useEffect(() => {
    // Test connectivity on mount
    const checkConnection = async () => {
      const connected = await testConnectivity();
      setIsOnline(connected);
    };
    checkConnection();

    // Handle browser online/offline events
    const handleOnline = async () => {
      const connected = await testConnectivity();
      setIsOnline(connected);
      
      // Auto-update service worker when back online
      if (connected && 'serviceWorker' in navigator) {
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
      // Use ref to get current online status without dependency issues
      if (!isOnlineRef.current) {
        const connected = await testConnectivity();
        if (connected) {
          setIsOnline(true);
          handleOnline();
        }
      }
    }, 5000); // Check every 5 seconds when offline

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [testConnectivity])

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
