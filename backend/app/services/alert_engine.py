from typing import List, Optional
from datetime import datetime
from app.core.config import settings
from app.core.database import get_supabase_client
from app.models.sensor import SensorData, SensorType
from app.models.alert import Alert, AlertCreate, AlertUpdate
from app.services.recommendation_engine import process_alert_for_recommendation
import logging

logger = logging.getLogger(__name__)

# Umbrales definidos en settings
THRESHOLDS = {
    SensorType.TEMP_CRIA: (settings.temp_cria_min, settings.temp_cria_max),
    SensorType.HUMEDAD_CRIA: (settings.humedad_cria_min, settings.humedad_cria_max),
    SensorType.TEMP_MIELERA: (settings.temp_mielera_min, settings.temp_mielera_max),
    SensorType.HUMEDAD_MIELERA: (settings.humedad_mielera_min, settings.humedad_mielera_max),
    # Pesos: el peso de cría tiene rango, el de mielera tiene umbral mínimo y alerta de disminución
}


def _is_disconnected_value(value) -> bool:
    """Detiene si un valor representa una lectura desconectada o inválida."""
    if value is None:
        return False
    if isinstance(value, str):
        try:
            return float(value) == 0.0
        except ValueError:
            return False
    try:
        return float(value) == 0.0
    except (TypeError, ValueError):
        return False


async def evaluate_sensor_data(readings: List[SensorData]):
    """
    Evalúa una lista de lecturas y genera alertas si es necesario.
    """
    # Primero evaluamos valores especiales como desconexión de sensor
    disconnected_readings = []
    for reading in readings:
        if _is_disconnected_value(reading.value):
            disconnected_readings.append(reading)
            continue

    for reading in disconnected_readings:
        await create_custom_alert(
            tipo=reading.sensor_type.value.split('_')[0],
            severidad="info",
            mensaje=f"Sensor desconectado o sin lectura válida: {reading.sensor_type.value}",
            sensor_asociado=reading.sensor_type.value
        )

    readings_by_type = {r.sensor_type: r for r in readings if not _is_disconnected_value(r.value)}

    # Reglas críticas de temperatura
    temp_cria = readings_by_type.get(SensorType.TEMP_CRIA)
    temp_exterior = readings_by_type.get(SensorType.TEMP_EXTERIOR)

    if temp_cria is not None and not _is_disconnected_value(temp_cria.value):
        if temp_cria.value < 28 or temp_cria.value > 40:
            await create_custom_alert(
                tipo="temp",
                severidad="critical",
                mensaje=f"Temperatura crítica de cría: {temp_cria.value:.1f} °C",
                sensor_asociado=SensorType.TEMP_CRIA.value
            )
        elif temp_exterior is not None and not _is_disconnected_value(temp_exterior.value) and temp_exterior.value < 0 and temp_cria.value < 32:
            await create_custom_alert(
                tipo="temp",
                severidad="critical",
                mensaje=f"Riesgo crítico por frío exterior: temperatura exterior {temp_exterior.value:.1f} °C y cría {temp_cria.value:.1f} °C",
                sensor_asociado=SensorType.TEMP_CRIA.value
            )

    # Luego evaluamos umbrales de temperatura y humedad solo para lecturas válidas
    for reading in readings:
        if _is_disconnected_value(reading.value):
            continue
        if reading.sensor_type in THRESHOLDS:
            min_val, max_val = THRESHOLDS[reading.sensor_type]
            if reading.value < min_val or reading.value > max_val:
                await create_alert_from_reading(reading, f"Valor fuera de rango ({min_val}-{max_val})")
    
    # Evaluaciones especiales para pesos
    # Peso de cría fuera de rango
    if SensorType.PESO_TOTAL in readings_by_type:
        peso_total = readings_by_type[SensorType.PESO_TOTAL].value
        # el rango de peso optimo de la cámara de cría es entre 5 kg a 10 kg.
        # Si tenemos sensor de peso total y sensor de peso mielera, entonces peso_cria = peso_total - peso_mielera.
        if SensorType.PESO_MIELERA in readings_by_type:
            peso_mielera = readings_by_type[SensorType.PESO_MIELERA].value
            peso_cria = peso_total - peso_mielera
            if peso_cria < settings.peso_cria_min or peso_cria > settings.peso_cria_max:
                # Crear alerta para peso de cría
                await create_custom_alert(
                    tipo="peso",
                    severidad="warning",
                    mensaje=f"Peso de cámara de cría ({peso_cria:.1f} kg) fuera de rango óptimo ({settings.peso_cria_min}-{settings.peso_cria_max} kg)",
                    sensor_asociado=SensorType.PESO_TOTAL.value
                )
    
    # Peso mielera: umbral de cosecha y disminución
    if SensorType.PESO_MIELERA in readings_by_type:
        peso_mielera = readings_by_type[SensorType.PESO_MIELERA].value
        
        # Si supera umbral de cosecha
        if peso_mielera >= settings.peso_mielera_min_cosecha:
            await create_custom_alert(
                tipo="cosecha",
                severidad="info",
                mensaje=f"¡Cámara mielera lista para cosechar! Peso actual: {peso_mielera:.1f} kg",
                sensor_asociado=SensorType.PESO_MIELERA.value
            )
        
        # Detectar disminución significativa (requiere comparar con lecturas anteriores)
        # Para eso consultar la última lectura anterior del mismo sensor
        await check_weight_drop(SensorType.PESO_MIELERA, peso_mielera, settings.peso_mielera_disminucion_alerta)

async def check_weight_drop(sensor_type: SensorType, current_value: float, threshold: float):
    """
    Compara con la lectura anterior del mismo sensor y genera alerta si la caída supera el umbral.
    """
    supabase = get_supabase_client()
    # Obtener la lectura previa (la más reciente anterior a la actual)
    response = supabase.table("sensor_readings")\
        .select("*")\
        .eq("sensor_type", sensor_type.value)\
        .order("timestamp", desc=True)\
        .limit(2)\
        .execute()
    
    if len(response.data) >= 2:
        prev_value = response.data[1]["value"]  # La segunda más reciente
        drop = prev_value - current_value
        if drop > threshold:
            await create_custom_alert(
                tipo="peso",
                severidad="warning",
                mensaje=f"Disminución de peso en {sensor_type.value}: {drop:.1f} kg en la última medición",
                sensor_asociado=sensor_type.value
            )

async def create_alert_from_reading(reading: SensorData, reason: str):
    """
    Crea una alerta basada en una lectura.
    """
    alert_data = AlertCreate(
        tipo=reading.sensor_type.value.split('_')[0],  # ej: "temp", "humedad"
        severidad="warning",
        mensaje=f"{reading.sensor_type.value}: {reading.value:.1f} {reading.unit}. {reason}",
        sensor_asociado=reading.sensor_type.value
    )
    await create_alert(alert_data)

async def create_custom_alert(tipo: str, severidad: str, mensaje: str, sensor_asociado: Optional[str] = None):
    """
    Crea una alerta con campos personalizados.
    """
    alert_data = AlertCreate(
        tipo=tipo,
        severidad=severidad,
        mensaje=mensaje,
        sensor_asociado=sensor_asociado
    )
    await create_alert(alert_data)

async def create_alert(alert: AlertCreate):
    """
    Inserta una alerta en Supabase y la pasa al motor de recomendaciones.
    """
    supabase = get_supabase_client()
    data = alert.dict()
    data["timestamp"] = datetime.utcnow().isoformat()
    data["leida"]     = False
    data["resuelta"]  = False

    response = supabase.table("alerts").insert(data).execute()
    if hasattr(response, 'error') and response.error:
        logger.error(f"Error al crear alerta: {response.error}")
        return None

    logger.info(f"Alerta creada: {data['mensaje']}")
    new_alert = Alert(**response.data[0]) if response.data else None

    # ── Pasar alerta al motor de recomendaciones ──────────────────────────
    if new_alert and new_alert.severidad in ("critical", "warning"):
        try:
            await process_alert_for_recommendation(new_alert)
        except Exception as e:
            # No bloqueamos el flujo principal si el motor falla
            logger.warning(f"Motor de recomendaciones falló para alerta {new_alert.id}: {e}")
    # ─────────────────────────────────────────────────────────────────────

    return new_alert

async def get_alerts(active_only: bool = False, limit: int = 50):
    """
    Obtiene alertas desde Supabase.
    """
    supabase = get_supabase_client()
    query = supabase.table("alerts").select("*")
    
    if active_only:
        # Consideramos activas si no están resueltas
        query = query.eq("resuelta", False)
    
    query = query.order("timestamp", desc=True).limit(limit)
    response = query.execute()
    
    return [Alert(**item) for item in response.data]

async def update_alert(alert_id: int, alert_update: AlertUpdate):
    """
    Actualiza una alerta (marcar como leída/resuelta).
    """
    supabase = get_supabase_client()
    update_data = alert_update.dict(exclude_unset=True)
    if not update_data:
        return None
    
    response = supabase.table("alerts").update(update_data).eq("id", alert_id).execute()
    if response.data:
        return Alert(**response.data[0])
    return None