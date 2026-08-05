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
  impostosPct: 12,
  descontoPct: 0,
  cpvPct: 50,
  comissaoFretePct: 23,
  addPct: 1,
})

const initialSkus = [
  { id: 'sku-a', nome: 'SKU A', impostosPct: 12, descontoPct: 0, cpvPct: 50, comissaoFretePct: 23, addPct: 1 },
  { id: 'sku-b', nome: 'SKU B', impostosPct: 12, descontoPct: 0, cpvPct: 45, comissaoFretePct: 23, addPct: 1.5 },
  { id: 'sku-c', nome: 'SKU C', impostosPct: 12, descontoPct: 0, cpvPct: 60, comissaoFretePct: 23, addPct: 3 },
]

const valoresIniciais = {
  'sku-a': { qtde: 1000, unit: 150, novoUnit: 150 },
  'sku-b': { qtde: 2200, unit: 114, novoUnit: 114 },
  'sku-c': { qtde: 3000, unit: 67, novoUnit: 67 },
}

const percentuaisIniciais = {
  'sku-a': { impostosPct: 12, descontoPct: 0, cpvPct: 50, comissaoFretePct: 23, addPct: 1 },
  'sku-b': { impostosPct: 12, descontoPct: 0, cpvPct: 45, comissaoFretePct: 23, addPct: 1.5 },
  'sku-c': { impostosPct: 12, descontoPct: 0, cpvPct: 60, comissaoFretePct: 23, addPct: 3 },
}

const initialPeriodos = [
  { id: 'p1', nome: 'Período 1', valores: JSON.parse(JSON.stringify(valoresIniciais)), percentuais: JSON.parse(JSON.stringify(percentuaisIniciais)) },
  { id: 'p2', nome: 'Período 2', valores: JSON.parse(JSON.stringify(valoresIniciais)), percentuais: JSON.parse(JSON.stringify(percentuaisIniciais)) },
]

function normalizarPeriodos(skus, periodos) {
  if (!Array.isArray(periodos) || periodos.length === 0) return initialPeriodos
  return periodos.slice(0, 2).map((p) => {
    const valores = { ...(p.valores || {}) }
    const percentuais = { ...(p.percentuais || {}) }
    skus.forEach((sku) => {
      if (!valores[sku.id]) {
        valores[sku.id] = { qtde: 0, unit: 0, novoUnit: 0 }
      }
      if (valores[sku.id].novoUnit === undefined) {
        valores[sku.id].novoUnit = valores[sku.id].unit
      }
      if (!percentuais[sku.id]) {
        percentuais[sku.id] = {
          impostosPct: sku.impostosPct,
          descontoPct: sku.descontoPct,
          cpvPct: sku.cpvPct,
          comissaoFretePct: sku.comissaoFretePct,
          addPct: sku.addPct,
        }
      }
    })
    return { ...p, valores, percentuais }
  })
}

const colors = ['#22d3ee', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c']

function roundUpNice(value) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = magnitude / 2
  return Math.ceil(value / step) * step
}

function SimpleBarChart({ data, valueKey, labelKey, color = '#a78bfa' }) {
  const numericValues = data.map((d) => Number(d?.[valueKey]) || 0)
  const maxValue = Math.max(...numericValues.map(Math.abs), 1)
  const scaleMax = roundUpNice(maxValue)
  const scaleMin = 0
  return (
    <div className="flex items-end gap-4 h-full px-4 pb-2">
      {data.map((d, idx) => {
        const val = Number(d?.[valueKey]) || 0
        const scaleRange = scaleMax - scaleMin
        const rawPct = scaleRange > 0 ? ((Math.abs(val) - scaleMin) / scaleRange) * 100 : 100
        const pct = Math.max(Math.min(rawPct, 100), 0)
        const height = `${Math.max(pct, 5)}%`
        return (
          <div key={idx} className="flex-1 flex flex-col h-full min-h-0">
            <div className="flex-1 w-full flex flex-col justify-end min-h-0">
              <div className="mb-2 text-xs font-bold text-slate-700 text-center whitespace-nowrap">
                {formatBRL(val)}
              </div>
              <div
                style={{ height, backgroundColor: colors[idx % colors.length] || color }}
                className="w-full rounded-t-xl min-h-[28px] transition-all"
              />
            </div>
            <div className="text-xs text-slate-600 mt-2 text-center truncate max-w-full font-medium">{d[labelKey]}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function StepPmv({ className, back }) {
  const [skus, setSkus] = useState(() => loadStorage('epfc_pmv_skus', initialSkus))
  const [periodos, setPeriodos] = useState(() => {
    const savedSkus = loadStorage('epfc_pmv_skus', initialSkus)
    const saved = loadStorage('epfc_pmv_periodos', initialPeriodos)
    if (!Array.isArray(saved) || saved.length === 0) return initialPeriodos
    if (saved.length === 1) {
      const p2 = { ...saved[0], id: 'p2', nome: 'Período 2', valores: JSON.parse(JSON.stringify(saved[0].valores || {})) }
      return normalizarPeriodos(savedSkus, [saved[0], p2])
    }
    return normalizarPeriodos(savedSkus, [saved[0], saved[1]])
  })

  const [prazos, setPrazos] = useState(() => loadStorage('epfc_pmv_prazos', { pmr: 21, pmp: 30, coberturaEstoque: 40 }))

  useEffect(() => {
    saveStorage('epfc_pmv_prazos', prazos)
  }, [prazos])

  useEffect(() => {
    saveStorage('epfc_pmv_skus', skus)
  }, [skus])

  useEffect(() => {
    saveStorage('epfc_pmv_periodos', periodos)
  }, [periodos])

  useEffect(() => {
    if (loadStorage('epfc_pmv_imported', false)) {
      const importedSkus = loadStorage('epfc_pmv_skus', null)
      const importedPeriodos = loadStorage('epfc_pmv_periodos', null)
      if (importedSkus) setSkus(importedSkus)
      if (Array.isArray(importedPeriodos) && importedPeriodos.length > 0) {
        const p1 = importedPeriodos[0]
        const p2 = importedPeriodos.length > 1 ? importedPeriodos[1] : {
          ...p1,
          id: 'p2',
          nome: 'Período 2',
          valores: JSON.parse(JSON.stringify(p1.valores || {})),
        }
        setPeriodos(normalizarPeriodos(importedSkus || skus, [p1, p2]))
      }
      saveStorage('epfc_pmv_imported', false)
    }
  }, [skus])

  const calculaLinhaSku = (sku, valores, percentuais, custoUnitFixo = null) => {
    const pct = percentuais || sku
    const qtde = parseNumber(valores?.qtde ?? 0)
    const unit = parseNumber(valores?.unit ?? 0)
    const novoUnit = parseNumber(valores?.novoUnit ?? unit)
    const rob = qtde * novoUnit
    const impostosPct = parseNumber(pct?.impostosPct ?? sku?.impostosPct ?? 0)
    const comissaoFretePct = parseNumber(pct?.comissaoFretePct ?? sku?.comissaoFretePct ?? 0)
    const addPct = parseNumber(pct?.addPct ?? sku?.addPct ?? 0)
    const cpvPct = parseNumber(pct?.cpvPct ?? sku?.cpvPct ?? 0)
    const impostos = rob * (impostosPct / 100)
    const desconto = qtde * (unit - novoUnit)
    const rol = rob - impostos
    const custoUnit = custoUnitFixo !== null ? parseNumber(custoUnitFixo) : (rob * (cpvPct / 100)) / qtde
    const cmv = -(custoUnit * qtde)
    const mb = rol + cmv
    const comissaoFrete = rob * (comissaoFretePct / 100)
    const add = rob * (addPct / 100)
    const mc = mb - comissaoFrete - add
    const mcPct = rob > 0 ? (mc / rob) * 100 : 0
    return { sku, qtde, unit, novoUnit, rob, impostos, desconto, rol, cmv, mb, comissaoFrete, add, mc, mcPct }
  }

  const calcularTotais = (skuLinhas) => {
    const total = skuLinhas.reduce(
      (acc, l) => ({
        qtde: acc.qtde + l.qtde,
        rob: acc.rob + l.rob,
        rol: acc.rol + l.rol,
        cmv: acc.cmv + l.cmv,
        mb: acc.mb + l.mb,
        comissaoFrete: acc.comissaoFrete + l.comissaoFrete,
        add: acc.add + l.add,
        mc: acc.mc + l.mc,
      }),
      { qtde: 0, rob: 0, rol: 0, cmv: 0, mb: 0, comissaoFrete: 0, add: 0, mc: 0 }
    )
    const pmv = total.qtde > 0 ? total.rob / total.qtde : 0
    const mcPct = total.rob > 0 ? (total.mc / total.rob) * 100 : 0
    const cmvAbs = Math.abs(total.cmv)
    const diasPmr = parseNumber(prazos.pmr) || 0
    const diasPmp = parseNumber(prazos.pmp) || 0
    const diasCobertura = parseNumber(prazos.coberturaEstoque) || 0
    const estoque = cmvAbs * (diasCobertura / 30)
    const contasReceber = total.rob * (diasPmr / 30)
    const contasPagar = -(cmvAbs * (diasPmp / 30))
    const capitalGiro = estoque + contasReceber + contasPagar
    return { ...total, pmv, mcPct, capitalGiro, estoque, contasReceber, contasPagar }
  }

  const resultadoPeriodos = useMemo(() => {
    const r1 = (() => {
      const p = periodos[0]
      if (!p) return null
      const skuLinhas = skus.map((sku) => calculaLinhaSku(sku, p.valores[sku.id], p.percentuais?.[sku.id]))
      return { periodo: p, skuLinhas, total: calcularTotais(skuLinhas) }
    })()

    const custoUnitBasePorSku = r1 ? Object.fromEntries(r1.skuLinhas.map((l) => [l.sku.id, l.qtde > 0 ? Math.abs(l.cmv) / l.qtde : 0])) : {}

    const r2 = (() => {
      const p = periodos[1] || r1?.periodo
      if (!p) return null
      const skuLinhas = skus.map((sku) => calculaLinhaSku(sku, p.valores[sku.id], p.percentuais?.[sku.id], custoUnitBasePorSku[sku.id]))
      return { periodo: p, skuLinhas, total: calcularTotais(skuLinhas) }
    })()

    return [r1, r2].filter(Boolean)
  }, [periodos, skus, prazos])

  const [skuSelecionado, setSkuSelecionado] = useState('todos')

  const resultadoFiltrado = useMemo(() => {
    if (skuSelecionado === 'todos') return resultadoPeriodos
    return resultadoPeriodos.map((r) => {
      const linha = r.skuLinhas.find((l) => l.sku.id === skuSelecionado)
      if (!linha) return null
      const skuLinhas = [linha]
      return { ...r, skuLinhas, total: calcularTotais(skuLinhas) }
    }).filter(Boolean)
  }, [resultadoPeriodos, skuSelecionado])

  const r1 = resultadoFiltrado[0]
  const r2 = resultadoFiltrado[1] || r1

  const analise = useMemo(() => {
    if (!r1 || !r2) return []
    return r2.skuLinhas.map((linhaAtual) => {
      const linhaAnterior = r1.skuLinhas.find((l) => l.sku.id === linhaAtual.sku.id)
      if (!linhaAnterior) return null

      const qtdAnt = linhaAnterior.qtde
      const qtdAtu = linhaAtual.qtde
      const unitAnt = linhaAnterior.unit
      const novoUnitAnt = linhaAnterior.novoUnit
      const novoUnitAtu = linhaAtual.novoUnit
      const robAnt = linhaAnterior.rob
      const robAtu = linhaAtual.rob

      const deltaQtd = qtdAtu - qtdAnt
      const deltaRob = robAtu - robAnt
      const impactoVolume = deltaQtd * unitAnt
      const impactoPreco = (novoUnitAtu - novoUnitAnt) * qtdAtu
      const impactoMix = deltaRob - impactoVolume - impactoPreco

      return {
        sku: linhaAtual.sku,
        anterior: linhaAnterior,
        atual: linhaAtual,
        deltaQtd,
        deltaRob,
        impactoVolume,
        impactoPreco,
        impactoMix,
      }
    }).filter(Boolean)
  }, [r1, r2])

  const addSku = () => {
    const novo = emptySku()
    setSkus((prev) => [...prev, novo])
    setPeriodos((prev) =>
      prev.map((p) => ({
        ...p,
        valores: { ...p.valores, [novo.id]: { qtde: 1000, unit: 150, novoUnit: 150 } },
        percentuais: { ...p.percentuais, [novo.id]: {
          impostosPct: novo.impostosPct,
          descontoPct: novo.descontoPct,
          cpvPct: novo.cpvPct,
          comissaoFretePct: novo.comissaoFretePct,
          addPct: novo.addPct,
        } },
      }))
    )
  }

  const removeSku = (id) => {
    setSkus((prev) => prev.filter((s) => s.id !== id))
    setPeriodos((prev) =>
      prev.map((p) => {
        const valores = { ...p.valores }
        const percentuais = { ...p.percentuais }
        delete valores[id]
        delete percentuais[id]
        return { ...p, valores, percentuais }
      })
    )
    if (skuSelecionado === id) setSkuSelecionado('todos')
  }

  const updateSku = (id, field, value) => {
    setSkus((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const updateValores = (periodoId, skuId, field, value) => {
    setPeriodos((prev) =>
      prev.map((p) =>
        p.id === periodoId
          ? { ...p, valores: { ...p.valores, [skuId]: { ...p.valores[skuId], [field]: value } } }
          : p
      )
    )
  }

  const updatePeriodoNome = (id, nome) => {
    setPeriodos((prev) => prev.map((p) => (p.id === id ? { ...p, nome } : p)))
  }

  const updatePrazo = (field, value) => {
    setPrazos((prev) => ({ ...prev, [field]: value }))
  }

  const reset = () => {
    setSkus(initialSkus)
    setPeriodos(initialPeriodos)
  }

  const inputClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'
  const inputPctClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'
  const inputNomeClass =
    'w-full bg-transparent border-b border-slate-300 text-left text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'

  const chartData = resultadoFiltrado.map((r) => ({
    nome: r.periodo.nome,
    mc: r.total.mc,
    capitalGiro: r.total.capitalGiro,
  }))

  const deltaClass = (v) => (v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-600' : 'text-slate-500')
  const deltaSignal = (v) => (v > 0 ? '+' : '')

  return (
    <div className={`w-full max-w-[99vw] px-2 ${className}`}>
      <div className="rounded-[28px] border-2 border-amber-300 bg-white p-6 shadow-xl shadow-amber-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-700 font-semibold">Simulador PMV</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-amber-700 tracking-tight">
              Análise PMV
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-700">
              Compare dois períodos com os mesmos SKUs, ajuste quantidade e preço unitário, e veja a decomposição da variação de receita.
            </p>
          </div>
          <div className="flex flex-col items-stretch lg:items-end gap-3">
            <label className="text-xs text-slate-500 font-medium">Analisar SKU</label>
            <select
              value={skuSelecionado}
              onChange={(e) => setSkuSelecionado(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
            >
              <option value="todos">Todos os SKUs</option>
              {skus.map((sku) => (
                <option key={sku.id} value={sku.id}>{sku.nome}</option>
              ))}
            </select>
          </div>
          <div className="rounded-3xl bg-amber-600 p-5 text-center shadow-lg shadow-amber-900/10 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-100 font-semibold">PMV {r2.periodo.nome}</p>
            <p className="mt-3 text-4xl font-bold">{formatBRL(r2.total.qtde > 0 ? r2.total.rob / r2.total.qtde : 0)}</p>
            <p className="text-sm text-amber-100">preço médio bruto</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border-2 border-cyan-300 bg-white p-5 shadow-md shadow-cyan-900/5 hover:shadow-lg hover:shadow-cyan-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 mb-3 font-bold">Receita bruta</p>
          <p className="text-3xl font-bold text-cyan-700">{formatBRL(r2.total.rob)}</p>
          <p className="mt-2 text-sm font-medium text-cyan-600/80">{formatNumber(r2.total.qtde)} unidades</p>
        </div>
        <div className="rounded-[28px] border-2 border-emerald-300 bg-white p-5 shadow-md shadow-emerald-900/5 hover:shadow-lg hover:shadow-emerald-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-700 mb-3 font-bold">ROL</p>
          <p className="text-3xl font-bold text-emerald-700">{formatBRL(r2.total.rol)}</p>
          <p className="mt-2 text-sm font-medium text-emerald-600/80">Receita líquida</p>
        </div>
        <div className="rounded-[28px] border-2 border-violet-300 bg-white p-5 shadow-md shadow-violet-900/5 hover:shadow-lg hover:shadow-violet-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-700 mb-3 font-bold">MC</p>
          <p className="text-3xl font-bold text-violet-700">{formatBRL(r2.total.mc)}</p>
          <p className="mt-2 text-sm font-medium text-violet-600/80">{formatPercent(r2.total.mcPct)} sobre ROB</p>
        </div>
        <div className="rounded-[28px] border-2 border-amber-300 bg-white p-5 shadow-md shadow-amber-900/5 hover:shadow-lg hover:shadow-amber-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700 mb-3 font-bold">PMV</p>
          <p className="text-3xl font-bold text-amber-700">{formatBRL(r2.total.pmv)}</p>
          <p className="mt-2 text-sm font-medium text-amber-600/80">preço médio de venda</p>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-6 overflow-x-auto shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-800">DRE por SKU</h3>
        </div>
        <table className="w-full text-sm min-w-[1400px]">
          <thead>
            <tr className="border-b border-blue-500 text-left bg-blue-600 text-white">
              <th className="py-3 px-2 font-semibold sticky left-0 bg-blue-600 z-10">SKU</th>
              <th colSpan="5" className="py-3 px-2 text-center border-b border-white/20">
                <input
                  type="text"
                  value={r1.periodo.nome}
                  onChange={(e) => updatePeriodoNome(r1.periodo.id, e.target.value)}
                  className="bg-transparent border-b border-white/40 text-white text-center text-sm outline-none focus:border-white px-1"
                />
              </th>
              <th colSpan="7" className="py-3 px-2 text-center border-l-2 border-b border-white/20 bg-blue-700/50">
                <input
                  type="text"
                  value={r2.periodo.nome}
                  onChange={(e) => updatePeriodoNome(r2.periodo.id, e.target.value)}
                  className="bg-transparent border-b border-white/40 text-white text-center text-sm outline-none focus:border-white px-1"
                />
              </th>
              <th colSpan="2" className="py-3 px-2 text-center border-l-2 border-b border-white/20 bg-blue-700/50">Variação</th>
              <th colSpan="3" className="py-3 px-2 text-center border-l-2 border-b border-white/20 bg-blue-700/50">Análise PMV</th>
              <th className="py-3 px-2"></th>
            </tr>
            <tr className="border-b border-blue-500 text-left bg-blue-600 text-white text-xs">
              <th className="py-2 px-2 sticky left-0 bg-blue-600 z-10"></th>
              <th className="py-2 px-2 text-center font-semibold">Qtd</th>
              <th className="py-2 px-2 text-center font-semibold">R$</th>
              <th className="py-2 px-2 text-center font-semibold">Unit</th>
              <th className="py-2 px-2 text-center font-semibold">Marg%</th>
              <th className="py-2 px-2 text-center font-semibold">MC</th>
              <th className="py-2 px-2 text-center font-semibold border-l border-white/30 bg-blue-700/30">Qtd</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">R$</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">Unit</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">Desc %</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">Novo Unit</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">Marg%</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">MC</th>
              <th className="py-2 px-2 text-center font-semibold border-l border-white/30 bg-blue-700/30">Δ Qtd</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">Δ R$</th>
              <th className="py-2 px-2 text-center font-semibold border-l border-white/30 bg-blue-700/30">Volume</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">Preço</th>
              <th className="py-2 px-2 text-center font-semibold bg-blue-700/30">Mix</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {analise.map((a) => (
              <tr key={a.sku.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="py-2 px-2 sticky left-0 bg-white z-10">
                  <input
                    type="text"
                    value={a.sku.nome}
                    onChange={(e) => updateSku(a.sku.id, 'nome', e.target.value)}
                    className={inputNomeClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={r1.periodo.valores[a.sku.id]?.qtde ?? ''}
                    onChange={(e) => updateValores(r1.periodo.id, a.sku.id, 'qtde', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-cyan-700 font-semibold">{formatBRL(a.anterior.rob)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r1.periodo.valores[a.sku.id]?.unit ?? ''}
                    onChange={(e) => updateValores(r1.periodo.id, a.sku.id, 'unit', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-violet-700">{formatPercent(a.anterior.mcPct)}</td>
                <td className="py-2 px-2 text-center text-violet-700 font-semibold">{formatBRL(a.anterior.mc)}</td>
                <td className="py-2 px-2 border-l border-slate-200">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={r2.periodo.valores[a.sku.id]?.qtde ?? ''}
                    onChange={(e) => updateValores(r2.periodo.id, a.sku.id, 'qtde', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-cyan-700 font-semibold">{formatBRL(a.atual.rob)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r2.periodo.valores[a.sku.id]?.unit ?? ''}
                    onChange={(e) => updateValores(r2.periodo.id, a.sku.id, 'unit', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-slate-600">{formatPercent(a.atual.unit > 0 ? ((a.atual.unit - a.atual.novoUnit) / a.atual.unit) * 100 : 0)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r2.periodo.valores[a.sku.id]?.novoUnit ?? ''}
                    onChange={(e) => updateValores(r2.periodo.id, a.sku.id, 'novoUnit', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-violet-700 font-semibold">{formatPercent(a.atual.mcPct)}</td>
                <td className="py-2 px-2 text-center text-violet-700 font-bold">{formatBRL(a.atual.mc)}</td>
                <td className={`py-2 px-2 text-center font-semibold border-l border-slate-200 ${deltaClass(a.deltaQtd)}`}>
                  {deltaSignal(a.deltaQtd)}{formatNumber(a.deltaQtd)}
                </td>
                <td className={`py-2 px-2 text-center font-semibold ${deltaClass(a.deltaRob)}`}>
                  {deltaSignal(a.deltaRob)}{formatBRL(a.deltaRob)}
                </td>
                <td className={`py-2 px-2 text-center border-l border-slate-200 ${deltaClass(a.impactoVolume)}`}>{deltaSignal(a.impactoVolume)}{formatBRL(a.impactoVolume)}</td>
                <td className={`py-2 px-2 text-center ${deltaClass(a.impactoPreco)}`}>{deltaSignal(a.impactoPreco)}{formatBRL(a.impactoPreco)}</td>
                <td className={`py-2 px-2 text-center ${deltaClass(a.impactoMix)}`}>{deltaSignal(a.impactoMix)}{formatBRL(a.impactoMix)}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => removeSku(a.sku.id)}
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
              <td className="py-3 px-2 text-center text-slate-600">{formatNumber(r1.total.qtde)}</td>
              <td className="py-3 px-2 text-center text-cyan-700">{formatBRL(r1.total.rob)}</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-violet-700">{formatPercent(r1.total.mcPct)}</td>
              <td className="py-3 px-2 text-center text-violet-700">{formatBRL(r1.total.mc)}</td>
              <td className="py-3 px-2 text-center text-slate-600 border-l border-slate-200">{formatNumber(r2.total.qtde)}</td>
              <td className="py-3 px-2 text-center text-cyan-700">{formatBRL(r2.total.rob)}</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-violet-700">{formatPercent(r2.total.mcPct)}</td>
              <td className="py-3 px-2 text-center text-violet-700">{formatBRL(r2.total.mc)}</td>
              <td className={`py-3 px-2 text-center border-l border-slate-200 ${deltaClass(r2.total.qtde - r1.total.qtde)}`}>{deltaSignal(r2.total.qtde - r1.total.qtde)}{formatNumber(r2.total.qtde - r1.total.qtde)}</td>
              <td className={`py-3 px-2 text-center ${deltaClass(r2.total.rob - r1.total.rob)}`}>{deltaSignal(r2.total.rob - r1.total.rob)}{formatBRL(r2.total.rob - r1.total.rob)}</td>
              <td className={`py-3 px-2 text-center border-l border-slate-200 ${deltaClass(analise.reduce((s, a) => s + a.impactoVolume, 0))}`}>{deltaSignal(analise.reduce((s, a) => s + a.impactoVolume, 0))}{formatBRL(analise.reduce((s, a) => s + a.impactoVolume, 0))}</td>
              <td className={`py-3 px-2 text-center ${deltaClass(analise.reduce((s, a) => s + a.impactoPreco, 0))}`}>{deltaSignal(analise.reduce((s, a) => s + a.impactoPreco, 0))}{formatBRL(analise.reduce((s, a) => s + a.impactoPreco, 0))}</td>
              <td className={`py-3 px-2 text-center ${deltaClass(analise.reduce((s, a) => s + a.impactoMix, 0))}`}>{deltaSignal(analise.reduce((s, a) => s + a.impactoMix, 0))}{formatBRL(analise.reduce((s, a) => s + a.impactoMix, 0))}</td>
              <td className="py-3 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-lg shadow-violet-500/5">
          <h3 className="text-lg font-bold text-violet-700 mb-4">Evolução da Margem de Contribuição</h3>
          <div className="h-[14rem]">
            <SimpleBarChart data={chartData} valueKey="mc" labelKey="nome" />
          </div>
        </div>

        <div className="rounded-[28px] border border-rose-200 bg-white p-6 shadow-lg shadow-rose-500/5">
          <h3 className="text-lg font-bold text-rose-700 mb-4">Evolução do Capital de Giro Travado</h3>
          <div className="h-[14rem]">
            <SimpleBarChart data={chartData} valueKey="capitalGiro" labelKey="nome" color="#fb7185" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border-2 border-rose-300 bg-white p-5 shadow-md shadow-rose-900/5 hover:shadow-lg hover:shadow-rose-900/10 transition">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-rose-700 mb-3 font-bold">Capital de Giro Travado</p>
            <p className="text-3xl font-bold text-rose-700">{formatBRL(r2.total.capitalGiro)}</p>
            <p className="mt-2 text-sm font-medium text-rose-600/80">NCG estimada no {r2.periodo.nome}</p>
          </div>
          <div className="lg:col-span-3">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-4 font-bold">Prazos operacionais (dias)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Prazo médio de recebimento</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={prazos.pmr}
                  onChange={(e) => updatePrazo('pmr', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Prazo médio de pagamento</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={prazos.pmp}
                  onChange={(e) => updatePrazo('pmp', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cobertura de estoque</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={prazos.coberturaEstoque}
                  onChange={(e) => updatePrazo('coberturaEstoque', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 overflow-x-auto">
          <p className="text-xs uppercase tracking-[0.28em] text-rose-700 mb-3 font-bold">Memória de cálculo comparativa</p>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-rose-200 text-left text-rose-800 text-xs">
                <th className="py-2 px-2 font-semibold">Item</th>
                <th className="py-2 px-2 font-semibold">Cálculo</th>
                <th className="py-2 px-2 font-semibold text-right">{r1.periodo.nome}</th>
                <th className="py-2 px-2 font-semibold text-right">{r2.periodo.nome}</th>
                <th className="py-2 px-2 font-semibold text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-rose-100">
                <td className="py-2 px-2 text-slate-700">Estoque</td>
                <td className="py-2 px-2 text-slate-500">|CMV| × {prazos.coberturaEstoque}/30</td>
                <td className="py-2 px-2 text-right font-semibold text-slate-700">{formatBRL(r1.total.estoque)}</td>
                <td className="py-2 px-2 text-right font-semibold text-slate-700">{formatBRL(r2.total.estoque)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${deltaClass(r2.total.estoque - r1.total.estoque)}`}>{deltaSignal(r2.total.estoque - r1.total.estoque)}{formatBRL(r2.total.estoque - r1.total.estoque)}</td>
              </tr>
              <tr className="border-b border-rose-100">
                <td className="py-2 px-2 text-slate-700">Contas a receber</td>
                <td className="py-2 px-2 text-slate-500">ROB × {prazos.pmr}/30</td>
                <td className="py-2 px-2 text-right font-semibold text-slate-700">{formatBRL(r1.total.contasReceber)}</td>
                <td className="py-2 px-2 text-right font-semibold text-slate-700">{formatBRL(r2.total.contasReceber)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${deltaClass(r2.total.contasReceber - r1.total.contasReceber)}`}>{deltaSignal(r2.total.contasReceber - r1.total.contasReceber)}{formatBRL(r2.total.contasReceber - r1.total.contasReceber)}</td>
              </tr>
              <tr className="border-b border-rose-100">
                <td className="py-2 px-2 text-slate-700">Contas a pagar</td>
                <td className="py-2 px-2 text-slate-500">|CMV| × {prazos.pmp}/30</td>
                <td className="py-2 px-2 text-right font-semibold text-slate-700">{formatBRL(r1.total.contasPagar)}</td>
                <td className="py-2 px-2 text-right font-semibold text-slate-700">{formatBRL(r2.total.contasPagar)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${deltaClass(r2.total.contasPagar - r1.total.contasPagar)}`}>{deltaSignal(r2.total.contasPagar - r1.total.contasPagar)}{formatBRL(r2.total.contasPagar - r1.total.contasPagar)}</td>
              </tr>
              <tr className="bg-rose-100/50 font-semibold">
                <td className="py-2 px-2 text-rose-800">NCG</td>
                <td className="py-2 px-2 text-rose-700">Estoque + Receber + Pagar</td>
                <td className={`py-2 px-2 text-right ${r1.total.capitalGiro >= 0 ? 'text-rose-700' : 'text-emerald-600'}`}>{formatBRL(r1.total.capitalGiro)}</td>
                <td className={`py-2 px-2 text-right ${r2.total.capitalGiro >= 0 ? 'text-rose-700' : 'text-emerald-600'}`}>{formatBRL(r2.total.capitalGiro)}</td>
                <td className={`py-2 px-2 text-right ${deltaClass(r2.total.capitalGiro - r1.total.capitalGiro)}`}>{deltaSignal(r2.total.capitalGiro - r1.total.capitalGiro)}{formatBRL(r2.total.capitalGiro - r1.total.capitalGiro)}</td>
              </tr>
            </tbody>
          </table>
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
          onClick={reset}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
        >
          Reiniciar simulação
        </button>
      </div>
    </div>
  )
}
