import React, { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { gerarFluxoMensal } from '../utils/gerarFluxoMensal'

const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function parseBRL(str) {
  if (str === '' || str === undefined || str === null) return 0
  const s = String(str).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  return parseFloat(s) || 0
}

function fmtBRL(v) {
  if (!v) return ''
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}


function brl(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function NumCell({ value, bold, negColor }) {
  const n = Number(value) || 0
  const color = n > 0 ? 'text-emerald-600' : n < 0 ? 'text-red-600' : 'text-slate-400'
  return <td className={`px-2 py-2 text-right text-xs ${bold ? 'font-bold' : ''} ${negColor ? color : 'text-slate-700'}`}>{brl(n)}</td>
}

export default function StepFluxoMensal({ data, updateData, back, restart, className }) {
  const fluxo = useMemo(() => gerarFluxoMensal(data), [data])

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
    const emprestimos = data.emprestimos || []
    updateData('emprestimos', [
      ...emprestimos,
      { id: Date.now() + Math.random(), nome: form.nome || 'Empréstimo', principal, taxa, prazo, mesInicio },
    ])
    closeModal()
  }


  const totalEntradas = fluxo.entradasOperacionais.map((v, i) => v + fluxo.entradasNaoOp[i])
  const totalSaidas = fluxo.saidasOperacionais.map((v, i) => v + fluxo.saidasNaoOp[i])
  const totalEntradasAno = totalEntradas.reduce((s, v) => s + v, 0)
  const totalSaidasAno = totalSaidas.reduce((s, v) => s + v, 0)
  const saldoFinalAno = fluxo.saldoFinal[fluxo.saldoFinal.length - 1] ?? 0
  const mesesNegativos = fluxo.saldoFinal.filter(v => v < 0).length

  const rows = [
    { label: 'SALDO INICIAL DO CAIXA', values: fluxo.saldoInicialMes, highlight: true, bold: true },
    { label: 'ATIVIDADES OPERACIONAIS', header: true },
    { label: 'Recebimentos de Vendas', values: fluxo.recebimentosVendas, sub: true },
    { label: 'Entradas Operacionais', values: fluxo.entradasOperacionais, group: true, bold: true },
    { label: 'Impostos', values: fluxo.impostosPagamento, sub: true, expense: true },
    { label: 'Pagamento Fornecedores (CMV)', values: fluxo.pagamentoFornecedores, sub: true, expense: true },
    { label: 'Despesas Fixas', values: fluxo.despesasFixasMes, sub: true, expense: true },
    { label: 'Folha de Pagamento', values: fluxo.folhaPagamento, sub: true, expense: true },
    { label: 'Outros Fornecedores', values: fluxo.fornecedoresPag, sub: true, expense: true },
    { label: 'Saídas Operacionais', values: fluxo.saidasOperacionais, group: true, bold: true, expense: true },
    { label: 'Total Operacional', values: fluxo.totalOperacional, highlight: true, bold: true },
    { label: 'ATIVIDADES NÃO OPERACIONAIS', header: true },
    { label: 'Receitas Financeiras', values: fluxo.receitasFinanceirasMes, sub: true },
    { label: 'Despesas Financeiras', values: fluxo.despesasFinanceirasMes, sub: true, expense: true },
    { label: 'Recebimento de Empréstimos', values: fluxo.emprestimosEntradas, sub: true },
    { label: 'Amortização de Empréstimos', values: fluxo.emprestimosAmortizacoes, sub: true, expense: true },
    { label: 'Juros de Empréstimos', values: fluxo.emprestimosJuros, sub: true, expense: true },
    { label: 'Total Não Operacional', values: fluxo.totalNaoOperacional, group: true, bold: true },
    { label: 'SALDO DO MÊS', values: fluxo.saldoMes, highlight: true, bold: true },
    { label: 'SALDO FINAL DO CAIXA', values: fluxo.saldoFinal, highlight: true, bold: true },
  ]

  const handleExportExcel = () => {
    const aoa = [['Descrição', ...MESES_FULL.map((m) => m.substring(0, 3))]]
    rows.forEach((row) => {
      if (row.header) {
        aoa.push([row.label])
        return
      }
      aoa.push([row.label, ...(row.values || []).map(brl)])
    })
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Fluxo Mensal')
    XLSX.writeFile(wb, 'fluxo-de-caixa-mensal.xlsx')
  }

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">📊</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Fluxo de Caixa Mensal</h2>
        <p className="text-slate-500 text-sm">Projeção gerencial mensal a partir da DRE e premissas</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 max-w-4xl mx-auto">
        {[
          { label: 'Saldo Inicial', value: fluxo.saldoInicialMes[0] },
          { label: 'Total Entradas', value: totalEntradasAno },
          { label: 'Total Saídas', value: totalSaidasAno },
          { label: 'Saldo Final', value: saldoFinalAno },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm px-4 py-3 border-l-4 border-blue-500">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-sm font-semibold ${value < 0 ? 'text-red-600' : 'text-slate-900'}`}>{brl(value)}</p>
          </div>
        ))}
      </div>

      {mesesNegativos > 0 && (
        <div className="max-w-4xl mx-auto mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-amber-500 text-base mt-0.5">⚠️</span>
          <p className="text-amber-700 text-sm">
            Em <strong>{mesesNegativos} mês{mesesNegativos > 1 ? 'es' : ''}</strong> o saldo final ficará negativo.
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-blue-600 z-10 min-w-[200px] border-r border-blue-500">Descrição</th>
              {MESES_FULL.map((m, i) => (
                <th key={m} className={`text-center px-2 py-2.5 font-semibold min-w-[110px] ${i < 11 ? 'border-r border-blue-500' : ''}`}>{m.substring(0, 3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              if (row.header) {
                return (
                  <tr key={row.label} className="bg-blue-100">
                    <td className="px-3 py-2 text-xs font-bold text-blue-900 border-r border-blue-200" colSpan={13}>{row.label}</td>
                  </tr>
                )
              }
              const displayValue = (v) => (row.expense ? -v : v)
              const rowBg = row.highlight ? 'bg-blue-900 text-white' : row.group ? 'bg-blue-100' : idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
              return (
                <tr key={row.label} className={`border-t border-slate-200 ${rowBg}`}>
                  <td className={`sticky left-0 z-10 px-3 py-2 text-xs border-r border-slate-200 ${rowBg} ${row.highlight ? 'font-bold text-white' : row.bold ? 'font-bold text-slate-900' : row.sub ? 'text-slate-500 pl-6' : 'font-semibold text-slate-700'}`}>
                    {row.label}
                  </td>
                  {(row.values || []).map((v, i) => (
                    <NumCell key={i} value={displayValue(v)} bold={row.bold || row.highlight} negColor />
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 mt-4 max-w-lg mx-auto">
        <button onClick={back} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition font-medium text-sm">← Voltar</button>
        <button onClick={handleExportExcel} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20 text-sm">📥 Excel</button>
        <button onClick={restart} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm">🔄 Recomeçar</button>
      </div>

      <div className="max-w-lg mx-auto mt-3">
        <button
          onClick={openModal}
          className="w-full py-3 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition font-medium text-sm"
        >
          + Tomar Empréstimo
        </button>
      </div>

      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tomar Empréstimo</h3>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mês da tomada</label>
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
