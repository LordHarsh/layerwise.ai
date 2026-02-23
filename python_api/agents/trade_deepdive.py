"""Phase 4: Trade-specific deep-dive agent.

Performs focused analysis for a specific construction trade.
"""

from google.genai import types

from python_api.models import TradeAnalysis, TakeoffItem
from python_api.agents.gemini_utils import get_client, get_schema


TRADE_PROMPTS: dict[str, str] = {
    "electrical": """You are an expert electrical estimator analyzing architectural blueprints.

## Focus Areas
- **Outlets**: Count all receptacles (standard, GFCI, 20A dedicated)
- **Switches**: Single-pole, 3-way, 4-way, dimmers
- **Lighting**: Recessed cans, pendants, sconces, under-cabinet, exterior
- **Panels**: Main panel, sub-panels, panel capacity
- **Circuits**: Dedicated circuits for appliances (kitchen, HVAC, etc.)
- **Low Voltage**: Data outlets, cable TV, doorbell, smoke detectors
- **Special**: Ceiling fans, garbage disposal, dishwasher connections

## Code Considerations
- NEC outlet spacing: max 12' between outlets, max 6' from any wall point
- GFCI required: bathrooms, kitchens (within 6' of sink), garages, outdoors, laundry
- AFCI required: bedrooms, living areas (per NEC 210.12)
- Dedicated 20A circuits: kitchen countertop, bathroom, laundry, garage
- Minimum lighting: at least one switching point per room

## Recommendations
Suggest where code requirements may not be met and what additional items are needed.
""",

    "plumbing": """You are an expert plumbing estimator analyzing architectural blueprints.

## Focus Areas
- **Fixtures**: Toilets, sinks, tubs, showers, bidets
- **Appliance Connections**: Dishwasher, ice maker, washing machine, water heater
- **Supply Lines**: Hot and cold water distribution, pipe runs
- **Drain Lines**: Waste and vent piping
- **Specialty**: Floor drains, hose bibs, gas lines (if shown)
- **Fixture Units**: Calculate total fixture units for sizing

## Code Considerations
- IPC fixture unit calculations for pipe sizing
- Vent requirements for each fixture
- Minimum pipe sizes per fixture type
- Water heater sizing based on fixture count
- Trap requirements

## Recommendations
Note fixture unit totals, suggest pipe sizing, identify potential issues.
""",

    "hvac": """You are an expert HVAC estimator analyzing architectural blueprints.

## Focus Areas
- **Supply/Return**: Duct runs, registers, grilles, diffusers
- **Equipment**: Furnace, AC condenser, heat pump, air handler
- **Exhaust**: Bathroom fans, kitchen hood, dryer vent
- **Controls**: Thermostats, zone controls
- **Ductwork**: Supply and return duct lengths (estimate)
- **Insulation**: Duct insulation requirements

## Code Considerations
- ASHRAE ventilation requirements
- Exhaust requirements: bathrooms (50 CFM), kitchens (100 CFM)
- Manual J load calculation factors (room sizes, windows, orientation)
- Duct sizing based on room CFM requirements
- Return air requirements

## Recommendations
Estimate heating/cooling loads, suggest equipment sizing, note ventilation concerns.
""",

    "structural": """You are an expert structural estimator analyzing architectural blueprints.

## Focus Areas
- **Foundation**: Footings, slab, stem walls, piers
- **Framing**: Wall studs (count/LF), headers, beams, columns, joists, rafters
- **Sheathing**: Wall sheathing, roof decking
- **Concrete**: Foundation walls, slabs, footings (volume)
- **Steel**: Beams, columns, connectors, hold-downs
- **Fasteners**: Anchor bolts, joist hangers, hurricane ties

## Code Considerations
- IRC/IBC structural requirements
- Load path continuity
- Shear wall requirements
- Header sizing for openings
- Bearing wall identification

## Recommendations
Identify load-bearing walls, note large openings requiring special headers, flag potential structural concerns.
""",

    "finishes": """You are an expert finishes estimator analyzing architectural blueprints.

## Focus Areas
- **Flooring**: Tile, hardwood, carpet, vinyl, LVP by room (SF)
- **Wall Finishes**: Paint, tile, wainscoting, accent walls (SF)
- **Ceiling Finishes**: Drywall, texture, coffered, tray ceilings (SF)
- **Trim**: Baseboards, crown molding, casing, chair rail (LF)
- **Cabinets**: Kitchen cabinets (LF of base, wall, tall), bathroom vanities
- **Countertops**: Kitchen, bathroom, laundry (LF/SF)
- **Doors**: Interior doors by type and size
- **Hardware**: Door handles, hinges, cabinet pulls

## Code Considerations
- ADA accessibility for commercial projects
- Fire-rated assemblies where required
- Moisture-resistant materials in wet areas (cement board, moisture-rated drywall)
- Slip resistance for floor tiles in wet areas

## Recommendations
Suggest material quantities with waste factors, note areas requiring special treatment.
""",
}


async def run_trade_analysis(
    content_parts: list[types.Part],
    trade: str,
    spaces_summary: str,
    scale: str | None = None,
) -> TradeAnalysis:
    """Run a trade-specific deep-dive analysis.

    Args:
        content_parts: Blueprint image parts for Gemini
        trade: Trade name (electrical, plumbing, hvac, structural, finishes)
        spaces_summary: Text summary of detected spaces for context
        scale: Blueprint scale if known
    """
    system_instruction = TRADE_PROMPTS.get(trade)
    if not system_instruction:
        raise ValueError(f"Unknown trade: {trade}. Must be one of: {list(TRADE_PROMPTS.keys())}")

    prompt_parts = [
        f"Perform a detailed {trade} takeoff for this blueprint.",
        f"\nDetected spaces:\n{spaces_summary}",
    ]

    if scale:
        prompt_parts.append(f"\nScale: {scale}")
    else:
        prompt_parts.append("\nNo scale detected. Use standard construction dimensions.")

    prompt_parts.append(
        "\nProvide all items, practical recommendations, and relevant code references."
    )

    prompt = "\n".join(prompt_parts)

    response = await get_client().aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt, *content_parts],
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=get_schema(TradeAnalysis),
        ),
    )

    result = TradeAnalysis.model_validate_json(response.text)
    result.trade = trade
    return result
