import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-lg ${className}`}>
      {children}
    </div>
  )
}
