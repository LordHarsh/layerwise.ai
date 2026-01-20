from typing import TypedDict

import httpx
import fitz  # PyMuPDF

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
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        try:
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]

                # Calculate zoom factor for desired DPI
                zoom = dpi / DEFAULT_PDF_DPI
                matrix = fitz.Matrix(zoom, zoom)

                # Render page to pixmap
                pixmap = page.get_pixmap(matrix=matrix)

                # Convert to PNG bytes
                png_bytes = pixmap.tobytes("png")
                images.append(png_bytes)

        finally:
            pdf_document.close()

        return images

    @staticmethod
    def get_pdf_info(pdf_bytes: bytes) -> PDFInfo:
        """Get metadata about a PDF.

        Returns:
            PDFInfo with page_count, width, height of first page
        """
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        try:
            page_count = len(pdf_document)

            # Get dimensions of first page
            if page_count > 0:
                first_page = pdf_document[0]
                rect = first_page.rect
                width = int(rect.width)
                height = int(rect.height)
            else:
                width = height = 0

            return {
                "page_count": page_count,
                "width": width,
                "height": height,
            }

        finally:
            pdf_document.close()

    @staticmethod
    def is_pdf(data: bytes) -> bool:
        """Check if data is a PDF file."""
        return data[:4] == b'%PDF'
