import React, { useRef } from 'react'

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const SUGESTOES = [
  { nome: 'Mercado Livre',    deducao: '17', leadTime: '14' },
  { nome: 'Shopee',           deducao: '20', leadTime: '14' },
  { nome: 'Amazon',           deducao: '15', leadTime: '21' },
  { nome: 'Site Próprio',     deducao: '3',  leadTime: '1'  },
  { nome: 'Loja Física',      deducao: '0',  leadTime: '0'  },
]

const emptyCanal = (nome = '', deducao = '0', leadTime = '14') => ({
  id: Date.now() + Math.random(),
  nome,
  deducao,
  leadTime,
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

  const handleChange = (e) => {
    setRaw(e.target.value)
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={editing ? raw : (value ? fmtBRL(value) : '')}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="0"
      className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-1.5 py-1 text-slate-900 text-xs text-right placeholder-slate-400 focus:outline-none transition min-w-[90px]"
    />
  )
}

export default function StepFaturamento({ data, updateData, next, back, className }) {
  const canais      = data.canais || []
  const mesAtual    = new Date().getMonth()
  // Show all 12 months in calendar order (Jan-Dec)
  const visibleMeses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  const addCanal = (nome = '', deducao = '0', leadTime = '14') =>
    updateData('canais', [...canais, emptyCanal(nome, deducao, leadTime)])

  const removeCanal = (id) =>
    updateData('canais', canais.filter(c => c.id !== id))

  const changeCanal = (id, field, value) =>
    updateData('canais', canais.map(c => c.id === id ? { ...c, [field]: value } : c))

  const changeMesValor = (id, mesIdx, valor) =>
    updateData('canais', canais.map(c => {
      if (c.id !== id) return c
      const meses = [...c.meses]
      meses[mesIdx] = valor
      return { ...c, meses }
    }))

  const totalCanal = (canal) => canal.meses.reduce((s, v) => s + (Number(v) || 0), 0)

  const changeTotalAno = (id, total) => {
    const base = Math.floor(total / 12)
    const resto = total - base * 12
    const meses = Array(12).fill(base).map((v, i) => (i < resto ? v + 1 : v))
    updateData('canais', canais.map(c => {
      if (c.id !== id) return c
      return { ...c, meses }
    }))
  }

  const jaAdicionado = (nome) => canais.some(c => c.nome === nome)

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">📊</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Canais de Venda</h2>
        <p className="text-slate-500 text-sm">Preencha o faturamento bruto por canal e mês</p>
      </div>

      {/* Quick add */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {SUGESTOES.map(s => (
          <button
            key={s.nome}
            onClick={() => !jaAdicionado(s.nome) && addCanal(s.nome, s.deducao, s.leadTime)}
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
          onClick={() => addCanal()}
          className="text-xs px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-slate-900 transition font-medium"
        >
          + Novo canal
        </button>
      </div>

      {/* Spreadsheet table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-blue-600 z-10 min-w-[160px] border-r border-blue-500 text-white">
                Canal
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[72px] border-r border-blue-500 text-white bg-blue-600">
                Ded. (%)
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[72px] border-r border-blue-500 text-white bg-blue-600">
                Dias p/<br />receber
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[100px] border-r border-blue-500 text-white bg-blue-600">
                Total do<br />Ano
              </th>
              {visibleMeses.map((i, col) => (
                <th
                  key={i}
                  className={`text-center px-1 py-2.5 font-semibold min-w-[130px] bg-blue-600 text-white ${
                    i === mesAtual
                      ? 'bg-blue-700'
                      : ''
                  } ${col < visibleMeses.length - 1 ? 'border-r border-blue-500' : ''}`}
                >
                  {MESES_FULL[i]}
                </th>
              ))}
              <th className="w-8 bg-blue-600"></th>
            </tr>
          </thead>
          <tbody>
            {canais.length === 0 && (
              <tr>
                <td colSpan={visibleMeses.length + 5} className="text-center py-10 text-slate-400 text-sm">
                  Adicione canais usando os botões acima
                </td>
              </tr>
            )}
            {canais.map((canal, rowIdx) => (
              <tr
                key={canal.id}
                className={`border-t border-slate-200 ${rowIdx % 2 === 0 ? 'bg-slate-50/50' : 'bg-slate-50/30'} hover:bg-slate-100 transition`}
              >
                {/* Canal name */}
                <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10 border-r border-slate-200">
                  <input
                    type="text"
                    value={canal.nome}
                    onChange={e => changeCanal(canal.id, 'nome', e.target.value)}
                    placeholder="Nome do canal"
                    className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 py-1 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none transition"
                  />
                </td>

                {/* Dedução % */}
                <td className="px-2 py-1.5 border-r border-slate-200">
                  <div className="relative">
                    <input
                      type="number"
                      min="0" max="100" step="0.5"
                      value={canal.deducao}
                      onChange={e => changeCanal(canal.id, 'deducao', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 pr-5 py-1 text-slate-900 text-xs text-center focus:outline-none transition"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">%</span>
                  </div>
                </td>

                {/* Lead time */}
                <td className="px-2 py-1.5 border-r border-slate-200">
                  <input
                    type="number"
                    min="0" max="60"
                    value={canal.leadTime}
                    onChange={e => changeCanal(canal.id, 'leadTime', e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 py-1 text-slate-900 text-xs text-center focus:outline-none transition"
                  />
                </td>

                {/* Total do ano */}
                <td className="px-2 py-1.5 border-r border-slate-200">
                  <MoneyCell
                    value={totalCanal(canal)}
                    onChange={v => changeTotalAno(canal.id, v)}
                  />
                </td>

                {/* Monthly values — only visible months */}
                {visibleMeses.map((mesIdx, col) => (
                  <td
                    key={mesIdx}
                    className={`px-1 py-1 ${mesIdx === mesAtual ? 'bg-blue-50/50' : ''} ${col < visibleMeses.length - 1 ? 'border-r border-slate-200/50' : ''}`}
                  >
                    <MoneyCell
                      value={canal.meses[mesIdx]}
                      onChange={v => changeMesValor(canal.id, mesIdx, v)}
                    />
                  </td>
                ))}

                {/* Remove */}
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => removeCanal(canal.id)}
                    className="text-slate-400 hover:text-red-400 transition text-sm"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info do mês atual */}
      {canais.length > 0 && (
        <div className="mt-3 flex gap-3 flex-wrap text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-700/50 inline-block"></span>
            Coluna destacada = {MESES_FULL[mesAtual]} (mês atual)
          </span>
          <span>· Coluna destacada = mês atual · Clique em qualquer célula para editar</span>
        </div>
      )}

      {/* Navigation */}
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
