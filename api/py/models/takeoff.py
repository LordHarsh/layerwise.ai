from enum import Enum
from pydantic import BaseModel, Field


class MeasurementCategory(str, Enum):
    """Types of measurements in construction takeoff."""
    COUNT = "count"
    LINEAR = "linear"
    AREA = "area"
    VOLUME = "volume"


class TakeoffItem(BaseModel):
    """A single item extracted from a blueprint."""

    name: str = Field(description="Name of the item (e.g., 'Interior Door 3x7')")
    category: MeasurementCategory = Field(description="Type of measurement")
    quantity: float = Field(ge=0, description="Measured quantity")
    unit: str = Field(description="Unit of measurement (ea, LF, SF, CF, etc.)")
    location: str | None = Field(default=None, description="Location on blueprint (e.g., 'Floor 1, Room 101')")
    notes: str | None = Field(default=None, description="Additional notes about this item")
    confidence: float = Field(
        ge=0, le=1,
        default=0.8,
        description="Confidence score of the measurement (0-1)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Interior Door 3'-0\" x 6'-8\"",
                "category": "count",
                "quantity": 12,
                "unit": "ea",
                "location": "Floor 1",
                "notes": "Standard hollow core",
                "confidence": 0.95
            }
        }


class TakeoffResult(BaseModel):
    """Complete takeoff result from blueprint analysis."""

    items: list[TakeoffItem] = Field(default_factory=list, description="All extracted items")
    summary: dict[str, float] = Field(
        default_factory=dict,
        description="Summary totals by category"
    )
    notes: list[str] = Field(
        default_factory=list,
        description="General notes and observations"
    )
    scale_used: str | None = Field(default=None, description="Scale used for measurements")
    page_count: int = Field(default=1, description="Number of pages analyzed")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "name": "Interior Door",
                        "category": "count",
                        "quantity": 12,
                        "unit": "ea",
                        "confidence": 0.95
                    }
                ],
                "summary": {
                    "total_doors": 14,
                    "total_windows": 8,
                    "total_wall_lf": 850
                },
                "notes": ["Scale verified from title block"],
                "scale_used": "1/4\" = 1'-0\"",
                "page_count": 3
            }
        }


class TakeoffRequest(BaseModel):
    """Request to perform a takeoff analysis."""

    blueprint_url: str = Field(description="URL of the blueprint PDF/image (Vercel Blob URL)")
    scale: str | None = Field(
        default=None,
        description="Manual scale override (e.g., '1/4\" = 1'-0\"')"
    )
    auto_detect_scale: bool = Field(
        default=True,
        description="Whether to attempt auto-detecting scale from the blueprint"
    )
    focus_areas: list[str] | None = Field(
        default=None,
        description="Specific areas to focus on (e.g., ['doors', 'windows', 'electrical'])"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "blueprint_url": "https://blob.vercel-storage.com/blueprints/floor-plan.pdf",
                "scale": None,
                "auto_detect_scale": True,
                "focus_areas": None
            }
        }
