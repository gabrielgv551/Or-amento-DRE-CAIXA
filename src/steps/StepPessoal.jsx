import React from 'react'
import Card from '../components/Card'
import InputMoney from '../components/InputMoney'

export default function StepPessoal({ data, updateData, next, back, className }) {
  const pessoal = data.pessoal || { total: '', diaPagamento: '5' }
  const patch = (field, value) => updateData('pessoal', { ...pessoal, [field]: value })

  return (
    <div className={`w-full max-w-lg ${className}`}>
      <Card className="p-8">
        <div className="text-4xl mb-4 text-center">👥</div>
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Pessoal & Folha</h2>
        <p className="text-slate-500 text-sm text-center mb-6">
          Total consolidado da folha — salários, pró-labore, freelancers
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
          <span className="text-amber-600 text-base mt-0.5">⚠️</span>
          <p className="text-amber-700 text-xs leading-relaxed">
            Inclua <strong>salários + encargos</strong> (FGTS, INSS patronal, férias, 13º, etc.)
            no valor total da folha.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Total da Folha Mensal
            </label>
            <InputMoney
              value={pessoal.total}
              onChange={v => patch('total', v)}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Dia de Pagamento
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 5"
                value={pessoal.diaPagamento}
                onChange={e => patch('diaPagamento', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">dia do mês</span>
            </div>
          </div>

          {Number(pessoal.total) > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-slate-700">Saída no dia {pessoal.diaPagamento || '—'}</span>
              <span className="font-bold text-slate-900">
                {Number(pessoal.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          )}

          {!pessoal.total && (
            <p className="text-center text-slate-600 text-xs pt-2">(pode pular se não tiver folha)</p>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium">← Voltar</button>
          <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20">Próximo →</button>
        </div>
      </Card>
    </div>
  )
}
