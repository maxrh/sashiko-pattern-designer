import { useEffect, useState } from 'react';
import { Badge } from './ui/badge.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.tsx';

export default function VersionBadge() {
  const [appVersion, setAppVersion] = useState(null);
  const [buildTime, setBuildTime] = useState(null);

  useEffect(() => {
    // Load version from localStorage
    try {
      const stored = localStorage.getItem('app_version');
      if (stored) {
        const versionData = JSON.parse(stored);
        setAppVersion(versionData.version);
        setBuildTime(versionData.buildTime);
      }
    } catch (e) {
      console.log('Could not read version');
    }
    
    // Listen for version updates from service worker
    const handleVersionUpdate = (event) => {
      const versionData = event.detail;
      setAppVersion(versionData.version);
      setBuildTime(versionData.buildTime);
    };
    
    window.addEventListener('versionUpdated', handleVersionUpdate);
    return () => window.removeEventListener('versionUpdated', handleVersionUpdate);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-xs font-mono">
            {appVersion ? `v${appVersion}` : '···'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div>Build: {buildTime ? new Date(buildTime).toLocaleString() : '···'}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
