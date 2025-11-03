# QueryBot Authentication API

A production-grade Flask REST API for user authentication using JWT, SQLAlchemy, and UUIDs as primary keys, following best industry practices and clean modular architecture.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication with access and refresh tokens
- 🆔 **UUID Primary Keys** - Uses UUIDs for better security and scalability
- 🔒 **Password Security** - Bcrypt hashing with configurable rounds
- ✅ **Input Validation** - Comprehensive validation using Marshmallow schemas
- 🏗️ **Clean Architecture** - Modular structure with separation of concerns
- 🗄️ **PostgreSQL Support** - Production-ready database with migrations
- 📝 **Comprehensive Logging** - Structured logging for debugging and monitoring
- 🔄 **CORS Support** - Cross-origin resource sharing for frontend integration

## Tech Stack

- **Framework**: Flask 3.1+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Flask-JWT-Extended
- **Validation**: Marshmallow
- **Password Hashing**: Bcrypt
- **Migrations**: Flask-Migrate
- **Package Manager**: UV

## Project Structure

```
/project_root
├── app/
│   ├── __init__.py              # Application factory
│   ├── config.py                # Configuration classes (Dev, Prod, Test)
│   ├── extensions.py            # Extension initialization (db, jwt, migrate)
│   ├── models/
│   │   └── user_model.py        # User model with UUID primary key
│   ├── schemas/
│   │   └── user_schema.py       # Marshmallow validation schemas
│   ├── routes/
│   │   └── auth_routes.py       # Authentication endpoints
│   ├── services/
│   │   └── auth_service.py      # Business logic layer
│   └── utils/
│       └── responses.py         # Standardized API responses
├── migrations/                   # Database migration files
├── .env                         # Environment variables
├── main.py                      # Application entry point
├── pyproject.toml              # Project dependencies
└── README.md                   # This file
```

## Setup Instructions

### Prerequisites

- Python 3.12+
- PostgreSQL database
- UV package manager

### Installation

1. **Install dependencies using UV**:
   ```bash
   uv sync
   ```

2. **Set up environment variables**:
   
   The `.env` file should contain:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # Security Keys
   SECRET_KEY=your-super-secret-key-change-in-production
   JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
   
   # Environment
   FLASK_ENV=development
   ```

3. **Initialize and run database migrations** (if not already done):
   ```bash
   uv run flask --app main.py db init      # Only needed first time
   uv run flask --app main.py db migrate -m "Initial migration"
   uv run flask --app main.py db upgrade
   ```

4. **Start the development server**:
   ```bash
   uv run python main.py
   ```

The API will be available at `http://127.0.0.1:5000`

## API Endpoints

### Basic Endpoints
- `GET /` - API information
- `GET /health` - Health check

### Authentication Routes

All authentication endpoints are prefixed with `/api/auth`

#### 1. User Registration

**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullname": "John Doe",
      "email": "john@example.com",
      "created_at": "2025-11-03T10:30:00.000Z",
      "updated_at": "2025-11-03T10:30:00.000Z",
      "is_active": true
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer"
  }
}
```

#### 2. User Login

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### 3. Refresh Token

**POST** `/api/auth/refresh`

**Headers:**
```
Authorization: Bearer <refresh_token>
```

#### 4. Get User Profile

**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

#### 5. Logout

**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

## Example Usage with cURL

### Register a new user:
```bash
curl -X POST http://127.0.0.1:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirm_password": "SecurePass123!"
  }'
```

### Login:
```bash
curl -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Get profile (replace TOKEN with actual access token):
```bash
curl -X GET http://127.0.0.1:5000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

## Password Requirements

- Minimum 8 characters, maximum 128 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Must contain at least one special character (!@#$%^&*(),.?":{}|<>)

## Security Features

- **Password Hashing**: Bcrypt with 12 rounds
- **JWT Tokens**: 1 hour access token, 30 days refresh token
- **Input Validation**: Comprehensive validation with Marshmallow
- **Email Normalization**: Lowercase and trimmed emails
- **UUID Primary Keys**: Better security than incremental IDs
- **CORS Protection**: Configurable cross-origin policies

## Database Migrations

Common migration commands:

```bash
# Create a new migration
uv run flask --app main.py db migrate -m "Description of changes"

# Apply migrations
uv run flask --app main.py db upgrade

# Rollback to previous migration
uv run flask --app main.py db downgrade
```

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": {
    "field": ["Specific error messages"]
  }
}
```

## Development

The server runs in debug mode by default for development. Use the following command to start:

```bash
uv run python main.py
```
