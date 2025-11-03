"""
Authentication service layer for user registration and login.
"""
from typing import Dict, Optional, Tuple, Any
from flask_jwt_extended import create_access_token, create_refresh_token
from marshmallow import ValidationError

from app.models.user_model import User
from app.schemas.user_schema import (
    user_signup_schema, 
    user_login_schema, 
    user_response_schema,
    auth_response_schema
)
from app.extensions import hash_password, check_password, db
from app.utils.responses import (
    success_response,
    error_response,
    validation_error_response,
    conflict_response,
    unauthorized_response
)


class AuthService:
    """Service class for authentication operations."""
    
    @staticmethod
    def register_user(data: Dict[str, Any]) -> Tuple[Dict, int]:
        """
        Register a new user.
        
        Args:
            data: User registration data
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        try:
            # Validate input data
            validated_data = user_signup_schema.load(data)
        except ValidationError as err:
            return validation_error_response(err.messages)
        
        # Check if user already exists
        existing_user = User.find_by_email(validated_data['email'])
        if existing_user:
            return conflict_response('Email already registered')
        
        try:
            # Hash password
            password_hash = hash_password(validated_data['password'])
            
            # Create new user
            new_user = User(
                fullname=validated_data['fullname'],
                email=validated_data['email'],
                password_hash=password_hash
            )
            
            # Save to database
            new_user.save()
            
            # Generate JWT tokens
            access_token = create_access_token(identity=str(new_user.id))
            refresh_token = create_refresh_token(identity=str(new_user.id))
            
            # Prepare response data
            user_data = user_response_schema.dump(new_user)
            auth_data = {
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer'
            }
            
            return success_response(
                message='User registered successfully',
                data=auth_data,
                status_code=201
            )
            
        except Exception as e:
            db.session.rollback()
            return error_response(
                message='Registration failed. Please try again.',
                status_code=500
            )
    
    @staticmethod
    def login_user(data: Dict[str, Any]) -> Tuple[Dict, int]:
        """
        Authenticate user login.
        
        Args:
            data: User login data
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        try:
            # Validate input data
            validated_data = user_login_schema.load(data)
        except ValidationError as err:
            return validation_error_response(err.messages)
        
        # Find user by email
        user = User.find_by_email(validated_data['email'])
        if not user:
            return unauthorized_response('Invalid email or password')
        
        # Check if user is active
        if not user.is_active:
            return unauthorized_response('Account is deactivated')
        
        # Verify password
        if not check_password(validated_data['password'], user.password_hash):
            return unauthorized_response('Invalid email or password')
        
        try:
            # Update last login
            user.update_last_login()
            
            # Generate JWT tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            # Prepare response data
            user_data = user_response_schema.dump(user)
            auth_data = {
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer'
            }
            
            return success_response(
                message='Login successful',
                data=auth_data
            )
            
        except Exception as e:
            return error_response(
                message='Login failed. Please try again.',
                status_code=500
            )
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User object or None
        """
        return User.find_by_id(user_id)
    
    @staticmethod
    def refresh_token(user_id: str) -> Tuple[Dict, int]:
        """
        Generate new access token using refresh token.
        
        Args:
            user_id: User ID from refresh token
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        user = User.find_by_id(user_id)
        if not user or not user.is_active:
            return unauthorized_response('Invalid refresh token')
        
        try:
            # Generate new access token
            access_token = create_access_token(identity=str(user.id))
            
            return success_response(
                message='Token refreshed successfully',
                data={
                    'access_token': access_token,
                    'token_type': 'Bearer'
                }
            )
            
        except Exception as e:
            return error_response(
                message='Token refresh failed. Please try again.',
                status_code=500
            )