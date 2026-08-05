import React from 'react'

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtBRL(v) {
  if (!v) return ''
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function StepImpostos({ data, updateData, next, back, className }) {
  const canais = data.canais || []
  const visibleMeses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  const changeAliquota = (id, value) => {
    updateData('canais', canais.map(c => c.id === id ? { ...c, aliquota: value } : c))
  }

  const impostoMes = (canal, mesIdx) => {
    const faturamento = Number(canal.meses?.[mesIdx]) || 0
    const aliquota = Number(canal.aliquota) || 0
    return Math.round(faturamento * aliquota / 100)
  }

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🏛️</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Impostos</h2>
        <p className="text-slate-500 text-sm">Informe a alíquota de imposto por canal</p>
      </div>

      {/* Spreadsheet table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-blue-600 z-10 min-w-[160px] border-r border-blue-500 text-white">
                Canal
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[100px] border-r border-blue-500 text-white bg-blue-600">
                Alíquota (%)
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[100px] border-r border-blue-500 text-white bg-blue-600">
                Total do Ano
              </th>
              {visibleMeses.map((i, col) => (
                <th
                  key={i}
                  className={`text-center px-1 py-2.5 font-semibold min-w-[120px] bg-blue-600 text-white ${
                    col < visibleMeses.length - 1 ? 'border-r border-blue-500' : ''
                  }`}
                >
                  {MESES_FULL[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {canais.length === 0 && (
              <tr>
                <td colSpan={visibleMeses.length + 3} className="text-center py-10 text-slate-400 text-sm">
                  Nenhum canal cadastrado. Volte e adicione canais no passo anterior.
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
                  <span className="text-xs font-medium text-slate-700">{canal.nome}</span>
                </td>

                {/* Alíquota % */}
                <td className="px-2 py-1.5 border-r border-slate-200">
                  <div className="relative">
                    <input
                      type="number"
                      min="0" max="100" step="0.5"
                      value={canal.aliquota || '0'}
                      onChange={e => changeAliquota(canal.id, e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-slate-100 rounded px-2 pr-5 py-1 text-slate-900 text-xs text-center focus:outline-none transition"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">%</span>
                  </div>
                </td>

                {/* Total do Ano = alíquota */}
                <td className="px-2 py-1.5 border-r border-slate-200 text-center">
                  <span className="text-xs font-medium text-slate-700">{canal.aliquota || '0'}%</span>
                </td>

                {/* Monthly tax values */}
                {visibleMeses.map((mesIdx, col) => (
                  <td
                    key={mesIdx}
                    className={`px-1 py-1 text-center text-xs text-slate-700 ${col < visibleMeses.length - 1 ? 'border-r border-slate-200/50' : ''}`}
                  >
                    {fmtBRL(impostoMes(canal, mesIdx))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      {canais.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          O imposto mensal é calculado automaticamente sobre o faturamento bruto de cada canal.
        </p>
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
