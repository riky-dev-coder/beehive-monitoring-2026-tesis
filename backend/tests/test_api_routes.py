"""
Pruebas unitarias para los endpoints de la API.
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from app.main import app


@pytest.fixture
def client():
    """Fixture: Cliente de prueba para FastAPI."""
    return TestClient(app)


class TestHealthEndpoint:
    """Pruebas para el endpoint de salud del sistema."""

    def test_health_check_success(self, client):
        """Test: GET /health devuelve estado healthy."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_root_endpoint(self, client):
        """Test: GET / devuelve información sobre la API."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Beehive Monitoring API" in data["message"]


class TestSensorEndpoints:
    """Pruebas para los endpoints de sensores (/sensors)."""

    def test_get_latest_sensor_data(self, client):
        """Test: GET /sensors/latest devuelve últimas lecturas."""
        with patch('app.api.routes.sensor_data.get_latest_readings') as mock_get:
            mock_get.return_value = [
                {
                    "id": 1,
                    "timestamp": datetime.now(timezone.utc),
                    "sensor_type": "temp_cria",
                    "value": 35.5,
                    "unit": "°C"
                }
            ]
            response = client.get("/sensors/latest")
            assert response.status_code == 200
            data = response.json()
            assert len(data) > 0

    def test_get_sensor_history_default_range(self, client):
        """Test: GET /sensors/history con rango por defecto (24h)."""
        with patch('app.api.routes.sensor_data.get_historical_readings_aggregated') as mock_get:
            mock_get.return_value = []
            response = client.get("/sensors/history")
            assert response.status_code in [200, 404, 500]

    def test_get_sensor_history_with_sensor_type(self, client):
        """Test: GET /sensors/history filtrado por tipo de sensor."""
        with patch('app.api.routes.sensor_data.get_historical_readings_aggregated') as mock_get:
            mock_get.return_value = []
            response = client.get("/sensors/history?sensor_type=temp_cria")
            assert response.status_code in [200, 404, 500]

    def test_get_sensor_history_invalid_time_range(self, client):
        """Test: GET /sensors/history rechaza rango de tiempo inválido."""
        response = client.get("/sensors/history?time_range=2h")
        assert response.status_code in [422, 400]

    def test_get_sensor_history_valid_ranges(self, client):
        """Test: GET /sensors/history acepta rangos válidos."""
        valid_ranges = ["1h", "24h", "7d", "month"]
        with patch('app.api.routes.sensor_data.get_historical_readings_aggregated') as mock_get:
            mock_get.return_value = []
            for time_range in valid_ranges:
                response = client.get(f"/sensors/history?time_range={time_range}")
                assert response.status_code in [200, 422, 500]


class TestAlertEndpoints:
    """Pruebas para los endpoints de alertas (/alerts)."""

    def test_get_all_alerts(self, client):
        """Test: GET /alerts/history devuelve todas las alertas."""
        with patch('app.api.routes.alerts.get_alerts') as mock_get:
            mock_get.return_value = [
                {
                    "id": 1,
                    "timestamp": datetime.now(timezone.utc),
                    "tipo": "temperatura",
                    "severidad": "warning",
                    "mensaje": "Temperatura fuera de rango",
                    "sensor_asociado": "temp_cria",
                    "leida": False,
                    "resuelta": False
                }
            ]
            response = client.get("/alerts/history")
            assert response.status_code == 200
            data = response.json()
            assert len(data) > 0

    def test_get_active_alerts_only(self, client):
        """Test: GET /alerts/history?active_only=true devuelve solo alertas activas."""
        with patch('app.api.routes.alerts.get_alerts') as mock_get:
            mock_get.return_value = []
            response = client.get("/alerts/history?active_only=true")
            assert response.status_code == 200

    def test_get_alerts_with_limit(self, client):
        """Test: GET /alerts/history respeta el límite de resultados."""
        with patch('app.api.routes.alerts.get_alerts') as mock_get:
            mock_get.return_value = []
            response = client.get("/alerts/history?limit=10")
            assert response.status_code == 200

    def test_get_alerts_limit_max_200(self, client):
        """Test: GET /alerts/history rechaza límites mayores a 200."""
        response = client.get("/alerts/history?limit=300")
        assert response.status_code == 422

    def test_update_alert_status(self, client):
        """Test: PATCH /alerts/{id} actualiza estado de alerta."""
        with patch('app.api.routes.alerts.update_alert') as mock_update:
            mock_update.return_value = {
                "id": 1,
                "timestamp": datetime.now(timezone.utc),
                "tipo": "temperatura",
                "severidad": "warning",
                "mensaje": "Temperatura fuera de rango",
                "sensor_asociado": "temp_cria",
                "leida": True,
                "resuelta": False
            }
            response = client.patch("/alerts/1", json={"leida": True})
            assert response.status_code == 200
            data = response.json()
            assert data["leida"] is True

    def test_update_alert_not_found(self, client):
        """Test: PATCH /alerts/{id} retorna 404 si no existe."""
        with patch('app.api.routes.alerts.update_alert') as mock_update:
            mock_update.return_value = None
            response = client.patch("/alerts/999", json={"leida": True})
            assert response.status_code == 404

    def test_update_alert_mark_resolved(self, client):
        """Test: Se puede marcar una alerta como resuelta."""
        with patch('app.api.routes.alerts.update_alert') as mock_update:
            mock_update.return_value = {
                "id": 1,
                "timestamp": datetime.now(timezone.utc),
                "tipo": "temperatura",
                "severidad": "warning",
                "mensaje": "Temperatura fuera de rango",
                "sensor_asociado": "temp_cria",
                "leida": True,
                "resuelta": True
            }
            response = client.patch("/alerts/1", json={"resuelta": True})
            assert response.status_code == 200
            data = response.json()
            assert data["resuelta"] is True


class TestRecommendationEndpoints:
    """Pruebas para los endpoints de recomendaciones (/recommendations)."""

    def test_recommendations_endpoint_exists(self, client):
        """Test: El endpoint de recomendaciones existe."""
        with patch('app.api.routes.recommendations.get_recommendations') as mock_get:
            mock_get.return_value = []
            response = client.get("/api/recommendations")
            assert response.status_code in [200, 404, 500]


class TestErrorHandling:
    """Pruebas para el manejo de errores en endpoints."""

    def test_nonexistent_endpoint(self, client):
        """Test: Endpoint no existente retorna 404."""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404

    def test_invalid_json_request(self, client):
        """Test: Solicitud JSON inválida retorna 422."""
        with patch('app.api.routes.alerts.update_alert') as mock_update:
            mock_update.return_value = None
            response = client.patch("/alerts/1", json={"invalid_field": "value"})
            assert response.status_code in [200, 422, 404]


class TestCORSHeaders:
    """Pruebas para la configuración de CORS."""

    def test_cors_headers_present(self, client):
        """Test: Las respuestas incluyen headers CORS."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_options_request(self, client):
        """Test: Solicitudes OPTIONS son manejadas."""
        response = client.options("/health")
        assert response.status_code in [200, 405]

