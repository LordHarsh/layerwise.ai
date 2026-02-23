"""Phase 1: Document Intelligence agent.

Analyzes the first page of a blueprint to determine document type, scale,
room count estimate, and complexity.
"""

from google.genai import types

from python_api.models import DocumentIntelligence
from python_api.agents.gemini_utils import get_client, get_schema


DOC_INTELLIGENCE_INSTRUCTIONS = """You are an expert architectural document analyst.

Your task is to quickly assess a construction blueprint and provide high-level intelligence.

## What to Identify

1. **Document Type**: What kind of drawing is this?
   - Floor plan, elevation, section, site plan, detail sheet, or mixed

2. **Drawing Types**: List all types of drawings present
   - Floor plans, reflected ceiling plans, elevations, sections, details, schedules

3. **Scale**: Look for scale notations in the title block or near drawings
   - Report as ScaleInfo with scale_string, confidence, and source

4. **Room/Space Count**: Estimate how many distinct rooms and spaces are shown
   - Count bedrooms, bathrooms, kitchen, living areas, hallways, closets, utility rooms
   - Include corridors and exterior spaces if clearly defined

5. **Complexity**: Rate the overall drawing complexity
   - **simple**: Small residential (1-5 rooms), single floor, minimal detail
   - **moderate**: Medium residential (6-15 rooms), 1-2 floors, standard detail
   - **complex**: Large residential or commercial (15+ rooms), multiple floors, high detail

6. **Notes**: Any important observations
   - Construction type, notable features, drawing quality, missing information

## Be Fast and Accurate
This is a quick assessment phase. Focus on what's clearly visible. Don't spend time on uncertain details.
"""


async def analyze_document(
    content_parts: list[types.Part],
    page_count: int = 1,
) -> DocumentIntelligence:
    """Analyze document to extract high-level intelligence.

    Uses the first page (or all provided parts) for a quick assessment.
    """
    prompt = (
        "Analyze this architectural blueprint. Identify the document type, "
        "detect the scale, estimate the number of rooms/spaces, and assess complexity. "
        f"This document has {page_count} page(s)."
    )

    # Use only first page for speed if multiple pages
    parts_to_use = content_parts[:1] if len(content_parts) > 1 else content_parts

    response = await get_client().aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt, *parts_to_use],
        config=types.GenerateContentConfig(
            system_instruction=DOC_INTELLIGENCE_INSTRUCTIONS,
            response_mime_type="application/json",
            response_schema=get_schema(DocumentIntelligence),
        ),
    )

    result = DocumentIntelligence.model_validate_json(response.text)
    result.page_count = page_count
    return result
