import { useState } from 'react';
import api from '../services/api';

export const useRecommendations = () => {
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);

  const generateRecommendation = async (context = '') => {
    setLoading(true);
    try {
      const response = await api.post('/recommendations/history', { context });
      setRecommendation(response.data.recommendation);
    } catch (error) {
      console.error('Error al generar recomendación:', error);
      setRecommendation('Error al obtener recomendación');
    } finally {
      setLoading(false);
    }
  };

  return { recommendation, loading, generateRecommendation };
};