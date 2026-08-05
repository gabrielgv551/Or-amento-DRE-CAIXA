import React, { useRef } from 'react'

const PRAZO_RAPIDO = ['VISTA', '30', '60', '30/60', '30/60/90', '28/56', '45/90']

const SUGESTOES = ['📦 Mercadoria', '🚚 Frete', '📦 Embalagens', '🏭 Indústria', '� Insumos']

// Same logic as Apps Script criarBancoDeDados.gs
function ajustarDiaUtil(d) {
  const x = new Date(d)
  const dow = x.getDay()
  if (dow === 6) x.setDate(x.getDate() + 2)
  else if (dow === 0) x.setDate(x.getDate() + 1)
  return x
}

function calcParcelasVencimentos(baseDt, prazoStr) {
  const result = []
  const prazo  = String(prazoStr || '').trim().toUpperCase()
  if (!prazo || prazo.includes('VISTA')) {
    result.push(ajustarDiaUtil(new Date(baseDt)))
    return result
  }
  if (prazo.includes('/')) {
    prazo.split('/').forEach(p => {
      const dias = parseInt(p.trim())
      if (!isNaN(dias)) { const d = new Date(baseDt); d.setDate(d.getDate() + dias); result.push(ajustarDiaUtil(d)) }
    })
  } else {
    const dias = parseInt(prazo)
    if (!isNaN(dias)) { const d = new Date(baseDt); d.setDate(d.getDate() + dias); result.push(ajustarDiaUtil(d)) }
    else result.push(ajustarDiaUtil(new Date(baseDt)))
  }
  return result
}

export function calcParcelas(f) {
  const dt     = f.previsto ? new Date(f.previsto) : null
  const total  = Number(f.total) || 0
  const ato    = (Number(f.ato) || 0) / 100
  const prazo  = String(f.prazo || 'VISTA').trim().toUpperCase()
  if (!dt || isNaN(dt) || total <= 0) return []

  const result = []
  if (prazo.includes('VISTA') && ato === 0) {
    result.push({ data: ajustarDiaUtil(new Date(dt)), valor: total, label: 'À vista' })
    return result
  }
  if (ato > 0) {
    const valorAto = total * ato
    const valorRest = total - valorAto
    result.push({ data: ajustarDiaUtil(new Date(dt)), valor: valorAto, label: 'Ato' })
    if (valorRest > 0 && !prazo.includes('VISTA')) {
      const vencs = calcParcelasVencimentos(dt, prazo)
      const vp = valorRest / Math.max(vencs.length, 1)
      vencs.forEach((d, i) => result.push({ data: d, valor: vp, label: `${i+1}/${vencs.length}` }))
    }
    return result
  }
  const vencs = calcParcelasVencimentos(dt, prazo)
  if (!vencs.length) return result
  const vp = total / vencs.length
  vencs.forEach((d, i) => result.push({ data: d, valor: vp, label: vencs.length > 1 ? `${i+1}/${vencs.length}` : '' }))
  return result
}

const empty = (nome = '') => ({
  id: Date.now() + Math.random(),
  nome,
  previsto: new Date().toISOString().split('T')[0],
  prazo: 'VISTA',
  ato: '',
  total: 0,
})

function parseBRL(str) {
  if (!str && str !== 0) return 0
  const s = String(str).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  return parseFloat(s) || 0
}

function fmtBRL(v) {
  if (!v) return ''
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function MoneyCell({ value, onChange }) {
  const ref = useRef(null)
  const [editing, setEditing] = React.useState(false)
  const [raw, setRaw] = React.useState('')
  const handleFocus = () => { setRaw(value ? String(value) : ''); setEditing(true); setTimeout(() => ref.current?.select(), 0) }
  const handleBlur  = () => { setEditing(false); onChange(parseBRL(raw)) }
  return (
    <input ref={ref} type="text" inputMode="numeric"
      value={editing ? raw : (value ? fmtBRL(value) : '')}
      onChange={e => setRaw(e.target.value)}
      onFocus={handleFocus} onBlur={handleBlur}
      placeholder="0,00"
      className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 py-1 text-slate-900 text-xs text-right placeholder-slate-400 focus:outline-none transition"
    />
  )
}

function compact(v) {
  const n = Number(v) || 0
  if (n >= 1_000_000) return `R$ ${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n/1_000).toFixed(0)}k`
  return `R$ ${Math.round(n)}`
}

function ParcelasPreview({ f }) {
  const parcelas = calcParcelas(f)
  if (!parcelas.length || !f.total) return <span className="text-slate-300 text-[10px]">—</span>
  const n = parcelas.length
  if (n === 1 && !f.ato) return <span className="text-slate-500 text-[10px]">À vista {compact(f.total)}</span>
  return (
    <div className="text-[10px] text-slate-700 space-y-0.5">
      {f.ato > 0 && <div className="text-blue-600">Ato {compact(Number(f.total) * (Number(f.ato)||0)/100)}</div>}
      {n > (f.ato > 0 ? 1 : 0) && (
        <div>{n - (f.ato > 0 ? 1 : 0)}× {compact(parcelas[f.ato > 0 ? 1 : 0]?.valor)}</div>
      )}
    </div>
  )
}

export default function StepFornecedores({ data, updateData, next, back, className }) {
  const lista = data.fornecedores

  const add    = (nome = '') => updateData('fornecedores', [...lista, empty(nome)])
  const remove = (id)        => updateData('fornecedores', lista.filter(f => f.id !== id))
  const change = (id, field, value) => updateData('fornecedores', lista.map(f => f.id === id ? { ...f, [field]: value } : f))

  const totalGeral = lista.reduce((s, f) => s + (Number(f.total) || 0), 0)

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🏭</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Fornecedores</h2>
        <p className="text-slate-500 text-sm">Compras com prazo, ato e parcelamento</p>
      </div>

      {/* Quick add */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {SUGESTOES.map(s => (
          <button key={s} onClick={() => add(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700 hover:border-blue-500 hover:text-slate-900 transition font-medium">
            {s} +
          </button>
        ))}
        <button onClick={() => add()} className="text-xs px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-slate-900 transition font-medium">
          + Novo
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-blue-600 z-10 min-w-[170px] border-r border-blue-500">Fornecedor</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[120px] border-r border-blue-500 bg-blue-600">Previsto</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[220px] border-r border-blue-500 bg-blue-600">Prazo</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[68px] border-r border-blue-500 bg-blue-600">Ato %</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[140px] border-r border-blue-500 bg-blue-600">Total (R$)</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[130px] border-r border-blue-500 bg-blue-600">Parcelas</th>
              <th className="w-8 bg-blue-600"></th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Adicione fornecedores usando os botões acima</td></tr>
            )}
            {lista.map((f, rowIdx) => (
              <tr key={f.id} className={`border-t border-slate-200 ${rowIdx % 2 === 0 ? 'bg-slate-50/50' : 'bg-slate-50/30'} hover:bg-slate-100/20 transition`}>

                {/* Nome */}
                <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10 border-r border-slate-200">
                  <input type="text" value={f.nome} onChange={e => change(f.id, 'nome', e.target.value)} placeholder="Nome"
                    className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 py-1 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none transition" />
                </td>

                {/* Previsto */}
                <td className="px-2 py-1.5 border-r border-slate-200">
                  <input type="date" value={f.previsto || ''} onChange={e => change(f.id, 'previsto', e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 py-1 text-slate-900 text-xs text-center focus:outline-none transition" />
                </td>

                {/* Prazo */}
                <td className="px-2 py-1.5 border-r border-slate-200">
                  <div className="flex gap-1 flex-wrap items-center">
                    {PRAZO_RAPIDO.map(p => (
                      <button key={p} onClick={() => change(f.id, 'prazo', p)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition whitespace-nowrap ${
                          f.prazo === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}>{p}</button>
                    ))}
                    <input type="text" value={f.prazo || ''} onChange={e => change(f.id, 'prazo', e.target.value)}
                      placeholder="ex: 30/60" className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-900 text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </td>

                {/* Ato % */}
                <td className="px-2 py-1.5 border-r border-slate-200">
                  <div className="relative">
                    <input type="number" min="0" max="100" value={f.ato || ''} onChange={e => change(f.id, 'ato', e.target.value)} placeholder="0"
                      className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 pr-5 py-1 text-slate-900 text-xs text-center focus:outline-none transition" />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">%</span>
                  </div>
                </td>

                {/* Total */}
                <td className="px-2 py-1.5 border-r border-slate-200">
                  <MoneyCell value={f.total} onChange={v => change(f.id, 'total', v)} />
                </td>

                {/* Parcelas preview */}
                <td className="px-3 py-1.5 border-r border-slate-200">
                  <ParcelasPreview f={f} />
                </td>

                <td className="px-2 py-1.5 text-center">
                  <button onClick={() => remove(f.id)} className="text-slate-400 hover:text-red-600 transition text-sm">✕</button>
                </td>
              </tr>
            ))}

            {lista.length > 0 && (
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="sticky left-0 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 border-r border-slate-200" colSpan={4}>TOTAL</td>
                <td className="px-2 py-2 text-right border-r border-slate-200">
                  <span className="text-xs font-bold text-red-600">{fmtBRL(totalGeral)}</span>
                </td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[11px] text-slate-400 text-center">
        Prazo ex: <span className="text-slate-400">30</span> = 30 dias · <span className="text-slate-400">30/60/90</span> = 3 parcelas · <span className="text-slate-400">Ato</span> = % pago na entrada
      </div>

      <div className="flex gap-3 mt-4 max-w-lg mx-auto">
        <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm">← Voltar</button>
        <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm">Próximo →</button>
      </div>
    </div>
  )
}
