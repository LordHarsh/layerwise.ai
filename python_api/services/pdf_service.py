from __future__ import annotations

import io
from typing import TYPE_CHECKING, TypedDict

import httpx

if TYPE_CHECKING:
    from pydantic_ai.messages import BinaryContent


class FileInfo(TypedDict):
    """Type definition for file metadata."""
    file_type: str
    size: int
    page_count: int


class FileService:
    """Service for fetching and processing blueprint files."""

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
        page_count = 1
        if data[:4] == b'%PDF':
            file_type = "pdf"
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(data)
            page_count = len(pdf)
            pdf.close()
        elif data[:8] == b'\x89PNG\r\n\x1a\n':
            file_type = "png"
        elif data[:2] == b'\xff\xd8':
            file_type = "jpeg"

        return {
            "file_type": file_type,
            "size": len(data),
            "page_count": page_count,
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

    @staticmethod
    def is_pdf(data: bytes) -> bool:
        return data[:4] == b'%PDF'

    @staticmethod
    def pdf_to_images(data: bytes, scale: float = 2.0) -> list[bytes]:
        """Convert PDF pages to PNG images.

        Args:
            data: Raw PDF bytes
            scale: Render scale (2.0 = 144 DPI, good for blueprint detail)

        Returns:
            List of PNG image bytes, one per page
        """
        import pypdfium2 as pdfium

        pdf = pdfium.PdfDocument(data)
        images = []
        for page in pdf:
            bitmap = page.render(scale=scale)
            pil_image = bitmap.to_pil()
            buf = io.BytesIO()
            pil_image.save(buf, format="PNG")
            images.append(buf.getvalue())
            bitmap.close()
        pdf.close()
        return images

    @staticmethod
    def to_content_parts(data: bytes) -> list[BinaryContent]:
        """Convert file bytes to content parts for the AI agent.

        PDFs are converted to images since Gemini's OpenAI-compat endpoint
        doesn't support the 'file' content type. Images pass through as-is.
        """
        from pydantic_ai.messages import BinaryContent

        if FileService.is_pdf(data):
            page_images = FileService.pdf_to_images(data)
            return [
                BinaryContent(data=img, media_type="image/png")
                for img in page_images
            ]
        else:
            mime_type = FileService.get_mime_type(data)
            return [BinaryContent(data=data, media_type=mime_type)]
