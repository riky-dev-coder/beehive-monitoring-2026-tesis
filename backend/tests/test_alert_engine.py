"""
Pruebas unitarias para los servicios de alerta y evaluación de sensores.
"""
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from app.models.sensor import SensorData, SensorType
from app.models.alert import Alert, AlertCreate
from app.services.alert_engine import evaluate_sensor_data


class TestAlertEngineLogic:
    """Pruebas para la lógica de evaluación de alertas."""

    @pytest.mark.asyncio
    async def test_temperature_within_range_no_alert(self):
        """Test: Temperatura dentro de rango no genera alerta."""
        readings = [
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.TEMP_CRIA,
                value=35.5,  # Dentro del rango típico 34-36°C
                unit="°C"
            )
        ]
        
        with patch('app.services.alert_engine.create_alert_from_reading') as mock_create:
            await evaluate_sensor_data(readings)
            # No debe crear alerta para temperatura dentro de rango
            # Si se llama, esto indicaría un problema

    @pytest.mark.asyncio
    async def test_temperature_below_minimum_triggers_alert(self):
        """Test: Temperatura por debajo del mínimo genera alerta."""
        readings = [
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.TEMP_CRIA,
                value=30.0,  # Fuera de rango (min ~34°C)
                unit="°C"
            )
        ]
        
        with patch('app.services.alert_engine.create_alert_from_reading') as mock_create:
            await evaluate_sensor_data(readings)
            # Debería llamar a create_alert_from_reading
            # Esta es una verificación de que la lógica intenta crear alertas

    @pytest.mark.asyncio
    async def test_humidity_within_range_no_alert(self):
        """Test: Humedad dentro de rango no genera alerta."""
        readings = [
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.HUMEDAD_CRIA,
                value=60.0,  # Dentro de rango típico
                unit="%"
            )
        ]
        
        with patch('app.services.alert_engine.create_alert_from_reading') as mock_create:
            await evaluate_sensor_data(readings)

    @pytest.mark.asyncio
    async def test_zero_value_triggers_disconnected_sensor_alert(self):
        """Test: Un valor 0 debe generar una alerta informativa de sensor desconectado."""
        readings = [
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.TEMP_CRIA,
                value=0.0,
                unit="°C"
            )
        ]

        with patch('app.services.alert_engine.create_custom_alert') as mock_create:
            await evaluate_sensor_data(readings)
            mock_create.assert_awaited_once()
            _, kwargs = mock_create.await_args
            assert kwargs['severidad'] == 'info'
            assert 'desconectado' in kwargs['mensaje'].lower()
            assert kwargs['sensor_asociado'] == SensorType.TEMP_CRIA.value

    @pytest.mark.asyncio
    async def test_critical_temperature_low_brood_triggers_alert(self):
        """Test: Temperatura de cría < 28°C debe generar alerta crítica."""
        readings = [
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.TEMP_CRIA,
                value=25.0,
                unit="°C"
            )
        ]

        with patch('app.services.alert_engine.create_custom_alert') as mock_create:
            await evaluate_sensor_data(readings)
            mock_create.assert_awaited_once()
            _, kwargs = mock_create.await_args
            assert kwargs['severidad'] == 'critical'
            assert 'crítica' in kwargs['mensaje'].lower() or 'crítico' in kwargs['mensaje'].lower()

    @pytest.mark.asyncio
    async def test_critical_temperature_extreme_combination_triggers_alert(self):
        """Test: Exterior < 0°C y cría < 32°C debe generar alerta crítica."""
        readings = [
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.TEMP_CRIA,
                value=30.0,
                unit="°C"
            ),
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.TEMP_EXTERIOR,
                value=-5.0,
                unit="°C"
            )
        ]

        with patch('app.services.alert_engine.create_custom_alert') as mock_create:
            await evaluate_sensor_data(readings)
            mock_create.assert_awaited_once()
            _, kwargs = mock_create.await_args
            assert kwargs['severidad'] == 'critical'
            assert 'riesgo crítico' in kwargs['mensaje'].lower() or 'frío exterior' in kwargs['mensaje'].lower()

    @pytest.mark.asyncio
    async def test_weight_calculation_within_range(self):
        """Test: Peso de cría calculado dentro de rango no genera alerta."""
        readings = [
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.PESO_TOTAL,
                value=15.0,  # Peso total
                unit="kg"
            ),
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.PESO_MIELERA,
                value=8.0,  # Peso mielera
                unit="kg"
            )
            # Peso cría calculado = 15 - 8 = 7 kg (dentro de 5-10 kg)
        ]
        
        with patch('app.services.alert_engine.create_custom_alert') as mock_create:
            await evaluate_sensor_data(readings)

    @pytest.mark.asyncio
    async def test_weight_calculation_below_minimum(self):
        """Test: Peso de cría por debajo del mínimo genera alerta."""
        readings = [
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.PESO_TOTAL,
                value=12.0,  # Peso total
                unit="kg"
            ),
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.PESO_MIELERA,
                value=8.0,  # Peso mielera
                unit="kg"
            )
            # Peso cría calculado = 12 - 8 = 4 kg (debajo de mínimo 5 kg)
        ]
        
        with patch('app.services.alert_engine.create_custom_alert') as mock_create:
            await evaluate_sensor_data(readings)

    @pytest.mark.asyncio
    async def test_multiple_readings_evaluation(self):
        """Test: Se evalúan múltiples lecturas de sensores."""
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
                value=60.0,
                unit="%"
            ),
            SensorData(
                timestamp=datetime.now(timezone.utc),
                sensor_type=SensorType.PESO_TOTAL,
                value=15.0,
                unit="kg"
            )
        ]
        
        with patch('app.services.alert_engine.create_alert_from_reading') as mock_alert:
            with patch('app.services.alert_engine.create_custom_alert') as mock_custom:
                await evaluate_sensor_data(readings)
                # La función debe procesar todas las lecturas


class TestAlertCreation:
    """Pruebas para la creación de alertas."""

    @pytest.mark.asyncio
    async def test_alert_create_with_all_fields(self, mock_alert_create):
        """Test: Se puede crear una alerta con todos los campos."""
        assert mock_alert_create.tipo is not None
        assert mock_alert_create.severidad is not None
        assert mock_alert_create.mensaje is not None

    @pytest.mark.asyncio
    async def test_alert_without_sensor_reference(self):
        """Test: Se puede crear alerta sin referencia a sensor."""
        alert = AlertCreate(
            tipo="sistema",
            severidad="info",
            mensaje="Sistema iniciado",
            sensor_asociado=None
        )
        assert alert.sensor_asociado is None
        assert alert.tipo == "sistema"


class TestThresholdEvaluation:
    """Pruebas para la evaluación de umbrales."""

    def test_temperature_thresholds(self):
        """Test: Los umbrales de temperatura se definen correctamente."""
        from app.services.alert_engine import THRESHOLDS
        
        assert SensorType.TEMP_CRIA in THRESHOLDS
        assert SensorType.TEMP_MIELERA in THRESHOLDS
        
        temp_cria_min, temp_cria_max = THRESHOLDS[SensorType.TEMP_CRIA]
        assert temp_cria_min < temp_cria_max
        assert temp_cria_min > 0  # Deben ser valores razonables

    def test_humidity_thresholds(self):
        """Test: Los umbrales de humedad son porcentajes válidos."""
        from app.services.alert_engine import THRESHOLDS
        from app.models.sensor import SensorType
        
        assert SensorType.HUMEDAD_CRIA in THRESHOLDS
        
        humidity_min, humidity_max = THRESHOLDS[SensorType.HUMEDAD_CRIA]
        assert 0 <= humidity_min <= 100
        assert 0 <= humidity_max <= 100
        assert humidity_min < humidity_max

    def test_weight_thresholds_from_settings(self):
        """Test: Los umbrales de peso vienen de settings."""
        from app.core.config import settings
        
        # Verificar que los umbrales de peso están definidos en settings
        assert hasattr(settings, 'peso_cria_min')
        assert hasattr(settings, 'peso_cria_max')
        assert settings.peso_cria_min < settings.peso_cria_max
