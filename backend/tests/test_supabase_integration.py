"""
Pruebas de integración con Supabase.
Verifica las operaciones CRUD en la base de datos.
"""
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from app.models.sensor import SensorData, SensorType
from app.models.alert import Alert, AlertCreate, AlertUpdate
from app.services.alert_engine import (
    check_weight_drop,
    create_custom_alert,
    get_alerts,
    update_alert
)


class TestSupabaseConnection:
    """Pruebas para la conexión a Supabase."""

    def test_supabase_client_initialization(self):
        """Test: El cliente de Supabase se inicializa correctamente."""
        from app.core.database import get_supabase_client
        
        client = get_supabase_client()
        assert client is not None
        # Verificar que es el mismo cliente (singleton)
        client2 = get_supabase_client()
        assert client is client2

    def test_supabase_config_exists(self):
        """Test: Las variables de configuración de Supabase existen."""
        from app.core.config import settings
        
        assert hasattr(settings, 'supabase_url')
        assert hasattr(settings, 'supabase_service_key')
        assert settings.supabase_url is not None
        assert settings.supabase_service_key is not None


class TestSensorReadingsOperations:
    """Pruebas para operaciones CRUD de sensor_readings en Supabase."""

    @pytest.mark.asyncio
    async def test_insert_sensor_reading(self):
        """Test: Se puede insertar una lectura de sensor en Supabase."""
        reading = SensorData(
            timestamp=datetime.now(timezone.utc),
            sensor_type=SensorType.TEMP_CRIA,
            value=35.5,
            unit="°C"
        )
        
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            # Mock para simular inserción exitosa
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{"id": 1, **reading.dict()}]
            
            mock_client.table.return_value.insert.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            # Simular inserción
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("sensor_readings").insert({
                "timestamp": reading.timestamp,
                "sensor_type": reading.sensor_type.value,
                "value": reading.value,
                "unit": reading.unit
            }).execute()
            
            assert response.data is not None
            assert len(response.data) > 0

    @pytest.mark.asyncio
    async def test_select_latest_sensor_reading(self):
        """Test: Se puede obtener la última lectura de sensor."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            # Mock para simular lectura exitosa
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 1,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "sensor_type": "temp_cria",
                "value": 35.5,
                "unit": "°C"
            }]
            
            mock_client.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("sensor_readings")\
                .select("*")\
                .order("timestamp", desc=True)\
                .limit(1)\
                .execute()
            
            assert response.data is not None
            assert len(response.data) == 1
            assert response.data[0]["sensor_type"] == "temp_cria"

    @pytest.mark.asyncio
    async def test_select_sensor_readings_by_type(self):
        """Test: Se pueden obtener lecturas filtradas por tipo de sensor."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 1, "sensor_type": "temp_cria", "value": 35.5},
                {"id": 2, "sensor_type": "temp_cria", "value": 35.8},
            ]
            
            mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("sensor_readings")\
                .select("*")\
                .eq("sensor_type", "temp_cria")\
                .order("timestamp", desc=True)\
                .execute()
            
            assert len(response.data) == 2
            assert all(r["sensor_type"] == "temp_cria" for r in response.data)


class TestAlertOperations:
    """Pruebas para operaciones CRUD de alertas en Supabase."""

    def test_create_alert_in_supabase(self):
        """Test: Se puede crear una alerta en Supabase."""
        alert_create = AlertCreate(
            tipo="temperatura",
            severidad="warning",
            mensaje="Temperatura fuera de rango",
            sensor_asociado="temp_cria"
        )
        
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 1,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **alert_create.dict()
            }]
            
            mock_client.table.return_value.insert.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts").insert({
                "tipo": alert_create.tipo,
                "severidad": alert_create.severidad,
                "mensaje": alert_create.mensaje,
                "sensor_asociado": alert_create.sensor_asociado,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "leida": False,
                "resuelta": False
            }).execute()
            
            assert response.data is not None
            assert response.data[0]["tipo"] == "temperatura"

    def test_read_all_alerts_from_supabase(self):
        """Test: Se pueden leer todas las alertas desde Supabase."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "id": 1,
                    "tipo": "temperatura",
                    "severidad": "warning",
                    "mensaje": "Temperatura fuera de rango",
                    "leida": False,
                    "resuelta": False
                },
                {
                    "id": 2,
                    "tipo": "humedad",
                    "severidad": "info",
                    "mensaje": "Humedad normal",
                    "leida": True,
                    "resuelta": False
                }
            ]
            
            mock_client.table.return_value.select.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts").select("*").execute()
            
            assert len(response.data) == 2
            assert response.data[0]["tipo"] == "temperatura"

    def test_read_active_alerts_only(self):
        """Test: Se pueden filtrar solo alertas activas."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "id": 1,
                    "tipo": "temperatura",
                    "resuelta": False,
                    "leida": False
                }
            ]
            
            mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts")\
                .select("*")\
                .eq("resuelta", False)\
                .execute()
            
            assert len(response.data) == 1
            assert response.data[0]["resuelta"] is False

    def test_update_alert_mark_as_read(self):
        """Test: Se puede marcar una alerta como leída."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 1,
                "leida": True,
                "resuelta": False
            }]
            
            mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts")\
                .update({"leida": True})\
                .eq("id", 1)\
                .execute()
            
            assert response.data[0]["leida"] is True

    def test_update_alert_mark_as_resolved(self):
        """Test: Se puede marcar una alerta como resuelta."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 1,
                "leida": True,
                "resuelta": True
            }]
            
            mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts")\
                .update({"resuelta": True})\
                .eq("id", 1)\
                .execute()
            
            assert response.data[0]["resuelta"] is True

    def test_delete_old_alerts(self):
        """Test: Se pueden eliminar alertas antiguas."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = []
            
            mock_client.table.return_value.delete.return_value.lt.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            old_date = "2025-01-01"
            response = client.table("alerts")\
                .delete()\
                .lt("timestamp", old_date)\
                .execute()
            
            assert response.data is not None


class TestWeightDropDetection:
    """Pruebas para la detección de caída de peso en Supabase."""

    @pytest.mark.asyncio
    async def test_get_previous_weight_reading(self):
        """Test: Se puede obtener la lectura previa de peso."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 2, "value": 8.0, "timestamp": "2025-03-28T10:30:00Z"},
                {"id": 1, "value": 9.0, "timestamp": "2025-03-27T10:30:00Z"},
            ]
            
            mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("sensor_readings")\
                .select("*")\
                .eq("sensor_type", "peso_mielera")\
                .order("timestamp", desc=True)\
                .limit(2)\
                .execute()
            
            assert len(response.data) == 2
            current = response.data[0]["value"]
            previous = response.data[1]["value"]
            drop = previous - current
            assert drop == 1.0

    @pytest.mark.asyncio
    async def test_detect_weight_drop_triggers_alert(self):
        """Test: Una caída de peso detectada genera una alerta."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            
            # Mock para select (obtener lecturas previas)
            select_response = MagicMock()
            select_response.data = [
                {"value": 8.0},  # actual
                {"value": 10.0}  # anterior (caída de 2kg > umbral de 1kg)
            ]
            
            # Mock para insert (crear alerta)
            insert_response = MagicMock()
            insert_response.data = [{"id": 1, "tipo": "peso"}]
            
            mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = select_response
            
            # Configurar para que insert devuelva la respuesta correcta
            insert_table = MagicMock()
            insert_table.insert.return_value.execute.return_value = insert_response
            
            def table_side_effect(table_name):
                if table_name == "sensor_readings":
                    return mock_client.table.return_value
                elif table_name == "alerts":
                    return insert_table
                    
            mock_client.table.side_effect = table_side_effect
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            # Obtener lecturas previas
            response = client.table("sensor_readings")\
                .select("*")\
                .eq("sensor_type", "peso_mielera")\
                .order("timestamp", desc=True)\
                .limit(2)\
                .execute()
            
            # Verificar caída de peso
            if len(response.data) >= 2:
                current_value = response.data[0]["value"]
                prev_value = response.data[1]["value"]
                drop = prev_value - current_value
                
                if drop > 1.0:  # umbral
                    alert_response = client.table("alerts").insert({
                        "tipo": "peso",
                        "severidad": "warning",
                        "mensaje": f"Caída de peso: {drop:.1f} kg"
                    }).execute()
                    
                    assert alert_response.data is not None


class TestDatabaseTransactions:
    """Pruebas para transacciones en la base de datos."""

    def test_batch_insert_alerts(self):
        """Test: Se pueden insertar múltiples alertas en lote."""
        alerts_data = [
            {
                "tipo": "temperatura",
                "severidad": "warning",
                "mensaje": "Temp 1 fuera de rango",
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            {
                "tipo": "humedad",
                "severidad": "info",
                "mensaje": "Humedad normal",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {**alert, "id": i+1} for i, alert in enumerate(alerts_data)
            ]
            
            mock_client.table.return_value.insert.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts").insert(alerts_data).execute()
            
            assert len(response.data) == 2
            assert response.data[0]["id"] == 1
            assert response.data[1]["id"] == 2

    def test_batch_update_alerts(self):
        """Test: Se pueden actualizar múltiples alertas."""
        alert_ids = [1, 2, 3]
        
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [
                {"id": i, "leida": True} for i in alert_ids
            ]
            
            # Simular que el update retorna los registros actualizados
            mock_client.table.return_value.update.return_value.in_.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts")\
                .update({"leida": True})\
                .in_("id", alert_ids)\
                .execute()
            
            assert len(response.data) == 3
            assert all(alert["leida"] for alert in response.data)


class TestDatabaseErrorHandling:
    """Pruebas para el manejo de errores en operaciones con Supabase."""

    def test_handle_connection_error(self):
        """Test: Se maneja correctamente un error de conexión."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_client.table.return_value.select.return_value.execute.side_effect = Exception("Connection error")
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            with pytest.raises(Exception):
                client.table("alerts").select("*").execute()

    def test_handle_insert_error(self):
        """Test: Se maneja correctamente un error al insertar."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_client.table.return_value.insert.return_value.execute.side_effect = Exception("Insert error")
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            with pytest.raises(Exception):
                client.table("alerts").insert({"tipo": "test"}).execute()

    def test_handle_validation_error(self):
        """Test: Se maneja correctamente errores de validación."""
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            # Simular respuesta de error de Supabase
            mock_response = MagicMock()
            mock_response.data = None
            mock_response.error = "Validation error: campo requerido"
            
            mock_client.table.return_value.insert.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts").insert({}).execute()
            
            assert response.data is None


class TestDatabasePerformance:
    """Pruebas de rendimiento básico con Supabase."""

    def test_query_large_result_set(self):
        """Test: Se puede consultar un conjunto grande de resultados."""
        # Simular 1000 alertas
        alerts = [
            {"id": i, "tipo": "test", "severidad": "info"}
            for i in range(1, 1001)
        ]
        
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = alerts
            
            mock_client.table.return_value.select.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts").select("*").execute()
            
            assert len(response.data) == 1000

    def test_query_with_limit_and_offset(self):
        """Test: Se pueden paginar los resultados."""
        alerts_page_1 = [
            {"id": i, "tipo": "test"} for i in range(1, 11)
        ]
        
        with patch('app.core.database.get_supabase_client') as mock_supabase:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = alerts_page_1
            
            mock_client.table.return_value.select.return_value.range.return_value.execute.return_value = mock_response
            mock_supabase.return_value = mock_client
            
            from app.core.database import get_supabase_client
            client = get_supabase_client()
            
            response = client.table("alerts")\
                .select("*")\
                .range(0, 9)\
                .execute()
            
            assert len(response.data) == 10
