import json
from typing import Any


class StreamService:
    """Service for Server-Sent Events (SSE) streaming.

    Returns dicts with 'event' and 'data' keys for use with
    sse_starlette.EventSourceResponse (which handles SSE framing).
    """

    @staticmethod
    def format_sse(event: str, data: Any) -> dict:
        """Format data as an SSE event dict for EventSourceResponse.

        Args:
            event: Event type name
            data: Data to send (will be JSON encoded if not a string)

        Returns:
            Dict with 'event' and 'data' keys
        """
        if not isinstance(data, str):
            data = json.dumps(data)

        return {"event": event, "data": data}

    @staticmethod
    def progress_event(current: int, total: int, message: str = "") -> dict:
        """Create a progress SSE event."""
        percentage = round((current / total) * 100) if total > 0 else 0

        return StreamService.format_sse("progress", {
            "current": current,
            "total": total,
            "percentage": percentage,
            "message": message,
        })

    @staticmethod
    def error_event(error: str, code: str = "ERROR") -> dict:
        """Create an error SSE event."""
        return StreamService.format_sse("error", {
            "code": code,
            "message": error,
        })

    @staticmethod
    def complete_event(data: Any = None) -> dict:
        """Create a completion SSE event."""
        return StreamService.format_sse("complete", data or {"status": "done"})
