import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
        <Dumbbell className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-black text-white">Página Não Encontrada</h2>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">
        O treino ou página procurada não está disponível.
      </p>
      <Link
        href="/"
        className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
      >
        Voltar para o IronCoach
      </Link>
    </div>
  );
}
