import React from 'react'
import Card from '../components/Card'
import InputMoney from '../components/InputMoney'

const empty = () => ({ id: Date.now(), nome: '', parcela: '', juros: '', diaVencimento: '' })

export default function StepDividas({ data, updateData, next, back, className }) {
  const lista = data.dividas

  const add = () => updateData('dividas', [...lista, empty()])
  const remove = (id) => updateData('dividas', lista.filter(f => f.id !== id))
  const change = (id, field, value) => updateData('dividas', lista.map(f => f.id === id ? { ...f, [field]: value } : f))

  return (
    <div className={`w-full max-w-lg ${className}`}>
      <Card className="p-8">
        <div className="text-4xl mb-4 text-center">💳</div>
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Dívidas & Juros</h2>
        <p className="text-slate-500 text-sm text-center mb-6">
          Empréstimos, cartão de crédito, antecipações de recebíveis...
        </p>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {lista.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              Sem dívidas? Que inveja! 😄<br />
              <span className="text-slate-600">(pode pular esta etapa)</span>
            </div>
          )}
          {lista.map((d) => (
            <div key={d.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Ex: Empréstimo banco, cartão AMEX..."
                  value={d.nome}
                  onChange={e => change(d.id, 'nome', e.target.value)}
                  className="flex-1 bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => remove(d.id)} className="text-slate-500 hover:text-red-600 transition text-lg w-8 h-8 flex items-center justify-center">✕</button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <InputMoney
                    value={d.parcela}
                    onChange={v => change(d.id, 'parcela', v)}
                    placeholder="Parcela/mês"
                  />
                </div>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="% juros"
                    value={d.juros}
                    onChange={e => change(d.id, 'juros', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
                <div className="relative w-20">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Dia"
                    value={d.diaVencimento}
                    onChange={e => change(d.id, 'diaVencimento', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">dia</span>
                </div>
              </div>
              {d.parcela > 0 && d.juros > 0 && (
                <div className="text-xs text-amber-700/80 bg-amber-50 rounded-lg px-2 py-1">
                  🔥 Juros mensais: R$ {((d.parcela * d.juros) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={add}
          className="w-full mt-4 py-2.5 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-slate-900 hover:border-blue-400 transition text-sm font-medium flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> Adicionar dívida
        </button>

        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium">← Voltar</button>
          <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20">Próximo →</button>
        </div>
      </Card>
    </div>
  )
}
