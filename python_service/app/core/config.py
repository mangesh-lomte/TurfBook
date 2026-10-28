import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    PROJECT_NAME: str = "TurfBook Python Diagnostics & Analytics Service"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENV: str = os.getenv("ENV", "development")
    CORE_API_URL: str = os.getenv("CORE_API_URL", "http://localhost:5000")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://turf_user:turf_secure_password_2026@localhost:5432/turfbook_dev")

settings = Settings()
