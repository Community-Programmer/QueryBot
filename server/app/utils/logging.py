"""
Application logging setup.

Replaces the ad-hoc ``print`` calls that previously wrote request payloads and
token details straight to stdout. In production the output is one JSON object
per line so a log aggregator can index it; locally it stays human-readable.
"""
import json
import logging
import sys
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    """Render records as single-line JSON."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'request_id': getattr(record, 'request_id', '-'),
        }

        if record.exc_info:
            payload['exception'] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


class ConsoleFormatter(logging.Formatter):
    """Compact single-line output for local development."""

    def format(self, record: logging.LogRecord) -> str:
        request_id = getattr(record, 'request_id', '-')
        prefix = f'[{request_id}] ' if request_id and request_id != '-' else ''
        record.msg = f'{prefix}{record.getMessage()}'
        record.args = ()
        return super().format(record)


def configure_logging(app) -> None:
    """Attach a single stream handler at the configured level."""
    from app.utils.request_context import RequestIdFilter

    level = getattr(logging, str(app.config.get('LOG_LEVEL', 'INFO')).upper(), logging.INFO)
    use_json = not app.debug and app.config.get('LOG_FORMAT', 'json') == 'json'

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(RequestIdFilter())
    handler.setFormatter(
        JsonFormatter()
        if use_json
        else ConsoleFormatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s')
    )

    root = logging.getLogger()
    # Reload under the Flask reloader would otherwise stack duplicate handlers.
    for existing in list(root.handlers):
        root.removeHandler(existing)

    root.addHandler(handler)
    root.setLevel(level)
    app.logger.setLevel(level)

    # These libraries log every request at INFO, which drowns out our own output.
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a module-scoped logger."""
    return logging.getLogger(name)
