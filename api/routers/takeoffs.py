import logging

import httpx
from fastapi import APIRouter, HTTPException, Query
from sse_starlette.sse import EventSourceResponse
from pydantic_ai.messages import BinaryContent

from api.models import TakeoffRequest, TakeoffResult
from api.agents import takeoff_agent, TakeoffDeps, detect_scale
from api.services import PDFService, StreamService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/takeoff", tags=["takeoff"])


@router.post("/analyze")
async def analyze_blueprint(request: TakeoffRequest) -> TakeoffResult:
    """Analyze a blueprint and return takeoff results.

    This is the non-streaming version that returns the complete result.
    """
    try:
        # Fetch the blueprint
        pdf_bytes = await PDFService.fetch_pdf(request.blueprint_url)

        # Convert to images
        if PDFService.is_pdf(pdf_bytes):
            images = PDFService.pdf_to_images(pdf_bytes)
        else:
            # Assume it's already an image
            images = [pdf_bytes]

        # Determine scale
        scale = request.scale
        if not scale and request.auto_detect_scale and images:
            scale_result = await detect_scale(images[0])
            if scale_result.detected and scale_result.scale_info:
                scale = scale_result.scale_info.scale_string

        # Create dependencies
        deps = TakeoffDeps(
            project_id="temp",
            blueprint_images=images,
            scale=scale,
            focus_areas=request.focus_areas,
        )

        # Build the message with images
        messages = ["Analyze this blueprint and perform a complete quantity takeoff."]
        for i, img in enumerate(images):
            messages.append(BinaryContent(data=img, media_type="image/png"))
            if len(images) > 1:
                messages.append(f"(Page {i + 1} of {len(images)})")

        # Run the agent
        result = await takeoff_agent.run(messages, deps=deps)

        return result.output

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching blueprint: {e}")
        raise HTTPException(status_code=400, detail="Failed to fetch blueprint")
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


@router.post("/stream")
async def stream_takeoff(request: TakeoffRequest):
    """Stream takeoff analysis results via Server-Sent Events.

    Events:
    - progress: Analysis progress updates
    - item: Individual takeoff items as they're identified
    - scale: Detected scale information
    - complete: Final summary when analysis is done
    - error: Error information if something fails
    """

    async def generate():
        try:
            # Send initial progress
            yield StreamService.progress_event(0, 100, "Fetching blueprint...")

            # Fetch the blueprint
            pdf_bytes = await PDFService.fetch_pdf(request.blueprint_url)
            yield StreamService.progress_event(10, 100, "Blueprint loaded")

            # Get PDF info
            if PDFService.is_pdf(pdf_bytes):
                pdf_info = PDFService.get_pdf_info(pdf_bytes)
                yield StreamService.format_sse("info", {
                    "type": "pdf",
                    "page_count": pdf_info["page_count"],
                })

                yield StreamService.progress_event(15, 100, "Converting pages to images...")
                images = PDFService.pdf_to_images(pdf_bytes)
            else:
                yield StreamService.format_sse("info", {"type": "image", "page_count": 1})
                images = [pdf_bytes]

            yield StreamService.progress_event(25, 100, f"Processing {len(images)} page(s)")

            # Scale detection
            scale = request.scale
            if not scale and request.auto_detect_scale and images:
                yield StreamService.progress_event(30, 100, "Detecting scale...")
                scale_result = await detect_scale(images[0])

                if scale_result.detected and scale_result.scale_info:
                    scale = scale_result.scale_info.scale_string
                    yield StreamService.format_sse("scale", {
                        "detected": True,
                        "scale": scale,
                        "confidence": scale_result.scale_info.confidence,
                        "reasoning": scale_result.reasoning,
                    })
                else:
                    yield StreamService.format_sse("scale", {
                        "detected": False,
                        "reasoning": scale_result.reasoning,
                    })

            yield StreamService.progress_event(40, 100, "Analyzing blueprint...")

            # Create dependencies
            deps = TakeoffDeps(
                project_id="temp",
                blueprint_images=images,
                scale=scale,
                focus_areas=request.focus_areas,
            )

            # Build messages with images
            messages = ["Analyze this blueprint and perform a complete quantity takeoff."]
            for i, img in enumerate(images):
                messages.append(BinaryContent(data=img, media_type="image/png"))

            # Run the agent with streaming
            async with takeoff_agent.run_stream(messages, deps=deps) as response:
                yield StreamService.progress_event(50, 100, "AI analyzing...")

                # Stream partial results
                async for chunk in response.stream():
                    if chunk:
                        yield StreamService.format_sse("chunk", {"text": chunk})

                # Get final result
                result = await response.get_output()

                yield StreamService.progress_event(90, 100, "Finalizing results...")

                # Stream individual items
                for item in result.items:
                    yield StreamService.format_sse("item", item.model_dump())

                yield StreamService.progress_event(100, 100, "Complete")

                # Send complete event with summary
                yield StreamService.complete_event({
                    "total_items": len(result.items),
                    "summary": result.summary,
                    "notes": result.notes,
                    "scale_used": result.scale_used,
                })

        except Exception as e:
            yield StreamService.error_event(str(e))

    return EventSourceResponse(generate())


@router.post("/detect-scale")
async def detect_blueprint_scale(
    blueprint_url: str = Query(..., description="URL of the blueprint PDF or image")
) -> dict:
    """Detect the scale from a blueprint.

    Returns scale information if detected.
    """
    try:
        # Fetch the blueprint
        pdf_bytes = await PDFService.fetch_pdf(blueprint_url)

        # Get first page as image
        if PDFService.is_pdf(pdf_bytes):
            images = PDFService.pdf_to_images(pdf_bytes, dpi=200)
            image = images[0] if images else None
        else:
            image = pdf_bytes

        if not image:
            raise HTTPException(status_code=400, detail="Could not extract image from blueprint")

        # Detect scale
        result = await detect_scale(image)

        return {
            "detected": result.detected,
            "scale": result.scale_info.model_dump() if result.scale_info else None,
            "reasoning": result.reasoning,
        }

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching blueprint for scale detection: {e}")
        raise HTTPException(status_code=400, detail="Failed to fetch blueprint")
    except Exception as e:
        logger.exception("Scale detection failed")
        raise HTTPException(status_code=500, detail="Scale detection failed. Please try again.")
