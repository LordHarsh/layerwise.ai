import io
from typing import TypedDict

import httpx
import pypdfium2 as pdfium
from PIL import Image

# Standard PDF resolution (points per inch)
DEFAULT_PDF_DPI = 72


class PDFInfo(TypedDict):
    """Type definition for PDF metadata."""
    page_count: int
    width: int
    height: int


class PDFService:
    """Service for processing PDF blueprints."""

    @staticmethod
    async def fetch_pdf(url: str) -> bytes:
        """Fetch PDF from URL."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=60.0)
            response.raise_for_status()
            return response.content

    @staticmethod
    def pdf_to_images(pdf_bytes: bytes, dpi: int = 150) -> list[bytes]:
        """Convert PDF pages to PNG images.

        Args:
            pdf_bytes: Raw PDF file bytes
            dpi: Resolution for rendering (higher = better quality but larger)

        Returns:
            List of PNG image bytes, one per page
        """
        images = []

        # Open PDF from bytes
        pdf = pdfium.PdfDocument(pdf_bytes)

        try:
            # Calculate scale factor for desired DPI
            scale = dpi / DEFAULT_PDF_DPI

            for page_index in range(len(pdf)):
                page = pdf[page_index]

                # Render page to bitmap
                bitmap = page.render(scale=scale)

                # Convert to PIL Image
                pil_image = bitmap.to_pil()

                # Convert to PNG bytes
                buffer = io.BytesIO()
                pil_image.save(buffer, format="PNG")
                images.append(buffer.getvalue())

        finally:
            pdf.close()

        return images

    @staticmethod
    def get_pdf_info(pdf_bytes: bytes) -> PDFInfo:
        """Get metadata about a PDF.

        Returns:
            PDFInfo with page_count, width, height of first page
        """
        pdf = pdfium.PdfDocument(pdf_bytes)

        try:
            page_count = len(pdf)

            # Get dimensions of first page
            if page_count > 0:
                first_page = pdf[0]
                width = int(first_page.get_width())
                height = int(first_page.get_height())
            else:
                width = height = 0

            return {
                "page_count": page_count,
                "width": width,
                "height": height,
            }

        finally:
            pdf.close()

    @staticmethod
    def is_pdf(data: bytes) -> bool:
        """Check if data is a PDF file."""
        return data[:4] == b'%PDF'
