'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WorkoutProgram,
  WorkoutSplit,
  Client,
  ExerciseItem,
  MuscleGroup,
  MUSCLE_GROUPS,
  ExtraBlock,
  DatabaseExercise,
  WORKOUT_METHODS,
  ExerciseSetDetail,
  ExerciseSubSetDetail,
} from '@/types';
import { storage } from '@/lib/storage';
import {
  Plus,
  Trash2,
  BarChart3,
  Dumbbell,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Info,
  Calendar,
  User,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Edit3,
  Copy,
  Play,
  Save,
  Check,
  BookOpen,
  Search,
  Filter,
  RotateCcw,
  AlertTriangle,
  Link2,
  Unlink,
  ArrowDown,
} from 'lucide-react';

interface CreateWorkoutSectionProps {
  clients: Client[];
  workouts: WorkoutProgram[];
  preSelectedClientId?: string;
  onSaveWorkout: (workout: WorkoutProgram) => void;
  onDeleteWorkout?: (workoutId: string) => void;
  onStartExecution: (workout: WorkoutProgram) => void;
}

const WEEKDAYS = [
  { id: 1, label: 'Segunda-feira', short: 'Seg' },
  { id: 2, label: 'Terça-feira', short: 'Ter' },
  { id: 3, label: 'Quarta-feira', short: 'Qua' },
  { id: 4, label: 'Quinta-feira', short: 'Qui' },
  { id: 5, label: 'Sexta-feira', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
  { id: 0, label: 'Domingo', short: 'Dom' },
];

const COMMON_EXERCISES: Record<MuscleGroup, string[]> = {
  Peitoral: [
    'Supino Reto com Barra',
    'Supino Inclinado com Halteres',
    'Crucifixo Reto Halteres',
    'Crossover Polia Média',
    'Supino Declinado',
    'Peck Deck / Voador',
  ],
  Dorsal: [
    'Puxada Frontal Aberta',
    'Remada Curvada com Barra',
    'Remada Baixa no Triângulo',
    'Puxada Articulada Unilateral',
    'Pulldown na Polia',
    'Barra Fixa Pronada',
  ],
  'Deltóide Anterior': ['Desenvolvimento com Halteres', 'Desenvolvimento Militar Barra', 'Elevação Frontal'],
  'Deltóide Lateral': ['Elevação Lateral com Halteres', 'Elevação Lateral na Polia', 'Elevação Lateral Inclinado'],
  'Deltóide Posterior': ['Crucifixo Invertido Halteres', 'Face Pull na Corda', 'Peck Deck Invertido'],
  Tríceps: [
    'Tríceps Corda na Polia',
    'Tríceps Testa com Barra W',
    'Tríceps Francês Unilateral',
    'Tríceps Coice na Polia',
    'Tríceps Mergulho Paralelas',
  ],
  Bíceps: [
    'Rosca Direta com Barra W',
    'Rosca Alternada com Halteres',
    'Rosca Martelo Halteres',
    'Rosca Scott com Barra',
    'Rosca Concentrada',
  ],
  Quadríceps: [
    'Agachamento Livre com Barra',
    'Leg Press 45',
    'Cadeira Extensora',
    'Agachamento Búlgaro',
    'Hack Machine',
  ],
  Ísquios: ['Cadeira Flexora', 'Mesa Flexora', 'Stiff com Barra', 'Levantamento Terra RDL'],
  Glúteo: ['Elevação Pélvica com Barra', 'Glúteo Caneleira na Polia', 'Cadeira Abdutora', 'Afundo com Halteres'],
  Panturrilha: ['Gêmeos em Pé no Degrau', 'Gêmeos Sentado na Máquina', 'Panturrilha no Leg Press'],
  Trapézio: ['Encolhimento com Barra', 'Encolhimento com Halteres'],
  Abdômen: ['Abdominal Supra no Solo', 'Abdominal na Polia / Corda', 'Elevação de Pernas na Barra', 'Prancha Isométrica'],
};

// Helper to detect if a method requires automatic subsérie generation
const isMethodWithSubsets = (method: string | undefined): boolean => {
  if (!method) return false;
  const m = method.trim().toLowerCase();
  return (
    m === '3/7' ||
    m === 'cluster-set' ||
    m === 'cluster set' ||
    m === 'drop-set tradicional' ||
    m === 'drop-set adaptado' ||
    m === 'fst-7' ||
    m === 'parcial'
  );
};

// Generates smart default data for a subsérie based on the chosen advanced method
const getDefaultSubSetData = (
  method: string,
  subSetNumber: number,
  mainRepZone?: string,
  mainWeight?: number
): ExerciseSubSetDetail => {
  const m = method.trim().toLowerCase();
  let repZone = 'Até a falha';
  let suggestedWeightKg: number | undefined = mainWeight;
  let note = '';

  if (m === '3/7') {
    const stepReps = Math.min(3 + subSetNumber, 7);
    repZone = `${stepReps} reps`;
    suggestedWeightKg = mainWeight;
    note = `Passo ${subSetNumber + 1} (${stepReps} reps) • 15s intervalo`;
  } else if (m === 'cluster-set' || m === 'cluster set') {
    repZone = '3-5 reps';
    suggestedWeightKg = mainWeight;
    note = `Cluster ${subSetNumber} • 10-15s pausa intra-série`;
  } else if (m === 'drop-set tradicional') {
    repZone = 'Até a falha';
    if (mainWeight && mainWeight > 0) {
      const reduction = 0.2 * subSetNumber;
      suggestedWeightKg = Math.max(1, Math.round(mainWeight * (1 - reduction)));
    }
    note = `Drop ${subSetNumber} • Redução ~20-25% sem descanso`;
  } else if (m === 'drop-set adaptado') {
    repZone = 'Até a falha';
    if (mainWeight && mainWeight > 0) {
      const reduction = 0.15 * subSetNumber;
      suggestedWeightKg = Math.max(1, Math.round(mainWeight * (1 - reduction)));
    }
    note = `Drop adaptado ${subSetNumber} • Redução sem descanso`;
  } else if (m === 'fst-7') {
    repZone = '10-12 reps';
    suggestedWeightKg = mainWeight;
    note = `Série FST-7 #${subSetNumber + 1} • 30s descanso + alongamento`;
  } else if (m === 'parcial') {
    repZone = 'Parciais até a falha';
    suggestedWeightKg = mainWeight;
    note = `Repetições parciais imediatas sem descanso`;
  } else {
    repZone = mainRepZone || '8-10';
    note = 'Subsérie complementar';
  }

  return {
    id: `subset-${Date.now()}-${subSetNumber}-${Math.random().toString(36).substring(2, 6)}`,
    subSetNumber,
    repZone,
    suggestedWeightKg,
    note,
  };
};

export const CreateWorkoutSection: React.FC<CreateWorkoutSectionProps> = ({
  clients,
  workouts,
  preSelectedClientId,
  onSaveWorkout,
  onDeleteWorkout,
  onStartExecution,
}) => {
  // 1. CLIENT SELECTION
  const [clientId, setClientId] = useState<string>(
    preSelectedClientId || clients[0]?.id || ''
  );

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0];
  const clientPrograms = workouts.filter((w) => w.clientId === clientId);

  // 2. PROGRAM SELECTION & ACCORDION EXPANSION STATE
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    const progs = workouts.filter(
      (w) => w.clientId === (preSelectedClientId || clients[0]?.id)
    );
    return progs[0]?.id || '';
  });

  // Controls which program is expanded (accordion expansion effect)
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(() => {
    const progs = workouts.filter(
      (w) => w.clientId === (preSelectedClientId || clients[0]?.id)
    );
    return progs[0]?.id || null;
  });

  const [isCreatingNewProgram, setIsCreatingNewProgram] = useState(false);

  // Form fields for new program
  const [newProgName, setNewProgName] = useState('');
  const [newProgGoal, setNewProgGoal] = useState('Hipertrofia Máxima');
  const [newProgStartDate, setNewProgStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newProgEndDate, setNewProgEndDate] = useState('2026-12-31');

  // Edit Program Info Modal State
  const [isEditProgramModalOpen, setIsEditProgramModalOpen] = useState(false);
  const [editProgId, setEditProgId] = useState<string>('');
  const [editProgName, setEditProgName] = useState<string>('');
  const [editProgGoal, setEditProgGoal] = useState<string>('');
  const [editProgStartDate, setEditProgStartDate] = useState<string>('');
  const [editProgEndDate, setEditProgEndDate] = useState<string>('');

  // Delete Program Modal State
  const [programToDelete, setProgramToDelete] = useState<WorkoutProgram | null>(null);

  // Currently loaded program in editor
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(() => {
    const progs = workouts.filter(
      (w) => w.clientId === (preSelectedClientId || clients[0]?.id)
    );
    return progs[0] ? JSON.parse(JSON.stringify(progs[0])) : null;
  });

  // 3. SPLIT SELECTION (TREINOS DA SEMANA DENTRO DO PROGRAMA)
  const [selectedSplitId, setSelectedSplitId] = useState<string>(() => {
    const progs = workouts.filter(
      (w) => w.clientId === (preSelectedClientId || clients[0]?.id)
    );
    return progs[0]?.splits?.[0]?.id || '';
  });

  // Volume Drawer
  const [isVolumeDrawerOpen, setIsVolumeDrawerOpen] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // EXERCISE DATABASE STATE
  const [exerciseDatabase, setExerciseDatabase] = useState<DatabaseExercise[]>(() =>
    storage.getExerciseDatabase()
  );
  const [isExerciseDbModalOpen, setIsExerciseDbModalOpen] = useState(false);
  const [targetExerciseIndexForDb, setTargetExerciseIndexForDb] = useState<number | null>(null);
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbSelectedMuscleFilter, setDbSelectedMuscleFilter] = useState<'Todos' | MuscleGroup>('Todos');
  const [activeDbTab, setActiveDbTab] = useState<'catalog' | 'create_new'>('catalog');

  // Form for creating a new exercise in DB
  const [newExName, setNewExName] = useState('');
  const [newExMuscleGroup, setNewExMuscleGroup] = useState<MuscleGroup>('Peitoral');
  const [exerciseToDeleteFromDb, setExerciseToDeleteFromDb] = useState<DatabaseExercise | null>(null);

  // EXERCISES EXPANSION STATE (DEFAULT: COLLAPSED)
  const [expandedExerciseIds, setExpandedExerciseIds] = useState<Record<string, boolean>>({});

  // COMBINE EXERCISES MODAL STATE
  const [isCombineModalOpen, setIsCombineModalOpen] = useState(false);
  const [selectedExerciseIdsToCombine, setSelectedExerciseIdsToCombine] = useState<string[]>([]);
  const [combinationLabel, setCombinationLabel] = useState<string>('Bi-Set');

  // Handle client change via user selection
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setIsCreatingNewProgram(false);
    const progs = workouts.filter((w) => w.clientId === newClientId);
    if (progs.length > 0) {
      const chosen = progs[0];
      setSelectedProgramId(chosen.id);
      setExpandedProgramId(chosen.id);
      setEditingProgram(JSON.parse(JSON.stringify(chosen)));
      setSelectedSplitId(chosen.splits?.[0]?.id || '');
    } else {
      setSelectedProgramId('');
      setExpandedProgramId(null);
      setEditingProgram(null);
      setSelectedSplitId('');
    }
  };

  // Sync if preSelectedClientId arrives from outside navigation
  useEffect(() => {
    if (preSelectedClientId && preSelectedClientId !== clientId) {
      const timer = setTimeout(() => {
        setClientId(preSelectedClientId);
        setIsCreatingNewProgram(false);
        const progs = workouts.filter((w) => w.clientId === preSelectedClientId);
        if (progs.length > 0) {
          const chosen = progs[0];
          setSelectedProgramId(chosen.id);
          setExpandedProgramId(chosen.id);
          setEditingProgram(JSON.parse(JSON.stringify(chosen)));
          setSelectedSplitId(chosen.splits?.[0]?.id || '');
        } else {
          setSelectedProgramId('');
          setExpandedProgramId(null);
          setEditingProgram(null);
          setSelectedSplitId('');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [preSelectedClientId, clientId, workouts]);

  // Handle choosing / expanding an existing program
  const handleSelectProgram = (programId: string) => {
    if (selectedProgramId === programId && expandedProgramId === programId) {
      // Toggle collapse if user clicks the already expanded program
      setExpandedProgramId(null);
      return;
    }

    setSelectedProgramId(programId);
    setExpandedProgramId(programId);
    setIsCreatingNewProgram(false);
    const prog = workouts.find((w) => w.id === programId);
    if (prog) {
      const copy: WorkoutProgram = JSON.parse(JSON.stringify(prog));
      setEditingProgram(copy);
      if (copy.splits && copy.splits.length > 0) {
        setSelectedSplitId(copy.splits[0].id);
      }
    }
  };

  // Open Edit Program Info Modal
  const handleOpenEditProgramModal = (prog: WorkoutProgram, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditProgId(prog.id);
    setEditProgName(prog.name);
    setEditProgGoal(prog.goal || '');
    setEditProgStartDate(prog.startDate || new Date().toISOString().split('T')[0]);
    setEditProgEndDate(prog.endDate || '2026-12-31');
    setIsEditProgramModalOpen(true);
  };

  // Save edited program info
  const handleSaveProgramInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProgId || !editProgName.trim()) return;

    const target = workouts.find((w) => w.id === editProgId);
    if (!target) return;

    const updated: WorkoutProgram = {
      ...target,
      name: editProgName.trim(),
      goal: editProgGoal.trim(),
      startDate: editProgStartDate,
      endDate: editProgEndDate,
    };

    onSaveWorkout(updated);

    if (editingProgram?.id === editProgId) {
      setEditingProgram((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              goal: updated.goal,
              startDate: updated.startDate,
              endDate: updated.endDate,
            }
          : null
      );
    }

    setIsEditProgramModalOpen(false);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  // Delete workout program
  const handleConfirmDeleteProgram = () => {
    if (!programToDelete) return;
    const deletedId = programToDelete.id;

    if (onDeleteWorkout) {
      onDeleteWorkout(deletedId);
    } else {
      storage.deleteWorkout(deletedId);
    }

    const remaining = workouts.filter(
      (w) => w.clientId === clientId && w.id !== deletedId
    );

    if (selectedProgramId === deletedId) {
      if (remaining.length > 0) {
        const nextProg = remaining[0];
        setSelectedProgramId(nextProg.id);
        setExpandedProgramId(nextProg.id);
        setEditingProgram(JSON.parse(JSON.stringify(nextProg)));
        setSelectedSplitId(nextProg.splits?.[0]?.id || '');
      } else {
        setSelectedProgramId('');
        setExpandedProgramId(null);
        setEditingProgram(null);
        setSelectedSplitId('');
      }
    } else if (expandedProgramId === deletedId) {
      setExpandedProgramId(null);
    }

    setProgramToDelete(null);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  // Create a new Program for this client
  const handleConfirmCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName.trim()) return;

    const newId = `prog-${Date.now()}`;
    const initialSplit: WorkoutSplit = {
      id: `split-a-${Date.now()}`,
      name: 'Treino A - Peitoral e Tríceps',
      weekDays: [1, 4], // Seg e Qui
      exercises: [
        {
          id: `ex-${Date.now()}-1`,
          name: 'Supino Reto com Barra',
          muscleGroup: 'Peitoral',
          sets: 4,
          repZone: '8-12',
          restSeconds: 90,
          method: 'Normal',
          observations: 'Manter escápulas retraídas.',
          extraBlocks: [],
        },
        {
          id: `ex-${Date.now()}-2`,
          name: 'Tríceps Corda na Polia',
          muscleGroup: 'Tríceps',
          sets: 3,
          repZone: '12-15',
          restSeconds: 60,
          method: 'Drop-set',
          observations: 'Pausa isométrica de 1s no final.',
          extraBlocks: [],
        },
      ],
    };

    const newProgram: WorkoutProgram = {
      id: newId,
      clientId,
      name: newProgName.trim(),
      goal: newProgGoal.trim(),
      startDate: newProgStartDate,
      endDate: newProgEndDate,
      splits: [initialSplit],
      weekDays: initialSplit.weekDays,
      exercises: initialSplit.exercises,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveWorkout(newProgram);
    setSelectedProgramId(newId);
    setExpandedProgramId(newId);
    setEditingProgram(newProgram);
    setSelectedSplitId(initialSplit.id);
    setIsCreatingNewProgram(false);
    setNewProgName('');
  };

  // Active split currently displayed in editor
  const activeSplit = editingProgram?.splits.find((s) => s.id === selectedSplitId) || editingProgram?.splits[0];

  // Toggle weekday for current split (allows multiple days or single day)
  const handleToggleSplitWeekDay = (dayId: number) => {
    if (!editingProgram || !activeSplit) return;

    const currentDays = activeSplit.weekDays || [];
    let updatedDays: number[];

    if (currentDays.includes(dayId)) {
      // Don't allow empty, keep at least 1 day
      if (currentDays.length === 1) return;
      updatedDays = currentDays.filter((d) => d !== dayId);
    } else {
      updatedDays = [...currentDays, dayId].sort();
    }

    const updatedSplits = editingProgram.splits.map((s) =>
      s.id === activeSplit.id ? { ...s, weekDays: updatedDays } : s
    );

    setEditingProgram({
      ...editingProgram,
      splits: updatedSplits,
    });
  };

  // Add a new split (Treino B, Treino C, etc.)
  const handleAddSplit = () => {
    if (!editingProgram) return;

    const nextLetter = String.fromCharCode(65 + editingProgram.splits.length); // A, B, C, D...
    const newSplit: WorkoutSplit = {
      id: `split-${Date.now()}`,
      name: `Treino ${nextLetter} - Novo Grupamento`,
      weekDays: [2, 5], // default Ter e Sex
      exercises: [
        {
          id: `ex-${Date.now()}`,
          name: 'Puxada Frontal Aberta',
          muscleGroup: 'Dorsal',
          sets: 4,
          repZone: '8-12',
          restSeconds: 75,
          method: 'Normal',
          observations: 'Puxar até a altura da fúrcula.',
          extraBlocks: [],
        },
      ],
    };

    const updatedSplits = [...editingProgram.splits, newSplit];
    setEditingProgram({
      ...editingProgram,
      splits: updatedSplits,
    });
    setSelectedSplitId(newSplit.id);
  };

  // Presets: Generate 1 Workout for each Weekday (Segunda a Sexta)
  const handleGenerateDailyWorkouts = () => {
    if (!editingProgram) return;

    const dailySplits: WorkoutSplit[] = [
      {
        id: `split-seg-${Date.now()}`,
        name: 'Treino de Segunda - Peitoral & Tríceps',
        weekDays: [1],
        exercises: [
          {
            id: `ex-seg-1`,
            name: 'Supino Reto com Barra',
            muscleGroup: 'Peitoral',
            sets: 4,
            repZone: '8-12',
            restSeconds: 90,
            method: 'Normal',
            observations: 'Foco em força e hipertrofia.',
            extraBlocks: [],
          },
        ],
      },
      {
        id: `split-ter-${Date.now()}`,
        name: 'Treino de Terça - Dorsal & Bíceps',
        weekDays: [2],
        exercises: [
          {
            id: `ex-ter-1`,
            name: 'Puxada Frontal Aberta',
            muscleGroup: 'Dorsal',
            sets: 4,
            repZone: '8-12',
            restSeconds: 75,
            method: 'Normal',
            observations: 'Boa amplitude e retração.',
            extraBlocks: [],
          },
        ],
      },
      {
        id: `split-qua-${Date.now()}`,
        name: 'Treino de Quarta - Membros Inferiores',
        weekDays: [3],
        exercises: [
          {
            id: `ex-qua-1`,
            name: 'Agachamento Livre com Barra',
            muscleGroup: 'Quadríceps',
            sets: 4,
            repZone: '8-10',
            restSeconds: 90,
            method: 'Normal',
            observations: 'Base firme e boa profundidade.',
            extraBlocks: [],
          },
        ],
      },
      {
        id: `split-qui-${Date.now()}`,
        name: 'Treino de Quinta - Ombros & Abdômen',
        weekDays: [4],
        exercises: [
          {
            id: `ex-qui-1`,
            name: 'Desenvolvimento com Halteres',
            muscleGroup: 'Deltóide Anterior',
            sets: 4,
            repZone: '10-12',
            restSeconds: 60,
            method: 'Normal',
            observations: 'Controle na descida.',
            extraBlocks: [],
          },
        ],
      },
      {
        id: `split-sex-${Date.now()}`,
        name: 'Treino de Sexta - Posterior & Glúteo',
        weekDays: [5],
        exercises: [
          {
            id: `ex-sex-1`,
            name: 'Stiff com Barra',
            muscleGroup: 'Ísquios',
            sets: 4,
            repZone: '10-12',
            restSeconds: 75,
            method: 'Normal',
            observations: 'Coluna neutra.',
            extraBlocks: [],
          },
        ],
      },
    ];

    setEditingProgram({
      ...editingProgram,
      splits: dailySplits,
    });
    setSelectedSplitId(dailySplits[0].id);
  };

  // Remove a split
  const handleRemoveSplit = (splitId: string) => {
    if (!editingProgram || editingProgram.splits.length <= 1) return;
    const remaining = editingProgram.splits.filter((s) => s.id !== splitId);
    setEditingProgram({
      ...editingProgram,
      splits: remaining,
    });
    setSelectedSplitId(remaining[0].id);
  };

  // Update Split Name
  const handleUpdateSplitName = (newName: string) => {
    if (!editingProgram || !activeSplit) return;
    const updated = editingProgram.splits.map((s) =>
      s.id === activeSplit.id ? { ...s, name: newName } : s
    );
    setEditingProgram({ ...editingProgram, splits: updated });
  };

  // EXERCISE DATABASE HANDLERS
  const openExerciseDbModal = (
    targetIndex: number | null = null,
    defaultMuscle?: MuscleGroup
  ) => {
    setTargetExerciseIndexForDb(targetIndex);
    if (defaultMuscle) {
      setDbSelectedMuscleFilter(defaultMuscle);
      setNewExMuscleGroup(defaultMuscle);
    } else if (targetIndex !== null && activeSplit?.exercises[targetIndex]) {
      setDbSelectedMuscleFilter(activeSplit.exercises[targetIndex].muscleGroup);
      setNewExMuscleGroup(activeSplit.exercises[targetIndex].muscleGroup);
    } else {
      setDbSelectedMuscleFilter('Todos');
    }
    setDbSearchQuery('');
    setActiveDbTab('catalog');
    setIsExerciseDbModalOpen(true);
  };

  const handleSelectExerciseFromDb = (dbExercise: DatabaseExercise) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit) return prev;

      if (targetExerciseIndexForDb !== null) {
        const updatedExercises = currentSplit.exercises.map((ex, i) =>
          i === targetExerciseIndexForDb
            ? { ...ex, name: dbExercise.name, muscleGroup: dbExercise.muscleGroup }
            : ex
        );
        const updatedSplits = prev.splits.map((s) =>
          s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
        );
        return { ...prev, splits: updatedSplits };
      } else {
        const newExId = `ex-${dbExercise.id}-${Date.now()}-${currentSplit.exercises.length + 1}`;
        const newExItem: ExerciseItem = {
          id: newExId,
          name: dbExercise.name,
          muscleGroup: dbExercise.muscleGroup,
          sets: 4,
          repZone: '8-12',
          restSeconds: 60,
          method: 'Normal',
          observations: '',
          extraBlocks: [],
          setDetails: [
            { id: `s-${newExId}-1`, setNumber: 1, repZone: '8-12', method: 'Normal' },
            { id: `s-${newExId}-2`, setNumber: 2, repZone: '8-12', method: 'Normal' },
            { id: `s-${newExId}-3`, setNumber: 3, repZone: '8-12', method: 'Normal' },
            { id: `s-${newExId}-4`, setNumber: 4, repZone: '8-12', method: 'Normal' },
          ],
        };
        setExpandedExerciseIds((exp) => ({ ...exp, [newExId]: true }));
        const updatedSplits = prev.splits.map((s) =>
          s.id === currentSplit.id ? { ...s, exercises: [...s.exercises, newExItem] } : s
        );
        return { ...prev, splits: updatedSplits };
      }
    });

    setIsExerciseDbModalOpen(false);
  };

  const handleCreateAndAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const created = storage.addExerciseToDatabase(newExName, newExMuscleGroup);
    const updatedDb = storage.getExerciseDatabase();
    setExerciseDatabase(updatedDb);

    handleSelectExerciseFromDb(created);
    setNewExName('');
  };

  const handleConfirmDeleteFromDb = () => {
    if (!exerciseToDeleteFromDb) return;
    const updatedDb = storage.deleteExerciseFromDatabase(exerciseToDeleteFromDb.id);
    setExerciseDatabase(updatedDb);
    setExerciseToDeleteFromDb(null);
  };

  // Filtered exercises for the database modal
  const filteredDbExercises = exerciseDatabase.filter((ex) => {
    const matchesMuscle =
      dbSelectedMuscleFilter === 'Todos' || ex.muscleGroup === dbSelectedMuscleFilter;
    const matchesSearch =
      !dbSearchQuery.trim() ||
      ex.name.toLowerCase().includes(dbSearchQuery.toLowerCase().trim()) ||
      ex.muscleGroup.toLowerCase().includes(dbSearchQuery.toLowerCase().trim());
    return matchesMuscle && matchesSearch;
  });

  // EXERCISE CRUD INSIDE ACTIVE SPLIT
  const addExercise = () => {
    openExerciseDbModal(null);
  };

  // Polymorphic updateExercise: supports single field or multi-field partial updates
  function updateExercise(index: number, updates: Partial<ExerciseItem>): void;
  function updateExercise<K extends keyof ExerciseItem>(
    index: number,
    fieldOrUpdates: K,
    value?: ExerciseItem[K]
  ): void;
  function updateExercise<K extends keyof ExerciseItem>(
    index: number,
    fieldOrUpdates: K | Partial<ExerciseItem>,
    value?: ExerciseItem[K]
  ) {
    const patch: Partial<ExerciseItem> =
      typeof fieldOrUpdates === 'string'
        ? { [fieldOrUpdates]: value }
        : fieldOrUpdates;

    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit || !currentSplit.exercises[index]) return prev;

      const updatedExercises = currentSplit.exercises.map((ex, i) =>
        i === index ? { ...ex, ...patch } : ex
      );

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  }

  const removeExercise = (index: number) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit) return prev;

      const target = currentSplit.exercises[index];
      if (target) {
        setExpandedExerciseIds((exp) => {
          const next = { ...exp };
          delete next[target.id];
          return next;
        });
      }

      const updatedExercises = currentSplit.exercises.filter((_, i) => i !== index);
      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  };

  // Helper to guarantee setDetails exists for an exercise
  const getExerciseSetDetails = (ex: ExerciseItem): ExerciseSetDetail[] => {
    if (ex.setDetails && ex.setDetails.length > 0) {
      return ex.setDetails;
    }
    const count = Math.max(1, ex.sets || 3);
    return Array.from({ length: count }).map((_, i) => ({
      id: `s-${ex.id}-${i + 1}`,
      setNumber: i + 1,
      repZone: ex.repZone || '8-12',
      method: ex.method || 'Normal',
    }));
  };

  const handleToggleExerciseExpand = (exId: string) => {
    setExpandedExerciseIds((prev) => ({
      ...prev,
      [exId]: !prev[exId],
    }));
  };

  const handleExpandAllExercises = () => {
    if (!activeSplit) return;
    const allExpanded: Record<string, boolean> = {};
    activeSplit.exercises.forEach((ex) => {
      allExpanded[ex.id] = true;
    });
    setExpandedExerciseIds(allExpanded);
  };

  const handleCollapseAllExercises = () => {
    setExpandedExerciseIds({});
  };

  // Add individual set to exercise
  const handleAddSetToExercise = (exIndex: number) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit || !currentSplit.exercises[exIndex]) return prev;

      const targetEx = currentSplit.exercises[exIndex];
      const currentSets = getExerciseSetDetails(targetEx);
      const lastSet = currentSets[currentSets.length - 1];
      const newSetNumber = currentSets.length + 1;
      const newSet: ExerciseSetDetail = {
        id: `s-${targetEx.id}-${Date.now()}-${newSetNumber}`,
        setNumber: newSetNumber,
        repZone: lastSet?.repZone || targetEx.repZone || '8-12',
        suggestedWeightKg: lastSet?.suggestedWeightKg,
        method: lastSet?.method || targetEx.method || 'Normal',
      };

      const updatedSets = [...currentSets, newSet];
      const updatedExercises = currentSplit.exercises.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              sets: updatedSets.length,
              setDetails: updatedSets,
            }
          : ex
      );

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  };

  // Remove individual set from exercise
  const handleRemoveSetFromExercise = (exIndex: number, setIndex: number) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit || !currentSplit.exercises[exIndex]) return prev;

      const targetEx = currentSplit.exercises[exIndex];
      const currentSets = getExerciseSetDetails(targetEx);
      if (currentSets.length <= 1) return prev; // Keep at least 1 set

      const filtered = currentSets.filter((_, idx) => idx !== setIndex);
      const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));

      const updatedExercises = currentSplit.exercises.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              sets: renumbered.length,
              setDetails: renumbered,
            }
          : ex
      );

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  };

  // Update detail of an individual set (repZone, suggestedWeightKg, method, notes)
  const handleUpdateSetDetail = (
    exIndex: number,
    setIndex: number,
    field: keyof ExerciseSetDetail,
    value: any
  ) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit || !currentSplit.exercises[exIndex]) return prev;

      const targetEx = currentSplit.exercises[exIndex];
      const currentSets = getExerciseSetDetails(targetEx);
      const updatedSets = currentSets.map((s, idx) => {
        if (idx !== setIndex) return s;

        const updatedSet: ExerciseSetDetail = { ...s, [field]: value };
        if (field === 'method') {
          const newMethod = value as string;
          if (isMethodWithSubsets(newMethod)) {
            // Auto-create initial subsérie if none exists yet
            if (!updatedSet.subSets || updatedSet.subSets.length === 0) {
              updatedSet.subSets = [
                getDefaultSubSetData(newMethod, 1, updatedSet.repZone, updatedSet.suggestedWeightKg),
              ];
            }
          }
        }
        return updatedSet;
      });

      const updatedExercises = currentSplit.exercises.map((ex, i) => {
        if (i === exIndex) {
          const updatedEx = {
            ...ex,
            setDetails: updatedSets,
          };
          if (field === 'repZone' && setIndex === 0) {
            updatedEx.repZone = value;
          }
          if (field === 'method') {
            const firstSpecial = updatedSets.find((st) => st.method && st.method !== 'Normal');
            updatedEx.method = firstSpecial ? firstSpecial.method : 'Normal';
          }
          return updatedEx;
        }
        return ex;
      });

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  };

  // Add a subsérie to a specific set
  const handleAddSubSetToSet = (exIndex: number, setIndex: number) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit || !currentSplit.exercises[exIndex]) return prev;

      const targetEx = currentSplit.exercises[exIndex];
      const currentSets = getExerciseSetDetails(targetEx);
      const targetSet = currentSets[setIndex];
      if (!targetSet) return prev;

      const currentSubSets = targetSet.subSets || [];
      const nextSubNumber = currentSubSets.length + 1;
      const lastSub = currentSubSets[currentSubSets.length - 1];
      const baseWeight = lastSub?.suggestedWeightKg ?? targetSet.suggestedWeightKg;

      const newSubSet = getDefaultSubSetData(
        targetSet.method || 'Drop-Set Tradicional',
        nextSubNumber,
        targetSet.repZone,
        baseWeight
      );

      const updatedSets = currentSets.map((s, idx) =>
        idx === setIndex
          ? {
              ...s,
              subSets: [...currentSubSets, newSubSet],
            }
          : s
      );

      const updatedExercises = currentSplit.exercises.map((ex, i) =>
        i === exIndex ? { ...ex, setDetails: updatedSets } : ex
      );

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  };

  // Remove a subsérie from a specific set
  const handleRemoveSubSetFromSet = (
    exIndex: number,
    setIndex: number,
    subSetIndex: number
  ) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit || !currentSplit.exercises[exIndex]) return prev;

      const targetEx = currentSplit.exercises[exIndex];
      const currentSets = getExerciseSetDetails(targetEx);
      const targetSet = currentSets[setIndex];
      if (!targetSet || !targetSet.subSets) return prev;

      const filteredSubSets = targetSet.subSets.filter((_, i) => i !== subSetIndex);
      const renumberedSubSets = filteredSubSets.map((sub, i) => ({
        ...sub,
        subSetNumber: i + 1,
      }));

      const updatedSets = currentSets.map((s, idx) =>
        idx === setIndex
          ? {
              ...s,
              subSets: renumberedSubSets,
            }
          : s
      );

      const updatedExercises = currentSplit.exercises.map((ex, i) =>
        i === exIndex ? { ...ex, setDetails: updatedSets } : ex
      );

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  };

  // Update a field inside a subsérie
  const handleUpdateSubSetDetail = (
    exIndex: number,
    setIndex: number,
    subSetIndex: number,
    field: keyof ExerciseSubSetDetail,
    value: any
  ) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit || !currentSplit.exercises[exIndex]) return prev;

      const targetEx = currentSplit.exercises[exIndex];
      const currentSets = getExerciseSetDetails(targetEx);
      const targetSet = currentSets[setIndex];
      if (!targetSet || !targetSet.subSets) return prev;

      const updatedSubSets = targetSet.subSets.map((sub, i) =>
        i === subSetIndex ? { ...sub, [field]: value } : sub
      );

      const updatedSets = currentSets.map((s, idx) =>
        idx === setIndex
          ? {
              ...s,
              subSets: updatedSubSets,
            }
          : s
      );

      const updatedExercises = currentSplit.exercises.map((ex, i) =>
        i === exIndex ? { ...ex, setDetails: updatedSets } : ex
      );

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  };

  // Apply method to all sets of an exercise
  const handleApplyMethodToAllSets = (exIndex: number, method: string) => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit || !currentSplit.exercises[exIndex]) return prev;

      const targetEx = currentSplit.exercises[exIndex];
      const currentSets = getExerciseSetDetails(targetEx);
      const firstSetSubSets = currentSets[0]?.subSets;

      const updatedSets = currentSets.map((s, idx) => {
        const updated: ExerciseSetDetail = { ...s, method };
        if (isMethodWithSubsets(method)) {
          if (idx === 0 && firstSetSubSets && firstSetSubSets.length > 0) {
            updated.subSets = firstSetSubSets;
          } else if (firstSetSubSets && firstSetSubSets.length > 0) {
            // Clone template from set 1
            updated.subSets = firstSetSubSets.map((sub, subIdx) => ({
              ...sub,
              id: `subset-${s.id}-${Date.now()}-${subIdx + 1}`,
              suggestedWeightKg: sub.suggestedWeightKg ?? s.suggestedWeightKg,
            }));
          } else {
            updated.subSets = [
              getDefaultSubSetData(method, 1, s.repZone, s.suggestedWeightKg),
            ];
          }
        }
        return updated;
      });

      const updatedExercises = currentSplit.exercises.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              method,
              setDetails: updatedSets,
            }
          : ex
      );

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: updatedExercises } : s
      );

      return { ...prev, splits: updatedSplits };
    });
  };

  // COMBINATION HANDLERS
  const handleOpenCombineModal = () => {
    setSelectedExerciseIdsToCombine([]);
    setCombinationLabel('Bi-Set');
    setIsCombineModalOpen(true);
  };

  const handleToggleSelectExerciseForCombine = (exId: string) => {
    setSelectedExerciseIdsToCombine((prev) => {
      const isSelected = prev.includes(exId);
      const updated = isSelected ? prev.filter((id) => id !== exId) : [...prev, exId];
      if (updated.length === 2) setCombinationLabel('Bi-Set');
      else if (updated.length === 3) setCombinationLabel('Tri-Set');
      else if (updated.length > 3) setCombinationLabel('Super-Série');
      return updated;
    });
  };

  const handleConfirmCombineExercises = () => {
    if (!editingProgram || !activeSplit || selectedExerciseIdsToCombine.length < 2) return;

    const comboId = `combo-${Date.now()}`;
    const label =
      combinationLabel ||
      (selectedExerciseIdsToCombine.length === 2
        ? 'Bi-Set'
        : selectedExerciseIdsToCombine.length === 3
        ? 'Tri-Set'
        : 'Super-Série');

    const selectedExs: ExerciseItem[] = [];
    selectedExerciseIdsToCombine.forEach((id, idx) => {
      const found = activeSplit.exercises.find((e) => e.id === id);
      if (found) {
        selectedExs.push({
          ...found,
          combinationGroupId: comboId,
          combinationLabel: label,
          combinationOrder: idx + 1,
        });
      }
    });

    const firstIndex = activeSplit.exercises.findIndex((e) =>
      selectedExerciseIdsToCombine.includes(e.id)
    );
    const remaining = activeSplit.exercises.filter(
      (e) => !selectedExerciseIdsToCombine.includes(e.id)
    );

    const insertAt = Math.max(0, firstIndex);
    const newExercises = [
      ...remaining.slice(0, insertAt),
      ...selectedExs,
      ...remaining.slice(insertAt),
    ];

    const updatedSplits = editingProgram.splits.map((s) =>
      s.id === activeSplit.id ? { ...s, exercises: newExercises } : s
    );

    setEditingProgram({
      ...editingProgram,
      splits: updatedSplits,
    });

    setIsCombineModalOpen(false);
    setSelectedExerciseIdsToCombine([]);
  };

  const handleUncombineGroup = (groupId: string) => {
    if (!editingProgram || !activeSplit) return;

    const updatedExercises = activeSplit.exercises.map((ex) =>
      ex.combinationGroupId === groupId
        ? {
            ...ex,
            combinationGroupId: undefined,
            combinationLabel: undefined,
            combinationOrder: undefined,
          }
        : ex
    );

    const updatedSplits = editingProgram.splits.map((s) =>
      s.id === activeSplit.id ? { ...s, exercises: updatedExercises } : s
    );

    setEditingProgram({
      ...editingProgram,
      splits: updatedSplits,
    });
  };

  const handleQuickCombineWithNext = (exIndex: number) => {
    if (!editingProgram || !activeSplit) return;
    if (exIndex >= activeSplit.exercises.length - 1) return;

    const comboId = `combo-${Date.now()}`;
    const updatedExercises = activeSplit.exercises.map((ex, idx) => {
      if (idx === exIndex) {
        return {
          ...ex,
          combinationGroupId: comboId,
          combinationLabel: 'Bi-Set',
          combinationOrder: 1,
        };
      }
      if (idx === exIndex + 1) {
        return {
          ...ex,
          combinationGroupId: comboId,
          combinationLabel: 'Bi-Set',
          combinationOrder: 2,
        };
      }
      return ex;
    });

    const updatedSplits = editingProgram.splits.map((s) =>
      s.id === activeSplit.id ? { ...s, exercises: updatedExercises } : s
    );

    setEditingProgram({
      ...editingProgram,
      splits: updatedSplits,
    });
  };

  const handleAddQuickBlankExercise = () => {
    setEditingProgram((prev) => {
      if (!prev) return null;
      const currentSplit =
        prev.splits.find((s) => s.id === selectedSplitId) || prev.splits[0];
      if (!currentSplit) return prev;

      const newExId = `ex-custom-${Date.now()}-${currentSplit.exercises.length + 1}`;
      const newExItem: ExerciseItem = {
        id: newExId,
        name: `Novo Exercício ${currentSplit.exercises.length + 1}`,
        muscleGroup: 'Peitoral',
        sets: 3,
        repZone: '10-12',
        restSeconds: 60,
        method: 'Normal',
        observations: '',
        extraBlocks: [],
        setDetails: [
          { id: `s-${newExId}-1`, setNumber: 1, repZone: '10-12', method: 'Normal' },
          { id: `s-${newExId}-2`, setNumber: 2, repZone: '10-12', method: 'Normal' },
          { id: `s-${newExId}-3`, setNumber: 3, repZone: '10-12', method: 'Normal' },
        ],
      };

      setExpandedExerciseIds((exp) => ({ ...exp, [newExId]: true }));

      const updatedSplits = prev.splits.map((s) =>
        s.id === currentSplit.id ? { ...s, exercises: [...s.exercises, newExItem] } : s
      );
      return { ...prev, splits: updatedSplits };
    });
  };

  // SAVE WHOLE PROGRAM
  const handleSaveAll = () => {
    if (!editingProgram) return;

    // Collect all unique weekDays across all splits
    const allDays = Array.from(
      new Set(editingProgram.splits.flatMap((s) => s.weekDays))
    ).sort();

    const programToSave: WorkoutProgram = {
      ...editingProgram,
      weekDays: allDays,
      exercises: editingProgram.splits[0]?.exercises || [],
    };

    onSaveWorkout(programToSave);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  // START EXECUTION FOR CURRENT SPLIT
  const handleExecuteCurrentSplit = () => {
    if (!editingProgram || !activeSplit) return;

    const executionProgram: WorkoutProgram = {
      id: `${editingProgram.id}-${activeSplit.id}`,
      clientId: editingProgram.clientId,
      name: `${editingProgram.name} • ${activeSplit.name}`,
      goal: editingProgram.goal,
      startDate: editingProgram.startDate,
      endDate: editingProgram.endDate,
      splits: [activeSplit],
      weekDays: activeSplit.weekDays,
      exercises: activeSplit.exercises,
      createdAt: editingProgram.createdAt,
    };

    handleSaveAll();
    onStartExecution(executionProgram);
  };

  // Calculate volume distribution for current split
  const volumeByMuscle = (activeSplit?.exercises || []).reduce(
    (acc, ex) => {
      const setsNum = Number(ex.sets) || 0;
      const group = ex.muscleGroup || 'Peitoral';
      acc[group] = (acc[group] || 0) + setsNum;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalSplitSets = Object.values(volumeByMuscle).reduce((a, b) => a + b, 0);

  // Render individual exercise card with collapsed view and expanded per-set editor
  const renderExerciseCard = (
    ex: ExerciseItem,
    exIndex: number,
    comboInfo?: {
      isCombined: boolean;
      comboLabel: string;
      comboOrder: number;
      comboTotal: number;
      comboGroupId: string;
    }
  ) => {
    const isExpanded = !!expandedExerciseIds[ex.id];
    const setDetails = getExerciseSetDetails(ex);

    // Collect distinct non-normal methods across sets
    const specialMethods = Array.from(
      new Set(
        setDetails
          .map((s) => s.method)
          .filter((m): m is string => !!m && m !== 'Normal')
      )
    );
    const displayMethod =
      specialMethods.length > 0
        ? specialMethods.join(' • ')
        : ex.method && ex.method !== 'Normal'
        ? ex.method
        : 'Normal';

    return (
      <div
        key={ex.id}
        className={`rounded-2xl border transition-all duration-200 shadow-md ${
          isExpanded
            ? 'bg-slate-950 border-cyan-500/60 ring-1 ring-cyan-500/30'
            : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
        }`}
      >
        {/* RECOLHIDO: BARRA DE RESUMO COMPACTA (CARD RECOLHIDO) */}
        {!isExpanded ? (
          <div
            onClick={() => handleToggleExerciseExpand(ex.id)}
            className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-900/40 rounded-2xl transition"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="w-7 h-7 rounded-xl bg-slate-900 text-slate-300 font-black text-xs flex items-center justify-center border border-slate-800 flex-shrink-0">
                {comboInfo ? `${exIndex + 1}.${comboInfo.comboOrder}` : exIndex + 1}
              </span>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-white truncate">
                    {ex.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-emerald-400 font-bold text-[10px] border border-slate-700/60">
                    {ex.muscleGroup}
                  </span>
                  {comboInfo && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-extrabold text-[10px] border border-purple-500/30 flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      <span>
                        {comboInfo.comboLabel} ({comboInfo.comboOrder}/{comboInfo.comboTotal})
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                  <span className="font-mono font-bold text-slate-300">
                    {setDetails.length} série{setDetails.length > 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    Zona: {ex.repZone || '8-12'} reps
                  </span>
                  <span>•</span>
                  {specialMethods.length > 0 || (ex.method && ex.method !== 'Normal') ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold text-[11px] truncate max-w-[240px]">
                      {displayMethod}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 font-semibold text-[10px]">
                      Método Normal
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExerciseExpand(ex.id);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1 transition active:scale-95"
              >
                <span>Expandir</span>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeExercise(exIndex);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Remover exercício deste treino"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* EXPANDIDO: VISUALIZAÇÃO DETALHADA E EDIÇÃO COMPLETA */
          <div className="p-3.5 sm:p-4 space-y-3.5">
            {/* Row 1: Exercise Name, Muscle, Remove & Collapse Button */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                  {comboInfo ? `${exIndex + 1}.${comboInfo.comboOrder}` : exIndex + 1}
                </span>
                <input
                  type="text"
                  value={ex.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const matched = exerciseDatabase.find(
                      (d) => d.name.toLowerCase() === newName.trim().toLowerCase()
                    );
                    if (matched) {
                      updateExercise(exIndex, {
                        name: newName,
                        muscleGroup: matched.muscleGroup,
                      });
                    } else {
                      updateExercise(exIndex, 'name', newName);
                    }
                  }}
                  placeholder="Nome do Exercício"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-500/30 whitespace-nowrap">
                  {ex.muscleGroup}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleExerciseExpand(ex.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1 transition"
                  title="Recolher detalhes deste exercício"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recolher</span>
                </button>

                <button
                  type="button"
                  onClick={() => removeExercise(exIndex)}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Remover exercício"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Row 2: Muscle Group selection & Database Catalog Picker */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Músculo:
              </label>
              <select
                value={ex.muscleGroup}
                onChange={(e) => {
                  const mg = e.target.value as MuscleGroup;
                  const firstDbForMuscle = exerciseDatabase.find((item) => item.muscleGroup === mg);
                  updateExercise(exIndex, {
                    muscleGroup: mg,
                    name: firstDbForMuscle ? firstDbForMuscle.name : ex.name,
                  });
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 focus:outline-none focus:border-cyan-500"
              >
                {MUSCLE_GROUPS.map((mg) => (
                  <option key={mg} value={mg}>
                    {mg}
                  </option>
                ))}
              </select>

              <select
                onChange={(e) => {
                  const selectedName = e.target.value;
                  if (selectedName) {
                    const found = exerciseDatabase.find((d) => d.name === selectedName);
                    if (found) {
                      updateExercise(exIndex, {
                        name: found.name,
                        muscleGroup: found.muscleGroup,
                      });
                    } else {
                      updateExercise(exIndex, 'name', selectedName);
                    }
                  }
                }}
                value=""
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 max-w-[210px] truncate"
              >
                <option value="">
                  Catálogo ({exerciseDatabase.filter((d) => d.muscleGroup === ex.muscleGroup).length} opções)...
                </option>
                {exerciseDatabase
                  .filter((d) => d.muscleGroup === ex.muscleGroup)
                  .map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} {item.isCustom ? '★' : ''}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={() => openExerciseDbModal(exIndex, ex.muscleGroup)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Trocar pelo Banco</span>
              </button>

              {/* Ações de Combinação Rápida */}
              {comboInfo ? (
                <button
                  type="button"
                  onClick={() => handleUncombineGroup(comboInfo.comboGroupId)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 text-xs font-bold transition ml-auto"
                >
                  <Unlink className="w-3 h-3" />
                  <span>Descombinar deste grupo</span>
                </button>
              ) : exIndex < (activeSplit?.exercises.length || 0) - 1 ? (
                <button
                  type="button"
                  onClick={() => handleQuickCombineWithNext(exIndex)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition ml-auto"
                  title="Combinar este exercício com o próximo em sequência (Bi-Set)"
                >
                  <Link2 className="w-3 h-3 text-purple-400" />
                  <span>Combinar com o próximo (Bi-Set)</span>
                </button>
              ) : null}
            </div>

            {/* SEÇÃO DE SÉRIES INDIVIDUAIS: EDITAR E ADICIONAR UMA DE CADA VEZ COM MÉTODO POR SÉRIE */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Séries do Exercício ({setDetails.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    • Edite repetições, carga sugerida e método avançado por série
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddSetToExercise(exIndex)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Série</span>
                  </button>
                </div>
              </div>

              {/* Tabela / Lista de Séries */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span className="col-span-2 text-center">Série</span>
                  <span className="col-span-3 text-center">Zona de Reps</span>
                  <span className="col-span-2 text-center">Carga (kg)</span>
                  <span className="col-span-4 text-center">Método Avançado da Série</span>
                  <span className="col-span-1 text-center">Excluir</span>
                </div>

                {setDetails.map((set, sIdx) => {
                  const hasSubsets = isMethodWithSubsets(set.method);

                  return (
                    <div
                      key={set.id || sIdx}
                      className={`p-2.5 rounded-xl bg-slate-950 border transition-all ${
                        hasSubsets
                          ? 'border-purple-500/50 ring-1 ring-purple-500/30 space-y-2'
                          : 'border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      {/* Linha Principal da Série */}
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        {/* Col 1: Set Number */}
                        <div className="col-span-2 flex items-center justify-center">
                          <span
                            className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center border ${
                              hasSubsets
                                ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                                : 'bg-slate-800 text-white border-slate-700'
                            }`}
                          >
                            #{sIdx + 1}
                          </span>
                        </div>

                        {/* Col 2: Zona de Repetições */}
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={set.repZone}
                            onChange={(e) =>
                              handleUpdateSetDetail(exIndex, sIdx, 'repZone', e.target.value)
                            }
                            placeholder="8-12"
                            className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Col 3: Carga Sugerida (kg) */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={set.suggestedWeightKg ?? ''}
                            onChange={(e) =>
                              handleUpdateSetDetail(
                                exIndex,
                                sIdx,
                                'suggestedWeightKg',
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                            placeholder="kg"
                            className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Col 4: Método Avançado da Série (Dropdown com todos os métodos) */}
                        <div className="col-span-4">
                          <select
                            value={set.method || 'Normal'}
                            onChange={(e) =>
                              handleUpdateSetDetail(exIndex, sIdx, 'method', e.target.value)
                            }
                            className={`w-full py-1.5 px-2 rounded-lg bg-slate-900 border text-xs font-bold transition focus:outline-none ${
                              hasSubsets
                                ? 'border-purple-500/80 text-purple-200 ring-1 ring-purple-500/40 bg-purple-950/40 font-extrabold'
                                : set.method && set.method !== 'Normal'
                                ? 'border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40'
                                : 'border-slate-700 text-slate-300'
                            }`}
                          >
                            {WORKOUT_METHODS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Col 5: Excluir Série Principal */}
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            disabled={setDetails.length <= 1}
                            onClick={() => handleRemoveSetFromExercise(exIndex, sIdx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            title={
                              setDetails.length <= 1
                                ? 'O exercício deve ter pelo menos 1 série'
                                : 'Excluir esta série'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* SUBSÉRIES ABAIXO DA SÉRIE PRINCIPAL (3/7, CLUSTER-SET, DROP-SET TRADICIONAL/ADAPTADO, FST-7, PARCIAL) */}
                      {hasSubsets && (
                        <div className="mt-2 pt-2 border-t border-purple-500/20 pl-2 sm:pl-4 space-y-2 bg-purple-950/15 p-2 rounded-lg">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                              <span className="text-[11px] font-bold text-purple-300">
                                Subséries do {set.method} (Série #{sIdx + 1}):
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddSubSetToSet(exIndex, sIdx)}
                              className="px-2.5 py-1 rounded-lg bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/40 text-purple-200 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar Subsérie</span>
                            </button>
                          </div>

                          {/* Lista de Subséries */}
                          <div className="space-y-1.5">
                            {(set.subSets || []).map((sub, subIdx) => (
                              <div
                                key={sub.id || subIdx}
                                className="p-2 rounded-lg bg-slate-900/90 border border-purple-500/30 grid grid-cols-12 gap-1.5 items-center text-xs"
                              >
                                {/* Subsérie Badge */}
                                <div className="col-span-3 sm:col-span-2 flex items-center gap-1">
                                  <span className="text-purple-400 font-bold font-mono">↳</span>
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 font-extrabold text-[10px] border border-purple-500/40 whitespace-nowrap">
                                    Sub #{sub.subSetNumber || subIdx + 1}
                                  </span>
                                </div>

                                {/* Reps */}
                                <div className="col-span-3 sm:col-span-3">
                                  <input
                                    type="text"
                                    value={sub.repZone}
                                    onChange={(e) =>
                                      handleUpdateSubSetDetail(
                                        exIndex,
                                        sIdx,
                                        subIdx,
                                        'repZone',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Reps"
                                    className="w-full py-1 px-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-purple-400"
                                  />
                                </div>

                                {/* Carga Sugerida (kg) */}
                                <div className="col-span-3 sm:col-span-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={sub.suggestedWeightKg ?? ''}
                                    onChange={(e) =>
                                      handleUpdateSubSetDetail(
                                        exIndex,
                                        sIdx,
                                        subIdx,
                                        'suggestedWeightKg',
                                        e.target.value ? parseFloat(e.target.value) : undefined
                                      )
                                    }
                                    placeholder="kg"
                                    className="w-full py-1 px-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-purple-400"
                                  />
                                </div>

                                {/* Observação / Instrução */}
                                <div className="col-span-10 sm:col-span-4 mt-1 sm:mt-0">
                                  <input
                                    type="text"
                                    value={sub.note || ''}
                                    onChange={(e) =>
                                      handleUpdateSubSetDetail(
                                        exIndex,
                                        sIdx,
                                        subIdx,
                                        'note',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Ex: -20% carga / 15s descanso"
                                    className="w-full py-1 px-2 rounded bg-slate-950 border border-slate-700 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-400"
                                  />
                                </div>

                                {/* Excluir subsérie */}
                                <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveSubSetFromSet(exIndex, sIdx, subIdx)
                                    }
                                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                    title="Excluir subsérie"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Ações Rápidas de Série */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-[11px] text-slate-400 font-semibold">
                    Replicar método da Série 1 para todas:
                  </label>
                  <button
                    type="button"
                    onClick={() => handleApplyMethodToAllSets(exIndex, setDetails[0]?.method || 'Normal')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 font-bold border border-slate-700 active:scale-95 transition"
                  >
                    Copiar &ldquo;{setDetails[0]?.method || 'Normal'}&rdquo; para todas
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddSetToExercise(exIndex)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 active:scale-95 self-end sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Outra Série</span>
                </button>
              </div>
            </div>

            {/* Descanso e Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  Descanso entre séries
                </label>
                <select
                  value={ex.restSeconds}
                  onChange={(e) =>
                    updateExercise(exIndex, 'restSeconds', parseInt(e.target.value))
                  }
                  className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-500"
                >
                  <option value={30}>30s</option>
                  <option value={45}>45s</option>
                  <option value={60}>60s</option>
                  <option value={75}>75s</option>
                  <option value={90}>90s</option>
                  <option value={120}>120s</option>
                  <option value={180}>180s</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  Observações biomecânicas / execução
                </label>
                <input
                  type="text"
                  value={ex.observations}
                  onChange={(e) =>
                    updateExercise(exIndex, 'observations', e.target.value)
                  }
                  placeholder="Ex: cadência controlada 3010, foco no pico de contração, pegada neutra"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-1 border-t border-slate-900">
              <button
                type="button"
                onClick={() => handleToggleExerciseExpand(ex.id)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 active:scale-95"
              >
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Concluir e Recolher</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-24">
      {/* 1. SELEÇÃO DE ALUNO DESTACADA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-400" />
              <span>1. Aluno Selecionado</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 hover:border-emerald-500/50 focus:border-emerald-500 text-sm font-bold text-white shadow-inner focus:outline-none transition touch-manipulation"
            >
              {clients.map((c) => {
                const count = workouts.filter((w) => w.clientId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} — Plano {c.contractType} ({count} programa{count === 1 ? '' : 's'})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedClient && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md ${
                  selectedClient.gender === 'Feminino'
                    ? 'bg-gradient-to-tr from-pink-600 to-rose-500'
                    : 'bg-gradient-to-tr from-blue-600 to-cyan-500'
                }`}
              >
                {selectedClient.name.charAt(0)}
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">
                  {selectedClient.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedClient.weight}kg • {selectedClient.height}cm • {clientPrograms.length} programa(s)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. PROGRAMAS DE TREINO VINCULADOS AO ALUNO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Programas de Treino de {selectedClient?.name}
              </h2>
              <p className="text-xs text-slate-400">
                Selecione um programa existente ou crie novos programas para este aluno.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCreatingNewProgram(!isCreatingNewProgram);
              setNewProgName(`Periodização de ${selectedClient?.name || 'Treino'}`);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Programa</span>
          </button>
        </div>

        {/* Modal/Form to Create New Program */}
        {isCreatingNewProgram && (
          <form
            onSubmit={handleConfirmCreateProgram}
            className="p-4 rounded-xl bg-slate-950 border border-emerald-500/50 shadow-inner space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Criar Novo Programa de Treino
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNewProgram(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nome do Programa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mesociclo 2 - Força e Hipertrofia"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Objetivo Geral
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hipertrofia Máxima, Densidade, Força"
                  value={newProgGoal}
                  onChange={(e) => setNewProgGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={newProgStartDate}
                  onChange={(e) => setNewProgStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Data de Término
                </label>
                <input
                  type="date"
                  value={newProgEndDate}
                  onChange={(e) => setNewProgEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingNewProgram(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
              >
                Salvar e Começar Prescrição
              </button>
            </div>
          </form>
        )}

        {/* Existing Programs Pills / Cards with Actions */}
        {clientPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientPrograms.map((prog) => {
              const isSelected = prog.id === selectedProgramId;
              const isExpanded = prog.id === expandedProgramId;
              const splitsCount = prog.splits?.length || 1;
              const totalExercises = (prog.splits || []).reduce(
                (acc, s) => acc + (s.exercises?.length || 0),
                0
              );

              return (
                <div
                  key={prog.id}
                  onClick={() => handleSelectProgram(prog.id)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 shadow-md ${
                    isExpanded
                      ? 'bg-slate-900 border-cyan-500 shadow-cyan-950/40 ring-2 ring-cyan-500/50'
                      : isSelected
                      ? 'bg-slate-950/90 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-white block truncate">
                          {prog.name}
                        </span>
                        {isExpanded && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-semibold block truncate">
                        {prog.goal}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditProgramModal(prog, e)}
                        className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Editar nome, objetivo e datas deste programa"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProgramToDelete(prog);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Excluir este programa de treino"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                    <span>
                      {splitsCount} treino{splitsCount === 1 ? '' : 's'} • {totalExercises} ex.
                    </span>
                    <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                      <span>{isExpanded ? 'Recolher' : 'Expandir Treino'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !isCreatingNewProgram && (
            <div className="p-6 text-center rounded-xl bg-slate-950/50 border border-dashed border-slate-800">
              <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Este aluno ainda não possui programas de treino cadastrados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewProgram(true);
                  setNewProgName(`Periodização de ${selectedClient?.name || 'Treino'}`);
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeiro Programa</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* 3 & 4. TREINOS E EXERCÍCIOS DO PROGRAMA SELECIONADO (COM EFEITO DE EXPANSÃO) */}
      <AnimatePresence mode="wait">
        {expandedProgramId && editingProgram && editingProgram.id === expandedProgramId && activeSplit && (
          <motion.div
            key={editingProgram.id}
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-4 overflow-hidden"
          >
            {/* Header com indicador de expansão do programa ativo */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Treino Expandido: {editingProgram.name}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • {editingProgram.goal}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleOpenEditProgramModal(editingProgram, e)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 active:scale-95 transition bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                  title="Editar informações gerais deste programa"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Informações</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedProgramId(null)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 active:scale-95 transition bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                  title="Recolher visualização do treino"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Recolher</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 shadow-xl space-y-4">
            {/* Header: Splits Management */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    3. Treinos Vinculados aos Dias da Semana ({editingProgram.splits.length})
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Defina os treinos da semana. Um treino pode ser realizado em múltiplos dias ou em um dia específico.
                </p>
              </div>

              {/* Quick Actions Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddSplit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs active:scale-95 shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Treino</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateDailyWorkouts}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs active:scale-95 transition"
                  title="Cria 5 treinos independentes de Segunda a Sexta"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1 Treino por Dia (Seg-Sex)</span>
                </button>
              </div>
            </div>

            {/* Split Selector Tabs (Treino A, Treino B, Treino C...) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {editingProgram.splits.map((split, sIndex) => {
                const isCurrent = split.id === activeSplit.id;
                const daysLabels = (split.weekDays || [])
                  .map((d) => WEEKDAYS.find((w) => w.id === d)?.short)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div
                    key={split.id}
                    onClick={() => setSelectedSplitId(split.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs cursor-pointer font-bold transition-all active:scale-95 whitespace-nowrap ${
                      isCurrent
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md ring-1 ring-cyan-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{split.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        isCurrent
                          ? 'bg-cyan-900/60 text-cyan-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {daysLabels || 'Sem dias'}
                    </span>
                    {editingProgram.splits.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSplit(split.id);
                        }}
                        className="p-0.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                        title="Excluir este treino"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Split Configuration Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Nome da Divisão / Treino
                  </label>
                  <input
                    type="text"
                    value={activeSplit.name}
                    onChange={(e) => handleUpdateSplitName(e.target.value)}
                    placeholder="Ex: Treino A - Peitoral e Tríceps"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Dias da Semana para este Treino (Múltiplos ou Único) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dias da Semana (Pode marcar mais de um dia)</span>
                    </label>
                    <span className="text-[10px] text-cyan-400 font-semibold">
                      {activeSplit.weekDays.length} dia(s) selecionado(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((day) => {
                      const isSelected = activeSplit.weekDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => handleToggleSplitWeekDay(day.id)}
                          className={`py-2 rounded-xl text-xs font-extrabold transition-all active:scale-90 ${
                            isSelected
                              ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-slate-950 shadow-md ring-2 ring-emerald-400'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                          }`}
                          title={`Realizar treino na ${day.label}`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* EXERCISE BUILDER FOR THIS SPLIT */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Exercícios de {activeSplit.name} ({activeSplit.exercises.length})
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Botões de Expandir/Recolher Todos */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={handleExpandAllExercises}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                      title="Expandir todos os exercícios para ver e editar detalhes"
                    >
                      Expandir Todos
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={handleCollapseAllExercises}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                      title="Recolher todos os exercícios para visão limpa e compacta"
                    >
                      Recolher Todos
                    </button>
                  </div>

                  {/* Botão de Combinação de Exercícios (Bi-Set / Tri-Set) */}
                  <button
                    type="button"
                    onClick={handleOpenCombineModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold shadow-sm active:scale-95 transition"
                    title="Combinar 2 ou mais exercícios para serem realizados em sequência sem descanso"
                  >
                    <Link2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Combinar Exercícios (Bi-Set / Tri-Set)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVolumeDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Volume por Músculo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openExerciseDbModal(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    title="Acessar catálogo completo de exercícios e cadastrar novos"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>Banco de Exercícios ({exerciseDatabase.length})</span>
                  </button>
                </div>
              </div>

              {/* LIVE SÉRIES POR GRUPAMENTO MUSCULAR SUMMARY */}
              <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Séries por Grupamento Muscular ({activeSplit.name}):</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    Total: {totalSplitSets} séries
                  </span>
                </div>

                {Object.keys(volumeByMuscle).length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    Nenhum exercício adicionado a este treino.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(volumeByMuscle).map(([muscle, count]) => (
                      <div
                        key={muscle}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs shadow-sm hover:border-cyan-500/50 transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-slate-300 font-semibold">{muscle}:</span>
                        <span className="font-mono font-black text-emerald-400">{count} séries</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grouped Exercise Cards (Single or Combined in Sequence) */}
              <div className="space-y-3">
                {(() => {
                  type ExerciseGroup =
                    | { type: 'single'; exercise: ExerciseItem; originalIndex: number }
                    | {
                        type: 'combined';
                        groupId: string;
                        label: string;
                        items: { exercise: ExerciseItem; originalIndex: number }[];
                      };

                  const groups: ExerciseGroup[] = [];
                  let currentCombo: {
                    groupId: string;
                    label: string;
                    items: { exercise: ExerciseItem; originalIndex: number }[];
                  } | null = null;

                  activeSplit.exercises.forEach((ex, idx) => {
                    if (ex.combinationGroupId) {
                      if (currentCombo && currentCombo.groupId === ex.combinationGroupId) {
                        currentCombo.items.push({ exercise: ex, originalIndex: idx });
                      } else {
                        if (currentCombo) {
                          groups.push({
                            type: 'combined',
                            groupId: currentCombo.groupId,
                            label: currentCombo.label,
                            items: currentCombo.items,
                          });
                        }
                        currentCombo = {
                          groupId: ex.combinationGroupId,
                          label: ex.combinationLabel || 'Bi-Set',
                          items: [{ exercise: ex, originalIndex: idx }],
                        };
                      }
                    } else {
                      if (currentCombo) {
                        groups.push({
                          type: 'combined',
                          groupId: currentCombo.groupId,
                          label: currentCombo.label,
                          items: currentCombo.items,
                        });
                        currentCombo = null;
                      }
                      groups.push({ type: 'single', exercise: ex, originalIndex: idx });
                    }
                  });

                  if (currentCombo) {
                    const finishedCombo: {
                      groupId: string;
                      label: string;
                      items: { exercise: ExerciseItem; originalIndex: number }[];
                    } = currentCombo;
                    groups.push({
                      type: 'combined',
                      groupId: finishedCombo.groupId,
                      label: finishedCombo.label,
                      items: finishedCombo.items,
                    });
                  }

                  if (groups.length === 0) {
                    return (
                      <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
                        <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">
                          Nenhum exercício adicionado a este treino ainda.
                        </p>
                        <button
                          type="button"
                          onClick={() => openExerciseDbModal(null)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95 transition inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Primeiro Exercício</span>
                        </button>
                      </div>
                    );
                  }

                  return groups.map((group) => {
                    if (group.type === 'single') {
                      return renderExerciseCard(group.exercise, group.originalIndex);
                    }

                    // Combined Exercise Group
                    return (
                      <div
                        key={group.groupId}
                        className="p-3.5 sm:p-4 rounded-2xl bg-purple-950/20 border-2 border-purple-500/40 shadow-lg space-y-3"
                      >
                        {/* Header da Combinação */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-purple-500/30 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                              <Link2 className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-purple-200 uppercase tracking-wider">
                                  {group.label} • Exercício Combinado em Sequência ({group.items.length})
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                                  Sem pausa entre eles
                                </span>
                              </div>
                              <p className="text-[11px] text-purple-300/80">
                                Estes exercícios devem ser realizados em sequência contínua, formando um só bloco de estímulo.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleUncombineGroup(group.groupId)}
                            className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 bg-purple-900/40 hover:bg-purple-900/60 px-2.5 py-1 rounded-lg border border-purple-500/30 active:scale-95 transition self-end sm:self-auto"
                            title="Desfazer combinação e separar em exercícios independentes"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span>Descombinar Exercícios</span>
                          </button>
                        </div>

                        {/* Exercícios da Combinação em Sequência */}
                        <div className="space-y-2.5">
                          {group.items.map((item, itemIdx) => (
                            <React.Fragment key={item.exercise.id}>
                              {itemIdx > 0 && (
                                <div className="flex items-center justify-center gap-2 py-1 text-purple-400">
                                  <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-purple-900/50 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                                    Seguido imediatamente sem descanso por:
                                  </span>
                                  <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                                </div>
                              )}
                              {renderExerciseCard(item.exercise, item.originalIndex, {
                                isCombined: true,
                                comboLabel: group.label,
                                comboOrder: itemIdx + 1,
                                comboTotal: group.items.length,
                                comboGroupId: group.groupId,
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* BOTÃO DE ADICIONAR EXERCÍCIO NA PARTE INFERIOR (SEMPRE ABAIXO DO ÚLTIMO EXERCÍCIO) */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openExerciseDbModal(null)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Exercício (Abaixo do Último)</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddQuickBlankExercise}
                  className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
                  title="Adiciona um novo exercício em branco para você preencher rapidamente"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Exercício Rápido em Branco</span>
                </button>
              </div>
            </div>

            {/* SAVE & EXECUTE BOTTOM BAR */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {savedSuccessMsg ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Programa de Treino salvo com sucesso!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  {editingProgram.splits.length} treino(s) configurados para a semana.
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 shadow active:scale-95 transition"
                >
                  <Save className="w-4 h-4 text-cyan-400" />
                  <span>Salvar Programa Completo</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteCurrentSplit}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Iniciar Treino na Sala Agora</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* VOLUME DISTRIBUTION DRAWER */}
      {isVolumeDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Volume de Séries por Grupo Muscular
                </h3>
              </div>
              <button
                onClick={() => setIsVolumeDrawerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {Object.keys(volumeByMuscle).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Nenhum exercício adicionado a este treino.
                </p>
              ) : (
                Object.entries(volumeByMuscle).map(([muscle, setsCount]) => (
                  <div key={muscle} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200">{muscle}</span>
                      <span className="text-emerald-400 font-mono">{setsCount} séries</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                        style={{ width: `${Math.min(100, (setsCount / 20) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsVolumeDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* EXERCISE DATABASE MODAL */}
      {isExerciseDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Banco de Dados de Exercícios</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
                      {exerciseDatabase.length} cadastrados
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {targetExerciseIndexForDb !== null
                      ? 'Selecione um exercício do banco para substituir no treino'
                      : 'Escolha do banco ou cadastre um novo exercício'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExerciseDbModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveDbTab('catalog')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition ${
                  activeDbTab === 'catalog'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Escolher do Banco ({filteredDbExercises.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDbTab('create_new')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition ${
                  activeDbTab === 'create_new'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Exercício</span>
              </button>
            </div>

            {/* Modal Body */}
            {activeDbTab === 'catalog' ? (
              <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-hidden">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={dbSearchQuery}
                    onChange={(e) => setDbSearchQuery(e.target.value)}
                    placeholder="Buscar exercício pelo nome (ex: Supino, Barra, Agachamento, Tríceps...)"
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                  {dbSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDbSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Muscle Group Horizontal Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setDbSelectedMuscleFilter('Todos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition active:scale-95 ${
                      dbSelectedMuscleFilter === 'Todos'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    Todos ({exerciseDatabase.length})
                  </button>

                  {MUSCLE_GROUPS.map((mg) => {
                    const count = exerciseDatabase.filter((e) => e.muscleGroup === mg).length;
                    const isSelected = dbSelectedMuscleFilter === mg;
                    return (
                      <button
                        key={mg}
                        type="button"
                        onClick={() => setDbSelectedMuscleFilter(mg)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition active:scale-95 ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400'
                            : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {mg} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Exercises List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[46vh]">
                  {filteredDbExercises.length === 0 ? (
                    <div className="text-center py-10 space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800">
                      <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-slate-300">
                        Nenhum exercício encontrado
                      </p>
                      <p className="text-xs text-slate-500">
                        Não encontramos exercícios com o termo &ldquo;{dbSearchQuery}&rdquo;.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewExName(dbSearchQuery);
                          setActiveDbTab('create_new');
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-500"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cadastrar &ldquo;{dbSearchQuery}&rdquo; no Banco</span>
                      </button>
                    </div>
                  ) : (
                    filteredDbExercises.map((dbEx) => (
                      <div
                        key={dbEx.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-950 transition group"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Dumbbell className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-300 transition">
                              {dbEx.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold text-emerald-400">
                                {dbEx.muscleGroup}
                              </span>
                              {dbEx.isCustom && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  Personalizado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Add to workout button */}
                          <button
                            type="button"
                            onClick={() => handleSelectExerciseFromDb(dbEx)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow active:scale-95 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{targetExerciseIndexForDb !== null ? 'Substituir' : 'Adicionar'}</span>
                          </button>

                          {/* Delete from DB button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExerciseToDeleteFromDb(dbEx);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Excluir este exercício do banco de dados"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* TAB 2: CREATE NEW EXERCISE */
              <form
                onSubmit={handleCreateAndAddExercise}
                className="flex-1 p-5 space-y-4 overflow-y-auto"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">
                    Cadastrar Novo Exercício no Banco
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ao cadastrar, o exercício ficará salvo permanentemente no banco de dados e será inserido no treino.
                  </p>
                </div>

                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1">
                      Nome do Exercício *
                    </label>
                    <input
                      type="text"
                      required
                      value={newExName}
                      onChange={(e) => setNewExName(e.target.value)}
                      placeholder="Ex: Supino Inclinado com Halteres - Pegada Neutra"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1">
                      Grupamento Muscular *
                    </label>
                    <select
                      value={newExMuscleGroup}
                      onChange={(e) => setNewExMuscleGroup(e.target.value as MuscleGroup)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    >
                      {MUSCLE_GROUPS.map((mg) => (
                        <option key={mg} value={mg}>
                          {mg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview Card */}
                {newExName.trim() && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                        Pré-visualização do Exercício:
                      </span>
                      <span className="text-xs font-black text-white">{newExName}</span>
                      <span className="text-[11px] text-emerald-400 block mt-0.5">
                        Músculo: {newExMuscleGroup}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveDbTab('catalog')}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition"
                  >
                    Voltar ao Catálogo
                  </button>

                  <button
                    type="submit"
                    disabled={!newExName.trim()}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Salvar no Banco & Adicionar</span>
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>{exerciseDatabase.length} exercícios disponíveis no catálogo</span>
              <button
                type="button"
                onClick={() => setIsExerciseDbModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE FROM DATABASE MODAL */}
      {exerciseToDeleteFromDb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Excluir do Banco de Dados?</h3>
              <p className="text-xs text-slate-300">
                Tem certeza que deseja remover o exercício{' '}
                <strong className="text-rose-400 font-bold">{exerciseToDeleteFromDb.name}</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                Grupamento: {exerciseToDeleteFromDb.muscleGroup}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExerciseToDeleteFromDb(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteFromDb}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROGRAM INFO MODAL */}
      {isEditProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Editar Informações do Programa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProgramModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgramInfo} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome do Programa de Treino *
                </label>
                <input
                  type="text"
                  required
                  value={editProgName}
                  onChange={(e) => setEditProgName(e.target.value)}
                  placeholder="Ex: Mesociclo 2 - Hipertrofia e Força"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Objetivo Geral
                </label>
                <input
                  type="text"
                  value={editProgGoal}
                  onChange={(e) => setEditProgGoal(e.target.value)}
                  placeholder="Ex: Hipertrofia Máxima, Densidade, Força"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={editProgStartDate}
                    onChange={(e) => setEditProgStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={editProgEndDate}
                    onChange={(e) => setEditProgEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProgramModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/50 active:scale-95 transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE WORKOUT PROGRAM MODAL */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Excluir Programa de Treino?</h3>
              <p className="text-xs text-slate-300">
                Tem certeza que deseja excluir o programa{' '}
                <strong className="text-rose-400 font-bold">{programToDelete.name}</strong> de{' '}
                <strong className="text-white">{selectedClient?.name || 'este aluno'}</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                Todos os treinos, divisões e exercícios vinculados a este programa serão permanentemente excluídos.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProgramToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteProgram}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COMBINAÇÃO DE EXERCÍCIOS (BI-SET / TRI-SET) */}
      {isCombineModalOpen && activeSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Link2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Combinar Exercícios em Sequência
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione 2 ou mais exercícios para criar um Bi-Set, Tri-Set ou Super-Série.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCombineModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tipo de Combinação */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Tipo da Combinação:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Bi-Set', 'Tri-Set', 'Super-Série'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCombinationLabel(type)}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                      combinationLabel === type
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist dos Exercícios */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                Selecione os Exercícios de {activeSplit.name}:
              </label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {activeSplit.exercises.map((ex, idx) => {
                  const isChecked = selectedExerciseIdsToCombine.includes(ex.id);
                  const isAlreadyCombined = !!ex.combinationGroupId;

                  return (
                    <div
                      key={ex.id}
                      onClick={() => handleToggleSelectExerciseForCombine(ex.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-slate-900 border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            #{idx + 1} {ex.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ex.muscleGroup} • {ex.sets} séries ({ex.repZone})
                          </span>
                        </div>
                      </div>

                      {isAlreadyCombined && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Já combinado ({ex.combinationLabel || 'Combo'})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {selectedExerciseIdsToCombine.length} exercício(s) selecionado(s)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCombineModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedExerciseIdsToCombine.length < 2}
                  onClick={handleConfirmCombineExercises}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Confirmar Combinação ({selectedExerciseIdsToCombine.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
