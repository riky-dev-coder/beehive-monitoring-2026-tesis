import logging
from typing import Dict, List

try:
    import numpy as np
    from sklearn.tree import DecisionTreeClassifier
    SKLEARN_AVAILABLE = True
except Exception:
    np = None
    DecisionTreeClassifier = None
    SKLEARN_AVAILABLE = False

from app.core.database import get_supabase_client
from app.models.sensor import SensorType

logger = logging.getLogger(__name__)


def _label_from_rules(prev_sample: Dict, sample: Dict) -> str:
    """Genera una etiqueta heurística basada en reglas simples para entrenamiento.
    Retorna 'healthy', 'at_risk' o 'critical'.
    """
    score = 0

    # Temperatura de cría ideal aproximada (grados Celsius)
    t_cria = sample.get(SensorType.TEMP_CRIA.value)
    if t_cria is not None:
        if t_cria < 32 or t_cria > 38:
            score += 2
        elif t_cria < 33 or t_cria > 36:
            score += 1

    # Humedad de cría ideal aproximada
    h_cria = sample.get(SensorType.HUMEDAD_CRIA.value)
    if h_cria is not None:
        if h_cria < 30 or h_cria > 90:
            score += 2
        elif h_cria < 45 or h_cria > 75:
            score += 1

    # Cambio brusco de peso total -> señal de posible problema
    if prev_sample and sample.get(SensorType.PESO_TOTAL.value) is not None and prev_sample.get(SensorType.PESO_TOTAL.value) is not None:
        delta = sample[SensorType.PESO_TOTAL.value] - prev_sample[SensorType.PESO_TOTAL.value]
        # Pérdida rápida de más de 1.5kg es grave
        if delta < -1.5:
            score += 3
        elif delta < -0.5:
            score += 1

    if score >= 3:
        return "critical"
    elif score >= 1:
        return "at_risk"
    else:
        return "healthy"


def _features_from_sample(sample: Dict) -> List[float]:
    """Extrae vector de características en orden consistente."""
    keys = [
        SensorType.TEMP_CRIA.value,
        SensorType.TEMP_MIELERA.value,
        SensorType.TEMP_EXTERIOR.value,
        SensorType.HUMEDAD_CRIA.value,
        SensorType.HUMEDAD_MIELERA.value,
        SensorType.PESO_TOTAL.value,
        SensorType.PESO_MIELERA.value,
    ]
    return [float(sample.get(k, 0.0)) for k in keys]


def _apply_temperature_rules(sample: Dict) -> Dict:
    """Aplica reglas heurísticas solo de temperatura.

    Reglas (implementadas según la especificación del usuario):
    - Zona de cría (brood) óptima: 34–36 °C
    - Mielera aceptable: 30–38 °C
    - Exterior >=35 °C -> riesgo de sobrecalentamiento

    Estados retornados: 'healthy', 'at_risk' (estrés frío/calor), 'critical'
    """
    t_cria = sample.get(SensorType.TEMP_CRIA.value)
    t_mielera = sample.get(SensorType.TEMP_MIELERA.value)
    t_exterior = sample.get(SensorType.TEMP_EXTERIOR.value)

    details = {"t_cria": t_cria, "t_mielera": t_mielera, "t_exterior": t_exterior}

    # Si no hay temperatura de cría, no se puede aplicar la regla
    if t_cria is None and t_mielera is None and t_exterior is None:
        return {"status": "unknown", "confidence": 0.0, "details": {"method": "temp_rules", **details}}

    # Crítico: temperaturas extremas
    if (t_cria is not None and (t_cria < 30 or t_cria > 40)) or \
       (t_mielera is not None and (t_mielera < 20 or t_mielera > 45)) or \
       (t_exterior is not None and (t_exterior > 45 or t_exterior < -5)):
        return {"status": "critical", "confidence": 1.0, "details": {"method": "temp_rules", **details}}

    # Estrés por calor: cría alta o mielera fuera por calor o exterior >= 35
    if (t_cria is not None and t_cria > 36) or (t_mielera is not None and t_mielera > 38) or (t_exterior is not None and t_exterior >= 35):
        return {"status": "at_risk", "confidence": 0.9, "details": {"method": "temp_rules", "reason": "heat", **details}}

    # Estrés por frío: cría baja o exterior muy frío
    # Definimos "exterior muy frío" como < 10°C
    if (t_cria is not None and t_cria < 34) or (t_exterior is not None and t_exterior < 10):
        return {"status": "at_risk", "confidence": 0.9, "details": {"method": "temp_rules", "reason": "cold", **details}}

    # Normal: dentro de rangos óptimos
    if (t_cria is None or (34 <= t_cria <= 36)) and (t_mielera is None or (30 <= t_mielera <= 38)):
        return {"status": "healthy", "confidence": 0.95, "details": {"method": "temp_rules", **details}}

    # Fallback: en caso de duda, marcar como at_risk
    return {"status": "at_risk", "confidence": 0.5, "details": {"method": "temp_rules", **details}}


async def compute_hive_health() -> Dict:
    """Entrena un árbol de decisión simple sobre lecturas históricas etiquetadas por reglas
    y retorna la predicción para la última muestra disponible.

    Si no hay suficientes datos, aplica reglas directas sobre la última lectura.
    """
    supabase = get_supabase_client()
    # Traer un conjunto de lecturas recientes
    resp = supabase.table("sensor_readings")\
        .select("timestamp, sensor_type, value")\
        .order("timestamp", desc=True)\
        .limit(2000)\
        .execute()

    data = resp.data or []
    if not data:
        return {"status": "unknown", "confidence": 0.0, "message": "No hay datos"}

    # Agrupar por timestamp ISO (mantener como string para clave)
    samples = {}
    for row in data:
        ts = row.get("timestamp")
        if ts is None:
            continue
        if ts not in samples:
            samples[ts] = {}
        samples[ts][row.get("sensor_type")] = row.get("value")

    # Ordenar cronológicamente ascendente
    sorted_ts = sorted(samples.keys())
    rows = [samples[t] for t in sorted_ts]

    # Construir dataset de muestras con etiquetas heurísticas
    X = []
    y = []
    prev = None
    for sample in rows:
        # Solo usar muestras que contengan al menos peso_total y temp_cria
        if SensorType.PESO_TOTAL.value in sample and SensorType.TEMP_CRIA.value in sample:
            X.append(_features_from_sample(sample))
            y.append(_label_from_rules(prev, sample))
            prev = sample

    # Predecir sobre la última muestra disponible
    latest = rows[-1]

    # Aplicar reglas heurísticas de temperatura primero (modo solicitado)
    temp_result = _apply_temperature_rules(latest)
    # Si temp_result no es 'unknown', devolver inmediatamente (prioridad a reglas de temperatura)
    if temp_result.get("status") != "unknown":
        return temp_result

    # Si no hay suficientes muestras para entrenar, aplicar reglas a la última muestra
    if len(X) < 10 or not SKLEARN_AVAILABLE:
        label = _label_from_rules(rows[-2] if len(rows) > 1 else None, latest)
        details = {"method": "rules_fallback"}
        if not SKLEARN_AVAILABLE:
            details["sklearn"] = "not_available"
        return {
            "status": label,
            "confidence": 1.0,
            "details": details,
        }

    try:
        clf = DecisionTreeClassifier(random_state=0, max_depth=6)
        clf.fit(np.array(X), np.array(y))
        probs = clf.predict_proba([_features_from_sample(latest)])[0]
        classes = clf.classes_
        # Encontrar la probabilidad de la clase predicha
        pred = clf.predict([_features_from_sample(latest)])[0]
        prob = float(probs[list(classes).index(pred)]) if pred in classes else 0.0

        return {
            "status": pred,
            "confidence": round(prob, 3),
            "details": {"method": "decision_tree", "classes": list(classes)},
        }
    except Exception as e:
        logger.exception("Error entrenando o prediciendo árbol de decisión")
        # Fallback por reglas
        label = _label_from_rules(rows[-2] if len(rows) > 1 else None, latest)
        return {
            "status": label,
            "confidence": 0.0,
            "details": {"method": "rules_fallback", "error": str(e)},
        }
