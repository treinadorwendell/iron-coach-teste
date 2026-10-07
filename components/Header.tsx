'use client';

import React from 'react';
import { Dumbbell, Tablet, Maximize2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';

interface HeaderProps {
  isTabletFramed: boolean;
  onToggleTabletFrame: () => void;
  activeClientName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isTabletFramed,
  onToggleTabletFrame,
  activeClientName,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-950/50 flex-shrink-0">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                IronCoach
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {activeClientName ? (
                <span>
                  Aluno: <strong className="text-emerald-400 font-semibold">{activeClientName}</strong>
                </span>
              ) : (
                'Tablet Vertical • Musculação'
              )}
            </p>
          </div>
        </div>

        {/* Right tools: Offline badge, Frame toggle, PWA install */}
        <div className="flex items-center gap-2">
          <OfflineIndicator />

          <button
            onClick={onToggleTabletFrame}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium transition active:scale-95"
            title={isTabletFramed ? 'Ver em tela cheia' : 'Simular borda de Tablet Vertical 3:4'}
          >
            {isTabletFramed ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cheia</span>
              </>
            ) : (
              <>
                <Tablet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modo Tablet</span>
              </>
            )}
          </button>

          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
