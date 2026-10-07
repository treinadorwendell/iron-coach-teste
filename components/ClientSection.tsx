'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, ContractType, Gender, CompletedWorkoutRecord } from '@/types';
import { storage } from '@/lib/storage';
import {
  UserPlus,
  Search,
  Mail,
  Calendar,
  Weight,
  Ruler,
  DollarSign,
  Play,
  FilePlus,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Activity,
  History,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Clock,
  Flame,
  Check,
  Layers,
  PenLine,
  FileText,
} from 'lucide-react';

interface ClientSectionProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onStartWorkoutForClient: (client: Client) => void;
  onCreateWorkoutForClient: (client: Client) => void;
}

export const ClientSection: React.FC<ClientSectionProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onStartWorkoutForClient,
  onCreateWorkoutForClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<'Todos' | ContractType>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Completed workouts history state
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkoutRecord[]>(() => {
    if (typeof window !== 'undefined') {
      return storage.getCompletedWorkouts();
    }
    return [];
  });
  const [expandedHistoryClientIds, setExpandedHistoryClientIds] = useState<Set<string>>(new Set());
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Set<string>>(new Set());
  const [expandedExerciseKeys, setExpandedExerciseKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleStorage = () => {
      setCompletedWorkouts(storage.getCompletedWorkouts());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleClientHistory = (clientId: string) => {
    // Always refresh latest completed workouts from storage
    setCompletedWorkouts(storage.getCompletedWorkouts());
    setExpandedHistoryClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const toggleWorkoutExpand = (workoutId: string) => {
    setExpandedWorkoutIds((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  };

  const toggleExerciseExpand = (exKey: string) => {
    setExpandedExerciseKeys((prev) => {
      const next = new Set(prev);
      if (next.has(exKey)) {
        next.delete(exKey);
      } else {
        next.add(exKey);
      }
      return next;
    });
  };

  // Form State
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('Masculino');
  const [weight, setWeight] = useState<string>('75');
  const [height, setHeight] = useState<string>('175');
  const [email, setEmail] = useState('');
  const [contractType, setContractType] = useState<ContractType>('Mensal');
  const [contractValue, setContractValue] = useState<string>('750');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openNewClientModal = () => {
    setEditingClient(null);
    setName('');
    setBirthDate('');
    setGender('Masculino');
    setWeight('75');
    setHeight('175');
    setEmail('');
    setContractType('Mensal');
    setContractValue('750');
    setPhone('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setBirthDate(client.birthDate);
    setGender(client.gender);
    setWeight(String(client.weight));
    setHeight(String(client.height));
    setEmail(client.email);
    setContractType(client.contractType);
    setContractValue(String(client.contractValue));
    setPhone(client.phone || '');
    setNotes(client.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleContractTypeChange = (type: ContractType) => {
    setContractType(type);
    // suggest standard defaults
    if (!editingClient) {
      if (type === 'Avulsa') setContractValue('90');
      if (type === 'Semanal') setContractValue('220');
      if (type === 'Mensal') setContractValue('750');
    }
  };

  const calculateIMC = (w: number, h: number) => {
    if (!w || !h) return null;
    const hM = h / 100;
    const imc = w / (hM * hM);
    return imc.toFixed(1);
  };

  const calculateAge = (bDate: string) => {
    if (!bDate || bDate.length < 10) return null;
    const parts = bDate.split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const birth = new Date(y, m, d);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Por favor, informe o nome completo do aluno.');
      return;
    }
    if (!birthDate.trim()) {
      setFormError('Informe a data de nascimento no formato DD/MM/AAAA.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Informe um e-mail válido.');
      return;
    }

    const numWeight = parseFloat(weight) || 70;
    const numHeight = parseFloat(height) || 170;
    const numValue = parseFloat(contractValue) || 0;

    if (editingClient) {
      const updated: Client = {
        ...editingClient,
        name: name.trim(),
        birthDate: birthDate.trim(),
        gender,
        weight: numWeight,
        height: numHeight,
        email: email.trim(),
        contractType,
        contractValue: numValue,
        phone: phone.trim(),
        notes: notes.trim(),
      };
      onUpdateClient(updated);
    } else {
      const newClient: Client = {
        id: `client-${Date.now()}`,
        name: name.trim(),
        birthDate: birthDate.trim(),
        gender,
        weight: numWeight,
        height: numHeight,
        email: email.trim(),
        contractType,
        contractValue: numValue,
        phone: phone.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddClient(newClient);
    }

    setIsModalOpen(false);
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContract =
      contractFilter === 'Todos' || c.contractType === contractFilter;
    return matchesSearch && matchesContract;
  });

  const totalMonthlyRevenue = clients.reduce((acc, c) => {
    if (c.contractType === 'Mensal') return acc + c.contractValue;
    if (c.contractType === 'Semanal') return acc + c.contractValue * 4;
    return acc + c.contractValue;
  }, 0);

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 shadow-md">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total de Alunos
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{clients.length}</span>
            <span className="text-xs text-emerald-400 font-medium">Ativos</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 shadow-md">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Faturamento Estimado
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold text-emerald-400">R$</span>
            <span className="text-2xl font-black text-white">
              {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-400">/mês</span>
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Cadastro Destacado */}
        <button
          onClick={openNewClientModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition touch-manipulation"
        >
          <UserPlus className="w-5 h-5 text-emerald-100" />
          <span>Cadastrar Novo Aluno</span>
        </button>
      </div>

      {/* Contract Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['Todos', 'Mensal', 'Semanal', 'Avulsa'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setContractFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
              contractFilter === filter
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            {filter === 'Todos' ? 'Todos os Planos' : `Plano ${filter}`}
          </button>
        ))}
      </div>

      {/* Client List Cards */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <UserPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Nenhum aluno encontrado</p>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre um novo aluno ou altere os termos da busca.
            </p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const age = calculateAge(client.birthDate);
            const imc = calculateIMC(client.weight, client.height);
            const clientWorkouts = completedWorkouts.filter((w) => w.clientId === client.id);
            const isHistoryExpanded = expandedHistoryClientIds.has(client.id);

            return (
              <div
                key={client.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-md transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md ${
                        client.gender === 'Feminino'
                          ? 'bg-gradient-to-tr from-pink-600 to-rose-500'
                          : 'bg-gradient-to-tr from-blue-600 to-cyan-500'
                      }`}
                    >
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {client.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            client.gender === 'Feminino'
                              ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {client.gender}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {client.birthDate} {age ? `(${age} anos)` : ''}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {client.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition"
                      title="Editar Aluno"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setClientToDelete(client)}
                      className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:scale-95 transition"
                      title="Excluir Aluno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Weight className="w-3 h-3 text-cyan-400" /> Peso
                    </span>
                    <span className="text-xs font-bold text-white mt-0.5 block">
                      {client.weight} kg
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Ruler className="w-3 h-3 text-cyan-400" /> Altura
                    </span>
                    <span className="text-xs font-bold text-white mt-0.5 block">
                      {client.height} cm
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" /> IMC
                    </span>
                    <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                      {imc || '--'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3 text-amber-400" /> Plano
                    </span>
                    <span className="text-xs font-bold text-amber-300 mt-0.5 block truncate">
                      {client.contractType} (R$ {client.contractValue})
                    </span>
                  </div>
                </div>

                {client.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 italic">
                    &ldquo;{client.notes}&rdquo;
                  </p>
                )}

                {/* Direct Touch Action Buttons for Tablet Personal Trainer */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onStartWorkoutForClient(client)}
                    className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition touch-manipulation"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar Treino Agora</span>
                  </button>

                  <button
                    onClick={() => onCreateWorkoutForClient(client)}
                    className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 active:scale-95 transition touch-manipulation"
                  >
                    <FilePlus className="w-4 h-4 text-cyan-400" />
                    <span>Criar Novo Treino</span>
                  </button>
                </div>

                {/* Botão de Histórico de Treino (Expandível) */}
                <div className="pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => toggleClientHistory(client.id)}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl border text-xs font-bold transition active:scale-[0.98] ${
                      isHistoryExpanded
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-950/20'
                        : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Histórico de Treinos</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {clientWorkouts.length} {clientWorkouts.length === 1 ? 'finalizado' : 'finalizados'}
                      </span>
                    </div>
                    {isHistoryExpanded ? (
                      <ChevronUp className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Histórico de Treinos Expandido (Hierárquico: Treino -> Exercício -> Séries/Reps/Cargas) */}
                <AnimatePresence>
                  {isHistoryExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-2 pt-1"
                    >
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-amber-400" />
                          <span>Treinos Finalizados ({clientWorkouts.length}):</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Toque no treino para ver os exercícios
                        </span>
                      </div>

                      {clientWorkouts.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-1.5">
                          <History className="w-7 h-7 text-slate-600 mx-auto" />
                          <p className="text-xs font-bold text-slate-300">
                            Nenhum treino finalizado para este aluno ainda.
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Ao concluir uma sessão na aba &ldquo;Executar Treino&rdquo;, o registro com data, exercícios, séries, repetições e cargas aparecerá aqui.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {clientWorkouts.map((workout) => {
                            const isWorkoutExpanded = expandedWorkoutIds.has(workout.id);

                            return (
                              <div
                                key={workout.id}
                                className="rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition overflow-hidden shadow-sm"
                              >
                                {/* Nível 1: Cabeçalho do Treino Finalizado (Clicável) */}
                                <div
                                  onClick={() => toggleWorkoutExpand(workout.id)}
                                  className="p-3 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-900/60 transition"
                                >
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                        <Calendar className="w-3 h-3" />
                                        {workout.date} {workout.time ? `às ${workout.time}` : ''}
                                      </span>
                                      <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1 font-semibold">
                                        <Clock className="w-3 h-3 text-cyan-400" />
                                        {workout.durationFormatted}
                                      </span>
                                      <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1 font-semibold">
                                        <Flame className="w-3 h-3 text-amber-400" />
                                        {workout.totalVolumeKg.toLocaleString('pt-BR')} kg
                                      </span>
                                    </div>

                                    <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                                      <h4 className="text-xs sm:text-sm font-black text-white">
                                        {workout.splitName}
                                      </h4>
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        • {workout.programName}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center">
                                    <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                                      {workout.exercises.length} {workout.exercises.length === 1 ? 'exercício' : 'exercícios'}
                                    </span>
                                    <div className="p-1 rounded-lg bg-slate-800 text-slate-300">
                                      {isWorkoutExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-cyan-400" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Nível 2: Lista de Exercícios Realizados no Treino */}
                                {isWorkoutExpanded && (
                                  <div className="p-2.5 pt-0 border-t border-slate-800/80 space-y-2 bg-slate-900/40">
                                    {/* Feedback e Correções do Treinador Registradas */}
                                    {workout.trainerNotes && (
                                      <div className="mt-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                                          <PenLine className="w-3.5 h-3.5" />
                                          <span>Feedback & Correções do Treinador:</span>
                                        </div>
                                        <p className="text-xs text-slate-200 italic pl-1 leading-relaxed">
                                          &ldquo;{workout.trainerNotes}&rdquo;
                                        </p>
                                      </div>
                                    )}

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-2 flex items-center gap-1">
                                      <Dumbbell className="w-3 h-3 text-cyan-400" />
                                      <span>Exercícios realizados (toque no exercício para ver séries, reps e carga):</span>
                                    </p>

                                    <div className="space-y-1.5">
                                      {workout.exercises.map((ex, exIdx) => {
                                        const exKey = `${workout.id}-${exIdx}`;
                                        const isExExpanded = expandedExerciseKeys.has(exKey);

                                        return (
                                          <div
                                            key={exKey}
                                            className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden"
                                          >
                                            {/* Cabeçalho do Exercício */}
                                            <div
                                              onClick={() => toggleExerciseExpand(exKey)}
                                              className="p-2.5 cursor-pointer flex items-center justify-between hover:bg-slate-800/70 transition"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-black flex items-center justify-center border border-slate-700">
                                                  #{exIdx + 1}
                                                </span>
                                                <div>
                                                  <span className="text-xs font-bold text-white block">
                                                    {ex.name}
                                                  </span>
                                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                                    <span className="text-cyan-400 font-semibold">{ex.muscleGroup}</span>
                                                    {ex.method && ex.method !== 'Normal' && (
                                                      <span className="text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.2 rounded border border-purple-500/30">
                                                        {ex.method}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                                                  {ex.sets.length} {ex.sets.length === 1 ? 'série' : 'séries'}
                                                </span>
                                                {isExExpanded ? (
                                                  <ChevronUp className="w-3.5 h-3.5 text-purple-400" />
                                                ) : (
                                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                )}
                                              </div>
                                            </div>

                                            {/* Nível 3: Séries Realizadas, Repetições Realizadas e Carga Utilizada */}
                                            {isExExpanded && (
                                              <div className="p-2.5 pt-1 border-t border-slate-800 bg-slate-950/80 space-y-1.5">
                                                <div className="grid grid-cols-12 gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                                  <span className="col-span-2 text-center">Série</span>
                                                  <span className="col-span-3 text-center">Reps Feitas</span>
                                                  <span className="col-span-3 text-center">Carga Usada</span>
                                                  <span className="col-span-2 text-center">Meta</span>
                                                  <span className="col-span-2 text-center">Status</span>
                                                </div>

                                                {ex.sets.map((set, sIdx) => (
                                                  <div key={sIdx} className="space-y-1">
                                                    <div className="grid grid-cols-12 gap-1 items-center p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                                                      {/* Série */}
                                                      <div className="col-span-2 flex items-center justify-center">
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-black text-[10px]">
                                                          #{set.setNumber}
                                                        </span>
                                                      </div>

                                                      {/* Repetições Realizadas */}
                                                      <div className="col-span-3 text-center">
                                                        <span className="font-mono font-black text-white text-xs">
                                                          {set.completedReps}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 ml-0.5">reps</span>
                                                      </div>

                                                      {/* Carga Utilizada */}
                                                      <div className="col-span-3 text-center">
                                                        <span className="font-mono font-black text-emerald-400 text-xs">
                                                          {set.weightKg}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 ml-0.5">kg</span>
                                                      </div>

                                                      {/* Meta Original */}
                                                      <div className="col-span-2 text-center">
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                          {set.repZone || '--'}
                                                        </span>
                                                      </div>

                                                      {/* Status */}
                                                      <div className="col-span-2 flex items-center justify-center">
                                                        {set.completed ? (
                                                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                            <span>OK</span>
                                                          </span>
                                                        ) : (
                                                          <span className="text-[9px] text-slate-500 font-semibold">
                                                            Pendente
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>

                                                    {/* Subséries Realizadas */}
                                                    {set.subSets && set.subSets.length > 0 && (
                                                      <div className="ml-4 pl-2 border-l border-purple-500/40 space-y-1">
                                                        {set.subSets.map((sub, subIdx) => (
                                                          <div
                                                            key={subIdx}
                                                            className="grid grid-cols-12 gap-1 items-center p-1.5 rounded-lg bg-purple-950/20 border border-purple-500/30 text-xs"
                                                          >
                                                            <div className="col-span-2 flex items-center gap-1 justify-center">
                                                              <span className="text-[9px] font-bold text-purple-300">
                                                                ↳ Sub #{sub.subSetNumber}
                                                              </span>
                                                            </div>
                                                            <div className="col-span-3 text-center">
                                                              <span className="font-mono font-black text-purple-200">
                                                                {sub.completedReps}
                                                              </span>
                                                              <span className="text-[9px] text-slate-400 ml-0.5">reps</span>
                                                            </div>
                                                            <div className="col-span-3 text-center">
                                                              <span className="font-mono font-black text-purple-300">
                                                                {sub.weightKg}
                                                              </span>
                                                              <span className="text-[9px] text-slate-400 ml-0.5">kg</span>
                                                            </div>
                                                            <div className="col-span-4 truncate text-[9px] text-slate-400" title={sub.note}>
                                                              {sub.note || sub.repZone || 'Subsérie'}
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Cadastrar / Editar Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingClient ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Preencha os dados do aluno para acompanhamento de treino
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Data Nascimento e Sexo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/AAAA"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  {birthDate.length >= 10 && calculateAge(birthDate) && (
                    <span className="text-[10px] text-emerald-400 mt-1 block">
                      Idade calculada: {calculateAge(birthDate)} anos
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sexo *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGender('Masculino')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition ${
                        gender === 'Masculino'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Feminino')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition ${
                        gender === 'Feminino'
                          ? 'bg-pink-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Feminino
                    </button>
                  </div>
                </div>
              </div>

              {/* Peso (KG) e Altura (CM) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Peso (KG) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="75.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Altura (CM) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="178"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* E-mail e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="aluno@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tipo de Contratação + Campo Numérico Dinâmico (Valor em R$) */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tipo de Contratação *
                    </label>
                    <select
                      value={contractType}
                      onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="Avulsa">Avulsa (Por Aula)</option>
                      <option value="Semanal">Semanal</option>
                      <option value="Mensal">Mensal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Valor em R$ ({contractType}) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                        R$
                      </span>
                      <input
                        type="number"
                        step="1"
                        required
                        value={contractValue}
                        onChange={(e) => setContractValue(e.target.value)}
                        placeholder="750"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-amber-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações / Histórico Médico */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Restrições Médicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Foco em hipertrofia, dor lombar leve, sem histórico de cirurgia..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 active:scale-95 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingClient ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Excluir Aluno</h3>
              <p className="text-xs text-slate-300">
                Tem certeza que deseja remover o aluno{' '}
                <strong className="text-rose-400 font-bold">{clientToDelete.name}</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                Esta ação removerá o aluno e seus dados da sua lista de alunos.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  onDeleteClient(clientToDelete.id);
                  setClientToDelete(null);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
