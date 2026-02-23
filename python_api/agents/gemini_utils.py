"""Shared Gemini API utilities for all agents."""

import os
from typing import Any

from google import genai
from google.genai import types

_client: genai.Client | None = None


def get_client() -> genai.Client:
    """Lazy singleton Gemini client."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    return _client


def clean_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Strip additionalProperties from a JSON schema (unsupported by Gemini)."""
    schema.pop("additionalProperties", None)
    schema.pop("$defs", None)
    for value in schema.values():
        if isinstance(value, dict):
            clean_schema(value)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    clean_schema(item)
    return schema


def inline_refs(obj: Any, defs: dict[str, Any]) -> Any:
    """Recursively replace $ref with the actual definition."""
    if isinstance(obj, dict):
        if "$ref" in obj:
            ref_name = obj["$ref"].split("/")[-1]
            if ref_name in defs:
                resolved = clean_schema(defs[ref_name].copy())
                return inline_refs(resolved, defs)
        return {k: inline_refs(v, defs) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [inline_refs(item, defs) for item in obj]
    return obj


def get_schema(model: type) -> dict[str, Any]:
    """Get a Gemini-compatible JSON schema from a Pydantic model."""
    schema = model.model_json_schema()
    defs = schema.pop("$defs", {})
    return inline_refs(clean_schema(schema), defs)
