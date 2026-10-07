'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ExerciseHistoricalEntry, ExecutionSet } from '@/types';
import {
  TrendingUp,
  Dumbbell,
  Trophy,
  Calendar,
  Layers,
  Flame,
  Check,
  Sparkles,
  Activity,
  BarChart2,
} from 'lucide-react';

interface ExerciseHistoryChartProps {
  exerciseName: string;
  history: ExerciseHistoricalEntry[];
  currentWeightKg?: number;
  currentSets?: ExecutionSet[];
}

interface SelectedMetricsState {
  weight: boolean;
  reps: boolean;
  volume: boolean;
}

export interface ChartPoint {
  label: string;
  weightKg: number;
  reps: number;
  volumeKg: number;
  subtitle?: string;
  date?: string;
  setNumber?: number;
  setsCompleted?: number;
  completed?: boolean;
  estimated1RM?: number;
}

// Custom Tooltip declared outside of component render
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    name: string;
    value: number;
    color: string;
    payload: ChartPoint;
  }>;
  selectedMetrics?: SelectedMetricsState;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, selectedMetrics }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const showWeight = selectedMetrics?.weight ?? true;
    const showReps = selectedMetrics?.reps ?? true;
    const showVolume = selectedMetrics?.volume ?? true;

    return (
      <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[210px]">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] border-b border-slate-800 pb-1.5">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {data.label}
          </span>
          {data.subtitle && (
            <span className="text-[10px] text-slate-400">{data.subtitle}</span>
          )}
        </div>

        <div className="space-y-1.5">
          {showWeight && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Carga:
              </span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {data.weightKg} kg
              </span>
            </div>
          )}

          {showReps && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Repetições:
              </span>
              <span className="text-sm font-black text-rose-400 font-mono">
                {data.reps} reps
              </span>
            </div>
          )}

          {showVolume && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Volume:
              </span>
              <span className="text-sm font-black text-blue-400 font-mono">
                {data.volumeKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
          )}

          {data.estimated1RM && (
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>Estimativa 1RM:</span>
              <span className="font-mono font-bold text-emerald-300">~{data.estimated1RM} kg</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const ExerciseHistoryChart: React.FC<ExerciseHistoryChartProps> = ({
  exerciseName,
  history,
  currentWeightKg,
  currentSets,
}) => {
  // Chart type: 'exercise' (sessão a sessão) or 'sets' (série a série)
  const [chartType, setChartType] = useState<'exercise' | 'sets'>('exercise');

  // Multi-selection filter: Carga (Verde), Repetições (Vermelho), Volume (Azul)
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetricsState>({
    weight: true,
    reps: true,
    volume: true,
  });

  const hasHistory = history && history.length > 0;
  const hasSets = currentSets && currentSets.length > 0;

  if (!hasHistory && !hasSets) {
    return (
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1.5">
        <Dumbbell className="w-6 h-6 text-slate-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-300">
          Primeiro registro para &ldquo;{exerciseName}&rdquo;
        </p>
        <p className="text-[11px] text-slate-500">
          As cargas e repetições salvas formarão automaticamente os gráficos de linhas por exercício e por série.
        </p>
      </div>
    );
  }

  // Toggle single metric (keep at least one active)
  const toggleMetric = (key: keyof SelectedMetricsState) => {
    const activeCount = Object.values(selectedMetrics).filter(Boolean).length;
    if (selectedMetrics[key] && activeCount <= 1) {
      return;
    }
    setSelectedMetrics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all 3 metrics
  const areAllThreeSelected =
    selectedMetrics.weight && selectedMetrics.reps && selectedMetrics.volume;

  const handleSelectAllThree = () => {
    if (areAllThreeSelected) {
      setSelectedMetrics({ weight: true, reps: false, volume: false });
    } else {
      setSelectedMetrics({ weight: true, reps: true, volume: true });
    }
  };

  // 1. Data for "Por Exercício" (Histórico Geral Sessão a Sessão)
  const exerciseChartData: ChartPoint[] = (hasHistory ? history.slice(-6) : []).map((item) => {
    const reps = item.reps || 10;
    const sets = item.setsCompleted || 4;
    const sessionVolume = item.weightKg * reps * sets;
    const estimated1RM = Math.round(item.weightKg * (1 + reps / 30));

    return {
      label: item.date,
      date: item.date,
      weightKg: item.weightKg,
      reps,
      volumeKg: sessionVolume,
      setsCompleted: sets,
      estimated1RM,
      subtitle: `${sets} séries`,
    };
  });

  // 2. Data for "Por Série" (Intra-treino Série a Série)
  const setsChartData: ChartPoint[] = (currentSets || []).map((s) => {
    const completedReps = s.completed ? s.completedReps : (s.completedReps || s.targetReps || 10);
    const weight = s.weightKg || currentWeightKg || 0;
    const setVolume = weight * completedReps;

    return {
      label: `Série ${s.setNumber}`,
      setNumber: s.setNumber,
      weightKg: weight,
      reps: completedReps,
      volumeKg: setVolume,
      subtitle: s.completed ? 'Concluída ✓' : `Alvo: ${s.targetReps} reps`,
      completed: s.completed,
    };
  });

  // Active dataset depending on selected tab
  const activeData: ChartPoint[] = chartType === 'exercise' ? exerciseChartData : setsChartData;

  // Domain calculations for scales
  const weights = activeData.map((d) => d.weightKg).filter((w) => w > 0);
  const repsArr = activeData.map((d) => d.reps);
  const volumes = activeData.map((d) => d.volumeKg);

  const minWeight = weights.length ? Math.min(...weights) : 0;
  const maxWeight = weights.length ? Math.max(...weights) : 100;
  const maxReps = repsArr.length ? Math.max(...repsArr) : 12;
  const maxVolume = volumes.length ? Math.max(...volumes) : 1000;

  // KPI calculations
  const firstW = weights[0] || 0;
  const lastW = currentWeightKg !== undefined ? currentWeightKg : (weights[weights.length - 1] || 0);
  const diffKg = Number((lastW - firstW).toFixed(1));
  const percentGain = firstW > 0 ? ((diffKg / firstW) * 100).toFixed(1) : '0';

  const lastReps = repsArr[repsArr.length - 1] || 10;
  const lastVol = volumes[volumes.length - 1] || 0;
  const totalSetsVolume = setsChartData.reduce((acc, s) => acc + s.volumeKg, 0);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border border-slate-700/60 shadow-2xl space-y-4 animate-in fade-in duration-200">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md">
            {chartType === 'exercise' ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <Activity className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white tracking-tight">
                {chartType === 'exercise'
                  ? 'Gráfico por Exercício (Histórico de Sessões)'
                  : 'Gráfico por Série (Curva Série a Série)'}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
                {exerciseName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Linhas: <strong className="text-emerald-400">Verde</strong> (Carga),{' '}
              <strong className="text-rose-400">Vermelho</strong> (Repetições) e{' '}
              <strong className="text-blue-400">Azul</strong> (Volume)
            </p>
          </div>
        </div>

        {/* TAB SELECTOR: POR EXERCÍCIO vs POR SÉRIE */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setChartType('exercise')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
              chartType === 'exercise'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>1. Por Exercício (Geral)</span>
          </button>

          <button
            type="button"
            onClick={() => setChartType('sets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
              chartType === 'sets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>2. Por Série (Intra-Treino)</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS: CARGA (VERDE), REPETIÇÕES (VERMELHO), VOLUME (AZUL) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtro de Linhas:</span>
          </span>

          {/* 1. Carga (kg) - VERDE */}
          <button
            type="button"
            onClick={() => toggleMetric('weight')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 border ${
              selectedMetrics.weight
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                selectedMetrics.weight
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'border border-slate-700'
              }`}
            >
              {selectedMetrics.weight && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Carga (kg)</span>
          </button>

          {/* 2. Repetições - VERMELHO */}
          <button
            type="button"
            onClick={() => toggleMetric('reps')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 border ${
              selectedMetrics.reps
                ? 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-md ring-1 ring-rose-500'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                selectedMetrics.reps
                  ? 'bg-rose-500 text-slate-950 font-black'
                  : 'border border-slate-700'
              }`}
            >
              {selectedMetrics.reps && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Repetições</span>
          </button>

          {/* 3. Volume (kg) - AZUL */}
          <button
            type="button"
            onClick={() => toggleMetric('volume')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 border ${
              selectedMetrics.volume
                ? 'bg-blue-950/90 text-blue-300 border-blue-500 shadow-md ring-1 ring-blue-500'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                selectedMetrics.volume
                  ? 'bg-blue-500 text-slate-950 font-black'
                  : 'border border-slate-700'
              }`}
            >
              {selectedMetrics.volume && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Volume (kg total)</span>
          </button>
        </div>

        {/* Shortcut: All 3 lines */}
        <button
          type="button"
          onClick={handleSelectAllThree}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow ${
            areAllThreeSelected
              ? 'bg-gradient-to-r from-emerald-600 via-rose-600 to-blue-600 text-white ring-2 ring-white/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{areAllThreeSelected ? '✓ 3 Linhas Ativas' : 'Ver as 3 Linhas Juntas'}</span>
        </button>
      </div>

      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {/* Card 1: Carga */}
        <div
          className={`p-2.5 rounded-xl border transition-all ${
            selectedMetrics.weight
              ? 'bg-slate-900 border-emerald-500/40 ring-1 ring-emerald-500/20'
              : 'bg-slate-900/40 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {chartType === 'exercise' ? 'Carga Atual' : 'Carga Média'}
          </span>
          <span className="text-sm sm:text-base font-black text-white font-mono mt-0.5 block">
            {lastW} <span className="text-xs text-emerald-400 font-bold">kg</span>
          </span>
          <span
            className={`text-[10px] font-bold block ${
              diffKg >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {chartType === 'exercise'
              ? `${diffKg >= 0 ? `+${diffKg} kg` : `${diffKg} kg`} (${percentGain}%)`
              : `${currentSets?.length || 0} séries ativas`}
          </span>
        </div>

        {/* Card 2: Repetições */}
        <div
          className={`p-2.5 rounded-xl border transition-all ${
            selectedMetrics.reps
              ? 'bg-slate-900 border-rose-500/40 ring-1 ring-rose-500/20'
              : 'bg-slate-900/40 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {chartType === 'exercise' ? 'Reps Máximas' : 'Reps da Última Série'}
          </span>
          <span className="text-sm sm:text-base font-black text-rose-400 font-mono mt-0.5 block">
            {lastReps} <span className="text-xs font-bold text-slate-300">reps</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            Pico: {maxReps} reps
          </span>
        </div>

        {/* Card 3: Volume */}
        <div
          className={`p-2.5 rounded-xl border transition-all ${
            selectedMetrics.volume
              ? 'bg-slate-900 border-blue-500/40 ring-1 ring-blue-500/20'
              : 'bg-slate-900/40 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {chartType === 'exercise' ? 'Volume da Sessão' : 'Volume Total das Séries'}
          </span>
          <span className="text-sm sm:text-base font-black text-blue-400 font-mono mt-0.5 block">
            {(chartType === 'exercise' ? lastVol : totalSetsVolume).toLocaleString('pt-BR')}{' '}
            <span className="text-xs font-bold text-slate-400">kg</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            Tonelagem acumulada
          </span>
        </div>

        {/* Card 4: Recorde / Diagnóstico */}
        <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            {chartType === 'exercise' ? '1RM Máxima' : 'Consistência'}
          </span>
          <span className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5 block">
            {chartType === 'exercise'
              ? `~${Math.round(lastW * (1 + lastReps / 30))} kg`
              : `${currentSets?.filter((s) => s.completed).length || 0}/${currentSets?.length || 0} ✓`}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            {chartType === 'exercise' ? 'Fórmula Epley' : 'Séries concluídas'}
          </span>
        </div>
      </div>

      {/* RECHARTS MULTI-LINE CHART */}
      <div className="w-full h-60 sm:h-64 pt-2 min-h-[230px]">
        {activeData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Nenhum dado disponível para visualização neste modo.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activeData}
              margin={{
                top: 10,
                right: selectedMetrics.reps ? 16 : 8,
                left: -10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              {/* Y Axis for Carga (kg) - VERDE (Left) */}
              {selectedMetrics.weight && (
                <YAxis
                  yAxisId="weight"
                  orientation="left"
                  stroke="#10b981"
                  domain={[Math.max(0, minWeight - 10), maxWeight + 10]}
                  tick={{ fill: '#10b981', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#064e3b' }}
                  unit="kg"
                />
              )}

              {/* Y Axis for Repetições - VERMELHO (Right) */}
              {selectedMetrics.reps && (
                <YAxis
                  yAxisId="reps"
                  orientation="right"
                  stroke="#ef4444"
                  domain={[0, Math.ceil(maxReps * 1.25)]}
                  tick={{ fill: '#ef4444', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#7f1d1d' }}
                  unit="r"
                />
              )}

              {/* Y Axis for Volume (kg total) - AZUL */}
              {selectedMetrics.volume && (
                <YAxis
                  yAxisId="volume"
                  orientation={selectedMetrics.weight ? 'right' : 'left'}
                  stroke="#3b82f6"
                  domain={[0, Math.ceil(maxVolume * 1.15)]}
                  tick={{ fill: '#3b82f6', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#1e3a8a' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                />
              )}

              <Tooltip content={<CustomChartTooltip selectedMetrics={selectedMetrics} />} />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 'bold' }}
              />

              {/* Linha 1: Carga (kg) - VERDE (#10b981) */}
              {selectedMetrics.weight && (
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weightKg"
                  name="Carga (kg)"
                  stroke="#10b981"
                  strokeWidth={3.5}
                  dot={{
                    r: 5,
                    fill: '#022c22',
                    stroke: '#10b981',
                    strokeWidth: 2.5,
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#10b981',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              )}

              {/* Linha 2: Repetições - VERMELHO (#ef4444) */}
              {selectedMetrics.reps && (
                <Line
                  yAxisId="reps"
                  type="monotone"
                  dataKey="reps"
                  name="Repetições"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: '#450a0a',
                    stroke: '#ef4444',
                    strokeWidth: 2.5,
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#ef4444',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              )}

              {/* Linha 3: Volume (kg total) - AZUL (#3b82f6) */}
              {selectedMetrics.volume && (
                <Line
                  yAxisId="volume"
                  type="monotone"
                  dataKey="volumeKg"
                  name="Volume (kg total)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  strokeDasharray={selectedMetrics.weight && selectedMetrics.reps ? '4 4' : undefined}
                  dot={{
                    r: 5,
                    fill: '#1e3a8a',
                    stroke: '#3b82f6',
                    strokeWidth: 2.5,
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#3b82f6',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Comparative Summary Cards Footer */}
      <div className="pt-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>
              {chartType === 'exercise'
                ? 'Tabela Histórica de Sessões'
                : 'Tabela Série a Série (Sessão Atual)'}
            </span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeData.length} registros
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activeData.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1"
            >
              <span className="text-[10px] text-slate-400 font-mono block">
                {item.label}
              </span>

              <div className="flex items-center justify-center gap-2 text-xs font-black">
                <span className="text-emerald-400 font-mono">{item.weightKg}kg</span>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400 font-mono">{item.reps} reps</span>
              </div>

              <span className="text-[10px] font-mono text-blue-400 font-semibold block">
                Vol: {item.volumeKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
