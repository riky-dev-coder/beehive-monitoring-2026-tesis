try:
    import numpy as np
except Exception:
    np = None
from datetime import datetime, timedelta
from typing import Optional
from app.core.database import get_supabase_client
from app.models.sensor import SensorType
import logging

logger = logging.getLogger(__name__)

async def predict_harvest_date() -> Optional[datetime]:
    """
    Predice la fecha en que la cámara mielera alcanzará el peso mínimo de cosecha.
    Utiliza regresión lineal simple sobre los últimos N datos de peso.
    Retorna la fecha estimada o None si no hay suficientes datos o la tendencia es negativa.
    """
    supabase = get_supabase_client()
    # Obtener últimos días de lecturas de peso mielera, con un máximo de 100 puntos
    response = supabase.table("sensor_readings")\
        .select("timestamp, value")\
        .eq("sensor_type", SensorType.PESO_MIELERA.value)\
        .order("timestamp", desc=False)\
        .limit(100)\
        .execute()
    
    data = response.data
    if len(data) < 2:
        logger.info("No hay suficientes datos para predecir cosecha")
        return None
    
    # Extraer timestamps como números (días desde la primera medición)
    timestamps = [datetime.fromisoformat(d["timestamp"]) for d in data]
    values = [d["value"] for d in data]
    
    # Convertir timestamps a días relativos
    first_ts = timestamps[0]
    days = [(ts - first_ts).total_seconds() / 86400.0 for ts in timestamps]
    
    # Si numpy no está disponible, no podemos hacer regresión
    if np is None:
        logger.info("Numpy no disponible: omitiendo predicción de cosecha (fallback)")
        return None

    # Regresión lineal: y = a * x + b
    x = np.array(days)
    y = np.array(values)

    # Calcular pendiente e intercepto
    n = len(x)
    sum_x = np.sum(x)
    sum_y = np.sum(y)
    sum_xy = np.sum(x * y)
    sum_x2 = np.sum(x * x)

    denominator = n * sum_x2 - sum_x**2
    if denominator == 0:
        return None

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n

    # Si la pendiente es negativa, la colmena está perdiendo peso
    if slope <= 0:
        logger.info("Tendencia de peso negativa, no se puede predecir cosecha")
        return None

    # Calcular días para alcanzar peso_min_cosecha
    from app.core.config import settings
    target_weight = settings.peso_mielera_min_cosecha
    # Resolver target = slope * days + intercept
    days_to_target = (target_weight - intercept) / slope

    # Si ya se superó el target, retornar hoy
    if days_to_target <= days[-1]:
        return datetime.utcnow()

    # Fecha estimada
    estimated_date = first_ts + timedelta(days=days_to_target)
    return estimated_date

async def get_harvest_readiness() -> dict:
    """
    Retorna un resumen sobre el estado de cosecha: peso actual, tendencia, días estimados.
    """
    supabase = get_supabase_client()
    # Última lectura de peso mielera
    response = supabase.table("sensor_readings")\
        .select("value, timestamp")\
        .eq("sensor_type", SensorType.PESO_MIELERA.value)\
        .order("timestamp", desc=True)\
        .limit(1)\
        .execute()
    
    if not response.data:
        return {"ready": False, "message": "Sin datos de peso mielera"}
    
    current_weight = response.data[0]["value"]
    last_timestamp = datetime.fromisoformat(response.data[0]["timestamp"])
    
    from app.core.config import settings
    ready = current_weight >= settings.peso_mielera_min_cosecha
    
    result = {
        "ready": ready,
        "current_weight": current_weight,
        "last_updated": last_timestamp,
        "min_harvest_weight": settings.peso_mielera_min_cosecha
    }
    
    if not ready:
        harvest_date = await predict_harvest_date()
        if harvest_date:
            days_left = (harvest_date - datetime.utcnow()).days
            result["estimated_days_to_harvest"] = days_left
            result["estimated_harvest_date"] = harvest_date.isoformat()
        else:
            result["estimated_days_to_harvest"] = None
    else:
        result["message"] = "¡Lista para cosechar!"
    
    return result