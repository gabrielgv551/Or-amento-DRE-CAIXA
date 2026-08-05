import React, { useMemo, useState, useEffect } from 'react'
import { loadStorage, saveStorage } from '../utils/storage'

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0
  return Number(String(value).replace(',', '.').replace(/[^0-9.\-]/g, '')) || 0
}

function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1).replace('.', ',')}%`
}

export default function StepMargem({ className, back }) {
  const [state, setState] = useState(() => loadStorage('epfc_margem_state', {
    itemName: 'Item X',
    price: 120,
    margin: 30,
    quantity: 20,
    discount: 5,
    increase: 5,
    showTable: false,
  }))

  const { itemName, price, margin, quantity, discount, increase, showTable } = state

  useEffect(() => {
    saveStorage('epfc_margem_state', state)
  }, [state])

  const setField = (field, value) => setState(prev => ({ ...prev, [field]: value }))

  const results = useMemo(() => {
    const preco = parseNumber(price)
    const margem = parseNumber(margin)
    const qtd = Math.max(0, Math.floor(parseNumber(quantity)))
    const desc = parseNumber(discount)
    const inc = parseNumber(increase)

    const receitaAtual = preco * qtd
    const custoUnitario = preco * (1 - margem / 100)
    const lucroUnitario = preco - custoUnitario
    const lucroAtual = lucroUnitario * qtd

    const margemLiquida = receitaAtual > 0 ? (lucroAtual / receitaAtual) * 100 : 0
    const precoDesconto = preco * (1 - desc / 100)
    const precoAumento = preco * (1 + inc / 100)

    const qtdReceitaDesc = precoDesconto > 0 ? Math.ceil(receitaAtual / precoDesconto) : 0
    const qtdLucroDesc = precoDesconto > custoUnitario ? Math.ceil(lucroAtual / (precoDesconto - custoUnitario)) : null

    const qtdReceitaAum = precoAumento > 0 ? Math.ceil(receitaAtual / precoAumento) : 0
    const qtdLucroAum = precoAumento > custoUnitario ? Math.ceil(lucroAtual / (precoAumento - custoUnitario)) : null
    const menosParaReceita = qtd - qtdReceitaAum
    const menosParaLucro = qtdLucroAum !== null ? qtd - qtdLucroAum : null

    return {
      preco,
      margem,
      qtd,
      receitaAtual,
      custoUnitario,
      lucroUnitario,
      lucroAtual,
      margemLiquida,
      precoDesconto,
      precoAumento,
      qtdReceitaDesc,
      qtdLucroDesc,
      qtdReceitaAum,
      qtdLucroAum,
      menosParaReceita,
      menosParaLucro,
      desc,
      inc,
      pctDiffDesc: qtd > 0 && qtdLucroDesc !== null ? ((qtdLucroDesc - qtd) / qtd) * 100 : 0,
      pctDiffAum: qtd > 0 && qtdLucroAum !== null ? ((qtdLucroAum - qtd) / qtd) * 100 : 0,
    }
  }, [price, margin, quantity, discount, increase])

  const simulations = useMemo(() => {
    const preco = parseNumber(price)
    const margem = parseNumber(margin)
    const qtd = Math.max(0, Math.floor(parseNumber(quantity)))
    const custoUnitario = preco * (1 - margem / 100)
    const lucroUnitario = preco - custoUnitario
    const lucroAtual = lucroUnitario * qtd
    const receitaAtual = preco * qtd

    const maxDesconto = Math.min(100, margem)
    const descontos = []
    for (let i = 2; i <= maxDesconto; i += 2) {
      descontos.push(i)
    }
    
    return descontos.map(desc => {
      const precoComDesconto = preco * (1 - desc / 100)
      const qtdParaReceita = precoComDesconto > 0 ? Math.ceil(receitaAtual / precoComDesconto) : 0
      const qtdParaLucro = precoComDesconto > custoUnitario ? Math.ceil(lucroAtual / (precoComDesconto - custoUnitario)) : null

      return {
        desconto: desc,
        precoNovo: precoComDesconto,
        qtdReceita: qtdParaReceita,
        qtdLucro: qtdParaLucro,
        diferenca: qtdParaLucro !== null ? Math.abs(qtdParaLucro - qtd) : null,
      }
    })
  }, [price, margin, quantity])

  const simulationsAumento = useMemo(() => {
    const preco = parseNumber(price)
    const margem = parseNumber(margin)
    const qtd = Math.max(0, Math.floor(parseNumber(quantity)))
    const custoUnitario = preco * (1 - margem / 100)
    const lucroUnitario = preco - custoUnitario
    const lucroAtual = lucroUnitario * qtd
    const receitaAtual = preco * qtd

    const aumentos = []
    for (let i = 2; i <= 30; i += 2) {
      aumentos.push(i)
    }

    return aumentos.map(inc => {
      const precoComAumento = preco * (1 + inc / 100)
      const qtdParaReceita = precoComAumento > 0 ? Math.ceil(receitaAtual / precoComAumento) : 0
      const qtdParaLucro = precoComAumento > custoUnitario ? Math.ceil(lucroAtual / (precoComAumento - custoUnitario)) : null

      return {
        aumento: inc,
        precoNovo: precoComAumento,
        qtdReceita: qtdParaReceita,
        qtdLucro: qtdParaLucro,
        diferenca: qtdParaLucro !== null ? Math.abs(qtdParaLucro - qtd) : null,
      }
    })
  }, [price, margin, quantity])

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      {!showTable ? (
        <>
      <div className="rounded-[28px] border-2 border-cyan-300 bg-white p-6 shadow-xl shadow-cyan-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-700 font-semibold">Simulador de Margens</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-cyan-700 tracking-tight">Jogo do lucro</h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-700">Foque nas métricas mais importantes e visualize o impacto real do desconto e do preço.</p>
          </div>
          <div className="rounded-3xl bg-cyan-600 p-5 text-center shadow-lg shadow-cyan-900/10 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100 font-semibold">Lucro total</p>
            <p className="mt-3 text-4xl font-bold">{formatBRL(results.lucroAtual)}</p>
            <p className="text-sm text-cyan-100">{formatPercent(results.margemLiquida)} de margem</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border-2 border-cyan-300 bg-white p-5 shadow-md shadow-cyan-900/5 hover:shadow-lg hover:shadow-cyan-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 mb-3 font-bold">Receita atual</p>
          <p className="text-3xl font-bold text-cyan-700">{formatBRL(results.receitaAtual)}</p>
          <p className="mt-2 text-sm font-medium text-cyan-600/80">{results.qtd} unidades</p>
        </div>
        <div className="rounded-[28px] border-2 border-emerald-300 bg-white p-5 shadow-md shadow-emerald-900/5 hover:shadow-lg hover:shadow-emerald-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-700 mb-3 font-bold">Lucro</p>
          <p className="text-3xl font-bold text-emerald-700">{formatBRL(results.lucroAtual)}</p>
          <p className="mt-2 text-sm font-medium text-emerald-600/80">{formatBRL(results.lucroUnitario)} por item</p>
        </div>
        <div className="rounded-[28px] border-2 border-amber-300 bg-white p-5 shadow-md shadow-amber-900/5 hover:shadow-lg hover:shadow-amber-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700 mb-3 font-bold">Margem</p>
          <p className="text-3xl font-bold text-amber-700">{formatPercent(results.margemLiquida)}</p>
          <p className="mt-2 text-sm font-medium text-amber-600/80">Custo: {formatBRL(results.custoUnitario)}</p>
        </div>
        <div className="rounded-[28px] border-2 border-violet-300 bg-white p-5 shadow-md shadow-violet-900/5 hover:shadow-lg hover:shadow-violet-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-700 mb-3 font-bold">Ajustes</p>
          <p className="text-3xl font-bold text-violet-700">{formatPercent(results.desc)} ↓</p>
          <p className="mt-1 text-3xl font-bold text-violet-600">{formatPercent(results.inc)} ↑</p>
        </div>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Nome do produto', value: itemName, field: 'itemName', type: 'text', placeholder: 'Item X' },
          { label: 'Preço unitário', value: price, field: 'price', type: 'number', step: '0.01', placeholder: '120' },
          { label: 'Margem (%)', value: margin, field: 'margin', type: 'number', step: '0.1', placeholder: '30' },
        ].map(({ label, value, field, type, step, placeholder }) => (
          <label key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:bg-slate-50 hover:shadow-lg hover:shadow-cyan-500/5">
            <span className="text-xs uppercase tracking-[0.32em] text-slate-700 font-semibold">{label}</span>
            <input
              type={type}
              step={step}
              min="0"
              value={value}
              placeholder={placeholder}
              onChange={(e) => setField(field, e.target.value)}
              className="mt-4 w-full bg-white border border-slate-300 rounded-3xl px-4 py-4 text-slate-900 text-lg outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:bg-white"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 mt-4 lg:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Quantidade atual', value: quantity, field: 'quantity', type: 'number', step: '1', placeholder: '20' },
          { label: 'Desconto (%)', value: discount, field: 'discount', type: 'number', step: '0.1', placeholder: '5' },
          { label: 'Aumento (%)', value: increase, field: 'increase', type: 'number', step: '0.1', placeholder: '5' },
        ].map(({ label, value, field, type, step, placeholder }) => (
          <label key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:bg-slate-50 hover:shadow-lg hover:shadow-cyan-500/5">
            <span className="text-xs uppercase tracking-[0.32em] text-slate-700 font-semibold">{label}</span>
            <input
              type={type}
              step={step}
              min="0"
              value={value}
              placeholder={placeholder}
              onChange={(e) => setField(field, e.target.value)}
              className="mt-4 w-full bg-white border border-slate-300 rounded-3xl px-4 py-4 text-slate-900 text-lg outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:bg-white"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 rounded-[36px] border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 shadow-2xl shadow-amber-500/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-700/80 font-semibold">Impacto do desconto</p>
            <h3 className="mt-3 text-2xl font-bold text-amber-700">Receber mais com desconto</h3>
          </div>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-amber-700 font-semibold border border-amber-200">{formatPercent(results.desc)}</span>
        </div>
        <div className="mt-5 text-sm text-amber-800/80 space-y-3">
          <p>Preço com desconto: <strong className="text-amber-900">{formatBRL(results.precoDesconto)}</strong></p>
          <p>Manter receita: <strong className="text-amber-900">{results.qtdReceitaDesc} unidades</strong></p>
          <p>Manter lucro: <strong className={`text-amber-900 ${results.qtdLucroDesc === null ? 'text-amber-700' : ''}`}>
            {results.qtdLucroDesc === null ? 'não é possível' : `${results.qtdLucroDesc} unidades`}
          </strong></p>
          {results.qtdLucroDesc !== null && (
            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">Diferença:</span>
              <div className={`flex items-center gap-2 text-lg font-bold ${results.qtdLucroDesc > results.qtd ? 'text-red-600' : 'text-emerald-600'}`}>
                <span>{Math.abs(results.qtdLucroDesc - results.qtd)} unidades</span>
                <span>{results.qtdLucroDesc > results.qtd ? '↑' : '↓'}</span>
                <span className="text-sm font-semibold opacity-90">
                  ({formatPercent(Math.abs(results.pctDiffDesc))} {results.pctDiffDesc > 0 ? 'a mais' : 'a menos'})
                </span>
              </div>
            </div>
          )}
          <div className="rounded-3xl bg-amber-50 p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-700/70 font-semibold">Novo preço</span>
              <span className="text-sm font-bold text-amber-700">{formatBRL(results.precoDesconto)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-amber-700/70 font-semibold">Redução</span>
              <span className="text-sm font-bold text-amber-700">{formatPercent(results.desc)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[36px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 shadow-2xl shadow-emerald-500/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-700/80 font-semibold">Impacto do aumento</p>
            <h3 className="mt-3 text-2xl font-bold text-emerald-700">Menos volume, mais valor</h3>
          </div>
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs uppercase tracking-[0.24em] text-emerald-700 font-semibold border border-emerald-200">{formatPercent(results.inc)}</span>
        </div>
        <div className="mt-5 text-sm text-emerald-800/80 space-y-3">
          <p>Preço com aumento: <strong className="text-emerald-900">{formatBRL(results.precoAumento)}</strong></p>
          <p>Manter receita: <strong className="text-emerald-900">{results.qtdReceitaAum} unidades</strong></p>
          <p>Vender a menos: <strong className="text-emerald-900">{results.menosParaReceita} unidades</strong></p>
          <p>Manter lucro: <strong className={`text-emerald-900 ${results.qtdLucroAum === null ? 'text-emerald-700' : ''}`}>
            {results.qtdLucroAum === null ? 'não é possível' : `${results.qtdLucroAum} unidades`}
          </strong></p>
          {results.qtdLucroAum !== null && (
            <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">Diferença:</span>
              <div className={`flex items-center gap-2 text-lg font-bold ${results.qtdLucroAum > results.qtd ? 'text-red-600' : 'text-emerald-600'}`}>
                <span>{Math.abs(results.qtdLucroAum - results.qtd)} unidades</span>
                <span>{results.qtdLucroAum > results.qtd ? '↑' : '↓'}</span>
                <span className="text-sm font-semibold opacity-90">
                  ({formatPercent(Math.abs(results.pctDiffAum))} {results.pctDiffAum > 0 ? 'a mais' : 'a menos'})
                </span>
              </div>
            </div>
          )}
          <div className="rounded-3xl bg-emerald-50 p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-700/70 font-semibold">Novo preço</span>
              <span className="text-sm font-bold text-emerald-700">{formatBRL(results.precoAumento)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700/70 font-semibold">Aumento</span>
              <span className="text-sm font-bold text-emerald-700">{formatPercent(results.inc)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6 sm:flex-row">
        <button
          onClick={back}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
        >
          ← Voltar
        </button>
        <button
          onClick={() => setField('showTable', true)}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/20 hover:brightness-110 transition"
        >
          📊 Ver Simulações
        </button>
        <button
          onClick={() => {
            setState({
              itemName: 'Item X',
              price: 120,
              margin: 30,
              quantity: 20,
              discount: 5,
              increase: 5,
              showTable: false,
            })
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
        >
          Reiniciar simulação
        </button>
      </div>
        </>
      ) : (
        <div>
          <div className="rounded-[28px] border border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-100/50 p-6 shadow-[0_40px_100px_-40px_rgba(139,92,246,0.15)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-violet-700/70 font-semibold">Simulações automáticas</p>
                <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent tracking-tight">Tabela de Descontos</h2>
                <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-700">Veja como diferentes descontos afetam sua margem de {parseNumber(margin)}%.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-violet-200 bg-white p-6 overflow-x-auto shadow-lg shadow-violet-500/5">
            <h3 className="text-lg font-bold text-violet-700 mb-4">Tabela de Descontos — Mesmo lucro</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-500 bg-blue-600 text-white">
                  <th className="text-left py-3 px-4 font-semibold">Desconto</th>
                  <th className="text-left py-3 px-4 font-semibold">Preço novo</th>
                  <th className="text-left py-3 px-4 font-semibold">Qtd atual</th>
                  <th className="text-left py-3 px-4 font-semibold">Qtd p/ mesma receita</th>
                  <th className="text-left py-3 px-4 font-semibold">Qtd p/ mesmo lucro</th>
                  <th className="text-left py-3 px-4 font-semibold">Vender a mais</th>
                  <th className="text-left py-3 px-4 font-semibold">Lucro mantido</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-violet-700 font-semibold">{sim.desconto}%</td>
                    <td className="py-3 px-4 text-cyan-700">{formatBRL(sim.precoNovo)}</td>
                    <td className="py-3 px-4 text-slate-700">{results.qtd}</td>
                    <td className="py-3 px-4 text-emerald-700">{sim.qtdReceita}</td>
                    <td className="py-3 px-4 text-amber-700">{sim.qtdLucro === null ? '❌ Impossível' : sim.qtdLucro}</td>
                    <td className="py-3 px-4">
                      {sim.diferenca !== null ? (
                        <span className="font-bold text-red-600">↑ {sim.diferenca}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">{formatBRL(results.lucroAtual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-[28px] border border-emerald-200 bg-white p-6 overflow-x-auto shadow-lg shadow-emerald-500/5">
            <h3 className="text-lg font-bold text-emerald-700 mb-4">Tabela de Aumento de Preço — Mesmo lucro</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-500 bg-blue-600 text-white">
                  <th className="text-left py-3 px-4 font-semibold">Aumento</th>
                  <th className="text-left py-3 px-4 font-semibold">Preço novo</th>
                  <th className="text-left py-3 px-4 font-semibold">Qtd atual</th>
                  <th className="text-left py-3 px-4 font-semibold">Qtd p/ mesma receita</th>
                  <th className="text-left py-3 px-4 font-semibold">Qtd p/ mesmo lucro</th>
                  <th className="text-left py-3 px-4 font-semibold">Pode vender a menos</th>
                  <th className="text-left py-3 px-4 font-semibold">Lucro mantido</th>
                </tr>
              </thead>
              <tbody>
                {simulationsAumento.map((sim, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-emerald-700 font-semibold">{sim.aumento}%</td>
                    <td className="py-3 px-4 text-cyan-700">{formatBRL(sim.precoNovo)}</td>
                    <td className="py-3 px-4 text-slate-700">{results.qtd}</td>
                    <td className="py-3 px-4 text-emerald-700">{sim.qtdReceita}</td>
                    <td className="py-3 px-4 text-amber-700">{sim.qtdLucro === null ? '❌ Impossível' : sim.qtdLucro}</td>
                    <td className="py-3 px-4">
                      {sim.diferenca !== null ? (
                        <span className="font-bold text-emerald-600">↓ {sim.diferenca}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">{formatBRL(results.lucroAtual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 mt-6 sm:flex-row">
            <button
              onClick={() => setField('showTable', false)}
              className="w-full sm:w-auto px-6 py-3 rounded-3xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
            >
              ← Voltar ao simulador
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
