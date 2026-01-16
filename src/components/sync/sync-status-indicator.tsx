'use client';

import { useSyncStatus } from '@/lib/hooks/use-sync';
import { cn } from '@/lib/utils/cn';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Check,
} from 'lucide-react';

interface SyncStatusIndicatorProps {
  showText?: boolean;
  className?: string;
}

export function SyncStatusIndicator({
  showText = true,
  className,
}: SyncStatusIndicatorProps) {
  const {
    statusText,
    statusColor,
    pendingChanges,
    isSyncing,
    isOnline,
    hasError,
  } = useSyncStatus();

  const Icon = (() => {
    if (!isOnline) return CloudOff;
    if (isSyncing) return RefreshCw;
    if (hasError) return AlertCircle;
    if (pendingChanges > 0) return Cloud;
    return Check;
  })();

  const colorClasses = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon
        className={cn(
          'h-4 w-4',
          colorClasses[statusColor],
          isSyncing && 'animate-spin'
        )}
      />
      {showText && (
        <span className="text-sm text-muted-foreground">{statusText}</span>
      )}
      {pendingChanges > 0 && !isSyncing && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
          {pendingChanges > 99 ? '99+' : pendingChanges}
        </span>
      )}
    </div>
  );
}
