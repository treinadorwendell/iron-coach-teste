export type Gender = 'Feminino' | 'Masculino';
export type ContractType = 'Avulsa' | 'Semanal' | 'Mensal';

export interface Client {
  id: string;
  name: string;
  birthDate: string; // DD/MM/AAAA
  gender: Gender;
  weight: number; // KG
  height: number; // CM
  email: string;
  contractType: ContractType;
  contractValue: number; // R$
  phone?: string;
  notes?: string;
  createdAt: string;
}

export type MuscleGroup =
  | 'Peitoral'
  | 'Dorsal'
  | 'Deltóide Anterior'
  | 'Deltóide Lateral'
  | 'Deltóide Posterior'
  | 'Tríceps'
  | 'Bíceps'
  | 'Quadríceps'
  | 'Ísquios'
  | 'Glúteo'
  | 'Panturrilha'
  | 'Trapézio'
  | 'Abdômen';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Peitoral',
  'Dorsal',
  'Deltóide Anterior',
  'Deltóide Lateral',
  'Deltóide Posterior',
  'Tríceps',
  'Bíceps',
  'Quadríceps',
  'Ísquios',
  'Glúteo',
  'Panturrilha',
  'Trapézio',
  'Abdômen',
];

export interface DatabaseExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom?: boolean;
  createdAt?: string;
}

export const WORKOUT_METHODS = [
  'Normal',
  '3/7',
  'Bi-set',
  'Cluster-Set',
  'Dead Stop',
  'Dead Stop + Pico de Contração',
  'Drop-Set Tradicional',
  'Drop-Set Adaptado',
  'Duplo Recrutamento',
  'Excêntrico',
  'FST-7',
  'GVT',
  'Ondulatório',
  'Ondulatório 28',
  'Parcial',
  'Pico de Contração + Drop-Set',
  'Pico de Contração + Excêntrica',
  'Pico de Contração Intra-repetições',
  'Pirâmide crescente',
  'Pirâmide Decrescente',
  'Ponto Zero',
  'Pré-Exaustão',
  'Progressão de Volume Linear',
  'Rest-Pause',
  'Super-série',
  'Tri-set',
] as const;

export type WorkoutMethod = (typeof WORKOUT_METHODS)[number] | string;

export interface ExerciseSubSetDetail {
  id: string;
  subSetNumber: number; // 1, 2, 3...
  repZone: string; // e.g. "4 reps", "Até a falha", "8-10"
  suggestedWeightKg?: number; // Carga sugerida em kg
  note?: string; // Instrução/observação (ex: "-20% carga", "sem descanso", "pausa 15s")
}

export interface ExerciseSetDetail {
  id: string;
  setNumber: number;
  repZone: string; // e.g. "8-12", "10", "15"
  suggestedWeightKg?: number; // Carga sugerida em kg
  method: string; // Método avançado específico desta série
  notes?: string;
  subSets?: ExerciseSubSetDetail[]; // Subséries disparadas por métodos como 3/7, Drop-set, Cluster, etc.
}

export interface ExtraBlock {
  id: string;
  type: 'Drop-set' | 'Repetições Parciais' | 'Isometria' | 'Rest-Pause' | 'Outro';
  repsText: string;
  note: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  repZone: string; // e.g. "8-12"
  restSeconds: number; // in seconds, e.g. 60, 90
  method: string; // 'Normal' | 'Bi-set' | 'Drop-Set Tradicional' | etc.
  observations: string;
  extraBlocks: ExtraBlock[];
  setDetails?: ExerciseSetDetail[]; // Séries individuais configuráveis
  combinationGroupId?: string; // ID único do grupo de combinação (ex: combo-123)
  combinationLabel?: string; // Ex: "Bi-set", "Tri-set", "Super-série", "Combinado"
  combinationOrder?: number; // Ordem na sequência da combinação (1, 2, 3...)
}

export interface WorkoutSplit {
  id: string;
  name: string; // e.g. "Treino A - Peitoral e Tríceps"
  weekDays: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  exercises: ExerciseItem[];
}

export interface WorkoutProgram {
  id: string;
  clientId: string;
  name: string; // e.g. "Programa Hipertrofia A/B"
  goal: string; // e.g. "Hipertrofia", "Definição", "Força"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  splits: WorkoutSplit[]; // Treinos vinculados aos dias da semana
  weekDays?: number[]; // Para compatibilidade retroativa
  exercises?: ExerciseItem[]; // Para compatibilidade retroativa
  createdAt: string;
}

export interface ExecutionSubSet {
  id: string;
  subSetNumber: number;
  repZone: string;
  targetReps: number;
  completedReps: number;
  weightKg: number;
  completed: boolean;
  note?: string;
}

export interface ExecutionSet {
  setNumber: number;
  repZone: string;
  targetReps: number;
  completedReps: number;
  weightKg: number;
  completed: boolean;
  completedAt?: string;
  extraVariation?: string;
  method?: string;
  subSets?: ExecutionSubSet[];
}

export interface ExecutionExerciseState {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  method: string;
  observations: string;
  restSeconds: number;
  sets: ExecutionSet[];
  combinationGroupId?: string;
  combinationLabel?: string;
  combinationOrder?: number;
}

export interface ActiveWorkoutSession {
  programId: string;
  clientId: string;
  clientName: string;
  programName: string;
  startTime: string; // ISO
  elapsedSeconds: number;
  isPaused: boolean;
  isStarted?: boolean;
  exercises: ExecutionExerciseState[];
  trainerNotes?: string;
}

export interface ExerciseHistoricalEntry {
  date: string; // e.g. "12/09", "19/09", "26/09", "03/10"
  weightKg: number;
  reps: number;
  setsCompleted: number;
}

export type CalendarEventStatus =
  | 'confirmado'
  | 'realizado'
  | 'reagendado'
  | 'falta'
  | 'cancelado';

export interface CalendarEvent {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "07:00"
  endTime: string; // "08:00"
  recurringDays?: number[]; // [1, 3, 5] for Mon, Wed, Fri
  notes?: string;
  status: CalendarEventStatus;
  rescheduledDate?: string;
  rescheduledTime?: string;
}

export type AgendaViewMode = 'dia' | 'semana' | 'mes' | 'ano' | 'programacao';

export type MainNavSection = 'cliente' | 'agenda' | 'criar-treino' | 'execucao';

export interface CompletedSubSetRecord {
  subSetNumber: number;
  completedReps: number;
  weightKg: number;
  repZone?: string;
  completed: boolean;
  note?: string;
}

export interface CompletedSetRecord {
  setNumber: number;
  completedReps: number;
  weightKg: number;
  repZone?: string;
  completed: boolean;
  method?: string;
  subSets?: CompletedSubSetRecord[];
}

export interface CompletedExerciseRecord {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  method?: string;
  observations?: string;
  sets: CompletedSetRecord[];
}

export interface CompletedWorkoutRecord {
  id: string;
  clientId: string;
  clientName: string;
  programId?: string;
  programName: string;
  splitId?: string;
  splitName: string;
  date: string; // e.g. "04/10/2026"
  time?: string; // e.g. "15:30"
  completedAt: string; // ISO
  durationSeconds: number;
  durationFormatted: string; // e.g. "52m 10s"
  totalVolumeKg: number;
  exercises: CompletedExerciseRecord[];
  trainerNotes?: string;
}
