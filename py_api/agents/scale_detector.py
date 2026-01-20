import os
from dataclasses import dataclass

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from py_api.models import ScaleInfo


class ScaleDetectionResult(BaseModel):
    """Result of scale detection analysis."""
    detected: bool = Field(description="Whether a scale was successfully detected")
    scale_info: ScaleInfo | None = Field(default=None, description="Detected scale information")
    reasoning: str = Field(description="Explanation of how the scale was determined")


@dataclass
class ScaleDetectorDeps:
    """Dependencies for scale detection."""
    file_data: bytes


# Use Gemini via OpenAI-compatible endpoint (lighter SDK)
gemini_model = OpenAIModel(
    "gemini-2.0-flash",
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key=os.environ.get("GOOGLE_API_KEY"),
)

scale_detector_agent = Agent(
    gemini_model,
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


async def detect_scale(file_data: bytes) -> ScaleDetectionResult:
    """Detect the scale from a blueprint (PDF or image)."""
    from pydantic_ai.messages import BinaryContent
    from py_api.services import FileService

    deps = ScaleDetectorDeps(file_data=file_data)
    mime_type = FileService.get_mime_type(file_data)

    result = await scale_detector_agent.run(
        [
            "Analyze this architectural drawing and identify the scale.",
            BinaryContent(data=file_data, media_type=mime_type)
        ],
        deps=deps
    )

    return result.output
