import { useState, useEffect } from 'react'

export default function AnimatedProgressBar({
  value = 0,        // Valor por defecto
  max = 100,        // Valor por defecto
  label = '',
  targetLabel = '',
  color = 'emerald',
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0)

  // Validación segura de los valores
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
  const safeMax = typeof max === 'number' && !isNaN(max) && max > 0 ? max : 100
  const percentage = Math.min((safeValue / safeMax) * 100, 100)

  const colorClasses = {
    emerald: {
      bar: 'from-emerald-600 to-emerald-400',
      glow: 'shadow-emerald-500/20',
      text: 'text-emerald-400',
      bg: 'bg-emerald-950',
    },
    amber: {
      bar: 'from-amber-600 to-amber-400',
      glow: 'shadow-amber-500/20',
      text: 'text-amber-400',
      bg: 'bg-amber-950',
    },
    blue: {
      bar: 'from-blue-600 to-blue-400',
      glow: 'shadow-blue-500/20',
      text: 'text-blue-400',
      bg: 'bg-blue-950',
    },
  }

  const colors = colorClasses[color] || colorClasses.emerald

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          {targetLabel && (
            <span className="text-xs text-gray-500">Objetivo: {targetLabel}</span>
          )}
          <span className={`text-sm font-bold ${colors.text}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div className={`h-3 ${colors.bg} rounded-full overflow-hidden relative`}>
        {/* Patrón shimmer en el fondo */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
        
        {/* Barra principal */}
        <div
          className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-1000 ease-out relative shadow-lg ${colors.glow}`}
          style={{ width: `${animatedWidth}%` }}
        >
          {/* Efecto de brillo en movimiento */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}