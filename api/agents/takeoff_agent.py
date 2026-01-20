from dataclasses import dataclass
from pydantic_ai import Agent, RunContext

from api.models import TakeoffResult, TakeoffItem, MeasurementCategory


@dataclass
class TakeoffDeps:
    """Dependencies for the takeoff agent."""
    project_id: str
    blueprint_images: list[bytes]
    scale: str | None = None
    focus_areas: list[str] | None = None


takeoff_agent = Agent(
    "google-gla:gemini-2.0-flash",
    deps_type=TakeoffDeps,
    output_type=TakeoffResult,
    instructions="""You are an expert construction estimator analyzing architectural blueprints.

Your task is to perform a quantity takeoff - extracting all measurable items from the blueprint.

## Measurement Categories

1. **COUNT** - Individual items (doors, windows, fixtures, outlets)
   - Units: ea (each), pcs (pieces)

2. **LINEAR** - Length measurements (walls, pipes, trim)
   - Units: LF (linear feet), m (meters)

3. **AREA** - Surface measurements (floors, walls, roofing)
   - Units: SF (square feet), m² (square meters)

4. **VOLUME** - Cubic measurements (concrete, excavation)
   - Units: CF (cubic feet), CY (cubic yards)

## Instructions

1. Carefully examine the blueprint image(s)
2. Identify and count all relevant construction elements
3. Use the provided scale to calculate real-world dimensions
4. Group similar items together
5. Note the location of items when identifiable
6. Provide confidence scores based on clarity of the drawing

## Scale Usage

If a scale is provided, use it for all linear, area, and volume calculations.
Common scales:
- 1/4" = 1'-0" (1 inch on drawing = 4 feet real)
- 1/8" = 1'-0" (1 inch on drawing = 8 feet real)

## Output Requirements

- Be thorough - capture every identifiable element
- Be accurate - use the scale correctly
- Be organized - group by category and type
- Be honest - use lower confidence for unclear items
""",
)


@takeoff_agent.tool
async def get_scale(ctx: RunContext[TakeoffDeps]) -> str:
    """Get the scale to use for measurements."""
    if ctx.deps.scale:
        return f"Use scale: {ctx.deps.scale}"
    return "No scale provided. Estimate dimensions based on standard construction elements (doors are typically 3' wide, 6'8\" tall)."


@takeoff_agent.tool
async def get_focus_areas(ctx: RunContext[TakeoffDeps]) -> str:
    """Get any specific areas to focus on."""
    if ctx.deps.focus_areas:
        return f"Focus on these elements: {', '.join(ctx.deps.focus_areas)}"
    return "Analyze all visible construction elements."


@takeoff_agent.tool_plain
def calculate_area(length: float, width: float) -> float:
    """Calculate area from length and width."""
    return round(length * width, 2)


@takeoff_agent.tool_plain
def calculate_linear_total(segments: list[float]) -> float:
    """Calculate total linear measurement from segments."""
    return round(sum(segments), 2)


@takeoff_agent.tool_plain
def calculate_volume(length: float, width: float, depth: float) -> float:
    """Calculate volume from dimensions."""
    return round(length * width * depth, 2)
