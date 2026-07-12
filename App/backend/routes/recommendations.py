"""GET /api/recommendations — Runs the rationalization engine for a given district."""

from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from logic.optimizer import build_recommendations, get_available_districts

router = APIRouter()


@router.get("/districts")
async def get_districts(db: AsyncSession = Depends(get_db)):
    """
    Returns the list of available districts/constituencies from the data file.
    Each entry includes: id, name, state, center (lat/lng for map pan), zoom level.
    """
    try:
        districts = await get_available_districts(db)
        return {"districts": districts}
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


@router.get("/recommendations")
async def get_recommendations(
    district: Optional[str] = Query(None, description="Filter by district name"),
    db: AsyncSession = Depends(get_db)
):
    """
    Runs the greedy nearest-neighbor rationalization algorithm for the given district
    and returns merge + redistribute recommendations.
    """
    try:
        recommendations = await build_recommendations(db, district=district)
        
        if not recommendations:
            return {
                "recommendations": [],
                "summary": "No recommendations available."
            }
    
        merge_count         = sum(1 for r in recommendations if r["type"] == "merge")
        redistribute_count  = sum(1 for r in recommendations if r["type"] == "redistribute")
        infrastructure_count= sum(1 for r in recommendations if r["type"] == "infrastructure")
        rte_compliant_count = sum(1 for r in recommendations if r.get("rte_compliant", True))
        rte_non_compliant   = sum(1 for r in recommendations if not r.get("rte_compliant", True))
    
        return {
            "recommendations": recommendations,
            "district": district,
            "summary": {
                "total": len(recommendations),
                "merge_count": merge_count,
                "redistribute_count": redistribute_count,
                "infrastructure_count": infrastructure_count,
                "rte_compliant": rte_compliant_count,
                "rte_non_compliant": rte_non_compliant,
            },
        }
    except Exception as e:
        import traceback
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"success": False, "message": str(e), "traceback": traceback.format_exc()})
