import { useToast } from '@/hooks/use-toast';
import { isOnline } from '@/lib/offline-forms';
import { getPendingForms, syncOfflineForms } from '@/lib/offline-forms';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './button';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [online, setOnline] = useState(isOnline);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Update online status when it changes
  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnline(isOnline());
    };

    // Check pending forms count
    const checkPendingForms = async () => {
      const forms = await getPendingForms();
      setPendingCount(forms.length);
    };

    // Initial check
    updateOnlineStatus();
    checkPendingForms();

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check pending forms every 30 seconds
    const interval = setInterval(checkPendingForms, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  // Handle manual sync
  const handleSync = async () => {
    if (!online) {
      toast({
        title: 'Cannot sync while offline',
        description: 'Please connect to the internet and try again.',
        variant: 'destructive',
      });
      return;
    }

    setSyncing(true);
    try {
      const result = await syncOfflineForms();

      if (result.success > 0) {
        toast({
          title: 'Sync completed',
          description: `Successfully synced ${result.success} items. ${result.failed} failed.`,
          variant: 'default',
        });
      } else if (result.failed > 0) {
        toast({
          title: 'Sync issues',
          description: `Failed to sync ${result.failed} items.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Nothing to sync',
          description: 'No pending items found.',
          variant: 'default',
        });
      }

      // Update pending count
      const forms = await getPendingForms();
      setPendingCount(forms.length);
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'An error occurred while syncing.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Don't render anything if online and no pending items
  if (online && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg p-2 shadow-lg',
        online
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
        className,
      )}
    >
      {online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}

      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {online ? 'Online' : 'Offline'}
        </span>
        {pendingCount > 0 && (
          <span className="text-xs">
            {pendingCount} {pendingCount === 1 ? 'item' : 'items'} pending
          </span>
        )}
      </div>

      {pendingCount > 0 && online && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="ml-2 h-8 text-xs"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      )}
    </div>
  );
}
