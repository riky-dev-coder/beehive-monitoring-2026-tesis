"""
Pruebas unitarias para utilidades, configuración y funciones auxiliares.
"""
import pytest
from datetime import datetime, timezone
from app.api.routes.sensor_data import _month_range


class TestDateTimeUtilities:
    """Pruebas para utilitarios de fecha y hora."""

    def test_month_range_january(self):
        """Test: Rango de enero es correcto."""
        start, end = _month_range(2025, 1)
        
        assert start.year == 2025
        assert start.month == 1
        assert start.day == 1
        assert start.hour == 0
        assert start.minute == 0
        
        assert end.year == 2025
        assert end.month == 1
        assert end.day == 31
        assert end.hour == 23
        assert end.minute == 59

    def test_month_range_february_leap_year(self):
        """Test: Rango de febrero en año bisiesto."""
        start, end = _month_range(2024, 2)  # 2024 es bisiesto
        
        assert start.day == 1
        assert end.day == 29  # Febrero con 29 días

    def test_month_range_february_non_leap_year(self):
        """Test: Rango de febrero en año no bisiesto."""
        start, end = _month_range(2025, 2)  # 2025 no es bisiesto
        
        assert start.day == 1
        assert end.day == 28  # Febrero con 28 días

    def test_month_range_december(self):
        """Test: Rango de diciembre es correcto."""
        start, end = _month_range(2025, 12)
        
        assert start.month == 12
        assert end.month == 12
        assert end.day == 31

    def test_month_range_timezone_utc(self):
        """Test: Los rangos de mes usan zona horaria UTC."""
        start, end = _month_range(2025, 3)
        
        assert start.tzinfo is not None
        assert str(start.tzinfo) == 'UTC'
        assert end.tzinfo is not None
        assert str(end.tzinfo) == 'UTC'

    def test_month_range_all_months(self):
        """Test: Todos los meses tienen rangos válidos."""
        for month in range(1, 13):
            start, end = _month_range(2025, month)
            assert start < end
            assert start.month == month
            assert end.month == month


class TestConfigurationSettings:
    """Pruebas para la configuración de la aplicación."""

    def test_settings_loaded(self):
        """Test: Las configuraciones se cargan correctamente."""
        from app.core.config import settings
        
        assert hasattr(settings, 'temp_cria_min')
        assert hasattr(settings, 'temp_cria_max')
        assert hasattr(settings, 'humedad_cria_min')
        assert hasattr(settings, 'humedad_cria_max')

    def test_temperature_thresholds_valid(self):
        """Test: Los umbrales de temperatura tienen valores válidos."""
        from app.core.config import settings
        
        assert settings.temp_cria_min > 0
        assert settings.temp_cria_max > settings.temp_cria_min
        assert settings.temp_cria_min < 50  # Temperatura razonable

    def test_humidity_thresholds_valid(self):
        """Test: Los umbrales de humedad son porcentajes válidos."""
        from app.core.config import settings
        
        assert 0 <= settings.humedad_cria_min <= 100
        assert 0 <= settings.humedad_cria_max <= 100
        assert settings.humedad_cria_min < settings.humedad_cria_max

    def test_database_config_exists(self):
        """Test: La configuración de base de datos existe."""
        from app.core.config import settings
        
        # Debe haber configuración para Supabase
        assert hasattr(settings, 'supabase_url') or hasattr(settings, 'DATABASE_URL')

    def test_thingspeak_config_exists(self):
        """Test: La configuración de ThingSpeak existe."""
        from app.core.config import settings
        
        assert hasattr(settings, 'thingspeak_channel_id')
        assert hasattr(settings, 'thingspeak_read_api_key')


class TestSensorTypeValidation:
    """Pruebas para validación de tipos de sensores."""

    def test_all_sensor_types_defined(self):
        """Test: Todos los tipos de sensores esperados están definidos."""
        from app.models.sensor import SensorType
        
        expected_types = [
            'peso_total',
            'peso_mielera',
            'temp_cria',
            'humedad_cria',
            'temp_mielera',
            'humedad_mielera',
            'temp_exterior',
            'humedad_exterior'
        ]
        
        for sensor_type in expected_types:
            assert hasattr(SensorType, sensor_type.upper())

    def test_sensor_type_enum_values(self):
        """Test: Los valores del enum de SensorType son strings."""
        from app.models.sensor import SensorType
        
        for sensor_type in SensorType:
            assert isinstance(sensor_type.value, str)


class TestResolutionMapping:
    """Pruebas para mapeo de resoluciones de datos."""

    def test_resolution_map_exists(self):
        """Test: El mapa de resoluciones está definido."""
        from app.api.routes.sensor_data import RESOLUTION_MAP
        
        assert RESOLUTION_MAP is not None
        assert isinstance(RESOLUTION_MAP, dict)

    def test_resolution_map_has_expected_keys(self):
        """Test: El mapa de resoluciones tiene las claves esperadas."""
        from app.api.routes.sensor_data import RESOLUTION_MAP
        
        expected_keys = ["1h", "24h", "7d", "month"]
        for key in expected_keys:
            assert key in RESOLUTION_MAP

    def test_resolution_values_are_time_strings(self):
        """Test: Los valores de resolución son cadenas de tiempo válidas."""
        from app.api.routes.sensor_data import RESOLUTION_MAP
        
        for resolution, time_string in RESOLUTION_MAP.items():
            assert isinstance(time_string, str)
            assert "minute" in time_string or "hour" in time_string or "day" in time_string
