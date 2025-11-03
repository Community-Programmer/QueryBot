"""
Flask application factory for QueryBot server.
"""
import os
from flask import Flask
from flask_cors import CORS

from app.config import config
from app.extensions import init_extensions


def create_app(config_name=None):
    """
    Application factory for creating Flask app instance.
    
    Args:
        config_name: Configuration environment name
        
    Returns:
        Flask application instance
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    # Create Flask application
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize CORS
    CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"])
    
    # Initialize extensions
    init_extensions(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Basic health check routes
    @app.route('/')
    def hello():
        """Root endpoint."""
        return {
            'message': 'QueryBot Authentication API',
            'status': 'running',
            'version': '1.0.0'
        }
    
    @app.route('/health')
    def health():
        """Health check endpoint."""
        return {'status': 'healthy'}
    
    return app


def register_blueprints(app):
    """Register application blueprints."""
    from app.routes.auth_routes import auth_bp
    
    app.register_blueprint(auth_bp)


def register_error_handlers(app):
    """Register global error handlers."""
    from app.utils.responses import error_response
    
    @app.errorhandler(400)
    def bad_request(error):
        return error_response('Bad request', 400)
    
    @app.errorhandler(401)
    def unauthorized(error):
        return error_response('Unauthorized access', 401)
    
    @app.errorhandler(403)
    def forbidden(error):
        return error_response('Forbidden access', 403)
    
    @app.errorhandler(404)
    def not_found(error):
        return error_response('Resource not found', 404)
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return error_response('Method not allowed', 405)
    
    @app.errorhandler(422)
    def validation_error(error):
        return error_response('Validation failed', 422)
    
    @app.errorhandler(500)
    def internal_error(error):
        return error_response('Internal server error', 500)