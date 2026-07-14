"""
Configuración de pytest y fixtures compartidas para todas las pruebas.
"""
import pytest
from datetime import datetime, timezone
from app.models.sensor import SensorData, SensorType
from app.models.alert import Alert, AlertCreate, AlertUpdate


@pytest.fixture
def mock_sensor_reading():
    """Fixture: Lectura de sensor válida para pruebas."""
    return SensorData(
        id=1,
        timestamp=datetime.now(timezone.utc),
        sensor_type=SensorType.TEMP_CRIA,
        value=35.5,
        unit="°C"
    )


@pytest.fixture
def mock_alert():
    """Fixture: Alerta válida para pruebas."""
    return Alert(
        id=1,
        timestamp=datetime.now(timezone.utc),
        tipo="temperatura",
        severidad="warning",
        mensaje="Temperatura fuera de rango",
        sensor_asociado="temp_cria",
        leida=False,
        resuelta=False
    )


@pytest.fixture
def mock_alert_create():
    """Fixture: Datos para crear una alerta."""
    return AlertCreate(
        tipo="temperatura",
        severidad="warning",
        mensaje="Temperatura fuera de rango",
        sensor_asociado="temp_cria"
    )


@pytest.fixture
def mock_alert_update():
    """Fixture: Datos para actualizar una alerta."""
    return AlertUpdate(
        leida=True,
        resuelta=False
    )


@pytest.fixture
def sensor_readings_list():
    """Fixture: Lista de lecturas de diferentes sensores."""
    readings = [
        SensorData(
            timestamp=datetime.now(timezone.utc),
            sensor_type=SensorType.TEMP_CRIA,
            value=35.5,
            unit="°C"
        ),
        SensorData(
            timestamp=datetime.now(timezone.utc),
            sensor_type=SensorType.HUMEDAD_CRIA,
            value=65.0,
            unit="%"
        ),
        SensorData(
            timestamp=datetime.now(timezone.utc),
            sensor_type=SensorType.PESO_TOTAL,
            value=15.2,
            unit="kg"
        ),
        SensorData(
            timestamp=datetime.now(timezone.utc),
            sensor_type=SensorType.PESO_MIELERA,
            value=8.5,
            unit="kg"
        ),
    ]
    return readings
