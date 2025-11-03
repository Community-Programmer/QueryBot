"""
Authentication routes for user signup, login, and token management.
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.services.auth_service import AuthService
from app.utils.responses import error_response


# Create authentication blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    User registration endpoint.
    
    Expected JSON payload:
    {
        "fullname": "John Doe",
        "email": "john@example.com",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!"
    }
    
    Returns:
        JSON response with user data and JWT token
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return error_response('Request must contain JSON data', 400)
        
        # Use AuthService to register user
        response, status_code = AuthService.register_user(data)
        
        return response, status_code
        
    except Exception as e:
        print(e)
        return error_response(
            'Registration failed. Please try again.',
            500
        )


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint.
    
    Expected JSON payload:
    {
        "email": "john@example.com",
        "password": "SecurePass123!"
    }
    
    Returns:
        JSON response with user data and JWT token
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return error_response('Request must contain JSON data', 400)
        
        # Use AuthService to authenticate user
        response, status_code = AuthService.login_user(data)
        
        return response, status_code
        
    except Exception as e:
        return error_response(
            'Login failed. Please try again.',
            500
        )


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token.
    
    Requires:
        Authorization header with refresh token
    
    Returns:
        JSON response with new access token
    """
    try:
        # Get current user identity from refresh token
        current_user_id = get_jwt_identity()
        
        # Use AuthService to refresh token
        response, status_code = AuthService.refresh_token(current_user_id)
        
        return response, status_code
        
    except Exception as e:
        return error_response(
            'Token refresh failed. Please try again.',
            500
        )


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get current user profile.
    
    Requires:
        Authorization header with access token
    
    Returns:
        JSON response with user profile data
    """
    try:
        # Get current user identity from access token
        current_user_id = get_jwt_identity()
        
        # Get user from database
        user = AuthService.get_user_by_id(current_user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        if not user.is_active:
            return error_response('Account is deactivated', 403)
        
        # Return user profile
        from app.schemas.user_schema import user_response_schema
        user_data = user_response_schema.dump(user)
        
        from app.utils.responses import success_response
        return success_response(
            'Profile retrieved successfully',
            {'user': user_data}
        )
        
    except Exception as e:
        return error_response(
            'Failed to retrieve profile. Please try again.',
            500
        )


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user (optional endpoint for token revocation).
    
    Note: Since JWTs are stateless, true logout requires token blacklisting
    or client-side token removal. This endpoint serves as a placeholder
    for implementing token revocation in the future.
    
    Requires:
        Authorization header with access token
    
    Returns:
        JSON response confirming logout
    """
    try:
        # Get the JTI (unique identifier of the JWT)
        jti = get_jwt()['jti']
        
        # TODO: Implement token blacklisting here if needed
        # For now, just return a success message
        
        from app.utils.responses import success_response
        return success_response('Logged out successfully')
        
    except Exception as e:
        return error_response(
            'Logout failed. Please try again.',
            500
        )


# Error handlers for the auth blueprint
@auth_bp.errorhandler(400)
def bad_request(error):
    """Handle bad request errors."""
    return error_response('Bad request', 400)


@auth_bp.errorhandler(401)
def unauthorized(error):
    """Handle unauthorized errors."""
    return error_response('Unauthorized access', 401)


@auth_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden errors."""
    return error_response('Forbidden access', 403)


@auth_bp.errorhandler(404)
def not_found(error):
    """Handle not found errors."""
    return error_response('Resource not found', 404)


@auth_bp.errorhandler(422)
def validation_error(error):
    """Handle validation errors."""
    return error_response('Validation failed', 422)


@auth_bp.errorhandler(500)
def internal_error(error):
    """Handle internal server errors."""
    return error_response('Internal server error', 500)