// hooks/useHarvestPrediction.js
import { useState, useEffect } from 'react';
import { getHarvestPrediction } from '../services/api';

export const useHarvestPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const data = await getHarvestPrediction();
      setPrediction(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching harvest prediction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchPrediction, 30000);
    return () => clearInterval(interval);
  }, []);

  return { prediction, loading, error, refetch: fetchPrediction };
};