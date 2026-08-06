import React, { useRef } from 'react'

const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const SUGESTOES = [
  { nome: 'Juros' },
  { nome: 'Parcela de empréstimo' },
  { nome: 'Tarifas bancárias' },
  { nome: 'IOF' },
  { nome: 'Cartão de crédito' },
  { nome: 'Impostos atrasados' },
  { nome: 'Multas' },
]

const emptyDespesa = (nome = '') => ({
  id: Date.now() + Math.random(),
  nome,
  meses: Array(12).fill(0),
})

function parseBRL(str) {
  if (str === '' || str === undefined || str === null) return 0
  const s = String(str).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  return parseFloat(s) || 0
}

function fmtBRL(v) {
  if (!v) return ''
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function MoneyCell({ value, onChange }) {
  const ref = useRef(null)
  const [editing, setEditing] = React.useState(false)
  const [raw, setRaw] = React.useState('')

  const handleFocus = () => {
    setRaw(value ? String(value) : '')
    setEditing(true)
    setTimeout(() => ref.current?.select(), 0)
  }

  const handleBlur = () => {
    setEditing(false)
    onChange(parseBRL(raw))
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={editing ? raw : (value ? fmtBRL(value) : '')}
      onChange={e => setRaw(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="0"
      className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-1.5 py-1 text-slate-900 text-xs text-right placeholder-slate-400 focus:outline-none transition min-w-[90px]"
    />
  )
}

export default function StepDespesasFinanceiras({ data, updateData, next, back, className }) {
  const despesas = data.outros || []
  const getMeses = (d) => Array.isArray(d.meses) ? d.meses : Array(12).fill(0)

  const add = (nome = '') => updateData('outros', [...despesas, emptyDespesa(nome)])
  const remove = (id) => updateData('outros', despesas.filter(d => d.id !== id))
  const change = (id, field, value) =>
    updateData('outros', despesas.map(d => d.id === id ? { ...d, [field]: value } : d))

  const changeMes = (id, mesIdx, valor) =>
    updateData('outros', despesas.map(d => {
      if (d.id !== id) return d
      const meses = [...getMeses(d)]
      meses[mesIdx] = valor
      return { ...d, meses }
    }))

  const changeTotalAno = (id, total) => {
    const base = Math.floor(total / 12)
    const resto = total - base * 12
    const meses = Array(12).fill(base).map((v, i) => (i < resto ? v + 1 : v))
    updateData('outros', despesas.map(d => d.id === id ? { ...d, meses } : d))
  }

  const totalAno = (d) => getMeses(d).reduce((s, v) => s + (Number(v) || 0), 0)
  const totalMes = (mesIdx) => despesas.reduce((s, d) => s + (Number(getMeses(d)[mesIdx]) || 0), 0)
  const totalGeral = () => despesas.reduce((s, d) => s + totalAno(d), 0)

  const jaAdicionado = (nome) => despesas.some(d => d.nome === nome)

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">💳</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Despesas Financeiras</h2>
        <p className="text-slate-500 text-sm">Juros, tarifas, parcelas, impostos atrasados e outras despesas financeiras</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {SUGESTOES.map(s => (
          <button
            key={s.nome}
            onClick={() => !jaAdicionado(s.nome) && add(s.nome)}
            disabled={jaAdicionado(s.nome)}
            className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
              jaAdicionado(s.nome)
                ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-default'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-slate-900'
            }`}
          >
            {s.nome} {jaAdicionado(s.nome) ? '✓' : '+'}
          </button>
        ))}
        <button
          onClick={() => add()}
          className="text-xs px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-slate-900 transition font-medium"
        >
          + Nova despesa financeira
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-blue-600 z-10 min-w-[160px] border-r border-blue-500 text-white">
                Despesa
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[100px] border-r border-blue-500 text-white bg-blue-600">
                Total do Ano
              </th>
              {MESES_FULL.map((m, i) => (
                <th
                  key={m}
                  className={`text-center px-1 py-2.5 font-semibold min-w-[120px] bg-blue-600 text-white ${
                    i < 11 ? 'border-r border-blue-500' : ''
                  }`}
                >
                  {m}
                </th>
              ))}
              <th className="w-8 bg-blue-600"></th>
            </tr>
          </thead>
          <tbody>
            {despesas.length === 0 && (
              <tr>
                <td colSpan={15} className="text-center py-10 text-slate-400 text-sm">
                  Adicione despesas financeiras usando os botões acima
                </td>
              </tr>
            )}
            {despesas.map((d, rowIdx) => (
              <tr
                key={d.id}
                className={`border-t border-slate-200 ${rowIdx % 2 === 0 ? 'bg-slate-50/50' : 'bg-slate-50/30'} hover:bg-slate-100 transition`}
              >
                <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10 border-r border-slate-200">
                  <input
                    type="text"
                    value={d.nome}
                    onChange={e => change(d.id, 'nome', e.target.value)}
                    placeholder="Nome da despesa"
                    className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 py-1 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none transition"
                  />
                </td>
                <td className="px-1 py-1 border-r border-slate-200">
                  <MoneyCell
                    value={totalAno(d)}
                    onChange={v => changeTotalAno(d.id, v)}
                  />
                </td>
                {getMeses(d).map((v, i) => (
                  <td
                    key={i}
                    className={`px-1 py-1 ${i < 11 ? 'border-r border-slate-200/50' : ''}`}
                  >
                    <MoneyCell
                      value={v}
                      onChange={val => changeMes(d.id, i, val)}
                    />
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => remove(d.id)}
                    className="text-slate-400 hover:text-red-400 transition text-sm"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {despesas.length > 0 && (
              <tr className="border-t-2 border-slate-200 bg-slate-100 font-semibold">
                <td className="px-3 py-2 sticky left-0 bg-inherit z-10 border-r border-slate-200 text-xs text-slate-700">
                  Total Financeiro Mensal
                </td>
                <td className="px-2 py-2 text-right text-xs text-slate-900 border-r border-slate-200">
                  {fmtBRL(totalGeral())}
                </td>
                {MESES_FULL.map((_, i) => (
                  <td
                    key={i}
                    className={`px-2 py-2 text-right text-xs text-slate-900 ${i < 11 ? 'border-r border-slate-200/50' : ''}`}
                  >
                    {fmtBRL(totalMes(i))}
                  </td>
                ))}
                <td className="bg-slate-100"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 mt-5 max-w-lg mx-auto">
        <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm">
          ← Voltar
        </button>
        <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm">
          Próximo →
        </button>
      </div>
    </div>
  )
}
