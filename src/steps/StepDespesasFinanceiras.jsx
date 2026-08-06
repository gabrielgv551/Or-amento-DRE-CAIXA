import React, { useRef, useState } from 'react'

const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const SUGESTOES_DESPESAS = [
  { nome: 'Juros bancários' },
]

const SUGESTOES_RECEITAS = [
  { nome: 'Receitas financeiras' },
]

const emptyItem = (nome = '') => ({
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

function TabelaMensal({ titulo, cor, itens, onUpdate, sugestoes, placeholderNova }) {
  const getMeses = (d) => Array.isArray(d.meses) ? d.meses : Array(12).fill(0)

  const add = (nome = '') => onUpdate([...itens, emptyItem(nome)])
  const remove = (id) => onUpdate(itens.filter(d => d.id !== id))
  const change = (id, field, value) =>
    onUpdate(itens.map(d => d.id === id ? { ...d, [field]: value } : d))

  const changeMes = (id, mesIdx, valor) =>
    onUpdate(itens.map(d => {
      if (d.id !== id) return d
      const meses = [...getMeses(d)]
      meses[mesIdx] = valor
      return { ...d, meses }
    }))

  const changeTotalAno = (id, total) => {
    const base = Math.floor(total / 12)
    const resto = total - base * 12
    const meses = Array(12).fill(base).map((v, i) => (i < resto ? v + 1 : v))
    onUpdate(itens.map(d => d.id === id ? { ...d, meses } : d))
  }

  const totalAno = (d) => getMeses(d).reduce((s, v) => s + (Number(v) || 0), 0)
  const totalMes = (mesIdx) => itens.reduce((s, d) => s + (Number(getMeses(d)[mesIdx]) || 0), 0)
  const totalGeral = () => itens.reduce((s, d) => s + totalAno(d), 0)
  const jaAdicionado = (nome) => itens.some(d => d.nome === nome)

  const bgHeader = cor === 'green' ? 'bg-emerald-600' : 'bg-blue-600'

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-700 mb-2">{titulo}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {sugestoes.map(s => (
          <button
            key={s.nome}
            onClick={() => !jaAdicionado(s.nome) && add(s.nome)}
            disabled={jaAdicionado(s.nome)}
            className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
              jaAdicionado(s.nome)
                ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-default'
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
          + {placeholderNova}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-slate-700 text-xs">
              <th className={`text-left px-3 py-2.5 font-semibold sticky left-0 ${bgHeader} z-10 min-w-[160px] border-r border-white/20 text-white`}>
                Conta
              </th>
              <th className={`text-center px-2 py-2.5 font-semibold min-w-[100px] border-r border-white/20 text-white ${bgHeader}`}>
                Total do Ano
              </th>
              {MESES_FULL.map((m, i) => (
                <th
                  key={m}
                  className={`text-center px-1 py-2.5 font-semibold min-w-[110px] ${bgHeader} text-white ${
                    i < 11 ? 'border-r border-white/20' : ''
                  }`}
                >
                  {m.substring(0, 3)}
                </th>
              ))}
              <th className={`w-8 ${bgHeader}`}></th>
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 && (
              <tr>
                <td colSpan={15} className="text-center py-6 text-slate-400 text-sm">
                  Adicione usando os botões acima
                </td>
              </tr>
            )}
            {itens.map((d, rowIdx) => (
              <tr
                key={d.id}
                className={`border-t border-slate-200 ${rowIdx % 2 === 0 ? 'bg-slate-50/50' : 'bg-slate-50/30'} hover:bg-slate-100 transition`}
              >
                <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10 border-r border-slate-200">
                  <input
                    type="text"
                    value={d.nome}
                    onChange={e => change(d.id, 'nome', e.target.value)}
                    placeholder="Nome da conta"
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
            {itens.length > 0 && (
              <tr className="border-t-2 border-slate-200 bg-slate-100 font-semibold">
                <td className="px-3 py-2 sticky left-0 bg-inherit z-10 border-r border-slate-200 text-xs text-slate-700">
                  Total
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
    </div>
  )
}

export default function StepDespesasFinanceiras({ data, updateData, next, back, className }) {
  const despesas = data.outros || []
  const receitas = data.receitasFinanceiras || []
  const emprestimos = data.emprestimos || []

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', principal: '', prazo: 12, taxa: '', mesInicio: 0 })

  const openModal = () => {
    setForm({ nome: '', principal: '', prazo: 12, taxa: '', mesInicio: 0 })
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = () => {
    const principal = parseBRL(form.principal)
    const taxa = Number(String(form.taxa).replace(',', '.')) || 0
    const prazo = Math.max(1, Number(form.prazo) || 1)
    const mesInicio = Math.max(0, Math.min(11, Number(form.mesInicio) || 0))
    if (principal <= 0) return
    updateData('emprestimos', [
      ...emprestimos,
      { id: Date.now() + Math.random(), nome: form.nome || 'Empréstimo', principal, taxa, prazo, mesInicio },
    ])
    closeModal()
  }

  const removeEmprestimo = (id) => updateData('emprestimos', emprestimos.filter(e => e.id !== id))

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">💳</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Despesas Financeiras</h2>
        <p className="text-slate-500 text-sm">Juros bancários, receitas financeiras e outras contas</p>
      </div>

      <TabelaMensal
        titulo="Despesas"
        cor="blue"
        itens={despesas}
        onUpdate={(v) => updateData('outros', v)}
        sugestoes={SUGESTOES_DESPESAS}
        placeholderNova="Nova despesa financeira"
      />

      <TabelaMensal
        titulo="Receitas"
        cor="green"
        itens={receitas}
        onUpdate={(v) => updateData('receitasFinanceiras', v)}
        sugestoes={SUGESTOES_RECEITAS}
        placeholderNova="Nova receita financeira"
      />

      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">Empréstimos</h3>
          <button
            onClick={openModal}
            className="text-xs px-3 py-1.5 rounded-full border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition font-medium"
          >
            + Simular empréstimo
          </button>
        </div>
        {emprestimos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum empréstimo simulado.</p>
        ) : (
          <div className="space-y-2">
            {emprestimos.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{e.nome}</p>
                  <p className="text-xs text-slate-500">
                    {fmtBRL(e.principal)} · {e.prazo}x · {Number(e.taxa).toLocaleString('pt-BR')} % a.m. · início {MESES_FULL[e.mesInicio]}
                  </p>
                </div>
                <button
                  onClick={() => removeEmprestimo(e.id)}
                  className="text-slate-400 hover:text-red-400 transition text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5 max-w-lg mx-auto">
        <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm">
          ← Voltar
        </button>
        <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm">
          Próximo →
        </button>
      </div>

      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Simular empréstimo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => updateForm('nome', e.target.value)}
                  placeholder="Ex: Empréstimo bancário"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor do empréstimo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400">R$</span>
                    <input
                      type="text"
                      value={form.principal}
                      onChange={e => updateForm('principal', e.target.value)}
                      placeholder="0,00"
                      className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={form.prazo}
                    onChange={e => updateForm('prazo', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taxa de juros mensal</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.taxa}
                      onChange={e => updateForm('taxa', e.target.value)}
                      placeholder="0,00"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mês de início</label>
                  <select
                    value={form.mesInicio}
                    onChange={e => updateForm('mesInicio', Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {MESES_FULL.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm">
                Salvar empréstimo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
