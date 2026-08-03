from __future__ import annotations
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_prefix='BELL_', extra='ignore')
    app_name: str = 'Bell Core'
    version: str = '0.3.0'
    environment: str = 'development'
    database_url: str = 'sqlite:///./bell_core.db'
    jwt_secret: str = Field(default='change-me-in-production', min_length=16)
    jwt_algorithm: str = 'HS256'
    access_token_minutes: int = 60
    cors_origins: str = 'http://localhost:3000,http://localhost:5173'
    auto_create_schema: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(',') if x.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
