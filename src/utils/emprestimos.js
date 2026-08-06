function parseNumber(v) {
  return Number(v) || 0
}

export function calcularEmprestimos(emprestimos = []) {
  const entradas = Array(12).fill(0)
  const amortizacoes = Array(12).fill(0)
  const juros = Array(12).fill(0)

  emprestimos.forEach((e) => {
    const principal = parseNumber(e.principal)
    const prazo = Math.max(1, parseNumber(e.prazo))
    const taxa = parseNumber(e.taxa) / 100
    const mesInicio = Math.max(0, Math.min(11, parseNumber(e.mesInicio)))

    if (principal <= 0) return

    entradas[mesInicio] += principal

    const amortizacaoMensal = principal / prazo
    let saldo = principal

    for (let k = 0; k < prazo; k++) {
      const mes = mesInicio + k
      if (mes >= 12) break

      const jurosMes = saldo * taxa
      const amortMes = Math.min(amortizacaoMensal, saldo)

      juros[mes] += jurosMes
      amortizacoes[mes] += amortMes
      saldo -= amortMes
    }
  })

  return { entradas, amortizacoes, juros }
}
