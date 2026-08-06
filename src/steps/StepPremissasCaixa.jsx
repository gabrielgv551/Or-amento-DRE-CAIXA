import React, { useState, useEffect } from 'react'

function CurrencyInput({ value, onChange, className }) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  useEffect(() => {
    if (!editing) setRaw(value ? Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
  }, [value, editing])

  const handleFocus = () => {
    setEditing(true)
    setRaw(value ? String(Number(value)) : '')
  }

  const handleBlur = () => {
    setEditing(false)
    const num = parseFloat(String(raw).replace(/\./g, '').replace(',', '.')) || 0
    onChange(num)
  }

  const handleChange = (e) => {
    const v = e.target.value
    setRaw(v)
    const num = parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
    onChange(num)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={raw}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
    />
  )
}

export default function StepPremissasCaixa({ data, updateData, next, back, className }) {
  const premissas = data.premissasCaixa || {}

  const update = (field, value) => {
    updateData('premissasCaixa', { ...premissas, [field]: value })
  }

  const dividas = premissas.dividas || []

  const addDivida = () => {
    update('dividas', [...dividas, { nome: 'Dívida', parcela: 0, juros: 0 }])
  }

  const updateDivida = (idx, field, value) => {
    const next = dividas.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    update('dividas', next)
  }

  const removeDivida = (idx) => {
    update('dividas', dividas.filter((_, i) => i !== idx))
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
            % de Recompra do Estoque
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={premissas.pctRecompraEstoque ?? ''}
              onChange={e => update('pctRecompraEstoque', Number(e.target.value))}
              className={inputClass}
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Quanto do CMV a empresa precisa recomprar (ex: 80%)</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Saldo Inicial de Caixa
          </label>
          <div className="relative">
            <CurrencyInput
              value={data.saldoInicial}
              onChange={v => updateData('saldoInicial', v)}
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
            <CurrencyInput
              value={premissas.saldoInicialReceber}
              onChange={v => update('saldoInicialReceber', v)}
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

      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dívidas / Parcelas Não Operacionais</h3>
            <p className="text-xs text-slate-500">Pagamentos mensais de empréstimo, cartão ou financiamento</p>
          </div>
          <button
            onClick={addDivida}
            className="text-xs px-3 py-1.5 rounded-full border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition font-medium"
          >
            + Adicionar dívida
          </button>
        </div>

        {dividas.length === 0 && (
          <p className="text-sm text-slate-400">Nenhuma dívida cadastrada.</p>
        )}

        <div className="space-y-4">
          {dividas.map((divida, idx) => (
            <div key={idx} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💳</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Dívida {idx + 1}</h3>
                    <p className="text-xs text-slate-500">Pagamento mensal</p>
                  </div>
                </div>
                <button
                  onClick={() => removeDivida(idx)}
                  className="text-slate-400 hover:text-red-400 transition text-sm"
                  title="Remover dívida"
                >
                  ✕
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Nome</label>
                  <input
                    type="text"
                    value={divida.nome ?? 'Dívida'}
                    onChange={e => updateDivida(idx, 'nome', e.target.value)}
                    className="w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-2 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Parcela/mês</label>
                  <CurrencyInput
                    value={divida.parcela ?? 0}
                    onChange={v => updateDivida(idx, 'parcela', v)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Juros %</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={divida.juros ?? 0}
                      onChange={e => updateDivida(idx, 'juros', Number(e.target.value))}
                      className={inputClass}
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </div>
                </div>
              </div>
              {divida.parcela > 0 && divida.juros > 0 && (
                <div className="mt-4 text-xs text-amber-700/80 bg-amber-50 rounded-lg px-3 py-2">
                  🔥 Juros mensais: R$ {((divida.parcela * divida.juros) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          ))}
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
