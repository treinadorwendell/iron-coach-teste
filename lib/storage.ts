import {
  Client,
  WorkoutProgram,
  WorkoutSplit,
  CalendarEvent,
  ExerciseHistoricalEntry,
  ActiveWorkoutSession,
  DatabaseExercise,
  MuscleGroup,
  CompletedWorkoutRecord,
} from '@/types';
import { INITIAL_EXERCISE_DATABASE } from './exerciseDatabase';

const STORAGE_KEYS = {
  CLIENTS: 'ironcoach_clients_v1',
  WORKOUTS: 'ironcoach_workouts_v2',
  CALENDAR: 'ironcoach_calendar_v1',
  HISTORY: 'ironcoach_history_v1',
  ACTIVE_SESSION: 'ironcoach_active_session_v2',
  COMPLETED_WORKOUTS: 'ironcoach_completed_workouts_v1',
  EXERCISE_DATABASE: 'ironcoach_exercise_db_v2',
};

// Initial Seed Clients
export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Carlos Silva',
    birthDate: '14/05/1996',
    gender: 'Masculino',
    weight: 82.5,
    height: 178,
    email: 'carlos.silva@email.com',
    contractType: 'Mensal',
    contractValue: 750,
    phone: '(11) 98765-4321',
    notes: 'Objetivo: Hipertrofia com foco em peitoral e tríceps. Sem lesões prévias.',
    createdAt: '2026-01-10',
  },
  {
    id: 'client-2',
    name: 'Mariana Oliveira',
    birthDate: '22/08/1992',
    gender: 'Feminino',
    weight: 61.0,
    height: 165,
    email: 'mariana.oli@email.com',
    contractType: 'Semanal',
    contractValue: 220,
    phone: '(11) 97654-3210',
    notes: 'Foco em membros inferiores e postura lombar. Treina às terças e quintas.',
    createdAt: '2026-02-01',
  },
  {
    id: 'client-3',
    name: 'Rodrigo Santos',
    birthDate: '03/11/1983',
    gender: 'Masculino',
    weight: 89.0,
    height: 182,
    email: 'rodrigo.santos@email.com',
    contractType: 'Mensal',
    contractValue: 800,
    phone: '(11) 99123-4567',
    notes: 'Condicionamento físico e perda de gordura. Atenção ao joelho esquerdo.',
    createdAt: '2026-02-15',
  },
  {
    id: 'client-4',
    name: 'Beatriz Mendes',
    birthDate: '19/02/1999',
    gender: 'Feminino',
    weight: 55.4,
    height: 160,
    email: 'bia.mendes@email.com',
    contractType: 'Avulsa',
    contractValue: 90,
    phone: '(11) 98321-7654',
    notes: 'Treinos aos sábados. Busca definição e mobilidade.',
    createdAt: '2026-03-01',
  },
];

// Seed workout splits
const SPLIT_CARLOS_A: WorkoutSplit = {
  id: 'split-1a',
  name: 'Treino A - Peitoral e Tríceps',
  weekDays: [1, 4], // Seg e Qui
  exercises: [
    {
      id: 'ex-1',
      name: 'Supino Reto com Barra',
      muscleGroup: 'Peitoral',
      sets: 4,
      repZone: '8-12',
      restSeconds: 90,
      method: 'Normal',
      observations: 'Pegada média, escápulas em retração contínua e cadência 3010.',
      extraBlocks: [],
    },
    {
      id: 'ex-2',
      name: 'Supino Inclinado com Halteres',
      muscleGroup: 'Peitoral',
      sets: 4,
      repZone: '10-12',
      restSeconds: 75,
      method: 'Pirâmide',
      observations: 'Banco a 30 graus. Subir a carga progressivamente nas 4 séries.',
      extraBlocks: [],
    },
    {
      id: 'ex-3',
      name: 'Crucifixo no Crossover Polia Média',
      muscleGroup: 'Peitoral',
      sets: 3,
      repZone: '12-15',
      restSeconds: 60,
      method: 'Drop-set',
      observations: 'Pico de contração de 1 segundo ao fechar.',
      extraBlocks: [
        {
          id: 'block-1',
          type: 'Drop-set',
          repsText: '8 reps + falha',
          note: 'Reduzir 30% da carga na última série imediatamente sem descanso.',
        },
      ],
    },
    {
      id: 'ex-4',
      name: 'Tríceps Testa com Barra W',
      muscleGroup: 'Tríceps',
      sets: 4,
      repZone: '10-12',
      restSeconds: 60,
      method: 'Normal',
      observations: 'Cotovelos alinhados e fechados durante toda a descida.',
      extraBlocks: [],
    },
    {
      id: 'ex-5',
      name: 'Tríceps Corda na Polia Alta',
      muscleGroup: 'Tríceps',
      sets: 3,
      repZone: '12-15',
      restSeconds: 60,
      method: 'Rest-Pause',
      observations: 'Abrir bem a corda no ponto de máxima extensão.',
      extraBlocks: [
        {
          id: 'block-2',
          type: 'Rest-Pause',
          repsText: '12 + 4 + 3 reps',
          note: 'Pausa de 15 segundos entre cada mini-bloco na 3ª série.',
        },
      ],
    },
  ],
};

const SPLIT_CARLOS_B: WorkoutSplit = {
  id: 'split-1b',
  name: 'Treino B - Dorsal e Bíceps',
  weekDays: [2, 5], // Ter e Sex
  exercises: [
    {
      id: 'ex-6',
      name: 'Puxada Frontal Aberta',
      muscleGroup: 'Dorsal',
      sets: 4,
      repZone: '8-12',
      restSeconds: 75,
      method: 'Normal',
      observations: 'Puxar até a altura da fúrcula com peito expandido.',
      extraBlocks: [],
    },
    {
      id: 'ex-7',
      name: 'Remada Curvada com Barra',
      muscleGroup: 'Dorsal',
      sets: 4,
      repZone: '8-10',
      restSeconds: 90,
      method: 'Normal',
      observations: 'Tronco em 45 graus, puxar em direção ao umbigo.',
      extraBlocks: [],
    },
    {
      id: 'ex-8',
      name: 'Rosca Direta com Barra W',
      muscleGroup: 'Bíceps',
      sets: 4,
      repZone: '10-12',
      restSeconds: 60,
      method: 'Bi-set',
      observations: 'Combinar com Rosca Martelo sem descanso entre elas.',
      extraBlocks: [],
    },
  ],
};

const SPLIT_MARIANA_A: WorkoutSplit = {
  id: 'split-2a',
  name: 'Treino A - Foco Quadríceps e Glúteo',
  weekDays: [2], // Terça
  exercises: [
    {
      id: 'ex-9',
      name: 'Agachamento Livre com Barra',
      muscleGroup: 'Quadríceps',
      sets: 4,
      repZone: '8-10',
      restSeconds: 90,
      method: 'Normal',
      observations: 'Base na largura dos ombros, profundidade paralela.',
      extraBlocks: [],
    },
    {
      id: 'ex-10',
      name: 'Elevação Pélvica com Barra',
      muscleGroup: 'Glúteo',
      sets: 4,
      repZone: '10-12',
      restSeconds: 75,
      method: 'Rest-Pause',
      observations: 'Pausar 2 segundos no topo em contração máxima.',
      extraBlocks: [],
    },
    {
      id: 'ex-11',
      name: 'Cadeira Flexora',
      muscleGroup: 'Ísquios',
      sets: 4,
      repZone: '12-15',
      restSeconds: 60,
      method: 'Normal',
      observations: 'Controle excêntrico de 3 segundos.',
      extraBlocks: [],
    },
  ],
};

const SPLIT_MARIANA_B: WorkoutSplit = {
  id: 'split-2b',
  name: 'Treino B - Membros Superiores & Postura',
  weekDays: [4], // Quinta
  exercises: [
    {
      id: 'ex-12',
      name: 'Puxada Frontal Aberta',
      muscleGroup: 'Dorsal',
      sets: 3,
      repZone: '10-12',
      restSeconds: 60,
      method: 'Normal',
      observations: 'Foco na postura torácica e retração escapular.',
      extraBlocks: [],
    },
    {
      id: 'ex-13',
      name: 'Elevação Lateral com Halteres',
      muscleGroup: 'Deltóide Lateral',
      sets: 3,
      repZone: '12-15',
      restSeconds: 60,
      method: 'Normal',
      observations: 'Cotovelos levemente flexionados, subir até a linha dos ombros.',
      extraBlocks: [],
    },
  ],
};

// Initial Seed Workouts (Programs with multiple splits)
export const INITIAL_WORKOUTS: WorkoutProgram[] = [
  {
    id: 'prog-1',
    clientId: 'client-1',
    name: 'Periodização de Hipertrofia A/B',
    goal: 'Hipertrofia Máxima e Densidade Muscular',
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    splits: [SPLIT_CARLOS_A, SPLIT_CARLOS_B],
    weekDays: [1, 2, 4, 5],
    exercises: SPLIT_CARLOS_A.exercises,
    createdAt: '2026-09-01',
  },
  {
    id: 'prog-2',
    clientId: 'client-1',
    name: 'Mesociclo de Força e Cargas',
    goal: 'Aumento de Força 1RM e Potência',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    splits: [
      {
        id: 'split-forca-1',
        name: 'Treino Pesado - Força Máxima',
        weekDays: [3, 6], // Qua e Sáb
        exercises: [
          SPLIT_CARLOS_A.exercises[0],
          SPLIT_CARLOS_A.exercises[1],
          SPLIT_CARLOS_A.exercises[3],
        ],
      },
    ],
    weekDays: [3, 6],
    exercises: [SPLIT_CARLOS_A.exercises[0]],
    createdAt: '2026-09-15',
  },
  {
    id: 'prog-3',
    clientId: 'client-2',
    name: 'Membros Inferiores & Glúteo',
    goal: 'Tonificação e Força Funcional',
    startDate: '2026-09-10',
    endDate: '2026-12-15',
    splits: [SPLIT_MARIANA_A, SPLIT_MARIANA_B],
    weekDays: [2, 4],
    exercises: SPLIT_MARIANA_A.exercises,
    createdAt: '2026-09-10',
  },
];

// Initial Seed 4-session History per Exercise
const INITIAL_HISTORY: Record<string, ExerciseHistoricalEntry[]> = {
  'Supino Reto com Barra': [
    { date: '08/09', weightKg: 70, reps: 12, setsCompleted: 4 },
    { date: '15/09', weightKg: 74, reps: 10, setsCompleted: 4 },
    { date: '22/09', weightKg: 78, reps: 10, setsCompleted: 4 },
    { date: '29/09', weightKg: 82.5, reps: 8, setsCompleted: 4 },
  ],
  'Supino Inclinado com Halteres': [
    { date: '08/09', weightKg: 24, reps: 12, setsCompleted: 4 },
    { date: '15/09', weightKg: 26, reps: 11, setsCompleted: 4 },
    { date: '22/09', weightKg: 26, reps: 12, setsCompleted: 4 },
    { date: '29/09', weightKg: 28, reps: 10, setsCompleted: 4 },
  ],
  'Crucifixo no Crossover Polia Média': [
    { date: '08/09', weightKg: 15, reps: 15, setsCompleted: 3 },
    { date: '15/09', weightKg: 17.5, reps: 14, setsCompleted: 3 },
    { date: '22/09', weightKg: 17.5, reps: 15, setsCompleted: 3 },
    { date: '29/09', weightKg: 20, reps: 12, setsCompleted: 3 },
  ],
  'Tríceps Testa com Barra W': [
    { date: '08/09', weightKg: 28, reps: 12, setsCompleted: 4 },
    { date: '15/09', weightKg: 30, reps: 10, setsCompleted: 4 },
    { date: '22/09', weightKg: 32, reps: 10, setsCompleted: 4 },
    { date: '29/09', weightKg: 34, reps: 9, setsCompleted: 4 },
  ],
  'Tríceps Corda na Polia Alta': [
    { date: '08/09', weightKg: 35, reps: 15, setsCompleted: 3 },
    { date: '15/09', weightKg: 40, reps: 14, setsCompleted: 3 },
    { date: '22/09', weightKg: 42.5, reps: 12, setsCompleted: 3 },
    { date: '29/09', weightKg: 45, reps: 12, setsCompleted: 3 },
  ],
  'Puxada Frontal Aberta': [
    { date: '09/09', weightKg: 55, reps: 12, setsCompleted: 4 },
    { date: '16/09', weightKg: 60, reps: 11, setsCompleted: 4 },
    { date: '23/09', weightKg: 62.5, reps: 10, setsCompleted: 4 },
    { date: '30/09', weightKg: 65, reps: 9, setsCompleted: 4 },
  ],
  'Agachamento Livre com Barra': [
    { date: '07/09', weightKg: 50, reps: 10, setsCompleted: 4 },
    { date: '14/09', weightKg: 55, reps: 10, setsCompleted: 4 },
    { date: '21/09', weightKg: 60, reps: 8, setsCompleted: 4 },
    { date: '28/09', weightKg: 65, reps: 8, setsCompleted: 4 },
  ],
};

// Initial Seed Calendar Events
export const INITIAL_CALENDAR: CalendarEvent[] = [
  {
    id: 'evt-1',
    clientId: 'client-1',
    clientName: 'Carlos Silva',
    title: 'Treino A - Peitoral & Tríceps',
    date: '2026-10-02',
    startTime: '07:00',
    endTime: '08:00',
    recurringDays: [1, 4],
    notes: 'Avaliar progressão de carga no Supino Reto.',
    status: 'realizado',
  },
  {
    id: 'evt-2',
    clientId: 'client-2',
    clientName: 'Mariana Oliveira',
    title: 'Treino A - Inferiores & Glúteo',
    date: '2026-10-02',
    startTime: '08:30',
    endTime: '09:30',
    recurringDays: [2, 4],
    notes: 'Treino focado em elevação pélvica.',
    status: 'confirmado',
  },
  {
    id: 'evt-3',
    clientId: 'client-3',
    clientName: 'Rodrigo Santos',
    title: 'Treino Funcional & Cardio',
    date: '2026-10-02',
    startTime: '18:00',
    endTime: '19:00',
    recurringDays: [1, 3, 5],
    notes: 'Controle de frequência cardíaca.',
    status: 'reagendado',
    rescheduledDate: '2026-10-03',
    rescheduledTime: '19:00',
  },
  {
    id: 'evt-4',
    clientId: 'client-4',
    clientName: 'Beatriz Mendes',
    title: 'Avaliação & Treino Avulso',
    date: '2026-10-03',
    startTime: '09:00',
    endTime: '10:00',
    recurringDays: [6],
    notes: 'Início do acompanhamento. Aluno avisou imprevisto.',
    status: 'falta',
  },
];

export const INITIAL_COMPLETED_WORKOUTS: CompletedWorkoutRecord[] = [
  {
    id: 'comp-1',
    clientId: 'client-1',
    clientName: 'Carlos Silva',
    programName: 'Periodização de Hipertrofia A/B',
    splitName: 'Treino A - Peitoral e Tríceps',
    date: '02/10/2026',
    time: '16:45',
    completedAt: '2026-10-02T16:45:00.000Z',
    durationSeconds: 3120,
    durationFormatted: '52m 00s',
    totalVolumeKg: 4680,
    trainerNotes: 'Ótima estabilização escapular no Supino Reto. No supino inclinado, manter os cotovelos a 75° do tronco para proteger a cápsula anterior do ombro.',
    exercises: [
      {
        exerciseId: 'ex-1',
        name: 'Supino Reto com Barra',
        muscleGroup: 'Peitoral',
        method: 'Normal',
        observations: 'Pegada média, escápulas em retração.',
        sets: [
          { setNumber: 1, completedReps: 12, weightKg: 60, repZone: '8-12', completed: true },
          { setNumber: 2, completedReps: 10, weightKg: 70, repZone: '8-12', completed: true },
          { setNumber: 3, completedReps: 8, weightKg: 80, repZone: '8-12', completed: true },
          { setNumber: 4, completedReps: 6, weightKg: 85, repZone: '8-12', completed: true },
        ],
      },
      {
        exerciseId: 'ex-2',
        name: 'Supino Inclinado com Halteres',
        muscleGroup: 'Peitoral',
        method: 'Drop-Set Tradicional',
        observations: 'Última série com drop imediato.',
        sets: [
          { setNumber: 1, completedReps: 10, weightKg: 28, repZone: '10', completed: true },
          { setNumber: 2, completedReps: 10, weightKg: 28, repZone: '10', completed: true },
          {
            setNumber: 3,
            completedReps: 8,
            weightKg: 30,
            repZone: '8-10',
            completed: true,
            method: 'Drop-Set Tradicional',
            subSets: [
              { subSetNumber: 1, completedReps: 6, weightKg: 22, repZone: 'Até a falha', completed: true, note: 'Drop 1 • Redução de 25%' },
            ],
          },
        ],
      },
      {
        exerciseId: 'ex-3',
        name: 'Tríceps Corda no Cross',
        muscleGroup: 'Tríceps',
        method: '3/7',
        observations: 'Abertura no final da fase concêntrica.',
        sets: [
          { setNumber: 1, completedReps: 12, weightKg: 25, repZone: '12', completed: true },
          { setNumber: 2, completedReps: 10, weightKg: 27.5, repZone: '10', completed: true },
          {
            setNumber: 3,
            completedReps: 3,
            weightKg: 30,
            repZone: '3 reps',
            completed: true,
            method: '3/7',
            subSets: [
              { subSetNumber: 1, completedReps: 4, weightKg: 30, repZone: '4 reps', completed: true, note: 'Passo 2 (4 reps) • 15s intervalo' },
              { subSetNumber: 2, completedReps: 5, weightKg: 30, repZone: '5 reps', completed: true, note: 'Passo 3 (5 reps) • 15s intervalo' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'comp-2',
    clientId: 'client-1',
    clientName: 'Carlos Silva',
    programName: 'Periodização de Hipertrofia A/B',
    splitName: 'Treino B - Dorsal e Bíceps',
    date: '29/09/2026',
    time: '17:15',
    completedAt: '2026-09-29T17:15:00.000Z',
    durationSeconds: 2760,
    durationFormatted: '46m 00s',
    totalVolumeKg: 3950,
    exercises: [
      {
        exerciseId: 'ex-4',
        name: 'Puxada Frontal Aberta',
        muscleGroup: 'Dorsal',
        method: 'Normal',
        sets: [
          { setNumber: 1, completedReps: 12, weightKg: 50, repZone: '10-12', completed: true },
          { setNumber: 2, completedReps: 10, weightKg: 55, repZone: '10-12', completed: true },
          { setNumber: 3, completedReps: 10, weightKg: 60, repZone: '10-12', completed: true },
        ],
      },
      {
        exerciseId: 'ex-5',
        name: 'Remada Curvada com Barra',
        muscleGroup: 'Dorsal',
        method: 'Normal',
        sets: [
          { setNumber: 1, completedReps: 10, weightKg: 50, repZone: '8-10', completed: true },
          { setNumber: 2, completedReps: 8, weightKg: 60, repZone: '8-10', completed: true },
          { setNumber: 3, completedReps: 8, weightKg: 60, repZone: '8-10', completed: true },
        ],
      },
      {
        exerciseId: 'ex-6',
        name: 'Rosca Direta com Barra W',
        muscleGroup: 'Bíceps',
        method: 'Parcial',
        sets: [
          { setNumber: 1, completedReps: 10, weightKg: 20, repZone: '10', completed: true },
          { setNumber: 2, completedReps: 10, weightKg: 25, repZone: '10', completed: true },
          {
            setNumber: 3,
            completedReps: 8,
            weightKg: 25,
            repZone: '8',
            completed: true,
            method: 'Parcial',
            subSets: [
              { subSetNumber: 1, completedReps: 6, weightKg: 25, repZone: 'Parciais até a falha', completed: true, note: 'Repetições parciais imediatas sem descanso' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'comp-3',
    clientId: 'client-2',
    clientName: 'Mariana Oliveira',
    programName: 'Fortalecimento & Postura',
    splitName: 'Treino A - Inferiores & Glúteo',
    date: '01/10/2026',
    time: '08:30',
    completedAt: '2026-10-01T08:30:00.000Z',
    durationSeconds: 2940,
    durationFormatted: '49m 00s',
    totalVolumeKg: 5200,
    exercises: [
      {
        exerciseId: 'ex-7',
        name: 'Agachamento Livre com Barra',
        muscleGroup: 'Quadríceps',
        method: 'Normal',
        sets: [
          { setNumber: 1, completedReps: 12, weightKg: 40, repZone: '10-12', completed: true },
          { setNumber: 2, completedReps: 10, weightKg: 50, repZone: '10-12', completed: true },
          { setNumber: 3, completedReps: 10, weightKg: 55, repZone: '10-12', completed: true },
        ],
      },
      {
        exerciseId: 'ex-8',
        name: 'Leg Press 45°',
        muscleGroup: 'Quadríceps',
        method: 'Cluster-Set',
        sets: [
          { setNumber: 1, completedReps: 12, weightKg: 120, repZone: '12', completed: true },
          { setNumber: 2, completedReps: 12, weightKg: 140, repZone: '12', completed: true },
          {
            setNumber: 3,
            completedReps: 5,
            weightKg: 150,
            repZone: '5 reps',
            completed: true,
            method: 'Cluster-Set',
            subSets: [
              { subSetNumber: 1, completedReps: 4, weightKg: 150, repZone: '4 reps', completed: true, note: 'Cluster 1 • 15s pausa intra-série' },
            ],
          },
        ],
      },
    ],
  },
];

export const storage = {
  getClients(): Client[] {
    if (typeof window === 'undefined') return INITIAL_CLIENTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
        return INITIAL_CLIENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CLIENTS;
    }
  },

  saveClients(clients: Client[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  getWorkouts(): WorkoutProgram[] {
    if (typeof window === 'undefined') return INITIAL_WORKOUTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(INITIAL_WORKOUTS));
        return INITIAL_WORKOUTS;
      }
      const parsed: WorkoutProgram[] = JSON.parse(data);
      return parsed.map((p) => {
        // Ensure splits exist
        if (!p.splits || p.splits.length === 0) {
          p.splits = [
            {
              id: `${p.id}-split-1`,
              name: p.name || 'Treino A',
              weekDays: p.weekDays || [1, 4],
              exercises: p.exercises || [],
            },
          ];
        }
        return p;
      });
    } catch {
      return INITIAL_WORKOUTS;
    }
  },

  saveWorkouts(workouts: WorkoutProgram[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  deleteWorkout(id: string): WorkoutProgram[] {
    const list = this.getWorkouts().filter((w) => w.id !== id);
    this.saveWorkouts(list);
    return list;
  },

  getCalendarEvents(): CalendarEvent[] {
    if (typeof window === 'undefined') return INITIAL_CALENDAR;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALENDAR);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(INITIAL_CALENDAR));
        return INITIAL_CALENDAR;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_CALENDAR;
    }
  },

  saveCalendarEvents(events: CalendarEvent[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(events));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  getExerciseHistory(exerciseName: string): ExerciseHistoricalEntry[] {
    if (typeof window === 'undefined') {
      return INITIAL_HISTORY[exerciseName] || [];
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
        return INITIAL_HISTORY[exerciseName] || [];
      }
      const parsed = JSON.parse(data);
      return parsed[exerciseName] || INITIAL_HISTORY[exerciseName] || [];
    } catch {
      return INITIAL_HISTORY[exerciseName] || [];
    }
  },

  recordExerciseHistory(
    exerciseName: string,
    weightKg: number,
    reps: number,
    setsCompleted: number
  ) {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const historyMap: Record<string, ExerciseHistoricalEntry[]> = data
        ? JSON.parse(data)
        : { ...INITIAL_HISTORY };

      const existing = historyMap[exerciseName] || [];
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(
        today.getMonth() + 1
      ).padStart(2, '0')}`;

      const newEntry: ExerciseHistoricalEntry = {
        date: dateStr,
        weightKg,
        reps,
        setsCompleted,
      };

      const updated = [...existing, newEntry];
      // Keep only last 8 entries for clean performance
      if (updated.length > 8) {
        updated.splice(0, updated.length - 8);
      }

      historyMap[exerciseName] = updated;
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyMap));
    } catch (e) {
      console.error('Error recording exercise history:', e);
    }
  },

  getActiveSession(): ActiveWorkoutSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveActiveSession(session: ActiveWorkoutSession | null) {
    if (typeof window === 'undefined') return;
    try {
      if (!session) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      } else {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      }
    } catch (e) {
      console.error('Error saving active session:', e);
    }
  },

  // EXERCISE DATABASE METHODS
  getExerciseDatabase(): DatabaseExercise[] {
    if (typeof window === 'undefined') return INITIAL_EXERCISE_DATABASE;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXERCISE_DATABASE);
      if (!data) {
        localStorage.setItem(
          STORAGE_KEYS.EXERCISE_DATABASE,
          JSON.stringify(INITIAL_EXERCISE_DATABASE)
        );
        return INITIAL_EXERCISE_DATABASE;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_EXERCISE_DATABASE;
    }
  },

  saveExerciseDatabase(exercises: DatabaseExercise[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.EXERCISE_DATABASE,
        JSON.stringify(exercises)
      );
    } catch (e) {
      console.error('Error saving exercise database:', e);
    }
  },

  addExerciseToDatabase(name: string, muscleGroup: MuscleGroup): DatabaseExercise {
    const list = this.getExerciseDatabase();
    const newEx: DatabaseExercise = {
      id: `custom-ex-${Date.now()}`,
      name: name.trim(),
      muscleGroup,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEx, ...list];
    this.saveExerciseDatabase(updated);
    return newEx;
  },

  deleteExerciseFromDatabase(exerciseId: string): DatabaseExercise[] {
    const list = this.getExerciseDatabase();
    const updated = list.filter((ex) => ex.id !== exerciseId);
    this.saveExerciseDatabase(updated);
    return updated;
  },

  resetExerciseDatabase(): DatabaseExercise[] {
    this.saveExerciseDatabase(INITIAL_EXERCISE_DATABASE);
    return INITIAL_EXERCISE_DATABASE;
  },

  // COMPLETED WORKOUTS HISTORY METHODS
  getCompletedWorkouts(clientId?: string): CompletedWorkoutRecord[] {
    if (typeof window === 'undefined') {
      return clientId
        ? INITIAL_COMPLETED_WORKOUTS.filter((w) => w.clientId === clientId)
        : INITIAL_COMPLETED_WORKOUTS;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_WORKOUTS);
      if (!data) {
        localStorage.setItem(
          STORAGE_KEYS.COMPLETED_WORKOUTS,
          JSON.stringify(INITIAL_COMPLETED_WORKOUTS)
        );
        return clientId
          ? INITIAL_COMPLETED_WORKOUTS.filter((w) => w.clientId === clientId)
          : INITIAL_COMPLETED_WORKOUTS;
      }
      const list: CompletedWorkoutRecord[] = JSON.parse(data);
      return clientId ? list.filter((w) => w.clientId === clientId) : list;
    } catch {
      return clientId
        ? INITIAL_COMPLETED_WORKOUTS.filter((w) => w.clientId === clientId)
        : INITIAL_COMPLETED_WORKOUTS;
    }
  },

  saveCompletedWorkout(record: CompletedWorkoutRecord): CompletedWorkoutRecord[] {
    const list = this.getCompletedWorkouts();
    const updated = [record, ...list];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEYS.COMPLETED_WORKOUTS,
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error('Error saving completed workout:', e);
      }
    }
    return updated;
  },

  deleteCompletedWorkout(workoutId: string): CompletedWorkoutRecord[] {
    const list = this.getCompletedWorkouts();
    const updated = list.filter((w) => w.id !== workoutId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEYS.COMPLETED_WORKOUTS,
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error('Error deleting completed workout:', e);
      }
    }
    return updated;
  },
};
