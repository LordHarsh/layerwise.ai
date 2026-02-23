from google.genai import types

from python_api.models import TakeoffResult, TakeoffItem
from python_api.agents.gemini_utils import get_client, get_schema


TAKEOFF_INSTRUCTIONS = """You are an expert construction estimator analyzing architectural blueprints.

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
"""

ROOM_TAKEOFF_INSTRUCTIONS = """You are an expert construction estimator analyzing architectural blueprints.

Your task is to extract all measurable items from ONE SPECIFIC ROOM/SPACE in the blueprint.

## Target Space

Focus ONLY on the room/space specified in the prompt. Do not include items from other spaces.

## Measurement Categories

1. **COUNT** - Individual items (doors, windows, fixtures, outlets, switches)
   - Units: ea (each), pcs (pieces)

2. **LINEAR** - Length measurements (walls, baseboards, crown molding, pipes)
   - Units: LF (linear feet), m (meters)

3. **AREA** - Surface measurements (floor area, wall area, ceiling)
   - Units: SF (square feet), m² (square meters)

4. **VOLUME** - Cubic measurements (concrete, excavation)
   - Units: CF (cubic feet), CY (cubic yards)

## Instructions

1. Locate the specified room/space on the blueprint
2. Extract EVERY measurable item within that space
3. Include wall lengths, floor area, and ceiling area
4. Count all doors, windows, outlets, switches, and fixtures
5. Note any special features (built-ins, niches, soffits)
6. Use the provided scale for accurate measurements

## Output Requirements

- Be exhaustive within the target room
- Set location to the room name for all items
- Use lower confidence for items at room boundaries
"""


async def run_takeoff(
    content_parts: list[types.Part],
    scale: str | None = None,
    focus_areas: list[str] | None = None,
) -> TakeoffResult:
    """Run takeoff analysis on blueprint images."""

    # Build prompt with context
    prompt_parts = ["Analyze this blueprint and perform a complete quantity takeoff."]

    if scale:
        prompt_parts.append(f"\nScale to use: {scale}")
    else:
        prompt_parts.append(
            "\nNo scale provided. Estimate dimensions based on standard "
            "construction elements (doors are typically 3' wide, 6'8\" tall)."
        )

    if focus_areas:
        prompt_parts.append(f"\nFocus on these elements: {', '.join(focus_areas)}")

    prompt = "\n".join(prompt_parts)

    response = await get_client().aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt, *content_parts],
        config=types.GenerateContentConfig(
            system_instruction=TAKEOFF_INSTRUCTIONS,
            response_mime_type="application/json",
            response_schema=get_schema(TakeoffResult),
        ),
    )

    return TakeoffResult.model_validate_json(response.text)


async def run_room_takeoff(
    content_parts: list[types.Part],
    space_name: str,
    space_type: str,
    scale: str | None = None,
) -> list[TakeoffItem]:
    """Run takeoff extraction for a single room/space.

    Returns a list of TakeoffItems found in the specified room.
    """
    from pydantic import BaseModel, Field

    class RoomItems(BaseModel):
        items: list[TakeoffItem] = Field(default_factory=list)

    prompt_parts = [
        f'Extract all measurable items from the room/space named "{space_name}" (type: {space_type}).',
        "Focus ONLY on this specific space. Do not include items from other rooms.",
    ]

    if scale:
        prompt_parts.append(f"\nScale to use: {scale}")
    else:
        prompt_parts.append(
            "\nNo scale provided. Estimate dimensions based on standard "
            "construction elements."
        )

    prompt = "\n".join(prompt_parts)

    response = await get_client().aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt, *content_parts],
        config=types.GenerateContentConfig(
            system_instruction=ROOM_TAKEOFF_INSTRUCTIONS,
            response_mime_type="application/json",
            response_schema=get_schema(RoomItems),
        ),
    )

    result = RoomItems.model_validate_json(response.text)
    # Ensure location is set for all items
    for item in result.items:
        if not item.location:
            item.location = space_name
    return result.items
