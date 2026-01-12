'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-muted p-6">
          <WifiOff className="h-12 w-12 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">You&apos;re Offline</h1>
          <p className="max-w-md text-muted-foreground">
            It looks like you&apos;ve lost your internet connection. Don&apos;t worry, your notes are saved locally and will sync when you&apos;re back online.
          </p>
        </div>

        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        <p className="text-sm text-muted-foreground">
          Tip: You can still view and edit your cached notes while offline.
        </p>
      </div>
    </div>
  );
}
