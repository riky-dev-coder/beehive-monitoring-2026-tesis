"""
Pruebas unitarias para los modelos Pydantic de sensores y alertas.
"""
import pytest
from datetime import datetime, timezone
from pydantic import ValidationError
from app.models.sensor import SensorData, SensorType, AggregatedSensorData
from app.models.alert import Alert, AlertCreate, AlertUpdate


class TestSensorDataModel:
    """Pruebas para el modelo SensorData."""

    def test_sensor_data_creation(self, mock_sensor_reading):
        """Test: Creación exitosa de una lectura de sensor."""
        assert mock_sensor_reading.sensor_type == SensorType.TEMP_CRIA
        assert mock_sensor_reading.value == 35.5
        assert mock_sensor_reading.unit == "°C"
        assert mock_sensor_reading.timestamp is not None

    def test_sensor_data_without_id(self):
        """Test: Se puede crear un SensorData sin ID (None es válido)."""
        reading = SensorData(
            timestamp=datetime.now(timezone.utc),
            sensor_type=SensorType.HUMEDAD_CRIA,
            value=65.0,
            unit="%"
        )
        assert reading.id is None
        assert reading.value == 65.0

    def test_sensor_data_invalid_type(self):
        """Test: SensorData rechaza tipo de sensor inválido."""
        with pytest.raises(ValueError):
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type="sensor_invalido",
                value=32.0,
                unit="°C"
            )

    def test_sensor_data_missing_required_field(self):
        """Test: SensorData requiere campo timestamp."""
        with pytest.raises(ValidationError):
            SensorData(
                sensor_type=SensorType.TEMP_CRIA,
                value=32.0,
                unit="°C"
            )

    def test_sensor_data_all_types(self):
        """Test: Se pueden crear sensores de todos los tipos."""
        sensor_types = [
            SensorType.PESO_TOTAL,
            SensorType.PESO_MIELERA,
            SensorType.TEMP_CRIA,
            SensorType.HUMEDAD_CRIA,
            SensorType.TEMP_MIELERA,
            SensorType.HUMEDAD_MIELERA,
            SensorType.TEMP_EXTERIOR,
            SensorType.HUMEDAD_EXTERIOR,
        ]
        
        for sensor_type in sensor_types:
            reading = SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=sensor_type,
                value=25.0,
                unit="unit"
            )
            assert reading.sensor_type == sensor_type


class TestAggregatedSensorDataModel:
    """Pruebas para el modelo AggregatedSensorData."""

    def test_aggregated_sensor_data_creation(self):
        """Test: Creación correcta de datos agregados."""
        agg_data = AggregatedSensorData(
            timestamp=datetime.now(timezone.utc),
            sensor_type="temp_cria",
            value=35.2,
            min_value=34.5,
            max_value=36.0,
            count=12
        )
        assert agg_data.value == 35.2
        assert agg_data.min_value == 34.5
        assert agg_data.max_value == 36.0
        assert agg_data.count == 12

    def test_aggregated_sensor_data_missing_count(self):
        """Test: count es un campo requerido en datos agregados."""
        with pytest.raises(ValidationError):
            AggregatedSensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type="temp_cria",
                value=35.2,
                min_value=34.5,
                max_value=36.0
            )


class TestAlertModel:
    """Pruebas para los modelos de alerta."""

    def test_alert_creation(self, mock_alert):
        """Test: Creación exitosa de una alerta."""
        assert mock_alert.id == 1
        assert mock_alert.tipo == "temperatura"
        assert mock_alert.severidad == "warning"
        assert not mock_alert.leida
        assert not mock_alert.resuelta

    def test_alert_create_model(self, mock_alert_create):
        """Test: Modelo AlertCreate para creación de alertas."""
        assert mock_alert_create.tipo == "temperatura"
        assert mock_alert_create.severidad == "warning"
        # AlertCreate no tiene id ni timestamp
        assert not hasattr(mock_alert_create, 'id') or mock_alert_create.id is None

    def test_alert_update_model(self, mock_alert_update):
        """Test: Modelo AlertUpdate para actualizar alertas."""
        assert mock_alert_update.leida is True
        assert mock_alert_update.resuelta is False

    def test_alert_required_fields(self):
        """Test: AlertCreate requiere campos obligatorios."""
        with pytest.raises(ValidationError):
            AlertCreate(
                tipo="temperatura",
                # falta severidad y mensaje
            )

    def test_alert_optional_fields(self):
        """Test: AlertCreate permite campos opcionales como None."""
        alert = AlertCreate(
            tipo="temperatura",
            severidad="warning",
            mensaje="Sistema funcionando",
            sensor_asociado=None
        )
        assert alert.sensor_asociado is None

    def test_alert_severity_values(self):
        """Test: Se aceptan diferentes niveles de severidad."""
        severities = ["info", "warning", "critical"]
        for severity in severities:
            alert = AlertCreate(
                tipo="test",
                severidad=severity,
                mensaje="Mensaje test"
            )
            assert alert.severidad == severity

    def test_alert_all_fields_in_response(self):
        """Test: Alert contiene todos los campos esperados."""
        alert = Alert(
            id=1,
            timestamp=datetime.now(timezone.utc),
            tipo="temperatura",
            severidad="warning",
            mensaje="Temperatura fuera de rango",
            sensor_asociado="temp_cria",
            leida=False,
            resuelta=False
        )
        assert hasattr(alert, 'id')
        assert hasattr(alert, 'timestamp')
        assert hasattr(alert, 'tipo')
        assert hasattr(alert, 'severidad')
        assert hasattr(alert, 'mensaje')
        assert hasattr(alert, 'sensor_asociado')
        assert hasattr(alert, 'leida')
        assert hasattr(alert, 'resuelta')
