'use client';

import { useState } from 'react';

export default function StatusBar() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState<number>(12);

  const getRelativeTime = (date: Date | null): string => {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="fixed bottom-0 left-[220px] right-0 h-6 bg-gray-900 text-gray-400 text-xs flex items-center px-4 gap-4 z-50">
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      <span>Last sync: {getRelativeTime(lastSyncTime)}</span>

      <span>Active subscriptions: {subscriptionCount}</span>

      <span className="text-gray-600">|</span>

      <span className="ml-auto">PRISM ICC v1.0</span>
    </div>
  );
}
