import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.database import get_supabase_client
from app.models.sensor import SensorType, SensorData, AggregatedSensorData
import logging
import calendar

logger = logging.getLogger(__name__)

# Mapeo de field en ThingSpeak a sensor_type y unidad
# field1 = temp cria (°C)
# field2 = temp mielera (°C)
# field3 = temp exterior (°C)
# field4 = humedad cría (%)
# field5 = humedad mielera (%)
# field6 = humedad exterior (%)
# field7 = peso total (kg)
# field8 = peso mielera (%)
THINGSPEAK_FIELD_MAP = {
    1: (SensorType.TEMP_CRIA, "°C"),
    2: (SensorType.TEMP_MIELERA, "°C"),
    3: (SensorType.TEMP_EXTERIOR, "°C"),
    4: (SensorType.HUMEDAD_CRIA, "%"),
    5: (SensorType.HUMEDAD_MIELERA, "%"),
    6: (SensorType.HUMEDAD_EXTERIOR, "%"),
    7: (SensorType.PESO_TOTAL, "kg"),
    8: (SensorType.PESO_MIELERA, "kg"),
}

async def fetch_latest_from_thingspeak() -> List[SensorData]:
    """
    Obtiene la última entrada del canal de ThingSpeak y la convierte en una lista de objetos SensorData.
    """
    url = f"https://api.thingspeak.com/channels/{settings.thingspeak_channel_id}/feeds.json"
    params = {
        "api_key": settings.thingspeak_read_api_key,
        "results": 1
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
    
    feeds = data.get("feeds", [])
    if not feeds:
        logger.warning("No se encontraron feeds en ThingSpeak")
        return []
    
    feed = feeds[0]
    timestamp_str = feed.get("created_at")
    if timestamp_str:
        # ThingSpeak usa formato "2025-03-15T10:30:00Z"
        timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
    else:
        timestamp = datetime.utcnow()
    
    readings = []
    for field_num, (sensor_type, unit) in THINGSPEAK_FIELD_MAP.items():
        field_key = f"field{field_num}"
        value_str = feed.get(field_key)
        if value_str is not None and value_str.strip() != "":
            try:
                value = float(value_str)
                reading = SensorData(
                    timestamp=timestamp,
                    sensor_type=sensor_type,
                    value=value,
                    unit=unit
                )
                readings.append(reading)
            except ValueError:
                logger.error(f"Valor inválido en field{field_num}: {value_str}")
    
    return readings

async def store_readings_in_supabase(readings: List[SensorData]):
    """
    Guarda una lista de lecturas en la tabla sensor_readings de Supabase.
    """
    if not readings:
        return
    
    supabase = get_supabase_client()
    data_to_insert = []

    for r in readings:
        data_to_insert.append({
            "timestamp": r.timestamp.isoformat(),
            "sensor_type": r.sensor_type.value,
            "value": r.value,
            "unit": r.unit
        })
    
    response = supabase.table("sensor_readings").insert(data_to_insert).execute()
    if hasattr(response, 'error') and response.error:
        logger.error(f"Error al insertar en Supabase: {response.error}")
    else:
        logger.info(f"Insertadas {len(data_to_insert)} lecturas en Supabase")

async def fetch_and_store_latest_data():
    """
    Función principal que obtiene los últimos datos de ThingSpeak y los almacena en Supabase.
    Esta función será llamada periódicamente por una tarea en segundo plano.
    """
    try:
        readings = await fetch_latest_from_thingspeak()
        if readings:
            await store_readings_in_supabase(readings)
            # Opcional: disparar evaluación de alertas inmediatamente
            from app.services.alert_engine import evaluate_sensor_data
            await evaluate_sensor_data(readings)
        return readings
    except Exception as e:
        logger.exception("Error en fetch_and_store_latest_data")
        raise

# Funciones auxiliares para el API
async def get_latest_readings():
    """
    Obtiene la última lectura de cada sensor desde Supabase.
    """
    supabase = get_supabase_client()
    # Consulta: para cada tipo de sensor, obtener el registro más reciente
    latest = []
    for sensor_type in SensorType:
        response = supabase.table("sensor_readings")\
            .select("*")\
            .eq("sensor_type", sensor_type.value)\
            .order("timestamp", desc=True)\
            .limit(1)\
            .execute()
        if response.data:
            data = response.data[0]
            # Convertir a modelo Pydantic
            latest.append(SensorData(**data))
    return latest

# ─────────────────────────────────────────────────────────────────────────────
# Optimizacion de consultas históricas con agregación en la base de datos
# ─────────────────────────────────────────────────────────────────────────────
RESOLUTION_MAP = {
    "1h":    "1 minute",   # ~60  puntos
    "24h":   "5 minutes",  # ~288 puntos
    "7d":    "1 hour",     # ~168 puntos
    "month": "6 hours",    # ~120 puntos
}

async def get_historical_readings_aggregated(
    sensor_type: Optional[SensorType],
    start_date: datetime,
    end_date: datetime,
    resolution: str,
) -> List[AggregatedSensorData]:
    """
    Llama a la función PostgreSQL get_sensor_history_aggregated() via RPC.
    Devuelve promedios por intervalo — nunca rows crudos.
    """
    supabase = get_supabase_client()

    params = {
        "p_start_date":  start_date.isoformat(),
        "p_end_date":    end_date.isoformat(),
        "p_resolution":  resolution,
        "p_sensor_type": sensor_type.value if sensor_type else None,
    }

    response = supabase.rpc("get_sensor_history_aggregated", params).execute()

    if not response.data:
        return []

    result = []
    for row in response.data:
        result.append(AggregatedSensorData(
            timestamp=row["bucket"],
            sensor_type=row["sensor_type"],
            value=row["value"],
            min_value=row["min_value"],
            max_value=row["max_value"],
            count=row["count"],
        ))
    return result


async def get_months_with_data() -> List[dict]:
    """
    Llama a get_available_months() en Supabase.
    El frontend usa la funcion para llenar el selector de mes.
    """
    MONTHS_ES = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    supabase = get_supabase_client()
    response = supabase.rpc("get_available_months", {}).execute()

    if not response.data:
        return []

    return [
        {
            "year":  row["year"],
            "month": row["month"],
            "label": f"{MONTHS_ES[row['month']]} {row['year']}",
            "value": f"{row['year']}-{row['month']:02d}",  # "2025-02"
        }
        for row in response.data
    ]