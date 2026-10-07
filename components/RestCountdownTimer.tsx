'use client';

import React, { useEffect, useState, useRef } from 'react';
import { sounds } from '@/lib/sound';
import {
  Timer,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

interface RestCountdownTimerProps {
  initialSeconds: number;
  exerciseName: string;
  setNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const RestCountdownTimer: React.FC<RestCountdownTimerProps> = ({
  initialSeconds,
  exerciseName,
  setNumber,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [totalDuration, setTotalDuration] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Interval countdown
  useEffect(() => {
    if (!isOpen || !isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!isMuted) {
            sounds.playRestCompleteBeep();
          }
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isRunning, isMuted, onComplete]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent =
    totalDuration > 0 ? Math.max(0, (timeLeft / totalDuration) * 100) : 0;
  const isFinished = timeLeft === 0;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-in slide-in-from-top-6 duration-200">
      <div
        className={`p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-colors ${
          isFinished
            ? 'bg-emerald-950/95 border-emerald-400 ring-2 ring-emerald-400 timer-pulsing'
            : 'bg-slate-900/95 border-slate-700 shadow-slate-950/80'
        }`}
      >
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-xl ${
                isFinished
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              <Timer className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Descanso: Série #{setNumber}</span>
                {isFinished && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                    TEMPO ESGOTADO!
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                {exerciseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title={isMuted ? 'Ativar som do bip' : 'Silenciar som'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Fechar Cronômetro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Countdown Timer Display & Progress */}
        <div className="py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-black font-mono tracking-tight transition-colors ${
                isFinished
                  ? 'text-emerald-400'
                  : timeLeft <= 5
                  ? 'text-amber-400 animate-pulse'
                  : 'text-white'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              / {formatTime(totalDuration)}
            </span>
          </div>

          {/* Stepper buttons for quick +30s / -15s */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setTimeLeft((t) => Math.max(0, t - 15));
                sounds.playTickSound();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold active:scale-95 transition"
              title="-15 segundos"
            >
              -15s
            </button>
            <button
              onClick={() => {
                setTimeLeft((t) => t + 30);
                setTotalDuration((td) => td + 30);
                sounds.playTickSound();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold active:scale-95 transition"
              title="+30 segundos"
            >
              +30s
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-2 rounded-xl text-xs font-bold active:scale-95 transition ${
                isRunning
                  ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
              title={isRunning ? 'Pausar' : 'Continuar'}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFinished
                ? 'bg-emerald-400'
                : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
