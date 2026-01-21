from typing import TypedDict

import httpx


class FileInfo(TypedDict):
    """Type definition for file metadata."""
    file_type: str
    size: int


class FileService:
    """Service for fetching blueprint files."""

    @staticmethod
    async def fetch_file(url: str) -> bytes:
        """Fetch file from URL."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=60.0)
            response.raise_for_status()
            return response.content

    @staticmethod
    def get_file_info(data: bytes) -> FileInfo:
        """Get basic file info."""
        file_type = "unknown"
        if data[:4] == b'%PDF':
            file_type = "pdf"
        elif data[:8] == b'\x89PNG\r\n\x1a\n':
            file_type = "png"
        elif data[:2] == b'\xff\xd8':
            file_type = "jpeg"

        return {
            "file_type": file_type,
            "size": len(data),
        }

    @staticmethod
    def get_mime_type(data: bytes) -> str:
        """Get MIME type from file bytes."""
        if data[:4] == b'%PDF':
            return "application/pdf"
        elif data[:8] == b'\x89PNG\r\n\x1a\n':
            return "image/png"
        elif data[:2] == b'\xff\xd8':
            return "image/jpeg"
        return "application/octet-stream"
