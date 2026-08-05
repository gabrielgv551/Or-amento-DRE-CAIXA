import React, { useState, useEffect } from 'react'

function fmtBRL(num) {
  if (num === '' || num === undefined || num === null) return ''
  const n = Number(num)
  if (isNaN(n)) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseRawToBRL(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  const n = parseFloat(digits) / 100
  return isNaN(n) ? 0 : n
}

export default function InputMoney({ value, onChange, placeholder = 'R$ 0,00', className = '', label = '', disabled = false }) {
  const [display, setDisplay] = useState('')
  const [focused, setFocused] = useState(false)

  const numericValue = Number(value || 0)

  useEffect(() => {
    if (!focused) {
      setDisplay(value ? fmtBRL(value) : '')
    }
  }, [value, focused])

  const handleChange = (e) => {
    const raw = e.target.value
    const num = parseRawToBRL(raw)
    setDisplay(fmtBRL(num))
    onChange(num)
  }

  const handleFocus = () => {
    setFocused(true)
    setDisplay(value ? fmtBRL(value) : '')
  }

  const handleBlur = () => {
    setFocused(false)
    setDisplay(value ? fmtBRL(value) : '')
  }

  return (
    <div className="relative">
      {label && <label className="block text-xs text-slate-500 mb-1 font-medium">{label}</label>}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-500 text-sm font-medium select-none">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder || '0,00'}
          className={`w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />
      </div>
    </div>
  )
}
