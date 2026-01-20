from dataclasses import dataclass
from pydantic import BaseModel, Field
from pydantic_ai import Agent

from api.models import ScaleInfo


class ScaleDetectionResult(BaseModel):
    """Result of scale detection analysis."""
    detected: bool = Field(description="Whether a scale was successfully detected")
    scale_info: ScaleInfo | None = Field(default=None, description="Detected scale information")
    reasoning: str = Field(description="Explanation of how the scale was determined")


@dataclass
class ScaleDetectorDeps:
    """Dependencies for scale detection."""
    image_data: bytes


scale_detector_agent = Agent(
    "google-gla:gemini-2.0-flash",
    deps_type=ScaleDetectorDeps,
    output_type=ScaleDetectionResult,
    instructions="""You are an expert at reading architectural drawings and identifying scale notations.

Your task is to find and interpret the scale of a blueprint.

## Where to Look for Scale

1. **Title Block** - Usually bottom right corner, contains project info and scale
2. **Graphic Scale** - A bar scale showing distance measurements
3. **Near North Arrow** - Scale notation often placed nearby
4. **Drawing Labels** - Individual drawings may have their own scale

## Common Architectural Scales

- 1/4" = 1'-0" (Quarter inch scale, most common for floor plans)
- 1/8" = 1'-0" (Eighth inch scale, for larger buildings)
- 1/2" = 1'-0" (Half inch scale, for details)
- 1" = 1'-0" (Full scale, for details)
- 3/4" = 1'-0" (Three-quarter inch scale)
- 1" = 10' (Engineering scale)
- 1" = 20' (Site plans)

## Metric Scales

- 1:50 (similar to 1/4" = 1'-0")
- 1:100 (similar to 1/8" = 1'-0")
- 1:200 (site plans)

## Verification Methods

1. Check if standard elements match expected sizes:
   - Standard doors: 3'-0" wide, 6'-8" or 7'-0" tall
   - Standard windows: 3'-0" x 4'-0" common
   - Interior walls: typically 4-1/2" to 5" thick (2x4 + drywall)

2. Look for dimension strings on the drawing

## Output

- If you find a clear scale notation, confidence should be high (0.8-1.0)
- If inferring from standard elements, confidence should be medium (0.5-0.7)
- If uncertain, confidence should be low (0.2-0.4)

Always explain your reasoning.
""",
)


async def detect_scale(image_data: bytes) -> ScaleDetectionResult:
    """Detect the scale from a blueprint image."""
    from pydantic_ai.messages import BinaryContent

    deps = ScaleDetectorDeps(image_data=image_data)

    result = await scale_detector_agent.run(
        [
            "Analyze this architectural drawing and identify the scale.",
            BinaryContent(data=image_data, media_type="image/png")
        ],
        deps=deps
    )

    return result.output
