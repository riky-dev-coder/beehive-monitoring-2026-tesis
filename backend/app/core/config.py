from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # Supabase
    supabase_url: str = Field(..., env='SUPABASE_URL')
    supabase_service_key: str = Field(..., env='SUPABASE_SERVICE_KEY')
    
    # ThingSpeak
    thingspeak_channel_id: int = Field(..., env='THINGSPEAK_CHANNEL_ID')
    thingspeak_read_api_key: str = Field(..., env='THINGSPEAK_READ_API_KEY')
    
    # OpenRouter
    openrouter_api_key: str = Field(..., env='OPENROUTER_API_KEY')
    openrouter_base_url: str = Field('https://openrouter.ai/api/v1', env='OPENROUTER_BASE_URL')

    # Resend
    resend_api_key: str = Field(..., env='RESEND_API_KEY')
    resend_from_email: str = Field('onboarding@resend.dev', env='RESEND_FROM_EMAIL')
    resend_to_email: str = Field('mizdezu@gmail.com', env='RESEND_TO_EMAIL')
    
    # Umbrales de alerta
    temp_cria_min: float = 34.0
    temp_cria_max: float = 36.0
    humedad_cria_min: float = 55.0
    humedad_cria_max: float = 75.0
    
    temp_mielera_min: float = 34.0
    temp_mielera_max: float = 36.0
    humedad_mielera_min: float = 55.0
    humedad_mielera_max: float = 75.0
    
    # Pesos
    peso_cria_min: float = 18.0   # kg
    peso_cria_max: float = 29.0  # kg
    peso_mielera_min_cosecha: float = 20.0  # kg, umbral para cosechar
    peso_mielera_disminucion_alerta: float = 1.0  # kg, disminución para alertar

    class Config:
        env_file = '.env'
        case_sensitive = False

settings = Settings()