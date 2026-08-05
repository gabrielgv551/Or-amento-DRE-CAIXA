import React from 'react'
import Card from '../components/Card'
import InputMoney from '../components/InputMoney'

const SUGEST_ENT = [
  { nome: 'Empréstimo bancário', icone: '🏦' },
  { nome: 'Aporte de sócio',    icone: '💼' },
]

const SUGEST_SAID = [
  { nome: 'Parcela Empréstimo', icone: '💳' },
  { nome: 'Cartão de Crédito',  icone: '💳' },
  { nome: 'Despesas Bancárias', icone: '🏦' },
  { nome: 'Juros',              icone: '📈' },
  { nome: 'Dividendos',         icone: '💰' },
  { nome: 'Imobilizado',        icone: '🏗️' },
  { nome: 'Investimentos',      icone: '📊' },
]

const emptyEnt  = (nome = '') => ({ id: Date.now() + Math.random(), nome, valor: '', diaRecebimento: '' })
const emptySaid = (nome = '') => ({ id: Date.now() + Math.random(), nome, valor: '', diaVencimento: '' })

export default function StepNaoOperacional({ data, updateData, next, back, className }) {
  const naoOp   = data.naoOperacional || { entradas: [], saidas: [] }
  const entradas = naoOp.entradas || []
  const saidas   = naoOp.saidas   || []

  const patch = (key, val) => updateData('naoOperacional', { ...naoOp, [key]: val })

  const addEnt    = (nome = '') => patch('entradas', [...entradas, emptyEnt(nome)])
  const removeEnt = (id)        => patch('entradas', entradas.filter(e => e.id !== id))
  const changeEnt = (id, f, v)  => patch('entradas', entradas.map(e => e.id === id ? { ...e, [f]: v } : e))

  const addSaid    = (nome = '') => patch('saidas', [...saidas, emptySaid(nome)])
  const removeSaid = (id)        => patch('saidas', saidas.filter(s => s.id !== id))
  const changeSaid = (id, f, v)  => patch('saidas', saidas.map(s => s.id === id ? { ...s, [f]: v } : s))

  const jaTemEnt  = (nome) => entradas.some(e => e.nome === nome)
  const jaTemSaid = (nome) => saidas.some(s => s.nome === nome)

  const inputBase = 'w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2'

  return (
    <div className={`w-full max-w-lg ${className}`}>
      <Card className="p-8">
        <div className="text-4xl mb-4 text-center">🏦</div>
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Atividades Não Operacionais</h2>
        <p className="text-slate-500 text-sm text-center mb-6">
          Empréstimos, investimentos, dividendos, despesas bancárias...
        </p>

        {/* ── ENTRADAS ────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Entradas</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGEST_ENT.map(s => (
              <button key={s.nome} onClick={() => !jaTemEnt(s.nome) && addEnt(s.nome)} disabled={jaTemEnt(s.nome)}
                className={`text-xs px-3 py-1.5 rounded-full border transition font-medium flex items-center gap-1 ${
                  jaTemEnt(s.nome)
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700 cursor-default'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-slate-900'
                }`}>
                {s.icone} {s.nome} {jaTemEnt(s.nome) ? '✓' : '+'}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {entradas.length === 0 && (
              <div className="text-center py-4 text-slate-600 text-xs">Sem entradas não operacionais</div>
            )}
            {entradas.map(e => (
              <div key={e.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="Ex: Empréstimo banco" value={e.nome}
                    onChange={ev => changeEnt(e.id, 'nome', ev.target.value)}
                    className="flex-1 bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button onClick={() => removeEnt(e.id)} className="text-slate-500 hover:text-red-600 transition text-lg w-8 h-8 flex items-center justify-center">✕</button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InputMoney value={e.valor} onChange={v => changeEnt(e.id, 'valor', v)} placeholder="0,00" />
                  </div>
                  <div className="relative w-24">
                    <input type="number" min="1" max="31" placeholder="Dia" value={e.diaRecebimento}
                      onChange={ev => changeEnt(e.id, 'diaRecebimento', ev.target.value)}
                      className={`${inputBase} focus:ring-emerald-500`} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">dia</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => addEnt()}
            className="w-full mt-2 py-2 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-slate-900 hover:border-emerald-500 transition text-sm font-medium flex items-center justify-center gap-2">
            <span className="text-lg">+</span> Adicionar entrada
          </button>
        </div>

        {/* ── SAÍDAS ──────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Saídas</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGEST_SAID.map(s => (
              <button key={s.nome} onClick={() => !jaTemSaid(s.nome) && addSaid(s.nome)} disabled={jaTemSaid(s.nome)}
                className={`text-xs px-3 py-1.5 rounded-full border transition font-medium flex items-center gap-1 ${
                  jaTemSaid(s.nome)
                    ? 'bg-red-100 border-red-300 text-red-700 cursor-default'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:border-red-500 hover:text-slate-900'
                }`}>
                {s.icone} {s.nome} {jaTemSaid(s.nome) ? '✓' : '+'}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {saidas.length === 0 && (
              <div className="text-center py-4 text-slate-600 text-xs">Sem saídas não operacionais</div>
            )}
            {saidas.map(s => (
              <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="Ex: Despesas Bancárias" value={s.nome}
                    onChange={ev => changeSaid(s.id, 'nome', ev.target.value)}
                    className="flex-1 bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <button onClick={() => removeSaid(s.id)} className="text-slate-500 hover:text-red-600 transition text-lg w-8 h-8 flex items-center justify-center">✕</button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InputMoney value={s.valor} onChange={v => changeSaid(s.id, 'valor', v)} placeholder="0,00" />
                  </div>
                  <div className="relative w-24">
                    <input type="number" min="1" max="31" placeholder="Dia" value={s.diaVencimento}
                      onChange={ev => changeSaid(s.id, 'diaVencimento', ev.target.value)}
                      className={`${inputBase} focus:ring-red-500`} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">dia</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => addSaid()}
            className="w-full mt-2 py-2 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-slate-900 hover:border-red-500 transition text-sm font-medium flex items-center justify-center gap-2">
            <span className="text-lg">+</span> Adicionar saída
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium">← Voltar</button>
          <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20">
            Gerar Fluxo de Caixa 🚀
          </button>
        </div>
      </Card>
    </div>
  )
}
