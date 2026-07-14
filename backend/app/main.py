from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import pytz

from app.api.routes import sensor_router, alerts_router, recommendations_router
from app.core.config import settings
from app.services.data_fetcher import fetch_and_store_latest_data

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar scheduler
scheduler = AsyncIOScheduler(timezone=pytz.UTC)

async def fetch_data_task():
    """Tarea programada para obtener datos de ThingSpeak y evaluar alertas."""
    logger.info("Ejecutando tarea programada: fetch_and_store_latest_data")
    try:
        readings = await fetch_and_store_latest_data()
        logger.info(f"Tarea completada. {len(readings)} lecturas obtenidas.")
    except Exception as e:
        logger.exception("Error en tarea programada")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código de inicio
    logger.info("Iniciando aplicación...")
    # Ejecutar una primera vez al arrancar
    await fetch_data_task()
    # Programar tarea periódica
    scheduler.add_job(
        fetch_data_task,
        trigger=IntervalTrigger(seconds=40),
        id="fetch_thingspeak",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler iniciado. Tarea programada cada 40 segundos.")
    yield
    # Código de cierre
    logger.info("Deteniendo aplicación...")
    scheduler.shutdown()
    logger.info("Scheduler detenido.")

# Crear aplicación FastAPI
app = FastAPI(
    title="Beehive Monitoring API",
    description="API para monitoreo de colmenas con sensores de peso, temperatura y humedad",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS - Restringido a dominios de producción y desarrollo
allowed_origins = [
    "https://beekiping-monitoring2026.web.app",
    "https://boris-sulfurous-stephine.ngrok-free.dev",
    "http://localhost:8000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(sensor_router)
app.include_router(alerts_router)
app.include_router(recommendations_router)

@app.get("/")
async def root():
    return {"message": "Beehive Monitoring API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}