import { useEffect, useState } from "react";
import HistoricalChart from "../components/Charts/HistoricalChart";
import Card from "../components/Layout/Card";
import api from "../services/api";

const SectionTitle = ({ children }) => (
  <h2 className="text-xl font-semibold text-gray-100 mb-4">{children}</h2>
);

// ✅ Componente reutilizable para el selector
const TimeRangeSelector = ({ value, onChange }) => {
  const options = [
    { label: "1H", value: "1h" },
    { label: "24H", value: "24h" },
    { label: "7D", value: "7d" },
    { label: "Mes", value: "month" }, // selector de meses
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            value === opt.value
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const HistoricalPage = () => {
  // ✅ Estado para el rango de tiempo (se comparte entre todos los gráficos)
  const [timeRange, setTimeRange] = useState("24h");
  const [selectedMonth, setSelectedMonth] = useState(""); // "2025-02"
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    api
      .get("/sensors/available-months")
      .then((r) => {
        setAvailableMonths(r.data);
        // Pre-seleccionar el mes más reciente
        if (r.data.length > 0) setSelectedMonth(r.data[0].value);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-10">
      {/* ✅ Selector global de tiempo */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Histórico de Datos</h1>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        {timeRange === 'month' && (
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-gray-300
                      border border-gray-700 hover:bg-gray-700 focus:outline-none"
          >
            {availableMonths.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* ================= EXTERIOR ================= */}
      <div>
        <SectionTitle>Exterior</SectionTitle>
        <Card>
          <div className="bg-[#071015] border border-gray-800 rounded-xl p-4">
            <HistoricalChart
              sensors={["temp_exterior", "humedad_exterior"]}
              title="Temperatura y Humedad Exterior"
              showOptimal={false}
              timeRange={timeRange} // ✅ Pasar prop
              selectedMonth={selectedMonth}
            />
          </div>
        </Card>
      </div>

      {/* ================= CAMARA DE CRIA ================= */}
      <div>
        <SectionTitle>Cámara de Cría</SectionTitle>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <div className="bg-[#071015] border border-gray-800 rounded-xl p-4">
              <HistoricalChart
                sensors={["temp_cria", "temp_exterior"]}
                title="Temperatura Cámara de Cría"
                optimalRange={{ min: 34, max: 36, unit: "°C" }}
                timeRange={timeRange} // ✅ Pasar prop
                selectedMonth={selectedMonth}
              />
            </div>
          </Card>
          <Card>
            <div className="bg-[#071015] border border-gray-800 rounded-xl p-4">
              <HistoricalChart
                sensors={["humedad_cria", "humedad_exterior"]}
                title="Humedad Cámara de Cría"
                optimalRange={{ min: 55, max: 75, unit: "%" }}
                timeRange={timeRange} // ✅ Pasar prop
                selectedMonth={selectedMonth}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* ================= CAMARA MIELERA ================= */}
      <div>
        <SectionTitle>Cámara Mielera</SectionTitle>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <div className="bg-[#071015] border border-gray-800 rounded-xl p-4">
              <HistoricalChart
                sensors={["temp_mielera", "temp_exterior"]}
                title="Temperatura Cámara Mielera"
                optimalRange={{ min: 34, max: 36, unit: "°C" }}
                timeRange={timeRange} // ✅ Pasar prop
                selectedMonth={selectedMonth}
              />
            </div>
          </Card>
          <Card>
            <div className="bg-[#071015] border border-gray-800 rounded-xl p-4">
              <HistoricalChart
                sensors={["humedad_mielera", "humedad_exterior"]}
                title="Humedad Cámara Mielera"
                optimalRange={{ min: 55, max: 75, unit: "%" }}
                timeRange={timeRange} // ✅ Pasar prop
                selectedMonth={selectedMonth}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* ================= PESOS ================= */}
      <div>
        <SectionTitle>Pesos</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="bg-[#071015] border border-gray-800 rounded-xl p-4">
              <HistoricalChart
                sensors={["peso_total"]}
                title="Peso Total de la Colmena"
                showOptimal={false}
                timeRange={timeRange} // ✅ Pasar prop
                selectedMonth={selectedMonth}
              />
            </div>
          </Card>
          <Card>
            <div className="bg-[#071015] border border-gray-800 rounded-xl p-4">
              <HistoricalChart
                sensors={["peso_mielera"]}
                title="Peso Cámara Mielera"
                showOptimal={false}
                timeRange={timeRange} // ✅ Pasar prop
                selectedMonth={selectedMonth}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HistoricalPage;
