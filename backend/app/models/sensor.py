from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class SensorType(str, Enum):
    PESO_TOTAL = "peso_total"
    PESO_MIELERA = "peso_mielera"
    TEMP_CRIA = "temp_cria"
    HUMEDAD_CRIA = "humedad_cria"
    TEMP_MIELERA = "temp_mielera"
    HUMEDAD_MIELERA = "humedad_mielera"
    TEMP_EXTERIOR = "temp_exterior"
    HUMEDAD_EXTERIOR = "humedad_exterior"

class SensorData(BaseModel):
    """Representa una lectura de un sensor en un instante de tiempo."""
    id: int | None = Field(None, description="Identificador único de la lectura (opcional en creación)")
    timestamp: datetime = Field(..., description="Fecha y hora de la lectura")
    sensor_type: SensorType = Field(..., description="Tipo de sensor")
    value: float = Field(..., description="Valor medido")
    unit: str | None = Field(None, description="Unidad de medida (ej. °C, %, kg)")

    class Config:
        from_attributes = True  # compatibilidad con ORM en SQLAlchemy
        json_schema_extra = {
            "example": {
                "id": 1,
                "timestamp": "2025-03-15T10:30:00Z",
                "sensor_type": "temp_cria",
                "value": 35.2,
                "unit": "°C"
            }
        }

class AggregatedSensorData(BaseModel):
    """Respuesta del endpoint /history con datos agrupados."""
    timestamp:   datetime
    sensor_type: str
    value:       float    # promedio del intervalo
    min_value:   float    # para bandas de error en el gráfico
    max_value:   float
    count:       int      # muestras en el bucket