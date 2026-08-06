import React from 'react'

const OPTIONS = [
  {
    value: 'lucroPresumido',
    label: 'Lucro Presumido',
    desc: 'IRPJ 1,2% e CSLL 2,88% sobre a receita bruta',
  },
  {
    value: 'lucroReal',
    label: 'Lucro Real',
    desc: 'IRPJ 15% e CSLL 9% sobre o lucro operacional',
  },
]

export default function StepRegimeFiscal({ data, updateData, next, back, className }) {
  const regime = data.regimeFiscal || 'lucroPresumido'

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">⚖️</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Regime Fiscal</h2>
        <p className="text-slate-500 text-sm">Escolha o regime para cálculo de IRPJ e CSLL na DRE</p>
      </div>

      <div className="grid gap-4 max-w-xl mx-auto">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateData('regimeFiscal', opt.value)}
            className={`text-left rounded-2xl border-2 p-5 transition hover:shadow-lg ${
              regime === opt.value
                ? 'border-blue-500 bg-blue-50 shadow-blue-500/10'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{opt.label}</span>
              {regime === opt.value && <span className="text-blue-600 font-bold">✓</span>}
            </div>
            <p className="text-sm text-slate-500 mt-1">{opt.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-6 max-w-lg mx-auto">
        <button
          onClick={back}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm"
        >
          ← Voltar
        </button>
        <button
          onClick={next}
          className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm"
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}
