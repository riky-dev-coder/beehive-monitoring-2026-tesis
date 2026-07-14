import { useState, useEffect, useRef } from 'react'

export default function LiveDataCard({
  title,
  value,
  unit,
  icon,
  subtitle,
  trend,
  trendValue,
}) {
  const [previousValue, setPreviousValue] = useState(value)
  const cardRef = useRef(null)
  const isUpdating = value !== previousValue

  useEffect(() => {
    if (!isUpdating || !cardRef.current) {
      return
    }

    cardRef.current.classList.add('data-updated')
    const removeClassTimeout = setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.classList.remove('data-updated')
      }
    }, 1000)

    const timeout = setTimeout(() => {
      setPreviousValue(value)
    }, 500)

    return () => {
      clearTimeout(timeout)
      clearTimeout(removeClassTimeout)
    }
  }, [isUpdating, value])

  const trendIcon = {
    up: '↑',
    down: '↓',
    stable: '→',
  }

  const trendColor = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    stable: 'text-gray-400',
  }

  return (
    <div
      ref={cardRef}
      className="relative bg-[#0d1a1f] rounded-lg p-4 border border-gray-800/50 
                 transition-all duration-300 hover:border-gray-700/50 overflow-hidden"
    >
      {/* Línea superior animada cuando hay actualización */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-500 ${
        isUpdating 
          ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent' 
          : 'bg-transparent'
      }`} />
      
      {/* Efecto scan line */}
      {isUpdating && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent animate-scan-line" />
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold text-gray-100 transition-all duration-300 ${
              isUpdating ? 'text-emerald-50 scale-[1.02]' : ''
            }`}>
              {value}
            </span>
            {unit && <span className="text-sm text-gray-400">{unit}</span>}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {icon && (
            <div className="text-gray-600">{icon}</div>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-0.5 text-xs ${trendColor[trend]}`}>
              <span>{trendIcon[trend]}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}