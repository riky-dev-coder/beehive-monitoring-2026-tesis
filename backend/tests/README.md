"""
Guía de Pruebas Unitarias - Backend Beehive Monitoring
=======================================================

Este archivo documenta cómo ejecutar y mantener las pruebas unitarias del backend.

## Instalación de dependencias

Primero, instala las dependencias de prueba:

    pip install -r requirements.txt

Las dependencias de prueba ya están incluidas en requirements.txt:
- pytest==7.4.3
- pytest-asyncio==0.21.1

## Ejecutar todas las pruebas

    pytest

O para ver más detalles:

    pytest -v

## Ejecutar pruebas específicas

### Ejecutar solo pruebas de modelos:
    pytest tests/test_models.py -v

### Ejecutar solo pruebas de servicios:
    pytest tests/test_alert_engine.py -v

### Ejecutar solo pruebas de API:
    pytest tests/test_api_routes.py -v

### Ejecutar solo pruebas de utilidades:
    pytest tests/test_utilities.py -v

## Ejecutar pruebas por nombre

    pytest tests/ -k "test_temperature" -v

## Ver cobertura de código

Primero instala coverage:

    pip install coverage

Luego ejecuta:

    coverage run -m pytest
    coverage report
    coverage html  # Genera reporte HTML

## Estructura de pruebas

```
tests/
├── __init__.py              # Inicializador del paquete
├── conftest.py              # Configuración compartida y fixtures
├── test_models.py           # Pruebas de modelos Pydantic
├── test_alert_engine.py     # Pruebas de servicios de alerta
├── test_api_routes.py       # Pruebas de endpoints HTTP
├── test_utilities.py        # Pruebas de utilidades y configuración
└── README.md                # Este archivo
```

## Reporte de Fixtures disponibles

Las siguientes fixtures están disponibles en conftest.py:

- `mock_sensor_reading`: Lectura de sensor válida de temperatura de cría
- `mock_alert`: Alerta válida completamente inicializada
- `mock_alert_create`: Datos para crear una alerta
- `mock_alert_update`: Datos para actualizar una alerta
- `sensor_readings_list`: Lista de lecturas de múltiples sensores

Úsalas en tus pruebas:

    def test_example(mock_sensor_reading):
        assert mock_sensor_reading.value == 35.5

## Convenciones

1. **Nombres de prueba**: Deben empezar con `test_`
2. **Clases de prueba**: Deben empezar con `Test`
3. **Docstrings**: Todas las pruebas deben tener un docstring explicativo
4. **Arrange-Act-Assert**: Las pruebas deben seguir este patrón
5. **Mocks**: Usar unittest.mock para servicios externos

Ejemplo de estructura de prueba:

    def test_temperature_validation(self):
        \"\"\"Test: Se valida correctamente la temperatura.\"\"\"
        # Arrange
        reading = SensorData(...)
        
        # Act
        result = validate_temperature(reading)
        
        # Assert
        assert result is True

## Pruebas asincrónicas

Las funciones asincrónicas se prueban con el decorador:

    @pytest.mark.asyncio
    async def test_async_function(self):
        result = await some_async_function()
        assert result is not None

## Tips para mantener las pruebas

1. Mantén las pruebas simples y enfocadas
2. Una aserción por prueba cuando sea posible
3. Usa fixtures para evitar duplicación
4. Actualiza las pruebas cuando cambies el código
5. Ejecuta las pruebas frecuentemente durante el desarrollo

## Próximas mejoras

- [ ] Agregar pruebas de integración con base de datos
- [ ] Agregar pruebas de carga
- [ ] Aumentar cobertura de código
- [ ] Agregar pruebas E2E con Selenium/Playwright
"""
