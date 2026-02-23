"""Phase 2: Space Detection agent.

Identifies all distinct rooms and spaces in the blueprint.
"""

from google.genai import types

from python_api.models import SpaceDetectionResult
from python_api.agents.gemini_utils import get_client, get_schema


SPACE_DETECTION_INSTRUCTIONS = """You are an expert at analyzing architectural floor plans and identifying distinct spaces.

Your task is to find and catalog every room, corridor, and defined space in the blueprint.

## How to Identify Spaces

1. **Look for room labels**: Most floor plans label rooms (e.g., "MASTER BEDROOM", "KITCHEN", "BATH 1")
2. **Follow wall boundaries**: Trace enclosed areas defined by walls
3. **Check door swings**: Doors indicate transitions between spaces
4. **Read dimension strings**: Help estimate room sizes
5. **Identify space types**:
   - **room**: Bedrooms, living rooms, dining rooms, kitchens, bathrooms, offices
   - **corridor**: Hallways, entries, foyers, stairways
   - **exterior**: Porches, patios, decks, garages (if shown)
   - **utility**: Mechanical rooms, closets, laundry, pantry, storage
   - **other**: Anything that doesn't fit above

## Naming Convention

- Use the label from the drawing if present (e.g., "Master Bedroom", "Kitchen")
- If no label, describe by type and location (e.g., "Bedroom 2", "Hall Closet")
- Keep names concise and descriptive

## ID Convention

- Use format: "type-N" (e.g., "room-1", "corridor-1", "utility-3")
- Number sequentially within each type

## Area Estimates

- Use the scale (if known) to estimate each room's area in square feet
- If no scale, make reasonable estimates based on standard construction:
  - Standard bedroom: 120-180 SF
  - Master bedroom: 200-350 SF
  - Bathroom: 40-80 SF
  - Kitchen: 100-200 SF
  - Living room: 200-400 SF

## Floor Detection

- Identify which floor each space is on
- If only one floor is shown, set floor to "1st Floor" or leave null

## Be Thorough

Capture EVERY distinct space. Even small closets and utility areas matter for accurate takeoffs.
"""


async def detect_spaces(
    content_parts: list[types.Part],
    doc_type: str | None = None,
    scale: str | None = None,
) -> SpaceDetectionResult:
    """Detect all rooms/spaces in the blueprint."""

    prompt_parts = [
        "Identify every distinct room, corridor, and space in this blueprint.",
        "Provide an ID, name, type, and area estimate for each.",
    ]

    if doc_type:
        prompt_parts.append(f"\nDocument type: {doc_type}")

    if scale:
        prompt_parts.append(f"\nScale: {scale}")
    else:
        prompt_parts.append(
            "\nNo scale detected. Estimate areas based on standard construction dimensions."
        )

    prompt = "\n".join(prompt_parts)

    response = await get_client().aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt, *content_parts],
        config=types.GenerateContentConfig(
            system_instruction=SPACE_DETECTION_INSTRUCTIONS,
            response_mime_type="application/json",
            response_schema=get_schema(SpaceDetectionResult),
        ),
    )

    return SpaceDetectionResult.model_validate_json(response.text)
