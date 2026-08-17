"""
Authentication routes for user signup, login, and token management.
"""
from flask import Blueprint, make_response, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)

from app.schemas.user_schema import user_response_schema
from app.services.auth_service import AuthService
from app.utils.logging import get_logger
from app.utils.responses import error_response, success_response

logger = get_logger(__name__)

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
        JSON response with user data and sets JWT cookies
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return error_response('Request must contain JSON data', 400)
        
        # Use AuthService to register user
        response_tuple = AuthService.register_user(data)
        
        # Unpack the tuple (jsonify response, status_code)
        flask_response, status_code = response_tuple
        
        if status_code == 201:  # Success
            # Get the JSON data from the Flask response to extract user info
            response_data = flask_response.get_json()
            user_data = response_data['data']['user']
            
            # Create JWT tokens
            access_token = create_access_token(identity=str(user_data['id']))
            refresh_token = create_refresh_token(identity=str(user_data['id']))
            
            # Create new response with cookies
            response = make_response(flask_response.get_data(), 201)
            response.content_type = 'application/json'
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)
            
            return response
        else:
            # Return error response as is
            return response_tuple
        
    except Exception as e:
        logger.exception("Signup failed: %s", e)
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
        JSON response with user data and sets JWT cookies
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return error_response('Request must contain JSON data', 400)
        
        # Use AuthService to authenticate user
        response_tuple = AuthService.login_user(data)
        
        # Unpack the tuple (jsonify response, status_code)
        flask_response, status_code = response_tuple
        
        if status_code == 200:  # Success
            # Get the JSON data from the Flask response to extract user info
            response_data = flask_response.get_json()
            user_data = response_data['data']['user']
            
            # Create JWT tokens
            access_token = create_access_token(identity=str(user_data['id']))
            refresh_token = create_refresh_token(identity=str(user_data['id']))
            
            # Create new response with cookies
            response = make_response(flask_response.get_data(), 200)
            response.content_type = 'application/json'
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)
            
            return response
        else:
            # Return error response as is
            return response_tuple
        
    except Exception as e:
        logger.exception("Login failed: %s", e)
        return error_response(
            'Login failed. Please try again.',
            500
        )


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token from cookies.
    
    Returns:
        JSON response with new access token set in cookies
    """
    try:
        # Get current user identity from refresh token
        current_user_id = get_jwt_identity()
        logger.debug("Refresh requested for user %s", current_user_id)
        
        # Validate user still exists and is active
        user = AuthService.get_user_by_id(current_user_id)
        if not user or not user.is_active:
            logger.warning("Refresh rejected for missing or inactive user %s", current_user_id)
            return error_response('Invalid refresh token', 401)
        
        # Create new access token
        new_access_token = create_access_token(identity=str(user.id))
        
        # Create response data (success_response returns (flask_response, status_code))
        flask_response, status_code = success_response(
            'Token refreshed successfully',
            {'message': 'Access token refreshed'}
        )
        
        # Create Flask response and set new access cookie
        response = make_response(flask_response.get_data(), status_code)
        response.content_type = 'application/json'
        set_access_cookies(response, new_access_token)
        
        return response
        
    except Exception as e:
        logger.exception("Token refresh failed: %s", e)
        return error_response(
            'Token refresh failed. Please try again.',
            401
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
        
        user_data = user_response_schema.dump(user)
        return success_response(
            'Profile retrieved successfully',
            {'user': user_data}
        )
        
    except Exception as e:
        logger.exception("Profile retrieval failed: %s", e)
        return error_response(
            'Failed to retrieve profile. Please try again.',
            500
        )


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user by clearing JWT cookies.
    
    Returns:
        JSON response confirming logout
    """
    try:
        # Create response data (success_response returns tuple)
        flask_response, status_code = success_response('Logged out successfully')
        
        # Create Flask response and clear cookies
        response = make_response(flask_response.get_data(), status_code)
        response.content_type = 'application/json'
        unset_jwt_cookies(response)
        
        return response
        
    except Exception as e:
        logger.exception("Logout failed: %s", e)
        return error_response(
            'Logout failed. Please try again.',
            500
        )


@auth_bp.route('/check', methods=['GET'])
@jwt_required()
def check_auth():
    """
    Check if user is authenticated and return user data.
    
    Returns:
        JSON response with user data if authenticated
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
        
        user_data = user_response_schema.dump(user)
        return success_response(
            'Authentication valid',
            {'user': user_data}
        )
        
    except Exception as e:
        logger.warning("Auth check failed: %s", e)
        return error_response(
            'Authentication check failed',
            401
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