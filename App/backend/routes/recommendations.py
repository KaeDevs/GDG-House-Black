"""GET /api/recommendations — Runs the rationalization engine and returns recommendations."""

from fastapi import APIRouter
from logic.optimizer import build_recommendations, load_schools, get_school_status

router = APIRouter()


@router.get("/recommendations")
async def get_recommendations():
    """
    Runs the greedy nearest-neighbor rationalization algorithm and returns:
    - Merge recommendations (zero-enrollment → nearest same-type school)
    - Redistribute recommendations (freed teacher → nearest understaffed school)

    Each recommendation includes:
    - type: 'merge' | 'redistribute'
    - source_school / target_school: full school objects
    - distance_km: haversine distance between the two schools
    - rte_compliant: whether the recommendation satisfies RTE Act distance limits
    - reasoning: human-readable explanation
    """
    recommendations = build_recommendations()

    # Compute summary counts for the frontend
    merge_count = sum(1 for r in recommendations if r["type"] == "merge")
    redistribute_count = sum(1 for r in recommendations if r["type"] == "redistribute")
    rte_compliant_count = sum(1 for r in recommendations if r["rte_compliant"])
    rte_non_compliant_count = sum(1 for r in recommendations if not r["rte_compliant"])

    return {
        "recommendations": recommendations,
        "summary": {
            "total": len(recommendations),
            "merge_count": merge_count,
            "redistribute_count": redistribute_count,
            "rte_compliant": rte_compliant_count,
            "rte_non_compliant": rte_non_compliant_count,
        },
    }
