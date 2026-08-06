import React, { useState, useEffect, useRef } from 'react'
import StepWelcome from './steps/StepWelcome'
import StepFaturamento from './steps/StepFaturamento'
import StepCustos from './steps/StepCustos'
import StepFornecedores from './steps/StepFornecedores'
import StepDespesasFixas from './steps/StepDespesasFixas'
import StepDespesasFinanceiras from './steps/StepDespesasFinanceiras'
import StepRegimeFiscal from './steps/StepRegimeFiscal'
import StepDreFluxo from './steps/StepDreFluxo'
import StepPremissasCaixa from './steps/StepPremissasCaixa'
import StepMargem from './steps/StepMargem'
import StepDre from './steps/StepDre'
import StepPmv from './steps/StepPmv'
import ProgressBar from './components/ProgressBar'
import { loadStorage, saveStorage } from './utils/storage'

const STEPS = [
  'Boas-vindas',
  'Faturamento',
  'Custos',
  'Despesas Variáveis',
  'Despesas Fixas',
  'Despesas Financeiras',
  'Regime Fiscal',
  'DRE',
  'Premissas Caixa',
]

const initialData = {
  saldoInicial: '',
  canais: [],
  devolucao: Array(12).fill(0),
  deducaoDevolucao: '0',
  fornecedores: [],
  dividas: [],
  outros: [],
  receitasFinanceiras: [],
  naoOperacional: { entradas: [], saidas: [] },
  despesasVariaveis: { ads: {}, frete: {}, comissao: {} },
  despesasFixas: [],
  custos: {},
  regimeFiscal: 'lucroPresumido',
  premissasCaixa: {
    pmr: 30,
    pmp: 30,
    coberturaEstoque: 30,
    recolhimentoImpostos: 'mesmoMes',
    pagamentoFolha: 'mesSeguinte',
  },
}

function normalizeData(raw) {
  const data = { ...initialData, ...(raw || {}) }
  data.despesasFixas = (data.despesasFixas || []).map(d => ({
    ...d,
    meses: Array.isArray(d.meses) ? d.meses : Array(12).fill(0),
  }))
  data.outros = (data.outros || []).map(d => ({
    ...d,
    meses: Array.isArray(d.meses) ? d.meses : Array(12).fill(0),
  }))
  data.receitasFinanceiras = (data.receitasFinanceiras || []).map(d => ({
    ...d,
    meses: Array.isArray(d.meses) ? d.meses : Array(12).fill(0),
  }))
  data.premissasCaixa = {
    pmr: 30,
    pmp: 30,
    coberturaEstoque: 30,
    recolhimentoImpostos: 'mesmoMes',
    pagamentoFolha: 'mesSeguinte',
    ...(data.premissasCaixa || {}),
  }
  return data
}

export default function App() {
  const [step, setStep] = useState(() => {
    const saved = loadStorage('epfc_step', 0)
    return Number(saved) >= 0 && Number(saved) < STEPS.length ? Number(saved) : 0
  })
  const [direction, setDirection] = useState('right')
  const [data, setData] = useState(() => normalizeData(loadStorage('epfc_data', initialData)))
  const [animKey, setAnimKey] = useState(0)
  const [mode, setMode] = useState(() => loadStorage('epfc_mode', 'fluxo'))

  useEffect(() => {
    saveStorage('epfc_data', data)
  }, [data])

  useEffect(() => {
    saveStorage('epfc_step', step)
  }, [step])

  useEffect(() => {
    saveStorage('epfc_mode', mode)
  }, [mode])

  const switchMode = (newMode) => {
    setMode(newMode)
    if (newMode === 'fluxo') setStep(0)
  }

  const goTo = (nextStep) => {
    setDirection(nextStep > step ? 'right' : 'left')
    setAnimKey(k => k + 1)
    setStep(nextStep)
  }

  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)
  const restart = () => {
    setData(initialData)
    goTo(0)
  }

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const [showQR, setShowQR] = useState(false)
  const qrRef = useRef(null)
  const SITE_URL = 'https://ecommerce-puro-fluxo-de-caixa-tasks.vercel.app/'

  useEffect(() => {
    const handler = (e) => { if (qrRef.current && !qrRef.current.contains(e.target)) setShowQR(false) }
    if (showQR) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showQR])

  const stepClass = direction === 'right' ? 'step-enter' : 'step-enter-back'

  const stepProps = { data, updateData, next, back, restart, setMode: switchMode }

  const stepComponents = [
    <StepWelcome key={animKey} className={stepClass} {...stepProps} />,
    <StepFaturamento key={animKey} className={stepClass} {...stepProps} />,
    <StepCustos key={animKey} className={stepClass} {...stepProps} />,
    <StepFornecedores key={animKey} className={stepClass} {...stepProps} />,
    <StepDespesasFixas key={animKey} className={stepClass} {...stepProps} />,
    <StepDespesasFinanceiras key={animKey} className={stepClass} {...stepProps} />,
    <StepRegimeFiscal key={animKey} className={stepClass} {...stepProps} />,
    <StepDreFluxo key={animKey} className={stepClass} {...stepProps} />,
    <StepPremissasCaixa key={animKey} className={stepClass} {...stepProps} />,
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #ffffff 60%, #eff6ff 100%)' }}>
      <header className="flex items-center justify-between py-5 px-6 border-b border-slate-200 relative bg-white/80 backdrop-blur">
        <div className="w-10" />
        <img src="/logo.png" alt="Ecommerce Puro" className="h-20 object-contain" />
        <div className="hidden sm:flex items-center gap-2 mr-4">
          <button
            onClick={() => switchMode('fluxo')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === 'fluxo'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}
          >
            Simulador de Orçamento, DRE / Caixa
          </button>
        </div>
        <div className="relative" ref={qrRef}>
          <button
            onClick={() => setShowQR(v => !v)}
            title="Gerar QR Code"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition flex items-center justify-center text-slate-500 hover:text-blue-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
              <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
              <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
              <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/>
            </svg>
          </button>
        </div>
      </header>
      {showQR && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowQR(false)} />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 sm:gap-5 p-3 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-2xl max-w-[92vw] max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <p className="text-lg sm:text-2xl font-bold text-slate-800 tracking-wide text-center">Acesse o Fluxo de Caixa</p>
            <p className="text-slate-500 text-sm sm:text-base -mt-1 text-center">Aponte a câmera do celular</p>
            <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-xl border border-slate-100 max-w-full">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(SITE_URL)}&bgcolor=ffffff&color=000000&margin=8`}
                alt="QR Code"
                className="rounded-xl w-full h-auto max-h-[30vh] sm:max-h-[45vh]"
              />
            </div>
            <p className="text-slate-400 text-xs sm:text-sm text-center break-all">{SITE_URL}</p>
            <button onClick={() => setShowQR(false)} className="px-6 sm:px-8 py-2 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition text-sm">
              Fechar
            </button>
          </div>
        </>
      )}
      {mode === 'fluxo' && step > 0 && step < STEPS.length && (
        <ProgressBar current={step} total={STEPS.length - 1} labels={STEPS.slice(1)} />
      )}
      <div className="flex-1 flex items-center justify-center p-4">
        {mode === 'fluxo' ? (
          stepComponents[step]
        ) : mode === 'dre' ? (
          <StepDre key={animKey} className={stepClass} back={() => switchMode('fluxo')} onGoToPmv={() => switchMode('pmv')} />
        ) : mode === 'pmv' ? (
          <StepPmv key={animKey} className={stepClass} back={() => switchMode('dre')} />
        ) : (
          <StepMargem key={animKey} className={stepClass} back={() => switchMode('fluxo')} />
        )}
      </div>
    </div>
  )
}
