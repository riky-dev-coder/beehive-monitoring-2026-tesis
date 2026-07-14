const SensorCards = ({ sensors }) => {
  const cardStyle =
    "bg-[#0f1720] border border-gray-800 rounded-2xl p-5 transition hover:border-emerald-500";

  const labelStyle = "text-sm text-gray-400";
  const valueStyle = "text-3xl font-bold text-emerald-400 mt-2";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">

      {sensors.peso_total && (
        <div className={cardStyle}>
          <div className={labelStyle}>Peso cria</div>
          <div className={valueStyle}>
            {sensors.peso_total && sensors.peso_mielera
                  ? (sensors.peso_total.value - sensors.peso_mielera.value).toFixed(1)
                  : '--'} kg
          </div>
        </div>
      )}

      {sensors.peso_mielera && (
        <div className={cardStyle}>
          <div className={labelStyle}>Peso mielera</div>
          <div className={valueStyle}>
            {sensors.peso_mielera.value.toFixed(1)} kg
          </div>
        </div>
      )}

      {sensors.temp_cria && (
        <div className={cardStyle}>
          <div className={labelStyle}>Temp. cría</div>
          <div className={valueStyle}>
            {sensors.temp_cria.value.toFixed(1)}°C
          </div>
        </div>
      )}

      {sensors.humedad_cria && (
        <div className={cardStyle}>
          <div className={labelStyle}>Humedad cría</div>
          <div className={valueStyle}>
            {sensors.humedad_cria.value.toFixed(0)}%
          </div>
        </div>
      )}

    </div>
  );
};

export default SensorCards;