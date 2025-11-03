"""
User model with UUID primary key and authentication functionality.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class User(db.Model):
    """User model for authentication."""
    
    __tablename__ = 'users'
    
    # Primary key using UUID
    id = db.Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4, 
        unique=True, 
        nullable=False
    )
    
    # User information
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Timestamps
    created_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Account status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    def __init__(self, fullname: str, email: str, password_hash: str):
        """Initialize a new user."""
        self.fullname = fullname
        self.email = email.lower().strip()  # Normalize email
        self.password_hash = password_hash
    
    def __repr__(self):
        """String representation of User."""
        return f'<User {self.email}>'
    
    def to_dict(self) -> dict:
        """Convert user to dictionary (excluding sensitive data)."""
        return {
            'id': str(self.id),
            'fullname': self.fullname,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active
        }
    
    @classmethod
    def find_by_email(cls, email: str) -> Optional['User']:
        """Find user by email address."""
        return cls.query.filter_by(email=email.lower().strip()).first()
    
    @classmethod
    def find_by_id(cls, user_id: str) -> Optional['User']:
        """Find user by ID."""
        try:
            return cls.query.filter_by(id=user_id).first()
        except ValueError:
            # Invalid UUID format
            return None
    
    def update_last_login(self):
        """Update the user's last login timestamp."""
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def save(self):
        """Save user to database."""
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        """Delete user from database."""
        db.session.delete(self)
        db.session.commit()