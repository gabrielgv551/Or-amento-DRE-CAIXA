import React from 'react'
import Card from '../components/Card'
import InputMoney from '../components/InputMoney'

export default function StepSaldo({ data, updateData, next, back, className }) {
  return (
    <div className={`w-full max-w-md ${className}`}>
      <Card className="p-8">
        <div className="text-4xl mb-4 text-center">🏦</div>
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Saldo Inicial</h2>
        <p className="text-slate-500 text-sm text-center mb-8">
          Quanto você tem disponível hoje em conta corrente + caixa?
        </p>

        <InputMoney
          label="Saldo disponível agora"
          value={data.saldoInicial}
          onChange={(v) => updateData('saldoInicial', v)}
          placeholder="0,00"
        />

        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3">
          <p className="text-xs text-blue-700">
            💡 <strong>Dica:</strong> Some o saldo de todas as contas bancárias e o dinheiro físico disponível.
          </p>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={back}
            className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium"
          >
            ← Voltar
          </button>
          <button
            onClick={next}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20"
          >
            Próximo →
          </button>
        </div>
      </Card>
    </div>
  )
}
