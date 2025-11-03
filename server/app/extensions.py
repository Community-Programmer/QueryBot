"""
Extensions initialization module.
Centralizes the initialization of all Flask extensions.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
import bcrypt

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def init_extensions(app):
    """Initialize all extensions with the Flask app."""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {
            'status': 'error',
            'message': 'Token has expired'
        }, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {
            'status': 'error',
            'message': 'Invalid token'
        }, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {
            'status': 'error',
            'message': 'Authorization token is required'
        }, 401


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(password: str, hashed: str) -> bool:
    """Check if password matches the hashed password."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))