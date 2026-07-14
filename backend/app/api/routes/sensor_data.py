from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import calendar

from app.models.sensor import SensorData, SensorType, AggregatedSensorData
from app.services.data_fetcher import (
    get_latest_readings,
    get_historical_readings_aggregated,
    get_months_with_data,
)

router = APIRouter(prefix="/sensors", tags=["sensors"])

RESOLUTION_MAP = {
    "1h":    "1 minute",
    "24h":   "5 minutes",
    "7d":    "1 hour",
    "month": "6 hours",
}


def _month_range(year: int, month: int):
    """Devuelve (inicio, fin) UTC del mes dado."""
    first = datetime(year, month, 1, tzinfo=timezone.utc)
    last  = datetime(
        year, month,
        calendar.monthrange(year, month)[1],
        23, 59, 59,
        tzinfo=timezone.utc,
    )
    return first, last


@router.get("/latest", response_model=List[SensorData])
async def get_latest_sensor_data():
    try:
        return await get_latest_readings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=List[AggregatedSensorData])
async def get_sensor_history(
    sensor_type: Optional[SensorType] = None,
    time_range: str = Query(
        "24h",
        regex="^(1h|24h|7d|month)$",
        description="Rango: '1h' | '24h' | '7d' | 'month'",
    ),
    # Solo requeridos cuando time_range='month'
    month: Optional[int] = Query(None, ge=1, le=12),
    year:  Optional[int] = Query(None, ge=2025),
):
    """
    Retorna datos históricos AGREGADOS por intervalo de tiempo.

    | time_range | Intervalo | Puntos aprox |
    |------------|-----------|--------------|
    | 1h         | 1 min     | ~60          |
    | 24h        | 5 min     | ~288         |
    | 7d         | 1 hora    | ~168         |
    | month      | 6 horas   | ~120         |
    """
    try:
        now = datetime.now(timezone.utc)

        if time_range == "1h":
            start_date, end_date = now - timedelta(hours=1), now

        elif time_range == "24h":
            start_date, end_date = now - timedelta(hours=24), now

        elif time_range == "7d":
            start_date, end_date = now - timedelta(days=7), now

        elif time_range == "month":
            if month is None or year is None:
                raise HTTPException(
                    status_code=422,
                    detail="Se requieren 'month' y 'year' cuando time_range='month'",
                )
            start_date, end_date = _month_range(year, month)

        return await get_historical_readings_aggregated(
            sensor_type=sensor_type,
            start_date=start_date,
            end_date=end_date,
            resolution=RESOLUTION_MAP[time_range],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/available-months")
async def get_available_months():
    """Lista de meses con datos. El frontend lo usa para el selector."""
    try:
        return await get_months_with_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/harvest-readiness")
async def get_harvest_readiness():
    from app.services.prediction import get_harvest_readiness
    return await get_harvest_readiness()