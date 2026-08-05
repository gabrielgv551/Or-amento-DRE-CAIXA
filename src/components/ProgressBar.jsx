import React from 'react'

export default function ProgressBar({ current, total, labels }) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-6 pb-2">
      <div className="flex items-center justify-between mb-2">
        {labels.map((label, i) => {
          const stepNum = i + 1
          const done = stepNum < current
          const active = stepNum === current
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done
                  ? 'bg-blue-600 text-white'
                  : active
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {done ? '✓' : stepNum}
              </div>
              <span className={`mt-1 text-[10px] font-medium hidden sm:block transition-colors ${
                active ? 'text-blue-600' : done ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}
