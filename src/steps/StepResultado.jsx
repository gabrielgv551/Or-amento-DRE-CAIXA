import React, { useMemo, useState } from 'react'
import { gerarFluxoDiario, brl, FERIADOS_BR } from '../utils/gerarFluxo'
import { exportarExcel } from '../utils/exportarExcel'

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function compactNum(v) {
  const n = Number(v) || 0
  if (n === 0) return null
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(0)}k`
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function NumCell({ value, bold, saldo, onDark, numColor }) {
  const display = compactNum(value)
  if (!display) return <span className={`text-[10px] select-none ${onDark ? 'text-white/20' : 'text-slate-200'}`}>·</span>
  const neg = value < 0
  let color
  if (numColor === 'green') color = neg ? 'text-red-500' : 'text-emerald-600'
  else if (numColor === 'red') color = 'text-red-500'
  else color = onDark
    ? (neg ? 'text-red-300' : saldo ? 'text-emerald-300' : 'text-slate-100')
    : (neg ? 'text-red-600' : saldo ? 'text-emerald-700' : 'text-slate-700')
  return <span className={`text-[11px] tabular-nums ${bold ? 'font-semibold' : ''} ${color}`}>{display}</span>
}

export default function StepResultado({ data, back, restart, className }) {
  const hoje     = new Date()
  const mesBase  = hoje.getMonth()
  const anoBase  = hoje.getFullYear()
  const [offset, setOffset] = useState(0)  // 0=atual, 1=próximo, 2=+2
  const mesSel = (mesBase + offset) % 12
  const anoSel = anoBase + Math.floor((mesBase + offset) / 12)

  const saldoInicialSel = useMemo(() => {
    let saldo = Number(data.saldoInicial) || 0
    for (let o = 0; o < offset; o++) {
      const m = (mesBase + o) % 12
      const a = anoBase + Math.floor((mesBase + o) / 12)
      const { dias: d } = gerarFluxoDiario({ ...data, saldoInicial: saldo }, { targetMes: m, targetAno: a })
      saldo = d[d.length - 1]?.saldoAcumulado || 0
    }
    return saldo
  }, [data, offset, mesBase, anoBase])

  const { dias, diasNoMes, mes, ano } = useMemo(
    () => gerarFluxoDiario({ ...data, saldoInicial: saldoInicialSel }, { targetMes: mesSel, targetAno: anoSel }),
    [data, mesSel, anoSel, saldoInicialSel]
  )

  const saldoFinal    = dias[dias.length - 1]?.saldoAcumulado || 0
  const diasNegativos = dias.filter(d => d.saldoAcumulado < 0).length
  const totalEntradas = dias.reduce((s, d) => s + d.totalEntradas + (d.totalEntNaoOp || 0), 0)
  const totalSaidas   = dias.reduce((s, d) => s + d.totalSaidas + (d.totalSaidNaoOp || 0), 0)

  const veredicto = saldoFinal >= 0
    ? { emoji: '🎉', cor: 'text-emerald-400', texto: 'Caixa fecha POSITIVO!', bg: 'from-emerald-900/40 to-emerald-900/10 border-emerald-700/40' }
    : { emoji: '🚨', cor: 'text-red-400',     texto: 'Caixa fecha NEGATIVO. Hora de agir!', bg: 'from-red-900/40 to-red-900/10 border-red-700/40' }

  const entCats = useMemo(() => {
    const map = new Map()
    dias.forEach(d => d.entradas.forEach(e => {
      if (!map.has(e.descricao)) map.set(e.descricao, Array(diasNoMes).fill(0))
      map.get(e.descricao)[d.dia - 1] += e.valor
    }))
    return [...map.entries()].map(([label, values]) => ({ label, values }))
  }, [dias, diasNoMes])

  const saidCats = useMemo(() => {
    const map = new Map()
    dias.forEach(d => d.saidas.forEach(s => {
      if (!map.has(s.descricao)) map.set(s.descricao, Array(diasNoMes).fill(0))
      map.get(s.descricao)[d.dia - 1] += s.valor
    }))
    return [...map.entries()].map(([label, values]) => ({ label, values }))
  }, [dias, diasNoMes])

  const naoEntCats = useMemo(() => {
    const map = new Map()
    dias.forEach(d => (d.entradasNaoOp || []).forEach(e => {
      if (!map.has(e.descricao)) map.set(e.descricao, Array(diasNoMes).fill(0))
      map.get(e.descricao)[d.dia - 1] += e.valor
    }))
    return [...map.entries()].map(([label, values]) => ({ label, values }))
  }, [dias, diasNoMes])

  const naoSaidCats = useMemo(() => {
    const map = new Map()
    dias.forEach(d => (d.saidasNaoOp || []).forEach(s => {
      if (!map.has(s.descricao)) map.set(s.descricao, Array(diasNoMes).fill(0))
      map.get(s.descricao)[d.dia - 1] += s.valor
    }))
    return [...map.entries()].map(([label, values]) => ({ label, values }))
  }, [dias, diasNoMes])

  const dayNums = Array.from({ length: diasNoMes }, (_, i) => i + 1)
  const isNonWorking = (day) => {
    const d = new Date(ano, mes, day)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) return true
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return FERIADOS_BR.has(key)
  }

  const rows = [
    { kind: 'saldo-top', label: 'SALDO INICIAL DO CAIXA',
      values: dias.map(d => d.saldoInicialDia),
      total: saldoInicialSel },
    { kind: 'saldo-top', label: 'SALDO FINAL',
      values: dias.map(d => d.saldoAcumulado), isSaldo: true,
      total: saldoFinal },
    { kind: 'spacer' },
    { kind: 'header',    label: 'ATIVIDADES OPERACIONAIS' },
    { kind: 'subheader', label: 'ENTRADAS', values: dias.map(d => d.totalEntradas) },
    ...entCats.map(({ label, values }) => ({ kind: 'item', label, values, numColor: 'green' })),
    { kind: 'subheader', label: 'SAÍDAS', values: dias.map(d => d.totalSaidas) },
    ...saidCats.map(({ label, values }) => ({ kind: 'item', label, values, numColor: 'red' })),
    { kind: 'subheader', label: 'TOTAL OPERACIONAL', values: dias.map(d => d.totalEntradas - d.totalSaidas) },
    { kind: 'spacer' },
    { kind: 'header',    label: 'ATIVIDADES NÃO OPERACIONAIS' },
    { kind: 'subheader', label: 'ENTRADAS', values: dias.map(d => d.totalEntNaoOp || 0) },
    ...naoEntCats.map(({ label, values }) => ({ kind: 'item', label, values, numColor: 'green' })),
    { kind: 'subheader', label: 'SAÍDAS', values: dias.map(d => d.totalSaidNaoOp || 0) },
    ...naoSaidCats.map(({ label, values }) => ({ kind: 'item', label, values, numColor: 'red' })),
    { kind: 'subheader', label: 'TOTAL NÃO OPERACIONAL', values: dias.map(d => (d.totalEntNaoOp || 0) - (d.totalSaidNaoOp || 0)) },
    { kind: 'saldo-dia', label: 'SALDO DO DIA',   values: dias.map(d => d.saldoDia), isSaldo: true },
  ]

  // ── row style maps ─────────────────────────────────────────────────────────
  const NAVY = '#1e3a5f'
  const rowCfg = {
    'saldo-top': { bg: 'bg-[#1e3a5f]',  sticky: 'bg-[#1e3a5f]',  dark: true,  indent: false, bold: true  },
    'header':    { bg: 'bg-[#1e3a5f]',  sticky: 'bg-[#1e3a5f]',  dark: true,  indent: false, bold: true  },
    'subheader': { bg: 'bg-[#2e5597]',  sticky: 'bg-[#2e5597]',  dark: true,  indent: false, bold: true  },
    'item':      { bg: 'bg-white',       sticky: 'bg-white',       dark: false, indent: true,  bold: false },

    'saldo-dia': { bg: 'bg-[#1e3a5f]',  sticky: 'bg-[#1e3a5f]',  dark: true,  indent: false, bold: true  },
  }

  return (
    <div className={`w-full max-w-[100vw] min-h-screen bg-[#f1f5f9] ${className}`}>

      {/* ── 1. HEADER CARD ────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-6 pb-0">
        <div className="bg-[#1e3a5f] rounded-2xl px-5 py-4 shadow-lg text-white">
          <div className="flex items-center justify-between">

            {/* Left: label */}
            <div className="hidden sm:block">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Fluxo de Caixa</p>
              <p className="text-xs text-slate-300 font-semibold">Projeção Diária</p>
            </div>

            {/* Center: month nav */}
            <div className="flex items-center gap-3 mx-auto sm:mx-0">
              <button onClick={() => setOffset(o => o - 1)} disabled={offset === 0}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition flex items-center justify-center text-lg font-bold">
                ‹
              </button>
              <div className="text-center min-w-[140px]">
                <p className="text-lg font-bold tracking-tight">{MESES_PT[mes]}</p>
                <p className="text-xs text-slate-400">{ano}</p>
              </div>
              <button onClick={() => setOffset(o => o + 1)} disabled={offset === 2}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition flex items-center justify-center text-lg font-bold">
                ›
              </button>
            </div>

            {/* Right: verdict badge */}
            <div className="hidden sm:flex justify-end w-28">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                saldoFinal >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
              }`}>
                {saldoFinal >= 0 ? '✓ Positivo' : '✕ Negativo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. METRIC CARDS ───────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Saldo Inicial',  value: brl(saldoInicialSel), accent: 'border-slate-300',   valColor: 'text-slate-700' },
            { label: 'Total Entradas', value: brl(totalEntradas),     accent: 'border-emerald-400', valColor: 'text-emerald-700' },
            { label: 'Total Saídas',   value: brl(totalSaidas),       accent: 'border-red-400',     valColor: 'text-red-600' },
            { label: 'Saldo Final',    value: brl(saldoFinal),        accent: saldoFinal >= 0 ? 'border-emerald-500' : 'border-red-500',
              valColor: saldoFinal >= 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold' },
          ].map(({ label, value, accent, valColor }) => (
            <div key={label} className={`bg-white rounded-xl shadow-sm px-4 py-3 border-l-4 ${accent}`}>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-sm font-semibold ${valColor}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. ALERTA (condicional) ────────────────────────────────────────── */}
      {diasNegativos > 0 && (
        <div className="px-4 sm:px-6 mt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-amber-500 text-base mt-0.5">⚠️</span>
            <p className="text-amber-700 text-sm">
              Em <strong>{diasNegativos} dia{diasNegativos > 1 ? 's' : ''}</strong> o saldo acumulado ficará negativo.
              Considere antecipar recebíveis ou renegociar vencimentos.
            </p>
          </div>
        </div>
      )}

      {/* ── 4. TABELA CARD ────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 mt-4">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: NAVY }}>
                  <th className="sticky left-0 z-20 text-left px-4 py-3 text-[11px] font-bold text-white min-w-[190px] border-r border-white/10 whitespace-nowrap uppercase tracking-wider"
                    style={{ backgroundColor: NAVY }}>
                    Categoria
                  </th>
                  {dayNums.map(d => (
                    <th key={d}
                      style={{ backgroundColor: isNonWorking(d) ? '#2e4f8a' : NAVY }}
                      className={`px-0 py-3 text-[11px] font-semibold min-w-[42px] text-center border-r border-white/10
                        ${isNonWorking(d) ? 'text-white/35' : 'text-slate-300'}`}>
                      {d}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-[11px] font-bold text-blue-200 min-w-[80px] border-l border-white/20 text-right pr-4 whitespace-nowrap uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const cfg = rowCfg[row.kind] || rowCfg['item']

                  if (row.kind === 'spacer') {
                    return (
                      <tr key={ri}>
                        <td colSpan={diasNoMes + 2} className="h-3 bg-[#f1f5f9]" />
                      </tr>
                    )
                  }

                  if (row.kind === 'header') {
                    return (
                      <tr key={ri} style={{ backgroundColor: NAVY }}>
                        <td colSpan={diasNoMes + 2}
                          className="sticky left-0 z-10 px-4 py-2 text-[11px] font-bold text-white/70 uppercase tracking-widest"
                          style={{ backgroundColor: NAVY }}>
                          {row.label}
                        </td>
                      </tr>
                    )
                  }

                  if (row.kind === 'subheader') {
                    const subBg = '#2e5597'
                    if (!row.values) {
                      return (
                        <tr key={ri} style={{ backgroundColor: subBg }}>
                          <td colSpan={diasNoMes + 2} className="sticky left-0 z-10 px-4 py-2 text-[11px] font-bold text-white uppercase tracking-wide"
                            style={{ backgroundColor: subBg }}>
                            {row.label}
                          </td>
                        </tr>
                      )
                    }
                    const subTotal = (row.values || []).reduce((s, v) => s + (Number(v) || 0), 0)
                    return (
                      <tr key={ri} style={{ backgroundColor: subBg }}>
                        <td className="sticky left-0 z-10 px-4 py-2 text-[11px] font-bold text-white uppercase tracking-wide border-r border-white/10"
                          style={{ backgroundColor: subBg }}>
                          {row.label}
                        </td>
                        {dayNums.map(d => {
                          const val = row.values[d - 1] || 0
                          return (
                            <td key={d} className="px-0.5 py-2 text-center border-r border-white/10"
                              style={{ backgroundColor: isNonWorking(d) ? '#2e4f8a' : subBg }}>
                              <NumCell value={val} bold onDark />
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-right pr-4 border-l border-white/10"
                          style={{ backgroundColor: subBg }}>
                          <NumCell value={subTotal} bold onDark />
                        </td>
                      </tr>
                    )
                  }

                  const rowTotal = row.total !== undefined
                    ? row.total
                    : (row.values || []).reduce((s, v) => s + (Number(v) || 0), 0)

                  return (
                    <tr key={ri} className={`${cfg.bg} border-t border-slate-100 hover:brightness-[0.97] transition-all`}>
                      <td className={`sticky left-0 z-10 px-4 py-2 text-[11px] whitespace-nowrap border-r border-slate-100
                        ${cfg.dark ? 'text-slate-100 font-semibold' : cfg.bold ? 'text-slate-800 font-semibold' : 'text-slate-500'}
                        ${cfg.indent ? 'pl-7' : ''} ${cfg.sticky}`}>
                        {row.label}
                      </td>
                      {dayNums.map(d => {
                        const val = (row.values || [])[d - 1] || 0
                        return (
                          <td key={d}
                            className="px-0.5 py-2 text-center border-r border-slate-100/60"
                            style={{ backgroundColor: isNonWorking(d) ? (cfg.dark ? '#2e4f8a' : '#dbeafe') : undefined }}>
                            <NumCell value={val} bold={cfg.bold} saldo={row.isSaldo} onDark={cfg.dark} numColor={row.numColor} />
                          </td>
                        )
                      })}
                      <td className={`px-3 py-2 text-right pr-4 border-l border-slate-200 ${cfg.dark ? cfg.bg : 'bg-slate-50'}`}>
                        <NumCell value={rowTotal} bold={cfg.bold} saldo={row.isSaldo} onDark={cfg.dark} numColor={row.numColor} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 5. FOOTER ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 mt-4 pb-10">
        <div className="flex gap-3 items-center justify-between flex-wrap">
          <div className="flex gap-4 text-[11px] text-slate-400">
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-1 align-middle"></span>Positivo</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500 mr-1 align-middle"></span>Negativo</span>
            <span className="hidden sm:inline"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-200 mr-1 align-middle"></span>Fim de semana</span>
            <span className="hidden sm:inline text-slate-300">1k = R$ 1.000 · 1M = R$ 1.000.000</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={back}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition font-medium text-sm shadow-sm">
              ← Ajustar
            </button>
            <button onClick={() => exportarExcel(data)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-sm shadow-md shadow-emerald-600/30 flex items-center gap-2">
              ⬇️ Baixar Excel
            </button>
            <button onClick={restart}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition text-sm shadow-md shadow-blue-500/30">
              🔄 Recomeçar
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
