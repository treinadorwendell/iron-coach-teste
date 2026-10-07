'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/usePWAInstall';
import { useMounted } from '@/hooks/useMounted';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isMounted = useMounted();
  const isOnline = useOnlineStatus();

  // If not mounted or online, display the online status
  if (!isMounted || isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 font-medium select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Wifi className="w-3 h-3 text-emerald-400" />
        <span className="hidden sm:inline">Offline Ready</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-300 font-semibold select-none animate-pulse">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Modo Academia (Offline)</span>
    </div>
  );
};
