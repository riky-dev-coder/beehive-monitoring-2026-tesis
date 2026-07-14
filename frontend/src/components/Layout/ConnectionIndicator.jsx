import { useState, useEffect } from 'react'

export default function ConnectionIndicator() {
  const [status, setStatus] = useState('connected')
  const [lastUpdate, setLastUpdate] = useState(() => new Date())
  const [timeDiff, setTimeDiff] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      setTimeDiff(0)
      
      // Simular reconexión ocasional (1% probabilidad)
      if (Math.random() < 0.01) {
        setStatus('reconnecting')
        setTimeout(() => setStatus('connected'), 1500)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!lastUpdate) return

    const timer = setInterval(() => {
      setTimeDiff(Math.floor((Date.now() - lastUpdate.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [lastUpdate])

  const statusConfig = {
    connected: { 
      color: 'bg-emerald-400', 
      text: 'En vivo', 
      textColor: 'text-emerald-400' 
    },
    reconnecting: { 
      color: 'bg-amber-400', 
      text: 'Reconectando...', 
      textColor: 'text-amber-400' 
    },
    disconnected: { 
      color: 'bg-red-400', 
      text: 'Desconectado', 
      textColor: 'text-red-400' 
    },
  }

  const config = statusConfig[status]
  const secondsText = timeDiff < 5 ? 'ahora' : `hace ${timeDiff}s`

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {/* Punto pulsante */}
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${config.color}`} />
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.color} animate-ping opacity-75`} />
        </div>
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>
      <span className="text-[10px] text-gray-500 hidden lg:inline">
        Últ. datos: {secondsText}
      </span>
    </div>
  )
}