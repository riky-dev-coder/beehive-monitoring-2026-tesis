import { useEffect, useState } from 'react';
import api from '../../services/api';

const SEVERITY_STYLES = {
  critical: 'bg-red-500/10 border-red-500 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-400',
  info: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
};

const SENSOR_LABELS = {
  temp_cria:        'temperatura de cría',
  temp_mielera:     'temperatura de mielera',
  humedad_cria:     'humedad de cría',
  humedad_mielera:  'humedad de mielera',
  peso_total:       'peso total',
  peso_mielera:     'peso de mielera',
  temp:             'temperatura',
  humedad:          'humedad',
  peso:             'peso',
  cosecha:          'cosecha',
};

const SEVERITY_LABELS = {
  critical: 'crítica',
  warning:  'preventiva',
  info:     'informativa',
};

const getAlertTitle = (alert) => {
  const sensorKey = alert.sensor_asociado || alert.tipo || '';
  const sensorLabel = SENSOR_LABELS[sensorKey] || sensorKey.replace(/_/g, ' ');
  const severityLabel = SEVERITY_LABELS[alert.severidad] || alert.severidad;
  return `Alerta de ${sensorLabel} ${severityLabel}`;
};

const FILTERS = [
  { label: 'Todas', value: 'all' },
  { label: 'Sin atender', value: 'unread' },
  { label: 'Vistas', value: 'read' },
];

const AlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [markingId, setMarkingId] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchAlerts = async () => {
    try {
      //console.log("API URL:", api.defaults.baseURL);
      const response = await api.get('/alerts/history');
      setAlerts(response.data);
    } catch (error) {
      console.error('No se pudieron obtener las alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 20000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleMarkAsRead = async (alertId) => {
    setMarkingId(alertId);
    try {
      await api.patch(`/alerts/${alertId}`, { leida: true });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, leida: true } : a))
      );
    } catch (error) {
      console.error('Error al marcar alerta como vista:', error);
    } finally {
      setMarkingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'unread') return !a.leida;
    if (filter === 'read') return a.leida;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.leida).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-400">
        Cargando alertas...
      </div>
    );
  }

  return (
    <div>
      {/* Barra de filtros */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {f.label}
            {f.value === 'unread' && unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista **/}
      {filteredAlerts.length === 0 ? (
        <div className="flex justify-center items-center h-40 text-gray-500">
          No hay alertas{filter !== 'all' ? ' en esta categoría' : ''}
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 transition-colors ${
                alert.leida
                  ? 'opacity-50 hover:opacity-70'
                  : 'hover:bg-[#111c24]'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                {/* Contenido **/}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                        SEVERITY_STYLES[alert.severidad] || SEVERITY_STYLES.info
                      }`}
                    >
                      {alert.severidad?.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                    {!alert.leida && (
                      <span className="w-2 h-2 rounded-full bg-blue-400" title="Sin leer" />
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-100 capitalize">
                    {getAlertTitle(alert)}
                  </h4>
                  <p className="text-sm text-gray-400 mt-1">{alert.mensaje}</p>
                </div>

                {/* Botón marcar como vista **/}
                {!alert.leida && (
                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    disabled={markingId === alert.id}
                    className="shrink-0 mt-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {markingId === alert.id ? 'Marcando...' : '✓ Marcar vista'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  };

export default AlertList;