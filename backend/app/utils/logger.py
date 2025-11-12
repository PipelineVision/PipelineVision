import os
import logging
from logging.handlers import RotatingFileHandler
import json

LOG_DIR = os.getenv("LOG_DIR", "logs")
LOG_FILE = os.path.join(LOG_DIR, os.getenv("LOG_FILE", "app.log"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = "[%(asctime)s] %(levelname)s in %(name)s: %(message)s"
JSON_LOG_FORMAT = {
    "time": "%(asctime)s",
    "level": "%(levelname)s",
    "module": "%(name)s",
    "message": "%(message)s",
}


class JSONFormatter(logging.Formatter):
    """Custom formatter to output logs in JSON format."""

    def format(self, record):
        log_record = {
            "time": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "module": record.name,
            "message": record.getMessage(),
        }
        return json.dumps(log_record)


def setup_logger():
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)

    file_handler = RotatingFileHandler(
        LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5
    )
    console_handler = logging.StreamHandler()

    file_handler.setLevel(LOG_LEVEL)
    console_handler.setLevel(LOG_LEVEL)

    text_formatter = logging.Formatter(LOG_FORMAT)
    json_formatter = JSONFormatter()

    file_handler.setFormatter(
        json_formatter if LOG_LEVEL == "DEBUG" else text_formatter
    )
    console_handler.setFormatter(text_formatter)

    logging.basicConfig(
        level=LOG_LEVEL,
        handlers=[file_handler, console_handler],
    )
