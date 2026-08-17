"""
Request correlation.

Every request is assigned an id that is attached to its log lines, returned in
the response, and forwarded to the internal services it calls. That makes a
single user action traceable across the client, the API, the dataset service and
the agent, instead of leaving four unrelated log streams to be matched by
timestamp.
"""
import logging
import time
import uuid
from typing import Optional

from flask import g, has_request_context, request

REQUEST_ID_HEADER = 'X-Request-ID'


def get_request_id() -> Optional[str]:
    """
    The current request's id, if there is one.

    Guarded by `has_request_context`: plenty of logging happens outside a
    request — at start-up, in CLI commands, in tests — and touching `g` there
    raises rather than returning nothing.
    """
    if not has_request_context():
        return None
    return getattr(g, 'request_id', None)


class RequestIdFilter(logging.Filter):
    """Adds `request_id` to every record so the formatter can include it."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or '-'
        return True


def init_request_context(app) -> None:
    """Assign, log and propagate a request id around each request."""
    logger = logging.getLogger('app.request')

    @app.before_request
    def _assign_request_id():
        # Honour an id supplied by an upstream proxy so a trace spans hops, but
        # bound its length: it ends up in log lines and response headers.
        inbound = request.headers.get(REQUEST_ID_HEADER, '')
        g.request_id = inbound[:64] if inbound else uuid.uuid4().hex[:16]
        g.request_started = time.monotonic()

    @app.after_request
    def _log_and_tag(response):
        response.headers[REQUEST_ID_HEADER] = get_request_id() or '-'

        started = getattr(g, 'request_started', None)
        duration_ms = round((time.monotonic() - started) * 1000, 1) if started else None

        # Health checks fire constantly and would drown out real traffic.
        if request.path not in ('/health', '/ready'):
            logger.info(
                '%s %s -> %s (%sms)',
                request.method,
                request.path,
                response.status_code,
                duration_ms,
            )

        return response
