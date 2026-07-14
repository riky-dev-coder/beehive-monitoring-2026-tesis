import logging
from typing import Optional

import httpx

from app.core.config import settings
from app.core.database import get_supabase_client

logger = logging.getLogger(__name__)


async def send_latest_recommendation_email() -> bool:
    """Envía por correo la última recomendación generada por la IA usando Resend."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY no configurada; se omite el envío del correo.")
        return False

    recommendation = await _get_latest_recommendation()
    if not recommendation:
        logger.info("No hay una recomendación reciente para enviar por correo.")
        return False

    title = recommendation.get("titulo") or "Recomendación IA"
    body = recommendation.get("recomendacion") or ""
    subject = f"Recomendación IA: {title}"
    text = f"{title}\n\n{body}".strip()

    payload = {
        "from": f"Beehive Monitoring <{settings.resend_from_email}>",
        "to": [settings.resend_to_email],
        "subject": subject,
        "text": text,
    }

    headers = {
        "Authorization": f"Bearer {settings.resend_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
    except Exception:
        logger.exception("Error al enviar el correo con la recomendación IA")
        return False

    logger.info("Correo enviado correctamente con la última recomendación IA")
    return True


async def _get_latest_recommendation() -> Optional[dict]:
    """Recupera la recomendación más reciente de la tabla de recomendaciones."""
    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("recommendations")
            .select("titulo, recomendacion")
            .order("generada_en", desc=True)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]
    except Exception:
        logger.exception("No se pudo recuperar la última recomendación para enviar por correo")
        return None
