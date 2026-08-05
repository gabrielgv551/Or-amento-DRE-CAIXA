import React from 'react'
import StepMargem from '../steps/StepMargem'

export default function AppMargem() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-6 px-6 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-700/70">Simulador de Margens</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-2xl font-semibold text-slate-900">Modo Gamer Financeiro</p>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-700">Novo visual</span>
          </div>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Uma experiência mais moderna com cálculo instantâneo de desconto e aumento de preço — com visual inspirado em dashboards de jogo.
          </p>
        </div>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-3xl border border-cyan-300 bg-white px-5 py-3 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 transition"
        >
          Voltar ao Fluxo
        </a>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <StepMargem className="max-w-[100vw]" />
      </div>
    </div>
  )
}
