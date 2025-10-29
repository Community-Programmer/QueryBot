# QueryBot Server

A simple Flask server for QueryBot.

## Setup

1. Virtual environment (.venv) is already created
2. Install dependencies:
   ```bash
   uv sync
   ```

## Running the Server

```bash
python main.py
```

The server will start on `http://localhost:5000`.

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check

## Project Structure

```
server/
├── app/
│   └── __init__.py    # Flask app factory
├── main.py            # Server entry point
├── pyproject.toml     # Dependencies
└── README.md
```
