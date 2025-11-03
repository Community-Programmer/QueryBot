"""
Utility functions for standardized API responses.
"""
from typing import Any, Dict, Optional
from flask import jsonify


def success_response(
    message: str,
    data: Optional[Dict[str, Any]] = None,
    status_code: int = 200
) -> tuple:
    """
    Create a standardized success response.
    
    Args:
        message: Success message
        data: Optional data to include in response
        status_code: HTTP status code (default: 200)
    
    Returns:
        Tuple of (response, status_code)
    """
    response = {
        'status': 'success',
        'message': message
    }
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code


def error_response(
    message: str,
    status_code: int = 400,
    errors: Optional[Dict[str, Any]] = None
) -> tuple:
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        status_code: HTTP status code (default: 400)
        errors: Optional detailed errors dictionary
    
    Returns:
        Tuple of (response, status_code)
    """
    response = {
        'status': 'error',
        'message': message
    }
    
    if errors is not None:
        response['errors'] = errors
    
    return jsonify(response), status_code


def validation_error_response(errors: Dict[str, Any]) -> tuple:
    """
    Create a standardized validation error response.
    
    Args:
        errors: Dictionary of validation errors
    
    Returns:
        Tuple of (response, status_code)
    """
    return error_response(
        message='Validation failed',
        status_code=422,
        errors=errors
    )


def unauthorized_response(message: str = 'Unauthorized access') -> tuple:
    """
    Create a standardized unauthorized response.
    
    Args:
        message: Unauthorized message
    
    Returns:
        Tuple of (response, status_code)
    """
    return error_response(message, 401)


def forbidden_response(message: str = 'Forbidden access') -> tuple:
    """
    Create a standardized forbidden response.
    
    Args:
        message: Forbidden message
    
    Returns:
        Tuple of (response, status_code)
    """
    return error_response(message, 403)


def not_found_response(message: str = 'Resource not found') -> tuple:
    """
    Create a standardized not found response.
    
    Args:
        message: Not found message
    
    Returns:
        Tuple of (response, status_code)
    """
    return error_response(message, 404)


def conflict_response(message: str = 'Resource conflict') -> tuple:
    """
    Create a standardized conflict response.
    
    Args:
        message: Conflict message
    
    Returns:
        Tuple of (response, status_code)
    """
    return error_response(message, 409)


def internal_server_error_response(
    message: str = 'Internal server error'
) -> tuple:
    """
    Create a standardized internal server error response.
    
    Args:
        message: Error message
    
    Returns:
        Tuple of (response, status_code)
    """
    return error_response(message, 500)