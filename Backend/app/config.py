"""
Application Configuration
"""
import os

class Config:
    ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
    SECRET_KEY = os.getenv("SECRET_KEY", "votevision-ai-secure-token-2026-key")
    JSON_SORT_KEYS = False
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB max request payload

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = "development"

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    ENV = "testing"

class ProductionConfig(Config):
    DEBUG = False
    ENV = "production"

config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig
}
