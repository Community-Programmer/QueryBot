from flask import Flask

def create_app():
    app = Flask(__name__)
    
    # Basic routes
    @app.route('/')
    def hello():
        return {'message': 'Hello from QueryBot Server!', 'status': 'running'}
    
    @app.route('/health')
    def health():
        return {'status': 'healthy'}
    
    return app