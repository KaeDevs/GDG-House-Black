"""GET /api/recommendations — Runs the rationalization engine for a given district."""

from fastapi import APIRouter, Query
from typing import Optional
from logic.optimizer import build_recommendations, get_available_districts

router = APIRouter()


@router.get("/districts")
async def get_districts():
    """
    Returns the list of available districts/constituencies from the data file.
    Each entry includes: id, name, state, center (lat/lng for map pan), zoom level.
    """
    districts = get_available_districts()
    return {"districts": districts}


@router.get("/recommendations")
async def get_recommendations(district: Optional[str] = Query(None, description="Filter by district name")):
    """
    Runs the greedy nearest-neighbor rationalization algorithm for the given district
    and returns merge + redistribute recommendations.

    Query params:
      ?district=Chennai   → only Chennai recommendations
      (omitted)           → recommendations across all districts (not recommended for large data)

    Each recommendation includes:
    - type: 'merge' | 'redistribute'
    - source_school / target_school: full school objects
    - distance_km: haversine distance between the two schools
    - rte_compliant: whether the recommendation satisfies RTE Act distance limits
    - reasoning: human-readable explanation
    """
    recommendations = build_recommendations(district=district)

    merge_count         = sum(1 for r in recommendations if r["type"] == "merge")
    redistribute_count  = sum(1 for r in recommendations if r["type"] == "redistribute")
    rte_compliant_count = sum(1 for r in recommendations if r["rte_compliant"])
    rte_non_compliant   = sum(1 for r in recommendations if not r["rte_compliant"])

    return {
        "recommendations": recommendations,
        "district": district,
        "summary": {
            "total": len(recommendations),
            "merge_count": merge_count,
            "redistribute_count": redistribute_count,
            "rte_compliant": rte_compliant_count,
            "rte_non_compliant": rte_non_compliant,
        },
    }
