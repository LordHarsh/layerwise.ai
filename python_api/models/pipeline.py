"""Models for the multi-phase agentic pipeline."""

from enum import Enum

from pydantic import BaseModel, Field

from python_api.models.takeoff import TakeoffItem
from python_api.models.blueprint import ScaleInfo


class SpaceType(str, Enum):
    ROOM = "room"
    CORRIDOR = "corridor"
    EXTERIOR = "exterior"
    UTILITY = "utility"
    OTHER = "other"


class DocumentIntelligence(BaseModel):
    """Phase 1: Document-level intelligence."""

    doc_type: str = Field(description="Document type (floor plan, elevation, section, site plan, detail, mixed)")
    page_count: int = Field(ge=1, description="Number of pages")
    drawing_types: list[str] = Field(default_factory=list, description="Types of drawings found (e.g., floor plan, elevation)")
    scale: ScaleInfo | None = Field(default=None, description="Detected scale info")
    estimated_rooms: int = Field(ge=0, description="Estimated number of rooms/spaces")
    complexity: str = Field(description="Complexity rating: simple, moderate, complex")
    notes: list[str] = Field(default_factory=list, description="General observations about the document")


class Space(BaseModel):
    """A detected room or space in the blueprint."""

    id: str = Field(description="Unique identifier (e.g., 'room-1', 'corridor-2')")
    name: str = Field(description="Space name (e.g., 'Master Bedroom', 'Kitchen')")
    type: SpaceType = Field(description="Space classification")
    floor: str | None = Field(default=None, description="Floor level (e.g., '1st Floor', 'Basement')")
    area_estimate: float | None = Field(default=None, ge=0, description="Estimated area in SF")


class SpaceDetectionResult(BaseModel):
    """Phase 2: Space detection results."""

    spaces: list[Space] = Field(default_factory=list, description="All detected spaces")
    total_area_estimate: float | None = Field(default=None, ge=0, description="Total area in SF")
    floor_count: int = Field(default=1, ge=1, description="Number of floors detected")


class RoomTakeoff(BaseModel):
    """Phase 3: Takeoff results for a single room."""

    space_id: str = Field(description="ID of the space")
    space_name: str = Field(description="Name of the space")
    items: list[TakeoffItem] = Field(default_factory=list, description="Items extracted from this room")
    notes: list[str] = Field(default_factory=list, description="Room-specific notes")


class TradeAnalysis(BaseModel):
    """Phase 4: Trade-specific deep-dive results."""

    trade: str = Field(description="Trade name (electrical, plumbing, hvac, structural, finishes)")
    items: list[TakeoffItem] = Field(default_factory=list, description="Trade-specific items")
    recommendations: list[str] = Field(default_factory=list, description="Trade-specific recommendations")
    code_references: list[str] = Field(default_factory=list, description="Relevant building code references")
    notes: list[str] = Field(default_factory=list, description="Trade-specific notes")
