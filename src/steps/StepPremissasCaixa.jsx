import React from 'react'

export default function StepPremissasCaixa({ data, updateData, next, back, className }) {
  const premissas = data.premissasCaixa || {}

  const update = (field, value) => {
    updateData('premissasCaixa', { ...premissas, [field]: value })
  }

  const inputClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-2 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">💰</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Premissas de Caixa</h2>
        <p className="text-slate-500 text-sm">Informe os prazos para converter a DRE em fluxo de caixa mensal</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto mb-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Prazo Médio de Recebimento (PMR)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              value={premissas.pmr ?? ''}
              onChange={e => update('pmr', Number(e.target.value))}
              className={inputClass}
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-400">dias</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Dias entre a venda e o recebimento</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Prazo Médio de Pagamento (PMP)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              value={premissas.pmp ?? ''}
              onChange={e => update('pmp', Number(e.target.value))}
              className={inputClass}
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-400">dias</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Dias entre a compra e o pagamento ao fornecedor</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Cobertura de Estoque
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              value={premissas.coberturaEstoque ?? ''}
              onChange={e => update('coberturaEstoque', Number(e.target.value))}
              className={inputClass}
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-400">dias</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Quantos dias de estoque a empresa mantém</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Saldo Inicial de Caixa
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.saldoInicial ?? ''}
              onChange={e => updateData('saldoInicial', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">Caixa disponível no início do período</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Saldo Inicial a Receber
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={premissas.saldoInicialReceber ?? ''}
              onChange={e => update('saldoInicialReceber', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">Contas a receber pendentes no início do período</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Recolhimento de Impostos
          </label>
          <select
            value={premissas.recolhimentoImpostos ?? 'mesmoMes'}
            onChange={e => update('recolhimentoImpostos', e.target.value)}
            className="w-full bg-transparent border-b border-slate-300 text-slate-900 py-2 outline-none focus:border-cyan-500 text-sm"
          >
            <option value="mesmoMes">No mesmo mês da venda</option>
            <option value="mesSeguinte">No mês seguinte</option>
            <option value="trimestral">Trimestral</option>
          </select>
          <p className="mt-2 text-xs text-slate-400">Quando os impostos saem da conta</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Pagamento de Folha
          </label>
          <select
            value={premissas.pagamentoFolha ?? 'mesSeguinte'}
            onChange={e => update('pagamentoFolha', e.target.value)}
            className="w-full bg-transparent border-b border-slate-300 text-slate-900 py-2 outline-none focus:border-cyan-500 text-sm"
          >
            <option value="mesmoMes">No mesmo mês</option>
            <option value="mesSeguinte">No mês seguinte</option>
          </select>
          <p className="mt-2 text-xs text-slate-400">Mês de pagamento da folha e encargos</p>
        </div>
      </div>

      <div className="flex gap-3 mt-4 max-w-lg mx-auto">
        <button
          onClick={back}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm"
        >
          ← Voltar
        </button>
        <button
          onClick={next}
          className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm"
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}
