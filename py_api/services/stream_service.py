import json
from typing import AsyncGenerator, Any


class StreamService:
    """Service for Server-Sent Events (SSE) streaming."""

    @staticmethod
    def format_sse(event: str, data: Any) -> str:
        """Format data as an SSE message.

        Args:
            event: Event type name
            data: Data to send (will be JSON encoded if not a string)

        Returns:
            Formatted SSE string
        """
        if not isinstance(data, str):
            data = json.dumps(data)

        return f"event: {event}\ndata: {data}\n\n"

    @staticmethod
    async def stream_items(
        items: list[Any],
        event_name: str = "item"
    ) -> AsyncGenerator[str, None]:
        """Stream a list of items as SSE events.

        Args:
            items: List of items to stream
            event_name: Name of the SSE event type

        Yields:
            SSE formatted strings
        """
        for item in items:
            if hasattr(item, "model_dump"):
                data = item.model_dump()
            elif hasattr(item, "__dict__"):
                data = item.__dict__
            else:
                data = item

            yield StreamService.format_sse(event_name, data)

    @staticmethod
    def progress_event(current: int, total: int, message: str = "") -> str:
        """Create a progress SSE event.

        Args:
            current: Current progress value
            total: Total expected value
            message: Optional progress message

        Returns:
            SSE formatted progress event
        """
        percentage = round((current / total) * 100) if total > 0 else 0

        return StreamService.format_sse("progress", {
            "current": current,
            "total": total,
            "percentage": percentage,
            "message": message,
        })

    @staticmethod
    def error_event(error: str, code: str = "ERROR") -> str:
        """Create an error SSE event.

        Args:
            error: Error message
            code: Error code

        Returns:
            SSE formatted error event
        """
        return StreamService.format_sse("error", {
            "code": code,
            "message": error,
        })

    @staticmethod
    def complete_event(data: Any = None) -> str:
        """Create a completion SSE event.

        Args:
            data: Optional final data to include

        Returns:
            SSE formatted complete event
        """
        return StreamService.format_sse("complete", data or {"status": "done"})
