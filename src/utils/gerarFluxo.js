// ─── Feriados nacionais BR 2025 e 2026 ───────────────────────────────────────
export const FERIADOS_BR = new Set([
  '2025-01-01','2025-03-03','2025-03-04','2025-04-18','2025-04-21',
  '2025-05-01','2025-06-19','2025-09-07','2025-10-12','2025-11-02',
  '2025-11-15','2025-11-20','2025-12-25',
  '2026-01-01','2026-02-16','2026-02-17','2026-04-03','2026-04-21',
  '2026-05-01','2026-06-04','2026-09-07','2026-10-12','2026-11-02',
  '2026-11-15','2026-11-20','2026-12-25',
])

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function isDiaUtil(date) {
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return false
  return !FERIADOS_BR.has(dateKey(date))
}

function ajustarParaDiaUtil(date) {
  const d = new Date(date)
  while (!isDiaUtil(d)) d.setDate(d.getDate() + 1)
  return d
}

function diasUteisMes(ano, mes) {
  const dias = []
  const d = new Date(ano, mes, 1)
  while (d.getMonth() === mes) {
    if (isDiaUtil(d)) dias.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dias
}

function getMesAnterior(ano, mes, offset) {
  let m = mes - offset
  let a = ano
  while (m < 0) { m += 12; a-- }
  return { ano: a, mes: m }
}

// ─── Despesas Variáveis: cálculo de parcelas (mesma lógica do Apps Script) ──────────
function calcParcelasVencimentosFluxo(baseDt, prazoStr) {
  const result = []
  const prazo  = String(prazoStr || '').trim().toUpperCase()
  if (!prazo || prazo.includes('VISTA')) { result.push(ajustarParaDiaUtil(new Date(baseDt))); return result }
  if (prazo.includes('/')) {
    prazo.split('/').forEach(p => {
      const dias = parseInt(p.trim())
      if (!isNaN(dias)) { const d = new Date(baseDt); d.setDate(d.getDate() + dias); result.push(ajustarParaDiaUtil(d)) }
    })
  } else {
    const dias = parseInt(prazo)
    if (!isNaN(dias)) { const d = new Date(baseDt); d.setDate(d.getDate() + dias); result.push(ajustarParaDiaUtil(d)) }
    else result.push(ajustarParaDiaUtil(new Date(baseDt)))
  }
  return result
}

function gerarPagamentosFornecedor(f) {
  const dt    = f.previsto ? new Date(f.previsto) : null
  const total = Number(f.total) || Number(f.valor) || 0   // suporta formato antigo
  const ato   = (Number(f.ato) || 0) / 100
  const prazo = String(f.prazo || 'VISTA').trim().toUpperCase()
  const nome  = f.nome || 'Fornecedor'
  if (!dt || isNaN(dt) || total <= 0) {
    // formato antigo: diaVencimento + valor
    return []
  }
  const result = []
  if (prazo.includes('VISTA') && ato === 0) {
    result.push({ data: ajustarParaDiaUtil(new Date(dt)), valor: total, descricao: nome })
    return result
  }
  if (ato > 0) {
    const valorAto  = total * ato
    const valorRest = total - valorAto
    result.push({ data: ajustarParaDiaUtil(new Date(dt)), valor: valorAto, descricao: `${nome} (ato)` })
    if (valorRest > 0 && !prazo.includes('VISTA')) {
      const vencs = calcParcelasVencimentosFluxo(dt, prazo)
      const vp    = valorRest / Math.max(vencs.length, 1)
      vencs.forEach((d, i) => result.push({ data: d, valor: vp, descricao: vencs.length > 1 ? `${nome} (${i+1}/${vencs.length})` : nome }))
    }
    return result
  }
  const vencs = calcParcelasVencimentosFluxo(dt, prazo)
  if (!vencs.length) return result
  const vp = total / vencs.length
  vencs.forEach((d, i) => result.push({ data: d, valor: vp, descricao: vencs.length > 1 ? `${nome} (${i+1}/${vencs.length})` : nome }))
  return result
}

// ─── Geração do fluxo ─────────────────────────────────────────────────────────
export function gerarFluxoDiario(data, { targetMes, targetAno } = {}) {
  const hoje     = new Date()
  const anoAtual = targetAno ?? hoje.getFullYear()
  const mesAtual = targetMes ?? hoje.getMonth()
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate()

  const canais = data.canais || []

  // entregas[dia] = [{ descricao, valor }, ...]
  const entregas = {}
  for (let i = 1; i <= diasNoMes; i++) entregas[i] = []

  const parsePct = (v) => {
    const n = parseFloat(String(v || '').replace(',', '.'))
    return isNaN(n) ? 0 : n
  }

  canais.forEach(canal => {
    const nome     = canal.nome || 'Canal'
    const deducao  = parsePct(canal.deducao) / 100
    const leadTime = Number(canal.leadTime) || 0

    // Resolve valor de venda bruta para um mês/ano específico
    // Suporta tanto nova estrutura (meses[12]) quanto legado (mes1/mes2/mes3)
    const getVendaMes = (ano, mes) => {
      if (Array.isArray(canal.meses) && ano === anoAtual) {
        return Number(canal.meses[mes]) || 0
      }
      // legado: usa média de mes1/mes2/mes3
      const vals = [
        Number(canal.mes1?.valor) || 0,
        Number(canal.mes2?.valor) || 0,
        Number(canal.mes3?.valor) || 0,
      ].filter(v => v > 0)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    }

    // Média dos meses preenchidos (para fallback)
    const mediaAnterior = (() => {
      if (Array.isArray(canal.meses)) {
        const filled = canal.meses.filter(v => Number(v) > 0)
        return filled.length ? filled.reduce((a, b) => a + Number(b), 0) / filled.length : 0
      }
      const vals = [canal.mes1?.valor, canal.mes2?.valor, canal.mes3?.valor]
        .map(Number).filter(v => v > 0)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    })()

    // Quantos meses para trás checar (lead time em dias / ~28 dias por mês + margem)
    const mesesParaOlhar = Math.min(Math.ceil(leadTime / 28) + 1, 3)

    // Mês atual + meses anteriores necessários
    for (let offset = 0; offset <= mesesParaOlhar; offset++) {
      const { ano, mes } = offset === 0
        ? { ano: anoAtual, mes: mesAtual }
        : getMesAnterior(anoAtual, mesAtual, offset)

      const vendaBruta = getVendaMes(ano, mes) || mediaAnterior
      if (vendaBruta <= 0) continue

      const diasU = diasUteisMes(ano, mes)
      if (diasU.length === 0) continue

      const recebDiario = (vendaBruta * (1 - deducao)) / diasU.length

      diasU.forEach(diaVenda => {
        const diaReceb = new Date(diaVenda)
        diaReceb.setDate(diaReceb.getDate() + leadTime)
        const diaVenc = ajustarParaDiaUtil(diaReceb)

        // Só registra se o recebimento cai no mês atual
        if (diaVenc.getFullYear() === anoAtual && diaVenc.getMonth() === mesAtual) {
          const d = diaVenc.getDate()
          entregas[d].push({ descricao: `Receb. ${nome}`, valor: recebDiario })
        }
      })
    }
  })

  // ─── Pré-computa impostos por dia ───────────────────────────────────────────
  const impostosPag = {}
  for (let i = 1; i <= diasNoMes; i++) impostosPag[i] = []

  canais.forEach(canal => {
    const nome     = canal.nome || 'Canal'
    const aliquota = parsePct(canal.aliquota) / 100
    if (aliquota <= 0) return

    const vendaBruta = (() => {
      if (Array.isArray(canal.meses)) return Number(canal.meses[mesAtual]) || 0
      const vals = [
        Number(canal.mes1?.valor) || 0,
        Number(canal.mes2?.valor) || 0,
        Number(canal.mes3?.valor) || 0,
      ].filter(v => v > 0)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    })()

    if (vendaBruta <= 0) return

    const impostoMensal = vendaBruta * aliquota
    const diasU = diasUteisMes(anoAtual, mesAtual)
    if (diasU.length === 0) return

    const impostoDiario = impostoMensal / diasU.length
    diasU.forEach(dia => {
      impostosPag[dia.getDate()].push({ descricao: `Imposto ${nome}`, valor: impostoDiario })
    })
  })

  // ─── Pré-computa devoluções por dia ─────────────────────────────────────────
  const devolucaoPag = {}
  for (let i = 1; i <= diasNoMes; i++) devolucaoPag[i] = []

  const devolucaoMes = Number(data.devolucao?.[mesAtual]) || 0
  if (devolucaoMes > 0) {
    const diasU = diasUteisMes(anoAtual, mesAtual)
    if (diasU.length > 0) {
      const devolucaoDiaria = devolucaoMes / diasU.length
      diasU.forEach(dia => {
        devolucaoPag[dia.getDate()].push({ descricao: 'Devolução', valor: devolucaoDiaria })
      })
    }
  }

  // ─── Pré-computa despesas variáveis (Ads e Frete) por dia ───────────────────
  const despesasVariaveisPag = {}
  for (let i = 1; i <= diasNoMes; i++) despesasVariaveisPag[i] = []

  const dv = data.despesasVariaveis || {}
  const adsPct = parsePct(dv.ads) / 100
  const fretePct = parsePct(dv.frete) / 100
  const rolMes = canais.reduce((s, c) => s + (Number(c.meses?.[mesAtual]) || 0), 0)

  if (rolMes > 0) {
    const diasU = diasUteisMes(anoAtual, mesAtual)
    if (diasU.length > 0) {
      if (adsPct > 0) {
        const adsDiario = (rolMes * adsPct) / diasU.length
        diasU.forEach(dia => despesasVariaveisPag[dia.getDate()].push({ descricao: 'Ads', valor: adsDiario }))
      }
      if (fretePct > 0) {
        const freteDiario = (rolMes * fretePct) / diasU.length
        diasU.forEach(dia => despesasVariaveisPag[dia.getDate()].push({ descricao: 'Frete', valor: freteDiario }))
      }
    }
  }

  // ─── Pré-computa pagamentos de fornecedores por dia ─────────────────────────
  const fornecPag = {}
  for (let i = 1; i <= diasNoMes; i++) fornecPag[i] = []

  data.fornecedores?.forEach(f => {
    const parcelas = gerarPagamentosFornecedor(f)
    if (parcelas.length) {
      // novo formato: usa calcParcelas
      parcelas.forEach(({ data: dt, valor, descricao }) => {
        if (dt.getFullYear() === anoAtual && dt.getMonth() === mesAtual)
          fornecPag[dt.getDate()].push({ descricao, valor })
      })
    } else {
      // fallback formato antigo (diaVencimento + valor)
      const dv = Number(f.diaVencimento)
      const vl = Number(f.valor) || 0
      if (dv >= 1 && dv <= diasNoMes && vl > 0)
        fornecPag[dv].push({ descricao: f.nome || 'Fornecedor', valor: vl })
    }
  })

  // ─── Monta array diário ───────────────────────────────────────────────────
  const dias = []
  let saldoAcumulado = Number(data.saldoInicial) || 0

  for (let d = 1; d <= diasNoMes; d++) {
    const saldoInicialDia = saldoAcumulado
    const entradas = [...entregas[d]]
    const saidas   = [...(fornecPag[d] || []), ...(impostosPag[d] || []), ...(devolucaoPag[d] || []), ...(despesasVariaveisPag[d] || [])]

    data.dividas?.forEach(div => {
      if (Number(div.diaVencimento) === d && Number(div.parcela) > 0) {
        const juros = Number(div.parcela) * (Number(div.juros) || 0) / 100
        const total = Number(div.parcela) + juros
        saidas.push({ descricao: (div.nome || 'Dívida') + (juros > 0 ? ' (+juros)' : ''), valor: total })
      }
    })

    const pessoal = data.pessoal
    if (pessoal && !Array.isArray(pessoal)) {
      if (Number(pessoal.diaPagamento) === d && Number(pessoal.total) > 0)
        saidas.push({ descricao: 'Folha de Pagamento', valor: Number(pessoal.total) })
    } else {
      ;(pessoal || []).forEach(p => {
        if (Number(p.diaPagamento) === d && Number(p.salario) > 0)
          saidas.push({ descricao: p.nome || 'Colaborador', valor: Number(p.salario) })
      })
    }

    data.outros?.forEach(o => {
      if (Number(o.diaVencimento) === d && Number(o.valor) > 0)
        saidas.push({ descricao: o.nome || 'Despesa', valor: Number(o.valor) })
    })

    const entradasNaoOp = []
    ;(data.naoOperacional?.entradas || []).forEach(e => {
      if (Number(e.diaRecebimento) === d && Number(e.valor) > 0)
        entradasNaoOp.push({ descricao: e.nome || 'Entrada N.Op.', valor: Number(e.valor) })
    })

    const saidasNaoOp = []
    ;(data.naoOperacional?.saidas || []).forEach(s => {
      if (Number(s.diaVencimento) === d && Number(s.valor) > 0)
        saidasNaoOp.push({ descricao: s.nome || 'Saída N.Op.', valor: Number(s.valor) })
    })

    const totalEntradas    = entradas.reduce((s, e) => s + e.valor, 0)
    const totalSaidas      = saidas.reduce((s, e) => s + e.valor, 0)
    const totalEntNaoOp    = entradasNaoOp.reduce((s, e) => s + e.valor, 0)
    const totalSaidNaoOp   = saidasNaoOp.reduce((s, e) => s + e.valor, 0)
    const saldoDia         = totalEntradas - totalSaidas + totalEntNaoOp - totalSaidNaoOp
    saldoAcumulado        += saldoDia

    dias.push({ dia: d, entradas, saidas, entradasNaoOp, saidasNaoOp,
      totalEntradas, totalSaidas, totalEntNaoOp, totalSaidNaoOp, saldoDia, saldoAcumulado, saldoInicialDia })
  }

  return { dias, diasNoMes, mes: mesAtual, ano: anoAtual }
}

export function brl(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
