import React from 'react'

const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function fmtBRL(v) {
  if (!v && v !== 0) return ''
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function parsePct(str) {
  const n = parseFloat(String(str || '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function fmtPercent(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}

function ValorCell({ value, bold, neg, highlight, italic, suffix }) {
  const v = Number(value) || 0
  const cls = `${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''}`
  let color
  if (highlight) color = 'text-white'
  else if (neg) color = v < 0 ? 'text-red-600' : 'text-emerald-600'
  else color = 'text-slate-700'
  const display = suffix ? fmtPercent(value) : fmtBRL(v)
  return <td className={`px-2 py-2 text-right text-xs ${cls} ${color}`}>{display}</td>
}

export default function StepDreFluxo({ data, back, restart, className }) {
  const canais = data.canais || []
  const dv = data.despesasVariaveis || { ads: {}, frete: {}, comissao: {} }
  const fixas = data.despesasFixas || []
  const financeiras = data.outros || []
  const pessoal = Number(data.pessoal?.total) || 0
  const receitasFinanceiras = data.receitasFinanceiras || []

  const receitaBruta = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => s + (Number(c.meses?.[m]) || 0), 0)
  )

  const receitasFinanceirasMes = Array(12).fill(0).map((_, m) =>
    receitasFinanceiras.reduce((s, f) => s + (Number((f.meses || [])[m]) || 0), 0)
  )

  const receitaBrutaTotal = receitaBruta.map((v, i) => v + receitasFinanceirasMes[i])

  const devolucoes = Array(12).fill(0).map((_, m) => Number((data.devolucao || [])[m]) || 0)

  const impostos = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(c.aliquota) / 100
      return s + v * pct
    }, 0)
  )

  const rol = receitaBrutaTotal.map((v, i) => v - devolucoes[i] - impostos[i])

  const cmv = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct((data.custos || {})[c.id]) / 100
      return s + v * pct
    }, 0)
  )

  const margemBruta = rol.map((v, i) => v - cmv[i])

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
    ads[m] + frete[m] + comissao[m] + despesasFixas[m] + despesasFinanceiras[m]
  )

  const resultado = rol.map((v, i) => v - totalDespesas[i])

  const margemContribuicao = margemBruta.map((v, i) => v - ads[i] - frete[i] - comissao[i])

  const totalDespesasVariaveis = Array(12).fill(0).map((_, m) => ads[m] + frete[m] + comissao[m])

  const fixasRows = fixas.map(f => ({
    label: f.nome || 'Despesa Fixa',
    values: Array(12).fill(0).map((_, m) => Number((f.meses || [])[m]) || 0),
    sub: true,
    expense: true,
  }))

  const ebitda = margemContribuicao.map((v, i) => v - despesasFixas[i])
  const lucroOperacional = ebitda.map((v, i) => v - despesasFinanceiras[i])

  const rows = [
    { label: 'ROB', values: receitaBrutaTotal, highlight: true },
    { label: 'Devoluções', values: devolucoes, sub: true, expense: true },
    { label: 'Impostos', values: impostos, sub: true, expense: true },
    { label: 'ROL', values: rol, highlight: true },
    { label: 'ROL% sobre ROB', values: rol.map((v, i) => receitaBrutaTotal[i] ? (v / receitaBrutaTotal[i]) * 100 : 0), sub: true, italic: true, suffix: '%' },
    { label: 'Custos', values: cmv, costTotal: true, expense: true },
    { label: 'CMV', values: cmv, sub: true, expense: true },
    { label: 'Margem Bruta', values: margemBruta, highlight: true, bold: true },
    { label: 'Margem Bruta % / ROL', values: margemBruta.map((v, i) => rol[i] ? (v / rol[i]) * 100 : 0), sub: true, italic: true, suffix: '%' },
    { label: 'Despesas Variáveis', values: totalDespesasVariaveis, group: true, bold: true, expense: true },
    { label: 'Ads', values: ads, sub: true, expense: true },
    { label: 'Frete', values: frete, sub: true, expense: true },
    { label: 'Comissão', values: comissao, sub: true, expense: true },
    { label: 'Margem de Contribuição', values: margemContribuicao, highlight: true, bold: true },
    { label: 'Margem de Contribuição % / ROL', values: margemContribuicao.map((v, i) => rol[i] ? (v / rol[i]) * 100 : 0), sub: true, italic: true, suffix: '%' },
    { label: 'Despesas Fixas', values: despesasFixas, group: true, bold: true, expense: true },
    ...fixasRows,
    { label: 'EBITDA', values: ebitda, highlight: true, bold: true },
    { label: 'EBITDA % / ROL', values: ebitda.map((v, i) => rol[i] ? (v / rol[i]) * 100 : 0), sub: true, italic: true, suffix: '%' },
    { label: 'Despesas Financeiras', values: despesasFinanceiras, sub: true, expense: true },
    { label: 'Lucro Operacional', values: lucroOperacional, highlight: true, bold: true },
    { label: 'Lucro Operacional % / ROL', values: lucroOperacional.map((v, i) => rol[i] ? (v / rol[i]) * 100 : 0), sub: true, italic: true, suffix: '%' },
    { label: 'Lucro Líquido', values: resultado, bold: true, neg: true },
  ]

  const totalRob = receitaBrutaTotal.reduce((s, v) => s + (Number(v) || 0), 0)
  const totalRol = rol.reduce((s, v) => s + (Number(v) || 0), 0)
  const totalMargemBruta = margemBruta.reduce((s, v) => s + (Number(v) || 0), 0)
  const totalMargemContribuicao = margemContribuicao.reduce((s, v) => s + (Number(v) || 0), 0)
  const totalEbitda = ebitda.reduce((s, v) => s + (Number(v) || 0), 0)
  const totalLucroOperacional = lucroOperacional.reduce((s, v) => s + (Number(v) || 0), 0)

  const computeTotal = (row) => {
    if (row.suffix === '%') {
      if (row.label === 'ROL% sobre ROB') return totalRob ? (totalRol / totalRob) * 100 : 0
      if (row.label === 'Margem Bruta % / ROL') return totalRol ? (totalMargemBruta / totalRol) * 100 : 0
      if (row.label === 'Margem de Contribuição % / ROL') return totalRol ? (totalMargemContribuicao / totalRol) * 100 : 0
      if (row.label === 'EBITDA % / ROL') return totalRol ? (totalEbitda / totalRol) * 100 : 0
      if (row.label === 'Lucro Operacional % / ROL') return totalRol ? (totalLucroOperacional / totalRol) * 100 : 0
      return 0
    }
    return row.values.reduce((s, v) => s + (Number(v) || 0), 0)
  }

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
              const total = computeTotal(row)
              if (row.header) {
                return (
                  <tr key={row.label} className="bg-blue-100">
                    <td className="px-3 py-2 text-xs font-bold text-blue-900 border-r border-blue-200" colSpan={14}>{row.label}</td>
                  </tr>
                )
              }
              if (row.costTotal || row.group) {
                return (
                  <tr key={row.label} className="border-t border-blue-200 bg-blue-100">
                    <td className="sticky left-0 bg-inherit z-10 px-3 py-2 text-xs font-bold text-blue-900 border-r border-blue-200">{row.label}</td>
                    {row.values.map((v, i) => (
                      <ValorCell key={i} value={row.expense ? -v : v} bold highlight={false} neg={false} italic={false} suffix={row.suffix} />
                    ))}
                    <td className="px-2 py-2 text-right text-xs font-bold text-blue-900 border-l border-blue-200/50">{row.suffix === '%' ? fmtPercent(total) : fmtBRL(row.expense ? -total : total)}</td>
                  </tr>
                )
              }
              return (
                <tr key={row.label} className={`border-t border-slate-200 ${row.highlight ? 'bg-blue-900 text-white' : idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'} ${row.bold && !row.highlight ? 'bg-blue-50/50' : ''}`}>
                  <td className={`sticky left-0 bg-inherit z-10 px-3 py-2 text-xs border-r border-slate-200 ${row.highlight ? 'font-bold text-white' : row.bold ? 'font-bold text-slate-900' : row.sub ? 'text-slate-500 pl-6' : 'font-semibold text-slate-700'} ${row.italic ? 'italic' : ''}`}>
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <ValorCell key={i} value={row.expense ? -v : v} bold={row.bold} neg={row.neg} highlight={row.highlight} italic={row.italic} suffix={row.suffix} />
                  ))}
                  <td className={`px-2 py-2 text-right text-xs border-l border-slate-200/50 ${row.highlight ? 'font-bold text-white' : row.bold ? 'font-bold text-slate-900' : 'text-slate-700'} ${row.italic ? 'italic' : ''}`}>
                    {row.suffix === '%' ? fmtPercent(total) : fmtBRL(row.expense ? -total : total)}
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
