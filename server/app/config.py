"""
Configuration classes for different environments.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class."""
    
    # Basic Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///querybot.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=1)  # 1-minute for testing refresh mechanism
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)     # 7-day refresh token
    JWT_ALGORITHM = 'HS256'
    
    # JWT Cookie settings for security
    JWT_TOKEN_LOCATION = ['cookies']
    JWT_COOKIE_SECURE = False  # Set to True in production with HTTPS
    JWT_COOKIE_HTTPONLY = True  # Prevent XSS attacks
    JWT_COOKIE_SAMESITE = 'Lax'
    JWT_ACCESS_COOKIE_NAME = 'access_token'
    JWT_REFRESH_COOKIE_NAME = 'refresh_token'
    JWT_ACCESS_COOKIE_PATH = '/'  # Access token available on all paths
    JWT_REFRESH_COOKIE_PATH = '/'  # Refresh token available on all paths for easier management
    JWT_COOKIE_CSRF_PROTECT = False  # Can enable for additional security
    
    # Security
    BCRYPT_LOG_ROUNDS = 12
    
    # API configuration
    PROPAGATE_EXCEPTIONS = True
    
    # CORS configuration
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    
    # LangGraph configuration
    LANGSMITH_API_KEY = os.environ.get('LANGSMITH_API_KEY')
    LANGGRAPH_API_URL = os.environ.get('LANGGRAPH_API_URL')


class DevelopmentConfig(Config):
    """Development configuration."""
    
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration."""
    
    DEBUG = False
    TESTING = False
    
    # Override with environment variables for production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # Secure cookie settings for production
    JWT_COOKIE_SECURE = True  # Require HTTPS in production
    
    # Production CORS origins (should be set via environment)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else []
    
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set in production")
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY environment variable must be set in production")


class TestingConfig(Config):
    """Testing configuration."""
    
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=1)  # Short for testing


# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}