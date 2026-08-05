import * as XLSX from 'xlsx'
import { gerarFluxoDiario } from './gerarFluxo'

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export function exportarExcel(data) {
  const wb = XLSX.utils.book_new()
  const hoje    = new Date()
  const mesBase = hoje.getMonth()
  const anoBase = hoje.getFullYear()

  for (let offset = 0; offset < 3; offset++) {
    // Chained saldo inicial
    let saldoInicial = Number(data.saldoInicial) || 0
    for (let o = 0; o < offset; o++) {
      const m = (mesBase + o) % 12
      const a = anoBase + Math.floor((mesBase + o) / 12)
      const { dias: d } = gerarFluxoDiario({ ...data, saldoInicial }, { targetMes: m, targetAno: a })
      saldoInicial = d[d.length - 1]?.saldoAcumulado || 0
    }

    const mesSel = (mesBase + offset) % 12
    const anoSel = anoBase + Math.floor((mesBase + offset) / 12)
    const { dias, diasNoMes } = gerarFluxoDiario({ ...data, saldoInicial }, { targetMes: mesSel, targetAno: anoSel })

    const dayNums = Array.from({ length: diasNoMes }, (_, i) => i + 1)
    const rows = []

    const addRow = (label, values, total) =>
      rows.push([label, ...(values || Array(diasNoMes).fill('')), total ?? ''])

    const sum = (arr) => (arr || []).reduce((s, v) => s + (Number(v) || 0), 0)

    // Header row
    rows.push(['CATEGORIA', ...dayNums, 'TOTAL'])

    // Saldos
    addRow('SALDO INICIAL DO CAIXA', dias.map(d => d.saldoInicialDia), saldoInicial)
    addRow('SALDO FINAL', dias.map(d => d.saldoAcumulado), dias[dias.length - 1]?.saldoAcumulado || 0)

    rows.push([])
    rows.push(['ATIVIDADES OPERACIONAIS'])

    // Entradas operacionais
    const entMap = new Map()
    dias.forEach(d => d.entradas.forEach(e => {
      if (!entMap.has(e.descricao)) entMap.set(e.descricao, Array(diasNoMes).fill(0))
      entMap.get(e.descricao)[d.dia - 1] += e.valor
    }))
    const entTotais = dias.map(d => d.totalEntradas)
    addRow('ENTRADAS', entTotais, sum(entTotais))
    entMap.forEach((values, label) => addRow(`  ${label}`, values, sum(values)))

    // Saídas operacionais
    const saidMap = new Map()
    dias.forEach(d => d.saidas.forEach(s => {
      if (!saidMap.has(s.descricao)) saidMap.set(s.descricao, Array(diasNoMes).fill(0))
      saidMap.get(s.descricao)[d.dia - 1] += s.valor
    }))
    const saidTotais = dias.map(d => d.totalSaidas)
    addRow('SAÍDAS', saidTotais, sum(saidTotais))
    saidMap.forEach((values, label) => addRow(`  ${label}`, values, sum(values)))
    const totalOp = dias.map(d => d.totalEntradas - d.totalSaidas)
    addRow('TOTAL OPERACIONAL', totalOp, sum(totalOp))

    rows.push([])
    rows.push(['ATIVIDADES NÃO OPERACIONAIS'])

    // Entradas não-op
    const naoEntMap = new Map()
    dias.forEach(d => (d.entradasNaoOp || []).forEach(e => {
      if (!naoEntMap.has(e.descricao)) naoEntMap.set(e.descricao, Array(diasNoMes).fill(0))
      naoEntMap.get(e.descricao)[d.dia - 1] += e.valor
    }))
    const naoEntTotais = dias.map(d => d.totalEntNaoOp || 0)
    addRow('ENTRADAS', naoEntTotais, sum(naoEntTotais))
    naoEntMap.forEach((values, label) => addRow(`  ${label}`, values, sum(values)))

    // Saídas não-op
    const naoSaidMap = new Map()
    dias.forEach(d => (d.saidasNaoOp || []).forEach(s => {
      if (!naoSaidMap.has(s.descricao)) naoSaidMap.set(s.descricao, Array(diasNoMes).fill(0))
      naoSaidMap.get(s.descricao)[d.dia - 1] += s.valor
    }))
    const naoSaidTotais = dias.map(d => d.totalSaidNaoOp || 0)
    addRow('SAÍDAS', naoSaidTotais, sum(naoSaidTotais))
    naoSaidMap.forEach((values, label) => addRow(`  ${label}`, values, sum(values)))
    const totalNaoOp = dias.map(d => (d.totalEntNaoOp || 0) - (d.totalSaidNaoOp || 0))
    addRow('TOTAL NÃO OPERACIONAL', totalNaoOp, sum(totalNaoOp))

    // Saldo do dia
    addRow('SALDO DO DIA', dias.map(d => d.saldoDia), sum(dias.map(d => d.saldoDia)))

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Column widths
    ws['!cols'] = [{ wch: 28 }, ...Array(diasNoMes).fill({ wch: 8 }), { wch: 12 }]

    XLSX.utils.book_append_sheet(wb, ws, MESES_PT[mesSel])
  }

  XLSX.writeFile(wb, 'fluxo-de-caixa.xlsx')
}
