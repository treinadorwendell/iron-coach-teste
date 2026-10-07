'use client';

import React from 'react';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-xl font-bold text-white">Algo inesperado ocorreu</h2>
      <p className="text-xs text-slate-400 mt-1 mb-4">
        Ocorreu um erro temporário no carregamento.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
      >
        Tentar novamente
      </button>
    </div>
  );
}
