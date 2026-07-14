import { useState, useEffect } from 'react';
import api from '../services/api';

export const useAlerts = (activeOnly = false) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts/history', {
        params: { active_only: activeOnly }
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error al recuperar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  return { alerts, loading, refetch: fetchAlerts };
};