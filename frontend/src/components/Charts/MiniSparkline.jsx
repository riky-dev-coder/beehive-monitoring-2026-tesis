import { useEffect, useRef } from 'react'

export default function MiniSparkline({
  data = [], // Valor por defecto para evitar undefined
  color = '#10b981',
  height = 40,
  width = 120,
  isLive = true,
}) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    // Validación: si no hay canvas o datos insuficientes, salir
    if (!canvas || !data || !Array.isArray(data) || data.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Calcular min/max de forma segura
    const min = Math.min(...data.filter(v => typeof v === 'number' && !isNaN(v)))
    const max = Math.max(...data.filter(v => typeof v === 'number' && !isNaN(v)))
    const range = max - min || 1

    // Función para obtener el punto Y de un valor
    const getY = (value) => {
      const safeValue = typeof value === 'number' && !isNaN(value) ? value : min
      return height - ((safeValue - min) / range) * (height - 8) - 4
    }

    // Función para obtener el punto X de un índice
    const getX = (index) => {
      return (index / (data.length - 1)) * width
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Dibujar área con gradiente
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, color + '40')
      gradient.addColorStop(1, color + '00')

      ctx.beginPath()
      ctx.moveTo(0, height)

      let prevY = height
      data.forEach((value, index) => {
        const x = getX(index)
        const y = getY(value)
        if (index === 0) {
          ctx.lineTo(x, y)
        } else {
          const prevX = getX(index - 1)
          const cpX = (prevX + x) / 2
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
        }
        prevY = y
      })

      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Dibujar línea
      ctx.beginPath()
      prevY = height
      data.forEach((value, index) => {
        const x = getX(index)
        const y = getY(value)
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          const prevX = getX(index - 1)
          const cpX = (prevX + x) / 2
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
        }
        prevY = y
      })
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Punto final pulsante si está en vivo
      if (isLive && data.length > 0) {
        const lastX = width
        const lastValue = data[data.length - 1]
        const lastY = getY(lastValue)
        
        const pulse = (Math.sin(Date.now() / 500) + 1) / 2
        
        // Resplandor del punto
        ctx.beginPath()
        ctx.arc(lastX, lastY, 3 + pulse * 2, 0, Math.PI * 2)
        ctx.fillStyle = color + '30'
        ctx.fill()
        
        // Punto sólido
        ctx.beginPath()
        ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }
    }

    draw()

    if (isLive) {
      const animate = () => {
        draw()
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [data, color, height, width, isLive])

  // No renderizar si no hay datos válidos
  if (!data || !Array.isArray(data) || data.length < 2) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center text-gray-600 text-xs"
      >
        Sin datos
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="opacity-80 hover:opacity-100 transition-opacity"
    />
  )
}