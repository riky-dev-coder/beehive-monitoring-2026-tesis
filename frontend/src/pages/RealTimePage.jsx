import { useState, useEffect } from 'react'
import LiveDataCard from '../components/DataCards/LiveDataCard'
import MiniSparkline from '../components/Charts/MiniSparkline'
import AnimatedProgressBar from '../components/DataCards/AnimatedProgressBar'
import { useAnimatedValue } from '../hooks/useAnimatedValue'
import { useHarvestPrediction } from '../hooks/useHarvestPrediction'
import { useHiveHealth } from '../hooks/useHiveHealth'
import { getSensorDataLatest, getSensorHistory } from '../services/api'

export default function RealTimePage() {
  const [hiveData, setHiveData] = useState({
    totalWeight: 0,
    externalTemp: 0,
    externalHumidity: 0,
    broodTemp: 0,
    broodHumidity: 0,
    honeyWeight: 0,
    broodWeight: 0,
    harvestProgress: 0,
  })

  const [weightHistory, setWeightHistory] = useState([])
  const [tempHistory, setTempHistory] = useState([])
  const [broodTempHistory, setBroodTempHistory] = useState([])
  const [humidityHistory, setHumidityHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Hook para obtener predicción de cosecha del backend
  const { prediction: harvestPrediction, loading: predictionLoading } = useHarvestPrediction()
  const { health: hiveHealth, loading: hiveHealthLoading } = useHiveHealth()

  // Función para transformar datos del backend al formato de la UI
  const processSensorData = (sensorDataArray) => {
    const dataMap = {}
    sensorDataArray.forEach(sensor => {
      dataMap[sensor.sensor_type] = sensor.value
    })

    return {
      totalWeight: parseFloat((dataMap['peso_total'] || 0).toFixed(1)),
      externalTemp: parseFloat((dataMap['temp_exterior'] || 0).toFixed(1)),
      externalHumidity: Math.round(dataMap['humedad_exterior'] || 0),
      broodTemp: parseFloat((dataMap['temp_cria'] || 0).toFixed(1)),
      broodHumidity: Math.round(dataMap['humedad_cria'] || 0),
      honeyWeight: parseFloat((dataMap['peso_mielera'] || 0).toFixed(1)),
      broodWeight: parseFloat((dataMap['peso_total'] - dataMap['peso_mielera'] || 0).toFixed(1)),
      harvestProgress: Math.round((dataMap['peso_mielera'] || 0) / 20 * 100), // Asumiendo 20kg como meta
    }
  }

  // Cargar datos iniciales del backend
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const latestData = await getSensorDataLatest()
        const processedData = processSensorData(latestData)
        setHiveData(processedData)
        
        // Cargar histórico para los gráficos sparkline
        const historyData = await getSensorHistory('1h')
        
        // Agrupar por tipo de sensor
        const pesoData = historyData
          .filter(h => h.sensor_type === 'peso_total')
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(h => parseFloat(h.value.toFixed(1)))
          .slice(-20)
        
        const tempData = historyData
          .filter(h => h.sensor_type === 'temp_exterior')
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(h => parseFloat(h.value.toFixed(1)))
          .slice(-20)
        
        const broodTempData = historyData
          .filter(h => h.sensor_type === 'temp_cria')
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(h => parseFloat(h.value.toFixed(1)))
          .slice(-20)
        
        const humidityData = historyData
          .filter(h => h.sensor_type === 'humedad_exterior')
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(h => Math.round(h.value))
          .slice(-20)
        
        setWeightHistory(pesoData)
        setTempHistory(tempData)
        setBroodTempHistory(broodTempData)
        setHumidityHistory(humidityData)
        setError(null)
      } catch (err) {
        console.error('Error loading initial data:', err)
        setError('Error cargando datos del backend')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Actualizar datos cada 15 segundos desde el backend
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latestData = await getSensorDataLatest()
        const processedData = processSensorData(latestData)
        
        setHiveData(processedData)
        
        // Actualizar historiales
        setWeightHistory(h => [...h.slice(-19), processedData.totalWeight])
        setTempHistory(h => [...h.slice(-19), processedData.externalTemp])
        setBroodTempHistory(h => [...h.slice(-19), processedData.broodTemp])
        setHumidityHistory(h => [...h.slice(-19), processedData.externalHumidity])
      } catch (err) {
        console.error('Error fetching sensor data:', err)
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const animatedWeight = useAnimatedValue(hiveData.totalWeight)
  const animatedTemp = useAnimatedValue(hiveData.externalTemp, { decimals: 1 })
  const animatedExternalHumidity = useAnimatedValue(hiveData.externalHumidity)
  const animatedBroodTemp = useAnimatedValue(hiveData.broodTemp, { decimals: 1 })
  const animatedHoney = useAnimatedValue(hiveData.honeyWeight, { decimals: 1 })
  const animatedBroodWeight = useAnimatedValue(hiveData.broodWeight, { decimals: 1 })

  // Calcular tendencias desde el histórico
  const weightTrend = weightHistory.length > 1 
    ? weightHistory[weightHistory.length - 1] > weightHistory[weightHistory.length - 2] ? 'up' : 'down'
    : 'stable'
  
  const tempTrend = tempHistory.length > 1
    ? tempHistory[tempHistory.length - 1] > tempHistory[tempHistory.length - 2] ? 'up' : 'down'
    : 'stable'

  // Calcular valores de tendencia
  const weightTrendValue = weightHistory.length > 1 
    ? (weightHistory[weightHistory.length - 1] - weightHistory[weightHistory.length - 2]).toFixed(1)
    : '0.0'

  const tempTrendValue = tempHistory.length > 1
    ? (tempHistory[tempHistory.length - 1] - tempHistory[tempHistory.length - 2]).toFixed(1)
    : '0.0'

  const humidityTrend = humidityHistory.length > 1
    ? humidityHistory[humidityHistory.length - 1] > humidityHistory[humidityHistory.length - 2] ? 'up' : 'down'
    : 'stable'

  const humidityTrendValue = humidityHistory.length > 1
    ? (humidityHistory[humidityHistory.length - 1] - humidityHistory[humidityHistory.length - 2]).toFixed(0)
    : '0'

  // Mostrar loading o error
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando datos del backend...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 mb-4">⚠️ {error}</p>
          <p className="text-gray-500 text-sm">Asegúrate de que el backend esté corriendo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LiveDataCard
          title="Peso Total"
          value={animatedWeight}
          unit="kg"
          icon={<span className="text-lg">⚖️</span>}
          trend={weightTrend}
          trendValue={`${weightTrendValue > 0 ? '+' : ''}${weightTrendValue}`}
        />
        <LiveDataCard
          title="Temp. Exterior"
          value={animatedTemp}
          unit="°C"
          icon={<span className="text-lg">🌡️</span>}
          trend={tempTrend}
          trendValue={`${tempTrendValue > 0 ? '+' : ''}${tempTrendValue}`}
        />
        <LiveDataCard
          title="Humedad Ext."
          value={animatedExternalHumidity}
          unit="%"
          icon={<span className="text-lg">💧</span>}
          trend={humidityTrend}
          trendValue={`${humidityTrendValue > 0 ? '+' : ''}${humidityTrendValue}`}
        />
        <LiveDataCard
          title="Peso Mielera"
          value={animatedHoney}
          unit="kg"
          icon={<span className="text-lg">🍯</span>}
          trend="stable"
          trendValue="0.0"
        />
      </div>

      {/* Datos de la cámara de cría */}
      <div className="bg-[#0d1a1f] rounded-lg border border-gray-800/50 p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
          Cámara de Cría
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between items-center p-3 bg-[#071014] rounded-lg">
            <span className="text-xs text-gray-500">Peso Cría</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{animatedWeight} kg</span>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#071014] rounded-lg">
            <span className="text-xs text-gray-500">Temperatura</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-400">{animatedBroodTemp}°C</span>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#071014] rounded-lg">
            <span className="text-xs text-gray-500">Humedad</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-400">{hiveData.broodHumidity}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos sparkline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1a1f] rounded-lg p-4 border border-gray-800/50">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Evolución Peso</p>
              <p className="text-lg font-bold mt-1">{animatedWeight} kg</p>
            </div>
            <MiniSparkline data={weightHistory} width={100} height={35} />
          </div>
        </div>

        <div className="bg-[#0d1a1f] rounded-lg p-4 border border-gray-800/50">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Temp. Exterior</p>
              <p className="text-lg font-bold text-amber-400 mt-1">{animatedTemp}°C</p>
            </div>
            <MiniSparkline 
              data={tempHistory} 
              color="#f59e0b" 
              width={100} 
              height={35} 
            />
          </div>
        </div>

        <div className="bg-[#0d1a1f] rounded-lg p-4 border border-gray-800/50">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Temp. Cría</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">{animatedBroodTemp}°C</p>
            </div>
            <MiniSparkline 
              data={broodTempHistory} 
              color="#10b981" 
              width={100} 
              height={35} 
            />
          </div>
        </div>
      </div>

      {/* Predicción de cosecha */}
      <div className="bg-[#0d1a1f] rounded-lg p-5 border border-gray-800/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded">
            🍯 Predicción
          </span>
          <span className="text-sm text-gray-400">Progreso de cosecha</span>
        </div>
        
        {predictionLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Cargando predicción...</p>
          </div>
        ) : harvestPrediction ? (
          <>
            <AnimatedProgressBar
              value={harvestPrediction.ready ? 100 : (harvestPrediction.current_weight / harvestPrediction.min_harvest_weight) * 100}
              max={100}
              label={`Producción actual: ${harvestPrediction.current_weight.toFixed(1)} kg`}
              targetLabel={`${harvestPrediction.min_harvest_weight} kg`}
              color="emerald"
            />

            {harvestPrediction.ready ? (
              <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">¡Lista para cosechar!</span>
                <span className="text-xs text-gray-500 ml-2">
                  Superó el objetivo en {((harvestPrediction.current_weight / harvestPrediction.min_harvest_weight) * 100 - 100).toFixed(0)}%
                </span>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">Predicción de cosecha</span>
                </div>
                {harvestPrediction.estimated_days_to_harvest !== null ? (
                  <p className="text-xs text-gray-400 ml-4">
                    Tiempo estimado: <span className="text-amber-300 font-medium">{harvestPrediction.estimated_days_to_harvest} días</span>
                    {harvestPrediction.estimated_harvest_date && (
                      <span className="text-gray-500 ml-2">
                        ({new Date(harvestPrediction.estimated_harvest_date).toLocaleDateString('es-ES')})
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 ml-4">Aún no hay suficientes datos para predecir</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">No hay datos de predicción disponibles</p>
          </div>
        )}
      </div>

      {/* Resumen del estado */}
      <div className="bg-[#0d1a1f] rounded-lg p-5 border border-gray-800/50">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
          Resumen de la Colmena
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-2 bg-[#071014] rounded">
            <span className="text-gray-500">Estado</span>
            {hiveHealthLoading ? (
              <p className="text-gray-400 font-medium mt-1">Cargando...</p>
            ) : hiveHealth ? (
              (() => {
                const status = hiveHealth.status || 'unknown'
                if (status === 'healthy') {
                  return <p className="text-emerald-400 font-medium mt-1">● Saludable</p>
                } else if (status === 'at_risk') {
                  return <p className="text-amber-400 font-medium mt-1">● En riesgo</p>
                } else if (status === 'critical') {
                  return <p className="text-red-400 font-medium mt-1">● Crítico</p>
                }
                return <p className="text-gray-400 font-medium mt-1">● Desconocido</p>
              })()
            ) : (
              <p className="text-gray-400 font-medium mt-1">No disponible</p>
            )}
          </div>
          <div className="p-2 bg-[#071014] rounded">
            <span className="text-gray-500">Actividad</span>
            <p className="text-amber-400 font-medium mt-1">▲ Alta</p>
          </div>
          <div className="p-2 bg-[#071014] rounded">
            <span className="text-gray-500">Alimentos</span>
            <p className="text-emerald-400 font-medium mt-1">✓ Suficiente</p>
          </div>
          <div className="p-2 bg-[#071014] rounded">
            <span className="text-gray-500">Espacio</span>
            <p className="text-amber-400 font-medium mt-1">⚠ Revisar</p>
          </div>
        </div>
      </div>
    </div>
  )
}