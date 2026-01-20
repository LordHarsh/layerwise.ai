from pydantic import BaseModel, Field


class ScaleInfo(BaseModel):
    """Information about blueprint scale."""

    scale_string: str = Field(description="Human-readable scale (e.g., '1/4\" = 1'-0\"')")
    pixels_per_foot: float | None = Field(
        default=None,
        description="Calculated pixels per foot for measurements"
    )
    confidence: float = Field(
        ge=0, le=1,
        default=0.5,
        description="Confidence in scale detection (0-1)"
    )
    source: str = Field(
        default="manual",
        description="How scale was determined: 'auto', 'manual', 'inferred'"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "scale_string": "1/4\" = 1'-0\"",
                "pixels_per_foot": 48.0,
                "confidence": 0.9,
                "source": "auto"
            }
        }


class BlueprintMeta(BaseModel):
    """Metadata about a blueprint document."""

    url: str = Field(description="Storage URL of the blueprint")
    filename: str = Field(description="Original filename")
    page_count: int = Field(ge=1, description="Number of pages in the document")
    width_px: int | None = Field(default=None, description="Width in pixels")
    height_px: int | None = Field(default=None, description="Height in pixels")
    scale: ScaleInfo | None = Field(default=None, description="Detected or specified scale")
    drawing_type: str | None = Field(
        default=None,
        description="Type of drawing (floor plan, elevation, section, detail)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://blob.vercel-storage.com/blueprints/floor-plan.pdf",
                "filename": "floor-plan.pdf",
                "page_count": 5,
                "width_px": 3400,
                "height_px": 2200,
                "scale": {
                    "scale_string": "1/4\" = 1'-0\"",
                    "confidence": 0.85,
                    "source": "auto"
                },
                "drawing_type": "floor plan"
            }
        }


class BlueprintPage(BaseModel):
    """A single page from a blueprint document."""

    page_number: int = Field(ge=1, description="Page number (1-indexed)")
    image_data: bytes | None = Field(default=None, description="Raw image bytes")
    image_url: str | None = Field(default=None, description="URL to page image")
    width_px: int = Field(description="Width in pixels")
    height_px: int = Field(description="Height in pixels")
    drawing_type: str | None = Field(default=None, description="Type of drawing on this page")
