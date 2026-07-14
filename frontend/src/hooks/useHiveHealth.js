import { useState, useEffect } from 'react'
import { getHiveHealth } from '../services/api'

export const useHiveHealth = () => {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const data = await getHiveHealth()
      setHealth(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching hive health:', err)
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return { health, loading, error, refetch: fetchHealth }
}
