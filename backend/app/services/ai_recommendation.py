# services/ai_recommendation.py
import httpx
from typing import List, Optional, Tuple
from app.core.config import settings
from app.models.alert import Alert
import logging

logger = logging.getLogger(__name__)

# Etiquetas legibles por sensor
SENSOR_LABELS = {
    "temp_cria":       "temperatura de cámara de cría",
    "temp_mielera":    "temperatura de cámara mielera",
    "humedad_cria":    "humedad de cámara de cría",
    "humedad_mielera": "humedad de cámara mielera",
    "peso_total":      "peso total de la colmena",
    "peso_mielera":    "peso de la cámara mielera",
}

SEVERITY_LABELS = {
    "critical": "crítica",
    "warning":  "preventiva",
    "info":     "informativa",
}

# System prompt compartido para el chat
_CHAT_SYSTEM_PROMPT = """\
Eres un experto apicultor y biólogo especializado en apicultura moderna con más de 20 años \
de experiencia. Tu rol es asistir a apicultores en el monitoreo y manejo de sus colmenas \
a través de un sistema IoT de sensores.

Tienes conocimiento profundo sobre:
- Comportamiento de abejas (Apis mellifera y otras especies)
- Parámetros óptimos de temperatura, humedad y peso en colmenas
- Enfermedades apícolas: varroasis, loque americana/europea, nosemosis, etc.
- Interpretación de alertas de sensores y qué acciones tomar
- Técnicas de manejo apícola: revisiones, cosecha, alimentación, tratamientos
- Síndrome de colapso de colonias (CCD) y su prevención
- Normativa y buenas prácticas apícolas

Responde siempre en español. Sé concreto, práctico y empático con el apicultor. \
Usa un lenguaje claro pero profesional. Cuando des pasos de acción, enuméralos. \
Si necesitas más información para dar una respuesta precisa, pregunta. \
Máximo 250 palabras por respuesta.\
"""


# ── Chat conversacional ──────────────────────────────────────────────────────

async def chat_with_beekeeper_ai(
    message: str,
    history: List[dict],
) -> str:
    """
    Mantiene una conversación multi-turno con el asistente apícola.

    Args:
        message:  Último mensaje del usuario.
        history:  Lista de mensajes previos [{ "role": "user"|"assistant", "content": "..." }].
                  El mensaje actual NO debe estar incluido en history.

    Returns:
        Texto de respuesta del asistente.
    """
    # Limitar historial a los últimos 10 turnos para no exceder el context window
    trimmed_history = history[-10:] if len(history) > 10 else history

    messages = [
        *trimmed_history,
        {"role": "user", "content": message},
    ]

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://colmena-monitor.app",
    }

    payload = {
        "model": "deepseek/deepseek-v3.2",
        "messages": [
            {"role": "system", "content": _CHAT_SYSTEM_PROMPT},
            *messages,
        ],
        "temperature": 0.7,
        "max_tokens": 500,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.exception("Error en chat_with_beekeeper_ai")
            return (
                "Lo siento, no pude procesar tu consulta en este momento. "
                f"Por favor intenta de nuevo. (Error: {str(e)})"
            )


# ── Generación de recomendaciones desde alertas ──────────────────────────────

async def generate_recommendation_from_alerts(
    alerts: List[Alert],
    severidad: str,
    historical_context: str = "",
) -> Tuple[str, str]:
    """
    Genera título + texto de recomendación a partir de una lista de alertas
    y contexto histórico de comentarios del apicultor.

    Retorna: (titulo, recomendacion)
    """
    context = _build_alert_context(alerts)
    prompt = _build_prompt(context, severidad, historical_context)

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://colmena-monitor.app",
    }

    payload = {
        "model": "z-ai/glm-4.5-air:free",
        "messages": [
            {
                "role": "system",
                "content": (
                    "Eres un experto en apicultura. Tu tarea es analizar alertas de sensores "
                    "de una colmena y generar recomendaciones claras y accionables para el apicultor. "
                    "Responde SIEMPRE en español. Sé conciso (máximo 200 palabras en la recomendación)."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.6,
        "max_tokens": 400,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            raw = data["choices"][0]["message"]["content"].strip()
            return _parse_response(raw, alerts, severidad)
        except Exception as e:
            logger.exception("Error al llamar a OpenRouter")
            fallback_title = _fallback_title(alerts, severidad)
            return fallback_title, f"No se pudo generar una recomendación automática. Error: {str(e)}"


# ── Construcción del prompt ──────────────────────────────────────────────────

def _build_alert_context(alerts: List[Alert]) -> str:
    lines = []
    for a in alerts:
        sensor_label = SENSOR_LABELS.get(a.sensor_asociado or "", a.sensor_asociado or a.tipo)
        sev_label    = SEVERITY_LABELS.get(a.severidad, a.severidad)
        lines.append(
            f"- Alerta {sev_label} en {sensor_label}: {a.mensaje} "
            f"(detectada a las {a.timestamp.strftime('%H:%M')})"
        )
    return "\n".join(lines)


def _build_prompt(context: str, severidad: str, historical_context: str) -> str:
    sev_label = SEVERITY_LABELS.get(severidad, severidad)
    duracion  = "2 minutos" if severidad == "critical" else "15 minutos"

    historical_section = ""
    if historical_context:
        historical_section = f"""
=== Experiencia previa del apicultor (para referencia) ===
{historical_context}
"""

    return f"""Se han detectado las siguientes alertas de tipo {sev_label.upper()} \
de forma continua durante al menos {duracion} en la colmena:

=== Alertas detectadas ===
{context}
{historical_section}
Basándote en estas alertas, genera:
1. TITULO: Un título corto (máximo 10 palabras) que describa el problema principal.
2. RECOMENDACION: Pasos concretos que el apicultor debe tomar ahora mismo.

Usa exactamente este formato:
TITULO: <título aquí>
RECOMENDACION: <recomendación aquí>"""


def _parse_response(raw: str, alerts: List[Alert], severidad: str) -> Tuple[str, str]:
    """Extrae TITULO y RECOMENDACION del texto generado por el LLM."""
    titulo        = _fallback_title(alerts, severidad)
    recomendacion = raw

    lines = raw.splitlines()
    rec_lines = []
    capturing = False

    for line in lines:
        stripped = line.strip()
        if stripped.upper().startswith("TITULO:"):
            titulo = stripped[len("TITULO:"):].strip()
        elif stripped.upper().startswith("RECOMENDACION:"):
            capturing = True
            text = stripped[len("RECOMENDACION:"):].strip()
            if text:
                rec_lines.append(text)
        elif capturing:
            rec_lines.append(stripped)

    if rec_lines:
        recomendacion = " ".join(rec_lines).strip()

    return titulo, recomendacion


def _fallback_title(alerts: List[Alert], severidad: str) -> str:
    """Título de respaldo si el LLM no devuelve el formato esperado."""
    if not alerts:
        return f"Alerta {SEVERITY_LABELS.get(severidad, severidad)}"

    sensor = alerts[0].sensor_asociado or alerts[0].tipo or ""
    sensor_label = SENSOR_LABELS.get(sensor, sensor.replace("_", " "))
    sev_label    = SEVERITY_LABELS.get(severidad, severidad)
    return f"Alerta de {sensor_label} {sev_label}"