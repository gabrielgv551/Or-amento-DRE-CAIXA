import React, { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { loadStorage, saveStorage } from '../utils/storage'

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0
  return Number(String(value).replace(',', '.').replace(/[^0-9.\-]/g, '')) || 0
}

function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1).replace('.', ',')}%`
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const emptySku = () => ({
  id: newId(),
  nome: 'SKU A',
  qtde: '',
  precoUnitario: '',
  impostosPct: 12,
  descontoPct: 0,
  cpvPct: 50,
  comissaoFretePct: 23,
  addPct: 1,
})

const initialSkusBase = [
  { nome: 'SKU A', qtde: 1000, precoUnitario: 150, impostosPct: 12, descontoPct: 0, cpvPct: 50, comissaoFretePct: 23, addPct: 1 },
  { nome: 'SKU B', qtde: 2200, precoUnitario: 114, impostosPct: 12, descontoPct: 0, cpvPct: 45, comissaoFretePct: 23, addPct: 1.5 },
  { nome: 'SKU C', qtde: 3000, precoUnitario: 67, impostosPct: 12, descontoPct: 0, cpvPct: 60, comissaoFretePct: 23, addPct: 3 },
]

const initialSkus = initialSkusBase.map((s) => ({ ...s, id: newId() }))
const initialSkus2 = initialSkusBase.map((s) => ({ ...s, id: newId() }))

function calcularLinhas(skus, baseCustoUnit = {}, calculaCpv = false) {
  return skus.map((sku) => {
    const qtde = parseNumber(sku.qtde)
    const preco = parseNumber(sku.precoUnitario)
    const impostosPct = parseNumber(sku.impostosPct)
    const descontoPct = parseNumber(sku.descontoPct)
    let cpvPct = parseNumber(sku.cpvPct)
    const comissaoFretePct = parseNumber(sku.comissaoFretePct)
    const addPct = parseNumber(sku.addPct)

    const novoUnit = preco * (1 - descontoPct / 100)
    const rob = qtde * novoUnit
    const impostos = rob * (impostosPct / 100)
    const desconto = qtde * (preco - novoUnit)
    const rol = rob - impostos
    const custoUnitCalculado = qtde > 0 ? (rob * (cpvPct / 100)) / qtde : 0
    const custoUnit = baseCustoUnit[sku.nome] !== undefined ? baseCustoUnit[sku.nome] : custoUnitCalculado

    if (calculaCpv && baseCustoUnit[sku.nome] !== undefined && novoUnit > 0) {
      cpvPct = (custoUnit / novoUnit) * 100
    }

    const cmv = -(custoUnit * qtde)
    const mb = rol + cmv
    const comissaoFrete = rob * (comissaoFretePct / 100)
    const add = rob * (addPct / 100)
    const mc = mb - comissaoFrete - add
    const mcPct = rol > 0 ? (mc / rol) * 100 : 0

    return {
      ...sku,
      qtde,
      preco,
      novoUnit,
      rob,
      impostos,
      desconto,
      rol,
      cmv,
      custoUnit,
      cpvPct,
      mb,
      comissaoFrete,
      add,
      mc,
      mcPct,
    }
  })
}

function calcularTotais(linhas) {
  const acc = linhas.reduce(
    (t, l) => ({
      rob: t.rob + l.rob,
      impostos: t.impostos + l.impostos,
      desconto: t.desconto + l.desconto,
      rol: t.rol + l.rol,
      cmv: t.cmv + l.cmv,
      mb: t.mb + l.mb,
      comissaoFrete: t.comissaoFrete + l.comissaoFrete,
      add: t.add + l.add,
      mc: t.mc + l.mc,
    }),
    { rob: 0, impostos: 0, desconto: 0, rol: 0, cmv: 0, mb: 0, comissaoFrete: 0, add: 0, mc: 0 }
  )
  return {
    ...acc,
    mcPct: acc.rol > 0 ? (acc.mc / acc.rol) * 100 : 0,
    rolPct: acc.rob > 0 ? (acc.rol / acc.rob) * 100 : 0,
    cmvPct: acc.rob > 0 ? (Math.abs(acc.cmv) / acc.rob) * 100 : 0,
    mbPct: acc.rob > 0 ? (acc.mb / acc.rob) * 100 : 0,
    mcPctRob: acc.rob > 0 ? (acc.mc / acc.rob) * 100 : 0,
  }
}

function variacao(p1, p2) {
  const diff = p2 - p1
  const pct = p1 !== 0 ? (diff / Math.abs(p1)) * 100 : 0
  return { diff, pct }
}

function formatVar(value) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatBRL(value)}`
}

function formatVarPct(value) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatPercent(value)}`
}

function ResumoDre({ totais1, totais2 }) {
  const rows = [
    { label: 'ROB', key: 'rob', color: 'text-cyan-700', bold: false },
    { label: '(-) Impostos', key: 'impostos', color: 'text-rose-600', bold: false },
    { label: '(-) Descontos', key: 'desconto', color: 'text-rose-600', bold: false },
    { label: '= ROL', key: 'rol', color: 'text-emerald-700', bold: true, bg: 'bg-emerald-50' },
    { label: '(-) CMV', key: 'cmv', color: 'text-orange-700', bold: false },
    { label: '= Margem Bruta', key: 'mb', color: 'text-amber-700', bold: true, bg: 'bg-amber-50' },
    { label: '(-) Comissão/Frete', key: 'comissaoFrete', color: 'text-rose-600', bold: false },
    { label: '(-) ADD', key: 'add', color: 'text-rose-600', bold: false },
    { label: '= Margem de Contribuição', key: 'mc', color: 'text-violet-700', bold: true, bg: 'bg-violet-50' },
  ]

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Resumo da DRE</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[360px]">
          <thead>
            <tr className="bg-blue-600 text-white text-xs uppercase tracking-wider">
              <th className="text-left py-2.5 px-2 font-semibold rounded-tl-lg">Item</th>
              <th className="text-right py-2.5 px-2 font-semibold">Período 1</th>
              <th className="text-right py-2.5 px-2 font-semibold">Período 2</th>
              <th className="text-right py-2.5 px-2 font-semibold rounded-tr-lg">Variação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const v1 = totais1[row.key] || 0
              const v2 = totais2[row.key] || 0
              const { diff, pct } = variacao(v1, v2)
              const labelClass = row.bold ? 'font-bold text-slate-800' : 'text-slate-500'
              const valueClass = row.bold ? `font-bold ${row.color}` : row.color
              const varColor = diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-400'
              return (
                <tr key={row.key} className={`border-b border-slate-100 last:border-0 ${row.bg || ''}`}>
                  <td className={`py-2.5 px-2 ${labelClass}`}>{row.label}</td>
                  <td className={`py-2.5 px-2 text-right ${valueClass}`}>{formatBRL(v1)}</td>
                  <td className={`py-2.5 px-2 text-right ${valueClass}`}>{formatBRL(v2)}</td>
                  <td className={`py-2.5 px-2 text-right ${varColor} font-medium`}>
                    <span>{formatVar(diff)}</span>
                    <span className="block text-[10px] opacity-80">{formatVarPct(pct)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const PIE_COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c', '#60a5fa']

function DonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + (d.mc || 0), 0)
  const chartData = data
    .filter((d) => d.mc > 0)
    .map((d) => ({
      name: d.nome,
      value: d.mc,
      pct: total > 0 ? (d.mc / total) * 100 : 0,
    }))

  if (chartData.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem dados positivos</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={90}
          outerRadius={130}
          paddingAngle={3}
          cornerRadius={8}
          labelLine={false}
          label={({ name, pct }) => `${formatPercent(pct)}`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name, props) => [formatBRL(value), props.payload.name]}
          labelFormatter={() => ''}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function Legend({ data }) {
  const total = data.reduce((sum, d) => sum + (d.mc || 0), 0)
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {data.map((d, idx) => {
        const pct = total > 0 ? (d.mc / total) * 100 : 0
        return (
          <div key={d.nome} className="flex items-center gap-2 text-sm text-slate-700">
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
            />
            <span className="font-medium">{d.nome}</span>
            <span className="text-slate-500 font-semibold">{formatPercent(pct)}</span>
          </div>
        )
      })}
    </div>
  )
}

function DreTable({ skus, setSkus, title, storageKey, baseCustoUnit = {}, calculaCpv = false }) {
  useEffect(() => {
    saveStorage(storageKey, skus)
  }, [skus, storageKey])

  const linhas = useMemo(() => calcularLinhas(skus, baseCustoUnit, calculaCpv), [skus, baseCustoUnit, calculaCpv])
  const totais = useMemo(() => calcularTotais(linhas), [linhas])

  const updateSku = (id, field, value) => {
    setSkus((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const addSku = () => {
    setSkus((prev) => [...prev, emptySku()])
  }

  const removeSku = (id) => {
    setSkus((prev) => prev.filter((s) => s.id !== id))
  }

  const reset = () => {
    const base = title === 'Período 2' ? initialSkus2 : initialSkus
    setSkus(base.map((s) => ({ ...s, id: newId() })))
  }

  const inputClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'
  const inputPctClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'

  return (
    <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 overflow-x-auto shadow-lg shadow-violet-500/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={addSku}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-semibold shadow-lg shadow-violet-500/20 hover:brightness-110 transition"
          >
            + SKU
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
          >
            Reiniciar
          </button>
        </div>
      </div>
      <table className="w-full text-sm min-w-[1200px]">
        <thead>
          <tr className="border-b border-blue-500 text-left bg-blue-600 text-white">
            <th className="py-3 px-2 font-semibold sticky left-0 bg-blue-600 z-10">SKU</th>
            <th className="py-3 px-2 font-semibold text-center">Qtde</th>
            <th className="py-3 px-2 font-semibold text-center">Unit</th>
            <th className="py-3 px-2 font-semibold text-center">Desc %</th>
            <th className="py-3 px-2 font-semibold text-center w-20">Novo Unit</th>
            <th className="py-3 px-2 font-semibold text-center">ROB</th>
            <th className="py-3 px-2 font-semibold text-center">Impostos %</th>
            <th className="py-3 px-2 font-semibold text-center">ROL</th>
            <th className="py-3 px-2 font-semibold text-center">CPV %</th>
            <th className="py-3 px-2 font-semibold text-center">Custo Unit</th>
            <th className="py-3 px-2 font-semibold text-center">CMV</th>
            <th className="py-3 px-2 font-semibold text-center">MB</th>
            <th className="py-3 px-2 font-semibold text-center">Comissão/Frete %</th>
            <th className="py-3 px-2 font-semibold text-center">Comissão/Frete</th>
            <th className="py-3 px-2 font-semibold text-center">ADD %</th>
            <th className="py-3 px-2 font-semibold text-center">ADD</th>
            <th className="py-3 px-2 font-semibold text-center">MC</th>
            <th className="py-3 px-2 font-semibold text-center">MC %</th>
            <th className="py-3 px-2 font-semibold text-center"></th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
              <td className="py-2 px-2 sticky left-0 bg-white z-10">
                <input
                  type="text"
                  value={l.nome}
                  onChange={(e) => updateSku(l.id, 'nome', e.target.value)}
                  className={inputClass}
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={l.qtde}
                  onChange={(e) => updateSku(l.id, 'qtde', e.target.value)}
                  className={inputClass}
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={l.preco}
                  onChange={(e) => updateSku(l.id, 'precoUnitario', e.target.value)}
                  className={inputClass}
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={l.descontoPct}
                  onChange={(e) => updateSku(l.id, 'descontoPct', e.target.value)}
                  className={inputPctClass}
                />
              </td>
              <td className="py-2 px-2 text-center text-emerald-600 font-medium text-xs">
                {formatBRL(l.novoUnit)}
              </td>
              <td className="py-2 px-2 text-center text-cyan-700 font-semibold">{formatBRL(l.rob)}</td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={l.impostosPct}
                  onChange={(e) => updateSku(l.id, 'impostosPct', e.target.value)}
                  className={inputPctClass}
                />
              </td>
              <td className="py-2 px-2 text-center text-emerald-700 font-semibold">{formatBRL(l.rol)}</td>
              <td className="py-2 px-2">
                {calculaCpv ? (
                  <div className="text-center text-orange-700 font-medium text-xs">{formatPercent(l.cpvPct)}</div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={l.cpvPct}
                    onChange={(e) => updateSku(l.id, 'cpvPct', e.target.value)}
                    className={inputPctClass}
                  />
                )}
              </td>
              <td className="py-2 px-2 text-center text-orange-600 text-xs">{formatBRL(l.custoUnit)}</td>
              <td className="py-2 px-2 text-center text-orange-700">{formatBRL(l.cmv)}</td>
              <td className="py-2 px-2 text-center text-amber-700 font-semibold">{formatBRL(l.mb)}</td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={l.comissaoFretePct}
                  onChange={(e) => updateSku(l.id, 'comissaoFretePct', e.target.value)}
                  className={inputPctClass}
                />
              </td>
              <td className="py-2 px-2 text-center text-rose-600">{formatBRL(l.comissaoFrete)}</td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={l.addPct}
                  onChange={(e) => updateSku(l.id, 'addPct', e.target.value)}
                  className={inputPctClass}
                />
              </td>
              <td className="py-2 px-2 text-center text-rose-600">{formatBRL(l.add)}</td>
              <td className="py-2 px-2 text-center text-violet-700 font-bold">{formatBRL(l.mc)}</td>
              <td className="py-2 px-2 text-center text-violet-700 font-bold">{formatPercent(l.mcPct)}</td>
              <td className="py-2 px-2 text-center">
                <button
                  onClick={() => removeSku(l.id)}
                  className="text-rose-400 hover:text-rose-600 transition text-lg leading-none"
                  title="Remover SKU"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
            <td className="py-3 px-2 sticky left-0 bg-slate-50 z-10 text-slate-800">TOTAL</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-cyan-700">{formatBRL(totais.rob)}</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-emerald-700">{formatBRL(totais.rol)}</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-orange-700">{formatBRL(totais.cmv)}</td>
            <td className="py-3 px-2 text-center text-amber-700">{formatBRL(totais.mb)}</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-rose-600">{formatBRL(totais.comissaoFrete)}</td>
            <td className="py-3 px-2 text-center text-slate-500">-</td>
            <td className="py-3 px-2 text-center text-rose-600">{formatBRL(totais.add)}</td>
            <td className="py-3 px-2 text-center text-violet-700">{formatBRL(totais.mc)}</td>
            <td className="py-3 px-2 text-center text-violet-700">{formatPercent(totais.mcPct)}</td>
            <td className="py-3 px-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function StepDre({ className, back, onGoToPmv }) {
  const [skus, setSkus] = useState(() => loadStorage('epfc_dre_skus', initialSkus))
  const [skus2, setSkus2] = useState(() => loadStorage('epfc_dre_skus_2', initialSkus2))

  const linhas = useMemo(() => calcularLinhas(skus), [skus])
  const totais = useMemo(() => calcularTotais(linhas), [linhas])

  const baseCustoUnit = useMemo(() => {
    return linhas.reduce((acc, l) => {
      acc[l.nome] = l.custoUnit
      return acc
    }, {})
  }, [linhas])

  const linhas2 = useMemo(() => calcularLinhas(skus2, baseCustoUnit), [skus2, baseCustoUnit])
  const totais2 = useMemo(() => calcularTotais(linhas2), [linhas2])

  const impactoData = useMemo(() => {
    const totalMc = totais.mc || 1
    return linhas.map((l) => ({
      nome: l.nome,
      mc: l.mc,
      pct: (l.mc / totalMc) * 100,
    }))
  }, [linhas, totais.mc])

  const exportarParaPmv = () => {
    const pmvSkus = skus.map((sku) => ({
      id: sku.id,
      nome: sku.nome,
    }))

    const valoresP1 = skus.reduce((acc, sku) => {
      const novoUnit = sku.precoUnitario * (1 - (sku.descontoPct ?? 0) / 100)
      acc[sku.id] = { qtde: sku.qtde, unit: sku.precoUnitario, novoUnit }
      return acc
    }, {})

    const percentuaisP1 = skus.reduce((acc, sku) => {
      acc[sku.id] = {
        impostosPct: sku.impostosPct,
        descontoPct: sku.descontoPct,
        cpvPct: sku.cpvPct,
        comissaoFretePct: sku.comissaoFretePct,
        addPct: sku.addPct,
      }
      return acc
    }, {})

    const valoresP2 = skus.reduce((acc, sku, idx) => {
      const sku2 = skus2[idx] || skus2.find((s) => s.nome === sku.nome) || {}
      const unit2 = sku2.precoUnitario ?? sku.precoUnitario
      const novoUnit2 = unit2 * (1 - (sku2.descontoPct ?? 0) / 100)
      acc[sku.id] = { qtde: sku2.qtde ?? 0, unit: unit2, novoUnit: novoUnit2 }
      return acc
    }, {})

    const percentuaisP2 = skus.reduce((acc, sku, idx) => {
      const sku2 = skus2[idx] || skus2.find((s) => s.nome === sku.nome) || {}
      acc[sku.id] = {
        impostosPct: sku2.impostosPct ?? sku.impostosPct,
        descontoPct: sku2.descontoPct ?? sku.descontoPct,
        cpvPct: sku2.cpvPct ?? sku.cpvPct,
        comissaoFretePct: sku2.comissaoFretePct ?? sku.comissaoFretePct,
        addPct: sku2.addPct ?? sku.addPct,
      }
      return acc
    }, {})

    const pmvPeriodos = [
      { id: 'p1', nome: 'Período 1', valores: valoresP1, percentuais: percentuaisP1 },
      { id: 'p2', nome: 'Período 2', valores: valoresP2, percentuais: percentuaisP2 },
    ]

    saveStorage('epfc_pmv_skus', pmvSkus)
    saveStorage('epfc_pmv_periodos', pmvPeriodos)
    saveStorage('epfc_pmv_periodoAtivo', 'p1')
    saveStorage('epfc_pmv_imported', true)
    if (typeof onGoToPmv === 'function') onGoToPmv()
  }

  return (
    <div className={`w-full max-w-[99vw] px-2 ${className}`}>
      <div className="rounded-[28px] border border-violet-300 bg-white p-6 shadow-xl shadow-violet-500/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-violet-700 font-semibold">DRE Gerencial</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-violet-700 tracking-tight">
              Impacto por SKU
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-600">
              Veja o que cada SKU impacta na margem de contribuição até chegar no resultado operacional.
            </p>
          </div>
          <div className="rounded-3xl bg-violet-600 p-5 text-center shadow-lg shadow-violet-500/20">
            <p className="text-xs uppercase tracking-[0.28em] text-violet-100 font-semibold">Margem de Contribuição</p>
            <p className="mt-3 text-4xl font-bold text-white">{formatBRL(totais.mc)}</p>
            <p className="text-sm text-violet-100">{formatPercent(totais.mcPct)} sobre a ROL</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border-2 border-cyan-300 bg-white p-5 shadow-md shadow-cyan-500/5 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 mb-2 font-bold">ROB total</p>
          <p className="text-3xl font-extrabold text-cyan-700">{formatBRL(totais.rob)}</p>
          <p className="mt-2 text-sm font-medium text-cyan-600/80">Receita operacional bruta</p>
        </div>
        <div className="rounded-[28px] border-2 border-emerald-300 bg-white p-5 shadow-md shadow-emerald-500/5 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-700 mb-2 font-bold">ROL total</p>
          <p className="text-3xl font-extrabold text-emerald-700">{formatBRL(totais.rol)}</p>
          <p className="mt-2 text-sm font-medium text-emerald-600/80">Receita líquida de impostos/descontos</p>
        </div>
        <div className="rounded-[28px] border-2 border-amber-300 bg-white p-5 shadow-md shadow-amber-500/5 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700 mb-2 font-bold">Margem bruta</p>
          <p className="text-3xl font-extrabold text-amber-700">{formatBRL(totais.mb)}</p>
          <p className="mt-2 text-sm font-medium text-amber-600/80">ROL - CMV</p>
        </div>
        <div className="rounded-[28px] border-2 border-violet-300 bg-white p-5 shadow-md shadow-violet-500/5 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-700 mb-2 font-bold">MC total</p>
          <p className="text-3xl font-extrabold text-violet-700">{formatBRL(totais.mc)}</p>
          <p className="mt-2 text-sm font-medium text-violet-600/80">Margem de contribuição</p>
        </div>
      </div>

      <DreTable skus={skus} setSkus={setSkus} title="Período 1" storageKey="epfc_dre_skus" />
      <DreTable skus={skus2} setSkus={setSkus2} title="Período 2" storageKey="epfc_dre_skus_2" baseCustoUnit={baseCustoUnit} calculaCpv />

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <ResumoDre totais1={totais} totais2={totais2} />

        <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-lg shadow-violet-500/5">
          <h3 className="text-lg font-bold text-violet-700 mb-2">Participação na MC</h3>
          <p className="text-sm text-slate-500 mb-4">Quanto cada SKU contribui para a margem total.</p>
          <div className="h-80">
            <DonutChart data={impactoData} />
          </div>
          <Legend data={impactoData} />
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6 sm:flex-row">
        <button
          onClick={back}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
        >
          ← Voltar
        </button>
        <button
          onClick={exportarParaPmv}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/20 hover:brightness-110 transition"
        >
          Ir para PMV →
        </button>
      </div>
    </div>
  )
}
