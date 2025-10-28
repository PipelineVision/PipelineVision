import structlog
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging
from pathlib import Path

logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)


def configure_logging(log_level: str = "INFO", json_logs: bool = True):

    file_handler = logging.FileHandler("logs/app.log")
    console_handler = logging.StreamHandler()

    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        handlers=[file_handler, console_handler],
        format="%(message)s",
    )

    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if json_logs:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


configure_logging()
logger = structlog.get_logger(__name__)


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests and responses with structured logging.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()

        request.state.request_id = request_id

        logger.info(
            "request_started",
            request_id=request_id,
            method=request.method,
            url=str(request.url),
            path=request.url.path,
            query_params=dict(request.query_params),
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            content_type=request.headers.get("content-type"),
            content_length=request.headers.get("content-length"),
            referer=request.headers.get("referer"),
        )

        try:
            response = await call_next(request)

            process_time = round(time.time() - start_time, 4)

            logger.info(
                "request_completed",
                request_id=request_id,
                status_code=response.status_code,
                process_time_seconds=process_time,
                response_content_type=response.headers.get("content-type"),
                response_content_length=response.headers.get("content-length"),
            )

            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as exc:
            process_time = round(time.time() - start_time, 4)

            logger.error(
                "request_failed",
                request_id=request_id,
                error_type=type(exc).__name__,
                error_message=str(exc),
                process_time_seconds=process_time,
                exc_info=True,
            )

            raise


def get_request_logger(request: Request) -> structlog.BoundLogger:
    request_id = getattr(request.state, "request_id", "unknown")
    return logger.bind(request_id=request_id)
