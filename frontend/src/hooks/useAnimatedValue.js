import { useState, useEffect, useRef } from 'react'

export function useAnimatedValue(targetValue, options = {}) {
  const { duration = 800, decimals = 1 } = options
  const [displayValue, setDisplayValue] = useState(targetValue)
  const animationRef = useRef(null)
  const startValueRef = useRef(targetValue)
  const startTimeRef = useRef(0)

  useEffect(() => {
    startValueRef.current = displayValue
    startTimeRef.current = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing suave (ease out cubic)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      const currentValue = startValueRef.current + 
        (targetValue - startValueRef.current) * eased
      
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetValue, duration])

  return displayValue.toFixed(decimals)
}