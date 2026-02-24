import logging

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from python_api.models import TakeoffRequest, TakeoffResult
from python_api.agents import (
    run_takeoff,
    run_room_takeoff,
    detect_scale,
    analyze_document,
    detect_spaces,
    run_trade_analysis,
)
from python_api.services import FileService, StreamService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/takeoff", tags=["takeoff"])


# ── Request models for new endpoints ──


class PipelineRequest(BaseModel):
    """Request body for the pipeline streaming endpoint."""
    blueprint_url: str = Field(description="URL of the blueprint PDF/image")
    scale: str | None = Field(default=None, description="Manual scale override")


class TradeDeepDiveRequest(BaseModel):
    """Request body for the trade deep-dive endpoint."""
    blueprint_url: str = Field(description="URL of the blueprint PDF/image")
    trade: str = Field(description="Trade name: electrical, plumbing, hvac, structural, finishes")
    spaces_summary: str = Field(description="Text summary of detected spaces")
    scale: str | None = Field(default=None, description="Scale override")


class DocIntelligenceRequest(BaseModel):
    """Request body for the document intelligence endpoint."""
    blueprint_url: str = Field(description="URL of the blueprint PDF/image")


class DetectSpacesRequest(BaseModel):
    """Request body for the space detection endpoint."""
    blueprint_url: str = Field(description="URL of the blueprint PDF/image")
    doc_type: str | None = Field(default=None, description="Document type from Phase 1")
    scale: str | None = Field(default=None, description="Scale override")


class RoomTakeoffRequest(BaseModel):
    """Request body for single-room takeoff endpoint."""
    blueprint_url: str = Field(description="URL of the blueprint PDF/image")
    space_name: str = Field(description="Name of the room/space to analyze")
    space_type: str = Field(description="Type of space: room, corridor, exterior, utility, other")
    scale: str | None = Field(default=None, description="Scale override")


# ── Existing endpoints (backward compat) ──


@router.post("/analyze")
async def analyze_blueprint(request: TakeoffRequest) -> TakeoffResult:
    """Analyze a blueprint and return takeoff results (non-streaming)."""
    try:
        file_bytes = await FileService.fetch_file(request.blueprint_url)

        scale = request.scale
        if not scale and request.auto_detect_scale:
            scale_result = await detect_scale(file_bytes)
            if scale_result.detected and scale_result.scale_info:
                scale = scale_result.scale_info.scale_string

        content_parts = FileService.to_content_parts(file_bytes)

        result = await run_takeoff(
            content_parts=content_parts,
            scale=scale,
            focus_areas=request.focus_areas,
        )

        return result

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching blueprint: {e}")
        raise HTTPException(status_code=400, detail="Failed to fetch blueprint")
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


@router.post("/stream")
async def stream_takeoff(request: TakeoffRequest):
    """Stream takeoff analysis results via Server-Sent Events."""

    async def generate():
        try:
            yield StreamService.progress_event(0, 100, "Fetching blueprint...")

            file_bytes = await FileService.fetch_file(request.blueprint_url)
            file_info = FileService.get_file_info(file_bytes)

            yield StreamService.progress_event(10, 100, "Blueprint loaded")
            yield StreamService.format_sse("info", {
                "type": file_info["file_type"],
                "size": file_info["size"],
            })

            scale = request.scale
            if not scale and request.auto_detect_scale:
                yield StreamService.progress_event(20, 100, "Detecting scale...")
                scale_result = await detect_scale(file_bytes)

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

            yield StreamService.progress_event(30, 100, "Analyzing blueprint...")

            content_parts = FileService.to_content_parts(file_bytes)

            yield StreamService.progress_event(50, 100, "AI analyzing...")
            result = await run_takeoff(
                content_parts=content_parts,
                scale=scale,
                focus_areas=request.focus_areas,
            )

            yield StreamService.progress_event(90, 100, "Finalizing results...")

            for item in result.items:
                yield StreamService.format_sse("item", item.model_dump())

            yield StreamService.progress_event(100, 100, "Complete")

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
    """Detect the scale from a blueprint."""
    try:
        file_bytes = await FileService.fetch_file(blueprint_url)
        result = await detect_scale(file_bytes)

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


# ── New pipeline endpoints (JSON, no SSE) ──


AVAILABLE_TRADES = ["electrical", "plumbing", "hvac", "structural", "finishes"]


@router.post("/doc-intelligence")
async def doc_intelligence(request: DocIntelligenceRequest) -> dict:
    """Phase 1: Analyze document to extract type, scale, room estimate, complexity."""
    try:
        file_bytes = await FileService.fetch_file(request.blueprint_url)
        file_info = FileService.get_file_info(file_bytes)
        content_parts = FileService.to_content_parts(file_bytes)

        doc_info = await analyze_document(
            content_parts=content_parts,
            page_count=file_info["page_count"],
        )

        return doc_info.model_dump()

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching blueprint: {e}")
        raise HTTPException(status_code=400, detail="Failed to fetch blueprint")
    except Exception as e:
        logger.exception("Document intelligence failed")
        raise HTTPException(status_code=500, detail="Document intelligence failed. Please try again.")


@router.post("/detect-spaces")
async def detect_spaces_endpoint(request: DetectSpacesRequest) -> dict:
    """Phase 2: Detect all rooms/spaces in the blueprint."""
    try:
        file_bytes = await FileService.fetch_file(request.blueprint_url)
        content_parts = FileService.to_content_parts(file_bytes)

        space_result = await detect_spaces(
            content_parts=content_parts,
            doc_type=request.doc_type,
            scale=request.scale,
        )

        return space_result.model_dump()

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching blueprint: {e}")
        raise HTTPException(status_code=400, detail="Failed to fetch blueprint")
    except Exception as e:
        logger.exception("Space detection failed")
        raise HTTPException(status_code=500, detail="Space detection failed. Please try again.")


@router.post("/room-takeoff")
async def room_takeoff(request: RoomTakeoffRequest) -> dict:
    """Phase 3: Extract takeoff items for a single room/space."""
    try:
        file_bytes = await FileService.fetch_file(request.blueprint_url)
        content_parts = FileService.to_content_parts(file_bytes)

        items = await run_room_takeoff(
            content_parts=content_parts,
            space_name=request.space_name,
            space_type=request.space_type,
            scale=request.scale,
        )

        return {
            "space_name": request.space_name,
            "items": [item.model_dump() for item in items],
        }

    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching blueprint: {e}")
        raise HTTPException(status_code=400, detail="Failed to fetch blueprint")
    except Exception as e:
        logger.exception(f"Room takeoff failed for {request.space_name}")
        raise HTTPException(status_code=500, detail=f"Room takeoff failed for {request.space_name}. Please try again.")


# ── Legacy SSE pipeline endpoint ──


@router.post("/stream-pipeline")
async def stream_pipeline(request: PipelineRequest):
    """Multi-phase streaming pipeline for blueprint analysis.

    Phases:
    1. Document Intelligence - doc type, scale, room estimate, complexity
    2. Space Detection - identify all rooms/spaces
    3. Room-by-Room Extraction - takeoff items per room

    SSE Events:
    - phase_start: { phase, name }
    - doc_intelligence: { DocumentIntelligence }
    - spaces: { SpaceDetectionResult }
    - room_start: { space_id, space_name }
    - room_items: { space_id, space_name, items[] }
    - phase_complete: { phase }
    - complete: { total_items, summary, available_trades[] }
    - error: { code, message }
    """

    async def generate():
        try:
            # Fetch blueprint
            yield StreamService.format_sse("progress", {"message": "Fetching blueprint..."})
            file_bytes = await FileService.fetch_file(request.blueprint_url)
            file_info = FileService.get_file_info(file_bytes)
            content_parts = FileService.to_content_parts(file_bytes)

            # ── Phase 1: Document Intelligence ──
            yield StreamService.format_sse("phase_start", {
                "phase": 1,
                "name": "Document Intelligence",
            })

            doc_info = await analyze_document(
                content_parts=content_parts,
                page_count=file_info["page_count"],
            )

            # Determine scale: manual override > detected > None
            scale = request.scale
            if not scale and doc_info.scale:
                scale = doc_info.scale.scale_string

            yield StreamService.format_sse("doc_intelligence", doc_info.model_dump())
            yield StreamService.format_sse("phase_complete", {"phase": 1})

            # ── Phase 2: Space Detection ──
            yield StreamService.format_sse("phase_start", {
                "phase": 2,
                "name": "Space Detection",
            })

            space_result = await detect_spaces(
                content_parts=content_parts,
                doc_type=doc_info.doc_type,
                scale=scale,
            )

            yield StreamService.format_sse("spaces", space_result.model_dump())
            yield StreamService.format_sse("phase_complete", {"phase": 2})

            # ── Phase 3: Room-by-Room Extraction ──
            yield StreamService.format_sse("phase_start", {
                "phase": 3,
                "name": "Quantity Extraction",
            })

            all_items = []
            room_count = len(space_result.spaces)

            for idx, space in enumerate(space_result.spaces):
                yield StreamService.format_sse("room_start", {
                    "space_id": space.id,
                    "space_name": space.name,
                    "index": idx,
                    "total": room_count,
                })

                try:
                    items = await run_room_takeoff(
                        content_parts=content_parts,
                        space_name=space.name,
                        space_type=space.type.value,
                        scale=scale,
                    )
                    all_items.extend(items)

                    yield StreamService.format_sse("room_items", {
                        "space_id": space.id,
                        "space_name": space.name,
                        "items": [item.model_dump() for item in items],
                    })
                except Exception as e:
                    logger.warning(f"Room takeoff failed for {space.name}: {e}")
                    yield StreamService.format_sse("room_items", {
                        "space_id": space.id,
                        "space_name": space.name,
                        "items": [],
                        "error": str(e),
                    })

            yield StreamService.format_sse("phase_complete", {"phase": 3})

            # ── Complete ──
            summary: dict[str, float] = {}
            for item in all_items:
                cat = item.category.value if hasattr(item.category, "value") else item.category
                key = f"total_{cat}"
                summary[key] = summary.get(key, 0) + item.quantity

            yield StreamService.complete_event({
                "total_items": len(all_items),
                "summary": summary,
                "scale_used": scale,
                "available_trades": AVAILABLE_TRADES,
            })

        except httpx.HTTPError as e:
            logger.error(f"HTTP error in pipeline: {e}")
            yield StreamService.error_event("Failed to fetch blueprint")
        except Exception as e:
            logger.exception("Pipeline failed")
            yield StreamService.error_event(str(e))

    return EventSourceResponse(generate())


@router.post("/trade-deepdive")
async def trade_deepdive(request: TradeDeepDiveRequest):
    """Run a trade-specific deep-dive analysis via SSE.

    SSE Events:
    - trade_start: { trade }
    - trade_result: { TradeAnalysis }
    - trade_complete: { trade, item_count }
    - error: { code, message }
    """

    if request.trade not in AVAILABLE_TRADES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown trade '{request.trade}'. Must be one of: {AVAILABLE_TRADES}",
        )

    async def generate():
        try:
            yield StreamService.format_sse("trade_start", {"trade": request.trade})

            file_bytes = await FileService.fetch_file(request.blueprint_url)
            content_parts = FileService.to_content_parts(file_bytes)

            result = await run_trade_analysis(
                content_parts=content_parts,
                trade=request.trade,
                spaces_summary=request.spaces_summary,
                scale=request.scale,
            )

            yield StreamService.format_sse("trade_result", result.model_dump())
            yield StreamService.format_sse("trade_complete", {
                "trade": request.trade,
                "item_count": len(result.items),
            })

        except Exception as e:
            logger.exception(f"Trade deep-dive failed for {request.trade}")
            yield StreamService.error_event(str(e))

    return EventSourceResponse(generate())
