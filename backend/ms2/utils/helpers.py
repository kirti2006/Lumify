"""Helper utility functions."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


def generate_uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


def get_timestamp() -> datetime:
    """Get current UTC timestamp."""
    return datetime.utcnow()


def serialize_model(model: BaseModel) -> dict:
    """Serialize a Pydantic model to dictionary."""
    return model.model_dump()


def serialize_model_json(model: BaseModel) -> str:
    """Serialize a Pydantic model to JSON string."""
    return model.model_dump_json()


def parse_json_safe(json_str: str) -> Any:
    """Safely parse JSON string, returning empty dict on failure."""
    import json
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return {}


def truncate_string(text: str, max_length: int = 1000, suffix: str = "...") -> str:
    """Truncate a string to maximum length."""
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix


def clean_dict(data: dict) -> dict:
    """Remove None and empty values from dictionary."""
    return {k: v for k, v in data.items() if v is not None and v != "" and v != [] and v != {}}


def flatten_dict(data: dict, parent_key: str = "", sep: str = ".") -> dict:
    """Flatten nested dictionary."""
    items = []
    for k, v in data.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)
