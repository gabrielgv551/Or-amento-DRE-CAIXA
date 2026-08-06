function parsePct(str) {
  const n = parseFloat(String(str || '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function shiftArray(arr, offset) {
  return arr.map((_, m) => {
    const src = m - offset
    return src >= 0 && src < 12 ? arr[src] : 0
  })
}

function calcImpostosPagamento(impostos, recolhimento) {
  if (recolhimento === 'trimestral') {
    return impostos.map((_, m) => {
      if (m % 3 !== 2) return 0
      let sum = 0
      for (let i = m - 2; i <= m; i++) sum += impostos[i] || 0
      return sum
    })
  }
  if (recolhimento === 'mesSeguinte') return shiftArray(impostos, 1)
  return impostos
}

export function gerarFluxoMensal(data) {
  const canais = data.canais || []
  const receitasFinanceiras = data.receitasFinanceiras || []
  const despesasFixas = data.despesasFixas || []
  const financeiras = data.outros || []
  const dv = data.despesasVariaveis || { ads: {}, frete: {}, comissao: {} }
  const custos = data.custos || {}
  const premissas = data.premissasCaixa || {}
  const pessoal = Number(data.pessoal?.total) || 0
  const dividas = data.dividas || []
  const fornecedores = data.fornecedores || []
  const naoOp = data.naoOperacional || { entradas: [], saidas: [] }
  const saldoInicial = Number(data.saldoInicial) || 0
  const devolucao = data.devolucao || Array(12).fill(0)

  const receitaBruta = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => s + (Number(c.meses?.[m]) || 0), 0)
  )

  const receitasFinanceirasMes = Array(12).fill(0).map((_, m) =>
    receitasFinanceiras.reduce((s, f) => s + (Number((f.meses || [])[m]) || 0), 0)
  )

  const receitaBrutaTotal = receitaBruta.map((v, i) => v + receitasFinanceirasMes[i])

  const impostos = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(c.aliquota) / 100
      return s + v * pct
    }, 0)
  )

  const cmv = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(custos[c.id]) / 100
      return s + v * pct
    }, 0)
  )

  const ads = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(dv.ads?.[c.id]) / 100
      return s + v * pct
    }, 0)
  )

  const frete = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(dv.frete?.[c.id]) / 100
      return s + v * pct
    }, 0)
  )

  const comissao = Array(12).fill(0).map((_, m) =>
    canais.reduce((s, c) => {
      const v = Number(c.meses?.[m]) || 0
      const pct = parsePct(dv.comissao?.[c.id]) / 100
      return s + v * pct
    }, 0)
  )

  const despesasVariaveis = ads.map((v, i) => v + frete[i] + comissao[i])

  const despesasFixasMes = Array(12).fill(0).map((_, m) =>
    despesasFixas.reduce((s, f) => s + (Number((f.meses || [])[m]) || 0), 0)
  )

  const despesasFinanceirasMes = Array(12).fill(0).map((_, m) =>
    financeiras.reduce((s, f) => s + (Number((f.meses || [])[m]) || 0), 0)
  )

  const folhaBase = Array(12).fill(pessoal)
  const folhaPagamento = premissas.pagamentoFolha === 'mesSeguinte'
    ? shiftArray(folhaBase, 1)
    : folhaBase

  const impostosPagamento = calcImpostosPagamento(impostos, premissas.recolhimentoImpostos)

  const pmrShift = Math.round((Number(premissas.pmr) || 0) / 30)
  const vendasLiquidas = receitaBrutaTotal.map((v, i) => v - (Number(devolucao[i]) || 0))
  const recebimentosVendas = shiftArray(vendasLiquidas, pmrShift)

  const pmpShift = Math.round((Number(premissas.pmp) || 0) / 30)
  const coberturaShift = Math.round((Number(premissas.coberturaEstoque) || 0) / 30)
  const netCompraShift = pmpShift - coberturaShift
  const pagamentoFornecedores = shiftArray(cmv, netCompraShift)

  const fornecedoresPag = Array(12).fill(0)
  fornecedores.forEach(f => {
    const valor = Number(f.valor) || Number(f.parcela) || Number(f.total) || 0
    if (valor <= 0) return
    for (let m = 0; m < 12; m++) fornecedoresPag[m] += valor
  })

  const dividasPag = Array(12).fill(0)
  dividas.forEach(d => {
    const parcela = Number(d.parcela) || 0
    const juros = parcela * (Number(d.juros) || 0) / 100
    const total = parcela + juros
    if (total <= 0) return
    for (let m = 0; m < 12; m++) dividasPag[m] += total
  })

  const entradasNaoOp = Array(12).fill(0)
  ;(naoOp.entradas || []).forEach(e => {
    const valor = Number(e.valor) || 0
    if (valor <= 0) return
    for (let m = 0; m < 12; m++) entradasNaoOp[m] += valor
  })

  const saidasNaoOp = Array(12).fill(0)
  ;(naoOp.saidas || []).forEach(s => {
    const valor = Number(s.valor) || 0
    if (valor <= 0) return
    for (let m = 0; m < 12; m++) saidasNaoOp[m] += valor
  })

  const entradasOperacionais = recebimentosVendas.map((v, i) => v + receitasFinanceirasMes[i])
  const saidasOperacionais = impostosPagamento.map((v, i) =>
    v + pagamentoFornecedores[i] + despesasVariaveis[i] + despesasFixasMes[i] + despesasFinanceirasMes[i] + folhaPagamento[i] + dividasPag[i] + fornecedoresPag[i]
  )
  const totalOperacional = entradasOperacionais.map((v, i) => v - saidasOperacionais[i])

  const totalNaoOperacional = entradasNaoOp.map((v, i) => v - saidasNaoOp[i])
  const saldoMes = totalOperacional.map((v, i) => v + totalNaoOperacional[i])

  const saldoFinal = []
  for (let m = 0; m < 12; m++) {
    saldoFinal[m] = (m === 0 ? saldoInicial : saldoFinal[m - 1]) + saldoMes[m]
  }

  const saldoInicialMes = Array(12).fill(0).map((_, m) => (m === 0 ? saldoInicial : saldoFinal[m - 1]))

  return {
    recebimentosVendas,
    receitasFinanceirasMes,
    entradasOperacionais,
    impostosPagamento,
    pagamentoFornecedores,
    despesasVariaveis,
    despesasFixasMes,
    despesasFinanceirasMes,
    folhaPagamento,
    dividasPag,
    fornecedoresPag,
    saidasOperacionais,
    totalOperacional,
    entradasNaoOp,
    saidasNaoOp,
    totalNaoOperacional,
    saldoMes,
    saldoInicialMes,
    saldoFinal,
  }
}
