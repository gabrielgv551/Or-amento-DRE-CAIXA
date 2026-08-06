import React from 'react'

const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function fmtBRL(v) {
  if (!v && v !== 0) return ''
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parsePct(str) {
  const n = parseFloat(String(str || '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function ValorCell({ value, bold, neg }) {
  const v = Number(value) || 0
  const cls = bold ? 'font-bold' : ''
  const color = neg ? (v < 0 ? 'text-red-600' : 'text-emerald-600') : 'text-slate-700'
  return <td className={`px-2 py-2 text-right text-xs ${cls} ${color}`}>{fmtBRL(v)}</td>
}

export default function StepDreFluxo({ data, back, restart, className }) {
  const canais = data.canais || []
  const dv = data.despesasVariaveis || { ads: {}, frete: {}, comissao: {} }
  const fixas = data.despesasFixas || []
  const financeiras = data.outros || []
  const pessoal = Number(data.pessoal?.total) || 0

  const receitaBruta = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => s + (Number(c.meses?.[m]) || 0), 0)
  )

  const deducoes = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(c.deducao) / 100
      return s + v * pct
    }, 0)
  )

  const rol = receitaBruta.map((v, i) => v - deducoes[i])

  const ads = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(dv.ads?.[c.id]) / 100
      return s + v * pct
    }, 0)
  )

  const frete = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(dv.frete?.[c.id]) / 100
      return s + v * pct
    }, 0)
  )

  const comissao = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(dv.comissao?.[c.id]) / 100
      return s + v * pct
    }, 0)
  )

  const despesasFixas = Array(12).fill(0).map((_, m) =>
    fixas.reduce((s, f) => s + (Number((f.meses || [])[m]) || 0), 0)
  )

  const despesasFinanceiras = Array(12).fill(0).map((_, m) =>
    financeiras.reduce((s, f) => s + (Number((f.meses || [])[m]) || 0), 0)
  )

  const despesasPessoal = Array(12).fill(pessoal)

  const totalDespesas = Array(12).fill(0).map((_, m) =>
    ads[m] + frete[m] + comissao[m] + despesasFixas[m] + despesasFinanceiras[m] + despesasPessoal[m]
  )

  const resultado = rol.map((v, i) => v - totalDespesas[i])

  const margemContribuicao = rol.map((v, i) => v - ads[i] - frete[i] - comissao[i])

  const rows = [
    { label: 'Receita Bruta', values: receitaBruta },
    { label: 'Deduções dos canais', values: deducoes, sub: true },
    { label: 'ROL', values: rol, bold: true },
    { label: 'Despesas Variáveis', values: Array(12).fill(0), header: true },
    { label: 'Ads', values: ads, sub: true },
    { label: 'Frete', values: frete, sub: true },
    { label: 'Comissão', values: comissao, sub: true },
    { label: 'Margem de Contribuição', values: margemContribuicao, bold: true },
    { label: 'Despesas Fixas', values: despesasFixas, sub: true },
    { label: 'Despesas Financeiras', values: despesasFinanceiras, sub: true },
    { label: 'Pessoal', values: despesasPessoal, sub: true },
    { label: 'Total de Despesas', values: totalDespesas, bold: true },
    { label: 'Resultado', values: resultado, bold: true, neg: true },
  ]

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">📊</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">DRE</h2>
        <p className="text-slate-500 text-sm">Demonstração do Resultado mês a mês</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-blue-600 z-10 min-w-[200px] border-r border-blue-500">Descrição</th>
              {MESES_FULL.map((m, i) => (
                <th key={m} className={`text-center px-2 py-2.5 font-semibold min-w-[110px] ${i < 11 ? 'border-r border-blue-500' : ''}`}>{m.substring(0, 3)}</th>
              ))}
              <th className="text-center px-2 py-2.5 font-semibold min-w-[130px] border-l border-blue-500">Total Ano</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const total = row.values.reduce((s, v) => s + (Number(v) || 0), 0)
              if (row.header) {
                return (
                  <tr key={row.label} className="bg-slate-100">
                    <td className="px-3 py-2 text-xs font-bold text-slate-900 border-r border-slate-200" colSpan={14}>{row.label}</td>
                  </tr>
                )
              }
              return (
                <tr key={row.label} className={`border-t border-slate-200 ${idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'} ${row.bold ? 'bg-blue-50/50' : ''}`}>
                  <td className={`sticky left-0 bg-inherit z-10 px-3 py-2 text-xs border-r border-slate-200 ${row.bold ? 'font-bold text-slate-900' : row.sub ? 'text-slate-500 pl-6' : 'font-semibold text-slate-700'}`}>
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <ValorCell key={i} value={v} bold={row.bold} neg={row.neg} />
                  ))}
                  <td className={`px-2 py-2 text-right text-xs border-l border-slate-200/50 ${row.bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                    {fmtBRL(total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 mt-4 max-w-lg mx-auto">
        <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm">← Voltar</button>
        <button onClick={restart} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm">Novo orçamento</button>
      </div>
    </div>
  )
}
