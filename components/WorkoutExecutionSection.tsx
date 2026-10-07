'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  WorkoutProgram,
  WorkoutSplit,
  Client,
  ActiveWorkoutSession,
  ExecutionExerciseState,
  ExecutionSet,
  ExecutionSubSet,
  CompletedWorkoutRecord,
  CompletedExerciseRecord,
} from '@/types';
import { storage } from '@/lib/storage';
import { sounds } from '@/lib/sound';
import { ExerciseHistoryChart } from './ExerciseHistoryChart';
import { RestCountdownTimer } from './RestCountdownTimer';
import {
  Flame,
  Check,
  TrendingUp,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  Trophy,
  ChevronDown,
  ChevronUp,
  User,
  Dumbbell,
  FilePlus,
  Sparkles,
  Weight,
  Ruler,
  Activity,
  Layers,
  Link2,
  PenLine,
  FileText,
  X,
} from 'lucide-react';

interface WorkoutExecutionSectionProps {
  clients: Client[];
  workouts: WorkoutProgram[];
  activeWorkout: WorkoutProgram | null;
  onSelectWorkout: (workout: WorkoutProgram) => void;
  onNavigateToCreateWorkout?: (clientId: string) => void;
  onFinishWorkout?: () => void;
}

export const WorkoutExecutionSection: React.FC<WorkoutExecutionSectionProps> = ({
  clients,
  workouts,
  activeWorkout,
  onSelectWorkout,
  onNavigateToCreateWorkout,
  onFinishWorkout,
}) => {
  // Helper to build a session from a program (with split support)
  const buildSession = useCallback(
    (prog: WorkoutProgram, specificSplit?: WorkoutSplit): ActiveWorkoutSession => {
      const client = clients.find((c) => c.id === prog.clientId);
      const clientName = client ? client.name : 'Aluno';

      const targetSplit =
        specificSplit ||
        (prog.splits && prog.splits.length > 0 ? prog.splits[0] : null);

      const exercisesToUse = targetSplit
        ? targetSplit.exercises
        : prog.exercises || [];

      const displayName = targetSplit
        ? `${prog.name} • ${targetSplit.name}`
        : prog.name;

      const exercisesState: ExecutionExerciseState[] = exercisesToUse.map((ex) => {
        const history = storage.getExerciseHistory(ex.name);
        const lastRecordedWeight =
          history.length > 0 ? history[history.length - 1].weightKg : 20;

        const setsCount =
          ex.setDetails && ex.setDetails.length > 0 ? ex.setDetails.length : ex.sets;

        const sets: ExecutionSet[] = Array.from({ length: setsCount }).map((_, idx) => {
          const setDetail = ex.setDetails?.[idx];
          const activeRepZone = setDetail?.repZone || ex.repZone || '10';
          const parsedReps = parseInt(activeRepZone.split('-')[0], 10) || 10;
          const setWeight = setDetail?.suggestedWeightKg || lastRecordedWeight;
          const setMethod =
            setDetail?.method && setDetail.method !== 'Normal'
              ? setDetail.method
              : undefined;

          const subSets: ExecutionSubSet[] = (setDetail?.subSets || []).map((sub, subIdx) => {
            const subParsedReps = parseInt(sub.repZone.split('-')[0], 10) || 8;
            return {
              id: sub.id || `subset-${idx}-${subIdx}`,
              subSetNumber: sub.subSetNumber || subIdx + 1,
              repZone: sub.repZone,
              targetReps: subParsedReps,
              completedReps: subParsedReps,
              weightKg: sub.suggestedWeightKg ?? setWeight,
              completed: false,
              note: sub.note,
            };
          });

          return {
            setNumber: idx + 1,
            repZone: activeRepZone,
            targetReps: parsedReps,
            completedReps: parsedReps,
            weightKg: setWeight,
            completed: false,
            extraVariation: setMethod,
            method: setDetail?.method || ex.method,
            subSets,
          };
        });

        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          method: ex.method,
          observations: ex.observations,
          restSeconds: ex.restSeconds || 60,
          sets,
          combinationGroupId: ex.combinationGroupId,
          combinationLabel: ex.combinationLabel,
          combinationOrder: ex.combinationOrder,
        };
      });

      return {
        programId: prog.id,
        clientId: prog.clientId,
        clientName,
        programName: displayName,
        startTime: new Date().toISOString(),
        elapsedSeconds: 0,
        isPaused: false,
        isStarted: false,
        exercises: exercisesState,
        trainerNotes: '',
      };
    },
    [clients]
  );

  // Selected student state for explicit selection
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return activeWorkout?.clientId || clients[0]?.id || '';
  });

  // Initialize active session deterministically for SSR match
  const [session, setSession] = useState<ActiveWorkoutSession | null>(() => {
    const targetProg = activeWorkout || (workouts.length > 0 ? workouts[0] : null);
    if (!targetProg) return null;
    return buildSession(targetProg);
  });

  const [expandedHistoryExId, setExpandedHistoryExId] = useState<string | null>(null);

  // Expansion state for the active workout to be performed
  const [isWorkoutExpanded, setIsWorkoutExpanded] = useState<boolean>(true);

  // Individual exercise expansion states (default: collapsed on workout selection)
  const [expandedExerciseIds, setExpandedExerciseIds] = useState<Record<string, boolean>>({});

  // Active Rest Timer state
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerExerciseName, setTimerExerciseName] = useState('');
  const [timerSetNumber, setTimerSetNumber] = useState(1);

  // Workout Completion Modal State
  const [isFinishedModalOpen, setIsFinishedModalOpen] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<{
    totalVolumeKg: number;
    completedSets: number;
    totalSets: number;
    durationStr: string;
    trainerNotes?: string;
  } | null>(null);

  // Safely hydrate saved session from client storage after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = storage.getActiveSession();
      if (saved) {
        setSession(saved);
        if (saved.clientId) {
          setSelectedClientId(saved.clientId);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync when activeWorkout changes from parent (e.g. clicking "Iniciar Treino" on a client)
  useEffect(() => {
    if (activeWorkout) {
      const timer = setTimeout(() => {
        setSelectedClientId(activeWorkout.clientId);
        const newSession = buildSession(activeWorkout);
        setSession(newSession);
        storage.saveActiveSession(newSession);
        setExpandedExerciseIds({}); // Initially collapsed when workout is selected
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeWorkout, buildSession]);

  const handleToggleExerciseExpand = (exId: string) => {
    setExpandedExerciseIds((prev) => ({
      ...prev,
      [exId]: !prev[exId],
    }));
  };

  const handleExpandAllExercises = () => {
    if (!session) return;
    const allExp: Record<string, boolean> = {};
    session.exercises.forEach((ex) => {
      allExp[ex.exerciseId] = true;
    });
    setExpandedExerciseIds(allExp);
  };

  const handleCollapseAllExercises = () => {
    setExpandedExerciseIds({});
  };

  const startNewSession = useCallback(
    (prog: WorkoutProgram, split?: WorkoutSplit) => {
      const newSession = buildSession(prog, split);
      setSession(newSession);
      storage.saveActiveSession(newSession);
      setIsWorkoutExpanded(true);
      setExpandedExerciseIds({}); // Initially collapsed when new session starts
    },
    [buildSession, setExpandedExerciseIds]
  );

  // Switch student handler
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const clientWorkouts = workouts.filter((w) => w.clientId === clientId);
    if (clientWorkouts.length > 0) {
      const firstProg = clientWorkouts[0];
      onSelectWorkout(firstProg);
      startNewSession(firstProg);
      setIsWorkoutExpanded(true);
    } else {
      setSession(null);
      storage.saveActiveSession(null);
      setIsWorkoutExpanded(false);
    }
  };

  // Switch workout program handler
  const handleSelectProgram = (programId: string) => {
    if (session?.programId === programId) {
      // Toggle expansion when clicking the active program
      setIsWorkoutExpanded((prev) => !prev);
      return;
    }
    const targetProg = workouts.find((w) => w.id === programId);
    if (targetProg) {
      onSelectWorkout(targetProg);
      startNewSession(targetProg);
      setIsWorkoutExpanded(true);
    }
  };

  // Switch specific split/treino da semana within program (with expansion toggle)
  const handleSelectSplit = (prog: WorkoutProgram, split: WorkoutSplit) => {
    const isAlreadyThisSplit =
      session?.programId === prog.id &&
      (session?.programName.includes(split.name) || (!prog.splits || prog.splits.length <= 1));

    if (isAlreadyThisSplit) {
      // Toggle expansion when clicking the already active split
      setIsWorkoutExpanded((prev) => !prev);
      return;
    }

    const newSession = buildSession(prog, split);
    setSession(newSession);
    storage.saveActiveSession(newSession);
    setIsWorkoutExpanded(true);
    setExpandedExerciseIds({});
  };

  // Quick Starter Workout Generator if student doesn't have one yet
  const handleCreateQuickStarterWorkout = () => {
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    const quickExercises = [
      {
        id: `ex-q1-${Date.now()}`,
        name: 'Supino Reto com Barra',
        muscleGroup: 'Peitoral' as const,
        sets: 3,
        repZone: '10-12',
        restSeconds: 60,
        method: 'Normal',
        observations: 'Manter escápulas aduzidas e respiração coordenada.',
        extraBlocks: [],
      },
      {
        id: `ex-q2-${Date.now()}`,
        name: 'Puxada Frontal Aberta',
        muscleGroup: 'Dorsal' as const,
        sets: 3,
        repZone: '10-12',
        restSeconds: 60,
        method: 'Normal',
        observations: 'Puxar em direção ao peitoral superior com peito aberto.',
        extraBlocks: [],
      },
      {
        id: `ex-q3-${Date.now()}`,
        name: 'Agachamento Livre com Barra',
        muscleGroup: 'Quadríceps' as const,
        sets: 3,
        repZone: '10-12',
        restSeconds: 75,
        method: 'Normal',
        observations: 'Base firme e amplitude até 90 graus.',
        extraBlocks: [],
      },
    ];

    const quickSplit: WorkoutSplit = {
      id: `split-q-${Date.now()}`,
      name: 'Treino A - Adaptação Funcional',
      weekDays: [1, 3, 5],
      exercises: quickExercises,
    };

    const quickProgram: WorkoutProgram = {
      id: `prog-quick-${Date.now()}`,
      clientId: client.id,
      name: `Treino de Adaptação Geral - ${client.name}`,
      goal: 'Adaptação e Condicionamento',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      splits: [quickSplit],
      weekDays: [1, 3, 5],
      exercises: quickExercises,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Save and immediately start
    const allWorkouts = storage.getWorkouts();
    const updated = [quickProgram, ...allWorkouts];
    storage.saveWorkouts(updated);
    onSelectWorkout(quickProgram);
    startNewSession(quickProgram);
  };

  const isSessionStarted = !!session?.isStarted;
  const isSessionPaused = !!session?.isPaused;
  const hasActiveSession = !!session;

  // Session elapsed timer ticker - only starts when isStarted is true and not paused
  useEffect(() => {
    if (!hasActiveSession || !isSessionStarted || isSessionPaused) return;

    const interval = setInterval(() => {
      setSession((prev) => {
        if (!prev || !prev.isStarted || prev.isPaused) return prev;
        const updated = {
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        };
        storage.saveActiveSession(updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasActiveSession, isSessionStarted, isSessionPaused]);

  // Toggle set check status
  const handleToggleSetCheck = (exIndex: number, setIndex: number) => {
    if (!session) return;

    const currentEx = session.exercises[exIndex];
    const currentSet = currentEx.sets[setIndex];
    const willBeCompleted = !currentSet.completed;

    const updatedExercises = [...session.exercises];
    const updatedSets = [...currentEx.sets];

    updatedSets[setIndex] = {
      ...currentSet,
      completed: willBeCompleted,
      completedAt: willBeCompleted ? new Date().toISOString() : undefined,
    };

    updatedExercises[exIndex] = {
      ...currentEx,
      sets: updatedSets,
    };

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setSession(updatedSession);
    storage.saveActiveSession(updatedSession);

    if (willBeCompleted) {
      sounds.playSetCompletedSound();

      // Automatically trigger integrated countdown timer
      const restTime = currentEx.restSeconds || 60;
      setTimerSeconds(restTime);
      setTimerExerciseName(currentEx.exerciseName);
      setTimerSetNumber(currentSet.setNumber);
      setTimerOpen(true);

      // Record exercise history immediately to LocalStorage
      storage.recordExerciseHistory(
        currentEx.exerciseName,
        currentSet.weightKg,
        currentSet.completedReps,
        updatedSets.filter((s) => s.completed).length
      );
    }
  };

  // Weight adjustment (+ and - with huge touch buttons for gym floor)
  const adjustWeight = (
    exIndex: number,
    setIndex: number,
    delta: number,
    applyToSubsequent = false
  ) => {
    if (!session) return;
    sounds.playTickSound();

    const currentEx = session.exercises[exIndex];
    const updatedSets = [...currentEx.sets];
    const newWeight = Math.max(0, updatedSets[setIndex].weightKg + delta);

    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      weightKg: newWeight,
    };

    if (applyToSubsequent) {
      for (let i = setIndex + 1; i < updatedSets.length; i++) {
        if (!updatedSets[i].completed) {
          updatedSets[i].weightKg = newWeight;
        }
      }
    }

    const updatedExercises = [...session.exercises];
    updatedExercises[exIndex] = {
      ...currentEx,
      sets: updatedSets,
    };

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setSession(updatedSession);
    storage.saveActiveSession(updatedSession);
  };

  // Direct weight input change
  const setWeightDirect = (exIndex: number, setIndex: number, value: number) => {
    if (!session) return;
    const currentEx = session.exercises[exIndex];
    const updatedSets = [...currentEx.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      weightKg: Math.max(0, value),
    };

    const updatedExercises = [...session.exercises];
    updatedExercises[exIndex] = {
      ...currentEx,
      sets: updatedSets,
    };

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setSession(updatedSession);
    storage.saveActiveSession(updatedSession);
  };

  // Reps adjustment (+ and - touch)
  const adjustReps = (exIndex: number, setIndex: number, delta: number) => {
    if (!session) return;
    sounds.playTickSound();

    const currentEx = session.exercises[exIndex];
    const updatedSets = [...currentEx.sets];
    const newReps = Math.max(1, updatedSets[setIndex].completedReps + delta);

    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      completedReps: newReps,
    };

    const updatedExercises = [...session.exercises];
    updatedExercises[exIndex] = {
      ...currentEx,
      sets: updatedSets,
    };

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setSession(updatedSession);
    storage.saveActiveSession(updatedSession);
  };

  // Toggle subsérie check status
  const handleToggleSubSetCheck = (
    exIndex: number,
    setIndex: number,
    subIndex: number
  ) => {
    if (!session) return;
    const currentEx = session.exercises[exIndex];
    const currentSet = currentEx?.sets[setIndex];
    if (!currentSet || !currentSet.subSets || !currentSet.subSets[subIndex]) return;

    const sub = currentSet.subSets[subIndex];
    const willBeCompleted = !sub.completed;

    if (willBeCompleted) {
      sounds.playSetCompletedSound();
    } else {
      sounds.playTickSound();
    }

    const updatedSubSets = currentSet.subSets.map((s, idx) =>
      idx === subIndex ? { ...s, completed: willBeCompleted } : s
    );

    const updatedSets = currentEx.sets.map((s, idx) =>
      idx === setIndex ? { ...s, subSets: updatedSubSets } : s
    );

    const updatedExercises = session.exercises.map((ex, idx) =>
      idx === exIndex ? { ...ex, sets: updatedSets } : ex
    );

    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    storage.saveActiveSession(updatedSession);
  };

  // Adjust subsérie reps
  const handleAdjustSubSetReps = (
    exIndex: number,
    setIndex: number,
    subIndex: number,
    delta: number
  ) => {
    if (!session) return;
    sounds.playTickSound();

    const currentEx = session.exercises[exIndex];
    const currentSet = currentEx?.sets[setIndex];
    if (!currentSet || !currentSet.subSets || !currentSet.subSets[subIndex]) return;

    const updatedSubSets = currentSet.subSets.map((s, idx) =>
      idx === subIndex
        ? { ...s, completedReps: Math.max(1, s.completedReps + delta) }
        : s
    );

    const updatedSets = currentEx.sets.map((s, idx) =>
      idx === setIndex ? { ...s, subSets: updatedSubSets } : s
    );

    const updatedExercises = session.exercises.map((ex, idx) =>
      idx === exIndex ? { ...ex, sets: updatedSets } : ex
    );

    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    storage.saveActiveSession(updatedSession);
  };

  // Adjust subsérie weight
  const handleAdjustSubSetWeight = (
    exIndex: number,
    setIndex: number,
    subIndex: number,
    delta: number
  ) => {
    if (!session) return;
    sounds.playTickSound();

    const currentEx = session.exercises[exIndex];
    const currentSet = currentEx?.sets[setIndex];
    if (!currentSet || !currentSet.subSets || !currentSet.subSets[subIndex]) return;

    const updatedSubSets = currentSet.subSets.map((s, idx) =>
      idx === subIndex
        ? { ...s, weightKg: Math.max(0, parseFloat(((s.weightKg || 0) + delta).toFixed(1))) }
        : s
    );

    const updatedSets = currentEx.sets.map((s, idx) =>
      idx === setIndex ? { ...s, subSets: updatedSubSets } : s
    );

    const updatedExercises = session.exercises.map((ex, idx) =>
      idx === exIndex ? { ...ex, sets: updatedSets } : ex
    );

    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    storage.saveActiveSession(updatedSession);
  };

  // Direct subsérie weight change
  const handleSetSubSetWeightDirect = (
    exIndex: number,
    setIndex: number,
    subIndex: number,
    val: number
  ) => {
    if (!session) return;
    const currentEx = session.exercises[exIndex];
    const currentSet = currentEx?.sets[setIndex];
    if (!currentSet || !currentSet.subSets || !currentSet.subSets[subIndex]) return;

    const updatedSubSets = currentSet.subSets.map((s, idx) =>
      idx === subIndex ? { ...s, weightKg: Math.max(0, val) } : s
    );

    const updatedSets = currentEx.sets.map((s, idx) =>
      idx === setIndex ? { ...s, subSets: updatedSubSets } : s
    );

    const updatedExercises = session.exercises.map((ex, idx) =>
      idx === exIndex ? { ...ex, sets: updatedSets } : ex
    );

    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    storage.saveActiveSession(updatedSession);
  };

  // Workout Notes & Feedback Handler
  const handleUpdateTrainerNotes = (notes: string) => {
    if (!session) return;
    const updated: ActiveWorkoutSession = {
      ...session,
      trainerNotes: notes,
    };
    setSession(updated);
    storage.saveActiveSession(updated);
  };

  // Append Quick Technical Correction Tag
  const handleAppendTrainerQuickTag = (tag: string) => {
    if (!session) return;
    const currentNotes = session.trainerNotes || '';
    const newNotes = currentNotes ? `${currentNotes.trim()} • ${tag}` : tag;
    handleUpdateTrainerNotes(newNotes);
    sounds.playTickSound();
  };

  // Start Workout Session (starts timer)
  const handleStartWorkout = () => {
    if (!session) return;
    sounds.playTickSound();
    const updated: ActiveWorkoutSession = {
      ...session,
      isStarted: true,
      isPaused: false,
      startTime: new Date().toISOString(),
    };
    setSession(updated);
    storage.saveActiveSession(updated);
  };

  // Finish Workout Session
  const handleFinishWorkout = () => {
    if (!session) return;

    let totalVolumeKg = 0;
    let completedSetsCount = 0;
    let totalSetsCount = 0;

    session.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        totalSetsCount++;
        if (s.completed) {
          completedSetsCount++;
          totalVolumeKg += s.weightKg * s.completedReps;
        }
      });
    });

    const mins = Math.floor(session.elapsedSeconds / 60);
    const secs = session.elapsedSeconds % 60;
    const durationStr = `${mins}m ${secs}s`;

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}`;
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    let cleanProgramName = session.programName || 'Programa de Treino';
    let splitName = 'Treino Realizado';

    if (session.programName.includes('•')) {
      const parts = session.programName.split('•');
      cleanProgramName = parts[0].trim();
      splitName = parts[1].trim();
    } else if (activeWorkout?.splits && activeWorkout.splits.length > 0) {
      splitName = activeWorkout.splits[0].name;
      cleanProgramName = activeWorkout.name;
    }

    const completedExercises: CompletedExerciseRecord[] = session.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      method: ex.method,
      observations: ex.observations,
      sets: ex.sets.map((s) => ({
        setNumber: s.setNumber,
        completedReps: s.completedReps,
        weightKg: s.weightKg,
        repZone: s.repZone,
        completed: s.completed,
        method: s.method,
        subSets: (s.subSets || []).map((sub) => ({
          subSetNumber: sub.subSetNumber,
          completedReps: sub.completedReps,
          weightKg: sub.weightKg,
          repZone: sub.repZone,
          completed: sub.completed,
          note: sub.note,
        })),
      })),
    }));

    const newRecord: CompletedWorkoutRecord = {
      id: `hist-${Date.now()}`,
      clientId: session.clientId,
      clientName: session.clientName,
      programId: session.programId,
      programName: cleanProgramName,
      splitName: splitName,
      date: dateFormatted,
      time: timeFormatted,
      completedAt: now.toISOString(),
      durationSeconds: session.elapsedSeconds,
      durationFormatted: durationStr,
      totalVolumeKg,
      exercises: completedExercises,
      trainerNotes: session.trainerNotes || '',
    };

    storage.saveCompletedWorkout(newRecord);

    setWorkoutSummary({
      totalVolumeKg,
      completedSets: completedSetsCount,
      totalSets: totalSetsCount,
      durationStr,
      trainerNotes: session.trainerNotes || '',
    });

    setIsFinishedModalOpen(true);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#38bdf8', '#fbbf24', '#ffffff'],
      });
    } catch {}

    storage.saveActiveSession(null);
  };

  // Current selected client details
  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const studentWorkouts = workouts.filter((w) => w.clientId === selectedClientId);

  const calculateIMC = (w: number, h: number) => {
    if (!w || !h) return null;
    const hM = h / 100;
    return (w / (hM * hM)).toFixed(1);
  };

  const studentIMC = selectedClient ? calculateIMC(selectedClient.weight, selectedClient.height) : null;

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Rest Countdown Floating Overlay */}
      <RestCountdownTimer
        key={`${timerExerciseName}-${timerSetNumber}`}
        isOpen={timerOpen}
        initialSeconds={timerSeconds}
        exerciseName={timerExerciseName}
        setNumber={timerSetNumber}
        onClose={() => setTimerOpen(false)}
      />

      {/* STUDENT & WORKOUT SELECTOR BAR (SELEÇÃO DE ALUNO NO TOPO) */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
        {/* Row 1: Explicit Student Selector */}
        <div className="space-y-1 pb-3 border-b border-slate-800/80">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Selecionar Aluno para o Treino</span>
          </label>

          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => handleSelectClient(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700/80 hover:border-emerald-500/60 focus:border-emerald-500 text-sm font-bold text-white shadow-inner focus:outline-none transition-colors touch-manipulation"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Plano {c.contractType} (R$ {c.contractValue})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Workout Program Selector for this Student */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-cyan-400" />
                <span>Ficha / Programa de Treino ({studentWorkouts.length})</span>
              </label>

              {onNavigateToCreateWorkout && (
                <button
                  type="button"
                  onClick={() => onNavigateToCreateWorkout(selectedClientId)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 active:scale-95"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Prescrever Novo</span>
                </button>
              )}
            </div>

            {studentWorkouts.length > 0 ? (
              <select
                value={session?.programId || ''}
                onChange={(e) => handleSelectProgram(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {studentWorkouts.map((w) => {
                  const exCount =
                    w.splits?.[0]?.exercises?.length || w.exercises?.length || 0;
                  return (
                    <option key={w.id} value={w.id}>
                      {w.name} ({exCount} exercícios)
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-dashed border-amber-500/40 text-xs text-amber-300 flex items-center justify-between">
                <span>Nenhum treino cadastrado para este aluno</span>
                <button
                  onClick={handleCreateQuickStarterWorkout}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] active:scale-95 transition"
                >
                  + Gerar Treino Rápido
                </button>
              </div>
            )}
          </div>

          {/* Session Stopwatch and Controls */}
          {session && (
            <div className="flex items-center gap-2 self-end sm:self-auto pt-1 sm:pt-4">
              {session.isStarted && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...session, isPaused: !session.isPaused };
                    setSession(updated);
                    storage.saveActiveSession(updated);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs active:scale-95 touch-manipulation"
                  title={session.isPaused ? 'Retomar Treino' : 'Pausar Cronômetro'}
                >
                  {session.isPaused ? (
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  ) : (
                    <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
                  )}
                </button>
              )}

              <div
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border font-mono text-xs font-bold shadow-inner ${
                  session.isStarted
                    ? 'border-emerald-500/40 text-emerald-400'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${session.isStarted ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{session.isStarted ? formatElapsed(session.elapsedSeconds) : '00:00'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Workout Tabs if student has multiple programs */}
        {studentWorkouts.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            {studentWorkouts.map((prog) => {
              const isSelected = session?.programId === prog.id;
              return (
                <button
                  key={prog.id}
                  onClick={() => handleSelectProgram(prog.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {prog.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Workout Splits Cards (Treinos da Semana a Serem Realizados) */}
        {(() => {
          const currentProg =
            studentWorkouts.find((w) => w.id === session?.programId) ||
            studentWorkouts[0];

          if (!currentProg) return null;

          const splitsToDisplay: WorkoutSplit[] =
            currentProg.splits && currentProg.splits.length > 0
              ? currentProg.splits
              : [
                  {
                    id: currentProg.id,
                    name: currentProg.name,
                    weekDays: currentProg.weekDays || [],
                    exercises: currentProg.exercises || [],
                  },
                ];

          return (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Selecione o Treino a ser Realizado:</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {splitsToDisplay.length} opção(ões) de treino
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {splitsToDisplay.map((split) => {
                  const isCurrentSplit =
                    session?.programId === currentProg.id &&
                    (session?.programName.includes(split.name) ||
                      splitsToDisplay.length === 1);
                  const isExpanded = isCurrentSplit && isWorkoutExpanded;
                  const days = (split.weekDays || [])
                    .map((d) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d])
                    .join(', ');
                  const exCount = split.exercises?.length || 0;

                  return (
                    <div
                      key={split.id}
                      onClick={() => handleSelectSplit(currentProg, split as WorkoutSplit)}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 shadow-md ${
                        isExpanded
                          ? 'bg-slate-900 border-cyan-500 shadow-cyan-950/40 ring-2 ring-cyan-500/50'
                          : isCurrentSplit
                          ? 'bg-slate-950/90 border-slate-700'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-white block truncate">
                              {split.name}
                            </span>
                            {isExpanded && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-cyan-400 font-semibold block">
                            Dias: {days || 'Dias flexíveis'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                              isExpanded
                                ? 'bg-cyan-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <span>{isExpanded ? 'Recolher' : 'Expandir Treino'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                        <span>{exCount} exercício{exCount === 1 ? '' : 's'}</span>
                        {isExpanded ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Treino Pronto para Execução
                          </span>
                        ) : (
                          <span className="text-slate-500">Toque para selecionar e expandir</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* IF NO WORKOUT IS AVAILABLE FOR SELECTED STUDENT */}
      {!session ? (
        <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4 my-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Dumbbell className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">
              Nenhum Treino em Execução para {selectedClient?.name || 'este Aluno'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Prescreva um programa personalizado na aba &ldquo;Criar Treino&rdquo; ou inicie com um protocolo rápido de adaptação muscular com 1 toque.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleCreateQuickStarterWorkout}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Treino de Adaptação Imediato</span>
            </button>

            {onNavigateToCreateWorkout && (
              <button
                onClick={() => onNavigateToCreateWorkout(selectedClientId)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <FilePlus className="w-4 h-4 text-cyan-400" />
                <span>Montar Ficha Completa na Seção &ldquo;Criar Treino&rdquo;</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* SEÇÃO DO TREINO A SER REALIZADO (COM EFEITO DE EXPANSÃO / ANIMAÇÃO) */}
          <AnimatePresence mode="wait">
            {isWorkoutExpanded ? (
              <motion.div
                key={`${session.programId}-${session.programName}`}
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-4 overflow-hidden"
              >
                {/* Header com indicador de expansão do treino ativo */}
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      Treino Expandido: {session.programName}
                    </span>
                    {session.isStarted ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Em Execução
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-bold text-cyan-400">
                        Pronto para Iniciar
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsWorkoutExpanded(false)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 active:scale-95 transition bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                    title="Recolher visualização do treino"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Recolher</span>
                  </button>
                </div>

                {/* Active Workout Progress Bar (Clean & Focused) */}
                {(() => {
            const totalCompletedSets = session.exercises.reduce(
              (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
              0
            );
            const totalSets = session.exercises.reduce(
              (sum, ex) => sum + ex.sets.length,
              0
            );
            const progressPercent = totalSets > 0 ? Math.round((totalCompletedSets / totalSets) * 100) : 0;

            return (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Progresso do Treino</span>
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400">
                        {totalCompletedSets}
                      </span>
                      <span className="text-sm text-slate-400 font-bold">/ {totalSets} séries</span>
                      <span className="text-xs text-slate-500 font-semibold">
                        ({progressPercent}% concluído)
                      </span>
                    </div>
                  </div>

                  {/* Botão de Iniciar Treino ou Indicador de Tempo */}
                  {!session.isStarted ? (
                    <button
                      type="button"
                      onClick={handleStartWorkout}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-emerald-950/40 transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation self-start sm:self-auto"
                      title="Clique para iniciar o treino e começar a contagem do tempo"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Iniciar Treino</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...session, isPaused: !session.isPaused };
                          setSession(updated);
                          storage.saveActiveSession(updated);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs active:scale-95 touch-manipulation"
                        title={session.isPaused ? 'Retomar Treino' : 'Pausar Cronômetro'}
                      >
                        {session.isPaused ? (
                          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                        ) : (
                          <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
                        )}
                      </button>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 font-mono text-xs font-bold text-emerald-400">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{formatElapsed(session.elapsedSeconds)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* HEADER DA LISTA DE EXERCÍCIOS: INDICAÇÃO E BOTÕES EXPANDIR/RECOLHER */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                Exercícios do Treino ({session.exercises.length})
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • Toque no exercício para expandir e registrar suas séries
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExpandAllExercises}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition active:scale-95"
                title="Expandir todos os exercícios"
              >
                Expandir Todos
              </button>
              <button
                type="button"
                onClick={handleCollapseAllExercises}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition active:scale-95"
                title="Recolher todos os exercícios"
              >
                Recolher Todos
              </button>
            </div>
          </div>

          {/* EXERCISE LIST - EXPANDABLE CARDS (INICIALMENTE RECOLHIDOS) */}
          <div className="space-y-3">
            {session.exercises.map((ex, exIndex) => {
              const isExpanded = !!expandedExerciseIds[ex.exerciseId];
              const isHistoryOpen = expandedHistoryExId === ex.exerciseId;
              const historyData = storage.getExerciseHistory(ex.exerciseName);
              const completedInThisEx = ex.sets.filter((s) => s.completed).length;
              const isAllSetsCompleted =
                ex.sets.length > 0 && completedInThisEx === ex.sets.length;

              return (
                <div
                  key={ex.exerciseId}
                  className={`rounded-2xl border transition-all duration-200 shadow-md overflow-hidden ${
                    isExpanded
                      ? 'bg-slate-900 border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-cyan-950/20'
                      : isAllSetsCompleted
                      ? 'bg-slate-900/80 border-emerald-500/50 hover:border-emerald-400/70'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* RECOLHIDO: EXIBE APENAS O NOME DO EXERCÍCIO COM INDICADOR DE EXPANSÃO */}
                  {!isExpanded ? (
                    <div
                      onClick={() => handleToggleExerciseExpand(ex.exerciseId)}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/50 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 border transition ${
                            isAllSetsCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700 group-hover:border-slate-600'
                          }`}
                        >
                          {exIndex + 1}
                        </span>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm sm:text-base text-white truncate group-hover:text-cyan-300 transition">
                              {ex.exerciseName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold text-[10px] border border-slate-700">
                              {ex.muscleGroup}
                            </span>
                            {ex.combinationGroupId && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/40 flex items-center gap-1">
                                <Link2 className="w-3 h-3 text-purple-400" />
                                <span>
                                  {ex.combinationLabel || 'Combinado'} ({ex.combinationOrder || 1}º)
                                </span>
                              </span>
                            )}
                            {ex.method && ex.method !== 'Normal' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-extrabold text-[10px] border border-amber-500/30">
                                {ex.method}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                            isAllSetsCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isAllSetsCompleted && (
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          )}
                          <span>
                            {completedInThisEx}/{ex.sets.length} séries
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleExerciseExpand(ex.exerciseId);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 active:scale-95 transition shadow-sm"
                        >
                          <span>Expandir</span>
                          <ChevronDown className="w-4 h-4 text-cyan-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* EXPANDIDO: VISUALIZAÇÃO COMPLETA DO EXERCÍCIO E SUAS SÉRIES */
                    <div className="p-4 space-y-3.5">
                      {/* Card Header: Exercise Name, Muscle Group, Method, Observations & Collapse button */}
                      <div className="space-y-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/20">
                                {exIndex + 1}
                              </span>
                              <h3
                                onClick={() =>
                                  setExpandedHistoryExId(
                                    isHistoryOpen ? null : ex.exerciseId
                                  )
                                }
                                className="text-base font-extrabold text-white tracking-tight cursor-pointer hover:text-emerald-400 transition flex items-center gap-1.5"
                                title="Toque para ver histórico de cargas"
                              >
                                <span>{ex.exerciseName}</span>
                              </h3>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                {ex.muscleGroup}
                              </span>
                              {ex.combinationGroupId && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 flex items-center gap-1">
                                  <Link2 className="w-3 h-3 text-purple-400" />
                                  <span>
                                    {ex.combinationLabel || 'Combinado'} ({ex.combinationOrder || 1}º em sequência contínua)
                                  </span>
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/30">
                                {ex.method}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                Descanso: {ex.restSeconds}s
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-xs font-mono font-bold px-2 py-1 rounded-xl ${
                                isAllSetsCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {completedInThisEx}/{ex.sets.length} séries
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleExerciseExpand(ex.exerciseId)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
                              title="Recolher exercício"
                            >
                              <ChevronUp className="w-4 h-4 text-cyan-400" />
                              <span>Recolher</span>
                            </button>
                          </div>
                        </div>

                        {ex.observations && (
                          <p className="text-xs text-slate-400 italic bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                            &ldquo;{ex.observations}&rdquo;
                          </p>
                        )}

                        {/* BOTÃO 'VER HISTÓRICO' / PROGRESSO DE CARGAS */}
                        <div className="pt-0.5">
                          <button
                            onClick={() =>
                              setExpandedHistoryExId(
                                isHistoryOpen ? null : ex.exerciseId
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              {isHistoryOpen
                                ? 'Ocultar Gráfico de Evolução'
                                : 'Ver Gráfico de Evolução de Carga (Recharts)'}
                            </span>
                            {isHistoryOpen ? (
                              <ChevronUp className="w-3.5 h-3.5 ml-1 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
                            )}
                          </button>

                          {isHistoryOpen && (
                            <div className="mt-3">
                              <ExerciseHistoryChart
                                exerciseName={ex.exerciseName}
                                history={historyData}
                                currentWeightKg={ex.sets[0]?.weightKg}
                                currentSets={ex.sets}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* LISTA DE SÉRIES COM COLUNAS NÍTIDAS E BOTÕES GIGANTES */}
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-12 gap-1.5 text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">
                          <span className="col-span-2 text-center">Série</span>
                          <span className="col-span-3 text-center">Reps (Alvo)</span>
                          <span className="col-span-5 text-center">Carga (KG)</span>
                          <span className="col-span-2 text-center">Check</span>
                        </div>

                        {ex.sets.map((set, setIndex) => {
                          const hasSubsets = set.subSets && set.subSets.length > 0;

                          return (
                            <div key={set.setNumber} className="space-y-1.5">
                              {/* Linha da Série Principal */}
                              <div
                                className={`grid grid-cols-12 gap-1.5 items-center p-2 rounded-xl transition-all duration-150 ${
                                  set.completed
                                    ? 'bg-emerald-950/30 border border-emerald-500/40 shadow-sm'
                                    : 'bg-slate-950/70 border border-slate-800/80 hover:border-slate-700'
                                }`}
                              >
                                {/* Col 1: Set Number */}
                                <div className="col-span-2 flex flex-col items-center justify-center">
                                  <span
                                    className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                                      set.completed
                                        ? 'bg-emerald-500 text-slate-950'
                                        : 'bg-slate-800 text-slate-200'
                                    }`}
                                  >
                                    #{set.setNumber}
                                  </span>
                                  {set.extraVariation ? (
                                    <span
                                      className="text-[9px] font-bold text-amber-400 block mt-0.5 truncate max-w-[65px]"
                                      title={set.extraVariation}
                                    >
                                      {set.extraVariation.split(' • ')[0]}
                                    </span>
                                  ) : set.method && set.method !== 'Normal' ? (
                                    <span
                                      className="text-[9px] font-bold text-amber-400 block mt-0.5 truncate max-w-[65px]"
                                      title={set.method}
                                    >
                                      {set.method}
                                    </span>
                                  ) : null}
                                </div>

                                {/* Col 2: Reps Target & Stepper */}
                                <div className="col-span-3 flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => adjustReps(exIndex, setIndex, -1)}
                                    className="w-7 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-sm flex items-center justify-center active:scale-90 transition touch-manipulation"
                                    title="-1 repetição"
                                  >
                                    -
                                  </button>
                                  <div className="text-center min-w-[34px]">
                                    <span className="text-sm font-black text-white font-mono block">
                                      {set.completedReps}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-semibold block">
                                      {set.repZone}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => adjustReps(exIndex, setIndex, +1)}
                                    className="w-7 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-sm flex items-center justify-center active:scale-90 transition touch-manipulation"
                                    title="+1 repetição"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Col 3: Carga (KG) */}
                                <div className="col-span-5 flex items-center justify-center">
                                  <div className="relative w-20 text-center">
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={set.weightKg}
                                      onChange={(e) =>
                                        setWeightDirect(
                                          exIndex,
                                          setIndex,
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full py-1.5 text-center font-mono font-black text-base text-emerald-400 bg-slate-900 border border-slate-700/80 rounded-xl focus:outline-none focus:border-emerald-500 shadow-inner"
                                    />
                                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                      kg
                                    </span>
                                  </div>
                                </div>

                                {/* Col 4: Botão de Check List Lateral */}
                                <div className="col-span-2 flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSetCheck(exIndex, setIndex)}
                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-150 active:scale-90 touch-manipulation ${
                                      set.completed
                                        ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 shadow-emerald-500/40'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                                    }`}
                                    title={set.completed ? 'Desmarcar série' : 'Concluir série e iniciar descanso'}
                                  >
                                    <Check
                                      className={`w-6 h-6 stroke-[3] transition-transform ${
                                        set.completed ? 'scale-110' : 'opacity-40'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              {/* Subséries Vinculadas ao Método Avançado */}
                              {hasSubsets && (
                                <div className="ml-3 sm:ml-5 pl-2.5 border-l-2 border-purple-500/50 space-y-1.5 my-1">
                                  {set.subSets!.map((sub, subIdx) => (
                                    <div
                                      key={sub.id || subIdx}
                                      className={`grid grid-cols-12 gap-1.5 items-center p-2 rounded-xl transition-all ${
                                        sub.completed
                                          ? 'bg-purple-950/40 border border-purple-500/50 shadow-sm'
                                          : 'bg-slate-950/70 border border-purple-500/30'
                                      }`}
                                    >
                                      {/* Col 1: Subsérie label */}
                                      <div className="col-span-2 flex flex-col items-center justify-center">
                                        <span className="text-[10px] font-black text-purple-300">
                                          ↳ Sub #{sub.subSetNumber}
                                        </span>
                                        {sub.note && (
                                          <span
                                            className="text-[8px] text-slate-400 block truncate max-w-[65px]"
                                            title={sub.note}
                                          >
                                            {sub.note}
                                          </span>
                                        )}
                                      </div>

                                      {/* Col 2: Reps Stepper */}
                                      <div className="col-span-3 flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleAdjustSubSetReps(exIndex, setIndex, subIdx, -1)
                                          }
                                          className="w-6 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs flex items-center justify-center active:scale-90"
                                        >
                                          -
                                        </button>
                                        <div className="text-center min-w-[28px]">
                                          <span className="text-xs font-black text-white font-mono block">
                                            {sub.completedReps}
                                          </span>
                                          <span className="text-[8px] text-slate-400 block truncate max-w-[40px]">
                                            {sub.repZone}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleAdjustSubSetReps(exIndex, setIndex, subIdx, +1)
                                          }
                                          className="w-6 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs flex items-center justify-center active:scale-90"
                                        >
                                          +
                                        </button>
                                      </div>

                                      {/* Col 3: Carga (kg) */}
                                      <div className="col-span-5 flex items-center justify-center">
                                        <div className="relative w-20 text-center">
                                          <input
                                            type="number"
                                            step="0.5"
                                            value={sub.weightKg}
                                            onChange={(e) =>
                                              handleSetSubSetWeightDirect(
                                                exIndex,
                                                setIndex,
                                                subIdx,
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            className="w-full py-1 text-center font-mono font-black text-xs text-purple-300 bg-slate-900 border border-slate-700/80 rounded-xl focus:outline-none focus:border-purple-500 shadow-inner"
                                          />
                                          <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">
                                            kg
                                          </span>
                                        </div>
                                      </div>

                                      {/* Col 4: Check subsérie */}
                                      <div className="col-span-2 flex justify-center">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleSubSetCheck(exIndex, setIndex, subIdx)
                                          }
                                          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow transition-all active:scale-90 ${
                                            sub.completed
                                              ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                                          }`}
                                          title={
                                            sub.completed
                                              ? 'Desmarcar subsérie'
                                              : 'Concluir subsérie'
                                          }
                                        >
                                          <Check
                                            className={`w-5 h-5 stroke-[3] ${
                                              sub.completed ? 'scale-110' : 'opacity-40'
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer do Exercício Expandido com botão de recolher */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400">
                          {isAllSetsCompleted
                            ? '✓ Todas as séries deste exercício concluídas'
                            : `Faltam ${ex.sets.length - completedInThisEx} série(s) para concluir`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleExerciseExpand(ex.exerciseId)}
                          className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition active:scale-95"
                        >
                          <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Concluir e Recolher</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CAMPO DE NOTAS DO TREINO & FEEDBACK TÉCNICO DO TREINADOR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <PenLine className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-white">
                      Notas do Treino & Feedback Técnico
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Salvo em tempo real
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Registre correções biomecânicas, postura, amplitude e feedbacks específicos para o aluno.
                  </p>
                </div>
              </div>

              {session.trainerNotes && (
                <button
                  type="button"
                  onClick={() => handleUpdateTrainerNotes('')}
                  className="text-[11px] text-slate-400 hover:text-rose-400 self-start sm:self-center flex items-center gap-1 transition"
                  title="Limpar notas"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {/* Quick Correction Tags (Atalhos rápidos para tablet) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Atalhos Rápidos de Correção Técnica (Toque para inserir):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '🎯 Retração escapular ativa',
                  '🔄 Cadência controlada 3010',
                  '📏 Amplitude completa de movimento',
                  '⚠️ Manter coluna lombar neutra',
                  '💪 Pegada firme e alinhada',
                  '🦶 Base e pés bem plantados',
                  '🔥 Excelente progressão de carga',
                  '⏱️ Respeitar intervalo de descanso',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAppendTrainerQuickTag(tag)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition active:scale-95 touch-manipulation"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea de Notas do Treinador */}
            <div className="space-y-1">
              <textarea
                value={session.trainerNotes || ''}
                onChange={(e) => handleUpdateTrainerNotes(e.target.value)}
                placeholder="Ex: No supino, fechar pegada em 2cm para proteger o ombro. No agachamento, manteve profundidade perfeita. Aluno sentiu bom estímulo no quadríceps..."
                rows={3}
                className="w-full p-3 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 placeholder:text-slate-500 transition resize-y min-h-[80px]"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span>Ficará arquivado permanentemente no histórico de treinos do aluno.</span>
                <span>{(session.trainerNotes || '').length} caracteres</span>
              </div>
            </div>
          </div>

          {/* BOTÃO DE FINALIZAR TREINO (APARECE APÓS O ÚLTIMO EXERCÍCIO) */}
          {(() => {
            const totalCompletedSets = session.exercises.reduce(
              (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
              0
            );
            const totalSets = session.exercises.reduce(
              (sum, ex) => sum + ex.sets.length,
              0
            );
            const allCompleted = totalSets > 0 && totalCompletedSets === totalSets;

            return (
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </span>
                      <h4 className="text-base font-extrabold text-white">
                        Finalizar Treino
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      {allCompleted
                        ? '🎉 Parabéns! Todas as séries programadas foram concluídas.'
                        : `${totalCompletedSets} de ${totalSets} séries concluídas. Clique no botão ao lado para concluir a sessão.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinishWorkout}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-sm shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation flex-shrink-0"
                  >
                    <CheckCircle2 className="w-5 h-5 fill-slate-950 text-emerald-400" />
                    <span>Finalizar Treino</span>
                  </button>
                </div>
              </div>
            );
          })()}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-treino-notice"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Treino Recolhido: {session.programName}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {session.exercises.length} exercícios preparados • Toque para expandir e iniciar a execução
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkoutExpanded(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition"
              >
                <span>Expandir Treino</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )}

      {/* WORKOUT FINISHED CELEBRATION MODAL */}
      {isFinishedModalOpen && workoutSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-emerald-500/50 p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-400 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Treino Concluído!</h3>
              <p className="text-xs text-slate-300">
                Excelente trabalho com o aluno <strong className="text-emerald-400">{session?.clientName || selectedClient?.name}</strong>!
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2 text-center pt-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Tempo Total
                </span>
                <span className="text-base font-black text-white block mt-0.5 font-mono">
                  {workoutSummary.durationStr}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Séries Cumpridas
                </span>
                <span className="text-base font-black text-emerald-400 block mt-0.5">
                  {workoutSummary.completedSets} / {workoutSummary.totalSets}
                </span>
              </div>

              <div className="col-span-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/30">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Tonelagem Total Levantada
                </span>
                <span className="text-2xl font-black text-white block mt-0.5">
                  {workoutSummary.totalVolumeKg.toLocaleString('pt-BR')} <span className="text-sm font-bold text-emerald-400">kg</span>
                </span>
              </div>

              {workoutSummary.trainerNotes && (
                <div className="col-span-2 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-left space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                    <PenLine className="w-3 h-3" />
                    Feedback Técnico do Treinador Registrado:
                  </span>
                  <p className="text-xs text-slate-200 italic pl-1">
                    &ldquo;{workoutSummary.trainerNotes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setIsFinishedModalOpen(false);
                if (onFinishWorkout) onFinishWorkout();
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/50 active:scale-95 transition"
            >
              Concluir e Salvar no Histórico
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
