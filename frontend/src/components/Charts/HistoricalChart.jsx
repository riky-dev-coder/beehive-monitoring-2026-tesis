import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import api from "../../services/api";

const COLORS = {
  temp_cria: "#34d399",
  temp_mielera: "#a78bfa", // morado
  temp_exterior: "#f87171",
  humedad_cria: "#34d399",
  humedad_mielera: "#a78bfa", // morado
  humedad_exterior: "#22d3ee",
  peso_total: "#34d399",
  peso_mielera: "#fb923c", // naranja
};

const SENSOR_LABELS = {
  temp_cria: "Temperatura cría",
  temp_mielera: "Temperatura mielera",
  temp_exterior: "Temperatura exterior",
  humedad_cria: "Humedad cría",
  humedad_mielera: "Humedad mielera",
  humedad_exterior: "Humedad exterior",
  peso_total: "Peso total",
  peso_mielera: "Peso mielera",
};

const SENSOR_UNITS = {
  temp_cria: "°C",
  temp_mielera: "°C",
  temp_exterior: "°C",
  humedad_cria: "%",
  humedad_mielera: "%",
  humedad_exterior: "%",
  peso_total: "kg",
  peso_mielera: "kg",
};

const HistoricalChart = ({
  sensors = [],
  optimalRange,
  timeRange = "24h",
  selectedMonth = "",
  title = "",
  showDownload = true, // nuevo prop si quieres desactivar descarga a nivel de instancia
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const sensorsKey = sensors.join(",");

  const timeParams = useMemo(() => {
    const base = { time_range: timeRange };

    if (timeRange === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      return { ...base, year: Number(year), month: Number(month) };
    }
    return base;
  }, [timeRange, selectedMonth]);

  useEffect(() => {
    let interval;
    // Si el rango es mensual pero no hay mes seleccionado, no hacer fetch
    const fetchHistory = async (isInitialLoad = false) => {
      if (isInitialLoad) setLoading(true);
      try {
        const promises = sensors.map(async (sensorType) => {
          const response = await api.get("/sensors/history", {
            params: {
              sensor_type: sensorType,
              ...timeParams, // { time_range, year?, month? }
            },
          });
          return { sensorType, data: response.data };
        });

        const results = await Promise.all(promises);
        const combined = {};

        results.forEach(({ sensorType, data }) => {
          data.forEach((item) => {
            //campo 'timestamp' mapeado desde 'bucket' en el router
            const ts = Math.floor(new Date(item.timestamp).getTime() / 1000);
            if (!combined[ts]) {
              combined[ts] = { timestamp: item.timestamp, _ts: ts };
            }
            combined[ts][sensorType] = item.value;
          });
        });

        const chartData = Object.values(combined)
          .map((item) => ({
            ...item,
            ...sensors.reduce((acc, s) => {
              if (!(s in item)) acc[s] = null;
              return acc;
            }, {}),
          }))
          .sort((a, b) => a._ts - b._ts);

        setData(chartData);
      } catch (error) {
        console.error("Error al recuperar datos históricos:", error);
      } finally {
        setLoading(false);
      }
    };
    // Bloquear fetch de mes si no hay mes seleccionado aún
    if (timeRange === "month" && !selectedMonth) return;
    fetchHistory(true);
    // Solo refrescar automáticamente en rangos cortos
    if (timeRange === "1h" || timeRange === "24h") {
      const intervalTime = timeRange === "1h" ? 60_000 : 300_000;
      interval = setInterval(() => fetchHistory(false), intervalTime);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorsKey, timeParams, timeRange, selectedMonth]);

  // ---------- FUNCIONES DE EXPORTACIÓN ----------
  const makeFilename = (ext) => {
    const safeTitle = (title || sensors.join("_") || "reporte")
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_-]/g, "");
    let rangePart = timeRange;
    // si hay datos, crear rango de fechas más legible
    if (data && data.length) {
      const first = new Date(data[0].timestamp)
        .toISOString()
        .replace(/[:.]/g, "-");
      const last = new Date(data[data.length - 1].timestamp)
        .toISOString()
        .replace(/[:.]/g, "-");
      rangePart = `${first}_to_${last}`;
    }
    return `${safeTitle}_${rangePart}.${ext}`;
  };

  const downloadCSV = () => {
    if (!data || !data.length) return;
    // header: timestamp, label (unit)
    const headers = [
      "timestamp",
      ...sensors.map(
        (s) =>
          `${SENSOR_LABELS[s] || s}${SENSOR_UNITS[s] ? ` (${SENSOR_UNITS[s]})` : ""}`,
      ),
    ];
    const rows = data.map((row) => {
      return [
        // timestamp ISO
        row.timestamp,
        ...sensors.map((s) => {
          const v = row[s];
          if (v === null || v === undefined) return "";
          // si es number, formatear con 2 decimales
          return typeof v === "number" ? v.toFixed(2) : String(v);
        }),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = makeFilename("csv");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!data || !data.length) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = makeFilename("json");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---------- Formateadores y CustomTooltip ----------
  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    if (timeRange === "1h" || timeRange === "24h") {
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f1720] border border-gray-800 p-3 rounded-xl shadow-lg">
          <p className="text-gray-400 text-xs mb-2">
            {new Date(label).toLocaleString()}
          </p>
          {payload.map((entry) => (
            <p
              key={entry.name}
              style={{ color: entry.color }}
              className="text-sm"
            >
              {entry.name}:{" "}
              {entry.value?.toFixed ? entry.value?.toFixed(1) : entry.value}{" "}
              {SENSOR_UNITS[entry.dataKey] ?? ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-80 text-gray-400">
        Cargando histórico...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex justify-center items-center h-80 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar con título + botones de descarga */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        {showDownload && (
          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              disabled={!data.length}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${data.length ? "bg-blue-600 text-white shadow" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
              aria-label="Descargar CSV"
            >
              Exportar CSV
            </button>
            <button
              onClick={downloadJSON}
              disabled={!data.length}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${data.length ? "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
              aria-label="Descargar JSON"
            >
              Exportar JSON
            </button>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            angle={-30}
            textAnchor="end"
            height={80}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            stroke="#374151"
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            stroke="#374151"
            domain={([dataMin, dataMax]) => {
              const padding = (dataMax - dataMin) * 0.1 || 1;
              return [
                Math.floor(dataMin - padding),
                Math.ceil(dataMax + padding),
              ];
            }}
            label={{
              value: sensors.every((s) => s.includes("temp"))
                ? "°C"
                : sensors.every((s) => s.includes("humedad"))
                  ? "%"
                  : sensors.every((s) => s.includes("peso"))
                    ? "kg"
                    : sensors.some((s) => s.includes("temp")) &&
                        sensors.some((s) => s.includes("humedad"))
                      ? "°C / %"
                      : "valor",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#9ca3af", fontSize: 12 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "#d1d5db", paddingTop: 20 }} />
          {optimalRange && (
            <ReferenceArea
              y1={optimalRange.min}
              y2={optimalRange.max}
              fill="#10b981"
              fillOpacity={0.08}
              stroke="#10b981"
              strokeOpacity={0.3}
              label={{
                value: `Óptimo ${optimalRange.min}-${optimalRange.max}${optimalRange.unit ? ` ${optimalRange.unit}` : ""}`,
                position: "insideTopRight",
                fill: "#10b981",
                fontSize: 11,
              }}
            />
          )}
          {sensors.map((sensor) => (
            <Line
              key={sensor}
              type="monotone"
              dataKey={sensor}
              stroke={COLORS[sensor] || "#10b981"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name={SENSOR_LABELS[sensor] || sensor}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalChart;
