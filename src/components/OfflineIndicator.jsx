import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * OfflineIndicator - Shows connection status to user
 * Displays when offline or connection restored
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);

    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showToast) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg transition-all"
      style={{
        backgroundColor: isOnline ? '#10b981' : '#ef4444',
        color: 'white',
      }}
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <span className="font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" />
          <span className="font-medium">Working offline</span>
        </>
      )}
    </div>
  );
}
