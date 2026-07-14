import axios from "axios";

let API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL; // Cambiar en caso de otro puerto o dominio http://localhost:8000
  
//API_BASE_URL = API_BASE_URL.replace("http://", "https://");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== SENSOR DATA ENDPOINTS =====

/**
 * Obtiene los datos más recientes de todos los sensores
 * @returns {Promise<Array>} Array de lecturas de sensores
 */
export const getSensorDataLatest = async () => {
  try {
    const response = await api.get('/sensors/latest');
    return response.data;
  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
    throw error;
  }
};

/**
 * Obtiene datos históricos agregados de sensores
 * @param {string} timeRange - Rango de tiempo: '1h' | '24h' | '7d' | 'month'
 * @param {string} sensorType - Tipo de sensor (opcional)
 * @returns {Promise<Array>} Array de datos históricos agregados
 */
export const getSensorHistory = async (timeRange = '24h', sensorType = null) => {
  try {
    const params = { time_range: timeRange };
    if (sensorType) {
      params.sensor_type = sensorType;
    }
    const response = await api.get('/sensors/history', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor history:', error);
    throw error;
  }
};

/**
 * Obtiene la predicción de cosecha
 * @returns {Promise<Object>} Información de predicción de cosecha
 */
export const getHarvestPrediction = async () => {
  try {
    const response = await api.get('/sensors/harvest-readiness');
    return response.data;
  } catch (error) {
    console.error('Error fetching harvest prediction:', error);
    throw error;
  }
};

/**
 * Obtiene el estado de salud de la colmena (healthy | at_risk | critical)
 */
export const getHiveHealth = async () => {
  try {
    const response = await api.get('/sensors/health');
    return response.data;
  } catch (error) {
    console.error('Error fetching hive health:', error);
    throw error;
  }
};

export default api;