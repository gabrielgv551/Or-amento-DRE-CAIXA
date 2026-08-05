import React, { useRef } from 'react'

const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function parsePct(str) {
  const n = parseFloat(String(str || '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function fmtBRL(v) {
  if (!v && v !== 0) return ''
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function PctCell({ value, onChange }) {
  const ref = useRef(null)
  const [editing, setEditing] = React.useState(false)
  const [raw, setRaw] = React.useState('')

  const handleFocus = () => { setRaw(value ? String(value) : ''); setEditing(true); setTimeout(() => ref.current?.select(), 0) }
  const handleBlur = () => { setEditing(false); onChange(parsePct(raw)) }

  return (
    <div className="relative">
      <input ref={ref} type="text" inputMode="numeric"
        value={editing ? raw : (value ? String(value).replace('.', ',') : '')}
        onChange={e => setRaw(e.target.value)}
        onFocus={handleFocus} onBlur={handleBlur}
        placeholder="0"
        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 pr-5 py-1 text-slate-900 text-xs text-right placeholder-slate-400 focus:outline-none transition"
      />
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">%</span>
    </div>
  )
}

export default function StepFornecedores({ data, updateData, next, back, className }) {
  const canais = data.canais || []
  const rol = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => s + (Number(c.meses?.[m]) || 0), 0)
  )
  const totalRol = rol.reduce((s, v) => s + v, 0)

  const desp = data.despesasVariaveis || { ads: '', frete: '' }
  const patch = (field, value) => updateData('despesasVariaveis', { ...desp, [field]: value })

  const adsPct = parsePct(desp.ads) / 100
  const fretePct = parsePct(desp.frete) / 100

  const adsTotal = totalRol * adsPct
  const freteTotal = totalRol * fretePct

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🏭</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Despesas Variáveis</h2>
        <p className="text-slate-500 text-sm">Ads e frete como % da Receita Operacional Líquida (ROL)</p>
      </div>

      {/* ROL table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-blue-600 z-10 min-w-[170px] border-r border-blue-500">Receita</th>
              {MESES_FULL.map((m, i) => (
                <th key={m} className={`text-center px-2 py-2.5 font-semibold min-w-[100px] ${i < 11 ? 'border-r border-blue-500' : ''}`}>{m.substring(0, 3)}</th>
              ))}
              <th className="text-center px-2 py-2.5 font-semibold min-w-[110px] border-l border-blue-500">Total Ano</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 bg-slate-50/50">
              <td className="sticky left-0 bg-inherit z-10 px-3 py-2 text-xs font-semibold text-slate-700 border-r border-slate-200">ROL (faturamento bruto)</td>
              {rol.map((v, i) => (
                <td key={i} className={`px-2 py-2 text-right text-xs text-slate-700 ${i < 11 ? 'border-r border-slate-200/50' : ''}`}>
                  {fmtBRL(v)}
                </td>
              ))}
              <td className="px-2 py-2 text-right text-xs font-bold text-slate-900 border-l border-slate-200/50">{fmtBRL(totalRol)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Variable expenses */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-blue-600 z-10 min-w-[170px] border-r border-blue-500">Despesa</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[110px] border-r border-blue-500">% da ROL</th>
              {MESES_FULL.map((m, i) => (
                <th key={m} className={`text-center px-2 py-2.5 font-semibold min-w-[100px] ${i < 11 ? 'border-r border-blue-500' : ''}`}>{m.substring(0, 3)}</th>
              ))}
              <th className="text-center px-2 py-2.5 font-semibold min-w-[110px] border-l border-blue-500">Total Ano</th>
            </tr>
          </thead>
          <tbody>
            {/* Ads */}
            <tr className="border-t border-slate-200 bg-slate-50/30">
              <td className="sticky left-0 bg-inherit z-10 px-3 py-2 text-xs font-semibold text-slate-700 border-r border-slate-200">📢 Ads</td>
              <td className="px-2 py-1.5 border-r border-slate-200">
                <PctCell value={desp.ads} onChange={v => patch('ads', v)} />
              </td>
              {rol.map((v, i) => (
                <td key={i} className={`px-2 py-2 text-right text-xs text-slate-700 ${i < 11 ? 'border-r border-slate-200/50' : ''}`}>
                  {fmtBRL(v * adsPct)}
                </td>
              ))}
              <td className="px-2 py-2 text-right text-xs font-bold text-slate-900 border-l border-slate-200/50">{fmtBRL(adsTotal)}</td>
            </tr>
            {/* Frete */}
            <tr className="border-t border-slate-200 bg-slate-50/50">
              <td className="sticky left-0 bg-inherit z-10 px-3 py-2 text-xs font-semibold text-slate-700 border-r border-slate-200">🚚 Frete</td>
              <td className="px-2 py-1.5 border-r border-slate-200">
                <PctCell value={desp.frete} onChange={v => patch('frete', v)} />
              </td>
              {rol.map((v, i) => (
                <td key={i} className={`px-2 py-2 text-right text-xs text-slate-700 ${i < 11 ? 'border-r border-slate-200/50' : ''}`}>
                  {fmtBRL(v * fretePct)}
                </td>
              ))}
              <td className="px-2 py-2 text-right text-xs font-bold text-slate-900 border-l border-slate-200/50">{fmtBRL(freteTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[11px] text-slate-400 text-center">
        Preencha os percentuais de Ads e Frete sobre a ROL. O valor mensal é calculado automaticamente.
      </div>

      <div className="flex gap-3 mt-4 max-w-lg mx-auto">
        <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm">← Voltar</button>
        <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm">Próximo →</button>
      </div>
    </div>
  )
}
